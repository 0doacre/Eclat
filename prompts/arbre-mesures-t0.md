# Prompt : mesurer l'arbre des connaissances avant de le refaire (lot T0, sans changement de version)

Tu travailles sur **Éclat**, un jeu incrémental de craft en français, pour mobile (PWA, JavaScript
sans framework ni dépendance). Dépôt GitHub : `0doacre/craftgame`. Pars de `main` à jour.

Lis d'abord : `docs/STYLE.md`, `js/arbre.js`, `css/arbre.css`, `tools/test-arbre.js`,
`docs/prompts/arbre-connaissance-0-11.md` (le cahier des charges d'origine de l'arbre).

## Le contexte

L'arbre des connaissances (Carnet, vue « Arbre ») va être refait en plusieurs lots (T1 : plein écran et
zoom à trois niveaux ; T2 : cinq voies et un seul lien visible par recette). Avant de toucher à quoi que
ce soit, il faut **un état des lieux chiffré**, pour que chaque lot dise ce qu'il a amélioré, et pour
qu'aucune régression ne passe inaperçue. Ce lot n'ajoute **aucune fonction au jeu** et ne modifie
**aucun fichier de `js/` ni de `css/`**.

Constats déjà faits à la main (à confirmer ou corriger par tes mesures, sans les croire sur parole) :
175 recettes, 397 liens entre une recette et un ingrédient, dont 181 entre objets du même âge et 216 entre
âges différents (138 qui sautent au moins deux âges) ; la fenêtre de l'arbre fait environ 510 px sur 844 ;
les étiquettes font 10,5 px ; le catalogue complet fait environ 5 900 px de haut.

## Ce qu'il faut produire

### 1. `tools/arbre-mesures.js`

Un script Node (sans dépendance, comme `tools/test-figures.js`) qui charge `js/data.js`,
`js/engine.js` et `js/arbre.js`, construit des états de partie, appelle `Arbre.graphe(E, D)` et
`Arbre.mise_en_page(g, D)`, et affiche un tableau de mesures. Trois états :

- **neuve** : `createEngine()` sans rien d'autre ;
- **avancée** : `tools/fixtures/save-v5-age8-usine.json` chargé avec `E.load` ;
- **tout connu** : toutes les recettes apprises (`E.learn(id, true)` pour chaque objet à recette qui n'est
  ni `sec` ni `path`, comme dans `tools/sim-passages.js`), et l'âge au maximum.

Mesures, pour chacun des trois états :

1. nombre de nœuds (allumés, vus, fantômes), nombre de traits (tous, et ceux qui restent visibles sans
   toucher un nœud : ceux qui n'ont pas la classe `loin` dans `rendu()`) ;
2. largeur et hauteur du monde (`lay.w`, `lay.h`) à l'échelle 1 ;
3. **nœuds par écran** : pour une fenêtre de 390 × 510 px glissée sur toute la hauteur par pas de 20 px,
   le nombre de centres de nœuds contenus dans la fenêtre ; donne le minimum, la moyenne et le maximum ;
4. **traits** : longueur verticale moyenne et maximale en px ; part des traits « droits » (écart horizontal
   entre les deux bouts inférieur à la moitié de `Arbre.PX`) ; part des traits qui traversent au moins une
   bande d'âge entière ;
5. **croisements** : nombre de paires de traits visibles qui se croisent (approche chaque courbe par une
   ligne brisée de 8 segments ; `O(n²)` suffit, quelques centaines de traits) ;
6. **temps de mise en page** en millisecondes (médiane de 20 exécutions, sans le cache de `catalogue`
   la première fois : appelle-la une fois à froid, puis 20 fois à chaud, et affiche les deux) ;
7. **tailles lues dans les feuilles de style et dans le code**, sans navigateur : côté du nœud
   (`Arbre.NODE`), taille de police des étiquettes de nœud (`.arb-l` dans `css/arbre.css`), des âges
   (`.arb-age`), épaisseur et opacité des traits (`.arb-t`). Le script **lit** `css/arbre.css`
   (expression régulière) : si la valeur change, la mesure suit.

Options : `--json` (une sortie lisible par un autre script), `--ecrire` (écrit le tableau en Markdown
dans `docs/revue/arbre-mesures.md`, avec la version du jeu `D.VERSION`, le hash court du commit courant
quand `git` est disponible, et la date), `--check` (voir plus bas).

### 2. Mesures dans un vrai navigateur (facultatif si Playwright manque)

Dans le même fichier ou dans `tools/arbre-mesures-ui.js` (ton choix, justifie-le dans le compte rendu), sur
le modèle de `tools/test-ux.js` (serveur local sur un port libre, profils jetables, `PW=` pour le chemin de
Playwright, `CHROMIUM=` facultatif). Pour chaque taille d'écran **390 × 844** et **320 × 568**, avec la
sauvegarde avancée (`tools/fixtures/save-v5-age8-usine.json`, mêmes réglages que `save(true, false)` dans
`tools/test-ux.js`), ouvre le Carnet puis l'Arbre et mesure :

- la **surface utile de l'arbre** : `getBoundingClientRect()` de `.arb-vue` (hauteur et part de la hauteur
  de l'écran) ;
- le nombre de nœuds dont le rectangle est entièrement dans `.arb-vue` à l'échelle d'ouverture ;
- la plus petite police et la plus petite cible (`getComputedStyle`, `getBoundingClientRect`) parmi les
  nœuds, étiquettes et boutons de l'arbre (`.arb-n`, `.arb-l`, `.arb-tete .btn`, `.arb-bascule button`),
  **à l'échelle d'ouverture, en tenant compte du facteur de zoom appliqué par `transform: scale()`** : une
  étiquette de 10,5 px à l'échelle 0,6 se lit à 6,3 px ;
- une capture d'écran de chaque état, rangée dans le dossier donné par `ARBRE_SHOTS=` (ne les ajoute pas au
  dépôt).

