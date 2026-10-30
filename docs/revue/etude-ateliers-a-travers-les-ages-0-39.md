# Étude : les ateliers à travers les âges (0.39)

Idée du porteur du projet, 30 octobre 2026 : reproduire l'histoire de la production en petit et en casual. **Je couds à la main** (néolithique), **je donne à coudre à mon apprenti** (antiquité, Moyen Âge), **j'embauche des ouvriers** (époque moderne), **des machines à coudre aident mes ouvriers** (révolution industrielle), **je remplace mes ouvriers par des robots** (époque contemporaine et après). Une machine va dans un atelier. Ce document remplace, comme direction, les chapitres 5 et 6 de `etude-chaines-production-0-39.md` (C0 reste utile, voir chapitre 8). Marques : **[M]** mesuré dans le dépôt, **[Mém]** de mémoire.

## 0. Ce qui est décidé

- **Six familles d'ateliers** : Élevage, Artisanat, Métallurgie, Centrales, Électronique, Artistique (autres à repérer).
- **L'âge débloque le niveau, le joueur choisit où investir en premier**, à l'essai.
- **Pas de réservation de machines à calculer** : une machine installée dans un atelier y reste.
- **L'énergie** : chaque objet met un temps à se produire, ce qui représente de l'énergie ; chaque machine « vaut des chevaux ».
- **L'argent du Troqueur doit servir** : à embaucher. Un coût d'embauche remplace le marchand automatique (voir le chapitre 5).
- **Des emplacements propres** pour les textes et les images, avant que Codex et le porteur du projet n'écrivent et ne dessinent.

## 1. Ce que le moteur a déjà [M]

| Échelon | Ce qui existe | Ce qui manque |
|---|---|---|
| **Main** | la file des commandes (`S.hand.q`), niveaux de gestes | rien |
| **Apprenti** | un seul, à l'établi (bourse en écus, parts, troc de lanières) | un apprenti par atelier |
| **Ouvriers** | rien | tout |
| **Machines** | cinq paliers en parc commun : automate de bois (âge 2), automate de bronze (4), presse à vapeur (7), ligne d'assemblage (10), assembleur moléculaire (13) | les rattacher à un atelier |
| **Robots** | l'amélioration « Robots » (âge 10), l'assembleur | un échelon qui remplace les ouvriers |
| **Énergie** | rien | tout (seulement des multiplicateurs de vitesse `aspd`) |
| **Argent** | les écus : ventes au Comptoir et au Troqueur, achat de pages, embauche de l'apprenti | un usage régulier |

