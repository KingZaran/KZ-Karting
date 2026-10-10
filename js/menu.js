// Title -> main menu -> single-player setup, with keyboard + mouse control.
import { itemIcon } from './sprites.js';
export function initMenus({ $, show, audio, startFlow, garageUI, onOnline, onSingle, onSettings, onLeave }) {
  let screen = 'title', mainIdx = 0, f = 0, cursor = 0, panel = 'left', gf = 0;
  const go = s => { screen = s; show(s); if (s === 'menu') { f = 0; panel = 'left'; refocus(); } if (s === 'main') { mainIdx = 0; mainFocus(); } };
  // ---- main menu
  const mainBtns = [...document.querySelectorAll('#main .big-btn')];
  const mainFocus = () => mainBtns.forEach((b, i) => b.classList.toggle('sel', i === mainIdx));
  const mainPick = i => { mainIdx = i; mainFocus(); audio.sfx('ok'); if (i === 0) onSingle(); else if (i === 1) onOnline(); else onSettings(); };
  mainBtns.forEach((b, i) => { b.onmouseenter = () => { mainIdx = i; mainFocus(); }; b.onclick = () => mainPick(i); });
  // ---- setup rows built from the hidden <select>s so main.js settings code keeps working
  let onl = false, isHostNow = true;   // online room mode: Bots row becomes Track, Bot Difficulty is hidden, only the host's settings count
  const defs = [['bots', 'Bots'], ['diff', 'Bot Difficulty'], ['laps', 'Laps'], ['cls', 'Engine Class'], ['gfx', 'Graphics']];
  const rows = defs.map(([id, label]) => {
    const sel0 = $(id), cur = () => (id === 'bots' && onl) ? $('otrack') : sel0, row = document.createElement('div'); row.className = 'row';
    row.innerHTML = `<span>${label}</span><span class="val"><b class="ar">◀</b><em></em><b class="ar">▶</b></span>`;
    const em = row.querySelector('em'), ars = row.querySelectorAll('.ar');
    const refresh = () => { const sel = cur(); em.textContent = sel.options[sel.selectedIndex].text; };
    const change = d => { if (onl && !isHostNow && id !== 'gfx') { audio.sfx('back'); return; } const sel = cur(); const n = sel.options.length; sel.selectedIndex = (sel.selectedIndex + d + n) % n; sel.dispatchEvent(new Event('change')); refresh(); audio.sfx('tick'); };
    ars[0].onclick = e => { e.stopPropagation(); change(-1); }; ars[1].onclick = e => { e.stopPropagation(); change(1); };
    row.onclick = () => { f = defs.findIndex(d => d[0] === id); refocus(); };
    refresh(); $('rows').append(row); return { row, change, refresh, id };
  });
  rows.forEach(r => r.refresh());
  const paint = () => {   // reflect online/host state in the setup panel
    rows[0].row.firstChild.textContent = onl ? 'Track' : 'Bots'; rows[1].row.style.display = onl ? 'none' : ''; rows.forEach(r => r.refresh());
    $('leftPanel').classList.toggle('guest', onl && !isHostNow);
    $('start').textContent = onl ? (isHostNow ? 'START RACE ▶' : 'WAITING FOR HOST…') : 'OK ▶'; $('start').disabled = onl && !isHostNow;
    $('backBtn').textContent = onl ? '◀ LEAVE ROOM' : '◀ BACK';
  };
  const setOnline = (on, info) => {
    onl = on; if (info) { isHostNow = info.host; $('ptitle').innerHTML = `ONLINE · ROOM <b style="letter-spacing:4px;color:#ffd34a">${info.code}</b><small style="display:block;font-size:12px;opacity:.75;letter-spacing:1px;margin-top:3px">${info.names.join(' · ')}</small>`; }
    else $('ptitle').textContent = 'SINGLE PLAYER · RACE SETUP';
    if (on && f === 1) f = 0; paint();
  };
  const tiles = () => [...$('items').children];
  const refocus = () => {
    const L = panel === 'left';
    rows.forEach((r, i) => r.row.classList.toggle('sel', L && f === i));
    $('itemsHead').classList.toggle('sel', L && f === 5); $('start').classList.toggle('sel', L && f === 6);
    tiles().forEach((t, i) => t.classList.toggle('cur', L && f === 5 && i === cursor));
    garageUI.rows.forEach((r, i) => r.classList.toggle('sel', !L && gf === i));
    $('leftPanel').classList.toggle('dimp', !L); $('garage').classList.toggle('dimp', L);
  };
  $('start').onmouseenter = () => { f = 6; refocus(); };
  const toggleTile = () => { if (onl && !isHostNow) return; tiles()[cursor].click(); audio.sfx('tick'); };
  document.addEventListener('click', e => { const t = e.target.closest && e.target.closest('#items > .tile'); if (t) { cursor = tiles().indexOf(t); f = 5; refocus(); } });
  garageUI.onFocus = i => { panel = 'right'; gf = i; refocus(); };
  $('leftPanel').addEventListener('mousedown', () => { if (panel !== 'left') { panel = 'left'; refocus(); } });
  const back = () => { audio.sfx('back'); if (onl) { onLeave(); setOnline(false); } go('main'); };
  $('backBtn').onclick = back;
  // ---- keyboard
  addEventListener('keydown', e => {
    const c = e.code;
    if (!$(screen).classList.contains('on')) return;
    if (screen === 'title') { if (c === 'Enter' || c === 'Space') { audio.init(); audio.sfx('ok'); go('main'); } }
    else if (screen === 'main') {
      if (c === 'ArrowDown' || c === 'KeyS') { mainIdx = (mainIdx + 1) % mainBtns.length; mainFocus(); audio.sfx('tick'); }
      else if (c === 'ArrowUp' || c === 'KeyW') { mainIdx = (mainIdx + mainBtns.length - 1) % mainBtns.length; mainFocus(); audio.sfx('tick'); }
      else if (c === 'Enter' || c === 'Space') mainPick(mainIdx);
      else if (c === 'Escape') { audio.sfx('back'); go('title'); }
    } else if (screen === 'menu') {
      if (c === 'Escape') { back(); return; }
      if (c === 'Tab') { panel = panel === 'left' ? 'right' : 'left'; audio.sfx('tick'); refocus(); e.preventDefault(); return; }
      if (panel === 'right') {
        if (c === 'ArrowDown' || c === 'ArrowUp') { gf = (gf + (c === 'ArrowDown' ? 1 : 3)) % 4; audio.sfx('tick'); refocus(); }
        else if (c === 'ArrowLeft' || c === 'ArrowRight') garageUI.change(gf, c === 'ArrowRight' ? 1 : -1);
        else if (c === 'Enter' || c === 'Space') { panel = 'left'; f = 6; refocus(); }
        e.preventDefault(); return;
      }
      if (c === 'ArrowDown' || c === 'ArrowUp') {
        const d = c === 'ArrowDown' ? 1 : -1;
        if (f === 5 && ((d > 0 && cursor < 14) || (d < 0 && cursor >= 7))) cursor += d * 7; else { f = Math.max(0, Math.min(6, f + d)); if (onl && f === 1) f += d > 0 ? 1 : -1; if (f === 5) cursor = d > 0 ? Math.min(cursor, 6) : cursor % 7 + 14; }
        audio.sfx('tick'); refocus(); e.preventDefault();
      } else if (c === 'ArrowLeft' || c === 'ArrowRight') {
        const d = c === 'ArrowRight' ? 1 : -1;
        if (f < 5) rows[f].change(d); else if (f === 5) { cursor = (cursor + d + 21) % 21; audio.sfx('tick'); refocus(); }
        e.preventDefault();
      } else if (c === 'Enter' || c === 'Space') { if (f === 5) toggleTile(); else if (f === 6) { audio.sfx('ok'); startFlow(); } else { f = Math.min(6, f + 1); refocus(); } e.preventDefault(); }
    }
  });
  return { go, setOnline, get online() { return onl; }, get screen() { return screen; } };
}
export { itemIcon };
