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

  // Full matrix refresh + drop cached bounds. (updateWorldMatrix alone leaves a SkinnedMesh's bind matrix stale, so rigs authored
  // in cm / with a scaled armature were measured ~100x too small and then scaled up ~100x too big.)
  const upd = holder => { holder.updateMatrixWorld(true); holder.traverse(n => { if (n.isSkinnedMesh) { n.boundingBox = null; n.boundingSphere = null; } }); };
  // ---------- skeleton helpers (world space, so no bone-name or local-axis assumptions) ----------
  const wq = o => o.getWorldQuaternion(new THREE.Quaternion()), wp = o => o.getWorldPosition(V3());
  // joints = bones when there's a skeleton, otherwise every node (rigid-part rigs)
  function jointsOf(root) {
    const b = []; root.traverse(o => { if (o.isBone) b.push(o); }); if (b.length >= 8) return b;
    const n = []; root.traverse(o => { if (o !== root && o.parent) n.push(o); }); return n;
  }
  const countDesc = j => { let n = 0; j.traverse(() => n++); return n; };
  function aim(bone, child, dir) {
    bone.updateWorldMatrix(true, true);
    const cur = wp(child).sub(wp(bone)); if (cur.lengthSq() < 1e-12) return; cur.normalize();
    const rot = new THREE.Quaternion().setFromUnitVectors(cur, dir.clone().normalize());
    const pq = bone.parent ? wq(bone.parent) : new THREE.Quaternion();
    bone.quaternion.copy(pq.invert().multiply(rot).multiply(wq(bone))); bone.updateWorldMatrix(true, true);
  }
  // Find arms (long horizontal chains in the upper body) and legs (long downward chains below the hips) purely from geometry.
  function poseDriver(holder) {
    const J = jointsOf(holder); if (J.length < 6) return { arms: 0, legs: 0, why: 'no skeleton' };
    upd(holder);
    const box = new THREE.Box3().setFromObject(holder), H = box.max.y - box.min.y, y0 = box.min.y;
    const S = new Set(J), P = new Map(J.map(j => [j, wp(j)]));
    const cx = (box.min.x + box.max.x) / 2; // body centre line (a median over bones is skewed by dozens of finger bones)
    const kids = j => j.children.filter(c => S.has(c));
    const armNext = new Map(), legNext = new Map();
    for (const j of J) for (const c of kids(j)) {
      const pj = P.get(j), pc = P.get(c), d = pc.clone().sub(pj), L = d.length(); if (L < .012 * H) continue;
      if (Math.abs(d.x) / L > .7 && pj.y > y0 + .5 * H && Math.abs(pc.x - cx) > Math.abs(pj.x - cx) && Math.abs(pc.x - cx) > .07 * H) {
        const old = armNext.get(j); if (!old || Math.abs(P.get(old).x - pj.x) < Math.abs(d.x)) armNext.set(j, c);
      }
      if (d.y / L < -.7 && pj.y > y0 + .1 * H && pj.y < y0 + .66 * H && Math.abs(pj.x - cx) > .01 * H && Math.abs(pj.x - cx) < .22 * H) {
        const old = legNext.get(j); if (!old || P.get(old).y > pc.y) legNext.set(j, c);
      }
    }
    const chainFrom = (root, next) => { const ch = [root]; let cur = root, guard = 0; while (next.has(cur) && guard++ < 12) { cur = next.get(cur); ch.push(cur); } return ch; };
    const bestChain = (next, side, sideOf) => {
      let best = null;
      for (const r of next.keys()) { if (next.has(r.parent)) continue; if (sideOf(r) !== side) continue; const ch = chainFrom(r, next); if (!best || ch.length > best.length) best = ch; }
      return best;
    };
    let arms = 0, legs = 0;
    for (const s of [-1, 1]) {
      const armSide = j => Math.sign(P.get(armNext.get(j)).x - cx), arm = bestChain(armNext, s, armSide);
      if (arm && arm.length >= 3) {
        const u = (arm.length >= 4 && P.get(arm[1]).distanceTo(P.get(arm[0])) < .085 * H) ? 1 : 0; // skip a short clavicle
        aim(arm[u], arm[u + 1], V3(s * .22, -.62, .6));
        if (arm[u + 2]) aim(arm[u + 1], arm[u + 2], V3(s * .07, -.22, .95));
        arms++;
      }
      const legSide = j => Math.sign(P.get(j).x - cx), leg = bestChain(legNext, s, legSide);
      if (leg && leg.length >= 3) { aim(leg[0], leg[1], V3(s * .06, -.04, 1)); aim(leg[1], leg[2], V3(0, -1, .12)); legs++; }
    }
    return { arms, legs, bones: J.length };
  }
  // pelvis: a joint near the middle of the body, on the centre line, that owns the most of the skeleton
  function hipsOf(holder) {
    const J = jointsOf(holder), named = J.find(b => /hips|pelvis/i.test(b.name)); if (named) return named;
    upd(holder);
    const box = new THREE.Box3().setFromObject(holder), H = box.max.y - box.min.y, y0 = box.min.y, cx = (box.min.x + box.max.x) / 2;
    let best = null, bn = -1;
    for (const j of J) { const p = wp(j); if (p.y < y0 + .38 * H || p.y > y0 + .64 * H || Math.abs(p.x - cx) > .05 * H) continue; const n = countDesc(j); if (n > bn) { bn = n; best = j; } }
    return best || J[0];
  }
  // Which way is he facing? Arms stretch sideways in a T-pose; feet point forward. Returns degrees to rotate about Y so he faces +Z.
  function detectYaw(holder) {
    upd(holder);
    const box = new THREE.Box3().setFromObject(holder), H = box.max.y - box.min.y, y0 = box.min.y;
    const pts = [];
    holder.traverse(m => { if (!m.isMesh || !m.geometry.attributes.position) return; const a = m.geometry.attributes.position, step = Math.max(1, Math.floor(a.count / 4000)); const v = V3();
      for (let i = 0; i < a.count; i += step) { v.fromBufferAttribute(a, i); if (m.isSkinnedMesh && m.skeleton && m.geometry.attributes.skinIndex) m.applyBoneTransform(i, v); v.applyMatrix4(m.matrixWorld); pts.push(v.x, v.y, v.z); } });
    const J = jointsOf(holder).map(wp).filter(p => p.y > y0 + .5 * H);
    const rng = k => J.length ? Math.max(...J.map(p => p[k])) - Math.min(...J.map(p => p[k])) : 0;
    const sx = rng('x') || (box.max.x - box.min.x), sz = rng('z') || (box.max.z - box.min.z);
    const cands = sz > 1.25 * sx ? [90, -90] : [0, 180];
    const score = deg => { const t = THREE.MathUtils.degToRad(deg), s = Math.sin(t), c = Math.cos(t); let fz = 0, fn = 0, az = 0, an = 0;
      for (let i = 0; i < pts.length; i += 3) { const y = pts[i + 1] - y0, zz = -pts[i] * s + pts[i + 2] * c;
        if (y < .06 * H) { fz += zz; fn++; } else if (y > .09 * H && y < .2 * H) { az += zz; an++; } }
      return fn && an ? (fz / fn - az / an) / H : 0; };
    const a = score(cands[0]), b = score(cands[1]);
    const best = a >= b ? cands[0] : cands[1], conf = Math.abs(a - b);
    return { yaw: conf > .012 || cands[0] === 90 ? best : 0, conf, lateralAxis: sz > 1.25 * sx ? 'z' : 'x' };
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
    if (yaw === undefined) { try { const d = detectYaw(holder); yaw = d.yaw; how = `auto (arms along ${d.lateralAxis}, confidence ${d.conf.toFixed(3)})`; } catch (e) { yaw = 0; how = 'auto failed'; } }
    obj.rotation.y = THREE.MathUtils.degToRad(yaw); upd(holder);
    let box = new THREE.Box3().setFromObject(holder), h = box.getSize(V3()).y || 1;
    const h0 = h; obj.scale.multiplyScalar((o.height || 3.4) / h); upd(holder);
    let info = { arms: 0, legs: 0, why: 'pose disabled' };
    if (o.pose !== false) { try { info = poseDriver(holder); } catch (e) { info = { arms: 0, legs: 0, why: String(e) }; } }
    upd(holder); box = new THREE.Box3().setFromObject(holder);
    const posed = info.arms + info.legs > 0;
    console.info(`[KZ-Karting] "${o.id}": measured height ${h0.toFixed(4)} -> final ${(box.max.y - box.min.y).toFixed(2)}`);
    console.info(`[KZ-Karting] "${o.id}": yaw ${yaw}° ${how}; posed ${info.arms} arm(s), ${info.legs} leg(s)${info.why ? ' - ' + info.why : ''}`);
    if (o.pose !== false && !posed) {
      const names = []; holder.traverse(n => { if (n.isBone) names.push(n.name); });
      console.warn(`[KZ-Karting] "${o.id}" could not be posed (${info.why || 'no limbs recognised'}). ${names.length ? 'Bones: ' + names.slice(0, 60).join(', ') : 'It has no skeleton (static mesh) - export it WITH its armature, or set "pose": false.'}`);
    }
    if (posed) { const hp = wp(hipsOf(holder)); obj.position.set(-hp.x, .25 - hp.y, -.15 - hp.z); }
    else { const c = box.getCenter(V3()); obj.position.set(-c.x, -box.min.y, -c.z); }
    return holder;
  }
  const jobs = [];
  for (const [id, v] of list(manifest.karts)) { const o = cfg(v); jobs.push(load(o.url).then(m => { if (m) { tame(m); MODELS.karts[id] = fit(m, 'z', o.length || getKart(id).l + .8); } })); }
  for (const [id, v] of list(manifest.chars)) { const o = cfg(v); jobs.push(load(o.url).then(m => { if (m) { try { MODELS.chars[id] = fitChar(m, { ...o, id }); } catch (e) { console.warn('Character failed to set up:', id, e); } } })); }
  for (const [theme, urls] of list(manifest.props)) for (const u of urls) { const o = cfg(u); jobs.push(load(o.url).then(m => { if (m) { tame(m); (MODELS.props[theme] ||= []).push(fit(m, 'y', o.height || 12)); } })); }
  await Promise.all(jobs); return true;
}
