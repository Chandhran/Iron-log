// features.js — Rest Timer, PR Tracking, 1RM Calculator,
// Drag-to-Reorder Days, enhanced Streak Calendar & Muscle Volume Tracker.

// =====================================================================
// 1. REST TIMER — countdown between sets, alarm + haptic, background
// =====================================================================
const REST_TIMER_KEY = "ironlog_rest_timer_v1";

const RestTimer = (() => {
  let timerId = null;
  let remaining = 0;
  let total = 0;
  let overlay = null;
  let exerciseName = "";
  let nextSetInfo = "";
  let alarmCtx = null;
  let alarmNodes = [];
  let alarmLoopId = null;

  function playAlarm() {
    stopAlarm();
    try {
      alarmCtx = new (window.AudioContext || window.webkitAudioContext)();
      function beepCycle() {
        if (!alarmCtx) return;
        [0, 200, 400].forEach((delay, i) => {
          const osc = alarmCtx.createOscillator();
          const gain = alarmCtx.createGain();
          osc.connect(gain); gain.connect(alarmCtx.destination);
          osc.type = "square"; osc.frequency.value = 880 + i * 220;
          gain.gain.value = 0.15;
          osc.start(alarmCtx.currentTime + delay / 1000);
          osc.stop(alarmCtx.currentTime + delay / 1000 + 0.15);
          alarmNodes.push(osc);
        });
      }
      beepCycle();
      alarmLoopId = setInterval(beepCycle, 1200);
    } catch (e) {}
  }

  function stopAlarm() {
    if (alarmLoopId) { clearInterval(alarmLoopId); alarmLoopId = null; }
    alarmNodes.forEach(n => { try { n.stop(); } catch(e) {} });
    alarmNodes = [];
    if (alarmCtx) { try { alarmCtx.close(); } catch(e) {} alarmCtx = null; }
    if (navigator.vibrate) navigator.vibrate(0);
  }

  function vibrate() {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 300]);
  }

  function vibrateLoop() {
    if (navigator.vibrate) navigator.vibrate([300, 200, 300, 200, 300, 1000]);
  }

  function notifyDone() {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("LogIt — Rest Over", {
          body: "Time to start your next set!",
          icon: "icon-192.png", tag: "rest-timer", requireInteraction: false
        });
      } catch (e) {}
    }
  }

  function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "rest-overlay";
    overlay.innerHTML = `
      <div class="rest-card">
        <div class="rest-card-highlight"></div>
        <div class="rest-header">
          <span class="rest-badge">REST</span>
          <span class="rest-ex-name"></span>
        </div>
        <div class="rest-ring-wrap">
          <div class="rest-ring-glow"></div>
          <svg class="rest-ring-svg" viewBox="0 0 220 220">
            <defs>
              <linearGradient id="restGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#D4551F"/>
                <stop offset="100%" stop-color="#e8773a"/>
              </linearGradient>
            </defs>
            <circle class="rest-ring-bg" cx="110" cy="110" r="100"/>
            <circle class="rest-ring-progress" cx="110" cy="110" r="100"/>
          </svg>
          <div class="rest-ring-time"></div>
        </div>
        <button class="rest-skip-btn">
          Skip rest
          <span class="rest-skip-arrow">→</span>
        </button>
        <button class="rest-done-btn" style="display:none;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Done — Stop Alarm
        </button>
      </div>
      <div class="rest-next-card">
        <div class="rest-next-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4551F" stroke-width="2.2">
            <path d="M4 12h2m12 0h2M6 12a2 2 0 012-2h0a2 2 0 012 2v0a2 2 0 01-2 2h0a2 2 0 01-2-2zM14 12a2 2 0 012-2h0a2 2 0 012 2v0a2 2 0 01-2 2h0a2 2 0 01-2-2zM12 10v4"/>
          </svg>
        </div>
        <div class="rest-next-info">
          <div class="rest-next-label">NEXT SET</div>
          <div class="rest-next-name"></div>
          <div class="rest-next-detail"></div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector(".rest-skip-btn").addEventListener("click", stop);
    overlay.querySelector(".rest-done-btn").addEventListener("click", dismiss);
    return overlay;
  }

  const CIRC = 2 * Math.PI * 100; // circumference r=100

  function dismiss() {
    stopAlarm();
    if (timerId) { clearInterval(timerId); timerId = null; }
    remaining = 0;
    if (overlay) {
      overlay.classList.remove("open");
      const skipBtn = overlay.querySelector(".rest-skip-btn");
      const doneBtn = overlay.querySelector(".rest-done-btn");
      if (skipBtn) skipBtn.style.display = "";
      if (doneBtn) doneBtn.style.display = "none";
      const timeEl = overlay.querySelector(".rest-ring-time");
      if (timeEl) timeEl.classList.remove("rest-done");
    }
  }

  function stop() {
    stopAlarm();
    if (timerId) { clearInterval(timerId); timerId = null; }
    remaining = 0;
    if (overlay) { overlay.classList.remove("open"); }
  }

  function start(seconds, exName, nextInfo) {
    stop();
    total = seconds;
    remaining = seconds;
    exerciseName = exName || "";
    nextSetInfo = nextInfo || "";
    requestNotificationPermission();

    const ov = ensureOverlay();
    ov.querySelector(".rest-ex-name").textContent = exerciseName;
    ov.querySelector(".rest-next-name").textContent = exerciseName;
    ov.querySelector(".rest-next-detail").textContent = nextSetInfo;
    ov.classList.add("open");

    updateDisplay();
    timerId = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(timerId); timerId = null; remaining = 0;
        playAlarm(); vibrateLoop(); notifyDone();
        // Show done state — alarm loops until Done button is pressed
        ov.querySelector(".rest-ring-time").textContent = "DONE";
        ov.querySelector(".rest-ring-time").classList.add("rest-done");
        ov.querySelector(".rest-skip-btn").style.display = "none";
        ov.querySelector(".rest-done-btn").style.display = "";
        return;
      }
      updateDisplay();
    }, 1000);
  }

  function updateDisplay() {
    if (!overlay) return;
    const pct = remaining / total;
    const offset = CIRC * pct;
    const progress = overlay.querySelector(".rest-ring-progress");
    progress.setAttribute("stroke-dasharray", CIRC);
    progress.setAttribute("stroke-dashoffset", CIRC - offset);
    overlay.querySelector(".rest-ring-time").textContent = formatTime(remaining);
  }

  function addRestButton(container, restMinutes, exIdx, setIdx) {
    const btn = document.createElement("button");
    btn.className = "rest-start-btn";
    btn.title = `Start ${restMinutes}min rest`;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const secs = Math.round(restMinutes * 60);
      // Get exercise name from card
      const card = btn.closest(".exercise-card");
      const name = card ? (card.querySelector(".exercise-name")?.textContent || "") : "";
      // Get set info
      const row = btn.closest(".set-row");
      const setNum = row ? row.querySelector(".set-num")?.textContent : "";
      const totalSets = card ? card.querySelectorAll(".set-row").length : "";
      const detail = setNum && totalSets ? `Set ${setNum} of ${totalSets}` : "";
      start(secs, name, detail);
    });
    container.appendChild(btn);
  }

  return { start, stop, addRestButton, requestNotificationPermission };
})();


// =====================================================================
// 2. PR TRACKING — auto-detect personal records, celebration
// =====================================================================
const PR_KEY = "ironlog_prs_v1";

function loadPRs() {
  try { return JSON.parse(localStorage.getItem(PR_KEY)) || {}; } catch { return {}; }
}
function savePRs(prs) {
  localStorage.setItem(PR_KEY, JSON.stringify(prs));
}

function checkForPR(exerciseName, weight, reps) {
  if (!exerciseName || !weight || weight <= 0) return null;
  const prs = loadPRs();
  const key = exerciseName.toLowerCase().trim();
  const prev = prs[key] || { maxWeight: 0, maxVolume: 0, max1RM: 0 };
  const volume = weight * (reps || 1);
  const est1RM = calc1RM(weight, reps || 1);
  const newPRs = [];

  if (weight > prev.maxWeight) {
    prev.maxWeight = weight;
    newPRs.push(`New weight PR: ${weight} kg`);
  }
  if (est1RM > prev.max1RM) {
    prev.max1RM = est1RM;
    newPRs.push(`New est. 1RM: ${est1RM.toFixed(1)} kg`);
  }

  if (newPRs.length > 0) {
    prs[key] = prev;
    savePRs(prs);
  }
  return newPRs.length > 0 ? newPRs : null;
}

function showPRCelebration(prMessages, containerEl) {
  // Create celebration overlay
  const celebration = document.createElement("div");
  celebration.className = "pr-celebration";
  celebration.innerHTML = `
    <div class="pr-celebration-content">
      <div class="pr-trophy">🏆</div>
      <div class="pr-title">PERSONAL RECORD!</div>
      ${prMessages.map(m => `<div class="pr-detail">${m}</div>`).join("")}
    </div>`;
  containerEl.style.position = "relative";
  containerEl.appendChild(celebration);

  // Confetti particles
  for (let i = 0; i < 20; i++) {
    const p = document.createElement("div");
    p.className = "pr-confetti";
    p.style.left = Math.random() * 100 + "%";
    p.style.animationDelay = Math.random() * 0.5 + "s";
    p.style.backgroundColor = ["#D4551F", "#f39c12", "#e74c3c", "#2ecc71", "#3498db"][Math.floor(Math.random() * 5)];
    celebration.appendChild(p);
  }

  if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  setTimeout(() => celebration.remove(), 3000);
}

// Hook into autosave — call after each set input
function checkSetForPR(exerciseName, weight, reps, cardEl) {
  if (!weight || !reps) return;
  const result = checkForPR(exerciseName, weight, reps);
  if (result) showPRCelebration(result, cardEl);
}


// =====================================================================
// 3. 1RM CALCULATOR — Epley formula
// =====================================================================
function calc1RM(weight, reps) {
  if (!weight || weight <= 0 || !reps || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function render1RMBadge(exerciseCard, weight, reps) {
  // Remove old badge if any
  const old = exerciseCard.querySelector(".orm-badge");
  if (old) old.remove();

  if (!weight || !reps || weight <= 0 || reps <= 0) return;
  const orm = calc1RM(weight, reps);
  const badge = document.createElement("div");
  badge.className = "orm-badge";
  badge.innerHTML = `Est. 1RM: <strong>${orm.toFixed(1)} kg</strong>`;
  badge.title = "Epley formula: weight × (1 + reps/30)";
  exerciseCard.appendChild(badge);
}

function render1RMCalculator() {
  // Standalone calculator panel in Progress tab
  const existing = document.getElementById("orm-calculator-panel");
  if (existing) return; // already rendered

  const progressView = document.getElementById("view-progress");
  if (!progressView) return;

  const panel = document.createElement("div");
  panel.className = "panel";
  panel.id = "orm-calculator-panel";
  panel.innerHTML = `
    <div class="chart-title" style="margin-bottom:10px;">1RM Calculator</div>
    <div class="orm-calc-row">
      <div class="orm-field">
        <label class="field-label">Weight (kg)</label>
        <input type="number" id="ormCalcWeight" inputmode="decimal" step="0.5" placeholder="e.g. 100">
      </div>
      <div class="orm-field">
        <label class="field-label">Reps</label>
        <input type="number" id="ormCalcReps" inputmode="numeric" placeholder="e.g. 5">
      </div>
    </div>
    <div class="orm-result" id="ormCalcResult">Enter weight and reps above</div>
    <div class="orm-table" id="ormCalcTable"></div>`;

  // Insert before the prBox panel
  const prBox = document.getElementById("prBox");
  if (prBox) progressView.insertBefore(panel, prBox);
  else progressView.appendChild(panel);

  const wInput = document.getElementById("ormCalcWeight");
  const rInput = document.getElementById("ormCalcReps");
  const update = () => {
    const w = parseFloat(wInput.value);
    const r = parseInt(rInput.value);
    const result = document.getElementById("ormCalcResult");
    const table = document.getElementById("ormCalcTable");
    if (!w || !r || w <= 0 || r <= 0) {
      result.textContent = "Enter weight and reps above";
      table.innerHTML = "";
      return;
    }
    const orm = calc1RM(w, r);
    result.innerHTML = `Estimated 1RM: <strong>${orm.toFixed(1)} kg</strong>`;
    // Show rep-max table
    const pcts = [100, 95, 90, 85, 80, 75, 70, 65, 60];
    const repRanges = [1, 2, 3, 5, 6, 8, 10, 12, 15];
    table.innerHTML = `<div class="orm-table-head"><span>%1RM</span><span>Weight</span><span>~Reps</span></div>` +
      pcts.map((p, i) => `<div class="orm-table-row"><span>${p}%</span><span>${(orm * p / 100).toFixed(1)} kg</span><span>${repRanges[i]}</span></div>`).join("");
  };
  wInput.addEventListener("input", update);
  rInput.addEventListener("input", update);
}


// =====================================================================
// 5. SWAP WORKOUTS between day slots
// =====================================================================
// ---- Day Swap: swap workout content between two day slots ----
// Keeps day names (Mon, Tue, etc.) fixed; moves workout title, type, exercises/tasks.
const DAY_SWAPS_KEY = "ironlog_day_swaps_v1";

function loadDaySwaps() {
  try { return JSON.parse(localStorage.getItem(DAY_SWAPS_KEY)) || {}; } catch (e) { return {}; }
}
function saveDaySwaps(swaps) {
  localStorage.setItem(DAY_SWAPS_KEY, JSON.stringify(swaps));
}

// Swap the workout content between two day slots in PROGRAM data.
// Keeps .name fixed (the weekday label), moves everything else.
function swapDayWorkouts(phaseKey, idxA, idxB) {
  const phase = PROGRAM[phaseKey];
  if (!phase || !phase.days) return;
  const dayA = phase.days[idxA];
  const dayB = phase.days[idxB];
  // Fields to swap (everything except the day name)
  const swapFields = ["title", "type", "exercises", "tasks", "target", "sets", "muscle", "secondary", "pattern", "compound"];
  swapFields.forEach(f => {
    const tmp = dayA[f];
    dayA[f] = dayB[f];
    dayB[f] = tmp;
  });
  // Persist modified program
  if (typeof saveActiveProgram === "function") saveActiveProgram(PROGRAM);
}

// Per-week swap: store which indices were swapped for a specific week
function applyPerWeekSwap(week, phaseKey, idxA, idxB) {
  const swaps = loadDaySwaps();
  const weekKey = week + "_" + phaseKey;
  if (!swaps[weekKey]) swaps[weekKey] = {};
  // If A was already swapped somewhere, follow the chain
  const currentA = swaps[weekKey][idxA] !== undefined ? swaps[weekKey][idxA] : idxA;
  const currentB = swaps[weekKey][idxB] !== undefined ? swaps[weekKey][idxB] : idxB;
  swaps[weekKey][idxA] = currentB;
  swaps[weekKey][idxB] = currentA;
  saveDaySwaps(swaps);
}

// Resolve the actual day object for a slot, checking per-week swaps
function resolveDay(week, phaseKey, slotIdx) {
  const phase = PROGRAM[phaseKey];
  if (!phase || !phase.days) return null;
  const swaps = loadDaySwaps();
  const weekKey = week + "_" + phaseKey;
  const map = swaps[weekKey] || {};
  const resolvedIdx = map[slotIdx] !== undefined ? map[slotIdx] : slotIdx;
  return phase.days[resolvedIdx];
}

// Get the resolved index for a slot
function resolveDayIndex(week, phaseKey, slotIdx) {
  const swaps = loadDaySwaps();
  const weekKey = week + "_" + phaseKey;
  const map = swaps[weekKey] || {};
  return map[slotIdx] !== undefined ? map[slotIdx] : slotIdx;
}

// Show swap confirmation modal
function showSwapModal(srcIdx, tgtIdx) {
  const phaseKey = getPhaseForWeek(state.week);
  const phase = PROGRAM[phaseKey];
  if (!phase || !phase.days) return;

  const srcDay = phase.days[srcIdx];
  const tgtDay = phase.days[tgtIdx];
  const phaseLabel = phaseKey === "strength" ? "Strength" : (phaseKey === "hypertrophy" ? "Hypertrophy" : "");

  // Remove existing modal if any
  const old = document.getElementById("swapModal");
  if (old) old.remove();

  const modal = document.createElement("div");
  modal.id = "swapModal";
  modal.className = "swap-modal-overlay";
  modal.innerHTML = `
    <div class="swap-modal">
      <div class="swap-modal-title">Swap Workouts</div>
      <div class="swap-modal-body">
        Move <strong>${srcDay.title || srcDay.name}</strong> to <strong>${tgtDay.name}</strong>
        and <strong>${tgtDay.title || tgtDay.name}</strong> to <strong>${srcDay.name}</strong>?
      </div>
      <div class="swap-modal-actions">
        <button class="swap-btn swap-all" id="swapAllBtn">All ${phaseLabel} weeks</button>
        <button class="swap-btn swap-once" id="swapOnceBtn">Just this week</button>
        <button class="swap-btn swap-cancel" id="swapCancelBtn">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById("swapAllBtn").addEventListener("click", () => {
    swapDayWorkouts(phaseKey, srcIdx, tgtIdx);
    modal.remove();
    renderDayStrip();
    showToast("Swapped for all " + phaseLabel + " weeks");
  });

  document.getElementById("swapOnceBtn").addEventListener("click", () => {
    applyPerWeekSwap(state.week, phaseKey, srcIdx, tgtIdx);
    modal.remove();
    renderDayStrip();
    showToast("Swapped for Week " + state.week + " only");
  });

  document.getElementById("swapCancelBtn").addEventListener("click", () => {
    modal.remove();
  });

  // Close on overlay click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.remove();
  });
}

