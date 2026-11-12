# T6 · Tests d'interface rouges

**État — partiel, volontairement.** 32 tests sur 36 étaient verts au dernier passage complet (16 rouges au départ). Les 4 rouges de ce passage : un défaut du jeu (decouvertes-carnet), deux tests dont je propose la suppression (retours, monde-production), et mode-test, instable, corrigé après ce passage.

**Ce qui change pour le joueur** — rien. Ce sont des tests.

**Ce que je n'ai pas vérifié** — l'aspect à l'écran : les tests mesurent des états du DOM, je n'ai regardé aucune capture. La cause « scène masquée » du défaut du crayon est déduite du code (`js/decouvertes-carnet.js`, `update()` s'arrête quand la scène n'a pas de boîte) et de la règle `css/harmonie-sobre.css` ; je ne l'ai pas vue à l'écran.

## Tests

`PW=<chemin> npm run test:ui` (dernier passage complet) :

```
32 verts, 4 rouges sur 36.
test-decouvertes-carnet-ui.js  ROUGE  Error: 1 défaut(s) du jeu : bruitage du crayon chargé après le geste d’exploration…
test-mode-test-ui.js           ROUGE  AssertionError: mauvais code     (instable : voir plus bas, corrigé après ce passage)
test-monde-production-ui.js    ROUGE  AssertionError: monde intégré
test-retours-ui.js             ROUGE  AssertionError: 320/false : décor au bord supérieur
```

Après ce passage, `test-mode-test-ui` (course sur une fenêtre qui ignore les appuis 450 ms) a reçu deux attentes ; relancé seul 5 fois de suite : vert. `test-comptes-ui` et `test-assistance-ui` ont reçu la même attente et sont verts seuls. `npm test` : 14 tests réussis, service worker à jour. Un second passage complet n'a pas été refait.

## Un test par ligne

| Test | Verdict | Raison |
|---|---|---|
| appareil | périmé, mis à jour | la touche 2 ouvre l'Étude (la Carte n'est plus un onglet) ; Carnet dans Journal ; « Installer » (Système) et « Écran allumé » (Affichage) sont dans des sections du menu |
| archives | périmé, mis à jour | bouton Aspect masqué exprès (`harmonie.css`) : on vérifie qu'il l'est ; le Cosmos est un sous-onglet de Progression |
| assistance | périmé, mis à jour | boutons dans la section « Aide » du menu ; l'ouvrier unique (« Avance de salaire épuisée ») n'existe plus depuis la 0.41 (`atelier-economie.js` est neutre) : ce scénario est retiré |
| comptes | périmé, mis à jour | « Compte en ligne » est dans la section Système |
| mode-test | périmé, mis à jour | « Mode test » dans Système ; attentes de 550 ms pour la fenêtre qui s'ouvre |
| age-os-carnet | périmé, mis à jour | la scène peinte de la Plaine est masquée : on vérifie l'état du moteur (exploration comptée, fragments) au lieu du masque CSS |
| decouvertes-carnet | **défaut du jeu** (1 contrôle) + périmé (reste) | masque de la scène remplacé par l'état du moteur ; le bruit de crayon est resté en rouge, voir ci-dessous |
| paysages-carnet | périmé, mis à jour | une seule terre à l'écran, son aquarelle est `.terre-fond` : on vérifie ce fond (chargé, horizontal) pour chaque terre ; la Rivière à la Vapeur est vérifiée dans la contemplation |
| atelier-dessine | périmé, mis à jour | le Carnet est un cadre qui défile : les images `lazy` sous la barre d'onglets ne se chargent jamais ; le test les force |
| illustrations-raccord | périmé, mis à jour | scène des travaux masquée ≤ 600 px ; une seule terre à l'écran (on la parcourt) ; gisements = icônes de ressource, plus les images `source_*` ; Carnet dans Journal. L'animation du chantier à 390 px n'est plus vérifiée (scène masquée) |
| filtre-decouverte | périmé, mis à jour | branche « classique » supprimée (l'ancien établi n'existe plus) ; l'Étude a trois pastilles Utiles / Tout / En réserve au lieu de la case et du choix du geste ; l'état vide n'est plus affiché (voir plus bas) |
| progression | périmé, mis à jour | le test visait un serveur sur le port 8080 : il sert maintenant le jeu lui-même ; la carte « nouveau gisement » est dans une bulle fermée, on appuie sur la pastille « + » de la ligne du gisement |
| stockage | périmé, mis à jour | la partie vit sous la clé `eclat.preview.craft.v1` (sauvegarde v13, copies `eclat.preview.craft.backups`) ; la graine est faite avec le moteur de l'Atelier-équipe, sinon la page la migre et met une copie de côté ; « Sauvegardes » dans Système |
| browser-qol | vert sans changement | il manquait seulement Playwright |
| retours | **suppression proposée** | vérifie le décor Atlas de la Plaine, l'ancien établi de l'Atelier (`[data-g]`, `[data-inv]`, `[data-skills]`), la brume de la Carte (onglet `carte` supprimé). Rien n'existe plus ; seules restent des évidences (pas de débordement, pas d'erreur JS) déjà couvertes par `test-ux` et `test-terres-fixe-ui` |
| monde-production | **suppression proposée** | teste `js/monde.js`, retiré de `index.html` par le commit 8e6cc14 (« Restaure la preview… »). Le fichier existe encore, sans appelant |

## Défaut du jeu

**Le crayon ne se joue plus quand on explore la Lisière ou la Plaine pour la première fois.** `Decouvertes.update()` n'agit que si la scène (`.carnet-discovery-land`) a une boîte ; depuis la refonte sobre elle est en `display:none` (`css/harmonie-sobre.css`, lignes « terre-bas … carnet-landscape » et `terre-bas > figure`). Résultat : plus de bruitage de crayon à la première exploration, plus de révélation de l'aquarelle ni de trait de sentier (le test ne mesure que le bruit ; `test-decouvertes-carnet-ui` reste rouge sur ce seul contrôle, les 92 autres passent). Pas pour les études en marge (tumulus, grotte, cercle…), qui se révèlent encore.
Pour le revoir : nouvelle partie, Terres, Lisière, lancer l'exploration du Chêne, son activé ; ou `node tools/test-decouvertes-carnet-ui.js`. C'est peut-être voulu ; au porteur de dire si le crayon doit revenir.

## Constats hors périmètre (rien corrigé)

- L'aquarelle de la Rivière ne change plus à la Vapeur sur la page des Terres (fond fixe `riviere-fond.webp`) ; seule la contemplation montre `riviere-vapeur.webp`.
- `#ae-discovery-empty` (« aucune matière à découvrir ») est toujours caché par `atelier-equipe.js` : l'état vide du filtre n'est plus dit.
- Code mort probable : `livingNode` et `gisHTML` dans `js/domaine.js` (images `source_*`), `js/monde.js`, le diagnostic « ouvrier » de `js/assistance.js`.
- Le commentaire de `js/ui.js` (« Clé historique … save.v1 ») est faux : la clé réelle est `eclat.preview.craft.v1`.
