// Onglet « Carte » — la Tunisie, une pastille colorée par zone.
//
// Rendu en SVG pur, sans fond de carte ni librairie : la carte doit s'afficher
// pendant une coupure, quand le réseau est saturé (§2.5). Aucune tuile à
// télécharger, aucune clé de service, ~3 ko de contour embarqué.
//
// Pourquoi des pastilles et pas des zones remplies : on ne connaît QUE le centre
// approximatif de chaque zone, pas ses frontières. Remplir la carte de polygones
// dessinerait des limites inventées — on a vu ce que ça donne avec Oudhref et
// Métouia, dont la frontière calculée tombe en plein milieu de la ville. Une
// pastille ne prétend rien d'autre que « par ici ».

import { ZONES } from '../data/zones.js';
import { TUNISIA_RINGS } from '../data/tunisia.js';
import { escapeHtml, timeAgo } from '../lib/ui.js';
import { fetchHistory, renderHistoryBar } from '../lib/history.js';

// Cadrage géographique, avec une marge autour du pays.
const BBOX = { minLng: 7.3, maxLng: 11.8, minLat: 30.0, maxLat: 37.6 };
const W = 1000; // unités du viewBox ; le SVG s'étire ensuite en CSS
const H = Math.round(
  (W * (BBOX.maxLat - BBOX.minLat)) /
    ((BBOX.maxLng - BBOX.minLng) * Math.cos((33.9 * Math.PI) / 180))
);

const MIN_SCALE = 1;
const MAX_SCALE = 14;
// Au-delà de ce zoom, les noms de zones apparaissent : en dessous ils se
// chevaucheraient et rendraient la carte illisible.
const LABEL_SCALE = 3.2;

