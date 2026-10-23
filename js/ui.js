/* ÉCLAT — interface. */
(function () {
  "use strict";
  const D = window.ECLAT_DATA;
  const ENGINE = window.EclatEngine;
  const E = ENGINE.createEngine();
  const A = window.EclatAudio;
  const Sky = window.EclatSky;
  /* Clé historique conservée : c’est là que vivent les parties en cours. */
  const SAVE_KEY = "eclat.save.v1";
  const BACKUP_KEY = "eclat.backups";
  const MAX_BACKUPS = 5;
  const S = () => E.state;
  const I = D.ITEMS;

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

  /* ------------------------------------------------------------ état UI */
  const U = {
    tab: "domaine", geste: "tailler", slots: [null, null, null], last: null,
    invFilter: "tout", carnetFilter: "tout", journalTab: "fragments", cosmosTab: "ciel",
    q: "", showOwned: false,
    openAges: {}, dirty: true, lastRender: 0, mq: [], mcur: null,
    badges: { carnet: false, journal: false, cosmos: false, carte: false },
    pointer: { x: 0, y: 0 }, holding: null, saveLocked: false, badSave: null, updReg: null, wantReload: false
  };

  /* ------------------------------------------------------------ formats */
  const UNITS = ["k", "M", "G", "T", "P", "E", "Z"];
  function fmt(n) {
    if (!(n > 0)) return "0";
    if (n < 10 && Math.abs(n - Math.round(n)) > 1e-6) return (Math.floor(n * 10) / 10).toFixed(1).replace(".", ",");
    if (n < 1000) return String(Math.floor(n + 1e-9));
    if (n >= 1e24) return n.toExponential(1).replace(".", ",").replace("e+", "e"); // au-delà des unités
    let u = -1, v = n;
    while (v >= 1000 && u < UNITS.length - 1) { v /= 1000; u++; }
    const s = v < 10 ? (Math.floor(v * 100) / 100).toFixed(2) : v < 100 ? (Math.floor(v * 10) / 10).toFixed(1) : Math.floor(v).toFixed(0);
    return s.replace(".", ",") + " " + UNITS[u];
  }
  function fmtNum(r) {
    const a = Math.abs(r);
    if (a < 0.095) return a.toFixed(2).replace(".", ",");
    if (a < 10) return a.toFixed(1).replace(".", ",");
    return fmt(a);
  }
  /* un débit (par seconde dans le moteur) se lit toujours par minute ; par heure s’il est infime */
  function perMin(r) { const a = Math.abs(r); return a * 60 >= 0.1 ? fmtNum(a * 60) + "/min" : fmtNum(a * 3600) + "/h"; }
  function fmtRate(r) { return r > 0 ? "+" + perMin(r) : ""; }
  function fmtTime(s) {
    s = Math.max(0, s);
    // sous dix secondes, au dixième (une pièce faite à la main, par exemple)
    if (s < 9.95 && Math.abs(s - Math.round(s)) > 0.05) return String(Math.round(s * 10) / 10).replace(".", ",") + " s";
    s = Math.round(s);
    if (s < 60) return s + " s";
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    if (h) return h + " h " + String(m).padStart(2, "0");
    return m + " min" + (r ? " " + String(r).padStart(2, "0") : "");
  }
  const fmtHeat = (h) => h.toLocaleString("fr-FR") + " °C";
  /* Ce qui bloque une recette, en nommant toujours l’objet qui manque :
   * « il faut : Four en argile (1 100 °C) », jamais « il manque la station ». */
  function needText(id, b, html) {
    b = b || E.blocker(id);
    if (!b) return "";
    if (b.why === "owned") return "déjà possédé";
    const st = E.blockStation(id, b), g = D.GESTES[I[id].r[0]];
    const det = b.why === "heat" ? fmtHeat(b.heat) : b.why === "geste" ? "pour " + g.v : "plus solide, pour " + g.v;
    if (!st) return "action inconnue : " + g.n;
    return "il faut : " + (html ? itemPill(st) : I[st].n) + " (" + det + ")";
  }
  const cap1 = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const fmtMul = (v) => "×" + String(Math.round(v * 100) / 100).replace(".", ",");
  function fmtDate(t) {
    const d = new Date(t);
    return d.toLocaleDateString("fr-FR") + " " + String(d.getHours()).padStart(2, "0") + "h" + String(d.getMinutes()).padStart(2, "0");
  }
  /* l’horodatage d’une entrée du Journal (0.7.1) : « Cycle 3 · Âge du Fer · 22 oct. 21:40 ».
   * court : « Cycle 3 · 22 oct. » pour les petites cases. Rien si l’entrée date d’avant l’horodatage. */
  function stampTxt(k, short) {
    const s = E.stampOf && E.stampOf(k);
    if (!s) return "";
    const d = new Date(s[0]);
    const o = { day: "numeric", month: "short" };
    if (d.getFullYear() !== new Date().getFullYear()) o.year = "numeric";
    const day = d.toLocaleDateString("fr-FR", o);
    if (short) return "Cycle " + s[1] + " · " + day;
    const age = D.AGES[s[2]] ? " · " + D.AGES[s[2]].n : "";
    return "Cycle " + s[1] + age + " · " + day + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  const stampHTML = (k, short) => { const t = stampTxt(k, short); return t ? '<div class="stamp">' + esc(t) + "</div>" : ""; };

  function ink(hex) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#1a1208" : "#ffffff";
  }
  /* les icônes : un sprite (assets/icons.svg, game-icons.net) glissé dans la page au démarrage */
  const GI = window.ECLAT_ICONS || { items: {} };
  const gi = (name, cls) => '<svg class="gi' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#gi-' + name + '"/></svg>';
  /* les pictogrammes des textes deviennent des icônes du sprite : dans le texte
   * seulement, jamais dans un attribut ni dans le terminal */
  const GLYPH = GI.glyphs || {};
  const glyphAlt = Object.keys(GLYPH).sort((a, b) => b.length - a.length).map((k) => k.replace(/\uFE0F/g, "")).join("|");
  const GLYPH_RE = new RegExp("(" + glyphAlt + ")\uFE0F?", "g"), GLYPH_T = new RegExp("(" + glyphAlt + ")");
  const glyphOf = (k) => GLYPH[k] || GLYPH[k + "\uFE0F"];
  function iconize(root) {
    if (!root || !glyphAlt) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (GLYPH_T.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
    const list = [];
    while (w.nextNode()) list.push(w.currentNode);
    list.forEach((n) => {
      const p = n.parentNode;
      if (!p || (p.closest && p.closest("svg, textarea, .term, option"))) return;
      const frag = document.createDocumentFragment(), s = n.nodeValue;
      let last = 0;
      s.replace(GLYPH_RE, (m, k, i) => {
        if (i > last) frag.appendChild(document.createTextNode(s.slice(last, i)));
        const t = document.createElement("template");
        t.innerHTML = gi(glyphOf(k), "gl");
        frag.appendChild(t.content);
        last = i + m.length;
        return m;
      });
      if (last < s.length) frag.appendChild(document.createTextNode(s.slice(last)));
      p.replaceChild(frag, n);
    });
  }
  const gIc = (g) => (GI.gestes && GI.gestes[g] ? gi(GI.gestes[g]) : esc(D.GESTES[g].ic));
  function loadSprite() {
    fetch("assets/icons.svg").then((r) => (r.ok ? r.text() : "")).then((t) => {
      if (!t) return;
      const d = document.createElement("div");
      d.hidden = true;
      d.innerHTML = t;
      document.body.prepend(d);
    }).catch(() => { /* hors ligne sans cache : les icônes restent vides */ });
  }
  function icon(id, cls) {
    const it = I[id];
    if (!it) return "";
    if (GI.items[id]) return '<span class="ic gic ' + (cls || "") + '">' + gi(GI.items[id]) + "</span>";
    if (it.sym) return '<span class="ic sym ' + (cls || "") + '" style="--c:' + it.col + ";--ink:" + ink(it.col) + '">' + esc(it.sym) + "</span>";
    return '<span class="ic ' + (cls || "") + '">' + it.ic + "</span>";
  }
  /* Pastille unifiée pour les objets cliquables dans les textes, objectifs et fiches */
  function itemPill(id, opt) {
    opt = opt || {};
    const it = I[id];
    if (!it) return esc(id);
    // même règle que la fiche : l’icône dès que l’objet est connu, vu, ou sans recette (matière brute) ;
    // le nom reste toujours écrit, comme avant les pastilles
    const st = S();
    const known = opt.unk !== undefined ? !opt.unk : !!(st.known[id] || st.seen[id] || !it.r);
    const name = esc(it.n);
    const ic = known ? icon(id, "sm") : '<span class="ic sm unk">?</span>';
    const qty = opt.qty ? '<span class="pill-qty">' + fmt(opt.qty) + '</span> ' : '';
    const lackCls = opt.lack ? " lack" : "";
    const unkCls = !known ? " unk" : "";
    const extraCls = opt.cls ? " " + opt.cls : "";
    const title = name + " (toucher pour voir la fiche)";
    return '<span class="item-pill' + lackCls + unkCls + extraCls + '" data-goto="' + id + '" role="button" tabindex="0" title="' + title + '" aria-label="' + esc(it.n) + '">' +
      ic + qty + '<span class="pill-name">' + name + '</span></span>';
  }
  const TYPE = { res: "Ressource", comp: "Pièce", tool: "Outil", stat: "Station", ext: "Extracteur", upg: "Amélioration", mach: "Machine", auto: "Machine", curio: "Curiosité", relic: "Relique" };
  /* la sorte d’objet, en couleur ; un extracteur dit aussi sa terre, une machine son palier */
  function badgeHTML(id) {
    const it = I[id];
    let t = TYPE[it.t];
    if (it.t === "ext" && it.z && E.ZONES[it.z]) t += " · " + E.ZONES[it.z].n.replace(/^(Le |La |Les |L’)/, "");
    else if (it.t === "mach" && it.ing) t += " · palier " + it.ing;
    return '<span class="badge t-' + it.t + '">' + esc(t) + "</span>";
  }
  /* ce que fait l’objet (couche « jeu »), puis son récit en italique */
  const itD = (it) => (E.interpolate ? E.interpolate(it.d) : it.d);
  const descHTML = (it) => (it.u ? '<div class="small">' + esc(it.u) + "</div>" : "") + (it.d ? '<div class="small muted"><i>' + esc(itD(it)) + "</i></div>" : "");
  /* ce que fait chaque sorte d’objet, en une phrase, sur sa fiche */
  const TYPE_HINT = {
    res: "Une ressource : elle se récolte sur un gisement.",
    comp: "Une pièce : elle sert à fabriquer d’autres objets.",
    tool: "Un outil : renforce tes récoltes à la main ou ouvre de nouveaux chemins.",
    stat: "Une station : elle reste à l’Atelier et débloque une action ou une chaleur.",
    ext: "Un extracteur : il se pose sur un gisement de sa terre et récolte seul, même quand le jeu est fermé.",
    upg: "Une amélioration : son effet est permanent dès son obtention.",
    mach: "Une machine : elle reste à l’Atelier et accélère les commandes des recettes qu’elle sait faire.",
    curio: "Une curiosité : vestige insolite consigné dans ton Journal.",
    relic: "Une relique : mémoire préservée du monde ancien, découverte lors de tes explorations."
  };
  const zoneName = (z) => (E.ZONES[z] ? E.ZONES[z].n : z);
  /* « de » + nom de terre, contracté : du Désert de Verre, des Profondeurs, de la Lisière */
  const deZone = (z) => {
    const n = zoneName(z);
    return /^Le /.test(n) ? "du " + n.slice(3) : /^Les /.test(n) ? "des " + n.slice(4) : /^La /.test(n) ? "de la " + n.slice(3) : /^L’/.test(n) ? "de l’" + n.slice(2) : "de " + n;
  };
  const targetName = (k) => (k === "*" ? "toutes les terres" : E.ZONES[k] ? E.ZONES[k].n : I[k] ? I[k].n : k);
  const isRawGather = (id) => I[id] && I[id].t === "res" && E.RES_ZONE[id];

  function fxList(id) {
    const it = I[id], e = it.e || {}, out = [];
    if (e.zone) out.push("Ouvre le chemin vers " + zoneName(e.zone));
    if (e.st) e.st.forEach((s) => {
      const g = D.GESTES[s.g].n;
      if (s.heat) out.push(s.g === "chauffer" ? "Chauffer jusqu’à " + fmtHeat(s.heat) : g);
      else if ((s.lvl || 1) > 1) out.push(g + " les ressources plus dures");
      else out.push("Débloque l’action " + g);
    });
    if (e.tap) for (const k in e.tap) out.push("Récolte à la main " + (k === "*" ? "partout" : E.ZONES[k] ? deZone(k).replace(/^de la /, "à la ").replace(/^du /, "au ").replace(/^des /, "aux ").replace(/^de l’/, "à l’") : ": " + targetName(k)) + " " + fmtMul(e.tap[k]));
    if (e.auto) for (const k in e.auto) out.push("Extracteurs " + (k === "*" ? "de toutes les terres" : deZone(k)) + " " + fmtMul(e.auto[k]));
    if (it.p) {
      const c = E.cache(), m = (c.auto[it.z] || 1) * (c.auto["*"] || 1) * c.echo;
      if (it.t === "ext") out.push("Se pose sur un gisement " + deZone(it.z) + " : " + Object.keys(it.p).map((r) => fmtRate(E.extRate(id, r) * m) + " " + I[r].n).join(" ou "));
      else out.push("Chacun : " + Object.keys(it.p).map((r) => fmtRate(it.p[r] * m) + " " + I[r].n).join(", "));
    }
    if (it.t === "mach") {
      out.push("Machine : " + fmtNum(it.spd * E.cache().aspd) + " fabrications/min");
      if (it.ing === 1) out.push("Recettes à 1 ingrédient");
      else if (it.ing) out.push("Recettes à " + it.ing + " ingrédients au plus");
    }
    if (e.intu) out.push("+" + e.intu + " ✨/min");
    if (e.exp) out.push("Explorations " + fmtMul(e.exp));
    if (e.sky) out.push("Ouvre le Cosmos");
    if (e.arche) out.push("Capte les ondes radio");
    if (e.term) out.push("Débloque le terminal");
    if (e.signal) out.push("Permet d’écouter le ciel");
    if (e.aspd) out.push("Machines " + fmtMul(e.aspd));
    if (e.pip) out.push("Récolte seul " + perMin(e.pip));
    if (e.flute) out.push("Débloque la flûte");
    if (e.decode) out.push("Décode le signal de Kher");
    return out;
  }
  const fxText = (id) => fxList(id).join(" · ");

  /* Liste d’ingrédients ; chaque ingrédient renvoie vers sa recette (ou sa zone). */
  function ingHTML(ing, opts) {
    opts = opts || {};
    return Object.keys(ing).map((i) => {
      const q = ing[i];
      const lack = (S().inv[i] || 0) + 1e-9 < q;
      return '<span class="ing' + (lack && opts.check ? " lack" : "") + (opts.link ? " link" : "") + '"' +
        (opts.check ? ' data-need="' + i + '" data-q="' + q + '"' : "") + (opts.link ? ' data-goto="' + i + '"' : "") + ">" +
        icon(i, "sm") + '<span class="q">' + fmt(q) + "</span> " + esc(I[i].n) + "</span>";
    }).join("");
  }
  function gesteChip(id) {
    const r = I[id].r, g = D.GESTES[r[0]], o = r[3] || {};
    let extra = "";
    if (o.heat) extra = " · " + fmtHeat(o.heat);
    if (o.lvl && o.lvl > 1) extra = " · niv. " + o.lvl;
    return '<span class="g">' + gIc(r[0]) + " " + g.n + extra + "</span>";
  }
  function mainIngredient(id) {
    const ing = I[id].r[1];
    return Object.keys(ing).sort((a, b) => ing[b] - ing[a])[0];
  }

  /* ------------------------------------------------------------ effets visuels */
  function floater(txt, x, y, color) {
    const f = document.createElement("div");
    f.className = "float";
    f.textContent = txt;
    f.style.left = x + "px"; f.style.top = (y - 30) + "px";
    if (color) f.style.color = color;
    $("#fx").appendChild(f);
    setTimeout(() => f.remove(), 900);
  }
  function sparks(x, y, n, color) {
    const fx = $("#fx");
    for (let i = 0; i < (n || 14); i++) {
      const s = document.createElement("div");
      s.className = "spark";
      const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 70;
      s.style.left = x + "px"; s.style.top = y + "px";
      s.style.setProperty("--dx", Math.cos(a) * d + "px");
      s.style.setProperty("--dy", Math.sin(a) * d - 20 + "px");
      if (color) { s.style.background = color; s.style.boxShadow = "0 0 8px " + color; }
      fx.appendChild(s);
      setTimeout(() => s.remove(), 750);
    }
  }
  /* Une fête : grande icône au centre, son nom, des étincelles. Elle ne bloque rien (on peut
   * continuer à toucher dessous). o : { id | ic, kick, title, sub } ; o.add : une ligne de plus
   * sur la fête en cours (une étape réussie au même moment qu’une découverte). */
  function fete(o) {
    if (!U.live || document.hidden) return; // pas au chargement, ni pendant le rattrapage d’une absence
    const cur = $(".cele");
    if (o.add && cur && performance.now() - (U.celeAt || 0) < 1200) {
      const l = document.createElement("div"); l.className = "ca"; l.textContent = o.add; $(".cb", cur).appendChild(l);
      return;
    }
    if (o.add) o = { ic: "🏁", kick: "Étape réussie", title: o.title || "", sub: o.sub };
    if (cur) cur.remove();
    clearTimeout(U.celeT);
    U.celeAt = performance.now();
    const el = document.createElement("div");
    el.className = "cele";
    el.innerHTML = '<div class="cb">' + (o.id ? icon(o.id, "xl") : '<span class="ic xl">' + o.ic + "</span>") + '<div class="ck">' + esc(o.kick) + '</div><div class="cn">' + esc(o.title) + "</div>" +
      (o.sub ? '<div class="cs">' + esc(o.sub) + "</div>" : "") + "</div>";
    document.body.appendChild(el);
    sparks(innerWidth / 2, innerHeight * 0.4, 34, D.AGES[S().age].c);
    vibe([12, 40, 24]);
    U.celeT = setTimeout(() => el.remove(), 1900);
  }
  function fireworks() {
    const cols = ["#4fd1c5", "#7fe08a", "#5aa0ff", "#ffd36b", "#ff7ad9"];
    for (let k = 0; k < 6; k++) setTimeout(() => {
      sparks(innerWidth * (0.2 + Math.random() * 0.6), innerHeight * (0.15 + Math.random() * 0.35), 26, cols[k % cols.length]);
    }, k * 260);
  }
  /* Un message. Deux au plus à l’écran ; un même sujet (o.key, par défaut le texte) remplace le
   * précédent au lieu de s’empiler, sauf s’il est moins important (o.p). Sur la carte, ils
   * s’affichent sous l’objectif, pour ne jamais le cacher. */
  function toast(html, o) {
    o = o || {};
    const box = $("#toasts"), key = o.key || html, p = o.p || 0;
    let kind = o.kind || o.type;
    if (!kind) {
      if (key === "nope" || /manque|plein|impossible|refusé|bloqué|ne se récolte pas|pas assez/i.test(html)) {
        kind = "warn";
      } else if (/curio|secret|découvert|⭐|✦|✨|fête/i.test(key) || /curiosité|secret|découvert|trouvaille|étoile/i.test(html)) {
        kind = "gold";
      } else if (/done|prêt|accompli|terminée|réussi|enregistré|sauvegardé/i.test(html) || /handdone|passdone|ageDone/i.test(key)) {
        kind = "good";
      } else {
        kind = "info";
      }
    }

    // Extraction ou attribution d’icône badge
    let ic = "";
    let bodyHtml = html;
    const mEmoji = html.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|[\u2300-\u23FF]|[\u2B50-\u2B55]|✓|⚠️|ℹ️|⚡|★|✦|✨)\s*/);
    if (mEmoji) {
      ic = mEmoji[1];
      bodyHtml = html.slice(mEmoji[0].length);
    } else {
      ic = kind === "good" ? "✓" : kind === "warn" ? "⚠️" : kind === "gold" ? "✨" : "ℹ️";
    }

    let t = Array.from(box.children).find((x) => x.dataset.k === key);
    if (t) {
      if (p < Number(t.dataset.p)) return;
      clearTimeout(t._tm);
      t.classList.remove("toast-out");
      t.style.animation = "none"; void t.offsetWidth; t.style.animation = "";
    } else {
      t = document.createElement("div");
      t.dataset.k = key;
      box.appendChild(t);
      while (box.children.length > 3) {
        const old = box.firstElementChild;
        if (old) old.remove();
      }
    }

    const dismiss = () => {
      if (t._dismissed) return;
      t._dismissed = true;
      clearTimeout(t._tm);
      t.classList.add("toast-out");
      setTimeout(() => { if (t.isConnected) t.remove(); }, 220);
    };

    t.className = "toast toast-" + kind;
    t.dataset.p = p;
    t.innerHTML = '<span class="toast-ic">' + ic + '</span><span class="toast-txt">' + bodyHtml + '</span><button class="toast-x" aria-label="Fermer" tabindex="-1">✕</button>';
    iconize(t);

    t.onclick = (e) => {
      e.stopPropagation();
      dismiss();
    };

    const plainLen = html.replace(/<[^>]+>/g, "").length;
    const duration = Math.min(4800, Math.max(2500, 2200 + plainLen * 30));
    t._tm = setTimeout(dismiss, duration);
  }
  function vibe(ms) { if (S().settings.vibe && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { /* ignoré */ } }
  function elCenter(el) {
    if (!el || !el.isConnected) return { x: U.pointer.x || innerWidth / 2, y: U.pointer.y || innerHeight / 2 };
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  /* ------------------------------------------------------------ modales */
  function openModal(o) {
    // le focus clavier revient sur ce qui a ouvert la fenêtre, quand la dernière se ferme
    if (!U.mcur && !U.mq.length) U.mOpener = document.activeElement;
    U.mq.push(o);
    if (!U.mcur) nextModal();
  }
  function nextModal() {
    const m = $("#modal"), box = $(".modal-box", m);
    const o = U.mq.shift();
    if (!o) { U.mcur = null; m.classList.add("hidden"); return; }
    U.mcur = o;
    U.mAt = Date.now();
    m.className = "modal " + (o.cls || "");
    box.innerHTML = (o.persistent ? "" : '<button class="modal-x" data-m="close" aria-label="Fermer">✕</button>') + o.html;
    const ttl = $("h2", box);
    if (ttl) { ttl.id = "modalTitle"; box.setAttribute("aria-labelledby", "modalTitle"); box.removeAttribute("aria-label"); }
    else { box.removeAttribute("aria-labelledby"); box.setAttribute("aria-label", "Fenêtre"); }
    iconize(box);
    box.scrollTop = 0;
    box.tabIndex = -1;
    box.focus({ preventScroll: true });
    if (o.onOpen) o.onOpen(box);
  }
  function closeModal() {
    const o = U.mcur;
    $("#modal").classList.add("hidden");
    U.mcur = null;
    if (o && o.onClose) o.onClose();
    // une fenêtre ouverte entre-temps (une liste ouverte depuis une fiche) reste ouverte
    setTimeout(() => {
      if (!U.mcur) nextModal();
      if (!U.mcur) {
        const b = U.mOpener;
        U.mOpener = null;
        if (b && b.isConnected && b !== document.body && typeof b.focus === "function") b.focus({ preventScroll: true });
      }
    }, 60);
  }
  /* une fenêtre qui vient de s’ouvrir sous le doigt ne se referme pas sur le même appui */
  const fresh = () => Date.now() - (U.mAt || 0) < 450;
  function setupModal() {
    const m = $("#modal"), box = $(".modal-box", m);
    box.addEventListener("click", (ev) => {
      // un passage à verser, une matière à voir, depuis une fiche
      const pb = ev.target.closest("[data-pour]");
      if (pb && U.mcur && !fresh()) { pour(pb.dataset.pour, pb); if (U.mcur && U.mcur.refresh) box.innerHTML = U.mcur.refresh(); return; }
      const qtb = ev.target.closest("[data-mqtab]");
      if (qtb && U.mcur && !fresh()) { U.questTab = qtb.dataset.mqtab; A.click(); if (U.mcur.refresh) box.innerHTML = U.mcur.refresh(); return; }
      const gb = !ev.target.closest("[data-m]") && ev.target.closest("[data-goto]");
      if (gb && U.mcur && !fresh()) { const from = U.mcur.reopen || null; closeModal(); setTimeout(() => { U.rfrom = from; goto(gb.dataset.goto); }, 80); return; }
      const sb = !ev.target.closest("[data-m]") && ev.target.closest("[data-s]");
      if (sb && U.mcur && !fresh()) { A.click(); openSigneModal(sb.dataset.s); return; }
      const b = ev.target.closest("[data-m]");
      if (!b || !U.mcur || fresh()) return;
      const k = b.dataset.m;
      const h = U.mcur.on && U.mcur.on[k];
      if (h && h(b, ev) === true) return;
      closeModal();
    });
    m.addEventListener("click", (ev) => { if (ev.target === m && U.mcur && !U.mcur.persistent && !fresh()) closeModal(); });
  }
  function simpleModal(kicker, title, body, btn) {
    openModal({ html: (kicker ? '<div class="kicker">' + kicker + "</div>" : "") + "<h2>" + title + "</h2>" + body +
      '<div class="acts"><button class="btn pri" data-m="close">' + (btn || "Continuer") + "</button></div>" });
  }
  const Scenes = window.EclatScenes;
  /* le Domaine : ce qui produit ; la Carte : où l’on est */
  const Dom = window.EclatDomaine.create({
    E, A, D, U, esc, fmt, fmtNum, fmtTime, perMin, needText, deZone, sparks, icon, itemPill, toast, openModal, closeModal, norm, vibe, floater, passHTML: (z) => passHTML(z), uiSigne, recitInline,
    openStillnessScene: () => openStillnessScene(),
    render: (f) => render(f), quiet: () => Tuto.active(),
    top: () => donsRepere() + goalCard() + '<div id="trackBox">' + trackerHTML() + "</div>",
    topSig: () => goalSig() + "|" + (S().track ? S().track.id : "") + "|" + E.donsOffre().length
  });
  const Carte = window.EclatCarte.create({
    E, A, D, U, esc, fmt, fmtTime, toast, openModal, passHTML: (z) => passHTML(z), expWhy: (z) => expWhy(z), explore: (z, xid) => explore(z, xid), goto: (id) => goto(id), fouiller: (z, i, l) => fouiller(z, i, l), recolter: () => recolterFouille(), A,
    goDomaine: (z) => { U.zone = z; setTab("domaine"); Dom.focusZone(z); }
  });
  /* le tutoriel : des souvenirs qui guident la main, chapitre par chapitre */
  const Tuto = window.EclatTuto.create({ E, D, A, U, esc, fmtNum, Dom, save: () => save() });
  /* un texte sur une ligne : valeurs calculées et signes, sans paragraphes */
  function recitInline(t, lieu) {
    if (!t) return "";
    const st = S();
    const cycle = (st && st.cycle) || 1;
    const semeur = cycle + 6;
    const age = (st && st.age) || 0;
    let s = esc(String(E.interpolate ? E.interpolate(String(t)) : t));
    s = s.replace(/\{cycle\}/g, cycle)
         .replace(/\{semeur\}/g, semeur)
         .replace(/\{age\}/g, age)
         .replace(/\[([a-zA-Z0-9_\u00C0-\u017F-]+)\]/g, (m, id) => {
           if (typeof renderSigneToken === "function") {
             return renderSigneToken(id, { recit: E.RECIT, state: st, seeSigne: (i, l) => E.seeSigne && E.seeSigne(i, l), esc, lieu });
           }
           return '<span class="signe" data-s="' + esc(id) + '">◇</span>';
         });
    return s;
  }
  /* une ligne de signes entièrement comprise se lit aussi en français, dessous */
  function lectureHTML(line) {
    const fr = typeof lectureLigne === "function" ? lectureLigne(line, { recit: E.RECIT, state: S() }) : "";
    return fr ? '<br><span class="lecture">« ' + esc(fr) + " »</span>" : "";
  }
  function recitHTML(t, lieu) {
    if (!t) return "";
    return String(t).split(/\n\n+/).map((p) => "<p>" + p.split("\n").map((l) => recitInline(l, lieu) + lectureHTML(l)).join("<br>") + "</p>").join("");
  }
  const loreHTML = (t, lieu) => '<div class="lore">' + recitHTML(t, lieu) + '</div>';
  /* les signes posés sur l’interface et dans les scènes (données : D.RECIT.interface) */
  function uiSigne(k, lieu) {
    const x = E.RECIT && E.RECIT.interface && E.RECIT.interface[k];
    if (!x || !x.t || (x.cond && !E.cond(x.cond))) return "";
    return recitInline(x.t, lieu).replace(/\n/g, "<br>");
  }
  /* l’ornement qui clôt une scène racontée ; fin : seulement pour les fins qu’il signe */
  function ornementHTML(lieu, delay, fin) {
    if ((typeof E.isLibere === "function" && E.isLibere()) || (S().meta && S().meta.endings && S().meta.endings.retour)) return "";
    const x = E.RECIT && E.RECIT.interface && E.RECIT.interface.ornement;
    if (!x || (fin && !(x.fins || []).includes(fin))) return "";
    const h = uiSigne("ornement", lieu);
    return h ? '<p class="scene-ornement" style="opacity:0;animation:fadeup 1.2s ' + delay + 's forwards">' + h + "</p>" : "";
  }

  /* ============================================================ SAUVEGARDES
   * Règles : on ne réécrit jamais une sauvegarde qu’on n’a pas su lire ; avant
   * toute migration, import ou restauration, une copie brute est mise de côté. */
  const verOf = (raw) => { try { return JSON.parse(raw).v || 1; } catch (e) { return 0; } };
  function backups() {
    try { const l = JSON.parse(localStorage.getItem(BACKUP_KEY) || "[]"); return Array.isArray(l) ? l : []; } catch (e) { return []; }
  }
  function pushBackup(raw, why) {
    if (!raw) return;
    const list = backups();
    if (list[0] && list[0].data === raw) return;
    list.unshift({ t: Date.now(), why, v: verOf(raw), data: raw });
    while (list.length > MAX_BACKUPS) list.pop();
    for (;;) {
      try { localStorage.setItem(BACKUP_KEY, JSON.stringify(list)); return; } catch (e) {
        if (list.length <= 1) return;
        list.pop();
      }
    }
  }
  function save() {
    if (U.saveLocked) return;
    try { localStorage.setItem(SAVE_KEY, E.serialize()); } catch (e) { /* stockage indisponible */ }
  }
  function loadSave() {
    let raw = null;
    try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { return "none"; }
    if (!raw) return "none";
    const v = verOf(raw);
    if (v > 0 && v < ENGINE.SAVE_VERSION) pushBackup(raw, "Avant la mise à jour " + D.VERSION);
    try {
      E.load(raw);
      return v < ENGINE.SAVE_VERSION ? "migrated" : "ok";
    } catch (e) {
      U.saveLocked = true;
      U.badSave = { raw, err: e.message };
      return "error";
    }
  }
  /* ------------------------------------------------------------ compte en ligne */
  const safeStore = {
    getItem: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    setItem: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* stockage bloqué */ } },
    removeItem: (k) => { try { localStorage.removeItem(k); } catch (e) { /* stockage bloqué */ } }
  };
  const Cloud = window.EclatCloud.create({ storage: safeStore, server: () => safeStore.getItem("eclat.cloud") || (window.ECLAT_CONFIG || {}).cloud || "" });
  U.sync = { busy: false, conflict: null, err: null };
  /* remplace le contenu de la fenêtre ouverte (ou en ouvre une) */
  function swapModal(o) {
    if (!U.mcur) { openModal(o); return; }
    const box = $("#modal .modal-box");
    U.mcur = o;
    $("#modal").className = "modal " + (o.cls || "");
    box.innerHTML = o.html;
    iconize(box);
    if (o.onOpen) o.onOpen(box);
  }

  /* ------------------------------------------------------------ thème */
  /* le carnet change d’habit avec l’époque (css/theme.css) ; la page tourne quand elle change */
  const EPOCH = ["pigments", "pigments", "pigments", "papyrus", "papyrus", "enluminure", "registre", "registre", "quadrille", "quadrille", "quadrille", "bord", "bord"];
  const ROMAN = (n) => [["X", 10], ["IX", 9], ["V", 5], ["IV", 4], ["I", 1]].reduce((o, [r, v]) => { while (n >= v) { o += r; n -= v; } return o; }, "");
  function applyAge() {
    const a = S().age, ag = D.AGES[a], ep = EPOCH[a] || "pigments", body = document.body;
    document.documentElement.style.setProperty("--age", ag.c);
    const ok = ep + (a === 12 ? ":stellaire" : "");
    if (body.dataset.orn !== ok) {
      const first = !body.dataset.ep;
      body.dataset.ep = ep;
      body.dataset.orn = ok;
      const o = GI.ornaments || {}, name = o[a === 12 ? "stellaire" : ep];
      $("#orn").innerHTML = name ? gi(name, "o1") + (ep === "pigments" ? gi(name, "o2") : "") + (ep === "bord" ? "<i></i>" : "") : "";
      if (!first) { const v = $("#views"); v.classList.remove("turn"); void v.offsetWidth; v.classList.add("turn"); }
    }
    $("#ageName").textContent = ag.n.replace(/^Âge (du |de la |de l’|des |de )?/, "").replace(/^./, (c) => c.toUpperCase());
    $("#ageBtn").setAttribute("aria-label", ag.n + " : étapes de l’âge");
    const old = ep === "papyrus" || ep === "enluminure";
    $("#ageNum").textContent = "Âge " + (old ? ROMAN(a + 1) + " sur " + ROMAN(D.AGES.length) : (a + 1) + "/" + D.AGES.length) + (S().cycle > 1 ? " · Semeur " + (S().cycle + 6) + (E.nomDuCycle && E.nomDuCycle() ? " · " + E.nomDuCycle() : "") : "");
    const ms = (E.milestones && E.milestones()[a]) || [];
    const done = ms.filter((x) => x.done).length;
    const total = ms.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const barEl = $("#ageBar");
    if (barEl) barEl.style.width = pct + "%";
    const badgeEl = $("#ageProgBadge");
    if (badgeEl) {
      badgeEl.textContent = done === total && total > 0 ? "✓" : done + "/" + total;
      badgeEl.className = "age-badge" + (done === total && total > 0 ? " done" : "");
    }
  }

  /* ============================================================ VUES */
  /* les onglets arrivent quand ils ont quelque chose à montrer : le Carnet à la première
   * recette, le Journal au premier lieu exploré, le Cosmos avec le ciel */
  /* quatre onglets : le Carnet se range dans l’Atelier, le Cosmos dans le Journal */
  const PARENT = { carnet: "atelier", machines: "atelier", cosmos: "journal" };
  function tabAvailable(t) {
    const st = S();
    if (t === "cosmos") return E.cache().sky;
    if (t === "journal" && E.cache().sky) return true;
    if (t === "carnet") return Object.keys(st.known).length > 0;
    if (t === "machines") return E.MACHINES.some((m) => (st.inv[m] || 0) > 0) || st.hand.q.length > 0;
    if (t === "journal") return Object.keys(st.frags).length > 0 || Object.keys(st.exp.done).length > 0 || Object.keys(st.secrets).length > 0 || (E.hasLivre && E.hasLivre()) || (E.hasQuestions && E.hasQuestions()) || (E.hasSignes && E.hasSignes());
    return true;
  }
  function setTab(t) {
    if (!tabAvailable(t)) t = "domaine";
    if (U.tab === "cosmos" && t !== "cosmos") Sky.unmount();
    const was = U.tab;
    U.tab = t;
    $$(".view").forEach((v) => { v.classList.toggle("on", v.id === "v-" + t); delete v.dataset.sig; });
    document.body.dataset.tab = t;
    $$("#tabs button").forEach((b) => { const on = b.dataset.tab === (PARENT[t] || t); b.classList.toggle("on", on); if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    if (U.badges[t]) { U.badges[t] = false; updateBadges(); }
    if (t === "journal" || t === "carnet") A.page();
    $("#views").scrollTop = 0;
    render(true);
    // la carte s’ouvre sur la terre où l’on est
    if (t === "carte" && was !== "carte") {
      const v = $("#views"), svg = $("#v-carte svg");
      if (svg) v.scrollTop = Math.max(0, svg.getBoundingClientRect().height * Carte.focusY(U.zone) - v.clientHeight * 0.55);
    }
  }
  function updateBadges() {
    S().flags.badges = Object.assign({}, U.badges); // les pastilles survivent à la fermeture
    $$("#tabs button").forEach((b) => {
      const k = b.dataset.tab, on = U.badges[k] || Object.keys(PARENT).some((c) => PARENT[c] === k && U.badges[c]);
      let d = $(".dot", b);
      if (on && !d) { d = document.createElement("i"); d.className = "dot"; b.appendChild(d); }
      if (!on && d) d.remove();
    });
    const jb = $('#tabs [data-tab="journal"]'), on = tabAvailable("journal");
    if (on && jb.classList.contains("hidden") && U.tabsSeen) jb.classList.add("born"); // il vient d’apparaître
    jb.classList.toggle("hidden", !on);
    U.tabsSeen = true;
    // un don de la relève attend d’être pris : une pastille sur le bouton Menu
    const mb = $("#menuBtn"), dd = $(".dot", mb), dpend = E.donsOffre().length > 0;
    if (dpend && !dd) { const d = document.createElement("i"); d.className = "dot dot-don"; mb.appendChild(d); }
    if (!dpend && dd) dd.remove();
    // l’Intuition se montre quand elle commence à servir
    $("#intuBtn").classList.toggle("hidden", Object.keys(S().known).length < 3 && !Object.keys(S().studied).length);
  }
  /* les onglets d’un même groupe (2 ou 3 pages) */
  function subTabs(...args) {
    let list;
    if (args.length === 6) list = [[args[0], args[3]], [args[1], args[4]], [args[2], args[5]]];
    else list = [[args[0], args[2]], [args[1], args[3]]];
    const avail = list.filter(([t]) => tabAvailable(t));
    if (avail.length <= 1) return "";
    return '<div class="subtabs">' + avail.map(([t, lbl]) =>
      '<button data-tab2="' + t + '" class="' + (U.tab === t ? "on" : "") + '">' + lbl + (U.badges[t] ? ' <i class="dot"></i>' : "") + "</button>"
    ).join("") + "</div>";
  }
  function badge(t) { if (U.tab !== t) { U.badges[t] = true; updateBadges(); if (PARENT[t] === U.tab) render(true); } }

  /* un doigt reste appuyé sur une matière (sa fiche va s’ouvrir) : on ne redessine pas dessous */
  const pressing = () => !!(U.lp && !U.lp.up);
  function render(force) {
    const now = performance.now();
    if (!force && now - U.lastRender < 120) { U.dirty = true; return; }
    if ((U.holding || pressing()) && !force) { U.dirty = true; return; }
    U.dirty = false; U.lastRender = now;
    applyAge();
    updateBadges();
    const el = $("#v-" + U.tab);
    const sc = $("#views").scrollTop;
    if (U.anchor && performance.now() - (U.anchorAt || 0) > 800) U.anchor = null; // un ancrage oublié ne sert plus
    const anc = U.anchor && findAnchor(el, U.anchor), ay = anc ? anc.getBoundingClientRect().top : 0;
    // garder le focus d’un champ de saisie pendant le rendu
    const ae = document.activeElement;
    const focus = ae && ae.id && el.contains(ae) ? { id: ae.id, s: ae.selectionStart, e: ae.selectionEnd } : null;
    if (U.tab === "atelier") el.innerHTML = viewAtelier();
    else if (U.tab === "carnet") el.innerHTML = viewCarnet();
    else if (U.tab === "machines") { const g = Dom.machSig ? Dom.machSig() : ""; if (force || el.dataset.sig !== g) { el.innerHTML = viewMachines(); el.dataset.sig = g; } }
    else if (U.tab === "domaine") { const g = Dom.sig(); if (force || el.dataset.sig !== g) { el.innerHTML = Dom.view(); el.dataset.sig = g; } }
    else if (U.tab === "carte") { const g = Carte.sig(); if (el.dataset.sig !== g) { el.innerHTML = Carte.view(); el.dataset.sig = g; } }
    else if (U.tab === "journal") el.innerHTML = viewJournal();
    else if (U.tab === "cosmos") {
      if (U.cosmosTab === "figures") { const g = figuresSig(); if (el.dataset.sig !== g) { el.innerHTML = viewCosmos(); el.dataset.sig = g; mountCosmos(); } } // sans rien de vivant : on ne redessine que si quelque chose change
      else { delete el.dataset.sig; el.innerHTML = viewCosmos(); mountCosmos(); }
    }
    iconize(el);
    $("#views").scrollTop = sc;
    // ce qu’on vient de toucher ne doit pas sauter : si un bloc s’est inséré au-dessus, on suit
    if (anc) { const a2 = findAnchor(el, U.anchor); if (a2) $("#views").scrollTop += a2.getBoundingClientRect().top - ay; }
    U.anchor = null;
    if (U.tab === "atelier") { S().flags.bench = { g: U.geste, s: U.slots.slice() }; updMini(); }
    if (focus) { const f = document.getElementById(focus.id); if (f) { f.focus(); try { f.setSelectionRange(focus.s, focus.e); } catch (e) { /* champ sans sélection */ } } }
    refresh();
    ambient();
    soundScene();
    checkForcedReleve();
  }
  /* l’ancrage : un sélecteur, ou { sel, idx } quand plusieurs éléments le partagent */
  function findAnchor(root, a) { return typeof a === "string" ? root.querySelector(a) : root.querySelectorAll(a.sel)[a.idx] || null; }
  const ANCHORS = ["data-g", "data-slot", "data-clear", "data-cr", "data-chain", "data-if", "data-track", "data-untrack", "data-tree", "data-clear-search"];
  function anchorFor(t) {
    const root = $("#v-" + U.tab);
    // depuis le petit établi (fixe à l’écran), c’est la liste visible qui doit rester en place
    if (t.closest("#mbench")) {
      const top = $("#views").getBoundingClientRect().top + 60;
      const tile = Array.from(root.querySelectorAll(".inv[data-inv]")).find((x) => x.getBoundingClientRect().top >= top);
      return tile ? '[data-inv="' + tile.dataset.inv + '"]' : null;
    }
    if (t.closest("#forge")) return "#forge";
    for (const a of ANCHORS) {
      const b = t.closest("[" + a + "]");
      if (!b) continue;
      const sel = "[" + a + '="' + b.getAttribute(a) + '"]';
      return { sel, idx: Array.from(root.querySelectorAll(sel)).indexOf(b) };
    }
    return null;
  }
  /* le petit établi : quand le grand est sorti de l’écran, ses cases et son bouton restent sous la main */
  function updMini() {
    const m = $("#mbench"), b = $("#bench");
    if (!m || !b) return;
    const out = b.getBoundingClientRect().bottom < $("#views").getBoundingClientRect().top + 24;
    m.classList.toggle("hidden", !(out && U.tab === "atelier" && U.slots.some(Boolean)));
  }
  /* la musique suit l’âge, l’ambiance suit l’endroit */
  function soundScene() {
    const z = U.zone || "lisiere";
    A.setScene({ age: S().age, tab: U.tab, zone: z, night: !Scenes.isNightless(z) && Scenes.daypart(new Date().getHours()) === "night", machines: workingMachines() });
  }
  function workingMachines() {
    const ms = E.machines();
    return E.MACHINES.reduce((n, m) => n + ms[m].used, 0);
  }
  const VOL0 = { music: 0.5, amb: 0.6, sfx: 0.8 };
  const volumes = () => Object.assign({}, VOL0, S().settings.vol);

  /* ------------------------------------------------------------ ATELIER */
  function viewAtelier() {
    const st = S();
    let h = subTabs("atelier", "carnet", "machines", "Découvrir", "Carnet", "Machines");
    if (!E.gesteOK(U.geste)) U.geste = "tailler";
    if (!(st.stats.crafts > 0) && !Tuto.active()) h += '<div class="tip">1. Choisis une <b>action</b>. 2. Touche des <b>ressources</b> pour les poser sur l’établi. 3. Touche le <b>gros bouton</b>. Pour commencer : <b>Tailler</b> + <b>Bois</b>.</div>';
    if (st.stats.crafts > 0) h += '<div class="sub-row"><span class="tiny muted">Le petit chiffre sur chaque action est son niveau. Il monte quand tu fabriques à la main.</span><button class="btn small ghost" data-skills>Niveaux</button></div>';
    h += pinsHTML();
    h += '<div class="gestes">';
    let locks = 0;
    for (const g of D.GESTE_ORDER) {
      const G = D.GESTES[g];
      if (!E.gesteOK(g)) {
        if (G.secret || locks >= 2) continue;
        locks++;
        h += '<button class="geste lock" data-lock="' + g + '"><span class="gi">?</span><span class="gn">???</span></button>';
        continue;
      }
      h += '<button class="geste' + (U.geste === g ? " on" : "") + (G.secret ? " secret" : "") + '" data-g="' + g + '"><span class="gi">' + gIc(g) + '</span><span class="gn">' + G.n + "</span>" + (st.stats.crafts > 0 ? '<i class="glv">' + E.skill(g).lvl + "</i>" : "") + "</button>";
    }
    h += "</div>";
    const G = D.GESTES[U.geste];
    let heat = G.d;
    if (U.geste === "chauffer" || U.geste === "allier") heat = "🌡️ Ta meilleure chaleur : " + fmtHeat(E.heat());
    else if ((U.geste === "marteler" || U.geste === "electriser") && E.level(U.geste) > 1) heat = G.d + " (niveau " + E.level(U.geste) + ")";
    const mat = st.age >= 9 ? " m-labo" : st.age >= 6 ? " m-metal" : st.age >= 3 ? " m-pierre" : "";
    h += '<div class="card bench' + mat + '" id="bench"><div class="heat small"><span>' + esc(heat) + "</span>" +
      (U.slots.some(Boolean) ? '<button class="bench-clear" data-clear aria-label="Vider l’établi">✕ Vider</button>' : "") + '</div><div class="slots">';
    U.slots.forEach((id, i) => {
      if (i) h += '<span class="plus-sep">+</span>';
      if (id) h += '<button class="slot full" data-slot="' + i + '">' + icon(id) + '<span class="sn">' + esc(I[id].n) + '</span><span class="tiny muted" data-c="' + id + '">' + fmt(st.inv[id] || 0) + "</span></button>";
      else h += '<button class="slot" data-slot="' + i + '"><span class="plus">+</span></button>';
    });
    // le signe gravé sur le bouton reste à toucher même quand le bouton attend des ressources
    const mark = uiSigne("fabriquer", "L’Atelier");
    h += '</div><div class="forge-wrap"><button class="forge-btn" id="forge">' + gIc(U.geste) + " " + G.n.toUpperCase() + "</button>" +
      (mark ? '<span class="forge-mark">' + mark + "</span>" : "") + "</div></div>";
    h += '<div id="mbench" class="mbench hidden"><span class="mg">' + gIc(U.geste) + "</span>" +
      U.slots.map((id, i) => '<button class="mslot" data-slot="' + i + '">' + (id ? icon(id, "sm") : "+") + "</button>").join("") +
      '<button class="mforge" data-forge>' + gIc(U.geste) + " " + esc(G.n) + "</button></div>";
    h += '<div class="card result" id="result">' + resultHTML() + "</div>";
    const sugg = E.knownWith(U.slots).filter((id) => !(U.last && U.last.id === id)).slice(0, 6);
    if (sugg.length) {
      h += '<h3 class="sub">Recettes connues avec ces ressources</h3><div class="pins">' + sugg.map(quickRow).join("") + "</div>";
    }
    const o = invOpts();
    const counts = invCounts();
    // recherche, tri et filtres quand il y a de quoi chercher
    const many = Object.keys(st.seen).length >= 8 || !!U.iq || o.filter !== "tout";
    const totalStock = Object.keys(st.inv).reduce((acc, k) => acc + (st.inv[k] || 0), 0);
    const inv = invItems();
    h += '<div class="sub-row"><h3 class="sub">Tes ressources</h3>' +
      (many ? '<span class="tiny muted">' + inv.length + (inv.length > 1 ? " ressources" : " ressource") + " · " + fmt(totalStock) + " au total</span>" : "") +
      "</div>" + studyAllHTML() +
      (many ? '<div class="inv-tools"><div class="search"><input id="iq" type="search" placeholder="Chercher une ressource…" value="' + esc(U.iq || "") + '" autocomplete="off" spellcheck="false">' +
      (U.iq ? '<button class="search-clear" data-clear-search="iq" aria-label="Effacer">✕</button>' : "") + '</div>' +
      '<select id="isort" aria-label="Trier">' + INV_SORTS.map(([k, n]) => '<option value="' + k + '"' + (o.sort === k ? " selected" : "") + ">" + n + "</option>").join("") + "</select></div>" +
      '<div class="filters">' + INV_FILTERS.map(([k, n, ic]) => {
        const cnt = counts[k] || 0;
        return '<button data-if="' + k + '" class="' + (o.filter === k ? "on" : "") + '">' + (ic ? ic + " " : "") + n + '<span class="f-cnt">' + cnt + "</span></button>";
      }).join("") + "</div>" : "");
    const flows = E.flows();
    const tile = (id) => {
      const sel = U.slots.includes(id), fav = favs()[id];
      const rxs = st.studied[id] && E.reactions(id), rx = rxs && rxs[U.geste];
      const spent = rxs && !Object.keys(rxs).length;
      const inR = E.rate(id) + (flows.prod[id] || 0);
      const outR = flows.cons[id] || 0;
      const net = inR - outR;
      const hasFlow = Math.abs(net) >= 1e-4;
      const flowCls = net > 1e-4 ? " pos" : net < -1e-4 ? " neg" : "";
      const flowTxt = net > 1e-4 ? "+" + perMin(net) : net < -1e-4 ? "-" + perMin(-net) : "";
      return '<button class="inv' + (sel ? " sel" : "") + (st.inv[id] >= 1 ? "" : " zero") + (I[id].t === "relic" ? " relic" : "") + (spent ? " spent" : "") + '" data-inv="' + id + '"' + (spent ? ' title="Plus rien à trouver avec cette ressource, pour l’instant"' : "") + ">" +
        (fav ? '<i class="fav">♥</i>' : "") +
        (rx ? '<i class="rx" title="Réagit avec cette action">✦' + (rx > 1 ? rx : "") + "</i>" : "") +
        icon(id) +
        '<span class="c" data-c="' + id + '">' + fmt(st.inv[id] || 0) + '</span>' +
        '<span class="c-flow' + flowCls + (hasFlow ? "" : " hidden") + '" data-flow="' + id + '">' + flowTxt + '</span>' +
        '<span class="n">' + esc(I[id].n) + "</span></button>";
    };
    if (!many) h += '<div class="inv-grid">' + inv.map(tile).join("") + "</div>";
    else if (o.sort === "age" && !U.iq) {
      // rangées par âge, les favorites en tête
      const groups = {};
      inv.forEach((id) => { const k = favs()[id] ? -1 : I[id].a; (groups[k] = groups[k] || []).push(id); });
      Object.keys(groups).map(Number).sort((a, b) => a - b).forEach((k) => {
        h += '<div class="inv-age">' + (k < 0 ? "♥ Favorites" : esc(D.AGES[k].n)) + '</div><div class="inv-grid">' + groups[k].map(tile).join("") + "</div>";
      });
    } else h += '<div class="inv-grid">' + inv.map(tile).join("") + "</div>";
    if (!inv.length) {
      const emptyMsg = o.filter === "fav" ? "Aucune ressource favorite. Appui long sur une ressource pour la marquer d’un ♥."
        : o.filter === "flow" ? "Aucun flux actif en ce moment. Pose des extracteurs ou lance des machines."
        : (U.iq || o.filter !== "tout" ? "Rien ne correspond." : "Rien ici. Va récolter dans le Domaine.");
      h += '<p class="small muted center" style="padding:16px 0">' + emptyMsg + "</p>";
    } else if (Object.keys(st.known).length >= 3) h += '<p class="tiny dim center" style="margin-top:8px">Appui long sur une ressource : ouvre sa fiche (♥ pour la garder en tête de liste, 🔍 pour l’étudier). Une ressource étudiée porte un ✦ quand elle réagit avec l’action choisie, et pâlit quand elle n’a plus rien à donner.</p>';
    return h;
  }
  /* Étudier tout : une ligne au-dessus des ressources tant qu’il en reste deux à étudier. */
  function studyAllHTML() {
    const st = S(), sa = E.studyAllCost();
    if (sa.n < 2 || Object.keys(st.studied).length < 1) return "";
    const lack = st.intu < sa.c;
    return '<div class="study-all"><button class="btn small" data-study-all' + (lack ? " disabled" : "") + '>🔍 Étudier tout · ✨' + fmt(sa.c) + '</button><span class="tiny muted">' +
      (lack ? "Il te manque " + fmt(sa.c - st.intu) + " ✨ pour étudier les " + sa.n + " ressources." : sa.n + " ressources pas encore étudiées. Ensuite, le filtre 🔍 À tenter montre celles qui servent encore.") + "</span></div>";
  }
  const INV_SORTS = [
    ["age", "Par âge"],
    ["qty", "Plus nombreuses"],
    ["flow", "⚡ Flux actifs"],
    ["deficit", "⚠️ En déficit"],
    ["name", "Nom (A → Z)"],
    ["new", "Dernières trouvées"]
  ];
  const INV_FILTERS = [
    ["tout", "Tout", ""],
    ["flow", "En flux", "⚡"],
    ["res", "Brutes", "🪨"],
    ["comp", "Pièces", "⚙️"],
    ["geste", "Action", "✦"],
    ["fav", "Favoris", "♥"],
    ["new", "Inutilisées", "✨"],
    ["try", "À tenter", "🔍"]
  ];
  function invCounts() {
    const st = S(), fv = favs(), flows = E.flows();
    const used = {}, forG = {};
    for (const id in st.known) {
      const r = I[id] && I[id].r;
      if (!r) continue;
      for (const i in r[1]) { used[i] = true; if (r[0] === U.geste) forG[i] = true; }
    }
    const all = Array.from(new Set(Object.keys(st.inv).concat(Object.keys(st.seen)))).filter((id) => {
      const it = I[id];
      return it && (st.inv[id] >= 1 || st.seen[id]) && !E.isUnique(it) && !E.isScaled(it);
    });
    const c = { tout: all.length, flow: 0, res: 0, comp: 0, geste: 0, fav: 0, new: 0, try: 0 };
    for (const id of all) {
      const it = I[id];
      const hasFlow = (E.rate(id) + (flows.prod[id] || 0) > 1e-4) || ((flows.cons[id] || 0) > 1e-4);
      if (hasFlow) c.flow++;
      if (it.t === "res") c.res++;
      else c.comp++;
      if (forG[id]) c.geste++;
      if (fv[id]) c.fav++;
      if (!used[id]) c.new++;
      if (st.studied[id] && E.usesLeft(id)) c.try++;
    }
    return c;
  }
  const invOpts = () => Object.assign({ sort: "age", filter: U.invFilter || "tout" }, S().settings.inv, { filter: U.invFilter || (S().settings.inv && S().settings.inv.filter) || "tout" });
  const favs = () => S().settings.favs || (S().settings.favs = {});
  function quickRow(id) {
    const st = S(), it = I[id];
    const uniq = E.isUnique(it), owned = uniq && st.made[id] > 0;
    return '<div class="pin">' + icon(id, "sm") + '<span class="grow pn link-txt" data-goto="' + id + '">' + esc(it.n) + (uniq ? "" : ' <span class="tiny muted" data-c="' + id + '">' + fmt(st.inv[id] || 0) + "</span>") + "</span>" +
      (owned ? '<span class="tiny muted">✓ possédé</span>' : '<button class="btn small" data-cr="' + id + '" data-n="1">' + "Fabriquer" + "</button>") + "</div>";
  }
  function pinsHTML() {
    const ids = Object.keys(S().pins).filter((id) => I[id] && I[id].r && S().known[id]);
    if (!ids.length) return "";
    return '<h3 class="sub" style="margin-top:4px">★ Épinglées</h3><div class="pins">' + ids.map(quickRow).join("") + "</div>";
  }
  function invItems() {
    const st = S(), o = invOpts(), q = norm(U.iq || ""), fv = favs();
    const flows = E.flows();
    const inRate = (id) => E.rate(id) + (flows.prod[id] || 0);
    const outRate = (id) => flows.cons[id] || 0;
    const netRate = (id) => inRate(id) - outRate(id);
    const actFlow = (id) => inRate(id) + outRate(id);

    const used = {}, forG = {};
    for (const id in st.known) {
      const r = I[id] && I[id].r;
      if (!r) continue;
      for (const i in r[1]) { used[i] = true; if (r[0] === U.geste) forG[i] = true; }
    }
    const byAge = (a, b) => I[a].a - I[b].a || (I[a].t === "res" ? -1 : 0) - (I[b].t === "res" ? -1 : 0) || I[a].n.localeCompare(I[b].n);
    const sorts = {
      age: byAge,
      name: (a, b) => I[a].n.localeCompare(I[b].n),
      qty: (a, b) => (st.inv[b] || 0) - (st.inv[a] || 0) || byAge(a, b),
      flow: (a, b) => actFlow(b) - actFlow(a) || Math.abs(netRate(b)) - Math.abs(netRate(a)) || byAge(a, b),
      deficit: (a, b) => {
        const netA = netRate(a), netB = netRate(b);
        const defA = netA < -1e-4 ? 1 : (outRate(a) > 0 && (st.inv[a] || 0) < 10 ? 0.5 : 0);
        const defB = netB < -1e-4 ? 1 : (outRate(b) > 0 && (st.inv[b] || 0) < 10 ? 0.5 : 0);
        if (defB !== defA) return defB - defA;
        if (netA !== netB) return netA - netB;
        return (st.inv[a] || 0) - (st.inv[b] || 0) || byAge(a, b);
      },
      new: (a, b) => (+st.seen[b] || 0) - (+st.seen[a] || 0) || byAge(b, a)
    };
    // une matière déjà eue reste dans la liste à 0 : sa place ne bouge pas, et on peut encore la poser sur l’établi
    // (une recette comprise propose alors de fabriquer ce qui manque)
    return Array.from(new Set(Object.keys(st.inv).concat(Object.keys(st.seen)))).filter((id) => {
      const it = I[id];
      if (!it || !(st.inv[id] >= 1 || st.seen[id])) return false;
      if (E.isUnique(it) || E.isScaled(it)) return false;
      if (q && !norm(it.n).includes(q)) return false;
      if (o.filter === "fav") return !!fv[id];
      if (o.filter === "flow") return inRate(id) > 1e-4 || outRate(id) > 1e-4;
      if (o.filter === "geste") return !!forG[id];
      if (o.filter === "res") return it.t === "res";
      if (o.filter === "comp") return it.t !== "res";
      if (o.filter === "new") return !used[id];
      if (o.filter === "try") return !!st.studied[id] && E.usesLeft(id) > 0;
      return true;
    }).sort((a, b) => (o.sort !== "age" ? (fv[b] ? 1 : 0) - (fv[a] ? 1 : 0) : 0) || (sorts[o.sort] || byAge)(a, b));
  }
  const WHY = {
    froid: "Rien à façonner avec cette combinaison pour l’instant.",
    frais: "L’une de ces matières s’emploie ailleurs, avec une autre action ou d’autres matières.",
    tiede: "Cette action et ces matières s’accordent bien. Cherche encore.",
    manque: "Bonne action, mais il manque une matière.",
    trop: "Bonne action, mais l’une de ces matières est superflue.",
    geste: "Les bonnes matières, mais pas la bonne action."
  };
  function thermo(t) {
    const T = D.TEMPS[t];
    return '<div class="thermo"><div class="row between"><span class="tname" style="color:' + T.c + '">' + T.n + '</span></div><div class="tbar"><i class="tmark" style="left:' +
      (6 + t * 22) + '%"></i></div></div>';
  }
  function resultHTML() {
    const r = U.last;
    if (!r) return '<p class="small muted">Choisis une action, puis touche des ressources dans la liste plus bas pour les poser (trois au plus), et touche le gros bouton. Après chaque tentative, le <b>thermomètre</b> indique si tu t’approches d’une recette.</p>';
    if (r.kind === "craft") {
      const it = I[r.id];
      let h = '<div class="row" style="align-items:flex-start">' + icon(r.id, "lg") + '<div class="grow">' +
        (r.fresh ? '<span class="new">Nouvelle découverte</span>' : "") +
        '<div class="rname">' + esc(it.n) + (E.isUnique(it) ? "" : " <span class='muted'>+" + fmt(r.n) + "</span>") + (r.bonus ? ' <span class="small" style="color:var(--intu)">★ chef-d’œuvre +' + fmt(r.bonus) + "</span>" : "") + "</div>" +
        descHTML(it) + (fxText(r.id) ? '<div class="small" style="color:var(--good);margin-top:4px">' + esc(fxText(r.id)) + "</div>" : "") + "</div></div>";
      if (!E.isUnique(it)) {
        h += '<div class="row wrap" style="margin-top:10px"><span class="small muted">' + gesteChip(r.id) + "</span>" + ingHTML(E.costFor(r.id), { check: true, link: true }) + "</div>";
        h += '<div class="row wrap" style="margin-top:8px">' + craftBtns(r.id) + "</div>";
      }
      return h;
    }
    if (r.kind === "learn") {
      // la carte suit ce qui se passe ensuite : en route dans tes mains, fabriqué, ou ce qui manque encore
      const made = (S().made[r.id] || 0) - (r.made0 || 0), q = E.queued(r.id);
      if (made > 0 && !q) { U.last = { kind: "craft", id: r.id, n: made, fresh: !r.made0 }; return resultHTML(); }
      const miss = q ? null : E.missingFor(r.id, 1);
      const head = '<div class="row">' + icon(r.id, "lg") + '<div class="grow">' + (r.fresh ? '<span class="new">Recette trouvée</span>' : "") + '<div class="rname">' + esc(I[r.id].n) + "</div>";
      if (q) return head + '<div class="small">✋ Tes mains s’y mettent : la recette et ses pièces sont dans la file des commandes.</div></div></div>';
      // tout est là : le prix est affiché avant de fabriquer (une découverte ne prend jamais un gros stock d’office)
      if (!miss) return head + descHTML(I[r.id]) + (fxText(r.id) ? '<div class="small" style="color:var(--good);margin-top:4px">' + esc(fxText(r.id)) + "</div>" : "") +
        '<div class="row wrap small" style="margin-top:8px"><span class="muted">Tu as tout ce qu’il faut. Coût :</span>' + ingHTML(E.costFor(r.id), { check: true, link: true }) + "</div>" +
        '<div class="row wrap" style="margin-top:8px">' + craftBtns(r.id) + "</div></div></div>";
      return head + '<div class="small">Tu connais la recette, mais il te manque :</div><div class="row wrap small" style="margin-top:4px;gap:4px">' +
        Object.keys(miss).map((i) => itemPill(i, { qty: miss[i], lack: true })).join("") + "</div>" +
        '<div class="row wrap" style="margin-top:8px"><button class="btn small pri" data-chain="' + r.id + '">⚡ Tout fabriquer</button><button class="btn small" data-tree="' + r.id + '">🌳 Détail</button><button class="btn small" data-track="' + r.id + '">🎯 Suivre</button></div></div></div>';
    }
    if (r.kind === "blocked") {
      const b = r.info;
      let msg = "Il te manque un outil.";
      if (b.why === "heat") msg = "Tu chauffes, mais rien ne prend. Il faut au moins " + fmtHeat(b.heat) + " (tu atteins " + fmtHeat(E.heat()) + ").";
      if (b.why === "lvl") msg = U.geste === "marteler" ? "Ton enclume n’est pas assez dure pour ce métal." : "Il faudrait bien plus de puissance.";
      const st = b.why === "heat" ? E.stationFor("chauffer", b.heat) : b.why === "lvl" ? E.stationFor(I[r.id].r[0], 0, b.lvl) : null;
      return thermo(4) + '<div class="row" style="margin-top:6px">' + icon(r.id) + '<div class="grow"><b>' + esc(I[r.id].n) + '</b><div class="small">' + esc(msg) + "</div>" +
        (st ? '<div class="small" style="display:flex;align-items:center;gap:6px;margin-top:4px">Il te faudrait : ' + itemPill(st) + "</div>" : "") +
        (r.fresh ? '<div class="tiny muted">Recette notée dans le Carnet.</div>' : "") + "</div></div>";
    }
    if (r.kind === "owned") return '<p class="small">Tu possèdes déjà <b>' + esc(I[r.id].n) + "</b>.</p>";
    if (r.kind === "queued" || r.kind === "busy") {
      const it = I[r.id];
      const done = r.kind === "queued" && !E.queued(r.id);
      const msg = done ? "✓ Fabriqué : la pièce est rangée dans ta Réserve."
        : r.kind === "queued" ? "✋ Tes mains s’y mettent. Prêt dans " + fmtTime(r.time) + "."
        : r.why === "full" ? "Tes mains sont déjà bien occupées. Attends qu’une fabrication se termine."
        : r.why === "queued" ? "Déjà en cours de fabrication." : "Impossible pour l’instant.";
      return '<div class="row" style="align-items:flex-start">' + icon(r.id, "lg") + '<div class="grow"><div class="rname">' + esc(it.n) + '</div><div class="small">' + msg + "</div>" +
        (E.isUnique(it) ? "" : '<div class="row wrap" style="margin-top:8px">' + craftBtns(r.id) + "</div>") + "</div></div>";
    }
    if (r.kind === "fail") {
      const m = E.memory();
      return thermo(r.temp) + '<p class="small" style="margin-top:8px">' + esc(r.msg) + '</p><p class="tiny muted">' + WHY[r.why] + "</p>" +
        (r.sec ? '<p class="small sec-heat">Une chaleur étrange : ce mélange cache quelque chose.</p>' : "") +
        (r.mem ? memoryHTML(m, "+" + r.mem) : m && !r.mem ? '<p class="tiny dim">Tu avais déjà tenté cette combinaison : aucun souvenir ne revient.</p>' : "");
    }
    return "";
  }
  function craftBtns(id) {
    const it = I[id];
    if (E.isUnique(it)) return '<button class="btn small pri" data-cr="' + id + '" data-n="1">Fabriquer</button>';
    // le prix d’un extracteur ou d’une machine monte à chaque exemplaire : pas de ×1000
    const sizes = E.isScaled(it) ? [10] : (D.COMMANDES && D.COMMANDES.sizes) || [10, 50, 100, 1000];
    const lbl = E.isScaled(it) ? "Construire" : "Fabriquer";
    return '<button class="btn small pri" data-cr="' + id + '" data-n="1">' + lbl + "</button>" +
      sizes.map((sz) => '<button class="btn small" data-cr="' + id + '" data-n="' + sz + '">×' + sz + "</button>").join("") +
      '<button class="btn small" data-cr="' + id + '" data-n="max">Max</button>';
  }

  /* ------------------------------------------------------------ CARNET */
  function viewCarnet() {
    const st = S();
    const book = E.carnet();
    let known = 0, total = 0;
    book.forEach((s) => s.ids.forEach((id) => { if (!I[id].sec) { total++; if (st.known[id]) known++; } }));
    let h = subTabs("atelier", "carnet", "machines", "Découvrir", "Carnet", "Machines");
    if (!st.flags.tip_carnet) h += '<div class="tip">Le Carnet garde toutes tes recettes. <b>Fabriquer, ×10, ×50, ×100, ×1000, Max</b> lancent une commande : les pièces qui manquent sont fabriquées aussi, et tes machines t’aident. 🎯 <b>Suivre</b> affiche ce qui manque en haut du Domaine. <button class="btn small ghost" data-tip="tip_carnet">Compris</button></div>';
    // le compte suit les âges à ta portée ; après une relève, le Carnet entier reste acquis (« en tout »)
    const all = Object.keys(st.known).filter((id) => I[id] && I[id].r && !I[id].sec).length;
    h += '<p class="small muted">' + known + (known > 1 ? " recettes découvertes" : " recette découverte") + " sur " + total + " jusqu’à cet âge" + (all > known ? " · " + all + " dans ton Carnet en tout" : "") + "</p>";
    h += '<div class="search"><input id="cq" type="search" placeholder="Chercher une recette ou une ressource…" value="' + esc(U.q || "") + '" autocomplete="off" spellcheck="false">' +
      (U.q ? '<button class="search-clear" data-clear-search="cq" aria-label="Effacer">✕</button>' : '') + '</div>';
    h += '<div class="filters">' + [["tout", "Tout"], ["pret", "⚡ Prêtes"], ["craft", "Réalisables"], ["unk", "À découvrir"], ["prod", "Équipement"], ["pin", "★ Épinglées"]].map(([k, n]) =>
      '<button data-cf="' + k + '" class="' + (U.carnetFilter === k ? "on" : "") + '">' + n + "</button>").join("") + "</div>";
    return h + '<div id="clist">' + carnetList() + "</div>";
  }

  function viewMachines() {
    let h = subTabs("atelier", "carnet", "machines", "Découvrir", "Carnet", "Machines");
    h += Dom.machinesView ? Dom.machinesView() : "";
    return h;
  }
  function visibleRecipes() {
    const st = S();
    const ids = [];
    E.carnet().forEach((s) => s.ids.forEach((id) => ids.push(id)));
    if (E.gesteOK("accorder")) E.pathRecipes().forEach((id) => ids.push(id));
    return ids;
  }
  function hiddenOwned(id) {
    const it = I[id];
    return !U.showOwned && E.isUnique(it) && S().made[id] > 0 && U.carnetFilter !== "pin";
  }
  /* Le nom d’une recette encore inconnue reste caché (on cherche sans savoir ce qui va sortir),
   * sauf si le jeu l’a déjà dit : objectif, étape d’un âge, prochaine étape, objet déjà vu. */
  function namedSet() {
    const st = S(), out = {}, g = E.guide();
    E.milestones().forEach((l, a) => { if (l && a <= st.age + 1) l.forEach((x) => { if (x.ob.k === "craft") out[x.ob.id] = 1; }); });
    if (g && g.step) out[g.step] = 1;
    if (st.track) out[st.track.id] = 1;
    return out;
  }
  const nameShown = (id, set) => { const st = S(); return !!(st.known[id] || st.seen[id] || !I[id].r || (set || namedSet())[id]); };
  function carnetList() {
    const st = S();
    const q = norm(U.q);
    U.named = namedSet();
    let nHidden = 0;
    const keep = (id) => { if (!passFilter(id)) return false; if (hiddenOwned(id)) { nHidden++; return false; } return true; };
    let h = "";
    if (q) {
      const ids = visibleRecipes().filter((id) => {
        const it = I[id];
        if (!nameShown(id, U.named)) return false; // un nom caché ne se trouve pas en cherchant
        if (norm(it.n).includes(q)) return true;
        if (!st.known[id]) return false;
        return Object.keys(it.r[1]).some((i) => norm(I[i].n).includes(q));
      }).filter(passFilter);
      h += ids.length ? '<div class="list flat">' + ids.map(recCard).join("") + "</div>" : '<p class="small muted center">Aucune recette ne correspond.</p>';
      return h;
    }
    if (E.gesteOK("accorder")) {
      const ids = E.pathRecipes().filter(keep);
      if (ids.length) h += '<details class="card age-sec" open><summary><span class="ic" style="border-color:#b36bff">🎵</span><span class="an">La Résonance</span></summary><div class="list">' + ids.map(recCard).join("") + "</div></details>";
    }
    const book = E.carnet();
    const order = book.map((b, i) => i).sort((a, b) => {
      const rank = (x) => (book[x].age === st.age ? 0 : book[x].age === st.age + 1 ? 1 : 2 + (st.age - book[x].age));
      return rank(a) - rank(b);
    });
    for (const k of order) {
      const sec = book[k];
      const ids = sec.ids.filter((id) => !I[id].sec).filter(keep);
      if (!ids.length) continue;
      const ag = D.AGES[sec.age];
      const kn = sec.ids.filter((id) => st.known[id] && !I[id].sec).length;
      const all = sec.ids.filter((id) => !I[id].sec).length;
      const open = U.carnetFilter !== "tout" || (U.openAges[sec.age] !== undefined ? U.openAges[sec.age] : sec.age >= st.age);
      h += '<details class="card age-sec" data-age="' + sec.age + '"' + (open ? " open" : "") + '><summary><span class="ic" style="background:' + ag.c + "22;border-color:" + ag.c + '66">' + (sec.age + 1) +
        '</span><span class="an">' + ag.n + '</span><span class="cnt">' + kn + "/" + all + '</span></summary><div class="list">' + ids.map(recCard).join("") + "</div></details>";
    }
    const secrets = Object.keys(I).filter((id) => I[id].sec && st.known[id] && I[id].r).filter(keep);
    if (secrets.length) h += '<details class="card age-sec"' + (U.carnetFilter !== "tout" ? " open" : "") + '><summary><span class="ic">🗝️</span><span class="an">Curiosités</span><span class="cnt">' + secrets.length + '</span></summary><div class="list">' + secrets.map(recCard).join("") + "</div></details>";
    if (!h) h = '<p class="small muted center">Rien ici pour l’instant.</p>';
    if (nHidden || U.showOwned) h += '<p class="center"><button class="btn small ghost" data-owned>' + (U.showOwned ? "Masquer les objets déjà possédés" : "Afficher les " + nHidden + " objets déjà possédés") + "</button></p>";
    return h;
  }
  function passFilter(id) {
    const st = S(), it = I[id];
    if (U.carnetFilter === "tout") return true;
    if (U.carnetFilter === "pret") return st.known[id] && !E.missingFor(id, 1) && (!E.isUnique(it) || (st.made[id] || 0) === 0);
    if (U.carnetFilter === "unk") return !st.known[id];
    if (U.carnetFilter === "craft") return st.known[id] && (E.maxCraftable(id, 1) > 0 || E.plan(id, 1).ok);
    if (U.carnetFilter === "prod") return st.known[id] && ["ext", "upg", "mach", "tool", "stat"].includes(it.t);
    if (U.carnetFilter === "pin") return !!st.pins[id];
    return true;
  }
  function recCard(id) {
    const st = S(), it = I[id];
    if (!st.known[id]) {
      const lvl = st.hints[id] || 0;
      const ing = Object.keys(it.r[1]);
      const big = mainIngredient(id);
      const shown = nameShown(id, U.named);
      return '<div class="rec unknown" data-rec="' + id + '" data-goto="' + id + '"><div class="rh"><span class="ic unk">?</span><div class="grow" data-goto="' + id + '"><div class="rt">' + (shown ? esc(it.n) : '<span class="hid">???</span>') + badgeHTML(id) + '</div><div class="tiny muted">' + esc(fxText(id)) + "</div></div></div>" +
        (it.h ? '<div class="riddle small" style="margin-top:6px">« ' + esc(it.h) + " »</div>" : "") +
        '<div class="rl tiny muted">Action : ' + (lvl >= 1 ? gesteChip(id) : "?") + " · Ressource : " + (lvl >= 2 ? '<span class="ing">' + icon(big, "sm") + esc(I[big].n) + "</span>" : "?") + " · " + ing.length + " ressource" + (ing.length > 1 ? "s" : "") + "</div></div>";
    }
    const uniq = E.isUnique(it);
    const owned = uniq && (st.made[id] || 0) > 0;
    const stars = E.stars(id);
    const readyCraft = st.known[id] && !owned && !E.missingFor(id, 1);
    let h = '<div class="rec' + (owned ? " owned" : "") + (readyCraft ? " can-craft" : "") + '" data-rec="' + id + '"><div class="rh">' + icon(id) + '<div class="grow" data-goto="' + id + '"><div class="rt">' + esc(it.n) + badgeHTML(id) + (readyCraft ? '<span class="badge-ready">⚡ Prêt</span>' : '') + "</div>" +
      (stars ? '<div class="stars">' + "★".repeat(stars) + "</div>" : "") + '</div>' +
      (readyCraft ? '<button class="btn mini pri quick-make" data-cr="' + id + '" data-n="1" title="Fabriquer 1 exemplaire">⚡ +1</button>' : '') +
      '<div class="small muted" data-c="' + id + '">' + (uniq ? (owned ? "✓" : "") : fmt(st.inv[id] || 0)) + "</div>" +
      '<button class="pinb' + (st.pins[id] ? " on" : "") + '" data-pin="' + id + '" aria-label="Épingler">' + (st.pins[id] ? "★" : "☆") + "</button></div>";
    if (!owned) h += '<div class="rl">' + gesteChip(id) + ingHTML(E.costFor(id), { check: true, link: true }) + "</div>";
    const fx = fxText(id);
    if (fx) h += '<div class="fx">' + esc(fx) + "</div>";
    if (E.isScaled(it)) h += '<div class="tiny muted" style="margin-top:4px">Possédés : ' + Math.floor(st.inv[id] || 0) + "</div>";
    if (!owned) {
      const b = E.blocker(id);
      if (b && b.why !== "owned") h += '<div class="why">' + cap1(needText(id, b, true)) + "</div>";
      else {
        h += '<div class="acts">' + craftBtns(id) +
          '<button class="btn small ghost" data-tree="' + id + '" title="Détail">🌳 Détail</button>' +
          (st.track && st.track.id === id ? '<button class="btn small ghost auto-on" data-untrack title="Ne plus suivre">🎯 Suivi</button>' : '<button class="btn small ghost" data-track="' + id + '" title="Suivre">🎯 Suivre</button>') + "</div>";
      }
    }
    return h + "</div>";
  }

  /* ------------------------------------------------------------ rafraîchissement */
  /* une étape de l’âge franchie : on la fête (sur la fête de la découverte, si c’en est une) */
  function stepWatch() {
    const lists = E.milestones(), done = {};
    lists.forEach((l) => l && l.forEach((x) => { if (x.done) done[x.i] = x; }));
    const prev = U.doneObj;
    U.doneObj = done;
    if (!prev || !S().introSeen) return;
    const fresh = Object.keys(done).filter((i) => !prev[i]).map(Number);
    if (!fresh.length || fresh.length > 3) return; // plusieurs d’un coup : un chargement, pas un exploit
    const x = done[Math.max.apply(null, fresh)], list = lists.find((l) => l && l.some((y) => y.i === x.i)) || [];
    const name = x.ob.k === "craft" ? I[x.ob.id].n : x.ob.n, k = list.filter((y) => y.done).length, a = lists.indexOf(list);
    const where = a === S().age ? "cet âge" : D.AGES[a].n.replace("Âge", "l’âge");
    if (k === list.length) fete({ add: "🏆 " + D.AGES[a].n + " accompli · +" + D.AGE_DONE + " ✨", title: name, sub: "Toutes les étapes de " + where + " · +" + D.AGE_DONE + " ✨ Intuition" });
    else fete({ add: "🏁 Étape réussie · " + k + " sur " + list.length, title: name, sub: k + " sur " + list.length + " pour " + where });
  }
  function refresh() {
    const st = S();
    iconize($("#top"));
    iconize(document.querySelector(".tu-bub"));
    stepWatch();
    $("#intu").textContent = Math.floor(st.intu);
    memChip();
    questChip();
    const xp = E.expProgress();
    const mini = $("#expMini");
    if (xp) {
      mini.classList.remove("hidden");
      mini.textContent = "🧭 " + fmtTime(xp.left);
      $$("[data-xp]").forEach((b) => (b.style.width = (xp.p * 100).toFixed(1) + "%"));
      $$("[data-xw]").forEach((b) => (b.style.left = (8 + 80 * xp.p).toFixed(1) + "%"));
      $$("[data-xl]").forEach((b) => (b.textContent = fmtTime(xp.left)));
    } else mini.classList.add("hidden");
    Tuto.tick();
    const hi = E.handInfo();
    actBar();
    const hb = U.tab === "atelier" && $("#hands");
    if (hb) {
      const sig = handSig();
      if (hb.dataset.sig !== sig) { hb.innerHTML = handsHTML(); hb.dataset.sig = sig; }
      else hi.jobs.forEach((j, i) => {
        const l = hb.querySelector('[data-hl="' + i + '"]');
        if (l) l.textContent = fmtTime(i ? j.at : j.left);
        if (!i) { const b = hb.querySelector("[data-hp]"); if (b) b.style.width = (100 * (1 - j.left / j.tot)).toFixed(1) + "%"; }
      });
    }
    const view = $("#v-" + U.tab);
    $$("[data-c]", view).forEach((el) => {
      const id = el.dataset.c, it = I[id];
      if (!it || E.isUnique(it)) return;
      el.textContent = fmt(st.inv[id] || 0);
    });
    $$(".inv[data-inv]", view).forEach((el) => el.classList.toggle("zero", !(st.inv[el.dataset.inv] >= 1)));
    const rf = E.flows();
    $$("[data-flow]", view).forEach((el) => {
      const id = el.dataset.flow;
      const net = E.rate(id) + (rf.prod[id] || 0) - (rf.cons[id] || 0);
      if (Math.abs(net) < 1e-4) {
        if (!el.classList.contains("hidden")) el.classList.add("hidden");
      } else if (net > 1e-4) {
        el.textContent = "+" + perMin(net);
        el.className = "c-flow pos";
      } else {
        el.textContent = "-" + perMin(-net);
        el.className = "c-flow neg";
      }
    });
    $$("[data-need]", view).forEach((el) => el.classList.toggle("lack", (st.inv[el.dataset.need] || 0) + 1e-9 < Number(el.dataset.q)));
    $$("[data-cr]", view).forEach((b) => {
      // ×N et Max lancent une commande (qui démarre même s’il manque des matières premières)
      const id = b.dataset.cr, n = b.dataset.n;
      if (n === "max") {
        const max = E.maxPlan(id);
        b.classList.toggle("nope", max < 1);
        b.textContent = "Max" + (max > 1 ? " (" + fmt(max) + ")" : "");
      } else {
        const p = E.plan(id, 1);
        const ok = !E.blocker(id) && !p.locked.length && !Object.keys(p.blocked).length;
        b.classList.toggle("nope", !ok);
      }
    });
    $$("[data-chain]", view).forEach((b) => {
      const id = b.dataset.chain, p = E.plan(id, 1);
      b.classList.toggle("nope", !(!E.blocker(id) && !p.locked.length && !Object.keys(p.blocked).length));
    });
    $$("[data-gleft]", view).forEach((el) => { el.textContent = fmt(Math.max(0, Number(el.dataset.q) - (st.inv[el.dataset.gleft] || 0))); });
    $$("[data-exp]", view).forEach((b) => b.classList.toggle("nope", !!expWhy(b.dataset.exp)));
    if (U.tab === "domaine") { Dom.live($("#v-domaine")); soundScene(); }
    if (U.tab === "machines") { Dom.live($("#v-machines")); soundScene(); }
    if (U.tab === "carte") Carte.live($("#v-carte"));
    if (U.tab === "atelier") {
      const f = $("#forge");
      if (f) f.disabled = !U.slots.some(Boolean);
    }
  }

  /* ------------------------------------------------------------ ambiance */
  function ambient() {
    const app = $("#app");
    const ff = $$(".firefly");
    if (S().flags.lucioles && !ff.length) {
      for (let i = 0; i < 16; i++) {
        const f = document.createElement("div");
        f.className = "firefly";
        f.style.left = Math.random() * 100 + "%";
        f.style.top = 10 + Math.random() * 80 + "%";
        f.style.setProperty("--dx", (Math.random() - 0.5) * 160 + "px");
        f.style.setProperty("--dy", (Math.random() - 0.5) * 160 + "px");
        f.style.setProperty("--d", 6 + Math.random() * 8 + "s");
        f.style.animationDelay = -Math.random() * 8 + "s";
        app.appendChild(f);
      }
    } else if (!S().flags.lucioles && ff.length) ff.forEach((f) => f.remove());
    let pip = $(".pip");
    const showPip = E.cache().pip > 0 && U.tab === "domaine";
    if (showPip && !pip) { pip = document.createElement("div"); pip.className = "pip"; pip.textContent = "🐞"; app.appendChild(pip); }
    if (!showPip && pip) pip.remove();
  }

  /* pourquoi on ne peut pas fabriquer (n fois, en chaîne ou non), en une phrase */
  function whyNot(id, n, chain) {
    const it = I[id], b = E.blocker(id);
    if (E.handInfo().full) return "Tes mains sont pleines : attends qu’une fabrication se termine.";
    if (b && b.why === "owned") return "Tu possèdes déjà " + esc(it.n) + ".";
    if (b) return esc(it.n) + " : " + esc(needText(id, b)) + ".";
    const names = (m) => Object.keys(m).map((k) => fmt(m[k]) + " " + esc(I[k].n)).join(", ");
    if (chain) {
      const p = E.plan(id, n);
      const raw = {};
      for (const k in p.missing) if (!p.locked.includes(k)) raw[k] = p.missing[k];
      return (Object.keys(raw).length ? "Il manque " + names(raw) + "." : "") +
        (p.locked.length ? " Recette encore inconnue : " + p.locked.map((k) => esc(I[k].n)).join(", ") + "." : "") || "Impossible pour l’instant.";
    }
    const m = E.missingFor(id, n);
    return m ? "Il manque " + names(m) + "." : "Impossible pour l’instant.";
  }
  /* pourquoi on ne peut pas explorer ce lieu tout de suite (rien si on peut) */
  function expWhy(z) {
    const st = S(), n = E.nextExp(z);
    if (!n) return "Plus rien à explorer ici pour l’instant.";
    if (st.exp.active) return "Tu explores déjà ailleurs : une exploration à la fois.";
    if (n.locked) {
      if (n.x.hidden) return n.x.hidden;
      if (typeof n.x.need === "string" && I[n.x.need]) return "Il te faut d’abord : " + esc(I[n.x.need].n) + ".";
      if (Array.isArray(n.x.need)) return "Il te faut d’abord : " + n.x.need.map((id) => esc(I[id] ? I[id].n : id)).join(", ") + ".";
      return "Ce lieu garde son secret pour l’instant.";
    }
    const lack = n.x.cost ? Object.keys(n.x.cost).filter((i) => (st.inv[i] || 0) < n.x.cost[i]) : [];
    if (!lack.length) return "";
    return "Il te manque " + lack.map((i) => fmt(n.x.cost[i] - Math.floor(st.inv[i] || 0)) + " " + esc(I[i].n) +
      (st.known[i] ? " (voir le Carnet)" : I[i].h ? " : « " + esc(I[i].h) + " »" : "")).join(", ") + ".";
  }
  /* ============================================================ ACTIONS */
  function putInSlot(id) {
    const i = U.slots.indexOf(id);
    if (i >= 0) { U.slots[i] = null; }
    else {
      const free = U.slots.indexOf(null);
      if (free < 0) { toast("L’établi est plein : touche un emplacement pour le vider."); return; }
      U.slots[free] = id;
    }
    A.click();
    U.anchor = '[data-inv="' + id + '"]'; U.anchorAt = performance.now();
    render(true);
  }

  function forge() {
    A.init();
    const ids = U.slots.filter(Boolean);
    if (!ids.length) return;
    const g = U.geste;
    U.forging = true;
    const r = E.attempt(g, ids);
    U.forging = false;
    U.last = r;
    if (r.kind === "learn") r.made0 = S().made[r.id] || 0;
    if (U.fromMini) toast(resultLine(r), { key: "forge" });
    const bench = $("#bench");
    const p = elCenter($("#forge"));
    strike(g, bench, r.kind === "craft" || r.kind === "queued");
    if (r.kind === "queued") {
      A.click();
      if (bench) { bench.classList.remove("glow"); void bench.offsetWidth; bench.classList.add("glow"); }
    } else if (r.kind === "busy") {
      A.fail(0);
    } else if (r.kind === "craft") {
      A.craft(g);
      if (r.fresh) { setTimeout(() => A.discover(), 180); fete({ id: r.id, kick: "Nouvelle découverte", title: I[r.id].n, sub: fxText(r.id) }); }
      sparks(p.x, p.y - 40, r.fresh ? 26 : 12);
      vibe(r.fresh ? [10, 40, 20] : 12);
      if (bench) { bench.classList.remove("glow"); void bench.offsetWidth; bench.classList.add("glow"); }
    } else if (r.kind === "learn" || r.kind === "blocked") {
      A.fail(4); if (r.fresh) setTimeout(() => A.discover(), 150);
      // trouver la recette, c’est déjà découvrir : la fabriquer viendra après
      if (r.fresh && !I[r.id].sec) {
        vibe([10, 40, 20]);
        fete({ id: r.id, kick: "Recette trouvée", title: I[r.id].n, sub: r.kind === "blocked" ? "Inscrite dans ton Carnet. " + cap1(needText(r.id, r.info)) + "." : "Inscrite dans ton Carnet, à fabriquer quand tu veux." });
      }
    } else {
      A.fail(r.temp || 0);
      vibe(20);
      if (bench) { bench.classList.remove("shake"); void bench.offsetWidth; bench.classList.add("shake"); }
    }
    render(true);
  }

  /* le résultat d’un essai en une ligne (quand la carte de résultat est hors de l’écran) */
  function resultLine(r) {
    const n = (id) => "<b>" + esc(I[id].n) + "</b>";
    if (r.kind === "craft") return r.fresh ? "✨ Nouvelle découverte : " + n(r.id) : "+" + fmt(r.n) + " " + n(r.id);
    if (r.kind === "queued") return "✋ " + n(r.id) + " : prêt dans " + fmtTime(r.time) + ".";
    if (r.kind === "learn") return "📖 Recette trouvée : " + n(r.id) + (r.missing ? ". Il manque " + Object.keys(r.missing).map((k) => fmt(r.missing[k]) + " " + esc(I[k].n)).join(", ") + "." : ". À fabriquer quand tu veux.");
    if (r.kind === "blocked") return "🔥 " + n(r.id) + " : " + needText(r.id, r.info, true) + ".";
    if (r.kind === "owned") return "Tu possèdes déjà " + n(r.id) + ".";
    if (r.kind === "busy") return "Tes mains sont déjà bien occupées.";
    if (r.kind === "fail") return "<b>" + D.TEMPS[r.temp || 0].n + "</b> · " + esc(WHY[r.why] || "") + (r.sec ? " · Une chaleur étrange : ce mélange cache quelque chose." : "");
    return "";
  }
  /* l’outil du geste s’abat sur l’établi */
  function strike(g, bench, ok) {
    const fx = $("#fx");
    if (!fx || !bench || !bench.animate) return;
    const r = bench.getBoundingClientRect();
    const el = document.createElement("div");
    el.className = "strike";
    el.innerHTML = gIc(g);
    el.style.left = r.left + r.width / 2 - 27 + "px";
    el.style.top = r.top + 38 + "px";
    fx.appendChild(el);
    const swing = ["chauffer", "electriser", "graver", "synthetiser", "transmuter", "accorder"].includes(g)
      ? [{ transform: "scale(.4)", opacity: 0 }, { transform: "scale(1.25)", opacity: 1, offset: 0.45 }, { transform: "scale(1)", opacity: 0 }]
      : [{ transform: "translate(40px,-50px) rotate(55deg)", opacity: 0 }, { transform: "translate(18px,-30px) rotate(40deg)", opacity: 1, offset: 0.3 },
        { transform: "translate(0,6px) rotate(-18deg)", opacity: 1, offset: 0.55 }, { transform: "translate(6px,-6px) rotate(-6deg)", opacity: 0 }];
    el.animate(swing, { duration: ok ? 560 : 420, easing: "ease-in" }).onfinish = () => el.remove();
  }
  function celebrate(btn, id, n, bonus) {
    const p = elCenter(btn);
    A.craft(I[id].r[0]);
    floater("+" + fmt(n) + " " + I[id].n, p.x, p.y - 16, "var(--good)");
    if (bonus) setTimeout(() => floater("★ +" + fmt(bonus), p.x, p.y - 30, "var(--intu)"), 200);
    sparks(p.x, p.y, 8);
    vibe(10);
  }
  function craftFrom(btn) {
    const id = btn.dataset.cr;
    const n = btn.dataset.n === "max" ? E.maxPlan(id) : Number(btn.dataset.n);
    if (n > 0) handQueue(btn, id, n, true);
    else toast(whyNot(id, 1, true), { key: "nope" });
  }
  function chainCraft(btn, id, times) { handQueue(btn, id, times || 1, true); }
  /* toute commande part dans la file des commandes, où mains et machines avancent ensemble */
  function handQueue(btn, id, n) {
    A.init();
    const r = E.order(id, n);
    if (!r.ok) {
      if (r.why === "plan") { openTree(id, n); return false; }
      A.fail(0);
      toast(r.why === "full" ? "File pleine : " + D.HAND.max + " commandes en attente au maximum." : r.why === "queued" ? esc(I[id].n) + " : déjà en cours de fabrication." : whyNot(id, n, true));
      return false;
    }
    A.click();
    const p = elCenter(btn);
    floater("✋ " + fmtTime(r.time), p.x, p.y - 16, "var(--muted)");
    const missKeys = r.missing ? Object.keys(r.missing).filter((k) => r.missing[k] > 1e-9) : [];
    const sub = r.job.s.length - 1;
    if (missKeys.length) {
      const mTxt = missKeys.map((k) => fmt(Math.ceil(r.missing[k])) + " " + esc(I[k].n.toLowerCase())).join(", ");
      toast("✋ Commande lancée : <b>" + esc(I[id].n) + "</b>" + (n > 1 ? " ×" + fmt(n) : "") + " · il manque : " + mTxt + ".");
    } else if (sub > 0) {
      toast("⚡ " + esc(I[id].n) + ", avec " + sub + " pièce" + (sub > 1 ? "s" : "") + " à fabriquer avant : prêt dans " + fmtTime(r.time) + ".");
    }
    render(true);
    return true;
  }
  function jobWorkersTag(j) {
    const parts = [];
    if (j.hand) parts.push("✋");
    for (const m in j.machs || {}) {
      const w = j.machs[m], it = I[m];
      const lbl = it ? (w.n > 1 ? it.pl || (it.sn || it.n.toLowerCase()) + "s" : it.sn || it.n.toLowerCase()) : m;
      parts.push(w.n + " " + lbl);
    }
    return parts.join(" + ");
  }
  function jobMissTag(j) {
    const ks = Object.keys(j.miss || {}).filter((k) => j.miss[k] > 1e-9);
    if (!ks.length) return "";
    return "il manque : " + ks.map((k) => fmt(Math.ceil(j.miss[k])) + " " + I[k].n.toLowerCase()).join(", ");
  }
  /* la file de « Tes mains » : ce qui est en cours, ce qui attend */
  function handsHTML() {
    const h = E.handInfo();
    if (!h.jobs.length) return '<span class="hh">✋</span><span class="grow tiny muted">Tes mains sont libres.</span>';
    const j = h.jobs[0], it = I[j.id];
    const missTxt = jobMissTag(j);
    const what = missTxt ? '<span style="color:var(--bad)">' + esc(missTxt) + "</span>"
      : j.wait ? '<span style="color:var(--bad)">il manque des ressources</span>'
      : j.steps.length > 1 ? "étape " + (j.i + 1) + "/" + j.steps.length + " · " + esc(I[j.step].n) : E.isUnique(it) ? "" : fmt(j.done) + "/" + fmt(j.n);
    const pct = Math.min(100, 100 * (j.frac || 0));
    return '<span class="hh">✋</span>' + icon(j.id, "sm") + '<div class="grow hmain" data-hopen><div class="small ell"><b>' + esc(it.n) + "</b>" + (E.isUnique(it) ? "" : " ×" + fmt(j.n)) +
      ' <span class="tiny muted">' + what + '</span></div><div class="bar"><i data-hp style="width:' + pct.toFixed(1) + '%"></i></div></div>' +
      '<span class="tiny muted" data-hl="0">' + fmtTime(j.left) + "</span>" + (h.jobs.length > 1 ? '<button class="hmore" data-hopen>+' + (h.jobs.length - 1) + "</button>" : "") +
      '<button class="hx" data-hcancel="0" aria-label="Annuler">✕</button>';
  }
  /* ------------------------------------------------------------ l’action qui tourne */
  function startHarvest(key) {
    A.init();
    const i = key.indexOf(":"), z = key.slice(0, i), res = key.slice(i + 1);
    if (S().act && S().act.k === "harv" && S().act.res === res && S().act.z === z) { E.stopAct(); A.click(); render(true); return; }
    if (!E.startAct({ k: "harv", z, res })) { A.fail(0); toast(esc(I[res].n) + " ne se récolte pas à la main.", { key: "act" }); return; }
    A.click();
    toast("▶ Récolte en continu : " + esc(I[res].n.toLowerCase()) + ".", { key: "act" });
    render(true);
  }
  /* la barre au-dessus des onglets : la commande en tête de file, ou la récolte continue */
  function actBar() {
    const bar = $("#actbar"), a = E.actInfo(), hi = E.handInfo();
    if (!a && !hi.jobs.length) { if (!bar.classList.contains("hidden")) { bar.classList.add("hidden"); bar.dataset.sig = ""; document.body.classList.remove("has-act"); } return; }
    bar.classList.remove("hidden");
    document.body.classList.add("has-act");
    let sig, frac, line;
    if (hi.jobs.length) {
      const j = hi.jobs[0], w = jobWorkersTag(j), miss = jobMissTag(j);
      sig = "j:" + j.id + ":" + j.n + ":" + w + ":" + miss + ":" + hi.jobs.length + (a ? ":h" : "");
      frac = j.frac !== undefined ? j.frac : (j.tot ? 1 - j.left / j.tot : 0);
      line = E.isUnique(I[j.id]) ? fmtTime(j.left) : fmt(j.done) + "/" + fmt(j.n) + (miss ? " · " + miss : "");
    } else {
      sig = "h:" + a.res; frac = a.frac; line = "+" + fmt(a.got);
    }
    if (bar.dataset.sig !== sig) {
      bar.dataset.sig = sig;
      let ic, name;
      if (hi.jobs.length) {
        const j = hi.jobs[0], w = jobWorkersTag(j);
        ic = icon(j.id, "sm");
        name = "Fabrication · " + esc(I[j.id].n) + (E.isUnique(I[j.id]) ? "" : " ×" + fmt(j.n)) +
          (w ? " · " + esc(w) : "") +
          (hi.jobs.length > 1 ? ' <span class="tiny muted">+' + (hi.jobs.length - 1) + "</span>" : "");
      } else {
        ic = icon(a.res, "sm");
        name = "Récolte · " + esc(I[a.res].n);
      }
      bar.innerHTML = '<button class="ab-main" data-ab="hands">' + ic + '<span class="ab-t"><span class="ab-n">' + name + '</span><span class="ab-bar"><i></i></span></span><b class="ab-c"></b></button>' +
        (a ? '<button class="ab-x" data-ab="stop" aria-label="Arrêter">■</button>' : "");
      iconize(bar);
    }
    bar.querySelector(".ab-bar i").style.width = (Math.max(0, Math.min(1, frac)) * 100).toFixed(1) + "%";
    bar.querySelector(".ab-c").textContent = line;
  }
  /* les gestes et la récolte : niveaux, ce qu’ils donnent, le prochain palier */
  function skillName(g) { return g === "recolte" ? D.SKILL_RECOLTE.n : D.GESTES[g].n; }
  function skillsHTML() {
    const st = S();
    const shown = E.SKILLS.filter((g) => g === "recolte" || E.gesteOK(g) || (st.skills[g] || 0) > 0);
    return '<div class="kicker">Tes mains</div><h2>Actions et récolte</h2><p class="small muted">Chaque pièce fabriquée à la main fait progresser son action, et chaque récolte fait progresser la récolte. Chaque niveau rend l’action 1 % plus rapide (pour la récolte : 1 % de ressources en plus). Aux niveaux ' + D.SKILL.perks.join(", ") + ", tu gagnes une chance d’avoir une pièce en plus. À la relève, tu gardes un dixième de ta progression.</p>" +
      '<div class="skills">' + shown.map((g) => {
        const k = E.skill(g);
        return '<div class="skill"><span class="sk-ic">' + (g === "recolte" ? gi(GI.ui && GI.ui.recolte || "sickle") : gIc(g)) + '</span><div class="grow"><div class="row between"><b>' + esc(skillName(g)) + '</b><span class="sk-l">niv. ' + k.lvl + "</span></div>" +
          '<div class="bar"><i style="width:' + (k.frac * 100).toFixed(1) + '%"></i></div><div class="tiny muted">' + (k.lvl < D.SKILL.max ? fmt(k.hi - k.xp) + " d’expérience avant le niveau " + (k.lvl + 1) : "Niveau maximal") +
          (k.perks ? " · pièce en plus : " + Math.round(E.perkChance(g) * 100) + " %" : "") + (k.next ? " · palier au niveau " + k.next : "") + "</div></div></div>";
      }).join("") + '</div><div class="acts"><button class="btn pri" data-m="close">Fermer</button></div>';
  }
  function openSkills() { openModal({ html: skillsHTML() }); }
  /* la liste des commandes en détail : ce qui est en cours, qui y travaille, ce qui manque, et de quoi annuler */
  function handsSheet() {
    const hi = E.handInfo();
    if (!hi.jobs.length) return '<div class="kicker">Commandes</div><h2>Aucune commande en cours</h2><div class="acts"><button class="btn pri" data-m="close">Fermer</button></div>';
    return '<div class="kicker">Commandes</div><h2>' + (hi.left > 0 ? "Fini dans ~" + fmtTime(hi.left) : "Commandes en cours") + '</h2><div class="picklist">' +
      hi.jobs.map((j, i) => {
        const w = jobWorkersTag(j), miss = jobMissTag(j);
        const sub = [];
        if (w) sub.push(w);
        if (miss) sub.push(miss);
        else if (j.wait) sub.push("en attente");
        else sub.push("prête dans ~" + fmtTime(i ? j.at : j.left));
        return '<div class="pick">' + icon(j.id, "sm") + '<span class="grow">' + esc(I[j.id].n) + (E.isUnique(I[j.id]) ? "" : " ×" + fmt(j.n) + " (" + fmt(j.done) + "/" + fmt(j.n) + ")") +
          '<br><span class="tiny muted">' + esc(sub.join(" · ")) + "</span></span>" +
          '<button class="mini" data-m="hc" data-i="' + i + '" aria-label="Annuler">✕</button></div>';
      }).join("") +
      '</div><p class="tiny muted">Annuler une commande rend ses ressources à la Réserve.</p><div class="acts"><button class="btn pri" data-m="close">Fermer</button></div>';
  }
  function openHands() {
    openModal({
      html: handsSheet(), refresh: handsSheet,
      on: {
        hc: (b) => {
          const i = Number(b.dataset.i), j = S().hand.q[i];
          if (j && E.cancelJob(i)) { A.click(); toast("Annulé : " + esc(I[j.id].n) + ". Matières restituées."); }
          const box = $("#modal .modal-box");
          box.innerHTML = handsSheet(); iconize(box);
          render(true);
          return true;
        }
      }
    });
  }
  const handSig = () => S().hand.q.map((j) => j.id + ":" + j.i + ":" + j.k + ":" + (j.w ? 1 : 0) + ":" + JSON.stringify(j.miss)).join("|");
  function studyHTML(id) {
    const st = S();
    if (!st.studied[id]) {
      const c = E.studyCost(id);
      return '<div class="study"><button class="btn small" data-m="study"' + (st.intu < c ? " disabled" : "") + ">🔍 Étudier · ✨" + c + '</button><span class="tiny muted">Pour savoir avec quelles actions la tenter.</span></div>';
    }
    const r = E.reactions(id), gs = D.GESTE_ORDER.filter((g) => r[g]);
    return '<div class="study"><span class="tiny muted">🔍 Étudiée.</span> ' + (gs.length ? '<span class="tiny muted">Encore à trouver :</span> ' + gs.map((g) => '<span class="g">' + gIc(g) + " " + D.GESTES[g].n + " · " + r[g] + "</span>").join(" ")
      : '<span class="tiny muted">Rien de plus à tenter avec tes actions et tes ressources, pour l’instant.</span>') + "</div>";
  }
  /* Détail récursif d’une recette : étapes, matières utilisées, ce qui manque. */
  function treeHTML(id, n) {
    const p = E.plan(id, n), st = S();
    // un extracteur ou une machine (prix qui monte) ne se commande qu’avec tout en main
    const canLaunch = !E.blocker(id) && !p.locked.length && !Object.keys(p.blocked).length && (p.ok || !E.isScaled(I[id]));
    let h = '<div class="kicker">Tout ce qu’il faut fabriquer</div><div class="row">' + icon(id, "lg") + '<div class="grow"><h2 style="margin:0">' + esc(I[id].n) + "</h2>";
    if (!E.isUnique(I[id])) h += '<div class="row" style="margin-top:6px"><button class="mini" data-m="tn" data-d="-1">−</button><b style="min-width:40px;text-align:center">×' + fmt(n) + '</b><button class="mini" data-m="tn" data-d="1">+</button><button class="btn small ghost" data-m="tmax">Max</button></div>';
    h += "</div></div>";
    h += '<h3 class="sub">Étapes</h3><div class="tsteps">' + p.steps.map(([x, k]) => '<div class="tstep">' + D.GESTES[I[x].r[0]].ic + ' <span class="tiny muted">' + D.GESTES[I[x].r[0]].n + "</span> " + icon(x, "sm") + " <b>" + esc(I[x].n) + '</b> <span class="muted">× ' + fmt(k) + "</span></div>").join("") + "</div>";
    const used = Object.keys(p.used);
    if (used.length) h += '<h3 class="sub">Pris dans la Réserve</h3><div class="row wrap small">' + used.map((k) => '<span class="ing">' + icon(k, "sm") + fmt(p.used[k]) + " " + esc(I[k].n) + "</span>").join("") + "</div>";
    const miss = Object.keys(p.missing).filter((k) => !p.locked.includes(k) && !p.blocked[k]);
    if (miss.length) h += '<h3 class="sub" style="color:var(--bad)">' + (E.isScaled(I[id]) ? "Il manque" : "Il manque (pris dans la Réserve au fur et à mesure)") + '</h3><div class="row wrap small">' + miss.map((k) => '<span class="ing lack">' + icon(k, "sm") + fmt(p.missing[k]) + " " + esc(I[k].n) + "</span>").join("") + "</div>";
    if (p.locked.length) h += '<p class="why">Recettes encore inconnues : ' + p.locked.map((k) => esc(I[k].n)).join(", ") + "</p>";
    const bl = Object.keys(p.blocked);
    if (bl.length) h += '<p class="why">' + bl.map((k) => esc(I[k].n) + " : " + needText(k, p.blocked[k], true)).join(" · ") + "</p>";
    h += '<div class="acts"><button class="btn" data-m="close">Fermer</button>' + (st.track && st.track.id === id ? "" : '<button class="btn" data-m="track">🎯 Suivre</button>') +
      '<button class="btn pri" data-m="go"' + (canLaunch ? "" : " disabled") + ">⚡ Commander (×" + fmt(n) + ")</button></div>";
    return h;
  }
  function openTree(id, n) {
    let times = Math.max(1, n || 1);
    openModal({
      html: treeHTML(id, times),
      on: {
        tn: (b) => { times = Math.max(1, times + Number(b.dataset.d) * (times >= 100 ? 10 : 1)); $("#modal .modal-box").innerHTML = treeHTML(id, times); return true; },
        tmax: () => { times = Math.max(1, E.maxPlan(id)); $("#modal .modal-box").innerHTML = treeHTML(id, times); return true; },
        track: () => { E.setTrack(id); toast("🎯 Suivi : <b>" + esc(I[id].n) + "</b> (en haut du Domaine)"); },
        go: (b) => { chainCraft(b, id, times); }
      }
    });
  }

  /* Aller à la recette d’un objet dans le Carnet (ou à sa zone s’il se récolte). */
  /* ------------------------------------------------------------ fenêtres de recettes
   * Toucher un objet ouvre sa fiche ; ses ingrédients, ce qu’il sert à fabriquer
   * et sa station sont cliquables. ← revient à la fiche précédente. */
  function goto(id) {
    if (!I[id]) return;
    // Curiosité : Anneau sans fard
    if (id === "anneau_lourd" && E.count("anneau_lourd") > 0) {
      E.take("anneau_lourd", E.count("anneau_lourd"));
      E.addCurio("anneau");
      toast("Il est très lourd pour sa taille. Tu le reposes.");
      render(true);
      return;
    }
    // Curiosité : Dé à vingt faces
    if (id === "de_vingt") {
      const st = S();
      st.meta = st.meta || {};
      st.meta.d20Rolls = (st.meta.d20Rolls || 0) + 1;
      const roll = st.meta.d20Rolls === 1 ? 20 : (Math.floor(Math.random() * 20) + 1);
      toast("🎲 Tu le lances : " + roll + ".");
    }
    // Curiosité : WTC (Antoine Daniel) - 10 ouvertures en moins de 20s
    const now = Date.now();
    if (U.inspectHist && U.inspectHist.id === id) {
      U.inspectHist.times = U.inspectHist.times.filter((t) => now - t <= 20000);
      U.inspectHist.times.push(now);
      if (U.inspectHist.times.length >= 10) {
        if (E.addCurio("wtc")) {
          U.wtcItalic = true;
        }
      }
    } else {
      U.inspectHist = { id, times: [now] };
    }
    U.rstack = [id];
    swapModal(recipeModal());
  }
  function recipeNav(id) {
    if (!I[id]) return;
    U.rstack = (U.rstack || []).concat(id).slice(-30);
    A.page();
    swapModal(recipeModal());
  }
  const recHere = () => (U.rstack && U.rstack.length ? U.rstack[U.rstack.length - 1] : null);
  function recipeModal() {
    const id = recHere(), it = I[id], st = S();
    const known = !!st.known[id], visible = known || visibleRecipes().includes(id) || !it.r;
    const uniq = E.isUnique(it), owned = uniq && (st.made[id] || 0) > 0;
    const nav = (k, extra) => '<button class="ing link" data-m="nav" data-id="' + k + '">' + (st.seen[k] || st.known[k] ? icon(k, "sm") : '<span class="ic sm unk">?</span>') + esc(I[k].n) + (extra || "") + "</button>";
    const isWtcItalic = U.wtcItalic;
    if (isWtcItalic) U.wtcItalic = false;
    let h = '<div class="rwin"' + (isWtcItalic ? ' style="font-style:italic"' : "") + '><div class="row">' + (known || !it.r || st.seen[id] ? icon(id, "lg") : '<span class="ic lg unk">?</span>') +
      '<div class="grow"><div class="kicker">' + TYPE[it.t] + (D.AGES[it.a] ? " · " + esc(D.AGES[it.a].n) : "") + "</div><h2 style=\"margin:0\">" + (nameShown(id) ? esc(it.n) : "Recette inconnue") + "</h2>" +
      (E.stars(id) ? '<div class="stars" title="Maîtrise : fabriqué ' + fmt(st.made[id] || 0) + ' fois">' + "★".repeat(E.stars(id)) + ' <span class="tiny muted">maîtrise</span></div>' : "") + "</div>" +
      (!uniq && !E.isScaled(it) && (st.inv[id] || 0) > 0 ? '<button class="pinb fav' + (favs()[id] ? " on" : "") + '" data-m="fav" aria-label="Ressource favorite" title="Ressource favorite (en tête de liste à l’Atelier)">' + (favs()[id] ? "♥" : "♡") + "</button>" : "") +
      (it.r && known ? '<button class="pinb' + (st.pins[id] ? " on" : "") + '" data-m="pin" aria-label="Épingler la recette" title="Épingler la recette en haut de l’Atelier">' + (st.pins[id] ? "★" : "☆") + "</button>" : "") + "</div>";
    if (!visible) {
      h += '<p class="small muted">Un objet d’un âge que tu n’as pas encore atteint. Avance dans le jeu pour en savoir plus.</p>';
    } else {
      // d’abord ce que fait l’objet (la couche « jeu »), puis le récit, à part
      if (known || !it.r) {
        if (it.u) h += '<p class="small">' + esc(it.u) + "</p>";
        else if (TYPE_HINT[it.t]) h += '<p class="tiny muted">' + TYPE_HINT[it.t] + "</p>";
        if (it.d) h += '<p class="serif rdesc"><i>' + esc(itD(it)) + "</i></p>";
      }
      // l’effet en vert, sauf ce que la ligne « jeu » dit déjà
      const plain = (t) => t.toLowerCase().replace(/[^a-zà-ÿ0-9]+/g, " ").trim();
      const fx = fxList(id).filter((f) => !(it.u && plain(it.u).includes(plain(f))));
      if (fx.length) h += '<p class="small" style="color:var(--good)">' + esc(fx.join(" · ")) + "</p>";
      const f = E.flows();
      const inR = E.rate(id) + (f.prod[id] || 0);
      const outR = f.cons[id] || 0;
      const netR = inR - outR;
      let flowInfo = "";
      if (inR > 1e-4 || outR > 1e-4) {
        const netStr = (netR > 1e-4 ? "+" : netR < -1e-4 ? "-" : "") + perMin(Math.abs(netR));
        const color = netR > 1e-4 ? "var(--good)" : netR < -1e-4 ? "var(--bad)" : "var(--muted)";
        flowInfo = ' · Solde : <b style="color:' + color + '">' + netStr + "</b>" +
          (inR > 1e-4 && outR > 1e-4 ? ' <span class="tiny muted">(+' + perMin(inR) + " / -" + perMin(outR) + ")</span>" : "");
      }
      h += '<p class="small muted">' + (uniq ? (owned ? "Tu le possèdes." : "Tu ne l’as pas encore.") : "Disponible : <b>" + fmt(st.inv[id] || 0) + "</b>" + flowInfo) + "</p>";
      const zid = E.RES_ZONE[id];
      if (zid) h += '<div class="row wrap small">Se récolte dans : <button class="ing link" data-m="zone" data-z="' + zid + '">' + (GI.zones && GI.zones[zid] ? gi(GI.zones[zid]) : E.ZONES[zid].ic) + " " + esc(zoneName(zid)) + "</button>" +
        (E.zoneOpen(zid) ? "" : ' <span class="tiny muted">(terre pas encore atteinte)</span>') + "</div>";
      if (it.r) {
        h += '<h3 class="sub">Recette</h3>';
        if (known) {
          const cost = E.costFor(id);
          h += '<div class="rrow">' + gesteChip(id) + '<span class="muted">donne ' + fmt(it.r[2]) + "</span></div>" +
            '<div class="rings">' + Object.keys(cost).map((k) => {
              const have = st.inv[k] || 0, lack = have + 1e-9 < cost[k];
              const ok = !lack;
              const canMake = lack && I[k].r && E.plan(k, Math.ceil(cost[k] - have)).ok;
              return '<button class="ring ' + (ok ? "ok" : "lack") + '" data-m="nav" data-id="' + k + '">' + icon(k, "sm") +
                '<span class="grow">' + esc(I[k].n) + (canMake ? ' <span class="can-make">(prêt à fabriquer)</span>' : "") + '</span>' +
                '<span class="tiny">' + fmt(have) + " / " + fmt(cost[k]) + (ok ? " ✓" : "") + '</span><span class="go">›</span></button>';
            }).join("") + "</div>";
          const b = E.blocker(id), opt = it.r[3] || {};
          const station = b && b.why === "heat" ? E.stationFor("chauffer", b.heat, 0) : b && b.why === "lvl" ? E.stationFor(it.r[0], 0, b.lvl) : b && b.why === "geste" && it.r[0] !== "accorder" ? E.stationFor(it.r[0], 0, 0) : null;
          if (b && b.why !== "owned") h += '<p class="why">' + (station ? "Il faut d’abord : " + nav(station) + (b.why === "heat" ? " (" + fmtHeat(b.heat) + ")" : "") : cap1(needText(id, b))) + "</p>";
          else if (opt.heat || opt.lvl) {
            const sta = opt.heat ? E.stationFor("chauffer", opt.heat, 0) : E.stationFor(it.r[0], 0, opt.lvl);
            if (sta) h += '<p class="tiny muted">Station : ' + nav(sta) + (S().made[sta] || E.count(sta) >= 1 ? " ✓ tu l’as" : "") + "</p>";
          }
          if (E.automatable(id)) {
            const mneed = E.machFor(id);
            if (mneed && I[mneed]) h += '<p class="small muted">Machine : ' + esc(I[mneed].n) + " ou mieux</p>";
          }
          if (!owned && !b) {
            h += '<div class="row wrap rbtns">' + craftBtns(id).replace(/data-cr=/g, 'data-m="cr" data-cr=') +
              '<button class="btn small ghost" data-m="tree">🌳 Détail</button>' + (st.track && st.track.id === id ? "" : '<button class="btn small ghost" data-m="track">🎯 Suivre</button>') + "</div>";
          }
        } else {
          const lvl = st.hints[id] || 0, big = mainIngredient(id), n = Object.keys(it.r[1]).length;
          if (it.h) h += '<div class="riddle small">« ' + esc(it.h) + " »</div>";
          h += '<p class="small muted">Action : ' + (lvl >= 1 ? gesteChip(id) : "?") + " · " + n + " ressource" + (n > 1 ? "s" : "") + (lvl >= 2 ? " dont " + nav(big) : "") + "</p>";
          const dc = E.decipherCost(id);
          if (dc !== null) {
            const rev = ["Révèle l’action.", "Révèle une des ressources.", "Révèle la recette entière."][lvl];
            const ok = st.intu >= dc;
            h += '<div class="decipher"><button class="btn small' + (ok ? " pri" : "") + '" data-m="decipher"' + (ok ? "" : " disabled") + ">✨ Déchiffrer : " + dc + " ✨</button>" +
              '<div class="tiny muted">' + rev + (ok ? "" : " Pas assez d’Intuition (tu as " + Math.floor(st.intu) + " ✨).") + "</div></div>";
          }
          const m = E.memory();
          if (m && m.id === id) h += memoryHTML(m);
          else h += '<p class="tiny muted">À toi de la trouver à l’Atelier. Étudier les ressources aide à savoir quoi tenter.</p>';
        }
      }
      const uses = Object.keys(I).filter((k) => I[k].r && I[k].r[1][id] !== undefined);
      const ku = uses.filter((k) => st.known[k]), unk = uses.length - ku.length;
      if (uses.length) {
        // à ta portée : le geste maîtrisé et toutes les matières déjà vues ; les autres viendront plus tard
        const now = Object.values(E.reactions(id)).reduce((a, b) => a + b, 0), later = unk - now;
        const unkTxt = (now ? now + " à trouver dès maintenant" : "") + (now && later ? ", " : "") + (later ? later + " plus tard" : "");
        h += '<h3 class="sub">Sert à fabriquer</h3><div class="row wrap">' + ku.map((k) => nav(k)).join("") +
          (unk ? '<span class="tiny muted">' + (ku.length ? "et d’autres recettes encore inconnues : " : "Recettes encore inconnues : ") + unkTxt + "</span>" : "") + "</div>";
        if (unk && st.seen[id]) h += studyHTML(id);
      }
    }
    if (E.hasCurio && E.hasCurio("wtc")) {
      h += '<p class="small muted center" style="font-style:italic">« On coupe ? »</p>';
    }
    const back = U.rstack.length > 1;
    h += '<div class="acts">' + (back ? '<button class="btn" data-m="back">← ' + esc(I[U.rstack[U.rstack.length - 2]].n) + "</button>" : U.rfrom ? '<button class="btn" data-m="rfrom">← Retour</button>' : "") +
      (it.r && known ? '<button class="btn ghost" data-m="carnet">📖 Carnet</button>' : "") + '<button class="btn pri" data-m="close">Fermer</button></div></div>';
    const redraw = () => { if (U.mcur && U.mcur.rec) swapModal(recipeModal()); };
    return {
      rec: true,
      html: h,
      onClose: () => { U.rstack = []; },
      on: {
        nav: (b) => { recipeNav(b.dataset.id); return true; },
        back: () => { U.rstack.pop(); A.page(); swapModal(recipeModal()); return true; },
        rfrom: () => { const f = U.rfrom; U.rfrom = null; closeModal(); if (f) setTimeout(f, 80); return true; },
        zone: (b) => { const z = b.dataset.z; if (E.zoneOpen(z)) { U.zone = z; setTimeout(() => { setTab("domaine"); Dom.focusZone(z); }, 60); } else { toast("Tu n’as pas encore atteint cette terre."); return true; } },
        cr: (b) => { craftFrom(b); redraw(); return true; },
        chain: (b) => { const r = E.plan(id, 1); if (!r.ok) { setTimeout(() => openTree(id, 1), 60); return; } chainCraft(b, id, 1); redraw(); return true; },
        tree: () => { setTimeout(() => openTree(id, 1), 60); },
        track: () => { E.setTrack(id); A.click(); toast("🎯 Suivi : <b>" + esc(it.n) + "</b> (en haut du Domaine)"); redraw(); return true; },
        pin: () => { E.togglePin(id); A.click(); redraw(); return true; },
        fav: () => { const f = favs(); if (f[id]) delete f[id]; else f[id] = 1; A.click(); redraw(); if (U.tab === "atelier") render(true); return true; },
        study: () => { if (E.study(id)) { A.discover(); if (U.tab === "atelier") render(true); } redraw(); return true; },
        decipher: () => { const r = E.decipher(id); if (r.ok) { if (r.lvl >= 3) A.discover(); save(); render(true); } redraw(); return true; },
        carnet: () => { setTimeout(() => showInCarnet(id), 60); }
      }
    };
  }
  function showInCarnet(id) {
    const it = I[id];
    U.q = ""; U.carnetFilter = "tout"; U.openAges[it.a] = true;
    if (E.isUnique(it) && S().made[id] > 0) U.showOwned = true;
    setTab("carnet");
    setTimeout(() => { const el = $('[data-rec="' + id + '"]'); if (el) { el.scrollIntoView({ block: "center", behavior: "smooth" }); flash(el); } }, 60);
  }
  function flash(el) { el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash"); }
  const openItemInfo = (id) => goto(id);

  /* ------------------------------------------------------------ menus */
  function applyTheme() {
    if (typeof document === "undefined") return;
    const st = S();
    const pref = (st.settings && st.settings.theme) || "auto";
    let dark = false;
    if (pref === "dark") dark = true;
    else if (pref === "light") dark = false;
    else if (typeof window !== "undefined" && window.matchMedia) {
      dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    document.body.classList.toggle("theme-dark", dark);
    document.body.setAttribute("data-theme", dark ? "dark" : "light");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#151311" : "#f2eada");
  }

  function applyLargeText() {
    if (typeof document === "undefined") return;
    const st = S();
    const lt = !!(st.settings && st.settings.largeText);
    document.body.classList.toggle("large-text", lt);
  }

  /* lancer l’exploration du prochain lieu d’une terre */
  function explore(z, xid) {
    const why = xid ? (S().exp.active ? "Tu explores déjà ailleurs : une exploration à la fois." : "") : expWhy(z);
    if (why) { A.fail(0); toast(why, { key: "nope" }); return; }
    const r = E.startExp(z, xid);
    if (r.ok) { A.init(); A.explore(); toast("🧭 Exploration lancée : elle avance toute seule."); }
    render(true);
  }
  /* ------------------------------------------------------ fouilles (expéditions longues) */
  const FOU = () => ((E.RECIT || {}).fouille || {}).ui || {};
  function fouiller(z, i, lvl) {
    const r = E.fouilleLancer(z, i, lvl);
    if (!r.ok) { A.fail(0); toast(r.why === "busy" ? FOU().busy : r.why === "palier" ? (lvl === 2 ? FOU().avant1 : FOU().avant2) : "", { key: "nope" }); return; }
    A.init(); A.explore();
    toast("🧭 " + esc(FOU().parti || ""));
    render(true);
  }
  function recolterFouille() {
    const r = E.fouilleRecolter();
    if (!r.ok) { A.fail(0); if (r.why === "pas_fini") toast(esc(FOU().pasFini || ""), { key: "nope" }); }
  }

  /* la relève forcée s’ouvre une fois par cycle (sa fenêtre est dans js/memoire.js) */
  let forcedModalShown = false;
  function checkForcedReleve() {
    if (!forcedModalShown && E.canForcedReleve && E.canForcedReleve()) {
      forcedModalShown = true;
      setTimeout(openForcedReleve, 400);
    }
  }

  /* ============================================================ ÉVÉNEMENTS DU MOTEUR */
  function bindEngine() {
    E.on("struct", () => { U.dirty = true; checkForcedReleve(); });
    E.on("cycle", () => { forcedModalShown = false; });
    /* un nouvel âge : un vrai moment, dans la file des fenêtres, après la réminiscence qui l’a amené */
    E.on("age", (a) => {
      const ag = D.AGES[a], miles = (E.milestones()[a] || []).filter((x) => !x.done).length;
      applyAge();
      setTimeout(() => openModal({
        cls: "agecard", persistent: true,
        html: '<div class="kicker center">Tu entres dans</div><h2 class="center">' + esc(ag.n) + '</h2><p class="center q">« ' + esc(ag.q) + " »</p>" +
          '<p class="center small muted">Âge ' + (a + 1) + " sur " + D.AGES.length + (miles ? " · " + miles + " étape" + (miles > 1 ? "s" : "") + " t’attend" + (miles > 1 ? "ent" : "") + " 🏁" : "") + "</p>" +
          '<div class="acts"><button class="btn pri" data-m="close">Continuer</button></div>',
        onOpen: () => { A.age(); sparks(innerWidth / 2, innerHeight * 0.4, 30, ag.c); fireworks(); vibe([20, 60, 20, 60, 40]); }
      }), 700);
    });
    E.on("learn", () => badge("carnet"));
    /* un passage devient possible, puis il est franchi */
    E.on("passage", (z) => {
      badge("domaine");
      setTimeout(() => toast("🚧 <b>" + esc(D.PASSAGES[z].n) + "</b> : pour entrer dans " + esc(zoneName(z)) + ", apporte les matières nécessaires (dans le Domaine ou sur la Carte).", { key: "pass:" + z, p: 2 }), 900);
    });
    E.on("passdone", (o) => {
      const first = !S().meta.tracesTotal && E.releveGain() === o.tr;
      fete({ ic: "🚧", kick: "Passage franchi", title: D.PASSAGES[o.z].n, sub: "+" + o.tr + " ✦ Traces à ta prochaine relève" });
      if (first) setTimeout(() => simpleModal("Nouveau", "✦ Tu gagnes des Traces",
        "<p><b>Rien ne presse :</b> continue ta partie aussi longtemps que tu veux.</p>" +
        "<p>Chaque passage franchi laisse des Traces ✦. Quand tu le veux, tu peux <b>passer le relais</b> : un nouveau Semeur repart du début, avec tes recettes et les améliorations achetées avec ces Traces.</p>" +
        '<p class="small muted">Touche ✦ en haut de l’écran pour voir ce qu’elles permettent d’acheter.</p>', "Compris"), 2200);
    });
    E.on("zone", (z) => {
      U.zone = z;
      // la découverte qui ouvre cette terre le dit déjà (« Débloque : … ») : pas de second message
      setTimeout(() => { if (Date.now() - (U.lastDiscover || 0) > 1500) toast("Nouvelle terre : <b>" + esc(zoneName(z)) + "</b>. Ses gisements t’attendent dans le Domaine."); }, 80);
      badge("carte");
      setTimeout(() => { if (U.tab === "domaine") Dom.focusZone(z); else U.domOpen = z; }, 50);
    });
    E.on("discover", (id) => {
      const it = I[id];
      // hors de l’Atelier, la recette était déjà connue : c’est sa première fabrication
      if (!U.forging && !it.sec) fete({ id, kick: "Première fabrication", title: it.n, sub: fxText(id) });
      U.lastDiscover = Date.now();
      if (it.e && it.e.sky) badge("cosmos");
      if (it.t === "mach") badge("domaine");
      updateBadges();
    });
    E.on("event", (ev) => {
      setTimeout(() => simpleModal("Réminiscence", esc(I[ev.id].n), loreHTML(ev.txt)), 500);
    });
    E.on("guidehint", (h) => {
      const it = I[h.id];
      // une variante par objet, pour que deux souvenirs ne se ressemblent pas mot pour mot
      const vs = D.GUIDE.lines[h.lvl - 1], k = Array.from(h.id).reduce((a, c) => a + c.charCodeAt(0), 0);
      const line = vs[k % vs.length]
        .replace("{g}", D.GESTES[it.r[0]].n.toLowerCase())
        .replace("{i}", E.the(mainIngredient(h.id)));
      A.secret();
      toast("💭 <b>" + esc(it.n) + "</b> : " + esc(line));
      badge("domaine");
    });
    E.on("level", (x) => {
      if (!U.live) return;
      const k = E.skill(x.g);
      toast("<b>" + esc(skillName(x.g)) + "</b> niveau " + x.lvl + (x.perk ? " : une chance sur " + Math.round(1 / (E.perkChance(x.g) || 1)) + " d’avoir une pièce en plus." : "."), { key: "lvl:" + x.g });
      if (x.perk) A.discover && A.discover();
      void k;
      if (U.tab === "atelier") render(true);
    });
    E.on("actstop", (x) => {
      const a = x.act, n = a.id ? I[a.id].n : I[a.res].n;
      if (x.why === "missing") toast("⟳ Fabrication en boucle arrêtée (" + esc(n.toLowerCase()) + ") : il manque des ressources.", { key: "act" });
      else if (x.why === "zone") toast("Récolte arrêtée : " + esc(n.toLowerCase()) + ".", { key: "act" });
      render(true);
    });
    E.on("tracked", (id) => { toast("🎯 Fabriqué : <b>" + esc(I[id].n) + "</b>. Suivi terminé.", { key: "it:" + id, p: 2 }); });
    E.on("secret", (id) => {
      badge("journal");
      const it = I[id];
      if (it && it.sec) setTimeout(() => { A.secret(); simpleModal("Secret découvert", esc(it.n), '<div class="row" style="margin-bottom:8px">' + icon(id, "lg") + "</div>" + loreHTML(it.d, it.n) + (fxText(id) ? '<p class="small" style="color:var(--good)">' + esc(fxText(id)) + "</p>" : "")); }, 450);
      else if (id === "caveau" || id === "lune7" || id[0] === "c") setTimeout(() => A.secret(), 300);
    });
    E.on("frag", () => badge("journal"));
    E.on("feuillet", (x) => {
      badge("journal");
      const ui = E.RECIT.ui || {};
      if (x.src === "nuit") setTimeout(() => toast("📄 " + esc(ui.nuit || "")), 1500);
      else if (x.src === "cond") toast("📄 " + esc(ui.comptoir || ""));
      else toast("📄 " + esc(ui.feuillet || ""));
    });
    E.on("page", (p) => {
      badge("journal");
      toast("📖 Une page du Livre : n° " + p.n);
    });
    // une fouille finie : un mot, une pastille sur la Carte ; on la reçoit en la touchant
    E.on("fouillePrete", () => { badge("carte"); if (U.live) toast("🧭 " + esc(FOU().prete || ""), { key: "fouille" }); });
    E.on("fouille", (r) => {
      A.found(); badge("journal");
      const U_ = FOU(), gains = Object.keys(r.butin).map((k) => "+" + fmt(r.butin[k]) + " " + I[k].n.toLowerCase()).concat(r.intu ? ["+" + r.intu + " ✨"] : []);
      openModal({
        html: '<div class="kicker">' + esc(U_.kicker || "") + " · " + esc(zoneName(r.z)) + "</div><h2>" + esc(r.x.n) + '</h2><p class="small muted">' + esc(r.niv.n) + "</p>" +
          loreHTML(r.phrase, zoneName(r.z)) +
          '<p class="small">' + esc(U_.rapporte || "") + " : " + esc(gains.join(", ")) + ".</p>" +
          (r.cote ? '<p class="small" style="color:var(--good)">' + esc(U_.nouveau || "") + " : <b>" + esc(r.cote.n) + "</b>.</p>" : "") +
          '<div class="acts"><button class="btn pri" data-m="close">Continuer</button></div>'
      });
      render(true);
    });
    E.on("expdone", (r) => {
      A.found();
      checkForcedReleve();
      if (r.frag) badge("journal");
      if (r.silent) return;
      const F = r.frag && D.FRAGS[r.frag];
      const rw = r.x.rw || {};
      const gains = []
        .concat(rw.inv ? Object.keys(rw.inv).map((i) => "+" + rw.inv[i] + " " + I[i].n) : [])
        .concat(rw.item ? Object.keys(rw.item).map((i) => I[i].n) : [])
        .concat(rw.intu ? ["+" + rw.intu + " ✨"] : []);
      if (r.revisit) {
        openModal({
          html: '<div class="kicker">Exploration · ' + esc(zoneName(r.z)) + "</div><h2>" + esc(F ? (F.n || F.titre) : r.x.n) + "</h2>" +
            loreHTML(r.revisit.t, zoneName(r.z)) +
            (gains.length ? '<p class="small muted">Tu rapportes : ' + esc(gains.join(", ")) + "</p>" : "") +
            '<div class="acts"><button class="btn pri" data-m="close">Continuer</button></div>'
        });
        return;
      }
      if (F && !r.fragNew) { toast("🧭 " + esc(r.x.n) + " : déjà raconté dans ton Journal." + (gains.length ? " Tu rapportes : " + esc(gains.join(", ")) + "." : ""), { key: "exp" }); return; }
      openModal({ html: '<div class="kicker">Exploration · ' + esc(zoneName(r.z)) + "</div><h2>" + esc(F ? (F.n || F.titre) : r.x.n) + "</h2>" + (F ? loreHTML(F.t, (F ? (F.n || F.titre) : r.x.n) || zoneName(r.z)) : "") +
        (gains.length ? '<p class="small muted">Tu rapportes : ' + esc(gains.join(", ")) + "</p>" : "") + '<div class="acts"><button class="btn pri" data-m="close">Continuer</button></div>' });
    });
    E.on("arche", (key) => {
      badge("cosmos");
      if (key === "radio") setTimeout(() => {
        openModal({ html: '<div class="kicker">Poste radio</div><h2>Une voix dans le grésillement</h2><div class="term">' + (D.ARCHE.radio || []).map((l) => '<div class="l">' + esc(E.interpolate(l)) + "</div>").join("") +
          '</div><div class="acts"><button class="btn pri" data-m="close">Continuer</button></div>' });
      }, 900);
    });
    /* une pièce sort des mains : un petit bruit (pas trop souvent), et le compte qui monte */
    let lastHand = 0;
    E.on("handdone", (d) => {
      const now = Date.now();
      if (now - lastHand > 350) { lastHand = now; A.craft(I[d.id].r[0]); }
      const el = U.tab === "atelier" ? $("#hands") : null;
      if (el && d.last) { const p = elCenter(el); floater("+" + fmt(d.n) + " " + I[d.id].n, p.x, p.y - 10, "var(--good)"); if (d.bonus) setTimeout(() => floater("★ +" + fmt(d.bonus), p.x, p.y - 26, "var(--intu)"), 200); }
    });
    E.on("hand", (e) => {
      if (e.kind !== "done") return;
      const it = I[e.job.id], n = e.job.s[e.job.s.length - 1][1];
      if (U.tab !== "atelier") toast("✋ Fini : <b>" + esc(it.n) + "</b>" + (E.isUnique(it) ? "" : " ×" + fmt(n)), { key: "it:" + e.job.id, p: 1 });
      else render(); // pas pendant un appui long sur une matière
    });
    E.on("projstep", (x) => {
      const P = D.PROJECTS[x.pid], s = P.steps[x.step];
      A.discover();
      toast("🏗️ " + esc(P.n) + " : étape « " + esc(s.n) + " » terminée.");
      if (U.tab === "cosmos") render(true);
    });
    E.on("crafted", (id) => {
      if (E.cache().pip && (id === "pip" || Math.random() < 0.3)) setTimeout(() => A.pip(), 250);
      if (I[id] && I[id].t === "ext") {
        badge("domaine");
        // déjà posé par les mains (bouton « + cabane ») : rien à dire
        setTimeout(() => { if (E.freeExt(id) >= 1) toast("⛏️ <b>" + esc(I[id].n) + "</b> : touche « + " + esc(I[id].sn || I[id].n) + " » sur un gisement " + esc(deZone(I[id].z)) + ", dans le Domaine.", { key: "it:" + id, p: 4 }); }, 900);
      }
    });
    E.on("decoded", () => {
      setTimeout(() => {
        A.signal();
        openModal({ html: '<div class="kicker">Traducteur</div><h2>' + esc(D.FRAGS.signal.n) + "</h2>" + loreHTML(D.FRAGS.signal.t) +
          '<p class="small muted">Un nouveau Grand Œuvre est apparu dans le Cosmos.</p><div class="acts"><button class="btn pri" data-m="close">Continuer</button></div>' });
        badge("cosmos"); badge("journal");
      }, 600);
    });
    E.on("skyanim", (anim) => {
      if (typeof window !== "undefined" && window.EclatSky && typeof window.EclatSky.trigger === "function") {
        window.EclatSky.trigger(anim);
        if (!window.EclatSky.mounted()) badge("cosmos"); // quelque chose se passe dans le ciel
      }
    });
    E.on("releve_fenetre", () => {
      setTimeout(confirmCycle, 800);
    });
    E.on("halte_jouee", () => { vibe(40); });
    E.on("fx", (k) => { if (k === "fireworks") setTimeout(fireworks, 300); });
    E.on("ending", (r) => { setTimeout(() => showEnding(r), 600); save(); });
    E.on("capsulePrompt", () => { setTimeout(promptCapsuleText, 400); });
    E.on("toast", (msg) => { if (typeof msg === "string") toast(msg); });
    E.on("curio", (id) => {
      const c = D.EASTER && D.EASTER[id];
      if (c) {
        A.secret && A.secret();
        toast((c.ic ? c.ic + " " : "") + "<b>Curiosité :</b> " + esc(c.desc || c.n));
      }
    });
    E.on("offline", (o) => {
      if (o.dt < 60) return;
      const top = Object.keys(o.gains).filter((k) => I[k]).sort((a, b) => o.gains[b] - o.gains[a]).slice(0, 10);
      if (!top.length && !o.exp && o.dt < 600) return;
      U.offline = { dt: o.dt, top, gains: o.gains, exp: o.exp };
    });
  }

  /* ============================================================ ÉCOUTEURS DOM */
  function bindDom() {
    const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight"];
    let kIdx = 0;
    function triggerKonami() {
      if (E.addCurio("konami")) {
        A.secret && A.secret();
      }
      if (root.EclatSky && root.EclatSky.boostStars) {
        root.EclatSky.boostStars(60000);
      }
      toast("⭐ Trente étoiles de plus brillent dans la nuit.");
    }
    document.addEventListener("keydown", (ev) => {
      if (U.mcur && ev.key === "Escape" && !U.mcur.persistent && !fresh()) { ev.preventDefault(); closeModal(); return; }
      if (U.mcur && ev.key === "Tab") {
        // le focus reste dans la fenêtre ouverte
        const box = $("#modal .modal-box");
        const list = [...box.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled && x.offsetParent !== null);
        if (!list.length) { ev.preventDefault(); box.focus(); return; }
        const first = list[0], last = list[list.length - 1], cur = document.activeElement;
        if (ev.shiftKey && (cur === first || cur === box || !box.contains(cur))) { ev.preventDefault(); last.focus(); return; }
        if (!ev.shiftKey && (cur === last || !box.contains(cur))) { ev.preventDefault(); first.focus(); return; }
      }
      if ((ev.key === "Enter" || ev.key === " ") && document.activeElement && document.activeElement.matches("[data-goto]")) {
        ev.preventDefault();
        goto(document.activeElement.dataset.goto);
        return;
      }
      if (ev.key === KONAMI[kIdx]) {
        kIdx++;
        if (kIdx === KONAMI.length) {
          kIdx = 0;
          triggerKonami();
        }
      } else {
        kIdx = (ev.key === KONAMI[0]) ? 1 : 0;
      }
    });
    document.addEventListener("pointerdown", (ev) => { U.pointer = { x: ev.clientX, y: ev.clientY }; }, true);
    document.addEventListener("wheel", (ev) => {
      const el = ev.target.closest(".ztabs, .filters, .u-tools, .u-free");
      if (el && !ev.shiftKey && Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) {
        if (el.scrollWidth > el.clientWidth) {
          el.scrollLeft += ev.deltaY;
          ev.preventDefault();
        }
      }
    }, { passive: false });
    $("#tabs").addEventListener("click", (ev) => { const b = ev.target.closest("button[data-tab]"); if (b) { A.init(); A.click(); setTab(b.dataset.tab); } });
    const ageEl = $("#ageBtn") || $(".age");
    if (ageEl) ageEl.addEventListener("click", () => { A.init(); A.click(); openMilestones(); });
    const qEl = $("#questBtn");
    if (qEl) qEl.addEventListener("click", () => { A.init(); A.click(); openQuestsModal(); });
    $("#menuBtn").addEventListener("click", () => { A.init(); openMenu(); });
    $("#memBtn").addEventListener("click", () => { A.init(); A.click(); openMemoire(); });
    $("#cloudBtn").addEventListener("click", () => { A.init(); openAccount(); });
    $("#intuBtn").addEventListener("click", () => simpleModal("Intuition", "✨ " + Math.floor(S().intu),
      '<p class="small">L’Intuition s’obtient en découvrant des recettes, des fragments d’histoire et des secrets. Elle sert à étudier une ressource (touche 🔍 Étudier sur sa fiche) et à déchiffrer une recette inconnue étape par étape (touche ✨ Déchiffrer sur sa fiche).</p>' +
      (E.cache().intu ? '<p class="small muted">Gain automatique : +' + E.cache().intu + " ✨ par minute.</p>" : "")));
    $("#expMini").addEventListener("click", () => { const a = S().exp.active; U.zone = a ? a.z : U.zone; setTab("carte"); });
    $("#actbar").addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-ab]");
      if (!b) return;
      A.init();
      if (b.dataset.ab === "stop") { E.stopAct(); A.click(); render(true); actBar(); return; }
      openHands();
    });
    $("#updBar").addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-u]");
      if (!b) return;
      if (b.dataset.u === "save") downloadSave();
      if (b.dataset.u === "go") applyUpdate();
    });

    const views = $("#views");
    views.addEventListener("pointerdown", (ev) => {
      if (U.tab === "domaine" && Dom.down(ev)) return; // récolte à la main
      // le bouton d’œuvre agit au relâcher, même si l’établi s’est redessiné entre-temps (taper vite)
      if (ev.target.closest("#forge, [data-forge]")) U.fdown = { x: ev.clientX, y: ev.clientY, mini: !!ev.target.closest("[data-forge]") };
      const inv = ev.target.closest(".inv");
      if (inv) {
        const id = inv.dataset.inv;
        U.lp = { id, t: setTimeout(() => { U.lp = null; vibe(15); openItemInfo(id); }, 480) };
      }
    });
    const cancelLp = () => { if (U.lp) { clearTimeout(U.lp.t); U.lp.up = true; } };
    ["pointerup", "pointercancel"].forEach((t) => document.addEventListener(t, cancelLp));
    ["pointerup", "pointercancel"].forEach((t) => document.addEventListener(t, (ev) => Dom.up(ev)));
    views.addEventListener("scroll", () => { if (U.lp) { clearTimeout(U.lp.t); U.lp = null; } updMini(); }, { passive: true });
    views.addEventListener("contextmenu", (ev) => { if (ev.target.closest(".inv, .slot, [data-harv]")) ev.preventDefault(); });

    views.addEventListener("click", (ev) => {
      const t = ev.target;
      let b;
      if (U.tab === "atelier") { U.anchor = anchorFor(t); U.anchorAt = performance.now(); }
      if (U.tab === "carte" && Carte.click(t)) return;
      if (Dom.click(t)) return;
      if ((b = t.closest(".inv"))) {
        if (U.lp) { cancelLp(); U.lp = null; putInSlot(b.dataset.inv); }
        return;
      }
      if ((b = t.closest("[data-pin]"))) { const on = E.togglePin(b.dataset.pin); A.click(); toast(on ? "★ Épinglée : visible en haut de l’Atelier." : "Recette désépinglée."); render(true); return; }
      if ((b = t.closest(".nope[data-chain], .nope[data-cr]"))) {
        A.fail(0);
        toast(whyNot(b.dataset.chain || b.dataset.cr, b.dataset.n === "max" ? 1 : Number(b.dataset.n) || 1, true), { key: "nope" });
        return;
      }
      if ((b = t.closest("[data-hopen]"))) { A.init(); openHands(); return; }
      if ((b = t.closest("[data-chain]"))) { if (!b.disabled) chainCraft(b, b.dataset.chain, 1); return; }
      if ((b = t.closest("[data-tree]"))) { openTree(b.dataset.tree, 1); return; }
      if ((b = t.closest("[data-track]"))) { E.setTrack(b.dataset.track); A.click(); toast("🎯 Suivi : <b>" + esc(I[b.dataset.track].n) + "</b> (en haut du Domaine)"); render(true); return; }
      if ((b = t.closest("[data-untrack]"))) { E.setTrack(null); render(true); return; }
      if ((b = t.closest("[data-gotab]"))) { setTab(b.dataset.gotab); return; }
      if (t.closest("[data-open-quests]")) { A.click(); openQuestsModal(); return; }
      if (t.closest("[data-miles]")) { A.click(); openMilestones(); return; }
      if (t.closest("[data-cycle]")) { A.click(); openMemoire(); return; }
      if (t.closest("[data-dons]")) { A.click(); openDons(); return; }
      if ((b = t.closest("[data-pour]"))) { pour(b.dataset.pour, b); return; }
      if ((b = t.closest("[data-gotab]"))) { A.click(); setTab(b.dataset.gotab); return; }
      if ((b = t.closest("[data-hloop]"))) { startHarvest(b.dataset.hloop); return; }
      if (t.closest("[data-skills]")) { A.click(); openSkills(); return; }
      if ((b = t.closest("[data-tab2]"))) { A.click(); setTab(b.dataset.tab2); return; }
      if ((b = t.closest("[data-goalt]"))) {
        const st = S(), open = goalOpen();
        if (st.track && I[st.track.id]) U.goalPeek = !open; else st.settings.goalOpen = !open;
        A.click(); render(true); return;
      }
      if ((b = t.closest("[data-g]"))) { U.geste = b.dataset.g; A.click(); U.last = null; render(true); return; }
      if ((b = t.closest("[data-lock]"))) { toast("Action encore inconnue. Elle se débloque avec sa station : feu, enclume, creuset…"); return; }
      if ((b = t.closest("[data-slot]"))) { const i = Number(b.dataset.slot); if (U.slots[i]) { U.slots[i] = null; A.click(); render(true); } else toast("Touche une ressource ci-dessous pour la poser ici."); return; }
      if (t.closest("[data-clear]")) { U.slots = [null, null, null]; U.last = null; A.click(); render(true); return; }
      if (t.closest("#forge, [data-forge]") && !t.closest("[data-s]")) {
        if (performance.now() - (U.forgeUp || 0) < 600) return; // déjà fait au relâcher
        U.fromMini = !!t.closest("[data-forge]"); forge(); U.fromMini = false; return;
      }
      if ((b = t.closest("[data-clear-search]"))) {
        const target = b.dataset.clearSearch;
        A.click(); vibe(6);
        if (target === "iq") {
          U.iq = "";
          render(true);
        } else if (target === "cq") {
          U.q = "";
          const l = $("#clist");
          if (l) { l.innerHTML = carnetList(); refresh(); }
          render(true);
        }
        return;
      }
      if ((b = t.closest("[data-cr]"))) { craftFrom(b); return; }
      if ((b = t.closest("[data-study-all]"))) { const n = E.studyAll(); if (n) { toast("🔍 " + n + " ressources étudiées."); A.discover(); } render(true); return; }
      if ((b = t.closest("[data-if]"))) { U.invFilter = b.dataset.if; S().settings.inv = Object.assign({}, S().settings.inv, { filter: U.invFilter }); render(true); return; }
      if ((b = t.closest("[data-cf]"))) { U.carnetFilter = b.dataset.cf; render(true); return; }
      if ((b = t.closest("[data-owned]"))) { U.showOwned = !U.showOwned; render(true); return; }
      if ((b = t.closest("[data-hcancel]"))) {
        const j = S().hand.q[Number(b.dataset.hcancel)];
        if (j && E.cancelJob(Number(b.dataset.hcancel))) { A.click(); toast("Annulé : " + esc(I[j.id].n) + ". Matières restituées."); render(true); }
        return;
      }
      if ((b = t.closest("[data-tip]"))) { S().flags[b.dataset.tip] = true; render(true); return; }
      if ((b = t.closest("[data-exp]"))) { explore(b.dataset.exp); return; }
      if ((b = t.closest("[data-goto]"))) { U.rfrom = null; goto(b.dataset.goto); return; }
      if ((b = t.closest("[data-jt]"))) { U.journalTab = b.dataset.jt; if (b.dataset.jt === "flute") E.clearNotes(); render(true); return; }
      if ((b = t.closest("[data-s]"))) { A.click(); openSigneModal(b.dataset.s); return; }
      if ((b = t.closest("[data-page]"))) {
        const pid = b.dataset.page;
        const c = E.livre ? E.livre().find((x) => x.id === pid) : null;
        if (c && c.page) {
          E.readPage(pid);
          render(true);
          const makeHTML = () => {
            const curC = E.livre ? E.livre().find((x) => x.id === pid) : c;
            const p = curC.page;
            const notesHTML = (curC.notes && curC.notes.length) ?
              '<div class="livre-notes">' + curC.notes.map((n) =>
                '<div class="livre-note">' + recitHTML(n.t, "Page " + curC.n) +
                (n.sig ? '<div class="livre-sig">' + recitInline(n.sig, "Page " + curC.n) + '</div>' : '') +
                '</div>'
              ).join("") + '</div>' : '';
            return '<div class="kicker">Le Livre des Semeurs · n° ' + curC.n + '</div>' +
              '<h2>' + esc(p.titre || ("Page " + curC.n)) + '</h2>' + stampHTML("p:" + pid) +
              '<div class="livre-imprime lore">' + recitHTML(p.imprime, "Page " + curC.n) + '</div>' +
              notesHTML +
              '<div class="acts"><button class="btn pri" data-m="close">Refermer</button></div>';
          };
          openModal({
            html: makeHTML(),
            refresh: makeHTML
          });
        }
        return;
      }
      if ((b = t.closest("[data-askhelp]"))) {
        const qid = b.dataset.askhelp;
        const res = E.askHelp ? E.askHelp(qid) : null;
        if (res && res.ok) {
          A.click();
          render(true);
        }
        return;
      }
      if ((b = t.closest("[data-frag]"))) { const F = D.FRAGS[b.dataset.frag]; simpleModal("Fragment", esc(F.n || F.titre), stampHTML("f:" + b.dataset.frag) + loreHTML(E.interpolate ? E.interpolate(F.t || F.lore) : (F.t || F.lore), F.n || F.titre || "Fragment"), "Refermer"); return; }
      if ((b = t.closest("[data-note]"))) { playNote(Number(b.dataset.note), b); return; }
      if ((b = t.closest("[data-play]"))) {
        A.init();
        const allM = (typeof E.allMelodies === "function") ? E.allMelodies() : D.MELODIES;
        const notes = E.airNotes ? E.airNotes(b.dataset.play) : (allM[b.dataset.play] || {}).notes;
        if (notes) notes.forEach((n, i) => setTimeout(() => playNote(n), i * 420));
        return;
      }
      if ((b = t.closest("[data-ct]"))) { U.cosmosTab = b.dataset.ct; render(true); return; }
      if ((b = t.closest("[data-fgz]"))) { A.click(); U.zone = b.dataset.fgz; setTab("carte"); return; } // une étoile pâle : le lieu, sur la Carte
      if (t.closest("#listen")) { listen(); return; }
      if ((b = t.closest("[data-fire]"))) { confirmFire(b.dataset.fire); return; }
      if ((b = t.closest("[data-proj-act]"))) {
        const pid = b.dataset.projAct;
        if (pid === "chant") {
          const r = E.cutRelay();
          if (r.ok) {
            A.click();
            vibe(30);
            toast("⚡ " + esc(((E.RECIT.chant || {}).scene || {}).debut ? E.RECIT.chant.scene.debut[0] : ""));
            render(true);
          } else {
            A.fail(0);
            toast(esc((E.RECIT.chant || {}).manque || ""));
          }
        }
        return;
      }
      if ((b = t.closest("[data-proj-scene]"))) {
        const pid = b.dataset.projScene;
        if (pid === "chant") {
          A.click();
          openStillnessScene();
        }
        return;
      }
    });
    views.addEventListener("change", (ev) => {
      const t = ev.target;
      if (t.id === "isort") { S().settings.inv = Object.assign({}, S().settings.inv, { sort: t.value }); render(true); }
    });
    views.addEventListener("input", (ev) => {
      if (ev.target.id === "iq") { U.iq = ev.target.value; render(true); return; }
      if (ev.target.id === "cq") {
        U.q = ev.target.value;
        const l = $("#clist");
        if (l) { l.innerHTML = carnetList(); refresh(); }
        const p = ev.target.parentNode;
        let sc = p ? p.querySelector(".search-clear") : null;
        if (U.q && !sc && p) {
          sc = document.createElement("button");
          sc.className = "search-clear";
          sc.dataset.clearSearch = "cq";
          sc.setAttribute("aria-label", "Effacer");
          sc.textContent = "✕";
          p.appendChild(sc);
        } else if (!U.q && sc) {
          sc.remove();
        }
      }
    });
    views.addEventListener("focusin", (ev) => { if (ev.target.id === "cq" || ev.target.id === "iq") ev.target.select(); });
    views.addEventListener("toggle", (ev) => {
      const d = ev.target;
      if (d.matches && d.matches("details[data-age]")) U.openAges[d.dataset.age] = d.open;
    }, true);
    views.addEventListener("submit", (ev) => {
      if (ev.target.id === "termForm") { ev.preventDefault(); runTerminal($("#termIn").value); }
      if (ev.target.id === "nomForm") {
        ev.preventDefault();
        const v = $("#nomIn").value;
        if (!v.trim()) return;
        A.init(); A.click();
        const r = E.nommer(v), NM = (E.RECIT && E.RECIT.nommer) || {};
        toast(esc(r.ok ? (r.revoila ? NM.revoila : NM.oui) : r.why === "deja" ? NM.deja : NM.surnom || ""), { key: "nom" });
        save(); render(true);
      }
    });
    let skyTouch = null;
    views.addEventListener("pointerdown", (ev) => {
      if (ev.target.id === "skyCanvas") {
        skyTouch = { x: ev.clientX, y: ev.clientY, t: Date.now() };
      }
    });
    views.addEventListener("pointerup", (ev) => {
      if (ev.target.id === "skyCanvas") {
        if (skyTouch) {
          const dx = ev.clientX - skyTouch.x;
          const dy = ev.clientY - skyTouch.y;
          const dt = Date.now() - skyTouch.t;
          skyTouch = null;
          if (dt < 1500 && (Math.abs(dx) > 25 || Math.abs(dy) > 25)) {
            let dir = null;
            if (Math.abs(dy) > Math.abs(dx)) dir = dy < 0 ? "ArrowUp" : "ArrowDown";
            else dir = dx < 0 ? "ArrowLeft" : "ArrowRight";
            if (dir) {
              if (dir === KONAMI[kIdx]) {
                kIdx++;
                if (kIdx === KONAMI.length) {
                  kIdx = 0;
                  triggerKonami();
                }
              } else {
                kIdx = (dir === KONAMI[0]) ? 1 : 0;
              }
            }
            return;
          }
        }
        skyTap(ev);
      }
      const d = U.fdown;
      U.fdown = null;
      // un signe posé sur le bouton ouvre sa fiche au lieu de fabriquer
      if (d && Math.hypot(ev.clientX - d.x, ev.clientY - d.y) < 12 && ev.target.closest("#forge, [data-forge]") && !ev.target.closest("[data-s]")) {
        U.forgeUp = performance.now();
        U.anchor = d.mini ? anchorFor(ev.target) : "#forge"; U.anchorAt = performance.now();
        U.fromMini = d.mini; forge(); U.fromMini = false;
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) save();
      else { E.update(); showOffline(); render(true); }
    });
    window.addEventListener("pagehide", save);
  }

  function showOffline() {
    const o = U.offline;
    if (!o) return;
    U.offline = null;
    const list = o.top.map((k) => '<span class="ing">' + icon(k, "sm") + "+" + fmt(o.gains[k]) + " " + esc(I[k].n) + "</span>").join("");
    const auto = Object.keys(S().dom.ext).length > 0 || S().hand.q.length > 0;
    const full = [];
    simpleModal("Pendant ton absence · " + fmtTime(o.dt), "Bon retour !",
      (list ? '<p class="small muted">Pendant ce temps, voici ce qui a été récolté et fabriqué :</p><div class="row wrap">' + list + "</div>"
        : '<p class="small">Rien n’a été récolté ni fabriqué pendant ton absence.' + (auto ? "" : " Pose une cabane sur un gisement : elle récolte même quand le jeu est fermé.") + "</p>") +
      (full.length ? '<p class="small">📦 La Réserve s’est remplie de ' + full.map((k) => esc(I[k].n.toLowerCase())).join(", ") + " : " + (full.length > 1 ? "leurs extracteurs se sont arrêtés" : "son extracteur s’est arrêté") + ". Une machine qui " + (full.length > 1 ? "les" : "le") + " transforme ferait de la place.</p>" : "") +
      (o.exp ? '<p class="small">🧭 Ton exploration est terminée. Consulte le Journal.</p>' : ""));
  }

  /* ============================================================ MISES À JOUR
   * Une nouvelle version s’installe en arrière-plan puis attend ton accord :
   * tu peux télécharger ta sauvegarde avant de l’appliquer. */
  function showUpdate(reg) {
    U.updReg = reg;
    const bar = $("#updBar");
    bar.innerHTML = '<span class="grow">✨ Une nouvelle version d’Éclat est prête.</span><button class="btn small" data-u="save">💾 Ma sauvegarde</button><button class="btn small pri" data-u="go">Mettre à jour</button>';
    bar.classList.remove("hidden");
  }
  function applyUpdate() {
    const reg = U.updReg;
    save();
    pushBackup(E.serialize(), "Avant la mise à jour suivante");
    if (!reg || !reg.waiting) { location.reload(); return; }
    U.wantReload = true;
    reg.waiting.postMessage({ type: "SKIP_WAITING" });
    setTimeout(() => location.reload(), 3000);
  }
  function setupSW() {
    if (!("serviceWorker" in navigator) || !location.protocol.startsWith("http")) return;
    navigator.serviceWorker.register("sw.js").then((reg) => {
      if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg);
      reg.addEventListener("updatefound", () => {
        const w = reg.installing;
        if (!w) return;
        w.addEventListener("statechange", () => { if (w.state === "installed" && navigator.serviceWorker.controller && reg.waiting) showUpdate(reg); });
      });
      setInterval(() => reg.update().catch(() => { /* hors ligne */ }), 30 * 60 * 1000);
    }).catch(() => { /* hors ligne indisponible */ });
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (U.wantReload && !reloading) { reloading = true; location.reload(); }
    });
  }

  /* les visiteurs de passage */
  const Vis = window.EclatVisiteurs.create({ E, A, D, U, esc, fmt, toast, Tuto });
  const { visiteurTick, visiteurFin } = Vis;

  /* le Journal et le Cosmos */
  const Jnl = window.EclatJournal.create({ E, A, D, U, Sky, esc, fmt, fmtTime, icon, iconize, zoneName, toast, vibe, openModal, swapModal, render, save, subTabs, tabAvailable, stampTxt, stampHTML, recitInline, recitHTML, loreHTML, lectureHTML });
  const { openSigneModal, viewJournal, figuresSig, viewCosmos, mountCosmos, confirmFire, listen, skyTap, playNote, runTerminal } = Jnl;
  /* l’objectif, le suivi et les Quêtes */
  const Qst = window.EclatQuetes.create({ E, A, D, U, esc, fmt, fmtTime, cap1, needText, icon, itemPill, ingHTML, gesteChip, mainIngredient, isRawGather, zoneName, floater, elCenter, toast, vibe, openModal, closeModal, swapModal, render, save });
  const { goalCard, goalSig, goalOpen, openMilestones, passHTML, pour, memoryHTML, trackerHTML, questChip, openQuestsModal } = Qst;
  /* la relève, les dons et la Mémoire des mains */
  const Mem = window.EclatMemoire.create({ E, A, D, U, esc, fmt, fmtNum, perMin, zoneName, toast, vibe, openModal, closeModal, swapModal, simpleModal, render, save, setTab, pushBackup, recitInline, loreHTML, uiSigne, ornementHTML, playNote });
  const { intro, openStillnessScene, showEnding, confirmCycle, donsRepere, openDons, openMemoire, openForcedReleve, memChip } = Mem;
  /* le menu, les sauvegardes et le compte en ligne */
  const Cpt = window.EclatCompte.create({ E, ENGINE, A, D, U, Cloud, Tuto, esc, fmtTime, fmtDate, toast, openModal, closeModal, swapModal, simpleModal, save, backups, pushBackup, setTab, applyTheme, applyLargeText, volumes, intro, openMemoire, visiteurFin });
  const { openMenu, openAccount, downloadSave, showBadSave, showNews, cloudTimers, cloudCheck, promptCapsuleText } = Cpt;
  /* ============================================================ BOUCLE */
  function loop() {
    E.update();
    visiteurTick();
    if (U.offline && !U.mcur) showOffline();
    if (U.dirty && !U.holding && !pressing()) render();
  }

  function boot() {
    setupModal();
    loadSprite();
    bindEngine();
    const status = loadSave();
    applyTheme();
    applyLargeText();
    if (typeof window !== "undefined" && window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if ((S().settings.theme || "auto") === "auto") applyTheme();
      });
    }
    A.setEnabled(S().settings.sound);
    A.setVolumes(volumes());
    if (status === "ok" || status === "migrated") E.update();
    bindDom();
    setTab("domaine");
    Object.assign(U.badges, S().flags.badges || {});
    const bk = S().flags.bench;
    if (bk && Array.isArray(bk.s)) {
      if (D.GESTES[bk.g] && E.gesteOK(bk.g)) U.geste = bk.g;
      U.slots = [0, 1, 2].map((i) => (bk.s[i] && I[bk.s[i]] && S().seen[bk.s[i]] ? bk.s[i] : null));
    }
    if (status === "error") showBadSave();
    else if (!S().introSeen) intro();
    else {
      // une partie qui revient d’une version précédente voit une fois ce qui a changé
      // une correction (4.5.0 → 4.5.1) ne rouvre pas la fenêtre ; une nouvelle version (4.4 → 4.5), si
      const minor = (v) => String(v || "").split(".").slice(0, 2).join(".");
      if (S().flags.news || minor(S().flags.ver) !== minor(D.VERSION)) showNews();
      else S().flags.ver = D.VERSION;
      showOffline();
    }
    setTimeout(() => { U.live = true; }, 1500);
    setInterval(loop, 100);
    setInterval(refresh, 250);
    setInterval(save, 10000);
    setupSW();
    cloudTimers();
    setTimeout(cloudCheck, 1500);
    U.applyTheme = applyTheme;
    U.applyLargeText = applyLargeText;
    U.itemPill = itemPill;
    window.__eclat = { E, U, render, save, backups, Cloud, Dom, Carte, toast, openMemoire, closeModal, itemPill };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
