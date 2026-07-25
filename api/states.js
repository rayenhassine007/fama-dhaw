// GET /api/states — l'état de chaque zone, dérivé des signalements FRAIS.
//
// Tout est calculé ici à partir de `votes`, rien n'est lu depuis un cache.
// C'est le correctif d'un bug bien réel : l'état venait de `cell_state`, écrit
// seulement au moment d'un vote, pendant que les compteurs étaient recalculés en
// direct. Les deux se contredisaient à l'écran dès que la situation évoluait
// sans nouveau vote — parce qu'un signalement avait expiré, ou parce que la
// règle d'agrégation avait changé entre-temps.
//
// La fenêtre glissante fait aussi office de TTL : un signalement plus vieux que
// WINDOW_MIN n'est simplement plus compté, donc une zone sans activité récente
// disparaît d'elle-même de la réponse.
import { sql } from './_db.js';
import { WINDOW_MIN } from './_helpers.js';
import { aggregate } from '../shared/aggregate.js';

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (!sql) return res.status(200).json([]); // démo / base non configurée

  // Un appareil = une voix : on ne garde que son dernier signalement par zone.
  const rows = await sql`
    with latest as (
      select distinct on (device_id, zone_id) zone_id, state, created_at
      from votes
      where created_at > now() - make_interval(mins => ${WINDOW_MIN})
      order by device_id, zone_id, created_at desc
    )
    select zone_id,
           count(*) filter (where state = 'down')::int as n_down,
           count(*) filter (where state = 'up')::int   as n_up,
           max(created_at)                             as updated_at
    from latest
    group by zone_id
  `;

  const out = [];
  for (const r of rows) {
    const agg = aggregate(r.n_down, r.n_up);
    if (!agg) continue;
    out.push({
      zone_id: r.zone_id,
      state: agg.state,
      confidence: agg.confidence,
      n_reports: r.n_down + r.n_up,
      n_distinct: agg.nDistinct,
      n_down: r.n_down,
      n_up: r.n_up,
      confirmed: agg.confirmed,
      updated_at: r.updated_at,
    });
  }
  return res.status(200).json(out);
}
