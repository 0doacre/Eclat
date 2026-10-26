# Deuxième couche de prestige liée aux fins (0.35.0)

> Spécification et règles d'Écho des dénouements d'Éclat.

---

## 1. Intention et cadre de conception

Comme énoncé dans `docs/AUDIT-INSPIRATIONS.md` (point *d. Une deuxième couche de prestige*) :
> *« Quand le premier prestige devient routine, une couche au-dessus le remet en question. Elle apporte aussi une nouvelle règle, pas seulement des nombres. »*

Dans la version 0.34.0, chaque fin atteinte accordait un simple bonus brut de `+50 %` aux récoltes manuelles et aux extracteurs (`c.echo = 1 + 0.5 * echoes`). Bien que gratifiant sur le plan quantitatif, ce bonus restait une simple extension de la couche de base : il n'offrait aucune nouvelle possibilité tactique, aucun changement de rythme ou d'approche du jeu.

La **version 0.35.0** introduit la **deuxième couche de prestige** :
1. **Une règle par dénouement** : Chacune des 5 fins du jeu éveille une règle majeure et permanente, liée au sens diégétique de ce dénouement (le Grand Œuvre ou la voie choisie).
2. **De nouvelles règles, pas seulement des nombres** : Ces effets débloquent des capacités structurelles (le geste Chauffer utilisable d'emblée à 600 °C sans feu de camp préalable, les machines qui automatisent une recette connue sans première fabrication manuelle dans le cycle, une veille hors-ligne étendue à 24 h, etc.).
3. **Persistance immuable** : Une fois découverte, la règle d'Écho reste active pour tous les Semeurs et cycles suivants.
4. **Lisibilité et transmission** : Les règles éveillées sont consultables dans le Journal (onglet *Fins*) et intégrées dans la *Mémoire des mains*.

---

## 2. Les 5 Règles d'Écho majeures (`D.ECHOS_FINS`)

| Fin | Identifiant | Grand Œuvre / Voie | Nom de la Règle | Icône | Effet concret en jeu |
|---|---|---|---|:---:|---|
| **L'Aube éternelle** | `aube` | La Sphère de Dyson | **Foyer Perpétuel** | ☀️ | Le Soleil capté dispense une chaleur continue : le geste *Chauffer* est actif dès l'éveil (chaleur de base 600 °C sans devoir bâtir le feu de camp d'abord), toutes les stations de chauffe gagnent +200 °C, et les fontes et alliages ont +25 % de chance de pièce bonus. |
| **Le Brasier** | `brasier` | Le Brise-Monde | **L'Onde de Choc** | 💥 | L'impact pulvérise la matière et ouvre la voie : 25 % de chance de coup critique (ressources ×3) sur toutes les récoltes et les extracteurs ; les coûts de passage entre toutes les terres sont réduits de 15 %. |
| **L'Exode** | `exode` | La Treizième Arche | **La Voie des Étoiles** | 🚀 | Le vaisseau a tracé les routes de l'espace profond : la vitesse de toutes les explorations est doublée (durée divisée par 2) ; la veille hors-ligne s'étend jusqu'à 24 heures à plein rendement. |
| **Le Grand Silence** | `silence` | Le Grand Silence | **L'Écho Cosmique** | 🌌 | Les ondes de l'antenne résonnent dans tout le Domaine : régénération continue de +3 ✨ d'Intuition par minute ; le coût en Intuition de l'étude, du déchiffrage et des questions au Livre est divisé par deux. |
| **Les Matines** | `retour` | Le Chant / Les Enfants | **L'Éveil Partagé** | 🕊️ | Les enfants éveillés et le Domaine en harmonie : les automates et machines peuvent fabriquer une recette connue dès le début du cycle sans première fabrication à la main ; vitesse de toutes les machines augmentée de +25 %. |

---

## 3. Détails d'implémentation moteur (`js/engine.js`)

### 3.1 Helpers
- `E.hasEchoFin(k)` : retourne `true` si la fin `k` a été atteinte dans ce cycle ou conservée dans `S.meta.endings`.
- `E.activeEchoesFins()` : retourne la liste des clés des règles d'Écho actuellement actives.

### 3.2 Intégration mécanique
- **Foyer Perpétuel (`aube`)** :
  - `gesteOK("chauffer")` : retourne `true` si `hasEchoFin("aube")`, permettant d'accéder au geste avant d'avoir posé le feu de camp.
  - `recalc()` : `c.heat` est initialisé à `Math.max(600, c.heat + (c.heat > 0 ? 200 : 0))`.
  - `bonusFor()` : pour `chauffer` et `allier`, bonus de probabilité de pièce supplémentaire de +25 %.
- **L'Onde de Choc (`brasier`)** :
  - `E.tap()` : probabilité critique augmentée de +25 %, multiplicateur de critique porté à ×3.
  - `extOut()` : rendement de base des extracteurs augmenté de +25 %.
  - `E.passCost()` : multiplicateur de coût `k` réduit de 15 % (`k *= 0.85`).
- **La Voie des Étoiles (`exode`)** :
  - `recalc()` : `c.exp *= 2` (durée des explorations divisée par 2).
  - `E.catchUp()` : plafond de rattrapage d'absence étendu à 24 heures (`24 * 3600` s) au lieu de 12 heures.
- **L'Écho Cosmique (`silence`)** :
  - `recalc()` : `c.intu += 3` (3 ✨ d'Intuition générés par minute passivement).
  - `E.studyCost()`, `E.decipherCost()`, `E.questionCost()` : coûts en Intuition divisés par 2 (`Math.max(1, Math.ceil(c / 2))`).
- **L'Éveil Partagé (`retour`)** :
  - `machReadyFor()` : dispense de la condition `D.COMMANDES.firstByHand` si `hasEchoFin("retour")`.
  - `recalc()` : `c.aspd *= 1.25` (+25 % de vitesse de traitement pour tous les automates et machines).

---

## 4. Affichage UI

- **Journal → Fins (`js/journal.js`)** :
  - Chaque fin atteinte affiche un encadré distinct avec son icône, son nombre d'accomplissements et un badge mettant en valeur la **Règle d'Écho** éveillée et sa description.
  - Les fins non atteintes affichent une invitation sobre signalant que la règle d'Écho sommeille.
- **Mémoire des mains (`js/memoire.js`)** :
  - La section *Dénouements & Échos* détaille pour chaque fin éveillée sa règle d'Écho active.
