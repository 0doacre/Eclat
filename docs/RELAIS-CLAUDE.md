# ÉCLAT — Document de Relais & Feuille de Route (Session du 22 Octobre 2026)

Ce document récapitule l'ensemble des développements menés aujourd'hui sur le projet **ÉCLAT**, l'état exact du dépôt, ainsi que les spécifications détaillées pour que Claude et le développeur puissent enchaîner sans friction sur les prochaines itérations (**v0.7.1** et **v0.8.0**).

---

## 1. Nouvelle Convention de Versionnement

À compter de ce jour, le projet a basculé d'une numérotation historique (6.14.0) vers un versionnement sémantique propre et lisible jusqu'à la version finale livrable :

- **`0.7.0`** : Version courante (point de départ de cette nouvelle ère).
- **`0.0.x`** : Mises à jour mineures, correctifs de bugs, ajouts ciblés de lisibilité (ex. `0.7.1`).
- **`0.x.0`** : Grandes étapes et lots majeurs d'ergonomie et de contenu (ex. `0.8.0`).
- **`1.0.0`** : Version complète, équilibrée, peaufinée, jouable et officiellement livrable.

---

## 2. Historique Chronologique des Lots Menés Aujourd'hui

### A. v6.12.0 — Langage naturel & épuration des calques IA
*Branche : `gemini-langage-6-12` (fusionnée sur `main`)*
- **Allégement du vocabulaire technique** : suppression systématique des calques de traduction et formulations mécaniques.
  - Le verbe « verser » appliqué aux solides et poudres a été remplacé par des verbes naturels (« ajouter », « déposer », « enfourner », « mélanger »).
  - La mention répétitive et rigide « en réserve » a été assouplie en « dans ta Réserve », « disponible », « en stock » ou intégrée au récit.
- **Saveur des échecs** : réécriture des phrases de combinaisons infructueuses à l'Atelier avec un ton organique et sensoriel.
- **Lexique** : mise à jour de `docs/LEXIQUE.md`.

### B. v6.13.0 — Ergonomie visuelle mobile & progression d’âge
*Branche : `gemini-ergonomie-6-13` (fusionnée sur `main`)*
- **Toasts flottants modernes** :
  - Remplacement des anciens bandeaux intrusifs par des pastilles légères, dotées d'une icône sémantique, d'un bouton de fermeture rapide `✕` et d'une durée d'affichage dynamique proportionnelle à la longueur du message.
  - File d'attente intelligente évitant l'empilement chaotique sur mobile.
- **Bouton d’âge interactif (`#ageBtn`)** :
  - Intégration d'une jauge de complétion visuelle dans l'en-tête indiquant la progression des étapes de l'âge en cours.
  - Clic interactif ouvrant directement la modale des jalons de l'âge (`openMilestones()`).

### C. v6.14.0 — Profondeur late-game & résonance stellaire
*Branche : `gemini-lategame-6-14` (fusionnée sur `main`)*
- **Résonances Stellaires infinies** :
  - Ajout de 3 améliorations exponentielles débloquées au cycle 2+ dans la Mémoire des mains :
    1. *Résonance des Mains* (`trans_main`) : multiplicateur de vitesse et rendement manuel.
    2. *Éveil de la Terre* (`trans_terre`) : transcendance des extracteurs.
    3. *Souffle des Rouages* (`trans_mach`) : puissance et automatisation des machines.
  - Coûts exponentiels croissants en Traces, assurant un puits d'investissement sans fin pour les cycles avancés.
- **Murmures du Temps** (`buyEndingHint`) :
  - Possibilité d'échanger des Traces contre des échos prophétiques pour orienter la découverte des dénouements secrets sans spoiler leur solution.
- **Justesse du signal de relève** :
  - Correction de l'indicateur `#memBtn.ready` afin qu'il ne s'allume que lorsqu'une amélioration est réellement achetable.

