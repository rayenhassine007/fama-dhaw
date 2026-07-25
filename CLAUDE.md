# CLAUDE.md — Projet « Carte des coupures d'électricité (Tunisie) »

> Ce fichier est lu automatiquement par Claude Code. Il sert aussi de spec de référence
> pour tout dev qui rejoint le projet. **Lis-le en entier avant de coder.**
> Nom de code temporaire : `dhaw-map`. Nom public à décider.

---

## 0. TL;DR (pour aller vite)

On construit un site web qui montre **où l'électricité est coupée en Tunisie, en temps réel**,
plus fin et plus honnête que le concurrent (Famma Dhaw).

- **V1 = 1 week-end.** Carte + page « Ma zone » + signalements citoyens + scraping des
  communiqués STEG. Rien de plus.
- **Différenciateur clé** : granularité **quartier** (hexagones H3, pas des « zones » figées)
  + **niveau de confiance affiché** (pas un simple rouge/vert) + une vraie page perso « Ma zone ».
- **On ne touche JAMAIS** au réseau/SCADA de la STEG. Toute la donnée est **mesurée de
  l'extérieur** (signalements + capteurs publics) ou **publique** (communiqués). Voir §2.
- **On itère.** La V1 est volontairement minimale. La roadmap (§6) vient après.

---

## 1. Contexte & objectif

**Le problème.** Été 2026 : canicule, la STEG fait des délestages tournants quotidiens.
Ses communiqués Facebook sont contestés (zones annoncées mais épargnées, zones coupées mais
non annoncées), horaires flous, et surtout ils raisonnent au niveau **localité entière** alors
qu'une coupure ne suit **jamais** les limites administratives : dans une même municipalité, une
moitié peut être coupée et l'autre alimentée.

