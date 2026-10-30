# Gemini : la refonte des écrans 0.39 (interface)

Tu pars de la branche `claude/refonte-ecrans-0-39` (tirée de `prewiew-design`, 0.38.0). Crée `gemini/refonte-ecrans-0-39` et pousse-y ton lot. **Ne fusionne rien.** Lis d'abord `docs/REFONTE-ECRANS-0-39.md` en entier : c'est la référence, avec les décisions du porteur du projet, les règles d'écran R1 à R4, le contrat des classes et les critères de réception.

## Ta mission

Passer de six onglets à cinq : **Terres · Labo · Atelier · Arbre · Journal**. Tu possèdes le HTML et le JS ; Codex habille avec des CSS neufs, à partir du contrat de classes du chapitre 7. Le moteur est prêt (voir plus bas), tu n'y touches pas sans m'en parler.

1. **Terres** (chapitre 2). Une terre par écran, glissable, rangée d'icônes des terres en haut, l'illustration de la terre en fond (un élément `.terre-fond`, Codex règle l'opacité), au plus 4 gisements en lignes, passage ou lieux à explorer en bas. La Carte devient la feuille « Atlas », qui rouvre la page de la terre touchée. Objectif, relève, Comptoir, production : pastilles qui ouvrent des feuilles. **Récolter doit coûter un appui.**
2. **Labo** (chapitre 3). L'établi seul : trois cases, geste, bouton, thermomètre, Intuition. Une rangée de matières, une feuille de recherche. Échantillons : toute matière déjà vue se pose sans stock, badge `.labo-echantillon`. Affiche `offered` (la première pièce est gardée) et `E.chaineManquante(id)` (« à découvrir d'abord »). Compteur de recettes trouvées qui ouvre le Carnet.
3. **Atelier** (chapitre 4). Choisir une recette, une quantité, puis « À la main », « Confier à un apprenti » ou « Machine ». La feuille « Ce qui tourne » est alimentée par `E.apprentis()`. **L'Atelier ne défile pas** (R1).
4. **Arbre** (chapitre 5). Gabarit d'indice `.indice` (verrouillé, visible, résolu) et lien vers le Labo avec geste et matières pré-sélectionnés par ce que l'Intuition a déjà montré. `D.INDICES = []` reste vide : le contenu est du récit, il n'est pas à toi.
5. **Migration** (chapitre 8). Anciens onglets mémorisés, `data-tab`/`showTab` partout, guide d'ouverture et aides (`E.AIDES`) : textes mis à jour.
6. **`tools/test-ux.js`** (R4), ajouté à `npm test`, et tests Playwright des trois parcours des critères 3, 4 et 5.

## Ce que le moteur te donne (fait par Claude, testé)

- `E.attempt(...)` renvoie `offered: true` quand la première pièce est offerte (`kind: "learn"`).
- `E.chaineManquante(id)` : liste d'identifiants d'intermédiaires jamais découverts.
- `E.apprentis()` : `{ ordres: [{ id, cap, have, on, status, machs, rate, miss }], machines: [{ id, own, used, free, spd }], bloques, eligible }`. `status` : `ok | off | full | nomach | starved | busy`.
- Existants : `E.queue`, `E.setCadence(rec, cap, on)`, `E.cadenceEligible()`, `E.machines()`.

## Ce que tu dois rendre

- Le code, les tests, `node tools/build.js`, la version en 0.39.0 dans `package.json`, `D.VERSION` et une entrée de `D.CHANGES` en langage de joueur.
- Un rapport : ce qui est fait, ce qui ne l'est pas, les mesures R1 (hauteurs aux deux tailles), le nombre d'appuis des critères 3, 4, 5, et ce que tu as vu sur un vrai écran de 390 px (captures dans `docs/revue/refonte-0-39/`).
- Aucun `!important` nouveau. Pas de nouvelle dépendance.

## Pièges que je connais

- `js/domaine.js` fait 1 274 lignes : extrais `js/terres.js` plutôt que de le gonfler ; ne casse pas `isZonePassed` ni `.gis-compact`.
- Le bandeau de récolte réserve sa place (`--actbar-h`) : ne le recouvre pas avec le pager.
- Le glissement horizontal ne doit pas entrer en conflit avec le retour en arrière de l'appareil ni avec le défilement de la rangée d'icônes. Prévois les boutons « précédente / suivante » pour qui ne glisse pas, et le clavier.
- Les objectifs et notifications qui ouvrent « Domaine » ou « Carte » doivent atterrir sur la bonne terre.
- Mode test (`?mode-test=1`) : conserver son panneau.
