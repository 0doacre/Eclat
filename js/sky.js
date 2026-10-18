/* ÉCLAT — le ciel nocturne (canvas). */
(function (root) {
  "use strict";
  const Sky = {};
  let cv = null, cx = null, raf = 0, W = 0, H = 0, stars = [];
  const opts = { age: 0, dish: false, listenUntil: 0, decoded: false };
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

  const moonPos = () => ({ x: W * 0.8, y: H * 0.2, r: Math.max(16, Math.min(W, H) * 0.075) });
  const kherPos = () => ({ x: W * 0.16, y: H * 0.5 });

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
    // la lumière de la Base Vahl
    if (Math.floor(t * 1.4) % 4 === 0) {
      cx.fillStyle = "rgba(255,240,180,0.9)";
      cx.beginPath(); cx.arc(m.x + m.r * 0.18, m.y - m.r * 0.05, 1.2, 0, 7); cx.fill();
    }

    // Kher
    const k = kherPos();
    const pulse = 0.6 + 0.4 * Math.sin(t * 1.3);
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

  Sky.mount = function (canvas, o) {
    Sky.unmount();
    cv = canvas; cx = cv.getContext("2d");
    Object.assign(opts, o || {});
    resize(); if (!stars.length) gen();
    raf = root.requestAnimationFrame(draw);
    root.addEventListener("resize", resize);
  };
  Sky.unmount = function () {
    if (raf) root.cancelAnimationFrame(raf);
    raf = 0; cv = null;
    root.removeEventListener("resize", resize);
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
})(window);
