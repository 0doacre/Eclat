# Revenir dans une terre connue

Le premier passage conserve ses objectifs de découverte. Aux passages suivants, la maîtrise ne demande plus de refaire les explorations principales ni la série de base déjà accomplie. Ces acquis sont conservés, même si la terre n'était pas encore entièrement maîtrisée. Les anciens rangs de maîtrise attestent aussi de ces acquis.

Pour gagner les cinq points de débit suivants, il faut rouvrir la terre, remettre un extracteur en activité, produire réellement sur place et réaliser l'ouvrage du retour. Neuf ouvrages successifs accompagnent les neuf paliers restants. Les recettes inconnues restent anonymes. Le volume de production reste celui du premier passage ; les commandes et les durées de Gemini restent inchangées.

## Plan de reprise

Une relève disponible mémorise les extracteurs posés, leurs gisements, les machines possédées et les outils, stations et améliorations. Une relève moins avancée ne remplace pas l'installation de référence. Les objectifs de fabrication accomplis sont aussi mémorisés : les étapes déjà connues d'une même terre et d'un même âge sont regroupées dans le guide. Le détail et la prochaine action restent accessibles. Une découverte nouvelle et un suivi explicite gardent leur présentation habituelle.

Dans le Domaine, « Voir le plan de reprise » permet de choisir les équipements et de vérifier les ressources à dépenser ou réserver. Le devis est calculé dans une copie isolée du moteur, avec les mêmes prix et prérequis. Il privilégie les extracteurs libres et les ruines réparables, puis les commandes entièrement financées. Au maximum 24 opérations sont proposées par lancement ; les autres attendent une nouvelle validation.

La validation utilise uniquement les opérations affichées. Elle ne dépense pas davantage si le prix a augmenté, ne déplace pas les équipements déjà installés et ne duplique pas les commandes en cours. Les terres fermées et les prérequis manquants attendent. Il n'y a aucune dépense automatique à l'arrivée de nouvelles ressources. Les machines sont reconstruites en réserve ; leurs anciennes affectations et les anciennes commandes ne sont pas rejouées.

Les anciennes sauvegardes sans plan proposent une reconstruction à partir des seules ruines encore présentes, avec des emplacements suggérés. Le prochain sommet réellement enregistré fournit un plan exact. Un nouveau départ efface le plan et les acquis territoriaux.

## Vérification

`npm test` inclut les tests de maîtrise et de reprise. `npm run test:reprise-ui` vérifie le devis, la sélection, la validation, les poses, l'absence de double lancement et les débordements à 320, 390 et 980 pixels, dans les deux ateliers lorsqu'ils sont disponibles. `npm run test:territoires-ui` vérifie l'ouvrage du retour, les acquis, le bonus annoncé et sa persistance après la relève.
