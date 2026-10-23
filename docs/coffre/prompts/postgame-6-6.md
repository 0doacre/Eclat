# Prompt : ajouts créatifs et post-game (version 6.6.0)

Tu travailles sur **Éclat** (jeu incrémental de craft en français, mobile, JavaScript sans
framework). Dépôt GitHub : `0doacre/craftgame`.

Lis d’abord : `docs/RECIT-PLAN.md`, `docs/STYLE.md`, `docs/LEXIQUE.md`, puis le moteur audio
(`js/audio.js`), l'interface de la relève et de la Mémoire des mains (`js/ui.js`), et les textes
existants (`js/data.js` et `js/recit.js`).

## Le principe

En 6.6.0 (« Ajouts créatifs et post-game ») :
1. **Synthèse sonore WebAudio dédiée pour chacune des 5 fins** (`js/audio.js`) :
   - `A.ending(eid)` implémente un paysage sonore propre à chaque dénouement :
     - ☀️ `aube` : nappe solaire ascendante, harmoniques amples et dorées.
     - 💥 `brasier` : grondement profond et réverbération dans le vide cosmique.
     - 🔔 `retour` : carillon harmonique cristallin et respiration paisible du réveil.
     - 🚀 `exode` : quintes ascendantes célestes avec dérive Doppler et souffle d'étoiles.
     - 🛑 `silence` : decrescendo harmonique doux, extinction des machines vers le silence du Chêne.
   - Transmission de `r.id` depuis `showEnding(r)` dans `js/ui.js`.
2. **Galerie des 5 fins & Échos dans la Mémoire des mains** (`js/ui.js`) :
   - Dans la modale de la Mémoire des mains (`memHTML()`), ajout d'une section élégante « Dénouements du monde » listant les 5 fins :
     - Si découverte : icône, titre et rappel du bonus d'Écho.
     - Si non découverte : icône estompée ou « ? » avec incitation discrète (« À découvrir »).
3. **Harmonisation de la relève post-Matines** (`js/ui.js`) :
   - Quand la libération a eu lieu (`isLibere()`), l'écran de relève (`confirmCycle()`) adopte un ton fraternel et humain (« Passer le relais près du feu », repos mérité pendant qu'un camarade veille) plutôt que le protocole rigide d'ARCHE.
4. **Sauvegardes et tests** :
   - Compatibilité totale avec les sauvegardes en cours.
   - `node tools/build.js` après chaque modification ; `npm test` vert.

## Consigne de livraison

Consigne de livraison de `docs/prompts/README.md` (avec la règle « Secrets »), branche
`gemini-postgame-6-6`. Vérification dans un vrai navigateur (Chrome headless sur `http://localhost:8765/`).
Termine par `git log --oneline -3`, `git diff --stat main...gemini-postgame-6-6`, la sortie de
`npm test`, ce que tu as vérifié et ce que tu n’as pas pu faire.
