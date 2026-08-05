// ---------- STORAGE ----------
const SESSIONS_KEY = "ironlog_sessions_v1";
const STATE_KEY = "ironlog_state_v1";
const WEIGHT_LOGS_KEY = "ironlog_weight_logs_v1";

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY)) || []; } catch { return []; }
}
function saveSessions(sessions) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}
function loadState() {
  try { return JSON.parse(localStorage.getItem(STATE_KEY)) || { week: 1, dayIndex: 0 }; } catch { return { week: 1, dayIndex: 0 }; }
}
function saveState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}
function loadWeightLogs() {
  try { return JSON.parse(localStorage.getItem(WEIGHT_LOGS_KEY)) || []; } catch { return []; }
}
function saveWeightLogs(logs) {
  localStorage.setItem(WEIGHT_LOGS_KEY, JSON.stringify(logs));
}

let sessions = loadSessions();
let state = loadState();
let weightLogs = loadWeightLogs();

// ---------- GITHUB SYNC (shared: workouts here, food data in food.js) ----------
const SYNC_CONFIG_KEY = "ironlog_sync_config_v1";
const DATA_PATH = "data/sessions.json";

function loadSyncConfig() {
  try { return JSON.parse(localStorage.getItem(SYNC_CONFIG_KEY)); } catch { return null; }
}
function saveSyncConfig(cfg) { localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(cfg)); }
function clearSyncConfig() { localStorage.removeItem(SYNC_CONFIG_KEY); }

function ghApiUrl(cfg, path) {
  return `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path || DATA_PATH}`;
}
function ghHeaders(cfg) {
  return { "Authorization": `Bearer ${cfg.token}`, "Accept": "application/vnd.github+json" };
}
function utf8ToB64(str) { return btoa(unescape(encodeURIComponent(str))); }
function b64ToUtf8(str) { return decodeURIComponent(escape(atob(str))); }

async function githubPull() {
  const cfg = loadSyncConfig();
  if (!cfg) return null;
  const res = await fetch(ghApiUrl(cfg), { headers: ghHeaders(cfg) });
  if (res.status === 404) return { sessions: [], weightLogs: [], sha: null };
  if (!res.ok) throw new Error(`GitHub read failed (${res.status})`);
  const data = await res.json();
  const content = JSON.parse(b64ToUtf8(data.content));
  return { sessions: content.sessions || content, weightLogs: content.weightLogs || [], sha: data.sha };
}

async function githubPush(payload, message) {
  const cfg = loadSyncConfig();
  if (!cfg) return;
  let sha = null;
  const head = await fetch(ghApiUrl(cfg), { headers: ghHeaders(cfg) });
  if (head.ok) { sha = (await head.json()).sha; }
  else if (head.status !== 404) throw new Error(`GitHub read failed (${head.status})`);

  const body = { message: message || "Update workout log", content: utf8ToB64(JSON.stringify(payload, null, 2)) };
  if (sha) body.sha = sha;

  const put = await fetch(ghApiUrl(cfg), {
    method: "PUT",
    headers: { ...ghHeaders(cfg), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!put.ok) {
    const errText = await put.text();
    throw new Error(`GitHub write failed (${put.status}): ${errText.slice(0, 200)}`);
  }
}

function setSyncStatus(text, kind) {
  const el = document.getElementById("syncStatus");
  if (!el) return;
  el.className = "sync-status" + (kind ? " " + kind : "");
  el.innerHTML = `<span class="dot-ind"></span>${text}`;
}

async function syncPush(message) {
  const cfg = loadSyncConfig();
  if (!cfg) return;
  try {
    setSyncStatus("Syncing…", "");
    await githubPush({ sessions, weightLogs }, message);
    setSyncStatus("Synced just now", "connected");
  } catch (e) {
    setSyncStatus("Sync failed — saved locally only", "error");
    showToast("GitHub sync failed, saved on this phone only");
  }
}

async function syncPullAndApply() {
  const cfg = loadSyncConfig();
  if (!cfg) { setSyncStatus("Not connected", ""); return; }
  try {
    setSyncStatus("Syncing…", "");
    const remote = await githubPull();
    if (remote) {
      if (remote.sessions) { sessions = remote.sessions; saveSessions(sessions); }
      if (remote.weightLogs) { weightLogs = remote.weightLogs; saveWeightLogs(weightLogs); }
    }
    setSyncStatus(`Connected to ${cfg.owner}/${cfg.repo}`, "connected");
    renderRail();
    renderDayContent();
    if (document.getElementById("dashboard-home")) renderDashboard("dashboard-home");
    renderDashboard("dashboard-progress");
    if (typeof foodSyncPullAndApply === "function") foodSyncPullAndApply();
  } catch (e) {
    setSyncStatus("Connected, but last sync failed", "error");
  }
}

// ---------- HELPERS ----------
function todayISO() { return new Date().toISOString().slice(0, 10); }
function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
function formatDuration(ms) {
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "under a minute";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return `${h}h ${m}m`;
}
function findSession(week, dayName) {
  return sessions.find(s => s.week === week && s.day === dayName);
}
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove("show"), 1800);
}

// ---------- MODALS (Sync + Add Food) ----------
function openModal(id) { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

document.getElementById("gearBtn").addEventListener("click", () => {
  renderSyncPanel();
  openModal("syncModalOverlay");
});
document.getElementById("syncModalClose").addEventListener("click", () => closeModal("syncModalOverlay"));
document.getElementById("syncModalOverlay").addEventListener("click", (e) => {
  if (e.target.id === "syncModalOverlay") closeModal("syncModalOverlay");
});

function renderSyncPanel() {
  const cfg = loadSyncConfig();
  if (cfg) {
    document.getElementById("ghOwner").value = cfg.owner;
    document.getElementById("ghRepo").value = cfg.repo;
    document.getElementById("ghToken").value = cfg.token;
    setSyncStatus(`Connected to ${cfg.owner}/${cfg.repo}`, "connected");
  } else {
    setSyncStatus("Not connected", "");
  }
}

document.getElementById("ghSaveBtn").addEventListener("click", async () => {
  const owner = document.getElementById("ghOwner").value.trim();
  const repo = document.getElementById("ghRepo").value.trim();
  const token = document.getElementById("ghToken").value.trim();
  if (!owner || !repo || !token) { showToast("Fill in username, repo, and token"); return; }
  saveSyncConfig({ owner, repo, token });
  await syncPullAndApply();
  await syncPush("Initial sync from Iron Log");
  showToast("Connected to GitHub");
});

document.getElementById("ghDisconnectBtn").addEventListener("click", () => {
  clearSyncConfig();
  document.getElementById("ghOwner").value = "";
  document.getElementById("ghRepo").value = "";
  document.getElementById("ghToken").value = "";
  setSyncStatus("Not connected", "");
  showToast("Disconnected from GitHub");
});

// ---------- NAV TABS ----------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.getElementById("view-" + btn.dataset.view).classList.add("active");
    if (btn.dataset.view === "home" && typeof renderHomeTab === "function") renderHomeTab();
    if (btn.dataset.view === "progress") renderProgressTab();
    if (btn.dataset.view === "history") renderHistory();
    if (btn.dataset.view === "food" && typeof renderFoodTab === "function") renderFoodTab();
    if (btn.dataset.view === "train") {
      renderRail();
      renderPhaseLabel();
      renderDayStrip();
      renderDayContent();
    }
  });
});

