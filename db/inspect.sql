-- Regarder les données de Dhaw — et donner un accès en lecture à quelqu'un.
--
-- À exécuter dans la console Neon (onglet SQL Editor) :
--   Vercel → projet fama-dhaw → Storage → la base Neon → Open in Neon
--   ou directement https://console.neon.tech

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. DONNER UN ACCÈS EN LECTURE SEULE
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Préférer ceci à un partage du DATABASE_URL de production : ce rôle peut TOUT
-- lire mais rien écrire ni effacer. Un signalement supprimé par erreur est perdu
-- définitivement — la table `votes` est notre seul historique (§6.2, §6.4).
--
-- Remplacer le mot de passe, puis transmettre la chaîne de connexion en
-- remplaçant l'utilisateur et le mot de passe dans l'URL fournie par Neon.

-- CREATE ROLE dhaw_lecture WITH LOGIN PASSWORD 'mets-un-vrai-mot-de-passe-ici';
-- GRANT CONNECT ON DATABASE neondb TO dhaw_lecture;   -- adapter le nom si besoin
-- GRANT USAGE  ON SCHEMA public   TO dhaw_lecture;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO dhaw_lecture;
-- -- Pour que les tables créées plus tard soient lisibles elles aussi :
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO dhaw_lecture;

-- Vérifier que le rôle ne peut vraiment pas écrire :
-- SELECT grantee, table_name, privilege_type
-- FROM information_schema.role_table_grants
-- WHERE grantee = 'dhaw_lecture' ORDER BY table_name, privilege_type;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. CE QU'IL Y A DANS LA BASE
-- ═══════════════════════════════════════════════════════════════════════════

-- Vue d'ensemble : combien de lignes dans chaque table
select 'votes' as table, count(*) from votes
union all select 'cell_state', count(*) from cell_state
union all select 'devices', count(*) from devices
union all select 'pending_zones', count(*) from pending_zones
union all select 'steg_announcements', count(*) from steg_announcements;

-- Les 50 derniers signalements bruts.
-- Aucune IP en clair n'est stockée : `ip_hash` est un SHA-256 salé (§11).
select id, zone_id, state, device_id, left(ip_hash, 8) as ip, gps_accuracy, created_at
from votes
order by created_at desc
limit 50;

-- Activité par zone, du plus actif au moins actif
select zone_id,
       count(*)                                   as signalements,
       count(distinct device_id)                  as appareils,
       count(distinct ip_hash)                    as connexions,
       count(*) filter (where state = 'down')     as coupe,
       count(*) filter (where state = 'up')       as courant,
       min(created_at)                            as premier,
       max(created_at)                            as dernier
from votes
group by zone_id
order by signalements desc;

-- Activité heure par heure, pour voir quand les gens signalent
select date_trunc('hour', created_at) as heure,
       count(*)                               as signalements,
       count(distinct zone_id)                as zones,
       count(*) filter (where state = 'down') as coupe
from votes
group by 1
order by 1 desc
limit 48;

-- État courant tel que l'app le calcule : un appareil = une voix, fenêtre 45 min.
-- C'est la même logique que shared/aggregate.js, en SQL.
with latest as (
  select distinct on (device_id, zone_id) zone_id, device_id, ip_hash, state
  from votes
  where created_at > now() - interval '45 minutes'
  order by device_id, zone_id, created_at desc
)
select zone_id,
       count(*) filter (where state = 'down')                  as appareils_coupe,
       count(*) filter (where state = 'up')                    as appareils_courant,
       count(distinct ip_hash) filter (where state = 'down')   as connexions_coupe,
       count(distinct ip_hash) filter (where state = 'up')     as connexions_courant
from latest
group by zone_id
order by appareils_coupe desc;

-- Zones proposées par les utilisateurs, en attente de validation.
-- Rien n'apparaît dans l'app tant que la zone n'a pas été ajoutée à la main
-- dans shared/zones.js — cette table n'est qu'une boîte de réception.
select id, name, lat, lng, status, created_at
from pending_zones
where status = 'pending'
order by created_at desc;

-- Appareils vus, et leur ancienneté
select device_id, reputation, first_seen
from devices
order by first_seen desc
limit 50;
