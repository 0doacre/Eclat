# Prompt v6.10.0 : Ergonomie de la Réserve & Gestion des Ressources

> **Version visée** : 6.10.0  
> **Branche de travail** : `gemini-reserve-6-10`

---

## Contexte & Objectif

Au fil des âges d'Éclat, le joueur découvre et accumule plus de 80 à 150 ressources différentes (matières brutes, pièces travaillées, alliages, circuits, reliques). Sur mobile comme sur grand écran, retrouver une matière, surveiller les flux entrants/sortants ou identifier une pénurie doit être simple, tactile et immédiat.

Ce chantier apporte :
1. **Filtres de catégories horizontaux bien visibles et tactiles** avec compteurs en temps réel (`[ Tout ]`, `[ ⚡ En flux ]`, `[ 🪨 Brutes ]`, `[ ⚙️ Pièces ]`, `[ ✦ Action ]`, `[ ♥ Favoris ]`, `[ ✨ Inutilisées ]`).
2. **Recherche instantanée** avec bouton de réinitialisation rapide (✕) pour éviter d'effacer fastidieusement au clavier virtuel sur mobile (dans l'Atelier et le Carnet).
3. **Tris intelligents** de la Réserve (`Par âge`, `Plus nombreuses`, `⚡ Flux actifs`, `⚠️ En déficit`, `Nom A→Z`, `Dernières trouvées`).
4. **Indicateurs de flux en direct** sur chaque tuile de ressource (`+X/min` vert, `-X/min` rouge/orange) et dans la fiche détaillée de chaque ressource.
5. **En-tête synthétique** indiquant le nombre d'éléments filtrés et le total d'objets en réserve.

---

## Spécifications détaillées

### 1. Filtres par catégorie avec compteurs tactiles
- Liste des filtres :
  - `tout` : Toutes les ressources découvertes ou possédées.
  - `flow` : Ressources ayant un flux actif (production ou consommation par extracteurs ou machines).
  - `res` : Matières brutes récoltées (`t === "res"`).
  - `comp` : Pièces et composants fabriqués (`t !== "res"`).
  - `geste` : Ressources réagissant ou servant dans une recette pour l'action sélectionnée.
  - `fav` : Ressources marquées en favori par le joueur.
  - `new` : Ressources découvertes mais pas encore utilisées dans une recette connue.
- Chaque filtre affiche un badge de compteur stylisé (`.f-cnt`), par exemple `[ 🪨 Brutes 12 ]`.

### 2. Recherche rapide avec bouton ✕
- Champ `#iq` dans l'Atelier et `#cq` dans le Carnet.
- Bouton `.search-clear[data-clear-search="..."]` visible dès qu'une recherche est saisie.
- Un appui efface instantanément la requête, déclenche un léger retour haptique et remet à jour la liste sans perte de fluidité.

### 3. Tris intelligents (`#isort`)
- `age` : Par âge (comportement classique par groupe d'âge).
- `qty` : Plus nombreuses (ordre décroissant de la réserve).
- `flow` : Flux les plus actifs (débit total `|production| + |consommation|` décroissant).
- `deficit` : En déficit (ressources en solde net négatif ou proches de l'épuisement priorisées).
- `name` : Nom alphabétique (A → Z).
- `new` : Dernières découvertes (`seen`).

### 4. Indicateurs visuels de débit (`.c-flow`)
- Sur chaque tuile de ressource de l'Atelier, afficher si débit non nul :
  - `+X/min` en vert (`var(--good)`) si production nette positive.
  - `-X/min` en rouge/orange (`var(--bad)`) si consommation nette supérieure à la récolte.
- Dans la fiche de recette/ressource (`recipeModal`), affichage du solde net avec décomposition claire `(+X/min / -Y/min)`.

---

## Consigne de livraison

> **Livraison.** Travaille dans un clone du dépôt GitHub `0doacre/craftgame`, à jour
> (`git pull` sur `main` avant de commencer), jamais dans une copie ou un dossier temporaire.
> Crée une nouvelle branche au nom de la tâche (`gemini-reserve-6-10`).
> Quand `npm test` passe en entier, **ouvre le jeu dans un vrai navigateur** avant de livrer :
> `npx http-server -p 8765 -c-1 .` à la racine du dépôt, puis `http://localhost:8765/` (au
> besoin avec Playwright). Le jeu doit se charger, la console ne doit montrer aucune erreur, et
> ce que tu as changé doit se voir et marcher à l’écran. Les tests ne chargent que le moteur :
> une erreur dans `js/ui.js` ou `js/domaine.js` peut passer les tests et casser tout le jeu.
> Fais ensuite un commit qui dit ce que tu as changé, puis pousse la
> branche sur GitHub : `git push -u origin <nom-de-la-branche>`.
>
> **Secrets.** N'écris jamais une solution de secret, un code ou un air dans ton compte rendu,
> tes messages de commit ou `D.CHANGES`. Écris « une recette secrète », « un lieu caché »,
> pas leur contenu. N’ouvre pas `docs/coffre/` sauf si le prompt le demande.
