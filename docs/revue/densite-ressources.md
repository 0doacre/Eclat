# Densité : donner une raison aux recettes

Premier lot, 0.21.0. Direction retenue avec l’auteur : une ou plusieurs ressources brutes par âge peuvent expliquer le changement de technique. Pour chaque ressource, choisir un lieu, un moyen de récolte, une propriété qui compte et des usages. Le nombre d’objets et la durée ne suffisent pas à juger la densité.

## Ce lot : eau et polymères

L’eau existe depuis le début dans le récit. À la Vapeur, elle devient une ressource de chantier : on en fait venir régulièrement de la Rivière. Ce n’est pas une découverte tardive de l’existence de l’eau. La pompe à bras se fabrique avec des pièces d’acier et de cuivre ; elle ne demande pas le moteur qu’elle permettra de construire.

| Chaîne | Propriété utile | Usage dans le jeu |
|---|---|---|
| Rivière → pompe à bras → eau | Chauffer et refroidir un fluide | Circuit de vapeur, condenseur, puis refroidissement |
| Plaque de cuivre → tuyau | Conduire l’eau et échanger de la chaleur | Circuit de vapeur et condenseur ; échangeur aux Polymères |
| Chaudière + tuyaux + eau → circuit → moteur | Amener la vapeur aux pistons | Le moteur garde ses usages et reçoit une alimentation concrète |
| Condenseur + moteurs + régulateurs | Récupérer la vapeur sous forme d’eau | Récupération de vapeur : vitesse des machines +25 % |
| Pétrole → naphta | Séparer une fraction pour la chimie | Plastique, résine et caoutchouc ; le pétrole brut garde la dynamite |
| Collines → soufrière → soufre | Donner au caoutchouc sa tenue élastique | Caoutchouc, puis joints et tuyaux souples |
| Cuivre + raccords souples + joints → échangeur | Faire circuler l’eau sans fuite | Refroidissement : vitesse des machines +50 % |

Treize nouveaux objets : eau, tuyau de cuivre, circuit de vapeur, condenseur, récupération de vapeur, pompe à bras ; soufre, naphta, joint d’étanchéité, tuyau souple, échangeur thermique, refroidissement des machines, soufrière. Les deux améliorations multiplient ensemble la vitesse des machines par 1,875. Le bonus touche aussi la vitesse des chantiers, comme les autres effets `aspd` du jeu.

L’eau et le soufre suivent le modèle de l’uranium : gisements d’extracteur, sans bouton de récolte à la main. La pompe est posée à la Rivière, la soufrière dans les Collines. Les recettes restent à trois ingrédients au plus. Le guide mène à l’extracteur avant la ressource. Les nouvelles étapes font parcourir la chaîne ; les ressources servent ensuite dans les fabrications en quantité.

L’eau est consommée par les recettes qui en demandent, pas en continu par les moteurs : ce lot n’ajoute pas de système de carburant. Les condenseurs n’ajoutent pas de production d’eau secondaire. Ce sont des simplifications volontaires, comme la synthèse directe du caoutchouc depuis le naphta et le soufre.

## Parties existantes

Aucun âge inséré, aucune renumérotation. Les stocks, recettes apprises, fabrications, commandes et âges accomplis restent chargés. Un moteur ou du caoutchouc déjà fabriqué reste utilisable. Les recettes apprises utilisent les nouveaux ingrédients pour les prochaines commandes. La migration de sauvegarde v10 → v11 marque les commandes déjà préparées qui contiennent une recette modifiée : elles gardent leurs ingrédients d’origine, leur quantité et leur avance, y compris après une nouvelle sauvegarde ou avec l’aide des machines. Un lot neuf ne peut pas s’ajouter à un lot à l’ancien prix. Un joueur qui se trouve dans un âge enrichi en suit les nouvelles étapes ; un joueur qui l’a dépassé ne recule pas.

## Mesures et limites

Le plan alpha 0.20 confondait l’entrée dans un âge et le temps passé dedans. Dans l’ancienne sortie, « Vapeur +52 s » signifiait **52 s dans l’Acier avant d’entrer en Vapeur**. La Vapeur prenait en fait 8 min 34 ; les Polymères, 1 min 59. Les âges vraiment inférieurs à une minute étaient Bois, Os, Acier et Silicium.

Le bot affiche désormais entrée et durée dans l’âge. Il construit aussi l’extracteur d’une ressource inaccessible à la main avant de poursuivre un investissement. Sans cette règle, le mode `MAINS=1` pouvait viser une scierie, attendre son eau et ne jamais fabriquer de pompe. Cette correction concerne aussi les ressources de l’Atome.

Comparaison sur les données 0.20 et 0.21, avec **le même bot corrigé**, 4 appuis/s, graine 1, fin Dyson, fabrication instantanée :

| Mesure | Données 0.20 | Données 0.21 |
|---|---:|---:|
| Temps dans la Vapeur | 8 min 34 | 9 min 12 |
| Temps dans les Polymères | 1 min 41 | 2 min 12 |
| Partie entière | 1 h 15 min 57 | 1 h 18 min 15 |

Avec les durées manuelles et l’aide des machines (`MAINS=1`), la 0.21 termine en 2 h 50 min 47. Le bot connaît toutes les recettes et ignore une partie des coûts de découverte et de passage. Ces chiffres vérifient surtout l’absence de blocage ; ils ne prédisent pas la durée d’une partie humaine.

Tests : récolte et retour hors ligne, guidage sans cycle de prérequis, commandes réelles de moteurs et de refroidissement, coûts annoncés et consommés, effets des améliorations, progression et sauvegarde, fin du bot dans les deux modes et attribution correcte de ses durées. Contrôles mobiles : nouvelles recettes et branche du circuit à 320/390 px, texte normal/grand texte, en plus du parcours existant.

## Les lots suivants

Commencer par examiner l’Acier et le Silicium avec les mesures corrigées. Étudier le manganèse pour les propriétés de l’acier, le mica pour isoler les équipements électriques, une silice de haute pureté pour le Silicium et le basalte pour des fibres minérales aux Composites. Ce sont des pistes, pas des recettes arrêtées. Ne pas appeler « ressource brute » un produit déjà synthétisé. Garder des usages communs entre les âges pour que les anciennes ressources ne deviennent pas des déchets.

L’Atome garde ses deux ressources et pourra recevoir un deuxième niveau d’extracteur. Le Stellaire demande surtout un examen de ses choix et de ses usages : dix objets ne prouvent pas que l’âge est court, puisqu’il contient une grande part du chantier final.

## Appuis techniques

Les recettes sont des raccourcis de jeu, pas des procédés industriels. Les propriétés retenues s’appuient sur ces sources :

- [Science Museum : le condenseur séparé de Watt](https://blog.sciencemuseum.org.uk/james-watt-and-the-separate-condenser/), pour la condensation à l’écart du cylindre chaud.
- [TotalEnergies Donges : raffinage et pétrochimie](https://donges.totalenergies.fr/la-plateforme-de-donges/notre-identite/raffinage-et-petrochimie), pour le naphta comme point de départ de chaînes pétrochimiques.
- [RSC Advances : rôle du soufre dans les polymères](https://pubs.rsc.org/en/content/articlehtml/2021/ra/d0ra10507d), pour la réticulation du caoutchouc par le soufre.
