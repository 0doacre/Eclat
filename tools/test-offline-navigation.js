/* Une page d’étude absente du cache doit revenir au jeu à sa bonne adresse. */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm"), assert = require("assert/strict");
const source = fs.readFileSync(path.join(__dirname, "../sw.js"), "utf8");
async function run(scope) {
  const handlers = {};
  const cached = new Response("étude déjà en cache");
  const cache = { match: async q => typeof q === "string" && q === "index.html" ? new Response("jeu") : q.url.endsWith("/etude-cachee/") ? cached.clone() : undefined };
  vm.runInNewContext(source, { URL, Request, Response, location: { origin: new URL(scope).origin }, self: { registration: { scope }, addEventListener: (name, fn) => { handlers[name] = fn; } }, caches: { open: async () => cache }, fetch: async () => { throw new Error("hors ligne"); } });
  function request(url, mode = "navigate") {
    let result;
    handlers.fetch({ request: { method: "GET", url: new URL(url, scope).href, mode }, respondWith: p => { result = p; } });
    return result;
  }
  for (const url of ["./", "index.html"]) assert.equal(await (await request(url)).text(), "jeu");
  const fallback = await request("docs/art-direction/etude/");
  assert.equal(fallback.status, 302);
  assert.equal(fallback.headers.get("location"), scope);
  assert.equal(await (await request("docs/etude-cachee/")).text(), "étude déjà en cache");
  await assert.rejects(request("css/inconnu.css", "cors"), /hors ligne/);
  console.log("✓ navigation hors ligne et chemins des assets : " + scope);
}
run("https://eclat.test/").then(() => run("https://eclat.test/jeu/")).catch(e => { console.error(e); process.exitCode = 1; });
