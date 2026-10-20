# Prompt : phrases d’échec pour les âges de la Pierre et du Cuivre

À donner tel quel à un assistant (Gemini, Sonnet…) ouvert sur ce dépôt.

---

Tu travailles sur « Éclat », un jeu mobile de craft en français (dépôt courant). À l’Atelier,
le joueur choisit un **geste** et jusqu’à trois **matières**. Quand la combinaison ne donne rien,
le jeu affiche une petite phrase d’échec. Les essais les plus probables ont une phrase écrite à la
main dans `D.FAIL_ONE` (fichier `js/data.js`) ; les autres utilisent des modèles (`D.FAIL`).

## Ta tâche

Ajouter à `D.FAIL_ONE` environ **30 phrases** pour les matières des âges de la Pierre et du Cuivre :
argile, silex, sable, eclat (Éclat de silex), engrenage_bois (Rouage de bois), brique, malachite,
cassiterite (Cassitérite), lingot_cuivre, plaque_cuivre, fil_cuivre, lingot_etain (Lingot d’étain).
Avec les gestes assembler, tresser, tailler, chauffer, marteler, allier (une seule matière, ou
deux matières qu’un joueur essaierait naturellement ensemble).

## Règles (importantes)

1. **Clé** : `"geste:matière"` ou `"geste:matière1+matière2"`, les identifiants **dans l’ordre
   alphabétique** (ex. `"chauffer:argile+sable"`).
2. **Jamais une vraie recette** : une combinaison qui existe dans `D.ITEMS` (champ `r: [geste,
   {ingrédients}]`) ne doit pas avoir de phrase. Le test `node tools/test.js` le vérifie : il doit
   rester vert (« échecs : écrits à la main… »).
3. **Ton** : comme les phrases existantes de `D.FAIL_ONE` (lis-les d’abord). Une ou deux phrases
   courtes, concrètes, souvent drôles, jamais méchantes. Le joueur parle à « tu ». Pas de jargon.
   Une phrase sur dix peut glisser un micro-indice de l’histoire (des Semeurs qui se succèdent, des
   souvenirs qui ne sont pas les siens), comme `"tresser:galette"`.
4. **Cohérence physique** : la pierre ne brûle pas, le métal ne se tresse pas, le cuivre fond vers
   1 085 °C (un feu de camp à 600 °C ne suffit pas, un four à 1 100 °C oui), l’étain fond très bas.
5. **Français** : apostrophes typographiques (’), espaces insécables inutiles, pas de tiret
   cadratin. Accords justes.
6. Ne modifie rien d’autre que `D.FAIL_ONE`. Lance `node tools/test.js` avant de rendre le
   travail.

## Rendu

Le bloc ajouté à `D.FAIL_ONE`, et la sortie de `node tools/test.js`.
