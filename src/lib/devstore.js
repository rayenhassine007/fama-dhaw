// DEV-ONLY local simulation of the backend.
//
// Used only when the API/DB isn't configured, so the full UX (locked voting,
// TTL expiry, confidence levels, map colors) is playable with zero backend.
// It mirrors the aggregation rules we'll implement server-side (spec §4.3, §7)
// so the behaviour you see in dev matches production. Delete once the real
// Edge Function is live — nothing else imports the internals.
//
// NOTE: this is NOT the trust model. Real aggregation must run server-side;
// a browser can't be trusted to count "distinct devices". This is a stand-in.

import { aggregate } from '../../shared/aggregate.js';

const KEY = 'dhaw_dev_votes';
const WINDOW_MS = 45 * 60 * 1000; // TTL — reports older than this are ignored

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}
function save(votes) {
  try {
    localStorage.setItem(KEY, JSON.stringify(votes));
  } catch {
    /* ignore */
  }
}

// Drop expired votes (TTL is our friend — false data expires on its own).
function fresh(votes, now = Date.now()) {
  return votes.filter((v) => now - v.ts < WINDOW_MS);
}

export function devAddVote({ zoneId, state, deviceId }) {
  const votes = fresh(load());
  votes.push({ zoneId, state, deviceId, ts: Date.now() });
  save(votes);
  return devZoneState(zoneId);
}

// Aggregate one zone into { state, confidence, n_reports, n_distinct, updated_at }.
export function devZoneState(zoneId) {
  const now = Date.now();
  const votes = fresh(load(), now).filter((v) => v.zoneId === zoneId);
  if (votes.length === 0) return null;

  // Un appareil = une voix : on ne garde que son dernier signalement, comme le
  // fait recomputeState() côté serveur (api/_helpers.js).
  const byDevice = new Map();
  for (const v of votes) {
    const prev = byDevice.get(v.deviceId);
    if (!prev || v.ts > prev.ts) byDevice.set(v.deviceId, v);
  }
  const latest = [...byDevice.values()];

  const down = latest.filter((v) => v.state === 'down');
  const up = latest.filter((v) => v.state === 'up');

  // Exactement la même fonction que le serveur : la simulation ne peut pas
  // diverger de la production.
  //
  // En mode démo tout part du même navigateur, donc d'une seule connexion : on
  // le déclare honnêtement (ips: 1), ce qui reproduit fidèlement le plafond de
  // voix par connexion — y compris le cas des onglets privés.
  const agg = aggregate(
    { devices: down.length, ips: down.length ? 1 : 0 },
    { devices: up.length, ips: up.length ? 1 : 0 }
  );
  if (!agg) return null;

  const lastTs = Math.max(...votes.map((v) => v.ts));

  return {
    zoneId,
    state: agg.state,
    confidence: agg.confidence,
    n_reports: latest.length,
    n_distinct: agg.nDistinct,
    n_down: agg.nDown,
    n_up: agg.nUp,
    confirmed: agg.confirmed,
    updated_at: new Date(lastTs).toISOString(),
  };
}

// Historique local, calculé exactement comme api/history.js : même fenêtre
// glissante, même règle d'agrégation, mêmes créneaux.
export function devZoneHistory(zoneId, hours = 24) {
  const BUCKET_MIN = 15;
  const bucketMs = BUCKET_MIN * 60000;
  const now = Date.now();
  const start = Math.floor((now - hours * 3600000) / bucketMs) * bucketMs;
  const votes = load().filter((v) => v.zoneId === zoneId);

  const points = [];
  for (let t = start; t <= now; t += bucketMs) {
    const seen = new Map();
    for (const v of votes) {
      if (v.ts > t || v.ts <= t - WINDOW_MS) continue;
      const prev = seen.get(v.deviceId);
      if (!prev || v.ts > prev.ts) seen.set(v.deviceId, v);
    }
    const latest = [...seen.values()];
    const n = (s) => latest.filter((v) => v.state === s).length;
    // Tout vient du même navigateur : une seule connexion (cf. devZoneState).
    const agg = latest.length
      ? aggregate({ devices: n('down'), ips: n('down') ? 1 : 0 }, { devices: n('up'), ips: n('up') ? 1 : 0 })
      : null;
    points.push({
      t: new Date(t).toISOString(),
      state: agg ? agg.state : 'unknown',
      n_down: agg ? agg.nDown : 0,
      n_up: agg ? agg.nUp : 0,
    });
  }
  return { zone_id: zoneId, bucket_min: BUCKET_MIN, hours, points };
}

export function devAllStates() {
  const now = Date.now();
  const votes = fresh(load(), now);
  const zoneIds = [...new Set(votes.map((v) => v.zoneId))];
  const out = {};
  for (const id of zoneIds) {
    const s = devZoneState(id);
    if (s) out[id] = s;
  }
  return out;
}
