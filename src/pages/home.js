// Écran unique : « Ma zone » épinglée en haut, puis TOUTES les zones du pays
// groupées par gouvernorat (spec §3, §10).
//
// Choix d'interface : on reprend l'UX familière du concurrent — la liste
// nationale complète, visible d'un coup, sans avoir à chercher. La recherche
// reste là pour filtrer. Taper une zone la déplie.
//
// Le verrou reste entier : les boutons de signalement n'apparaissent que dans SA
// PROPRE zone GPS. Les autres zones sont consultables, jamais votables (§8).

import { getBestPosition, GeolocError } from '../lib/geoloc.js';
import { zoneForPoint, zonesNear, candidateRadiusKm, distanceKm } from '../lib/zones.js';
import { ZONES } from '../data/zones.js';
import { getDeviceId } from '../lib/device.js';
import { fetchAllStates, subscribeStates } from '../lib/cellstate.js';
import { submitReport } from '../lib/report.js';
import { submitZoneSuggestion } from '../lib/suggestZone.js';
import { getTurnstileToken } from '../lib/turnstile.js';
import { showToast, timeAgo, escapeHtml, normalizeText } from '../lib/ui.js';

const ANCHOR_KEY = 'dhaw_anchor';
const LASTVOTE_KEY = 'dhaw_last_vote';
const POSITION_FRESH_MS = 20 * 60 * 1000; // on re-localise avant de voter si plus vieux
const VOTE_COOLDOWN_MS = 10 * 60 * 1000; // 1 vote / appareil / 10 min (§7.6)
const MAX_CANDIDATES = 12; // zones proposées quand le GPS est flou

// Gouvernorats dans l'ordre où ils apparaissent dans ZONES (déjà groupé).
const GOVS = [...new Set(ZONES.map((z) => z.gov))];

let root = null;
let states = {}; // zoneId -> état agrégé
let anchor = null; // { mode, zoneId, lat, lng, accuracy, ts }
let query = '';
let expandedId = null;
let pendingFix = null; // point GPS flou en attente de confirmation humaine
let unsubscribe = null;

// --- Persistance légère ---------------------------------------------------

function loadAnchor() {
  try {
    return JSON.parse(localStorage.getItem(ANCHOR_KEY) || 'null');
  } catch {
    return null;
  }
}
function saveAnchor(a) {
  anchor = a;
  try {
    if (a) localStorage.setItem(ANCHOR_KEY, JSON.stringify(a));
    else localStorage.removeItem(ANCHOR_KEY);
  } catch {
    /* ignore */
  }
}
function lastVoteAt() {
  return Number(localStorage.getItem(LASTVOTE_KEY) || 0);
}
function cooldownLeft() {
  return Math.max(0, VOTE_COOLDOWN_MS - (Date.now() - lastVoteAt()));
}

// --- Entrée ---------------------------------------------------------------

export function renderHome(container) {
  root = container;
  anchor = loadAnchor();

  root.innerHTML = `
    <div id="my-zone"></div>

    <div class="zone-search">
      <input id="zone-q" class="zone-search-input" type="search"
             placeholder="🔍 Cherche ta zone..." autocomplete="off" />
    </div>

    <div id="zone-list" class="zone-list"></div>

    <p class="help-text" style="margin-top:18px">
      <a href="#" id="add-zone" class="link">➕ Ta zone n'est pas dans la liste ? Ajoute-la</a>
    </p>
  `;

  const input = root.querySelector('#zone-q');
  input.addEventListener('input', () => {
    query = input.value;
    drawList();
  });

  root.querySelector('#add-zone').addEventListener('click', (e) => {
    e.preventDefault();
    startAddZone();
  });

  // Une seule délégation d'événements pour ~375 lignes.
  root.querySelector('#zone-list').addEventListener('click', onListClick);
  root.querySelector('#my-zone').addEventListener('click', onMyZoneClick);

  drawMyZone();
  drawList();

  refreshStates();
  if (unsubscribe) unsubscribe();
  unsubscribe = subscribeStates(refreshStates);
}

async function refreshStates() {
  try {
    states = (await fetchAllStates()) || {};
  } catch {
    states = states || {};
  }
  drawMyZone();
  drawList();
}

// --- Bloc « Ma zone » (épinglé en haut) -----------------------------------

