# Problème : les mêmes gestes et les mêmes matières dans plusieurs métiers

Signalé par le porteur du projet (31 octobre 2026) : « les mêmes gestes apparaissent sur plusieurs métiers, ce qui est gênant, parce qu'on peut assembler dans trois, quatre métiers différents ; du coup les mêmes ressources apparaissent et on ne sait plus pourquoi on fait ça. Il faut qu'on y travaille absolument. »

Ce document pose le problème avec des chiffres, propose des pistes et fixe ce qui reste à décider. Il ne change aucun code.

## 1. Ce que dit la mesure (recettes non secrètes, 0.50)

Nombre de recettes par **geste** et par **métier** :

| Geste | Artisanat | Construction | Élevage | Métallurgie | Chimie | Centrales | Électronique | Arts et lettres | Métiers |
|---|---|---|---|---|---|---|---|---|---|
| chauffer | 5 | 1 | 1 | 6 | 3 | 1 | 1 | 1 | **8** |
| assembler | 9 | . | 5 | 9 | 2 | 13 | 3 | 1 | **7** |
| tailler | 5 | 1 | 2 | 3 | 2 | . | 1 | . | **6** |
| construire | . | 73 | . | . | 1 | 12 | 10 | 2 | 5 |
| tresser | 3 | . | . | . | 2 | . | 1 | . | 3 |
| tremper | 1 | . | . | 2 | . | . | . | . | 2 |
| usiner | . | . | . | 7 | . | 1 | . | . | 2 |
| électriser | . | . | . | 2 | . | 1 | . | . | 2 |
| stratifier | . | . | . | . | 3 | 1 | . | . | 2 |
| marteler, allier, graver, synthétiser, transmuter | un seul métier chacun | | | | | | | | 1 |

Trois gestes (chauffer, assembler, tailler) couvrent six à huit métiers sur huit.

Nombre de **métiers qui utilisent un même ingrédient** (111 ingrédients) : 49 n'en servent qu'un, 28 deux, 20 trois, 10 quatre, 3 cinq, 1 sept. Soit **34 ingrédients utilisés par trois métiers ou plus**. Exemples : le charbon sert sept métiers (artisanat, construction, métallurgie, centrales, électronique, chimie, arts), le manche cinq, la fibre cinq, la plaque de cuivre et l'acier trempé quatre ou cinq.

## 2. Pourquoi c'est gênant

Aujourd'hui, le **métier d'une recette** est décidé par ce que la recette *est* (`E.atelierDe`) : un objet de la famille « machines » va en Construction, un moteur en Centrales, une hache en Métallurgie. Le Labo, lui, demande au joueur de choisir un métier, puis un outil, puis un geste, puis des matières : mais **les matières et les gestes ne dépendent pas du métier choisi**.

- On « assemble » au Labo dans Artisanat, Élevage, Métallurgie, Centrales ou Électronique : le geste ne dit pas quel métier travaille.
- Le même charbon, le même manche, la même plaque s'affichent partout : le choix du métier ne réduit pas le champ.
- Un assemblage réussi peut aboutir à une recette d'un autre métier que celui qu'on a ouvert : le joueur ne comprend pas pourquoi l'objet est rangé là.
- Dans le métier **Centrales**, « assembler » regroupe un moteur à vapeur, une barre de combustible, une fusée et un vaisseau : ce qui s'assemble n'a rien de commun.
- Conséquence sur les travailleurs : « les ouvriers fabriquent tout leur métier » n'a de sens que si le métier est une vraie catégorie lisible.

La classification est cohérente comme **rangement** (où trouver l'objet), pas comme **façon de travailler** (ce que fait le joueur). Les deux se confondent.

## 3. Pistes

**A. Un métier = une famille de gestes (vocabulaire propre).** Chaque métier a ses gestes à lui, quitte à en renommer : Artisanat (tailler, tresser, assembler), Élevage (dépecer, coudre), Métallurgie (fondre, marteler, allier, tremper, usiner), Chimie (cuire, synthétiser, stratifier), Centrales et Électronique (monter, électriser, graver), Construction (construire). Un geste = un métier. Avantage : on sait toujours pourquoi on fait un geste. Coût : renommer des gestes (recettes, textes, tests, sauvegardes via `E.normMode`), et revoir les 13 « assembler » des Centrales.

**B. Le métier devient un vrai filtre du Labo.** Dans un métier, le Labo ne montre que ses gestes et que les matières qui entrent dans ses recettes (connues ou non). Un assemblage qui relève d'un autre métier ne fabrique pas : il dit « cela relève de la Métallurgie » et l'y renvoie. Les gestes restent partagés, mais le contexte (le métier) rend chaque geste lisible. Avantage : peu de données à toucher, très lisible. Coût : changer la découverte (une recette ne se trouve que dans son métier) et revoir l'équilibre de la découverte.

**C. Les deux, dans cet ordre.** B d'abord (le filtre), parce qu'il règle la confusion tout de suite sans toucher aux sauvegardes ; A ensuite, geste par geste, là où B ne suffit pas (le cas des Centrales).

## 4. Recommandation

La piste **C** : le filtre par métier d'abord, puis le vocabulaire. Le reclassement de quelques recettes mal rangées (par exemple le papier en Arts et lettres, les masques en Chimie) se fait au passage, avec le porteur du projet, métier par métier.

## 5. À décider

1. Une recette doit-elle être **découverte dans son métier uniquement** (piste B stricte), ou le Labo peut-il fabriquer hors métier avec un message ?
2. Les matières montrées dans un métier : celles de **ses recettes seulement**, ou aussi celles qu'on a déjà **vues** ?
3. Faut-il renommer les gestes (piste A) maintenant ou après avoir vu l'effet du filtre ?
4. Quels métiers faut-il redécouper ? Les Centrales (moteurs, combustible, fusée, vaisseau) sont le premier candidat.

## 5 bis. Décisions (31 octobre 2026) et ce qui est fait

Décisions du porteur du projet : filtre strict (un assemblage d'un autre métier ne donne rien dans le métier ouvert) ; les matières montrées sont celles qui entrent dans les recettes du métier ; on renomme les gestes après avoir vu l'effet du filtre.

Fait en 0.55.0 (`js/atelier-equipe.js`, `js/equipements.js`) : le Labo ne montre dans un métier que les matières de ses recettes (plus celles déjà posées sur l'établi), les pistes ✦ (`E.equipmentHasDiscovery`, nouveau paramètre `metier`) ne comptent que ses recettes, et l'essai d'un assemblage dont toutes les recettes (tout outil confondu) sont d'un autre métier, et pas encore connues, répond « rien » sans lancer l'essai : le thermomètre ne révèle donc pas que l'assemblage existe ailleurs. Une recette déjà connue se fabrique dans n'importe quel métier. Reste : les assemblages partiels (« tiède ») qui peuvent encore refléter une recette d'un autre métier, le renommage des gestes (Centrales d'abord), et un contrôle sur l'ensemble du parcours qu'aucune recette n'est devenue introuvable (le robot de `tools/sim-passages.js` passe par le moteur, pas par le Labo).

## 6. Plan

1. Mesure : la matrice ci-dessus est produite par un script (`tools/mesure-gestes-metiers.js`) à relancer après chaque reclassement.
2. Filtre par métier au Labo (B), derrière un interrupteur pour comparer.
3. Reclassements des recettes avec le porteur du projet.
4. Vocabulaire des gestes (A) si le filtre ne suffit pas.
