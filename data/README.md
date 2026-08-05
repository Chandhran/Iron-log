# Data folder

This folder holds the user's own training log — the app writes to it via
GitHub sync so the same data is available on every device signed into the
same repo.

## Files

- **`sessions.json`** — every logged workout (weight × reps for each set,
  timing, rest-day tasks). Starts as `[]` and grows as the user logs.
- **`food.json`** — every logged meal (nutrients per entry, meal type,
  timestamps). Starts as `[]`.
- **`weight-logs.json`** — daily body-weight entries. Starts as `[]`.

## Year sharding

To keep the current-year files small and quick to sync, past years' data
gets moved into year-suffixed files on rollover:

- `sessions-2024.json`, `sessions-2025.json`, ...
- `food-2024.json`, `food-2025.json`, ...

The app checks for rollover on boot and does this automatically. The
"hot" current-year file always keeps the same name (`sessions.json`).

## Privacy

If this repo is public, these files are public too. Keep the repo private
if the training log or nutrition data should stay personal.
