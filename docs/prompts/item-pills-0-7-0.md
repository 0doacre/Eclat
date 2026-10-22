# ÉCLAT v0.7.0 — Ergonomie : Pastilles d'objets interactives & affordance unifiée

## Contexte

Dans les versions antérieures, la mention des objets et matières dans l'interface était hétérogène : tantôt du texte brut non cliquable, tantôt un soulignement discret (`.link-txt`), tantôt des puces avec des styles différents. De nombreux joueurs ne percevaient pas immédiatement qu'un objet mentionné dans une carte d'objectif, un bloqueur ou une étape clé pouvait être touché pour ouvrir sa fiche détaillée, inspecter sa recette et naviguer vers ses ingrédients.

Cette version inaugure également le nouveau cycle de numérotation sémantique du projet :
- **0.7.0** : réinitialisation de la numérotation (au lieu de 6.15.0).
- **0.0.x** : correctifs et lots mineurs.
- **0.x.0** : mises à jour et lots majeurs.
- **1.0.0** : version complète, équilibrée, jouable et livrable.

## Objectifs du lot

1. **Composant `.item-pill` universel** :
   - Créer une pastille tactile et visuelle claire (`.item-pill`) dotée d'une icône, d'un libellé, d'une bordure contrastée, d'un léger fond teinté, d'un état de survol éclairé, d'un retour au clic (`:active`), et d'un état `:focus-visible` pour l'accessibilité clavier.
   - Supporter l'affichage de quantités (`.pill-qty`), des états de manque (`.lack`), et des objets encore inconnus (`.unk`).

2. **Unification dans toute l'interface** :
   - **Carte d'objectif & prochaine action** : afficher les ingrédients manquants et les étapes clés sous forme de pastilles cliquables directes.
   - **Messages de blocage & stations** (`needText`, `resultHTML`) : transformer les prérequis de station ou d'outil en pastilles cliquables.
   - **Fiche de suivi** (`trackerHTML`) & **Jalons d'âge** (`openMilestones`) : affichage harmonisé des cibles de fabrication.
   - **Ingrédients & recettes** : harmoniser le rendu des ingrédients cliquables (`.ing.link`).
   - **Comptoir & Domaine** : rendre les en-têtes d'objets cliquables avec affordance claire (`data-goto`).

3. **Compatibilité et accessibilité** :
   - Support complet du clavier (`tabindex="0"`, `role="button"`, déclenchement par Entrée/Espace).
   - Info-bulles explicites (`title="... (toucher pour inspecter)"`).

> **Livraison.** Travaille dans un clone du dépôt GitHub `0doacre/craftgame`, à jour
> (`git pull` sur `main` avant de commencer), jamais dans une copie ou un dossier temporaire.
> Crée une nouvelle branche au nom de la tâche (par exemple `gemini-item-pills-0-7-0`).
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
