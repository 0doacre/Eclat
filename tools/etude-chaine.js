/* Étude des chaînes de production (0.39) : étages, machines et extracteurs pour une cadence voulue.
 * Lit les vraies données (js/data.js) et le moteur ; ne modifie rien. */
const path = require("path").join(__dirname, "..", "js") + "/";
const D = require(path + "data.js");
const { createEngine } = require(path + "engine.js");
const I = D.ITEMS;
const E = createEngine({ now: () => 2e12, rand: () => 0.99 });
function plan(target, perMin, age) {
  E.state.age = age;
  const nodes = {}, raw = {};
  (function need(id, n) {
    const it = I[id];
    if (!it) return;
    if (!it.r || it.t === "res") { raw[id] = (raw[id] || 0) + n; return; }
    const out = it.r[2] || 1, crafts = n / out;
    nodes[id] = (nodes[id] || 0) + crafts;
    for (const i in it.r[1]) need(i, crafts * it.r[1][i]);
  })(target, perMin);
  const rows = [];
  let machines = 0;
  for (const id in nodes) {
    const m = E.machFor(id);
    const rate = m ? E.machRate(m, id) * 60 : 0; // fabrications par minute et par machine
    const k = rate ? nodes[id] / rate : Infinity;
    machines += k === Infinity ? 0 : Math.ceil(k);
    rows.push({ id, perMin: nodes[id], mach: m, k });
  }
  const ext = [];
  for (const id in raw) {
    const t = E.extFor(id).sort((a, b) => E.extRate(b, id) - E.extRate(a, id))[0];
    const r = t ? E.extRate(t, id) * 60 : 0;
    ext.push({ id, perMin: raw[id], ext: t, k: r ? raw[id] / r : Infinity });
  }
  return { rows, ext, machines };
}
const cas = [["lingot_acier", 30, 7], ["circuit", 20, 11], ["processeur", 10, 12]];
for (const [t, r, a] of cas) {
  if (!I[t]) { console.log("absent", t); continue; }
  const p = plan(t, r, a);
  console.log("\n== " + I[t].n + " × " + r + "/min (âge " + a + ")  étages : " + p.rows.length + " · machines : " + p.machines + " · matières brutes : " + p.ext.length);
  p.rows.sort((x, y) => y.k - x.k).slice(0, 8).forEach((x) => console.log("  " + (I[x.id].n + "                ").slice(0, 22) + x.perMin.toFixed(1).padStart(7) + "/min  " + (x.mach || "—").padEnd(16) + (x.k === Infinity ? "pas de machine" : x.k.toFixed(1) + " mach.")));
  p.ext.sort((x, y) => y.k - x.k).slice(0, 5).forEach((x) => console.log("  [brut] " + (I[x.id].n + "              ").slice(0, 16) + x.perMin.toFixed(1).padStart(8) + "/min  " + (x.ext || "—").padEnd(16) + (x.k === Infinity ? "pas d'extracteur" : x.k.toFixed(1) + " ext.")));
}
