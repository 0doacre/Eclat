# La fatigue et la grève (0.57)

Décision du porteur du projet (31 octobre 2026) : des événements qui se déclenchent quand le joueur a trop poussé, sans aller jusqu'au gameplay de gestion : des travailleurs qui se fatiguent et font grève, puis (plus tard) des centrales qui s'arrêtent et des machines qui tombent en panne. Ordre retenu : la grève d'abord ; les centrales comme un goulot de combustible ; les pannes en dernier, ou jamais.

## Règles (D.TRAVAILLEURS.fatigue, js/data.js)

- Une jauge de fatigue de 0 à 1 par métier (`S.ateliers[métier].fatigue`), qui avance **seulement pendant que le jeu est ouvert**.
- Elle **monte** quand les travailleurs du métier fabriquent seuls (production libre et ordres permanents) plus des deux tiers du temps : en 1 800 s de travail continu elle est pleine ; l'énergie qui manque l'accélère (jusqu'à ×3 à la moitié de vitesse).
- Elle **descend** quand ils ont moins à faire : 900 s de repos complet la vident. La file de commandes que le joueur a lancée ne fatigue pas.
- À 0,7 ils **préviennent** (une phrase par métier, D.VOIX) ; à 1 c'est la **grève** : la production libre du métier s'arrête (la file de commandes continue, rien n'est perdu).
- La grève s'arrête quand la fatigue retombe à 0,4, ou tout de suite contre une **prime** : 2 fois le prix d'un apprenti de l'âge, qui ramène la fatigue à 0,3.
- **Jeu fermé, ils se reposent** (catchUp) : jamais de grève à un retour d'absence.
- Le goulot « les travailleurs sont en grève » propose la prime ; la page du métier montre la jauge, ce qu'elle veut dire et le bouton.

## Simulation (tools/sim-equipe.js, 120 minutes, seuils 10, 50 et 100 %)

Aucune grève avec les robots, et le rythme des passages ne bouge pas (mêmes écarts qu'avant, moins de 7,1 %). Les robots n'ont pourtant presque rien à fabriquer seuls (ils n'ont fait à la main qu'une petite part des recettes) : la grève est donc possible mais rare. Le test de tools/test-travailleurs.js la déclenche en accélérant la fatigue. À calibrer avec de vrais joueurs : `monte` (1 800 s) est la valeur à toucher en premier.
