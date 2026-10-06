import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { TRACKS, ITEMS } from './tracks.js';
const $ = id => document.getElementById(id);

// ---------- settings ----------
const DEFAULTS = { bots: 5, diff: '0.9', laps: '3', cls: '1', items: ITEMS.map(i => i[0]) };
let settings = { ...DEFAULTS };
try { Object.assign(settings, JSON.parse(localStorage.getItem('trk-settings') || '{}')); } catch (e) {}
const save = () => { try { localStorage.setItem('trk-settings', JSON.stringify(settings)); } catch (e) {} };
for (let i = 0; i <= 11; i++) $('bots').add(new Option(i, i));
$('bots').value = settings.bots; $('diff').value = settings.diff; $('laps').value = settings.laps; $('cls').value = settings.cls;
const itemBoxes = ITEMS.map(([id, name]) => {
  const l = document.createElement('label'), c = document.createElement('input'); c.type = 'checkbox'; c.checked = settings.items.includes(id);
  l.append(c, name); $('items').append(l); return [id, c];
});
const readItems = () => itemBoxes.filter(([, c]) => c.checked).map(([id]) => id);
$('iAll').onclick = () => itemBoxes.forEach(([, c]) => c.checked = true);
$('iNone').onclick = () => itemBoxes.forEach(([, c]) => c.checked = false);
$('iRand').onclick = () => itemBoxes.forEach(([, c]) => c.checked = Math.random() < .5);
function readSettings() {
  settings = { bots: +$('bots').value, diff: $('diff').value, laps: $('laps').value, cls: $('cls').value, items: readItems() }; save(); return settings;
}
function show(id) { for (const s of ['menu', 'vote']) $(s).classList.toggle('on', s === id); }

// ---------- scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
document.body.prepend(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 120, 500);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.5, 1000);
addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });
scene.add(new THREE.HemisphereLight(0xffffff, 0x446644, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(100, 200, 60); sun.castShadow = true;
sun.shadow.camera.left = -60; sun.shadow.camera.right = 60; sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun, sun.target);

// ---------- track ----------
let curve, samples = [], N = 600, WIDTH = 20, trackGroup = null, trackDef = null, center = new THREE.Vector3();
const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshStandardMaterial({ color: 0x3f8f3f }));
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const hemi = scene.children.find(c => c.isHemisphereLight);
const tangent = i => samples[(i + 1) % N].clone().sub(samples[(i - 1 + N) % N]).setY(0).normalize();

