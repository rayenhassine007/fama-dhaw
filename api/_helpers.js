// Server-side helpers for the API routes: body parsing, IP hashing, Turnstile
// verification, and the trust aggregation (spec §4.3, §7).
import crypto from 'node:crypto';

// Sliding window for aggregation + TTL, and the "confirmed" threshold.
export const WINDOW_MIN = 45; // minutes — reports older than this expire
export const N_CONFIRM = 3; // distinct devices needed to confirm a state (§7.1)

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

// Recompute a zone's aggregated state from fresh votes and upsert cell_state.
// This is the authoritative trust logic — the client never does this.
export async function recomputeState(sql, zoneId) {
  const votes = await sql`
    select state, device_id, created_at
    from votes
    where zone_id = ${zoneId}
      and created_at > now() - make_interval(mins => ${WINDOW_MIN})
  `;

  if (votes.length === 0) {
    await sql`delete from cell_state where zone_id = ${zoneId}`;
    return null;
  }

  const down = votes.filter((v) => v.state === 'down');
  const up = votes.filter((v) => v.state === 'up');
  const majority = down.length >= up.length ? 'down' : 'up';
  const winning = majority === 'down' ? down : up;
  const distinct = new Set(winning.map((v) => v.device_id)).size;

  // Unconfirmed until N distinct devices agree, then confidence scales up.
  const confidence = distinct >= N_CONFIRM ? Math.min(100, 50 + distinct * 12) : distinct * 15;

  const lastTs = votes.reduce((m, v) => Math.max(m, new Date(v.created_at).getTime()), 0);
  const updated = new Date(lastTs).toISOString();
  const expires = new Date(lastTs + WINDOW_MIN * 60000).toISOString();

  const rows = await sql`
    insert into cell_state (zone_id, state, confidence, n_reports, n_distinct, updated_at, expires_at)
    values (${zoneId}, ${majority}, ${confidence}, ${winning.length}, ${distinct}, ${updated}, ${expires})
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
