#!/usr/bin/env node
/* Tests du vrai contenu du récit (js/recit.js).
 * COFFRE : ce fichier cite des identifiants et des textes du récit. L’auteur du jeu ne le lit pas. */
"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");
const R = D.RECIT;

let T = 1e12;
const mk = () => createEngine({ now: () => T, rand: () => 0.99 });
let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log("  ✓ " + name); }
  catch (e) { console.log("  ✗ " + name + "\n    " + (e.stack || e)); process.exitCode = 1; }
}

/* ------------------------------------------------------------ référentiels */
const SIGNES = ["main", "machine", "faire", "dabord", "nepas", "dormir", "eveiller", "enfant",
  "revenir", "halte", "manquer", "nourrice", "relais", "nous"];
const PREMIERES = ["lisiere", "plaine", "riviere", "collines"];
const PAGES_6_0 = [1, 2, 3, 4, 5, 6, 7, 10, 12, 14, 15, 16];
const zoneById = {};
D.ZONES.forEach((z) => (zoneById[z.id] = z));
const place = (at) => {
  if (typeof at !== "string") return null;
  const [zid, xid] = at.split(":");
  const z = zoneById[zid];
  return z && z.exps ? z.exps.find((x) => x.id === xid) || null : null;
};
const SECRET_IDS = new Set(D.SECRETS.map((s) => s.id));

/* vérifie une condition : clés connues, identifiants existants */
function checkCond(c, where) {
  if (c === undefined) return;
  assert.ok(c && typeof c === "object" && !Array.isArray(c), where + " : condition illisible");
  const keys = Object.keys(c);
  assert.ok(keys.length > 0, where + " : condition vide");
  for (const k of keys) {
    const v = c[k];
    const w = where + " (" + k + ")";
    switch (k) {
      case "frag": assert.ok(D.FRAGS[v], w + " : fragment inconnu " + v); break;
      case "page": assert.ok(R.pages[v], w + " : page inconnue " + v); break;
      case "made": case "has": assert.ok(D.ITEMS[v], w + " : objet inconnu " + v); break;
      case "secret": assert.ok(SECRET_IDS.has(v), w + " : secret inconnu " + v); break;
      case "flag": assert.ok(typeof v === "string" && v.length > 0, w + " : drapeau illisible"); break;
      case "cycle": case "age": assert.ok(Number.isInteger(v) && v >= 1, w + " : nombre attendu"); break;
      case "exp": assert.ok(place(v), w + " : lieu inconnu " + v); break;
      case "all": case "any":
        assert.ok(Array.isArray(v) && v.length > 0, w + " : liste attendue");
        v.forEach((x, i) => checkCond(x, w + "[" + i + "]"));
        break;
      case "not": checkCond(v, w); break;
      default: assert.fail(w + " : clé inconnue « " + k + " »");
    }
  }
}

/* tous les textes affichés du récit, avec leur provenance */
function allTexts() {
  const out = [];
  for (const id in R.pages) {
    const p = R.pages[id];
    out.push(["page " + id + " titre", p.titre], ["page " + id + " imprimé", p.imprime]);
    (p.notes || []).forEach((n, i) => out.push(["page " + id + " note " + i, n.t], ["page " + id + " signature " + i, n.sig]));
  }
  for (const id in R.frags) {
    const f = R.frags[id];
    out.push(["fragment " + id + " titre", f.n], ["fragment " + id, f.t]);
    (f.revisit || []).forEach((r, i) => out.push(["revisite " + id + " " + i, r.t]));
  }
  for (const id in R.questions) {
    const q = R.questions[id];
    out.push(["question " + id + " titre", q.titre]);
    (q.aides || []).forEach((a, i) => out.push(["question " + id + " aide " + (i + 1), a]));
  }
  return out;
}

