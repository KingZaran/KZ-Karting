// Hand-drawn item sprites (canvas, original designs). itemIcon(id) -> data URL.
const cache = {};
const circ = (g, x, y, r, fill, stroke, lw = 4) => { g.beginPath(); g.arc(x, y, r, 0, 6.2832); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } };
const grad = (g, x, y, r, c0, c1) => { const q = g.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r); q.addColorStop(0, c0); q.addColorStop(1, c1); return q; };
const poly = (g, pts, fill, stroke, lw = 4) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.lineWidth = lw; g.lineJoin = 'round'; g.strokeStyle = stroke; g.stroke(); } };
const eyes = (g, x, y, d = 9, r = 4) => { for (const s of [-1, 1]) { circ(g, x + s * d, y, r + 2, '#fff', '#222', 2); circ(g, x + s * d + 1, y + 1, r - 1, '#111'); } };
function shell(g, c0, c1, spikes) {
  if (spikes) for (let i = 0; i < 10; i++) { const a = i / 10 * 6.2832; poly(g, [[48 + Math.cos(a - .18) * 30, 52 + Math.sin(a - .18) * 30], [48 + Math.cos(a) * 44, 52 + Math.sin(a) * 44], [48 + Math.cos(a + .18) * 30, 52 + Math.sin(a + .18) * 30]], '#fff', '#333', 2); }
  circ(g, 48, 52, 32, '#f4efe0', '#333', 4); circ(g, 48, 52, 25, grad(g, 48, 52, 25, c0, c1), '#222', 3);
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; for (let i = 0; i < 6; i++) { const a = i / 6 * 6.2832; g.beginPath(); g.moveTo(48 + Math.cos(a) * 8, 52 + Math.sin(a) * 8); g.lineTo(48 + Math.cos(a) * 24, 52 + Math.sin(a) * 24); g.stroke(); }
  circ(g, 48, 52, 8, null, 'rgba(255,255,255,.7)', 3);
}
function mush(g, c0, c1, gold) {
  g.fillStyle = '#f8ecd0'; g.strokeStyle = '#333'; g.lineWidth = 4; g.beginPath(); g.roundRect(30, 52, 36, 34, 12); g.fill(); g.stroke(); eyes(g, 48, 68, 7, 3);
  g.beginPath(); g.moveTo(10, 56); g.bezierCurveTo(8, 8, 88, 8, 86, 56); g.closePath(); g.fillStyle = grad(g, 48, 34, 44, c0, c1); g.fill(); g.stroke();
  [[28, 36, 8], [66, 36, 8], [48, 24, 9]].forEach(([x, y, r]) => circ(g, x, y, r, gold ? '#fff7b0' : '#fff'));
}
const ART = {
  banana(g) { g.beginPath(); g.moveTo(20, 18); g.quadraticCurveTo(92, 16, 72, 84); g.quadraticCurveTo(70, 50, 20, 18); g.fillStyle = '#ffe135'; g.fill(); g.lineWidth = 5; g.lineJoin = 'round'; g.strokeStyle = '#7a5a00'; g.stroke(); circ(g, 20, 18, 5, '#5a3a00'); circ(g, 72, 84, 5, '#5a3a00'); },
  gshell(g) { shell(g, '#7dff6b', '#1f9a2b'); }, rshell(g) { shell(g, '#ff8a80', '#c01818'); }, bshell(g) { shell(g, '#8ab8ff', '#1646c8', true); },
  bomb(g) { circ(g, 48, 58, 30, grad(g, 48, 58, 30, '#666', '#111'), '#000', 3); eyes(g, 48, 56, 9, 3); g.strokeStyle = '#a66'; g.lineWidth = 5; g.beginPath(); g.moveTo(58, 30); g.quadraticCurveTo(66, 16, 76, 18); g.stroke(); poly(g, [[76, 8], [80, 16], [90, 18], [82, 23], [84, 32], [76, 26], [68, 31], [71, 22], [64, 16], [72, 15]], '#ffd400', '#e06000', 2); poly(g, [[28, 86], [38, 86], [36, 92], [26, 92]], '#d22', '#000', 2); poly(g, [[58, 86], [68, 86], [70, 92], [60, 92]], '#d22', '#000', 2); },
  mush(g) { mush(g, '#ff7a7a', '#c81818'); }, gmush(g) { mush(g, '#fff176', '#d49a00', true); },
  star(g) { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 18 : 42; p.push([48 + Math.cos(a) * r, 52 + Math.sin(a) * r]); } poly(g, p, '#ffe14a', '#c77a00', 5); eyes(g, 48, 52, 8, 3); },
  ink(g) { g.fillStyle = '#7fe0ff'; g.strokeStyle = '#1b4a7a'; g.lineWidth = 4; g.beginPath(); g.moveTo(48, 6); g.bezierCurveTo(88, 30, 80, 56, 70, 60); for (let i = 0; i < 4; i++) g.quadraticCurveTo(66 - i * 14, 96, 58 - i * 14, 70 + (i % 2 ? 6 : 0)); g.bezierCurveTo(14, 56, 8, 30, 48, 6); g.fill(); g.stroke(); eyes(g, 48, 40, 10, 4); },
  bolt(g) { poly(g, [[58, 4], [20, 54], [44, 54], [32, 94], [78, 38], [54, 38], [70, 4]], '#ffd400', '#3a2a00', 5); },
  rocket(g) { poly(g, [[8, 52], [22, 40], [22, 64]], '#ff8a00', '#400', 3); g.fillStyle = '#222'; g.strokeStyle = '#000'; g.lineWidth = 4; g.beginPath(); g.roundRect(20, 30, 62, 44, 22); g.fill(); g.stroke(); circ(g, 70, 52, 22, '#333', '#000', 3); eyes(g, 66, 46, 8, 3); g.fillStyle = '#e22'; g.beginPath(); g.arc(66, 66, 6, 0, 3.14); g.fill(); poly(g, [[34, 30], [46, 16], [52, 30]], '#555', '#000', 3); },
  fire(g) { g.strokeStyle = '#2d8f2d'; g.lineWidth = 7; g.beginPath(); g.moveTo(48, 92); g.lineTo(48, 56); g.stroke(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.2832; circ(g, 48 + Math.cos(a) * 22, 38 + Math.sin(a) * 22, 14, i % 2 ? '#ff9a1f' : '#ff4a1f', '#7a1500', 3); } circ(g, 48, 38, 15, grad(g, 48, 38, 15, '#fff6a0', '#ffc400'), '#7a5a00', 3); eyes(g, 48, 38, 5, 2); },
  boom(g) { g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(16, 24); g.quadraticCurveTo(80, 18, 76, 82); g.strokeStyle = '#4a2a00'; g.lineWidth = 22; g.stroke(); g.strokeStyle = '#ffb300'; g.lineWidth = 14; g.stroke(); g.strokeStyle = '#fff1a8'; g.lineWidth = 3; g.beginPath(); g.moveTo(22, 24); g.quadraticCurveTo(76, 24, 71, 76); g.stroke(); circ(g, 76, 82, 5, '#d22'); },
  plant(g) { poly(g, [[26, 62], [70, 62], [64, 92], [32, 92]], '#3aa63a', '#14501a', 4); g.fillStyle = '#d22'; g.strokeStyle = '#500'; g.lineWidth = 4; g.beginPath(); g.arc(48, 38, 28, 0, 6.2832); g.fill(); g.stroke(); [[34, 26], [60, 24], [64, 44]].forEach(([x, y]) => circ(g, x, y, 5, '#fff')); g.fillStyle = '#400'; g.beginPath(); g.ellipse(48, 46, 20, 11, 0, 0, 3.14); g.fill(); for (let i = 0; i < 4; i++) poly(g, [[32 + i * 11, 46], [38 + i * 11, 46], [35 + i * 11, 54]], '#fff', null); },
  horn(g) { poly(g, [[8, 44], [8, 62], [44, 64], [44, 40]], '#e0a800', '#5a3a00', 4); g.beginPath(); g.moveTo(44, 40); g.lineTo(84, 18); g.quadraticCurveTo(96, 52, 84, 86); g.lineTo(44, 64); g.closePath(); g.fillStyle = grad(g, 70, 52, 40, '#ffe680', '#d49a00'); g.fill(); g.strokeStyle = '#5a3a00'; g.lineWidth = 4; g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(70, 52, 10, -1, 1); g.stroke(); },
  eight(g) { circ(g, 48, 52, 36, grad(g, 48, 52, 36, '#ff7a7a', '#b00'), '#400', 4); g.fillStyle = '#fff'; g.strokeStyle = '#400'; g.lineWidth = 4; g.font = '900 56px Arial Black, Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeText('8', 48, 54); g.fillText('8', 48, 54); },
  coin(g) { circ(g, 48, 52, 36, grad(g, 48, 52, 36, '#fff3a0', '#d49a00'), '#6a4a00', 5); circ(g, 48, 52, 26, null, '#a87a00', 4); g.fillStyle = '#a87a00'; g.beginPath(); g.roundRect(43, 36, 10, 32, 4); g.fill(); },
};
export function itemIcon(id) {
  if (cache[id]) return cache[id];
  const c = document.createElement('canvas'); c.width = c.height = 96; const g = c.getContext('2d'), triple = id.endsWith('3'), base = triple ? id.slice(0, -1) : id;
  const art = ART[base] || ART.coin;
  if (triple) [[.62, 30, 10], [.62, 10, 44], [.62, 50, 44]].forEach(([s, x, y]) => { g.save(); g.translate(x, y); g.scale(s, s); art(g); g.restore(); }); else art(g);
  return cache[id] = c.toDataURL();
}

// Custom item art: drop PNGs in  icons/items/<item id>.png  (ids: banana, banana3, gshell, gshell3, rshell, rshell3, bomb, mush, mush3, gmush, star, ink, bolt, rocket, bshell, fire, boom, plant, horn, eight, coin).
// Any <img data-item="id"> inside `root` gets the PNG, falling back to the built-in sprite when there isn't one.
export function fixItemImgs(root) {
  root.querySelectorAll('img[data-item]').forEach(img => { const id = img.dataset.item; if (img.dataset.set === id) return; img.dataset.set = id; img.onerror = () => { img.onerror = null; img.src = itemIcon(id); }; img.src = 'icons/items/' + id + '.png'; });
}
