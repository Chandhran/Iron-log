// ---------- STORAGE ----------
const SESSIONS_KEY = "ironlog_sessions_v1";
const STATE_KEY = "ironlog_state_v1";

function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY)) || [];
  } catch { return []; }
}
function saveSessions(sessions) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}
function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY)) || { week: 1, dayIndex: 0 };
  } catch { return { week: 1, dayIndex: 0 }; }
}
function saveState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

let sessions = loadSessions();
let state = loadState();

// ---------- GITHUB SYNC ----------
const SYNC_CONFIG_KEY = "ironlog_sync_config_v1";
const DATA_PATH = "data/sessions.json";

function loadSyncConfig() {
  try { return JSON.parse(localStorage.getItem(SYNC_CONFIG_KEY)); } catch { return null; }
}
function saveSyncConfig(cfg) {
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(cfg));
}
function clearSyncConfig() {
  localStorage.removeItem(SYNC_CONFIG_KEY);
}

function ghApiUrl(cfg) {
  return `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${DATA_PATH}`;
}
function ghHeaders(cfg) {
  return {
    "Authorization": `Bearer ${cfg.token}`,
    "Accept": "application/vnd.github+json",
  };
}

// base64 helpers that handle unicode safely
function utf8ToB64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function b64ToUtf8(str) {
  return decodeURIComponent(escape(atob(str)));
}

async function githubPull() {
  const cfg = loadSyncConfig();
  if (!cfg) return null;
  const res = await fetch(ghApiUrl(cfg), { headers: ghHeaders(cfg) });
  if (res.status === 404) return { sessions: [], sha: null };
  if (!res.ok) throw new Error(`GitHub read failed (${res.status})`);
  const data = await res.json();
  const content = JSON.parse(b64ToUtf8(data.content));
  return { sessions: content, sha: data.sha };
}

async function githubPush(sessionsArray, message) {
  const cfg = loadSyncConfig();
  if (!cfg) return;
  // Get current sha (needed to update an existing file)
  let sha = null;
  const head = await fetch(ghApiUrl(cfg), { headers: ghHeaders(cfg) });
  if (head.ok) {
    const headData = await head.json();
    sha = headData.sha;
  } else if (head.status !== 404) {
    throw new Error(`GitHub read failed (${head.status})`);
  }

  const body = {
    message: message || "Update workout log",
    content: utf8ToB64(JSON.stringify(sessionsArray, null, 2)),
  };
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
    await githubPush(sessions, message);
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
    if (remote && remote.sessions) {
      sessions = remote.sessions;
      saveSessions(sessions);
    }
    setSyncStatus(`Connected to ${cfg.owner}/${cfg.repo}`, "connected");
    renderRail();
    renderDayContent();
    renderDashboard();
  } catch (e) {
    setSyncStatus("Connected, but last sync failed", "error");
  }
}

// ---------- HELPERS ----------
function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function formatDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
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

// ---------- NAV TABS ----------
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.getElementById("view-" + btn.dataset.view).classList.add("active");
    if (btn.dataset.view === "progress") renderProgress();
    if (btn.dataset.view === "history") renderHistory();
    if (btn.dataset.view === "sync") renderSyncTab();
  });
});