// Projection équirectangulaire, corrigée en longitude. Suffisant à l'échelle
// d'un pays, et c'est déjà l'approximation utilisée pour les distances.
function project(lat, lng) {
  const x = ((lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * W;
  const y = ((BBOX.maxLat - lat) / (BBOX.maxLat - BBOX.minLat)) * H;
  return [x, y];
}

let root = null;
let states = {};
let myZoneId = null;
let selectedId = null;
let view = { scale: 1, x: 0, y: 0 }; // translation en unités viewBox
let home = { scale: 1, x: 0, y: 0 }; // vue initiale, et cible du bouton recadrer
let gesture = null;

// Cadre une boîte géographique au centre du viewBox.
function frame(minLat, maxLat, minLng, maxLng, maxScale = MAX_SCALE) {
  const [x1, y1] = project(maxLat, minLng);
  const [x2, y2] = project(minLat, maxLng);
  const w = Math.max(1, x2 - x1);
  const h = Math.max(1, y2 - y1);
  const scale = Math.max(MIN_SCALE, Math.min(maxScale, Math.min(W / w, H / h)));
  return {
    scale,
    x: -x1 * scale + (W - w * scale) / 2,
    y: -y1 * scale + (H - h * scale) / 2,
  };
}

// Vue de départ. Le contour complet du pays reste dessiné — on peut dézoomer
// pour le voir en entier — mais on ne DÉMARRE pas sur la pointe saharienne, qui
// ne contient que deux zones sur 376 et occupe un quart de la hauteur.
function computeHome() {
  const mine = myZoneId && ZONES.find((z) => z.id === myZoneId);
  if (mine) {
    // Si on connaît sa zone, on démarre dessus : c'est ce qui l'intéresse en
    // premier (§10), et à ce niveau de zoom les noms voisins sont lisibles.
    const d = 0.35; // degrés autour du point, ~35 km
    return frame(mine.lat - d, mine.lat + d, mine.lng - d, mine.lng + d, 6);
  }
  const lats = ZONES.map((z) => z.lat);
  const lngs = ZONES.map((z) => z.lng);
  const m = 0.25;
  return frame(
    Math.min(...lats) - m,
    Math.max(...lats) + m,
    Math.min(...lngs) - m,
    Math.max(...lngs) + m
  );
}

export function renderMap(container, { states: st, myZoneId: mine } = {}) {
  root = container;
  states = st || {};
  myZoneId = mine || null;

  root.innerHTML = `
    <div class="map-legend">
      <span class="lg"><i class="lg-dot down"></i>Coupé</span>
      <span class="lg"><i class="lg-dot up"></i>Y a du courant</span>
      <span class="lg"><i class="lg-dot mixed"></i>Par endroits</span>
      <span class="lg"><i class="lg-dot unknown"></i>Pas d'info</span>
    </div>

    <div class="map-wrap">
      <svg id="map-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet"
           role="img" aria-label="Carte des coupures en Tunisie">
        <g id="map-g"></g>
      </svg>
      <div class="map-zoom">
        <button class="map-zbtn" data-zoom="in"  aria-label="Zoomer">+</button>
        <button class="map-zbtn" data-zoom="out" aria-label="Dézoomer">−</button>
        <button class="map-zbtn" data-zoom="reset" aria-label="Recadrer">⟲</button>
      </div>
      <div class="map-hint" id="map-hint">Pince ou double-tape pour zoomer · les noms apparaissent en zoomant</div>
    </div>

    <div id="map-info" class="map-info"></div>
  `;

  drawShapes();
  home = computeHome();
  view = { ...home };
  clamp();
  applyView();
  bindGestures();
  drawInfo();
}

// Met à jour les couleurs sans rejouer le zoom ni la position (appelé par le
// polling toutes les 20 s — recadrer la carte sous les doigts serait pénible).
export function updateMapStates(st, mine) {
  states = st || {};
  if (mine !== undefined) myZoneId = mine;
  if (!root || !root.querySelector('#map-g')) return;
  for (const z of ZONES) {
    const el = root.querySelector(`[data-zone="${z.id}"]`);
    if (el) el.setAttribute('class', `zdot ${cls(z.id)}${z.id === myZoneId ? ' mine' : ''}`);
  }
  drawInfo();
}

function cls(zoneId) {
  const s = states[zoneId];
  return s ? s.state : 'unknown';
}

function drawShapes() {
  const g = root.querySelector('#map-g');

  const paths = TUNISIA_RINGS.map((ring) => {
    const d = ring.map(([lng, lat], i) => (i ? 'L' : 'M') + project(lat, lng).map((n) => n.toFixed(1)).join(' ')).join(' ') + ' Z';
    return `<path class="map-land" d="${d}" />`;
  }).join('');

  // Les zones les plus « chaudes » sont dessinées en dernier pour rester
  // visibles au-dessus des voisines dans les secteurs denses.
  const order = { unknown: 0, up: 1, mixed: 2, down: 3 };
  const sorted = [...ZONES].sort((a, b) => (order[cls(a.id)] ?? 0) - (order[cls(b.id)] ?? 0));

  const dots = sorted
    .map((z) => {
      const [x, y] = project(z.lat, z.lng);
      const mine = z.id === myZoneId ? ' mine' : '';
      return `<g class="zg" data-zone-g="${z.id}">
          <circle class="zdot ${cls(z.id)}${mine}" data-zone="${z.id}"
                  cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" />
          <text class="zlabel" x="${x.toFixed(1)}" y="${y.toFixed(1)}">${escapeHtml(z.name)}</text>
        </g>`;
    })
    .join('');

  g.innerHTML = paths + dots;
}

// Unités du viewBox par pixel écran. Sans ce facteur, une taille exprimée en
// unités viewBox donne n'importe quoi à l'écran : le SVG fait 1000 unités de
// large pour ~330 px réels, donc un texte de 11 unités s'affiche à 3 px.
let unitsPerPx = 1;

function measure() {
  const svg = root && root.querySelector('#map-svg');
  if (!svg) return;
  const r = svg.getBoundingClientRect();
  if (r.width && r.height) unitsPerPx = 1 / Math.min(r.width / W, r.height / H);
}

function applyView() {
  const g = root.querySelector('#map-g');
  if (!g) return;
  measure();
  g.setAttribute('transform', `translate(${view.x} ${view.y}) scale(${view.scale})`);
  // Pastilles et textes gardent une taille constante à l'écran : on annule à la
  // fois le zoom du groupe (1/scale) et le facteur viewBox→écran.
  g.style.setProperty('--k', String(unitsPerPx / view.scale));
  root.querySelector('.map-wrap').classList.toggle('show-labels', view.scale >= LABEL_SCALE);
  const hint = root.querySelector('#map-hint');
  if (hint) hint.style.opacity = view.scale > 1.2 ? '0' : '';
}

function clamp() {
  view.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.scale));
  // On empêche de faire sortir complètement le pays de l'écran.
  const maxX = W * (view.scale - 1);
  const maxY = H * (view.scale - 1);
  view.x = Math.min(0, Math.max(-maxX, view.x));
  view.y = Math.min(0, Math.max(-maxY, view.y));
}

