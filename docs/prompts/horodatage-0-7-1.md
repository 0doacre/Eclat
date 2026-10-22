# ÉCLAT v0.7.1 — Immersion : Horodatage du Journal

## Contexte

Dans les versions antérieures, les fragments découverts, les pages du Livre des Semeurs, les signes compris et les questions résolues s’accumulaient dans le Journal sans repère temporel. Or, ÉCLAT est une traversée à travers les âges et les cycles successifs : savoir à quel moment de l'histoire et à quel cycle une découverte a été faite renforce la dimension d’archive vivante du Journal.

Cette itération mineure (0.7.1) enrichit le Journal d'un double horodatage diégétique et temporel :
- **Cycle & Âge** : « Cycle 3 · Âge du Fer »
- **Date & Heure réelles** : « 22 oct. 21:40 »
- Pour les affichages compacts (grille du Livre, cartes de signes) : version courte « Cycle 3 · 22 oct. ».
- Pour les anciennes parties antérieures à la 0.7.1 : aucune fausse date inventée, l'affichage reste sobre.

## Objectifs du lot

1. **Persistance dans le moteur (`js/engine.js`)** :
   - Fonction `stamp(k)` stockant `[timestamp, cycle, age]` dans `S.meta.stamps[k]`.
   - Persistance garantie à la relève (`newCycle`) et à la sauvegarde/chargement JSON.
   - Enregistrement automatique lors de la découverte d'un fragment (`f:...`), d'une revisite (`r:...`), de l'obtention d'une page du Livre (`p:...`), de la compréhension d'un signe (`s:...`), et de l'apparition/résolution d'une question (`q:...`, `qr:...`).

2. **Rendu dans l'interface (`js/ui.js` & `css/style.css`)** :
   - Fonctions `stampTxt(k, short)` et `stampHTML(k, short)` générant le cartouche `.stamp`.
   - Intégration dans la liste des fragments, la modale de lecture de fragment, la grille et la modale du Livre des Semeurs, les cartes de signes compris et la liste des questions.
   - Style discret (`.stamp`), typographie à chiffres alignés (`tabular-nums`), couleur douce (`var(--dim, var(--muted))`).

3. **Validation & Rétrocompatibilité** :
   - Vérification qu'une ancienne sauvegarde charge sans erreur et ne montre pas de date inventée.
   - Tests automatisés dans `tools/test.js` et vérification sans erreur en navigateur via CDP.

> **Livraison.** Travaille dans un clone du dépôt GitHub `0doacre/craftgame`, à jour
> (`git pull` sur `main` avant de commencer), jamais dans une copie ou un dossier temporaire.
> Crée une nouvelle branche au nom de la tâche (par exemple `claude-horodatage-0-7-1`).
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
