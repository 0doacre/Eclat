# Rendu T2 · Fenêtre d'ouverture : pied fixé

**État** : fait. Branche `chantier/T2-ouverture`, pas de pull request ouverte.

**Ce qui change pour le joueur** : « Ouvrir les yeux » et les deux réglages restent en bas de la fenêtre dès la première seconde. Le récit défile au-dessus, dans son propre cadre. Les deux réglages tiennent sur une rangée sous le bouton principal, mots inchangés.

**Fichiers touchés** : `js/memoire.js` (`cls: "ouverture"`), `css/fin.css` (6 lignes dans le bloc « fenêtres »), `docs/chantier-interface/MAITRE.md` (case T2), ce compte rendu, `sw.js` (régénéré).

## Mesures (partie neuve, 600 ms après l'ouverture)
| Taille | Défilement de la fenêtre | Défilement du récit | Bas de « Ouvrir les yeux » |
|---|---|---|---|
| 320 × 568 | 0 | 98 px | 488 px (avant : hors écran de 162 px, chiffre du prompt, non remesuré) |
| 360 × 640 | 0 | 0 | 506 px |
| 390 × 700 | 0 | 0 | 536 px |
| 390 × 844 | 0 | 0 | 608 px |
| 430 × 932 | 0 | 0 | 652 px |

En fin de défilement du récit, la dernière ligne finit 18 px au-dessus du pied. Les deux réglages sont à la même hauteur (une rangée), 44 px chacun, aux cinq tailles. À 320 px « Aa Grand texte : Désactivé » passe sur deux lignes dans son bouton, sans rien couper.
Cycle 2 et réveil libre (320 × 568, 390 × 700, 430 × 932) : fenêtre sans défilement, bouton entier, dernière ligne au-dessus du pied.

## Tests
- `node tools/build.js` : Build 7e9a19a245.
- `npm test` : « 14 tests réussis. »
- `node tools/test-ouverture-ui.js` : « 13 contrôles de l’ouverture réussis. »
- `node tools/test-terres-fixe-ui.js` : « 264 contrôles de l'écran fixe des Terres réussis. »
- `node tools/test-ux.js` : « 54 contrôles de tenue des vues réussis. »
- `node tools/audit-interface.js --w 320,360x640,390x700,390,430 --cas ouverture` : « === 0 anomalies brutes, 0 lignes === »
- `!important` : `css/fin.css` 148, `css/harmonie-sobre.css` 108, inchangés.

## Ce que je n'ai pas vérifié
- Le chromium de Playwright avait disparu en cours de route : l'audit a tourné sur Chrome installé (lanceur hors dépôt), les autres tests sur le Chromium de Playwright 1.61.1, avant sa disparition.
- Les mesures « avant » n'ont pas été refaites. Le clavier, les encoches, Safari, Grand texte activé, le thème sombre.
- L'accès au bouton avant la fin de l'apparition des lignes n'est pas chronométré : le pied est fixé, donc visible dès l'ouverture.

## Choix pour le porteur
- Les réglages à 320 px : « Grand texte » sur deux lignes. Capture : `docs/chantier-interface/captures/T2/320x568.jpg`.
- Vue courante : `captures/T2/390x700.jpg`, `captures/T2/390x844.jpg` (prises après défilement du récit en bas).
