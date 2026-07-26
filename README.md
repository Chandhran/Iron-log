# Iron Log — 16 Week Workout Tracker

A single static site. No build step, no backend. All logs are saved in
your phone's browser (localStorage) — nothing leaves your device.

## What it does
- 16-week rail across the top: odd weeks = Strength, even weeks = Hypertrophy (your two Notion templates, alternating).
- Tap a week, tap a day, log kg + reps per set. Big number pads, made for typing between sets.
- **Progress** tab: pick any exercise, see a top-weight line chart and a volume bar chart across every session you've logged.
- **History** tab: every session you've saved, editable/deletable.

## Host it free on GitHub Pages
1. Create a new **public** repo on GitHub, e.g. `iron-log`.
2. Upload all files in this folder (`index.html`, `style.css`, `app.js`, `program-data.js`, `manifest.json`, `icons/`) to the repo root — either drag-and-drop on github.com or via git.
3. Go to **Settings → Pages**. Under "Build and deployment", set Source to **Deploy from a branch**, branch **main**, folder **/ (root)**. Save.
4. Wait ~1 minute. Your site is live at `https://<your-username>.github.io/iron-log/`.

## Add it to your phone as an app (with the logo)
**iPhone (Safari):**
1. Open your GitHub Pages link in Safari.
2. Tap the Share icon → **Add to Home Screen**.
3. The barbell icon and "Iron Log" name are already set — tap **Add**.

**Android (Chrome):**
1. Open the link in Chrome.
2. Tap the ⋮ menu → **Add to Home screen** (or you'll see an "Install app" prompt automatically, since this is a proper PWA with a manifest).
3. Confirm — it installs with the icon, opens full-screen with no browser bar.

## Storing entries in GitHub (optional sync)
By default entries are saved only in this phone's browser. The **Sync** tab lets you
connect the app to your GitHub repo instead — every save commits an updated
`data/sessions.json` file to the repo, so your log is versioned, backed up, and
usable from more than one device.

To connect:
1. On GitHub: profile photo → **Settings** → scroll to **Developer settings**.
2. **Personal access tokens → Fine-grained tokens → Generate new token**.
3. Repository access: **Only select repositories** → pick your `iron-log` repo.
4. Permissions → Repository permissions → **Contents: Read and write**.
5. Generate, copy the token (shown once), and paste it into the Sync tab along
   with your GitHub username and repo name.

The token is stored only in this browser's localStorage — it's never committed
to the repo or visible in the site's code. Treat it like a password: anyone with
it can write to that one repo. If you ever need to revoke it, delete the token
from GitHub's Developer settings page.

## Notes
- Without Sync connected, data lives only in that specific browser on that specific phone.
- With Sync connected, saves need an internet connection to reach GitHub's API; if a save fails (no signal), it still saves locally and you can revisit it once you're back online.
- If you ever want to reset, clearing site data in the browser wipes locally-cached sessions (GitHub copy is unaffected if synced).
