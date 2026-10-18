# ✦ Éclat — du silex aux étoiles

Un jeu de craft pour navigateur, pensé d’abord pour le smartphone. Tu t’éveilles sans mémoire à l’orée d’une forêt ; tes mains, elles, savent quoi faire. De ton premier éclat de silex jusqu’à une sphère de Dyson autour du Soleil, tu traverses treize âges de la technique. En chemin, tu découvres pourquoi tu es seul, ce que cache l’étoile rouge qui pulse dans le ciel, et ce que la voix qui te guide ne te dit pas.

Le jeu fonctionne sans serveur, sans compte et sans dépendance. Il est installable comme une application (PWA), fonctionne hors ligne et sauvegarde automatiquement sur l’appareil.

## Jouer

- **En ligne** : publie le dépôt avec GitHub Pages (voir plus bas), puis ouvre l’adresse sur ton téléphone. Dans le menu du navigateur, « Ajouter à l’écran d’accueil » l’installe comme une application.
- **En local** : `npm start` (ou `python3 -m http.server`), puis ouvre `http://localhost:8080`. Ouvrir `index.html` directement fonctionne aussi, mais sans le mode hors ligne.

## Les boucles de jeu

### Le craft par le geste (boucle principale)

Une recette n’est pas une grille : c’est un **geste** appliqué à des **matières**. À l’Atelier, tu choisis un geste (Assembler, Tresser, Tailler, Chauffer, Marteler, Allier, Tremper, Usiner, Électriser, Graver, Synthétiser, Stratifier, Transmuter… et un dernier, caché), tu poses jusqu’à trois matières sur l’établi, et tu œuvres. Les quantités sont automatiques.

- **Les stations ouvrent des gestes.** Un feu de camp débloque *Chauffer* à 600 °C ; un four monte à 1 100 °C, un haut-fourneau à 1 700 °C, un four à arc à 3 500 °C. Chaque nouvelle station rend possibles de nouvelles recettes avec des matières que tu possèdes déjà. Construire la station suivante, c’est agrandir le champ des possibles.
- **Le thermomètre d’intuition.** Quand rien ne se passe, le jeu te dit si tu t’approches d’une recette encore inconnue : *Froid*, *Frais* (une de ces matières cache une recette), *Tiède* (bon geste, bonne piste), *Chaud* (mauvais geste, ou une matière en trop ou en moins), *Brûlant* (la bonne combinaison, mais il te manque de la chaleur ou des quantités). Chaque échec a sa petite phrase.
- **Énigmes et Intuition.** Le Carnet montre les prochains objets à découvrir, avec leur effet et une énigme. Les découvertes rapportent de l’**Intuition ✨**, qui achète des indices.
- **Maîtrise.** Refabriquer une recette fait monter sa maîtrise (★) et donne des chefs-d’œuvre : des lots bonus gratuits.
- **Rappels d’un âge à l’autre.** Tu tresseras à nouveau, mais de la fibre de carbone. Le charbon du premier feu deviendra du graphène. L’argile de tes premières briques finira en bouclier thermique.

### La récolte incrémentale

Touche une ressource pour la récolter, maintiens le doigt pour récolter en continu. Les outils multiplient tes récoltes, les **extracteurs** (cabanes, puits, scieries, derricks, stations orbitales, réplicateurs…) produisent tout seuls, et les **améliorations** (moulin, brouettes, palan, chemin de fer, réseau électrique, robots, fusion…) multiplient la production. La production continue jeu fermé, jusqu’à 12 h.

### La Fabrique (automatisation des productions)

Dès l’âge de la Pierre, un **Automate de bois** permet de confier une recette à une **ligne de production** : elle la fabrique en continu, même jeu fermé, tant que les matières sont là. Chaque ligne affiche ses entrées, sa machine et sa sortie sur un convoyeur animé ; elle passe au vert quand elle tourne, au rouge quand une matière manque (et dit laquelle). On règle le nombre de machines, le type de machine et un **stock maximal** pour qu’une ligne n’avale pas tout. Les machines s’améliorent d’âge en âge : automate de bois, automate de bronze, presse à vapeur, chaîne d’assemblage, assembleur moléculaire. Courroies, convoyeurs et intelligence artificielle accélèrent toute la Fabrique.

### Confort de jeu

- **⚡ Fabrication en chaîne** : un bouton fabrique un objet *et tous ses sous-composants* (réseau électrique → moteurs → bobines → fils de cuivre), à partir du stock. Le détail 🌳 montre les étapes, ce qui est pris dans le stock et ce qui manque.
- **🎯 Suivi** : on suit une recette ; les Terres affichent ce qui manque, avec un temps estimé, et mettent en évidence les ressources à récolter.
- **📖 Carnet** : recherche (par nom ou par ingrédient), épingles ☆ (raccourcis en haut de l’Atelier), objets déjà possédés masqués, chaque ingrédient est cliquable et mène à sa recette.
- **Objectif guidé** : il indique la *prochaine étape* concrète (la sous-recette inconnue, la station ou la zone qui manque). Si l’on bloque plusieurs minutes, des **réminiscences** soufflent le geste, puis une matière, puis la recette entière.

