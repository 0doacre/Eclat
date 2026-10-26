# Refonte du menu et interfaces façon jeu vidéo (0.35.1)

> Spécification du tableau de bord de pause, des commutateurs console et du HUD.

---

## 1. Intention et cadre de conception

Le menu d'Éclat, initialement conçu comme une simple superposition de réglages textuels défilants, a été entièrement repensé pour offrir une véritable expérience de **jeu vidéo** (façon dashboard / écran de pause console et mobile).

Objectifs :
1. **Identité visuelle forte & HUD de jeu** : Présentation du statut du joueur (Semeur actuel, âge atteint, réserve de Traces, Échos éveillés, temps de jeu) dans un en-tête immersif dès l'ouverture du menu.
2. **Navigation par catégories (Quick Jump)** : Fin du défilement uniforme interminable grâce à une barre de navigation par onglets thématiques (`🎮 Jeu`, `🖥️ Affichage`, `🔊 Audio`, `⚙️ Système`).
3. **Composants tactiles "Jeu Vidéo"** :
   - Commutateurs `.btn.sw` inspirés des interrupteurs de console, dotés de voyants LED néon (vert lumineux quand actif, éteint et biseauté quand inactif).
   - Curseurs audio interactifs avec affichage du pourcentage en temps réel (`0 %` à `100 %`) et retour sonore immédiat.
   - Cartes de raccourcis (`.m-card-btn`) avec icônes grand format, sous-titres contextuels et retours tactiles au toucher.
4. **Isoloir de sécurité pour la remise à zéro** : Le bouton *Recommencer la partie* est isolé dans une zone d'avertissement dédiée, évitant tout faux contact avec les réglages du quotidien.
5. **Finitions des diverses interfaces** :
   - Barre supérieure (`#top`) avec bordure lumineuse et liseré de profondeur.
   - Barre de progression d'âge avec extrémité néon pulsante.
   - Boutons d'action principaux (`.btn.pri`) avec relief de touche tactile et surbrillance supérieure.
   - Barre d'onglets inférieure (`#tabs`) avec indicateurs de sélection luminescents et micro-animations.

---

## 2. Structure du Menu

```
┌────────────────────────────────────────────────────────┐
│  ÉCLAT v0.35.0                                         │
│  Semeur 7e  ·  Âge du Bois  ·  ✦ 12 Traces  ·  🌅 1/5  │
├────────────────────────────────────────────────────────┤
│  [ 🎮 Jeu ]  [ 🖥️ Affichage ]  [ 🔊 Audio ]  [ ⚙️ Système ] │
├────────────────────────────────────────────────────────┤
│ 🎮 JEU & RACCOURCIS                                    │
│   ┌───────────────────────┐ ┌────────────────────────┐ │
│   │ ✦ Mémoire des mains   │ │ 🪙 Le Comptoir         │ │
│   │   12 Traces dispos    │ │    Troc & commandes    │ │
│   └───────────────────────┘ └────────────────────────┘ │
│   • Guide des Semeurs [ Revoir ]  [ • ACTIVÉ ]         │
│   • Visiteurs de passage          [ • ACTIVÉ ]         │
├────────────────────────────────────────────────────────┤
│ 🖥️ AFFICHAGE & ÉCRAN                                   │
│   • Thème visuel                  [   Jour / Sombre  ] │
│   • Affichage compact             [ • DÉSACTIVÉ ]      │
│   • Carnet sur deux colonnes      [ • ACTIVÉ ]         │
│   • Ligne d'ambiance              [ • ACTIVÉ ]         │
│   • Grand texte                   [ • DÉSACTIVÉ ]      │
├────────────────────────────────────────────────────────┤
│ 🔊 AUDIO & VIBRATIONS                                  │
│   • Son principal                 [ • ACTIVÉ ]         │
│   • 🎵 Musique     [═══════●═══]   75 %                │
│   • 🍃 Ambiance    [═════════●═]   85 %                │
│   • 🔨 Bruitages   [══════●════]   60 %                │
│   • Vibrations haptiques          [ • ACTIVÉ ]         │
├────────────────────────────────────────────────────────┤
│ ⚙️ SYSTÈME & SAUVEGARDES                               │
│   [ 💾 Sauvegardes ]    [ ☁️ Compte en ligne ]          │
│   [ ❓ Comment jouer ]  [ 📰 Nouveautés ]               │
│   [ 📜 Crédits ]        [ 📲 Installer ]                │
│                                                        │
│   ───────────────────────────────────────────────────  │
│   [ 🗑️ Recommencer la partie ]                         │
├────────────────────────────────────────────────────────┤
│                 [   FERMER   ]                         │
│  Éclat · du silex aux étoiles · ⏱️ 14h 22m de jeu       │
└────────────────────────────────────────────────────────┘
```

---

## 3. Compatibilité et tests

- Respect absolu des attributs ARIA (`role="switch"`, `aria-checked="true|false"`), des intitulés (`Activé` / `Désactivé`) et des sélecteurs `data-m="..."`.
- Tous les boutons sont expliqués via leurs attributs `title` (validé par `tools/test-boutons.js`).
- Tests unitaires et structurels dans `tools/test-menu-ui.js`.

---

## 4. Sauvegardes, Compte et Restauration vidéo-ludiques

En complément du menu de pause, les fenêtres de gestion de partie et de synchronisation ont été clarifiées pour offrir une lisibilité exemplaire façon save-picker RPG :

1. **Sauvegardes locales et exports (`openSaves`)** :
   - Grille d'actions explicites : *Télécharger ma sauvegarde* (.json) et *Charger un fichier*.
   - Badge d'état de persistance rassurant (*Le navigateur s'est engagé à garder cette partie* ou avertissement clair).
   - Cartes de copies de sécurité automatiques (`backup-card`) : extraction des métadonnées de la partie (Âge atteint, numéro de Semeur, temps de jeu cumulé, nombre de recettes connues, Traces ✦) avec puces thématiques au lieu d'une ligne technique brute `format v11`.
   - Boutons clairs par copie : téléchargement direct (`⬇️`) et restauration en un clic (`Restaurer`).

2. **Duel visuel de versions (`confirmReplace` & `chooseVersion`)** :
   - Mise en vis-à-vis côte-à-côte *Partie à charger* (vert/good) vs *Partie actuelle archivée* (lueur d'avertissement).
   - Détail instantané des différences : Âge, Semeur, temps de jeu, recettes, Traces.
   - Message rassurant confirmant qu'une copie de l'état actuel est immédiatement archivée avant tout remplacement.

3. **Compte Semeur et gestion des 3 emplacements cloud (`accountModal`, `slotLine`, `slotModal`)** :
   - Carte de profil Semeur en ligne avec avatar et date de dernière synchronisation.
   - 3 cartes d'emplacements (`slot-card`) avec pastille *Actif* / *Réserve*, statut de sauvegarde en ligne (ou emplacement vide), et bouton *Gérer*.
   - Commutateur d'envoi automatique stylisé.
   - Formulaire de connexion (`loginModal`) avec onglets segmentés *🔑 J’ai un compte* / *✨ Nouveau compte*, placeholders clairs, et note sur le chiffrement de bout en bout.
