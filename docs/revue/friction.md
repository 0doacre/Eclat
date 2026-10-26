# Réduire la friction : renaissance, accès, premiers pas

Objectif posé : pas de baisse de difficulté, moins de friction. Un joueur casual ne doit pas être perturbé, une renaissance doit se rattraper vite, chaque élément doit être à sa place et joignable de partout.

## La renaissance, mesurée

`RELEVE=<âge> node tools/sim.js` fait jouer le bot jusqu'à l'âge donné, fait la relève (aucun achat de Mémoire), répare les ruines dès qu'il le peut, rejoue, et mesure le temps pour revenir au même âge. 0.27.0, 4 prises de vue :

| Relève à l'âge | Première fois | Rattrapage | Part |
|---|---|---|---|
| 4 (Bronze) | 3 min 59 | 6 min 14 | 156 % |
| 8 (Électricité) | 20 min 40 | 11 min 32 | 56 % |
| 11 (Polymères) | 25 min 21 | 12 min 56 | 51 % |

Plus on a avancé, plus le rattrapage est court (les extracteurs et machines reviennent à 10 % de leur coût, les recettes sont connues). Une relève très précoce (âge 4) coûte plus que la première fois : les passages de la Plaine et de la Rivière sont à repayer, et les premières minutes redeviennent celles d'un nouveau départ. La Mémoire (Raccourci, paquetage) est faite pour ça.

**Défaut trouvé et corrigé** : réparer une ruine n'était pas compté comme fabriquer. Le bot restait bloqué à l'étape « fabrique une cabane » avec deux cabanes réparées dans la Réserve (12 h sans avancer). Un joueur voit « Fabrique une cabane » alors qu'il en a déjà, et ne comprend pas. `E.repair` marque maintenant l'objet comme fabriqué, comme le fait déjà le paquetage.

## Ce qui a changé (0.27.0)

- **Ruines** : un seul bloc replié par terre, sous ce qui se récolte, au lieu d'une carte par ruine au-dessus des gisements. Ouvert d'emblée quand quelque chose est à portée, avec « Tout réparer ». Les ruines de machines suivent la même règle.
- **Comptoir** joignable depuis le menu, de n'importe quel écran (il n'était que dans le Domaine, sur la Plaine).

## Carte de l'accès (qui est joignable d'où)

| Élément | Où il se trouve | Depuis partout ? |
|---|---|---|
| Mémoire des mains | bouton ✦ de l'en-tête, menu | oui |
| Quêtes, étapes de l'âge | en-tête | oui |
| Comptoir | carte du Domaine (Plaine), **menu (nouveau)** | oui |
| Sauvegardes, compte, aide | menu | oui |
| Recettes (Carnet) | onglet, mais caché tant qu'aucune recette n'est connue | oui, une fois connu |
| Ruines | Domaine | non : seulement sur l'écran Domaine (volontaire : on y répare sur place) |
| Fiche d'une ressource | toucher une icône partout | oui |

## À regarder ensuite (non fait)

- Le vocabulaire du début : « Scénario », « Étape clé », « Tenter » sont du jeu, pas de l'interface. Un joueur qui n'a jamais joué doit comprendre l'action sans le guide.
- Deux appels à l'action se superposent à l'ouverture : la bulle du guide (« Guide-moi » / « Je me débrouille ») et la carte d'objectif.
- Mémoriser le dernier filtre et la dernière recherche du Carnet, une quantité libre à côté de ×10 et Max.
- Un test à cinq vrais joueurs reste la seule mesure de ce qui perturbe : ce document n'en tient pas lieu.