Sans Playwright, dis-le dans le compte rendu et saute cette partie : ne livre pas comme si elle était faite.

### 3. L'état des lieux écrit

Lance `node tools/arbre-mesures.js --ecrire` sur `main` **avant toute autre chose**, et ajoute le fichier
`docs/revue/arbre-mesures.md` au commit. Ce fichier est la ligne de base : les lots suivants la comparent à
leurs propres mesures. Au-dessous du tableau, une section « Lecture » de **dix lignes au plus** : ce que
disent les chiffres (où l'arbre est le plus dense, quelle part des traits se croise, combien de nœuds on voit
à la fois), sans recommandation de refonte (c'est l'affaire du lot suivant).

### 4. Branchement dans les tests

`node tools/arbre-mesures.js --check` : ne regarde que l'état « tout connu », ne s'exécute qu'en Node (pas de
navigateur), dure moins de 5 secondes et **échoue** si une mesure est absurde (nombre de nœuds nul, mise en
page plus lente que 500 ms, trait vers un nœud absent, valeur de police introuvable dans le CSS). Il
**ne fixe aucun seuil de qualité** : ce n'est pas un test de non-régression visuelle, juste un garde-fou de
l'outil. Ajoute-le à la chaîne `npm test` dans `package.json`, après `node tools/test.js`.

## Règles

- **Ne modifie ni `js/`, ni `css/`, ni `index.html`, ni `sw.js`**, ni `D.VERSION`, ni `D.CHANGES` : ce lot
  est de l'outillage, aucune version nouvelle, `node tools/build.js --check` doit rester vert sans relancer
  `build`.
- Les textes du script et du document sont en français, au tutoiement dans les messages, sans anglicisme
  inutile, sans tiret cadratin (`docs/STYLE.md`).
- Aucune dépendance npm nouvelle.
- Le script ne modifie jamais `js/` ; s'il importe `js/arbre.js`, c'est en lecture (le module exporte déjà
  `graphe`, `mise_en_page`, `rendu`, `catalogue`, `NODE`, `COLS`, `PX`, `PY`).

## Vérifications obligatoires

- `npm test` en entier.
- `node tools/arbre-mesures.js`, avec et sans `--json`, sur les trois états.
- Si Playwright est disponible : la partie navigateur à 390 × 844 et 320 × 568, sans erreur console.
- Compare un nombre que tu connais à la main (le nombre de recettes, 175, ou le nombre de nœuds de l'état
  « tout connu » avec ce que montre l'écran) : dis ce que tu as comparé.

## Livraison

> **Livraison.** Travaille dans un clone du dépôt GitHub `0doacre/craftgame`, à jour
> (`git pull` sur `main` avant de commencer), jamais dans une copie ou un dossier temporaire.
> Crée une nouvelle branche au nom de la tâche : `t0-arbre-mesures`.
> Quand `npm test` passe en entier, **ouvre le jeu dans un vrai navigateur** avant de livrer :
> `npx http-server -p 8765 -c-1 .` à la racine du dépôt, puis `http://localhost:8765/` (au
> besoin avec Playwright). Le jeu doit se charger, la console ne doit montrer aucune erreur. Les tests
> ne chargent que le moteur : si tu ne peux pas ouvrir de navigateur, dis-le clairement dans ton compte
> rendu au lieu de livrer comme si c'était vérifié.
> Fais ensuite un commit qui dit ce que tu as changé, puis pousse la branche sur GitHub :
> `git push -u origin t0-arbre-mesures`. Ne touche pas à `main`, ne fusionne rien : la branche sera
> relue avant d'être intégrée. Termine en donnant le nom de la branche, la sortie de `npm test`, ce que tu
> as vérifié dans le navigateur, et ce que tu n'as pas pu faire.
>
> **Secrets.** L'auteur joue à l'aveugle : n'écris jamais une solution de secret, une combinaison de
> recette secrète, un code ou un air dans ton compte rendu, tes messages de commit ou `D.CHANGES`. Écris
> « une recette secrète », « un lieu caché », pas leur contenu. N'ouvre pas `docs/coffre/` ni
> `js/recit.js`. Les mesures excluent les objets `sec` et `curio` : si un identifiant de recette secrète
> apparaît dans ta sortie, retire-le avant de l'écrire dans le document.

Termine par `git log --oneline -3`, `git diff --stat main...t0-arbre-mesures`, la sortie de `npm test`,
le tableau de l'état « tout connu » à 390 × 844, et ce que tu n'as pas pu faire.
