# Éclat — Le Carnet du Semeur : trois époques

Le thème porte le nom court **Carnet**. Un seul papier et les mêmes commandes peintes accompagnent tous les âges. Le mode clair/sombre de la première étude est abandonné.

## Comparer

- `index.html?age=bois` : La Lisière, premiers gestes, observations naturalistes, titres à l’encre.
- `index.html?age=vapeur` : La Rivière Lente, relevés de débit, étude d’une pompe, titres de registre.
- `index.html?age=stellaire` : Mercure, observations astronomiques, titres plus sobres.
- `composants.html` : boutons et pièces peints, sans bascule de thème.

Les liens en haut permettent de passer d’une époque à l’autre. La typographie du texte, des commandes et des quantités reste stable. Seuls le titre principal, quelques annotations et les illustrations évoluent. Les chiffres de partie sont des exemples ; aucune sauvegarde du jeu n’est lue, écrite ou transmise. Les commandes de récolte et de construction sont simulées et les fenêtres se ferment avec Échap.

## Images et provenance

Les PNG sont les sorties intactes de l’outil intégré imagegen. Les prompts de la première étude sont dans `prompts.json`, ceux des trois nouveaux dessins dans `prompts-ages.json`. La bûche WebP vient du lot Bois déjà intégré dans Éclat. Le paysage de rivière et la pompe sont des propositions artistiques, sans nouvelle règle de jeu ; l’eau et ses pompes existent déjà à l’âge de la Vapeur.

Les trois PNG nocturnes de la première étude sont conservés comme sources historiques, mais ne sont plus utilisés. `manifest.json` décrit les PNG et leurs empreintes. Les maîtres restent lourds : exporter et comparer des variantes web avant l’intégration au jeu ; ne pas mettre tous les maîtres ni ces documents dans le cache de production.

Les bordures utilisent des parties extensibles ; les illustrations gardent leurs proportions. Les libellés restent du HTML. Les états de survol et d’appui sont des variations d’affichage des fonds peints, et non des images distinctes.

## Validation

`node qa/check-ages.js` (ou `node qa/check-page.js`) : 237 contrôles réussis à 320, 390 et 1280 px, sur les trois époques. Vérifications : images chargées, absence de débordement, cibles tactiles, focus et clavier, fenêtres, grand texte, commandes simulées et navigation entre époques. Le test compare aussi le papier, les boutons et la police de lecture entre âges et vérifie trois écritures de titre différentes.

Captures courantes : `qa/bois-1280.png`, `qa/vapeur-1280.png`, `qa/stellaire-1280.png`. Pour ces planches de bureau, la navigation est temporairement placée en fin de document pendant la capture. Le prototype conserve sa navigation fixe. Les anciennes captures clair/sombre documentent uniquement la première étude.

## Déploiement envisagé après validation

L’intégration au jeu remplacera l’habillage du mode **Vivant**, qui pourra afficher **Carnet**, en conservant son identifiant interne pour les préférences existantes. Elle devra reprendre les vrais objectifs, débits, extracteurs, maîtrises et relèves, puis appliquer le même rendu commun sur `main` et `prewiew-design`. L’atelier expérimental et ses sauvegardes resteront propres à la preview. Cette PR est une proposition graphique, pas une activation de production.

## Polices

Polices locales du dépôt sous SIL Open Font License 1.1 : IM Fell English — Igino Marini ; Caveat — Impallari Type ; Alegreya Sans — Juan Pablo del Peral / Huerta Tipográfica ; Playfair Display — Claus Eggers Sørensen ; Space Grotesk — Florian Karsten. Les deux dernières sont réservées aux titres des pages témoins.
