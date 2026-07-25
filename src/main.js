import './style.css';
import { renderHome } from './pages/home.js';
import { USE_API } from './lib/api.js';

// Map tab removed for now (focus is on the zones). The map (MapLibre + Voronoi
// polygons) lives in git history and can be restored later.

const app = document.querySelector('#app');

function shell() {
  app.innerHTML = `
    <header class="app-header">
      <div>
        <div class="brand">Dh<span>a</span>w</div>
        <div class="tagline">Le courant chez toi, en direct</div>
      </div>
    </header>
    <main class="page" id="page"></main>
    <div class="footer-note">
      Signalé par les habitants · les données expirent après ~45 min ·
      ${USE_API ? 'en direct' : 'mode démo (backend non connecté)'}
    </div>
  `;
  renderHome(document.querySelector('#page'));
}

shell();