// ---------- EXERCISE -> MUSCLE LOOKUP (program + exercise database) ----------
const EXERCISE_MUSCLE = {};
const EXERCISE_SECONDARY = {};
const EXERCISE_PATTERN = {};
const EXERCISE_COMPOUND = {};
const EXERCISE_TARGET = {}; // default target string, used when swapping in an alternative

Object.values(PROGRAM).forEach(phase => {
  phase.days.forEach(day => {
    if (day.type === "training") {
      day.exercises.forEach(ex => {
        EXERCISE_MUSCLE[ex.name] = ex.muscle;
        EXERCISE_SECONDARY[ex.name] = ex.secondary || [];
        EXERCISE_PATTERN[ex.name] = ex.pattern || "";
        EXERCISE_COMPOUND[ex.name] = !!ex.compound;
        EXERCISE_TARGET[ex.name] = ex.target;
      });
    }
  });
});
// Exercise database entries fill in any not already present (program takes precedence for its own naming)
if (typeof EXERCISE_DATABASE !== "undefined") {
  EXERCISE_DATABASE.forEach(ex => {
    if (!(ex.name in EXERCISE_MUSCLE)) {
      EXERCISE_MUSCLE[ex.name] = ex.muscle;
      EXERCISE_SECONDARY[ex.name] = ex.secondary || [];
      EXERCISE_PATTERN[ex.name] = ex.pattern || "";
      EXERCISE_COMPOUND[ex.name] = !!ex.compound;
      EXERCISE_TARGET[ex.name] = "";
    }
  });
}

// Find alternative exercises for a given exercise name: same primary muscle AND
// same movement pattern, pulled from the full combined pool (program + database).
function findAlternatives(exerciseName, limit = 8) {
  const muscle = EXERCISE_MUSCLE[exerciseName];
  const pattern = EXERCISE_PATTERN[exerciseName];
  const results = new Set();

  // 1) Explicit substitutions from the FBHF sub table (highest priority)
  if (typeof poolSubstitutionsFor === "function") {
    poolSubstitutionsFor(exerciseName).forEach(alt => {
      if (alt && alt !== exerciseName) results.add(alt);
    });
  }

  // 2) Pool-based same-muscle same-pattern exercises
  if (typeof EXERCISE_POOL_BY_MUSCLE !== "undefined" && muscle) {
    const musclePool = EXERCISE_POOL_BY_MUSCLE[muscle] || [];
    musclePool.forEach(e => {
      if (e.name === exerciseName) return;
      if (pattern && e.pattern === pattern) results.add(e.name);
    });
  }

  // 3) Legacy same-muscle same-pattern from the local lookup
  if (muscle && pattern) {
    const pool = new Set(Object.keys(EXERCISE_MUSCLE));
    pool.delete(exerciseName);
    Array.from(pool)
      .filter(name => EXERCISE_MUSCLE[name] === muscle && EXERCISE_PATTERN[name] === pattern)
      .forEach(name => results.add(name));
  }

  return Array.from(results).slice(0, limit);
}

// ---------- DATE HELPERS ----------
function parseISO(iso) { return new Date(iso + "T00:00:00"); }
function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function sameDay(a, b) { return a.toDateString() === b.toDateString(); }

// ---------- WEEKLY STATS ----------
function computeWeekStats(weekStart) {
  const weekEnd = addDays(weekStart, 7);
  const weekSessions = sessions.filter(s => {
    const d = parseISO(s.date);
    return d >= weekStart && d < weekEnd;
  });
  const loggedDays = new Set(weekSessions.map(s => s.date)).size;
  let volume = 0;
  const muscleSets = {};       // primary sets count
  const muscleStrength = {};   // for weekly body diagram: 'primary' | 'secondary'
  weekSessions.filter(s => !s.rest).forEach(s => {
    s.exercises.forEach(ex => {
      const muscle = EXERCISE_MUSCLE[ex.name] || "Full Body";
      const secondary = EXERCISE_SECONDARY[ex.name] || [];
      ex.sets.forEach(set => {
        volume += (set.weight || 0) * (set.reps || 0);
        muscleSets[muscle] = (muscleSets[muscle] || 0) + 1;
      });
      if (ex.sets.length > 0) {
        muscleStrength[muscle] = "primary";
        secondary.forEach(sm => { if (muscleStrength[sm] !== "primary") muscleStrength[sm] = "secondary"; });
      }
    });
  });
  return { loggedDays, volume, muscleSets, muscleStrength, weekSessions };
}

function computeStreak() {
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  const loggedDates = new Set(sessions.map(s => s.date));
  if (!loggedDates.has(todayISO())) cursor = addDays(cursor, -1);
  while (loggedDates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function computeHeatmap(monthsBack = 3) {
  const loggedDates = new Set(sessions.map(s => s.date));
  const now = new Date();
  const months = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = monthDate.toLocaleDateString(undefined, { month: "short" });
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    const isCurrentMonth = (i === 0);
    const lastDay = isCurrentMonth ? now.getDate() : daysInMonth;
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(monthDate.getFullYear(), monthDate.getMonth(), d);
      const iso = dt.toISOString().slice(0, 10);
      days.push({ logged: loggedDates.has(iso), future: d > lastDay });
    }
    months.push({ label, days });
  }
  return months;
}

// ---------- DASHBOARD RENDER (mounted in both Train and Progress) ----------
let clockIntervals = {};
let trainedAreasWeekMode = {}; // per-target 'this'|'last'

