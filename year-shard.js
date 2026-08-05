// year-shard.js — split logs by year to keep sync files small.
// Current year: data/sessions.json (hot). Past years: data/sessions-YYYY.json
// This runs at boot: if a year rollover is detected, moves last year's records
// out. Data is kept in localStorage as a single array — the sharding only
// affects how it's pushed to GitHub sync.

const YEAR_ROLLOVER_KEY = "ironlog_last_year_shard_check";

function currentYear() { return new Date().getFullYear(); }

function sessionsByYear() {
  const buckets = {};
  (sessions || []).forEach(s => {
    const y = s.date ? s.date.slice(0, 4) : String(currentYear());
    if (!buckets[y]) buckets[y] = [];
    buckets[y].push(s);
  });
  return buckets;
}

function foodLogsByYear() {
  const raw = localStorage.getItem("ironlog_food_logs_v1");
  if (!raw) return {};
  const logs = JSON.parse(raw);
  const buckets = {};
  logs.forEach(l => {
    const y = l.date ? l.date.slice(0, 4) : String(currentYear());
    if (!buckets[y]) buckets[y] = [];
    buckets[y].push(l);
  });
  return buckets;
}

// Called at boot. Returns { rolled: bool, from: 'YYYY', to: 'YYYY' } if a
// year rollover was detected.
function checkYearRollover() {
  const lastCheck = localStorage.getItem(YEAR_ROLLOVER_KEY);
  const now = String(currentYear());
  if (lastCheck === now) return { rolled: false };
  localStorage.setItem(YEAR_ROLLOVER_KEY, now);
  if (!lastCheck) return { rolled: false }; // first ever boot
  if (lastCheck < now) return { rolled: true, from: lastCheck, to: now };
  return { rolled: false };
}

// Push helper — sharded push to GitHub. Called from syncPush wrapper.
// Returns an array of { path, payload } tuples ready to be committed.
function buildShardedSessionPayloads() {
  const buckets = sessionsByYear();
  const cur = String(currentYear());
  const payloads = [];
  Object.entries(buckets).forEach(([year, list]) => {
    const path = year === cur ? "data/sessions.json" : `data/sessions-${year}.json`;
    payloads.push({ path, payload: JSON.stringify(list, null, 2) });
  });
  return payloads;
}

function buildShardedFoodPayloads() {
  const buckets = foodLogsByYear();
  const cur = String(currentYear());
  const payloads = [];
  Object.entries(buckets).forEach(([year, list]) => {
    const path = year === cur ? "data/food.json" : `data/food-${year}.json`;
    payloads.push({ path, payload: JSON.stringify(list, null, 2) });
  });
  return payloads;
}
