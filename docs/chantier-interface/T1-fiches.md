# T1 · Fiches : l'erreur `perTime`, puis un panneau fixe à deux pages

Lis d'abord `docs/chantier-interface/MAITRE.md` : il porte le but, les règles communes et la forme du compte rendu. Réponds en français.

## Pourquoi
La fiche d'un objet (appui long sur une ressource ou une recette) est une colonne haute qu'on fait défiler. Celle du Bois fait 811 px : elle défile de 68 px à 390 × 844 et de 195 px à 390 × 700. Et la fiche d'un extracteur ne s'ouvre pas du tout.

## Faits vérifiés
- `js/atelier.js:1581` appelle `perTime`, qui n'existe pas dans ce fichier : il reçoit `perMin` (ligne 10). L'erreur est en ligne depuis le 28 octobre.
- Le plafond des fenêtres est posé deux fois : `css/style.css:531` (`max-height: 88vh`) et `css/design-preview.css:1005` (`min(88vh, 88dvh)`).
- Blocs de la fiche du Bois à 390 px : en-tête 144 px, « Sert à fabriquer » 206 px (six liens), « Étudier » 97 px, rangée « Fermer » 63 px (la croix existe déjà).
- Une fenêtre prend une variante par `o.cls` (`js/ui.js:494`).

## À faire, dans cet ordre
1. Remplace les trois `perTime` de la ligne 1581 par `perMin`. Ajoute à `tools/test-fiches-ui.js` un contrôle qui ouvre la fiche d'un objet de chaque sorte (`it.t` dans `js/data.js`) sans erreur de page. Commite seul : ce correctif doit pouvoir sortir sans le reste.
2. Relève le plafond des fenêtres à la hauteur de l'écran moins 24 px, zones de sécurité comprises (`env(safe-area-inset-*)`), aux deux endroits.
3. Fais de la fiche un panneau de taille fixe à deux pages : la première dit ce qu'est l'objet et d'où il vient, la seconde ce qu'il sert à fabriquer et son étude. Deux onglets en haut du panneau, sur le modèle de ceux du Menu (`.m-nav-tab`). La page ouverte se retient pendant la partie.
4. La rangée « Fermer » du bas double la croix : ne la retire pas, mais chiffre ce qu'elle coûte dans ton compte rendu.

## Fini quand
- Aucune fiche ne lève d'erreur de page, pour chaque sorte d'objet.
- La fiche d'une ressource et celle d'une recette ne défilent pas à 390 × 700, 390 × 844 et 430 × 932. À 320 × 568 et 360 × 640, donne la mesure.
- Le focus revient à l'ouverture et à la fermeture, `aria-labelledby` tient, la croix reste visible et le titre ne la recouvre pas.

## Tests à lancer
`node tools/test-fiches-ui.js`, puis `node tools/audit-interface.js --w 320,360x640,390x700,390,430 --cas fiche,menu,comptoir,memoire,aide`.
