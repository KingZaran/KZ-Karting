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
  const held = a => map[a].some(c => c && down[c]), is = (a, code) => map[a].includes(code);

  // ---- UI ----
  const css = document.createElement('style');
  css.textContent = `#ctlBtn{position:fixed;right:14px;bottom:14px;z-index:60;background:#3a4a7a;color:#fff;font-size:13px;padding:7px 12px;border-radius:10px;opacity:.85}
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
  #ctlBox .f{display:flex;gap:10px;justify-content:space-between;margin-top:16px}`;
  document.head.appendChild(css);
  const btn = document.createElement('button'); btn.id = 'ctlBtn'; btn.className = 'sec'; btn.textContent = '⌨ Controls';
  const ov = document.createElement('div'); ov.id = 'ctlOv'; ov.innerHTML = '<div id="ctlBox"></div>';
  document.body.append(btn, ov); const box = ov.firstChild;
  let waiting = null;   // [action, slot]
  const render = () => {
    box.innerHTML = '<h2>CONTROLS</h2><div class="sub">Click a key box, then press the key you want. Esc cancels · Backspace clears a slot.</div>' +
      ACTIONS.map(([a, l]) => `<div class="r"><span>${l}</span>${[0, 1].map(i => `<button class="k${waiting && waiting[0] === a && waiting[1] === i ? ' wait' : ''}" data-a="${a}" data-i="${i}">${waiting && waiting[0] === a && waiting[1] === i ? 'Press a key…' : nice(map[a][i])}</button>`).join('')}</div>`).join('') +
      '<div class="f"><button class="sec" id="ctlReset">Reset to default</button><button class="go" id="ctlDone">Done</button></div>';
    box.querySelectorAll('.k').forEach(b => b.onclick = () => { waiting = [b.dataset.a, +b.dataset.i]; render(); });
    box.querySelector('#ctlReset').onclick = () => { map = JSON.parse(JSON.stringify(DEFAULTS)); waiting = null; save(); render(); };
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
  return { held, is, hint, open };
}
