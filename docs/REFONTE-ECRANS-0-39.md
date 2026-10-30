# Refonte des écrans, 0.39 (cahier commun)

Décidé le 30 octobre 2026 avec le porteur du projet, après `docs/revue/etude-structure-ecrans-0-38.md` : **A2** pour les terres (avec l'illustration de la terre en fond, translucide), **B1** pour le travail (trois lieux), **scénario S2** (refonte directe, un seul lot, retouches ensuite). Ce document est la référence de Claude (moteur et intégration), Gemini (interface) et Codex (art). En cas de doute, il l'emporte sur l'étude.

Base : branche `claude/refonte-ecrans-0-39`, tirée de `prewiew-design` (0.38.0). Rien ne va dans `main`.

## 1. Ce qu'on bâtit

Cinq onglets, au lieu de six : **Terres · Labo · Atelier · Arbre · Journal**.

| Onglet | Verbe | Contenu | Remplace |
|---|---|---|---|
| **Terres** | voyager, récolter | une terre par écran, glissable ; illustration de la terre en fond | Domaine + Carte |
| **Labo** | essayer | l'établi d'essai, rien d'autre | la moitié « découverte » de l'Atelier |
| **Atelier** | produire | quoi produire, en quelle quantité, à la main ou par apprentis ; vue d'ensemble de l'automatisation | la moitié « production » de l'Atelier + les commandes du Carnet |
| **Arbre** | progresser | ce qui est fait, ce qui reste, cases d'indices | inchangé dans l'esprit |
| **Journal** | se souvenir | récit, fragments, signes, fins | inchangé |

Le **Carnet** n'est plus un onglet : c'est **le livre des recettes**, une feuille qu'on ouvre depuis le Labo (revoir ce qu'on a trouvé) et depuis l'Atelier (choisir quoi produire). Le mot « Carnet » ne désigne plus que ce livre ; le style de papier s'appelle « Aspect » (déjà fait).

### Règles d'écran (budget d'écran, valables pour tout)

- **R1.** La vue principale de chaque onglet tient dans `100dvh − en-tête − barre d'onglets − bandeau de récolte`, **sans défilement de la page**, à 390 × 844 **et** 320 × 568 (hors listes internes).
- **R2.** Une liste longue vit dans une feuille ou dans un conteneur qui défile seul, jamais dans la page.
- **R3.** Pas de bandeau de plus de 44 px en haut ; objectif, relève, Comptoir, Atlas : pastilles ou feuilles.
- **R4.** Test automatique : `tools/test-ux.js` (à créer par Gemini) mesure `scrollHeight ≤ clientHeight` des vues principales aux deux tailles, sur une partie à l'âge 1, 5 et 9.

## 2. Terres (A2)

- Une **terre par écran**. Du haut vers le bas : rangée d'icônes des terres (la courante en avant, les fermées en grisé), nom + règle de la terre, gisements (au plus 4 lignes de 68 px), bas de page : lieux à explorer ou bouton de passage.
- On passe d'une terre à l'autre en **glissant** à l'horizontale ou en touchant l'icône. Au démarrage : la terre où l'on était, sinon la plus récente.
- **L'illustration de la terre est le fond de l'écran**, translucide : `opacity` autour de 0,28 à 0,40 sur papier, avec un dégradé qui s'éteint vers le bas pour laisser les lignes lisibles. Les lignes de gisement restent sur un voile de papier. C'est Codex qui règle la valeur, la contrainte est le contraste (≥ 4,5:1 sur le texte des lignes, `docs/art-direction/papier-partout-0-38/contrastes.json`).
- La **Carte** devient la feuille « **Atlas** » : l'atlas peint déjà là (`js/carte-atlas.js`), ouvert depuis un bouton de la rangée d'icônes. Il sert à voir le monde d'un coup et à lancer un passage. Toucher une terre de l'atlas la ferme et ouvre la page de cette terre.
- Objectif, relève, Comptoir, production totale : **pastilles** de l'en-tête qui ouvrent une feuille.
- Les terres traversées (fermées par Gemini en 0.38) gardent leur page : elle est plus courte (résumé + extracteurs), pas de gisements.

Données déjà disponibles : `D.ZONES`, `E.state.zones`, `domaine.js` (`isZonePassed`, `.gis-compact`), `carte-atlas.js`. **Aucun changement de moteur** pour cette partie.

## 3. Labo

