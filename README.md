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
- **Le thermomètre d’intuition.** Quand rien ne se passe, le jeu te dit si tu t’approches d’une recette encore inconnue : *Froid*, *Frais* (une de ces matières cache une recette), *Tiède* (bon geste, bonne piste), *Chaud* (mauvais geste, ou une matière en trop ou en moins), *Brûlant* (la bonne combinaison, mais il te manque de la chaleur ou des quantités). Chaque échec a sa petite phrase : écrite à la main pour les essais les plus probables du début (« Tu essaies de tricoter un caillou. Le caillou gagne. »), sinon tirée de modèles par geste, avec les bons articles, et toujours la même pour la même tentative.
- **Énigmes et Intuition.** Le Carnet montre les prochains objets à découvrir, avec leur effet et une énigme ; leur nom reste caché (???) tant qu’on ne les a pas trouvés, sauf ceux que le jeu a déjà nommés (étapes, prochaine étape, suivi). Les découvertes rapportent de l’**Intuition ✨**, qui sert à **étudier une matière** : on sait alors avec quels gestes elle cache encore des recettes, et sa tuile porte un ✦ quand elle réagit avec le geste choisi.
- **Découvrir coûte peu.** Une petite découverte (6 matières au plus) sort tout de suite. Une grosse s’inscrit au Carnet sans rien prendre (« Recette trouvée ») : on voit son prix, et on la fabrique quand on veut.
- **Tes mains.** Ensuite, fabriquer à la main prend un peu de temps et passe par une file (8 fabrications au plus), qui avance même jeu fermé. Les matières sont mises de côté dès la mise en file et rendues si on annule. Répéter un geste va de plus en plus vite (n pièces : durée d’une pièce × n^0,6), et les gestes des âges passés aussi. Pour produire en grand, il y a les machines.
- **Maîtrise.** Refabriquer une recette fait monter sa maîtrise (★) et donne des chefs-d’œuvre : des lots bonus gratuits.
- **Rappels d’un âge à l’autre.** Tu tresseras à nouveau, mais de la fibre de carbone. Le charbon du premier feu deviendra du graphène. L’argile de tes premières briques finira en bouclier thermique.

### Passages, relève et Mémoire des mains (la méta-progression)

Voir [`docs/PROGRESSION.md`](docs/PROGRESSION.md) pour la conception complète.

- **Passages** : pour entrer dans une nouvelle terre, l’objet qui y mène (l’épieu pour la Plaine, l’outre pour la Rivière…) rend le passage possible ; on le franchit en y versant des matières depuis la Réserve, en plusieurs fois si besoin. Chaque passage coûte bien plus que le précédent : c’est le mur.
- **Relève** : dès un passage franchi, on peut passer le relais. Un nouveau Semeur s’éveille : stocks, machines, terres et âges repartent de zéro ; le Carnet, les fragments, les secrets, les Échos et la Mémoire restent. Chaque passage franchi rapporte des **Traces** (2, 3, 5, 8, 12…).
- **Mémoire des mains** : huit améliorations permanentes achetées avec les Traces (récolte, mains, extracteurs, machines, passages moins chers, paquetage de départ, terres déjà ouvertes, temps hors ligne).
- Rythme visé (réglé avec `tools/sim-passages.js`) : la première partie bute vers les Collines au bout d’environ 25 minutes ; chaque relève va environ une terre plus loin.

### Le Domaine : terres, gisements, extracteurs et machines

Le **Domaine** est l’écran d’accueil : une page qui défile, avec tout ce qui produit.

- Chaque terre ouverte, la plus récente en premier, liste ses **gisements** (bois, pierre, cuivre, pétrole…). On touche l’icône d’une matière pour la ramasser, on garde le doigt dessus pour continuer. Les outils multiplient ce qu’on ramasse.
- **+1** et **×10** posent des **extracteurs** sur un gisement (cabane, puits, scierie, derrick, réplicateur…). Ils récoltent seuls, même jeu fermé, et versent leur récolte dans la Réserve. S’il n’en reste plus de libre, les mains le fabriquent puis le posent. Toucher la ligne ouvre sa fiche : type d’extracteur, nombre, pause.
- Les **machines** (automate de bois, automate de bronze, presse à vapeur, chaîne d’assemblage, assembleur moléculaire) travaillent en **chaînes** : une recette, un type de machine, un nombre. Elles se servent dans la Réserve et y rangent ce qu’elles font ; celles qui font un ingrédient tournent avant celles qui l’utilisent. Une chaîne peut s’arrêter à un stock visé.
- Le **passage** en cours et le **Grand Œuvre** en cours ont leur carte : on y verse, ou on « alimente » le Grand Œuvre pour qu’il se serve seul dans la Réserve, à un débit qui dépend de l’âge.
- En bas, le tableau de production (ce qui entre et sort, par matière) et la phrase de l’âge.
- Courroies, convoyeurs et intelligence artificielle accélèrent les machines ; brouettes, chemin de fer et compagnie, les extracteurs.

### La Carte : le monde sous la brume

Une carte dessinée qui se lit de bas en haut, de la Lisière jusqu’aux étoiles. Les terres ouvertes sont dessinées et nommées ; les deux suivantes se devinent sous la brume, avec un nom vague ; le reste est hachuré. On y touche une terre pour aller à ses gisements, un lieu 🧭 pour l’explorer, une étiquette « Passage » pour y verser. On n’y construit rien.

### Le carnet au fil des âges

Le jeu est le carnet de terrain du Semeur. La mise en page ne change pas, mais le papier, l’encre, la police des titres et un ornement suivent l’époque : pigments (Bois, Os, Pierre), papyrus (Cuivre, Bronze), enluminure (Fer), registre (Acier, Électricité), cahier quadrillé (Silicium, Polymères, Composites), journal de bord (Spatial, Stellaire). La couleur de l’âge teinte l’accent. Les icônes viennent de game-icons.net, les polices sont embarquées (voir `docs/CREDITS.md`).

