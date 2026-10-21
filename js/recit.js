/* CONTENU PROVISOIRE */
(function (root) {
  "use strict";

  const D = root.ECLAT_DATA || (typeof require !== "undefined" ? require("./data.js") : null);
  if (!D) return;

  D.RECIT = {
    pages: {
      p1: {
        n: 1,
        titre: "Première page provisoire",
        imprime: "Texte imprimé provisoire de la première page. Un signe [soleil] est gravé au centre.",
        notes: [
          { t: "Une note manuscrite d’un ancien Semeur.", sig: "I", cond: { cycle: 1 } },
          { t: "Une seconde note qui n’apparaît qu’au cycle suivant.", sig: "II", cond: { cycle: 2 } }
        ],
        src: [
          { k: "exp", at: "lisiere:chene" }
        ]
      },
      p2: {
        n: 2,
        titre: "Deuxième page provisoire",
        imprime: "Texte imprimé provisoire de la deuxième page, trouvée dans les décombres.",
        notes: [
          { t: "Note recueillie près de la ruine relevée.", sig: "III" }
        ],
        src: [
          { k: "repair", id: "cabane" }
        ]
      },
      p3: {
        n: 3,
        titre: "Troisième page provisoire",
        imprime: "Texte imprimé provisoire de la troisième page, vendue par un marchand itinérant.",
        notes: [
          { t: "Achetée à prix d’or au comptoir de la plaine.", sig: "IV" }
        ],
        src: [
          { k: "buy", ecus: 400 }
        ]
      }
    },
    frags: {
      frag_prov_1: {
        n: "Fragment provisoire 1",
        titre: "Fragment provisoire 1",
        z: "lisiere",
        t: "Un premier fragment de récit provisoire.",
        lore: "Un premier fragment de récit provisoire.",
        revisit: [
          { cond: { cycle: 1 }, t: "Texte de revisite provisoire pour le premier fragment." }
        ]
      },
      frag_prov_2: {
        n: "Fragment provisoire 2",
        titre: "Fragment provisoire 2",
        z: "lisiere",
        t: "Un second fragment de récit provisoire.",
        lore: "Un second fragment de récit provisoire.",
        revisit: [
          { cond: { cycle: 2 }, t: "Texte de revisite au cycle 2 pour le second fragment." }
        ]
      }
    },
    archive: [],
    expFrag: {},
    questions: {
      q_prov_1: {
        titre: "Question provisoire 1",
        quand: { cycle: 1 },
        aides: [
          "Première piste d’aide pour la question provisoire.",
          "Deuxième piste d’aide, un peu plus claire.",
          "Troisième piste d’aide, touchant au but."
        ],
        resolu: { flag: "prov_resolu" }
      }
    },
    aide: { base: 5, mult: 3 }
  };

  if (D.FRAGS && D.RECIT.frags) {
    Object.assign(D.FRAGS, D.RECIT.frags);
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = D.RECIT;
  }
})(typeof window !== "undefined" ? window : globalThis);
