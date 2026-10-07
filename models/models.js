// Optional .glb model support. Drop Blender-exported .glb files in /models and list them in models/manifest.json.
// Anything not listed keeps using the built-in procedural model, so the game always works.
import { getKart } from './roster.js';
export const MODELS = { karts: {}, chars: {}, props: {} };
export async function preloadModels(THREE) {
  let manifest;
  try { const r = await fetch('models/manifest.json', { cache: 'no-cache' }); if (!r.ok) return false; manifest = await r.json(); } catch (e) { return false; }
  const wanted = Object.keys(manifest.karts || {}).length + Object.keys(manifest.chars || {}).length + Object.values(manifest.props || {}).flat().length;
  if (!wanted) return false;
  let GLTFLoader; try { ({ GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')); } catch (e) { console.warn('GLTFLoader unavailable', e); return false; }
  const loader = new GLTFLoader();
  const load = url => new Promise(res => loader.load(url, g => res(g.scene), undefined, () => { console.warn('Model failed to load:', url); res(null); }));
  // scale so the model's length (z) or height (y) matches `size`, centre it on x/z and sit it on y = 0
  const fit = (obj, axis, size) => {
    const box = new THREE.Box3().setFromObject(obj), sz = box.getSize(new THREE.Vector3());
    obj.scale.multiplyScalar(size / (axis === 'z' ? sz.z : sz.y)); box.setFromObject(obj); const c = box.getCenter(new THREE.Vector3());
    obj.position.set(-c.x, -box.min.y, -c.z); const w = new THREE.Group(); w.add(obj); return w;
  };
  const jobs = [];
  for (const [id, url] of Object.entries(manifest.karts || {})) jobs.push(load(url).then(o => { if (o) MODELS.karts[id] = fit(o, 'z', getKart(id).l + .8); }));
  for (const [id, url] of Object.entries(manifest.chars || {})) jobs.push(load(url).then(o => { if (o) MODELS.chars[id] = fit(o, 'y', 2.4); }));
  for (const [theme, urls] of Object.entries(manifest.props || {})) for (const url of urls) jobs.push(load(url).then(o => { if (o) (MODELS.props[theme] ||= []).push(fit(o, 'y', 12)); }));
  await Promise.all(jobs); return true;
}
