// Characters, karts, wheels and paint. Stats are 0-10 and feed straight into the physics.
export const CHARS = [
  { id: 'mario', name: 'Mario', cls: 'Medium', kind: '8-deluxe', stats: { speed: 6, accel: 6, handling: 6, weight: 6, drift: 5 }, c: { body: 0xf0f6fa, skin: 0x8fd0ff, accent: 0x8fd0ff } },
  { id: 'luigi', name: 'Luigi', cls: 'Medium', kind: '8-deluxe', stats: { speed: 7, accel: 6, handling: 6, weight: 6, drift: 5 }, c: { body: 0xf0f6fa, skin: 0x8fd0ff, accent: 0x8fd0ff } },
  { id: 'donkey-kong', name: 'Donkey Kong', cls: 'Heavy', kind: '8-deluxe', stats: { speed: 9, accel: 4, handling: 4, weight: 8, drift: 4 }, c: { body: 0xf0f6fa, skin: 0x8fd0ff, accent: 0x8fd0ff } },
  { id: 'bowser', name: 'Bowser', cls: 'Heavy', kind: '8-deluxe', stats: { speed: 10, accel: 3, handling: 3, weight: 10, drift: 3 }, c: { body: 0xf0f6fa, skin: 0x8fd0ff, accent: 0x8fd0ff } },
  { id: 'bowser-jr', name: 'Bowser Jr.', cls: 'Light', kind: '8-deluxe', stats: { speed: 4, accel: 8, handling: 8, weight: 3, drift: 7 }, c: { body: 0xf0f6fa, skin: 0x8fd0ff, accent: 0x8fd0ff } },
  { id: 'cat-peach', name: 'Cat Peach', cls: 'Medium', kind: '8-deluxe', stats: { speed: 6, accel: 6, handling: 7, weight: 5, drift: 7 }, c: { body: 0xf0f6fa, skin: 0x8fd0ff, accent: 0x8fd0ff } },
  { id: 'daisy', name: 'Daisy', cls: 'Medium', kind: '8-deluxe', stats: { speed: 7, accel: 6, handling: 7, weight: 5, drift: 6 }, c: { body: 0xf0f6fa, skin: 0x8fd0ff, accent: 0x8fd0ff } },
  { id: 'larry', name: 'Larry Koopa', cls: 'Light', kind: '8-deluxe', stats: { speed: 5, accel: 7, handling: 7, weight: 3, drift: 7 }, c: { body: 0xf0f6fa, skin: 0x8fd0ff, accent: 0x8fd0ff } },
  { id: 'lemmy', name: 'Lemmy Koopa', cls: 'Light', kind: '8-deluxe', stats: { speed: 2, accel: 10, handling: 10, weight: 1, drift: 10 }, c: { body: 0xf0f6fa, skin: 0x8fd0ff, accent: 0x8fd0ff } },
  { id: 'ludwig', name: 'Ludwig von Koopa', cls: 'Medium', kind: '8-deluxe', stats: { speed: 7, accel: 6, handling: 6, weight: 6, drift: 5 }, c: { body: 0xf0f6fa, skin: 0x8fd0ff, accent: 0x8fd0ff } },
  { id: 'morton', name: 'Morton Koopa Jr.', cls: 'Heavy', kind: '8-deluxe', stats: { speed: 10, accel: 4, handling: 3, weight: 10, drift: 3 }, c: { body: 0xf0f6fa, skin: 0x8fd0ff, accent: 0x8fd0ff } },
  { id: 'peach', name: 'Peach', cls: 'Medium', kind: '8-deluxe', stats: { speed: 7, accel: 6, handling: 7, weight: 5, drift: 6 }, c: { body: 0xf0f6fa, skin: 0x8fd0ff, accent: 0x8fd0ff } },
  { id: 'rosalina', name: 'Rosalina', cls: 'Heavy', kind: '8-deluxe', stats: { speed: 8, accel: 5, handling: 5, weight: 7, drift: 5 }, c: { body: 0xf0f6fa, skin: 0x8fd0ff, accent: 0x8fd0ff } },
  { id: 'roy', name: 'Roy Koopa', cls: 'Heavy', kind: '8-deluxe', stats: { speed: 9, accel: 5, handling: 4, weight: 8, drift: 4 }, c: { body: 0xf0f6fa, skin: 0x8fd0ff, accent: 0x8fd0ff } },
  { id: 'waluigi', name: 'Waluigi', cls: 'Heavy', kind: '8-deluxe', stats: { speed: 9, accel: 5, handling: 4, weight: 8, drift: 4 }, c: { body: 0xf0f6fa, skin: 0x8fd0ff, accent: 0x8fd0ff } },
  { id: 'wario', name: 'Wario', cls: 'Heavy', kind: '8-deluxe', stats: { speed: 10, accel: 3, handling: 3, weight: 10, drift: 3 }, c: { body: 0xf0f6fa, skin: 0x8fd0ff, accent: 0x8fd0ff } },
  { id: 'hazmat-main', name: 'Hazmat', cls: 'Medium', kind: 'backrooms', stats: { speed: 7, accel: 4, handling: 4, weight: 7, drift: 5 }, c: { body: 0xf0f6fa, skin: 0x8fd0ff, accent: 0x8fd0ff } },
  { id: 'skinwalker', name: 'Skinwalker', cls: 'Heavy', kind: 'backrooms', stats: { speed: 9, accel: 3, handling: 4, weight: 9, drift: 4 }, c: { body: 0xf0f6fa, skin: 0x8fd0ff, accent: 0x8fd0ff } },
];
export const KARTS = [
  { id: 'standard', name: 'Standard Kart', mod: { speed: 6, accel: 5, handling: 5, weight: 6, drift: 6 }, l: 3.6, w: 2.2, h: .7, size: 1 },
  { id: 'hotrod', name: 'Hot Rod', mod: { speed: 2, accel: -2, handling: -1, weight: 0, drift: 0 }, l: 4.2, w: 1.9, h: .6, size: 1 },
  { id: 'cruiser', name: 'Cruiser', mod: { speed: 1, accel: -1, handling: -1, weight: 2, drift: 0 }, l: 4, w: 2.5, h: .8, size: 1.1 },
  { id: 'buggy', name: 'Dune Buggy', mod: { speed: -1, accel: 2, handling: 1, weight: -1, drift: 1 }, l: 3.4, w: 2.1, h: .6, size: 1 },
  { id: 'bumper', name: 'Bumper Cart', mod: { speed: -2, accel: 1, handling: 2, weight: -2, drift: 1 }, l: 3, w: 2.4, h: .7, size: .92 },
  { id: 'tank', name: 'Mini Tank', mod: { speed: -1, accel: -1, handling: -2, weight: 3, drift: -1 }, l: 4, w: 2.6, h: .9, size: 1.12 },
];
export const WHEELS = [
  { id: 'standard', name: 'Standard', mod: { speed: 0, accel: 0, handling: 0, weight: 0, drift: 0 }, r: .55, wd: .5, off: .4, col: 0x111111 },
  { id: 'slick', name: 'Slick', mod: { speed: 1, accel: -1, handling: 0, weight: 0, drift: 0 }, r: .5, wd: .75, off: .3, col: 0x222a33 },
  { id: 'mud', name: 'Off-Road', mod: { speed: -1, accel: 0, handling: -1, weight: 1, drift: 0 }, r: .72, wd: .7, off: .68, col: 0x2a1a0a },
  { id: 'roller', name: 'Roller', mod: { speed: -1, accel: 2, handling: 1, weight: 0, drift: 0 }, r: .45, wd: .45, off: .4, col: 0xd02020 },
];
export const PAINT = [
  { name: 'Red', hex: 0xe53935 }, { name: 'Blue', hex: 0x1e88e5 }, { name: 'Green', hex: 0x43a047 }, { name: 'Yellow', hex: 0xfdd835 },
  { name: 'Purple', hex: 0x8e24aa }, { name: 'Orange', hex: 0xfb8c00 }, { name: 'Cyan', hex: 0x00acc1 }, { name: 'Pink', hex: 0xd81b60 },
  { name: 'White', hex: 0xeeeeee }, { name: 'Black', hex: 0x2a2a2a },
];