### D. v0.7.0 — Pastilles d'objets interactives & affordance unifiée
*Branche : `gemini-item-pills-0-7-0` (prête et poussée sur GitHub)*
- **Composant universel `.item-pill`** ([css/style.css](file:///c:/projets/temporaire/css/style.css)) :
  - Affichage pastille (`border-radius: 999px`) regroupant icône, quantité (`.pill-qty`), nom de l'objet, état de manque (`.lack`), et état inconnu (`.unk`).
  - Affordance tactile complète : éclairage au survol (`:hover`), retour d'enfoncement (`:active`), et contour d'accessibilité (`:focus-visible`).
  - Accessibilité : support natif du clavier (`tabindex="0"`, `role="button"`, activation via <kbd>Entrée</kbd> et <kbd>Espace</kbd>) et info-bulles explicites (`title="... (toucher pour inspecter)"`).
- **Unification transversale** ([js/ui.js](file:///c:/projets/temporaire/js/ui.js), [js/domaine.js](file:///c:/projets/temporaire/js/domaine.js)) :
  - Intégration dans la carte d'objectif (« *Il faut d’abord :* », ressources manquantes), les listes d'ingrédients (`.ing.link`), les messages de blocage (`needText`, `resultHTML`), le suivi d'artisanat et les jalons d'âge.
  - En-têtes du Comptoir et lignes de coût du Grand Œuvre rendus cliquables d'un geste.
- **Validation** :
  - 153 tests moteur, 32 tests récit, 9 tests serveur au vert.
  - Test d'intégration automatisé en vrai navigateur headless Chrome (CDP) : modal de recette testée au clic réel, 0 erreur console.

---

## 3. État Actuel du Projet

- **Branche Git actuelle** : `gemini-item-pills-0-7-0`
- **Dernier commit** : `813fa6e` (`v0.7.0 : pastilles d'objets interactives, affordance tactile et reinitialisation de version`)
- **Dépôt distant** : à jour sur `origin/gemini-item-pills-0-7-0`
- **Build & Service Worker** : Service worker à jour sous le hash `182832bd6f`
- **Arbre de travail** : Propre (`working tree clean`), aucun fichier orphelin.

---

## 4. Feuille de Route & Suivi des Versions

### A. v0.7.0 — Pastilles d'objets interactives & relecture
- **Relecture & Fusion** : Fusionnée sur `main` (`515c91e`).
- **Correctifs de relecture intégrés** : matières brutes sans recette (`bois`, `silex`…) correctement nommées et dotées de leur icône dans `.item-pill`, retour à la ligne rétabli pour les phrases complètes de `.passcost .ing.link`.

### B. v0.7.1 — Horodatage du Journal (Réalisé)
- **Branche** : `claude-horodatage-0-7-1`
- **Données d'horodatage (`js/engine.js`)** :
  - Ajout de `stamp(k)` stockant le triplet `[timestamp, cycle, age]` dans `S.meta.stamps[k]`.
  - Persistant à la relève (`newCycle`) et sauvegardé dans le JSON (`E.serialize`).
  - Enregistré automatiquement lors de :
    - Découverte d'un fragment (`f:...`) et revisite (`r:...`).
    - Obtention d'une page du Livre des Semeurs (`p:...`).
    - Compréhension d'un signe (`s:...`).
    - Apparition et résolution d'une question (`q:...`, `qr:...`).
- **Rendu dans l'interface (`js/ui.js` & `css/style.css`)** :
  - Double affichage diégétique et temporel : `Cycle X · Âge du [Nom] · 22 oct. 21:40` (format complet) et `Cycle X · 22 oct.` (format court pour les cartes compactes).
  - Présent dans la liste des fragments, la modale de lecture, les cellules et fiches du Livre des Semeurs, les cartes de signes compris et les cartes de questions.
  - Style discret `.stamp` en typographie à espacement tabulaire (`tabular-nums`).
  - Fallback sobre : les entrées d'anciennes sauvegardes ne montrent aucune fausse date inventée.
- **Validation** : 155 tests moteur, 32 tests récit, 9 tests serveur, test navigateur CDP sans erreur console.

---

## 5. Prochaine Étape Majeure : v0.8.0 (Lot 2) — Le Registre de Quêtes & Expansion du Troqueur

#### Contexte & Besoin
La carte d'objectif unique actuellement située en haut du Domaine a atteint ses limites ergonomiques et narratives. L'utilisateur souhaite la transformer en un véritable **Registre de Quêtes** articulé en 3 piliers :

1. **Quête de Scénario (Fil Rouge)** :
   - La grande traversée narrative : guide le joueur depuis les premiers émois du Bois jusqu'aux dénouements du Cosmos.
   - Affiche les objectifs principaux, les grands paliers technologiques et les révélations de l'Arche.
2. **Rituels Quotidiens des Semeurs** :
   - 3 rituels renouvelés chaque jour (ou à chaque nouveau cycle).
   - Exemples de rituels :
     - *Patience des mains* : fabriquer 20 objets à la main sans l'aide des machines.
     - *Mémoire de la pierre* : récolter 500 unités d'une matière spécifique.
     - *Écoute des étoiles* : jouer une mélodie particulière à la tombée de la nuit.
   - Récompenses : Intuition (`✨`), Traces (`✦`), ou écus.
3. **Contrats du Troqueur (Refonte et Expansion)** :
   - Le Troqueur est actuellement cantonné à quelques demandes statiques dans le Domaine.
   - **Nouveau système de contrats** :
     - Commandes commerciales à durée limitée ou à livraisons échelonnées.
     - Système d'affinité / réputation auprès du Troqueur débloquant des recettes exclusives, des ornements ou des pages de savoir oubliées.
     - Tableau d'affichage dynamique au Comptoir avec pastilles d'objets interactives `.item-pill`.

#### Architecture suggérée pour la v0.8.0
- **Nouveau fichier moteur ou extension** : `js/quetes.js` ou dans `js/engine.js` (`E.quests()`, `E.claimQuest()`, `E.dailyRituals()`).
- **Interface** :
  - En haut du Domaine ou accessible depuis un onglet/bouton d'accès rapide avec badge de notification (`#questBtn`).
  - Volet dépliable ou modale dédiée avec 3 onglets bien distincts : *Scénario*, *Rituels*, *Troqueur*.

---

## 6. Rappels des Directives et Secrets

- **Règle des Secrets** : Ne jamais écrire en clair une combinaison secrète, un air de flûte caché, un code terminal ou l'emplacement d'un secret dans les commits, changelogs ou comptes-rendus. Toujours utiliser des formules neutres (« une recette secrète », « un lieu oublié »).
- **Vérification navigateur obligatoire** : Tout lot modifiant `js/ui.js` ou `js/domaine.js` doit être validé dans un vrai navigateur (Chrome headless ou Playwright) pour vérifier l'absence totale d'erreurs console avant livraison.
- **Style et Ton** : Respecter scrupuleusement [docs/LEXIQUE.md](file:///c:/projets/temporaire/docs/LEXIQUE.md) et [docs/STYLE.md](file:///c:/projets/temporaire/docs/STYLE.md) : tutoiement, français limpide, phrases d'action courtes, zéro calque IA.
