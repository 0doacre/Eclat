# Éclat : l'arbre, l'ergonomie et le level design. Diagnostic, décisions, plan

Rédigé le 24 octobre 2026, sur `main` d'Éclat en 0.13.2 (commit `a053b0a`). Il complète `AUDIT-CLICKY-ISLANDS.md` et `AUDIT-CELL-TO-SINGULARITY.md`, sans les remplacer, et réunit leurs plans dans un seul ordre de travail (section 9). Conventions de `docs/STYLE.md` : tutoiement, pas de tiret cadratin.

## 0. En bref

**L'arbre d'Éclat est mauvais pour une raison de fond, pas de détail.** Il dessine un graphe de dépendances de 175 recettes (397 liens, dont 35 % sautent au moins deux âges), alors que les arbres de Cell to Singularity et de Clicky Islands sont des arbres à parent unique ou des cartes composées à la main. Un graphe de ce genre ne peut pas être lisible sur un téléphone, quelle que soit la mise en page automatique. La 0.13.2 a déjà masqué les liens qui sautent des âges : c'est le bon réflexe, mais il laisse des îlots sans lien.

**La refonte proposée** : un « arbre à voies ». Cinq colonnes qui gardent le même sens de bas en haut (Vivant, Terre, Cuivre, Fer, Chimie et ciel), les âges en bandes, un seul lien visible par recette (l'ingrédient principal), les autres ingrédients en pastilles de couleur, un zoom à trois niveaux, un plein écran et un rail des âges. Elle réutilise `js/arbre.js` et ses tests.

**Ergonomie** : le problème le plus coûteux n'est pas dans l'arbre. Une fenêtre « Bon retour » s'ouvre après 60 secondes d'absence, une bulle de tutoriel m'a empêché de changer d'onglet, et plusieurs fenêtres s'empilent au lancement.

**Level design** : la force d'Éclat est la règle propre à chaque terre. Cinq des neuf règles suivent pourtant le même modèle (« sans tel objet sur toi, tes mains rapportent 40 % de moins »), et les terres tardives sont minces (une ressource et un lieu pour le Gisement Noir et pour Mercure).

**Décisions prises** (section 7) : 14, dont l'orientation de l'arbre, les cinq voies, le zoom à trois niveaux et la file d'attente des fenêtres. **À arbitrer** (section 8) : 8 questions, dont la forme cible de l'arbre, la place des gestes et des stations, et l'idée d'emplacements sur les terres.

## 1. Ce que j'ai regardé, et ce que je n'ai pas fait

**Éclat** : lu `js/arbre.js`, `css/arbre.css`, `js/atelier.js`, `js/memoire.js`, `docs/AUDIT-UX-CASUAL-2026-10-24.md`, `docs/prompts/arbre-connaissance-0-11.md`. Lancé le jeu en local (clone, rien de modifié) à 390 × 844 avec la sauvegarde `tools/fixtures/save-v5-age8-usine.json` : Domaine, Carte, Atelier, Carnet liste et arbre, Mémoire des mains. Calculé des statistiques sur `D.ITEMS`.

**Cell to Singularity** : lancé le jeu sur ta sauvegarde (niveau 44), observé l'Arbre de la vie et le Reality Engine, lu le code décompilé (`ItemTree`, `CameraHandler`, `AscensionBank`, `AssendReset`). Les captures (parties personnelles, jeux sous licence) ne sont pas dans le dépôt.

**Clicky Islands** : reconstitué la mise en page de l'arbre de perks à partir de `skills_content.tscn` (147 boutons, 182 traits), dessinée en SVG hors dépôt ; lu `level_generator*.gd`.

À savoir :

- **Sur ta sauvegarde de Cell to Singularity**, j'ai cliqué « Collecter » sur les gains hors ligne, sans les doubler. Tu as fermé toi-même la récompense quotidienne. Aucun achat, aucune relève. J'ai fermé le jeu ensuite par sa fenêtre, normalement.
- **Je n'ai pas mesuré de vrais joueurs.** Les jugements d'ergonomie viennent de mesures (tailles, nombres), de captures et du code. Ce qui est une hypothèse est marqué comme tel.
- **Le Reality Engine, je ne l'ai vu qu'à un zoom.** Je n'ai pas pu dézoomer (la molette n'agit pas dans cette version) : sa taille totale n'est pas connue.
- **Mon essai de l'Atelier** a pu être faussé : une bulle de tutoriel recouvrait l'écran, et l'établi réduit (`#mbench`) ne s'est pas affiché. Il existe dans le code (`ui.js:753`).
- **Les fenêtres empilées au lancement** viennent en partie du chargement d'une sauvegarde de test avancée (nouveautés, retour, bulle). La fenêtre « Bon retour » après une absence d'une minute est, elle, un comportement normal du jeu (voir 5.1).

## 2. Les cinq arbres côte à côte

