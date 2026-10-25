/* Préparer un lot sans modifier la Réserve ni créer de commande. */
(function (root) {
  "use strict";
  function lot(E, D, id, choix) {
    const it = D.ITEMS[id];
    if (!it || !it.r || !E.state.known[id]) return null;
    let n = E.isUnique(it) ? 1 : choix === "max" ? E.maxPlan(id) : Math.max(1, Math.floor(Number(choix) || 1));
    if (E.isScaled(it) && choix !== "max") n = n === 1 ? 1 : Math.min(n, 10);
    if (!n) return { n: 0, sortie: 0, cout: {}, plan: null, duree: null };
    const plan = E.plan(id, n);
    const possible = E.ageOK(id) && !E.blocker(id) && !plan.locked.length && !Object.keys(plan.blocked).length;
    return { n, sortie: n * it.r[2], cout: E.totalCost(id, n, E.count(id) + E.queued(id)), plan,
      duree: possible ? E.orderTime(id, n) : null };
  }
  const api = { lot };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.EclatCarnet = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
