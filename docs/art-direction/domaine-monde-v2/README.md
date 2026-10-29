# Domaine V2 — le monde et le geste

Prototype indépendant : `docs/art-direction/domaine-monde-v2/`. La V1 reste disponible pour comparaison.

## Écran de jeu

- Pleine hauteur, sans empilement de rubriques sous la carte. Menu de démonstration, chapitres et comparaison dans ☰.
- Cadrage initial proche du camp ; découverte du Chêne puis ouverture du sentier élargissent le monde. Retour au camp, ensemble et zoom manuel restent disponibles. Le cadrage est sauvegardé.
- Ressources sous forme d’illustrations seules. Le toucher récolte ; le petit + et l’appui long ouvrent une gestion temporaire. Récolter ne déplie pas la fiche.
- Lieux sélectionnables dans le paysage : contours au survol/focus, nom et action à proximité, progression au crayon autour du lieu. Le temps restant est indiqué sur le lieu actif.
- Le sentier se dégage sur la carte. Les illustrations découvertes apparaissent brièvement puis restent au Carnet.

## Gamefeel et palette

Les cibles de récolte ne bougent pas : seule leur illustration se comprime et rebondit. Copeaux, fibres ou poussières sont dessinés dans la palette de la matière. Les gains apparaissent sur place, se regroupent lors des touches très rapprochées, et disparaissent rapidement. Les coups critiques restent ceux du moteur. Aucun tremblement global de caméra.

Le nombre de particules est plafonné à 90 et la boucle s’arrête quand elles ont disparu. Au plus huit gains restent visibles. La réduction des animations conserve le gain en texte sans particules, rebond ou mouvement de caméra. Les cibles gardent leur taille tactile.

Le son est désactivé au départ et s’active par un geste explicite. Le module audio existant fournit les matières, la découverte, la construction et le graphite. Aucun nouveau son externe. L’action de récolte fonctionne sans son ni vibration.

## Géographie complète et futurs calques

`world-layout.js` est la source commune des repères. Il réserve toutes les terres du moteur, y compris le lieu souterrain rattaché aux Profondeurs ; orbite et astres ont une échelle distincte. Les régions réservées ne sont pas rendues ni révélées au joueur. Le camp garde son origine `(750, 850)` ; les lieux actifs sont ancrés sur les éléments reconnaissables de l’illustration.

Ordre de composition prévu : papier → terrain → eau → végétation → chemins → lieux → camp → installations → annotations → interactions. Chaque futur asset doit déclarer sa terre, son calque, ses dimensions et son point d’ancrage dans ce repère commun. Les coutures ont besoin de marges transparentes superposables, sans étirer les objets. Les hitboxes sont indépendantes de la résolution de peinture.

**Le fond actuel est une étude de composition aplatie.** ImageGen n’a pas produit un PSD multicouche. Le contrat le désigne explicitement comme `reference-composite` : il ne faut pas présenter ce fichier comme les futurs calques de production. Les illustrations de terrain, végétation et lieux devront être produites séparément à partir du plan d’ensemble, puis vérifiées sur les premières terres avant de généraliser. Le découpage par calques ne doit pas simplement empiler plusieurs copies du même fond.

Les positions futures sont des réservations de composition, pas des frontières finales. Leur détail se vérifiera à chaque raccord ; les repères des lieux actifs et la progression du moteur restent stables.

## Isolement et limites de l’étude

La sauvegarde dédiée est `eclat.prototype.monde.v2`, contenant la partie de démonstration et son cadrage. Le prototype ne lit ni ne modifie les parties main/preview, le compte ou la V1. Il n’active pas de Service Worker. Le vrai moteur gère récolte, extracteurs, production, explorations et passage. Les explorations durent 6 secondes et quelques installations/matériaux sont fournis. Seuls les deux premiers lieux de chaque terre sont jouables ici. Le Cercle de Pierres représenté dans le décor conserve sa place pour une extension ultérieure ; son exploration n’est pas simulée.

Nouvelle peinture de composition produite avec ImageGen, encodée en WebP. Camp, ressources, installations et pages réutilisent les illustrations du Carnet. Aucun remplacement du Domaine de production à ce stade.

## Vérification

- `npm run test:domaine-monde-layout` : toutes les terres ont un emplacement, repères actifs contenus dans leur terre, ordre des calques et échelles distinctes.
- `npm run test:domaine-monde-v2-ui` : 320/390/1200 px, fonctionnement dans un écran, récolte, gain, particules/rebond et réduction des animations, appui long sans récolte, pose/amélioration/production, les quatre explorations, contours et récompenses, passage, cadrage restauré, son et sauvegardes main/preview/V1 inchangées.
- Pour Playwright local : variables `PW` et `CHROMIUM` selon l’environnement ; captures via `PATH_SHOTS`. `TEST_URL` permet de vérifier le même parcours sur le site déployé.
