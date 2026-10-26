# Arbre : lecture verticale sur téléphone

> **0.28.0 : la frise et la feuille.** L'Arbre s'ouvre toujours sur la **progression**. Sous elle, chaque âge se lit en
> pastilles (icône, nom court, état) au lieu de cartes : une rangée de quatre sur téléphone, trois en grand texte ou sous
> 340 px, les matières d'abord, puis les recettes de la moins à la plus profonde, les pistes à la fin. Toucher une pastille
> ouvre une **feuille** qui monte du bas (une fenêtre : Échap, ✕ et Retour la ferment, le focus y reste) avec la branche
> décrite plus bas : ce que la recette utilise au-dessus, ce qu'elle sert à fabriquer au-dessous, huit usages au plus avant
> « Voir les N usages connus ». Une pastille de la feuille fait passer à celle-là, « Revenir » remonte. Les noms des pastilles
> sont écrits à 12 px (14 px en grand texte), sur deux lignes au plus ; le nom entier et l'état sont dans le nom accessible,
> et la feuille écrit le nom entier. Les liens « Voir dans l'arbre », « Objectif » et « Situer dans l'Arbre » ouvrent la feuille.
> Les pistes restent anonymes. Le reste de ce document décrit le contenu de la branche, inchangé.

La vue adopte la largeur disponible dans l’application. Le défilement est vertical,
natif, à la molette comme au doigt. Il n’y a plus de déplacement latéral, de pincement
du graphe ni de réduction des textes par un zoom interne.

## Lire une branche

L’ouverture montre la progression dans l’âge actuel et le prochain objectif. Les
ingrédients se trouvent au-dessus de l’objet choisi et ses
usages au-dessous. Les flèches indiquent ce sens de lecture, sans traverser les cartes.
Un ingrédient ou un usage se touche pour poursuivre la branche ; « Revenir » permet
de remonter son parcours. Une recette découverte renvoie vers le Carnet pour préparer
sa fabrication ; une ressource peut ouvrir sa fiche.

Les noms restent écrits en entier, à 14 px au moins, ou 16 px en grand texte. Les cartes
se répartissent sur deux colonnes. Une carte seule prend toute la largeur ; sur les plus
petits écrans en grand texte, les cartes passent sur une seule colonne. La sélection
dispose toujours d’une carte sur toute la largeur. Rien n’est à faire glisser horizontalement,
y compris les noms et les listes d’ingrédients.

Les états sont écrits : recette découverte, déjà fabriqué, ressource découverte, recette
à découvrir. L’objectif porte son propre repère. Une couleur ne suffit plus
à distinguer ces informations.

## Retrouver une recette

- « Progression » ouvre la vue d’ensemble, ses étapes accomplies et le prochain objectif.
  Chaque âge se déplie indépendamment.
- « Objectif » mène à l’objectif de fabrication lorsqu’il existe.
- Les dosages, les stocks et les filtres de production se trouvent dans le Carnet.
- La recherche porte sur les noms déjà visibles dans l’arbre.

Les usages connus sont d’abord limités à six cartes pour garder une lecture courte.
Un bouton permet de les afficher tous. Les usages encore inconnus restent anonymes.

## Informations conservées

Le graphe visible reste la seule source des relations affichées. La vue locale ne
cherche pas les dépendances dans les recettes cachées. Les quantités n’apparaissent
pas dans l’Arbre. Les pistes anonymes n’acquièrent ni nom, ni icône, ni
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
