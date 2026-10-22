# v6.13.0 — Ergonomie Visuelle : Notifications Mobiles & Progression de l'Âge

**Date** : 2026-10-22  
**Branche** : `gemini-ergonomie-6-13`  
**Objectif** : Refondre l'ergonomie visuelle du jeu selon les standards mobiles modernes, en deux volets indissociables :
1. **Notifications & Toasts mobiles (Volet A)** : lisibilité instantanée, hiérarchisation sémantique claire, icônes badges dédiées, fermeture au clic (dismissible), durées de lecture adaptatives.
2. **Progression de l'Âge & Level Design (Volet B)** : jauge visuelle interactive dans l'en-tête, accès direct aux jalons depuis l'âge, carte d'objectif clarifiée et guidage doux vers les étapes clés.

---

## 1. Volet A : Notifications Mobiles Modernes
- **Composant Toast** : capsule élégante avec flou d'arrière-plan (`backdrop-filter`), ombre portée douce et bordure fine.
- **Icône dédiée** : badge circulaire gauche identifiant immédiatement la nature du message (`✓` succès, `⚠️` avertissement/manque, `✨` découverte/secret, `ℹ️` information).
- **Interactivité** : toasts tactiles fermables d'un tap/clic (`.toast-x`), non bloquants pour le reste de l'écran.
- **Timing adaptatif** : calcul de la durée d'affichage proportionnel à la longueur du texte (2.5s à 4.5s) pour un confort de lecture optimal.
- **Empilement fluide** : limitation à 3 notifications avec animation de sortie gracieuse.

## 2. Volet B : Level Design & Progression de l'Âge
- **Header interactif** : le bloc `.age` devient un bouton interactif ouvrant la feuille des étapes de l'âge (`openMilestones()`), enrichi d'une jauge de progression (`.age-bar`).
- **Carte d'objectif (`goalCard`)** : jauge visuelle de complétion de l'âge en cours (`X/Y étapes`), mise en valeur douce des recettes clés d'ouverture.
- **Feuille des Jalons (`openMilestones`)** : tri et présentation lisible des étapes accomplies et restantes, distinction des voies directes et de maîtrise.

---

## 3. Critères d'acceptation
- `npm test` passe à 100% avec les nouveaux tests dédiés à la v6.13.0.
- Validation graphique et fonctionnelle dans Chrome headless.
- Préservation rigoureuse des règles de secret et de narration.
