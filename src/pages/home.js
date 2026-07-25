// "Ma zone" — the home screen (spec §3, §10). This is the primary screen, not
// the map. Big status for the user's own zone, and the two report buttons,
// which are enabled ONLY once we have a fresh GPS fix for this zone.

import { getPosition, GeolocError } from '../lib/geoloc.js';
import { zoneForPoint } from '../lib/zones.js';
import { ZONES } from '../data/zones.js';
import { getDeviceId } from '../lib/device.js';
import { fetchZoneState, fetchAllStates } from '../lib/cellstate.js';
import { submitReport } from '../lib/report.js';
import { submitZoneSuggestion } from '../lib/suggestZone.js';
import { getTurnstileToken } from '../lib/turnstile.js';
import { showToast, timeAgo, sinceText, escapeHtml, normalizeText } from '../lib/ui.js';

const ANCHOR_KEY = 'dhaw_anchor';
const LASTVOTE_KEY = 'dhaw_last_vote';
const POSITION_FRESH_MS = 20 * 60 * 1000; // re-locate before voting if older
const VOTE_COOLDOWN_MS = 10 * 60 * 1000; // 1 vote / 10 min / device (§7.6)

function loadAnchor() {
  try {
    return JSON.parse(localStorage.getItem(ANCHOR_KEY) || 'null');
  } catch {
    return null;
  }
}
function saveAnchor(a) {
  try {
    localStorage.setItem(ANCHOR_KEY, JSON.stringify(a));
  } catch {
    /* ignore */
  }
}
function lastVoteAt() {
  return Number(localStorage.getItem(LASTVOTE_KEY) || 0);
}

let root = null;
let statesCache = {}; // zoneId -> state, loaded once to show status dots in search

export function renderHome(container) {
  root = container;
  draw();
}

async function draw() {
  const anchor = loadAnchor();
  if (!anchor) {
    drawLocatePrompt();
    return;
  }

  const zone = ZONES.find((z) => z.id === anchor.zoneId);
  if (!zone) {
    saveAnchor(null);
    drawLocatePrompt();
    return;
  }

  const state = await fetchZoneState(zone.id);
  drawStatus(anchor, zone, state);
}

function drawLocatePrompt() {
  root.innerHTML = `
    <div class="locate-block">
      <div class="status-card state-unknown">
        <div class="big-status">Ma zone</div>
        <div class="status-sub">On regarde où t'es pour te montrer l'état du courant chez toi.</div>
      </div>
      <p style="margin-top:18px">
        On utilise ta position <strong>juste pour trouver ta zone</strong>.
        Rien n'est stocké de personnel. Tu pourras signaler seulement pour ta zone.
      </p>
      <button class="btn btn-primary" id="locate">📍 Trouver ma zone</button>
      <div id="locate-err"></div>

      <div class="zone-search">
        <input id="zone-search-input" class="zone-search-input" type="search"
               placeholder="🔍 Cherche ta zone par nom" autocomplete="off" />
        <div id="zone-search-results" class="zone-search-results"></div>
      </div>

      <p class="help-text">
        Signaler « coupé / y a du courant » reste réservé à <strong>ta</strong> zone (via GPS).
        La recherche sert à consulter n'importe quelle zone.
      </p>
      <p class="help-text" style="margin-top:14px">
        <a href="#" id="add-zone" style="color:var(--accent);text-decoration:none">➕ Ma zone n'est pas dans la liste ? Ajoute-la</a>
      </p>
    </div>
  `;
  root.querySelector('#locate').addEventListener('click', doLocate);
  root.querySelector('#add-zone').addEventListener('click', (e) => {
    e.preventDefault();
    startAddZone(loadAnchor());
  });

  const input = root.querySelector('#zone-search-input');
  input.addEventListener('input', () => renderSearchResults(input.value));

  // Load states once so search results can show a status dot.
  fetchAllStates()
    .then((s) => {
      statesCache = s || {};
      if (input.value) renderSearchResults(input.value);
    })
    .catch(() => {});
}