function renderDashboard(targetId) {
  const el = document.getElementById(targetId);
  if (!el) return;
  const monday = getMonday(new Date());
  const prevMonday = addDays(monday, -7);
  const thisWeek = computeWeekStats(monday);
  const lastWeek = computeWeekStats(prevMonday);
  const streak = computeStreak();
  const heatmap = computeHeatmap(3);
  if (!trainedAreasWeekMode[targetId]) trainedAreasWeekMode[targetId] = "this";

  const dayLetters = ["M", "T", "W", "T", "F", "S", "S"];
  const weekDotsHtml = dayLetters.map((letter, i) => {
    const d = addDays(monday, i);
    const iso = d.toISOString().slice(0, 10);
    const isToday = sameDay(d, new Date());
    const logged = thisWeek.weekSessions.some(s => s.date === iso);
    return `<div class="wk-dot-col">
      <span class="wk-dot ${logged ? "filled" : ""} ${isToday ? "today" : ""}"></span>
      <span class="wk-dot-label">${letter}</span>
    </div>`;
  }).join("");

  const muscleCardsHtml = MUSCLE_ORDER.map(m => {
    const cur = thisWeek.muscleSets[m] || 0;
    const prev = lastWeek.muscleSets[m] || 0;
    let trendLabel, trendClass;
    if (cur > prev) { trendLabel = "Growing"; trendClass = "up"; }
    else if (cur === 0 && prev === 0) { trendLabel = "No sets"; trendClass = "flat"; }
    else if (cur === 0 && prev > 0) { trendLabel = "Resting"; trendClass = "flat"; }
    else if (cur < prev) { trendLabel = "Lighter"; trendClass = "down"; }
    else { trendLabel = "Steady"; trendClass = "flat"; }
    const color = (MUSCLE_INFO[m] && MUSCLE_INFO[m].color) || "#5C6670";
    const maxScale = Math.max(cur, prev, 10);
    const pct = Math.min(100, Math.round((cur / maxScale) * 100));
    return `
      <div class="muscle-card">
        <div class="muscle-card-top">
          <span class="muscle-card-name">${m}</span>
          <span class="muscle-trend ${trendClass}">${trendLabel}</span>
        </div>
        <div class="muscle-card-count">${cur}<span class="muscle-card-unit"> sets</span></div>
        <div class="muscle-bar-track"><div class="muscle-bar-fill glow-box" style="width:${pct}%; background:${color}; --glow-color:${color};"></div></div>
        <div class="muscle-card-compare">${prev} sets last week</div>
      </div>`;
  }).join("");

  const heatmapHtml = heatmap.map(month => `
    <div class="heat-month">
      <div class="heat-month-label">${month.label}</div>
      <div class="heat-grid">
        ${month.days.map(d => `<span class="heat-dot ${d.logged ? "logged" : ""} ${d.future ? "future" : ""}"></span>`).join("")}
      </div>
    </div>
  `).join("");

  const activeStats = trainedAreasWeekMode[targetId] === "this" ? thisWeek : lastWeek;
  const diagrams = weeklyVolumeBodyDiagrams(activeStats.muscleSets);

  el.innerHTML = `
    <div class="bento-row">
      <div class="bento-card bento-clock">
        <div class="bento-label" id="clockDay-${targetId}">–</div>
        <div class="bento-big" id="clockTime-${targetId}">--:--</div>
        <div class="bento-sub" id="clockDate-${targetId}">–</div>
      </div>
      <div class="bento-card bento-streak">
        <div class="bento-label">Streak</div>
        <div class="bento-big">${streak}<span class="bento-unit">${streak === 1 ? "day" : "days"}</span></div>
        <div class="bento-sub">consecutive days logged</div>
      </div>
    </div>

    <div class="bento-card bento-week">
      <div class="bento-label">This week</div>
      <div class="wk-dots-row">${weekDotsHtml}</div>
      <div class="bento-sub">${thisWeek.loggedDays}/7 days logged · ${Math.round(thisWeek.volume).toLocaleString()} kg total volume</div>
    </div>

    <div class="section-label">Weekly sets per muscle group</div>
    <div class="muscle-card-row">${muscleCardsHtml}</div>

    <div class="section-label">Trained areas</div>
    <div class="trained-areas-card">
      <div class="trained-areas-head">
        <span class="bento-sub" style="margin:0;">Muscles worked</span>
        <div class="trained-toggle">
          <button class="trained-toggle-btn ${trainedAreasWeekMode[targetId] === "this" ? "active" : ""}" data-mode="this" data-target="${targetId}">This Week</button>
          <button class="trained-toggle-btn ${trainedAreasWeekMode[targetId] === "last" ? "active" : ""}" data-mode="last" data-target="${targetId}">Last Week</button>
        </div>
      </div>
      <div class="trained-body-row">
        <div class="trained-body-col">${diagrams.front}<span class="trained-body-col-label">Front</span></div>
        <div class="trained-body-col">${diagrams.back}<span class="trained-body-col-label">Back</span></div>
      </div>
      <div class="trained-legend">
        <span class="volume-gradient-legend">
          <span class="volume-gradient-bar"></span>
          <span class="volume-gradient-labels"><span>Less volume</span><span>More volume</span></span>
        </span>
      </div>
    </div>

    <div class="section-label">Training calendar</div>
    <div class="bento-card heat-panel">
      <div class="heat-row">${heatmapHtml}</div>
    </div>
  `;

  el.querySelectorAll(".trained-toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      trainedAreasWeekMode[btn.dataset.target] = btn.dataset.mode;
      renderDashboard(btn.dataset.target);
    });
  });

  startClock(targetId);
}

function startClock(targetId) {
  if (clockIntervals[targetId]) clearInterval(clockIntervals[targetId]);
  const update = () => {
    const now = new Date();
    const dayEl = document.getElementById(`clockDay-${targetId}`);
    const timeEl = document.getElementById(`clockTime-${targetId}`);
    const dateEl = document.getElementById(`clockDate-${targetId}`);
    if (!dayEl) return;
    dayEl.textContent = now.toLocaleDateString(undefined, { weekday: "long" });
    timeEl.textContent = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    dateEl.textContent = now.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  };
  update();
  clockIntervals[targetId] = setInterval(update, 15000);
}

// ---------- WEEK RAIL ----------
function renderRail() {
  const rail = document.getElementById("weekRail");
  rail.innerHTML = "";
  for (let w = 1; w <= getTotalWeeks(); w++) {
    const phase = getPhaseForWeek(w);
    const block = document.createElement("div");
    block.className = "rail-block " + phase;
    if (w === state.week) block.classList.add("active");
    const hasLog = sessions.some(s => s.week === w);
    if (hasLog) block.classList.add("done");
    block.innerHTML = `<span>${w}</span><span class="dot"></span>`;
    block.addEventListener("click", () => {
      state.week = w;
      saveState(state);
      renderRail();
      renderPhaseLabel();
      renderDayStrip();
    });
    rail.appendChild(block);
  }
}

function renderPhaseLabel() {
  const el = document.getElementById("phaseLabel");
  if (!el) return;
  const noProgram = (typeof hasProgramConfigured === "function" && !hasProgramConfigured())
    || (typeof PROGRAM === "undefined" || !PROGRAM || Object.keys(PROGRAM).length === 0);
  if (noProgram) {
    el.textContent = "No program yet";
    return;
  }
  const phase = getPhaseForWeek(state.week);
  const label = phase === "strength" ? "Strength" : (phase === "hypertrophy" ? "Hypertrophy" : "Main");
  el.textContent = `Week ${state.week} · ${label}`;
}

