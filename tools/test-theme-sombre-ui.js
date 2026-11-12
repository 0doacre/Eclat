/* Thème sombre : le joueur le choisit (Auto, Jour, Sombre), et la nuit se lit.
 *  - Auto suit le téléphone et réagit quand il change ; Jour et Sombre le contredisent ;
 *  - la rangée « Thème » est dans Menu › Affichage et fait tourner Auto, Jour, Sombre ;
 *  - en Sombre, chaque texte des vues principales, d'une fiche, du Menu et d'un toast a un contraste d'au moins 4,5:1
 *    (mesuré sur les pixels rendus : la capture est faite sans texte, puis on compare à la couleur du texte) ;
 *  - aucune vue ne défile, aux cinq tailles.
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
let browser, checks = 0, URL_JEU = "";
const ok = (v, m) => { assert.ok(v, m); checks++; };
const TAILLES = [[320, 568], [360, 640], [390, 700], [390, 844], [430, 932]];
const SEUIL = 4.5;

function partie(theme) {
  const E = Core.createEngine();
  E.load(fs.readFileSync(path.join(ROOT, "tools/fixtures/save-v5-age8-usine.json"), "utf8"));
  const s = E.state;
  s.introSeen = true; s.flags.ver = D.VERSION; s.t = Date.now();
  Object.assign(s.settings, { tuto: false, sound: false, visiteurs: false, theme });
  E.recalc(); return E.serialize();
}
async function ouvre(W, H, theme, scheme) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true, deviceScaleFactor: 1, serviceWorkers: "block", reducedMotion: "reduce", colorScheme: scheme || "light" }), p = await ctx.newPage(), errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.addInitScript((r) => { localStorage.setItem("eclat.save.v1", r); }, partie(theme));
  await p.goto(URL_JEU); await p.waitForFunction(() => !!window.__eclat);
  for (let i = 0; i < 6; i++) { await p.waitForTimeout(80); await p.evaluate(() => window.__eclat.closeModal()); }
  return { ctx, p, errors };
}
const onglet = async (p, t) => { await p.locator('#tabs [data-tab="' + t + '"]').click({ force: true }); await p.waitForTimeout(450); };
const defile = () => {
  const v = document.querySelector(".view.on"), vs = document.querySelector("#views");
  return Math.max(v.scrollHeight - v.clientHeight, vs.scrollHeight - vs.clientHeight, document.scrollingElement.scrollHeight - innerHeight);
};

/* contraste texte/fond : 1. liste des textes visibles, 2. capture sans texte, 3. couleur moyenne du fond sous chaque texte */
async function contrastes(p, racine) {
  const items = await p.evaluate((racine) => {
    const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return [0, 0, 0, 1]; const a = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return [a[0], a[1], a[2], a.length > 3 ? a[3] : 1]; };
    const root = document.querySelector(racine); if (!root) return null;
    const out = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) {
      const n = w.currentNode; if (!n.nodeValue.trim()) continue;
      const el = n.parentElement; if (!el || el.closest("script,style")) continue;
      const rg = document.createRange(); rg.selectNodeContents(n); const r = rg.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) continue;
      const cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none") continue;
      if (el.closest(":disabled, [aria-disabled='true']")) continue; /* une commande éteinte n'est pas du texte à lire */
      let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity; if (op === 0) continue;
      const f = parse(cs.color); f[3] *= op;
      let coupe = false;
      for (let e = el.parentElement; e && e !== root.parentElement; e = e.parentElement) {
        const s = getComputedStyle(e);
        if (/(hidden|auto|scroll|clip)/.test(s.overflowY + s.overflowX)) { const b = e.getBoundingClientRect(); if (r.bottom > b.bottom + 1 || r.top < b.top - 1 || r.right > b.right + 1 || r.left < b.left - 1) { coupe = true; break; } }
      }
      if (coupe) continue; /* rogné par un cadre qui glisse : pas visible */
      const top = document.elementFromPoint(Math.min(innerWidth - 1, Math.max(0, r.left + r.width / 2)), Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2)));
      if (top && getComputedStyle(root).pointerEvents !== "none" && !(root.contains(top) || top.contains(root))) continue; /* recouvert par autre chose (un toast ne reçoit pas le toucher : on ne peut pas le sonder ainsi) */
      out.push({ t: n.nodeValue.trim().slice(0, 30), x: r.left, y: r.top, w: r.width, h: r.height, f, sel: el.tagName.toLowerCase() + (typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "") });
    }
    return out;
  }, racine);
  if (items === null) return null;
  const st = await p.addStyleTag({ content: "*,*::before,*::after{color:transparent !important;-webkit-text-fill-color:transparent !important;text-shadow:none !important;caret-color:transparent !important;transition:none !important;animation:none !important}" });
  await p.waitForTimeout(150);
  const png = (await p.screenshot()).toString("base64");
  await p.evaluate((e) => e.remove(), st);
  return p.evaluate(async ({ items, png }) => {
    const img = new Image(); img.src = "data:image/png;base64," + png; await img.decode();
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0);
    const k = img.width / innerWidth;
    const lin = (v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
    const L = (c) => .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2]);
    return items.map((it) => {
      const x = Math.max(0, Math.floor(it.x * k)), y = Math.max(0, Math.floor(it.y * k)), w = Math.max(1, Math.min(img.width - x, Math.ceil(it.w * k))), h = Math.max(1, Math.min(img.height - y, Math.ceil(it.h * k)));
      const d = g.getImageData(x, y, w, h).data; let r = 0, gg = 0, b = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; }
      const bg = [r / n, gg / n, b / n], a = it.f[3], fg = [0, 1, 2].map((i) => it.f[i] * a + bg[i] * (1 - a));
      const l1 = L(fg), l2 = L(bg);
      return { t: it.t, sel: it.sel, ratio: (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05) };
    });
  }, { items, png });
}
const verifie = async (p, racine, tag) => {
  if (!racine.includes("toasts")) { await p.evaluate(() => document.querySelectorAll("#toasts > *").forEach((e) => e.remove())); await p.waitForTimeout(120); } /* un toast de passage ne couvre pas ce qu'on mesure */
  const r = await contrastes(p, racine);
  ok(r && r.length > 0, tag + " : des textes à mesurer (" + racine + ")");
  const bas = r.filter((x) => x.ratio < SEUIL);
  ok(bas.length === 0, tag + " : contraste d'au moins " + SEUIL + ":1, trouvé " + bas.slice(0, 3).map((x) => x.ratio.toFixed(2) + " « " + x.t + " » " + x.sel).join(" ; "));
  return Math.min(...r.map((x) => x.ratio));
};

