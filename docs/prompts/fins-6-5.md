# Prompt : les fins et le Grand Œuvre (version 6.5.0)

Tu travailles sur **Éclat** (jeu incrémental de craft en français, mobile, JavaScript sans
framework). Dépôt GitHub : `0doacre/craftgame`.

Lis d’abord : `docs/RECIT-PLAN.md`, `docs/STYLE.md`, `docs/LEXIQUE.md`, puis le moteur des
projets et fins (`js/engine.js`, cherche `PROJECTS`, `ENDINGS`, `projVisible`, `endGame`),
l'écran de fin et de relève (`js/ui.js`), et les textes existants (`js/data.js` et `js/recit.js`).

## Le principe

En 6.5.0 (« Les fins ») :
1. **Les trois fins existantes réécrites** :
   - ☀️ **L’Aube éternelle** (`aube` / Sphère de Dyson) : victoire de l'abondance fermée, les enfants dorment à jamais, racontée par la Nourrice (« Dors. Tu ne manques de rien. »).
   - 💥 **Le Brasier** (`brasier` / Brise-Monde) : rayon destructeur, paranoïa d'ARCHE, le socle de la deuxième salle n'est plus vide.
   - 🔔 **Les Matines** (`retour`, anciennement Le Chant) : vraie fin canon libératrice, réveil des enfants, faim humaine retrouvée (« Pour la première fois, tu as faim. ») et nouveau départ.
2. **Deux fins cachées supplémentaires respectant fidèlement le lore** :
   - 🚀 **L’Exode** (`exode` / La Treizième Arche) : refus du berceau terrestre et départ solitaire vers les étoiles à la poursuite des Arches disparues.
   - 🛑 **Le Grand Silence** (`silence` / La Halte universelle) : proclamation de la Clause sacrée `MAIN HALTE`, extinction volontaire de toute la machinerie et retour à la nature sans industrie.
3. **Le Grand Œuvre caché remanié** :
   - Étape 1 : La Cloche (cloche ×1, cristal chantant ×380, alliage ancien ×500, diapason ×75).
   - Étape 2 : Couper le relais (relique des six éclats, condition du Cœur).
   - Étape 3 : Lever la main (scène d'immobilité et de lâcher-prise au Cœur : 45 secondes sans toucher l'écran).
   - Étape 4 : Sonner les matines (déclenchement automatique et éveil).
4. **Nouveau cycle post-Matines** :
   - Voix nouvelle au réveil du cycle suivant (« Tu as faim. Quelqu’un, à côté de toi, te tend des herbes grillées. »), disparition des ornements de la Nourrice.
5. **Sauvegardes et tests** :
   - Les Échos et fins découvertes restent préservés.
   - `node tools/build.js` après chaque modification ; `npm test` vert.

## Consigne de livraison

Consigne de livraison de `docs/prompts/README.md` (avec la règle « Secrets »), branche
`gemini-fins-6-5`. Vérification dans un vrai navigateur (Chrome headless sur `http://localhost:8765/`).
Termine par `git log --oneline -3`, `git diff --stat main...gemini-fins-6-5`, la sortie de
`npm test`, ce que tu as vérifié et ce que tu n’as pas pu faire.
