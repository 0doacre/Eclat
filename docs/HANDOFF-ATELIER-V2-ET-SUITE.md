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

### Ce que résout ce prototype (6 améliorations ciblées) :
1. **Thermomètre d'Atelier équipé enrichi & Réminiscence (`E.equipmentThermometer` dans `js/equipements.js` & `js/atelier-equipe.js`)** :
   - Sans modifier les invariants des tests existants (aucune mutation d'état ni révélation de nom sur un essai incompatible), `E.attemptWith` retourne un objet `thermo` précis et gratifiant qui distingue 4 niveaux de chaleur :
     - **🔥 Brûlant (`brulant`)** :
       - Matières exactes pour ce poste, mais autre outil du poste ou autre allure (ex. *Foyer* en cuisson vive au lieu de chauffe douce).
       - **OU ingrédient superflu** : les bonnes matières de la recette sont présentes sur l'établi avec le bon outil et le bon geste, mais une matière en trop a été posée (*« Cet outil et ce geste reconnaissent ces matières, mais l’une d’entre elles est superflue sur l’établi. »*).
     - **🌡️ Chaud (`chaud`)** : matières exactes d'une recette de l'âge, mais sur un autre poste de travail (ex. *Établi* au lieu de *Foyer*).
     - **🌤️ Tiède (`tiede`)** : au moins une matière posée entre dans une recette inconnue de cet outil et de ce geste, avec décompte explicite du nombre de matières manquantes et attendues (*« Cet outil et ce geste travaillent bien ces matières, mais il manque N ingrédient(s) (M matières attendues). »*).
     - **❄️ Froid (`froid`)** : aucune réaction avec cet outil et ce geste.
   - **Récompense de Réminiscence (`E.remember`)** : dans `forge()`, tout essai chaud ou brûlant déclenche la Réminiscence de l'établi, faisant avancer le carnet d'apprentissage du Semeur sans frustration en cas d'échec proche.
2. **Continuité multi-âges sans quitter l'Atelier V2 (`Grand Atelier (Âges 4+)` dans `js/atelier-equipe.js`)** :
   - Dès `S.age >= 3`, un poste **« Grand Atelier (Âges 4+) »** apparaît directement dans la barre des postes `.ae-posts`.
   - Il expose tous les gestes/procédés débloqués des âges avancés (`Allier`, `Marteler`, `Chauffer`, `Distiller`, `Électriser`, `Synthétiser`, etc.) dans la même interface V2, sans forcer le joueur à basculer vers l'ancien écran V1.
3. **Ergonomie mobile repensée (`css/atelier-equipe.css`)** :
   - Sur mobile (`@media(max-width:1100px)`), `.ae-tools` passe au-dessus des emplacements (`order: -1`) sous forme de bandeau horizontal compact : l'œil et le pouce suivent l'ordre naturel **Poste → Outil → Emplacements → Action → Matières**.
4. **Rethématisation narrative de l'Apprenti & Monnaies d'époque (`currencyName(age)`)** :
   - Remplacement du vocabulaire fiscal et industriel anachronique : l'« ouvrier » devient un **Apprenti**, son « salaire » devient une **part réservée**, et « embaucher » devient **accueillir**.
   - La monnaie d'atelier s'adapte dynamiquement selon l'âge : *rations de troc* (Âges 0–1), *coquillages* (Âges 2–3), *écus* (Âges 4–6), *florins* (Âges 7–8), *crédits* (Âges 9+).
5. **Encart « Part de l'apprenti » repliable et sans blocage de travail (`js/atelier-economie.js` & `js/atelier-equipe.js`)** :
   - Ajout de `E.workerAutoFund(on)` (case à cocher *« Réapprovisionner la part réservée »* `#ae-autofund` + bouton *« Avancer 5 [monnaie] »* `[data-ae="fund5"]`) : tant que le joueur a au moins 1 unité de monnaie en bourse (alimentée par les ventes du troqueur/marchand), l'apprenti renouvelle automatiquement son avance au lieu de tomber en panne toutes les 56 secondes.
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
3. **Ce qui a été implémenté pour parachever cette vision** :
   - **Passerelle immédiate Découverte → Cadences d’atelier (`E.setCadence`)** : sur chaque recette maîtrisée du poste, un bouton direct **« ⚙️ Cadencer »** permet d'ordonner aux machines au repos de maintenir le stock à 100 sans jamais devoir chercher la machine dans l'onglet *Domaine*. Le bouton reflète l'état temps réel (**« ⚙️ 100 »** ou **« ⏸️ En pause »**).
   - **Retours sensoriels & sonores du geste artisanal** :
     - **Bruits de matière réalistes** : `w.mode` est fidèlement mappé sur les synthétiseurs audio de `A.craft(soundGesture)` (*chauffer* au foyer, *tailler* au silex/couteau, *marteler* l'enclume, *assembler* à la main, *usiner* au polissoir).
     - **Retours thermiques & cinétiques tactiles** : `#ae-result` arbore des auras visuelles animées selon la chaleur du thermomètre (`.ae-heat-brulant` halo rouge-braise, `.ae-heat-chaud` ambre, `.ae-heat-tiede` halo doux, `.ae-heat-froid` brume ardoise, `.ae-heat-success` impulsion verte d'artisanat).
   - **Élagage de l'établi** : l'encart d'intendance de l'apprenti et du troc est désormais replié par défaut dans une barre compacte avec résumé d'état en 1 ligne (*Apprenti actif · N monnaie*), réservant 100 % de l'espace écran tactile à la paillasse de recherche et à la manipulation des matières.
