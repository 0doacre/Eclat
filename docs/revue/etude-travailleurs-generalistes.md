# Étude : des travailleurs généralistes par métier

Idée du porteur du projet (31 octobre 2026) : on embauche des apprentis, des ouvriers et des machines **pour chaque métier** ; ils produisent « un peu de tout » (tout avance, plus doucement qu'à la main), on peut **prioriser** une production, et on peut leur demander de **préparer ce qu'il faut à l'objectif en cours** (pour une torche : des manches, du charbon). Les travailleurs portent le nom du métier.

Ce document décrit le modèle, ses règles, ses cas limites et la façon de le mesurer. Il ne change aucun code.

## 1. Ce qui existe aujourd'hui (le point de départ)

- Un travailleur (apprenti, ouvrier, machine) est une entrée du parc `machPool`. Chaque seconde, `assignWorkers()` l'affecte d'abord aux **commandes du joueur** (la file), puis, s'il reste libre, à une **cadence** (`assignCadenceWorkers()`).
- Une **cadence** est un ordre permanent : « garde 100 manches en Réserve » (`S.dom.cadence[recette] = { cap, on }`). `runCadences()` fabrique tant que le stock est sous la cible et que les ingrédients sont là.
- Il faut donc **régler une cadence par recette**, à la main, pour que l'apprenti serve à quelque chose. C'est la gestion que l'idée supprime.
- Garde-fous existants à conserver : la recette doit être **connue et fabriquée au moins une fois à la main** (`D.COMMANDES.firstByHand`), ni unique ni à échelle (`E.automatable`). L'énergie (0.44) ralentit déjà les travailleurs.
- Le moteur sait déjà lister les pièces d'un objectif (`E.chaineManquante`, `E.guide`, `E.objective`).

## 2. Ce qu'il y a à produire, par métier (mesuré sur les données)

| Métier | Recettes | Composants (utiles à une autre recette) | Constructions | Outils |
|---|---|---|---|---|
| Artisanat | 23 | 13 (12) | 0 | 9 |
| Construction | 75 | 0 | 75 | 0 |
| Élevage | 8 | 5 (4) | 0 | 3 |
| Chimie et matériaux | 17 | 16 (14) | 1 | 0 |
| Métallurgie | 41 | 33 (33) | 0 | 8 |
| Centrales | 31 | 16 (14) | 12 | 3 |
| Électronique | 20 | 8 (8) | 10 | 2 |
| Arts et lettres | 4 | 2 (2) | 2 | 0 |

Deux conséquences :
- « Un peu de tout » ne vaut que pour les **composants utiles** (ce qui sert d'ingrédient à une autre recette). On ne fait pas fabriquer des bâtiments, des machines, des extracteurs ni des outils « un peu de tout » : ce sont des décisions du joueur, souvent uniques ou chères.
- **Construction** n'a aucun composant : ses bâtisseurs n'ont pas de « fond ». Ils ne travaillent que sur **priorité** ou **objectif** (par exemple « construis l'extracteur de l'objectif »), et seulement pour ce que le joueur a déjà construit une fois à la main.

## 3. Le modèle

Chaque métier a **une consigne**, un seul choix à l'écran :

| Consigne | Les travailleurs s'occupent de… |
|---|---|
| **Équilibré** (défaut) | l'objectif en cours *d'abord*, puis un peu de tout |
| **Priorité : X** | X d'abord (une recette du métier, au choix), puis l'objectif, puis un peu de tout |
| **Objectif** | uniquement l'objectif en cours (rien d'autre) |

Dans tous les cas, **les commandes du joueur passent avant** (c'est déjà le cas), et les travailleurs d'un métier ne font que les recettes de **leur** métier.

### Ce que « objectif » veut dire
Pour l'objectif en cours (un objet à fabriquer), on descend la chaîne de ses ingrédients. Les cibles sont les **composants intermédiaires** manquants (jamais l'objet final : c'est au joueur de le fabriquer, ce qui garde la satisfaction et la règle de la première fois à la main). Pour chaque composant : cible = quantité nécessaire à l'objectif, moins ce qu'il y a déjà en Réserve. Exemple de la torche : manche et charbon (la corde si l'objectif la demande plus bas dans la chaîne).

### Ce que « un peu de tout » veut dire
Chaque composant utile connu du métier reçoit une **cible souple** (stock à ne pas dépasser). Quand tous sont à leur cible, les travailleurs ne font plus rien, la Réserve ne se remplit pas indéfiniment. Cibles proposées : 20 au départ, montant avec l'âge du composant (×1,5 par âge, plafonné à 200 ; à régler par la simulation).

### Qui travaille sur quoi
Chaque travailleur libre choisit une cible parmi celles de son métier, dans l'ordre : priorité, objectif, fond. Pour que « tout avance » : à l'intérieur d'un niveau, le choix **tourne** (toutes les 20 secondes de jeu, on décale la liste d'une position), de sorte que même un apprenti seul fait avancer plusieurs recettes au fil du temps. À plusieurs, ils se répartissent sur les cibles les moins servies (le moteur le fait déjà pour les cadences).

### Les garde-fous
1. **Réserve protégée** : un travailleur ne consomme jamais ce dont ont besoin les commandes en cours du joueur et l'objectif ; il laisse en plus un plancher (le plus petit de 10 pièces et de 10 % du stock) sur chaque ingrédient. Les travailleurs ne vident donc pas la Réserve pendant que le joueur planifie.
2. **Première fois à la main** : un travailleur ne fabrique que ce que le joueur a déjà fabriqué (sauf l'écho de fin « retour », qui lève déjà cette règle).
3. **Vitesse** : inchangée (apprenti ½ de la main, ouvrier ×1, machines selon leur marche), multipliée par le facteur d'énergie.
4. **Pas de gaspillage d'écus** : aucune embauche automatique.

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

Les machines gardent leur nom (elles sont communes à tous les métiers). `D.TRAVAILLEURS` gagne un nom par métier et par rang (`noms[métier] = [apprenti, ouvrier]`).

## 5. L'écran

Dans la page d'un atelier (aujourd'hui : « Embaucher un apprenti · 40 écus »), sous l'équipe :

