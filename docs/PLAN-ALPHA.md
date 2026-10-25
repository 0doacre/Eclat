# Plan de l’alpha

État au 25 octobre 2026, version 0.20.0.

## Où en est le contenu

15 âges, 246 objets, 12 terres, 5 fins. Les extracteurs sont un par ressource, avec des niveaux (0.17 et 0.18). Les âges de la Vapeur (0.19) et de l’Atome (0.20) ont été insérés.

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
| 8 | Âge de la Vapeur | 0 | 6 | 8 | 1 | 1 | 3 | 0 | 0 | 19 |
| 9 | Âge de l’Électricité | 0 | 7 | 4 | 0 | 1 | 3 | 2 | 1 | 18 |
| 10 | Âge de l’Atome | 2 | 5 | 2 | 0 | 0 | 2 | 0 | 0 | 11 |
| 11 | Âge du Silicium | 0 | 6 | 1 | 1 | 2 | 3 | 1 | 4 | 18 |
| 12 | Âge des Polymères | 4 | 9 | 3 | 0 | 1 | 1 | 2 | 1 | 21 |
| 13 | Âge des Composites | 0 | 8 | 4 | 0 | 1 | 1 | 1 | 0 | 15 |
| 14 | Âge Spatial | 3 | 2 | 3 | 1 | 2 | 2 | 0 | 0 | 13 |
| 15 | Âge Stellaire | 1 | 4 | 1 | 0 | 0 | 0 | 1 | 3 | 10 |

« Autres » = curiosités, secrets, reliques, chemin caché (hors des chiffres du jeu normal).

### Le bot par âge (`node tools/sim.js`, joueur idéal, 4 appuis par seconde)

Bois → Os 0 min 46 · Pierre +0 min 53 · Cuivre +1 min 31 · Bronze +1 min 03 · Fer +2 min 51 · Acier +3 min 18 · **Vapeur +0 min 52** · Électricité +8 min 34 · Atome +2 min 17 · Silicium +1 min 51 · **Polymères +0 min 33** · Composites +1 min 59 · Spatial +6 min 59 · Stellaire +11 min 07. Fin en 1 h 16 min.

C’est une borne basse : le bot ne se trompe pas de recette, ne cherche pas, et ne lit pas. Les âges à moins d’une minute (Vapeur, Polymères) et les âges **sans ressource brute** (Acier, Vapeur, Électricité, Silicium, Composites) sont les plus minces à jouer.

## Ce qui reste avant l’alpha

Dans l’ordre.

1. **Densité** (une version, sur la méthode de `docs/AJOUTER-UN-AGE.md`).
   - Étoffer les âges les plus fins : Polymères et Vapeur (le bot les passe en moins d’une minute), Stellaire (10 objets), Atome (11).
   - Une ressource brute dans les âges qui n’en ont pas (candidats : un sable de silice pour le Silicium, des fibres synthétiques pour les Composites), sur le modèle de l’uranium et de la galène (ressource d’extracteur).
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

## À trancher plus tard

- Le deuxième niveau de ressource par âge (voir densité) : une ressource brute partout, ou seulement là où l’histoire s’y prête.
- Un 16ᵉ âge après le Stellaire : une suite au récit demande un dénouement ; à décider avec l’histoire.
- Les terres sans règle de terre propre (Gisement Noir, Mercure) : `docs/A-FAIRE.md`.
