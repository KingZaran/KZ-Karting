// Procedural kart + character models (original designs): extruded smooth bodies, tyres with spokes, clear-coat paint, lit lamps.
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { getChar, getKart, getWheel } from './roster.js';
import { MODELS, cloneModel } from './models.js';
export function buildKart(THREE, lo, paint, env = null) {
  const C = getChar(lo.char), K = getKart(lo.kart), Wh = getWheel(lo.wheel), g = new THREE.Group();
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, metalness: .1, envMap: env, envMapIntensity: .7, ...o });
  const E = (c, i = 1) => M(c, { emissive: c, emissiveIntensity: i, envMap: null });
  const G = { box: (w, h, d) => new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) * .3), cyl: (a, b, h, s = 24) => new THREE.CylinderGeometry(a, b, h, s), sph: r => new THREE.SphereGeometry(r, 28, 20), cone: (r, h, s = 20) => new THREE.ConeGeometry(r, h, s), tor: (r, t, arc = 6.2832) => new THREE.TorusGeometry(r, t, 12, 32, arc) };
  const put = (parent, geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; parent.add(m); return m; };
  const dark = M(0x1c1c22, { roughness: .5 }), chrome = M(0xdfe4ec, { metalness: .95, roughness: .15, envMapIntensity: 1.2 }), seatM = M(0x26262e, { roughness: .8 });
  const paintM = new THREE.MeshPhysicalMaterial({ color: paint, metalness: .35, roughness: .3, clearcoat: 1, clearcoatRoughness: .08, envMap: env, envMapIntensity: 1.1 });
  const base = .45 + Wh.r * .6, top = base + K.h, gk = MODELS.karts[lo.kart], L = K.l / 2, W2 = K.w / 2;
  g.userData.wheels = [];
  if (gk) {
    const m = cloneModel(gk); m.traverse(o => { if (!o.isMesh) return; o.material = o.material.clone(); o.castShadow = true; if (env) { o.material.envMap = env; o.material.envMapIntensity = .8; } if (!g.userData.body) g.userData.body = o; if (/paint|body/i.test(o.material.name)) { o.material.color.set(paint); g.userData.body = o; } }); g.add(m);
  } else {
    // ---- smooth body: side silhouette extruded across the kart's width
    const SP = { standard: [1.2, 1.0, .85, .5], hotrod: [1.0, .9, 1.3, .45], cruiser: [1.25, 1.1, .9, .6], buggy: [1.0, .85, .75, .5], bumper: [1.1, 1.0, .9, .8], tank: [1.2, 1.05, .8, .55] }[K.id] || [1.2, 1, .85, .5];
    const [tailK, rimK, hoodK, noseK] = SP, h = K.h, tail = h * tailK, rim = h * rimK, hood = h * hoodK * .75 + .1, nose = hood * noseK;
    const s = new THREE.Shape();
    s.moveTo(-L, 0); s.lineTo(-L, tail * .9); s.quadraticCurveTo(-L, tail + .12, -L + .5, tail + .12);
    s.bezierCurveTo(-L * .55, tail + .14, -L * .45, rim + .12, -L * .15, rim + .12); s.lineTo(L * .02, rim + .1);
    s.bezierCurveTo(L * .3, rim + .08, L * .45, hood + .1, L * .8, hood + .06); s.quadraticCurveTo(L, hood, L, nose); s.lineTo(L, 0); s.closePath();
    const depth = K.w - .7, bevel = .32, geoB = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * .85, bevelSegments: 5, curveSegments: 24 });
    geoB.rotateY(-Math.PI / 2); geoB.computeBoundingBox(); const bb = geoB.boundingBox; geoB.translate(-(bb.min.x + bb.max.x) / 2, 0, 0); geoB.computeVertexNormals();
    const chassis = put(g, geoB, paintM, 0, base, 0); g.userData.body = chassis;
    // underbody + seat tub + steering
    put(g, G.box(K.w * .85, .22, K.l * .9), dark, 0, base + .05, 0);
    put(g, G.box(K.w * .62, .55, K.l * .3), seatM, 0, base + rim + .16, -K.l * .14);
    put(g, G.box(K.w * .55, 1.0, .35), seatM, 0, top + .55, -K.l * .14 - .7);
    put(g, G.cyl(.06, .06, .8, 10), dark, 0, top + .38, L * .3, .9);
    put(g, G.tor(.32, .06), dark, 0, top + .6, L * .35, -.75);
    // lights
    for (const sx of [-1, 1]) { const hl = put(g, G.sph(.26), E(0xfff4c0, 1.6), sx * K.w * .3, base + nose * .85 + .1, L - .05); hl.scale.set(1, .7, .5); put(g, G.box(.5, .16, .12), E(0xff2a2a, 1.6), sx * K.w * .3, base + tail * .62, -L - .1); }
    // style extras
    const fender = (wx, wz, wr) => put(g, G.box(Wh.wd + .35, .16, wr * 2.4), paintM, wx, wr * 2 + .1, wz);
    if (K.id === 'standard') { for (const sx of [-1, 1]) { put(g, G.cyl(.17, .17, .9, 18), chrome, sx * .6, base + .45, -L - .35, Math.PI / 2); put(g, G.cyl(.1, .1, .12, 14), dark, sx * .6, base + .45, -L - .82, Math.PI / 2); } put(g, G.box(K.w * .85, .22, .5), chrome, 0, base + .3, L + .12); }
    if (K.id === 'hotrod') { put(g, G.box(2.5, .12, .75), paintM, 0, top + .9, -L + .1); for (const sx of [-1, 1]) { put(g, G.box(.12, .9, .12), dark, sx * .85, top + .45, -L + .1); put(g, G.cyl(.13, .2, 1.1, 14), chrome, sx * .5, base + .45, -L - .45, Math.PI / 2); put(g, G.cone(.16, .5, 10), E(0xff7a1a, 1.3), sx * .5, base + .45, -L - 1.2, -Math.PI / 2); } put(g, G.box(K.w * 1.15, .12, .5), dark, 0, base - .02, L + 1.3); put(g, G.cyl(.3, .3, .5, 14), chrome, 0, base + hood + .3, L * .55); }
    if (K.id === 'cruiser') { put(g, G.box(K.w * .92, .55, .26), chrome, 0, base + .3, L + .12); for (const sx of [-1, 1]) { put(g, G.box(.12, .95, .55), paintM, sx * (W2 - .15), top + .5, -L + .35); fender(sx * (W2 + Wh.wd * .35), -.32 * K.l, Wh.r); fender(sx * (W2 + Wh.wd * .35), .32 * K.l, Wh.r); } put(g, G.box(K.w * 1.05, .3, .3), chrome, 0, base + .12, -L - .12); }
    if (K.id === 'buggy') { for (const [x, z] of [[-.85, .7], [.85, .7], [-.85, -.95], [.85, -.95]]) put(g, G.cyl(.07, .07, 1.7, 12), chrome, x, top + .85, z); for (const z of [.7, -.95]) put(g, G.cyl(.07, .07, 1.7, 12), chrome, 0, top + 1.7, z, 0, 0, Math.PI / 2).scale.set(1, 1, 1); put(g, G.cyl(.07, .07, 1.7, 12), chrome, -.85, top + 1.7, -.12, Math.PI / 2); put(g, G.cyl(.07, .07, 1.7, 12), chrome, .85, top + 1.7, -.12, Math.PI / 2); put(g, G.box(1.1, .75, .9), M(0x555a63, { metalness: .7 }), 0, top + .45, -L + .3); put(g, G.cyl(.22, .26, .7, 14), chrome, 0, top + 1.1, -L + .3); }
    if (K.id === 'bumper') { put(g, G.tor(K.w * .56, .3), M(0xf2f2f2, { roughness: .35 }), 0, base + .4, 0, Math.PI / 2).scale.set(1, 1.2, 1); put(g, G.cyl(.14, .14, 1, 12), chrome, 0, top + .55, -.95); put(g, G.sph(.3), E(0xffd400, .8), 0, top + 1.15, -.95); }
    if (K.id === 'tank') { for (const sx of [-1, 1]) put(g, G.box(.42, .85, K.l * .92), M(0x4b5340, { metalness: .45, roughness: .55 }), sx * (W2 + .08), base + .5, 0); put(g, G.cyl(.62, .7, .62, 24), paintM, 0, top + .34, .6); put(g, G.cyl(.15, .15, 2.2, 14), dark, 0, top + .38, 1.9, Math.PI / 2); for (const sx of [-1, 1]) fender(sx * (W2 + Wh.wd * .35), 0, Wh.r); }
    // ---- wheels (front pair steers, all spin)
    const wr = Wh.r, tube = Math.min(Wh.wd * .5, wr * .4), tyre = M(Wh.col, { roughness: .9, metalness: 0, envMapIntensity: .2 }), hub = M(0xc2c7d0, { metalness: .9, roughness: .25, envMapIntensity: 1 });
    for (const [x, z, sc, front] of [[-1, .32, 1, true], [1, .32, 1, true], [-1, -.32, K.id === 'buggy' ? 1.25 : 1, false], [1, -.32, K.id === 'buggy' ? 1.25 : 1, false]]) {
      const r = wr * sc, wx = x * (W2 + Wh.wd * .35), wz = z * K.l, steer = new THREE.Group(), spin = new THREE.Group(); steer.position.set(wx, r, wz); steer.add(spin); g.add(steer);
      const tor = put(spin, G.tor(r - tube * .85, tube), tyre, 0, 0, 0, 0, Math.PI / 2, 0); tor.scale.set(1, 1, Wh.wd / (tube * 2));
      put(spin, G.cyl(r - tube * 1.4, r - tube * 1.4, Wh.wd * .7, 28), hub, 0, 0, 0, 0, 0, Math.PI / 2);
      for (let i = 0; i < 5; i++) { const a = i / 5 * 6.2832; put(spin, G.box(Wh.wd * .72, r * .26, r * 1.55), dark, 0, 0, 0, a, 0, 0); }
      put(spin, G.sph(r * .2), chrome, x * (Wh.wd * .35), 0, 0);
      if (Wh.id === 'mud') for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; put(spin, G.box(Wh.wd * .95, .16, .26), tyre, 0, Math.sin(a) * (r - .02), Math.cos(a) * (r - .02), a, 0, 0); }
      g.userData.wheels.push({ steer, spin, r, front, side: x });
    }
  }
  // ---- driver
  const seatY = top, cg = new THREE.Group(); cg.position.set(0, seatY, -K.l * .14); cg.scale.setScalar(C.scale || 1); g.add(cg);
  if (gk) { put(g, G.tor(.32, .06), dark, 0, top + .6, L * .35, -.75); put(g, G.box(K.w * .55, 1.0, .35), seatM, 0, top + .55, -K.l * .14 - .7); }
  const gc = MODELS.chars[C.id];
  if (gc) { const m = cloneModel(gc); m.traverse(o => { if (o.isMesh) { o.castShadow = true; if (o.material && !o.material.userData.own) { o.material = o.material.clone(); o.material.userData.own = true; if (env) { o.material.envMap = env; o.material.envMapIntensity = .5; } } } }); cg.add(m); } else buildChar(THREE, C, cg, M, E, G, put);
  return g;
}
function buildChar(THREE, C, cg, M, E, G, put) {
  const { body, skin, accent } = C.c, bm = M(body), sm = M(skin), am = M(accent);
  const torso = (w = .95, h = .95, d = .7, mat = bm) => put(cg, G.box(w, h, d), mat, 0, .55, 0);
  const head = (r = .55, mat = sm, y = 1.45) => put(cg, G.sph(r), mat, 0, y, 0);
  const arms = (mat = sm) => { for (const s of [-1, 1]) { put(cg, G.cyl(.13, .12, .85, 18), mat, s * .55, .6, .45, Math.PI / 2.2); put(cg, G.sph(.17), sm, s * .5, .52, .88); } };
  const eyes = (y = 1.5, d = .2, z = .46, col = 0xffffff, r = .13) => { for (const s of [-1, 1]) { put(cg, G.sph(r), M(col, { roughness: .2 }), s * d, y, z); put(cg, G.sph(r * .55), M(0x111111, { roughness: .1 }), s * d, y, z + r * .72); put(cg, G.sph(r * .18), E(0xffffff, 1), s * d - r * .12, y + r * .2, z + r * 1.18); } };
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
