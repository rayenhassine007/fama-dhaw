// POST /api/report — submit a citizen report.
//
// This is where the real security lives (spec §8): the zone is derived from the
// GPS server-side (never trusted from the client), Turnstile is verified, the
// IP is hashed, rate limits apply, and the aggregated state is recomputed.
import { sql } from './_db.js';
import { zoneForPoint } from '../shared/zones.js';
import { readBody, getClientIp, hashIp, verifyTurnstile, recomputeState } from './_helpers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  if (!sql) return res.status(503).json({ error: 'Base de données non configurée' });

  const body = await readBody(req);
  const { state, lat, lng, accuracy, device_id, turnstile_token } = body;

  if (state !== 'up' && state !== 'down') return res.status(400).json({ error: 'État invalide' });
  if (typeof lat !== 'number' || typeof lng !== 'number')
    return res.status(400).json({ error: 'Position manquante' });
  if (!device_id || typeof device_id !== 'string')
    return res.status(400).json({ error: 'Appareil non identifié' });
  if (accuracy && accuracy > 1000) return res.status(400).json({ error: 'GPS trop imprécis' });

  const ip = getClientIp(req);

  const human = await verifyTurnstile(turnstile_token, ip);
  if (!human) return res.status(403).json({ error: 'Vérification anti-bot échouée' });

  // Zone is derived HERE, from the GPS — a user can only affect their own zone.
  const zone = zoneForPoint(lat, lng);
  if (!zone) return res.status(400).json({ error: 'Hors de la zone de couverture' });

  const ipHash = hashIp(ip);

  // Rate limit: 1 vote / 10 min per device OR per IP (§7.6).
  const recent = await sql`
    select 1 from votes
    where (device_id = ${device_id} or ip_hash = ${ipHash})
      and created_at > now() - interval '10 minutes'
    limit 1
  `;
  if (recent.length > 0)
    return res.status(429).json({ error: 'Déjà signalé récemment. Réessaie dans quelques minutes.' });

  // TODO(asn): look up the IP's ASN to (a) reject non-residential-TN ASNs (§7.2)
  // and (b) infer mobile-vs-fixed for the connection↔declaration cross-check.
  await sql`
    insert into votes (zone_id, state, device_id, ip_hash, gps_accuracy)
    values (${zone.id}, ${state}, ${device_id}, ${ipHash}, ${accuracy || null})
  `;
  await sql`insert into devices (device_id) values (${device_id}) on conflict (device_id) do nothing`;

  const st = await recomputeState(sql, zone.id);
  return res.status(200).json({ ok: true, zone_id: zone.id, state: st });
}
