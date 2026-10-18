/* ÉCLAT — interface. */
(function () {
  "use strict";
  const D = window.ECLAT_DATA;
  const E = window.EclatEngine.createEngine();
  const A = window.EclatAudio;
  const Sky = window.EclatSky;
  const SAVE_KEY = "eclat.save.v1";
  const S = () => E.state;
  const I = D.ITEMS;

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ------------------------------------------------------------ état UI */
  const U = {
    tab: "terres", geste: "tailler", slots: [null, null, null], last: null,
    invFilter: "tout", carnetFilter: "tout", journalTab: "fragments", cosmosTab: "ciel",
    openAges: {}, dirty: true, lastRender: 0, mq: [], mcur: null,
    badges: { carnet: false, journal: false, cosmos: false }, pointer: { x: 0, y: 0 }, holding: null
  };

  /* ------------------------------------------------------------ formats */
  const UNITS = ["k", "M", "G", "T", "P", "E", "Z"];
  function fmt(n) {
    if (!(n > 0)) return "0";
    if (n < 10 && Math.abs(n - Math.round(n)) > 1e-6) return (Math.floor(n * 10) / 10).toFixed(1).replace(".", ",");
    if (n < 1000) return String(Math.floor(n + 1e-9));
    let u = -1, v = n;
    while (v >= 1000 && u < UNITS.length - 1) { v /= 1000; u++; }
    const s = v < 10 ? (Math.floor(v * 100) / 100).toFixed(2) : v < 100 ? (Math.floor(v * 10) / 10).toFixed(1) : Math.floor(v).toFixed(0);
    return s.replace(".", ",") + " " + UNITS[u];
  }
  function fmtRate(r) {
    if (!(r > 0)) return "";
    if (r < 0.095) return "+" + r.toFixed(2).replace(".", ",") + "/s";
    if (r < 10) return "+" + r.toFixed(1).replace(".", ",") + "/s";
    return "+" + fmt(r) + "/s";
  }
  function fmtTime(s) {
    s = Math.max(0, Math.round(s));
    if (s < 60) return s + " s";
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    if (h) return h + " h " + String(m).padStart(2, "0");
    return m + " min" + (r ? " " + String(r).padStart(2, "0") : "");
  }
  const fmtHeat = (h) => h.toLocaleString("fr-FR") + " °C";
  const fmtMul = (v) => "×" + String(v).replace(".", ",");

  function ink(hex) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6 ? "#1a1208" : "#ffffff";
  }
  function icon(id, cls) {
    const it = I[id];
    if (!it) return "";
    if (it.sym) return '<span class="ic sym ' + (cls || "") + '" style="--c:' + it.col + ";--ink:" + ink(it.col) + '">' + esc(it.sym) + "</span>";
    return '<span class="ic ' + (cls || "") + '">' + it.ic + "</span>";
  }
  const TYPE = { res: "Matière", comp: "Composant", tool: "Outil", stat: "Station", ext: "Extracteur", upg: "Amélioration", auto: "Automatisation", curio: "Curiosité", relic: "Relique" };
  const zoneName = (z) => (E.ZONES[z] ? E.ZONES[z].n : z);
  const targetName = (k) => (k === "*" ? "toutes les zones" : E.ZONES[k] ? E.ZONES[k].n : I[k] ? I[k].n : k);

  function fxList(id) {
    const it = I[id], e = it.e || {}, out = [];
    if (e.zone) out.push("Débloque : " + zoneName(e.zone));
    if (e.st) e.st.forEach((s) => {
      const g = D.GESTES[s.g].n;
      if (s.heat) out.push(s.g === "chauffer" ? "Chauffer jusqu’à " + fmtHeat(s.heat) : g);
      else if ((s.lvl || 1) > 1) out.push(g + " niveau " + s.lvl);
      else out.push("Geste : " + g);
    });
    if (e.tap) for (const k in e.tap) out.push("Récolte " + (k === "*" ? "partout" : targetName(k)) + " " + fmtMul(e.tap[k]));
    if (e.auto) for (const k in e.auto) out.push("Production " + (k === "*" ? "partout" : targetName(k)) + " " + fmtMul(e.auto[k]));
    if (it.p) {
      const c = E.cache(), m = (c.auto[it.z] || 1) * (c.auto["*"] || 1) * c.echo;
      out.push("Chacun : " + Object.keys(it.p).map((r) => fmtRate(it.p[r] * m) + " " + I[r].n).join(", "));
    }
    if (e.intu) out.push("+" + e.intu + " ✨/min");
    if (e.exp) out.push("Explorations " + fmtMul(e.exp));
    if (e.sky) out.push("Ouvre le Cosmos");
    if (e.arche) out.push("Capte les ondes radio");
    if (e.term) out.push("Terminal");
    if (e.signal) out.push("Écouter le ciel");
    if (e.slots) out.push("+1 chaîne d’automatisation");
    if (e.aspd) out.push("Automatisation " + fmtMul(e.aspd));
    if (e.pip) out.push("Récolte automatique " + e.pip + "/s");
    if (e.flute) out.push("Débloque la flûte");
    if (e.decode) out.push("Décode le signal de Kher");
    return out;
  }
  const fxText = (id) => fxList(id).join(" · ");

  function ingHTML(ing, opts) {
    opts = opts || {};
    return Object.keys(ing).map((i) => {
      const q = ing[i];
      const lack = (S().inv[i] || 0) + 1e-9 < q;
      return '<span class="ing' + (lack && opts.check ? " lack" : "") + '"' + (opts.check ? ' data-need="' + i + '" data-q="' + q + '"' : "") + ">" +
        icon(i, "sm") + '<span class="q">' + fmt(q) + "</span> " + esc(I[i].n) + "</span>";
    }).join("");
  }
  function gesteChip(id) {
    const r = I[id].r, g = D.GESTES[r[0]], o = r[3] || {};
    let extra = "";
    if (o.heat) extra = " · " + fmtHeat(o.heat);
    if (o.lvl && o.lvl > 1) extra = " · niv. " + o.lvl;
    return '<span class="g">' + g.ic + " " + g.n + extra + "</span>";
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
  function fireworks() {
    const cols = ["#4fd1c5", "#7fe08a", "#5aa0ff", "#ffd36b", "#ff7ad9"];
    for (let k = 0; k < 6; k++) setTimeout(() => {
      sparks(innerWidth * (0.2 + Math.random() * 0.6), innerHeight * (0.15 + Math.random() * 0.35), 26, cols[k % cols.length]);
    }, k * 260);
  }
  function toast(html) {
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = html;
    $("#toasts").appendChild(t);
    while ($("#toasts").children.length > 4) $("#toasts").firstChild.remove();
    setTimeout(() => t.remove(), 3100);
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
    m.className = "modal " + (o.cls || "");
    box.innerHTML = o.html;
    box.scrollTop = 0;
    if (o.onOpen) o.onOpen(box);
  }
  function closeModal() {
    const o = U.mcur;
    $("#modal").classList.add("hidden");
    U.mcur = null;
    if (o && o.onClose) o.onClose();
    setTimeout(nextModal, 60);
  }
  function setupModal() {
    const m = $("#modal"), box = $(".modal-box", m);
    box.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-m]");
      if (!b || !U.mcur) return;
      const k = b.dataset.m;
      const h = U.mcur.on && U.mcur.on[k];
      if (h && h(b, ev) === true) return;
      closeModal();
    });
    m.addEventListener("click", (ev) => { if (ev.target === m && U.mcur && !U.mcur.persistent) closeModal(); });
  }
  function simpleModal(kicker, title, body, btn) {
    openModal({ html: (kicker ? '<div class="kicker">' + kicker + "</div>" : "") + "<h2>" + title + "</h2>" + body +
      '<div class="acts"><button class="btn pri" data-m="close">' + (btn || "Continuer") + "</button></div>" });
  }
  const loreHTML = (t) => '<div class="lore">' + t.split("\n\n").map((p) => "<p>" + esc(p).replace(/\n/g, "<br>") + "</p>").join("") + "</div>";

  /* ------------------------------------------------------------ sauvegarde */
  function save() {
    try { localStorage.setItem(SAVE_KEY, E.serialize()); } catch (e) { /* stockage indisponible */ }
  }
  function loadSave() {
    try {
      const s = localStorage.getItem(SAVE_KEY);
      if (s) { E.load(s); return true; }
    } catch (e) { console.warn("Sauvegarde illisible", e); }
    return false;
  }

  /* ------------------------------------------------------------ thème */
  function applyAge() {
    const ag = D.AGES[S().age];
    document.documentElement.style.setProperty("--acc", ag.c);
    document.documentElement.style.setProperty("--acc-ink", ink(ag.c));
    $("#ageName").textContent = ag.n;
    $("#ageNum").textContent = "Âge " + (S().age + 1) + "/" + D.AGES.length + (S().cycle > 1 ? " · Semeur " + (S().cycle + 6) : "");
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", "#0f0c0a");
  }

  /* ============================================================ VUES */
  function setTab(t) {
    if (t === "cosmos" && !E.cache().sky) t = "terres";
    if (U.tab === "cosmos" && t !== "cosmos") Sky.unmount();
    U.tab = t;
    $$(".view").forEach((v) => v.classList.toggle("on", v.id === "v-" + t));
    $$("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === t));
    if (U.badges[t]) { U.badges[t] = false; updateBadges(); }
    $("#views").scrollTop = 0;
    render(true);
  }
  function updateBadges() {
    $$("#tabs button").forEach((b) => {
      const on = U.badges[b.dataset.tab];
      let d = $(".dot", b);
      if (on && !d) { d = document.createElement("i"); d.className = "dot"; b.appendChild(d); }
      if (!on && d) d.remove();
    });
    $('#tabs [data-tab="cosmos"]').classList.toggle("hidden", !E.cache().sky);
  }
  function badge(t) { if (U.tab !== t) { U.badges[t] = true; updateBadges(); } }

  function render(force) {
    const now = performance.now();
    if (!force && now - U.lastRender < 120) { U.dirty = true; return; }
    if (U.holding && !force) { U.dirty = true; return; }
    U.dirty = false; U.lastRender = now;
    applyAge();
    updateBadges();
    const el = $("#v-" + U.tab);
    const sc = $("#views").scrollTop;
    if (U.tab === "terres") el.innerHTML = viewTerres();
    else if (U.tab === "atelier") el.innerHTML = viewAtelier();
    else if (U.tab === "carnet") el.innerHTML = viewCarnet();
    else if (U.tab === "journal") el.innerHTML = viewJournal();
    else if (U.tab === "cosmos") { el.innerHTML = viewCosmos(); mountCosmos(); }
    $("#views").scrollTop = sc;
    refresh();
    ambient();
  }

  /* ------------------------------------------------------------ TERRES */
  function viewTerres() {
    const st = S();
    let h = "";
    const ob = E.objective();
    if (!st.flags.tip_tap) h += '<div class="tip">👆 <b>Touche</b> une ressource pour la récolter. <b>Maintiens</b> le doigt pour récolter en continu.</div>';
    if (ob) {
      const it = I[ob.id];
      h += '<div class="card acc goal" data-goto="' + ob.id + '">' + (st.known[ob.id] ? icon(ob.id) : '<span class="ic unk">?</span>') +
        '<div class="grow"><div class="lbl">Objectif</div><div class="name">' + esc(it.n) + '</div><div class="small">' + esc(ob.txt) + "</div>" +
        (it.h ? '<div class="riddle small">« ' + esc(it.h) + " »</div>" : "") + "</div></div>";
    } else if (st.flags.arche) {
      h += '<div class="card acc goal"><span class="ic">🌌</span><div class="grow"><div class="lbl">Objectif</div><div class="name">Choisis ton Grand Œuvre</div><div class="small">Rends-toi dans le Cosmos.</div></div></div>';
    }
    for (const z of D.ZONES) if (E.zoneOpen(z.id)) h += zoneCard(z);
    let teasers = 0;
    for (const z of D.ZONES) {
      if (E.zoneOpen(z.id) || z.secret || teasers >= 2) continue;
      teasers++;
      const req = I[z.req];
      const known = req && (teasers === 1 || st.known[z.req]);
      h += '<div class="card zone locked-zone"><div class="zh"><span class="zi">🌫️</span><div class="grow"><div class="zn">' +
        (teasers === 1 ? esc(z.n) : "Terres inconnues") + '</div><div class="small dim">Il te faudrait : ' + (known ? esc(req.n) : "???") + "</div></div></div></div>";
    }
    return h;
  }
  function zoneCard(z) {
    const st = S();
    const col = !!(st.settings.collapsed && st.settings.collapsed[z.id]);
    let h = '<div class="card zone' + (col ? " col" : "") + '" data-z="' + z.id + '"><button class="zh" data-zc="' + z.id + '"><span class="zi">' + z.ic + '</span><div class="grow"><div class="zn">' + esc(z.n) + '</div></div><span class="zt">' + (col ? "▸" : "▾") + "</span></button>";
    if (!col) h += '<div class="zd">' + esc(z.d) + "</div>";
    h += '<div class="res-grid">';
    for (const r of z.res) {
      h += '<button class="res" data-res="' + r + '" data-z="' + z.id + '">' + icon(r) +
        '<span class="rc" data-c="' + r + '">' + fmt(st.inv[r] || 0) + '</span><span class="rn">' + esc(I[r].n) + "</span>" +
        '<span class="rr" data-r="' + r + '"></span><span class="ry" data-y="' + r + '|' + z.id + '"></span></button>';
    }
    h += "</div>";
    const exts = Object.keys(I).filter((id) => I[id].t === "ext" && I[id].z === z.id && (st.inv[id] || 0) > 0);
    if (exts.length && !col) h += '<div class="ext-line">' + exts.map((id) => '<span class="x">' + icon(id, "sm") + esc(I[id].n) + " ×" + st.inv[id] + "</span>").join("") + "</div>";
    if (!col || (st.exp.active && st.exp.active.z === z.id)) h += expBlock(z);
    return h + "</div>";
  }
  function expBlock(z) {
    const st = S();
    const total = z.exps.length;
    const done = st.exp.done[z.id] || 0;
    const act = st.exp.active;
    let h = '<div class="exp">';
    if (act && act.z === z.id) {
      const x = z.exps[act.i];
      h += '<div class="row between"><span class="en">🧭 <b>' + esc(x.n) + '</b></span><span class="tiny muted" data-xl>…</span></div><div class="bar" style="margin-top:6px"><i data-xp></i></div>';
    } else {
      const n = E.nextExp(z.id);
      if (!n) h += '<div class="tiny dim">🧭 Tout a été exploré ici (' + done + "/" + total + ").</div>";
      else if (n.locked) {
        const need = I[n.x.need];
        h += '<div class="row between"><span class="en dim">🧭 ' + (n.x.hidden ? "??? — " + esc(n.x.hidden) : esc(n.x.n) + " — il te faudrait : " + esc(need.n)) + '</span><span class="tiny dim">' + done + "/" + total + "</span></div>";
      } else {
        const cost = n.x.cost ? Object.keys(n.x.cost).map((i) => n.x.cost[i] + " " + I[i].n).join(", ") : "";
        const dur = n.x.dur / E.expMult();
        h += '<div class="row between"><div class="grow"><div class="en">🧭 ' + esc(n.x.n) + '</div><div class="tiny muted">' + fmtTime(dur) +
          (cost ? " · coût : " + esc(cost) : "") + " · " + done + "/" + total + '</div></div><button class="btn small" data-exp="' + z.id + '">Explorer</button></div>';
      }
    }
    return h + "</div>";
  }

  /* ------------------------------------------------------------ ATELIER */
  function viewAtelier() {
    const st = S();
    let h = "";
    if (!E.gesteOK(U.geste)) U.geste = "tailler";
    if (!(st.stats.crafts > 0)) h += '<div class="tip">1. Choisis un <b>geste</b>. 2. Touche des <b>matières</b> pour les poser sur l’établi. 3. <b>Œuvre</b> ! Essaie : <b>Tailler</b> + <b>Bois</b>.</div>';
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
      h += '<button class="geste' + (U.geste === g ? " on" : "") + (G.secret ? " secret" : "") + '" data-g="' + g + '"><span class="gi">' + G.ic + '</span><span class="gn">' + G.n + "</span></button>";
    }
    h += "</div>";
    const G = D.GESTES[U.geste];
    let heat = G.d;
    if (U.geste === "chauffer" || U.geste === "allier") heat = "🌡️ Ta meilleure chaleur : " + fmtHeat(E.heat());
    else if ((U.geste === "marteler" || U.geste === "electriser") && E.level(U.geste) > 1) heat = G.d + " (niveau " + E.level(U.geste) + ")";
    h += '<div class="card bench" id="bench"><div class="heat small">' + esc(heat) + '</div><div class="slots">';
    U.slots.forEach((id, i) => {
      if (i) h += '<span class="plus-sep">+</span>';
      if (id) h += '<button class="slot full" data-slot="' + i + '">' + icon(id) + '<span class="sn">' + esc(I[id].n) + '</span><span class="tiny muted" data-c="' + id + '">' + fmt(st.inv[id] || 0) + "</span></button>";
      else h += '<button class="slot" data-slot="' + i + '"><span class="plus">+</span></button>';
    });
    h += '</div><button class="forge-btn" id="forge">' + G.ic + " " + G.n.toUpperCase() + "</button></div>";
    h += '<div class="card result" id="result">' + resultHTML() + "</div>";
    h += '<h3 class="sub">Tes matières</h3><div class="filters">' +
      [["tout", "Tout"], ["res", "Récoltées"], ["comp", "Fabriquées"], ["new", "Inutilisées"]].map(([k, n]) => '<button data-if="' + k + '" class="' + (U.invFilter === k ? "on" : "") + '">' + n + "</button>").join("") + "</div>";
    h += '<div class="inv-grid">' + invItems().map((id) => {
      const sel = U.slots.includes(id);
      return '<button class="inv' + (sel ? " sel" : "") + (I[id].t === "relic" ? " relic" : "") + '" data-inv="' + id + '">' + icon(id) +
        '<span class="c" data-c="' + id + '">' + fmt(st.inv[id] || 0) + '</span><span class="n">' + esc(I[id].n) + "</span></button>";
    }).join("") + "</div>";
    if (!invItems().length) h += '<p class="small muted center">Rien ici. Va récolter dans les Terres.</p>';
    return h;
  }
  function invItems() {
    const st = S();
    const used = {};
    if (U.invFilter === "new") for (const id in st.known) if (I[id].r) for (const i in I[id].r[1]) used[i] = true;
    return Object.keys(st.inv).filter((id) => {
      const it = I[id];
      if (!it || !(st.inv[id] >= 1)) return false;
      if (E.isUnique(it) || it.t === "ext" || it.t === "auto") return false;
      if (U.invFilter === "res") return it.t === "res";
      if (U.invFilter === "comp") return it.t !== "res";
      if (U.invFilter === "new") return !used[id];
      return true;
    }).sort((a, b) => I[a].a - I[b].a || (I[a].t === "res" ? -1 : 0) - (I[b].t === "res" ? -1 : 0) || I[a].n.localeCompare(I[b].n));
  }
  const WHY = {
    froid: "Rien à tirer de ce mélange… pour l’instant.",
    frais: "Une de ces matières cache une recette — avec un autre geste, ou d’autres compagnons.",
    tiede: "Ce geste et ces matières ont quelque chose à se dire.",
    manque: "Le bon geste ! Mais il manque encore une matière.",
    trop: "Le bon geste ! Mais une de ces matières est de trop.",
    geste: "Les bonnes matières… mais pas le bon geste."
  };
  function thermo(t) {
    const T = D.TEMPS[t];
    return '<div class="thermo"><div class="row between"><span class="tname" style="color:' + T.c + '">' + T.n + '</span></div><div class="tbar"><i class="tmark" style="left:' +
      (6 + t * 22) + '%"></i></div></div>';
  }
  function resultHTML() {
    const r = U.last;
    if (!r) return '<p class="small muted">Choisis un geste, pose jusqu’à trois matières, puis œuvre. Le <b>thermomètre</b> te dira si tu brûles…</p>';
    if (r.kind === "craft") {
      const it = I[r.id];
      let h = '<div class="row" style="align-items:flex-start">' + icon(r.id, "lg") + '<div class="grow">' +
        (r.fresh ? '<span class="new">Nouvelle découverte</span>' : "") +
        '<div class="rname">' + esc(it.n) + (E.isUnique(it) ? "" : " <span class='muted'>+" + fmt(r.n) + "</span>") + (r.bonus ? ' <span class="small" style="color:var(--intu)">★ chef-d’œuvre +' + fmt(r.bonus) + "</span>" : "") + "</div>" +
        '<div class="small muted">' + esc(it.d || "") + "</div>" + (fxText(r.id) ? '<div class="small" style="color:var(--good);margin-top:4px">' + esc(fxText(r.id)) + "</div>" : "") + "</div></div>";
      if (!E.isUnique(it)) {
        h += '<div class="row wrap" style="margin-top:10px"><span class="small muted">' + gesteChip(r.id) + "</span>" + ingHTML(E.costFor(r.id), { check: true }) + "</div>";
        h += '<div class="row" style="margin-top:8px">' + craftBtns(r.id) + "</div>";
      }
      return h;
    }
    if (r.kind === "learn") {
      return '<div class="row">' + icon(r.id, "lg") + '<div class="grow">' + (r.fresh ? '<span class="new">Recette comprise</span>' : "") +
        '<div class="rname">' + esc(I[r.id].n) + '</div><div class="small">Tu sais comment faire, mais il te manque :</div><div class="row wrap small">' +
        Object.keys(r.missing).map((i) => '<span class="ing lack">' + icon(i, "sm") + fmt(r.missing[i]) + " " + esc(I[i].n) + "</span>").join("") + "</div></div></div>";
    }
    if (r.kind === "blocked") {
      const b = r.info;
      let msg = "Il te manque un outil.";
      if (b.why === "heat") msg = "Ça rougeoie, mais ça ne prend pas. Il faudrait au moins " + fmtHeat(b.heat) + " (tu atteins " + fmtHeat(E.heat()) + ").";
      if (b.why === "lvl") msg = U.geste === "marteler" ? "Ton enclume n’est pas assez dure pour ce métal." : "Il faudrait bien plus de puissance.";
      return thermo(4) + '<div class="row" style="margin-top:6px">' + icon(r.id) + '<div class="grow"><b>' + esc(I[r.id].n) + '</b><div class="small">' + esc(msg) + "</div>" +
        (r.fresh ? '<div class="tiny muted">Recette notée dans le Carnet.</div>' : "") + "</div></div>";
    }
    if (r.kind === "owned") return '<p class="small">Tu possèdes déjà <b>' + esc(I[r.id].n) + "</b>.</p>";
    if (r.kind === "fail") return thermo(r.temp) + '<p class="small" style="margin-top:8px">' + esc(r.msg) + '</p><p class="tiny muted">' + WHY[r.why] + "</p>";
    return "";
  }
  function craftBtns(id) {
    const it = I[id];
    if (E.isUnique(it)) return '<button class="btn small pri" data-cr="' + id + '" data-n="1">Fabriquer</button>';
    if (it.t === "ext" || it.t === "auto") return '<button class="btn small pri" data-cr="' + id + '" data-n="1">Construire</button>';
    return '<button class="btn small pri" data-cr="' + id + '" data-n="1">×1</button><button class="btn small" data-cr="' + id + '" data-n="10">×10</button><button class="btn small" data-cr="' + id + '" data-n="max">Max</button>';
  }

  /* ------------------------------------------------------------ CARNET */
  function viewCarnet() {
    const st = S();
    const book = E.carnet();
    let known = 0, total = 0;
    book.forEach((s) => s.ids.forEach((id) => { if (!I[id].sec) { total++; if (st.known[id]) known++; } }));
    let h = '<h2 class="title">Carnet</h2>';
    if (!st.flags.tip_carnet) h += '<div class="tip">Chaque recette découverte s’inscrit ici. Les recettes inconnues ont une <b>énigme</b> ; dépense de l’<b>Intuition ✨</b> pour obtenir un indice. Fabriquer souvent une recette apporte la <b>maîtrise ★</b> : des chefs-d’œuvre gratuits. <button class="btn small ghost" data-tip="tip_carnet">OK</button></div>';
    h += '<p class="small muted">' + known + (known > 1 ? " recettes connues" : " recette connue") + " sur " + total + " · ✨ " + Math.floor(st.intu) + " Intuition" +
      (E.slots() ? " · Chaînes : " + st.auto.length + "/" + E.slots() : "") + "</p>";
    h += '<div class="filters">' + [["tout", "Tout"], ["craft", "Réalisables"], ["unk", "À découvrir"], ["prod", "Production"]].map(([k, n]) =>
      '<button data-cf="' + k + '" class="' + (U.carnetFilter === k ? "on" : "") + '">' + n + "</button>").join("") + "</div>";
    if (E.gesteOK("accorder")) {
      const ids = E.pathRecipes().filter(passFilter);
      if (ids.length) h += '<details class="card age-sec" open><summary><span class="ic" style="border-color:#b36bff">🎵</span><span class="an">La Résonance</span></summary><div class="list">' + ids.map(recCard).join("") + "</div></details>";
    }
    const secrets = Object.keys(I).filter((id) => I[id].sec && st.known[id] && I[id].r).filter(passFilter);
    const order = book.map((b, i) => i).sort((a, b) => {
      const ra = book[a].age === st.age ? 0 : book[a].age === st.age + 1 ? 1 : 2 + (st.age - book[a].age);
      const rb = book[b].age === st.age ? 0 : book[b].age === st.age + 1 ? 1 : 2 + (st.age - book[b].age);
      return ra - rb;
    });
    for (const k of order) {
      const sec = book[k];
      const ids = sec.ids.filter((id) => !I[id].sec).filter(passFilter);
      if (!ids.length) continue;
      const ag = D.AGES[sec.age];
      const kn = sec.ids.filter((id) => st.known[id] && !I[id].sec).length;
      const all = sec.ids.filter((id) => !I[id].sec).length;
      const open = U.openAges[sec.age] !== undefined ? U.openAges[sec.age] : sec.age >= st.age;
      h += '<details class="card age-sec" data-age="' + sec.age + '"' + (open ? " open" : "") + '><summary><span class="ic" style="background:' + ag.c + '22;border-color:' + ag.c + '66">' + (sec.age + 1) +
        '</span><span class="an">' + ag.n + '</span><span class="cnt">' + kn + "/" + all + '</span></summary><div class="list">' + ids.map(recCard).join("") + "</div></details>";
    }
    if (secrets.length) h += '<details class="card age-sec"><summary><span class="ic">🗝️</span><span class="an">Curiosités</span><span class="cnt">' + secrets.length + '</span></summary><div class="list">' + secrets.map(recCard).join("") + "</div></details>";
    return h;
  }
  function passFilter(id) {
    const st = S(), it = I[id];
    if (U.carnetFilter === "tout") return true;
    if (U.carnetFilter === "unk") return !st.known[id];
    if (U.carnetFilter === "craft") return st.known[id] && E.maxCraftable(id, 1) > 0;
    if (U.carnetFilter === "prod") return st.known[id] && (it.t === "ext" || it.t === "upg" || it.t === "auto" || it.t === "tool" || it.t === "stat");
    return true;
  }
  function recCard(id) {
    const st = S(), it = I[id];
    if (!st.known[id]) {
      const lvl = st.hints[id] || 0;
      const ing = Object.keys(it.r[1]);
      const big = ing.slice().sort((a, b) => it.r[1][b] - it.r[1][a])[0];
      return '<div class="rec unknown"><div class="rh"><span class="ic unk">?</span><div class="grow"><div class="rt">' + esc(it.n) + '<span class="badge">' + TYPE[it.t] + '</span></div><div class="tiny muted">' + esc(fxText(id)) + "</div></div></div>" +
        (it.h ? '<div class="riddle small" style="margin-top:6px">« ' + esc(it.h) + " »</div>" : "") +
        '<div class="rl tiny muted">Geste : ' + (lvl >= 1 ? gesteChip(id) : "?") + " · Matière : " + (lvl >= 2 ? '<span class="ing">' + icon(big, "sm") + esc(I[big].n) + "</span>" : "?") + " · " + ing.length + " matière" + (ing.length > 1 ? "s" : "") + "</div>" +
        '<div class="acts"><button class="btn small" data-hint="' + id + '"' + (st.intu < E.hintCost(id) ? " disabled" : "") + ">💡 Indice · ✨" + E.hintCost(id) + "</button></div></div>";
    }
    const uniq = E.isUnique(it);
    const owned = uniq && (st.made[id] || 0) > 0;
    const stars = E.stars(id);
    let h = '<div class="rec' + (owned ? " owned" : "") + '"><div class="rh">' + icon(id) + '<div class="grow"><div class="rt">' + esc(it.n) + '<span class="badge">' + TYPE[it.t] + "</span></div>" +
      (stars ? '<div class="stars">' + "★".repeat(stars) + "</div>" : "") + '</div><div class="small muted" data-c="' + id + '">' + (uniq ? (owned ? "✓" : "") : fmt(st.inv[id] || 0)) + "</div></div>";
    if (!owned) h += '<div class="rl">' + gesteChip(id) + ingHTML(E.costFor(id), { check: true }) + "</div>";
    const fx = fxText(id);
    if (fx) h += '<div class="fx">' + esc(fx) + "</div>";
    if (it.t === "ext" || it.t === "auto") h += '<div class="tiny muted" style="margin-top:4px">Possédés : ' + (st.inv[id] || 0) + "</div>";
    if (!owned) {
      const b = E.blocker(id);
      if (b && b.why === "heat") h += '<div class="why">Nécessite ' + fmtHeat(b.heat) + "</div>";
      else if (b && b.why === "lvl") h += '<div class="why">Nécessite ' + D.GESTES[it.r[0]].n + " niveau " + b.lvl + "</div>";
      else if (b && b.why === "geste") h += '<div class="why">Geste inconnu : ' + D.GESTES[it.r[0]].n + "</div>";
      else {
        h += '<div class="acts">' + craftBtns(id);
        if (E.slots() && !uniq && it.t !== "ext" && it.t !== "auto") {
          const on = st.auto.includes(id);
          h += '<button class="btn small' + (on ? " auto-on" : "") + '" data-auto="' + id + '">⚙ Auto' + (on ? " ✓" : "") + "</button>";
        }
        h += "</div>";
      }
    }
    return h + "</div>";
  }

  /* ------------------------------------------------------------ JOURNAL */
  function viewJournal() {
    const st = S();
    const tabs = [["fragments", "Fragments"], ["secrets", "Secrets"]];
    if (E.has("flute")) tabs.push(["flute", "Flûte"]);
    tabs.push(["fins", "Fins"], ["stats", "Mémoire"]);
    if (!tabs.find((t) => t[0] === U.journalTab)) U.journalTab = "fragments";
    let h = '<h2 class="title">Journal</h2><div class="filters">' + tabs.map(([k, n]) => '<button data-jt="' + k + '" class="' + (U.journalTab === k ? "on" : "") + '">' + n + "</button>").join("") + "</div>";
    if (U.journalTab === "fragments") {
      const ids = Object.keys(D.FRAGS);
      const n = ids.filter((f) => st.frags[f]).length;
      h += '<p class="small muted">' + n + "/" + ids.length + " fragments de l’histoire retrouvés.</p>";
      const miss = {};
      ids.forEach((f) => {
        const F = D.FRAGS[f];
        if (st.frags[f]) h += '<button class="frag" data-frag="' + f + '"><span class="fi">📜</span><div class="grow"><b>' + esc(F.n) + '</b><div class="tiny muted">' + esc(fragPlace(F.z)) + "</div></div></button>";
        else { const k = unkPlace(F.z); miss[k] = (miss[k] || 0) + 1; }
      });
      if (Object.keys(miss).length) {
        h += '<h3 class="sub">Encore à découvrir</h3>';
        for (const k in miss) h += '<div class="frag unk"><span class="fi">❔</span><div class="grow">' + esc(k) + '<div class="tiny muted">' + miss[k] + " fragment" + (miss[k] > 1 ? "s" : "") + "</div></div></div>";
      }
    } else if (U.journalTab === "secrets") {
      const n = D.SECRETS.filter((s) => st.secrets[s.id]).length;
      h += '<p class="small muted">' + n + "/" + D.SECRETS.length + " secrets découverts. Expérimente, explore, écoute… et lis attentivement.</p><div class=\"secret-grid\">";
      D.SECRETS.forEach((s) => {
        const found = st.secrets[s.id];
        const name = s.n || (I[s.id] ? I[s.id].n : D.MELODIES[s.id] ? D.MELODIES[s.id].n : s.id);
        h += '<div class="sec' + (found ? "" : " unk") + '"><div class="k">' + s.k + "</div>" + (found ? esc(name) : "???") + "</div>";
      });
      h += "</div>";
    } else if (U.journalTab === "flute") {
      h += '<div class="card"><p class="small muted center">Un os creux percé de cinq trous. Touche-les pour jouer.</p><div class="flute-body"><div class="flute">' +
        [1, 2, 3, 4, 5].map((n) => '<button class="hole" data-note="' + n + '">' + n + "</button>").join("") + '</div></div><div class="notes" id="notes">' + st.notes.join(" · ") + "</div></div>";
      const known = Object.keys(D.MELODIES).filter((m) => st.secrets[m]);
      if (known.length) {
        h += '<h3 class="sub">Mélodies connues</h3>';
        known.forEach((m) => { h += '<button class="frag" data-play="' + m + '"><span class="fi">🎶</span><div class="grow"><b>' + esc(D.MELODIES[m].n) + '</b><div class="tiny muted">' + D.MELODIES[m].notes.join(" · ") + "</div></div></button>"; });
      } else h += '<p class="small muted">Tu ne connais encore aucune mélodie. Peut-être que le monde t’en a déjà appris une, sans que tu y prennes garde…</p>';
    } else if (U.journalTab === "fins") {
      h += '<p class="small muted">Cycle ' + st.cycle + " · Échos : " + st.echoes + (st.echoes ? " (production et récolte +" + st.echoes * 50 + " %)" : "") + "</p>";
      Object.keys(D.ENDINGS).forEach((k) => {
        const en = D.ENDINGS[k], got = st.meta.endings[k];
        h += '<div class="frag' + (got ? "" : " unk") + '"><span class="fi">' + (got ? en.ic : "❔") + '</span><div class="grow"><b>' + (got ? esc(en.n) : "???") + '</b><div class="tiny muted">' +
          (got ? "Atteinte " + got + " fois" : "Une fin encore inconnue.") + "</div></div></div>";
      });
    } else {
      const evs = Object.keys(D.EVENTS).filter((id) => st.made[id] > 0);
      h += '<div class="card">' + [["Temps de jeu", fmtTime(st.stats.play)], ["Récoltes manuelles", fmt(st.stats.taps)], ["Fabrications", fmt(st.stats.crafts)],
        ["Expériences à l’atelier", fmt(st.stats.tries)], ["Recettes connues", Object.keys(st.known).length], ["Cycle", st.cycle]].map(([a, b]) => '<div class="stat"><span class="muted">' + a + "</span><b>" + b + "</b></div>").join("") + "</div>";
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
    let h = '<div class="filters" style="margin-top:4px">' + tabs.map(([k, n]) => '<button data-ct="' + k + '" class="' + (U.cosmosTab === k ? "on" : "") + '">' + n + "</button>").join("") + "</div>";
    if (U.cosmosTab === "ciel") {
      h += '<div class="sky-wrap"><canvas id="skyCanvas"></canvas><div class="sky-info" id="skyInfo">Touche le ciel.</div></div>';
      if (E.cache().signal) h += '<button class="btn wide pri" id="listen">📡 Écouter Kher</button>';
      else h += '<p class="small muted">Avec une oreille assez grande, tu pourrais peut-être entendre ce que dit l’étoile rouge.</p>';
    } else if (U.cosmosTab === "arche") {
      h += '<div class="term" id="term">';
      if (!st.flags.arche) h += '<div class="l">…aucun signal radio.</div>';
      st.arche.forEach((l) => { h += '<div class="l">' + esc(l.txt) + "</div>"; });
      if (st.term.length) h += '<div class="l">────────</div>' + st.term.map((l) => '<div class="l' + (l.startsWith("> ") ? " u" : "") + '">' + esc(l) + "</div>").join("");
      h += "</div>";
      if (E.cache().term) h += '<form class="term-in" id="termForm" autocomplete="off"><input id="termIn" placeholder="tape une commande…" autocapitalize="off" spellcheck="false"><button class="btn" type="submit">⏎</button></form>';
      else h += '<p class="small muted">Un ordinateur te permettrait de dialoguer avec ARCHE.</p>';
    } else {
      h += '<p class="small muted">Les Grands Œuvres consomment des quantités colossales de matières. Contribue au fur et à mesure.</p>';
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
            h += '<div class="cost-row">' + icon(k, "sm") + '<span class="grow">' + esc(I[k].n) + '</span><span class="tiny">' + fmt(paid) + "/" + fmt(s.cost[k]) + '</span><div class="bar"><i style="width:' + (100 * paid / s.cost[k]).toFixed(1) + '%"></i></div></div>';
          }
          if (s.need && !st.frags[s.need]) h += '<div class="why">Il faut d’abord atteindre ' + esc(D.FRAGS[s.need].n) + ".</div>";
          else h += '<div class="row" style="margin-top:8px"><button class="btn small pri" data-give="' + pid + '">Contribuer</button><span class="tiny muted">Donne tout ce que tu peux.</span></div>';
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
  function refresh() {
    const st = S();
    $("#intu").textContent = Math.floor(st.intu);
    const xp = E.expProgress();
    const mini = $("#expMini");
    if (xp) {
      mini.classList.remove("hidden");
      mini.textContent = "🧭 " + fmtTime(xp.left);
      $$("[data-xp]").forEach((b) => (b.style.width = (xp.p * 100).toFixed(1) + "%"));
      $$("[data-xl]").forEach((b) => (b.textContent = fmtTime(xp.left)));
    } else mini.classList.add("hidden");
    const view = $("#v-" + U.tab);
    $$("[data-c]", view).forEach((el) => {
      const id = el.dataset.c, it = I[id];
      if (it && E.isUnique(it)) return;
      el.textContent = fmt(st.inv[id] || 0);
    });
    $$("[data-r]", view).forEach((el) => (el.textContent = fmtRate(E.rate(el.dataset.r))));
    $$("[data-y]", view).forEach((el) => { const [r, z] = el.dataset.y.split("|"); el.textContent = "+" + fmt(E.tapYield(r, z)); });
    $$("[data-need]", view).forEach((el) => el.classList.toggle("lack", (st.inv[el.dataset.need] || 0) + 1e-9 < Number(el.dataset.q)));
    $$("[data-cr]", view).forEach((b) => {
      const id = b.dataset.cr, n = b.dataset.n;
      const max = E.maxCraftable(id, n === "max" ? 100000 : Number(n));
      const ok = n === "max" ? max >= 1 : max >= Number(n);
      b.disabled = !ok;
      if (n === "max") b.textContent = "Max" + (max > 1 ? " (" + fmt(max) + ")" : "");
    });
    $$("[data-exp]", view).forEach((b) => {
      const n = E.nextExp(b.dataset.exp);
      let ok = !st.exp.active && n && !n.locked;
      if (ok && n.x.cost) for (const i in n.x.cost) if ((st.inv[i] || 0) < n.x.cost[i]) ok = false;
      b.disabled = !ok;
    });
    $$("[data-hint]", view).forEach((b) => (b.disabled = st.intu < E.hintCost(b.dataset.hint)));
    $$("[data-give]", view).forEach((b) => {
      const ps = E.projState(b.dataset.give), s = D.PROJECTS[b.dataset.give].steps[ps.step];
      let ok = false;
      if (s && s.cost) for (const k in s.cost) if ((ps.paid[k] || 0) < s.cost[k] && (st.inv[k] || 0) >= 1) ok = true;
      b.disabled = !ok;
    });
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
    const showPip = E.cache().pip > 0 && U.tab === "terres";
    if (showPip && !pip) { pip = document.createElement("div"); pip.className = "pip"; pip.textContent = "🐞"; app.appendChild(pip); }
    if (!showPip && pip) pip.remove();
  }

  /* ============================================================ ACTIONS */
  function doTap(el) {
    A.init();
    const r = el.dataset.res, z = el.dataset.z;
    const n = E.tap(r, z);
    if (!n) return;
    const p = U.holding ? elCenter(el) : U.pointer;
    floater("+" + fmt(n), p.x + (Math.random() - 0.5) * 24, p.y - 10);
    A.tap(Object.keys(I).indexOf(r));
    vibe(5);
    const c = $('[data-c="' + r + '"]', el);
    if (c) c.textContent = fmt(S().inv[r] || 0);
    if (!S().flags.tip_tap && S().stats.taps >= 6) { S().flags.tip_tap = true; U.dirty = true; }
  }
  function startHold(el) {
    endHold();
    el.classList.add("press");
    doTap(el);
    U.holding = { el, t: setTimeout(function rep() { if (!U.holding) return; doTap(U.holding.el); U.holding.t = setTimeout(rep, 140); }, 400) };
  }
  function endHold() {
    if (!U.holding) return;
    clearTimeout(U.holding.t);
    U.holding.el.classList.remove("press");
    U.holding = null;
    if (U.dirty) render();
  }

  function putInSlot(id) {
    const i = U.slots.indexOf(id);
    if (i >= 0) { U.slots[i] = null; }
    else {
      const free = U.slots.indexOf(null);
      if (free < 0) { toast("L’établi est plein : touche un emplacement pour le vider."); return; }
      U.slots[free] = id;
    }
    A.click();
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
    const bench = $("#bench");
    const p = elCenter($("#forge"));
    if (r.kind === "craft") {
      A.craft(g);
      if (r.fresh) setTimeout(() => A.discover(), 180);
      sparks(p.x, p.y - 40, r.fresh ? 26 : 12);
      vibe(r.fresh ? [10, 40, 20] : 12);
      if (bench) { bench.classList.remove("glow"); void bench.offsetWidth; bench.classList.add("glow"); }
    } else if (r.kind === "learn" || r.kind === "blocked") {
      A.fail(4); if (r.fresh) setTimeout(() => A.discover(), 150);
    } else {
      A.fail(r.temp || 0);
      vibe(20);
      if (bench) { bench.classList.remove("shake"); void bench.offsetWidth; bench.classList.add("shake"); }
    }
    render(true);
  }

  function craftFrom(btn) {
    A.init();
    const id = btn.dataset.cr;
    const n = btn.dataset.n === "max" ? E.maxCraftable(id) : Number(btn.dataset.n);
    if (!(n > 0)) return;
    const p = elCenter(btn);
    const r = E.craft(id, n);
    if (!r.ok) { A.fail(0); return; }
    A.craft(I[id].r[0]);
    floater("+" + fmt(r.n) + " " + I[id].n, p.x, p.y - 16, "var(--good)");
    if (r.bonus) setTimeout(() => floater("★ +" + fmt(r.bonus), p.x, p.y - 30, "var(--intu)"), 200);
    sparks(p.x, p.y, 8);
    vibe(10);
    if (U.last && U.last.id === id) U.last = Object.assign({}, U.last, { n: r.n, bonus: r.bonus, fresh: false });
    render(true);
  }

  function openItemInfo(id) {
    const it = I[id], st = S();
    const uses = Object.keys(I).filter((k) => I[k].r && I[k].r[1][id] && st.known[k]);
    let h = '<div class="row">' + icon(id, "lg") + '<div class="grow"><div class="kicker">' + TYPE[it.t] + "</div><h2 style=\"margin:0\">" + esc(it.n) + "</h2></div></div>" +
      '<p class="serif" style="font-size:16px">' + esc(it.d || "") + "</p>" + (fxText(id) ? '<p class="small" style="color:var(--good)">' + esc(fxText(id)) + "</p>" : "") +
      '<p class="small muted">En stock : ' + fmt(st.inv[id] || 0) + (E.rate(id) ? " · " + fmtRate(E.rate(id)) : "") + "</p>";
    if (uses.length) h += '<h3 class="sub">Sert à fabriquer</h3><div class="row wrap">' + uses.map((k) => '<span class="ing">' + icon(k, "sm") + esc(I[k].n) + "</span>").join("") + "</div>";
    else h += '<p class="small muted">Tu ne connais encore aucune recette qui l’utilise.</p>';
    openModal({ html: h + '<div class="acts"><button class="btn pri" data-m="close">Fermer</button></div>' });
  }

  function giveProject(pid) {
    const r = E.contribute(pid);
    if (r.ok) { A.craft("stratifier"); toast("Contribution : <b>" + fmt(r.gave) + "</b> matières" + (r.done ? " — étape terminée !" : "")); }
    if (r.done && !r.ending) A.discover();
    render(true);
  }
  function confirmFire(pid) {
    const st = S();
    let warn = "";
    if (st.frags.registre) warn += "<p class=\"serif\">Une phrase te revient en mémoire : « Ils chanteront, pour qu’on les reconnaisse. »</p>";
    if (st.frags.code_source) warn += "<p class=\"serif\">« Clé d’identification amie : le chant d’Iris. » Le chant… que tu n’as jamais vérifié.</p>";
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
    if (info) info.textContent = r.decoded ? "« Nous rentrons à la maison. Est-ce que quelqu’un nous attend encore ? »" : "Une onde lente, montante, descendante… presque une mélodie. Tu ne la comprends pas.";
    if (r.fresh) toast("Tu as enregistré le <b>Signal de Kher</b>.");
  }
  function skyTap(ev) {
    const cv = ev.currentTarget, rc = cv.getBoundingClientRect();
    const hit = Sky.hit(ev.clientX - rc.left, ev.clientY - rc.top);
    const info = $("#skyInfo");
    if (!hit || !info) return;
    A.init(); A.click();
    if (hit.k === "moon") {
      const msg = E.tapMoon();
      info.textContent = msg || "La Lune. Grise, silencieuse. Tu as l’impression qu’elle te regarde aussi.";
    } else if (hit.k === "kher") {
      info.textContent = S().flags.decoded ? "Kher. Plus une menace : une maison lointaine, d’où des enfants reviennent." :
        S().age >= 7 ? "Kher, à 11,9 années-lumière. ARCHE la dit dangereuse. Elle pulse comme un cœur." : "Une étoile rouge qui pulse lentement. Elle n’était pas là… avant.";
    } else info.textContent = hit.n + ".";
  }

  function playNote(n, btn) {
    A.init();
    A.note(n);
    if (btn) { btn.classList.add("ping"); setTimeout(() => btn.classList.remove("ping"), 160); }
    const r = E.playNote(n);
    const el = $("#notes");
    if (el) el.textContent = S().notes.join(" · ");
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
    const inp = $("#termIn"); if (inp) inp.focus();
  }

  /* ------------------------------------------------------------ menus */
  function openMenu() {
    const st = S();
    openModal({
      html: '<h2>Menu</h2>' +
        '<div class="toggle"><span>Son</span><button class="btn small" data-m="sound">' + (st.settings.sound ? "Activé" : "Coupé") + "</button></div>" +
        '<div class="toggle"><span>Vibrations</span><button class="btn small" data-m="vibe">' + (st.settings.vibe ? "Activées" : "Coupées") + "</button></div>" +
        '<div class="acts" style="flex-direction:column"><button class="btn" data-m="help">❓ Comment jouer</button><button class="btn" data-m="export">💾 Exporter la sauvegarde</button>' +
        '<button class="btn" data-m="import">📥 Importer une sauvegarde</button><button class="btn" data-m="reset" style="color:var(--bad)">🗑️ Tout recommencer</button>' +
        '<button class="btn pri" data-m="close">Fermer</button></div><p class="tiny dim center" style="margin-top:12px">Éclat — du silex aux étoiles · sauvegarde automatique sur cet appareil</p>',
      on: {
        sound: (b) => { st.settings.sound = !st.settings.sound; A.setEnabled(st.settings.sound); b.textContent = st.settings.sound ? "Activé" : "Coupé"; save(); return true; },
        vibe: (b) => { st.settings.vibe = !st.settings.vibe; b.textContent = st.settings.vibe ? "Activées" : "Coupées"; save(); return true; },
        help: () => setTimeout(openHelp, 80),
        export: () => setTimeout(() => {
          save();
          const code = E.exportSave();
          openModal({ html: "<h2>Exporter</h2><p class=\"small muted\">Copie ce code et garde-le précieusement.</p><textarea class=\"save\" readonly>" + code + '</textarea><div class="acts"><button class="btn" data-m="copy">Copier</button><button class="btn pri" data-m="close">Fermer</button></div>',
            onOpen: (box) => { const t = $("textarea", box); t.focus(); t.select(); },
            on: { copy: () => { try { navigator.clipboard.writeText(code); toast("Copié !"); } catch (e) { /* ignoré */ } return true; } } });
        }, 80),
        import: () => setTimeout(() => {
          openModal({ html: '<h2>Importer</h2><p class="small muted">Colle ici un code de sauvegarde. La partie actuelle sera remplacée.</p><textarea class="save" id="impTxt"></textarea><div class="acts"><button class="btn" data-m="close">Annuler</button><button class="btn pri" data-m="go">Importer</button></div>',
            on: { go: () => { try { E.importSave($("#impTxt").value); save(); toast("Sauvegarde importée."); setTab("terres"); } catch (e) { toast("Code invalide."); return true; } } } });
        }, 80),
        reset: () => setTimeout(() => {
          openModal({ html: '<h2>Tout recommencer ?</h2><p>Toute ta progression, tes secrets et tes fins seront effacés. C’est définitif.</p><div class="acts"><button class="btn" data-m="close">Non</button><button class="btn pri" style="background:var(--bad)" data-m="go">Effacer</button></div>',
            on: { go: () => { E.reset(); save(); U.slots = [null, null, null]; U.last = null; setTab("terres"); intro(); } } });
        }, 80)
      }
    });
  }
  function openHelp() {
    simpleModal("Aide", "Comment jouer",
      '<div class="small">' +
      "<p><b>🌲 Terres</b> — Touche les ressources pour les récolter (maintiens pour récolter en continu). Les <b>extracteurs</b> que tu construis produisent tout seuls, même quand le jeu est fermé (jusqu’à 12 h). Lance des <b>explorations</b> pour découvrir l’histoire du monde.</p>" +
      "<p><b>🔨 Atelier</b> — Le cœur du jeu. Choisis un <b>geste</b> (Tailler, Tresser, Chauffer…), pose jusqu’à trois <b>matières</b>, et œuvre. Les quantités sont automatiques. Si rien ne se passe, le <b>thermomètre</b> te dit si tu t’approches d’une recette : Froid, Frais, Tiède, Chaud, Brûlant.</p>" +
      "<p><b>📖 Carnet</b> — Les recettes connues se refabriquent d’un geste (×1, ×10, Max). Les inconnues ont une énigme ; l’<b>Intuition ✨</b> achète des indices. Fabriquer souvent donne la <b>maîtrise ★</b> et des chefs-d’œuvre (production bonus).</p>" +
      "<p><b>Stations</b> — Un nouveau feu, four ou outil débloque de nouveaux gestes ou une chaleur plus forte : de nouvelles recettes deviennent possibles avec des matières que tu connais déjà.</p>" +
      "<p><b>📜 Journal</b> — Fragments d’histoire, secrets, mélodies. Lis attentivement : certains textes cachent des recettes, des codes ou des airs.</p>" +
      "<p><b>🔭 Cosmos</b> — Le ciel, la voix d’ARCHE, et les Grands Œuvres qui mènent aux fins du jeu. Il y a plus d’une fin.</p></div>", "Compris");
  }

  function intro() {
    const st = S();
    const lines = st.cycle > 1
      ? ["Tu t’éveilles dans l’herbe humide, à l’orée d’une forêt.", "Ton corps est neuf. Tes souvenirs, non : des recettes entières dansent derrière tes paupières.", "Tu es le Semeur " + (st.cycle + 6) + ". Le précédent a laissé une trace dans ton Carnet."]
      : D.INTRO;
    openModal({
      persistent: true,
      html: '<div class="lore" style="padding:10px 0">' + lines.map((l, i) => '<p style="opacity:0;animation:fadeup 1.2s ' + (0.3 + i * 1.1) + 's forwards">' + esc(l) + "</p>").join("") +
        '</div><div class="acts"><button class="btn pri wide" data-m="close">Ouvrir les yeux</button></div>',
      onClose: () => {
        st.introSeen = true; save(); A.init();
        if (st.flags.capsuleMsg) {
          st.flags.capsuleMsg = false;
          simpleModal("Capsule temporelle", "Un message de toi-même",
            loreHTML("Au pied du Grand Chêne, une capsule de verre t’attend, avec quelques matériaux et un enregistrement. Ta propre voix :\n\n« Salut. C’est toi, d’avant. Fais confiance à tes mains. Et quand l’étoile rouge chantera… écoute-la jusqu’au bout. »"));
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
        '<div class="lore">' + paras.map((p, i) => '<p style="animation-delay:' + (0.6 + i * 1.6) + 's">' + esc(p).replace(/\n/g, "<br>") + "</p>").join("") + "</div>" +
        '<p class="center small muted" style="margin-top:24px;opacity:0;animation:fadeup 1s ' + (1 + paras.length * 1.6) + 's forwards">Fins découvertes : ' + n + "/" + Object.keys(D.ENDINGS).length +
        (n < 3 ? " — il reste d’autres chemins." : " — tu as tout vu. Merci d’avoir joué.") + "</p>" +
        '<div class="acts" style="opacity:0;animation:fadeup 1s ' + (1.4 + paras.length * 1.6) + 's forwards"><button class="btn" data-m="close">Continuer ce cycle</button><button class="btn pri" data-m="cycle">Nouveau cycle ✦</button></div>',
      on: { cycle: () => setTimeout(confirmCycle, 100) }
    });
  }
  function confirmCycle() {
    const st = S();
    const ech = Object.values(st.meta.endings).reduce((a, b) => a + b, 0);
    openModal({
      html: '<div class="kicker">Nouveau cycle</div><h2>Éveiller le Semeur ' + (st.cycle + 7) + " ?</h2><p>Le monde, tes matières et tes machines seront remis à zéro. Tu gardes ton <b>Carnet</b> (toutes les recettes connues), tes <b>fragments</b> et tes <b>secrets</b>.</p>" +
        "<p>Échos accumulés : <b>" + ech + "</b> — récolte et production <b>+" + ech * 50 + " %</b>.</p>" +
        '<div class="acts"><button class="btn" data-m="close">Pas encore</button><button class="btn pri" data-m="go">Recommencer</button></div>',
      on: { go: () => { E.newCycle(); save(); U.slots = [null, null, null]; U.last = null; setTab("terres"); setTimeout(intro, 200); } }
    });
  }

  /* ============================================================ ÉVÉNEMENTS DU MOTEUR */
  function bindEngine() {
    E.on("struct", () => { U.dirty = true; });
    E.on("age", (a) => {
      const ag = D.AGES[a];
      applyAge();
      A.age();
      const b = document.createElement("div");
      b.className = "age-banner";
      b.innerHTML = '<div class="k">Tu entres dans</div><div class="n">' + esc(ag.n) + '</div><div class="q">' + esc(ag.q) + "</div>";
      document.body.appendChild(b);
      setTimeout(() => b.remove(), 3500);
    });
    E.on("learn", () => badge("carnet"));
    E.on("zone", (z) => { toast("Nouvelle zone : <b>" + esc(zoneName(z)) + "</b>"); badge("terres"); });
    E.on("discover", (id) => {
      const it = I[id];
      if (!U.forging) {
        if (!it.sec) toast("Découverte : <b>" + esc(it.n) + "</b>" + (fxText(id) ? " — " + esc(fxText(id)) : ""));
      }
      if (it.e && it.e.sky) { badge("cosmos"); updateBadges(); }
    });
    E.on("event", (ev) => {
      setTimeout(() => simpleModal("Réminiscence", esc(I[ev.id].n), loreHTML(ev.txt)), 500);
    });
    E.on("secret", (id) => {
      badge("journal");
      const it = I[id];
      if (it && it.sec) setTimeout(() => { A.secret(); simpleModal("Secret découvert", esc(it.n), '<div class="row" style="margin-bottom:8px">' + icon(id, "lg") + "</div>" + loreHTML(it.d) + (fxText(id) ? '<p class="small" style="color:var(--good)">' + esc(fxText(id)) + "</p>" : "")); }, 450);
      else if (id === "caveau" || id === "lune7" || id[0] === "c") setTimeout(() => A.secret(), 300);
    });
    E.on("frag", () => badge("journal"));
    E.on("expdone", (r) => {
      A.discover();
      if (r.frag) badge("journal");
      if (r.silent) return;
      const F = r.frag && D.FRAGS[r.frag];
      const rw = r.x.rw || {};
      const gains = []
        .concat(rw.inv ? Object.keys(rw.inv).map((i) => "+" + rw.inv[i] + " " + I[i].n) : [])
        .concat(rw.item ? Object.keys(rw.item).map((i) => I[i].n) : [])
        .concat(rw.intu ? ["+" + rw.intu + " ✨"] : []);
      openModal({ html: '<div class="kicker">Exploration · ' + esc(zoneName(r.z)) + "</div><h2>" + esc(F ? F.n : r.x.n) + "</h2>" + (F ? loreHTML(F.t) : "") +
        (gains.length ? '<p class="small muted">Tu rapportes : ' + esc(gains.join(", ")) + "</p>" : "") + '<div class="acts"><button class="btn pri" data-m="close">Continuer</button></div>' });
    });
    E.on("arche", (key) => {
      badge("cosmos");
      if (key === "radio") setTimeout(() => {
        openModal({ html: '<div class="kicker">Poste radio</div><h2>Une voix dans le grésillement</h2><div class="term">' + D.ARCHE.radio.map((l) => '<div class="l">' + esc(l) + "</div>").join("") +
          '</div><div class="acts"><button class="btn pri" data-m="close">…</button></div>' });
      }, 900);
    });
    E.on("crafted", (id) => {
      if (E.cache().pip && (id === "pip" || Math.random() < 0.3)) setTimeout(() => A.pip(), 250);
    });
    E.on("decoded", () => {
      setTimeout(() => {
        A.signal();
        openModal({ html: '<div class="kicker">Traducteur</div><h2>' + esc(D.FRAGS.signal.n) + "</h2>" + loreHTML(D.FRAGS.signal.t) +
          '<p class="small muted">Un nouveau Grand Œuvre est apparu dans le Cosmos.</p><div class="acts"><button class="btn pri" data-m="close">…</button></div>' });
        badge("cosmos"); badge("journal");
      }, 600);
    });
    E.on("fx", (k) => { if (k === "fireworks") setTimeout(fireworks, 300); });
    E.on("ending", (r) => { setTimeout(() => showEnding(r), 600); save(); });
    E.on("offline", (o) => {
      if (o.dt < 60) return;
      const top = Object.keys(o.gains).filter((k) => I[k]).sort((a, b) => o.gains[b] - o.gains[a]).slice(0, 10);
      if (!top.length && !o.exp) return;
      U.offline = { dt: o.dt, top, gains: o.gains, exp: o.exp };
    });
  }

  /* ============================================================ ÉCOUTEURS DOM */
  function bindDom() {
    document.addEventListener("pointerdown", (ev) => { U.pointer = { x: ev.clientX, y: ev.clientY }; }, true);
    $("#tabs").addEventListener("click", (ev) => { const b = ev.target.closest("button[data-tab]"); if (b) { A.init(); A.click(); setTab(b.dataset.tab); } });
    $("#menuBtn").addEventListener("click", () => { A.init(); openMenu(); });
    $("#intuBtn").addEventListener("click", () => simpleModal("Intuition", "✨ " + Math.floor(S().intu),
      '<p class="small">L’Intuition s’obtient en découvrant des recettes, des fragments d’histoire et des secrets. Dépense-la dans le Carnet pour obtenir des indices sur les recettes inconnues.</p>' +
      (E.cache().intu ? '<p class="small muted">Génération : +' + E.cache().intu + " ✨ par minute.</p>" : "")));
    $("#expMini").addEventListener("click", () => setTab("terres"));

    const views = $("#views");
    views.addEventListener("pointerdown", (ev) => {
      const r = ev.target.closest(".res");
      if (r) { ev.preventDefault(); startHold(r); return; }
      const inv = ev.target.closest(".inv");
      if (inv) {
        const id = inv.dataset.inv;
        U.lp = { id, t: setTimeout(() => { U.lp = null; vibe(15); openItemInfo(id); }, 480) };
      }
    });
    const cancelLp = () => { if (U.lp) { clearTimeout(U.lp.t); } };
    ["pointerup", "pointercancel"].forEach((t) => document.addEventListener(t, () => { endHold(); }));
    views.addEventListener("pointerleave", endHold);
    views.addEventListener("scroll", () => { if (U.lp) { clearTimeout(U.lp.t); U.lp = null; } }, { passive: true });
    views.addEventListener("contextmenu", (ev) => { if (ev.target.closest(".res, .inv, .slot")) ev.preventDefault(); });

    views.addEventListener("click", (ev) => {
      const t = ev.target;
      let b;
      if ((b = t.closest(".inv"))) {
        if (U.lp) { cancelLp(); U.lp = null; putInSlot(b.dataset.inv); }
        return;
      }
      if ((b = t.closest("[data-zc]"))) {
        const st = S(), z = b.dataset.zc;
        st.settings.collapsed = st.settings.collapsed || {};
        st.settings.collapsed[z] = !st.settings.collapsed[z];
        A.click(); render(true); return;
      }
      if ((b = t.closest("[data-g]"))) { U.geste = b.dataset.g; A.click(); U.last = null; render(true); return; }
      if ((b = t.closest("[data-lock]"))) { toast("Un geste que tu ne maîtrises pas encore. Il te faut une nouvelle station."); return; }
      if ((b = t.closest("[data-slot]"))) { const i = Number(b.dataset.slot); if (U.slots[i]) { U.slots[i] = null; A.click(); render(true); } else toast("Touche une matière ci-dessous pour la poser ici."); return; }
      if (t.closest("#forge")) { forge(); return; }
      if ((b = t.closest("[data-cr]"))) { craftFrom(b); return; }
      if ((b = t.closest("[data-if]"))) { U.invFilter = b.dataset.if; render(true); return; }
      if ((b = t.closest("[data-cf]"))) { U.carnetFilter = b.dataset.cf; render(true); return; }
      if ((b = t.closest("[data-hint]"))) {
        const id = b.dataset.hint;
        if (E.revealHint(id)) { A.discover(); if (S().known[id]) toast("Recette révélée : <b>" + esc(I[id].n) + "</b>"); render(true); }
        return;
      }
      if ((b = t.closest("[data-auto]"))) {
        const id = b.dataset.auto;
        const was = S().auto.includes(id);
        const ok = E.toggleAuto(id);
        if (!was && !ok) toast("Toutes tes chaînes d’assemblage sont occupées.");
        render(true); return;
      }
      if ((b = t.closest("[data-tip]"))) { S().flags[b.dataset.tip] = true; render(true); return; }
      if ((b = t.closest("[data-exp]"))) {
        const r = E.startExp(b.dataset.exp);
        if (r.ok) { A.init(); A.click(); toast("Exploration en cours…"); } else if (r.why === "busy") toast("Tu explores déjà ailleurs.");
        render(true); return;
      }
      if ((b = t.closest("[data-goto]"))) {
        const id = b.dataset.goto;
        U.carnetFilter = "tout"; U.openAges[I[id].a] = true;
        setTab("carnet");
        setTimeout(() => { const el = $$(".rec").find((e) => e.innerHTML.includes(esc(I[id].n))); if (el) el.scrollIntoView({ block: "center", behavior: "smooth" }); }, 50);
        return;
      }
      if ((b = t.closest("[data-jt]"))) { U.journalTab = b.dataset.jt; render(true); return; }
      if ((b = t.closest("[data-frag]"))) { const F = D.FRAGS[b.dataset.frag]; simpleModal("Fragment", esc(F.n), loreHTML(F.t), "Refermer"); return; }
      if ((b = t.closest("[data-note]"))) { playNote(Number(b.dataset.note), b); return; }
      if ((b = t.closest("[data-play]"))) { A.init(); A.melody(D.MELODIES[b.dataset.play].notes); return; }
      if ((b = t.closest("[data-ct]"))) { U.cosmosTab = b.dataset.ct; render(true); return; }
      if (t.closest("#listen")) { listen(); return; }
      if ((b = t.closest("[data-give]"))) { giveProject(b.dataset.give); return; }
      if ((b = t.closest("[data-fire]"))) { confirmFire(b.dataset.fire); return; }
    });
    views.addEventListener("toggle", (ev) => {
      const d = ev.target;
      if (d.matches && d.matches("details[data-age]")) U.openAges[d.dataset.age] = d.open;
    }, true);
    views.addEventListener("submit", (ev) => {
      if (ev.target.id === "termForm") { ev.preventDefault(); runTerminal($("#termIn").value); }
    });
    views.addEventListener("pointerup", (ev) => {
      if (ev.target.id === "skyCanvas") skyTap(ev);
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
    simpleModal("Pendant ton absence", "Tu as été absent " + fmtTime(o.dt),
      (list ? '<p class="small muted">Tes machines ont travaillé :</p><div class="row wrap">' + list + "</div>" : "") +
      (o.exp ? '<p class="small">🧭 Ton exploration est terminée. Consulte le Journal.</p>' : ""));
  }

  /* ============================================================ BOUCLE */
  function loop() {
    E.update();
    if (U.offline) showOffline();
    if (U.dirty && !U.holding) render();
  }

  function boot() {
    setupModal();
    bindEngine();
    const had = loadSave();
    A.setEnabled(S().settings.sound);
    if (had) E.update();
    bindDom();
    setTab("terres");
    if (!S().introSeen) intro();
    else showOffline();
    setInterval(loop, 100);
    setInterval(refresh, 250);
    setInterval(save, 10000);
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("sw.js").catch(() => { /* hors ligne indisponible */ });
    }
    window.__eclat = { E, U, render };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
