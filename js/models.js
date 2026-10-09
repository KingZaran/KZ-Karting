// Optional .glb model support. Drop Blender-exported .glb files in /models and list them in models/manifest.json.
// Anything not listed keeps using the built-in procedural model, so the game always works.
//
// manifest entries can be a plain path or an object:
//   "chars": { "mario": "models/chars/mario.glb" }
//   "chars": { "mario": { "url": "models/chars/mario.glb", "height": 3, "yaw": 180, "pose": true } }
//     height : standing height in kart units (default 3.4)       yaw  : degrees to turn him so he faces forward (default 0)
//     pose   : auto-bend arms/legs into a driving pose for skinned rigs (default true)
import { getKart } from './roster.js';
export const MODELS = { karts: {}, chars: {}, props: {} };

// Skinned meshes MUST be cloned with SkeletonUtils, otherwise the copy stays bound to the original (un-placed) skeleton:
// it appears at the world origin, un-scaled and still in T-pose. That is what made imported characters float mid-kart / vanish.
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
  const load = url => new Promise(res => loader.load(url, g => res(g.scene), undefined, () => { console.warn('Model failed to load:', url); res(null); }));
  const cfg = v => typeof v === 'string' ? { url: v } : v;
  const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

  // Blender/glTF materials are often fully metallic, which renders black without an environment map. Make them game-friendly.
  const tame = obj => obj.traverse(o => { if (!o.isMesh) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.metalness > .4) m.metalness = .4; if (m.roughness < .45) m.roughness = .45; m.envMapIntensity = 0; }); });

  // ---- pose helpers (work in world space so they don't depend on a rig's local bone axes)
  const bonesOf = obj => { const b = []; obj.traverse(o => { if (o.isBone) b.push(o); }); return b; };
  const wq = o => o.getWorldQuaternion(new THREE.Quaternion()), wp = o => o.getWorldPosition(V3());
  function aim(bone, targetDir) {
    const child = bone.children.find(c => c.isBone); if (!child) return;
    bone.updateWorldMatrix(true, true);
    const cur = wp(child).sub(wp(bone)).normalize(); if (cur.lengthSq() < .5) return;
    const rot = new THREE.Quaternion().setFromUnitVectors(cur, targetDir.clone().normalize());
    const parentQ = bone.parent ? wq(bone.parent) : new THREE.Quaternion();
    bone.quaternion.copy(parentQ.invert().multiply(rot).multiply(wq(bone))); bone.updateWorldMatrix(true, true);
  }
  function poseDriver(obj) {
    const bones = bonesOf(obj); if (!bones.length) return false;
    obj.updateWorldMatrix(true, true);
    const nm = b => b.name || '', mid = bones.reduce((s, b) => s + wp(b).x, 0) / bones.length;
    const arms = bones.filter(b => /arm/i.test(nm(b)) && !/fore|lower|twist|hand|finger|armature|root|pivot|helper/i.test(nm(b)) && !(b.parent && /arm/i.test(nm(b.parent)) && !/armature/i.test(nm(b.parent))));
    const thighs = bones.filter(b => /thigh|up.?leg|upper.?leg/i.test(nm(b)) && !/twist|helper/i.test(nm(b)));
    let done = 0;
    for (const a of arms) { const s = wp(a).x >= mid ? 1 : -1; aim(a, V3(s * .22, -.5, .85));
      const fore = a.children.find(c => c.isBone); if (fore) aim(fore, V3(s * .06, -.12, 1)); done++; }
    for (const t of thighs) { const s = wp(t).x >= mid ? 1 : -1; aim(t, V3(s * .05, -.06, 1));
      const shin = t.children.find(c => c.isBone); if (shin) aim(shin, V3(0, -1, .12)); done++; }
    return done > 0;
  }
  const hipsOf = obj => bonesOf(obj).find(b => /hips|pelvis/i.test(b.name)) || bonesOf(obj)[0];

  // kart/props: scale so length (z) or height (y) matches `size`, centre on x/z, sit on y = 0
  const fit = (obj, axis, size) => {
    const box = new THREE.Box3().setFromObject(obj), sz = box.getSize(V3());
    obj.scale.multiplyScalar(size / ((axis === 'z' ? sz.z : sz.y) || 1)); box.setFromObject(obj); const c = box.getCenter(V3());
    obj.position.set(-c.x, -box.min.y, -c.z); const w = new THREE.Group(); w.add(obj); return w;
  };
  // characters: fit standing height, bend into a driving pose, then plant the hips on the seat (origin = seat centre)
  function fitChar(obj, o) {
    tame(obj);
    const holder = new THREE.Group(); holder.add(obj); obj.rotation.y = THREE.MathUtils.degToRad(o.yaw || 0); holder.updateWorldMatrix(true, true);
    let box = new THREE.Box3().setFromObject(holder), h = box.getSize(V3()).y || 1;
    obj.scale.multiplyScalar((o.height || 3.4) / h); holder.updateWorldMatrix(true, true);
    const posed = o.pose !== false && poseDriver(holder);
    holder.updateWorldMatrix(true, true); box = new THREE.Box3().setFromObject(holder);
    const c = box.getCenter(V3());
    if (posed) { const hp = wp(hipsOf(holder)); obj.position.set(-hp.x, .25 - hp.y, -.15 - hp.z); }
    else obj.position.set(-c.x, -box.min.y, -c.z);
    return holder;
  }
  const jobs = [];
  for (const [id, v] of list(manifest.karts)) { const o = cfg(v); jobs.push(load(o.url).then(m => { if (m) { tame(m); MODELS.karts[id] = fit(m, 'z', o.length || getKart(id).l + .8); } })); }
  for (const [id, v] of list(manifest.chars)) { const o = cfg(v); jobs.push(load(o.url).then(m => { if (m) MODELS.chars[id] = fitChar(m, o); })); }
  for (const [theme, urls] of list(manifest.props)) for (const u of urls) { const o = cfg(u); jobs.push(load(o.url).then(m => { if (m) { tame(m); (MODELS.props[theme] ||= []).push(fit(m, 'y', o.height || 12)); } })); }
  await Promise.all(jobs); return true;
}
