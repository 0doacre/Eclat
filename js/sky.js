/* ÉCLAT — le ciel nocturne (canvas). */
(function (root) {
  "use strict";
  const Sky = {};
  let cv = null, cx = null, raf = 0, W = 0, H = 0, stars = [];
  const opts = { age: 0, dish: false, listenUntil: 0, decoded: false };
  let anims = [];
  const NAMED = [
    { n: "Véga", x: 0.24, y: 0.16 }, { n: "Deneb", x: 0.40, y: 0.10 }, { n: "Altaïr", x: 0.33, y: 0.34 },
    { n: "Arcturus", x: 0.88, y: 0.46 }, { n: "L’Étoile polaire", x: 0.60, y: 0.07 }, { n: "Antarès", x: 0.52, y: 0.58 }
  ];

  function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) / 2147483647); }

  function resize() {
    if (!cv) return;
    const dpr = Math.min(root.devicePixelRatio || 1, 2);
    const r = cv.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function gen() {
    const R = rng(1977);
    stars = [];
    for (let i = 0; i < 320; i++) {
      const band = R() < 0.45;
      let x = R(), y = R() * 0.8;
      if (band) { const t = R(); x = t; y = 0.75 - t * 0.6 + (R() - 0.5) * 0.12; }
      stars.push({ x, y, m: Math.pow(R(), 3) * 1.6 + 0.3, tw: R() * 6.28, sp: 0.5 + R() * 2 });
    }
  }

  let extraStars = [];
  function genExtra() {
    const R = rng(2026);
    extraStars = [];
    for (let i = 0; i < 30; i++) {
      extraStars.push({ x: R(), y: R() * 0.75, m: 1.3 + R() * 1.5, tw: R() * 6.28, sp: 1.5 + R() * 3 });
    }
  }

  const moonPos = () => ({ x: W * 0.8, y: H * 0.2, r: Math.max(16, Math.min(W, H) * 0.075) });
  const kherPos = () => ({ x: W * 0.16, y: H * 0.5 });

  function patternBlink(tSec, groups, stepDuration, groupPauseDuration, endPauseDuration) {
    stepDuration = stepDuration || 0.4;
    groupPauseDuration = groupPauseDuration || 0.9;
    endPauseDuration = endPauseDuration || 3.2;
    let total = 0;
    for (let i = 0; i < groups.length; i++) {
      total += groups[i] * stepDuration;
      if (i < groups.length - 1) total += groupPauseDuration;
    }
    total += endPauseDuration;
    let cur = tSec % total;
    for (let i = 0; i < groups.length; i++) {
      const gTime = groups[i] * stepDuration;
      if (cur < gTime) {
        const inFlash = cur % stepDuration;
        return inFlash < stepDuration * 0.6 ? 1 : 0;
      }
      cur -= gTime;
      if (i < groups.length - 1) {
        if (cur < groupPauseDuration) return 0;
        cur -= groupPauseDuration;
      }
    }
    return 0;
  }

  function draw(ts) {
    if (!cv) return;
    const t = ts / 1000;
    const g = cx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#03040c"); g.addColorStop(0.6, "#0a1026"); g.addColorStop(1, "#1a1530");
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);

    // voie lactée
    cx.save();
    cx.globalAlpha = 0.09;
    for (let i = 0; i < 14; i++) {
      const px = W * (i / 13), py = H * (0.75 - (i / 13) * 0.6);
      const rg = cx.createRadialGradient(px, py, 0, px, py, H * 0.22);
      rg.addColorStop(0, "#9fb4ff"); rg.addColorStop(1, "rgba(0,0,0,0)");
      cx.fillStyle = rg; cx.fillRect(px - H * 0.22, py - H * 0.22, H * 0.44, H * 0.44);
    }
    cx.restore();

    for (const s of stars) {
      const a = 0.45 + 0.55 * Math.abs(Math.sin(t * s.sp + s.tw));
      cx.fillStyle = "rgba(235,240,255," + a.toFixed(3) + ")";
      cx.fillRect(s.x * W, s.y * H, s.m, s.m);
    }
    if (Date.now() < (opts.extraStarsUntil || 0)) {
      if (!extraStars.length) genExtra();
      for (const s of extraStars) {
        const a = 0.6 + 0.4 * Math.abs(Math.sin(t * s.sp + s.tw));
        cx.fillStyle = "rgba(255,230,150," + a.toFixed(3) + ")";
        cx.fillRect(s.x * W, s.y * H, s.m, s.m);
      }
    }
    for (const s of NAMED) {
      cx.fillStyle = "#fff";
      cx.beginPath(); cx.arc(s.x * W, s.y * H, 1.7, 0, 7); cx.fill();
    }

    // la Lune
    const m = moonPos();
    const mg = cx.createRadialGradient(m.x, m.y, m.r * 0.5, m.x, m.y, m.r * 3);
    mg.addColorStop(0, "rgba(255,248,220,0.25)"); mg.addColorStop(1, "rgba(0,0,0,0)");
    cx.fillStyle = mg; cx.beginPath(); cx.arc(m.x, m.y, m.r * 3, 0, 7); cx.fill();
    cx.fillStyle = "#f3ead2"; cx.beginPath(); cx.arc(m.x, m.y, m.r, 0, 7); cx.fill();
    cx.fillStyle = "rgba(150,140,120,0.35)";
    [[-0.3, -0.2, 0.22], [0.25, 0.1, 0.16], [-0.05, 0.35, 0.12], [0.35, -0.35, 0.09]].forEach(([dx, dy, rr]) => {
      cx.beginPath(); cx.arc(m.x + dx * m.r, m.y + dy * m.r, rr * m.r, 0, 7); cx.fill();
    });
    // la lumière de la Base Vahl (clignote par groupes : 3, 5, 3 · 1, 5, 1)
    if (patternBlink(t, [3, 5, 3, 1, 5, 1], 0.38, 0.85, 3.2)) {
      cx.fillStyle = "rgba(255,240,180,0.95)";
      cx.beginPath(); cx.arc(m.x + m.r * 0.18, m.y - m.r * 0.05, 1.3, 0, 7); cx.fill();
    }

    // Kher (clignote par groupes selon le signal avant d'être décodée)
    const k = kherPos();
    const kherFlash = patternBlink(t, [3, 5, 3, 5, 5, 5, 3, 3, 3, 5, 1, 5, 2, 3, 2], 0.38, 0.85, 3.5);
    const pulse = opts.decoded ? (0.6 + 0.4 * Math.sin(t * 1.3)) : (0.25 + 0.75 * kherFlash);
    const size = 2 + opts.age * 0.35;
    const kg = cx.createRadialGradient(k.x, k.y, 0, k.x, k.y, size * 7);
    const col = opts.decoded ? "255,190,120" : "255,70,60";
    kg.addColorStop(0, "rgba(" + col + "," + (0.55 * pulse).toFixed(3) + ")"); kg.addColorStop(1, "rgba(0,0,0,0)");
    cx.fillStyle = kg; cx.beginPath(); cx.arc(k.x, k.y, size * 7, 0, 7); cx.fill();
    cx.fillStyle = opts.decoded ? "#ffd2a0" : "#ff6a5a";
    cx.beginPath(); cx.arc(k.x, k.y, size, 0, 7); cx.fill();

    // l’onde du signal
    const listening = Date.now() < opts.listenUntil;
    if (listening) {
      cx.save();
      cx.strokeStyle = "rgba(255,120,100,0.55)"; cx.lineWidth = 1.5;
      for (let j = 0; j < 3; j++) {
        cx.beginPath();
        for (let x = 0; x <= W; x += 4) {
          const y = H * 0.72 + Math.sin(x * 0.03 + t * 3 + j) * 10 * Math.sin(t * 0.9 + x * 0.004) + j * 6;
          x ? cx.lineTo(x, y) : cx.moveTo(x, y);
        }
        cx.stroke();
      }
      cx.restore();
    }

    // animations célestes (6.2)
    if (anims.length > 0) {
      const nowMs = Date.now();
      anims = anims.filter((a) => nowMs - a.t0 < a.dur);
      for (const a of anims) {
        const p = Math.min(1, Math.max(0, (nowMs - a.t0) / a.dur));
        if (a.type === "meteors") drawMeteors(a, p);
        else if (a.type === "constellation") drawConstellation(a, p);
        else if (a.type === "pulse") drawPulse(a, p);
        else if (a.type === "aurora") drawAurora(a, p);
      }
    }

    // horizon
    cx.fillStyle = "#06070c";
    cx.beginPath(); cx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) {
      const y = H * 0.86 - Math.sin(x * 0.012) * 10 - Math.sin(x * 0.041 + 1) * 6 - (Math.sin(x * 0.27) > 0.6 ? 14 : 0);
      cx.lineTo(x, y);
    }
    cx.lineTo(W, H); cx.closePath(); cx.fill();
    if (opts.dish) {
      const dx = W * 0.72, dy = H * 0.84;
      cx.strokeStyle = "#06070c"; cx.fillStyle = "#06070c"; cx.lineWidth = 3;
      cx.beginPath(); cx.moveTo(dx, dy); cx.lineTo(dx, dy - 22); cx.stroke();
      cx.beginPath(); cx.ellipse(dx - 6, dy - 30, 22, 9, -0.6, 0, Math.PI); cx.fill();
    }
    raf = root.requestAnimationFrame(draw);
  }

  function drawMeteors(a, p) {
    if (!cx) return;
    cx.save();
    const col = a.cfg.color || "#ffd27a";
    for (const m of a.meteors || []) {
      const mp = (p - m.delay) / (1 - m.delay);
      if (mp <= 0 || mp >= 1) continue;
      const alpha = mp < 0.2 ? mp / 0.2 : (1 - mp) / 0.8;
      const curDist = mp * Math.min(W, H) * 0.7 * m.speed;
      const headX = m.x0 * W + curDist * 0.8;
      const headY = m.y0 * H + curDist * 0.6;
      const tailX = headX - m.len * 0.8;
      const tailY = headY - m.len * 0.6;
      const grad = cx.createLinearGradient(tailX, tailY, headX, headY);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(1, col);
      cx.strokeStyle = grad;
      cx.lineWidth = m.w;
      cx.globalAlpha = Math.max(0, Math.min(1, alpha));
      cx.beginPath();
      cx.moveTo(tailX, tailY);
      cx.lineTo(headX, headY);
      cx.stroke();
    }
    cx.restore();
  }

  function drawConstellation(a, p) {
    if (!cx) return;
    cx.save();
    const alpha = p < 0.25 ? p / 0.25 : p > 0.75 ? (1 - p) / 0.25 : 1;
    cx.globalAlpha = Math.max(0, Math.min(1, alpha * 0.9));
    cx.strokeStyle = a.cfg.color || "#aaccff";
    cx.fillStyle = a.cfg.color || "#ffffff";
    cx.lineWidth = a.cfg.width || 1.8;
    // étoiles en [x, y] ou {x, y} ; segments en paires de points ou d’indices d’étoiles
    const pts = (a.cfg.stars || []).map((s) => (Array.isArray(s) ? s : [s.x, s.y]));
    const at = (q) => (typeof q === "number" ? pts[q] : q);
    for (const seg of a.cfg.lines || []) {
      const p0 = seg && at(seg[0]), p1 = seg && at(seg[1]);
      if (!p0 || !p1) continue;
      cx.beginPath();
      cx.moveTo(p0[0] * W, p0[1] * H);
      cx.lineTo(p1[0] * W, p1[1] * H);
      cx.stroke();
    }
    for (const pt of pts) {
      cx.beginPath();
      cx.arc(pt[0] * W, pt[1] * H, 3, 0, 7);
      cx.fill();
    }
    cx.restore();
  }

  function drawPulse(a, p) {
    if (!cx) return;
    cx.save();
    const center = a.cfg.target === "kher" ? kherPos() : a.cfg.target === "moon" ? moonPos() : { x: (a.cfg.x !== undefined ? a.cfg.x : 0.5) * W, y: (a.cfg.y !== undefined ? a.cfg.y : 0.4) * H };
    const maxR = Math.min(W, H) * (a.cfg.maxR || 0.45);
    const r = p * maxR;
    const alpha = (1 - p) * 0.75;
    cx.globalAlpha = Math.max(0, Math.min(1, alpha));
    cx.strokeStyle = a.cfg.color || "#ffd2a0";
    cx.lineWidth = 3 * (1 - p) + 1;
    cx.beginPath();
    cx.arc(center.x, center.y, r, 0, 7);
    cx.stroke();

    if (a.cfg.double || a.cfg.count === 2) {
      const p2 = Math.max(0, p - 0.25);
      if (p2 > 0) {
        const normP2 = p2 / 0.75;
        const r2 = normP2 * maxR;
        const alpha2 = (1 - normP2) * 0.75;
        cx.globalAlpha = Math.max(0, Math.min(1, alpha2));
        cx.lineWidth = 3 * (1 - normP2) + 1;
        cx.beginPath();
        cx.arc(center.x, center.y, r2, 0, 7);
        cx.stroke();
      }
    }
    cx.restore();
  }

  function drawAurora(a, p) {
    if (!cx) return;
    cx.save();
    const alpha = Math.sin(p * Math.PI) * 0.45;
    cx.globalAlpha = Math.max(0, Math.min(1, alpha));
    const grad = cx.createLinearGradient(0, H * 0.1, 0, H * 0.6);
    grad.addColorStop(0, "rgba(80, 255, 180, 0)");
    grad.addColorStop(0.5, a.cfg.color || "rgba(100, 240, 200, 0.45)");
    grad.addColorStop(1, "rgba(180, 100, 255, 0)");
    cx.fillStyle = grad;
    cx.beginPath();
    cx.moveTo(0, H * 0.6);
    for (let x = 0; x <= W; x += 16) {
      const wave = Math.sin(x * 0.015 + p * 8) * 20 + Math.cos(x * 0.03 - p * 5) * 12;
      cx.lineTo(x, H * 0.35 + wave);
    }
    cx.lineTo(W, H * 0.6);
    cx.closePath();
    cx.fill();
    cx.restore();
  }

  function resolveAnimConfig(animOrId) {
    if (!animOrId) return null;
    if (typeof animOrId === "object") return animOrId;
    const rec = (root.ECLAT_DATA && root.ECLAT_DATA.RECIT) || {};
    if (rec.skyAnims && rec.skyAnims[animOrId]) return rec.skyAnims[animOrId];
    if (animOrId === "filantes" || animOrId === "meteors") return { type: "meteors", dur: 3.5, count: 12 };
    if (animOrId === "pulse") return { type: "pulse", dur: 2.5 };
    if (animOrId === "aurora") return { type: "aurora", dur: 6 };
    return { type: animOrId, dur: 3 };
  }

  Sky.playAnim = function (config) {
    const cfg = resolveAnimConfig(config);
    if (!cfg) return null;
    const nowMs = Date.now();
    const durMs = (cfg.dur || 3) * 1000;
    const item = {
      cfg,
      type: cfg.type || "meteors",
      t0: nowMs,
      queued: nowMs,
      shown: !!cv, // jouée hors du ciel : elle attend qu’on l’ouvre
      dur: durMs
    };
    if (item.type === "meteors") {
      const cnt = cfg.count || 10;
      item.meteors = [];
      for (let i = 0; i < cnt; i++) {
        item.meteors.push({
          delay: Math.random() * 0.6,
          speed: 0.6 + Math.random() * 0.8,
          x0: 0.05 + Math.random() * 0.8,
          y0: Math.random() * 0.35,
          len: 40 + Math.random() * 60,
          w: 1.5 + Math.random() * 1.5
        });
      }
    }
    anims.push(item);
    return item;
  };

  Sky.trigger = (animId) => Sky.playAnim(animId);
  Sky.anims = () => anims;
  Sky.clearAnims = () => { anims = []; };
  Sky.boostStars = function (durationMs) {
    opts.extraStarsUntil = Date.now() + (durationMs || 60000);
    if (!extraStars.length) genExtra();
  };
  Sky.isBoosted = () => Date.now() < (opts.extraStarsUntil || 0);

  Sky.mount = function (canvas, o) {
    Sky.unmount();
    cv = canvas; cx = cv.getContext("2d");
    Object.assign(opts, o || {});
    resize(); if (!stars.length) gen();
    // les animations jouées ailleurs (la flûte est dans le Journal) partent à l’ouverture du ciel
    const t = Date.now();
    // celles qui tournaient continuent (le Cosmos se redessine souvent) ; les autres démarrent
    anims = anims.filter((a) => (a.shown ? t - a.t0 < a.dur : t - a.queued < 10 * 60000));
    for (const a of anims) if (!a.shown) { a.t0 = t; a.shown = true; }
    raf = root.requestAnimationFrame(draw);
    root.addEventListener("resize", resize);
  };
  Sky.unmount = function () {
    if (raf && root.cancelAnimationFrame) root.cancelAnimationFrame(raf);
    raf = 0; cv = null; cx = null;
    if (root.removeEventListener) root.removeEventListener("resize", resize);
  };
  Sky.set = (o) => Object.assign(opts, o);
  Sky.mounted = () => !!cv;

  /* Que se trouve-t-il sous le doigt ? */
  Sky.hit = function (x, y) {
    const m = moonPos();
    if (Math.hypot(x - m.x, y - m.y) < m.r * 1.3) return { k: "moon" };
    const k = kherPos();
    if (Math.hypot(x - k.x, y - k.y) < 24) return { k: "kher" };
    for (const s of NAMED) if (Math.hypot(x - s.x * W, y - s.y * H) < 16) return { k: "star", n: s.n };
    return null;
  };

  root.EclatSky = Sky;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Sky;
  }
})(typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this));
