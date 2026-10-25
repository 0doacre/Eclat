# Plan de l’alpha

État au 25 octobre 2026, version 0.21.0.

## Où en est le contenu

15 âges, 259 objets, 12 terres, 5 fins. Les extracteurs sont un par ressource, avec des niveaux (0.17 et 0.18). Les âges de la Vapeur (0.19) et de l’Atome (0.20) ont été insérés. Le premier lot de densité (0.21) ajoute l’eau à la Vapeur et le soufre aux Polymères, avec leurs usages : `revue/densite-ressources.md`.

### Objets par âge

| # | Âge | Ress. | Pièces | Extr. | Mach. | Outils | Amél. | Stat. | Autres | Total |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | Âge du Bois | 4 | 4 | 3 | 0 | 2 | 0 | 1 | 3 | 17 |
| 2 | Âge de l’Os | 2 | 3 | 2 | 0 | 5 | 0 | 0 | 4 | 16 |
| 3 | Âge de la Pierre | 3 | 3 | 6 | 1 | 3 | 0 | 1 | 3 | 20 |
| 4 | Âge du Cuivre | 2 | 4 | 3 | 0 | 1 | 1 | 2 | 2 | 15 |
| 5 | Âge du Bronze | 1 | 7 | 2 | 1 | 3 | 3 | 1 | 2 | 20 |
| 6 | Âge du Fer | 2 | 8 | 4 | 0 | 2 | 1 | 1 | 4 | 22 |
| 7 | Âge de l’Acier | 0 | 7 | 0 | 0 | 1 | 0 | 3 | 0 | 11 |
| 8 | Âge de la Vapeur | 1 | 9 | 9 | 1 | 1 | 4 | 0 | 0 | 25 |
| 9 | Âge de l’Électricité | 0 | 7 | 4 | 0 | 1 | 3 | 2 | 1 | 18 |
| 10 | Âge de l’Atome | 2 | 5 | 2 | 0 | 0 | 2 | 0 | 0 | 11 |
| 11 | Âge du Silicium | 0 | 6 | 1 | 1 | 2 | 3 | 1 | 4 | 18 |
| 12 | Âge des Polymères | 5 | 13 | 4 | 0 | 1 | 2 | 2 | 1 | 28 |
| 13 | Âge des Composites | 0 | 8 | 4 | 0 | 1 | 1 | 1 | 0 | 15 |
| 14 | Âge Spatial | 3 | 2 | 3 | 1 | 2 | 2 | 0 | 0 | 13 |
| 15 | Âge Stellaire | 1 | 4 | 1 | 0 | 0 | 0 | 1 | 3 | 10 |

« Autres » = curiosités, secrets, reliques, chemin caché (hors des chiffres du jeu normal).

### Le bot par âge (`node tools/sim.js`, joueur idéal, 4 appuis par seconde)

Temps **passé dans chaque âge**, de son entrée à l’entrée dans le suivant (pour le Stellaire, jusqu’à la fin Dyson) : Bois 0 min 46 · Os 0 min 53 · Pierre 1 min 31 · Cuivre 1 min 03 · Bronze 2 min 51 · Fer 3 min 18 · Acier 0 min 52 · Vapeur 9 min 12 · Électricité 2 min 22 · Atome 1 min 45 · Silicium 0 min 29 · Polymères 2 min 12 · Composites 7 min 24 · Spatial 11 min 16 · Stellaire 32 min 21. Fin en 1 h 18 min 15.

Correction de lecture : jusqu’en 0.20, le « +… » sur la ligne d’un âge mesurait le précédent. Les 52 s attribuées à la Vapeur étaient celles de l’Acier ; les 33 s attribuées aux Polymères étaient celles du Silicium. Le simulateur affiche désormais deux colonnes explicites, entrée et temps dans cet âge, y compris le Bois et le Stellaire. Il construit aussi l’extracteur nécessaire avant de viser une ressource sans récolte à la main.

C’est une borne basse : le bot ne se trompe pas de recette, ne cherche pas et ne lit pas ; par défaut, il fabrique instantanément. Avec `MAINS=1`, qui estime les durées manuelles et l’aide des machines, il termine en 2 h 50 min 47. Les âges à moins d’une minute sont **Bois, Os, Acier et Silicium**. L’absence de ressource brute (Acier, Électricité, Silicium, Composites) est une piste de conception, pas une preuve que l’âge manque de contenu. Le test humain reste nécessaire.

## Ce qui reste avant l’alpha

Dans l’ordre.

1. **Densité**, par lots (méthode : `docs/AJOUTER-UN-AGE.md`).
   - Premier lot réalisé : eau et circuits de vapeur, raffinage du pétrole, soufre, étanchéité et refroidissement. Le but est de relier les recettes, pas d’ajouter une attente.
   - Prochain examen : **Acier et Silicium**, au vu des durées corrigées ; Stellaire et Atome pour leurs usages et leurs choix, pas seulement leur nombre d’objets.
   - Direction retenue avec l’auteur : une ou plusieurs ressources brutes par âge pour donner un sens aux nouvelles techniques. Chaque ressource doit avoir un lieu, une façon de la récolter et des usages. Candidats à étudier : minerai de manganèse (Acier), mica (Électricité), silice de haute pureté (Silicium), basalte (Composites). Une fibre synthétique serait une pièce transformée, pas une ressource brute.
   - Un **deuxième niveau** pour l’uranium et la galène (ils n’en ont qu’un).
   - Un usage pour les pièces qui n’en ont pas (`gants`, `masque`, `bouteille` : ce sont des protections de terre, à confirmer).
2. **Tutoriel exhaustif** (`docs/A-FAIRE.md`, « Juste après ») : un bouton, une explication, au moment où il devient utile. Outil proposé : lister tous les boutons de l’interface et ce qui les explique, avec un test qui échoue quand un bouton n’a aucune explication.
3. **Relecture des textes** : `docs/revue/` (dons, jours, seuils, visiteurs, figures, expéditions, onboarding) et les 23 nouvelles recettes d’extracteurs (indices `h`) pour la langue, selon `docs/STYLE.md`.
4. **Message d’alpha** : bandeau « alpha : les sauvegardes peuvent encore migrer », lien de retour (ce qui est écrit dans le jeu doit rester sobre), export de sauvegarde mis en avant (il existe déjà au menu).
5. **Test à 5 joueurs** (hors simulateur) : mesurer le premier parcours en vrai. À regarder : temps jusqu’à la première relève, où on bloque, ce qui n’est pas compris. Les valeurs du simulateur (`docs/revue/simulation-premier-parcours.md`) servent de point de comparaison.

## Décisions déjà prises

- Un extracteur par ressource, niveaux améliorables un exemplaire à la fois (0.17).
- Les Traces ne se dépensent qu’au réveil d’un nouveau Semeur (0.16.2).
- La première relève est proposée une fois la Plaine franchie, avec une fenêtre en langage d’interface (0.16.1).
- Alpha **ouverte à des testeurs** avant toute alpha publique.
- Les nouvelles ressources doivent expliquer les techniques et relier les âges entre eux ; une ressource déjà connue peut changer d’usage et d’échelle (l’eau à la Vapeur).

## À trancher plus tard

- Les ressources précises des prochains lots et leur place dans les recettes, sans ajouter une chaîne parallèle qui ne sert qu’à elle-même.
- Un 16ᵉ âge après le Stellaire : une suite au récit demande un dénouement ; à décider avec l’histoire.
- Les terres sans règle de terre propre (Gisement Noir, Mercure) : `docs/A-FAIRE.md`.
