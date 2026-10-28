# Le Carnet du Semeur — intégration au jeu

Le mode affiché **Carnet** remplace l’habillage de Vivant. Son identifiant interne `vivant` et la clé `eclat.preview.style` restent compatibles avec les choix existants. Atlas et Classique restent disponibles.

Le papier, les commandes peintes et les encres restent stables à travers les âges. Seuls les titres des terres évoluent : IM Fell English au début, Playfair Display à partir de l’Acier, Space Grotesk au Spatial et au Stellaire. Les quantités, actions et textes de lecture gardent leur police. Le Carnet affiche toujours son papier clair ; la préférence de thème sombre n’est pas réécrite et reprend effet en quittant Carnet. Son menu n’offre donc pas de bascule clair/sombre.

## Domaine réel

Les feuilles affichent les terres ouvertes du moteur : noms et descriptions, explorations, règles locales, maîtrise, stocks, débits, récolte continue, extracteurs et ruines. Les terres anciennes restent repliables. Objectifs, demandes du Comptoir, projets et proposition de relève conservent leurs conditions et leurs actions. Aucune valeur ou action du prototype de démonstration n’est utilisée dans le jeu.

Les paysages peints validés couvrent La Lisière, La Rivière Lente à partir de la Vapeur et Mercure. Les autres terres reprennent leur décor existant avec un bord fondu dans le papier ; le Caveau conserve sa feuille sans inventer de paysage. Les outils, matières et sources déjà livrés restent présents. Deux images supplémentaires représentent le métal mercurien et la pompe à eau.

Les boutons peints et les fenêtres sont partagés avec les autres écrans en mode Carnet, y compris les ateliers des deux branches. Leurs événements et libellés restent natifs. Les maîtres validés et prompts de référence sont conservés dans la PR artistique et `docs/art-direction/interface-peinte-v2/` sur main.

## Diffusion et cache

`tools/export-interface-peinte.py` produit neuf variantes WebP, environ 1,62 Mo au total. Les originaux ne sont pas modifiés. Sur un checkout dépourvu des maîtres, utiliser `--source` avec le dossier de la page témoin récupéré depuis main. Le service worker cache les variantes utilisées et les décors existants nécessaires aux autres terres. Aucun PNG maître, capture ou document de revue n’est ajouté à son cache.

## Validation

- Suite complète `npm test`.
- `npm run test:carnet-ui` : parties jetables Bois, Vapeur et Stellaire à 320, 390 et 1280 px, avec une préférence sombre existante. Vérifie papier, nom, époque, largeur et cibles, récolte réelle, valeurs de Mercure, menu, Atelier et retour au thème sombre hors Carnet.
- Une session supplémentaire installe le véritable service worker et recharge le Carnet hors ligne avec son paysage de Mercure.
- Les deux moteurs et les formats de sauvegarde propres aux branches restent séparés ; les mêmes ressources et le même habillage commun sont reportés dans la preview.
