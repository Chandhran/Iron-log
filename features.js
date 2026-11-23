// features.js — Rest Timer, PR Tracking, 1RM Calculator, Share Card,
// Drag-to-Reorder Days, enhanced Streak Calendar & Muscle Volume Tracker.

// =====================================================================
// 1. REST TIMER — countdown between sets, alarm + haptic, background
// =====================================================================
const REST_TIMER_KEY = "ironlog_rest_timer_v1";

const RestTimer = (() => {
  let timerId = null;
  let remaining = 0;      // seconds left
  let total = 0;           // total seconds for this rest
  let onTick = null;
  let activeEl = null;     // DOM element currently showing the timer

  // --- Alarm sound via Web Audio API ---
  function playAlarm() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Three ascending beeps
      [0, 200, 400].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "square";
        osc.frequency.value = 880 + i * 220;
        gain.gain.value = 0.15;
        osc.start(ctx.currentTime + delay / 1000);
        osc.stop(ctx.currentTime + delay / 1000 + 0.15);
      });
    } catch (e) {}
  }

  // --- Vibration ---
  function vibrate() {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 300]);
  }

  // --- Background notification ---
  function notifyDone() {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("LogIt — Rest Over", {
          body: "Time to start your next set!",
          icon: "icon-192.png",
          tag: "rest-timer",
          requireInteraction: false
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

  function stop() {
    if (timerId) { clearInterval(timerId); timerId = null; }
    remaining = 0;
    if (activeEl) {
      activeEl.classList.remove("rest-timer-active", "rest-timer-done");
      activeEl.innerHTML = activeEl._originalHtml || "";
      activeEl = null;
    }
  }

  function start(seconds, el) {
    stop(); // kill any running timer
    total = seconds;
    remaining = seconds;
    activeEl = el;
    activeEl._originalHtml = el.innerHTML;
    activeEl.classList.add("rest-timer-active");
    requestNotificationPermission();

    updateDisplay();
    timerId = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(timerId);
        timerId = null;
        remaining = 0;
        playAlarm();
        vibrate();
        notifyDone();
        activeEl.classList.remove("rest-timer-active");
        activeEl.classList.add("rest-timer-done");
        activeEl.innerHTML = `<span class="rest-done-text">REST DONE — GO!</span>`;
        setTimeout(() => {
          if (activeEl && activeEl.classList.contains("rest-timer-done")) {
            activeEl.classList.remove("rest-timer-done");
            activeEl.innerHTML = activeEl._originalHtml || "";
            activeEl = null;
          }
        }, 5000);
        return;
      }
      updateDisplay();
    }, 1000);
  }

  function updateDisplay() {
    if (!activeEl) return;
    const pct = ((total - remaining) / total) * 100;
    activeEl.innerHTML = `
      <div class="rest-timer-display">
        <div class="rest-timer-ring">
          <svg viewBox="0 0 44 44" class="rest-ring-svg">
            <circle cx="22" cy="22" r="18" fill="none" stroke="var(--surface-2)" stroke-width="3"/>
            <circle cx="22" cy="22" r="18" fill="none" stroke="var(--accent-orange)" stroke-width="3"
              stroke-dasharray="${2 * Math.PI * 18}" stroke-dashoffset="${2 * Math.PI * 18 * (1 - pct / 100)}"
              stroke-linecap="round" transform="rotate(-90 22 22)"/>
          </svg>
          <span class="rest-timer-time">${formatTime(remaining)}</span>
        </div>
        <button class="rest-timer-skip" title="Skip rest">✕</button>
      </div>`;
    const skipBtn = activeEl.querySelector(".rest-timer-skip");
    if (skipBtn) skipBtn.addEventListener("click", (e) => { e.stopPropagation(); stop(); });
  }

  function addRestButton(container, restMinutes, exIdx, setIdx) {
    const btn = document.createElement("button");
    btn.className = "rest-start-btn";
    btn.title = `Start ${restMinutes}min rest`;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const secs = Math.round(restMinutes * 60);
      // Use the set row itself as the timer container
      const row = btn.closest(".set-row");
      if (row) start(secs, row);
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
// 4. SHAREABLE WORKOUT SUMMARY CARD — Strava-style PNG
// =====================================================================
function generateShareCard(session) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const W = 1080, H = 1920;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0f0f0f");
    bg.addColorStop(0.5, "#1a1208");
    bg.addColorStop(1, "#0f0f0f");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Accent stripe at top
    const stripe = ctx.createLinearGradient(0, 0, W, 0);
    stripe.addColorStop(0, "#D4551F");
    stripe.addColorStop(1, "#f39c12");
    ctx.fillStyle = stripe;
    ctx.fillRect(0, 0, W, 8);

    // "LogIt" branding top-left
    ctx.fillStyle = "#D4551F";
    ctx.font = "bold 52px Manrope, sans-serif";
    ctx.fillText("LogIt", 60, 90);

    // Date top-right
    ctx.fillStyle = "#9b9890";
    ctx.font = "400 36px Manrope, sans-serif";
    const dateStr = session.date ? new Date(session.date + "T00:00:00").toLocaleDateString(undefined, {
      weekday: "short", month: "short", day: "numeric", year: "numeric"
    }) : "";
    ctx.textAlign = "right";
    ctx.fillText(dateStr, W - 60, 90);
    ctx.textAlign = "left";

    // Session title
    ctx.fillStyle = "#f5f0e8";
    ctx.font = "bold 64px Manrope, sans-serif";
    const title = session.dayTitle || session.day || "Workout";
    ctx.fillText(title, 60, 200);

    // Phase tag
    const phaseLabel = session.phase === "strength" ? "STRENGTH" : "HYPERTROPHY";
    ctx.fillStyle = "#D4551F";
    ctx.font = "600 32px Manrope, sans-serif";
    ctx.fillText(`Week ${session.week} · ${phaseLabel}`, 60, 260);

    // Stats row
    let duration = "";
    if (session.startTime && session.endTime) {
      const ms = new Date(session.endTime) - new Date(session.startTime);
      const mins = Math.round(ms / 60000);
      duration = mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
    }
    let totalVolume = 0, totalSets = 0;
    if (session.exercises) {
      session.exercises.forEach(ex => {
        ex.sets.forEach(s => {
          totalSets++;
          totalVolume += (s.weight || 0) * (s.reps || 0);
        });
      });
    }

    const stats = [
      { label: "DURATION", value: duration || "—" },
      { label: "SETS", value: String(totalSets) },
      { label: "VOLUME", value: totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}t` : "—" },
      { label: "EXERCISES", value: String(session.exercises?.length || 0) },
    ];

    let sx = 60;
    const statW = (W - 120) / stats.length;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    roundRect(ctx, 40, 300, W - 80, 140, 16);
    ctx.fill();

    stats.forEach((stat, i) => {
      const cx = 60 + statW * i + statW / 2;
      ctx.fillStyle = "#9b9890";
      ctx.font = "500 26px Manrope, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(stat.label, cx, 350);
      ctx.fillStyle = "#f5f0e8";
      ctx.font = "bold 48px Manrope, sans-serif";
      ctx.fillText(stat.value, cx, 410);
    });
    ctx.textAlign = "left";

    // Exercise list
    let y = 500;
    if (session.exercises) {
      session.exercises.forEach(ex => {
        if (y > H - 200) return;
        // Exercise name
        ctx.fillStyle = "#f5f0e8";
        ctx.font = "600 38px Manrope, sans-serif";
        ctx.fillText(ex.name, 60, y);
        y += 10;

        // Sets
        ctx.font = "400 30px Manrope, sans-serif";
        ctx.fillStyle = "#9b9890";
        ex.sets.forEach((s, i) => {
          y += 42;
          if (y > H - 200) return;
          const setStr = `Set ${i + 1}:  ${s.weight ?? "–"} kg × ${s.reps ?? "–"} reps`;
          ctx.fillText(setStr, 100, y);
        });
        y += 50;
      });
    }

    // Bottom branding bar
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(0, H - 120, W, 120);
    ctx.fillStyle = "#D4551F";
    ctx.font = "bold 36px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("LogIt — Track. Lift. Grow.", W / 2, H - 55);
    ctx.textAlign = "left";

    canvas.toBlob(blob => resolve(blob), "image/png");
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function addShareButton(container, session) {
  const btn = document.createElement("button");
  btn.className = "share-workout-btn";
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> Share workout`;
  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Generating…";
    try {
      const blob = await generateShareCard(session);
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], "logit-workout.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "LogIt Workout" });
          btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> Share workout`;
          btn.disabled = false;
          return;
        }
      }
      // Fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logit-${session.date || "workout"}.png`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Card saved to downloads");
    } catch (e) {
      showToast("Could not generate share card");
    }
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg> Share workout`;
    btn.disabled = false;
  });
  container.appendChild(btn);
}


// =====================================================================
// 5. DRAG-TO-REORDER DAYS within a week
// =====================================================================
const DAY_ORDER_KEY = "ironlog_day_order_v1";

function loadDayOrder() {
  try { return JSON.parse(localStorage.getItem(DAY_ORDER_KEY)) || null; } catch { return null; }
}
function saveDayOrder(order) {
  localStorage.setItem(DAY_ORDER_KEY, JSON.stringify(order));
}

function enableDayReorder() {
  const strip = document.getElementById("dayStrip");
  if (!strip) return;

  let dragSrc = null;
  const dayBtns = strip.querySelectorAll(".day-btn");

  dayBtns.forEach(btn => {
    btn.setAttribute("draggable", "true");

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
        // Swap in DOM
        const parent = btn.parentNode;
        const srcIdx = [...parent.children].indexOf(dragSrc);
        const tgtIdx = [...parent.children].indexOf(btn);
        if (srcIdx < tgtIdx) parent.insertBefore(dragSrc, btn.nextSibling);
        else parent.insertBefore(dragSrc, btn);
        // Save order
        const newOrder = [...parent.querySelectorAll(".day-btn")].map(b => parseInt(b.dataset.dayIdx));
        saveDayOrder(newOrder);
        showToast("Day order saved");
      }
    });

    btn.addEventListener("dragend", () => {
      btn.classList.remove("dragging");
      dayBtns.forEach(b => b.classList.remove("drag-over"));
    });

    // Touch support for mobile
    let touchStartY = 0, touchStartX = 0, touchClone = null;
    btn.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
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
      if (target && target.classList.contains("day-btn") && target !== dragSrc) {
        const parent = strip;
        const srcIdx = [...parent.querySelectorAll(".day-btn")].indexOf(dragSrc);
        const tgtIdx = [...parent.querySelectorAll(".day-btn")].indexOf(target);
        if (srcIdx < tgtIdx) parent.insertBefore(dragSrc, target.nextSibling);
        else parent.insertBefore(dragSrc, target);
        const newOrder = [...parent.querySelectorAll(".day-btn")].map(b => parseInt(b.dataset.dayIdx));
        saveDayOrder(newOrder);
        showToast("Day order saved");
      }
      dragSrc.classList.remove("dragging");
      strip.querySelectorAll(".day-btn").forEach(b => b.classList.remove("drag-over"));
      dragSrc = null;
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

// --- Add share button to history cards ---
function patchHistoryCards() {
  const list = document.getElementById("historyList");
  if (!list) return;
  list.querySelectorAll(".history-card").forEach(card => {
    if (card.querySelector(".share-workout-btn")) return; // already added
    const delBtn = card.querySelector(".history-del");
    if (!delBtn) return;
    const sessionId = delBtn.dataset.id;
    const session = sessions.find(s => s.id === sessionId);
    if (session && !session.rest && session.exercises?.length) {
      addShareButton(card, session);
    }
  });
}

// --- Add share button to active session in Train tab ---
function patchTrainShareButton() {
  const timingLine = document.getElementById("dayTimingLine");
  if (!timingLine) return;
  const parent = timingLine.parentElement;
  if (!parent || parent.querySelector(".share-workout-btn")) return;
  // Find current session
  if (typeof sessions === "undefined" || typeof state === "undefined") return;
  if (typeof PROGRAM === "undefined" || !PROGRAM) return;
  const phaseKeys = Object.keys(PROGRAM).filter(k => !k.startsWith("_"));
  if (!phaseKeys.length) return;
  const phase = PROGRAM[phaseKeys[Math.min(Math.floor((state.week - 1) / (PROGRAM._duration_weeks ? Math.ceil(PROGRAM._duration_weeks / phaseKeys.length) : 4)), phaseKeys.length - 1)]];
  if (!phase?.days) return;
  const day = phase.days[state.dayIndex];
  if (!day || day.type !== "training") return;
  const existing = sessions.find(s => s.week === state.week && s.day === day.name);
  if (existing && !existing.rest && existing.exercises?.length) {
    addShareButton(parent, existing);
  }
}

// --- Initialize all features after DOM ready ---
function initFeatures() {
  // Observe day content changes to inject rest timer / PR / 1RM
  const dayContent = document.getElementById("dayContent");
  if (dayContent) {
    const observer = new MutationObserver(() => {
      patchExerciseCards();
      enableDayReorder();
    });
    observer.observe(dayContent, { childList: true, subtree: false });
    // Initial patch
    setTimeout(() => { patchExerciseCards(); patchTrainShareButton(); }, 100);
  }

  // Observe history changes
  const historyList = document.getElementById("historyList");
  if (historyList) {
    const observer2 = new MutationObserver(patchHistoryCards);
    observer2.observe(historyList, { childList: true });
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
