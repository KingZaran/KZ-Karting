import * as THREE from 'three';
import { createFx } from './fx.js';
import { createAudio } from './audio.js';
import { TRACKS, ITEMS } from './tracks.js';
import { buildThemes } from './themes.js';
const $ = id => document.getElementById(id);

// ---------- settings ----------
const DEFAULTS = { bots: 5, diff: '0.9', laps: '3', cls: '1', gfx: 'high', items: ITEMS.map(i => i[0]) };
let settings = { ...DEFAULTS };
try { Object.assign(settings, JSON.parse(localStorage.getItem('trk-settings') || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem('trk-settings', JSON.stringify(settings)); } catch (e) {} };
for (let i = 0; i <= 11; i++) $('bots').add(new Option(i, i));
$('bots').value = settings.bots; $('diff').value = settings.diff; $('laps').value = settings.laps; $('cls').value = settings.cls; $('gfx').value = settings.gfx;
const itemBoxes = ITEMS.map(([id, name]) => {
  const l = document.createElement('label'), c = document.createElement('input'); c.type = 'checkbox'; c.checked = settings.items.includes(id);
  l.append(c, name); $('items').append(l); return [id, c];
});
const readItems = () => itemBoxes.filter(([, c]) => c.checked).map(([id]) => id);
$('iAll').onclick = () => itemBoxes.forEach(([, c]) => c.checked = true);
$('iNone').onclick = () => itemBoxes.forEach(([, c]) => c.checked = false);
$('iRand').onclick = () => itemBoxes.forEach(([, c]) => c.checked = Math.random() < .5);
function readSettings() {
  settings = { bots: +$('bots').value, diff: $('diff').value, laps: $('laps').value, cls: $('cls').value, items: readItems(), gfx: $('gfx').value }; save(); return settings;
}
function show(id) { for (const s of ['menu', 'vote']) $(s).classList.toggle('on', s === id); }

// ---------- scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 120, 500);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 1, 1000);
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); composer && composer.setSize(innerWidth, innerHeight); pfx.setScale(innerHeight * renderer.getPixelRatio() * .9); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
// post-processing (optional, loaded lazily so the game still runs if it fails)
let composer = null, useBloom = true;
(async () => { try {
  const [{ EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all(['EffectComposer', 'RenderPass', 'UnrealBloomPass', 'OutputPass'].map(n => import(`three/addons/postprocessing/${n}.js`)));
  const c = new EffectComposer(renderer); c.addPass(new RenderPass(scene, camera)); c.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .3, .5, 1.0)); c.addPass(new OutputPass());
  c.setSize(innerWidth, innerHeight); composer = c;
} catch (e) { console.warn('Bloom unavailable:', e); } })();
const pfx = createFx(THREE, scene), audio = createAudio();
function applyGfx(g) { useBloom = g !== 'low'; renderer.setPixelRatio(useBloom ? Math.min(devicePixelRatio, 1.5) : 1); renderer.setSize(innerWidth, innerHeight); composer && composer.setSize(innerWidth, innerHeight); sun.castShadow = useBloom; pfx.setScale(innerHeight * renderer.getPixelRatio() * .9); }
scene.add(new THREE.HemisphereLight(0xffffff, 0x446644, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(100, 200, 60); sun.castShadow = true;
sun.shadow.camera.left = -60; sun.shadow.camera.right = 60; sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun, sun.target);

// ---------- track ----------
const THEMES = buildThemes(THREE);
let floorTex = null, pads = [], mm = null, curve, samples = [], N = 600, WIDTH = 20, trackGroup = null, trackDef = null, center = new THREE.Vector3(), zoneIds = [], lastTheme = null;
const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshStandardMaterial({ color: 0x3f8f3f }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -.15; ground.receiveShadow = true; scene.add(ground);
const hemi = scene.children.find(c => c.isHemisphereLight);
const tangent = i => samples[(i + 1) % N].clone().sub(samples[(i - 1 + N) % N]).setY(0).normalize();
const themeAt = i => THEMES[zoneIds[((i % N) + N) % N]];
const env = { sky: new THREE.Color(0x87ceeb), near: 120, far: 500, hemi: .9, sun: 1.2 }, _c = new THREE.Color();
function applyEnv(th, k = 1) {
  env.sky.lerp(_c.set(th.sky), k); env.near += (th.fog[0] - env.near) * k; env.far += (th.fog[1] - env.far) * k;
  env.hemi += (th.hemi - env.hemi) * k; env.sun += (th.sun - env.sun) * k;
  scene.background.copy(env.sky); scene.fog.color.copy(env.sky); scene.fog.near = env.near; scene.fog.far = env.far;
  hemi.intensity = env.hemi; sun.intensity = env.sun;
}
const R = (a, b) => a + Math.random() * (b - a);

function loadTrack(def) {
  if (trackGroup) { scene.remove(trackGroup); trackGroup.traverse(o => { if (o.geometry && !o.userData.shared) o.geometry.dispose(); }); }
  pads = []; trackDef = def; WIDTH = def.width; trackGroup = new THREE.Group(); scene.add(trackGroup);
  curve = new THREE.CatmullRomCurve3(def.pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'catmullrom', 0.5);
  samples = curve.getSpacedPoints(N).slice(0, N);
  center.set(0, 0, 0); samples.forEach(p => center.add(p)); center.divideScalar(N);
  zoneIds = samples.map((_, i) => { const f = i / N; for (const [id, end] of def.zones) if (f < end) return id; return def.zones[def.zones.length - 1][0]; });
  scene.background = new THREE.Color(); scene.fog = new THREE.Fog(0, 1, 2); applyEnv(themeAt(0));
  ground.material.color.set(themeAt(0).ground);
  const normal = i => { const t = tangent(i); return new THREE.Vector3(-t.z, 0, t.x); };
  const ribbon = (half, y, colorOf) => {
    const pos = [], col = [], idx = [];
    samples.forEach((p, i) => {
      const n = normal(i), l = p.clone().addScaledVector(n, half), r = p.clone().addScaledVector(n, -half), c = new THREE.Color(colorOf(i));
      pos.push(l.x, y, l.z, r.x, y, r.z); col.push(c.r, c.g, c.b, c.r, c.g, c.b);
      const a = i * 2, b = ((i + 1) % N) * 2; idx.push(a, b, a + 1, a + 1, b, b + 1);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9, side: THREE.DoubleSide })); m.receiveShadow = true; trackGroup.add(m);
  };
  { // painted floor: one textured plane (a wide ribbon would overlap itself on tight corners and z-fight)
    let minx = 1e9, maxx = -1e9, minz = 1e9, maxz = -1e9; samples.forEach(p => { minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x); minz = Math.min(minz, p.z); maxz = Math.max(maxz, p.z); });
    const pad = 130, S = 2048, size = Math.max(maxx - minx, maxz - minz) + pad * 2, sc = S / size, hex = c => '#' + c.toString(16).padStart(6, '0');
    const cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
    g.fillStyle = hex(themeAt(0).ground); g.fillRect(0, 0, S, S);
    for (let i = 0; i < N; i += 2) { g.fillStyle = hex(themeAt(i).ground); g.beginPath(); g.arc((samples[i].x - minx + pad) * sc, (samples[i].z - minz + pad) * sc, 115 * sc, 0, 6.3); g.fill(); }
    if (floorTex) floorTex.dispose(); floorTex = new THREE.CanvasTexture(cv); floorTex.colorSpace = THREE.SRGBColorSpace; floorTex.anisotropy = 4;
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ map: floorTex, roughness: .95 }));
    fl.rotation.x = -Math.PI / 2; fl.position.set(minx - pad + size / 2, .02, minz - pad + size / 2); fl.receiveShadow = true; trackGroup.add(fl);
  }
  ribbon(WIDTH / 2, 0.08, i => themeAt(i).road);
  // start line
  const sl = new THREE.Group(), plane = new THREE.Mesh(new THREE.PlaneGeometry(WIDTH, 2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  plane.rotation.x = -Math.PI / 2; sl.add(plane); sl.position.set(samples[0].x, 0.12, samples[0].z); const t0 = tangent(0); sl.rotation.y = Math.atan2(t0.x, t0.z); trackGroup.add(sl);
  // edge markers, walls, ceiling lights
  const matCache = {}, mat = (c, e = 0) => matCache[c + '_' + e] || (matCache[c + '_' + e] = new THREE.MeshStandardMaterial({ color: c, emissive: e ? c : 0, emissiveIntensity: .8 }));
  const wp = [], wc = [], wi = [];
  for (let i = 0; i < N; i++) {
    const th = themeAt(i), t = tangent(i), n = normal(i), yaw = Math.atan2(t.x, t.z);
    if (i % 6 === 0 && !th.walls) for (const side of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(.6, .4, 1.6), (i / 6) % 2 ? mat(th.edge, 1) : mat(0xe53935)); m.userData.shared = false;
      m.position.copy(samples[i]).addScaledVector(n, side * (WIDTH / 2 + .3)).setY(.2); m.rotation.y = yaw; trackGroup.add(m);
    }
    if (th.lights && i % 5 === 0) { const m = new THREE.Mesh(new THREE.BoxGeometry(4, .3, 1.6), mat(0xfffbe0, 1)); m.position.copy(samples[i]).setY(9); m.rotation.y = yaw; trackGroup.add(m); }
    if (th.walls && themeAt(i + 1).walls) for (const side of [-1, 1]) {
      const n2 = normal((i + 1) % N), off = WIDTH / 2 + 1.5, A = samples[i].clone().addScaledVector(n, side * off), B = samples[(i + 1) % N].clone().addScaledVector(n2, side * off);
      const base = wp.length / 3, c = new THREE.Color(th.wallColor).multiplyScalar(i % 12 < 6 ? 1 : .88);
      wp.push(A.x, 0, A.z, B.x, 0, B.z, B.x, 7, B.z, A.x, 7, A.z); for (let q = 0; q < 4; q++) wc.push(c.r, c.g, c.b);
      wi.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  if (wp.length) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(wc, 3)); g.setIndex(wi); g.computeVertexNormals();
    trackGroup.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide })));
  }
  // decor + ink/lava splats, placed per zone
  spawnPads(); buildMini();
  const byTheme = {}; zoneIds.forEach((id, i) => (byTheme[id] ||= []).push(i));
  for (const [id, list] of Object.entries(byTheme)) {
    const th = THEMES[id], share = list.length / N;
    for (let k = 0, placed = 0, want = Math.round(230 * share); th.decor.length && placed < want && k < want * 8; k++) {
      const i = list[Math.floor(Math.random() * list.length)], n = normal(i), off = (Math.random() < .5 ? -1 : 1) * (WIDTH / 2 + R(6, 70));
      const p = samples[i].clone().addScaledVector(n, off);
      if (nearest(p.x, p.z, 0, true).d < WIDTH / 2 + 6) continue; placed++;
      const o = th.decor[Math.floor(Math.random() * th.decor.length)](); o.position.set(p.x, 0, p.z); o.rotation.y = Math.random() * 6.28; trackGroup.add(o);
    }
    if (th.flat) for (let k = 0; k < Math.round(th.flat.count * share * 3); k++) {
      const i = list[Math.floor(Math.random() * list.length)], n = normal(i);
      const off = th.flat.onRoad ? R(-(WIDTH / 2 - 1.5), WIDTH / 2 - 1.5) : (Math.random() < .5 ? -1 : 1) * R(WIDTH / 2 + 3, 60);
      const p = samples[i].clone().addScaledVector(n, off), c = th.flat.colors[Math.floor(Math.random() * th.flat.colors.length)];
      const d = new THREE.Mesh(new THREE.CircleGeometry(1, 14), th.flat.emissive ? mat(c, 1) : mat(c, 0));
      d.rotation.x = -Math.PI / 2; d.position.set(p.x, .10 + Math.random() * .03, p.z); d.scale.set(R(1.2, 4.5), R(1.2, 4.5), 1); trackGroup.add(d);
    }
  }
}
let padTex = null;
function spawnPads() {
  if (!padTex) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 160; const g = c.getContext('2d');
    g.fillStyle = '#ff9a00'; g.fillRect(0, 0, 128, 160); g.strokeStyle = '#fff3a0'; g.lineWidth = 16; g.lineJoin = 'miter';
    for (let y = 150; y > 20; y -= 48) { g.beginPath(); g.moveTo(20, y); g.lineTo(64, y - 34); g.lineTo(108, y); g.stroke(); }
    padTex = new THREE.CanvasTexture(c);
  }
  [.13, .38, .63, .88].forEach((fr, n) => {
    const i = Math.floor(N * fr), t = tangent(i), nr = new THREE.Vector3(-t.z, 0, t.x), p = samples[i].clone().addScaledVector(nr, (n % 2 ? 1 : -1) * WIDTH * .2);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 8), new THREE.MeshBasicMaterial({ map: padTex })); m.rotation.x = -Math.PI / 2; m.rotation.z = -Math.atan2(t.x, t.z); m.rotation.order = 'YXZ';
    const g = new THREE.Group(); g.add(m); g.position.set(p.x, .11, p.z); g.rotation.y = Math.atan2(t.x, t.z); m.rotation.set(-Math.PI / 2, 0, 0); trackGroup.add(g); pads.push({ pos: p });
  });
}
function buildMini() {
  const c = document.createElement('canvas'); c.width = c.height = 160; const g = c.getContext('2d');
  let minx = 1e9, maxx = -1e9, minz = 1e9, maxz = -1e9; samples.forEach(p => { minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x); minz = Math.min(minz, p.z); maxz = Math.max(maxz, p.z); });
  const sc = Math.min(136 / (maxx - minx), 136 / (maxz - minz)), P = p => [80 + (p.x - (minx + maxx) / 2) * sc, 80 + (p.z - (minz + maxz) / 2) * sc];
  g.lineWidth = 6; g.lineCap = 'round';
  for (let i = 0; i < N; i += 3) { g.strokeStyle = themeAt(i).accent; g.beginPath(); g.moveTo(...P(samples[i])); g.lineTo(...P(samples[(i + 3) % N])); g.stroke(); }
  g.fillStyle = '#fff'; g.fillRect(...P(samples[0]).map(v => v - 3), 6, 6); mm = { c, P };
}
function drawMini() {
  if (!mm || !karts.length) return; const g = $('mini').getContext('2d'); g.clearRect(0, 0, 160, 160); g.drawImage(mm.c, 0, 0);
  for (const k of [...karts].reverse()) { const [x, y] = mm.P(k.pos); g.fillStyle = k === player ? '#fff' : '#' + k.col.toString(16).padStart(6, '0'); g.strokeStyle = '#000'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, k === player ? 6 : 4, 0, 6.3); g.fill(); g.stroke(); }
}
function confine(k) {
  if (!themeAt(k.idx).walls) return;
  const c = samples[k.idx], lim = WIDTH / 2 + 1, dx = k.pos.x - c.x, dz = k.pos.z - c.z, d = Math.hypot(dx, dz);
  if (d > lim) { k.pos.x = c.x + dx / d * lim; k.pos.z = c.z + dz / d * lim; k.speed *= .97; }
}
function zoneBanner(name) { const el = $('zone'); el.textContent = name; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }

