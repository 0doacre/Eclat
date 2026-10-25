# Le premier parcours d’un nouveau joueur : mesures

Simulation sur le moteur réel (`node tools/sim-parcours.js --ecrire`), sans écran. **Ce sont des durées de jeu actif, en minutes**, pour un joueur de type « tapeur » (4 appuis par seconde). Elles comparent des hypothèses ; elles ne remplacent pas l’observation de vrais joueurs.

Version du jeu : 0.16.0 · 40 min de cycle 2 · 8 s par essai · 9 graines de hasard par case (médiane, puis [min–max]).

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
| énigme résolue d’emblée | 5.9 | 8 | 2.7 | 8 |
| thermomètre et indices | 12.3 [9.9–15.4] | 69 [51–92] | 9.2 [6.8–12.3] | 9 [9–10] |
| au hasard | 12.7 [9.6–15.4] | 72 [49–92] | 9.6 [6.5–12.3] | 8 [8–9] |

Le cycle 1 ne dépend pas de l’achat : c’est avant la relève.

## Quand la relève se déclenche : l’ancienne règle et la règle actuelle

Ancienne règle : dès que la première cabane est posée et la première exploration faite. Règle actuelle : une fois la Plaine franchie. Les Traces sont dépensées dans l’ordre habituel de la Mémoire (3 offertes, plus 2 du passage pour la règle actuelle).

| Hypothèse | Relève (ancienne) | Relève (actuelle) | Rivière depuis le début (ancienne) | Rivière depuis le début (actuelle) |
|---|---:|---:|---:|---:|
| énigme résolue d’emblée | 2.3 | 5.9 | 25.8 | 29.1 |
| thermomètre et indices | 4.3 [2.9–6.1] | 12.3 [9.9–15.4] | 32.0 [28.7–35.2] | 38.2 [36.0–44.5] |
| au hasard | 4.9 [3.8–7.5] | 12.7 [9.6–15.4] | 33.5 [32.3–35.0] | 39.1 [35.9–40.8] |

## La Plaine

**Depuis le début de la partie (cycle 1 + cycle 2), en minutes**

| Hypothèse | aucun achat | Mains calleuses | Mains sûres | Mém. des gisements |
|---|---:|---:|---:|---:|
| énigme résolue d’emblée | 8.8 | 7.5 | 8.8 | 8.6 |
| thermomètre et indices | 14.1 [11.7–17.1] | 13.5 [11.4–16.4] | 14.1 [11.7–17.1] | 14.0 [11.6–17.0] |
| au hasard | 15.0 [12.5–17.2] | 14.3 [11.2–16.5] | 15.0 [12.5–17.1] | 14.9 [12.3–17.1] |

**Le cycle 2 seul (depuis la relève), en minutes**

| Hypothèse | aucun achat | Mains calleuses | Mains sûres | Mém. des gisements |
|---|---:|---:|---:|---:|
| énigme résolue d’emblée | 2.8 | 1.6 | 2.8 | 2.7 |
| thermomètre et indices | 1.8 [1.7–2.8] | 1.1 [1.1–1.6] | 1.8 [1.7–2.8] | 1.7 [1.6–2.7] |
| au hasard | 2.8 [1.8–2.8] | 1.6 [1.1–1.6] | 2.8 [1.8–2.8] | 2.7 [1.7–2.7] |

## La Rivière

**Depuis le début de la partie (cycle 1 + cycle 2), en minutes**

| Hypothèse | aucun achat | Mains calleuses | Mains sûres | Mém. des gisements |
|---|---:|---:|---:|---:|
| énigme résolue d’emblée | 41.8 | 29.1 | 41.8 | 36.7 |
| thermomètre et indices | 46.6 [44.4–49.7] (8/9) | 38.2 [36.3–44.5] | 46.6 [44.4–49.7] (8/9) | 43.2 [40.8–49.7] |
| au hasard | 48.7 [45.5–52.7] (6/9) | 39.1 [35.9–40.8] | 48.7 [45.5–52.7] (6/9) | 44.3 [42.1–47.1] |

**Le cycle 2 seul (depuis la relève), en minutes**