// ---------- DAY STRIP ----------
function renderDayStrip() {
  const strip = document.getElementById("dayStrip");
  if (!strip) return;
  const noProgram = (typeof hasProgramConfigured === "function" && !hasProgramConfigured())
    || (typeof PROGRAM === "undefined" || !PROGRAM || Object.keys(PROGRAM).length === 0);
  if (noProgram) {
    strip.innerHTML = "";
    renderDayContent();
    return;
  }
  const phase = PROGRAM[getPhaseForWeek(state.week)];
  if (!phase || !phase.days) { strip.innerHTML = ""; renderDayContent(); return; }
  strip.innerHTML = "";
  phase.days.forEach((day, i) => {
    const btn = document.createElement("button");
    btn.className = "day-btn" + (day.type === "rest" ? " rest-day" : "");
    if (i === state.dayIndex) btn.classList.add("active");
    btn.textContent = day.name.slice(0, 3);
    btn.addEventListener("click", () => {
      state.dayIndex = i;
      saveState(state);
      renderDayStrip();
      renderDayContent();
    });
    strip.appendChild(btn);
  });
  renderDayContent();
}

// ---------- DAY CONTENT ----------
function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

function updateLoggedBadge(logged) {
  const header = document.getElementById("dayHeaderTitle");
  if (!header) return;
  const existingBadge = header.querySelector(".logged-badge");
  if (logged && !existingBadge) header.insertAdjacentHTML("beforeend", '<span class="logged-badge">Logged</span>');
  else if (!logged && existingBadge) existingBadge.remove();
}

function renderTimingLine(session) {
  const el = document.getElementById("dayTimingLine");
  if (!el) return;
  if (!session || !session.startTime) { el.textContent = ""; return; }
  const start = formatTime(session.startTime);
  if (session.endTime && session.endTime !== session.startTime) {
    const dur = new Date(session.endTime) - new Date(session.startTime);
    el.textContent = `Started ${start} · ${formatDuration(dur)}`;
  } else {
    el.textContent = `Started ${start}`;
  }
}

