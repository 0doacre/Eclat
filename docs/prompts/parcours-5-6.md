# Prompt : le premier parcours (version 5.6.0)

Tu travailles sur **Éclat**, un jeu incrémental de craft en français, pour mobile (PWA,
JavaScript sans framework ni dépendance). Dépôt GitHub : `0doacre/craftgame`.

Lis d’abord, en entier : `docs/RENAISSANCES.md` (sections 3, 4 et 7 surtout),
`docs/PROGRESSION.md` (la relève), `docs/LEXIQUE.md` (les mots à employer), `README.md`.
Puis, dans le code : `E.newCycle`, `E.canReleve`, `E.releveGain`, `freshState`, `parseSave`
dans `js/engine.js` ; `intro()`, `confirmCycle()`, `openMemoire()` dans `js/ui.js` ;
`gisHTML` et `machinesView` dans `js/domaine.js` ; le chapitre `cabane` de `js/tuto.js`.

## Ta tâche

Trois choses, et seulement elles :

1. **La première renaissance obligatoire** (fin du tutoriel) ;
2. **les ruines** : ce qu’un Semeur a construit attend le suivant, à réparer ;
3. **les scènes d’éveil** des Semeurs 8, 9 et 10.

Ne touche **pas** au coût des passages ni au rythme du jeu (le « mur doux » de la section 2
sera réglé ensuite au simulateur), ni à la Mémoire des mains en arbre (section 6), ni au
Comptoir, ni aux machines.

### 1. Le parcours : seulement pour les nouvelles parties

- Une **nouvelle partie** (pas une relève) reçoit `S.meta.parcours = 1`. Attention :
  `E.newCycle()` part aussi de `freshState()` puis recopie `meta` ; c’est donc à la
  création d’une partie neuve qu’il faut poser le drapeau (`E.reset()`, et l’état de départ
  quand il n’y a aucune sauvegarde), pas dans `freshState()` sans précaution.
- Une sauvegarde existante n’a pas ce drapeau : **elle n’est jamais forcée à renaître**.
- Tout le reste de cette tâche (ruines, scènes) vaut pour tout le monde, sauf la
  renaissance obligatoire.

### 2. La première renaissance obligatoire

- Condition : `S.meta.parcours`, `S.cycle === 1`, au moins un extracteur posé
  (`S.flags.extDone`), et le premier lieu de la Lisière exploré (`S.exp.done.lisiere >= 1`).
- Alors une scène s’ouvre (fenêtre `persistent`, comme `intro()`) : la nuit tombe, le Semeur
  7 s’endort près de sa cabane, il sait qu’un autre viendra. Un seul bouton :
  **« Passer le relais »**. Avant : `pushBackup(...)` comme dans `confirmCycle()`.
- Cette relève ne vient pas d’un passage : `E.releveGain()` vaut 0. Donne un cadeau fixe
  `D.PARCOURS.gift` (3 Traces) pour que la Mémoire des mains ait quelque chose à acheter.
  Ajoute un `E.forcedReleve()` dans le moteur, testé, qui fait le cadeau puis `newCycle()`.
- Après la relève, la fenêtre de la Mémoire des mains s’ouvre (comme après une relève
  normale), puis la scène d’éveil du Semeur 8.
- Le drapeau qui dit « c’est fait » est dans `S.meta` : la scène ne revient jamais.

### 3. Les ruines

- `D.RUINES = { cap: 3, part: 0.1 }` dans `js/data.js`.
- À chaque relève (`newCycle`), pour chaque extracteur et chaque machine possédés, on retient
  `min(possédés, cap)` dans `S.meta.ruins = { id: n }`. Ce tableau **remplace** le précédent
  à chaque relève (pas de cumul).
- Au cycle suivant, une ruine se **répare** pour `part` du coût de base de sa recette
  (arrondi au supérieur, sans la hausse de prix par exemplaire des extracteurs). La
  réparation est immédiate (pas de file des mains), ajoute 1 à la Réserve, décrémente
  `S.meta.ruins[id]`, et pose l’extracteur tout de suite sur un gisement de sa terre
  (`E.domAutoExt`). API : `E.ruins()`, `E.ruinCost(id)`, `E.repair(id)` →
  `{ ok, why, missing }`.
- Domaine : sur chaque terre ouverte où il reste une ruine d’extracteur de cette terre, une
  ligne **« Cabane effondrée · réparer (4 manches, 2 cordes…) »** au-dessus des gisements,
  avec le bouton **Réparer**. Le nom vient d’un adjectif par défaut (« effondrée »,
  « rouillé »…) : prévois un champ `ruine` court dans les objets concernés, ou une règle
  simple. Onglet Machines : la même chose pour les machines (« Automate rouillé ·
  réparer »).
