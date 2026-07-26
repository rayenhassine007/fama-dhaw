# Dhaw — coupures d'électricité en Tunisie

Où l'électricité est coupée en Tunisie, en temps réel — signalé par les
habitants, zone par zone. Voir [`CLAUDE.md`](./CLAUDE.md) pour la vision, les
principes non négociables et la roadmap.

Ce dépôt est une **réécriture depuis zéro**. Le concept : reprendre l'UX
familière du concurrent (liste des zones + boutons « ça marche / coupé »), mais corriger
sa plus grosse faille — **le GPS verrouille chaque personne à sa propre zone**,
donc on ne peut signaler que là où l'on se trouve physiquement.

## Ce qui est fait (V1 — front)

- **Une seule page** : « Ma zone » épinglée en haut, puis **les 377 zones du pays**
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

### La carte (onglet secondaire)

Carte de la Tunisie **en SVG pur** : aucune tuile, aucune librairie, aucune clé
de service. Le contour du pays (Natural Earth 1:50m, domaine public) est embarqué
en dur — 3 ko — parce que la carte doit s'afficher **pendant** une coupure, quand
le réseau est saturé (§2.5). Le module entier ne pèse que ~4 ko gzip et n'est
chargé qu'au premier clic sur l'onglet.

Une pastille par zone, colorée : 🔴 coupé · 🟢 courant · 🟡 par endroits ·
⚫ pas d'info. Glisser pour se déplacer, pincer ou double-taper pour zoomer, et
**les noms de zones apparaissent une fois zoomé**. Taper une zone ouvre sa fiche.
Un champ **« Aller à une zone »** centre la carte sur la zone cherchée.

> **Les noms qui se chevauchent sont masqués.** Aucun zoom ne suffit à les
> séparer : nos centroïdes sont parfois distants de 556 m (les « Route de… » de
> Sfax) voire 142 m (Médina et Hafsia à Tunis). On place donc les noms par ordre
> d'importance — ta zone d'abord, puis les coupures — et on saute ceux qui
> recouvriraient un nom déjà posé. La zone sélectionnée garde toujours le sien.

> **Pourquoi des pastilles et pas des zones remplies.** On ne connaît que le
> centre *approximatif* de chaque zone, pas ses frontières. Remplir la carte de
> polygones dessinerait des limites inventées que les gens croiraient vraies —
> la frontière calculée entre Oudhref et Métouia passe en plein milieu
> d'Oudhref. Une pastille ne prétend rien d'autre que « par ici ».

### Historique par zone (§6.2)

Bouton **« 🕒 Voir l'historique (24 h) »** dans le détail d'une zone, sur la liste
comme sur la carte. Une barre façon page de statut, un segment par 15 min :
rouge sans lumière, vert avec, jaune par endroits, gris quand personne n'a
signalé.

Rien n'avait été prévu pour ça et pourtant tout était là : la table `votes`
n'est **jamais purgée** — seule la fenêtre glissante décide de ce qui compte pour
l'état *courant*. `GET /api/history?zone=…&hours=24` reconstitue donc chaque
créneau avec la **même** fenêtre de 45 min et la **même** règle d'agrégation : la
barre montre exactement ce que l'app aurait affiché à ce moment-là.

Les trous ne sont pas comblés. Une zone dont personne n'a parlé reste grise, et
le résumé le dit — « 4 h 15 sans lumière · 34 % de la période documentée » — au
lieu d'annoncer « 0 % de coupure » pour une zone qu'on n'a simplement pas vue.

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

S'y ajoute `isAmbiguous()` : quand deux zones sont à distance quasi égale, on
demande **même avec un point parfait**. Nos centroïdes étant approximatifs, la
frontière peut tomber en plein milieu d'une ville — c'est exactement ce qui
envoyait quelqu'un d'Oudhref sur Métouia.

**Ça n'ouvre pas la porte à la triche.** Quand l'utilisateur désambiguïse à la
main, le client joint son `zone_id`, mais le serveur ne l'accepte que s'il figure
dans `acceptableZones(lat, lng, accuracy)` — la même fonction des deux côtés. Son
rayon cumule les trois incertitudes réelles : distance à la zone la plus proche,
précision GPS, et imprécision de nos propres centroïdes (celle-ci proportionnelle
à la densité locale, bornée à 0,4–3,5 km). Depuis Tunis centre avec un bon point,
**3 zones** seulement sont acceptables ; Sousse, Sfax et l'Ariana sont refusées.

Mesuré sur les 377 zones, en décalant le point dans 8 directions : la vraie zone
reste proposée dans **100 %** des cas à ± 40 m et ± 1 km, **98,5 %** à ± 2 km. Le
principe §8 tient — **la zone reste dérivée du GPS côté serveur**, on autorise
seulement l'humain à trancher *à l'intérieur de sa propre marge d'erreur*.

### Le modèle « zones »

Zones = **la liste nationale complète du concurrent** (377 zones, tous les
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

## La règle d'agrégation : **un appareil = une voix**, une connexion en vaut 2 au plus

> **Faille trouvée en test.** Le `device_id` vit dans `localStorage`, dont la
> navigation privée a un stock vierge : un seul téléphone fabriquait autant
> d'« appareils distincts » qu'il ouvrait d'onglets.
>
> On ne peut pas exiger des IP toutes distinctes — une famille partage la box, et
> les opérateurs mobiles sont en **CGNAT**, donc des milliers d'abonnés sortent
> par la même adresse. Le compromis retenu : **une connexion porte au plus 2
> voix**. Un couple sur la même box compte pleinement, cinq onglets privés ne
> valent que 2, et surtout **une seule connexion ne peut jamais confirmer une
> zone** — il en faut au moins deux. Ça sépare au passage « le quartier est
> coupé » de « mon disjoncteur a sauté ».
>
> Ce n'est pas infaillible : quelqu'un qui alterne wifi et données mobiles a deux
> connexions. Sans compte utilisateur, la résistance parfaite n'existe pas — d'où
> le principe du §7, empiler des mesures imparfaites plutôt qu'en chercher une
> absolue.


Seul le **dernier** signalement de chaque appareil compte dans la fenêtre de
45 min. Deux conséquences voulues :

- quelqu'un qui revote parce que le courant est revenu **remplace** son avis
  précédent au lieu de s'ajouter à lui-même ;
- voter en boucle depuis un seul téléphone ne pèse pas plus lourd qu'une seule
  personne — sinon le seuil « N appareils distincts » (§7.1) ne voudrait rien dire.

L'état affiché est celui qui réunit **le plus d'appareils distincts**. À égalité
stricte, c'est le signalement le **plus récent** qui tranche (un retour de courant
est l'information la plus fraîche) et la confiance chute pour dire que c'est
contesté. Une zone n'est « confirmée » que si elle a **≥ 3 appareils ET la
majorité** : 3 contre 3 reste contesté.

### Rate-limit : par appareil, pas par IP

Les deux limites sont **séparées**, et ça compte : en Tunisie une IP ne désigne
pas une personne. Une famille partage la box, et les opérateurs mobiles sont en
**CGNAT** — des milliers d'abonnés sortent par la même adresse.

| Limite | Valeur | Rôle |
|---|---|---|
| par **appareil** | 1 signalement / 10 min | la vraie limite anti-spam |
| par **IP** | 40 / 10 min | simple garde-fou anti-inondation |

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
