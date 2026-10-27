# Progression : âges, passages et nouveaux gisements

Audit du 27 octobre 2026, base a92ed2e4afba35ad2072c84f4d47622acabf95a8.

## Cause du problème de la galène

Le Domaine ne montre par défaut que les deux terres les plus récentes. Au Désert de Verre, les Collines Vertes sont donc masquées. La galène, qui n’est récoltable que par extracteur, apparaît lorsque la mine de plomb est connue ou possédée ; rien n’invitait alors à revenir dans cette terre ancienne. Il ne manque pas de ressource dans le graphe de fabrication : il manque un signal et une action pour exploiter le nouveau gisement.

## Corrections

- Lors de la première fabrication d’un extracteur pour une matière non récoltable à la main, un message nomme sa terre et celle-ci est dépliée à la prochaine ouverture du Domaine.
- Un encart placé avant les terres signale les nouveaux gisements dont un extracteur libre attend d’être posé. Il propose de poser l’extracteur directement ou de voir sa terre. Ce rappel est calculé depuis la sauvegarde : il survit à un rechargement et disparaît après la pose. Il couvre aussi l’eau, l’uranium et le soufre.
- La mine de plomb figure explicitement avant le lingot ; la fenêtre Quêtes suit la sous-recette utile et propose un accès au gisement lorsqu’une ressource manque.
- Le guide des passages accompagne les recettes nécessaires au paiement, notamment les briques vers les Collines. Il tient compte des dépôts déjà effectués.
- Le chariot et le passage du Désert sont replacés avant les quêtes du Fer, conformément à leur âge Bronze. Le texte des jalons indique les conditions réelles de changement d’âge.

## Vérifications

- Tests du guidage : passage des Collines, paiement partiel, fabrication et pose de la mine de plomb sans Gisement Noir, ancienne sauvegarde, sous-recette dans les Quêtes, encart de galène avec Collines masquées et après rechargement, disparition après pose, commandes de la fenêtre Quêtes.
- Tests de densité : les huit scénarios passent.
- Le parcours avec recettes connues franchit les dix passages principaux. Une simulation guidée franchit maintenant les Collines, où elle restait auparavant à 99 % faute de briques. Elle ne constitue pas une preuve de confort pour tout le parcours humain.
- Le nouvel ordre avance le Désert dans le scénario de simulation de 30 minutes avec mémoire : ouverture à 29,268 minutes ; les quatre passages précédents gardent leurs valeurs.
- Contrôle navigateur mobile préparé dans tools/test-progression-ui.js, mais non exécuté avec succès ici : téléchargement de Chromium indisponible. Les tests du rendu HTML et des commandes de modale passent ; la validation visuelle reste à faire avant fusion.

Ces changements ne réinitialisent pas les parties et ne modifient pas les prix des passages.
