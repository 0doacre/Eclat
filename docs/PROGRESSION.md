# Progression : Passages, Relève et Mémoire des mains

Document de conception de la version 4.5 (phase 1). Il sert de référence au code
(`js/data.js`, `js/engine.js`, `js/ui.js`, `js/usine.js`) et peut être donné tel quel
à un assistant (Sonnet, Gemini…) pour une tâche précise : voir « Tâches à déléguer »
en fin de document.

## Pourquoi

Jusqu’à la 4.4, on ne renaissait (nouveau cycle) qu’après une des trois fins : une fois
toutes les quelques heures, au mieux. Entre deux terres, il suffisait d’un objet (l’épieu
ouvre la Plaine) : aucun mur, aucune raison de revenir en arrière. Un bon incrémental
alterne au contraire des **murs** (la production ne suit plus) et des **renaissances**
fréquentes qui rendent la partie suivante plus rapide (méta-progression).

L’histoire s’y prête : les Semeurs s’éveillent l’un après l’autre, « ce qui est appris
par la main ne se perd pas ».

## 1. Les Passages (paliers entre les terres)

- Chaque terre, sauf la Lisière et le Caveau (secret), a un **passage**
  (`D.PASSAGES[zone]`) : un coût en matières, un petit texte, et des **Traces** (`tr`)
  qu’il rapporte une fois franchi.
- L’objet qui ouvrait la terre (épieu, outre, pioche…) **rend le passage possible** ;
  la terre ne s’ouvre que quand le passage est **payé en entier**.
- On paie en **versant** depuis la Réserve (bouton « Verser ») : autant qu’on peut de
  chaque matière, en plusieurs fois si besoin. Ce qui est versé est acquis (une
  Réserve limitée en usine avancée n’empêche donc pas de payer un gros passage).
- Le coût est multiplié par 4 à 6 d’une terre à la suivante : c’est le mur.
  L’amélioration « Chemins connus » le réduit.
- Les objectifs comptent une étape « Ouvrir le passage vers … » après chaque objet qui
  ouvre une terre. Le guidage (prochaine étape) conduit au passage quand l’objet est
  fait.
- Sur la carte, la terre suivante est dans la brume ; quand son passage est possible,
  la brume affiche 🚧 et l’avancement. La toucher ouvre la fiche du passage.

État dans la sauvegarde : `S.pass[zone] = { paid: { matière: n }, done: bool, free?: bool }`
(remis à zéro à chaque relève). `free` : ouvert par un bonus, ne rapporte pas de Traces.

## 2. La Relève (renaissance)

- Possible dès qu’**un passage** a été franchi pendant la partie (ou qu’une fin a été
  atteinte). Elle remplace l’ancien « nouveau cycle » : c’est la même chose.
- **Repart de zéro** : stocks, machines, extracteurs, carte, âges, terres, passages,
  objectifs, file des mains.
- **Gardé** : le Carnet (recettes connues, souvenirs, matières étudiées et vues), les
  fragments, les secrets, les fins et leurs Échos, la Mémoire des mains et ses Traces,
  les réglages, les épingles, le tutoriel déjà vu.
- **Gagné** : la somme des Traces des passages franchis pendant la partie
  (2, 3, 5, 8, 12, 18, 27, 40, 60, 90 d’une terre à l’autre). Plus on va loin, plus on
  gagne ; mais revenir souvent est payant au début.
- Les Échos des fins (+50 % de récolte et de production chacun) restent la couche
  profonde, au-dessus.
- Une copie de sécurité est faite avant chaque relève.

## 3. La Mémoire des mains (méta-progression)

Améliorations permanentes achetées avec les Traces (`D.MEMOIRE`), gardées d’une relève
à l’autre (`S.meta.mem = { id: niveau }`, `S.meta.traces` : Traces à dépenser,
`S.meta.tracesTotal` : gagnées en tout).

| id | Nom | Effet par niveau | Niveaux | Coûts |
|---|---|---|---|---|
| recolte | Mains calleuses | récolte à la main ×(1 + niveau) | 5 | 2, 4, 8, 16, 32 |
| mains | Gestes sûrs | fabrication à la main ×0,8 de durée | 5 | 2, 4, 7, 12, 20 |
| extr | Mémoire des gisements | extracteurs +50 % | 8 | 3, 5, 8, 13, 21, 34, 55, 89 |
| mach | Rouages huilés | machines +25 % | 8 | 5, 8, 13, 21, 34, 55, 89, 144 |
| chemins | Chemins connus | passages −10 % | 5 | 4, 8, 16, 32, 64 |
| paquetage | Le paquetage | départ avec des matières, puis des cabanes | 3 | 2, 6, 15 |
| raccourci | Raccourci | départ avec la Plaine (puis la Rivière) déjà ouverte | 2 | 6, 15 |
| veille | Longues nuits | +6 h de temps hors ligne compté (12 h au départ) | 2 | 4, 10 |

## 4. Rythme visé

- Première partie : mur vers la Rivière ou les Collines, vers 25–35 minutes de jeu
  actif. Première relève conseillée là.
- Chaque relève va un ou deux terres plus loin ; les premières terres se retraversent
  en quelques minutes.
- Les chiffres (coûts des passages, Traces, effets) se règlent avec le simulateur
  `tools/sim.js`, pas à l’intuition.

## 5. Parties existantes

- Une sauvegarde sans `pass` : chaque terre déjà ouverte compte comme passage franchi
  (et ses Traces seront gagnées à la première relève). Rien ne se ferme.
- `meta.traces`, `meta.mem` absents : créés à 0 / vides.
- Le format de sauvegarde ne change pas de version (champs ajoutés avec des valeurs
  par défaut).

## 6. Interface

- **Carte** : brume 🚧 + avancement ; fiche du passage (coût, déjà versé, Verser).
- **Objectif** : étape « 🚧 Ouvrir le passage vers … » avec Verser.
- **En-tête** : pastille ✦ (Traces) dès qu’une relève est possible ou que des Traces
  sont disponibles ; elle ouvre la Mémoire des mains.
- **Mémoire des mains** (fenêtre) : ce que rapporterait une relève maintenant, ce qu’on
  garde et ce qu’on perd, bouton « Passer le relais » (avec confirmation), puis l’arbre
  des améliorations.
- Journal → Fins renvoie vers la Mémoire.

## Tâches à déléguer

Chaque tâche ci-dessous peut être confiée à un assistant avec ce document et le dépôt.
Règles communes : ne jamais casser une sauvegarde existante ; textes en français,
simples, sans jargon ; lancer `node tools/test.js` avant de rendre le travail ; livrer sur une
branche GitHub poussée, jamais dans un dossier à part (consigne de livraison dans
`docs/prompts/README.md`).

1. **Textes des passages** : pour chaque terre de `D.PASSAGES`, une phrase d’ambiance
   (« Les hautes herbes cachent un gué… ») et un nom de passage. Ton : celui de
   `D.FRAGS` et des énigmes de `D.ITEMS`.
2. **Simulateur** (`tools/sim.js`) : un joueur automatique qui joue le moteur sans écran
   (voir l’en-tête du fichier une fois écrit) et donne le temps jusqu’à chaque passage,
   avec ou sans améliorations de la Mémoire.
3. **Phrases d’échec** pour les âges 2 et 3 (`D.FAIL_ONE`) : mêmes règles que celles de
   l’âge du Bois (une vraie recette ne doit jamais avoir de phrase d’échec ; un test le
   vérifie).
