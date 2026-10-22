# ÉCLAT v0.8.0 — Révolution Ergonomique : Registre de Quêtes, Rituels, Contrats du Troqueur & Codex d'Artisanat

## Contexte

Dans les versions précédentes d’ÉCLAT, la progression reposait sur l’objectif unique du Domaine (`goalCard`), le suivi des recettes dans le Carnet et le commerce au Comptoir sans vision d’ensemble sur le long terme ni incitation quotidienne.

Inspirée des standards de référence du genre (*Hades*, *Melvor Idle*, *Sea of Thieves*, *Factorio*, *A Dark Room*), l’itération majeure **v0.8.0** unifie et déploie un système complet de quêtes et de confort de jeu :

1. **Registre de Quêtes narratif & Rituels des Semeurs** (Piliers narratifs et quotidiens)
2. **Prestige commercial & Contrats du Troqueur** (Valorisation du commerce et gain de Traces)
3. **Codex d’artisanat & Filtre « En stock »** (Fluidité immédiate du craft)
4. **Game Feel, Haptique & Confort Mobile** (Mode dense du Domaine, retour tactile et puces dynamiques)

---

## 1. Registre de Quêtes & Scénario fil rouge

- **Bouton d’accès direct `#questBtn`** : Situé en haut à droite du bandeau supérieur (`#top`), il affiche en permanence l’état d’avancement des rituels et livraisons, avec une pastille lumineuse `.quest-dot` animée (`questpulse`) dès qu’une récompense est prête.
- **Modale à 3 onglets** (`Scénario`, `Rituels`, `Troqueur`) accessible via le bouton d’en-tête et depuis la carte d’objectif du Domaine (`goalCard`).
- **Scénario fil rouge par chapitres** (`Chapitre I · L’Éveil des mains` à `Chapitre XIII · La Lumière stellaire`) :
  - Visualisation claire de l’objectif de l’Âge en cours avec pastilles des composants nécessaires et manquants.
  - Bouton direct `⚡ Fabriquer maintenant` dès que tous les prérequis sont réunis en réserve.

---

## 2. Rituels quotidiens des Semeurs

- **3 rituels déterministes renouvelés chaque jour réel** :
  1. *Façonnage des mains* : fabriquer des objets à la main (récompense en Traces ✦).
  2. *Moisson de la terre* : récolter des matières premières (récompense en écus et Traces ✦).
  3. *Éveil de l’esprit* : étudier une matière ou percer un mystère (récompense en Intuition ✨).
- Progression suivie automatiquement via les actions du joueur (`E.craft`, `E.tap`, `E.study`, `E.signe`, `E.addFrag`).
- Réclamation instantanée via `E.claimRitual(idx)` avec retour haptique et notification toast.

---

## 3. Contrats & Prestige du Troqueur

- **5 rangs de prestige commercial** :
  - *Rang 0 : Curieux de passage* (0 contrat)
  - *Rang 1 : Client régulier* (3 contrats, +1 ✦ par livraison)
  - *Rang 2 : Négociant estimé* (8 contrats, +2 ✦ par livraison)
  - *Rang 3 : Partenaire de l’Arche* (18 contrats, +3 ✦ par livraison)
  - *Rang 4 : Grand Marchand des Étoiles* (35 contrats, +5 ✦ par livraison)
- Livraisons directes depuis l’onglet Troqueur du Registre de quêtes avec détection automatique des stocks disponibles.

---

## 4. Codex d'Artisanat & Filtres Intelligents

- **Nouveau filtre rapide `⚡ En stock`** (`data-cf="pret"`) dans le Carnet : isole en un clic toutes les recettes fabricables immédiatement avec les réserves actuelles.
- **Badge d’alerte visuel `⚡ Prêt`** sur les cartes de recettes immédiatement réalisables.
- **Bouton instantané `⚡ +1`** sur la carte de recette pour lancer la fabrication sans devoir ouvrir la fiche détaillée.

---

## 5. Game Feel & Confort Mobile

- **Mode dense pour le Domaine** : bascule en un clic (`[data-dom-dense]`) pour un affichage compact optimisé pour le jeu sur smartphone ou les domaines étendus.
- **Micro-animations & retours tactiles** : vibrations haptiques douces (`vibe`) sur la complétion de quêtes, la validation de contrats et le basculement d'affichage.

---

## Consigne de livraison

> **Livraison.** Travaille dans un clone du dépôt GitHub `0doacre/craftgame`, à jour
> (`git pull` sur `main` avant de commencer), jamais dans une copie ou un dossier temporaire.
> Crée une nouvelle branche au nom de la tâche (par exemple `gemini-ergonomie-majeure-0-8-0`).
> Quand `npm test` passe en entier, **ouvre le jeu dans un vrai navigateur** avant de livrer :
> `npx http-server -p 8765 -c-1 .` à la racine du dépôt, puis `http://localhost:8765/` (au
> besoin avec Playwright). Le jeu doit se charger, la console ne doit montrer aucune erreur, et
> ce que tu as changé doit se voir et marcher à l’écran. Les tests ne chargent que le moteur :
> une erreur dans `js/ui.js` ou `js/domaine.js` peut passer les tests et casser tout le jeu
> (c’est arrivé en 5.5). Si tu ne peux pas ouvrir de navigateur, dis-le clairement dans ton
> compte rendu au lieu de livrer comme si c’était vérifié.
> Fais ensuite un commit qui dit ce que tu as changé, puis pousse la
> branche sur GitHub : `git push -u origin <nom-de-la-branche>`. Ne touche pas à `main`, ne
> fusionne rien : la branche sera relue avant d’être intégrée. Termine en donnant le nom de
> la branche, la sortie de `npm test`, ce que tu as vérifié dans le navigateur, et ce que tu
> n’as pas pu faire.
>
> **Secrets.** L’auteur joue à l’aveugle : n’écris jamais une solution de secret, une
> combinaison de recette secrète, un code ou un air dans ton compte rendu, tes messages de
> commit ou `D.CHANGES`. Écris « une recette secrète », « un lieu caché », pas leur contenu.
> N’ouvre pas `docs/coffre/` sauf si le prompt le demande.
