import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

const botSel = document.getElementById('bots');
for (let i = 0; i <= 11; i++) botSel.add(new Option(i, i, i === 5, i === 5));
const $ = id => document.getElementById(id);
$('start').onclick = () => { $('menu').style.display = 'none'; $('hud').style.display = $('help').style.display = 'block'; startRace(+botSel.value, +$('laps').value); };

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
const pts = [[0,0],[80,-20],[140,40],[120,130],[40,170],[-60,140],[-120,70],[-90,-20],[-40,-40]].map(([x,z]) => new THREE.Vector3(x,0,z));
const curve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
const N = 600, WIDTH = 20;
const samples = curve.getSpacedPoints(N).slice(0, N);
const trackLen = curve.getLength();
const tangent = i => samples[(i+1)%N].clone().sub(samples[(i-1+N)%N]).setY(0).normalize();
(function buildTrack() {
  const pos = [], idx = [];
  samples.forEach((p, i) => {
    const t = tangent(i), n = new THREE.Vector3(-t.z, 0, t.x);
    const l = p.clone().addScaledVector(n, WIDTH/2), r = p.clone().addScaledVector(n, -WIDTH/2);
    pos.push(l.x, 0.05, l.z, r.x, 0.05, r.z);
    const a = i*2, b = ((i+1)%N)*2;
    idx.push(a, b, a+1, a+1, b, b+1);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const road = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x333338, roughness: .9, side: THREE.DoubleSide }));
  road.receiveShadow = true; scene.add(road);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshStandardMaterial({ color: 0x3f8f3f }));
  ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
  // start line + trees
  const sl = new THREE.Mesh(new THREE.PlaneGeometry(WIDTH, 2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  sl.rotation.x = -Math.PI/2; sl.position.set(samples[0].x, 0.1, samples[0].z); sl.rotation.z = Math.atan2(tangent(0).x, tangent(0).z) ; scene.add(sl);
  for (let k = 0; k < 250; k++) {
    const x = (Math.random()-.5)*500+10, z = (Math.random()-.5)*450+60;
    if (nearest(x, z, 0, true).d < WIDTH + 6) continue;
    const tree = new THREE.Group();
    tree.add(new THREE.Mesh(new THREE.CylinderGeometry(.6,.8,4), new THREE.MeshStandardMaterial({ color: 0x6b4a2b })));
    const top = new THREE.Mesh(new THREE.ConeGeometry(3.5,8,8), new THREE.MeshStandardMaterial({ color: 0x1f6b2f })); top.position.y = 6; top.castShadow = true;
    tree.add(top); tree.position.set(x, 2, z); scene.add(tree);
  }
})();

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
addEventListener('keydown', e => { keys[e.code] = true; if (e.code === 'KeyR') startRace(race.nBots, race.laps); });
addEventListener('keyup', e => keys[e.code] = false);

let race = { nBots: 5, laps: 3 }, karts = [], player, state = 'idle', countdown = 0, clock = new THREE.Clock();

function startRace(nBots, laps) {
  karts.forEach(k => scene.remove(k.mesh)); karts = [];
  race = { nBots, laps, finishOrder: [] };
  const total = nBots + 1;
  for (let n = 0; n < total; n++) {
    const row = Math.floor(n/2), side = n % 2 ? 1 : -1;
    const idx = (N - 6 - row*8) % N, t = tangent(idx), nrm = new THREE.Vector3(-t.z,0,t.x);
    const p = samples[idx].clone().addScaledVector(nrm, side*4);
    const k = { mesh: makeKart(COLORS[n % COLORS.length]), pos: p, heading: Math.atan2(t.x, t.z), speed: 0, idx, lap: 0, boost: 0, driftT: 0,
      isBot: n !== 0, name: n === 0 ? 'YOU' : 'Bot ' + n, skill: 0.88 + Math.random()*0.12, lane: (Math.random()-.5)*10, u: idx/N, finished: false };
    karts.push(k);
  }
  player = karts[0]; state = 'countdown'; countdown = 3.99; clock.getDelta();
}

const MAX = 48, ACC = 30;
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
  } else { camera.position.set(0, 120, 200); camera.lookAt(30, 0, 60); }
  renderer.render(scene, camera);
}
loop();
