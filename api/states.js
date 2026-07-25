// GET /api/states — tous les états de zone non expirés, pour la liste nationale.
//
// On renvoie aussi, par zone, le décompte brut « coupé » vs « courant » de la
// fenêtre courante. Les deux chiffres sont affichés côte à côte : quand les gens
// ne sont pas d'accord, ça se voit (§2.3, on n'affiche jamais un booléen sec).
// Ces compteurs sont calculés à la volée depuis `votes`, donc aucune colonne
// supplémentaire n'est nécessaire dans `cell_state`.
import { sql } from './_db.js';
import { WINDOW_MIN } from './_helpers.js';

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  if (!sql) return res.status(200).json([]); // démo / base non configurée

  const [rows, counts] = await Promise.all([
    sql`
      select zone_id, state, confidence, n_reports, n_distinct, updated_at, expires_at
      from cell_state
      where expires_at > now()
    `,
    // Mêmes règles que recomputeState : un appareil = une voix, on ne retient
    // que son dernier signalement. Sinon les compteurs affichés
    // contrediraient l'état décidé (« 2-2 » alors qu'un seul appareil parle).
    sql`
      with latest as (
        select distinct on (device_id, zone_id) zone_id, state
        from votes
        where created_at > now() - make_interval(mins => ${WINDOW_MIN})
        order by device_id, zone_id, created_at desc
      )
      select zone_id,
             count(*) filter (where state = 'down')::int as n_down,
             count(*) filter (where state = 'up')::int   as n_up
      from latest
      group by zone_id
    `,
  ]);

  const byZone = new Map(counts.map((c) => [c.zone_id, c]));
  return res.status(200).json(
    rows.map((r) => ({
      ...r,
      n_down: byZone.get(r.zone_id)?.n_down ?? 0,
      n_up: byZone.get(r.zone_id)?.n_up ?? 0,
    }))
  );
}
