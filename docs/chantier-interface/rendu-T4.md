# Compte rendu T4 · L'Étude en écran fixe

- **État** : partiel. L'écran est testé ; la consolidation des règles CSS reste à faire avant intégration.
- **Ce qui change pour le joueur** : L'écran de l'Étude ne défile plus jamais sur aucun téléphone : l'établi et le bouton d'action restent calés au-dessus des onglets, sous le pouce. Seule la réserve glisse dans son cadre dédié quand son contenu déborde.

## Mesures avant / après

| Taille | Défilement page avant (âges 1 / 5 / 9) | Défilement page après | Réserve après |
|---|---|---|---|
| 320 × 568 | 113 px / 263 px / 263 px | 0 px | Cadre de 92 px |
| 360 × 640 | 41 px / 116 px / 116 px | 0 px | Cadre de 164 px |
| 390 × 700 | 0 px / 72 px / 72 px | 0 px | Cadre de 134 px |
| 390 × 844 | 0 px partout | 0 px | Cadre de 278 px |
| 430 × 932 | 0 px partout | 0 px | Cadre de 366 px |

Plafond `Labo` dans `tools/test-ux.js` : 270 px → 0 px. Bouton d'action au pouce partout (`forgeBottom <= tabsTop`). `!important` dans `harmonie-sobre.css` : 108 → 107.

**Recette complémentaire** : la réserve défile réellement ; les filtres et la recherche restent visibles. À petite hauteur, outils et gestes sont réunis sur une ligne et les cibles conservent au moins 44 px. Les hauteurs ci-dessus sont les hauteurs visibles mesurées aux trois âges. Le test vérifie aussi le rognage, le chevauchement et le changement d'outil.

La disposition utilise encore un bloc de sélecteurs plus spécifiques dans `css/labo.css` : il faut le consolider avec les règles existantes pour respecter la règle CSS du chantier.

## Tests lancés

```
$ node tools/test-etude-fixe-ui.js -> 124 contrôles réussis aux 5 tailles et 3 âges.
$ node tools/test-ux.js -> 54 contrôles de tenue des vues réussis.
$ node tools/test-labo-qol-ui.js -> ok - termine avec succes.
$ node tools/test-atelier-dessine-ui.js -> ok 6 - pas de cadre de trop (total = 2)
$ npm test -> Tous les tests d'intégration sont passés (219 tests + acc + ui).
```

## Ce que je n'ai pas vérifié
- Le toucher avec les doigts sur un écran physique réel (émulé Playwright).
- Claviers virtuels ouverts sur le champ de recherche de ressource.
- Le test historique `test-atelier-dessine-ui.js` attend une image chargée paresseusement hors de la zone visible, et expire aussi sur la branche de départ dans cet environnement. Son parcours a été rejoué en forçant le chargement des images : 288 contrôles réussis.

## Choix qui reviennent au porteur
- **Agencement de la réserve sur petit écran (320 × 568)** : filtres et étude sur la ligne 1, recherche sur la ligne 2, réserve défilante sur 92 px.
  - Capture après correction : `docs/chantier-interface/captures/T4/etude-320-apres.jpg`.
  - Captures avant : `docs/chantier-interface/captures/T4/etude-age*-390-avant.jpg`
  - Captures après : `docs/chantier-interface/captures/T4/etude-age*-390-apres.jpg`
