// Server-side helpers for the API routes: body parsing, IP hashing, Turnstile
// verification, and the trust aggregation (spec §4.3, §7).
import crypto from 'node:crypto';
import { aggregate, N_CONFIRM } from '../shared/aggregate.js';

// Sliding window for aggregation + TTL, and the "confirmed" threshold.
export const WINDOW_MIN = 45; // minutes — reports older than this expire
export { N_CONFIRM };

export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || '0.0.0.0';
}

// We never store a raw IP (spec §11). Hash with a server-only salt.
export function hashIp(ip) {
  const salt = process.env.IP_HASH_SALT || 'dhaw-dev-salt';
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

// Cloudflare Turnstile server verification (§7.6). If no secret is configured
// (local dev), we skip the check.
export async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const d = await r.json();
    return Boolean(d.success);
  } catch {
    return false;
  }
}

// Recalcule l'état agrégé d'une zone et met à jour cell_state.
// C'est LA logique de confiance ; le client ne la rejoue jamais.
//
// Règle centrale : **un appareil = une voix**. On ne garde que le DERNIER
// signalement de chaque appareil dans la fenêtre, pour deux raisons :
//   - quelqu'un qui revote parce que le courant est revenu doit REMPLACER son
//     avis précédent, pas s'ajouter à lui-même ;
//   - sinon une seule personne qui vote en boucle pèse plus lourd que plusieurs
//     voisins distincts, ce qui vide de son sens le seuil « N appareils
//     distincts » du §7.1.
export async function recomputeState(sql, zoneId) {
  const latest = await sql`
    select distinct on (device_id) device_id, state, created_at
    from votes
    where zone_id = ${zoneId}
      and created_at > now() - make_interval(mins => ${WINDOW_MIN})
    order by device_id, created_at desc
  `;

  if (latest.length === 0) {
    await sql`delete from cell_state where zone_id = ${zoneId}`;
    return null;
  }

  const nDown = latest.filter((v) => v.state === 'down').length;
  const nUp = latest.filter((v) => v.state === 'up').length;

  // Une seule et même règle que /api/states (shared/aggregate.js) : impossible
  // que l'état écrit ici diverge de celui qui est affiché.
  const agg = aggregate(nDown, nUp);
  const majority = agg.state;
  const confidence = agg.confidence;
  const distinct = agg.nDistinct;

  const lastTs = latest.reduce((m, v) => Math.max(m, new Date(v.created_at).getTime()), 0);
  const updated = new Date(lastTs).toISOString();
  const expires = new Date(lastTs + WINDOW_MIN * 60000).toISOString();

  const rows = await sql`
    insert into cell_state (zone_id, state, confidence, n_reports, n_distinct, updated_at, expires_at)
    values (${zoneId}, ${majority}, ${confidence}, ${latest.length}, ${distinct}, ${updated}, ${expires})
    on conflict (zone_id) do update set
      state = excluded.state,
      confidence = excluded.confidence,
      n_reports = excluded.n_reports,
      n_distinct = excluded.n_distinct,
      updated_at = excluded.updated_at,
      expires_at = excluded.expires_at
    returning zone_id, state, confidence, n_reports, n_distinct, updated_at, expires_at
  `;
  return rows[0];
}
