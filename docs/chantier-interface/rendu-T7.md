# Rendu T7 · L'audit

**État** : fait. Navigateur : Chromium headless (Playwright 1.61), relevé complet lancé.

**Ce qui change pour le joueur** : rien, aucun fichier du jeu n'est touché. Pour le porteur : le script `tools/audit-interface.js` sert de contrôle fiable (six tailles, code de sortie 0) et le rapport « Après correction » porte des chiffres rejoués.

## Les quatre corrections du détecteur
1. Vide : comparé au bloc le plus bas parmi ceux qui précèdent à l'écran (plus au voisin du document).
2. Rangées voulues (`.prod-choix`, `.filters`, `.terres-rangee`) : type 9, classé « voulu », hors défauts.
3. Tailles : 320 × 568, 360 × 640, 390 × 700, 390 × 844, 430 × 932, 1280 × 800.
4. Erreurs de page : vidées avant l'ouverture de chaque cas.
Ajout : type 10, « aucune vue ne défile » (Terres ×2, Étude, liste des métiers, page d'un métier), bloquant.

## Mesures (relevé 0.67.0, six tailles)
| | 0.66.4 | 0.67.0 |
|---|---|---|
| Relevés bruts / lignes | 294 / 41 | 135 / 18 |
| Bloquantes | 2 | 0 |
| Gênantes | 15 | 5 |
| Cosmétiques | 24 | 11 |
| Voulues (type 9) | 0 | 2 |
| Vue qui défile (type 10) | non mesuré | 0 aux six tailles |

## Tests
- `node tools/audit-interface.js --json … --md … --shots docs/audit-interface` : code de sortie 0, 0 cas en échec.
- Essai truqué `--inject "document.querySelector('.view.on').style.minHeight='2400px'"` à 390 × 700 : « la vue défile : views 1768 px » sur les cinq cas, code 1.
- `node tools/build.js` et `npm test` non relancés : aucun fichier du jeu ni de `sw.js` n'a changé.

## Ce qui reste (expliqué dans le rapport)
Cibles du Comptoir et de la relève (3 lignes gênantes), Fins de la Progression défile de 24 px de côté, scène du Sentier à 1280 ; neuf fenêtres sous le plafond de `#modal .modal-box` et deux lignes de cibles de 32 à 42 px (cosmétiques).

## Je n'ai pas vérifié
Les captures n'ont pas été regardées une à une ; rien sur téléphone. Les captures sont celles du relevé (`docs/audit-interface/`, JPG légers, régénérées).

## Choix pour le porteur
Traiter ou non les cibles du Comptoir et l'écran Fins (`docs/audit-interface/comptoir-390.jpg`, `docs/audit-interface/progression-fins-390.jpg`).
