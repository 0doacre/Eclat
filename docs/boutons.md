# Les boutons de l’interface

Fichier généré par `node tools/boutons.js` (Playwright, chromium, 390×844 puis 900×900 pour le Carnet à deux colonnes, service worker bloqué) : ne pas le corriger à la main, relancer l’outil.

| | |
|---|---|
| Boutons relevés | 166 |
| Sans explication | 0 |
| Écrans | le Domaine, la Carte, l’Atelier et ses pages, le Carnet, l’Arbre, le Journal et ses onglets, le Cosmos, une fiche, le Comptoir, le menu, la fiche d’aide |
| Parties | une neuve, une avancée (`save-v5-age8-usine`), la même en écran large |

## Aide (4 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | (sans mot) | `button[data-m="close"].modal-x` | lecteur d’écran : Fermer |
| neuve | Compris | `button[data-m="close"].btn` | fiche Aide |
| avancée | (sans mot) | `button[data-m="close"].modal-x` | lecteur d’écran : Fermer |
| avancée | Compris | `button[data-m="close"].btn` | fiche Aide |

## Domaine (41 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Bois ÂGE 1/15 | `button#ageBtn.age` | info-bulle : Toucher pour voir les étapes de cet âge ; lecteur d’écran : Âge du Bois : étapes de l’âge |
| neuve | 1 | `button#memBtn.chip.mem` | info-bulle : Souvenirs : 1 (toucher pour ouvrir la Mémoire des mains) ; lecteur d’écran : Souvenirs : 1 (Mémoire des mains) ; guide (#memBtn) |
| neuve | ☰ | `button#menuBtn.icon-btn` | lecteur d’écran : Menu |
| neuve | Manche | `button[data-terre-panel="obj"].pastille.terres-pastille` | guide ([data-terre-panel="obj"]) |
| neuve | (sans mot) | `button[data-terre-go="lisiere"].terres-icone.is-courante` | lecteur d’écran : La Lisière |
| neuve | ‹ | `button[data-terre-nav="-1"].terre-nav` | lecteur d’écran : Terre précédente |
| neuve | Explorer · Le Grand Chêne | `button[data-exp="lisiere"].btn` | info-bulle : Lancer cette exploration : elle avance toute seule ; guide ([data-exp]) |
| neuve | (sans mot) | `button[data-harv="lisiere:bois"].terre-recolte` | lecteur d’écran : Récolter : Bois |
| neuve | Bois 0 à la main | `button[data-gsheet="lisiere:bois"].gis-compact-btn.terre-gis-corps` | lecteur d’écran : Bois : gérer les extracteurs |
| neuve | (sans mot) | `button[data-hloop="lisiere:bois"].mini.harvest` | info-bulle : Récolte en continu, même jeu fermé ; lecteur d’écran : Récolter en continu : Bois ; guide ([data-hloop="lisiere:bois"]) |
| neuve | Le camp · La forêt reste à découvrir | `figure[data-carnet-scene="lisiere"][data-contempler="lisiere"].carnet-landscape.carnet-discovery-land` | info-bulle : Agrandir et contempler l’aquarelle : Le Grand Chêne ; lecteur d’écran : Contempler l’aquarelle : Le Grand Chêne |
| neuve | Maîtrise · 0 % ? | `summary` | info-bulle : Voir les objectifs de cette terre et son bonus à la relève |
| neuve | ? | `button[data-aide="maitrise"].btn-aide.mini` | info-bulle : Comprendre la maîtrise des terres et la transmission ; lecteur d’écran : Comprendre la maîtrise des terres et la transmission |
| neuve | 🖼️ Contempler | `button[data-contempler="lisiere"].btn.mini` | lecteur d’écran : Contempler l’aquarelle de cette terre : La Lisière |
| neuve | Terres | `button[data-tab="domaine"]` | info-bulle : Tes terres : une à la fois, glisse pour passer de l’une à l’autre |
| neuve | Labo | `button[data-tab="labo"]` | info-bulle : Essayer : poser des ressources, choisir un geste, découvrir |
| neuve | Progression | `button[data-tab="arbre"]` | info-bulle : Ta progression : le chemin, les secrets, les gestes, la mémoire |
| neuve | Journal | `button[data-tab="journal"]` | info-bulle : Ce que tu as trouvé et compris ; guide (#tabs [data-tab="journal"]) |
| avancée | Électricité ÂGE 9/15 0/6 | `button#ageBtn.age` | info-bulle : Toucher pour voir les étapes de cet âge ; lecteur d’écran : Âge de l’Électricité : étapes de l’âge |
| avancée | 0/3 | `button#questBtn.chip.quest` | info-bulle : Quêtes : 0 sur 3 accomplies (toucher pour ouvrir) ; lecteur d’écran : Quêtes : 0 sur 3 |
| avancée | +18 | `button#memBtn.chip.mem` | info-bulle : Relève : +18 Souvenirs à gagner (toucher pour voir la Mémoire) ; lecteur d’écran : Souvenirs à gagner : +18 (Mémoire des mains) ; guide (#memBtn) |
| avancée | 22 | `button#intuBtn.chip.intu` | info-bulle : Intuition : 22 (toucher pour voir le détail) ; lecteur d’écran : Intuition : 22 ; guide (#intuBtn) |
| avancée | ☰ | `button#menuBtn.icon-btn` | lecteur d’écran : Menu |
| avancée | Chemin de fer | `button[data-terre-panel="obj"].pastille.terres-pastille` | guide ([data-terre-panel="obj"]) |
| avancée | (sans mot) | `button[data-terre-go="lisiere"].terres-icone.is-traversee` | lecteur d’écran : La Lisière, terre traversée |
| avancée | (sans mot) | `button[data-terre-go="mine"].terres-icone.is-courante` | lecteur d’écran : Les Profondeurs |
| avancée | ‹ | `button[data-terre-nav="-1"].terre-nav` | lecteur d’écran : Terre précédente |
| avancée | Voir : Torche | `button[data-goto="torche"].btn` | guide (.dom-regle.gene) |
| avancée | Compris | `button[data-tip="tip_site"].btn.ghost` | info-bulle : Fermer cette astuce |
| avancée | (sans mot) | `button[data-harv="mine:fer_min"].terre-recolte` | lecteur d’écran : Récolter : Minerai de fer |
| avancée | Minerai de fer 544 +48/min à la main | `button[data-gsheet="mine:fer_min"].gis-compact-btn.terre-gis-corps` | lecteur d’écran : Minerai de fer : gérer les extracteurs |
| avancée | (sans mot) | `button[data-hloop="mine:fer_min"].mini.harvest` | info-bulle : Récolte en continu, même jeu fermé ; lecteur d’écran : Récolter en continu : Minerai de fer |
| avancée | + mine de fer | `button[data-xadd="mine:fer_min"][data-n="1"].mini.terre-ajout` | lecteur d’écran : Poser mine de fer |
| avancée | Maîtrise · 80 % ? | `summary` | info-bulle : Voir les objectifs de cette terre et son bonus à la relève |
| avancée | ? | `button[data-aide="maitrise"].btn-aide.mini` | info-bulle : Comprendre la maîtrise des terres et la transmission ; lecteur d’écran : Comprendre la maîtrise des terres et la transmission |
| avancée | 🖼️ Contempler | `button[data-contempler="mine"].btn.mini` | lecteur d’écran : Contempler l’aquarelle de cette terre : Les Profondeurs |
| avancée | Terres | `button[data-tab="domaine"]` | info-bulle : Tes terres : une à la fois, glisse pour passer de l’une à l’autre |
| avancée | Labo | `button[data-tab="labo"]` | info-bulle : Essayer : poser des ressources, choisir un geste, découvrir |
| avancée | Atelier | `button[data-tab="atelier"]` | info-bulle : Produire : quoi fabriquer, en quelle quantité, et qui s’en charge |
| avancée | Progression | `button[data-tab="arbre"]` | info-bulle : Ta progression : le chemin, les secrets, les gestes, la mémoire |
| avancée | Journal | `button[data-tab="journal"]` | info-bulle : Ce que tu as trouvé et compris ; guide (#tabs [data-tab="journal"]) |

## Labo (35 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Artisanat | `button#ae-metier-artisanat[data-ae="metier"][data-value="artisanat"].btn` | info-bulle : Essayer, au Labo, les recettes de ce métier |
| neuve | Bâtiment | `button#ae-metier-construction[data-ae="metier"][data-value="construction"].btn` | info-bulle : Essayer, au Labo, les recettes de ce métier |
| neuve | 🐑 Subsistance | `button#ae-metier-elevage[data-ae="metier"][data-value="elevage"].btn` | info-bulle : Essayer, au Labo, les recettes de ce métier |
| neuve | + | `button#ae-slot-0[data-ae="slot"][data-value="0"].btn.ae-empty` | info-bulle : Poser ou retirer une ressource dans cet emplacement |
| neuve | + | `button#ae-slot-1[data-ae="slot"][data-value="1"].btn.ae-empty` | info-bulle : Poser ou retirer une ressource dans cet emplacement |
| neuve | + | `button#ae-slot-2[data-ae="slot"][data-value="2"].btn.ae-empty` | info-bulle : Poser ou retirer une ressource dans cet emplacement |
| neuve | Tailler | `button#ae-forge-tailler[data-ae="forge"][data-value="tailler"].btn` | guide (#ae-forge-tailler) |
| neuve | (sans mot) | `button#ae-tool-mains[data-ae="tool"][data-value="mains"].ae-chip.ae-outil` | info-bulle : Mains ; lecteur d’écran : Mains ; guide (.ae-tools) |
| neuve | (sans mot) | `button#ae-tool-percuteur_pierre[data-ae="tool"][data-value="percuteur_pierre"].ae-chip.ae-outil` | info-bulle : Percuteur de pierre ; lecteur d’écran : Percuteur de pierre ; guide (.ae-tools) |
| neuve | Vider | `button#ae-clear-0[data-ae="clear"][data-value=""].btn.ghost` | info-bulle : Retirer toutes les ressources de l’établi et les remettre en réserve ; guide (.ae-tools) |
| neuve | Utiles | `button[data-ae="filtre"][data-value="utiles"].ae-chip` | info-bulle : Les ressources qui peuvent encore donner une recette avec cet outil et ce geste ; guide ([data-ae="filtre"][data-value="utiles"]) |
| neuve | toutes les ressources | `button[data-ae="filtre"][data-value="tout"].btn.mini` | info-bulle : Montrer toutes les ressources que tu as vues |
| avancée | Artisanat | `button#ae-metier-artisanat[data-ae="metier"][data-value="artisanat"].btn` | info-bulle : Essayer, au Labo, les recettes de ce métier |
| avancée | Bâtiment | `button#ae-metier-construction[data-ae="metier"][data-value="construction"].btn` | info-bulle : Essayer, au Labo, les recettes de ce métier |
| avancée | 🐑 Subsistance | `button#ae-metier-elevage[data-ae="metier"][data-value="elevage"].btn` | info-bulle : Essayer, au Labo, les recettes de ce métier |
| avancée | ⚒️ Métallurgie | `button#ae-metier-metallurgie[data-ae="metier"][data-value="metallurgie"].btn` | info-bulle : Essayer, au Labo, les recettes de ce métier |
| avancée | Énergie | `button#ae-metier-centrales[data-ae="metier"][data-value="centrales"].btn` | info-bulle : Essayer, au Labo, les recettes de ce métier |
| avancée | 🔌 Technologie | `button#ae-metier-electronique[data-ae="metier"][data-value="electronique"].btn` | info-bulle : Essayer, au Labo, les recettes de ce métier |
| avancée | ✒️ Culture et savoir | `button#ae-metier-artistique[data-ae="metier"][data-value="artistique"].btn` | info-bulle : Essayer, au Labo, les recettes de ce métier |
| avancée | + | `button#ae-slot-0[data-ae="slot"][data-value="0"].btn.ae-empty` | info-bulle : Poser ou retirer une ressource dans cet emplacement |
| avancée | + | `button#ae-slot-1[data-ae="slot"][data-value="1"].btn.ae-empty` | info-bulle : Poser ou retirer une ressource dans cet emplacement |
| avancée | + | `button#ae-slot-2[data-ae="slot"][data-value="2"].btn.ae-empty` | info-bulle : Poser ou retirer une ressource dans cet emplacement |
| avancée | Tresser | `button#ae-forge-tresser[data-ae="forge"][data-value="tresser"].btn` | fiche Aide |
| avancée | (sans mot) | `button#ae-tool-mains[data-ae="tool"][data-value="mains"].ae-chip.ae-outil` | info-bulle : Mains ; lecteur d’écran : Mains ; guide (.ae-tools) |
| avancée | (sans mot) | `button#ae-tool-four[data-ae="tool"][data-value="four"].ae-chip.ae-outil` | info-bulle : Four en argile ; lecteur d’écran : Four en argile ; guide (.ae-tools) |
| avancée | (sans mot) | `button#ae-tool-ga_artisanat[data-ae="tool"][data-value="ga_artisanat"].ae-chip.ae-outil` | info-bulle : Atelier ; lecteur d’écran : Atelier ; guide (.ae-tools) |
| avancée | Tresser | `button#ae-mode-tresser[data-ae="mode"][data-value="tresser"].ae-chip.ae-geste` | guide (.ae-tools) |
| avancée | Monter | `button#ae-mode-assembler[data-ae="mode"][data-value="assembler"].ae-chip.ae-geste` | guide (.ae-tools) |
| avancée | Vider | `button#ae-clear-0[data-ae="clear"][data-value=""].btn.ghost` | info-bulle : Retirer toutes les ressources de l’établi et les remettre en réserve ; guide (.ae-tools) |
| avancée | Utiles | `button[data-ae="filtre"][data-value="utiles"].ae-chip` | info-bulle : Les ressources qui peuvent encore donner une recette avec cet outil et ce geste ; guide ([data-ae="filtre"][data-value="utiles"]) |
| avancée | Étudier · 70 | `button#ae-study-0[data-ae="study"][data-value=""].btn.ghost` | info-bulle : Étudier les ressources déjà vues en dépensant l’Intuition indiquée ; guide ([data-ae="study"]) |
| avancée | 6,41 k | `button#ae-item-fibre[data-ae="item"][data-value="fibre"].btn` | info-bulle : Fibres · 6,41 k ; lecteur d’écran : Fibres, 6 411,662 en réserve |
| avancée | 134 | `button#ae-item-manche[data-ae="item"][data-value="manche"].btn` | info-bulle : Manche · 134 ; lecteur d’écran : Manche, 134 en réserve |
| avancée | 2,15 k | `button#ae-item-cuir[data-ae="item"][data-value="cuir"].btn` | info-bulle : Peau · 2,15 k ; lecteur d’écran : Peau, 2 159,133 en réserve |
| avancée | 0 | `button#ae-item-laniere[data-ae="item"][data-value="laniere"].btn` | info-bulle : Lanières · 0 ; lecteur d’écran : Lanières, 0 en réserve |

## Arbre (16 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Chemin | `button[data-pt="chemin"]` | info-bulle : Ce qui est fait, ce qui reste |
| neuve | Objectif | `button[data-arb="centre"].btn.ouvre` | info-bulle : Ouvre ton objectif du moment, et ce qu’il demande |
| neuve | (sans mot) | `button[data-arb="chercher"].btn.ghost` | lecteur d’écran : Chercher dans la progression |
| neuve | Toutes 2 | `button[data-arb-f="tout"]` | info-bulle : Afficher toutes les pastilles |
| neuve | ? Recette à découvrir À découvrir Objectif | `button[data-arbsel="f1"][data-arbn="f1"].arb-card.fantome` | info-bulle : Ouvrir cette branche : ses ingrédients et ses usages |
| neuve | Percuteur de pierre | `button[data-arbsel="percuteur_pierre"][data-arbn="percuteur_pierre"].arb-pas.allume` | info-bulle : Ouvrir : ses ingrédients et ses usages ; lecteur d’écran : Percuteur de pierre, déjà fabriqué |
| neuve | ? ? | `button[data-arbsel="f1"][data-arbn="f1"].arb-pas.fantome` | info-bulle : Ouvrir : ses ingrédients et ses usages ; lecteur d’écran : Recette à découvrir, à découvrir, objectif |
| avancée | Chemin | `button[data-pt="chemin"]` | info-bulle : Ce qui est fait, ce qui reste |
| avancée | Cosmos | `button[data-tab2="cosmos"]` | info-bulle : Le ciel, les signes et les Grands Œuvres |
| avancée | Objectif | `button[data-arb="centre"].btn.ouvre` | info-bulle : Ouvre ton objectif du moment, et ce qu’il demande |
| avancée | (sans mot) | `button[data-arb="chercher"].btn.ghost` | lecteur d’écran : Chercher dans la progression |
| avancée | Toutes 85 | `button[data-arb-f="tout"]` | info-bulle : Afficher toutes les pastilles |
| avancée | ? Recette à découvrir À découvrir Objectif | `button[data-arbsel="f1"][data-arbn="f1"].arb-card.fantome` | info-bulle : Ouvrir cette branche : ses ingrédients et ses usages |
| avancée | Charbon | `button[data-arbsel="charbon"][data-arbn="charbon"].arb-pas.allume` | info-bulle : Ouvrir : ses ingrédients et ses usages ; lecteur d’écran : Charbon, déjà fabriqué |
| avancée | Bois | `button[data-arbsel="bois"][data-arbn="bois"].arb-pas.vu` | info-bulle : Ouvrir : ses ingrédients et ses usages ; lecteur d’écran : Bois, ressource découverte |
| avancée | ?? | `button[data-arbsel="f1"][data-arbn="f1"].arb-pas.fantome` | info-bulle : Ouvrir : ses ingrédients et ses usages ; lecteur d’écran : Recette à découvrir, à découvrir, objectif |

## Arbre · une branche (2 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Chemin | `button[data-chemin="manche"].btn` | info-bulle : Chemin : la route complète jusqu’à l’objet |
| avancée | Chemin | `button[data-chemin="locomotive"].btn` | info-bulle : Chemin : la route complète jusqu’à l’objet |

## Carnet (Journal, Recettes) (19 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Recettes | `button` | info-bulle : Les recettes que tu connais : on les relit ici, on les fabrique à l’Atelier |
| neuve | Fragments | `button[data-jt="fragments"]` | info-bulle : Les morceaux d’histoire retrouvés |
| neuve | Signes | `button[data-jt="signes"]` | info-bulle : Les mots des Anciens et leur sens |
| neuve | Aide | `button[data-tip-open="tip_carnet"].btn.ghost` | info-bulle : Rouvrir l’aide du Carnet |
| neuve | Apprises ▾ | `button[data-cpanel="filtres"].btn.ghost` | info-bulle : Choisir ce que la liste montre |
| neuve | Voir les 1 objets déjà possédés | `button[data-owned=""].btn.ghost` | info-bulle : Masquer ou montrer les objets déjà fabriqués |
| avancée | Recettes | `button` | info-bulle : Les recettes que tu connais : on les relit ici, on les fabrique à l’Atelier |
| avancée | Fragments | `button[data-jt="fragments"]` | info-bulle : Les morceaux d’histoire retrouvés |
| avancée | Questions | `button[data-jt="questions"]` | info-bulle : Ce que tu peux demander au Livre |
| avancée | Aide | `button[data-tip-open="tip_carnet"].btn.ghost` | info-bulle : Rouvrir l’aide du Carnet |
| avancée | Apprises ▾ | `button[data-cpanel="filtres"].btn.ghost` | info-bulle : Choisir ce que la liste montre |
| avancée | ▴ Plier | `button[data-age-all=""].age-pill.age-all` | info-bulle : Replier tous les âges ; lecteur d’écran : Replier tous les âges |
| avancée | Âge 1 | `button[data-age-jump="0"].age-pill` | info-bulle : Âge du Bois ; lecteur d’écran : Aller à : Âge du Bois |
| avancée | Bobine de cuivrePIÈCE Lot prêt | `div[data-goto="bobine"].grow` | info-bulle : Voir la recette et ses usages |
| avancée | ☆ | `button[data-pin="bobine"].pinb` | info-bulle : Épingler cette recette en haut de l’Atelier ; lecteur d’écran : Épingler cette recette en haut de l’Atelier ; guide ([data-pin]) |
| avancée | Atelier · Énergie | `button[data-aller="bobine"].btn` | info-bulle : Fabriquer se fait à l’Atelier, dans le métier Énergie |
| avancée | (sans mot) | `button[data-track="bobine"].btn.ghost` | info-bulle : Suivre cette recette ; lecteur d’écran : Suivre ; guide ([data-track]) |
| avancée | Progression | `button[data-situer="bobine"].btn.ghost` | info-bulle : Situer dans la Progression ; lecteur d’écran : Situer dans la Progression |
| avancée | Voir les 21 objets déjà possédés | `button[data-owned=""].btn.ghost` | info-bulle : Masquer ou montrer les objets déjà fabriqués |

## Journal (3 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Recettes | `button[data-tab2="carnet"]` | info-bulle : Les recettes que tu connais : on les relit ici, on les fabrique à l’Atelier |
| avancée | Recettes | `button[data-tab2="carnet"]` | info-bulle : Les recettes que tu connais : on les relit ici, on les fabrique à l’Atelier |
| avancée | La Porte Les Profondeurs | `button[data-frag="porte"].frag` | info-bulle : Lire ce fragment |

## Menu ☰ (13 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Reprendre › | `button[data-m="close"].btn.wide` | info-bulle : Fermer le menu et reprendre la partie |
| neuve | Jeu | `button[data-mjump="jeu"].m-nav-tab` | info-bulle : Ouvrir la rubrique Jeu |
| neuve | Mémoire des mains 1 Souvenirs disponibles | `button[data-m="mem"].btn.m-card-btn` | info-bulle : Ce que tes Souvenirs t’offrent d’une partie à l’autre |
| neuve | Revoir | `button[data-m="tutoAgain"].btn.ghost` | info-bulle : Revoir les explications du guide depuis le début |
| neuve | DÉSACTIVÉ | `button[data-m="tuto"].btn.sw` | info-bulle : Afficher ou masquer les explications du guide |
| neuve | ACTIVÉ | `button[data-m="visiteurs"].btn.sw` | info-bulle : Laisser quelqu’un passer chez toi de temps en temps |
| avancée | Reprendre › | `button[data-m="close"].btn.wide` | info-bulle : Fermer le menu et reprendre la partie |
| avancée | Jeu | `button[data-mjump="jeu"].m-nav-tab` | info-bulle : Ouvrir la rubrique Jeu |
| avancée | Mémoire des mains 1 Souvenirs disponibles | `button[data-m="mem"].btn.m-card-btn` | info-bulle : Ce que tes Souvenirs t’offrent d’une partie à l’autre |
| avancée | 🪙 Le Comptoir Troc & commandes | `button[data-m="comptoir"].btn.m-card-btn` | info-bulle : Vendre, acheter et répondre aux demandes du Troqueur |
| avancée | Revoir | `button[data-m="tutoAgain"].btn.ghost` | info-bulle : Revoir les explications du guide depuis le début |
| avancée | DÉSACTIVÉ | `button[data-m="tuto"].btn.sw` | info-bulle : Afficher ou masquer les explications du guide |
| avancée | ACTIVÉ | `button[data-m="visiteurs"].btn.sw` | info-bulle : Laisser quelqu’un passer chez toi de temps en temps |

## Atelier (5 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| avancée | Produire | `button[data-tab2="atelier"]` | info-bulle : Fabriquer et découvrir |
| avancée | Machines | `button[data-tab2="machines"]` | info-bulle : Tes machines et ce qu’elles fabriquent ; guide ([data-tab2="machines"]) |
| avancée | Énergie 0 / 30 ch ⓘ | `button[data-energie="1"].energie` | lecteur d’écran : Énergie : 0 chevaux demandés sur 30 disponibles. Ouvrir le détail |
| avancée | Ce qui tourne · 0 | `button[data-autosheet="1"].prod-pastille-auto` | info-bulle : Voir ce qui tourne : les commandes, les travailleurs et les machines au travail |
| avancée | Artisanat 11 sur 14 recettes Manuel Mécanisme Hydraulique Vapeur Chaîne Robotique Synthèse › | `button[data-atelier="artisanat"].atel-carte.is-repos` | info-bulle : Ouvrir ce métier : ses recettes, ses travailleurs, ce qu’il construit |

## Atelier · un métier (10 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| avancée | ← Métiers | `button[data-atelier-retour=""].btn` | info-bulle : Revenir à la liste des métiers |
| avancée | Embaucher un apprenti artisan · 3,90 k écus | `button[data-embaucher="artisanat:apprenti"].btn.ghost` | info-bulle : Il te manque des écus : vends au Comptoir ou au Troqueur |
| avancée | À l’arrêt | `button[data-seuil="artisanat:0"]` | fiche Aide |
| avancée | Verre 0 | `button[data-prodsel="verre"].prod-recette` | info-bulle : Choisir cette recette : la produire à la main ou l’automatiser |
| avancée | Brique réfractaire 0 | `button[data-prodsel="brique_refr"].prod-recette.zero` | info-bulle : Choisir cette recette : la produire à la main ou l’automatiser |
| avancée | 4 Sable | `span[data-need="sable"][data-q="4"][data-goto="sable"].ing.link` | info-bulle : Ouvrir sa fiche |
| avancée | ×1 | `button[data-prodq="1"]` | info-bulle : Produire 1 exemplaire d’un coup |
| avancée | À la main | `button[data-prod="main"].btn` | fiche Aide |
| avancée | Machines | `button[data-tab2="machines"].btn.ghost` | guide ([data-tab2="machines"]) |
| avancée | Épieu durci | `div[data-goto="epieu"].row` | info-bulle : Voir la recette et ses usages |

## Machines (2 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| avancée | + Manche | `button[data-cad-add="manche"].btn.mini` | info-bulle : Garder manche en réserve automatiquement |
| avancée | (sans mot) | `button.toast-x` | lecteur d’écran : Fermer |

## Fiche d’un objet (16 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| avancée | ♡ | `button[data-m="fav"].pinb.fav` | info-bulle : Ressource favorite (en tête de liste à l’Atelier) ; lecteur d’écran : Ressource favorite |
| avancée | ☆ | `button[data-m="pin"].pinb` | info-bulle : Épingler la recette en haut de l’Atelier ; lecteur d’écran : Épingler la recette en haut de l’Atelier |
| avancée | Fil de cuivre (prêt à fabriquer) 3 / 6 › | `button[data-m="nav"][data-id="fil_cuivre"].ring` | info-bulle : Ouvrir sa fiche : ce qu’il faut, et ce que tu as |
| avancée | Fabriquer | `button[data-m="cr"][data-cr="bobine"][data-n="1"].btn` | info-bulle : Commander 1 exemplaire, pièces comprises |
| avancée | ×10 | `button[data-m="cr"][data-cr="bobine"][data-n="10"].btn` | info-bulle : Commander 10 exemplaires d’un coup, pièces comprises |
| avancée | ×50 | `button[data-m="cr"][data-cr="bobine"][data-n="50"].btn` | info-bulle : Commander 50 exemplaires d’un coup, pièces comprises |
| avancée | ×100 | `button[data-m="cr"][data-cr="bobine"][data-n="100"].btn` | info-bulle : Commander 100 exemplaires d’un coup, pièces comprises |
| avancée | ×1000 | `button[data-m="cr"][data-cr="bobine"][data-n="1000"].btn` | info-bulle : Commander 1000 exemplaires d’un coup, pièces comprises |
| avancée | Max | `button[data-m="cr"][data-cr="bobine"][data-n="max"].btn` | info-bulle : Tout ce que ta Réserve permet, pièces comprises |
| avancée | … | `button[data-cr-custom="bobine"].btn` | info-bulle : Saisir une quantité libre à fabriquer |
| avancée | Détail | `button[data-m="tree"].btn.ghost` | info-bulle : Détail : les étapes de la commande et ce qu’il manque |
| avancée | Suivre | `button[data-m="track"].btn.ghost` | info-bulle : Suivre : ce qui manque s’affiche en haut des Terres, avec le temps estimé |
| avancée | Aimant | `button[data-m="nav"][data-id="aimant"].ing.link` | info-bulle : Ouvrir sa fiche |
| avancée | Étudier · 3 | `button[data-m="study"].btn` | info-bulle : Étudier cet objet en dépensant de l’Intuition : une piste de plus sur sa recette |
| avancée | Carnet | `button[data-m="carnet"].btn.ghost` | info-bulle : Voir sa recette dans le Carnet |
| avancée | Voir dans la Progression | `button[data-m="arbre"].btn.ghost` | info-bulle : Voir ses ingrédients et ses usages dans la Progression |
