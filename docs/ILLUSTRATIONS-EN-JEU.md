# Pierre, Cuivre et passages dans le Carnet

Les lots artistiques sont raccordés au jeu réel dans le thème Carnet (`vivant`). Le Domaine reste en pages ; le style classique conserve ses icônes vectorielles.

- `js/illustrations.js` associe les 36 objets d’âge Pierre/Cuivre et les cinq gisements nouveaux à leurs WebP. Les surfaces qui utilisent les icônes du jeu (fiches, Carnet, Réserve, Atelier, Domaine) passent par ce registre. Les recettes, noms, quantités et conditions restent ceux du moteur.
- La Rivière et les Collines gardent leur paysage existant, y compris l’évolution à vapeur de la rivière. Le Gué, la Carcasse, l’Escalier Noyé, les Rails, la Vue du Sommet et le Replat ajoutent des études larges, consultables en grand. Le dessin apparaît à la fin de l’exploration, avec la révélation du carnet ; pendant l’exploration, seule sa place en préparation est visible.
- Les acquis sont lus dans le nombre d’explorations, les fragments anciens et actuels et les pages mémorisées. Aucune collection parallèle ni version supplémentaire de sauvegarde. Les illustrations sont retrouvées après relève lorsque la terre redevient accessible.
- `js/passerelle-chantier.js` lit les vrais apports vers la Rivière. Les trois états illustrés passent des berges à la charpente puis au tablier. La frontière reste soumise aux règles, coûts et explorations du moteur. Le chantier achevé reste dans la Plaine ; « Revoir les travaux » ne consomme rien.
- Les gestes de récolte et l’appui maintenu ne changent pas. Les animations s’arrêtent lorsqu’elles sont terminées ou hors écran ; la réduction des animations affiche directement les états acquis.
- Les 50 nouveaux WebP et les scripts/styles utilisés sont précachés hors ligne. PNG sources, ZIP et pages de revue restent exclus du précache.

Vérifications : `npm test` inclut l’inventaire, les fichiers hors ligne, l’absence de révélation anticipée et la mémoire des anciennes sauvegardes. `npm run test:illustrations-ui` contrôle le jeu à 320, 390 et 1280 px : apports et ouverture de la Passerelle, relecture, six explorations réelles, bonnes planches en grand, cinq gisements, appui maintenu, icônes du Carnet et rechargement. Les durées sont déplacées uniquement dans les parties jetables du test.
