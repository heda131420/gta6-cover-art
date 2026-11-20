# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/heda131420/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/heda131420/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Cover Studio — a GTA-style cover art maker that runs entirely offline in a desktop browser. Pick up to three photos (your own, or the built-in samples), arrange them across three slanted panels, write a caption, pick a sunset, neon or noir grade, and export the poster as a PNG in 1080 × 1080, 1080 × 1350 or 1920 × 1080.

## Run it

```sh
python3 -m http.server 8080 --directory app
```

Then open http://localhost:8080 in a desktop browser. No build step, no network request: every script, style and sample photo is a file under `app/`, and your photos are read on your own machine, never uploaded.

## How it works

1. **Photos** — upload a photo into any panel, or cycle the built-in samples (a neon boulevard, a beach at sunset, a night skyline). Turn on "Same photo in all three panels" to fill the poster with one shot.
2. **Caption** — type the words; the poster sets them in bold capitals under a `VICE CITY` eyebrow.
3. **Grade** — Sunset (warm pink-orange), Neon (magenta/cyan) or Noir (desaturated, high contrast).
4. **Size** — 1080 × 1080, 1080 × 1350 or 1920 × 1080.
5. **Position** — click a panel to select it, drag the preview to pan it, use the zoom slider to crop it.
6. **Export** — one click downloads the poster as a PNG.

The poster renderer lives in `app/src/cover.js` (`drawCover`, `renderCover`); the editor in `app/src/main.js`; fixed screenshot scenes in `app/src/shots.js` (`?shot=cover|editor&photo=&panels=&caption=&size=&grade=`). The entry program `main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's `vendor/makefun-app.ts`.

Export sizes are 1080 × 1080 (square), 1080 × 1350 (portrait) and 1920 × 1080 (wide); the grade is Sunset, Neon or Noir. The three built-in samples are a neon boulevard, a beach at sunset and a night skyline, all made with an image model.

All artwork is original: the sample photos were made with an image model, the palm silhouettes and lettering are drawn in code, and no Rockstar logo, official artwork or font is used anywhere.

---

<sub>Entered on [make.fun](https://make.fun/?ref=p3a162wj&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
