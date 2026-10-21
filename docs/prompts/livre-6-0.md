# Prompt : le moteur du Livre (version 6.0.0)

Tu travailles sur **Éclat**, un jeu incrémental de craft en français, pour mobile (PWA,
JavaScript sans framework ni dépendance). Dépôt GitHub : `0doacre/craftgame`.

Lis d’abord : `docs/RECIT-PLAN.md` (le chantier dont cette version est la première étape),
`docs/STYLE.md`, `docs/LEXIQUE.md`, `README.md`. Puis dans `js/engine.js` : `finishExp`,
`addFrag`, `E.repair`, `E.buyRes` et le Comptoir, `E.newCycle`, `parseSave` ; dans `js/ui.js` :
`viewJournal` (onglets du Journal), `loreHTML`, la fenêtre de fin d’exploration (cherche
`expdone`) ; dans `js/domaine.js` : la fenêtre du Comptoir (page Acheter).

**N’ouvre pas `docs/coffre/`** : le contenu du récit n’est pas pour toi. Tu construis les
moteurs avec des **données provisoires**, que Claude remplacera par les vraies.

## Ta tâche

Six choses, et seulement elles.

### 1. Un fichier de récit à part : `js/recit.js`

- Il définit `D.RECIT` (voir le format plus bas) et se charge **après** `js/data.js`, dans le
  navigateur (`index.html`, et la liste `FILES` de `sw.js`) **et** dans Node (le moteur, les
  tests et les outils doivent le voir : par exemple `data.js` le charge à la fin quand
  `require` existe, ou `engine.js` le fusionne). Un seul objet `D` partagé.
- `createEngine(opts)` accepte `opts.recit` qui remplace `D.RECIT` (pour les tests).
- Le contenu livré est **provisoire** : 3 pages, 2 fragments, 1 question, des textes du genre
  « Texte provisoire de la page 2 ». Marque le fichier en tête : `/* CONTENU PROVISOIRE */`.

### 2. Les conditions : `E.cond(c)`

Un petit évaluateur réutilisable, qui renvoie vrai ou faux. Une condition est un objet :
`{ frag: id }`, `{ page: id }`, `{ made: id }` (objet fabriqué au moins une fois),
`{ has: id }` (en Réserve), `{ flag: nom }`, `{ secret: id }`, `{ cycle: n }` (cycle ≥ n),
`{ age: n }` (âge ≥ n), `{ exp: "zone:lieu" }` (lieu exploré à ce cycle),
`{ all: [c, …] }`, `{ any: [c, …] }`, `{ not: c }`. Une condition absente vaut vrai. Une clé
inconnue vaut faux (et pas d’erreur). Teste chaque forme.

### 3. Le Livre des Semeurs

**Données** (`D.RECIT.pages`) :

```js
pages: {
  p_exemple: {
    n: 1,                         // numéro affiché, de 1 à 32 ; les cases vides montrent le numéro
    titre: "…",                   // une ligne
    imprime: "…",                 // la partie imprimée : texte du dessin et des signes
    notes: [                      // notes manuscrites dans la marge
      { t: "…", sig: "I", cond: { cycle: 2 } }   // sig : signature courte ; cond : quand elle apparaît
    ],
    src: [ { k: "exp", at: "lisiere:chene" }, { k: "repair", id: "cabane" }, { k: "buy", ecus: 400 } ]
  }
}
```

- **Sources** : une page s’obtient par la première de ses sources atteinte.
  - `exp` : à la fin de l’exploration de ce lieu (`finishExp`) ;
  - `repair` : à la **première** réparation d’une ruine de cette sorte (`E.repair`) ;
  - `buy` : achetable au Comptoir pour ce nombre d’écus. Nouvelle section **« Pages »** dans la
    page Acheter, visible seulement s’il y en a à vendre ; une page achetée sort de la liste ;
  - `cond` : `{ k: "cond", c: {…} }`, vérifiée à chaque pas de temps.
- **État** : `S.livre = { p: { id: 1 }, vu: { id: nombre de notes vues } }`. Les pages trouvées
  **restent à la relève** (comme le Carnet).
- **Moteur** : `E.livre()` renvoie les 32 cases dans l’ordre des numéros, avec pour chacune la
  page (ou rien), ses notes visibles (conditions vraies), et un drapeau « du nouveau » s’il y a
  des notes visibles pas encore vues. `E.givePage(id, src)` (émet `"page"`), `E.readPage(id)`.
- **Écran** : un onglet **« Livre »** dans le Journal, visible dès la première page trouvée.
  Une grille de 32 cases numérotées (vides : juste le numéro, grisé), un point sur les pages
  qui ont du nouveau. Toucher une page ouvre une fenêtre : titre, partie imprimée, puis les
  notes, chacune dans la police à la main (`Caveat`, déjà embarquée, voir `--serif` dans
  `css/theme.css`), avec sa signature alignée à droite.
- À l’obtention d’une page : un message « Une page du Livre : n° N » et le badge du Journal.

### 4. Les fragments : nouveaux, archivés, revisités

- `D.RECIT.frags` : nouveaux fragments, même format que `D.FRAGS`, plus
  `revisit: [ { cond: {…}, t: "…" } ]`. Ils sont **ajoutés** à `D.FRAGS` au chargement.
