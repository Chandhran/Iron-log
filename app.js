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
function renderDayContent() {
  const phase = PROGRAM[phaseForWeek(state.week)];
  const day = phase.days[state.dayIndex];
  const container = document.getElementById("dayContent");
  container.innerHTML = "";

  const existing = findSession(state.week, day.name);

  const header = document.createElement("div");
  header.className = "day-header";
  header.innerHTML = `<h2>${day.title}${existing ? '<span class="logged-badge">Logged</span>' : ""}</h2>
    <div class="day-meta">${day.name} · Week ${state.week}</div>`;
  container.appendChild(header);

  if (day.type === "rest") {
    const box = document.createElement("div");
    box.className = "exercise-card";
    day.tasks.forEach(t => {
      const row = document.createElement("div");
      row.className = "task-row";
      row.innerHTML = `<span>${t.task}</span><span class="task-note">${t.notes}</span>`;
      box.appendChild(row);
    });
    container.appendChild(box);

    const btn = document.createElement("button");
    btn.className = "save-btn";
    btn.textContent = existing ? "Update rest day" : "Mark rest day complete";
    btn.addEventListener("click", () => {
      const s = existing || { id: Date.now().toString(), week: state.week, day: day.name };
      s.date = todayISO();
      s.phase = phase.key;
      s.dayTitle = day.title;
      s.exercises = [];
      s.rest = true;
      if (!existing) sessions.push(s);
      saveSessions(sessions);
      renderRail();
      renderDayContent();
      showToast("Rest day saved");
      syncPush(`Rest day — Week ${state.week} ${day.name}`);
    });
    container.appendChild(btn);
    return;
  }

  // training day: exercise cards
  day.exercises.forEach((ex, exIdx) => {
    const card = document.createElement("div");
    card.className = "exercise-card";

    const titleRow = document.createElement("div");
    titleRow.className = "exercise-title-row";
    titleRow.innerHTML = `<span class="exercise-name">${ex.name}</span><span class="exercise-target">${ex.target}</span>`;
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

  const saveBtn = document.createElement("button");
  saveBtn.className = "save-btn";
  saveBtn.textContent = existing ? "Update session" : "Save session";
  saveBtn.addEventListener("click", () => saveTrainingSession(phase, day, existing));
  container.appendChild(saveBtn);
}

function saveTrainingSession(phase, day, existing) {
  const exercises = day.exercises.map((ex, exIdx) => {
    const sets = [];
    for (let i = 0; i < ex.sets; i++) {
      const w = document.querySelector(`input[data-ex="${exIdx}"][data-set="${i}"][data-field="weight"]`).value;
      const r = document.querySelector(`input[data-ex="${exIdx}"][data-set="${i}"][data-field="reps"]`).value;
      if (w !== "" || r !== "") {
        sets.push({ weight: w !== "" ? parseFloat(w) : null, reps: r !== "" ? parseInt(r) : null });
      }
    }
    return { name: ex.name, target: ex.target, sets };
  }).filter(e => e.sets.length > 0);

  if (exercises.length === 0) {
    showToast("Enter at least one set before saving");
    return;
  }

  const s = existing || { id: Date.now().toString(), week: state.week, day: day.name };
  s.date = todayISO();
  s.phase = phase.key;
  s.dayTitle = day.title;
  s.exercises = exercises;
  s.rest = false;

  if (!existing) sessions.push(s);
  saveSessions(sessions);
  renderRail();
  renderDayContent();
  showToast("Session saved");
  syncPush(`${day.title} — Week ${state.week} ${day.name}`);
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
      syncPush("Delete session");
    });
  });
}

// ---------- INIT ----------
renderRail();
renderPhaseLabel();
renderDayStrip();
if (loadSyncConfig()) syncPullAndApply();
