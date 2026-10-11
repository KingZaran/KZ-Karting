# Custom audio

Everything lives directly in `audio/`. Each name can be `.mp3` or `.wav`. Missing files fall back to the built-in synth sounds (or silence for music).

## Music / jingles (.mp3)
| File | When it plays |
|---|---|
| `menu` | Title ("press Enter") screen on first load, continues onto the single player / online / settings screen |
| `menu-no-intro` | Going back to the main menu (and the title screen) after you've been in single player or online |
| `single-player` | After pressing Single Player, across all single player screens |
| `online-multiplayer` | After pressing Online Multiplayer, across all online screens |
| `course-intro` | During the course fly-through before a race (stops when skipped with Enter / tap / any pad button, or when it ends) |
| `starting-grid` | After the course intro, before the countdown |
| `countdown` | During the 3, 2, 1 countdown (put the GO! in it too; the synth beeps are skipped when this exists) |
| `next-lap` | You start any lap that isn't the first or last |
| `last-lap` | You start the last lap |
| `finish` | You finish the race |
| `finish-1` / `finish-2-6` / `finish-7-12` | After `finish` has ended, by your finishing place |
| `results-win` / `results-loss` | Scoreboard after a race: 1st place / anywhere else |
| `item-box` | The item roulette (the roulette lasts as long as this file, 8 s if it's missing) |
| `music-<track id>` / `music-<zone>` / `music` | Race music, starts on GO (track id first, then zone, then `music`) |

## Menu sound effects (.wav)
`title-cursor` (main menu / setup up-down) · `decide` (Single Player, Online, Settings, Host, Join) · `small-decide` (any OK / small button) · `start-race` · `back` · `alt-cursor` (character and item grids) · `side-scroll` (setup and settings side scrollers) · `vertical-scroll` (karts, wheels, colour up/down)

## Race sound effects
`alert` (a red or blue shell is homing on you) · `fall` · `beep` · `go` · `pickup` · `use` · `boost` · `hit` · `boom`

**Item sounds:** `use-<item>` plays when that item is used and falls back to `use` (or `boost`): banana, blooper, bob-omb, boo, boomerang-flower, bullet-bill, coin, crazy-8, feather, fire-flower, golden-mushroom, green-shell, lightning, mushroom, piranha-plant, red-shell, spiny-shell, super-horn, super-leaf, starman, triple-bananas, triple-green-shells, triple-mushrooms, triple-red-shells (a triple uses its single item's file if it has none of its own).

## Loops
`engine` (pitch rises with speed) · `drift` (tyre skid loop)

Keep loops seamless; every file is downloaded when the game starts.
