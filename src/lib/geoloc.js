// Geolocation with a strict accuracy filter (spec §5).
//
// We only need ONE good reading to anchor the user to a zone, so we can afford
// to be picky and throw away imprecise fixes rather than place someone in the
// wrong zone.
//
// IMPORTANT: never call this on page load — always after an explicit tap, with
// an explanation shown first, or the refusal rate explodes.

// Accuracy radius (metres) above which we refuse the reading and fall back to
// manual zone selection. With fixed named zones, a fix looser than this can
// easily land in the wrong délégation.
export const ACCURACY_MAX_METERS = 1000;

export class GeolocError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'GeolocError';
    this.code = code; // 'unsupported' | 'denied' | 'unavailable' | 'timeout' | 'imprecise'
  }
}

export function getPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new GeolocError('unsupported', "Ce navigateur ne gère pas la géolocalisation."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        if (accuracy > ACCURACY_MAX_METERS) {
          reject(
            new GeolocError(
              'imprecise',
              `Position trop imprécise (± ${Math.round(accuracy)} m). Choisis ta zone sur la carte.`
            )
          );
          return;
        }

        resolve({ lat: latitude, lng: longitude, accuracy: Math.round(accuracy) });
      },
      (err) => {
        // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        if (err.code === 1) {
          reject(new GeolocError('denied', 'Géolocalisation refusée. Choisis ta zone manuellement.'));
        } else if (err.code === 3) {
          reject(new GeolocError('timeout', 'Le GPS a mis trop de temps. Réessaie ou choisis ta zone.'));
        } else {
          reject(new GeolocError('unavailable', 'Position indisponible. Choisis ta zone manuellement.'));
        }
      },
      {
        enableHighAccuracy: true, // force the GPS chip; network location is 100 m–3 km, unusable
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}
