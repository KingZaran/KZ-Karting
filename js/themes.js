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

  // ===== game-accurate props & new game zones =====
  // pb: a part with an exact position/rotation (no random spin) so multi-part props keep their shape
  const pb = (g, m, sx, sy, sz, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(Array.isArray(g) ? pick(g) : geo[g] || g, m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; return o; };
  const bk = (m, w, h, d, x, y, z) => pb('box', m, w, h, d, x, y, z);

  // --- Hollow Knight: benches, lumafly lanterns, soul totems, geo, vengefly-white masks on pedestals, thorns
  const bone = M(0xe8ecf4, { roughness: .6 }), iron = M(0x20242e, { roughness: .5, metalness: .4 }), soul = E(0xdff6ff, 1.4), geoM = E(0xe8e0c0, .5), thorn = M(0x16241c);
  const hkBench = () => grp(bk(iron, 3.2, .3, 1.2, 0, .9, 0), bk(iron, 3.2, 1.3, .2, 0, 1.6, -.5), bk(iron, .25, 1, .25, -1.3, .45, 0), bk(iron, .25, 1, .25, 1.3, .45, 0), pb('cyl', iron, .1, 4.4, .1, 1.9, 2.2, -.7), pb('sph', E(0xbff3ff, 1.6), .5, .6, .5, 1.9, 4.6, -.7));
  const hkTotem = () => grp(pb('cyl', cave[0], 1.1, 2.4, 1.1, 0, 1.2, 0), pb('cyl', bone, .8, 1.1, .8, 0, 3, 0), pb('sph', soul, .55, .35, .55, 0, 3.8, 0));
  const hkLantern = () => grp(pb('cyl', iron, .08, 7, .08, 0, 3.5, 0), pb('cyl', iron, .45, .1, .45, 0, 6.9, 0), pb('sph', E(0xffe27a, 1.8), .38, .45, .38, 0, 6.5, 0), pb('cyl', iron, .45, .1, .45, 0, 6.1, 0));
  const hkMask = () => { const m = grp(pb('cyl', cave[1], 1.4, 2.4, 1.4, 0, 1.2, 0), pb('sph', bone, 1.3, 1.5, .8, 0, 3.6, 0), pb('sph', M(0x000000), .38, .55, .2, -.45, 3.7, .65), pb('sph', M(0x000000), .38, .55, .2, .45, 3.7, .65)); for (const sx of [-1, 1]) m.add(pb('cone', bone, .28, 1.5, .28, sx * .75, 4.9, 0, 0, 0, -sx * .4)); return m; };
  const hkThorns = () => grp(Array.from({ length: 7 }, () => { const h = R(1.2, 3); return pb('cone', thorn, .22, h, .22, R(-1.4, 1.4), h / 2, R(-1.4, 1.4), R(-.5, .5), 0, R(-.5, .5)); }));
  const hkGeo = () => grp(Array.from({ length: 5 }, () => pb('sph', geoM, .32, .32, .32, R(-.9, .9), .3, R(-.9, .9))));
  T.hollow.decor.push(hkBench, hkTotem, hkLantern, hkMask, hkThorns, hkGeo, hkLantern);

  // --- Silksong: bells, thread spools, Hornet's needle, cogs
  const thread = M(0xd02a3a, { roughness: .5 }), brassM = E(0xc79a3a, .35, { metalness: .6, roughness: .35 });
  const ssBell = () => grp(pb('cyl', dark, .12, 5, .12, 0, 7.5, 0), pb(new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI * .62), brassM, 1.8, 2, 1.8, 0, 3.8, 0, Math.PI), pb('sph', brassM, .3, .3, .3, 0, 2.6, 0), pb('torus', brassM, .5, .5, .5, 0, 4.8, 0));
  const ssSpool = () => grp(pb('cyl', M(0x6b4a2b), 1.6, .3, 1.6, 0, .15, 0), pb('cyl', thread, 1.1, 2.2, 1.1, 0, 1.3, 0), pb('cyl', M(0x6b4a2b), 1.6, .3, 1.6, 0, 2.55, 0));
  const ssNeedle = () => grp(pb('cyl', M(0xe8e2d0, { metalness: .5 }), .12, 9, .12, 0, 4.5, 0), pb('cone', M(0xe8e2d0, { metalness: .5 }), .12, 1.2, .12, 0, 9.6, 0), pb('cyl', thread, .2, 2.2, .2, 0, 1.4, 0), pb('torus', brassM, .5, .5, .5, 0, 2.6, 0, Math.PI / 2));
  const ssCog = () => { const g = grp(pb('cyl', brassM, 2.2, .5, 2.2, 0, 4, 0, Math.PI / 2)); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; g.add(pb('box', brassM, .6, .5, .7, Math.cos(a) * 2.35, 4 + Math.sin(a) * 2.35, 0, 0, 0, a)); } g.add(pb('cyl', dark, .15, 4, .15, 0, 2, 0)); return g; };
  geo.torus = new THREE.TorusGeometry(1, .22, 8, 18); geo.sqpyr = new THREE.ConeGeometry(1, 1, 4);
  T.silk.decor.push(ssBell, ssSpool, ssNeedle, ssCog, ssBell);

  // --- Smash: Smash Ball, Poké Ball, trophy podium, Final Destination style hover platforms
  const smashBall = () => { const g = grp(pb('sph', E(0x7ad0ff, 1.1), 1.7, 1.7, 1.7, 0, 9, 0), pb('torus', E(0xffd400, 1.3), 2.2, 2.2, 2.2, 0, 9, 0, Math.PI / 2), pb('torus', E(0xff3b6b, 1.3), 2.2, 2.2, 2.2, 0, 9, 0, 0, 0, Math.PI / 2.4)); g.userData.float = 1; return g; };
  const pokeball = () => grp(pb('sph', M(0xe53935, { roughness: .3 }), 1.5, 1.5, 1.5, 0, 1.5, 0), pb(new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M(0xffffff, { roughness: .3 }), 1.5, 1.5, 1.5, 0, 1.5, 0), pb('cyl', M(0x111111), 1.52, .14, 1.52, 0, 1.5, 0), pb('cyl', white, .35, .2, .35, 0, 1.5, 1.45, Math.PI / 2));
  const podium = () => grp(bk(plat, 4, 1, 4, 0, .5, 0), bk(E(0xffd400, .5), 3.4, .4, 3.4, 0, 1.2, 0), pb('cyl', E(0xffd400, .9), .5, 2.4, .5, 0, 2.7, 0), pb('sph', E(0xffd400, .9), .8, .8, .8, 0, 4.2, 0));
  const hoverPlat = () => grp(bk(plat, 9, .9, 6, 0, R(10, 16), 0), bk(E(0x6ad0ff, 1), 9.2, .2, 6.2, 0, R(10, 16) - .5, 0));
  T.brawl.decor.push(smashBall, pokeball, podium, hoverPlat);

  // --- Splatoon: paint cans, squid sculptures, ink drips, crate stacks
  const spCan = () => { const c = pick(inkCols); return grp(pb('cyl', M(0xdfe3ea, { metalness: .5, roughness: .35 }), .9, 1.4, .9, 0, .7, 0), pb('cyl', E(c, .8), .95, .12, .95, 0, 1.42, 0), pb('sph', E(c, .7), .6, .22, .6, 0, 1.55, 0)); };
  const spSquid = () => { const c = pick(inkCols), g = grp(pb('sph', E(c, .55), 1.6, 2.2, 1.6, 0, 4.2, 0), pb('sph', white, .5, .65, .1, -.55, 4.6, 1.3), pb('sph', white, .5, .65, .1, .55, 4.6, 1.3), pb('sph', M(0x111111), .2, .3, .1, -.55, 4.6, 1.38), pb('sph', M(0x111111), .2, .3, .1, .55, 4.6, 1.38)); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; g.add(pb('cone', E(c, .55), .35, 2.4, .35, Math.cos(a) * .9, 1.2, Math.sin(a) * .9, Math.sin(a) * .35, 0, -Math.cos(a) * .35)); } return g; };
  const spCrates = () => { const c = pick(inkCols); return grp(bk(M(0x6b5a46), 2.2, 2.2, 2.2, 0, 1.1, 0), bk(M(0x6b5a46), 2, 2, 2, 2.4, 1, .3), bk(M(0x6b5a46), 1.8, 1.8, 1.8, .6, 3.1, 0), pb('sph', E(c, .5), 1.7, .15, 1.7, 0, 2.25, 0)); };
  const spDrip = () => { const c = pick(inkCols); return grp(bk(concrete, 6, 9, 3, 0, 4.5, 0), pb('sph', E(c, .55), 2.4, 1.1, 1.5, 0, 8.6, 1.3), pb('cyl', E(c, .55), .35, 4, .2, -.9, 6.4, 1.5), pb('cyl', E(c, .55), .3, 2.6, .2, 1.1, 7.2, 1.5), pb('sph', E(c, .55), .4, .55, .2, -.9, 4.2, 1.5)); };
  T.ink.decor.push(spCan, spSquid, spCrates, spDrip, spCan);

  // --- Minecraft: Overworld
  const mc = { grass: M(0x5d9c3a, { roughness: 1 }), dirt: M(0x7a5232, { roughness: 1 }), log: M(0x6b4a2b, { roughness: 1 }), birchLog: M(0xdcd8c8, { roughness: 1 }), leaf: M(0x3f8a2c, { roughness: 1 }), stone: M(0x8a8a8a, { roughness: 1 }), cobble: M(0x777777, { roughness: 1 }), plank: M(0xb08a4f, { roughness: 1 }), tnt: M(0xd32f2f, { roughness: 1 }), diam: E(0x4fe6ee, .8), coal: M(0x222222), gold: E(0xffd23f, .5), obs: M(0x1a0f26, { roughness: .3 }), portal: E(0x8a2be2, 1.5, { transparent: true, opacity: .75 }), pig: M(0xf2a0a8, { roughness: 1 }), green: M(0x4caf50, { roughness: 1 }), cream: M(0xf2e9c9), melon: M(0x6aa832), pump: M(0xe48a1b), glow: E(0xffd27a, 1.3), torchW: M(0x8a6a3a), black: M(0x050505) };
  const mcTree = (log, leaf) => () => { const h = Math.round(R(4, 6)), u = 1.4, H = h * u, g = grp(bk(log, u, H, u, 0, H / 2, 0), bk(leaf, 5 * u, 2 * u, 5 * u, 0, H + 0, 0), bk(leaf, 3 * u, 2 * u, 3 * u, 0, H + 2 * u, 0), bk(leaf, 3 * u, u, 3 * u, 0, H + 3.4 * u, 0)); return g; };
  const creeper = () => { const u = .75; return grp(...[[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]].map(([x, z]) => bk(mc.green, u, 1.5, u, x * 1.1, .75, z * 1.1)), bk(mc.green, 1.7, 3, 1.1, 0, 3, 0), bk(mc.green, 2.2, 2.2, 2.2, 0, 5.6, 0), bk(mc.black, .5, .55, .1, -.55, 5.9, 1.12), bk(mc.black, .5, .55, .1, .55, 5.9, 1.12), bk(mc.black, .5, .9, .1, 0, 5.1, 1.12), bk(mc.black, 1.2, .45, .1, 0, 5.3, 1.12)); };
  const tntBlock = () => grp(bk(mc.tnt, 2.4, 2.4, 2.4, 0, 1.2, 0), bk(mc.cream, 2.46, .8, 2.46, 0, 1.2, 0), bk(mc.black, 1.4, .3, .1, 0, 1.2, 1.25), bk(mc.black, .1, .3, 1.4, 1.25, 1.2, 0));
  const oreBlock = (ore) => () => { const g = grp(bk(mc.stone, 2.2, 2.2, 2.2, 0, 1.1, 0)); for (let i = 0; i < 6; i++) g.add(bk(ore, .55, .55, .3, R(-.8, .8), R(.5, 1.7), 1.12)); return g; };
  const grassCube = () => grp(bk(mc.dirt, 2.2, 2.2, 2.2, 0, 1.1, 0), bk(mc.grass, 2.24, .45, 2.24, 0, 2.1, 0), bk(mc.dirt, 2.2, 2.2, 2.2, 2.2, 1.1, 0), bk(mc.grass, 2.24, .45, 2.24, 2.2, 2.1, 0));
  const mcPig = () => grp(bk(mc.pig, 1.6, 1.3, 2.5, 0, 1.4, 0), bk(mc.pig, 1.4, 1.3, 1.3, 0, 1.7, 1.7), bk(M(0xd87d86), .7, .5, .3, 0, 1.5, 2.4), ...[[-.5, -.8], [.5, -.8], [-.5, .8], [.5, .8]].map(([x, z]) => bk(mc.pig, .5, .8, .5, x, .4, z)));
  const mcTorch = () => grp(bk(mc.torchW, .3, 2.2, .3, 0, 1.1, 0), bk(mc.glow, .4, .5, .4, 0, 2.3, 0));
  const mcPortal = () => grp(bk(mc.obs, 1.2, 8, 1.2, -2.2, 4, 0), bk(mc.obs, 1.2, 8, 1.2, 2.2, 4, 0), bk(mc.obs, 5.6, 1.2, 1.2, 0, .6, 0), bk(mc.obs, 5.6, 1.2, 1.2, 0, 7.4, 0), bk(mc.portal, 3.2, 6, .3, 0, 4, 0));
  const mcHouse = () => grp(bk(mc.plank, 8, 4.2, 7, 0, 2.1, 0), bk(mc.cobble, 8.4, .6, 7.4, 0, .3, 0), bk(mc.log, 8.4, 5, .8, 0, 2.5, 3.6), bk(mc.log, 8.4, 5, .8, 0, 2.5, -3.6), ...[0, 1, 2].map(i => bk(mc.cobble, 9 - i * 2.4, .8, 8 - i * .2, 0, 4.6 + i * .8, 0)), bk(M(0x3a2a1a), 1.4, 2.6, .2, 0, 1.4, 3.55), bk(E(0xbfe8ff, .5), 1.6, 1.4, .15, 2.4, 2.6, 3.55));
  const mcMelon = () => grp(bk(mc.melon, 2, 2, 2, 0, 1, 0), bk(mc.pump, 2, 2, 2, 2.3, 1, .6), bk(mc.black, .5, .5, .1, 2.0, 1.4, 1.65), bk(mc.black, .5, .5, .1, 2.8, 1.4, 1.65));
  T.blocky = { name: 'Blocky Overworld', sky: 0x78a7ff, ground: 0x5d9c3a, road: 0x7d7d7d, roadStyle: 'blocks', edge: 0x4a4a4a, line: '#d9d9d9', kerb: ['#6b6b6b', '#9a9a9a'], accent: '#6cc24a', fog: [150, 600], hemi: 1, sun: 1.25, clouds: 1, mount: 0x6a9a4a, mountTop: 0xb8c8d8, hill: 1,
    decor: [mcTree(mc.log, mc.leaf), mcTree(mc.log, mc.leaf), mcTree(mc.birchLog, M(0x5aa83a, { roughness: 1 })), creeper, tntBlock, oreBlock(mc.diam), oreBlock(mc.coal), grassCube, mcPig, mcTorch, mcHouse, mcMelon, mcPortal] };
  // --- Minecraft: the Nether
  const nr = [0x8a2f2f, 0x732626].map(c => M(c, { roughness: 1 })), nbrick = M(0x3a1418, { roughness: .9 }), lavaM = E(0xff6a00, 1.4, { transparent: true, opacity: .9 }), glowst = E(0xffd27a, 1.5);
  const nPillar = () => { const h = Math.round(R(3, 8)); return grp(...Array.from({ length: h }, (_, i) => bk(pick(nr), 2.4, 2.4, 2.4, R(-.15, .15), i * 2.4 + 1.2, R(-.15, .15)))); };
  const nLavafall = () => grp(bk(nr[0], 5, 2, 3, 0, 14, 0), bk(lavaM, 2, 14, .6, 0, 7, 1.4), bk(lavaM, 4, .5, 4, 0, .3, 2));
  const nGlow = () => grp(...Array.from({ length: 6 }, () => bk(glowst, R(.8, 1.6), R(.8, 1.6), R(.8, 1.6), R(-1.5, 1.5), R(8, 12) + R(-1, 1), R(-1.5, 1.5))), bk(nr[1], 3, 2, 3, 0, 13.5, 0));
  const ghast = () => { const g = grp(bk(M(0xf4f4f4, { roughness: 1 }), 6, 6, 6, 0, 22, 0), bk(M(0x2a2a2a), 1.2, 1.2, .1, -1.4, 22.3, 3.05), bk(M(0x2a2a2a), 1.2, 1.2, .1, 1.4, 22.3, 3.05), bk(M(0x2a2a2a), 1.4, .8, .1, 0, 20.4, 3.05)); for (let i = 0; i < 9; i++) g.add(bk(M(0xf4f4f4, { roughness: 1 }), .7, R(3, 6), .7, ((i % 3) - 1) * 1.8, 16.5, (Math.floor(i / 3) - 1) * 1.8)); return g; };
  const fortress = () => grp(bk(nbrick, 3, 10, 3, -4, 5, 0), bk(nbrick, 3, 10, 3, 4, 5, 0), bk(nbrick, 11, 2.4, 3, 0, 9.5, 0), bk(nbrick, 11, 1.2, 3.4, 0, 11, 0), bk(M(0x240a0e), 5, 7, 2, 0, 3.5, 0));
  T.nether = { name: 'The Nether', sky: 0x3a0c0c, ground: 0x6a2020, road: 0x2e1a1a, roadStyle: 'blocks', edge: 0xff6a00, line: '#ff7a1a', kerb: ['#ff6a00', '#3a1418'], kerbGlow: true, accent: '#ff6a00', fog: [30, 260], hemi: .55, sun: .5, stars: .1, mount: 0x3a1010, mountTop: 0xff5a00, lamp: 0xff9a3a, hill: 1.1,
    flat: { colors: [0xff5a00, 0xff8a00], onRoad: false, emissive: true, count: 50 }, decor: [nPillar, nPillar, nLavafall, nGlow, ghast, fortress, nPillar] };

  // --- Roblox: baseplate, studded bricks, noobs, spawn pads, trusses
  const rb = { red: 0xc4281c, blue: 0x0d69ac, yellow: 0xf5cd30, green: 0x4b974b, orange: 0xda8541, white: 0xf2f3f3 }, rbM = Object.fromEntries(Object.entries(rb).map(([k, c]) => [k, M(c, { roughness: .5 })])), rbList = Object.values(rbM), skin = M(0xf5cd30, { roughness: .5 }), truss = M(0x8a8a8a, { metalness: .4, roughness: .5 });
  const studs = (m, w, d, y, cols = Math.max(1, Math.round(w / 1.4)), rows = Math.max(1, Math.round(d / 1.4))) => { const a = []; for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) a.push(pb('cyl', m, .42, .26, .42, (i - (cols - 1) / 2) * 1.4, y + .13, (j - (rows - 1) / 2) * 1.4)); return a; };
  const rbBrick = () => { const m = pick(rbList), w = R(2.8, 7), d = R(2.8, 5.6), h = R(1.4, 3); return grp(bk(m, w, h, d, 0, h / 2, 0), studs(m, w, d, h)); };
  const rbTower = () => { const g = grp(); let y = 0; for (let i = 0; i < Math.round(R(3, 7)); i++) { const m = pick(rbList); g.add(bk(m, 4.2, 2, 4.2, 0, y + 1, 0), ...studs(m, 4.2, 4.2, y + 2)); y += 2.1; } return g; };
  const noob = () => grp(pb('cyl', skin, .9, 1.1, .9, 0, 5.2, 0), bk(M(0x000000), .15, .3, .1, -.3, 5.3, .9), bk(M(0x000000), .15, .3, .1, .3, 5.3, .9), bk(M(0x000000), .6, .1, .1, 0, 4.85, .9), bk(rbM.blue, 2.2, 2.2, 1.1, 0, 3.3, 0), bk(skin, .9, 2.2, .9, -1.6, 3.3, 0), bk(skin, .9, 2.2, .9, 1.6, 3.3, 0), bk(rbM.green, 1, 2.2, 1, -.6, 1.1, 0), bk(rbM.green, 1, 2.2, 1, .6, 1.1, 0));
  const spawnPad = () => grp(bk(M(0xc8c8c8, { metalness: .3 }), 5, .5, 5, 0, .25, 0), bk(rbM.white, 4.4, .1, 4.4, 0, .55, 0), bk(E(0x00b2ff, 1.2), 4.6, .12, .4, 0, .6, 0), bk(E(0x00b2ff, 1.2), .4, .12, 4.6, 0, .6, 0));
  const rbTruss = () => { const h = R(8, 16), g = grp(...[[-.8, -.8], [.8, -.8], [-.8, .8], [.8, .8]].map(([x, z]) => bk(truss, .18, h, .18, x, h / 2, z))); for (let y = 1; y < h; y += 1.6) g.add(bk(truss, 1.7, .14, .14, 0, y, .8), bk(truss, 1.7, .14, .14, 0, y, -.8)); return g; };
  const rbCone = () => grp(bk(rbM.orange, 1.6, .2, 1.6, 0, .1, 0), pb('cone', rbM.orange, .7, 2, .7, 0, 1.2, 0), pb('cyl', rbM.white, .5, .3, .5, 0, 1.4, 0));
  T.brick = { name: 'Baseplate', sky: 0x6fb4ff, ground: 0x4a8a3a, road: 0xa3a2a5, roadStyle: 'studs', edge: 0xf5cd30, line: '#f5cd30', kerb: ['#c4281c', '#f2f3f3'], accent: '#00b2ff', fog: [160, 620], hemi: 1.05, sun: 1.2, clouds: .7, mount: 0x4a8a6a, mountTop: 0xcfe6ff, hill: .7,
    decor: [rbBrick, rbBrick, rbTower, noob, spawnPad, rbTruss, rbCone, rbBrick] };

  // --- Fortnite: builds, supply drops, loot llamas, chests, storm-wall, battle bus
  const fn = { wood: M(0xb5834a, { roughness: .9 }), wood2: M(0x96693a, { roughness: .9 }), brickM: M(0xb04a3a, { roughness: .9 }), metalM: M(0x7d8896, { metalness: .5, roughness: .5 }), stoneM: M(0x9a9a98, { roughness: 1 }), beige: M(0xe3d3b0), roof: M(0x7a3a2a), storm: E(0x9a3bff, .8, { transparent: true, opacity: .25, depthWrite: false }) };
  const fnBuild = (m) => () => { const g = grp(bk(m, 6, 6, .6, 0, 3, -3), bk(m, 6, 6, .6, -3, 3, 0, 0), bk(m, .6, 6, 6, 3, 3, 0), bk(m, 6, .5, 6, 0, 6, 0)); const r = bk(m, 6.4, .5, 7.6, 0, 7.4, 3.8); r.rotation.x = -.55; g.add(r); return g; };
  const fnRamp = (m) => () => { const r = bk(m, 6, .6, 8.5, 0, 3.4, 0); r.rotation.x = .78; return grp(r, bk(m, .5, 6, .5, -2.8, 3, -3), bk(m, .5, 6, .5, 2.8, 3, -3)); };
  const fnDrop = () => grp(bk(M(0x1aa6c8, { roughness: .6 }), 2.4, 2.2, 2.4, 0, 1.1, 0), bk(white, 2.5, .35, 2.5, 0, 1.1, 0), pb('cyl', white, .03, 7, .03, -.9, 5.6, -.9), pb('cyl', white, .03, 7, .03, .9, 5.6, .9), pb('sph', E(0xff3b3b, .4), 1.8, 2.2, 1.8, -.9, 9.8, -.9), pb('sph', E(0xffffff, .4), 1.8, 2.2, 1.8, .9, 9.8, .9), pb('sph', E(0x3b6bff, .4), 1.8, 2.2, 1.8, 0, 10.8, 0));
  const fnLlama = () => { const c = [0xff5ab0, 0x5ad0ff, 0xffd23f, 0x9a5aff][Math.floor(Math.random() * 4)], lm = M(c, { roughness: .6 }); return grp(pb('sph', lm, 1.5, 1.4, 2.4, 0, 3, 0), bk(lm, .9, 2.6, .9, 0, 4.4, 1.9), bk(lm, 1.2, 1.2, 1.7, 0, 6, 2.2), bk(lm, .3, .9, .3, -.4, 6.9, 2), bk(lm, .3, .9, .3, .4, 6.9, 2), ...[[-.8, -1.2], [.8, -1.2], [-.8, 1.2], [.8, 1.2]].map(([x, z]) => bk(lm, .5, 2, .5, x, 1, z)), pb('oct', E(0xffe14a, .8), .7, .7, .3, 0, 3.4, -1.4)); };
  const fnChest = () => grp(bk(M(0x6a3a1a), 2.6, 1.4, 1.6, 0, .7, 0), bk(E(0xffc93f, .6), 2.7, .3, 1.7, 0, 1.4, 0), bk(E(0xffe27a, 1.6), .5, .5, .3, 0, 1, .85), pb('cyl', E(0xffd45a, 1.2, { transparent: true, opacity: .25, depthWrite: false }), .5, 30, .5, 0, 16, 0));
  const fnTower = () => { const w = R(6, 9), h = R(14, 26); return grp(bk(fn.beige, w, h, w, 0, h / 2, 0), bk(fn.roof, w + 1, 1, w + 1, 0, h + .5, 0), pb('cone', fn.roof, w * .8, 3.5, w * .8, 0, h + 2.7, 0, 0, Math.PI / 4), ...[0, 1, 2].map(i => bk(E(0xbfe8ff, .3), 1.3, 1.8, .15, (i - 1) * 2, h * .5, w / 2 + .05)), bk(M(0x333333), 1.6, 2.6, .15, 0, 1.3, w / 2 + .05)); };
  const fnBus = () => { if (Math.random() > .12) return grp(); const g = grp(bk(M(0x3b82d8, { roughness: .5 }), 14, 5, 5, 0, 52, 0), bk(white, 14.2, .5, 5.2, 0, 50.5, 0), ...[-4, -1.5, 1, 3.5].map(x => bk(E(0xbfe8ff, .4), 1.8, 1.6, 5.2, x, 53, 0)), ...[[-4, -2.6], [4, -2.6], [-4, 2.6], [4, 2.6]].map(([x, z]) => pb('cyl', iron, 1, .7, 1, x, 49.5, z, Math.PI / 2)), pb('sph', E(0xfff0a0, .6), 5.5, 6.5, 5.5, 0, 63, 0), pb('cyl', iron, .08, 8, .08, -3, 57, 0), pb('cyl', iron, .08, 8, .08, 3, 57, 0)); g.userData.sky = 1; return g; };
  T.storm = { name: 'Battle Island', sky: 0x8ec9ff, ground: 0x6fb04a, road: 0x6a6a70, roadStyle: 'planks', edge: 0xffffff, line: '#ffffff', kerb: ['#ffd23f', '#3b82d8'], accent: '#9a3bff', fog: [150, 600], hemi: 1, sun: 1.3, clouds: .9, mount: 0x5b8f6a, mountTop: 0xd8e4ff, hill: 1.1,
    decor: [pineTree(pines), pineTree(pines), fnBuild(fn.wood), fnBuild(fn.stoneM), fnBuild(fn.metalM), fnRamp(fn.wood), fnDrop, fnLlama, fnChest, fnTower, fnTower, bushy, fnBus] };


  // ===== batch 2: more game zones =====
  // --- Backrooms: Level 37 "The Poolrooms" - pale tiles, still water, white arches
  const tileW = M(0xeaf7f8, { roughness: .35 }), tileB = M(0x9fd6e4, { roughness: .3 }), chrome = M(0xdfe6ee, { metalness: .8, roughness: .2 }), poolWater = E(0x4fd0e8, .5, { transparent: true, opacity: .85, roughness: .1 });
  const plPillar = () => { const h = R(9, 12); return grp(bk(tileW, 3, h, 3, 0, h / 2, 0), bk(tileB, 3.1, 1.2, 3.1, 0, .6, 0), bk(tileB, 3.1, .5, 3.1, 0, h * .35, 0), bk(tileW, 3.8, .8, 3.8, 0, h, 0)); };
  const plArch = () => grp(bk(tileW, 2.2, 9, 2.2, -5, 4.5, 0), bk(tileW, 2.2, 9, 2.2, 5, 4.5, 0), pb(new THREE.TorusGeometry(5, 1.1, 6, 20, Math.PI), tileW, 1, 1, 1.9, 0, 9, 0));
  const plLadder = () => grp(...[-.6, .6].map(x => pb('cyl', chrome, .09, 4.2, .09, x, 2.1, 0)), ...[1, 2, 3].map(y => pb('cyl', chrome, .07, 1.3, .07, 0, y, 0, 0, 0, Math.PI / 2)), pb(new THREE.TorusGeometry(.8, .09, 6, 12, Math.PI), chrome, 1, 1, 1, 0, 4.2, 0));
  const plRing = () => { const c = pick([0xff5a7a, 0xffd23f, 0xffffff]); return grp(pb(geo.torus, M(c, { roughness: .35 }), 1.7, 1.7, 1.7, 0, 1.2, 0, Math.PI / 2 - .2)); };
  const plBench = () => grp(bk(tileB, 5, 1, 1.4, 0, .5, 0), bk(tileW, 5.2, .25, 1.6, 0, 1.1, 0));
  T.pool = { name: 'The Poolrooms', sky: 0xbfe9f2, ground: 0xcfeef2, road: 0xaed8e0, roadStyle: 'pooltile', edge: 0xffffff, line: '#ffffff', kerb: ['#9fd6e4', '#ffffff'], accent: '#6fe0f5', fog: [40, 260], hemi: 1.9, sun: .6, walls: true, wallStyle: 'pool', wallColor: 0xe6f4f6, hill: 0,
    flat: { colors: [0x4fd0e8, 0x7fe3f2], onRoad: false, emissive: true, count: 80 }, decor: [plPillar, plPillar, plArch, plLadder, plRing, plBench] };

  // --- Minecraft: the End - end stone, obsidian pillars topped by end crystals, endermen, the gateway beam
  const endStone = [0xdcd89f, 0xcfcb8c].map(c => M(c, { roughness: 1 })), obsE = M(0x14101c, { roughness: .3, metalness: .2 }), crystalE = E(0xff5ad8, 1.5), cageE = E(0xb04aff, .9), chorus = M(0x8a5aa8, { roughness: 1 }), chorusF = E(0xe0b0ff, .8), enderEye = E(0xd05aff, 2);
  const endPillar = () => { const h = R(18, 34); return grp(bk(obsE, 4, h, 4, 0, h / 2, 0), bk(M(0x7a7a80, { metalness: .6 }), 4.6, .5, 4.6, 0, h + .3, 0), bk(crystalE, 1.5, 1.5, 1.5, 0, h + 2, 0), bk(cageE, 2.2, .25, 2.2, 0, h + 2, 0), bk(cageE, .25, 2.2, 2.2, 0, h + 2, 0)); };
  const enderman = () => { const m = M(0x0c0a10, { roughness: .8 }); return grp(bk(m, .7, 4.6, .7, -.55, 2.3, 0), bk(m, .7, 4.6, .7, .55, 2.3, 0), bk(m, 1.8, 2.8, .9, 0, 6, 0), bk(m, .5, 4.4, .5, -1.4, 5.2, 0), bk(m, .5, 4.4, .5, 1.4, 5.2, 0), bk(m, 1.6, 1.6, 1.6, 0, 8.2, 0), bk(enderEye, .5, .25, .1, -.4, 8.3, .82), bk(enderEye, .5, .25, .1, .4, 8.3, .82)); };
  const chorusPlant = () => { const g = grp(); let y = 0; for (let i = 0; i < Math.round(R(3, 6)); i++) { g.add(bk(chorus, 1.1, 2, 1.1, R(-.4, .4), y + 1, R(-.4, .4))); y += 2; } g.add(bk(chorusF, 1.5, 1.5, 1.5, 0, y + .5, 0)); return g; };
  const endIsland = () => grp(pb(geo.blob, pick(endStone), R(5, 9), R(2, 3.2), R(5, 9), 0, R(8, 20), 0), pb(geo.blob, endStone[1], R(2, 4), R(3, 6), R(2, 4), 0, R(4, 12), 0));
  const endGate = () => grp(pb('cyl', E(0xd8b0ff, 1, { transparent: true, opacity: .3, depthWrite: false }), 1.3, 90, 1.3, 0, 45, 0, 0, 0, 0), bk(M(0x1a1a22), 3, .8, 3, 0, .4, 0));
  const dragonEgg = () => grp(pb('sph', M(0x0a0610, { roughness: .2, metalness: .3 }), 1.1, 1.5, 1.1, 0, 1.6, 0), pb('sph', E(0x8a2aff, .9), .5, .35, .5, .3, 2.2, .85), bk(M(0x14101c), 3, .8, 3, 0, .4, 0));
  T.end = { name: 'The End', sky: 0x0e0816, ground: 0xdcd89f, road: 0x2c2240, roadStyle: 'blocks', edge: 0xb04aff, line: '#c78aff', kerb: ['#14101c', '#b04aff'], kerbGlow: true, accent: '#c78aff', fog: [80, 480], hemi: .85, sun: .6, stars: 1, clouds: 0, mount: 0x15101f, mountTop: 0x6a3aa8, hill: .35,
    decor: [endPillar, endPillar, enderman, enderman, chorusPlant, chorusPlant, endIsland, endIsland, dragonEgg, endGate] };

  // --- Hollow Knight: the City of Tears - rain-dark gothic spires, Lumafly lamps, stone Watcher statues, ornate arches
  const cityStone = [0x2a3550, 0x33405e, 0x222c46].map(c => M(c, { roughness: .8 })), cityTrim = M(0x6a7ea8, { roughness: .6 }), windowE = E(0xffe9a0, 1.2);
  const spire = () => { const w = R(3, 5), h = R(22, 44); const g = grp(bk(pick(cityStone), w, h, w, 0, h / 2, 0), bk(cityTrim, w + .8, .8, w + .8, 0, h * .55, 0), bk(cityTrim, w + .8, .8, w + .8, 0, h, 0), pb('cone', cityStone[2], w * .75, h * .35, w * .75, 0, h + h * .17, 0, 0, Math.PI / 4)); for (let y = 4; y < h - 4; y += 5) for (const sx of [-1, 1]) g.add(bk(windowE, .1, 1.8, .9, sx * (w / 2 + .05), y, 0)); return g; };
  const cityArch = () => grp(bk(pick(cityStone), 2, 12, 2.4, -6, 6, 0), bk(pick(cityStone), 2, 12, 2.4, 6, 6, 0), pb(new THREE.TorusGeometry(6, 1, 6, 20, Math.PI), cityTrim, 1, 1, 1.2, 0, 12, 0), pb('cone', cityTrim, .8, 3, .8, 0, 19.5, 0));
  const statue = () => grp(bk(cityStone[1], 2.6, 1.2, 2.6, 0, .6, 0), pb('cone', M(0x1a2236), 1.5, 5.5, 1.5, 0, 4, 0), pb('sph', bone, .9, 1, .8, 0, 7.2, 0), pb('cone', bone, .22, 1.6, .22, -.55, 8.1, 0, 0, 0, .5), pb('cone', bone, .22, 1.6, .22, .55, 8.1, 0, 0, 0, -.5), pb('sph', M(0x000000), .22, .3, .1, -.3, 7.3, .7), pb('sph', M(0x000000), .22, .3, .1, .3, 7.3, .7));
  const rainLamp = () => grp(pb('cyl', iron, .14, 9, .14, 0, 4.5, 0), pb('cyl', iron, 1.1, .15, 1.1, 0, 9.1, 0), pb('sph', E(0xffe27a, 1.8), .55, .65, .55, 0, 8.4, 0), pb('cone', iron, .9, .7, .9, 0, 9.6, 0));
  T.city = { name: 'City of Tears', sky: 0x0b1424, ground: 0x141c2c, road: 0x2a3446, roadStyle: 'stone', edge: 0x9fc4ff, line: '#9fc4ff', kerb: ['#2a3350', '#9fc4ff'], kerbGlow: true, accent: '#9fc4ff', fog: [50, 300], hemi: .6, sun: .45, stars: .35, clouds: .6, mount: 0x1a2438, mountTop: 0x4a6a9a, hill: .5, lamp: 0xffe27a,
    decor: [spire, spire, cityArch, statue, rainLamp, hkBench, hkLantern, spire, hkMask, rainLamp] };


  // ===== batch 3: Silksong - Pharloom zones =====
  const bellGeo = new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI * .62);
  const bellOf = (mat, h = 7.5) => () => grp(pb('cyl', dark, .12, h - 2.5, .12, 0, h, 0), pb(bellGeo, mat, 1.8, 2, 1.8, 0, h - 3.7, 0, Math.PI), pb('sph', mat, .3, .3, .3, 0, h - 4.9, 0), pb('torus', mat, .5, .5, .5, 0, h - 2.7, 0));
  const clay = [0x8a3a2a, 0x7a3326, 0x9a4a30].map(c => M(c, { roughness: .9 })), plaster = M(0xd9c3a0, { roughness: .95 }), timber = M(0x4a2f1c), warmWin = E(0xffc060, 1.5), beadM = M(0xefe4c8, { roughness: .4 }), banner = M(0xb0182c, { side: THREE.DoubleSide });
  const roofM = [0x6a2a20, 0x5a2218].map(c => M(c, { roughness: .8 }));
  // Bellhart: a warm dusk village of tiled-roof houses, hanging bells, red thread banners and bead strings
  const bhHouse = () => { const w = R(6, 9), h = R(5, 7), d = R(5, 7); return grp(bk(plaster, w, h, d, 0, h / 2, 0), bk(timber, w + .3, .5, d + .3, 0, h * .5, 0), pb('sqpyr', pick(roofM), w * .78, 3.6, d * .78, 0, h + 1.8, 0, 0, Math.PI / 4), bk(timber, 1, 2.6, 1, w * .28, h + 2.4, 0), bk(warmWin, 1.1, 1.4, .1, -w * .22, h * .55, d / 2 + .05), bk(warmWin, 1.1, 1.4, .1, w * .22, h * .55, d / 2 + .05), bk(timber, 1.3, 2.4, .1, 0, 1.2, d / 2 + .05)); };
  const bhBanner = () => grp(pb('cyl', timber, .15, 10, .15, 0, 5, 0), bk(banner, .08, 5, 2.2, 0, 7, 1.1), pb('torus', brassM, .35, .35, .35, 0, 9.7, 0));
  const bhBeads = () => grp(Array.from({ length: 14 }, (_, i) => pb('sph', beadM, .24, .24, .24, Math.cos(i * .55) * 1.3, .3 + i * .05, Math.sin(i * .55) * 1.3)));
  const bhShrine = () => grp(bk(cityStone[1], 1.4, 9, 1.4, -3, 4.5, 0), bk(cityStone[1], 1.4, 9, 1.4, 3, 4.5, 0), bk(cityTrim, 8, 1.2, 1.8, 0, 9.3, 0), pb('torus', brassM, .35, .35, .35, 0, 8.4, 0), pb(bellGeo, brassM, 2.2, 2.4, 2.2, 0, 5.4, 0, Math.PI), pb('sph', brassM, .35, .35, .35, 0, 3.8, 0));
  const bhLamp = () => grp(pb('cyl', iron, .12, 7, .12, 0, 3.5, 0), bk(iron, 1.6, .12, .12, .8, 6.8, 0), pb('sph', E(0xffa840, 1.9), .5, .6, .5, 1.5, 6.3, 0));
  const bhCrate = () => grp(bk(M(0x6b4a2b), 2, 2, 2, 0, 1, 0), bk(M(0x6b4a2b), 1.6, 1.6, 1.6, 2.2, .8, .4), bk(M(0x6b4a2b), 1.4, 1.4, 1.4, 1, 2.7, .1));
  T.bellhart = { name: 'Bellhart', sky: 0xe8a070, ground: 0x5a4030, road: 0x6a5a50, roadStyle: 'stone', edge: 0xd4af37, line: '#d4af37', kerb: ['#8a1c2b', '#d4af37'], accent: '#ffb050', fog: [90, 430], hemi: .95, sun: 1.05, clouds: .7, mount: 0x6a4a50, mountTop: 0xe8b080, hill: .8, lamp: 0xffa840,
    decor: [bhHouse, bhHouse, bhHouse, bellOf(brassM), bhBanner, bhBanner, bhBeads, bhShrine, bhLamp, bhCrate, ssSpool, rocks([M(0x5a4a40)], 1.3)] };

  // Moss Grotto: glowing green caverns - giant moss caps, hanging vines, spore bulbs, mossy boulders
  const mossM = [0x2f8a3a, 0x3da84a, 0x1f6a30].map(c => M(c, { roughness: 1 })), mossGlow = [E(0x9affb0, 1.2), E(0x6adf8a, 1.1)], vineM = M(0x2a7a35);
  const mgCap = () => { const h = R(4, 9), r = R(2.2, 4.5); return grp(pb('cyl', M(0xdff3d0), .55, h, .55, 0, h / 2, 0), pb(geo.blob, pick(mossGlow), r, r * .45, r, 0, h, 0)); };
  const mgVines = () => grp(Array.from({ length: 5 }, () => { const l = R(6, 16); return pb('cyl', vineM, .13, l, .13, R(-1.5, 1.5), 40 - l / 2, R(-1.5, 1.5)); }));
  const mgBulb = () => grp(pb('cyl', vineM, .12, 4, .12, 0, 2, 0), pb('sph', pick(mossGlow), .8, .9, .8, 0, 4.3, 0), pb('sph', E(0xffffff, 1.2), .25, .25, .25, .3, 5.3, .2, false));
  const mgBoulder = () => { const s = R(2.4, 5); return grp(pb(geo.rock, pick(mossM), s, s * .7, s, 0, s * .35, 0), pb(geo.blob, pick(mossM), s * .9, s * .35, s * .9, 0, s * .7, 0)); };
  const mgFern = () => grp(Array.from({ length: 7 }, (_, i) => pb('cone', pick(mossM), .5, 3.2, .5, Math.cos(i) * .9, 1.4, Math.sin(i) * .9, Math.sin(i) * .7, 0, -Math.cos(i) * .7)));
  const mgSpore = () => grp(Array.from({ length: 6 }, () => pb('sph', E(0xcaffd0, 1.6), .16, .16, .16, R(-2, 2), R(2, 9), R(-2, 2), false)));
  T.moss = { name: 'Moss Grotto', sky: 0x143a2a, ground: 0x1f5a34, road: 0x3a4a3a, roadStyle: 'stone', edge: 0xb8ff9a, line: '#b8ff9a', kerb: ['#2f7a3a', '#cfffb0'], kerbGlow: true, accent: '#9affb0', fog: [45, 290], hemi: .85, sun: .45, stars: 0, clouds: 0, mount: 0x14402a, mountTop: 0x6adf7a, hill: .7,
    decor: [mgCap, mgCap, mgCap, mgVines, mgVines, mgBulb, mgBoulder, mgFern, mgFern, mgSpore, hkBench, ssNeedle] };

  // Mount Fay: frozen peaks - snow pines, ice-locked bells, icicles, tattered banners, snowy shrines
  const iceBell = M(0xbfe6ff, { roughness: .1, emissive: 0x4aa8d8, emissiveIntensity: .35, metalness: .1 });
  const mfIcicles = () => grp(Array.from({ length: 5 }, () => { const h = R(4, 11); return pb('cone', icec, R(.5, 1.1), h, R(.5, 1.1), h / 2, R(-1.6, 1.6), R(-1.6, 1.6)); }));
  const mfBanner = () => grp(pb('cyl', timber, .14, 9, .14, 0, 4.5, 0), bk(banner, .06, 3.6, 2, 0, 7.4, 1), bk(M(0xf4f9ff), .3, .4, 2.2, 0, 9.3, 1));
  const mfShrine = () => grp(bk(cityStone[1], 6, 1, 6, 0, .5, 0), bk(snow, 6.2, .5, 6.2, 0, 1.1, 0), bk(cityStone[1], 1, 6, 1, -2, 4, 0), bk(cityStone[1], 1, 6, 1, 2, 4, 0), bk(snow, 5.6, .8, 1.5, 0, 7.4, 0), pb(bellGeo, iceBell, 1.4, 1.6, 1.4, 0, 5.2, 0, Math.PI));
  const mfDrift = () => grp(pb(geo.blob, snow, R(4, 8), R(1.2, 2.2), R(4, 8), 0, .3, 0));
  T.fay = { name: 'Mount Fay', sky: 0xc8d8ea, ground: 0xe8f0f8, road: 0x6a7a8a, roadStyle: 'ice', edge: 0xcfe6ff, line: '#cfe6ff', kerb: ['#cfe6ff', '#6a8aa8'], accent: '#bfe6ff', fog: [60, 380], hemi: .95, sun: .9, clouds: 1, mount: 0x8aa0b8, mountTop: 0xffffff, hill: 1.2,
    decor: [pineTree([M(0x2a5a4a), M(0x336a55)], true), pineTree([M(0x2a5a4a)], true), mfIcicles, mfBanner, mfShrine, bellOf(iceBell), mfDrift, mfDrift, rocks([M(0x8a96a6)], 1.6), mfBanner] };

  T.flatMat = c => E(c, 0.2);
  return T;
}
