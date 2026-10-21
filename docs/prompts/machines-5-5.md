# Prompt : les machines à paliers et leur onglet (version 5.5.0)

Tu travailles sur **Éclat**, un jeu incrémental de craft en français, pour mobile (PWA,
JavaScript sans framework ni dépendance). Dépôt GitHub : `0doacre/craftgame`.

Lis d’abord : `docs/LEXIQUE.md` (les mots à employer), `README.md` (organisation des
fichiers, section « Le Domaine »), puis dans `js/engine.js` la partie « machines » (cherche
`E.domMachAdd`, `E.domMachSet`, `runMachine`, `E.automatable`, `E.machInfo`) et dans
`js/domaine.js` les fonctions `machinesHTML`, `machLine`, `machSheet`, `newChain`.

## Le problème

1. Une machine peut faire n’importe quelle recette : un automate de bois fabrique une fusée.
   Les cinq machines ne diffèrent que par leur vitesse.
2. Les machines sont rangées dans le Domaine, et leur réglage passe par une fiche qu’on
   ouvre en touchant une ligne sans bouton. C’est illisible.

## Ce qu’il faut faire

### 1. Les paliers (`js/data.js`)

Chaque machine reçoit deux nombres : `ing`, le nombre d’ingrédients **différents** au plus
dans la recette, et `prof`, le nombre de niveaux de pièces qu’elle sait fabriquer
elle-même.

| Machine (`id`) | `ing` | `prof` | Ce que ça veut dire |
|---|---|---|---|
| `automate_bois` | 1 | 0 | recettes à 1 ingrédient (manche, corde, plaques…) |
| `automate_bronze` | 2 | 0 | jusqu’à 2 ingrédients |
| `presse_vapeur` | 3 | 0 | jusqu’à 3 ingrédients |
| `chaine` (Ligne d’assemblage) | 3 | 1 | fabrique aussi les pièces qui manquent, 1 niveau |
| `assembleur` | 3 | 2 | 2 niveaux de pièces |

La vitesse (`spd`) ne change pas.

### 2. Moteur (`js/engine.js`, sans aucun accès au DOM)

- `E.machCan(m, r)` : vrai si la recette `r` a au plus `ing` ingrédients différents.
- `E.machFor(r)` : la machine du plus petit palier qui sait faire `r` (pour les messages).
- **Profondeur.** Quand une machine de `prof ≥ 1` manque d’un ingrédient dans la Réserve,
  elle le fabrique elle-même à partir des ingrédients de **sa** recette. Cette sous-recette
  doit elle aussi respecter `ing`, être connue (`S.known`) et confiable à une machine
  (`E.automatable`). Elle descend au plus de `prof` niveaux. **Chaque sous-fabrication
  consomme une fabrication du débit de la machine** : une ligne qui fait un moteur et ses
  deux bobines y passe le temps de trois fabrications. Les pièces faites ainsi ne vont pas
  dans la Réserve, elles servent directement.
- `runMachine` : si `!E.machCan(e.m, e.r)`, la machine s’arrête avec un nouvel état
  `"tier"` (la recette reste choisie, rien n’est perdu ; ce qui était déjà pris dans la
  Réserve y reste mis de côté comme aujourd’hui).
- `E.domMachAdd(r, m)` : sans `m` donné, prend la machine **au repos la plus rapide qui
  sait faire `r`**. S’il n’y en a pas : `{ ok: false, why: "tier", need: E.machFor(r) }`.
- `E.domMachSet` : un changement de sorte de machine (`patch.m`) vers une machine qui ne
  sait pas faire la recette est refusé.
- **Sauvegardes : pas de changement de format ni de `SAVE_VERSION`.** Une partie en cours
  dont un groupe dépasse son palier le voit simplement à l’arrêt (`"tier"`), avec sa
  recette.
- Le simulateur `tools/sim.js` utilise `E.domMachAdd("manche", "automate_bois")` : il doit
  continuer à marcher (le manche n’a qu’un ingrédient).

### 3. Interface

- **Un troisième onglet dans l’Atelier : « Machines »**, après « Carnet ». `subTabs()` dans
  `js/ui.js` ne gère que deux pages : étends-la à trois. Ajoute `machines: "atelier"` à
  `PARENT` et le cas à `tabAvailable()` (l’onglet apparaît dès qu’on possède une machine).
  Le code de l’écran va dans `js/domaine.js` (déplace `machinesHTML` et ce qui va avec)
  ou dans un nouveau fichier `js/machines.js` (alors ajoute-le à `index.html` **et** à
  `FILES` dans `sw.js`).
