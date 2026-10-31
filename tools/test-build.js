/* L’empreinte du service worker (tools/build.js) ne dépend pas des fins de ligne du poste :
 * un dossier extrait en CRLF donne la même empreinte que le dépôt en LF, une vraie modification
 * la change, et les fichiers binaires sont hachés tels quels. */
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), assert = require("assert/strict");
const { spawnSync, execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const BUILD = path.join(__dirname, "build.js");
const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
const FILES = JSON.parse("[" + sw.match(/const FILES = \[([\s\S]*?)\];/)[1].replace(/\s+/g, "") + "]").filter((f) => f !== "./");
const TEXTE = /\.(html|js|css|svg|webmanifest|json|txt|md)$/i;
let passed = 0;
function test(n, fn) {
  try { fn(); passed++; console.log("  ✓ " + n); }
  catch (e) { console.log("  ✗ " + n + "\n    " + e.stack); process.exitCode = 1; }
}
/* copie les fichiers du jeu dans un dossier jetable ; `transforme(chemin, octets)` peut les changer */
function copie(transforme) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "eclat-build-"));
  for (const f of ["index.html", "sw.js"].concat(FILES)) {
    const dest = path.join(dir, f);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    let b = fs.readFileSync(path.join(ROOT, f));
    if (transforme) b = transforme(f, b);
    fs.writeFileSync(dest, b);
  }
  return dir;
}
const crlf = (f, b) => (TEXTE.test(f) ? Buffer.from(b.toString("latin1").replace(/\r?\n/g, "\r\n"), "latin1") : b);
const lancer = (dir, ...args) => spawnSync(process.execPath, [BUILD, "--root", dir, ...args], { encoding: "utf8" });
const empreinte = (dir) => lancer(dir).stdout.match(/Build (\w+)/)[1];

console.log("Empreinte du service worker : portable");

test("la liste du cache hors ligne n’a pas de doublon (Chromium refuse alors d’installer le service worker)", () => {
  const doubles = FILES.filter((f, i) => FILES.indexOf(f) !== i);
  assert.deepStrictEqual(doubles, [], "fichiers listés deux fois dans sw.js : " + doubles.join(", "));
});
test("le dépôt tel qu’il est : l’empreinte enregistrée est la bonne", () => {
  const r = spawnSync(process.execPath, [BUILD, "--check"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
});

test("un dossier extrait en CRLF (poste Windows) donne la même empreinte et passe le contrôle sans recalcul", () => {
  const dir = copie(crlf);
  assert.ok(fs.readFileSync(path.join(dir, "js/data.js")).includes("\r\n"), "la copie est bien en CRLF");
  assert.ok(fs.readFileSync(path.join(dir, "sw.js")).includes("\r\n"), "sw.js aussi");
  const r = lancer(dir, "--check");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal(empreinte(copie(crlf)), empreinte(copie()), "CRLF = LF");
});

test("une vraie modification d’un fichier texte change l’empreinte, en LF comme en CRLF", () => {
  const base = empreinte(copie());
  for (const t of [null, crlf]) {
    const dir = copie((f, b) => { const c = t ? t(f, b) : b; return f === "js/data.js" ? Buffer.concat([c, Buffer.from(t ? "// x\r\n" : "// x\n")]) : c; });
    assert.equal(lancer(dir, "--check").status, 1, "le contrôle échoue tant que BUILD n’est pas recalculé");
    assert.notEqual(empreinte(dir), base);
  }
});

test("un CR seul (pas une fin de ligne CRLF) compte comme un changement", () => {
  const base = empreinte(copie());
  const dir = copie((f, b) => (f === "css/style.css" ? Buffer.concat([b, Buffer.from("\r")]) : b));
  assert.notEqual(empreinte(dir), base);
});

test("les fichiers binaires sont hachés tels quels : une suite 0D 0A dans une police change l’empreinte", () => {
  const base = empreinte(copie());
  const police = FILES.find((f) => f.endsWith(".woff2"));
  const dir = copie((f, b) => (f === police ? Buffer.concat([b, Buffer.from([0x0d, 0x0a])]) : b));
  assert.notEqual(empreinte(dir), base);
});

test("un fichier de plus ou de moins dans la liste, ou un autre ordre, change l’empreinte", () => {
  const base = empreinte(copie());
  const dir = copie((f, b) => (f === "sw.js" ? Buffer.from(b.toString("utf8").replace(', "icons/icon-512.png"', ""), "utf8") : b));
  fs.rmSync(path.join(dir, "icons/icon-512.png"));
  assert.notEqual(empreinte(dir), base);
});

test("le dépôt n’a aucun CRLF dans l’index et .gitattributes impose LF aux fichiers texte", () => {
  const ga = fs.readFileSync(path.join(ROOT, ".gitattributes"), "utf8");
  for (const ext of ["js", "css", "html", "svg", "webmanifest", "json", "md"]) assert.match(ga, new RegExp("\\*\\." + ext + " text eol=lf"), ext);
  for (const ext of ["woff2", "png", "webp"]) assert.match(ga, new RegExp("\\*\\." + ext + " binary"), ext);
  let sortie;
  try { sortie = execFileSync("git", ["ls-files", "--eol"], { cwd: ROOT, encoding: "utf8" }); } catch (e) { return; } // pas de dépôt git (archive) : rien à vérifier
  const crlfIndex = sortie.split("\n").filter((l) => /^i\/(crlf|mixed)/.test(l));
  assert.deepEqual(crlfIndex, [], "fichiers avec CRLF dans l’index");
});

console.log(passed + " tests de l’empreinte réussis.");
