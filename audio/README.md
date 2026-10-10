# Custom audio

Drop `.wav` (or `.mp3`) files in this folder. Any file that exists replaces the built-in synthesised sound; missing ones keep the default.

**Sound effects** (played once): `tick` (menu move), `ok`, `back`, `beep` (countdown), `go`, `pickup` (item box), `use` (item used), `boost`, `hit`, `boom` (explosion), `lap`, `fall` (falling off the map)

**Item sounds:** `use-<item>.wav` plays when that item is used and falls back to `use` (or `boost`) if missing: banana, gshell, rshell, bshell, bomb, mush, gmush, star, ink, bolt, rocket, fire, boom, plant, horn, coin (triple items use the same file as the single one).

Sounds layer on top of each other, and the music dips briefly under loud ones. A music file keeps playing across zones unless you supply a `music-<zone>` file.

**Loops**
- `engine.wav` - engine loop (pitch rises with speed)
- `drift.wav` - tyre skid loop (louder while drifting / off-road)
- `music.wav` - race music for every zone
- `music-<zone>.wav` - music for one zone only, e.g. `music-meadow.wav`. Zones: meadow, dunes, frost, neon, hollow, silk, ink, backrooms, brawl (plus any others defined in `js/themes.js`)

Keep loops seamless (they repeat) and fairly short; every file is downloaded when the game starts.