function loadTrack(def) {
  if (trackGroup) { scene.remove(trackGroup); trackGroup.traverse(o => { o.geometry?.dispose(); o.material?.dispose?.(); }); }
  trackDef = def; WIDTH = def.width; trackGroup = new THREE.Group(); scene.add(trackGroup);
  curve = new THREE.CatmullRomCurve3(def.pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'catmullrom', 0.5);
  samples = curve.getSpacedPoints(N).slice(0, N);
  center.set(0, 0, 0); samples.forEach(p => center.add(p)); center.divideScalar(N);
  scene.background = new THREE.Color(def.sky); scene.fog = new THREE.Fog(def.sky, 120, def.night ? 260 : 500);
  ground.material.color.set(def.ground);
  hemi.intensity = def.night ? 0.35 : 0.9; sun.intensity = def.night ? 0.3 : 1.2;
  const pos = [], idx = [];
  samples.forEach((p, i) => {
    const t = tangent(i), n = new THREE.Vector3(-t.z, 0, t.x);
    const l = p.clone().addScaledVector(n, WIDTH / 2), r = p.clone().addScaledVector(n, -WIDTH / 2);
    pos.push(l.x, 0.05, l.z, r.x, 0.05, r.z);
    const a = i * 2, b = ((i + 1) % N) * 2; idx.push(a, b, a + 1, a + 1, b, b + 1);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const road = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: def.road, roughness: .9, side: THREE.DoubleSide }));
  road.receiveShadow = true; trackGroup.add(road);
  // start line
  const sl = new THREE.Group(), plane = new THREE.Mesh(new THREE.PlaneGeometry(WIDTH, 2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  plane.rotation.x = -Math.PI / 2; sl.add(plane); sl.position.set(samples[0].x, 0.1, samples[0].z);
  const t0 = tangent(0); sl.rotation.y = Math.atan2(t0.x, t0.z); trackGroup.add(sl);
  // edge markers on the road sides
  const mk = new THREE.MeshStandardMaterial({ color: def.night ? 0x00ffe1 : 0xffffff, emissive: def.night ? 0x00ffe1 : 0x000000 });
  for (let i = 0; i < N; i += 6) {
    const t = tangent(i), n = new THREE.Vector3(-t.z, 0, t.x);
    for (const side of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(.6, .4, 1.6), (i / 6) % 2 ? mk : new THREE.MeshStandardMaterial({ color: 0xe53935 }));
      m.position.copy(samples[i]).addScaledVector(n, side * (WIDTH / 2 + .3)).setY(.2); m.rotation.y = Math.atan2(t.x, t.z); trackGroup.add(m); }
  }
  // decor
  const dm = new THREE.MeshStandardMaterial({ color: def.decorColor, emissive: def.night ? def.decorColor : 0x000000, emissiveIntensity: .6 });
  for (let k = 0, placed = 0; k < 2000 && placed < 260; k++) {
    const x = center.x + (Math.random() - .5) * 600, z = center.z + (Math.random() - .5) * 600;
    if (nearest(x, z, 0, true).d < WIDTH + 8) continue; placed++;
    const h = 4 + Math.random() * 8; let m;
    if (def.decor === 'cone') m = new THREE.Mesh(new THREE.ConeGeometry(3, h * 1.5, 8), dm);
    else if (def.decor === 'cyl') m = new THREE.Mesh(new THREE.CylinderGeometry(.9, 1.1, h, 8), dm);
    else m = new THREE.Mesh(new THREE.BoxGeometry(2, h * 1.5, 2), dm);
    m.position.set(x, h * .75, z); m.castShadow = true; trackGroup.add(m);
  }
}

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
addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'KeyR' && state !== 'idle') startRace(lastOpts); });
addEventListener('keyup', e => keys[e.code] = false);

let race = { laps: 3 }, karts = [], player, state = 'idle', countdown = 0, lastOpts = null, clock = new THREE.Clock();

function startRace(o) {
  lastOpts = o; loadTrack(o.track);
  karts.forEach(k => scene.remove(k.mesh)); karts = [];
  race = { laps: +o.laps, items: o.items, finishOrder: [] };
  MAX = 48 * +o.cls; const diff = +o.diff;
  for (let n = 0; n < o.bots + 1; n++) {
    const row = Math.floor(n/2), side = n % 2 ? 1 : -1;
    const idx = (N - 6 - row*8 + N) % N, t = tangent(idx), nrm = new THREE.Vector3(-t.z,0,t.x);
    const p = samples[idx].clone().addScaledVector(nrm, side*4);
    karts.push({ mesh: makeKart(COLORS[n % COLORS.length]), pos: p, heading: Math.atan2(t.x, t.z), speed: 0, idx, lap: 0, boost: 0, driftT: 0,
      isBot: n !== 0, name: n === 0 ? 'YOU' : 'Bot ' + n, skill: diff - Math.random() * 0.12, lane: (Math.random()-.5) * (WIDTH * .5), finished: false });
  }
  player = karts[0]; state = 'countdown'; countdown = 3.99; clock.getDelta();
  $('hud').style.display = $('menuBtn').style.display = 'block'; $('big').textContent = '';
}
function toMenu() { state = 'idle'; karts.forEach(k => scene.remove(k.mesh)); karts = []; $('hud').style.display = $('menuBtn').style.display = 'none'; $('big').textContent = ''; show('menu'); }
$('menuBtn').onclick = toMenu;

