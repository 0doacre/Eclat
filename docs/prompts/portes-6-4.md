# Prompt : les portes (version 6.4.0)

Tu travailles sur **Éclat** (jeu incrémental de craft en français, mobile, JavaScript sans
framework). Dépôt GitHub : `0doacre/craftgame`.

Lis d’abord : `docs/RECIT-PLAN.md`, `docs/STYLE.md`, `docs/LEXIQUE.md`, puis le moteur actuel
des explorations et passages (`js/engine.js`, cherche `exps`, `canExplore`, `startExp`), l’écran
de la carte et des explorations (`js/carte.js` et `js/ui.js`), et le moteur des signes (`js/signes.js`).

## Le principe

En 6.4.0 (« Les portes ») :
1. **Conditions d’exploration élargies** : le champ `need` d'une exploration ne se limite plus à un
   simple objet : il prend en charge un identifiant d'objet unique, une liste d'objets requise,
   ou une structure de conditions complexes (connaissance d'un signe, fragment découvert, page lue,
   drapeau actif, combinaisons `any` / `all` / `not`) évaluée via `cond()`.
2. **Apparition conditionnelle des lieux cachés** : prise en charge d'un champ `show` (ou condition)
   qui détermine quand un lieu secret apparaît sur la carte d'une terre.
3. **9 nouveaux lieux cachés** répartis sur les terres (Arbre seul, Escalier noyé, Sous les racines,
   Le Replat, La deuxième salle, Les six poings, La Lumière, Le Quai...).
4. **2 nouvelles recettes secrètes** (la Cloche et le Pigment).
5. **Les 6 derniers signes** (revenir, halte, manquer, nourrice, relais, nous) pour compléter le lexique
   des 14 signes d'Éclat, avec leurs tracés et empreintes de validation.
6. **Une page de plus au Comptoir** et intégration des pages des nouveaux lieux.

## Ta tâche

### 1. Extension du moteur d'exploration (`js/engine.js`)
- Gestion étendue de `need` dans `canExplore(zid, xid)` et `hasExpReq` :
  - Chaîne : identifiant d'objet (ex. `"pioche_pierre"` ou `"cloche"`).
  - Tableau : liste d'objets devant tous être possédés (`["flute", "lunette"]`).
  - Objet : condition évaluée avec `cond(need)`.
- Gestion du filtrage `show` pour lister les explorations visibles d'une terre :
  - Si un lieu caché a `x.show` non satisfait, il n'apparaît pas ou reste masqué selon les règles.
  - Préservation du comportement existant pour `x.hidden` (énigme textuelle).

### 2. Les deux nouvelles recettes secrètes (`js/data.js`)
- `cloche` : Chauffer lingot de bronze ×10 + argile ×6 à 1 100 °C. Âge du Bronze (5). Curio secrète.
- `pigment` : Tailler argile ×3 + charbon ×2. Âge du Fer (6). Curio secrète.
- Ajout à `D.ITEMS` et `D.SECRETS`.

### 3. Les 6 derniers signes (`js/signes.js` & `js/recit.js`)
- Ajout des tracés des 6 signes : `revenir`, `halte`, `manquer`, `nourrice`, `relais`, `nous`.
- Empreintes de hachage FNV-1a pour la validation tolérante des réponses sans spoiler.
- Textes et inscriptions associés dans le récit.

### 4. Les lieux cachés et le récit (`js/data.js` & `js/recit.js`)
- Câblage des 9 lieux cachés dans `D.ZONES` avec leurs coûts, durées, conditions et récompenses.
- Déblocage des fragments correspondants et des nouvelles pages du Livre des Semeurs.
- Ajout de la page supplémentaire vendue au Comptoir.

### 5. Sauvegardes, tests, version
- Sauvegardes rétrocompatibles (champs par défaut, aucun changement de `SAVE_VERSION`).
- Tests unitaires complets dans `tools/test.js` et tests narratifs dans `tools/test-recit.js`.
- Mise à jour de `D.VERSION = "6.4.0"`, `D.CHANGES` (« De nouveaux passages et des lieux oubliés s’ouvrent. »).
- `node tools/build.js` après chaque modification ; `npm test` vert.

## Consigne de livraison

Consigne de livraison de `docs/prompts/README.md` (avec la règle « Secrets »), branche
`gemini-portes-6-4`. Vérification dans un vrai navigateur (Chrome headless sur `http://localhost:8765/`).
Termine par `git log --oneline -3`, `git diff --stat main...gemini-portes-6-4`, la sortie de
`npm test`, ce que tu as vérifié et ce que tu n’as pas pu faire.
