# Illustrations — Craftgame

Illustrations sélectionnées et validées en conversation le 24 octobre 2026 (crédits : `docs/CREDITS.md`).

- `assets/oeuvres/<id>.webp` : chaque Grand Œuvre achevé. Le Journal montre l’œuvre entière.
- `assets/oeuvres/<id>-<n>.webp` : la vignette d’une étape (600 × 450), montrée sur le chantier du Domaine.
  La table `D.OEUVRE_ETAPES` (`js/data.js`) dit quelles étapes en ont une ; les autres reprennent l’œuvre entière.
- `assets/fonds/` : textures de fond (1080 × 1920), à 14 % sous un voile : `domaine`, `atelier` (et Machines),
  `carnet`, `journal` en thème clair ; `veillee` partout en thème sombre. `memoire` n’est pas encore posé
  (la Mémoire des mains est une fenêtre, pas une page).
- Tous les fichiers sont WebP, sans transparence, moins de 120 Ko. `ILLUSTRATIONS-MANIFEST.json` donne,
  pour chacun, son numéro dans la planche des sources (`source_index`).

Chaque étape de Dyson et du Brise-Monde a sa vignette ; une étape sans vignette reprendrait l’œuvre entière.

Note (25 octobre 2026) : le premier export avait décalé d’un cran les sources à partir du n° 19
(`chant` montrait le Brise-Monde, `brisemonde-3` la Cloche, les étapes de Dyson étaient mélangées).
Les fichiers ont été remis à leur place ; `brisemonde-1` (n° 24), `brisemonde-3` (n° 21) et `dyson-2` (n° 28) ont été refaits
depuis les originaux.
