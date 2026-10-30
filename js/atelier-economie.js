/* L'ancienne boucle de l'argent (apprenti de l'établi, marchand de lanières, taxes) est RETIRÉE en 0.41 :
 * les ateliers embauchent désormais des apprentis et des ouvriers en écus (E.embaucher, js/engine.js), sans vente
 * automatique ni salaire. Les parties qui l'avaient utilisée sont migrées au chargement (migrerAteliers, js/engine.js).
 * Ce fichier ne garde que des réponses neutres, pour que le reste du code ne casse pas pendant la transition. */
(function (root) {
  "use strict";
  const NEUTRE = { v: 1, hired: false, working: false, autoFund: false, budget: 0, progress: 0, merchant: false, reserve: 0, clock: 0, saleClock: 0, quota: 0, sold: 0, totalSold: 0, gross: 0, tax: 0, net: 0, wages: 0, produced: 0, status: "", wage: 0, hire: 0, price: 0, duration: 0, tool: null, nextRate: 0, period: 60 };
  function attach(E) {
    E.merchantQuote = () => ({ n: 0, gross: 0, tax: 0, net: 0 });
    E.merchantSell = () => ({ ok: false, why: "retire" });
    E.merchantConfigure = () => true;
    E.workerHire = () => ({ ok: false, why: "retire" });
    E.workerFund = () => ({ ok: false, why: "retire" });
    E.workerWithdraw = () => ({ ok: false });
    E.workerSet = () => false;
    E.workerAutoFund = () => false;
    E.atelierEconomyInfo = () => Object.assign({}, NEUTRE);
    E.atelierEconomyStep = () => {};
  }
  const API = { attach };
  root.EclatAtelierEconomy = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