function nearest(x, z, hint = 0, full = false) {
  let best = 1e9, bi = hint;
  const range = full ? N : 40;
  for (let k = -(full ? 0 : range); k <= (full ? N-1 : range); k++) {
    const i = ((hint + k) % N + N) % N, p = samples[i];
    const d = (p.x-x)**2 + (p.z-z)**2;
    if (d < best) { best = d; bi = i; }
  }
  return { i: bi, d: Math.sqrt(best) };
}

// ---------- karts ----------
const COLORS = [0xe53935,0x1e88e5,0x43a047,0xfdd835,0x8e24aa,0xfb8c00,0x00acc1,0xd81b60,0x6d4c41,0x7cb342,0x3949ab,0xf4511e];
function makeKart(color) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, .8, 3.6), new THREE.MeshStandardMaterial({ color, metalness:.4, roughness:.35 })); body.position.y = 1; body.castShadow = true;
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4,.9,1), new THREE.MeshStandardMaterial({ color: 0x222222 })); seat.position.set(0,1.6,-.5);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.55), new THREE.MeshStandardMaterial({ color: 0xffe0bd })); head.position.set(0,2.4,-.5);
  g.add(body, seat, head);
  for (const [x,z] of [[-1.2,1.2],[1.2,1.2],[-1.2,-1.2],[1.2,-1.2]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.5,14), new THREE.MeshStandardMaterial({ color: 0x111111 })); w.rotation.z = Math.PI/2; w.position.set(x,.55,z); g.add(w);
  }
  scene.add(g); return g;
}

