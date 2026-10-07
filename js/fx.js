// Pooled GPU-ish particle systems (smoke = normal blend, glow = additive).
export function createFx(THREE, scene, cap = 800) {
  const uniforms = { uScale: { value: 500 } };
  const vs = 'attribute float size; attribute vec4 pcolor; varying vec4 vC; uniform float uScale; void main(){ vC=pcolor; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=size*uScale/max(1.,-mv.z); gl_Position=projectionMatrix*mv; }';
  const fs = 'varying vec4 vC; void main(){ float a=smoothstep(.5,.15,length(gl_PointCoord-.5)); gl_FragColor=vec4(vC.rgb,vC.a*a); }';
  const tmp = new THREE.Color();
  function system(additive) {
    const pos = new Float32Array(cap * 3), col = new Float32Array(cap * 4), size = new Float32Array(cap), vel = new Float32Array(cap * 3);
    const life = new Float32Array(cap), max = new Float32Array(cap), s0 = new Float32Array(cap), s1 = new Float32Array(cap), c0 = new Float32Array(cap * 4), c1 = new Float32Array(cap * 4);
    const g = new THREE.BufferGeometry(); const pa = new THREE.BufferAttribute(pos, 3), ca = new THREE.BufferAttribute(col, 4), sa = new THREE.BufferAttribute(size, 1);
    g.setAttribute('position', pa); g.setAttribute('pcolor', ca); g.setAttribute('size', sa);
    const pts = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending }));
    pts.frustumCulled = false; scene.add(pts); let head = 0;
    return {
      emit(x, y, z, vx, vy, vz, l, a0, a1, h0, al0, h1, al1) {
        const i = head; head = (head + 1) % cap; pos.set([x, y, z], i * 3); vel.set([vx, vy, vz], i * 3); life[i] = max[i] = l; s0[i] = a0; s1[i] = a1;
        tmp.set(h0); c0.set([tmp.r, tmp.g, tmp.b, al0], i * 4); tmp.set(h1); c1.set([tmp.r, tmp.g, tmp.b, al1], i * 4);
      },
      update(dt) {
        for (let i = 0; i < cap; i++) {
          if (life[i] <= 0) continue; life[i] -= dt;
          if (life[i] <= 0) { size[i] = 0; col[i * 4 + 3] = 0; continue; }
          const t = 1 - life[i] / max[i], d = Math.pow(.25, dt);
          vel[i*3] *= d; vel[i*3+1] *= d; vel[i*3+2] *= d;
          pos[i*3] += vel[i*3] * dt; pos[i*3+1] += vel[i*3+1] * dt; pos[i*3+2] += vel[i*3+2] * dt;
          size[i] = s0[i] + (s1[i] - s0[i]) * t;
          for (let c = 0; c < 4; c++) col[i*4+c] = c0[i*4+c] + (c1[i*4+c] - c0[i*4+c]) * t;
        }
        pa.needsUpdate = ca.needsUpdate = sa.needsUpdate = true;
      },
    };
  }
  const smoke = system(false), glow = system(true);
  return { smoke, glow, update(dt) { smoke.update(dt); glow.update(dt); }, setScale(v) { uniforms.uScale.value = v; } };
}
