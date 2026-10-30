# Âge de la Pierre — lot artistique v1

21 objets et installations correspondant aux objets d’âge `a: 2` du jeu, plus trois vignettes de gisements. Chaque visuel a été produit individuellement avec l’outil intégré ImageGen. Les prompts exacts sont dans `prompts.json`, les PNG originaux dans `masters/` et les encodages WebP dans `assets/carnet/items/` et `assets/carnet/sources/`.

La page `index.html` présente les images sur le papier existant, avec des échantillons à 48 et 32 pixels. Les deux objets secrets sont repliés. La présentation ne lit aucune sauvegarde et ne remplace pas le Domaine.

Le rouage est taillé dans le bois. L’automate est un mécanisme à contrepoids, pas un humanoïde. La hache, le couteau à manche d’os et la pioche ont des silhouettes distinctes. Les installations utilisent perches, pierre, fibres, briques et terre ; aucun équipement d’un âge ultérieur n’est introduit.

`nasse.webp` représente l’Argilière, nom actuel du jeu, malgré son identifiant historique. L’icône de matière et le gisement sont séparés pour l’argile, le silex et le sable. Le papyrus, les installations de la Lisière débloquées à cet âge et les objets secrets font partie du lot : ils ne doivent pas être révélés avant leurs conditions normales.

## Encodages

Objets : 256 px de côté maximum ; gisements : 384 px ; découvertes : 1280 px. Ratio et alpha préservés. Le script `encode-assets.py` effectue uniquement le redimensionnement d’export et l’encodage WebP, sans retouche du dessin. Les sources restent disponibles pour d’autres tailles.

## Intégration

Ce lot reste séparé du jeu réel pour sa revue artistique. Voir `INTEGRATION.md` pour les identifiants à raccorder. La planche liée de la Rivière Lente ajoute les trois découvertes de cette terre ; son paysage existant reste la référence géographique.
