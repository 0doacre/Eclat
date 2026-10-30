/* 0.43.1 : liste des textes de découverte à écrire (docs/revue/saveur-a-ecrire.md), par métier et par geste. */
"use strict";
const fs = require("fs");
const path = require("path");
const D = require("../js/data.js");
const { createEngine } = require("../js/engine.js");
const E = createEngine({ now: () => 2e12, rand: () => 0.5 });
const base = new Set(["assembler", "construire", "tresser", "tailler"]);
const F = {};
D.ATELIERS.familles.forEach((f) => { F[f.id] = f; });
const parMetier = {};
for (const [id, it] of Object.entries(D.ITEMS)) {
  if (!it.r || it.sec) continue;
  const f = E.atelierDe(id);
  (parMetier[f] = parMetier[f] || []).push(id);
}
const ligne = (s) => String(s || "").replace(/\s+/g, " ").trim();
let n = 0, faits = 0;
const out = ["# Textes de découverte à écrire", "",
  "Généré par `node tools/saveur-a-ecrire.js`. Chaque recette affiche, quand on la trouve, sa saveur : le texte de `D.SAVEUR[id]` s'il existe, sinon sa description actuelle (en italique ci-dessous). Pour écrire : ajouter `D.SAVEUR.<id> = \"…\"` dans `js/data.js` (220 signes au plus).", ""];
out.push("## Gestes (texte du premier emploi)", "", "| Geste | Texte actuel | Écrit |", "|---|---|---|");
for (const g of Object.keys(D.GESTES)) {
  if (base.has(g)) continue;
  const ecrit = !!(D.SAVEUR_GESTE && D.SAVEUR_GESTE[g]);
  out.push("| " + D.GESTES[g].n + " (`" + g + "`) | *" + ligne(D.GESTES[g].d) + "* | " + (ecrit ? "oui" : "non") + " |");
}
out.push("");
for (const f of Object.keys(F)) {
  const ids = (parMetier[f] || []).sort((a, b) => D.ITEMS[a].a - D.ITEMS[b].a);
  if (!ids.length) continue;
  out.push("## " + F[f].n + " (" + ids.length + " recettes)", "", "| Âge | Recette | Geste | Texte actuel | Écrit |", "|---|---|---|---|---|");
  for (const id of ids) {
    const it = D.ITEMS[id], ecrit = !!(D.SAVEUR && D.SAVEUR[id]);
    n++; if (ecrit) faits++;
    out.push("| " + it.a + " | " + it.n + " (`" + id + "`) | " + (D.GESTES[it.r[0]] ? D.GESTES[it.r[0]].n : it.r[0]) + " | *" + ligne(it.d) + "* | " + (ecrit ? "oui" : "non") + " |");
  }
  out.push("");
}
out.splice(3, 0, "Recettes : " + faits + " écrites sur " + n + ".", "");
const dest = path.join(__dirname, "..", "docs", "revue", "saveur-a-ecrire.md");
fs.writeFileSync(dest, out.join("\n"));
console.log("saveur-a-ecrire.md : " + faits + "/" + n + " recettes écrites");