function renderSearchResults(query) {
  const box = root.querySelector('#zone-search-results');
  if (!box) return;
  const q = normalizeText(query);
  if (q.length < 1) {
    box.innerHTML = '';
    return;
  }
  const matches = ZONES.filter((z) => normalizeText(z.name).includes(q)).slice(0, 25);
  if (matches.length === 0) {
    box.innerHTML = `<div class="zone-search-empty">Aucune zone trouvée. Tu peux l'ajouter ci-dessous.</div>`;
    return;
  }
  box.innerHTML = matches
    .map((z) => {
      const st = statesCache[z.id];
      const cls = st ? st.state : 'unknown';
      return `<button class="zone-result" data-id="${z.id}">
          <span class="dot ${cls}"></span>
          <span class="zone-result-name">${escapeHtml(z.name)}</span>
          <span class="zone-result-gov">${escapeHtml(z.gov)}</span>
        </button>`;
    })
    .join('');
  box.querySelectorAll('.zone-result').forEach((btn) => {
    btn.addEventListener('click', () => {
      // View-only anchor: consulting a zone by name, no GPS proof → no voting.
      saveAnchor({ mode: 'manual', zoneId: btn.dataset.id });
      draw();
    });
  });
}

async function doLocate() {
  const btn = root.querySelector('#locate');
  const errBox = root.querySelector('#locate-err');
  btn.disabled = true;
  btn.textContent = 'Localisation…';
  errBox.innerHTML = '';
  try {
    const pos = await getPosition();
    const zone = zoneForPoint(pos.lat, pos.lng);
    if (!zone) {
      errBox.innerHTML = `<div class="error-text">Tu sembles hors de la zone couverte. Cherche ta zone par nom ci-dessous, ou ajoute-la.</div>`;
      btn.disabled = false;
      btn.textContent = '📍 Réessayer';
      return;
    }
    saveAnchor({ mode: 'gps', zoneId: zone.id, lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, ts: Date.now() });
    draw();
  } catch (e) {
    const msg = e instanceof GeolocError ? e.message : "Erreur de localisation.";
    errBox.innerHTML = `<div class="error-text">${escapeHtml(msg)} Tu peux chercher ta zone par nom ci-dessous.</div>`;
    btn.disabled = false;
    btn.textContent = '📍 Réessayer';
  }
}

function drawStatus(anchor, zone, state) {
  const stateClass = state ? `state-${state.state}` : 'state-unknown';
  const isGps = anchor.mode === 'gps';

  let big, sub;
  if (!state) {
    big = 'Inconnu';
    sub = 'Aucun signalement récent pour cette zone. Sois le premier.';
  } else if (state.state === 'down') {
    big = 'Coupé';
    sub = `Signalé ${timeAgo(state.updated_at)}`;
  } else {
    big = 'Y a du courant';
    sub = `Signalé ${timeAgo(state.updated_at)}`;
  }

  let confidenceLine = '';
  if (state) {
    const badge = state.confirmed
      ? `<span class="badge confirmed">confirmé</span>`
      : `<span class="badge unconfirmed">non confirmé</span>`;
    confidenceLine = `<div class="confidence">${badge} · ${state.n_distinct} appareil${state.n_distinct > 1 ? 's' : ''} distinct${state.n_distinct > 1 ? 's' : ''} · confiance ${state.confidence}%</div>`;
  }

  const cooldownLeft = Math.max(0, VOTE_COOLDOWN_MS - (Date.now() - lastVoteAt()));
  const onCooldown = cooldownLeft > 0;

  const buttonsDisabled = !isGps || onCooldown;
  let buttonsNote = '';
  if (!isGps) buttonsNote = `<p class="help-text">Active le GPS (« Trouver ma zone ») pour pouvoir signaler.</p>`;
  else if (onCooldown)
    buttonsNote = `<p class="help-text">Merci ! Tu pourras re-signaler dans ${Math.ceil(cooldownLeft / 60000)} min.</p>`;

  root.innerHTML = `
    <div class="status-card ${stateClass}">
      <div class="zone-name">Ta zone : <strong>${escapeHtml(zone.name)}</strong> · ${escapeHtml(zone.gov)}</div>
      <div class="big-status">${big}</div>
      <div class="status-sub">${sub}</div>
      ${confidenceLine}
    </div>

    <div class="report-buttons">
      <button class="btn btn-up" id="vote-up" ${buttonsDisabled ? 'disabled' : ''}>⚡ Y a du courant</button>
      <button class="btn btn-down" id="vote-down" ${buttonsDisabled ? 'disabled' : ''}>🔌 Coupé</button>
    </div>
    ${buttonsNote}

    <p class="help-text" style="margin-top:20px; display:flex; gap:16px; justify-content:center; flex-wrap:wrap">
      <a href="#" id="relocate" style="color:var(--accent);text-decoration:none">↻ Refaire ma localisation</a>
      <a href="#" id="add-zone" style="color:var(--accent);text-decoration:none">➕ Ma zone manque / mauvais nom</a>
    </p>
  `;

  if (isGps && !onCooldown) {
    root.querySelector('#vote-up').addEventListener('click', () => vote('up', anchor, zone));
    root.querySelector('#vote-down').addEventListener('click', () => vote('down', anchor, zone));
  }
  root.querySelector('#relocate').addEventListener('click', (e) => {
    e.preventDefault();
    saveAnchor(null);
    draw();
  });
  root.querySelector('#add-zone').addEventListener('click', (e) => {
    e.preventDefault();
    startAddZone(anchor);
  });
}