const keys = {};
addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'KeyM') zoneBanner(audio.toggle() ? '🔇 Sound off' : '🔊 Sound on'); if (e.code === 'KeyR' && state !== 'idle') startRace(lastOpts);
  if (!e.repeat && (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'KeyF') && state === 'racing' && player && !player.finished && player.spin <= 0) useItem(player, keys.KeyS || keys.ArrowDown); });
addEventListener('keyup', e => keys[e.code] = false);

let lastCd = -1, race = { laps: 3 }, karts = [], player, state = 'idle', countdown = 0, lastOpts = null, clock = new THREE.Clock();

function startRace(o) {
  lastOpts = o; applyGfx(o.gfx); lastCd = -1; $('mini').style.display = 'block'; show(null); clearWorld(); loadTrack(o.track);
  karts.forEach(k => scene.remove(k.mesh)); karts = [];
  race = { laps: +o.laps, items: o.items, finishOrder: [] };
  MAX = 48 * +o.cls; const diff = +o.diff;
  for (let n = 0; n < o.bots + 1; n++) {
    const row = Math.floor(n/2), side = n % 2 ? 1 : -1;
    const idx = (N - 6 - row*8 + N) % N, t = tangent(idx), nrm = new THREE.Vector3(-t.z,0,t.x);
    const p = samples[idx].clone().addScaledVector(nrm, side*4);
    karts.push({ col: COLORS[n % COLORS.length], mesh: makeKart(COLORS[n % COLORS.length]), pos: p, heading: Math.atan2(t.x, t.z), speed: 0, idx, lap: -1, progress: -1 + idx/N, boost: 0, driftT: 0, item: null, spin: 0, star: 0, shrink: 0, rocket: 0, plantT: 0, invuln: 0, useCd: 0, inkT: 0, coins: 0, hopY: 0,
      isBot: n !== 0, name: n === 0 ? 'YOU' : 'Bot ' + n, skill: diff - Math.random() * 0.12, lane: (Math.random()-.5) * (WIDTH * .5), finished: false , immune: 0, starT: 0, rocketT: 0, ink: 0, useAt: 0, gotAt: 0 });
  }
  lastTheme = null; player = karts[0]; ranked = [...karts]; spawnBoxes(); state = 'countdown'; countdown = 3.99; clock.getDelta();
  $('hud').style.display = $('menuBtn').style.display = 'block'; $('big').textContent = '';
}
function toMenu() { state = 'idle'; audio.silence(); $('mini').style.display = 'none'; karts.forEach(k => scene.remove(k.mesh)); karts = []; clearWorld(); $('hud').style.display = $('menuBtn').style.display = 'none'; $('big').textContent = ''; show('menu'); }
$('menuBtn').onclick = toMenu;

