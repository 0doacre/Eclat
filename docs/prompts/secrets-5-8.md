# Prompt : Déchiffrer, et des secrets qu’on repère (version 5.8.0)

Tu travailles sur **Éclat**, un jeu incrémental de craft en français, pour mobile (PWA,
JavaScript sans framework ni dépendance). Dépôt GitHub : `0doacre/craftgame`.

Lis d’abord, en entier : `docs/STYLE.md` (comment écrire un texte affiché : **obligatoire**),
`docs/LEXIQUE.md` (les mots : action, ressource, recette, tentative…), et `docs/coffre/SOLUTIONS-ancienne-histoire.md`
(les solutions des secrets : **ne recopie jamais une solution dans un texte affiché**).
Puis, dans `js/engine.js` : `remember`, `E.memory`, `S.hints`, `learn`, `temperature`,
`E.attempt`, `E.studyCost` et `E.study` ; dans `js/ui.js` : les endroits qui lisent
`st.hints[id]` (le niveau de souvenir d’une recette : 1 = l’action, 2 = une des ressources,
3 = la recette entière), `recipeModal`, le rendu du résultat d’une tentative (cherche
`thermo(`) ; dans `js/domaine.js` : `lieuHTML`.

## Le problème

1. **L’Intuition ne sert presque à rien.** Elle ne sert qu’à étudier une ressource (1 à 4 ✨).
   En fin de partie, un joueur en a plus de 2 000 sans usage.
2. Certaines recettes sont alambiquées : on peut rester bloqué longtemps, et seules les
   réminiscences (gagnées en faisant des tentatives) aident.
3. Pour un lieu caché, la Carte affiche son énigme (`x.hidden`), mais le Domaine n’affiche
   que « 🔒 un lieu caché ».
4. Le thermomètre de l’Atelier réagit aussi aux recettes secrètes, mais rien ne le distingue.

## Ta tâche

### 1. Déchiffrer (le cœur de la version)

Payer de l’Intuition pour faire monter d’un cran le souvenir d’une recette pas encore
découverte. On réutilise **exactement** les niveaux existants de `S.hints[id]` :
1 = l’action, 2 = une des ressources, 3 = la recette entière (la recette est alors apprise,
comme le fait déjà `remember` avec `learn(id, true)`).

- Données : `D.DECHIFFRER = { cost: [3, 8, 20] }` dans `js/data.js`. Prix d’un cran :
  `cost[niveau actuel] × (1 + âge de l’objet) × nombre de ressources différentes de la
  recette`, arrondi à l’entier. Une recette à trois ressources de l’âge 8 coûte donc
  3×9×3 = 81 ✨, puis 216 ✨, puis 540 ✨.
- Moteur : `E.decipherCost(id)` (ou `null` si impossible) et `E.decipher(id)` →
  `{ ok, lvl, why }`. Impossible si : recette déjà connue, objet sans recette, **objet
  secret** (`sec: true` ou `path: true`, qui restent la récompense de ceux qui cherchent),
  recette pas encore visible pour le joueur (même règle que le Carnet : âge atteint), niveau
  déjà à 3, ou pas assez d’Intuition (`why: "intu"`). Émet `"guidehint"` et `"struct"` comme
  `remember`.
- Interface : sur la fiche d’une recette inconnue (`recipeModal`), sous ce que le joueur sait
  déjà, un bouton **« ✨ Déchiffrer : N ✨ »** avec une ligne qui dit ce qu’il révèle :
  « Révèle l’action. », « Révèle une des ressources. », « Révèle la recette entière. ».
  Grisé si l’Intuition manque, avec la raison. Après l’achat, la fiche se met à jour sur place.
  Le Carnet (page « À découvrir ») affiche déjà le niveau de souvenir : vérifie qu’il suit.
- Aide (`openHelp`, « Les mots du jeu ») : l’entrée Intuition dit ses deux usages (étudier,
  déchiffrer). `docs/LEXIQUE.md` : ajouter **Déchiffrer**.
- Tutoriel (`js/tuto.js`) : une bulle, la première fois que le joueur a assez d’Intuition
  pour déchiffrer la recette de son objectif : elle montre le bouton.

### 2. Le Domaine montre l’énigme d’un lieu caché

Comme la Carte : « 🔒 » suivi du texte de `x.hidden`, dans `lieuHTML`.

### 3. Un thermomètre qui distingue une recette secrète

Quand la meilleure chaleur d’une tentative vient d’une recette secrète, `temperature` le
signale (`sec: true`), et l’Atelier affiche une ligne à part, avec sa couleur :
« Une chaleur étrange : ce mélange cache quelque chose. »

## Ne fais pas

- Pas de liste ni de silhouette des secrets (idée abandonnée).
- Ne change aucun indice, aucune énigme, aucune recette.
- Ne touche ni aux commandes, ni au Comptoir, ni aux passages.

## Version, tests

- `D.VERSION = "5.8.0"`, `D.CHANGES` : trois phrases courtes, au tutoiement, selon
  `docs/STYLE.md`.
- Après chaque modification de fichier : `node tools/build.js`.
- Tests (`tools/test.js`, même style), au minimum :
  - le prix suit la formule (âge, nombre de ressources, niveau) ;
  - déchiffrer fait monter `S.hints[id]` de 1 et retire l’Intuition ; au niveau 3, la
    recette est connue ;
  - refus : recette connue, objet secret, pas assez d’Intuition, recette d’un âge pas atteint ;
  - la sauvegarde garde le niveau (aller-retour `serialize` / `load`) ;
  - `temperature` renvoie `sec: true` pour une tentative proche d’une recette secrète, et pas
    pour une recette normale.

## Règles

- **Ne jamais perdre une sauvegarde.** Pas de changement de `SAVE_VERSION` : `S.hints` existe
  déjà.
- Ne modifie pas les tests existants.
- Même style de code que le reste. Textes affichés : `docs/STYLE.md` et `docs/LEXIQUE.md`.

## Livraison

Suis la **consigne de livraison** de `docs/prompts/README.md`, branche
`gemini-secrets-5-8`. Dans le navigateur, vérifie au minimum :
- le jeu se charge sans erreur dans la console ;
- sur une partie avancée (`tools/fixtures/save-v5-age8-usine.json`, avec de l’Intuition
  ajoutée), la fiche d’une recette inconnue montre « Déchiffrer », trois achats révèlent
  l’action, une ressource, puis apprennent la recette ;
- un lieu caché montre son énigme dans le Domaine ;
- une tentative proche d’un secret affiche la chaleur étrange.

Termine par `git log --oneline -3`, `git diff --stat main...gemini-secrets-5-8`, la sortie de
`npm test`, ce que tu as vérifié dans le navigateur et ce que tu n’as pas pu faire.
