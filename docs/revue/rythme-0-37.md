# Rythme de la 0.37.0, mesuré au simulateur

Mesuré le 30 octobre 2026 sur `origin/main` (0.37.0, commit `4a3dfa8`), avec `tools/sim.js`, `tools/sim-passages.js --joueurs`, `--compare` et `--parcours`. Les nombres viennent de bots, pas de joueurs : ils donnent des ordres de grandeur et des écarts, jamais un avis sur le plaisir. Aucun fichier du jeu n'a été modifié. Conventions de `docs/STYLE.md`.

## 1. La partie complète (bot idéal, 3 appuis/s)

`node tools/sim.js 3 dyson` : fin « L'Aube Éternelle » en **1 h 18 min 09 s**. Le bot connaît toutes les recettes d'avance et ne lit rien : c'est une borne basse.

| Âge | Entrée | Temps dans l'âge | Part du total |
|---|---:|---:|---:|
| Bois | 0:00 | 1:03 | 1 % |
| Os | 1:03 | 1:05 | 1 % |
| Pierre | 2:08 | 1:59 | 3 % |
| Cuivre | 4:07 | 1:36 | 2 % |
| Bronze | 5:43 | 2:12 | 3 % |
| Fer | 7:55 | 3:18 | 4 % |
| Acier | 11:13 | **1:12** | 2 % |
| Vapeur | 12:25 | **11:17** | 14 % |
| Électricité | 23:42 | 1:34 | 2 % |
| Atome | 25:16 | **1:11** | 2 % |
| Silicium | 26:27 | **0:31** | 1 % |
| Polymères | 26:58 | 3:31 | 5 % |
| Composites | 30:29 | 4:59 | 6 % |
| Spatial | 35:28 | **11:15** | 14 % |
| Stellaire | 46:43 | **31:26** | 40 % |

Lecture :

