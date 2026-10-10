// Mario Kart 8 Deluxe-style menu flow, for single player and online rooms.
//   single : character -> kart combo -> game setup -> items -> map -> START
//   online : name/host/join -> character -> kart combo -> waiting room -> (host) setup -> items -> map -> START
// Character icons: drop PNGs in  icons/chars/<character id>.png  (e.g. icons/chars/mario.png); a coloured tile is used when there is none.
import { fixItemImgs } from './sprites.js';
import { CHARS, KARTS, WHEELS, PAINT, STAT_KEYS, computeStats, getChar } from './roster.js';

const SPEEDS = ['50cc', '100cc', '150cc', '200cc', 'Mirror'], CLS = ['0.8', '1', '1.2', '1.4', '1.2'], DIFFS = ['Easy', 'Normal', 'Hard'], DIFFV = ['0.8', '0.9', '1'];
const hex = n => '#' + n.toString(16).padStart(6, '0'), esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const CSS = `
#flow{background:radial-gradient(ellipse at 20% 0%,#2a4aa8 0%,#142a6b 45%,#0a1440 100%);padding:0;gap:0;justify-content:flex-start;align-items:stretch;overflow:hidden;font-family:inherit}
#flow::before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(135deg,#ffffff08 0 22px,transparent 22px 44px);pointer-events:none}
#flow .fhead{position:relative;display:flex;align-items:center;height:78px;flex:none}
#flow .ftitle{background:linear-gradient(90deg,#e60012,#ff4a3a 70%,transparent);padding:10px 90px 10px 36px;font-size:34px;font-style:italic;font-weight:800;letter-spacing:2px;text-shadow:0 3px 0 #0006;clip-path:polygon(0 0,100% 0,92% 100%,0 100%)}
#flow .fsub{margin-left:22px;font-size:14px;letter-spacing:2px;opacity:.8}
#flow .fbody{position:relative;flex:1;min-height:0;display:grid;grid-template-columns:1.25fr 1fr;gap:22px;padding:6px 34px 8px}
#flow .fbody.one{grid-template-columns:1fr}
#flow .fl{min-height:0;overflow:auto;display:flex;flex-direction:column;gap:10px;padding:4px}
#flow .fr{min-height:0;display:flex;flex-direction:column;gap:10px}
#flow .ffoot{position:relative;display:flex;justify-content:space-between;align-items:center;padding:10px 34px 18px;flex:none;gap:14px}
#flow .fb{display:flex;align-items:center;gap:10px;font-size:22px;font-style:italic;font-weight:700;padding:8px 26px 8px 10px;border-radius:40px;background:linear-gradient(180deg,#fff,#d9dde8);color:#1a1f33;border:4px solid #1a1f33;box-shadow:0 5px 0 #0007;cursor:pointer}
#flow .fb i{font-style:normal;display:inline-flex;width:34px;height:34px;border-radius:50%;align-items:center;justify-content:center;background:#1a1f33;color:#fff;font-size:18px}
#flow .fb.ok i{background:#e60012}
#flow .fb:hover,#flow .fb.sel{background:linear-gradient(180deg,#ff5a5a,#e60012);color:#fff;border-color:#fff;transform:scale(1.05)}
#flow .fb:disabled{opacity:.45;filter:grayscale(.7);cursor:default;transform:none}
#flow .pv{position:relative;flex:1;min-height:200px;border-radius:22px;background:radial-gradient(circle at 50% 75%,#4a64b8,#101a46);border:4px solid #ffffff40;overflow:hidden}
#flow .pv canvas{width:100%;height:100%;display:block}
#flow .pvn{position:absolute;left:16px;top:10px;font-size:26px;font-style:italic;font-weight:800;text-shadow:0 3px 6px #000}
#flow .pvn small{display:block;font-size:11px;letter-spacing:3px;color:#ffd400;font-style:normal}
#flow .stats{background:#0a1236d9;border:3px solid #ffffff30;border-radius:18px;padding:10px 16px;display:flex;flex-direction:column;gap:6px}
#flow .stat{display:grid;grid-template-columns:118px 1fr 26px;gap:10px;align-items:center;font-size:14px;font-weight:700}
#flow .bar{height:14px;background:#ffffff22;border-radius:8px;overflow:hidden}#flow .bar i{display:block;height:100%;background:linear-gradient(90deg,#33d17a,#ffd400 60%,#ff5a3a)}
#flow .cgrid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}
#flow .ct{position:relative;aspect-ratio:1;border-radius:16px;border:4px solid #ffffff30;overflow:hidden;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;font-style:italic;text-shadow:0 2px 4px #0008}
#flow .ct img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
#flow .ct em{position:absolute;left:0;right:0;bottom:0;font-size:10px;font-style:normal;font-weight:700;background:#000a;padding:2px;text-align:center;letter-spacing:.5px}
#flow .ct.cur{border-color:#fff;box-shadow:0 0 0 4px #e60012,0 0 26px #ff5a5a;transform:scale(1.1);z-index:2}
#flow .ksel{display:flex;gap:18px;justify-content:center;align-items:center;flex:1}
#flow .kc{display:flex;flex-direction:column;align-items:center;gap:8px;flex:1;min-width:0}
#flow .kc .kt{font-size:13px;letter-spacing:3px;opacity:.8}
#flow .kc .arr{font-size:34px;cursor:pointer;opacity:.85;user-select:none}#flow .kc .arr:hover{transform:scale(1.3)}
#flow .kc .kv{width:100%;min-height:120px;border-radius:20px;background:#ffffff1c;border:4px solid #ffffff30;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:22px;font-style:italic;font-weight:800;text-align:center;padding:10px;gap:8px}
#flow .kc.cur .kv{background:linear-gradient(180deg,#ff5a5a,#e60012);border-color:#fff;box-shadow:0 0 26px #e6001288}
#flow .kc .kv small{font-size:12px;font-style:normal;font-weight:600;opacity:.9}
#flow .ki{max-height:min(90px,12vh);max-width:90%;object-fit:contain}
#flow .kc .sw{width:46px;height:46px;border-radius:50%;border:4px solid #fff;display:block}
#flow .srow{display:flex;justify-content:space-between;align-items:center;padding:min(16px,1.8vh) 34px;border-radius:50px;background:#ffffff1c;border:4px solid transparent;font-size:min(26px,3.8vh);font-weight:700;font-style:italic;cursor:pointer}
#flow .srow.cur{background:linear-gradient(90deg,#e60012,#ff5a5a);border-color:#fff;box-shadow:0 0 26px #e6001266;transform:scale(1.02)}
#flow .srow.off{opacity:.35;filter:grayscale(1)}
#flow .srow .v{display:flex;gap:22px;align-items:center}#flow .srow .v em{font-style:normal;min-width:150px;text-align:center}#flow .srow .ar{cursor:pointer;padding:0 8px}#flow .srow .ar:hover{transform:scale(1.4)}
#flow .igrid{display:grid;grid-template-columns:repeat(7,1fr);gap:10px}
#flow .it{position:relative;border-radius:16px;background:#ffffff1c;border:4px solid transparent;padding:8px 4px 6px;text-align:center;cursor:pointer;font-size:11px;font-weight:700}
#flow .it img{width:100%;max-width:62px;display:block;margin:0 auto 4px}
#flow .it.off{opacity:.3;filter:grayscale(1)}
#flow .it.cur{border-color:#fff;box-shadow:0 0 0 3px #e60012,0 0 20px #ff5a5a;transform:scale(1.08);z-index:2}
#flow .ibtns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
#flow .ibtns .fb{font-size:18px;padding:8px 24px}
#flow .mgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
#flow .mt{border-radius:18px;background:#ffffff1c;border:4px solid transparent;padding:8px;text-align:center;cursor:pointer;font-size:15px;font-weight:800;font-style:italic}
#flow .mt canvas{width:100%;height:auto;max-height:104px;border-radius:10px;display:block;margin-bottom:4px}
#flow .mt small{display:block;font-size:10px;font-style:normal;opacity:.7;font-weight:600}
#flow .mt.cur{border-color:#fff;box-shadow:0 0 0 3px #e60012,0 0 20px #ff5a5a;transform:scale(1.04)}
#flow .mrand{font-size:26px;padding:16px;text-align:center;font-style:italic;font-weight:800}
#flow .card{width:min(560px,100%);align-self:center;background:#0a1236d9;border:3px solid #ffffff30;border-radius:20px;padding:18px 22px;display:flex;flex-direction:column;gap:10px;font-size:20px;font-weight:700}
#flow .card div{display:flex;justify-content:space-between}#flow .card span{opacity:.7;font-weight:500}
#flow .bigok{font-size:min(64px,9vh);padding:min(18px,2vh) 80px min(18px,2vh) 24px;margin:auto}#flow .bigok i{width:min(80px,10vh);height:min(80px,10vh);font-size:min(44px,5.5vh)}
#flow .center{margin:auto;text-align:center;display:flex;flex-direction:column;gap:14px;align-items:center}
#flow .bigcode{font-size:110px;font-weight:900;font-style:italic;letter-spacing:22px;color:#ffd400;text-shadow:0 5px 0 #0008;line-height:1}
#flow .pl{display:flex;justify-content:space-between;align-items:center;background:#ffffff1c;border-radius:30px;padding:10px 24px;font-size:20px;font-weight:700;width:min(440px,90vw)}
#flow .pl b{color:#ffd400;font-size:13px;letter-spacing:2px}
#flow input{font:inherit;font-size:22px;font-weight:700;padding:12px 18px;border-radius:30px;border:4px solid #ffffff55;background:#0a1236;color:#fff;text-align:center;min-width:0}
#flow .erow{display:flex;gap:12px;align-items:center;justify-content:center}
#flow .msg{min-height:22px;font-size:15px;opacity:.85}
#flow .sb{display:grid;grid-template-columns:70px 64px 1fr 110px;align-items:center;gap:14px;padding:8px 22px;border-radius:40px;background:#0a1236d9;border:3px solid #ffffff30;font-size:24px;font-weight:800;font-style:italic;width:min(780px,100%);align-self:center}
#flow .sb .n{font-size:34px;text-align:center}#flow .sb .ic{width:56px;height:56px;border-radius:50%;overflow:hidden;position:relative;border:3px solid #fff;font-size:20px;display:flex;align-items:center;justify-content:center}#flow .sb .ic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
#flow .sb .p{text-align:right;color:#ffd400}#flow .sb.me{background:linear-gradient(90deg,#e60012,#ff5a5a);border-color:#fff}
#roomTag{position:fixed;top:14px;right:18px;z-index:70;display:none;background:#0a1236e6;border:3px solid #ffd400;border-radius:14px;padding:6px 16px;font-size:20px;font-weight:900;font-style:italic;letter-spacing:5px;color:#ffd400}
#roomTag small{display:block;font-size:9px;letter-spacing:3px;color:#fff;font-style:normal;opacity:.8}`;

