# T5 · Métier en écran fixe

**État — fait.** La branche part de T1. Le scénario « À construire » doit être adapté dans la suite d’interface.

Les recettes glissent toujours horizontalement en haut et « Fabriquer » reste au pouce, sous la recette choisie. Équipe, À construire et Ce qui tourne ont chacun une feuille dont seul le corps défile.

## Mesures dans Chromium

Artisanat, partie de l’âge du Bronze. Hauteurs et défilement en pixels. Avant, les blocs sont la plaque, les raccourcis, les recettes, la fiche, les commandes et la file. Après, ce sont la plaque, les recettes, le milieu, les raccourcis et les commandes.

| Écran | Blocs avant | Blocs après | Défilement de la vue avant → après | Défilement du milieu après |
|---|---|---|---:|---:|
| 320 × 568 | 51 / 52 / 109 / 167 / 58 / 2 | 51 / 109 / 97 / 60 / 58 | 186 → 0 | 76 |
| 360 × 640 | 51 / 52 / 109 / 167 / 58 / 2 | 51 / 109 / 165 / 60 / 58 | 118 → 0 | 8 |
| 390 × 700 | 51 / 52 / 109 / 167 / 58 / 2 | 51 / 109 / 225 / 60 / 58 | 58 → 0 | 0 |
| 390 × 844 | 51 / 52 / 113 / 154 / 58 / 2 | 51 / 113 / 365 / 60 / 58 | 0 → 0 | 0 |
| 430 × 932 | 51 / 52 / 113 / 154 / 58 / 2 | 51 / 113 / 453 / 60 / 58 | 0 → 0 | 0 |

Avant, la fiche et la file étaient deux blocs et la vue défilait. Les propriétés de disposition et de défilement de `.prod-choix` sont identiques aux cinq tailles. À 320 px de large, les filtres d’Équipe passent de 243 px de défilement horizontal à 0. Les cibles mesurées passent à 44 × 44 px pour le retour, 50 × 44 px pour l’ingrédient témoin et au moins 44 px de haut pour « Déjà fait ».

## Tests

- `node tools/build.js` — `Build af9c94fdd3 (était 7c99e6707d)`. `npm test` — `✓ Service worker à jour (build af9c94fdd3).`
- `node tools/test-ux.js` — `54 contrôles de tenue des vues réussis.`
- `node tools/test-carnet-production-ui.js` — `177 contrôles du Carnet de production réussis.`
- `node tools/test-a-construire-ui.js` — `AssertionError [ERR_ASSERTION]: la page du Bâtiment montre la section À construire`. Le test cherche la liste dans la page. Le scénario rejoué avec ouverture de la feuille a donné `12 contrôles des À construire réussis.`, dont une construction, le corps défilant et le titre fixe.
- `node tools/audit-interface.js --w 320,360x640,390x700,390,430 --cas atelier` — `=== 28 anomalies brutes, 2 lignes ===  {"gênant":5,"cosmétique":23}`, contre 229 sur la branche de départ. Les cinq relevés gênants concernent le défilement horizontal voulu des recettes. Toutes les feuilles s’ouvrent dans l’audit.

**Ce qui reste à vérifier sur téléphone** — Safari, encoches, clavier virtuel et sensation au doigt.

**Choix du porteur** — l’emplacement des commandes est visible dans [Artisanat à 390 × 700](captures/T5/atelier-metier-390x700.jpg). La présentation de la liste longue est visible dans [À construire à 390 × 844](captures/T5/atelier-construire-390x844.jpg).
