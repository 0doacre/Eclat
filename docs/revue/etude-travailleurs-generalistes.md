# Étude : des travailleurs généralistes par métier (version 2)

Idée du porteur du projet (31 octobre 2026), précisée après la première version : **les ouvriers de chaque métier fabriquent de tout, en permanence, comme la récolte dans les Terres, jusqu'à un seuil que le joueur fixe** ; uniquement les recettes connues ; les travailleurs portent le nom du métier ; **ils parlent au joueur** (« Patron, j'ai fait 40 cordes pendant votre absence », « Patron, nous manquons de bois ! », « Nous allons bientôt manquer de pierres », avec un portrait) ; et il faut un moyen **d'identifier et de résoudre vite les goulots**.

Ce document décrit le modèle, ses règles, ses cas limites et la façon de le mesurer. Il ne change aucun code. Le problème des gestes partagés entre métiers a son propre document : [probleme-gestes-metiers.md](probleme-gestes-metiers.md).

## 1. Ce qui existe aujourd'hui

- Un travailleur (apprenti, ouvrier, machine) est une entrée du parc `machPool`. `assignWorkers()` l'affecte d'abord aux **commandes** du joueur, puis, s'il reste libre, à une **cadence** (`assignCadenceWorkers()`).
- Une **cadence** est un ordre permanent par recette (« garde 100 manches », `S.dom.cadence[recette] = { cap, on }`), exécuté par `runCadences()` tant que le stock est sous la cible et que les ingrédients sont là. Il faut en régler une par recette : c'est la gestion que l'idée supprime.
- Garde-fous existants : la recette est **connue et fabriquée une fois à la main** (`D.COMMANDES.firstByHand`), ni unique ni à échelle (`E.automatable`) ; l'énergie (0.44) ralentit déjà les travailleurs ; les commandes passent avant.
- La Réserve **n'a pas de capacité** : le stock d'une matière n'est pas borné. Cela compte pour la définition du seuil (§3).

## 2. Ce qu'il y a à produire, par métier (mesuré)

| Métier | Recettes | Composants (utiles) | Constructions | Outils |
|---|---|---|---|---|
| Artisanat | 23 | 13 (12) | 0 | 9 |
| Construction | 75 | 0 | 75 | 0 |
| Élevage | 8 | 5 (4) | 0 | 3 |
| Chimie et matériaux | 17 | 16 (14) | 1 | 0 |
| Métallurgie | 41 | 33 (33) | 0 | 8 |
| Centrales | 31 | 16 (14) | 12 | 3 |
| Électronique | 20 | 8 (8) | 10 | 2 |
| Arts et lettres | 4 | 2 (2) | 2 | 0 |