// ---------- track voting ----------
function drawThumb(def) {
  const c = document.createElement('canvas'); c.width = 180; c.height = 120; const g = c.getContext('2d');
  g.fillStyle = '#10152b'; g.fillRect(0, 0, 180, 120);
  const pts = new THREE.CatmullRomCurve3(def.pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true).getPoints(120);
  const xs = pts.map(p => p.x), zs = pts.map(p => p.z), minx = Math.min(...xs), maxx = Math.max(...xs), minz = Math.min(...zs), maxz = Math.max(...zs);
  const sc = Math.min(150 / (maxx - minx), 96 / (maxz - minz)), P = p => [90 + (p.x - (minx + maxx) / 2) * sc, 60 + (p.z - (minz + maxz) / 2) * sc];
  g.lineWidth = 8; g.lineCap = 'round';
  for (let i = 0; i < pts.length; i++) {
    const f = i / pts.length, id = (def.zones.find(([, e]) => f < e) || def.zones[def.zones.length - 1])[0];
    g.strokeStyle = THEMES[id].accent; g.beginPath(); g.moveTo(...P(pts[i])); g.lineTo(...P(pts[(i + 1) % pts.length])); g.stroke();
  }
  return c;
}
let voteTimer = null;
function openVote(s) {
  show('vote'); let myVote = null, resolving = false, left = 10;
  const cards = $('cards'); cards.innerHTML = ''; const els = {};
  [...TRACKS, { id: 'random', name: '🎲 Random' }].forEach(def => {
    const el = document.createElement('div'); el.className = 'card';
    if (def.pts) el.append(drawThumb(def)); else { const d = document.createElement('div'); d.style.cssText = 'height:120px;display:flex;align-items:center;justify-content:center;font-size:56px'; d.textContent = '🎲'; el.append(d); }
    const t = document.createElement('div'); t.textContent = def.name; t.style.marginTop = '6px'; el.append(t); if (def.zones) { const z = document.createElement('div'); z.style.cssText = 'font-size:11px;opacity:.7;margin-top:3px'; z.textContent = def.zones.map(([id]) => THEMES[id].name).join(' · '); el.append(z); } cards.append(el); els[def.id] = el;
    el.onclick = () => { if (resolving) return; myVote = def.id; Object.values(els).forEach(e => e.classList.remove('sel')); el.classList.add('sel'); resolve(); };
  });
  const msg = $('voteMsg'); msg.textContent = `Pick a track — ${left}s`;
  clearInterval(voteTimer);
  voteTimer = setInterval(() => { if (resolving) return; left--; msg.textContent = `Pick a track — ${left}s`; if (left <= 0) { myVote = myVote || 'random'; resolve(); } }, 1000);
  function resolve() {
    resolving = true; clearInterval(voteTimer);
    const ids = TRACKS.map(t => t.id);
    const ballots = [{ who: 'You', pick: myVote }];
    for (let i = 1; i <= s.bots; i++) ballots.push({ who: 'Bot ' + i, pick: Math.random() < .2 ? 'random' : ids[Math.floor(Math.random() * ids.length)] });
    const tally = {}; ballots.forEach(b => tally[b.pick] = (tally[b.pick] || 0) + 1);
    Object.entries(tally).forEach(([id, n]) => { const b = document.createElement('div'); b.className = 'badge'; b.textContent = n; els[id].append(b); });
    const winner = ballots[Math.floor(Math.random() * ballots.length)];
    const track = winner.pick === 'random' ? TRACKS[Math.floor(Math.random() * TRACKS.length)] : TRACKS.find(t => t.id === winner.pick);
    msg.textContent = `${winner.who}'s ballot drawn${winner.pick === 'random' ? ' (random!)' : ''} → ${track.name}`;
    els[track.id].classList.add('win');
    setTimeout(() => startRace({ ...s, track }), 2800);
  }
}
$('start').onclick = () => { audio.init(); const s = readSettings(); show(null); openVote(s); };

let MAX = 48; const ACC = 30;
// ---------- items ----------
const NAMES = Object.fromEntries(ITEMS);
const ICON = { banana:'🍌', banana3:'🍌', gshell:'🟢', gshell3:'🟢', rshell:'🔴', rshell3:'🔴', bomb:'💣', mush:'🍄', mush3:'🍄', gmush:'🌟', star:'⭐', ink:'🦑', bolt:'⚡', rocket:'🚀', bshell:'🔵', fire:'🔥', boom:'↩️', plant:'🌱', horn:'📯', eight:'8️⃣', coin:'🪙' };
// weights for [front, middle, back] of the pack
const WGT = { banana:[6,3,1], banana3:[4,2,1], gshell:[5,4,2], gshell3:[3,3,2], rshell:[2,5,4], rshell3:[1,4,5], bomb:[4,3,2], mush:[4,5,4], mush3:[2,4,5], gmush:[0,1,4],
  star:[0,1,5], ink:[1,3,3], bolt:[0,0,2], rocket:[0,1,5], bshell:[0,0,3], fire:[3,3,2], boom:[3,3,2], plant:[3,3,2], horn:[1,2,3], eight:[0,1,2], coin:[4,2,0] };
