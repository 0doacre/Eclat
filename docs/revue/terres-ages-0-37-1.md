# Les terres suivent les âges (0.37.1)

Décision du 30 octobre 2026, prise après le constat « on passe très longtemps dans le Désert et les Collines, on a l'impression de ne plus avancer ». Mesures du simulateur (`tools/sim-passages.js`, joueur « tapeur », sans Mémoire des mains) : des bots, pas des joueurs. Conventions de `docs/STYLE.md`.

## Le constat

Une terre est ouverte par un objet précis, pas par un âge. Le Désert de Verre s'ouvrait avec le chariot (Fer) et le Gisement Noir avec la sonde pétrolière (Silicium) : entre les deux, cinq âges (Fer, Acier, Vapeur, Électricité, Atome), 87 recettes et aucune terre nouvelle. Les Collines tenaient deux âges, avec une attente de passage d'une vingtaine de minutes. En style Carnet, le papier ne change plus avec l'âge : la terre est le seul repère visible de progression.

## Ce qui change

| | Avant | Après |
|---|---|---|
| Clé du Désert | chariot (âge du Fer) | **chemin de fer** (`locomotive`, âge de la Vapeur) |
| Chariot | ouvre le Désert, +25 % d'extracteurs | +25 % d'extracteurs, ne ferme plus rien |
| Clé du Gisement Noir | sonde pétrolière (Silicium) | **sonde pétrolière avancée à l'Électricité** (`a: 8`) |
| Quartz | Désert seulement | **Profondeurs et Désert** (le haut-fourneau en a besoin dès l'Acier) |
| Tamis (quartz) | Désert | Profondeurs et Désert (famille `cristallier`) |
| Uranium, galène | Profondeurs, Collines | **Gisement Noir** (l'Atome et le Silicium s'y jouent) |
| Passage du Désert | 80 000 bois, 1 500 plaques de bronze, 200 roues | **×2** (160 000, 3 000, 400) : il se payait en 3 minutes à la Vapeur |
| Passage des Pics (Col) | 7 500 acier, 1 200 plastique, 180 moteurs | **×0,6** (4 500, 720, 108) : 30 minutes de versement |

Les objectifs et leurs textes suivent (chariot, chemin de fer, sonde, uranium, galène, plomb, poudre de quartz, silicium).

## Mesures

Minutes de jeu actif entre deux passages (tapeur, sans Mémoire) :

| Phase | Avant | Après |
|---|---:|---:|
| Collines | 27 | 27 |
| Profondeurs (Bronze, Fer, Acier) | 16 | **40** |
| Désert (Vapeur, Électricité) | **85** | 47 |
| Gisement Noir (Atome, Silicium) | 46 | 60 |
| Arrivée aux Pics | 207 | 208 |

La courbe passe de 27, 16, 85, 46 à 27, 40, 47, 60 : elle monte régulièrement, et le temps total jusqu'aux Pics ne change pas.

Autres profils, 120 min de jeu actif : le « veilleur » franchit le Gisement Noir à 100 min (115 avant), le « paresseux » à 78 min actif (mur avant) et va jusqu'à l'Orbite. Le jeu passif progresse **plus vite qu'avant** : le passage du Gisement Noir s'ouvre plus tôt, il se paie pendant que les extracteurs travaillent. Le rapport au tapeur se rapproche de l'objectif de 3. À surveiller en test : le paresseux atteint maintenant l'âge des Composites avec 120 min jouées.

## À regarder, à décider

1. **Le Désert a perdu son rôle de quartz.** Il garde quartz et sable, mais l'Acier se fabrique dans les Profondeurs. Il lui faudrait un lieu ou une ressource propres (texte à écrire par toi).
2. **La règle du Gisement Noir** (masque filtrant, âge 12) s'applique maintenant deux âges avant que le masque existe : mains −40 % sur ce gisement pendant l'Atome et le Silicium. Les extracteurs ne sont pas touchés. À avancer, à alléger ou à laisser.
3. **Le récit.** Les explorations du Désert (ville, observatoire, quai) arrivent à la Vapeur au lieu du Fer. Le chemin secret et les fragments passent les tests, mais l'ordre de lecture a changé : à relire par l'auteur (le coffre n'a pas été ouvert).
4. **Les parties en cours** sont conservées (terres ouvertes et passages payés restent). Une partie déjà au Fer avec le Désert ouvert le garde.
5. **Fer et Acier n'ont plus de terre nouvelle** : la Mine en porte trois âges (Bronze, Fer, Acier). Si les testeurs trouvent ce moment plat, le repère d'âge visible en style Carnet (Codex) est la réponse la moins chère.
6. **Les chiffres sont ceux d'un bot** qui n'a pas pris le temps de lire ni de se tromper. Test de joueurs : `docs/TEST-JOUEURS.md`.

## Fichiers touchés

`js/data.js` (zones, clés, familles d'extracteurs, objectifs, textes, passages, version, journal), `tools/test.js`, `tools/test-arbre.js` (empreinte de mise en page recalée), `tools/test-guidage.js`, `tools/test-densite.js`, `tools/test-equilibrage-b.js`, `package.json`, `sw.js` (empreinte). `npm test` passe en entier.
