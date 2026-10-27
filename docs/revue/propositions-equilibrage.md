# Propositions d’équilibrage : donner un rôle à chaque étape

27 octobre 2026. Référence : `main`, commit `9ed78d9f190982797902451d3f2ee2eb46d4fbcb`. Suite de l’[audit des âges et des terres](equilibre-ages-terres.md).

## Recommandation

**Je recommande la variante B : un Désert utile dès le Fer, un Cuivre mieux accompagné et une préparation explicite à l’industrie.** Elle utilise le quartz déjà présent, ajoute **une seule recette** et aucune nouvelle ressource brute. La variante A permet une intervention encore plus légère ; la C teste un rythme spatial plus souple.

La priorité est de faire correspondre les découvertes géographiques aux besoins du joueur. Il n’est pas nécessaire de remplir chaque âge de nouvelles matières ni de faire durer les âges autant les uns que les autres. La découverte du Cuivre doit être intéressante la première fois ; un joueur qui connaît déjà ses recettes peut le traverser rapidement.

Les trois variantes ci-dessous ont été comparées dans des processus isolés. Elles ne sont pas appliquées au jeu en ligne et ne modifient pas les sauvegardes.

## Socle commun aux trois variantes

### 1. Donner une progression lisible au Cuivre

Les trois jalons actuels deviennent six, avec des objets déjà présents :

1. Fondre le cuivre.
2. Construire l’enclume de pierre.
3. Marteler une première plaque de cuivre.
4. Fondre de l’étain.
5. Construire une meule de charbonnier pour alimenter la fonte.
6. Construire le creuset, puis entrer au Bronze avec l’alliage.

Cela montre des transformations et un investissement réutilisable. Les prix de ces objets ne changent pas. La meule doit être accompagnée du rappel de pose dans la Lisière.

**Limite observée :** avec les recettes connues et de la Mémoire, ces jalons peuvent être préparés en avance ; ils allongent à peine l’âge affiché. Ce changement améliore le parcours d’apprentissage, sans prétendre garantir une durée minimale. Aucun temps d’attente artificiel n’est ajouté.

### 2. Rattacher le Désert au Fer

Le chariot passe du Bronze au Fer, avec le même coût. Le quartz et sa première carrière sont également classés au Fer pour que leur âge affiché corresponde à leur introduction.

Parcours proposé :

- **Bronze :** alliage → automate de bronze → pioche → Profondeurs → enclume de bronze.
- **Fer :** bas-fourneau → fer → chariot → route du Désert → optique → lunette.
- **Acier :** haut-fourneau → acier → trempe → usinage.

La route du Désert garde son prix actuel. Le Bronze porte ainsi une ouverture de terre, puis le Fer en porte une autre. Le Désert a un usage immédiatement après son ouverture. Sa première arrivée peut précéder la lunette ; l’Observatoire devient alors un lieu à revisiter une fois celle-ci construite. Le Gué et le sable de la Rivière gardent leur utilité.

### 3. Préparer l’industrie avant les volumes des Composites

La **ligne d’assemblage existante** devient une quête après l’ordinateur, avant le radiotélescope et la sonde pétrolière. Son coût reste : 10 processeurs, 20 moteurs électriques et 150 lingots d’acier.

Elle ne constitue pas une nouvelle recette : il s’agit de montrer une capacité déjà disponible, à un moment où les longues chaînes vont la rendre utile. La quête doit aussi expliquer que la machine assiste les commandes sur des recettes déjà fabriquées à la main. Un premier ordre utile doit en démontrer le travail.

Les simulations comparatives fabriquent cette ligne, mais ne financent pas plusieurs lignes supplémentaires ni une usine optimisée. La réduction mesurée des attentes reste donc limitée.

## Variante A — Réorganiser avec le contenu existant

**0 nouvelle ressource brute ; 0 nouvelle recette.** Une recette existante est modifiée :

| Objet | Recette proposée | Intérêt |
|---|---|---|
| Lentille | Tailler 1 verre + 1 quartz → 1 lentille | Le quartz sert au travail de l’optique dès le Fer |

Cette variante est peu coûteuse à intégrer et relie immédiatement le Désert à la lunette. Elle laisse toutefois l’usage du quartz assez ponctuel avant le Silicium. Elle convient si l’objectif est de modifier le moins possible le contenu.