| Hypothèse | aucun achat | Mains calleuses | Mains sûres | Mém. des gisements |
|---|---:|---:|---:|---:|
| énigme résolue d’emblée | 35.9 | 23.2 | 35.9 | 30.8 |
| thermomètre et indices | 34.3 [33.1–35.3] (8/9) | 25.9 [24.1–32.4] | 34.3 [33.0–35.3] (8/9) | 30.9 [29.9–37.7] |
| au hasard | 35.6 [31.4–40.0] (6/9) | 26.1 [22.6–28.8] | 35.6 [31.4–40.0] (6/9) | 34.2 [28.1–34.6] |

## Si le joueur cherche aussi les recettes hors objectif (achat : Mains calleuses)

Par défaut le joueur simulé ne suit que le guide et n’utilise que les recettes qu’il connaît. Ici, au cycle 2, il cherche en plus les extracteurs et outils qui l’intéressent, avec au plus 10 essais par recette, puis abandonne.

| Hypothèse | Plaine (depuis le début) | Rivière (depuis le début) | Réflexion cycle 2 (min) | Essais cycle 2 | Extracteurs posés |
|---|---:|---:|---:|---:|---:|
| énigme résolue d’emblée | 7.7 (sans : 7.5) | 19.5 (sans : 29.1) | 4.0 | 12 | 4 |
| thermomètre et indices | 13.5 [11.4–16.4] (sans : 13.5 [11.4–16.4]) | 40.1 [37.1–47.5] (sans : 38.2 [36.3–44.5]) | 22.3 [19.3–26.3] | 167 [145–197] | 3 [2–3] |
| au hasard | 14.8 [12.4–16.5] (sans : 14.3 [11.2–16.5]) | 40.8 [38.8–48.2] (sans : 39.1 [35.9–40.8]) | 19.2 [17.6–22.3] | 144 [132–167] | 4 [3–10] |

## Où passe le temps du cycle 2 (achat : Mains calleuses, sans chasse)

| Hypothèse | Réflexion (min) | Essais | Extracteurs posés à la fin |
|---|---:|---:|---:|
| énigme résolue d’emblée | 2.3 | 7 | 3 |
| thermomètre et indices | 17.3 [15.1–19.9] | 130 [113–149] | 2 [2–3] |
| au hasard | 12.5 [10.3–13.5] | 94 [77–101] | 3 [2–3] |

## Ce que ce modèle ne sait pas faire

- **Les recettes hors objectif** (extracteurs, outils d’amélioration) : par défaut le joueur simulé n’en cherche aucune ; avec la section ci-dessus, il en cherche à coups d’essais, au cycle 2 seulement. Un vrai joueur les déduit peut-être de l’énigme du Carnet (l’hypothèse « énigme ») ou n’y pense pas. C’est ce qui fait le plus varier la fin du cycle 2 : regarder les deux versions.
- **La récolte** : 4 appuis par seconde (le type « tapeur »). Un vrai joueur peut utiliser la récolte continue : la vitesse manuelle compte donc moins que dans ces chiffres.
- Ni l’Intuition (étude, déchiffrage), ni les secrets, ni les dialogues, ni la lecture : seulement ce qu’on peut mesurer sur le moteur.
- Le hasard du moteur (coups de chance) est fixe ; celui du joueur varie avec la graine.
- Aucun joueur qui s’arrête : tout est en minutes de jeu actif, jusqu’au bout.

## Comment lire

- « — » : la Rivière n’est pas franchie dans la durée simulée ; « (6/9) » : seules 6 graines sur 9 y arrivent.
- Regarder d’abord l’**écart entre les hypothèses** : si les trois donnent à peu près la même durée, la découverte ne fait pas la différence ; sinon, c’est ce qu’il faut observer chez de vrais joueurs.
- Regarder ensuite l’**écart entre les achats** : il dit si le premier choix de Mémoire change vraiment le cycle 2, et ce que coûte de ne rien acheter.
- Pour les seuils de rythme : voir seulement après des essais avec de vrais joueurs ; ce rapport ne fixe aucune cible.

_Mesuré au commit 0f756c8._
