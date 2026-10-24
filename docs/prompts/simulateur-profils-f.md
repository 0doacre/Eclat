# Prompt : le simulateur joue plusieurs types de joueurs (lot F, sans changement de version)

Tu travailles sur **Éclat**, un jeu incrémental de craft en français, pour mobile (PWA, JavaScript
sans framework ni dépendance). Dépôt GitHub : `0doacre/craftgame`. Pars de `main` à jour.

Lis d'abord : `docs/PROGRESSION.md` (sections 3 et 4, les dons, le rythme visé), `docs/AUDIT-INSPIRATIONS.md`,
et **en entier** `tools/sim-passages.js`, en commençant par son long commentaire d'en-tête : il décrit déjà le
joueur simulé, ses options (`--minutes`, `--mem`, `--offline`, `--compare`, `--reflexion`, `--carnet`,
`--taps`, `--retour`, `--journal`, `--cout`, `--don`, `--dons`, `--cycles`, `--fouilles`) et exporte
`{ play, lire, PROFILS }`. Regarde aussi `tools/sim.js` (l'ancien bot, partie complète jusqu'à une fin).

## Le contexte

Les prochains lots (les Vœux, l'Offrande, de nouvelles règles de terres, un aléa de terre par cycle)
« se règlent au simulateur ». Or `tools/sim-passages.js` ne sait jouer qu'**un seul type de joueur**, qui
joue sans interruption (« la minute des tableaux est du jeu actif »), avec une seule absence possible : `--offline H`,
**après chaque passage franchi**. Un vrai joueur de téléphone fait autre chose : des séances courtes, des
absences de plusieurs heures, ou presque aucune activité. Éclat est conçu pour cela (production hors ligne
jusqu'à 12 h, extracteurs, file des mains, fouilles). Il faut un simulateur qui **compare plusieurs façons de
jouer**, pour savoir si un changement aide ou pénalise les unes plus que les autres.

Pour comparaison : Cell to Singularity embarque un simulateur d'équilibrage qui joue avec des profils, une
durée en ligne maximale (4 h), une durée hors ligne (4 h), un mode d'achat optimal ou « le moins cher ». Ce
lot en reprend l'idée, pas le code.

## Ce qu'il faut faire

### 1. Des séances : jouer, s'absenter, revenir

Dans `play(o)` (et son option `lire`), ajoute un **rythme de séances** : `o.sessions = { actif, absent }` (minutes
de jeu actif, puis heures d'absence, répétées). Option : `--sessions 5/4` (5 minutes de jeu, puis 4 heures
d'absence, et ainsi de suite).

- L'absence se joue comme celle de `--offline` : le temps virtuel avance (`T += absent h`), `absent` (le
  temps d'absence cumulé, déjà tenu) augmente, puis `E.update()` fait rattraper le moteur (`E.catchUp`).
  Réutilise ce mécanisme, ne le réécris pas.
- Avec `--fouilles`, le joueur lance la meilleure fouille qui tient dans l'absence avant de partir et la
  récolte au retour (le code existe : `lancerFouille`, `E.fouilleRecolter`). Garde cela tel quel.
- `--sessions` et `--offline` : si les deux sont donnés, `--sessions` l'emporte (et `--offline` ne joue plus
  après chaque passage) ; dis-le dans l'en-tête du fichier.
- Le compteur de **minutes de jeu actif** (`minutes()`, `cyc()`) reste celui d'aujourd'hui : il ne compte pas
  l'absence. Ajoute à chaque ligne de résultat, pour chaque passage, **deux temps** : le temps **actif** et le
  temps **écoulé** (actif + absences, à l'horloge).

### 2. Des profils de joueur

Une table `JOUEURS` (n'écrase pas `PROFILS`, qui désigne les niveaux de Mémoire de `--compare`) :

| Nom | Appuis par seconde | Réflexion (s par recette neuve) | Retour sur investissement (s) | Séances | Fouilles |
|---|---:|---:|---:|---|---|
| `tapeur` | 4 | 20 | 120 | aucune (joue sans interruption) | non |
| `veilleur` | 3 | 20 | 120 | 5 min / 4 h | non |
| `explorateur` | 2 | 45 | 180 | 20 min / 8 h | oui |
| `paresseux` | 1 | 20 | 300 | 3 min / 12 h | oui |

Ces valeurs sont **un point de départ**, à régler avec l'auteur : mets-les dans une table lisible en tête du
fichier, commentée (« qui est ce joueur »), et fais en sorte qu'on puisse en changer une sans toucher au
reste. Rien de « magique » dans le code.

Options : `--joueur nom` (un profil), `--joueurs` (les quatre côte à côte, comme `--compare` le fait pour la
Mémoire). Les options individuelles (`--taps`, `--reflexion`, `--retour`, `--sessions`, `--fouilles`) l'emportent
sur le profil, pour pouvoir explorer.

### 3. La sortie

`--joueurs` affiche un tableau comparable : une ligne par passage (Plaine, Rivière, Collines…), et par
profil le temps **actif** et le temps **écoulé** (format `h:mm`), plus les Traces cumulées ; en bas, le bilan de
chaque profil (nombre d'appuis, de fabrications, minutes de réflexion, absences, extracteurs, terre atteinte).
`--json` donne la même chose lisible par un autre programme (`{ joueurs: { tapeur: {...}, ... } }`).

Sous le tableau, une section « Écarts » **calculée** : pour chaque profil et chaque passage, le rapport du
temps actif et du temps écoulé au `tapeur`. **N'affiche aucun jugement** (« trop lent ») et ne fixe pas de
seuil : c'est l'auteur qui décidera de ce qui est acceptable. Signale seulement les cas où un profil **ne
franchit pas** un passage dans la durée simulée.

### 4. Les cycles

Les profils fonctionnent avec `--cycles N` : à chaque relève, la séance repart de zéro (nouveau cycle) ; le
temps écoulé des cycles s'additionne. Les achats de Mémoire automatiques (`ACHATS`) restent ceux d'aujourd'hui.

### 5. Tests et outils

- **Non-régression** : avant de modifier quoi que ce soit, lance sur `main` `node tools/sim-passages.js` avec
  ses options par défaut, puis `--compare` et `--minutes 30 --journal`, et copie les nombres de chaque
  passage (minute, Traces) dans le test. Après tes modifications, **ils doivent être identiques** : sans
  `--sessions`, `--joueur` ni `--joueurs`, le comportement actuel ne change pas d'un chiffre (le moteur est
  déterministe : `rand: () => 0.5`).
- `tools/test-sim.js` (rapide : **30 secondes au plus**, simule 30 minutes de jeu actif) : le profil `tapeur`
  d'une part, `veilleur` d'autre part ; vérifie que (a) deux exécutions donnent exactement les mêmes nombres ;
  (b) pour `veilleur`, le temps absent cumulé vaut `⌊minutes actives / 5⌋` séances × 4 h, à la précision du
  pas de 100 ms ; (c) le temps écoulé d'un passage est égal au temps actif plus l'absence cumulée avant lui ;
  (d) `--sessions` l'emporte sur `--offline` ; (e) les valeurs de `JOUEURS` sont toutes valides
  (nombres positifs, séances bien formées). Ajoute `node tools/test-sim.js` à la chaîne `npm test` dans
  `package.json`, après `node tools/test.js`, et un script `"sim:joueurs": "node tools/sim-passages.js --joueurs"`.
- **Ne modifie pas** `js/` (le moteur), `css/`, `index.html`, `sw.js`, `D.VERSION`, `D.CHANGES`, `D.PASSAGES`,
  ni aucun chiffre d'équilibrage : ce lot est de l'outillage. `node tools/build.js --check` doit rester vert
  sans relancer `build`.
- Mets à jour la section « Développement » de `README.md` (liste des commandes) avec `--joueurs`,
  `--joueur` et `--sessions`, en une ou deux lignes chacune, et la section 4 « Rythme visé » de
  `docs/PROGRESSION.md` d'un renvoi vers cette commande (une phrase).

## Règles

- Les textes du programme et des documents sont en français, au tutoiement dans les messages, sans anglicisme
  inutile, **sans tiret cadratin** (`docs/STYLE.md`). Pas de dépendance npm nouvelle.
- Le moteur n'est jamais modifié ; le joueur simulé reste « simple, réaliste, pas optimal » : ne le rends pas
  plus malin pour améliorer ses temps. Si un profil bute sur une limite du joueur simulé (par exemple il ne
  sait pas utiliser une machine), **écris-le** dans ton compte rendu au lieu de contourner.
- N'invente aucun secret et n'écris aucun contenu du récit : les noms de passages viennent de `D.PASSAGES`.

## Vérifications obligatoires

- `npm test` en entier (avec le nouveau test), `node tools/sim-passages.js --joueurs --minutes 60`,
  `node tools/sim-passages.js --joueur veilleur --minutes 30 --journal`, `--joueurs --cycles 2 --minutes 30`.
- Dans le compte rendu : le tableau de `--joueurs --minutes 120` (copié tel quel), la liste des passages que
  chaque profil franchit, et trois remarques sur ce que ces chiffres disent (sans recommandation d'équilibrage).
- Le moteur n'a pas changé : `git diff --stat main...f-simulateur-profils` ne montre que `tools/`, `README.md`,
  `docs/PROGRESSION.md` et `package.json`.
- Comme les tests ne chargent que le moteur et les outils, ouvre quand même le jeu dans un navigateur pour
  vérifier qu'il se charge (voir la consigne de livraison).

## Livraison

> **Livraison.** Travaille dans un clone du dépôt GitHub `0doacre/craftgame`, à jour
> (`git pull` sur `main` avant de commencer), jamais dans une copie ou un dossier temporaire.
> Crée une nouvelle branche au nom de la tâche : `f-simulateur-profils`.
> Quand `npm test` passe en entier, **ouvre le jeu dans un vrai navigateur** avant de livrer :
> `npx http-server -p 8765 -c-1 .` à la racine du dépôt, puis `http://localhost:8765/` (au
> besoin avec Playwright). Le jeu doit se charger, la console ne doit montrer aucune erreur. Les tests ne
> chargent que le moteur : si tu ne peux pas ouvrir de navigateur, dis-le clairement dans ton compte rendu
> au lieu de livrer comme si c'était vérifié.
> Fais ensuite un commit qui dit ce que tu as changé, puis pousse la branche sur GitHub :
> `git push -u origin f-simulateur-profils`. Ne touche pas à `main`, ne fusionne rien : la branche sera
> relue avant d'être intégrée. Termine en donnant le nom de la branche, la sortie de `npm test`, ce que tu
> as vérifié dans le navigateur, et ce que tu n'as pas pu faire.
>
> **Secrets.** L'auteur joue à l'aveugle : n'écris jamais une solution de secret, une combinaison de
> recette secrète, un code ou un air dans ton compte rendu, tes messages de commit ou `D.CHANGES`. Écris
> « une recette secrète », « un lieu caché », pas leur contenu. N'ouvre pas `docs/coffre/` ni
> `js/recit.js`.

Termine par `git log --oneline -3`, `git diff --stat main...f-simulateur-profils`, la sortie de `npm test`,
le tableau `--joueurs --minutes 120`, et ce que tu n'as pas pu faire.