function renderSyncTab() {
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
  if (!owner || !repo || !token) {
    showToast("Fill in username, repo, and token");
    return;
  }
  saveSyncConfig({ owner, repo, token });
  await syncPullAndApply();
  // push current local sessions up in case remote file didn't exist yet
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

// ---------- EXERCISE -> MUSCLE LOOKUP ----------
const EXERCISE_MUSCLE = {};
Object.values(PROGRAM).forEach(phase => {
  phase.days.forEach(day => {
    if (day.type === "training") {
      day.exercises.forEach(ex => { EXERCISE_MUSCLE[ex.name] = ex.muscle; });
    }
  });
});

// ---------- DATE HELPERS ----------
function parseISO(iso) { return new Date(iso + "T00:00:00"); }
function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function sameDay(a, b) { return a.toDateString() === b.toDateString(); }

// ---------- WEEKLY STATS (real, computed from logged sessions) ----------
function computeWeekStats(weekStart) {
  const weekEnd = addDays(weekStart, 7);
  const weekSessions = sessions.filter(s => {
    const d = parseISO(s.date);
    return d >= weekStart && d < weekEnd;
  });

  const loggedDays = new Set(weekSessions.map(s => s.date)).size;

  let volume = 0;
  const muscleSets = {};
  weekSessions.filter(s => !s.rest).forEach(s => {
    s.exercises.forEach(ex => {
      const muscle = EXERCISE_MUSCLE[ex.name] || "Full Body";
      ex.sets.forEach(set => {
        volume += (set.weight || 0) * (set.reps || 0);
        muscleSets[muscle] = (muscleSets[muscle] || 0) + 1;
      });
    });
  });

  return { loggedDays, volume, muscleSets, weekSessions };
}

function computeStreak() {
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  const loggedDates = new Set(sessions.map(s => s.date));
  // if nothing logged today yet, start counting from yesterday
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

// ---------- DASHBOARD RENDER ----------
let clockInterval;

function renderDashboard() {
  const el = document.getElementById("dashboard");
  const monday = getMonday(new Date());
  const prevMonday = addDays(monday, -7);
  const thisWeek = computeWeekStats(monday);
  const lastWeek = computeWeekStats(prevMonday);
  const streak = computeStreak();
  const heatmap = computeHeatmap(3);

  // ----- day dots for this week (Mon..Sun) -----
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

  // ----- muscle group cards: full weekly set calculator, every group shown -----
  const muscleCardsHtml = MUSCLE_ORDER.map(m => {
    const cur = thisWeek.muscleSets[m] || 0;
    const prev = lastWeek.muscleSets[m] || 0;
    let trendLabel, trendClass;
    if (cur > prev) { trendLabel = "Growing"; trendClass = "up"; }
    else if (cur === 0 && prev === 0) { trendLabel = "No sets"; trendClass = "flat"; }
    else if (cur === 0 && prev > 0) { trendLabel = "Resting"; trendClass = "flat"; }
    else if (cur < prev) { trendLabel = "Lighter"; trendClass = "down"; }
    else { trendLabel = "Steady"; trendClass = "flat"; }
    const color = MUSCLE_GROUPS[m];
    const maxScale = Math.max(cur, prev, 10);
    const pct = Math.min(100, Math.round((cur / maxScale) * 100));
    return `
      <div class="muscle-card">
        <div class="muscle-card-top">
          <span class="muscle-card-name">${m}</span>
          <span class="muscle-trend ${trendClass}">${trendLabel}</span>
        </div>
        <div class="muscle-card-count">${cur}<span class="muscle-card-unit"> sets</span></div>
        <div class="muscle-bar-track"><div class="muscle-bar-fill" style="width:${pct}%; background:${color}"></div></div>
        <div class="muscle-card-compare">${prev} sets last week</div>
      </div>`;
  }).join("");

  // ----- monthly heatmap -----
  const heatmapHtml = heatmap.map(month => `
    <div class="heat-month">
      <div class="heat-month-label">${month.label}</div>
      <div class="heat-grid">
        ${month.days.map(d => `<span class="heat-dot ${d.logged ? "logged" : ""} ${d.future ? "future" : ""}"></span>`).join("")}
      </div>
    </div>
  `).join("");

  el.innerHTML = `
    <div class="bento-row">
      <div class="bento-card bento-clock">
        <div class="bento-label" id="clockDay">–</div>
        <div class="bento-big" id="clockTime">--:--</div>
        <div class="bento-sub" id="clockDate">–</div>
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

    <div class="section-label">Training calendar</div>
    <div class="bento-card heat-panel">
      <div class="heat-row">${heatmapHtml}</div>
    </div>
  `;

  startClock();
}

function startClock() {
  if (clockInterval) clearInterval(clockInterval);
  const update = () => {
    const now = new Date();
    const dayEl = document.getElementById("clockDay");
    const timeEl = document.getElementById("clockTime");
    const dateEl = document.getElementById("clockDate");
    if (!dayEl) return; // dashboard not mounted (different tab)
    dayEl.textContent = now.toLocaleDateString(undefined, { weekday: "long" });
    timeEl.textContent = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    dateEl.textContent = now.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  };
  update();
  clockInterval = setInterval(update, 15000);
}

// ---------- WEEK RAIL ----------
function renderRail() {
  const rail = document.getElementById("weekRail");
  rail.innerHTML = "";
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const phase = phaseForWeek(w);
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
  const phase = phaseForWeek(state.week);
  const label = phase === "strength" ? "Strength" : "Hypertrophy";
  document.getElementById("phaseLabel").textContent = `Week ${state.week} · ${label}`;
}

// ---------- DAY STRIP ----------
function renderDayStrip() {
  const phase = PROGRAM[phaseForWeek(state.week)];
  const strip = document.getElementById("dayStrip");
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
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

function updateLoggedBadge(logged) {
  const header = document.getElementById("dayHeaderTitle");
  if (!header) return;
  const existingBadge = header.querySelector(".logged-badge");
  if (logged && !existingBadge) {
    header.insertAdjacentHTML("beforeend", '<span class="logged-badge">Logged</span>');
  } else if (!logged && existingBadge) {
    existingBadge.remove();
  }
}

function renderDayContent() {
  const phase = PROGRAM[phaseForWeek(state.week)];
  const day = phase.days[state.dayIndex];
  const container = document.getElementById("dayContent");
  container.innerHTML = "";

  const existing = findSession(state.week, day.name);

  const header = document.createElement("div");
  header.className = "day-header";
  header.innerHTML = `<h2 id="dayHeaderTitle">${day.title}${existing ? '<span class="logged-badge">Logged</span>' : ""}</h2>
    <div class="day-meta">${day.name} · Week ${state.week} · saves automatically as you type</div>`;
  container.appendChild(header);

  if (day.type === "rest") {
    let currentSession = existing;
    const box = document.createElement("div");
    box.className = "exercise-card";
    day.tasks.forEach((t, i) => {
      const row = document.createElement("label");
      row.className = "task-row task-row-check";
      const checked = currentSession?.tasksDone?.[i] ? "checked" : "";
      row.innerHTML = `
        <span class="task-check-left">
          <input type="checkbox" data-task="${i}" ${checked}>
          <span>${t.task}</span>
        </span>
        <span class="task-note">${t.notes}</span>`;
      box.appendChild(row);
    });
    container.appendChild(box);

    box.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener("change", () => {
        const doneStates = Array.from(box.querySelectorAll('input[type="checkbox"]')).map(c => c.checked);
        const anyChecked = doneStates.some(Boolean);

        if (!anyChecked) {
          if (currentSession) {
            sessions = sessions.filter(s => s.id !== currentSession.id);
            currentSession = null;
            saveSessions(sessions);
            renderRail();
            updateLoggedBadge(false);
            renderDashboard();
            syncPush(`Clear rest day — Week ${state.week} ${day.name}`);
          }
          return;
        }

        if (!currentSession) {
          currentSession = { id: Date.now().toString(), week: state.week, day: day.name };
          sessions.push(currentSession);
        }
        currentSession.date = todayISO();
        currentSession.phase = phase.key;
        currentSession.dayTitle = day.title;
        currentSession.exercises = [];
        currentSession.rest = true;
        currentSession.tasksDone = doneStates;
        saveSessions(sessions);
        renderRail();
        updateLoggedBadge(true);
        renderDashboard();
        syncPush(`Rest day — Week ${state.week} ${day.name}`);
      });
    });
    return;
  }

  // training day: exercise cards, autosave on input
  let currentSession = existing;

  day.exercises.forEach((ex, exIdx) => {
    const card = document.createElement("div");
    card.className = "exercise-card";

    const titleRow = document.createElement("div");
    titleRow.className = "exercise-title-row";
    const muscleColor = MUSCLE_GROUPS[ex.muscle] || "#5C6670";
    titleRow.innerHTML = `
      <div class="exercise-name-wrap">
        <span class="exercise-name">${ex.name}</span>
        <span class="muscle-chip" style="--chip-color:${muscleColor}">${ex.muscle}</span>
      </div>
      <span class="exercise-target">${ex.target}</span>`;
    card.appendChild(titleRow);

    const labels = document.createElement("div");
    labels.className = "set-labels";
    labels.innerHTML = `<span></span><span>kg</span><span>reps</span>`;
    card.appendChild(labels);

    const grid = document.createElement("div");
    grid.className = "set-grid";

    const prevEx = existing?.exercises?.find(e => e.name === ex.name);

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
    container.appendChild(card);
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
      return { name: ex.name, target: ex.target, sets };
    }).filter(e => e.sets.length > 0);

    if (exercises.length === 0) {
      if (currentSession) {
        sessions = sessions.filter(s => s.id !== currentSession.id);
        currentSession = null;
        saveSessions(sessions);
        renderRail();
        updateLoggedBadge(false);
        renderDashboard();
        syncPush(`Clear — Week ${state.week} ${day.name}`);
      }
      return;
    }

    if (!currentSession) {
      currentSession = { id: Date.now().toString(), week: state.week, day: day.name };
      sessions.push(currentSession);
    }
    currentSession.date = todayISO();
    currentSession.phase = phase.key;
    currentSession.dayTitle = day.title;
    currentSession.exercises = exercises;
    currentSession.rest = false;

    saveSessions(sessions);
    renderRail();
    updateLoggedBadge(true);
    showToast("Saved");
    renderDashboard();
    syncPush(`${day.title} — Week ${state.week} ${day.name}`);
  }, 700);

  container.querySelectorAll(".set-row input").forEach(inp => {
    inp.addEventListener("input", doAutosave);
  });
}

