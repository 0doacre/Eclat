/* Le jus : les paliers de rareté et ce que les curiosités déclarent. Le rendu à l’écran est dans tools/test-juice-ui.js. */
"use strict";
const assert = require("assert/strict");
const fs = require("fs"), path = require("path");
const D = require("../js/data.js");
const J = require("../js/juice.js");

let passed = 0;
function test(n, fn) {
  try { fn(); passed++; console.log("  ✓ " + n); }
  catch (e) { console.log("  ✗ " + n + "\n    " + (e.stack || e)); process.exitCode = 1; }
}
console.log("Le jus (0.24)");
test("trois paliers, et chacun en fait plus que le précédent", () => {
  const p = [1, 2, 3].map(J.palier);
  for (const k of ["ms", "sparks", "rings", "flash", "shake", "fireworks"]) {
    assert.ok(p[0][k] <= p[1][k] && p[1][k] <= p[2][k], k + " croît avec la rareté");
  }
  assert.ok(p[2].ms > p[0].ms && p[2].sparks > p[0].sparks && p[2].flash > 0 && p[2].shake > 0);
  assert.equal(p[0].flash, 0, "une trouvaille ordinaire ne fait pas trembler l’écran");
});
test("un palier hors limites retombe sur le plus proche", () => {
  assert.equal(J.palier(0), J.PALIERS[1]);
  assert.equal(J.palier(9), J.PALIERS[3]);
  assert.equal(J.palier(undefined), J.PALIERS[1]);
});
test("chaque curiosité a un palier de rareté (2 ou 3), et les plus rares tiennent le palier 3", () => {
  for (const [id, c] of Object.entries(D.EASTER)) assert.ok(c.tier === 2 || c.tier === 3, id + " : palier " + c.tier);
  for (const id of ["poudre_rouge", "coeur", "d20", "anneau"]) assert.equal(D.EASTER[id].tier, 3, id);
});
test("le module est dans la page et dans le cache hors ligne", () => {
  const root = path.resolve(__dirname, "..");
  assert.ok(/js\/juice\.js/.test(fs.readFileSync(path.join(root, "index.html"), "utf8")));
  assert.ok(/js\/juice\.js/.test(fs.readFileSync(path.join(root, "sw.js"), "utf8")));
});
console.log(passed + " tests du jus réussis.");
