# Paysages du Carnet — couverture complète des terres

Dix nouvelles vignettes rejoignent les trois vues déjà validées : la Plaine, la Rivière des premiers âges, les Collines, les Profondeurs, le Désert, le Gisement Noir, les Pics Fracturés, l’Orbite, la Lune et le Caveau. Le Domaine dispose ainsi d’une illustration peinte pour chacune des douze terres, avec deux états pour la Rivière.

## Consulter

`index.html` compare les treize vues sur le même papier. Chaque nouveau paysage propose le téléchargement de son maître PNG. Cette galerie de direction artistique montre toutes les terres ; elle n’est pas affichée dans le parcours de découverte du jeu.

Les PNG dans `masters/` sont des copies intactes des sorties de l’outil intégré **imagegen**. `prompts.json` conserve le prompt commun et le sujet exact de chaque génération. `manifest.json` décrit dimensions, canal alpha et empreintes SHA-256 des maîtres et variantes WebP.

## Grammaire visuelle

Format horizontal 3:2, contours d’encre et de graphite, lavis naturels désaturés et bords irréguliers transparents sur les quatre côtés. Les sites d’exploration, objets secrets et révélations du récit ne sont pas illustrés. Le Caveau ne montre que sa salle rocheuse et sa lumière bleue ; les découvertes restent à faire.

La Rivière garde un état naturel avant la Vapeur, puis utilise la pompe déjà validée. Les autres paysages représentent leurs terres sans imposer d’équipement ou modifier les règles et les rendements.

## Intégration

`tools/export-paysages-carnet.py` exporte les nouveaux WebP à 1280 px maximum, qualité 84, avec alpha. Les dix variantes totalisent **3 596 238 octets**. Les maîtres ne sont pas modifiés ; l’option `--partial` sert uniquement aux prévisualisations pendant la génération.

Le mode Carnet utilise ces fichiers dans `assets/carnet/lands/`. Les modes Atlas et Classique conservent leurs décors. Le service worker cache les WebP de diffusion ; aucun maître, document ou galerie n’est ajouté au cache du jeu.

## Validation

- Inspection visuelle de la planche complète, des maîtres et de plusieurs feuilles mobiles : cohérence avec la Lisière et Mercure, sujets distincts, absence de cadres droits, transparence et lisibilité.
- `npm test` : suite complète.
- `npm run test:paysages-ui` : 384 contrôles à 320, 390 et 1280 px, avec et sans compact. Vérifie les douze terres, les treize vues, leur chargement, le format horizontal, l’absence de débordement, l’évolution de la Rivière et le masquage des terres inconnues après un nouveau départ.
- `npm run test:carnet-mobile` : conserve les contrôles de densité, des noms et de l’objectif Fusée avec les nouveaux paysages.

Les icônes de matières et d’objets des âges suivants constituent un autre lot ; cette livraison complète les paysages du Domaine.
