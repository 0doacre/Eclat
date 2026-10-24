# Prompts d'illustration : une image par terre, et un décor par terre

À donner à un générateur d'images (Midjourney, Flux, DALL·E, Stable Diffusion, Firefly…). Les prompts
sont en anglais (c'est ce que ces outils comprennent le mieux) ; chaque terre a un résumé en français.
Pour chaque terre, **deux images** :
1. **La vignette de la carte** : remplace le dessin SVG actuel de la terre sur la Carte (la tache verte
   à bord clair dans la capture de la Lisière).
2. **Le décor** : un fond vertical, doux, qui se place derrière la fiche de la terre dans le Domaine.

Aucun secret du récit n'est dans ce document. Pour le Caveau, on ne s'appuie que sur ce que le jeu en dit
dès qu'on le trouve (« une salle immense baignée de lumière bleue »).

## 0. Le style commun (à coller au début de chaque prompt)

Le jeu a une allure de **vieil atlas enluminé** : encre brune, aquarelle sourde, papier chaud, bords
irréguliers, pas de brillance numérique. La Carte est sombre (presque noire, avec de la brume hachurée) ;
les terres s'allument dessus comme des pages éclairées par une bougie.

> **STYLE_BLOCK** — hand-inked and watercolor illustration in the manner of a medieval illuminated atlas
> and old explorer's maps, warm parchment undertone, soft brown ink linework, muted natural pigments,
> gentle grain and paper fibres, slightly irregular hand-drawn edges, calm and readable, subtle
> storybook charm, no text, no letters, no logo, no UI, no border frame, no watermark

À éviter partout (champ « negative prompt » quand l'outil en a un, sinon ajouter « without … ») :
> photorealistic, 3d render, glossy, neon, oversaturated, modern, anime, pixel art, text, captions,
> signatures, people, faces, UI elements, heavy vignette

**Palette de chaque terre** : celle de la Carte (colonne « teinte »). Garde les teintes **sourdes** : le
texte du jeu (clair) se lit par-dessus.

## 1. Les vignettes de la Carte

**Ce qu'on attend.** Une **île de terrain** isolée sur fond **transparent** (PNG ou WebP avec alpha),
vue **de dessus en perspective légère** (comme une carte ancienne), au **contour irrégulier** souligné d'un
liseré crème (#efe6d0). Le dessin doit laisser **trois ou quatre zones calmes** (herbe, sable, pierre lisse)
où le jeu pose de petites icônes de 56 px : ne rien y dessiner de gros ni de contrasté. Les détails
(arbres, rochers, huttes) restent petits et groupés sur les bords.

**Tailles** (la carte fait 400 × 1900 unités ; compter 3× pour les écrans denses) :

| Terre | Taille de la vignette | Forme | Teinte |
|---|---|---|---|
| La Lisière | 900 × 470 | île ovale | vert sauge #a9c48a |
| La Plaine des Hautes Herbes | 720 × 430 | île ovale | jaune paille #e6d68a |
| La Rivière Lente | 730 × 445 | île ovale traversée d'eau | bleu-gris #a9cdd8 |
| Les Collines Vertes | 720 × 430 | île ovale | vert tendre #bdd0a0 |
| Les Profondeurs | 670 × 410 | île ovale, coupe de terrain | brun #b39d86 |
| Le Désert de Verre | 750 × 430 | île ovale | sable #ecd6a2 |
| Le Gisement Noir | 690 × 410 | île ovale | gris chaud #a39b90 |
| Les Pics Fracturés | 750 × 470 | île ovale | gris pâle #cfcfcf |
| L'Orbite Basse | 720 × 265 | anneau (ellipse creuse) | bleu pâle #c9d3e6 |
| La Lune | 375 × 375 | disque | gris crème #dcdcd4 |
| Mercure | 265 × 265 | disque | ocre rosé #e6b98a |
| Le Caveau des Semeurs | 315 × 240 | île ovale, sombre | bleu froid #a9c6ea |

Chaque prompt ci-dessous commence par `STYLE_BLOCK` et se termine par le **suffixe vignette** :

> **SUFFIXE_VIGNETTE** — isolated cutout on a fully transparent background, single island of terrain seen
> from above at a slight angle like an old map, irregular organic outline traced with a thin cream line,
> three or four calm open areas left empty for small icons, details kept small and grouped near the edges,
> centered, soft shadow underneath only

| Terre | Résumé | Prompt (à placer entre `STYLE_BLOCK` et `SUFFIXE_VIGNETTE`) |
|---|---|---|
| **La Lisière** | L'orée d'une forêt, le Grand Chêne, ton camp | `edge of a vast forest: a few tall pines and one great old oak on the left, low undergrowth, a small camp with a stone fire ring and a little smoke on the lower middle, sage-green meadow, scattered stones` |
| **La Plaine** | Hautes herbes, bêtes sauvages, os blanchis | `rolling plain of waist-high golden grass bent by the wind, a few grazing wild animals in the distance, a field of bleached bones on the right, pale straw color, scattered small flowers` |
| **La Rivière Lente** | Eau large et paresseuse, galets noirs | `a wide lazy river crossing the island in a soft S-curve, smooth black pebbles on its banks, reeds, grey-blue water with long slow ripples, a few flat stepping stones, silt and mud` |
| **Les Collines** | Collines rondes, veines vertes et sombres | `soft round green hills with visible green and dark mineral veins in the exposed rock, terraced slopes like steps, short grass, a few boulders, a winding footpath` |
| **Les Profondeurs** | Galeries naturelles sous les collines, tiède | `a cutaway cross-section of the ground showing natural caves and galleries under a hilltop, stalactites, bats hanging, a faint warm amber glow from within, brown earth layers, an entrance in the slope` |
| **Le Désert de Verre** | Dunes, sable fondu en dalles de verre | `desert dunes in long soft waves, patches where the sand has fused into pale translucent glass slabs catching light in aqua and amber, heat haze, cracked ground, nothing alive` |
| **Le Gisement Noir** | Plaine de bitume, huile qui suinte | `a flat black bitumen plain, pools of glossy dark oil seeping from cracks, thin vapour rising, rust-coloured rocks, a few rusted old iron frames half sunk, warm grey tones` |
| **Les Pics Fracturés** | Montagnes éventrées par une catastrophe | `jagged mountains split open by an ancient catastrophe, great fractured slabs and a deep rift, scree slopes, snow in the cracks, pale grey rock, a narrow pass between two peaks` |
| **L'Orbite Basse** | Anneau de débris autour de la Terre | `a ring seen from outside, a slim elliptical band of drifting debris around a small blue-green Earth glimpsed at the centre: bits of old metal, panels and fragments, pale blue-grey, sparse and quiet` — **forme : anneau**, centre transparent |
| **La Lune** | Grise, silencieuse | `the Moon as a round disc, grey-cream, craters and long pale seas, soft shading, very quiet, no flag, no vehicle` — **forme : disque** |
| **Mercure** | Petite planète, le métal y coule | `a small planet disc seen close to a blinding sun, cracked ochre-pink surface with rivers of glowing molten metal in the cracks, scorched plains` — **forme : disque** |
| **Le Caveau des Semeurs** | Salle immense, lumière bleue | `the entrance of an immense underground hall bathed in cold blue light, smooth stone, a few steps descending, soft glow, silent and solemn, nothing inside revealed` |

## 2. Les décors (fond vertical derrière la fiche de chaque terre)

**Ce qu'on attend.** Un **paysage en portrait**, **doux et de faible contraste**, qui s'efface derrière le
texte. Le jeu le pose à environ 20 % d'opacité sous la fiche de la terre ; il doit donc être **plus clair en
haut, plus sombre et plus vide en bas**, avec un **centre calme**. Pas de personnage, pas de bâtiment au
premier plan. L'horizon haut, le ciel parlant de l'heure et de l'âge.

**Taille** : 1080 × 1920 (ratio 9:16), PNG ou WebP sans transparence. Une version **bandeau** peut être
recadrée en haut (1080 × 450) pour l'en-tête de la fiche.

Chaque prompt commence par `STYLE_BLOCK` et se termine par le **suffixe décor** :

> **SUFFIXE_DECOR** — vertical portrait composition 9:16, soft low-contrast landscape designed to sit
> behind text, lighter and detailed in the upper third, darker and empty in the lower half, calm centre,
> long atmospheric depth, painterly haze, no figures, no buildings in the foreground, muted palette

| Terre | Prompt (à placer entre `STYLE_BLOCK` et `SUFFIXE_DECOR`) |
|---|---|
| **La Lisière** | `a forest clearing at dawn seen from the grass: tall dark pines framing the sides, a huge old oak in the distance, low golden mist between the trunks, wildflowers in the foreground` |
| **La Plaine** | `an endless plain of tall golden grass moving in the wind under a huge pale sky, a few distant wild animals, a lone dry tree on the horizon, long soft clouds` |
| **La Rivière Lente** | `a wide slow river in the late afternoon with dark pebble banks, reeds at the edges, a low mist on the water, flat distant shore, silver reflections` |
| **Les Collines** | `layers of round green hills fading into blue distance, green and dark mineral veins visible on the nearest slope, a winding path of worn stone steps going up` |
| **Les Profondeurs** | `the inside of a natural cave gallery, soft amber light from deep within, dripping stalactites, smooth warm stone walls, bats resting high up, slightly unreal warmth` |
| **Le Désert de Verre** | `a vast desert at midday, long dunes, large flat slabs of translucent glass half buried in the sand catching aqua and amber light, heat shimmer, empty sky` |
| **Le Gisement Noir** | `a vast flat plain of black bitumen under a heavy overcast sky, glossy oil pools, faint vapour, rusted metal skeletons far away, ochre dusk light on the horizon` |
| **Les Pics Fracturés** | `towering fractured peaks split by a huge rift, snow and cold shadow, thin clouds between the summits, scree in the foreground, cold pale light` |
| **L'Orbite Basse** | `deep space seen from low orbit: the curve of a blue-green Earth at the bottom, a thin ring of drifting debris glinting, black sky with faint stars, silent` |
| **La Lune** | `a grey lunar plain with long soft shadows, a bright Earth small and far above the horizon, dust, absolute silence` |
| **Mercure** | `an ochre-pink scorched plain under an enormous white sun, cracks full of glowing molten metal, heat distortion, a hard dark sky` |
| **Le Caveau des Semeurs** | `a vast underground hall bathed in cold blue light, smooth tall walls fading into dark, calm still air, seen from the entrance, nothing revealed` |

## 3. Réglages, intégration, vérifications

- **Génère en plusieurs essais** et garde les images les plus **calmes**, pas les plus spectaculaires : elles
  doivent supporter du texte clair par-dessus.
- **Cohérence de la série.** Génère les 12 vignettes d'une seule traite avec le même `STYLE_BLOCK`, la même
  « graine » (seed) ou la même image de référence de style si ton outil en offre une. Compare-les côte à côte :
  même trait, même grain, même papier.
- **Fond transparent.** Si l'outil ne produit pas d'alpha, génère sur fond uni (vert fluo #00ff00) puis
  détoure ; pas de bord blanc.
- **Poids** : le jeu précache ses fichiers pour jouer hors ligne (budget actuel : 1,9 Mo). Vise **moins de
  60 Ko par vignette** et **moins de 150 Ko par décor** (WebP qualité 70–80, ou PNG optimisé), soit environ
  2,5 Mo pour les 24 images. Elles seront chargées au fur et à mesure (pas toutes au démarrage).
- **Noms de fichiers** : `assets/terres/<id>-carte.webp` et `assets/terres/<id>-decor.webp`, avec les
  identifiants du jeu : `lisiere`, `plaine`, `riviere`, `collines`, `mine`, `desert`, `gisement`,
  `montagnes`, `orbite`, `lune`, `mercure`, `caveau`.
- **Vérification de lisibilité** : colle chaque décor derrière une capture de la fiche de la terre à 20 % ;
  le texte doit rester lisible à 320 px de large, thème clair et thème sombre (Veillée).
- **Droits.** Note l'outil, le modèle et la date de chaque image dans `docs/CREDITS.md` ; vérifie que la licence
  de l'outil autorise l'usage dans un jeu publié.
