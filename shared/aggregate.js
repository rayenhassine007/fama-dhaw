// LA règle d'agrégation, à un seul endroit.
//
// Elle vivait en double (serveur + simulation locale) et, pire, l'état affiché
// venait d'un cache écrit au moment du vote pendant que les compteurs, eux,
// étaient recalculés en direct. Les deux pouvaient donc se contredire à
// l'écran. Tout ce qui s'affiche dérive maintenant de cette fonction.

export const N_CONFIRM = 3; // voix distinctes d'accord pour « confirmé » (§7.1)

// Combien de voix une même connexion peut-elle porter, au maximum.
//
// C'est la parade au cas signalé en test : le device_id vit dans localStorage,
// et la navigation privée en a un stock vierge — un seul téléphone fabrique donc
// autant d'« appareils distincts » qu'il ouvre d'onglets.
//
// On ne peut pas pour autant exiger des IP toutes distinctes : une famille
// partage la box, et les opérateurs mobiles tunisiens sont en CGNAT, donc des
// milliers d'abonnés sortent par la même adresse. Exiger l'unicité reviendrait à
// faire taire presque tout le monde.
//
// Le compromis : une connexion vaut au plus deux voix. Un couple sur la même box
// compte pleinement, une personne avec cinq onglets ne dépasse pas deux — et
// SURTOUT, une seule connexion ne peut jamais atteindre le seuil de confirmation.
// Il faut au moins deux connexions différentes pour qu'une zone soit confirmée,
// ce qui distingue au passage « mon disjoncteur a sauté » de « le quartier est
// coupé ».
export const MAX_VOICES_PER_IP = 2;

// Voix réellement comptées pour un camp : bornées par le nombre de connexions.
function voices(devices, ips) {
  const d = Math.max(0, devices | 0);
  const i = Math.max(0, ips | 0);
  if (d === 0) return 0;
  // Si le nombre d'IP n'est pas connu (simulation sans réseau), on ne borne pas.
  if (i === 0) return d;
  return Math.min(d, i * MAX_VOICES_PER_IP);
}

/**
 * @param {{devices:number, ips:number}} down signalements « coupé »
 * @param {{devices:number, ips:number}} up   signalements « y a du courant »
 * @returns {{state:'down'|'up'|'mixed', confidence:number, nDown:number,
 *            nUp:number, nDistinct:number, confirmed:boolean}|null}
 */
export function aggregate(down, up) {
  const nDown = voices(down?.devices ?? 0, down?.ips ?? 0);
  const nUp = voices(up?.devices ?? 0, up?.ips ?? 0);
  if (nDown <= 0 && nUp <= 0) return null;

  // Autant de voix de chaque côté : on n'élit PAS de vainqueur. Pendant un
  // délestage, la coupure ne touche souvent qu'une partie de la zone — deux
  // voisins peuvent honnêtement ne pas vivre la même chose. Trancher donnerait
  // tort à la moitié des gens qui ont signalé (§2.3).
  if (nDown === nUp) {
    return {
      state: 'mixed',
      confidence: Math.min(100, (nDown + nUp) * 12),
      nDown,
      nUp,
      nDistinct: nDown + nUp,
      confirmed: nDown >= N_CONFIRM && nUp >= N_CONFIRM,
    };
  }

  const state = nDown > nUp ? 'down' : 'up';
  const win = state === 'down' ? nDown : nUp;
  const lose = state === 'down' ? nUp : nDown;

  // Confirmé seulement si N voix distinctes sont d'accord ET majoritaires.
  const confirmed = win >= N_CONFIRM && win > lose;
  return {
    state,
    confidence: confirmed
      ? Math.min(100, 50 + win * 12 - lose * 8)
      : Math.max(0, win * 15 - lose * 7),
    nDown,
    nUp,
    nDistinct: win,
    confirmed,
  };
}