### Confort de jeu

- **⚡ Fabrication en chaîne** : ×1, ×10 et Max fabriquent un objet *et tous ses sous-composants* (réseau électrique → moteurs → bobines → fils de cuivre), à partir du stock ; Max calcule combien on peut en faire ainsi (dix cabanes d’un coup, par exemple). Le détail 🌳 montre les étapes, ce qui est pris dans le stock et ce qui manque.
- **🎯 La prochaine action** : l’objectif dit une seule chose à faire. Il manque une matière : son icône est là, dans l’objectif, à toucher ou à maintenir. Tout est réuni : un bouton fabrique l’objet et ses pièces intermédiaires. La recette est inconnue : l’objectif envoie à l’Atelier. Son titre déplie le détail (énigme, étapes, passage).
- **🎯 Suivi** : on suit une recette ; le haut du Domaine affiche ce qui manque, avec un temps estimé.
- **Quatre onglets** : Domaine, Carte, Atelier (pages Découvrir et Carnet), Journal (pages Journal et Cosmos, quand le ciel s’ouvre).
- **🏁 Étapes** : ce qu’il y a à faire à chaque âge (cinq à l’âge de l’Os, par exemple), depuis la carte d’objectif ; le compteur suit l’âge en cours. Certaines se sautent. Toutes faites, l’âge est **accompli** : +3 ✨ Intuition, une fois par âge et par cycle.
- **🎉 Fêtes** : une découverte, une recette trouvée, une première fabrication, une étape ou un âge accompli s’affichent au centre de l’écran, sans rien bloquer.
- **🌱 Un écran qui se remplit au fil du jeu** : au départ, la forêt et l’objectif. Machines, Intuition, Carnet et Journal apparaissent quand ils servent ; la recherche et les filtres de l’Atelier, quand il y a assez de matières.
- **💭 Tutoriel** : des souvenirs guident la main, chapitre par chapitre. Chacun se lance quand une chose devient possible et n’a pas encore été faite (premiers gestes, lieux à explorer, première cabane, file des mains, automate, étude des matières, jalons, Grand Œuvre) : une bulle éclaire l’endroit à toucher et attend que ce soit fait. Rien n’est bloqué ; on peut passer un chapitre, couper le tutoriel ou le revoir (menu ☰). Une partie avancée ne revoit pas les débuts, seulement ce qu’elle n’a pas encore fait.
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

Trois fins. Deux sont proposées ouvertement par la voix qui te guide : **la Sphère de Dyson** et **le Brise-Monde**. La troisième ne se trouve qu’en suivant les secrets. Après une fin, on peut passer le relais comme après un passage (la relève, plus haut) ; chaque fin atteinte laisse en plus un **Écho** : +50 % de récolte et de production pour toujours. Journal → Fins explique tout cela.

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
css/style.css         styles (mobile d’abord)
css/theme.css         le carnet par époque : papier, encre, polices, ornements
css/fonts.css         polices embarquées (assets/fonts)
js/data.js            tout le contenu : âges, gestes, recettes, zones, explorations, lore, fins
js/engine.js          moteur de jeu, sans DOM (tourne aussi sous Node)
js/ui.js              interface
js/domaine.js         le Domaine : gisements, extracteurs, chaînes de machines, passage, Grand Œuvre
js/carte.js           la Carte : le monde en SVG, brume, lieux, passages
js/icons.js           correspondance objets → icônes (générée par tools/icons.js)
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
tools/sim-passages.js joueur simulé pour régler les passages, la relève et la Mémoire (--compare, --cycles, --cout)
tools/build.js        empreinte de version du service worker (sans elle, les joueurs ne reçoivent pas la mise à jour)
tools/icons.js        sprite assets/icons.svg et js/icons.js à partir de tools/icons.json
tools/fixtures/       sauvegardes des versions 1 à 5, pour tester la compatibilité
```

```sh
npm test                       # contenu + moteur + serveur des comptes + empreinte du service worker
npm run serveur                # serveur des comptes en local (http://localhost:8787)
npm run build                  # recalcule l’empreinte du service worker (à lancer avant chaque publication)
npm run sim                    # partie simulée, temps d’arrivée à chaque âge
node tools/sim.js 1 brisemonde # 1 tape/seconde, vise le Brise-Monde
OBJ=1 node tools/sim.js        # détail des objectifs
MAINS=1 node tools/sim.js      # avec la file des mains (les machines possédées aident)
node tools/sim-passages.js --compare        # minute de chaque passage, sans et avec Mémoire
node tools/sim-passages.js --cycles 5 --minutes 30   # cinq relèves enchaînées
```

Avant de publier une nouvelle version : `npm run build` puis `npm test`. Si le format de sauvegarde change, augmente `SAVE_VERSION` dans `js/engine.js` et ajoute une étape à `migrate()` ; le test de compatibilité recharge les sauvegardes de `tools/fixtures`.

Pour ajouter une recette, ajoute une entrée dans `js/data.js` (`r: [geste, {ingrédient: quantité}, quantité produite, {heat, lvl}]`), puis lance `npm test` : le validateur signale les recettes en double, les ingrédients inconnus et les objets inatteignables.

**Rythme mesuré** : le bot (3 tapes/s, investissements optimaux, toutes les recettes connues d’avance) atteint la première fin en 1 h 15 environ. Un joueur qui découvre les recettes, explore et lit mettra plusieurs heures, réparties sur plusieurs sessions grâce à la production hors ligne.
