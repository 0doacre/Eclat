# T1 · Fiches

**État — fait.**

Les fiches d’extracteurs affichent à nouveau la projection de débit. La fiche a deux pages, Objet et Usages, et se rouvre à la dernière page consultée pendant la partie.

## Mesures dans Chromium

Bois et Manche, partie de l’âge du Bronze. Défilement vertical en px. Les valeurs séparées par une barre sont celles du Bois et du Manche.

| Écran | Fenêtre avant | Fenêtre après | Objet après | Usages après | Liste « Sert à fabriquer » après |
|---|---:|---:|---:|---:|---:|
| 320 × 568 | 472 / 1801 | 0 / 0 | 0 / 281 | 0 / 0 | 204 / 1144 |
| 360 × 640 | 248 / 1413 | 0 / 0 | 0 / 59 | 0 / 0 | 0 / 742 |
| 390 × 700 | 195 / 1136 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 458 |
| 390 × 844 | 68 / 1009 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 314 |
| 430 × 932 | 0 / 749 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 114 |

Le bouton « Fermer » mesure 48 px. La rangée du Bois passe de 63 à 53 px, plus 4 px de marge. Pour le Manche, elle fait 109 px à 320 de large et 53 px aux autres tailles, hors marge. Les fiches particulièrement longues, par exemple la Cabane de bûcheron, peuvent faire défiler le corps de la page Objet.

## Tests

- `node tools/build.js` puis `npm test`.
- `node tools/test-fiches-ui.js` — `✓ Fiches / fenêtres : 1139 contrôles.`
- `node tools/test-terres-fixe-ui.js` — `264 contrôles de l'écran fixe des Terres réussis.`
- `node tools/test-ux.js` — `54 contrôles de tenue des vues réussis.`
- `node tools/audit-interface.js --w 320,360x640,390x700,390,430 --cas fiche,menu,comptoir,memoire,aide` — le cas « fiche-recette » ne s’ouvre pas à 360 × 640 et 390 × 700, comme sur la branche de départ. Une ouverture directe de Bois et Manche a servi aux mesures du tableau.

**Ce qui reste à vérifier sur téléphone** — Safari, encoches, clavier virtuel et sensation au doigt.

**Choix du porteur** — l’espace occupé par le bouton « Fermer » conservé sous la fiche est visible dans [Bois à 390 × 700](captures/T1/fiche-ressource-390x700.jpg). La liste des fabrications reste défilable dans [Usages du Manche](captures/T1/fiche-recette-390x700-usages.jpg).