export function initFlow({ $, show, audio, garageUI, openControls, TRACKS, THEMES, ITEMS, itemIcon, drawThumb, online, startGame, toMain }) {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const root = document.createElement('div'); root.id = 'flow'; root.className = 'screen'; document.body.appendChild(root);
  const tag = document.createElement('div'); tag.id = 'roomTag'; document.body.appendChild(tag);
  const canvas = $('gcanvas');

  // ---------- persistent settings ----------
  const ALL = ITEMS.map(i => i[0]);
  let S = { speed: 1, diff: 1, bots: 5, laps: 3, gfx: 'high', cpuOn: true, items: ALL, track: 'random', name: '' };
  try { Object.assign(S, JSON.parse(localStorage.getItem('kz-flow') || '{}')); S.name = localStorage.getItem('kz-name') || S.name; } catch (e) {}
  const save = () => { try { localStorage.setItem('kz-flow', JSON.stringify(S)); localStorage.setItem('kz-name', S.name); } catch (e) {} };
  let lo = garageUI.get(), room = null, cur = 'none', mode = 'single', msg = '';
  const setLo = patch => { lo = { ...lo, ...patch }; garageUI.set(lo); };
  const inRoom = () => mode === 'online' && room;
  const opts = () => ({ bots: (mode === 'online' && !S.cpuOn) ? 0 : S.bots, diff: DIFFV[S.diff], laps: String(S.laps), cls: CLS[S.speed], mirror: S.speed === 4, items: S.items, gfx: S.gfx, lo, trackId: S.track });

  // ---------- helpers ----------
  const tile = id => { const c = getChar(id); return `<div style="position:absolute;inset:0;background:linear-gradient(160deg,${hex(c.c.body === 0xf0f6fa ? 0x3b5bd6 : c.c.body)},#101a46)"></div>${esc(c.name.split(' ').map(w => w[0]).join('').slice(0, 2))}<img src="icons/chars/${id}.png" alt="" onerror="this.remove()"><em>${esc(c.name)}</em>`; };
  const statsHtml = () => { const s = computeStats(lo); return `<div class="stats">${STAT_KEYS.map(([k, l]) => `<div class="stat"><span>${l}</span><div class="bar"><i style="width:${s[k] * 10}%"></i></div><b>${s[k]}</b></div>`).join('')}</div>`; };
  const preview = () => { const C = getChar(lo.char); return `<div class="pv" id="pv"><div class="pvn">${esc(C.name)}<small>${C.cls.toUpperCase()}</small></div></div>`; };
  const attachPv = () => { const pv = $('pv'); if (pv) pv.appendChild(canvas); };
  const frame = (title, left, right, { back = true, ok = 'OK', okDisabled = false, sub = '', one = false } = {}) => {
    const prevFl = $('fl'), sc0 = prevFl && lastDrawn === cur ? prevFl.scrollTop : 0; lastDrawn = cur;
    root.innerHTML = `<div class="fhead"><div class="ftitle">${title}</div><div class="fsub">${sub}</div></div>
      <div class="fbody${one ? ' one' : ''}"><div class="fl" id="fl">${left}</div>${one ? '' : `<div class="fr">${right}</div>`}</div>
      <div class="ffoot">${back ? '<button class="fb" data-a="back"><i>B</i>Back</button>' : '<span></span>'}${ok ? `<button class="fb ok" data-a="ok"${okDisabled ? ' disabled' : ''}><i>A</i>${ok}</button>` : '<span></span>'}</div>`;
    root.querySelectorAll('.fb[data-a]').forEach(b => b.onclick = () => { audio.sfx(b.dataset.a === 'ok' ? 'ok' : 'back'); (b.dataset.a === 'ok' ? ok_ : back_)(); });
    attachPv(); updTag(); const fl = $('fl'); fl.scrollTop = sc0; const cc = fl.querySelector('.cur'); if (cc) cc.scrollIntoView({ block: 'nearest' });
  };
  let lastDrawn = '';
  const updTag = () => { const on = inRoom() && cur !== 'none' && cur !== 'entry' && !racingHidden; tag.style.display = on ? 'block' : 'none'; if (room) tag.innerHTML = `<small>ROOM CODE</small>${room.code}`; };
  let racingHidden = false;
  const tick = () => audio.sfx('tick');

  // ---------- screens ----------
  let ci = Math.max(0, CHARS.findIndex(c => c.id === lo.char)), kc = 0, sr = 0, ic = 0, mc = 0, wc = 1;
  const SCR = {
    entry: {
      draw() {
        frame('Online Multiplayer', `<div class="center"><div class="msg" id="emsg">${esc(msg)}</div><input id="eName" maxlength="14" placeholder="Your name" value="${esc(S.name)}">
          <button class="fb ok" id="eHost" style="font-size:30px"><i>H</i>Host Room</button>
          <div class="erow"><input id="eCode" maxlength="4" placeholder="CODE" style="width:150px;text-transform:uppercase;letter-spacing:6px"><button class="fb" id="eJoin" style="font-size:30px"><i>J</i>Join Room</button></div></div>`, '', { one: true, ok: '' });
        const nm = () => { S.name = ($('eName').value.trim() || 'Player').slice(0, 14); save(); return S.name; };
        $('eHost').onclick = () => { audio.sfx('ok'); mode = 'online'; msg = 'Connecting…'; $('emsg').textContent = msg; online.create(nm()); };
        $('eJoin').onclick = () => { const c = $('eCode').value.trim().toUpperCase(); if (c.length !== 4) { $('emsg').textContent = 'Enter the 4-letter room code'; audio.sfx('back'); return; } audio.sfx('ok'); mode = 'online'; msg = 'Connecting…'; $('emsg').textContent = msg; online.join(c, nm()); };
        $('eCode').onkeydown = e => { if (e.key === 'Enter') $('eJoin').click(); }; $('eName').onkeydown = e => { if (e.key === 'Enter') $('eHost').click(); };
        setTimeout(() => $('eName').focus(), 50);
      },
      key() { return false; }, back() { mode = 'single'; msg = ''; toMain(); }, ok() {},
    },
    char: {
      draw() {
        frame('Select Character', `<div class="cgrid" id="cg">${CHARS.map((c, i) => `<div class="ct${i === ci ? ' cur' : ''}" data-i="${i}">${tile(c.id)}</div>`).join('')}</div>`, preview() + statsHtml());
        root.querySelectorAll('.ct').forEach(t => t.onclick = () => { ci = +t.dataset.i; if (cur === 'char') pickChar(); audio.sfx('tick'); });
        const c = root.querySelector('.ct.cur'); c && c.scrollIntoView({ block: 'nearest' });
      },
      key(c) { const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -6, ArrowDown: 6 }[c]; if (!d) return false; ci = Math.max(0, Math.min(CHARS.length - 1, ci + d)); pickChar(); tick(); return true; },
      back() { if (mode === 'online' && room && wcFromWait) return go('wait'); if (mode === 'online') { online.leave(); room = null; mode = 'single'; go('entry'); } else toMain(); },
      ok() { go('kart'); },
    },
    kart: {
      draw() {
        const cols = [['VEHICLE', KARTS, 'kart'], ['TIRES', WHEELS, 'wheel'], ['COLOUR', PAINT, 'paint']], dir = { kart: 'karts', wheel: 'wheels' };
        const idx = (k, l) => k === 'paint' ? lo.paint : Math.max(0, l.findIndex(x => x.id === lo[k]));
        frame('Select Kart Combo', `<div class="ksel">${cols.map(([t, l, k], i) => { const v = l[idx(k, l)]; return `<div class="kc${i === kc ? ' cur' : ''}" data-i="${i}"><div class="kt">${t}</div><div class="arr" data-d="-1">▲</div><div class="kv">${k !== 'paint' ? `<img class="ki" src="icons/${dir[k]}/${v.id}.png" alt="" onerror="this.remove()">` : ''}${k === 'paint' ? `<span class="sw" style="background:${hex(v.hex)}"></span>${v.name}` : `${v.name}<small>${Object.entries(v.mod).filter(([, n]) => n).map(([s, n]) => `${s.slice(0, 3).toUpperCase()} ${n > 0 ? '+' : ''}${n}`).join(' · ') || 'Balanced'}</small>`}</div><div class="arr" data-d="1">▼</div></div>`; }).join('')}</div>`, preview() + statsHtml());
        root.querySelectorAll('.kc').forEach(c => { c.onclick = () => { kc = +c.dataset.i; SCR.kart.draw(); }; c.querySelectorAll('.arr').forEach(a => a.onclick = e => { e.stopPropagation(); kc = +c.dataset.i; chg(+a.dataset.d); }); });
      },
      key(c) { if (c === 'ArrowLeft') kc = (kc + 2) % 3; else if (c === 'ArrowRight') kc = (kc + 1) % 3; else if (c === 'ArrowUp') return chg(-1), true; else if (c === 'ArrowDown') return chg(1), true; else return false; tick(); SCR.kart.draw(); return true; },
      back() { go('char'); }, ok() { go(mode === 'online' ? 'wait' : 'setup'); },
    },
    wait: {
      draw() {
        const r = room || { code: '----', players: [], host: true, count: 0 };
        frame('Waiting for Players', `<div class="center"><div class="msg">SHARE THIS ROOM CODE</div><div class="bigcode">${r.code}</div>
          ${r.players.map((p, i) => `<div class="pl"><span>${esc(p.name)}${p.me ? ' (you)' : ''}</span><b>${i === 0 ? 'HOST' : ''}</b></div>`).join('')}
          <div class="erow"><button class="fb" id="wCust" style="font-size:20px"><i>C</i>Customise character / kart</button><button class="fb" id="wSet" style="font-size:20px"><i>S</i>Settings</button></div>
          <div class="msg">${r.host ? (r.count < 2 ? 'Waiting for at least 2 players…' : 'Press OK when everyone has joined') : 'Waiting for the host to start the race…'}</div></div>`, '', { one: true, ok: r.host ? 'OK' : '', back: true });
        $('wCust').onclick = () => { audio.sfx('ok'); wcFromWait = true; go('char'); }; $('wSet').onclick = () => { audio.sfx('ok'); settingsFrom = 'wait'; go('settings'); };
      },
      key(c) { if (c === 'KeyC') { wcFromWait = true; go('char'); return true; } if (c === 'KeyS') { settingsFrom = 'wait'; go('settings'); return true; } return false; },
      back() { online.leave(); room = null; mode = 'single'; go('entry'); }, ok() { if (room && room.host) go('setup'); },
    },
    setup: {
      draw() {
        const on = mode === 'online', cpuOff = on && !S.cpuOn;
        const rows = this.rows();
        frame('Game Setup', `${rows.map((r, i) => `<div class="srow${i === sr ? ' cur' : ''}${r.off ? ' off' : ''}" data-i="${i}"><span>${r.label}</span><span class="v"><b class="ar" data-d="-1">◀</b><em>${r.val()}</em><b class="ar" data-d="1">▶</b></span></div>`).join('')}`, '', { one: true, sub: on ? 'ONLINE' : 'SINGLE PLAYER' });
        root.querySelectorAll('.srow').forEach(r => { r.onclick = () => { sr = +r.dataset.i; SCR.setup.draw(); }; r.querySelectorAll('.ar').forEach(a => a.onclick = e => { e.stopPropagation(); sr = +r.dataset.i; rows[sr].chg(+a.dataset.d); tick(); save(); SCR.setup.draw(); }); });
      },
      rows() {
        const wrap = (v, d, n) => (v + d + n) % n, off = mode === 'online' && !S.cpuOn, R = [];
        if (mode === 'online') R.push({ label: 'CPUs', val: () => S.cpuOn ? 'On' : 'Off', chg: () => { S.cpuOn = !S.cpuOn; } });
        R.push({ label: 'Speed', val: () => SPEEDS[S.speed], chg: d => { S.speed = wrap(S.speed, d, 5); } });
        R.push({ label: 'CPU Difficulty', off, val: () => DIFFS[S.diff], chg: d => { if (!off) S.diff = wrap(S.diff, d, 3); } });
        R.push({ label: 'Number of CPUs', off, val: () => S.bots, chg: d => { if (!off) S.bots = wrap(S.bots, d, mode === 'online' ? 12 - Math.max(2, room ? room.count : 2) + 1 : 12); } });
        R.push({ label: 'Laps', val: () => S.laps, chg: d => { const L = [1, 2, 3, 5, 7]; S.laps = L[wrap(L.indexOf(S.laps), d, L.length)]; } });
        return R;
      },
      key(c) { const R = this.rows(); if (c === 'ArrowUp') sr = (sr + R.length - 1) % R.length; else if (c === 'ArrowDown') sr = (sr + 1) % R.length; else if (c === 'ArrowLeft' || c === 'ArrowRight') { if (sr >= R.length) sr = 0; R[sr].chg(c === 'ArrowRight' ? 1 : -1); save(); } else return false; tick(); this.draw(); return true; },
      back() { go(mode === 'online' ? 'wait' : 'kart'); }, ok() { save(); go('items'); },
    },
    items: {
      draw() {
        const nb = 4;
        frame('Items', `<div class="igrid">${ITEMS.map(([id, name], i) => `<div class="it${S.items.includes(id) ? '' : ' off'}${ic === i ? ' cur' : ''}" data-i="${i}"><img data-item="${id}" alt="">${esc(name)}</div>`).join('')}</div>
          <div class="ibtns">${['Random', 'All On', 'All Off'].map((t, i) => `<button class="fb${ic === ITEMS.length + i ? ' sel' : ''}" data-b="${i}">${t}</button>`).join('')}</div>`, '', { one: true, sub: `${S.items.length} / ${ITEMS.length} ON` });
        fixItemImgs(root); root.querySelectorAll('.it').forEach(t => t.onclick = () => { ic = +t.dataset.i; toggle(); });
        root.querySelectorAll('[data-b]').forEach(b => b.onclick = e => { e.stopPropagation(); bulk(+b.dataset.b); });
      },
      key(c) {
        const n = ITEMS.length; let d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[c]; if (!d) { if (c === 'Space') { if (ic < n) toggle(); else bulk(ic - n); return true; } return false; }
        if (ic >= n) { if (c === 'ArrowLeft') ic = Math.max(n, ic - 1); else if (c === 'ArrowRight') ic = Math.min(n + 2, ic + 1); else if (c === 'ArrowUp') ic = n - 7 + Math.min(2, ic - n) * 2; }
        else if (c === 'ArrowDown' && ic + 7 >= n) ic = n; else ic = Math.max(0, Math.min(n - 1, ic + d));
        tick(); this.draw(); return true;
      },
      back() { go('setup'); }, ok() { if (ic >= ITEMS.length) bulk(ic - ITEMS.length); else if (online_()) { votes = {}; online.ui({ k: 'phase', s: 'map' }); go('map'); } else go('map'); },
    },
    map: {
      draw() {
        const n = TRACKS.length;
        frame(online_() ? `Vote for a Map` : 'Select Map', `<div class="mgrid">${TRACKS.map((t, i) => `<div class="mt${mc === i ? ' cur' : ''}" data-i="${i}"><span class="th"></span>${esc(t.name)}<small>${t.zones.map(([id]) => THEMES[id].name).join(' · ')}</small></div>`).join('')}</div>
          <div class="mt mrand${mc === n ? ' cur' : ''}" data-i="${n}">🎲 RANDOM</div>`, '', { one: true, sub: online_() ? `${Object.keys(votes).length} / ${room.count} VOTED` + (room.host ? ' · TAB = PICK WINNER' : '') : '', ok: online_() ? '' : 'OK' });
        root.querySelectorAll('.mt').forEach(t => { const i = +t.dataset.i; if (i < n) { const th = drawThumb(TRACKS[i]); t.querySelector('.th').replaceWith(th); const im = new Image(); im.onload = () => { im.style.cssText = 'width:100%;max-height:104px;object-fit:cover;border-radius:10px;display:block;margin-bottom:4px'; th.replaceWith(im); }; im.src = `icons/maps/${TRACKS[i].id}.png`; } t.onclick = () => { mc = i; audio.sfx('ok'); SCR.map.ok(); }; const cnt = Object.values(votes).filter(v => v === (i < n ? TRACKS[i].id : 'random')).length; if (online_() && cnt) t.insertAdjacentHTML('beforeend', `<b style="position:absolute;top:6px;right:8px;background:#ffd400;color:#000;border-radius:12px;padding:1px 9px;font-size:15px">${cnt}</b>`); t.style.position = 'relative'; });
        if (online_()) { const ff = root.querySelector('.ffoot'); if (room.host) { ff.lastElementChild.outerHTML = '<button class="fb ok" id="mDone"><i>★</i>Pick winner ▶</button>'; $('mDone').onclick = () => { audio.sfx('ok'); resolveVotes(); }; } }
      },
      key(c) { if (c === 'Tab' && online_() && room.host) { resolveVotes(); return true; } const n = TRACKS.length; let d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[c]; if (!d) return false; if (c === 'ArrowDown' && mc + 3 >= n && mc < n) mc = n; else if (c === 'ArrowUp' && mc === n) mc = Math.max(0, n - 3); else if (mc < n || c === 'ArrowUp') mc = Math.max(0, Math.min(n - 1, mc + d)); tick(); this.draw(); return true; },
      back() { go(online_() && !room.host ? 'wait' : online_() ? 'items' : 'items'); },
      ok() { const t = mc < TRACKS.length ? TRACKS[mc].id : 'random'; if (online_()) { vote(t); return; } S.track = t; save(); go('start'); },
    },
    settings: {
      rows() { return [{ label: 'Graphics', val: () => S.gfx === 'high' ? 'High' : 'Low (faster)', chg: () => { S.gfx = S.gfx === 'high' ? 'low' : 'high'; save(); } }, { label: 'Controls', val: () => 'Change keys ▶', chg: () => openControls() }]; },
      draw() {
        const R = this.rows();
        frame('Settings', R.map((r, i) => `<div class="srow${i === sr2 ? ' cur' : ''}" data-i="${i}"><span>${r.label}</span><span class="v"><b class="ar" data-d="-1">◀</b><em>${r.val()}</em><b class="ar" data-d="1">▶</b></span></div>`).join(''), '', { one: true, ok: '' });
        root.querySelectorAll('.srow').forEach(r => { r.onclick = () => { sr2 = +r.dataset.i; if (sr2 === 1) openControls(); this.draw(); }; r.querySelectorAll('.ar').forEach(a => a.onclick = e => { e.stopPropagation(); sr2 = +r.dataset.i; R[sr2].chg(); tick(); this.draw(); }); });
      },
      key(c) { const R = this.rows(); if (c === 'ArrowUp' || c === 'ArrowDown') sr2 = (sr2 + 1) % R.length; else if (c === 'ArrowLeft' || c === 'ArrowRight') R[sr2].chg(); else return false; tick(); this.draw(); return true; },
      back() { if (settingsFrom === 'wait' && room) go('wait'); else toMain(); }, ok() { if (sr2 === 1) openControls(); else { this.rows()[0].chg(); this.draw(); } },
    },
    start: {
      draw() {
        const o = opts(), t = S.track === 'random' ? null : TRACKS.find(x => x.id === S.track), many = mode === 'online' && room && room.count < 2, guest = mode === 'online' && room && !room.host;
        frame('Ready?', `<div class="card"><div><span>Map</span>${t ? esc(t.name) : '🎲 Random'}</div><div><span>Speed</span>${SPEEDS[S.speed]}</div><div><span>CPUs</span>${o.bots ? o.bots + ' · ' + DIFFS[S.diff] : 'Off'}</div><div><span>Laps</span>${S.laps}</div><div><span>Items</span>${S.items.length} / ${ITEMS.length}</div>${mode === 'online' && room ? `<div><span>Players</span>${room.count}</div>` : ''}</div>
          <div class="center"><div class="msg">${many ? 'Need at least 2 players in the room to start' : guest ? 'Waiting for the host to start the race…' : ''}</div>${guest ? '' : `<button class="fb ok bigok" id="bigOk"${many ? ' disabled' : ''}><i>A</i>START RACE</button>`}</div>`, '', { one: true, ok: '' });
        if (!guest) $('bigOk').onclick = () => { audio.sfx('ok'); SCR.start.ok(); };
      },
      key() { return false; },
      back() { if (mode === 'online' && room && !room.host) return go('wait'); go('map'); },
      ok() { if (mode === 'online' && room && !room.host) return; const o = opts(); if (mode === 'online') { if (room && room.count >= 2) online.hostStart({ trackId: o.trackId, laps: o.laps, cls: o.cls, items: o.items, bots: o.bots, diff: o.diff, mirror: o.mirror, gfx: o.gfx }); return; }
        const t = S.track === 'random' ? TRACKS[Math.floor(Math.random() * TRACKS.length)] : TRACKS.find(x => x.id === S.track) || TRACKS[0];
        audio.init(); startGame({ ...o, track: t }); },
    },
  };
  let scoreRows = [], scoreDone = () => {}, sr2 = 0, settingsFrom = 'main', openedAt = 0, votes = {};
  SCR.score = {
    draw() { frame('Results', scoreRows.map(r => { const c = getChar(r.char), col = ['#ffd400', '#d8dde6', '#cd7f32'][r.pos - 1] || '#fff'; return `<div class="sb${r.me ? ' me' : ''}"><span class="n" style="color:${col}">${r.pos}</span><span class="ic" style="background:${hex(c.c.body === 0xf0f6fa ? 0x3b5bd6 : c.c.body)}">${esc(c.name[0])}<img src="icons/chars/${c.id}.png" alt="" onerror="this.remove()"></span><span>${esc(r.name)}</span><span class="p">+${r.pts}</span></div>`; }).join(''), '', { one: true, back: false, ok: 'OK' }); },
    key() { return false; }, back() {}, ok() { scoreDone(); },
  };
  let wcFromWait = false;
  function pickChar() { setLo({ char: CHARS[ci].id }); const C = getChar(lo.char); const pv = $('pv'); if (pv) pv.querySelector('.pvn').innerHTML = `${esc(C.name)}<small>${C.cls.toUpperCase()}</small>`; root.querySelectorAll('.ct').forEach((t, i) => t.classList.toggle('cur', i === ci)); const s = root.querySelector('.stats'); if (s) s.outerHTML = statsHtml(); const c = root.querySelector('.ct.cur'); c && c.scrollIntoView({ block: 'nearest' }); }
  function chg(d) {
    const cols = [[KARTS, 'kart'], [WHEELS, 'wheel'], [PAINT, 'paint']], [l, k] = cols[kc], i = k === 'paint' ? lo.paint : Math.max(0, l.findIndex(x => x.id === lo[k])), n = l.length, nx = (i + d + n) % n;
    setLo({ [k]: k === 'paint' ? nx : l[nx].id }); tick(); SCR.kart.draw();
  }
  function toggle() { const id = ITEMS[ic][0]; S.items = S.items.includes(id) ? S.items.filter(x => x !== id) : [...S.items, id]; save(); audio.sfx('tick'); SCR.items.draw(); }
  function bulk(b) { S.items = b === 0 ? ALL.filter(() => Math.random() < .5) : b === 1 ? [...ALL] : []; save(); audio.sfx('ok'); SCR.items.draw(); }
  const online_ = () => mode === 'online' && room;
  function vote(t) { votes[online.myId] = t; online.ui({ k: 'vote', id: online.myId, t }); audio.sfx('ok'); SCR.map.draw(); }
  function resolveVotes() { const b = Object.values(votes), pick = b.length ? b[Math.floor(Math.random() * b.length)] : 'random', id = pick === 'random' ? TRACKS[Math.floor(Math.random() * TRACKS.length)].id : pick; S.track = id; save(); online.ui({ k: 'result', t: id }); go('start'); }
  const back_ = () => SCR[cur] && SCR[cur].back(), ok_ = () => SCR[cur] && SCR[cur].ok();

  function go(s) { cur = s; racingHidden = false; if (s === 'wait') wcFromWait = false; show('flow'); SCR[s].draw(); }

  addEventListener('keydown', e => {
    if (!root.classList.contains('on') || !SCR[cur] || e.repeat || performance.now() - openedAt < 300) return;
    const inField = e.target && e.target.tagName === 'INPUT';
    if (inField) { if (e.key === 'Escape') { e.target.blur(); e.preventDefault(); } return; }
    const c = e.code;
    if (c === 'Escape' || c === 'Backspace') { audio.sfx('back'); back_(); e.preventDefault(); return; }
    if (SCR[cur].key(c)) { e.preventDefault(); return; }
    if (c === 'Enter' || (c === 'Space' && cur !== 'items')) { if (cur === 'start' || cur === 'entry') { if (cur === 'start') { audio.sfx('ok'); SCR.start.ok(); } } else { audio.sfx('ok'); ok_(); } e.preventDefault(); }
  });

  return {
    startSettings() { settingsFrom = 'main'; openedAt = performance.now(); go('settings'); },
    startSingle() { openedAt = performance.now(); mode = 'single'; room = null; ci = Math.max(0, CHARS.findIndex(c => c.id === lo.char)); go('char'); },
    startOnline() { openedAt = performance.now(); mode = 'online'; msg = ''; if (online.active && room) go('wait'); else go('entry'); },
    onRoom(info) { room = info; mode = 'online'; wcFromWait = false; if (cur === 'entry' || cur === 'none' || !SCR[cur]) { ci = Math.max(0, CHARS.findIndex(c => c.id === lo.char)); go('char'); } else go('wait'); },
    onRoomUpdate(info) { room = info; updTag(); if (cur === 'wait' || cur === 'start') SCR[cur].draw(); },
    onError(m) { msg = m; room = null; mode = 'online'; go('entry'); },
    scoreboard(rows, done) { scoreRows = rows; scoreDone = done; racingHidden = true; go('score'); },
    onUi(m) {
      if (!online_()) return;
      if (m.k === 'phase' && !room.host) { votes = {}; mc = 0; go('map'); }
      else if (m.k === 'vote') { votes[m.id] = m.t; if (cur === 'map') SCR.map.draw(); }
      else if (m.k === 'result' && !room.host) { S.track = m.t; go('start'); }
    },
    hideTag() { racingHidden = true; updTag(); },
    afterRace() { if (mode === 'online' && room) go('wait'); else go('map'); },
    leave() { room = null; mode = 'single'; racingHidden = false; updTag(); },
    get preview() { return root.classList.contains('on') && ['char', 'kart'].includes(cur); },
  };
}
