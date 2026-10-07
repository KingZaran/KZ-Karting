// Procedural kart + character models (original designs). Child 0 is always the painted chassis.
import { getChar, getKart, getWheel } from './roster.js';
import { MODELS } from './models.js';
export function buildKart(THREE, lo, paint) {
  const C = getChar(lo.char), K = getKart(lo.kart), Wh = getWheel(lo.wheel), g = new THREE.Group();
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, metalness: .1, ...o });
  const E = (c, i = 1) => M(c, { emissive: c, emissiveIntensity: i });
  const G = { box: (w, h, d) => new THREE.BoxGeometry(w, h, d), cyl: (a, b, h, s = 12) => new THREE.CylinderGeometry(a, b, h, s), sph: r => new THREE.SphereGeometry(r, 14, 10), cone: (r, h, s = 10) => new THREE.ConeGeometry(r, h, s), tor: (r, t, arc = 6.2832) => new THREE.TorusGeometry(r, t, 8, 18, arc) };
  const put = (parent, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; parent.add(m); return m; };
  const dark = M(0x1c1c22), chrome = M(0xcfd4dc, { metalness: .8, roughness: .25 }), paintM = M(paint, { metalness: .5, roughness: .3 });
  const base = .45 + Wh.r * .6, top = base + K.h, gk = MODELS.karts[lo.kart], L = K.l / 2;
  if (gk) {
    const m = gk.clone(true); m.traverse(o => { if (!o.isMesh) return; o.material = o.material.clone(); o.castShadow = true; if (!g.userData.body) g.userData.body = o; if (/paint|body/i.test(o.material.name)) { o.material.color.set(paint); g.userData.body = o; } }); g.add(m);
  } else {
  // chassis (child 0)
  const chassis = put(g, G.box(K.w, K.h, K.l), paintM, 0, base + K.h / 2, 0); g.userData.body = chassis;
  // style extras
  if (K.id === 'standard') { put(g, G.box(K.w * .8, .35, .9), paintM, 0, base + K.h * .6, L + .35); put(g, G.cyl(.18, .18, .8), chrome, -.6, base + .3, -L - .3, Math.PI / 2); put(g, G.cyl(.18, .18, .8), chrome, .6, base + .3, -L - .3, Math.PI / 2); }
  if (K.id === 'hotrod') { put(g, G.cone(.9, 2, 12), paintM, 0, base + .3, L + .8, Math.PI / 2); put(g, G.box(2.4, .12, .7), dark, 0, top + .8, -L + .1); put(g, G.box(.12, .8, .12), dark, -.8, top + .4, -L + .1); put(g, G.box(.12, .8, .12), dark, .8, top + .4, -L + .1); for (const s of [-1, 1]) put(g, G.cyl(.14, .2, 1, 10), chrome, s * .5, base + .4, -L - .4, Math.PI / 2); put(g, G.box(K.w * 1.1, .12, .5), dark, 0, base - .05, L + 1.2); }
  if (K.id === 'cruiser') { put(g, G.box(K.w * .9, .5, .25), chrome, 0, base + .3, L + .15); for (const s of [-1, 1]) { put(g, G.sph(.28), E(0xfff3b0, .9), s * .8, base + .55, L + .1); put(g, G.box(.1, .9, .5), paintM, s * (K.w / 2 - .2), top + .45, -L + .3); } put(g, G.box(K.w * 1.05, .3, .3), chrome, 0, base + .1, -L - .1); }
  if (K.id === 'buggy') { for (const [x, z] of [[-.85, .7], [.85, .7], [-.85, -.9], [.85, -.9]]) put(g, G.cyl(.07, .07, 1.7), chrome, x, top + .85, z); put(g, G.box(1.8, .08, 1.8), chrome, 0, top + 1.7, -.1); put(g, G.box(1.1, .7, .9), M(0x555a63, { metalness: .7 }), 0, top + .35, -L + .3); put(g, G.cyl(.25, .3, .6), chrome, 0, top + .9, -L + .3); }
  if (K.id === 'bumper') { put(g, G.tor(K.w * .55, .26), M(0xffffff), 0, base + .35, 0, Math.PI / 2).scale.set(1, 1.15, 1); put(g, G.cyl(.15, .15, .9), chrome, 0, top + .45, -.9); }
  if (K.id === 'tank') { for (const s of [-1, 1]) put(g, G.box(.3, .7, K.l * .9), M(0x4b5340, { metalness: .4 }), s * (K.w / 2 + .05), base + .45, 0); put(g, G.cyl(.55, .6, .6, 14), paintM, 0, top + .3, .6); put(g, G.cyl(.14, .14, 2, 10), dark, 0, top + .35, 1.8, Math.PI / 2); }
  // wheels
  const wr = Wh.r, wm = M(Wh.col), hub = M(0xb8bcc4, { metalness: .7 });
  for (const [x, z, sc] of [[-1, .32, 1], [1, .32, 1], [-1, -.32, K.id === 'buggy' ? 1.25 : 1], [1, -.32, K.id === 'buggy' ? 1.25 : 1]]) {
    const r = wr * sc, wx = x * (K.w / 2 + Wh.wd * .35), wz = z * K.l, w = put(g, G.cyl(r, r, Wh.wd, 16), wm, wx, r, wz, 0, 0, Math.PI / 2);
    put(g, G.cyl(r * .5, r * .5, Wh.wd + .06, 10), hub, wx, r, wz, 0, 0, Math.PI / 2);
    if (Wh.id === 'mud') for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832; put(g, G.box(Wh.wd * .95, .16, .2), wm, wx, r + Math.sin(a) * r, wz + Math.cos(a) * r, a, 0, 0); }
  }
  }
  put(g, G.tor(.32, .06), dark, 0, top + .55, L * .35, -.9);       // steering wheel
  // driver
  const seatY = top, cg = new THREE.Group(); cg.position.set(0, seatY, -K.l * .14); cg.scale.setScalar(C.scale || 1); g.add(cg);
  put(g, G.box(K.w * .55, .9, .35), dark, 0, top + .45, -K.l * .14 - .65);   // seat back
  const gc = MODELS.chars[C.id];
  if (gc) { const m = gc.clone(true); m.traverse(o => { if (o.isMesh) o.castShadow = true; }); cg.add(m); } else buildChar(THREE, C, cg, M, E, G, put);
  return g;
}
function buildChar(THREE, C, cg, M, E, G, put) {
  const { body, skin, accent } = C.c, bm = M(body), sm = M(skin), am = M(accent);
  const torso = (w = .95, h = .95, d = .7, mat = bm) => put(cg, G.box(w, h, d), mat, 0, .55, 0);
  const head = (r = .55, mat = sm, y = 1.45) => put(cg, G.sph(r), mat, 0, y, 0);
  const arms = (mat = sm) => { for (const s of [-1, 1]) put(cg, G.cyl(.12, .12, .8), mat, s * .55, .6, .45, Math.PI / 2.2); };
  const eyes = (y = 1.5, d = .2, z = .46, col = 0xffffff, r = .13) => { for (const s of [-1, 1]) { put(cg, G.sph(r), M(col), s * d, y, z); put(cg, G.sph(r * .5), M(0x111111), s * d, y, z + r * .75); } };
  switch (C.kind) {
    case 'ink': torso(); head(); arms(); eyes(1.5); for (const [x, rz] of [[-.35, .35], [0, 0], [.35, -.35]]) put(cg, G.cone(.2, 1.2), am, x, 1.9, -.55, -1.05, 0, rz); break;
    case 'bun': torso(); head(.58); arms(); eyes(1.5); for (const s of [-1, 1]) { put(cg, G.cyl(.14, .16, 1.1), sm, s * .26, 2.15, -.1, -.15, 0, -s * .12); put(cg, G.cyl(.07, .09, .9), am, s * .26, 2.16, -.02, -.15, 0, -s * .12); } put(cg, G.sph(.1), am, 0, 1.38, .58); break;
    case 'sprout': torso(.85, .85, .65); head(.58); arms(); eyes(1.5); put(cg, G.cyl(.05, .07, .5), M(0x2f9d3a), 0, 2.15, 0); for (const s of [-1, 1]) put(cg, G.sph(.3), am, s * .3, 2.45, 0, 0, 0, -s * .5).scale.set(1, .35, .7); break;
    case 'smiler': torso(.9, .9, .65); head(.62); arms(bm); for (const s of [-1, 1]) put(cg, G.sph(.1), E(0xffffff, 1.4), s * .22, 1.62, .55); put(cg, G.tor(.34, .05, 3.14), E(0xffffff, 1.4), 0, 1.38, .56, 0, 0, Math.PI); break;
    case 'mask': torso(); put(cg, G.sph(.58), sm, 0, 1.45, .02).scale.set(1, 1.1, .9); for (const s of [-1, 1]) { put(cg, G.sph(.1), M(0x111111), s * .2, 1.5, .5); put(cg, G.cone(.12, .9), am, s * .32, 2.2, 0, 0, 0, -s * .35); } arms(bm); put(cg, G.cone(.5, .5), bm, 0, .02, 0, Math.PI); break;
    case 'dancer': put(cg, G.cone(.8, 1.5, 14), bm, 0, .6, 0); head(.5); arms(bm); eyes(1.45, .17, .42, 0x111111, .08); put(cg, G.sph(.55), M(0x7a0f1e), 0, 1.58, -.12).scale.set(1, .85, 1); put(cg, G.cyl(.04, .04, 1.6), am, .5, 1, -.55, 0, 0, .8); break;
    case 'brawler': torso(1.05, 1, .75); head(.54); arms(); eyes(1.5); put(cg, G.tor(.52, .08), am, 0, 1.68, 0, Math.PI / 2); for (const s of [-1, 1]) { put(cg, G.box(.1, .5, .08), am, s * .15, 1.55, -.55, .3); put(cg, G.sph(.22), am, s * .35, .5, .85); } break;
    case 'party': torso(); head(.55); arms(); eyes(1.5); put(cg, G.cone(.4, 1.1), am, 0, 2.25, 0, 0.1); put(cg, G.sph(.12), M(0x4fc3ff), 0, 2.85, .05); put(cg, G.sph(.13), M(0xe53935), 0, 1.4, .58); put(cg, G.tor(.5, .13), M(0x4fc3ff), 0, 1.0, 0, Math.PI / 2); break;
    case 'hazmat': torso(1.15, 1.1, .85); put(cg, G.sph(.65), M(0xeceff1, { transparent: true, opacity: .55 }), 0, 1.55, 0); put(cg, G.box(.8, .35, .3), E(0x111111, .1), 0, 1.55, .5); put(cg, G.cyl(.18, .18, .45), am, .38, 1.15, .55, Math.PI / 2); arms(bm); put(cg, G.box(.7, .5, .3), M(0xbba000), 0, .7, -.55); break;
    case 'golem': torso(1.2, 1.1, .9); put(cg, G.box(.9, .85, .85), sm, 0, 1.55, 0); for (const s of [-1, 1]) put(cg, G.box(.18, .1, .06), E(accent, 1.4), s * .22, 1.62, .45); arms(bm); put(cg, G.box(.5, .12, .5), M(0x4a8a3a), -.3, 1.04, .1); put(cg, G.box(.4, .12, .4), M(0x4a8a3a), .4, 1.15, -.2); break;
    case 'brute': torso(1.2, 1.1, .85); head(.58); arms(bm); for (const s of [-1, 1]) { put(cg, G.sph(.18), E(accent, 1.4), s * .22, 1.52, .5); put(cg, G.cone(.15, .9), M(0x1a0a08), s * .4, 2.1, 0, 0, 0, -s * .4); put(cg, G.sph(.4), bm, s * .75, 1.0, 0); } put(cg, G.box(.9, .06, .05), E(accent, 1.2), 0, .55, .45); put(cg, G.box(.06, .6, .05), E(accent, 1.2), .3, .7, .45); break;
    case 'yeti': put(cg, G.sph(.7), bm, 0, .6, 0); put(cg, G.sph(.6), bm, 0, 1.4, 0); put(cg, G.sph(.4), sm, 0, 1.38, .38); eyes(1.5, .17, .56, 0xffffff, .1); arms(bm); for (const s of [-1, 1]) put(cg, G.cone(.12, .5), am, s * .38, 2, 0, 0, 0, -s * .4); break;
  }
}
