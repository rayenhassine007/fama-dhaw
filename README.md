# Dhaw — coupures d'électricité en Tunisie

Où l'électricité est coupée en Tunisie, en temps réel — signalé par les
habitants, zone par zone. Voir [`CLAUDE.md`](./CLAUDE.md) pour la vision, les
principes non négociables et la roadmap.

Ce dépôt est une **réécriture depuis zéro**. Le concept : reprendre l'UX
familière du concurrent (liste des zones + boutons « ça marche / coupé »), mais corriger
sa plus grosse faille — **le GPS verrouille chaque personne à sa propre zone**,
donc on ne peut signaler que là où l'on se trouve physiquement.

## Ce qui est fait (V1 — front)

- **Une seule page** : « Ma zone » épinglée en haut, puis **les 375 zones du pays**
  groupées par gouvernorat, chacune avec sa pastille d'état, ses compteurs
  (coupé / courant), sa fraîcheur. Aucune recherche nécessaire pour voir le reste
  du pays — la recherche (accent-insensible) ne fait que **filtrer**.
- **Taper une zone la déplie** : détail des votes et du niveau de confiance.
- **Géoloc tolérante** (voir ci-dessous) → zone, puis **signalement 1 tap** dont
  les boutons n'apparaissent **que dans ta zone GPS**. Les autres zones sont
  consultables, jamais votables. Cooldown 10 min / appareil (le serveur
  ré-impose la vraie limite).
- **TTL** : les signalements expirent (~45 min) → une fausse donnée disparaît seule.
- **Mode démo** : sans backend configuré, une simulation locale (`devstore.js`)
  fait tourner toute l'UX (vote, TTL, confiance) pour tester hors-ligne.

### Deux façons de fixer sa zone : le GPS, ou le choix à la main

- **« 📍 Trouver ma zone »** (GPS) — la seule qui débloque le signalement, parce
  que c'est la seule qui prouve qu'on est sur place.
- **« 📌 Choisir cette zone comme la mienne »** — un vrai bouton dans chaque zone
  dépliée. Épingle la zone en haut pour la suivre, sans droit de vote.

> **Géoloc par IP : essayée, retirée.** Une route `/api/where` déduisait la zone
> des en-têtes `x-vercel-ip-*`, sans aucune permission. Testée en conditions
> réelles : beaucoup trop imprécise. Les opérateurs tunisiens sont en CGNAT, donc
> l'IP pointe vers leur point de sortie quelle que soit la position réelle (§12).
> Supprimée plutôt que gardée comme approximation trompeuse.

### Géolocalisation : on garde le meilleur point, on ne rejette plus

Une lecture unique (`getCurrentPosition`) suivie d'un rejet au-delà de 1 km ne
marchait **pas** sur de vrais téléphones : le premier point renvoyé est presque
toujours l'estimation wifi/antenne (1–3 km), la puce GPS n'affine qu'après
quelques secondes. Les gens accordaient la permission et lisaient quand même
« position trop imprécise ».

Maintenant (`src/lib/geoloc.js`, `getBestPosition`) : on **surveille** la position
jusqu'à 12 s en gardant le meilleur point, avec arrêt anticipé dès qu'on a un
vrai point GPS (≤ 120 m). Et on ne rejette plus jamais sèchement :

| Précision obtenue | Comportement |
|---|---|
| ≤ 500 m | zone ancrée directement, sans rien demander |
| 500 m – 2 km | on ancre, mais on fait **confirmer** parmi les zones proches |
| > 2 km | l'utilisateur **choisit** sa zone parmi les candidates plausibles |
| refus / aucun point | message clair, la liste reste entièrement consultable |

**Ça n'ouvre pas la porte à la triche.** Quand l'utilisateur désambiguïse à la
main, le client joint son `zone_id`, mais le serveur ne l'accepte que si cette
zone tombe dans le **rayon d'incertitude du GPS envoyé** (`zonesNear` +
`candidateRadiusKm`, calculés à l'identique des deux côtés). Un point à ± 40 m
n'ouvre que les 2 zones limitrophes ; une zone à 1,3 km est refusée ; Sousse
depuis Tunis est refusée. Le principe §8 tient : **la zone reste dérivée du GPS
côté serveur**, on autorise seulement l'humain à trancher *à l'intérieur de sa
propre marge d'erreur*.

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
- [x] `GET /api/states` — états non expirés (le client poll toutes les ~20 s),
      avec les compteurs **« coupé » vs « courant »** par zone, calculés à la
      volée depuis `votes` (donc **aucune migration SQL** à lancer).
- [x] `POST /api/suggest-zone` — propositions de zones manquantes, mises en file
      `pending` (jamais affichées live) → vérification avant promotion.

### Reste à faire

- [ ] Croisement **ASN** : rejeter les ASN non-résidentiels TN (§7.2) et déduire
      mobile-vs-fixe pour le signal connexion↔déclaration (`TODO(asn)` dans
      `api/report.js`).
- [ ] `scrape-steg` (cron Vercel) — couche « annoncé » **séparée**.
- [ ] **Pondérer la confiance par la précision GPS** : un vote posé sur un point
      à ± 2,8 km (désambiguïsé à la main) pèse aujourd'hui autant qu'un vote à
      ± 40 m. `gps_accuracy` est déjà stocké dans `votes` ; il reste à s'en servir
      dans `recomputeState` (§2.3).
- [ ] Affiner les centroïdes des zones avec de la vraie data TN — surtout les
      micro-quartiers de Tunis, où le plus-proche-voisin se trompe facilement.
- [ ] Activer **Turnstile** avant un vrai lancement public (clés volontairement
      vides pour l'instant → la vérification est court-circuitée côté serveur).

## Stack

Vanilla JS + Vite · **Neon** (Postgres serverless) · **Vercel** (hébergement +
routes API) · Cloudflare Turnstile (anti-bot).
