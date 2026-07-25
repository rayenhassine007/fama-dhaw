# Déploiement (Vercel + Neon)

On déploie depuis `main`. Chaque push sur `main` redéploie le site en Production.
Vercel garde chaque déploiement : on peut tester l'URL avant de la partager, et
revenir à un déploiement précédent en un clic si besoin.

## 1. Importer le repo dans Vercel
Vercel → **Add New… → Project** → importer `hassineabd/fama-dhaw`.
Framework détecté : **Vite** (ne rien changer au build) → **Deploy**.

## 2. Base de données Neon
Projet → **Storage → Create Database → Postgres (Neon) → Create & Connect**.
Ça ajoute la variable `DATABASE_URL`. Vérifier qu'une variable nommée
exactement `DATABASE_URL` existe (sinon l'ajouter avec la même valeur).

## 3. Variables d'environnement
Projet → **Settings → Environment Variables** (cocher **Production**) :

| Nom | Valeur | Notes |
|-----|--------|-------|
| `VITE_USE_API` | `1` | lu **au build** → redéployer après ajout |
| `IP_HASH_SALT` | *(chaîne aléatoire longue)* | ex. `openssl rand -hex 24` — **ne pas** committer |
| `DATABASE_URL` | *(fournie par Neon à l'étape 2)* | connexion Postgres |
| `VITE_TURNSTILE_SITE_KEY` | *(vide pour l'instant)* | anti-bot public, avant lancement |
| `TURNSTILE_SECRET_KEY` | *(vide pour l'instant)* | anti-bot serveur, avant lancement |

Sans clé Turnstile, la vérification anti-bot est simplement sautée (OK pour tester).

## 4. Créer les tables
Ouvrir Neon (Storage → **Open in Neon**) → **SQL Editor** → coller tout
[`db/schema.sql`](db/schema.sql) → **Run**.

## 5. Tester puis partager
Après le déploiement, Vercel donne une URL. La tester (géoloc, recherche,
signalement, ajout de zone) avant de la partager largement. Chaque nouveau push
sur `main` crée un nouveau déploiement ; l'ancien reste accessible en rollback.

## Mode démo (sans backend)
Si `VITE_USE_API` n'est **pas** mis à `1`, le client tourne en simulation
locale (localStorage) : toute l'UX marche sans base de données — pratique pour
un test rapide de l'interface.
