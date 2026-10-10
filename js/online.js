// Online multiplayer over Supabase Realtime (broadcast + presence only: no tables, nothing stored).
// Everyone simulates their own kart; the others (and the host's CPUs) are mirrored from ~15 position updates a second.
import { randomLoadout } from './roster.js';

const SB_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';   // loaded on demand so the game still starts if it's blocked
const SUPABASE_URL = 'https://fbcyonrppxttuaiwikmb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Q9yPEkVjcySlAsEJfuu-4A_-aBWewGs';   // publishable key: safe to ship in client code
const MAX_PLAYERS = 8;

export function createOnline({ TRACKS, getLoadout, onStart, onRoom, onRoomUpdate, onError }) {
  const myId = Math.random().toString(36).slice(2, 10), joinedAt = Date.now();
  let entered = false, sb = null, ch = null, code = '', name = 'Player', players = [], active = false, inRace = false, handlers = {}, lastSend = 0, lastLo = '';

  const sorted = () => [...players].sort((a, b) => (a.t - b.t) || (a.id < b.id ? -1 : 1)).slice(0, MAX_PLAYERS);
  const isHost = () => { const s = sorted(); return s.length > 0 && s[0].id === myId; };
  const info = () => ({ code, host: isHost(), count: sorted().length, players: sorted().map(p => ({ id: p.id, name: p.name, me: p.id === myId, lo: p.lo })) });

  function begin(msg) {
    const byId = Object.fromEntries(players.map(p => [p.id, p])), track = TRACKS.find(t => t.id === msg.track) || TRACKS[0], host = isHost();
    const roster = msg.order.filter(id => byId[id]).map(id => ({ id, name: byId[id].name, lo: byId[id].lo }));
    (msg.bots || []).forEach((b, i) => roster.push({ id: 'bot' + i, name: 'CPU ' + (i + 1), lo: b.lo, bot: true }));
    inRace = true;
    onStart({ track, laps: msg.laps, cls: msg.cls || '1', diff: msg.diff || '0.9', mirror: !!msg.mirror, bots: 0, items: msg.items, gfx: msg.gfx || 'high', lo: getLoadout(), online: { me: myId, host, roster } });
  }
  // host only: o = { trackId, laps, cls, items, bots, diff, mirror }
  function hostStart(o) {
    if (!active || !isHost() || sorted().length < 2) return false; pushLoadout();
    const track = o.trackId === 'random' ? TRACKS[Math.floor(Math.random() * TRACKS.length)] : TRACKS.find(t => t.id === o.trackId) || TRACKS[0];
    const room = Math.max(0, 12 - sorted().length), nb = Math.min(o.bots | 0, room), used = new Set(sorted().map(p => p.lo && p.lo.char)), usedP = new Set(sorted().map(p => p.lo && p.lo.paint));
    const bots = Array.from({ length: nb }, () => ({ lo: randomLoadout(used, usedP) }));
    const msg = { track: track.id, laps: o.laps, cls: o.cls, items: o.items, diff: o.diff, mirror: !!o.mirror, gfx: o.gfx, order: sorted().map(p => p.id), bots };
    ch.send({ type: 'broadcast', event: 'start', payload: msg }); setTimeout(() => begin(msg), 0); return true;
  }
  function pushLoadout() { if (!ch || !active) return; const lo = getLoadout(), j = JSON.stringify(lo); if (j === lastLo) return; lastLo = j; ch.track({ name, lo, t: joinedAt }); }
  setInterval(pushLoadout, 800);

  async function join(c, nm) {
    leave(); entered = false; lastLo = ''; code = c; name = (nm || 'Player').slice(0, 14);
    try {
      if (!sb) { const { createClient } = await import(SB_CDN); sb = createClient(SUPABASE_URL, SUPABASE_KEY, { realtime: { params: { eventsPerSecond: 30 } } }); }
      ch = sb.channel('kz-room-' + code, { config: { presence: { key: myId }, broadcast: { self: false } } });
      ch.on('presence', { event: 'sync' }, () => {
        players = Object.entries(ch.presenceState()).map(([id, v]) => ({ id, ...v[0] }));
        if (inRace) return; if (!entered) { entered = true; onRoom(info()); } else onRoomUpdate(info());
      });
      ch.on('broadcast', { event: 'start' }, ({ payload }) => { if (!inRace) begin(payload); });
      ch.on('broadcast', { event: 's' }, ({ payload }) => handlers.state && handlers.state(payload));
      ch.on('broadcast', { event: 'sb' }, ({ payload }) => handlers.state && payload.forEach(a => handlers.state(a)));
      ch.on('broadcast', { event: 'ui' }, ({ payload }) => handlers.ui && handlers.ui(payload));
      ch.on('broadcast', { event: 'item' }, ({ payload }) => handlers.item && handlers.item(payload));
      ch.subscribe(async st => {
        if (st === 'SUBSCRIBED') { active = true; lastLo = JSON.stringify(getLoadout()); await ch.track({ name, lo: getLoadout(), t: joinedAt }); }
        else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') { leave(); onError('Could not connect — check your internet and try again'); }
      });
    } catch (e) { console.warn('online join failed', e); leave(); onError('Could not connect to the server'); }
  }
  function leave() { if (ch) { try { ch.untrack(); sb.removeChannel(ch); } catch (e) {} } ch = null; active = false; inRace = false; entered = false; players = []; code = ''; }
  const row = k => [k.pid || myId, +k.pos.x.toFixed(2), +k.pos.y.toFixed(2), +k.pos.z.toFixed(2), +k.heading.toFixed(3), +k.speed.toFixed(1), +(k.spin || 0).toFixed(2), +(k.starT || 0).toFixed(1), +(k.shrink || 0).toFixed(1), +(k.boost || 0).toFixed(1), k.drifting ? 1 : 0, +(k.steer || 0).toFixed(2)];

  return {
    create: nm => join(Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 24)]).join(''), nm),
    join, leave, hostStart, info,
    get active() { return active; }, get racing() { return active && inRace; }, get isHost() { return isHost(); }, get myId() { return myId; },
    set handlers(h) { handlers = h; },
    backToLobby() { inRace = false; onRoom(info()); },
    // own kart (and, for the host, the CPU karts), throttled to ~15/s
    sendState(k, bots, now) {
      if (!active || !ch || now - lastSend < 66) return; lastSend = now;
      ch.send({ type: 'broadcast', event: 's', payload: row(k) });
      if (bots && bots.length) ch.send({ type: 'broadcast', event: 'sb', payload: bots.map(row) });
    },
    ui(m) { if (active && ch) ch.send({ type: 'broadcast', event: 'ui', payload: m }); },
    sendItem(type, back, pid) { if (active && ch) ch.send({ type: 'broadcast', event: 'item', payload: { id: pid || myId, type, back: back ? 1 : 0 } }); },
  };
}
