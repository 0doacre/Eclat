## scene: comptoir-1
sujet: comptoir
rang: 0
cond: -
cycle-min: 1

T: « Tu poses, je pèse. »
  mise-en-scene: *Il ne lève pas les yeux de sa balance.*
> A: « Je n’ai rien à vendre. »
  T: « Alors tu regardes. Les planches, sous le plateau. »
  T: « Onze encoches. Onze mains avant la tienne. »
> B: « Tu es là depuis quand ? »
  T: « Depuis que tu es là. »
  T: « Avant, je ne tenais rien. »
> C: « … »
  T: « Muet. »
  T: « Reste. Les muets ne me volent pas de temps. »
fin

## scene: comptoir-2
sujet: comptoir
rang: 2
cond: a-vendu
cycle-min: 1

T: « Le plateau penche. Tu as vendu. »
  mise-en-scene: *Il aligne trois clous du bout du doigt.*
> A: « Tu les comptes trois fois ? »
  T: « Deux. La troisième, je la fais pour toi. »
  T: « Un client qui compte ses sous part plus vite. »
> B: « Tu le vois à quoi ? »
  T: « À la poussière. Tu as posé ton sac plus léger. »
  T: « Ta main droite a maigri. »
> C: « Je regarde tes balances. »
  T: « Elles ont pesé avant toi. Elles pèseront après. »
  T: « Le bois s’use au milieu. La pierre, non. »
fin

## scene: marchandises-1
sujet: marchandises
rang: 0
cond: -
cycle-min: 1

T: « Tout se vend. Le reste, je le garde. »
  mise-en-scene: *Il pousse du pied un sac de cordes.*
> A: « Le bois ne vaut rien. »
  T: « Le bois, presque rien. »
  T: « Le manche, trois fois plus. »
> B: « Et les pages ? »
  T: « Ramassées. Quelqu’un les cherche toujours. »
  T: « Je ne lis pas ce que je vends. »
> C: « … »
  T: « Touche. Tu peux toucher. »
  T: « Rien ici ne mord. »
fin

## scene: marchandises-2
sujet: marchandises
rang: 2
cond: age>=5
cycle-min: 2

T: « Tes bords sont nets. Tu as appris. »
  mise-en-scene: *Il retourne une planche et suit l’arête avec l’ongle.*
> A: « Une mauvaise planche se vend ? »
  T: « Deux fois moins. Trois, si le nœud est au milieu. »
  T: « Le nœud, tu le coupes. Pas moi. »
> B: « Tu as vu pire que moi. »
  T: « J’ai vu des mains qui forçaient. »
  T: « Elles ne revenaient pas. Toi, tu reviens. »
> C: « Rien à vendre aujourd’hui. »
  T: « Alors écoute. Le cuir se garde. La corde, non. »
  T: « La corde sèche et casse. »
fin

## scene: terres-1
sujet: terres
rang: 0
cond: -
cycle-min: 1

T: « Les routes, ici, passent sous l’herbe. »
  mise-en-scene: *Il désigne du menton l’herbe derrière ses tonneaux.*
> A: « Où est-ce qu’elles allaient ? »
  T: « D’un bord à l’autre. Comme aujourd’hui. »
  T: « Avec moins de monde dessus. »
> B: « Tu en as suivi une ? »
  T: « Une seule. Elle s’arrêtait à l’eau. »
  T: « Je ne nage pas. »
> C: « Et l’autre côté ? »
  T: « Je n’y suis pas allé. »
  T: « Ma balance ne voyage pas. »
fin

## scene: terres-2
sujet: terres
rang: 2
cond: cycle>=2
cycle-min: 2

T: « Tu reviens d’où, cette fois ? »
  mise-en-scene: *Il soulève le loquet de son comptoir, puis le laisse retomber.*
> A: « D’une terre sans nom. »
  T: « Toutes en ont un. Les gens oublient. »
  T: « Le vent, là-bas, sent le fer. »
> B: « Tu connais ce chemin mieux que moi. »
  T: « Je connais le bout d’ici. Après, je devine. »
  T: « Je devine mal. »
> C: « Je reste ici, pour l’instant. »
  T: « Tu restes. Le comptoir se vide moins vite. »
  T: « Et moi, je pèse plus tranquille. »
fin

## scene: mains-1
sujet: mains
rang: 0
cond: -
cycle-min: 1

T: « Montre. »
  mise-en-scene: *Il prend ta main et la retourne, sans délicatesse.*
> A: « Elles sont encore tendres. »
  T: « Tendres, oui. Elles saignent au même endroit. »
  T: « Le même endroit, c’est bon signe. »
> B: « Tu regardes toujours les mains ? »
  T: « Les yeux mentent. Les mains, moins. »
  T: « Elles ont des cals là où on travaille. »
> C: « … »
  T: « Tu me laisses faire. »
  T: « Les nouveaux retirent leur main. »
