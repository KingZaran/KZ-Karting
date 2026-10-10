// Optional .glb model support. Drop Blender/Sketchfab .glb files in /models and list them in models/manifest.json.
// Anything not listed keeps using the built-in procedural model, so the game always works.
//
// manifest entries can be a plain path or an object:
//   "chars": { "mario": "models/chars/mario.glb" }
//   "chars": { "mario": { "url": "models/chars/mario.glb", "height": 3, "yaw": 180, "pose": true, "color": "#ffffff", "hide": ["hexagon"] } }
//     height : standing height in kart units (default 3.4)
//     yaw    : degrees to turn him so he faces forward. LEAVE OUT to auto-detect (default).
//     pose   : bend arms/legs into a driving pose (default true). Works from the skeleton's SHAPE, not bone names.
//     color  : multiply/tint every material (e.g. "#ff0000"). hide: remove nodes whose name contains any of these words.
import { getKart } from './roster.js';
export const MODELS = { karts: {}, chars: {}, props: {} };

// Skinned meshes MUST be cloned with SkeletonUtils, otherwise the copy stays bound to the original (un-placed) skeleton.
let skClone = null;
export function cloneModel(obj) {
  const c = skClone ? skClone(obj) : obj.clone(true);
  c.traverse(o => { if (o.isSkinnedMesh) o.frustumCulled = false; });
  return c;
}

