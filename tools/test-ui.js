#!/usr/bin/env node
/* Lance tous les tests d'interface (Chromium, Playwright) l'un après l'autre,
 * continue après un échec et finit par un tableau. Code de sortie non nul
 * s'il reste un rouge.
 *
 *   npm run test:ui                 tous
 *   npm run test:ui -- terres ux    ceux dont le nom contient un des mots
 *   PW=<chemin>/node_modules/playwright CHROMIUM=<chrome> npm run test:ui
 *
 * Un test est « d'interface » s'il charge Playwright. DELAI (secondes, 300
 * par défaut) borne chaque test. */
"use strict";
const fs = require("fs"), path = require("path"), { spawn } = require("child_process");

const ici = __dirname, mots = process.argv.slice(2).filter(a => !a.startsWith("-"));
const delai = (Number(process.env.DELAI) || 300) * 1000;
/* les tests qui écrivent require("playwright") trouvent le même module que ceux qui lisent PW */
const env = process.env.PW ? { ...process.env, NODE_PATH: [path.dirname(process.env.PW), process.env.NODE_PATH].filter(Boolean).join(path.delimiter) } : process.env;
const tous = fs.readdirSync(ici)
  .filter(f => /^test-.*\.js$/.test(f) && f !== "test-ui.js" && f !== "test-ux-avant-0-39.js")
  .filter(f => /require\(process\.env\.PW\b|require\(["']playwright["']\)/.test(fs.readFileSync(path.join(ici, f), "utf8")))
  .filter(f => !mots.length || mots.some(m => f.includes(m)))
  .sort();

function lance(f) {
  return new Promise(fin => {
    const t0 = Date.now(), p = spawn(process.execPath, [path.join(ici, f)], { cwd: path.join(ici, ".."), env });
    let sortie = "", coupe = false;
    const garde = setTimeout(() => { coupe = true; p.kill(); }, delai);
    p.stdout.on("data", d => { sortie += d; });
    p.stderr.on("data", d => { sortie += d; });
    p.on("close", code => {
      clearTimeout(garde);
      const lignes = sortie.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const echec = lignes.find(l => /AssertionError|Timeout \d+ms exceeded|^not ok|✗|Error:|Échec/.test(l));
      const mot = coupe ? "délai dépassé (" + delai / 1000 + " s)" : (code ? (echec || lignes[lignes.length - 1] || "code " + code) : lignes[lignes.length - 1] || "");
      fin({ f, ok: !coupe && code === 0, s: Math.round((Date.now() - t0) / 1000), mot: mot.slice(0, 110) });
    });
  });
}

(async () => {
  if (!tous.length) { console.error("Aucun test d'interface ne correspond."); process.exit(2); }
  const res = [];
  for (const f of tous) {
    process.stdout.write("· " + f + " … ");
    const r = await lance(f);
    console.log(r.ok ? "vert" : "ROUGE", "(" + r.s + " s)");
    res.push(r);
  }
  const large = Math.max(...res.map(r => r.f.length));
  console.log("\n" + "Test".padEnd(large) + "  État   Durée  Dernière ligne");
  for (const r of res) console.log(r.f.padEnd(large) + "  " + (r.ok ? "vert " : "ROUGE") + "  " + String(r.s).padStart(4) + " s  " + r.mot);
  const rouges = res.filter(r => !r.ok);
  console.log("\n" + (res.length - rouges.length) + " verts, " + rouges.length + " rouges sur " + res.length + ".");
  process.exit(rouges.length ? 1 : 0);
})();
