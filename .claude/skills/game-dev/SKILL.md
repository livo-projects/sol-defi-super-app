---
name: game-dev
description: Build a playable HTML5 canvas game on Livo — game loop, tilemap + solvable levels, movement/collision, and sprite animation driven by AI-generated art (generate_image). Ships as a static interface/ served at {slug}.livo.build.
---

# Skill — browser games on Livo

A Livo project can host a fully playable HTML5 canvas game: it's just a static
**`interface/main/`** web app that serves at `{slug}.livo.build`. Generate the art with
**`generate_image`** (read `livo://skill/asset-generation`), then assemble it with the
patterns below — these are the ones the Pac-Man and space-shooter demos proved the hard
way, so don't re-learn them.

**Already have a starter? Build on it, don't replace it.** Two game templates ship a
working starter on the first commit — reshape it, don't start from a blank file:

- **`game` (single-player):** a complete playable endless-dodger —
  `interfaces/main/src/game.ts` (engine: fixed-tick loop + rAF draw, already correct),
  `App.tsx` (canvas, keyboard + touch, HUD/start/game-over), `useProgress.ts` +
  `api/index.js` (D1 high-score save/resume, OPTIONAL wallet login). Edit `game.ts` for
  the mechanics, swap the drawn shapes for sprites (`browse_game_assets` /
  `generate_image`).
- **`multiplayer-game` (real-time online):** a live arena where people play against each
  other. `servers/arena/index.js` is the authoritative WebSocket **Durable Object** room
  (players + coins, ticks + broadcasts); `interfaces/main/src/net.ts` + `App.tsx` are the
  client. To make it your game, edit the room's `tick()`/state and the client render.
  **Wiring:** deploy the room with `sync_servers`, then set `VITE_GAME_SERVER_URL` to its
  URL (`get_server arena`) and redeploy the interface — then it's live online.

The loop / netcode / save / login wiring is done; spend your effort on the game itself.

**Fastest start:** `list_examples` → the **"Arcade game (Pac-Man / shooter)"** example
(`id: canvas-game`) is a ready recipe — it creates the `spa` project, calls
`generate_image` for the sprites, and lays out the loop. Follow its steps and fill in
the game.

## 1. Game loop — split logic from drawing
Run game **logic** on a fixed `setInterval` tick and **draw** on `requestAnimationFrame`:

```js
setInterval(step, 1000 / 60);          // logic: movement, collision, spawns — fixed timestep
function frame(){ draw(); requestAnimationFrame(frame); }  // render only
requestAnimationFrame(frame);
```

**Why:** a pure-`requestAnimationFrame` loop is throttled/paused when the tab is
backgrounded — the game freezes and "jumps" on return. Keeping logic on `setInterval`
keeps state advancing predictably. (Expose `step()`/`state()` on `window` so you can
fast-forward and assert state in verification.)

## 2. Levels that are always solvable — flood-fill, don't hand-check
For a maze/tilemap, never trust that a hand-drawn or random level is fully connected.
**Flood-fill from one open cell to find the largest reachable region**, then place the
player, pickups, and exits **only on cells in that region**:

```js
function reachable(grid, start){            // BFS/flood-fill over open cells
  const seen = new Set(); const q = [start];
  while (q.length){ const c = q.pop(); /* ...visit 4 neighbours that are open... */ }
  return seen;                               // place entities only in `seen`
}
```

This fixes the "fruit trapped in a sealed pocket, level unwinnable" class of bug **by
construction** instead of by inspection.

## 3. Movement & collision
- **Queued turns**: store the player's *desired* direction; apply it only when the next
  cell that way is open (feels like real Pac-Man, no wall-sticking).
- **Wall checks** against the tilemap before moving; **tunnel wrap** by modulo on x.
- Use **circle/AABB overlap** for entity hits; keep hitboxes a touch smaller than the
  sprite so contact feels fair.

## 4. Sprite animation — `generate_sprite_sheet` for real frames
For a character that should **walk / run / jump / idle**, generate real frames with
**`generate_sprite_sheet`** — don't fake motion from one image (that's what looks glitchy):

```
generate_sprite_sheet({ character: "a blue robot with a gear", name: "player",
                         actions: [{action:"idle"}, {action:"walk"}, {action:"jump"}] })
```

It renders the whole cycle as one horizontal strip (the model draws a real stride — the
limbs move), cuts out the background, and commits one `<action>.png` + a `sprite.json`
manifest. The `game` template's bundled **`SpriteAnimator`** (`src/SpriteAnimator.ts`)
loads a sprite named `player` automatically and slices each strip by its transparent gaps
— no code change. For enemies/NPCs:

