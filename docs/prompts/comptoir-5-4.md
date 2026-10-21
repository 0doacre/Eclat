# Prompt : le Comptoir (version 5.4.0)

Tu travailles sur **Éclat**, un jeu incrémental de craft en français, pour mobile (PWA,
JavaScript sans framework ni dépendance). Dépôt GitHub : `0doacre/craftgame`.

Lis d’abord, dans cet ordre :
1. `docs/RENAISSANCES.md`, en entier, et surtout la **section 5 (le Comptoir)** : c’est ta
   spécification ;
2. `docs/LEXIQUE.md` : les mots à employer dans tout texte affiché ;
3. `docs/PROGRESSION.md` : passages, relève, Traces, Mémoire des mains ;
4. `README.md` : organisation des fichiers.

## Ta tâche : ajouter le Comptoir

Un marché classique : on vend ce qui encombre la Réserve contre des **écus**, et on
achète avec les écus des **Traces** (monnaie de méta-progression, déjà existante) et des
matières premières. Le Comptoir est tenu par **le Troqueur**, un vieil automate des
Anciens. Il s’ouvre quand la Plaine est ouverte (`E.zoneOpen("plaine")`).

Seulement le Comptoir. Ne fais rien des sections 3, 4, 6 et 7 de `RENAISSANCES.md`
(cycles guidés, ruines, arbre de la Mémoire, histoire) : ce sera pour d’autres versions.

### 1. Données (`js/data.js`)

Un bloc `D.COMPTOIR` avec **toutes** les constantes, pour pouvoir les régler sans
toucher au code :

```js
D.COMPTOIR = {
  zone: "plaine",   // le Comptoir s’ouvre avec cette terre
  raw: 0.1,         // valeur d’une matière première de l’âge 0, en écus
  rawAge: 2.5,      // ×2,5 par âge de la matière
  work: 1.25,       // bonus de travail par étape de recette
  sat: 2000,        // saturation : quantité qui divise le prix par deux pendant un cycle
  trace: 200,       // prix de la première Trace, à l’âge 0
  traceAge: 2.5,    // ×2,5 par âge atteint
  traceUp: 1.6,     // ×1,6 à chaque Trace achetée pendant le cycle
  buy: 3            // une matière achetée coûte 3 fois sa valeur
};
```

### 2. Moteur (`js/engine.js`, sans aucun accès au DOM)

- **Valeur d’un objet** `E.value(id)` (en écus, mise en cache) :
  - une matière première (`t: "res"` récoltée sur un gisement) vaut `raw × rawAge^âge` ;
  - un objet fabriqué vaut la somme de la valeur de ses ingrédients × quantité, divisée
    par la quantité produite, × `work`.
- **Ce qui se vend** `E.sellable(id)` : seulement les matières (`res`) et les pièces
  (`comp`) non uniques. Jamais un outil, une station, un extracteur, une machine, une
  amélioration, une curiosité, une relique, ni un objet unique.
- **Saturation.** Le prix unitaire baisse avec la quantité déjà vendue de cet objet
  pendant le cycle (`q`) : `p(q) = valeur / (1 + q / sat)`. Vendre `n` unités d’un coup
  rapporte l’intégrale, `valeur × sat × ln((sat + q + n) / (sat + q))`. Vendre en deux
  fois rapporte donc exactement autant que d’un coup. `E.sellQuote(id, n)` donne le
  montant sans vendre.
- **Vendre** `E.sell(id, n)` : retire de la Réserve, ajoute les écus, retient la quantité
  vendue. Renvoie `{ ok, n, ecus }` ou `{ ok: false, why }`.
- **Acheter une Trace** : `E.traceCost()` = `trace × traceAge^(âge atteint) × traceUp^k`,
  où `k` est le nombre de Traces achetées pendant ce cycle. `E.buyTrace()` ajoute 1 à
  `S.meta.traces` **et** à `S.meta.tracesTotal`.
- **Acheter une matière** `E.buyRes(id, n)` : seulement les matières qui se récoltent à
  la main dans une terre ouverte ; prix `buy × valeur` par unité, sans saturation.
- **Sauvegarde** : `S.ecus` (nombre ≥ 0) et `S.comptoir = { sold: { id: quantité },
  traces: k }`. Valeurs par défaut dans `freshState()`. Dans `parseSave`, valider comme
  le font `checkHand` et `checkDom` : une valeur illisible est remise à zéro, jamais une
  erreur. **Pas de changement de `SAVE_VERSION`** : une sauvegarde sans ces champs se
  charge avec 0 écu.
- **Relève** (`newCycle()`) : les écus et `S.comptoir` repartent de zéro. Les Traces
  achetées restent.
