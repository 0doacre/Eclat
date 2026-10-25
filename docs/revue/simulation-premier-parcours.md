# Le premier parcours d’un nouveau joueur : mesures

Simulation sur le moteur réel (`node tools/sim-parcours.js --ecrire`), sans écran. **Ce sont des durées de jeu actif, en minutes**, pour un joueur de type « tapeur » (4 appuis par seconde). Elles comparent des hypothèses ; elles ne remplacent pas l’observation de vrais joueurs.

Version du jeu : 0.18.0 · 40 min de cycle 2 · 8 s par essai · 9 graines de hasard par case (médiane, puis [min–max]).

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
| énigme résolue d’emblée | 5.8 [5.7–5.8] | 8 [8–8] | 2.7 [2.7–2.7] | 8 [8–8] |
| thermomètre et indices | 13.7 [9.5–16.0] | 79 [48–97] | 10.5 [6.4–12.9] | 11 [9–12] |
| au hasard | 12.6 [9.6–15.4] | 73 [49–92] | 9.7 [6.5–12.3] | 9 [8–10] |

Le cycle 1 ne dépend pas de l’achat : c’est avant la relève.

## Quand la relève se déclenche : l’ancienne règle et la règle actuelle

Ancienne règle : dès que la première cabane est posée et la première exploration faite. Règle actuelle : une fois la Plaine franchie. Les Traces sont dépensées dans l’ordre habituel de la Mémoire (3 offertes, plus 2 du passage pour la règle actuelle).

| Hypothèse | Relève (ancienne) | Relève (actuelle) | Rivière depuis le début (ancienne) | Rivière depuis le début (actuelle) |
|---|---:|---:|---:|---:|
| énigme résolue d’emblée | 2.3 [2.0–2.3] | 5.8 [5.7–5.8] | 25.3 [25.0–25.3] | 28.4 [28.3–28.5] |
| thermomètre et indices | 5.4 [2.5–7.5] | 13.7 [9.5–16.0] | 33.5 [29.1–39.4] | 38.1 [35.3–42.8] |
| au hasard | 5.1 [3.8–7.5] | 12.6 [9.6–15.4] | 33.6 [31.3–38.2] | 38.3 [33.6–41.2] |

## La Plaine

**Depuis le début de la partie (cycle 1 + cycle 2), en minutes**

| Hypothèse | aucun achat | Mains calleuses | Mains sûres | Mém. des gisements |
|---|---:|---:|---:|---:|
| énigme résolue d’emblée | 8.5 [8.3–8.5] | 7.3 [7.1–7.3] | 8.4 [8.3–8.5] | 8.3 [8.2–8.3] |
| thermomètre et indices | 15.3 [12.2–17.7] | 14.8 [11.0–17.2] | 15.2 [12.2–17.7] | 15.2 [12.0–17.6] |
| au hasard | 15.3 [12.3–17.0] | 14.1 [11.1–16.6] | 15.3 [12.3–17.0] | 15.1 [12.1–16.9] |

**Le cycle 2 seul (depuis la relève), en minutes**

| Hypothèse | aucun achat | Mains calleuses | Mains sûres | Mém. des gisements |
|---|---:|---:|---:|---:|
| énigme résolue d’emblée | 2.7 [2.7–2.7] | 1.5 [1.5–1.5] | 2.7 [2.7–2.7] | 2.5 [2.5–2.5] |
| thermomètre et indices | 1.6 [1.6–2.7] | 1.1 [1.0–1.5] | 1.6 [1.6–2.7] | 1.6 [1.5–2.5] |
| au hasard | 2.7 [1.6–2.7] | 1.5 [1.0–1.5] | 2.7 [1.6–2.7] | 2.5 [1.5–2.6] |

## La Rivière

**Depuis le début de la partie (cycle 1 + cycle 2), en minutes**

| Hypothèse | aucun achat | Mains calleuses | Mains sûres | Mém. des gisements |
|---|---:|---:|---:|---:|
| énigme résolue d’emblée | 40.2 [40.2–40.3] | 28.4 [28.3–28.5] | 40.2 [40.2–40.3] | 35.7 [35.7–35.8] |
| thermomètre et indices | 48.3 [45.7–51.9] (8/9) | 38.1 [35.2–42.5] | 48.3 [45.7–51.9] (8/9) | 45.4 [42.6–49.3] (8/9) |
| au hasard | 49.1 [45.3–52.0] (8/9) | 38.2 [33.7–41.2] | 49.1 [45.4–52.0] (8/9) | 44.8 [42.3–53.3] |

**Le cycle 2 seul (depuis la relève), en minutes**

| Hypothèse | aucun achat | Mains calleuses | Mains sûres | Mém. des gisements |
|---|---:|---:|---:|---:|
| énigme résolue d’emblée | 34.5 [34.5–34.5] | 22.7 [22.6–22.7] | 34.5 [34.4–34.5] | 30.0 [29.9–30.0] |
| thermomètre et indices | 34.6 [31.8–37.2] (8/9) | 23.7 [22.0–33.0] | 34.5 [31.8–37.2] (8/9) | 31.5 [28.6–34.6] (8/9) |
| au hasard | 38.6 [30.0–38.9] (8/9) | 27.2 [21.9–27.8] | 38.6 [30.0–38.8] (8/9) | 33.5 [26.9–39.8] |

## Si le joueur cherche aussi les recettes hors objectif (achat : Mains calleuses)

Par défaut le joueur simulé ne suit que le guide et n’utilise que les recettes qu’il connaît. Ici, au cycle 2, il cherche en plus les extracteurs et outils qui l’intéressent, avec au plus 10 essais par recette, puis abandonne.

| Hypothèse | Plaine (depuis le début) | Rivière (depuis le début) | Réflexion cycle 2 (min) | Essais cycle 2 | Extracteurs posés |
|---|---:|---:|---:|---:|---:|
| énigme résolue d’emblée | 7.2 [7.1–7.3] (sans : 7.3 [7.1–7.3]) | 18.1 [17.8–18.3] (sans : 28.4 [28.3–28.5]) | 4.0 [4.0–4.0] | 12 [12–12] | 7 [5–8] |
| thermomètre et indices | 14.8 [12.2–17.2] (sans : 14.8 [11.0–17.2]) | 41.2 [38.4–43.7] (sans : 38.1 [35.2–42.5]) | 23.3 [20.4–25.9] | 175 [153–194] | 5 [2–6] |
| au hasard | 16.2 [13.5–17.1] (sans : 14.1 [11.1–16.6]) | 42.2 [40.1–50.4] (sans : 38.2 [33.7–41.2]) | 20.7 [19.5–23.2] | 155 [146–174] | 4 [3–4] |

## Où passe le temps du cycle 2 (achat : Mains calleuses, sans chasse)

| Hypothèse | Réflexion (min) | Essais | Extracteurs posés à la fin |
|---|---:|---:|---:|
| énigme résolue d’emblée | 2.3 [2.3–2.3] | 7 [7–7] | 3 [3–3] |
| thermomètre et indices | 16.5 [14.3–20.8] | 124 [107–156] | 4 [3–6] |
| au hasard | 12.5 [10.4–13.3] | 94 [78–100] | 3 [2–6] |

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

_Mesuré au commit 3a54bfc._
