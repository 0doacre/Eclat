# Âge du Cuivre — lot artistique v1

15 objets et installations correspondant aux objets d’âge `a: 3`, plus les gisements naturels de malachite et de cassitérite. Le gisement de pierre, déjà illustré, n’est pas remplacé.

Chaque image est produite individuellement avec l’outil intégré ImageGen. Les prompts exacts sont dans `prompts.json`, les PNG originaux dans `masters/`, et les encodages WebP dans `assets/carnet/items/` et `assets/carnet/sources/`. La page `index.html` montre les images sur le papier du jeu, avec des échantillons à 48 et 32 pixels. Le miroir et la tablette sont repliés.

Le cuivre reste rouge, irrégulier et martelé ; l’étain est gris clair. L’enclume est en pierre, le creuset en terre réfractaire. La mine de cuivre et la mine d’étain n’emploient pas de technologie moderne ; le métal industriel des découvertes appartient aux vestiges du récit.

`puits.webp` correspond à la Mine de cuivre, nom actuel d’un identifiant historique. `cassiterite_1.webp` représente la Mine d’étain. La meule de charbonnier est une installation de la Lisière débloquée à cet âge, pas un four de briques.

## Encodages et portée

Objets : 256 px de côté maximum ; gisements : 384 px ; découvertes : 1280 px. Ratio et alpha préservés. `encode-assets.py` effectue uniquement le redimensionnement d’export et l’encodage WebP, sans retouche de dessin. Les PNG restent disponibles pour d’autres tailles.

Le lot est séparé du jeu réel : aucun moteur, registre d’icônes, Domaine ou état de sauvegarde modifié. Les consignes de raccord figurent dans `INTEGRATION.md`. Le ZIP regroupe les WebP et les documents, sans dupliquer les PNG sources.
