# Prompt : un Troqueur utile jusqu’au bout (version 5.9.0)

Tu travailles sur **Éclat**, un jeu incrémental de craft en français, pour mobile (PWA,
JavaScript sans framework ni dépendance). Dépôt GitHub : `0doacre/craftgame`.

## Le problème

Le Comptoir (5.4, `D.COMPTOIR`, `E.sell`, `E.buyTrace` dans `js/engine.js`, fenêtre dans
`js/domaine.js`) ne sert presque plus en fin de partie. Mesure sur une partie à l’âge 9 :
tout vendre rapporte 42 000 écus, soit **1 Trace**, quand la relève en rapporte 48. Le
prix d’une Trace grimpe plus vite que ce qu’on a à vendre.

Lis `docs/RENAISSANCES.md` (section 5), `docs/LEXIQUE.md`, et le code du Comptoir.

## Ta tâche

1. **Les écus deviennent des Traces à la relève.** Le bouton « Acheter 1 ✦ Trace »
   disparaît. Au moment de la relève, les écus restants sont convertis :
   `floor(écus / prix de base)`, avec le prix de base de l’âge atteint
   (`trace × traceAge^âge`, sans la hausse par achat). La fenêtre de relève l’annonce :
   « Tes 12 400 écus deviennent 3 ✦ Traces. » (à la place de l’avertissement actuel).
   Les écus servent toujours à acheter des matières.
2. **Les demandes du Troqueur** (pas « commandes » : ce mot désigne les fabrications du
   joueur depuis la 5.7). Le Troqueur affiche jusqu’à `D.TROQUEUR.slots` demandes : un
   objet que le joueur sait fabriquer (recette connue, déjà fabriquée, d’un âge entre
   `âge - 1` et l’âge atteint), une quantité, une récompense en Traces. **Livrer** prend
   la quantité dans la Réserve et donne les Traces tout de suite. Les demandes se
   renouvellent toutes les `D.TROQUEUR.refresh` secondes (même jeu fermé) ; une demande
   livrée laisse sa place vide jusqu’au renouvellement suivant.
   - récompense : `max(1, round(D.TROQUEUR.share × Traces du prochain passage à franchir))` ;
   - quantité : celle dont la valeur au Comptoir (`E.value`) vaut `D.TROQUEUR.size` fois le
     prix de base d’une Trace par Trace de récompense, arrondie à un nombre rond.
   ```js
   D.TROQUEUR = { slots: 3, refresh: 1200, share: 0.15, size: 2 };
   ```
3. Dans la fenêtre du Comptoir, une troisième page **Demandes** (Vendre, Acheter,
   Demandes), et dans la carte du Domaine une ligne « 2 demandes du Troqueur ».

## Sauvegarde

`S.comptoir.asks = [{ id, n, tr }]` et `S.comptoir.next` (date du prochain
renouvellement), validés dans `parseSave` (une valeur illisible est remise à zéro, jamais
une erreur), remis à zéro à la relève. Pas de changement de `SAVE_VERSION`.

## Version, tests

- `D.VERSION = "5.9.0"`, `D.CHANGES` : deux ou trois phrases ; aide (`openHelp`) et
  `docs/LEXIQUE.md` : « Demande du Troqueur ».
- Après chaque modification : `node tools/build.js`.
- Tests : conversion des écus à la relève (et 0 écu → 0 Trace) ; les demandes ne proposent
  que des objets connus et déjà fabriqués, d’un âge permis ; livrer retire de la Réserve et
  donne les Traces ; pas de livraison sans la quantité ; renouvellement après `refresh`,
  y compris hors ligne ; sauvegarde illisible nettoyée. Adapte les tests existants de
  `E.buyTrace` (le bouton disparaît) et dis-le dans ton compte rendu.

## Règles

- Ne jamais perdre une sauvegarde ; même style de code ; textes en français, tutoiement,
  mots de `docs/LEXIQUE.md`, pas de tiret cadratin.
- Ne touche ni aux commandes, ni aux passages, ni à la Mémoire des mains.

## Livraison

Suis la **consigne de livraison** de `docs/prompts/README.md`, branche
`gemini-troqueur-5-9`. Dans le navigateur : le jeu se charge sans erreur ; la page
Demandes s’affiche et une livraison donne ses Traces ; la fenêtre de relève annonce la
conversion des écus. Termine par `git log --oneline -3`,
`git diff --stat main...gemini-troqueur-5-9`, la sortie de `npm test`, ce que tu as
vérifié dans le navigateur et ce que tu n’as pas pu faire.
