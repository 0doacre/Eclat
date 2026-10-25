/* ÉCLAT — l’inventaire des boutons de l’interface, dans un vrai navigateur.
 *
 *   node tools/boutons.js                        (Playwright + Firefox requis)
 *   BROWSER=chromium node tools/boutons.js       (avec Chromium)
 *
 * Ouvre le jeu à 390×844, service worker bloqué, deux parties : une neuve et une avancée
 * (tools/fixtures/save-v5-age8-usine.json), puis repasse la partie avancée à 900×900 pour le
 * Carnet à deux colonnes. Il parcourt le Domaine, la Carte, l’Atelier et ses pages, le Carnet,
 * l’Arbre, le Journal et ses neuf onglets, le Cosmos, une fiche, le menu et la fiche d’aide, puis écrit :
 *   docs/boutons.md    le tableau, groupé par écran
 *   docs/boutons.json  la même liste, pour tools/test-boutons.js
 * Une ligne par bouton : l’écran, le libellé, le repère (data-*, classe), et ce qui
 * l’explique (info-bulle, chapitre du guide, fiche d’aide, ou rien).
 *
 * Le fichier .md est généré : ne pas le corriger à la main, relancer l’outil. */
const fs = require("fs");
const http = require("http");
const path = require("path");
const PW = require(process.env.PW || "playwright");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 8781);
const SAVE = process.env.SAVE || "tools/fixtures/save-v5-age8-usine.json";
const BROWSER = process.env.BROWSER || "firefox";
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };

function serve() {
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      const url = decodeURIComponent(req.url.split("?")[0]);
      const f = path.join(ROOT, url === "/" ? "index.html" : url);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { "Content-Type": MIME[path.extname(f)] || "application/octet-stream" });
      fs.createReadStream(f).pipe(res);
    });
    s.listen(PORT, "127.0.0.1", () => resolve(s));
  });
}

