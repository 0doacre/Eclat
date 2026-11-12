# T6 · Les tests d'interface rouges, et une commande pour tous

Lis d'abord `docs/chantier-interface/MAITRE.md` : il porte le but, les règles communes et la forme du compte rendu. Réponds en français.

## Pourquoi
`npm test` ne lance aucun test de navigateur. Seize des trente-six tests d'interface sont rouges depuis avant ce chantier. Tant qu'ils le sont, personne ne sait si un changement casse quelque chose.

## Faits vérifiés (12 novembre 2026, version 0.67.0)
- `npm run test:ui` existe (`tools/test-ui.js`) : il lance les 36 tests de navigateur l'un après l'autre, continue après un échec et finit par un tableau. `npm run test:ui -- carnet fiches` n'en lance qu'une partie. `PW=<chemin>/node_modules/playwright` sert aussi aux tests qui écrivent `require("playwright")`.
- 20 verts, 16 rouges. Les rouges l'étaient déjà avant le chantier : aucun ne vient des tâches T1 à T5 ni de l'intégration.
- Les 16 rouges, avec leur première erreur :
  - `test-appareil-ui` : « la touche 2 ouvre la Carte » (les raccourcis d'onglets ont changé).
  - `test-archives-ui`, et sans doute `test-assistance-ui`, `test-comptes-ui`, `test-filtre-decouverte-ui`, `test-mode-test-ui` : délai dépassé sur un clic de `#atlasToggle`, le bouton d'aspect qui n'est plus visible.
  - `test-age-os-carnet-ui`, `test-atelier-dessine-ui`, `test-illustrations-raccord-ui` : délai dépassé (une image chargée à la demande hors de la zone visible, ou `scrollIntoViewIfNeeded`).
  - `test-decouvertes-carnet-ui` : « 320 première planche révélée ». `test-paysages-carnet-ui` : « 320/false/lisiere vignette présente ». `test-retours-ui` : « 320/false : décor au bord supérieur ». `test-monde-production-ui` : « monde intégré ».
  - `test-progression-ui` : à lire. `test-stockage-ui` : « deux pages : la seconde attend, n'écrit rien », 187 s.
  - `test-browser-qol` : ne trouvait pas Playwright ; à relancer avec la nouvelle commande.
- Piste : sur téléphone, les scènes de chantier (`.sentier-chantier`, `.passerelle-chantier`) et le paysage du carnet sont masqués exprès depuis la refonte sobre, et le style Atlas n'a plus de bouton. Un test qui les attend est sans doute périmé.

## À faire
1. Pour chaque rouge, tranche : le test est périmé (l'interface a changé exprès) ou le jeu a un défaut. Appuie-toi sur le `git log` du fichier testé.
2. Test périmé : mets-le à jour pour qu'il vérifie le comportement d'aujourd'hui, sans le vider de son sens. S'il ne vérifie plus rien qui existe, propose sa suppression dans ton compte rendu, ne le supprime pas.
3. Défaut du jeu : ne corrige rien, décris-le avec les pas pour le revoir.
4. Ne touche à aucun fichier du jeu (`js/`, `css/`, `index.html`) ni à `tools/test-ui.js`.

## Fini quand
- Le tableau de `npm run test:ui` est dans ton compte rendu.
- Chaque test encore rouge l'est pour un défaut du jeu, décrit.
