// Track definitions. Step 4 will replace these with fully themed zones.
const ring = (n, f) => Array.from({ length: n }, (_, k) => { const a = k / n * Math.PI * 2, r = f(a); return [Math.cos(a) * r, Math.sin(a) * r]; });
export const TRACKS = [
  { id: 'meadow', name: 'Sunny Meadow', width: 20, sky: 0x87ceeb, ground: 0x3f8f3f, road: 0x333338, decor: 'cone', decorColor: 0x1f6b2f,
    pts: [[0,0],[80,-20],[140,40],[120,130],[40,170],[-60,140],[-120,70],[-90,-20],[-40,-40]] },
  { id: 'dunes', name: 'Dune Run', width: 22, sky: 0xf2b266, ground: 0xd9b56c, road: 0x4a3f36, decor: 'cyl', decorColor: 0x4d8b3a,
    pts: [[0,0],[100,0],[180,40],[200,120],[150,180],[80,150],[40,200],[-40,220],[-120,180],[-130,100],[-60,60],[-80,0]] },
  { id: 'neon', name: 'Neon Night', width: 18, sky: 0x070818, ground: 0x10122a, road: 0x1b1b2e, decor: 'box', decorColor: 0xff2bd6, night: true,
    pts: [[0,0],[60,-40],[130,-30],[170,30],[140,90],[80,110],[90,170],[40,220],[-30,200],[-50,140],[-110,120],[-150,60],[-100,0],[-50,-20]] },
  { id: 'frost', name: 'Frost Ring', width: 24, sky: 0xcfe8f5, ground: 0xf2f7fa, road: 0x5d6b78, decor: 'cone', decorColor: 0x9fc4d6,
    pts: ring(12, a => 140 + 35 * Math.sin(3 * a + 1)) },
];
export const ITEMS = [
  ['banana','Peel'],['banana3','Triple Peel'],['gshell','Bounce Shell'],['gshell3','Triple Bounce Shell'],
  ['rshell','Seeker Shell'],['rshell3','Triple Seeker Shell'],['bomb','Blast Orb'],['mush','Speed Fungus'],
  ['mush3','Triple Fungus'],['gmush','Gold Fungus'],['star','Invincibility Star'],['ink','Ink Cloud'],
  ['bolt','Storm Bolt'],['rocket','Rocket Rider'],['bshell','Spiny Seeker'],['fire','Fire Bloom'],
  ['boom','Boomerang Bloom'],['plant','Chomper Plant'],['horn','Air Horn'],['eight','Lucky Eight'],['coin','Coin'],
];
