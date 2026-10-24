# Prompt : l'arbre de connaissance (version 0.11.0)

Tu travailles sur **Éclat**, un jeu incrémental de craft en français, pour mobile (PWA, JavaScript sans
framework ni dépendance). Dépôt GitHub : `0doacre/craftgame`. Pars de `main` à jour.

## Le contexte

Une bêta-testeuse a dit : « dans ce genre de jeu, on s'attend à trouver un arbre ». Les incrémentaux et
les jeux de civilisation montrent presque tous un **arbre des connaissances** : des cases reliées par des
traits, ce qu'on sait, ce qu'on peut faire ensuite. Éclat a déjà tout ce qu'il faut dans ses données : chaque
objet à recette (`D.ITEMS[id].r = [geste, { ingrédient: quantité }, …]`) dépend d'autres objets, et chaque objet
a un âge (`a`, de 0 à 12). Le **Carnet** (dans l'Atelier) liste les recettes connues, mais il n'y a aucune vue
d'ensemble : on ne voit ni d'où l'on vient ni où l'on va.

Références visuelles que l'auteur a envoyées : l'arbre de technologies d'un jeu de civilisation (grandes cases
et étiquettes sur un fond de carte, traits fins entre elles), l'arbre de compétences d'Assassin's Creed, un arbre
en arborescence stylisé, une roue de compétences, l'arbre de Path of Exile (immense). À retenir : de **beaux
nœuds lisibles**, des **traits qui montrent la filiation**, un **centre qui montre où l'on est**, un fond qui
raconte (ici : les âges).

## Le principe, et la contrainte qui compte

Éclat se joue par la **découverte** : la joueuse tente des gestes avec des ressources et trouve elle-même les
recettes. L'arbre doit **donner envie de chercher sans dire quoi chercher**. Le modèle voulu par l'auteur est
celui de *Cell to Singularity* : des cases dont l'icône est **invisible**, reliées par un trait **pointillé et
translucide** à ce qu'on connaît. On voit qu'**il y a quelque chose**, mais **quoi ?**

Ce qui s'affiche, de plus clair à plus flou :
- Un nœud **allumé** : une recette connue (`S.known`). Icône, nom, traits pleins vers ses ingrédients.
- Une **matière brute** (sans recette) déjà vue (`S.seen`) : nœud simple, point de départ des traits.
- Un nœud **fantôme** : une recette **pas encore trouvée**. Une case vide, **sans icône, sans nom, sans silhouette
  qui trahisse l'objet** (même gabarit pour tous : pas de forme propre à l'objet), à peine teintée de la couleur de
  son âge, reliée par un **trait pointillé translucide** à l'ingrédient qui y mène. Le fantôme ne dit **ni ce que
  c'est, ni quel geste, ni quelles autres matières** : seulement « une recette part d'ici ».
- L'**objectif en cours** (`E.guide()` / `E.objective()`) : un fantôme **plus marqué** (liseré, légère pulsation),
  relié à ce que la joueuse connaît déjà ; il reste sans nom (le nom n'apparaît qu'une fois la recette trouvée ;
  l'objectif, lui, est déjà dit en haut de l'écran).

**Quels fantômes ?** C'est le point sensible : montrer tous les fantômes reviendrait à offrir gratuitement ce que
coûte l'**Intuition** (« Étudier » une ressource dit combien de recettes elle cache encore ; voir `E.reactions`,
`E.study`, `E.studyAll`). Règle par défaut, réglable dans une constante de données `D.ARBRE = { fantomes: "etudies" }` :
- `"etudies"` (défaut) : un fantôme n'apparaît que sur les ressources **étudiées** (`S.studied`), autant que
  `E.reactions(id)` en compte, et pour l'objectif en cours. Étudier devient ainsi visible dans l'arbre : « j'ai
  étudié cette ressource, trois traits pointillés en partent ».
