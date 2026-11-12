/* Écrans fixes, suite (0.67.0) : ce que l'intégration du chantier « un jeu, pas un site » a ajouté.
 *  - page d'un métier : rien ne défile, l'objet choisi s'affiche en grand quand la place existe, une seule barre d'actions ;
 *  - liste des métiers : le dernier métier s'atteint en faisant glisser la liste ;
 *  - Carnet et Journal : la vue ne défile pas, la liste glisse ;
 *  - un cadre qui glisse garde sa place après un rendu ;
 *  - la réserve basse des vues est la hauteur réelle de la barre d'onglets.
 * Playwright requis. PW et CHROMIUM facultatifs. */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert/strict");
const { chromium } = require(process.env.PW || "playwright"), D = require("../js/data"), Core = require("../js/engine");
const ROOT = path.resolve(__dirname, ".."), MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const file = path.resolve(ROOT, "." + new URL(req.url, "http://localhost").pathname.replace(/\/$/, "/index.html"));
  if (!file.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (e, b) => { if (e) return res.writeHead(404).end(); res.setHeader("Content-Type", MIME[path.extname(file)] || "application/octet-stream"); res.end(b); });
});
let browser, checks = 0;
const ok = (v, m) => { assert.ok(v, m); checks++; };
const TAILLES = [[320, 568], [360, 640], [390, 700], [390, 844], [430, 932]];
function partie(avancee) {
  const E = Core.createEngine();
  if (avancee) E.load(fs.readFileSync(path.join(ROOT, "tools/fixtures/save-v5-age8-usine.json"), "utf8"));
  const s = E.state;
  s.introSeen = true; s.flags.ver = D.VERSION; s.t = Date.now();
  Object.assign(s.settings, { tuto: false, sound: false, visiteurs: false });
  if (!avancee) {
    s.age = 4; s.cycle = 2; s.meta.forcedDone = true; s.stats.crafts = 12;
    for (const z of D.ZONES) { s.zones[z.id] = true; if (z.id === "desert") break; }
    for (const [id, it] of Object.entries(D.ITEMS)) {
      if (it.t === "res" && it.a <= 4) { s.seen[id] = true; s.inv[id] = 40; }
      if (it.r && it.a <= 4 && !it.sec && !it.path) { s.known[id] = true; s.made[id] = 1; }
    }
  }
  E.recalc(); return E.serialize();
}
const defile = () => {
  const v = document.querySelector(".view.on"), vs = document.querySelector("#views");
  return Math.max(v.scrollHeight - v.clientHeight, vs.scrollHeight - vs.clientHeight, document.scrollingElement.scrollHeight - innerHeight);
};
async function run() {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const url = "http://127.0.0.1:" + server.address().port + "/index.html";
  for (const avancee of [false, true]) for (const [w, h] of TAILLES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, serviceWorkers: "block", reducedMotion: "reduce" }), p = await ctx.newPage(), errors = [];
    p.on("pageerror", e => errors.push(e.message));
    await p.addInitScript(r => { localStorage.setItem("eclat.save.v1", r); localStorage.setItem("eclat.style.carnet-defaut", "1"); }, partie(avancee));
    await p.goto(url); await p.waitForFunction(() => !!window.__eclat);
    for (let i = 0; i < 6; i++) { await p.waitForTimeout(80); await p.evaluate(() => window.__eclat.closeModal()); }
    const tag = w + "x" + h + (avancee ? " · partie avancée" : " · âge du Bronze") + " · ";
    const onglet = async t => { await p.locator('#tabs [data-tab="' + t + '"]').click(); await p.waitForTimeout(450); };

    // la réserve basse est la hauteur de la barre d'onglets
    const nav = await p.evaluate(() => ({ nav: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav")), tabs: document.getElementById("tabs").getBoundingClientRect().height }));
    ok(Math.abs(nav.nav - nav.tabs) <= 1, tag + "--nav (" + nav.nav + ") vaut la hauteur de la barre d'onglets (" + nav.tabs + ")");

    // liste des métiers : tout s'atteint
    await p.evaluate(() => { const g = window.__eclat; g.U.atelierSel = null; g.U.prodSel = null; });
    await onglet("atelier");
    ok(await p.evaluate(defile) <= 1, tag + "la liste des métiers ne fait pas défiler la vue");
    const dernier = await p.evaluate(() => {
      const l = document.querySelector("#v-atelier .atel-liste"), c = l.lastElementChild; l.scrollTop = l.scrollHeight;
      const a = l.getBoundingClientRect(), b = c.getBoundingClientRect(); return b.bottom <= a.bottom + 1 && b.top >= a.top - 1;
    });
    ok(dernier, tag + "le dernier métier s'atteint");

    // page d'un métier
    await p.evaluate(() => { const g = window.__eclat; g.U.atelierSel = "artisanat"; g.U.prodSel = null; g.render(true); });
    await p.waitForTimeout(350);
    const m = await p.evaluate(() => {
      const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { haut: b.top, bas: b.bottom, h: getComputedStyle(e).display === "none" ? 0 : b.height, d: e.scrollHeight - e.clientHeight }; };
      const qui = document.querySelector("#v-atelier .prod-qui");
      return { milieu: r("#v-atelier .prod-milieu"), scene: r("#v-atelier .prod-scene > .ic"), qty: r("#v-atelier .prod-qty"), qui: r("#v-atelier .prod-qui"), tabs: r("#tabs"),
        rangees: new Set([...qui.querySelectorAll("button")].map(b => Math.round(b.getBoundingClientRect().top / 30))).size,
        petits: [...qui.querySelectorAll("button")].filter(b => { const x = b.getBoundingClientRect(); return x.width < 43.5 || x.height < 43.5; }).length,
        raccourcis: qui.querySelectorAll(".prod-raccourcis > button").length };
    });
    ok(await p.evaluate(defile) <= 1, tag + "la page d'un métier ne fait pas défiler la vue");
    ok(m.milieu.d <= 1, tag + "le milieu de la page d'un métier ne défile pas (" + m.milieu.d + " px)");
    ok(m.qty.bas <= m.qui.haut + 1, tag + "les quantités sont au-dessus de la barre d'actions");
    ok(m.qui.bas <= m.tabs.haut + 1, tag + "la barre d'actions est au-dessus des onglets");
    ok(m.rangees === 1, tag + "la barre d'actions tient sur une rangée");
    ok(m.petits === 0, tag + "les cibles de la barre d'actions font 44 px");
    ok(m.raccourcis === 3, tag + "les trois feuilles du métier sont dans la barre d'actions");
    if (h >= 844) ok(m.scene && m.scene.h >= 96, tag + "l'objet choisi s'affiche en grand");
    if (h <= 568) ok(!m.scene || m.scene.h === 0, tag + "l'objet en grand s'efface quand la place manque");

    // un cadre qui glisse garde sa place après un rendu
    const garde = await p.evaluate(() => { const c = document.querySelector("#v-atelier .prod-choix"); c.scrollLeft = 120; const avant = c.scrollLeft; window.__eclat.render(true); return [avant, document.querySelector("#v-atelier .prod-choix").scrollLeft]; });
    ok(garde[0] === 0 || Math.abs(garde[0] - garde[1]) <= 1, tag + "la rangée des recettes garde sa place après un rendu (" + garde.join(" → ") + ")");

    // Carnet ou Journal : la vue ne défile pas, la liste glisse
    await onglet("journal");
    ok(await p.evaluate(defile) <= 1, tag + "le Carnet ne fait pas défiler la vue");
    const liste = await p.evaluate(() => { const l = document.querySelector("#v-carnet.on #clist, #v-journal.on .journal-corps"); return l ? getComputedStyle(l).overflowY : ""; });
    ok(liste === "auto", tag + "la liste du Carnet glisse dans son cadre");

    ok(!errors.length, tag + "erreurs JS " + errors.join(";"));
    await ctx.close();
  }
  console.log(checks + " contrôles des écrans fixes (métier, Carnet, listes) réussis.");
}
run().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); server.close(); });
