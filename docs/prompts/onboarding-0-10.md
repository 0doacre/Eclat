# Prompt : un début de partie plus lent, plus clair, plus vivant (version 0.10.0)

Tu travailles sur **Éclat**, un jeu incrémental de craft en français, pour mobile (PWA, JavaScript
sans framework ni dépendance). Dépôt GitHub : `0doacre/craftgame`. Pars de `main` à jour.

## Le contexte (retours de la bêta)

Les premières joueuses, surtout celles qui n'ont jamais joué à un incrémental, décrochent au début :
- **Ça va trop vite.** Les premières terres (Lisière, Plaine, Rivière, Collines) se traversent en
  une vingtaine de minutes. On n'a pas le temps d'explorer, de lire, de comprendre ce qu'on vient de faire.
- **Trop d'informations d'un coup.** Trop de texte, trop de boutons, trop de nombres dès les premières minutes.
- **Pas assez de plaisir immédiat.** Le jeu manque de « juice » : peu de retours visuels, sonores, tactiles
  quand on réussit quelque chose.
- **La renaissance n'est pas comprise.** Quand on « passe le relais » (la relève), la joueuse a
  l'impression de **recommencer une nouvelle partie** et de tout perdre. Il faut dire, et montrer, ce qui reste.

Tu fais quatre chantiers, dans cet ordre. Lis d'abord `README.md`, `docs/STYLE.md`, `docs/LEXIQUE.md`
et `docs/PROGRESSION.md`.

## Où est quoi

