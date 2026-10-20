# Refonte 5.0 — le Domaine, la carte, le carnet

Les tapis, les ports et les débits ne marchent pas sur un téléphone : on passe plus
de temps à tracer des lignes qu’à jouer, et l’écran devient illisible dès la
troisième terre. Cette refonte garde ce qui fonctionne (les gisements, les
extracteurs, les machines, les passages, la relève, la Mémoire des mains) et retire
toute la logistique. Elle change aussi l’habillage : le jeu devient le carnet de
terrain du Semeur, et ce carnet change de papier et d’encre au fil des âges.

Maquettes de référence : la planche « Éclat — directions artistiques », direction A
et la rangée « le carnet au fil des âges ».

## 1. Ce que voit le joueur

### Les onglets

| Onglet | Rôle |
|---|---|
| **Domaine** (nouveau, écran d’accueil) | tout ce qui produit : gisements, extracteurs, machines, passage en cours, Grand Œuvre en cours |
| **Carte** | où l’on est : terres, brume, lieux à explorer, passages. On y navigue, on n’y construit rien |
| Atelier | inchangé sur le fond (fabriquer, découvrir, étudier) |
| Carnet | inchangé sur le fond |
| Journal | inchangé sur le fond |
| Cosmos | inchangé, apparaît comme aujourd’hui |

### Le Domaine

Une page qui défile, de haut en bas :

1. **L’objectif** de l’âge (comme aujourd’hui).
2. **Les terres ouvertes**, la plus récente en premier. Chaque terre a un titre et
   une ligne par gisement :
   - icône, nom, stock, débit (`+3,6/s`) ;
   - les extracteurs posés (« cabanes ×3 ») ;
   - boutons `+1` et `×10` (et `Max` quand il y a de quoi) ;
   - appui long sur la ligne : récolte à la main, si le gisement s’y prête ;
   - un toucher sur la ligne ouvre sa fiche : retirer des extracteurs, changer de
     type, mettre en pause, voir ce qui en consomme.

   Au-delà de deux terres, les plus anciennes sont repliées en une ligne
   (« 4 autres terres · +540/s en tout · ouvrir »).
3. **Les machines** : une ligne par chaîne, « 2 automates → Manches · +0,2/s ·
   prennent 0,6 bois/s », avec `−`/`+` et « Changer ». Les machines au repos
   apparaissent en une ligne (« 3 automates au repos · affecter »).
4. **Le passage en cours** : la carte qu’on connaît (coût, barre, Verser).
5. **Le Grand Œuvre en cours**, s’il y en a un : étape, barre, Verser, et un
   interrupteur « alimenter » qui le fait se servir seul dans la Réserve.

Le bouton `+1` d’un gisement prend un extracteur libre du bon type ; s’il n’y en a
pas, il le fabrique (le coût s’affiche sur le bouton) puis le pose. `×10` et `Max`
font pareil en série. On ne choisit le type d’extracteur que dans la fiche.

### La carte

Une carte dessinée qui se lit de bas en haut, comme une montée : la Lisière en bas,
l’espace tout en haut. Elle défile verticalement, sans pincement.

- Les terres ouvertes sont dessinées et nommées. Un toucher mène à leur section du
  Domaine.
- Les terres à venir restent sous la brume (hachures à l’encre, comme dans la
  maquette A). Seul leur contour se devine, avec un nom vague (« une rivière,
  peut-être »).
- Les lieux à explorer sont des repères sur la terre ; un toucher ouvre
  l’exploration (même fenêtre qu’aujourd’hui). Un lieu verrouillé montre ce qui
  manque.
- Le passage en cours est une étiquette sur la frontière (« Passage · 41 % ») ;
  un toucher ouvre la fenêtre Verser.
- Le camp marque la Réserve.

Le dessin de la carte suit l’époque (voir 2) : peinture à l’ocre, carte antique,
portulan, relevé, carte moderne, carte du ciel. Le premier jalon peut se contenter
d’un seul style ; les variantes viennent au lot 4.

### Ce qui disparaît

- tapis, ports, répartiteurs, croisements ;
- débit des tapis et sortie de la Réserve (`D.BELT`) ;
- le mode avancé de l’usine (`settings.usine`) ;
- la pose des machines et des chantiers sur une grille ;
- la roue de fabrication sur la carte : on fabrique dans l’Atelier, et les boutons
  du Domaine fabriquent les extracteurs qui manquent.

## 2. Le carnet au fil des âges

Même mise en page à tous les âges. Ce qui change : le papier, l’encre, la police
des titres, un ornement, et l’épigraphe de l’âge en bas du Domaine (le champ `q`
de `D.AGES`).

| Époque | Âges | Papier | Titres | Signe de l’époque |
|---|---|---|---|---|
| pigments | Bois, Os, Pierre | papier brut, grain | IM Fell English | mains au pochoir ocre, points dans la marge |
| papyrus | Cuivre, Bronze | papyrus, fibres croisées | Cinzel | frise grecque, numéros d’âge romains, vert-de-gris |
| enluminure | Fer | vélin réglé, double marge | IM Fell English | lettrine rouge et or, rinceau, rubriques rouges |
| registre | Acier, Électricité | registre ligné, marge rouge | Playfair Display + Special Elite | tampon « Bureau des passages », écriture à la machine |
| quadrillé | Silicium, Polymères, Composites | cahier quadrillé | Caveat | surligneur, post-it, notes griffonnées |
| journal de bord | Spatial, Stellaire | pointillé technique | Space Grotesk + IBM Plex Mono | écusson de mission, repères de coupe, « J+412 » |

Le texte courant reste en Alegreya Sans partout, pour la lecture.

À l’intérieur d’une époque, la couleur d’accent suit la couleur de l’âge (`c` dans
`D.AGES`), éclaircie ou foncée pour rester lisible sur le papier.

