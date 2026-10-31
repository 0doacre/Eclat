# Simulation d'équilibrage : la production libre des travailleurs (0.54)

Banc : `node tools/sim-equipe.js [--minutes 120] [--joueurs …] [--ecus 80] [--max 2] [--seuils 30,100]`. Le moteur n'est pas modifié.

## Méthode

Les joueurs automatiques de `tools/sim-passages.js` (tapeur, veilleur, explorateur, paresseux) n'embauchent jamais ; on ajoute donc un **employeur**. Toutes les 10 s de jeu actif il reçoit des écus (80 par minute : le robot ne joue pas le Comptoir) et embauche un travailleur dans le métier qui en a le moins, au plus 2 par métier (16 embauches sur la partie). On joue la **même partie** avec la production libre éteinte (`D.TRAVAILLEURS.generalistes = false`, les travailleurs servent seulement la file), puis à 30 % (réglage par défaut) et à 100 % (pire cas), et on compare le temps de chaque passage. Le robot connaît toutes les recettes.

Critère de l'étude : la production libre ne doit pas avancer un passage de plus de 10 %.

## Résultats (120 minutes de jeu actif)

| Joueur | Seuil | Écart moyen des passages | Plus fort gain | Fabrications (sans → avec) | dont production libre |
|---|---|---|---|---|---|
| tapeur | 30 % | +1,7 % | −0,5 % | 26 889 → 25 605 | 1 374 |
| tapeur | 100 % | +1,3 % | −0,7 % | 26 889 → 24 975 | |
| veilleur | 30 % | 0,0 % | 0,0 % | 38 445 → 43 777 | |
| veilleur | 100 % | +0,2 % | 0,0 % | 38 445 → 53 696 | |
| explorateur | 30 % | 0,0 % | −0,1 % | 19 479 → 20 223 | |
| explorateur | 100 % | −0,1 % | −0,2 % | 19 479 → 21 000 | |
| paresseux | 30 % | −2,7 % | **−7,1 %** | 119 272 → 131 619 | 40 217 |
| paresseux | 100 % | −2,5 % | **−7,1 %** | 119 272 → 159 938 | |

Suite : le seuil par défaut passe de 30 % à 10 % (0.54.1), et le joueur ne voit plus de pourcentage mais cinq paliers nommés (au repos, au jour le jour, quelques réserves, bien garni, à ras bord ; `D.TRAVAILLEURS.paliers`). Les résultats ci-dessous sont ceux du seuil à 30 %, avant ce changement.

## Lecture

- **Le critère tient** : le plus fort gain est de 7,1 % (le joueur paresseux, trois à douze heures d'absence entre deux séances, quand les travailleurs fabriquent pendant son absence). Les trois autres types gagnent moins de 1 %.
- **Pas d'emballement** : passer le seuil de 30 % à 100 % ne change presque rien aux passages (même −7,1 % pour le paresseux), alors que les fabrications grimpent jusqu'à +34 %. Ce que les travailleurs fabriquent seuls n'est pas ce qui retient les passages, qui dépendent de la récolte et des coûts de passage.
- **Un ralentissement, et sa vraie cause** : le tapeur perd 7 à 10 % sur un passage (le Désert, de 90,1 à 98–99 minutes), et ce ralentissement **ne baisse pas avec le seuil** (+10 % à 10 %, +9 % à 30 %, +7 % à 100 %). Ma première explication (les travailleurs consomment des matières que le robot doit récolter) était donc fausse. Avec `--sans-energie` (l'énergie ne ralentit plus rien), l'écart disparaît (Désert 90,4 → 90,0, moyenne −0,1 %) : **ce sont les chevaux que les travailleurs consomment quand ils fabriquent seuls** qui font tomber le facteur d'énergie, et donc ralentissent les machines du joueur. C'est une conséquence réelle de la règle de l'énergie (0.44), et le goulot « L'énergie manque » le dit au joueur ; mais un joueur qui n'y prend pas garde ralentit ses machines sans le savoir. Pistes : faire consommer moins de chevaux aux travailleurs en production libre, ou la suspendre quand l'énergie manque (le travail de la file passe avant).
- **Au seuil par défaut de 10 %** (0.54.1) : tapeur +2,0 % en moyenne (+10 % au Désert, l'énergie), veilleur −0,6 % (−3,6 % au mieux), explorateur 0,0 %, paresseux 0,0 %. Le critère des 10 % tient pour l'accélération.
- **Limites** : un seul calibrage d'écus (80 par minute) et d'embauches (2 par métier) ; le robot ne vend pas, ne règle jamais le seuil lui-même et ne lit pas les goulots. Un vrai test avec plusieurs joueurs reste nécessaire.
