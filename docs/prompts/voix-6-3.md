# Prompt : les voix (version 6.3.0)

Tu travailles sur **Éclat** (jeu incrémental de craft en français, mobile, JavaScript sans
framework). Dépôt GitHub : `0doacre/craftgame`.

Lis d’abord : `docs/RECIT-PLAN.md`, `docs/STYLE.md`, `docs/LEXIQUE.md`, puis le moteur actuel
du terminal (`js/engine.js`, cherche `terminal` et `D.TERMINAL`), l’écran du Cosmos et du
terminal (`js/ui.js`), et les scènes d’éveil et de fabrication.

## Le principe

En 6.3.0 (« Les voix ») :
1. Le terminal devient entièrement piloté par les données (`D.TERMINAL` et `D.RECIT.terminal` /
   `registre`), avec prise en charge de deux modes d'accès :
   - Mode ARCHE par défaut (`ARCHE >`) ;
   - Mode Registre (`REG >`) débloqué par la Clause (`main d’abord`, air de flûte ou exploration).
   Le terminal évalue des champs calculés dynamiques ({date}, {semeur}, {cuve}, {capsule}, etc.).
2. Deuxième saisie libre : lors de la fabrication de la capsule temporelle, le joueur peut écrire
   un court message (jusqu’à 140 signes) pour celui qui viendra. Ce message est archivé et
   consultable dans le Registre sous `capsule`.
3. Moteur d’événements narratifs déclenchés par des conditions : interventions d'ARCHE à la radio
   (âge 7+, seuils franchis, signaux captés), scènes d’ambiance déclenchées quand des conditions
   de jeu sont remplies.
4. Complétion des pages du Livre des Semeurs (pages numérotées jusqu'à 32 selon la bible).

## Ta tâche

### 1. Le moteur du terminal piloté par données (`js/engine.js`)
- Gestion de l'état `S.flags.registre` (débloqué quand la Clause est reconnue).
- Mode courant du terminal (ARCHE vs REGISTRE).
- Évaluation des réponses définies sous forme de gabarits avec variables calculées :
  - `{date}` : date et heure réelles du système en français (ex. « MARDI 21 OCTOBRE, 14 H 03 »).
  - `{semeur}` : numéro du semeur courant (cycle + 6).
  - `{cuve}` : cuve du cycle (7 + ((cycle - 1) % 6)).
  - `{capsule}` : message original rédigé par le joueur dans la capsule.
  - `{premieres}` : récapitulatif des premières fois.
- Tolérance de saisie : normalisation casse, accents, ponctuation, espaces multiples.
- Les réponses du Registre sont préfixées par `REG · ` et écrites en majuscules neutres, sans « je ».

### 2. Saisie de la capsule temporelle (`js/ui.js` & `js/engine.js`)
- À la confection de la `capsule`, une boîte de dialogue propose la saisie libre optionnelle.
- Stockage propre dans l'état (`S.meta.capsuleText`), préservé entre les cycles.
- Règle de compatibilité des sauvegardes : si le champ est absent, valeur par défaut `""`.

### 3. Moteur d'événements conditionnels (`js/engine.js`)
- Structure `events` dans les données (`D.RECIT.events`).
- Méthode d'évaluation périodique lors de `update()` et des actions clés.
- Événements déclenchés une seule fois enregistrés dans `S.eventsSeen`.

### 4. Sauvegardes, tests, version
- Sauvegardes rétrocompatibles (champs par défaut, aucun changement de `SAVE_VERSION`).
- Tests unitaires complets dans `tools/test.js` et tests narratifs dans `tools/test-recit.js`.
- Mise à jour de `D.VERSION = "6.3.0"`, `D.CHANGES` (« Le terminal s’ouvre à de nouvelles voix. »).
- `node tools/build.js` après chaque modification ; `npm test` vert.

## Consigne de livraison

Consigne de livraison de `docs/prompts/README.md` (avec la règle « Secrets »), branche
`gemini-voix-6-3`. Vérification dans un vrai navigateur (Chrome headless sur `http://localhost:8765/`).
Termine par `git log --oneline -3`, `git diff --stat main...gemini-voix-6-3`, la sortie de
`npm test`, ce que tu as vérifié et ce que tu n’as pas pu faire.