console.log("Récit : le contenu");
test("le contenu provisoire a disparu", () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "js", "recit.js"), "utf8");
  assert.ok(!/CONTENU PROVISOIRE/.test(src));
  assert.ok(!/provisoire/i.test(JSON.stringify(R)), "aucun texte provisoire");
  for (const id in D.FRAGS) assert.ok(!/^frag_prov/.test(id), "fragment provisoire " + id);
});
test("pages : numéro unique de 1 à 32, titre, imprimé, sources valides", () => {
  const seen = {};
  for (const id in R.pages) {
    const p = R.pages[id];
    assert.ok(Number.isInteger(p.n) && p.n >= 1 && p.n <= 32, id + " : numéro " + p.n);
    assert.ok(!seen[p.n], id + " : numéro " + p.n + " déjà pris par " + seen[p.n]);
    seen[p.n] = id;
    assert.ok(typeof p.titre === "string" && p.titre.trim(), id + " : titre");
    assert.ok(typeof p.imprime === "string" && p.imprime.trim(), id + " : imprimé");
    assert.ok(Array.isArray(p.src) && p.src.length > 0, id + " : au moins une source");
    for (const s of p.src) {
      if (s.k === "exp") assert.ok(place(s.at), id + " : lieu inconnu " + s.at);
      else if (s.k === "repair") {
        const it = D.ITEMS[s.id];
        assert.ok(it && (it.t === "ext" || it.t === "mach"), id + " : ruine impossible " + s.id);
      } else if (s.k === "buy") assert.ok(Number.isInteger(s.ecus) && s.ecus > 0, id + " : prix");
      else if (s.k === "cond") checkCond(s.c, id + " source");
      else assert.fail(id + " : source inconnue " + s.k);
    }
    assert.ok(Array.isArray(p.notes), id + " : notes");
    p.notes.forEach((n, i) => {
      assert.ok(typeof n.t === "string" && n.t.trim(), id + " note " + i);
      assert.ok(typeof n.sig === "string" && n.sig.trim() && n.sig.length <= 8, id + " signature " + i);
      checkCond(n.cond, id + " note " + i);
    });
  }
  assert.deepStrictEqual(Object.values(R.pages).map((p) => p.n).sort((a, b) => a - b), PAGES_6_0, "les 12 pages de la 6.0");
});
test("fragments neufs : terre, texte, revisites, ajoutés au Journal", () => {
  for (const id in R.frags) {
    const f = R.frags[id];
    assert.strictEqual(D.FRAGS[id], f, id + " : ajouté à D.FRAGS");
    assert.ok(f.n && f.t, id + " : titre et texte");
    assert.ok(PREMIERES.includes(f.z), id + " : terre " + f.z);
    assert.ok(Array.isArray(f.revisit) && f.revisit.length > 0, id + " : au moins une revisite");
    f.revisit.forEach((r, i) => { assert.ok(r.t && r.t.trim(), id + " revisite " + i); checkCond(r.cond, id + " revisite " + i); });
    assert.ok(!R.archive.includes(id), id + " : pas archivé");
  }
});
test("expFrag : chaque lieu existe et donne un fragment neuf ; l’ancien est archivé", () => {
  for (const at in R.expFrag) {
    const x = place(at);
    assert.ok(x, "lieu inconnu " + at);
    assert.ok(R.frags[R.expFrag[at]], at + " : fragment neuf inconnu " + R.expFrag[at]);
    assert.ok(R.archive.includes(x.rw.frag), at + " : l’ancien fragment " + x.rw.frag + " doit être archivé");
  }
  // tous les lieux des quatre premières terres sont branchés, sauf le Cercle (gardé tel quel)
  for (const zid of PREMIERES) for (const x of zoneById[zid].exps) {
    if (x.id === "cercle") { assert.ok(!R.expFrag["lisiere:cercle"] && !R.archive.includes("cercle")); continue; }
    assert.ok(R.expFrag[zid + ":" + x.id], "lieu non branché : " + zid + ":" + x.id);
  }
  const targets = Object.values(R.expFrag);
  assert.strictEqual(new Set(targets).size, targets.length, "un fragment par lieu");
});
test("archive : anciens fragments existants, plus donnés par aucun lieu", () => {
  for (const id of R.archive) {
    assert.ok(D.FRAGS[id], "archivé inconnu " + id);
    assert.ok(!R.frags[id], id + " : un archivé n’est pas un fragment neuf");
  }
});
test("questions : titre, déclencheur, trois aides, résolution", () => {
  assert.ok(Object.keys(R.questions).length > 0);
  for (const id in R.questions) {
    const q = R.questions[id];
    assert.ok(/^q_/.test(id) && q.titre, id);
    checkCond(q.quand, id + " quand");
    checkCond(q.resolu, id + " résolu");
    assert.ok(q.quand && q.resolu, id + " : déclencheur et résolution");
    assert.ok(Array.isArray(q.aides) && q.aides.length === 3, id + " : trois aides");
    q.aides.forEach((a, i) => assert.ok(typeof a === "string" && a.trim(), id + " aide " + (i + 1)));
  }
  assert.deepStrictEqual(R.aide, { base: 5, mult: 3 });
});
test("textes : pas de tiret cadratin, signes connus, longueurs pour mobile", () => {
  for (const [where, t] of allTexts()) {
    assert.ok(typeof t === "string", where);
    assert.ok(!/—/.test(t), where + " : tiret cadratin");
    assert.ok(!/\s--\s/.test(t), where + " : faux tiret");
    assert.ok(!/ {2}/.test(t), where + " : double espace");
    for (const m of t.matchAll(/\[([^\]]*)\]/g)) assert.ok(SIGNES.includes(m[1]), where + " : signe inconnu [" + m[1] + "]");
    if (/titre/.test(where)) assert.ok(!/\[/.test(t) && t.length <= 40, where + " : titre court, sans signe");
  }
  for (const id in R.frags) {
    assert.ok(R.frags[id].t.length <= 720, id + " : fragment trop long (" + R.frags[id].t.length + ")");
    R.frags[id].revisit.forEach((r) => assert.ok(r.t.length <= 320, id + " : revisite trop longue"));
  }
  for (const id in R.pages) R.pages[id].notes.forEach((n) => assert.ok(n.t.length <= 200, id + " : note trop longue"));
});
test("textes : aucune solution en clair (suites de notes, mots des signes)", () => {
  for (const [where, t] of allTexts()) {
    assert.ok(!/\d\s*·\s*\d\s*·\s*\d/.test(t), where + " : suite de notes");
    assert.ok(!/nourrice/i.test(t.replace(/\[nourrice\]/g, "")), where + " : le nom ne s’écrit pas en clair");
  }
});
test("chaînes de secrets gardées : les indices des anciens fragments existent toujours", () => {
  // Flûte en os : les os percés de la Grotte
  assert.ok(/os percés/.test(R.frags.grotte2.t) && /chantent/.test(R.frags.grotte2.t));
  // Miroir de cuivre : le galet poli comme un miroir
  assert.ok(/comme un miroir/.test(R.frags.gue2.t));
  // Anticythère : la tablette du Sommet, ses roues dentées, toujours rapportée
  assert.ok(/tablette/.test(R.frags.vue2.t) && /roues dentées/.test(R.frags.vue2.t) && /dorées/.test(R.frags.vue2.t));
  assert.ok(place("collines:sommet").rw.item.tablette);
  // Cerf-volant et l’Appel : le Cercle garde sa dalle et son énigme
  assert.ok(D.FRAGS.cercle && /troisième/.test(D.FRAGS.cercle.t) && place("lisiere:cercle").hidden);
  // Boussole et Caveau : le fragment de la Porte reste, la page 12 s’y ajoute
  assert.ok(!R.archive.includes("porte") && R.pages.p12.src.some((s) => s.at === "mine:filon"));
  // le code du terminal garde son allusion (le fragment du Tumulus est archivé)
  assert.ok(/promethee/.test(D.TERMINAL.ls));
  // les fragments dont dépendent les fins et le Grand Œuvre ne sont pas archivés
  for (const en of Object.values(D.ENDINGS)) for (const x of en.extra || []) assert.ok(!R.archive.includes(x.frag));
  for (const p of Object.values(D.PROJECTS)) for (const s of p.steps) if (s.need) assert.ok(!R.archive.includes(s.need));
});

