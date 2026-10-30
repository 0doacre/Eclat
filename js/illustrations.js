/* ÉCLAT — Registre des illustrations du Carnet du Semeur.
 * Associe les identifiants d'objets et de sources de récolte aux variantes WebP optimisées.
 * Utilisé par le mode Vivant pour enrichir les fiches, l'établi, la réserve et le domaine.
 * Repli automatique vers les icônes vectorielles SVG pour tout élément non couvert. */
(function () {
  "use strict";

  const ITEMS = {
    metal_mercure: "assets/carnet/items/metal_mercure.webp",
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
    flute: "assets/carnet/items/flute.webp",
    statuette: "assets/carnet/items/statuette.webp",
    encre: "assets/carnet/items/encre.webp",
    cuir_1: "assets/carnet/items/cuir_1.webp",
    racloir_os: "assets/carnet/items/racloir_os.webp",

    // Âges de la Pierre et du Cuivre
    argile: "assets/carnet/items/argile.webp",
    silex: "assets/carnet/items/silex.webp",
    sable: "assets/carnet/items/sable.webp",
    eclat: "assets/carnet/items/eclat.webp",
    engrenage_bois: "assets/carnet/items/engrenage_bois.webp",
    automate_bois: "assets/carnet/items/automate_bois.webp",
    hache_pierre: "assets/carnet/items/hache_pierre.webp",
    couteau: "assets/carnet/items/couteau.webp",
    pioche_pierre: "assets/carnet/items/pioche_pierre.webp",
    brique: "assets/carnet/items/brique.webp",
    four: "assets/carnet/items/four.webp",
    nasse: "assets/carnet/items/nasse.webp",
    hutte: "assets/carnet/items/hutte.webp",
    cerf_volant: "assets/carnet/items/cerf_volant.webp",
    poudre_rouge: "assets/carnet/items/poudre_rouge.webp",
    torche_rouge: "assets/carnet/items/torche_rouge.webp",
    papyrus: "assets/carnet/items/papyrus.webp",
    fibre_2: "assets/carnet/items/fibre_2.webp",
    caillou_2: "assets/carnet/items/caillou_2.webp",
    silex_1: "assets/carnet/items/silex_1.webp",
    sable_1: "assets/carnet/items/sable_1.webp",
    malachite: "assets/carnet/items/malachite.webp",
    cassiterite: "assets/carnet/items/cassiterite.webp",
    lingot_cuivre: "assets/carnet/items/lingot_cuivre.webp",
    enclume_pierre: "assets/carnet/items/enclume_pierre.webp",
    plaque_cuivre: "assets/carnet/items/plaque_cuivre.webp",
    fil_cuivre: "assets/carnet/items/fil_cuivre.webp",
    lingot_etain: "assets/carnet/items/lingot_etain.webp",
    creuset: "assets/carnet/items/creuset.webp",
    puits: "assets/carnet/items/puits.webp",
    charbonniere: "assets/carnet/items/charbonniere.webp",
    ciseau: "assets/carnet/items/ciseau.webp",
    lampe: "assets/carnet/items/lampe.webp",
    miroir: "assets/carnet/items/miroir.webp",
    tablette: "assets/carnet/items/tablette.webp",
    cassiterite_1: "assets/carnet/items/cassiterite_1.webp"
  };

  const SOURCES = {
    eau: "assets/carnet/sources/source_eau.webp",
    // Sources de la Forêt (Âge du Bois)
    bois: "assets/carnet/sources/source_bois.webp",
    fibre: "assets/carnet/sources/source_fibre.webp",
    caillou: "assets/carnet/sources/source_caillou.webp",

    // Sources de la Plaine (Âge de l'Os)
    os: "assets/carnet/sources/source_os.webp",
    cuir: "assets/carnet/sources/source_cuir.webp",

    // Gisements de la Rivière et des Collines
    argile: "assets/carnet/sources/source_argile.webp",
    silex: "assets/carnet/sources/source_silex.webp",
    sable: "assets/carnet/sources/source_sable.webp",
    malachite: "assets/carnet/sources/source_malachite.webp",
    cassiterite: "assets/carnet/sources/source_cassiterite.webp"
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