Technique :
- `document.body.dataset.ep = "pigments" | …` ; chaque époque est un jeu de
  variables CSS (`--paper`, `--ink`, `--muted`, `--accent`, `--rate`,
  `--title-font`, `--radius`) et une texture de papier en dégradés CSS, sans image ;
- les ornements sont de petits SVG en ligne, posés par une fonction par époque ;
- polices embarquées dans `assets/fonts/` (woff2, sous-ensemble latin, licences
  OFL), mises en cache par le service worker ; le jeu marche hors ligne ;
- au changement d’âge, la page tourne (animation courte, désactivée si
  `prefers-reduced-motion`).

### Les icônes

Plus d’emoji dans l’interface. Toutes les icônes viennent de game-icons.net
(CC BY 3.0) : un sprite `assets/icons.svg` généré par `tools/icons.js` à partir de
`tools/icons.json` (objet → icône). Elles prennent la couleur de l’encre
(`currentColor`). Les crédits sont dans `docs/CREDITS.md` et dans le menu du jeu.
Le champ `ic` des données reste comme secours tant qu’une icône manque.

## 3. Le moteur

### Données sauvegardées (version 6)

```js
S.dom = {
  ext: { "lisiere:bois": { u: { cabane: 3, hutte: 1 }, on: true }, … },
  mach: [ { id: "M4", m: "automate_bois", r: "manche", n: 2, on: true, cap: 0 }, … ],
  site: { fusee: { on: true }, … },  // Grands Œuvres alimentés depuis la Réserve
  ms: { M4: { p, b, o }, … },        // ce que chaque machine a en main (comme fab.ms)
  seq: 12
}
```

`S.fab` disparaît. `settings.usine` disparaît.

### Simulation

À chaque pas, sans géométrie :

1. chaque gisement en marche produit `Σ n × extRate(type, res)` (avec les bonus
   actuels : âge, échos, Mémoire) vers la Réserve, dans la limite de la place ;
   Réserve pleine → état « plein », comme aujourd’hui ;
2. les machines tournent dans l’ordre des recettes (celles qui font un ingrédient
   passent avant celles qui l’utilisent, même tri que `E.plan`) ; elles se servent
   dans la Réserve et y déposent ce qu’elles font. Cadence, plafond, pause,
   blocage : mêmes règles que l’usine simple d’aujourd’hui ;
3. un Grand Œuvre alimenté se sert dans la Réserve, à un débit par matière qui
   dépend de l’âge (`D.SITE_RATE`, les valeurs de l’ancien `D.BELT.cap`, pour ne
   rien changer au rythme).

Les états affichés (ok, plein, en manque de…, bloqué, en pause) restent ceux
d’aujourd’hui, sans « pas relié », « bouchon » ni « tapis saturé ».

### API (remplace les `E.fab*`)

- `E.domExt(z, res)` → `{ u, on, rate, st }` ; `E.domExtAdd(z, res, n, type?)`
  (prend les libres, fabrique le reste, renvoie ce qui a été posé et pourquoi pas
  plus) ; `E.domExtRemove(z, res, type, n)` ; `E.domExtToggle(z, res)` ;
- `E.domMachAdd(r, m?)`, `E.domMachSet(id, { r, n, on, cap })`,
  `E.domMachRemove(id)` ;
- `E.domSite(p, on)` ;
- `E.production()`, `E.flows()`, `E.machInfo(id)` gardent leur forme.

### Migration v5 → v6 (rien ne se perd)

- chaque case `ext` de `S.fab.c` → `S.dom.ext["zone:res"]` (on retrouve la zone
  et la matière par la position du gisement) ; les comptes s’additionnent ;
- chaque case `mach` → une ligne de `S.dom.mach` (même id, type, recette, nombre,
  plafond, marche) ; sa réserve `fab.ms[id]` passe dans `dom.ms` ;
- chaque case `site` → `S.dom.site[p] = { on: true }` ;
- ce qu’un extracteur avait en main retourne à la Réserve ;
- tapis, ports, répartiteurs et croisements ne coûtaient rien : rien à rendre ;
- l’ancien `S.fab` est rangé tel quel dans `S.orphans.fab5` ; la copie de sécurité
  automatique d’avant mise à jour reste le filet principal ;
- `flags.news = "6"` : la fenêtre des nouveautés explique le changement en trois
  phrases.

Test : chaque sauvegarde de `tools/fixtures/` se charge, garde ses stocks, ses
extracteurs (même total par type) et ses machines (même total par type), et
produit au moins autant par seconde qu’avant en usine simple.

## 4. Lots

| Lot | Contenu | Qui |
|---|---|---|
| R1 | moteur : `S.dom`, simulation, API, migration v6, retrait du code des tapis ; tests | Claude |
| R2 | écran Domaine (liste, fiches, machines, passage, Grand Œuvre), appui long, tutoriel du Domaine | Claude |
| R3 | carte à brouillard (SVG, défilement vertical, terres, lieux, passages, camp) ; retrait de `usine.js` et de la roue | Claude |
| R4 | thèmes par époque sur tous les écrans, polices embarquées, page qui tourne, ornements, variantes de la carte | Claude |
| R5 | icônes : correspondance des 196 objets, zones, lieux, gestes, âges ; sprite ; crédits | agent, en parallèle |
| R6 | textes (nouveautés, aide, tutoriel) relus contre les tournures creuses ; simulateur et personas ; version 5.0.0 | Claude + agents |

Chaque lot passe `npm test` et se teste dans le navigateur avant de passer au
suivant. Les lots R1 à R3 sortent ensemble (on ne peut pas retirer les tapis sans
donner le Domaine) ; R4 à R6 peuvent suivre en versions 5.1, 5.2.
