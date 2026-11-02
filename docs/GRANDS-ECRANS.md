# Grands écrans

**Mise à jour (2 novembre 2026, 0.66.0) :** au-dessus de 900 × 520 px, la scène remplit la fenêtre, les onglets passent en rail vertical à gauche (104 px) et les plaques gardent une colonne de téléphone de 520 px à côté du rail ; le décor reste libre à droite. C’est le principe de Cell to Singularity sur ordinateur : le monde en grand, l’interface à sa taille, collée au bord. Tout est dans le dernier bloc `@media` de `css/harmonie-sobre.css` (variables `--rail` et `--col`). Ce qui suit est l’analyse de départ.

Décision du 1er novembre 2026 : l’interface sobre (Terres, Labo, Atelier, Progression, Journal) est pensée pour **un téléphone tenu en portrait** (largeur 320 à 480 px). Sur un ordinateur ou une tablette en paysage, elle reste utilisable mais **devient vite disproportionnée**. On n’y touche pas pour l’instant : l’alpha se teste sur téléphone. Quand on s’y mettra, ce sera **une autre interface**, pas des retouches de celle-ci.

## Ce qu’on voit sur un grand écran (mesuré à 1000 × 900)

- Les plaques de papier (onglets, objectif, listes) s’étirent sur toute la largeur : des lignes de texte et des boutons séparés par plusieurs centaines de pixels.
- La bande des ressources, sur les Terres, passe sur deux colonnes (c’est la grille d’origine) : une icône, un compte, deux boutons ronds aux deux bouts de chaque ligne, avec un grand vide au milieu.
- Le nom de la terre, fixé en bas, est une plaque aussi large que la fenêtre.
- Le décor plein écran est étiré : le flou et les arbres au premier plan n’ont plus la composition prévue pour un cadre vertical.
- Les boutons ronds et les icônes d’onglets restent de la taille d’un pouce : minuscules au milieu d’un grand écran.

## Ce qui a déjà été fait pour limiter les dégâts

Rien de structurel, seulement dans `css/harmonie-sobre.css`, sous `@media (min-width: 601px)` : la bande des ressources garde sa hauteur naturelle, le bouton d’exploration est plafonné à 560 px et centré, la page des Terres défile en entier. Tout le reste est identique au téléphone.

## Pistes pour la future interface (à trancher, pas faites)

1. **Colonne de téléphone** : sur écran large, centrer le jeu dans une colonne de 480 px de large avec le décor de chaque terre de part et d’autre. Le moins cher, le plus fidèle au parti pris actuel.
2. **Deux zones** : la scène (le décor de la terre) à gauche en grand, les plaques (ressources, objectif, onglets) à droite en colonne de 420 px. C’est la vraie réponse « ordinateur », mais elle demande de recomposer chaque écran.
3. **Tableau de bord** : plusieurs écrans côte à côte (Terres et Atelier, par exemple), pour exploiter la largeur. À réserver à plus tard.

## Pour mesurer

- Une capture à 1000 × 900 de chaque écran suffit à voir les écarts ; l’outil de capture (Chrome sans fenêtre, état de partie du Bronze) n’est pas dans le dépôt : à refaire avec `tools/mesure-sobriete.js` (variables `VW` et `VH`).
- Les tests de budget (`tools/mesure-sobriete.js`, `tools/test-ux.js`) ne mesurent que le téléphone.
