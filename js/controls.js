// Keyboard control remapping: bindings saved in localStorage, "Controls" button + overlay injected by this module.
const ACTIONS = [['up', 'Accelerate'], ['down', 'Brake / Reverse'], ['left', 'Steer left'], ['right', 'Steer right'], ['drift', 'Drift / Hop'], ['item', 'Use item'], ['restart', 'Restart race'], ['mute', 'Mute sound']];
const DEFAULTS = { up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'], drift: ['Space', 'ShiftLeft'], item: ['KeyE', 'Enter'], restart: ['KeyR', ''], mute: ['KeyM', ''] };
const KEY = 'kzkarting.controls.v1';
const nice = c => !c ? '—' : c.replace(/^Key/, '').replace(/^Digit/, '').replace('ArrowUp', '↑').replace('ArrowDown', '↓').replace('ArrowLeft', '←').replace('ArrowRight', '→').replace('ShiftLeft', 'Left Shift').replace('ShiftRight', 'Right Shift').replace('ControlLeft', 'Left Ctrl').replace('ControlRight', 'Right Ctrl').replace('AltLeft', 'Left Alt').replace('AltRight', 'Right Alt').replace('Space', 'Space').replace('Enter', 'Enter').replace('Numpad', 'Num ');
export function createControls() {
  let map = JSON.parse(JSON.stringify(DEFAULTS));
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) for (const a in DEFAULTS) if (Array.isArray(s[a])) map[a] = [s[a][0] || '', s[a][1] || '']; } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(map)); } catch (e) {} };
  const down = {};   // physical keys currently held
  addEventListener('keydown', e => { down[e.code] = true; }, true); addEventListener('keyup', e => { down[e.code] = false; }, true);
  addEventListener('blur', () => { for (const k in down) down[k] = false; });
  // ---- touch: on-screen steer pad / drift / brake while racing; tap the item circle to use it (swipe down to drop behind)
  const tv = { left: 0, right: 0, down: 0, drift: 0, up: 0 }, gv = { up: 0, left: 0, right: 0, down: 0, drift: 0 }; let touchMode = false;
  const racing = () => { const h = document.getElementById('hud'); return !!h && h.style.display === 'block'; };
  const held = a => map[a].some(c => c && down[c]) || !!tv[a] || !!gv[a] || (a === 'up' && touchMode && racing() && !tv.down), is = (a, code) => map[a].includes(code);
  const heldRaw = a => map[a].some(c => c && down[c]) || !!tv[a] || !!gv[a];   // without touch auto-accelerate (used for the countdown rocket start)

  // ---- UI ----
  const css = document.createElement('style');
  css.textContent = `#tctl{position:fixed;inset:0;z-index:55;display:none;pointer-events:none;touch-action:none;user-select:none;-webkit-user-select:none}
  #tctl.on{display:block}#tctl *{touch-action:none}
  #tpad{position:absolute;left:0;bottom:0;width:46%;height:62%;pointer-events:auto}
  #tring{position:absolute;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;border:4px solid #fff9;background:#ffffff18;display:none}
  #tknob{position:absolute;left:50%;top:50%;width:54px;height:54px;margin:-27px 0 0 -27px;border-radius:50%;background:#fffc}
  .tbtn{position:absolute;pointer-events:auto;border-radius:50%;border:4px solid #fff;background:#0007;color:#fff;font-weight:800;font-style:italic;font-size:17px;display:flex;align-items:center;justify-content:center;opacity:.8}
  .tbtn.on{background:#ffd400;color:#000;opacity:1}
  #tBoost{display:none;left:50%;bottom:34%;width:132px;height:132px;margin-left:-66px;font-size:16px;text-align:center;line-height:1.1;background:#e5393588}body.cd #tBoost{display:flex}#tDrift{right:30px;bottom:150px;width:104px;height:104px}#tBrake{right:150px;bottom:160px;width:80px;height:80px;font-size:14px}
  body.touch #it1{pointer-events:auto}
  
  #ctlBtn{display:none !important;position:fixed;left:50%;transform:translateX(-50%);bottom:14px;z-index:60;background:#3a4a7a;color:#fff;font-size:13px;padding:7px 12px;border-radius:10px;opacity:.85}
  #ctlBtn:hover{opacity:1}
  #ctlOv{position:fixed;inset:0;z-index:100;display:none;align-items:center;justify-content:center;background:rgba(5,8,20,.82)}
  #ctlOv.on{display:flex}
  #ctlBox{background:#151b34;border:2px solid #4a5a95;border-radius:18px;padding:22px 26px;width:min(520px,94vw);max-height:92vh;overflow:auto;color:#fff;font-family:inherit}
  #ctlBox h2{margin:0 0 4px;font-style:italic;letter-spacing:2px}
  #ctlBox .sub{opacity:.65;font-size:12px;margin-bottom:12px}
  #ctlBox .r{display:grid;grid-template-columns:1fr 120px 120px;gap:8px;align-items:center;margin:6px 0}
  #ctlBox .k{background:#2a3566;color:#fff;border:2px solid transparent;border-radius:8px;padding:8px 6px;font-size:13px;cursor:pointer;text-align:center}
  #ctlBox .k:hover{border-color:#8fa3ff}
  #ctlBox .k.wait{border-color:#ffd34a;color:#ffd34a;animation:ctlp .8s infinite alternate}
  @keyframes ctlp{to{background:#3b4a8a}}
  #ctlBox .tabs{display:flex;gap:6px;margin:8px 0 12px}
  #ctlBox .tab{flex:1;background:#232c55;color:#cfd6ff;border:2px solid transparent;border-radius:10px;padding:8px 4px;font-size:13px;cursor:pointer}
  #ctlBox .tab.on{background:#3a4a9a;border-color:#8fa3ff;color:#fff}
  #ctlBox .soon{opacity:.7;font-size:12px;margin:0 0 10px}
  #ctlBox .pad{display:grid;grid-template-columns:1fr auto;gap:6px 14px;font-size:14px}#ctlBox .pad b{color:#ffd34a;text-align:right}
  #ctlBox .f{display:flex;gap:10px;justify-content:space-between;margin-top:16px}`;
  document.head.appendChild(css);
  const tc = document.createElement('div'); tc.id = 'tctl';
  tc.innerHTML = '<div id="tpad"><div id="tring"><div id="tknob"></div></div></div><div class="tbtn" id="tDrift">DRIFT</div><div class="tbtn" id="tBrake">BRAKE</div><div class="tbtn" id="tBoost">HOLD<br>TO BOOST</div>';
  document.body.appendChild(tc);
  const setTouch = () => { if (touchMode) return; touchMode = true; document.body.classList.add('touch'); };
  if (matchMedia('(pointer: coarse)').matches) setTouch();
  addEventListener('pointerdown', e => { if (e.pointerType === 'touch') setTouch(); }, true);
  setInterval(() => tc.classList.toggle('on', touchMode && racing()), 250);
  const cdOn = v => document.body.classList.toggle('cd', !!v && touchMode);
  addEventListener('contextmenu', e => { if (touchMode) e.preventDefault(); });
  const pad = tc.querySelector('#tpad'), ring = tc.querySelector('#tring'), knob = tc.querySelector('#tknob'); let padId = null, px = 0;
  const steerTo = x => { const dx = x - px; tv.left = dx < -16 ? 1 : 0; tv.right = dx > 16 ? 1 : 0; knob.style.transform = `translateX(${Math.max(-45, Math.min(45, dx))}px)`; };
  pad.onpointerdown = e => { padId = e.pointerId; pad.setPointerCapture(padId); px = e.clientX; const r = pad.getBoundingClientRect(); ring.style.display = 'block'; ring.style.left = e.clientX - r.left + 'px'; ring.style.top = e.clientY - r.top + 'px'; steerTo(px); };
  pad.onpointermove = e => { if (e.pointerId === padId) steerTo(e.clientX); };
  const padEnd = e => { if (e.pointerId !== padId) return; padId = null; tv.left = tv.right = 0; ring.style.display = 'none'; knob.style.transform = ''; };
  pad.onpointerup = pad.onpointercancel = padEnd;
  for (const [id, a] of [['tDrift', 'drift'], ['tBrake', 'down'], ['tBoost', 'up']]) { const b = tc.querySelector('#' + id); b.onpointerdown = e => { b.setPointerCapture(e.pointerId); tv[a] = 1; b.classList.add('on'); }; b.onpointerup = b.onpointercancel = () => { tv[a] = 0; b.classList.remove('on'); }; }
  let itY = 0, itCode = '';
  addEventListener('pointerdown', e => { if (e.pointerType !== 'touch' || !racing()) return; const t = e.target.closest && e.target.closest('#it1'); if (!t) return; itY = e.clientY; itCode = map.item[0] || map.item[1]; if (itCode) dispatchEvent(new KeyboardEvent('keydown', { code: itCode })); }, true);
  addEventListener('pointerup', e => { if (!itCode) return; if (e.clientY - itY > 35) tv.down = 1; dispatchEvent(new KeyboardEvent('keyup', { code: itCode })); tv.down = 0; itCode = ''; }, true);
  // ---- controller (standard layout): racing uses the held flags; menus get synthetic key presses so every screen works unchanged
  const fire = (type, code) => dispatchEvent(new KeyboardEvent(type, { code, key: code, bubbles: true }));
  const prev = {}, rep = {}; let padOn = false;
  addEventListener('gamepadconnected', () => { padOn = true; });
  const pulse = (id, on, code, now) => {   // menu key with auto-repeat while held
    if (!on) { prev[id] = 0; return; }
    if (!prev[id]) { prev[id] = 1; rep[id] = now + 420; fire('keydown', code); fire('keyup', code); }
    else if (now > rep[id]) { rep[id] = now + 130; fire('keydown', code); fire('keyup', code); }
  };
  const poll = now => {
    requestAnimationFrame(poll);
    const gp = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find(g => g && g.connected); if (!gp) { for (const k in gv) gv[k] = 0; return; }
    padOn = true; const b = i => !!(gp.buttons[i] && gp.buttons[i].pressed), ax = (gp.axes[0] || 0), ay = (gp.axes[1] || 0);
    const L = b(14) || ax < -.3, R = b(15) || ax > .3, U = b(12) || ay < -.5, D = b(13) || ay > .5, anyBtn = gp.buttons.some(x => x.pressed);
    if (ov.classList.contains('on')) return;
    if (racing()) {
      gv.left = +L; gv.right = +R; gv.up = +(b(0) || b(7)); gv.down = +(b(1) || b(6)); gv.drift = +(b(4) || b(5));
      const it = b(2) || b(3), code = map.item[0] || map.item[1];
      if (it && !prev.item) { prev.item = 1; if (code) fire('keydown', code); } else if (!it && prev.item) { prev.item = 0; gv.down = +D; if (code) fire('keyup', code); gv.down = 0; }
      if (b(9) && !prev.menu) { prev.menu = 1; const m = document.getElementById('menuBtn'); m && m.click(); } else if (!b(9)) prev.menu = 0;
      return;
    }
    for (const k in gv) gv[k] = 0;
    const title = document.getElementById('title');
    if (title && title.classList.contains('on')) { pulse('any', anyBtn, 'Enter', now); return; }
    pulse('l', L, 'ArrowLeft', now); pulse('r', R, 'ArrowRight', now); pulse('u', U, 'ArrowUp', now); pulse('d', D, 'ArrowDown', now);
    pulse('a', b(0) || b(9), 'Enter', now); pulse('b', b(1), 'Escape', now);
  };
  requestAnimationFrame(poll);
  const btn = document.createElement('button'); btn.id = 'ctlBtn'; btn.className = 'sec'; btn.textContent = '⌨ Controls';
  const ov = document.createElement('div'); ov.id = 'ctlOv'; ov.innerHTML = '<div id="ctlBox"></div>';
  document.body.append(btn, ov); const box = ov.firstChild;
  let waiting = null, tab = 'keyboard';   // waiting = [action, slot]
  const render = () => {
    const tabs = `<div class="tabs">${[['keyboard', '⌨ Keyboard'], ['controller', '🎮 Controller'], ['touch', '👆 Touch']].map(([t, l]) => `<button class="tab${tab === t ? ' on' : ''}" data-t="${t}">${l}</button>`).join('')}</div>`;
    const kb = '<div class="sub">Click a key box, then press the key you want. Esc cancels · Backspace clears a slot.</div>' +
      ACTIONS.map(([a, l]) => `<div class="r"><span>${l}</span>${[0, 1].map(i => `<button class="k${waiting && waiting[0] === a && waiting[1] === i ? ' wait' : ''}" data-a="${a}" data-i="${i}">${waiting && waiting[0] === a && waiting[1] === i ? 'Press a key…' : nice(map[a][i])}</button>`).join('')}</div>`).join('');
    const pad = '<div class="soon">Plug in or pair a controller and press a button (standard layout: Xbox / PlayStation / Switch Pro).</div><div class="pad"><span>Steer / menus</span><b>Left stick / D-pad</b><span>Accelerate</span><b>A / RT</b><span>Brake / Reverse</span><b>B / LT</b><span>Drift / Hop</span><b>LB / RB</b><span>Use item</span><b>X / Y</b><span>Drop item behind</span><b>D-pad / stick down + release item</b><span>Menu (in race)</span><b>Start</b><span>Confirm / Back (menus)</span><b>A or Start / B</b></div>';
    const touch = '<div class="soon">Touch controls appear on screen during a race on touch devices:</div><div class="pad"><span>Steer</span><b>Slide left thumb left / right</b><span>Accelerate</span><b>Automatic</b><span>Brake / Reverse</span><b>BRAKE button</b><span>Drift / Hop</span><b>DRIFT button (hold while steering)</b><span>Use item</span><b>Tap the item circle</b><span>Hold / throw</span><b>Hold the circle, release to throw</b><span>Drop item behind</span><b>Swipe down on the circle</b></div>';
    box.innerHTML = '<h2>CONTROLS</h2>' + tabs + (tab === 'keyboard' ? kb : tab === 'controller' ? pad : touch) +
      `<div class="f">${tab === 'keyboard' ? '<button class="sec" id="ctlReset">Reset to default</button>' : '<span></span>'}<button class="go" id="ctlDone">Done</button></div>`;
    box.querySelectorAll('.tab').forEach(b => b.onclick = () => { tab = b.dataset.t; waiting = null; render(); });
    box.querySelectorAll('.k').forEach(b => b.onclick = () => { waiting = [b.dataset.a, +b.dataset.i]; render(); });
    const rs = box.querySelector('#ctlReset'); if (rs) rs.onclick = () => { map = JSON.parse(JSON.stringify(DEFAULTS)); waiting = null; save(); render(); };
    box.querySelector('#ctlDone').onclick = close;
  };
  const open = () => { waiting = null; render(); ov.classList.add('on'); }, close = () => { waiting = null; ov.classList.remove('on'); btn.blur(); };
  btn.onclick = open; ov.onclick = e => { if (e.target === ov) close(); };
  // while the overlay is open it owns the keyboard (capture phase, so menus and the game never see the keys)
  addEventListener('keydown', e => {
    if (!ov.classList.contains('on')) return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (!waiting) { if (e.code === 'Escape') close(); return; }
    if (e.code === 'Escape') { waiting = null; render(); return; }
    const [a, i] = waiting;
    if (e.code === 'Backspace') map[a][i] = '';
    else { for (const o in map) map[o] = map[o].map(c => c === e.code ? '' : c); map[a][i] = e.code; }
    waiting = null; save(); render();
  }, true);
  const hint = () => `${nice(map.up[0])}/${nice(map.left[0])}/${nice(map.down[0])}/${nice(map.right[0])} drive · ${nice(map.drift[0])} drift · ${nice(map.item[0])} item · ${nice(map.restart[0])} restart · ${nice(map.mute[0])} mute`;
  const sync = () => { const f = document.querySelector('#menu .foot small'); if (f) f.textContent = (hint() + ' · hold ' + nice(map.down[0]) + ' to drop item behind').toUpperCase(); };
  sync(); const _c = close; ov.addEventListener('click', sync); box.addEventListener('click', sync); addEventListener('keyup', sync);
  return { held, heldRaw, countdownUI: cdOn, is, hint, open };
}