**Ce que les gens veulent vraiment savoir** (par ordre d'importance) :
1. « Est-ce coupé **chez moi** en ce moment ? »
2. « **Quand** ça revient ? »
3. « Est-ce que ça va couper chez moi **aujourd'hui**, et à quelle heure c'est risqué ? »
4. « Où y a-t-il du courant à côté ? » (pour aller recharger / bosser)

La carte nationale répond surtout à la question la moins fréquente. **La vraie valeur est la
page perso + les alertes.** On garde ça en tête pour tout le design.

**Le concurrent (Famma Dhaw).** Lancé le 22/07/2026, 100 % déclaratif (les gens votent), ~300
zones prédéfinies, règles simples (verrou 10 min, expiration 45 min, validation à la majorité),
200 000 signalements le 1er jour. Fort effet réseau + toute la presse. **On ne le bat pas en
copiant.** On le bat sur : granularité (hexagones vs zones), historique/prédiction, honnêteté
de la donnée (niveau de confiance), et features perso (Ma zone + push).

---

## 2. Concerns & principes directeurs (NON NÉGOCIABLES)

Ces règles priment sur toute décision technique. Si un choix les contredit, c'est le choix qui saute.

1. **Zéro donnée interne STEG / SCADA.** Pas d'accès réseau opérateur, pas de « données brutes »
   obtenues de façon informelle. Raison produit (pas seulement légale) : une donnée qu'on ne peut
   ni citer, ni sourcer, ni montrer à un journaliste **n'a aucune valeur** ici. Toute notre valeur
   repose sur la **crédibilité** de la donnée. On mesure de l'extérieur, on cite nos sources.

2. **Le GPS/signalement est une DÉCLARATION, jamais une PREUVE.** N'importe qui peut mentir.
   La confiance vient **du croisement** de plusieurs signaux, jamais d'un signalement isolé.
   Voir §7 (anti-abus).

3. **On n'affiche jamais un booléen. On affiche un niveau de confiance.**
   `« Coupé — 14 signalements, 9 lignes distinctes »` vs `« Signalé — non confirmé »`.
   C'est ce qui nous protège le jour où la presse cite nos chiffres.

4. **On ne dépend pas de la présence des gens.** Un site qu'on visite 30 s ne peut pas être le
   seul capteur. Les sources qui tournent **sans visiteur** (scraping STEG en V1 ; capteurs
   publics plus tard) portent le système ; les signalements **affinent**.

5. **Ça doit marcher PENDANT une coupure.** Quand le courant saute, la 4G se dégrade. Le site
   doit rester ultra-léger et utilisable en connexion pourrie. Pas de dépendance lourde au
   chargement, page de secours en texte quasi sans JS.

6. **Honnêteté > précision affichée.** On ne prédit jamais un horaire « à la minute » (voir §6.4 :
   personne, pas même la STEG, ne le connaît à l'avance). On parle en **probabilité / fenêtre de
   risque / ordre de rotation**.

---

## 3. Périmètre de la V1 (et seulement ça)

Objectif : **release en un week-end**, simple, mais déjà mieux que le concurrent.

**Inclus V1 :**
- [ ] **Page « Ma zone »** (écran d'accueil, PAS la carte) : gros statut, « coupé depuis X »,
      dernier changement, fenêtre à risque du jour (basique).
- [ ] **Géoloc → cellule H3** au premier usage, avec filtre de précision (§5).
- [ ] **Signalement** : 2 boutons « Y a du courant » / « Coupé », géolocalisé.
- [ ] **Carte** (onglet secondaire) : hexagones H3 colorés selon l'état agrégé + niveau de confiance.
- [ ] **Scraping des communiqués STEG** (couche « annoncé »), affichée séparément des signalements.
- [ ] **Anti-abus minimal** : Turnstile + rate-limit + N≥3 appareils distincts + TTL 45 min (§7).
- [ ] **Sélection manuelle de zone** en fallback si géoloc imprécise ou refusée.

**Explicitement HORS V1** (ne pas se disperser) : push notifications, bot Telegram, prédiction
météo, capteurs passifs, historique long, comparaison annoncé-vs-réel, eau/SONEDE. Tout ça = §6.

**Critère de « fini » pour la V1** : un habitant du Grand Tunis ouvre le site sur son tel, voit
l'état de sa zone en < 5 s, peut signaler en 1 tap, et voit la carte des hexagones autour de lui.

---

## 4. Architecture (vue d'ensemble)

### 4.1 Le maillage : hexagones H3, pas des zones administratives

C'est le cœur technique et le **plus simple**, pas le plus compliqué.

- On pose une grille H3 (standard open-source, ex-Uber) sur toute la Tunisie.
- **Résolution 8** (~0,7 km², échelle quartier) = unité d'affichage/agrégation par défaut.
- Un point GPS → un ID de cellule en **une ligne** : `h3.latLngToCell(lat, lng, 8)`.
- Zéro shapefile, zéro polygone à maintenir, zéro calcul « ce point est-il dans cette commune ».
- Pour dézoomer : chaque cellule rés. 8 a un **parent rés. 7** → agrégation gratuite (`cellToParent`).
- **Pourquoi ça règle le problème des coupures partielles** : l'unité est plus petite que la zone
  coupée, donc dans une même municipalité certains hexagones sont rouges et d'autres verts. La
  forme réelle de la coupure émerge des votes, **sans connaître la topologie du réseau** (comme
  une image qui apparaît pixel par pixel).

### 4.2 Les sources de données (par fiabilité)

| # | Source | Dispo | Ce qu'elle donne | Statut |
|---|--------|-------|------------------|--------|
| 1 | **Scraping communiqués STEG** (Facebook/site) | Jour 1, sans visiteur | « annoncé » niveau localité | **V1** |
| 2 | **Signalements citoyens** géolocalisés | dès qu'il y a du trafic | « réel » niveau hexagone | **V1** |
| 3 | Capteurs publics (RIPE Atlas, IODA, Cloudflare Radar) | Jour 1, sans visiteur | confirmation macro (gouvernorat) | V2 |
| 4 | Sonde IP passive sur box enrôlées (visite unique GPS+IP) | après enrôlement | « réel » automatique, latence ~1 min | V2/V3 |
| 5 | Imagerie nocturne VIIRS (NASA) | public | **historique** (quels quartiers s'éteignent souvent) | V3 |

En V1 on ne fait que **1 + 2**. Le reste est documenté pour que l'archi ne se peigne pas dans un coin.

### 4.3 Le calcul de l'état d'une cellule

Un état de cellule = agrégat de signaux, avec **niveau de confiance** et **TTL**.

- État `COUPÉ` si ≥ 3 signalements « coupé » d'**appareils ET d'IP distincts** dans une fenêtre
  glissante (ex. 30 min), majoritaires vs les « courant ».
- État `INCONNU` (gris) si aucune donnée fraîche depuis ~45–60 min. **Le TTL est notre meilleure
  amie** : une fausse donnée expire toute seule.
- Le niveau de confiance monte avec : nb de signalements, nb de lignes distinctes, cohérence
  spatiale (voisins), confirmation par sources machine (plus tard).
- La couche « annoncé STEG » est **une couche séparée** (jamais fusionnée avec le « réel »).

---

## 5. Géolocalisation (détails qui comptent)

On n'a besoin que **d'une seule bonne lecture** par utilisateur (ancrer position → cellule). Donc
on peut être exigeant et **jeter les lectures imprécises**.

```js
navigator.geolocation.getCurrentPosition(ok, err, {
  enableHighAccuracy: true,   // force le GPS, sinon 100 m–3 km, inutilisable
  timeout: 10000,
  maximumAge: 0
});
```

- **HTTPS obligatoire** (Chrome bloque la géoloc en HTTP).
- **Ne jamais demander la permission au chargement.** Demander après un clic sur « Ma zone »,
  avec une phrase d'explication avant le prompt natif (sinon taux de refus énorme).
- **Filtrer sur `coords.accuracy`** (rayon en mètres, la clé de tout) :
  - `< 200 m` → on ancre en **H3 rés. 8**.
  - `200–1000 m` → on ancre en **rés. 7** (zone plus large, honnête).
  - `> 1000 m` → on **jette** et on propose la sélection manuelle sur carte.
- Android Chrome (majorité du trafic TN) : très bon avec `enableHighAccuracy`. iOS Safari marche
  aussi mais si « Position précise » est off pour Safari → 1–5 km (le filtre `accuracy` l'attrape).

---

## 6. Roadmap post-V1 (ordre de priorité)

### 6.1 Alertes (LA feature de rétention — priorité n°1 après V1)
**Web Push** (API standard + service worker, natif sur Chrome Android, site fermé) : notif quand
ta zone passe `coupé`/`rétabli`, et quand ta zone apparaît dans un communiqué STEG scrapé.
En parallèle, **bot Telegram** pour ceux qui préfèrent s'abonner là. C'était le cœur d'EskomSePush
(Afrique du Sud), pas leur carte.

### 6.2 Historique & visualisation « status page »
Barre d'**uptime par zone** (une ligne par jour, segments verts/rouges par heure, comme un
monitoring). En un coup d'œil : « ma zone a pris 3 coupures hier, toujours entre 11h et 16h ».

### 6.3 Récap national partageable
Image auto-générée chaque soir (« 265/298 zones touchées, pic à 14h, top 5 gouvernorats »).
La Tunisie vit sur Facebook → boucle de distribution gratuite + les journalistes reprennent les chiffres.

### 6.4 Prédiction (modèle EMPIRIQUE, pas réplication de leur logiciel)
On ne réplique pas le SCADA. On **apprend** de nos propres observations :
- **« Quand » (fenêtre de risque)** : régresser la charge/déficit sur la **météo** (temp = clim) +
  l'heure. Données publiques + prévisions météo → niveau de risque du jour, heure par heure.
- **« Où / dans quel ordre » (rotation)** : reconstruire la **table de rotation par observation**.
  Si la cellule X coupe systématiquement 45 min après la cellule Y, on a découvert leur séquence de
  blocs **sans voir leur SCADA**. Après quelques semaines, notre historique *est* le programme de
  délestage, reconstruit de l'extérieur.
- **Affichage honnête** : « ta zone : risque élevé aujourd'hui 13h–16h, tu coupes après El Manar ».
  Jamais un faux horaire précis (leur décision dépend de la fréquence réseau à l'instant T, que
  personne ne connaît la veille — d'où leurs « liste non définitive / sans préavis »).

### 6.5 Capteurs passifs (couverture sans visiteur)
- **Enrôlement à la 1re visite** : lier `GPS → cellule H3 → IP publique de la box`. Ensuite le
  **serveur** sonde cette IP toutes les 60 s (TCP, pas ICMP), même utilisateur parti. Box muette +
  voisins du même FAI qui répondent = coupure locale. N'enrôler que les visites **wifi** (mobile TN
  en CGNAT, inutilisable). IP dynamiques → chaque visite rafraîchit le parc.
- **RIPE Atlas / IODA / Cloudflare Radar** : APIs publiques gratuites, confirmation **macro**
  (gouvernorat) dès le jour 1.
- **Sentinelles** : un **vieux téléphone Android** branché, onglet ouvert = sonde parfaite (jamais
  throttlée au premier plan, détection ~60 s). Recruter 10 volontaires via l'app avant tout hardware.

### 6.6 Extensions
- **Eau (SONEDE)** : crise jumelle, même infra de signalement, zéro concurrent.
- **Comparatif « annoncé vs réel »** : croiser communiqués STEG et signalements → donnée
  d'accountability que la presse s'arrache.
- **Demande d'accès à l'info (loi 2016-22)** : la STEG est un établissement public → obligation de
  répondre sous 20 j, gratuit, recours INAI. Demander le **programme de délestage structuré** + les
  **stats historiques** (pas la topologie réseau — ils invoqueront l'exception sécurité). Angle de
  pitch : « je rends vos communiqués crédibles », pas « je vous surveille ».

---

## 7. Anti-abus (parce que n'importe qui peut mettre n'importe quoi)

Empilé, du plus efficace au moins :

1. **Aucun signalement isolé ne change l'état.** Cellule `coupée` seulement avec **N ≥ 3–5**
   appareils distincts **ET IP distinctes** dans une fenêtre courte. Un vote seul = « non confirmé »,
   hors des stats publiques. Tue ~90 % du bruit.
2. **Cohérence GPS ↔ IP.** Géoloc de l'IP au niveau ASN : GPS dit Ariana mais IP = datacenter/VPN/
   FAI étranger → **rejet**. N'accepter que les **ASN résidentiels tunisiens** (TT, Topnet, Ooredoo,
   Orange TN).
3. **Validation par capteurs machine** (quand dispo, §6.5) : si 5 personnes crient « coupé » mais les
   box de la cellule répondent encore et aucun voisin ne bouge → ignorer. Les humains proposent, les
   sondes disposent.
4. **Plausibilité spatiale.** Un hexagone rouge isolé entouré de 6 verts actifs = physiquement
   improbable → flag. Les vrais délestages arrivent par **paquets contigus**.
5. **Réputation par appareil.** Identifiant persistant (cookie signé + localStorage) : les appareils
   dont les signalements passés ont été confirmés pèsent plus ; un nouveau pèse ~0. Aucun compte requis.
6. **Cloudflare Turnstile + rate-limit** : 1 vote / appareil / 10 min, plafond par IP et par /24.
7. **TTL 45 min** : le mensonge ne persiste pas.

---

## 8. Stack technique (simple, gratuit/pas cher, rapide à shipper)

| Brique | Choix | Pourquoi |
|--------|-------|----------|
| Hébergement front + API | **Vercel** (statique + routes serverless `/api`) | front léger + fonctions serveur au même endroit, déploiement simple |
| Carte | **MapLibre GL JS** | open-source, pas de clé Google, léger |
| Zonage | **Zones nommées** (centroïdes, plus proche voisin) | reprend l'UX du concurrent ; GPS→zone en 1 calcul, aucun polygone à héberger |
| Backend / DB | **Neon** (Postgres serverless) | fit parfaitement Vercel ; pas de realtime intégré → **polling** (~20 s), OK vu le TTL |
| Anti-bot | **Cloudflare Turnstile** | invisible, gratuit |
| Scraping STEG | Cron Vercel + parsing **LLM** + géocodage | robuste aux formats de communiqués variables |

> **Note d'évolution.** La spec d'origine visait une grille **hexagonale H3** + **Supabase**.
> Décision produit ultérieure : reprendre le modèle **zones nommées** du concurrent (plus familier)
> et **Neon + Vercel** côté infra. Le reste des principes (§2) reste inchangé.

**Principes de code :**
- **Mobile-first, ultra-léger.** Budget JS serré (doit charger en 4G dégradée). Pas de gros framework
  si vanilla suffit. Une page de secours texte quasi sans JS.
- **Mise à jour de l'état par polling** (~20 s) depuis `/api/states` — Neon n'a pas de realtime
  intégré ; acceptable car les états changent lentement et le TTL borne tout. (SSE possible plus tard.)
- **Toute la logique de confiance côté serveur** (routes `/api` + SQL). Le client n'agrège rien
  de sensible ; il ne fait qu'afficher.
- La **zone est dérivée du GPS côté serveur**, jamais envoyée par le client (sinon on peut
  spammer un quartier où on n'est pas).

---

## 9. Modèle de données (première ébauche)

```sql
-- Signalements bruts
votes (
  id            bigserial pk,
  cell_h3       text not null,          -- calculé SERVEUR à partir du GPS
  state         text not null,          -- 'up' | 'down'
  device_id     text not null,          -- id persistant (cookie signé)
  ip_hash       text not null,          -- IP hashée (pas de PII brute)
  asn           text,                   -- pour la cohérence GPS↔IP
  gps_accuracy  int,                    -- mètres
  created_at    timestamptz default now()
)

-- État agrégé par cellule (vue matérialisée OU table rafraîchie)
cell_state (
  cell_h3     text pk,
  state       text,                     -- 'down' | 'up' | 'unknown'
  confidence  int,                      -- 0..100
  n_reports   int,
  n_distinct  int,                      -- appareils/lignes distincts
  updated_at  timestamptz,
  expires_at  timestamptz               -- TTL
)

-- Couche "annoncé" (SÉPARÉE du réel)
steg_announcements (
  id           bigserial pk,
  raw_text     text,
  cells        text[],                  -- hexagones géocodés depuis les localités
  window_start timestamptz,
  window_end   timestamptz,
  source_url   text,
  scraped_at   timestamptz default now()
)

-- Réputation appareil
devices (
  device_id   text pk,
  reputation  int default 0,
  first_seen  timestamptz default now(),
  asn         text
)
```

---

## 10. Design / UX

- **Écran d'accueil = « Ma zone »**, pas la carte. Gros statut lisible, couleur + texte (accessibilité).
- **Carte = onglet secondaire.** Hexagones colorés, opacité/teinte = niveau de confiance.
- **Toujours montrer la confiance et la fraîcheur** : « mis à jour il y a 4 min », « 9 lignes distinctes ».
- **Couche STEG togglable** et visuellement distincte (ex. hachures) du « réel citoyen ».
- **Darija-friendly** : le concurrent s'appelle « Famma Dhaw » (il y a de la lumière) pour une raison —
  parler la langue des gens. Copy en dialecte tunisien + FR.
- **Signalement en 1 tap.** Pas de formulaire.

---

## 11. Guidelines pour le dev (frère junior) — lire absolument

- **Commence par la V1 (§3) et RIEN d'autre.** La roadmap est une carte, pas une todo. Chaque
  feature en plus retarde le release. On ship, puis on itère.
- **Respecte les 6 principes du §2 même sous pression.** Surtout : jamais de booléen sans confiance,
  jamais de dépendance à la présence des gens, la cellule H3 se calcule côté serveur.
- **Quand tu hésites sur un choix technique**, prends le plus simple qui respecte le §2. « Mieux que
  Famma Dhaw » ne veut pas dire « plus complexe » : ça veut dire plus fin (H3) + plus honnête (confiance).
- **Ne construis pas pour le pic actuel.** La demande est événementielle (canicule) et s'effondrera.
  Construis pour la **récurrence** (chaque été + pannes ordinaires toute l'année).
- **Sécurité de base** : jamais d'IP brute stockée (hash), jamais de PII, Turnstile + rate-limit dès la V1.
- **Pièges connus** :
  - Géoloc au chargement = refus massif → toujours après un clic.
  - Ne pas filtrer `accuracy` = hexagones faux → filtrer strict (§5).
  - Fusionner « annoncé STEG » et « réel citoyen » = perte de crédibilité → garder séparé.
  - Oublier le TTL = fausses données persistantes → expiration obligatoire.
- **Demande à Claude Code** de scaffolder : projet Cloudflare Pages + client Supabase + intégration
  MapLibre + h3-js + Turnstile, en suivant ce fichier. Puis implémente §3 dans l'ordre de la checklist.

---

## 12. Ce qu'on ne fait PAS (pour couper court aux débats)

- Pas d'accès SCADA / réseau STEG, sous aucune forme.
- Pas de scraping de masse d'IP résidentielles au hasard (serveur suspendu en 1 semaine + géoloc IP
  trop grossière en TN → niveau gouvernorat au mieux). Le passif viable, c'est l'enrôlement GPS+IP (§6.5).
- Pas de prédiction d'horaire « à la minute » (malhonnête et impossible).
- Pas de compte utilisateur en V1 (friction inutile). Identité = device_id anonyme.
