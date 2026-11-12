/* ÉCLAT — service worker.
 * Le jeu est servi depuis le cache : une nouvelle version s’installe en
 * arrière-plan puis attend que le joueur l’accepte (bandeau dans le jeu), ce qui
 * lui laisse le temps de télécharger sa sauvegarde.
 * BUILD est recalculé par `node tools/build.js` : ne pas le modifier à la main. */
const BUILD = "419bcf764a";
const CACHE = "eclat-" + BUILD;
const LEGACY = "eclat-v1"; // première version : « réseau d’abord », sans attente
const FILES = [
  "css/terres.css", "css/labo.css", "css/atelier-production.css", "css/refonte-0-39.css", "css/ateliers.css", "css/harmonie.css", "css/sobriete.css", "css/harmonie-sobre.css", "css/fin.css", "css/boutons.css", "assets/ui/cadre-papier.svg", "assets/ui/cadre-brique.svg", "assets/ui/cadre-tuile.svg", "assets/ui/cadre-tuile-trouvee.svg", "assets/ui/cadre-tuile-fantome.svg", "js/ateliers.js", "js/ajuste-texte.js", "assets/refonte-0-39/onglets.svg",
  "assets/carnet/items/anneau_lourd.webp", "assets/carnet/items/quart_coeur.webp", "assets/carnet/items/de_vingt.webp", "assets/carnet/items/fouet_cuir.webp", "assets/carnet/items/automate_bronze.webp", "assets/carnet/items/brouette.webp", "assets/carnet/items/courroies.webp", "assets/carnet/items/enclume_bronze.webp", "assets/carnet/items/engrenage.webp", "assets/carnet/items/gants.webp", "assets/carnet/items/hache_bronze.webp", "assets/carnet/items/lingot_bronze.webp", "assets/carnet/items/moulin.webp", "assets/carnet/items/pioche_bronze.webp", "assets/carnet/items/plaque_bronze.webp", "assets/carnet/items/ressort.webp", "assets/carnet/items/roue.webp", "assets/carnet/items/soufflet.webp", "assets/carnet/items/charbon_2.webp", "assets/carnet/items/sable_2.webp", "assets/carnet/items/cuir_2.webp", "assets/carnet/items/martinet.webp", "assets/carnet/items/caillou_3.webp", "assets/carnet/items/chaudiere.webp", "assets/carnet/items/chaudiere_tubulaire.webp", "assets/carnet/items/locomotive.webp", "assets/carnet/items/circuit_vapeur.webp", "assets/carnet/items/condenseur.webp", "assets/carnet/items/drague.webp", "assets/carnet/items/eau.webp", "assets/carnet/items/fibre_3.webp", "assets/carnet/items/manometre.webp", "assets/carnet/items/marteau_pilon.webp", "assets/carnet/items/cassiterite_2.webp", "assets/carnet/items/treuil.webp", "assets/carnet/items/silex_2.webp", "assets/carnet/items/moteur_vapeur.webp", "assets/carnet/items/papier.webp", "assets/carnet/items/piston.webp", "assets/carnet/items/eau_1.webp", "assets/carnet/items/sable_3.webp", "assets/carnet/items/pompe.webp", "assets/carnet/items/presse_vapeur.webp", "assets/carnet/items/presse_imprimer.webp", "assets/carnet/items/recuperation_vapeur.webp", "assets/carnet/items/regulateur.webp", "assets/carnet/items/scierie.webp", "assets/carnet/items/soupape.webp", "assets/carnet/items/tuyau_cuivre.webp", "assets/carnet/items/aimant.webp", "assets/carnet/items/ampoule.webp", "assets/carnet/items/batterie.webp", "assets/carnet/items/bobine.webp", "assets/carnet/items/cable.webp", "assets/carnet/items/excavatrice.webp", "assets/carnet/items/cristal_chantant.webp", "assets/carnet/items/cuivre_pur.webp", "assets/carnet/items/dynamo.webp", "assets/carnet/items/eclairage.webp", "assets/carnet/items/four_arc.webp", "assets/carnet/items/charbon_3.webp", "assets/carnet/items/foreuse_elec.webp", "assets/carnet/items/moteur_elec.webp", "assets/carnet/items/sable_4.webp", "assets/carnet/items/poste_elec.webp", "assets/carnet/items/radio.webp", "assets/carnet/items/reseau.webp", "assets/carnet/items/foreuse.webp", "assets/carnet/items/telegraphe.webp", "assets/carnet/items/barre_combustible.webp", "assets/carnet/items/centrale_fission.webp", "assets/carnet/items/compteur_geiger.webp", "assets/carnet/items/galene.webp", "assets/carnet/items/graphite.webp", "assets/carnet/items/lingot_plomb.webp", "assets/carnet/items/uranium_1.webp", "assets/carnet/items/galene_1.webp", "assets/carnet/items/uranium.webp", "assets/carnet/items/pastille_uranium.webp", "assets/carnet/items/plaque_plomb.webp", "assets/carnet/items/capteurs.webp", "assets/carnet/items/cellule.webp", "assets/carnet/items/circuit.webp", "assets/carnet/items/derrick.webp", "assets/carnet/items/chaine.webp", "assets/carnet/items/lithographe.webp", "assets/carnet/items/ordinateur.webp", "assets/carnet/items/wafer.webp", "assets/carnet/items/processeur.webp", "assets/carnet/items/puce.webp", "assets/carnet/items/radiotelescope.webp", "assets/carnet/items/robots.webp", "assets/carnet/items/serveur_archives.webp", "assets/carnet/items/signal_brut.webp", "assets/carnet/items/silicium.webp", "assets/carnet/items/traducteur.webp", "assets/carnet/items/aimant_neo.webp", "assets/carnet/items/aluminium.webp", "assets/carnet/items/bauxite.webp", "assets/carnet/items/bouteille.webp", "assets/carnet/items/caoutchouc.webp", "assets/carnet/items/centrale.webp", "assets/carnet/items/dynamite.webp", "assets/carnet/items/echangeur.webp", "assets/carnet/items/ilmenite.webp", "assets/carnet/items/joint_souple.webp", "assets/carnet/items/masque.webp", "assets/carnet/items/ilmenite_1.webp", "assets/carnet/items/carriere.webp", "assets/carnet/items/galene_2.webp", "assets/carnet/items/terres_1.webp", "assets/carnet/items/naphta.webp", "assets/carnet/items/outillage.webp", "assets/carnet/items/petrole.webp", "assets/carnet/items/plastique.webp", "assets/carnet/items/uranium_2.webp", "assets/carnet/items/reacteur.webp", "assets/carnet/items/refroidissement.webp", "assets/carnet/items/resine.webp", "assets/carnet/items/soufre.webp", "assets/carnet/items/soufre_1.webp", "assets/carnet/items/convoyeurs.webp", "assets/carnet/items/terres_rares.webp", "assets/carnet/items/titane.webp", "assets/carnet/items/tuyau_souple.webp", "assets/carnet/items/autoclave.webp", "assets/carnet/items/bouclier_th.webp", "assets/carnet/items/centre_num.webp", "assets/carnet/items/ceramique.webp", "assets/carnet/items/composite.webp", "assets/carnet/items/drones.webp", "assets/carnet/items/fibre_carbone.webp", "assets/carnet/items/fusee.webp", "assets/carnet/items/graphene.webp", "assets/carnet/items/ilmenite_2.webp", "assets/carnet/items/excavateur.webp", "assets/carnet/items/terres_2.webp", "assets/carnet/items/moteur_fusee.webp", "assets/carnet/items/plateforme.webp", "assets/carnet/items/supra.webp", "assets/carnet/items/tissu_carbone.webp", "assets/carnet/items/alliage_ancien.webp", "assets/carnet/items/alunisseur.webp", "assets/carnet/items/assembleur.webp", "assets/carnet/items/base_lunaire.webp", "assets/carnet/items/debris.webp", "assets/carnet/items/regolithe_1.webp", "assets/carnet/items/station_orbitale.webp", "assets/carnet/items/helium3.webp", "assets/carnet/items/ia.webp", "assets/carnet/items/propulseur.webp", "assets/carnet/items/reacteur_fusion.webp", "assets/carnet/items/regolithe.webp", "assets/carnet/items/vaisseau.webp", "assets/carnet/items/antimatiere.webp", "assets/carnet/items/forge_stellaire.webp", "assets/carnet/items/matiere_exotique.webp", "assets/carnet/items/matrice.webp", "assets/carnet/items/metamateriau.webp", "assets/carnet/items/panneau_dyson.webp", "assets/carnet/items/replicateur.webp", "assets/carnet/items/argile.webp", "assets/carnet/items/silex.webp", "assets/carnet/items/sable.webp", "assets/carnet/items/eclat.webp",
  "assets/carnet/items/engrenage_bois.webp", "assets/carnet/items/automate_bois.webp", "assets/carnet/items/hache_pierre.webp", "assets/carnet/items/couteau.webp",
  "assets/carnet/items/pioche_pierre.webp", "assets/carnet/items/brique.webp", "assets/carnet/items/four.webp", "assets/carnet/items/nasse.webp",
  "assets/carnet/items/hutte.webp", "assets/carnet/items/cerf_volant.webp", "assets/carnet/items/poudre_rouge.webp", "assets/carnet/items/torche_rouge.webp",
  "assets/carnet/items/papyrus.webp", "assets/carnet/items/fibre_2.webp", "assets/carnet/items/caillou_2.webp", "assets/carnet/items/silex_1.webp",
  "assets/carnet/items/sable_1.webp", "assets/carnet/sources/source_argile.webp", "assets/carnet/sources/source_silex.webp", "assets/carnet/sources/source_sable.webp",
  "assets/carnet/items/malachite.webp", "assets/carnet/items/cassiterite.webp", "assets/carnet/items/lingot_cuivre.webp", "assets/carnet/items/enclume_pierre.webp",
  "assets/carnet/items/plaque_cuivre.webp", "assets/carnet/items/fil_cuivre.webp", "assets/carnet/items/lingot_etain.webp", "assets/carnet/items/creuset.webp",
  "assets/carnet/items/puits.webp", "assets/carnet/items/charbonniere.webp", "assets/carnet/items/ciseau.webp", "assets/carnet/items/lampe.webp",
  "assets/carnet/items/miroir.webp", "assets/carnet/items/tablette.webp", "assets/carnet/items/cassiterite_1.webp", "assets/carnet/sources/source_malachite.webp",
  "assets/carnet/sources/source_cassiterite.webp", "assets/carnet/discoveries/gue.webp", "assets/carnet/discoveries/carcasse.webp", "assets/carnet/discoveries/escalier.webp",
  "assets/carnet/discoveries/rails.webp", "assets/carnet/discoveries/sommet.webp", "assets/carnet/discoveries/nid.webp", "assets/carnet/passages/berges.webp",
  "js/passerelle-chantier.js", "css/passerelle-chantier.css",
  "assets/carnet/passages/passerelle-charpente.webp", "assets/carnet/passages/passerelle-terminee.webp",

  "js/sentier-chantier.js", "css/sentier-chantier.css", "assets/carnet/passages/base.webp", "assets/carnet/passages/ronces-gauche.webp", "assets/carnet/passages/ronces-droite.webp", "assets/carnet/passages/herbes-sentier.webp",
  "assets/carnet/discoveries/plaine-esquisse.webp", "assets/carnet/discoveries/tumulus.webp", "assets/carnet/items/flute.webp", "assets/carnet/items/statuette.webp",
  "assets/carnet/discoveries/cercle.webp",
  "js/decouvertes-carnet.js", "css/decouvertes-carnet.css", "assets/carnet/discoveries/lisiere-esquisse.webp", "assets/carnet/discoveries/camp.webp", "assets/carnet/discoveries/grotte.webp", "assets/carnet/audio/crayon.mp3",
  "assets/carnet/lands/plaine.webp", "assets/carnet/lands/riviere.webp", "assets/carnet/lands/collines.webp", "assets/carnet/lands/mine.webp", "assets/carnet/lands/desert.webp", "assets/carnet/lands/gisement.webp", "assets/carnet/lands/montagnes.webp", "assets/carnet/lands/orbite.webp", "assets/carnet/lands/lune.webp", "assets/carnet/lands/caveau.webp",
  "assets/terres/lisiere-decor.webp", "assets/terres/lisiere-fond.webp", "assets/terres/plaine-decor.webp", "assets/terres/plaine-fond.webp", "assets/terres/riviere-decor.webp", "assets/terres/riviere-fond.webp", "assets/terres/collines-decor.webp", "assets/terres/collines-fond.webp", "assets/terres/mine-decor.webp", "assets/terres/mine-fond.webp", "assets/terres/desert-decor.webp", "assets/terres/desert-fond.webp", "assets/terres/gisement-decor.webp", "assets/terres/gisement-fond.webp", "assets/terres/montagnes-decor.webp", "assets/terres/montagnes-fond.webp", "assets/terres/orbite-decor.webp", "assets/terres/orbite-fond.webp", "assets/terres/lune-decor.webp", "assets/terres/lune-fond.webp", "assets/terres/mercure-decor.webp", "assets/terres/mercure-fond.webp", "assets/terres/caveau-fond.webp",
  "css/carnet-peint.css", "assets/carnet/ui/paint-button.webp", "assets/carnet/ui/paper-button.webp", "assets/carnet/ui/page-frame.webp", "assets/carnet/ui/paper.webp",
  "assets/carnet/lands/lisiere.webp", "assets/carnet/lands/riviere-vapeur.webp", "assets/carnet/lands/mercure.webp", "assets/carnet/items/metal_mercure.webp", "assets/carnet/sources/source_eau.webp",
  "assets/carnet/items/os.webp", "assets/carnet/items/cuir.webp", "assets/carnet/items/aiguille.webp", "assets/carnet/items/laniere.webp", "assets/carnet/items/colle_os.webp", "assets/carnet/items/arc.webp", "assets/carnet/items/fronde.webp", "assets/carnet/items/outre.webp", "assets/carnet/items/pic_os.webp", "assets/carnet/items/collets.webp", "assets/carnet/items/tunique.webp", "assets/carnet/items/encre.webp", "assets/carnet/items/cuir_1.webp", "assets/carnet/items/racloir_os.webp",
  "assets/carnet/sources/source_os.webp", "assets/carnet/sources/source_cuir.webp",
  "js/equipements.js", "js/atelier-economie.js", "js/atelier-equipe.js", "css/atelier-equipe.css", "css/atelier-dessine.css",
  "js/assistance.js", "css/assistance.css",
  "js/territoires.js", "css/territoires.css",
  "js/reprise.js",
  "./", "index.html", "manifest.webmanifest", "css/fonts.css", "css/style.css", "css/theme.css", "css/arbre.css", "css/design-preview.css", "css/domaine-vivant.css",
  "js/config.js", "js/data.js", "js/recit.js", "js/signes.js", "js/constellations.js", "js/engine.js", "js/transmission.js", "js/stockage.js", "js/audio.js", "js/juice.js", "js/appareil.js", "js/sky.js", "js/scenes.js", "js/icons.js", "js/illustrations.js", "js/domaine.js", "js/carte.js", "js/tuto.js", "js/fenetres.js", "js/cloud.js", "js/visiteurs.js", "js/ambiance.js", "js/journal.js", "js/quetes.js", "js/memoire.js", "js/compte.js", "js/arbre.js", "js/carnet.js", "js/atelier.js", "js/ecouteurs.js", "js/mode-test.js", "js/ui.js",
  "assets/carnet/items/bois.webp", "assets/carnet/items/fibre.webp", "assets/carnet/items/caillou.webp", "assets/carnet/items/manche.webp", "assets/carnet/items/corde.webp", "assets/carnet/items/panier.webp", "assets/carnet/items/archet.webp", "assets/carnet/items/feu.webp", "assets/carnet/items/charbon.webp", "assets/carnet/items/epieu.webp", "assets/carnet/items/cabane.webp", "assets/carnet/items/torche.webp", "assets/carnet/items/fibre_1.webp", "assets/carnet/items/caillou_1.webp", "assets/carnet/items/percuteur_pierre.webp", "assets/carnet/items/etabli_amenage.webp",
  "assets/carnet/sources/source_bois.webp", "assets/carnet/sources/source_fibre.webp", "assets/carnet/sources/source_caillou.webp",
  "assets/ui/button-chalk.svg", "assets/ui/button-ink.svg", "assets/ui/check-mark.svg", "assets/ui/checkbox-chalk.svg", "assets/ui/checkbox-ink.svg",
  "assets/ui/divider-chalk.svg", "assets/ui/divider-ink.svg", "assets/ui/frame-chalk.svg", "assets/ui/frame-ink.svg", "assets/ui/pigment-wash.svg",
  "assets/icons.svg", "assets/fonds/memoire.webp", "assets/fonds/etude.webp", "assets/fonds/atelier.webp", "assets/fonds/journal.webp", "assets/fonds/progression.webp", "assets/glyphes/filtre-utiles.png", "assets/glyphes/filtre-tout.png", "assets/glyphes/filtre-reserve.png", "assets/glyphes/equipe.png", "assets/glyphes/a-construire.png", "assets/glyphes/ce-qui-tourne.png", "assets/glyphes/sentier.png", "assets/glyphes/travaux.png", "assets/glyphes/relire.png", "assets/glyphes/tout-relire.png", "assets/glyphes/etudier.png", "assets/glyphes/fabriquer-un.png", "assets/glyphes/explorer.png", "assets/glyphes/retour.png", "assets/glyphes/fermer.png", "assets/glyphes/objectif.png", "assets/glyphes/comptoir.png", "assets/glyphes/production.png", "assets/glyphes/recolte-continue.png", "assets/glyphes/poser-batiment.png", "assets/glyphes/souvenirs.png", "assets/glyphes/intuition.png", "assets/glyphes/ecus.png", "assets/glyphes/menu.png", "assets/fonts/alegreya-sans-400.woff2", "assets/fonts/alegreya-sans-400i.woff2", "assets/fonts/alegreya-sans-500.woff2", "assets/fonts/alegreya-sans-700.woff2", "assets/fonts/caveat-700.woff2", "assets/fonts/cinzel-700.woff2", "assets/fonts/ibm-plex-mono-500.woff2", "assets/fonts/im-fell-english-400.woff2", "assets/fonts/im-fell-english-400i.woff2", "assets/fonts/playfair-display-700i.woff2", "assets/fonts/playfair-display-800.woff2", "assets/fonts/space-grotesk-700.woff2", "assets/fonts/special-elite-400.woff2",
  "js/carte-atlas.js", "css/carte-atlas.css", "assets/atlas/monde-vivant-v1.webp",
  "assets/atlas/brume-v1.webp", "assets/atlas/feuillet-celeste-v1.webp",
  "assets/oeuvres/dyson.webp", "assets/oeuvres/brisemonde.webp", "assets/oeuvres/chant.webp", "assets/oeuvres/arche13.webp", "assets/oeuvres/silence.webp",
  "assets/terres/lisiere-carte.webp", "assets/terres/plaine-carte.webp", "assets/terres/riviere-carte.webp", "assets/terres/collines-carte.webp", "assets/terres/mine-carte.webp", "assets/terres/caveau-carte.webp",
  "assets/terres/desert-carte.webp", "assets/terres/gisement-carte.webp", "assets/terres/montagnes-carte.webp", "assets/terres/orbite-carte.webp", "assets/terres/lune-carte.webp", "assets/terres/mercure-carte.webp",
  "assets/travailleurs/portrait-artisanat.webp", "assets/travailleurs/portrait-construction.webp", "assets/travailleurs/portrait-elevage.webp", "assets/travailleurs/portrait-metallurgie.webp", "assets/travailleurs/portrait-chimie.webp", "assets/travailleurs/portrait-centrales.webp", "assets/travailleurs/portrait-electronique.webp", "assets/travailleurs/portrait-artistique.webp",
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
  if (e.data && e.data.type === "ECLAT_BUILD" && e.ports && e.ports[0]) e.ports[0].postMessage({ build: BUILD });
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
      if (req.mode === "navigate") {
        // Une étude non mise en cache ne doit pas recevoir le jeu sous son URL
        // imbriquée : ses chemins css/ et js/ pointeraient au mauvais endroit.
        const home = new URL("./", self.registration.scope);
        const target = new URL(req.url);
        if (target.pathname !== home.pathname && target.pathname !== home.pathname + "index.html") return Response.redirect(home.href, 302);
        return (await c.match("index.html")) || Response.error();
      }
      throw err;
    }
  })());
});
