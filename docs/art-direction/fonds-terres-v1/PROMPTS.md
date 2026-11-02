# Fonds des Terres, version HD (à générer)

Les fonds actuels (`assets/terres/<id>-decor.webp`, 252 × 448 ou 288 × 512, portrait) sont trop petits : ils sont étirés à plein écran sur un téléphone récent et deviennent flous et rognés sur un ordinateur. On remplace par **une seule image HD par terre**, utilisée telle quelle sur téléphone et sur ordinateur.

## Format

- **Paysage 16:9**, maître en 3840 × 2160, export `assets/terres/<id>-fond.webp` en **2560 × 1440**, WebP, **300 Ko au plus** (qualité 70 à 78).
- Sur ordinateur, l’image est affichée en entier (`cover`). Sur téléphone en portrait, on n’en voit que la **bande centrale** (environ 28 % de la largeur) : il faut donc que le sujet et l’horizon tiennent dans le **tiers central**, et que les tiers gauche et droit prolongent le paysage sans élément clé.
- Zones calmes : le haut (bandeau et plaques) et le bas (nom de la terre) sont recouverts par l’interface, donc peu de détails fins aux bords haut et bas. Aucune ligne d’horizon dans les 15 % du haut.
- Pas de texte, pas de lettres, pas de cadre, pas de papier, pas de personnage au premier plan.

## Bloc de style commun (à coller au début de chaque prompt)

```
Use case: stylized-concept. Wide 16:9 landscape background for Éclat's hand-painted explorer's notebook. Match the existing painted lands: muted natural watercolor washes, brown-black organic ink contours kept light, sparse hatching, soft paper grain, gentle atmospheric depth. The main subject and the horizon sit in the central third of the image; the left and right thirds continue the landscape with calm, simple shapes and no key element. Quiet top band and quiet bottom band, soft mist or simple tone there. Slightly desaturated warm palette, soft diffuse light, no hard shadow. No text, letters, numerals, UI, frame, paper rectangle, border, photorealism, 3D render, glossy fantasy, neon, characters or animals in the foreground.
```

## Une terre, un prompt

**lisiere (La Lisière).** Subject: the edge of an immense old forest at dawn. Left third: dark pines and oaks rising into mist. Center: a worn dirt path leaving the trees into a green meadow, one great twisted oak at the edge, far blue hills on the horizon. Right third: meadow and low shrubs fading into pale mist. Greens, ochres, soft golden light.

**plaine (La Plaine des Hautes Herbes).** Subject: a wide plain of grass taller than a person, seed heads swaying, a wide pale sky. Center: a lone low rise with a few dark shapes of grazing herd animals far away (tiny, silhouette only). Left and right: waves of tall golden-green grass. Straw yellows, pale greens, large soft clouds.

**riviere (La Rivière Lente).** Subject: a wide, slow, lazy river rolling dark round pebbles at its edge. Center: the river bending away to the horizon, a bank of black pebbles and clay in the foreground, reeds. Left and right: soft river banks with willows and low mist. Grey-green water, black pebbles, pale sky.

**collines (Les Collines Vertes).** Subject: round hills striped with dark green veins of copper ore. Center: a hill whose flank shows bright green malachite veins in the rock, a few boulders. Left and right: rolling grassy hills in overlapping layers, blue-grey in the distance. Fresh greens, verdigris, warm earth.

**mine (Les Profondeurs).** Subject: a natural gallery deep under the hills, warm and slightly lit from within. Center: the gallery opening onto a high cavern with a faint amber glow and iron-red rock, a dark seam of coal. Left and right: rough rock walls curving inward, stalactites kept simple. Dark browns, rust, amber, a hint of warm air.

**desert (Le Désert de Verre).** Subject: dunes to the horizon where the sand has fused into slabs of green-tinted glass. Center: a flat glass slab glinting in the low sun, a small dune ridge behind it. Left and right: long rippled dunes. Sand yellow, pale turquoise glass, hazy white sky.

**gisement (Le Gisement Noir).** Subject: a plain of bitumen where oil seeps from the ground. Center: a shiny black pool with iridescent edge, thin dark rivulets, a few old charred stumps. Left and right: flat black and grey ground fading into a heavy brown-orange sky. Soot black, deep brown, a faint rainbow sheen.

**montagnes (Les Pics Fracturés).** Subject: mountains torn open by an ancient catastrophe. Center: a split peak with a huge fracture, broken rock plates and scree. Left and right: jagged shattered ridges in cold layers. Slate blue, grey, pale snow, a few warm mineral streaks.

**orbite (L’Orbite Basse).** Subject: Earth seen from low orbit with a ring of debris turning around it. Center: the curve of the blue and white Earth below, a thin arc of pale metal debris crossing, black sky with a few stars. Left and right: continue the curve of the planet and the starfield. Deep blue, white, steel grey, no futuristic hardware in detail.

**lune (La Lune).** Subject: grey, silent lunar surface, not entirely empty. Center: a crater edge with fine grey regolith, Earth small and low on the horizon, a faint odd glimmer in the crater. Left and right: gentle grey plains with long soft shadows. Neutral greys, pale blue Earth, black sky.

**mercure (Mercure).** Subject: the smallest planet, so close to the Sun that metal runs like water. Center: a river of molten bright metal on a dark cratered ground, a huge low Sun glowing at the horizon. Left and right: scorched grey-brown plains with faint heat shimmer. Orange, molten gold, charcoal, a white-hot sky glow.

**caveau (Le Caveau des Semeurs).** Subject: a huge hall under the Profondeurs flooded with blue light. Center: a vast arched chamber, smooth old walls, pale blue light pooling on the floor and a faint glowing seam. Left and right: tall stone arches receding into blue dark. Blue, deep indigo, silver, calm.

## Intégration

1. Déposer `assets/terres/<id>-fond.webp` pour chaque terre.
2. Ajouter l’identifiant dans `FONDS_HD` (`js/domaine.js`) : le jeu prend alors `-fond.webp` à la place de `-decor.webp`. Tant que l’image manque, l’ancien fond sert.
3. Ajouter le fichier à la liste `FILES` de `sw.js`, puis `node tools/build.js`.
4. Le Caveau a déjà un portrait HD (`caveau-decor.webp`, 1080 × 2332) : il reste à faire sa version paysage.
