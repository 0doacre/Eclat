# Gemini — Intégrer les illustrations du premier âge dans « Vivant »

Intègre le premier lot d'illustrations produit par Codex et ImageGen dans le mode **Vivant**, sur ta branche de travail. La direction retenue est « Le Carnet du Semeur » : encre brun-noir, lavis de matière désaturé, continuité avec les paysages de l'Atlas. Les images sont déjà produites : conserve leur dessin et leur palette pendant l'intégration.

## Récupérer le lot

L'archive est versionnée dans ce dépôt :

`docs/art-direction/age-bois-v1/da-age-bois-v1.zip`

- Taille : **29 213 972 octets**.
- SHA-256 : `02ce580dd6b576bdec3c1ed59a2223378f3898ebd288566a4971f6cc668c7f6b`.
- Elle contient le dossier `da-age-bois-v1/`.

Extrais-la dans un dossier de travail, puis lis d'abord :

- `README-GEMINI.md` : direction et consignes d'intégration ;
- `manifest.json` : correspondances avec les identifiants du jeu, dimensions et empreintes ;
- `preview.html` et `qa/contact-sheet.png` : comparaison sur fonds clair et sombre, à 96, 48 et 32 pixels ;
- `qa/visual-review.md` : observations et points d'attention.

Les prompts de génération sont également fournis : `prompt-commun.txt` et les champs `subject` de `asset-specs.json`.

## Périmètre exact

Le premier âge est l'**Âge du Bois**, indice `0` dans les données. Le lot contient **19 PNG maîtres avec transparence** :

- 14 objets communs : `bois`, `fibre`, `caillou`, `manche`, `corde`, `panier`, `archet`, `feu`, `charbon`, `epieu`, `cabane`, `torche`, `fibre_1`, `caillou_1` ;
- 2 outils de la preview équipée : `percuteur_pierre`, `etabli_amenage` ;
- 3 sources de récolte : `source_bois`, `source_fibre`, `source_caillou`.

Les curiosités, les lieux d'exploration et les âges suivants ne sont pas illustrés dans ce lot. Conserve leurs représentations existantes.

## Travail demandé

1. **Préparer les variantes web.** Garde les PNG maîtres intacts dans l'archive. Exporte seulement les tailles utiles au jeu, avec alpha, en PNG ou WebP, et compare le résultat aux originaux avant de choisir la compression. Les maîtres totalisent environ 29 Mo et ne doivent pas être tous chargés tels quels dans le jeu.
2. **Ajouter un registre adapté.** Utilise les identifiants du manifeste et distingue les contextes « objet » et « source de récolte ». Dans le Domaine, le bois se récolte sur l'arbre ; dans la Réserve et les recettes, le bois est représenté par la bûche. Même distinction pour fibres et pierre.
3. **Respecter la génération des icônes.** `js/icons.js` est généré par `tools/icons.js` depuis `tools/icons.json`. Adapte la source ou le générateur, ou crée un registre d'illustrations séparé. Évite une modification manuelle qui disparaîtrait à la prochaine génération.
4. **Intégrer dans Vivant.** Raccorde les illustrations à la Réserve, à l'Établi et au Domaine lorsque leur usage le justifie. Conserve le repli SVG pour les éléments non couverts et pour les autres modes. Les illustrations ne doivent pas révéler les objets encore inconnus. Les outils propres à la preview ne doivent pas apparaître dans le profil classique.
5. **Préserver le rendu.** Utilise `object-fit: contain`, des proportions intactes et une marge de présentation cohérente. Évite les filtres CSS hérités des pictogrammes monochromes : ils ne doivent pas effacer les couleurs de matière. La couleur de l'âge reste un indice d'interface ou d'état.
6. **Raccorder les interactions.** Conserve une cible tactile stable et des retours brefs à la récolte. Les effets et les états s'ajoutent à l'affichage sans être peints dans les fichiers ni provoquer de déplacement de la mise en page.
7. **Vérifier les contrastes.** Le charbon est le cas le plus délicat sur fond sombre : prévois un emplacement légèrement plus clair et vérifie la lecture à 32 px. L'archet doit conserver un nom et un libellé accessible. Les sources végétales peuvent être montrées plus grandes dans le Domaine.
8. **Mettre à jour le cache.** Ajoute uniquement les variantes réellement utilisées au service worker, jamais le ZIP de travail ni toute la collection de grands maîtres. Recalcule l'empreinte avec le workflow du dépôt et vérifie le fonctionnement hors ligne.

## Validation et livraison

Vérifie les thèmes clair et sombre, les petits écrans et les affichages à 32/48 px. Contrôle notamment la distinction matière/source, les objets inconnus, les commandes, les interactions de récolte et le repli SVG. Lance `npm test` et les parcours navigateur appropriés aux écrans modifiés ; régénère l'inventaire des boutons si tu changes leurs libellés ou leurs actions.

Termine avec un commit d'intégration et un bilan indiquant les fichiers ajoutés, le poids des variantes diffusées et mises en cache, les tests effectués et les éventuelles limites visuelles restantes. Il n'est pas nécessaire de changer l'équilibrage ou les règles du jeu pour ce travail.
