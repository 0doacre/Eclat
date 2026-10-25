# Le premier parcours d’un nouveau joueur : mesures

Simulation sur le moteur réel (`node tools/sim-parcours.js --ecrire`), sans écran. **Ce sont des durées de jeu actif, en minutes**, pour un joueur de type « tapeur » (4 appuis par seconde). Elles comparent des hypothèses ; elles ne remplacent pas l’observation de vrais joueurs.

Version du jeu : 0.15.9 · 40 min de cycle 2 · 8 s par essai · 9 graines de hasard par case (médiane, puis [min–max]).

## Ce qui est simulé

1. Partie neuve : aucune recette connue d’avance. Le joueur voit chaque matière, puis **découvre** la recette de l’étape en cours par des essais sur le moteur réel (thermomètre, et souvenirs du guide qui donnent l’action, une matière, puis la recette).
2. La relève obligatoire du cycle 1 est prise dès qu’elle se déclenche (première cabane posée et première exploration faite) : +3 Traces.
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
| énigme résolue d’emblée | 2.3 | 5 | 1.7 | 5 |
| thermomètre et indices | 4.3 [2.9–6.1] | 28 [18–41] | 3.7 [2.4–5.5] | 5 [4–8] |
| au hasard | 4.9 [3.8–7.5] | 32 [24–52] | 4.3 [3.2–6.9] | 5 [4–6] |

Le cycle 1 ne dépend pas de l’achat : c’est avant la relève.

## La Plaine

**Depuis le début de la partie (cycle 1 + cycle 2), en minutes**

| Hypothèse | aucun achat | Mains calleuses | Mains sûres | Mém. des gisements |
|---|---:|---:|---:|---:|
| énigme résolue d’emblée | 5.4 | 4.1 | 5.4 | 5.1 |
| thermomètre et indices | 8.2 [7.4–10.2] | 7.5 [6.6–9.4] | 8.2 [7.4–10.1] | 8.0 [7.1–10.1] |
| au hasard | 9.4 [8.1–10.4] | 8.3 [7.0–10.6] | 9.4 [8.1–10.4] | 9.0 [7.8–10.3] |

**Le cycle 2 seul (depuis la relève), en minutes**

| Hypothèse | aucun achat | Mains calleuses | Mains sûres | Mém. des gisements |
|---|---:|---:|---:|---:|
| énigme résolue d’emblée | 3.1 | 1.9 | 3.1 | 2.9 |
| thermomètre et indices | 4.0 [1.8–6.0] | 3.7 [1.5–5.3] | 4.0 [1.8–6.0] | 3.8 [1.7–6.0] |
| au hasard | 4.3 [2.1–5.0] | 3.2 [2.6–4.0] | 4.3 [2.1–5.0] | 4.0 [2.1–4.7] |

## La Rivière

**Depuis le début de la partie (cycle 1 + cycle 2), en minutes**

| Hypothèse | aucun achat | Mains calleuses | Mains sûres | Mém. des gisements |
|---|---:|---:|---:|---:|
| énigme résolue d’emblée | 38.5 | 25.8 | 38.5 | 33.3 |
| thermomètre et indices | 41.3 [40.1–43.8] (6/9) | 32.0 [28.7–35.2] | 41.3 [40.1–43.8] (6/9) | 39.0 [36.6–42.9] |
| au hasard | 38.7 [38.2–41.7] (3/9) | 33.5 [32.3–35.0] | 38.7 [38.2–41.7] (3/9) | 39.5 [34.9–41.0] |

**Le cycle 2 seul (depuis la relève), en minutes**

| Hypothèse | aucun achat | Mains calleuses | Mains sûres | Mém. des gisements |
|---|---:|---:|---:|---:|
| énigme résolue d’emblée | 36.2 | 23.5 | 36.2 | 31.0 |
| thermomètre et indices | 36.7 [34.1–39.1] (6/9) | 28.5 [23.9–31.0] | 36.7 [34.1–39.1] (6/9) | 36.1 [30.5–39.9] |
| au hasard | 31.6 [31.2–34.6] (3/9) | 29.3 [25.0–30.3] | 31.6 [31.2–34.6] (3/9) | 35.5 [27.9–36.3] |

## Si le joueur cherche aussi les recettes hors objectif (achat : Mains calleuses)

Par défaut le joueur simulé ne suit que le guide et n’utilise que les recettes qu’il connaît. Ici, au cycle 2, il cherche en plus les extracteurs et outils qui l’intéressent, avec au plus 10 essais par recette, puis abandonne.

| Hypothèse | Plaine (depuis le début) | Rivière (depuis le début) | Réflexion cycle 2 (min) | Essais cycle 2 | Extracteurs posés |
|---|---:|---:|---:|---:|---:|
| énigme résolue d’emblée | 4.3 (sans : 4.1) | 16.2 (sans : 25.8) | 4.3 | 13 | 4 |
| thermomètre et indices | 7.9 [6.6–9.4] (sans : 7.5 [6.6–9.4]) | 33.7 [30.4–38.0] (sans : 32.0 [28.7–35.2]) | 24.3 [19.6–26.8] | 182 [147–201] | 3 [2–7] |
| au hasard | 9.2 [8.2–10.6] (sans : 8.3 [7.0–10.6]) | 35.2 [33.8–37.5] (sans : 33.5 [32.3–35.0]) | 21.2 [17.9–23.3] | 159 [134–175] | 4 [3–4] |

## Où passe le temps du cycle 2 (achat : Mains calleuses, sans chasse)

| Hypothèse | Réflexion (min) | Essais | Extracteurs posés à la fin |
|---|---:|---:|---:|
| énigme résolue d’emblée | 2.7 | 8 | 3 |
| thermomètre et indices | 18.0 [14.9–21.1] | 135 [112–158] | 2 [2–3] |
| au hasard | 14.4 [13.2–17.5] | 108 [99–131] | 3 [2–3] |

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

_Mesuré au commit 5ec2fd2._
