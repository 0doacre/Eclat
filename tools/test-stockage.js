/* L’écriture de la partie (js/stockage.js) : un seul onglet enregistre, une page périmée n’écrase rien,
 * un échec d’écriture ne perd pas la partie, la persistance est vérifiée. Faux stockage, faux verrous :
 * les scénarios dans un vrai navigateur sont dans tools/test-stockage-ui.js. */
"use strict";
const assert = require("assert/strict");
const { create, proteger } = require("../js/stockage.js");

let passed = 0;
function test(n, fn) {
  try { fn(); passed++; console.log("  ✓ " + n); }
  catch (e) { console.log("  ✗ " + n + "\n    " + e.stack); process.exitCode = 1; }
}
async function testAsync(n, fn) {
  try { await fn(); passed++; console.log("  ✓ " + n); }
  catch (e) { console.log("  ✗ " + n + "\n    " + e.stack); process.exitCode = 1; }
}

const KEY = "eclat.save.v1";
/* un localStorage partagé entre les « pages » ; `casse` fait échouer les écritures */
function faux(initial) {
  const m = new Map(initial === undefined ? [] : [[KEY, initial]]);
  const s = {
    casse: null, ecritures: 0,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem(k, v) { if (s.casse && s.casse(k, v)) throw Object.assign(new Error("quota"), { name: "QuotaExceededError" }); m.set(k, String(v)); s.ecritures++; },
    removeItem: (k) => m.delete(k)
  };
  return s;
}
/* des verrous comme ceux du navigateur : exclusifs, ifAvailable, file d’attente, rendus à la fermeture de la page */
function fauxVerrous() {
  let tenu = null; const file = [];
  const accorder = (r) => { tenu = r; Promise.resolve().then(() => r.cb({ name: "x" })).then(() => {}, () => {}); };
  return {
    pour(nom) {
      return {
        request(n, o, cb) {
          if (typeof o === "function") { cb = o; o = {}; }
          return new Promise((resolve) => {
            const rec = { page: nom, cb };
            if (!tenu) { accorder(rec); resolve(); return; }
            if (o.ifAvailable) { Promise.resolve().then(() => cb(null)).then(resolve, resolve); return; }
            file.push(rec); resolve();
          });
        }
      };
    },
    fermer(nom) {
      const k = file.findIndex((r) => r.page === nom);
      if (k >= 0) file.splice(k, 1);
      if (tenu && tenu.page === nom) { tenu = null; const suivant = file.shift(); if (suivant) accorder(suivant); }
    }
  };
}
/* une page : son propre module, la partie lue au démarrage, ses rappels notés dans evts */
function page(nom, stockage, verrous, opts) {
  const evts = [];
  const p = { nom, evts };
  p.s = create(Object.assign({ storage: stockage, key: KEY, locks: verrous ? verrous.pour(nom) : null, notify: (e) => evts.push(e) }, opts || {}));
  p.lire = () => p.s.lire(stockage.getItem(KEY));
  return p;
}
const tick = () => new Promise((r) => setTimeout(r, 5));

