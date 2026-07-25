// Géolocalisation, calibrée pour de vrais téléphones (spec §5, assoupli après
// test terrain).
//
// L'ancienne approche — un seul getCurrentPosition() puis rejet de tout ce qui
// dépasse 1 km — échouait en pratique : sur Android comme sur iOS, le PREMIER
// point renvoyé est presque toujours l'estimation wifi/antenne (1–3 km), et la
// puce GPS n'affine qu'au bout de quelques secondes. Résultat : l'utilisateur
// accordait la permission et lisait quand même « position trop imprécise ».
//
// Donc maintenant : on SURVEILLE la position pendant quelques secondes et on
// garde le meilleur point. Et on ne rejette jamais sèchement — on renvoie ce
// qu'on a avec un niveau de qualité, et c'est l'interface qui demande à l'humain
// de confirmer quand c'est flou. Un humain qui confirme « oui, c'est mon
// quartier » est un meilleur signal qu'un refus froid.

// Seuils de précision (rayon en mètres).
export const ACCURACY_GOOD = 500; // on ancre directement, sans rien demander
export const ACCURACY_ASK = 2000; // on ancre mais on fait confirmer la zone
// Au-delà de ACCURACY_ASK : on renvoie quand même le point, marqué 'poor', et
// l'utilisateur choisit sa zone parmi les candidates plausibles.

const WATCH_MS = 12000; // durée max d'attente d'un meilleur point
const GOOD_ENOUGH = 120; // m — on arrête tout de suite, c'est un vrai point GPS

export class GeolocError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'GeolocError';
    this.code = code; // 'unsupported' | 'denied' | 'unavailable'
  }
}

function toResult(pos) {
  const accuracy = Math.round(pos.coords.accuracy ?? 99999);
  let quality = 'poor';
  if (accuracy <= ACCURACY_GOOD) quality = 'good';
  else if (accuracy <= ACCURACY_ASK) quality = 'ask';
  return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy, quality };
}

/**
 * Surveille la position quelques secondes et renvoie le MEILLEUR point obtenu.
 *
 * Ne rejette que dans trois cas : navigateur sans géoloc, permission refusée,
 * ou aucun point du tout. Une précision médiocre n'est PAS une erreur : elle
 * revient dans `quality` ('good' | 'ask' | 'poor') pour que l'appelant décide.
 *
 * @param {object}   [opts]
 * @param {function} [opts.onProgress] appelé à chaque amélioration du point
 * @param {number}   [opts.watchMs]    durée max de surveillance
 */
export function getBestPosition({ onProgress, watchMs = WATCH_MS } = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new GeolocError('unsupported', "Ce navigateur ne gère pas la géolocalisation."));
      return;
    }

    let best = null;
    let watchId = null;
    let timer = null;
    let settled = false;

    const stop = () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (timer !== null) clearTimeout(timer);
      watchId = null;
      timer = null;
    };

    const finish = () => {
      if (settled) return;
      settled = true;
      stop();
      if (!best) {
        reject(
          new GeolocError(
            'unavailable',
            "On n'arrive pas à te situer. Sors à découvert, ou choisis ta zone dans la liste."
          )
        );
        return;
      }
      resolve(toResult(best));
    };

    // Filet de sécurité : on rend la main au bout de watchMs quoi qu'il arrive.
    timer = setTimeout(finish, watchMs);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = pos.coords.accuracy ?? Infinity;
        if (!best || acc < (best.coords.accuracy ?? Infinity)) {
          best = pos;
          if (onProgress) onProgress(toResult(best));
        }
        // Dès qu'on a un vrai point GPS, pas la peine d'attendre la suite.
        if ((best.coords.accuracy ?? Infinity) <= GOOD_ENOUGH) finish();
      },
      (err) => {
        // Un watch peut émettre une erreur passagère (POSITION_UNAVAILABLE le
        // temps que la puce accroche) tout en délivrant un point ensuite. On
        // n'abandonne immédiatement que si l'utilisateur a dit non.
        if (err.code === 1 /* PERMISSION_DENIED */) {
          settled = true;
          stop();
          reject(
            new GeolocError('denied', 'Géolocalisation refusée. Choisis ta zone dans la liste.')
          );
          return;
        }
        // Sinon on laisse tourner : le timer finira par nous départager, avec le
        // meilleur point reçu entre-temps s'il y en a un.
      },
      {
        enableHighAccuracy: true, // force la puce GPS ; le réseau seul = 100 m–3 km
        timeout: watchMs,
        maximumAge: 0,
      }
    );
  });
}