function renderDayContent() {
  const container = document.getElementById("dayContent");
  if (!container) return;
  // Guard: no program set up yet — show hint to build one
  const noProgram = (typeof hasProgramConfigured === "function" && !hasProgramConfigured())
    || (typeof PROGRAM === "undefined" || !PROGRAM || Object.keys(PROGRAM).length === 0);
  if (noProgram) {
    container.innerHTML = `
      <div class="exercise-card" style="text-align:center; padding:32px 16px;">
        <div style="font-size:15px; margin-bottom:8px;">No routine yet</div>
        <div class="task-note" style="margin-bottom:20px;">Head to the <strong>Home</strong> tab and tap "Build your workout routine" to answer a few questions and generate a program.</div>
        <button class="save-btn" onclick="document.querySelector('[data-view=&quot;home&quot;]').click()">Go to Home</button>
      </div>`;
    return;
  }
  const phase = PROGRAM[getPhaseForWeek(state.week)];
  if (!phase || !phase.days || !phase.days[state.dayIndex]) {
    container.innerHTML = `<div class="exercise-card"><div class="task-note">This day is not defined in your program.</div></div>`;
    return;
  }
  const day = phase.days[state.dayIndex];
  container.innerHTML = "";

  const existing = findSession(state.week, day.name);

  const header = document.createElement("div");
  header.className = "day-header";
  header.innerHTML = `<h2 id="dayHeaderTitle">${day.title}${existing ? '<span class="logged-badge">Logged</span>' : ""}</h2>
    <div class="day-meta">${day.name} · Week ${state.week} · saves automatically as you type</div>
    <div class="day-timing" id="dayTimingLine"></div>`;
  container.appendChild(header);
  renderTimingLine(existing);

  // ---- Program-complete flow ----
  // On the last training day of the last week, show a "Mark Program Complete" button.
  const totalWeeks = getTotalWeeks();
  const isLastWeek = (state.week === totalWeeks);
  // Determine the last training day of the current phase
  const trainingDayIndexes = phase.days
    .map((d, i) => d.type === "training" ? i : -1)
    .filter(i => i >= 0);
  const isLastTrainingDay = trainingDayIndexes.length > 0
    && state.dayIndex === trainingDayIndexes[trainingDayIndexes.length - 1];
  if (isLastWeek && isLastTrainingDay && day.type === "training") {
    const completeBtn = document.createElement("div");
    completeBtn.className = "program-complete-cta";
    completeBtn.innerHTML = `
      <div class="pc-title">Final training day of your ${totalWeeks}-week program</div>
      <div class="pc-sub">When you're done, mark the program complete to unlock full analytics and pick what's next.</div>
      <button class="pc-btn" id="markCompleteBtn">Mark Program Complete</button>
    `;
    container.appendChild(completeBtn);
    setTimeout(() => {
      const btn = document.getElementById("markCompleteBtn");
      if (btn) btn.addEventListener("click", handleMarkProgramComplete);
    }, 30);
  }

  if (day.type === "rest") {
    let currentSession = existing;
    const box = document.createElement("div");
    box.className = "exercise-card";
    day.tasks.forEach((t, i) => {
      const row = document.createElement("label");
      row.className = "task-row task-row-check";
      const checked = currentSession?.tasksDone?.[i] ? "checked" : "";
      const hasMoves = t.mobility_moves && t.mobility_moves.length > 0;
      row.innerHTML = `
        <span class="task-check-left">
          <input type="checkbox" data-task="${i}" ${checked}>
          <span>${t.task}</span>
        </span>
        <span class="task-note">${t.notes || ""}</span>`;
      box.appendChild(row);

      if (hasMoves) {
        const movesBox = document.createElement("div");
        movesBox.className = "mobility-moves-box";
        movesBox.innerHTML = `
          <button class="mobility-toggle">
            <span>View drills (${t.mobility_moves.length})</span>
            <span class="mobility-arrow">▸</span>
          </button>
          <div class="mobility-moves-body" style="display:none;">
            ${t.mobility_moves.map(m => `
              <div class="mobility-move-line">
                <span class="move-name">${m.name}</span>
                <span class="move-target">${m.sets || 1}${m.reps ? "×" + m.reps : ""}${m.hold ? " · hold " + m.hold : ""}</span>
              </div>`).join("")}
          </div>`;
        box.appendChild(movesBox);
        const toggle = movesBox.querySelector(".mobility-toggle");
        const bodyEl = movesBox.querySelector(".mobility-moves-body");
        const arrow = movesBox.querySelector(".mobility-arrow");
        toggle.addEventListener("click", (e) => {
          e.preventDefault();
          const open = bodyEl.style.display !== "none";
          bodyEl.style.display = open ? "none" : "block";
          arrow.textContent = open ? "▸" : "▾";
        });
      }
    });
    container.appendChild(box);

    box.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener("change", () => {
        const doneStates = Array.from(box.querySelectorAll('input[type="checkbox"]')).map(c => c.checked);
        const anyChecked = doneStates.some(Boolean);
        const nowISO = new Date().toISOString();

        if (!anyChecked) {
          if (currentSession) {
            sessions = sessions.filter(s => s.id !== currentSession.id);
            currentSession = null;
            saveSessions(sessions);
            renderRail();
            updateLoggedBadge(false);
            renderTimingLine(null);
            if (document.getElementById("dashboard-home")) renderDashboard("dashboard-home");
            renderDashboard("dashboard-progress");
            syncPush(`Clear rest day — Week ${state.week} ${day.name}`);
          }
          return;
        }

        if (!currentSession) {
          currentSession = { id: Date.now().toString(), week: state.week, day: day.name, startTime: nowISO };
          sessions.push(currentSession);
        }
        currentSession.date = todayISO();
        currentSession.phase = phase.key;
        currentSession.dayTitle = day.title;
        currentSession.exercises = [];
        currentSession.rest = true;
        currentSession.tasksDone = doneStates;
        currentSession.endTime = nowISO;
        if (!currentSession.startTime) currentSession.startTime = nowISO;
        saveSessions(sessions);
        renderRail();
        updateLoggedBadge(true);
        renderTimingLine(currentSession);
        if (document.getElementById("dashboard-home")) renderDashboard("dashboard-home");
        renderDashboard("dashboard-progress");
        syncPush(`Rest day — Week ${state.week} ${day.name}`);
      });
    });
    return;
  }

  let currentSession = existing;

  function getSwappedName(exIdx) {
    return currentSession?.swaps?.[exIdx] || null;
  }

  function renderExerciseCard(ex, exIdx) {
    const swappedName = getSwappedName(exIdx);
    const effectiveName = swappedName || ex.name;
    const effectiveMuscle = EXERCISE_MUSCLE[effectiveName] || ex.muscle;
    const effectiveSecondary = EXERCISE_SECONDARY[effectiveName] || ex.secondary || [];
    const isCompoundLift = EXERCISE_COMPOUND[effectiveName];
    const warmupCount = isCompoundLift ? 2 : 0;

    const card = document.createElement("div");
    card.className = "exercise-card";
    card.dataset.exIdx = exIdx;

    const titleRow = document.createElement("div");
    titleRow.className = "exercise-title-row";
    const muscleColor = (MUSCLE_INFO[effectiveMuscle] && MUSCLE_INFO[effectiveMuscle].color) || "#5C6670";
    const viewLabel = (MUSCLE_INFO[effectiveMuscle] && MUSCLE_INFO[effectiveMuscle].view) === "back" ? "Back view" : "Front view";
    const secondaryChips = effectiveSecondary.map(sm => {
      const c = (MUSCLE_INFO[sm] && MUSCLE_INFO[sm].light) || "#5C6670";
      return `<span class="secondary-chip" style="--chip-color:${c}">${sm}</span>`;
    }).join("");

    titleRow.innerHTML = `
      <div class="exercise-diagram">
        ${bodyDiagramFor(effectiveMuscle, effectiveSecondary)}
      </div>
      <div class="exercise-name-wrap">
        <span class="exercise-name">${effectiveName}${swappedName ? '<span class="swapped-tag">Swapped</span>' : ""}</span>
        <span class="muscle-chip glow" style="--chip-color:${muscleColor}; color:${muscleColor};">${effectiveMuscle}</span>
        ${secondaryChips ? `<div class="secondary-chip-row">${secondaryChips}</div>` : ""}
        <span class="view-label">${viewLabel}</span>
      </div>
      <span class="exercise-target">${ex.target}</span>`;
    card.appendChild(titleRow);

    // Alternatives row (swap for this session only)
    const alternatives = findAlternatives(swappedName || ex.name);
    const altBar = document.createElement("div");
    altBar.className = "alt-bar";
    const altChips = [];
    if (swappedName) {
      altChips.push(`<button class="alt-chip alt-reset" data-ex="${exIdx}" data-swap="">↺ Use ${ex.name}</button>`);
    }
    alternatives.forEach(altName => {
      altChips.push(`<button class="alt-chip" data-ex="${exIdx}" data-swap="${altName}">${altName}</button>`);
    });
    if (altChips.length) {
      altBar.innerHTML = `<div class="alt-bar-label">No equipment? Swap:</div><div class="alt-chip-row">${altChips.join("")}</div>`;
      card.appendChild(altBar);
    }

    // Technique cues (from pool). Collapsible — hidden by default, tap to expand.
    let cues = (ex.technique_cues && ex.technique_cues.length ? ex.technique_cues : null);
    if (!cues && typeof poolLookup === "function") {
      const pooled = poolLookup(effectiveName);
      if (pooled && pooled.technique_cues && pooled.technique_cues.length) {
        cues = pooled.technique_cues;
      }
    }
    if (cues) {
      const cuesBox = document.createElement("div");
      cuesBox.className = "cues-box";
      cuesBox.innerHTML = `
        <button class="cues-toggle" data-ex-idx="${exIdx}">
          <span class="cues-toggle-label">Technique cues</span>
          <span class="cues-toggle-arrow">▸</span>
        </button>
        <div class="cues-body" style="display:none;">
          ${cues.map(c => `<div class="cue-line">• ${c}</div>`).join("")}
        </div>`;
      card.appendChild(cuesBox);
      setTimeout(() => {
        const toggle = cuesBox.querySelector(".cues-toggle");
        const body = cuesBox.querySelector(".cues-body");
        const arrow = cuesBox.querySelector(".cues-toggle-arrow");
        toggle.addEventListener("click", () => {
          const open = body.style.display !== "none";
          body.style.display = open ? "none" : "block";
          arrow.textContent = open ? "▸" : "▾";
        });
      }, 0);
    }

    // Warm-up rows (checkbox only, no weight/reps needed)
    if (warmupCount > 0) {
      const warmupBox = document.createElement("div");
      warmupBox.className = "warmup-box";
      const savedWarmups = currentSession?.warmups?.[exIdx] || [];
      let warmupHtml = `<div class="warmup-label">Warm-up sets — do these before your working sets</div>`;
      for (let w = 0; w < warmupCount; w++) {
        const checked = savedWarmups[w] ? "checked" : "";
        warmupHtml += `<label class="warmup-row"><input type="checkbox" data-warmup-ex="${exIdx}" data-warmup-idx="${w}" ${checked}><span>Warm-up set ${w + 1}</span></label>`;
      }
      warmupBox.innerHTML = warmupHtml;
      card.appendChild(warmupBox);
    }

    const labels = document.createElement("div");
    labels.className = "set-labels";
    labels.innerHTML = `<span></span><span>kg</span><span>reps</span>`;
    card.appendChild(labels);

    const grid = document.createElement("div");
    grid.className = "set-grid";

    const prevEx = existing?.exercises?.find(e => e.name === effectiveName);

    for (let i = 0; i < ex.sets; i++) {
      const row = document.createElement("div");
      row.className = "set-row";
      const prevSet = prevEx?.sets?.[i];
      row.innerHTML = `
        <span class="set-num">${i + 1}</span>
        <input type="number" inputmode="decimal" step="0.5" placeholder="kg"
          data-ex="${exIdx}" data-set="${i}" data-field="weight"
          value="${prevSet?.weight ?? ""}">
        <input type="number" inputmode="numeric" placeholder="reps"
          data-ex="${exIdx}" data-set="${i}" data-field="reps"
          value="${prevSet?.reps ?? ""}">
      `;
      grid.appendChild(row);
    }
    card.appendChild(grid);
    return card;
  }

  day.exercises.forEach((ex, exIdx) => {
    container.appendChild(renderExerciseCard(ex, exIdx));
  });

  // Wire alternative-swap buttons
  container.querySelectorAll(".alt-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      const exIdx = btn.dataset.ex;
      const swapTo = btn.dataset.swap;
      if (!currentSession) {
        currentSession = { id: Date.now().toString(), week: state.week, day: day.name, startTime: new Date().toISOString() };
        sessions.push(currentSession);
      }
      currentSession.swaps = currentSession.swaps || {};
      if (swapTo) currentSession.swaps[exIdx] = swapTo;
      else delete currentSession.swaps[exIdx];
      saveSessions(sessions);
      renderDayContent();
    });
  });

  // Wire warm-up checkboxes
  container.querySelectorAll('input[data-warmup-ex]').forEach(cb => {
    cb.addEventListener("change", () => {
      const exIdx = cb.dataset.warmupEx;
      const wIdx = parseInt(cb.dataset.warmupIdx);
      if (!currentSession) {
        currentSession = { id: Date.now().toString(), week: state.week, day: day.name, startTime: new Date().toISOString() };
        sessions.push(currentSession);
      }
      currentSession.warmups = currentSession.warmups || {};
      currentSession.warmups[exIdx] = currentSession.warmups[exIdx] || [];
      currentSession.warmups[exIdx][wIdx] = cb.checked;
      saveSessions(sessions);
      syncPush(`Warm-up — Week ${state.week} ${day.name}`);
    });
  });

  const doAutosave = debounce(() => {
    const exercises = day.exercises.map((ex, exIdx) => {
      const sets = [];
      for (let i = 0; i < ex.sets; i++) {
        const w = container.querySelector(`input[data-ex="${exIdx}"][data-set="${i}"][data-field="weight"]`).value;
        const r = container.querySelector(`input[data-ex="${exIdx}"][data-set="${i}"][data-field="reps"]`).value;
        if (w !== "" || r !== "") {
          sets.push({ weight: w !== "" ? parseFloat(w) : null, reps: r !== "" ? parseInt(r) : null });
        }
      }
      const effectiveName = getSwappedName(exIdx) || ex.name;
      return { name: effectiveName, target: ex.target, sets };
    }).filter(e => e.sets.length > 0);

    const nowISO = new Date().toISOString();

    if (exercises.length === 0) {
      if (currentSession) {
        sessions = sessions.filter(s => s.id !== currentSession.id);
        currentSession = null;
        saveSessions(sessions);
        renderRail();
        updateLoggedBadge(false);
        renderTimingLine(null);
        if (document.getElementById("dashboard-home")) renderDashboard("dashboard-home");
        renderDashboard("dashboard-progress");
        syncPush(`Clear — Week ${state.week} ${day.name}`);
      }
      return;
    }

    if (!currentSession) {
      currentSession = { id: Date.now().toString(), week: state.week, day: day.name, startTime: nowISO };
      sessions.push(currentSession);
    }
    if (!currentSession.startTime) currentSession.startTime = nowISO;
    currentSession.endTime = nowISO;
    currentSession.date = todayISO();
    currentSession.phase = phase.key;
    currentSession.dayTitle = day.title;
    currentSession.exercises = exercises;
    currentSession.rest = false;

    saveSessions(sessions);
    renderRail();
    updateLoggedBadge(true);
    renderTimingLine(currentSession);
    showToast("Saved");
    if (document.getElementById("dashboard-home")) renderDashboard("dashboard-home");
    if (document.getElementById("dashboard-progress")) renderDashboard("dashboard-progress");
    syncPush(`${day.title} — Week ${state.week} ${day.name}`);
  }, 700);

  container.querySelectorAll(".set-row input").forEach(inp => {
    inp.addEventListener("input", doAutosave);
  });

  // ---- Companion session block (for generated programs that were split) ----
  if (day.companion && day.companion.exercises && day.companion.exercises.length > 0) {
    const companion = document.createElement("div");
    companion.className = "companion-session-card";
    companion.innerHTML = `
      <div class="companion-session-title">${day.companion.title || "Companion session"}</div>
      <div class="companion-session-notes">${day.companion.notes || ""}</div>
      ${day.companion.exercises.map(ex =>
        `<div class="companion-exercise-line">
          <strong>${ex.name}</strong>
          <span class="ex-target">${ex.target || ""}</span>
        </div>`
      ).join("")}
    `;
    container.appendChild(companion);
  }
}

