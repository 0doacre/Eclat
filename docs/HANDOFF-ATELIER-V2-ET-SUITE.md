# Handoff Technique & Produit — Éclat (Atelier V2, Lots 1 & 2, Suite de la Feuille de Route)

*Dernière mise à jour : 29 octobre 2026*

Ce document résume l'état exact du dépôt `0doacre/Eclat`, des branches `main` et `prewiew-design` (orthographiée avec un `w`), des PRs fusionnées, du prototype d'Atelier V2 unifié (`gemini/prototype-atelier-unifie-v2`), et des prochains chantiers à mener pour que **Gemini Flash**, **Claude** ou tout autre agent puisse reprendre la main immédiatement sans perte de contexte.

---

## 1. Topologie des Worktrees et Branches Git

| Worktree local | Branche active | Commit de référence | Rôle |
| :--- | :--- | :--- | :--- |
| `C:\Users\sylva\OneDrive\Documents\ChatGPT\Eclat\gemini-main` | `main` | `ca506df` (poussé sur `origin/main`) | Branche principale de production (Atelier V1 classique + tous les correctifs + Lots 1 & 2). **Ne jamais fusionner `prewiew-design` dans `main` sans décision explicite.** |
| `C:\Users\sylva\OneDrive\Documents\ChatGPT\Eclat\gemini-preview` | `prewiew-design` / `gemini/prototype-atelier-unifie-v2` | `b19cd7c` (`origin/prewiew-design`) | Branche de prévisualisation contenant l'Atelier équipé V2 (`js/equipements.js`, `js/atelier-equipe.js`, `js/atelier-economie.js`), l'habillage dessiné (`css/atelier-dessine.css`) et les illustrations du Carnet peint (`css/carnet-peint.css`), synchronisée avec `main`. |

