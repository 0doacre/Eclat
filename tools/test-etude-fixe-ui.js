/* Étude : un écran fixe. Rien ne défile aux cinq tailles de téléphone ;
 * l'établi et son bouton d'action restent au pouce, au-dessus des onglets ;
 * seule la réserve de ressources glisse dans son cadre ; aucune cible sous 44 px.
 * Playwright requis. PW et CHROMIUM facultatifs. */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http"), assert = require("assert/strict");
const { chromium } = require(process.env.PW || "playwright"), D = require("../js/data"), Core = require("../js/engine");
const ROOT = path.resolve(__dirname, ".."), MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2", ".png": "image/png" };
const server = http.createServer((req, res) => {
  const file = path.resolve(ROOT, "." + new URL(req.url, "http://localhost").pathname.replace(/\/$/, "/index.html"));
  if (!file.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (e, b) => { if (e) return res.writeHead(404).end(); res.setHeader("Content-Type", MIME[path.extname(file)] || "application/octet-stream"); res.end(b); });
});
let browser, checks = 0;
const ok = (v, m) => { assert.ok(v, m); checks++; };
const TAILLES = [[320, 568], [360, 640], [390, 700], [390, 844], [430, 932]];
const AGES = [0, 4, 8];

function partie(age) {
  const E = Core.createEngine(), s = E.state;
  s.age = age; s.cycle = 1; s.meta.forcedDone = true; s.introSeen = true; s.flags.ver = D.VERSION; s.stats.crafts = 5;
  Object.assign(s.settings, { tuto: false, sound: false, visiteurs: false, equipmentFilter: "tout" });
  for (const z of D.ZONES) if (D.ITEMS && (age >= 4 || ["lisiere", "plaine"].includes(z.id))) s.zones[z.id] = true;
  for (const [id, it] of Object.entries(D.ITEMS)) {
    if (it.t === "res" && it.a <= age) { s.seen[id] = true; s.inv[id] = 40; }
    if (it.r && it.a <= age && !it.sec && !it.path) { s.known[id] = true; s.made[id] = 1; }
  }
  E.recalc(); return E.serialize();
}

const MESURE = () => {
  const q = s => document.querySelector(s), r = e => e && e.getBoundingClientRect();
  const labo = q("#v-labo"), vs = q("#views"), tabs = r(q("#tabs")), forge = r(q('#v-labo button[data-ae="forge"]'));
  const inv = q("#v-labo .ae-inventory");
  let invDefile = false;
  if (inv && inv.clientHeight > 0 && getComputedStyle(inv).overflowY === "auto" && getComputedStyle(inv).overscrollBehaviorY === "contain") {
    const probe = document.createElement("div");
    probe.style.cssText = "height:" + (inv.clientHeight + 100) + "px;min-height:" + (inv.clientHeight + 100) + "px;flex:none;grid-column:1 / -1";
    inv.append(probe);
    inv.scrollTop = 50;
    invDefile = inv.scrollTop > 0;
    probe.remove();
  }
  const petites = [...document.querySelectorAll('#v-labo button, #v-labo [role="button"]')].map(b => {
    const rc = b.getBoundingClientRect();
    return { cls: b.className, text: b.textContent.trim().slice(0, 20), w: Math.round(rc.width * 10) / 10, h: Math.round(rc.height * 10) / 10 };
  }).filter(x => x.w > 0 && x.h > 0 && (x.w < 43.9 || x.h < 43.9));
  const hors = [...document.querySelectorAll('#v-labo button, #v-labo .ae-bench, #v-labo .ae-stock')].filter(e => {
    const b = e.getBoundingClientRect();
    return b.width > 0 && (b.left < -1 || b.right > innerWidth + 1);
  }).length;
  return {
    page: Math.max(labo ? labo.scrollHeight - labo.clientHeight : 0, vs ? vs.scrollHeight - vs.clientHeight : 0),
    largeur: document.documentElement.scrollWidth - innerWidth,
    hors,
    forgeBottom: forge ? forge.bottom : 0,
    forgeTop: forge ? forge.top : 0,
    forgeWidth: forge ? forge.width : 0,
    forgeHeight: forge ? forge.height : 0,
    tabsTop: tabs ? tabs.top : 0,
    invDefile,
    petites
  };
};

async function ouvre(W, H, sauvegarde) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true, serviceWorkers: "block", reducedMotion: "reduce" }), p = await ctx.newPage(), errors = [];
  p.on("pageerror", e => errors.push(e.message));
  await p.addInitScript(r => { localStorage.setItem("eclat.save.v1", r); localStorage.setItem("eclat.style.carnet-defaut", "1"); }, sauvegarde);
  await p.goto(URL_JEU); await p.waitForFunction(() => !!window.__eclat);
  for (let i = 0; i < 6; i++) { await p.waitForTimeout(60); await p.evaluate(() => window.__eclat.closeModal()); }
  await p.locator('#tabs [data-tab="labo"]').click({ force: true });
  await p.waitForTimeout(350);
  return { ctx, p, errors };
}

let URL_JEU = "";
async function run() {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  URL_JEU = "http://127.0.0.1:" + server.address().port + "/index.html";

  for (const [W, H] of TAILLES) {
    for (const age of AGES) {
      const { ctx, p, errors } = await ouvre(W, H, partie(age)), tag = `Étude à ${W} × ${H} (âge ${age + 1})`, m = await p.evaluate(MESURE);
      ok(m.page === 0, `${tag} : la page ne défile pas (${m.page} px)`);
      ok(m.largeur <= 0 && m.hors === 0, `${tag} : rien ne dépasse en largeur`);
      ok(m.forgeWidth >= 44 && m.forgeHeight >= 44 && m.forgeBottom <= m.tabsTop && m.forgeTop >= 0, `${tag} : bouton d'action entier au pouce au-dessus des onglets (bouton=${m.forgeBottom}, onglets=${m.tabsTop})`);
      ok(m.petites.length === 0, `${tag} : toutes les cibles font au moins 44 px (${JSON.stringify(m.petites)})`);
      ok(m.invDefile, `${tag} : la réserve glisse réellement dans son cadre`);
      ok(errors.length === 0, `${tag} : aucune erreur de page (${errors.join(" ; ")})`);
      await ctx.close();
    }
  }

  await browser.close();
  server.close();
  console.log(`ok - test-etude-fixe-ui : ${checks} contrôles réussis aux 5 tailles et 3 âges.`);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
