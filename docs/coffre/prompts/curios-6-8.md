# Prompt : les Curiosités et clins d’œil pop culture (version 6.8.0)

Tu travailles sur **Éclat** (jeu incrémental de craft en français, mobile, JavaScript sans
framework). Dépôt GitHub : `0doacre/craftgame`.

Lis d’abord : `docs/coffre/EASTER.md`, `docs/STYLE.md`, `docs/LEXIQUE.md`, `js/data.js`,
`js/engine.js`, `js/ui.js` et `js/domaine.js`.

## Le principe

En 6.8.0 (« Curiosités ») :
1. **Objets et données des clins d'œil (`D.EASTER`, `D.ITEMS`, `D.RECIPES`)** :
   - Définition dans `D.EASTER` des 11 curiosités issues de `docs/coffre/EASTER.md` :
     - 🟥 `poudre_rouge` (Minecraft) : récolte de caillou à la main (1/8 000), permet la recette secrète `torche_rouge`.
     - 💚 `coeur` (Zelda) : 4 morceaux trouvés (1/15 000) dans fibres, os, sable, régolithe.
     - 💍 `anneau` (Seigneur des anneaux) : explorer la Rivière lente au cycle 9. Disparaît au toucher de sa fiche (« Il est très lourd pour sa taille »).
     - 🎲 `d20` (Donjons & Dragons) : tailler de l'os (1/20 000). Affiche 20 au premier lancer, puis 1-20 au hasard.
     - 🕯️ `fouet` (Castlevania) : tresser la nuit (0 h–4 h heure locale, 1/3 000).
     - 🍄 `tuyau` (Mario) : poser 8 extracteurs sur un même gisement des Profondeurs.
     - 🦇 `survivant` (Vampire Survivors) : maintenir la récolte ▶ active pendant 30 minutes d'affilée.
     - 🎙️ `zera` (ZeratoR) : commande spéciale au terminal (`zera`, `zlan`, etc.).
     - 🔴 `squeeze` (Squeezie) : vendre exactement 1 000 000 d'une ressource au Comptoir.
     - ✂️ `wtc` (Antoine Daniel) : ouvrir/fermer 10 fois la même fiche en 20 secondes.
     - 🕹️ `konami` (Konami Code) : code classique au clavier ou balayages célestes. 30 étoiles éphémères dans le ciel.
2. **Moteur et persistance (`js/engine.js`)** :
   - Les curiosités découvertes sont enregistrées dans `S.meta.curios[id] = Date.now()`.
   - Elles sont conservées à chaque relève (`newCycle()`) et dans les sauvegardes.
   - Les objets `curio` ne sont pas vendables et ne faussent pas l'équilibrage du jeu.
3. **Interface et Journal (`js/ui.js`)** :
   - Nouvel onglet discret **« Curiosités »** dans le Journal (`#v-journal`), masqué tant qu'aucune curiosité n'a été découverte.
   - Dès la première trouvaille, l'onglet apparaît avec les cartes découvertes et des emplacements « ? » sans compteur total.
   - Notification discrète et élégante lors d'une découverte.
4. **Sauvegardes et tests** :
   - `SAVE_VERSION = 6` préservée.
   - `node tools/build.js` après chaque modification ; `npm test` vert.

## Consigne de livraison

Consigne de livraison de `docs/prompts/README.md` (avec la règle « Secrets »), branche
`gemini-curios-6-8`. Vérification dans un vrai navigateur (Chrome headless sur `http://localhost:8765/`).
Termine par `git log --oneline -3`, `git diff --stat main...gemini-curios-6-8`, la sortie de
`npm test`, ce que tu as vérifié et ce que tu n’as pas pu faire.
