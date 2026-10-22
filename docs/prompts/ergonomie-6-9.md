# Prompt : lisibilité générale, ergonomie et feedbacks visuels (version 6.9.0)

Tu travailles sur **Éclat** (jeu incrémental de craft en français, mobile, JavaScript sans
framework). Dépôt GitHub : `0doacre/craftgame`.

Lis d’abord : `docs/STYLE.md`, `docs/LEXIQUE.md`, `js/data.js`, `js/engine.js`, `js/ui.js`,
`js/domaine.js` et `css/style.css`.

## Le principe

En 6.9.0 (« Lisibilité & Ergonomie ») :
1. **Système de notifications (toasts) hiérarchisé et typé** :
   - Typologie claire des notifications : `warn` (alerte/manque), `good` (succès/étape), `gold` (découvertes/secrets/curiosités), `info` (neutre).
   - Accents visuels par liseré coloré et contraste renforcé pour une lecture instantanée sur mobile.
   - Micro-animations soignées d'apparition et de disparition.
2. **Suivi d'objectif dynamique (HUD de craft)** :
   - Quand un objet est suivi (`🎯 Suivre`), affichage en tête du Domaine de ses ingrédients en temps réel sous forme de jetons compacts (`[🪵 15/20] [🪨 5/5 ✓]`).
   - Bouton de fabrication direct dès que les ressources sont réunies, sans forcer à naviguer dans les menus.
   - Bouton rapide pour annuler le suivi.
3. **Clarté de l'Atelier et des fiches de recettes** :
   - Dans la fiche d'une recette (`recipeModal`), validation visuelle positive (`.ring.ok` avec `✓` et teinte verte) pour les ingrédients possédés en quantité suffisante.
   - Raccourci contextuel pour fabriquer directement une sous-pièce manquante si ses matières premières sont en stock.
4. **Lisibilité du Domaine et des débits** :
   - Badges de débit et d'état des gisements plus lisibles et contrastés (`+X/s`, `⏸ En pause`, `🖐️ À la main`).
   - Floaters tactiles avec icône de ressource pour identifier immédiatement ce qui est récolté sous le doigt.
5. **Sauvegardes et tests** :
   - Compatibilité totale des sauvegardes (`SAVE_VERSION = 6`).
   - `node tools/build.js` et `npm test` verts.
   - Vérification dans Chrome headless sur `http://localhost:8765/`.

## Consigne de livraison

Consigne de livraison de `docs/prompts/README.md` (avec la règle « Secrets »), branche
`gemini-ergonomie-6-9`. Vérification dans un vrai navigateur (Chrome headless sur `http://localhost:8765/`).
Termine par `git log --oneline -3`, `git diff --stat main...gemini-ergonomie-6-9`, la sortie de
`npm test`, ce que tu as vérifié et ce que tu n’as pas pu faire.
