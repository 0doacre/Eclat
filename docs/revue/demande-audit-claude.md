# Message à copier dans Claude

Fais une passe de vérification indépendante d’Éclat, sur le commit **`4a761845f88be5d46163ca318241044ea207b6be`** de `0doacre/craftgame` (0.21.0, PR 89 fusionnée).

Audite toutes les recettes et leurs ingrédients, les ressources et leurs moyens d’accès, les stations et actions, les rendements et coûts, les dépendances et la logique diégétique, les objectifs et changements d’âge, le guidage, les commandes et sauvegardes, les revenus du Comptoir et les Traces, ainsi que la courbe de progression pour des joueurs occasionnels. Examine les fabrications faites dans le désordre, les stocks hérités, la production hors ligne et plusieurs profils de joueur.

Ne te limite pas à `npm test` ou au bot idéal. Distingue ce qui est prouvé dans le moteur, ce qui relève d’un avis de conception et ce qui nécessite un test humain. N’interprète pas automatiquement les durées ou nombres d’objets comme une mesure de qualité.

Pour chaque problème, donne une priorité, le scénario et le résultat observé, les fichiers/lignes, l’impact joueur, et une proposition de correction. Signale aussi ce qui fonctionne. Préserve les solutions du coffre dans les documents qui leur sont réservés. Ne corrige pas encore le jeu : nous allons comparer les deux audits avant de choisir les modifications.

Pour conserver ton indépendance, ne lis pas `docs/revue/audit-progression-codex.md` ni les outils ajoutés pour cet audit avant d’avoir écrit tes propres conclusions. Le commit de référence les précède. Rends un rapport autonome ; ensuite nous comparerons les accords, désaccords, oublis et niveaux de preuve avec l’audit de Codex.
