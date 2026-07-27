# Iron Log — Training & Nutrition Tracker

A static site — no backend, no build step. Files run straight from GitHub Pages.

## Files
`index.html`, `style.css`, `app.js`, `food.js`, `program-data.js`, `body-diagrams.js`,
`manifest.json`, plus icon PNGs — all at the repo root.

## Host it on GitHub Pages
1. Create a public repo, upload all files from this zip to the root.
2. Settings → Pages → Source: Deploy from a branch → `main` → `/ (root)` → Save.
3. Visit `https://<username>.github.io/<repo>/` after ~1 minute.
4. Add to Home Screen on your phone for an app-like icon.

## Tabs
- **Train** — 16-week rail (Strength/Hypertrophy alternating), day-by-day set logging
  that autosaves as you type, live dashboard (clock, streak, this week, weekly muscle
  calculator, Trained Areas silhouette, training calendar).
- **Progress** — same dashboard, plus a weight trend graph, a this-week-vs-last-week
  muscle bar chart, and per-exercise top-weight/volume charts.
- **Food** — nutrition profile setup (auto-suggests calorie/macro goals from your
  height/weight/activity via the Mifflin-St Jeor formula, fully editable), daily
  calorie dial + macro rings, meal sections, daily weight entry, and a full
  micronutrient panel tracked against real RDA values.
- **History** — every logged session, with start time and duration, editable/deletable.
- **Gear icon (top right)** — GitHub sync setup, not a tab.

## Body diagrams
Every exercise shows a front/back silhouette with the actual targeted muscle glowing
in its own color — primary muscle at full strength, secondary/assisting muscles in a
lighter glow of the same color. The Trained Areas panel aggregates this across a whole
week (This Week / Last Week toggle).

## Adding food — three real data sources
1. **Search** — queries the free USDA FoodData Central database for whole/generic foods.
2. **Barcode scan** — uses your phone's camera (via the browser's BarcodeDetector API,
   supported on Chrome/Android; not on iOS Safari) to read a barcode, then looks it up
   against the free Open Food Facts product database.
3. **Photo of a nutrition label** — takes a photo, attempts OCR text extraction
   (via Tesseract.js) of calories/protein/carbs/fat, and always shows you an editable
   form to correct anything it misread before saving.
4. **Manual entry** — type it in once, optionally save to **My Foods** for one-tap reuse
   next time (useful for homemade dishes no database has, like biryani).

## Sync (optional, via the gear icon)
Connect a GitHub fine-grained personal access token (Contents: Read and write, scoped
to just this one repo) and workouts + weight logs + food logs + My Foods all sync to
your repo as JSON files, so your data follows you across devices. Without it, everything
just stays in this browser's local storage.

## Notes
- Micronutrient RDA values are standard adult reference intakes; iron is adjusted by
  the gender you set in your Food profile (8mg male / 18mg female).
- USDA search, barcode lookup, and OCR all require an internet connection at the moment
  you add food — if a lookup fails, Manual entry always works offline.