/* les repères que le guide éclaire : les sélecteurs écrits dans les « at: » de js/tuto.js */
function tutoSels() {
  const src = fs.readFileSync(path.join(ROOT, "js/tuto.js"), "utf8");
  const out = new Set();
  for (const m of src.matchAll(/at:\s*/g)) {
    const suite = src.slice(m.index + m[0].length);
    const fin = suite.search(/\n\s{8,}(?:text|done|next|dim|modal|back|alt|go|free|choices|tab|end|still)\s*:/);
    const expr = fin >= 0 ? suite.slice(0, fin) : suite.slice(0, 300);
    for (const q of expr.matchAll(/(["'])((?:\\.|(?!\1).)*)\1/g)) {
      if (q[2].length > 1 && /^[#.[]/.test(q[2])) out.add(q[2]);
    }
  }
  return [...out];
}

/* ferme ce qui s’ouvre au chargement (l’introduction, une fête) : par le bouton de la fenêtre */
async function dismiss(p) {
  // les fenêtres de retour s’enchaînent : on les ferme jusqu’à ce que le jeu soit à découvert
  for (let i = 0; i < 24; i++) {
    const open = await p.evaluate(() => !!document.querySelector("#modal:not(.hidden)"));
    if (!open) {
      await p.waitForTimeout(220);
      if (!(await p.evaluate(() => !!document.querySelector("#modal:not(.hidden)")))) return;
      continue;
    }
    await p.evaluate(() => { const m = document.querySelector("#modal:not(.hidden)"); const bs = [...m.querySelectorAll(".modal-box button")]; const b = bs.reverse().find((x) => /fermer|compris|continuer|ok|passer/i.test(x.innerText)) || bs[0]; if (b) b.click(); });
    await p.waitForTimeout(320);
  }
}

/* ouvre la fiche d’aide et la laisse ouverte : son texte sert à reconnaître un mot déjà
 * expliqué, ses boutons se relèvent comme ceux d’un écran */
async function ouvrirAide(p) {
  await dismiss(p);
  await p.evaluate(() => document.querySelector("#menuBtn").click());
  await p.waitForTimeout(300);
  const b = await p.$('[data-m="help"]');
  if (!b) { await p.keyboard.press("Escape"); await p.waitForTimeout(200); return false; }
  await b.evaluate((x) => x.click());
  await p.waitForTimeout(400);
  return true;
}
const aideTexte = (p) => p.evaluate(() => { const m = document.querySelector("#modal:not(.hidden) .modal-box"); return m ? m.innerText : ""; });

/* un seul aller-retour par écran : la liste des boutons, avec ce qui les explique */
const COLLECT = ([sels, aide]) => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const sig = (el) => {
    const parts = [el.tagName.toLowerCase()];
    if (el.id) parts.push("#" + el.id);
    for (const a of el.attributes) if (a.name.startsWith("data-")) parts.push("[" + a.name + "=\"" + a.value.slice(0, 24) + "\"]");
    const c = [...el.classList].filter((x) => !/^(on|off|hidden|pri|small|nope|lack|sel|cur|open|up|pop)$/.test(x)).slice(0, 2);
    if (c.length) parts.push("." + c.join("."));
    return parts.join("");
  };
  /* le même bouton répété dans chaque recette : une seule ligne, avec le nombre d’exemplaires */
  const GARDE = /^(data-m|data-t|data-tab|data-tab2|data-ct|data-jt|data-g|data-if|data-cf|data-cvue|data-slot|data-n|data-x|data-arb)$/;
  /* data-n d’un bouton de vente porte une quantité calculée, différente à chaque relevé :
   * on ne le garde que s’il dit une taille de lot (×10, ×50, Max…) */
  const famille = (el, repere) => repere.replace(/\[([^\]=]+)="([^"]*)"\]/g, (x, nom, val) =>
    nom === "data-n" && !/^(1|10|50|100|1000|max)$/.test(val) ? "[data-n]" : GARDE.test(nom) ? x : "[" + nom + "]");
  const out = [];
  // dans une fenêtre, on ne relève qu’elle : le fond est recouvert
  const box = document.querySelector("#modal:not(.hidden) .modal-box");
  const scope = box || document;
  for (const el of scope.querySelectorAll("button, a, [role=button], summary, [data-cl], select")) {
    if (el.closest(".tuto") || el.id === "tutoMini") continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    // un lieu de la carte est un <g> : son nom est dans un <title>, pas dans le texte
    const svg = el.namespaceURI === "http://www.w3.org/2000/svg";
    const label = svg ? "" : norm(el.innerText || el.textContent || "");
    const svgTitre = svg ? Array.from(el.children).find((c) => c.tagName.toLowerCase() === "title") : null;
    const title = norm(el.getAttribute("title") || (svgTitre && svgTitre.textContent));
    const aria = norm(el.getAttribute("aria-label"));
    const key = (label || aria).toLowerCase();
    const expl = [];
    // une info-bulle qui répète le mot du bouton n’explique rien
    if (title && (!label || title.toLowerCase() !== key)) expl.push("info-bulle : " + title);
    if (aria && aria.length > 3 && (!label || aria.toLowerCase() !== key)) expl.push("lecteur d’écran : " + aria);
    for (const s of sels) {
      try {
        if (el.matches(s) || (/^[#.]/.test(s) && el.closest(s))) { expl.push("guide (" + s + ")"); break; }
      } catch (e) { }
    }
    const mot = (label || aria).toLowerCase();
    if (!expl.length && mot.length > 3) {
      const esc2 = mot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp("(^|[^a-zà-ÿ])" + esc2 + "([^a-zà-ÿ]|$)").test(aide)) expl.push("fiche Aide");
    }
    const repere = sig(el);
    out.push({ label: label || "(sans mot)", repere, famille: famille(el, repere), explique: expl.length ? expl.join(" ; ") : "rien", tag: el.tagName.toLowerCase() });
  }
  return out;
};

(async () => {
  const srv = await serve();
  const URL = "http://127.0.0.1:" + PORT + "/index.html";
  const browser = await PW[BROWSER].launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const sels = tutoSels();
  const rows = [];
  const seen = new Set();

  for (const [partie, fixture, larg, haut] of [["neuve", null, 390, 844], ["avancée", SAVE, 390, 844], ["avancée", SAVE, 900, 900]]) {
    const ctx = await browser.newContext({ viewport: { width: larg, height: haut }, serviceWorkers: "block", hasTouch: true });
    const p = await ctx.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(e.message));
    if (fixture) {
      const o = JSON.parse(fs.readFileSync(path.join(ROOT, fixture), "utf8"));
      o.introSeen = true;
      o.settings = Object.assign(o.settings || {}, { tuto: false });
      o.flags = Object.assign(o.flags || {}, { ver: require(path.join(ROOT, "package.json")).version, news: null });
      o.t = Date.now();
      await p.addInitScript((s) => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("eclat.save.v1", s); sessionStorage.setItem("seeded", "1"); } }, JSON.stringify(o));
    }
    await p.goto(URL);
    await p.waitForTimeout(1200);
    await dismiss(p);

    const grab = async (ecran) => {
      const list = await p.evaluate(COLLECT, [sels, aide]);
      for (const it of list) {
        const key = partie + "|" + it.famille;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({ partie, ecran, n: 1, ...it });
      }
    };
    const clic = async (sel, garder) => {
      await dismiss(p); // une fenêtre de retour peut recouvrir l’écran
      const b = await p.$(sel);
      if (!b || !(await b.isVisible())) return false;
      await b.evaluate((x) => x.click());
      await p.waitForTimeout(650);
      if (!garder) await dismiss(p);
      return true;
    };
    /* une page de l’Atelier : un onglet à part (le Carnet) ou une bascule dans la page (les Machines) */
    const sousPage = async (nom) => (await clic('[data-tab="' + nom + '"]')) || (await clic('[data-tab2="' + nom + '"]'));

    // la fiche d’aide : son texte d’abord, ses boutons ensuite
    const aideOuverte = await ouvrirAide(p);
    const aide = aideOuverte ? (await aideTexte(p)).toLowerCase() : "";
    if (aideOuverte) { await grab("Aide"); await p.keyboard.press("Escape"); await p.waitForTimeout(250); }
    await dismiss(p);

    await grab("Domaine");
    // le Comptoir : ses onglets et sa boutique
    if (await clic("[data-comptoir]", true)) {
      await p.waitForTimeout(500); await grab("Comptoir");
      await p.keyboard.press("Escape"); await p.waitForTimeout(250);
    }
    if (await clic('#tabs [data-tab="carte"]')) {
      await p.waitForTimeout(400); await grab("Carte");
      // un lieu de la carte : sa fenêtre, avec « Fouiller de nouveau »
      if (await p.evaluate(() => { const e = document.querySelector("[data-cl]"); if (!e) return false; e.dispatchEvent(new MouseEvent("click", { bubbles: true })); return true; })) {
        await p.waitForTimeout(500); await grab("Lieu"); await p.keyboard.press("Escape"); await p.waitForTimeout(250);
      }
      await p.keyboard.press("Escape"); await p.waitForTimeout(200);
    }
    if (await clic('#tabs [data-tab="atelier"]')) {
      await grab("Atelier");
      // le tri et les filtres des ressources se rangent derrière « Filtres »
      if (await clic("[data-filtres]")) { await p.waitForTimeout(350); await grab("Atelier · filtres"); }
      if (await sousPage("machines")) { await grab("Machines"); await clic('#tabs [data-tab="atelier"]'); }
    }
    if (await clic('#tabs [data-tab="arbre"]')) {
      await p.waitForTimeout(500); await grab("Arbre");
      // une recette de l’arbre : sa branche
      if (await p.evaluate(() => { const e = document.querySelector("[data-arbsel]"); if (!e) return false; e.click(); return true; })) {
        await p.waitForTimeout(500); await grab("Arbre · une branche"); await clic('[data-arb="ensemble"]'); await p.waitForTimeout(350);
      }
    }
    if (await clic('#tabs [data-tab="carnet"]')) { await p.waitForTimeout(400); await grab("Carnet"); }
    if (await clic('#tabs [data-tab="journal"]')) {
      await grab("Journal");
      // ses neuf onglets : chacun peut cacher un bouton
      for (const k of ["fragments", "livre", "questions", "signes", "secrets", "flute", "curios", "fins", "stats"]) {
        if (await clic('[data-jt="' + k + '"]')) { await p.waitForTimeout(350); await grab("Journal · " + k); }
      }
      if (await sousPage("cosmos")) { await p.waitForTimeout(500); await grab("Cosmos"); }
    }
    await clic('#tabs [data-tab="domaine"]');
    // une fiche : la pastille d’une recette dans le Carnet
    if (await clic('#tabs [data-tab="carnet"]')) {
      if (await p.evaluate(() => { const e = document.querySelector('#v-carnet [data-goto]'); if (!e) return false; e.click(); return true; })) {
        await p.waitForTimeout(500);
        await grab("Fiche d’un objet");
        await p.keyboard.press("Escape"); await p.waitForTimeout(250);
      }
    }
    await dismiss(p);
    if (await clic("#menuBtn", true)) { await grab("Menu ☰"); }
    await p.keyboard.press("Escape"); await p.waitForTimeout(200);
    for (const e of errs) rows.push({ partie, ecran: "(erreur)", label: e, repere: "", explique: "erreur console", tag: "" });
    await ctx.close();
  }
  await browser.close();
  srv.close();

  const ecrans = [...new Set(rows.map((r) => r.ecran))];
  const esc = (s) => String(s).replace(/\|/g, "\\|");
  const total = rows.length;
  const sans = rows.filter((r) => r.explique === "rien").length;
  const lines = ["# Les boutons de l’interface", "", "Fichier généré par `node tools/boutons.js` (Playwright, " + BROWSER + ", 390×844 puis 900×900 pour le Carnet à deux colonnes, service worker bloqué) : ne pas le corriger à la main, relancer l’outil.", "", "| | |", "|---|---|", "| Boutons relevés | " + total + " |", "| Sans explication | " + sans + " |", "| Écrans | le Domaine, la Carte, l’Atelier et ses pages, le Carnet, l’Arbre, le Journal et ses onglets, le Cosmos, une fiche, le Comptoir, le menu, la fiche d’aide |", "| Parties | une neuve, une avancée (`save-v5-age8-usine`), la même en écran large |", ""];
  for (const e of ecrans) {
    const l = rows.filter((r) => r.ecran === e);
    const s = l.filter((r) => r.explique === "rien").length;
    lines.push("## " + e + " (" + l.length + " boutons, " + s + " sans explication)", "", "| Partie | Bouton | Repère | Expliqué par |", "|---|---|---|---|");
    for (const r of l) lines.push("| " + esc(r.partie) + " | " + esc(r.label) + " | `" + esc(r.repere) + "` | " + esc(r.explique) + " |");
    lines.push("");
  }
  fs.writeFileSync(path.join(ROOT, "docs/boutons.md"), lines.join("\n"));
  fs.writeFileSync(path.join(ROOT, "docs/boutons.json"), JSON.stringify(rows.map(({ partie, ecran, label, repere, explique, tag }) => ({ partie, ecran, label, repere, explique, tag })), null, 1) + "\n");
  console.log(total + " boutons relevés, " + sans + " sans explication. docs/boutons.md écrit.");
})();
