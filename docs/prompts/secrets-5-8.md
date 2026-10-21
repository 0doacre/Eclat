# Prompt : des secrets qu’on peut chercher (version 5.8.0)

Tu travailles sur **Éclat**, un jeu incrémental de craft en français, pour mobile (PWA,
JavaScript sans framework ni dépendance). Dépôt GitHub : `0doacre/craftgame`.

## Le problème

Les recettes secrètes (objets `sec: true` dans `js/data.js`, liste dans `D.SECRETS`) et
les lieux cachés existent, mais un joueur ne sait ni qu’ils existent, ni où chercher :
- le Journal donne seulement « n / 21 secrets » ;
- les indices sont dans des textes de lieux et des réminiscences, lus une fois puis
  rangés ; rien ne dit qu’une phrase en cache plus que les autres ;
- pour un lieu caché, la Carte affiche son énigme (`x.hidden`), mais le Domaine n’affiche
  que « 🔒 un lieu caché » (fonction `lieuHTML` dans `js/domaine.js`) ;
- le thermomètre de l’Atelier réagit aussi aux recettes secrètes, mais rien ne le
  distingue.

Lis `docs/SOLUTIONS.md` (toutes les solutions et la source de chaque indice : **ne recopie
jamais une solution dans un texte affiché**), `docs/LEXIQUE.md`, puis dans
`js/engine.js` la fonction `temperature` et `E.attempt`, et dans `js/ui.js` le rendu du
résultat d’un essai (cherche `thermo(`) et le Carnet (`viewCarnet`).

## Ta tâche

1. **Le Domaine montre l’énigme d’un lieu caché**, comme la Carte : « 🔒 » suivi du
   texte de `x.hidden`.
2. **Des silhouettes de secrets dans le Carnet.** Une section « Secrets » : pour chaque
   âge atteint, « Âge du Bois : 1 secret trouvé sur 2 », et une case « ? » par secret pas
   encore trouvé. Sous chaque case, **une courte énigme** (`D.SECRET_HINTS = { id: "…" }`)
   qui n’apparaît qu’une fois la source de son indice obtenue : le fragment lu, le lieu
   exploré, la réminiscence vue, ou l’objet fabriqué dont parle `docs/SOLUTIONS.md`
   (colonne « Indice dans le jeu »). Pour les secrets « Expérimentation », l’énigme est
   visible dès l’âge atteint. Avant, la case dit « Un indice se cache quelque part dans
   cet âge ».
3. **Un thermomètre qui distingue l’étrange.** Quand la meilleure chaleur d’un essai vient
   d’une recette secrète, `temperature` le signale (`sec: true`) et l’Atelier affiche une
   ligne distincte, avec sa couleur : « Une chaleur étrange : ce mélange cache quelque
   chose. »

### Les énigmes

Une phrase, deux au plus, dans le ton des textes de `D.FRAGS` : concret, au présent, sans
emphase. **Elles ne nomment ni le geste, ni les matières, ni l’objet.** Elles évoquent une
image qui y mène, sans la donner. Elle doit faire chercher, pas réciter : si on peut en
déduire la recette sans rien essayer, elle est trop explicite. Pas de « mystérieux », « étrange », « secret » dans l’énigme
elle-même, pas de tiret cadratin.

## Version, tests

- `D.VERSION = "5.8.0"`, `D.CHANGES` : deux ou trois phrases.
- Après chaque modification : `node tools/build.js`.
- Tests : chaque secret de `D.SECRETS` qui est une recette a une énigme ; l’énigme est
  cachée tant que sa source n’est pas obtenue, puis visible ; `temperature` renvoie
  `sec: true` pour un essai proche d’une recette secrète et pas pour une recette normale ;
  **aucune énigme ne contient le nom d’un des ingrédients de sa recette** (test
  automatique).

## Règles

- Ne jamais perdre une sauvegarde ; ne modifie pas les tests existants.
- Même style de code que le reste ; textes en français, tutoiement, mots de
  `docs/LEXIQUE.md`.

## Livraison

Suis la **consigne de livraison** de `docs/prompts/README.md`, branche
`gemini-secrets-5-8`. Dans le navigateur, vérifie : le jeu se charge sans erreur ; la
section Secrets du Carnet s’affiche ; un lieu caché montre son énigme dans le Domaine ; un
essai proche d’un secret affiche la chaleur étrange. Termine par `git log --oneline -3`,
`git diff --stat main...gemini-secrets-5-8`, la sortie de `npm test`, ce que tu as vérifié
dans le navigateur et ce que tu n’as pas pu faire.