```ts
const anim = await SpriteAnimator.load("/assets/sprites/enemy/sprite.json");
// each frame: anim.setAction(moving ? "walk" : "idle"); anim.update(dt); anim.draw(ctx, x, y, w, h, faceLeft);
```

Set **`ctx.imageSmoothingEnabled = false`** for crisp pixel sprites.

**Cheap fallback** — for trivial motion you can still derive frames procedurally from ONE
`generate_image` sprite: **chomp** (Pac-Man, clip a widening wedge), **bob/walk** (vertical
offset + squash), **spin** (scale X through zero), **pulse** (scale pickups). Use this when
a full sprite sheet isn't worth the credits; use `generate_sprite_sheet` when the motion
needs to read naturally.

## 5. Getting the art — browse free first, generate the rest
You have two sources; use both:
- **`browse_game_assets` / `add_game_asset` — FREE, do this first for SETS.** Livo mirrors
  a curated CC0 slice of Kenney.nl: coherent sprite sheets, tilesets, UI kits, and SFX.
  `browse_game_assets("spaceship enemy" / "platformer tiles" / "ui button" / "click sound")`,
  then `add_game_asset(id)` drops it in. Perfect for a whole consistent cast/tileset —
  which text-to-image can't do (no N consistent frames). No credits, no attribution.
- **`generate_image` — paid, for the bespoke pieces** Kenney doesn't have (a specific
  mascot, a custom boss, a themed background). Mix freely: Kenney tiles + a generated hero.

## 6. Wiring the art + shipping
- Reference each asset as `/assets/<name>.png`, preload `Image()` objects before the loop.
- **Self-contained build (recommended):** inline every sprite as a `data:` URI into a
  single `interface/main/index.html` (a small build step that base64-encodes the PNGs
  into a `window.ASSET_DATA` map). One text file ships cleanly, with no asset-path or
  CORS surprises, and loads instantly.
- Add HUD (score/lives/wave), a start/pause/game-over flow, particles + screen shake for
  juice, and escalating difficulty.
- Deploy: it's a static interface — push and it builds; verify at `{slug}.livo.build`
  (read `livo://skill/verify`).

## 7. Playtest before you ship — don't merge a game you haven't played
A game that compiles is not a game that's good. The gap between a one-shot build and a
hand-crafted one is **iteration you actually do**, so close the loop yourself:
- **Drive it headlessly.** You exposed `window.step()` and `window.state()` (§1) — use
  them: fast-forward the loop, set the input direction, and **assert** the things that
  make it playable (the player moves, a collision ends a life, score increments, a level
  is winnable, the game-over + restart path works). This catches the "looks fine, plays
  broken" class before the user ever sees it.
- **Look at it.** Use the browser-smoke / verify path (`livo://skill/verify`) to load the
  real page and screenshot it — confirm sprites render (not white boxes), the HUD is
  visible, nothing is off-canvas or invisible-on-its-background.
- **Then iterate, don't stop at "it runs."** Play a round in your head from the state you
  observed and fix what's wrong: floaty/sticky controls, unfair hitboxes, difficulty that
  never ramps or spikes instantly, dead air with no feedback. Tune, re-run, repeat a
  couple of times. **Treat the first working version as a draft, not the deliverable.**

## 8. Make it feel GOOD — the polish bar
Mechanics working ≠ fun. Spend the last pass on game feel, because it's most of what the
player judges:
- **Game feel:** responsive input (no lag, coyote-time on jumps), a touch of acceleration/
  friction, screen shake + hit-stop on impact, particles on hits/pickups, juicy SFX (tiny
  WebAudio blips are enough — no asset needed).
- **Difficulty curve:** start easy, ramp speed/spawns/score smoothly; never a flat
  grind or an instant wall. Add a win condition or endless escalation so there's a point.
- **Framing:** a real title/start screen, pause, clear game-over with the score and a
  one-tap restart; visible score/lives/level HUD.
- **Controls everywhere:** keyboard AND touch (on-screen buttons or swipe) — most users
  open the link on a phone, and a keyboard-only game feels broken there.
- **Audio + theme:** a coherent palette and a couple of sounds lift a game more than extra
  mechanics. Generate themed sprites (`generate_image`) so it doesn't look like a tech demo.

## Pairs with asset-generation
`livo://skill/asset-generation` makes the **art** (transparent sprites via
`generate_image`); this skill makes it **play**. A full "build a Pac-Man game" flow:
generate the cast → build the maze with a reachability check → game loop + collision →
inline + deploy → playable at `{slug}.livo.build`.
