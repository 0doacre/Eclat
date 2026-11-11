# T7 · L'audit : son détecteur, puis le rapport « après »

Lis d'abord `docs/chantier-interface/MAITRE.md` : il porte le but, les règles communes et la forme du compte rendu. Réponds en français.

Passe en dernier, quand les autres tâches sont fusionnées.

## Pourquoi
Le relevé `tools/audit-interface.js` sert de contrôle au chantier, mais plusieurs de ses mesures sont fausses ou trop larges, et son rapport date d'avant les corrections.

## Faits vérifiés
- Le détecteur de vide (vers la ligne 181) compare un bloc à son voisin dans le document, pas à celui qui le précède à l'écran. Il a compté 333 px de contenu comme du vide sur les Terres.
- Il range dans « défilement horizontal » les rangées qui glissent de côté exprès (`.prod-choix`, `.filters`, `.terres-rangee`).
- Il passe 320 × 568, 390 × 844, 430 × 932 et 1280 × 800, mais ni 360 × 640 ni 390 × 700.
- Il impute parfois une erreur de page au cas en cours quand elle vient du cas précédent.

## À faire
1. Corrige ces quatre points. Les rangées voulues ont leur propre type, classé à part.
2. Ajoute un contrôle : aucune vue principale ne défile (Terres, Étude, Atelier, page d'un métier), aux six tailles.
3. Rejoue tout et écris la section « Après correction » de `docs/AUDIT-INTERFACE-2026-11-11.md` : un tableau avant et après, ce qui reste et pourquoi, et les deux diagnostics du premier rapport qui étaient faux (la cause du vide des Terres, la feuille du bas comme réponse aux fiches).
4. Régénère le relevé et les captures de `docs/audit-interface/`.
5. Ne touche à aucun fichier du jeu.

## Fini quand
- Le script sort avec le code 0, ou chaque ligne restante est expliquée dans le rapport.
- Un essai truqué (option `--inject`) prouve que le contrôle « aucune vue ne défile » voit bien une vue qui défile.
