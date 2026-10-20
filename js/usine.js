/* ÉCLAT — l’Usine : la grille dessinée sur un canvas, et les commandes tactiles.
 * Le moteur (engine.js) calcule la production ; ici on ne fait que montrer les
 * échanges entre machines sous forme d’objets qui roulent sur les tapis. */
(function () {
  "use strict";

  const MCOL = { automate_bois: "#8a5a32", automate_bronze: "#b0793a", presse_vapeur: "#6d7882", chaine: "#46698f", assembleur: "#7a4fb0" };
  const TOOLS = [
    ["voir", "👆", "Voir"],
    ["ext", "⛏️", "Extracteur"],
    ["tapis", "➜", "Tapis"],
    ["mach", "⚙️", "Machine"],
    ["port", "📤", "Sortie"],
    ["split", "🔀", "Répartir"],
    ["cross", "✚", "Croiser"],
    ["turn", "🔄", "Tourner"],
    ["del", "🗑️", "Démolir"]
  ];
  const CAPS = [0, 10, 50, 100, 200, 500, 1000, 5000, 20000, 100000];

  function create(api) {
    const { E, A, D, esc, fmt, fmtNum, fmtTime, icon, toast, openModal, closeModal, norm, vibe, goto, fmtHeat, floater, overlay, onZone, Scenes, openWheel, quiet } = api;
    const I = D.ITEMS;
    const { DX, DY } = window.EclatEngine;
    const S = () => E.state;
    const V = {
      el: null, cv: null, ctx: null, w: 0, h: 0, dpr: 1, ro: null,
      cam: { x: 0, y: 0, z: 44 }, camSet: false,
      tool: "voir", mtype: null, sel: null, raf: 0, t: 0, last: 0,
      packets: [], credit: {}, lastSpawn: {}, paths: {}, pulse: {},
      ptrs: new Map(), gest: null, draw: null, undo: [], emoji: {}
    };

    /* ------------------------------------------------------------ montage */
    function mount(el) {
      V.el = el;
      el.innerHTML =
        '<div class="usine">' +
          '<div class="u-bar"><div class="u-free" id="uFree"></div><button class="u-help" data-u="help" aria-label="Comment ça marche">?</button></div>' +
          '<div class="u-top"><div id="uOver"></div></div>' +
          '<canvas id="uCan"></canvas>' +
          '<div class="u-zoom"><button class="u-fab" data-u="roue" aria-label="Fabriquer">🛠️<i id="uFabN"></i></button><button data-u="zin" aria-label="Zoomer">+</button><button data-u="zout" aria-label="Dézoomer">−</button><button data-u="center" aria-label="Recentrer">⌖</button><button data-u="undo" id="uUndo" aria-label="Annuler" disabled>↶</button><button data-u="help" class="u-help2" aria-label="Comment ça marche">?</button></div>' +
          '<div class="u-sheet hidden" id="uSheet"></div>' +
          '<div class="u-hint hidden" id="uHint"></div>' +
          '<div class="u-tools" id="uTools">' + TOOLS.map((t) => '<button data-tool="' + t[0] + '"><span>' + t[1] + "</span><i>" + t[2] + "</i></button>").join("") + "</div>" +
        "</div>";
      V.cv = el.querySelector("#uCan");
      V.ctx = V.cv.getContext("2d");
      V.cv.addEventListener("pointerdown", onDown);
      V.cv.addEventListener("pointermove", onMove);
      V.cv.addEventListener("pointerup", onUp);
      V.cv.addEventListener("pointercancel", onCancel);
      V.cv.addEventListener("wheel", onWheel, { passive: false });
      el.querySelector(".usine").addEventListener("click", onClick);
      el.querySelector(".usine").addEventListener("change", onChange);
      V.ro = new ResizeObserver(resize);
      V.ro.observe(V.cv);
      resize();
      setTool(V.tool);
      refresh();
      V.ready = true;
      if (!V.camSet && V.w > 0) initCam();
      V.last = performance.now();
      V.raf = requestAnimationFrame(frame);
    }
    function unmount() {
      cancelAnimationFrame(V.raf);
      V.raf = 0;
      if (V.ro) V.ro.disconnect();
      V.ro = null;
      V.el = V.cv = V.ctx = null;
      V.packets = [];
      V.ptrs.clear();
      V.gest = V.draw = null;
    }
    const mounted = () => !!V.cv;

    function resize() {
      if (!V.cv) return;
      const r = V.cv.getBoundingClientRect();
      V.dpr = Math.min(2.5, window.devicePixelRatio || 1);
      V.w = r.width; V.h = r.height;
      V.cv.width = Math.round(r.width * V.dpr);
      V.cv.height = Math.round(r.height * V.dpr);
      if (!V.camSet && V.w > 0 && V.ready) initCam();
    }
    const clampZ = (z) => Math.max(18, Math.min(90, z));
    /* la bande de carte que rien ne recouvre : l’objectif en haut, le conseil en bas */
    function freeBand() {
      const r = V.cv.getBoundingClientRect();
      const t = V.el.querySelector(".u-top"), h = V.el.querySelector("#uHint");
      return {
        top: t ? Math.max(0, t.getBoundingClientRect().bottom - r.top) : 0,
        bot: h && !h.classList.contains("hidden") ? Math.max(0, r.bottom - h.getBoundingClientRect().top) : 0
      };
    }
    /* quand l’objectif ou le Suivi grandissent ou rétrécissent, la carte suit : le milieu de la
     * bande libre reste sur le même endroit (pas de grand vide noir quand on replie l’objectif) */
    function keepBand() {
      const f = freeBand();
      if (V.band && !V.ptrs.size) {
        const d = (f.top - V.band.top) - (f.bot - V.band.bot);
        if (Math.abs(d) > 2) { V.cam.y -= d / 2 / V.cam.z; clampCam(); }
      }
      V.band = f;
    }
    /* centre la vue sur (x, y) dans cette bande ; avec un cadre { w, h }, zoome pour qu’il tienne */
    function lookAt(x, y, box) {
      const f = freeBand();
      if (box) V.cam.z = clampZ(Math.min(V.w / box.w, (V.h - f.top - f.bot) / box.h));
      V.cam.x = x;
      V.cam.y = y - (f.top - f.bot) / 2 / V.cam.z;
    }
    /* au tout début, on montre la Lisière, où tout commence ; ensuite, la Réserve */
    function initCam() {
      V.camSet = true;
      const g = zonesOnMap().find((z) => z.id === "lisiere");
      if (g && !Object.values(S().fab.c).some((e) => e.k === "ext")) lookAt((g.x0 + g.x1) / 2, (g.box.y0 + g.box.y1) / 2, { w: 10, h: g.box.y1 - g.box.y0 + 2 });
      else { V.cam.z = clampZ(V.w / 10); lookAt(0, -1); }
    }

    /* ------------------------------------------------------------ coordonnées */
    const sx = (x) => V.w / 2 + (x - V.cam.x) * V.cam.z;
    const sy = (y) => V.h / 2 + (y - V.cam.y) * V.cam.z;
    function cellAt(px, py) {
      return { x: Math.round((px - V.w / 2) / V.cam.z + V.cam.x), y: Math.round((py - V.h / 2) / V.cam.z + V.cam.y) };
    }
    function local(ev) {
      const r = V.cv.getBoundingClientRect();
      return { x: ev.clientX - r.left, y: ev.clientY - r.top };
    }

    /* ------------------------------------------------------------ outils */
    function setTool(t) {
      const was = V.tool;
      V.tool = t;
      if (t !== "voir") { V.zsel = null; select(null); }
      if (t !== was && V.cv && V.ready) {
        if (t === "ext") { const d = extSpot(); if (d) reveal(d.x, d.y); }
        else if (t === "mach" || t === "port") reveal(0, 0);
      }
      if (!V.el) return;
      V.el.querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("on", b.dataset.tool === t));
    }
    function remember() {
      V.undo.push(E.fabSnapshot());
      if (V.undo.length > 30) V.undo.shift();
      updUndo();
    }
    function updUndo() { const b = V.el && V.el.querySelector("#uUndo"); if (b) b.disabled = !V.undo.length; }
    function undo() {
      const s = V.undo.pop();
      if (s) { E.fabRestore(s); A.click(); select(null); }
      updUndo();
    }

    const WHY = {
      out: "C’est hors du terrain. Il s’agrandit avec chaque nouvelle terre.",
      res: "C’est la Réserve.",
      taken: "La case est déjà prise.",
      port: "Une sortie se pose contre la Réserve (cases en pointillés).",
      nomach: "Plus de machine libre de ce type. Fabriques-en une autre au Carnet.",
      kind: "Impossible ici.",
      nodep: "Un extracteur se pose sur une case de gisement : les cases colorées, regroupées par terre.",
      wrongext: "Cet extracteur ne sait pas récolter ça.",
      noext: "Plus d’extracteur libre de ce type.",
      siteone: "Ce Grand Œuvre a déjà son chantier. Retire-le d’abord pour le poser ailleurs."
    };
    const zoneName = (z) => (E.ZONES[z] ? E.ZONES[z].n : z);
    /* récolte à la main sur une case de gisement, avec un petit chiffre qui monte */
    function harvest(c) {
      const d = E.deposit(c.x, c.y);
      if (!d) return false;
      if (!d.hand) { toast(esc(I[d.res].n) + " : ça ne se ramasse pas à la main. Il faut un extracteur (outil ⛏️)."); return true; }
      const n = E.tapDeposit(c.x, c.y);
      if (!n) return true;
      const r = V.cv.getBoundingClientRect();
      if (floater) floater("+" + fmt(n) + " " + I[d.res].n, r.left + sx(c.x) + (Math.random() - 0.5) * 16, r.top + sy(c.y) - V.cam.z * 0.4);
      V.pulse["d" + c.x + "," + c.y] = V.t;
      A.tap(d.res);
      vibe(5);
      return true;
    }
    /* le gisement le plus proche où poser un extracteur libre */
    function extSpot() {
      let best = null, bd = 1e9;
      for (const d of E.deposits()) {
        if (!freeExt(d.res).length) continue;
        const e = E.fabCell(d.x, d.y);
        if (e && e.k !== "ext") continue;
        const dd = Math.hypot(d.x - V.cam.x, d.y - V.cam.y);
        if (dd < bd) { bd = dd; best = d; }
      }
      return best;
    }
    function freeExt(res) {
      const us = E.extUnits();
      return E.extFor(res).filter((t) => us[t].own - us[t].used > 0);
    }
    function placeExt(c) {
      const d = E.deposit(c.x, c.y);
      if (!d) { toast(WHY.nodep); return; }
      const e = E.fabCell(c.x, c.y);
      if (e && e.k !== "ext") { toast(WHY.taken); return; }
      const types = freeExt(d.res);
      if (!types.length) {
        const can = E.extFor(d.res).filter((t) => S().known[t]);
        if (can.length) { V.extAt = c; openWheel({ only: can, title: "Pour récolter : " + I[d.res].n }); }
        else toast("Aucun de tes extracteurs ne récolte « " + esc(I[d.res].n) + " » pour l’instant.");
        return;
      }
      const put = (t) => {
        remember();
        const r = E.fabPlaceExt(c.x, c.y, t, 1);
        if (!r.ok) { V.undo.pop(); updUndo(); toast(WHY[r.why] || WHY.kind); return; }
        if (r.fresh) E.fabSet(r.e.id, { d: guessDir(c.x, c.y) });
        // usine simple : le tapis jusqu’à la Réserve se pose tout seul
        if (r.fresh && E.easy() && E.fabLink(c.x, c.y).n) toast("🛤️ Relié à la Réserve : la récolte part toute seule.");
        A.place ? A.place() : A.click();
        vibe(12);
        setTool("voir");
        select(c);
      };
      const t = V.etype && types.includes(V.etype) ? V.etype : types.length === 1 ? types[0] : null;
      if (t) put(t);
      else openModal({
        html: "<h2>Quel extracteur ?</h2><p class=\"small muted\">Sur la case « " + esc(I[d.res].n) + " ».</p>" + '<div class="picklist">' + types.map((x) => {
          const us = E.extUnits()[x];
          return '<button class="pick" data-m="pick" data-id="' + x + '">' + icon(x, "sm") + '<span class="grow">' + esc(I[x].n) + '</span><span class="tiny muted">' +
            fmtNum(E.extRate(x, d.res)) + "/s · " + (us.own - us.used) + " libre" + (us.own - us.used > 1 ? "s" : "") + "</span></button>";
        }).join("") + '</div><div class="acts"><button class="btn" data-m="close">Annuler</button></div>',
        on: { pick: (b) => { V.etype = b.dataset.id; put(b.dataset.id); } }
      });
    }
    function freeTypes() {
      const ms = E.machines();
      return E.MACHINES.filter((m) => ms[m].own - ms[m].used > 0);
    }
    /* direction par défaut d’une machine : vers un tapis voisin qui ne vient pas vers elle */
    function guessDir(x, y) {
      for (let d = 0; d < 4; d++) {
        const n = E.fabCell(x + DX[d], y + DY[d]);
        if (n && n.k === "belt" && n.d !== (d + 2) % 4) return d;
      }
      for (let d = 0; d < 4; d++) if (E.fabCell(x + DX[d], y + DY[d]) && E.fabCell(x + DX[d], y + DY[d]).k === "res") return d;
      return 0;
    }
    function act(c) {
      const e = E.fabCell(c.x, c.y);
      if (V.tool === "voir") {
        const m = markAt(c.x, c.y);
        if (m) { selectZone({ z: m.z, i: m.i }); return; }
        if (!e && harvest(c)) return;
        if (!e) { const g = labelAt(c.x, c.y); if (g) { selectZone({ z: g.id }); return; } }
        select(e && e.k !== undefined ? c : null);
        return;
      }
      if (V.tool === "ext") { placeExt(c); return; }
      if (V.tool === "turn") {
        if (e && e.d !== undefined) { remember(); E.fabRotate(c.x, c.y); A.click(); vibe(8); }
        return;
      }
      if (V.tool === "del") { demolish(c); return; }
      if (V.tool === "tapis") return; // géré par le tracé
      if (V.tool === "site") {
        const why = E.fabWhy("site", c.x, c.y, { p: V.spid });
        if (why) { toast(WHY[why] || WHY.kind); return; }
        remember();
        E.fabPlace("site", c.x, c.y, { p: V.spid });
        A.place ? A.place() : A.click();
        vibe(15);
        setTool("voir");
        select(c);
        return;
      }
      if (e) { if (e.k !== "res") { setTool("voir"); select(c); } return; }
      if (V.tool === "port" || V.tool === "split" || V.tool === "cross") {
        const why = E.fabWhy(V.tool, c.x, c.y);
        if (why) { toast(WHY[why] || WHY.kind); A.err && A.err(); return; }
        remember();
        E.fabPlace(V.tool, c.x, c.y);
        A.place ? A.place() : A.click();
        vibe(10);
        return;
      }
      if (V.tool === "mach") {
        const types = freeTypes();
        if (!types.length) {
          if (E.MACHINES.some((m) => S().known[m])) openWheel({ cat: "mach", title: "Fabriquer une machine" });
          else toast("Il te faut d’abord une machine : un Automate de bois, par exemple.");
          return;
        }
        const put = (m) => {
          const why = E.fabWhy("mach", c.x, c.y, { m });
          if (why) { toast(WHY[why] || WHY.kind); return; }
          remember();
          const r = E.fabPlace("mach", c.x, c.y, { m, d: guessDir(c.x, c.y) });
          A.place ? A.place() : A.craft("usiner");
          vibe(15);
          setTool("voir");
          select(c);
          if (V.preset && E.automatable(V.preset)) { E.fabSet(r.e.id, { r: V.preset }); sheet(); } else pickRecipe(r.e.id);
          V.preset = null;
        };
        const m = V.mtype && types.includes(V.mtype) ? V.mtype : types.length === 1 ? types[0] : null;
        if (m) put(m);
        else pickType(types, put);
      }
    }
    function demolish(c) {
      const e = E.fabCell(c.x, c.y);
      if (!e || e.k === "res") return false;
      remember();
      E.fabRemove(c.x, c.y);
      if (V.sel && V.sel.x === c.x && V.sel.y === c.y) select(null);
      A.remove ? A.remove() : A.click();
      vibe(8);
      return true;
    }

    /* ------------------------------------------------------------ gestes tactiles */
    function onDown(ev) {
      ev.preventDefault();
      V.cv.setPointerCapture(ev.pointerId);
      const p = local(ev);
      V.ptrs.set(ev.pointerId, p);
      if (V.ptrs.size === 2) {
        V.draw = null;
        const [a, b] = [...V.ptrs.values()];
        V.gest = { pinch: true, d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: V.cam.z, m0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, cam0: { x: V.cam.x, y: V.cam.y } };
        return;
      }
      if (V.ptrs.size > 2) return;
      const c = cellAt(p.x, p.y);
      V.gest = { id: ev.pointerId, p0: p, t0: performance.now(), moved: false, cam0: { x: V.cam.x, y: V.cam.y }, c0: c, done: {} };
      if (V.tool === "tapis") V.draw = { path: [{ x: c.x, y: c.y, d: null }] };
      if (V.tool === "del") { if (demolish(c)) V.gest.done[c.x + "," + c.y] = 1; }
      // garder le doigt sur un gisement : on continue de récolter
      const dep = V.tool === "voir" && !E.fabCell(c.x, c.y) && E.deposit(c.x, c.y);
      if (dep && dep.hand) {
        const g = V.gest;
        g.hold = setTimeout(function rep() { if (V.gest !== g || g.moved) return; g.held = true; harvest(c); g.hold = setTimeout(rep, 140); }, 400);
      }
    }
    function onMove(ev) {
      if (!V.ptrs.has(ev.pointerId)) return;
      const p = local(ev);
      V.ptrs.set(ev.pointerId, p);
      const g = V.gest;
      if (!g) return;
      if (g.pinch) {
        if (V.ptrs.size < 2) return;
        const [a, b] = [...V.ptrs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y) || 1, m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const z = clampZ(g.z0 * d / g.d0);
        // le point sous les doigts reste sous les doigts
        const wx = (g.m0.x - V.w / 2) / g.z0 + g.cam0.x, wy = (g.m0.y - V.h / 2) / g.z0 + g.cam0.y;
        V.cam.z = z;
        V.cam.x = wx - (m.x - V.w / 2) / z;
        V.cam.y = wy - (m.y - V.h / 2) / z;
        clampCam();
        return;
      }
      if (ev.pointerId !== g.id) return;
      const dist = Math.hypot(p.x - g.p0.x, p.y - g.p0.y);
      if (dist > 8) g.moved = true;
      if (V.tool === "tapis" && V.draw) { extendDraw(cellAt(p.x, p.y)); return; }
      if (V.tool === "del") {
        const c = cellAt(p.x, p.y), k = c.x + "," + c.y;
        if (!g.done[k] && demolish(c)) g.done[k] = 1;
        return;
      }
      if (g.moved) {
        V.cam.x = g.cam0.x - (p.x - g.p0.x) / V.cam.z;
        V.cam.y = g.cam0.y - (p.y - g.p0.y) / V.cam.z;
        clampCam();
      }
    }
    function onUp(ev) {
      if (!V.ptrs.has(ev.pointerId)) return;
      const p = local(ev);
      V.ptrs.delete(ev.pointerId);
      const g = V.gest;
      if (!g) return;
      if (g.pinch) { if (!V.ptrs.size) V.gest = null; return; }
      if (ev.pointerId !== g.id) return;
      V.gest = null;
      clearTimeout(g.hold);
      if (g.held) return;
      if (V.tool === "tapis" && V.draw) { commitDraw(); return; }
      if (V.tool === "del") return;
      if (!g.moved && performance.now() - g.t0 < 600) act(cellAt(p.x, p.y));
    }
    function onCancel(ev) {
      V.ptrs.delete(ev.pointerId);
      if (V.gest) clearTimeout(V.gest.hold);
      if (!V.ptrs.size) { V.gest = null; V.draw = null; }
    }
    function onWheel(ev) {
      ev.preventDefault();
      const p = local(ev);
      const wx = (p.x - V.w / 2) / V.cam.z + V.cam.x, wy = (p.y - V.h / 2) / V.cam.z + V.cam.y;
      V.cam.z = clampZ(V.cam.z * (ev.deltaY < 0 ? 1.12 : 1 / 1.12));
      V.cam.x = wx - (p.x - V.w / 2) / V.cam.z;
      V.cam.y = wy - (p.y - V.h / 2) / V.cam.z;
      clampCam();
    }
    function clampCam() {
      const R = E.fabR() + 2;
      V.cam.x = Math.max(-R, Math.min(R, V.cam.x));
      V.cam.y = Math.max(-R, Math.min(R, V.cam.y));
    }
    function zoom(f) { V.cam.z = clampZ(V.cam.z * f); }

    /* tracé d’un tapis : chaque case prend la direction du pas suivant */
    function extendDraw(c) {
      const path = V.draw.path;
      let last = path[path.length - 1];
      if (c.x === last.x && c.y === last.y) return;
      // retour en arrière : on efface la fin du tracé
      const back = path.findIndex((q) => q.x === c.x && q.y === c.y);
      if (back >= 0) { path.length = back + 1; path[back].d = null; return; }
      let guard = 0;
      while ((last.x !== c.x || last.y !== c.y) && guard++ < 60) {
        const dx = c.x - last.x, dy = c.y - last.y;
        const d = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 0 : 2) : (dy > 0 ? 1 : 3);
        last.d = d;
        const n = { x: last.x + DX[d], y: last.y + DY[d], d: null };
        if (path.some((q) => q.x === n.x && q.y === n.y)) break;
        path.push(n);
        last = n;
        if (A.tick) A.tick();
      }
    }
    function commitDraw() {
      const path = V.draw.path;
      V.draw = null;
      if (path.length === 1) {
        const c = path[0], e = E.fabCell(c.x, c.y);
        if (e && e.k === "belt") { remember(); E.fabRotate(c.x, c.y); A.click(); return; }
        if (e) { if (e.k !== "res") { setTool("voir"); select(c); } return; }
        const why = E.fabWhy("belt", c.x, c.y);
        if (why) { toast(WHY[why] || WHY.kind); return; }
        remember();
        E.fabDraw([{ x: c.x, y: c.y, d: 0 }]);
        A.click();
        return;
      }
      const lastD = path[path.length - 2].d;
      path[path.length - 1].d = lastD;
      const cells = path.filter((q) => { const e = E.fabCell(q.x, q.y); return !e || e.k === "belt"; });
      if (!cells.length) return;
      remember();
      const n = E.fabDraw(cells);
      if (n) { A.place ? A.place() : A.click(); vibe(10); faceBelts(cells); } else { V.undo.pop(); updUndo(); }
    }

    /* une machine dont la sortie ne mène nulle part se tourne vers le tapis qu’on
     * vient de tracer contre elle */
    function faceBelts(cells) {
      for (const q of cells) for (let d = 0; d < 4; d++) {
        const mx = q.x - DX[d], my = q.y - DY[d], m = E.fabCell(mx, my);
        if (!m || m.k !== "mach" || m.d === d || q.d === (d + 2) % 4) continue;
        if (E.fabCell(mx + DX[m.d], my + DY[m.d])) continue;
        E.fabSet(m.id, { d });
      }
    }

    /* ------------------------------------------------------------ boutons */
    function onClick(ev) {
      const t = ev.target;
      let b;
      if ((b = t.closest("[data-tool]"))) {
        const tool = b.dataset.tool;
        if (tool === "mach") { const ty = freeTypes(); if (ty.length > 1 && !V.mtype) V.mtype = null; }
        setTool(V.tool === tool && tool !== "voir" ? "voir" : tool);
        A.click();
        return;
      }
      if ((b = t.closest("[data-mt]"))) { V.mtype = b.dataset.mt; setTool("mach"); A.click(); refresh(); return; }
      if ((b = t.closest("[data-et]"))) { V.etype = b.dataset.et; setTool("ext"); A.click(); refresh(); return; }
      if (!(b = t.closest("[data-u]"))) return;
      if (b.dataset.u === "tip") { S().flags[b.dataset.f] = true; A.click(); refresh(); return; }
      if (b.dataset.u === "roue") { openWheel({}); return; }
      const u = b.dataset.u, sel = V.sel, e = sel && E.fabCell(sel.x, sel.y);
      if (u === "zin") zoom(1.25);
      else if (u === "zout") zoom(0.8);
      else if (u === "center") lookAt(0, 0);
      else if (u === "link" && e) {
        remember();
        const r = E.fabLink(sel.x, sel.y);
        if (r.ok) { A.place ? A.place() : A.click(); toast(r.n ? "🛤️ " + r.n + " tapis posé" + (r.n > 1 ? "s" : "") + " jusqu’à la Réserve." : "🛤️ C’est relié."); }
        else { V.undo.pop(); updUndo(); toast("Pas de chemin libre jusqu’à la Réserve. Trace le tapis toi-même, ou fais de la place."); }
      } else if (u === "eu" && e) {
        const t2 = b.dataset.t, before = e.u[t2] || 0;
        remember();
        E.fabSetExt(e.id, t2, before + Number(b.dataset.v));
        if ((e.u[t2] || 0) === before && Number(b.dataset.v) > 0) toast("Plus de « " + esc(I[t2].n) + " » libre. Fabriques-en un autre au Carnet.");
        A.click();
      }
      else if (u === "undo") undo();
      else if (u === "help") help();
      else if (u === "close") { V.zsel = null; select(null); }
      else if (u === "exp") {
        const r = E.startExp(b.dataset.z);
        if (r.ok) { A.explore ? A.explore() : A.click(); toast("🧭 C’est parti. L’exploration avance toute seule."); }
        else if (r.why === "busy") toast("Une exploration est déjà en cours : une à la fois.", { key: "nope" });
        else if (r.why === "cost") {
          const x = E.ZONES[b.dataset.z].exps[E.nextExp(b.dataset.z).i], st = S();
          toast("Il te manque " + Object.keys(x.cost).filter((i) => (st.inv[i] || 0) < x.cost[i]).map((i) => esc(I[i].n)).join(", ") + " pour partir.", { key: "nope" });
        }
      } else if (u === "zone") selectZone({ z: b.dataset.z });
      else if (u === "rot" && e) { remember(); E.fabRotate(sel.x, sel.y); A.click(); }
      else if (u === "rm" && e) { demolish(sel); }
      else if (u === "on" && e) { E.fabSet(e.id, { on: !e.on }); A.click(); }
      else if (u === "n" && e) {
        const before = e.n;
        E.fabSet(e.id, { n: e.n + Number(b.dataset.v) });
        if (e.n === before && Number(b.dataset.v) > 0) toast("Plus de machine libre de ce type.");
        A.click();
      } else if (u === "recipe" && e) pickRecipe(e.id);
      else if (u === "filter" && e) pickFilter(sel);
      else if (u === "goto") goto(b.dataset.id);
      sheet();
    }
    function onChange(ev) {
      const t = ev.target, sel = V.sel, e = sel && E.fabCell(sel.x, sel.y);
      if (!e || e.k !== "mach") return;
      if (t.dataset.u === "type") E.fabSet(e.id, { m: t.value });
      if (t.dataset.u === "cap") E.fabSet(e.id, { cap: Number(t.value) });
      A.click();
      sheet();
    }

    /* ------------------------------------------------------------ fenêtres */
    function pickType(types, cb) {
      openModal({
        html: "<h2>Quelle machine ?</h2>" + '<div class="picklist">' + types.map((m) => '<button class="pick" data-m="pick" data-id="' + m + '">' + icon(m, "sm") +
          '<span class="grow">' + esc(I[m].n) + '</span><span class="tiny muted">' + I[m].spd + "/min</span></button>").join("") + "</div>" +
          '<div class="acts"><button class="btn" data-m="close">Annuler</button></div>',
        on: { pick: (b) => { V.mtype = b.dataset.id; cb(b.dataset.id); } }
      });
    }
    function listPicker(title, sub, ids, extra, cb) {
      openModal({
        html: "<h2>" + esc(title) + "</h2>" + (sub ? '<p class="small muted">' + sub + "</p>" : "") +
          '<div class="search"><input id="upq" type="search" placeholder="Chercher…" autocomplete="off"></div>' +
          '<div class="picklist">' + (extra || "") + ids.map((id) => '<button class="pick" data-m="pick" data-id="' + id + '" data-n="' + esc(norm(I[id].n)) + '">' + icon(id, "sm") +
            '<span class="grow">' + esc(I[id].n) + '</span><span class="tiny muted">' + esc(D.AGES[I[id].a].n.replace("Âge ", "")) + "</span></button>").join("") + "</div>" +
          '<div class="acts"><button class="btn" data-m="close">Annuler</button></div>',
        onOpen: (box) => {
          const inp = box.querySelector("#upq");
          inp.addEventListener("input", () => {
            const q = norm(inp.value);
            box.querySelectorAll(".pick[data-n]").forEach((b) => b.classList.toggle("hidden", !!q && !b.dataset.n.includes(q)));
          });
        },
        on: { pick: (b) => cb(b.dataset.id || null) }
      });
    }
    function pickRecipe(mid) {
      const ids = Object.keys(S().known).filter(E.automatable).sort((a, b) => I[b].a - I[a].a || I[a].n.localeCompare(I[b].n));
      listPicker("Que doit-elle fabriquer ?", "Les recettes que tu connais et qui se répètent.", ids, "", (id) => {
        remember();
        E.fabSet(mid, { r: id });
        A.craft ? A.craft("usiner") : A.click();
        sheet();
      });
    }
    function pickFilter(c) {
      const ids = Object.keys(S().seen).filter((id) => I[id] && !E.isUnique(I[id]) && !E.isScaled(I[id])).sort((a, b) => I[a].a - I[b].a || I[a].n.localeCompare(I[b].n));
      listPicker("Que doit-elle envoyer ?", "Par défaut, une sortie envoie tout ce que les machines lui réclament.", ids,
        '<button class="pick" data-m="pick" data-id=""><span class="ic sm">✳️</span><span class="grow">Tout ce qu’on lui demande</span></button>', (id) => {
          remember();
          E.fabSetPort(c.x, c.y, id);
          A.click();
          sheet();
        });
    }
    function help() {
      openModal({
        html: '<div class="kicker">L’Usine</div><h2>Comment ça marche</h2><div class="lore usine-help">' +
          "<p>Au centre, la <b>Réserve</b> : c’est ton stock.</p>" +
          "<p>Autour, chaque terre que tu as atteinte a ses <b>gisements</b> : une case par ressource. Touche une case pour récolter à la main, garde le doigt appuyé pour continuer.</p>" +
          (E.easy()
            ? "<p>Avec l’outil ⛏️, pose un <b>extracteur</b> sur la case qui lui convient (une cabane sur le bois, plus tard des mines et des pompes…). Il récolte seul, et un tapis se pose tout seul jusqu’à la Réserve.</p>" +
              "<p>Avec l’outil ⚙️, pose une <b>machine</b> n’importe où et choisis sa recette : elle se sert dans la Réserve et y range ce qu’elle fabrique (le pointillé). Si un tapis la touche, elle se sert d’abord dessus.</p>" +
              "<p>Tu aimes les casse-têtes ? Menu ☰ → <b>Usine avancée</b> : sorties de la Réserve, débit des tapis, répartiteurs et croisements.</p>"
            : "<p>Avec l’outil ⛏️, pose un <b>extracteur</b> sur la case qui lui convient (une cabane sur le bois, plus tard des mines et des pompes…). Il récolte seul, puis pose sa récolte sur la case que montre sa flèche. Trace un tapis de là jusqu’à la Réserve, ou touche-le et choisis 🛤️ <b>Relier à la Réserve</b>.</p>" +
              "<p>Une <b>machine</b> se sert sur les tapis qui la touchent, et pose ce qu’elle fabrique devant sa flèche. Fais passer le tapis d’un extracteur devant une machine : elle prend ce qu’il lui faut, le reste continue jusqu’à la Réserve.</p>" +
              "<p>Une <b>sortie</b>, posée contre la Réserve, envoie aux machines ce qu’elles réclament dans le stock. Le <b>répartiteur</b> envoie ce qu’il reçoit de tous les côtés. Le <b>croisement</b> laisse passer deux tapis l’un sur l’autre.</p>") +
          "<p>Pour tracer un tapis, garde le doigt appuyé et glisse. Deux doigts pour te déplacer et zoomer. ↶ annule la dernière modification.</p>" +
          "<p>Tout tourne aussi quand le jeu est fermé.</p></div>" +
          '<div class="acts"><button class="btn pri" data-m="close">Compris</button></div>'
      });
    }

    /* ------------------------------------------------------------ panneau d’une case */
    function selectZone(zs) {
      V.sel = null;
      V.zsel = zs;
      A.click();
      sheet();
    }
    function select(c) {
      V.sel = c;
      if (c) V.zsel = null;
      sheet();
      // garder la case visible au-dessus du panneau
      const box = c && V.el && V.el.querySelector("#uSheet");
      if (box && !box.classList.contains("hidden")) {
        const limit = V.h - box.offsetHeight - 12 - V.cam.z * 0.6;
        const y = E.isRes(c.x, c.y) ? 0 : c.y;
        if (sy(y) > limit) V.cam.y += (sy(y) - limit) / V.cam.z;
      }
    }
    const STATUS = {
      ok: "En marche", wait: "Démarrage…", off: "En pause", norec: "Aucune recette choisie", idle: "Aucune machine",
      starved: "Il lui manque des matières", noout: "Sa production ne va nulle part", jam: "Ralentie : ce qu’elle pose ne part pas assez vite", cap: "Stock visé atteint", blocked: "Il manque une station"
    };
    const LEVEL = { ok: "good", wait: "good", off: "dim", norec: "warn", idle: "warn", starved: "warn", cap: "dim", noout: "bad", jam: "warn", blocked: "bad" };
    /* ce qui bouche la sortie d’une machine ou d’un extracteur */
    const toRes = (e) => { const P = E.fabGraph().prods[e.id]; return !!(P && P.t.res); };
    const JAM_RES = () => "Le tapis qui entre dans la Réserve est plein : un tapis porte au plus " + fmtNum(E.beltCap()) + " objets/s à cet âge. Fais entrer un autre tapis dans la Réserve (un 🔀 répartiteur sur le chemin, par exemple), ou relie autrement ce qui partage ce tapis.";
    const JAM_MACH = "Les machines de son tapis ne prennent pas tout. Fais aller ce tapis jusqu’à la Réserve.";
    function machStatus(e) {
      const info = E.machInfo(e.id);
      const it = I[e.r];
      let s = STATUS[info.s] || "", more = "";
      if ((info.s === "ok" || info.s === "wait") && it) s += " · " + fmtNum(E.machRate(e) * 60 * it.r[2]) + " " + esc(it.n.toLowerCase()) + "/min";
      if (info.s === "starved" && info.miss) {
        more = Object.keys(info.miss).map((k) => '<span class="link-txt" data-u="goto" data-id="' + k + '">' + esc(I[k].n) + "</span> " +
          (info.miss[k] === "link" ? "(aucun tapis n’en apporte)" : info.miss[k] === "slow" ? "(la Réserve ne le laisse pas sortir assez vite)" : "(le stock est vide)")).join(", ");
        if (Object.values(info.miss).includes("slow")) more += ". La Réserve ne laisse sortir que " + fmtNum(E.resOutCap()) + " objets/s en tout, toutes sorties confondues. Pour aller plus vite, amène ses matières par tapis, depuis les gisements ou d’autres machines.";
      }
      if (info.s === "noout") more = "La flèche montre où elle pose ce qu’elle fabrique. Mets là un tapis qui rejoint la Réserve, ou une autre machine.";
      if (info.s === "jam") more = toRes(e) ? JAM_RES() : JAM_MACH;
      if (info.s === "cap") s += " (" + fmt(e.cap) + ")";
      if (info.s === "blocked" && info.b) s = info.b.why === "heat" ? "Il faut " + fmtHeat(info.b.heat) + " pour cette recette" : "Il te manque la station pour ce geste";
      return { s, more, lvl: LEVEL[info.s] || "dim" };
    }
    function extStatus(e) {
      const info = E.machInfo(e.id), rate = E.extOut(e);
      const T = {
        ok: ["Récolte " + fmtNum(rate) + " " + esc(I[e.res].n.toLowerCase()) + "/s", "good", ""],
        wait: ["Démarrage…", "good", ""],
        off: ["En pause", "dim", ""],
        idle: ["Aucun extracteur posé ici", "warn", "Ajoute un extracteur avec + ci-dessous."],
        noout: ["Ce qu’il récolte ne va nulle part", "bad", "La flèche montre où il pose sa récolte. Relie-le à la Réserve, ou trace un tapis vers une machine."],
        sat: ["Récolte " + fmtNum(E.beltCap()) + " " + esc(I[e.res].n.toLowerCase()) + "/s sur " + fmtNum(rate) + " : le tapis ne suit pas", "warn",
          "Un tapis porte au plus " + fmtNum(E.beltCap()) + " objets/s à cet âge. Les extracteurs en trop ici ne servent à rien pour l’instant : ils travailleraient mieux sur un autre gisement. Les tapis vont plus vite aux âges suivants."],
        jam: ["Ralenti : sa récolte ne part pas assez vite", "warn", toRes(e) ? JAM_RES() : JAM_MACH]
      }[info.s] || ["", "dim", ""];
      return { s: T[0], lvl: T[1], more: T[2], code: info.s };
    }
    /* ce qui sort de là ne va ni à la Réserve ni à une machine */
    function needsLink(e) {
      if (!e || !e.id || (e.k !== "ext" && e.k !== "mach") || E.easy()) return false;
      const P = E.fabGraph().prods[e.id];
      return !!P && !P.t.res && !Object.keys(P.t.cons).length;
    }
    function sheet() {
      const box = V.el && V.el.querySelector("#uSheet");
      if (!box) return;
      if (V.zsel) { box.classList.remove("hidden"); box.innerHTML = zoneSheet(V.zsel); box.dataset.zs = V.zsel.i !== undefined ? markState(V.zsel.z, V.zsel.i) : ""; return; }
      const c = V.sel, e = c && E.fabCell(c.x, c.y);
      if (!e) { box.classList.add("hidden"); box.innerHTML = ""; V.sel = null; return; }
      box.classList.remove("hidden");
      const loose = needsLink(e);
      box.dataset.loose = loose ? "1" : "";
      let h = '<button class="u-x" data-u="close" aria-label="Fermer">✕</button>';
      if (e.k === "res") {
        const f = E.flows();
        const ins = Object.keys(f.prod).filter((k) => f.prod[k] - (f.cons[k] || 0) > 1e-4).sort((a, b) => f.prod[b] - f.prod[a]).slice(0, 8);
        h += "<b>La Réserve</b><p class=\"small muted\">" + (E.easy() ? "Ton stock. Tes machines y prennent ce qu’il leur faut et y rangent ce qu’elles font ; tes extracteurs la remplissent."
          : "Ton stock. Les sorties posées contre elle l’envoient aux machines, et les tapis qui y entrent le remplissent.") + "</p>" +
          (ins.length ? '<div class="u-ins">' + ins.map((k) => '<span class="u-in">' + icon(k, "sm") + "<i>+" + fmtNum((f.prod[k] - (f.cons[k] || 0)) * 60) + "/min</i></span>").join("") + "</div>" : "");
      } else if (e.k === "mach") {
        const it = I[e.r], ms = E.machines(), st = machStatus(e);
        const types = E.MACHINES.filter((m) => ms[m].own > 0 || m === e.m);
        h += '<div class="u-head">' + icon(e.m) + '<div class="grow"><b>' + esc(I[e.m].n) + "</b>" + (e.n > 1 ? " ×" + e.n : "") +
          '<div class="u-st ' + st.lvl + '">' + st.s + "</div></div></div>" +
          (st.more ? '<p class="small u-more">' + st.more + "</p>" : "") +
          '<button class="u-recipe" data-u="recipe">' + (it ? icon(e.r) + '<span class="grow">' + esc(it.n) + "</span>" : '<span class="grow">Choisir une recette</span>') + "<span>▾</span></button>";
        if (it) {
          const ing = it.r[1], g = E.fabGraph(), sup = g.sup[e.id] || [];
          h += '<div class="u-ins">' + Object.keys(ing).map((k) => {
            const ok = E.easy() || sup.some((p) => { const P = g.prods[p]; return P.e.k === "port" ? !P.e.f || P.e.f === k : P.e.k === "ext" ? P.e.res === k : P.e.r === k; });
            return '<span class="u-in ' + (ok ? "" : "no") + '" data-u="goto" data-id="' + k + '">' + icon(k, "sm") + "<i>" + fmt(ing[k]) + "</i></span>";
          }).join("") + '<span class="u-arrow">→</span><span class="u-in">' + icon(e.r, "sm") + "<i>" + fmt(it.r[2]) + "</i></span></div>";
        }
        h += '<div class="u-row"><span class="tiny muted">Machines</span><button class="mini" data-u="n" data-v="-1">−</button><b>' + e.n + '</b><button class="mini" data-u="n" data-v="1">+</button>' +
          (types.length > 1 ? '<select data-u="type" aria-label="Type de machine">' + types.map((m) => '<option value="' + m + '"' + (m === e.m ? " selected" : "") + ">" + esc(I[m].n) + " (" + (ms[m].own - ms[m].used + (m === e.m ? e.n : 0)) + ")</option>").join("") + "</select>" : "") +
          '<span class="tiny muted">Stock visé</span><select data-u="cap" aria-label="Stock visé">' + CAPS.map((v) => '<option value="' + v + '"' + (v === e.cap ? " selected" : "") + ">" + (v ? fmt(v) : "∞") + "</option>").join("") +
          (CAPS.includes(e.cap) ? "" : '<option value="' + e.cap + '" selected>' + fmt(e.cap) + "</option>") + "</select></div>" +
          '<div class="u-row acts">' + (loose ? '<button class="btn small pri" data-u="link">🛤️ Relier à la Réserve</button>' : "") +
          '<button class="btn small" data-u="on">' + (e.on ? "⏸ Pause" : "▶ Reprendre") + "</button>" + (E.easy() ? "" : '<button class="btn small" data-u="rot">🔄 Tourner</button>') + '<button class="btn small ghost" data-u="rm">🗑️ Retirer</button></div>' +
          (E.easy() ? '<p class="tiny muted">Elle prend ses matières dans la Réserve (ou sur les tapis qui la touchent) et y range ce qu’elle fait.</p>' : "");
      } else if (e.k === "ext") {
        const st = extStatus(e), d = E.deposit(c.x, c.y), us = E.extUnits();
        const types = E.extFor(e.res).filter((t) => us[t].own > 0 || e.u[t]);
        h += '<div class="u-head">' + icon(e.res) + '<div class="grow"><b>' + esc(I[e.res].n) + '</b> <span class="tiny muted">' + (d ? esc(zoneName(d.z)) : "") + "</span>" +
          '<div class="u-st ' + st.lvl + '">' + st.s + "</div></div></div>" + (st.more ? '<p class="small u-more">' + st.more + "</p>" : "") +
          (types.length ? '<div class="u-exts">' + types.map((t) => '<div class="u-row">' + icon(t, "sm") + '<span class="grow small">' + esc(I[t].n) + ' <span class="tiny muted">' + fmtNum(E.extRate(t, e.res)) + "/s chacun · " +
            (us[t].own - us[t].used) + " libre" + (us[t].own - us[t].used > 1 ? "s" : "") + '</span></span><button class="mini" data-u="eu" data-t="' + t + '" data-v="-1">−</button><b>' + (e.u[t] || 0) +
            '</b><button class="mini" data-u="eu" data-t="' + t + '" data-v="1">+</button></div>').join("") + "</div>"
            : '<p class="small muted">Aucun de tes extracteurs ne sait récolter ça. Regarde au Carnet ce qui pourrait.</p>') +
          '<div class="u-row acts">' + (loose ? '<button class="btn small pri" data-u="link">🛤️ Relier à la Réserve</button>' : "") +
          '<button class="btn small" data-u="on">' + (e.on ? "⏸ Pause" : "▶ Reprendre") + "</button>" + (E.easy() ? "" : '<button class="btn small" data-u="rot">🔄 Tourner</button>') + '<button class="btn small ghost" data-u="rm">🗑️ Retirer</button></div>';
      } else if (e.k === "port") {
        const g = E.fabGraph(), P = g.prods["P" + c.x + "," + c.y];
        const n = P ? Object.keys(P.t.cons).length : 0;
        h += '<div class="u-head"><span class="ic">📤</span><div class="grow"><b>Sortie</b><div class="u-st ' + (n ? "good" : "warn") + '">' +
          (n ? "Alimente " + n + " machine" + (n > 1 ? "s" : "") : "Son tapis ne touche aucune machine") + "</div></div></div>" +
          '<p class="tiny muted">La Réserve laisse sortir ' + fmtNum(E.resOutCap()) + " objets/s au plus, toutes sorties confondues. Ce qui vient directement des gisements et des machines n’a pas cette limite.</p>" +
          '<button class="u-recipe" data-u="filter">' + (e.f && I[e.f] ? icon(e.f) + '<span class="grow">N’envoie que : ' + esc(I[e.f].n) + "</span>" : '<span class="grow">Envoie tout ce qu’on lui demande</span>') + "<span>▾</span></button>" +
          '<div class="u-row acts"><button class="btn small" data-u="rot">🔄 Tourner</button><button class="btn small ghost" data-u="rm">🗑️ Retirer</button></div>';
      } else if (e.k === "site") {
        const P = D.PROJECTS[e.p], ps = E.projState(e.p), step = P.steps[ps.step], info = E.machInfo(e.id);
        const ST = { ok: ["Les matières arrivent", "good"], starved: ["Ses tapis n’apportent rien pour l’instant", "warn"], nolink: ["Aucun tapis ne l’atteint", "bad"],
          need: ["En attente : il faut d’abord atteindre " + (step && step.need && D.FRAGS[step.need] ? esc(D.FRAGS[step.need].n) : "un autre lieu"), "warn"],
          act: ["Cette étape se joue dans le Cosmos", "good"], done: ["Œuvre accomplie", "good"], wait: ["Démarrage…", "good"] }[info.s] || ["", "dim"];
        box.dataset.site = e.p + ":" + ps.step + ":" + info.s;
        h += '<div class="u-head"><span class="ic">' + P.ic + '</span><div class="grow"><b>Chantier : ' + esc(P.n) + "</b>" +
          (step ? '<div class="tiny muted">Étape ' + (ps.step + 1) + "/" + P.steps.length + " · " + esc(step.n) + "</div>" : "") +
          '<div class="u-st ' + ST[1] + '">' + ST[0] + "</div></div></div>";
        if (step && step.cost) {
          h += '<div class="u-ins">' + Object.keys(step.cost).map((k) => {
            const paid = ps.paid[k] || 0, miss = info.miss && info.miss[k];
            return '<span class="u-in' + (miss ? " no" : "") + '" data-u="goto" data-id="' + k + '">' + icon(k, "sm") + '<i data-sp="' + k + '">' + fmt(paid) + " / " + fmt(step.cost[k]) + (miss ? " · aucun tapis" : "") + "</i></span>";
          }).join("") + "</div>" +
            '<p class="tiny muted">Il se sert sur les tapis qui le touchent : une 📤 sortie de la Réserve, ou directement tes machines. Au plus ' + fmtNum(E.beltCap()) + " objets/s par matière.</p>";
        } else if (step && step.fire) h += '<p class="small">Tout est prêt. La décision se prend dans le Cosmos.</p>';
        else if (step && step.melody) h += '<p class="small">🎶 Il ne reste qu’à jouer <b>' + esc(D.MELODIES[step.melody].n) + "</b> sur la flûte (Journal).</p>";
        h += '<div class="u-row acts"><button class="btn small ghost" data-u="rm">🗑️ Retirer</button><span class="tiny muted">Ce qui est déjà livré reste acquis.</span></div>';
      } else {
        const name = { belt: "Tapis", split: "Répartiteur", cross: "Croisement" }[e.k];
        const txt = { belt: "Fait avancer ce qu’on pose dessus" + (E.easy() ? "" : ", " + fmtNum(E.beltCap()) + " objets/s au plus à cet âge") + ". Les machines qu’il touche se servent au passage.", split: "Renvoie ce qu’il reçoit de tous les côtés à la fois.", cross: "Deux tapis se croisent ici sans se mélanger." }[e.k];
        h += "<b>" + name + '</b><p class="small muted">' + txt + '</p><div class="u-row acts">' + (e.d !== undefined ? '<button class="btn small" data-u="rot">🔄 Tourner</button>' : "") + '<button class="btn small ghost" data-u="rm">🗑️ Retirer</button></div>';
      }
      box.innerHTML = h;
    }

    /* ------------------------------------------------------------ les terres sur la carte
     * Chaque terre ouverte est une région : ses gisements en ligne, et au-dessus ses
     * lieux à explorer, dans l’ordre. Positions calculées à partir des gisements. */
    let zoneMemo = { key: "", z: [] };
    function zonesOnMap() {
      const deps = E.deposits(), key = deps.length + "";
      if (zoneMemo.key === key) return zoneMemo.z;
      const by = {};
      deps.forEach((d) => {
        const g = by[d.z] || (by[d.z] = { id: d.z, x0: d.x, x1: d.x, y: d.y });
        g.x0 = Math.min(g.x0, d.x); g.x1 = Math.max(g.x1, d.x);
      });
      const list = Object.values(by).map((g) => {
        const exps = E.ZONES[g.id].exps || [], n = exps.length, cx = (g.x0 + g.x1) / 2;
        g.marks = exps.map((x, i) => ({ x: Math.round(cx - (n - 1) + 2 * i), y: g.y - 2, i, z: g.id }));
        const xs = [g.x0, g.x1].concat(g.marks.map((m) => m.x));
        g.box = { x0: Math.min.apply(null, xs) - 1.6, x1: Math.max.apply(null, xs) + 1.6, y0: g.y - (n ? 3.1 : 1.9), y1: g.y + 1.7 };
        return g;
      });
      zoneMemo = { key, z: list };
      return list;
    }
    function markAt(x, y) {
      for (const g of zonesOnMap()) for (const m of g.marks) if (m.x === x && m.y === y) return m;
      return null;
    }
    function labelAt(x, y) {
      for (const g of zonesOnMap()) if (y === g.y - 1 && x >= g.x0 - 1 && x <= g.x1 + 1) return g;
      return null;
    }
    /* état d’un lieu : fait, en cours, possible, bloqué ou à venir */
    function markState(z, i) {
      const st = S(), done = st.exp.done[z] || 0, act = st.exp.active;
      if (i < done) return "done";
      if (act && act.z === z && act.i === i) return "active";
      if (i > done) return "later";
      const n = E.nextExp(z);
      if (!n) return "later";
      if (n.locked) return "locked";
      return "next";
    }
    function zoneSheet(zs) {
      const st = S(), z = E.ZONES[zs.z];
      let h = '<button class="u-x" data-u="close" aria-label="Fermer">✕</button>';
      if (zs.i !== undefined) {
        const x = z.exps[zs.i], state = markState(zs.z, zs.i);
        const hidden = x.hidden && state !== "done" && state !== "active";
        h += '<div class="u-head"><span class="ic">' + ({ done: "✓", active: "⏳", next: "🧭", locked: "🔒", later: "❔" }[state]) + '</span><div class="grow"><b>' + (hidden || state === "later" ? "???" : esc(x.n)) +
          '</b> <span class="tiny muted">' + esc(z.n) + "</span>";
        if (state === "done") {
          const f = x.rw && x.rw.frag && D.FRAGS[x.rw.frag];
          h += '<div class="u-st good">Exploré' + (f ? " : « " + esc(f.n) + " »" : "") + "</div></div></div>";
        } else if (state === "active") {
          const p = E.expProgress();
          h += '<div class="u-st good">En route… ' + (p ? fmtTime(p.left) : "") + '</div></div></div><div class="bar" style="margin-top:8px"><i data-xp style="width:' + (p ? (p.p * 100).toFixed(1) : 0) + '%"></i></div>';
        } else if (state === "later") {
          h += '<div class="u-st dim">Un autre lieu à explorer d’abord.</div></div></div>';
        } else {
          const n = E.nextExp(zs.z);
          const lack = x.cost ? Object.keys(x.cost).filter((i) => (st.inv[i] || 0) < x.cost[i]) : [];
          const cost = x.cost ? Object.keys(x.cost).map((i) => x.cost[i] + " " + esc(I[i].n.toLowerCase())).join(", ") : "";
          const busy = !!st.exp.active;
          h += '<div class="u-st ' + (state === "next" && !lack.length ? "good" : "warn") + '">' + (state === "locked" ? (x.hidden ? esc(x.hidden) : "Il te faut : " + esc(I[n.x.need].n)) :
            fmtTime(x.dur / E.expMult()) + (lack.length ? "" : cost ? " · il faut " + cost : "")) + "</div></div></div>" +
            (lack.length && state === "next" ? '<p class="small u-lack">Il te manque : ' + lack.map((i) => '<span class="link-txt" data-u="goto" data-id="' + i + '">' + fmt(x.cost[i] - Math.floor(st.inv[i] || 0)) + " " + esc(I[i].n) + "</span>" +
              (!st.known[i] && I[i].h ? ' <span class="muted">« ' + esc(I[i].h) + " »</span>" : "")).join(", ") + "</p>" : "") +
            (state === "next" ? '<div class="u-row acts"><button class="btn small pri' + (busy || lack.length ? " nope" : "") + '" data-u="exp" data-z="' + zs.z + '">🧭 Explorer</button>' +
              (busy ? '<span class="tiny muted">Une exploration est déjà en cours.</span>' : "") + "</div>" : "");
        }
        return h;
      }
      // la fiche de la terre : son paysage, ses ressources, ses lieux
      h += '<div class="u-zone">' + (Scenes ? '<div class="u-scene">' + Scenes.backdrop(zs.z) + '<b class="zname">' + esc(z.n) + "</b></div>" : "<b>" + esc(z.n) + "</b>") +
        '<p class="small muted">' + esc(z.d) + "</p>";
      const deps = E.deposits().filter((d) => d.z === zs.z);
      h += '<div class="u-ins">' + deps.map((d) => { const r = E.rate(d.res); return '<span class="u-in" data-u="goto" data-id="' + d.res + '">' + icon(d.res, "sm") + "<i>" + fmt(st.inv[d.res] || 0) + (r ? " · +" + fmtNum(r) + "/s" : "") + "</i></span>"; }).join("") + "</div>";
      const done = st.exp.done[zs.z] || 0;
      if (z.exps && z.exps.length) {
        h += '<div class="tiny muted" style="margin-top:6px">Lieux explorés : ' + done + " / " + z.exps.length + "</div>";
        const n = E.nextExp(zs.z);
        if (n && !n.locked && !st.exp.active) h += '<div class="u-row acts"><button class="btn small pri" data-u="exp" data-z="' + zs.z + '">🧭 Explorer : ' + esc(n.x.hidden ? "???" : n.x.n) + "</button></div>";
      }
      return h + "</div>";
    }
    /* centrer la carte sur une terre (nouvelle terre, exploration en cours…) */
    function focusZone(zid) {
      const g = zonesOnMap().find((x) => x.id === zid);
      if (!g) return;
      lookAt((g.x0 + g.x1) / 2, (g.box.y0 + g.box.y1) / 2);
    }

    /* ------------------------------------------------------------ bandeau et conseils */
    function hint() {
      if (quiet && quiet()) return null; // le tutoriel parle déjà
      const st = S(), ents = Object.values(st.fab.c), ms = E.machines(), us = E.extUnits();
      const own = E.MACHINES.reduce((a, m) => a + ms[m].own, 0);
      const machs = ents.filter((e) => e.k === "mach"), exts = ents.filter((e) => e.k === "ext");
      const freeE = E.EXTS.reduce((a, t) => a + us[t].own - us[t].used, 0);
      if (!exts.length && !freeE && !own) {
        return st.stats.taps < 20 || st.known.cabane ? "Touche une case colorée de la Lisière pour récolter à la main. Garde le doigt appuyé pour continuer." : null;
      }
      if (!exts.length && freeE) return "Prends l’outil ⛏️ <b>Extracteur</b> et touche une case de gisement (le bois de la Lisière, par exemple) pour y poser ton extracteur.";
      if (exts.some((e) => E.machInfo(e.id).s === "noout")) return "Un extracteur n’a nulle part où poser sa récolte. Touche-le puis 🛤️ <b>Relier à la Réserve</b>, ou trace un tapis avec l’outil ➜.";
      if (!st.flags.extDone) return "Ça arrive. Regarde la récolte rouler jusqu’à la Réserve.";
      if (freeE && !st.flags.tip_freeExt) return "Tu as " + freeE + " extracteur" + (freeE > 1 ? "s" : "") + " qui attend" + (freeE > 1 ? "ent" : "") + " d’être posé" + (freeE > 1 ? "s" : "") + " (outil ⛏️).";
      if (!own && !machs.length) return null;
      if (!machs.length) return "Prends l’outil ⚙️ <b>Machine</b> et touche une case pour poser ton automate.";
      if (machs.some((e) => !e.r)) return "Touche ta machine et choisis ce qu’elle doit fabriquer.";
      if (!E.easy() && !ents.some((e) => e.k === "port")) return "Pose une 📤 <b>sortie</b> contre la Réserve. Elle enverra aux machines ce qu’elles réclament.";
      if (machs.some((e) => { const i = E.machInfo(e.id); return i.s === "starved" && i.miss && Object.values(i.miss).includes("link"); })) {
        return "Avec l’outil ➜ <b>Tapis</b>, glisse le doigt depuis la sortie jusqu’à ta machine. Elle se servira au passage.";
      }
      if (machs.some((e) => E.machInfo(e.id).s === "noout")) return "Ta machine pose sa production devant elle (la petite flèche). Trace un tapis de là jusqu’à la Réserve.";
      if (!st.flags.lineDone) return "Ça tourne. La première pièce ne va pas tarder.";
      const lone = Object.keys(D.PROJECTS).find((pid) => E.projVisible(pid) && !E.siteOf(pid) && E.projState(pid).step < D.PROJECTS[pid].steps.length);
      if (lone && !st.flags.tip_site) {
        return "🏗️ Ton Grand Œuvre attend son chantier : pose-le sur la Carte depuis le Cosmos" + (E.easy() ? ". Il se servira dans la Réserve. " : ", puis amène-lui ses matières par tapis. ") +
          '<button class="btn small ghost" data-u="tip" data-f="tip_site">Compris</button>';
      }
      if (!st.flags.tip_sat && Object.keys(E.fabSat()).length) {
        return "⚠️ Un tapis qui entre dans la Réserve est plein : ce qu’il porte n’arrive pas en entier. Fais entrer un deuxième tapis dans la Réserve (un 🔀 répartiteur sur le chemin, par exemple). " +
          '<button class="btn small ghost" data-u="tip" data-f="tip_sat">Compris</button>';
      }
      return null;
    }
    function refresh() {
      if (!V.el) return;
      const ms = E.machines();
      const free = V.el.querySelector("#uFree");
      const owned = E.MACHINES.filter((m) => ms[m].own > 0);
      const us = E.extUnits(), freeE = E.EXTS.filter((t) => us[t].own - us[t].used > 0);
      if (free) {
        const html = owned.length || freeE.length ? '<span class="tiny muted">Libres</span>' +
          freeE.map((t) => '<button class="u-chip ext' + (V.tool === "ext" && V.etype === t ? " on" : "") + '" data-et="' + t + '" title="' + esc(I[t].n) + '">' + icon(t, "sm") + "<b>" + (us[t].own - us[t].used) + "</b></button>").join("") +
          owned.map((m) => '<button class="u-chip' + (V.tool === "mach" && V.mtype === m ? " on" : "") + '" data-mt="' + m + '" title="' + esc(I[m].n) + '">' + icon(m, "sm") + "<b>" + (ms[m].own - ms[m].used) + "</b></button>").join("") +
          (E.cache().aspd > 1 ? '<span class="tiny muted">vitesse ×' + String(Math.round(E.cache().aspd * 100) / 100).replace(".", ",") + "</span>" : "") +
          (!E.easy() && E.deposits().length && Object.keys(S().fab.c).length ? '<span class="tiny muted u-belt">🛤️ ' + fmtNum(E.beltCap()) + "/s</span>" : "")
          : "";
        if (free.dataset.h !== html) { free.innerHTML = html; free.dataset.h = html; }
      }
      showTools(!!(free && free.dataset.h));
      const fn = V.el.querySelector("#uFabN"), nq = S().hand.q.length;
      if (fn && fn.textContent !== (nq ? String(nq) : "")) fn.textContent = nq ? String(nq) : "";
      const ov = V.el.querySelector("#uOver");
      if (ov && overlay) { const o = overlay(); if (ov.dataset.h !== o) { ov.innerHTML = o; ov.dataset.h = o; } }
      const hb = V.el.querySelector("#uHint");
      const h = hint();
      if (hb) { hb.classList.toggle("hidden", !h); if (h && hb.dataset.h !== h) { hb.innerHTML = "💡 " + h; hb.dataset.h = h; } }
      sheetLive();
    }
    /* Un écran qui se remplit au fil du jeu : au début, la carte et l’objectif seulement.
     * Chaque outil apparaît quand il sert ; sortie, répartiteur et croisement sont
     * ceux de l’usine avancée. */
    function toolsOn() {
      const cells = Object.values(S().fab.c), us = E.extUnits(), ms = E.machines(), ez = E.easy();
      const has = (k) => cells.some((e) => e.k === k);
      const ext = E.EXTS.some((t) => us[t].own > 0) || has("ext");
      const mach = E.MACHINES.some((m) => ms[m].own > 0) || has("mach");
      const any = cells.length > 0, adv = !ez && (ext || mach || any);
      const lot = has("mach") || has("site"); // en usine simple, tapis et retouches servent quand des machines tournent
      return { voir: ext || mach || any, ext, mach, tapis: adv || (lot && has("belt")), port: adv || has("port"), split: adv || has("split"), cross: adv || has("cross"),
        turn: ez ? lot : any, del: ez ? lot : any };
    }
    function showTools(bar) {
      const u = V.el && V.el.querySelector(".usine");
      if (!u) return;
      const on = toolsOn();
      let n = 0;
      u.querySelectorAll("[data-tool]").forEach((b) => { const v = !!on[b.dataset.tool]; b.classList.toggle("hidden", !v); if (v) n++; });
      if (!on[V.tool]) setTool("voir");
      u.classList.toggle("notools", n <= 1);
      u.classList.toggle("nobar", !bar);
      const any = Object.keys(S().fab.c).length > 0;
      u.querySelectorAll('[data-u="center"], [data-u="undo"]').forEach((b) => b.classList.toggle("hidden", !any));
      const fab = u.querySelector(".u-fab");
      if (fab) fab.classList.toggle("hidden", Object.keys(S().known).length < 3);
    }
    /* met à jour l’état de la machine choisie sans reconstruire le panneau */
    function sheetLive() {
      const box = V.el && V.el.querySelector("#uSheet");
      if (box && V.zsel && V.zsel.i !== undefined && box.dataset.zs !== markState(V.zsel.z, V.zsel.i)) { sheet(); return; }
      const e = V.sel && E.fabCell(V.sel.x, V.sel.y);
      if (box && e && e.k === "site") {
        const ps = E.projState(e.p), step = D.PROJECTS[e.p].steps[ps.step];
        if (box.dataset.site !== e.p + ":" + ps.step + ":" + E.machInfo(e.id).s) { sheet(); return; }
        if (step && step.cost) box.querySelectorAll("[data-sp]").forEach((el) => { const k = el.dataset.sp; el.textContent = fmt(ps.paid[k] || 0) + " / " + fmt(step.cost[k]); });
        return;
      }
      if (!box || !e || (e.k !== "mach" && e.k !== "ext")) return;
      if ((needsLink(e) ? "1" : "") !== (box.dataset.loose || "")) { sheet(); return; }
      const st = e.k === "ext" ? extStatus(e) : machStatus(e), el = box.querySelector(".u-st");
      if (!el) return;
      if (el.innerHTML !== st.s) { el.innerHTML = st.s; el.className = "u-st " + st.lvl; }
      let more = box.querySelector(".u-more");
      if (st.more && !more) { more = document.createElement("p"); more.className = "small u-more"; box.querySelector(".u-head").after(more); }
      if (more) { if (!st.more) more.remove(); else if (more.innerHTML !== st.more) more.innerHTML = st.more; }
    }

    /* ------------------------------------------------------------ animation */
    function pathFor(key) {
      if (V.paths[key] !== undefined) return V.paths[key];
      const [from, to] = key.split(">");
      const g = E.fabGraph(), P = g.prods[from];
      let pts = null;
      if (P) {
        const at = to === "res" ? (P.t.res ? P.t.res.at : null) : P.t.cons[to];
        if (at !== null && at !== undefined) {
          pts = [{ x: P.x, y: P.y }];
          const chain = [];
          for (let i = at; i >= 0; i = P.t.nodes[i].p) chain.push(P.t.nodes[i]);
          chain.reverse().forEach((n) => pts.push({ x: n.x, y: n.y }));
          const last = pts[pts.length - 1];
          if (to === "res") {
            for (let d = 0; d < 4; d++) {
              const nx = last.x + DX[d], ny = last.y + DY[d];
              if (E.isRes(nx, ny)) { pts.push({ x: last.x + DX[d] * 0.75, y: last.y + DY[d] * 0.75 }); break; }
            }
          } else if (g.pos[to]) pts.push({ x: g.pos[to].x, y: g.pos[to].y, end: to });
          if (P.e.k !== "port") pts[0] = { x: P.x + DX[P.e.d] * 0.4, y: P.y + DY[P.e.d] * 0.4 };
          else pts[0] = { x: P.x + DX[P.e.d] * 0.3, y: P.y + DY[P.e.d] * 0.3 };
        }
      }
      // usine simple : sans tapis, les objets suivent le pointillé entre la Réserve et la machine
      if (!pts && E.easy()) {
        const at = from === "res" ? g.pos[to] : P && to === "res" ? P : null;
        if (at) {
          const r = resEdge(at.x, at.y);
          pts = from === "res" ? [{ x: r.x, y: r.y }, { x: at.x, y: at.y, end: to }] : [{ x: at.x, y: at.y }, { x: r.x, y: r.y }];
        }
      }
      V.paths[key] = pts;
      return pts;
    }
    /* le bord de la Réserve le plus proche d’une case */
    const resEdge = (x, y) => ({ x: Math.max(-1.45, Math.min(1.45, x)), y: Math.max(-1.45, Math.min(1.45, y)) });
    /* usine simple : un pointillé qui avance relie à la Réserve ce qui s’y sert ou y range sans tapis */
    function drawLinks() {
      if (!E.easy()) return;
      const c = V.ctx, z = V.cam.z, g = E.fabGraph(), cells = S().fab.c;
      c.save();
      c.setLineDash([z * 0.12, z * 0.2]);
      c.lineDashOffset = -V.t * z * 0.5;
      c.lineWidth = Math.max(1, z * 0.045);
      c.strokeStyle = "rgba(255,220,160,0.3)";
      c.beginPath();
      for (const k in cells) {
        const e = cells[k];
        if (e.k !== "mach" && e.k !== "site" && e.k !== "ext") continue;
        if (e.k === "ext" && g.prods[e.id] && g.prods[e.id].t.res) continue; // déjà relié par un tapis
        const i = k.indexOf(","), x = +k.slice(0, i), y = +k.slice(i + 1), r = resEdge(x, y);
        c.moveTo(sx(r.x), sy(r.y));
        c.lineTo(sx(x), sy(y));
      }
      c.stroke();
      c.restore();
    }
    function feed() {
      const fl = E.fabDrain();
      for (const f of fl) {
        const key = f.from + ">" + f.to + ">" + f.i;
        let unit = 1;
        if (f.to === "res") { const it = I[f.i]; unit = it && it.r ? it.r[2] : 1; }
        else { const m = E.machById(f.to), it = m && I[m.r]; unit = it && it.r[1][f.i] ? it.r[1][f.i] : 1; }
        V.credit[key] = Math.min(4, (V.credit[key] || 0) + f.q / unit);
        if (f.to === "res") V.pulse.res = V.t;
      }
    }
    function spawn(speed) {
      for (const key in V.credit) {
        if (V.credit[key] < 1) continue;
        if (V.t - (V.lastSpawn[key] || -9) < 0.3) continue;
        const pts = pathFor(key);
        if (!pts || pts.length < 2) { delete V.credit[key]; continue; }
        V.credit[key] -= 1;
        V.lastSpawn[key] = V.t;
        let len = 0;
        const seg = [];
        for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); seg.push(l); len += l; }
        if (V.packets.length < 400) V.packets.push({ pts, seg, len, s: 0, i: key.split(">")[2], v: speed });
      }
    }
    function frame(now) {
      if (!V.cv) return;
      if (onZone && V.t - (V.lastZone || 0) > 1) {
        V.lastZone = V.t;
        let best = null, bd = 1e9;
        for (const g of zonesOnMap()) { const d = Math.hypot((g.x0 + g.x1) / 2 - V.cam.x, g.y - V.cam.y); if (d < bd) { bd = d; best = g.id; } }
        if (best && best !== V.zone) { V.zone = best; onZone(best); }
      }
      V.raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - V.last) / 1000);
      V.last = now;
      if (document.hidden) return;
      V.t += dt;
      if (V.t - (V.lastRef || 0) > 0.5) { V.lastRef = V.t; refresh(); }
      const speed = 1.6 * Math.min(4, Math.sqrt(E.cache().aspd || 1));
      feed();
      spawn(speed);
      keepBand();
      for (const p of V.packets) p.s += p.v * dt;
      V.packets = V.packets.filter((p) => {
        if (p.s < p.len) return true;
        const end = p.pts[p.pts.length - 1].end;
        if (end) V.pulse[end] = V.t;
        return false;
      });
      draw();
    }

    /* ------------------------------------------------------------ dessin */
    function draw() {
      const c = V.ctx, z = V.cam.z;
      c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
      c.clearRect(0, 0, V.w, V.h);
      const R = E.fabR();
      const x0 = Math.max(-R, Math.floor(V.cam.x - V.w / 2 / z) - 1), x1 = Math.min(R, Math.ceil(V.cam.x + V.w / 2 / z) + 1);
      const y0 = Math.max(-R, Math.floor(V.cam.y - V.h / 2 / z) - 1), y1 = Math.min(R, Math.ceil(V.cam.y + V.h / 2 / z) + 1);
      // le sol
      c.fillStyle = "#0b0907";
      c.fillRect(0, 0, V.w, V.h);
      const gx = sx(-R - 0.5), gy = sy(-R - 0.5), gw = (2 * R + 1) * z;
      const grd = c.createRadialGradient(sx(0), sy(0), z, sx(0), sy(0), gw * 0.75);
      grd.addColorStop(0, "#2a221a");
      grd.addColorStop(1, "#18130f");
      c.fillStyle = grd;
      c.fillRect(gx, gy, gw, gw);
      c.strokeStyle = "rgba(255,235,205,0.045)";
      c.lineWidth = 1;
      c.beginPath();
      for (let x = x0; x <= x1 + 1; x++) { const X = Math.round(sx(x - 0.5)) + 0.5; c.moveTo(X, sy(y0 - 0.5)); c.lineTo(X, sy(y1 + 0.5)); }
      for (let y = y0; y <= y1 + 1; y++) { const Y = Math.round(sy(y - 0.5)) + 0.5; c.moveTo(sx(x0 - 0.5), Y); c.lineTo(sx(x1 + 0.5), Y); }
      c.stroke();
      // petits cailloux et touffes, toujours au même endroit
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const h = hash(x, y);
        if (h % 7 !== 0 || E.fabCell(x, y)) continue;
        c.fillStyle = h % 2 ? "rgba(120,100,70,0.22)" : "rgba(90,120,70,0.18)";
        c.beginPath();
        c.arc(sx(x) + ((h >> 3) % 9 - 4) * z / 22, sy(y) + ((h >> 7) % 9 - 4) * z / 22, z * (0.04 + (h % 3) * 0.015), 0, 6.3);
        c.fill();
      }
      c.strokeStyle = "rgba(255,220,170,0.18)";
      c.setLineDash([6, 6]);
      c.strokeRect(gx, gy, gw, gw);
      c.setLineDash([]);
      // les régions des terres, la brume de la suivante
      drawRegions(x0, x1, y0, y1);
      // les gisements, regroupés par terre
      const labels = {};
      for (const d of E.deposits()) {
        const L = labels[d.z] || (labels[d.z] = { x0: d.x, x1: d.x, y: d.y });
        L.x0 = Math.min(L.x0, d.x); L.x1 = Math.max(L.x1, d.x);
        if (d.x < x0 - 1 || d.x > x1 + 1 || d.y < y0 - 1 || d.y > y1 + 1) continue;
        drawDeposit(d);
      }
      if (z > 20) {
        c.font = "600 " + Math.max(10, Math.round(z * 0.27)) + "px " + getComputedStyle(document.body).fontFamily;
        c.textAlign = "center"; c.textBaseline = "alphabetic";
        for (const zid in labels) {
          const L = labels[zid], X = sx((L.x0 + L.x1) / 2), Y = sy(L.y - 0.68);
          if (X < -200 || X > V.w + 200 || Y < -40 || Y > V.h + 40) continue;
          c.fillStyle = "rgba(0,0,0,0.55)";
          c.fillText(zoneName(zid), X + 1, Y + 1);
          c.fillStyle = "rgba(255,238,210,0.9)";
          c.fillText(zoneName(zid), X, Y);
        }
      }

      // emplacements possibles pour une sortie
      if (V.tool === "port") {
        c.strokeStyle = "rgba(255,210,120,0.75)";
        c.setLineDash([4, 4]);
        for (let i = -1; i <= 1; i++) for (const [x, y] of [[2, i], [-2, i], [i, 2], [i, -2]]) if (!E.fabCell(x, y)) c.strokeRect(sx(x) - z * 0.42, sy(y) - z * 0.42, z * 0.84, z * 0.84);
        c.setLineDash([]);
      }

      const cells = S().fab.c;
      const vis = [];
      for (const k in cells) {
        const i = k.indexOf(","), x = +k.slice(0, i), y = +k.slice(i + 1);
        if (x < x0 || x > x1 || y < y0 || y > y1) continue;
        vis.push([x, y, cells[k]]);
      }
      // tapis d’abord, puis le reste par-dessus
      for (const [x, y, e] of vis) if (e.k === "belt" || e.k === "cross") drawBelt(x, y, e);
      drawSat();
      drawLinks();
      drawReserve();
      for (const [x, y, e] of vis) {
        if (e.k === "split") drawSplit(x, y);
        else if (e.k === "port") drawPort(x, y, e);
      }
      if (V.draw) drawPreview();
      for (const p of V.packets) drawPacket(p);
      for (const [x, y, e] of vis) { if (e.k === "mach") drawMach(x, y, e); else if (e.k === "ext") drawExt(x, y, e); else if (e.k === "site") drawSite(x, y, e); }
      drawMarks();
      drawWalker();
      // la nuit tombe sur la carte, à l’heure de l’appareil
      const hr = new Date().getHours(), night = hr < 6 || hr >= 21 ? 0.28 : hr < 7 || hr >= 20 ? 0.14 : 0;
      if (night) { c.fillStyle = "rgba(10,16,48," + night + ")"; c.fillRect(0, 0, V.w, V.h); }
      if (V.sel) {
        const a = 0.5 + 0.5 * Math.sin(V.t * 5);
        c.strokeStyle = "rgba(255,225,150," + (0.55 + 0.4 * a) + ")";
        c.lineWidth = 2.5;
        const big = E.isRes(V.sel.x, V.sel.y);
        if (big) roundRect(c, sx(-1.5) - 3, sy(-1.5) - 3, 3 * z + 6, 3 * z + 6, z * 0.2);
        else roundRect(c, sx(V.sel.x) - z / 2 + 1, sy(V.sel.y) - z / 2 + 1, z - 2, z - 2, z * 0.16);
        c.stroke();
      }
    }
    const DEPCOL = { bois: "#5f7d36", fibre: "#79a24c", caillou: "#8a8f96", os: "#d8ccb0", cuir: "#9a6a44", argile: "#a8663e", silex: "#44474e", sable: "#d9b77a",
      charbon: "#2e2e33", petrole: "#151218", quartz: "#bfe4f0", helium3: "#bcd7ff", regolithe: "#9a9aa0", debris: "#7b808a", resonite: "#5ac8ff" };
    const depColor = (r) => DEPCOL[r] || (I[r] && I[r].col) || "#6d6d6d";
    function drawDeposit(d) {
      const c = V.ctx, z = V.cam.z, X = sx(d.x), Y = sy(d.y), col = depColor(d.res);
      const pulse = Math.max(0, 1 - (V.t - (V.pulse["d" + d.x + "," + d.y] || -9)) * 5);
      c.globalAlpha = 0.6;
      c.fillStyle = col;
      roundRect(c, X - z * 0.48, Y - z * 0.48, z * 0.96, z * 0.96, z * 0.24);
      c.fill();
      c.globalAlpha = 1;
      c.strokeStyle = shade(col, 0.4);
      c.lineWidth = 1.5 + pulse * 2.5;
      c.stroke();
      for (let i = 0; i < 6; i++) {
        const hh = hash(d.x * 7 + i, d.y * 13 - i);
        c.fillStyle = shade(col, hh % 2 ? 0.35 : -0.35);
        c.beginPath();
        c.arc(X + ((hh >> 2) % 17 - 8) * z / 22, Y + ((hh >> 6) % 17 - 8) * z / 22, z * (0.04 + (hh % 3) * 0.02), 0, 6.3);
        c.fill();
      }
      if (!E.fabCell(d.x, d.y)) drawIcon(d.res, X, Y - pulse * z * 0.06, z * (0.5 + pulse * 0.1), false);
      // le stock de la matière, juste dessous
      if (z > 26) {
        c.font = "600 " + Math.round(z * 0.21) + "px system-ui, sans-serif";
        c.textAlign = "center"; c.textBaseline = "top";
        const t = fmt(S().inv[d.res] || 0);
        c.fillStyle = "rgba(0,0,0,0.6)"; c.fillText(t, X + 1, Y + z * 0.52 + 1);
        c.fillStyle = "#f3e6cf"; c.fillText(t, X, Y + z * 0.52);
      }
    }
    /* --- décor des régions */
    const BIOME = {
      lisiere: ["#2c4a22", "tree"], plaine: ["#5c5a2a", "grass"], riviere: ["#344a3c", "water"], collines: ["#3a5a30", "hill"],
      mine: ["#2b221c", "cave"], desert: ["#8a6a3c", "dune"], gisement: ["#2c2729", "oil"], montagnes: ["#4a4f58", "peak"],
      orbite: ["#0b0e1f", "star"], lune: ["#56575d", "crater"], mercure: ["#4c2316", "lava"], caveau: ["#0f2537", "crystal"]
    };
    function drawRegions(x0, x1, y0, y1) {
      const c = V.ctx, z = V.cam.z;
      for (const g of zonesOnMap()) {
        const b = g.box;
        if (b.x1 < x0 - 1 || b.x0 > x1 + 1 || b.y1 < y0 - 1 || b.y0 > y1 + 1) continue;
        const [col, deco] = BIOME[g.id] || ["#3a3a3a", "grass"];
        const X = sx(b.x0), Y = sy(b.y0), W = (b.x1 - b.x0) * z, H = (b.y1 - b.y0) * z;
        c.fillStyle = col; c.globalAlpha = 0.7;
        roundRect(c, X, Y, W, H, z * 0.9); c.fill();
        c.globalAlpha = 1;
        c.strokeStyle = shade(col, 0.25); c.lineWidth = 2; c.stroke();
        decorate(g, deco, col);
      }
      // la prochaine terre, encore dans la brume
      const next = D.ZONES.find((zz) => !E.zoneOpen(zz.id) && !zz.secret);
      if (next) {
        const cells = E.zonePatch(next.id);
        if (cells.length) {
          const xs = cells.map((q) => q.x), cy = cells[0].y;
          const X = sx(Math.min.apply(null, xs) - 1.6), Y = sy(cy - 2.2), W = (Math.max.apply(null, xs) - Math.min.apply(null, xs) + 3.2) * z, H = 3.8 * z;
          c.fillStyle = "rgba(160,160,170,0.12)";
          roundRect(c, X, Y, W, H, z * 0.9); c.fill();
          c.setLineDash([5, 6]); c.strokeStyle = "rgba(220,220,230,0.3)"; c.lineWidth = 1.5; c.stroke(); c.setLineDash([]);
          if (z > 16) {
            const req = I[next.req], known = req && (S().known[next.req] || req.a <= S().age + 1);
            c.font = "600 " + Math.max(10, Math.round(z * 0.26)) + "px system-ui, sans-serif";
            c.textAlign = "center"; c.textBaseline = "middle";
            c.fillStyle = "rgba(235,235,245,0.75)";
            c.fillText("🌫️ " + (known ? next.n : "Terre inconnue"), X + W / 2, Y + H * 0.4);
            if (known) { c.font = Math.max(9, Math.round(z * 0.21)) + "px system-ui, sans-serif"; c.fillText("il te faut : " + req.n, X + W / 2, Y + H * 0.66); }
          }
        }
      }
    }
    function decorate(g, deco, col) {
      const c = V.ctx, z = V.cam.z, b = g.box;
      for (let y = Math.ceil(b.y0); y <= Math.floor(b.y1); y++) for (let x = Math.ceil(b.x0); x <= Math.floor(b.x1); x++) {
        const h = hash(x * 3 + 11, y * 5 - 7);
        if (h % 3 || E.deposit(x, y) || markAt(x, y) || E.fabCell(x, y) || y === g.y - 1) continue;
        const X = sx(x) + ((h >> 4) % 9 - 4) * z / 26, Y = sy(y) + ((h >> 8) % 9 - 4) * z / 26, r = z * (0.12 + (h % 5) * 0.03);
        if (deco === "tree") {
          c.fillStyle = "#4a3120"; c.fillRect(X - r * 0.15, Y, r * 0.3, r * 0.9);
          c.fillStyle = h % 2 ? "#3f6b2c" : "#355e26";
          c.beginPath(); c.arc(X, Y - r * 0.1, r, 0, 6.3); c.arc(X - r * 0.6, Y + r * 0.2, r * 0.7, 0, 6.3); c.arc(X + r * 0.6, Y + r * 0.2, r * 0.7, 0, 6.3); c.fill();
        } else if (deco === "grass") {
          c.strokeStyle = h % 2 ? "#c9b46a" : "#a89048"; c.lineWidth = Math.max(1, z * 0.03);
          c.beginPath(); for (let k = -1; k <= 1; k++) { c.moveTo(X + k * r * 0.5, Y + r); c.lineTo(X + k * r * 0.8, Y - r * 0.6); } c.stroke();
        } else if (deco === "water") {
          c.strokeStyle = "rgba(150,200,230,0.55)"; c.lineWidth = Math.max(1, z * 0.035);
          const o = Math.sin(V.t * 1.5 + x) * r * 0.3;
          c.beginPath(); c.moveTo(X - r + o, Y); c.quadraticCurveTo(X + o, Y - r * 0.5, X + r + o, Y); c.stroke();
        } else if (deco === "hill") {
          c.fillStyle = h % 2 ? "rgba(120,170,100,0.35)" : "rgba(40,120,80,0.35)";
          c.beginPath(); c.ellipse(X, Y, r * 1.4, r * 0.8, 0, Math.PI, 0); c.fill();
        } else if (deco === "cave") {
          c.fillStyle = "rgba(0,0,0,0.45)"; c.beginPath(); c.arc(X, Y, r, 0, 6.3); c.fill();
          if (h % 4 === 0) { c.fillStyle = "rgba(255,150,70," + (0.4 + 0.3 * Math.sin(V.t * 2 + x)) + ")"; c.fillRect(X + r * 0.5, Y - r * 0.4, r * 0.3, r * 0.3); }
        } else if (deco === "dune") {
          c.strokeStyle = "rgba(240,210,150,0.5)"; c.lineWidth = Math.max(1, z * 0.04);
          c.beginPath(); c.arc(X, Y + r, r * 1.3, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
          if (h % 5 === 0) { c.fillStyle = "rgba(200,240,255," + (0.5 + 0.5 * Math.sin(V.t * 3 + y)) + ")"; c.fillRect(X, Y - r, 2, 2); }
        } else if (deco === "oil") {
          c.fillStyle = "#0b0909"; c.beginPath(); c.ellipse(X, Y, r * 1.3, r * 0.6, 0, 0, 6.3); c.fill();
          c.strokeStyle = "rgba(140,110,200,0.35)"; c.lineWidth = 1; c.stroke();
        } else if (deco === "peak") {
          c.fillStyle = "#6a707b"; c.beginPath(); c.moveTo(X, Y - r * 1.2); c.lineTo(X - r, Y + r * 0.6); c.lineTo(X + r, Y + r * 0.6); c.fill();
          c.fillStyle = "#e9eef5"; c.beginPath(); c.moveTo(X, Y - r * 1.2); c.lineTo(X - r * 0.35, Y - r * 0.55); c.lineTo(X + r * 0.35, Y - r * 0.55); c.fill();
        } else if (deco === "star") {
          c.fillStyle = "rgba(255,255,255," + (0.4 + 0.4 * Math.sin(V.t * 2 + h)) + ")"; c.fillRect(X, Y, Math.max(1.5, z * 0.04), Math.max(1.5, z * 0.04));
        } else if (deco === "crater") {
          c.strokeStyle = "rgba(30,30,35,0.45)"; c.lineWidth = Math.max(1, z * 0.04);
          c.beginPath(); c.ellipse(X, Y, r, r * 0.55, 0, 0, 6.3); c.stroke();
        } else if (deco === "lava") {
          c.strokeStyle = "rgba(255,120,40," + (0.5 + 0.3 * Math.sin(V.t * 2 + x + y)) + ")"; c.lineWidth = Math.max(1, z * 0.035);
          c.beginPath(); c.moveTo(X - r, Y); c.lineTo(X - r * 0.2, Y + r * 0.3); c.lineTo(X + r, Y - r * 0.2); c.stroke();
        } else if (deco === "crystal") {
          c.fillStyle = "rgba(90,200,255," + (0.35 + 0.3 * Math.sin(V.t * 2 + h)) + ")";
          c.beginPath(); c.moveTo(X, Y - r); c.lineTo(X + r * 0.5, Y); c.lineTo(X, Y + r); c.lineTo(X - r * 0.5, Y); c.fill();
        }
      }
    }
    /* --- les lieux à explorer */
    function drawMarks() {
      const c = V.ctx, z = V.cam.z;
      for (const g of zonesOnMap()) for (const m of g.marks) {
        const X = sx(m.x), Y = sy(m.y);
        if (X < -z || X > V.w + z || Y < -z || Y > V.h + z) continue;
        const state = markState(m.z, m.i);
        const ring = { done: "#7fd18b", active: "#ffd36b", next: "#ffd36b", locked: "#a89a87", later: "#5f574c" }[state];
        const glow = state === "next" ? 0.5 + 0.5 * Math.sin(V.t * 4) : 0;
        c.fillStyle = "rgba(15,12,10,0.8)";
        c.beginPath(); c.arc(X, Y, z * 0.36, 0, 6.3); c.fill();
        c.strokeStyle = ring; c.lineWidth = 2 + glow * 2.5; c.stroke();
        if (state === "active") {
          const p = E.expProgress();
          if (p) { c.strokeStyle = "#ffd36b"; c.lineWidth = 3.5; c.beginPath(); c.arc(X, Y, z * 0.42, -Math.PI / 2, -Math.PI / 2 + p.p * Math.PI * 2); c.stroke(); }
        }
        c.font = Math.round(z * 0.36) + "px serif";
        c.textAlign = "center"; c.textBaseline = "middle";
        c.fillStyle = state === "done" ? "#7fd18b" : "#f3e6cf";
        c.globalAlpha = state === "later" ? 0.5 : 1;
        c.fillText({ done: "✓", active: "⏳", next: "🧭", locked: "🔒", later: "?" }[state], X, Y + z * 0.02);
        c.globalAlpha = 1;
      }
    }
    /* --- l’explorateur en route */
    function drawWalker() {
      const act = S().exp.active, p = E.expProgress();
      if (!act || !p) return;
      const g = zonesOnMap().find((x) => x.id === act.z);
      const m = g && g.marks[act.i];
      if (!m) return;
      const c = V.ctx, z = V.cam.z;
      const k = p.p < 0.25 ? p.p / 0.25 : p.p > 0.85 ? 1 - (p.p - 0.85) / 0.15 : 1;
      const wx = m.x * k, wy = (m.y + 0.6) * k;
      c.setLineDash([3, 5]); c.strokeStyle = "rgba(255,220,160,0.35)"; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(sx(0), sy(0)); c.lineTo(sx(m.x), sy(m.y + 0.6)); c.stroke(); c.setLineDash([]);
      c.font = Math.round(z * 0.45) + "px serif";
      c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText(k >= 1 ? "🔦" : "🚶", sx(wx), sy(wy) - Math.abs(Math.sin(V.t * 8)) * z * 0.06);
    }
    function drawExt(x, y, e) {
      const c = V.ctx, z = V.cam.z, X = sx(x), Y = sy(y), col = depColor(e.res);
      const info = E.machInfo(e.id), work = info.s === "ok";
      const n = Object.values(e.u).reduce((a, b) => a + b, 0);
      const main = Object.keys(e.u).sort((a, b) => e.u[b] - e.u[a])[0];
      const bob = work ? Math.sin(V.t * 6 + x * 1.7) * z * 0.035 : 0;
      c.fillStyle = "rgba(0,0,0,0.35)";
      roundRect(c, X - z * 0.42 + z * 0.05, Y - z * 0.42 + z * 0.07, z * 0.84, z * 0.84, z * 0.18); c.fill();
      const gr = c.createLinearGradient(X, Y - z * 0.42, X, Y + z * 0.42);
      gr.addColorStop(0, shade(col, 0.3)); gr.addColorStop(1, shade(col, -0.45));
      c.fillStyle = gr;
      roundRect(c, X - z * 0.42, Y - z * 0.42, z * 0.84, z * 0.84, z * 0.18); c.fill();
      c.strokeStyle = "#f0d6a4"; c.lineWidth = 1.5; c.stroke();
      if (main) drawIcon(main, X - z * 0.04, Y - z * 0.05 + bob, z * 0.5, false);
      drawIcon(e.res, X + z * 0.26, Y + z * 0.26, z * 0.26, true);
      arrow(X + DX[e.d] * z * 0.47, Y + DY[e.d] * z * 0.47, e.d, z * 0.13, "#ffe2ae");
      const lv = { ok: "#7fd18b", wait: "#7fd18b", idle: "#ffbf4a", sat: "#ffbf4a", off: "#6f6556", noout: "#ff6a55", jam: "#ff9a3c" }[info.s] || "#6f6556";
      c.fillStyle = lv;
      c.beginPath(); c.arc(X + z * 0.28, Y - z * 0.28, z * 0.07, 0, 6.3); c.fill();
      if (lv === "#ff6a55" || lv === "#ffbf4a") {
        c.strokeStyle = lv; c.globalAlpha = 0.4 + 0.4 * Math.sin(V.t * 6); c.lineWidth = 2;
        c.beginPath(); c.arc(X + z * 0.28, Y - z * 0.28, z * 0.12, 0, 6.3); c.stroke(); c.globalAlpha = 1;
      }
      if (n > 1 && z > 24) {
        c.font = "700 " + Math.round(z * 0.2) + "px system-ui";
        c.textAlign = "left"; c.textBaseline = "alphabetic";
        c.fillStyle = "#fff4e0";
        c.fillText("×" + n, X - z * 0.4, Y + z * 0.38);
      }
    }
    function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return (h ^ (h >>> 16)) >>> 0; }
    function roundRect(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
      c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
      c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y);
      c.closePath();
    }
    /* d’où arrive-t-on dans une case ? (côtés d’entrée, pour dessiner les virages) */
    function inputs(x, y) {
      const out = [];
      for (let s = 0; s < 4; s++) {
        const n = E.fabCell(x + DX[s], y + DY[s]);
        if (!n) continue;
        const back = (s + 2) % 4;
        if ((n.k === "belt" || n.k === "port" || n.k === "mach") && n.d === back) out.push(s);
        else if (n.k === "split" || n.k === "cross") out.push(s);
      }
      return out;
    }
    function band(x1, y1, x2, y2, z) {
      const c = V.ctx;
      c.strokeStyle = "#7a6650";
      c.lineWidth = z * 0.66;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      c.strokeStyle = "#433a31";
      c.lineWidth = z * 0.52;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    }
    function chevrons(x1, y1, x2, y2, z, off) {
      const c = V.ctx, L = Math.hypot(x2 - x1, y2 - y1);
      if (L < 1) return;
      const ux = (x2 - x1) / L, uy = (y2 - y1) / L, step = z * 0.25, w = z * 0.13;
      c.strokeStyle = "rgba(255,210,140,0.5)";
      c.lineWidth = Math.max(1, z * 0.05);
      c.beginPath();
      for (let s = (off * step) % step; s < L; s += step) {
        const px = x1 + ux * s, py = y1 + uy * s;
        c.moveTo(px - ux * w - uy * w, py - uy * w + ux * w);
        c.lineTo(px, py);
        c.lineTo(px - ux * w + uy * w, py - uy * w - ux * w);
      }
      c.stroke();
    }
    function drawBelt(x, y, e) {
      const c = V.ctx, z = V.cam.z, X = sx(x), Y = sy(y), h = z / 2;
      c.lineCap = "butt";
      const off = (V.t * 1.6 * Math.min(4, Math.sqrt(E.cache().aspd || 1))) / 0.25;
      if (e.k === "cross") {
        band(X - h, Y, X + h, Y, z);
        c.fillStyle = "rgba(0,0,0,0.35)";
        c.fillRect(X - z * 0.36, Y - h, z * 0.72, z);
        band(X, Y - h, X, Y + h, z);
        c.strokeStyle = "#7a6650";
        c.lineWidth = 1.5;
        c.strokeRect(X - z * 0.33, Y - h + 1, z * 0.66, z - 2);
        return;
      }
      const ins = inputs(x, y).filter((s) => s !== e.d);
      const ox = X + DX[e.d] * h, oy = Y + DY[e.d] * h;
      if (!ins.length) ins.push((e.d + 2) % 4);
      for (const s of ins) band(X + DX[s] * h, Y + DY[s] * h, X, Y, z);
      band(X, Y, ox, oy, z);
      c.fillStyle = "#433a31";
      c.beginPath(); c.arc(X, Y, z * 0.26, 0, 6.3); c.fill();
      for (const s of ins) chevrons(X + DX[s] * h, Y + DY[s] * h, X, Y, z, off);
      chevrons(X, Y, ox, oy, z, off);
    }
    /* une entrée de la Réserve qui déborde : la case clignote en orange */
    function drawSat() {
      const sat = E.fabSat(), c = V.ctx, z = V.cam.z;
      for (const k in sat) {
        const i = k.indexOf(","), x = +k.slice(0, i), y = +k.slice(i + 1);
        const a = 0.35 + 0.3 * Math.sin(V.t * 5);
        c.strokeStyle = "rgba(255,150,60," + a + ")";
        c.lineWidth = Math.max(2, z * 0.08);
        roundRect(c, sx(x) - z * 0.46, sy(y) - z * 0.46, z * 0.92, z * 0.92, z * 0.14);
        c.stroke();
        if (z >= 26) { c.font = Math.round(z * 0.3) + "px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("⚠️", sx(x) + z * 0.32, sy(y) - z * 0.32); }
      }
    }
    function drawReserve() {
      const c = V.ctx, z = V.cam.z, x = sx(-1.5), y = sy(-1.5), w = 3 * z;
      const pulse = Math.max(0, 1 - (V.t - (V.pulse.res || -9)) * 3);
      c.fillStyle = "#3a2c1f";
      roundRect(c, x + 2, y + 2, w - 4, w - 4, z * 0.18); c.fill();
      c.lineWidth = 2 + pulse * 3;
      c.strokeStyle = "rgba(230,175,105," + (0.6 + 0.4 * pulse) + ")";
      c.stroke();
      // caisses
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
        if (i === 1 && j === 1) continue;
        const bx = x + (i + 0.18) * z, by = y + (j + 0.18) * z, bw = z * 0.64;
        c.fillStyle = ["#6b4a2c", "#7a5533", "#5e4127"][(i + j * 2) % 3];
        c.fillRect(bx, by, bw, bw);
        c.strokeStyle = "rgba(0,0,0,0.35)";
        c.lineWidth = 1;
        c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + bw, by + bw); c.moveTo(bx + bw, by); c.lineTo(bx, by + bw); c.stroke();
        c.strokeRect(bx + 0.5, by + 0.5, bw - 1, bw - 1);
      }
      c.font = Math.round(z * 0.62) + "px serif";
      c.textAlign = "center"; c.textBaseline = "middle";
      c.fillText("🏛️", sx(0), sy(0) + z * 0.04);
      if (z > 26) {
        c.font = "600 " + Math.max(9, Math.round(z * 0.22)) + "px system-ui, sans-serif";
        c.fillStyle = "#f3dcb8";
        c.fillText("RÉSERVE", sx(0), sy(0) + z * 0.48);
      }
    }
    function arrow(X, Y, d, size, color) {
      const c = V.ctx, ux = DX[d], uy = DY[d];
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(X + ux * size, Y + uy * size);
      c.lineTo(X - ux * size * 0.6 - uy * size * 0.8, Y - uy * size * 0.6 + ux * size * 0.8);
      c.lineTo(X - ux * size * 0.6 + uy * size * 0.8, Y - uy * size * 0.6 - ux * size * 0.8);
      c.closePath();
      c.fill();
    }
    function drawPort(x, y, e) {
      const c = V.ctx, z = V.cam.z, X = sx(x), Y = sy(y);
      c.fillStyle = "#4b3522";
      roundRect(c, X - z * 0.42, Y - z * 0.42, z * 0.84, z * 0.84, z * 0.14); c.fill();
      c.strokeStyle = "#e0a65a"; c.lineWidth = 2; c.stroke();
      c.fillStyle = "#1c140d";
      c.fillRect(X - z * 0.26, Y - z * 0.26, z * 0.52, z * 0.52);
      arrow(X + DX[e.d] * z * 0.12, Y + DY[e.d] * z * 0.12, e.d, z * 0.2, "#ffc77a");
      if (e.f && I[e.f]) drawIcon(e.f, X + z * 0.28, Y - z * 0.28, z * 0.32, true);
    }
    function drawSplit(x, y) {
      const c = V.ctx, z = V.cam.z, X = sx(x), Y = sy(y);
      for (let d = 0; d < 4; d++) band(X, Y, X + DX[d] * z / 2, Y + DY[d] * z / 2, z * 0.8);
      c.fillStyle = "#3d3326";
      c.beginPath(); c.arc(X, Y, z * 0.34, 0, 6.3); c.fill();
      c.strokeStyle = "#d9a35c"; c.lineWidth = 2; c.stroke();
      const r = V.t * 2;
      for (let d = 0; d < 4; d++) arrow(X + Math.cos(r + d * Math.PI / 2) * z * 0.17, Y + Math.sin(r + d * Math.PI / 2) * z * 0.17, d, z * 0.07, "#ffd18a");
    }
    function drawMach(x, y, e) {
      const c = V.ctx, z = V.cam.z, X = sx(x), Y = sy(y);
      const info = E.machInfo(e.id), col = MCOL[e.m] || "#777";
      const work = info.s === "ok" && info.avg > 1e-4;
      const pulse = Math.max(0, 1 - (V.t - (V.pulse[e.id] || -9)) * 4);
      const s = z * (0.88 + pulse * 0.05);
      // ombre
      c.fillStyle = "rgba(0,0,0,0.35)";
      roundRect(c, X - s / 2 + z * 0.05, Y - s / 2 + z * 0.07, s, s, z * 0.16); c.fill();
      const gr = c.createLinearGradient(X, Y - s / 2, X, Y + s / 2);
      gr.addColorStop(0, shade(col, 0.25));
      gr.addColorStop(1, shade(col, -0.25));
      c.fillStyle = gr;
      roundRect(c, X - s / 2, Y - s / 2, s, s, z * 0.16); c.fill();
      c.strokeStyle = shade(col, 0.45); c.lineWidth = 1.5; c.stroke();
      // engrenage
      const gx = X - s * 0.3, gy = Y - s * 0.3, gr2 = z * 0.12, rot = work ? V.t * 3 : 0;
      c.fillStyle = shade(col, 0.55);
      c.beginPath();
      for (let k = 0; k < 16; k++) {
        const a = rot + k * Math.PI / 8, r = k % 2 ? gr2 : gr2 * 1.35;
        c.lineTo(gx + Math.cos(a) * r, gy + Math.sin(a) * r);
      }
      c.closePath(); c.fill();
      c.fillStyle = shade(col, -0.3);
      c.beginPath(); c.arc(gx, gy, gr2 * 0.45, 0, 6.3); c.fill();
      // fenêtre et produit
      c.fillStyle = "rgba(10,8,6,0.55)";
      roundRect(c, X - z * 0.27, Y - z * 0.2, z * 0.54, z * 0.5, z * 0.08); c.fill();
      if (e.r && I[e.r]) drawIcon(e.r, X, Y + z * 0.05, z * 0.4, false);
      else { c.fillStyle = "#ffd36b"; c.font = "700 " + Math.round(z * 0.32) + "px system-ui"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("?", X, Y + z * 0.06); }
      // flèche de sortie
      arrow(X + DX[e.d] * z * 0.47, Y + DY[e.d] * z * 0.47, e.d, z * 0.13, "#ffe2ae");
      // voyant
      const lv = { ok: "#7fd18b", wait: "#7fd18b", starved: "#ffbf4a", norec: "#ffbf4a", idle: "#ffbf4a", cap: "#8fb3ff", off: "#6f6556", noout: "#ff6a55", jam: "#ff9a3c", blocked: "#ff6a55" }[info.s] || "#6f6556";
      c.fillStyle = lv;
      c.beginPath(); c.arc(X + s * 0.3, Y - s * 0.3, z * 0.07, 0, 6.3); c.fill();
      if (lv === "#ff6a55" || lv === "#ffbf4a") {
        c.strokeStyle = lv; c.globalAlpha = 0.4 + 0.4 * Math.sin(V.t * 6); c.lineWidth = 2;
        c.beginPath(); c.arc(X + s * 0.3, Y - s * 0.3, z * 0.12, 0, 6.3); c.stroke(); c.globalAlpha = 1;
      }
      if (e.n > 1 && z > 24) {
        c.font = "700 " + Math.round(z * 0.2) + "px system-ui";
        c.textAlign = "right"; c.textBaseline = "alphabetic";
        c.fillStyle = "#fff4e0";
        c.fillText("×" + e.n, X + s * 0.46, Y + s * 0.44);
      }
      // progression (machines lentes)
      const B = S().fab.ms[e.id];
      if (B && work && E.machRate(e) < 1) {
        c.fillStyle = "rgba(255,230,180,0.75)";
        c.fillRect(X - s * 0.4, Y + s * 0.4, s * 0.8 * Math.min(1, B.p % 1), Math.max(2, z * 0.04));
      }
    }
    function shade(hex, f) {
      const n = parseInt(hex.slice(1), 16);
      let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      if (f > 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
      return "rgb(" + (r | 0) + "," + (g | 0) + "," + (b | 0) + ")";
    }
    /* le chantier d’un Grand Œuvre : un échafaudage, et l’avancement de l’étape en cours */
    function siteProgress(pid) {
      const ps = E.projState(pid), step = D.PROJECTS[pid].steps[ps.step];
      if (!step) return 1;
      if (!step.cost) return 1;
      let a = 0, b = 0;
      for (const k in step.cost) { a += Math.min(ps.paid[k] || 0, step.cost[k]); b += step.cost[k]; }
      return b ? a / b : 0;
    }
    function drawSite(x, y, e) {
      const c = V.ctx, z = V.cam.z, X = sx(x), Y = sy(y), P = D.PROJECTS[e.p];
      if (!P) return;
      const info = E.machInfo(e.id), s = z * 0.92;
      c.fillStyle = "rgba(0,0,0,0.35)";
      roundRect(c, X - s / 2 + z * 0.05, Y - s / 2 + z * 0.07, s, s, z * 0.16); c.fill();
      c.fillStyle = "#23283a";
      roundRect(c, X - s / 2, Y - s / 2, s, s, z * 0.16); c.fill();
      // échafaudage
      c.save();
      c.beginPath(); roundRect(c, X - s / 2, Y - s / 2, s, s, z * 0.16); c.clip();
      c.strokeStyle = "rgba(201,162,74,0.35)"; c.lineWidth = Math.max(1, z * 0.035);
      for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(X + k * z * 0.22 - s / 2, Y + s / 2); c.lineTo(X + k * z * 0.22 + s / 2, Y - s / 2); c.stroke(); }
      c.restore();
      c.strokeStyle = "#c9a24a"; c.lineWidth = 1.5;
      roundRect(c, X - s / 2, Y - s / 2, s, s, z * 0.16); c.stroke();
      // avancement
      const f = siteProgress(e.p), r = z * 0.34;
      c.lineWidth = Math.max(2, z * 0.07);
      c.strokeStyle = "rgba(255,255,255,0.12)";
      c.beginPath(); c.arc(X, Y, r, 0, 6.283); c.stroke();
      c.strokeStyle = info.s === "ok" ? "#ffd36b" : "#c9a24a";
      c.beginPath(); c.arc(X, Y, r, -Math.PI / 2, -Math.PI / 2 + 6.283 * f); c.stroke();
      c.textAlign = "center"; c.textBaseline = "middle";
      c.font = Math.round(z * 0.4) + "px serif";
      c.fillText(P.ic, X, Y + z * 0.03);
      const lv = { ok: "#7fd18b", starved: "#ffbf4a", nolink: "#ff6a55", need: "#8fb3ff", act: "#ffd36b", done: "#7fd18b" }[info.s] || "#6f6556";
      c.fillStyle = lv;
      c.beginPath(); c.arc(X + s * 0.36, Y - s * 0.36, z * 0.07, 0, 6.3); c.fill();
    }
    function drawIcon(id, X, Y, size, disc) {
      const c = V.ctx, it = I[id];
      if (!it) return;
      if (disc || it.sym) {
        c.fillStyle = it.sym ? it.col : "rgba(20,15,10,0.85)";
        c.beginPath(); c.arc(X, Y, size * 0.55, 0, 6.3); c.fill();
        c.strokeStyle = "rgba(255,235,200,0.5)"; c.lineWidth = 1; c.stroke();
      }
      c.textAlign = "center"; c.textBaseline = "middle";
      if (it.sym) {
        c.fillStyle = inkOf(it.col);
        c.font = "700 " + Math.round(size * (it.sym.length > 1 ? 0.5 : 0.62)) + "px system-ui, sans-serif";
        c.fillText(it.sym, X, Y + size * 0.03);
      } else {
        c.font = Math.round(size * (disc ? 0.72 : 1)) + "px serif";
        c.fillText(it.ic, X, Y + size * 0.05);
      }
    }
    function inkOf(hex) {
      const n = parseInt(hex.slice(1), 16);
      return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.6 ? "#1a1208" : "#ffffff";
    }
    function drawPacket(p) {
      let s = p.s, i = 0;
      while (i < p.seg.length - 1 && s > p.seg[i]) { s -= p.seg[i]; i++; }
      const a = p.pts[i], b = p.pts[i + 1], f = p.seg[i] ? Math.min(1, s / p.seg[i]) : 1;
      const x = a.x + (b.x - a.x) * f, y = a.y + (b.y - a.y) * f;
      const z = V.cam.z;
      const fade = b.end && i === p.seg.length - 1 ? 1 - Math.max(0, (f - 0.6) / 0.4) : 1;
      V.ctx.globalAlpha = fade;
      drawIcon(p.i, sx(x), sy(y), z * 0.36, true);
      V.ctx.globalAlpha = 1;
    }
    function drawPreview() {
      const c = V.ctx, z = V.cam.z, path = V.draw.path;
      c.globalAlpha = 0.75;
      path.forEach((q, k) => {
        const e = E.fabCell(q.x, q.y);
        const d = q.d !== null ? q.d : k > 0 ? path[k - 1].d : null;
        const blocked = e && e.k !== "belt";
        c.fillStyle = blocked ? "rgba(255,120,90,0.18)" : "rgba(255,210,140,0.22)";
        c.fillRect(sx(q.x) - z / 2 + 2, sy(q.y) - z / 2 + 2, z - 4, z - 4);
        if (d !== null && !blocked) arrow(sx(q.x), sy(q.y), d, z * 0.2, "#ffd18a");
      });
      c.globalAlpha = 1;
    }

    E.on("fab", () => { V.paths = {}; if (V.sel && !E.fabCell(V.sel.x, V.sel.y)) V.sel = null; if (V.el) refresh(); });

    /* depuis le Carnet : poser une machine qui fabriquera `id` */
    /* poser le chantier d’un Grand Œuvre : la prochaine case vide touchée */
    function placeSite(pid) {
      const at = E.siteOf(pid);
      if (at) { lookAt(at.x, at.y); select({ x: at.x, y: at.y }); return; }
      V.spid = pid;
      setTool("site");
      toast("Touche une case vide pour poser le chantier : <b>" + esc(D.PROJECTS[pid].n) + "</b>. Ensuite, amène-lui ses matières par tapis.");
    }
    /* pour le tutoriel : où est une case à l’écran, la montrer, quel outil est en main */
    function cellRect(x, y) {
      if (!V.cv) return null;
      const r = V.cv.getBoundingClientRect(), z = V.cam.z, X = r.left + sx(x), Y = r.top + sy(y);
      if (X < r.left || X > r.right || Y < r.top || Y > r.bottom) return null;
      return { left: X - z / 2, top: Y - z / 2, width: z, height: z };
    }
    function reveal(x, y) {
      if (!V.cv) return;
      const f = freeBand(), z = V.cam.z, X = sx(x), Y = sy(y);
      if (X < z || X > V.w - z || Y < f.top + z || Y > V.h - f.bot - z) lookAt(x, y);
    }
    /* depuis la roue : poser une machine, ou un extracteur, de ce type */
    function useMach(m) {
      V.mtype = m;
      setTool("mach");
      toast("Touche une case vide pour poser : <b>" + esc(I[m].n) + "</b>");
    }
    function useExt(t) {
      V.etype = t;
      setTool("ext");
      const c = V.extAt;
      V.extAt = null;
      if (c && E.deposit(c.x, c.y) && E.extFor(E.deposit(c.x, c.y).res).includes(t)) { placeExt(c); return; }
      toast("Touche une case de gisement pour poser : <b>" + esc(I[t].n) + "</b>");
    }
    function prepare(id) {
      V.preset = id;
      if (!freeTypes().length) { toast("Aucune machine libre. Retire-en une de la Carte, ou fabriques-en une autre."); setTool("voir"); return; }
      setTool("mach");
      toast("Touche une case vide pour poser la machine qui fabriquera : <b>" + esc(I[id].n) + "</b>");
    }

    return { mount, unmount, refresh, mounted, setTool, pickRecipe, select, prepare, placeSite, useMach, useExt, cellRect, reveal, tool: () => V.tool, focusZone, zonesOnMap, cam: () => ({ x: V.cam.x, y: V.cam.y, z: V.cam.z, w: V.w, h: V.h }) };
  }

  window.EclatUsine = { create };
})();