export async function preloadModels(THREE) {
  let manifest;
  try { const r = await fetch('models/manifest.json', { cache: 'no-cache' }); if (!r.ok) return false; manifest = await r.json(); } catch (e) { return false; }
  const list = v => Object.entries(v || {});
  const wanted = list(manifest.karts).length + list(manifest.chars).length + Object.values(manifest.props || {}).flat().length;
  if (!wanted) return false;
  let GLTFLoader; try { ({ GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')); } catch (e) { console.warn('GLTFLoader unavailable', e); return false; }
  try { skClone = (await import('three/addons/utils/SkeletonUtils.js')).clone; } catch (e) { console.warn('SkeletonUtils unavailable - skinned models may misbehave', e); }
  const loader = new GLTFLoader();
  const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

  // Old Sketchfab/Blender exports use KHR_materials_pbrSpecularGlossiness, which modern three.js ignores -> grey, untextured model.
  // Read the diffuse texture/colour from that extension ourselves.
  async function fixLegacy(g) {
    const jobs = [];
    g.scene.traverse(o => { if (!o.isMesh) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
      const ext = m.userData && m.userData.gltfExtensions && m.userData.gltfExtensions.KHR_materials_pbrSpecularGlossiness; if (!ext) return;
      if (ext.diffuseFactor) m.color.setRGB(ext.diffuseFactor[0], ext.diffuseFactor[1], ext.diffuseFactor[2]);
      if (ext.diffuseTexture && !m.map) jobs.push(g.parser.getDependency('texture', ext.diffuseTexture.index).then(t => { t.colorSpace = THREE.SRGBColorSpace; m.map = t; m.needsUpdate = true; }));
      console.info(`[KZ-Karting] material "${m.name}" used the old specular-glossiness format; recovered its diffuse texture`);
    }); });
    await Promise.all(jobs);
  }
  const load = url => new Promise(res => loader.load(url, async g => { try { await fixLegacy(g); } catch (e) { console.warn('legacy material fix failed', e); } res(g.scene); },
    undefined, err => { console.warn('Model failed to load:', url, err && err.message || err); res(null); }));
  const cfg = v => typeof v === 'string' ? { url: v } : v;

  // Blender/glTF materials are often fully metallic, which renders black without an environment map. Make them game-friendly.
  const tame = obj => obj.traverse(o => { if (!o.isMesh) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.metalness > .4) m.metalness = .4; if (m.roughness < .45) m.roughness = .45; m.envMapIntensity = 0; }); });

  // ---------- skeleton helpers (world space, so no bone-name or local-axis assumptions) ----------
  const wq = o => o.getWorldQuaternion(new THREE.Quaternion()), wp = o => o.getWorldPosition(V3());
  const upd = holder => { holder.updateMatrixWorld(true); holder.traverse(n => { if (n.isSkinnedMesh) { n.boundingBox = null; n.boundingSphere = null; } }); };
  const hasBones = root => { let b = false; root.traverse(o => { if (o.isBone) b = true; }); return b; };
  // joints = bones when there's a skeleton, otherwise every node (rigid-part rigs)
  function jointsOf(root) {
    const b = []; root.traverse(o => { if (o.isBone) b.push(o); }); if (b.length >= 8) return b;
    const n = []; root.traverse(o => { if (o !== root && o.parent) n.push(o); }); return n;
  }
  const countDesc = j => { let n = 0; j.traverse(() => n++); return n; };
  // body measurements taken from the JOINTS (the mesh box can be wildly different for rigs with odd bind scales)
  function bodyOf(J, P) {
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const j of J) { const p = P.get(j); x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
    return { y0, H: (y1 - y0) || 1, cx: (x0 + x1) / 2 };
  }
  function aim(bone, child, dir) {
    bone.updateWorldMatrix(true, true);
    const cur = wp(child).sub(wp(bone)); if (cur.lengthSq() < 1e-12 || dir.lengthSq() < 1e-12) return; cur.normalize();
    const rot = new THREE.Quaternion().setFromUnitVectors(cur, dir.clone().normalize());
    const pq = bone.parent ? wq(bone.parent) : new THREE.Quaternion();
    bone.quaternion.copy(pq.invert().multiply(rot).multiply(wq(bone))); bone.updateWorldMatrix(true, true);
  }
  // two-bone IK: put the wrist on target T (elbow bends down/outward)
  function ik2(upper, elbow, wrist, T, side) {
    upper.updateWorldMatrix(true, true);
    const S = wp(upper), E = wp(elbow), W = wp(wrist), a = S.distanceTo(E), b = E.distanceTo(W), to = T.clone().sub(S); let d = to.length(); if (d < 1e-6 || a < 1e-6 || b < 1e-6) return;
    const dir = to.clone().divideScalar(d); d = Math.min(Math.max(d, Math.abs(a - b) + 1e-3), a + b - 1e-3);
    const along = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - along * along));
    const pole = V3(side * .45, -1, -.1); pole.addScaledVector(dir, -pole.dot(dir)).normalize();
    const Et = S.clone().addScaledVector(dir, along).addScaledVector(pole, h);
    aim(upper, elbow, Et.sub(S)); aim(elbow, wrist, T.clone().sub(wp(elbow)));
  }
  // steering wheel centre in the driver's frame (kart y=0 at the seat top); hands sit on either side of it
  const HAND = { x: .3, y: .62, z: 1.1 };
  // Find arms (long sideways chains) and legs (long downward chains) purely from the skeleton's geometry.
  function poseDriver(holder) {
    const J = jointsOf(holder); if (J.length < 6) return { arms: 0, legs: 0, why: 'no skeleton' };
    upd(holder);
    const P = new Map(J.map(j => [j, wp(j)])), body = bodyOf(J, P), { y0, H } = body, S = new Set(J);
    // centre line = the pelvis joint when we can find it (the skeleton's bounding box is skewed by tails, hair and shells)
    const pelv = J.find(b => /hips?\b|hips?_|pelvis/i.test(b.name) && !/end/i.test(b.name)), cx = pelv ? P.get(pelv).x : body.cx;
    const kids = j => j.children.filter(c => S.has(c));
    // straighten a leaning/lying torso: aim hips -> highest centre-line joint straight up, then refresh
    if (pelv) { let top = null; for (const j of J) { const p = P.get(j); if (Math.abs(p.x - cx) < .12 * H && p.y > P.get(pelv).y + .1 * H && (!top || p.y > P.get(top).y)) top = j; }
      if (top) { const ax = P.get(top).clone().sub(P.get(pelv)).normalize(); if (ax.y < .93) { aim(pelv, top, V3(0, 1, 0)); upd(holder); for (const j of J) P.set(j, wp(j)); } } }
    const armNext = { '-1': new Map(), '1': new Map() }, legNext = new Map();   // arms per side: both shoulders can hang off the same spine joint
    for (const j of J) for (const c of kids(j)) {
      const pj = P.get(j), pc = P.get(c), d = pc.clone().sub(pj), L = d.length(); if (L < .012 * H) continue;
      if (Math.abs(d.x) / L > .7 && pj.y > y0 + .28 * H && Math.abs(pc.x - cx) > Math.abs(pj.x - cx) && Math.abs(pc.x - cx) > .07 * H) {
        const am = armNext[Math.sign(pc.x - cx)], old = am.get(j); if (!old || Math.abs(P.get(old).x - pj.x) < Math.abs(d.x)) am.set(j, c);
      }
      if (d.y / L < -.7 && pj.y > y0 + .08 * H && pj.y < y0 + .66 * H && Math.abs(pj.x - cx) > .01 * H && Math.abs(pj.x - cx) < .3 * H) {
        const old = legNext.get(j); if (!old || P.get(old).y > pc.y) legNext.set(j, c);
      }
    }
    const chainFrom = (root, next) => { const ch = [root]; let cur = root, guard = 0; while (next.has(cur) && guard++ < 12) { cur = next.get(cur); ch.push(cur); } return ch; };
    const bestChain = (next, side, sideOf) => { let best = null; for (const r of next.keys()) { if (next.has(r.parent) || sideOf(r) !== side) continue; const ch = chainFrom(r, next); if (!best || ch.length > best.length) best = ch; } return best; };
    let arms = 0, legs = 0; const detail = [];
    for (const s of [-1, 1]) {
      const arm = bestChain(armNext[s], s, () => s);
      detail.push(`${s > 0 ? '+x' : '-x'} arm: ${arm ? arm.map(b => b.name).join('>') : 'none'}`);
      if (arm && arm.length >= 3) {
        let u = 0; while (u < arm.length - 3 && (P.get(arm[u + 1]).distanceTo(P.get(arm[u])) < .075 * H || Math.abs(P.get(arm[u]).x - cx) < .05 * H)) u++; // skip spine/clavicle stubs: the upper arm is the first long bone
        if (arm[u + 2]) ik2(arm[u], arm[u + 1], arm[u + 2], V3(s * HAND.x, HAND.y, HAND.z), s);
        else aim(arm[u], arm[u + 1], V3(s * .22, -.62, .6));
        arms++;
      }
      const leg = bestChain(legNext, s, j => Math.sign(P.get(j).x - cx));
      if (leg && leg.length >= 3) { aim(leg[0], leg[1], V3(s * .06, -.04, 1)); aim(leg[1], leg[2], V3(0, -1, .12)); legs++; }
    }
    return { arms, legs, bones: J.length, why: detail.join(' | ') };
  }
  // pelvis: a joint near the middle of the body, on the centre line, that owns the most of the skeleton
  function hipsOf(holder) {
    const J = jointsOf(holder), named = J.find(b => /hips?\b|hips?_|pelvis/i.test(b.name) && !/end/i.test(b.name)); if (named) return named;
    upd(holder); const P = new Map(J.map(j => [j, wp(j)])), { y0, H, cx } = bodyOf(J, P);
    let best = null, bn = -1;
    for (const j of J) { const p = P.get(j); if (p.y < y0 + .3 * H || p.y > y0 + .64 * H || Math.abs(p.x - cx) > .05 * H) continue; const n = countDesc(j); if (n > bn) { bn = n; best = j; } }
    return best || J.find(j => j.isBone && j.parent && j.parent.isBone) || J[0];
  }
  // Which way is he facing? Conservative: glTF models normally already face +Z, so only turn him when the evidence is strong.
  function detectYaw(holder) {
    upd(holder);
    const box = new THREE.Box3().setFromObject(holder), H = box.max.y - box.min.y, y0 = box.min.y, pts = [];
    holder.traverse(m => { if (!m.isMesh || !m.geometry.attributes.position) return; const a = m.geometry.attributes.position, step = Math.max(1, Math.floor(a.count / 4000)); const v = V3();
      for (let i = 0; i < a.count; i += step) { v.fromBufferAttribute(a, i); if (m.isSkinnedMesh && m.skeleton && m.geometry.attributes.skinIndex) m.applyBoneTransform(i, v); v.applyMatrix4(m.matrixWorld); pts.push(v.x, v.y, v.z); } });
    const score = deg => { const t = THREE.MathUtils.degToRad(deg), sn = Math.sin(t), cs = Math.cos(t); let fz = 0, fn = 0, az = 0, an = 0;
      for (let i = 0; i < pts.length; i += 3) { const y = pts[i + 1] - y0, zz = -pts[i] * sn + pts[i + 2] * cs;
        if (y < .06 * H) { fz += zz; fn++; } else if (y > .09 * H && y < .2 * H) { az += zz; an++; } }
      return fn && an ? (fz / fn - az / an) / H : 0; };
    const sc = [0, 180, 90, -90].map(d => [d, score(d)]).sort((a, b) => b[1] - a[1]);
    const best = sc[0], conf = best[1] - (sc.find(x => x[0] === 0)[1]);
    return { yaw: (best[0] !== 0 && conf > .2) ? best[0] : 0, conf };
  }
  // Models with NO skeleton (T-posed static meshes): bend arms and legs by moving vertices. Works in world space on the baked mesh.
  function bendStatic(holder, SEAT) {
    upd(holder);
    const meshes = []; holder.traverse(m => { if (m.isMesh && m.geometry && m.geometry.attributes.position && !m.isSkinnedMesh) meshes.push(m); });
    if (!meshes.length) return null;
    const box = new THREE.Box3().setFromObject(holder), H = box.max.y - box.min.y, y0 = box.min.y, cx = (box.min.x + box.max.x) / 2, zc = (box.min.z + box.max.z) / 2, A = (box.max.x - box.min.x) / 2;
    const waist = [], armYs = [], v = V3();
    for (const m of meshes) { const a = m.geometry.attributes.position, step = Math.max(1, Math.floor(a.count / 6000));
      for (let i = 0; i < a.count; i += step) { v.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld); const ax = Math.abs(v.x - cx), y = v.y - y0; if (y > .28 * H && y < .48 * H) waist.push(ax); if (y > .5 * H && ax > .3 * A) armYs.push(v.y); } }
    waist.sort((p, q) => p - q); const wt = waist.length ? waist[Math.floor(waist.length * .95)] : .15 * A;
    const Sx = Math.min(Math.max(wt * 1.1, .2 * A), .38 * A); armYs.sort((p, q) => p - q);
    const shY = armYs.length ? armYs[armYs.length >> 1] : y0 + .72 * H, hipY = y0 + .48 * H, kneeY = y0 + .26 * H, elbX = Sx + .5 * (A - Sx);
    const sm = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
    const q = (a, b) => new THREE.Quaternion().setFromUnitVectors(a.clone().normalize(), b.clone().normalize());
    const R = {}; for (const s of [-1, 1]) {
      // shoulder in the seat frame, hand target on the wheel -> elbow by the law of cosines (elbows drop down/outward)
      const sh = V3(s * Sx, shY - hipY + SEAT.y, SEAT.z), T = V3(s * HAND.x, HAND.y, HAND.z), a = elbX - Sx, b = Math.max(.01, A - elbX);
      let d = T.clone().sub(sh).length(); const dir = T.clone().sub(sh).normalize(); d = Math.min(Math.max(d, Math.abs(a - b) + 1e-3), a + b - 1e-3);
      const along = (a * a - b * b + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, a * a - along * along)), pole = V3(s * .45, -1, -.1); pole.addScaledVector(dir, -pole.dot(dir)).normalize();
      const El = sh.clone().addScaledVector(dir, along).addScaledVector(pole, hh);
      const t1 = El.clone().sub(sh).normalize(), t2 = T.clone().sub(El).normalize(), th = V3(s * .05, -.03, 1).normalize();
      R[s] = { t1, R1: q(V3(s, 0, 0), t1), R2: q(t1, t2), R3: q(V3(0, -1, 0), th), R4: q(th, V3(0, -1, .12)), th }; }
    const hipX = wt * .5, kneeLen = hipY - kneeY, tmp = V3(), out = V3();
    function D(px, py, pz, o) {                       // deform one point (given in world space)
      let x = px - cx, y = py, z = pz - zc; const s = x < 0 ? -1 : 1, ax = Math.abs(x), r = R[s];
      // arm
      const wArm = sm(.8 * Sx, 1.2 * Sx, ax) * (1 - sm(.09 * H, .15 * H, Math.abs(y - shY)));
      if (wArm > 0) {
        const ps = V3(s * Sx, shY, 0); tmp.set(x, y, z).sub(ps); out.copy(tmp).applyQuaternion(r.R1); tmp.lerp(out, wArm); let px1 = ps.x + tmp.x, py1 = ps.y + tmp.y, pz1 = ps.z + tmp.z;
        const we = wArm * sm(.92 * elbX, 1.08 * elbX, ax);
        if (we > 0) { const E = ps.clone().addScaledVector(r.t1, elbX - Sx); tmp.set(px1, py1, pz1).sub(E); out.copy(tmp).applyQuaternion(r.R2); tmp.lerp(out, we); px1 = E.x + tmp.x; py1 = E.y + tmp.y; pz1 = E.z + tmp.z; }
        x = px1; y = py1; z = pz1;
      }
      // leg
      const wLeg = sm(.12 * wt, .5 * wt, ax) * (1 - sm(hipY - .05 * H, hipY + .02 * H, y));
      if (wLeg > 0) {
        const pq = V3(s * hipX, hipY, 0); tmp.set(x, y, z).sub(pq); out.copy(tmp).applyQuaternion(r.R3); tmp.lerp(out, wLeg); let px1 = pq.x + tmp.x, py1 = pq.y + tmp.y, pz1 = pq.z + tmp.z;
        const wk = wLeg * (1 - sm(kneeY - .05 * H, kneeY + .05 * H, y)); // below the knee, swing the shin back down
        if (wk > 0) { const K = pq.clone().addScaledVector(r.th, kneeLen); tmp.set(px1, py1, pz1).sub(K); out.copy(tmp).applyQuaternion(r.R4); tmp.lerp(out, wk); px1 = K.x + tmp.x; py1 = K.y + tmp.y; pz1 = K.z + tmp.z; }
        x = px1; y = py1; z = pz1;
      }
      o.set(x + cx, y, z + zc);
    }
    const flat = new THREE.Group(), eps = .004 * H, p0 = V3(), p1 = V3(), n = V3();
    for (const m of meshes) {
      const g = m.geometry.clone(); g.applyMatrix4(m.matrixWorld); const pos = g.attributes.position, nor = g.attributes.normal;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); D(x, y, z, p0);
        if (nor) { n.fromBufferAttribute(nor, i); D(x + n.x * eps, y + n.y * eps, z + n.z * eps, p1); p1.sub(p0).normalize(); nor.setXYZ(i, p1.x, p1.y, p1.z); }
        pos.setXYZ(i, p0.x, p0.y, p0.z);
      }
      pos.needsUpdate = true; if (nor) nor.needsUpdate = true; g.computeBoundingBox(); g.computeBoundingSphere();
      const nm = new THREE.Mesh(g, m.material); nm.name = m.name; nm.castShadow = true; flat.add(nm);
    }
    while (holder.children.length) holder.remove(holder.children[0]); holder.add(flat);
    return { node: flat, pivot: V3(cx, hipY, zc), arm: { Sx, shY, A }, wt };
  }

  // kart/props: scale so length (z) or height (y) matches `size`, centre on x/z, sit on y = 0
  const fit = (obj, axis, size) => {
    const box = new THREE.Box3().setFromObject(obj), sz = box.getSize(V3());
    obj.scale.multiplyScalar(size / ((axis === 'z' ? sz.z : sz.y) || 1)); box.setFromObject(obj); const c = box.getCenter(V3());
    obj.position.set(-c.x, -box.min.y, -c.z); const w = new THREE.Group(); w.add(obj); return w;
  };
  // Console report (open the browser console with F12) so a grey/untextured/T-posing import can be diagnosed.
  function report(id, obj) {
    const rows = []; let textured = 0, total = 0;
    obj.traverse(o => { if (!o.isMesh) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { total++; if (m.map) textured++;
      rows.push(`  mesh "${o.name || '?'}" material "${m.name || '?'}": colour #${m.color ? m.color.getHexString() : '?'}, texture ${m.map ? (m.map.image ? m.map.image.width + 'x' + m.map.image.height : 'declared but image missing') : 'NONE'}`); }); });
    console.info(`[KZ-Karting] "${id}": ${total} material(s), ${textured} textured\n` + rows.join('\n'));
    if (!textured) console.warn(`[KZ-Karting] "${id}" has NO textures in the .glb, so it will look flat/grey. Re-export with textures packed (see models/README.md), or set "color" in manifest.json.`);
  }
  // characters: fit height, face forward, bend into a driving pose, then plant the hips on the seat (origin = seat centre)
  function fitChar(obj, o) {
    report(o.id, obj);
    const drop = (o.hide || []).map(s => String(s).toLowerCase());
    if (drop.length) { const kill = []; obj.traverse(n => { if (n !== obj && drop.some(s => (n.name || '').toLowerCase().includes(s))) kill.push(n); }); kill.forEach(n => n.parent && n.parent.remove(n)); }
    if (o.color) obj.traverse(n => { if (n.isMesh) (Array.isArray(n.material) ? n.material : [n.material]).forEach(m => { if (m.color) m.color.set(o.color); }); });
    tame(obj);
    const holder = new THREE.Group(); holder.add(obj);
    let yaw = o.yaw, how = 'manifest';
    if (yaw === undefined) { try { const d = detectYaw(holder); yaw = d.yaw; how = `auto (confidence ${d.conf.toFixed(3)})`; } catch (e) { yaw = 0; how = 'auto failed'; } }
    obj.rotation.y = THREE.MathUtils.degToRad(yaw); upd(holder);
    let box = new THREE.Box3().setFromObject(holder), h = box.getSize(V3()).y || 1;
    const h0 = h; obj.scale.multiplyScalar((o.height || 3.4) / h); upd(holder);
    const SEAT = V3(0, .25, -.15);
    let placed = obj, info = { arms: 0, legs: 0, why: 'pose disabled' }, mode = 'none';
    if (o.pose !== false) {
      try {
        if (hasBones(holder)) {
          const hp = wp(hipsOf(holder)); obj.position.set(SEAT.x - hp.x, SEAT.y - hp.y, SEAT.z - hp.z); upd(holder);   // seat first, so the hands can reach the wheel
          info = poseDriver(holder); mode = 'skeleton';
        } else {
          const r = bendStatic(holder, SEAT);
          if (r) { placed = r.node; placed.position.set(SEAT.x - r.pivot.x, SEAT.y - r.pivot.y, SEAT.z - r.pivot.z); info = { arms: 2, legs: 2, why: `static mesh bent (shoulder ${r.arm.Sx.toFixed(2)}, waist ${r.wt.toFixed(2)})` }; mode = 'static'; }
          else info = { arms: 0, legs: 0, why: 'no meshes' };
        }
      } catch (e) { info = { arms: 0, legs: 0, why: String(e) }; console.warn('pose error', e); }
    }
    upd(holder); box = new THREE.Box3().setFromObject(holder);
    const posed = info.arms + info.legs > 0;
    if (posed) {   // keep him inside the kart: shrink about the seat if he is wider than the tub
      const w = box.max.x - box.min.x, cap = o.maxWidth === undefined ? 3.2 : o.maxWidth;
      if (cap > 0 && w > cap) { const f = cap / w; placed.scale.multiplyScalar(f); placed.position.set(SEAT.x + f * (placed.position.x - SEAT.x), SEAT.y + f * (placed.position.y - SEAT.y), SEAT.z + f * (placed.position.z - SEAT.z)); upd(holder); box = new THREE.Box3().setFromObject(holder); }
    }
    if (posed) {   // short characters (e.g. Lemmy) would sink into the tub with only their hair showing: raise them so the head clears the cowl
      const want = o.headHeight === undefined ? 2.0 : o.headHeight, top = box.max.y; if (want > 0 && top < want) { const lift = Math.min(.9, want - top); placed.position.y += lift; upd(holder); box = new THREE.Box3().setFromObject(holder); }
    }
    console.info(`[KZ-Karting] "${o.id}": measured height ${h0.toFixed(3)} -> ${(box.max.y - box.min.y).toFixed(2)}; yaw ${yaw}° ${how}; ${mode}: ${info.arms} arm(s), ${info.legs} leg(s)${info.why ? ' - ' + info.why : ''}`);
    if (o.pose !== false && !posed) {
      const names = []; holder.traverse(n => { if (n.isBone) names.push(n.name); });
      console.warn(`[KZ-Karting] "${o.id}" could not be posed (${info.why || 'no limbs recognised'}). ${names.length ? 'Bones: ' + names.slice(0, 80).join(', ') : 'No skeleton and no meshes to bend.'}`);
    }
    if (!posed) { const c = box.getCenter(V3()); placed.position.set(-c.x, -box.min.y, -c.z); }
    return holder;
  }
  const jobs = [];
  for (const [id, v] of list(manifest.karts)) { const o = cfg(v); jobs.push(load(o.url).then(m => { if (m) { tame(m); MODELS.karts[id] = fit(m, 'z', o.length || getKart(id).l + .8); } })); }
  for (const [id, v] of list(manifest.chars)) { const o = cfg(v); jobs.push(load(o.url).then(m => { if (m) { try { MODELS.chars[id] = fitChar(m, { ...o, id }); } catch (e) { console.warn('Character failed to set up:', id, e); } } })); }
  for (const [theme, urls] of list(manifest.props)) for (const u of urls) { const o = cfg(u); jobs.push(load(o.url).then(m => { if (m) { tame(m); (MODELS.props[theme] ||= []).push(fit(m, 'y', o.height || 12)); } })); }
  await Promise.all(jobs); return true;
}