function drawMyZone() {
  const box = root.querySelector('#my-zone');
  if (!box) return;

  // Un point GPS flou attend l'arbitrage de l'humain : on ne devine pas.
  if (pendingFix) {
    box.innerHTML = renderConfirmFix(pendingFix);
    return;
  }

  if (!anchor) {
    box.innerHTML = `
      <div class="status-card state-unknown">
        <div class="big-status">Ma zone</div>
        <div class="status-sub">
          On utilise ta position <strong>juste pour trouver ta zone</strong>. Rien de personnel
          n'est stocké. Tu pourras signaler seulement pour ta zone.
        </div>
        <button class="btn btn-primary" id="locate" style="margin-top:16px">📍 Trouver ma zone</button>
        <div id="locate-err"></div>
      </div>
      <p class="help-text">Ou fais défiler : toutes les zones du pays sont en dessous.</p>
    `;
    return;
  }

  const zone = ZONES.find((z) => z.id === anchor.zoneId);
  if (!zone) {
    saveAnchor(null);
    drawMyZone();
    return;
  }

  const st = states[zone.id] || null;
  const isGps = anchor.mode === 'gps';
  const left = cooldownLeft();

  let big, sub;
  if (!st) {
    big = 'Inconnu';
    sub = 'Aucun signalement récent chez toi. Sois le premier.';
  } else if (st.state === 'down') {
    big = 'Pas de lumière';
    sub = `Signalé ${timeAgo(st.updated_at)}`;
  } else {
    big = 'Y a du courant';
    sub = `Signalé ${timeAgo(st.updated_at)}`;
  }

  let confidence = '';
  if (st) {
    const badge = st.confirmed
      ? `<span class="badge confirmed">confirmé</span>`
      : `<span class="badge unconfirmed">non confirmé</span>`;
    confidence = `<div class="confidence">${badge} · ${st.n_distinct} appareil${
      st.n_distinct > 1 ? 's' : ''
    } distinct${st.n_distinct > 1 ? 's' : ''} · confiance ${st.confidence}%</div>`;
  }

  let buttons = '';
  if (!isGps) {
    buttons = `<p class="help-text">Zone choisie à la main (affichage seulement).
      Active le GPS pour pouvoir signaler.</p>
      <button class="btn btn-primary" id="locate" style="margin-top:10px">📍 Activer le GPS</button>
      <div id="locate-err"></div>`;
  } else if (left > 0) {
    buttons = `<p class="help-text">Merci ! Tu pourras re-signaler dans ${Math.ceil(
      left / 60000
    )} min.</p>`;
  } else {
    buttons = `
      <div class="report-buttons">
        <button class="btn btn-down" data-vote="down">🔌 Pas de lumière</button>
        <button class="btn btn-up" data-vote="up">💡 J'ai la lumière</button>
      </div>`;
  }

  box.innerHTML = `
    <div class="status-card ${st ? `state-${st.state}` : 'state-unknown'}">
      <div class="zone-name">Ta zone : <strong>${escapeHtml(zone.name)}</strong> · ${escapeHtml(
    zone.gov
  )}</div>
      <div class="big-status">${big}</div>
      <div class="status-sub">${sub}</div>
      ${confidence}
      ${buttons}
    </div>
    <p class="help-text">
      <a href="#" id="relocate" class="link">↻ Refaire ma localisation</a>
    </p>
  `;
}

