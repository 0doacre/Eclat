# ✦ Éclat — du silex aux étoiles

Un jeu de craft pour navigateur, pensé d’abord pour le smartphone. Tu t’éveilles sans mémoire à l’orée d’une forêt ; tes mains, elles, savent quoi faire. De ton premier éclat de silex jusqu’à une sphère de Dyson autour du Soleil, tu traverses treize âges de la technique. En chemin, tu découvres pourquoi tu es seul, ce que cache l’étoile rouge qui pulse dans le ciel, et ce que la voix qui te guide ne te dit pas.

Le jeu fonctionne sans serveur et sans dépendance. Il est installable comme une application (PWA), fonctionne hors ligne et sauvegarde automatiquement sur l’appareil. Des comptes joueurs facultatifs permettent de retrouver sa partie sur un autre appareil (voir plus bas).

## Jouer

- **En ligne** : publie le dépôt avec GitHub Pages (voir plus bas), puis ouvre l’adresse sur ton téléphone. Dans le menu du navigateur, « Ajouter à l’écran d’accueil » l’installe comme une application.
- **En local** : `npm start` (ou `python3 -m http.server`), puis ouvre `http://localhost:8080`. Ouvrir `index.html` directement fonctionne aussi, mais sans le mode hors ligne.

## Les boucles de jeu

### Le craft par le geste (boucle principale)

Une recette n’est pas une grille : c’est un **geste** appliqué à des **matières**. À l’Atelier, tu choisis un geste (Assembler, Tresser, Tailler, Chauffer, Marteler, Allier, Tremper, Usiner, Électriser, Graver, Synthétiser, Stratifier, Transmuter… et un dernier, caché), tu poses jusqu’à trois matières sur l’établi, et tu œuvres. Les quantités sont automatiques.

- **Les stations ouvrent des gestes.** Un feu de camp débloque *Chauffer* à 600 °C ; un four monte à 1 100 °C, un haut-fourneau à 1 700 °C, un four à arc à 3 500 °C. Chaque nouvelle station rend possibles de nouvelles recettes avec des matières que tu possèdes déjà. Construire la station suivante, c’est agrandir le champ des possibles.
- **Le thermomètre d’intuition.** Quand rien ne se passe, le jeu te dit si tu t’approches d’une recette encore inconnue : *Froid*, *Frais* (une de ces matières cache une recette), *Tiède* (bon geste, bonne piste), *Chaud* (mauvais geste, ou une matière en trop ou en moins), *Brûlant* (la bonne combinaison, mais il te manque de la chaleur ou des quantités). Chaque échec a sa petite phrase.
- **Énigmes et Intuition.** Le Carnet montre les prochains objets à découvrir, avec leur effet et une énigme. Les découvertes rapportent de l’**Intuition ✨**, qui sert à **étudier une matière** : on sait alors avec quels gestes elle cache encore des recettes, et sa tuile porte un ✦ quand elle réagit avec le geste choisi.
- **Tes mains.** Une découverte sort tout de suite. Ensuite, fabriquer à la main prend un peu de temps et passe par une file (8 fabrications au plus), qui avance même jeu fermé. Les matières sont mises de côté dès la mise en file et rendues si on annule. Répéter un geste va de plus en plus vite (n pièces : durée d’une pièce × n^0,6), et les gestes des âges passés aussi. Pour produire en grand, il y a les machines.
- **Maîtrise.** Refabriquer une recette fait monter sa maîtrise (★) et donne des chefs-d’œuvre : des lots bonus gratuits.
- **Rappels d’un âge à l’autre.** Tu tresseras à nouveau, mais de la fibre de carbone. Le charbon du premier feu deviendra du graphène. L’argile de tes premières briques finira en bouclier thermique.

### La Carte : terres, gisements, extracteurs, tapis et machines

Tout se passe sur une seule carte vue de dessus. Au centre, la **Réserve** (le stock). Autour, chaque terre atteinte est une région, avec ses **gisements** (une case par ressource : bois, pierre, cuivre, pétrole…) et ses **lieux à explorer** 🧭. Toucher le nom d’une terre ouvre sa fiche et son paysage. La carte s’agrandit à chaque nouvelle terre.

