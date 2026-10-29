# Le Sentier des Herbes — premier chantier vivant

Le premier passage, de la Lisière à la Plaine, se construit par les apports existants de bois, fibres et cailloux.
La scène comporte quatre couches transparentes : le chemin achevé, deux massifs de ronces et un tapis d’herbes. Les ronces se déplacent et s’écartent ; les herbes s’affaissent puis disparaissent pour laisser voir la terre et les pierres du chemin. Quelques projections de terre et de brefs bruitages accompagnent les apports.

Le montant réellement utilisé détermine l’avancement. Le chantier reprend sans animation au chargement. Les coûts, les explorations préalables, les rabais et l’ouverture restent entièrement gérés par `E.passPour` ; aucun état métier n’est ajouté.
La scène figure dans le passage du Domaine et dans sa fiche sur la Carte. Les objectifs gardent leur présentation compacte. Dans Carnet, le bouton indique le geste en cours : dégager, aménager, marquer. Le chemin achevé reste dans la Lisière, avec une action pour rejoindre la Plaine.
La réduction des animations et les réglages sonores existants sont respectés. Une nouvelle relève reprend l’état de passage propre au nouveau cycle, notamment les passages offerts par Raccourci.
Le bouton « Revoir les travaux » rejoue uniquement l’animation du chemin achevé : aucun matériau n’est utilisé, aucun gain accordé et aucun état de passage modifié.

## Sources

Quatre originaux PNG créés avec l’outil intégré ImageGen dans `masters/`, prompts exacts dans `prompts.json`. Les trois couches végétales prennent le chemin achevé comme référence de cadrage et de style.
`tools/export-sentier-herbes.py` réalise uniquement les exports WebP transparents ; les PNG restent intacts.
Les bruitages de travaux sont synthétisés par le moteur audio existant.

## Vérification

`node tools/test-sentier-chantier-ui.js` vérifie les apports partiels, l’absence de travaux sans matériaux, les explorations préalables, la reprise de sauvegarde, les formats mobile/ordinateur et compact, la fiche sur la Carte, l’ouverture et la conservation du chemin, les déplacements réels des ronces et l’arrêt des animations.