### Commandes de validation obligatoires avant tout commit / push
```bash
node tools/test-boutons.js --write   # Met à jour docs/boutons.json et docs/boutons.md si un bouton a été ajouté/modifié
node tools/build.js                  # Recalcule l'empreinte SHA-256 dans sw.js (en LF)
npm test                             # Exécute l'intégralité des suites (syntaxe, moteur, guidage, équipements, économie, récit, build)
```
> **Note d'authentification GitHub CLI (`gh`) sous PowerShell** :
> Si `gh` demande un token, l'extraire depuis le credential helper Git :
> ```powershell
> $cred = "protocol=https`nhost=github.com`n`n" | git credential fill
> $env:GH_TOKEN = ($cred | Select-String "^password=(.+)$").Matches.Groups[1].Value
> ```

---

## 2. Ce qui a été livré et fusionné (dans `main` ET `prewiew-design`)

1. **PR #157 — Équilibrage des relèves (`js/engine.js`, `js/data.js`, `js/domaine.js`)** :
   - **Piste 1 (`maxAge` front pionnier)** : `S.meta.maxAge` mémorise l'âge maximal historique atteint. `E.shouldSuggestReleve()` ne suggère plus de relève prématurée tant que le joueur est en phase de rattrapage (`S.age < S.meta.maxAge`), sauf s'il a dépassé ce front ou accumulé un gain massif (`gain >= tracesTotal + 10` après 45 min).
   - **Piste 4 (Ruines des stations uniques)** : `EXTS.concat(MACHINES).concat(STATIONS)` laisse une ruine réparable à 10 % du coût (`D.RUINES.part`) lors d'une relève.
   - **Piste 2 (Élan de rattrapage)** : Dans `handTime`, tant que `S.age <= S.meta.maxAge` (`maxAge >= 3`), un multiplicateur de vitesse supplémentaire accélère les âges déjà conquis.
2. **PR #160 — Correctifs pré-alpha issus des playtests (`js/engine.js`, `js/memoire.js`, `js/quetes.js`)** :
   - `E.ruinResolve(id)` : permet de réparer une ruine directement à partir des matières premières en Réserve si ses sous-composants sont connus.
   - Raccourci (`E.canSkip` / `E.takeSkip`) : vérifie et débite le coût réel avec croissance d'échelle (`1.15^k`).
   - Passage Plaine (`Q.passHTML`) : propose un bouton direct `[data-chain="torche"]` quand un lieu de la Lisière requiert une recette déjà connue mais non fabriquée.
   - `openMemoire` : ouvre directement l'onglet pertinent (`dons` si un don attend, `arbre` si des Traces sont disponibles).
3. **PR #161 — Lot 1 : Jalons gratifiants & Confort visuel (Chantiers C & D)** :
   - **Miroir du cycle** (`S.stats.cyclePlay`, `S.stats.splits`, `S.meta.lastSplits`, `S.meta.bestSplits`) : enregistre le temps de conquête de chaque terre et affiche les écarts (`-1m 20s` en vert) dans le bilan de relève (`js/memoire.js`).
   - **Échos des ruines** (`D.RUINES.echos`, `E.ruinEcho`) : toast narratif lors de la première réparation d'une ruine dans un cycle.
   - **Grand texte dès l'éveil** (`[data-m="toggleLargeText"]`) : bouton directement accessible sur la modale d'introduction.
   - **Célébration d'ouverture de terre** (`[data-m="goZone"]`) : modale dédiée présentant les nouvelles ressources de la terre ouverte.
4. **PR #164 — Lot 2 : Découverte accompagnée & Cadences d'atelier (Chantiers A & B)** :
   - **Découverte accompagnée (`js/quetes.js`, `js/atelier.js`, `js/ecouteurs.js`)** : affiche le nombre de ressources attendues (`✦ Nouvelle recette · 2 ressources`), le bouton **« Poser l'indice sur l'établi »** (`[data-apply-hint]`, compatible V1 et V2) dès le niveau d'indice 1, et le bouton **« ✨ Déchiffrer »** (`[data-goal-decipher]`) directement dans l'encart d'objectif de l'Atelier.
   - **Cadences d'atelier (`E.setCadence`, `E.cadences`, `runCadences` dans `js/engine.js`, UI dans `js/domaine.js`)** : permet de fixer un plafond de maintien de stock (ex. 50 cordes, 100 charbons) sur les machines libres sans bloquer les commandes manuelles prioritaires (`S.hand.q`).

---

## 3. Le Prototype d'Atelier V2 Unifié (`gemini/prototype-atelier-unifie-v2`)

Suite aux playtests des 6 personas (Martine, Léa, Enzo, Thomas, Julien, Chloé) sur `prewiew-design`, un prototype fonctionnel a été implémenté sur la branche **`gemini/prototype-atelier-unifie-v2`** (dans `C:\Users\sylva\OneDrive\Documents\ChatGPT\Eclat\gemini-preview`).

### Ce que résout ce prototype (4 améliorations ciblées) :
1. **Thermomètre d'Atelier équipé rebranché (`E.equipmentThermometer` dans `js/equipements.js` & `js/atelier-equipe.js`)** :
   - Sans modifier les invariants des tests existants (aucune mutation d'état ni révélation de nom sur un essai incompatible), `E.attemptWith` retourne désormais un objet `thermo` qui distingue 4 niveaux de chaleur :
     - **🔥 Brûlant (`brulant`)** : matières exactes pour ce poste, mais autre outil du poste ou autre allure (ex. *Foyer* en cuisson vive au lieu de chauffe douce).
     - **🌡️ Chaud (`chaud`)** : matières exactes d'une recette de l'âge, mais sur un autre poste de travail (ex. *Établi* au lieu de *Foyer*).
     - **🌤️ Tiède (`tiede`)** : au moins une matière posée entre dans une recette inconnue de cet outil et de ce geste, mais la combinaison est incomplète.
     - **❄️ Froid (`froid`)** : aucune réaction avec cet outil et ce geste.
2. **Continuité multi-âges sans quitter l'Atelier V2 (`Grand Atelier (Âges 4+)` dans `js/atelier-equipe.js`)** :
   - Dès `S.age >= 3`, un poste **« Grand Atelier (Âges 4+) »** apparaît directement dans la barre des postes `.ae-posts`.
   - Il expose tous les gestes/procédés débloqués des âges avancés (`Allier`, `Marteler`, `Chauffer`, `Distiller`, `Électriser`, `Synthétiser`, etc.) dans la même interface V2, sans forcer le joueur à basculer vers l'ancien écran V1.
3. **Ergonomie mobile repensée (`css/atelier-equipe.css`)** :
   - Sur mobile (`@media(max-width:1100px)`), `.ae-tools` passe au-dessus des emplacements (`order: -1`) sous forme de bandeau horizontal compact : l'œil et le pouce suivent l'ordre naturel **Poste → Outil → Emplacements → Action → Matières**.
4. **Encart « Faire vivre l'atelier » repliable et sans blocage de salaire (`js/atelier-economie.js` & `js/atelier-equipe.js`)** :
   - Ajout de `E.workerAutoFund(on)` (case à cocher *« Réapprovisionner l'avance »* `#ae-autofund` + bouton *« Avancer 5 écus »* `[data-ae="fund5"]`) : tant que le joueur a au moins 1 écu en bourse (notamment grâce aux ventes du marchand), l'ouvrier renouvelle automatiquement son avance au lieu de tomber en panne toutes les 56 secondes.
   - L'encart économique est encapsulé dans un `<details class="ae-eco-details">` repliable pour libérer la hauteur d'écran sur mobile.

