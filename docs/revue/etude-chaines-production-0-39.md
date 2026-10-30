# Étude : les chaînes de production (0.39)

Demande du porteur du projet, 30 octobre 2026 : « une construction en continu, dans l'idée d'avoir des chaînes de production, à la Anno mais simplifié : telle machine extrait telle ressource, telle machine utilise cette ressource pour l'objet 1, une autre pour l'objet 2, une troisième utilise les objets 1 et 2 pour construire l'objet 3, de façon très automatisée mais simple ». Ce document décrit ce que le moteur fait déjà, ce que font les autres jeux, quatre directions, et ce que je recommande. Il ne change aucun code du jeu. Conventions de `docs/STYLE.md`. Marques : **[M]** mesuré dans le dépôt, **[S]** source lue aujourd'hui, **[Mém]** de mémoire, non vérifié.

## 0. Limites de l'étude

- La recherche web est mince sur ce sujet. Trois requêtes : les ratios d'Anno 1800 (guides de joueurs, pas de source officielle), les jeux mobiles d'usine sans tapis (les résultats sont des fiches de boutique), les outils de diagnostic de Factorio et Dyson Sphere Program (des mods, pas les jeux). Ce que je dis de Factorio, de Satisfactory et de Kittens Game vient de ma mémoire.
- Les chiffres du chapitre 2 viennent d'un script du dépôt, `tools/etude-chaine.js`, qui calcule une chaîne à partir des vraies données. Il suppose pour chaque étage la machine **la plus modeste** capable de la recette (`E.machFor`) : un joueur qui possède de meilleures machines en aurait moins besoin. Ce sont des ordres de grandeur, pas des mesures de partie.

## 1. Ce que tu demandes, relu

Un joueur qui **voit et pilote une chaîne** : des étages reliés (extraire, transformer, assembler), chacun avec ses machines, qui tournent sans lui. Trois choses distinctes se mêlent dans ta phrase :
1. **Voir** : lire d'un coup d'œil qui fait quoi, combien, et où ça coince.
2. **Viser** : dire « je veux ça, à cette cadence » et que le jeu monte la chaîne.
3. **Affecter** : que « telle machine fasse l'objet 1 » soit une vraie décision, pas une illusion.

## 2. Ce que le moteur fait déjà [M]