// ---------- PROGRESS TAB ----------
function allExerciseNames() {
  const names = new Set();
  Object.values(PROGRAM).forEach(phase => {
    phase.days.forEach(day => { if (day.type === "training") day.exercises.forEach(ex => names.add(ex.name)); });
  });
  return Array.from(names).sort();
}

let weightChart, volumeChart, weightTrendChart, muscleBarChart;

function renderProgressTab() {
  renderDashboard("dashboard-progress");
  renderWeightTrendChart();
  renderMuscleBarChart();

  const select = document.getElementById("exerciseSelect");
  if (!select.dataset.filled) {
    allExerciseNames().forEach(name => {
      const opt = document.createElement("option");
      opt.value = name; opt.textContent = name;
      select.appendChild(opt);
    });
    select.dataset.filled = "1";
    select.addEventListener("change", () => drawExerciseCharts(select.value));
  }
  if (select.value) drawExerciseCharts(select.value);
  else if (select.options.length) drawExerciseCharts(select.options[0].value);
}

function chartCommonOpts(yLabel, xLabel, yMax) {
  const scales = {
    x: {
      ticks: { color: "#9b9890", font: { size: 10 } },
      grid: { color: "#2e2e2e" },
      title: xLabel ? { display: true, text: xLabel, color: "#9b9890", font: { size: 10 } } : undefined,
    },
    y: {
      ticks: { color: "#9b9890" },
      grid: { color: "#2e2e2e" },
      beginAtZero: true,
      title: yLabel ? { display: true, text: yLabel, color: "#9b9890", font: { size: 10 } } : undefined,
    }
  };
  if (yMax != null) scales.y.suggestedMax = yMax;
  return {
    responsive: true,
    plugins: { legend: { display: false } },
    scales,
  };
}

function renderWeightTrendChart() {
  const canvas = document.getElementById("weightTrendChart");
  const emptyNote = document.getElementById("weightTrendEmpty");
  if (emptyNote) emptyNote.style.display = "none";
  canvas.style.display = "block";
  const sorted = [...weightLogs].sort((a, b) => a.date < b.date ? -1 : 1);
  if (weightTrendChart) weightTrendChart.destroy();

  let labels, data, yMax;
  if (sorted.length === 0) {
    // Scaffold: last 7 days, no points yet, but a real labeled axis baseline
    const today = new Date();
    labels = Array.from({ length: 7 }, (_, i) => formatDate(addDays(today, i - 6).toISOString().slice(0, 10)));
    data = labels.map(() => null);
    const profile = (typeof loadFoodProfile === "function") ? loadFoodProfile() : null;
    yMax = profile?.weightKg ? Math.ceil(profile.weightKg * 1.3 / 10) * 10 : 100;
  } else {
    labels = sorted.map(w => formatDate(w.date));
    data = sorted.map(w => w.weightKg);
    yMax = Math.ceil(Math.max(...data) * 1.15 / 10) * 10;
  }

  weightTrendChart = new Chart(canvas, {
    type: "line",
    data: { labels, datasets: [{
      data, borderColor: "#4A9EFF", backgroundColor: "rgba(74,158,255,0.15)",
      pointBackgroundColor: "#4A9EFF", tension: 0.3, fill: true, spanGaps: true,
    }]},
    options: chartCommonOpts("Weight (kg)", "Date", yMax)
  });
}

