# La grammaire des contrôles (0.47)

Source de vérité : `css/boutons.css`. Un contrôle = un rôle = une apparence. Si un contrôle ouvre une page, il ne peut pas ressembler à un contrôle qui ouvre une fenêtre.

| Rôle | Il fait… | Apparence | Exemples |
|---|---|---|---|
| **Action** | quelque chose (fabriquer, embaucher, récolter) | octogone de papier ; principal : octogone brique | `.btn`, `.btn.pri`, `.mini`, `.forge-btn`, boutons du haut (`.chip`, `.icon-btn`) |
| **Ouvre-fenêtre** | ouvre une fenêtre ou un panneau | le même octogone, suivi d'un chevron `›` (classe `.ouvre`) | `Objectif ›`, `Comptoir ›`, `Ce qui tourne ›` |
| **Onglet** | change de page | texte souligné, sans cadre ; actif : souligné brique | `Produire / Carnet / Machines`, `Chemin / Secrets / Gestes…`, métiers du Labo, `Fragments / Signes`, onglets des fenêtres |
| **Filtre** | trie ce qui est déjà à l'écran | petit octogone de papier ; actif : octogone brique | `Toutes / À portée / Prêtes`, `Utiles / Tout / En réserve`, gestes d'un outil |
| **Tuile** | choisit une recette ou un élément | octogone ; la couleur de bordure dit l'état : trouvée (vert), vue (brun), à trouver (pointillés) | recettes de la Progression, ateliers, fragments du Journal |
| **Panneau** | contient (n'est pas un bouton) | cadre peint (`--paint-frame`) | cartes du Labo, de l'Atelier, du Carnet, de la Progression |

## Le cadre en neuf zones

Les cadres sont des SVG (`assets/ui/cadre-*.svg`, 96 × 96) utilisés en `border-image` avec une découpe en neuf zones :

```
┌────┬────────┬────┐   quatre coins : taille fixe (ils gardent l'octogone)
│ c1 │  bord  │ c2 │   quatre bords : s'étirent dans un seul sens
├────┼────────┼────┤   un centre : s'étire dans les deux sens
│bord│ centre │bord│
├────┼────────┼────┤   border-image: <cadre> 24 fill / <épaisseur> / 0 stretch
│ c3 │  bord  │ c4 │
└────┴────────┴────┘
```

- **24** : l'épaisseur des coins dans le dessin (en unités du SVG) ; **`--cadre-b`** : leur taille à l'écran (14 px pour un bouton, 10 px pour un filtre ou un bouton du haut, 12 px pour une carte).
- Le cadre est porté par un pseudo-élément `::before` en `inset: 0`, derrière le texte : le bouton garde sa zone de clic et son focus.
- Quel que soit le format du bouton (44 × 44 ou pleine largeur), les coins ne se déforment pas.
- Pour créer une variante : copier un SVG, garder la même géométrie (le chanfrein entre 0 et 24 unités), changer couleurs et traits ; l'ajouter à `FILES` dans `sw.js`.

## Règles pour la suite

1. Un bouton nouveau choisit un rôle dans le tableau, pas une apparence.
2. Un onglet n'a jamais de cadre ; un filtre n'ouvre jamais de fenêtre.
3. Un bouton qui ouvre une fenêtre porte `.ouvre` (chevron).
4. États : actif = brique, désactivé = gris atténué, focus = contour brun net.

## Reste à faire

Les pastilles d'objet (`itemPill`) sont encore des gélules arrondies ; les anciennes feuilles (`style.css`, `design-preview.css`) gardent des règles qui ne servent plus que hors du mode vivant et disparaîtront avec les styles.

## Ressources nues, tailles stables, nombres courts (0.47.1)

- **Ressources nues** : l'image d'une ressource ou d'une recette s'affiche seule, sans second cadre blanc autour. Le bouton qui la porte (récolter, choisir une tuile) garde sa zone de clic de 44 px mais sans fond ni bordure.
- **Taille stable** : un bouton ne change pas de taille quand son état change. Exemple : le bouton de récolte en continu garde 56 × 44 px que ce soit « ▶ » ou « ■ ».
- **Le texte rétrécit, pas le bouton** : `js/ajuste-texte.js` réduit la police (jusqu'à 70 %) d'un contrôle d'une seule ligne dont le texte ne tient pas (boutons du haut, pastilles, filtres, puces). Pour l'appliquer à un nouvel élément : lui donner `data-fit`.
- **Nombres courts** : tout nombre affiché passe par `fmt()` (k, M, G, T, P, E, Z) ; la valeur exacte reste dans l'info-bulle ou le libellé d'accessibilité quand c'est utile.

## Le menu (0.48)

Cinq onglets, une rubrique affichée à la fois (`.menu-sec[hidden]`, onglet retenu dans `U.menuOnglet`) : **Jeu** (Mémoire, Comptoir, guide, visiteurs), **Affichage**, **Audio**, **Système** (mode test, sauvegardes, compte, installer, mise à jour, recommencer), **Aide** (état des productions, signaler un problème, comment jouer, nouveautés, crédits). Le bouton « Reprendre » remplace « Fermer ». Les sauvegardes : enregistrer un fichier, reprendre un fichier, copies de sécurité (restaurer) ; l'ancien code texte est retiré. Le compte porte une silhouette (`COMPTE` dans `js/compte.js`).

## Progression (0.48.1)

- **Décompte d'un âge** : « trouvées / recettes » = les recettes trouvées sur les recettes montrées par la grille (trouvées + cases « ? »). Les matières vues (Os, Peau, Bois…) ne comptent pas : elles ont leur rangée « Matières vues » sous la grille. Une recette secrète n'entre dans le compte qu'une fois trouvée. Les outils cachés du profil d'équipement (établi aménagé, racloir remplacé, polissoir) n'en font plus partie, ce qui faisait paraître « 13 / 14 » alors que la grille montrait autre chose.
- **Cosmos** : dernière page de la Progression (`Chemin · Secrets · Gestes · Fins · Mémoire · Cosmos`), visible dès qu'un instrument d'observation est possédé. Le Journal revient à une seule page. Le bouton garde `data-tab2="cosmos"`.