export const STAT_KEYS = [['speed', 'Speed'], ['accel', 'Acceleration'], ['handling', 'Handling'], ['weight', 'Weight'], ['drift', 'Drift']];
const find = (list, id) => list.find(x => x.id === id) || list[0];
export const getChar = id => find(CHARS, id), getKart = id => find(KARTS, id), getWheel = id => find(WHEELS, id);
export function validLoadout(lo = {}) {
  return { char: getChar(lo.char).id, kart: getKart(lo.kart).id, wheel: getWheel(lo.wheel).id, paint: Math.max(0, Math.min(PAINT.length - 1, Math.floor(+lo.paint || 0))) };
}
export function computeStats(lo) {
  const C = getChar(lo.char), K = getKart(lo.kart), W = getWheel(lo.wheel), s = {};
  // shown stat = average of the character's stat and the kart's and wheels' stats (kart/wheel mods are centred on 5)
  const cl = v => Math.max(0, Math.min(10, v)), e = {};
  for (const [k] of STAT_KEYS) { s[k] = Math.round((C.stats[k] + cl(5 + K.mod[k] * 1.5) + cl(5 + W.mod[k] * 1.5)) / 3 * 10) / 10; e[k] = cl(5 + (s[k] - 5) * 1.6); }   // e = spread back out for the physics so characters still feel different
  return { ...s, speedMul: .9 + .02 * e.speed, accMul: .7 + .06 * e.accel, hand: .8 + .04 * e.handling, driftMul: .7 + .06 * e.drift,
    mass: .7 + .12 * e.weight, size: (.9 + .03 * e.weight) * K.size, spinMul: 1.2 - .04 * e.weight, offMul: W.off };
}
export function randomLoadout(usedChars = new Set(), usedPaints = new Set()) {
  const pick = a => a[Math.floor(Math.random() * a.length)];
  let pool = CHARS.filter(c => !usedChars.has(c.id)); if (!pool.length) pool = CHARS;
  let pp = PAINT.map((_, i) => i).filter(i => !usedPaints.has(i)); if (!pp.length) pp = PAINT.map((_, i) => i);
  const lo = { char: pick(pool).id, kart: pick(KARTS).id, wheel: pick(WHEELS).id, paint: pick(pp) };
  usedChars.add(lo.char); usedPaints.add(lo.paint); return lo;
}
