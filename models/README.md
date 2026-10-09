# Using Blender (or free) models

1. In Blender: **File > Export > glTF 2.0 (.glb)**. Tick "Apply Modifiers", leave "+Y Up" on. Models should face the way
   Blender calls "front" (-Y); they will face forward in the game. Rigged (skinned) characters are fine: they are auto-posed into a driving position.
2. Put the file here, e.g. `models/karts/hotrod.glb`, `models/chars/smiler.glb`, `models/props/hollow_stalagmite.glb`.
3. List it in `manifest.json` using the ids from `js/roster.js` (kart ids: standard, hotrod, cruiser, buggy, bumper, tank;
   character ids: inkkid, bunbun, sprout, smiler, nightmask, dancer, brawler, partygoer, hazmat, golem, brute, yeti;
   prop groups use theme ids: meadow, dunes, frost, neon, hollow, silk, ink, backrooms, brawl, lava, candy):

```json
{
  "karts": { "hotrod": "models/karts/hotrod.glb" },
  "chars": { "smiler": "models/chars/smiler.glb" },
  "props": { "hollow": ["models/props/stalagmite.glb", "models/props/mushroom.glb"] }
}
```
Models are auto-scaled (karts to the kart length, characters to ~2.4 units tall, props to ~12 units) and tinted: in a kart model,
any material named `paint` or `body` takes the player's paint colour. Free CC0 sources: Kenney.nl, Quaternius, Poly Pizza.

## Characters (e.g. an imported Mario in T-pose)
Add the model to `models/chars/` and use the object form in `manifest.json`; the character id must exist in `js/roster.js`:

```json
"chars": { "mario": { "url": "models/chars/mario.glb", "height": 3.2, "yaw": 0, "pose": true } }
```
- `height` - standing height in kart units (default 3.4). Make it smaller if he looks too big in the kart.
- `yaw` - degrees to turn him if he faces backwards or sideways (try 180, 90 or -90).
- `pose` - `true` (default) bends arms/legs of skinned rigs into a seated driving pose; `false` keeps him exactly as exported.
Characters are placed with the hips on the seat automatically, so the model's own origin no longer matters.