console.log("Récit : un parcours");
/* ouvre les terres, donne les outils et torches, et explore tout ce qui peut l’être dans `zid` */
function exploreAll(E, zid, log) {
  E.state.zones[zid] = true;
  for (let guard = 0; guard < 10; guard++) {
    const n = E.nextExp(zid);
    if (!n) return;
    if (n.x.need) E.state.made[n.x.need] = 1;
    if (n.x.cost) for (const i in n.x.cost) E.add(i, n.x.cost[i]);
    const r = E.startExp(zid);
    assert.ok(r.ok, zid + ":" + n.x.id + " : " + JSON.stringify(r));
    T += n.x.dur * 1000 + 1000; E.update();
    assert.ok(log.some((e) => e.x.id === n.x.id && e.z === zid), "exploration finie : " + zid + ":" + n.x.id);
  }
}
const pagesOf = (E) => E.livre().filter((c) => c.page).map((c) => c.n);

test("les quatre premières terres donnent les fragments neufs et leurs pages", () => {
  const E = mk();
  const log = [], pages = [];
  E.on("expdone", (r) => log.push(r));
  E.on("page", (p) => pages.push(p.n));
  PREMIERES.forEach((z) => exploreAll(E, z, log));
  const S = E.state;
  for (const at in R.expFrag) {
    const f = R.expFrag[at];
    assert.ok(S.frags[f], "fragment neuf " + f);
    const ev = log.find((e) => e.z + ":" + e.x.id === at);
    assert.ok(ev && ev.frag === f && ev.fragNew, at + " : fenêtre du fragment neuf");
  }
  for (const id of R.archive) assert.ok(!S.frags[id], "ancien fragment donné : " + id);
  assert.ok(S.frags.cercle, "le Cercle garde son fragment");
  assert.deepStrictEqual(pagesOf(E), [1, 3, 5, 10, 15, 16]);
  assert.deepStrictEqual(pages.slice().sort((a, b) => a - b), [1, 3, 5, 10, 15, 16], "un message par page");
  assert.ok(E.hasLivre() && E.hasNewLivre());
  // au cycle 1, les notes des vivants ne sont pas encore là
  const c5 = E.livre().find((c) => c.n === 5);
  assert.strictEqual(c5.notes.length, 0);
  const c1 = E.livre().find((c) => c.n === 1);
  assert.strictEqual(c1.notes.length, 2);
  // Journal : les archivés ne comptent pas, les neufs si
  const vis = E.visibleFrags();
  for (const id of R.archive) assert.ok(!vis.includes(id));
  for (const id in R.frags) assert.ok(vis.includes(id));
});
test("la page des Profondeurs, les premières réparations et le Comptoir", () => {
  const E = mk();
  const log = [];
  E.on("expdone", (r) => log.push(r));
  exploreAll(E, "mine", log);
  assert.ok(E.hasPage("p12"));
  for (const id of ["cabane", "collets", "automate_bois"]) {
    E.state.meta.ruins[id] = 2;
    const cost = E.ruinCost(id);
    for (const k in cost) E.add(k, cost[k] * 2);
  }
  assert.ok(E.repair("cabane").ok && E.hasPage("p02"));
  assert.ok(E.repair("collets").ok && E.hasPage("p06"));
  assert.ok(E.repair("automate_bois").ok && E.hasPage("p14"));
  // le Comptoir vend les pages 4 et 7
  const b = E.buyablePages();
  assert.deepStrictEqual(b.map((p) => p.n), [4, 7]);
  E.state.ecus = b.reduce((s, p) => s + p.ecus, 0);
  assert.ok(E.buyPage("p04").ok && E.buyPage("p07").ok);
  assert.strictEqual(E.state.ecus, 0);
  assert.deepStrictEqual(E.buyablePages(), []);
  assert.deepStrictEqual(pagesOf(E), [2, 4, 6, 7, 12, 14]);
});
test("au cycle 2 : revisites, notes des vivants, pages gardées", () => {
  const E = mk();
  const log = [];
  E.on("expdone", (r) => log.push(r));
  PREMIERES.forEach((z) => exploreAll(E, z, log));
  const before = pagesOf(E);
  E.newCycle();
  assert.strictEqual(E.state.cycle, 2);
  assert.deepStrictEqual(pagesOf(E), before, "les pages restent à la relève");
  log.length = 0;
  PREMIERES.forEach((z) => exploreAll(E, z, log));
  for (const at in R.expFrag) {
    const f = R.expFrag[at];
    const ev = log.find((e) => e.z + ":" + e.x.id === at);
    assert.ok(ev && ev.frag === f && !ev.fragNew, at + " : déjà connu");
    assert.ok(ev.revisit && ev.revisit.t === R.frags[f].revisit[0].t, at + " : revisite affichée");
    assert.strictEqual(E.state.revus[f + ":0"], 1);
  }
  const chene = log.find((e) => e.x.id === "chene");
  assert.ok(/Il n’y en a pas\./.test(chene.revisit.t));
  // la note d’Hélie apparaît en marge de la page 5, et la page a du nouveau
  const c5 = E.livre().find((c) => c.n === 5);
  assert.strictEqual(c5.notes.length, 1);
  E.readPage("p05");
  assert.ok(!E.livre().find((c) => c.n === 5).nouveau);
  // aller-retour de sauvegarde
  const E2 = mk();
  E2.load(JSON.stringify(E.state));
  assert.deepStrictEqual(pagesOf(E2), before);
  assert.strictEqual(E2.state.revus["chene2:0"], 1);
});
test("notes de Kenza et de Léon : à leur tour seulement", () => {
  const E = mk();
  const log = [];
  E.on("expdone", (r) => log.push(r));
  PREMIERES.forEach((z) => exploreAll(E, z, log));
  const notes = (n) => E.livre().find((c) => c.n === n).notes.length;
  assert.strictEqual(notes(15), 0); assert.strictEqual(notes(10), 1);
  for (let c = 2; c <= 4; c++) E.newCycle();
  assert.strictEqual(notes(15), 0);
  E.newCycle(); // cycle 5 : Kenza
  assert.strictEqual(notes(15), 1); assert.strictEqual(notes(10), 1);
  E.newCycle(); // cycle 6 : Léon
  assert.strictEqual(notes(10), 2);
});
test("la question de la Lune : apparaît avec le Ciel, se résout avec la lumière", () => {
  const E = mk();
  assert.ok(!E.questions().some((q) => q.id === "q_lune"));
  E.add("lunette", 1); E.recalc();
  const q = E.questions().find((x) => x.id === "q_lune");
  assert.ok(q && !q.resolu);
  E.state.intu = 1e6;
  for (let i = 1; i <= 3; i++) assert.strictEqual(E.askHelp("q_lune").lvl, i);
  assert.deepStrictEqual(E.questions().find((x) => x.id === "q_lune").aides, R.questions.q_lune.aides);
  for (let i = 0; i < 7; i++) E.tapMoon();
  assert.ok(E.questions().find((x) => x.id === "q_lune").resolu);
  // elle reste après la relève, même sans Ciel
  E.newCycle();
  assert.ok(E.questions().some((x) => x.id === "q_lune"));
});

