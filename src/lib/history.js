// Historique d'une zone : « quand avais-je du courant, quand étais-je coupé ».
//
// Le serveur reconstitue chaque créneau avec la même règle que l'état courant
// (shared/aggregate.js), donc la barre montre exactement ce que l'app aurait
// affiché à ce moment-là. En mode démo, on rejoue le même calcul localement sur
// les votes du navigateur.

import { USE_API, apiGet } from './api.js';
import { devZoneHistory } from './devstore.js';

export async function fetchHistory(zoneId, hours = 24) {
  if (!USE_API) return devZoneHistory(zoneId, hours);
  try {
    return await apiGet(`/api/history?zone=${encodeURIComponent(zoneId)}&hours=${hours}`);
  } catch (e) {
    console.warn('fetchHistory', e.message);
    return null;
  }
}

const LABEL = {
  down: 'Pas de lumière',
  up: 'Y a du courant',
  mixed: 'Coupé par endroits',
  unknown: "Pas d'info",
};

function hhmm(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Barre de type page de statut : un segment par créneau, coloré par état.
export function renderHistoryBar(data) {
  if (!data || !data.points || data.points.length === 0) {
    return `<div class="hist-empty">Pas encore d'historique pour cette zone.</div>`;
  }

  const pts = data.points;
  const segs = pts
    .map(
      (p) =>
        `<i class="hseg ${p.state}" title="${hhmm(p.t)} — ${LABEL[p.state]}${
          p.state === 'unknown' ? '' : ` (${p.n_down}/${p.n_up})`
        }"></i>`
    )
    .join('');

  // Combien de temps passé dans chaque état, en ne comptant que les créneaux
  // où l'on sait quelque chose — sinon on annoncerait « 0 % de coupure » pour
  // une zone dont personne n'a jamais parlé.
  const known = pts.filter((p) => p.state !== 'unknown');
  const nDown = known.filter((p) => p.state === 'down').length;
  const nMixed = known.filter((p) => p.state === 'mixed').length;
  const mins = (n) => n * (data.bucket_min || 15);
  const dur = (n) => {
    const m = mins(n);
    return m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) : ''}` : `${m} min`;
  };

  const resume =
    known.length === 0
      ? `Aucun signalement sur cette période.`
      : `Sur les ${data.hours || 24} h : <strong>${dur(nDown)}</strong> sans lumière` +
        (nMixed ? `, <strong>${dur(nMixed)}</strong> par endroits` : '') +
        ` · ${Math.round((known.length / pts.length) * 100)} % de la période documentée`;

  return `
    <div class="hist">
      <div class="hist-bar">${segs}</div>
      <div class="hist-axis">
        <span>${hhmm(pts[0].t)}</span>
        <span>maintenant</span>
      </div>
      <div class="hist-note">${resume}</div>
    </div>`;
}
