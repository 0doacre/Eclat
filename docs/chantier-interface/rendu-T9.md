# Rendu T9 · Grand texte, une seule échelle

**État** : fait. Navigateur : Chromium headless (Playwright 1.61). Rien n'a été essayé sur un téléphone.

**Ce qui change pour le joueur** : avec Grand texte, tout texte lu grandit de 20 % (listes, fiches, pastilles, boutons, Carnet, Journal, en-tête). Les icônes et les images gardent leur taille.

## Mécanisme
- `css/theme.css` : `:root { --sb-texte: 1 }`, et `body.large-text { --sb-texte: 1.2 }` (bloc « T9 · Grand texte »). Un seul réglage à changer pour doser.
- Chaque taille de texte des feuilles est écrite `calc(14px * var(--sb-texte))` (idem rem et `font: 600 14px/…`), y compris `body` et `.tiny` de `design-preview.css` (`--design-reading`, `--design-caption`). Les titres suivent encore `--title-size` (1,15 sous Grand texte), multiplié par l'échelle.
- Ne grandissent pas : glyphes d'icônes et flèches (`.ic`, `.fi`, `.an`, `.ico-seule`, `.terre-nav`, `.atel-ic`, `.ajout-plus`, `.roue-n`…), pseudo-éléments `::before/::after`, grands titres en `clamp()`.
- `tools/echelle-texte.js` applique la conversion à toutes les feuilles et se relance sans dégât (`--verifie` sort en 1 s'il reste une taille non branchée). **À relancer après la fusion avec T10** si un conflit ou une nouvelle règle de taille apparaît.
- Retirées : une trentaine de règles `body.large-text` de taille (`theme`, `arbre`, `design-preview`, `carte-atlas`). Gardées : les deux règles de colonnes de `arbre.css`.
- Périmètre : j'ai branché toutes les feuilles (pas seulement les six réservées), sinon `style.css`, `design-preview.css`, `theme.css` laissaient les textes courants à leur taille. Les lignes qui mêlent taille et couleur peuvent heurter T10 : prendre la version de T10 puis relancer `echelle-texte.js`.

## Tailles calculées (390 × 844, normal → Grand texte)
| Texte | Avant | Après |
|---|---|---|
| Nom d'une recette (Carnet) | 13 | 15,6 |
| Nom d'un métier (Atelier) | 17 | 20,4 |
| Sous-texte `.tiny` | 13 | 15,6 |
| Texte de fiche | 15 | 18 |
| Titre de fiche | 28 | 33,6 |
| Bouton Fabriquer | 15 | 18 |
| Pastille des Terres | 15 | 18 |
| Valeurs de l'en-tête | 17 | 20,4 |

## Écrans qui ne tenaient pas (Grand texte)
- Étude, 320 px : le coût de l'étude débordait de 6 px à côté des filtres. Il passe sur sa propre rangée (règle sous `max-width: 359px` dans `sobriete.css`).
- Questions du Journal, 320 px (vu par `test-archives-ui`) : le bouton « Réfléchir » sortait de 34 px. Il passe à la ligne (`design-preview.css`).
- Aucune vue principale ne défile aux cinq tailles. Fenêtres (Aide, Comptoir, Mémoire, Menu) : elles défilaient déjà, plus longues avec Grand texte (ex. Aide 4179 → 5925 px à 320), cosmétique pour l'audit.

## Mesures
`!important` : `harmonie-sobre.css` 107 → 107, `fin.css` 148 → 148.
Audit sans Grand texte : code 0, 134 relevés, 18 lignes. Avec Grand texte : code 0, 100 relevés, 19 lignes, aucune bloquante. Les 4 lignes « gênantes » (zones de signes du Comptoir et de la relève, Fins de la Progression, scène du Sentier à 1280) existent aussi sans Grand texte.

## Tests
- `npm test` : « 14 tests réussis. »
- `npm run test:ui` : 34 verts, 3 rouges sur 37 (les trois attendus : `decouvertes-carnet`, `monde-production`, `retours`). `test-echelle-ui` reste vert.
- Nouveau `tools/test-grand-texte-ui.js` (dans `test:ui`) : 83 contrôles ; médiane +20 % pour liste, fiche et bouton ; aucune vue ne défile à 5 tailles. 1 texte sous +10 % (la pastille `.roue-n`, un glyphe-badge, laissée exprès).

## Pas vérifié
Safari, le toucher, l'effet réel sur un téléphone ; les fenêtres hautes à 320 px (elles défilent déjà dans leur cadre) ; la Carte Atlas (règles retirées, non rouvertes).

## Au porteur
Le facteur 1,2 (au lieu de 1,15 du prompt) : `--sb-texte` dans `theme.css`. Captures 390 × 844, normal et grand, dans `docs/chantier-interface/captures/T9/` : `terres-`, `atelier-`, `fiche-`, `carnet-`, `journal-` (aussi `etude-`, `metier-`, `progression-`, `menu-`), suffixes `normal` et `grand`.
