import './style.css';
import { renderHome, onStates, currentStates } from './pages/home.js';
import { USE_API } from './lib/api.js';
import { inject } from '@vercel/analytics';

const app = document.querySelector('#app');

// La carte n'est chargée qu'au premier clic sur son onglet : l'accueil reste
// léger pour ceux qui viennent juste voir l'état de leur zone (§2.5, §10).
let mapModule = null;
let unsubMap = null;
let tab = 'zones';

function shell() {
  app.innerHTML = `
    <header class="app-header">
      <div>
        <div class="brand">Dh<span>a</span>w</div>
        <div class="tagline">Le courant chez toi, en direct</div>
      </div>
    </header>

    <nav class="tabs" role="tablist">
      <button class="tab active" data-tab="zones" role="tab" aria-selected="true">Ma zone</button>
      <button class="tab" data-tab="map" role="tab" aria-selected="false">🗺️ Carte</button>
    </nav>

    <main class="page" id="page-zones"></main>
    <main class="page" id="page-map" hidden></main>

    <div class="footer-note">
      Signalé par les habitants · les données expirent après ~45 min ·
      ${USE_API ? 'en direct' : 'mode démo (backend non connecté)'}
    </div>
  `;

  renderHome(document.querySelector('#page-zones'));
  app.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => show(b.dataset.tab)));
}

async function show(next) {
  if (next === tab) return;
  tab = next;

  app.querySelectorAll('.tab').forEach((b) => {
    const on = b.dataset.tab === tab;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', String(on));
  });
  document.querySelector('#page-zones').hidden = tab !== 'zones';
  document.querySelector('#page-map').hidden = tab !== 'map';

  if (tab !== 'map') return;

  const box = document.querySelector('#page-map');
  if (!mapModule) {
    box.innerHTML = `<p class="help-text">Chargement de la carte…</p>`;
    mapModule = await import('./pages/map.js');
  }

  // On repart des états déjà en mémoire, puis on suit les rafraîchissements.
  const { states, myZoneId } = currentStates();
  mapModule.renderMap(box, { states, myZoneId });
  if (unsubMap) unsubMap();
  unsubMap = onStates((s, mine) => mapModule.updateMapStates(s, mine));
}

shell();

// Initialize Vercel Web Analytics
inject();
