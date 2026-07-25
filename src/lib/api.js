// Thin client for the Vercel API routes (backed by Neon Postgres).
//
// When the backend isn't wired up (local `vite dev` with no serverless
// runtime), set nothing and the app runs in demo mode via devstore. On Vercel,
// set VITE_USE_API=1 so the client talks to the real /api/* routes.

export const USE_API = import.meta.env.VITE_USE_API === '1';

// Same-origin by default (front + API on the same Vercel deployment).
const BASE = import.meta.env.VITE_API_BASE || '';

export async function apiGet(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `POST ${path} → ${res.status}`);
  return data;
}
