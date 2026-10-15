// diet-adjuster.js — silent, automatic diet regimen adjustments driven by
// body-composition trend + food-log protein compliance. On every new body-comp
// import (and daily weight log where a weekly rate can be inferred) this
// module decides whether the user is on track for their stated goal, and if
// not, bumps calorie or protein targets. All changes are stored as a
// cumulative delta that todaysGoals() adds on top of the food profile's
// baseline values. No paragraphs shown to the user — the only surfaced
// signal is a small delta chip next to the calorie ring on the Food tab.

const DIET_ADJUSTMENTS_KEY = "ironlog_diet_adjustments_v1";
const DIET_ADJUSTMENTS_DATA_PATH = "data/diet-adjustments.json";
const MIN_DAYS_BETWEEN_ADJUSTMENTS = 7;
const CALORIE_STEP = 200;      // kcal per adjustment
const PROTEIN_STEP = 15;       // g per adjustment
const COMPLIANCE_THRESHOLD = 0.80; // 80%

// --- Storage ---
function loadDietAdjustments() {
  try { return JSON.parse(localStorage.getItem(DIET_ADJUSTMENTS_KEY)) || []; }
  catch { return []; }
}
function saveDietAdjustments(list) {
  localStorage.setItem(DIET_ADJUSTMENTS_KEY, JSON.stringify(list));
}
function addDietAdjustment(entry) {
  const list = loadDietAdjustments();
  list.push(entry);
  saveDietAdjustments(list);
  return list;
}

// Cumulative deltas as of today.
function cumulativeDietDeltas() {
  const list = loadDietAdjustments();
  let calorieDelta = 0, proteinDelta = 0;
  list.forEach(a => {
    calorieDelta += a.calorieDelta || 0;
    proteinDelta += a.proteinDelta || 0;
  });
  return { calorieDelta, proteinDelta, count: list.length };
}

// Days since the most recent recorded adjustment. Infinity if none yet.
function daysSinceLastAdjustment() {
  const list = loadDietAdjustments();
  if (list.length === 0) return Infinity;
  const last = list[list.length - 1];
  const lastDate = new Date(last.date + "T00:00:00");
  const now = new Date();
  return Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
}

// --- Weekly rate computation ---
// Returns { weightRatePctPerWeek, muscleMassKgPerWeek, dataPoints, spanDays }
// from either body-comp entries (preferred) or weight-logs (fallback).
function weeklyRateFromBodyComp() {
  const entries = (typeof loadBodyComp === "function") ? loadBodyComp() : [];
  const withWeight = entries.filter(e => typeof e.weightKg === "number");
  if (withWeight.length < 2) return null;

  const sorted = withWeight.sort((a, b) => a.date < b.date ? -1 : 1);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const spanDays = daysBetween(first.date, last.date);
  if (spanDays < 7) return null;

  const weightRatePctPerWeek = ((last.weightKg - first.weightKg) / first.weightKg) * 100 * (7 / spanDays);
  let muscleMassKgPerWeek = null;
  if (typeof first.muscleMassKg === "number" && typeof last.muscleMassKg === "number") {
    muscleMassKgPerWeek = (last.muscleMassKg - first.muscleMassKg) * (7 / spanDays);
  }
  return {
    weightRatePctPerWeek,
    muscleMassKgPerWeek,
    dataPoints: sorted.length,
    spanDays,
    firstDate: first.date,
    lastDate: last.date,
    firstWeightKg: first.weightKg,
    lastWeightKg: last.weightKg,
  };
}

function weeklyRateFromWeightLogs() {
  if (typeof weightLogs === "undefined" || !Array.isArray(weightLogs)) return null;
  const sorted = weightLogs.slice().sort((a, b) => a.date < b.date ? -1 : 1);
  if (sorted.length < 2) return null;
  const first = sorted[0], last = sorted[sorted.length - 1];
  const spanDays = daysBetween(first.date, last.date);
  if (spanDays < 7) return null;
  const weightRatePctPerWeek = ((last.weightKg - first.weightKg) / first.weightKg) * 100 * (7 / spanDays);
  return {
    weightRatePctPerWeek,
    muscleMassKgPerWeek: null,
    dataPoints: sorted.length,
    spanDays,
    firstDate: first.date,
    lastDate: last.date,
    firstWeightKg: first.weightKg,
    lastWeightKg: last.weightKg,
  };
}

