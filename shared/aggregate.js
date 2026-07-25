// LA règle d'agrégation, à un seul endroit.
//
// Elle vivait en double (serveur + simulation locale) et, pire, l'état affiché
// venait d'un cache écrit au moment du vote pendant que les compteurs, eux,
// étaient recalculés en direct. Les deux pouvaient donc se contredire à
// l'écran : « 2 pour / 2 contre » affiché à côté de « Pas de lumière », parce
// que l'état avait été figé avant que le 4e signalement arrive.
//
// Tout ce qui s'affiche dérive maintenant de cette fonction, appelée avec des
// décomptes fraîchement lus. Un seul endroit à corriger, aucune divergence
// possible.

export const N_CONFIRM = 3; // appareils distincts d'accord pour « confirmé » (§7.1)

/**
 * @param {number} nDown appareils distincts signalant une coupure
 * @param {number} nUp   appareils distincts signalant du courant
 * @returns {{state:'down'|'up'|'mixed', confidence:number, nDistinct:number,
 *            confirmed:boolean}|null} null si aucun signalement frais
 */
export function aggregate(nDown, nUp) {
  if (nDown <= 0 && nUp <= 0) return null;

  // Autant d'appareils de chaque côté : on n'élit PAS de vainqueur. Pendant un
  // délestage, la coupure ne touche souvent qu'une partie de la zone — deux
  // voisins peuvent honnêtement ne pas vivre la même chose. Trancher donnerait
  // tort à la moitié des gens qui ont signalé (§2.3).
  if (nDown === nUp) {
    return {
      state: 'mixed',
      // Ici la confiance porte sur le constat de coupure partielle lui-même :
      // plus il y a d'appareils des DEUX côtés, plus il est solide.
      confidence: Math.min(100, (nDown + nUp) * 12),
      nDistinct: nDown + nUp,
      confirmed: nDown >= N_CONFIRM && nUp >= N_CONFIRM,
    };
  }

  const state = nDown > nUp ? 'down' : 'up';
  const win = state === 'down' ? nDown : nUp;
  const lose = state === 'down' ? nUp : nDown;

  // Confirmé seulement si N appareils distincts sont d'accord ET majoritaires.
  // Les avis contraires font baisser la confiance.
  const confirmed = win >= N_CONFIRM && win > lose;
  return {
    state,
    confidence: confirmed
      ? Math.min(100, 50 + win * 12 - lose * 8)
      : Math.max(0, win * 15 - lose * 7),
    nDistinct: win,
    confirmed,
  };
}
