// Zone themes. Each theme sets the look (sky, fog, road texture style, kerbs, mountains) and builds its own low-poly scenery.
// All decor builders return Groups made of shared geometry/materials; main.js merges them into a few draw calls.
export function buildThemes(THREE) {
  const R = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .85, ...o });
  const E = (c, i = .9, o = {}) => M(c, { emissive: c, emissiveIntensity: i, ...o });
  // faceted blob: displaced, non-indexed => crisp low-poly facets
  const disp = (geo, amt, freq = 1) => { const g = geo.index ? geo.toNonIndexed() : geo.clone(), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = Math.sin(x * 3.1 * freq + y * 2.3) * Math.cos(z * 2.7 * freq - x * 1.7) + Math.sin(y * 4.1 * freq + z * 3.3), s = 1 + amt * n * .5; p.setXYZ(i, x * s, y * s, z * s); } g.computeVertexNormals(); return g; };
  const variants = (fn, n = 3) => Array.from({ length: n }, fn);
  const geo = {
    cone: new THREE.ConeGeometry(1, 1, 12), cyl: new THREE.CylinderGeometry(1, 1, 1, 12), box: new THREE.BoxGeometry(1, 1, 1), sph: new THREE.SphereGeometry(1, 14, 10), oct: new THREE.OctahedronGeometry(1),
    blob: variants(() => disp(new THREE.IcosahedronGeometry(1, 1), .55)), rock: variants(() => disp(new THREE.IcosahedronGeometry(1, 1), .9, 1.3)), crystal: new THREE.CylinderGeometry(.0, 1, 1, 6, 1),
  };
  const part = (g, m, sx, sy, sz, y, x = 0, z = 0, cast = true, rx = 0, rz = 0) => { const o = new THREE.Mesh(Array.isArray(g) ? pick(g) : geo[g] || g, m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); o.rotation.set(rx, Math.random() * 6.28, rz); o.castShadow = cast; return o; };
  const grp = (...p) => { const g = new THREE.Group(); p.flat(Infinity).forEach(x => g.add(x)); return g; };
  const trunkM = M(0x6b4a2b), pines = [0x1f6b2f, 0x2a7a35, 0x185a28].map(c => M(c)), leaves = [0x3a9a3a, 0x4aaa44, 0x2f8a3a, 0x6bbf4a].map(c => M(c)), rockM = [0x8a8a86, 0x777772, 0x9a9a94].map(c => M(c, { roughness: .95 }));
  const flowerM = [0xff5a7a, 0xffd23f, 0xffffff, 0xb07aff].map(c => M(c, { emissive: c, emissiveIntensity: .15 }));
  const sand = [0xd9b56c, 0xcca55a].map(c => M(c)), cac = M(0x4d8b3a), sandstone = [0xb8864a, 0xa5733c].map(c => M(c, { roughness: .95 }));
  const ice = M(0x9fd4e6, { roughness: .15, metalness: .1 }), icec = M(0xcdeeff, { roughness: .1, emissive: 0x4aa8d8, emissiveIntensity: .25 }), snow = M(0xf4f9ff, { roughness: .9 }), snowPine = M(0xe8f2ff);
  const neonBase = [0x14142a, 0x1a1a38, 0x101024].map(c => M(c, { roughness: .5, metalness: .3 })), glowC = [0xff2bd6, 0x00e5ff, 0xffe600, 0x7a5cff].map(c => E(c, 1.3));
  const cave = [0x2a3350, 0x222a44, 0x303a5a].map(c => M(c, { roughness: .95 })), crystalM = [E(0x7fe8ff, 1.3), E(0x8fa8ff, 1.2)], shroomStem = M(0xdfe6ff), shroomCap = [E(0x7fa0ff, 1), E(0x66e0ff, 1), E(0xb08fff, .9)];
  const silkRed = M(0x8a1c2b, { roughness: .7 }), gold = E(0xd4af37, .45, { metalness: .6, roughness: .35 }), dark = M(0x1b1418, { roughness: .8 });
  const inkCols = [0xff2d95, 0x2dff95, 0x7a2dff, 0xffd400, 0x00c8ff].map(c => E(c, .45)), concrete = M(0x4a4a66);
  const brawlM = [M(0xc27a2c), M(0x8a5a22)], beamM = M(0x9fd0ff, { transparent: true, opacity: .22, emissive: 0x9fd0ff, emissiveIntensity: 1, depthWrite: false }), starM = E(0xfff04a, 1.2), plat = M(0x4a4a68, { metalness: .4, roughness: .5 });
  const obsid = [0x1d1311, 0x2a1a16].map(c => M(c, { roughness: .35, metalness: .3 })), magma = E(0xff5a00, 1.4);
  const candy = [0xff4fa0, 0x4fd0ff, 0xffe14f, 0x9f6bff, 0x6bff9f, 0xff8a3d].map(c => M(c, { roughness: .35 })), white = M(0xffffff, { roughness: .4 }), brown = M(0x8a5a2b);

  const pineTree = (mats, snowy) => () => { const h = R(9, 17), mat = pick(mats); const parts = [part('cyl', trunkM, .6, h * .35, .6, h * .17)]; for (let t = 0; t < 4; t++) { const r = (1 - t * .2) * R(3.3, 4.2), y = h * (.28 + t * .19); parts.push(part('cone', t === 3 && snowy ? snowPine : mat, r, h * .38, r, y + h * .1, 0, 0, true)); if (snowy) parts.push(part('cone', snowPine, r * .8, h * .12, r * .8, y + h * .22)); } return grp(parts); };
  const oakTree = () => { const h = R(5, 8), mat = pick(leaves), parts = [part('cyl', trunkM, .7, h, .7, h / 2)]; for (let i = 0; i < 4; i++) { const r = R(2.6, 3.6); parts.push(part(geo.blob, mat, r, r * .85, r, h + R(-.3, 1.8), R(-2, 2), R(-2, 2))); } return grp(parts); };
  const bushy = () => grp(part(geo.blob, pick(leaves), R(1.4, 2.2), R(1, 1.5), R(1.4, 2.2), .8), part(geo.blob, pick(leaves), R(1, 1.6), R(.8, 1.2), R(1, 1.6), .7, R(1, 2), R(-1, 1)));
  const rocks = (mats, k = 1) => () => grp(Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => { const s = R(1.2, 3.4) * k; return part(geo.rock, pick(mats), s, s * R(.55, .9), s, s * .35, R(-2, 2), R(-2, 2)); }));
  const flowers = () => grp(Array.from({ length: 6 }, () => { const x = R(-1.4, 1.4), z = R(-1.4, 1.4), m = pick(flowerM); return [part('cyl', leaves[2], .05, .8, .05, .4, x, z, false), part('sph', m, .2, .2, .2, .85, x, z, false)]; }));
  const tower = (h, mats) => { const w = R(2.6, 4.6), m = pick(mats); const parts = [part('box', m, w, h, w, h / 2)]; for (let r = 0; r < Math.floor(h / 3.2); r++) for (const sx of [-1, 1]) { const gm = pick(glowC); parts.push(part('box', gm, w * .22, .9, .1, 2.4 + r * 3.2, sx * w * .24, w / 2 + .05, false)); parts.push(part('box', gm, .1, .9, w * .22, 2.4 + r * 3.2, w / 2 + .05, sx * w * .24, false)); } parts.push(part('box', pick(glowC), w + .3, .35, w + .3, h)); return grp(parts); };

  const T = {
    meadow: { name: 'Sunny Meadow', sky: 0x87ceeb, ground: 0x4a9a42, road: 0x34353b, edge: 0xffffff, line: '#ffffff', kerb: ['#e53935', '#ffffff'], accent: '#5fd35f', fog: [140, 560], hemi: .95, sun: 1.3, clouds: 1, mount: 0x5b8f6a, mountTop: 0xb8c8d8, music: 'meadow', hill: 1,
      decor: [pineTree(pines), oakTree, oakTree, bushy, bushy, flowers, flowers, rocks(rockM)] },
    dunes: { name: 'Sun-baked Dunes', sky: 0xf2b266, ground: 0xd9b56c, road: 0x4a3f36, edge: 0xffe0a0, line: '#ffe0a0', kerb: ['#e8742a', '#fff1cf'], accent: '#ffb347', fog: [130, 500], hemi: .85, sun: 1.1, clouds: .35, mount: 0xb98a4e, mountTop: 0xe0b878, hill: 1.3,
      decor: [() => { const h = R(5, 10); return grp(part('cyl', cac, .8, h, .8, h / 2), part('sph', cac, .8, .8, .8, h), part('cyl', cac, .45, h * .35, .45, h * .5, 1.4), part('cyl', cac, .45, 1.4, .45, h * .5 + 1.5, 1.4), part('sph', cac, .45, .45, .45, h * .5 + 2.2, 1.4)); },
        rocks(sandstone, 1.6), () => grp(part(geo.blob, pick(sand), R(4, 8), R(1.2, 2.5), R(4, 8), .3)), () => grp(part('cyl', M(0x6a5a40), .25, 4, .25, 2), part('cyl', M(0x6a5a40), .15, 2, .15, 4.3, .6, 0, true, 0, -.8))] },
    frost: { name: 'Frost Fields', sky: 0xbcd8e8, ground: 0xdbe7ee, road: 0x5d6b78, roadStyle: 'ice', edge: 0x8fd4ff, line: '#8fd4ff', kerb: ['#3a9ad8', '#ffffff'], accent: '#9fe0ff', fog: [110, 450], hemi: .85, sun: .8, clouds: .6, mount: 0x8fa5b5, mountTop: 0xffffff, hill: 1.2,
      decor: [pineTree([M(0x2a5a4a), M(0x336a55)], true), pineTree([M(0x2a5a4a)], true), () => grp(Array.from({ length: 4 }, () => { const h = R(5, 14); return part('cone', icec, R(.8, 1.8), h, R(.8, 1.8), h / 2, R(-2, 2), R(-2, 2), true, R(-.2, .2), R(-.2, .2)); })), () => grp(part(geo.blob, snow, R(2.5, 4), R(1.4, 2.2), R(2.5, 4), .8)), rocks([M(0x6d7a86)])] },
    neon: { name: 'Neon Night', sky: 0x0a0a22, ground: 0x10122a, road: 0x1b1b2e, roadStyle: 'neon', edge: 0x00ffe1, line: '#00ffe1', line2: '#ff2bd6', kerb: ['#00ffe1', '#ff2bd6'], kerbGlow: true, accent: '#ff2bd6', fog: [70, 330], hemi: .5, sun: .45, stars: 1, mount: 0x1a1040, mountTop: 0x3a1a6a, lamp: 0x00e5ff, hill: .6,
      decor: [() => tower(R(14, 34), neonBase), () => tower(R(8, 22), neonBase), () => grp(part('box', pick(glowC), 7, 3.5, .3, 9, 0, 0, false), part('cyl', M(0x222233), .2, 9, .2, 4.5)), () => grp(part('cyl', concrete, .5, 6, .5, 3), part('sph', pick(glowC), .9, .9, .9, 6.4, 0, 0, false))] },
    hollow: { name: 'Hollow Depths', sky: 0x0a1020, ground: 0x151a28, road: 0x2b3347, roadStyle: 'stone', edge: 0x7fe8ff, line: '#7fe8ff', kerb: ['#2a3350', '#7fe8ff'], kerbGlow: true, accent: '#7fe8ff', fog: [30, 200], hemi: .5, sun: .2, stars: .25, lamp: 0x7fe8ff, hill: .5,
      decor: [() => { const h = R(8, 22), s = R(1.5, 4); return grp(part('cone', pick(cave), s, h, s, h / 2)); },
        () => { const h = R(40, 70), s = R(2, 5); return grp(part('cone', pick(cave), s, h, s, 90 - h / 2, 0, 0, false, Math.PI)); },
        () => grp(part('cyl', shroomStem, .3, 1.8, .3, .9), part(geo.blob, pick(shroomCap), 1.3, .7, 1.3, 2)),
        () => grp(Array.from({ length: 4 }, () => { const h = R(1.4, 3.2); return part('cone', pick(crystalM), R(.3, .6), h, R(.3, .6), h / 2, R(-1, 1), R(-1, 1), false, R(-.3, .3), R(-.3, .3)); })),
        () => grp(part('sph', crystalM[0], .6, .6, .6, R(3, 10), 0, 0, false))] },
    silk: { name: 'Thread Citadel', sky: 0x3a0f1c, ground: 0x2a1218, road: 0x4a2a2a, roadStyle: 'tiles', edge: 0xd4af37, line: '#d4af37', kerb: ['#d4af37', '#1b1418'], accent: '#d4af37', fog: [50, 280], hemi: .6, sun: .5, stars: .35, mount: 0x2a0f18, mountTop: 0x5a2030, lamp: 0xffc94a, hill: .8,
      decor: [() => { const h = R(12, 24), w = R(2, 3.4); return grp(part('box', silkRed, w, h, w, h / 2), part('box', gold, w + .5, .5, w + .5, h * .55), part('box', gold, w + .5, .5, w + .5, .3), part('cone', dark, w * 1.4, h * .35, w * 1.4, h + h * .17), part('sph', gold, .35, .35, .35, h + h * .36)); },
        () => grp(part('cyl', dark, .12, 6, .12, 3), part('sph', E(0xffc94a, 1.3), .7, .9, .7, 6.4, 0, 0, false)),
        () => { const h = R(10, 18); return grp(part('box', M(0x9a1a2a, { side: THREE.DoubleSide }), .15, h, 2.4, h / 2 + 3), part('cyl', gold, .12, 3, .12, h + 3.5, 0, 0, true, 0, 1.57)); },
        rocks([M(0x3a2028)], 1.4)] },
    ink: { name: 'Ink District', sky: 0x5a3be0, ground: 0x2a2a52, road: 0x33334f, roadStyle: 'ink', edge: 0xffd400, line: '#ffd400', line2: '#ffffff', kerb: ['#ffd400', '#222'], accent: '#ff2d95', fog: [120, 480], hemi: .9, sun: .95, clouds: .45, mount: 0x4a2fb0, mountTop: 0xff7ad0, hill: .9,
      flat: { colors: [0xff2d95, 0x2dff95, 0x7a2dff, 0xffd400, 0x00c8ff], onRoad: true, count: 90 },
      decor: [() => { const h = R(10, 24), w = R(3, 5), c = pick(inkCols), c2 = pick(inkCols); return grp(part('box', concrete, w, h, w, h / 2), part('box', c, w + .2, 2.2, w + .2, h * .35), part('box', c2, w + .2, 1.4, w + .2, h * .7)); },
        () => { const r = R(1.2, 2.2); return grp(part('cyl', pick(inkCols), r, 4.5, r, 2.25), part('cyl', white, r * .95, .6, r * .95, 4.8), part('cyl', M(0x333344), r * .6, .5, r * .6, 5.2)); },
        () => grp(part('sph', pick(inkCols), 1.6, 1.6, 1.6, 2.2), part('cone', pick(inkCols), 1.15, 2.4, 1.15, 4.1)),
        bushy] },
    backrooms: { name: 'The Yellow Halls', sky: 0x9a8a30, ground: 0xb9a64a, road: 0x8c7b34, roadStyle: 'carpet', edge: 0x6b5d24, accent: '#e8d44a', fog: [10, 105], hemi: 1.1, sun: .12, walls: true, wallColor: 0xc9b458, hill: 0, decor: [], noKerb: true },
    brawl: { name: 'Final Arena', sky: 0x2b1b5e, ground: 0x1b1f3a, road: 0x4a4a68, roadStyle: 'metal', edge: 0xffd400, line: '#ffd400', kerb: ['#ffd400', '#222'], accent: '#ffd400', fog: [120, 520], hemi: .8, sun: .95, stars: .8, clouds: 0, mount: 0x3a2a7a, mountTop: 0x9a7aff, hill: .6,
      decor: [() => grp(part('cyl', beamM, 1.4, 90, 1.4, 45, 0, 0, false)), () => grp(part('box', pick(brawlM), 3, 3, 3, 1.5), part('box', E(0xffd400, .4), 3.2, .4, 3.2, 3)),
        () => grp(part('oct', starM, 1.4, 2, 1.4, R(6, 16), 0, 0, false)), () => { const r = R(5, 9); return grp(part('cyl', plat, r, 1.2, r, R(8, 20)), part('cyl', E(0x6ad0ff, 1), r + .15, .25, r + .15, R(8, 20) - .5, 0, 0, false)); }] },
    lava: { name: 'Magma Run', sky: 0x4a1a0a, ground: 0x241010, road: 0x2b2b2b, roadStyle: 'lava', edge: 0xff6a00, line: '#ff7a1a', kerb: ['#ff6a00', '#1d1311'], kerbGlow: true, accent: '#ff6a00', fog: [70, 360], hemi: .6, sun: .6, stars: .2, mount: 0x1c0a08, mountTop: 0xff5a00, lamp: 0xff7a1a, hill: 1.2,
      flat: { colors: [0xff5a00, 0xff8a00], onRoad: false, emissive: true, count: 60 },
      decor: [() => { const w = R(5, 9), h = R(10, 26); return grp(part('cone', pick(obsid), w, h, w, h / 2), part('cone', magma, w * .3, h * .3, w * .3, h * .85)); }, rocks(obsid, 1.6),
        () => grp(part('cyl', dark, .5, 3, .5, 1.5), part('cyl', M(0x333333), 1.2, .8, 1.2, 3.2), part('cone', magma, .8, 2, .8, 4.3, 0, 0, false))] },
    candy: { name: 'Candy Cliffs', sky: 0xffd6f0, ground: 0xff9fd1, road: 0x7a4a8a, roadStyle: 'candy', edge: 0xffffff, line: '#ffffff', line2: '#ffffff', kerb: ['#ff4fa0', '#ffffff'], accent: '#ff7ac8', fog: [140, 560], hemi: 1, sun: 1.05, clouds: .9, mount: 0xffa0d8, mountTop: 0xfff0fa, hill: 1.3,
      decor: [() => grp(part('cyl', white, .3, 6.5, .3, 3.25), part('cyl', pick(candy), 2.2, .5, 2.2, 7), part('cyl', pick(candy), 1.5, .55, 1.5, 7), part('cyl', pick(candy), .8, .6, .8, 7)),
        () => grp(part('sph', pick(candy), 2, 2.4, 2, 1.4), part('sph', white, .5, .5, .5, 3.6)), () => grp(part('cyl', brown, 1.5, 2, 1.5, 1), part(geo.blob, pick(candy), 2.1, 1.5, 2.1, 3), part('sph', M(0xe53935), .35, .35, .35, 4.6)),
        () => grp(part('cyl', white, .35, 7, .35, 3.5), part('cyl', M(0xe53935), .37, 1.2, .37, 1.5), part('cyl', M(0xe53935), .37, 1.2, .37, 4.2), part('cyl', white, .4, 1, .4, 6.5, 0, 0, true, 0, 0))] },
  };
  T.flatMat = c => E(c, 0.2);
  return T;
}
