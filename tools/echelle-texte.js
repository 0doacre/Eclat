#!/usr/bin/env node
/* T9 · Grand texte : branche les tailles de texte des feuilles sur l'échelle --sb-texte (css/theme.css).
 * Chaque « font-size: 14px » devient « font-size: calc(14px * var(--sb-texte)) » (de même pour rem et pour la forme
 * courte « font: 600 14px/1.3 … »). Les icônes (glyphes, flèches, pastilles-icônes) et les grands titres en clamp()
 * restent tels quels. Sans effet sur une ligne déjà branchée : on peut le relancer après une fusion.
 *   node tools/echelle-texte.js            applique à css/*.css
 *   node tools/echelle-texte.js --verifie  ne change rien, sort en 1 s'il reste une taille non branchée */
"use strict";
const fs = require("fs"), path = require("path");
const DIR = path.join(__dirname, "..", "css"), VERIFIE = process.argv.includes("--verifie");
const ICONE = /terre-nav|terre-boucle|ico-fleche|ico-seule|atl-retour|atel-ic|atel-chev|\.an\)|\.fi\b|ajout-plus|summary::after|arb-fleche|\.ic:not|\.ic\b|modal-x|terre-rond|\.mic\b|icon-btn|\.gi\b|arb-inconnu|\.ico\b|::after|::before|::first-letter/;
const BRANCHE = (v) => "calc(" + v + " * var(--sb-texte))";
let reste = 0;
for (const f of fs.readdirSync(DIR).filter((n) => n.endsWith(".css") && n !== "fonts.css")) {
  const lignes = fs.readFileSync(path.join(DIR, f), "utf8").split("\n"); let n = 0;
  const sortie = lignes.map((l) => {
    if (ICONE.test(l)) return l;
    let m = l.replace(/(font-size:\s*)(\d+(?:\.\d+)?(?:px|rem))(?![\w.])/g, (_, a, v) => { n++; return a + BRANCHE(v); });
    m = m.replace(/(font:\s*(?:(?:italic|bold|normal|\d{3})\s+)*)(\d+(?:\.\d+)?px)(?=[\s/])/g, (_, a, v) => { n++; return a + BRANCHE(v); });
    return m;
  });
  if (VERIFIE) { reste += n; if (n) console.log(f + " : " + n + " taille(s) non branchée(s)"); continue; }
  if (n) { fs.writeFileSync(path.join(DIR, f), sortie.join("\n")); console.log(f + " : " + n + " taille(s) branchée(s)"); }
}
if (VERIFIE) process.exit(reste ? 1 : 0);