- **Extracteurs** : affectés à un gisement d'une terre (`E.domExt`). Une commande qui attend une matière brute pose d'elle-même les extracteurs libres de la bonne terre (`pullOrderInputs`). Les extracteurs sont très puissants : pour 90 minerais par minute, 0,5 foreuse suffit. **Ils ne sont jamais le goulot.**
- **Machines** : cinq paliers (automate de bois, de bronze, presse à vapeur, ligne d'assemblage, assembleur moléculaire), qui acceptent 1, 2 puis 3 ingrédients distincts, de plus en plus vite (6, 15, 40, 120, 600 par minute). Elles forment **un parc commun** : à chaque instant, chaque machine libre prend une étape qu'elle sait faire dans les commandes en cours, puis dans les **cadences** (maintien d'un stock cible, `E.setCadence`).
- **Planificateur** : `E.plan` déroule l'arbre d'une recette jusqu'aux matières brutes. Une commande fabrique tous les intermédiaires, en parallèle, avec les mains et les machines libres.
- **Lecture** : `E.flows` donne, par matière, ce que les machines produisent et consomment ; `E.production` y ajoute les extracteurs ; `E.apprentis` et `E.cadences` donnent l'état de chaque ordre permanent (produit, plein, manque une matière, pas de machine).
- **Ce qui a été retiré, et pourquoi.** La refonte 5.0 a retiré les tapis, les ports et les débits : « ils ne marchent pas sur un téléphone, on passe plus de temps à tracer des lignes qu'à jouer ». La 5.7 a retiré les machines **rivées à une recette** : « les régler demande de penser comme un gestionnaire d'usine » (`docs/COMMANDES.md`).

**Ordre de grandeur d'une chaîne** (`node tools/etude-chaine.js`, machines les plus modestes) :

| Objet visé | Étages | Machines | Matières brutes | Extracteurs |
|---|---:|---:|---:|---|
| Lingot d'acier, 30 par minute (âge 7) | 3 | 12 | 2 | moins d'1 par matière |
| Circuit imprimé, 20 par minute (âge 11) | 7 | 8 | 3 | moins d'1 par matière |
| Processeur, 10 par minute (âge 12) | 6 | 15 | 3 | moins d'1 par matière |

Conséquence : **une chaîne tient sur un écran** (3 à 7 étages, une dizaine de machines), et c'est la **machine**, pas l'extracteur, qui limite. La profondeur maximale d'une pièce du jeu est de 7 étages ; la moitié des 93 pièces en ont 3 ou moins.

## 3. Ce que font les autres

- **Anno 1800** [S] : on raisonne en **ratios** de bâtiments (un bûcheron pour une scierie, une argilière pour deux briqueteries), et l'écran de statistiques compare, par bien, **l'offre** (barre verte) à **la demande** (barre bleue) : on agrandit seulement si l'offre est inférieure. Les entrepôts sont **communs à l'île** : un bien stocké ailleurs est utilisable partout. C'est notre Réserve.
- **Factorio, Dyson Sphere Program** [S] : les joueurs ont eux-mêmes ajouté ce qui manquait : une **calculatrice de cadence** au survol d'un bâtiment (Factorio), un **diagnostic de goulot** qui dit pourquoi un assembleur est bloqué (matière absente, énergie, sortie pleine) (Dyson). Le jeu de base le montre peu : c'est le besoin à combler.
- **Les jeux d'usine mobiles** [S] : tous gardent des tapis (Factory Idle, Builderment). Je n'ai trouvé aucun exemple de chaîne sans tapis : on part donc en terrain peu balisé.
- **Kittens Game** [Mém] : un atelier qui fabrique en automatique selon un ratio, sans schéma. Egg, Inc. : pas de chaîne.

Ce que j'en retiens : (a) on pense en **cadence par minute** ; (b) le plus utile est **offre contre demande par bien**, avec **la cause** du blocage ; (c) un stock commun supprime la logistique, c'est déjà notre cas ; (d) les joueurs construisent eux-mêmes les calculatrices : mieux vaut les donner.

## 4. Principes proposés

1. **P1. Réserve commune, aucun transport.** Rien ne se relie à la main.
2. **P2. On pense en cadence par minute**, pas en câblage.
3. **P3. Le joueur dit le but, le jeu monte le plan.** Pas de page blanche.
4. **P4. Un blocage se lit d'un coup d'œil, avec sa cause** : matière absente, machine manquante, stock plein.
5. **P5. Rien à régler pour que ça marche** ; tout est réglable pour optimiser.
6. **P6. Pas de nouvelle sauvegarde si on peut l'éviter** : un plan se recalcule.

## 5. Quatre directions

**C0. Voir (le flux).** Un schéma vertical des étages d'une chaîne qui tourne : extracteur, machines, étage suivant, avec les cadences, le goulot en rouge et sa cause. Alimenté par `E.flows`, `E.production`, `E.apprentis`. Remplace la feuille « Ce qui tourne » actuelle, qui est une liste plate. Coût : **S à M**, aucun changement de règle. Limite : on voit, on ne pilote pas encore.

**C1. Viser (la chaîne visée).** On choisit un objet et une cadence (« 15 lingots d'acier par minute »). Le jeu calcule les étages, le nombre de machines et d'extracteurs voulus (`E.plan` + les vitesses), compare à ce qu'on a, et propose **« Fabriquer ce qui manque »** puis **« Lancer »** : il crée les cadences de chaque étage (`E.setCadence`) avec la bonne cible. Les machines restent un parc commun ; la chaîne n'en réserve pas. Coût : **M à L**, moteur léger (une fonction de calcul pure, testable, plus la création des cadences). Limite : deux chaînes se disputent les mêmes machines ; il faut l'afficher (demande totale contre parc).

**C2. Affecter (les postes).** Comme C1, mais la chaîne **réserve** ses machines : « 4 automates de bois sont à la chaîne Acier ». C'est le retour des machines rivées à une recette, **calculées** par le jeu au lieu d'être réglées à la main. Pour : l'impression « telle machine fait l'objet 1 » est vraie, une chaîne ne vole pas l'autre. Contre : c'est ce que la 5.7 a retiré ; il faut des priorités, des réaffectations, et une migration. Coût : **L à XL**.

**C3. Relier (le graphe).** Le joueur pose des nœuds et trace des liens, avec des tampons. Coût : **XXL** (nouveau moteur, nouvelle interface, nouvel équilibrage). Retire ce que la 5.0 a retiré, pour la même raison : un doigt sur un téléphone.

## 6. Mon avis

**C0 puis C1, et C2 seulement si les tests montrent que les chaînes se volent les machines.**

- C0 est la plus petite chose qui répond à « voir où on en est » ; elle est utile même si on ne fait rien d'autre.
- C1 répond au cœur de ta demande (choisir un but, voir la chaîne montée, la lancer) sans rien de la logistique. Elle est **Anno sans la carte** : les ratios et l'écran offre-demande, sans placer un seul bâtiment.
- C2 est la bonne idée de ta description (« telle machine pour l'objet 1 »), mais c'est la plus chère en règles. À garder si le joueur trouve que ses chaînes se disputent le parc.
- C3 : non.

**Un lien à ne pas rater avec le rythme.** Les passages demandent de gros volumes (le Désert : 3 000 plaques de bronze, 400 roues…). Une chaîne dont l'objet visé est **ce qui manque à un passage** (« Lancer la chaîne pour le passage ») donne à l'automatisation un but concret, et agit sur le ressenti « bloqué » mesuré en Collines et au Désert (`docs/revue/rythme-0-37.md`).

## 7. Ce que ça change dans le jeu

- **Équilibre** : aujourd'hui l'automatisation est libre une fois les machines construites. Avec C1, le nombre de machines devient visible et chiffré (une dizaine par chaîne). Il faut vérifier le coût des machines (progressif, facteur 1,25 à 1,3) et le simulateur doit apprendre à jouer des chaînes (profil « automatiseur » dans `tools/sim-passages.js`).
- **Règle de la première fois à la main** (`D.COMMANDES.firstByHand`) : une chaîne ne peut automatiser que ce qui a été fabriqué une fois. C1 doit le dire (« fabrique d'abord un Lingot de fer »).
- **Interface** : la chaîne visée vit à l'Atelier, à côté de « Ce qui tourne ». Une feuille, pas un nouvel onglet.
- **Sauvegarde** : un plan est recalculé, les cadences existent déjà. Pas de migration pour C0 et C1.

## 8. Étapes proposées

1. **0.40** : C0, le flux avec la cause du blocage (remplace la liste de « Ce qui tourne »).
2. **0.41** : C1 pour une chaîne à la fois, avec le calcul pur `E.planChaine(id, parMinute)` et ses tests ; profil de simulation ; lien avec le passage en cours.
3. **Test de joueurs** : 5 à 8 personnes, avec les mesures « sait dire quelle machine est le goulot », « lance une chaîne sans aide », « se retrouve avec deux chaînes en concurrence ».
4. **Si besoin** : C2 (réservation) en 0.42.

## 9. Questions à trancher ensemble

- **Nom** : « Chaîne », « Filière », « Ligne » ? « Filière » est juste en français et neuf dans le jeu ; « Ligne d'assemblage » existe déjà comme machine.
- **Quand ça apparaît** : dès le Bronze (premiers automates de bronze à 2 ingrédients), ou à la Vapeur ?
- **Plusieurs chaînes en même temps** dès le départ, ou une seule au début ?
- **Réservation (C2)** : tout de suite, ou seulement si on observe le problème ?

## Sources

- [Anno 1800, chaînes de production (wiki)](https://anno1800.fandom.com/wiki/Production_chains?oldid=4475)
- [Anno 1800, échanges et ratios (wiki)](https://anno1800.fandom.com/wiki/Exchange_Ratios)
- [Dyson Sphere Program, mod Bottleneck](https://thunderstore.io/c/dyson-sphere-program/p/starfi5h/Bottleneck/v/1.1.7/)
- [Dyson Sphere Program, mod Rate Monitor](https://thunderstore.io/c/dyson-sphere-program/p/starfi5h/RateMonitor/)
- [Factorio, mod Rate Calculator Tooltip](https://mods.factorio.com/mod/factorio-rate-calculator-tooltip)
- [Builderment (App Store)](https://apps.apple.com/gb/app/builderment/id1558592038)
- [Factory Idle (itch.io)](https://hein-stain.itch.io/factory-idle)
