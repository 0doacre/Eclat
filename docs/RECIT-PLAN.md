# Le nouveau récit : plan de réalisation

Ce document est **public et sans spoiler**. Il décrit la forme du chantier : systèmes, écrans,
volumes, versions, répartition du travail, risques. L’histoire, les personnages, les
révélations et les solutions sont dans `docs/coffre/` : **ne pas l’ouvrir** si tu veux jouer à
l’aveugle.

## 1. Les principes

- **La surface ne change pas.** Un joueur qui ignore le récit joue le même incrémental, avec
  les mêmes âges, terres, relèves et fins accessibles. Aucun secret ne bloque la progression
  normale.
- **On avance en comprenant.** Les nouveautés du récit se trouvent, se lisent et se recoupent ;
  elles ne se débloquent presque jamais par la seule production.
- **Les sauvegardes ne cassent jamais.** Champs nouveaux avec valeur par défaut, pas de
  changement de `SAVE_VERSION`, copie de sécurité avant chaque mise à jour, comme toujours.
- **Ta partie actuelle ne reçoit rien d’avance.** Tous les textes réécrits arrivent sous de
  nouveaux identifiants : tu les retrouveras en jouant. Les anciens textes restent dans la
  sauvegarde, cachés. Les fins déjà atteintes gardent leurs Échos mais s’affichent comme
  « à découvrir » jusqu’à ce que tu les revoies.
- **Les textes suivent `docs/STYLE.md` et `docs/LEXIQUE.md`.** Couche « jeu » explicite et
  fiable, couche « récit » courte.

## 2. Les volumes

| Quoi | Nombre |
|---|---|
| Pages du Livre des Semeurs (numérotées) | 32 |
| Feuillets en plus des pages | une trentaine |
| Signes de l’écriture des Anciens | 14 |
| Secrets au Journal | 40 (19 gardés, 21 nouveaux, 2 retirés) |
| Lieux cachés | 11 (dont 9 nouveaux) |
| Fragments de lieux réécrits ou nouveaux | une quarantaine, de 3 à 6 phrases |
| Questions de l’aide (3 niveaux chacune) | 16 |
| Fins | 3, réécrites ; mêmes Grands Œuvres visibles |
| Recettes secrètes nouvelles | 2 |

## 3. Ce qui change à l’écran

- **Journal** : trois onglets de plus.
  - **Livre** : les pages trouvées, dans l’ordre de leurs numéros ; les cases vides montrent le
    numéro. Une page a une partie imprimée (dessin, signes) et des notes manuscrites dans la
    police à la main déjà embarquée (Caveat).
  - **Signes** : le lexique ; chaque signe a une fiche (où on l’a vu, ce qu’on en sait).
  - **Questions** : les mystères rencontrés, avec trois niveaux d’aide payés en Intuition ✨.
- **Partout où il y a du texte** : les signes
  s’affichent dessinés, puis se mettent à jour quand on les comprend.
- **Carte et Domaine** : de nouveaux lieux cachés, avec le système d’énigme qui existe déjà ;
  un lieu déjà exploré peut avoir du nouveau.
- **Atelier** : deux recettes secrètes de plus (la « chaleur étrange » de la 5.8 les signale).
- **Comptoir** : certaines pages s’achètent.
- **Cosmos** : le Ciel et le terminal reçoivent du contenu nouveau.
- **Relève, éveils, fins** : textes réécrits.
- Deux nouveaux champs de saisie libre, en plus du terminal.

## 4. Les versions

5.9 (le Troqueur) reste telle que prévue, sans rien du récit. Le récit commence en 6.0.

| Version | Contenu | Gemini (sans spoiler) | Claude (avec le coffre) |
|---|---|---|---|
| **6.0 Le Livre** | Écran Livre ; sources de pages (exploration, première réparation d’une ruine, achat au Comptoir) ; fichier de récit séparé ; nouveaux identifiants de fragments et archivage des anciens ; textes de revisite ; onglet Questions ; fragments des quatre premières terres ; 12 pages | Moteur et écran du Livre, onglet Questions, archivage des fragments, avec des données factices | Textes, pages, questions, câblage |
| **6.1 Les signes** | Rendu des signes (petits SVG générés depuis les données) ; jetons de signes dans tous les textes ; fiche d’un signe et saisie ; mise à jour en place ; 8 premiers signes ; inscriptions | Le moteur de rendu (un signe = une petite liste de points dans les données), l’écran Signes, la saisie tolérante (accents, casse, articles) | Les signes, les inscriptions, les mots acceptés |
| **6.2 La flûte et le ciel** | La flûte reconnaît des airs plus longs définis dans les données, avec des effets nommés ; le Ciel accepte des animations décrites dans les données ; quelques airs nouveaux | La détection générique et les crochets d’effets ; l’animation pilotée par données | Les airs, leurs effets, les animations |
| **6.3 Les voix** | Le terminal devient piloté par les données (mots-clés, champs calculés) ; deux saisies libres ; événements déclenchés par des conditions de partie ; pages jusqu’à 32 | Le moteur du terminal, le moteur d’événements, les champs de saisie | Toutes les réponses, tous les événements |
| **6.4 Les portes** | Conditions d’exploration élargies (objets, signes connus, drapeaux, pages) ; 9 lieux cachés ; 2 recettes secrètes ; une page de plus au Comptoir ; 6 derniers signes | L’extension de `need` et ses tests, avec des lieux factices | Les lieux, les recettes, les textes |
| **6.5 Les fins** | Les trois fins réécrites ; le Grand Œuvre caché remanié, dont une étape d’un type nouveau ; textes d’après-fin | Rien | Tout (le détail du type d’étape est dans le coffre) |

