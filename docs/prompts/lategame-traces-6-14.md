# v6.14.0 — Profondeur Late-Game : Résonance Stellaire & Murmures du Temps

**Date** : 2026-10-22  
**Branche** : `gemini-lategame-6-14`  
**Objectif** : Donner une finalité et un rôle infini aux Traces dans le late-game et post-game, lorsque l'arbre de la Mémoire des mains est entièrement complété (`max`).

---

## 1. Paliers Infinis : Résonances Stellaires (Transcendance)
- Catégorie d'améliorations prestigieuses sans plafond de niveau, avec des coûts exponentiels et des multiplicateurs majeurs de fin de jeu :
  - **Surmultiplication des mains (`trans_main`)** : Multiplie la récolte manuelle par $2^l$. Coût exponentiel.
  - **Pulsion des gisements (`trans_terre`)** : Multiplie le rendement des extracteurs par $1.75^l$. Coût exponentiel.
  - **Surcadence des ateliers (`trans_mach`)** : Multiplie la vitesse des machines et commandes par $1.6^l$. Coût exponentiel.
- Intégré dans le calcul de production (`tapYield`, `extRate`, `machSpd`).

## 2. Murmures du Temps (Indices cryptiques de Dénouements)
- Pour les dénouements non encore découverts dans la Mémoire des mains, possibilité d'acquérir un **« Murmure céleste »** contre des Traces (75 ✦).
- Présente une orientation poétique et philosophique sans révélation directe de solutions (respect absolu de la règle des secrets).
- Persistance à travers les relèves dans `S.meta.hints_endings`.

## 3. Feedback Visuel & Header
- Suppression du faux halo d'alerte `ready` sur `#memBtn` lorsque le joueur n'a aucun achat accessible.
- Le bouton pulse uniquement si une amélioration (de base ou stellaire) ou un murmure est effectivement déblocable.

---

## 4. Critères d'acceptation
- Tests unitaires et d'intégration à 100% verts (`npm test`).
- Validation navigateur dans Chrome headless.
- Préservation de la compatibilité des sauvegardes.
