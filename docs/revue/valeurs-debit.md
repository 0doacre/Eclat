# Valeur des matières et débit des extracteurs

Mesure faite sur 0.26.0 (outil jetable, repris dans `tools/test-comptoir.js`). Aucune valeur n'a été modifiée.

## La question

Dans l'audit 0.21, la valeur d'une matière brute (`valueOf` : 0,1 × 2,5^âge) ne dépend pas du débit de son extracteur. L'eau (3 par seconde) vaut autant par unité que le soufre (1,5 par seconde) du même âge. La crainte : une matière facile à extraire rapporterait beaucoup plus qu'une rare.

## Ce que montre la mesure

Un extracteur, 12 heures, tout vendu d'un coup, converti en Traces au prix de l'âge de la matière (la saturation, `sat` = 2000, fait baisser le prix quand on vend beaucoup) :

| Âge | Matières (Traces en 12 h) | Écart |
|---|---|---|
| 0 | bois 10,6 · caillou 9,7 · fibre 9,7 | ×1,1 |
| 1 | cuir 10,5 · os 11,0 | ×1,05 |
| 2 | argile 16,8 · sable 17,2 · silex 15,3 | ×1,1 |
| 3 | cassitérite 17,6 · malachite 21,3 | ×1,2 |
| 4 | quartz 28,2 | |
| 5 | minerai de fer 43,3 | |
| 7 | eau 83,5 | |
| 9 | galène 126,7 · uranium 111,8 | ×1,1 |
| 11 | bauxite 391 · ilménite 362 · pétrole 311 · soufre 260 · terres rares 294 | ×1,5 |
| 13 | débris 353 · hélium-3 446 · régolithe 599 | ×1,7 |
| 14 | métal de Mercure 832 | |

## Conclusion

Le défaut n'existe pas à l'ampleur craint. Le débit varie d'un facteur 6 à l'intérieur d'un âge (9 par seconde pour la bauxite, 1,5 pour le soufre), mais le prix suit une loi en logarithme de la quantité vendue : le revenu ne varie que d'un facteur 1,1 à 1,7. Entre les âges, il croît régulièrement (10, 17, 43, 83, 127, 390, 600, 830). Avec le plafond mou de la conversion des écus (0.23), vendre ne remplace pas les passages.

Corriger la valeur par le débit déplacerait les prix de toutes les pièces fabriquées (la valeur d'une pièce somme celle de ses matières) pour un effet inférieur à ×1,7 : le risque dépasse le gain. On garde les valeurs.

## Garde-fou

`tools/test-comptoir.js` échoue si, à âge égal, une matière rapporte plus de deux fois une autre, ou si le meilleur revenu baisse d'un âge au suivant. Un futur ajout de ressource ou un changement de débit qui casse l'équilibre sera vu par le test, pas par un joueur.

## Ce qui reste à voir

Le débit manuel (la main, 0,5 par seconde) et les extracteurs de niveaux supérieurs ne sont pas dans cette mesure : elle suppose le meilleur extracteur de base. Les demandes du Troqueur, elles, suivent déjà la charge de production réelle (0.23).