let projs = [], hazards = [], boxes = [], fxs = [], ranked = [], T = 0;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const fwd = k => V(Math.sin(k.heading), 0, Math.cos(k.heading));
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
function mk(geo, color, glow = .3) { const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: glow })); m.castShadow = true; scene.add(m); return m; }
function clearWorld() { [...projs, ...hazards, ...boxes, ...fxs].forEach(o => scene.remove(o.mesh)); projs = []; hazards = []; boxes = []; fxs = []; }
function spawnBoxes() {
  if (!race.items.length) return;
  for (const frac of [.06, .2, .34, .5, .64, .8, .93]) {
    const i = Math.floor(N * frac), t = tangent(i), n = V(-t.z, 0, t.x);
    for (const off of [-6, -2, 2, 6]) {
      if (Math.abs(off) > WIDTH / 2 - 2) continue;
      const p = samples[i].clone().addScaledVector(n, off), m = mk(new THREE.BoxGeometry(2, 2, 2), 0x39c5ff, .6);
      m.material.transparent = true; m.material.opacity = .75; m.position.set(p.x, 2, p.z); boxes.push({ mesh: m, pos: p, respawn: 0 });
    }
  }
}
const rankOf = k => ranked.indexOf(k) + 1;
function rollItem(k) {
  const n = karts.length, r = rankOf(k), cls = r <= Math.ceil(n / 3) ? 0 : r > Math.ceil(2 * n / 3) ? 2 : 1;
  const pool = race.items; let x = Math.random() * pool.reduce((s, id) => s + WGT[id][cls] + .05, 0), pick = pool[0];
  for (const id of pool) { x -= WGT[id][cls] + .05; if (x <= 0) { pick = id; break; } }
  const uses = { banana3: 3, gshell3: 3, rshell3: 3, mush3: 3, boom: 3, fire: 8, eight: 8 }[pick] || 1;
  k.item = { id: pick, uses }; k.gotAt = T; k.useAt = T + 1 + Math.random() * 2; if (k === player) audio.sfx('pickup');
}
function hit(k, power) {
  if (k.starT > 0 || k.rocketT > 0 || k.immune > 0) return false;
  k.spin = power; k.immune = power + 1.2; k.speed *= .15; k.boost = 0; burst(k.pos, 0xffe14a, 14, 12); if (k === player) audio.sfx('hit'); return true;
}
function fx(pos, color, r) { const m = mk(new THREE.SphereGeometry(1, 16, 12), color, 1); m.material.transparent = true; m.position.copy(pos).setY(1); fxs.push({ mesh: m, life: .45, r }); }
function explode(pos, r, power, color) { burst(pos, color, 60, 28); audio.sfx('boom', Math.max(.15, 1 - dist2(pos, player.pos) / 120)); karts.forEach(k => { if (dist2(k.pos, pos) < r) hit(k, power); }); fx(pos, color, r); }
const CFG = { gshell: [0x2ecc40, .9, 85, 9], rshell: [0xe53935, .9, 80, 10], bshell: [0x1e88e5, 1.3, 110, 15], fire: [0xff7a00, .5, 75, 2.5], boom: [0xffc107, .7, 70, 1.7], bomb: [0x222222, 1, 30, .8] };
function shoot(k, type, back) {
  const dir = fwd(k); if (back) dir.negate();
  const c = CFG[type], m = mk(type === 'boom' ? new THREE.BoxGeometry(1.8, .2, .7) : new THREE.SphereGeometry(c[1], 14, 10), c[0]);
  const pos = k.pos.clone().addScaledVector(dir, 3.4); pos.y = type === 'bshell' ? 6 : 1.1; m.position.copy(pos);
  let target = null;
  if (type === 'rshell') target = ranked[rankOf(k) - 2] || null;
  if (type === 'bshell') target = ranked[0] !== k ? ranked[0] : null;
  projs.push({ type, mesh: m, pos, dir, speed: c[2], life: c[3], owner: k, target, bounces: 0, t: 0, idx: k.idx });
}
function drop(k, type, back) {
  const dir = fwd(k); if (!back) dir.negate().negate();
  const pos = k.pos.clone().addScaledVector(dir, back ? -3.6 : 9);
  const m = type === 'banana' ? mk(new THREE.CylinderGeometry(.5, .5, 2.2, 10), 0xffe135) : mk(new THREE.SphereGeometry(1.1, 14, 10), 0x222222, .15);
  m.position.set(pos.x, 1, pos.z); if (type === 'banana') m.rotation.z = Math.PI / 2;
  hazards.push({ type, mesh: m, pos, life: 60, fuse: 3 });
}
function useItem(k, back) {
  const it = k.item; if (!it) return;
  let id = it.id; if (id === 'eight') id = ['banana', 'gshell', 'rshell', 'bomb', 'mush', 'fire', 'boom', 'coin'][Math.floor(Math.random() * 8)];
  const base = id.replace('3', '');
  if (k === player) audio.sfx(['mush', 'gmush', 'star', 'rocket'].includes(base) ? 'boost' : 'use'); else if (dist2(k.pos, player.pos) < 60) audio.sfx('use', .35);
  switch (base) {
    case 'banana': drop(k, 'banana', back); break;
    case 'gshell': case 'rshell': case 'bshell': case 'fire': case 'boom': shoot(k, base, back); break;
    case 'bomb': if (back) drop(k, 'bomb', true); else shoot(k, 'bomb', false); break;
    case 'mush': k.boost = Math.max(k.boost, 1.4); k.speed += 12; break;
    case 'gmush': k.boost = Math.max(k.boost, 7); k.speed += 12; break;
    case 'star': k.starT = 8; k.boost = Math.max(k.boost, 1.2); break;
    case 'rocket': k.rocketT = 6; break;
    case 'plant': k.plantT = 10; break;
    case 'coin': k.coins = Math.min(10, k.coins + 3); break;
    case 'ink': ranked.slice(0, rankOf(k) - 1).forEach(o => { if (!o.starT && !o.rocketT) o.ink = 5; }); break;
    case 'bolt': karts.forEach(o => { if (o !== k && hit(o, .9)) o.shrink = 6; }); { const f = $('flash'); f.style.transition = 'none'; f.style.opacity = .9; setTimeout(() => { f.style.transition = 'opacity 1s'; f.style.opacity = 0; }, 40); } break;
    case 'horn': projs.forEach(p => { if (dist2(p.pos, k.pos) < 40) p.life = 0; }); fx(k.pos, 0xffffff, 40); break;
  }
  if (--it.uses <= 0) k.item = null;
}
function updateWorld(dt) {
  for (const p of pads) for (const k of karts) if (dist2(k.pos, p.pos) < 4.2 && k.boost < .6) { k.boost = 1; k.speed += 6; burst(k.pos, 0xffb040, 16, 10); if (k === player) audio.sfx('boost'); }
  // item boxes
  for (const b of boxes) {
    if (b.respawn > 0) { b.respawn -= dt; b.mesh.visible = b.respawn <= 0; continue; }
    b.mesh.rotation.y += dt * 2; b.mesh.rotation.x += dt; b.mesh.position.y = 2 + Math.sin(T * 3 + b.pos.x) * .3;
    for (const k of karts) if (!k.item && k.rocketT <= 0 && !k.finished && dist2(k.pos, b.pos) < 3.2) { rollItem(k); b.respawn = 4; b.mesh.visible = false; break; }
  }
  // projectiles
  for (let i = projs.length - 1; i >= 0; i--) {
    const p = projs[i]; p.t += dt; p.life -= dt; let dead = p.life <= 0;
    if (p.type === 'boom' && p.t > .55) p.dir.lerp(p.owner.pos.clone().sub(p.pos).setY(0).normalize(), Math.min(1, 6 * dt)).normalize();
    if (p.type === 'rshell' || p.type === 'bshell') {
      const tp = p.target && p.target.pos, close = tp && p.pos.distanceTo(tp) < (p.type === 'bshell' ? 30 : 55); let aim;
      if (close) aim = tp; else { p.idx = nearest(p.pos.x, p.pos.z, p.idx).i; aim = samples[(p.idx + 10) % N]; }
      p.dir.lerp(V(aim.x - p.pos.x, 0, aim.z - p.pos.z).normalize(), Math.min(1, 7 * dt)).normalize();
    }
    p.pos.addScaledVector(p.dir, p.speed * dt);
    if (p.type === 'gshell' || p.type === 'fire') {
      const nr = nearest(p.pos.x, p.pos.z, p.idx); p.idx = nr.i;
      if (nr.d > WIDTH / 2 + 2) {
        if (++p.bounces > 5) dead = true;
        else { const t = tangent(nr.i); p.dir = t.clone().multiplyScalar(2 * p.dir.dot(t)).sub(p.dir).normalize(); p.pos.lerp(samples[nr.i], .15); p.pos.y = 1.1; }
      }
    }
    if (p.type === 'bomb') { if (p.t >= .8) { dead = true; drop({ pos: p.pos, heading: Math.atan2(p.dir.x, p.dir.z) }, 'bomb', false); hazards[hazards.length - 1].pos.copy(p.pos); hazards[hazards.length - 1].mesh.position.set(p.pos.x, 1, p.pos.z); } }
    else if (!dead) {
      if (p.type === 'boom' && p.t > .55 && dist2(p.pos, p.owner.pos) < 2.5) dead = true;
      else for (const k of karts) {
        if (k === p.owner && p.t < .5) continue;
        if (dist2(k.pos, p.pos) < (p.type === 'bshell' ? 3.5 : 2.4)) {
          if (p.type === 'bshell') explode(p.pos, 11, 1.8, 0x1e88e5); else hit(k, p.type === 'fire' ? .7 : 1.1);
          dead = true; break;
        }
      }
    }
    if (dead) { scene.remove(p.mesh); projs.splice(i, 1); continue; }
    p.mesh.position.copy(p.pos); if (p.type === 'boom') p.mesh.rotation.y += 20 * dt;
  }
  // hazards
  for (let i = hazards.length - 1; i >= 0; i--) {
    const h = hazards[i]; h.life -= dt; let gone = h.life <= 0, boom = false;
    if (h.type === 'bomb') { h.fuse -= dt; h.mesh.scale.setScalar(1 + .15 * Math.sin(T * 20)); if (h.fuse <= 0) boom = true; }
    for (const k of karts) if (dist2(k.pos, h.pos) < 2.4) {
      if (k.starT > 0 || k.rocketT > 0) gone = true;
      else if (k.immune > 0) continue;
      else if (h.type === 'banana') { hit(k, 1); gone = true; } else boom = true;
    }
    if (boom) { explode(h.pos, 10, 1.6, 0xff7a00); gone = true; }
    if (gone) { scene.remove(h.mesh); hazards.splice(i, 1); }
  }
  // chomper plant & star contact
  for (const k of karts) if (k.plantT > 0) {
    const c = k.pos.clone().addScaledVector(fwd(k), 4.5);
    for (const o of karts) if (o !== k && dist2(o.pos, c) < 5.5 && hit(o, 1.1)) k.boost = Math.max(k.boost, .6);
    for (let i = hazards.length - 1; i >= 0; i--) if (dist2(hazards[i].pos, c) < 6) { scene.remove(hazards[i].mesh); hazards.splice(i, 1); }
  }
  for (let i = fxs.length - 1; i >= 0; i--) {
    const f = fxs[i]; f.life -= dt; const u = 1 - f.life / .45; f.mesh.scale.setScalar(Math.max(.1, f.r * u)); f.mesh.material.opacity = Math.max(0, .6 * (1 - u));
    if (f.life <= 0) { scene.remove(f.mesh); fxs.splice(i, 1); }
  }
}
function botItems(k) {
  if (!k.item || T < k.useAt || k.finished) return;
  const base = k.item.id.replace('3', ''), f = fwd(k); let ahead = false, behind = false;
  for (const o of karts) if (o !== k) {
    const d = V(o.pos.x - k.pos.x, 0, o.pos.z - k.pos.z), L = d.length();
    if (L < 90) { const dot = d.normalize().dot(f); if (dot > .85) ahead = true; if (dot < -.7 && L < 35) behind = true; }
  }
  const waited = T - k.gotAt; let use = false, back = false;
  if (['gshell', 'rshell', 'bshell', 'fire', 'boom', 'bomb'].includes(base)) use = ahead || waited > 8;
  else if (base === 'banana') { use = behind || waited > 8; back = true; }
  else if (base === 'horn') use = projs.some(p => p.owner !== k && dist2(p.pos, k.pos) < 35) || waited > 20;
  else use = waited > .8;
  if (use) { useItem(k, back); k.useAt = T + .5 + Math.random() * 1.2; }
}

