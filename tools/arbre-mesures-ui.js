#!/usr/bin/env node
/* Mesures de la vue « Arbre » dans un vrai navigateur (la partie de tools/arbre-mesures.js qui demande Chromium).
 *   PW=chemin/vers/playwright node tools/arbre-mesures-ui.js [--json] [--ecrire]
 * CHROMIUM=chemin du navigateur (facultatif) ; ARBRE_SHOTS=dossier des captures (facultatif, à ne pas ajouter au dépôt).
 * Serveur local sur un port libre, profils jetables, aucune partie personnelle (comme tools/test-ux.js).
 * Pour chaque taille d’écran (390 × 844 et 320 × 568), avec la sauvegarde avancée : surface utile de l’arbre,
 * nœuds entièrement dans la vue à l’échelle d’ouverture, plus petite police et plus petite cible,
 * en tenant compte du facteur de zoom (une étiquette de 10,5 px à l’échelle 0,6 se lit à 6,3 px). */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http");
const ROOT = path.resolve(__dirname, "..");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");
let chromium;
try { ({ chromium } = require(process.env.PW || "playwright")); }
catch (e) { console.error("Playwright introuvable : indique son chemin avec PW=... (ou installe-le). Cette partie est ignorée."); process.exit(2); }

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".woff2": "font/woff2", ".png": "image/png", ".json": "application/json", ".webmanifest": "application/manifest+json" };
const server = http.createServer((req, res) => {
  const file = path.resolve(ROOT, "." + new URL(req.url, "http://localhost").pathname.replace(/\/$/, "/index.html"));
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => { if (err) { res.writeHead(404).end(); return; } res.setHeader("Content-Type", MIME[path.extname(file)] || "application/octet-stream"); res.end(data); });
});

function save() { // les mêmes réglages que save(true, false) dans tools/test-ux.js
  const E = createEngine();
  E.load(fs.readFileSync(path.join(ROOT, "tools/fixtures/save-v5-age8-usine.json"), "utf8"));
  const st = E.state;
  st.t = Date.now(); st.introSeen = true; st.flags.ver = D.VERSION;
  Object.assign(st.settings, { tuto: false, sound: false, visiteurs: false, largeText: false, theme: "light" });
  return E.serialize();
}

async function mesurer(browser, largeur) {
  const hauteur = largeur === 320 ? 568 : 844;
  const ctx = await browser.newContext({ viewport: { width: largeur, height: hauteur }, hasTouch: true, serviceWorkers: "block" });
  const p = await ctx.newPage();
  const erreurs = [];
  p.on("pageerror", (e) => erreurs.push(e.message));
  p.on("console", (m) => { if (m.type() === "error") erreurs.push(m.text()); });
  await p.addInitScript((raw) => { localStorage.setItem("eclat.save.v1", raw); }, save());
  await p.goto("http://127.0.0.1:" + server.address().port);
  await p.waitForFunction(() => !!window.__eclat);
  for (let i = 0; i < 12; i++) {
    await p.waitForTimeout(150);
    if (await p.locator("#modal").evaluate((e) => e.classList.contains("hidden"))) break;
    await p.evaluate(() => window.__eclat.closeModal());
  }
  await p.waitForFunction(() => !document.querySelector("#app").inert);
  await p.locator('#tabs [data-tab="carnet"]').click();
  await p.locator('[data-cvue="arbre"]').click();
  await p.locator("#arbre").waitFor({ state: "visible" });
  await p.waitForTimeout(700); // la vue se centre
  const r = await p.evaluate(() => {
    const vue = document.querySelector(".arb-vue"), monde = vue.querySelector(".arb-monde");
    const vr = vue.getBoundingClientRect();
    const m = getComputedStyle(monde).transform.match(/matrix\(([^)]+)\)/);
    const k = m ? Number(m[1].split(",")[0]) : 1;
    const dedans = (r) => r.left >= vr.left - 0.5 && r.right <= vr.right + 0.5 && r.top >= vr.top - 0.5 && r.bottom <= vr.bottom + 0.5;
    const noeuds = [...vue.querySelectorAll(".arb-n")];
    const visibles = noeuds.filter((n) => dedans(n.getBoundingClientRect())).length;
    const etiquettes = [...vue.querySelectorAll(".arb-l")].map((e) => parseFloat(getComputedStyle(e).fontSize) * k);
    const ages = [...vue.querySelectorAll(".arb-age")].map((e) => parseFloat(getComputedStyle(e).fontSize) * k);
    const cibles = [...vue.querySelectorAll(".arb-n"), ...document.querySelectorAll(".arb-tete .btn, .arb-bascule button")]
      .map((e) => { const r = e.getBoundingClientRect(); return { n: Math.round(Math.min(r.width, r.height) * 10) / 10, c: (e.className || e.tagName).toString().slice(0, 30), vu: r.width > 0 }; })
      .filter((c) => c.vu);
    const entete = document.getElementById("top").getBoundingClientRect().bottom;
    const barre = document.getElementById("tabs").getBoundingClientRect().top;
    const nb = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().height) : null; };
    return {
      ecran: innerHeight, surfaceUtile: Math.round(vr.height), partEcran: Math.round(1000 * vr.height / innerHeight) / 10,
      largeurVue: Math.round(vr.width), echelle: Math.round(k * 100) / 100,
      noeudsTotal: noeuds.length, noeudsDansLaVue: visibles,
      policeEtiquetteMin: Math.round(Math.min(...etiquettes) * 10) / 10, policeAgeMin: ages.length ? Math.round(Math.min(...ages) * 10) / 10 : null,
      cibleMin: Math.min(...cibles.map((c) => c.n)), cibleMinNom: cibles.sort((a, b) => a.n - b.n)[0].c,
      cibles44: cibles.filter((c) => c.n < 43.9).length,
      bandeEcran: Math.round(barre - entete), hauteurEntete: Math.round(entete), hauteurTete: nb(".arb-tete"), hauteurBascule: nb(".arb-bascule")
    };
  });
  if (process.env.ARBRE_SHOTS) {
    fs.mkdirSync(process.env.ARBRE_SHOTS, { recursive: true });
    await p.screenshot({ path: path.join(process.env.ARBRE_SHOTS, "arbre-" + largeur + "x" + hauteur + ".png") });
  }
  r.erreursConsole = erreurs.length;
  await ctx.close();
  return Object.assign({ taille: largeur + "×" + hauteur }, r);
}

