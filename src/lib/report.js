// Envoie un signalement citoyen (« y a du courant » / « coupé »).
//
// Règle critique (spec §8) : le client envoie le GPS BRUT. Il peut joindre un
// `zoneId` quand sa position est floue et qu'il a dû désambiguïser à la main,
// mais le serveur ne l'accepte que si cette zone tombe dans le rayon
// d'incertitude du GPS envoyé — il re-dérive toujours les candidates lui-même.
// Les boutons verrouillés côté client sont un confort ; le vrai verrou est là.

import { USE_API, apiPost } from './api.js';
import { devAddVote } from './devstore.js';
import { zoneForPoint, acceptableZones } from './zones.js';

// state: 'up' (y a du courant) | 'down' (coupé)
export async function submitReport({ state, lat, lng, accuracy, zoneId, deviceId, turnstileToken }) {
  if (!USE_API) {
    // Mode démo : on rejoue localement la même règle que le serveur.
    const candidates = acceptableZones(lat, lng, accuracy);
    const zone = zoneId ? candidates.find((z) => z.id === zoneId) : zoneForPoint(lat, lng);
    if (!zone) throw new Error('Cette zone est trop loin de ta position.');
    devAddVote({ zoneId: zone.id, state, deviceId });
    return { ok: true, zone_id: zone.id };
  }

  return apiPost('/api/report', {
    state,
    lat,
    lng,
    accuracy,
    zone_id: zoneId,
    device_id: deviceId,
    turnstile_token: turnstileToken,
  });
}
