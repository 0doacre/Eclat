/* ÉCLAT — sons synthétisés avec WebAudio (aucun fichier à charger). */
(function (root) {
  "use strict";
  const A = {};
  let ctx = null, master = null, enabled = true, noiseBuf = null;
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0]; // do ré mi sol la

  A.init = function () {
    try {
      if (!ctx) {
        const AC = root.AudioContext || root.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.55;
        const comp = ctx.createDynamicsCompressor();
        master.connect(comp);
        comp.connect(ctx.destination);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === "suspended") ctx.resume();
    } catch (e) { ctx = null; }
  };
  A.setEnabled = (v) => { enabled = !!v; };
  const ready = () => enabled && ctx && ctx.state === "running";

  function tone(o) {
    const t0 = ctx.currentTime + (o.t || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(o.f || 440, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t0 + (o.d || 0.2));
    if (o.det) osc.detune.value = o.det;
    const v = o.v || 0.2, a = o.a || 0.005, d = o.d || 0.2;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    let node = osc;
    if (o.vib) {
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = o.vib; lg.gain.value = o.vibd || 6;
      lfo.connect(lg); lg.connect(osc.frequency);
      lfo.start(t0); lfo.stop(t0 + a + d + 0.05);
    }
    if (o.lp) {
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = o.lp;
      node.connect(f); node = f;
    }
    node.connect(g);
    g.connect(o.out || master);
    osc.start(t0);
    osc.stop(t0 + a + d + 0.05);
  }

  function noise(o) {
    const t0 = ctx.currentTime + (o.t || 0);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = o.ft || "bandpass";
    f.frequency.setValueAtTime(o.f || 1000, t0);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t0 + (o.d || 0.2));
    f.Q.value = o.q || 1;
    const g = ctx.createGain();
    const v = o.v || 0.2, a = o.a || 0.005, d = o.d || 0.2;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0, Math.random() * 0.5);
    src.stop(t0 + a + d + 0.05);
  }

  A.tap = function (k) {
    if (!ready()) return;
    const f = 380 + ((k || 0) % 7) * 40 + Math.random() * 30;
    tone({ f, f2: f * 0.7, type: "triangle", d: 0.07, v: 0.09 });
    noise({ f: 1800, d: 0.04, v: 0.04, q: 2 });
  };

  const CRAFT = {
    assembler: () => { tone({ f: 180, f2: 120, type: "triangle", d: 0.12, v: 0.25 }); tone({ f: 260, f2: 200, type: "triangle", t: 0.09, d: 0.1, v: 0.18 }); },
    tresser: () => { noise({ f: 2500, f2: 900, d: 0.25, v: 0.12, q: 3 }); noise({ f: 1800, f2: 3000, t: 0.12, d: 0.2, v: 0.08, q: 3 }); },
    tailler: () => { noise({ f: 3500, d: 0.05, v: 0.3, q: 4 }); tone({ f: 1400, f2: 700, type: "square", d: 0.04, v: 0.06 }); noise({ f: 2600, t: 0.08, d: 0.05, v: 0.2, q: 4 }); },
    chauffer: () => { noise({ ft: "lowpass", f: 400, f2: 1600, d: 0.6, v: 0.25, a: 0.08 }); tone({ f: 90, f2: 140, d: 0.5, v: 0.15, a: 0.05 }); },
    marteler: () => { [0, 0.11].forEach((t) => { [1, 2.76, 5.4, 8.9].forEach((m, i) => tone({ f: 330 * m, type: "sine", t, d: 0.5 / (i + 1), v: 0.18 / (i + 1) })); noise({ f: 4000, t, d: 0.03, v: 0.2 }); }); },
    allier: () => { for (let i = 0; i < 6; i++) tone({ f: 300 + Math.random() * 500, f2: 900 + Math.random() * 400, t: i * 0.06, d: 0.06, v: 0.08 }); noise({ ft: "lowpass", f: 600, d: 0.4, v: 0.12 }); },
    tremper: () => { noise({ ft: "highpass", f: 3000, f2: 6000, d: 0.7, v: 0.22, a: 0.01 }); tone({ f: 200, f2: 80, d: 0.2, v: 0.1 }); },
    usiner: () => { tone({ f: 110, type: "sawtooth", d: 0.45, v: 0.08, lp: 900, vib: 22, vibd: 10 }); tone({ f: 220, type: "square", d: 0.4, v: 0.04, lp: 1500 }); },
    electriser: () => { tone({ f: 60, f2: 1800, type: "sawtooth", d: 0.25, v: 0.12, lp: 4000 }); noise({ f: 5000, d: 0.15, v: 0.15, q: 0.5 }); },
    graver: () => { [0, 1, 2, 3].forEach((i) => tone({ f: 1200 + i * 220, type: "square", t: i * 0.05, d: 0.04, v: 0.05 })); },
    synthetiser: () => { for (let i = 0; i < 8; i++) tone({ f: 200 + Math.random() * 300, f2: 600 + Math.random() * 600, t: i * 0.05, d: 0.08, v: 0.06 }); },
    stratifier: () => { tone({ f: 70, f2: 50, d: 0.3, v: 0.3 }); noise({ ft: "lowpass", f: 300, d: 0.25, v: 0.2 }); },
    transmuter: () => { [1, 1.25, 1.5, 2, 2.5].forEach((m, i) => tone({ f: 330 * m, t: i * 0.04, d: 0.9, v: 0.06, vib: 5, vibd: 4 })); noise({ f: 6000, f2: 2000, d: 0.8, v: 0.06, a: 0.2 }); },
    accorder: () => { [1, 1.5, 2].forEach((m, i) => tone({ f: 440 * m, t: i * 0.08, d: 1.4, v: 0.08, vib: 4.5, vibd: 3 })); }
  };
  A.craft = function (g) { if (ready()) (CRAFT[g] || CRAFT.assembler)(); };

  A.discover = function () {
    if (!ready()) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ f, type: "triangle", t: i * 0.08, d: 0.5, v: 0.12 }));
    tone({ f: 1567.98, t: 0.32, d: 0.8, v: 0.05, vib: 6 });
  };
  A.secret = function () {
    if (!ready()) return;
    [659.25, 830.61, 987.77, 1318.5, 1661.2].forEach((f, i) => tone({ f, t: i * 0.11, d: 1.2, v: 0.07, vib: 5, vibd: 4 }));
  };
  A.fail = function (temp) {
    if (!ready()) return;
    const f = 110 + (temp || 0) * 55;
    tone({ f, f2: f * 0.8, type: "triangle", d: 0.25, v: 0.15 });
  };
  A.age = function () {
    if (!ready()) return;
    [65.4, 98, 130.8, 196].forEach((f, i) => tone({ f, type: i ? "sine" : "triangle", d: 2.2, v: 0.14 / (i + 1), a: 0.02 }));
    [523.25, 783.99].forEach((f, i) => tone({ f, t: 0.3 + i * 0.2, d: 1.5, v: 0.05 }));
  };
  A.note = function (n, t) {
    if (!ready()) return;
    const f = PENTA[(n - 1) % 5];
    tone({ f, t: t || 0, d: 0.55, a: 0.04, v: 0.16, vib: 5.2, vibd: 5 });
    tone({ f: f * 2, t: t || 0, d: 0.4, a: 0.05, v: 0.025 });
    noise({ f: f * 2, t: t || 0, d: 0.25, v: 0.025, q: 8, a: 0.03 });
  };
  A.melody = function (notes, gap) {
    notes.forEach((n, i) => A.note(n, i * (gap || 0.42)));
  };
  /* Le signal de Kher : la berceuse, ralentie, désaccordée, lointaine. */
  A.signal = function () {
    if (!ready()) return;
    const notes = [4, 3, 1, 3, 4, 5, 4];
    notes.forEach((n, i) => {
      const f = PENTA[n - 1] / 2;
      tone({ f, t: i * 0.9, d: 1.1, a: 0.25, v: 0.07, type: "sine", vib: 0.7, vibd: 18 });
      tone({ f: f * 1.007, t: i * 0.9, d: 1.1, a: 0.25, v: 0.05, type: "triangle", det: 30 });
      noise({ f: 900 + n * 120, t: i * 0.9, d: 1, v: 0.025, q: 0.6, a: 0.3 });
    });
  };
  A.ending = function () {
    if (!ready()) return;
    [130.8, 196, 261.6, 329.6, 392].forEach((f, i) => tone({ f, t: i * 0.3, d: 5, a: 0.8, v: 0.06, vib: 0.3, vibd: 2 }));
  };
  A.pip = function () {
    if (!ready()) return;
    tone({ f: 1800, f2: 2600, type: "square", d: 0.05, v: 0.03 });
    tone({ f: 2400, f2: 3200, type: "square", t: 0.07, d: 0.05, v: 0.03 });
  };
  A.click = function () { if (ready()) tone({ f: 900, type: "triangle", d: 0.03, v: 0.05 }); };

  root.EclatAudio = A;
})(window);