`js/ui.js` est un noyau (état `U`, fenêtres, render, boucle) ; le reste de l'interface est dans
`js/atelier.js` (établi, Carnet, fiches d'objets), `js/journal.js` (Journal, Cosmos), `js/memoire.js`
(éveil, relève, dons, Mémoire des mains, fins), `js/quetes.js` (carte d'objectif, étapes, Quêtes),
`js/compte.js` (menu, sauvegardes, compte), `js/domaine.js`, `js/carte.js`, `js/tuto.js`
(tutoriel par chapitres), `js/ecouteurs.js`. Chaque module est de la forme `window.EclatXxx.create(api)`.
Le moteur est `js/engine.js` (aucun DOM), les données `js/data.js` (`D.OBJECTIVES`, `D.PASSAGES`, `D.ZONES`,
`D.MEMOIRE`…). **N'ouvre pas `docs/coffre/` ni `js/recit.js` et ne touche pas aux textes du récit**
(fragments, Livre, signes, fins, voix, Troqueur, clins d'œil) : l'auteur joue à l'aveugle, ce contenu
n'est pas pour toi.

## 1. Ralentir les premières terres, pour explorer

Objectif : au premier passage de jeu, sans Mémoire des mains (cycle 1), viser environ **Plaine 6 à 8 min,
Rivière 18 à 22 min, Collines 32 à 38 min, Profondeurs 55 à 65 min** (aujourd'hui : 3, 10, 19, 39). Mesure
avec `node tools/sim-passages.js --compare --minutes 180` (avant/après, colonne « aucune »). Les parties
suivantes (avec Mémoire et dons) ne doivent pas devenir plus longues de plus de 15 % : le rythme des
relèves ne doit pas casser (`--cycles 6`).

Comment (à toi de choisir, dans cet esprit, en expliquant ton choix) :
- Ce qui ralentit le plus agréablement, c'est de **donner plus à faire au même endroit**, pas d'allonger
  l'attente : ouvrir un passage demande d'avoir **exploré les lieux de la terre actuelle** (`D.ZONES[*].exps`,
  sauf les lieux cachés), en plus du coût en matières. Ça laisse le temps de lire les fragments.
- Les durées des premières explorations (`dur`) peuvent monter un peu (de 15 à 60 s, pas plus de 3 minutes
  avant la Rivière), car elles avancent seules pendant qu'on fait autre chose.
- Les coûts des premiers passages (`D.PASSAGES[*].cost`, `tr`) ne montent que modérément.
- Une joueuse qui n'a jamais rien exploré doit toujours voir **quoi faire ensuite** (l'objectif, en haut,
  le dit) : jamais de mur sans explication.
Les objectifs de `D.OBJECTIVES` peuvent être réordonnés ou complétés (une exploration de plus avant un
passage, par exemple). **Ne casse aucun test du scénario ni la progression des anciennes sauvegardes** :
une sauvegarde déjà avancée garde ses terres ouvertes et ce qu'elle a versé.

## 2. Moins d'informations d'un coup

- Fais l'inventaire de ce que voit une joueuse pendant les **15 premières minutes** (écran par écran :
  Domaine, Atelier, Carte, fenêtres, toasts, bulles du guide, pastilles du haut) et **retire ou diffère** ce
  qui n'a pas de sens encore : une pastille, un bouton, une ligne de nombres, une fenêtre. Le principe :
  *une chose nouvelle à la fois*, et l'interface se révèle au fil du jeu (elle le fait déjà en partie).
- **Raccourcis les textes d'interface du début** (objectifs `D.OBJECTIVES` des 12 premiers, textes des
  toasts, bulles de `js/tuto.js`, fenêtres) : une phrase, un geste, pas de jargon. Ne rajoute pas de texte :
  si tu ajoutes une explication, retire-en une autre.
- Les messages qui arrivent en rafale (toasts, bulles, fenêtres qui se suivent) doivent s'espacer : une
  seule à la fois, la suivante après un moment ou après un geste du joueur.
- Ne touche pas aux fragments ni aux textes d'histoire.

## 3. Du juice

Ajoute des retours de plaisir, courts et discrets, aux moments où la joueuse réussit quelque chose :
première fabrication d'un objet, première découverte (le thermomètre qui passe à « brûlant »), fin d'une
exploration, passage ouvert (la nouvelle terre « s'allume » sur la carte), première cabane posée,
changement d'âge, premier gain d'Intuition, relève. Boîte à outils déjà là : `fete(...)` (carte de
célébration), `sparks(x, y, n, couleur)`, `floater(texte, x, y)`, les sons de `js/audio.js` (`A.*`), `vibe(ms)`,
les animations CSS. Règles :
- Ne bloque jamais la main : aucune animation de plus de 2 s, rien ne recouvre une zone tactile, rien
  n'oblige à attendre.
- Respecte les réglages **Son**, **Vibrations** et `prefers-reduced-motion` (sans animation : un simple
  changement de couleur, pas de mouvement).
- Un nombre qui monte fait un petit « tic » (pas de compteur qui défile pendant des secondes).
- Pas de confettis ni de feux d'artifice avant les vrais grands moments (changement d'âge, relève).

## 4. La renaissance doit se comprendre

Quand la joueuse passe le relais (la relève, `E.newCycle`, `js/memoire.js`), elle doit **comprendre que ce
n'est pas une nouvelle partie**. Montre-le dans trois endroits, avec **de vrais chiffres tirés de sa partie** :

1. **Avant** (la fenêtre qui précède la relève, et l'endroit qui la déclenche) : deux colonnes très courtes,
   « Tu gardes » (tes recettes : N connues, tes Traces, ta Mémoire des mains, le Journal et ses pages, tes
   signes compris) et « Tu repars sans » (la Réserve, les extracteurs, les terres ouvertes, ce qui est en cours
   de fabrication), puis une ligne « Tu gagnes : N ✦ Traces » (valeur de `E.releveGain()`) et ce qu'elles
   achètent (la Mémoire des mains). Une phrase qui dit pourquoi : « Le suivant ne repart pas de rien : il
   a tout ce que tu as appris. » (ou mieux, mais court).
2. **Juste après**, à l'éveil : une carte de bienvenue du nouveau Semeur : « Tes N recettes sont déjà dans
   le Carnet », « Tes ruines t'attendent : les réparer coûte presque rien », « Tes Traces t'attendent dans la
   Mémoire ». Une seule fenêtre, une seule idée par ligne, un bouton.
3. **La toute première relève** (cycle 1 → 2) reçoit en plus un chapitre du guide (`js/tuto.js`) qui montre
   le bouton de relève et dit en une phrase de quoi il s'agit, avec le mot « relève » **et** son sens simple
   (« recommencer en gardant ce que tu sais »).
Le bouton garde son nom diégétique (« Passer le relais » ; voir `docs/LEXIQUE.md`). Ne change rien à la
mécanique de la relève ni à ses règles : seulement ce qu'on en dit et ce qu'on en montre. Ne touche pas à la
relève obligatoire du premier cycle ni à ce qui en est raconté (récit).

## Règles pour tout ce qui s'affiche (importantes)

L'auteur a plusieurs fois reproché au jeu un français qui sonne « écrit par une IA » ou traduit de l'anglais.
Écris comme quelqu'un qui parle :
- Des choses concrètes, des phrases courtes. Les noms propres du jeu sont des choses ou des lieux, pas des
  slogans. Aucun mot anglais de jeu (buff, boost, bonus, streak, reroll, loot, reset, checkpoint).
- Pas de « c'est / ça » en série, pas de triplets (« rapide, simple et efficace »), pas de tiret cadratin, pas
  de morale, pas de point d'exclamation sauf nécessité, pas de formule vide (« n'hésite pas à », « il est
  important de »). Tutoiement. Vocabulaire de `docs/LEXIQUE.md` (« déposer » et jamais « verser » ; « Réserve » ;
  jamais « stock »).
- Un texte qui ne dit rien de précis ne sert à rien : supprime-le plutôt que de le reformuler.
- Avant de livrer, **liste tous les textes visibles que tu ajoutes ou changes** dans
  `docs/revue/onboarding.md` : une ligne par texte, avec l'endroit où il apparaît. L'auteur les relira.

## Sauvegardes, tests, version

- **Ne jamais perdre une sauvegarde.** Tout nouveau champ d'état a une valeur par défaut et est validé dans
  `parseSave` (illisible : remis à zéro). Si tu dois augmenter `SAVE_VERSION`, écris la migration et son test.
  Les fixtures de `tools/fixtures/` doivent toutes se charger.
- Ajoute des tests dans `tools/test.js` pour ce qui est du moteur (conditions d'ouverture d'un passage,
  chiffres de la relève). Ne modifie pas les tests existants, sauf si une règle change volontairement : explique-le.
- `D.VERSION = "0.10.0"` ; `D.CHANGES` : 3 à 5 lignes claires pour le joueur (pas de jargon de développeur) ;
  mets à jour les assertions de version dans `tools/test.js`.
- `node tools/build.js` après chaque modification (le hash du service worker).

## Vérifications obligatoires

- `npm test` en entier, `PW=$(npm root -g)/playwright node tools/smoke-ui.js` (serveur : `npx http-server -p 8765 -s -c-1 .`).
- Dans un **vrai navigateur** (Playwright, Chromium, viewport 390×844 et 320×568, `serviceWorkers: "block"`,
  clé de sauvegarde `eclat.save.v1`) : une **partie neuve** jouée pendant 10 minutes, avec captures
  regardées par toi (qu'est-ce qui apparaît quand ? y a-t-il trop de choses ?), puis une **relève** complète
  (par exemple depuis `tools/fixtures/save-v5-age8-usine.json`) avec la fenêtre « avant » et la carte
  « après ». Aucune erreur console.
- `tools/sim-passages.js` avant et après : colle les deux tableaux dans ton compte rendu.

## Livraison

Suis la **consigne de livraison** de `docs/prompts/README.md` (avec la règle « Secrets »), branche
`deepseek-onboarding-0-10`. Dans ton compte rendu : les commits, le tableau du simulateur avant/après, la
liste des écrans/pastilles/textes que tu as différés ou raccourcis, ce que tu as vu dans le navigateur, et ce
que tu n'as pas pu faire.