// ---------- PROGRESS ----------
function allExerciseNames() {
  const names = new Set();
  Object.values(PROGRAM).forEach(phase => {
    phase.days.forEach(day => {
      if (day.type === "training") day.exercises.forEach(ex => names.add(ex.name));
    });
  });
  return Array.from(names).sort();
}

let weightChart, volumeChart;

function renderProgress() {
  const select = document.getElementById("exerciseSelect");
  if (!select.dataset.filled) {
    allExerciseNames().forEach(name => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });
    select.dataset.filled = "1";
    select.addEventListener("change", () => drawExerciseCharts(select.value));
  }
  if (select.value) drawExerciseCharts(select.value);
  else if (select.options.length) drawExerciseCharts(select.options[0].value);
}

function drawExerciseCharts(exerciseName) {
  const points = [];
  sessions
    .filter(s => !s.rest)
    .sort((a, b) => (a.id > b.id ? 1 : -1))
    .forEach(s => {
      const ex = s.exercises.find(e => e.name === exerciseName);
      if (!ex) return;
      const weights = ex.sets.map(x => x.weight).filter(w => w != null);
      const volume = ex.sets.reduce((sum, x) => sum + ((x.weight || 0) * (x.reps || 0)), 0);
      points.push({
        date: s.date,
        week: s.week,
        topWeight: weights.length ? Math.max(...weights) : null,
        volume: volume,
      });
    });

  const labels = points.map(p => `W${p.week} · ${formatDate(p.date)}`);
  const weightData = points.map(p => p.topWeight);
  const volumeData = points.map(p => p.volume);

  const ctxW = document.getElementById("weightChart");
  const ctxV = document.getElementById("volumeChart");

  if (weightChart) weightChart.destroy();
  if (volumeChart) volumeChart.destroy();

  const commonOpts = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: "#9b9890", font: { size: 10 } }, grid: { color: "#2e2e2e" } },
      y: { ticks: { color: "#9b9890" }, grid: { color: "#2e2e2e" }, beginAtZero: true }
    }
  };

  weightChart = new Chart(ctxW, {
    type: "line",
    data: { labels, datasets: [{
      data: weightData, borderColor: "#D4551F", backgroundColor: "rgba(181,70,27,0.15)",
      pointBackgroundColor: "#D4551F", tension: 0.25, fill: true, spanGaps: true,
    }]},
    options: commonOpts
  });

  volumeChart = new Chart(ctxV, {
    type: "bar",
    data: { labels, datasets: [{
      data: volumeData, backgroundColor: "#5C6670",
    }]},
    options: commonOpts
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
      ${body}
      <button class="history-del" data-id="${s.id}">Delete session</button>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll(".history-del").forEach(btn => {
    btn.addEventListener("click", () => {
      sessions = sessions.filter(s => s.id !== btn.dataset.id);
      saveSessions(sessions);
      renderHistory();
      renderRail();
      renderDayContent();
      renderDashboard();
      syncPush("Delete session");
    });
  });
}

// ---------- INIT ----------
renderDashboard();
renderRail();
renderPhaseLabel();
renderDayStrip();
if (loadSyncConfig()) syncPullAndApply();
