// GET /api/history?zone=<id>&hours=24 — l'historique d'une zone.
//
// Répond à « quand est-ce que j'avais du courant, et quand est-ce que j'étais
// coupé ». C'est le §6.2 de CLAUDE.md : une barre de type page de statut, une
// ligne par zone, segment par segment.
//
// La table `votes` n'est jamais purgée — seule la fenêtre glissante décide de ce
// qui compte pour l'état COURANT. On a donc déjà tout l'historique en base, sans
// avoir eu besoin de le prévoir.
//
// Chaque créneau est reconstitué exactement comme l'app l'aurait affiché à ce
// moment-là : on applique la même fenêtre de 45 min et la même règle
// d'agrégation. Un créneau sans signalement frais reste « inconnu » — on ne
// comble pas les trous, on ne sait simplement pas.
import { sql } from './_db.js';
import { WINDOW_MIN } from './_helpers.js';
import { aggregate } from '../shared/aggregate.js';
import { ZONES_BY_ID } from '../shared/zones.js';

const BUCKET_MIN = 15; // granularité d'un segment
const MAX_HOURS = 72;

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');

  const url = new URL(req.url, 'http://x');
  const zoneId = url.searchParams.get('zone');
  const hours = Math.min(MAX_HOURS, Math.max(1, Number(url.searchParams.get('hours')) || 24));

  if (!zoneId || !ZONES_BY_ID[zoneId])
    return res.status(400).json({ error: 'Zone inconnue' });
  // Même forme de réponse que le cas nominal : le client n'a pas à distinguer
  // « base non configurée » de « aucun signalement ».
  if (!sql)
    return res.status(200).json({ zone_id: zoneId, bucket_min: BUCKET_MIN, hours, points: [] });

  // On remonte d'une fenêtre de plus que demandé : le premier créneau a besoin
  // des signalements qui le précèdent pour être calculé comme les autres.
  const rows = await sql`
    select device_id, ip_hash, state, created_at
    from votes
    where zone_id = ${zoneId}
      and created_at > now() - make_interval(hours => ${hours}, mins => ${WINDOW_MIN})
    order by created_at asc
  `;

  const now = Date.now();
  const bucketMs = BUCKET_MIN * 60000;
  const windowMs = WINDOW_MIN * 60000;
  const start = Math.floor((now - hours * 3600000) / bucketMs) * bucketMs;

  const votes = rows.map((r) => ({
    device_id: r.device_id,
    ip_hash: r.ip_hash,
    state: r.state,
    ts: new Date(r.created_at).getTime(),
  }));

  const points = [];
  for (let t = start; t <= now; t += bucketMs) {
    // Dernier signalement de chaque appareil dans les 45 min précédant t.
    const seen = new Map();
    for (const v of votes) {
      if (v.ts > t || v.ts <= t - windowMs) continue;
      const prev = seen.get(v.device_id);
      if (!prev || v.ts > prev.ts) seen.set(v.device_id, v);
    }
    const latest = [...seen.values()];
    const side = (s) => {
      const rs = latest.filter((v) => v.state === s);
      return { devices: rs.length, ips: new Set(rs.map((v) => v.ip_hash)).size };
    };
    const agg = latest.length ? aggregate(side('down'), side('up')) : null;
    points.push({
      t: new Date(t).toISOString(),
      state: agg ? agg.state : 'unknown',
      n_down: agg ? agg.nDown : 0,
      n_up: agg ? agg.nUp : 0,
    });
  }

  return res.status(200).json({ zone_id: zoneId, bucket_min: BUCKET_MIN, hours, points });
}