(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const res = [];
  try { for (const l of [390, 320]) res.push(await mesurer(browser, l)); }
  finally { await browser.close(); server.close(); }
  if (process.argv.includes("--json")) { console.log(JSON.stringify({ version: D.VERSION, ecrans: res }, null, 2)); return; }
  const noms = res.map((r) => r.taille);
  const l = [];
  l.push("| Mesure dans le navigateur | " + noms.join(" | ") + " |", "|---|" + noms.map(() => "---:").join("|") + "|");
  const ligne = (nom, f) => l.push("| " + nom + " | " + res.map(f).join(" | ") + " |");
  ligne("Surface utile de l’arbre (`.arb-vue`, px)", (r) => r.surfaceUtile + " sur " + r.ecran + " (" + r.partEcran + " %)");
  ligne("Bande libre entre l’en-tête et les onglets (px)", (r) => r.bandeEcran);
  ligne("Titre, interrupteur et compteur au-dessus (px)", (r) => (r.hauteurBascule || 0) + " + " + (r.hauteurTete || 0));
  ligne("Échelle à l’ouverture", (r) => r.echelle);
  ligne("Nœuds entièrement dans la vue / dans l’arbre", (r) => r.noeudsDansLaVue + " / " + r.noeudsTotal);
  ligne("Plus petite police d’étiquette, à l’écran (px)", (r) => r.policeEtiquetteMin);
  ligne("Plus petite police de nom d’âge, à l’écran (px)", (r) => r.policeAgeMin);
  ligne("Plus petite cible (px) et laquelle", (r) => r.cibleMin + " (" + r.cibleMinNom + ")");
  ligne("Cibles de moins de 44 px", (r) => r.cibles44);
  ligne("Erreurs de console", (r) => r.erreursConsole);
  const md = l.join("\n");
  if (process.argv.includes("--ecrire")) {
    const f = path.join(ROOT, "docs/revue/arbre-mesures.md");
    const DEB = "<!-- mesures-ui:debut -->", FIN = "<!-- mesures-ui:fin -->";
    let t = fs.existsSync(f) ? fs.readFileSync(f, "utf8") : "";
    const bloc = DEB + "\n" + md + "\n" + FIN;
    if (t.includes(DEB)) t = t.replace(new RegExp(DEB + "[\\s\\S]*?" + FIN), bloc);
    else t = t.replace(/\s*$/, "\n\n## Dans le navigateur\n\nChromium, sauvegarde `tools/fixtures/save-v5-age8-usine.json`, Carnet puis Arbre, à l’échelle d’ouverture (`node tools/arbre-mesures-ui.js --ecrire`).\n\n" + bloc + "\n");
    fs.writeFileSync(f, t);
    console.log("écrit : docs/revue/arbre-mesures.md");
    return;
  }
  console.log(md);
})().catch((e) => { console.error(e); process.exit(1); });
