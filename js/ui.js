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
    return "il faut : " + (html ? '<span class="link-txt" data-goto="' + st + '">' + esc(I[st].n) + "</span>" : I[st].n) + " (" + det + ")";
  }
  const cap1 = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const fmtMul = (v) => "×" + String(Math.round(v * 100) / 100).replace(".", ",");
  function fmtDate(t) {
    const d = new Date(t);
    return d.toLocaleDateString("fr-FR") + " " + String(d.getHours()).padStart(2, "0") + "h" + String(d.getMinutes()).padStart(2, "0");
  }

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
  const descHTML = (it) => (it.u ? '<div class="small">' + esc(it.u) + "</div>" : "") + (it.d ? '<div class="small muted"><i>' + esc(it.d) + "</i></div>" : "");
  /* ce que fait chaque sorte d’objet, en une phrase, sur sa fiche */
  const TYPE_HINT = {
    res: "Une ressource : elle se récolte sur un gisement.",
    comp: "Une pièce : elle sert à fabriquer autre chose.",
    tool: "Un outil : il agit dès que tu l’as, rien à poser.",
    stat: "Une station : elle reste à l’Atelier et débloque une action ou une chaleur.",
    ext: "Un extracteur : il se pose sur un gisement de sa terre et récolte seul, même quand le jeu est fermé.",
    upg: "Une amélioration : elle agit dès que tu l’as, rien à poser.",
    mach: "Une machine : elle reste à l’Atelier et accélère les commandes des recettes qu’elle sait faire.",
    curio: "Une curiosité : elle n’a pas d’usage pratique.", relic: "Une relique, trouvée en explorant."
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
    f.style.left = x + "px"; f.style.top = y + "px";
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
    let t = Array.from(box.children).find((x) => x.dataset.k === key);
    if (t) {
      if (p < Number(t.dataset.p)) return;
      clearTimeout(t._tm);
      t.style.animation = "none"; void t.offsetWidth; t.style.animation = ""; // repart de zéro
    } else {
      t = document.createElement("div");
      t.className = "toast";
      t.dataset.k = key;
      box.appendChild(t);
      while (box.children.length > 2) box.firstChild.remove();
    }
    t.dataset.p = p;
    t.innerHTML = html;
    iconize(t);
    t._tm = setTimeout(() => t.remove(), 3100);
  }
  function vibe(ms) { if (S().settings.vibe && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { /* ignoré */ } }
  function elCenter(el) {
    if (!el || !el.isConnected) return { x: U.pointer.x || innerWidth / 2, y: U.pointer.y || innerHeight / 2 };
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  /* ------------------------------------------------------------ modales */
  function openModal(o) { U.mq.push(o); if (!U.mcur) nextModal(); }
  function nextModal() {
    const m = $("#modal"), box = $(".modal-box", m);
    const o = U.mq.shift();
    if (!o) { U.mcur = null; m.classList.add("hidden"); return; }
    U.mcur = o;
    U.mAt = Date.now();
    m.className = "modal " + (o.cls || "");
    box.innerHTML = o.html;
    iconize(box);
    box.scrollTop = 0;
    if (o.onOpen) o.onOpen(box);
  }
  function closeModal() {
    const o = U.mcur;
    $("#modal").classList.add("hidden");
    U.mcur = null;
    if (o && o.onClose) o.onClose();
    // une fenêtre ouverte entre-temps (une liste ouverte depuis une fiche) reste ouverte
    setTimeout(() => { if (!U.mcur) nextModal(); }, 60);
  }
  /* une fenêtre qui vient de s’ouvrir sous le doigt ne se referme pas sur le même appui */
  const fresh = () => Date.now() - (U.mAt || 0) < 450;
  function setupModal() {
    const m = $("#modal"), box = $(".modal-box", m);
    box.addEventListener("click", (ev) => {
      // un passage à verser, une matière à voir, depuis une fiche
      const pb = ev.target.closest("[data-pour]");
      if (pb && U.mcur && !fresh()) { pour(pb.dataset.pour, pb); if (U.mcur && U.mcur.refresh) box.innerHTML = U.mcur.refresh(); return; }
      const gb = !ev.target.closest("[data-m]") && ev.target.closest("[data-goto]");
      if (gb && U.mcur && !fresh()) { closeModal(); setTimeout(() => goto(gb.dataset.goto), 80); return; }
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
    E, A, D, U, esc, fmt, fmtNum, fmtTime, perMin, needText, deZone, sparks, icon, toast, openModal, closeModal, norm, vibe, floater, passHTML, uiSigne,
    render: (f) => render(f), quiet: () => Tuto.active(),
    top: () => goalCard() + '<div id="trackBox">' + trackerHTML() + "</div>",
    topSig: () => goalSig() + "|" + (S().track ? S().track.id : "")
  });
  const Carte = window.EclatCarte.create({
    E, A, D, U, esc, fmt, fmtTime, toast, openModal, passHTML, expWhy: (z) => expWhy(z), explore: (z) => explore(z), goto: (id) => goto(id),
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
    let s = esc(String(t));
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
  function stamp() {
    const d = new Date(), p = (n) => String(n).padStart(2, "0");
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "_" + p(d.getHours()) + "h" + p(d.getMinutes());
  }
  function download(name, text) {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
  }
  function downloadSave() {
    save();
    download("eclat-sauvegarde-" + stamp() + ".json", E.serialize());
    toast("💾 Sauvegarde téléchargée.");
  }
  /* Remplace la partie actuelle par une autre (fichier, code, copie de sécurité). */
  function replaceWith(raw, why) {
    let txt;
    try { txt = E.decodeSave(raw); E.parseSave(txt); } catch (e) { toast("Fichier illisible : " + esc(e.message)); return false; }
    if (!U.saveLocked) pushBackup(E.serialize(), why);
    E.load(txt);
    U.saveLocked = false; U.badSave = null;
    save();
    U.slots = [null, null, null]; U.last = null;
    setTab("domaine");
    toast("Partie chargée.");
    return true;
  }
  function pickFile(cb) {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".json,application/json,text/plain";
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => cb(String(r.result || ""));
      r.readAsText(f);
    };
    inp.click();
  }
  function openSaves() {
    const list = backups();
    openModal({
      html: "<h2>💾 Sauvegardes</h2><p class=\"small muted\">Ta partie s’enregistre toute seule sur cet appareil. Pour la mettre à l’abri ou la passer sur un autre appareil, télécharge-la dans un fichier.</p>" +
        '<div class="acts" style="flex-direction:column"><button class="btn pri" data-m="dl">⬇️ Télécharger ma sauvegarde</button><button class="btn" data-m="up">⬆️ Charger un fichier de sauvegarde</button>' +
        '<button class="btn ghost" data-m="code">📋 Code texte (ancien format)</button></div>' +
        (list.length ? '<h3 class="sub">Copies de sécurité automatiques</h3>' + list.map((b, i) =>
          '<div class="bk"><div class="grow"><b>' + esc(b.why) + '</b><div class="tiny muted">' + fmtDate(b.t) + " · format v" + b.v + '</div></div><button class="btn small" data-m="bdl" data-i="' + i + '">⬇️</button><button class="btn small" data-m="brs" data-i="' + i + '">Restaurer</button></div>').join("") : "") +
        '<div class="acts"><button class="btn" data-m="close">Fermer</button></div>',
      on: {
        dl: () => { downloadSave(); return true; },
        up: () => { pickFile((txt) => confirmReplace(txt, "Avant le chargement d’un fichier")); return true; },
        code: () => setTimeout(openCode, 80),
        bdl: (b) => { const k = backups()[Number(b.dataset.i)]; if (k) download("eclat-copie-" + stamp() + ".json", k.data); return true; },
        brs: (b) => { const k = backups()[Number(b.dataset.i)]; if (k) setTimeout(() => confirmReplace(k.data, "Avant la restauration d’une copie"), 80); }
      }
    });
  }
  function confirmReplace(txt, why) {
    let o;
    try { o = E.parseSave(E.decodeSave(txt)); } catch (e) { toast("Fichier illisible : " + esc(e.message)); return; }
    openModal({
      html: "<h2>Charger cette partie ?</h2><p>Âge : <b>" + esc(D.AGES[o.age].n) + "</b> · " + Object.keys(o.known).length + " recettes connues · cycle " + (o.cycle || 1) + ".</p>" +
        '<p class="small muted">Ta partie actuelle sera remplacée. Une copie de sécurité est faite juste avant.</p><div class="acts"><button class="btn" data-m="close">Annuler</button><button class="btn pri" data-m="go">Charger</button></div>',
      on: { go: () => { replaceWith(txt, why); } }
    });
  }
  function openCode() {
    save();
    const code = E.exportSave();
    openModal({
      html: "<h2>Code de sauvegarde</h2><p class=\"small muted\">Copie ce code pour le garder, ou colle un code existant puis charge-le.</p><textarea class=\"save\" id=\"codeTxt\">" + code + "</textarea>" +
        '<div class="acts"><button class="btn" data-m="copy">Copier</button><button class="btn" data-m="load">Charger le code collé</button><button class="btn pri" data-m="close">Fermer</button></div>',
      onOpen: (box) => { const t = $("textarea", box); t.focus(); t.select(); },
      on: {
        copy: () => { try { navigator.clipboard.writeText($("#codeTxt").value); toast("Copié."); } catch (e) { /* ignoré */ } return true; },
        load: () => { const v = $("#codeTxt").value; if (v.trim() === code) { toast("Ce code correspond déjà à ta partie actuelle."); return true; } setTimeout(() => confirmReplace(v, "Avant le chargement d’un code"), 80); }
      }
    });
  }
  function showBadSave() {
    const b = U.badSave;
    openModal({
      persistent: true,
      html: '<div class="kicker">Sauvegarde</div><h2>Ta partie n’a pas pu être lue</h2><p>Elle n’a <b>pas</b> été modifiée et reste sur cet appareil. Télécharge-la pour la garder en lieu sûr.</p>' +
        '<p class="tiny muted">Détail : ' + esc(b.err) + "</p>" +
        '<div class="acts" style="flex-direction:column"><button class="btn pri" data-m="dl">⬇️ Télécharger la sauvegarde illisible</button><button class="btn" data-m="up">⬆️ Charger un autre fichier</button>' +
        '<button class="btn ghost" data-m="fresh">Commencer une nouvelle partie (l’ancienne est mise à l’abri)</button></div>',
      on: {
        dl: () => { download("eclat-sauvegarde-illisible-" + stamp() + ".json", b.raw); return true; },
        up: () => { pickFile((txt) => { if (replaceWith(txt, "Avant le chargement d’un fichier")) closeModal(); }); return true; },
        fresh: () => {
          pushBackup(b.raw, "Sauvegarde illisible mise à l’abri");
          U.saveLocked = false; U.badSave = null;
          E.reset(); save(); setTab("domaine"); setTimeout(intro, 100);
        }
      }
    });
  }
  function showNews() {
    const st = S();
    const hasBackup = backups().some((b) => b.v < ENGINE.SAVE_VERSION);
    openModal({
      html: '<div class="kicker">Mise à jour ' + esc(D.VERSION) + "</div><h2>Ta partie a été conservée</h2>" +
        '<ul class="news">' + D.CHANGES.map((c) => "<li>" + esc(c) + "</li>").join("") + "</ul>" +
        (st.flags.mach57 ? '<p class="small">Tes machines ne sont plus fixées sur une recette : elles attendent au repos et aident tes commandes. Les ressources qu’elles utilisaient sont revenues dans ta Réserve.</p>' : "") +
        (st.flags.news === "6" && Object.keys(st.dom.ext).length ? '<p class="small">Les tapis disparaissent : tes extracteurs sont maintenant rangés dans le <b>Domaine</b>, terre par terre. Ils récoltent autant qu’avant, et ce qui se trouvait sur les tapis est revenu dans ta Réserve.</p>' : "") +
        (st.flags.v5proj ? '<p class="small">Ton Grand Œuvre est commencé, et tout ce que tu y as versé est conservé. Dans le Domaine, touche « Alimenter » pour qu’il se serve seul dans la Réserve.</p>' : "") +
        (hasBackup ? '<p class="small muted">Par précaution, une copie de ton ancienne sauvegarde a été mise de côté. Tu peux la télécharger ici ou plus tard depuis ☰ → Sauvegardes.</p>' : "") +
        '<div class="acts">' + (hasBackup ? '<button class="btn" data-m="old">⬇️ Ancienne sauvegarde</button>' : "") + '<button class="btn pri" data-m="close">Continuer</button></div>',
      on: { old: () => { const k = backups().find((b) => b.v < ENGINE.SAVE_VERSION); if (k) download("eclat-ancienne-sauvegarde-v" + k.v + "-" + stamp() + ".json", k.data); return true; } },
      onClose: () => { st.flags.news = null; st.flags.ver = D.VERSION; delete st.flags.fab3; delete st.flags.fab4; delete st.flags.v5proj; delete st.flags.mach57; save(); }
    });
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
  const summary = (o) => esc(D.AGES[o.age] ? D.AGES[o.age].n : "?") + " · " + fmtTime((o.stats && o.stats.play) || 0) + " de jeu · " + Object.keys(o.known || {}).length + " recettes";
  const busy = (b, txt) => { if (b) { b.disabled = true; b.dataset.t = b.textContent; b.textContent = txt || "Un instant…"; } };
  const unbusy = (b) => { if (b && b.isConnected) { b.disabled = false; if (b.dataset.t) b.textContent = b.dataset.t; } };
  function openAccount(msg) {
    if (!Cloud.configured()) {
      simpleModal("Compte", "Pas encore de comptes", "<p>Les comptes en ligne ne sont pas encore ouverts sur ce jeu. En attendant, ta partie reste enregistrée sur cet appareil, et tu peux la télécharger dans ☰ → Sauvegardes.</p>" +
        '<p class="tiny dim">Pour la personne qui publie le jeu : la marche à suivre est dans server/README.md.</p>');
      return;
    }
    const a = Cloud.account();
    swapModal(a && a.token ? accountModal(msg) : loginModal(msg, a && a.pseudo));
  }
  function loginModal(msg, pseudo) {
    const up = U.acMode === "up";
    return {
      html: '<div class="kicker">Compte</div><h2>' + (up ? "Créer un compte" : "Se connecter") + "</h2>" +
        '<p class="small muted">Avec un compte, ta partie est aussi gardée en ligne, et tu peux la retrouver sur un autre appareil.</p>' +
        '<div class="seg"><button data-m="tin" class="' + (up ? "" : "on") + '">J’ai un compte</button><button data-m="tup" class="' + (up ? "on" : "") + '">Nouveau compte</button></div>' +
        '<label class="fld"><span>Pseudo</span><input id="acP" autocomplete="username" autocapitalize="off" spellcheck="false" maxlength="24" value="' + esc(pseudo || "") + '"></label>' +
        '<label class="fld"><span>Mot de passe</span><input id="acW" type="password" autocomplete="' + (up ? "new-password" : "current-password") + '"></label>' +
        (up ? '<label class="fld"><span>Confirme le mot de passe</span><input id="acW2" type="password" autocomplete="new-password"></label>' : "") +
        '<p class="small err" id="acErr">' + esc(msg || "") + "</p>" +
        '<p class="tiny dim">Ta partie est chiffrée sur ton appareil avant d’être envoyée : sans ton mot de passe, personne ne peut la lire, pas même le serveur. En contrepartie, si tu oublies ton mot de passe, la copie en ligne est perdue. Celle de cet appareil reste.</p>' +
        '<div class="acts"><button class="btn" data-m="close">Annuler</button><button class="btn pri" data-m="go">' + (up ? "Créer le compte" : "Se connecter") + "</button></div>",
      onOpen: (box) => { const f = $(pseudo ? "#acW" : "#acP", box); if (f) f.focus(); },
      on: {
        tin: () => { U.acMode = "in"; swapModal(loginModal("", $("#acP").value)); return true; },
        tup: () => { U.acMode = "up"; swapModal(loginModal("", $("#acP").value)); return true; },
        go: (b) => { doLogin(b, up); return true; }
      }
    };
  }
  async function doLogin(b, up) {
    const p = $("#acP").value.trim(), w = $("#acW").value, err = $("#acErr");
    const say = (t) => { if (err) err.textContent = t; };
    if (!/^[\p{L}\p{N}_.-]{3,24}$/u.test(p)) return say("Le pseudo doit faire de 3 à 24 caractères : lettres, chiffres, tiret, point ou tiret bas.");
    if (up && w.length < 8) return say("Le mot de passe doit faire au moins 8 caractères.");
    if (up && w !== $("#acW2").value) return say("Les deux mots de passe ne sont pas identiques.");
    if (!w) return say("Il manque le mot de passe.");
    busy(b, up ? "Création…" : "Connexion…");
    say("");
    try {
      if (up) await Cloud.register(p, w); else await Cloud.login(p, w);
      A.discover();
      await afterLogin(up);
    } catch (e) { unbusy(b); say(e.message); }
  }
  async function afterLogin(isNew) {
    let cloud = null;
    try { if (!isNew) cloud = await Cloud.pull(); } catch (e) { swapModal(accountModal(e.message)); return; }
    if (!cloud) {
      await cloudPush({ force: true, quiet: true });
      swapModal(accountModal("Voilà : ta partie est maintenant gardée en ligne aussi."));
      updateCloudBtn();
      return;
    }
    chooseVersion(cloud, "Il y a déjà une partie sur ce compte.");
  }
  /* deux versions de la partie : le joueur choisit, l’autre part dans les copies */
  function chooseVersion(cloud, intro) {
    let o;
    try { o = E.parseSave(cloud.text); } catch (e) { swapModal(accountModal("La partie en ligne est illisible : " + e.message)); return; }
    swapModal({
      persistent: true,
      html: '<div class="kicker">Compte</div><h2>Quelle partie garder ?</h2><p class="small">' + esc(intro) + "</p>" +
        '<div class="vs"><div class="card"><b>📱 Cet appareil</b><div class="small muted">' + summary(S()) + '</div></div><div class="card"><b>☁️ En ligne</b><div class="small muted">' + summary(o) +
        "<br>Envoyée le " + esc(fmtDate(cloud.updated)) + "</div></div></div>" +
        '<p class="tiny dim">Celle que tu ne gardes pas n’est pas perdue : elle va dans les copies de sécurité (☰ → Sauvegardes).</p>' +
        '<div class="acts" style="flex-direction:column"><button class="btn pri" data-m="cloud">Prendre la partie en ligne</button><button class="btn" data-m="local">Garder celle de cet appareil</button></div>',
      on: {
        cloud: () => { if (replaceWith(cloud.text, "Avant de charger la partie du compte")) { Cloud.adopt(cloud.rev, cloud.updated); U.sync.conflict = null; updateCloudBtn(); } },
        local: () => { pushBackup(cloud.text, "Partie du compte, remplacée par celle de l’appareil"); U.sync.conflict = null; cloudPush({ force: true, manual: true }); }
      }
    });
  }
  function accountModal(msg) {
    const a = Cloud.account() || {};
    const c = U.sync.conflict;
    return {
      html: '<div class="kicker">Compte</div><h2>☁️ ' + esc(a.pseudo || "") + "</h2>" +
        (msg ? '<p class="small">' + esc(msg) + "</p>" : "") +
        (c ? '<div class="card warnc"><b>Une autre version de ta partie est en ligne.</b><div class="small muted">Envoyée le ' + esc(fmtDate(c.updated)) + ', sans doute depuis un autre appareil.</div><button class="btn small pri" data-m="solve" style="margin-top:8px">Choisir la partie à garder</button></div>' : "") +
        '<p class="small muted">' + (a.last ? "Dernier envoi : " + esc(fmtDate(a.last)) : "Rien n’a encore été envoyé.") + (U.sync.err ? '<br><span class="err">' + esc(U.sync.err) + "</span>" : "") + "</p>" +
        '<div class="toggle"><span>Envoi automatique<br><span class="tiny dim">régulièrement, et quand tu quittes le jeu</span></span><button class="btn small" data-m="auto">' + (a.auto ? "Activé" : "Coupé") + "</button></div>" +
        '<div class="acts" style="flex-direction:column"><button class="btn pri" data-m="push">⬆️ Envoyer maintenant</button><button class="btn" data-m="pull">⬇️ Récupérer la partie en ligne</button>' +
        '<button class="btn ghost" data-m="pw">🔑 Changer de mot de passe</button><button class="btn ghost" data-m="out">🚪 Se déconnecter</button><button class="btn ghost" data-m="del" style="color:var(--bad)">🗑️ Supprimer le compte</button>' +
        '<button class="btn" data-m="close">Fermer</button></div>',
      on: {
        auto: (b) => { Cloud.setAuto(!a.auto); b.textContent = Cloud.account().auto ? "Activé" : "Coupé"; a.auto = Cloud.account().auto; return true; },
        push: (b) => { busy(b, "Envoi…"); cloudPush({ manual: true }).then(() => swapModal(accountModal(U.sync.conflict ? "" : U.sync.err ? "" : "Partie envoyée."))); return true; },
        pull: (b) => {
          busy(b, "Téléchargement…");
          Cloud.pull().then((cl) => {
            if (!cl) swapModal(accountModal("Aucune partie en ligne pour l’instant."));
            else chooseVersion(cl, "Voici la partie enregistrée en ligne.");
          }).catch((e) => swapModal(accountModal(e.message)));
          return true;
        },
        solve: (b) => { busy(b); Cloud.pull().then((cl) => cl && chooseVersion(cl, "Ta partie a avancé sur un autre appareil.")).catch((e) => swapModal(accountModal(e.message))); return true; },
        pw: () => { swapModal(passwordModal()); return true; },
        out: () => { Cloud.logout().then(updateCloudBtn); toast("Déconnecté. Ta partie reste sur cet appareil."); },
        del: () => { swapModal(deleteModal()); return true; }
      }
    };
  }
  function passwordModal() {
    return {
      html: '<div class="kicker">Compte</div><h2>Changer de mot de passe</h2>' +
        '<label class="fld"><span>Mot de passe actuel</span><input id="pw0" type="password" autocomplete="current-password"></label>' +
        '<label class="fld"><span>Nouveau mot de passe</span><input id="pw1" type="password" autocomplete="new-password"></label>' +
        '<label class="fld"><span>Confirme le nouveau mot de passe</span><input id="pw2" type="password" autocomplete="new-password"></label>' +
        '<p class="small err" id="pwErr"></p><p class="tiny dim">Ta partie en ligne est rechiffrée avec le nouveau mot de passe. Tes autres appareils devront se reconnecter.</p>' +
        '<div class="acts"><button class="btn" data-m="back">Retour</button><button class="btn pri" data-m="go">Changer</button></div>',
      on: {
        back: () => { swapModal(accountModal()); return true; },
        go: (b) => {
          const o = $("#pw0").value, n = $("#pw1").value, err = $("#pwErr");
          if (n.length < 8) { err.textContent = "Le nouveau mot de passe doit faire au moins 8 caractères."; return true; }
          if (n !== $("#pw2").value) { err.textContent = "Les deux nouveaux mots de passe ne sont pas identiques."; return true; }
          busy(b, "Chiffrement…");
          save();
          Cloud.changePassword(o, n, E.serialize()).then(() => swapModal(accountModal("Mot de passe changé."))).catch((e) => { unbusy(b); err.textContent = e.message; });
          return true;
        }
      }
    };
  }
  function deleteModal() {
    return {
      html: '<div class="kicker">Compte</div><h2>Supprimer le compte ?</h2><p class="small">Le compte et la partie en ligne seront effacés du serveur. Ta partie reste sur cet appareil.</p>' +
        '<label class="fld"><span>Mot de passe</span><input id="dl0" type="password" autocomplete="current-password"></label><p class="small err" id="dlErr"></p>' +
        '<div class="acts"><button class="btn" data-m="back">Retour</button><button class="btn pri" style="background:var(--bad)" data-m="go">Supprimer</button></div>',
      on: {
        back: () => { swapModal(accountModal()); return true; },
        go: (b) => {
          busy(b, "Suppression…");
          Cloud.deleteAccount($("#dl0").value).then(() => { closeModal(); updateCloudBtn(); toast("Compte supprimé. Ta partie reste sur cet appareil."); })
            .catch((e) => { unbusy(b); $("#dlErr").textContent = e.message; });
          return true;
        }
      }
    };
  }
  async function cloudPush(o) {
    o = o || {};
    const a = Cloud.account();
    if (!a || !a.token || U.sync.busy || U.saveLocked) return null;
    U.sync.busy = true;
    try {
      save();
      const r = await Cloud.push(E.serialize(), o);
      if (r.conflict) { U.sync.conflict = r; if (!o.quiet) toast("☁️ Une autre version de ta partie est en ligne. Ouvre ☁️ pour choisir laquelle garder."); }
      else { U.sync.conflict = null; U.sync.err = null; if (o.manual && !U.mcur) toast("☁️ Partie envoyée."); }
      return r;
    } catch (e) {
      U.sync.err = e.message;
      if (o.manual || e.status === 401) toast("☁️ " + esc(e.message));
      return null;
    } finally {
      U.sync.busy = false;
      updateCloudBtn();
    }
  }
  function updateCloudBtn() {
    const b = $("#cloudBtn"), a = Cloud.account();
    if (!b) return;
    b.classList.toggle("hidden", !a);
    b.classList.toggle("warn", !!(a && (!a.token || U.sync.conflict)));
    b.title = !a ? "" : !a.token ? "Reconnecte-toi" : U.sync.conflict ? "Deux versions de ta partie" : "Compte : " + a.pseudo;
  }
  /* au démarrage : la partie a-t-elle avancé sur un autre appareil ? */
  async function cloudCheck() {
    const a = Cloud.account();
    updateCloudBtn();
    if (!a || !a.token || U.saveLocked) return;
    try {
      const cl = await Cloud.pull();
      if (!cl || cl.rev === a.rev) return;
      const ask = () => { if (U.mcur) { setTimeout(ask, 1000); return; } chooseVersion(cl, "Ta partie en ligne a changé depuis ton dernier passage ici, sans doute sur un autre appareil."); };
      ask();
    } catch (e) { U.sync.err = e.message; updateCloudBtn(); }
  }
  function cloudTimers() {
    setInterval(() => {
      const a = Cloud.account();
      if (a && a.token && a.auto && !U.sync.conflict && Date.now() - (a.last || 0) > 4 * 60000) cloudPush({ quiet: true });
    }, 60000);
    document.addEventListener("visibilitychange", () => {
      const a = Cloud.account();
      if (document.hidden && a && a.token && a.auto && !U.sync.conflict && Date.now() - (a.last || 0) > 30000) cloudPush({ quiet: true, keepalive: true });
    });
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
    $("#ageName").textContent = ag.n;
    const old = ep === "papyrus" || ep === "enluminure";
    $("#ageNum").textContent = "Âge " + (old ? ROMAN(a + 1) + " sur " + ROMAN(D.AGES.length) : (a + 1) + "/" + D.AGES.length) + (S().cycle > 1 ? " · Semeur " + (S().cycle + 6) : "");
  }

  /* ------------------------------------------------------------- SIGNES (modale) */
  function openSigneModal(id) {
    const rec = E.RECIT || D.RECIT || {};
    const sDef = rec.signes && rec.signes[id];
    if (!sDef) return;
    const st = S();
    st.signes = st.signes || {};
    st.signes[id] = st.signes[id] || { vu: {} };
    const stSigne = st.signes[id];

    const parentModal = (U.mcur && U.mcur.signeId !== id) ? U.mcur : null;

    const renderContent = (feedbackText, feedbackCls) => {
      const places = (stSigne && stSigne.vu && typeof stSigne.vu === "object") ? Object.keys(stSigne.vu) : [];
      let h = '<div class="kicker">Écriture des Anciens</div>';
      h += '<h2>' + (stSigne.lu ? "Signe déchiffré" : "Signe inconnu") + '</h2>';
      h += '<div class="signe-hero">' + (window.signeSVG ? window.signeSVG(sDef.h, 72) : "") + '</div>';

      if (stSigne.lu) {
        h += '<div class="signe-mot-decouvert">' + esc(sDef.mot) + '</div>';
      }

      if (places.length > 0) {
        h += '<div class="signe-lieux"><span class="dim">Aperçu à :</span> ' + places.map(esc).join(", ") + '</div>';
      } else {
        h += '<div class="signe-lieux dim">Pas encore aperçu ailleurs.</div>';
      }

      if (stSigne.lu) {
        h += '<p class="small muted center">Tu as compris ce signe.</p>';
        h += '<div class="acts"><button class="btn pri" data-m="close">Refermer</button></div>';
      } else if (sDef.cond && !E.cond(sDef.cond)) {
        h += '<p class="small muted center">Quelque chose t’échappe encore pour percer ce signe.</p>';
        h += '<div class="acts"><button class="btn pri" data-m="close">Refermer</button></div>';
      } else {
        h += '<form id="signeForm" class="signe-form">' +
          '<div class="signe-input-row">' +
          '<input type="text" id="signeInput" class="input" placeholder="Ce qu’il veut dire…" autocomplete="off" autocapitalize="off" spellcheck="false" />' +
          '<button type="submit" id="signeBtn" class="btn pri">Proposer</button>' +
          '</div>' +
          '<div id="signeFeedback" class="signe-feedback ' + (feedbackCls || "") + '" aria-live="polite">' + (feedbackText ? esc(feedbackText) : "") + '</div>' +
          '</form>' +
          '<div class="acts"><button class="btn" data-m="close">Refermer</button></div>';
      }
      return h;
    };

    const bindEvents = (box) => {
      const form = box.querySelector("#signeForm");
      if (!form) return;
      const input = box.querySelector("#signeInput");
      const fb = box.querySelector("#signeFeedback");
      const btn = box.querySelector("#signeBtn");
      if (input) setTimeout(() => { try { input.focus(); } catch (e) {} }, 100);

      const submitAttempt = () => {
        const val = (input.value || "").trim();
        if (!val) return;
        const res = E.essaiSigne(id, val);
        if (res.delai) {
          A.err();
          vibe(40);
          fb.className = "signe-feedback delai";
          fb.textContent = "Attends " + res.left + " s avant de retenter.";
          return;
        }
        if (res.ok) {
          A.secret();
          save();
          render(true);
          box.innerHTML = renderContent();
          iconize(box);
          return;
        }
        if (res.proche) {
          A.err();
          vibe(40);
          fb.className = "signe-feedback proche";
          fb.textContent = "« Presque. »";
          input.select();
          return;
        }
        A.err();
        vibe(40);
        fb.className = "signe-feedback non";
        fb.textContent = "« Non. »";
        input.select();
      };

      form.addEventListener("submit", (ev) => {
        ev.preventDefault();
        submitAttempt();
      });
      if (btn) {
        btn.addEventListener("click", (ev) => {
          ev.preventDefault();
          submitAttempt();
        });
      }
    };

    const modalObj = {
      signeId: id,
      cls: "modal-signe",
      html: renderContent(),
      onOpen: bindEvents,
      onClose: () => {
        if (parentModal) {
          setTimeout(() => {
            if (parentModal.refresh) parentModal.html = parentModal.refresh();
            openModal(parentModal);
          }, 80);
        }
      }
    };

    if (parentModal) {
      swapModal(modalObj);
    } else {
      openModal(modalObj);
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
    $$("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === (PARENT[t] || t)));
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
    else if (U.tab === "cosmos") { el.innerHTML = viewCosmos(); mountCosmos(); }
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
  const ANCHORS = ["data-g", "data-slot", "data-clear", "data-cr", "data-chain", "data-if", "data-track", "data-untrack", "data-tree"];
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

  /* ------------------------------------------------------------ OBJECTIF ET SUIVI
   * affichés par-dessus la carte */
  function goalCard() {
    const st = S();
    const g = E.guide();
    if (!g) {
      return st.flags.arche ? '<div class="card acc goal-card compact"><div class="lbl">Objectif</div><div class="name">Choisis ton Grand Œuvre</div><div class="small">Il t’attend dans le Domaine, et dans l’onglet Cosmos du Journal.</div></div>' : "";
    }
    const ob = g.ob;
    const open = goalOpen();
    const title = ob.k === "craft" ? esc(I[ob.id].n) : esc(ob.n);
    // le compteur suit toujours l’âge où l’on est, même quand l’objectif vise déjà le suivant
    const ml = E.milestones()[st.age] || [], md = ml.filter((x) => x.done).length;
    let h = '<div class="card acc goal-card' + (open ? "" : " compact") + '"><div class="ghead-row"><button class="ghead" data-goalt><span class="lbl">Objectif</span><span class="gname">' + title + '</span><span class="zt">' + (open ? "▴" : "▾") + "</span></button>" +
      (ml.length ? '<button class="gmiles' + (md === ml.length ? " ok" : "") + '" data-miles title="Les étapes de cet âge">🏁 ' + (md === ml.length ? "✓" : "étapes " + md + "/" + ml.length) + "</button>" : "") + "</div>";
    h += nextAction(g);
    if (!open) return h + "</div>";
    // le détail, à la demande
    h += '<div class="gdetail small">' + esc(ob.txt || "") + "</div>";
    if (ob.k === "craft") {
      const it = I[ob.id];
      if (it.h && !st.known[ob.id]) h += '<div class="riddle small">« ' + esc(it.h) + " »</div>";
      if (g.step !== ob.id && I[g.step]) h += '<div class="tiny muted">Il faut d’abord : ' + (st.known[g.step] ? icon(g.step, "sm") + " " : "") + '<b class="link-txt" data-goto="' + g.step + '">' + esc(I[g.step].n) + "</b></div>";
      if (st.known[ob.id]) h += '<div class="row wrap" style="margin-top:6px"><button class="btn small ghost" data-tree="' + ob.id + '">Détail</button>' + (st.track && st.track.id === ob.id ? "" : '<button class="btn small ghost" data-track="' + ob.id + '">Suivre</button>') + "</div>";
      const z = it.e && it.e.zone;
      if (z && D.PASSAGES[z] && !(st.pass[z] && st.pass[z].done)) {
        const c = E.passCost(z);
        h += '<div class="tiny muted" style="margin-top:6px">Ensuite, le passage <b>' + esc(D.PASSAGES[z].n) + "</b> vers " + esc(zoneName(z)) + " : " + Object.keys(c).map((i) => fmt(c[i]) + " " + esc(I[i].n.toLowerCase())).join(", ") + ".</div>";
      }
    }
    return h + "</div>";
  }
  /* La prochaine chose à faire pour l’objectif, en une ligne : ramasser ce qui manque
   * (ici même), fabriquer d’un geste (les pièces intermédiaires comprises), ou aller
   * découvrir une recette à l’Atelier. Rien à retenir. */
  function nextAction(g) {
    const st = S(), ob = g.ob;
    const line = (inner) => '<div class="gact">' + inner + "</div>";
    if (ob.k === "exp") {
      if (st.exp.active) return line('<span class="small">🧭 En route… <b data-xl></b></span>');
      return line('<button class="btn small pri" data-exp="' + ob.z + '">🧭 Explorer</button><span class="tiny muted">' + esc(E.ZONES[ob.z].n) + "</span>");
    }
    if (ob.k === "pass") return passHTML(ob.z);
    if (ob.k === "ext") {
      const d = E.deposits().find((x) => { const c = E.extChoice(x.res, x.z); return c && (c.free > 0 || E.plan(c.t, 1).ok); });
      return d ? line('<button class="btn small pri" data-xadd="' + d.key + '" data-n="1">Poser ' + esc(I[E.extChoice(d.res, d.z).t].n.toLowerCase()) + " sur " + esc(I[d.res].n.toLowerCase()) + "</button>") : line('<span class="small">' + esc(ob.txt) + "</span>");
    }
    if (ob.k === "line") {
      const rec = st.known.manche && st.made.manche > 0 ? "manche" : Object.keys(st.known).find((k) => st.made[k] > 0 && E.automatable(k) && E.machCan("automate_bois", k));
      return line(rec ? '<button class="btn small pri" data-cr="' + rec + '" data-n="10">Commander : ' + esc(I[rec].n) + ' ×10</button>' : '<span class="small">' + esc(ob.txt) + "</span>");
    }
    const id = g.step, it = I[id];
    if (!it) return "";
    if (!st.known[id]) {
      const lvl = st.hints[id] || 0;
      return line('<div class="grow" data-goto="' + id + '"><div class="small">À découvrir : ' + (it.h ? "<i>« " + esc(it.h) + " »</i>" : "<b>une recette nouvelle</b>") + "</div>" +
        (lvl >= 1 ? '<div class="tiny muted">💭 L’action : ' + gesteChip(id) + "</div>" : "") +
        (lvl >= 2 ? '<div class="tiny muted">💭 Une des ressources : ' + icon(mainIngredient(id), "sm") + " " + esc(I[mainIngredient(id)].n) + "</div>" : "") +
        '</div><button class="btn small pri" data-gotab="atelier">Chercher</button>');
    }
    if (E.queued(id) > 0) return line('<span class="small">✋ En cours de fabrication : ' + esc(it.n.toLowerCase()) + ".</span>");
    const b = E.blocker(id);
    if (b && b.why !== "owned") return line('<span class="small">' + cap1(needText(id, b, true)) + ".</span>");
    if (b && b.why === "owned") return "";
    const p = E.plan(id, 1);
    if (p.ok) {
      const parts = p.steps.filter((x) => x[0] !== id).map((x) => esc(I[x[0]].n.toLowerCase()));
      return line('<button class="btn pri gmake" data-chain="' + id + '">Fabriquer : ' + esc(it.n) + (parts.length ? ' <span class="tiny">(avec ' + parts.join(", ") + ")</span>" : "") + "</button>");
    }
    // ce qui manque : d’abord ce qui se ramasse à la main, ici même
    const miss = Object.keys(p.missing);
    const hand = miss.find((k) => isRawGather(k) && E.ZONES[E.RES_ZONE[k]].res.includes(k));
    if (hand) {
      const z = E.RES_ZONE[hand], tot = Math.ceil((st.inv[hand] || 0) + p.missing[hand]);
      return '<div class="gis gact">' + '<button class="gis-ic hand" data-harv="' + z + ":" + hand + '" aria-label="Récolter : ' + esc(I[hand].n) + '">' + icon(hand) + "</button>" +
        '<div class="grow"><div class="small">Il manque <b data-gleft="' + hand + '" data-q="' + tot + '">' + fmt(p.missing[hand]) + "</b> " + esc(I[hand].n.toLowerCase()) + " pour " + esc(it.n.toLowerCase()) + '.</div><div class="tiny muted">Touche l’icône, ou ▶ pour récolter en continu.</div></div>' +
        (st.act && st.act.k === "harv" && st.act.res === hand ? '<span class="tiny muted">en cours…</span>' : '<button class="btn small" data-hloop="' + z + ":" + hand + '">▶</button>') + "</div>";
    }
    const ext = miss.find((k) => isRawGather(k));
    if (ext) return line('<span class="small">Il manque ' + fmt(p.missing[ext]) + " " + esc(I[ext].n.toLowerCase()) + " : cette ressource ne se récolte pas à la main. Pose un extracteur sur son gisement.</span>");
    return line('<span class="small">Il manque : ' + miss.map((k) => '<b class="link-txt" data-goto="' + k + '">' + fmt(p.missing[k]) + " " + esc(I[k].n.toLowerCase()) + "</b>").join(", ") + ".</span>");
  }
  /* ce qui change la carte d’objectif (pour la redessiner au bon moment) */
  function goalSig() {
    const g = E.guide();
    if (!g || g.ob.k !== "craft") return g ? g.ob.k + (g.ob.z || "") + (S().exp.active ? 1 : 0) : "";
    const p = I[g.step] && S().known[g.step] ? E.plan(g.step, 1) : null;
    const a = S().act;
    return g.step + ":" + (S().hints[g.step] || 0) + (p ? (p.ok ? 1 : Object.keys(p.missing).join()) : "?") + E.queued(g.step) + goalOpen() + (a ? a.k + (a.id || a.res) : "");
  }
  /* l’objectif déplié ou non : pendant un Suivi, il reste replié (on peut le rouvrir un moment) pour laisser voir le Domaine */
  function goalOpen() {
    const st = S();
    if (st.track && I[st.track.id]) return !!U.goalPeek;
    return !!st.settings.goalOpen;
  }
  /* les jalons : ce qu’il y a à faire à chaque âge, et le premier pas vers le suivant */
  function mileName(ob) {
    if (ob.k === "craft") return (S().known[ob.id] ? icon(ob.id, "sm") : '<span class="ic sm unk">?</span>') + ' <span class="link-txt" data-goto="' + ob.id + '">' + esc(I[ob.id].n) + "</span>";
    return (ob.k === "exp" ? "🧭 " : ob.k === "ext" ? "⛏️ " : ob.k === "pass" ? "🚧 " : "🏭 ") + esc(ob.n);
  }
  function openMilestones() {
    const st = S(), ms = E.milestones(), cur = E.objective();
    st.flags.milesSeen = true;
    let h = '<div class="kicker">Les étapes</div><h2>' + esc(D.AGES[st.age].n) + '</h2><p class="small muted">Chaque âge a ses étapes. Fais-les toutes et l’âge est <b>accompli</b> : +' + D.AGE_DONE + " ✨ Intuition. Certaines sont facultatives : tu peux passer à l’âge suivant sans elles, et revenir les faire quand tu veux.</p>";
    ms.forEach((list, a) => {
      if (!list || a > st.age + 1) return;
      const done = list.filter((x) => x.done).length, next = a === st.age + 1, full = done === list.length;
      const shown = next ? list.filter((x) => !x.done).slice(0, 1) : list;
      if (!shown.length) return;
      const open = a === st.age || next || (!full && cur && list.some((x) => x.i === cur.i));
      h += '<details class="miles' + (full ? " full" : "") + '"' + (open ? " open" : "") + "><summary><b>" + (next ? "Vers l’âge suivant" : esc(D.AGES[a].n)) + '</b> <span class="tiny muted">' + (next ? esc(D.AGES[a].n) : full ? "✓ accompli" : done + " sur " + list.length) + "</span></summary>" +
        shown.map((x) => '<div class="mile' + (x.done ? " done" : cur && cur.i === x.i ? " cur" : "") + '"><span class="mk">' + (x.done ? "✓" : cur && cur.i === x.i ? "➜" : "○") + "</span>" + mileName(x.ob) + "</div>").join("") + "</details>";
    });
    openModal({ html: h + '<div class="acts"><button class="btn pri" data-m="close">Fermer</button></div>' });
  }
  const WHY_STEP = { station: "Il te faut d’abord :", zone: "Il te faut d’abord atteindre une nouvelle terre. Elle s’ouvre avec :", pass: "Il te faut d’abord ouvrir le passage vers une nouvelle terre :", unknown: "Prochaine étape :" };
  /* un passage vers une terre : ce qu’il coûte, ce qui est déjà versé, et le bouton pour verser */
  function passHTML(z) {
    const p = E.passInfo(z), st = S();
    if (!p || !p.ready) return "";
    return '<div class="passbox"><div class="small"><b>🚧 ' + esc(p.P.n) + '</b> <span class="tiny muted">' + Math.floor(p.frac * 100) + ' %</span></div><div class="tiny muted">' + esc(p.P.t) + "</div>" +
      '<div class="bar pass"><i style="width:' + (p.frac * 100).toFixed(1) + '%"></i></div>' +
      (p.done ? "" : '<div class="row wrap" style="margin:6px 0"><button class="btn small pri' + (p.can ? "" : " nope") + '" data-pour="' + z + '">🚧 Verser</button><span class="tiny muted">Une fois franchi : +' + p.P.tr + " ✦ Traces pour la prochaine relève</span></div>") +
      '<div class="passcost small">' +
      Object.keys(p.cost).map((i) => {
        const got = Math.min(p.cost[i], p.paid[i] || 0), ok = got >= p.cost[i], eta = passEta(p, i), have = st.inv[i] || 0;
        return '<div class="ing link' + (ok ? " paid" : "") + '" data-goto="' + i + '">' + icon(i, "sm") + "<b>" + esc(I[i].n) + "</b> " + fmt(got) + " / " + fmt(p.cost[i]) + " versés" +
          (ok ? " ✓" : ' <span class="tiny muted">· tu en as ' + fmt(have) + (eta === "prêt" ? " : de quoi finir" : eta ? " · encore " + eta : "") + "</span>") + "</div>";
      }).join("") + "</div></div>";
  }
  /* combien de temps avant d’avoir de quoi payer une matière, à la production actuelle (extracteurs, machines) */
  function passEta(p, i) {
    const need = (p.left[i] || 0) - (S().inv[i] || 0);
    if (need <= 0) return "prêt";
    const x = E.production().find((y) => y.id === i), r = x ? x.net : 0;
    return r > 1e-6 ? "≈ " + fmtTime(need / r) : "";
  }
  function pour(z, btn) {
    const r = E.passPour(z), p = E.passInfo(z);
    if (!r.ok) {
      A.fail(0);
      toast("Rien à verser pour l’instant. Il manque " + Object.keys(p.left).map((k) => fmt(p.left[k]) + " " + esc(I[k].n)).join(", ") + ".", { key: "pour" });
      return;
    }
    A.click(); vibe(10);
    const pt = elCenter(btn);
    if (!r.done) floater("🚧 " + Math.floor(p.frac * 100) + " %", pt.x, pt.y - 16, "var(--good)");
    render(true);
  }
  function stepBox(id, why, isTarget) {
    const st = S(), it = I[id];
    if (why === "pass") { const z = E.passPending().find((x) => E.ZONES[x].req === id); if (z) return '<div class="stepbox"><div class="tiny muted">' + WHY_STEP.pass + "</div>" + passHTML(z) + "</div>"; }
    let h = '<div class="stepbox">';
    if (!isTarget) h += '<div class="tiny muted">' + (WHY_STEP[why] || "Prochaine étape :") + "</div><div class=\"row\" style=\"margin:4px 0\">" + (st.known[id] ? icon(id, "sm") : '<span class="ic sm unk">?</span>') +
      ' <b class="link-txt" data-goto="' + id + '">' + esc(it.n) + "</b></div>" + (it.h && !st.known[id] ? '<div class="riddle small">« ' + esc(it.h) + " »</div>" : "");
    if (!st.known[id]) {
      const lvl = st.hints[id] || 0;
      if (lvl >= 1) h += '<div class="memo">💭 L’action : ' + gesteChip(id) + "</div>";
      if (lvl >= 2) { const m = mainIngredient(id); h += '<div class="memo">💭 Une des ressources : ' + icon(m, "sm") + " " + esc(I[m].n) + "</div>"; }
    } else {
      const b = E.blocker(id);
      h += '<div class="rl small">' + gesteChip(id) + ingHTML(E.costFor(id), { check: true, link: true }) + "</div>";
      if (!b) h += '<div class="row wrap" style="margin-top:6px"><button class="btn small pri" data-chain="' + id + '">⚡ Fabriquer</button><button class="btn small" data-tree="' + id + '">🌳 Détail</button>' +
        (st.track && st.track.id === id ? "" : '<button class="btn small" data-track="' + id + '">🎯 Suivre</button>') + "</div>";
    }
    return h === '<div class="stepbox">' ? "" : h + "</div>";
  }

  /* la jauge des souvenirs : elle avance avec chaque combinaison nouvelle essayée */
  function memoryHTML(m, gain) {
    if (!m) return "";
    const f = Math.max(0, Math.min(1, (m.p - m.prev) / (m.next - m.prev)));
    const what = (["l’action", "une des ressources", "la recette entière"][m.lvl] || "") + (I[m.id] ? " de « " + I[m.id].n + " »" : "");
    return '<div class="memory"><div class="row between tiny"><span>💭 Souvenirs' + (gain ? ' <b class="gain">' + gain + "</b>" : "") + "</span><span class=\"muted\">prochain : " + what + "</span></div>" +
      '<div class="bar"><i style="width:' + (f * 100).toFixed(0) + '%"></i></div>' +
      (gain ? "" : '<div class="tiny dim">Chaque nouvelle combinaison tentée à l’Atelier réveille des souvenirs, surtout si elle se rapproche de ce que tu cherches.</div>') + "</div>";
  }
  function trackerHTML() {
    const t = S().track;
    if (!t || !I[t.id]) return "";
    const id = t.id, p = E.plan(id, 1);
    let h = '<div class="card track"><div class="row between"><div class="lbl">🎯 Suivi</div><button class="btn small ghost" data-untrack>✕</button></div>' +
      '<div class="row" style="margin:4px 0 6px">' + icon(id, "sm") + ' <b class="link-txt" data-goto="' + id + '">' + esc(I[id].n) + "</b></div>";
    if (E.queued(id) > 0) return h + '<div class="small">✋ Tes mains s’y mettent : fabrication en cours.</div></div>';
    if (p.ok) return h + '<div class="small" style="color:var(--good)">Tout est prêt.</div><button class="btn small pri" style="margin-top:6px" data-chain="' + id + '">⚡ Fabriquer</button></div>';
    const f = E.flows();
    Object.keys(p.missing).forEach((k) => {
      if (p.locked.includes(k) || p.blocked[k]) return;
      const need = p.missing[k];
      const have = Math.floor(S().inv[k] || 0);
      const net = E.rate(k) + (f.prod[k] || 0) - (f.cons[k] || 0);
      const eta = net > 0 ? "≈ " + fmtTime(need / net) : isRawGather(k) ? "à récolter" : "";
      h += '<div class="cost-row" data-goto="' + k + '">' + icon(k, "sm") + '<span class="grow">' + esc(I[k].n) + '</span><span class="tiny">il manque ' + fmt(need) + '</span><span class="tiny muted eta">' + eta + "</span></div>";
      void have;
    });
    p.locked.forEach((k) => { h += '<div class="why" data-goto="' + k + '">Recette inconnue : ' + esc(I[k].n) + "</div>"; });
    Object.keys(p.blocked).forEach((k) => { const b = p.blocked[k]; h += '<div class="why">' + esc(I[k].n) + " : " + needText(k, b, true) + "</div>"; });
    return h + "</div>";
  }

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
    // recherche, tri et filtres quand il y a de quoi chercher
    const many = Object.keys(st.seen).length >= 10 || !!U.iq || o.filter !== "tout";
    h += '<div class="sub-row"><h3 class="sub">Tes ressources</h3>' + "</div>" +
      (many ? '<div class="inv-tools"><div class="search"><input id="iq" type="search" placeholder="Chercher…" value="' + esc(U.iq || "") + '" autocomplete="off" spellcheck="false"></div>' +
      '<select id="isort" aria-label="Trier">' + INV_SORTS.map(([k, n]) => '<option value="' + k + '"' + (o.sort === k ? " selected" : "") + ">" + n + "</option>").join("") + "</select></div>" +
      '<div class="filters">' + INV_FILTERS.map(([k, n]) => '<button data-if="' + k + '" class="' + (o.filter === k ? "on" : "") + '">' + n + "</button>").join("") + "</div>" : "");
    const inv = invItems();
    const tile = (id) => {
      const sel = U.slots.includes(id), fav = favs()[id];
      const rx = st.studied[id] && E.reactions(id)[U.geste];
      return '<button class="inv' + (sel ? " sel" : "") + (st.inv[id] >= 1 ? "" : " zero") + (I[id].t === "relic" ? " relic" : "") + '" data-inv="' + id + '">' + (fav ? '<i class="fav">♥</i>' : "") +
        (rx ? '<i class="rx" title="Réagit avec cette action">✦' + (rx > 1 ? rx : "") + "</i>" : "") + icon(id) +
        '<span class="c" data-c="' + id + '">' + fmt(st.inv[id] || 0) + '</span><span class="n">' + esc(I[id].n) + "</span></button>";
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
    if (!inv.length) h += '<p class="small muted center">' + (U.iq || o.filter !== "tout" ? "Rien ne correspond." : "Rien ici. Va récolter dans le Domaine.") + "</p>";
    else if (Object.keys(st.known).length >= 3) h += '<p class="tiny dim center" style="margin-top:8px">Appui long sur une ressource : ouvre sa fiche (♥ pour la garder en tête de liste, 🔍 pour l’étudier). Une ressource étudiée porte un ✦ quand elle réagit avec l’action choisie.</p>';
    return h;
  }
  const INV_SORTS = [["age", "Par âge"], ["name", "Par nom"], ["qty", "Les plus nombreuses"], ["new", "Dernières trouvées"]];
  const INV_FILTERS = [["tout", "Tout"], ["fav", "♥ Favorites"], ["geste", "Pour cette action"], ["res", "Récoltées"], ["comp", "Fabriquées"], ["new", "Inutilisées"]];
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
      if (o.filter === "geste") return !!forG[id];
      if (o.filter === "res") return it.t === "res";
      if (o.filter === "comp") return it.t !== "res";
      if (o.filter === "new") return !used[id];
      return true;
    }).sort((a, b) => (o.sort !== "age" ? (fv[b] ? 1 : 0) - (fv[a] ? 1 : 0) : 0) || (sorts[o.sort] || byAge)(a, b));
  }
  const WHY = {
    froid: "Rien à tirer de ce mélange pour l’instant.",
    frais: "Une de ces ressources sert dans une autre recette, avec une autre action ou d’autres ressources.",
    tiede: "Bonne action pour ces ressources. Cherche encore.",
    manque: "Bonne action, mais il manque une ressource.",
    trop: "Bonne action, mais une de ces ressources est en trop.",
    geste: "Les bonnes ressources, mais pas la bonne action."
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
      return head + '<div class="small">Tu connais la recette, mais il te manque :</div><div class="row wrap small">' +
        Object.keys(miss).map((i) => '<span class="ing lack link" data-goto="' + i + '">' + icon(i, "sm") + fmt(miss[i]) + " " + esc(I[i].n) + "</span>").join("") + "</div>" +
        '<div class="row wrap" style="margin-top:8px"><button class="btn small pri" data-chain="' + r.id + '">⚡ Tout fabriquer</button><button class="btn small" data-tree="' + r.id + '">🌳 Détail</button><button class="btn small" data-track="' + r.id + '">🎯 Suivre</button></div></div></div>';
    }
    if (r.kind === "blocked") {
      const b = r.info;
      let msg = "Il te manque un outil.";
      if (b.why === "heat") msg = "Tu chauffes, mais rien ne prend. Il faut au moins " + fmtHeat(b.heat) + " (tu atteins " + fmtHeat(E.heat()) + ").";
      if (b.why === "lvl") msg = U.geste === "marteler" ? "Ton enclume n’est pas assez dure pour ce métal." : "Il faudrait bien plus de puissance.";
      const st = b.why === "heat" ? E.stationFor("chauffer", b.heat) : b.why === "lvl" ? E.stationFor(I[r.id].r[0], 0, b.lvl) : null;
      return thermo(4) + '<div class="row" style="margin-top:6px">' + icon(r.id) + '<div class="grow"><b>' + esc(I[r.id].n) + '</b><div class="small">' + esc(msg) + "</div>" +
        (st ? '<div class="small">Il te faudrait : <span class="link-txt" data-goto="' + st + '">' + esc(I[st].n) + "</span></div>" : "") +
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
    h += '<div class="search"><input id="cq" type="search" placeholder="Chercher une recette ou une ressource…" value="' + esc(U.q) + '" autocomplete="off" spellcheck="false"></div>';
    h += '<div class="filters">' + [["tout", "Tout"], ["craft", "Réalisables"], ["unk", "À découvrir"], ["prod", "Équipement"], ["pin", "★ Épinglées"]].map(([k, n]) =>
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
    let h = '<div class="rec' + (owned ? " owned" : "") + '" data-rec="' + id + '"><div class="rh">' + icon(id) + '<div class="grow" data-goto="' + id + '"><div class="rt">' + esc(it.n) + badgeHTML(id) + "</div>" +
      (stars ? '<div class="stars">' + "★".repeat(stars) + "</div>" : "") + '</div><div class="small muted" data-c="' + id + '">' + (uniq ? (owned ? "✓" : "") : fmt(st.inv[id] || 0)) + "</div>" +
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

  /* ------------------------------------------------------------ JOURNAL */
  function viewJournal() {
    const st = S();
    const tabs = [["fragments", "Fragments"]];
    const livreNew = E.hasNewLivre ? E.hasNewLivre() : false;
    if (E.hasLivre && E.hasLivre()) tabs.push(["livre", "Livre" + (livreNew ? " •" : "")]);
    if (E.hasQuestions && E.hasQuestions()) tabs.push(["questions", "Questions"]);
    if (E.hasSignes && E.hasSignes()) tabs.push(["signes", "Signes"]);
    tabs.push(["secrets", "Secrets"]);
    if (E.has("flute")) tabs.push(["flute", "Flûte"]);
    tabs.push(["fins", "Fins"], ["stats", "Mémoire"]);
    if (!tabs.find((t) => t[0] === U.journalTab)) U.journalTab = "fragments";
    let h = (tabAvailable("cosmos") ? subTabs("journal", "cosmos", "Journal", "Cosmos") : '<h2 class="title">Journal</h2>') + '<div class="filters">' + tabs.map(([k, n]) => '<button data-jt="' + k + '" class="' + (U.journalTab === k ? "on" : "") + '">' + n + "</button>").join("") + "</div>";
    if (U.journalTab === "fragments") {
      const ids = E.visibleFrags ? E.visibleFrags() : Object.keys(D.FRAGS);
      const n = ids.filter((f) => st.frags[f]).length;
      h += '<p class="small muted">' + n + "/" + ids.length + " fragments de l’histoire retrouvés.</p>";
      const miss = {};
      ids.forEach((f) => {
        const F = D.FRAGS[f];
        if (!F) return;
        if (st.frags[f]) h += '<button class="frag" data-frag="' + f + '"><span class="fi">📜</span><div class="grow"><b>' + esc(F.n || F.titre) + '</b><div class="tiny muted">' + esc(fragPlace(F.z)) + "</div></div></button>";
        else { const k = unkPlace(F.z); miss[k] = (miss[k] || 0) + 1; }
      });
      if (Object.keys(miss).length) {
        h += '<h3 class="sub">Encore à découvrir</h3>';
        for (const k in miss) h += '<div class="frag unk"><span class="fi">❔</span><div class="grow">' + esc(k) + '<div class="tiny muted">' + miss[k] + " fragment" + (miss[k] > 1 ? "s" : "") + "</div></div></div>";
      }
    } else if (U.journalTab === "livre") {
      const cases = E.livre ? E.livre() : [];
      const foundCount = cases.filter((c) => c.page).length;
      h += '<p class="small muted">' + foundCount + "/32 pages retrouvées dans le Livre des Semeurs.</p>";
      h += '<div class="livre-grid">';
      cases.forEach((c) => {
        if (c.page) {
          h += '<button class="livre-cell found' + (c.nouveau ? ' has-new' : '') + '" data-page="' + esc(c.id) + '">';
          h += '<span class="livre-num">' + c.n + '</span>';
          if (c.nouveau) h += '<span class="livre-dot">●</span>';
          h += '<span class="livre-titre">' + esc(c.page.titre || ("Page " + c.n)) + '</span>';
          h += '</button>';
        } else {
          h += '<div class="livre-cell empty"><span class="livre-num">' + c.n + '</span></div>';
        }
      });
      h += '</div>';
    } else if (U.journalTab === "questions") {
      const list = E.questions ? E.questions() : [];
      const sorted = list.slice().sort((a, b) => (a.resolu === b.resolu ? 0 : a.resolu ? 1 : -1));
      if (!sorted.length) {
        h += '<p class="small muted center" style="padding:20px 0">Aucune question pour l’instant.</p>';
      } else {
        h += '<div class="questions-list">';
        sorted.forEach((q) => {
          const isResolu = q.resolu;
          h += '<div class="card question-card' + (isResolu ? ' resolu' : '') + '">';
          h += '<div class="question-title' + (isResolu ? ' strikethrough' : '') + '">' + esc(q.titre) + '</div>';
          if (q.aides && q.aides.length) {
            h += '<div class="question-aides">';
            q.aides.forEach((aide, idx) => {
              h += '<div class="question-aide"><span class="aide-num">Piste ' + (idx + 1) + ' :</span> ' + recitHTML(aide, q.titre || "Question") + '</div>';
            });
            h += '</div>';
          }
          if (!isResolu && q.cost !== null) {
            const canAfford = (st.intu || 0) >= q.cost;
            const whyText = canAfford ? "" : " (manque d’Intuition)";
            h += '<div class="acts" style="margin-top:8px">';
            h += '<button class="btn' + (canAfford ? ' pri' : ' dis') + '" data-askhelp="' + esc(q.id) + '"' + (canAfford ? '' : ' disabled') + '>';
            h += '💭 Réfléchir : ' + q.cost + ' ✨' + (canAfford ? '' : ' <span class="tiny muted">' + whyText + '</span>');
            h += '</button></div>';
          }
          h += '</div>';
        });
        h += '</div>';
      }
    } else if (U.journalTab === "signes") {
      const seen = E.seenSignes ? E.seenSignes() : [];
      const compris = seen.filter((s) => s.lu).length;
      h += '<p class="small muted">' + compris + "/" + seen.length + " signes compris.</p>";
      if (!seen.length) {
        h += '<p class="small muted center" style="padding:20px 0">Aucun signe aperçu pour l’instant.</p>';
      } else {
        h += '<div class="signes-grid">';
        seen.forEach((s) => {
          const count = s.count || 0;
          const countTxt = count === 1 ? "1 endroit" : count + " endroits";
          h += '<button class="signe-card' + (s.lu ? ' lu' : '') + '" data-s="' + esc(s.id) + '">' +
            (s.lu
              ? '<div class="signe-card-mot">' + esc(s.def.mot) + '</div>'
              : '<div class="signe-card-dessin">' + (window.signeSVG ? window.signeSVG(s.def.h, 36) : '') + '</div>') +
            '<div class="signe-card-lieux">' + countTxt + '</div>' +
            '</button>';
        });
        h += '</div>';
      }
    } else if (U.journalTab === "secrets") {
      const n = D.SECRETS.filter((s) => st.secrets[s.id]).length;
      h += '<p class="small muted">' + n + "/" + D.SECRETS.length + " secrets découverts. Relis les fragments : certains cachent un code.</p><div class=\"secret-grid\">";
      D.SECRETS.forEach((s) => {
        const found = st.secrets[s.id];
        const name = s.n || (I[s.id] ? I[s.id].n : D.MELODIES[s.id] ? D.MELODIES[s.id].n : s.id);
        h += '<div class="sec' + (found ? "" : " unk") + '"><div class="k">' + s.k + "</div>" + (found ? esc(name) : "???") + "</div>";
      });
      h += "</div>";
    } else if (U.journalTab === "flute") {
      h += '<div class="card"><p class="small muted center">Un os creux percé de cinq trous. Touche-les pour jouer. Une pause de quelques secondes, et l’air recommence à zéro.</p><div class="flute-body"><div class="flute">' +
        [1, 2, 3, 4, 5].map((n) => '<button class="hole" data-note="' + n + '">' + n + "</button>").join("") + '</div></div><div class="notes" id="notes">' + st.notes.join(" · ") + "</div></div>";
      const known = Object.keys(D.MELODIES).filter((m) => st.secrets[m]);
      if (known.length) {
        h += '<h3 class="sub">Mélodies connues</h3><p class="tiny muted">Touche une mélodie pour la rejouer sur ta flûte.</p>';
        known.forEach((m) => { h += '<button class="frag" data-play="' + m + '"><span class="fi">🎶</span><div class="grow"><b>' + esc(D.MELODIES[m].n) + '</b><div class="tiny muted">' + D.MELODIES[m].notes.join(" · ") + "</div></div></button>"; });
      } else h += '<p class="small muted">Tu ne connais encore aucune mélodie. Le monde t’en a peut-être déjà appris une sans que tu y fasses attention.</p>';
    } else if (U.journalTab === "fins") {
      // le prestige, dit simplement : ce qu’on garde, ce qu’on gagne
      const ech = Object.values(st.meta.endings).reduce((a, b) => a + b, 0);
      h += '<div class="card cyc"><b>✦ Relève, Traces et Échos</b><p class="small">Dès qu’un passage vers une nouvelle terre est franchi, tu peux passer le relais : un nouveau Semeur s’éveille. ' +
        "Le monde, tes ressources, tes machines et les terres repartent de zéro, mais tu gardes ton Carnet, tes fragments, tes secrets et la <b>Mémoire des mains</b>, achetée avec les <b>Traces</b> que laissent les passages.</p>" +
        '<p class="small">Chaque fin atteinte laisse en plus un <b>Écho</b>, pour toujours : +50 % de récolte et de production par Écho, dès la relève suivante.</p>' +
        '<div class="stat"><span class="muted">Ce Semeur</span><b>' + (st.cycle + 6) + "e · " + st.echoes + " Écho" + (st.echoes > 1 ? "s" : "") + (st.echoes ? " (+" + st.echoes * 50 + " %)" : "") + "</b></div>" +
        '<div class="stat"><span class="muted">À la relève</span><b>+' + E.releveGain() + " ✦ · " + ech + " Écho" + (ech > 1 ? "s" : "") + "</b></div>" +
        '<button class="btn small pri" data-cycle style="margin-top:8px">✦ Mémoire des mains</button></div>';
      Object.keys(D.ENDINGS).forEach((k) => {
        const en = D.ENDINGS[k], got = st.meta.endings[k];
        h += '<div class="frag' + (got ? "" : " unk") + '"><span class="fi">' + (got ? en.ic : "❔") + '</span><div class="grow"><b>' + (got ? esc(en.n) : "???") + '</b><div class="tiny muted">' +
          (got ? "Atteinte " + got + " fois" : "Une fin encore inconnue.") + "</div></div></div>";
      });
    } else {
      const evs = Object.keys(D.EVENTS).filter((id) => st.made[id] > 0);
      h += '<div class="card">' + [["Temps de jeu", fmtTime(st.stats.play)], ["Récoltes à la main", fmt(st.stats.taps)], ["Fabrications", fmt(st.stats.crafts)],
        ["Tentatives à l’Atelier", fmt(st.stats.tries)], ["Recettes connues", Object.keys(st.known).length], ["Semeur", st.cycle + 6 + "e"]].map(([a, b]) => '<div class="stat"><span class="muted">' + a + "</span><b>" + b + "</b></div>").join("") + "</div>";
      if (evs.length) {
        h += '<h3 class="sub">Réminiscences</h3>';
        evs.forEach((id) => { h += '<div class="card small serif" style="font-size:15px">' + icon(id, "sm") + " " + esc(D.EVENTS[id]) + "</div>"; });
      }
    }
    return h;
  }
  function fragPlace(z) { return z === "terminal" ? "Terminal d’ARCHE" : z === "cosmos" ? "Le signal de Kher" : zoneName(z); }
  function unkPlace(z) {
    if (z === "terminal" || z === "cosmos") return "Quelque part, hors du monde";
    if (E.ZONES[z] && E.ZONES[z].secret) return "Un lieu caché";
    return E.zoneOpen(z) ? zoneName(z) : "Une terre que tu n’as pas encore foulée";
  }

  /* ------------------------------------------------------------ COSMOS */
  function viewCosmos() {
    const st = S();
    const tabs = [["ciel", "Ciel"]];
    if (st.flags.arche || E.cache().term) tabs.push(["arche", "ARCHE"]);
    if (Object.keys(D.PROJECTS).some(E.projVisible)) tabs.push(["oeuvres", "Grands Œuvres"]);
    if (!tabs.find((t) => t[0] === U.cosmosTab)) U.cosmosTab = "ciel";
    let h = subTabs("journal", "cosmos", "Journal", "Cosmos") + '<div class="filters" style="margin-top:4px">' + tabs.map(([k, n]) => '<button data-ct="' + k + '" class="' + (U.cosmosTab === k ? "on" : "") + '">' + n + "</button>").join("") + "</div>";
    if (U.cosmosTab === "ciel") {
      h += '<div class="sky-wrap"><canvas id="skyCanvas"></canvas><div class="sky-info" id="skyInfo">Touche le ciel.</div></div>';
      if (E.cache().signal) h += '<button class="btn wide pri" id="listen">📡 Écouter Kher</button>';
      else h += '<p class="small muted">Avec une oreille assez grande, tu pourrais peut-être entendre ce que dit l’étoile rouge.</p>';
    } else if (U.cosmosTab === "arche") {
      h += '<div class="term" id="term">';
      if (!st.flags.arche) h += '<div class="l">Aucun signal radio.</div>';
      st.arche.forEach((l) => { h += '<div class="l">' + esc(l.txt) + "</div>"; });
      if (st.term.length) h += '<div class="l">────────</div>' + st.term.map((l) => '<div class="l' + (l.startsWith("> ") ? " u" : "") + '">' + esc(l) + "</div>").join("");
      h += "</div>";
      if (E.cache().term) h += '<form class="term-in" id="termForm" autocomplete="off"><input id="termIn" placeholder="tape une commande…" autocapitalize="off" spellcheck="false"><button class="btn" type="submit">⏎</button></form>';
      else h += '<p class="small muted">Un ordinateur te permettrait de dialoguer avec ARCHE.</p>';
    } else {
      h += '<p class="small muted">Un Grand Œuvre se bâtit avec ce que tu verses depuis la Réserve, ou ce qu’il y prend seul quand tu l’alimentes. Il en demande des quantités énormes.</p>';
      for (const pid in D.PROJECTS) if (E.projVisible(pid)) h += projCard(pid);
    }
    return h;
  }
  function projCard(pid) {
    const P = D.PROJECTS[pid], ps = E.projState(pid), st = S();
    let h = '<div class="card proj"><div class="ph"><span class="pi">' + P.ic + '</span><div class="grow"><div class="pn">' + esc(P.n) + '</div><div class="small muted">' + esc(P.d) + "</div></div></div>";
    P.steps.forEach((s, i) => {
      const cls = i < ps.step ? " done" : i === ps.step ? " cur" : "";
      h += '<div class="step' + cls + '"><div class="sn">' + (i < ps.step ? "✓ " : i + 1 + ". ") + esc(s.n) + '</div><div class="tiny muted">' + esc(s.d || "") + "</div>";
      if (i === ps.step) {
        if (s.cost) {
          for (const k in s.cost) {
            const paid = ps.paid[k] || 0;
            h += '<div class="cost-row" data-goto="' + k + '">' + icon(k, "sm") + '<span class="grow">' + esc(I[k].n) + '</span><span class="tiny">' + fmt(paid) + "/" + fmt(s.cost[k]) + '</span><div class="bar"><i style="width:' + (100 * paid / s.cost[k]).toFixed(1) + '%"></i></div></div>';
          }
          if (s.need && !st.frags[s.need]) h += '<div class="why">Il faut d’abord atteindre ' + esc(D.FRAGS[s.need].n) + ".</div>";
          if (!(s.need && !st.frags[s.need])) h += '<div class="row wrap" style="margin-top:8px"><button class="btn small pri" data-contrib="' + pid + '">Verser</button><button class="btn small' + (E.siteOn(pid) ? " on" : "") + '" data-feed="' + pid + '">' + (E.siteOn(pid) ? "Alimenté ✓" : "Alimenter") + "</button></div>";
        } else if (s.fire) h += '<button class="btn wide pri" style="margin-top:8px;background:#ff5a3c" data-fire="' + pid + '">💥 Mise à feu</button>';
        else if (s.melody) h += '<p class="small" style="margin-top:6px">🎶 Prends ta flûte (Journal) et joue <b>' + esc(D.MELODIES[s.melody].n) + "</b>.</p>";
      }
      h += "</div>";
    });
    if (ps.step >= P.steps.length) h += '<p class="small" style="color:var(--good);margin-top:8px">Œuvre accomplie.</p>';
    return h + "</div>";
  }
  function mountCosmos() {
    const cv = $("#skyCanvas");
    if (cv) Sky.mount(cv, { age: S().age, dish: E.cache().signal, decoded: !!S().flags.decoded });
    else Sky.unmount();
    const t = $("#term");
    if (t) t.scrollTop = t.scrollHeight;
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
    if (n.locked) return "Il te faut d’abord : " + esc(I[n.x.need].n) + ".";
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
      if (r.fresh && !I[r.id].sec) fete({ id: r.id, kick: "Recette trouvée", title: I[r.id].n, sub: r.kind === "blocked" ? "Inscrite dans ton Carnet. " + cap1(needText(r.id, r.info)) + "." : "Inscrite dans ton Carnet, à fabriquer quand tu veux." });
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
          if (j && E.cancelJob(i)) { A.click(); toast("Annulé : " + esc(I[j.id].n) + ". Les ressources sont revenues dans ta Réserve."); }
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
    let h = '<div class="rwin"><div class="row">' + (known || !it.r || st.seen[id] ? icon(id, "lg") : '<span class="ic lg unk">?</span>') +
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
        if (it.d) h += '<p class="serif rdesc"><i>' + esc(it.d) + "</i></p>";
      }
      // l’effet en vert, sauf ce que la ligne « jeu » dit déjà
      const plain = (t) => t.toLowerCase().replace(/[^a-zà-ÿ0-9]+/g, " ").trim();
      const fx = fxList(id).filter((f) => !(it.u && plain(it.u).includes(plain(f))));
      if (fx.length) h += '<p class="small" style="color:var(--good)">' + esc(fx.join(" · ")) + "</p>";
      h += '<p class="small muted">' + (uniq ? (owned ? "Tu le possèdes." : "Tu ne l’as pas encore.") : "En réserve : <b>" + fmt(st.inv[id] || 0) + "</b>" + (E.rate(id) ? " · " + fmtRate(E.rate(id)) : "")) + "</p>";
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
              return '<button class="ring' + (lack ? " lack" : "") + '" data-m="nav" data-id="' + k + '">' + icon(k, "sm") + '<span class="grow">' + esc(I[k].n) + '</span><span class="tiny">' + fmt(have) + " / " + fmt(cost[k]) + "</span><span class=\"go\">›</span></button>";
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
    const back = U.rstack.length > 1;
    h += '<div class="acts">' + (back ? '<button class="btn" data-m="back">← ' + esc(I[U.rstack[U.rstack.length - 2]].n) + "</button>" : "") +
      (it.r && known ? '<button class="btn ghost" data-m="carnet">📖 Carnet</button>' : "") + '<button class="btn pri" data-m="close">Fermer</button></div></div>';
    const redraw = () => { if (U.mcur && U.mcur.rec) swapModal(recipeModal()); };
    return {
      rec: true,
      html: h,
      onClose: () => { U.rstack = []; },
      on: {
        nav: (b) => { recipeNav(b.dataset.id); return true; },
        back: () => { U.rstack.pop(); A.page(); swapModal(recipeModal()); return true; },
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

  function confirmFire(pid) {
    const st = S();
    let warn = "";
    if (st.frags.registre) warn += "<p class=\"serif\">Une phrase te revient en mémoire : « Ils chanteront, pour qu’on les reconnaisse. »</p>";
    if (st.frags.code_source) warn += "<p class=\"serif\">« Clé d’identification amie : le chant d’Iris. » Ce chant, tu ne l’as jamais vérifié.</p>";
    openModal({
      persistent: true,
      html: '<div class="kicker">Brise-Monde</div><h2>Mise à feu ?</h2><p style="font-family:var(--mono);color:#8cffb0">« FAIS-LE, SEMEUR 7. ILS APPROCHENT. »</p>' + warn +
        '<div class="acts"><button class="btn" data-m="close">Attendre</button><button class="btn pri" style="background:#ff5a3c" data-m="fire">💥 Tirer</button></div>',
      on: { fire: () => { setTimeout(() => E.fire(pid), 250); } }
    });
  }

  function listen() {
    A.init();
    const r = E.listen();
    if (!r.ok) return;
    A.signal();
    Sky.set({ listenUntil: Date.now() + 7000 });
    const info = $("#skyInfo");
    if (info) info.textContent = r.decoded ? "« Nous rentrons à la maison. Est-ce que quelqu’un nous attend encore ? »" : "Une onde lente qui monte et redescend. On dirait presque une mélodie, mais tu n’y comprends rien.";
    if (r.fresh) toast("Tu as enregistré le <b>Signal de Kher</b>.");
  }
  function skyTap(ev) {
    const cv = ev.target, rc = cv.getBoundingClientRect();
    const hit = Sky.hit(ev.clientX - rc.left, ev.clientY - rc.top);
    const info = $("#skyInfo");
    if (!hit || !info) return;
    A.init(); A.click();
    if (hit.k === "moon") {
      const msg = E.tapMoon();
      info.textContent = msg || "La Lune. Grise, silencieuse. Tu as l’impression qu’elle te regarde aussi.";
    } else if (hit.k === "kher") {
      info.textContent = S().flags.decoded ? "Kher. Plus une menace : une maison lointaine, d’où des enfants reviennent." :
        S().age >= 7 ? "Kher, à 11,9 années-lumière. ARCHE la dit dangereuse. Elle pulse comme un cœur." : "Une étoile rouge qui pulse lentement. Tu jurerais qu’elle n’était pas là avant.";
    } else info.textContent = hit.n + ".";
  }

  function playNote(n, btn) {
    A.init();
    A.note(n);
    if (btn) { btn.classList.add("ping"); setTimeout(() => btn.classList.remove("ping"), 160); }
    const r = E.playNote(n);
    const el = $("#notes");
    if (el) { el.textContent = S().notes.join(" · "); el.classList.remove("fade"); }
    // après une pause, l’air recommence : les notes s’effacent
    clearTimeout(U.noteT);
    U.noteT = setTimeout(() => { E.clearNotes(); const e2 = $("#notes"); if (e2) { e2.classList.add("fade"); setTimeout(() => { if (!S().notes.length) e2.textContent = ""; e2.classList.remove("fade"); }, 400); } }, 2500);
    if (r) {
      const M = D.MELODIES[r.id];
      setTimeout(() => {
        if (r.fresh) A.secret();
        if (!r.ending) openModal({ html: '<div class="kicker">' + (r.fresh ? "Secret découvert" : "Mélodie") + "</div><h2>" + esc(M.n) + "</h2>" + loreHTML(M.t) +
          '<div class="acts"><button class="btn pri" data-m="close">Continuer</button></div>' });
      }, 350);
      render(true);
    }
  }

  function runTerminal(txt) {
    if (!txt.trim()) return;
    A.init(); A.click();
    E.terminal(txt);
    render(true);
    const inp = $("#termIn"); if (inp) { inp.value = ""; inp.focus(); }
  }

  /* ------------------------------------------------------------ menus */
  function openMenu() {
    const st = S();
    openModal({
      html: "<h2>Menu</h2>" +
        '<div class="toggle"><span>Son</span><button class="btn small" data-m="sound">' + (st.settings.sound ? "Activé" : "Coupé") + "</button></div>" +
        [["music", "Musique"], ["amb", "Ambiance"], ["sfx", "Bruitages"]].map(([k, n]) => '<label class="toggle vol"><span>' + n + '</span><input type="range" min="0" max="100" step="5" value="' + Math.round(volumes()[k] * 100) + '" data-vol="' + k + '"></label>').join("") +
        '<div class="toggle"><span>Vibrations</span><button class="btn small" data-m="vibe">' + (st.settings.vibe ? "Activées" : "Coupées") + "</button></div>" +
        '<div class="toggle"><span>Tutoriel <span class="tiny muted">' + Tuto.doneCount() + "/" + Tuto.chapters().length + ' vus</span></span><span class="row"><button class="btn small ghost" data-m="tutoAgain">Revoir</button><button class="btn small" data-m="tuto">' + (Tuto.enabled() ? "Activé" : "Coupé") + "</button></span></div>" +
        '<div class="acts" style="flex-direction:column"><button class="btn" data-m="mem">✦ Mémoire des mains</button><button class="btn" data-m="account">☁️ Compte en ligne</button><button class="btn" data-m="saves">💾 Sauvegardes</button><button class="btn" data-m="help">❓ Comment jouer</button><button class="btn" data-m="news">Nouveautés</button><button class="btn" data-m="credits">Crédits</button>' +
        '<button class="btn" data-m="reset" style="color:var(--bad)">🗑️ Tout recommencer</button><button class="btn pri" data-m="close">Fermer</button></div>' +
        '<p class="tiny dim center" style="margin-top:12px">Éclat, du silex aux étoiles · version ' + esc(D.VERSION) + "</p>",
      onOpen: (box) => {
        $$("[data-vol]", box).forEach((r) => {
          r.addEventListener("input", () => {
            st.settings.vol = Object.assign(volumes(), { [r.dataset.vol]: Number(r.value) / 100 });
            A.init(); A.setVolumes(st.settings.vol);
            if (r.dataset.vol === "sfx") A.click();
          });
          r.addEventListener("change", save);
        });
      },
      on: {
        sound: (b) => { st.settings.sound = !st.settings.sound; A.init(); A.setEnabled(st.settings.sound); b.textContent = st.settings.sound ? "Activé" : "Coupé"; save(); return true; },
        vibe: (b) => { st.settings.vibe = !st.settings.vibe; b.textContent = st.settings.vibe ? "Activées" : "Coupées"; save(); return true; },
        tuto: (b) => { Tuto.setEnabled(!Tuto.enabled()); b.textContent = Tuto.enabled() ? "Activé" : "Coupé"; return true; },
        tutoAgain: () => { Tuto.restart(); toast("💭 Le tutoriel reprend : chaque chapitre réapparaît au moment où il sert."); },
        saves: () => setTimeout(openSaves, 80),
        credits: () => setTimeout(() => simpleModal("Éclat", "Crédits",
          '<div class="small"><p><b>Icônes</b> : <a href="https://game-icons.net" target="_blank" rel="noopener">game-icons.net</a>, par Lorc, Delapouite et leurs contributeurs, sous licence CC BY 3.0. Recolorées, dessin inchangé.</p>' +
          "<p><b>Polices</b> (licence SIL OFL 1.1) : Alegreya Sans, IM Fell English, Cinzel, Playfair Display, Special Elite, Caveat, Space Grotesk, IBM Plex Mono.</p>" +
          "<p>Musique et bruitages synthétisés dans le jeu.</p></div>", "Fermer"), 80),
        account: () => { openAccount(); return true; },
        help: () => setTimeout(openHelp, 80),
        mem: () => setTimeout(openMemoire, 80),
        news: () => setTimeout(() => simpleModal("Version " + esc(D.VERSION), "Nouveautés", '<ul class="news">' + D.CHANGES.map((c) => "<li>" + esc(c) + "</li>").join("") + "</ul>"), 80),
        reset: () => setTimeout(() => {
          openModal({ html: '<h2>Tout recommencer ?</h2><p>Toute ta progression, tes secrets et tes fins seront effacés. Une copie de sécurité est gardée dans ☰ → Sauvegardes.</p><div class="acts"><button class="btn" data-m="close">Non</button><button class="btn pri" style="background:var(--bad)" data-m="go">Effacer</button></div>',
            on: { go: () => { pushBackup(E.serialize(), "Avant de tout recommencer"); E.reset(); save(); U.slots = [null, null, null]; U.last = null; setTab("carte"); intro(); } } });
        }, 80)
      }
    });
  }
  /* lancer l’exploration du prochain lieu d’une terre */
  function explore(z) {
    const why = expWhy(z);
    if (why) { A.fail(0); toast(why, { key: "nope" }); return; }
    const r = E.startExp(z);
    if (r.ok) { A.init(); A.explore(); toast("🧭 Exploration lancée : elle avance toute seule."); }
    render(true);
  }
  function openHelp() {
    simpleModal("Aide", "Comment jouer",
      '<div class="small">' +
      "<p><b>En bref.</b> Tu récoltes des ressources, tu découvres des recettes à l’Atelier, puis tu poses des extracteurs et des machines qui travaillent pour toi. L’<b>objectif</b>, en haut du Domaine, dit toujours quoi faire ensuite.</p>" +
      '<h3 class="sub">Les mots du jeu</h3><dl class="lexique">' +
      "<dt>Réserve</dt><dd>Tout ce que tu possèdes. Ce que tu récoltes ou fabriques y arrive, et chaque fabrication y prend ses ressources.</dd>" +
      "<dt>Terre, gisement</dt><dd>Une terre est un lieu du monde (la Lisière, la Plaine…). Chaque terre a ses gisements : un gisement est une ressource à récolter.</dd>" +
      "<dt>Récolter</dt><dd>Toucher l’icône d’un gisement (garder le doigt dessus pour continuer), ou toucher ▶ pour récolter en continu. Un appui rapporte parfois le double : un coup de chance.</dd>" +
      "<dt>Action, recette</dt><dd>Une recette associe une action (Tailler, Tresser…) à une ou plusieurs ressources. Tu les découvres à l’Atelier, en faisant des tentatives.</dd>" +
      "<dt>Pièce</dt><dd>Un objet fabriqué qui sert à en fabriquer d’autres (manche, corde…).</dd>" +
      "<dt>Outil, amélioration</dt><dd>Ils agissent dès que tu les as : récolte plus forte, terre nouvelle, extracteurs plus rapides. Rien à poser.</dd>" +
      "<dt>Station</dt><dd>Feu, four, enclume, creuset… Elle reste à l’Atelier et débloque une action, ou une chaleur plus forte. Quand une recette en demande une, le jeu la nomme.</dd>" +
      "<dt>Extracteur</dt><dd>Cabane, collets, puits… Il se pose sur un gisement <i>de sa terre</i> (bouton « + cabane ») et récolte seul, même quand le jeu est fermé.</dd>" +
      "<dt>Machine</dt><dd>Automate, presse… Elle reste à l’Atelier et accélère tes commandes de pièces (une fois la pièce fabriquée à la main). Un automate de bois fait les recettes à 1 ingrédient, un automate de bronze jusqu’à 2, une presse ou un réacteur jusqu’à 3.</dd>" +
      "<dt>Commande</dt><dd>Ce que tu lances depuis le Carnet (×1, ×10, ×50, ×100, ×1 000, Max). Les ressources sont prises au fur et à mesure dans la Réserve, et les pièces manquantes sont ajoutées avant la pièce demandée.</dd>" +
      "<dt>Tes mains</dt><dd>Tout ce que tu fabriques passe par la file des commandes (barre ✋ au-dessus des onglets). Tes machines t’y aident.</dd>" +
      "<dt>Passage</dt><dd>Pour entrer dans une nouvelle terre : il faut l’objet qui y mène, puis verser ce que le passage demande.</dd>" +
      "<dt>Intuition ✨</dt><dd>Se gagne en découvrant. Sert à étudier une ressource (pour savoir avec quelles actions elle cache des recettes) et à déchiffrer une recette inconnue étape par étape.</dd>" +
      "<dt>Déchiffrer</dt><dd>Révéler une recette inconnue contre de l’Intuition : d’abord l’action, puis une des ressources, puis la recette entière.</dd>" +
      "<dt>Traces ✦, relève</dt><dd>Chaque passage franchi laisse des Traces. La relève recommence le monde en gardant tes recettes. Les Traces servent à acheter des améliorations dans la Mémoire des mains.</dd>" +
      "<dt>Ruine</dt><dd>Ce qu’un Semeur a construit attend le suivant. Une ruine se répare sur place pour une fraction de son coût d’origine, sans repasser par l’Atelier.</dd>" +
      "<dt>Comptoir, écus</dt><dd>Marché tenu par le Troqueur dans la Plaine. On y vend ce qui encombre la Réserve contre des écus, et on y achète des ressources. Les écus restants deviennent des Traces à la relève.</dd>" +
      "<dt>Demande du Troqueur</dt><dd>Le Troqueur demande des objets fabriqués contre des Traces. Livrer prend les objets dans la Réserve et donne les Traces tout de suite. Les demandes se renouvellent régulièrement.</dd>" +
      "<dt>Âge, étapes</dt><dd>Le jeu avance d’âge en âge. 🏁 montre les étapes de l’âge en cours.</dd>" +
      "<dt>Signe</dt><dd>Un mot de l’écriture des Anciens. Tant que tu ne l’as pas compris, il s’affiche dessiné. Touche-le pour proposer ce qu’il veut dire.</dd>" +
      "<dt>Grand Œuvre</dt><dd>Un chantier immense qui mène à une fin du jeu. Tu y verses des ressources de la Réserve, ou tu l’alimentes pour qu’il s’y serve seul.</dd></dl>" +
      '<h3 class="sub">Les écrans</h3>' +
      "<p><b>🏡 Domaine.</b> Tes terres et leurs gisements, les passages et le Grand Œuvre.</p>" +
      "<p><b>🗺️ Carte.</b> Le monde, avec de la brume sur les terres que tu n’as pas encore atteintes. Touche un lieu 🧭 pour l’explorer : chaque lieu raconte un morceau de l’histoire.</p>" +
      "<p><b>🔨 Atelier.</b> Choisis une action, pose jusqu’à trois ressources, touche le gros bouton. Quand rien ne sort, le <b>thermomètre</b> dit si tu t’approches. Le <b>Carnet</b> garde tes recettes : <b>Fabriquer, ×10, ×50, ×100, ×1 000, Max</b> lancent des commandes et fabriquent aussi les pièces qui manquent, <b>🎯 Suivre</b> affiche ce qui manque en haut du Domaine. Les <b>Machines</b> aident tes mains sur les commandes.</p>" +
      "<p><b>📜 Journal.</b> Fragments d’histoire, secrets, mélodies. Sa deuxième page, le <b>Cosmos</b>, s’ouvre plus tard.</p>" +
      "<p><b>📈 Niveaux.</b> Chaque action, et la récolte, monte jusqu’au niveau 99 quand tu fabriques ou récoltes toi-même : 1 % plus rapide par niveau, et une chance d’avoir une pièce en plus aux niveaux 10, 25, 50, 75 et 99.</p>" +
      "<p><b>Jeu fermé.</b> Les extracteurs, les commandes et l’exploration continuent pendant 12 h au plus.</p>" +
      "<p><b>💾 Sauvegardes.</b> Menu ☰ : télécharge ta partie dans un fichier pour la garder à l’abri ou changer d’appareil.</p></div>", "Compris");
  }

  function intro() {
    const st = S();
    const lines = (D.EVEILS && D.EVEILS[st.cycle]) || (st.cycle > 1
      ? ["Tu t’éveilles dans l’herbe humide, à l’orée d’une forêt.", "Ton corps est neuf, mais pas tes souvenirs : tu connais déjà des recettes entières.", "Tu es le Semeur " + (st.cycle + 6) + ". Celui d’avant t’a laissé ses recettes dans le Carnet."]
      : D.INTRO);
    // en tête des éveils, un signe ; à la fin de la scène, l’ornement (s’il est dans les données)
    const lieu = st.cycle > 1 ? "Les éveils" : "Le premier réveil";
    const html = () => '<div class="lore" style="padding:10px 0">' +
      (st.cycle > 1 && uiSigne("eveil") ? '<p class="scene-signe" style="opacity:0;animation:fadeup 1.2s 0.1s forwards">' + uiSigne("eveil", lieu) + "</p>" : "") +
      lines.map((l, i) => '<p style="opacity:0;animation:fadeup 1.2s ' + (0.3 + i * 1.1) + 's forwards">' + recitInline(l, lieu) + "</p>").join("") +
      ornementHTML(lieu, 0.3 + lines.length * 1.1) +
      '</div><div class="acts"><button class="btn pri wide" data-m="close">Ouvrir les yeux</button></div>';
    openModal({
      persistent: true,
      html: html(),
      refresh: html,
      onClose: () => {
        st.introSeen = true; st.flags.news = null; st.flags.ver = D.VERSION; save(); A.init();
        if (st.flags.capsuleMsg) {
          st.flags.capsuleMsg = false;
          simpleModal("Capsule temporelle", "Un message de toi-même",
            loreHTML("Au pied du Grand Chêne, une capsule de verre t’attend, avec quelques matériaux et un enregistrement. Ta propre voix :\n\n« Salut. C’est toi. Enfin, toi d’avant. Fais confiance à tes mains. Et quand l’étoile rouge se mettra à chanter, écoute-la jusqu’au bout. »"));
        }
      }
    });
  }

  function showEnding(r) {
    const en = D.ENDINGS[r.id];
    A.ending();
    const paras = en.t.split("\n\n").concat(r.extra);
    const st = S();
    const n = Object.keys(st.meta.endings).length;
    openModal({
      cls: "ending", persistent: true,
      html: '<div class="kicker center">Fin ' + (Object.keys(D.ENDINGS).indexOf(r.id) + 1) + "</div><h2 class=\"center\" style=\"font-size:32px\">" + en.ic + " " + esc(en.n) + "</h2>" +
        '<div class="lore">' + paras.map((p, i) => '<p style="animation-delay:' + (0.6 + i * 1.6) + 's">' + p.split("\n").map((l) => recitInline(l, "Fin : " + en.n)).join("<br>") + "</p>").join("") +
        ornementHTML("Fin : " + en.n, 0.6 + paras.length * 1.6, r.id) + "</div>" +
        '<p class="center small muted" style="margin-top:24px;opacity:0;animation:fadeup 1s ' + (1 + paras.length * 1.6) + 's forwards">Fins découvertes : ' + n + "/" + Object.keys(D.ENDINGS).length +
        (n < 3 ? ". Il reste d’autres chemins." : ". Tu as tout vu. Merci d’avoir joué.") + "</p>" +
        '<div class="acts" style="opacity:0;animation:fadeup 1s ' + (1.4 + paras.length * 1.6) + 's forwards"><button class="btn" data-m="close">Continuer ce cycle</button><button class="btn pri" data-m="cycle">Nouveau cycle ✦</button></div>',
      on: { cycle: () => setTimeout(confirmCycle, 100) }
    });
  }
  function confirmCycle() {
    const st = S();
    const ech = Object.values(st.meta.endings).reduce((a, b) => a + b, 0), gain = E.releveGain();
    const ecus = Math.floor(st.ecus || 0);
    const ecusTr = E.ecusToTraces ? E.ecusToTraces(ecus) : 0;
    const totalGain = gain + ecusTr;
    const ecusMsg = ecus > 0 ? '<p class="small">Tes ' + fmt(ecus) + ' écus deviennent ' + ecusTr + ' ✦ Trace' + (ecusTr > 1 ? 's' : '') + '.</p>' : '';
    openModal({
      html: '<div class="kicker">La relève</div><h2>Éveiller le Semeur ' + (st.cycle + 7) + " ?</h2><p>Le monde, tes ressources, tes machines et les terres atteintes repartent de zéro. Tu gardes ton <b>Carnet</b> (toutes les recettes connues), tes <b>fragments</b>, tes <b>secrets</b> et la <b>Mémoire des mains</b>.</p>" +
        "<p>Tu gagnes <b>" + totalGain + " ✦ Trace" + (totalGain > 1 ? "s" : "") + "</b>, à dépenser dans la Mémoire des mains." + (ech ? " Échos : <b>" + ech + "</b>, soit <b>+" + ech * 50 + " %</b> de récolte et de production." : "") + "</p>" + ecusMsg + leftHTML() +
        '<p class="small"><b>💾 Une copie de ta partie est mise de côté avant</b> (☰ → Sauvegardes) : tu pourras toujours revenir en arrière.</p>' +
        '<div class="acts"><button class="btn" data-m="close">Pas encore</button><button class="btn pri" data-m="go">Passer le relais ✦</button></div>',
      on: {
        go: () => {
          pushBackup(E.serialize(), "Avant la relève (Semeur " + (st.cycle + 7) + ")");
          E.newCycle();
          save();
          U.slots = [null, null, null];
          U.last = null;
          U.memAfter = true;
          U.zone = "lisiere";
          U.domAll = false;
          U.domOpen = null;
          setTab("domaine");
          openMemoire(() => { setTimeout(intro, 200); });
        }
      }
    });
  }
  /* ------------------------------------------------------------ MÉMOIRE DES MAINS
   * La relève, ce qu’elle rapporte, et les améliorations achetées avec les Traces. */
  function memHTML() {
    const st = S(), m = st.meta, gain = E.releveGain(), can = E.canReleve();
    let h = '<div class="kicker">✦ La Mémoire des mains</div><h2>' + fmt(m.traces) + " Trace" + (m.traces > 1 ? "s" : "") + (can && gain ? ' <span class="small mgain">+' + gain + " à la relève</span>" : "") + "</h2>" +
      '<p class="small">Chaque passage franchi laisse des <b>Traces</b>. Quand tu passes le relais, un nouveau Semeur s’éveille : le monde repart de zéro, mais il garde ton Carnet et tout ce que tu as acheté ici.</p>';
    h += '<div class="card memrel">' + (can
      ? '<div class="row between"><span class="small">Passer le relais maintenant</span><b class="mgain">+' + gain + " ✦</b></div>" + '<button class="btn pri" data-m="releve" style="margin-top:8px;width:100%">Passer le relais ✦</button>'
      : '<p class="small muted">Franchis un passage vers une nouvelle terre (🚧) pour pouvoir passer le relais.</p>') +
      (E.passPending().length ? '<p class="tiny muted">Un passage en cours rapporterait +' + E.passPending().map((z) => D.PASSAGES[z].tr).join(", +") + " ✦ de plus.</p>" : nextPassHTML()) + "</div>";
    h += '<div class="mems">' + D.MEMOIRE.map((x) => {
      const l = E.memLvl(x.id), c = E.memCost(x.id), max = c === undefined;
      const now = x.d.replace("{v}", String(x.v(l)).replace(".", ",")), next = max ? "" : x.d.replace("{v}", String(x.v(l + 1)).replace(".", ","));
      const soon = !max && m.traces < c && can && m.traces + gain >= c; // possible juste après la relève
      return '<div class="mem' + (l ? " on" : "") + '"><span class="mic">' + x.ic + '</span><div class="grow"><div class="small"><b>' + esc(x.n) + '</b> <span class="tiny muted">' + l + "/" + x.cost.length + "</span></div>" +
        '<div class="tiny muted">' + (l ? esc(now) : "") + (l && !max ? " → " : "") + (max ? "" : esc(next)) + "</div>" +
        (x.next ? '<div class="tiny dim">S’applique au prochain Semeur, après la relève.</div>' : (max ? "" : (memPreview(x) ? '<div class="tiny dim">' + memPreview(x) + "</div>" : ""))) + "</div>" +
        (max ? '<span class="tiny muted">max</span>' : '<button class="btn small' + (m.traces >= c ? " pri" : " nope") + (soon ? " soon" : "") + '" data-m="buy" data-id="' + x.id + '">' + c + " ✦" + (soon ? '<small class="tiny">après la relève</small>' : "") + "</button>") + "</div>";
    }).join("") + "</div>";
    return h + '<div class="acts"><button class="btn" data-m="close">Fermer</button></div>';
  }
  /* ce que la relève laisse derrière elle, en chiffres */
  function leftHTML() {
    const st = S(), n = (k) => (k === "ext" ? Object.values(st.dom.ext).reduce((a, e) => a + Object.values(e.u).reduce((x, y) => x + y, 0), 0) : E.MACHINES.reduce((a, m) => a + Math.floor(st.inv[m] || 0), 0));
    const top = Object.keys(st.inv).filter((i) => I[i] && !E.isUnique(I[i]) && !E.isScaled(I[i]) && st.inv[i] >= 1).sort((a, b) => st.inv[b] - st.inv[a]).slice(0, 3);
    const paid = Object.keys(st.pass).filter((z) => !st.pass[z].done && D.PASSAGES[z]);
    const parts = [];
    if (n("ext")) parts.push(n("ext") + " extracteur" + (n("ext") > 1 ? "s" : ""));
    if (n("mach")) parts.push(n("mach") + " machine" + (n("mach") > 1 ? "s" : ""));
    if (top.length) parts.push("ta Réserve (" + top.map((i) => fmt(st.inv[i]) + " " + esc(I[i].n.toLowerCase())).join(", ") + "…)");
    if (paid.length) parts.push("ce que tu as versé dans " + paid.map((z) => esc(D.PASSAGES[z].n)).join(", "));
    return parts.length ? '<p class="small muted">Tu laisses : ' + parts.join(", ") + ".</p>" : "";
  }
  /* un aperçu concret de la prochaine amélioration */
  function memPreview(x) {
    const l = E.memLvl(x.id), a = x.v(l), b = x.v(l + 1);
    if (b === undefined || typeof a !== "number") return "";
    if (x.id === "extr") { const r = E.production().reduce((s, p) => s + (I[p.id] && I[p.id].t === "res" ? p.in : 0), 0); return r > 0 ? "Tes extracteurs : " + perMin(r) + " → " + perMin(r * b / a) : ""; }
    if (x.id === "recolte") return "Un appui sur le bois : " + fmtNum(E.tapYieldOf("bois") || a) + " → " + fmtNum((E.tapYieldOf("bois") || a) * b / a);
    if (x.id === "chemins") { const z = D.ZONES.map((y) => y.id).find((id) => D.PASSAGES[id] && !E.zoneOpen(id)); if (!z) return ""; const c = E.passCost(z), k = Object.keys(c)[0]; return esc(D.PASSAGES[z].n) + " : " + fmt(c[k]) + " → " + fmt(Math.ceil(c[k] * b / a)) + " " + esc(I[k].n.toLowerCase()); }
    if (x.id === "mach") { const n = E.MACHINES.reduce((acc, m) => acc + Math.floor(S().inv[m] || 0), 0); return n ? "Tes " + n + " machine" + (n > 1 ? "s" : "") + " : +" + Math.round((b / a - 1) * 100) + " %" : ""; }
    return "";
  }
  /* le prochain passage : ce qu’il rapporte, et l’objet qui le rend possible */
  function nextPassHTML() {
    const z = D.ZONES.map((x) => x.id).find((id) => D.PASSAGES[id] && !E.zoneOpen(id) && !(S().pass[id] && S().pass[id].done));
    if (!z) return "";
    const P = D.PASSAGES[z], req = E.ZONES[z].req, ready = S().pass[z];
    return '<p class="tiny muted">Prochain passage : <b>' + esc(P.n) + "</b> vers " + esc(zoneName(z)) + " (+" + P.tr + " ✦)" + (ready ? "." : I[req] ? ", après " + esc(I[req].n) + "." : ".") + "</p>";
  }
  function openMemoire(onClose) {
    const o = {
      html: memHTML(),
      onClose,
      on: {
        buy: (b) => {
          if (E.memBuy(b.dataset.id)) { A.secret ? A.secret() : A.click(); vibe([10, 30, 10]); save(); }
          else {
            A.fail(0);
            const c = E.memCost(b.dataset.id), m = S().meta;
            toast(c !== undefined && E.canReleve() && m.traces + E.releveGain() >= c ? "Tu pourras l’acheter juste après la relève, avec les Traces qu’elle rapporte." : "Il te faut plus de Traces : franchis des passages, puis passe le relais.", { key: "mem" });
          }
          swapModal(Object.assign(o, { html: memHTML() }));
          return true;
        },
        releve: () => { setTimeout(confirmCycle, 80); }
      }
    };
    openModal(o);
  }

  function openForcedReleve() {
    openModal({
      persistent: true,
      html: '<div class="kicker">La relève</div><h2>La nuit tombe</h2>' +
        '<div class="lore" style="padding:10px 0">' +
        '<p style="opacity:0;animation:fadeup 1.2s 0.3s forwards">La nuit tombe sur la Lisière. Près de la cabane, le bois s’empile sans que tu y touches.</p>' +
        '<p style="opacity:0;animation:fadeup 1.2s 1.4s forwards">Tu t’assieds contre le Grand Chêne. Tes paupières sont lourdes.</p>' +
        '<p style="opacity:0;animation:fadeup 1.2s 2.5s forwards">Demain, quelqu’un d’autre ouvrira les yeux ici. Il saura déjà ce que tes mains ont appris.</p>' +
        ornementHTML("La relève", 3) +
        '</div>' +
        '<div class="acts" style="opacity:0;animation:fadeup 1.2s 3.2s forwards">' +
        '<button class="btn pri wide" data-m="go">Passer le relais</button>' +
        '</div>',
      on: {
        go: () => {
          pushBackup(E.serialize(), "Avant la relève (Semeur 7)");
          E.forcedReleve();
          save();
          U.slots = [null, null, null];
          U.last = null;
          U.zone = "lisiere";
          U.domAll = false;
          U.domOpen = null;
          setTab("domaine");
          openMemoire(() => { setTimeout(intro, 200); });
        }
      }
    });
  }

  let forcedModalShown = false;
  function checkForcedReleve() {
    if (!forcedModalShown && E.canForcedReleve && E.canForcedReleve()) {
      forcedModalShown = true;
      setTimeout(openForcedReleve, 400);
    }
  }
  function memChip() {
    const m = S().meta, b = $("#memBtn"), can = E.canReleve(), gain = E.releveGain();
    const show = can || m.traces > 0 || m.tracesTotal > 0;
    b.classList.toggle("hidden", !show);
    if (!show) return;
    const txt = can && gain ? "+" + gain : fmt(m.traces);
    const n = $("#memN");
    if (n.textContent !== txt) n.textContent = txt;
    b.classList.toggle("ready", can && gain > 0);
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
      setTimeout(() => toast("🚧 <b>" + esc(D.PASSAGES[z].n) + "</b> : pour entrer dans " + esc(zoneName(z)) + ", verse ce qu’il faut depuis la Réserve (dans le Domaine, ou sur la Carte).", { key: "pass:" + z, p: 2 }), 900);
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
    E.on("page", (p) => {
      badge("journal");
      toast("📖 Une page du Livre : n° " + p.n);
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
        openModal({ html: '<div class="kicker">Poste radio</div><h2>Une voix dans le grésillement</h2><div class="term">' + D.ARCHE.radio.map((l) => '<div class="l">' + esc(l) + "</div>").join("") +
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
    E.on("fx", (k) => { if (k === "fireworks") setTimeout(fireworks, 300); });
    E.on("ending", (r) => { setTimeout(() => showEnding(r), 600); save(); });
    E.on("offline", (o) => {
      if (o.dt < 60) return;
      const top = Object.keys(o.gains).filter((k) => I[k]).sort((a, b) => o.gains[b] - o.gains[a]).slice(0, 10);
      if (!top.length && !o.exp && o.dt < 600) return;
      U.offline = { dt: o.dt, top, gains: o.gains, exp: o.exp };
    });
  }

  /* ============================================================ ÉCOUTEURS DOM */
  function bindDom() {
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
      if (t.closest("[data-miles]")) { A.click(); openMilestones(); return; }
      if (t.closest("[data-cycle]")) { A.click(); openMemoire(); return; }
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
      if ((b = t.closest("[data-cr]"))) { craftFrom(b); return; }
      if ((b = t.closest("[data-if]"))) { U.invFilter = b.dataset.if; S().settings.inv = Object.assign({}, S().settings.inv, { filter: U.invFilter }); render(true); return; }
      if ((b = t.closest("[data-cf]"))) { U.carnetFilter = b.dataset.cf; render(true); return; }
      if ((b = t.closest("[data-owned]"))) { U.showOwned = !U.showOwned; render(true); return; }
      if ((b = t.closest("[data-hcancel]"))) {
        const j = S().hand.q[Number(b.dataset.hcancel)];
        if (j && E.cancelJob(Number(b.dataset.hcancel))) { A.click(); toast("Annulé : " + esc(I[j.id].n) + ". Les ressources sont revenues dans ta Réserve."); render(true); }
        return;
      }
      if ((b = t.closest("[data-tip]"))) { S().flags[b.dataset.tip] = true; render(true); return; }
      if ((b = t.closest("[data-exp]"))) { explore(b.dataset.exp); return; }
      if ((b = t.closest("[data-goto]"))) { goto(b.dataset.goto); return; }
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
              '<h2>' + esc(p.titre || ("Page " + curC.n)) + '</h2>' +
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
      if ((b = t.closest("[data-frag]"))) { const F = D.FRAGS[b.dataset.frag]; simpleModal("Fragment", esc(F.n || F.titre), loreHTML(F.t || F.lore, F.n || F.titre || "Fragment"), "Refermer"); return; }
      if ((b = t.closest("[data-note]"))) { playNote(Number(b.dataset.note), b); return; }
      if ((b = t.closest("[data-play]"))) { A.init(); D.MELODIES[b.dataset.play].notes.forEach((n, i) => setTimeout(() => playNote(n), i * 420)); return; } // la jouer pour de bon
      if ((b = t.closest("[data-ct]"))) { U.cosmosTab = b.dataset.ct; render(true); return; }
      if (t.closest("#listen")) { listen(); return; }
      if ((b = t.closest("[data-fire]"))) { confirmFire(b.dataset.fire); return; }
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
      }
    });
    views.addEventListener("focusin", (ev) => { if (ev.target.id === "cq" || ev.target.id === "iq") ev.target.select(); });
    views.addEventListener("toggle", (ev) => {
      const d = ev.target;
      if (d.matches && d.matches("details[data-age]")) U.openAges[d.dataset.age] = d.open;
    }, true);
    views.addEventListener("submit", (ev) => {
      if (ev.target.id === "termForm") { ev.preventDefault(); runTerminal($("#termIn").value); }
    });
    views.addEventListener("pointerup", (ev) => {
      if (ev.target.id === "skyCanvas") skyTap(ev);
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

  /* ============================================================ BOUCLE */
  function loop() {
    E.update();
    if (U.offline && !U.mcur) showOffline();
    if (U.dirty && !U.holding && !pressing()) render();
  }

  function boot() {
    setupModal();
    loadSprite();
    bindEngine();
    const status = loadSave();
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
    window.__eclat = { E, U, render, save, backups, Cloud, Dom, Carte };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
