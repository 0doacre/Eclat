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
  - Échanger des Traces contre une piste vers une fin.
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

### C. 0.7.2 — Relecture du récit (livrée)
- Le récit est remis d'aplomb selon la bible (détails : voir le coffre). Les réponses ne sont plus en clair dans `js/` ; le texte du récit est rangé dans `js/recit.js`.
- Les prompts qui racontaient l'intrigue sont rangés dans `docs/coffre/prompts/`.

---

## 5. Livré : v0.8.0 (Lot Majeur Ergonomie & Quêtes)

La version majeure **v0.8.0** a été entièrement implémentée, testée et validée dans Chrome headless :

1. **Piste 1 — Registre de Quêtes & Expansion du Troqueur** :
   - Bouton dédié `#questBtn` dans le bandeau supérieur (`#top`) avec pastille réactive d'alerte (`#questDot`) et sous-titre dynamique (`#questSub`).
   - Modale dédiée à 3 onglets (*Scénario*, *Rituels*, *Troqueur*), accessible également depuis `goalCard` (`#btnQuests`).
   - **Scénario fil rouge** par chapitre (`Chapitre I · L’Éveil des mains` etc.) avec pastilles des composants requis, composants manquants et bouton direct `⚡ Fabriquer maintenant`.
   - **3 rituels quotidiens des Semeurs** renouvelés chaque jour réel (`E.dailyRituals()`) : façonnage des mains (Traces ✦), moisson de la terre (écus & Traces ✦), éveil de l'esprit (Intuition ✨). Suivi en direct via `E.advanceRitual` et réclamation instantanée (`E.claimRitual`).
   - **Prestige du Troqueur** : 5 rangs de réputation marchande (*Curieux*, *Client*, *Négociant*, *Partenaire*, *Grand Marchand*) offrant jusqu'à +5 Traces de bonus par contrat livré. Livraison directe depuis le Registre (`E.deliverAsk`).

2. **Piste 2 — Codex d’Artisanat & Filtres Intelligents** :
   - Nouveau filtre rapide `⚡ En stock` (`data-cf="pret"`) dans le Carnet n'affichant que les recettes réalisables immédiatement avec l'inventaire courant.
   - Badge d'alerte `⚡ Prêt` sur les cartes de recettes disponibles.
   - Bouton instantané `⚡ +1` sur les fiches de recettes réalisables pour fabriquer immédiatement sans ouvrir la modale.

3. **Piste 3 — Confort Visuel, Domaine Dense & Game Feel** :
   - Affichage compact, un seul réglage (Menu → Affichage → Affichage compact, `settings.compact`) pour le Domaine (classe `.dom-dense` sur `.dom`) et le Carnet (`#clist.carnet-dense`). Carnet sur deux colonnes : `settings.carnet1Col` inversé, aussi dans le menu.
   - Animations CSS dédiées (`questpulse`, `ready-pulse`) et retours tactiles haptiques (`vibe`).

- **Validation** : 158 tests moteur + 32 tests récit + 9 tests serveur (199 tests réussis). Service worker synchronisé (`tools/build.js`).
- **Navigateur** : Test d'intégration automatisé Chrome headless (CDP) sans aucune erreur console, validation de la navigation entre onglets du Registre, activation du filtre `⚡ En stock`, et bascule du mode dense.

---

## 6. Prochaine Étape : v0.9.0 vers la version 1.0.0

Un dossier complet d'analyse comparative et de propositions de level design inspiré des chefs-d'œuvre du genre (*Cell to Singularity*, *Fallout Shelter*, *Balatro*, *Slay the Spire*, *A Dark Room*, *Outer Wilds*, *Universal Paperclips*) a été rédigé :
- **Piste A (v0.9.0)** : Micro-incidents et événements célestes de terre (météo diégétique, auras temporaires).
- **Piste B (v0.9.0)** : 3 réceptacles de reliques du Semeur (synergies de build qualitatives type *Slay the Spire / Balatro*).
- **Piste C (v0.9.0)** : Toile des rumeurs et connexions visuelles (*Outer Wilds / Cell to Singularity*).
- **Piste D (v1.0.0)** : Ruptures de paradigme franches entre les phases de survie, industrielle, cybernétique et spatiale (*Universal Paperclips*).

---

## 7. Rappels des Directives et Secrets

- **Règle du coffre** : tout ce qui touche au récit (textes, lieux cachés, voix, fins, clins d'œil, prompts de récit) vit dans `docs/coffre/` et `js/recit.js`. Un document public, un message de commit ou `D.CHANGES` n'en parle qu'en termes neutres (« le récit », « un lieu caché »).
- **Règle des Secrets** : Ne jamais écrire en clair une combinaison secrète, un air de flûte caché, un code terminal ou l'emplacement d'un secret dans les commits, changelogs ou comptes-rendus. Toujours utiliser des formules neutres (« une recette secrète », « un lieu oublié »).
- **Vérification navigateur obligatoire** : Tout lot modifiant `js/ui.js` ou `js/domaine.js` doit être validé dans un vrai navigateur (Chrome headless ou Playwright) pour vérifier l'absence totale d'erreurs console avant livraison.
- **Style et Ton** : Respecter scrupuleusement [docs/LEXIQUE.md](file:///c:/projets/temporaire/docs/LEXIQUE.md) et [docs/STYLE.md](file:///c:/projets/temporaire/docs/STYLE.md) : tutoiement, français limpide, phrases d'action courtes, zéro calque IA.
