// Submits a citizen report ("y a du courant" / "coupé").
//
// Critical rule (spec §8): the client sends the RAW GPS, never the zone id.
// The server derives the zone from the GPS itself, so a user can only ever
// affect the zone they're physically standing in — the locked buttons are
// convenience; the server is the real lock.

import { USE_API, apiPost } from './api.js';
import { devAddVote } from './devstore.js';
import { zoneForPoint } from './zones.js';

// state: 'up' (y a du courant) | 'down' (coupé)
export async function submitReport({ state, lat, lng, accuracy, deviceId, turnstileToken }) {
  if (!USE_API) {
    // Demo fallback: derive zone locally and record in the simulation.
    const zone = zoneForPoint(lat, lng);
    if (!zone) throw new Error('Hors zone de couverture.');
    devAddVote({ zoneId: zone.id, state, deviceId });
    return { ok: true, zone_id: zone.id };
  }

  return apiPost('/api/report', {
    state,
    lat,
    lng,
    accuracy,
    device_id: deviceId,
    turnstile_token: turnstileToken,
  });
}
