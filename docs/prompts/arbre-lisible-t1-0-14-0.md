# Prompt : un arbre qui se lit (lot T1, version 0.14.0)

Tu travailles sur **Éclat**, un jeu incrémental de craft en français, pour mobile (PWA, JavaScript
sans framework ni dépendance). Dépôt GitHub : `0doacre/craftgame`. Pars de `main` à jour, **après** la
fusion du lot T0 (`docs/revue/arbre-mesures.md` doit exister : c'est la ligne de base à laquelle tu te
compares ; s'il manque, arrête-toi et dis-le).

Lis d'abord : `docs/STYLE.md`, `docs/LEXIQUE.md`, `docs/revue/arbre-mesures.md`, `js/arbre.js`,
`css/arbre.css`, `js/atelier.js` (`arbreBascule`, `arbreHTML`, `arbreChoisir`, `arbreMonter` et la gestion
des gestes), `tools/test-arbre.js`, `docs/prompts/arbre-connaissance-0-11.md` (le cahier des charges
d'origine, dont les règles de non-fuite **restent en vigueur**), `docs/AUDIT-UX-CASUAL-2026-10-24.md`.

## Le contexte

Le Carnet a une vue « Arbre » (0.11.0, rendue plus lisible en 0.13.2 : rangées vides repliées, âges
lointains en bandeau, traits qui sautent plus d'un âge cachés jusqu'au toucher). Elle reste difficile à
utiliser sur un téléphone. Constats mesurés (à confirmer avec `docs/revue/arbre-mesures.md`) :

- la fenêtre de l'arbre fait environ 510 px sur 844 (`.arb-vue`, hauteur calculée dans `css/arbre.css`) ;
  le titre, l'interrupteur Liste/Arbre, le compteur et trois boutons prennent le reste ;
- à l'échelle d'ouverture, 10 à 15 nœuds seulement sont visibles ; le catalogue complet fait des milliers de
  pixels de haut, et il n'y a aucun moyen de sauter d'un âge à l'autre ;
- les étiquettes font 10,5 px (`.arb-l`), les noms d'âge 12 px, les traits 1,6 px à 30 % d'opacité : quand on
  s'éloigne pour s'y retrouver, plus rien ne se lit ;
- l'arbre est enterré : onglet Carnet, puis interrupteur « Arbre », sans lien depuis l'objectif ni depuis
  une fiche d'objet ;
- le panneau du bas (ingrédients et usages du nœud touché) prend environ 200 px sur 510.

**Ce lot ne change pas la mise en page des nœuds** (les colonnes et les rangées de `catalogue()` restent
celles de la 0.13.2) : cinq « voies » sémantiques et un lien visible par recette viennent au lot suivant
(T2). Ici, on améliore la **vue** : l'espace, les repères, la lisibilité, les entrées.

## Ce qu'il faut faire

### 1. Une vue plein écran

- Touché, « Arbre » (interrupteur du Carnet) ouvre l'arbre dans une **vue plein écran** : une couche fixe qui
  couvre l'en-tête et la barre d'onglets, respecte les zones sûres (`--safe-t`, `--safe-b`), avec **une barre
  fine de 44 px** : retour (✕ ou ←, nom accessible « Fermer l'arbre »), le compteur de recettes trouvées
  (sans total, comme aujourd'hui), « Centrer », − et +, et un bouton « ? » qui montre ou cache une légende.
- Fermer la vue revient au Carnet, en vue Liste ou Arbre selon `U.carnetVue` (choisis et dis ce que tu as
  choisi). Le geste « retour » du téléphone ferme la vue (`history.pushState` / `popstate`) **si** cela ne
  casse pas le comportement actuel du bouton retour dans le jeu ; sinon, ne fais rien de plus et dis-le.
- Focus : à l'ouverture, le focus va sur le bouton de retour ; à la fermeture, il revient sur le bouton qui a
  ouvert la vue. Les nœuds restent de vrais `<button>`. `Échap` ferme la vue.
- **Surface utile de l'arbre : au moins 650 px à 390 × 844 et 360 px à 320 × 568** (mesures de T0, partie
  navigateur). Sans le titre « Carnet », sans l'interrupteur, sans marge de 190 px.
- La **légende** tient en cinq lignes au plus : un nœud allumé (recette trouvée), une matière vue, une case
  pointillée (une recette pas encore trouvée), un nœud entouré (l'objectif), un trait qui saute des âges
  (visible au toucher). Chaque ligne montre le symbole réel (même classe CSS), pas un dessin à part.

### 2. Un rail des âges

- Un rail vertical de **13 repères** sur le bord droit de la vue (un par âge de `D.AGES`, du bas, l'âge du
  Bois, vers le haut), de 44 px de large, fond transparent : les nœuds en dessous restent visibles, mais
  **aucun nœud ne doit rester hors de portée** (la vue peut se glisser jusqu'à ce que la dernière colonne
  soit libre du rail ; vérifie-le).
- Toucher ou **glisser le doigt** sur le rail saute à l'âge correspondant (animation brève, sauf
  `prefers-reduced-motion`) ; pendant le glissement, une pastille affiche le numéro et le nom de l'âge. Le
  repère de l'âge actuel du joueur est plein ; les âges au-delà de l'âge atteint plus un sont estompés (et
  restent touchables : ils s'ouvrent sur leur bandeau).
- Le repère de l'âge actuellement **au centre de la vue** est mis en évidence en continu.
- Nom accessible du rail : « Aller à un âge ». Chaque repère est un bouton nommé (« Âge de l'Acier »…) et se
  parcourt au clavier (flèches haut et bas).

### 3. Un zoom à trois niveaux

L'échelle `o.k` de la vue (voir `arbreMonter`) définit trois niveaux. Les seuils sont des constantes
nommées ; propose des valeurs, justifie-les dans ton compte rendu, et garde ce qui suit :

| Niveau | Échelle (à régler) | Ce qu'on voit |
|---|---|---|
| **loin** | environ 0,2 à 0,5 | **une pile de bandes d'âge** : pour chaque âge atteint plus un, son nom (au moins 12 px **à l'écran**, pas à l'échelle du monde), le **nombre de recettes trouvées** dans cet âge, et la couleur de l'âge ; les nœuds sont de petits points ; la bande de l'objectif est marquée ; **les 13 âges au plus tiennent sans défilement** dans la surface utile pour les âges atteints plus un |
| **milieu** | environ 0,5 à 0,9 | les icônes seules ; une étiquette seulement pour l'objectif et pour les nœuds-carrefours (ceux qui servent d'ingrédient à **au moins 4 recettes**, calculés sur `D.ITEMS`, déterministe) |
| **près** | 0,9 et plus | comme aujourd'hui, avec des étiquettes d'**au moins 11 px à l'écran** |

- Les textes du niveau « loin » ne sont **pas mis à l'échelle** avec le monde : un calque HTML à part,
  recalculé quand la vue bouge, ou des étiquettes dont la taille est divisée par l'échelle. Choisis, et dis
  pourquoi.
- Les boutons − et + passent d'un niveau au suivant (et à l'échelle exacte de ce niveau) ; le pincement et la
  molette restent continus. « Centrer » ramène sur l'objectif ou la dernière découverte, au niveau « près ».
- Toucher une bande au niveau « loin » **zoome dessus** (niveau « milieu » ou « près », centrée sur cette
  bande).
- Les règles de non-fuite s'appliquent aussi au niveau « loin » : un compte par âge est un nombre de
  recettes **trouvées**, jamais un total ni un nombre restant ; un âge sans recette trouvée affiche 0 ou
  rien, pas le nombre de recettes qu'il contient.

### 4. Lisibilité des éléments

- Étiquettes de nœud (`.arb-l`) : **au moins 11 px à l'écran** à l'échelle « près » (aujourd'hui 10,5 px) ;
  deux lignes au plus ; ne fais pas déborder une étiquette sur la voisine (vérifie avec la mesure de T0).
- Noms d'âge dans les bandes : 13 px au moins à l'échelle « près ».
- Traits visibles (hors `loin`) : épaisseur 2 px et opacité 45 % au moins ; teinte de la couleur du texte
  mélangée (garde `color-mix`), contrastée sur le fond de la bande (vérifie le thème Jour **et** Veillée, et
  « Grand texte »).
- Panneau du bas (`.arb-fiche`) : ingrédients et usages sur **une ligne qui défile horizontalement**, hauteur
  de **96 px au plus** hors boutons ; le nom du nœud et « Fiche » sur la ligne du haut. Il ne recouvre jamais
  le nœud choisi (la vue se décale au besoin).

### 5. Des entrées qui mènent à l'arbre

- Un bouton ou un lien « Voir dans l'arbre » sur la **fiche d'un objet** (celle qu'ouvre `goto(id)`, appelée par
  les éléments `data-goto` : la fonction `goto` est dans `js/atelier.js`, l'écouteur dans `js/ecouteurs.js`), pour les objets à recette trouvée ; il ouvre la vue plein écran centrée sur ce nœud,
  **choisi** (traits allumés). Pour un objet inconnu, rien (jamais de fuite).
- Sur la **carte d'objectif** du Domaine (« SCÉNARIO … »), une puce « Dans l'arbre » (ou un mot plus juste
  de `docs/LEXIQUE.md`) qui ouvre l'arbre centré sur l'objectif. Si la carte n'a pas la place, dis-le et
  propose une autre entrée.
- L'interrupteur Liste/Arbre du Carnet reste.

### 6. Ce qu'on ne touche pas

Les colonnes et les rangées de `catalogue()` ; les règles de `graphe()` (quels nœuds se voient) ; la forme du
panneau « ses ingrédients, ses usages » (seulement sa taille) ; le Carnet en liste ; `D.ITEMS` ; la
Mémoire des mains ; le moteur. Aucune donnée nouvelle dans la sauvegarde.

## Règles pour tout ce qui s'affiche

L'auteur reproche souvent au jeu un français qui sonne « écrit par une IA » ou traduit de l'anglais. Écris
comme quelqu'un qui parle : des choses concrètes, des phrases courtes ; aucun mot anglais de jeu (ni
« zoom », ni « rail » dans un texte : « de plus près », « de plus loin », « Aller à un âge ») ; pas de
« c'est / ça » en série, pas de triplets, **pas de tiret cadratin**, pas de formule vide. Tutoiement.
Vocabulaire de `docs/LEXIQUE.md` (« recette », « fiche », « âge » ; jamais « stock »). Il y aura très peu de
texte : la légende, les noms accessibles, « Voir dans l'arbre », « Dans l'arbre ». **Ne touche pas aux
textes du récit.** N'ouvre pas `docs/coffre/` ni `js/recit.js`. Ajoute une section « 0.14.0 » dans
`docs/revue/arbre.md` : une ligne par texte, avec l'endroit.

## Sauvegardes, tests, version

- **Ne jamais perdre une sauvegarde.** Aucun champ nouveau n'est nécessaire (la position de la vue peut
  rester en mémoire de session, comme aujourd'hui) ; s'il t'en faut un, valeur par défaut et validation dans
  `parseSave`.
- `D.VERSION = "0.14.0"` ; `D.CHANGES` : 2 ou 3 lignes claires pour le joueur (par exemple l'arbre en plein
  écran, le saut d'âge, le zoom qui change ce qu'on voit) ; mets à jour les assertions de version de
  `tools/test.js` ; `node tools/build.js` après chaque modification.
- Tests, dans `tools/test-arbre.js` (Node, sans DOM) : le niveau « loin » donne un nombre par âge égal au
  nombre de nœuds **allumés** de cet âge, et **n'expose** ni nom, ni icône, ni identifiant d'un objet inconnu ;
  les nœuds-carrefours sont déterministes et ne dépendent pas de l'état du joueur ; la mise en page n'a pas
  changé (positions identiques à celles de `main` pour les trois états de `tools/arbre-mesures.js` : calcule
  une empreinte des positions sur `main`, mets-la en constante, et vérifie-la). Dans `tools/test-ux.js`
  (Playwright, 390 × 844 et 320 × 568, thèmes Jour et Veillée, Grand texte) : l'arbre plein écran s'ouvre et
  se ferme ; la surface utile respecte 650 px (390 × 844) et 360 px (320 × 568) ; le rail saute à un âge et
  l'âge indiqué correspond ; chaque étiquette visible a au moins 11 px à l'écran à l'échelle « près » ; chaque
  bouton du haut a au moins 44 × 44 px ; « Voir dans l'arbre » depuis une fiche ouvre la vue centrée ; un
  appui sur un nœud allume ses traits et un second ouvre la fiche (comportement de la 0.13.2).

## Vérifications obligatoires

- `npm test` en entier ; `npm run test:ux` ; `node tools/arbre-mesures.js` et sa partie navigateur : mets
  **avant et après** côte à côte dans ton compte rendu (nœuds par écran, surface utile, plus petite police,
  plus petite cible) ; les chiffres « avant » viennent de `docs/revue/arbre-mesures.md`.
- `tools/golden-ui.js` : écris la référence **sur `main` avant ta première modification**, puis `check` à la
  fin. Seuls les écrans du Carnet (interrupteur), de la fiche d'un objet (nouveau bouton) et de la carte
  d'objectif du Domaine (nouvelle puce) peuvent différer ; explique chaque différence.
- Dans un vrai navigateur (Playwright, Chromium, 390 × 844 et 320 × 568, `serviceWorkers: "block"`, clé
  `eclat.save.v1`) : une partie neuve (l'arbre ne dit rien d'inconnu), la partie avancée
  `tools/fixtures/save-v5-age8-usine.json` (glisser, pincer si ton outil le permet, sinon dis que tu as
  utilisé les boutons, sauter d'âge au rail, toucher un nœud, ouvrir la fiche, « Voir dans l'arbre » depuis
  une fiche), la partie « tout connu » (états extrêmes), le thème Veillée et Grand texte,
  `prefers-reduced-motion`. **Regarde les captures toi-même.** Aucune erreur console.
- Essaie le geste de glissement du rail et celui de la vue **avec le toucher** (Playwright
  `hasTouch: true`) pour t'assurer que le défilement de la page ne vole pas le geste.

## Livraison

> **Livraison.** Travaille dans un clone du dépôt GitHub `0doacre/craftgame`, à jour
> (`git pull` sur `main` avant de commencer), jamais dans une copie ou un dossier temporaire.
> Crée une nouvelle branche au nom de la tâche : `t1-arbre-lisible-0-14-0`.
> Quand `npm test` passe en entier, **ouvre le jeu dans un vrai navigateur** avant de livrer :
> `npx http-server -p 8765 -c-1 .` à la racine du dépôt, puis `http://localhost:8765/` (au
> besoin avec Playwright). Le jeu doit se charger, la console ne doit montrer aucune erreur, et ce que tu
> as changé doit se voir et marcher à l'écran. Les tests ne chargent que le moteur : une erreur dans
> `js/ui.js` ou `js/domaine.js` peut passer les tests et casser tout le jeu (c'est arrivé en 5.5). Si tu ne
> peux pas ouvrir de navigateur, dis-le clairement dans ton compte rendu au lieu de livrer comme si c'était
> vérifié.
> Fais ensuite un commit qui dit ce que tu as changé, puis pousse la branche sur GitHub :
> `git push -u origin t1-arbre-lisible-0-14-0`. Ne touche pas à `main`, ne fusionne rien : la branche sera
> relue avant d'être intégrée. Termine en donnant le nom de la branche, la sortie de `npm test`, ce que tu
> as vérifié dans le navigateur, et ce que tu n'as pas pu faire.
>
> **Secrets.** L'auteur joue à l'aveugle : n'écris jamais une solution de secret, une combinaison de
> recette secrète, un code ou un air dans ton compte rendu, tes messages de commit ou `D.CHANGES`. Écris
> « une recette secrète », « un lieu caché », pas leur contenu. N'ouvre pas `docs/coffre/` ni
> `js/recit.js`.

Termine par `git log --oneline -3`, `git diff --stat main...t1-arbre-lisible-0-14-0`, la sortie de
`npm test` et de `npm run test:ux`, le tableau avant/après des mesures, les choix que tu as faits (retour
vers la vue Liste ou Arbre, seuils de zoom, calque ou étiquettes à contre-échelle, geste « retour »), et ce
que tu n'as pas pu faire.