function enableDayReorder() {
  const strip = document.getElementById("dayStrip");
  if (!strip) return;

  let dragSrc = null;
  const dayBtns = strip.querySelectorAll(".day-btn:not([data-reorder-ready])");

  dayBtns.forEach(btn => {
    btn.setAttribute("draggable", "true");
    btn.dataset.reorderReady = "1";

    btn.addEventListener("dragstart", (e) => {
      dragSrc = btn;
      btn.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", btn.dataset.dayIdx);
    });

    btn.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      btn.classList.add("drag-over");
    });

    btn.addEventListener("dragleave", () => {
      btn.classList.remove("drag-over");
    });

    btn.addEventListener("drop", (e) => {
      e.preventDefault();
      btn.classList.remove("drag-over");
      if (dragSrc && dragSrc !== btn) {
        const srcIdx = parseInt(dragSrc.dataset.dayIdx);
        const tgtIdx = parseInt(btn.dataset.dayIdx);
        // Reset drag visual
        dragSrc.classList.remove("dragging");
        strip.querySelectorAll(".day-btn").forEach(b => b.classList.remove("drag-over"));
        dragSrc = null;
        // Show swap confirmation
        showSwapModal(srcIdx, tgtIdx);
      }
    });

    btn.addEventListener("dragend", () => {
      if (dragSrc) dragSrc.classList.remove("dragging");
      strip.querySelectorAll(".day-btn").forEach(b => b.classList.remove("drag-over"));
      dragSrc = null;
    });

    // Touch support for mobile
    btn.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      btn._touchStartX = touch.clientX;
      btn._touchStartY = touch.clientY;
      btn._longPress = setTimeout(() => {
        dragSrc = btn;
        btn.classList.add("dragging");
        if (navigator.vibrate) navigator.vibrate(30);
      }, 400);
    }, { passive: true });

    btn.addEventListener("touchmove", (e) => {
      clearTimeout(btn._longPress);
      if (!dragSrc) return;
      e.preventDefault();
      const touch = e.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      strip.querySelectorAll(".day-btn").forEach(b => b.classList.remove("drag-over"));
      if (target && target.classList.contains("day-btn") && target !== dragSrc) {
        target.classList.add("drag-over");
      }
    }, { passive: false });

    btn.addEventListener("touchend", (e) => {
      clearTimeout(btn._longPress);
      if (!dragSrc) return;
      const touch = e.changedTouches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      dragSrc.classList.remove("dragging");
      strip.querySelectorAll(".day-btn").forEach(b => b.classList.remove("drag-over"));
      if (target && target.classList.contains("day-btn") && target !== dragSrc) {
        const srcIdx = parseInt(dragSrc.dataset.dayIdx);
        const tgtIdx = parseInt(target.dataset.dayIdx);
        dragSrc = null;
        showSwapModal(srcIdx, tgtIdx);
      } else {
        dragSrc = null;
      }
    });
  });
}


