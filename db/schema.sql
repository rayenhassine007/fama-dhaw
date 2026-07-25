-- Dhaw — Neon Postgres schema (spec §9, adapted to fixed named zones).
-- Run once against your Neon database:
--   psql "$DATABASE_URL" -f db/schema.sql

-- Raw citizen reports. zone_id is computed SERVER-SIDE from the GPS, never
-- taken from the client (spec §8).
create table if not exists votes (
  id           bigserial primary key,
  zone_id      text        not null,
  state        text        not null check (state in ('up', 'down')),
  device_id    text        not null,
  ip_hash      text        not null,
  asn          text,                       -- for the GPS↔connection cross-check (§7.2)
  is_mobile    boolean,                    -- inferred from ASN: mobile vs fixed line
  gps_accuracy int,
  created_at   timestamptz not null default now()
);
create index if not exists votes_zone_time_idx on votes (zone_id, created_at desc);
create index if not exists votes_device_time_idx on votes (device_id, created_at desc);
create index if not exists votes_ip_time_idx on votes (ip_hash, created_at desc);

-- Aggregated state per zone (recomputed on each vote, TTL-bounded).
create table if not exists cell_state (
  zone_id    text primary key,
  state      text        not null,          -- 'down' | 'up' | 'unknown'
  confidence int         not null default 0,-- 0..100
  n_reports  int         not null default 0,
  n_distinct int         not null default 0,-- distinct devices behind the winning side
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null          -- TTL: stale rows are treated as unknown
);

-- "Announced" STEG layer — kept SEPARATE from citizen reports (spec §2, §4.3).
create table if not exists steg_announcements (
  id           bigserial primary key,
  raw_text     text,
  zone_ids     text[],                      -- geocoded from the localities named
  window_start timestamptz,
  window_end   timestamptz,
  source_url   text,
  scraped_at   timestamptz not null default now()
);

-- User-suggested zones (when someone's zone isn't in the list). These are NOT
-- shown until reviewed — trolls submit junk, so every suggestion is 'pending'
-- and only an approved one is promoted into the zone list.
create table if not exists pending_zones (
  id         bigserial primary key,
  name       text        not null,
  lat        double precision not null,
  lng        double precision not null,
  device_id  text,
  ip_hash    text,
  status     text        not null default 'pending', -- 'pending' | 'approved' | 'rejected'
  created_at timestamptz not null default now()
);
create index if not exists pending_zones_status_idx on pending_zones (status, created_at desc);

-- Per-device reputation (anonymous, no account). Optional weighting later (§7.5).
create table if not exists devices (
  device_id  text primary key,
  reputation int         not null default 0,
  first_seen timestamptz not null default now(),
  asn        text
);