- On touche une case de gisement pour récolter à la main, on garde le doigt dessus pour continuer. Les outils multiplient ce qu’on ramasse.
- On y pose un **extracteur** adapté (cabane, puits, scierie, derrick, réplicateur…). Il récolte tout seul, même jeu fermé, et pose sa récolte devant lui. Un extracteur met tout son effort sur la matière de sa case.
- On trace des **tapis** au doigt jusqu’à la Réserve, ou on laisse le jeu tracer le chemin (« Relier à la Réserve »).
- Les **machines** (automate de bois, automate de bronze, presse à vapeur, chaîne d’assemblage, assembleur moléculaire) fabriquent une recette et se servent sur les tapis qui passent devant elles. Le tapis d’un extracteur peut donc longer des machines avant d’arriver à la Réserve : une ligne complète, du gisement au produit fini.
- Une **sortie** posée contre la Réserve envoie aux machines ce qu’elles réclament dans le stock, mais la Réserve ne laisse sortir qu’un petit débit, toutes sorties confondues : mieux vaut amener aux machines leurs matières directement. **Répartiteurs** et **croisements** aident à organiser les tapis.
- Un **tapis** porte un nombre limité d’objets par seconde, de plus en plus aux âges suivants. Chaque case par laquelle un tapis entre dans la Réserve a ce débit : quand plusieurs gisements la partagent, elle déborde et clignote ⚠️. Un répartiteur qui ouvre une deuxième entrée règle le problème.
- Les **Grands Œuvres** se construisent sur la carte : on pose leur **chantier** où l’on veut, et on le nourrit par tapis.
- Les objets qui roulent sur les tapis montrent ce qui circule ; les voyants des machines disent ce qui manque. Courroies, convoyeurs et intelligence artificielle accélèrent les machines ; brouettes, chemin de fer et compagnie, les extracteurs.

### Confort de jeu

- **⚡ Fabrication en chaîne** : un bouton fabrique un objet *et tous ses sous-composants* (réseau électrique → moteurs → bobines → fils de cuivre), à partir du stock. Le détail 🌳 montre les étapes, ce qui est pris dans le stock et ce qui manque.
- **🎯 Suivi** : on suit une recette ; la carte affiche ce qui manque, avec un temps estimé.
- **🏁 Jalons** : ce qu’il y a à faire à chaque âge, depuis la carte d’objectif.
- **💭 Tutoriel** : des souvenirs guident la main, chapitre par chapitre. Chacun se lance quand une chose devient possible et n’a pas encore été faite (premiers gestes, lieux à explorer, première cabane, file des mains, roue, automate, étude des matières, jalons, tapis qui déborde, chantier d’un Grand Œuvre) : une bulle éclaire l’endroit à toucher et attend que ce soit fait. Rien n’est bloqué ; on peut passer un chapitre, couper le tutoriel ou le revoir (menu ☰). Une partie avancée ne revoit pas les débuts, seulement ce qu’elle n’a pas encore fait.
- **🛠️ La roue** : sur la carte, un menu circulaire avec toutes les recettes connues, par famille (machines, extracteurs, stations, outils, pièces, curiosités, raccourcis) et une recherche. Les recettes faisables tout de suite viennent d’abord. On met en file (×1, ×10, Max, ⚡ en chaîne), puis 📍 on pose la machine ou l’extracteur. Au centre, la file des mains. La roue s’ouvre d’elle-même quand l’outil Machine ou Extracteur n’a plus rien de libre.
- **📖 Carnet** : recherche (par nom ou par ingrédient), épingles ☆ (raccourcis en haut de l’Atelier), objets déjà possédés masqués, chaque ingrédient est cliquable et mène à sa recette.
- **Objectif guidé** : il indique la *prochaine étape* concrète (la sous-recette inconnue, la station ou la zone qui manque). Chaque combinaison nouvelle essayée à l’Atelier réveille des **souvenirs** : à force, ils soufflent le geste, puis une matière, puis la recette entière. Attendre ne donne rien.
- **Fiches** : toucher un objet ouvre sa fiche (recette, stock, station, ce qu’il sert à fabriquer) ; tout y est cliquable pour passer de recette en recette, avec un retour arrière.
- **Matières** : recherche, tri (âge, nom, quantité, dernières trouvées), filtres (dont « utiles pour ce geste ») et favorites à l’Atelier.

### Les treize âges

Bois · Os · Pierre · Cuivre · Bronze · Fer · Acier · Électricité · Silicium · Polymères · Composites · Spatial · Stellaire.

Chaque âge change la couleur de l’interface et ouvre de nouvelles terres : la Plaine, la Rivière, les Collines, les Profondeurs, le Désert de Verre, le Gisement Noir, les Pics Fracturés, l’orbite, la Lune, Mercure.

### Exploration, lore et secrets

Chaque terre cache des **explorations** qui rapportent des fragments d’histoire. Le jeu compte 26 fragments, 21 secrets (recettes cachées, mélodies, codes, lieux), une flûte en os qui se joue, un terminal où taper des commandes et un ciel nocturne à observer. Les textes sont à lire attentivement : beaucoup contiennent des indices.

### Les fins

