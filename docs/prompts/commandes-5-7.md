# Prompt : les commandes (version 5.7.0)

Tu travailles sur **Éclat**, un jeu incrémental de craft en français, pour mobile (PWA,
JavaScript sans framework ni dépendance). Dépôt GitHub : `0doacre/craftgame`.

## À lire d’abord

- `docs/COMMANDES.md`, **en entier** : c’est ta spécification ;
- `docs/LEXIQUE.md` et `README.md` ;
- dans `js/engine.js` : `E.plan`, `E.maxPlan`, `E.queue`, `E.cancelJob`, `handStep`,
  `jobTime`, `E.handInfo`, `runMachine`, `E.machCan`, `E.automatable`, `E.domAutoExt`,
  `E.startAct`, et la validation de `S.hand` et `S.dom` dans `parseSave` (`checkHand`,
  `checkDom`) ;
- dans `js/ui.js` et `js/domaine.js` : `craftBtns`, `craftFrom`, `handQueue`, `actBar`,
  `handsSheet`, `machinesView`, `domaineMachinesSummary`.

## Ta tâche

Mettre en place les commandes décrites dans `docs/COMMANDES.md` :
- `E.order(id, n)` ;
- les machines au repos qui avancent les étapes des commandes ;
- la règle « la première fois à la main » ;
- les matières premières prises au fur et à mesure ;
- les extracteurs au repos posés sur le gisement qui manque ;
- la disparition des groupes fixés (sans rien perdre) et de ⟳ En boucle ;
- l’interface (boutons ×10 à ×1000, barre « Fabrication », onglet Machines = commandes).

Garde le code existant quand il sert : la file des mains devient la file des commandes, ne
la réécris pas de zéro.

## Version

- `D.VERSION = "5.7.0"`, `D.CHANGES` : trois ou quatre phrases courtes. L’une dit que les
  machines ne sont plus fixées sur une recette : elles aident désormais toutes les
  fabrications.
- Mets à jour l’aide (`openHelp`), `docs/LEXIQUE.md` (Machine, Commande) et `README.md`.
- Le simulateur `tools/sim.js` utilise `E.domMachAdd` : adapte-le aux commandes pour qu’il
  tourne encore (`node tools/sim.js` sans erreur).
- Après **chaque** modification de fichier : `node tools/build.js`.

## Tests (`tools/test.js`, même style)

Au minimum :
- une commande ×10 sans machine : les mains font tout, comme avant ;
- avec un automate de bois au repos : il prend les étapes à 1 ingrédient déjà faites à la
  main, la commande finit plus vite qu’avec les mains seules ;
- une recette jamais fabriquée : seules les mains la font (et avec `firstByHand: false`,
  la machine peut) ;
- une commande qui manque de bois attend, puis reprend quand le bois arrive ; une cabane
  au repos est posée sur le bois ;
- annuler une commande rend tout ce qui est sur son établi ;
- une ancienne sauvegarde avec des groupes de machines (`tools/fixtures`, et une partie
  fabriquée dans le test) se charge : groupes retirés, ce qu’ils avaient en main revenu à la
  Réserve, machines toujours possédées ;
- sauvegarde puis rechargement au milieu d’une commande : elle reprend où elle en était ;
- hors ligne : une commande avance pendant l’absence.

Les tests existants qui vérifient les groupes fixés (`domMachAdd`, état `"tier"`,
profondeur) n’ont plus d’objet : remplace-les par des tests équivalents sur les commandes,
et liste-les dans ton compte rendu. Ne modifie aucun autre test existant.

## Règles

- **Ne jamais perdre une sauvegarde.** Ce que les machines avaient en main, ce qui est sur
  un établi, les machines possédées : tout doit rester ou revenir à la Réserve.
- Code : même style que le reste (fonctions courtes, `const`, commentaires en français,
  rares et utiles). Pas de dépendance, pas de framework, pas de build.
- Textes affichés : français, tutoiement, mots de `docs/LEXIQUE.md`. Un bouton dit ce qu’il
  fait. Pas de tiret cadratin, pas de formules creuses.
- Ne touche ni au Comptoir, ni aux passages, ni à la Mémoire des mains, ni aux ruines.

## Livraison

Suis la **consigne de livraison** de `docs/prompts/README.md`, avec la branche
`gemini-commandes-5-7`. Dans le navigateur, vérifie au minimum :
- le jeu se charge, sans erreur dans la console ;
- dans une partie avec un automate de bois, une commande ×50 d’une recette à 1 ingrédient
  déjà faite : la barre « Fabrication » montre l’automate au travail, la commande finit ;
- l’onglet Machines liste les commandes et les machines ;
- une ancienne sauvegarde (`tools/fixtures/save-v5-age8-usine.json`) se charge, et ses
  machines sont au repos.

Termine par : `git log --oneline -3`, `git diff --stat main...gemini-commandes-5-7`, la
sortie de `npm test`, ce que tu as vérifié dans le navigateur, et ce que tu n’as pas pu
faire.
