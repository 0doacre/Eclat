# T2 · Fenêtre d'ouverture : le pied fixé

Lis d'abord `docs/chantier-interface/MAITRE.md` : il porte le but, les règles communes et la forme du compte rendu. Réponds en français.

## Pourquoi
À la première seconde du jeu, sur un petit téléphone, le bouton « Ouvrir les yeux » est hors de l'écran : il faut faire défiler une fenêtre sans croix pour le trouver (162 px à 320 × 568).

## Faits vérifiés
- La fenêtre est construite dans `js/memoire.js`, vers la ligne 69 : un bloc `.lore` (les lignes du récit, qui apparaissent une à une) puis `.acts`.
- Au premier réveil, `.acts` porte trois boutons : « Ouvrir les yeux », « Aa Grand texte », « Sans guide ». Fixés tels quels, ils prennent un tiers d'un écran de 568 px.
- La fenêtre est persistante : pas de croix, pas de fermeture en touchant à côté.

## À faire
1. Le pied de la fenêtre reste en bas ; le récit défile au-dessus, dans son propre cadre (`overscroll-behavior: contain`).
2. « Ouvrir les yeux » est atteignable dès l'ouverture, avant la fin de l'apparition des lignes.
3. Au premier réveil, les deux réglages tiennent sur une seule rangée sous le bouton principal, sans changer leurs mots. Si cela ne tient pas à 320 px, garde l'ordre actuel et dis-le.
4. Donne à cette fenêtre une classe par `o.cls` (`js/ui.js:494`) et écris ses règles dans le bloc « fenêtres » de `css/fin.css`.

## Fini quand
- Sur une partie neuve, à chacune des cinq tailles, « Ouvrir les yeux » est entier à l'écran sans défiler.
- Le récit se lit en entier (en défilant s'il le faut) et aucune ligne ne reste cachée sous le pied en fin de défilement.
- Les éveils suivants (cycle 2 et plus, réveil libre) passent aussi.

## Tests à lancer
`node tools/test-ouverture-ui.js`, puis `node tools/audit-interface.js --w 320,360x640,390x700,390,430 --cas ouverture`.
