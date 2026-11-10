#!/usr/bin/env node
/* Génère les icônes de l'application à partir de assets/icon-source.png (1024 × 1024, plein cadre) :
 *   icons/icon-192.png, icons/icon-512.png, et icons/icon.svg (le PNG 128 px intégré, pour l'onglet du navigateur).
 *   PW=<dossier>/node_modules/playwright node tools/icones-app.js */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http");
const { chromium } = require(process.env.PW || "playwright");
const ROOT = path.resolve(__dirname, "..");
const src = path.join(ROOT, "assets/icon-source.png");
const server = http.createServer((req, res) => { if (req.url.startsWith("/p")) { res.setHeader("Content-Type", "image/png"); res.end(fs.readFileSync(src)); } else res.end("<!doctype html><title>i</title>"); });
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const b = await chromium.launch(), p = await b.newPage();
  await p.goto("http://127.0.0.1:" + server.address().port + "/");
  const out = await p.evaluate(async () => {
    const img = new Image(); img.src = "/p.png"; await img.decode();
    const faire = (n) => { const c = document.createElement("canvas"); c.width = c.height = n; const g = c.getContext("2d"); g.imageSmoothingQuality = "high"; g.drawImage(img, 0, 0, n, n); return c.toDataURL("image/png").split(",")[1]; };
    return { 192: faire(192), 512: faire(512), 128: faire(128) };
  });
  fs.writeFileSync(path.join(ROOT, "icons/icon-192.png"), Buffer.from(out[192], "base64"));
  fs.writeFileSync(path.join(ROOT, "icons/icon-512.png"), Buffer.from(out[512], "base64"));
  fs.writeFileSync(path.join(ROOT, "icons/icon.svg"), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><image width="128" height="128" href="data:image/png;base64,' + out[128] + '"/></svg>\n');
  await b.close(); server.close();
  console.log("icônes écrites : 192, 512 et icon.svg");
})().catch((e) => { console.error(e.message); process.exit(1); });
