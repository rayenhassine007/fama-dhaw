// Reads aggregated zone states. Source of truth is the server (the `cell_state`
// table via /api/states). The client only DISPLAYS state — it never aggregates
// trust locally (spec §8).
//
// Without the API (demo), falls back to the local devstore simulation.
// Neon has no built-in realtime, so "live" updates are done by polling.

import { USE_API, apiGet } from './api.js';
import { devAllStates, devZoneState } from './devstore.js';

const POLL_MS = 20000; // states change slowly + TTL is 45 min → polling is fine

export async function fetchAllStates() {
  if (!USE_API) return devAllStates();
  try {
    const rows = await apiGet('/api/states');
    // Plus de filtre d'expiration ici : /api/states ne compte que les
    // signalements de la fenêtre glissante, donc une zone sans activité récente
    // n'est déjà plus dans la réponse.
    const out = {};
    for (const row of rows) out[row.zone_id] = normalize(row);
    return out;
  } catch (e) {
    console.warn('fetchAllStates', e.message);
    return {};
  }
}

export async function fetchZoneState(zoneId) {
  if (!USE_API) return devZoneState(zoneId);
  const all = await fetchAllStates();
  return all[zoneId] || null;
}

// Le client n'agrège RIEN (§8) : le serveur a déjà appliqué shared/aggregate.js
// et envoie l'état, la confiance et « confirmé ». On se contente de recopier,
// pour qu'il n'existe aucun second calcul susceptible de diverger.
function normalize(row) {
  return {
    zoneId: row.zone_id,
    state: row.state,
    confidence: row.confidence ?? 0,
    n_reports: row.n_reports ?? 0,
    n_distinct: row.n_distinct ?? 0,
    n_down: row.n_down ?? 0,
    n_up: row.n_up ?? 0,
    confirmed: Boolean(row.confirmed),
    updated_at: row.updated_at,
  };
}

// Polling-based "realtime". Returns an unsubscribe function. No-op in demo.
export function subscribeStates(onChange) {
  if (!USE_API) return () => {};
  const id = setInterval(onChange, POLL_MS);
  return () => clearInterval(id);
}
