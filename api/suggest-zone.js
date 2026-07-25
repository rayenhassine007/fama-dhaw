// POST /api/suggest-zone — a user proposes a zone that isn't in the list.
//
// Trolls will submit junk, so nothing here goes live: every suggestion is
// stored as 'pending' and only appears once a human approves it and it's
// promoted into shared/zones.js. This endpoint just queues it.
import { sql } from './_db.js';
import { readBody, getClientIp, hashIp, verifyTurnstile } from './_helpers.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  if (!sql) return res.status(503).json({ error: 'Base de données non configurée' });

  const body = await readBody(req);
  const { name, lat, lng, device_id, turnstile_token } = body;

  const cleanName = typeof name === 'string' ? name.trim() : '';
  if (cleanName.length < 2 || cleanName.length > 80)
    return res.status(400).json({ error: 'Nom de zone invalide' });
  if (typeof lat !== 'number' || typeof lng !== 'number')
    return res.status(400).json({ error: 'Position manquante' });

  const ip = getClientIp(req);
  const human = await verifyTurnstile(turnstile_token, ip);
  if (!human) return res.status(403).json({ error: 'Vérification anti-bot échouée' });

  const ipHash = hashIp(ip);

  // Rate limit: at most a few suggestions per device/IP per hour.
  const recent = await sql`
    select count(*)::int as n from pending_zones
    where (device_id = ${device_id || ''} or ip_hash = ${ipHash})
      and created_at > now() - interval '1 hour'
  `;
  if (recent[0]?.n >= 3)
    return res.status(429).json({ error: 'Trop de propositions. Réessaie plus tard.' });

  await sql`
    insert into pending_zones (name, lat, lng, device_id, ip_hash)
    values (${cleanName}, ${lat}, ${lng}, ${device_id || null}, ${ipHash})
  `;

  // Always "pending" — never shown live.
  return res.status(200).json({ ok: true, status: 'pending' });
}
