/* Comparer les données 0.20.1 et 0.21 avec le même moteur et le même simulateur.
 * node tools/audit-simulations.js baseline|current --joueur tapeur --minutes 240 */
"use strict";
const path = require("path"), cp = require("child_process"), Module = require("module");
const root = path.resolve(__dirname, ".."), mode = process.argv[2], args = process.argv.slice(3);
if (!["baseline", "current"].includes(mode)) throw Error("Choisir baseline ou current.");
if (mode === "baseline") {
  const file = path.join(root, "js/data.js"), m = new Module(file, module);
  m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file)); require.cache[file] = m;
  m._compile(cp.execFileSync("git", ["show", "9d143e1:js/data.js"], { cwd: root, encoding: "utf8" }), file);
}
const D = require("../js/data.js"), { play, lire } = require("./sim-passages.js");
const r = play(lire(args)), E = r.E;
console.log(JSON.stringify({ mode, version: D.VERSION, args, age: D.AGES[r.age].id, minutes: r.minutes,
  ecoule: r.ecoule, traces: r.traces, taps: r.taps, crafts: r.crafts, goal: E.objective(), guide: E.guide(),
  gels: r.gels, passages: r.rows.map((x) => ({ z: x.z, minutes: x.t })), eau: E.count("eau"), soufre: E.count("soufre"),
  machines: Object.keys(D.ITEMS).filter((id) => D.ITEMS[id].t === "mach" && E.count(id) > 0), exts: r.ext }, null, 2));
