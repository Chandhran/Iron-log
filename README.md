# Iron Log — Training & Nutrition Tracker

Static site, no backend. All files sit at the repo root for GitHub Pages.

## Files
`index.html`, `style.css`, `app.js`, `food.js`, `diet-styles.js`, `program-data.js`,
`exercise-database.js`, `body-diagrams.js`, `manifest.json`, icon PNGs.

## Deploy
Upload everything to a public repo root → Settings → Pages → Deploy from branch
`main` → `/ (root)`. Live at `https://<username>.github.io/<repo>/` in ~1 minute.

## What's new in this build
- **Font**: Manrope throughout.
- **Warm-up sets**: compound lifts (squats, deadlifts, presses, etc.) show
  checkbox-only warm-up rows above the working sets — no weight/reps needed,
  just tick them off.
- **Exercise alternatives**: every exercise shows a horizontal row of
  substitutes matched by the same primary muscle *and* movement pattern,
  pulled from an 80-exercise database (from the 8-week hypertrophy program,
  including its A1/A2, B1/B2, C1/C2 superset pairs). Swapping applies to that
  single logged session only — next time the day comes around it's back to
  the original program exercise. Logged sets always attribute to the correct
  muscle even after a swap.
- **Trained Areas (weekly)**: now monochromatic — one hue, darker means more
  training volume that muscle got this week, lighter means less.
- **Male/female body diagrams**: wired to the gender set in your Food profile.
  Both currently render the same silhouette until separate artwork is added —
  send it whenever ready and it drops in as `shapeAttrsFrontFemale()` /
  `shapeAttrsBackFemale()` in `body-diagrams.js`.
- **Progress charts**: always show axes, grid, and labeled scale, even before
  any data exists — they fill in as you log.
- **Diet styles** (Food tab, after picking a calorie target): Balanced, Keto,
  High Protein Low Carb, Body Recomposition, Carb Cycling, Zigzag Calorie,
  Intermittent Fasting, OMAD, Hyperbolic Fasting, Hyperbolic Diet.
  - Ratio-based styles use a locked macro-percentage panel — nudge one macro
    and the other two rebalance automatically so it always totals 100%.
  - Carb Cycling / Zigzag pull today's numbers automatically from whether
    today is a training or rest day in your current program week.
  - Intermittent Fasting / OMAD show a live eating-window banner (16:8, 18:6,
    20:4, OMAD 23:1, or custom) that counts down in real time.
  - Hyperbolic Fasting / Hyperbolic Diet (J Darwish protocols) are fully
    modeled: height-based protein targets, the 3-meal-window structure, the
    weekly fasting/cheat-day schedule, and the 5-day rotating calorie
    percentages — computed exactly from the source formulas, not approximated.

## Notes
- BMI gauge, calorie/macro rings, and all Progress charts render via Chart.js
  from a CDN — needs an internet connection, works fine on GitHub Pages.
- Barcode scanning needs a camera and a BarcodeDetector-capable browser
  (Chrome/Android). iOS Safari falls back to Search or Manual entry.
- GitHub Sync (gear icon) is optional — without it, everything just stays in
  this browser's local storage.
