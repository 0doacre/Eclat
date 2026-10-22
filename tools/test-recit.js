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
/* 6.4 : les quatorze signes définis */
const NEUTRES = ["inconnu"];
/* les dessins de la bible (§9), les quatorze */
const DESSINS = {
  main: [3, 5, 3], machine: [2, 4, 2], faire: [1, 2, 3], dabord: [1, 5, 1], nepas: [4, 4, 1],
  dormir: [5, 3, 1], eveiller: [1, 3, 5], enfant: [2, 3, 2], revenir: [5, 1, 5], halte: [5, 5, 5],
  manquer: [3, 1, 3], nourrice: [4, 2, 5], relais: [2, 5, 1], nous: [3, 3, 3]
};
/* empreintes des réponses de la bible, une liste par signe (jamais les mots en clair) */
const EMPREINTES = {
  main: ["ea90e208", "bd1487a1", "3c3adfff"],
  machine: ["e103566e", "55408fa7", "b18a6abb", "44e618d8"],
  faire: ["d9340f62", "f9ac53d6", "065361a5", "56039ae0", "eecd44f4"],
  dabord: ["b52be429", "8909aa1f", "34375e0e", "31c8d987"],
  nepas: ["2fb1a5fc", "9c3f2b4c", "64560ffb", "e75d20eb", "f0452a17", "fcbe6b42"],
  dormir: ["d1e9849a", "25c1e212", "05421d02", "b780af11", "883fc275"],
  eveiller: ["524e118b", "beef7b9b", "f432ff78", "75a2b188", "1867a541"],
  enfant: ["8abf1c15", "d0d9b492", "b9f8ac53", "e276f660"],
  revenir: ["bc3dec9e", "324b25a2", "0d3f2f7f", "8e9496a2"],
  halte: ["0381e64d", "876335c9", "b49ce582", "cb532ae5"],
  manquer: ["b654a5ae", "dd4a8828", "1d5385da", "b0191cdd"],
  nourrice: ["d9877c58", "0d0cd2a5"],
  relais: ["6f011a33", "cfa11f94"],
  nous: ["a39c672a", "cf9f7e5a", "3683eed0"]
};
/* les mêmes réponses, brouillées (base64 du mot à l’envers), pour jouer les essais */
const BROUILLE = {
  main: ["bmlhbQ==", "c25pYW0=", "ZW11YXA="],
  machine: ["ZW5paGNhbQ==", "c2VuaWhjYW0=", "ZXRhbW90dWE=", "c2V0YW1vdHVh"],
  faire: ["ZXJpYWY=", "cmV1cWlyYmFm", "dGlhZg==", "ZXVxaXJiYWY=", "cmXDqXJj"],
  dabord: ["ZHJvYmHigJlk", "ZHJvYmE=", "cmVpbWVycA==", "ZXLDqGltZXJw", "dG5hdmE="],
  nepas: ["bm9u", "c2FwIGVu", "c2Fw", "bnVjdWE=", "bmVpcg==", "c2lhbWFq"],
  dormir: ["cmltcm9k", "dHJvZA==", "dG5lbXJvZA==", "bGllbW1vcw==", "cmltcm9kbmU="],
  eveiller: ["cmVsbGlldsOp", "cmVsbGlldsOpcg==", "bGlldsOp", "bGlldsOpcg==", "cmV2ZWwgZXM="],
  enfant: ["dG5hZm5l", "c3RuYWZuZQ==", "dGl0ZXA=", "c3RpdGVw"],
  revenir: ["cmluZXZlcg==", "cnVvdGVy", "cmVydG5lcg==", "c25vcmRuZWl2ZXI="],
  halte: ["ZXRsYWg=", "dGVycmE=", "cmV0ZXJyYQ==", "cG90cw=="],
  manquer: ["cmV1cW5hbQ==", "ZXVxbmFt", "bWlhZg==", "bmlvc2Vi"],
  nourrice: ["ZWNpcnJ1b24=", "dW9udW9u"],
  relais: ["c2lhbGVy", "cnVldHB1cnJldG5p"],
  nous: ["c3Vvbg==", "ZWxibWVzbmU=", "c3VvdA=="]
};
const debrouille = (s) => [...Buffer.from(s, "base64").toString("utf8")].reverse().join("");
/* les inscriptions de la bible présentes en 6.1, et les textes qui doivent les porter */
const INSCRIPTIONS = {
  clause1: { l: "[machine] [nepas] [faire] · [main] [faire] [dabord]", ou: ["tumulus2", "carcasse2", "p10"] },
  clause2: { l: "[main] [halte] · [machine] [dormir]", ou: ["tumulus2", "p10"] },
  unite12: { l: "[machine] · [enfant] [dormir]", ou: ["carcasse2"] },
  promesse: { l: "[nous] [revenir] [enfant]", ou: ["grotte2"] },
  titre: { l: "[enfant] [eveiller]", ou: ["p01"] },
  tombe: { l: "[enfant]", ou: ["ossements2"] }
};
/* les signes isolés prévus par la bible (annexe A, §14, rosettes) dans les textes de la 6.0 */
const PLACES = {
  p02: ["faire"], p03: ["nous", "enfant"], p04: ["manquer", "nepas"], p05: ["faire"],
  p06: ["faire", "nepas"], p12: ["enfant", "dormir"], p14: ["machine"], p15: ["machine"],
  grotte2: ["main", "nous", "dormir", "halte"]
};
const PAGES_6_4 = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 15, 16];
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
      case "signe": assert.ok(R.signes && R.signes[v], w + " : signe inconnu " + v); break;
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
  for (const k in R.interface || {}) out.push(["interface " + k, R.interface[k].t]);
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
      assert.ok(typeof n.sig === "string" && n.sig.trim() && (n.sig.length <= 8 || /^\[[a-z]+\]$/.test(n.sig)), id + " signature " + i);
      checkCond(n.cond, id + " note " + i);
    });
  }
  assert.deepStrictEqual(Object.values(R.pages).map((p) => p.n).sort((a, b) => a - b), PAGES_6_4, "les 13 pages de la 6.4");
});
test("fragments neufs : terre, texte, revisites, ajoutés au Journal", () => {
  for (const id in R.frags) {
    const f = R.frags[id];
    assert.strictEqual(D.FRAGS[id], f, id + " : ajouté à D.FRAGS");
    assert.ok(f.n && f.t, id + " : titre et texte");
    assert.ok(D.ZONES.some((z) => z.id === f.z), id + " : terre " + f.z);
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
  // tous les lieux des quatre premières terres sont branchés, sauf le Cercle et les lieux cachés
  for (const zid of PREMIERES) for (const x of zoneById[zid].exps) {
    if (x.id === "cercle" || x.id === "racines" || x.id === "tombe" || x.id === "poings" || x.id === "nid" || x.id === "escalier") continue;
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
    for (const m of t.matchAll(/\[([^\]]*)\]/g)) assert.ok(SIGNES.includes(m[1]) || NEUTRES.includes(m[1]), where + " : signe inconnu [" + m[1] + "]");
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
console.log("Récit : les signes");
/* le texte d’un fragment ou d’une page (imprimé et notes) par identifiant */
function textOf(id) {
  if (R.frags[id]) return [R.frags[id].t].concat(R.frags[id].revisit.map((r) => r.t)).join("\n\n");
  if (R.interface[id]) return R.interface[id].t;
  const p = R.pages[id];
  return [p.imprime].concat(p.notes.map((n) => n.t + "\n" + n.sig)).join("\n\n");
}
/* toutes les chaînes affichables qui passent par le rendu des jetons */
function renderedTexts() {
  const out = allTexts().filter(([, t]) => typeof t === "string");
  const walk = (o, where) => {
    if (typeof o === "string") out.push([where, o]);
    else if (o && typeof o === "object") for (const k in o) walk(o[k], where + "." + k);
  };
  walk(D.FRAGS, "FRAGS"); walk(D.EVENTS, "EVENTS"); walk(D.MELODIES, "MELODIES");
  for (const id in D.ITEMS) walk(D.ITEMS[id].d, "ITEMS." + id);
  return out;
}
const variantes = (w) => {
  const out = [];
  for (let i = 0; i < w.length; i++) {
    if (!/[a-z]/.test(w[i])) continue;
    out.push(w.slice(0, i) + (w[i] === "x" ? "y" : "x") + w.slice(i + 1)); // une lettre changée
    if (w.length > 3) out.push(w.slice(0, i) + w.slice(i + 1)); // une lettre retirée
    out.push(w.slice(0, i) + "x" + w.slice(i)); // une lettre ajoutée
  }
  return out;
};

test("signes : les quatorze de la bible, dessins et empreintes", () => {
  assert.ok(R.signes && typeof R.signes === "object");
  assert.deepStrictEqual(Object.keys(R.signes).sort(), SIGNES.slice().sort());
  const dessins = new Set();
  for (const id in R.signes) {
    const s = R.signes[id];
    assert.ok(Array.isArray(s.h) && s.h.length === 3, id + " : trois hauteurs");
    s.h.forEach((v) => assert.ok(Number.isInteger(v) && v >= 1 && v <= 5, id + " : hauteur " + v));
    assert.deepStrictEqual(s.h, DESSINS[id], id + " : dessin de la bible");
    dessins.add(s.h.join(""));
    assert.ok(typeof s.mot === "string" && s.mot.trim() && s.mot.length <= 16, id + " : mot");
    assert.ok(!/[[\]]/.test(s.mot), id + " : mot sans crochet");
    checkCond(s.cond, id + " cond");
  }
  assert.strictEqual(dessins.size, SIGNES.length, "des dessins tous différents");
  assert.strictEqual(new Set(Object.values(DESSINS).map((h) => h.join(""))).size, 14, "les quatorze dessins de la bible sont distincts");
  // le dessin compris en 6.1 et son miroir : l’un se lit par l’autre
  assert.deepStrictEqual(R.signes.eveiller.h, R.signes.dormir.h.slice().reverse());
});
test("signes : les empreintes sont celles des réponses prévues, sans recouvrement", () => {
  const owner = {};
  for (const id in R.signes) {
    const ok = R.signes[id].ok;
    assert.ok(Array.isArray(ok) && ok.length > 0, id + " : empreintes");
    ok.forEach((h) => assert.ok(/^[0-9a-f]{8}$/.test(h), id + " : empreinte " + h));
    assert.strictEqual(new Set(ok).size, ok.length, id + " : empreintes en double");
    assert.deepStrictEqual(ok.slice().sort(), EMPREINTES[id].slice().sort(), id + " : réponses de la bible");
    for (const h of ok) { assert.ok(!owner[h], h + " : à la fois " + owner[h] + " et " + id); owner[h] = id; }
  }
  // les réponses brouillées du test sont bien celles des empreintes
  const E = mk();
  for (const id in BROUILLE) {
    const got = new Set(BROUILLE[id].map((b) => E.empreinte(debrouille(b))));
    assert.deepStrictEqual([...got].sort(), EMPREINTES[id].slice().sort(), id + " : réponses brouillées");
  }
});
test("signes : chaque réponse prévue est acceptée, quelle que soit la casse ou l’article", () => {
  for (const id in BROUILLE) for (const b of BROUILLE[id]) {
    const w = debrouille(b);
    for (const essai of [w, w.toUpperCase(), "la " + w, "  " + w + " !"]) {
      const E = mk();
      const r = E.essaiSigne(id, essai);
      assert.ok(r.ok && !r.deja && r.mot === R.signes[id].mot, id + " : réponse refusée (" + JSON.stringify(r) + ")");
      assert.ok(E.state.signes[id].lu);
    }
  }
});
test("signes : une variante à une lettre donne « presque », un autre mot « non »", () => {
  for (const id in BROUILLE) {
    const ok = new Set(R.signes[id].ok);
    const E = mk();
    for (const b of BROUILLE[id]) {
      const w = E.normSigne(debrouille(b));
      const vs = variantes(w).filter((v) => !ok.has(E.empreinte(v)));
      assert.ok(vs.length > 0, id + " : aucune variante");
      for (const v of [vs[0], vs[vs.length - 1]]) {
        T += 4000;
        const r = E.essaiSigne(id, v);
        assert.ok(!r.ok && r.proche, id + " : la variante devrait donner « presque » (" + JSON.stringify(r) + ")");
      }
    }
    T += 4000;
    const r = E.essaiSigne(id, "caillou");
    assert.ok(!r.ok && !r.proche, id + " : un mot sans rapport");
    assert.ok(!E.state.signes[id].lu, id + " : pas compris par erreur");
  }
});
test("signes : compris, il le reste après la relève et une sauvegarde, et s’affiche en mot", () => {
  const Sg = require("../js/signes.js");
  const E = mk();
  const render = (id) => Sg.renderSigneToken(id, { recit: R, state: E.state, seeSigne: E.seeSigne, lieu: "test" });
  for (const id of SIGNES) {
    assert.ok(/<svg/.test(render(id)) && !render(id).includes(">" + R.signes[id].mot + "<"), id + " : dessiné avant");
    assert.ok(E.state.signes[id].vu.test, id + " : lieu noté");
  }
  for (const id of NEUTRES) assert.ok(/◇/.test(render(id)) && !/<svg/.test(render(id)), id + " : neutre");
  for (const id of SIGNES) { T += 4000; assert.ok(E.essaiSigne(id, debrouille(BROUILLE[id][0])).ok); }
  E.newCycle();
  const E2 = mk();
  E2.load(JSON.stringify(E.state));
  for (const id of SIGNES) {
    assert.ok(E2.state.signes[id] && E2.state.signes[id].lu, id + " : compris pour toujours");
    const html = Sg.renderSigneToken(id, { recit: R, state: E2.state });
    assert.ok(html.includes(">" + R.signes[id].mot + "<") && /signe lu/.test(html), id + " : affiché en mot");
  }
});
test("jetons : chaque jeton de tous les textes est un signe défini ou volontairement neutre", () => {
  const vus = {};
  for (const [where, t] of renderedTexts()) {
    for (const m of t.matchAll(/\[([a-zA-Z0-9_À-ſ-]+)\]/g)) {
      assert.ok(R.signes[m[1]] || NEUTRES.includes(m[1]), where + " : jeton inconnu [" + m[1] + "]");
      vus[m[1]] = 1;
    }
    // un jeton mal écrit (accent, espace, apostrophe) ne serait pas reconnu par le rendu
    for (const m of t.matchAll(/\[([^\]\n]{1,24})\]/g)) assert.ok(/^[a-z0-9_]+$/.test(m[1]), where + " : jeton mal formé [" + m[1] + "]");
  }
  for (const id of SIGNES) assert.ok(vus[id], id + " : écrit dans au moins un texte");
});
test("inscriptions : à leur place, et aucun signe écrit en clair à la place du jeton", () => {
  for (const k in INSCRIPTIONS) for (const id of INSCRIPTIONS[k].ou) {
    assert.ok(textOf(id).includes(INSCRIPTIONS[k].l), k + " : absente de " + id);
  }
  for (const id in PLACES) for (const s of PLACES[id]) assert.ok(textOf(id).includes("[" + s + "]"), id + " : [" + s + "] attendu");
  // chaque signe se lit dans au moins deux textes trouvables (lieux, pages, interface)
  for (const s of SIGNES) {
    const lieux = Object.keys(R.frags).concat(Object.keys(R.pages), Object.keys(R.interface)).filter((id) => textOf(id).includes("[" + s + "]"));
    assert.ok(lieux.length >= 2, s + " : un seul lieu (" + lieux.join(", ") + ")");
  }
  // les lignes de signes ne contiennent que des jetons ; le mot n’y est jamais écrit en clair
  const E = mk();
  const mots = SIGNES.map((id) => E.normSigne(R.signes[id].mot));
  for (const [where, t] of renderedTexts()) {
    for (const line of t.split("\n")) {
      if (!/\[[a-z]+\]/.test(line)) continue;
      const nu = E.normSigne(line.replace(/\[[a-z0-9_]+\]/g, " | "));
      for (const k in INSCRIPTIONS) {
        const enClair = E.normSigne(INSCRIPTIONS[k].l.replace(/\[([a-z]+)\]/g, (m, id) => (R.signes[id] ? R.signes[id].mot : "")));
        if (enClair.split(" ").length >= 2) assert.ok(!nu.includes(enClair), where + " : « " + k + " » écrite en clair");
      }
      if (/^[\s\[\]a-z0-9_·]+$/.test(line)) for (const m of mots) assert.ok(!(" " + nu + " ").includes(" " + m + " "), where + " : « " + m + " » en clair dans une ligne de signes");
    }
  }
});

test("interface : les signes des scènes et des boutons", () => {
  assert.deepStrictEqual(Object.keys(R.interface).sort(), ["comptoir", "eveil", "fabriquer", "ornement", "releve"]);
  for (const k in R.interface) {
    const x = R.interface[k];
    assert.ok(typeof x.t === "string" && x.t.trim(), k + " : texte");
    checkCond(x.cond, "interface " + k);
    const ids = [...x.t.matchAll(/\[([a-z]+)\]/g)].map((m) => m[1]);
    assert.ok(ids.length > 0, k + " : au moins un signe");
    ids.forEach((id) => assert.ok(R.signes[id], k + " : signe attendu, pas [" + id + "]"));
  }
  assert.deepStrictEqual(R.interface.eveil.t.match(/\[[a-z]+\]/g), ["[eveiller]"]);
  assert.deepStrictEqual(R.interface.fabriquer.t.match(/\[[a-z]+\]/g), ["[faire]"]);
  // le premier signe guidé : au Comptoir, à partir du deuxième cycle, avec sa parole
  assert.deepStrictEqual(R.interface.comptoir.cond, { cycle: 2 });
  assert.ok(/Pose ta main là/.test(R.interface.comptoir.t) && /\[main\]$/.test(R.interface.comptoir.t));
  const E = mk();
  assert.ok(!E.cond(R.interface.comptoir.cond));
  E.newCycle();
  assert.ok(E.cond(R.interface.comptoir.cond));
  // la signature de Léon est son signe
  const leon = R.pages.p10.notes.find((n) => n.cond && n.cond.cycle === 6);
  assert.strictEqual(leon.sig, "[eveiller]");
});
test("lectures : brouillées, sous des lignes comprises, seulement quand tout est compris", () => {
  const Sg = require("../js/signes.js");
  const src = fs.readFileSync(path.join(__dirname, "..", "js", "recit.js"), "utf8");
  assert.ok(Array.isArray(R.lectures) && R.lectures.length >= 3);
  const textes = renderedTexts().map(([, t]) => t);
  for (const lec of R.lectures) {
    const ids = [...lec.l.matchAll(/\[([a-z]+)\]/g)].map((m) => m[1]);
    assert.ok(ids.length > 0 && ids.every((id) => R.signes[id]), lec.l + " : signes connus");
    assert.ok(textes.some((t) => t.split("\n").some((line) => line.includes(lec.l))), lec.l + " : écrite dans un texte");
    const fr = Buffer.from(lec.fr, "base64").toString("utf8");
    assert.ok(/^[A-Z][^\[\]]+\.$/.test(fr), lec.l + " : phrase");
    assert.ok(!src.includes(fr) && !src.includes(fr.slice(0, 12)), lec.l + " : en clair dans le fichier");
    const E = mk();
    const lire = (line) => Sg.lectureLigne(line, { recit: R, state: E.state });
    assert.strictEqual(lire(lec.l), "", "rien avant");
    ids.slice(0, -1).forEach((id) => { T += 4000; E.essaiSigne(id, debrouille(BROUILLE[id][0])); });
    assert.strictEqual(lire(lec.l), "", "rien tant qu’un signe manque");
    T += 4000; E.essaiSigne(ids[ids.length - 1], debrouille(BROUILLE[ids[ids.length - 1]][0]));
    assert.strictEqual(lire(lec.l), fr, "la phrase quand tout est compris");
    assert.strictEqual(lire("Avant : " + lec.l), fr, "aussi dans une phrase");
    assert.strictEqual(lire(lec.l + " [inconnu]"), "", "pas si la ligne a un signe non compris");
  }
  const E2 = mk();
  for (const id of ["main", "halte", "machine", "dormir"]) { T += 4000; E2.essaiSigne(id, debrouille(BROUILLE[id][0])); }
  assert.ok(Sg.lectureLigne("[main] [halte] · [machine] [dormir]", { recit: R, state: E2.state }).length > 0);
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
    if (n.locked) {
      if (typeof n.x.need === "string") E.state.made[n.x.need] = 1;
      else if (Array.isArray(n.x.need)) n.x.need.forEach((id) => (E.state.made[id] = 1));
      else return;
    }
    const n2 = E.nextExp(zid);
    if (!n2 || n2.locked) return;
    if (n2.x.cost) for (const i in n2.x.cost) E.add(i, n2.x.cost[i]);
    const r = E.startExp(zid);
    assert.ok(r.ok, zid + ":" + n2.x.id + " : " + JSON.stringify(r));
    T += n2.x.dur * 1000 + 1000; E.update();
    assert.ok(log.some((e) => e.x.id === n2.x.id && e.z === zid), "exploration finie : " + zid + ":" + n2.x.id);
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
  // le Comptoir vend les pages 4, 7 et 8
  const b = E.buyablePages();
  assert.deepStrictEqual(b.map((p) => p.n), [4, 7, 8]);
  E.state.ecus = b.reduce((s, p) => s + p.ecus, 0);
  assert.ok(E.buyPage("p04").ok && E.buyPage("p07").ok && E.buyPage("p08").ok);
  assert.strictEqual(E.state.ecus, 0);
  assert.deepStrictEqual(E.buyablePages(), []);
  assert.deepStrictEqual(pagesOf(E), [2, 4, 6, 7, 8, 12, 14]);
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

console.log("Récit : la flûte et le ciel (6.2)");
test("mélodies du récit : notes, effets et déclarations", () => {
  const m = R.melodies;
  assert.ok(m, "R.melodies doit être défini");
  for (const id in m) {
    const mel = m[id];
    assert.ok(mel.n, id + " nom manquant");
    assert.ok(Array.isArray(mel.notes) && mel.notes.length >= 3, id + " notes invalides");
    assert.ok(mel.notes.every((n) => n >= 1 && n <= 5), id + " note hors bornes 1..5");
    assert.ok(mel.t, id + " texte manquant");
    assert.ok(!/—/.test(mel.t), id + " tiret cadratin");
    assert.ok(!/\d\s*·\s*\d/.test(mel.t), id + " notes en clair dans le texte");
    assert.ok(!/nourrice/i.test(mel.t.replace(/\[nourrice\]/g, "")), id + " mot interdit");
  }
});

test("les airs réels déclenchent leurs effets nommés", () => {
  const E = mk();
  let releveEv = false;
  let halteEv = false;
  let skyEv = null;
  E.on("releve_fenetre", () => { releveEv = true; });
  E.on("halte_jouee", () => { halteEv = true; });
  E.on("skyanim", (a) => { skyEv = a; });

  // 1. La Berceuse
  const bNotes = R.melodies.berceuse_n.notes;
  bNotes.forEach((n) => E.playNote(n));
  assert.strictEqual(releveEv, true, "la berceuse doit émettre releve_fenetre");
  assert.strictEqual(skyEv, "sommeil");
  assert.ok(E.state.secrets.berceuse_n);

  // 2. Main levée
  skyEv = null;
  const hNotes = R.melodies.halte.notes;
  hNotes.forEach((n) => E.playNote(n));
  assert.strictEqual(halteEv, true, "main levée doit émettre halte_jouee");
  assert.strictEqual(E.state.flags.halte, true);
  assert.ok(E.state.secrets.halte);

  // 3. La Promesse
  const pNotes = R.melodies.promesse.notes;
  pNotes.forEach((n) => E.playNote(n));
  assert.strictEqual(skyEv, "double_pulse");
  assert.strictEqual(E.state.flags.promesse_jouee, true);
  assert.strictEqual(E.state.flags.chant_visible, true);
  assert.ok(E.state.secrets.promesse);

  // 4. Le Nom
  const nNotes = R.melodies.nom.notes;
  nNotes.forEach((n) => E.playNote(n));
  assert.strictEqual(E.state.flags.nom_joue, true);
  assert.ok(E.state.secrets.nom);

  // 5. Main d'abord
  const dNotes = R.melodies.dabord.notes;
  dNotes.forEach((n) => E.playNote(n));
  assert.strictEqual(E.state.flags.cle_clause, true);
  assert.ok(E.state.secrets.cregistre);
});

test("Dormez-vous ? donne Accorder après les Cuves", () => {
  const E = mk();
  const frereNotes = D.MELODIES.frere.notes;

  // Avant les Cuves : frere donne le secret et l'intuition, mais pas Accorder
  frereNotes.forEach((n) => E.playNote(n));
  assert.ok(!E.state.flags.berceuse);
  assert.ok(!E.gesteOK("accorder"));

  // Avec la flûte et après les Cuves
  E.add("flute", 1);
  E.state.frags.cuves = true;
  frereNotes.forEach((n) => E.playNote(n));
  assert.ok(E.state.flags.berceuse, "flags.berceuse doit être activé");
  assert.ok(E.gesteOK("accorder"), "action accorder doit être disponible");
});

test("la question de la lueur rouge apparaît avec le Ciel et se résout avec la Promesse", () => {
  const E = mk();
  assert.ok(!E.questions().some((q) => q.id === "q_rouge"));
  E.add("lunette", 1); E.recalc();
  const q = E.questions().find((x) => x.id === "q_rouge");
  assert.ok(q && !q.resolu);
  assert.strictEqual(q.aides.length, 0);
  E.state.intu = 1e6;
  for (let i = 1; i <= 3; i++) assert.strictEqual(E.askHelp("q_rouge").lvl, i);
  assert.strictEqual(E.questions().find((x) => x.id === "q_rouge").aides.length, 3);

  // Résolution avec la Promesse
  R.melodies.promesse.notes.forEach((n) => E.playNote(n));
  assert.ok(E.questions().find((x) => x.id === "q_rouge").resolu);
});

test("animations célestes du récit", () => {
  const anims = R.skyAnims;
  assert.ok(anims);
  const types = ["meteors", "pulse", "aurora", "constellation"];
  for (const id in anims) {
    const a = anims[id];
    assert.ok(types.includes(a.type), id + " type inconnu " + a.type);
    assert.ok(a.dur > 0, id + " durée positive");
  }
});

console.log("Récit : les voix (6.3)");
test("données du Registre et du terminal du récit", () => {
  assert.ok(R.registre, "R.registre présent");
  assert.ok(R.terminal, "R.terminal présent");
  assert.ok(R.registre.clause && R.registre.mains && R.registre.relais && R.registre.nourrice);
  // Vérification que les réponses du registre ne contiennent pas « je » ou d’adjectifs sentimentaux
  for (const k in R.registre) {
    const text = R.registre[k];
    assert.ok(typeof text === "string" && text.length > 0, k + " texte non vide");
    assert.ok(!/\bje\b/i.test(text), k + " ne doit pas contenir « je »");
  }
});

test("événements narratifs : validation des structures et conditions", () => {
  assert.ok(Array.isArray(R.events) && R.events.length > 0, "R.events présent");
  for (const ev of R.events) {
    assert.ok(ev.id && typeof ev.id === "string", "id événement valide");
    if (ev.cond) checkCond(ev.cond, "événement " + ev.id);
    if (ev.arche) {
      const lines = Array.isArray(ev.arche) ? ev.arche : [ev.arche];
      lines.forEach((l) => assert.ok(typeof l === "string" && l.length > 0));
    }
    if (ev.toast) assert.ok(typeof ev.toast === "string" && ev.toast.length > 0);
  }
});

test("parcours narratif des voix : radio ARCHE et Registre", () => {
  const E = mk();
  E.state.flags.arche = true;
  // Déclenchement de l'événement radio à l'âge 7
  E.state.age = 7;
  E.checkEvents();
  assert.ok(E.state.arche.some((l) => l.txt.includes("ICI ARCHE. SEMEUR 7")));

  // Ouverture du Registre par la Clause
  E.terminal("main d'abord");
  assert.ok(E.state.flags.registre);
  assert.ok(E.state.secrets.cregistre);

  // Écriture puis lecture de la capsule
  E.setCapsuleText("Un mot pour celui qui vient.");
  const capLines = E.terminal("capsule");
  assert.ok(E.state.secrets.ccapsule);
  assert.ok(capLines.some((l) => l.includes("ENREGISTREMENT ORIGINAL : « Un mot pour celui qui vient. »")));
  assert.ok(capLines.some((l) => l.includes("DIFFUSÉ : « Salut. C’est toi.")));
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