Trois fins. Deux sont proposées ouvertement par la voix qui te guide : **la Sphère de Dyson** et **le Brise-Monde**. La troisième ne se trouve qu’en suivant les secrets. Après une fin, tu peux commencer un **nouveau cycle** : tu gardes ton Carnet, tes fragments et tes secrets, et chaque fin accumulée accélère la partie suivante.

> Les solutions complètes (secrets, codes, chemin de la fin cachée) sont dans [`docs/SOLUTIONS.md`](docs/SOLUTIONS.md). **Spoilers.**

## Son

Tout est synthétisé dans le navigateur, sans fichier audio : une musique générée qui change avec les âges et se tait par moments, une ambiance par lieu (vent, rivière, oiseaux le jour, grillons la nuit, gouttes dans les profondeurs, machines qui tournent sur la carte), des bruitages pour chaque geste et chaque matière. Menu ☰ : son, musique, ambiance et bruitages se règlent séparément.

## Sauvegardes et mises à jour

- La partie s’enregistre toute seule dans le navigateur. Le menu ☰ → **Sauvegardes** permet de la **télécharger en fichier** (`.json`) et de la recharger, ainsi que d’utiliser l’ancien code texte.
- Des **copies de sécurité** sont faites automatiquement avant chaque migration, import, restauration, nouveau cycle ou remise à zéro (les 5 dernières sont gardées et téléchargeables).
- Une sauvegarde illisible n’est **jamais écrasée** : le jeu propose de la télécharger.
- Les sauvegardes des versions précédentes sont migrées sans perte (testé sur des parties réelles de la version 1, voir `tools/fixtures`).
- Quand une nouvelle version est publiée, elle s’installe en arrière-plan puis **attend l’accord du joueur** : un bandeau propose de télécharger sa sauvegarde, puis de mettre à jour.
- **Comptes joueurs** (facultatifs) : un pseudo et un mot de passe pour retrouver sa partie sur un autre appareil. La sauvegarde est chiffrée sur l’appareil avant d’être envoyée. Il faut installer un petit serveur gratuit chez Cloudflare : marche à suivre dans [`server/README.md`](server/README.md).

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
js/usine.js           la Carte : terres, gisements, tapis, machines, chantiers (canvas, commandes tactiles)
js/roue.js            la roue : fabriquer depuis la carte (menu circulaire des recettes connues)
js/tuto.js            le tutoriel : chapitres déclenchés au fil du jeu, bulles qui pointent
js/scenes.js          les paysages des terres (SVG, dans leur fiche)
js/cloud.js           compte joueur : clés, chiffrement, échanges avec le serveur
js/config.js          adresse du serveur des comptes (vide = pas de comptes)
server/               serveur des comptes (Cloudflare Worker + D1), tests et guide
js/audio.js           musique, ambiances et bruitages synthétisés en WebAudio
js/sky.js             le ciel nocturne (canvas)
sw.js                 service worker (hors ligne)
tools/validate.js     vérifie le contenu : références, recettes en double, atteignabilité de chaque objet
tools/test.js         tests du moteur, dont le chemin secret complet jusqu’à la fin cachée
tools/sim.js          bot qui joue une partie entière pour mesurer le rythme
tools/build.js        empreinte de version du service worker (sans elle, les joueurs ne reçoivent pas la mise à jour)
tools/fixtures/       sauvegardes des versions 1, 2 et 3, pour tester la compatibilité
```

```sh
npm test                       # contenu + moteur + serveur des comptes + empreinte du service worker
npm run serveur                # serveur des comptes en local (http://localhost:8787)
npm run build                  # recalcule l’empreinte du service worker (à lancer avant chaque publication)
npm run sim                    # partie simulée, temps d’arrivée à chaque âge
node tools/sim.js 1 brisemonde # 1 tape/seconde, vise le Brise-Monde
OBJ=1 node tools/sim.js        # détail des objectifs
MAINS=1 node tools/sim.js      # avec la file des mains (les machines possédées aident)
```

Avant de publier une nouvelle version : `npm run build` puis `npm test`. Si le format de sauvegarde change, augmente `SAVE_VERSION` dans `js/engine.js` et ajoute une étape à `migrate()` ; le test de compatibilité recharge les sauvegardes de `tools/fixtures`.

Pour ajouter une recette, ajoute une entrée dans `js/data.js` (`r: [geste, {ingrédient: quantité}, quantité produite, {heat, lvl}]`), puis lance `npm test` : le validateur signale les recettes en double, les ingrédients inconnus et les objets inatteignables.

**Rythme mesuré** : le bot (3 tapes/s, investissements optimaux, toutes les recettes connues d’avance) atteint la première fin en 1 h 15 environ. Un joueur qui découvre les recettes, explore et lit mettra plusieurs heures, réparties sur plusieurs sessions grâce à la production hors ligne.