async function run() {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  URL_JEU = "http://127.0.0.1:" + server.address().port + "/index.html";

  /* 1. le réglage : Auto suit le téléphone, Jour et Sombre le contredisent */
  {
    const { ctx, p, errors } = await ouvre(390, 844, "auto", "dark");
    const sombre = () => p.evaluate(() => document.body.classList.contains("theme-dark") && document.body.dataset.theme === "dark");
    ok(await sombre(), "Auto sur un téléphone sombre : papier de nuit");
    await p.emulateMedia({ colorScheme: "light" }); await p.waitForTimeout(200);
    ok(!(await sombre()) && await p.evaluate(() => document.body.dataset.theme) === "light", "Auto réagit quand le téléphone passe au clair");
    await p.emulateMedia({ colorScheme: "dark" }); await p.waitForTimeout(200);
    ok(await sombre(), "Auto réagit quand le téléphone repasse au sombre");
    const meta = () => p.evaluate(() => document.querySelector('meta[name="theme-color"]').getAttribute("content"));
    const metaNuit = await meta();
    /* la rangée Thème du menu : Auto, Jour, Sombre, Auto */
    await p.locator("#menuBtn").click(); await p.waitForTimeout(400);
    await p.locator('.modal:not(.hidden) [role="tab"], .modal:not(.hidden) .m-nav-tab').filter({ hasText: "Affichage" }).first().click(); await p.waitForTimeout(250);
    const bouton = p.locator('.modal:not(.hidden) [data-m="theme"]');
    ok(await bouton.count() === 1 && await bouton.isVisible(), "la rangée Thème est dans Menu › Affichage");
    ok((await bouton.textContent()).trim() === "Auto", "le menu annonce Auto");
    await bouton.click(); await p.waitForTimeout(200);
    ok((await bouton.textContent()).trim() === "Jour" && !(await sombre()), "un appui : Jour, même sur un téléphone sombre");
    ok(await meta() !== metaNuit, "la couleur de la barre du navigateur suit le jour");
    await bouton.click(); await p.waitForTimeout(200);
    ok((await bouton.textContent()).trim() === "Sombre" && await sombre() && await meta() === metaNuit, "un appui de plus : Sombre");
    ok(await p.evaluate(() => window.__eclat.E.state.settings.theme) === "dark", "le réglage est écrit dans la partie");
    await bouton.click(); await p.waitForTimeout(200);
    ok((await bouton.textContent()).trim() === "Auto", "puis retour à Auto");
    ok(errors.length === 0, "réglage : aucune erreur de page (" + errors.join(" ; ") + ")");
    await ctx.close();
  }
  { /* Sombre choisi : le téléphone clair ne change rien ; Jour choisi : le téléphone sombre non plus */
    for (const [pref, scheme, attendu] of [["dark", "light", true], ["light", "dark", false]]) {
      const { ctx, p } = await ouvre(390, 844, pref, scheme);
      ok(await p.evaluate(() => document.body.classList.contains("theme-dark")) === attendu, "réglage " + pref + " sur téléphone " + scheme + " : " + (attendu ? "nuit" : "jour"));
      await ctx.close();
    }
  }

  /* 2. en Sombre : contrastes et vues qui ne défilent pas, aux cinq tailles */
  const pire = {};
  for (const [W, H] of TAILLES) {
    const { ctx, p, errors } = await ouvre(W, H, "dark", "light"), t = W + " × " + H;
    ok(await p.evaluate(() => document.body.classList.contains("theme-dark")), t + " : Sombre est posé");
    const vue = async (nom, prepare) => {
      await prepare();
      await p.waitForTimeout(400);
      ok(await p.evaluate(defile) <= 1, t + " " + nom + " : la vue ne défile pas (" + await p.evaluate(defile) + " px)");
      const m = await verifie(p, ".view.on", t + " " + nom + " (vue)");
      pire[nom] = Math.min(pire[nom] || 99, m);
    };
    await vue("Terres", async () => { await onglet(p, "domaine"); await p.evaluate(() => { const g = window.__eclat; g.U.zone = "collines"; g.render(true); }); });
    await vue("Étude", async () => { await onglet(p, "labo"); });
    await vue("Atelier", async () => { await p.evaluate(() => { const g = window.__eclat; g.U.atelierSel = null; g.U.prodSel = null; }); await onglet(p, "atelier"); });
    await vue("Page d'un métier", async () => { await p.evaluate(() => { const g = window.__eclat; g.U.atelierSel = "artisanat"; g.U.prodSel = null; g.render(true); }); });
    await vue("Progression", async () => { await onglet(p, "arbre"); });
    await vue("Carnet", async () => { await onglet(p, "journal"); await p.evaluate(() => window.__eclat.setTab("carnet")); });
    await vue("Journal", async () => { await p.evaluate(() => window.__eclat.setTab("journal")); });
    for (const [nom, racine] of [["bandeau", "#top"], ["barre d'onglets", "#tabs"]]) {
      const m = await verifie(p, racine, t + " " + nom); pire[nom] = Math.min(pire[nom] || 99, m);
    }
    /* une fiche */
    await p.evaluate(() => window.__eclat.setTab("carnet")); await p.waitForTimeout(400);
    await p.evaluate(() => document.querySelector("#v-carnet .rec-tile").click()); await p.waitForTimeout(500);
    ok(await p.locator(".modal:not(.hidden) .rwin").count() === 1, t + " : la fiche s'ouvre");
    { const m = await verifie(p, ".modal:not(.hidden) .modal-box", t + " fiche"); pire["Fiche"] = Math.min(pire["Fiche"] || 99, m); }
    await p.evaluate(() => window.__eclat.closeModal()); await p.waitForTimeout(300);
    /* un toast */
    await p.evaluate(() => window.__eclat.toast("Une trouvaille : de quoi lire, en toute lisibilité.")); await p.waitForTimeout(350);
    { const m = await verifie(p, "#toasts > *:last-child", t + " toast"); pire["Toast"] = Math.min(pire["Toast"] || 99, m); }
    /* le Menu, onglets Jeu puis Affichage */
    await p.locator("#menuBtn").click(); await p.waitForTimeout(450);
    await p.evaluate(() => { document.querySelectorAll("#toasts > *").forEach((e) => e.remove()); });
    { const m = await verifie(p, ".modal:not(.hidden) .modal-box", t + " Menu (Jeu)"); pire["Menu"] = Math.min(pire["Menu"] || 99, m); }
    await p.locator('.modal:not(.hidden) .m-nav-tab').filter({ hasText: "Affichage" }).first().click(); await p.waitForTimeout(250);
    { const m = await verifie(p, ".modal:not(.hidden) .modal-box", t + " Menu (Affichage)"); pire["Menu"] = Math.min(pire["Menu"] || 99, m); }
    ok(errors.length === 0, t + " : aucune erreur de page (" + errors.join(" ; ") + ")");
    await ctx.close();
  }
  console.log("Contraste le plus bas par écran (sur les cinq tailles) :");
  for (const [k, v] of Object.entries(pire)) console.log("  " + k.padEnd(18) + v.toFixed(2) + ":1");
  console.log("✓ thème sombre : " + checks + " vérifications");
}
run().then(() => { browser && browser.close(); server.close(); }, (e) => { console.error(e); browser && browser.close(); server.close(); process.exit(1); });
