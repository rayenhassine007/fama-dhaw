// GET /api/states — all non-expired zone states, for the home screen and map.
import { sql } from './_db.js';

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (!sql) return res.status(200).json([]); // demo/empty when DB not configured

  const rows = await sql`
    select zone_id, state, confidence, n_reports, n_distinct, updated_at, expires_at
    from cell_state
    where expires_at > now()
  `;
  return res.status(200).json(rows);
}