// ---------- particles ----------
function burst(pos, hex, n, sp) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, u = R(.3, 1) * sp, v = R(.2, 1) * sp * .7; pfx.glow.emit(pos.x, 1.2, pos.z, Math.cos(a) * u, v, Math.sin(a) * u, R(.3, .7), R(.6, 1.3), .1, hex, 1, hex, 0); } }
function emitKartFx(k, dt) {
  if (dist2(k.pos, player.pos) > 100) return;
  const f = fwd(k), l = V(f.z, 0, -f.x), sp = Math.abs(k.speed), rear = (side) => k.pos.clone().addScaledVector(f, -1.3).addScaledVector(l, side * 1.2);
  const rS = k.drifting ? 40 : (k.off && sp > 10 ? 50 : 0), rP = k.drifting && k.driftT > .6 ? 80 : 0, rF = (k.boost > 0 || k.rocketT > 0) ? 110 : 0, rT = k.starT > 0 ? 40 : 0;
  k.aS = (k.aS || 0) + rS * dt; k.aP = (k.aP || 0) + rP * dt; k.aF = (k.aF || 0) + rF * dt; k.aT = (k.aT || 0) + rT * dt;
  while (k.aS >= 1) { k.aS--; const p = rear(Math.random() < .5 ? -1 : 1); pfx.smoke.emit(p.x, .5, p.z, R(-1, 1), R(1, 3), R(-1, 1), .9, .8, 3.2, k.drifting ? 0xdddddd : themeAt(k.idx).ground, .5, k.drifting ? 0xffffff : themeAt(k.idx).ground, 0); }
  while (k.aP >= 1) { k.aP--; const p = rear(Math.random() < .5 ? -1 : 1), hex = k.driftT > 1.2 ? 0xff8a00 : 0x4fc3ff; pfx.glow.emit(p.x, .5, p.z, R(-4, 4) - f.x * 4, R(2, 6), R(-4, 4) - f.z * 4, .35, .45, .05, hex, 1, hex, 0); }
  while (k.aF >= 1) { k.aF--; const p = k.pos.clone().addScaledVector(f, -2.3); pfx.glow.emit(p.x, .9, p.z, -f.x * R(6, 12) + R(-1, 1), R(-.5, 1), -f.z * R(6, 12) + R(-1, 1), .3, 1.1, .2, k.rocketT > 0 ? 0x6fd0ff : 0xffb040, 1, 0xff3000, 0); }
  while (k.aT >= 1) { k.aT--; const hex = new THREE.Color().setHSL(Math.random(), 1, .6).getHex(); pfx.glow.emit(k.pos.x + R(-1.5, 1.5), R(.5, 3), k.pos.z + R(-1.5, 1.5), R(-2, 2), R(1, 4), R(-2, 2), .6, .6, .1, hex, 1, hex, 0); }
}

