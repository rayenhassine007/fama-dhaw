// Cloudflare Turnstile — invisible anti-bot (spec §7.6).
// Loads lazily and only if a site key is configured; otherwise a no-op that
// returns an empty token (dev). The real gate is enforced server-side anyway.

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

let scriptPromise = null;
function loadScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('turnstile load failed'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

// Runs an invisible challenge and resolves with a token, or '' if not configured.
export async function getTurnstileToken() {
  if (!SITE_KEY) return '';
  await loadScript();
  return new Promise((resolve) => {
    const holder = document.createElement('div');
    holder.style.display = 'none';
    document.body.appendChild(holder);
    // eslint-disable-next-line no-undef
    turnstile.render(holder, {
      sitekey: SITE_KEY,
      size: 'invisible',
      callback: (token) => {
        resolve(token);
        holder.remove();
      },
      'error-callback': () => {
        resolve('');
        holder.remove();
      },
    });
  });
}
