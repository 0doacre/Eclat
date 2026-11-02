/* Mesure de la sobriété des écrans principaux (téléphone de 390 × 844) : cibles tactiles visibles, signes de texte visibles, défilement.
 * node tools/mesure-sobriete.js            tableau pour les âges 1, 5 et 9
 * SHOTS=/tmp/dossier node tools/mesure-sobriete.js   enregistre aussi une capture par écran
 * Parties de test : toutes les recettes de l'âge connues, 40 de chaque ressource : c'est un maximum, pas une partie type. Playwright requis. */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http");
const { chromium } = require(process.env.PW || "playwright"), D = require("../js/data"), Core = require("../js/engine");
const ROOT = path.resolve(__dirname, ".."), MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => { const f = path.resolve(ROOT, "." + new URL(req.url, "http://localhost").pathname.replace(/\/$/, "/index.html")); if (!f.startsWith(ROOT + path.sep)) return res.writeHead(403).end(); fs.readFile(f, (e, b) => { if (e) return res.writeHead(404).end(); res.setHeader("Content-Type", MIME[path.extname(f)] || "application/octet-stream"); res.end(b); }); });
function partie(age) {
  const E = Core.createEngine(), s = E.state; s.age = age; s.cycle = 1; s.meta.forcedDone = true; s.introSeen = true; s.flags.ver = D.VERSION; s.stats.crafts = 5;
  Object.assign(s.settings, { tuto: false, sound: false, visiteurs: false });
  for (const z of D.ZONES) if (age >= 4 || ["lisiere", "plaine"].includes(z.id)) s.zones[z.id] = true;
  for (const [id, it] of Object.entries(D.ITEMS)) { if (it.t === "res" && it.a <= age) { s.seen[id] = true; s.inv[id] = 40; } if (it.r && it.a <= age && !it.sec && !it.path) { s.known[id] = true; s.made[id] = 1; } }
  E.recalc(); return E.serialize();
}
const MES = () => {
  const vh = innerHeight;
  const rendu = (e) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 4 && r.height > 4 && cs.visibility !== "hidden" && cs.display !== "none"; };
  const ecran = (e) => { const r = e.getBoundingClientRect(); return rendu(e) && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < innerWidth; };
  const SEL = "button, a[href], [role=button], [data-goto], input, summary, [data-cr], [data-inv]";
  const v = document.querySelector(".view.on");
  const fixe = [...document.querySelectorAll("#top button, #tabs button")].filter(ecran).length;
  const aEcran = [...document.querySelectorAll(SEL)].filter(ecran).length;
  const page = [...v.querySelectorAll(SEL)].filter(rendu).length;   /* toute la page, repliés exclus */
  const texteDe = (f) => [...v.querySelectorAll("*")].filter((e) => e.children.length === 0 && f(e)).map((e) => (e.textContent || "").trim()).join(" ").length;
  const h = document.querySelector("#top"), t = document.querySelector("#tabs");
  return { cibles: aEcran, contenu: aEcran - fixe, page, texte: texteDe(ecran), textePage: texteDe(rendu), bandeaux: Math.round((h ? h.getBoundingClientRect().height : 0) + (t ? t.getBoundingClientRect().height : 0)), scroll: Math.max(0, v.scrollHeight - v.clientHeight), vh };
};
const EXTRA = (process.env.EXTRA || "").split(",").filter(Boolean).map((x) => [x, x]);
const ECRANS = EXTRA.length ? EXTRA : [["domaine", "Terres"], ["labo", "Étude"], ["atelier", "Atelier (métiers)"], ["atelier:artisanat", "Atelier (un métier)"], ["journal", "Journal / Recettes"], ["arbre", "Progression"]];
async function mesurer() {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), out = [];
  for (const age of [0, 4, 8]) {
    const ctx = await b.newContext({ viewport: { width: +(process.env.VW || 390), height: +(process.env.VH || 844) }, hasTouch: true, serviceWorkers: "block", reducedMotion: "reduce" }), p = await ctx.newPage();
    await p.addInitScript((r) => { localStorage.setItem("eclat.save.v1", r); localStorage.setItem("eclat.style.carnet-defaut", "1"); }, partie(age));
    await p.goto("http://127.0.0.1:" + server.address().port + "/index.html"); await p.waitForFunction(() => !!window.__eclat);
    for (let i = 0; i < 6; i++) { await p.waitForTimeout(80); await p.evaluate(() => window.__eclat.closeModal()); }
    for (const [t, nom] of ECRANS) {
      const [t1, sub] = t.split("#"), [tab, met] = t1.split(":");
      await p.evaluate(([m, sb]) => { window.__eclat.U.atelierSel = m || null; window.__eclat.U.prodSel = null; if (sb) window.__eclat.U.progTab = sb; }, [met || null, sub || null]);
      const sel = '#tabs [data-tab="' + tab + '"]'; if (!(await p.locator(sel).isVisible())) continue;
      await p.locator(sel).click(); await p.waitForTimeout(500);
      if (process.env.BLOCS) console.log(await p.evaluate(() => [...document.querySelectorAll('.view.on .atl-page > *')].map((e) => (e.className || e.tagName).toString().slice(0, 28) + ':' + Math.round(e.getBoundingClientRect().height)).join(' | ')));
      const m = await p.evaluate(MES); out.push({ age: age + 1, nom, ...m });
      if (process.env.SHOTS) { fs.mkdirSync(process.env.SHOTS, { recursive: true }); await p.screenshot({ path: path.join(process.env.SHOTS, "age" + (age + 1) + "-" + t.replace(/[:#]/g, "-") + ".png") }); }
    }
    await ctx.close();
  }
  await b.close(); server.close();
  return out;
}
module.exports = { mesurer };
if (require.main === module) mesurer().then((out) => { for (const m of out) console.log(("âge " + m.age).padEnd(7), m.nom.padEnd(22), "à l'écran", String(m.contenu).padStart(3), "| page", String(m.page).padStart(3), "| texte écran", String(m.texte).padStart(4), "page", String(m.textePage).padStart(4), "| bandeaux", m.bandeaux + "/" + m.vh + " px", "| défilement", m.scroll + " px"); });
