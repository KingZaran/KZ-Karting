// Garage panel: character / kart / wheels / paint selectors + live stat bars.
import { CHARS, KARTS, WHEELS, PAINT, STAT_KEYS, computeStats, validLoadout, getChar } from './roster.js';
export function initGarageUI({ $, audio, garage, lo0 }) {
  let lo = validLoadout(lo0);
  const defs = [['char', 'Character', CHARS], ['kart', 'Kart', KARTS], ['wheel', 'Wheels', WHEELS], ['paint', 'Paint', PAINT]];
  const hex = n => '#' + n.toString(16).padStart(6, '0'), api = { onFocus: () => {} };
  const rows = defs.map(([key, label, list], i) => {
    const row = document.createElement('div'); row.className = 'row s';
    row.innerHTML = `<span>${label}</span><span class="val"><b class="ar">◀</b><em></em><b class="ar">▶</b></span>`; $('grows').append(row);
    const ars = row.querySelectorAll('.ar'); ars[0].onclick = e => { e.stopPropagation(); change(i, -1); }; ars[1].onclick = e => { e.stopPropagation(); change(i, 1); };
    row.onclick = () => api.onFocus(i); return row;
  });
  const bars = STAT_KEYS.map(([k, label]) => { const d = document.createElement('div'); d.className = 'stat'; d.innerHTML = `<span>${label}</span><div class="bar"><i></i></div><b></b>`; $('gstats').append(d); return [k, d]; });
  const idxOf = (key, list) => key === 'paint' ? lo.paint : Math.max(0, list.findIndex(x => x.id === lo[key]));
  function update() {
    defs.forEach(([key, , list], i) => {
      const it = list[idxOf(key, list)], em = rows[i].querySelector('em');
      em.innerHTML = key === 'paint' ? `<span class="sw" style="background:${hex(it.hex)}"></span>${it.name}` : it.name;
    });
    const st = computeStats(lo); bars.forEach(([k, d]) => { d.querySelector('i').style.width = st[k] * 10 + '%'; d.querySelector('b').textContent = st[k]; });
    const C = getChar(lo.char); $('gname').innerHTML = `${C.name}<small>${C.cls.toUpperCase()}</small>`;
    garage.set(lo, PAINT[lo.paint].hex);
  }
  function change(i, d) {
    const [key, , list] = defs[i], n = list.length, cur = idxOf(key, list), nx = (cur + d + n) % n;
    lo = { ...lo, [key]: key === 'paint' ? nx : list[nx].id }; update(); audio.sfx('tick');
  }
  update();
  Object.assign(api, { rows, change, get: () => ({ ...lo }) }); return api;
}
