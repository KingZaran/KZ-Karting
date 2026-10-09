// Small rotating 3D preview for the Garage panel.
import { buildKart } from './karts3d.js';
import { makeEnv } from './scenery.js';
export function createGarage(THREE, canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; const env = makeEnv(THREE, renderer);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(36, 1, .1, 100); camera.position.set(5.6, 3.4, 6.6); camera.lookAt(0, 1.1, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x445577, 1.1)); const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 8, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x6fa8ff, 1); rim.position.set(-5, 3, -4); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.8, .2, 40), new THREE.MeshStandardMaterial({ color: 0x1b2340, metalness: .4, roughness: .5 })); floor.position.y = -.1; scene.add(floor);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.6, .06, 8, 60), new THREE.MeshBasicMaterial({ color: 0xffd400 })); ring.rotation.x = Math.PI / 2; scene.add(ring);
  let model = null, w = 0, h = 0;
  return {
    set(lo, paint) { if (model) scene.remove(model); model = buildKart(THREE, lo, paint, env); scene.add(model); },
    render(dt, visible) {
      if (!visible || !model || !canvas.clientWidth) return;
      if (canvas.clientWidth !== w || canvas.clientHeight !== h) { w = canvas.clientWidth; h = canvas.clientHeight; renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
      model.rotation.y += dt * .9; renderer.render(scene, camera);
    },
  };
}