## Variante B — Faire du quartz une matière de précision et de haute température

**0 nouvelle ressource brute ; 1 nouvelle recette.** Le nouvel objet est un composant dérivé du quartz, pas un nouveau gisement.

| Objet | Âge | Recette proposée | Statut |
|---|---|---|---|
| **Poudre de quartz** | Fer | Tailler 2 quartz → 4 poudres | Nouvelle recette |
| Lentille | Fer | Tailler 1 verre + 1 poudre → 1 lentille | Recette existante modifiée |
| Brique réfractaire | Fer | Chauffer 2 argiles + 1 sable + 1 poudre → 1 brique, à 1 100 °C | Recette existante modifiée |

Le quartz devient un abrasif pour polir le verre, puis une charge minérale des briques capables de supporter de hautes températures. La poudre est introduite comme quête juste avant la lunette.

Cette chaîne a deux débouchés :

- **Fer → Silicium :** lentille, lunette, puis optique du lithographe.
- **Fer → Acier → Électricité :** briques réfractaires, haut-fourneau, puis four à arc.

Le verre ordinaire reste fabriqué avec le sable de la Rivière. Le Silicium continue à utiliser le quartz directement. Aucun nouveau geste ou système de production n’est nécessaire.

### Cohérence des dépendances

Le bas-fourneau utilise des briques ordinaires : il peut donc être construit avant le Désert. Le chariot utilise roues, plaques de bronze et cordes, disponibles avant le quartz. Après ouverture du Désert, la poudre permet l’optique et les briques réfractaires. Il n’y a pas de boucle « quartz nécessaire pour atteindre le quartz ».

Le coût de la brique réfractaire crée une demande régulière de quartz bien avant le Silicium. Il faut expliquer l’intérêt de la carrière au moment du haut-fourneau ou du four à arc, pas inciter à surproduire du quartz dès l’arrivée dans le Désert.

### Pourquoi cette variante est ma préférence

Une seule recette remplit plusieurs fonctions : elle donne une raison d’entrer dans le Désert, prépare deux transitions techniques et fournit un usage à sa carrière. Son coût simulé supplémentaire face à A est faible. Elle respecte largement la limite autorisée : **une recette ajoutée et deux recettes existantes modifiées**, aucune nouvelle ressource brute.

## Variante C — B avec une entrée dans l’espace plus souple

Cette variante conserve la poudre de quartz et réduit trois volumes :

| Construction | Actuel | Proposition C |
|---|---:|---:|
| Composites dans la fusée | 400 | 300 |
| Composites pour la Rampe orbitale | 900 | 600 |
| Composites pour la Base avancée lunaire | 2 700 | 1 800 |

Les 60 boucliers thermiques de la fusée continuent à demander 60 composites. La consommation minimale avant ouverture de l’Orbite passe donc de **1 360 à 960 composites**, soit environ **−29 %**. Les autres ingrédients, les Traces des passages et les Grands Œuvres restent inchangés.

**Budget de contenu :** une recette ajoutée, trois recettes existantes modifiées (lentille, brique réfractaire, fusée). Les autres changements portent sur les jalons, les âges affichés et deux prix de passage.

C est une option pour un parcours où l’exploration doit rester plus régulière, tout en conservant des chantiers industriels. Elle ne suffit cependant pas à elle seule à garantir un bon rythme sans automatisation. Je la traiterais comme une seconde décision après B, avec un essai humain ou un bot qui construit plusieurs lignes et en paie le coût.

## Comparaison mesurée

Scénario identique de recettes connues, 240 minutes actives, Mémoire `recolte=2, extr=2, mains=2`. Le bot utilise le vrai moteur, paie les passages et construit les objets des jalons. Il ne découvre pas les recettes et ne représente pas un nouveau joueur.

### Répartition des âges — minutes passées dans l’âge

| Âge | Actuel | A | B | C |
|---|---:|---:|---:|---:|
| Cuivre | 0,11 | 0,16 | 0,16 | 0,16 |
| Bronze | 15,98 | 8,99 | 8,99 | 8,99 |
| Fer | 2,92 | 8,06 | 8,64 | 8,64 |
| Silicium | 11,42 | 12,42 | 12,24 | 12,24 |
| Polymères | 25,18 | 21,01 | 21,10 | 21,10 |
| Composites, jusqu’au Spatial | 70,40 | 66,12 | 66,11 | 54,39 |