- `D.RECIT.archive = [ids]` : anciens fragments à ne plus montrer. Ils restent dans `D.FRAGS`
  et dans les sauvegardes (rien ne se perd), mais le Journal ne les liste plus et ils ne
  comptent plus dans « n fragments ».
- `D.RECIT.expFrag = { "zone:lieu": idNouveau }` : remplace le fragment donné par une
  exploration, sans réécrire `D.ZONES` à la main.
- **Revisite** : quand une exploration se termine et que son fragment est déjà connu (souvent
  au cycle suivant), la fenêtre de fin d’exploration montre le premier texte de `revisit` dont
  la condition est vraie, à la place du fragment. S’il n’y en a pas, comme aujourd’hui.
  Retiens ce qui a été vu : `S.revus = { "frag:index": 1 }`.

### 5. L’onglet Questions

**Données** (`D.RECIT.questions`) :

```js
questions: {
  q_exemple: { titre: "…", quand: {…}, aides: ["…", "…", "…"], resolu: {…} }
}
```

- Une question apparaît quand `quand` est vrai, et reste ensuite. Elle est rayée quand
  `resolu` est vrai. État : `S.questions = { id: { lvl: 0 à 3 } }`.
- Trois aides payées en Intuition : prix = `5 × (1 + âge atteint)`, puis ×3, puis ×9
  (réglage `D.RECIT.aide = { base: 5, mult: 3 }`). `E.questions()`, `E.askHelp(id)` →
  `{ ok, why, lvl }`. Une aide achetée reste lisible, même après résolution.
- **Écran** : un onglet **« Questions »** dans le Journal, visible dès la première question.
  Pour chacune : le titre, les aides déjà achetées, un bouton « 💭 Réfléchir : N ✨ » (grisé
  avec la raison s’il manque de l’Intuition). Les questions résolues sont rayées, en bas.

### 6. Le rendu des textes du récit : `recitHTML(t)`

Une seule fonction, dans `js/ui.js`, utilisée pour **tous** les textes du récit (pages, notes,
fragments, revisites, aides) :
- échappe le HTML, garde les retours à la ligne en paragraphes ;
- `{cycle}`, `{semeur}` (= cycle + 6) et `{age}` sont remplacés par leur valeur ;
- un jeton `[mot]` (entre crochets) s’affiche pour l’instant comme un petit cadre neutre
  `<span class="signe" data-s="mot">◇</span>`, **sans le mot**. La version 6.1 le dessinera ;
  prévois juste le point d’entrée.

## Sauvegardes

- **Ne jamais perdre une sauvegarde.** Nouveaux champs avec valeur par défaut (`S.livre`,
  `S.revus`, `S.questions`), validés dans `parseSave` (illisible : remis à zéro, jamais une
  erreur ; identifiants inconnus : mis de côté comme ailleurs). Pas de changement de
  `SAVE_VERSION`. Les fixtures de `tools/fixtures/` se chargent toutes.
- `E.newCycle` garde `livre`, `revus`, `questions`.

## Tests (`tools/test.js`, même style)

Avec des données **inventées dans le test** (passées par `opts.recit`), jamais celles de
`js/recit.js` :
- `E.cond` : chaque forme, une clé inconnue vaut faux ;
- une page s’obtient par exploration, par première réparation (pas la deuxième), par achat au
  Comptoir (écus retirés, page sortie de la liste), par condition ;
- notes : une note conditionnelle apparaît quand sa condition devient vraie, et la page a « du
  nouveau » jusqu’à `E.readPage` ;
- pages, revisites et questions survivent à `newCycle` et à un aller-retour de sauvegarde ;
- un fragment archivé n’est plus listé ni compté, mais reste dans la sauvegarde ;
- `expFrag` remplace le fragment donné ; une revisite s’affiche quand le fragment est connu ;
- questions : apparition, prix (5 × (1 + âge), ×3, ×9), refus sans Intuition, résolution ;
- une sauvegarde avec `livre: "abc"` ou `questions: 42` se charge, nettoyée.

## Version

- `D.VERSION = "6.0.0"`. `D.CHANGES` : deux phrases **neutres** (« Le Journal a deux onglets
  de plus : le Livre et les Questions. »), sans rien du contenu.
- Après chaque modification : `node tools/build.js`.

## Règles

- Ne touche pas aux textes existants (`D.FRAGS`, fins, objectifs) ni aux recettes.
- Ne modifie pas les tests existants.
- Même style de code que le reste. Textes de l’interface (onglets, boutons, messages) :
  `docs/STYLE.md` et `docs/LEXIQUE.md`.

## Livraison

Suis la **consigne de livraison** de `docs/prompts/README.md` (avec la règle « Secrets »),
branche `gemini-livre-6-0`. Dans le navigateur, vérifie au minimum, avec le contenu
provisoire : le jeu se charge sans erreur ; une exploration donne une page et l’onglet Livre
apparaît ; la grille montre les cases vides numérotées ; une page s’ouvre avec ses notes
manuscrites ; la section « Pages » du Comptoir vend une page ; l’onglet Questions affiche une
question et vend une aide ; une fixture ancienne se charge.

Termine par `git log --oneline -3`, `git diff --stat main...gemini-livre-6-0`, la sortie de
`npm test`, ce que tu as vérifié dans le navigateur et ce que tu n’as pas pu faire.
