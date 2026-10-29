# La Lisière — carnet des découvertes

Le Domaine du thème Carnet conserve un camp précis devant une forêt encore esquissée.
L’exploration du Grand Chêne révèle la planche existante. La Grotte aux Mains ajoute une étude de paroi dans la marge, consultable en grand.
Le Cercle de Pierres ajoute une troisième étude, vue depuis les airs après l’exploration au cerf-volant. La grotte et le paysage restent visibles. Le cerf-volant seul et la page des mains ne débloquent pas cette illustration.

Les durées, coûts (dont la torche), récompenses et textes du récit restent ceux du moteur.
Les acquis sont lus dans les explorations, fragments et pages existants ; ils suivent la relève et l’import sans nouveau format de sauvegarde.
Les mains ne sont pas peintes par l’animation : l’étude d’une paroi déjà marquée se révèle.
La révélation d’une nouvelle étude attend la fermeture du récit, respecte la réduction des animations, et ne se rejoue pas au rechargement.
Les autres terres et le thème classique gardent leur présentation.

## Illustrations

Quatre originaux PNG ImageGen dans `masters/`, prompts exacts dans `prompts.json` et `prompt-cercle.json`.
`tools/export-decouvertes-carnet.py` produit les WebP transparents sans retouche artistique.
La planche en couleurs de la Lisière, le papier et les boutons sont les assets Carnet existants.

## Son

« Crayon papier #3 », Joseph SARDIN & Axeline T., LaSonotheque.org, CC0.
https://lasonotheque.org/crayon-papier-3-s3234.html
Extrait mono de 7 secondes à 48 kb/s : `assets/carnet/audio/crayon.mp3`.
Le bruitage joue brièvement au début du geste et lors de la révélation, raccordé au bus des effets et aux réglages sonores existants ; aucune boucle pendant toute l’attente.

## Validation

`node tools/test-decouvertes-carnet-ui.js` : partie jetable, explorations réelles, reprise en cours, découverte, consultation, héritage, rechargement, nouvelle partie, mobile et mode compact.
`npm test`, contrôles UI Carnet et paysages, cache hors ligne.