- Un **établi** : trois cases, le geste (l'outil posé), un bouton « Essayer », le **thermomètre** (froid, tiède, brûlant), l'Intuition ✨ pour un indice. C'est tout l'écran.
- Dessous, **une rangée** de matières (récentes puis favorites, une ligne qui défile à l'horizontale) et un bouton qui ouvre la **feuille de recherche** (les 45 matières, filtrées). Plus de grande liste dans la page.
- **Échantillons** : on peut poser toute matière **déjà vue** (`state.seen`) ou tout objet déjà fabriqué, **sans en avoir en Réserve**, et rien n'est prélevé. L'interface le dit : badge « échantillon » sur ce que l'on ne possède pas. (Le moteur le permet déjà : `E.attempt` inscrit la recette sans rien prendre quand la Réserve ne suffit pas.)
- **La première pièce est offerte** : quand une trouvaille est inscrite, `E.attempt` renvoie `offered: true` et un exemplaire entre en Réserve si l'ouvrage est ordinaire (pas unique, pas à prix croissant) et coûte au plus `D.PREMIERE_PIECE.max` matières. Le Labo le dit clairement (« Tu gardes la première pièce »). **Nouveau, fait.**
- **Chaîne manquante** : si la trouvaille demande un intermédiaire jamais fabriqué, `E.chaineManquante(id)` donne la liste ; le Labo l'affiche sous le résultat (« à découvrir d'abord : Corde »). **Nouveau, fait.**
- **Mémoire des trouvailles** : compteur « recettes trouvées 23 / 84 » qui ouvre le **Carnet** (le livre). Les premières découvertes sont mises en avant.
- Le Labo ne montre **ni commandes, ni files, ni machines, ni quantités**. Une pièce fabriquée s'y ajoute à la Réserve, c'est tout.

## 4. Atelier (production)

- **Quoi produire** : en haut, une rangée des recettes connues pour lesquelles on a de quoi (favoris puis âge), un bouton « Carnet » pour toutes. On choisit une recette : une **fiche** (matières, durée, qui peut la faire) et une quantité choisie une fois (×1, ×10, ×Max).
- **Qui la fait** : trois boutons clairs. « À la main » (la file des commandes d'aujourd'hui), « Confier à un apprenti » (un ordre permanent avec une cible en Réserve), « Machine » (si une machine est capable). Aujourd'hui ces trois existent déjà sous d'autres noms : commandes (`E.queue`), cadences (`E.setCadence`), machines (`E.machines`).
- **Apprentis, au pluriel.** Un apprenti = un ordre permanent : une recette et une cible de stock. La liste : `E.apprentis()` → `{ ordres, machines, bloques, eligible }`. Chaque ordre : `{ id, cap, have, on, status, machs, rate, miss }` avec `status` dans `ok | off | full | nomach | starved | busy`. Une machine est le **travailleur** d'un ordre : le mot « apprenti » à l'écran couvre l'ordre et son travailleur ; les paliers de machines (automate de bois, de bronze, presse à vapeur, chaîne, assembleur) deviennent des apprentis de rang supérieur (plafond d'ingrédients 1, 2, 3 inchangé).
- **Vue d'ensemble de l'automatisation** : une feuille « Ce qui tourne » (pastille dans l'en-tête de l'Atelier avec le nombre de blocages). Une ligne par ordre : icône, nom, `have / cap`, état en mots (« produit », « manque : Planche », « plein », « pas de machine »), débit, et un bouton pour relancer ou régler la cible. `bloques` donne le nombre d'ordres à regarder.
- **Les extracteurs restent aux Terres** ; l'Atelier ne les montre pas.
- La vue de l'Atelier ne défile pas (R1) : la liste des ordres est dans la feuille, la file des commandes est un conteneur interne.

## 5. Arbre

- Aujourd'hui : une page de progression par âge. On la garde, on lui ajoute :
  - **cases d'indices** : des cases « ? » portant une phrase cryptique, qui n'apparaissent que si leur condition est remplie, sans rien révéler (règle du coffre, `docs/coffre/`). **Le contenu est écrit par le porteur du projet** ; la 0.39 ne livre que le **gabarit** (case, état verrouillé / indice / résolu) et un emplacement `D.INDICES = []` vide, pour ne rien gâcher du récit.
  - **lien vers le Labo** : toucher une piste ouvre le Labo avec le geste et les matières que l'Intuition aurait déjà montrés (jamais la solution).

## 6. Qui fait quoi

