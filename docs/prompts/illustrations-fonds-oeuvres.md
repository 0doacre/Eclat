# Prompts d'illustration : les Grands Œuvres et les fonds d'écran

Suite de `illustrations-terres.md` : même `STYLE_BLOCK`, même négatif, mêmes règles de poids et de crédits
(reprends-les de ce fichier). Aucun secret ici. Les trois Grands Œuvres dont le nom est caché sont dans
`docs/coffre/illustrations-oeuvres-secretes.md` (à passer au générateur sans le lire).

## 1. Les Grands Œuvres publics (une illustration chacun, plus une par étape)

Format : **carte 4:3, 1200 × 900**, WebP sans transparence, moins de 120 Ko. Elle s'affiche en tête de la fiche
du chantier, puis s'allume étape par étape (même image en niveaux de gris, couleur quand l'étape est faite :
génère donc **l'œuvre achevée**, le jeu fait le reste). Fichier : `assets/oeuvres/<id>.webp`.

| Id | Prompt (entre `STYLE_BLOCK` et « wide 4:3 composition, centred subject, calm dark background ») |
|---|---|
| `dyson` | `a swarm of thousands of small mirror panels in orbit around the sun, forming a delicate golden lattice that dims the star, a tiny blue Earth far below protected behind a pale shield, seen from deep space` |
| `brisemonde` | `an enormous ring accelerator circling the Moon, a thin white beam leaving its centre toward a distant star, cold blue and white, tiny supports and lights along the ring` |

Étapes (facultatif, 4 petites vignettes 600 × 450 par œuvre, mêmes noms de fichier avec `-1` à `-4`) :
- Dyson : un rail de cent kilomètres sur Mercure ; le premier anneau de panneaux ; l'essaim qui assombrit le Soleil ; le bouclier devant la Terre.
- Brise-Monde : l'anneau de supraconducteurs ; la réserve d'antimatière en cuve magnétique ; la lentille gravitationnelle ; le canon prêt à tirer.

## 2. Les fonds de page

Fond **très discret** (le texte clair et sombre passe par-dessus), 1080 × 1920, WebP, moins de 120 Ko chacun,
**papier et ombres seulement**, aucune scène nette. Fichier : `assets/fonds/<nom>.webp`. Ils se posent sous le
contenu à 12 à 20 % d'opacité, avec un voile en bas.

Suffixe commun : `vertical 9:16, seamless soft texture, extremely low contrast, no objects in the centre, even lighting, no text`.

| Nom | Où | Prompt (entre `STYLE_BLOCK` et le suffixe) |
|---|---|---|
| `carnet` | Carnet de l'Atelier | `a worn field notebook page, faint ruled lines, ink stains and pressed leaf marks in the margins, coffee ring, warm cream paper` |
| `journal` | Journal et Cosmos | `an old logbook page, ink smudges, a faint star chart drawn very lightly in brown ink, fold crease down the middle, parchment` |
| `domaine` | Domaine, entre les fiches | `a dark wooden workbench seen from above, subtle wood grain, scattered chalk marks and a few tool shadows, warm dim light` |
| `atelier` | Atelier, établi | `a craftsman's table covered in old leather, faint tool outlines burned into it, pencil diagrams, dim candle light` |
| `memoire` | Mémoire des mains | `a night-sky vellum page with faint hand-drawn constellations linked by thin lines, deep blue-brown, soft dust` |
| `veillee` | thème sombre (Veillée), partout | `near-black paper with faint warm fibres, a barely visible glow in the upper corner as if from a lantern` |

## 3. Quoi livrer

Dépose les fichiers dans une branche (comme `0doacre-patch-1`), avec un court `README` qui dit ce qui est
générique (fonds) et ce qui est transparent ou pas. Je les intègre ensuite (fonds en CSS, œuvres sur la fiche
du chantier). Noter l'outil, le modèle, la date et la licence dans `docs/CREDITS.md`.