// Zoome en gardant le point (px, py), exprimé en unités viewBox, sous le doigt.
function zoomAt(factor, px, py) {
  const before = view.scale;
  view.scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.scale * factor));
  const k = view.scale / before;
  view.x = px - (px - view.x) * k;
  view.y = py - (py - view.y) * k;
  clamp();
  applyView();
}

// Coordonnées d'un événement, converties en unités du viewBox.
function toViewBox(e) {
  const svg = root.querySelector('#map-svg');
  const r = svg.getBoundingClientRect();
  // preserveAspectRatio="meet" : le contenu est centré, avec des marges.
  const s = Math.min(r.width / W, r.height / H);
  const offX = (r.width - W * s) / 2;
  const offY = (r.height - H * s) / 2;
  return [(e.clientX - r.left - offX) / s, (e.clientY - r.top - offY) / s];
}

function bindGestures() {
  const wrap = root.querySelector('.map-wrap');
  const svg = root.querySelector('#map-svg');

  root.querySelectorAll('[data-zoom]').forEach((b) =>
    b.addEventListener('click', () => {
      const k = b.dataset.zoom;
      if (k === 'reset') {
        view = { ...home };
        clamp();
        applyView();
      } else zoomAt(k === 'in' ? 1.6 : 1 / 1.6, W / 2, H / 2);
    })
  );

  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const [px, py] = toViewBox(e);
    zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, px, py);
  }, { passive: false });

  // Un seul gestionnaire pour glisser (1 doigt) et pincer (2 doigts).
  const pts = new Map();
  let start = null;

  svg.addEventListener('pointerdown', (e) => {
    svg.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, e);
    if (pts.size === 1) {
      const [px, py] = toViewBox(e);
      start = { px, py, vx: view.x, vy: view.y, moved: false, t: Date.now() };
    } else if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      gesture = { dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), scale: view.scale };
    }
  });

  svg.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, e);

    if (pts.size === 2 && gesture) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const mid = { clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 };
      const [px, py] = toViewBox(mid);
      const target = gesture.scale * (d / gesture.dist);
      zoomAt(target / view.scale, px, py);
      return;
    }

    if (pts.size === 1 && start) {
      const [px, py] = toViewBox(e);
      const dx = px - start.px;
      const dy = py - start.py;
      if (Math.abs(dx) + Math.abs(dy) > 4 * unitsPerPx) start.moved = true;
      // La carte doit suivre le doigt exactement. `dx` est déjà exprimé dans le
      // repère parent (celui de la translation), donc on l'ajoute tel quel :
      // le multiplier par l'échelle rendait le déplacement `scale` fois trop
      // rapide — insupportable dès qu'on avait zoomé.
      view.x = start.vx + dx;
      view.y = start.vy + dy;
      clamp();
      applyView();
    }
  });

  const end = (e) => {
    pts.delete(e.pointerId);
    if (pts.size < 2) gesture = null;
    if (pts.size === 0 && start && !start.moved) selectAt(e);
    if (pts.size === 0) start = null;
  };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);

  svg.addEventListener('dblclick', (e) => {
    e.preventDefault();
    const [px, py] = toViewBox(e);
    zoomAt(1.9, px, py);
  });

  wrap.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Sélectionne la zone la plus proche du tap, dans un rayon raisonnable —
