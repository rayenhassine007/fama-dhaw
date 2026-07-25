// POST /api/report — submit a citizen report.
//
// This is where the real security lives (spec §8): the zone is derived from the
// GPS server-side (never trusted from the client), Turnstile is verified, the
// IP is hashed, rate limits apply, and the aggregated state is recomputed.
import { sql } from './_db.js';
import { acceptableZones } from '../shared/zones.js';
import { readBody, getClientIp, hashIp, verifyTurnstile, recomputeState } from './_helpers.js';

// Précision au-delà de laquelle on refuse : même avec confirmation humaine, un
// point aussi vague ne prouve plus rien sur la zone.
const ACCURACY_HARD_MAX = 5000;

const DEVICE_COOLDOWN_MIN = 10; // 1 signalement / appareil / 10 min
// Plafond par IP : volontairement haut. Il n'est là que pour couper une
// inondation évidente, pas pour limiter les gens — voir le commentaire sur le
// CGNAT plus bas. La vraie protection contre le bourrage est ailleurs : un
// appareil = une voix dans recomputeState().
const IP_BURST_MAX = 40;

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
  if (accuracy && accuracy > ACCURACY_HARD_MAX)
    return res.status(400).json({ error: 'GPS trop imprécis pour signaler' });

  const ip = getClientIp(req);

  const human = await verifyTurnstile(turnstile_token, ip);
  if (!human) return res.status(403).json({ error: 'Vérification anti-bot échouée' });

  // La zone est décidée ICI, à partir du GPS — jamais sur la simple parole du
  // client (§8). Quand le point est flou, on tolère que l'utilisateur précise
  // laquelle de SES zones plausibles est la bonne : on ne retient son choix que
  // s'il tombe dans le rayon d'incertitude de son propre GPS. Impossible donc de
  // voter pour un quartier où l'on ne se trouve pas.
  const candidates = acceptableZones(lat, lng, accuracy);
  if (candidates.length === 0)
    return res.status(400).json({ error: 'Hors de la zone de couverture' });

  let zone = candidates[0];
  if (body.zone_id) {
    const picked = candidates.find((z) => z.id === body.zone_id);
    if (!picked)
      return res.status(400).json({ error: "Cette zone est trop loin de ta position." });
    zone = picked;
  }

  const ipHash = hashIp(ip);

  // Rate limit (§7.6). Les deux limites sont SÉPARÉES, et c'est important :
  //
  // La vraie limite est par APPAREIL. La limite par IP ne peut être qu'un
  // garde-fou anti-inondation très large, parce qu'en Tunisie une IP ne désigne
  // pas une personne : une famille ou un immeuble partagent la box, et surtout
  // les opérateurs mobiles sont en CGNAT, donc des milliers d'abonnés sortent
  // par la même adresse. Les fusionner (l'ancien « device OR ip ») bloquait le
  // deuxième téléphone d'un même foyer pendant 10 minutes.
  const sameDevice = await sql`
    select 1 from votes
    where device_id = ${device_id}
      and created_at > now() - make_interval(mins => ${DEVICE_COOLDOWN_MIN})
    limit 1
  `;
  if (sameDevice.length > 0)
    return res
      .status(429)
      .json({ error: 'Tu as déjà signalé récemment. Réessaie dans quelques minutes.' });

  const fromIp = await sql`
    select count(*)::int as n from votes
    where ip_hash = ${ipHash}
      and created_at > now() - make_interval(mins => ${DEVICE_COOLDOWN_MIN})
  `;
  if ((fromIp[0]?.n ?? 0) >= IP_BURST_MAX)
    return res
      .status(429)
      .json({ error: 'Trop de signalements depuis cette connexion. Réessaie dans quelques minutes.' });

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
