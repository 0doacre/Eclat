#!/usr/bin/env node
/* Découpe une planche d'objets (grille 4 × 4, fond vert chroma) en illustrations WebP 256 px.
 *   PW=<dossier>/node_modules/playwright node tools/decouper-planche.js <numéro> [--ecrire]
 * Lit assets/planches/planche-NN.png et la table de la planche NN dans docs/art-direction/assets-manquants-v1/PROMPTS.md (case → id).
 * Sans --ecrire : montre seulement une feuille de contrôle (<TEMP>/controle-NN.png). Avec --ecrire : écrit assets/carnet/items/<id>.webp,
 * les déclare dans js/illustrations.js et sw.js. Le détourage retire le vert et le « déborde » sur les contours (despill). */
"use strict";
const fs = require("fs"), path = require("path"), http = require("http");
const { chromium } = require(process.env.PW || "playwright");
const ROOT = path.resolve(__dirname, "..");
const num = String(process.argv[2] || "").padStart(2, "0"), ECRIRE = process.argv.includes("--ecrire");
if (!+num) { console.error("usage : decouper-planche.js <numéro> [--ecrire]"); process.exit(1); }
const png = path.join(ROOT, "assets/planches/planche-" + num + ".png");
if (!fs.existsSync(png)) { console.error("planche absente : " + png); process.exit(1); }
const md = fs.readFileSync(path.join(ROOT, "docs/art-direction/assets-manquants-v1/PROMPTS.md"), "utf8");
const debut = md.indexOf("### Planche " + +num + " /");
if (debut < 0) { console.error("planche " + +num + " absente du document"); process.exit(1); }
const finBloc = [md.indexOf("\n### ", debut + 5), md.indexOf("\n## ", debut + 5)].filter((i) => i > 0);
const bloc = md.slice(debut, finBloc.length ? Math.min(...finBloc) : undefined); // jusqu’à la planche ou la section suivante
const ids = [...bloc.matchAll(/^\| (\d+) \| `([a-z0-9_]+)` \|/gm)].map((m) => m[2]);
if (!ids.length) { console.error("aucun id trouvé"); process.exit(1); }
const NB = 4, CASE = 640;
const server = http.createServer((req, res) => { if (req.url.startsWith("/p")) { res.setHeader("Content-Type", "image/png"); res.end(fs.readFileSync(png)); } else res.end("<!doctype html><title>d</title>"); });
(async () => {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const b = await chromium.launch(), p = await b.newPage();
  await p.goto("http://127.0.0.1:" + server.address().port + "/");
  const res = await p.evaluate(async ({ ids, NB, CASE }) => {
    const img = new Image(); img.src = "/p.png"; await img.decode();
    const out = [];
    for (let i = 0; i < ids.length; i++) {
      const cx = (i % NB) * CASE, cy = Math.floor(i / NB) * CASE;
      const c = document.createElement("canvas"); c.width = c.height = CASE; const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(img, cx, cy, CASE, CASE, 0, 0, CASE, CASE);
      const d = g.getImageData(0, 0, CASE, CASE), px = d.data;
      let x0 = CASE, y0 = CASE, x1 = 0, y1 = 0, bord = 0;
      for (let y = 0; y < CASE; y++) for (let x = 0; x < CASE; x++) {
        const k = (y * CASE + x) * 4, r = px[k], gr = px[k + 1], bl = px[k + 2];
        const exces = gr - Math.max(r, bl);          // à quel point le pixel est « plus vert que le reste »
        let a = 255;
        if (exces > 60) a = 0;                        // fond
        else if (exces > 20) { a = Math.round(255 * (60 - exces) / 40); px[k + 1] = Math.min(gr, Math.max(r, bl) + 8); } // bord : on adoucit et on retire le vert
        else if (exces > 6) px[k + 1] = Math.max(r, bl) + 2;                                                                // despill léger
        px[k + 3] = a;
        /* la boîte englobante est calculée après le tri des îlots (voir plus bas) */
      }
      // îlots : on garde les composantes assez grosses (8-connexité) et on efface les petites traces isolées
      { const N = CASE * CASE, lab = new Int32Array(N).fill(-1), aire = [], bords = [], boites = [], file = new Int32Array(N); let nl = 0, total = 0;
        for (let s = 0; s < N; s++) { if (lab[s] >= 0 || px[s * 4 + 3] <= 40) continue; let h = 0, t = 0, n = 0, touche = false, bx0 = CASE, by0 = CASE, bx1 = 0, by1 = 0; file[t++] = s; lab[s] = nl;
          while (h < t) { const q = file[h++]; n++; const qx = q % CASE, qy = (q - qx) / CASE; if (qx < 4 || qy < 4 || qx > CASE - 5 || qy > CASE - 5) touche = true; if (qx < bx0) bx0 = qx; if (qx > bx1) bx1 = qx; if (qy < by0) by0 = qy; if (qy > by1) by1 = qy;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const nx = qx + dx, ny = qy + dy; if (nx < 0 || ny < 0 || nx >= CASE || ny >= CASE) continue; const nq = ny * CASE + nx; if (lab[nq] < 0 && px[nq * 4 + 3] > 40) { lab[nq] = nl; file[t++] = nq; } } }
          aire.push(n); bords.push(touche); boites.push([bx0, by0, bx1, by1]); total += n; nl++; }
        const seuil = Math.max(60, total * 0.004), plusGros = aire.indexOf(Math.max(...aire)), gros = aire.map((n, i3) => n >= seuil && (!bords[i3] || i3 === plusGros)); const B = boites[plusGros]; aire.forEach((n, i3) => { if (i3 === plusGros || !gros[i3] || n > aire[plusGros] * 0.04) return; const b2 = boites[i3], ecartX = Math.max(0, B[0] - b2[2], b2[0] - B[2]), ecartY = Math.max(0, B[1] - b2[3], b2[1] - B[3]); if (Math.max(ecartX, ecartY) > 18) gros[i3] = false; }); // une petite trace loin de l’objet n’en fait pas partie // une trace qui touche le bord de la case vient de l’objet voisin
        for (let i2 = 0; i2 < N; i2++) { const l = lab[i2]; if (l >= 0 && !gros[l]) px[i2 * 4 + 3] = 0; else if (l >= 0) { const x = i2 % CASE, y = (i2 - x) / CASE; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (x < 3 || y < 3 || x > CASE - 4 || y > CASE - 4) bord++; } } }
      g.putImageData(d, 0, 0);
      const w = x1 - x0 + 1, h = y1 - y0 + 1, cote = Math.max(w, h), m = Math.round(cote * 0.06), S = cote + 2 * m;
      const o = document.createElement("canvas"); o.width = o.height = 256; const og = o.getContext("2d");
      og.imageSmoothingQuality = "high";
      og.drawImage(c, x0, y0, w, h, Math.round((256 - (w / S) * 256) / 2), Math.round((256 - (h / S) * 256) / 2), (w / S) * 256, (h / S) * 256);
      const blob = await new Promise((r) => o.toBlob(r, "image/webp", 0.88));
      const buf = new Uint8Array(await blob.arrayBuffer());
      let bin = ""; for (let k = 0; k < buf.length; k++) bin += String.fromCharCode(buf[k]);
      out.push({ id: ids[i], w, h, bord, ko: Math.round(buf.length / 1024 * 10) / 10, b64: btoa(bin), vide: w < 40 || h < 40 });
    }
    return out;
  }, { ids, NB, CASE });
  // feuille de contrôle : les 16 résultats sur trois fonds (clair, brun, vert) pour voir les franges
  const rows = res.map((r) => "<td style='width:128px;height:128px'><img src='data:image/webp;base64," + r.b64 + "' width=128></td>").join("");
  const page = "<body style='margin:0'>" + [["#f1e8d3"], ["#6b4f35"], ["#00ff00"]].map(([c]) => "<div style='display:grid;grid-template-columns:repeat(8,128px);background:" + c + "'>" + res.map((r) => "<img src='data:image/webp;base64," + r.b64 + "' width=128>").join("") + "</div>").join("");
  await p.setViewportSize({ width: 1024, height: 128 * Math.ceil(res.length / 8) * 3 });
  await p.setContent(page); await p.waitForTimeout(300);
  const ctrl = path.join(process.env.TEMP || ".", "controle-" + num + ".png");
  await p.screenshot({ path: ctrl, fullPage: true });
  await b.close(); server.close();
  res.forEach((r) => console.log((r.vide ? "VIDE " : r.bord ? "BORD " : "ok   ") + r.id.padEnd(20) + r.w + "×" + r.h + "  " + r.ko + " Ko" + (r.bord ? "  (touche le bord de sa case : " + r.bord + " px)" : "")));
  console.log("feuille de contrôle : " + ctrl);
  if (!ECRIRE) return;
  const dir = path.join(ROOT, "assets/carnet/items");
  res.forEach((r) => fs.writeFileSync(path.join(dir, r.id + ".webp"), Buffer.from(r.b64, "base64")));
  // déclaration : js/illustrations.js (table ITEMS) et sw.js (liste FILES)
  let js = fs.readFileSync(path.join(ROOT, "js/illustrations.js"), "utf8");
  const nouveaux = res.filter((r) => !js.includes('"assets/carnet/items/' + r.id + '.webp"'));
  if (nouveaux.length) {
    let fin = js.indexOf("\n  };", js.indexOf("const ITEMS = {"));
    if (!/,\s*$/.test(js.slice(0, fin))) { js = js.slice(0, fin) + "," + js.slice(fin); fin += 1; } // la dernière entrée peut n’avoir pas de virgule
    js = js.slice(0, fin) + nouveaux.map((r) => "\n    " + r.id + ': "assets/carnet/items/' + r.id + '.webp",').join("") + js.slice(fin);
    fs.writeFileSync(path.join(ROOT, "js/illustrations.js"), js);
  }
  let sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
  const ajout = res.filter((r) => !sw.includes('"assets/carnet/items/' + r.id + '.webp"'));
  if (ajout.length) { sw = sw.replace('"assets/carnet/items/argile.webp",', ajout.map((r) => '"assets/carnet/items/' + r.id + '.webp", ').join("") + '"assets/carnet/items/argile.webp",'); fs.writeFileSync(path.join(ROOT, "sw.js"), sw); }
  console.log(res.length + " illustrations écrites, " + nouveaux.length + " déclarées dans illustrations.js, " + ajout.length + " dans sw.js. Lance « node tools/build.js ».");
})().catch((e) => { console.error(e.message); process.exit(1); });
