# T8 · Un seul aspect : Atlas et Classique s'en vont

Lis d'abord `docs/chantier-interface/MAITRE.md` : il porte le but, les règles communes et la forme du compte rendu. Réponds en français.

Passe après la fusion de T6 : tu dois mettre à jour des tests que T6 vient de toucher.

## Pourquoi
Le porteur l'a décidé le 12 novembre 2026 : le jeu n'a plus qu'un aspect, Carnet (`vivant` dans le code). Les aspects Atlas et Classique datent d'avant la refonte. Ils restent proposés dans Menu › Affichage, personne ne les entretient, et ils obligent chaque ligne de code à demander dans quel aspect elle tourne.

## Faits vérifiés (version 0.67.0)
- Le choix vit dans le script en ligne de `index.html` (vers les lignes 95 à 170) : `MODES = ["atlas", "vivant", "classique"]`, la clé `localStorage` `eclat.preview.style`, le marqueur `eclat.style.carnet-defaut`, `window.EclatSetStyleMode` et le bouton caché `#atlasToggle` (ligne 53).
- Menu › Affichage : la rangée « Style d'affichage » (`js/compte.js`, `styleLabels`, `styleNext`, action `styleMode`).
- `css/design-preview.css` (`#atlasStylesheet`) reste chargée en Carnet : seul Classique la désactive. Ce n'est pas une feuille « Atlas » à supprimer.
- `#vivantStylesheet` (`css/domaine-vivant.css`) n'est active qu'en Carnet.
- Des tests sous `isVivant` ou `EclatStyleMode === "vivant"` sont dans `js/ui.js`, `js/compte.js`, `js/domaine.js`, `js/carte-atlas.js`, `js/assistance.js`, `js/decouvertes-carnet.js`, `js/monde.js`, `js/passerelle-chantier.js`, `js/quetes.js` et `js/sentier-chantier.js`.
- Des centaines de sélecteurs CSS commencent par `html[data-style-mode="vivant"]`. Seules quelques règles visent `atlas` ou `classique` : dans `css/design-preview.css`, `css/carnet-peint.css` et `css/theme.css`.
- Vingt-six tests de `tools/` touchent à ces noms. `tools/test-atlas-ui.js` porte sur l'aspect Atlas.

## À faire
1. Plus de choix d'aspect : retire la rangée du menu, `#atlasToggle`, le cycle des modes et `EclatSetStyleMode`. Au démarrage, `data-style-mode="vivant"` est posé une fois pour toutes et `window.EclatStyleMode` vaut `"vivant"`. Une sauvegarde ou un `localStorage` réglé sur Atlas ou Classique s'ouvre en Carnet, sans message.
2. **Garde l'attribut** `data-style-mode="vivant"` sur `html` : réécrire des centaines de sélecteurs n'apporte rien au joueur et fait monter le risque.
3. Dans le JS, les branches `!isVivant` (aspect ancien) deviennent du code mort : retire-les et garde la branche Carnet.
4. CSS : retire les règles qui ne visent qu'Atlas ou Classique (`[data-style-mode="atlas"]`, `[data-style-mode="classique"]`, `:not([data-style-mode="vivant"])`). Ne retire rien d'autre de `design-preview.css` ni de `carte-atlas.css` : une règle sans préfixe sert aussi en Carnet. Le nombre de `!important` doit baisser ou rester égal.
5. Ne touche pas au thème jour ou sombre, ni à Grand texte : ce sont T10 et T9. Laisse en place le masquage du bouton Thème dans `js/compte.js` et le `dark = false` de `applyTheme` : T10 les reprend.
6. Tests : mets à jour ceux qui choisissent un aspect. `test-atlas-ui` : s'il ne vérifie plus que l'aspect retiré, propose sa suppression dans ton compte rendu, ne le supprime pas.

## Fichiers réservés
`index.html` (script d'aspect et `#atlasToggle`), `js/compte.js` (rangée Style d'affichage), les dix fichiers JS cités plus haut (branches d'aspect seulement), les règles d'aspect de `css/design-preview.css`, `css/carnet-peint.css` et `css/theme.css`, `tools/test-*-ui.js` (choix de l'aspect seulement).

## Fini quand
- `grep -rn "atlas\"\|classique\|EclatSetStyleMode\|atlasToggle" js/ index.html css/` ne trouve plus de code d'aspect : les noms de la carte Atlas (`carte-atlas`, `.atlas-world`) sont un autre sujet et restent.
- `npm test` est vert, `npm run test:ui` n'a pas plus de rouges qu'après T6, et `node tools/audit-interface.js` sort avec le code 0.
- Captures avant et après de Menu › Affichage, des Terres et de l'Atelier à 390 × 844 : aucune différence en dehors du menu.