---

## 4. La Vision Directrice du Créateur : « L'Atelier-Laboratoire (Vintage Story / Valheim en 2D Mobile Idle/Clicker) »

> **Citation clé du Lead (à garder au cœur de toutes les décisions de design suivantes)** :
> *« Mon objectif c'est d'avoir un système de craft lisible, fun mais créatif et original. Une fois la recette découverte, la fabrication est simplifiée, l'automatisation finit par prendre le relais. Finalement notre atelier de craft, c'est un laboratoire. Peut-être qu'une fois étudiées, les matières sont automatiquement filtrées pour ne pas que la liste soit longue comme le bras. Mon idée c'est presque d'être dans un jeu comme Vintage Story ou Valheim, mais en 2D sur une interface mobile de clicker et idle game. »*

### Ce que cette vision implique concrètement pour la suite (Cahier des charges pour Gemini Flash / Claude) :

1. **L'Atelier = Un Laboratoire d'expérimentation tactile (et non un entrepôt ni une usine)** :
   - Dans *Vintage Story* (tailler le silex éclat par éclat, cuire l'argile sous la braise, couler le métal en fusion dans un moule) ou *Valheim* (améliorer son établi avec un billot, un chevalet de tannage, une herminette), **chaque découverte est un moment artisanal fort lié à un poste et un outil**.
   - Mais une fois que le Semeur a compris comment façonner l'objet (« Eurêka ! »), **il n'a plus à refaire la manipulation de recherche** : la recette passe dans le **Carnet / Fabrication rapide (1 clic)**, puis est prise en charge par **les Machines et les Cadences d'atelier** (maintien automatique du stock).
2. **Filtrage automatique des matières étudiées (Zéro liste « longue comme le bras »)** :
   - Dès qu'une matière est **étudiée** (`S.studied[id]`) :
     - Si elle cache encore une recette avec l'outil et le geste en main, elle remonte **tout en haut du plateau** avec le badge **`✦ Piste`**.
     - Si elle a déjà livré tous ses secrets (plus aucune réaction inconnue), elle est **automatiquement écartée du plateau de recherche** (accessible uniquement via un petit bouton discret *« Tout voir »* si le joueur veut la consulter), pour que le plateau du Laboratoire ne contienne jamais plus de **4 à 8 matières pertinentes**.
3. **Ce qu'il reste à faire pour parachever cette vision (Feuille de route pour le prochain agent)** :
   - **Étape 1 (Élagage de l'Atelier)** : Retirer de l'onglet `Découvrir` tout ce qui relève de la gestion d'usine répétitive (déplacer ou fusionner l'encart *Faire vivre l'atelier* / *Marchand taxé* vers le Domaine ou les Machines, pour que l'onglet `Découvrir` soit 100 % un Laboratoire pur et immersif).
   - **Étape 2 (Toucher « Vintage Story / Valheim 2D »)** : Enrichir chaque Poste du Laboratoire (`Billot & Établi`, `Foyer de braises`, `Four d'argile`, `Enclume de frappe`, `Dalle de polissage`, puis `Creuset de fonderie`, `Alambic`, `Banc électrique`) avec un retour visuel/sonore de geste artisanal (petite jauge de frappe/chauffe ou retour thermique immédiat via `E.equipmentThermometer`).
   - **Étape 3 (Relais d'automatisation fluide)** : Quand une recette vient d'être découverte au Laboratoire et fabriquée quelques fois à la main (étoiles de maîtrise ★), proposer directement un bouton **« Confier aux Machines (Cadence) »** qui configure son maintien de stock en 1 clic sans même quitter l'écran.
