# Clins d’œil (easter eggs)

> **COFFRE.** L’auteur ne lit pas ce fichier. Demande de l’auteur : des clins d’œil discrets,
> rares, à la pop culture (Minecraft, Zelda, Seigneur des anneaux, D&D, Castlevania, Mario,
> Vampire Survivors…) et à des créateurs français (ZeratoR, Squeezie, Antoine Daniel…),
> « pas trop faciles à avoir ».

## Règles

- **Hors récit.** Aucun clin d’œil ne donne d’indice ni ne compte dans les 40 secrets du
  récit. Ils ont leur propre page, cachée : « Curiosités » dans le Journal, qui n’apparaît
  qu’au premier trouvé, avec des cases « ? » sans compteur total.
- **Jamais de nom propre réel en clair** à l’écran : on évoque (une réplique, un objet, un
  geste), on ne cite pas. Pas de moquerie : un clin d’œil complice.
- **Rareté réglée sur le vrai jeu** : un joueur fait de l’ordre de 20 000 à 60 000 récoltes à
  la main sur toute une partie. Une chance sur 500 000 par récolte ne tomberait jamais. On
  vise « une fois en plusieurs heures de jeu » : 1/4 000 à 1/20 000 par action à la main,
  jamais sur les extracteurs (sinon ce serait automatique et sans surprise).
- Réglages dans `D.EASTER` (données), tirage par `rand()` du moteur (testable).
- Un objet de clin d’œil est une `curio` : vendable nulle part, sans effet de jeu, sauf
  mention.

## La liste

| Id | Clin d’œil à | Déclencheur | Ce qui se passe |
|---|---|---|---|
| poudre_rouge | Minecraft (redstone) | Récolter du caillou à la main (ou avec l’action ▶, jeu ouvert) : chance cumulée par caillou récolté, médiane à 20 000 cailloux (p = 1 − e^(−n·ln2/20 000) par récolte de n cailloux). Une seule fois par partie ; jamais pendant le rattrapage d’une absence ni par les extracteurs. | « Une poudre rouge, qui crépite entre tes doigts. » Objet `poudre_rouge` ; posé sur l’établi avec un manche, l’action Assembler donne une « Torche rouge » qui ne chauffe pas. |
| coeur | Zelda (réceptacle) | 4 morceaux trouvés : 1/15 000 en récoltant des fibres, de l’os, du sable, de la glace lunaire (régolithe) | « Un quart de cœur. » Au quatrième : « Tu te sens un peu plus solide. » (aucun effet) |
| anneau | Seigneur des anneaux | Explorer la Rivière lente au cycle 9 (le « neuvième porteur ») | Au fond du gué, un anneau tout simple. Toucher sa fiche : « Il est très lourd pour sa taille. Tu le reposes. » Il disparaît de la Réserve. |
| d20 | Donjons & Dragons | Tailler un éclat avec de l’os : 1/20 000 | « Un caillou taillé à vingt faces. Tu le lances : 20. » La 2e fois : un nombre au hasard. |
| fouet | Castlevania | Tresser une corde la nuit (heure réelle 0 h–4 h), 1/3 000 | « Une corde de cuir tressée, lestée au bout. Elle claque toute seule quand tu passes près d’une chandelle. » |
| tuyau | Mario | Poser 8 extracteurs sur un même gisement de Profondeurs | Une ligne dans la fiche du gisement : « Un tuyau vert dépasse de la roche. Tu n’y descends pas. » |
| survivant | Vampire Survivors | Laisser l’action ▶ de récolte tourner 30 minutes jeu ouvert | « Tes mains tournent toutes seules depuis une demi-heure. Tu n’as jamais été aussi efficace, ni aussi seul. » |
| zera | ZeratoR (et ses événements) | Taper au terminal un mot qui évoque ses grands événements (empreinte, comme les codes) | Le terminal : « ÉVÉNEMENT TROUVÉ. RÉGLEMENT : TOUT LE MONDE GAGNE. » |
| squeeze | Squeezie | Vendre au Comptoir exactement 1 000 000 d’unités d’une même chose dans un cycle | Le Troqueur : « Un million. Quelqu’un, quelque part, a dû appuyer très fort sur un bouton. » |
| wtc | Antoine Daniel (What the Cut) | Ouvrir puis fermer 10 fois de suite la même fiche en moins de 20 s | Une ligne en bas de fiche : « On coupe ? » puis la fiche s’ouvre en italique, une seule fois. |
| konami | Classique | Les flèches haut haut bas bas gauche droite gauche droite (clavier) ou la même suite de gestes sur l’écran du Ciel | Le Ciel affiche 30 étoiles de plus pendant une minute. |
| xyzzy | Aventure textuelle | (déjà dans le jeu, inchangé) | — |

## Mise en œuvre

Une version à part, faite par Claude (pas par Gemini, pour garder la surprise), après la 6.1 :
`D.EASTER` dans `js/recit.js`, une petite fonction de tirage branchée dans `E.tap`, `E.attempt`,
`finishExp`, le Comptoir et le terminal ; l’onglet « Curiosités » ; des tests dans
`tools/test-recit.js`.

## Clins d’œil du Troqueur (Comptoir → Parler → Tes clients)

Des paroles, pas des objets : elles ne comptent pas dans l’onglet des clins d’œil. Aucun nom réel.
Certaines demandent une chose précise en poche (`has`). Complices, jamais moqueuses.

| Réplique | Clin d’œil à | Condition |
|---|---|---|
| k1 | Le Guide du voyageur galactique (la serviette, « ne pas paniquer ») | rang 1 |
| k2 | Zelda (les pots cassés) | rang 1 |
| k3 | Indiana Jones (l’idole et le sable) | rang 2, âge 3 |
| k4 | Portal (le gâteau) | rang 2 |
| k5 | Kaamelott (« c’est pas faux ») | rang 2 |
| p1 | Minecraft, la poudre rouge | poudre rouge en poche |
| p2 | Le Seigneur des anneaux | anneau en poche |
| p3 | Zelda, les quarts de cœur | quart de cœur en poche |
| p4 | Donjons et Dragons | dé en poche |
| p5 | Castlevania | fouet en poche |

