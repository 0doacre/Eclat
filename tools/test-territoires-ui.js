/* Parcours réel : objectifs territoriaux, bonus annoncé, relève, persistance et mobile. */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert/strict");
const { chromium } = require(process.env.PW || "playwright");
const { createEngine } = require("../js/engine"), D = require("../js/data"), T = require("../js/territoires");
const ROOT = path.resolve(__dirname, ".."), OUT = process.env.TERRES_SHOTS;
const server = http.createServer((req, res) => {
  const file = path.resolve(ROOT, "." + new URL(req.url, "http://localhost").pathname.replace(/\/$/, "/index.html"));
  if (!file.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (err, data) => {
    if (err) return res.writeHead(404).end();
    const type = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2" };
    res.setHeader("Content-Type", type[path.extname(file)] || "application/octet-stream"); res.end(data);
  });
});
function save() {
  const E = createEngine(), S = E.state;
  S.age = 6; S.cycle = 2; S.introSeen = true; S.flags.ver = D.VERSION; S.meta.forcedDone = true;
  Object.assign(S.settings, { tuto: false, sound: false, visiteurs: false });
  S.meta.terres.desert = 1;
  for (const z of Object.keys(T.RULES)) {
    S.zones[z] = true;
    if (D.PASSAGES[z]) S.pass[z] = { paid: {}, done: true };
    if (z === "desert") break;
  }
  for (const [id, it] of Object.entries(D.ITEMS)) {
    if (it.a > 6 || it.sec || it.path || !it.r) continue;
    E.learn(id, true); S.inv[id] = 1;
  }
  // Le Désert au deuxième passage : 4 objectifs sur 5, série de verre trempé à terminer.
  const t = E.terreMaitrise("desert"), r = T.RULES.desert;
  for (const p of t.phases.slice(0, 3)) for (const id of p.ids || []) S.made[id] = 1;
  S.exp.done.desert = r.lieux.length; S.territoires.produit.desert = t.phases[3].cible;
  E.recalc(); return E.serialize();
}
async function main() {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}) });
  let checks = 0;
  const check = (v, msg) => { assert.ok(v, msg); checks++; };
  try {
    if (OUT) fs.mkdirSync(OUT, { recursive: true });
    for (const width of [320, 390, 980]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: "block" });
      const p = await context.newPage(), errors = [];
      p.on("pageerror", e => errors.push(e.message));
      await p.addInitScript(raw => { if (!localStorage.getItem("eclat.save.v1")) localStorage.setItem("eclat.save.v1", raw); }, save());
      await p.goto("http://127.0.0.1:" + server.address().port);
      await p.waitForFunction(() => !!window.__eclat);
      for (let i = 0; i < 10; i++) { await p.waitForTimeout(120); await p.evaluate(() => window.__eclat.closeModal()); }
      const details = p.locator('[data-terre-maitrise="desert"]');
      await details.locator(":scope > summary").click();
      check(await details.getAttribute("open") !== null, "objectifs dépliables à " + width);
      const text = await details.innerText();
      check(text.includes("80 %") && text.includes("La précision"), "progression et chapitre à " + width);
      check(text.includes("Verre trempé") && !text.includes("Le Quai"), "objectif concret et secrets absents à " + width);
      check(text.includes("jusqu") || text.includes("plafond"), "règle du bonus lisible à " + width);
      const material = p.locator('[data-terre-compteur="desert:serie"]');
      await p.evaluate(() => { const E = window.__eclat.E; E.state.made.verre_trempe = 3; });
      await p.waitForFunction(() => document.querySelector('[data-terre-compteur="desert:serie"]').textContent === "3");
      check(await material.innerText() === "3", "compteur actualisé à " + width);
      await p.evaluate(() => { const E = window.__eclat.E; E.state.made.verre_trempe = 10; E.terresCheck(); E.emit("struct"); });
      await p.waitForFunction(() => document.querySelector('[data-terre-maitrise="desert"] > summary').textContent.includes("100 %"));
      check(await details.getAttribute("open") !== null, "ouverture conservée après progression à " + width);
      check((await details.innerText()).includes("Horizon") && (await details.innerText()).includes("Gisement Noir"), "aperçu après maîtrise à " + width);
      check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "aucun débordement à " + width);
      if (OUT) await details.screenshot({ path: path.join(OUT, "desert-" + width + ".png") });
      await p.locator("#memBtn").click();
      await p.waitForTimeout(550); // protection existante contre les clics dans une fenêtre fraîche
      await p.locator('#modal [data-m="releve"]').click();
      const modal = p.locator("#modal");
      await p.locator('#modal [data-m="go"]').waitFor({ state: "visible" });
      await p.waitForTimeout(550);
      check((await modal.innerText()).includes("+5 % → +10 % à cette relève"), "gain annoncé à " + width);
      check(await p.evaluate(() => document.querySelector("#modal").scrollWidth <= innerWidth), "bilan contenu à " + width);
      if (OUT) await modal.screenshot({ path: path.join(OUT, "releve-" + width + ".png") });
      await p.locator('[data-m="go"]').click();
      await p.waitForFunction(() => window.__eclat.E.state.cycle === 3, null, { timeout: 5000 }).catch(async e => {
        console.error({ errors, state: await p.evaluate(() => ({ cycle: window.__eclat.E.state.cycle, text: document.querySelector('#modal').innerText })) }); throw e;
      });
      check(await p.evaluate(() => window.__eclat.E.terreBonus("desert") === 1.1 && !window.__eclat.E.terreMaitrise("desert").pret), "gain reçu et objectifs réinitialisés à " + width);
      await p.reload(); await p.waitForFunction(() => !!window.__eclat);
      check(await p.evaluate(() => window.__eclat.E.terreBonus("desert") === 1.1), "gain sauvegardé à " + width);
      check(errors.length === 0, "aucune erreur navigateur : " + errors.join("; "));
      await context.close();
    }
    console.log(checks + " contrôles territoriaux navigateur réussis.");
  } finally { await browser.close(); server.close(); }
}
main().catch(e => { console.error(e); server.close(); process.exitCode = 1; });