| | Cell : Arbre de la vie | Cell : Reality Engine | Clicky : perks | Éclat : Arbre (Carnet) | Éclat : Mémoire |
|---|---|---|---|---|---|
| À quoi il sert | acheter des espèces, voir la production | acheter des améliorations (Metabits) | dépenser la Réputation | retrouver ce qu'on a découvert | dépenser les Traces |
| Taille | plusieurs centaines | plusieurs centaines | 147 nœuds | 175 recettes, 397 liens | 9 améliorations + Résonances |
| Structure | arbre (phylogénie), un parent par espèce | grille à rails orthogonaux autour d'un axe | arbre strict : 146 nœuds sur 147 ont **un seul** prérequis | **graphe** avec nœuds partagés | peigne de 5 branches |
| Mise en page | à la main, sur un fond de carte de biomes | à la main, axe central et branches | à la main, colonne centrale et 10 grappes | automatique (barycentre) | à la main |
| Repères | noms de régions, géographie qui a du sens | familles par couleur, hub central | grappes symétriques, traits discrets | bandes d'âge, couleur par âge | noms des branches |
| Hiérarchie visuelle | 3 tailles (hub, espèce, trait) | cubes, un seul gabarit | boutons de 48 px, un seul gabarit | un seul gabarit de 48 px | un seul gabarit de 52 px |
| Prix visibles | le débit sous les grands nœuds (les prix, je ne les ai pas vus) | **seulement sur le prochain nœud** | dans l'info-bulle | sans objet | sur le nœud touché |
| Aide à la décision | deux objectifs épinglés en haut | bouton « Améliorer, 18 disponibles » | seuils de dépense, traits qui apparaissent | objectif en fantôme | « Passer le relais » + aperçu |
| Déplacement | glisser et zoomer ; d'après le code, la caméra peut aller au prochain nœud | idem, avec un bouton de recentrage | défilement vertical | glisser, pincer, boutons ± | sans objet |

### Ce que font de bien les arbres de référence

1. **Cell : l'Arbre de la vie.** Le fond raconte : un océan sous les requins, une savane sous les girafes, une forêt sous les singes. On retrouve une espèce par la région où elle vit. Trois tailles de nœud (un anneau avec une silhouette et son débit pour les grands groupes, une plaque en losange pour une espèce, une icône carrée pour un trait). Des noms de zone en petites capitales. Les liens sont fins et clairs, et la plupart partent d'un grand nœud vers ses petits.
2. **Cell : le Reality Engine.** Des rails droits : les niveaux d'une même amélioration sont alignés en chaîne (« Accélérateur de Darwinium I à VII »), sans croisement. L'axe vertical porte le moteur au centre, avec un convertisseur au-dessus et un autre au-dessous. Les nœuds lointains sont atténués ; le prochain à acheter est sombre et porte son prix. Un bouton vert unique dit combien d'améliorations sont disponibles.
3. **Clicky : les perks.** Un arbre strict : un nœud n'a qu'un parent. Les traits ne s'affichent que lorsque le prérequis est pris (fondu de 0,25 s). Un seuil de dépense totale ouvre chaque grappe. Retirer un nœud retire tous ses descendants. Tout tient dans une colonne étroite qui se parcourt au pouce.
4. **Les deux jeux** montrent peu de choses à la fois et n'ont presque pas de liens longs.

## 3. Diagnostic de l'arbre d'Éclat

Étiquettes : **[M]** mesuré, **[O]** observé à l'écran ou dans le code, **[H]** hypothèse à vérifier.

1. **[M] Le graphe est trop dense pour un téléphone.** 175 recettes, 397 liens. 181 liens relient des objets du même âge, 216 des âges différents, dont 138 (35 %) sautent au moins deux âges. Le « Manche » sert dans 30 recettes, le Moteur électrique dans 17. Un nœud-carrefour de ce genre ne se dessine pas proprement avec des liens.
2. **[O] Depuis la 0.13.2, les liens qui sautent un âge sont masqués jusqu'à l'appui.** C'est ce qui rend l'arbre moins illisible, mais l'effet secondaire est visible à l'écran : des îlots de nœuds sans lien, donc pas d'impression d'arbre. Le défaut est de départ : on masque un symptôme.
3. **[M] La fenêtre est petite.** 538 px sur 844 (64 %), et 300 px sur 568 à 320 px de large, où le plancher de `.arb-vue` s'applique (mesuré par `tools/arbre-mesures-ui.js`, `docs/revue/arbre-mesures.md` ; la hauteur est celle de l'écran moins l'en-tête, la barre d'onglets et 190 px de marges). Le titre, l'interrupteur Liste/Arbre, le compteur et trois boutons mangent le reste. À l'échelle par défaut, 10 à 15 nœuds sont visibles à la fois. Le monde complet fait 5 428 px de haut (mesuré).
4. **[M] Les étiquettes sont trop petites.** 10,5 px, deux lignes au plus, 64 px de large (`arbre.css:52`). Les noms d'âge font 12 px. Les liens ont un trait de 1,6 px à 30 % d'opacité. Quand on dézoome pour s'y retrouver, plus rien ne se lit.
5. **[O] Les colonnes n'ont pas de sens.** Les cinq colonnes viennent d'un tri par moyenne des colonnes des ingrédients (`catalogue()` dans `arbre.js`). Deux voisins n'ont rien à voir. Aucun repère stable (« le fer est à droite ») ne se forme.
6. **[O] Un seul gabarit de nœud, une seule teinte par bande.** Icônes blanches sur fond sombre, couleur donnée par l'âge. Rien ne distingue un outil, une station et une matière, et rien ne dit « tu peux le fabriquer maintenant ».
7. **[O] L'arbre ne répond pas à « que faire maintenant ? ».** Il montre un fantôme pour l'objectif et un par ressource étudiée. Mais il ne montre pas ce qui est réalisable avec la Réserve actuelle, alors que la liste le fait déjà avec le filtre « Prêtes ».
8. **[O] La navigation est enterrée.** Onglet Carnet, puis interrupteur « Arbre » : deux appuis, sans lien depuis l'objectif.
9. **[H] Conflit entre le défilement de la page et le glissement de l'arbre.** La vue bloque les gestes (`touch-action: none`), ce qui évite le conflit à l'intérieur de la fenêtre, mais près des bords le doigt peut sembler « piégé ». À tester sur un vrai téléphone.
10. **[O] Le panneau du bas recouvre le bas de l'arbre.** Il sert bien (ingrédients et usages en puces), mais prend environ 200 px sur 510.

