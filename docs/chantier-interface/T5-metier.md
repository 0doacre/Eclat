# T5 · Atelier : la page d'un métier en écran fixe

Lis d'abord `docs/chantier-interface/MAITRE.md` : il porte le but, les règles communes et la forme du compte rendu. Réponds en français.

Attends que T1 soit fusionnée : les deux tâches touchent `js/atelier.js`.

## Pourquoi
La page d'un métier (Atelier, après un appui sur un métier) est la plus longue du jeu : elle défile de 60 px à 390 × 844 et de 400 px à 320 × 568. Elle empile le choix des recettes, la fiche de la recette, l'équipe et « À construire ».

## Faits vérifiés
- La page est `.prod.atl-page`, dans `js/atelier.js`. Les feuilles « Équipe », « À construire » et « Ce qui tourne » sont des `.auto-feuille`, des panneaux qui couvrent la vue (`css/refonte-0-39.css:38`).
- `.prod-choix`, la rangée des recettes, est déclarée quatre fois (`css/atelier-production.css:8`, `css/refonte-0-39.css:56` et `:117`, `css/sobriete.css:33`). C'est une rangée qui glisse de côté, et elle le reste.
- `.auto-corps` n'a pas d'`overscroll-behavior` (`css/refonte-0-39.css:40`).
- Dans la feuille Équipe, `.atel-seuil .filters` glisse de 243 px de côté à 320 px.

## À faire
1. Mesure d'abord la hauteur de chaque bloc de la page aux cinq tailles et mets le tableau dans ton compte rendu.
2. La page devient un écran fixe : la rangée des recettes en haut, la fiche de la recette choisie au milieu, le bouton « Fabriquer » en bas, au pouce. Ce qui est secondaire (équipe, à construire, ce qui tourne) reste derrière ses feuilles.
3. Une seule déclaration de `.prod-choix`, à style calculé identique.
4. `overscroll-behavior: contain` sur `.auto-corps`. Dans une feuille, seul le corps glisse ; son titre et son bouton de fermeture ne bougent pas.
5. Cibles de 44 px de zone réellement touchable, sans agrandir le dessin : `.ing.link` (50 × 38), `.atl-retour` (44 × 40), le `summary` du « Déjà fait » (22 px, vers `js/atelier.js:1902`).
6. Baisse les plafonds « Atelier » et « Métier » de `tools/test-ux.js`.

## Fini quand
- La page d'un métier ne défile pas à 390 × 700 et au-dessus ; donne la mesure à 360 × 640 et 320 × 568.
- `node tools/test-a-construire-ui.js`, `node tools/test-carnet-production-ui.js` et `node tools/audit-interface.js --w 320,360x640,390x700,390,430 --cas atelier` passent ou s'améliorent, chiffres à l'appui.
