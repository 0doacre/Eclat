# Carnet — corrections des captures téléphone

Les captures du joueur à l’âge des Composites ont révélé une colonne implicite dans les lignes de gisement. Les nœuds Vivant imposaient `grid-column: 3 !important` aux commandes tandis que le Carnet définissait deux colonnes sur téléphone et en mode compact. La colonne du nom pouvait donc tomber à zéro pixel, créant les textes verticaux observés sur Bauxite.

Les commandes passent explicitement sur la deuxième ligne ; le nom et le débit restent alignés à gauche dans une colonne disponible. Les petites commandes du mode compact gardent leur cible de 44 px sans s’étirer en longues barres.

Sur mobile, le titre de terre, les observations et les marges sont resserrés ; l’âge déjà présent dans l’en-tête et la légende répétant le nom de la terre sont retirés de chaque feuille. Les commandes principales du haut restent sur une ligne avec l’âge, avec des cibles de 44 px ; les indicateurs occasionnels ont un rang séparé.

Les anciens décors verticaux sont cadrés horizontalement à l’affichage et leurs bords sont fondus dans le papier. Les images originales restent intactes ; les nouvelles vignettes peintes gardent leurs proportions et leur détourage. Cette correction n’ajoute pas de nouveaux assets.

Le bouton d’objectif garde uniquement le nom de la fabrication. Les composants restent inclus dans la commande et consultables par le détail de l’objectif ; leur liste n’est plus imprimée dans le bouton.

Validation : `npm test` et `npm run test:carnet-mobile`. Le parcours mobile comporte 136 contrôles sur 320, 360, 390 et 430 px, en compact et normal, avec une Bauxite en production, l’objectif Fusée et les anciens paysages. Il vérifie notamment la largeur réelle du nom, l’absence de colonne implicite, le cadrage, la hauteur des en-têtes et le libellé contenu du bouton.