function renderMuscleBarChart() {
  const canvas = document.getElementById("muscleBarChart");
  const monday = getMonday(new Date());
  const prevMonday = addDays(monday, -7);
  const thisWeek = computeWeekStats(monday);
  const lastWeek = computeWeekStats(prevMonday);
  const labels = MUSCLE_ORDER.map(m => m.length > 12 ? m.split(" ")[0] : m);
  const thisData = MUSCLE_ORDER.map(m => thisWeek.muscleSets[m] || 0);
  const lastData = MUSCLE_ORDER.map(m => lastWeek.muscleSets[m] || 0);
  const maxVal = Math.max(...thisData, ...lastData, 5);

  if (muscleBarChart) muscleBarChart.destroy();
  muscleBarChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "This week", data: thisData, backgroundColor: "#D4551F" },
        { label: "Last week", data: lastData, backgroundColor: "#5C6670" },
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true, labels: { color: "#9b9890", font: { size: 10 } } } },
      scales: {
        x: {
          ticks: { color: "#9b9890", font: { size: 9 } }, grid: { display: false },
          title: { display: true, text: "Muscle group", color: "#9b9890", font: { size: 10 } },
        },
        y: {
          ticks: { color: "#9b9890" }, grid: { color: "#2e2e2e" }, beginAtZero: true, suggestedMax: Math.ceil(maxVal * 1.2),
          title: { display: true, text: "Working sets", color: "#9b9890", font: { size: 10 } },
        }
      }
    }
  });
}

function drawExerciseCharts(exerciseName) {
  const points = [];
  sessions.filter(s => !s.rest).sort((a, b) => (a.id > b.id ? 1 : -1)).forEach(s => {
    const ex = s.exercises.find(e => e.name === exerciseName);
    if (!ex) return;
    const weights = ex.sets.map(x => x.weight).filter(w => w != null);
    const volume = ex.sets.reduce((sum, x) => sum + ((x.weight || 0) * (x.reps || 0)), 0);
    points.push({ date: s.date, week: s.week, topWeight: weights.length ? Math.max(...weights) : null, volume });
  });

  let labels, weightData, volumeData, weightMax, volumeMax;
  if (points.length === 0) {
    labels = ["Session 1", "Session 2", "Session 3", "Session 4", "Session 5"];
    weightData = labels.map(() => null);
    volumeData = labels.map(() => null);
    weightMax = 100;
    volumeMax = 1000;
  } else {
    labels = points.map(p => `W${p.week} · ${formatDate(p.date)}`);
    weightData = points.map(p => p.topWeight);
    volumeData = points.map(p => p.volume);
    weightMax = Math.ceil(Math.max(...weightData.filter(w => w != null), 10) * 1.15);
    volumeMax = Math.ceil(Math.max(...volumeData, 100) * 1.15);
  }

  const ctxW = document.getElementById("weightChart");
  const ctxV = document.getElementById("volumeChart");
  if (weightChart) weightChart.destroy();
  if (volumeChart) volumeChart.destroy();

  weightChart = new Chart(ctxW, {
    type: "line",
    data: { labels, datasets: [{ data: weightData, borderColor: "#D4551F", backgroundColor: "rgba(181,70,27,0.15)", pointBackgroundColor: "#D4551F", tension: 0.25, fill: true, spanGaps: true }]},
    options: chartCommonOpts("Top weight (kg)", "Session", weightMax)
  });
  volumeChart = new Chart(ctxV, {
    type: "bar",
    data: { labels, datasets: [{ data: volumeData, backgroundColor: "#5C6670" }]},
    options: chartCommonOpts("Volume (kg × reps)", "Session", volumeMax)
  });

  const prBox = document.getElementById("prBox");
  if (points.length === 0) {
    prBox.innerHTML = "No logged sets yet for this exercise.";
  } else {
    const bestWeight = Math.max(...weightData.filter(w => w != null), 0);
    const bestVolume = Math.max(...volumeData, 0);
    prBox.innerHTML = `
      <div class="pr-line">Personal bests</div>
      <div>Top weight: <span class="pr-value">${bestWeight} kg</span></div>
      <div>Best session volume: <span class="pr-value">${bestVolume.toFixed(0)} kg</span></div>
      <div>Sessions logged: <span class="pr-value">${points.length}</span></div>
    `;
  }
}

