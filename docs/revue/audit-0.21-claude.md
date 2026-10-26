# Audit indépendant d’Éclat 0.21.0 — commit 4a76184

Auteur : Claude (session `claude/beautiful-meitner-b6eixb`). Date : 2026-10-25.
Commit audité : `4a76184` (« Merge pull request #89 … codex/densite-ressources »), `D.VERSION = "0.21.0"`, `SAVE_VERSION = 11`.

## 0. Méthode, périmètre, limites

**Aucune modification du jeu.** Le commit a été extrait dans un worktree détaché (`…/scratchpad/wt`) ; les anciennes données 0.20 dans `…/scratchpad/wt20` (commit `b39ffce~1`). Tous les scripts de mesure sont dans `…/scratchpad/` (annexe A).

**Indépendance.** Je n’ai ouvert ni un fichier `docs/AUDIT-*`, ni la branche `origin/codex/audit-progression`, ni aucun rapport Codex. J’ai lu les documents de conception du dépôt (README, `docs/PLAN-ALPHA.md`, `docs/A-FAIRE.md`, `docs/revue/densite-ressources.md`, `docs/revue/simulation-premier-parcours.md`, `docs/prompts/comptoir-5-4.md`, `docs/prompts/troqueur-5-9.md`, `docs/RENAISSANCES.md` §5). Effet de bord : un `git fetch origin` a mis à jour les références distantes locales (rien n’a été lu dedans) et deux worktrees ont été ajoutés au dépôt local (`git worktree list`) ; à retirer quand l’audit sera clos.

**Ce que j’ai fait.** Lecture du moteur (`js/engine.js`, 4 842 lignes), des données (`js/data.js`), du Comptoir, des sauvegardes, du cloud, des tests ; suite de tests du dépôt ; analyses statiques du graphe des recettes ; ~12 expériences sur le moteur réel avec horloge virtuelle ; un bot qui suit uniquement le guide (73 objectifs, 25 parcours avec fabrications anticipées aléatoires) ; fuzz de la file de commandes, du Domaine et des sauvegardes (≈ 900 cas) ; deux sessions Playwright (démarrage, deux onglets).

**Ce que je n’ai pas fait.** Pas de test sur de vrais téléphones, pas de session humaine, pas d’audit du récit ni des textes (hors les textes de 0.21 touchant la mécanique), pas de test de sécurité du serveur au-delà de ses 14 tests, pas de fuzz XSS des champs libres.

**Vocabulaire.**
- **Fait prouvé** : reproduit par un script ou une commande listés en annexe, résultat rapporté tel quel.
- **Fait mesuré** : calculé sur le moteur réel avec des hypothèses de joueur explicites.
- **Avis de conception** : jugement de ma part ; le jeu fonctionne comme écrit, c’est le choix qui est discutable.
- Priorités : **P1** perte de données ou blocage ; **P2** défaut net à corriger avant l’alpha ; **P3** à planifier ; **P4** mineur ou documentaire.

## 1. Verdict

Le jeu tient techniquement : tout objet non secret est atteignable (analyse statique), un joueur qui ne fait que suivre le guide termine les 73 objectifs sans blocage ni étape hors d’âge, les commandes préparées en 0.20 se terminent correctement après migration, la production hors ligne égale la production en ligne, et 900 cas de fuzz ne produisent aucun stock négatif ni NaN.

Les problèmes sont ailleurs : **(1)** une perte possible de sauvegarde avec deux onglets, **(2)** l’économie du Comptoir, dont les Traces dépassent celles des passages dès l’âge 7 pour un extracteur laissé une nuit, et que 0.21 aggrave, **(3)** des demandes du Troqueur incohérentes, **(4)** des gardes-fous de sauvegarde absents (échec d’écriture silencieux), **(5)** un `npm test` rouge sur le commit audité.

| ID | Prio | Constat | Nature |
|---|---|---|---|
| C-01 | P1 | Deux onglets : la page périmée écrase la sauvegarde de l’autre | Fait prouvé |
| C-02 | P2 | `npm test` échoue sur le commit audité (empreinte `sw.js`) | Fait prouvé |
| C-03 | P2 | Comptoir : les écus donnent plus de Traces que tous les passages dès l’âge 7 (un extracteur, une nuit) ; 0.21 l’aggrave | Fait mesuré |
| C-04 | P2 | Demandes du Troqueur : quantités incohérentes d’un âge à l’autre ; rentabilité qui dépend du rang et de l’âge | Fait mesuré |
| C-05 | P2 | Échec d’écriture de la sauvegarde silencieux, pas de demande de stockage persistant | Fait (code) + avis |
| C-06 | P3 | `E.plan` compte du surplus futur comme du stock : une commande crée de la matière | Fait prouvé |
| C-08 | P3 | Hors ligne : plafond 12 h affiché comme durée réelle d’absence, coupure sèche | Fait + avis |
| C-09 | P3 | Thermomètre et étude ignorent la règle d’âge | Fait mesuré |
| C-10 | P3 | « Déchiffrer » coûte plus que l’Intuition d’une partie entière | Fait + avis |
| C-11 | P3 | Ruines : écrasées à la relève suivante, réparables sans condition | Fait prouvé |
| C-12 | P3 | `tools/sim.js` offre tous les passages : « 1 h 18 » n’est pas une durée de partie | Fait (code) |
| C-13 | P3 | Comptoir : vente sans garde-fou, but des écus non expliqué | Fait + avis |
| C-14 | P3 | `tools/test-ux.js` : 1 échec sur 8 exécutions, cause non identifiée | Fait (partiel) |
| C-07 | P4 | Parties 0.20 : le compteur d’étapes recule (3/3 → 3/6) sans que les nouveautés le disent ; le guide, lui, mène sans impasse | Fait prouvé |
| C-15 | P4 | Guidage : torche connue mais absente → aucune étape proposée | Fait prouvé |
| C-16 | P4 | Incohérences de texte et de données (liste dans C-16) | Faits |

## 2. Constats détaillés

### C-01 — P1 — Deux onglets : une page périmée écrase la sauvegarde  *(fait prouvé)*

**Reproduction.** `node twotabs.js` (Playwright, même profil, deux pages).
1. Page A et page B chargent la même sauvegarde (bois = 100).
2. Dans B, 30 appuis sur le bois : B enregistre, `localStorage` vaut 132.
3. A est restée en mémoire à 100. Un `save()` de A (le jeu en appelle un toutes les 10 s, au `pagehide` et au passage en arrière-plan) remet `localStorage` à **100**.

Le jeu n’a aucun garde-fou : pas d’événement `storage`, ni `BroadcastChannel`, ni Web Locks (grep sur `js/`). `save()` (`js/ui.js:579`) écrit sans lire. Les copies de secours (`pushBackup`) ne se font qu’avant une mise à jour, une relève, un import ou une nouvelle partie : rien ne protège ici.

**Impact.** Toute session menée dans l’autre onglet est perdue, sans message. Contraire à la règle du dépôt « Ne jamais perdre une sauvegarde » (`docs/prompts/*`). Cas réalistes : PWA installée + onglet du navigateur, lien ouvert en double, restauration d’onglets après un redémarrage. Sur mobile (hypothèse, non testée), une page mise en veille puis réveillée pourrait écrire un état ancien par le même chemin.

**Correction proposée.**
1. Un numéro de révision (ou `S.t`) dans la sauvegarde ; avant d’écrire, relire la clé et refuser d’écraser une révision plus récente venue d’un autre onglet.
2. Écouter `storage` : si la clé change pendant que la page est ouverte, bloquer l’écriture (`U.saveLocked`) et afficher « Cette partie est ouverte ailleurs » avec « Recharger ».
3. Alternative : Web Locks pour un seul onglet actif.
4. Une copie de secours tournante (une toutes les N minutes de jeu) en filet de sécurité.
5. Test Playwright à deux pages (le script `twotabs.js` est la base).

### C-02 — P2 — `npm test` rouge sur le commit audité  *(fait prouvé)*

**Reproduction.** Sur `4a76184` propre : `npm test` → `syntax`, `validate`, `test.js` (217 tests), `arbre-mesures`, `test-sim` (19), `test-recit` (60) et le serveur (14) passent, puis `✗ sw.js n’est pas à jour (BUILD a4ddd3b89b ≠ 960245df44)`, code de sortie 1. `node tools/build.js --check` seul donne la même chose.

**Cause.** L’empreinte `a4ddd3b89b` est écrite dans le commit de fusion `4e8d1ee` (`origin/main` fusionné dans `codex/densite-ressources`), dont l’arbre est **identique** à celui de `4a76184` (`git diff 4a76184^2 4a76184` est vide) : elle ne correspond déjà pas aux fichiers de ce commit. La version fusionnée n’a pas été reconstruite (`node tools/build.js`).

**Impact.** Pas de dégât visible chez les joueurs : `a4ddd3b89b` diffère de la valeur 0.20.1 (`b7b2f77e58`), donc les clients se mettent à jour. Mais le garde-fou qui empêche de livrer des fichiers modifiés sous une ancienne empreinte (cache d’abord, `sw.js`) est déjà cassé : un correctif ultérieur oublié du même type ne serait jamais servi aux joueurs déjà installés.

**Correction.** `node tools/build.js` et commit ; exiger `npm test` sur le commit de fusion (CI ou crochet de pré-fusion) ; ne pas fusionner sur un test rouge.

### C-03 — P2 — Comptoir : les écus donnent plus de Traces que tous les passages  *(fait mesuré)*

**Mécanique.** `newCycle()` convertit les écus restants : `floor(écus / (100 × 1,8^âge))`. Un objet vaut `0,1 × 2,5^âge` pour une matière brute et `Σ ingrédients × 1,25` par étape de recette ; la saturation (`sat = 2000`) est **par identifiant d’objet**, donc vendre vingt matières contourne la saturation. Les Traces des dix passages totalisent 265 (2, 5, 10, 18, 30, 48, 75, 115, 175, 265 en cumul). Toute la Mémoire des mains coûte 10 459 Traces.

**Reproduction 1 : un extracteur laissé en route.** `node faucet.js` (moteur réel : un extracteur posé, vente de tout le stock, conversion au prix de l’âge). La dernière colonne donne les Traces des passages déjà franchis quand on *entre* dans l’âge (milestones : Désert fini à l’âge 4, Gisement à l’âge 10, Pics à l’âge 11).

| Un extracteur | Durée | Stock vendu | Écus | Traces à la relève | Traces des passages déjà franchis |
|---|---|---:|---:|---:|---:|
| 1 cabane, âge 2 | 12 h | 51 839 | 659 | 2 | 5 |
| 1 mine de fer, âge 5 | 12 h | 34 559 | 56 754 | 30 | 30 |
| 1 pompe à bras, âge 7 | 12 h | 129 600 | 511 062 | **83** | 30 |
| 1 mine d’uranium, âge 9 | 12 h | 34 559 | 2 216 934 | **111** | 30 |
| 1 mine de bauxite, âge 11 | 1 h | 10 800 | 8 851 519 | **137** | 48 |
| 1 mine de bauxite, âge 11 | 12 h | 129 600 | 19 963 359 | **310** | 48 (75 en sortant de l’âge) |
| 1 soufrière, âge 11 | 12 h | 64 800 | 16 730 098 | **260** | 48 |

**Reproduction 2 : l’inventaire du bot.** `sh sim-potentiel-ecus.sh` (copie jetable de `tools/sim.js`, vend tout l’inventaire à chaque entrée d’âge, sortie dans `sim-potentiel-ecus.out`) :

| Entrée dans l’âge | Écus potentiels 0.20 | Traces 0.20 | Écus potentiels 0.21 | Traces 0.21 | Traces des passages |
|---:|---:|---:|---:|---:|---:|
| 8 | 16 037 | 1 | 105 775 | 9 | 30 |
| 10 | 75 019 | 2 | 216 817 | 6 | 30 |
| 12 | 1 468 934 | 12 | 3 200 464 | 27 | 75 |
| 13 | 112 170 066 | **538** | 132 350 829 | **635** | 115 |
| 14 | 238 289 838 | **635** | 277 392 059 | **740** | 265 |

Le stock d’un bot qui ne thésaurise pas reste modeste jusqu’à l’âge 12 ; il explose ensuite (déjà en 0.20 : les âges 13 et 14 sont dominés par les pièces de fusée, les boucliers thermiques, le régolithe et l’hélium 3). La différence 0.20 → 0.21 aux âges 8 à 12 vient de l’**eau** : à l’entrée de l’âge 8, 84 % des écus potentiels (89 107 sur 105 775) sont de l’eau, matière nouvelle de l’âge 7 qu’une pompe produit à 3/s, valorisée 61 écus l’unité comme un minerai rare.

**Historique.** Le prompt de spécification 5.4 (`docs/prompts/comptoir-5-4.md`) demandait `trace: 200, traceAge: 2.5, traceUp: 1.6` : un prix de Trace qui suit la croissance des valeurs (2,5 des deux côtés) et monte à chaque Trace achetée. Le code est entré avec `trace: 100, traceAge: 1.8, traceUp: 1.5` (commit `aadc25a`, « Textes : suite du tutoriel ») ; je n’ai trouvé aucun document qui explique l’écart. La 5.9 (`docs/prompts/troqueur-5-9.md`) a remplacé l’achat par la conversion automatique à la relève pour un motif inverse : « tout vendre rapporte 42 000 écus, soit 1 Trace » à l’âge 9. `traceUp` n’est plus lu nulle part. Depuis, les extracteurs par ressource (0.17), puis l’eau et le soufre (0.21), ont multiplié ce qu’un joueur peut vendre. Les constantes n’ont pas été recalées : le problème de la 5.9 s’est retourné.

**Impact.** (1) Le rythme voulu (« chaque relève va environ une terre plus loin », `README`) ne tient plus dès qu’on a un extracteur et qu’on part une nuit : de l’âge 7 à l’âge 11, il rapporte 2,8 à 6,5 fois les Traces de tous les passages déjà franchis, et au même âge un seul passage rapporte 12 à 27 Traces. (2) Le plus rentable devient de poser des extracteurs et de vendre, pas de franchir des passages. (3) La Mémoire (10 459 Traces) et les Résonances (coût exponentiel) se vident vite : une mine de bauxite laissée 12 h vaut 310 Traces. (4) Le cas de l’eau (0.21) montre que l’ajout d’une matière brute modifie l’économie sans que rien ne le signale ; il n’y a pas de test d’équilibre qui l’aurait vu. Le plafond hors ligne (C-08) ne limite rien ici : le stock s’accumule aussi en jouant, et la vente ne se fait qu’à la relève.

**Correction proposée.** À trancher avec l’auteur ; par ordre de simplicité :
1. Rétablir un prix de Trace qui suit la valeur (`traceAge = rawAge = 2,5`) et une hausse par Trace convertie dans le cycle (`traceUp`), puis recaler `trace` avec le simulateur.
2. Plafonner la conversion par relève (par exemple ≤ k × les Traces des passages du cycle) ou la rendre sous-linéaire (racine).
3. Saturer par âge de matière, pas par objet.
4. Donner à une matière une valeur qui tienne compte de son débit (l’eau à 3/s ne peut pas valoir autant qu’un minerai à 0,5/s).
5. Ajouter au simulateur une colonne « Traces potentielles du Comptoir » à chaque âge, avec un test qui échoue si elle dépasse celle des passages.

### C-04 — P2 — Demandes du Troqueur : quantités incohérentes d’un âge à l’autre  *(fait mesuré)*

**Mécanique.** Une demande porte sur un objet connu et déjà fabriqué d’âge `âge-1` ou `âge` ; la quantité est `roundNice(2 × prix de la Trace × récompense / valeur)` ; la récompense est `max(1, round(0,15 × Traces du prochain passage))`, plus un bonus de rang fixe (+1 à +5, indépendant de l’âge).

**Reproduction.** `node asks.js` et `node asks2.js` (400 renouvellements par âge, états synthétiques : âge N, objets des âges N-1 et N connus et déjà fabriqués).
- Quantité exprimée en matières premières par demande (médiane, p90, maximum) : âge 4 : 1 040 / 3 640 / 11 400 ; âge 8 : 12 533 / 45 467 / 58 667 ; **âge 10 : 168 000 / 370 000 / 1 040 000 (63 % des demandes dépassent 100 000 unités)** ; âge 12 : 1 093 / 4 200 / 7 560.
- Exemples tirés par le moteur : « graphite × 32 000 » (âge 9), « graphite × 86 000 » (âge 10) pour 4 à 6 Traces.
- Cause : la quantité suit `valueOf`, qui vaut peu pour un objet fait de vieilles matières (le graphite vient du charbon, âge 0) alors que le prix de la Trace suit l’âge courant.

**Rentabilité.** Une demande exige des objets d’une valeur de `2 × prix de la Trace × récompense` écus et donne `récompense + bonus de rang` Traces ; les mêmes objets vendus donnent `2 × récompense` Traces à la relève (avant saturation). Vendre l’emporte donc dès que `récompense > bonus`. La récompense de base (`E.troqueurReward`) vaut 1 aux âges 1 à 4 et passe à 9–14 aux âges 11–14 ; le bonus va de 0 à 5 et dépend du nombre de livraisons (3, 8, 18, 35). Conséquence : aux âges bas avec un rang élevé, une demande rapporte jusqu’à 6 Traces (3 fois la vente), aux âges élevés elle rapporte moins que la vente, et la courbe ne suit rien de ce que le joueur produit.

**Impact.** L’onglet « Demandes » affiche régulièrement des demandes impossibles à honorer (plusieurs centaines de milliers d’unités à l’âge 10) puis, deux âges plus loin, des demandes de quelques centaines. Un joueur occasionnel y voit du bruit et ne peut pas planifier. Aux rangs élevés et aux âges bas, c’est au contraire un faucet fort (18 Traces toutes les 20 minutes pour trois demandes), plus élevé que les passages.

**Correction proposée.** Calculer la quantité sur le coût en matières premières (ou sur le temps de production du joueur) plutôt que sur `valueOf` ; borner par la production estimée (par exemple ≤ 30 min de production de l’objet) ; écarter les objets qui ne passent pas ce filtre ; faire croître le bonus de rang avec l’âge (par exemple en pourcentage de la récompense) ; réévaluer le rapport demande / vente après C-03.

### C-05 — P2 — Échec d’écriture de la sauvegarde silencieux, pas de stockage persistant  *(fait (code) + avis)*

**Faits.** `save()` ignore toute exception (`catch (e) { /* stockage indisponible */ }`, `js/ui.js:581`) ; aucun message à l’écran. Aucun appel à `navigator.storage.persist()` dans `js/`. La partie n’existe que dans `localStorage` (≈ 25 Ko en fin de partie) ; copies de secours : 5 au maximum, dans le même stockage ; compte en ligne facultatif.

**Impact (avis).** Plusieurs navigateurs peuvent effacer le stockage d’un site non installé après une période sans visite ou sous pression de stockage ; le mode privé et les quotas pleins font échouer l’écriture sans que le joueur le sache. Un joueur occasionnel qui revient après plusieurs jours est le plus exposé. Comportement des navigateurs **non testé ici** : à vérifier sur appareils.

**Correction proposée.** `navigator.storage.persist()` après la première relève (ou à l’installation) ; compter les échecs d’écriture et afficher un bandeau « Ta partie n’est pas enregistrée » ; rappeler l’export (ou le compte) après un jalon, avec la date de la dernière copie ; test unitaire avec un stockage qui lève.

### C-06 — P3 — `E.plan` compte le surplus futur comme du stock : une commande crée de la matière  *(fait prouvé)*

**Mécanique.** Dans `E.plan` (`js/engine.js` ≈ 1100), quand une recette produit plus d’une unité (`lingot_bronze` en donne 4), le surplus est ajouté à `avail` ; un consommateur suivant le prélève et `used[x]` augmente, comme si c’était du stock. `E.order` retire `used` de la Réserve (`add(i, -bench[i])`, borné à 0) et le crédite à l’établi : la pièce n’existait pas, et la production planifiée du surplus a lieu quand même.

**Reproduction.** `node phantom6.js` ; `node phantom4.js` (conservation de la matière, sans chef-d’œuvre : `rand` fixé à 0,9999).
- `E.order("echangeur", 1)` depuis des matières brutes seulement : à la fin, **2 naphta en trop** ; même consommation de matières premières que la fabrication manuelle (`craftPlan`) : fibre 8, charbon 3, malachite 9, pétrole 8, soufre 3.
- `E.order("chariot", 1)` : 4 lingots de bronze restants au lieu de 3.
- 20 recettes ont un plan fantôme (`phantom.js`) ; pour les pièces consommables, la conservation échoue pour `masque` (+1,33 matière brute équivalente), `manometre` (+2), `regulateur` (+8), `echangeur` (+2,67).

**Impact.** Faible par commande (au plus quelques pièces intermédiaires), mais c’est une fuite de matière reproductible sur les chaînes neuves de 0.21 (naphta). Les tests de `tools/test-densite.js` ne vérifient que les matières brutes, d’où l’absence de détection.

**Correction.** Dans `plan()`, ne compter dans `used` que la part qui vient du stock réel (`S.inv`), pas celle de `avail` issue d’un surplus ; ajouter un test de conservation (matière brute équivalente avant = après, hors chefs-d’œuvre).

### C-07 — P4 — Parties 0.20 : l’avancement recule, sans que les nouveautés le disent  *(fait prouvé)*

**Reproduction.** `node legacy7c.js` construit une partie 0.20 « naturelle » à la Vapeur (passages jusqu’au Désert, moteur, régulateur et presse faits) ; `node legacy7d.js` la charge en 0.21 et joue en suivant l’objectif et le guide.
- Jalons de la Vapeur : `eau_1 ✗ circuit_vapeur ✗ moteur_vapeur ✓ regulateur ✓ presse_vapeur ✓ recuperation_vapeur ✗` : le compteur passe de 3/3 à **3/6**, et l’âge n’avance pas tant que les trois nouvelles étapes ne sont pas faites (fabriquer la dynamo ne suffit pas).
- L’objectif affiché est `recuperation_vapeur` (l’objectif retient l’étape la plus avancée). Le guide mène ensuite sans impasse : tuyau de cuivre → pompe à bras → condenseur → circuit de vapeur → bac de trempe → récupération de vapeur → dynamo ; l’âge passe alors à 8.
- Même mécanisme aux Polymères (`naphta`, `soufre_1`, `refroidissement`).
- Pour une partie qui avait déjà fabriqué le plastique à l’ancien prix, l’objectif `naphta` est sauté : commander du plastique répond « Recettes encore inconnues : Naphta » sans objectif qui y mène (`t3.js`).

`D.CHANGES[0]` dit « sans décaler les âges ni retirer tes découvertes » et ne mentionne ni ces étapes ni leur effet sur l’avancement. C’est cohérent avec la décision documentée (« un joueur qui se trouve dans un âge enrichi en suit les nouvelles étapes »), mais le joueur n’est pas prévenu.

**Positif (fait prouvé).** Les commandes préparées en 0.20 se terminent au bon prix après migration v10→v11 (`t2.js` + `t3.js` : plastique ×40, caoutchouc ×20, moteur ×3, toutes livrées, stocks exacts). `tools/test-densite.js` couvre aussi les chargements répétés et les machines. Les quatre recettes modifiées sont toutes dans `INPUTS_020`.

**Correction.** Une ligne aux nouveautés : « Trois étapes de la Vapeur (pompe, circuit, récupération de vapeur) restent à faire avant l’Électricité » ; pour le plastique ancien, un message de plan « recette modifiée : il faut maintenant du naphta (chauffer du pétrole à 400 °C) ».

### C-08 — P3 — Hors ligne : plafond de 12 h présenté comme la durée d’absence  *(fait + avis)*

**Faits.** `E.catchUp` plafonne `dt` à `12 h` (+6 h par niveau de « Longues nuits », +25 % avec le don « Le sommeil lourd ») et passe ce `dt` plafonné à l’interface : la fenêtre « Pendant ton absence · … » affiche la durée plafonnée, sans dire que le reste est perdu. La coupure est sèche, sans dégressivité. **Vérifié** : production hors ligne = production en ligne (`offeq.js`, 3 h : écarts < 2 % sur tous les stocks, file et machines comprises) ; `OFFLINE_CAP` ne coupe qu’au-delà de 12 h.

**Avis.** Pour un joueur occasionnel, un rythme matin / soir laisse 14 à 16 h d’absence : 25 % de la production nocturne est perdue sans qu’il le sache. Toute hausse du plafond augmente aussi ce que l’on peut vendre au Comptoir (C-03) : à décider ensemble.

**Correction.** Afficher « Tu étais parti 30 h ; la production compte jusqu’à 12 h (Longues nuits, ☰ → Mémoire) » ; envisager une dégressivité (100 % jusqu’à 12 h, 50 % jusqu’à 48 h) plutôt qu’une coupure.

### C-09 — P3 — Thermomètre et étude ignorent la règle d’âge  *(fait mesuré)*

**Mécanique.** `temperature()` et `reactions()` parcourent toutes les recettes inconnues, sans tester `ageOK`. Or `attempt()` ne crée jamais un objet d’âge trop lointain (« l’essai ne donne rien »).

**Reproduction.** `node thermo2.js` : 4 000 essais au hasard (1 à 3 matières vues, gestes connus) par âge, comparés au thermomètre restreint aux recettes accessibles :
- âge 0 : **18 %** des échecs reçoivent un thermomètre trop chaud, dont 9,7 % d’au moins deux crans ; âge 1 : 9,3 % (4,4 %) ; âge 2 : 6,1 % (3,5 %) ; âge 4 : 4,4 % (1,9 %).
- Exemple minimal : sur une partie neuve, après avoir vu la pierre, `E.attempt("tailler", ["caillou"])` renvoie `{ kind: "fail", temp: 2, why: "tiede" }` (« bon geste, bonne piste ») à cause de l’enclume de pierre (`tailler` + 120 pierres, âge 3, `ageOK` faux).

**Impact.** Le joueur reçoit « bonne piste » pour une combinaison qui ne donnera rien avant plusieurs âges ; il perd des essais. C’est le début de partie, là où il est le plus fragile.

**Correction.** Filtrer par `ageOK(rid)` dans `temperature` et `reactions`, ou rendre le message explicite (« ça viendra plus tard »).

### C-10 — P3 — « Déchiffrer » coûte plus que l’Intuition d’une partie  *(fait + avis)*

**Faits.** `decipherCost = D.DECHIFFRER.cost[niveau] × (1 + âge) × nombre d’ingrédients`, avec `[3, 8, 20]`. Révéler entièrement une recette de deux ingrédients coûte 124 (âge 1), 186 (âge 2), 372 (âge 5), 496 (âge 7), 744 (âge 11). La partie complète du bot (`DUMP`) finit avec 152 Intuition non dépensés et 181 recettes connues ; les sources sont +1 par recette, +3 par âge accompli, 2 à 4 par exploration, +2 par jour de présence. La première étape seule coûte déjà 12 à 84.

**Avis.** Les réminiscences gratuites (6 / 14 / 26 points d’essais) rendent la voie payante superflue ; elle est pourtant mise en avant (tutoriel « Intuition »). L’étude (1 à 4 Intuition) est le seul puits abordable.

**Correction.** Diviser les coûts par ~5, ou les lier à l’Intuition réellement gagnée ; sinon assumer le puits de luxe et l’expliquer.

### C-11 — P3 — Ruines : écrasées à la relève suivante, réparables sans condition  *(fait prouvé)*

**Reproduction.** `node ruins.js`.
- Relève 1 : `{cabane: 3, derrick: 2, uranium_1: 3, automate_bronze: 3}`. Relève 2 sans rien réparer : `{}` — `newCycle` recalcule les ruines depuis l’inventaire du cycle qui finit et ne reprend pas celles qui restent.
- `E.repair` ne vérifie ni la terre, ni l’âge, ni la recette connue ; le coût est 10 % de la recette de base, quel que soit le rang de l’exemplaire (le troisième derrick coûte comme le premier alors que son prix normal a grimpé de 1,25²).

**Impact.** Les ruines servent surtout à accélérer le cycle suivant ; un joueur occasionnel qui relève deux fois de suite perd l’héritage sans le savoir. Le rabais de 90 % sur des bâtiments avancés est voulu (« une fraction du prix »), mais il court-circuite le scalage du coût.

**Correction.** Fusionner `meta.ruins` à la relève (`min(cap, ancien + nouveau)`) ; documenter ou plafonner le rabais.

### C-12 — P3 — `tools/sim.js` offre tous les passages  *(fait (code))*

`tools/sim.js` marque chaque passage en attente comme franchi sans payer (`for (const z of E.passPending()) { S().pass[z].done = true; … }` et la branche `ob.k === "pass"` de `currentTargets`). Les chiffres cités dans `PLAN-ALPHA.md` et `docs/revue/densite-ressources.md` (« fin en 1 h 18 », « 2 h 50 avec MAINS=1 ») sont donc des durées sans le coût des passages. Le document de 0.21 dit que le bot « ignore une partie des coûts de découverte et de passage » : les coûts de passage sont tous ignorés.

À titre de comparaison, `tools/sim-passages.js --joueur tapeur --minutes 900` paie les passages : Plaine 5,8 min, Rivière 17,5, Collines 33,9, Profondeurs 55,3, Désert 62,0, Gisement 96,5, Pics 134,5, **Rampe 463,1** (329 min dans l’âge, 197 min de versement), puis **la Lune n’est pas franchie après 900 min**. Ce bot investit peu (extracteurs : 1 pompe, 1 soufrière, 2 mines d’ilménite…) ; la mesure est une borne haute pour un joueur attentif, pas une durée de partie.

**Correction.** Le dire dans le rapport ; ajouter une sortie « avec passages payés » au bot complet.

### C-13 — P3 — Comptoir : vente sans garde-fou, but des écus non expliqué  *(fait + avis)*

**Faits.** (a) Les boutons « 10 % / La moitié / Tout sauf 100 » ne demandent pas de confirmation ; la liste est triée par valeur décroissante, donc les stocks les plus précieux — souvent les pièces dont un passage a besoin — sont en haut. Racheter coûte 3 × la valeur (et seulement pour les matières récoltables à la main). (b) Avec un seul exemplaire, « 10 % » vend 1 exemplaire = 100 % (`Math.max(1, floor(have × 0.1))`). (c) Rien dans le Comptoir ne dit à quoi servent les écus : la conversion en Traces n’est dite qu’à la fenêtre de relève et dans la réplique de rang 1 du Troqueur (`c3`, rang 1 = 3 livraisons).

**Correction.** Confirmation au-dessus d’un seuil de valeur ou d’un exemplaire nécessaire à l’objectif en cours ; ligne explicative « À la relève, tes écus deviennent des Traces (N écus = 1 Trace à ton âge) » dans le Comptoir ; libellé exact du nombre vendu sur chaque bouton.

### C-14 — P3 — `tools/test-ux.js` : un échec sur huit exécutions  *(fait (partiel))*

Première exécution : `AssertionError` (`actual: false`, `expected: true`), dont je n’ai gardé que la fin de la sortie ; les sept exécutions suivantes (même machine, même commit) donnent « UX mobile : 480 contrôles réussis ». **À faire :** relancer en boucle en conservant la sortie complète pour identifier le contrôle intermittent ; un test d’interface qui échoue une fois sur huit masquera le jour où il échouera pour de bon.

### C-15 — P4 — Guidage : torche connue mais absente  *(fait prouvé)*

`node guide1.js` : au passage vers le Désert (lieu « Le Filon Profond », coût 2 torches) et vers la Rivière dans mon bot, `E.guide()` renvoie `step: null` quand la recette de la torche est connue mais qu’il n’y en a plus ; l’interface ne dit rien avant l’appui sur « Explorer » (toast « Il te manque 1 Torche (voir le Carnet) »). La branche `pass` de `E.guide` ne propose une étape que si la recette est inconnue (`s.why === "unknown"`).

**Correction.** Proposer l’étape `known` : « Fabrique 2 torches ».

### C-16 — P4 — Incohérences de texte et de données  *(faits)*

- `README.md` liste six machines dont un « réacteur à antimatière » ; il y en a cinq (`automate_bois`, `automate_bronze`, `presse_vapeur`, `chaine`, `assembleur`).
- `chaudiere.u` : « Sert dans le moteur à vapeur » ; depuis 0.21 elle sert au circuit de vapeur et à la chaudière tubulaire.
- `README` : « Chaque passage coûte bien plus que le précédent » ; en matières premières le Gisement Noir (22 750) coûte moins que le Désert (85 800).
- `capsule.u` : « Agit à ta prochaine Relève » ; `meta.capsule` ne se remet jamais à `false`, le stock de capsule est redonné à chaque relève.
- `D.COMPTOIR.traceUp` n’est lu nulle part ; `centrale` donne `électriser niveau 2` alors qu’aucune recette n’exige ce niveau (son seul effet est +50 % d’extraction) ; `statuette` (âge 1) demande du silex (âge 2, Rivière) ; `docs/A-FAIRE.md` annonce `engine.js` à 4 600 lignes (4 842).
- `passPour` ne rappelle pas `avancerAge` : entre le dernier versement et la vérification suivante (≤ 1,5 s), l’objectif peut afficher un objet d’un âge trop loin.
- Sauvegarde volontairement corrompue (`exp.done.collines = true`) : exception dans `nextExp`/fouilles (2 cas sur 600 mutations) ; ne concerne que des fichiers édités à la main.
- Les textes de 0.21 écrivent « même quand le jeu est fermé » (extracteurs) alors que `docs/STYLE.md` déconseille ce calque ; avis de style, non vérifié ailleurs.

## 3. Ce qui a été vérifié et tient

- **Recettes, ingrédients, accès.** 259 objets : aucune référence inconnue (matières, stations, règles, passages, explorations, projets) ; aucune recette de plus de 3 ingrédients ; clés de recette uniques (le moteur lève sinon). Point de fixpoint d’atteignabilité (`an2.js`) : tous les objets non secrets sont atteignables ; les seuls hors d’atteinte sont les curiosités (la poudre rouge se tire au hasard en récoltant la pierre), les reliques, la résonite et `diapason` / `cristal_chantant` (chemin caché).
- **Stations et chaleur.** Seize stations ; les seuils (400, 600, 1 100, 1 300, 1 700, 3 000, 3 500, 50 000 °C ; `marteler` 2) sont tous fournis par une station atteignable.
- **Guidage.** Bot qui ne suit que le guide, ressources infinies dans les terres ouvertes : 73 objectifs sur 73 terminés, aucune étape hors d’âge, aucun blocage (`guide1.js`). Avec fabrications anticipées aléatoires (25 parcours) : 25 terminés ; seule anomalie, la fenêtre de 1,5 s décrite en C-16.
- **File de commandes et Domaine.** 60 + 60 parcours aléatoires (commandes, annulations, sauvegarde / chargement, hors ligne, pose, amélioration, pause d’extracteurs) : aucun stock négatif ni NaN, aucun extracteur posé en plus de ceux possédés ; une annulation immédiate rend tout (sauf C-06).
- **Sauvegarde.** 600 sauvegardes mutées (types, valeurs extrêmes) : 597 chargées et jouées sans erreur, 1 refusée proprement (« Ce n’est pas une sauvegarde d’Éclat »), 2 exceptions (C-16) ; une version plus récente que le jeu bloque l’écriture au lieu d’écraser (`U.saveLocked`). Cloud : chiffrement côté client, trois emplacements, conflits détectés, avertissement « mot de passe oublié = copies en ligne perdues » présent ; 14 tests du serveur passent.
- **Hors ligne.** Production, commandes et machines identiques en ligne et hors ligne (C-08).
- **Tests du dépôt (sauf C-02).** `test.js` 217 réussis (qui inclut visiteurs, figures, arbre, densité, Carnet), `test-recit` 60, serveur 14, `test-ux` 480 contrôles.
- **Migration 0.20 → 0.21.** Les quatre recettes modifiées (`moteur_vapeur`, `plastique`, `resine`, `caoutchouc`) sont toutes couvertes par `INPUTS_020` ; les commandes anciennes finissent aux anciens ingrédients ; une nouvelle commande ne se fusionne pas avec un lot ancien.

## 4. Courbe de progression pour des joueurs occasionnels

**Premier cycle** (`node tools/sim-parcours.js --graines 3 --minutes 40`, 8 s par essai) : relève obligatoire à **12,4 min** de jeu actif avec le guide (9,5–13,3), 71 essais en moyenne, 11 recettes connues ; 5,8 min si le joueur trouvait chaque énigme du premier coup. Deuxième cycle : Plaine franchie en 1,7 min ; Rivière à **36 min** après la relève sans achat de Mémoire (26 min avec Mains calleuses), soit 49 min depuis le début de la partie.

**Passages, types de joueur** (`node tools/sim-passages.js --joueurs --minutes 240`, sans Mémoire, recettes connues) — temps **écoulé** (jeu + absences) :

| Passage | tapeur (4 appuis/s) | veilleur (5 min / 4 h) | explorateur (20 min / 8 h) | paresseux (3 min / 12 h) |
|---|---:|---:|---:|---:|
| Plaine | 6 min | 4 h 05 | 10 min | 24 h |
| Rivière | 17 min | 8 h 11 | 8 h 21 | 36 h |
| Collines | 34 min | 20 h 25 | 16 h 40 | 144 h (6 jours) |
| Profondeurs | 55 min | 32 h 40 | 25 h | 193 h |
| Désert | 62 min | 40 h 50 | 25 h | 217 h |
| Gisement Noir | 96 min | 69 h | 58 h | **626 h (26 jours)** |
| Pics | 135 min | 90 h | 84 h | — |

Lecture. Le profil « paresseux » (séances de 3 min, absences de 12 h, donc deux séances par jour) franchit les Collines en 6 jours et le Gisement Noir en 26 jours ; le frein n’est pas le temps d’attente mais le **temps actif** (157 min pour le Gisement contre 97 pour le tapeur) : poser et améliorer les extracteurs, lancer les commandes (8 au maximum). Hors ligne, il ne progresse que sur ce qu’il a déjà posé.

**Faucets de Traces à connaître** (hors passages) : jour de présence (+1, et jusqu’à +20 aux paliers ; ≈ 144 Traces sur 100 jours), rituel « Façonnage des mains » (`max(2, ⌊1,5 × (âge+1)⌋)` Traces pour `10 × (âge+1)` objets faits à la main), rituel « Moisson » (+1 Trace et `25 × (âge+1)` écus), demandes du Troqueur, conversion des écus (C-03). Au début d’une partie, les faucets quotidiens (≈ 4 Traces par jour) dépassent les 2 Traces du premier passage ; aux âges élevés, le rituel des mains donne 22 Traces par jour pour 150 objets fabriqués. Les Traces ne se dépensent qu’à la relève : un joueur qui ne relève pas les accumule sans effet.

**Avis de conception.**
- La relève obligatoire à ~12 min efface le monde après la première démonstration de progrès ; elle est expliquée en chiffres et précédée d’une copie de secours, mais le bouton unique « Passer le relais » ne laisse pas le choix du moment (fenêtre persistante). À réévaluer au test à 5 joueurs prévu par le plan.
- Les deux mondes de rythme coexistent mal : passages (murs de plusieurs heures actives) et Traces (faucets quotidiens et Comptoir) ne sont pas calibrés l’un sur l’autre (C-03, C-04).
- Le plafond hors ligne de 12 h (C-08) et la file de 8 commandes limitent ce qu’une séance courte peut préparer ; l’« ordre en chaîne » (⚡) compense en partie.
- Le Gisement Noir (âge 10) marque la première vraie discontinuité de temps actif pour un joueur lent : à surveiller aux tests humains.

## Annexe A — Scripts et commandes

Tous dans `/tmp/claude-0/-home-user-craftgame/1a6f038d-ce05-5623-b5ea-df868e4ec413/scratchpad/` (`h.js` : amorce commune ; `wt/` : commit 4a76184 ; `wt20/` : 0.20.1).

| Constat | Commande |
|---|---|
| C-01 | `node twotabs.js` |
| C-02 | `cd wt && npm test` ou `node tools/build.js --check` |
| C-03 | `node faucet.js` (un extracteur laissé en route) ; `sh sim-potentiel-ecus.sh` (inventaire du bot, 0.20 et 0.21) ; `node t5.js` (valeurs, ventes de masse) |
| C-04 | `node asks.js` ; `node asks2.js` |
| C-06 | `node phantom.js` ; `node phantom4.js` ; `node phantom6.js` |
| C-07 | `node legacy7c.js && node legacy7d.js` (partie 0.20 naturelle à la Vapeur) ; `node t2.js && node t3.js` (commandes 0.20 en cours) |
| C-08 | `node offeq.js` ; `node offeq2.js` |
| C-09 | `node thermo2.js` |
| C-10 | `node t5.js` (partie DECHIFFRER dans le texte) ; `dump_end.json` (partie de fin du bot) |
| C-11 | `node ruins.js` |
| C-12 | `node wt/tools/sim-passages.js --joueur tapeur --minutes 900` ; `node wt/tools/sim-passages.js --joueurs --minutes 240` |
| C-15 | `node guide1.js` |
| §3 | `node an2.js` (atteignabilité), `node fz1.js`…`fz4.js` (fuzz), `node savefuzz.js`, `node guide2.js` |

## Annexe B — Faits chiffrés repris

- Passages (Traces) : plaine 2, rivière 3, collines 5, mine 8, désert 12, gisement 18, pics 27, orbite 40, lune 60, mercure 90 = 265.
- Mémoire des mains, coût total par colonne : récolte 1 748, mains 339, extracteurs 2 462, machines 3 931, chemins 1 062, paquetage 23, raccourci 21, coup d’œil 749, longues nuits 124 = 10 459.
- Coût brut des passages (unités de matières premières) : plaine 720 ; rivière 14 580 ; collines 50 880 ; profondeurs 72 960 ; désert 85 800 ; gisement 22 750 ; pics 52 470 ; orbite 67 200 ; lune 156 300 ; mercure 266 500.
- Recettes par geste : assembler 136, tailler 17, chauffer 22, tresser 7, marteler 8, usiner 8, allier 4, graver 4, synthétiser 4, stratifier 4, tremper 3, électriser 3, transmuter 3.