- Les travailleurs fabriquent des **composants** (ce qui sert d'ingrédient à une autre recette) : la matière des autres recettes. Ils ne fabriquent pas de bâtiments, de machines, d'extracteurs ni d'outils « en continu » : ce sont des décisions du joueur, souvent chères ou uniques.
- **Construction** n'a aucun composant : voir §8.

## 3. Le modèle : produire en continu jusqu'au seuil

**Chaque métier a un seuil**, que le joueur fixe sur l'écran du métier : 10 %, 20 %, 30 % … 100 %. Les travailleurs fabriquent **toutes les recettes connues du métier**, chacune tant que son stock reste **sous le seuil**, puis s'arrêtent sur cette recette. Même mécanique que la récolte : « ça tourne tant que ce n'est pas plein ».

### Que veut dire « % » ?
La Réserve n'a pas de capacité, donc un pourcentage n'a pas encore de référence. Deux façons de lui en donner une :
- **(a) Un stock de confort par composant** (valeur de référence, 20 au départ, ×1,5 par âge, plafonné à 200 ; affichée sur la fiche du composant). Seuil 30 % = on s'arrête à 30 % de ce stock de confort. **Simple, rien de nouveau dans la Réserve.** Recommandé.
- **(b) Une vraie capacité de Réserve** (entrepôts qui la font monter, par matière ou globale). Plus riche : elle crée un goulot de plus et un objet à construire, mais elle change tout l'équilibre et l'affichage. À étudier plus tard.

### Consignes facultatives
Le seuil règle *combien*. Deux consignes règlent *quoi d'abord*, au choix du joueur :
- **Priorité : X** : une recette du métier passe en tête (elle monte jusqu'à son seuil avant les autres).
- **Objectif** : les composants de la chaîne de l'objectif en cours passent en tête (la torche : manche, charbon…). Jamais l'objet final : c'est au joueur de le fabriquer.

Par défaut : aucune consigne, tout avance à la même vitesse sous le seuil.

### Qui travaille sur quoi
Un travailleur libre choisit une cible de son métier : priorité, objectif, puis le reste. Dans un même niveau, le choix **tourne** (toutes les 20 s de jeu), pour que même un seul apprenti fasse avancer plusieurs recettes. À plusieurs, ils se répartissent sur les cibles les moins servies (déjà le cas pour les cadences).

### Responsabilité du joueur
Décision du porteur du projet : **c'est au joueur de bien calibrer.** Les travailleurs ne s'arrêtent pas d'eux-mêmes parce que l'objectif a besoin de la matière ; en revanche, ils **parlent** (§5) pour dire qu'ils en manquent. Un seul garde-fou technique : un travailleur ne prend pas ce que les **commandes en cours** de la file ont déjà réservé.

## 4. Les noms

| Métier | Apprenti | Ouvrier |
|---|---|---|
| Artisanat | apprenti artisan | artisan |
| Élevage | apprenti éleveur | éleveur |
| Métallurgie | apprenti forgeron | forgeron |
| Chimie et matériaux | apprenti chimiste | chimiste |
| Centrales | apprenti centralier | centralier |
| Électronique | apprenti électronicien | électronicien |
| Arts et lettres | apprenti copiste | lettré |
| Construction | apprenti bâtisseur | bâtisseur |

Les machines gardent leur nom. `D.TRAVAILLEURS` gagne un nom par métier et par rang.

## 5. La voix des travailleurs

Les travailleurs **s'adressent au joueur** (« Patron ») dans une courte carte, avec un portrait. Inspirations : les conseillers d'Anno, les messages des habitants de Frostpunk.

| Quand | Exemple | Déclencheur |
|---|---|---|
| Retour d'absence | « Patron, j'ai fait 40 cordes pendant votre absence. » | à la reprise après plus de 5 minutes d'absence : le total fabriqué par métier (compte tenu des `catchUp`) |
| Manque | « Patron, nous manquons de bois ! » | un travailleur est resté à l'arrêt plus de 30 s faute d'un ingrédient |
| Prévision | « Nous allons bientôt manquer de pierres. » | la consommation nette (`E.flows`) viderait le stock en moins de 5 minutes |
| Seuil atteint (facultatif) | « Patron, les cordes sont à leur seuil. » | une première fois par recette |

Règles pour ne pas lasser : une carte à la fois, 10 minutes minimum entre deux messages du même genre sur la même matière, jamais pendant une fenêtre ouverte (même file d'attente que `js/fenetres.js`), un historique des derniers messages dans la page du métier.

**Portraits** : un placeholder par métier. Le jeu a déjà le pictogramme de personne et la bibliothèque game-icons.net (CC BY 3.0, déjà créditée) : on commence par là, sans rien télécharger ; l'illustration définitive viendra après. Si tu veux un placeholder plus soigné, je peux chercher une image libre de droits (CC0) et noter sa source dans les crédits : à toi de me le demander.

**Compteur de production hors ligne** : le moteur doit tenir le total fabriqué par recette entre deux visites (champ non sauvegardé si le message est lu à la reprise, sinon un petit `S.equipe.journal` borné).

## 6. Les goulots : les voir et les résoudre vite

Un goulot, c'est un travailleur, une commande ou une cadence qui n'avance pas, et **la cause**. Le jeu sait déjà dire « manque X » (`E.cadences()` donne `miss`, `status`) ; il ne dit pas **pourquoi X manque** ni **quoi faire**.

### Où
- Une pastille sur l'onglet **Atelier** quand il y a au moins un goulot (comme pour les autres alertes).
- En tête de la page des ateliers : **« Goulots · 2 »**, un bandeau qui s'ouvre sur la liste (l'actuel « Ce qui tourne » devient « Ce qui tourne et ce qui bloque »).
- Sur la page d'un métier : ses goulots, avec les messages des travailleurs.

### Ce que dit chaque ligne
Une cause, remontée jusqu'à la racine, et **un bouton qui la règle** :

| Cause racine | Ce que dit la ligne | Bouton |
|---|---|---|
| Matière brute sans extracteur | « Manque du bois : aucun extracteur » | **Construire un extracteur de bois** (envoie le chantier aux bâtisseurs) |
| Matière brute, extracteur trop lent | « Le bois part plus vite qu'il ne se récolte (−12/min) » | Ajouter un extracteur · baisser le seuil |
| Composant d'un autre métier | « Manque de la plaque de fer (Métallurgie) : personne n'y travaille » | **Embaucher un forgeron** · **Prioriser la plaque de fer** |
| Recette jamais faite à la main | « Tu n'as jamais fabriqué le charbon : les ouvriers ne peuvent pas » | **Le fabriquer une fois** (ouvre la commande) |
| Énergie | « L'énergie manque : les ateliers tournent à 60 % » | Construire une source d'énergie |
| Seuil atteint | « Les cordes sont au seuil » | Monter le seuil |

L'ordre de la liste : ce qui bloque l'objectif d'abord, puis ce qui bloque le plus de monde, puis le reste.

Techniquement : une fonction `E.goulots()` (lecture seule) qui parcourt les cadences, les ordres et les travailleurs et qui descend chaque ingrédient manquant jusqu'à sa racine (extracteur absent, métier sans travailleur, recette non connue, énergie). C'est un calcul sur l'état : **rien de plus dans la sauvegarde**.

## 7. Données et sauvegarde

- `S.ateliers[métier]` gagne `seuil` (10 à 100, défaut 30), `mode` (`"aucune"`, `"priorite"`, `"objectif"`) et `prio` (recette). `migrerAteliers` les remet d'aplomb.
- Les cibles (« tout », « objectif ») sont **calculées**, jamais enregistrées.
- Sauvegardes existantes : les travailleurs embauchés se mettent à produire au seuil de 30 % au premier chargement (changement voulu).
- Les cadences explicites restent, rangées dans un panneau « Réglages avancés », et passent avant le reste.

## 8. Le métier du bâtiment (Construction)

Le porteur du projet se demande s'il faut une branche de constructeurs : **elle existe déjà depuis la 0.43** (Construction : 75 recettes, geste « Construire » : extracteurs, machines, installations, améliorations). Elle n'a simplement pas encore de rôle propre, et c'est ce qu'il lui manque :

- Ses travailleurs, les **bâtisseurs**, ne fabriquent pas « tout en continu » (les constructions sont chères, souvent uniques) ; ils **exécutent des chantiers décidés par le joueur**.
- Un **chantier** est une construction que le joueur valide d'un geste (depuis un goulot : « Construire un extracteur de bois », ou depuis la liste du métier). Les bâtisseurs la réalisent, en un temps qui dépend de leur nombre, et dépensent les ressources à ce moment-là.
- Plus de bâtisseurs et de machines de chantier = des chantiers plus rapides ; l'énergie s'applique aussi.
- Sans cette règle, des bâtisseurs automatiques risqueraient de dépenser les ressources du joueur sans qu'il l'ait voulu.

Cela donne à Construction un rôle clair (« je décide, ils bâtissent ») et relie les goulots à une action (« Construire un extracteur » est un bouton qui met les bâtisseurs au travail).

## 9. Cas limites

| Cas | Comportement proposé |
|---|---|
| L'objectif n'est pas une fabrication | la consigne « objectif » ne fait rien |
| Recette jamais faite à la main | ignorée ; le goulot le dit |
| Plusieurs métiers demandent le même ingrédient | premier arrivé, premier servi |
| Stock au seuil | le travailleur passe à une autre recette ; si tout est au seuil, il s'arrête |
| Hors ligne | `catchUp` rejoue la même affectation (à tester) ; le retour affiche le message « pendant votre absence » |
| Énergie à 50 % | travailleurs à moitié vitesse (déjà en place) |
| Renvoyer un travailleur | il quitte le parc ; seuil et consigne restent au métier |
| Joueur qui ne veut aucune production automatique | seuil à 0 % (à ajouter à l'échelle : 0, 10 … 100) |

## 10. Mesurer avant de jouer

Les joueurs automatiques de `tools/sim-passages.js` n'embauchent personne. Avant le code :
1. un profil « employeur » qui embauche un apprenti puis un ouvrier par métier dès que possible ;
2. un interrupteur `D.TRAVAILLEURS.generalistes` pour comparer le même joueur avec et sans ;
3. critères : les passages n'avancent pas de plus de 10 % (sinon : seuils plus bas ou apprentis plus lents) ; la Réserve n'est jamais vidée de ce que réservent les commandes ; le mode objectif ne fabrique jamais l'objet final.

## 11. Plan (dans l'ordre)

1. **Les noms** (texte, sans risque).
2. **Le seuil et la production continue** (modèle §3, sans consigne), derrière l'interrupteur, avec le profil employeur et la simulation.
3. **La voix** : retour d'absence, manque, prévision ; carte et historique.
4. **Les goulots** : `E.goulots()`, bandeau, pastille, boutons de résolution.
5. **Les chantiers** des bâtisseurs.
6. **Les consignes** priorité et objectif.
7. **Le filtre par métier au Labo** (voir le document des gestes), en parallèle des étapes 2 à 4 : il rend le métier lisible, ce dont tout le reste dépend.

## 12. Décisions prises et questions restantes

Décisions du porteur du projet : production continue jusqu'à un seuil fixé par le joueur ; recettes connues seulement ; pas d'arrêt automatique au profit de l'objectif (le joueur calibre) ; une priorité reste dans le métier ; les travailleurs parlent ; il faut un système de goulots.

Réponses (31 octobre 2026) :
1. **Le % du seuil** : (a), le stock de confort par composant. Le porteur du projet a proposé un ratio lié à la production des matières premières ; plus complexe, il est gardé pour plus tard, une fois (a) testé (le stock de confort pourrait alors se calibrer sur la production plutôt que sur l'âge).
2. **Les consignes priorité et objectif** : gardées comme options, à tester (étape 6).
3. **Les bâtisseurs** : oui, des chantiers que le joueur valide.
4. **La voix** : une voix par métier.
5. **Les portraits** : placeholders libres de droits. Les packs gratuits trouvés sont médiévaux (CC0 : Medieval Citizens Vol.1 sur OpenGameArt, Medieval Painterly Avatars sur itch.io) et ne couvrent ni l'électronique ni l'espace : pour l'instant, un pictogramme par métier (game-icons.net, déjà crédité), à remplacer métier par métier.

Avancement : l'étape 1 (les noms) est faite en 0.50.2 (`D.TRAVAILLEURS.noms`, `Atel.nom(métier, genre)`), l'étape 2 (seuil et production continue) en 0.51.0 (`E.seuilAtelier`, `E.autoEtat`), l'étape 3 (la voix) en 0.52.0 : `E.voix(heure)` rend les nouveaux messages (retour d'absence, manque après 30 s, prévision sous 5 minutes ; 10 minutes entre deux messages du même sujet), `D.VOIX` porte les phrases par métier et le découpage des planches, `S.equipe` garde ce qui a été fabriqué et les 20 derniers messages. L'étape 4 (les goulots) est faite en 0.53.0 : `E.goulots()` (lecture seule, regroupe par métier les « jamais fabriqué » et les « personne n'y travaille », une ligne par matière brute sans extracteur, le seuil à 0 et l'énergie), bandeau « Goulots · N » sur la page des ateliers, liste « À débloquer » sur la page du métier, pastille sur l'onglet Atelier à chaque nouveau goulot. L'étape 5 (les chantiers des bâtisseurs) est faite en 0.54.0 : un chantier est une construction à prix croissant que le joueur met dans sa file (`E.order`) ; les bâtisseurs de Construction l'exécutent (`machReadyFor`), seulement si elle a été construite une fois à la main ; le goulot « aucun extracteur » lance le chantier d'un clic. Reste de l'étude : l'ordre « ce qui bloque l'objectif d'abord » et le bouton « Construire un extracteur » (chantiers des bâtisseurs, étape 5). Les portraits sont les planches de `assets/travailleurs/`, découpées en CSS selon l'échelon du métier (placeholders).
