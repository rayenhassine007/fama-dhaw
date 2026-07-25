// Anonymous, persistent device identifier.
// No account, no PII — just a stable random id so the server can enforce
// "N distinct devices" (anti-abuse §7) and, later, per-device reputation.
// The server still hashes the IP separately; this id is only one signal.

const KEY = 'dhaw_device_id';

function randomId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  // Fallback for older browsers.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function getDeviceId() {
  let id = null;
  try {
    id = localStorage.getItem(KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(KEY, id);
    }
  } catch {
    // localStorage blocked (private mode / storage full): fall back to a
    // per-session id. The vote still counts, it just won't persist reputation.
    id = randomId();
  }
  return id;
}
