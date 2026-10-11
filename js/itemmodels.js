// Proper little models for thrown / dropped items (shells, banana, bob-omb, fireball, boomerang, mushroom) built from primitives.
export function createItemModels(THREE) {
  const matCache = {};
  const M = (c, e = .15, rough = .45) => matCache[c + '|' + e] || (matCache[c + '|' + e] = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: e, roughness: rough }));
  const G = {
    dome: new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), sph: new THREE.SphereGeometry(1, 14, 10), rim: new THREE.TorusGeometry(1, .16, 8, 24),
    disc: new THREE.CylinderGeometry(1, 1, .3, 20), cone: new THREE.ConeGeometry(.22, .6, 6), cyl: new THREE.CylinderGeometry(1, 1, 1, 10),
  };
  const part = (geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = sx, sz = sx) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; return m; };
  function shell(shellCol, spikes) {
    const g = new THREE.Group(), r = .95;
    g.add(part(G.dome, M(shellCol, .25), 0, .05, 0, r, r * 1.15, r));                       // shell dome
    const rim = part(G.rim, M(0xfff1c9, .3), 0, .05, 0, r * .98, r * .98, r * .98); rim.rotation.x = Math.PI / 2; g.add(rim);   // cream rim
    g.add(part(G.disc, M(0xfff1c9, .3), 0, -.1, 0, r * .9, 1, r * .9));                     // cream underside
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, p = part(G.sph, M(0xffffff, .35), Math.cos(a) * r * .55, r * .62, Math.sin(a) * r * .55, .2, .1, .2); p.lookAt(0, 3, 0); g.add(p); }   // shell plates
    g.add(part(G.sph, M(0xffffff, .35), 0, r * .84, 0, .26, .12, .26));
    if (spikes) for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, s = part(G.cone, M(0xffffff, .3), Math.cos(a) * r * .72, r * .5, Math.sin(a) * r * .72, 1.3); s.rotation.z = -Math.cos(a) * .9; s.rotation.x = Math.sin(a) * .9; g.add(s); }
    return g;
  }
  function banana() {
    const g = new THREE.Group(), arc = new THREE.Group(), R = .9, A = 2.1;
    arc.add(new THREE.Mesh(new THREE.TorusGeometry(R, .24, 8, 20, A), M(0xffe135, .3)));
    for (const a of [0, A]) arc.add(part(G.sph, M(0x5a3b1a, .1), Math.cos(a) * R, Math.sin(a) * R, 0, .16));
    arc.rotation.z = Math.PI / 2 - A / 2; arc.position.y = R * .35; g.add(arc); return g;
  }
  function bomb() {
    const g = new THREE.Group();
    g.add(part(G.sph, M(0x1b1b22, .2, .3), 0, 1, 0, 1));
    g.add(part(G.cyl, M(0xb8b8c4, .2), 0, 2, 0, .38, .3, .38));                              // cap
    const fuse = part(G.cyl, M(0xffffff, .2), 0, 2.35, 0, .08, .4, .08); g.add(fuse);
    g.add(part(G.sph, M(0xff7a00, 1.2), 0, 2.62, 0, .2));                                     // lit fuse
    for (const s of [-1, 1]) { g.add(part(G.sph, M(0xffd400, .3), s * .5, .12, .1, .38, .2, .5)); g.add(part(G.sph, M(0xffffff, .5), s * .32, 1.25, .86, .24, .3, .12)); g.add(part(G.sph, M(0x000000, 0), s * .32, 1.25, .97, .1, .14, .06)); }
    const key = part(G.rim, M(0xb8b8c4, .2), 1.05, 1, 0, .28, .28, .28); key.rotation.y = Math.PI / 2; g.add(key);
    return g;
  }
  function fire() { const g = new THREE.Group(); g.add(part(G.sph, M(0xff5a00, 1.1), 0, 0, 0, .7)); g.add(part(G.sph, M(0xffd400, 1.6), 0, 0, 0, .42)); const t = part(G.cone, M(0xff7a00, 1), 0, 0, -.8, 1.8, 2.4, 1.8); t.rotation.x = -Math.PI / 2; g.add(t); return g; }
  function boom() { const g = new THREE.Group(), a = new THREE.Mesh(new THREE.TorusGeometry(.8, .22, 8, 18, Math.PI * .9), M(0xffc107, .5)); a.castShadow = true; a.rotation.x = Math.PI / 2; a.position.z = -.4; g.add(a); g.add(part(G.sph, M(0xff8f00, .4), .8, 0, -.4, .28)); g.add(part(G.sph, M(0xff8f00, .4), -.8, 0, -.4, .28)); return g; }
  function mush() {
    const g = new THREE.Group();
    g.add(part(G.dome, M(0xe53935, .3), 0, .35, 0, .8, .7, .8)); g.add(part(G.cyl, M(0xfff3d6, .3), 0, .15, 0, .38, .4, .38));
    for (const [x, z] of [[.4, .1], [-.3, .35], [-.15, -.45], [.1, .62]]) g.add(part(G.sph, M(0xffffff, .4), x, .8, z, .17, .1, .17));
    return g;
  }
  const B = { gshell: () => shell(0x2ecc40, false), rshell: () => shell(0xe53935, false), bshell: () => shell(0x1e88e5, true), banana, bomb, fire, boom, mush };
  return function itemMesh(type, scale = 1) { const g = (B[type] || bomb)(); g.scale.setScalar(scale); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; };
}
