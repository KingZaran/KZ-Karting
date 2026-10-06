// Zone themes: original art inspired by the genres you listed (cave-bug kingdom, silk citadel, ink arena, endless yellow halls, brawler stage...).
export function buildThemes(THREE) {
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .85, ...o });
  const E = (c, i = .9) => M(c, { emissive: c, emissiveIntensity: i });
  const geo = { cone: new THREE.ConeGeometry(1, 1, 8), cyl: new THREE.CylinderGeometry(1, 1, 1, 10), box: new THREE.BoxGeometry(1, 1, 1),
    sph: new THREE.SphereGeometry(1, 12, 10), dod: new THREE.DodecahedronGeometry(1), oct: new THREE.OctahedronGeometry(1) };
  const R = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  const part = (g, m, sx, sy, sz, y, x = 0, z = 0, cast = true) => { const o = new THREE.Mesh(geo[g], m); o.scale.set(sx, sy, sz); o.position.set(x, y, z); o.castShadow = cast; return o; };
  const grp = (...p) => { const g = new THREE.Group(); p.forEach(x => g.add(x)); return g; };
  const trunk = M(0x6b4a2b), leaf = M(0x1f6b2f), bush = M(0x2f8f3f), cac = M(0x4d8b3a), rock = M(0xa07a4a), ice = M(0x9fd4e6, { roughness: .3 }), snow = M(0xffffff);
  const inkCols = [0xff2d95, 0x2dff95, 0x7a2dff, 0xffd400, 0x00c8ff].map(c => E(c, .5));
  const candyCols = [0xff4fa0, 0x4fd0ff, 0xffe14f, 0x9f6bff, 0x6bff9f].map(c => M(c));
  const glow = [E(0xff2bd6), E(0x00e5ff), E(0xffe600)];
  const T = {
    meadow: { name: 'Sunny Meadow', sky: 0x87ceeb, ground: 0x3f8f3f, road: 0x333338, edge: 0xffffff, accent: '#5fd35f', fog: [120, 500], hemi: .9, sun: 1.2,
      decor: [() => { const h = R(6, 14); return grp(part('cyl', trunk, .7, h * .4, .7, h * .2), part('cone', leaf, 3.4, h, 3.4, h * .9)); }, () => part('sph', bush, 2, 1.4, 2, .7)] },
    dunes: { name: 'Sun-baked Dunes', sky: 0xf2b266, ground: 0xd9b56c, road: 0x4a3f36, edge: 0xffe0a0, accent: '#ffb347', fog: [120, 450], hemi: .95, sun: 1.3,
      decor: [() => { const h = R(4, 9); return grp(part('cyl', cac, .8, h, .8, h / 2), part('cyl', cac, .5, h * .4, .5, h * .55, 1.3)); }, () => part('dod', rock, R(1.5, 4), R(1, 3), R(1.5, 4), 1)] },
    frost: { name: 'Frost Fields', sky: 0xcfe8f5, ground: 0xf2f7fa, road: 0x5d6b78, edge: 0x8fd4ff, accent: '#9fe0ff', fog: [100, 420], hemi: 1, sun: 1,
      decor: [() => { const h = R(8, 18); return part('cone', ice, R(2, 4), h, R(2, 4), h / 2); }, () => part('sph', snow, 3, 3, 3, 1.5)] },
    neon: { name: 'Neon Night', sky: 0x070818, ground: 0x10122a, road: 0x1b1b2e, edge: 0x00ffe1, accent: '#ff2bd6', fog: [60, 260], hemi: .35, sun: .3,
      decor: [() => { const w = R(1.5, 3), h = R(8, 24); return part('box', pick(glow), w, h, w, h / 2); }] },
    hollow: { name: 'Hollow Depths', sky: 0x0a1020, ground: 0x151a28, road: 0x2b3347, edge: 0x7fe8ff, accent: '#7fe8ff', fog: [25, 170], hemi: .4, sun: .2,
      decor: [() => { const h = R(8, 22); return part('cone', M(0x2a3350), R(1.5, 4), h, R(1.5, 4), h / 2); },
        () => part('sph', E(0x8ff4ff, 1.4), .7, .7, .7, R(3, 9), 0, 0, false),
        () => grp(part('cyl', M(0xcfd8ff), .35, 2, .35, 1), part('sph', E(0x7fa0ff, 1), 1.4, .8, 1.4, 2.1))] },
    silk: { name: 'Thread Citadel', sky: 0x3a0f1c, ground: 0x2a1218, road: 0x4a2a2a, edge: 0xd4af37, accent: '#d4af37', fog: [40, 230], hemi: .55, sun: .5,
      decor: [() => { const h = R(10, 20), g = E(0xd4af37, .5); return grp(part('box', M(0x8a1c2b), 1.6, h, 1.6, h / 2), part('box', g, 2.4, .5, 2.4, h), part('box', g, 2.4, .5, 2.4, .3)); },
        () => grp(part('cyl', M(0x222222), .12, 6, .12, 3), part('cone', E(0xffc94a, 1), 1.1, 1.6, 1.1, 6.6)),
        () => part('cone', M(0x5a1020), 2, R(12, 24), 2, 8)] },
    ink: { name: 'Ink District', sky: 0x4a2bd8, ground: 0x25254a, road: 0x33334f, edge: 0xffd400, accent: '#ff2d95', fog: [100, 420], hemi: .85, sun: .9,
      flat: { colors: [0xff2d95, 0x2dff95, 0x7a2dff, 0xffd400, 0x00c8ff], onRoad: true, count: 90 },
      decor: [() => { const r = R(1, 2.2), h = R(3, 9); return part('cyl', pick(inkCols), r, h, r, h / 2); }, () => { const w = R(2, 4), h = R(8, 20); return part('box', pick(inkCols), w, h, w, h / 2); }] },
    backrooms: { name: 'The Yellow Halls', sky: 0x9a8a30, ground: 0xb9a64a, road: 0x8c7b34, edge: 0x6b5d24, accent: '#e8d44a', fog: [8, 95], hemi: 1.15, sun: .15, walls: true, wallColor: 0xc9b458, lights: true, decor: [] },
    brawl: { name: 'Final Arena', sky: 0x2b1b5e, ground: 0x1b1f3a, road: 0x4a4a68, edge: 0xffd400, accent: '#ffd400', fog: [100, 450], hemi: .8, sun: .9,
      decor: [() => part('cyl', M(0x9fd0ff, { transparent: true, opacity: .25, emissive: 0x9fd0ff, emissiveIntensity: 1, depthWrite: false }), 1.2, 70, 1.2, 35, 0, 0, false),
        () => grp(part('box', M(0xc27a2c), 3, 3, 3, 1.5), part('box', E(0xffd400, .3), 3.2, .4, 3.2, 3)),
        () => part('oct', E(0xfff04a, 1), 1.4, 2, 1.4, R(5, 14), 0, 0, false)] },
    lava: { name: 'Magma Run', sky: 0x4a1a0a, ground: 0x241010, road: 0x2b2b2b, edge: 0xff6a00, accent: '#ff6a00', fog: [60, 300], hemi: .55, sun: .6,
      flat: { colors: [0xff5a00, 0xff8a00], onRoad: false, emissive: true, count: 60 },
      decor: [() => { const w = R(5, 9), h = R(10, 24); return grp(part('cone', M(0x3a1410), w, h, w, h / 2), part('cone', E(0xff5a00, 1.2), w * .35, h * .3, w * .35, h * .85)); }] },
    candy: { name: 'Candy Cliffs', sky: 0xffd6f0, ground: 0xff9fd1, road: 0x7a4a8a, edge: 0xffffff, accent: '#ff7ac8', fog: [120, 480], hemi: 1, sun: 1,
      decor: [() => grp(part('cyl', snow, .25, 6, .25, 3), part('sph', pick(candyCols), 1.8, 1.8, 1.8, 6.5)), () => grp(part('cyl', M(0x8a5a2b), 1.6, 2, 1.6, 1), part('sph', M(0xff7ac8), 2, 1.4, 2, 2.6))] },
  };
  T.flatMat = c => E(c, 0.2);
  return T;
}