function renderConfirmFix(fix) {
  const radius = candidateRadiusKm(fix.accuracy);
  const options = zonesNear(fix.lat, fix.lng, radius)
    .slice(0, MAX_CANDIDATES)
    .map((z) => {
      const d = distanceKm(fix.lat, fix.lng, z.lat, z.lng);
      return `<button class="confirm-option" data-pick="${z.id}">
          <span class="confirm-option-name">${escapeHtml(z.name)}</span>
          <span class="confirm-option-dist">${d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`}</span>
        </button>`;
    })
    .join('');

  const km = (fix.accuracy / 1000).toFixed(1);
  return `
    <div class="status-card state-unknown" style="text-align:left">
      <div class="big-status" style="font-size:20px">Confirme ta zone</div>
      <div class="status-sub">
        Ton téléphone te situe à <strong>± ${
          fix.accuracy >= 1000 ? `${km} km` : `${fix.accuracy} m`
        }</strong> près — pas assez précis pour trancher tout seul.
        Choisis ta zone parmi celles où tu peux être :
      </div>
      <div class="confirm-options">${options}</div>
      <p class="help-text" style="text-align:left">
        On ne propose que les zones dans ton rayon GPS — et le serveur revérifie.
        Tu ne peux pas signaler ailleurs que chez toi.
      </p>
      <p class="help-text" style="text-align:left">
        <a href="#" id="retry-locate" class="link">↻ Réessayer le GPS</a> ·
        <a href="#" id="cancel-fix" class="link">Annuler</a>
      </p>
    </div>
  `;
}

function onMyZoneClick(e) {
  const voteBtn = e.target.closest('[data-vote]');
  if (voteBtn) {
    vote(voteBtn.dataset.vote);
    return;
  }
  const pick = e.target.closest('[data-pick]');
  if (pick) {
    const zone = ZONES.find((z) => z.id === pick.dataset.pick);
    if (zone && pendingFix) {
      saveAnchor({
        mode: 'gps',
        zoneId: zone.id,
        lat: pendingFix.lat,
        lng: pendingFix.lng,
        accuracy: pendingFix.accuracy,
        ts: Date.now(),
      });
      pendingFix = null;
      drawMyZone();
      drawList();
    }
    return;
  }
  if (e.target.closest('#locate') || e.target.closest('#retry-locate')) {
    e.preventDefault();
    pendingFix = null;
    doLocate();
    return;
  }
  if (e.target.closest('#cancel-fix')) {
    e.preventDefault();
    pendingFix = null;
    drawMyZone();
    return;
  }
  if (e.target.closest('#relocate')) {
    e.preventDefault();
    doLocate();
  }
}

// --- Liste nationale ------------------------------------------------------

function statusPill(st) {
  if (!st) return `<span class="status-pill unknown">❔ Inconnu</span>`;
  if (st.state === 'down') return `<span class="status-pill down">🔌 Pas de lumière</span>`;
  return `<span class="status-pill up">✅ Ça marche</span>`;
}

function metaLine(st) {
  if (!st) return `<span class="zone-row-meta">Aucun signalement</span>`;
  const bits = [`🔌 ${st.n_down}`, `💡 ${st.n_up}`, timeAgo(st.updated_at)];
  if (!st.confirmed) bits.push('non confirmé');
  return `<span class="zone-row-meta">${bits.join(' · ')}</span>`;
}

function zoneRow(zone) {
  const st = states[zone.id] || null;
  const isMine = anchor && anchor.zoneId === zone.id;
  const open = expandedId === zone.id;

  return `
    <div class="zone-row ${st ? `state-${st.state}` : 'state-unknown'}${open ? ' open' : ''}">
      <button class="zone-head" data-toggle="${zone.id}" aria-expanded="${open}">
        <span class="zone-head-main">
          <span class="zone-row-name">${escapeHtml(zone.name)}${
    isMine ? ' <span class="chip-mine">ta zone</span>' : ''
  }</span>
          ${metaLine(st)}
        </span>
        ${statusPill(st)}
        <span class="chev">${open ? '⌄' : '›'}</span>
      </button>
      ${open ? `<div class="zone-body">${zoneBody(zone, st, isMine)}</div>` : ''}
    </div>`;
}

function zoneBody(zone, st, isMine) {
  const canVote = isMine && anchor && anchor.mode === 'gps';
  const left = cooldownLeft();

  let detail;
  if (!st) {
    detail = `<div class="zone-detail">Pas de signalement frais. L'état expire après ~45 min,
      donc « inconnu » veut dire « personne n'a signalé récemment ».</div>`;
  } else {
    detail = `<div class="zone-detail">
        ${st.n_down} « coupé » · ${st.n_up} « courant » · ${st.n_distinct} appareil${
      st.n_distinct > 1 ? 's' : ''
    } distinct${st.n_distinct > 1 ? 's' : ''} · confiance ${st.confidence}%
        ${st.confirmed ? '' : ' — <strong>non confirmé</strong> (moins de 3 appareils d\'accord)'}
      </div>`;
  }

  let action;
  if (canVote && left === 0) {
    action = `
      <div class="report-buttons">
        <button class="btn btn-down" data-vote="down">🔌 Pas de lumière</button>
        <button class="btn btn-up" data-vote="up">💡 J'ai la lumière</button>
      </div>`;
  } else if (canVote) {
    action = `<div class="zone-note">Tu pourras re-signaler dans ${Math.ceil(left / 60000)} min.</div>`;
  } else if (isMine) {
    action = `<div class="zone-note">Active le GPS pour signaler ici.</div>`;
  } else {
    action = `<div class="zone-note">Consultation seulement — on ne peut signaler que depuis
      sa propre zone (vérifié par GPS côté serveur).
      <a href="#" class="link" data-pin="${zone.id}">📌 C'est ma zone</a></div>`;
  }

  return detail + action;
}