// =====================================================================
// 6. ENHANCED MUSCLE VOLUME TRACKER — target zone bands
// =====================================================================
function enhanceMuscleBarChart() {
  // After Chart.js renders the muscle bar chart, add target zone annotation
  const canvas = document.getElementById("muscleBarChart");
  if (!canvas || typeof Chart === "undefined") return;

  // Use Chart.js annotation plugin concept via custom drawing
  const chart = muscleBarChart; // global from app.js
  if (!chart) return;

  // Add min/max target bands via a plugin
  const targetPlugin = {
    id: "targetZone",
    afterDraw(chart) {
      const { ctx, chartArea: { left, right, top, bottom }, scales: { y } } = chart;
      const yMin = y.getPixelForValue(10);
      const yMax = y.getPixelForValue(20);
      ctx.save();
      ctx.fillStyle = "rgba(46, 204, 113, 0.08)";
      ctx.fillRect(left, yMax, right - left, yMin - yMax);
      // Dashed lines at 10 and 20
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "rgba(46, 204, 113, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, yMin);
      ctx.lineTo(right, yMin);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(left, yMax);
      ctx.lineTo(right, yMax);
      ctx.stroke();
      // Labels
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(46, 204, 113, 0.6)";
      ctx.font = "10px Manrope, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("10 sets (min)", left + 4, yMin - 3);
      ctx.fillText("20 sets (max)", left + 4, yMax - 3);
      ctx.restore();
    }
  };

  // Register if not already
  if (!Chart.registry.plugins.get("targetZone")) {
    Chart.register(targetPlugin);
    // Redraw to apply
    chart.update();
  }
}