// --- Add-a-zone flow (suggestions go to a verification queue, never live) ---

async function startAddZone(anchor) {
  // We need GPS coordinates for the suggestion. Reuse a fresh GPS anchor, else
  // ask for a position now.
  let pos = null;
  if (anchor && anchor.mode === 'gps' && Date.now() - anchor.ts <= POSITION_FRESH_MS) {
    pos = { lat: anchor.lat, lng: anchor.lng, accuracy: anchor.accuracy };
  } else {
    root.innerHTML = `<div class="locate-block"><p class="help-text">Localisation en cours…</p></div>`;
    try {
      pos = await getPosition();
    } catch (e) {
      const msg = e instanceof GeolocError ? e.message : 'Erreur de localisation.';
      root.innerHTML = `
        <div class="locate-block">
          <div class="error-text">${escapeHtml(msg)}</div>
          <p class="help-text">On a besoin de ta position (GPS) pour ajouter ta zone au bon endroit.</p>
          <button class="btn btn-primary" id="back">← Retour</button>
        </div>`;
      root.querySelector('#back').addEventListener('click', draw);
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
      <input id="zone-name" class="btn" style="width:100%; text-align:left; padding:0 14px"
             type="text" maxlength="80" placeholder="Nom de la zone (ex. Cité El Ward)" autocomplete="off" />
      <div id="add-err"></div>
      <button class="btn btn-primary" id="submit-zone" style="margin-top:12px">Envoyer pour vérification</button>
      <p class="help-text">
        Ta proposition <strong>n'apparaît pas tout de suite</strong> : elle passe par une
        vérification (pour éviter les blagues). Position détectée : ± ${pos.accuracy ?? '?'} m.
      </p>
      <p class="help-text" style="margin-top:10px">
        <a href="#" id="cancel" style="color:var(--accent);text-decoration:none">← Annuler</a>
      </p>
    </div>
  `;
  const input = root.querySelector('#zone-name');
  input.focus();
  root.querySelector('#cancel').addEventListener('click', (e) => {
    e.preventDefault();
    draw();
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
      draw();
    } catch (e) {
      errBox.innerHTML = `<div class="error-text">${escapeHtml(e.message || "Échec de l'envoi.")}</div>`;
      btn.disabled = false;
      btn.textContent = 'Envoyer pour vérification';
    }
  });
}

async function vote(state, anchor, zone) {
  const upBtn = root.querySelector('#vote-up');
  const downBtn = root.querySelector('#vote-down');
  if (upBtn) upBtn.disabled = true;
  if (downBtn) downBtn.disabled = true;

  try {
    // Refresh GPS if the fix is stale — the server derives the zone from it.
    let { lat, lng, accuracy } = anchor;
    if (Date.now() - anchor.ts > POSITION_FRESH_MS) {
      const pos = await getPosition();
      const z = zoneForPoint(pos.lat, pos.lng);
      if (!z || z.id !== zone.id) {
        showToast('Ta position a changé de zone. On la remet à jour.');
        saveAnchor({ mode: 'gps', zoneId: z ? z.id : zone.id, lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, ts: Date.now() });
        draw();
        return;
      }
      lat = pos.lat;
      lng = pos.lng;
      accuracy = pos.accuracy;
      saveAnchor({ ...anchor, lat, lng, accuracy, ts: Date.now() });
    }

    const token = await getTurnstileToken();
    await submitReport({ state, lat, lng, accuracy, deviceId: getDeviceId(), turnstileToken: token });
    localStorage.setItem(LASTVOTE_KEY, String(Date.now()));
    showToast(state === 'down' ? 'Signalé : coupé. Merci 🙏' : 'Signalé : y a du courant. Merci 🙏');
    draw();
  } catch (e) {
    showToast(e.message || "Échec de l'envoi.");
    draw();
  }
}