- **Chaque groupe de machines est une carte avec tous ses boutons visibles**, sans fiche
  cachée :
  - en titre « 2 automates de bois » et, dessous, son palier en clair :
    « recettes à 1 ingrédient » ;
  - un gros bouton avec l’icône et le nom de la recette, qui ouvre la liste des recettes
    (« Choisir une recette » s’il n’y en a pas) ;
  - la ligne d’état existante (`machLine`), plus le cas `"tier"` : « à l’arrêt : trop
    complexe, il faut : Presse à vapeur » ;
  - **−** et **+** (nombre de machines), **Pause / Reprendre**, **Retirer** ;
  - « S’arrêter quand la Réserve en a » reste, replié sous un petit « Réglages ▾ ».
- **Au repos** : une ligne par sorte de machine au repos, avec un bouton **Mettre au
  travail**. La liste des recettes proposée ne montre que celles que cette machine sait
  faire. Les recettes connues trop complexes apparaissent en bas, grisées, avec « il
  faut : Presse à vapeur ».
- **Le Domaine** ne garde qu’une ligne, à la place de la carte « Machines » :
  « ⚙️ 3 machines au travail · 1 au repos · voir ▸ », qui ouvre l’onglet Machines.
- **Carnet** : dans la fiche d’une recette (`recipeModal` dans `js/ui.js`), une ligne
  « Machine : Automate de bronze ou mieux » (`E.machFor`). Le bouton « 🏭 À une machine »
  reste, et explique le refus s’il n’y a pas de machine assez forte au repos.
- **Fiche d’une machine** (la liste `fxList` dans `js/ui.js`) : « Recettes à 2 ingrédients
  au plus » et, pour `prof ≥ 1`, « Fabrique aussi les pièces qui manquent (1 niveau) ».
- **Tutoriel** (`js/tuto.js`, chapitre `automate`) : il pointe aujourd’hui sur
  `[data-mnew]` dans le Domaine. Fais-le pointer sur le nouvel endroit, et dis en une
  phrase qu’un automate de bois ne fait que des recettes à un ingrédient.
- **Aide** (`openHelp`, « Les mots du jeu », entrée Machine) et `docs/LEXIQUE.md` : ajouter
  la notion de palier en une phrase. `README.md` : mettre à jour la phrase sur les machines.

### 4. Version

- `D.VERSION = "5.5.0"`, `D.CHANGES` remplacé par trois ou quatre phrases courtes.
- Après **chaque** modification de fichier : `node tools/build.js`.

### 5. Tests (`tools/test.js`, même style que les tests existants)

Au minimum :
- `machCan` : l’automate de bois fait un manche, pas un lingot de bronze ; la presse fait
  un moteur à vapeur ;
- `domMachAdd` choisit une machine qui sait faire la recette, et refuse avec `why: "tier"`
  sinon ;
- une partie dont un automate de bois fait une recette à deux ingrédients se charge, et ce
  groupe est à l’arrêt `"tier"` sans rien perdre (recette gardée, matières mises de côté
  toujours comptées) ;
- profondeur : une ligne d’assemblage sur une recette dont une pièce manque dans la
  Réserve la fabrique elle-même, et produit moins vite qu’avec la pièce en réserve ;
- une machine de `prof 0` ne fabrique jamais de pièce manquante (elle s’arrête
  « il manque … »).

`npm test` doit passer en entier.

## Règles

- **Ne jamais perdre une sauvegarde.** Aucun champ existant ne change de sens.
- Ne modifie pas les tests existants pour les faire passer, sauf si un test vérifie
  justement qu’un automate de bois fait une recette à plusieurs ingrédients : adapte
  alors la recette du test, et dis-le dans ton compte rendu.
- Code : même style que le reste (fonctions courtes, `const`, commentaires en français,
  rares et utiles). Pas de dépendance, pas de framework, pas de build.
- Textes affichés : français, tutoiement, simples, mots de `docs/LEXIQUE.md`. Un bouton
  dit ce qu’il fait. Pas de tiret cadratin, pas de phrases d’annonce ni de formules
  creuses.
- Ne touche ni au Comptoir, ni aux passages, ni à la Mémoire des mains.

## Livraison

Travaille dans un clone du dépôt GitHub `0doacre/craftgame`, à jour (`git pull` sur
`main` avant de commencer), jamais dans une copie ou un dossier temporaire. Crée la
branche `gemini-machines-5-5`. Quand `npm test` passe, fais un commit qui dit ce que tu
as changé, puis pousse la branche : `git push -u origin gemini-machines-5-5`. Ne touche
pas à `main`, ne fusionne rien : la branche sera relue avant d’être intégrée. Termine en
donnant le nom de la branche, la sortie de `npm test`, et la liste de ce que tu n’as pas
pu faire.
