# Variante B — intégration 0.36.0

La variante B retenue le 27 octobre 2026 est intégrée dans la branche `feat/equilibrage-b`, à partir de `main` (`9ed78d9f190982797902451d3f2ee2eb46d4fbcb`).

## Progression

- Le Cuivre comporte six jalons : lingot de cuivre, enclume, plaque, étain, meule de charbonnier, creuset.
- Le Bronze ouvre les Profondeurs. Le chariot, le quartz et sa première carrière passent au Fer.
- Au Fer : bas-fourneau → fer → chariot → Désert → poudre de quartz → lunette.
- Après l’ordinateur, la quête de la ligne d’assemblage prépare les grands chantiers. Dans le Domaine, un rappel propose de préparer un premier lot à l’Atelier ; il peut être fermé.

## Recettes

Une seule recette ajoutée, aucune ressource brute ajoutée :

| Objet | Recette |
|---|---|
| Poudre de quartz | Tailler 2 quartz → 4 poudres |
| Lentille | Tailler 1 verre + 1 poudre → 1 lentille |
| Brique réfractaire | Chauffer 2 argiles + 1 sable + 1 poudre → 1 brique, à 1 100 °C |

La poudre sert à l’optique et aux fours avant le Silicium. Les indices, textes d’usage et le genre grammatical sont mis à jour. L’arbre utilise le symbole du nouvel objet, sans dépendre d’une image téléchargée.

Les coûts de la fusée et des passages orbitaux restent inchangés : la variante C n’est pas appliquée.

## Parties existantes

La sauvegarde passe en version 12. Les commandes engagées avant la 0.36 et contenant des lentilles ou des briques réfractaires reçoivent un marqueur de recette d’origine. Elles terminent avec leurs anciens ingrédients, leurs réserves et leur progression. Ce marqueur est conservé après rechargement ; de nouvelles commandes ne fusionnent pas avec ces anciens lots.

Les nouveaux lots utilisent la poudre. Annuler un ancien lot restitue ses anciens ingrédients réservés. La migration ne modifie ni l’âge courant, ni les terres ouvertes, ni les stocks, ni les Traces, ni les paiements partiels des passages. Les étapes nouvelles d’âges déjà dépassés ne font pas reculer le joueur.

Les anciens marqueurs des recettes 0.20 restent gérés séparément. Aucun lot en cours n’est annulé pour appliquer l’équilibrage.

## Vérifications

- `npm test` passe, dont validation du contenu, moteur, guidage, arbre, simulateur, serveur et empreinte du service worker.
- `node tools/test-equilibrage-b.js` : 17 tests ciblés. Ils couvrent l’ordre des jalons, la découverte par les gestes, la chaîne Désert → optique → haut-fourneau, les anciens lots simples et en chaîne, la persistance, les remboursements, la non-fusion, les nouveaux ingrédients, les anciens stocks/terres/âges et les dépôts partiels, le rappel de la ligne et le maintien des coûts spatiaux.
- `node tools/test-densite.js` : 8 tests passent, y compris les anciennes recettes 0.20.
- `node tools/test-stockage.js` : 16 tests passent.
- `node tools/test-arbre.js` : 22 tests passent. Les empreintes de contenu sont recalées pour le quartz au Fer et l’ajout d’un nœud ; les contrôles de chevauchement et d’anonymat restent inchangés.
- Service worker recalculé pour que les clients reçoivent la mise à jour.

Scénario sur le contenu intégré, recettes connues, Mémoire `recolte=2, extr=2, mains=2`, 240 minutes actives :

| Terre | Ouverture, minute cumulée |
|---|---:|
| Profondeurs | 21,39 |
| Désert | 28,46 |
| Gisement Noir | 58,52 |
| Pics Fracturés | 74,85 |
| Orbite | 132,74 |

Aucun gel de commande relevé ; le scénario termine aux préparatifs de la Lune. Ces mesures ne remplacent pas un essai humain de découverte ou une usine optimisée. Le rendu HTML des rappels est testé ; aucun contrôle visuel mobile dans un navigateur n’a été effectué dans cet environnement.
