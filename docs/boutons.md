# Les boutons de l’interface

Fichier généré par `node tools/boutons.js` (Playwright, chromium, 390×844 puis 900×900 pour le Carnet à deux colonnes, service worker bloqué) : ne pas le corriger à la main, relancer l’outil.

| | |
|---|---|
| Boutons relevés | 357 |
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

## Domaine (52 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Bois ÂGE 1/15 | `button#ageBtn.age` | info-bulle : Toucher pour voir les étapes de cet âge ; lecteur d’écran : Âge du Bois : étapes de l’âge |
| neuve | Carnet | `button#atlasToggle.icon-btn` | info-bulle : Carnet du Semeur actif — toucher pour Classique ; lecteur d’écran : Revenir au style classique |
| neuve | 1 | `button#memBtn.chip.mem` | lecteur d’écran : Traces et Mémoire des mains ; guide (#memBtn) |
| neuve | ☰ | `button#menuBtn.icon-btn` | lecteur d’écran : Menu |
| neuve | OBJECTIF Manche ▾ | `button[data-goalt=""].ghead` | guide (.goal-card) |
| neuve | NOUVELLE RECETTE · 1 RESSOURCE « Une branche bien droite, écorcée au caillou, tient bien en main. » | `div[data-goto="manche"].grow` | guide (.goal-card) |
| neuve | Atelier | `button[data-gotab="atelier"].btn` | guide (.goal-card) |
| neuve | Explorer · Le Grand Chêne | `button[data-exp="lisiere"].btn` | info-bulle : Lancer cette exploration : elle avance toute seule |
| neuve | Maîtrise · 0 % ? | `summary` | info-bulle : Voir les objectifs de cette terre et son bonus à la relève |
| neuve | ? | `button[data-aide="maitrise"].btn-aide.mini` | info-bulle : Comprendre la maîtrise des terres et la transmission ; lecteur d’écran : Comprendre la maîtrise des terres et la transmission |
| neuve | (sans mot) | `button[data-harv="lisiere:bois"].gis-ic.hand` | lecteur d’écran : Récolter : Bois |
| neuve | Bois 🖐️ à la main Tu en as 0 | `button[data-gsheet="lisiere:bois"].gis-body` | lecteur d’écran : Gisement : Bois |
| neuve | Récolter | `button[data-hloop="lisiere:bois"].mini.harvest` | info-bulle : Récolte en continu, même jeu fermé ; lecteur d’écran : Récolter en continu : Bois ; guide ([data-hloop="lisiere:bois"]) |
| neuve | Domaine | `button[data-tab="domaine"]` | info-bulle : Tes terres, tes gisements et ce qu’ils produisent |
| neuve | Carte | `button[data-tab="carte"]` | info-bulle : Le monde, terre par terre, et ce qu’il reste à explorer |
| neuve | Atelier | `button[data-tab="atelier"]` | info-bulle : Poser tes ressources, lancer une action |
| neuve | Arbre | `button[data-tab="arbre"]` | info-bulle : Qui sert à quoi : une recette, ses ingrédients, ses usages |
| neuve | Carnet | `button[data-tab="carnet"]` | info-bulle : Toutes tes recettes, avec la quantité et les commandes |
| neuve | Journal | `button[data-tab="journal"].born` | info-bulle : Ce que tu as trouvé et compris ; guide (#tabs [data-tab="journal"]) |
| avancée | Électricité ÂGE 9/15 0/3 | `button#ageBtn.age` | info-bulle : Toucher pour voir les étapes de cet âge ; lecteur d’écran : Âge de l’Électricité : étapes de l’âge |
| avancée | Carnet | `button#atlasToggle.icon-btn` | info-bulle : Carnet du Semeur actif — toucher pour Classique ; lecteur d’écran : Revenir au style classique |
| avancée | 0/3 | `button#questBtn.chip.quest` | info-bulle : Quêtes : l’objectif, les rituels, le Troqueur ; lecteur d’écran : Quêtes |
| avancée | +18 | `button#memBtn.chip.mem` | lecteur d’écran : Traces et Mémoire des mains ; guide (#memBtn) |
| avancée | 22 | `button#intuBtn.chip.intu` | lecteur d’écran : Intuition ; guide (#intuBtn) |
| avancée | ☰ | `button#menuBtn.icon-btn` | lecteur d’écran : Menu |
| avancée | OBJECTIF Régulateur à boules ▾ | `button[data-goalt=""].ghead` | guide (.goal-card) |
| avancée | Arbre | `button[data-arbre-obj=""].gmiles` | info-bulle : Voir ton objectif dans l’arbre ; guide (.goal-card) |
| avancée | Âge de l’Électricité · 0/3 étapes | `button[data-miles=""].gprog-row` | info-bulle : Les étapes de cet âge : 0/3 faites ; guide (.goal-card) |
| avancée | NOUVELLE RECETTE · 2 RESSOURCES « Une bande de bronze enroulée en spirale restitue l'effort quand on la relâche. » | `div[data-goto="ressort"].grow` | guide (.goal-card) |
| avancée | Atelier | `button[data-gotab="atelier"].btn` | guide (.goal-card) |
| avancée | Compris | `button[data-tip="tip_site"].btn.ghost` | info-bulle : Fermer cette astuce |
| avancée | Passer le relais (+18 ) | `button[data-m="releve"].btn` | info-bulle : Voir les gains de Traces et les bonus de la prochaine relève |
| avancée | Voir : Torche | `button[data-goto="torche"].btn` | guide (.dom-regle.gene) |
| avancée | Maîtrise · 80 % ? | `summary` | info-bulle : Voir les objectifs de cette terre et son bonus à la relève |
| avancée | ? | `button[data-aide="maitrise"].btn-aide.mini` | info-bulle : Comprendre la maîtrise des terres et la transmission ; lecteur d’écran : Comprendre la maîtrise des terres et la transmission |
| avancée | (sans mot) | `button[data-harv="mine:fer_min"].gis-ic.hand` | lecteur d’écran : Récolter : Minerai de fer |
| avancée | Minerai de fer +48/min Tu en as 543 · 1 mine de fer | `button[data-gsheet="mine:fer_min"].gis-body` | lecteur d’écran : Gisement : Minerai de fer |
| avancée | Récolter | `button[data-hloop="mine:fer_min"].mini.harvest` | info-bulle : Récolte en continu, même jeu fermé ; lecteur d’écran : Récolter en continu : Minerai de fer |
| avancée | + mine de fer | `button[data-xadd="mine:fer_min"][data-n="1"].mini.lbl` | info-bulle : Poser : Mine de fer (débit : 48/min → 96/min) ; lecteur d’écran : Poser : Mine de fer |
| avancée | 3 autre terres · +2,16 k/min en tout voir ▾ | `button[data-dall=""].dom-more` | info-bulle : Afficher ou replier les autres terres |
| avancée | 0 machine au travail · 10 au repos · voir ▸ | `button[data-tab2="machines"][data-dmach=""].dom-more.dom-mach-link` | guide ([data-tab2="machines"]) |
| avancée | Ouvrir le Comptoir | `button[data-comptoir=""].btn` | guide (#dcomptoir) |
| avancée | Supraconducteur 0 / 380 | `div[data-goto="supra"].cost-row` | info-bulle : Supraconducteur (toucher pour inspecter) |
| avancée | Fournir | `button[data-contrib="dyson"].btn` | info-bulle : Déposer depuis ta Réserve ce qu’il demande |
| avancée | Alimenté | `button[data-feed="dyson"].btn` | guide (.dom-oeuvre [data-feed]) |
| avancée | Bois+13/min8,73 k | `div[data-goto="bois"].u-pr` | info-bulle : Bois (toucher pour inspecter) |
| avancée | Domaine | `button[data-tab="domaine"]` | info-bulle : Tes terres, tes gisements et ce qu’ils produisent |
| avancée | Carte | `button[data-tab="carte"]` | info-bulle : Le monde, terre par terre, et ce qu’il reste à explorer |
| avancée | Atelier | `button[data-tab="atelier"]` | info-bulle : Poser tes ressources, lancer une action |
| avancée | Arbre | `button[data-tab="arbre"]` | info-bulle : Qui sert à quoi : une recette, ses ingrédients, ses usages |
| avancée | Carnet | `button[data-tab="carnet"]` | info-bulle : Toutes tes recettes, avec la quantité et les commandes |
| avancée | Journal | `button[data-tab="journal"]` | info-bulle : Ce que tu as trouvé et compris ; guide (#tabs [data-tab="journal"]) |

## Carte (12 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Camp | `button[data-map-go="lisiere"]` | info-bulle : Recentrer la carte sur ton camp |
| neuve | Légende | `button[data-map-legend=""]` | lecteur d’écran : Lire la légende de la carte |
| neuve | (sans mot) | `g[data-cf="plaine"].a-button.a-frontier` | lecteur d’écran : des herbes hautes, au loin : découvrir ce qui ouvre le passage |
| neuve | (sans mot) | `g[data-cz="lisiere"].a-button.a-region` | lecteur d’écran : La Lisière : ouvrir dans le Domaine |
| neuve | (sans mot) | `g[data-cl="lisiere:0"].a-button.a-place` | info-bulle : Le Grand Chêne · à explorer ; lecteur d’écran : La Lisière : Le Grand Chêne, à explorer ; guide ([data-cl="lisiere:0"]) |
| neuve | (sans mot) | `g[data-camp=""].a-button.a-camp` | lecteur d’écran : Ton camp : ouvrir le Domaine |
| avancée | Camp | `button[data-map-go="lisiere"]` | info-bulle : Recentrer la carte sur ton camp |
| avancée | Légende | `button[data-map-legend=""]` | lecteur d’écran : Lire la légende de la carte |
| avancée | (sans mot) | `g[data-cf="desert"].a-button.a-frontier` | lecteur d’écran : du sable à perte de vue : découvrir ce qui ouvre le passage |
| avancée | (sans mot) | `g[data-cz="lisiere"].a-button.a-region` | lecteur d’écran : La Lisière : ouvrir dans le Domaine |
| avancée | (sans mot) | `g[data-cl="lisiere:0"].a-button.a-place` | info-bulle : Le Grand Chêne · exploré ; lecteur d’écran : La Lisière : Le Grand Chêne, exploré ; guide ([data-cl="lisiere:0"]) |
| avancée | (sans mot) | `g[data-camp=""].a-button.a-camp` | lecteur d’écran : Ton camp : ouvrir le Domaine |

## Lieu (2 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Explorer | `button[data-m="go"].btn` | guide (.modal:not(.hidden) [data-m="go"]) |
| avancée | Un tour · 30 min | `button[data-m="fouille"][data-lvl="1"].btn` | guide (.modal:not(.hidden) .fouille-niv) |

## Atelier (157 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Déchiffrer · 3 | `button[data-goal-decipher="manche"].btn` | info-bulle : Révéler l’action contre 3 Intuition |
| neuve | + | `button#ae-slot-0[data-ae="slot"][data-value="0"].btn.ae-empty` | info-bulle : Poser ou retirer une matière dans cet emplacement |
| neuve | + | `button#ae-slot-1[data-ae="slot"][data-value="1"].btn.ae-empty` | info-bulle : Poser ou retirer une matière dans cet emplacement |
| neuve | + | `button#ae-slot-2[data-ae="slot"][data-value="2"].btn.ae-empty` | info-bulle : Poser ou retirer une matière dans cet emplacement |
| neuve | Tailler | `button#ae-forge-tailler[data-ae="forge"][data-value="tailler"].btn` | guide (#ae-forge-tailler) |
| neuve | Mains Assembler · Tresser | `button#ae-tool-mains[data-ae="tool"][data-value="mains"].btn` | info-bulle : MainsAssembler · Tresser ; guide (.ae-tools) |
| neuve | Percuteur de pierre Tailler | `button#ae-tool-percuteur_pierre[data-ae="tool"][data-value="percuteur_pierre"].btn` | info-bulle : Percuteur de pierreTailler ; guide (.ae-tools) |
| neuve | Bois 0 | `button#ae-item-bois[data-ae="item"][data-value="bois"].btn` | info-bulle : Bois · 0 ; lecteur d’écran : Bois, 0 en stock ; guide (#ae-item-bois) |
| neuve | Fibres 0 | `button#ae-item-fibre[data-ae="item"][data-value="fibre"].btn` | info-bulle : Fibres · 0 ; lecteur d’écran : Fibres, 0 en stock |
| neuve | Pierre 0 | `button#ae-item-caillou[data-ae="item"][data-value="caillou"].btn` | info-bulle : Pierre · 0 ; lecteur d’écran : Pierre, 0 en stock |
| avancée | Découvrir | `button[data-tab2="atelier"]` | info-bulle : Fabriquer et découvrir |
| avancée | Machines | `button[data-tab2="machines"]` | info-bulle : Tes machines et ce qu’elles fabriquent ; guide ([data-tab2="machines"]) |
| avancée | Déchiffrer · 30 | `button[data-goal-decipher="ressort"].btn.ghost` | info-bulle : Révéler l’action contre 30 Intuition |
| avancée | Préparer la relève | `button[data-releve=""].btn` | info-bulle : Voir les gains et les bonus permanents de la prochaine relève |
| avancée | Établi | `button#ae-place-etabli[data-ae="place"][data-value="etabli"].btn` | info-bulle : Choisir ce poste de travail |
| avancée | Foyer | `button#ae-place-feu[data-ae="place"][data-value="feu"].btn` | info-bulle : Choisir ce poste de travail |
| avancée | Four en argile | `button#ae-place-four[data-ae="place"][data-value="four"].btn` | info-bulle : Choisir ce poste de travail |
| avancée | Poste de frappe | `button#ae-place-enclume_pierre[data-ae="place"][data-value="enclume_pierre"].btn` | info-bulle : Choisir ce poste de travail |
| avancée | Grand Atelier (Âges 4+) | `button#ae-place-grand_atelier[data-ae="place"][data-value="grand_atelier"].btn` | info-bulle : Choisir ce poste de travail |
| avancée | Procédés après le Cuivre | `button#ae-legacy-1[data-ae="legacy"][data-value="1"].btn.ghost` | info-bulle : Utiliser les procédés des âges après le Cuivre |
| avancée | + | `button#ae-slot-0[data-ae="slot"][data-value="0"].btn.ae-empty` | info-bulle : Poser ou retirer une matière dans cet emplacement |
| avancée | + | `button#ae-slot-1[data-ae="slot"][data-value="1"].btn.ae-empty` | info-bulle : Poser ou retirer une matière dans cet emplacement |
| avancée | + | `button#ae-slot-2[data-ae="slot"][data-value="2"].btn.ae-empty` | info-bulle : Poser ou retirer une matière dans cet emplacement |
| avancée | Tailler | `button#ae-forge-tailler[data-ae="forge"][data-value="tailler"].btn` | guide (#ae-forge-tailler) |
| avancée | Mains Assembler · Tresser | `button#ae-tool-mains[data-ae="tool"][data-value="mains"].btn` | info-bulle : MainsAssembler · Tresser ; guide (.ae-tools) |
| avancée | Percuteur de pierre Tailler | `button#ae-tool-percuteur_pierre[data-ae="tool"][data-value="percuteur_pierre"].btn` | info-bulle : Percuteur de pierreTailler ; guide (.ae-tools) |
| avancée | Racloir en os Couper | `button#ae-tool-racloir_os[data-ae="tool"][data-value="racloir_os"].btn` | info-bulle : Racloir en osCouper ; guide (.ae-tools) |
| avancée | Pioche de pierre Équarrir | `button#ae-tool-pioche_pierre[data-ae="tool"][data-value="pioche_pierre"].btn` | info-bulle : Pioche de pierreÉquarrir ; guide (.ae-tools) |
| avancée | Ciseau de cuivre Refendre | `button#ae-tool-ciseau[data-ae="tool"][data-value="ciseau"].btn` | info-bulle : Ciseau de cuivreRefendre ; guide (.ae-tools) |
| avancée | Étudier les matières · 70 | `button#ae-study-0[data-ae="study"][data-value=""].btn.ghost` | info-bulle : Étudier les matières déjà vues en dépensant l’Intuition indiquée |
| avancée | Bois 8,81 k | `button#ae-item-bois[data-ae="item"][data-value="bois"].btn` | info-bulle : Bois · 8 812,15 ; lecteur d’écran : Bois, 8 812,15 en stock ; guide (#ae-item-bois) |
| avancée | Fibres 6,43 k | `button#ae-item-fibre[data-ae="item"][data-value="fibre"].btn` | info-bulle : Fibres · 6 437,92 ; lecteur d’écran : Fibres, 6 437,92 en stock |
| avancée | Pierre 4,22 k | `button#ae-item-caillou[data-ae="item"][data-value="caillou"].btn` | info-bulle : Pierre · 4 220,35 ; lecteur d’écran : Pierre, 4 220,35 en stock |
| avancée | Manche 134 | `button#ae-item-manche[data-ae="item"][data-value="manche"].btn` | info-bulle : Manche · 134 ; lecteur d’écran : Manche, 134 en stock |
| avancée | Corde 4 | `button#ae-item-corde[data-ae="item"][data-value="corde"].btn` | info-bulle : Corde · 4 ; lecteur d’écran : Corde, 4 en stock |
| avancée | Archet à feu 0 | `button#ae-item-archet[data-ae="item"][data-value="archet"].btn` | info-bulle : Archet à feu · 0 ; lecteur d’écran : Archet à feu, 0 en stock |
| avancée | Charbon 1,35 k | `button#ae-item-charbon[data-ae="item"][data-value="charbon"].btn` | info-bulle : Charbon · 1 352,29 ; lecteur d’écran : Charbon, 1 352,29 en stock |
| avancée | Épieu durci 1 | `button#ae-item-epieu[data-ae="item"][data-value="epieu"].btn` | info-bulle : Épieu durci · 1 ; lecteur d’écran : Épieu durci, 1 en stock |
| avancée | Cabane de bûcheron 0 | `button#ae-item-cabane[data-ae="item"][data-value="cabane"].btn` | info-bulle : Cabane de bûcheron · 0 ; lecteur d’écran : Cabane de bûcheron, 0 en stock |
| avancée | Torche 0 | `button#ae-item-torche[data-ae="item"][data-value="torche"].btn` | info-bulle : Torche · 0 ; lecteur d’écran : Torche, 0 en stock |
| avancée | Os 2,85 k | `button#ae-item-os[data-ae="item"][data-value="os"].btn` | info-bulle : Os · 2 856,3 ; lecteur d’écran : Os, 2 856,3 en stock |
| avancée | Peau 2,16 k | `button#ae-item-cuir[data-ae="item"][data-value="cuir"].btn` | info-bulle : Peau · 2 168,25 ; lecteur d’écran : Peau, 2 168,25 en stock |
| avancée | Aiguille en os 0 | `button#ae-item-aiguille[data-ae="item"][data-value="aiguille"].btn` | info-bulle : Aiguille en os · 0 ; lecteur d’écran : Aiguille en os, 0 en stock |
| avancée | Lanières 0 | `button#ae-item-laniere[data-ae="item"][data-value="laniere"].btn` | info-bulle : Lanières · 0 ; lecteur d’écran : Lanières, 0 en stock |
| avancée | Outre en peau 1 | `button#ae-item-outre[data-ae="item"][data-value="outre"].btn` | info-bulle : Outre en peau · 1 ; lecteur d’écran : Outre en peau, 1 en stock |
| avancée | Collets 1 | `button#ae-item-collets[data-ae="item"][data-value="collets"].btn` | info-bulle : Collets · 1 ; lecteur d’écran : Collets, 1 en stock |
| avancée | Tunique de peau 1 | `button#ae-item-tunique[data-ae="item"][data-value="tunique"].btn` | info-bulle : Tunique de peau · 1 ; lecteur d’écran : Tunique de peau, 1 en stock |
| avancée | Argile 1,10 k | `button#ae-item-argile[data-ae="item"][data-value="argile"].btn` | info-bulle : Argile · 1 102,385 ; lecteur d’écran : Argile, 1 102,385 en stock |
| avancée | Silex 1,68 k | `button#ae-item-silex[data-ae="item"][data-value="silex"].btn` | info-bulle : Silex · 1 681,88 ; lecteur d’écran : Silex, 1 681,88 en stock |
| avancée | Sable 1,24 k | `button#ae-item-sable[data-ae="item"][data-value="sable"].btn` | info-bulle : Sable · 1 245,385 ; lecteur d’écran : Sable, 1 245,385 en stock |
| avancée | Éclat de silex 0 | `button#ae-item-eclat[data-ae="item"][data-value="eclat"].btn` | info-bulle : Éclat de silex · 0 ; lecteur d’écran : Éclat de silex, 0 en stock |
| avancée | Automate de bois 4 | `button#ae-item-automate_bois[data-ae="item"][data-value="automate_bois"].btn` | info-bulle : Automate de bois · 4 ; lecteur d’écran : Automate de bois, 4 en stock |
| avancée | Hache de pierre 1 | `button#ae-item-hache_pierre[data-ae="item"][data-value="hache_pierre"].btn` | info-bulle : Hache de pierre · 1 ; lecteur d’écran : Hache de pierre, 1 en stock |
| avancée | Brique 0 | `button#ae-item-brique[data-ae="item"][data-value="brique"].btn` | info-bulle : Brique · 0 ; lecteur d’écran : Brique, 0 en stock |
| avancée | Argilière 1 | `button#ae-item-nasse[data-ae="item"][data-value="nasse"].btn` | info-bulle : Argilière · 1 ; lecteur d’écran : Argilière, 1 en stock |
| avancée | Hutte de bûcheron 0 | `button#ae-item-hutte[data-ae="item"][data-value="hutte"].btn` | info-bulle : Hutte de bûcheron · 0 ; lecteur d’écran : Hutte de bûcheron, 0 en stock |
| avancée | Malachite 662 | `button#ae-item-malachite[data-ae="item"][data-value="malachite"].btn` | info-bulle : Malachite · 662,68 ; lecteur d’écran : Malachite, 662,68 en stock |
| avancée | Cassitérite 388 | `button#ae-item-cassiterite[data-ae="item"][data-value="cassiterite"].btn` | info-bulle : Cassitérite · 388,84 ; lecteur d’écran : Cassitérite, 388,84 en stock |
| avancée | Lingot de cuivre 0 | `button#ae-item-lingot_cuivre[data-ae="item"][data-value="lingot_cuivre"].btn` | info-bulle : Lingot de cuivre · 0 ; lecteur d’écran : Lingot de cuivre, 0 en stock |
| avancée | Plaque de cuivre 0 | `button#ae-item-plaque_cuivre[data-ae="item"][data-value="plaque_cuivre"].btn` | info-bulle : Plaque de cuivre · 0 ; lecteur d’écran : Plaque de cuivre, 0 en stock |
| avancée | Fil de cuivre 3 | `button#ae-item-fil_cuivre[data-ae="item"][data-value="fil_cuivre"].btn` | info-bulle : Fil de cuivre · 3 ; lecteur d’écran : Fil de cuivre, 3 en stock |
| avancée | Lingot d’étain 1 | `button#ae-item-lingot_etain[data-ae="item"][data-value="lingot_etain"].btn` | info-bulle : Lingot d’étain · 1 ; lecteur d’écran : Lingot d’étain, 1 en stock |
| avancée | Creuset 1 | `button#ae-item-creuset[data-ae="item"][data-value="creuset"].btn` | info-bulle : Creuset · 1 ; lecteur d’écran : Creuset, 1 en stock |
| avancée | Mine de cuivre 1 | `button#ae-item-puits[data-ae="item"][data-value="puits"].btn` | info-bulle : Mine de cuivre · 1 ; lecteur d’écran : Mine de cuivre, 1 en stock |
| avancée | Meule de charbonnier 2 | `button#ae-item-charbonniere[data-ae="item"][data-value="charbonniere"].btn` | info-bulle : Meule de charbonnier · 2 ; lecteur d’écran : Meule de charbonnier, 2 en stock |
| avancée | Lingot de bronze 0 | `button#ae-item-lingot_bronze[data-ae="item"][data-value="lingot_bronze"].btn` | info-bulle : Lingot de bronze · 0 ; lecteur d’écran : Lingot de bronze, 0 en stock |
| avancée | Plaque de bronze 1 | `button#ae-item-plaque_bronze[data-ae="item"][data-value="plaque_bronze"].btn` | info-bulle : Plaque de bronze · 1 ; lecteur d’écran : Plaque de bronze, 1 en stock |
| avancée | Engrenage de bronze 0 | `button#ae-item-engrenage[data-ae="item"][data-value="engrenage"].btn` | info-bulle : Engrenage de bronze · 0 ; lecteur d’écran : Engrenage de bronze, 0 en stock |
| avancée | Automate de bronze 4 | `button#ae-item-automate_bronze[data-ae="item"][data-value="automate_bronze"].btn` | info-bulle : Automate de bronze · 4 ; lecteur d’écran : Automate de bronze, 4 en stock |
| avancée | Pioche de bronze 1 | `button#ae-item-pioche_bronze[data-ae="item"][data-value="pioche_bronze"].btn` | info-bulle : Pioche de bronze · 1 ; lecteur d’écran : Pioche de bronze, 1 en stock |
| avancée | Enclume de bronze 1 | `button#ae-item-enclume_bronze[data-ae="item"][data-value="enclume_bronze"].btn` | info-bulle : Enclume de bronze · 1 ; lecteur d’écran : Enclume de bronze, 1 en stock |
| avancée | Roue cerclée 0 | `button#ae-item-roue[data-ae="item"][data-value="roue"].btn` | info-bulle : Roue cerclée · 0 ; lecteur d’écran : Roue cerclée, 0 en stock |
| avancée | Soufflet 0 | `button#ae-item-soufflet[data-ae="item"][data-value="soufflet"].btn` | info-bulle : Soufflet · 0 ; lecteur d’écran : Soufflet, 0 en stock |
| avancée | Moulin à eau 1 | `button#ae-item-moulin[data-ae="item"][data-value="moulin"].btn` | info-bulle : Moulin à eau · 1 ; lecteur d’écran : Moulin à eau, 1 en stock |
| avancée | Minerai de fer 548 | `button#ae-item-fer_min[data-ae="item"][data-value="fer_min"].btn` | info-bulle : Minerai de fer · 548,58 ; lecteur d’écran : Minerai de fer, 548,58 en stock |
| avancée | Bas-fourneau 1 | `button#ae-item-bas_fourneau[data-ae="item"][data-value="bas_fourneau"].btn` | info-bulle : Bas-fourneau · 1 ; lecteur d’écran : Bas-fourneau, 1 en stock |
| avancée | Loupe de fer 0 | `button#ae-item-loupe[data-ae="item"][data-value="loupe"].btn` | info-bulle : Loupe de fer · 0 ; lecteur d’écran : Loupe de fer, 0 en stock |
| avancée | Lingot de fer 0 | `button#ae-item-lingot_fer[data-ae="item"][data-value="lingot_fer"].btn` | info-bulle : Lingot de fer · 0 ; lecteur d’écran : Lingot de fer, 0 en stock |
| avancée | Plaque de fer 6 | `button#ae-item-plaque_fer[data-ae="item"][data-value="plaque_fer"].btn` | info-bulle : Plaque de fer · 6 ; lecteur d’écran : Plaque de fer, 6 en stock |
| avancée | Clous 9 | `button#ae-item-clous[data-ae="item"][data-value="clous"].btn` | info-bulle : Clous · 9 ; lecteur d’écran : Clous, 9 en stock |
| avancée | Outils de fer 1 | `button#ae-item-outils_fer[data-ae="item"][data-value="outils_fer"].btn` | info-bulle : Outils de fer · 1 ; lecteur d’écran : Outils de fer, 1 en stock |
| avancée | Mine de fer 1 | `button#ae-item-galerie[data-ae="item"][data-value="galerie"].btn` | info-bulle : Mine de fer · 1 ; lecteur d’écran : Mine de fer, 1 en stock |
| avancée | Enclos d’élevage 1 | `button#ae-item-enclos[data-ae="item"][data-value="enclos"].btn` | info-bulle : Enclos d’élevage · 1 ; lecteur d’écran : Enclos d’élevage, 1 en stock |
| avancée | Verre 0 | `button#ae-item-verre[data-ae="item"][data-value="verre"].btn` | info-bulle : Verre · 0 ; lecteur d’écran : Verre, 0 en stock |
| avancée | Lentille 0 | `button#ae-item-lentille[data-ae="item"][data-value="lentille"].btn` | info-bulle : Lentille · 0 ; lecteur d’écran : Lentille, 0 en stock |
| avancée | Lunette astronomique 1 | `button#ae-item-lunette[data-ae="item"][data-value="lunette"].btn` | info-bulle : Lunette astronomique · 1 ; lecteur d’écran : Lunette astronomique, 1 en stock |
| avancée | Brique réfractaire 0 | `button#ae-item-brique_refr[data-ae="item"][data-value="brique_refr"].btn` | info-bulle : Brique réfractaire · 0 ; lecteur d’écran : Brique réfractaire, 0 en stock |
| avancée | Haut-fourneau 1 | `button#ae-item-haut_fourneau[data-ae="item"][data-value="haut_fourneau"].btn` | info-bulle : Haut-fourneau · 1 ; lecteur d’écran : Haut-fourneau, 1 en stock |
| avancée | Lingot d’acier 0 | `button#ae-item-lingot_acier[data-ae="item"][data-value="lingot_acier"].btn` | info-bulle : Lingot d’acier · 0 ; lecteur d’écran : Lingot d’acier, 0 en stock |
| avancée | Bac de trempe 1 | `button#ae-item-bac_trempe[data-ae="item"][data-value="bac_trempe"].btn` | info-bulle : Bac de trempe · 1 ; lecteur d’écran : Bac de trempe, 1 en stock |
| avancée | Acier trempé 0 | `button#ae-item-acier_trempe[data-ae="item"][data-value="acier_trempe"].btn` | info-bulle : Acier trempé · 0 ; lecteur d’écran : Acier trempé, 0 en stock |
| avancée | Lame trempée 0 | `button#ae-item-lame[data-ae="item"][data-value="lame"].btn` | info-bulle : Lame trempée · 0 ; lecteur d’écran : Lame trempée, 0 en stock |
| avancée | Tour d’usinage 1 | `button#ae-item-tour[data-ae="item"][data-value="tour"].btn` | info-bulle : Tour d’usinage · 1 ; lecteur d’écran : Tour d’usinage, 1 en stock |
| avancée | Piston 0 | `button#ae-item-piston[data-ae="item"][data-value="piston"].btn` | info-bulle : Piston · 0 ; lecteur d’écran : Piston, 0 en stock |
| avancée | Engrenage d’acier 2 | `button#ae-item-engrenage_acier[data-ae="item"][data-value="engrenage_acier"].btn` | info-bulle : Engrenage d’acier · 2 ; lecteur d’écran : Engrenage d’acier, 2 en stock |
| avancée | Chaudière 0 | `button#ae-item-chaudiere[data-ae="item"][data-value="chaudiere"].btn` | info-bulle : Chaudière · 0 ; lecteur d’écran : Chaudière, 0 en stock |
| avancée | Moteur à vapeur 0 | `button#ae-item-moteur_vapeur[data-ae="item"][data-value="moteur_vapeur"].btn` | info-bulle : Moteur à vapeur · 0 ; lecteur d’écran : Moteur à vapeur, 0 en stock |
| avancée | Presse à vapeur 2 | `button#ae-item-presse_vapeur[data-ae="item"][data-value="presse_vapeur"].btn` | info-bulle : Presse à vapeur · 2 ; lecteur d’écran : Presse à vapeur, 2 en stock |
| avancée | Scierie à vapeur 1 | `button#ae-item-scierie[data-ae="item"][data-value="scierie"].btn` | info-bulle : Scierie à vapeur · 1 ; lecteur d’écran : Scierie à vapeur, 1 en stock |
| avancée | Bobine de cuivre 20 | `button#ae-item-bobine[data-ae="item"][data-value="bobine"].btn` | info-bulle : Bobine de cuivre · 20 ; lecteur d’écran : Bobine de cuivre, 20 en stock |
| avancée | Aimant 4 | `button#ae-item-aimant[data-ae="item"][data-value="aimant"].btn` | info-bulle : Aimant · 4 ; lecteur d’écran : Aimant, 4 en stock |
| avancée | Tablette des astres 1 | `button#ae-item-tablette[data-ae="item"][data-value="tablette"].btn` | info-bulle : Tablette des astres · 1 ; lecteur d’écran : Tablette des astres, 1 en stock |
| avancée | Rouissoir 2 | `button#ae-item-fibre_2[data-ae="item"][data-value="fibre_2"].btn` | info-bulle : Rouissoir · 2 ; lecteur d’écran : Rouissoir, 2 en stock |
| avancée | Carrière à main 2 | `button#ae-item-caillou_1[data-ae="item"][data-value="caillou_1"].btn` | info-bulle : Carrière à main · 2 ; lecteur d’écran : Carrière à main, 2 en stock |
| avancée | Carrière à coins 1 | `button#ae-item-caillou_2[data-ae="item"][data-value="caillou_2"].btn` | info-bulle : Carrière à coins · 1 ; lecteur d’écran : Carrière à coins, 1 en stock |
| avancée | Fosse de tannage 1 | `button#ae-item-cuir_1[data-ae="item"][data-value="cuir_1"].btn` | info-bulle : Fosse de tannage · 1 ; lecteur d’écran : Fosse de tannage, 1 en stock |
| avancée | Tannerie 1 | `button#ae-item-cuir_2[data-ae="item"][data-value="cuir_2"].btn` | info-bulle : Tannerie · 1 ; lecteur d’écran : Tannerie, 1 en stock |
| avancée | Gravière 2 | `button#ae-item-silex_1[data-ae="item"][data-value="silex_1"].btn` | info-bulle : Gravière · 2 ; lecteur d’écran : Gravière, 2 en stock |
| avancée | Sablière 1 | `button#ae-item-sable_1[data-ae="item"][data-value="sable_1"].btn` | info-bulle : Sablière · 1 ; lecteur d’écran : Sablière, 1 en stock |
| avancée | Mine d’étain 1 | `button#ae-item-cassiterite_1[data-ae="item"][data-value="cassiterite_1"].btn` | info-bulle : Mine d’étain · 1 ; lecteur d’écran : Mine d’étain, 1 en stock |
| avancée | Mine de charbon 1 | `button#ae-item-charbon_2[data-ae="item"][data-value="charbon_2"].btn` | info-bulle : Mine de charbon · 1 ; lecteur d’écran : Mine de charbon, 1 en stock |
| avancée | Manche | `button#ae-prepare-manche[data-ae="prepare"][data-value="manche"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Manche |
| avancée | Fabriquer | `button#ae-order-manche[data-ae="order"][data-value="manche"].btn` | info-bulle : Fabriquer : Manche, en préparant les composants manquants |
| avancée | Corde | `button#ae-prepare-corde[data-ae="prepare"][data-value="corde"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Corde |
| avancée | Fabriquer | `button#ae-order-corde[data-ae="order"][data-value="corde"].btn` | info-bulle : Fabriquer : Corde, en préparant les composants manquants |
| avancée | Cabane de bûcheron | `button#ae-prepare-cabane[data-ae="prepare"][data-value="cabane"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Cabane de bûcheron |
| avancée | Fabriquer | `button#ae-order-cabane[data-ae="order"][data-value="cabane"].btn` | info-bulle : Fabriquer : Cabane de bûcheron, en préparant les composants manquants |
| avancée | Archet à feu | `button#ae-prepare-archet[data-ae="prepare"][data-value="archet"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Archet à feu |
| avancée | Fabriquer | `button#ae-order-archet[data-ae="order"][data-value="archet"].btn` | info-bulle : Fabriquer : Archet à feu, en préparant les composants manquants |
| avancée | Lanières | `button#ae-prepare-laniere[data-ae="prepare"][data-value="laniere"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Lanières |
| avancée | Fabriquer | `button#ae-order-laniere[data-ae="order"][data-value="laniere"].btn` | info-bulle : Fabriquer : Lanières, en préparant les composants manquants |
| avancée | Aiguille en os | `button#ae-prepare-aiguille[data-ae="prepare"][data-value="aiguille"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Aiguille en os |
| avancée | Fabriquer | `button#ae-order-aiguille[data-ae="order"][data-value="aiguille"].btn` | info-bulle : Fabriquer : Aiguille en os, en préparant les composants manquants |
| avancée | Éclat de silex | `button#ae-prepare-eclat[data-ae="prepare"][data-value="eclat"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Éclat de silex |
| avancée | Fabriquer | `button#ae-order-eclat[data-ae="order"][data-value="eclat"].btn` | info-bulle : Fabriquer : Éclat de silex, en préparant les composants manquants |
| avancée | Collets | `button#ae-prepare-collets[data-ae="prepare"][data-value="collets"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Collets |
| avancée | Fabriquer | `button#ae-order-collets[data-ae="order"][data-value="collets"].btn` | info-bulle : Fabriquer : Collets, en préparant les composants manquants |
| avancée | Argilière | `button#ae-prepare-nasse[data-ae="prepare"][data-value="nasse"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Argilière |
| avancée | Fabriquer | `button#ae-order-nasse[data-ae="order"][data-value="nasse"].btn` | info-bulle : Fabriquer : Argilière, en préparant les composants manquants |
| avancée | Hutte de bûcheron | `button#ae-prepare-hutte[data-ae="prepare"][data-value="hutte"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Hutte de bûcheron |
| avancée | Fabriquer | `button#ae-order-hutte[data-ae="order"][data-value="hutte"].btn` | info-bulle : Fabriquer : Hutte de bûcheron, en préparant les composants manquants |
| avancée | Torche | `button#ae-prepare-torche[data-ae="prepare"][data-value="torche"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Torche |
| avancée | Fabriquer | `button#ae-order-torche[data-ae="order"][data-value="torche"].btn` | info-bulle : Fabriquer : Torche, en préparant les composants manquants |
| avancée | Meule de charbonnier | `button#ae-prepare-charbonniere[data-ae="prepare"][data-value="charbonniere"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Meule de charbonnier |
| avancée | Fabriquer | `button#ae-order-charbonniere[data-ae="order"][data-value="charbonniere"].btn` | info-bulle : Fabriquer : Meule de charbonnier, en préparant les composants manquants |
| avancée | Mine de cuivre | `button#ae-prepare-puits[data-ae="prepare"][data-value="puits"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Mine de cuivre |
| avancée | Fabriquer | `button#ae-order-puits[data-ae="order"][data-value="puits"].btn` | info-bulle : Fabriquer : Mine de cuivre, en préparant les composants manquants |
| avancée | Fil de cuivre | `button#ae-prepare-fil_cuivre[data-ae="prepare"][data-value="fil_cuivre"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Fil de cuivre |
| avancée | Fabriquer | `button#ae-order-fil_cuivre[data-ae="order"][data-value="fil_cuivre"].btn` | info-bulle : Fabriquer : Fil de cuivre, en préparant les composants manquants |
| avancée | Rouissoir | `button#ae-prepare-fibre_2[data-ae="prepare"][data-value="fibre_2"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Rouissoir |
| avancée | Fabriquer | `button#ae-order-fibre_2[data-ae="order"][data-value="fibre_2"].btn` | info-bulle : Fabriquer : Rouissoir, en préparant les composants manquants |
| avancée | Carrière à coins | `button#ae-prepare-caillou_2[data-ae="prepare"][data-value="caillou_2"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Carrière à coins |
| avancée | Fabriquer | `button#ae-order-caillou_2[data-ae="order"][data-value="caillou_2"].btn` | info-bulle : Fabriquer : Carrière à coins, en préparant les composants manquants |
| avancée | Carrière à main | `button#ae-prepare-caillou_1[data-ae="prepare"][data-value="caillou_1"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Carrière à main |
| avancée | Fabriquer | `button#ae-order-caillou_1[data-ae="order"][data-value="caillou_1"].btn` | info-bulle : Fabriquer : Carrière à main, en préparant les composants manquants |
| avancée | Fosse de tannage | `button#ae-prepare-cuir_1[data-ae="prepare"][data-value="cuir_1"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Fosse de tannage |
| avancée | Fabriquer | `button#ae-order-cuir_1[data-ae="order"][data-value="cuir_1"].btn` | info-bulle : Fabriquer : Fosse de tannage, en préparant les composants manquants |
| avancée | Sablière | `button#ae-prepare-sable_1[data-ae="prepare"][data-value="sable_1"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Sablière |
| avancée | Fabriquer | `button#ae-order-sable_1[data-ae="order"][data-value="sable_1"].btn` | info-bulle : Fabriquer : Sablière, en préparant les composants manquants |
| avancée | Gravière | `button#ae-prepare-silex_1[data-ae="prepare"][data-value="silex_1"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Gravière |
| avancée | Fabriquer | `button#ae-order-silex_1[data-ae="order"][data-value="silex_1"].btn` | info-bulle : Fabriquer : Gravière, en préparant les composants manquants |
| avancée | Mine d’étain | `button#ae-prepare-cassiterite_1[data-ae="prepare"][data-value="cassiterite_1"].btn` | info-bulle : Préparer les matières, le poste et l’outil pour : Mine d’étain |
| avancée | Fabriquer | `button#ae-order-cassiterite_1[data-ae="order"][data-value="cassiterite_1"].btn` | info-bulle : Fabriquer : Mine d’étain, en préparant les composants manquants |
| avancée | Faire vivre l’atelier Bourse, ouvrier & surplus de lanières | `summary.ae-eco-summary` | info-bulle : Afficher ou replier la bourse, l’ouvrier et les surplus de lanières |
| avancée | Aménager : 10 bois, 3 cordes, 4 pierres | `button#ae-build-0[data-ae="build"][data-value=""].btn` | info-bulle : Aménager l’établi pour accueillir un ouvrier |
| avancée | Embaucher · 3,13 écus | `button#ae-hire-0[data-ae="hire"][data-value=""].btn` | info-bulle : Recruter un ouvrier avec les écus de ta bourse |
| avancée | Vendre le surplus maintenant | `button#ae-sell-0[data-ae="sell"][data-value=""].btn` | info-bulle : Vendre les lanières au-delà de ta réserve et recevoir le montant après taxe |

## Arbre (16 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Progression | `button[data-arb="ensemble"].btn` | info-bulle : Ta progression : ton âge, tes étapes et le prochain objectif |
| neuve | Objectif | `button[data-arb="centre"].btn` | info-bulle : Ton objectif du moment, et ce qu’il demande |
| neuve | (sans mot) | `button[data-arb="chercher"].btn.ghost` | lecteur d’écran : Chercher dans l’arbre |
| neuve | Toutes 2 | `button[data-arb-f="tout"]` | info-bulle : Afficher toutes les pastilles |
| neuve | ? Recette à découvrir À découvrir Objectif | `button[data-arbsel="f1"][data-arbn="f1"].arb-card.fantome` | info-bulle : Ouvrir cette branche : ses ingrédients et ses usages |
| neuve | Percuteur de pierre | `button[data-arbsel="percuteur_pierre"][data-arbn="percuteur_pierre"].arb-pas.allume` | info-bulle : Ouvrir : ses ingrédients et ses usages ; lecteur d’écran : Percuteur de pierre, déjà fabriqué |
| neuve | ? ? | `button[data-arbsel="f1"][data-arbn="f1"].arb-pas.fantome` | info-bulle : Ouvrir : ses ingrédients et ses usages ; lecteur d’écran : Recette à découvrir, à découvrir, objectif |
| avancée | Progression | `button[data-arb="ensemble"].btn` | info-bulle : Ta progression : ton âge, tes étapes et le prochain objectif |
| avancée | Objectif | `button[data-arb="centre"].btn` | info-bulle : Ton objectif du moment, et ce qu’il demande |
| avancée | (sans mot) | `button[data-arb="chercher"].btn.ghost` | lecteur d’écran : Chercher dans l’arbre |
| avancée | Toutes 85 | `button[data-arb-f="tout"]` | info-bulle : Afficher toutes les pastilles |
| avancée | ? Recette à découvrir À découvrir Objectif | `button[data-arbsel="f1"][data-arbn="f1"].arb-card.fantome` | info-bulle : Ouvrir cette branche : ses ingrédients et ses usages |
| avancée | Bois | `button[data-arbsel="bois"][data-arbn="bois"].arb-pas.vu` | info-bulle : Ouvrir : ses ingrédients et ses usages ; lecteur d’écran : Bois, ressource découverte |
| avancée | Charbon | `button[data-arbsel="charbon"][data-arbn="charbon"].arb-pas.allume` | info-bulle : Ouvrir : ses ingrédients et ses usages ; lecteur d’écran : Charbon, déjà fabriqué |
| avancée | ?? | `button[data-arbsel="f1"][data-arbn="f1"].arb-pas.fantome` | info-bulle : Ouvrir : ses ingrédients et ses usages ; lecteur d’écran : Recette à découvrir, à découvrir, objectif |
| avancée | (sans mot) | `button.toast-x` | lecteur d’écran : Fermer |

## Arbre · une branche (2 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Chemin | `button[data-chemin="manche"].btn` | info-bulle : Chemin : la route complète jusqu’à l’objet |
| avancée | Chemin | `button[data-chemin="regulateur"].btn` | info-bulle : Chemin : la route complète jusqu’à l’objet |

## Carnet (32 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Compris | `button[data-tip="tip_carnet"].btn.ghost` | info-bulle : Fermer cette astuce |
| neuve | ×1 | `button[data-qty="1"].chipq` | info-bulle : Un seul exemplaire |
| neuve | … | `button[data-qty-custom=""].chipq` | info-bulle : Saisir une quantité libre ; lecteur d’écran : Quantité libre |
| neuve | Apprises | `button[data-cf="tout"]` | info-bulle : Toutes les recettes que tu connais |
| neuve | Prêtes | `button[data-cf="pret"]` | info-bulle : Celles que ta Réserve couvre entièrement, pièces comprises |
| neuve | Réalisables | `button[data-cf="craft"]` | info-bulle : Celles dont les pièces manquantes peuvent encore être fabriquées |
| neuve | À découvrir | `button[data-cf="unk"]` | info-bulle : Celles qu’il te reste à découvrir |
| neuve | Extracteurs | `button[data-cf="ext"]` | info-bulle : Les bâtiments qui récoltent à ta place |
| neuve | Outils | `button[data-cf="tool"]` | info-bulle : Les outils et leurs améliorations |
| neuve | Machines | `button[data-cf="mach"]` | info-bulle : Les machines qui fabriquent seules |
| neuve | Épinglées | `button[data-cf="pin"]` | info-bulle : Tes épingles, en haut de l’Atelier |
| neuve | Voir les 1 objets déjà possédés | `button[data-owned=""].btn.ghost` | info-bulle : Masquer ou montrer les objets déjà fabriqués |
| avancée | ×1 | `button[data-qty="1"].chipq` | info-bulle : Un seul exemplaire |
| avancée | … | `button[data-qty-custom=""].chipq` | info-bulle : Saisir une quantité libre ; lecteur d’écran : Quantité libre |
| avancée | Apprises | `button[data-cf="tout"]` | info-bulle : Toutes les recettes que tu connais |
| avancée | Prêtes | `button[data-cf="pret"]` | info-bulle : Celles que ta Réserve couvre entièrement, pièces comprises |
| avancée | Réalisables | `button[data-cf="craft"]` | info-bulle : Celles dont les pièces manquantes peuvent encore être fabriquées |
| avancée | À découvrir | `button[data-cf="unk"]` | info-bulle : Celles qu’il te reste à découvrir |
| avancée | Extracteurs | `button[data-cf="ext"]` | info-bulle : Les bâtiments qui récoltent à ta place |
| avancée | Outils | `button[data-cf="tool"]` | info-bulle : Les outils et leurs améliorations |
| avancée | Machines | `button[data-cf="mach"]` | info-bulle : Les machines qui fabriquent seules |
| avancée | Épinglées | `button[data-cf="pin"]` | info-bulle : Tes épingles, en haut de l’Atelier |
| avancée | ▴ Plier | `button[data-age-all=""].age-pill.age-all` | info-bulle : Replier tous les âges ; lecteur d’écran : Replier tous les âges |
| avancée | Âge 1 | `button[data-age-jump="0"].age-pill` | info-bulle : Âge du Bois ; lecteur d’écran : Aller à : Âge du Bois |
| avancée | ☆ | `button[data-pin="bobine"].pinb` | info-bulle : Épingler cette recette en haut de l’Atelier ; lecteur d’écran : Épingler cette recette en haut de l’Atelier ; guide ([data-pin]) |
| avancée | 6 Fil de cuivre | `span[data-need="fil_cuivre"][data-q="6"][data-goto="fil_cuivre"].ing.link` | info-bulle : Ouvrir sa fiche |
| avancée | Fabriquer | `button[data-cr="bobine"][data-n="1"][data-lbl="Fabriquer"].btn.make` | info-bulle : Fabriquer avec les mains et les machines disponibles, pièces intermédiaires comprises |
| avancée | Détail | `button[data-tree="bobine"][data-n="1"].btn.ghost` | info-bulle : Les étapes de cette commande, et ce qu’il manque ; lecteur d’écran : Détail du lot |
| avancée | (sans mot) | `button[data-track="bobine"].btn.ghost` | info-bulle : Suivre cette recette ; lecteur d’écran : Suivre ; guide ([data-track]) |
| avancée | Arbre | `button[data-situer="bobine"].btn.ghost` | info-bulle : Situer dans l’Arbre ; lecteur d’écran : Situer dans l’Arbre |
| avancée | 1 Circuit de vapeur | `span[data-goto="circuit_vapeur"].ing.link` | info-bulle : Ouvrir sa fiche |
| avancée | Voir les 21 objets déjà possédés | `button[data-owned=""].btn.ghost` | info-bulle : Masquer ou montrer les objets déjà fabriqués |

## Journal (15 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Fragments | `button[data-jt="fragments"]` | info-bulle : Les morceaux d’histoire retrouvés |
| neuve | Signes | `button[data-jt="signes"]` | info-bulle : Les mots des Anciens et leur sens |
| neuve | Secrets | `button[data-jt="secrets"]` | info-bulle : Ce que tu as trouvé, et ce qu’il reste |
| neuve | Gestes • | `button[data-jt="gestes"]` | info-bulle : Les gestes remarqués et accomplis au fil de ta route |
| neuve | Fins | `button[data-jt="fins"]` | info-bulle : Les fins du jeu et ce que tu en sais |
| neuve | Mémoire | `button[data-jt="stats"]` | info-bulle : Ta partie en chiffres |
| avancée | Journal | `button[data-tab2="journal"]` | info-bulle : Ce que tu as trouvé et compris |
| avancée | Cosmos | `button[data-tab2="cosmos"]` | info-bulle : Le ciel, les signes et les Grands Œuvres |
| avancée | Fragments | `button[data-jt="fragments"]` | info-bulle : Les morceaux d’histoire retrouvés |
| avancée | Questions | `button[data-jt="questions"]` | info-bulle : Ce que tu peux demander au Livre |
| avancée | Secrets | `button[data-jt="secrets"]` | info-bulle : Ce que tu as trouvé, et ce qu’il reste |
| avancée | Gestes • | `button[data-jt="gestes"]` | info-bulle : Les gestes remarqués et accomplis au fil de ta route |
| avancée | Fins | `button[data-jt="fins"]` | info-bulle : Les fins du jeu et ce que tu en sais |
| avancée | Mémoire | `button[data-jt="stats"]` | info-bulle : Ta partie en chiffres |
| avancée | La Porte Les Profondeurs | `button[data-frag="porte"].frag` | info-bulle : Lire ce fragment |

## Journal · signes (1 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | 1 endroit | `button[data-s="nourrice"].signe-card` | info-bulle : Ouvrir la fiche de ce signe : où tu l’as vu, et ce que tu en sais |

## Journal · fins (2 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Mémoire des mains | `button[data-cycle=""].btn` | info-bulle : Voir tes améliorations permanentes et préparer la relève |
| avancée | Mémoire des mains | `button[data-cycle=""].btn` | info-bulle : Voir tes améliorations permanentes et préparer la relève |

## Journal · stats (2 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | ⏎ | `button.btn` | info-bulle : Envoyer ce nom ; lecteur d’écran : Envoyer ce nom |
| avancée | ⏎ | `button.btn` | info-bulle : Envoyer ce nom ; lecteur d’écran : Envoyer ce nom |

## Menu ☰ (45 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| neuve | Reprendre › | `button[data-m="close"].btn.wide` | info-bulle : Fermer le menu et reprendre la partie |
| neuve | 🎮 Jeu | `button[data-mjump="jeu"].m-nav-tab` | info-bulle : Aller à la section Jeu |
| neuve | Mémoire des mains 1 Traces disponibles | `button[data-m="mem"].btn.m-card-btn` | info-bulle : Ce que tes Traces t’offrent d’une partie à l’autre |
| neuve | Revoir | `button[data-m="tutoAgain"].btn.ghost` | info-bulle : Revoir les explications du guide depuis le début |
| neuve | DÉSACTIVÉ | `button[data-m="tuto"].btn.sw` | info-bulle : Afficher ou masquer les explications du guide |
| neuve | ACTIVÉ | `button[data-m="visiteurs"].btn.sw` | info-bulle : Laisser quelqu’un traverser le Domaine de temps en temps |
| neuve | DÉSACTIVÉ | `button[data-m="largeText"].btn.sw` | info-bulle : Agrandir les textes de tout le jeu |
| neuve | DÉSACTIVÉ | `button[data-m="compact"].btn.sw` | info-bulle : Resserrer le Domaine et le Carnet pour voir plus de choses d’un coup |
| neuve | ACTIVÉ | `button[data-m="carnet2"].btn.sw` | info-bulle : Afficher les recettes du Carnet sur deux colonnes (à partir de 360 px de large) |
| neuve | ACTIVÉ | `button[data-m="ambiance"].btn.sw` | info-bulle : Afficher une petite phrase sous l’en-tête qui change selon l’âge, le lieu et l’heure |
| neuve | DÉSACTIVÉ | `button[data-m="ecran"].btn.sw` | info-bulle : Empêcher la mise en veille de l’écran tant que le jeu est ouvert |
| neuve | ACTIVÉ | `button[data-m="sound"].btn.sw` | info-bulle : Couper ou remettre la musique et les bruitages |
| neuve | ACTIVÉ | `button[data-m="vibe"].btn.sw` | info-bulle : Faire vibrer l’appareil lors des actions importantes |
| neuve | ✎ Mode test | `button[data-m="modeTest"].btn.m-card-btn` | info-bulle : Créer une copie locale pour tester librement la progression |
| neuve | Sauvegardes | `button[data-m="saves"].btn.m-card-btn` | info-bulle : Télécharger ta partie, la recharger ou restaurer une copie |
| neuve | État des productions | `button[data-assistance="diagnostic"].btn.m-card-btn` | info-bulle : Comprendre pourquoi une commande ou un ouvrier attend |
| neuve | Compte en ligne | `button[data-m="account"].btn.m-card-btn` | info-bulle : Retrouver ta partie sur tous tes appareils |
| neuve | Comment jouer | `button[data-m="help"].btn.m-card-btn` | info-bulle : Les mots du jeu et le rôle de chaque écran |
| neuve | 📰 Nouveautés | `button[data-m="news"].btn.m-card-btn` | info-bulle : Ce qui a changé dans cette version |
| neuve | Crédits | `button[data-m="credits"].btn.m-card-btn` | info-bulle : Les icônes, les polices et la musique |
| neuve | Recommencer la partie | `button[data-m="reset"].btn.ghost` | info-bulle : Effacer ta progression et repartir de zéro |
| neuve | Fermer | `button[data-m="close"].btn.m-close-btn` | info-bulle : Fermer le menu et revenir au jeu |
| avancée | Reprendre › | `button[data-m="close"].btn.wide` | info-bulle : Fermer le menu et reprendre la partie |
| avancée | 🎮 Jeu | `button[data-mjump="jeu"].m-nav-tab` | info-bulle : Aller à la section Jeu |
| avancée | Mémoire des mains 1 Traces disponibles | `button[data-m="mem"].btn.m-card-btn` | info-bulle : Ce que tes Traces t’offrent d’une partie à l’autre |
| avancée | 🪙 Le Comptoir Troc & commandes | `button[data-m="comptoir"].btn.m-card-btn` | info-bulle : Vendre, acheter et répondre aux demandes du Troqueur |
| avancée | Revoir | `button[data-m="tutoAgain"].btn.ghost` | info-bulle : Revoir les explications du guide depuis le début |
| avancée | DÉSACTIVÉ | `button[data-m="tuto"].btn.sw` | info-bulle : Afficher ou masquer les explications du guide |
| avancée | ACTIVÉ | `button[data-m="visiteurs"].btn.sw` | info-bulle : Laisser quelqu’un traverser le Domaine de temps en temps |
| avancée | DÉSACTIVÉ | `button[data-m="largeText"].btn.sw` | info-bulle : Agrandir les textes de tout le jeu |
| avancée | DÉSACTIVÉ | `button[data-m="compact"].btn.sw` | info-bulle : Resserrer le Domaine et le Carnet pour voir plus de choses d’un coup |
| avancée | ACTIVÉ | `button[data-m="carnet2"].btn.sw` | info-bulle : Afficher les recettes du Carnet sur deux colonnes (à partir de 360 px de large) |
| avancée | ACTIVÉ | `button[data-m="ambiance"].btn.sw` | info-bulle : Afficher une petite phrase sous l’en-tête qui change selon l’âge, le lieu et l’heure |
| avancée | DÉSACTIVÉ | `button[data-m="ecran"].btn.sw` | info-bulle : Empêcher la mise en veille de l’écran tant que le jeu est ouvert |
| avancée | ACTIVÉ | `button[data-m="sound"].btn.sw` | info-bulle : Couper ou remettre la musique et les bruitages |
| avancée | ACTIVÉ | `button[data-m="vibe"].btn.sw` | info-bulle : Faire vibrer l’appareil lors des actions importantes |
| avancée | ✎ Mode test | `button[data-m="modeTest"].btn.m-card-btn` | info-bulle : Créer une copie locale pour tester librement la progression |
| avancée | Sauvegardes | `button[data-m="saves"].btn.m-card-btn` | info-bulle : Télécharger ta partie, la recharger ou restaurer une copie |
| avancée | État des productions | `button[data-assistance="diagnostic"].btn.m-card-btn` | info-bulle : Comprendre pourquoi une commande ou un ouvrier attend |
| avancée | Compte en ligne | `button[data-m="account"].btn.m-card-btn` | info-bulle : Retrouver ta partie sur tous tes appareils |
| avancée | Comment jouer | `button[data-m="help"].btn.m-card-btn` | info-bulle : Les mots du jeu et le rôle de chaque écran |
| avancée | 📰 Nouveautés | `button[data-m="news"].btn.m-card-btn` | info-bulle : Ce qui a changé dans cette version |
| avancée | Crédits | `button[data-m="credits"].btn.m-card-btn` | info-bulle : Les icônes, les polices et la musique |
| avancée | Recommencer la partie | `button[data-m="reset"].btn.ghost` | info-bulle : Effacer ta progression et repartir de zéro |
| avancée | Fermer | `button[data-m="close"].btn.m-close-btn` | info-bulle : Fermer le menu et revenir au jeu |

## Comptoir (8 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| avancée | Vendre | `button[data-m="ctab"][data-t="vendre"]` | info-bulle : Vendre ce qui encombre ta Réserve |
| avancée | Acheter | `button[data-m="ctab"][data-t="acheter"]` | info-bulle : Acheter la ressource qui te manque |
| avancée | Demandes | `button[data-m="ctab"][data-t="demandes"]` | guide (.modal:not(.hidden) [data-t="demandes"]) |
| avancée | Parler | `button[data-m="ctab"][data-t="parler"]` | guide (.modal:not(.hidden) [data-t="parler"]) |
| avancée | Minerai de fer · tu en as 544 9,8 écu l’unité | `div[data-goto="fer_min"].comptoir-head` | info-bulle : Minerai de fer (toucher pour inspecter) |
| avancée | 10 % +520 | `button[data-m="sell"][data-id="fer_min"][data-n="54"].btn.mini` | info-bulle : Vendre 10 % ; guide (.modal:not(.hidden) [data-m="sell"]) |
| avancée | 10 % +201 | `button[data-m="sell"][data-id="aimant"][data-n="1"].btn.mini` | info-bulle : Vendre 10 % ; guide (.modal:not(.hidden) [data-m="sell"]) |
| avancée | La moitié +126 | `button[data-m="sell"][data-id="bobine"][data-n="10"].btn.mini` | info-bulle : Vendre la moitié ; guide (.modal:not(.hidden) [data-m="sell"]) |

## Journal · questions (1 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| avancée | Réfléchir : 45 (manque d’Intuition) | `button[data-askhelp="q_porte"].btn.dis` | info-bulle : Il te manque de l’Intuition : elle vient des recettes, des fragments et des secrets |

## Cosmos (4 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| avancée | Ciel | `button[data-ct="ciel"]` | info-bulle : Le ciel de la nuit |
| avancée | Figures | `button[data-ct="figures"]` | info-bulle : Les étoiles et les signes déjà vus ; guide ([data-ct="figures"]) |
| avancée | ARCHE | `button[data-ct="arche"]` | info-bulle : Le terminal des Anciens |
| avancée | Grands Œuvres | `button[data-ct="oeuvres"]` | info-bulle : Les Grands Œuvres, ce qu’il reste à bâtir |

## (erreur) (2 boutons, 0 sans explication)

| Partie | Bouton | Repère | Expliqué par |
|---|---|---|---|
| avancée | fmtNum is not defined | `` | erreur console |
| avancée | fmtNum is not defined | `` | erreur console |
