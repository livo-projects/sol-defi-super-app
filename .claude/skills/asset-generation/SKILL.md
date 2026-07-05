---
name: asset-generation
description: Generate images, sprites, icons, and hero art from a text prompt with generate_image — fal.ai render + automatic transparent cutout, committed into the project and served at {slug}.livo.build/assets/<name>.png. Billable (daily free tier, then credit balance).
---

# Skill — generating images & game art

Livo can generate images from a text prompt and drop them straight into a project,
ready to use. One tool: **`generate_image`**. It runs the whole pipeline for you —
render → background removal → commit — so you never leave the build to "go find art".

```
generate_image(prompt, model?, size?, name?, project_id?)
  → renders the prompt via fal.ai (FLUX)
  → cuts out the background to a clean TRANSPARENT PNG (BiRefNet matting)
  → commits it to interfaces/main/public/assets/<name>.png
  → returns { path, url, asset_id, cost_usd }
```

The asset ships with the next web build and serves at
**`{slug}.livo.build/assets/<name>.png`**. Reference it from your frontend as
`/assets/<name>.png`.

> **`name:` is authoritative — ALWAYS pass it for art you'll reference in code, and
> reference it by that EXACT name.** With `name: "bolt-run1"` the file is committed and
> served at `/assets/bolt-run1.png`, full stop — so `<img src="/assets/bolt-run1.png">`
> just works, and re-generating with the same name overwrites it in place. If you OMIT
> `name`, a unique suffix is appended to a prompt-derived slug (e.g.
> `robot-mascot-mqw533wh.png`) so unrelated generations don't collide — in that case you
> can't predict the filename, so use the `url` the tool returns. The #1 way generated art
> 404s in-game is passing `name: "bolt-run1"`, then hard-coding `/assets/bolt-run1.png`
> while the tool shipped a suffixed name — that mismatch is gone now that `name` is
> honored verbatim, but only if you actually pass `name`.
>
> **Already have a mismatch?** (e.g. an older project's assets were committed with hashed
> names like `bolt-idle-mqw52v3g.png` but the code loads `/assets/bolt-idle.png`.) Don't
> regenerate and don't hand-roll a git move — use **`rename_file`** to rename each PNG to
> the bare name the code expects. It's content-preserving (works for binary, which
> edit_file/push_code can't), e.g.
> `rename_file({ renames: [{ from: "interfaces/main/public/assets/bolt-idle-mqw52v3g.png", to: "interfaces/main/public/assets/bolt-idle.png" }] })`.
> Then VERIFY: fetch `/assets/bolt-idle.png` and confirm 200 — don't claim it's fixed off a code read.

## Branded web/UI assets — `generate_web_asset`
For anything **brand or web** — a logo, an app icon, a page background, hero art, a
tileable pattern, a spot illustration, or a hero **subject** (a mascot/robot to drop on a
landing page) — prefer **`generate_web_asset`** over `generate_image`. It carries
type-specific art direction (the same craft the Livo asset studio uses), so a logo reads
as a logo, a background stays low-contrast enough for text, a hero leaves headline space,
and a pattern tiles seamlessly.

```
generate_web_asset(kind, prompt, style?, name?, project_id?)
  kind: logo | icon | illustration | subject   → TRANSPARENT cutout
        background | hero | pattern             → full-bleed
  style: keep ONE look across the whole brand — a starter-style key
         (pixel-quest · neon-drift · storybook · cel-strike · claymorph · ink-noir)
         OR a free-text hint ('soft pastel flat vector'). Reuse the SAME value.
  → commits to interfaces/main/public/assets/<name>.png (served at /assets/<name>.png)
```

Pass the **same `style`** to every call so a logo, background and hero all match —
that's how you brand a whole site in a few calls. Billable ≈$0.04 each.

## Remove a background — `remove_background`
**`remove_background(image_url, name?, project_id?)`** BiRefNet-mattes any image to a
clean transparent PNG and commits it. `image_url` can be a committed `/assets/<name>.png`
path (resolved against the live site) or any public URL — lift a subject off a busy
photo, clean a logo off a white card, or prep an image for overlay. Billable ≈$0.01.

## Two sources: the FREE library, then generate
For game art especially, **check the free library before you pay to generate.**