**Ce qui est bon et qu'on garde** : la règle d'absence de fuite (un fantôme n'a ni nom ni icône), le compteur sans total, la mise en page déterministe (un nœud ne bouge pas quand un autre apparaît), le surlignage amont/aval au toucher, les vrais `<button>`, les tests de `tools/test-arbre.js`.

### Pourquoi la 0.11 a pris ce modèle

Le prompt de la 0.11 (`docs/prompts/arbre-connaissance-0-11.md`) citait comme référence Cell to Singularity et ses nœuds fantômes. Cell to Singularity a bien des fantômes (`GhostNode`, `ComingSoonNode`), mais ils sont posés à la main sur une carte, pas calculés. L'idée à garder est le fantôme ; la mise en page automatique d'un graphe, non.

## 4. Proposition : l'arbre à voies

### 4.1 Le principe

Trois idées, dans l'ordre d'importance :

1. **Un seul lien par recette.** Pour chaque recette, on garde l'ingrédient principal (le plus abondant ; en cas d'égalité, le plus profond dans la chaîne). Les recettes forment alors **une forêt** de 18 racines, de profondeur 7 au plus, avec au plus 11 enfants par nœud (mesuré sur `D.ITEMS`). C'est ce qui rend les deux arbres de référence lisibles.
2. **Les autres ingrédients passent en pastilles.** Une recette qui demande du fer et du cuivre garde son lien vers le fer et porte une petite pastille de la couleur du cuivre. On voit ce qu'il faut sans tracer de lien. Au toucher, les vrais liens s'allument (comportement existant).
3. **Cinq voies, des bandes d'âge.** Chaque recette appartient à une voie, fixe d'un bout à l'autre du jeu (colonne), et à un âge (bande). La voie est celle de la **racine de sa chaîne** (la matière de départ) : voir 4.2.

### 4.2 Les voies

Affectation proposée des 18 racines, avec le nombre de recettes (hors curiosités et objets secrets) :

| Voie | Racines | Recettes |
|---|---|---|
| Vivant | bois, fibres, peau, os | 41 |
| Terre | pierre, silex, argile, sable, quartz | 30 |
| Cuivre | malachite, cassitérite | 28 |
| Fer | minerai de fer, bauxite | 39 |
| Chimie et ciel | pétrole, hélium-3, ilménite, débris orbitaux, métal mercurien | 21 |

Répartition par âge et par voie (nombre de recettes) :

| Âge | Vivant | Terre | Cuivre | Fer | Chimie et ciel |
|---|---:|---:|---:|---:|---:|
| 1 Bois | 9 | | | | |
| 2 Os | 9 | | | | |
| 3 Pierre | 4 | 6 | | | |
| 4 Cuivre | 3 | 2 | 5 | | |
| 5 Bronze | 8 | 1 | 7 | | |
| 6 Fer | 2 | 4 | 1 | 7 | |
| 7 Acier | 3 | 2 | 1 | 14 | |
| 8 Électricité | | 1 | 10 | 4 | |
| 9 Silicium | | 6 | 2 | 6 | |
| 10 Polymères | 1 | 2 | 1 | 5 | 5 |
| 11 Composites | 1 | 3 | 1 | 3 | 5 |
| 12 Spatial | | 2 | | | 7 |
| 13 Stellaire | 1 | 1 | | | 4 |

Ce que cela donne :

- **62 % des liens** (186 sur 301 entre recettes à voie) restent dans leur colonne, donc droits. Les 115 autres sont des pastilles.
- **La forme est celle d'une flamme** : le jeu commence à gauche (Vivant), s'étend vers le cuivre puis le fer, et finit à droite dans le ciel. La progression se lit d'un coup d'œil.
- **Cinq colonnes tiennent en 390 px** (66 px chacune).
- **La case la plus chargée** est « Fer, âge de l'Acier » (14 recettes) : elle se range sur trois rangées de cinq.

Ce découpage est mécanique ; les **noms** et le rattachement d'une racine à une voie sont du contenu (question Q3).

### 4.3 Le zoom à trois niveaux

| Niveau | Ce qu'on voit | Pour quoi faire |
|---|---|---|
| 1 : loin | la grille voie × âge, chaque case avec le nombre de recettes trouvées, la case de l'objectif marquée, l'âge actuel en couleur | savoir où l'on en est, choisir où aller |
| 2 : milieu | les icônes (32 px), les noms seulement pour les nœuds-carrefours (4 usages ou plus) et pour l'objectif | repérer une famille |
| 3 : près | icônes de 48 px, noms de 12 px sur deux lignes, pastilles, chiffres | lire, choisir, ouvrir la fiche |

Le niveau 1 est le « tableau de bord » qui manque aujourd'hui. Toucher une case zoome dessus.

### 4.4 Le plein écran et les repères

- **Plein écran** : l'arbre devient une vue à part (comme la Mémoire des mains), avec une barre fine de 44 px : retour, recherche, recentrer, légende. On récupère l'espace des deux interrupteurs et du compteur.
- **En-tête des voies collant** : les cinq noms (icône et mot court) restent visibles en haut pendant le défilement vertical.
- **Rail des âges** : une réglette de 13 repères sur le bord droit. On la touche pour sauter à un âge. Le repère de l'âge actuel est plein.
- **Entrées multiples** : bouton « Voir dans l'arbre » sur la carte d'objectif et sur la fiche d'un objet, en plus de l'interrupteur du Carnet.