### Les treize âges

Bois · Os · Pierre · Cuivre · Bronze · Fer · Acier · Électricité · Silicium · Polymères · Composites · Spatial · Stellaire.

Chaque âge change la couleur de l’interface et ouvre de nouvelles terres : la Plaine, la Rivière, les Collines, les Profondeurs, le Désert de Verre, le Gisement Noir, les Pics Fracturés, l’orbite, la Lune, Mercure.

### Exploration, lore et secrets

Chaque terre cache des **explorations** qui rapportent des fragments d’histoire. Le jeu compte 26 fragments, 21 secrets (recettes cachées, mélodies, codes, lieux), une flûte en os qui se joue, un terminal où taper des commandes et un ciel nocturne à observer. Les textes sont à lire attentivement : beaucoup contiennent des indices.

### Les fins

Trois fins. Deux sont proposées ouvertement par la voix qui te guide : **la Sphère de Dyson** et **le Brise-Monde**. La troisième ne se trouve qu’en suivant les secrets. Après une fin, tu peux commencer un **nouveau cycle** : tu gardes ton Carnet, tes fragments et tes secrets, et chaque fin accumulée accélère la partie suivante.

> Les solutions complètes (secrets, codes, chemin de la fin cachée) sont dans [`docs/SOLUTIONS.md`](docs/SOLUTIONS.md). **Spoilers.**

## Sauvegardes et mises à jour

- La partie s’enregistre toute seule dans le navigateur. Le menu ☰ → **Sauvegardes** permet de la **télécharger en fichier** (`.json`) et de la recharger, ainsi que d’utiliser l’ancien code texte.
- Des **copies de sécurité** sont faites automatiquement avant chaque migration, import, restauration, nouveau cycle ou remise à zéro (les 5 dernières sont gardées et téléchargeables).
- Une sauvegarde illisible n’est **jamais écrasée** : le jeu propose de la télécharger.
- Les sauvegardes des versions précédentes sont migrées sans perte (testé sur des parties réelles de la version 1, voir `tools/fixtures`).
- Quand une nouvelle version est publiée, elle s’installe en arrière-plan puis **attend l’accord du joueur** : un bandeau propose de télécharger sa sauvegarde, puis de mettre à jour.

## Publier avec GitHub Pages

1. Sur GitHub : *Settings → Pages*.
2. *Source* : « Deploy from a branch », branche `main`, dossier `/ (root)`.
3. Le jeu est servi à l’adresse `https://<utilisateur>.github.io/<dépôt>/`.

Tous les chemins sont relatifs : le jeu fonctionne depuis n’importe quel sous-dossier.

## Développement

```
index.html            page unique
css/style.css         styles (mobile d’abord, thème par âge)
js/data.js            tout le contenu : âges, gestes, recettes, zones, explorations, lore, fins
js/engine.js          moteur de jeu, sans DOM (tourne aussi sous Node)
js/ui.js              interface
js/audio.js           sons synthétisés en WebAudio (aucun fichier audio)
js/sky.js             le ciel nocturne (canvas)
sw.js                 service worker (hors ligne)
tools/validate.js     vérifie le contenu : références, recettes en double, atteignabilité de chaque objet
tools/test.js         tests du moteur, dont le chemin secret complet jusqu’à la fin cachée
tools/sim.js          bot qui joue une partie entière pour mesurer le rythme
tools/build.js        empreinte de version du service worker (sans elle, les joueurs ne reçoivent pas la mise à jour)
tools/fixtures/       sauvegardes de la version 1, pour tester la compatibilité
```

```sh
npm test                       # validation du contenu + tests du moteur + empreinte du service worker
npm run build                  # recalcule l’empreinte du service worker (à lancer avant chaque publication)
npm run sim                    # partie simulée, temps d’arrivée à chaque âge
node tools/sim.js 1 brisemonde # 1 tape/seconde, vise le Brise-Monde
OBJ=1 node tools/sim.js        # détail des objectifs
```

Avant de publier une nouvelle version : `npm run build` puis `npm test`. Si le format de sauvegarde change, augmente `SAVE_VERSION` dans `js/engine.js` et ajoute une étape à `migrate()` ; le test de compatibilité recharge les sauvegardes de `tools/fixtures`.

Pour ajouter une recette, ajoute une entrée dans `js/data.js` (`r: [geste, {ingrédient: quantité}, quantité produite, {heat, lvl}]`), puis lance `npm test` : le validateur signale les recettes en double, les ingrédients inconnus et les objets inatteignables.

**Rythme mesuré** : le bot (3 tapes/s, investissements optimaux, toutes les recettes connues d’avance) atteint la première fin en 1 h 10 environ. Un joueur qui découvre les recettes, explore et lit mettra plusieurs heures, réparties sur plusieurs sessions grâce à la production hors ligne.
