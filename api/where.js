// GET /api/where — localisation approximative par IP, SANS aucune permission.
//
// Vercel ajoute la géoloc de l'IP sur chaque requête (en-têtes x-vercel-ip-*).
// C'est gratuit, instantané et invisible pour l'utilisateur : plus besoin de
// réclamer le GPS juste pour AFFICHER quelque chose.
//
// Précision réelle en Tunisie : gouvernorat au mieux. Les opérateurs mobiles
// (TT, Ooredoo, Orange) sont en CGNAT, donc l'IP pointe vers leur point de
// sortie — souvent Tunis — quel que soit l'endroit où se trouve la personne.
// Sur ligne fixe c'est meilleur, sans jamais atteindre le quartier (§12).
//
// D'où la règle : ce que renvoie cette route sert UNIQUEMENT à pré-remplir
// l'affichage. Ça ne donne jamais le droit de signaler — sinon n'importe qui
// pourrait voter pour n'importe quel quartier, ce qui est exactement la faille
// du concurrent (§2.2, §8). Le vote reste adossé au GPS, vérifié côté serveur.
import { zoneForPoint } from '../shared/zones.js';

function header(req, name) {
  const v = req.headers[name];
  if (!v) return null;
  const s = Array.isArray(v) ? v[0] : String(v);
  try {
    return decodeURIComponent(s); // Vercel encode les noms de ville
  } catch {
    return s;
  }
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');

  const country = header(req, 'x-vercel-ip-country');
  const city = header(req, 'x-vercel-ip-city');
  const lat = Number.parseFloat(header(req, 'x-vercel-ip-latitude'));
  const lng = Number.parseFloat(header(req, 'x-vercel-ip-longitude'));

  // En local (vercel dev) ou derrière un proxy qui mange les en-têtes.
  if (!Number.isFinite(lat) || !Number.isFinite(lng))
    return res.status(200).json({ ok: false, reason: 'no-ip-geo' });

  const zone = zoneForPoint(lat, lng);
  if (!zone) return res.status(200).json({ ok: false, reason: 'outside', country, city });

  return res.status(200).json({
    ok: true,
    zone_id: zone.id,
    gov: zone.gov,
    city,
    country,
    source: 'ip', // le client DOIT afficher que c'est approximatif
  });
}
