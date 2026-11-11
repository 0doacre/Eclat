# T6 · Les tests d'interface rouges, et une commande pour tous

Lis d'abord `docs/chantier-interface/MAITRE.md` : il porte le but, les règles communes et la forme du compte rendu. Réponds en français.

## Pourquoi
`npm test` ne lance aucun test de navigateur. Il existe 32 fichiers `tools/test-*-ui.js`, lancés à la main un par un, et cinq sont rouges depuis avant ce chantier. Tant qu'ils le sont, personne ne sait si un changement casse quelque chose.

## Faits vérifiés (11 novembre 2026)
- Rouges : `test-decouvertes-carnet-ui` (« 320 première planche révélée »), `test-age-os-carnet-ui` et `test-illustrations-raccord-ui` (délai dépassé sur `scrollIntoViewIfNeeded`), `test-paysages-carnet-ui` (« 320/false/lisiere vignette présente »), `test-monde-production-ui` (« monde intégré »).
- Verts : `test-ux`, `test-terres-fixe-ui`, `test-territoires-ui`, `test-sentier-chantier-ui`, `test-carnet-mobile-ui`, `test-atlas-ui`, `test-friction-ui`, `test-juice-ui`.
- Les autres n'ont pas été lancés ce jour-là.
- Piste : sur téléphone, les scènes de chantier (`.sentier-chantier`, `.passerelle-chantier`) et le paysage du carnet sont masqués exprès depuis la refonte sobre. Un test qui attend de les voir à 320 px est sans doute périmé.

## À faire
1. Lance les 32 fichiers et dresse le tableau : vert ou rouge, et la cause en une ligne.
2. Pour chaque rouge, tranche : le test est périmé (l'interface a changé exprès) ou le jeu a un défaut. Appuie-toi sur le `git log` du fichier testé.
3. Test périmé : mets-le à jour pour qu'il vérifie le comportement d'aujourd'hui, sans le vider de son sens. Défaut du jeu : ne corrige rien, décris-le avec les pas pour le revoir.
4. Ajoute `npm run test:ui`, qui lance tous les tests d'interface l'un après l'autre, continue après un échec et finit par un tableau, avec un code de sortie non nul s'il reste un rouge.
5. Ne touche à aucun fichier du jeu (`js/`, `css/`, `index.html`).

## Fini quand
- `npm run test:ui` existe et son tableau est dans ton compte rendu.
- Chaque test encore rouge l'est pour un défaut du jeu, décrit.
