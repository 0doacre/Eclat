# Rendu T8 · Un seul aspect : Carnet

**État** : fait. Navigateur lancé (Playwright 1.61) : tests et audit vérifiés à l'écran.

**Ce qui change pour le joueur** : Menu › Affichage n'a plus la rangée « Style d'affichage » et l'en-tête n'a plus de bouton caché. Une ancienne préférence Atlas ou Classique s'ouvre en Carnet, sans message.

**Retrait**
- `index.html` : bouton `#atlasToggle`, cycle des modes, `EclatSetStyleMode`. Le script pose une fois `data-style-mode="vivant"`, `window.EclatStyleMode = "vivant"`, active `#vivantStylesheet`, puis efface `eclat.preview.style` et `eclat.style.carnet-defaut`.
- `js/compte.js` : rangée, libellés et action `styleMode`. Le masquage du Thème est laissé à T10.
- `js/domaine.js` (branches `carnet` et `isVivant`), `js/ui.js` (`icon`), `js/carte-atlas.js` (`isVivant`), `js/monde.js`, `js/quetes.js`, `js/passerelle-chantier.js`, `js/sentier-chantier.js`, `js/decouvertes-carnet.js` : conditions « vivant » retirées, branche Carnet gardée. `js/assistance.js` : rien à changer.
- CSS : `design-preview.css` (3 règles `atlas`), `carnet-peint.css` (1 règle `:not(vivant)` et 2 règles `#atlasToggle`), `theme.css` (1 règle `:not(vivant)`), `harmonie.css` (masquage de `#atlasToggle`).
- `!important` : `harmonie-sobre.css` 107 → 107, `fin.css` 148 → 148 (`harmonie.css` en perd un).

**Tests modifiés** : `test-vivant.js` (npm test : plus de « 3 modes »), `test-carnet-production-ui`, `test-atelier-dessine-ui`, `test-archives-ui` (un ancien choix Classique s'ouvre en Carnet, plus de bouton), et retrait du réglage `eclat.preview.style` dans 13 autres tests d'interface. `test-ux-avant-0-39.js` (hors `test:ui`) cycle encore sur trois styles : non touché.

**Tests**
- `npm test` : vert.
- `npm run test:ui` : « 33 verts, 3 rouges sur 36 » ; rouges : `test-decouvertes-carnet-ui` (crayon), `test-monde-production-ui` (monde intégré), `test-retours-ui` (décor au bord supérieur), les trois attendus.
- `node tools/audit-interface.js` : code 0.
- Captures 390 × 844 avant/après dans `captures/T8/` : Terres et Atelier identiques au pixel, seul le menu change.

**Reste, à décider**
- `test-atlas-ui` teste la carte (`.atlas-world`), pas l'aspect : je le garde (vert, 704 contrôles) ; renommage possible. `js/carte.js` garde `EclatAtlas.enabled()`, désormais toujours vrai : branche « classique » morte, hors périmètre.
- Le sélecteur `?atelier=classique` (aperçu de l'Atelier) est un autre sujet, laissé.
