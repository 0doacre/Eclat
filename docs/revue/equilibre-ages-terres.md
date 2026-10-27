# Équilibre des âges et cohérence des terres

Audit du 27 octobre 2026 sur `main`, commit `9ed78d9f190982797902451d3f2ee2eb46d4fbcb`, après fusion de la correction des nouveaux gisements (#121). Aucun prix, âge ou mécanisme du jeu n’a été changé dans cet audit.

## Verdict

La progression principale est techniquement atteignable, mais sa répartition reste irrégulière. Trois points demandent un travail de conception : le Cuivre est trop fugace dans les scénarios mesurés ; le Bronze porte deux ouvertures de terres ; le Désert arrive bien avant l’usage de sa ressource propre. La sortie vers l’espace constitue ensuite un fort palier de production.

Il ne faut pas imposer une terre par âge : l’Acier, l’Électricité et les Composites peuvent avoir une identité fondée sur la transformation, et l’eau, la galène, l’uranium ou le soufre peuvent donner une nouvelle vie aux terres anciennes. En revanche, ces changements doivent être visibles et accompagnés.

## Ce qui a été contrôlé

- Les 15 âges, les jalons obligatoires et leur ordre.
- Les 11 terres principales et leurs 10 passages, les objets-clés, les ingrédients des recettes et des paiements, l’origine et les premiers usages des matières.
- Les ressources révélées par un extracteur dans une ancienne terre.
- Trois scénarios déterministes sur le moteur réel : joueur informé continu, joueur informé avec Mémoire et joueur informé faisant des séances courtes.
- `node tools/validate.js` passe : 261 objets, 228 recettes, 12 terres en comptant le Caveau secret.

Les ingrédients des objets-clés et des paiements des dix passages ne dépendent pas d’une terre située après leur destination. Le contrôle existant des recettes vérifie aussi les stations et les gestes. Cela complète les vérifications précédentes de parcours, sans prétendre valider toutes les voies narratives ou toutes les sauvegardes.

## Correspondance entre âges et terres

La colonne « accès » donne l’âge de l’objet-clé. Le passage doit encore être payé. Les objets de l’âge suivant pouvant être fabriqués en avance, il ne s’agit pas d’une interdiction absolue d’accès avant cet âge affiché.

| Âge | Accès ou territoire concerné | Matière ou changement central | Appréciation |
|---|---|---|---|
| Bois | Lisière → Plaine, par l’épieu | Bois, fibres, cailloux ; peaux et os ensuite | Introduction cohérente |
| Os | Plaine → Rivière, par l’outre | Couture, cuir, os ; argile et silex ensuite | Transition cohérente |
| Pierre | Rivière → Collines, par la pioche de pierre | Tranchants, argile, premières machines | Cohérent ; les briques du passage doivent être guidées |
| Cuivre | Exploitation des Collines | Malachite, cuivre, étain, martelage et creuset | Identité présente, mais seulement 3 jalons |
| Bronze | Collines → Profondeurs **et** Désert | Bronze ; accès au fer et au quartz | Deux ouvertures concentrées dans le même âge |
| Fer | Profondeurs ; Rivière pour le sable | Fer, verre et lunette | Bonne identité, mais aucune ouverture après le Bronze |
| Acier | Terres déjà ouvertes | Haut-fourneau, trempe, usinage | Cohérence technique satisfaisante |
| Vapeur | Retour à la Rivière | Pompe, eau, chaudière, moteurs | Retour économique pertinent à rendre visible |
| Électricité | Terres déjà ouvertes | Dynamo, radio, four à arc | Bonne transition technique |
| Atome | Retour aux Profondeurs et aux Collines | Uranium, galène, plomb, combustible | Cohérent si les nouveaux gisements sont signalés |
| Silicium | Désert → Gisement Noir, par la sonde | Premier usage du quartz en fabrication, électronique | Le quartz a attendu six âges ; retour au Désert peu préparé |
| Polymères | Gisement Noir → Pics Fracturés | Pétrole, chimie, soufre, aluminium et titane | Âge dense, avec une nouvelle terre puis plusieurs nouvelles matières |
| Composites | Pics → Orbite, par la fusée | Fibre de carbone, résine, composites | Fort changement d’échelle des volumes de production |
| Spatial | Orbite → Lune → Mercure | Débris, hélium 3, régolithe | Enchaînement cohérent, coûts à suivre avec l’automatisation |
| Stellaire | Exploitation de Mercure et Grands Œuvres | Métal de Mercure, matériaux avancés | La fin dépend du projet choisi ; non couverte entièrement par les trois simulations |

### Le Désert est le décalage principal

Le chariot est d’âge Bronze. Le quartz est lui aussi affiché d’âge Bronze, mais son premier usage dans une recette est le silicium, six changements d’âge plus loin. Le sable existe déjà à la Rivière. Le Désert apporte bien des lieux narratifs, des extracteurs et une autre capacité de production de sable, mais il n’apporte pas de matière immédiatement indispensable au Fer.

Le verre et les briques réfractaires utilisent le sable de la Rivière ; la lunette peut donc être obtenue sans matière propre au Désert. Pourtant, ouvrir ce dernier est obligatoire pour terminer les jalons du Bronze. C’est un verrou de progression géographique davantage qu’une nécessité technique à ce moment précis.

La correction #121 a rendu l’ordre des jalons conforme à l’âge actuel du chariot. Elle ne constitue pas à elle seule un rééquilibrage : **une solution plus naturelle pourrait être de rattacher le chariot et le Désert au Fer**, après le verre et la lunette. L’Observatoire du Désert demande déjà cette lunette. Cela déplacerait un passage hors du Bronze et relierait mieux le récit de la terre au moment où le joueur l’atteint. L’effet sur les durées et les parties existantes resterait à tester avant toute modification.

Ce déplacement ne suffirait pas à donner un usage immédiat au quartz : il faudrait aussi choisir entre un usage précoce raisonnable, ou une présentation explicite de ce minerai comme réserve pour une technique future. Éviter d’encourager deux niveaux de carrière de quartz avant d’expliquer son intérêt.

## Mesures de rythme

Ces chiffres sont des **minutes de jeu actif simulé**, pas des durées promises à un joueur. Les recettes sont connues. Le scénario sans mémoire n’est donc pas le véritable premier parcours avec recherche des recettes et relève obligatoire. Le bot emploie les commandes du moteur et paie réellement les passages ; il ne déploie pas une usine optimisée. Le scénario Mémoire possède `recolte=2, extr=2, mains=2`. Celui du veilleur fait cinq minutes de jeu, puis quatre heures d’absence.

| Âge | Sans Mémoire, continu | Avec Mémoire, continu |
|---|---:|---:|
| Bois | 5,9 | 0,8 |
| Os | 11,7 | 6,0 |
| Pierre | 17,4 | 6,6 |
| Cuivre | **1,1** | **0,1** |
| Bronze | **23,9** | **16,0** |
| Fer | 4,5 | 2,9 |
| Acier | 3,7 | 3,5 |
| Vapeur | 5,3 | 4,8 |
| Électricité | 3,4 | 3,8 |
| Atome | 4,8 | 3,5 |
| Silicium | 16,6 | 11,4 |
| Polymères | 41,7 | 25,2 |
| Composites | **Encore en cours après 220 min dans cet âge** | 70,4 |
| Spatial | Non atteint dans les 360 min simulées | Encore en cours après 85 min dans cet âge |
| Stellaire | Non atteint | Non atteint |

Les différences ne se réduisent pas à un multiplicateur : le bot change ses investissements selon leur rentabilité. Un âge peut donc prendre un peu plus longtemps avec Mémoire. Ces valeurs ne doivent pas être utilisées pour régler tous les âges à une durée uniforme.

### Jalons géographiques

Temps cumulé de jeu actif depuis le début du scénario ; « — » signifie non atteint dans l’horizon simulé.

| Terre ouverte | Sans Mémoire, 360 min | Avec Mémoire, 240 min | Veilleur, 120 min actives |
|---|---:|---:|---:|
| Plaine | 5,8 | 0,8 | 5,1 |
| Rivière | 17,5 | 6,7 | 10,6 |
| Collines | 33,9 | 13,1 | 25,0 |
| Profondeurs | 55,3 | 21,5 | 40,3 |
| Désert | 59,7 | 29,3 | 48,4 |
| Gisement Noir | 97,9 | 59,0 | 88,7 |
| Pics Fracturés | 131,9 | 78,6 | 100,0 |
| Orbite | — | 141,7 | 115,0 |
| Lune | — | — | — |
| Mercure | — | — | — |

Dans le scénario sans Mémoire, les Profondeurs et le Désert ne sont séparés que de 4,4 minutes ; viennent ensuite 38,2 minutes avant la nouvelle terre. Ce contraste explique davantage le rythme géographique que le seul nombre de recettes.

Le veilleur atteint l’Orbite après 115 minutes actives, réparties sur environ quatre jours d’horloge. Son avantage tardif vient des ressources produites pendant les absences ; ce n’est pas une progression de 115 minutes consécutives.

### Le palier des Composites doit être vérifié avec une usine

La fusée consomme directement ou via ses boucliers **460 composites**, puis la Rampe en demande **900 supplémentaires** : au moins 1 360 avant le passage orbital, sans compter les autres constructions. La Lune redemande ensuite 2 700 composites pour son passage.

Dans le scénario sans Mémoire, le bot entre aux Composites vers la minute 140, fabrique la fusée vers 262,5, et n’a toujours pas ouvert l’Orbite à 360 : 462 composites restent à fournir. Avec Mémoire, la fusée arrive vers 108,8 et l’Orbite vers 141,7. Le ralentissement existe bien dans ce modèle.

Cependant, le bot n’investit pas dans une usine optimisée. L’ancien `tools/sim.js` donne des durées beaucoup plus courtes, mais il ouvre gratuitement les passages : ses résultats ne prouvent donc pas que ces coûts sont équilibrés. Avant de baisser les prix, mesurer un scénario qui fabrique, pose et utilise réellement les machines et les compare à leur coût de construction. Le jeu doit préparer ce changement d’échelle en guidant l’automatisation avant la fusée.

## Priorités recommandées

1. **Revoir Bronze → Fer → Désert.** Examiner le rattachement du chariot au Fer, plutôt qu’ajouter encore du temps au Bronze. La géographie doit suivre une acquisition que le joueur comprend.
2. **Donner un vrai chapitre au Cuivre.** Appuyer ses jalons sur les objets existants : fonte du cuivre et de l’étain, première plaque martelée, approvisionnement en charbon. Ajouter des étapes significatives, sans simple attente artificielle.
3. **Préparer les retours aux anciennes terres.** L’eau, la galène, l’uranium et le soufre sont de bons renouvellements économiques. Le rappel de pose ajouté en #121 intervient après fabrication ; le guide doit aussi annoncer clairement la nouvelle matière, sa terre et son usage avant la construction de l’extracteur.
4. **Expliquer le quartz dès le Désert.** Choisir un usage précoce ou annoncer son intérêt futur. Les carrières de quartz ne doivent pas paraître être un investissement nécessaire dès le Bronze sans débouché annoncé.
5. **Mesurer puis accompagner l’industrialisation des Composites.** Comparer un vrai parcours avec machines à celui sans usine avant de modifier fusée, Rampe et Base avancée. Échelonner les objectifs de production si cette rupture persiste.

Ne pas déplacer le pétrole avant la sonde, ni faire dépendre le premier extracteur d’uranium/plomb de sa propre ressource : ces chaînes sont actuellement cohérentes.

## Reproduire et poursuivre

`tools/audit-equilibre.js --structure` exporte la correspondance âges/terres et les nouveaux gisements. `--profil base --minutes 360`, `--profil memoire --minutes 240` et `--profil veilleur --minutes 120` exportent les durées et les passages via `tools/sim-passages.js`, sans modifier les règles du jeu.

Les relevés complets des trois scénarios sont conservés dans [equilibre-ages-terres-mesures.json](equilibre-ages-terres-mesures.json). Les événements d’âge ont une précision d’environ un pas du moteur (0,1 seconde).

Restent à observer : un nouveau joueur qui découvre les recettes, les choix réels de relève et d’achats, la lecture des quêtes et de la carte, une usine construite et utilisée, puis les différentes fins. Cet audit identifie les points à travailler ; il ne transforme pas une simulation en validation de l’expérience humaine.