fin

## scene: mains-2
sujet: mains
rang: 2
cond: a-tout-etudie
cycle-min: 2

T: « Tu as étudié tout ce que tu portais. »
  mise-en-scene: *Il laisse tomber une poignée de sciure sur le plateau.*
> A: « Comment tu le sais ? »
  T: « Tu portes moins. Tu choisis mieux. »
  T: « Un objet qu’on connaît, on le pose au bon endroit. »
> B: « Il restait des choses que je ne comprenais pas. »
  T: « Il en restera toujours. »
  T: « Tu as gagné du temps. Déjà beaucoup. »
> C: « Tu as tout appris, toi ? »
  T: « Je pèse. Je n’apprends pas. »
  T: « Ce que je pèse, je le connais de la main. »
fin

## scene: ciel-1
sujet: ciel
rang: 0
cond: -
cycle-min: 1

T: « Là-haut, il n’y a rien à vendre. »
  mise-en-scene: *Il lève à peine la tête, comme pour vérifier.*
> A: « Tu regardes quand même. »
  T: « Le soir. Quand la balance est juste. »
  T: « Une étoile rouge, parfois. Elle clignote. »
> B: « Il y a des choses, là-haut. »
  T: « Il y a de la place. »
  T: « Beaucoup de place. »
> C: « … »
  T: « Regarde toi-même. »
  T: « Je ne décris pas ce qui ne se pèse pas. »
fin

## scene: ciel-2
sujet: ciel
rang: 2
cond: age>=9
cycle-min: 2

T: « Cette nuit, l’étoile rouge était plus basse. »
  mise-en-scene: *Il pose sa chandelle au bord du plateau et la laisse brûler.*
> A: « Plus basse, ou plus grosse ? »
  T: « Plus basse. Elle éclairait le bord du comptoir. »
  T: « Le bord, pas le milieu. »
> B: « Tu la surveilles depuis longtemps. »
  T: « Je la note. Sur le bois, avec l’ongle. »
  T: « Les encoches ne disent rien à personne. »
> C: « Elle te fait peur ? »
  T: « Je range les clous. »
  T: « On range. On ne prie pas. »
fin

## scene: avant-1
sujet: avant
rang: 0
cond: -
cycle-min: 1

T: « Les Anciens payaient. Le reste, je ne sais pas. »
  mise-en-scene: *Il essuie le plateau avec le dos de la manche.*
> A: « Ils payaient avec quoi ? »
  T: « Des pièces. Les mêmes que les tiennes. »
  T: « Plus lourdes. »
> B: « Ils te parlaient ? »
  T: « Ils commandaient. »
  T: « Une voix qui commande ne demande rien. »
> C: « … »
  T: « Rien à ajouter. »
  T: « Ils sont partis. Je suis resté. »
fin

## scene: avant-2
sujet: avant
rang: 3
cond: cycle>=2
cycle-min: 2

T: « Tu remues le passé. Il ne se remue pas. »
  mise-en-scene: *Il remet droit un pot de clous qui n’était pas de travers.*
> A: « Le jour où tout s’est arrêté, tu étais où ? »
  T: « Derrière ce comptoir. »
  T: « Le comptoir n’a pas bougé. Moi, si. »
> B: « Tu as connu quelqu’un d’avant ? »
  T: « Des visages. Aucun nom. »
  T: « Les noms, je les écris. Je ne les retiens pas. »
> C: « Laisse. Je demanderai autre chose. »
  T: « Demande. »
  T: « Ce que je ne dis pas, je ne le dis pas. »
fin

## scene: clients-1
sujet: clients
rang: 0
cond: -
cycle-min: 1

T: « Il en passe. Aucun ne reste. »
  mise-en-scene: *Il regarde la route par-dessus ton épaule.*
> A: « Des gens comme moi ? »
  T: « Comme toi, vaguement. »
  T: « Les mains dures, les yeux ailleurs. »
> B: « Ils achètent quoi ? »
  T: « Des cordes. Du feu. »
  T: « Personne n’achète de l’eau. »
> C: « … »
  T: « Tu attends quelqu’un ? »
  T: « Ils ne préviennent pas. »
fin

## scene: clients-2
sujet: clients
rang: 2
cond: a-vendu
cycle-min: 2

T: « Un client m’a laissé une dette, hier. »
  mise-en-scene: *Il tourne une petite planche entre ses doigts, un nom gratté dessus.*
> A: « Tu la réclames, la dette ? »
  T: « Non. Je la note. »
  T: « Les dettes écrites se rappellent toutes seules. »
> B: « Qui te doit ça ? »
  T: « Quelqu’un qui reviendra. »
  T: « Ils reviennent tous. Pour une raison ou une autre. »
> C: « Je paie avant de partir. »
  T: « Toi, tu paies. Je le vois à la main. »
fin