// ---------- HISTORY ----------
function renderHistory() {
  const list = document.getElementById("historyList");
  const empty = document.getElementById("historyEmpty");
  list.innerHTML = "";
  const sorted = [...sessions].sort((a, b) => (a.id < b.id ? 1 : -1));
  empty.style.display = sorted.length ? "none" : "block";

  sorted.forEach(s => {
    const card = document.createElement("div");
    card.className = "history-card";
    const phaseLabel = s.phase === "strength" ? "Strength" : "Hypertrophy";

    let timingStr = "";
    if (s.startTime) {
      timingStr = `Started ${formatTime(s.startTime)}`;
      if (s.endTime && s.endTime !== s.startTime) {
        timingStr += ` · ${formatDuration(new Date(s.endTime) - new Date(s.startTime))}`;
      }
    }

    let body = "";
    if (s.rest) {
      body = `<div class="history-ex">Rest day completed</div>`;
    } else {
      body = s.exercises.map(ex => {
        const setStr = ex.sets.map(x => `${x.weight ?? "–"}kg×${x.reps ?? "–"}`).join(", ");
        return `<div class="history-ex"><b>${ex.name}:</b> ${setStr}</div>`;
      }).join("");
    }

    card.innerHTML = `
      <div class="history-head">
        <span class="history-date">${formatDate(s.date)} · ${s.day}</span>
        <span class="history-tag">Wk ${s.week} · ${phaseLabel}</span>
      </div>
      ${timingStr ? `<div class="history-ex" style="color:var(--accent-cyan);">${timingStr}</div>` : ""}
      ${body}
      <button class="history-del" data-id="${s.id}">Delete session</button>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll(".history-del").forEach(btn => {
    btn.addEventListener("click", () => {
      const session = sessions.find(s => s.id === btn.dataset.id);
      const setCount = session && !session.rest
        ? session.exercises.reduce((sum, ex) => sum + (ex.sets || []).length, 0)
        : 0;

      // If session has no logged sets, delete directly with a single tap confirmation
      const doDelete = () => {
        sessions = sessions.filter(s => s.id !== btn.dataset.id);
        saveSessions(sessions);
        renderHistory();
        renderRail();
        renderDayContent();
        if (document.getElementById("dashboard-home")) renderDashboard("dashboard-home");
        if (document.getElementById("dashboard-progress")) renderDashboard("dashboard-progress");
        syncPush("Delete session");
      };

      if (setCount === 0) {
        confirmAction({
          title: "Delete this rest day / empty session?",
          body: "Nothing was logged in this entry.",
          confirmLabel: "Delete",
          cancelLabel: "Cancel",
          danger: false,
          onConfirm: doDelete,
        });
      } else {
        confirmAction({
          title: "Delete this session?",
          body: `This session has <strong>${setCount} logged set${setCount === 1 ? "" : "s"}</strong>. Deletion is permanent.`,
          confirmLabel: "Yes, delete",
          cancelLabel: "Cancel",
          danger: true,
          onConfirm: doDelete,
        });
      }
    });
  });
}

// ---------- PROGRAM COMPLETE FLOW ----------
function handleMarkProgramComplete() {
  const sessionCount = countActiveSessions();
  const cfg = loadConfig() || {};
  const totalWeeks = getTotalWeeks();
  confirmAction({
    title: "Mark program complete?",
    body: `
      <p>You'll archive this <strong>${totalWeeks}-week program</strong> with all <strong>${sessionCount} sessions</strong> logged.</p>
      <p>Your data stays. You'll get full analytics, and can then choose to run this program again or build a new one.</p>
    `,
    confirmLabel: "Yes, complete it",
    cancelLabel: "Not yet",
    danger: false,
    onConfirm: () => {
      const archive = archiveActiveProgram(sessionCount);
      if (archive) {
        showToast("Program archived. Full analytics ready in Progress.");
        // Open post-complete choice: rerun same program OR build new
        setTimeout(() => showProgramCompleteChoice(archive), 500);
      }
    },
  });
}

function showProgramCompleteChoice(archive) {
  const savedProgram = archive.program; // preserve to re-run
  const body = `
    <p>Nice work. What next?</p>
    <div class="choice-row">
      <button class="choice-btn" id="rerunBtn">
        <strong>Run the same program again</strong>
        <span>Fresh log, same routine, week 1 day 1.</span>
      </button>
      <button class="choice-btn" id="newBuildBtn">
        <strong>Build a new program</strong>
        <span>Answer the intake questions again.</span>
      </button>
    </div>
  `;
  confirmAction({
    title: "Program complete!",
    body,
    confirmLabel: "Close",
    cancelLabel: "Later",
    danger: false,
    onConfirm: () => {},
  });
  setTimeout(() => {
    const rerunBtn = document.getElementById("rerunBtn");
    const newBuildBtn = document.getElementById("newBuildBtn");
    if (rerunBtn) rerunBtn.addEventListener("click", () => {
      document.getElementById("confirm-modal-overlay")?.remove();
      // Restore the archived program as the active one, clear sessions (fresh log)
      saveActiveProgram(savedProgram);
      const oldCfg = loadConfig() || {};
      saveConfig({
        ...oldCfg,
        program_configured: true,
        created_at: new Date().toISOString(),
        program_id: (savedProgram._id || oldCfg.program_id) + "_rerun_" + Date.now(),
      });
      // Reset session log (archived copy already preserved in archives)
      sessions.length = 0;
      saveSessions(sessions);
      state.week = 1; state.dayIndex = 0;
      saveState(state);
      showToast("Program restarted from Week 1 Day 1");
      setTimeout(() => location.reload(), 400);
    });
    if (newBuildBtn) newBuildBtn.addEventListener("click", () => {
      document.getElementById("confirm-modal-overlay")?.remove();
      // Program is already archived. Just clear the active program state.
      clearActiveProgram();
      sessions.length = 0;
      saveSessions(sessions);
      state.week = 1; state.dayIndex = 0;
      saveState(state);
      if (typeof launchIntake === "function") launchIntake();
      else location.reload();
    });
    const defConfirm = document.getElementById("confirm-modal-confirm");
    if (defConfirm) defConfirm.style.display = "none";
  }, 60);
}

// ---------- INIT ----------
// Legacy program migration + storage setup runs before anything else touches PROGRAM.
if (typeof migrateLegacyProgramIfNeeded === "function") {
  migrateLegacyProgramIfNeeded();
  activateStoredProgram();
}

// Year rollover check (for sharded sync)
if (typeof checkYearRollover === "function") checkYearRollover();

// Rebuild EXERCISE_* lookups now that PROGRAM might have changed
function rebuildExerciseLookups() {
  Object.keys(EXERCISE_MUSCLE).forEach(k => delete EXERCISE_MUSCLE[k]);
  Object.keys(EXERCISE_SECONDARY).forEach(k => delete EXERCISE_SECONDARY[k]);
  Object.keys(EXERCISE_PATTERN).forEach(k => delete EXERCISE_PATTERN[k]);
  Object.keys(EXERCISE_COMPOUND).forEach(k => delete EXERCISE_COMPOUND[k]);
  Object.keys(EXERCISE_TARGET).forEach(k => delete EXERCISE_TARGET[k]);
  if (typeof PROGRAM === "undefined" || !PROGRAM) return;
  Object.values(PROGRAM).forEach(phase => {
    if (!phase || !phase.days) return;
    phase.days.forEach(day => {
      if (day.type === "training" && day.exercises) {
        day.exercises.forEach(ex => {
          EXERCISE_MUSCLE[ex.name] = ex.muscle;
          EXERCISE_SECONDARY[ex.name] = ex.secondary || [];
          EXERCISE_PATTERN[ex.name] = ex.pattern || "";
          EXERCISE_COMPOUND[ex.name] = !!ex.compound;
          EXERCISE_TARGET[ex.name] = ex.target;
        });
      }
    });
  });
  if (typeof EXERCISE_DATABASE !== "undefined") {
    EXERCISE_DATABASE.forEach(ex => {
      if (!(ex.name in EXERCISE_MUSCLE)) {
        EXERCISE_MUSCLE[ex.name] = ex.muscle;
        EXERCISE_SECONDARY[ex.name] = ex.secondary || [];
        EXERCISE_PATTERN[ex.name] = ex.pattern || "";
        EXERCISE_COMPOUND[ex.name] = !!ex.compound;
      }
    });
  }
}
rebuildExerciseLookups();

setTimeout(() => {
  if (typeof loadFoodProfile === "function") {
    const fp = loadFoodProfile();
    if (fp?.gender) { setBodyDiagramGender(fp.gender); }
  }
  if (typeof renderHomeTab === "function") renderHomeTab();
}, 0);

// Only render Train content if a program is configured
if (hasProgramConfigured && hasProgramConfigured()) {
  renderRail();
  renderPhaseLabel();
  renderDayStrip();
}
if (loadSyncConfig()) syncPullAndApply();
