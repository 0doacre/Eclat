# Maîtrise des terres et transmission

28 octobre 2026. Travail fondé sur `main` à `93ff145`, après les réglages de production et de relève de Gemini.

## Boucle retenue

Chaque terre principale propose cinq objectifs de maîtrise visibles dans le Domaine : premiers équipements, exploration principale, ouvrage, production automatique et série de fabrications. Ils avancent en parallèle : cette structure ne crée pas cinq verrous supplémentaires. Une fois les cinq accomplis, la maîtrise affiche 100 %, présente la terre suivante et suit l'état de sa frontière. Le passage conserve ses conditions et ses prix existants ; maîtriser la terre n'est pas une condition pour continuer.

Les 100 % désignent cette liste d'objectifs, jamais la totalité du contenu caché. Aucun secret, lieu caché, déchiffrement ou collection exhaustive ne conditionne le bonus. Mercure, dernier territoire principal, n'annonce pas de terre fictive. Le Caveau reste hors de ce système.

## Gain à la relève

Une terre maîtrisée et ouverte dans le cycle accorde **+5 points de débit**, une seule fois à la relève. Dix transmissions donnent **+50 %**, plafond permanent. Il s'agit de bonus additifs entre les paliers territoriaux, puis multiplicatifs avec les autres systèmes. À +50 %, une opération de dix minutes prend environ six minutes quarante : le temps n'est pas divisé par deux.

Le bonus s'applique :

- aux extracteurs installés dans cette terre, y compris pendant les absences ;
- aux fabrications manuelles et aux machines pour les recettes explicitement associées à la terre dans `js/territoires.js`.

Une recette ne bénéficie que d'une terre. Les ingrédients n'ajoutent pas leurs propres bonus au temps de l'opération : une lanière reste une recette de la Plaine même si une sous-recette utilise de la fibre de la Lisière. Les sous-recettes profitent de leur propre rattachement lorsqu'elles sont effectivement fabriquées. Les recettes associées déjà connues sont consultables dans le détail de maîtrise.

Le bilan de relève et la Mémoire affichent les bonus conservés et les gains précis de la relève proposée. Les objectifs et la production du cycle repartent de zéro ; les recettes connues restent acquises selon les règles habituelles. Réparer un équipement compte comme le reconstruire. Pour reprendre +5 points, il faut explorer, produire et fabriquer de nouveau dans le cycle suivant. Répéter des relèves sans travail supplémentaire ne donne aucun palier territorial.

La maîtrise accomplie est mémorisée dans le cycle : vendre des produits ou déplacer un extracteur ne la retire pas. La production comptée est l'extraction automatique réellement achevée dans la terre ; acheter ou recevoir des stocks ne remplit pas cet objectif.

## Terres qui évoluent

Les séries et les objectifs de production doublent après quatre transmissions et triplent après huit, sans croissance illimitée. Les quantités initiales sont des valeurs de première implémentation à éprouver sur les parties humaines, pas des durées cibles validées.

Le Désert possède en plus quatre chapitres selon ses transmissions déjà acquises, fixés pour tout le cycle :

| Bonus acquis au départ | Chapitre | Ouvrage | Série |
|---|---|---|---|
| 0 % | Première installation | Lentille | Verre |
| +5 à +15 % | La précision | Acier trempé | Verre trempé |
| +20 à +30 % | La vapeur | Moteur à vapeur | Circuit de vapeur |
| +35 à +50 % | Les circuits | Ordinateur | Puces |

Les chapitres ne changent pas d'objectif en pleine partie. L'optique, les installations de vapeur, l'électricité et le numérique sont des recettes associées au Désert ; les filières de fer et d'acier restent associées aux Profondeurs.

## Articulation avec Gemini et limites

Les courbes de durée, la fatigue, l'élan, les achats de Mémoire et les suggestions de relève de `93ff145` sont conservés. Aucun prix de recette, passage ou Grand Œuvre n'est augmenté dans ce chantier. La maîtrise ajoute une récompense territoriale, sans rééquilibrer simultanément les mêmes coûts.

Le mur après une frontière reste porté par la progression existante. Son amplitude devra être mesurée avec les réglages de Gemini ; ce travail ne prétend pas avoir validé une croissance régulière des durées humaines, ni l'intérêt de dix reprises des premières terres. Le gain territorial de 5 % complète les autres gains de relève et ne doit pas être présenté comme leur remplacement.

Les états sont additifs à la sauvegarde v12 : `meta.terres` conserve les paliers et `territoires` conserve les compteurs et maîtrises du cycle. Une ancienne partie reçoit des paliers nuls ; ses fabrications et explorations actuelles restent utilisables pour les objectifs. Sa production passée n'est pas inventée. Aucun palier de relève historique n'est attribué rétroactivement.

La branche de prévisualisation de l'Atelier par équipements n'est pas fusionnée ici. L'intégration présente porte sur le moteur et l'interface actuels de `main` ; les gestes par outils et l'économie expérimentale devront reprendre ces mêmes multiplicateurs lors de leur synchronisation.

## Vérification

- `npm test` inclut les vingt et un tests de maîtrise : transmission, plafond, attribution unique, production réelle, hors ligne, périmètre des bonus, anciennes sauvegardes, nouveau départ et objectifs sans secrets.
- `npm run test:territoires-ui` vérifie le Domaine, les compteurs, la maîtrise du Désert, l'aperçu, le bilan, la relève et sa persistance en 320, 390 et 980 px.
- Le scénario existant de deux cycles maîtrise la Lisière au premier cycle : le second atteint la Plaine à 1,418 min et la Rivière à 15,185 min, contre 1,427 et 15,293 auparavant. Ces mesures concernent ce scénario de bot, pas les joueurs humains.

Prochaine validation de conception : comparer poursuivre / investir / relever à l'arrivée au Désert, puis au premier chantier du Gisement Noir, et observer la clarté du gain annoncé avant la relève.
