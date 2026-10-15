// Extra realism for the procedural karts: panel lines, decals, cockpit, dash, aero, lights, engine/exhaust bits, per-kart extras.
// Everything is built as plain meshes on the kart group and merged per material afterwards (mergeStatic) so it stays cheap to draw.
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const cache = {};
function canvasTex(THREE, key, w, h, draw, repeat) {
  const k = key + w; if (cache[k]) return cache[k];
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); }
  return cache[k] = t;
}
const numFor = id => { let n = 0; for (const ch of String(id)) n = (n * 31 + ch.charCodeAt(0)) % 97; return n + 2; };

export function kartDetail(c) {
  const { THREE, g, G, put, M, E, dark, chrome, seatM, paintM, paint, K, Wh, W2, L, base, top, nose, tail, hood, rim, h, charId } = c;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const mat = (col, o = {}) => new THREE.MeshStandardMaterial({ color: col, roughness: .5, metalness: .1, ...o });
  const trim = M(0x15151a, { roughness: .4, metalness: .5 }), rubber = mat(0x0e0e10, { roughness: .95 }), alu = M(0xaab0b8, { metalness: .9, roughness: .3 });
  const carbonT = canvasTex(THREE, 'carbon', 64, 64, (x, w, hh) => { x.fillStyle = '#0c0c0e'; x.fillRect(0, 0, w, hh); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#2a2c31' : '#17181b'; x.fillRect(i * 8, j * 8, 8, 8); x.strokeStyle = '#3a3d44'; x.lineWidth = 1; x.beginPath(); for (let k = 0; k < 8; k += 2) { x.moveTo(i * 8, j * 8 + k); x.lineTo(i * 8 + 8, j * 8 + k + ((i + j) % 2 ? 8 : -8)); } x.stroke(); } }, 3);
  const carbon = mat(0xffffff, { map: carbonT, roughness: .35, metalness: .3 });
  const rod = (a, b, r, m) => { const d = b.clone().sub(a), len = d.length(), cyl = new THREE.Mesh(G.cyl(r, r, len, 8), m); cyl.position.copy(a).addScaledVector(d, .5); cyl.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); cyl.castShadow = true; g.add(cyl); return cyl; };
  const decal = (tex, w, hh, x, y, z, ry, extra = {}) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), new THREE.MeshStandardMaterial({ map: tex, alphaTest: .4, roughness: .4, side: THREE.DoubleSide, ...extra })); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m; };
  const num = numFor(charId);
  const roundel = canvasTex(THREE, 'roundel' + num, 128, 128, (x, w) => { x.clearRect(0, 0, w, w); x.fillStyle = '#fff'; x.beginPath(); x.arc(64, 64, 60, 0, 7); x.fill(); x.fillStyle = '#111'; x.beginPath(); x.arc(64, 64, 52, 0, 7); x.fill(); x.fillStyle = '#fff'; x.font = 'bold 66px Arial Black, Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(num), 64, 70); });
  const gaugeT = canvasTex(THREE, 'gauge', 256, 96, (x, w, hh) => { x.fillStyle = '#05070a'; x.fillRect(0, 0, w, hh); for (const [cx, col, v] of [[64, '#3cf', .7], [192, '#fa3', .45]]) { x.strokeStyle = col; x.lineWidth = 4; x.beginPath(); x.arc(cx, 52, 36, Math.PI * .8, Math.PI * 2.2); x.stroke(); for (let i = 0; i <= 10; i++) { const a = Math.PI * .8 + i / 10 * Math.PI * 1.4; x.lineWidth = 2; x.beginPath(); x.moveTo(cx + Math.cos(a) * 30, 52 + Math.sin(a) * 30); x.lineTo(cx + Math.cos(a) * 36, 52 + Math.sin(a) * 36); x.stroke(); } const a = Math.PI * .8 + v * Math.PI * 1.4; x.strokeStyle = '#f33'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx, 52); x.lineTo(cx + Math.cos(a) * 30, 52 + Math.sin(a) * 30); x.stroke(); } x.fillStyle = '#7f7'; x.fillRect(112, 74, 32, 10); });
  const body = M(paint, {}); const accent = mat(0xf4f4f0, { roughness: .35 });
  const bevelX = W2 - .02;

  // ---- panel lines, door handles, side decals (both flanks)
  for (const sx of [-1, 1]) {
    const x = sx * (bevelX + .03);
    for (const z of [-1.25, .35]) put(g, G.box(.02, h * .78, .03), trim, x, base + h * .52, z);
    put(g, G.box(.02, .03, 1.62), trim, x, base + h * .2, -.45);
    put(g, G.box(.04, .07, .32), chrome, sx * (bevelX + .045), base + h * .74, .0);
    put(g, G.box(.04, .12, .5), trim, sx * (bevelX + .03), base + h * .45, -1.6);
    for (let i = 0; i < 4; i++) put(g, G.box(.03, .02, .42), chrome, sx * (bevelX + .035), base + h * (.3 + i * .12), -1.62);
    decal(roundel, .62, .62, sx * (bevelX + .045), base + h * .5, .62, sx * Math.PI / 2);
    put(g, G.box(.04, .05, .3), E(0xffa000, 1.1), sx * (bevelX + .02), base + nose * .6 + .1, L * .7);       // side repeater
  }
  put(g, G.cyl(.1, .1, .05, 14), chrome, bevelX + .06, base + h * .62, -L * .55, 0, 0, Math.PI / 2);          // fuel cap
  // ---- hood louvers, vents and a centre spine
  for (let i = 0; i < 5; i++) { const z = L * (.5 + i * .075); put(g, G.box(K.w * .26, .025, .07), carbon, 0, base + hood + .115 - i * .003, z, -.12); }
  for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) put(g, G.box(.02, .035, .24), carbon, sx * bevelX * .98, base + h * (.33 + i * .1), L * .55 + .0).rotation.z = 0;
  // ---- lights: bezels, grille, fog lamps, indicators, LED brake strip
  for (const sx of [-1, 1]) {
    put(g, G.tor(.27, .035), chrome, sx * K.w * .3, base + nose * .85 + .1, L + .23).scale.set(1, .72, 1);
    put(g, G.sph(.1), E(0xbfe9ff, 1.8), sx * K.w * .3, base + nose * .85 + .1, L + .3);
    put(g, G.box(.3, .08, .06), E(0xffa000, 1.2), sx * K.w * .44, base + nose * .55, L + .24);
    put(g, G.sph(.07), E(0xfff3c0, 1.2), sx * K.w * .2, base + .22, L + .3);
    put(g, G.box(.28, .08, .06), E(0xff1a1a, 1.4), sx * K.w * .4, base + tail * .8, -L - .3);
    put(g, G.cyl(.06, .06, .05, 10), E(0xffffff, .9), sx * K.w * .15, base + tail * .62, -L - .31, Math.PI / 2);
    const arm = new THREE.Group(); arm.position.set(sx * (W2 - .12), top + .22, L * .28); g.add(arm);
    put(arm, G.cyl(.03, .03, .35, 8), chrome, sx * .12, .12, 0, 0, 0, -sx * .8); put(arm, G.box(.22, .14, .05), chrome, sx * .26, .26, 0, 0, sx * .3, 0); put(arm, G.box(.18, .1, .02), alu, sx * .26, .26, -.03, 0, sx * .3, 0);
  }
  put(g, G.box(K.w * .62, .045, .05), E(0xff1a1a, 1.2), 0, base + tail * .8, -L - .3);
  for (let i = 0; i < 5; i++) put(g, G.box(K.w * .34, .018, .035), chrome, 0, base + nose * (.35 + i * .1), L + .29);
  put(g, G.box(K.w * .38, nose * .6, .03), trim, 0, base + nose * .55, L + .27);
  put(g, G.box(K.w * .9, .07, .4), carbon, 0, base + .02, L + .3);                                            // splitter
  put(g, G.box(.05, .1, .45), carbon, -K.w * .45, base + .08, L + .3); put(g, G.box(.05, .1, .45), carbon, K.w * .45, base + .08, L + .3);
  put(g, G.cyl(.05, .05, .08, 8), alu, -K.w * .36, base + .1, L + .44, Math.PI / 2); put(g, G.tor(.07, .02), alu, K.w * .36, base + .1, L + .46);   // tow eye + hook
  // ---- rear: plate, diffuser, bumper, mud flaps
  put(g, G.box(.85, .3, .035), accent, 0, base + tail * .42, -L - .3);
  for (let i = 0; i < 5; i++) put(g, G.box(.06, .15, .01), trim, (i - 2) * .14, base + tail * .42, -L - .32);
  put(g, G.box(K.w * .86, .22, .1), carbon, 0, base + .12, -L - .26);
  for (let i = -3; i <= 3; i++) put(g, G.box(.035, .2, .5), carbon, i * .26, base + .08, -L - .3);
  for (const sx of [-1, 1]) put(g, G.box(.05, .42, .34), rubber, sx * (W2 - .2), base + .08, -.32 * K.l - Wh.r - .15);
  // ---- cockpit: leather coaming with piping, bucket seat with stitching, dash and cluster
  const cz = -K.l * .14, cw = K.w * .64, cl = K.l * .36, cy = top + .1;
  const leather = mat(0x201a18, { roughness: .7 });
  for (const sx of [-1, 1]) put(g, G.box(.1, .12, cl), leather, sx * cw / 2, cy, cz);
  put(g, G.box(cw, .12, .1), leather, 0, cy, cz + cl / 2); put(g, G.box(cw, .12, .1), leather, 0, cy, cz - cl / 2);
  for (const sx of [-1, 1]) put(g, G.box(.025, .03, cl * .98), accent, sx * (cw / 2 - .05), cy + .07, cz);
  put(g, G.box(cw * .66, .2, cl * .72), seatM, 0, cy + .02, cz - .05);                                         // cushion
  for (const sx of [-1, 1]) { put(g, G.box(.16, .55, .3), seatM, sx * (K.w * .25), top + .85, cz - .62, -.15); put(g, G.box(.03, .5, .02), accent, sx * (K.w * .25), top + .85, cz - .46, -.15); }
  put(g, G.box(K.w * .12, .75, .02), mat(paint, { roughness: .5 }), 0, top + .55, cz - .53);
  put(g, G.box(K.w * .3, .24, .22), seatM, 0, top + 1.18, cz - .72);
  const dz = L * .36 + .3, dash = put(g, G.box(K.w * .62, .26, .5), M(0x17171b, { roughness: .6 }), 0, top + .12, dz, -.35);
  const cl2 = new THREE.Mesh(new THREE.PlaneGeometry(.62, .23), new THREE.MeshStandardMaterial({ map: gaugeT, emissiveMap: gaugeT, emissive: 0xffffff, emissiveIntensity: 1.2, roughness: .3 }));
  cl2.position.set(0, top + .3, dz - .13); cl2.rotation.set(.5, Math.PI, 0); g.add(cl2);
  put(g, G.cyl(.09, .09, .5, 12), M(0x17171b), 0, top + .36, L * .26, 1.0);                                      // column shroud
  put(g, G.cyl(.035, .035, .45, 8), chrome, K.w * .22, top + .3, cz + .5, .35); put(g, G.sph(.07), dark, K.w * .22, top + .52, cz + .43);   // shifter
  for (const sx of [-1, 1]) put(g, G.box(.14, .03, .12), alu, sx * .22, top + .1, L * .24 + .1, -.3);          // pedals
  // ---- kart-specific
  const flare = (wx, wz, r) => put(g, G.tor(r * 1.25, .08, Math.PI), paintM, Math.sign(wx) * (W2 + .0), r, wz, 0, Math.PI / 2, 0);
  for (const sx of [-1, 1]) for (const f of [.32, -.32]) flare(sx, f * K.l, Wh.r * (K.id === 'buggy' && f < 0 ? 1.25 : 1));
  if (K.id === 'standard') {
    put(g, G.box(K.w * .88, .09, .5), paintM, 0, base + tail + .24, -L + .06, .12);                             // ducktail
    for (const sx of [-1, 1]) { put(g, G.box(.05, .3, .5), paintM, sx * K.w * .44, base + tail + .24, -L + .06); put(g, G.box(.13, .13, 1.55), alu, sx * (W2 - .02), base + .12, -.1); }
    put(g, G.tor(K.w * .33, .05, Math.PI), chrome, 0, top + .25, cz - .95, 0, 0, 0);                                // roll hoop
    for (const sx of [-1, 1]) rod(V(sx * K.w * .33, top + .25, cz - .95), V(sx * K.w * .3, top + .1, cz - 1.7), .045, chrome);
    for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) put(g, G.box(.1, .025, .05), trim, sx * (bevelX + .03), base + h * .62, L * (.2 + i * .12));
  }
  if (K.id === 'hotrod') {
    const flameT = canvasTex(THREE, 'flame', 256, 96, (x, w, hh) => { for (let i = 0; i < 7; i++) { const g2 = x.createLinearGradient(0, 0, w, 0); g2.addColorStop(0, '#ffd23a'); g2.addColorStop(.5, '#ff7a1a'); g2.addColorStop(1, 'rgba(255,60,20,0)'); x.fillStyle = g2; x.beginPath(); x.moveTo(0, 8 + i * 12); x.bezierCurveTo(w * .35, 8 + i * 12 - 10 - (i % 3) * 5, w * .6, 8 + i * 12 + 6, w, 4 + i * 12 + (i % 2) * 6); x.bezierCurveTo(w * .6, 8 + i * 12 + 12, w * .3, 8 + i * 12 + 14, 0, 14 + i * 12); x.fill(); } });
    for (const sx of [-1, 1]) { decal(flameT, 1.9, .55, sx * (bevelX + .045), base + h * .6, L * .5, sx * Math.PI / 2); put(g, G.cyl(.075, .075, K.l * .55, 12), chrome, sx * (W2 + .1), base + .1, -.2, Math.PI / 2); for (let i = 0; i < 7; i++) put(g, G.box(.025, .02, .08), trim, sx * (W2 + .17), base + .1, -.2 - K.l * .24 + i * K.l * .08); }
    const blk = M(0x7b7f88, { metalness: .8, roughness: .4 });
    put(g, G.box(.95, .3, 1.0), blk, 0, base + hood + .22, L * .55 + .05); for (const sx of [-1, 1]) put(g, G.box(.38, .12, .95), mat(0xd32f2f, { roughness: .3, metalness: .5 }), sx * .32, base + hood + .42, L * .55 + .05);
    for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) put(g, G.cyl(.06, .08, .22, 10), chrome, sx * .32, base + hood + .56, L * .55 - .34 + i * .24);
    put(g, G.cyl(.18, .18, .06, 18), alu, 0, base + hood + .36, L * .55 + .62, Math.PI / 2);
    for (const sx of [-1, 1]) put(g, G.box(.04, .22, .3), E(0xff2a2a, 1.0), sx * .55, base + tail * .6, -L - .3);
  }
  if (K.id === 'cruiser') {
    for (const sx of [-1, 1]) { put(g, G.box(.03, .05, K.l * .78), chrome, sx * (bevelX + .045), base + h * .5, 0); put(g, G.box(.04, .22, .16), chrome, sx * (bevelX + .05), base + h * .9, L * .75); }
    put(g, G.box(K.w * .5, .1, .06), chrome, 0, base + hood + .16, L * .86);                                    // hood ornament base
    put(g, G.cone(.07, .3, 8), chrome, 0, base + hood + .3, L * .86, Math.PI / 2);
    for (const sx of [-1, 1]) { put(g, G.box(.1, .5, .14), chrome, sx * (W2 - .05), base + .2, L + .32); put(g, G.box(.1, .5, .14), chrome, sx * (W2 - .05), base + .2, -L - .32); }
  }
  if (K.id === 'buggy') {
    for (const sx of [-1, 1]) for (const z of [.7, -.95]) { const wz = z > 0 ? .32 * K.l : -.32 * K.l; rod(V(sx * (W2 - .2), base + .05, wz - .45), V(sx * (W2 + .35), Wh.r * 1.2, wz), .05, chrome); rod(V(sx * (W2 - .2), base + .05, wz + .45), V(sx * (W2 + .35), Wh.r * 1.2, wz), .05, chrome);
      const a0 = V(sx * (W2 + .35), Wh.r * 1.3, wz), a1 = V(sx * (W2 - .1), top + .55, wz); rod(a0, a1, .06, mat(0x222428, { metalness: .7 }));
      for (let i = 0; i < 8; i++) { const p = a0.clone().lerp(a1, (i + .5) / 8); put(g, G.tor(.1, .02), mat(0xe53935), p.x, p.y, p.z, Math.PI / 2, 0, 0); } }
    put(g, G.box(K.w * 1.0, .16, .16), alu, 0, base + .5, L + .5); for (const sx of [-1, 1]) put(g, G.box(.1, .55, .1), alu, sx * K.w * .38, base + .5, L + .45);   // bull bar
    put(g, G.box(K.w * .9, .14, .14), dark, 0, top + 1.78, .7); for (let i = 0; i < 6; i++) put(g, G.cyl(.07, .07, .06, 12), E(0xfff6d0, 1.6), (i - 2.5) * .28, top + 1.78, .78, Math.PI / 2);   // light bar
    put(g, G.tor(.5, .16), rubber, 0, base + .9, -L - .5, 0, 0, 0); put(g, G.cyl(.3, .3, .1, 18), alu, 0, base + .9, -L - .46, Math.PI / 2);  // spare wheel
    put(g, G.cyl(.09, .09, .5, 12), mat(0xd32f2f), K.w * .3, top + .5, -L * .5, 0, 0, 0);                         // extinguisher
    put(g, G.box(K.w * .7, .05, 1.1), alu, 0, base - .02, .3);                                                  // skid plate
  }
  if (K.id === 'bumper') {
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.2832; put(g, G.sph(.07), chrome, Math.cos(a) * K.w * .56, base + .4, Math.sin(a) * K.w * .56 * 1.0 * (K.l / K.w) * .92).scale.set(1, 1, 1); }
    put(g, G.cyl(.04, .04, .9, 8), chrome, 0, top + 1.5, -.95); put(g, G.sph(.1), E(0xff3030, 1.2), 0, top + 1.98, -.95);
    for (const sx of [-1, 1]) put(g, G.cyl(.02, .02, .9, 6), chrome, sx * .3, top + 1.5, -.95).rotation.z = sx * .15;
    put(g, G.box(.9, .45, .05), accent, 0, base + .62, L - .02);
    for (let i = 0; i < 5; i++) put(g, G.box(.12, .12, .02), E(0xffd400, .7), (i - 2) * .17, base + .62, L + .01);
  }
  if (K.id === 'tank') {
    const riv = M(0x2f3528, { metalness: .6, roughness: .5 });
    for (const sx of [-1, 1]) { for (let i = 0; i < 9; i++) for (let j = 0; j < 2; j++) put(g, G.cyl(.045, .045, .04, 8), riv, sx * (W2 + .3), base + .22 + j * .55, -K.l * .42 + i * K.l * .105, 0, 0, Math.PI / 2);
      for (let i = 0; i < 3; i++) put(g, G.cyl(.06, .06, .3, 10), dark, sx * .62, top + .62 + i * .1, .6, Math.PI / 2, 0, 0);   // smoke launchers
    }
    put(g, G.cyl(.2, .2, .35, 14), alu, 0, top + .34, 1.9 + .65, Math.PI / 2);                                  // bore evacuator
    put(g, G.cyl(.22, .22, .12, 14), dark, 0, top + .34, 1.9 + 1.05, Math.PI / 2);                               // muzzle brake
    put(g, G.cyl(.18, .18, .12, 16), alu, .28, top + .75, .5); put(g, G.box(.3, .08, .3), dark, -.3, top + .72, .55); // hatch + searchlight
    put(g, G.cyl(.015, .015, 1.4, 6), chrome, -.45, top + 1.2, .2); put(g, G.box(.22, .14, .01), E(0xe53935, .8), -.35, top + 1.8, .2);
    for (const sx of [-1, 1]) put(g, G.box(.34, .26, .5), riv, sx * (W2 + .05), base + .86, K.l * .38);          // front fender box
  }
  return g;
}

// Merge every static mesh in `group` into one mesh per material (draw-call saver). `skip` meshes are left alone.
export function mergeStatic(THREE, group, skip = []) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert(), buckets = new Map(), kill = [];
  group.children.forEach(o => {
    if (!o.isMesh || skip.includes(o) || !o.geometry.index) return;
    const geo = o.geometry.clone(); o.updateMatrix(); geo.applyMatrix4(o.matrix);
    for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
    if (!geo.attributes.uv) return;
    let b = buckets.get(o.material); if (!b) buckets.set(o.material, b = []); b.push(geo); kill.push(o);
  });
  kill.forEach(o => group.remove(o));
  for (const [m, list] of buckets) { const merged = mergeGeometries(list, false); if (!merged) continue; const mesh = new THREE.Mesh(merged, m); mesh.castShadow = true; group.add(mesh); }
}
