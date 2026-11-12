# T10 · Un thème sombre pour l'aspect Carnet

Lis d'abord `docs/chantier-interface/MAITRE.md` : il porte le but, les règles communes et la forme du compte rendu. Réponds en français.

Passe après la fusion de T8. Tu peux tourner en même temps que T9 : vous n'avez pas les mêmes fichiers.

## Pourquoi
Le porteur veut un vrai thème sombre (décision du 12 novembre 2026). Aujourd'hui, il n'existe plus pour le joueur : l'aspect Carnet force le jour.

## Faits vérifiés (version 0.67.0)
- `applyTheme` (`js/ui.js` vers la ligne 1246) lit `st.settings.theme` (`auto`, `light`, `dark`), puis fait `if (window.EclatStyleMode === "vivant") dark = false;`. Il pose `body.theme-dark`, `data-theme` sur `body` et la couleur de `meta[name="theme-color"]`.
- Menu › Affichage cache la rangée « Thème » en Carnet (`js/compte.js`, `isVivant ? "" : …`).
- Les anciennes règles sombres visent l'aspect Atlas : `css/theme.css` (38), `css/design-preview.css` (14), `css/domaine-vivant.css` (4), `css/style.css` (1). Les feuilles de la refonte n'en ont aucune.
- La refonte a déjà une palette : les variables `--sb-*` en tête de `css/harmonie-sobre.css` (encre, papier, papier voilé, plaque sombre, bords, ombres). Une bonne part des couleurs des feuilles de la refonte reste pourtant écrite en dur.

## À faire
1. Rends le réglage au joueur : la rangée « Thème » (Auto, Jour, Sombre) dans Menu › Affichage, et `applyTheme` ne force plus le jour. Auto suit le téléphone et réagit quand il change.
2. Écris la palette de nuit sur les variables : `body.theme-dark` redéfinit les `--sb-*` et les variables de base (`--panel`, `--line`, `--muted`, `--acc`…). Le papier devient un papier de nuit (brun-gris très sombre, pas un noir pur), l'encre devient claire. Contraste d'au moins 4,5:1 pour le texte courant (WCAG AA). Mesure-le et donne les chiffres.
3. Quand une couleur écrite en dur dans une feuille de la refonte casse le sombre, remplace-la par une variable. N'ajoute pas une règle plus forte à la fin.
4. Les aquarelles (fonds des Terres, de l'Atelier, illustrations du Carnet) restent telles quelles : tout au plus un voile sombre léger derrière les panneaux. Ne retouche aucune image.
5. Retire les anciennes règles sombres d'Atlas qui ne servent plus. Le nombre de `!important` ne monte pas.
6. Ajoute `tools/test-theme-sombre-ui.js` : en Sombre, le fond et le texte de chaque vue principale, d'une fiche, du Menu et d'un toast ont un contraste d'au moins 4,5:1, et aucune vue ne défile, aux cinq tailles.

## Fichiers réservés
`js/ui.js` (`applyTheme`), `js/compte.js` (rangée Thème), les règles de couleur de `css/harmonie-sobre.css`, `css/sobriete.css`, `css/fin.css`, `css/atelier-production.css`, `css/labo.css` et `css/refonte-0-39.css`, les règles sombres de `css/theme.css`, `css/design-preview.css`, `css/domaine-vivant.css` et `css/style.css`, et le nouveau test. Pas de taille de texte : c'est T9.

## Fini quand
- Captures à 390 × 844, Jour et Sombre côte à côte, des Terres, de l'Étude, de l'Atelier, d'une fiche, du Carnet, du Journal et du Menu (dans `captures/T10/`). Le porteur choisit sur ces captures.
- `npm test` est vert, le nouveau test passe, `node tools/audit-interface.js` sort avec le code 0.
- Le compte rendu liste les écrans qui restent clairs en Sombre, s'il y en a.
