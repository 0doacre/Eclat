# Ajouter un âge au jeu

Deux âges ont été insérés en cours de route : la **Vapeur** (0.19, entre l’Acier et l’Électricité) et l’**Atome** (0.20, entre l’Électricité et le Silicium). Cette page garde la méthode, pour que le prochain se fasse sans chercher. Les âges sont repérés par un **numéro** (0 = Bois), donc en insérer un au milieu décale tous ceux d’après.

## 1. Choisir où l’insérer

Mesurer d’abord (le tableau « objets par âge » est dans `docs/PLAN-ALPHA.md`, le bot par âge se lit avec `node tools/sim.js`) :
- un âge **trop chargé** se coupe en deux (la Vapeur a été prise à l’Acier : 27 objets, contre 10 à 17 ailleurs) ;
- un âge **absent de l’histoire des techniques** s’ajoute (l’Atome) ;
- un âge qui **s’enchaîne en moins d’une minute** au bot mérite un examen de ses usages et de ses choix avant d’en ajouter un autre.

Lire la colonne **Temps dans cet âge**, pas l’heure d’entrée. Avant la 0.21, le « +… » d’une ligne mesurait l’âge précédent : Vapeur +52 s désignait en réalité l’Acier. La durée ne suffit pas à juger l’intérêt d’un âge ; vérifier les propriétés des ressources, les choix et les usages avec des joueurs.

Un âge neuf demande, au minimum : une devise, une couleur, 4 à 5 étapes (objectifs), 8 à 12 objets, une ligne dans le récit (voix d’ARCHE), un titre de chapitre.

## 2. Données (`js/data.js`)

1. **`D.AGES`** : insérer `{ id, n, c, q }` (couleur `c` lisible sur fond clair et sombre, test de contraste dans `test-ux.js`).
2. **Décaler les objets d’après** : tous les `a: N` des objets d’âge ≥ rang inséré passent à `N + 1` (script Python sur les lignes `  I.xxx = { … a: N`; les extracteurs des lignes `D.LIGNES` héritent de l’âge de leur ancêtre, ou portent leur `a` s’ils sont neufs). Renuméroter les commentaires `/* Âge N — … */`.
3. **`D.SITE_RATE`** : une valeur de plus, entre celles des âges voisins.
4. **Objectifs** (`D.OBJECTIVES`) : une liste plate. L’âge d’une étape est celui du **dernier objectif « fabriquer »** qui la précède : placer les 4 ou 5 objets de l’âge, dans l’ordre, entre ceux des âges voisins.
5. **Nouveaux objets** : `I.id = { n, sym|ic, a, t, r: [geste, {ingrédients}, quantité, {heat|lvl}], u, d, h }`.
   - une recette = un geste + **au plus 3 ingrédients** ; deux objets ne peuvent pas avoir les mêmes ingrédients avec le même geste (le moteur lève « Recette en double » au chargement) ;
   - les ingrédients ne viennent jamais d’un âge plus avancé ;
   - `h` = l’indice de la recette (une phrase concrète qui nomme les matières), `d` = l’objet vu de près, `u` = à quoi il sert ;
   - une pièce doit **servir** quelque part (`node tools/validate.js` signale les pièces jamais utilisées).
6. **Ressources que seul un extracteur récolte** (uranium, galène) : pas de terre qui les liste. L’extracteur de leur ligne (`D.LIGNES`, avec `a`, `s`, `taux`, `r`) donne le gisement. Le guide mène à cet extracteur avant la ressource (`nextStep`, `EXT_OF`).

## 3. Tout ce qui est indexé par un âge (la liste qui a coûté)

| Où | Quoi |
|---|---|
| `js/engine.js` | `SAVE_VERSION` +1 et un bloc `if (from < N)` dans `migrate` ; titres de chapitre (`chapterTitles`) |
| `js/recit.js` | voix d’ARCHE `ageN` (clés **décalées** pour les âges d’après, avec le « SEUIL N » du texte) |
| `js/ui.js` | `EPOCH` (thème d’interface par âge), tests sur le dernier âge (`D.AGES.length - 1`) |
| `js/audio.js` | `palette` et `workRoom` (seuils d’âge) |
| `js/atelier.js` | `m-labo` / `m-metal` (aspect de l’établi) |
| `js/journal.js` | seuil d’âge de la lueur de Kher |
| `README.md` | nombre d’âges et liste |
| `tools/test.js` | version, convention de versionnement (mineure), âges des tests de migration, prix de déchiffrage (calculé sur l’âge) |
| `tools/test-arbre.js` | empreintes de la mise en page (lancer le script du test pour les nouvelles valeurs) puis `node tools/arbre-mesures.js --ecrire` |
| `tools/test-ux.js` | l’âge des parties de test migrées |
| `tools/test-sim.js` | valeurs de non-régression du simulateur (si elles bougent) |

**Migration** : `apres(a) = a >= rang ? a + 1 : a` appliqué à `o.age`, aux clés de `o.flags.ages` et au 3ᵉ champ de `o.meta.stamps[*]`. L’âge inséré est marqué accompli (`ages[rang] = 1`) pour qui l’a dépassé, sans récompense.

## 4. Vérifier

1. `node tools/validate.js` (références, doublons, atteignabilité de chaque recette depuis le début ; les ressources d’extracteur sont comptées).
2. `node tools/test.js` : ajouter un test de l’âge (objets au bon âge, étapes dans l’ordre, ingrédients d’âge antérieur) et un test de migration depuis la version d’avant.
3. `npm test`, puis `node tools/test-ux.js` (3 à 5 minutes ; lancer en tâche de fond).
4. `node tools/sim.js` : le bot doit finir le jeu ; relever la durée de l’âge neuf (une minute ou deux : le bon ordre de grandeur).
5. Version mineure +1 dans `data.js`, `package.json`, `tools/test.js` ; une ligne dans `D.CHANGES` (voir `docs/STYLE.md`) ; `node tools/build.js`.
