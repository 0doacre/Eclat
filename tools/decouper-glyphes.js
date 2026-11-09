#!/usr/bin/env node
/* Découpe assets/planches/planche-glyphes.png (grille 6 × 4, noir sur blanc) en masques PNG 128 px : assets/glyphes/<id>.png.
 *   PW=<dossier>/node_modules/playwright node tools/decouper-glyphes.js [--ecrire]
 * Le noir devient l'opacité : le jeu colore le glyphe avec la couleur du texte (voir gi("g:<id>") dans js/ui.js).
 * Les ids viennent du tableau « 4. Planche de glyphes » de docs/art-direction/assets-manquants-v1/PROMPTS.md. */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http");
const { chromium } = require(process.env.PW || "playwright");
const ROOT = path.resolve(__dirname, "..");
const ECRIRE = process.argv.includes("--ecrire");
const md = fs.readFileSync(path.join(ROOT, "docs/art-direction/assets-manquants-v1/PROMPTS.md"), "utf8");
const a = md.indexOf("## 4. Planche de glyphes"), b = md.indexOf("\n## 5", a);
const ids = [...md.slice(a, b).matchAll(/^\| (\d+) \| `([a-z0-9-]+)` \|/gm)].map((m) => m[2]);
if (ids.length !== 24) { console.error("24 ids attendus, trouvé " + ids.length); process.exit(1); }
const png = path.join(ROOT, "assets/planches/planche-glyphes.png");
const server = http.createServer((req, res) => { if (req.url.startsWith("/p")) { res.setHeader("Content-Type", "image/png"); res.end(fs.readFileSync(png)); } else res.end("<!doctype html><title>g</title>"); });
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const br = await chromium.launch(), p = await br.newPage();
  await p.goto("http://127.0.0.1:" + server.address().port + "/");
  const res = await p.evaluate(async (ids) => {
    const img = new Image(); img.src = "/p.png"; await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight, cw = W / 6, ch = H / 4, out = [];
    for (let i = 0; i < ids.length; i++) {
      const cx = Math.round((i % 6) * cw), cy = Math.round(Math.floor(i / 6) * ch), w = Math.round(cw), h = Math.round(ch);
      const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(img, cx, cy, w, h, 0, 0, w, h);
      const d = g.getImageData(0, 0, w, h), px = d.data; let x0 = w, y0 = h, x1 = 0, y1 = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const k = (y * w + x) * 4, lum = (px[k] + px[k + 1] + px[k + 2]) / 3, a = Math.max(0, Math.min(255, Math.round((235 - lum) * 255 / 235)));
        px[k] = px[k + 1] = px[k + 2] = 0; px[k + 3] = a;
        if (a > 90) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      g.putImageData(d, 0, 0);
      const gw = x1 - x0 + 1, gh = y1 - y0 + 1, cote = Math.max(gw, gh), S = Math.round(cote * 1.12);
      const o = document.createElement("canvas"); o.width = o.height = 128; const og = o.getContext("2d"); og.imageSmoothingQuality = "high";
      const k2 = 128 / S; og.drawImage(c, x0, y0, gw, gh, (128 - gw * k2) / 2, (128 - gh * k2) / 2, gw * k2, gh * k2);
      const url = o.toDataURL("image/png");
      out.push({ id: ids[i], gw, gh, b64: url.split(",")[1], vide: gw < 30 || gh < 30 });
    }
    return out;
  }, ids);
  const page = "<body style='margin:0'>" + ["#f1e8d3", "#3b2a1a"].map((c, j) => "<div style='display:grid;grid-template-columns:repeat(12,84px);background:" + c + ";padding:8px;gap:6px'>" + res.map((r) => "<span style='width:76px;height:76px;display:inline-block;background:" + (j ? "#f1e8d3" : "#3b2a1a") + ";-webkit-mask:url(data:image/png;base64," + r.b64 + ") center/contain no-repeat;mask:url(data:image/png;base64," + r.b64 + ") center/contain no-repeat'></span>").join("") + "</div>").join("") +
    "<div style='display:flex;gap:10px;padding:8px;background:#f1e8d3;align-items:center'>" + res.map((r) => "<span style='width:24px;height:24px;display:inline-block;background:#3b2a1a;-webkit-mask:url(data:image/png;base64," + r.b64 + ") center/contain no-repeat;mask:url(data:image/png;base64," + r.b64 + ") center/contain no-repeat'></span>").join("") + "</div>";
  await p.setViewportSize({ width: 1040, height: 360 }); await p.setContent(page); await p.waitForTimeout(300);
  const ctrl = path.join(process.env.TEMP || ".", "controle-glyphes.png");
  await p.screenshot({ path: ctrl, fullPage: true });
  await br.close(); server.close();
  res.forEach((r) => console.log((r.vide ? "VIDE " : "ok   ") + r.id.padEnd(18) + r.gw + "×" + r.gh));
  console.log("feuille de contrôle : " + ctrl);
  if (!ECRIRE) return;
  const dir = path.join(ROOT, "assets/glyphes"); fs.mkdirSync(dir, { recursive: true });
  res.forEach((r) => fs.writeFileSync(path.join(dir, r.id + ".png"), Buffer.from(r.b64, "base64")));
  let sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
  const ajout = res.filter((r) => !sw.includes('"assets/glyphes/' + r.id + '.png"'));
  if (ajout.length) { sw = sw.replace('"assets/icons.svg",', '"assets/icons.svg", ' + ajout.map((r) => '"assets/glyphes/' + r.id + '.png"').join(", ") + ","); fs.writeFileSync(path.join(ROOT, "sw.js"), sw); }
  console.log(res.length + " glyphes écrits, " + ajout.length + " ajoutés à sw.js. Lance « node tools/build.js ».");
})().catch((e) => { console.error(e.message); process.exit(1); });
