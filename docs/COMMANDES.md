# Les commandes : un seul geste, « Fabriquer », et tout le monde s’y met

Document de conception de la version 5.7. Il remplace la façon dont les machines
travaillent (groupes fixés sur une recette, `S.dom.mach`) et étend la file des mains
(`S.hand.q`). Les paliers des machines (5.5) restent.

## Pourquoi

Aujourd’hui, deux systèmes s’ignorent :
- **les mains** : « Fabriquer » construit tout l’arbre (moteur → bobines → fil), lentement,
  une pièce après l’autre ;
- **les machines** : rivées à une recette, en boucle sur la Réserve. Elles n’aident jamais
  le clic du joueur, et les régler demande de penser comme un gestionnaire d’usine.

## Le principe

1. **Toute fabrication est une commande avec une quantité** : Fabriquer (×1), ×10, ×50,
   ×100, ×1000, Max. Rien ne tourne à l’infini, aucune machine n’est fixée.
2. **Une commande, c’est un travail de la file des mains** (`S.hand.q`, déjà existant :
   étapes `s = [[recette, fois], …]` dans l’ordre des dépendances, établi `b`), dont **les
   machines au repos peuvent aussi faire les étapes**, en parallèle des mains.
3. **La première fois, on découvre ; ensuite, on automatise.** Une machine ne prend une
   étape que si la recette a déjà été fabriquée au moins une fois (`S.made[id] > 0`). Sinon,
   ce sont les mains. Interrupteur dans les données : `D.COMMANDES.firstByHand` (vrai).
4. **Les extracteurs suivent.** Une commande qui attend une matière première pose d’elle-même
   les extracteurs au repos de la bonne terre sur ce gisement.

## Règles du moteur

### Une commande

- Créée par `E.order(id, n)` (remplace l’usage de `E.queue(id, n, true)` par les boutons) :
  `n` fabrications de `id`, avec toutes ses pièces (`E.plan`).
- **Elle n’a pas besoin de tout avoir d’avance.** Les matières premières manquantes sont
  prises dans la Réserve au fur et à mesure qu’elles arrivent (récolte, extracteurs, Comptoir).
  Une commande qui attend affiche ce qu’il lui manque.
- Les pièces faites pour la commande restent sur son établi (`b`), comme aujourd’hui.
  L’objet final va dans la Réserve (ou sur un gisement, `to`, comme aujourd’hui).
- Au plus `D.HAND.max` commandes à la fois (8 aujourd’hui). La première est servie en
  priorité.
- Annuler rend tout ce qui est sur l’établi à la Réserve (comme `E.cancelJob`).

### Qui fait quoi

À chaque pas de temps :
- **les machines** : chaque machine au repos prend une unité d’une étape qu’elle sait
  faire : palier (`E.machCan`), déjà fabriquée une fois, recette confiable à une machine
  (`E.automatable`), ingrédients présents sur l’établi. Elle avance à sa vitesse (`spd`,
  bonus compris). Priorité : la première commande, et dans une commande l’étape la plus
  profonde ;
- **les mains** : elles prennent ce qu’aucune machine ne peut faire (objet unique, recette
  jamais faite, palier trop haut). Sinon, elles aident comme une machine de plus, à leur
  vitesse actuelle (`handTime`, niveaux compris) ;
- une machine est **au travail** quand elle a une unité en cours, **au repos** sinon.

La profondeur (`prof`, 5.5) n’a plus d’objet, puisque l’arbre est déjà déroulé par la
commande. Les deux grandes machines gardent `prof` dans les données, sans effet. Leur
avantage reste la vitesse.

### Ce qui disparaît, ce qui reste

- **Les groupes de machines fixés** (`S.dom.mach`) disparaissent. Au chargement d’une
  ancienne partie, chaque groupe est retiré, ce qu’il avait en main revient à la Réserve
  (`refund`), et les machines restent possédées, au repos. Un message de mise à jour le dit.
  Rien n’est perdu.
- **⟳ En boucle** (refaire une recette) disparaît des boutons : ×1000 le remplace. Une
  action « make » en cours au chargement s’arrête proprement. **▶** sur un gisement
  (récolte en continu) reste.
- **Le Grand Œuvre alimenté** et les **passages** ne changent pas : ils puisent dans la
  Réserve, que les commandes remplissent.

### Sauvegardes

- Les travaux de `S.hand.q` existants restent valables : ce sont des commandes.
- Champs nouveaux avec valeur par défaut ; pas de changement de `SAVE_VERSION` si on peut
  l’éviter, sinon une étape de `migrate()` testée sur `tools/fixtures`.
- Copie de sécurité avant la mise à jour, comme toujours.

## Interface

- **Carnet et fiches** : `Fabriquer`, `×10`, `×50`, `×100`, `×1000`, `Max`. Le bouton dit
  combien de temps ça prendra à peu près, avec les machines au repos.
- **La barre au-dessus des onglets** (aujourd’hui « ✋ Tes mains ») : « Fabrication » avec la
  première commande, son avancement, et qui travaille dessus (✋ et les icônes des machines).
  La toucher ouvre la liste des commandes.
- **L’onglet Machines** devient la liste des **commandes** : pour chacune, l’objet, la
  quantité, l’avancement, ce qu’elle attend (« il manque : bois 120 »), qui travaille sur
  quoi, et Annuler. En dessous, les machines possédées par sorte, avec leur palier et
  combien sont au travail.
- **Domaine** : la ligne de résumé dit « 3 commandes · 5 machines au travail ».
- **Tutoriel** : le chapitre de l’automate dit qu’il aide tes fabrications, tout seul, pour
  les recettes déjà faites à la main et à un ingrédient.

## Réglages (`D.COMMANDES`)

```js
D.COMMANDES = { firstByHand: true, sizes: [10, 50, 100, 1000] };   // le nombre de commandes reste D.HAND.max
```
