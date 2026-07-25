// Submit a user-suggested zone (goes to a verification queue, never live).
import { USE_API, apiPost } from './api.js';

const DEV_KEY = 'dhaw_pending_zones';

export async function submitZoneSuggestion({ name, lat, lng, deviceId, turnstileToken }) {
  if (!USE_API) {
    // Demo: keep locally so the flow is testable; still "pending".
    try {
      const list = JSON.parse(localStorage.getItem(DEV_KEY) || '[]');
      list.push({ name, lat, lng, ts: Date.now(), status: 'pending' });
      localStorage.setItem(DEV_KEY, JSON.stringify(list));
    } catch {
      /* ignore */
    }
    return { ok: true, status: 'pending' };
  }

  return apiPost('/api/suggest-zone', {
    name,
    lat,
    lng,
    device_id: deviceId,
    turnstile_token: turnstileToken,
  });
}
