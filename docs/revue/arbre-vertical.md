# Arbre : lecture verticale sur téléphone

La vue adopte la largeur disponible dans l’application. Le défilement est vertical,
natif, à la molette comme au doigt. Il n’y a plus de déplacement latéral, de pincement
du graphe ni de réduction des textes par un zoom interne.

## Lire une branche

L’ouverture privilégie l’objectif lorsque son objet est déjà visible, sinon la dernière
recette découverte. Les ingrédients se trouvent au-dessus de l’objet choisi et ses
usages au-dessous. Les flèches indiquent ce sens de lecture, sans traverser les cartes.
Un ingrédient ou un usage se touche pour poursuivre la branche ; « Revenir » permet
de remonter son parcours. « Voir la fiche » reste une action explicite.

Les noms restent écrits en entier, à 14 px au moins, ou 16 px en grand texte. Les cartes
se répartissent sur deux colonnes. Une carte seule prend toute la largeur ; sur les plus
petits écrans en grand texte, les cartes passent sur une seule colonne. La sélection
dispose toujours d’une carte sur toute la largeur. Rien n’est à faire glisser horizontalement,
y compris les noms et les listes d’ingrédients.

Les états sont écrits : recette connue, ressource découverte, recette à découvrir,
fabricable maintenant. L’objectif porte son propre repère. Une couleur ne suffit plus
à distinguer ces informations.

## Retrouver une recette

- « Âges » ouvre la vue d’ensemble sur l’âge actuel. Chaque âge se déplie indépendamment.
- « Objectif » mène à l’objectif de fabrication lorsqu’il existe.
- « Fabricables » montre les recettes connues réalisables avec la Réserve, en tenant
  compte des objets uniques déjà fabriqués. Ce filtre ne supprime pas les ingrédients
  nécessaires à la lecture d’une branche : choisir un objet quitte le filtre.
- La recherche porte sur les noms déjà visibles dans l’arbre.

Les usages connus sont d’abord limités à six cartes pour garder une lecture courte.
Un bouton permet de les afficher tous. Les usages encore inconnus restent anonymes.

## Informations conservées

Le graphe visible reste la seule source des relations affichées. La vue locale ne
cherche pas les dépendances dans les recettes cachées. Les quantités n’apparaissent
que pour une recette connue. Les pistes anonymes n’acquièrent ni nom, ni icône, ni
identifiant de recette. Les secrets et les recettes du parcours réservé gardent leurs
règles d’accès.

La géométrie historique reste dans `js/arbre.js` pour les comparaisons existantes,
mais l’interface ne l’utilise plus. L’outil de mesure sans navigateur décrit désormais
le contenu visible et les voisinages ; les anciens chiffres de croisements dans
`arbre-mesures.md` sont des mesures de l’ancienne présentation.

## Contrôle

Les tests couvrent les relations directes et l’anonymat des pistes, puis le rendu dans
Chrome à 320, 360, 390 et 430 px, en texte normal et en grand texte : largeur du contenu
égale à celle de la vue, noms non tronqués, cibles de 44 px, défilement sans dérive,
recherche, ingrédients, retour et redimensionnement. Les essais tactiles utilisent
aussi des glissements diagonaux. Les liens depuis une fiche et depuis l’objectif
continuent à ouvrir l’arbre.
