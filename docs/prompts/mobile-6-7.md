# Prompt : optimisation tactile mobile et accessibilité (version 6.7.0)

Tu travailles sur **Éclat** (jeu incrémental de craft en français, mobile, JavaScript sans
framework). Dépôt GitHub : `0doacre/craftgame`.

Lis d’abord : `docs/STYLE.md`, `docs/LEXIQUE.md`, les feuilles de styles (`css/style.css`,
`css/theme.css`), et l'interface utilisateur (`js/ui.js`).

## Le principe

En 6.7.0 (« Optimisation mobile et accessibilité ») :
1. **Mode « Veillée » (Thème sombre chaud)** :
   - Thème sombre chaleureux et reposant pour les yeux (teinte ardoise/encre nocturne `#151311`,
     fond feutré, texte parchemin doré `#e8ded0`).
   - Disponible via un réglage dans le menu `☰` : *Auto* (suit les préférences système),
     *Jour* (carnet clair classique), ou *Veillée* (nuit permanente).
   - Adaptation harmonieuse de toutes les époques et de la méta-couleur de thème.
2. **Ergonomie tactile et confort du pouce** :
   - Cibles tactiles (touch-targets) optimisées : boutons `.mini` (`▶` récolte continue, `+1` extracteurs),
     boutons de navigation et filtres calibrés à au moins 44px de zone de frappe pour supprimer tout
     raté au pouce.
   - Prévention des gestes parasites du navigateur : `touch-action: manipulation`, suppression des
     loupes et callouts de sélection accidentelle (`-webkit-touch-callout: none`) sur les éléments interactifs.
   - Retours haptiques affinés : vibrations douces et distinctes pour le coup de chance (récolte ×2),
     la découverte de recette et l'accomplissement d'un jalon d'âge.
3. **Accessibilité et confort de lecture** :
   - Option « Grand texte » dans le menu `☰` : grossissement de la typographie et renforcement des
     contrastes des textes secondaires pour jouer confortablement en extérieur ou sur petit écran.
   - Prise en charge native de `prefers-reduced-motion` pour désactiver ou adoucir les animations et
     secousses d'écran pour les personnes sensibles.
4. **Sauvegardes et compatibilité** :
   - Les préférences d'affichage sont mémorisées dans `S.settings` sans aucune rupture de sauvegarde
     (`SAVE_VERSION = 6` reste inchangé).
   - `node tools/build.js` après chaque modification ; `npm test` vert.

## Consigne de livraison

Consigne de livraison de `docs/prompts/README.md` (avec la règle « Secrets »), branche
`gemini-mobile-6-7`. Vérification dans un vrai navigateur (Chrome headless sur `http://localhost:8765/`).
Termine par `git log --oneline -3`, `git diff --stat main...gemini-mobile-6-7`, la sortie de
`npm test`, ce que tu as vérifié et ce que tu n’as pas pu faire.
