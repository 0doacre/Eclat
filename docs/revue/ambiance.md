# Ligne d’ambiance sous l’en-tête

> Document de conception et recueil des textes d’ambiance diégétiques d’Éclat (0.33.0).

---

## 1. Intention et rôle

La **ligne d’ambiance** est une ligne discrète placée sous le bandeau d’en-tête (`#top`), au-dessus des vues de jeu.

Contrairement aux *toasts* (qui confirment une action du joueur) ou au *Journal* (qui consigne ce qui a été compris et découvert), la ligne d’ambiance ne délivre aucun statut technique ni notification administrative. Elle donne à voir et à sentir le **monde vivant** d’Éclat :
- Une observation sensorielle concrète (bruit du vent, odeur de résine, cliquetis de métal, chaleur de la roche, silence de l'espace).
- Une résonance avec la matière travaillée et la technique de l'âge atteint.
- Le cycle du jour et de la nuit dans le monde réel (aube, plein jour, crépuscule, nuit).
- L’état vivant du Domaine (machines au travail, premier feu allumé, échos des cycles précédents).
- De temps à autre, un clin d'œil sobre ou un conseil diégétique.

Elle se renouvelle doucement (environ chaque minute, ou instantanément lors d'un déplacement vers une autre terre ou du passage à un nouvel âge). Le joueur peut aussi la toucher pour faire défiler une autre observation du moment.

---

## 2. Charte littéraire : le ton d’Éclat

Comme le rappelle `docs/A-FAIRE.md` :
> *« C’est là que "écrit par une IA" se voit le plus. »*

Pour bannir tout calque artificiel et toute platitude poétique, la rédaction obéit aux règles strictes de `docs/STYLE.md` et `docs/revue/vocabulaire.md` :

1. **Le concret avant tout** : Pas de métaphores vagues (« Le vent murmure des mystères infinis »). On nomme des objets réels, des gestes, des matières : une étincelle, une goutte d'eau, du suif, un galet noir, de la poussière d'anthracite, une courroie, un manomètre, du verre chaud.
2. **Des phrases courtes et denses** : En moyenne de 5 à 12 mots. Une ligne doit tenir sur un écran de téléphone (320–430 px) sans forcer le retour à la ligne ou sans tronquer l'essentiel.
3. **Le sens physique plutôt que le sentimentalisme** : On ne dit pas « Tu te sens empli d'espoir », on décrit ce que les yeux voient ou ce que les mains touchent : « L'os poli glisse sans accrocher la peau », « La lame plie sous l'effort mais reprend sa droiture ».
4. **Tutoiement sobre** : S'il y a une adresse au joueur, elle tutoie sans complaisance. Mais la majorité des phrases sont des observations directes à la troisième personne (« L'eau roule un galet noir contre la berge »).
5. **Zéro tiret cadratin, zéro emphase artificielle** : Pas de points d'exclamation répétés. Des phrases affirmatives, limpides et équilibrées.

---

## 3. Architecture et sélection

Le module `js/ambiance.js` (`window.EclatAmbiance`) gère le recueil et la sélection :

### Entrées contextuelles
- **Terre active (`zone`)** : `U.zone` ou terre ouverte du Domaine (`lisiere`, `plaine`, `riviere`, `collines`, `mine`, `desert`, `gisement`, `montagnes`, `orbite`, `lune`, `mercure`, `caveau`).
- **Âge en cours (`age`)** : de l'Âge du Bois (0) à l'Âge Stellaire (14).
- **Heure du jour (`time`)** : déterminée via les heures réelles :
  - `dawn` (aube) : 6h à 8h.
  - `day` (jour) : 8h à 18h.
  - `dusk` (crépuscule) : 18h à 21h.
  - `night` (nuit) : 21h à 6h.
- **Situation (`state`)** :
  - `machines` : machines en cours de fonctionnement (`ms > 0`).
  - `cycle` : nombre de cycles / renaissance (`cycle >= 2`).
  - `nuitless` : terres hors cycle jour/nuit (Orbite, Lune, Mercure, Caveau).

### Tirage et rotation
- La sélection rassemble tous les candidats valides pour la situation courante avec des poids adaptés.
- Une graine temporelle change la phrase chaque minute.
- Un changement de terre ou d’âge actualise immédiatement la ligne sans attendre la minute.
- Le clic ou appui tactile sur la barre d’ambiance déclenche immédiatement une rotation vers la phrase suivante parmi les candidates actuelles, avec une douce transition d’opacité (`.fading`).

### Réglage
- Un interrupteur dans le menu (Menu ☰ → Affichage → Ligne d'ambiance, `settings.ambiance !== false`) permet au joueur de la masquer complètement s'il préfère une interface minimale.

---

## 4. Recueil complet des textes d’ambiance

### A. Par terre (12 terres)

#### La Lisière (`lisiere`)
- *L’odeur d’écorce et de résine flotte entre les grands arbres.*
- *Le vent balance doucement la cime des pins.*
- *Un oiseau solitaire appelle au fond du sous-bois.*
- *Des aiguilles de pin craquent sous le pas.*
- *La sève fraîche colle aux doigts.*

#### La Plaine (`plaine`)
- *Les herbes hautes ondulent sous la brise comme une mer verte.*
- *Le vent siffle entre les tiges sèches.*
- *Une silhouette fuit au loin à travers les chaumes.*
- *La poussière chaude vole au ras du sol.*
- *Une odeur d’herbe coupée et de terre sèche.*

#### La Rivière Lente (`riviere`)
- *L’eau lente et lourde roule des galets noirs contre la rive.*
- *Le clapotis régulier berce la berge de limon.*
- *Des libellules effleurent le miroir du courant.*
- *L’argile fraîche sèche vite au soleil.*
- *Une odeur de vase, de joncs et d’eau fraîche.*

#### Les Collines Vertes (`collines`)
- *L’air est plus vif sur les crêtes pierreuses.*
- *Des filons de malachite affleurent entre les buissons.*
- *Le vent frais descend des pentes herbeuses.*
- *Un éboulis de cailloux résonne dans le vallon.*
- *L’herbe rase s’accroche au calcaire.*

#### Les Profondeurs (`mine`)
- *Il fait tiède sous la roche, contre toute attente.*
- *Une goutte tombe dans le noir avec un écho lourd.*
- *La poussière d’anthracite noircit la peau.*
- *Les parois sombres renvoient un murmure sourd.*
- *L’odeur métallique du minerai et de l’air enfermé.*

#### Le Désert de Verre (`desert`)
- *Le sable chaud crisse sous chaque pas.*
- *Une dalle de silice fondue miroite dans la chaleur.*
- *Le vent sec souffle sans soulever un seul brin d’herbe.*
- *L’air tremble au-dessus des dunes.*
- *Un éclat de verre pur renvoie la lumière crue.*

#### Le Gisement Noir (`gisement`)
- *L’huile noire et épaisse suinte lentement des failles.*
- *Une vapeur tiède de bitume s’élève du sol.*
- *Le liquide lourd clapote au fond des fosses.*
- *L’acier des treuils porte les marques d’une vieille rouille.*
- *L’odeur âcre du soufre et du naphta.*

#### Les Pics Fracturés (`montagnes`)
- *Le vent glacial coupe la crête en deux.*
- *Des pans de roche nue montent vers un ciel limpide.*
- *Un bloc de schiste se détache et roule vers la faille.*
- *L’air est rare et piquant sur les sommets.*
- *La poussière de bauxite colore la pierre de rouille.*

#### L’Orbite Basse (`orbite`)
- *La Terre défile en dessous dans un silence parfait.*
- *Un éclat d’aluminium flotte doucement dans le vide.*
- *La ligne bleue de l’atmosphère sépare le noir du bleu.*
- *Pas un souffle, pas une vibration.*
- *Le soleil découpe les métaux d’une ombre franche.*

#### La Lune (`lune`)
- *Le régolithe gris garde la trace nette de chaque pas.*
- *L’ombre d’un cratère s’étire à l’infini dans la poussière.*
- *Le disque bleu de la Terre veille dans le ciel noir.*
- *Un silence total où même les outils ne font aucun bruit.*
- *La roche blanche ne retient aucune chaleur.*

#### Mercure (`mercure`)
- *La chaleur écrasante fait trembler la silhouette du Soleil.*
- *Un ruisseau de métal liquide dort au fond d’une faille.*
- *Le sol brûlé ne refroidit jamais.*
- *L’ombre et la fournaise se touchent à angle droit.*
- *Le géant de feu occupe la moitié du ciel.*

#### Le Caveau des Semeurs (`caveau`)
- *Une douce clarté bleue baigne les cuves silencieuses.*
- *L’air y est immobile, préservé depuis des siècles.*
- *La résonance des dalles répond au moindre souffle.*
- *La résonite tiédit sous la paume.*
- *Un ordre ancien dort sous la roche.*

---

### B. Par âge (15 âges)

1. **Bois** : *Tout commence par un bâton et deux mains patientes.*
2. **Os** : *L’os poli glisse sans accrocher la peau.*
3. **Pierre** : *Un coup sec pour fendre, un geste mesuré pour affûter.*
4. **Cuivre** : *Le métal rouge se plie avant de céder.*
5. **Bronze** : *L’alliage coule dans le moule avec un reflet doré.*
6. **Fer** : *Le fer rougit sous le marteau et durcit à chaque coup.*
7. **Acier** : *La lame plie sous l’effort mais reprend sa droiture.*
8. **Vapeur** : *Le manomètre monte doucement vers la zone utile.*
9. **Électricité** : *Un infime bourdonnement parcourt les câbles tendus.*
10. **Atome** : *La chaleur monte sans qu’aucune flamme ne s’allume.*
11. **Silicium** : *Une grille minuscule gravée sur une lamelle de quartz.*
12. **Polymères** : *Le ruban souple sort tiède de la filière.*
13. **Composites** : *Des mèches tressées plus rigides que l’acier.*
14. **Spatial** : *Les tuyères refroidissent en claquant dans le silence.*
15. **Stellaire** : *Les voiles captent l’énergie directe de l’étoile.*

---

### C. Par heure du jour (4 moments)

#### Aube (`dawn`, 6h–8h)
- *La rosée perle sur les outils posés au sol.*
- *Une première lueur grise étire les ombres du Domaine.*
- *Le froid du matin s’estompe peu à peu.*
- *L’air est encore limpide et sans poussière.*

#### Plein jour (`day`, 8h–18h)
- *Le plein jour éclaire chaque détail de l’établi.*
- *La lumière crue réchauffe les pierres.*
- *La cadence s’installe d’elle-même.*

#### Crépuscule (`dusk`, 18h–21h)
- *Le ciel prend des teintes de cuivre et de cendre.*
- *Les ombres s’allongent sur le sol de l’atelier.*
- *Le vent fraîchit à mesure que le jour décline.*
- *La lueur du feu reprend ses droits.*

#### Nuit (`night`, 21h–6h)
- *Le silence de la nuit enveloppe le Domaine.*
- *Les étoiles scintillent au-dessus des machines immobiles.*
- *Une braise veille au fond du foyer.*
- *L’obscurité rend le monde plus vaste.*

---

### D. Situations & Clins d’œil diégétiques

#### Machines actives
- *Un battement régulier rythme le travail des machines.*
- *Les courroies tournent sans à-coup dans la pénombre.*
- *Le mécanisme poursuit son ouvrage à cadence égale.*

#### Mémoire & Relève (cycle >= 2)
- *Les mains se souviennent avant que la tête ne comprenne.*
- *Un geste déjà répété mille fois dans un autre siècle.*

#### Clins d’œil diégétiques sobres
- *Rien ne se perd, tout attend d’être transformé.*
- *Un bâton taillé reste le début de toute chose.*
- *Un coup d’œil au ciel ne ralentit pas les mains.*
