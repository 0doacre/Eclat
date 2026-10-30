/* ÉCLAT — les ateliers à travers les âges (0.40).
 * Sept familles d'ateliers, l'échelle main → apprenti → ouvriers → machines → robots, et l'énergie en chevaux.
 * Palier 0.40 : tout est CALCULÉ à partir de ce qui existe (recettes connues, ordres permanents, machines,
 * apprenti de l'établi). Rien n'est écrit dans la sauvegarde, rien ne change une règle du jeu : l'énergie
 * s'affiche, elle ne ralentit encore personne. Les valeurs de ce fichier sont PROVISOIRES (chevaux, âges des
 * échelons) : elles se règlent ici, au même endroit. Étude : docs/revue/etude-ateliers-a-travers-les-ages-0-39.md */
(function (root) {
  "use strict";

  /* Les familles. `ic` est un emplacement : Codex fournira les vraies icônes. */
  const FAMILLES = [
    { id: "artisanat", n: "Artisanat", ic: "🪵", d: "Le bois, les fibres, le verre, la brique." },
    { id: "elevage", n: "Élevage", ic: "🐑", d: "Ce que laissent les bêtes : os, cuir, laine." },
    { id: "metallurgie", n: "Métallurgie", ic: "⚒️", d: "Les métaux, du cuivre à l’uranium." },
    { id: "chimie", n: "Chimie et matériaux", ic: "⚗️", d: "Le pétrole, les plastiques, les composites." },
    { id: "centrales", n: "Centrales", ic: "⚡", d: "L’énergie, de la bête de trait à la fusion." },
    { id: "electronique", n: "Électronique", ic: "🔌", d: "Des circuits aux processeurs et aux robots." },
    { id: "artistique", n: "Artistique", ic: "✒️", d: "L’écriture, l’encre, la musique." }
  ];

  /* Répartition des pièces fabriquées (provisoire, à valider) */
  const DE = {
    artisanat: "manche corde archet torche eclat engrenage_bois brique brique_refr verre poudre_quartz lentille verre_trempe roue",
    elevage: "aiguille laniere colle_os gants soufflet",
    metallurgie: "lingot_cuivre plaque_cuivre fil_cuivre lingot_etain lingot_bronze plaque_bronze engrenage ressort loupe lingot_fer plaque_fer clous chainon lingot_acier acier_trempe lame engrenage_acier vis roulement piston tuyau_cuivre soupape chaudiere lingot_plomb plaque_plomb pastille_uranium cuivre_pur aluminium titane aimant aimant_neo supra alliage_ancien",
    chimie: "naphta plastique resine dynamite caoutchouc joint_souple tuyau_souple masque bouteille composite fibre_carbone tissu_carbone ceramique bouclier_th graphene metamateriau",
    centrales: "moteur_vapeur circuit_vapeur condenseur manometre regulateur bobine batterie moteur_elec barre_combustible graphite echangeur moteur_fusee propulseur panneau_dyson antimatiere matiere_exotique",
    electronique: "ampoule cable silicium wafer puce processeur cellule circuit",
    artistique: "papier encre"
  };
  /* Les outils, installations et améliorations : même principe */
  const DE_AUTRES = {
    artisanat: "panier feu epieu arc fronde hache_pierre pioche_pierre couteau four enclume_pierre creuset chariot brouette palan lampe courroies lunette",
    elevage: "outre pic_os tunique",
    metallurgie: "ciseau hache_bronze pioche_bronze enclume_bronze bas_fourneau haut_fourneau bac_trempe tour outils_fer outils_acier marteau_pilon foreuse outillage four_arc forge_stellaire convoyeurs",
    chimie: "autoclave",
    centrales: "moulin recuperation_vapeur chaudiere_tubulaire dynamo centrale centrale_fission reacteur reacteur_fusion refroidissement locomotive pompe fusee alunisseur vaisseau compteur_geiger",
    electronique: "telegraphe radio eclairage reseau capteurs ordinateur robots ia drones lithographe radiotelescope serveur_archives",
    artistique: "papyrus presse_imprimer"
  };
  const MAP = {};
  for (const f in DE) DE[f].split(" ").forEach((id) => { MAP[id] = f; });
  for (const f in DE_AUTRES) DE_AUTRES[f].split(" ").forEach((id) => { MAP[id] = f; });

  /* La matière première dit la famille des pièces qui ne sont pas listées ci-dessus (outils, améliorations…) */
  const BRUT = {
    os: "elevage", cuir: "elevage",
    bois: "artisanat", fibre: "artisanat", caillou: "artisanat", argile: "artisanat", silex: "artisanat", sable: "artisanat", quartz: "artisanat", poudre_rouge: "artisanat", resonite: "artisanat",
    malachite: "metallurgie", cassiterite: "metallurgie", fer_min: "metallurgie", galene: "metallurgie", bauxite: "metallurgie", ilmenite: "metallurgie", terres_rares: "metallurgie", metal_mercure: "metallurgie", uranium: "metallurgie",
    petrole: "chimie", soufre: "chimie",
    helium3: "centrales", regolithe: "centrales", debris: "centrales"
  };

  const PRIORITE = ["metallurgie", "chimie", "electronique", "centrales", "elevage", "artistique", "artisanat"];

  /* L'échelle : l'âge qui ouvre chaque échelon (provisoire) et le nom, par défaut, de chacun */
  const ECHELONS = [
    { id: "main", n: "Main", age: 0 },
    { id: "apprenti", n: "Apprenti", age: 3 },
    { id: "ouvriers", n: "Ouvriers", age: 6 },
    { id: "machines", n: "Machines", age: 7 },
    { id: "robots", n: "Robots", age: 10 }
  ];
  /* Les cinq paliers de machines existants, du plus modeste au plus puissant : l'échelon qu'ils représentent et leur appétit en chevaux */
  const PALIERS = [
    { id: "automate_bois", echelon: 1, ch: 3 },
    { id: "automate_bronze", echelon: 2, ch: 10 },
    { id: "presse_vapeur", echelon: 3, ch: 50 },
    { id: "chaine", echelon: 3, ch: 200 },
    { id: "assembleur", echelon: 4, ch: 1500 }
  ];
  /* L'énergie fournie (chevaux) : la bête de trait, puis ce que le joueur a construit */
  const BASE_CH = 10;
  const SOURCES = [
    { id: "moulin", ch: 20 }, { id: "recuperation_vapeur", ch: 40 }, { id: "chaudiere_tubulaire", ch: 60 },
    { id: "dynamo", ch: 150 }, { id: "centrale", ch: 600 }, { id: "centrale_fission", ch: 2000 },
    { id: "reacteur", ch: 5000 }, { id: "reacteur_fusion", ch: 20000 }
  ];
  const APPRENTI_CH = 1;

  function create(api) {
    const { E, D } = api;
    const I = D.ITEMS;
    const S = () => E.state;
    const memo = {};

    function famille(id) {
      if (MAP[id]) return MAP[id];
      if (id in memo) return memo[id];
      const votes = {};
      (function walk(x, d) {
        const it = I[x];
        if (!it || d > 12) return;
        if (d > 0 && MAP[x]) { votes[MAP[x]] = (votes[MAP[x]] || 0) + 1; return; }
        if (!it.r) { if (BRUT[x]) votes[BRUT[x]] = (votes[BRUT[x]] || 0) + 1; return; }
        for (const i in it.r[1]) walk(i, d + 1);
      })(id, 0);
      /* à égalité, la famille la plus spécialisée l’emporte : l’Artisanat est la plus générale */
      let best = "artisanat", n = 0;
      for (const f of PRIORITE) if ((votes[f] || 0) > n) { best = f; n = votes[f]; }
      return (memo[id] = best);
    }

    const ordinaire = (id) => { const it = I[id]; return it && it.r && !it.sec && !it.path && !it.old && !E.isUnique(it) && !E.isScaled(it); };
    const connues = (f) => Object.keys(S().known).filter((id) => ordinaire(id) && famille(id) === f);

    function energie() {
      let offre = BASE_CH;
      const sources = [{ id: "bete", n: "Bête de trait", ch: BASE_CH }];
      SOURCES.forEach((s) => { if (E.count(s.id) > 0) { offre += s.ch; sources.push({ id: s.id, n: I[s.id] ? I[s.id].n : s.id, ch: s.ch }); } });
      const ms = E.machines();
      let demande = 0;
      PALIERS.forEach((p) => { const m = ms[p.id]; if (m) demande += m.used * p.ch; });
      const eco = E.atelierEconomyInfo ? E.atelierEconomyInfo() : null;
      if (eco && eco.hired && eco.working) demande += APPRENTI_CH;
      const ratio = demande <= 0 ? 1 : Math.min(1, offre / demande);
      return { offre, demande, ratio, sources };
    }

    function carte(f) {
      const F = FAMILLES.find((x) => x.id === f);
      const rec = connues(f), age = S().age;
      const set = new Set(rec);
      const cads = E.cadences().filter((c) => set.has(c.id));
      const ms = E.machines();
      let echelon = 0, machs = 0;
      PALIERS.forEach((p) => {
        const m = ms[p.id];
        if (!m) return;
        const sur = Object.keys(m.byRec).filter((r) => set.has(r)).reduce((a, r) => a + m.byRec[r], 0);
        if (sur > 0) { machs += sur; echelon = Math.max(echelon, p.echelon); }
      });
      const eco = E.atelierEconomyInfo ? E.atelierEconomyInfo() : null;
      if (f === "elevage" && eco && eco.hired) echelon = Math.max(echelon, 1);
      const cadence = cads.reduce((a, c) => a + (c.status === "ok" ? c.rate * 60 : 0), 0);
      const bloques = cads.filter((c) => c.status === "starved" || c.status === "nomach");
      let etat = "repos", cause = "";
      if (bloques.length) {
        etat = "bloque";
        const b = bloques[0];
        cause = b.status === "nomach" ? "pas de machine capable de " + (I[b.id] ? I[b.id].n.toLowerCase() : b.id)
          : "manque " + b.miss.map((i) => (I[i] ? I[i].n.toLowerCase() : i)).join(", ");
      } else if (cads.some((c) => c.status === "ok")) etat = "marche";
      else if (cads.some((c) => c.status === "full")) { etat = "plein"; cause = "la Réserve est pleine"; }
      const echelles = ECHELONS.map((e, i) => ({
        id: e.id, n: e.n, age: e.age,
        etat: i < echelon ? "fait" : i === echelon ? "courant" : age >= e.age ? "dispo" : "ferme"
      }));
      return {
        id: f, n: F.n, ic: F.ic, d: F.d, recettes: rec, ordres: cads, machines: machs, echelon,
        echelles, cadence, etat, cause
      };
    }

    /* les ateliers que le joueur a déjà de quoi montrer : au moins une recette connue de la famille */
    function liste() {
      return FAMILLES.filter((F) => connues(F.id).length > 0).map((F) => carte(F.id));
    }

    return { famille, connues, carte, liste, energie };
  }

  const Ateliers = { FAMILLES, ECHELONS, PALIERS, SOURCES, BASE_CH, MAP, BRUT, create };
  root.EclatAteliers = Ateliers;
  if (typeof module !== "undefined" && module.exports) module.exports = Ateliers;
})(typeof window !== "undefined" ? window : globalThis);