console.log("Récit : les anciennes parties");
const FIXTURES = fs.readdirSync(path.join(__dirname, "fixtures")).filter((x) => /^save-v\d/.test(x));
test("les anciens fragments archivés restent chargés depuis les fixtures", () => {
  assert.ok(FIXTURES.length > 0);
  for (const f of FIXTURES) {
    const raw = fs.readFileSync(path.join(__dirname, "fixtures", f), "utf8");
    const old = JSON.parse(raw);
    const E = mk();
    E.load(raw);
    const S = E.state;
    const archived = Object.keys(old.frags).filter((id) => R.archive.includes(id));
    assert.ok(archived.length > 0, f + " : contient d’anciens fragments");
    for (const id of Object.keys(old.frags)) assert.ok(S.frags[id], f + " : fragment gardé " + id);
    const vis = E.visibleFrags();
    for (const id of archived) assert.ok(!vis.includes(id), f + " : " + id + " caché");
    // rien n’est donné d’avance : les fragments neufs et les pages restent à trouver
    for (const id in R.frags) assert.ok(!S.frags[id], f + " : " + id + " pas donné d’avance");
    assert.ok(!E.hasLivre(), f + " : aucune page d’avance");
    T += 5000; E.update();
    assert.strictEqual(E.livre().length, 32);
    // la partie reprend : au cycle suivant, revenir au Chêne donne le fragment neuf et la page 1
    const log = [];
    E.on("expdone", (r) => log.push(r));
    E.state.exp.active = null;
    E.newCycle();
    exploreAll(E, "lisiere", log);
    const ev = log.find((e) => e.x.id === "chene");
    assert.ok(ev && ev.frag === "chene2" && ev.fragNew && !ev.revisit, f + " : le Chêne raconte le fragment neuf");
    assert.ok(E.state.frags.chene2 && E.state.frags.chene && E.hasPage("p01"), f + " : fragment neuf, ancien gardé, page 1");
  }
});

console.log(passed + " tests réussis" + (process.exitCode ? ", des échecs." : "."));
