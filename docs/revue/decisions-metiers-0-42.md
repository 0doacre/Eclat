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

## 4. Étape 1 livrée (0.43.0)

- **Construire** : nouveau geste, de départ (comme Assembler, Tresser, Tailler). Les 94 recettes qui se bâtissent (extracteurs, machines, installations, améliorations) passent de « assembler » à « construire », par une boucle unique en fin de `js/data.js` (`D.ATELIERS.construction.types`). Les outils tenus en main (hache, pioche, arc…) **restent des Assembler** : c'est un écart avec « tout ce qui n'est pas une pièce », à valider.
- **Construction** : huitième métier. Il prend les bâtiments, sauf ceux des métiers d'énergie, de chimie, d'électronique et de lettres (moulin, centrale, réacteur, presse d'imprimerie…) qui y restent. Résultat : Artisanat 23, Construction 71, Élevage 8, Chimie 17, Métallurgie 41, Centrales 31, Électronique 20, Artistique 4 (recettes non secrètes).
- **Plus de modes.** Le mode d'une recette est son geste (`D.ITEMS[id].r[0]`) ; un outil ne dit que ce qu'il permet. Au feu, un seul geste, Chauffer : charbon, épieu, galette, colle d'os, encre et brique se distinguent déjà par leur ingrédient (option B du charbon, sans changer une recette). Les anciens modes (doux, vif, étouffée, cuisson, fonte, couper, entailler, coudre, percer, équarrir, refendre, polir) restent compris comme synonymes du geste : les commandes en cours et les sauvegardes s'ouvrent comme avant (`E.normMode`, normalisé à l'entrée de la file et au chargement).
- **Paliers d'outils.** Dans une famille, le palier le plus haut reprend les recettes du précédent et cache le plus bas à l'écran : Racloir puis Couteau (Couper devient une amélioration, le couteau reste 2 fois plus rapide), Feu puis Four. Le four fait désormais aussi le charbon, l'épieu, la colle, l'encre et la brique.
- **Outils retirés des outils de départ** : Pioche de pierre (Équarrir), Poste de frappe (Marteler), Ciseau (Refendre), Dalle de polissage (Polir). Leurs recettes (Enclume de pierre, Plaque et Fil de cuivre, Miroir) passent par l'Atelier ; les objets restent des outils et gardent leur rôle de station.
- **L'Atelier du métier** n'est plus réservé à partir du Cuivre : il propose les gestes de toutes les recettes sans voie par un outil de départ, à tout âge. Un métier n'apparaît au Labo que si une de ses recettes est à portée de l'âge (plus de Métallurgie dès l'âge 0).
- **Rythme** : mesuré avant et après avec `tools/sim-passages.js --joueurs` : mêmes âges atteints, mêmes murs, écarts de fabrications inférieurs à 1 pour mille.
- **À faire ensuite** : textes de découverte, renommage d'« Artistique », état « maîtrisé », puis l'énergie (0.44).

## 5. Étape 2 livrée (0.43.1)

- **Fenêtre de découverte** : quand une recette est trouvée, le pop-up affiche sa **saveur** (une ou deux phrases, en italique) et, la première fois qu'un geste qui n'est pas de départ entre en jeu (Marteler, Allier, Tremper, Usiner, Graver…), un encart « Nouveau geste » qui dit ce qu'il veut dire. La fenêtre reste affichée plus longtemps quand il y a du texte (de 1,2 s à 6 s en plus selon la longueur).
- **Emplacements pour les textes du porteur** : `D.SAVEUR.<recette>` et `D.SAVEUR_GESTE.<geste>` dans `js/data.js` (220 signes au plus, vérifié par test). Tant qu'un texte manque, la description de la recette (`d`) ou du geste sert de repli : aucune fenêtre n'est vide.
- **Liste du travail** : `node tools/saveur-a-ecrire.js` écrit `docs/revue/saveur-a-ecrire.md` (218 recettes par métier et par âge, avec le texte actuel, et les gestes à introduire).
- Rien ne change dans la partie : pas de coût, pas d'âge, pas de sauvegarde. Une partie ancienne qui a déjà fabriqué avec un geste ne revoit pas son introduction.

## 6. Étape 3 livrée (0.43.2)

- **Renommage** : « Artistique » devient **Arts et lettres** (choix du porteur). Seul le nom affiché change ; l'identifiant interne `artistique` reste, donc rien ne bouge dans les sauvegardes.
- **Maîtrisé** : la carte d'un métier dans l'Atelier dit « N sur T recettes » tant qu'il reste à trouver, puis « maîtrisé » quand toutes les recettes (hors secrètes, uniques et à échelle) sont trouvées. Le métier reste utilisable. Un métier maîtrisé ne change rien au rythme du jeu.
- **À faire ensuite** : l'énergie (0.44).

## 7. Simulation de l'énergie (avant la 0.44)

Banc : `node tools/sim-energie.js [--minutes 120] [--planchers 0.5,0.25,0.1]` (joueurs de `tools/sim-passages.js`). Il lit toutes les 10 s l'écran de l'énergie, et, avec `--planchers`, applique en essai un crochet `E.energieFacteur` (absent du jeu : facteur 1) qui ralentit machines et travailleurs de `max(plancher, offre / demande)`.

- **Le manque existe, il est court et précoce.** Aux âges 4 à 8 la demande (13 à 63 ch) dépasse l'offre de base (10 ch) tant que le joueur n'a pas bâti de source : rapport de 0,77 à 0,16 selon le joueur ; dès l'âge 8-9 une source donne 200 ch et le rapport revient à 1. Les joueurs à séances espacées y passent le plus de temps (jusqu'à 60 % des relevés des âges 4 à 7).
- **Effet sur le rythme : nul.** Aucun passage ne bouge de plus de 2 minutes, que le plancher soit 0,5, 0,25 ou 0,1 (ex. tapeur : désert 76,0 → 74,3 min ; les autres passages à l'identique). Les joueurs automatiques tirent presque tout de leurs mains ; ils n'embauchent personne (travailleurs : 0 sur tous les relevés).
- **Conséquence** : on peut faire agir l'énergie sans toucher à l'équilibre mesuré, mais les bots ne la ressentent pas. Le ressenti doit se juger à la main, sur une partie réelle avec machines et ouvriers.