- Événements : émettre `"sold"` et `"bought"` (comme les autres `E.emit`).

### 3. Interface (`js/domaine.js`, `js/ui.js`, `css/style.css`)

- Dans le Domaine, sous les machines, une carte **« Le Comptoir »** dès qu’il est ouvert :
  écus en réserve, une phrase du Troqueur, et un bouton **Ouvrir le Comptoir**.
- Une fenêtre (avec `openModal`, comme les fiches du Domaine) à deux pages, **Vendre** et
  **Acheter** :
  - **Vendre** : les objets vendables de la Réserve, ceux qui rapporteraient le plus en
    premier. Par ligne : icône, nom, quantité en réserve, prix unitaire actuel, et trois
    boutons **10 %**, **La moitié**, **Tout sauf 100**, chacun avec le montant qu’il
    rapporterait. Après une vente, la ligne se met à jour sur place.
  - **Acheter** : un gros bouton **« Acheter 1 ✦ Trace : N écus »**, avec une ligne
    qui explique que le prix monte à chaque achat et redescend à la relève. En dessous, les
    matières premières des terres ouvertes, avec **+100** et **+1 000**.
- Dans la fenêtre de relève (cherche « Éveiller le Semeur » dans `js/ui.js`) : si le
  joueur a des écus, une ligne d’avertissement : « Tes N écus seront perdus : convertis-les
  en Traces au Comptoir avant. »
- L’aide (`openHelp` dans `js/ui.js`, section « Les mots du jeu ») : ajouter **Comptoir,
  écus**. Ajouter les mêmes mots à `docs/LEXIQUE.md`.
- Un chapitre du tutoriel dans `js/tuto.js` (inspire-toi du chapitre `automate`) : la
  première fois que la carte du Comptoir apparaît, une bulle la montre ; la suivante dit
  de vendre quelque chose ; le chapitre est fini à la première vente.

### 4. Version

- `D.VERSION = "5.4.0"` et `D.CHANGES` remplacé par trois ou quatre phrases courtes sur
  le Comptoir.
- Si tu crées un nouveau fichier JS ou CSS, ajoute-le à `index.html` **et** à la liste
  `FILES` de `sw.js`.
- Après **chaque** modification de fichier, lance `node tools/build.js` (il met à jour
  l’empreinte du service worker ; sans elle, les joueurs ne reçoivent pas la mise à jour).

### 5. Tests (`tools/test.js`, même style que les tests existants)

Au minimum :
- tout objet vendable a une valeur > 0 et finie ;
- vendre retire de la Réserve et ajoute les écus ;
- vendre `n` d’un coup rapporte autant que `n/2` puis `n/2` (à 1e-6 près) ;
- le prix unitaire baisse après une vente ;
- un outil, une station ou un objet unique ne se vend pas ;
- le prix d’une Trace monte après un achat ; on ne peut pas acheter sans assez d’écus ;
- après `newCycle()` : 0 écu, `comptoir` vide, Traces achetées toujours là ;
- une sauvegarde sans `ecus` se charge (0 écu) ; une sauvegarde avec `ecus: "abc"` ou
  `comptoir: 42` se charge aussi, nettoyée ;
- sérialiser puis recharger garde écus et quantités vendues.

`npm test` doit passer en entier (contenu, moteur, serveur, empreinte du service worker).

## Règles

- **Ne jamais perdre une sauvegarde.** Aucun champ existant ne change de sens.
- Ne modifie pas les tests existants pour les faire passer.
- Code : même style que le reste (fonctions courtes, `const`, commentaires en français,
  rares et utiles). Pas de dépendance, pas de framework, pas de build.
- Textes affichés : français, tutoiement, simples, mots de `docs/LEXIQUE.md` (on
  **récolte**, on **fabrique**, tout est dans la **Réserve**, débits par minute). Pas de
  tiret cadratin, pas de phrases d’annonce ni de formules creuses.
- Ne touche ni aux passages, ni à la Mémoire des mains, ni au rythme du jeu.

## Livraison

Travaille dans un clone du dépôt GitHub `0doacre/craftgame`, à jour (`git pull` sur
`main` avant de commencer), jamais dans une copie ou un dossier temporaire. Crée la
branche `gemini-comptoir-5-4`. Quand `npm test` passe, fais un commit qui dit ce que tu
as changé, puis pousse la branche : `git push -u origin gemini-comptoir-5-4`. Ne touche
pas à `main`, ne fusionne rien : la branche sera relue avant d’être intégrée. Termine en
donnant le nom de la branche, la sortie de `npm test`, et la liste de ce que tu n’as pas
pu faire.
