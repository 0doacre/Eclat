# Le Troqueur parle

> **COFFRE.** L’auteur ne lit pas ce fichier.

## Ce que c’est

Un onglet « Parler » au Comptoir (à côté de Vendre, Acheter, Demandes). Le Troqueur « ne dit que ce
qu’on lui demande » (BIBLE §6) : le joueur choisit un thème, il dit une réplique. Données :
`D.RECIT.troc` dans `js/recit.js` (thèmes, refus, 38 répliques). Moteur : `E.troqueurThemes`,
`E.troqueurParle`, `E.troqueurDernier` (`js/engine.js`). État : `S.meta.troc`
`{ vus: { id: cycle }, dernier, refus }`, gardé à la relève, validé au chargement.

## Règles

- Jamais deux fois la même réplique. Les conseils (`renouv`) reviennent une fois par relève.
- Une réplique s’ouvre selon : le rang de confiance (`rang`, voir `E.troqueurRep`), `cond`
  (cycle, âge, pages, fragments, signes, objets en poche), `apres` (une réplique en suit une autre).
- Thème épuisé : un refus, tiré en tournant (pas de réplique inventée).
- Il est « pas à la Nourrice » : il ne la nomme que par son signe, et seulement quand le joueur l’a
  compris (`signe: nourrice`). Il vend à tout le monde, ne doit rien à personne.
- Il ne nomme jamais un lieu caché ni sa solution. Ce qu’il en dit ajoute un troisième indice
  (test : `tools/test-recit.js`, « le lieu caché ou le secret dont il parle a deux indices ailleurs »).
- Trois sortes de paroles : du lore anodin (les Anciens achetaient, la pomme sur le plateau, le
  caillou d’Anouk), des conseils de marchand (automates, Étudier tout, déchiffrer, passages, relève,
  prix qui baissent, lieux qui disent ce qui leur manque), des clins d’œil (voir EASTER.md).

## Les indices qu’il ajoute

| Réplique | Mène à | Indices ailleurs |
|---|---|---|
| t3 | l’Escalier noyé | le galet percé, p.23, la question « Les marches sous l’eau » |
| t4 | la Porte Scellée | le fragment de la Porte, p.12, l’énigme du lieu |
| c5 | « Sous le comptoir » (T1) | p.13, la question « Sous le comptoir », Émile |
| s3 | la lueur rouge | la question « La lueur rouge », le texte du Ciel |
| t6 | tous les lieux cachés | les phrases d’énigme de chaque lieu |

## Écrire une réplique

Une parole, trois phrases au plus, un objet ou un geste. Test de suppression : si on retire la
dernière phrase et que rien ne manque, on la retire. Pas de « c’est » ni de « ça » en série, pas de
tiret cadratin, pas de morale. Lexique : « déposer », « Réserve », jamais « verser » ni « stock ».