- Une terre pas encore ouverte garde ses ruines pour plus tard.
- Sauvegarde : `S.meta.ruins` validé dans `parseSave` (nombres entiers ≥ 0, objets connus
  seulement ; le reste est mis de côté comme ailleurs, jamais une erreur). Pas de
  changement de `SAVE_VERSION`.

### 4. Les scènes d’éveil

- `D.EVEILS` : un court texte pour l’éveil des Semeurs 8, 9 et 10 (cycles 2, 3, 4), utilisé
  par `intro()` à la place du texte générique quand il existe. Au-delà, le texte actuel.
- Le fil : le Semeur 8 trouve la cabane effondrée du 7 ; le 9 trouve, gravé sur un
  manche, un mot laissé par le 8 ; le 10 comprend qu’ils sont nombreux à être passés là.
  Chaque texte fait 3 à 5 phrases.
- **Ton** : celui des textes de `D.FRAGS` et de `D.INTRO` dans `js/data.js` : phrases
  courtes, concrètes, au présent, à la deuxième personne. Rien d’emphatique, pas de
  « mystérieux », « étrange », « soudain », pas de métaphores grandiloquentes, pas de
  tirets cadratins. Montre des objets et des gestes, ne nomme pas les émotions.
- Un chapitre du tutoriel (`js/tuto.js`) : la première fois qu’une ruine est visible, une
  bulle la montre et dit qu’elle se répare pour presque rien.

### 5. Version

- `D.VERSION = "5.6.0"` ; `D.CHANGES` : trois ou quatre phrases courtes.
- Aide (`openHelp`, « Les mots du jeu ») et `docs/LEXIQUE.md` : ajouter **Ruine**.
- Après **chaque** modification de fichier : `node tools/build.js`.

### 6. Tests (`tools/test.js`, même style)

Au minimum :
- une partie neuve a `meta.parcours` ; une sauvegarde chargée sans ce drapeau ne l’a pas, et
  n’est jamais forcée ;
- `forcedReleve()` : cycle 2, cadeau de Traces reçu, Carnet gardé, ne se refait pas ;
- ruines : après une relève avec 5 cabanes et 1 automate, `meta.ruins` vaut
  `{ cabane: 3, automate_bois: 1 }` ; réparer coûte bien `part` du prix, ajoute 1, pose la
  cabane, décrémente ; sans les matières, `ok: false` et `missing` ;
- une seconde relève remplace les ruines au lieu de les cumuler ;
- sauvegarde avec `meta.ruins` illisible : se charge, nettoyée.

## Règles

- **Ne jamais perdre une sauvegarde.** Aucun champ existant ne change de sens.
- Ne modifie pas les tests existants pour les faire passer.
- Code : même style que le reste. Pas de dépendance, pas de framework, pas de build.
- Textes affichés : français, tutoiement, mots de `docs/LEXIQUE.md`.

## Livraison

Travaille dans un clone du dépôt GitHub `0doacre/craftgame`, à jour (`git pull` sur
`main` avant de commencer), jamais dans une copie ou un dossier temporaire. Crée la
branche `gemini-parcours-5-6`.

Quand `npm test` passe en entier, **ouvre le jeu dans un vrai navigateur** avant de
livrer : `npx http-server -p 8765 -c-1 .` à la racine du dépôt, puis
`http://localhost:8765/` (au besoin avec Playwright). Vérifie au minimum :
- le jeu se charge, et la console ne montre aucune erreur ;
- une partie neuve (efface `localStorage`) : récolte, cabane posée, Grand Chêne exploré,
  la scène de la première renaissance s’ouvre, « Passer le relais » mène au Semeur 8 et à
  sa scène d’éveil ;
- la ruine de la cabane apparaît dans la Lisière, et se répare.

Les tests ne chargent que le moteur : une erreur dans `js/ui.js` ou `js/domaine.js` peut
passer les tests et casser tout le jeu (c’est arrivé en 5.5). Si tu ne peux pas ouvrir de
navigateur, dis-le clairement dans ton compte rendu.

Fais ensuite un commit qui dit ce que tu as changé, puis pousse la branche :
`git push -u origin gemini-parcours-5-6`. Ne touche pas à `main`, ne fusionne rien. Termine
en donnant le nom de la branche, la sortie de `npm test`, ce que tu as vérifié dans le
navigateur, et ce que tu n’as pas pu faire.