function drawList() {
  const box = root.querySelector('#zone-list');
  if (!box) return;

  const q = normalizeText(query);
  const visible = q ? ZONES.filter((z) => normalizeText(z.name).includes(q)) : ZONES;

  if (visible.length === 0) {
    box.innerHTML = `<div class="zone-search-empty">
      Aucune zone ne correspond à « ${escapeHtml(query)} ». Tu peux l'ajouter en bas de page.
    </div>`;
    return;
  }

  let html = '';
  for (const gov of GOVS) {
    const inGov = visible.filter((z) => z.gov === gov);
    if (inGov.length === 0) continue;
    const nDown = inGov.filter((z) => states[z.id]?.state === 'down').length;
    html += `<div class="gov-header">
        <span>${escapeHtml(gov)}</span>
        <span class="gov-count">${
          nDown > 0 ? `${nDown} coupée${nDown > 1 ? 's' : ''}` : `${inGov.length} zones`
        }</span>
      </div>`;
    html += inGov.map(zoneRow).join('');
  }
  box.innerHTML = html;
}

function onListClick(e) {
  const voteBtn = e.target.closest('[data-vote]');
  if (voteBtn) {
    vote(voteBtn.dataset.vote);
    return;
  }

  const pin = e.target.closest('[data-pin]');
  if (pin) {
    e.preventDefault();
    // Épinglage manuel : affichage uniquement, jamais de droit de vote (§8).
    saveAnchor({ mode: 'manual', zoneId: pin.dataset.pin });
    drawMyZone();
    drawList();
    return;
  }

  const head = e.target.closest('[data-toggle]');
  if (head) {
    const id = head.dataset.toggle;
    expandedId = expandedId === id ? null : id;
    drawList();
  }
}

// --- Localisation ---------------------------------------------------------

async function doLocate() {
  const btn = root.querySelector('#locate');
  const errBox = root.querySelector('#locate-err');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Localisation…';
  }
  if (errBox) errBox.innerHTML = '';

  try {
    const fix = await getBestPosition({
      onProgress: (p) => {
        if (btn) btn.textContent = `Localisation… ± ${p.accuracy} m`;
      },
    });

    // Point net : on ancre directement, sans embêter l'utilisateur.
    if (fix.quality === 'good') {
      const zone = zoneForPoint(fix.lat, fix.lng);
      if (!zone) {
        showFixError("Tu sembles hors de la couverture. Cherche ta zone dans la liste.");
        return;
      }
      saveAnchor({
        mode: 'gps',
        zoneId: zone.id,
        lat: fix.lat,
        lng: fix.lng,
        accuracy: fix.accuracy,
        ts: Date.now(),
      });
      pendingFix = null;
      showToast(`Ta zone : ${zone.name}`);
      drawMyZone();
      drawList();
      return;
    }

    // Point flou : on demande à l'humain de trancher plutôt que de refuser.
    const candidates = zonesNear(fix.lat, fix.lng, candidateRadiusKm(fix.accuracy));
    if (candidates.length === 0) {
      showFixError("Tu sembles hors de la couverture. Cherche ta zone dans la liste.");
      return;
    }
    if (candidates.length === 1) {
      saveAnchor({
        mode: 'gps',
        zoneId: candidates[0].id,
        lat: fix.lat,
        lng: fix.lng,
        accuracy: fix.accuracy,
        ts: Date.now(),
      });
      pendingFix = null;
      drawMyZone();
      drawList();
      return;
    }
    pendingFix = fix;
    drawMyZone();
  } catch (e) {
    const msg = e instanceof GeolocError ? e.message : 'Erreur de localisation.';
    showFixError(msg);
  }
}

function showFixError(msg) {
  const errBox = root.querySelector('#locate-err');
  const btn = root.querySelector('#locate');
  if (btn) {
    btn.disabled = false;
    btn.textContent = '📍 Réessayer';
  }
  if (errBox) {
    errBox.innerHTML = `<div class="error-text">${escapeHtml(msg)}</div>`;
  } else {
    showToast(msg);
  }
}

// --- Vote -----------------------------------------------------------------