(async () => {
  console.log("Écriture de la partie : un seul onglet, échecs, persistance");

  await testAsync("deux pages avec verrou : la première écrit, la seconde attend et n’écrit rien, même à sa fermeture", async () => {
    const st = faux("v0"), v = fauxVerrous();
    const A = page("A", st, v), B = page("B", st, v);
    A.lire(); B.lire();
    A.s.demanderVerrou(); B.s.demanderVerrou();
    await tick();
    assert.equal(A.s.etat(), "ok"); assert.equal(B.s.etat(), "attente");
    assert.deepEqual(B.evts, ["attente"]);
    assert.deepEqual(B.s.ecrire("vB"), { ok: false, why: "attente" });
    assert.equal(st.getItem(KEY), "v0");
    assert.equal(A.s.ecrire("vA1").ok, true);
    // la page en attente tente d’enregistrer à la fermeture (pagehide) : refusé
    assert.deepEqual(B.s.ecrire("vB2"), { ok: false, why: "attente" });
    assert.equal(st.getItem(KEY), "vA1");
  });

  await testAsync("la page qui attendait est prévenue quand l’autre se ferme, après l’écriture finale de celle-ci", async () => {
    const st = faux("v0"), v = fauxVerrous();
    const A = page("A", st, v), B = page("B", st, v);
    A.lire(); B.lire(); A.s.demanderVerrou(); B.s.demanderVerrou(); await tick();
    A.s.ecrire("vA");         // la fermeture de A enregistre une dernière fois
    v.fermer("A"); await tick();
    assert.ok(B.evts.includes("repris"), "B doit recharger la partie");
    assert.equal(B.s.etat(), "ok");
    assert.equal(st.getItem(KEY), "vA");
    // tant que B n’a pas rechargé, sa partie lue est périmée : une écriture est refusée plutôt que d’écraser vA
    assert.deepEqual(B.s.ecrire("vB"), { ok: false, why: "perime" });
    assert.equal(st.getItem(KEY), "vA");
  });

  test("sans verrou : la page qui n’a pas la dernière partie devient périmée et n’écrit plus", () => {
    const st = faux("v0");
    const A = page("A", st, null), B = page("B", st, null);
    A.lire(); B.lire(); A.s.demanderVerrou(); B.s.demanderVerrou();
    assert.equal(B.s.ecrire("vB").ok, true);
    const r = A.s.ecrire("vA");
    assert.deepEqual(r, { ok: false, why: "perime" });
    assert.equal(st.getItem(KEY), "vB");
    assert.ok(A.evts.includes("perime"));
    // plus aucune écriture, y compris celle de la fermeture
    const avant = st.ecritures;
    assert.equal(A.s.ecrire("vA2").ok, false);
    assert.equal(st.ecritures, avant);
    assert.equal(st.getItem(KEY), "vB");
  });

  test("écritures rapprochées sans verrou : jamais de retour en arrière, une seule page continue", () => {
    const st = faux("v0");
    const A = page("A", st, null), B = page("B", st, null);
    A.lire(); B.lire(); A.s.demanderVerrou(); B.s.demanderVerrou();
    const suite = [];
    for (let i = 1; i <= 20; i++) {
      const ra = A.s.ecrire("A" + i), rb = B.s.ecrire("B" + i);
      suite.push([ra.ok, rb.ok, st.getItem(KEY)]);
    }
    // A passe la première ; B voit une partie qu’il n’a pas écrite et se déclare périmé
    assert.equal(suite[0][0], true); assert.equal(suite[0][1], false);
    assert.ok(suite.every((x, i) => x[2] === "A" + (i + 1)), "le stockage suit A et rien d’autre");
    assert.equal(B.s.etat(), "perime");
  });

  test("l’événement storage d’une autre page déclare la page périmée tout de suite ; les autres clés sont ignorées", () => {
    const st = faux("v0");
    const A = page("A", st, null); A.lire(); A.s.demanderVerrou();
    A.s.surStorage({ key: "autre", newValue: "x" });
    A.s.surStorage({ key: KEY, newValue: null });
    A.s.surStorage({ key: null });
    assert.equal(A.s.etat(), "ok");
    st.setItem(KEY, "d’ailleurs");
    A.s.surStorage({ key: KEY, newValue: "d’ailleurs" });
    assert.equal(A.s.etat(), "perime");
    assert.equal(A.s.ecrire("vA").ok, false);
  });

  test("un événement storage en retard (la page a écrit depuis) n’est pas un conflit", () => {
    const st = faux("v0");
    const A = page("A", st, null); A.lire(); A.s.demanderVerrou();
    A.s.ecrire("vA2"); // l’événement d’une écriture plus ancienne d’une autre page arrive après
    A.s.surStorage({ key: KEY, newValue: "vA1-autre-page" });
    assert.equal(A.s.etat(), "ok");
    assert.equal(A.s.ecrire("vA3").ok, true);
  });

  test("un événement storage qui répète ce que la page a écrit elle-même n’est pas un conflit", () => {
    const st = faux("v0");
    const A = page("A", st, null); A.lire(); A.s.demanderVerrou();
    A.s.ecrire("vA");
    A.s.surStorage({ key: KEY, newValue: "vA" });
    assert.equal(A.s.etat(), "ok");
  });

  test("une partie créée par une autre page pendant qu’on n’en avait pas : périmé, pas d’écrasement", () => {
    const st = faux(); // aucune partie
    const A = page("A", st, null), B = page("B", st, null);
    A.lire(); B.lire(); A.s.demanderVerrou(); B.s.demanderVerrou();
    assert.equal(A.s.ecrire("nouvelleA").ok, true);
    assert.deepEqual(B.s.ecrire("nouvelleB"), { ok: false, why: "perime" });
    assert.equal(st.getItem(KEY), "nouvelleA");
  });

  test("le joueur garde la partie de la page périmée : elle reprend l’écriture sur le contenu actuel", () => {
    const st = faux("v0");
    const A = page("A", st, null), B = page("B", st, null);
    A.lire(); B.lire(); A.s.demanderVerrou(); B.s.demanderVerrou();
    B.s.ecrire("vB"); A.s.ecrire("vA");
    assert.equal(A.s.etat(), "perime");
    assert.equal(A.s.reprendreCettePage(), true);
    assert.equal(A.s.ecrire("vA2").ok, true);
    assert.equal(st.getItem(KEY), "vA2");
  });

  test("erreur de quota : la partie enregistrée reste intacte, l’échec est annoncé une fois, puis levé", () => {
    const st = faux("v0");
    const A = page("A", st, null); A.lire(); A.s.demanderVerrou();
    st.casse = (k) => k === KEY;
    const r = A.s.ecrire("v1"), r2 = A.s.ecrire("v2");
    assert.equal(r.ok, false); assert.equal(r.why, "echec"); assert.equal(r2.why, "echec");
    assert.equal(st.getItem(KEY), "v0");
    assert.deepEqual(A.evts.filter((e) => e === "echec"), ["echec"], "annoncé une seule fois");
    assert.equal(A.s.echec().essais, 2);
    assert.match(A.s.echec().err, /QuotaExceededError/);
    st.casse = null;
    assert.equal(A.s.ecrire("v3").ok, true);
    assert.equal(A.s.echec(), null);
    assert.ok(A.evts.includes("retabli"));
    assert.equal(st.getItem(KEY), "v3");
  });

  test("le stockage est plein : une copie de secours de moins à chaque essai, puis la partie passe", () => {
    const st = faux("v0");
    let copies = 3, appels = 0;
    st.casse = (k) => k === KEY && copies > 1;
    const A = page("A", st, null, { liberer: () => { appels++; copies--; return true; } });
    A.lire(); A.s.demanderVerrou();
    assert.equal(A.s.ecrire("v1").ok, true);
    assert.equal(appels, 2);
    assert.equal(st.getItem(KEY), "v1");
  });

  test("rien à libérer et toujours plein : échec, la partie reste en mémoire de l’appelant", () => {
    const st = faux("v0");
    st.casse = (k) => k === KEY;
    const A = page("A", st, null, { liberer: () => false });
    A.lire(); A.s.demanderVerrou();
    assert.equal(A.s.ecrire("v1").why, "echec");
    assert.equal(st.getItem(KEY), "v0");
  });

  test("un stockage qui lève même à la lecture : échec annoncé, aucune exception ne sort", () => {
    const st = faux("v0");
    st.getItem = () => { throw new Error("bloqué"); };
    const A = page("A", st, null); A.s.lire(null); A.s.demanderVerrou();
    assert.equal(A.s.ecrire("v1").why, "echec");
    assert.ok(A.evts.includes("echec"));
  });

  test("une écriture que le stockage n’a pas gardée (relecture différente) compte comme un échec", () => {
    const st = faux("v0");
    const set = st.setItem;
    st.setItem = (k, v) => set(k, k === KEY ? "tronqué" : v);
    const A = page("A", st, null, { liberer: () => false }); A.lire(); A.s.demanderVerrou();
    assert.equal(A.s.ecrire("v1").why, "echec");
  });

  test("un rappel de l’interface qui lève ne casse pas l’écriture", () => {
    const st = faux("v0");
    const s = create({ storage: st, key: KEY, locks: null, notify: () => { throw new Error("interface"); } });
    s.lire("v0"); s.demanderVerrou();
    st.casse = (k) => k === KEY;
    assert.equal(s.ecrire("v1").why, "echec");
  });

  await testAsync("persistance : accordée seulement si le navigateur le confirme ensuite", async () => {
    const mk = (persisted, persist) => { let p = persisted; return { storage: { persisted: async () => p, persist: async () => { const r = await persist(); if (r === "oui") p = true; return r === "oui" || r === "menteur"; } } }; };
    assert.equal(await proteger(mk(true, async () => "non")), "accordee");
    assert.equal(await proteger(mk(false, async () => "oui")), "accordee");
    assert.equal(await proteger(mk(false, async () => "non")), "refusee");
    assert.equal(await proteger(mk(false, async () => "menteur")), "refusee", "persist() répond vrai mais persisted() reste faux");
    assert.equal(await proteger({}), "absente");
    assert.equal(await proteger({ storage: {} }), "absente");
    assert.equal(await proteger({ storage: { persisted: async () => { throw new Error("x"); }, persist: async () => true } }), "inconnue");
    assert.equal(await proteger(undefined), "absente");
  });

  console.log(passed + " tests de l’écriture de la partie réussis.");
})();