// =====================================================================
// 7. WIRE FEATURES INTO APP
// =====================================================================

// --- Patch renderExerciseCard to add rest timer & 1RM & PR detection ---
function patchExerciseCards() {
  // After renderDayContent runs, inject rest timer buttons and 1RM badges
  const container = document.getElementById("dayContent");
  if (!container) return;

  container.querySelectorAll(".exercise-card").forEach(card => {
    const exIdx = card.dataset.exIdx;
    const rows = card.querySelectorAll(".set-row");

    rows.forEach((row, setIdx) => {
      // Add rest timer button to each set row
      const weightInput = row.querySelector('input[data-field="weight"]');
      const repsInput = row.querySelector('input[data-field="reps"]');

      // Find rest time from exercise data
      let restMin = 2; // default
      try {
        if (typeof PROGRAM !== "undefined" && PROGRAM) {
          const phase = PROGRAM[Object.keys(PROGRAM).find(k => !k.startsWith("_") && PROGRAM[k]?.days)];
          if (phase?.days) {
            for (const day of phase.days) {
              if (day.exercises?.[exIdx]) {
                restMin = day.exercises[exIdx].rest || 2;
                break;
              }
            }
          }
        }
      } catch (e) {}

      RestTimer.addRestButton(row, restMin, exIdx, setIdx);

      // 1RM badge + PR check on input
      const updateBadges = () => {
        const w = parseFloat(weightInput?.value);
        const r = parseInt(repsInput?.value);
        // Find best set in this exercise for 1RM
        const allWeightInputs = card.querySelectorAll('input[data-field="weight"]');
        const allRepsInputs = card.querySelectorAll('input[data-field="reps"]');
        let bestW = 0, bestR = 0, best1RM = 0;
        allWeightInputs.forEach((wi, i) => {
          const wv = parseFloat(wi.value);
          const rv = parseInt(allRepsInputs[i]?.value);
          if (wv > 0 && rv > 0) {
            const orm = calc1RM(wv, rv);
            if (orm > best1RM) { best1RM = orm; bestW = wv; bestR = rv; }
          }
        });
        render1RMBadge(card, bestW, bestR);
      };
      if (weightInput) weightInput.addEventListener("input", updateBadges);
      if (repsInput) repsInput.addEventListener("input", updateBadges);
    });

    // Check for PR on input (debounced)
    let prTimeout;
    card.querySelectorAll(".set-row input").forEach(inp => {
      inp.addEventListener("change", () => {
        clearTimeout(prTimeout);
        prTimeout = setTimeout(() => {
          const exNameEl = card.querySelector(".exercise-name");
          if (!exNameEl) return;
          const name = exNameEl.textContent.replace("Swapped", "").trim();
          card.querySelectorAll(".set-row").forEach(row => {
            const w = parseFloat(row.querySelector('input[data-field="weight"]')?.value);
            const r = parseInt(row.querySelector('input[data-field="reps"]')?.value);
            if (w > 0 && r > 0) checkSetForPR(name, w, r, card);
          });
        }, 800);
      });
    });

    // Initial 1RM badge render if values exist
    const firstW = card.querySelector('input[data-field="weight"]');
    if (firstW && firstW.value) {
      const allWeightInputs = card.querySelectorAll('input[data-field="weight"]');
      const allRepsInputs = card.querySelectorAll('input[data-field="reps"]');
      let bestW = 0, bestR = 0, best1RM = 0;
      allWeightInputs.forEach((wi, i) => {
        const wv = parseFloat(wi.value);
        const rv = parseInt(allRepsInputs[i]?.value);
        if (wv > 0 && rv > 0) {
          const orm = calc1RM(wv, rv);
          if (orm > best1RM) { best1RM = orm; bestW = wv; bestR = rv; }
        }
      });
      render1RMBadge(card, bestW, bestR);
    }
  });
}

// --- Initialize all features after DOM ready ---
function initFeatures() {
  // Observe day content changes to inject rest timer / PR / 1RM
  const dayContent = document.getElementById("dayContent");
  if (dayContent) {
    const observer = new MutationObserver(() => {
      patchExerciseCards();
    });
    observer.observe(dayContent, { childList: true, subtree: false });
    // Initial patch
    setTimeout(() => { patchExerciseCards(); }, 100);
  }

  // Day strip reorder
  const dayStrip = document.getElementById("dayStrip");
  if (dayStrip) {
    const observer3 = new MutationObserver(enableDayReorder);
    observer3.observe(dayStrip, { childList: true });
  }

  // 1RM calculator in Progress tab
  // Render when progress tab is shown
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (btn.dataset.view === "progress") {
        setTimeout(() => {
          render1RMCalculator();
          enhanceMuscleBarChart();
        }, 200);
      }
    });
  });

  // Request notification permission early
  RestTimer.requestNotificationPermission();
}

// Auto-init
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initFeatures);
} else {
  setTimeout(initFeatures, 200);
}