- **`browse_game_assets(query, kind?)` + `add_game_asset(id, name?)`** — Livo mirrors a
  curated, **free, CC0** slice of [Kenney.nl](https://kenney.nl): ready-made, stylistically
  **coherent** sprite sets, tilesets, UI kits, and sound effects. `browse_game_assets`
  searches it; `add_game_asset` drops a chosen asset into the project (same commit + serve
  path as a generated image). **No credits, no attribution.** This is the right call for a
  whole consistent SET — a sprite sheet, a tileset, matching UI — which is exactly what
  text-to-image is worst at (it can't emit N consistent frames). Browse first.
- **`generate_image`** — bespoke, one-off raster art the library doesn't have: a specific
  character/mascot, a hero/banner image, a custom icon or texture. Billable, but it makes
  *exactly* what you describe. Use it for the pieces Kenney doesn't cover.

Rule of thumb: **a coherent set → `browse_game_assets` (free); a unique piece →
`generate_image` (paid).** They mix freely in one game — Kenney tiles + a generated boss.

## When to use what (generate_image vs SVG)
- **`generate_image`** — any raster image: game sprites, character art, hero/banner
  images, icons, logos, illustrations, textures.
- **Hand-authored SVG** — for *simple, exact* vector shapes (a flat icon, a UI glyph,
  geometric pellets) it's often cheaper and sharper to just write the `<svg>` yourself
  in the frontend. Reach for `generate_image` when you want *rendered art*, not a
  geometric primitive.
- **`list_assets`** — browse what a project already generated (url, kind, prompt,
  model, `cost_usd`). **Always check this before regenerating** — reuse is free,
  regeneration costs. Pass **`scope:'all'`** to show the user their FULL generation
  history across every project they've built, with each image's cost and a
  `total_cost_usd` — use this when they ask "what have I generated?" / "show my assets".
  Combine `scope:'all'` with `project_id` to filter that history to one project.

## Transparent by default — the cutout
Every image is matted with **BiRefNet**, a high-accuracy model that respects interior
holes (a donut's center, a ring, Pac-Man's open mouth) — so sprites drop onto any
background with no white box and no filled-in negative space. You don't configure this;
it just happens. Tip: prompts that put the subject on a **plain neutral background**
("…, isolated on a plain grey background") cut out cleanest.

## Model = quality dial
- `model: "schnell"` (default) — fast and cheap (~$0.005 raw). Great for UI icons,
  bulk sprites, simple art.
- `model: "dev"` — high-fidelity (~$0.025 raw, ~5×). Use for hero images and detailed
  hero/character sprites where it matters.

`size` maps to fal's `image_size` (e.g. `square_hd` default, `portrait_16_9`,
`landscape_16_9`).

## Making a coherent set (game sprites, matching icons)
Generate each asset with a **shared style phrase** so they look like one set, e.g. end
every prompt with the same suffix: `"…, clean isolated game sprite, flat cel-shaded,
top-down"`. Keep orientation explicit ("nose pointing UP", "top-down view from directly
above") so sprites line up in-engine. Name them predictably (`player`, `enemy_fighter`,
`boss`) — `name:` sets the served filename verbatim (`/assets/<name>.png`), so pass it on
every sprite and reference each by that exact path.

## Animated sprites — `generate_sprite_sheet` (real frames, not a procedural fake)
For a character that should **walk / run / jump / idle**, don't generate one image and
fake the motion — that's what makes a sprite look glitchy. Use **`generate_sprite_sheet`**:

```
generate_sprite_sheet(character, name?, actions?, model?)
  → for each action (idle | walk | run/sprint | jump | fall | attack | custom):
      renders the WHOLE cycle as one horizontal sprite-sheet strip (the model draws a
      real stride — the limbs actually move), cuts out the background, commits <action>.png
  → writes a sprite.json manifest mapping each action → its strip, frames, fps, loop
  → commits to interfaces/main/public/assets/sprites/<name>/  (one atomic commit)
```

- **Describe the character ONCE** (`character: "a friendly blue robot with a gold gear"`);
  the whole strip is one render, so the character stays consistent across the cycle. The
  in-game `SpriteAnimator` slices each strip into frames by the transparent gaps.
- **`name` defaults to `"player"`** and is authoritative. In the `game` template, a sprite
  named `player` is animated **automatically** — the bundled `SpriteAnimator` loads
  `sprite.json` and plays the cycles with no code change. For other characters, load it
  with `SpriteAnimator.load("/assets/sprites/<name>/sprite.json")`.
- **`actions`** defaults to `idle, walk, jump`. Override frame count / fps / loop per
  action, or pass `frame_prompts` to script the poses yourself.
- **Billable**, ~$0.04 per action (one nano-banana render + cutout; default idle+walk+jump set ≈$0.12). Same
  free-allowance-then-balance charging as `generate_image`.

Reach for `generate_sprite_sheet` for an animated character; `generate_image` for a single
static piece. (You *can* still derive simple motion procedurally — chomp/bob/spin/pulse —
for the cheapest possible animation; see `livo://skill/game-dev`.)

## Billing — it costs credits (most tools are free; this one isn't)
`generate_image` is one of the few **billable** tools. Charging is automatic:
1. **Daily free allowance first** (pooled per user, ~$1/day) — most casual use is free.
2. **Then the credit balance** — drawn down only after the free allowance is spent.
3. If neither covers it, the call returns a structured `insufficient_credits` error
   (with `need_usd`, `balance_usd`, `daily_free_remaining_usd`, and a `/credits` top-up
   pointer) and **nothing is generated / charged** — relay it so the user can top up.

Check `get_credit_balance` (shows `daily_free_remaining_usd`) before a big batch, and
`describe_tools(["generate_image"])` shows the price. Failed generations are auto-refunded.

## Build a game with the art
Generating the sprites is half the job. To assemble them into a playable canvas game
(game loop, collision, maze, score, sprite animation), read **`livo://skill/game-dev`**.
