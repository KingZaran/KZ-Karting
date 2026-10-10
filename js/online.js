// Online multiplayer lobby + live sync over Supabase Realtime (broadcast + presence only: no tables, nothing stored).
// Everyone simulates their own kart; the others are mirrored from ~15 position updates a second.
const SB_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';   // loaded on demand so the game still starts if it's blocked

const SUPABASE_URL = 'https://fbcyonrppxttuaiwikmb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Q9yPEkVjcySlAsEJfuu-4A_-aBWewGs';   // publishable key: safe to ship in client code
const MAX_PLAYERS = 8;

export function createOnline({ $, show, audio, TRACKS, ITEMS, getLoadout, getSettings, onStart, onBack, onRoom, onRoomUpdate }) {
  const myId = Math.random().toString(36).slice(2, 10);
  const joinedAt = Date.now();
  let entered = false, sb = null, ch = null, code = '', name = '', players = [], active = false, inRace = false, handlers = {}, lastSend = 0, status = '';
  try { name = localStorage.getItem('kz-name') || ''; } catch (e) {}

  // ---------- UI ----------
  const css = document.createElement('style');
  css.textContent = `#online h1{margin:0;font-style:italic;letter-spacing:3px}
  #online .box{background:#151b34e6;border:2px solid #4a5a95;border-radius:18px;padding:20px 24px;width:min(560px,94vw);display:flex;flex-direction:column;gap:12px;color:#fff}
  #online input,#online select{font:inherit;font-size:16px;padding:10px 12px;border-radius:10px;border:2px solid #4a5a95;background:#0d1226;color:#fff}
  #online .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  #online .row>*{flex:1;min-width:120px}
  #online .pl{display:flex;justify-content:space-between;background:#2a3566;border-radius:10px;padding:8px 12px}
  #online .pl b{color:#ffd34a}
  #online .code{font-size:34px;letter-spacing:8px;text-align:center;font-style:italic}
  #online .msg{opacity:.75;font-size:13px;text-align:center;min-height:16px}`;
  document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'online'; el.className = 'screen glass'; document.body.appendChild(el);

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const setMsg = t => { status = t; const m = el.querySelector('.msg'); if (m) m.textContent = t; };

  function renderEntry() {
    el.innerHTML = `<h1>ONLINE</h1><div class="box">
      <input id="onName" maxlength="14" placeholder="Your name" value="${esc(name)}">
      <div class="row"><button class="go" id="onCreate">Create room</button></div>
      <div class="row"><input id="onCode" maxlength="4" placeholder="CODE" style="text-transform:uppercase"><button class="sec" id="onJoin">Join room</button></div>
      <div class="msg">${esc(status)}</div><button class="sec" id="onBack">Back</button></div>`;
    const nm = () => { name = ($('onName').value.trim() || 'Player').slice(0, 14); try { localStorage.setItem('kz-name', name); } catch (e) {} return name; };
    $('onCreate').onclick = () => { nm(); audio.sfx('ok'); join(Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]).join('')); };
    $('onJoin').onclick = () => { nm(); const c = $('onCode').value.trim().toUpperCase(); if (c.length !== 4) return setMsg('Enter the 4-letter room code'); audio.sfx('ok'); join(c); };
    $('onBack').onclick = () => { audio.sfx('back'); leave(); onBack(); };
  }

  const sorted = () => [...players].sort((a, b) => (a.t - b.t) || (a.id < b.id ? -1 : 1)).slice(0, MAX_PLAYERS);
  const isHost = () => { const s = sorted(); return s.length && s[0].id === myId; };

  const info = () => ({ code, host: isHost(), names: sorted().map(p => p.name + (p.id === myId ? ' (you)' : '')), count: sorted().length });
  function hostStart() {
    if (!active || !isHost()) return; pushLoadout();
    const st = getSettings(), tid = st.trackId, track = tid === 'random' ? TRACKS[Math.floor(Math.random() * TRACKS.length)] : TRACKS.find(t => t.id === tid) || TRACKS[0];
    const msg = { track: track.id, laps: st.laps, cls: st.cls, items: st.items, order: sorted().map(p => p.id) };
    ch.send({ type: 'broadcast', event: 'start', payload: msg }); setTimeout(() => begin(msg), 0);
  }
  let lastLo = '';
  function pushLoadout() { if (!ch || !active) return; const lo = getLoadout(), j = JSON.stringify(lo); if (j === lastLo) return; lastLo = j; ch.track({ name: name || 'Player', lo, t: joinedAt }); }
  setInterval(pushLoadout, 1000);

  function begin(msg) {
    const byId = Object.fromEntries(players.map(p => [p.id, p])), track = TRACKS.find(t => t.id === msg.track) || TRACKS[0];
    const roster = msg.order.filter(id => byId[id]).map(id => ({ id, name: byId[id].name, lo: byId[id].lo }));
    inRace = true;
    onStart({ track, laps: msg.laps, cls: msg.cls || '1', diff: '0.9', bots: 0, items: msg.items || ITEMS.map(i => i[0]), gfx: getSettings().gfx, lo: getLoadout(), online: { me: myId, roster } });
  }

  async function join(c) {
    leave(); entered = false; lastLo = ''; code = c; setMsg(''); el.innerHTML = '<h1>ONLINE</h1><div class="box"><div class="msg">Connecting…</div></div>';
    try {
      if (!sb) { const { createClient } = await import(SB_CDN); sb = createClient(SUPABASE_URL, SUPABASE_KEY, { realtime: { params: { eventsPerSecond: 30 } } }); }
      ch = sb.channel('kz-room-' + code, { config: { presence: { key: myId }, broadcast: { self: false } } });
      ch.on('presence', { event: 'sync' }, () => {
        players = Object.entries(ch.presenceState()).map(([id, v]) => ({ id, ...v[0] }));
        if (inRace) return; if (!entered) { entered = true; onRoom(info()); } else onRoomUpdate(info());
      });
      ch.on('broadcast', { event: 'start' }, ({ payload }) => { if (!inRace) begin(payload); });
      ch.on('broadcast', { event: 's' }, ({ payload }) => handlers.state && handlers.state(payload));
      ch.on('broadcast', { event: 'item' }, ({ payload }) => handlers.item && handlers.item(payload));
      ch.subscribe(async st => {
        if (st === 'SUBSCRIBED') { active = true; lastLo = JSON.stringify(getLoadout()); await ch.track({ name: name || 'Player', lo: getLoadout(), t: joinedAt }); }
        else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') { active = false; setMsg('Could not connect — check your internet and try again'); renderEntry(); }
      });
    } catch (e) { console.warn('online join failed', e); setMsg('Could not connect to the server'); renderEntry(); }
  }

  function leave() { if (ch) { try { ch.untrack(); sb.removeChannel(ch); } catch (e) {} } ch = null; active = false; inRace = false; entered = false; players = []; }

  return {
    open() { if (active) onRoom(info()); else { renderEntry(); show('online'); } },
    get active() { return active; },
    get racing() { return active && inRace; },
    set handlers(h) { handlers = h; },
    // back from a race: stay in the room so the host can start another one
    backToLobby() { inRace = false; onRoom(info()); },
    hostStart, info,
    leave,
    // own kart state, throttled to ~15/s
    sendState(k, now) {
      if (!active || !ch || now - lastSend < 66) return; lastSend = now;
      ch.send({ type: 'broadcast', event: 's', payload: [myId, +k.pos.x.toFixed(2), +k.pos.y.toFixed(2), +k.pos.z.toFixed(2), +k.heading.toFixed(3), +k.speed.toFixed(1), +(k.spin || 0).toFixed(2), +(k.starT || 0).toFixed(1), +(k.shrink || 0).toFixed(1), +(k.boost || 0).toFixed(1), k.drifting ? 1 : 0, +(k.steer || 0).toFixed(2)] });
    },
    sendItem(type, back) { if (active && ch) ch.send({ type: 'broadcast', event: 'item', payload: { id: myId, type, back: back ? 1 : 0 } }); },
  };
}