async function vote(state) {
  if (!anchor || anchor.mode !== 'gps') {
    showToast('Active le GPS pour signaler.');
    return;
  }
  root.querySelectorAll('[data-vote]').forEach((b) => (b.disabled = true));

  try {
    let { lat, lng, accuracy, zoneId } = anchor;

    // Point trop vieux : on relocalise, le serveur re-dérive la zone du GPS.
    if (Date.now() - anchor.ts > POSITION_FRESH_MS) {
      const fix = await getBestPosition();
      const near = zonesNear(fix.lat, fix.lng, candidateRadiusKm(fix.accuracy));
      if (!near.some((z) => z.id === zoneId)) {
        const z = zoneForPoint(fix.lat, fix.lng);
        showToast('Tu as changé de zone. On remet ta position à jour.');
        saveAnchor({
          mode: 'gps',
          zoneId: z ? z.id : zoneId,
          lat: fix.lat,
          lng: fix.lng,
          accuracy: fix.accuracy,
          ts: Date.now(),
        });
        drawMyZone();
        drawList();
        return;
      }
      lat = fix.lat;
      lng = fix.lng;
      accuracy = fix.accuracy;
      saveAnchor({ ...anchor, lat, lng, accuracy, ts: Date.now() });
    }

    const token = await getTurnstileToken();
    await submitReport({ state, lat, lng, accuracy, zoneId, deviceId: getDeviceId(), turnstileToken: token });
    localStorage.setItem(LASTVOTE_KEY, String(Date.now()));
    showToast(state === 'down' ? 'Signalé : pas de lumière. Merci 🙏' : 'Signalé : y a du courant. Merci 🙏');
    await refreshStates();
  } catch (e) {
    showToast(e.message || "Échec de l'envoi.");
    drawMyZone();
    drawList();
  }
}

// --- Ajouter une zone manquante (file de vérification) --------------------

async function startAddZone() {
  let pos = null;
  if (anchor && anchor.mode === 'gps' && Date.now() - anchor.ts <= POSITION_FRESH_MS) {
    pos = { lat: anchor.lat, lng: anchor.lng, accuracy: anchor.accuracy };
  } else {
    showToast('Localisation en cours…');
    try {
      pos = await getBestPosition();
    } catch (e) {
      showToast(e instanceof GeolocError ? e.message : 'Erreur de localisation.');
      return;
    }
  }
  drawAddZoneForm(pos);
}

function drawAddZoneForm(pos) {
  root.innerHTML = `
    <div class="status-card state-unknown">
      <div class="big-status" style="font-size:22px">Ajouter ma zone</div>
      <div class="status-sub">Donne le nom de ta zone. Ta position sert à la placer au bon endroit.</div>
    </div>
    <div style="margin-top:16px">
      <input id="zone-name" class="zone-search-input" type="text" maxlength="80"
             placeholder="Nom de la zone (ex. Cité El Ward)" autocomplete="off" />
      <div id="add-err"></div>
      <button class="btn btn-primary" id="submit-zone" style="margin-top:12px">Envoyer pour vérification</button>
      <p class="help-text">
        Ta proposition <strong>n'apparaît pas tout de suite</strong> : elle passe par une
        vérification (pour éviter les blagues). Position détectée : ± ${pos.accuracy ?? '?'} m.
      </p>
      <p class="help-text"><a href="#" id="cancel-add" class="link">← Retour à la liste</a></p>
    </div>
  `;

  const input = root.querySelector('#zone-name');
  input.focus();

  root.querySelector('#cancel-add').addEventListener('click', (e) => {
    e.preventDefault();
    renderHome(root);
  });

  root.querySelector('#submit-zone').addEventListener('click', async () => {
    const name = input.value.trim();
    const errBox = root.querySelector('#add-err');
    if (name.length < 2) {
      errBox.innerHTML = `<div class="error-text">Donne un nom de zone valide.</div>`;
      return;
    }
    const btn = root.querySelector('#submit-zone');
    btn.disabled = true;
    btn.textContent = 'Envoi…';
    try {
      const token = await getTurnstileToken();
      await submitZoneSuggestion({
        name,
        lat: pos.lat,
        lng: pos.lng,
        deviceId: getDeviceId(),
        turnstileToken: token,
      });
      showToast('Merci ! Ta zone sera vérifiée avant d’apparaître. 🙏');
      renderHome(root);
    } catch (e) {
      errBox.innerHTML = `<div class="error-text">${escapeHtml(e.message || "Échec de l'envoi.")}</div>`;
      btn.disabled = false;
      btn.textContent = 'Envoyer pour vérification';
    }
  });
}