### 4.5 Les états d'un nœud

| État | Rendu | Source |
|---|---|---|
| Trouvée | icône pleine, bord de la couleur de la voie | `S.known` (existant) |
| Réalisable maintenant | halo d'accent | la liste « Prêtes » le calcule déjà ; à brancher |
| Matière vue | pastille ronde | `S.seen` (existant) |
| Piste (fantôme) | case pointillée, sans icône ni nom | existant, règles de non-fuite inchangées |
| Objectif | épingle et pulsation légère | existant |
| Au-delà de l'âge atteint plus un | grisé, sans contenu | existant |

### 4.6 Le toucher

Un appui : le chemin s'allume dans les deux sens (jusqu'à la racine en couleur d'accent, usages en clair) et un bandeau compact de puces s'affiche (comportement actuel, plus court). Un second appui : la fiche. Le champ de recherche du Carnet fonctionne dans l'arbre : il surligne et recentre sur le résultat.

### 4.7 Croquis (portrait, 390 px)

```
┌────────────────────────────────┐
│ ←  Arbre            🔍   ⌖   ? │  barre fine, 44 px
│ Vivant│Terre │Cuivre│ Fer │Ciel │  voies collantes
├────────────────────────────┬──┤
│ 13 · Stellaire             │13│
│                  ◌      ◌  │12│ rail des âges
│ 12 · Spatial               │11│
│                      ◇  ◇  │10│
│ 8 · Électricité            │ 9│
│            ◉──◉      ◉ •   │ 8│
│              │      ╱       │ 7│
│ 7 · Acier    ◉   ◉◉ ◉◉     │ 6│
│        ◉──◉──◉      ●       │ 5│
│ ...                        │ 4│
│ 1 · Bois   ◉ ◉ ◉           │ 1│
└────────────────────────────┴──┘
 ◉ trouvée  ◇ réalisable  ◌ piste  • pastille d'une autre voie
```

### 4.8 Ce que cela change dans le code

| Fichier | Changement |
|---|---|
| `js/data.js` | `D.VOIES` : table `racine → voie` (18 lignes) et noms des voies ; champ facultatif `voie:` pour forcer une exception |
| `js/arbre.js` | `catalogue()` place par voie (colonne fixe) et par âge (bande) ; parent unique calculé dans `graphe()` ; `liens()` inchangé (garde le surlignage) ; pastilles dans `rendu()` ; niveaux de zoom dans `rendu()` |
| `js/atelier.js` | plein écran, barre fine, rail des âges, entrées « Voir dans l'arbre », recherche |
| `css/arbre.css` | tailles d'étiquette par niveau, états, voies collantes |
| `tools/validate.js` | chaque recette doit résoudre à une voie |
| `tools/test-arbre.js` | voie stable, parent unique sans cycle, pas de fuite, taille mini des cibles, durée de mise en page |

## 5. Ergonomie : le reste de l'application

### 5.1 Les fenêtres et les bulles

- **[O] « Bon retour » après une minute.** `ecouteurs.js:232` : `if (o.dt < 60) return;`. Un joueur qui quitte l'application et revient au bout d'une minute voit un écran qui bloque tout. J'en ai eu la preuve en repassant sur l'onglet du navigateur : « Pendant ton absence · 1 min ». Sur téléphone, changer d'application suffit.
- **[O] Les fenêtres s'empilent au lancement.** Nouveautés, retour, bulle de tutoriel, en trois temps avant la première action (sauvegarde de test avancée, voir la section 1). Cell to Singularity a le même défaut : « Content de te revoir », puis « Mutation quotidienne », dont la croix **ne répond pas** dans mon essai. Son code a une classe `PopupChain` (d'après son nom, une file de fenêtres ; je ne l'ai pas lue) : Éclat gagnerait à en faire autant.
- **[O] Une bulle de tutoriel a bloqué mon appui sur un onglet.** Avec la bulle « Un morceau d'histoire » (elle pointait le Journal), un appui sur l'onglet Carnet n'a rien fait ; je n'ai pu avancer qu'en passant la bulle. La cause n'est pas établie (recouvrement ou appui absorbé : le projecteur a `pointer-events: none`, la bulle non). La bulle « Intuition » se pose juste sous l'en-tête et masque le haut du contenu.

### 5.2 L'Atelier

- **[M] La liste des ressources est longue.** 46 ressources au total, rangées par âge, dont beaucoup à 0 et grisées. Le geste central (poser des ressources) oblige à faire défiler. L'établi réduit existe (`#mbench`, `ui.js:753`), mais je ne l'ai pas vu apparaître : **à vérifier**.
- **[O] Les cartes de recette du Carnet portent huit boutons** (Fabriquer, ×10, ×50, ×100, ×1000, Max, Détail, Suivre) : environ 220 px par carte. L'audit UX du jour en a déjà noté le coût ; il ne tranche pas. Voir Q7.

### 5.3 L'en-tête et l'objectif

- **[O] Trois pastilles sans nom** (« 0/3 », « +18 », « 22 ») et un menu. Les icônes sont lisibles, mais rien n'explique une pastille avant de l'ouvrir. Cell to Singularity colle des objectifs épinglés en haut de la vue de l'arbre, avec leur icône ; Éclat n'a d'objectif visible qu'à l'écran Domaine.
- **[O] Pas de lien entre l'objectif et l'arbre.**

### 5.4 Ce que font mieux Cell to Singularity et Clicky