Chaque version passe `npm test`, se teste dans un vrai navigateur sur les sauvegardes de
`tools/fixtures/`, et met à jour `D.VERSION` et `D.CHANGES` (phrases sans spoiler).

## 5. Garder le secret pendant le développement

Le plus gros risque de ce chantier : que tu te spoiles en relisant une branche.

- **Un fichier de récit à part**, `js/recit.js`, chargé après `js/data.js`. Il contient tous les
  textes du récit et toutes les conditions. Tu ne l’ouvres pas ; Claude relit ses diffs.
- **Les réponses ne sont jamais en clair** dans le code : mots, airs et codes sont stockés sous
  forme d’empreintes (hachage de la saisie normalisée). Un coup d’œil à un diff ne révèle rien.
- **Les prompts pour Gemini** (`docs/prompts/`) décrivent des moteurs génériques avec des
  données factices. Ils restent lisibles par toi sans risque.
- **Les tests** des systèmes de récit utilisent des données factices et des noms neutres. Les
  tests qui vérifient le vrai contenu vivent dans `tools/test-recit.js`, à ne pas ouvrir.
- **Messages de commit, titres de branche, `D.CHANGES`** : neutres (« Livre : 12 pages »,
  pas le contenu).
- `docs/SOLUTIONS.md` deviendra un simple renvoi vers le coffre en 6.0 (il décrit l’ancien récit).

## 6. Les risques

| Risque | Parade |
|---|---|
| Spoiler par un diff, un test, un commit | §5 : fichier séparé, empreintes, données factices, relecture par Claude |
| Sauvegarde abîmée | Champs par défaut, identifiants nouveaux, jamais de réutilisation d’un identifiant de texte, fixtures testées à chaque version |
| Joueur bloqué | Onglet Questions, trois niveaux d’aide ; chaque secret a au moins deux chemins d’indices |
| Force brute | Saisies libres, suites longues, conditions de connaissance ; essais limités là où une liste courte existe |
| Saisie sur mobile (clavier, accents, fautes) | Normalisation (accents, casse, articles) ; une faute d’une lettre est signalée, pas refusée sèchement |
| Indices sonores | Chaque indice entendu a un jumeau visible ou écrit ; le jeu reste faisable son coupé |
| Interactions particulières | Réglables dans les données, avec un réglage d’accessibilité |
| Volume de texte et cohérence | Une bible unique dans le coffre ; textes courts ; relecture contre STYLE.md |
| Performance (signes dessinés dans de longues listes) | SVG minuscules, mis en cache par signe |
| Le joueur occasionnel noyé | Rien du récit n’apparaît dans les objectifs comme une tâche obligatoire ; les onglets nouveaux s’ouvrent quand ils ont du contenu |

## 7. Décisions de forme à prendre

1. **Le secret pendant le développement** (§5) : fichier séparé, réponses en empreintes, tu ne
   relis que les moteurs et Claude relit le récit. D’accord ?
2. **Comprendre un signe** se fait en **tapant un mot** (clavier), pas en choisissant dans une
   liste (une liste se force en quelques essais). D’accord ?
3. **L’aide** coûte de l’**Intuition** ✨ (qui sert peu en fin de partie), trois niveaux par
   question. Ou préfères-tu une aide gratuite, débloquée après un délai ?
4. **Une étape de la fin** utilise une interaction d’interface inhabituelle, sans risque pour
   la sauvegarde, réglable pour l’accessibilité. Acceptes-tu de ne pas savoir laquelle ?
5. **Sons** : quelques scènes existantes reçoivent un court air (avec un équivalent écrit). D’accord ?
6. **Ta partie** : les textes réécrits ne te sont pas donnés d’avance et tes fins déjà vues
   repassent « à découvrir » (Échos gardés). D’accord ?
7. **Numérotation** : le récit en 6.0 à 6.5, après la 5.9. D’accord ?
