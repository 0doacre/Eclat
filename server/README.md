# Comptes joueurs : installer le serveur

Les comptes permettent à un joueur de retrouver sa partie sur un autre appareil, avec un pseudo et un mot de passe. Pas besoin de compte GitHub pour les joueurs.

Le jeu lui-même reste un simple site (GitHub Pages). Les comptes ont besoin d’un petit serveur à côté : ce dossier contient tout ce qu’il faut pour l’installer gratuitement chez **Cloudflare** (offre gratuite, sans carte bancaire). Compte une vingtaine de minutes, tout se fait dans le navigateur.

Tant que le serveur n’est pas installé, le jeu marche comme avant : le menu « Compte en ligne » explique simplement que les comptes ne sont pas encore ouverts.

## Ce que le serveur sait (et ne sait pas)

- Le mot de passe ne quitte jamais l’appareil du joueur. Le jeu en tire deux clés : une pour se connecter (le serveur n’en garde qu’une empreinte), une pour chiffrer la sauvegarde.
- La sauvegarde est chiffrée sur l’appareil avant l’envoi. Le serveur ne stocke que du texte illisible, il ne peut pas la lire.
- Revers de la médaille : **un mot de passe oublié ne se récupère pas**. Les copies en ligne sont alors perdues, mais celle de l’appareil reste intacte. Le jeu le dit au moment de créer le compte.
- Les tentatives de connexion ratées sont limitées (blocage d’un quart d’heure après 8 échecs), comme la création de comptes en rafale.
- Chaque compte a **trois emplacements de sauvegarde** en ligne. L’un est l’emplacement actif : c’est lui que remplissent les envois automatiques. Les autres gardent une partie de côté (une autre partie, une partie d’avant une relève) et se gèrent depuis ☰ → Compte en ligne. Chaque emplacement est chiffré séparément, et **changer le mot de passe les rechiffre tous les trois**.
- Si deux appareils envoient chacun leur version, rien n’est écrasé en silence : le jeu demande laquelle garder, et l’autre part dans les copies de sécurité.

## Installation, pas à pas

### 1. Créer un compte Cloudflare

Sur [dash.cloudflare.com](https://dash.cloudflare.com), inscris-toi (gratuit). À la première visite de la partie « Workers », Cloudflare te demande de choisir un sous-domaine en `workers.dev` : prends ce que tu veux, par exemple ton pseudo.

### 2. Créer la base de données

1. Ouvre la page **D1 SQL database** (menu de gauche, rubrique *Storage & Databases*), puis **Create Database**.
2. Nom : `eclat-comptes`. Laisse le reste par défaut et valide avec **Create**.
3. Ouvre la base, onglet **Console**. Copie tout le contenu du fichier [`schema.sql`](schema.sql), colle-le, puis **Execute**. Dans l’onglet **Tables**, quatre tables apparaissent : `users`, `sessions`, `saves`, `attempts`.

> **La base existe déjà ?** Si tu as installé le serveur avec l’ancienne version (une seule sauvegarde par compte), n’exécute pas `schema.sql` : copie plutôt tout le contenu de [`migration-2.sql`](migration-2.sql) dans la même console, puis **Execute**. La partie déjà en ligne est conservée et devient l’emplacement 1 ; les deux autres sont vides.

### 3. Créer le serveur (le « Worker »)

1. Ouvre la page **Workers & Pages**, puis **Create application**.
2. Choisis **Start with Hello World!**, puis **Get started**.
3. Nom : `eclat-comptes`. Valide avec **Deploy**.
4. Ouvre le Worker et clique sur l’icône **Edit code** (`</>`). Efface tout le contenu de `worker.js`, colle à la place le contenu du fichier [`worker.js`](worker.js) de ce dossier, puis **Save** (ou **Deploy**, selon ce que propose l’éditeur).

### 4. Relier le serveur à la base, et lui dire où est le jeu

Toujours dans la page du Worker :

1. Onglet **Bindings** → **Add binding** → **D1 database** → **Add binding**.
   - **Variable name** : `DB` (en majuscules, exactement : c’est le nom que lit le code).
   - **D1 database** : `eclat-comptes`.
   - Valide avec **Add binding**.
2. Onglet **Settings** → **Variables and Secrets** → **Add** : type *Text*, nom `ALLOWED_ORIGIN`, valeur : l’adresse de ton jeu **sans** le chemin, par exemple `https://mon-pseudo.github.io`. Enregistre (**Deploy**).
3. Si le Worker ne prend pas les changements, onglet **Deployments** → dans **Version History**, **Deploy version** sur la dernière version → **Deploy**.

Pour vérifier : ouvre `https://eclat-comptes.TON-SOUS-DOMAINE.workers.dev/api/health` dans le navigateur. Tu dois voir `{"ok":true,"version":2}`. Si tu vois une erreur qui parle de « liaison DB », reprends l’étape 4.1 ; si elle parle de migration, exécute `migration-2.sql` comme expliqué plus haut. L’adresse exacte du Worker est affichée en haut de sa page (elle finit par `.workers.dev`).

Les intitulés de Cloudflare changent de temps en temps ; s’ils ne correspondent plus, la documentation officielle de D1 (« Get started », version tableau de bord) suit le même chemin : [developers.cloudflare.com/d1/get-started](https://developers.cloudflare.com/d1/get-started/).

### 5. Brancher le jeu sur le serveur

Dans le dépôt du jeu, ouvre `js/config.js` et mets l’adresse du Worker :

```js
window.ECLAT_CONFIG = {
  cloud: "https://eclat-comptes.TON-SOUS-DOMAINE.workers.dev"
};
```

Puis, comme pour toute nouvelle version : `npm run build`, `npm test`, et publie (commit + push sur la branche servie par GitHub Pages). Les joueurs verront le bandeau de mise à jour, et le menu ☰ aura un bouton « Compte en ligne » qui fonctionne.

Tu peux aussi modifier `js/config.js` directement sur github.com (bouton crayon), mais il faut alors recalculer l’empreinte du service worker (`npm run build`), sinon les joueurs ne recevront pas la mise à jour.

## En ligne de commande (facultatif)

Si tu préfères Wrangler, l’outil de Cloudflare :

```sh
cd server
npx wrangler login
npx wrangler d1 create eclat-comptes          # note l’identifiant affiché
# colle-le dans wrangler.toml (database_id) et règle ALLOWED_ORIGIN
npx wrangler d1 execute eclat-comptes --remote --file=schema.sql
# base déjà installée avec l’ancienne version, une seule sauvegarde :
# npx wrangler d1 execute eclat-comptes --remote --file=migration-2.sql
npx wrangler deploy
```

## Essayer sur sa machine

Sans rien installer chez Cloudflare (il faut Node 22) :

```sh
node --no-warnings server/dev.js        # serveur de comptes sur http://localhost:8787
npm start                                # le jeu sur http://localhost:8080
```

Puis, dans la console du navigateur ouverte sur le jeu : `localStorage.setItem("eclat.cloud", "http://localhost:8787")` et recharge la page. Les tests du serveur tournent avec `npm test`.

## Limites de l’offre gratuite

100 000 requêtes par jour et 5 Go de base. Un joueur connecté envoie sa partie toutes les quatre minutes environ quand il joue : de quoi tenir des centaines de joueurs quotidiens.

## Effacer les données

Un joueur peut supprimer son compte depuis le jeu (☰ → Compte en ligne → Supprimer le compte). Pour tout effacer d’un coup, supprime la base `eclat-comptes` dans Cloudflare.