// viser une pastille de 6 px au doigt serait impossible autrement.
function selectAt(e) {
  const [px, py] = toViewBox(e);
  const mx = (px - view.x) / view.scale;
  const my = (py - view.y) / view.scale;

  let best = null;
  let bestD = Infinity;
  for (const z of ZONES) {
    const [x, y] = project(z.lat, z.lng);
    const d = (x - mx) ** 2 + (y - my) ** 2;
    if (d < bestD) {
      bestD = d;
      best = z;
    }
  }
  const tol = (22 * unitsPerPx) / view.scale; // ~22 px à l'écran, quel que soit le zoom
  selectedId = best && Math.sqrt(bestD) <= tol ? best.id : null;

  root.querySelectorAll('.zdot.sel').forEach((el) => el.classList.remove('sel'));
  if (selectedId) {
    const el = root.querySelector(`[data-zone="${selectedId}"]`);
    if (el) el.classList.add('sel');
  }
  drawInfo();
}

function drawInfo() {
  const box = root && root.querySelector('#map-info');
  if (!box) return;

  if (!selectedId) {
    const n = { down: 0, up: 0, mixed: 0 };
    for (const z of ZONES) {
      const s = states[z.id];
      if (s && n[s.state] !== undefined) n[s.state]++;
    }
    const connues = n.down + n.up + n.mixed;
    box.innerHTML = `<div class="map-summary">
        ${
          connues === 0
            ? `Aucun signalement frais pour l'instant. Tape une zone pour la consulter.`
            : `<strong>${n.down}</strong> zone${n.down > 1 ? 's' : ''} coupée${n.down > 1 ? 's' : ''} ·
               <strong>${n.mixed}</strong> par endroits ·
               <strong>${n.up}</strong> avec courant ·
               ${ZONES.length - connues} sans info`
        }
      </div>`;
    return;
  }

  const z = ZONES.find((x) => x.id === selectedId);
  const s = states[selectedId];
  const label = !s
    ? 'Pas d’info'
    : s.state === 'down'
      ? 'Pas de lumière'
      : s.state === 'mixed'
        ? 'Coupé par endroits'
        : 'Y a du courant';

  box.innerHTML = `
    <div class="map-card ${s ? `state-${s.state}` : 'state-unknown'}">
      <div class="map-card-top">
        <span class="map-card-name">${escapeHtml(z.name)}</span>
        <span class="map-card-gov">${escapeHtml(z.gov)}</span>
      </div>
      <div class="map-card-state">${label}</div>
      ${
        s
          ? `<div class="map-card-meta">🔌 ${s.n_down} · 💡 ${s.n_up} · ${timeAgo(s.updated_at)} ·
               ${s.confirmed ? 'confirmé' : 'non confirmé'} · confiance ${s.confidence}%</div>`
          : `<div class="map-card-meta">Personne n'a signalé cette zone récemment.</div>`
      }
      <div class="hist-block" data-hist-for="${z.id}">
        <button class="btn-hist" data-hist="${z.id}">🕒 Voir l'historique (24 h)</button>
      </div>
    </div>`;

  const btn = box.querySelector('[data-hist]');
  if (btn) btn.addEventListener('click', () => loadHistory(z.id));
}

// Historique de la zone sélectionnée, chargé à la demande et gardé en mémoire.
const histCache = new Map();

async function loadHistory(zoneId) {
  const box = root && root.querySelector(`[data-hist-for="${zoneId}"]`);
  if (!box) return;
  if (histCache.has(zoneId)) {
    box.innerHTML = renderHistoryBar(histCache.get(zoneId));
    return;
  }
  box.innerHTML = `<div class="hist-empty">Chargement de l'historique…</div>`;
  const data = await fetchHistory(zoneId, 24);
  histCache.set(zoneId, data);
  const still = root && root.querySelector(`[data-hist-for="${zoneId}"]`);
  if (still) still.innerHTML = renderHistoryBar(data);
}
