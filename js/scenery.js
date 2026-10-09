// Procedural scenery toolkit: road/kerb/wall textures, sky dome, mountains, gantry, lamps, item boxes, reflections, geometry baking.
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Reflection environment for karts (own copy per WebGL context: the garage has its own renderer).
export function makeEnv(THREE, renderer) {
  const s = new THREE.Scene(), geo = new THREE.SphereGeometry(50, 32, 16), p = geo.attributes.position, cols = [];
  const top = new THREE.Color(.28, .48, .9), hor = new THREE.Color(1, 1, 1), gnd = new THREE.Color(.22, .24, .2), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) { const y = p.getY(i) / 50; if (y >= 0) c.copy(hor).lerp(top, Math.pow(y, .6)); else c.copy(hor).lerp(gnd, Math.pow(-y, .5)); cols.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  s.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
  const panel = (x, y, z, w, h, r, g, b) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); };
  panel(25, 38, 15, 30, 22, 7, 6.6, 6); panel(-35, 12, -20, 8, 30, 1.6, 2, 3); panel(0, 4, -40, 40, 5, 1.2, 1.2, 1.3);
  const pm = new THREE.PMREMGenerator(renderer), rt = pm.fromScene(s, .03); pm.dispose(); return rt.texture;
}

export function createScenery(THREE, renderer) {
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const hex = c => '#' + (c >>> 0).toString(16).padStart(6, '0');
  const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
  const tex = (cv, rx = false, ry = true) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; t.wrapS = rx ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping; t.wrapT = ry ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping; return t; };
  const R = (a, b) => a + Math.random() * (b - a);
  const grain = (g, W, H, n, a, size = 1.6, light = true) => { for (let i = 0; i < n; i++) { const v = Math.random() < .5 ? 0 : 255; g.fillStyle = `rgba(${v},${v},${v},${Math.random() * a})`; g.fillRect(Math.random() * W, Math.random() * H, size * Math.random() + .6, size * Math.random() + .6); } };
  const crack = (g, W, H, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); let x = Math.random() * W, y = Math.random() * H; g.moveTo(x, y); for (let i = 0; i < 6; i++) { x += R(-40, 40); y += R(-40, 40); g.lineTo(x, y); } g.stroke(); };

  // ---------- road ----------
  const roadCache = {};
  function roadMaterial(id, th) {
    if (roadCache[id]) return roadCache[id];
    const W = 512, H = 512, [c, g] = cvs(W, H), style = th.roadStyle || 'asphalt', line = th.line || '#ffffff', line2 = th.line2 || line;
    g.fillStyle = hex(th.road); g.fillRect(0, 0, W, H);
    const edge = (col, w = 9, glow = 0) => { g.save(); g.strokeStyle = col; g.lineWidth = w; if (glow) { g.shadowColor = col; g.shadowBlur = glow; } for (const x of [W * .04, W * .96]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } g.restore(); };
    const dash = (col, w = 7, glow = 0) => { g.save(); g.strokeStyle = col; g.lineWidth = w; if (glow) { g.shadowColor = col; g.shadowBlur = glow; } g.beginPath(); g.moveTo(W / 2, 20); g.lineTo(W / 2, H * .5 - 10); g.stroke(); g.restore(); };
    const wear = () => { for (const x of [.3, .7]) { const gr = g.createLinearGradient((x - .12) * W, 0, (x + .12) * W, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.5, 'rgba(0,0,0,.16)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect((x - .12) * W, 0, .24 * W, H); } };
    let rough = .88, glow = 0;
    switch (style) {
      case 'carpet': grain(g, W, H, 26000, .13, 2); g.strokeStyle = 'rgba(0,0,0,.07)'; g.lineWidth = 1; for (let i = 0; i < W; i += 6) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, H); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(W, i); g.stroke(); } for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(60,40,0,.06)'; g.beginPath(); g.ellipse(Math.random() * W, Math.random() * H, R(20, 60), R(15, 40), 0, 0, 6.3); g.fill(); } rough = 1; break;
      case 'stone': for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const l = R(-12, 12); g.fillStyle = `rgba(${l > 0 ? 255 : 0},${l > 0 ? 255 : 0},${l > 0 ? 255 : 0},${Math.abs(l) / 120})`; g.fillRect(i * 128, j * 128, 128, 128); } g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 5; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 128, 0); g.lineTo(i * 128, H); g.stroke(); g.beginPath(); g.moveTo(0, i * 128); g.lineTo(W, i * 128); g.stroke(); } grain(g, W, H, 16000, .2); for (let i = 0; i < 5; i++) crack(g, W, H, 'rgba(0,0,0,.4)', 2); edge(line, 6, 14); glow = .25; break;
      case 'tiles': { const s = 64; for (let i = 0; i < W / s; i++) for (let j = 0; j < H / s; j++) { g.fillStyle = (i + j) % 2 ? 'rgba(0,0,0,.22)' : 'rgba(255,255,255,.05)'; g.fillRect(i * s, j * s, s, s); } g.strokeStyle = 'rgba(212,175,55,.65)'; g.lineWidth = 3; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const x = i * 128 + 64, y = j * 128 + 64; g.beginPath(); g.moveTo(x, y - 40); g.lineTo(x + 40, y); g.lineTo(x, y + 40); g.lineTo(x - 40, y); g.closePath(); g.stroke(); } grain(g, W, H, 9000, .12); edge(line, 10); rough = .5; break; }
      case 'ice': { const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(120,180,255,.12)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); grain(g, W, H, 9000, .14); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5; for (let i = 0; i < 40; i++) { const x = Math.random() * W, y = Math.random() * H, a = R(-.6, .6) + 1.57; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * R(20, 90), y + Math.sin(a) * R(20, 90)); g.stroke(); } edge(line, 8); rough = .3; break; }
      case 'lava': grain(g, W, H, 14000, .2); for (let i = 0; i < 10; i++) { g.save(); g.shadowColor = '#ff6a00'; g.shadowBlur = 14; crack(g, W, H, '#ff7a1a', 3); g.restore(); } edge(line, 7, 12); glow = .5; break;
      case 'candy': { grain(g, W, H, 6000, .08); const cols = ['#fff', '#7ae0ff', '#ffe14f', '#ff4fa0', '#9fff7a']; for (let i = 0; i < 200; i++) { g.save(); g.translate(Math.random() * W, Math.random() * H); g.rotate(Math.random() * 6.3); g.fillStyle = cols[i % 5]; g.fillRect(-6, -2, 12, 4); g.restore(); } edge(line, 12); dash(line2, 9); rough = .45; break; }
      case 'neon': { g.strokeStyle = 'rgba(0,255,225,.08)'; g.lineWidth = 2; for (let i = 0; i <= W; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, H); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(W, i); g.stroke(); } grain(g, W, H, 7000, .1); edge(line, 8, 20); dash(line2, 8, 18); rough = .35; glow = .35; break; }
      case 'metal': { grain(g, W, H, 9000, .12); g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 4; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(0, i * 128); g.lineTo(W, i * 128); g.stroke(); } g.beginPath(); g.moveTo(W / 2, 0); g.lineTo(W / 2, H); g.stroke(); g.fillStyle = 'rgba(255,255,255,.25)'; for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) { g.beginPath(); g.arc(i * 128 + 14 + (i % 2) * 100, j * 64 + 12, 3, 0, 6.3); g.fill(); } g.save(); g.beginPath(); g.rect(0, 0, 26, H); g.rect(W - 26, 0, 26, H); g.clip(); g.fillStyle = line; g.fillRect(0, 0, W, H); g.fillStyle = '#111'; for (let y = -64; y < H + 64; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y - 40); g.lineTo(W, y - 8); g.lineTo(0, y + 32); g.fill(); } g.restore(); rough = .45; break; }
      case 'ink': { grain(g, W, H, 12000, .15); wear(); const ic = ['#ff2d95', '#2dff95', '#7a2dff', '#ffd400', '#00c8ff']; for (let i = 0; i < 14; i++) { g.fillStyle = ic[i % 5] + '30'; g.beginPath(); g.ellipse(Math.random() * W, Math.random() * H, R(14, 50), R(10, 36), Math.random() * 3, 0, 6.3); g.fill(); } edge(line, 9); dash(line2, 7); rough = .6; break; }
      default: grain(g, W, H, 15000, .17); wear(); for (let i = 0; i < 4; i++) crack(g, W, H, 'rgba(0,0,0,.3)', 1.5); edge(line, 9); dash(line2, 7);
    }
    const t = tex(c); const m = new THREE.MeshStandardMaterial({ map: t, roughness: rough, metalness: style === 'metal' ? .25 : 0, side: THREE.DoubleSide });
    if (glow) { m.emissive = new THREE.Color(0xffffff); m.emissiveMap = t; m.emissiveIntensity = glow; }
    return roadCache[id] = m;
  }
  const kerbCache = {};
  function kerbMaterial(th) {
    const [c1, c2] = th.kerb || ['#e53935', '#ffffff'], key = c1 + c2 + (th.kerbGlow ? 'g' : ''); if (kerbCache[key]) return kerbCache[key];
    const [c, g] = cvs(16, 64); g.fillStyle = c1; g.fillRect(0, 0, 16, 32); g.fillStyle = c2; g.fillRect(0, 32, 16, 32); grain(g, 16, 64, 120, .12, 1);
    const t = tex(c), m = th.kerbGlow ? new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide }) : new THREE.MeshStandardMaterial({ map: t, roughness: .6, side: THREE.DoubleSide }); return kerbCache[key] = m;
  }
  let wallM = null, ceilM = null;
  function wallMaterial(th) {
    if (wallM) return wallM; const [c, g] = cvs(256, 256);
    g.fillStyle = hex(th.wallColor); g.fillRect(0, 0, 256, 256); g.fillStyle = 'rgba(120,90,0,.14)'; for (let x = 0; x < 256; x += 32) g.fillRect(x, 0, 16, 256);
    g.strokeStyle = 'rgba(100,70,0,.22)'; g.lineWidth = 3; for (let x = 8; x < 256; x += 32) { for (let y = 12; y < 230; y += 36) { g.beginPath(); g.arc(x + 8, y, 3.5, 0, 6.3); g.stroke(); } }
    for (let i = 0; i < 7; i++) { const gr = g.createLinearGradient(0, 0, 0, 90); const x = Math.random() * 256; g.fillStyle = 'rgba(80,55,0,.07)'; g.fillRect(x, 0, R(6, 22), R(40, 150)); }
    grain(g, 256, 256, 3500, .1); g.fillStyle = '#5a4520'; g.fillRect(0, 222, 256, 34); g.fillStyle = '#7a6230'; g.fillRect(0, 222, 256, 4);
    wallM = new THREE.MeshStandardMaterial({ map: tex(c, true, false), roughness: .95, side: THREE.DoubleSide }); wallM.map.wrapT = THREE.RepeatWrapping; return wallM;
  }
  function ceilMaterial(th) {
    if (ceilM) return ceilM; const [c, g] = cvs(256, 256), [e, ge] = cvs(256, 256);
    g.fillStyle = '#d8d0a0'; g.fillRect(0, 0, 256, 256); grain(g, 256, 256, 4000, .14, 1.2); g.strokeStyle = 'rgba(70,60,20,.55)'; g.lineWidth = 3; for (let i = 0; i <= 256; i += 128) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
    ge.fillStyle = '#000'; ge.fillRect(0, 0, 256, 256); g.fillStyle = '#fffbe0'; g.fillRect(34, 56, 60, 16); ge.fillStyle = '#fff7c8'; ge.fillRect(34, 56, 60, 16);
    const et = tex(e, true, true); ceilM = new THREE.MeshStandardMaterial({ map: tex(c, true, true), roughness: 1, emissive: new THREE.Color(0xffffff), emissiveMap: et, emissiveIntensity: 1.5, side: THREE.DoubleSide }); return ceilM;
  }

  // ---------- ground detail texture (multiplied over the painted floor) ----------
  const detailTex = (() => { const [c, g] = cvs(256, 256); g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 9000; i++) { const v = Math.random() * 255; g.fillStyle = `rgba(${v},${v},${v},.35)`; g.fillRect(Math.random() * 256, Math.random() * 256, R(1, 4), R(1, 4)); } const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso; return t; })();

  // ---------- sky dome ----------
  const skyMat = new THREE.ShaderMaterial({
    uniforms: { uTop: { value: new THREE.Color(.2, .4, .8) }, uHor: { value: new THREE.Color(.7, .85, 1) }, uSun: { value: new THREE.Vector3(.4, .7, .3).normalize() }, uSunCol: { value: new THREE.Color(1, .9, .7) }, uCloud: { value: 1 }, uStars: { value: 0 }, uTime: { value: 0 } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.); gl_Position = p.xyww; }',
    fragmentShader: `uniform vec3 uTop, uHor, uSun, uSunCol; uniform float uCloud, uStars, uTime; varying vec3 vDir;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float v = 0., a = .5; for(int i=0;i<5;i++){ v += a*noise(p); p *= 2.03; a *= .5; } return v; }
      void main(){
        vec3 d = normalize(vDir); float h = clamp(d.y, 0., 1.);
        vec3 col = mix(uHor, uTop, pow(h, .5));
        float sd = max(dot(d, uSun), 0.);
        col += uSunCol * (pow(sd, 900.) * 8. + pow(sd, 28.) * .4 + pow(sd, 5.) * .14);
        if (uCloud > .001 && d.y > 0.) {
          vec2 p = d.xz / (d.y + .14) * .9 + vec2(uTime * .012, uTime * .005);
          float n = fbm(p * 1.5), m = smoothstep(.5, .8, n) * uCloud * smoothstep(0., .2, d.y);
          vec3 cc = mix(vec3(.78,.82,.92), vec3(1.), smoothstep(.5, .95, n)) * (.92 + .3 * pow(sd, 3.));
          col = mix(col, cc, m * .92);
        }
        if (uStars > .001) { vec3 q = floor(d * 240.); float s = step(.9965, hash(q.xy + q.z * 1.7)); col += vec3(s) * uStars * smoothstep(.04, .3, d.y); }
        gl_FragColor = vec4(col, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), skyMat); sky.frustumCulled = false; sky.renderOrder = -10;
  const _a = new THREE.Color(), _b = new THREE.Color(), cur = { cloud: 1, stars: 0, sunCol: new THREE.Color(1, .9, .7) };
  function setSky(th, k, env) {
    const night = th.hemi < .5, hor = _a.copy(env.sky), zen = _b.copy(env.sky).multiplyScalar(night ? .45 : .62).lerp(new THREE.Color(night ? .02 : .12, night ? .03 : .3, night ? .12 : .75), night ? .2 : .42);
    if (th.zenith !== undefined) zen.set(th.zenith);
    skyMat.uniforms.uHor.value.copy(hor); skyMat.uniforms.uTop.value.copy(zen);
    cur.cloud += ((th.clouds || 0) - cur.cloud) * k; cur.stars += ((th.stars || 0) - cur.stars) * k; skyMat.uniforms.uCloud.value = cur.cloud; skyMat.uniforms.uStars.value = cur.stars;
    cur.sunCol.lerp(_a.set(th.sunCol !== undefined ? th.sunCol : night ? 0x303860 : 0xfff0c8), k); skyMat.uniforms.uSunCol.value.copy(cur.sunCol);
  }
  const follow = (cam, t) => { sky.position.copy(cam.position); skyMat.uniforms.uTime.value = t; };

  // ---------- mountains ----------
  function mountains(color, top, radius, count = 160, h0 = 60, h1 = 140, rounded = false) {
    const pos = [], col = [], idx = [], c0 = new THREE.Color(color), c1 = new THREE.Color(top || color), c = new THREE.Color();
    const ph = [R(0, 6), R(0, 6), R(0, 6)];
    for (let i = 0; i <= count; i++) {
      const a = i / count * Math.PI * 2, n = .5 + .5 * (Math.sin(a * 3 + ph[0]) * .5 + Math.sin(a * 7 + ph[1]) * .3 + Math.sin(a * 17 + ph[2]) * .2), h = h0 + (h1 - h0) * n * (rounded ? 1 : (.6 + .4 * Math.abs(Math.sin(a * 41 + i))));
      const r = radius * (1 + .08 * Math.sin(a * 5 + ph[1])), x = Math.cos(a) * r, z = Math.sin(a) * r;
      pos.push(x, -30, z, x * .92, h, z * .92); c.copy(c0).multiplyScalar(.75); col.push(c.r, c.g, c.b); c.copy(c0).lerp(c1, Math.max(0, (h - h0) / (h1 - h0 + 1)) * .9 + .1); col.push(c.r, c.g, c.b);
      if (i < count) { const q = i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, side: THREE.DoubleSide }));
  }

  // ---------- props ----------
  const std = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .6, metalness: .2, ...o });
  function gantry(width, accent) {
    const g = new THREE.Group(), pil = std(0x2a2d3a, { metalness: .5 }), W = width / 2 + 2.2;
    const [c, x] = cvs(1024, 192); const gr = x.createLinearGradient(0, 0, 0, 192); gr.addColorStop(0, '#171a2c'); gr.addColorStop(1, '#0a0b16'); x.fillStyle = gr; x.fillRect(0, 0, 1024, 192);
    for (let i = 0; i < 64; i++) for (let j = 0; j < 2; j++) { x.fillStyle = (i + j) % 2 ? '#fff' : '#111'; x.fillRect(i * 16, j * 12 + (j ? 168 : 0), 16, 12); }
    x.font = 'italic 900 110px Arial Black, Impact, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineWidth = 12; x.strokeStyle = '#1a0a00'; x.strokeText('KZ-KARTING', 512, 98); const fg = x.createLinearGradient(0, 40, 0, 150); fg.addColorStop(0, '#fff7a8'); fg.addColorStop(.5, '#ffc400'); fg.addColorStop(1, '#ff6a00'); x.fillStyle = fg; x.fillText('KZ-KARTING', 512, 98);
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(width + 4.4, 3.2), new THREE.MeshBasicMaterial({ map: tex(c, false, false), side: THREE.DoubleSide })); banner.position.y = 11; g.add(banner);
    for (const s of [-1, 1]) { const p = new THREE.Mesh(new RoundedBoxGeometry(1.2, 11.5, 1.2, 3, .3), pil); p.position.set(s * W, 5.75, 0); p.castShadow = true; g.add(p); const lamp = new THREE.Mesh(new THREE.SphereGeometry(.45, 12, 10), new THREE.MeshBasicMaterial({ color: accent })); lamp.position.set(s * W, 11.9, 0); g.add(lamp); }
    const beam = new THREE.Mesh(new RoundedBoxGeometry(width + 5, .5, .7, 3, .2), pil); beam.position.y = 12.8; g.add(beam); return g;
  }
  function finishLine(width) {
    const [c, x] = cvs(256, 32); for (let i = 0; i < 32; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#fff' : '#111'; x.fillRect(i * 8, j * 8, 8, 8); }
    const t = tex(c, false, false); const m = new THREE.Mesh(new THREE.PlaneGeometry(width, 3), new THREE.MeshStandardMaterial({ map: t, roughness: .8 })); m.rotation.x = -Math.PI / 2; return m;
  }
  function lamp(color, h = 11) {
    const g = new THREE.Group(), pole = std(0x20222c, { metalness: .6 }), em = new THREE.MeshBasicMaterial({ color });
    const p = new THREE.Mesh(new THREE.CylinderGeometry(.22, .32, h, 10), pole); p.position.y = h / 2; p.castShadow = true; g.add(p);
    const arm = new THREE.Mesh(new RoundedBoxGeometry(2.6, .25, .25, 2, .08), pole); arm.position.set(1.1, h, 0); g.add(arm);
    const head = new THREE.Mesh(new RoundedBoxGeometry(1.1, .3, .7, 3, .12), em); head.position.set(2.2, h - .25, 0); g.add(head); return g;
  }
  let boxMat = null;
  function itemBox() {
    if (!boxMat) {
      const [c, g] = cvs(128, 128); const gr = g.createLinearGradient(0, 0, 128, 128); gr.addColorStop(0, '#5ad1ff'); gr.addColorStop(.5, '#7a8bff'); gr.addColorStop(1, '#ff6ad5'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 8; g.strokeRect(6, 6, 116, 116); g.font = '900 96px Arial Black, Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 10; g.strokeStyle = '#1a1050'; g.strokeText('?', 64, 70); g.fillStyle = '#ffe14a'; g.fillText('?', 64, 70);
      const t = tex(c, false, false); boxMat = new THREE.MeshStandardMaterial({ map: t, emissive: new THREE.Color(0x4a7bff), emissiveIntensity: .55, emissiveMap: t, transparent: true, opacity: .88, roughness: .25 });
    }
    const m = new THREE.Mesh(new RoundedBoxGeometry(2.1, 2.1, 2.1, 4, .45), boxMat); m.castShadow = true; return m;
  }

  // ---------- merge static decor into a few draw calls ----------
  function bake(group) {
    group.updateWorldMatrix(true, true); const buckets = new Map();
    group.traverse(o => {
      if (!o.isMesh) return; const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
      for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a);
      if (!g.attributes.normal) g.computeVertexNormals(); if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      const key = o.material.uuid + (o.castShadow ? 'c' : 'n'); let b = buckets.get(key); if (!b) buckets.set(key, b = { m: o.material, c: o.castShadow, gs: [] }); b.gs.push(g);
    });
    const out = new THREE.Group();
    for (const b of buckets.values()) { const geo = mergeGeometries(b.gs, false); if (!geo) continue; const mesh = new THREE.Mesh(geo, b.m); mesh.castShadow = b.c; mesh.receiveShadow = true; out.add(mesh); b.gs.forEach(g => g.dispose()); }
    return out;
  }
  return { roadMaterial, kerbMaterial, wallMaterial, ceilMaterial, detailTex, sky, setSky, follow, mountains, gantry, finishLine, lamp, itemBox, bake };
}