// ---------- track voting ----------
function drawThumb(def) {
  const c = document.createElement('canvas'); c.width = 180; c.height = 120; const g = c.getContext('2d');
  g.fillStyle = '#' + def.ground.toString(16).padStart(6, '0'); g.fillRect(0, 0, 180, 120);
  const pts = new THREE.CatmullRomCurve3(def.pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true).getPoints(100);
  const xs = pts.map(p => p.x), zs = pts.map(p => p.z), minx = Math.min(...xs), maxx = Math.max(...xs), minz = Math.min(...zs), maxz = Math.max(...zs);
  const sc = Math.min(150 / (maxx - minx), 96 / (maxz - minz));
  g.lineWidth = 9; g.lineJoin = 'round'; g.strokeStyle = '#' + def.road.toString(16).padStart(6, '0'); g.beginPath();
  pts.forEach((p, i) => { const x = 90 + (p.x - (minx + maxx) / 2) * sc, y = 60 + (p.z - (minz + maxz) / 2) * sc; i ? g.lineTo(x, y) : g.moveTo(x, y); });
  g.closePath(); g.stroke(); return c;
}
let voteTimer = null;
function openVote(s) {
  show('vote'); let myVote = null, resolving = false, left = 10;
  const cards = $('cards'); cards.innerHTML = ''; const els = {};
  [...TRACKS, { id: 'random', name: '🎲 Random' }].forEach(def => {
    const el = document.createElement('div'); el.className = 'card';
    if (def.pts) el.append(drawThumb(def)); else { const d = document.createElement('div'); d.style.cssText = 'height:120px;display:flex;align-items:center;justify-content:center;font-size:56px'; d.textContent = '🎲'; el.append(d); }
    const t = document.createElement('div'); t.textContent = def.name; t.style.marginTop = '6px'; el.append(t); cards.append(el); els[def.id] = el;
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
$('start').onclick = () => { const s = readSettings(); show(null); openVote(s); };

let MAX = 48; const ACC = 30;
function updatePlayer(k, dt) {
  const up = keys.KeyW || keys.ArrowUp, down = keys.KeyS || keys.ArrowDown;
  const steer = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0);
  const near = nearest(k.pos.x, k.pos.z, k.idx), off = near.d > WIDTH/2 + 1;
  const drifting = (keys.Space || keys.ShiftLeft) && Math.abs(k.speed) > 20 && steer !== 0;
  const cap = (off ? MAX*.4 : MAX) + (k.boost > 0 ? 22 : 0);
  if (state === 'racing' && !k.finished) {
    if (up) k.speed += ACC*dt; else if (down) k.speed -= ACC*1.4*dt; else k.speed -= Math.sign(k.speed)*12*dt;
  } else k.speed -= Math.sign(k.speed)*20*dt;
  k.speed = Math.max(-15, Math.min(cap, k.speed));
  if (k.speed > cap) k.speed -= 40*dt;
  const grip = Math.min(1, Math.abs(k.speed)/20) * Math.sign(k.speed || 1);
  k.heading += steer * (drifting ? 2.4 : 1.6) * grip * dt;
  if (drifting) k.driftT += dt; else { if (k.driftT > 1.2) k.boost = 1.2; else if (k.driftT > .6) k.boost = .6; k.driftT = 0; }
  k.boost = Math.max(0, k.boost - dt);
  k.pos.x += Math.sin(k.heading) * k.speed * dt; k.pos.z += Math.cos(k.heading) * k.speed * dt;
  k.idx = near.i; k.steerVis = steer;
}
function updateBot(k, dt) {
  const near = nearest(k.pos.x, k.pos.z, k.idx); k.idx = near.i;
  const target = samples[(k.idx + 12) % N], t = tangent((k.idx + 12) % N), nrm = new THREE.Vector3(-t.z,0,t.x);
  const aim = target.clone().addScaledVector(nrm, k.lane);
  const want = Math.atan2(aim.x - k.pos.x, aim.z - k.pos.z);
  let diff = want - k.heading; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  k.heading += Math.max(-2*dt, Math.min(2*dt, diff*3*dt*3));
  const targetSpeed = state === 'racing' ? MAX * k.skill * (1 - Math.min(.35, Math.abs(diff)*.5)) : 0;
  k.speed += Math.sign(targetSpeed - k.speed) * Math.min(Math.abs(targetSpeed - k.speed), ACC*dt);
  k.pos.x += Math.sin(k.heading) * k.speed * dt; k.pos.z += Math.cos(k.heading) * k.speed * dt;
}
function trackLap(k) {
  const prev = k.prevIdx ?? k.idx;
  if (prev > N*.9 && k.idx < N*.1) k.lap++;
  else if (prev < N*.1 && k.idx > N*.9) k.lap--;
  k.prevIdx = k.idx;
  k.progress = k.lap + k.idx/N;
  if (!k.finished && k.lap >= race.laps) { k.finished = true; race.finishOrder.push(k); }
}
function collide() {
  for (let a = 0; a < karts.length; a++) for (let b = a+1; b < karts.length; b++) {
    const A = karts[a], B = karts[b], dx = B.pos.x-A.pos.x, dz = B.pos.z-A.pos.z, d = Math.hypot(dx,dz);
    if (d < 3 && d > 0.001) { const push = (3-d)/2, nx = dx/d, nz = dz/d;
      A.pos.x -= nx*push; A.pos.z -= nz*push; B.pos.x += nx*push; B.pos.z += nz*push;
      const s = (A.speed + B.speed)/2; A.speed = A.speed*.8 + s*.2; B.speed = B.speed*.8 + s*.2; }
  }
}

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), .05);
  if (state !== 'idle') {
    if (state === 'countdown') { countdown -= dt; $('big').textContent = countdown > 1 ? Math.floor(countdown) : 'GO!'; if (countdown <= 1) { state = 'racing'; setTimeout(() => $('big').textContent = '', 800); } }
    karts.forEach(k => { k.isBot ? updateBot(k, dt) : updatePlayer(k, dt); });
    collide();
    karts.forEach(k => { trackLap(k);
      k.mesh.position.set(k.pos.x, 0, k.pos.z); k.mesh.rotation.y = k.heading; });
    const ranked = [...karts].sort((a,b) => (b.finished - a.finished) || (a.finished && b.finished ? race.finishOrder.indexOf(a) - race.finishOrder.indexOf(b) : b.progress - a.progress));
    const place = ranked.indexOf(player) + 1;
    $('hud').innerHTML = `Pos ${place}/${karts.length}<br>Lap ${Math.min(Math.max(player.lap+1,1), race.laps)}/${race.laps}<br>${Math.round(Math.abs(player.speed)*3)} km/h${player.boost>0?' 🔥':''}`;
    if (player.finished) $('big').textContent = `Finished ${place}${['st','nd','rd'][place-1]||'th'}! (R = restart)`;
    // camera
    const back = new THREE.Vector3(-Math.sin(player.heading), 0, -Math.cos(player.heading));
    const want = player.pos.clone().addScaledVector(back, 11).setY(5.5);
    camera.position.lerp(want, 1 - Math.pow(.001, dt));
    camera.lookAt(player.pos.x, 2, player.pos.z);
    camera.fov = 70 + Math.min(15, Math.abs(player.speed)*.25 + (player.boost>0?8:0)); camera.updateProjectionMatrix();
    sun.position.set(player.pos.x+100, 200, player.pos.z+60); sun.target.position.copy(player.pos);
  } else if (trackDef) { const a = performance.now() / 6000; camera.position.set(center.x + Math.cos(a) * 260, 130, center.z + Math.sin(a) * 260); camera.lookAt(center); }
  renderer.render(scene, camera);
}
loadTrack(TRACKS[0]);
loop();
