/* ÉCLAT — le son, entièrement synthétisé avec WebAudio (aucun fichier à charger).
 * Trois voies : les effets, la musique (générée, elle change avec les âges) et
 * l’ambiance (le vent, l’eau, les oiseaux, les machines…, selon l’endroit). */
(function (root) {
  "use strict";
  const A = {};
  let ctx = null, master = null, sfxBus = null, musicBus = null, ambBus = null, verb = null, noiseBuf = null;
  let enabled = true;
  const vol = { music: 0.5, amb: 0.6, sfx: 0.8 };
  const scene = { age: 0, zone: "lisiere", tab: "domaine", night: false, machines: 0 };
  const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0]; // do ré mi sol la (la flûte)

  /* ------------------------------------------------------------ mise en route */
  A.init = function () {
    try {
      if (!ctx) {
        const AC = root.AudioContext || root.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = enabled ? 0.9 : 0;
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
        master.connect(comp);
        comp.connect(ctx.destination);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        // réverbération : une salle synthétique
        verb = ctx.createConvolver();
        verb.buffer = impulse(2.6, 2.4);
        const verbOut = ctx.createGain();
        verbOut.gain.value = 0.5;
        verb.connect(verbOut); verbOut.connect(master);
        sfxBus = bus(vol.sfx, 0.12);
        musicBus = bus(vol.music, 0.55);
        ambBus = bus(vol.amb, 0.25);
        if (typeof document !== "undefined") {
          document.addEventListener("visibilitychange", () => {
            if (!ctx) return;
            if (document.hidden) ctx.suspend(); else if (enabled) ctx.resume();
          });
        }
      }
      if (ctx.state === "suspended" && (typeof document === "undefined" || !document.hidden)) ctx.resume();
      if (enabled) { startMusic(); ambience(); }
    } catch (e) { ctx = null; }
  };
  function bus(v, send) {
    const g = ctx.createGain();
    g.gain.value = v;
    g.connect(master);
    const s = ctx.createGain();
    s.gain.value = send;
    g.connect(s); s.connect(verb);
    return g;
  }
  function impulse(dur, decay) {
    const n = Math.floor(ctx.sampleRate * dur), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return b;
  }
  const ready = () => enabled && ctx && ctx.state === "running";
  const ramp = (p, v, t) => { p.cancelScheduledValues(ctx.currentTime); p.setTargetAtTime(v, ctx.currentTime, t || 0.2); };

  A.setEnabled = (v) => {
    enabled = !!v;
    if (!ctx) return;
    ramp(master.gain, enabled ? 0.9 : 0, 0.15);
    if (enabled) { if (ctx.state === "suspended") ctx.resume(); startMusic(); ambience(); }
    else { stopMusic(); stopAmb(); workStop(); }
  };
  A.setVolumes = (o) => {
    Object.assign(vol, o || {});
    if (!ctx) return;
    ramp(sfxBus.gain, vol.sfx); ramp(musicBus.gain, vol.music); ramp(ambBus.gain, vol.amb);
    if (vol.music > 0) startMusic(); else stopMusic();
  };
  /* où en est le joueur : l’âge choisit la musique, l’endroit choisit l’ambiance */
  A.setScene = (o) => {
    const before = scene.age;
    Object.assign(scene, o || {});
    if (!ready()) return;
    if (palette(before) !== palette(scene.age)) { barsLeft = 0; }
    ambience();
  };
  /* le geste de la commande en cours (ou rien) : l’atelier au travail */
  A.work = (g) => workUpdate(g);

  /* ------------------------------------------------------------ briques */
  function tone(o) {
    const t0 = ctx.currentTime + (o.t || 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = o.type || "sine";
    osc.frequency.setValueAtTime(o.f || 440, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t0 + (o.fd || o.d || 0.2));
    if (o.det) osc.detune.value = o.det;
    const v = o.v || 0.2, a = o.a || 0.005, d = o.d || 0.2;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(v, t0 + a);
    if (o.hold) g.gain.setValueAtTime(v, t0 + a + o.hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + (o.hold || 0) + d);
    let node = osc;
    if (o.vib) {
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = o.vib; lg.gain.value = o.vibd || 6;
      lfo.connect(lg); lg.connect(osc.frequency);
      lfo.start(t0); lfo.stop(t0 + a + (o.hold || 0) + d + 0.05);
    }
    if (o.lp) {
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = o.lp; f.Q.value = o.lq || 0.7;
      node.connect(f); node = f;
    }
    if (o.pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = o.pan; node.connect(p); node = p; }
    node.connect(g);
    g.connect(o.out || sfxBus);
    osc.start(t0);
    osc.stop(t0 + a + (o.hold || 0) + d + 0.05);
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
    let node = g;
    if (o.pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = o.pan; g.connect(p); node = p; }
    src.connect(f); f.connect(g); node.connect(o.out || sfxBus);
    src.start(t0, Math.random() * 1.5);
    src.stop(t0 + a + d + 0.05);
  }
  /* une cloche : des partiels inharmoniques */
  function bell(f, o) {
    o = o || {};
    [1, 2.76, 5.4, 8.93].forEach((m, i) => tone({ f: f * m, t: o.t, d: (o.d || 1.2) / (i + 1), v: (o.v || 0.06) / (i + 1.2), out: o.out, pan: o.pan }));
  }

  /* ------------------------------------------------------------ récolte */
  const MAT = {
    bois: "wood", fibre: "plant", os: "bone", cuir: "hide", argile: "soil", sable: "sand", charbon: "coal",
    petrole: "liquid", helium3: "gas", resonite: "crystal", quartz: "crystal",
    malachite: "ore", cassiterite: "ore", fer_min: "ore", bauxite: "ore", ilmenite: "ore", terres_rares: "ore", metal_mercure: "ore", debris: "ore"
  };
  const TAP = {
    wood: (p) => { tone({ f: 210 * p, f2: 140 * p, type: "triangle", d: 0.09, v: 0.16 }); noise({ f: 900, d: 0.05, v: 0.08, q: 3 }); },
    plant: (p) => { noise({ f: 3200 * p, f2: 2200, d: 0.12, v: 0.09, q: 0.8 }); noise({ f: 5000, t: 0.04, d: 0.06, v: 0.04, q: 1 }); },
    stone: (p) => { noise({ ft: "highpass", f: 2400, d: 0.035, v: 0.16 }); tone({ f: 700 * p, f2: 500, type: "square", d: 0.03, v: 0.04, lp: 2500 }); },
    ore: (p) => { noise({ ft: "highpass", f: 2800, d: 0.03, v: 0.14 }); bell(620 * p, { d: 0.35, v: 0.05 }); },
    bone: (p) => { tone({ f: 520 * p, f2: 380, type: "triangle", d: 0.06, v: 0.12 }); noise({ f: 1600, d: 0.04, v: 0.07, q: 2 }); },
    hide: () => { noise({ ft: "lowpass", f: 500, d: 0.09, v: 0.16 }); },
    soil: (p) => { noise({ ft: "lowpass", f: 900 * p, f2: 300, d: 0.12, v: 0.14 }); },
    sand: () => { noise({ ft: "highpass", f: 3000, f2: 6000, d: 0.18, v: 0.06, a: 0.02 }); },
    coal: (p) => { noise({ f: 1500 * p, d: 0.05, v: 0.1, q: 2 }); noise({ f: 2600, t: 0.04, d: 0.03, v: 0.06, q: 3 }); },
    liquid: (p) => { tone({ f: 260 * p, f2: 620 * p, d: 0.09, v: 0.12 }); },
    gas: (p) => { noise({ f: 1200 * p, f2: 2600, d: 0.2, v: 0.05, q: 4, a: 0.03 }); },
    crystal: (p) => { bell(1320 * p, { d: 0.6, v: 0.05 }); }
  };
  A.tap = function (id) {
    if (!ready()) return;
    const m = MAT[id] || (id === "caillou" || id === "silex" || id === "regolithe" ? "stone" : "stone");
    TAP[m] ? TAP[m](0.92 + Math.random() * 0.16) : TAP.stone(1);
  };

  /* ------------------------------------------------------------ gestes */
  const CRAFT = {
    assembler: () => { tone({ f: 180, f2: 120, type: "triangle", d: 0.12, v: 0.25 }); tone({ f: 260, f2: 200, type: "triangle", t: 0.09, d: 0.1, v: 0.18 }); noise({ f: 700, t: 0.09, d: 0.05, v: 0.06 }); },
    tresser: () => { noise({ f: 2500, f2: 900, d: 0.25, v: 0.12, q: 3, pan: -0.3 }); noise({ f: 1800, f2: 3000, t: 0.12, d: 0.2, v: 0.08, q: 3, pan: 0.3 }); },
    tailler: () => { noise({ f: 3500, d: 0.05, v: 0.3, q: 4 }); tone({ f: 1400, f2: 700, type: "square", d: 0.04, v: 0.06 }); noise({ f: 2600, t: 0.08, d: 0.05, v: 0.2, q: 4 }); },
    chauffer: () => { noise({ ft: "lowpass", f: 400, f2: 1600, d: 0.6, v: 0.25, a: 0.08 }); tone({ f: 90, f2: 140, d: 0.5, v: 0.15, a: 0.05 }); for (let i = 0; i < 4; i++) noise({ f: 3000 + Math.random() * 3000, t: 0.1 + Math.random() * 0.4, d: 0.02, v: 0.05, q: 6 }); },
    marteler: () => { [0, 0.11].forEach((t) => { bell(330, { t, d: 0.5, v: 0.16 }); noise({ f: 4000, t, d: 0.03, v: 0.2 }); }); },
    allier: () => { for (let i = 0; i < 6; i++) tone({ f: 300 + Math.random() * 500, f2: 900 + Math.random() * 400, t: i * 0.06, d: 0.06, v: 0.08 }); noise({ ft: "lowpass", f: 600, d: 0.4, v: 0.12 }); },
    tremper: () => { noise({ ft: "highpass", f: 3000, f2: 6000, d: 0.7, v: 0.22, a: 0.01 }); tone({ f: 200, f2: 80, d: 0.2, v: 0.1 }); },
    usiner: () => { tone({ f: 110, type: "sawtooth", d: 0.45, v: 0.08, lp: 900, vib: 22, vibd: 10 }); tone({ f: 220, type: "square", d: 0.4, v: 0.04, lp: 1500 }); },
    electriser: () => { tone({ f: 60, f2: 1800, type: "sawtooth", d: 0.25, v: 0.12, lp: 4000 }); noise({ f: 5000, d: 0.15, v: 0.15, q: 0.5 }); },
    graver: () => { [0, 1, 2, 3].forEach((i) => tone({ f: 1200 + i * 220, type: "square", t: i * 0.05, d: 0.04, v: 0.05, lp: 5000 })); },
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
    bell(2093, { t: 0.34, d: 1.2, v: 0.03 });
  };
  A.secret = function () {
    if (!ready()) return;
    [659.25, 830.61, 987.77, 1318.5, 1661.2].forEach((f, i) => tone({ f, t: i * 0.11, d: 1.2, v: 0.07, vib: 5, vibd: 4 }));
  };
  A.fail = function (temp) {
    if (!ready()) return;
    const f = 110 + (temp || 0) * 55;
    tone({ f, f2: f * 0.8, type: "triangle", d: 0.25, v: 0.15 });
    if (temp >= 3) tone({ f: f * 1.5, t: 0.08, d: 0.2, v: 0.06 });
  };
  A.age = function () {
    if (!ready()) return;
    [65.4, 98, 130.8, 196].forEach((f, i) => tone({ f, type: i ? "sine" : "triangle", d: 2.2, v: 0.14 / (i + 1), a: 0.02 }));
    [523.25, 783.99, 1046.5].forEach((f, i) => tone({ f, t: 0.3 + i * 0.2, d: 1.5, v: 0.05 }));
    noise({ ft: "lowpass", f: 200, f2: 1200, d: 1.4, v: 0.08, a: 0.4 });
  };
  A.note = function (n, t) {
    if (!ready()) return;
    const f = PENTA[(n - 1) % 5];
    tone({ f, t: t || 0, d: 0.55, a: 0.04, v: 0.16, vib: 5.2, vibd: 5 });
    tone({ f: f * 2, t: t || 0, d: 0.4, a: 0.05, v: 0.025 });
    noise({ f: f * 2, t: t || 0, d: 0.25, v: 0.025, q: 8, a: 0.03 });
  };
  A.melody = function (notes, gap) { notes.forEach((n, i) => A.note(n, i * (gap || 0.42))); };
  /* les suites du récit (brouillées dans js/recit.js) : « 353-151 » → [[3,5,3],[1,5,1]] */
  function suite(k) {
    const D = root.ECLAT_DATA, R = D && D.RECIT;
    if (!R || !R.ciel || !R.ciel[k] || !R.deb64) return [];
    return R.deb64(R.ciel[k]).split("-").map((ph) => ph.split("").map(Number));
  }
  /* Le signal de Kher : ce que clignote la lueur, ralenti, désaccordé, lointain. */
  A.signal = function () {
    if (!ready()) return;
    duck(9);
    let t = 0;
    suite("lueur").forEach((ph) => {
      ph.forEach((n) => {
        const f = PENTA[n - 1] / 2;
        tone({ f, t, d: 0.9, a: 0.2, v: 0.07, type: "sine", vib: 0.7, vibd: 18 });
        tone({ f: f * 1.007, t, d: 0.9, a: 0.2, v: 0.05, type: "triangle", det: 30 });
        noise({ f: 900 + n * 120, t, d: 0.8, v: 0.025, q: 0.6, a: 0.3 });
        t += 0.6;
      });
      t += 1.4; // la longue pause entre les deux phrases
    });
  };
  A.ending = function (eid) {
    if (!ready()) return;
    duck(12);
    if (eid === "aube") {
      [130.81, 196.0, 261.63, 329.63, 392.0, 523.25, 659.25].forEach((f, i) =>
        tone({ f, t: i * 0.38, d: 5.5, a: 0.5, v: 0.05, type: "sine", vib: 0.3, vibd: 2 }));
    } else if (eid === "brasier") {
      [65.4, 98.0, 130.81, 164.81].forEach((f, i) =>
        tone({ f, t: i * 0.28, d: 6.5, a: 0.7, v: 0.06, type: "triangle", vib: 0.5, vibd: 4 }));
      noise({ ft: "lowpass", f: 220, t: 0.3, d: 3.5, v: 0.035, a: 0.8 });
    } else if (eid === "retour") {
      // les quatre premières notes de la comptine, puis la cloche répond
      const c = (suite("matines")[0] || []);
      c.forEach((n, i) => tone({ f: PENTA[n - 1], t: i * 0.5, d: 0.6, a: 0.04, v: 0.12, vib: 5.2, vibd: 5 }));
      const t0 = c.length * 0.5 + 0.4;
      [261.63, 329.63, 392.0, 523.25, 659.25].forEach((f, i) => {
        bell(f, { t: t0 + i * 0.45, d: 4.5, v: 0.055 });
        tone({ f: f / 2, t: t0 + i * 0.45, d: 5.5, a: 0.4, v: 0.035, type: "sine" });
      });
    } else if (eid === "exode") {
      [174.61, 261.63, 392.0, 587.33, 880.0].forEach((f, i) =>
        tone({ f, f2: f * 1.012, t: i * 0.42, d: 5.5, a: 0.6, v: 0.045, type: "sine", vib: 0.5, vibd: 3 }));
      noise({ ft: "bandpass", f: 1100, t: 0.2, d: 5.0, v: 0.025, q: 2 });
    } else if (eid === "silence") {
      [392.0, 329.63, 261.63, 196.0, 130.81].forEach((f, i) =>
        tone({ f, t: i * 0.5, d: 4.8, a: 0.4, v: 0.045 * (1 - i * 0.16), type: "sine" }));
      noise({ ft: "lowpass", f: 380, t: 1.2, d: 3.8, v: 0.02, a: 0.5 });
    } else {
      [130.8, 196, 261.6, 329.6, 392].forEach((f, i) => tone({ f, t: i * 0.3, d: 5, a: 0.8, v: 0.06, vib: 0.3, vibd: 2 }));
    }
  };
  A.pip = function () {
    if (!ready()) return;
    tone({ f: 1800, f2: 2600, type: "square", d: 0.05, v: 0.03, lp: 6000 });
    tone({ f: 2400, f2: 3200, type: "square", t: 0.07, d: 0.05, v: 0.03, lp: 6000 });
  };
  A.click = function () { if (ready()) tone({ f: 900, type: "triangle", d: 0.03, v: 0.05 }); };
  A.tick = function () { if (ready()) tone({ f: 1300 + Math.random() * 200, type: "triangle", d: 0.018, v: 0.03 }); };
  A.place = function () { if (!ready()) return; tone({ f: 160, f2: 110, type: "triangle", d: 0.12, v: 0.2 }); noise({ f: 1200, d: 0.06, v: 0.1, q: 2 }); tone({ f: 640, t: 0.05, d: 0.08, v: 0.04 }); };
  A.remove = function () { if (!ready()) return; noise({ f: 900, f2: 300, d: 0.18, v: 0.12, q: 1.5 }); tone({ f: 240, f2: 120, type: "triangle", d: 0.12, v: 0.08 }); };
  A.err = function () { if (ready()) { tone({ f: 220, type: "square", d: 0.08, v: 0.04, lp: 1200 }); tone({ f: 180, type: "square", t: 0.09, d: 0.1, v: 0.04, lp: 1200 }); } };
  A.page = function () { if (ready()) noise({ f: 2400, f2: 1200, d: 0.22, v: 0.05, q: 0.7, a: 0.03 }); };
  A.explore = function () { if (!ready()) return; for (let i = 0; i < 4; i++) noise({ ft: "lowpass", f: 500, t: i * 0.28, d: 0.08, v: 0.12 }); };
  A.found = function () { if (!ready()) return; bell(880, { d: 1.4, v: 0.07 }); bell(1318.5, { t: 0.18, d: 1.6, v: 0.05 }); };

  /* la musique se fait discrète le temps d’un moment important */
  function duck(sec) {
    if (!ctx) return;
    const g = musicBus.gain, t = ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(vol.music * 0.15, t, 0.3);
    g.setTargetAtTime(vol.music, t + sec, 1.5);
  }

  /* ------------------------------------------------------------ musique
   * Une musique générée, qui suit les âges : un mode, des accords tenus, une
   * mélodie qui reprend ses motifs, des percussions légères. Elle joue un moment,
   * se tait, puis revient. */
  const MODES = { dorian: [0, 2, 3, 5, 7, 9, 10], aeolian: [0, 2, 3, 5, 7, 8, 10], mixo: [0, 2, 4, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11] };
  const PALS = [
    { root: 146.83, mode: "dorian", prog: [0, 3, 0, 6], beat: 0.78, lead: "flute", pad: "warm", perc: "drum", dens: 0.42 },
    { root: 164.81, mode: "aeolian", prog: [0, 5, 2, 6], beat: 0.7, lead: "lyre", pad: "warm", perc: "drum", dens: 0.5 },
    { root: 130.81, mode: "mixo", prog: [0, 6, 3, 0], beat: 0.62, lead: "bell", pad: "string", perc: "tick", dens: 0.42 },
    { root: 110.0, mode: "aeolian", prog: [0, 3, 4, 0], beat: 0.46, lead: "synth", pad: "string", perc: "tick", dens: 0.62 },
    { root: 174.61, mode: "lydian", prog: [0, 1, 0, 4], beat: 0.95, lead: "glass", pad: "space", perc: null, dens: 0.3 }
  ];
  const palette = (age) => (age <= 2 ? 0 : age <= 5 ? 1 : age <= 8 ? 2 : age <= 11 ? 3 : 4);
  let musicTimer = null, nextT = 0, beat = 0, barsLeft = 0, resting = 0, motif = null, melPos = 2, barOn = false;
  const semi = (f, s) => f * Math.pow(2, s / 12);
  function noteOf(P, deg, oct) {
    const m = MODES[P.mode], n = m.length;
    const o = Math.floor(deg / n);
    return semi(P.root, m[((deg % n) + n) % n] + 12 * (o + (oct || 0)));
  }
  function startMusic() {
    if (!ctx || musicTimer || vol.music <= 0 || !enabled) return;
    nextT = ctx.currentTime + 0.3;
    beat = 0; barsLeft = 0; resting = 1; barOn = false;
    musicTimer = setInterval(schedule, 200);
  }
  function stopMusic() { clearInterval(musicTimer); musicTimer = null; }
  function schedule() {
    if (!ready()) return;
    while (nextT < ctx.currentTime + 0.7) {
      playBeat(nextT);
      nextT += PALS[palette(scene.age)].beat;
      beat++;
    }
  }
  function playBeat(t) {
    const P = PALS[palette(scene.age)], b = beat % 4;
    const dt = Math.max(0, t - ctx.currentTime);
    if (b === 0) {
      if (resting > 0) { resting--; barOn = false; if (!resting) { barsLeft = 16 + Math.floor(Math.random() * 12); motif = null; } }
      else if (barsLeft <= 0) { resting = 6 + Math.floor(Math.random() * 6); barOn = false; }
      else { barsLeft--; barOn = true; }
    }
    if (!barOn) return;
    const bar = Math.floor(beat / 4), deg = P.prog[bar % P.prog.length];
    const len = P.beat * 4;
    if (b === 0) {
      pad(P, deg, dt, len);
      tone({ f: noteOf(P, deg, -1), t: dt, a: 0.05, d: len * 0.9, v: 0.06, type: "triangle", lp: 400, out: musicBus });
      if (bar % 2 === 0 || !motif) motif = makeMotif(P, deg);
    }
    // percussions
    if (P.perc === "drum" && (b === 0 || (b === 2 && Math.random() < 0.5))) tone({ f: 95, f2: 55, t: dt, d: 0.28, v: b ? 0.05 : 0.08, out: musicBus });
    if (P.perc === "tick") { noise({ ft: "highpass", f: 6000, t: dt, d: 0.03, v: b % 2 ? 0.015 : 0.025, out: musicBus }); if (b === 0) tone({ f: 70, f2: 45, t: dt, d: 0.2, v: 0.05, out: musicBus }); }
    // mélodie : le motif, varié une mesure sur deux
    let n = motif[b];
    if (bar % 2 === 1 && b === 3 && n !== null) n += Math.random() < 0.5 ? 1 : -1;
    if (n !== null) lead(P, n, dt);
    if (P.lead === "synth" && Math.random() < 0.6) lead(P, deg + [0, 2, 4, 7][(b + 1) % 4], dt + P.beat / 2, 0.5);
  }
  function makeMotif(P, deg) {
    const m = [];
    for (let i = 0; i < 4; i++) {
      if (Math.random() > P.dens && i) { m.push(null); continue; }
      melPos += Math.round((Math.random() - 0.5) * 3);
      if (i === 0) melPos = deg + [0, 2, 4][Math.floor(Math.random() * 3)];
      melPos = Math.max(-1, Math.min(9, melPos));
      m.push(7 + melPos);
    }
    return m;
  }
  function pad(P, deg, t, len) {
    const notes = [noteOf(P, deg), noteOf(P, deg + 2), noteOf(P, deg + 4)];
    const kind = { warm: { type: "triangle", lp: 900 }, string: { type: "sawtooth", lp: 650 }, space: { type: "sine", lp: 3000 } }[P.pad];
    notes.forEach((f, i) => {
      tone({ f, t, a: len * 0.3, hold: len * 0.35, d: len * 0.7, v: 0.03, type: kind.type, lp: kind.lp, det: (i - 1) * 6, out: musicBus, pan: (i - 1) * 0.4 });
      if (P.pad === "space") tone({ f: f * 2, t, a: len * 0.4, hold: len * 0.3, d: len, v: 0.012, det: 9, out: musicBus });
    });
  }
  function lead(P, deg, t, vmul) {
    const f = noteOf(P, deg), v = 0.06 * (vmul || 1), pan = Math.random() * 0.6 - 0.3;
    if (P.lead === "flute") { tone({ f, t, a: 0.08, d: 0.9, v, vib: 5, vibd: 4, out: musicBus, pan }); noise({ f: f * 2, t, d: 0.3, v: v * 0.12, q: 10, a: 0.06, out: musicBus }); }
    else if (P.lead === "lyre") { tone({ f, t, d: 0.9, v, type: "triangle", out: musicBus, pan }); tone({ f: f * 2, t, d: 0.4, v: v * 0.3, out: musicBus, pan }); }
    else if (P.lead === "bell") bell(f, { t, d: 1.4, v: v * 0.9, out: musicBus, pan });
    else if (P.lead === "synth") tone({ f, t, d: 0.35, v: v * 0.8, type: "square", lp: 1400, out: musicBus, pan });
    else tone({ f: f * 2, t, a: 0.02, d: 2.2, v: v * 0.6, vib: 3, vibd: 2, out: musicBus, pan });
  }

  /* ------------------------------------------------------------ ambiance */
  let amb = null, ambTimer = null;
  function ambKey() {
    if (scene.tab === "cosmos") return "cosmos";
    return scene.zone + (scene.night ? ":n" : "");
  }
  /* une nappe continue : du bruit filtré qui respire */
  function bed(o) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = o.ft || "lowpass"; f.frequency.value = o.f; f.Q.value = o.q || 0.7;
    const g = ctx.createGain(); g.gain.value = 0;
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = o.rate || 0.08; lg.gain.value = o.sweep || o.f * 0.4;
    lfo.connect(lg); lg.connect(f.frequency);
    src.connect(f); f.connect(g); g.connect(o.out || ambBus);
    src.start(0, Math.random() * 1.5); lfo.start();
    g.gain.setTargetAtTime(o.v, ctx.currentTime, 1.2);
    return { stop() { g.gain.setTargetAtTime(0, ctx.currentTime, 0.6); setTimeout(() => { try { src.stop(); lfo.stop(); } catch (e) { /* déjà arrêté */ } }, 3000); } };
  }
  function hum(f, v, dest) {
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
    o1.frequency.value = f; o2.frequency.value = f * 2.01; o2.type = "triangle";
    g.gain.value = 0;
    o1.connect(g); o2.connect(g); g.connect(dest || ambBus);
    o1.start(); o2.start();
    g.gain.setTargetAtTime(v, ctx.currentTime, 1.5);
    return { stop() { g.gain.setTargetAtTime(0, ctx.currentTime, 0.6); setTimeout(() => { try { o1.stop(); o2.stop(); } catch (e) { /* déjà arrêté */ } }, 3000); } };
  }
  const out = () => ambBus;
  const EV = {
    bird: () => { const f = 2400 + Math.random() * 1600, n = 2 + Math.floor(Math.random() * 4), pan = Math.random() * 1.6 - 0.8; for (let i = 0; i < n; i++) tone({ f: f * (1 + (i % 2) * 0.12), f2: f * 1.3, fd: 0.06, t: i * 0.11, d: 0.07, v: 0.03, out: out(), pan }); },
    cricket: () => { const pan = Math.random() * 1.6 - 0.8; for (let i = 0; i < 6; i++) tone({ f: 4600, t: i * 0.045, d: 0.025, v: 0.012, out: out(), pan }); },
    drip: () => { tone({ f: 1400 + Math.random() * 600, f2: 700, d: 0.12, v: 0.05, out: out(), pan: Math.random() - 0.5 }); },
    hop: () => { noise({ f: 5000, d: 0.05, v: 0.02, q: 4, out: out(), pan: Math.random() - 0.5 }); },
    tinkle: () => bell(2600 + Math.random() * 900, { d: 0.6, v: 0.012, out: out(), pan: Math.random() - 0.5 }),
    bubble: () => tone({ f: 120 + Math.random() * 80, f2: 260, d: 0.1, v: 0.05, out: out() }),
    creak: () => tone({ f: 90, f2: 70, type: "sawtooth", d: 0.6, v: 0.015, lp: 500, out: out() }),
    eagle: () => tone({ f: 2200, f2: 1300, fd: 0.7, d: 0.8, v: 0.02, vib: 9, vibd: 30, out: out() }),
    beep: () => { tone({ f: 1760, type: "square", d: 0.05, v: 0.01, lp: 4000, out: out() }); tone({ f: 1320, type: "square", t: 0.2, d: 0.05, v: 0.01, lp: 4000, out: out() }); },
    clank: () => { bell(220 + Math.random() * 200, { d: 0.25, v: 0.025, out: out(), pan: Math.random() - 0.5 }); noise({ f: 2500, d: 0.03, v: 0.03, out: out() }); },
    piston: () => { noise({ ft: "lowpass", f: 300, d: 0.15, v: 0.05, out: out() }); noise({ ft: "highpass", f: 4000, t: 0.12, d: 0.1, v: 0.01, out: out() }); },
    wave: () => noise({ ft: "lowpass", f: 700, f2: 300, d: 1.6, v: 0.03, a: 0.6, out: out() })
  };
  /* chaque lieu : des nappes, et des petits événements de temps en temps */
  function ambDef(k) {
    const night = k.endsWith(":n"), z = k.replace(":n", "");
    const day = !night;
    const D = {
      lisiere: { beds: [{ f: 500, v: 0.05 }], ev: day ? [["bird", 2.5]] : [["cricket", 0.9]] },
      plaine: { beds: [{ f: 700, v: 0.06, rate: 0.12 }], ev: day ? [["bird", 6], ["hop", 1.2]] : [["cricket", 0.7]] },
      riviere: { beds: [{ ft: "bandpass", f: 650, q: 0.6, v: 0.09, rate: 0.6, sweep: 200 }, { f: 400, v: 0.03 }], ev: day ? [["bird", 5]] : [["cricket", 1.4]] },
      collines: { beds: [{ f: 600, v: 0.07, rate: 0.1 }], ev: day ? [["bird", 7], ["eagle", 25]] : [["cricket", 1.2]] },
      mine: { beds: [{ f: 180, v: 0.06 }], ev: [["drip", 2.2], ["creak", 12]] },
      desert: { beds: [{ f: 900, v: 0.08, rate: 0.05, sweep: 500 }], ev: [["tinkle", 3]] },
      gisement: { beds: [{ f: 260, v: 0.06 }], ev: [["bubble", 1.8], ["creak", 8]] },
      montagnes: { beds: [{ f: 1100, v: 0.1, rate: 0.07, sweep: 700 }], ev: [["eagle", 14]] },
      orbite: { hum: [55, 0.03], ev: [["beep", 9]] },
      lune: { hum: [42, 0.02], ev: [["beep", 14]] },
      mercure: { beds: [{ f: 160, v: 0.12, rate: 0.2 }], hum: [36, 0.03], ev: [["wave", 4]] },
      caveau: { hum: [65.4, 0.03], beds: [{ f: 300, v: 0.02 }], ev: [["drip", 3], ["tinkle", 6]] },
      cosmos: { hum: [41, 0.02], ev: [] }
    };
    const d = D[z] || D.lisiere;
    /* dans le Domaine, les machines qui tournent s’ajoutent au paysage */
    const m = scene.tab === "domaine" ? Math.min(10, scene.machines || 0) : 0;
    if (!m || z === "cosmos") return d;
    return {
      beds: d.beds, hum: d.hum || [50, 0.008 + m * 0.002],
      ev: (d.ev || []).concat([["clank", Math.max(1.2, 8 / m)], ["piston", Math.max(2.5, 12 / m)]])
    };
  }
  function ambience() {
    if (!ready() || vol.amb <= 0) { stopAmb(); return; }
    const k = ambKey() + (scene.tab === "domaine" ? ":" + Math.min(10, scene.machines || 0) : "");
    if (amb && amb.k === k) return;
    stopAmb();
    const def = ambDef(ambKey());
    const nodes = [];
    (def.beds || []).forEach((b) => nodes.push(bed(b)));
    if (def.hum) nodes.push(hum(def.hum[0], def.hum[1]));
    amb = { k, nodes, ev: def.ev || [], next: {} };
    const now = ctx.currentTime;
    amb.ev.forEach(([e, every]) => (amb.next[e] = now + Math.random() * every));
    ambTimer = setInterval(() => {
      if (!ready() || !amb) return;
      const t = ctx.currentTime;
      amb.ev.forEach(([e, every]) => {
        if (t >= amb.next[e]) { EV[e](); amb.next[e] = t + every * (0.5 + Math.random()); }
      });
    }, 150);
  }
  function stopAmb() {
    clearInterval(ambTimer); ambTimer = null;
    if (amb) amb.nodes.forEach((n) => n.stop());
    amb = null;
  }

  /* ------------------------------------------------------------ l’atelier au travail
   * Quand les mains ou les machines avancent sur une commande, un seul paysage sonore continu, le même pour une pièce
   * ou pour mille : il n’y a plus un bruit par pièce. Le geste en cours choisit ce qu’on entend (cailloux, bois,
   * fibres, braises, enclume, machines, cristal) et l’âge choisit la pièce où l’on est (atelier de bois, forge,
   * vapeur, usine, laboratoire). Il entre et sort en fondu, et ne change de geste qu’après un moment de calme. */
  const WORK_GESTE = { assembler: "bois", tresser: "fibre", tailler: "pierre", stratifier: "pierre", chauffer: "feu", allier: "feu", tremper: "feu",
    marteler: "enclume", usiner: "machine", electriser: "machine", graver: "machine", synthetiser: "machine", transmuter: "cristal", accorder: "cristal" };
  const workRoom = (age) => (age <= 1 ? "bois" : age <= 4 ? "forge" : age <= 8 ? "vapeur" : age <= 11 ? "usine" : "labo");
  const ROOM = {
    bois: (o) => [bed({ ft: "bandpass", f: 900, q: 0.5, v: 0.025, rate: 0.1, out: o })],
    forge: (o) => [bed({ f: 260, v: 0.07, rate: 0.15, out: o }), bed({ ft: "highpass", f: 3500, v: 0.01, q: 0.5, out: o })],
    vapeur: (o) => [bed({ f: 220, v: 0.06, rate: 0.12, out: o }), bed({ ft: "highpass", f: 5000, v: 0.014, q: 0.5, rate: 0.2, sweep: 1500, out: o })],
    usine: (o) => [hum(55, 0.035, o), bed({ f: 400, v: 0.025, rate: 0.1, out: o })],
    labo: (o) => [hum(110, 0.02, o), hum(165, 0.012, o)]
  };
  /* ce qu’on entend de temps en temps, à son rythme (en secondes, au hasard entre la moitié et une fois et demie) */
  const WORK_EV = {
    pierre: [0.9, (o) => { noise({ f: 3000, d: 0.04, v: 0.045, q: 3, out: o, pan: Math.random() - 0.5 }); if (Math.random() < 0.4) noise({ f: 2400, t: 0.11, d: 0.04, v: 0.03, q: 3, out: o }); }],
    bois: [1.0, (o) => { tone({ f: 150, f2: 105, type: "triangle", d: 0.1, v: 0.05, out: o }); noise({ f: 700, d: 0.05, v: 0.02, out: o }); }],
    fibre: [1.6, (o) => noise({ f: 2200, f2: 900, d: 0.3, v: 0.03, q: 2, a: 0.06, out: o, pan: Math.random() - 0.5 })],
    feu: [0.5, (o) => { for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) noise({ f: 3000 + Math.random() * 3000, t: i * 0.05 + Math.random() * 0.1, d: 0.02, v: 0.03, q: 6, out: o, pan: Math.random() - 0.5 }); }],
    enclume: [0.85, (o) => { bell(320 + Math.random() * 40, { d: 0.55, v: 0.04, out: o }); noise({ f: 4000, d: 0.025, v: 0.03, out: o }); if (Math.random() < 0.35) bell(330, { t: 0.2, d: 0.4, v: 0.025, out: o }); }],
    machine: [0.6, (o) => tone({ f: 1100 + Math.random() * 300, type: "square", d: 0.02, v: 0.012, lp: 3000, out: o, pan: Math.random() - 0.5 })],
    cristal: [2.4, (o) => bell([880, 1100, 1320][Math.floor(Math.random() * 3)], { d: 1.6, v: 0.022, out: o, pan: Math.random() - 0.5 })]
  };
  let work = null, workPending = null, workGrace = null;
  function workStart(k) {
    const [fam, room] = k.split(":");
    const bus = ctx.createGain();
    bus.gain.value = 0; bus.connect(ambBus);
    bus.gain.setTargetAtTime(1, ctx.currentTime, 1.2);
    const nodes = ROOM[room](bus), ev = WORK_EV[fam];
    let next = ctx.currentTime + 0.4 + Math.random() * ev[0];
    const timer = setInterval(() => {
      if (!ready()) return;
      const t = ctx.currentTime;
      if (t >= next) { ev[1](bus); next = t + ev[0] * (0.5 + Math.random()); }
    }, 120);
    work = { k, bus, nodes, timer };
  }
  function workStop() {
    clearTimeout(workGrace); workGrace = null;
    if (!work) return;
    const w = work; work = null;
    clearInterval(w.timer);
    try { w.bus.gain.setTargetAtTime(0, ctx.currentTime, 0.6); } catch (e) { /* contexte fermé */ }
    w.nodes.forEach((n) => n.stop());
    setTimeout(() => { try { w.bus.disconnect(); } catch (e) { /* déjà détaché */ } }, 3500);
  }
  /* g : le geste en cours (ou rien) ; appelé à chaque pas de temps de l’interface */
  function workUpdate(g) {
    if (!ready() || vol.amb <= 0) { workStop(); workPending = null; return; }
    if (!g) {
      workPending = null;
      if (work && !workGrace) workGrace = setTimeout(() => { workGrace = null; workStop(); }, 2500);
      return;
    }
    clearTimeout(workGrace); workGrace = null;
    const k = (WORK_GESTE[g] || "bois") + ":" + workRoom(scene.age);
    if (work && work.k === k) { workPending = null; return; }
    if (!work) { workStart(k); return; }
    // un autre geste : on attend trois secondes avant de changer, pour ne pas sautiller d’une pièce à l’autre
    const now = Date.now();
    if (!workPending || workPending.k !== k) workPending = { k, at: now };
    else if (now - workPending.at > 3000) { workStop(); workStart(k); workPending = null; }
  }

  A.debug = () => ({ state: ctx && ctx.state, music: !!musicTimer, playing: barOn, amb: amb && amb.k, work: work && work.k, palette: palette(scene.age) });
  if (root) root.EclatAudio = A;
  if (typeof module !== "undefined" && module.exports) module.exports = A;
})(typeof window !== "undefined" ? window : global);
