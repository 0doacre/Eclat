# Carnet et Arbre : deux usages

L’Arbre aide à comprendre où l’on en est et vers quoi avancer. Le Carnet garde les
recettes apprises et permet de préparer des fabrications en quantité.

## Arbre : progression et relations

L’entrée par l’onglet montre l’âge actuel, ses étapes accomplies et le prochain objectif.
Choisir une découverte permet de suivre ses liens : ce qu’elle utilise et ce qu’elle
permet de fabriquer ensuite. Les noms restent lisibles et le défilement reste vertical,
à la largeur du téléphone.

Le filtre Fabricables, les dosages et les indications de disponibilité dans la Réserve
sont retirés de cette vue. Les étapes et les états de découverte se mettent à jour quand
le joueur avance ; une variation de stock ne redessine plus l’Arbre.

## Carnet : mémoire et lots

Le filtre initial « Apprises » montre les recettes déjà découvertes. Les indices des
recettes inconnues restent dans « À découvrir », où le sélecteur de quantité est masqué.
Les recettes apprises restent consultables après une relève, y compris celles d’un âge
qui n’est plus atteint. Leur consultation ne débloque pas leur fabrication.

La quantité mémorisée choisit le nombre de répétitions de la recette : ×10 correspond
à dix fabrications. Le Carnet affiche le nombre de pièces ainsi produites, les ingrédients
du lot, les ressources encore à réunir et une durée de fabrication estimée. Les pièces
intermédiaires peuvent être fabriquées avec la commande. La durée ne promet pas l’heure
de fin d’une commande qui attend des ressources.

Les coûts des constructions tiennent compte des exemplaires possédés et déjà commandés.
Les objets uniques restent limités à un exemplaire ; les lots fixes des machines et
extracteurs gardent leur limite existante. Max suit la Réserve ; si aucun lot n’est
réalisable, la recette unitaire reste consultable sans annoncer une production fictive.

« Prêtes » vérifie les ingrédients directs du lot choisi. « Réalisables » tient compte
de la fabrication des pièces intermédiaires. Ces filtres et le devis suivent les changements
de stock. Les règles du moteur et les quantités des recettes restent identiques.

## Passer de l’un à l’autre

- Depuis une recette connue de l’Arbre : « Ouvrir la recette dans le Carnet ».
- Depuis le Carnet : « Situer dans l’Arbre », quand cette recette apparaît dans l’Arbre.

Ces liens retrouvent la recette choisie et conservent la quantité mémorisée. Le détail
de fabrication du Carnet porte sur le lot sélectionné, et garde sa fonction distincte
de la branche de connaissances.

## Contrôle

Les tests du devis comparent son plan à une véritable commande sans modifier la partie
pendant la lecture : coût, rendement, pièces intermédiaires, prix croissants, objets
uniques et Max. Les parcours mobiles vérifient aussi la dépense réelle d’un lot, les
allers-retours, les indices et la conservation des recettes après une relève, en texte
normal et en grand texte. Le nouveau module du Carnet figure dans le cache hors ligne.
