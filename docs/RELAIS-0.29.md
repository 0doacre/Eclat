# Relais de la 0.29.0 (26 octobre 2026)

Pour reprendre le travail dans une nouvelle conversation sans rien perdre. Remplace `docs/RELAIS-CLAUDE.md` (22 octobre, 0.7) pour tout ce qui suit la 0.22. Le « Fait récemment » et le « Juste après » sont dans `docs/A-FAIRE.md`.

## État

- `main` est en **0.29.0**. Tests : `npm test` vert ; `tools/test-ux.js` vert quand il tourne seul. CI : `npm-test` sous Linux et Windows (`.github/workflows/test.yml`) sur chaque pull request et sur `main`.
- Aucune pull request de Claude n'est ouverte, sauf **#106** (retours sur `docs/COORDINATION-DESIGN.md`), volontairement non fusionnée : GPT l'a lue sur sa branche. La **#90** (comparaison des audits par Codex) est un brouillon, non fusionnée.
- Une équipe design travaille sur la branche **`prewiew-design`** (« L'Atlas vivant », prévisualisation https://craftgame-wrr.pages.dev/). **Ne pas la fusionner, ne pas y toucher.** Lire `docs/COORDINATION-DESIGN.md` avant toute modification du HTML ou du CSS : signaler les changements de structure qui la concernent.
- Plusieurs IA contribuent (Claude, GPT/Codex, Gemini, Deepseek). Vérifier `git log origin/main` avant de commencer : d'autres lots arrivent sur `main` (les dialogues RPG du Troqueur, la langue du récit).

## Décisions du propriétaire à respecter

- **Aucune baisse de difficulté** : on réduit la **friction**. Un joueur casual qui n'a jamais joué à ce genre de jeu ne doit pas être perturbé ; une renaissance doit se rattraper vite ; chaque élément doit être à la bonne place et joignable de partout.
- **Vocabulaire d'interface** de jeu de gestion ou de stratégie (Age of Empires, Civilization) : mots courts, un mot par chose, **pas de périphrases**. Le récit garde sa voix. Table : `docs/revue/vocabulaire.md`. Ne pas réintroduire Scénario, Étape clé, Tenter.
- **Économie** : la hausse du prix par achat de Trace (`traceUp`) a été retirée volontairement : ne pas la restaurer. Les écus deviennent des Traces à la relève avec un plafond mou. Le Troqueur ferme ses **demandes** de temps en temps (le marché reste ouvert). Les valeurs des matières ne dépendent pas du débit : mesuré, rien à corriger (`docs/revue/valeurs-debit.md`).
- **Arbre** : la progression reste l'accueil ; l'Arbre dit « où aller », le Carnet garde les lots et les quantités ; pastilles acceptées.
- **Fusion** : le propriétaire a autorisé la fusion en squash d'une pull request dont la CI est verte, **lot par lot, quand il l'a demandé** (« fusionne », « tu peux y aller »). Sans demande, demander avant de fusionner. Ne jamais pousser sur `main` directement.
- Nom des branches : `claude/<sujet>`. Messages de commit et de pull request en français, avec les lignes d'attribution demandées par la session. Pas de mention d'un identifiant de modèle dans les commits ni les pull requests.

## Méthode d'un lot

1. Partir de `origin/main` à jour : `git fetch origin && git checkout -B claude/<sujet> origin/main`.
2. Mesurer avant de corriger (un script jetable, un bot, un navigateur). Un défaut sans reproduction n'est pas un défaut.
3. Écrire le test **avec** le correctif : un test moteur dans `tools/test-<sujet>.js` (ajouté à `tools/test.js`), et si l'écran change, un test navigateur `tools/test-<sujet>-ui.js` (avec `package.json` : `test:<sujet>`).
4. Changer la version : `D.VERSION` (`js/data.js`), `package.json`, les deux tests de version dans `tools/test.js` (la mineure du lot courant), et une ligne en tête de `D.CHANGES` (voix du jeu, emoji, une ligne).
5. `node tools/build.js` (recalcule `BUILD` dans `sw.js`) ; si un fichier de page est ajouté, l'inscrire dans `FILES` (`sw.js`) et dans `index.html`.
6. Si un bouton est ajouté ou retiré : `BROWSER=chromium node tools/boutons.js` (régénère `docs/boutons.md` et `.json`) ; chaque bouton a une info-bulle ou un nom accessible, sinon `test-boutons` échoue.
7. `npm test`, puis **seul** `node tools/test-ux.js`, puis le test navigateur du lot.
8. Commit, push, pull request avec le résultat des vérifications **et ce qui n'est pas vérifié**.

Un conflit de fusion avec `main` est presque toujours `sw.js` (ligne `BUILD`) et `tools/test.js` (la version) : prendre la version de `main`, recalculer avec `node tools/build.js`, remettre les numéros de version à la valeur du lot.

## Pièges connus

- **`tools/test-ux.js` est sensible à la charge** : le lancer seul, jamais avec un autre test. Les fenêtres ignorent les clics 450 ms après leur ouverture (`fresh()`) : les tests attendent environ 550 ms.
- Une partie neuve n'accepte les fêtes qu'à partir de 1,5 s (`U.live`).
- `npm test` dépasse 120 s dans certains environnements : le lancer en arrière-plan, ou sans `test-ux`.
- Les tests utilisent des horloges et des `rand` injectés : ne jamais consommer `rand()` dans `createEngine` (décale toutes les séquences déterministes).
- Plusieurs tests se mesurent à 320, 360, 390 et 430 px, en texte normal et en grand texte. Aucun contenu ne doit défiler horizontalement (hors des listes intentionnelles).
- Sans `playwright` installé, les tests navigateur ne tournent pas ; `tools/boutons.js` utilise Firefox par défaut (`BROWSER=chromium`).
- `E.cache().rate(res)` vaut 0 avant le premier `E.catchUp`/tick : un extracteur posé n'a pas encore de débit.

## Où est quoi

Moteur sans DOM : `js/engine.js` (`createEngine({now, rand})`), données `js/data.js`, récit `js/recit.js`. Interface : `js/ui.js` (noyau) et les modules qu'il crée : `domaine`, `carte`, `atelier` (Atelier, Carnet, Arbre), `carnet` (devis des lots), `arbre` (graphe), `journal`, `quetes`, `memoire`, `compte`, `visiteurs`, `fenetres` (file des fenêtres), `tuto` (guide), `ecouteurs`. Ajouts récents : `stockage` (un seul onglet enregistre, verrou), `juice` (appuis, paliers de rareté), `appareil` (Retour, installation, écran allumé, clavier). Service worker : `sw.js`, empreinte portable (`tools/build.js`). Documents d'étude : `docs/revue/` (dont `audit-0.21-claude.md`, `friction.md`, `vocabulaire.md`, `valeurs-debit.md`, `arbre-vertical.md`).

Outils : `tools/sim.js` (le bot ; `RELEVE=<âge>` mesure la renaissance ; les passages y sont offerts, durées = borne basse), `tools/sim-passages.js` (paie les passages), `tools/boutons.js`, `tools/build.js`.

## Le prochain lot : le chemin vers une cible (Arbre, étape 2)

Spécification de départ (page de propositions : https://claude.ai/artifact/PAWDH6q3QFfWj7sqvAY7Ve, privée) :

- Depuis la feuille d'une pastille (et depuis l'objectif du Domaine), un bouton **« Chemin »** ouvre la route complète jusqu'à l'objet : une échelle verticale des marches, de la plus profonde à la cible. Chaque marche porte son état (fait, en cours, à trouver, bloquée) et son action : Fabriquer, Récolter, Voir la recette. Une marche bloquée dit pourquoi (« Requis : … »).
- « **Suivre** cette route » réutilise le Suivi existant (`E.setTrack`) ; « **Tout fabriquer** » réutilise la commande en chaîne (`chainCraft`).
- Données : `E.plan(id, n)` (marches et manques), `E.nextStep(id)`, `E.blocker(id)`, `Arb.graphe` (ce qui se voit). **Règle absolue** : ne jamais montrer le nom, l'icône ni l'identifiant d'une recette encore inconnue ; une piste reste « Recette à trouver » (tests d'anonymat : `tools/test-arbre.js`).
- Après : le filtre « À portée » (prêt, presque avec ce qui manque, pas encore), le point « nouveau » sur les pastilles.
- À présenter avec des mesures (états, 320 à 430 px, grand texte) et un test navigateur, comme `tools/test-arbre-ui.js`.

## Prompt de reprise (à coller dans la nouvelle conversation)

> Reprends le travail sur Éclat (dépôt `0doacre/craftgame`). Lis d'abord `docs/RELAIS-0.29.md`, puis `docs/A-FAIRE.md`, `docs/COORDINATION-DESIGN.md` et `docs/revue/vocabulaire.md`. `main` est en 0.29.0. Travaille sur une branche `claude/<sujet>` depuis `origin/main`, ne fusionne que sur demande explicite, ne touche pas à la branche `prewiew-design`. Première tâche : le chemin vers une cible dans l'Arbre (section « Le prochain lot » du relais). Mesure avant de coder, écris le test avec le correctif, lance `npm test` puis `tools/test-ux.js` seul, et dis dans la pull request ce qui n'est pas vérifié.
