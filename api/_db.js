// Neon serverless Postgres client (HTTP driver — works in Vercel functions).
// DATABASE_URL is a server-only env var; it is NEVER exposed to the browser.
import { neon } from '@neondatabase/serverless';

export const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
