/* ÉCLAT — service worker.
 * Le jeu est servi depuis le cache : une nouvelle version s’installe en
 * arrière-plan puis attend que le joueur l’accepte (bandeau dans le jeu), ce qui
 * lui laisse le temps de télécharger sa sauvegarde.
 * BUILD est recalculé par `node tools/build.js` : ne pas le modifier à la main. */
const BUILD = "cf38664f1d";
const CACHE = "eclat-" + BUILD;
const LEGACY = "eclat-v1"; // première version : « réseau d’abord », sans attente
const FILES = [
  "./", "index.html", "manifest.webmanifest", "css/fonts.css", "css/style.css", "css/theme.css", "css/arbre.css",
  "js/config.js", "js/data.js", "js/recit.js", "js/signes.js", "js/constellations.js", "js/engine.js", "js/stockage.js", "js/audio.js", "js/juice.js", "js/appareil.js", "js/sky.js", "js/scenes.js", "js/icons.js", "js/domaine.js", "js/carte.js", "js/tuto.js", "js/fenetres.js", "js/cloud.js", "js/visiteurs.js", "js/journal.js", "js/quetes.js", "js/memoire.js", "js/compte.js", "js/arbre.js", "js/carnet.js", "js/atelier.js", "js/ecouteurs.js", "js/ui.js",
  "assets/icons.svg", "assets/fonts/alegreya-sans-400.woff2", "assets/fonts/alegreya-sans-400i.woff2", "assets/fonts/alegreya-sans-500.woff2", "assets/fonts/alegreya-sans-700.woff2", "assets/fonts/caveat-700.woff2", "assets/fonts/cinzel-700.woff2", "assets/fonts/ibm-plex-mono-500.woff2", "assets/fonts/im-fell-english-400.woff2", "assets/fonts/im-fell-english-400i.woff2", "assets/fonts/playfair-display-700i.woff2", "assets/fonts/playfair-display-800.woff2", "assets/fonts/space-grotesk-700.woff2", "assets/fonts/special-elite-400.woff2",
  "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(FILES.map((f) => new Request(f, { cache: "reload" })));
    // Les pages de la première version chargeaient déjà le réseau en direct :
    // elles exécutent ce nouveau code, on peut prendre la main tout de suite.
    if (await caches.has(LEGACY)) await self.skipWaiting();
  })());
});

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith("eclat-") && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    } catch (err) {
      if (req.mode === "navigate") return (await c.match("index.html")) || Response.error();
      throw err;
    }
  })());
});
