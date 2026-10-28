# Gemini — intégrer les illustrations de l’Âge de l’Os

Poursuivre l’intégration du Carnet du Semeur avec le deuxième lot, en préservant le travail en cours sur l’interface dessinée.

Archive : `docs/art-direction/age-os-v1/da-age-os-v1-part1.zip` et `da-age-os-v1-part2.zip` (scindée pour respecter la limite Cloudflare Pages de 25 Mo).

- Les deux parties contiennent le dossier `da-age-os-v1/`.
- Génération : outil imagegen intégré ; PNG maîtres intacts, fond transparent.

Extraire dans un dossier de travail. Lire `README-GEMINI.md`, `manifest.json` et `qa/visual-review.md`, puis ouvrir `preview.html` et `continuite.html`. Les quatre images dans `references-bois/` servent uniquement à la comparaison avec le lot déjà livré. Les prompts reproductibles sont dans `prompt-commun.txt` et `asset-specs.json`.

## Périmètre

Âge d’indice 1 : 16 nouvelles illustrations, soit 14 objets et 2 sources.

- Objets communs : `os`, `cuir`, `aiguille`, `laniere`, `colle_os`, `arc`, `fronde`, `outre`, `pic_os`, `collets`, `tunique`, `encre`, `cuir_1`.
- Objet propre au mode preview équipé : `racloir_os`. Ne pas créer cet objet dans un mode qui ne le possède pas.
- Sources de la Plaine : `source_os` pour la ressource `os`, `source_cuir` pour `cuir`.

`cuir` garde son nom affiché **Peau**. L’animal de la source représente la faune existante : aucune mécanique, espèce ou recette supplémentaire à ajouter. Les curiosités `de_vingt` et `fouet_cuir` sont hors périmètre.

## Intégration

Étendre le registre existant `js/illustrations.js` et l’exporteur `tools/export-carnet.py`, en conservant la compatibilité avec le Bois. Exporter les variantes WebP utiles dans `assets/carnet/items/` et `assets/carnet/sources/`. Conserver l’alpha, les proportions et les couleurs naturelles ; aucun filtre de teinte global sur les matières. Comparer les exports aux maîtres, particulièrement les traits fins et les bords sur fond sombre.

Raccorder les objets à la Réserve, à l’Atelier et aux autres emplacements déjà couverts par le registre. Utiliser les illustrations de source dans le Domaine, plutôt que les matières isolées. Respecter les états de découverte et conserver les replis existants pour les éléments non couverts. Ne pas modifier manuellement `js/icons.js` en contournant son générateur.

Les détails des aiguilles, de l’arc et des collets s’effacent à 32 px : conserver un nom lisible à proximité et éviter les recadrages. Les sources sont conçues pour être montrées plus grandes. Ne pas modifier l’équilibrage ou les recettes pour correspondre aux dessins.

N’ajouter au cache hors ligne que les fichiers utilisés en production ; exclure maîtres, références, captures et ZIP. Recalculer le service worker selon le workflow du dépôt.

## Validation attendue

Les contrôles livrés portent sur les PNG et leurs galeries : alpha, empreintes, silhouettes sur fonds clair/sombre, tailles 32/48 px et absence de débordement mobile. Ils ne valident pas encore l’intégration au jeu.

Après intégration, vérifier le rendu réel sur mobile et ordinateur, dans les thèmes disponibles, les objets inconnus/découverts, la distinction matière/source et le racloir uniquement dans son mode. Lancer les suites de tests adaptées, contrôler le chargement hors ligne et fournir un compte rendu avec le commit ou la PR, les validations et les limites restantes.