- `"tous"` : un fantôme pour chaque recette dont **tous les ingrédients sont déjà vus** (le cas où l'auteur veut
  que ce soit gratuit). Dans les deux cas : **jamais** de fantôme pour un objet `sec` ni `curio` (les recettes
  secrètes n'existent pas à l'écran tant qu'elles ne sont pas connues), ni pour une recette dont un ingrédient est
  encore inconnu, ni au-delà des âges déjà atteints plus un.
Aucun autre indice ne doit fuiter : l'ordre des fantômes ne dépend pas de l'objet (positions tirées d'un rang
stable, pas d'un tri par nom), et leur nombre n'est jamais affiché.
- Une ressource **étudiée** porte en plus sa pastille « ✦ 3 » (le nombre de fantômes qui en partent).
- Le **fond** est l'arbre des âges : 13 bandes (`D.AGES`, avec leur couleur `c` et leur nom), de l'Âge du Bois en
  bas à l'Âge Stellaire en haut (ou de gauche à droite, à toi de choisir ce qui marche le mieux sur un
  téléphone en portrait ; justifie-le). Les bandes d'âges pas encore atteints sont **grisées et vides**.

## Où le mettre, et ce qu'on y fait

- Dans l'Atelier, **Carnet** : un interrupteur « Liste / Arbre » en haut. La liste reste inchangée. (Si tu
  trouves un meilleur emplacement, dis lequel et pourquoi ; ne duplique pas le Carnet.)
- On **déplace** l'arbre au doigt (glisser), on **zoome** (pincer, et boutons + / − / « Centrer ») ; la vue
  s'ouvre **centrée sur l'objectif en cours**, ou sur la dernière découverte.
- **Toucher un nœud** ouvre la fiche de l'objet, comme partout ailleurs dans le jeu (le mécanisme existant :
  `data-goto` / `openRecipe`, voir `js/atelier.js`). Un fantôme, lui, n'ouvre rien (voir plus bas).
- En haut : un compteur sobre (« 37 recettes trouvées ») **sans total** : on ne dit pas combien il en reste. Toucher un fantôme n'ouvre pas de fiche : un petit message dit seulement « Pas encore trouvée. Tente des gestes avec ce qui l'entoure. » (à reformuler court, dans le ton du jeu).
- **Nouvelle découverte** : le nœud apparaît avec un petit éclat (une fois), le trait vers ses ingrédients se
  dessine. Respecte le réglage « réduire les animations » (alors : simple apparition). Pas de son nouveau.
- Les nœuds sont de **vrais boutons** (`<button>`, `aria-label` = le nom, focus clavier visible), de 44 px au
  moins au zoom normal. Les âges sont lisibles même à 320 px de large.

## Comment le construire (propre et testable)

Suis le modèle de `js/constellations.js` et `tools/test-figures.js` : **la mise en page est une fonction pure**
(testable dans Node, sans DOM), le rendu est à part.
- Nouveau fichier `js/arbre.js`, `window.EclatArbre = { graphe, mise_en_page, rendu }` (ou la forme que tu
  juges la plus propre), chargé dans `index.html` avant `js/ui.js` et listé dans `sw.js` (`node tools/build.js`
  met le hash à jour ; regarde comment les autres modules sont déclarés).
- `graphe(E, D)` : à partir de l'état du joueur, renvoie **uniquement** les nœuds et les traits visibles selon
  les règles ci-dessus. C'est la seule fonction qui décide de ce qui se voit.
- `mise_en_page(graphe, D)` : positions **déterministes** (un nœud ne bouge pas quand un autre apparaît :
  dérive-les d'un rang stable dans le catalogue, comme le fait `constellations.js` avec un hachage FNV-1a de
  l'identifiant) ; les nœuds d'un même âge sont répartis dans leur bande, sans chevauchement, en réduisant
  les croisements de traits (tri par barycentre des ingrédients, par exemple). Doit tenir en moins de 100 ms
  pour les 200 objets.
- Rendu en **SVG** (nœuds en HTML par-dessus ou `foreignObject` si tu en as besoin pour les boutons ; ne
  redessine que si quelque chose change : évènement `struct` du moteur, comme `figuresHTML`). Pas de dépendance.
- L'intégration (l'interrupteur, le conteneur, les écouteurs) va dans `js/atelier.js` (Carnet) ; rien de plus
  dans `js/ui.js` que ce qui est nécessaire à brancher le module.

## Deuxième temps (facultatif, seulement si le premier est solide)

Les améliorations de la **Mémoire des mains** (`D.MEMOIRE`, `D.TRANSCENDANCE`, les dons de `D.DONS`) sont aussi
des « compétences » : présente-les en **arbre ramifié** (branches : Mains, Terre, Machines, Départ…) dans
l'écran de la Mémoire (`js/memoire.js`), sans toucher ni aux coûts ni aux effets ni aux règles : seulement la
manière de les montrer (nœuds reliés par branche, niveau atteint sur chaque nœud, le prochain palier en
surbrillance). Garde la liste actuelle accessible.

