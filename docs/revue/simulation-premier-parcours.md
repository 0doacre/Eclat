# Le premier parcours d’un nouveau joueur : mesures

Simulation sur le moteur réel (`node tools/sim-parcours.js --ecrire`), sans écran. **Ce sont des durées de jeu actif, en minutes**, pour un joueur de type « tapeur » (4 appuis par seconde). Elles comparent des hypothèses ; elles ne remplacent pas l’observation de vrais joueurs.

Version du jeu : 0.17.0 · 40 min de cycle 2 · 8 s par essai · 9 graines de hasard par case (médiane, puis [min–max]).

## Ce qui est simulé

1. Partie neuve : aucune recette connue d’avance. Le joueur voit chaque matière, puis **découvre** la recette de l’étape en cours par des essais sur le moteur réel (thermomètre, et souvenirs du guide qui donnent l’action, une matière, puis la recette).
2. La relève obligatoire du cycle 1 est prise dès qu’elle se déclenche : une fois le premier passage (la Plaine) franchi, ce qui demande d’explorer la grotte, donc de fabriquer une torche. +3 Traces offertes, en plus de celles du passage.
3. Un premier achat de Mémoire avec ces Traces : une colonne par choix possible, plus « aucun achat ».
4. Cycle 2 : il ne connaît que ce qu’il a appris au cycle 1. On note la minute où il franchit la Plaine, puis la Rivière.

## Les trois hypothèses sur la découverte (la partie incertaine)

- **énigme résolue d’emblée** : il trouve la bonne combinaison au premier essai (20 s de réflexion). C’est le modèle de l’ancien simulateur : la borne basse.
- **thermomètre et indices** : il essaie, regarde le thermomètre, varie ce qui « chauffe » et suit les indices du guide.
- **au hasard** : il essaie une action et une à trois matières tirées au sort : la borne haute.
Le nombre d’essais vient du moteur (thermomètre, souvenirs du guide) ; seule la manière de choisir l’essai suivant et le temps d’un essai (8 s) sont des hypothèses.

## Le cycle 1 : jusqu’à la relève obligatoire

| Hypothèse | Relève à (min) | Essais | Réflexion (min) | Recettes connues |
|---|---:|---:|---:|---:|
| énigme résolue d’emblée | 5.8 [5.5–5.8] | 8 [8–8] | 2.7 [2.7–2.7] | 8 [8–8] |
| thermomètre et indices | 12.3 [9.9–13.1] | 69 [51–77] | 9.2 [6.8–10.3] | 9 [9–10] |
| au hasard | 12.6 [9.6–15.4] | 73 [49–92] | 9.7 [6.5–12.3] | 8 [8–9] |

Le cycle 1 ne dépend pas de l’achat : c’est avant la relève.

## Quand la relève se déclenche : l’ancienne règle et la règle actuelle

Ancienne règle : dès que la première cabane est posée et la première exploration faite. Règle actuelle : une fois la Plaine franchie. Les Traces sont dépensées dans l’ordre habituel de la Mémoire (3 offertes, plus 2 du passage pour la règle actuelle).

| Hypothèse | Relève (ancienne) | Relève (actuelle) | Rivière depuis le début (ancienne) | Rivière depuis le début (actuelle) |
|---|---:|---:|---:|---:|
| énigme résolue d’emblée | 2.3 [2.0–2.3] | 5.8 [5.5–5.8] | 27.4 [25.3–27.5] | 30.6 [30.1–30.7] |
| thermomètre et indices | 4.6 [2.9–5.8] | 12.3 [9.9–13.1] | 31.4 [27.9–38.3] | 35.9 [32.6–45.6] |
| au hasard | 5.1 [3.8–7.5] | 12.6 [9.6–15.4] | 35.8 [30.6–38.0] | 38.4 [35.8–42.9] |

## La Plaine

**Depuis le début de la partie (cycle 1 + cycle 2), en minutes**

| Hypothèse | aucun achat | Mains calleuses | Mains sûres | Mém. des gisements |
|---|---:|---:|---:|---:|
| énigme résolue d’emblée | 8.5 [8.2–8.5] | 7.2 [7.0–7.3] | 8.4 [8.2–8.5] | 8.3 [8.0–8.3] |
| thermomètre et indices | 14.0 [11.6–14.8] | 13.5 [11.0–14.3] | 14.1 [11.6–14.8] | 13.9 [11.5–14.8] |
| au hasard | 14.9 [12.3–17.0] | 14.1 [11.1–16.6] | 14.9 [12.3–17.0] | 14.8 [12.1–17.0] |

**Le cycle 2 seul (depuis la relève), en minutes**

| Hypothèse | aucun achat | Mains calleuses | Mains sûres | Mém. des gisements |
|---|---:|---:|---:|---:|
| énigme résolue d’emblée | 2.7 [2.7–2.7] | 1.5 [1.5–1.5] | 2.7 [2.6–2.7] | 2.5 [2.5–2.5] |
| thermomètre et indices | 1.7 [1.6–2.7] | 1.2 [1.1–1.5] | 1.7 [1.5–2.6] | 1.6 [1.5–2.5] |
| au hasard | 2.7 [1.6–2.7] | 1.5 [1.0–1.5] | 2.6 [1.6–2.7] | 2.5 [1.6–2.5] |

## La Rivière

**Depuis le début de la partie (cycle 1 + cycle 2), en minutes**

