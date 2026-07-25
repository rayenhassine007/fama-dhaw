# Dhaw — carte des coupures d'électricité (Tunisie)

Où l'électricité est coupée en Tunisie, en temps réel — signalé par les
habitants, zone par zone. Voir [`CLAUDE.md`](./CLAUDE.md) pour la vision, les
principes non négociables et la roadmap.

Ce dépôt est une **réécriture depuis zéro**. Le concept : reprendre l'UX
familière du concurrent (carte + boutons « ça marche / coupé »), mais corriger
sa plus grosse faille — **le GPS verrouille chaque personne à sa propre zone**,
donc on ne peut signaler que là où l'on se trouve physiquement.

## Ce qui est fait (V1 — front)

- **Écran « Ma zone »** (accueil) : gros statut, fraîcheur, niveau de confiance.
- **Géoloc → zone** avec filtre de précision strict (spec §5). Position trop
  imprécise ou refusée → sélection manuelle en **lecture seule** (pas de vote
  sans preuve GPS).
- **Signalement 1 tap**, boutons **activés uniquement pour ta zone GPS**.
  Cooldown 10 min / appareil côté client (le serveur ré-imposera la vraie limite).
- **TTL** : les signalements expirent (~45 min) → une fausse donnée disparaît seule.
- **Carte** (onglet secondaire) : zones colorées par état + opacité = confiance.
  Chargée à la demande (MapLibre) pour garder l'accueil ultra-léger.
- **Mode démo** : sans backend configuré, une simulation locale (`devstore.js`)
  fait tourner toute l'UX (vote, TTL, confiance) pour tester hors-ligne.

### Le modèle « zones »

Zones = **la liste nationale complète du concurrent** (~375 zones, tous les
gouvernorats), transcrites depuis leur app, chacune définie par un **centroïde
nommé** ([`shared/zones.js`](./shared/zones.js)). Une position GPS appartient à
la zone dont le centre est le plus proche (partition de Voronoï). Léger, aucun
polygone à héberger. **L'identité d'une zone est sa position, pas son nom** : on
ne peut pas « atteindre » une zone en tapant son nom, seul le GPS décide (§8) —
le nom est purement d'affichage. Coordonnées approximatives (surtout les
micro-quartiers de Tunis) — à affiner avec la data officielle TN.

### Ajouter une zone manquante

Bouton **« ➕ Ma zone n'est pas là ? Ajoute-la »** sur l'accueil. L'utilisateur
donne un nom, sa position GPS sert à la placer. La proposition **n'apparaît pas
tout de suite** : elle part dans une file de **vérification** (`pending_zones`,
statut `pending`) pour éviter les blagues, et n'est promue dans la liste
qu'après validation humaine.

## Architecture

Front statique (Vite) + **routes API serverless Vercel** (`/api/*`) + **Neon
Postgres**. Le client n'accède jamais à la DB directement : il appelle `/api/*`,
et toute la logique de confiance/anti-abus vit côté serveur (spec §8).

```
  navigateur ──► /api/report ──► Neon (votes → cell_state, TTL, confiance)
             └─► /api/states ◄── (polling toutes les ~20 s)
```

## Lancer en local

```bash
npm install
npm run dev      # http://localhost:5173  (mode démo, sans backend)
npm run build    # build de production dans dist/
```

En `vite dev`, les routes `/api` ne tournent pas → le **mode démo** local
(`devstore.js`) prend le relais pour tester toute l'UX hors-ligne. Pour tester
le vrai backend en local : `vercel dev` (avec un `.env` rempli).

## Déploiement (Vercel + Neon)

1. Créer une base **Neon**, puis appliquer le schéma :
   `psql "$DATABASE_URL" -f db/schema.sql`
2. Importer le repo dans **Vercel** (framework détecté : Vite).
3. Renseigner les variables d'env (voir `.env.example`) :
   - serveur : `DATABASE_URL`, `TURNSTILE_SECRET_KEY`, `IP_HASH_SALT`
   - client : `VITE_USE_API=1`, `VITE_TURNSTILE_SITE_KEY`
4. Déployer. Le front et les `/api/*` sont servis depuis le même domaine.

## Ce qui est fait côté backend

- [x] `db/schema.sql` — `votes`, `cell_state`, `steg_announcements`, `devices`.
- [x] `POST /api/report` — **la vraie sécurité** : zone dérivée du **GPS côté
      serveur**, Turnstile vérifié, IP hashée, rate-limit 1 vote/10 min,
      recalcul de `cell_state` (seuil **N ≥ 3 appareils distincts**, TTL 45 min).
- [x] `GET /api/states` — états non expirés (le client poll toutes les ~20 s).
- [x] `POST /api/suggest-zone` — propositions de zones manquantes, mises en file
      `pending` (jamais affichées live) → vérification avant promotion.

### Reste à faire

- [ ] Croisement **ASN** : rejeter les ASN non-résidentiels TN (§7.2) et déduire
      mobile-vs-fixe pour le signal connexion↔déclaration (`TODO(asn)` dans
      `api/report.js`).
- [ ] `scrape-steg` (cron Vercel) — couche « annoncé » **séparée**.
- [ ] Remplacer les zones "Grand Tunis" par la **liste exacte du concurrent**.

## Stack

Vanilla JS + Vite · MapLibre GL (carte) · **Neon** (Postgres serverless) ·
**Vercel** (hébergement + routes API) · Cloudflare Turnstile (anti-bot).
