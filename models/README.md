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

### Character looks grey / untextured?
Open the browser console (F12) after the game loads: it lists each material and whether it has a texture.
If it says `texture NONE`, the colours never made it into the `.glb`. In Blender:
1. Switch the viewport to *Material Preview* - if he is grey there too, the textures aren't linked to the material.
2. For each texture image: *Image Editor > Image > Pack*, and make sure it is plugged into the Principled BSDF *Base Color*.
3. *File > Export > glTF 2.0 (.glb)*, expand *Materials* and leave it on **Export** (not "No export"), image format *Automatic* or *PNG/JPEG*
   (not WebP/KTX2 unless you're sure), and untick Draco compression.
Quick fallback: `"color": "#ffffff"` in his manifest entry multiplies his colours, and a hex like `"#e53935"` tints him.

## Posing, facing and materials are automatic now
- **Posing** finds arms/legs from the skeleton's *shape* (long sideways chains = arms, long downward chains = legs), so Sketchfab bone names don't matter.
  If a model has no skeleton (a static mesh) it can't be bent; the console says so. Export it with its armature or use `"pose": false`.
- **Facing** is auto-detected (feet point forward). Only set `"yaw"` if one still faces the wrong way (try 180, 90 or -90).
- **Old materials** (`KHR_materials_pbrSpecularGlossiness`, common on converted Sketchfab files) are recovered automatically.
- **Extra junk in a file** (e.g. a hexagon/platform mesh): `"hide": ["hexagon"]` removes any node whose name contains that word.
  Press F12 and read the `[KZ-Karting]` lines to see mesh names, sizes, textures, chosen yaw and how many limbs were posed.
