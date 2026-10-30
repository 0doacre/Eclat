# Raccord du lot Cuivre / Collines

Conserver le Domaine en pages et ses commandes. Ce lot ne modifie pas la navigation.

- Les 15 identifiants d’objets du manifeste correspondent aux clés d’âge 3. Ajouter leurs chemins au registre des icônes peintes sans modifier les recettes, noms, récompenses ou conditions. `puits` désigne la Mine de cuivre ; `cassiterite_1` la Mine d’étain.
- Les sources naturelles sont `source_malachite.webp` et `source_cassiterite.webp` dans `assets/carnet/sources/`. Réutiliser la source de pierre existante. Garder les cibles fixes et le geste de récolte maintenu.
- `assets/carnet/discoveries/rails.webp` correspond à `collines:rails`. Le récit actuel est la page `rails2` (« Le Wagonnet »), tandis que d’anciennes sauvegardes peuvent porter le fragment `rails`. Reconnaître les deux pour la mémoire de découverte.
- `sommet.webp` correspond à `collines:sommet`, à la tablette et aux pages/fragments `vue2` ou `vue`. Ne pas confondre le nom de l’exploration et celui du fragment.
- `nid.webp` représente le Replat : quatre pierres plates, pas un nid d’oiseau. Conserver les conditions d’accès existantes, notamment les objets requis et la découverte du sommet.
- Le miroir ne montre ni visage ni inscription dans le dessin ; ces révélations restent dans le récit. La tablette est une relique, pas une recette artisanale supplémentaire.
- Le nombre exact des encoches et des cailloux reste porté par le texte du jeu : les dessins ne doivent pas servir seuls à encoder les énigmes numériques.
- Les trois découvertes sont des études complètes, pas des calques superposables ou des états de construction. Le paysage existant `assets/carnet/lands/collines.webp` reste la référence.
- Lors du raccord, ajouter les WebP utilisés au précache du service worker, recalculer le build et vérifier les anciennes sauvegardes. Ne pas précacher les PNG sources ni les pages de revue. Aucun lieu ou objet ne doit être révélé avant sa découverte.
