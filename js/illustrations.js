/* ÉCLAT — Registre des illustrations du Carnet du Semeur.
 * Associe les identifiants d'objets et de sources de récolte aux variantes WebP optimisées.
 * Utilisé par le mode Vivant pour enrichir les fiches, l'établi, la réserve et le domaine.
 * Repli automatique vers les icônes vectorielles SVG pour tout élément non couvert. */
(function () {
  "use strict";

  const ITEMS = {
    // Âge du Bois (indice 0)
    bois: "assets/carnet/items/bois.webp",
    fibre: "assets/carnet/items/fibre.webp",
    caillou: "assets/carnet/items/caillou.webp",
    manche: "assets/carnet/items/manche.webp",
    corde: "assets/carnet/items/corde.webp",
    panier: "assets/carnet/items/panier.webp",
    archet: "assets/carnet/items/archet.webp",
    feu: "assets/carnet/items/feu.webp",
    charbon: "assets/carnet/items/charbon.webp",
    epieu: "assets/carnet/items/epieu.webp",
    cabane: "assets/carnet/items/cabane.webp",
    torche: "assets/carnet/items/torche.webp",
    fibre_1: "assets/carnet/items/fibre_1.webp",
    caillou_1: "assets/carnet/items/caillou_1.webp",
    percuteur_pierre: "assets/carnet/items/percuteur_pierre.webp",
    etabli_amenage: "assets/carnet/items/etabli_amenage.webp",

    // Âge de l'Os (indice 1)
    os: "assets/carnet/items/os.webp",
    cuir: "assets/carnet/items/cuir.webp",
    aiguille: "assets/carnet/items/aiguille.webp",
    laniere: "assets/carnet/items/laniere.webp",
    colle_os: "assets/carnet/items/colle_os.webp",
    arc: "assets/carnet/items/arc.webp",
    fronde: "assets/carnet/items/fronde.webp",
    outre: "assets/carnet/items/outre.webp",
    pic_os: "assets/carnet/items/pic_os.webp",
    collets: "assets/carnet/items/collets.webp",
    tunique: "assets/carnet/items/tunique.webp",
    encre: "assets/carnet/items/encre.webp",
    cuir_1: "assets/carnet/items/cuir_1.webp",
    racloir_os: "assets/carnet/items/racloir_os.webp"
  };

  const SOURCES = {
    // Sources de la Forêt (Âge du Bois)
    bois: "assets/carnet/sources/source_bois.webp",
    fibre: "assets/carnet/sources/source_fibre.webp",
    caillou: "assets/carnet/sources/source_caillou.webp",

    // Sources de la Plaine (Âge de l'Os)
    os: "assets/carnet/sources/source_os.webp",
    cuir: "assets/carnet/sources/source_cuir.webp"
  };

  const PREVIEW_ONLY = ["percuteur_pierre", "etabli_amenage", "racloir_os"];

  window.ECLAT_ILLUSTRATIONS = {
    items: ITEMS,
    sources: SOURCES,
    previewOnly: PREVIEW_ONLY,
    hasItem: function (id) {
      return Boolean(ITEMS[id]);
    },
    hasSource: function (res) {
      return Boolean(SOURCES[res]);
    },
    getItem: function (id) {
      return ITEMS[id] || null;
    },
    getSource: function (res) {
      return SOURCES[res] || null;
    }
  };
})();
