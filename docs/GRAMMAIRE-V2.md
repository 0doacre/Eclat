# Grammaire des contrôles, version 2 (proposition du 2 novembre 2026)

Remplace `DA-BOUTONS.md` (0.47) **si elle est adoptée**. Raison : les cadres à pans coupés et à double contour pèsent sur chaque écran, les boutons ont trop de mots dans une police d’imprimerie, et des icônes déjà claires (le bois, la croix) sont enfermées dans un contenant qui ne leur apporte rien. Décisions du porteur le 2 novembre 2026 : règle de couleur pour reconnaître ce qui se touche, ligne entière et chevron pour ce qui ouvre, trois niveaux de bouton, tuiles de ressources sans cadre.

## 1. Ce qu’on voit : une commande ou un objet

| | Aspect | Se touche ? |
|---|---|---|
| **Commande** | glyphe **monochrome**, encre foncée (`#3b2a1a`) | oui, toujours |
| **Objet du monde** | image **en couleur** (bois, hutte, outil) | seulement s’il réagit à l’appui (récolter, poser sur l’établi). Il s’enfonce un peu au toucher ; le guide l’apprend une fois. |
| **Texte** | encre, jamais dans un cadre sauf s’il est un bouton | non |

Conséquence : une icône qui se suffit **n’a plus de contenant**. Pas de rond autour de la croix, pas de cadre autour du bois.

## 2. Trois niveaux de bouton

| Niveau | Apparence | Quand |
|---|---|---|
| **Principal** | brique pleine, texte clair, 48 px | l’action de l’écran : Fabriquer, ▶ Récolter, Explorer. **Un seul par zone.** |
| **Secondaire** | papier, trait fin (1,5 px), coins 10 px, 40 px | une action avec un mot : × 10, Max, Compris, Tout relire |
| **Nu** | glyphe ou texte seul, sans fond ni trait | une commande connue (✕, ←, loupe, engrenage), un lien. Zone tactile 44 px, glyphe 24 à 28 px. |

Pas de niveau « danger » : les actions graves (relève, vider, acheter) gardent leur confirmation dans une fenêtre, et un mot (jamais une icône seule).

## 3. Quatre rôles

| Rôle | Il fait… | Apparence |
|---|---|---|
| **Commander** | quelque chose, tout de suite | un des trois niveaux ci-dessus |
| **Choisir** | une option parmi d’autres (outil, geste, filtre, métier) | glyphes nus côte à côte ; **l’option choisie a un anneau brique** de 2 px et son glyphe en brique |
| **Naviguer** | change d’écran ou de page | onglets : glyphe, le nom sous l’onglet ouvert, trait brique dessous. Retour : ← nu. |
| **Ouvrir** | ouvre une fenêtre ou un panneau | **une ligne entière de papier avec un chevron ›** à droite (Équipe ›, À construire ›). Les petites commandes qui ouvrent une feuille (loupe, ?) restent des glyphes nus. |

## 4. États

- **Appuyé** : l’élément s’enfonce (échelle 0,96), le glyphe passe en brique.
- **Choisi** : anneau brique 2 px (rond pour un glyphe, 12 px de rayon pour une tuile).
- **Désactivé** : 40 % d’opacité, aucun effet à l’appui.
- **En cours** : une barre brique de 4 px se remplit sous l’élément (l’étude).
- **Focus clavier** : contour brun net de 2 px, jamais retiré.

## 5. Tailles, polices, accessibilité

- Zone tactile **44 × 44 px** pour tout, même quand le dessin est plus petit (secondaire 40 px, glyphe 24 à 28 px).
- Boutons, chiffres, petites mentions : **Alegreya Sans**, semi-gras, 15 px. Titres et noms propres : la police d’imprimerie (IM Fell English), 18 px et plus.
- Tout contrôle nu a un nom accessible (`aria-label`) et une infobulle ; le Menu aura un réglage « Afficher les noms » qui remet un mot sous chaque icône.
- Contraste : texte 4,5 contre 1 au moins, glyphes 3 contre 1.

## 6. Ce qui disparaît

- Les octogones à double contour pour tout ce qui n’est pas l’action principale (`--cadre-papier`, `--cadre-brique` en `border-image`).
- Les ronds de papier autour des icônes (`assets/ui/rond-papier.svg`, `rond-brique.svg`) sauf le ▶ principal.
- Les cadres des tuiles de ressources.

## 7. Où ça se pose dans le code

Une couche unique (`css/fin.css`, chargée après `harmonie-sobre.css`) réécrit l’apparence ; les classes du jeu (`.btn`, `.ae-chip`, `.ae-geste`, `.terre-nav`, `.terre-ajout`…) ne changent pas, seul le rôle est ajouté en attribut (`data-role="choisir"`, `data-niveau="nu"`) là où le sélecteur ne suffit pas. L’essai a été fait par une feuille de style posée sur de vraies captures : voir la planche du 2 novembre 2026.
