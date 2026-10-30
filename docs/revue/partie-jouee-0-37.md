# Partie jouée dans la preview (0.37.0), notes de Claude

Jouée le 30 octobre 2026 sur `https://craftgame-wrr.pages.dev/` (branche `prewiew-design`), 390 × 812, style Carnet, partie réelle (sans mode test) sur deux visites, avec une absence de 10 minutes entre les deux. Je suis resté dans l'**âge du Bois** : guide, récolte, Manche, Corde, première exploration lancée. Les passages et les âges suivants ne sont pas joués : pour ceux-là, voir `docs/revue/rythme-0-37.md` (bot) et la visite à l'âge de l'Acier dans `docs/AUDIT-EQUIPE-2026-10-30.md` (section 3 bis). Ce document sert de base aux séances de joueurs (`docs/TEST-JOUEURS.md`). Aucun secret du récit n'y figure.

## Ce qui marche

- **Le premier objet** : de « Ouvrir les yeux » au Manche, 5 gestes, environ une minute, avec le message « Geste remarqué : Premiers pas ». Le guide avance un pas à la fois et se saute (« Passer »).
- **La Corde sans aide** : le thermomètre a fait son travail. Avec un Bois resté sur l'établi, il m'a dit « Tiède · Cet outil et ce geste travaillent bien ces matières, mais il manque 2 ingrédients (3 matières attendues) » ; j'ai vidé l'établi, remis des Fibres, et c'est passé. L'échec instruit sans punir.
- **Le retour d'absence** (10 min 43) : une fenêtre « Bon retour ! » sur papier, ce qui a été produit, « Reprendre le fil » avec l'objectif à reprendre et deux boutons (« Reprendre l'objectif », « Continuer »). Clair, sobre, utile.
- **Le Carnet d'objectif** : l'objectif nomme l'action (« Explorer le Grand Chêne ») et son bouton, le détail se déplie.
- **« Fabrication rapide »** sous l'Atelier : les recettes déjà maîtrisées sont rejouables sans repasser par l'établi.

## Ce qui a frotté

1. **La bannière « Une nouvelle version d'Éclat est prête »** est restée affichée à chaque écran (environ 110 px sur 812) pendant toute la visite, dans une partie réelle et pas seulement en mode test. Elle prend plus de place que n'importe quelle carte du jeu et ne se ferme pas ; on ne peut que « Mettre à jour » ou « Ma sauvegarde ». Pour un joueur qui n'a rien demandé, c'est du bruit permanent. À reconsidérer (un bandeau d'une ligne, ou une pastille dans le menu).
2. **Le bandeau de récolte** masque les messages de confirmation : « Fabriqué : Corde » est à moitié sous lui dans l'Atelier. C'est le défaut déjà confié à Gemini.
3. **Matière résiduelle sur l'établi** : le Bois de mon premier essai est resté sur l'établi pendant que je cherchais la Corde, et le thermomètre l'a compté comme un ingrédient en trop. Un nouveau joueur ne comprendra peut-être pas pourquoi « Tiède » : il faut lui dire quoi retirer, ou vider l'établi à chaque fabrication réussie.
4. **Chiffres à décimales** : le stock affiche « Fibres 6,4 », « Bois 1,13 k ». Les décimales sur une matière que l'on récolte une par une sont un bruit ; « 1,13 k » est lisible mais surprenant à l'âge du Bois, où le joueur n'a pas encore l'habitude des milliers.
5. **Surproduction du Bois** : mon bois est monté à plus de mille pendant que je cherchais autre chose (la récolte continue ne s'arrête pas quand on change de matière sans l'avoir arrêtée). Ce n'est pas bloquant ; le simulateur montre le même excédent à 120 minutes.
6. **L'icône vide** de la fenêtre « Bon retour » : une case ronde vide devant « +508 Bois ». L'image de l'objet ne s'affiche pas (ou c'est volontairement une case à cocher, ce qui ne se comprend pas). À vérifier par Codex.
7. **Doublon de texte** dans la même fenêtre : « Avant ton départ : Corde. » et « Objectif à reprendre : Corde. » disent la même chose.
8. **L'exploration** se lance par un bouton, puis « avance seule » ; je n'ai pas vu la durée annoncée. Pour un nouveau joueur, savoir combien de temps (et que le jeu continue fermé) est la seule information qui lui manque à cet endroit.
9. **La bulle « L'Intuition »** couvre le bas de l'établi pendant qu'on fabrique. Le guide ne gêne plus l'appui sur les onglets (point corrigé depuis l'audit d'octobre), mais cette bulle masque les cases où poser des matières.

## À regarder en test de joueurs

- La bannière de mise à jour : la voient-ils, la comprennent-ils, appuient-ils dessus ?
- Le thermomètre quand l'établi garde une matière : comprennent-ils quoi retirer ?
- Le moment de l'exploration : savent-ils qu'elle avance seule, et combien de temps elle prend ?
- Les chiffres à décimales sur les stocks : perturbent-ils ou non ?