**Point à régler : le calendrier des machines.** Les « automates » arrivent tôt (Pierre, Bronze), bien avant la révolution industrielle. Deux sorties :
- **Renommer les cinq paliers** pour qu'ils collent à l'histoire : *métier* (aide l'apprenti), *mécanisme* (moulin, courroies), *machine à vapeur*, *ligne d'assemblage*, *robot*. Aucune migration, seulement des noms et des textes. **C'est ma préférence.**
- Retarder les premières machines : touche l'équilibre et les objectifs, je l'évite.

## 2. Les six ateliers

Répartition provisoire des 96 pièces fabriquées (à valider par le porteur du projet). Un atelier traite les commandes de ses pièces ; les chaînes entre ateliers passent par la Réserve commune.

| Atelier | Il travaille | Exemples de pièces | Premier âge |
|---|---|---|---|
| **Élevage** | matières animales : os, cuir, peau | aiguille, lanière, colle d'os, gants, masque | Os (1) |
| **Artisanat** | bois, matières souples, verre, céramique, plastique, composites | manche, corde, archet, torche, brique, verre, lentille, plastique, résine, caoutchouc, joint souple, tissu de carbone, composite, céramique | Bois (0) |
| **Métallurgie** | les métaux, du cuivre à l'uranium | lingots, plaques, engrenages, ressorts, clous, lames, vis, roulements, pistons, aluminium, titane, aimants, supraconducteur, pastille d'uranium | Cuivre (3) |
| **Centrales** | l'énergie, de la force animale à la fusion | moteur à vapeur, condenseur, bobine, batterie, moteur électrique, barre de combustible, graphite, échangeur, propulseur, panneau Dyson | Vapeur (7) ; la force animale dès l'Élevage |
| **Électronique** | de l'électronique à l'informatique et la robotique | ampoule, câble, silicium, plaquette, puce, processeur, cellule, circuit | Électricité (8) |
| **Artistique** | écriture, musique, image | papier, encre, papyrus, impression ; la flûte, les airs | Pierre (2) pour le papyrus |

À repérer : les pièces de **chimie** (naphta, dynamite) vont-elles aux Centrales ou à l'Artisanat ? La **verrerie** (verre trempé) : Artisanat. Les pièces du **dernier âge** (antimatière, matière exotique) : Centrales ou un septième atelier, « Cosmos ».

## 3. L'échelle et nos 15 âges

| Échelon | Époque | Âges du jeu | Remarque |
|---|---|---|---|
| Main | néolithique | Bois, Os, Pierre | comme aujourd'hui |
| Apprenti | antiquité, Moyen Âge | Cuivre, Bronze, Fer | un apprenti par atelier, 1 à 3 selon l'atelier |
| Ouvriers | époque moderne | Acier, Vapeur | plusieurs ouvriers, embauchés en écus |
| Machines | révolution industrielle | Vapeur, Électricité, Atome | les cinq paliers renommés, installés dans un atelier |
| Robots | époque contemporaine | Silicium et après | remplacent les ouvriers, plus rapides |

Six ateliers sur cinq échelons font 30 montées en gamme sur 15 âges, soit environ deux par âge : c'est le rythme d'un joueur qui garde la main. Un échelon ne se débloque que si l'âge le permet ; le joueur choisit **quel atelier monter d'abord** quand il n'a pas de quoi tout payer.

## 4. L'énergie : des chevaux

Une seule valeur pour tout le jeu, lue d'un coup d'œil : **énergie disponible contre énergie demandée, en chevaux (ch)**.

- **Demande** : chaque travailleur en consomme quand il travaille : l'apprenti quelques chevaux, un ouvrier un peu plus, une machine beaucoup (le palier compte), un robot encore plus mais sans coût d'embauche. Pour une recette, l'énergie dépensée est le temps de fabrication multiplié par la puissance du travailleur : un objet qui prend longtemps est un objet coûteux en énergie, comme tu le décris.
- **Offre** : ce que fournissent les **Centrales** : la force animale (une bête de trait), le moulin (déjà dans le jeu, âge 4), la vapeur, l'électricité, la fission, la fusion. Les améliorations actuelles qui accélèrent les machines deviennent des sources.
- **Quand ça manque** : tous les ateliers ralentissent **du même rapport** (92 % d'énergie : 92 % de vitesse). Pas de cascade de pénurie, pas de ratio à calculer : **un seul rapport global**. C'est le casse-tête d'Anno réduit à une jauge.
- **Hors ligne** : le calcul est un simple rapport, il tient facilement en l'absence du joueur.
- **Risque** : une jauge de plus à surveiller. Garde-fou : la jauge ne ralentit jamais sous 50 % au début, et le jeu propose une action claire (« Construire un moulin »).

## 5. L'argent

- **Embaucher coûte des écus**, de plus en plus cher à chaque ouvrier (comme les extracteurs et les machines). **Pas de salaire** : un salaire continu fait de la gestion d'économie, ce qui n'est pas casual.
- **Le Troqueur et le Comptoir** vendent les surplus ; ces écus servent à embaucher. L'argent gagné devient donc utile, ce qui était ta condition.
- **Le troc automatique** de l'apprenti actuel (lanières, « Faire vivre l'atelier ») **disparaît** : c'est ma lecture de « on retire le marchand ». À confirmer : s'il s'agit plutôt du Troqueur de la Plaine, il **reste**.
- **Équilibrage** : à mesurer au simulateur. Les écus n'ont aujourd'hui presque aucun usage régulier : tout le barème d'embauche est à inventer.

## 6. La page Atelier en cartes

La maquette montre : la jauge d'énergie en haut ; une carte par atelier avec son échelle (main, apprenti, ouvriers, machines, robots), son équipe, sa cadence, sa tâche, et deux boutons : **embaucher** et **passer à l'échelon suivant** ; un atelier qui manque d'une matière est rouge avec la cause. La fiche d'une recette, les quantités jusqu'à ×1000 et « Automatiser » restent : on les ouvre depuis la carte de l'atelier.

## 7. Le premier palier, sans toucher aux sauvegardes

Livrable seul, sans règle nouvelle :
1. Les six cartes d'atelier, **calculées** à partir de ce qui existe : les pièces regroupées par famille, la cadence et l'état des ordres permanents, les machines possédées.
2. L'échelle affichée : l'échelon courant est déduit de l'âge et de ce que le joueur possède ; les échelons non disponibles sont grisés.
3. La jauge d'énergie **en lecture seule** (demande estimée contre une offre estimée), sans effet.
4. Le schéma de flux avec la cause du blocage (C0) dans chaque carte.
5. Les emplacements : un nom et une icône par atelier, un texte par échelon et par atelier (placeholders propres, voir le chapitre 9).

## 8. Étapes

| Version | Contenu | Moteur | Sauvegarde |
|---|---|---|---|
| **0.40** | cartes d'atelier, échelle, jauge en lecture seule, cause de blocage | lecture seule | inchangée |
| **0.41** | un apprenti par atelier ; ouvriers embauchés en écus ; fin du troc automatique | moyen | un champ par atelier |
| **0.42** | machines installées dans un atelier ; renommage des cinq paliers | moyen | migration du parc |
| **0.43** | l'énergie agit (ralentissement global) ; sources dans les Centrales | moyen | un champ |
| **0.44** | robots ; équilibrage final | léger | inchangée |

À chaque version : simulateur à jour (profils de joueurs), puis 5 à 8 joueurs observés. Le chapitre « chaînes visées » (C1) devient inutile : l'atelier traite les commandes de sa famille, la Réserve fait le lien.

## 9. Emplacements propres (placeholders)

- **Icônes** : six, réutilisées de `assets/icons.svg` en attendant Codex (marteau, aiguille, éclair, plume, etc.).
- **Textes** : un nom par atelier et par échelon dans `D.ATELIERS` (nouveau fichier de données), avec des valeurs temporaires entre crochets (« [à écrire] ») que le test de langue repère. Les phrases de passage d'échelon (« Tu confies la couture à un apprenti. ») sont à écrire par le porteur du projet.
- **Illustrations** : une scène par atelier et par époque, à commander à Codex ; en attendant, un fond de papier avec le nom.

## 10. Questions à trancher

1. **Le troc automatique** de l'apprenti disparaît-il, ou seulement le marchand ?
2. **Chimie et dernier âge** : où vont naphta, dynamite, antimatière, matière exotique ?
3. **Un septième atelier** (Cosmos, ou Chantiers pour les Grands Œuvres) ?
4. **Les machines renommées** : « métier », « mécanisme », « machine à vapeur », « ligne », « robot » : ces noms te conviennent-ils ?
5. **Une machine va dans un atelier** : le joueur choisit lequel, ou le jeu l'installe dans l'atelier de la famille de la dernière recette qu'il lui a donnée ?
6. **Énergie minimale** : on garde le garde-fou à 50 %, ou on laisse l'énergie tomber à zéro ?

## 11. Décisions du porteur du projet (30 octobre 2026, suite) et livraison du 0.40

1. **Le troc** : c'est la **vente** (l'ancienne boucle de l'argent) qui disparaît, ni le Troqueur ni le Comptoir. À appliquer au 0.41, avec l'embauche.
2. **Répartition** : sept familles, avec **Chimie et matériaux** (naphta, plastique, résine, dynamite, caoutchouc, composites, céramique, graphène…). Les outils, installations et améliorations ont maintenant aussi une famille choisie à la main (`js/ateliers.js`, test à l'appui).
3. **Grands Œuvres** : pas un atelier, un **engouement général** (projet collectif, à part).
4. **Noms des paliers de machines** : proposés, à décider : Métier ou Corporation, Automate, Machine à vapeur, Machine électrique, Ligne d'assemblage, Robotisation. Cela fait **six** noms pour **cinq** paliers existants : soit on fusionne, soit on ajoute un palier « machine électrique » entre la vapeur (âge 7) et la ligne d'assemblage (âge 10), au 0.42, avec son équilibrage. Les noms ne sont pas encore changés.
5. **Installer une machine** : le joueur le fait lui-même, avec un **glisser-déposer** d'une machine vers un atelier. À faire au 0.42.
6. **Énergie** : elle peut **tomber à zéro**, mais pas facilement. À régler au 0.43 (plancher à définir, plutôt bas au début, sans filet ensuite).

**0.40 livré** : `js/ateliers.js` (familles, échelle, énergie calculées, rien d'écrit dans la sauvegarde), la page Atelier en cartes avec la jauge d'énergie en lecture seule, le détail d'un atelier (ses recettes, la fiche, ×1 à ×1000 et Max, Automatiser), l'apprenti de l'établi rangé dans l'Élevage. Valeurs provisoires : les chevaux par palier et par source, les âges qui ouvrent chaque échelon (`ECHELONS`, `PALIERS`, `SOURCES` dans `js/ateliers.js`).
