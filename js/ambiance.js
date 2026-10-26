/* ÉCLAT — la ligne d’ambiance sous l’en-tête : une petite phrase diégétique
 * qui donne à voir et à sentir le monde vivant selon la terre, l’âge et l’heure.
 */
(function () {
  "use strict";

  const PAR_TERRE = {
    lisiere: [
      "L’odeur d’écorce et de résine flotte entre les grands arbres.",
      "Le vent balance doucement la cime des pins.",
      "Un oiseau solitaire appelle au fond du sous-bois.",
      "Des aiguilles de pin craquent sous le pas.",
      "La sève fraîche colle aux doigts."
    ],
    plaine: [
      "Les herbes hautes ondulent sous la brise comme une mer verte.",
      "Le vent siffle entre les tiges sèches.",
      "Une silhouette fuit au loin à travers les chaumes.",
      "La poussière chaude vole au ras du sol.",
      "Une odeur d’herbe coupée et de terre sèche."
    ],
    riviere: [
      "L’eau lente et lourde roule des galets noirs contre la rive.",
      "Le clapotis régulier berce la berge de limon.",
      "Des libellules effleurent le miroir du courant.",
      "L’argile fraîche sèche vite au soleil.",
      "Une odeur de vase, de joncs et d’eau fraîche."
    ],
    collines: [
      "L’air est plus vif sur les crêtes pierreuses.",
      "Des filons de malachite affleurent entre les buissons.",
      "Le vent frais descend des pentes herbeuses.",
      "Un éboulis de cailloux résonne dans le vallon.",
      "L’herbe rase s’accroche au calcaire."
    ],
    mine: [
      "Il fait tiède sous la roche, contre toute attente.",
      "Une goutte tombe dans le noir avec un écho lourd.",
      "La poussière d’anthracite noircit la peau.",
      "Les parois sombres renvoient un murmure sourd.",
      "L’odeur métallique du minerai et de l’air enfermé."
    ],
    desert: [
      "Le sable chaud crisse sous chaque pas.",
      "Une dalle de silice fondue miroite dans la chaleur.",
      "Le vent sec souffle sans soulever un seul brin d’herbe.",
      "L’air tremble au-dessus des dunes.",
      "Un éclat de verre pur renvoie la lumière crue."
    ],
    gisement: [
      "L’huile noire et épaisse suinte lentement des failles.",
      "Une vapeur tiède de bitume s’élève du sol.",
      "Le liquide lourd clapote au fond des fosses.",
      "L’acier des treuils porte les marques d’une vieille rouille.",
      "L’odeur âcre du soufre et du naphta."
    ],
    montagnes: [
      "Le vent glacial coupe la crête en deux.",
      "Des pans de roche nue montent vers un ciel limpide.",
      "Un bloc de schiste se détache et roule vers la faille.",
      "L’air est rare et piquant sur les sommets.",
      "La poussière de bauxite colore la pierre de rouille."
    ],
    orbite: [
      "La Terre défile en dessous dans un silence parfait.",
      "Un éclat d’aluminium flotte doucement dans le vide.",
      "La ligne bleue de l’atmosphère sépare le noir du bleu.",
      "Pas un souffle, pas une vibration.",
      "Le soleil découpe les métaux d’une ombre franche."
    ],
    lune: [
      "Le régolithe gris garde la trace nette de chaque pas.",
      "L’ombre d’un cratère s’étire à l’infini dans la poussière.",
      "Le disque bleu de la Terre veille dans le ciel noir.",
      "Un silence total où même les outils ne font aucun bruit.",
      "La roche blanche ne retient aucune chaleur."
    ],
    mercure: [
      "La chaleur écrasante fait trembler la silhouette du Soleil.",
      "Un ruisseau de métal liquide dort au fond d’une faille.",
      "Le sol brûlé ne refroidit jamais.",
      "L’ombre et la fournaise se touchent à angle droit.",
      "Le géant de feu occupe la moitié du ciel."
    ],
    caveau: [
      "Une douce clarté bleue baigne les cuves silencieuses.",
      "L’air y est immobile, préservé depuis des siècles.",
      "La résonance des dalles répond au moindre souffle.",
      "La résonite tiédit sous la paume.",
      "Un ordre ancien dort sous la roche."
    ]
  };

  const PAR_AGE = {
    bois: "Tout commence par un bâton et deux mains patientes.",
    os: "L’os poli glisse sans accrocher la peau.",
    pierre: "Un coup sec pour fendre, un geste mesuré pour affûter.",
    cuivre: "Le métal rouge se plie avant de céder.",
    bronze: "L’alliage coule dans le moule avec un reflet doré.",
    fer: "Le fer rougit sous le marteau et durcit à chaque coup.",
    acier: "La lame plie sous l’effort mais reprend sa droiture.",
    vapeur: "Le manomètre monte doucement vers la zone utile.",
    elec: "Un infime bourdonnement parcourt les câbles tendus.",
    atome: "La chaleur monte sans qu’aucune flamme ne s’allume.",
    silicium: "Une grille minuscule gravée sur une lamelle de quartz.",
    polymeres: "Le ruban souple sort tiède de la filière.",
    composites: "Des mèches tressées plus rigides que l’acier.",
    spatial: "Les tuyères refroidissent en claquant dans le silence.",
    stellaire: "Les voiles captent l’énergie directe de l’étoile."
  };

  const PAR_HEURE = {
    dawn: [
      "La rosée perle sur les outils posés au sol.",
      "Une première lueur grise étire les ombres du Domaine.",
      "Le froid du matin s’estompe peu à peu.",
      "L’air est encore limpide et sans poussière."
    ],
    day: [
      "Le plein jour éclaire chaque détail de l’établi.",
      "La lumière crue réchauffe les pierres.",
      "La cadence s’installe d’elle-même."
    ],
    dusk: [
      "Le ciel prend des teintes de cuivre et de cendre.",
      "Les ombres s’allongent sur le sol de l’atelier.",
      "Le vent fraîchit à mesure que le jour décline.",
      "La lueur du feu reprend ses droits."
    ],
    night: [
      "Le silence de la nuit enveloppe le Domaine.",
      "Les étoiles scintillent au-dessus des machines immobiles.",
      "Une braise veille au fond du foyer.",
      "L’obscurité rend le monde plus vaste."
    ]
  };

  const MACHINES = [
    "Un battement régulier rythme le travail des machines.",
    "Les courroies tournent sans à-coup dans la pénombre.",
    "Le mécanisme poursuit son ouvrage à cadence égale."
  ];

  const MEMOIRES = [
    "Les mains se souviennent avant que la tête ne comprenne.",
    "Un geste déjà répété mille fois dans un autre siècle."
  ];

  const CLINS = [
    "Rien ne se perd, tout attend d’être transformé.",
    "Un bâton taillé reste le début de toute chose.",
    "Un coup d’œil au ciel ne ralentit pas les mains."
  ];

  const DATA = { PAR_TERRE, PAR_AGE, PAR_HEURE, MACHINES, MEMOIRES, CLINS };

  function partJour(h) {
    return h < 6 || h >= 21 ? "night" : h < 8 ? "dawn" : h >= 18 ? "dusk" : "day";
  }

  function getLines(ctx, D) {
    const list = [];
    const z = ctx.zone || "lisiere";
    if (PAR_TERRE[z]) {
      PAR_TERRE[z].forEach((l) => list.push(l));
    }
    const ageId = (D && D.AGES && D.AGES[ctx.age] && D.AGES[ctx.age].id) || "bois";
    if (PAR_AGE[ageId]) {
      list.push(PAR_AGE[ageId]);
    }
    // Terres sans nuit réelle : pas de phrases terrestres d’heure
    const sansNuit = (z === "orbite" || z === "lune" || z === "mercure" || z === "caveau");
    if (!sansNuit && PAR_HEURE[ctx.time]) {
      PAR_HEURE[ctx.time].forEach((l) => list.push(l));
    }
    if (ctx.machines > 0) {
      MACHINES.forEach((l) => list.push(l));
    }
    if (ctx.cycle >= 2) {
      MEMOIRES.forEach((l) => list.push(l));
    }
    CLINS.forEach((l) => list.push(l));
    return list.length ? list : ["Un bâton taillé reste le début de toute chose."];
  }

  function pickLine(lines, seed, offset) {
    if (!lines || !lines.length) return "";
    const idx = Math.abs((seed + (offset || 0))) % lines.length;
    return lines[idx];
  }

  function create(api) {
    const { E, D, U, $ } = api;
    const S = () => E.state;
    let manualOffset = 0;
    let lastRenderedText = "";
    let fading = false;

    function getContext() {
      const st = S();
      const z = (U && U.zone) || "lisiere";
      const h = new Date().getHours();
      const time = partJour(h);
      let ms = 0;
      if (typeof E.machines === "function" && E.MACHINES) {
        try {
          const mobj = E.machines();
          ms = E.MACHINES.reduce((n, m) => n + (mobj[m] ? mobj[m].used : 0), 0);
        } catch (_) {}
      }
      return {
        zone: z,
        age: st.age || 0,
        time,
        machines: ms,
        cycle: st.cycle || 1
      };
    }

    function update(force) {
      const bar = $("#ambianceBar");
      if (!bar) return;
      const st = S();
      if (st.settings && st.settings.ambiance === false) {
        bar.classList.add("hidden");
        return;
      }
      bar.classList.remove("hidden");

      const ctx = getContext();
      const lines = getLines(ctx, D);
      const minuteSeed = Math.floor(Date.now() / 60000) + (ctx.age * 7) + (lines.length * 3);
      const text = pickLine(lines, minuteSeed, manualOffset);

      if (!force && text === lastRenderedText) return;

      lastRenderedText = text;
      const txtEl = $("#ambTxt");
      if (!txtEl) {
        bar.textContent = text;
        bar.title = text;
        return;
      }

      if (force && !fading) {
        fading = true;
        txtEl.classList.add("fading");
        setTimeout(() => {
          txtEl.textContent = text;
          bar.title = text;
          txtEl.classList.remove("fading");
          fading = false;
        }, 180);
      } else {
        txtEl.textContent = text;
        bar.title = text;
      }
    }

    function next() {
      manualOffset++;
      update(true);
    }

    return {
      DATA,
      getLines: (ctx) => getLines(ctx, D),
      pickLine,
      update,
      next
    };
  }

  window.EclatAmbiance = {
    DATA,
    partJour,
    getLines,
    pickLine,
    create
  };
})();
