# Parcours du tuto (0.49.2)

Méthode : partie neuve dans le navigateur à 390 px, un pilote qui suit la bulle du guide (touche la cible, « Suivant »), l'avancement du jeu par le moteur quand le guide attend, puis, pour les chapitres suivants, une partie préparée avec tous les autres chapitres marqués vus (le chapitre testé démarre alors tout de suite). Entre deux chapitres, le guide attend 150 s (`GAP` dans `js/tuto.js`).

## Parcouru en vrai

| Chapitre | Résultat | Correction |
|---|---|---|
| Premiers pas (8 pas) | passe de bout en bout | pas 6 : la cible `.goal-card` n'existe plus dans les Terres → le bouton d'objectif (`[data-terre-panel="obj"]`) ; textes « Domaine » → « Terres », « Atelier » → « Labo », « thermomètre » → « message de l'établi » |
| Les lieux | démarre | la cible était la Carte (`[data-cl]`), absente des Terres → le bouton « Explorer » de la terre (`[data-exp]`) ; l'exploration part directement, le pas « fenêtre » est sauté |
| Une nouvelle terre | démarre | la cible `#dt-plaine .dom-th` n'existe plus (pager des Terres) → le médaillon de la terre (`[data-terre-go]`) |
| Le Comptoir | démarre, 2 pas | la condition exigeait `#dcomptoir`, visible seulement panneau ouvert : le chapitre ne démarrait jamais → il part de la pastille « Comptoir », puis montre « Ouvrir le Comptoir » |
| Étudier tes matières | démarre, 1er pas | la condition `!E.equipmentList` l'interdisait dans le Labo à outils : le chapitre ne démarrait jamais → il montre « Étudier · ✨ n » (étude de toutes les matières vues) puis le filtre « Utiles » |

## Corrigé sans le jouer

- Le Cosmos est dans la Progression (texte d'ouverture d'onglet et parent du Cosmos).
- « Suivre une recette » : « en haut du Domaine » → « dans l'objectif des Terres ».

## Non vérifié (états difficiles à préparer)

La ruine (`[data-repair]`), le passage (`[data-pour]`), la règle d'une terre (`.dom-regle.gene`), le Grand Œuvre (`.dom-oeuvre [data-feed]`, panneau « œuvre » des Terres), les dons (`[data-dons]`), le visiteur (`.visiteur`), les chapitres du Carnet (suivre, épingler, commander), « La relève », « Tes mains », « Ton automate », le Troqueur, les signes, les figures, les paliers. Leurs sélecteurs existent encore dans le code, mais leur présence à l'écran dans les nouvelles Terres n'est pas démontrée : à repasser en jouant, ou avec un banc Playwright remis d'aplomb.

## Suite proposée

Un test qui, pour chaque chapitre, prépare l'état, démarre une partie, vérifie qu'une cible existe et que la bulle s'affiche (`tools/test-tuto-ui.js`, Playwright).