| Qui | Quoi | Fichiers |
|---|---|---|
| **Claude** (fait) | première pièce offerte, chaîne manquante, liste des apprentis, tests, cahier, intégration | `js/engine.js`, `js/data.js`, `tools/test-refonte-0-39.js` |
| **Gemini** | onglets, Terres (pager, Atlas en feuille, pastilles), Labo, Atelier de production, vue d'automatisation, Arbre (gabarit d'indices, lien vers le Labo), `tools/test-ux.js`, migration de l'ancien état d'interface, tests Playwright | `index.html`, `js/ui.js`, `js/domaine.js`, `js/atelier.js`, `js/carte*.js`, `js/arbre.js`, nouveaux `js/terres.js` et `js/labo.js` si utile |
| **Codex** | fonds de terre translucides, rangée d'icônes des douze terres, esthétique distincte du Labo (paillasse, clair, sobre) et de l'Atelier (registre, ordres), icônes des 5 onglets, feuille Atlas, transitions du pager, états des apprentis | `css/*.css` **nouveaux fichiers seulement** (`css/terres.css`, `css/labo.css`, `css/atelier-production.css`), `assets/` |

**Pour éviter les conflits** : Gemini possède le HTML et le JS ; Codex ne touche que des fichiers CSS nouveaux et les `assets/`, sur la base des **classes** du chapitre 7. Pas de `!important` nouveau.

## 7. Contrat des classes (Gemini produit, Codex habille)

```
Terres   : .terres  .terres-rangee  .terres-icone[.is-courante|.is-fermee]  .terre-page
           .terre-fond (l'illustration, première enfant de .terre-page)  .terre-regle  .terre-gisements
           .terre-bas  .terres-pastilles  .feuille-atlas
Labo     : .labo  .labo-etabli  .labo-case  .labo-geste  .labo-bouton  .labo-thermo
           .labo-matieres  .labo-echantillon (badge)  .labo-chaine  .labo-compteur
Atelier  : .prod  .prod-choix  .prod-fiche  .prod-qui  .prod-file  .prod-pastille-auto
           .auto-feuille  .auto-ligne[.is-ok|.is-bloque|.is-plein]  .apprenti
Arbre    : .indice[.is-verrouille|.is-visible|.is-resolu]
Commun   : .feuille (déjà là), .pastille (déjà là)
```

Si Gemini a besoin d'une classe de plus, il l'ajoute à ce tableau dans sa PR (une ligne), et prévient dans son rapport.

## 8. Migration et compatibilité

- Les sauvegardes ne changent pas : aucun nouveau champ de partie (les apprentis lisent `state.dom.cadence` et le parc de machines).
- Si l'état d'interface mémorise l'onglet (`domaine`, `carte`, `carnet`), **migrer** vers `terres`, `terres`, `atelier` sans erreur. Test dédié.
- Les raccourcis internes (`data-tab="domaine"` etc., guide, objectifs, notifications, mode test) doivent être revus : recherche de `data-tab`, `showTab`, `goTab` dans tout `js/`.
- Le guide d'ouverture (`js/tuto.js`) et les aides (`E.AIDES`) disent encore « Domaine » et « Carte » : les mettre à jour (texte seulement).
- La barre d'onglets : révélation progressive conservée (Labo et Atelier dès la première fabrication, Arbre et Journal comme aujourd'hui).

## 9. Ce que la 0.39 ne fait pas

- Aucun changement d'économie, de coûts, de terres, d'âges (hors la première pièce offerte, désactivable : `D.PREMIERE_PIECE.max = 0`).
- Pas de nouvelle mécanique d'automatisation ; si le test montre que l'ordre permanent ne suffit pas, c'est la 0.40.
- Pas d'indices écrits (c'est le récit du porteur du projet).
- Pas de refonte du Journal, du Comptoir, de la Mémoire.

## 10. Critères de réception

1. `npm test` vert, et Playwright vert en CI.
2. R1 démontrée par `tools/test-ux.js` à 390 × 844 et 320 × 568, âges 1, 5, 9.
3. Récolter dans une terre : **un seul appui** depuis l'ouverture de l'onglet.
4. Une trouvaille au Labo : de l'ouverture à la pièce en Réserve, **moins de 5 appuis**.
5. Confier une recette à un apprenti : **moins de 4 appuis** depuis l'Atelier.
6. Une sauvegarde de la 0.38 s'ouvre sans perte, sur l'onglet Terres.
7. Revue de Claude sur téléphone réel (390 px) avant fusion dans `prewiew-design`.