Le transfert d’une partie du Bronze vers le Fer fonctionne. L’ajout de la poudre représente environ une demi-minute supplémentaire dans le Fer face à A ; il ne crée pas une longue sous-chaîne de fabrication. La ligne d’assemblage demande un investissement au Silicium et facilite les phases suivantes, sans supprimer le palier des Composites.

### Ouverture des terres — minutes cumulées de jeu actif

| Terre | Actuel | A | B | C |
|---|---:|---:|---:|---:|
| Profondeurs | 21,5 | 21,4 | 21,4 | 21,4 |
| Désert | 29,3 | 28,5 | 28,5 | 28,5 |
| Gisement Noir | 59,0 | 58,1 | 58,2 | 58,2 |
| Pics Fracturés | 78,6 | 74,2 | 74,5 | 74,5 |
| Orbite | 141,7 | 132,2 | 132,4 | 120,5 |

Le Désert ne devient pas forcément plus tardif à l’horloge : il change de place dans la progression technique, et les investissements faits plus tôt modifient la vitesse de récolte. Ce sont les relations entre étapes qui sont rééquilibrées, sans ajouter un péage supplémentaire.

Dans les quatre scénarios, la Lune n’est pas encore ouverte après 240 minutes. Il reste :

| Solde du passage lunaire à 240 min | Actuel | A | B | C |
|---|---:|---:|---:|---:|
| Composites | 1 031 | 833 | 839 | 174 |
| Débris | 2 465 | 1 993 | 2 000 | 403 |

La diminution des composites dans C ne supprime donc pas le rôle des débris et de l’extraction orbitale.

### Contre-vérification sans Mémoire

Deux essais de 360 minutes actives ont été réalisés pour B et C, face au relevé de référence :

- Le Cuivre passe d’environ **1,1 à 2,1 minutes**, sans délai ajouté aux règles.
- Le Bronze passe d’environ **23,9 à 20,9 minutes** ; le Fer, de **4,5 à 7,6 minutes**.
- Les Pics arrivent vers **138,1 min**, contre 131,9 actuellement : B/C ne sont pas simplement une accélération générale.
- À 360 minutes, l’Orbite n’est pas encore ouverte : B doit encore fournir **474 composites**, C **66**, contre **462** dans la référence actuelle.

B donne du sens au quartz, mais ajoute aussi une petite charge réelle. C la compense largement pour le chantier spatial. Ces essais confirment qu’un joueur sans usine efficace peut encore rencontrer un long palier : il faut enseigner l’industrialisation, pas seulement diminuer quelques quantités.

Aucun gel de commande n’a été relevé dans les cinq essais comparatifs. La validation des références, doublons de recettes, stations et atteignabilité passe pour A, B et C. La nouvelle chaîne n’a pas encore été testée en interface mobile ni en découverte réelle des recettes.

## Mise en œuvre proposée

1. Retenir **B** pour la cohérence du contenu : Cuivre, Fer, Désert et poudre de quartz.
2. Accompagner la ligne d’assemblage d’une commande utile et visible, et annoncer les nouveaux gisements avant la fabrication de leurs extracteurs.
3. Vérifier la découverte de la poudre et le premier passage Fer → Acier avec une partie neuve.
4. Comparer un parcours avec plusieurs lignes d’assemblage à un parcours qui les ignore, puis retenir ou ajuster **C** selon le rythme souhaité.

L’intégration devra préserver les anciens stocks et les terres déjà ouvertes, ne jamais faire reculer un âge, et gérer les commandes déjà engagées avec les anciennes recettes de lentilles ou de briques. Les indices et textes d’usage devront être mis à jour. Ces migrations ne sont pas réalisées dans ce dossier de propositions.

## Reproduction

- `VALIDATE=1 node tools/essai-equilibrage.js B` : vérifie le contenu expérimental.
- `node tools/essai-equilibrage.js B memoire` : rejoue la comparaison Mémoire.
- `node tools/essai-equilibrage.js C base` : rejoue la variante plus souple sans Mémoire.
- `node tools/essai-equilibrage.js actuel memoire` : rejoue la référence.

Chaque commande modifie uniquement le contenu chargé en mémoire de son propre processus. Les relevés sont conservés dans [propositions-equilibrage-mesures.json](propositions-equilibrage-mesures.json).
