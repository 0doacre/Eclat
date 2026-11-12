# Rendu T10 · Thème sombre pour l'aspect Carnet

**État** : fait. Un navigateur a tourné : tout ce qui suit est mesuré dans Chromium 1.61 (Playwright), pas sur un téléphone.

**Pour le joueur** : Menu › Affichage rend la rangée Thème (Auto, Jour, Sombre) ; Auto suit le téléphone et réagit quand il change. En Sombre, le papier devient un brun-gris très sombre à encre claire ; les aquarelles ne bougent pas. Jour est inchangé (les dix captures Jour, avant et après, sont identiques au pixel).

**Palette de nuit** (bloc « T10 · Thème sombre » de `css/harmonie-sobre.css`, sur `html[data-style-mode="vivant"] body.theme-dark`) : papier `--sb-p0 #2d251e`, feuille `#272019`, feuille 2 `#382f26`, bulle `#2c251e` ; canaux de papier translucide `41 34 28` / `38 32 26` / `39 33 27` ; encre `#efe3cc`, encre douce `#d0c3aa`, trait `#b3a283`, teinte `#ecae91`, accent en texte `#e68c71` (le fond d'accent reste `#a8402b`), teinte en fond `#8f4630`, bon `#94c79f`, mal `#f09d93`. Les variables de base (`--bg`, `--panel`, `--line`, `--muted`, `--acc`…) en dérivent par `css/carnet-peint.css`.

**Contrastes mesurés** (plus bas texte/fond, sur les pixels rendus, aux cinq tailles ; seuil 4,5) : Terres 6,74 · Étude 7,26 · Atelier 6,43 · page d'un métier 4,57 · Progression 4,82 · Carnet 8,53 · Journal 7,60 · bandeau 8,26 · barre d'onglets 8,44 · fiche 5,78 · toast 8,11 · Menu (Jeu et Affichage) 5,78.

**Couleurs en dur remplacées par des variables** (occurrences) : harmonie-sobre 44 (+ la palette), fin 48, sobriete 16, atelier-production 33, labo 38, refonte-0-39 30, ateliers 27, terres 33, carnet-peint 25, harmonie 1. Fichiers hors liste du prompt, touchés pour les couleurs seules : `ateliers.css`, `terres.css`, `carnet-peint.css`, `harmonie.css` (c'est là que le papier de jour était écrit en dur).

**Anciennes règles sombres retirées** : `theme.css` (bloc Veillée et 6 palettes d'époque, 33 lignes), `design-preview.css` (palette Atlas sarcelle, 6 réglages d'époque, 1 sélecteur de bouton), `domaine-vivant.css` (décor Atlas, variables `--drawn-*` sombres), `style.css` (1 règle). Restent : les règles de composants de `theme.css` (modale, toasts, champs) et l'aide du charbon dans `domaine-vivant.css`. Les séparateurs et cases « craie » sont repris dans le bloc de nuit. Retrait vérifié par comparaison de captures de nuit : aucun écart visible.

**`!important`** (`grep -c`) : harmonie-sobre.css 107 avant, 107 après ; fin.css 148 avant, 148 après. Aucun fichier CSS ajouté.

**Écrans qui restent clairs en Sombre** : aucun panneau ni texte. Restent clairs, par choix : les aquarelles (Terres, Atelier, Journal) et le ciel étoilé de la Progression. Les cadres de tuiles (SVG clairs) sont retournés par un filtre CSS (`invert` + `hue-rotate`), sans toucher aux images ; le papier peint `paper.webp` est remplacé par la couleur.

**Tests** : `npm test` vert. `npm run test:ui` : 34 verts, 3 rouges attendus (`test-decouvertes-carnet-ui`, `test-monde-production-ui`, `test-retours-ui`) sur 37, dont le nouveau `test-theme-sombre-ui.js` (193 vérifications : réglage, menu, contrastes, aucune vue qui défile, 5 tailles). `node tools/audit-interface.js` sort avec le code 0. Trois tests existants supposaient le jour forcé : j'ai changé 3 assertions de `test-carnet-production-ui.js` (papier de nuit si Sombre, rangée Thème présente).

**Choix qui reviennent au porteur** (captures Jour | Sombre, 390 × 844, dans `docs/chantier-interface/captures/T10/`) : `terres-`, `etude-`, `atelier-`, `atelier-metier-`, `progression-`, `carnet-`, `journal-`, `fiche-`, `toast-`, `menu-` + `jour-sombre.jpg` ; `…-sombre.jpg` seul. Question : garder les aquarelles pleines en nuit, ou ajouter un voile sombre léger derrière les panneaux (non fait) ?

**Non vérifié** : un vrai téléphone (OLED, Auto réel, barre du navigateur : la couleur `#29221c` n'a pas été vue) ; le contraste des textes posés sur les aquarelles n'est mesuré qu'en moyenne ; ni Cosmos ni Carte ni Comptoir ouverts par le test (Machines, quatre onglets du Menu et Mémoire l'ont été par une sonde hors dépôt, sans défaut) ; les textes de commandes éteintes sont exemptés ; Grand texte avec Sombre non mesuré (T9).
