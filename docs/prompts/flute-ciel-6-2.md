# Prompt : la flûte et le ciel (version 6.2.0)

Tu travailles sur **Éclat** (jeu incrémental de craft en français, mobile, JavaScript sans
framework). Dépôt GitHub : `0doacre/craftgame`.

Lis d’abord : `docs/RECIT-PLAN.md`, `docs/STYLE.md`, `docs/LEXIQUE.md`, puis le moteur actuel
de la flûte (`js/engine.js`, cherche `flûte` et `playNote`), le rendu du ciel nocturne
(`js/sky.js`), et l’affichage du Journal et du Cosmos (`js/ui.js`, onglet `flute` et `cosmos`).
**N’ouvre ni `docs/coffre/`, ni `js/recit.js`, ni `tools/test-recit.js`** : le contenu du récit
n’est pas pour toi. Tu travailles avec des **données inventées dans tes tests**, et tu n’ajoutes
**aucun air réel** dans `js/recit.js` (seulement la structure vide si elle manque : `melodies: {}`,
`skyAnims: {}`).

## Le principe

La flûte en os permettait jusqu’ici de jouer quelques airs courts débloquant un secret.
En 6.2.0, le système devient **piloté par les données** :
1. La flûte reconnaît des airs plus longs (jusqu’à 32 notes) définis dans les données de récit,
   avec des **effets nommés déclaratifs** (poser un drapeau, accorder un bonus temporaire,
   déclencher une animation céleste). Certains airs sont des secrets découverts une fois,
   d’autres sont **rejouables** pour déclencher leur effet à la demande.
2. Le Ciel nocturne (`js/sky.js`, canvas du Cosmos) accepte des **animations décrites dans les
   données** (pluie d’étoiles filantes, constellation illuminée, pulsation d’éclat, voiles
   d’aurore), déclenchables par les airs de flûte ou par des événements du jeu.

## Ta tâche

### 1. Données (`D.RECIT.melodies` et `D.RECIT.skyAnims`)

```js
melodies: {
  exemple_air: {
    n: "Nom de l’air",
    notes: [3, 1, 5, 2, 4, 1, 3, 5],     // suite de notes (peut dépasser 16 notes, jusqu’à 32)
    t: "Texte affiché à la découverte", // description / lore
    effets: [                           // effets déclaratifs appliqués quand l'air est joué
      { k: "flag", id: "iris_chante" },
      { k: "sky", anim: "filantes" },
      { k: "boost", what: "prod", mult: 1.25, dur: 1800 }
    ],
    cond: { ... },                      // optionnel : condition E.cond pour que l'air agisse
    rejouable: true                     // si vrai, rejouer l'air réapplique ses effets immédiats
  }
},
skyAnims: {
  filantes: {
    type: "meteors",                    // "meteors" | "constellation" | "pulse" | "aurora"
    dur: 4,                             // durée en secondes
    count: 12,                          // paramètres spécifiques au type d'animation
    color: "#ffd27a"
  }
}
```

### 2. Le moteur de la flûte (`js/engine.js`)

- **Tampon de notes élargi** : `S.notes` garde jusqu’à 32 notes (au lieu de 16 auparavant).
- **Détection unifiée** : `E.playNote(n)` vérifie les mélodies de `D.MELODIES` ET celles de
  `RECIT.melodies` (avec priorité à `RECIT.melodies` si un identifiant est redéfini).
- **Effets nommés déclaratifs** :
  - `{ k: "flag", id: "..." }` : pose `S.flags[id] = true`.
  - `{ k: "sky", anim: "..." }` : émet l’événement `"skyanim"` avec le nom de l’animation.
  - `{ k: "boost", what: "prod", mult: n, dur: sec }` : applique un boost temporaire de
    production (enregistré dans `S.boosts` ou équivalent avec horodatage).
  - `{ k: "event", name: "..." }` : émet un événement générique `E.emit(name)`.
  - `{ k: "unlock", id: "..." }` : débloque un secret ou découverte.
- **Répétabilité** :
  - Si l’air n’a pas `rejouable: true` : agit comme auparavant (découverte de secret unique,
    gardée dans `S.secrets`).
  - Si `rejouable: true` : l’air peut être joué à volonté (si sa condition `cond` est vérifiée) ;
    ses effets s’exécutent à chaque fois qu’il est joué.
- `E.melodies()` : liste des mélodies connues du joueur, incluant celles de `RECIT.melodies`.

### 3. Le moteur du Ciel (`js/sky.js`)

- Une méthode `Sky.playAnim(animConfig)` (ou `Sky.trigger(animId)` qui va chercher dans
  `D.RECIT.skyAnims`) permettant d’enclencher une animation visuelle sur le canvas du Ciel.
- Prise en charge d’au moins trois types d’animations déclaratives :
  1. `meteors` : plusieurs étoiles filantes avec trajectoire diagonale, queue lumineuse et
     disparition progressive.
  2. `constellation` : ensemble de points / étoiles reliés par des lignes lumineuses
     s’éclairant doucement puis s’estompant.
  3. `pulse` : onde de pulsation lumineuse ou halo coloré traversant le ciel ou centré sur
     un astre.
- Cycle de vie :
  - Chaque animation active a un temps de début `t0` et une durée `dur` en secondes.
  - Le rendu dans `draw(ts)` calcule la progression `p = (now - t0) / dur` (de 0 à 1).
  - Les animations terminées sont retirées du tableau actif.
  - Pas d’allocation d’objets lourds par frame. Si le canvas n’est pas monté, l’animation ne
    provoque aucune erreur.
- Câblage dans `js/ui.js` :
  - `E.on("skyanim", (animId) => { if (Sky && Sky.trigger) Sky.trigger(animId); });`

### 4. Interface (`js/ui.js`)

- Dans l’onglet Flûte (`viewJournal`) :
  - Les airs connus de `RECIT.melodies` s’affichent parmi les mélodies connues, avec leur bouton
    pour les rejouer.
  - Jouer un air connu depuis la liste déclenche aussi ses effets.
- Dans le Cosmos (`js/cosmos`) :
  - Le Ciel joue les animations déclenchées sans à-coup.

## Sauvegardes, tests, version

- `S.notes` plafonné à 32 notes, validé dans `parseSave`. Pas de changement de `SAVE_VERSION`.
- `S.boosts` (ou structure d'effets temporaires) : initialisé par défaut `{}`, nettoyé dans
  `parseSave`, survit à `serialize` / `load`.
- Tests (`tools/test.js`) avec des données **inventées dans le test** (`opts.recit`) :
  - Reconnaissance d'un air long (ex. 18 notes) ;
  - Application des effets nommés (`flag`, `sky`, `boost`) ;
  - Air rejouable vs secret unique ;
  - Déclenchement d’animation Ciel sans plantage ;
  - Conservation après un cycle et aller-retour de sauvegarde.
- `D.VERSION = "6.2.0"`, `D.CHANGES` : une phrase neutre (« La flûte apprend de nouveaux airs et le Ciel s’anime. »).
- `node tools/build.js` après chaque modification ; `npm test` en entier.

## Livraison

Consigne de livraison de `docs/prompts/README.md` (avec la règle « Secrets »), branche
`gemini-flute-ciel-6-2`. Dans le navigateur : le jeu se charge sans erreur ; avec un air inventé
ajouté temporairement dans la console, jouer les notes sur la flûte déclenche l'animation
sur le Ciel et applique l'effet.
Termine par `git log --oneline -3`, `git diff --stat main...gemini-flute-ciel-6-2`, la sortie de
`npm test`, ce que tu as vérifié et ce que tu n’as pas pu faire.