```
Équipe : 2 apprentis forgerons · 1 forgeron
Consigne : [Équilibré] [Priorité ▾] [Objectif]
  ┌ Priorité : Lingot de fer ▾   (liste des composants du métier)
En ce moment : Lingot de fer ×2 · Plaque de fer ×1 · en attente : 1 (manque du charbon)
```

- Un seul choix de consigne par métier (trois boutons exclusifs : des filtres, au sens de la grammaire des boutons).
- « En ce moment » dit ce que font les travailleurs, et pourquoi l'un d'eux attend (ingrédient manquant, énergie).
- Les cadences par recette restent, rangées dans un panneau « Réglages avancés » : on peut toujours imposer « 100 manches ».

## 6. Données et sauvegarde

- `S.ateliers[métier]` gagne `mode` (`"equilibre"` par défaut, `"priorite"`, `"objectif"`) et `prio` (identifiant de recette, ou absent). `migrerAteliers` les remet d'aplomb au chargement.
- Les cibles « objectif » et « fond » sont **calculées, jamais enregistrées** ; seule la consigne l'est.
- Sauvegardes existantes : les travailleurs embauchés se mettent à travailler sur le fond au premier chargement (comportement qui change, voulu).
- Les cadences explicites passent avant le fond et l'objectif (elles sont plus précises).

## 7. Algorithme (esquisse)

```
cibles(métier) =
    [priorité si choisie]                                   cap = priorité : jusqu'à 2 × cible de fond
  + [composants de la chaîne de l'objectif, manquants]       cap = besoin de l'objectif
  + [composants utiles connus, sous leur cible souple]       cap = cible souple  (rien si mode = objectif ; rien pour Construction)
  filtrées : fabriquées une fois à la main, automatisables, ingrédients présents au-delà de la réserve protégée
assignCadenceWorkers : pour chaque travailleur libre → première cible (ordre ci-dessus, tournante dans un niveau) que son rang peut faire
runCadences : inchangé (il fabrique tant que stock < cap)
```

Presque tout se réutilise : seule la **liste des cibles** est nouvelle, le reste (affectation, fabrication, énergie, flux) tourne déjà pour les cadences.

## 8. Cas limites

| Cas | Comportement proposé |
|---|---|
| L'objectif n'est pas une fabrication (explorer, passage) | le mode « objectif » ne fait rien ; en « équilibré », fond seul |
| Une recette de la chaîne n'a jamais été fabriquée | non automatisable : le guide montre déjà comment la débloquer à la main |
| Plusieurs métiers ont besoin du même ingrédient | la réserve protégée s'applique ; premier arrivé, premier servi ; pas de file entre métiers |
| La Réserve est pleine | la cible est atteinte, le travailleur s'arrête |
| Hors ligne | `catchUp` rejoue la même affectation ; à vérifier dans les tests (les cadences y sont déjà prises en compte) |
| Énergie à 50 % | travailleurs à moitié vitesse (déjà en place) |
| Renvoyer un travailleur | il disparaît du parc, les cibles restent (la consigne est du métier) |
| Joueur qui ne veut aucun fond | consigne « Objectif » ; ou aucune embauche |

## 9. Mesurer avant de jouer

Les joueurs automatiques de `tools/sim-passages.js` n'embauchent personne : on ne peut rien conclure sur le rythme aujourd'hui. À faire avant le code :
1. un profil « employeur » : il embauche un apprenti puis un ouvrier par métier dès que c'est possible et que les écus le permettent ;
2. un interrupteur `D.TRAVAILLEURS.generalistes` (vrai/faux) pour comparer le même joueur avec et sans ;
3. critères : les passages ne doivent pas avancer de plus de 10 % (sinon on réduit le fond ou on ralentit les apprentis) ; le mode objectif ne doit jamais fabriquer l'objet final ; la Réserve ne doit jamais tomber sous le plancher à cause d'un travailleur.

## 10. Plan

1. **Les noms** (texte, sans risque) : `D.TRAVAILLEURS` + affichage.
2. **Consigne et fond** : `mode`, `prio`, calcul des cibles, affectation tournante, réserve protégée ; cadences en « réglages avancés » ; écran de consigne.
3. **Objectif** : cibles issues de la chaîne de l'objectif.
4. **Simulation** : profil employeur, comparaison avec / sans, réglage des cibles et des plafonds.
5. **Tests** : nouveaux tests moteur (cibles, protection, rotation, hors ligne, sauvegarde), mise à jour du guide.

## 11. Questions ouvertes pour le porteur du projet

1. **Le fond doit-il s'arrêter quand l'objectif réclame de la matière ?** Proposition : oui (l'objectif passe avant le fond sur les ingrédients).
2. **Une priorité peut-elle viser un objet qui n'est pas dans le métier du travailleur ?** Proposition : non (chaque métier ses recettes) ; le joueur règle la priorité dans le métier concerné.
3. **Cibles du fond** : 20 par composant, montant avec l'âge, ou laissées au joueur composant par composant (réglage avancé) ?
4. **Faut-il montrer ce que les travailleurs « ont fabriqué pendant ton absence »** (un résumé au retour) ? C'est agréable, mais ajoute une fenêtre.
5. **Construction** : veux-tu vraiment des bâtisseurs qui construisent à ta place sur priorité/objectif, ou ce métier reste-t-il sans travailleur automatique ?