| Hypothèse | aucun achat | Mains calleuses | Mains sûres | Mém. des gisements |
|---|---:|---:|---:|---:|
| énigme résolue d’emblée | — | 30.6 [29.8–30.7] | — | 43.9 [43.7–43.9] |
| thermomètre et indices | 48.6 [47.0–50.8] (8/9) | 36.3 [32.7–46.1] | 48.7 [46.2–50.8] (8/9) | 46.2 [44.5–48.3] (8/9) |
| au hasard | 49.3 [48.6–50.3] (3/9) | 37.4 [35.7–42.8] | 49.4 [48.6–50.3] (3/9) | 47.1 [46.2–48.0] (3/9) |

**Le cycle 2 seul (depuis la relève), en minutes**

| Hypothèse | aucun achat | Mains calleuses | Mains sûres | Mém. des gisements |
|---|---:|---:|---:|---:|
| énigme résolue d’emblée | — | 24.8 [24.2–24.9] | — | 38.2 [38.1–38.3] |
| thermomètre et indices | 37.1 [34.4–37.7] (8/9) | 24.7 [21.6–34.0] | 37.1 [33.9–38.2] (8/9) | 34.7 [32.3–35.2] (8/9) |
| au hasard | 35.3 [33.9–35.3] (3/9) | 26.2 [21.4–30.6] | 35.3 [34.0–35.3] (3/9) | 33.0 [31.7–33.0] (3/9) |

## Si le joueur cherche aussi les recettes hors objectif (achat : Mains calleuses)

Par défaut le joueur simulé ne suit que le guide et n’utilise que les recettes qu’il connaît. Ici, au cycle 2, il cherche en plus les extracteurs et outils qui l’intéressent, avec au plus 10 essais par recette, puis abandonne.

| Hypothèse | Plaine (depuis le début) | Rivière (depuis le début) | Réflexion cycle 2 (min) | Essais cycle 2 | Extracteurs posés |
|---|---:|---:|---:|---:|---:|
| énigme résolue d’emblée | 7.2 [7.0–7.3] (sans : 7.2 [7.0–7.3]) | 18.0 [17.8–18.3] (sans : 30.6 [29.8–30.7]) | 4.0 [4.0–4.0] | 12 [12–12] | 7 [5–7] |
| thermomètre et indices | 13.5 [11.0–14.7] (sans : 13.5 [11.0–14.3]) | 38.6 [33.6–49.0] (sans : 36.3 [32.7–46.1]) | 21.7 [17.6–26.1] | 163 [132–196] | 13 [3–13] |
| au hasard | 14.7 [12.3–16.6] (sans : 14.1 [11.1–16.6]) | 41.5 [38.0–45.0] (sans : 37.4 [35.7–42.8]) | 19.2 [17.6–20.5] | 144 [132–154] | 4 [3–13] |

## Où passe le temps du cycle 2 (achat : Mains calleuses, sans chasse)

| Hypothèse | Réflexion (min) | Essais | Extracteurs posés à la fin |
|---|---:|---:|---:|
| énigme résolue d’emblée | 2.3 [2.3–2.3] | 7 [7–7] | 7 [7–8] |
| thermomètre et indices | 17.2 [13.7–19.9] | 129 [103–149] | 8 [3–14] |
| au hasard | 12.7 [10.7–13.9] | 95 [80–104] | 7 [7–14] |

## Ce que ce modèle ne sait pas faire

- **Les recettes hors objectif** (extracteurs, outils d’amélioration) : par défaut le joueur simulé n’en cherche aucune ; avec la section ci-dessus, il en cherche à coups d’essais, au cycle 2 seulement. Un vrai joueur les déduit peut-être de l’énigme du Carnet (l’hypothèse « énigme ») ou n’y pense pas. C’est ce qui fait le plus varier la fin du cycle 2 : regarder les deux versions.
- **La récolte** : 4 appuis par seconde (le type « tapeur »). Un vrai joueur peut utiliser la récolte continue : la vitesse manuelle compte donc moins que dans ces chiffres.
- Ni l’Intuition (étude, déchiffrage), ni les secrets, ni les dialogues, ni la lecture : seulement ce qu’on peut mesurer sur le moteur.
- Le hasard du moteur (coups de chance à la récolte, pièces en plus) varie lui aussi avec la graine : même graine, mêmes nombres.
- Aucun joueur qui s’arrête : tout est en minutes de jeu actif, jusqu’au bout.

## Comment lire

- **Depuis la 0.17 (un extracteur par ressource)**, le joueur simulé choisit lui-même quel bâtiment construire pour chaque ressource. Ses temps ont bougé de quelques pour cent (la Rivière en énigme : environ 10 % plus tard) : c’est surtout son choix de bâtiments, pas un prix qui a changé, car chaque niveau garde la recette et le taux de l’ancien extracteur.
- **Mains sûres** (les fabrications à la main : 20 % plus rapides et 10 % de chances d’une pièce en plus par niveau) ne change presque rien avant la Rivière, même avec un bonus de 90 % (mesuré une fois : 34,7 contre 30,8 min). Les murs du début se règlent à la récolte, pas aux pièces fabriquées. Mains calleuses (récolte ×2) est le seul achat qui compte au premier relève.
- « — » : la Rivière n’est pas franchie dans la durée simulée ; « (6/9) » : seules 6 graines sur 9 y arrivent.
- Regarder d’abord l’**écart entre les hypothèses** : si les trois donnent à peu près la même durée, la découverte ne fait pas la différence ; sinon, c’est ce qu’il faut observer chez de vrais joueurs.
- Regarder ensuite l’**écart entre les achats** : il dit si le premier choix de Mémoire change vraiment le cycle 2, et ce que coûte de ne rien acheter.
- Pour les seuils de rythme : voir seulement après des essais avec de vrais joueurs ; ce rapport ne fixe aucune cible.

_Mesuré au commit 047ba2f._
