# Écrire les textes d’Éclat

À lire avant d’écrire ou de modifier un texte affiché. Les mots eux-mêmes sont dans
`docs/LEXIQUE.md`.

## Deux couches, séparées

1. **La couche « jeu »** dit ce que fait le joueur et ce que fait l’objet. Elle est très
   explicite et emploie les mots habituels des jeux vidéo : récolter, fabriquer, débloquer,
   augmente, sert à, nécessaire pour. Exemple : « Débloque l’action Chauffer, jusqu’à
   600 °C. » La sorte d’objet (Pièce, Station…) est déjà affichée au-dessus : on ne la répète pas.
   Dans les données, cette ligne est le champ `u` ; le récit est le champ `d`.
2. **La couche « récit »** raconte. Elle est plus littéraire, et s’affiche à part (en
   italique dans les fiches). Exemple : « Le premier feu que tu allumes toi-même. »

On ne les mélange que quand c’est utile, et jamais dans la même phrase.

## Les règles

- **Des phrases françaises.** Sujet, verbe, complément, comme on parle à quelqu’un en face de
  soi. Le test : est-ce que je le dirais tel quel à voix haute ? Sinon, on réécrit.
- **Pas d’anglais traduit.** Pas de futur qui prédit (« tu en mettras partout »), pas de
  tournures calquées (« tu le fabriques d’un bouton »).
- **Très peu de « ce », « ça », « c’est ».** « Tu peux les plier et les nouer », pas « ça se
  plie et ça se noue ». « Lourd, mais solide », pas « c’est lourd mais c’est solide ».
- **Pas d’image pour faire joli.** Une phrase dit une chose concrète : un objet, un geste, un
  chiffre.
- **Le récit se raconte par des gestes.** On montre l’émotion (un sourire), on ne la nomme
  pas.
- **Un clin d’œil de temps en temps**, un peu méta, au plus un par écran : « L’ingrédient de
  base de tout jeu de survie. »
- **Encourager simplement.** « N’hésite pas à faire plusieurs tentatives, ce n’est jamais
  perdu. »
- Tutoiement partout. Pas de tiret cadratin.

## Exemples validés

| Texte | Version retenue |
|---|---|
| Intro | Tu te réveilles dans l’herbe, au bord d’une forêt. Tu ne te souviens de rien, même pas de ton nom. / Tu regardes autour de toi. Tu ramasses un morceau de bois par terre et commences à l’écorcer. / Un sourire naît au coin de tes lèvres : oui, ça, tu t’en souviens. |
| Bois | Sert dans presque toutes les premières recettes. *Dans une forêt, ce n’est pas ça qui manque.* |
| Manche | Sert dans les outils, l’archet à feu et la cabane. *Un bâton bien droit, écorcé. L’ingrédient de base de tout jeu de survie.* |
| Carnet | Le Carnet garde toutes tes recettes. |
| Tutoriel | Tu ne peux fabriquer qu’un objet à la fois. |