| Principe | Jeu | Pour Éclat |
|---|---|---|
| Un bouton qui compte | Cell : « Améliorer, 18 disponibles » | « N recettes prêtes » dans l'en-tête du Carnet ; « N améliorations achetables » sur la Mémoire |
| Objectifs épinglés | Cell : deux cartes en haut de l'arbre | puce d'objectif compacte sous l'en-tête de l'Atelier et du Carnet (Q6) |
| Rien d'inutile à l'écran | Cell : prix seulement sur le prochain nœud | idem dans la Mémoire des mains |
| Maintenir pour valider | Clicky : 1 s avec anneau | relève et passages (déjà prévu, audit Clicky A) |
| Mode « inspecter » | Clicky : acheter tout ce qui est abordable | « Tout acheter » facultatif dans la Mémoire, avec confirmation |
| Une file de fenêtres | Cell : `PopupChain` | voir 5.1 |

## 6. Level design

### 6.1 Ce que veut dire « level design » ici

Éclat n'a pas de niveaux à parcourir. Le level design y est la **structure du monde et l'ordre dans lequel le contenu s'ouvre** : les terres, leurs gisements et leurs lieux, les passages qui les ferment, les règles qui changent la manière de jouer. Cell to Singularity a la même question, résolue par des « jardins » (12 scènes) et des phases (dinosaures, The Beyond). Clicky la résout par un générateur d'îles et par l'arbre de perks qui ouvre de nouvelles ressources.

### 6.2 Ce que fait Clicky

- **Un générateur** (`level_generator_config.gd`) : 11 tailles d'île de 16×16 à 64×64, des poids par ressource (arbre 100, baie 40, ambre 40, le reste à zéro au départ), un nombre de ruines et de marques de trésor.
- **L'arbre de perks pilote le générateur.** Certains perks « débloquent le sable » ou « l'argile » : ils ajoutent du poids dans le générateur. L'arbre est à la fois de la progression et un outil de level design.
- **Les contraintes de placement sont lisibles** : « Doit être près de montagnes », « pas près d'une autre mine », « +25 % par montagne voisine ».
- **Des étiquettes préviennent** (« NO STONE », « NO WATER ») quand une île manque d'une ressource, et un aperçu donne les ressources approximatives de la prochaine île.

### 6.3 Ce que fait Cell to Singularity

- **Les jardins font un monde par ère**, avec des « verres terminus » qui marquent la fin d'un chapitre (« Tu as débloqué ce verre en faisant évoluer les Néoaves »).
- **Des nœuds « Bientôt »** (`ComingSoonNode`) montrent des contenus à venir, ce qui crée un but sans le détailler.
- **Un fond de carte qui a du sens** : la géographie dit la catégorie.

### 6.4 Ce qu'on observe chez Éclat

Données de `D.ZONES` et `D.REGLES` (12 terres, 9 règles) :

| Terre | Gisements | Lieux | Règle |
|---|---:|---:|---|
| La Lisière | 3 | 5 | aucune |
| La Plaine des Hautes Herbes | 2 | 5 | aucune |
| La Rivière Lente | 3 | 4 | le courant (au-delà de 6 extracteurs, moitié moins) |
| Les Collines Vertes | 3 | 3 | les marches (chaque lieu retire 8 % du prochain passage) |
| Les Profondeurs | 2 | 2 | il fait noir (sans torche ni lampe, mains −40 %) |
| Le Désert de Verre | 2 | 4 | le verre coupe (sans gants, mains −40 %) |
| Le Gisement Noir | **1** | **1** | les vapeurs (sans masque, mains −40 %) |
| Les Pics Fracturés | 3 | 2 | l'air est mince (sans bouteille, mains −40 %) |
| L'Orbite Basse | **1** | 3 | le vide (mains au quart) |
| La Lune | 2 | 3 | tout est léger (mains +50 %) |
| Mercure | **1** | **1** | la chaleur (sans bouclier, extracteurs −40 %) |
| Le Caveau des Semeurs | 1 | 4 | secret |