function daysBetween(dateA, dateB) {
  const a = new Date(dateA + "T00:00:00");
  const b = new Date(dateB + "T00:00:00");
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

// --- Compliance from food logs ---
// Returns fraction of last N days where protein intake hit >=proteinTarget.
function proteinComplianceLastDays(proteinTarget, days) {
  if (typeof foodLogs === "undefined" || !Array.isArray(foodLogs) || !proteinTarget) return null;
  const today = new Date();
  let hit = 0, total = 0;
  for (let i = 0; i < days; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const day = foodLogs.filter(l => l.date === iso);
    if (day.length === 0) continue;
    total += 1;
    const p = day.reduce((s, l) => s + (l.protein || 0), 0);
    if (p >= proteinTarget * 0.95) hit += 1;
  }
  return total === 0 ? null : { fraction: hit / total, days: total };
}

// --- Target rates by goal ---
function targetRateForGoal(goal) {
  // Range in %/week of body weight
  switch ((goal || "").toLowerCase()) {
    case "cut":
    case "lose":
    case "fat_loss":
      return { min: -1.0, max: -0.5, label: "cut" };
    case "bulk":
    case "gain":
    case "muscle_gain":
      return { min: 0.25, max: 0.5, label: "bulk" };
    case "recomp":
      return { min: -0.15, max: 0.15, label: "recomp" };
    case "maintain":
    default:
      return { min: -0.25, max: 0.25, label: "maintain" };
  }
}

// --- Deadline-aware projection ---
// When profile has targetWeightKg + targetDate, compute required weekly rate
// to reach the target on time, given the current weight trend.
function deadlineTargetRate(profile, rate) {
  if (!profile.targetWeightKg || !profile.targetDate) return null;
  const today = new Date().toISOString().slice(0, 10);
  const daysLeft = daysBetween(today, profile.targetDate);
  if (daysLeft <= 0) return null;

  const currentKg = rate.lastWeightKg;
  if (!currentKg) return null;
  const diffKg = currentKg - profile.targetWeightKg; // + = need to lose, − = need to gain
  const requiredRateKgPerWeek = (diffKg / daysLeft) * 7;
  const requiredRatePctPerWeek = (requiredRateKgPerWeek / currentKg) * 100;

  // Determine safe bounds
  const losing = diffKg > 0;
  const safeMaxKgPerWeek = losing ? 1.0 : 0.5;

  // Ideal rate as %/week: negative for loss, positive for gain
  const idealPct = losing ? -Math.abs(requiredRatePctPerWeek) : Math.abs(requiredRatePctPerWeek);
  // Add a small tolerance band (±0.1%/wk)
  return {
    min: idealPct - 0.1,
    max: idealPct + 0.1,
    label: losing ? "cut" : "bulk",
    deadline: true,
    daysLeft,
    requiredRateKgPerWeek,
  };
}

// --- Main decision engine ---
// Returns { adjustment, reason } or null if no adjustment needed / possible.
function decideAdjustment(opts) {
  opts = opts || {};
  const profile = (typeof loadFoodProfile === "function") ? loadFoodProfile() : null;
  if (!profile) return null;
  // Prefer body-comp trend; fall back to weight logs for a simpler weight-only check
  const rate = weeklyRateFromBodyComp() || weeklyRateFromWeightLogs();
  if (!rate) return null;

  if (daysSinceLastAdjustment() < MIN_DAYS_BETWEEN_ADJUSTMENTS) return null;

  const goal = profile.primary_goal || profile.goal || "maintain";
  // Use deadline-based target if set, otherwise generic goal range
  const target = deadlineTargetRate(profile, rate) || targetRateForGoal(goal);
  const actual = rate.weightRatePctPerWeek;

  // Protein-first rule: if cutting AND muscle mass is dropping >0.25 kg/week,
  // bump protein before touching calories.
  if (target.label === "cut" && typeof rate.muscleMassKgPerWeek === "number" && rate.muscleMassKgPerWeek < -0.25) {
    return {
      calorieDelta: 0,
      proteinDelta: PROTEIN_STEP,
      reason: `Muscle mass dropping ${rate.muscleMassKgPerWeek.toFixed(2)} kg/wk — protein +${PROTEIN_STEP}g to protect lean tissue.`,
      trigger: opts.trigger,
      rate,
    };
  }

  // Compliance check: if protein target is being missed, bump it first before
  // moving calories in either direction.
  const baseProtein = (profile.goalProtein || 0) + cumulativeDietDeltas().proteinDelta;
  const compliance = proteinComplianceLastDays(baseProtein, 7);
  const complianceLow = compliance && compliance.fraction < COMPLIANCE_THRESHOLD && compliance.days >= 4;

  if (target.label === "cut" && actual > target.max) {
    // Weight not dropping fast enough
    return {
      calorieDelta: -CALORIE_STEP,
      proteinDelta: 0,
      reason: `Weight change ${actual.toFixed(2)}%/wk vs cut target ${target.min} to ${target.max}%/wk — calories −${CALORIE_STEP}.`,
      trigger: opts.trigger, rate,
    };
  }
  if (target.label === "cut" && actual < target.min) {
    // Losing too fast
    return {
      calorieDelta: CALORIE_STEP,
      proteinDelta: 0,
      reason: `Weight dropping ${actual.toFixed(2)}%/wk — too fast for a cut. Calories +${CALORIE_STEP}.`,
      trigger: opts.trigger, rate,
    };
  }
  if (target.label === "bulk" && actual < target.min) {
    return {
      calorieDelta: CALORIE_STEP,
      proteinDelta: 0,
      reason: `Weight change ${actual.toFixed(2)}%/wk vs bulk target ${target.min} to ${target.max}%/wk — calories +${CALORIE_STEP}.`,
      trigger: opts.trigger, rate,
    };
  }
  if (target.label === "bulk" && actual > target.max) {
    return {
      calorieDelta: -CALORIE_STEP,
      proteinDelta: 0,
      reason: `Weight rising ${actual.toFixed(2)}%/wk — too fast for a lean bulk. Calories −${CALORIE_STEP}.`,
      trigger: opts.trigger, rate,
    };
  }
  if ((target.label === "recomp" || target.label === "maintain") && (actual > target.max || actual < target.min)) {
    const delta = actual > 0 ? -CALORIE_STEP : CALORIE_STEP;
    return {
      calorieDelta: delta,
      proteinDelta: 0,
      reason: `Weight drifting ${actual.toFixed(2)}%/wk — pulling back toward ${target.label}. Calories ${delta > 0 ? "+" : ""}${delta}.`,
      trigger: opts.trigger, rate,
    };
  }
  // On track — but if compliance is low, nudge protein up
  if (complianceLow) {
    return {
      calorieDelta: 0,
      proteinDelta: PROTEIN_STEP,
      reason: `Protein hit on ${Math.round(compliance.fraction * 100)}% of last ${compliance.days} logged days. Target +${PROTEIN_STEP}g for a more achievable floor.`,
      trigger: opts.trigger, rate,
    };
  }
  return null;
}

// --- Sync to GitHub ---
async function dietAdjustmentsSyncPush(message) {
  if (typeof githubWriteDataFile !== "function") return;
  try {
    await githubWriteDataFile(DIET_ADJUSTMENTS_DATA_PATH, { adjustments: loadDietAdjustments() }, message || "Update diet adjustments");
  } catch (e) { /* silent */ }
}

// --- Public trigger ---
// Called from body-comp import & weight log. Applies at most one adjustment
// per call, respects the 7-day rate limit, and writes the record + syncs.
function runDietAdjustmentCheck(opts) {
  try {
    const decision = decideAdjustment(opts || {});
    if (!decision) return null;
    const record = {
      id: "adj-" + Date.now().toString(36),
      date: new Date().toISOString().slice(0, 10),
      calorieDelta: decision.calorieDelta,
      proteinDelta: decision.proteinDelta,
      reason: decision.reason,
      trigger: decision.trigger || "unknown",
      rate: decision.rate,
    };
    addDietAdjustment(record);
    dietAdjustmentsSyncPush("Auto diet adjustment (" + record.trigger + ")");
    // Refresh Food tab so the chip and target update instantly
    if (typeof renderFoodTab === "function" &&
        document.getElementById("view-food") &&
        document.getElementById("view-food").classList.contains("active")) {
      renderFoodTab();
    }
    return record;
  } catch (e) {
    if (typeof console !== "undefined") console.warn("diet-adjuster error:", e);
    return null;
  }
}
