# Audit de l'interface mobile : sobriété et profondeur

Écrit le 1er novembre 2026, branche `claude/preview-sobriete`. Demande de l'auteur : l'interface d'Éclat est trop chargée, elle prend toute la place et ressemble encore à « une jolie interface Excel ». La direction artistique plaît ; ce qui pèse, c'est le nombre d'écrans, le défilement, les boutons.

## Le repère : Rise of Jericho

D'après les captures fournies par l'auteur (jeu en paysage, version mobile) :

- une scène, un grand bouton d'action qui change avec le contexte (« MINE », « MAKE MUD BRICKS ») ;
- les actions rares sont des panneaux posés dans le décor (« SLEEP », « LEADING », « SEE ») ;
- les choix se présentent par trois : une icône, un nom, une ligne d'effet, le coût en icônes, un seul bouton de validation ;
- des flèches pour passer d'un objet à l'autre (forgeron), jamais de liste ;
- trois ressources en haut, sans libellé ; une flèche de retour toujours au même endroit ;
- trois à six cibles tactiles par écran, aucun défilement.

Réserves : le jeu est en temps réel et en paysage, Éclat est en portrait et passe par des recettes ; les petits textes d'effet sont presque illisibles. Les critiques publiques de Rise of Jericho visent ses commandes et la répétition pour débloquer des inventions, pas ses menus. Le repère vaut pour la retenue, pas pour la mise en page.

## Ce que dit la mesure (`node tools/mesure-sobriete.js`, 390 × 844)

Parties de test remplies au maximum (toutes les recettes de l'âge, 40 de chaque ressource) : c'est un plafond, pas une partie type. En-tête et barre d'onglets : 112 à 115 px sur 844.

| Écran (âge 5) | Cibles à l'écran (hors en-tête) | Cibles de la page | Défilement |
|---|---:|---:|---:|
| Terres | 18 | 22 | 0 |
| Labo, avant | 19 | 19 | 157 px |
| Labo, après | 19 | 19 | 0 |
| Page d'un métier, avant | 12 | 38 | 847 px |
| Page d'un métier, après | 25 | 37 | 38 px |
| Atelier (liste des métiers) | 8 | 8 | 0 |
| Journal, Recettes, avant | 22 | 306 | 0 (liste dans des volets) |
| Journal, Recettes, après (tuiles) | 21 | 57 | 0 |
| Progression | 26 | 92 | 0 |

## Ce que la première passe change

- **Labo** : le titre et son sous-titre disparaissent (le nom de l'onglet suffit), le nom de l'outil passe en info-bulle, les emplacements sont plus bas, la recherche et les filtres se serrent. Tout tient dans l'écran à 390 × 844 ; à 320 × 568 il reste 260 px de défilement.
- **Page d'un métier** : l'équipe (embauches, seuil, fatigue, goulots, énergie) est un volet fermé d'une ligne ; « À construire » est un volet fermé ; un seul échelon s'affiche ; les recettes sont une seule rangée qui glisse ; les quantités se réduisent à ×1, ×10 et Max, avec « ⋯ » pour le reste. La page tient presque dans un écran (38 px de défilement au lieu de 847).

Ce que cette passe ne change pas : le nombre d'actions. Elle rend les écrans plus calmes ; elle ne les rend pas encore plus pauvres en choix.

## La vision (1er novembre, après la première passe)

Éclat doit se lire comme un livre qu'on feuillette, pas comme une feuille de calcul : un écran, une chose à faire, et le détail à la demande.

1. **Lire, c'est toucher une tuile.** Le Carnet montre des icônes avec un nom ; toucher ouvre la fiche, qui seule porte le détail, le coût et le bouton « Atelier ». C'est fait en 0.66 (aperçu) : les Recettes passent de 306 cibles dans la page à 57, et de 3 000 à 880 signes de texte.
2. **Fabriquer, c'est un seul lieu.** L'Atelier fabrique et automatise ; le Labo essaie ; le Carnet lit. Chaque écran a un verbe.
3. **Le détail se replie.** Équipe, seuil, énergie, constructions : une ligne qu'on déplie. Ce qui ne sert pas dans les dix prochaines secondes n'est pas à l'écran.
4. **L'aide se voit au tactile.** Un appui long sur un bouton à info-bulle montre son texte (fait en 0.66), ce qui rend vraie l'explication notée dans l'audit des boutons.
5. **Un geste principal en grand.** À terme, chaque écran a une action dominante qui change avec le contexte (le geste au Labo, « À la main » à l'Atelier), comme chez Rise of Jericho.

Ce que la vision ne fait pas : réduire le jeu. Les âges, les recettes et les métiers restent ; seule leur présentation s'allège.

## La suite proposée

1. **Progression** (fait en partie : titre, légende et filtres repliés, 92 → 88 cibles ; reste la liste des âges) : l'écran le plus « tableur » qui reste. Le chemin de l'âge en cours et l'objectif, le reste replié.
2. **Page d'un métier** : trois recettes à la fois avec flèches, au lieu de la rangée ; un seul bouton principal.
3. **Un grand bouton contextuel** au Labo, qui change avec ce qui est posé sur l'établi.
4. **Menu ☰ en bas** : le coin haut droit est le plus difficile à atteindre sur un grand téléphone.
5. **Bandeaux** : 112 à 115 px sur 844 ; la ligne d'ambiance sous l'en-tête pourrait se replier.

## Budget de sobriété (cible)

Par écran principal : au plus 8 cibles hors en-tête, aucun défilement, moins de 150 signes lisibles d'un coup. Aujourd'hui seule la liste des métiers respecte les trois.