- **[M] Cinq règles sur neuf suivent le même gabarit** : « sans [objet] sur toi, tes mains (ou extracteurs) rapportent 40 % de moins » (Profondeurs, Désert, Gisement Noir, Pics, Mercure). Le joueur comprend vite et n'a plus rien à décider : on fabrique l'objet, la règle disparaît.
- **[M] Les règles différentes sont les meilleures** : le courant (limite au nombre d'extracteurs), les marches (le lieu rapporte un rabais sur le passage), le vide (les extracteurs prennent le relais). Elles changent la manière de jouer, pas seulement un chiffre.
- **[M] Les terres tardives sont minces** : le Gisement Noir et Mercure n'ont qu'un gisement et qu'un lieu ; l'Orbite, un gisement.
- **[M] Le premier passage est court, le deuxième est long.** Coût brut : 720 matières pour la Plaine, 14 580 pour la Rivière, 50 400 pour les Collines. Les matières n'ont pas toutes la même rareté, donc ces nombres ne se comparent pas tels quels, mais le saut de la Plaine à la Rivière (×20) mérite d'être regardé au simulateur. L'audit UX du jour fait la même hypothèse (« le premier passage peut être vécu comme un palier long »).
- **[M] Les verbes sont inégaux.** 97 recettes sur 175 (55 %) utilisent le geste « Assembler » ; les autres gestes en comptent de 3 à 18.
- **[O] Les terres sont une liste** (écran Domaine, la plus récente en premier) **et une carte illustrée** (écran Carte) : deux représentations du même contenu. La carte est belle et fait son travail de repère.

### 6.5 Pistes

- **L1, plus de types de règles.** Garder les quatre règles réussies, convertir deux des cinq règles « sans objet ». Types possibles : un rythme (le jeu connaît déjà le jour et la nuit pour ses ambiances), un épuisement (un gisement tarit sous la main et se renouvelle : on alterne), un voisinage (deux gisements d'une terre se renforcent si on équilibre les extracteurs), un plafond propre à une matière.
- **L2, épaissir ou assumer les terres tardives.** Soit ajouter un gisement ou un lieu aux terres à une seule entrée, soit les assumer comme des chapitres courts et intenses.
- **L3, jalons entre deux passages.** Un palier visible à mi-chemin (« à moitié payé »), comme la barre qui monte vers le prochain Metabit chez Cell to Singularity.
- **L4, un aléa de terre par cycle** (proposé dans l'audit Clicky, version E) : « La Rivière est à sec », « Les Collines sont riches ».
- **L5, des emplacements** (Q5) : une grille par terre, où l'on place les extracteurs, avec des bonus de voisinage. C'est le level design de Clicky, adapté. Le candidat naturel est la Rivière, dont la règle plafonne les extracteurs à 6 : six emplacements.
- **L6, rééquilibrer les gestes** : déplacer quelques recettes d'« Assembler » vers un geste dont le sens est plus juste. C'est du contenu : l'auteur décide.

## 7. Décisions prises

Ce sont les décisions simples : je les prends, elles sont réversibles à bas coût.

| N° | Décision | Pourquoi |
|---|---|---|
| D1 | **Garder l'orientation** : l'âge du Bois en bas, les étoiles en haut | cohérent avec « du silex aux étoiles » ; la vue s'ouvre de toute façon sur l'objectif |
| D2 | **L'arbre passe en plein écran** (vue à part, barre fine de 44 px) | gagne environ 150 px de hauteur et enlève les commandes du Carnet |
| D3 | **Un lien visible par recette** : l'ingrédient principal ; les autres en pastilles de la couleur de leur voie | rend l'arbre lisible sans perdre l'information |
| D4 | **Cinq voies** : Vivant, Terre, Cuivre, Fer, Chimie et ciel (noms provisoires) | tient en 390 px, 62 % des liens restent droits |
| D5 | **Le rattachement à une voie se calcule** (racine de la chaîne) avec une table de 18 lignes et un champ `voie` pour les exceptions | peu de contenu à écrire, vérifiable par `validate.js` |
| D6 | **Zoom à trois niveaux** (grille de comptes, icônes, noms) | résout les étiquettes illisibles quand on dézoome |
| D7 | **Rail des âges** sur le bord droit et **en-tête des voies collant** | on sait toujours où l'on est |
| D8 | **« Voir dans l'arbre »** depuis l'objectif et depuis une fiche | l'arbre cesse d'être enterré |
| D9 | **Une fenêtre à la fois au lancement**, par ordre de priorité ; un appui sur un onglet change toujours d'onglet, même pendant une bulle | la file d'attente de Cell to Singularity |
| D10 | **« Bon retour » seulement au-delà de 5 minutes** ; en dessous, un message discret sans fenêtre | la minute passée dans une autre application ne mérite pas un écran |
| D11 | **Les règles de non-fuite et le compteur sans total restent** | décisions de la 0.11 |
| D12 | **Mémoire des mains : prix seulement sur le prochain nœud de chaque branche**, et un compteur « N achetables » | principe du Reality Engine ; la Mémoire n'a que 9 nœuds, le gain est surtout de lecture |
| D13 | **Un compteur « N recettes prêtes »** en tête du Carnet | « Améliorer, N disponibles » |
| D14 | **Pas de carte illustrée de l'arbre** comme celle de Cell to Singularity pour 175 nœuds | une illustration par région (au moins cinq grandes scènes) pèse trop pour un jeu qui fonctionne sans dépendance ; voir Q1 |

## 8. Choix à arbitrer

Pour chaque question : les options, ce que je recommande, ce que cela change.

### Q1. La forme cible de l'arbre

- **A. Voies × âges** (section 4). Réutilise le code actuel. **Recommandé.**
- **B. Carte illustrée de filières** (comme l'Arbre de la vie). Beau, très lisible, mais il faut dessiner une région par filière et poser les 175 nœuds à la main, et le moindre ajout de recette demande de retoucher la carte.
- **C. Liste hiérarchique repliable** (plan de texte : voie, âge, recette). Le plus simple, le plus accessible (lecteur d'écran, clavier), mais ce n'est plus un arbre.
- **A + C** : l'arbre pour l'aperçu, la liste hiérarchique en alternative accessible. Coût : une vue de plus à tenir à jour.

### Q2. Une colonne pour les gestes et les stations ?

Les stations (feu de camp, four, haut-fourneau, four à arc) et les gestes sont la vraie colonne vertébrale du jeu : chaque station ouvre des recettes. Une sixième colonne centrale les porterait (comme l'axe du Moteur de réalité). **Oui** : on voit ce que chaque station ouvre ; mais l'arbre passe de 5 à 6 colonnes (environ 50 px chacune sur 320 px, serré). **Non** : les stations restent dans les voies. Je penche pour oui si l'arbre est en plein écran, non sinon.

### Q3. Noms des voies et rattachement des racines

Table de la section 4.2 : à relire par l'auteur. Points sensibles : la Malachite est-elle « Cuivre » ou « Roche verte » ? Le Quartz est-il dans « Terre » ou dans une voie « Verre » ? Les cinq racines de « Chimie et ciel » font un ensemble disparate.

### Q4. Les pistes de l'arbre

Aujourd'hui : l'objectif et les ressources étudiées. **Option** : montrer aussi, par voie, une silhouette de « prochaine case » sans nom ni icône. Plus de repères, plus de fuite possible. Je recommande de **ne pas changer** avant d'avoir vu jouer des débutants.

### Q5. Des emplacements sur les terres

Une grille par terre où l'on pose les extracteurs, avec des bonus de voisinage. Le pour : un vrai level design, un lien avec Clicky, une raison de revenir sur les anciennes terres. Le contre : cela change le Domaine en profondeur, entre en conflit avec « + cabane » en un appui et avec les paliers de 10, 25, 50 extracteurs. **Option médiane** : un prototype sur la Rivière seule (6 emplacements, qui reprennent sa règle).

### Q6. Un objectif épinglé sur tous les onglets

Clicky et Cell en montrent un en permanence. Éclat l'affiche sur l'écran Domaine. Gain : l'objectif suit le joueur. Coût : 40 à 50 px d'écran sur un téléphone déjà serré, et un doublon avec la pastille « 0/3 ». Je propose de l'essayer sur l'Atelier et le Carnet seulement.

### Q7. Les huit boutons des recettes du Carnet

Garder tout, ou ne montrer que « Fabriquer » et un menu de quantités. L'audit UX du jour hésite (moins de boutons, mais un clic de plus). Mon avis : un seul bouton « Fabriquer » plus une quantité qui se choisit une fois par session. À décider avec des joueurs.

### Q8. Les types de règles et l'avenir des terres tardives (L1, L2)

Quels deux types de règles nouveaux, et pour quelles terres ? Épaissir les terres tardives ou les assumer comme chapitres courts ? C'est de la conception : je donne les pistes (6.5), l'auteur tranche.

## 9. Plan d'implémentation

### 9.1 Principes

- **Une version par ensemble cohérent**, avec le simulateur ou les tests avant la livraison, comme le demande `AUDIT-INSPIRATIONS.md`.
- **Chaque tâche est donnée à un agent avec un prompt** au format de `docs/prompts/` (contexte, contrainte, règles d'écriture, tests, livraison). Les phases ci-dessous donnent le périmètre ; les prompts sont à écrire à partir de chaque phase.
- **On ne casse aucune sauvegarde.** Aucun nouveau champ n'est nécessaire pour les phases T et N ; le champ `voie` est dans les données, pas dans la sauvegarde.

### 9.2 Les phases

| Phase | Contenu | Fichiers | Critères d'acceptation | Effort |
|---|---|---|---|---|
| **T0, mesures** | un script `tools/arbre-mesures.js` qui sort : nœuds visibles par écran, longueur moyenne des liens, nombre de croisements, plus petite police, plus petite cible. Une ligne de base enregistrée avant toute modification | `tools/` | résultats stockés dans `docs/revue/arbre-mesures.md` | XS |
| **N1, fenêtres** | file d'attente (D9), seuil de 5 minutes (D10), un appui sur un onglet marche pendant une bulle | `js/ui.js`, `js/ecouteurs.js`, `js/tuto.js` | au lancement : une fenêtre au plus ; une absence de 60 s n'ouvre rien ; un appui sur chaque onglet change d'onglet pendant une bulle (test Playwright à 320 et 390 px) | S |
| **T1, arbre lisible** | plein écran (D2), barre fine, rail des âges et voies collantes (D7), entrées « Voir dans l'arbre » (D8), zoom à trois niveaux (D6) sur la mise en page **actuelle** | `js/atelier.js`, `js/arbre.js`, `css/arbre.css` | étiquette de 11 px au moins à l'échelle par défaut ; cible de 44 px au moins ; l'objectif est visible à l'ouverture sans geste ; surface utile de l'arbre ≥ 650 px sur 844 | M |
| **T2, voies** | `D.VOIES`, placement par voie et par âge, parent unique, pastilles (D3, D4, D5) | `js/data.js`, `js/arbre.js`, `tools/validate.js`, `tools/test-arbre.js` | toute recette a une voie ; position stable (un nouveau nœud ne déplace rien) ; ≥ 60 % des liens droits ; aucune fuite ; mise en page < 100 ms | M |
| **T3, chemins et recherche** | chemin complet amont/aval, état « réalisable » (halo), recherche qui recentre, compteur « N prêtes » (D13) | `js/arbre.js`, `js/atelier.js` | un appui allume le chemin jusqu'à la racine ; la recherche trouve en 2 saisies ; le compteur égale le filtre « Prêtes » | S |
| **T4, Mémoire des mains** | prix sur le prochain nœud, « N achetables » (D12), option « Tout acheter » (à décider) | `js/memoire.js`, `css/` | compteur exact ; golden-ui à jour | S |
| **L1 à L3, règles et rythme** | deux règles d'un nouveau type, jalon de passage visible ; passage 1→2 regardé au simulateur | `js/data.js` (`D.REGLES`), `js/engine.js`, `tools/sim-passages.js` | temps de passage dans ±15 % du réglage actuel ; validateur d'atteignabilité vert | M |
| **L4, aléa de terre** | un modificateur par cycle (audit Clicky, E) | `js/data.js`, `js/engine.js`, `js/memoire.js` | jamais punitif au premier cycle ; toujours franchissable | M |
| **L5, emplacements** | prototype sur la Rivière si Q5 est « oui » | `js/domaine.js`, `js/engine.js` | décision après essai ; sinon retiré | L |

### 9.3 Ordre et dépendances

```
T0 ─┬─> T1 ──> T2 ──> T3 ──> T4
    │
N1 ─┘             F (simulateur à profils, audit Cell) ──> L1-L3 ──> L4 ──> (L5)
                  A (toucher) ∥ B (cycles) ──> C (Vœux) ──> D (Offrande)
```

Le premier lot à lancer, sans attendre aucune réponse : **T0, N1, T1, F**. Il traite les deux plaintes principales (l'arbre, les interruptions) et prépare les mesures. **T2** attend Q1 et Q3. **T3** attend T2. **L1 à L5** attendent Q5 et Q8.

### 9.4 Le plan consolidé (les trois documents)

| Lot | Source | Contenu | État |
|---|---|---|---|
| T0, N1, T1 | ce document | mesures, fenêtres, arbre lisible | à lancer |
| F | audit Cell | simulateur à profils de joueurs | à lancer, en parallèle |
| T2, T3, T4 | ce document | arbre à voies, chemins, Mémoire | après Q1 et Q3 |
| A | audit Clicky + Cell | flotteur en 4 temps, variantes sonores, secousse, rebond, geste à maintenir | à lancer après T1 |
| B | audit Clicky + Cell | bilan et Livre des Semeurs, jauge de relève, tutoriel = succès, retour joueur, veillée | à lancer après N1 |
| L1 à L4 | ce document | règles, jalons, aléa de terre | après F, Q8 |
| C | audit Clicky | Vœux | après F et B |
| D | audit Clicky | Offrande | après F |
| E | audit Clicky | Reliques équipables | après C et D |
| G | audit Cell | savoir réel, pilote | seulement avec relecture humaine |
| H | audit Cell | partage d'une page du Carnet | après A |

### 9.5 Mesures de réussite

- **Arbre** : un joueur retrouve une recette connue en deux appuis ou moins (arbre ou recherche) ; l'objectif est repéré en moins de deux secondes à l'ouverture ; aucune étiquette sous 11 px.
- **Fenêtres** : au lancement, une fenêtre au plus ; une absence de moins de 5 minutes ne produit aucun écran.
- **Level design** : temps de passage inchangés (±15 %) pour le joueur de référence ; les profils « veilleur » et « paresseux » atteignent chaque passage en moins de trois fois le temps du « tapeur ».
- **Aucune sauvegarde existante cassée** (fixtures v1 à v5 rejouées).

### 9.6 Risques

- **Une refonte de l'arbre trop ambitieuse.** Mitigation : T1 améliore la vue actuelle avant tout changement de structure ; T2 ne démarre qu'après une mesure.
- **Des voies qui ne parlent pas au joueur.** Mitigation : nommer avec l'auteur (Q3), tester auprès de 5 joueurs ; le champ `voie` permet de corriger sans toucher au code.
- **L'écart entre un bot et un humain.** Les mesures de l'arbre (T0) et du rythme (F) viennent d'outils : elles ne remplacent pas l'essai à cinq ou huit joueurs que l'audit UX propose déjà.
- **Écriture.** Les noms de voies et les textes de légende demandent une relecture humaine (STYLE.md).

## Annexe A. Statistiques d'Éclat utilisées

- 207 objets : 175 recettes, 29 matières sans recette, 3 objets « path ».
- 397 liens entre recettes et ingrédients ; écart d'âge 0 : 181 ; 1 : 77 ; 2 : 49 ; 3 : 38 ; 4 : 27 ; 5 : 8 ; 6 : 7 ; 7 : 2 ; 8 : 2 ; 9 : 3 ; 10 : 1 ; 12 : 1 ; −1 : 1.
- Ingrédients les plus utilisés : Manche 30, Moteur électrique 17, Corde 14, Processeur 14, Plaque de fer 13, Acier trempé 12, Charbon 11, Argile 11, Plaque de bronze 10.
- Recettes par âge : 10, 11, 12, 11, 18, 16, 20, 15, 16, 15, 13, 9, 9.
- Recettes par geste : assembler 97, chauffer 18, tailler 16, marteler 7, tresser 6, usiner 6, allier 4, graver 4, synthétiser 4, stratifier 4, tremper 3, électriser 3, transmuter 3.
- Types : composants 76, extracteurs 21, outils 24, stations 16, améliorations 17, machines 5, curiosités 15.
- Forêt « ingrédient principal » : 18 racines (minerai de fer 37, malachite 27, bois 20, argile 12, fibres 11, pétrole 10, quartz 9, os 5, peau 5, pierre 4, sable 3, ilménite 3, débris 3, hélium-3 3, bauxite 2, silex 2, métal mercurien 2, cassitérite 1), profondeur 7, 11 enfants au plus.
- Forêt « ingrédient le plus récent » : 19 racines, 43 liens entre âges seulement (au lieu de 98) : variante à essayer en T2 si la lecture du parent « principal » surprend.

## Annexe B. Ce que j'ai laissé sur ton PC

Dans `%TEMP%` : `craftgame-src` (clone d'Éclat, non modifié), `clicky-recovered`, `gdre-tools`, `ghidra-dl` (environ 570 Mo, l'archive de Ghidra déjà installé dans `C:\Tools`), `c2s-tools`, `c2s-src2`, `c2s-calc`, `c2s-loc`, `viz`, `eclat_lanes.js`, `eclat-server.log`. Les serveurs locaux sont arrêtés. Cell to Singularity est fermé. À supprimer quand tu veux ; rien d'autre n'a été modifié sur ta machine, hors les gains hors ligne collectés dans Cell to Singularity.

Les captures de Cell to Singularity viennent de ta partie : elles restent hors du dépôt public.
