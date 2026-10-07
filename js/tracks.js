// Tracks: control points + zones [themeId, endFraction]. Themes live in themes.js.
const ring = (n, f) => Array.from({ length: n }, (_, k) => { const a = k / n * Math.PI * 2, r = f(a); return [Math.cos(a) * r, Math.sin(a) * r]; });
const SHAPE = {
  loop: [[0,0],[80,-20],[140,40],[120,130],[40,170],[-60,140],[-120,70],[-90,-20],[-40,-40]],
  wide: [[0,0],[100,0],[180,40],[200,120],[150,180],[80,150],[40,200],[-40,220],[-120,180],[-130,100],[-60,60],[-80,0]],
  twist: [[0,0],[60,-40],[130,-30],[170,30],[140,90],[80,110],[90,170],[40,220],[-30,200],[-50,140],[-110,120],[-150,60],[-100,0],[-50,-20]],
  kidney: ring(10, a => 150 + 50 * Math.cos(2 * a)),
  hairpin: [[0,0],[120,-10],[220,30],[260,100],[200,150],[100,120],[60,170],[100,230],[180,260],[120,320],[10,300],[-60,240],[-70,150],[-50,60]],
  frost: ring(12, a => 140 + 35 * Math.sin(3 * a + 1)),
};
export const TRACKS = [
  { id: 'circuit', name: 'Grand Circuit', width: 20, elev: [15, 4, 2, 0, 2, 5, 1], pts: SHAPE.loop, zones: [['meadow', .34], ['ink', .67], ['dunes', 1]] },
  { id: 'hollow', name: 'Hollow Depths', width: 18, elev: [16, 5, 3, .5, 2, 6, 2], pts: SHAPE.twist, zones: [['hollow', .5], ['silk', 1]] },
  { id: 'inkarena', name: 'Ink Arena Rush', width: 22, elev: [17, 5, 2, 1, 3, 4, 0], pts: SHAPE.kidney, zones: [['ink', .4], ['neon', .7], ['brawl', 1]] },
  { id: 'halls', name: 'The Yellow Halls', width: 20, elev: [14, 3, 2, 0, 1.5, 5, 1], pts: SHAPE.wide, zones: [['backrooms', .6], ['neon', .8], ['backrooms', 1]] },
  { id: 'mayhem', name: 'Crossover Mayhem', width: 22, elev: [20, 6, 3, 0, 3, 5, 2], pts: SHAPE.hairpin, zones: [['meadow', .16], ['hollow', .33], ['ink', .5], ['backrooms', .66], ['brawl', .83], ['silk', 1]] },
  { id: 'frostfire', name: 'Frost & Fire', width: 24, elev: [16, 4, 3, 1, 2, 6, 0], pts: SHAPE.frost, zones: [['frost', .34], ['lava', .67], ['candy', 1]] },
];
export const ITEMS = [
  ['banana','Peel'],['banana3','Triple Peel'],['gshell','Bounce Shell'],['gshell3','Triple Bounce Shell'],
  ['rshell','Seeker Shell'],['rshell3','Triple Seeker Shell'],['bomb','Blast Orb'],['mush','Speed Fungus'],
  ['mush3','Triple Fungus'],['gmush','Gold Fungus'],['star','Invincibility Star'],['ink','Ink Cloud'],
  ['bolt','Storm Bolt'],['rocket','Rocket Rider'],['bshell','Spiny Seeker'],['fire','Fire Bloom'],
  ['boom','Boomerang Bloom'],['plant','Chomper Plant'],['horn','Air Horn'],['eight','Lucky Eight'],['coin','Coin'],
];
