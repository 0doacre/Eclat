# Le monde autour du camp — prototype jouable

Page : `docs/art-direction/domaine-monde-v1/`.

Un paysage continu Lisière → Plaine, dessiné à l’encre et à l’aquarelle. Camp central, ressources représentées uniquement par leurs illustrations, détails dans une fiche contextuelle. Les terres se surlignent au survol et se rapprochent au toucher. Le sentier se trace puis la caméra recule lors de l’ouverture de la Plaine ; les boutons de cadrage et le déplacement restent disponibles.

Le moteur courant gère réellement récolte, pose/amélioration/production des extracteurs, explorations et passage. Les explorations durent 6 secondes ; matériaux de passage et installations prêtes sont fournis pour tester rapidement. Les quatre chapitres chargent des états de démonstration, sans import de partie réelle. Les pages découvertes restent consultables dans la collection.

Sauvegarde exclusive : `eclat.prototype.monde.v1`. Aucun compte ni synchronisation. Le Domaine du jeu n’est pas remplacé.

Le + des installations apparaît sur la ressource sélectionnée, au survol ou au focus ; l’appui long ouvre la même fiche sans récolter. Les boutons restent utilisables au clavier, les ressources ont des noms accessibles, et les mouvements respectent la réduction des animations.

Illustration `assets/monde.webp` : originale, produite avec ImageGen pour ce prototype, puis encodée en WebP sans retouche du dessin. Camp, ressources et extracteurs réutilisent les assets Carnet existants.

Limites à tester : lisibilité des gisements sans texte, navigation mobile entre vue locale et ensemble, cohérence des échelles des installations, intérêt du camp après plusieurs relèves. L’étude ne change ni l’économie ni les règles de relève du jeu.

Vérification : `npm run test:domaine-monde-ui` (Playwright, variables PW et CHROMIUM selon environnement). Camp, deux explorations de chaque terre, passage, dézoom, récolte, extracteur/amélioration/production, appui long, collection, persistance et isolation de sauvegarde, aux largeurs 320/390/1200.