## Règles pour tout ce qui s'affiche (importantes)

L'auteur reproche souvent au jeu un français qui sonne « écrit par une IA » ou traduit de l'anglais. Écris
comme quelqu'un qui parle : des choses concrètes, des phrases courtes ; aucun mot anglais de jeu (skill, tree,
unlock, buff, perk…) — ici on dit **recette**, **connaissance**, **âge**, **fiche** ; pas de « c'est / ça » en
série, pas de triplets, pas de tiret cadratin, pas de formule vide. Tutoiement. Vocabulaire de
`docs/LEXIQUE.md` (« déposer », jamais « verser » ; « Réserve » ; jamais « stock »). Il y aura très peu de texte :
un interrupteur, un compteur, des étiquettes d'âge (déjà dans les données). **Ne touche pas aux textes du
récit.** N'ouvre pas `docs/coffre/` ni `js/recit.js`. Liste les textes que tu ajoutes dans
`docs/revue/arbre.md` (une ligne par texte, avec l'endroit).

## Sauvegardes, tests, version

- **Ne jamais perdre une sauvegarde.** Aucun nouveau champ n'est nécessaire (l'arbre se calcule sur l'état) ;
  s'il t'en faut un (par exemple la position de la vue), valeur par défaut et validation dans `parseSave`.
- Tests (un fichier `tools/test-arbre.js`, lancé depuis `tools/test.js` comme `test-figures.js`), avec des états
  construits dans le test :
  - **aucune fuite** : pour une partie neuve, puis une partie avancée, ni le nom, ni l'icône, ni l'id d'un objet
    inconnu n'apparaît dans les données de rendu (un fantôme a un identifiant anonyme qui ne se déduit pas de
    l'objet : par exemple un numéro de série dans l'ordre d'apparition, pas l'id de l'objet) ; aucun objet `sec`
    ni `curio` inconnu, même comme fantôme ; aucun trait vers un nœud absent ;
  - en mode `"etudies"`, aucun fantôme sur une ressource non étudiée (hors objectif) ; en mode `"tous"`, un
    fantôme par recette inconnue dont tous les ingrédients sont vus, rien d'autre ;
  - un fantôme et un nœud allumé de même âge ont le même gabarit (pas de forme qui trahisse l'objet) ;
  - positions **stables** (un nouveau nœud ne déplace pas les autres) et **sans chevauchement** ;
  
  - durée de la mise en page < 100 ms sur une partie qui connaît toutes les recettes ;
  - une sauvegarde ancienne (`tools/fixtures/`) se charge et produit un arbre.
- `D.VERSION = "0.11.0"` ; `D.CHANGES` : 2 ou 3 lignes claires pour le joueur ; mets à jour les assertions de
  version de `tools/test.js`. `node tools/build.js` après chaque modification.

## Vérifications obligatoires

- `npm test` en entier ; `PW=$(npm root -g)/playwright node tools/smoke-ui.js` (serveur : `npx http-server -p 8765 -s -c-1 .`).
- `tools/golden-ui.js` : écris la référence **sur `main` avant ta première modification**, puis `check` à la
  fin ; seuls les écrans du Carnet (là où l'interrupteur apparaît) doivent différer, et tu expliques chaque
  différence. Tout autre écran doit rester identique.
- Dans un vrai navigateur (Playwright, Chromium, 390×844 et 320×568, `serviceWorkers: "block"`, clé
  `eclat.save.v1`) : une partie neuve (l'arbre est presque vide et ne dit rien d'inconnu), une partie avancée
  (`tools/fixtures/save-v5-age8-usine.json` : glisser, zoomer, toucher un nœud, la fiche s'ouvre), puis une
  découverte en direct. Regarde les captures toi-même. Aucune erreur console.

## Livraison

Suis la **consigne de livraison** de `docs/prompts/README.md` (avec la règle « Secrets »), branche
`deepseek-arbre-0-11`. Dans ton compte rendu : les commits, le résultat des tests, ce que tu as vu dans le
navigateur (avec le choix d'orientation de l'arbre et pourquoi), ce que tu n'as pas pu faire.