// ---------- driving ----------
const move = (k, dt) => { k.pos.x += Math.sin(k.heading) * k.speed * dt; k.pos.z += Math.cos(k.heading) * k.speed * dt; };
const capOf = (k, off) => (off ? MAX * .4 : MAX) * (k.shrink > 0 ? .7 : 1) * (1 + k.coins * .012) + (k.boost > 0 ? 22 : 0) + (k.starT > 0 ? 6 : 0);
function tick(k, dt) { for (const s of ['spin', 'immune', 'starT', 'rocketT', 'plantT', 'shrink', 'ink']) if (k[s] > 0) k[s] = Math.max(0, k[s] - dt); }
function updatePlayer(k, dt) {
  const near = nearest(k.pos.x, k.pos.z, k.idx); k.idx = near.i;
  if (k.spin > 0) { k.drifting = false; k.speed *= Math.pow(.2, dt); move(k, dt); return; }
  const up = keys.KeyW || keys.ArrowUp, down = keys.KeyS || keys.ArrowDown;
  const steer = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);
  const off = k.off = near.d > WIDTH/2 + 1, drifting = k.drifting = (keys.Space || keys.ShiftLeft) && Math.abs(k.speed) > 20 && steer !== 0, cap = capOf(k, off);
  if (state === 'racing' && !k.finished) { if (up) k.speed += ACC*dt; else if (down) k.speed -= ACC*1.4*dt; else k.speed -= Math.sign(k.speed)*12*dt; }
  else k.speed -= Math.sign(k.speed)*20*dt;
  if (k.speed > cap) k.speed = Math.max(cap, k.speed - 45*dt); k.speed = Math.max(-15, k.speed);
  const grip = Math.min(1, Math.abs(k.speed)/20) * Math.sign(k.speed || 1);
  k.steer = (k.steer || 0) + (steer - (k.steer || 0)) * Math.min(1, 9 * dt);
  k.heading += k.steer * (drifting ? 2.4 : 1.6) * (1 - .25 * Math.min(1, Math.abs(k.speed) / MAX)) * grip * dt;
  if (drifting) k.driftT += dt; else { if (k.driftT > 1.2) k.boost = Math.max(k.boost, 1.2); else if (k.driftT > .6) k.boost = Math.max(k.boost, .6); k.driftT = 0; }
  k.boost = Math.max(0, k.boost - dt); move(k, dt);
}
function updateBot(k, dt) {
  const near = nearest(k.pos.x, k.pos.z, k.idx); k.idx = near.i;
  if (k.spin > 0) { k.speed *= Math.pow(.2, dt); move(k, dt); return; }
  if (k.isBot && state === 'racing') botItems(k);
  const rk = k.rocketT > 0, target = samples[(k.idx + 12) % N], t = tangent((k.idx + 12) % N), nrm = V(-t.z, 0, t.x);
  const aim = target.clone().addScaledVector(nrm, rk ? 0 : k.lane);
  let diff = Math.atan2(aim.x - k.pos.x, aim.z - k.pos.z) - k.heading; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  k.heading += Math.max(-2.2*dt, Math.min(2.2*dt, diff*9*dt));
  k.steer = (k.steer || 0) + (Math.max(-1, Math.min(1, diff * 2.5)) - (k.steer || 0)) * Math.min(1, 8 * dt); k.off = near.d > WIDTH/2 + 1; k.drifting = false;
  k.boost = Math.max(0, k.boost - dt);
  let ts = state === 'racing' ? MAX * k.skill * (1 - Math.min(.35, Math.abs(diff)*.5)) : 0;
  ts *= (k.shrink > 0 ? .7 : 1) * (1 + k.coins * .012); if (k.boost > 0 || k.starT > 0) ts *= 1.3; if (rk) ts = MAX * 1.6;
  k.speed += Math.sign(ts - k.speed) * Math.min(Math.abs(ts - k.speed), ACC * (rk ? 3 : 1) * dt); move(k, dt);
}
function trackLap(k) {
  const prev = k.prevIdx ?? k.idx, lap0 = k.lap;
  if (prev > N*.9 && k.idx < N*.1) k.lap++; else if (prev < N*.1 && k.idx > N*.9) k.lap--;
  k.prevIdx = k.idx; k.progress = k.lap + k.idx/N; if (k === player && k.lap > lap0 && k.lap > 0) audio.sfx('lap');
  if (!k.finished && k.lap >= race.laps) { k.finished = true; race.finishOrder.push(k); }
}
function collide() {
  for (let a = 0; a < karts.length; a++) for (let b = a+1; b < karts.length; b++) {
    const A = karts[a], B = karts[b], dx = B.pos.x-A.pos.x, dz = B.pos.z-A.pos.z, d = Math.hypot(dx,dz);
    if (d < 3 && d > 0.001) { const push = (3-d)/2, nx = dx/d, nz = dz/d;
      A.pos.x -= nx*push; A.pos.z -= nz*push; B.pos.x += nx*push; B.pos.z += nz*push;
      const s = (A.speed + B.speed)/2; A.speed = A.speed*.8 + s*.2; B.speed = B.speed*.8 + s*.2;
      if (A.starT > 0 || A.rocketT > 0) hit(B, 1.2); if (B.starT > 0 || B.rocketT > 0) hit(A, 1.2); }
  }
}
const rankSort = (a, b) => (b.finished - a.finished) || (a.finished && b.finished ? race.finishOrder.indexOf(a) - race.finishOrder.indexOf(b) : b.progress - a.progress);

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), .05);
  if (state !== 'idle') {
    T += dt;
    if (state === 'countdown') { countdown -= dt; const cd = Math.floor(countdown); if (cd !== lastCd) { lastCd = cd; if (cd >= 2) audio.sfx('beep'); } $('big').textContent = countdown > 1 ? Math.floor(countdown) : 'GO!'; if (countdown <= 1) { state = 'racing'; audio.sfx('go'); setTimeout(() => { if (state === 'racing') $('big').textContent = ''; }, 800); } }
    ranked = [...karts].sort(rankSort);
    karts.forEach(k => tick(k, dt));
    karts.forEach(k => (k.isBot || k.rocketT > 0) ? updateBot(k, dt) : updatePlayer(k, dt));
    if (state === 'racing') updateWorld(dt);
    collide(); karts.forEach(confine);
    karts.forEach(k => {
      trackLap(k); const sp01 = Math.min(1, Math.abs(k.speed) / MAX); k.slide = (k.slide || 0) + ((k.drifting ? (k.steer || 0) * .5 : 0) - (k.slide || 0)) * Math.min(1, 10 * dt);
      k.mesh.rotation.order = 'YXZ'; k.mesh.position.set(k.pos.x, k.off && sp01 > .2 ? Math.abs(Math.sin(T * 45 + k.heading)) * .12 : 0, k.pos.z);
      k.mesh.rotation.set(0, k.heading + k.spin * 12 + k.slide, (k.steer || 0) * (.14 + (k.drifting ? .1 : 0)) * sp01); emitKartFx(k, dt);
      const sc = k.shrink > 0 ? .5 : 1; k.mesh.scale.setScalar(k.mesh.scale.x + (sc - k.mesh.scale.x) * Math.min(1, 8*dt));
      k.mesh.children[0].material.emissive.setHSL(k.starT > 0 ? (T * 2) % 1 : 0, 1, k.starT > 0 ? .5 : 0);
      if (!k.plantMesh) { k.plantMesh = new THREE.Mesh(new THREE.SphereGeometry(1.3, 12, 10), new THREE.MeshStandardMaterial({ color: 0x2e8b2e })); k.plantMesh.position.set(0, 1.4, 3.6); k.mesh.add(k.plantMesh); }
      k.plantMesh.visible = k.plantT > 0; if (k.plantT > 0) k.plantMesh.scale.setScalar(1 + .25 * Math.sin(T * 14));
    });
    ranked = [...karts].sort(rankSort);
    const place = ranked.indexOf(player) + 1, it = player.item;
    $('hudText').innerHTML = `Pos ${place}/${karts.length}<br>Lap ${Math.min(Math.max(player.lap+1,1), race.laps)}/${race.laps}<br>${Math.round(Math.abs(player.speed)*3)} km/h${player.boost>0?' 🔥':''}${player.coins ? '<br>🪙 ' + player.coins : ''}`;
    $('itemBox').innerHTML = it ? `${ICON[it.id]}<small>${NAMES[it.id]}${it.uses > 1 ? ' ×' + it.uses : ''}</small>` : (race.items.length ? '<small>no item</small>' : '<small>items off</small>');
    $('ink').style.opacity = Math.min(1, player.ink);
    if (player.finished) $('big').textContent = `Finished ${place}${['st','nd','rd'][place-1]||'th'}! (R = restart)`;
    { const th = themeAt(player.idx); applyEnv(th, 1 - Math.exp(-2.5 * dt)); if (th !== lastTheme) { lastTheme = th; zoneBanner(th.name); audio.music(Object.keys(THEMES).find(k => THEMES[k] === th)); } }
    const back = V(-Math.sin(player.heading), 0, -Math.cos(player.heading)), s01 = Math.min(1, Math.abs(player.speed) / MAX);
    camera.position.lerp(player.pos.clone().addScaledVector(back, 10 + 3 * s01 - (player.boost > 0 ? 1.5 : 0)).setY(5.2 + s01), 1 - Math.pow(.001, dt));
    const shake = (player.off && s01 > .2 ? .09 : 0) + (player.boost > 0 ? .06 : 0) + (player.spin > 0 ? .15 : 0); if (shake) camera.position.add(V(R(-shake, shake), R(-shake, shake), R(-shake, shake)));
    camera.lookAt(player.pos.x, 2, player.pos.z); camera.rotateZ(-(player.steer || 0) * .035 * s01);
    pfx.update(dt); drawMini(); audio.engine(s01, player.drifting ? 1 : (player.off && s01 > .2 ? .5 : 0), player.boost > 0 || player.rocketT > 0);
    camera.fov = 70 + Math.min(15, Math.abs(player.speed)*.25 + (player.boost>0?8:0)); camera.updateProjectionMatrix();
    sun.position.set(player.pos.x+100, 200, player.pos.z+60); sun.target.position.copy(player.pos);
  } else if (trackDef) { applyEnv(themeAt(0), .1); const a = performance.now() / 6000; camera.position.set(center.x + Math.cos(a) * 260, 130, center.z + Math.sin(a) * 260); camera.lookAt(center); }
  if (useBloom && composer) composer.render(); else renderer.render(scene, camera);
}
loadTrack(TRACKS[0]);
loop();
