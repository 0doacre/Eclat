# Prompt : les fenêtres du lancement et du retour d'absence (lot N1, version 0.13.3)

Tu travailles sur **Éclat**, un jeu incrémental de craft en français, pour mobile (PWA, JavaScript
sans framework ni dépendance). Dépôt GitHub : `0doacre/craftgame`. Pars de `main` à jour.

Lis d'abord : `docs/STYLE.md`, `docs/LEXIQUE.md`, `docs/AUDIT-UX-CASUAL-2026-10-24.md`, puis dans le code :
`js/ui.js` (`openModal`, `simpleModal`, `showOffline`, `showNews`, `intro`, `showBadSave`, la séquence de
démarrage vers la ligne 1105), `js/ecouteurs.js` (l'évènement `offline`, vers la ligne 232), `js/tuto.js`
(la bulle : `mount`, `place`, `band`), `css/style.css` (`.tu-spot`, `.tu-bub`), `tools/test-ux.js`.

## Le contexte

Trois défauts ont été observés dans le jeu (version 0.13.2, écran de téléphone 390 × 844) :

1. **Une absence d'une minute ouvre une fenêtre qui bloque tout.** `js/ecouteurs.js` : l'évènement `offline`
   fait `if (o.dt < 60) return;` puis prépare `U.offline`, que `showOffline()` affiche. Sur téléphone, passer
   dans une autre application suffit : au retour, une fenêtre « Pendant ton absence · 1 min » demande un appui
   avant de pouvoir jouer.
2. **Les fenêtres s'empilent au lancement.** Avec une partie qui revient d'une version précédente, le
   joueur voit successivement la fenêtre des nouveautés, la fenêtre de retour d'absence, puis une bulle de
   tutoriel : trois interruptions avant la première action.
3. **Une bulle de tutoriel a empêché de changer d'onglet.** Avec la bulle « Un morceau d'histoire » affichée
   (elle pointait l'onglet Journal), un appui sur l'onglet Carnet n'a rien fait. La cause n'est **pas
   établie** : le projecteur (`.tu-spot`) a `pointer-events: none`, la bulle (`.tu-bub`) a
   `pointer-events: auto`. À toi de la trouver (recouvrement par la bulle, couche invisible, gestionnaire
   qui absorbe l'appui…).

Une autre bulle (« L'Intuition… ») se pose juste sous l'en-tête et masque le haut du contenu : à traiter
seulement si c'est simple, sinon note-le dans ton compte rendu.

## Ce qu'il faut faire

### 1. Une file d'attente des fenêtres automatiques

- **Inventaire d'abord.** Liste (dans ton compte rendu) tous les appels à `openModal` et `simpleModal`, et
  distingue ceux que **le joueur déclenche** d'un appui (menu, fiche, Mémoire, confirmation) de ceux que **le
  jeu ouvre tout seul** (démarrage, retour d'absence, nouveautés, sauvegarde illisible, première relève…).
  La file ne concerne **que les secondes** ; les autres s'ouvrent tout de suite comme aujourd'hui.
- Une seule fonction d'entrée, par exemple `fenetreAuto(priorite, ouvre)`, qui : n'ouvre jamais une fenêtre
  automatique pendant qu'une autre est ouverte ; garde les suivantes en attente dans l'ordre de priorité ;
  ouvre la suivante environ 250 ms après la fermeture de la précédente (une pause, pas un empilement).
- Ordre de priorité, du plus pressé au moins pressé : sauvegarde illisible, présentation (`intro`),
  nouveautés d'une version, retour d'absence, le reste.
- Au démarrage : **une fenêtre automatique au plus à la fois**, et jamais une bulle de tutoriel tant
  qu'une fenêtre automatique est ouverte ou en attente (la bulle attend la fin de la file).
- Si le joueur ferme une fenêtre avec « Continuer », la suivante peut s'ouvrir ; si le jeu est mis en
  veille puis rouvert, la file ne s'accumule pas (une même fenêtre n'est jamais en attente deux fois).

### 2. Le seuil du retour d'absence

- `showOffline` ne s'ouvre en fenêtre que si l'absence dure **300 secondes ou plus** (5 minutes). Définis la
  valeur dans une constante nommée en tête de `js/ui.js` ou de `js/ecouteurs.js` (par exemple
  `ABSENCE_FENETRE = 300`), pas en dur au milieu d'une fonction.
- Garde la règle existante : pas de fenêtre s'il n'y a ni gain ni exploration et que l'absence dure moins de
  600 s.
- Entre 60 et 300 secondes, **aucune fenêtre** : un message discret (`toast`) d'une ligne, avec les deux
  gains les plus grands (par exemple « Pendant ton absence : +810 Bois, +432 Fibres »), avec une clé
  (`key`) pour qu'il ne s'empile pas. En dessous de 60 secondes, rien comme avant. Écris le texte au format
  du jeu (`fmt` pour les quantités, le nom de l'objet vient des données).
- Rien ne change dans ce que le moteur crédite pendant l'absence : seul l'affichage est concerné.

### 3. Les onglets et les bulles

- **Reproduis le défaut 3** avant de le corriger : un test qui affiche une bulle pointant un onglet, appuie
  sur un autre onglet, et vérifie que l'onglet change. Donne la cause dans ton compte rendu.
- **Règle** : pendant toute bulle de tutoriel, un appui sur n'importe lequel des cinq onglets change
  d'onglet. Si la bulle recouvre la barre (`#tabs`) ou l'en-tête (`#top`), elle est repositionnée dans la bande
  libre (`band()` dans `js/tuto.js` donne déjà `lo` et `hi`). La bulle ne sort jamais de cette bande, sauf si
  elle ne peut pas y tenir (alors elle réduit son texte ou passe en pastille 💭 comme le fait déjà la bulle
  réduite).
- Le bouton « Passer » de la bulle reste atteignable à 320 × 568.

## Règles pour tout ce qui s'affiche

L'auteur reproche souvent au jeu un français qui sonne « écrit par une IA » ou traduit de l'anglais. Écris
comme quelqu'un qui parle : des choses concrètes, des phrases courtes ; aucun mot anglais de jeu ; pas de
« c'est / ça » en série, pas de triplets, **pas de tiret cadratin**, pas de formule vide. Tutoiement.
Vocabulaire de `docs/LEXIQUE.md` (« déposer », jamais « verser » ; « Réserve » ; jamais « stock »). Il y aura
**très peu de texte** : le message discret du retour d'absence. **Ne touche pas aux textes du récit.**
N'ouvre pas `docs/coffre/` ni `js/recit.js`. Liste les textes ajoutés dans `docs/revue/fenetres.md` (une
ligne par texte, avec l'endroit).

## Sauvegardes, tests, version

- **Ne jamais perdre une sauvegarde.** Aucun nouveau champ n'est nécessaire. La file d'attente ne
  s'enregistre pas.
- `D.VERSION = "0.13.3"` : c'est une correction (même version mineure : la fenêtre des nouveautés ne se
  rouvre pas, voir le commentaire dans `js/ui.js` vers la ligne 1107). Une ligne dans `D.CHANGES` si le
  fichier garde un historique par version ; mets à jour les assertions de version de `tools/test.js` ;
  `node tools/build.js` après chaque modification (sans lui, le service worker ne distribue pas la mise à
  jour).
- Tests, dans `tools/test-ux.js` (Playwright ; profils jetables ; mêmes réglages que `save(...)`, mais avec
  `tuto: true` quand il faut une bulle) :
  - une partie avancée dont `flags.ver` est ancien, ouverte à 390 × 844 : à chaque instant **au plus une
    fenêtre** est visible (`#modal` ou équivalent : lis `openModal` pour le sélecteur), et la bulle de tutoriel
    n'apparaît pas tant que la file n'est pas vide ;
  - une absence simulée de **90 s** n'ouvre aucune fenêtre (un message discret apparaît s'il y a des gains) ;
  - une absence simulée de **400 s** ouvre « Pendant ton absence » ;
  - pendant une bulle de tutoriel, un appui sur **chacun des cinq onglets** change d'onglet, à 390 × 844 et à
    320 × 568 ;
  - la bulle ne recouvre ni `#tabs` ni `#top` (les rectangles ne se coupent pas) pour au moins trois étapes
    différentes du tutoriel que tu sais déclencher. Si certaines étapes ne peuvent pas être forcées, dis
    lesquelles.
- Dans `tools/test.js`, si possible sans navigateur : un test de la fonction de file (ordre des priorités,
  une fenêtre à la fois, pas de doublon) en extrayant la logique dans une fonction pure.

## Vérifications obligatoires

- `npm test` en entier ; `npm run test:ux` (Playwright) ; `PW=$(npm root -g)/playwright` si besoin.
- `tools/golden-ui.js` : écris la référence **sur `main` avant ta première modification**, puis `check` à la
  fin. Seuls les écrans qui montraient une fenêtre de retour ou des nouveautés peuvent différer ; explique
  chaque différence.
- Dans un vrai navigateur (390 × 844 et 320 × 568, `serviceWorkers: "block"`, clé `eclat.save.v1`) : une
  partie neuve, la partie avancée `tools/fixtures/save-v5-age8-usine.json` avec une version ancienne, puis un
  retour après 90 s et après 400 s (modifie `st.t` dans la sauvegarde, comme le fait `tools/test-ux.js`).
  Regarde les captures toi-même. Aucune erreur console.

## Livraison

> **Livraison.** Travaille dans un clone du dépôt GitHub `0doacre/craftgame`, à jour
> (`git pull` sur `main` avant de commencer), jamais dans une copie ou un dossier temporaire.
> Crée une nouvelle branche au nom de la tâche : `n1-fenetres-0-13-3`.
> Quand `npm test` passe en entier, **ouvre le jeu dans un vrai navigateur** avant de livrer :
> `npx http-server -p 8765 -c-1 .` à la racine du dépôt, puis `http://localhost:8765/` (au
> besoin avec Playwright). Le jeu doit se charger, la console ne doit montrer aucune erreur, et ce que tu
> as changé doit se voir et marcher à l'écran. Les tests ne chargent que le moteur : une erreur dans
> `js/ui.js` ou `js/domaine.js` peut passer les tests et casser tout le jeu (c'est arrivé en 5.5). Si tu ne
> peux pas ouvrir de navigateur, dis-le clairement dans ton compte rendu au lieu de livrer comme si c'était
> vérifié.
> Fais ensuite un commit qui dit ce que tu as changé, puis pousse la branche sur GitHub :
> `git push -u origin n1-fenetres-0-13-3`. Ne touche pas à `main`, ne fusionne rien : la branche sera
> relue avant d'être intégrée. Termine en donnant le nom de la branche, la sortie de `npm test`, ce que tu
> as vérifié dans le navigateur, et ce que tu n'as pas pu faire.
>
> **Secrets.** L'auteur joue à l'aveugle : n'écris jamais une solution de secret, une combinaison de
> recette secrète, un code ou un air dans ton compte rendu, tes messages de commit ou `D.CHANGES`. Écris
> « une recette secrète », « un lieu caché », pas leur contenu. N'ouvre pas `docs/coffre/` ni
> `js/recit.js`.

Termine par `git log --oneline -3`, `git diff --stat main...n1-fenetres-0-13-3`, la sortie de `npm test`
et de `npm run test:ux`, l'inventaire des fenêtres (automatiques ou déclenchées), la cause du défaut 3, et
ce que tu n'as pas pu faire.
