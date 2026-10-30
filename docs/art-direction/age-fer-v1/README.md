# Âge du Fer — lot artistique v1

Lot livré : 24 objets d’âge `a: 5` relevés dans `js/data.js`, y compris la brique réfractaire déclarée après le commentaire « Acier ». Les identifiants du jeu font foi. Les deux curiosités secrètes et la vieille partition sont repliées dans la galerie. Le champ `secret` du manifeste sert ici au masquage de présentation ; les conditions de découverte du moteur font foi. La résonite et le diapason conservent également leurs conditions normales d’accès.

Production individuelle avec l’outil intégré ImageGen. Les prompts exacts et l’état de chaque dessin sont conservés dans `prompts.json`. Les PNG maîtres sont conservés dans `masters/` ; exports WebP transparents, 256 px maximum, dans `assets/carnet/items/` à la racine du dépôt. Le lot reste séparé du jeu pendant la revue artistique.

Fer froid gris, minerai rouge hématite, loupe spongieuse chargée de scories ; pas d’acier poli ni de machines industrielles. La lunette conserve son tube de bronze. Aucune modification du moteur, des recettes ou de leurs conditions de découverte.

À vérifier séparément : la couverture du Bronze, entre les lots Cuivre et Fer. L’absence de dossier dédié ne prouve pas que tous ses objets manquent.

Travaux graphiques reportés à la demande du 30 octobre 2026 : harmoniser les autres icônes, différencier certains boutons et concevoir un véritable thème sombre du Carnet. Retour utilisateur : une joueuse préfère Classique pour son fond sombre. Ces travaux sont également notés dans `docs/A-FAIRE.md`.

## Livraison

24 dessins et 24 exports transparents (430 102 octets au total). Aperçus à 48 et 32 px dans `index.html`, planche publique dans `planche-publique.jpg`. Les 24 PNG maîtres sont archivés, sans duplication dans un ZIP. `python export.py` régénère les WebP et la galerie ; `python contact.py` régénère la planche sur Windows. Aucun raccord JavaScript ni changement du cache : cette PR livre les ressources pour une intégration ultérieure.
