/* ÉCLAT — les ateliers à travers les âges (0.40, 0.41).
 * Sept familles d'ateliers, l'échelle main → apprenti → ouvriers → machines → robots, et l'énergie en chevaux.
 * Les tables (familles, répartition des pièces, âges des échelons, chevaux, coûts) sont dans js/data.js
 * (D.ATELIERS, D.TRAVAILLEURS) ; l'embauche et le travail sont dans le moteur (E.embaucher, E.travailleurs).
 * Ce module ne fait que LIRE pour l'affichage : il n'écrit rien. L'énergie s'affiche, elle ne ralentit encore
 * personne (0.43). Étude : docs/revue/etude-ateliers-a-travers-les-ages-0-39.md */
(function (root) {
  "use strict";

  function create(api) {
    const { E, D } = api;
    const I = D.ITEMS, T = D.ATELIERS, TR = D.TRAVAILLEURS;
    const S = () => E.state;

    const famille = (id) => E.atelierDe(id);
    const ordinaire = (id) => { const it = I[id]; return it && it.r && !it.sec && !it.path && !it.old && !E.isUnique(it) && !E.isScaled(it); };
    const connues = (f) => Object.keys(S().known).filter((id) => ordinaire(id) && famille(id) === f);

    function energie() {
      let offre = T.baseCh;
      const sources = [{ id: "bete", n: "Bête de trait", ch: T.baseCh }];
      T.sources.forEach((s) => { if (E.count(s.id) > 0) { offre += s.ch; sources.push({ id: s.id, n: I[s.id] ? I[s.id].n : s.id, ch: s.ch }); } });
      const ms = E.machines();
      let demande = 0;
      T.paliers.forEach((p) => { const m = ms[p.id]; if (m) demande += m.used * p.ch; });
      const tr = E.travailleurs();
      for (const f in tr) demande += tr[f].usedApp * TR.apprenti.ch + tr[f].usedOuv * TR.ouvrier.ch;
      const ratio = demande <= 0 ? 1 : Math.min(1, offre / demande);
      return { offre, demande, ratio, sources };
    }

    /* ce que le joueur peut embaucher dans cet atelier, et pourquoi il ne le peut pas */
    function embauches(f) {
      const a = (S().ateliers && S().ateliers[f]) || {};
      return ["apprenti", "ouvrier"].map((kind) => {
        const d = TR[kind], key = kind === "apprenti" ? "app" : "ouv", n = a[key] || 0;
        let pourquoi = "";
        if (S().age < d.age) pourquoi = "age";
        else if (n >= d.max) pourquoi = "max";
        else if ((S().ecus || 0) < E.coutEmbauche(f, kind)) pourquoi = "ecus";
        return { kind, n: d.n, nombre: n, max: d.max, cout: E.coutEmbauche(f, kind), age: d.age, pourquoi };
      });
    }

    function carte(f) {
      const F = T.familles.find((x) => x.id === f);
      const rec = connues(f), age = S().age;
      const set = new Set(rec);
      const cads = E.cadences().filter((c) => set.has(c.id));
      const ms = E.machines();
      let echelon = 0, machs = 0;
      T.paliers.forEach((p) => {
        const m = ms[p.id];
        if (!m) return;
        const sur = Object.keys(m.byRec).filter((r) => set.has(r)).reduce((a, r) => a + m.byRec[r], 0);
        if (sur > 0) { machs += sur; echelon = Math.max(echelon, p.echelon); }
      });
      const a = (S().ateliers && S().ateliers[f]) || { app: 0, ouv: 0 };
      if (a.app > 0) echelon = Math.max(echelon, 1);
      if (a.ouv > 0) echelon = Math.max(echelon, 2);
      const cadence = cads.reduce((x, c) => x + (c.status === "ok" ? c.rate * 60 : 0), 0);
      const bloques = cads.filter((c) => c.status === "starved" || c.status === "nomach");
      let etat = "repos", cause = "";
      if (bloques.length) {
        etat = "bloque";
        const b = bloques[0];
        cause = b.status === "nomach" ? "pas de travailleur capable de " + (I[b.id] ? I[b.id].n.toLowerCase() : b.id)
          : "manque " + b.miss.map((i) => (I[i] ? I[i].n.toLowerCase() : i)).join(", ");
      } else if (cads.some((c) => c.status === "ok")) etat = "marche";
      else if (cads.some((c) => c.status === "full")) { etat = "plein"; cause = "la Réserve est pleine"; }
      const echelles = T.echelons.map((e, i) => ({
        id: e.id, n: e.n, age: e.age,
        etat: i < echelon ? "fait" : i === echelon ? "courant" : age >= e.age ? "dispo" : "ferme"
      }));
      return {
        id: f, n: F.n, ic: F.ic, d: F.d, recettes: rec, ordres: cads, machines: machs, apprentis: a.app || 0, ouvriers: a.ouv || 0,
        echelon, echelles, cadence, etat, cause, embauches: embauches(f)
      };
    }

    /* les ateliers que le joueur a déjà de quoi montrer : au moins une recette connue de la famille */
    function liste() {
      return T.familles.filter((F) => connues(F.id).length > 0).map((F) => carte(F.id));
    }

    return { famille, connues, carte, liste, energie, embauches };
  }

  const Ateliers = { create };
  root.EclatAteliers = Ateliers;
  if (typeof module !== "undefined" && module.exports) module.exports = Ateliers;
})(typeof window !== "undefined" ? window : globalThis);
