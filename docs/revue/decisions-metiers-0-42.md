# Décisions sur les métiers, outils et gestes (30 octobre 2026)

Source : l'audit publié en artefact (`tools/etude-chaine.js` n'y est pas pour rien : les chiffres viennent de `js/data.js` et `js/equipements.js` en 0.42.2), rempli par le porteur du projet. Ce document garde ses réponses dans le dépôt et fixe ce qui en découle. Il ne change aucun code.

## 1. Réponses du porteur du projet

| Piste | Avis | Ce qu'il dit |
|---|---|---|
| Séparer « Construire » d'« Assembler » | **Oui** | |
| Le charbon : un geste pour une seule recette | **Oui, option B** | Un seul geste au feu, les recettes se distinguent par l'ingrédient. L'idée d'une gestion de la température est abandonnée : trop compliqué pour pas grand-chose. |
| Deux outils pour la même recette | **Oui** | Le Couteau serait une **amélioration du Racloir**, avec un temps de découpe réduit. |
| Des outils de départ pour 1 à 4 recettes | **Oui** | |
| Des gestes de fin de partie à peine employés | (non coché) | **Les garder** : la saveur compte. À rendre par **un texte en fenêtre à la découverte de la recette**. |
| Élevage et Artistique | **Non** | Garder l'Élevage. Nourrir l'Artistique d'autres recettes. Son **nom** ne convient pas : à changer. |
| Des métiers vides à certains âges | **Oui** | « On ne vit pas au néolithique comme à l'âge contemporain, il faut le ressentir. » Question : couper l'Artisanat en deux ? Le transformer en Électronique ? Et les anciennes recettes ? |
| Deux systèmes côte à côte | **Oui** (sans direction) | Demande une recommandation. |

## 2. Ce qui en découle (propositions de Claude, à valider)

- **Un huitième métier : « Construction ».** Il reçoit les 96 recettes qui ne sont pas des pièces ni des outils à main : extracteurs, machines, installations, améliorations (geste **Construire**). Résultat chiffré : Artisanat de 53 à 26 recettes, Métallurgie de 84 à 41, Centrales de 31 à 19, Électronique de 21 à 10 ; **la question de couper l'Artisanat tombe d'elle-même**.
- **Ne pas transformer l'Artisanat en Électronique.** Un métier n'est pas un âge : ses recettes servent encore à tous les âges suivants (le Manche, la Corde, la Brique entrent dans des recettes tardives). À la place, un métier dont toutes les recettes sont trouvées est **maîtrisé** (même mot que pour les terres) : l'Atelier le dit, il reste utilisable. Le ressenti d'une époque vient des âges, de l'échelle main à robots et des textes, pas de la disparition d'un métier.
- **Un seul modèle outil + geste.** Les décisions « charbon option B », « Couteau amélioration du Racloir » et « outils à une recette dans l'Atelier » retirent les modes : il ne reste que des gestes. Les outils de départ deviennent ce qui **permet** un geste, avec un palier qui monte : Racloir puis Couteau (Couper), Feu puis Four puis Haut-fourneau (Chauffer, la chaleur existe déjà dans le moteur), Mains puis Atelier (Assembler, Tresser, Construire). L'Atelier du Cuivre n'est plus un second système : c'est le même, en plus grand.
- **Le nom de « Artistique »** : trois candidats, **Arts et lettres** (recommandé : large, sobre), **Lettres et musique** (exact, étroit), **Savoirs** (inclut plus tard les archives et l'IA).

## 3. Ordre proposé

1. **Gestes et recettes (données)** : le geste Construire et le métier Construction ; un seul geste au feu ; Racloir puis Couteau ; les outils à une recette dans l'Atelier ; plus de modes. Aucun changement de coût ni d'âge : le rythme du jeu ne bouge pas. Tests des équipements à réécrire.
2. **Textes de découverte** : une fenêtre par recette trouvée, texte par métier à écrire (emplacement prêt).
3. **Renommage** du métier Artistique ; état « maîtrisé » d'un métier.
4. **Énergie (ex-0.43)** : après, quand la liste des gestes est stable.

Risques : les recettes sont aujourd'hui indexées par couple outil et mode (`D.CRAFT_EQUIPMENT.recipes`, 42 contrôles dans `tools/test-equipements.js`) ; les sauvegardes retiennent les recettes par identifiant, donc ne changent pas ; l'établi mémorise un outil et un mode (`flags.equipmentBench`), à remettre d'aplomb au chargement.
