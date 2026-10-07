// Procedural sound: engine, skid, effects and a tiny per-zone music loop. No audio files needed.
export function createAudio() {
  let ctx, master, o1, o2, filt, engG, nFilt, nG, muted = false, timer = null, step = 0, gv = 1;
  const MUS = { meadow: [120, 'square'], dunes: [110, 'triangle'], frost: [100, 'sine'], neon: [130, 'square'], hollow: [80, 'sine'], silk: [96, 'triangle'], ink: [150, 'square'], backrooms: [55, 'sawtooth'], brawl: [140, 'sawtooth'], lava: [118, 'sawtooth'], candy: [135, 'triangle'] };
  const ok = () => ctx && ctx.state !== 'closed';
  function init() {
    if (ctx) { ctx.resume && ctx.resume(); return; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = muted ? 0 : .6; master.connect(ctx.destination);
    filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; engG = ctx.createGain(); engG.gain.value = 0;
    o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o2 = ctx.createOscillator(); o2.type = 'square';
    o1.connect(filt); o2.connect(filt); filt.connect(engG); engG.connect(master); o1.start(); o2.start();
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const n = ctx.createBufferSource(); n.buffer = buf; n.loop = true; nFilt = ctx.createBiquadFilter(); nFilt.type = 'bandpass'; nG = ctx.createGain(); nG.gain.value = 0;
    n.connect(nFilt); nFilt.connect(nG); nG.connect(master); n.start();
  }
  function engine(sp, skid, boost) {
    if (!ok()) return; const t = ctx.currentTime;
    o1.frequency.setTargetAtTime(48 + sp * 150 + (boost ? 30 : 0), t, .05); o2.frequency.setTargetAtTime(24 + sp * 75, t, .05);
    filt.frequency.setTargetAtTime(350 + sp * 1500, t, .08); engG.gain.setTargetAtTime(.05 + sp * .05, t, .1);
    nG.gain.setTargetAtTime(skid * .09, t, .05); nFilt.frequency.setTargetAtTime(skid > .7 ? 2200 : 900, t, .1);
  }
  function silence() { if (!ok()) return; engG.gain.setTargetAtTime(0, ctx.currentTime, .1); nG.gain.setTargetAtTime(0, ctx.currentTime, .1); music(null); }
  function tone(f0, f1, dur, type = 'square', vol = .2, delay = 0) {
    if (!ok()) return; const t = ctx.currentTime + delay, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    g.gain.setValueAtTime(vol * gv, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
  }
  function noiseBurst(dur, vol, f) {
    if (!ok()) return; const t = ctx.currentTime, b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = b; fl.type = 'lowpass'; fl.frequency.value = f; g.gain.value = vol * gv; s.connect(fl); fl.connect(g); g.connect(master); s.start(t);
  }
  const S = {
    tick: () => tone(1100, 1100, .04, 'square', .1), ok: () => { tone(660, 990, .12, 'triangle', .2); tone(990, 1320, .15, 'triangle', .15, .08); }, back: () => tone(500, 250, .12, 'triangle', .18),
    fall: () => tone(700, 70, .9, 'sine', .25),
    beep: () => tone(440, 440, .18, 'square', .25), go: () => tone(880, 880, .5, 'square', .3),
    pickup: () => [0, 1, 2].forEach(i => tone(520 * 1.26 ** i, 520 * 1.26 ** i, .09, 'triangle', .22, i * .07)),
    use: () => { noiseBurst(.18, .25, 1200); tone(300, 700, .15, 'sawtooth', .1); },
    boost: () => { tone(200, 900, .5, 'sawtooth', .14); noiseBurst(.4, .15, 2500); },
    hit: () => { tone(500, 90, .4, 'sawtooth', .3); noiseBurst(.25, .25, 800); },
    boom: () => { noiseBurst(.7, .5, 300); tone(120, 30, .6, 'sine', .4); },
    lap: () => [0, 1].forEach(i => tone(660 * (1 + i * .5), 660 * (1 + i * .5), .15, 'triangle', .25, i * .12)),
  };
  function sfx(name, v = 1) { if (!ok() || muted) return; gv = v; S[name] && S[name](); gv = 1; }
  function music(id) {
    clearInterval(timer); timer = null; if (!id || !ok()) return;
    const [bpm, type] = MUS[id] || [120, 'square'], ms = 60000 / bpm / 2; step = 0;
    timer = setInterval(() => {
      if (muted || !ok()) return; const chord = [0, 8, 3, 10][(step >> 4) & 3], pat = [0, 12, 7, 12, 15, 12, 7, 12][step & 7];
      const f = 220 * 2 ** ((chord + pat) / 12); tone(f, f, ms / 1000 * .9, type, .05);
      if (step % 8 === 0) { const b = 55 * 2 ** (chord / 12); tone(b, b, ms / 1000 * 3, 'triangle', .12); } step++;
    }, ms);
  }
  function toggle() { muted = !muted; if (master) master.gain.value = muted ? 0 : .6; return muted; }
  return { init, engine, silence, sfx, music, toggle };
}
