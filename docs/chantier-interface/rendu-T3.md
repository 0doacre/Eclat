# Compte rendu · T3 : Réflexes de navigateur et transitions

- **État** : fait.
- **Ce qui change pour le joueur** : L'interface réagit comme une application native sans rebond de page, sans halo gris et sans menus parasites lors des appuis prolongés sur boutons ou images. Les changements d'onglet s'animent d'un fondu doux et réactif de 120 ms, coupé immédiatement si les mouvements réduits sont demandés.
- **Mesures** : Défilement page et milieu (#views) inchangés (0 px de débordement parasite aux 5 tailles : 320×568, 360×640, 390×700, 390×844, 430×932).
- **Tests** :
```
PW=<scratch>/node_modules/playwright CHROMIUM=<chrome> node tools/test-reflexes-ui.js
19 contrôles des réflexes de navigateur et transitions réussis.
npm test: 60 tests + 8 empreinte + 166 boutons + 14 serveur réussis.
tools/test-terres-fixe-ui.js: 264 contrôles réussis.
tools/test-ux.js: 54 contrôles de tenue des vues réussis.
```
- **Ce que je n'ai pas vérifié** : Le rebond élastique de bord d'écran, l'absence de halo tactile et le double tap ne se jugent que sur un vrai téléphone tactile (iOS Safari et Android Chrome).
- **Gestes à essayer sur téléphone par le porteur** :
  1. *Glisser vite vers le haut / bas* sur le fond : vérifier qu'aucun effet élastique de page n'apparaît.
  2. *Taper rapidement sur les boutons et onglets* : vérifier l'absence totale de halo gris / surbrillance bleue.
  3. *Appui long sur une image ou un bouton* : vérifier qu'aucun menu contextuel navigateur (copier/enregistrer l'image) ne s'ouvre.
  4. *Double appui rapide sur un contrôle* : vérifier l'absence de zoom intempestif.
  5. *Copier-coller* : vérifier que la sélection de texte fonctionne dans les champs, la sauvegarde, le Livre et l'Aide, mais reste inactive sur le reste de l'interface.
- **Choix qui reviennent au porteur** :
  - Ajustement de la durée de transition d'onglet (actuellement 120 ms, fondu avec léger glissement de 2 px). Capture : `docs/chantier-interface/captures/T3/vue-390.jpg`.