- **Quatre âges se passent en moins d'une minute et demie sans enjeu** pour le bot : Acier, Atome, Silicium (et, à la limite, Électricité). Ce n'est pas un défaut en soi (l'âge peut être riche pour un joueur qui découvre), mais c'est un point à observer chez les testeurs : ces âges risquent de ne pas laisser de souvenir.
- **Trois âges font 69 % du temps** : Vapeur (11 min), Spatial (11 min) et Stellaire (31 min). Le dernier âge pèse à lui seul 40 % de la partie du bot.
- **Le dernier âge est le plus long et le moins surprenant** : le bot y fabrique ; il ne reste plus de mécanique à découvrir. Hypothèse **[H]** : c'est le moment où un joueur humain décroche ; à confirmer en test.
- Le README annonce encore « 1 h 15 » ; la mesure actuelle est 1 h 18 (`docs/PLAN-ALPHA.md` dit aussi 1 h 18).

## 2. Les passages, selon le type de joueur

`node tools/sim-passages.js --joueurs` (120 min de jeu actif, sans Mémoire des mains). Le « tapeur » joue sans arrêt ; le « veilleur » joue des séances de 5 min et s'absente 4 h ; l'« explorateur » joue 20 min, s'absente 8 h et lance des fouilles ; le « paresseux » joue 3 min et s'absente 12 h.

| Passage (Traces) | tapeur, actif | veilleur, écoulé | explorateur, écoulé | paresseux, écoulé |
|---|---:|---:|---:|---:|
| Plaine (+2) | 5,8 min | 4 h 05 | 10 min | 24 h |
| Rivière (+3) | 17,5 min | 8 h 11 | 8 h 21 | 36 h |
| Collines (+5) | 33,9 min | 24 h 32 | 16 h 40 | 144 h (6 jours) |
| Mine (+8) | 60,5 min | 40 h 51 | 25 h | 205 h (8,5 jours) |
| Désert (+12) | 76,0 min | 45 h | 25 h | 217 h (9 jours) |
| Gisement (+18) | mur à 120 min | 94 h | mur | mur |

Lecture :

- **Le temps actif est comparable d'un profil à l'autre** (aux alentours de ×0,6 à ×1,8 du tapeur) : la production hors ligne remplit son rôle, un joueur qui joue peu a besoin d'à peu près le même temps *joué* qu'un joueur assidu.
- **Le temps écoulé, lui, diffère de 1 à 250** (Plaine : 6 min pour le tapeur, 24 h pour le paresseux). Ce que vit le joueur occasionnel est donc « un passage par jour ou par semaine ». C'est le rythme du jeu pour lui, et c'est défendable, mais il faut que le jeu lui **dise** ce qui se passe pendant son absence (c'est le rôle du bilan de retour).
- Le **paresseux atteint le Silicium en 470 h écoulées (≈ 20 jours)** pour 120 min jouées. Jamais testé auprès d'un humain.
- Le rapport « actif du veilleur / tapeur » sur la Rivière (×0,60) est plus bas que celui des autres passages : le veilleur profite plus des extracteurs que des mains. À regarder avant de dire qu'un profil est avantagé.
- **Aucun profil ne franchit le Gisement avant 115 min (veilleur)** : au-delà, le mur est « centrale de fission » (âge de l'Atome) ou « Les Montagnes ».

## 3. Le poids de la Mémoire des mains

`--compare` (le même joueur, quatre niveaux de Mémoire) : minute du passage.

| Passage | aucune | récolte 1 | r2 e2 m2 | r3 e4 m3 p2 rac1 |
|---|---:|---:|---:|---:|
| Plaine | 5,8 | 1,5 | 0,8 | offert |
| Rivière | 17,5 | 15,5 | 6,7 | 4,4 |
| Collines | 33,9 | 25,6 | 13,1 | 9,2 |
| Mine | 60,5 | 46,4 | 26,3 | 19,0 |
| Désert | 76,0 | 55,8 | 34,4 | 26,0 |
| Gisement | mur | mur | 84,1 | 64,5 |
| Montagnes | mur | mur | 111,0 | 83,8 |

Chaque relève fait gagner environ une terre ; avec une Mémoire élevée, les passages tombent à 15 à 60 % de leur durée de départ. Les Traces gagnées passent de 30 à 75. Le mur à 120 min est « La Tranchée » (sans Mémoire), puis « La Rampe » (orbite) avec la Mémoire.

## 4. Le premier parcours réel (découverte, pas de recette connue)

`--parcours` : partie neuve, aucune recette connue, le bot **découvre** par essais (thermomètre, souvenirs), relève obligatoire du cycle 1 prise automatiquement.

| Passage | Minute | Durée | dont réflexion | Âge |
|---|---:|---:|---:|---|
| Le Sentier des Herbes (Plaine) | 1,1 | 1,1 | 0,0 | Bois |
| La Passerelle (Rivière) | 25,0 | 23,9 | 8,8 | Os |
| Les Marches (Collines) | 62,4 | 37,5 | 12,0 | Pierre |

Lecture :

- **Le premier passage est quasi instantané (1,1 min), le deuxième demande 24 min** (dont près de 9 min de réflexion). C'est le « palier long » que `docs/AUDIT-UX-CASUAL-2026-10-24.md` suspectait ; il est maintenant mesuré. La Plaine ouvre le jeu, la Rivière le ferme pour une vingtaine de minutes : c'est le premier mur, et c'est là qu'un joueur novice s'arrêtera ou non.
- Après 120 min, le bot est bloqué sur « Faire tourner ton automate » (le simulateur ignore les machines : ce n'est **pas** un mur réel mais une limite du bot).
- **Stocks énormes à 120 min** (bois 75 000, fibres 45 000, pierre 45 000) contre des passages à quelques milliers : la récolte à la main du bot dépasse largement les besoins de ces âges. À confirmer avec un humain : un joueur aurait-il aussi trop de matières brutes en attente ?

## 5. Ce que je recommande de regarder en test (pas de changement d'équilibrage sans lui)

1. **La Rivière** : voir si le joueur novice tient les 20 à 25 minutes entre la Plaine et la Rivière, et ce qu'il fait pendant ce temps.
2. **Les âges très courts** (Acier, Atome, Silicium) : demander au testeur ce qu'il en retient.
3. **Le dernier âge** (40 % du temps du bot) : si un testeur l'atteint, noter ce qu'il fait et ce qu'il dit.
4. **L'absence** : un joueur qui revient après quelques heures comprend-il ce qui s'est produit ?
5. **L'excédent de matières brutes** : le joueur réel finit-il par ne plus récolter ?

## Reproduire

```sh
node tools/sim.js 3 dyson
node tools/sim-passages.js --joueurs
node tools/sim-passages.js --compare
node tools/sim-passages.js --parcours
```
