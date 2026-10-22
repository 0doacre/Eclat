# Prompt : le moteur des signes (version 6.1.0)

Tu travailles sur **Éclat** (jeu incrémental de craft en français, mobile, JavaScript sans
framework). Dépôt GitHub : `0doacre/craftgame`.

Lis d’abord : `docs/RECIT-PLAN.md`, `docs/STYLE.md`, `docs/LEXIQUE.md`, puis le moteur du
récit de la 6.0 (`js/engine.js`, cherche « RÉCIT, LIVRE & QUESTIONS » ; `js/ui.js`,
`recitHTML` et l’onglet Livre). **N’ouvre ni `docs/coffre/`, ni `js/recit.js`, ni
`tools/test-recit.js`** : le contenu du récit n’est pas pour toi. Tu travailles avec des
**données inventées dans tes tests**, et tu n’ajoutes **aucun signe réel** dans `js/recit.js`
(seulement la structure vide si elle manque : `signes: {}`).

## Le principe

Le jeu contient une écriture inconnue. Chaque **signe** est un mot. Dans les textes du récit,
un jeton `[id]` (lettres minuscules, chiffres, `_`) s’affiche **dessiné** tant que le joueur
ne l’a pas compris, puis **comme le mot**, dans un style à part. Le joueur comprend un signe
en **tapant** ce qu’il croit qu’il veut dire, sur la fiche du signe.

## Ta tâche

### 1. Données (`D.RECIT.signes`)

```js
signes: {
  exemple: {
    h: [1, 5, 1],          // le dessin : un trait qui relie trois points, de gauche à droite,
                           // chacun à une hauteur de 1 (bas) à 5 (haut)
    mot: "…",              // le mot affiché une fois compris (texte)
    ok: ["a1b2c3d4", …],   // empreintes des réponses acceptées (voir 3)
    cond: { … }            // optionnel : quand la fiche accepte une réponse (E.cond)
  }
}
```

### 2. Le dessin

- Une fonction pure `signeSVG(h, taille)` dans `js/ui.js` (ou un petit fichier `js/signes.js`,
  ajouté à `index.html` et à `FILES` dans `sw.js`) : un petit SVG en ligne, trois points reliés
  par un trait arrondi, hauteur proportionnelle au texte, couleur `currentColor`. Mise en cache
  par `h`.
- `recitHTML` : un jeton `[id]` connu dans les données s’affiche avec ce dessin
  (`<span class="signe" data-s="id">…svg…</span>`) s’il n’est pas compris, et avec le mot
  (`<span class="signe lu" data-s="id">mot</span>`) s’il l’est. Un jeton inconnu des données
  garde le cadre neutre ◇ de la 6.0.
- Le changement doit se voir **partout et tout de suite** : pages, notes, fragments,
  revisites, aides, fiches d’objets, terminal si un texte y passe par `recitHTML`.

### 3. Comprendre un signe

- **Empreinte** : `E.empreinte(txt)` = FNV-1a 32 bits, en hexadécimal sur 8 caractères, de la
  saisie **normalisée** : minuscules, accents retirés, apostrophes et ponctuation retirées,
  articles en tête retirés (`le`, `la`, `les`, `l`, `un`, `une`, `des`, `du`, `de`, `d`),
  espaces multiples réduits. Les réponses ne sont **jamais** écrites en clair dans les
  données : seulement leurs empreintes.
- `E.essaiSigne(id, txt)` → `{ ok, proche }` :
  - `ok` si l’empreinte de la saisie est dans `ok` (et la condition vraie) : le signe est
    compris, pour toujours (il reste à la relève). Émet `"signe"`.
  - sinon, `proche` si **une** variante de la saisie à une lettre près (une lettre retirée,
    ajoutée ou changée, alphabet a–z) a une empreinte dans `ok`. Le jeu dit alors « Presque. »
    au lieu de « Non. ».
  - Un léger délai entre deux essais sur le même signe (`D.RECIT.signeDelai`, 3 s par défaut)
    pour décourager la force brute.
- État : `S.signes = { id: { lu: 1, vu: { lieu: 1 }, essais: n } }`.

### 4. La fiche d’un signe et l’onglet Signes

- Toucher un signe, **n’importe où**, ouvre sa fiche : le dessin en grand, la liste des
  endroits où le joueur l’a vu (enregistrés au rendu : `vu`), un champ de saisie avec un bouton
  « Proposer », la réponse du jeu (« Non. », « Presque. », ou le mot en couleur s’il est
  compris).
- Un onglet **« Signes »** dans le Journal, visible dès le premier signe vu : la grille des
  signes vus (dessin, ou mot s’il est compris), avec leur nombre d’endroits.
- Aide (`openHelp`, « Les mots du jeu ») : une ligne « Signe ». `docs/LEXIQUE.md` : **Signe**.

## Sauvegardes, tests, version

- `S.signes` par défaut `{}`, validé dans `parseSave` (illisible : remis à zéro ; identifiants
  inconnus mis de côté). Gardé par `E.newCycle`. Pas de changement de `SAVE_VERSION`.
- Tests (`tools/test.js`), avec des signes **inventés dans le test** (`opts.recit`) :
  normalisation (accents, casse, articles, apostrophes) ; empreinte stable ; bonne réponse,
  mauvaise, « presque » (lettre retirée, ajoutée, changée) ; délai ; un signe compris le reste
  après `newCycle` et un aller-retour de sauvegarde ; `recitHTML` (si testable en Node, sinon
  sa fonction de remplacement isolée) rend dessin puis mot.
- `D.VERSION = "6.1.0"`, `D.CHANGES` : une ou deux phrases **neutres** (« Le Journal a un
  onglet Signes. »).
- `node tools/build.js` après chaque modification ; `npm test` en entier (il inclut
  `tools/test-recit.js`, que tu ne dois ni lire ni modifier : s’il échoue, dis-le).

## Livraison

Consigne de livraison de `docs/prompts/README.md` (avec la règle « Secrets »), branche
`gemini-signes-6-1`. Dans le navigateur : le jeu se charge sans erreur ; avec un signe ajouté
**temporairement** dans la console (pas dans un fichier), un texte qui le contient l’affiche
dessiné, sa fiche s’ouvre, « Presque. » puis la bonne réponse le transforment en mot partout.
Termine par `git log --oneline -3`, `git diff --stat main...gemini-signes-6-1`, la sortie de
`npm test`, ce que tu as vérifié et ce que tu n’as pas pu faire.
