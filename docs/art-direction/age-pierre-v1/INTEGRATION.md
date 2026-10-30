# Raccord du lot Pierre / Rivière

Conserver le Domaine en pages et les commandes existantes. Ce lot n’introduit pas de nouvelle navigation.

- Les 21 identifiants d’objets de `prompts.json` correspondent exactement aux clés des objets d’âge 2. Ajouter leurs chemins au registre des icônes peintes, sans modifier les recettes, leurs noms ou conditions. L’identifiant historique `nasse` désigne l’Argilière.
- Les sources naturelles sont `assets/carnet/sources/source_argile.webp`, `source_silex.webp` et `source_sable.webp`. Conserver les boutons et leurs cibles de récolte ; ne pas déporter les matières hors des lignes du Domaine ni réserver le geste maintenu à une autre action.
- L’illustration `assets/carnet/discoveries/gue.webp` correspond à l’exploration `riviere:gue`, récompensée par le fragment `galet`. Ne pas chercher uniquement un fragment `gue`. Préserver la mémoire existante des lieux après relève.
- `carcasse.webp` et `escalier.webp` correspondent aux explorations et fragments `carcasse` et `escalier`. Garder leurs conditions d’accès actuelles. La Carcasse est une machine d’entretien à six roues ; la plaque et son texte restent dans le récit.
- Les trois dessins sont des études de lieux, pas les états d’une animation ni des calques superposables. La rivière existante `assets/carnet/lands/riviere.webp` reste disponible ; ne pas remplacer son évolution à vapeur.
- Aucun dessin ne doit apparaître comme récompense avant la fin de son exploration. Les objets secrets restent cachés jusqu’à leur découverte.
- Lors de l’intégration, ajouter les fichiers effectivement utilisés au précache du service worker, recalculer le build et tester les sauvegardes anciennes. Éviter de précacher les PNG sources et les pages de revue.

Les pages de ce lot utilisent les WebP directement pour la revue. Elles ne changent ni le registre des icônes du jeu ni sa sauvegarde.
