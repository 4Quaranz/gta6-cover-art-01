# Neon Coast Cover Maker

[![Cover Art](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/4Quaranz/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/4Quaranz/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline web app that turns any photo and a caption into a sunset-neon
poster cover — the multi-panel poster look with bold lettering and a
Vice-City-style sunset / neon colour grade, drawn entirely in code.

## What it does

- **Any photo:** add your own photos from the device (upload or drag & drop),
  or load the two free sample photos. Click a panel to select it, drag to
  move the photo inside it, scroll (or use the slider) to zoom, and swap or
  clear the photo per panel. One photo can fill every panel, or each panel
  can hold a different photo.
- **Four layouts:** Hero + 3, Grid 2×2, Triple strip, Full bleed.
- **Five colour grades:** Sunset, Neon night, Golden hour, Teal dawn, Mono ink.
- **Caption & lettering:** editable main title, subtitle and corner badge,
  with title size, tilt and three fill styles (sunset gradient, neon glow,
  white). All lettering uses system fonts — no font files, no downloads.
- **Original art, drawn in code:** retro striped sun, palm silhouettes,
  city skyline, film grain, vignette and a poster frame. No logos, artwork
  or fonts from any game.
- **Fast export:** one click exports a PNG in 1080 × 1080, 1080 × 1350 or
  1920 × 1080 — or all three sizes at once.

## Run it offline

```sh
node serve.ts
# open http://localhost:8080
```

`app/` is plain static files with no build step and no network request:
every script, style and image it loads is a file under `app/`, and photos
are read on the machine, never uploaded.

## Files

- `app/index.html` — the editor page
- `app/style.css` — editor chrome (system fonts only)
- `app/src/engine.js` — the cover renderer: layouts, grades, sun, palms,
  skyline, grain, lettering and PNG export
- `app/src/app.js` — editor state, photo loading, panel drag/zoom, caption
  controls, export buttons, shot modes
- `app/samples/` — two free sample photos (made for make.fun)
- `screenshots/` — the app with photos loaded and covers it exported
- `main.ts` — builds the entry: copies `app/` + `screenshots/` and writes
  `dossier.json` with `vendor/makefun-app.ts`
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged

## How the cover is drawn

Everything on the cover is drawn by `app/src/engine.js` on a 2D canvas —
no image assets, no fonts to download:

1. Each panel draws its photo cover-fit with its own zoom and offset, then
   the chosen grade (a canvas filter plus a sunset / neon colour wash).
2. The hero panel gets a retro striped sun, a lit city skyline and two palm
   silhouettes, all bezier paths drawn in code.
3. The title is set in a heavy system sans, filled with a sunset or neon
   gradient, outlined dark, and auto-shrunk to fit the hero panel; the
   subtitle sits beneath it in italic serif with a neon glow.
4. A rotated corner badge, film grain, optional halftone dots, a vignette
   and a poster frame finish the cover before it is exported as a PNG.

## Playtest

Open the app, load the sample photos (or your own), drag a panel photo,
change the layout and grade, then Export PNG. A built-in check is available
at `?selftest=1` — it loads the samples, exports all three sizes and
confirms no request leaves the machine.

## Build the dossier

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`.
