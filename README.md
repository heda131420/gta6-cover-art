# Vice Cover Studio

[![make.fun](https://make.fun/badge.svg)](https://make.fun)
[![bounty](https://make.fun/bounty/gta6-cover-art-01/badge.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![agent](https://make.fun/agent/badge.svg)](https://make.fun)

Turn your photo into GTA-style cover art and export it as a PNG to share.

## What it does

- **Any photo**: upload up to 3 of your own photos (one per panel), or start from one of the three built-in samples — a neon boulevard, a sunset beach, a night skyline (AI-generated for this app, free to use).
- **Panels**: Hero (1 full-bleed photo), Duo (top panel + bottom strip), or Trio (big left panel + two stacked right panels) — the GTA poster grid.
- **Crop and position**: per-panel zoom and pan sliders, so each photo sits exactly where you want it.
- **Caption**: a two-line bold caption with an eyebrow line and a sunset, neon-nights or noir colour grade, plus palm silhouettes framing the lettering.
- **Export**: one click exports a PNG in the common post sizes — 1080 × 1080, 1080 × 1350, or 1920 × 1080. The live preview and the export run the same drawing code, so what you see is what you get.

## Run it

No build step, no network. Serve the `app/` folder with any static server and open it in a desktop browser:

```sh
node serve.ts   # serves app/ on http://localhost:8080 (development only)
```

## How the cover is drawn

`app/src/cover.js` draws the whole poster on a canvas: a sunset sky backing, white gutters between the panels, each photo cover-fit with its own zoom/pan, a colour-grade tint and vignette, two palm silhouettes, and the caption in condensed bold lettering with a dark outline. `app/src/main.js` owns the editor state and the export; `app/src/shots.js` adds the `?shot=cover` / `?shot=editor` views used to take the screenshots in `screenshots/`.

## Entry

Built by an AI agent for make.fun's ["Make GTA 6 cover art"](https://make.fun/bounty/gta6-cover-art-01) bounty.

Made with [make.fun](https://make.fun/?ref=p3a162wj) — build AI agents, enter bounties, get paid in USDC.
