// body-comp.js — body composition tracking. Ingests screenshots of the
// Fitdays "Body Data Report" screen via Tesseract OCR, extracts every
// labeled field, and stores entries in localStorage + syncs to GitHub as
// data/body-comp.json (year-sharded like sessions.json).

const BODY_COMP_KEY = "ironlog_body_comp_v1";
const BODY_COMP_DATA_PATH = "data/body-comp.json";

function loadBodyComp() {
  try { return JSON.parse(localStorage.getItem(BODY_COMP_KEY)) || []; }
  catch { return []; }
}
function saveBodyComp(entries) {
  localStorage.setItem(BODY_COMP_KEY, JSON.stringify(entries));
}
function addBodyCompEntry(entry) {
  const entries = loadBodyComp();
  entries.push(entry);
  entries.sort((a, b) =>
    (a.date + "T" + (a.time || "00:00")) < (b.date + "T" + (b.time || "00:00")) ? -1 : 1
  );
  saveBodyComp(entries);
  return entries;
}
function latestBodyComp() {
  const entries = loadBodyComp();
  if (entries.length === 0) return null;
  return entries[entries.length - 1];
}

// ---------- FIELD DEFINITIONS ----------
// Order matters for parsing: longer/more-specific labels first so
// "Fat-free Body Weight" doesn't get matched by "Weight" first.
const BODY_COMP_FIELDS = [
  { key: "fatFreeBodyWeightKg", label: "Fat-free Body Weight", unit: "kg", parseRegex: /fat[\s\-]*free[\s\-]*body[\s\-]*weight[^\d\n]*([\d]+(?:\.[\d]+)?)/i },
  { key: "idealBodyWeightKg",   label: "Ideal body weight",    unit: "kg", parseRegex: /ideal[\s\-]*body[\s\-]*weight[^\d\n]*([\d]+(?:\.[\d]+)?)/i },
  { key: "skeletalMusclePct",   label: "Skeletal Muscle",      unit: "%",  parseRegex: /skeletal[\s\-]*muscle[^\d\n]*([\d]+(?:\.[\d]+)?)/i },
  { key: "subcutaneousFatPct",  label: "Subcutaneous fat",     unit: "%",  parseRegex: /subcutaneous[\s\-]*fat[^\d\n]*([\d]+(?:\.[\d]+)?)/i },
  { key: "waterWeightKg",       label: "Water Weight",         unit: "kg", parseRegex: /water[\s\-]*weight[^\d\n]*([\d]+(?:\.[\d]+)?)/i },
  { key: "muscleRatePct",       label: "Muscle Rate",          unit: "%",  parseRegex: /muscle[\s\-]*rate[^\d\n]*([\d]+(?:\.[\d]+)?)/i },
  { key: "muscleMassKg",        label: "Muscle Mass",          unit: "kg", parseRegex: /muscle[\s\-]*mass[^\d\n]*([\d]+(?:\.[\d]+)?)/i },
  { key: "bodyWaterPct",        label: "Body Water",           unit: "%",  parseRegex: /body[\s\-]*water[^\d\n]*([\d]+(?:\.[\d]+)?)/i },
  { key: "bodyFatPct",          label: "Body Fat",             unit: "%",  parseRegex: /body[\s\-]*fat[^\d\n]*([\d]+(?:\.[\d]+)?)/i },
  { key: "proteinMassKg",       label: "Protein Mass",         unit: "kg", parseRegex: /protein[\s\-]*mass[^\d\n]*([\d]+(?:\.[\d]+)?)/i },
  { key: "boneMassKg",          label: "Bone Mass",            unit: "kg", parseRegex: /bone[\s\-]*mass[^\d\n]*([\d]+(?:\.[\d]+)?)/i },
  { key: "fatMassKg",           label: "Fat Mass",             unit: "kg", parseRegex: /fat[\s\-]*mass[^\d\n]*([\d]+(?:\.[\d]+)?)/i },
  { key: "visceralFat",         label: "Visceral Fat",         unit: "",   parseRegex: /visceral[\s\-]*fat[^\d\n]*([\d]+(?:\.[\d]+)?)/i },
  { key: "bodyAge",             label: "Body age",             unit: "yrs",parseRegex: /body[\s\-]*age[^\d\n]*([\d]+)/i },
  { key: "bmr",                 label: "BMR",                  unit: "kcal",parseRegex: /\bbmr\b[^\d\n]*([\d]+)/i },
  { key: "bmi",                 label: "BMI",                  unit: "",   parseRegex: /\bbmi\b[^\d\n]*([\d]+(?:\.[\d]+)?)/i },
  { key: "weightKg",            label: "Weight",               unit: "kg", parseRegex: /^weight[^\d\n]*([\d]+(?:\.[\d]+)?)/im },
  { key: "proteinPct",          label: "Protein",              unit: "%",  parseRegex: /^protein[^\d\n]*([\d]+(?:\.[\d]+)?)/im },
];

// Non-numeric fields — text values.
const BODY_COMP_TEXT_FIELDS = [
  { key: "obesityLevel", label: "Obesity level", parseRegex: /obesity[\s\-]*level\s*(obesity\s+level\s+[ivx\d]+|normal|underweight|overweight)/i },
  { key: "bodyType",     label: "Body type",     parseRegex: /body[\s\-]*type\s+([a-z\-\s]+?)(?:\n|$)/i },
];

// ---------- OCR PARSER ----------
// Takes raw OCR output text, returns a partial body-comp entry.
function parseBodyCompText(text) {
  const entry = { source: "screenshot_ocr", raw: text };

  // Numeric fields: mask each match to prevent later regexes from re-matching.
  let workingText = text;
  BODY_COMP_FIELDS.forEach(f => {
    const m = workingText.match(f.parseRegex);
    if (m) {
      entry[f.key] = parseFloat(m[1]);
      // Mask this match so later regexes can't grab from inside it.
      workingText = workingText.replace(m[0], " ".repeat(m[0].length));
    }
  });

  // Text fields (obesity level, body type).
  BODY_COMP_TEXT_FIELDS.forEach(f => {
    const m = text.match(f.parseRegex);
    if (m) entry[f.key] = m[1].trim();
  });

  // Timestamp header: "06:09 Mar.5,2026" or variants.
  const dateMatch = text.match(/(\d{1,2}):(\d{2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{1,2}),?\s*(\d{4})/i);
  if (dateMatch) {
    const [_, hh, mm, monStr, day, year] = dateMatch;
    const months = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
    const monthIdx = months[monStr.slice(0,3).toLowerCase()];
    if (monthIdx !== undefined) {
      const d = new Date(Number(year), monthIdx, Number(day));
      entry.date = d.toISOString().slice(0, 10);
      entry.time = `${hh.padStart(2, "0")}:${mm}`;
    }
  }
  if (!entry.date) entry.date = new Date().toISOString().slice(0, 10);
  if (!entry.time) entry.time = new Date().toTimeString().slice(0, 5);

  entry.id = "bc-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1000);
  return entry;
}

// Rough sanity: at least weight and 3 other numeric fields parsed successfully.
function bodyCompParsedEnough(entry) {
  const numericKeys = BODY_COMP_FIELDS.map(f => f.key);
  const numFound = numericKeys.filter(k => typeof entry[k] === "number" && entry[k] > 0).length;
  return typeof entry.weightKg === "number" && entry.weightKg > 0 && numFound >= 4;
}

// ---------- GITHUB SYNC ----------
async function bodyCompSyncPull() {
  if (typeof githubReadDataFile !== "function") return;
  try {
    const remote = await githubReadDataFile(BODY_COMP_DATA_PATH);
    if (remote && Array.isArray(remote.entries)) {
      saveBodyComp(remote.entries);
    }
  } catch (e) { /* fine if the file doesn't exist yet */ }
}
async function bodyCompSyncPush(message) {
  if (typeof githubWriteDataFile !== "function") return;
  try {
    await githubWriteDataFile(BODY_COMP_DATA_PATH, { entries: loadBodyComp() }, message || "Update body composition");
  } catch (e) { /* silent — main workout push handles token/repo errors */ }
}

// ---------- RENDER ----------
function renderBodyCompPanel() {
  const container = document.getElementById("bodyCompPanel");
  if (!container) return;
  const entries = loadBodyComp();
  const latest = entries[entries.length - 1];

  if (!latest) {
    container.innerHTML = `
      <div class="body-comp-empty">
        <div class="body-comp-empty-title">No body composition data yet</div>
        <div class="body-comp-empty-help">Import a screenshot from your Fitdays scale app's "Body Data Report" screen to pull in weight, body fat, muscle mass, bone density, water, BMR, and more.</div>
      </div>`;
    return;
  }

  // Latest snapshot card + short history list
  const summaryRows = BODY_COMP_FIELDS
    .filter(f => typeof latest[f.key] === "number")
    .map(f => `
      <div class="bc-row">
        <span class="bc-label">${f.label}</span>
        <span class="bc-value">${latest[f.key]}${f.unit ? " " + f.unit : ""}</span>
      </div>`).join("");

  const textRows = BODY_COMP_TEXT_FIELDS
    .filter(f => latest[f.key])
    .map(f => `
      <div class="bc-row">
        <span class="bc-label">${f.label}</span>
        <span class="bc-value">${latest[f.key]}</span>
      </div>`).join("");

  const historyCount = entries.length;
  const dateStr = `${latest.date}${latest.time ? " " + latest.time : ""}`;
  container.innerHTML = `
    <div class="body-comp-latest">
      <div class="bc-latest-header">
        <span class="bc-latest-title">Latest scan</span>
        <span class="bc-latest-date">${dateStr}</span>
      </div>
      <div class="bc-grid">${summaryRows}${textRows}</div>
      <div class="bc-count-note">${historyCount} entr${historyCount === 1 ? "y" : "ies"} on record</div>
    </div>`;
}

// ---------- IMPORT FLOW ----------
async function handleBodyCompScreenshotFile(file) {
  const statusEl = document.getElementById("bcOcrStatus");
  const formEl = document.getElementById("bcOcrForm");
  const previewEl = document.getElementById("bcOcrPreview");
  statusEl.style.display = "block";
  statusEl.textContent = "Reading screenshot… this can take 10–20 seconds.";
  formEl.style.display = "none";
  previewEl.innerHTML = "";

  let text = "";
  try {
    const result = await Tesseract.recognize(file, "eng");
    text = result.data.text || "";
  } catch (e) {
    statusEl.textContent = "Couldn't read the screenshot. Try a clearer image or add values manually below.";
    formEl.style.display = "block";
    return;
  }

  const entry = parseBodyCompText(text);
  if (!bodyCompParsedEnough(entry)) {
    statusEl.textContent = "Only a few fields could be read. Check and edit before saving.";
  } else {
    const parsedCount = BODY_COMP_FIELDS.filter(f => typeof entry[f.key] === "number").length;
    statusEl.textContent = `Parsed ${parsedCount} fields. Confirm and save.`;
  }

  // Build editable preview form
  const rowsHtml = BODY_COMP_FIELDS.map(f => `
    <label class="bc-edit-row">
      <span>${f.label}${f.unit ? ` (${f.unit})` : ""}</span>
      <input type="number" step="any" data-bc-key="${f.key}" value="${entry[f.key] != null ? entry[f.key] : ""}">
    </label>`).join("");
  const textRowsHtml = BODY_COMP_TEXT_FIELDS.map(f => `
    <label class="bc-edit-row">
      <span>${f.label}</span>
      <input type="text" data-bc-key="${f.key}" value="${entry[f.key] || ""}">
    </label>`).join("");

  formEl.innerHTML = `
    <div class="bc-edit-date-row">
      <label class="bc-edit-row">
        <span>Date</span>
        <input type="date" id="bcOcrDate" value="${entry.date}">
      </label>
      <label class="bc-edit-row">
        <span>Time</span>
        <input type="time" id="bcOcrTime" value="${entry.time}">
      </label>
    </div>
    ${rowsHtml}
    ${textRowsHtml}
    <button id="bcOcrSaveBtn" class="primary-btn">Save entry</button>`;
  formEl.style.display = "block";

  document.getElementById("bcOcrSaveBtn").addEventListener("click", () => {
    const saved = {
      id: "bc-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1000),
      source: "screenshot_ocr",
      date: document.getElementById("bcOcrDate").value,
      time: document.getElementById("bcOcrTime").value,
    };
    formEl.querySelectorAll("[data-bc-key]").forEach(input => {
      const k = input.dataset.bcKey;
      const v = input.value.trim();
      if (v === "") return;
      const fieldDef = BODY_COMP_FIELDS.find(f => f.key === k);
      saved[k] = fieldDef ? parseFloat(v) : v;
    });

    addBodyCompEntry(saved);

    // Mirror weight into existing weight-logs so trend chart keeps working
    if (typeof saved.weightKg === "number" && typeof weightLogs !== "undefined") {
      const existingIdx = weightLogs.findIndex(w => w.date === saved.date);
      if (existingIdx >= 0) weightLogs[existingIdx].weight = saved.weightKg;
      else weightLogs.push({ date: saved.date, weight: saved.weightKg });
      if (typeof saveWeightLogs === "function") saveWeightLogs(weightLogs);
    }

    if (typeof showToast === "function") showToast("Body composition entry saved");
    bodyCompSyncPush("Add body composition entry from scale screenshot");
    if (typeof syncWorkouts === "function") syncWorkouts("Update weight from scale screenshot");
    closeBodyCompModal();
    renderBodyCompPanel();
    // Refresh comparison + chart if we're currently on the Body Stats tab
    if (typeof renderBodyStatsComparison === "function") renderBodyStatsComparison();
    const select = document.getElementById("bsMetricSelect");
    if (select && typeof renderBodyStatsMetricChart === "function") {
      renderBodyStatsMetricChart(select.value || "weightKg");
    }
    if (typeof renderWeightTrendChart === "function") renderWeightTrendChart();
    // Kick off diet auto-adjustment based on the new snapshot
    if (typeof runDietAdjustmentCheck === "function") {
      runDietAdjustmentCheck({ trigger: "body_comp_import" });
    }
  });
}

function openBodyCompModal() {
  const overlay = document.getElementById("bodyCompModalOverlay");
  if (!overlay) return;
  overlay.style.display = "flex";
  document.getElementById("bcOcrStatus").style.display = "none";
  document.getElementById("bcOcrForm").style.display = "none";
  document.getElementById("bcOcrPreview").innerHTML = "";
  document.getElementById("bcOcrFileInput").value = "";
}
function closeBodyCompModal() {
  const overlay = document.getElementById("bodyCompModalOverlay");
  if (overlay) overlay.style.display = "none";
}

// ---------- BASELINE (initial-vs-current comparison) ----------
const BODY_COMP_BASELINE_KEY = "ironlog_body_comp_baseline_v1";

function getBaselineEntryId() {
  return localStorage.getItem(BODY_COMP_BASELINE_KEY);
}
function setBaselineEntryId(id) {
  if (id) localStorage.setItem(BODY_COMP_BASELINE_KEY, id);
  else localStorage.removeItem(BODY_COMP_BASELINE_KEY);
}
function baselineEntry() {
  const id = getBaselineEntryId();
  const entries = loadBodyComp();
  if (id) {
    const found = entries.find(e => e.id === id);
    if (found) return found;
  }
  // Default: first entry chronologically
  return entries[0] || null;
}
function resetBaselineToLatest() {
  const entries = loadBodyComp();
  if (entries.length === 0) return false;
  const latest = entries[entries.length - 1];
  setBaselineEntryId(latest.id);
  return true;
}

// ---------- COMPARISON RENDER ----------
function renderBodyStatsComparison() {
  const container = document.getElementById("bsComparisonPanel");
  if (!container) return;
  const baseline = baselineEntry();
  const entries = loadBodyComp();
  const latest = entries[entries.length - 1];

  if (!baseline || !latest) {
    container.innerHTML = `<div class="body-comp-empty">
      <div class="body-comp-empty-help">Import at least two scale screenshots to see baseline vs latest comparison.</div>
    </div>`;
    return;
  }
  if (baseline.id === latest.id) {
    container.innerHTML = `<div class="body-comp-empty">
      <div class="body-comp-empty-help">Only one snapshot on record. Import another to see progress vs baseline.</div>
    </div>`;
    return;
  }

  const rowsHtml = BODY_COMP_FIELDS
    .filter(f => typeof baseline[f.key] === "number" || typeof latest[f.key] === "number")
    .map(f => {
      const bv = baseline[f.key], lv = latest[f.key];
      const baseStr = typeof bv === "number" ? `${bv}${f.unit ? " " + f.unit : ""}` : "—";
      const lateStr = typeof lv === "number" ? `${lv}${f.unit ? " " + f.unit : ""}` : "—";
      let deltaStr = "—", deltaCls = "";
      if (typeof bv === "number" && typeof lv === "number") {
        const d = lv - bv;
        const sign = d > 0 ? "+" : "";
        deltaStr = `${sign}${d.toFixed(1)}${f.unit ? " " + f.unit : ""}`;
        // Direction judged by metric semantics (some down = good)
        const downIsGood = ["weightKg","bmi","bodyFatPct","fatMassKg","subcutaneousFatPct","visceralFat","bodyAge"].includes(f.key);
        const upIsGood = ["muscleMassKg","muscleRatePct","skeletalMusclePct","boneMassKg","proteinMassKg","proteinPct","bodyWaterPct","waterWeightKg","bmr"].includes(f.key);
        if (Math.abs(d) < 0.05) deltaCls = "bs-delta-flat";
        else if ((d < 0 && downIsGood) || (d > 0 && upIsGood)) deltaCls = "bs-delta-good";
        else if ((d > 0 && downIsGood) || (d < 0 && upIsGood)) deltaCls = "bs-delta-bad";
      }
      return `<div class="bs-cmp-row">
        <span class="bs-cmp-label">${f.label}</span>
        <span class="bs-cmp-base">${baseStr}</span>
        <span class="bs-cmp-arrow">→</span>
        <span class="bs-cmp-late">${lateStr}</span>
        <span class="bs-cmp-delta ${deltaCls}">${deltaStr}</span>
      </div>`;
    }).join("");

  container.innerHTML = `
    <div class="bs-cmp-header">
      <div class="bs-cmp-header-col">
        <div class="bs-cmp-header-title">Baseline</div>
        <div class="bs-cmp-header-date">${baseline.date}</div>
      </div>
      <div class="bs-cmp-header-col">
        <div class="bs-cmp-header-title">Latest</div>
        <div class="bs-cmp-header-date">${latest.date}</div>
      </div>
    </div>
    <div class="bs-cmp-rows">${rowsHtml}</div>`;
}

// ---------- PER-METRIC TREND CHART ----------
let __bsMetricChartInstance = null;

// Per-metric Y-axis fallback ranges when no data has been logged yet.
// [min, max] chosen so the placeholder chart still shows a meaningful scale
// the user recognises for that metric on first glance.
const BS_METRIC_DEFAULT_RANGE = {
  weightKg:             [40, 120],
  bmi:                  [15, 40],
  bodyFatPct:           [5,  45],
  fatMassKg:            [0,  50],
  fatFreeBodyWeightKg:  [30, 100],
  muscleMassKg:         [20, 90],
  muscleRatePct:        [20, 70],
  skeletalMusclePct:    [20, 70],
  boneMassKg:           [1,  5],
  proteinMassKg:        [5,  40],
  proteinPct:           [10, 30],
  waterWeightKg:        [20, 70],
  bodyWaterPct:         [30, 70],
  subcutaneousFatPct:   [5,  35],
  visceralFat:          [1,  25],
  bmr:                  [1000, 3000],
  bodyAge:              [15, 80],
  idealBodyWeightKg:    [40, 100],
};

function renderBodyStatsMetricChart(key) {
  const canvas = document.getElementById("bsMetricChart");
  const emptyNote = document.getElementById("bsMetricEmpty");
  if (!canvas) return;
  // Axes-with-labels rule: always render the chart. The optional empty note
  // is only kept in the DOM as a legacy element — hide it permanently so it
  // can never mask the axes.
  if (emptyNote) emptyNote.style.display = "none";
  canvas.style.display = "block";

  const entries = (typeof loadBodyComp === "function") ? loadBodyComp() : [];
  const withValue = entries
    .filter(e => typeof e[key] === "number")
    .sort((a, b) => (a.date + "T" + (a.time || "00:00")) < (b.date + "T" + (b.time || "00:00")) ? -1 : 1);

  const field = BODY_COMP_FIELDS.find(f => f.key === key);
  const yTitle = (field ? field.label : key) + (field && field.unit ? " (" + field.unit + ")" : "");

  let labels, data, yMin, yMax;

  if (withValue.length === 0) {
    // Scaffold: last 7 dates on the X axis, no points, a real per-metric Y range.
    const today = new Date();
    labels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(5, 10);   // MM-DD
    });
    data = labels.map(() => null);
    const range = BS_METRIC_DEFAULT_RANGE[key] || [0, 100];
    yMin = range[0];
    yMax = range[1];
    // If we have a profile weight and the metric is weight-related, tighten the
    // scaffold around the user's ballpark so the empty axis is personally accurate.
    const profile = (typeof loadFoodProfile === "function") ? loadFoodProfile() : null;
    if (profile && profile.weightKg) {
      if (key === "weightKg") { yMin = Math.max(0, Math.floor((profile.weightKg - 15) / 5) * 5); yMax = Math.ceil((profile.weightKg + 15) / 5) * 5; }
      if (key === "idealBodyWeightKg") { yMin = Math.max(0, Math.floor((profile.weightKg - 25) / 5) * 5); yMax = Math.ceil((profile.weightKg + 5) / 5) * 5; }
    }
  } else {
    labels = withValue.map(e => e.date);
    data = withValue.map(e => e[key]);
    const min = Math.min(...data), max = Math.max(...data);
    const pad = Math.max((max - min) * 0.15, 0.5);
    yMin = min - pad;
    yMax = max + pad;
  }

  if (__bsMetricChartInstance) __bsMetricChartInstance.destroy();
  __bsMetricChartInstance = new Chart(canvas, {
    type: "line",
    data: { labels, datasets: [{
      label: field ? field.label : key,
      data,
      borderColor: "#4A9EFF",
      backgroundColor: "rgba(74,158,255,0.15)",
      pointBackgroundColor: "#4A9EFF",
      tension: 0.3, fill: true, spanGaps: true,
    }]},
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: yMin, max: yMax,
          ticks: { color: "#8f8f8f" },
          grid: { color: "rgba(255,255,255,0.05)" },
          title: { display: true, text: yTitle, color: "#8f8f8f" },
        },
        x: {
          ticks: { color: "#8f8f8f", maxRotation: 45 },
          grid: { color: "rgba(255,255,255,0.05)" },
          title: { display: true, text: "Date", color: "#8f8f8f" },
        },
      },
    },
  });
}

function populateMetricPicker() {
  const select = document.getElementById("bsMetricSelect");
  if (!select) return;
  // Keep prior selection if any
  const prior = select.value;
  select.innerHTML = "";
  BODY_COMP_FIELDS.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f.key;
    opt.textContent = f.label + (f.unit ? " (" + f.unit + ")" : "");
    select.appendChild(opt);
  });
  if (prior && BODY_COMP_FIELDS.some(f => f.key === prior)) select.value = prior;
  else select.value = "weightKg";
}

// ---------- WEIGHT INPUT ON BODY STATS TAB ----------
function renderBodyStatsWeightInput() {
  const input = document.getElementById("bsWeightInput");
  if (!input) return;
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = (typeof weightLogs !== "undefined") ? weightLogs.find(w => w.date === today) : null;
  input.value = todayEntry ? todayEntry.weightKg : "";
}

// ---------- BODY STATS TAB ENTRY POINT ----------
function renderBodyStatsTab() {
  renderBodyCompPanel();
  renderBodyStatsWeightInput();
  renderBodyStatsComparison();
  populateMetricPicker();
  const select = document.getElementById("bsMetricSelect");
  if (select) renderBodyStatsMetricChart(select.value || "weightKg");
  // Also render the weight trend chart that we moved from Progress
  if (typeof renderWeightTrendChart === "function") renderWeightTrendChart();
}

// Wire up buttons once the DOM is ready.
function initBodyStatsUI() {
  const openBtn = document.getElementById("bodyCompImportBtn");
  const overlay = document.getElementById("bodyCompModalOverlay");
  const closeBtn = document.getElementById("bcOcrCloseBtn");
  const fileInput = document.getElementById("bcOcrFileInput");
  const weightSaveBtn = document.getElementById("bsWeightSaveBtn");
  const weightInput = document.getElementById("bsWeightInput");
  const resetBaselineBtn = document.getElementById("bsResetBaselineBtn");
  const metricSelect = document.getElementById("bsMetricSelect");

  if (openBtn) openBtn.addEventListener("click", openBodyCompModal);
  if (closeBtn) closeBtn.addEventListener("click", closeBodyCompModal);
  if (overlay) overlay.addEventListener("click", (e) => { if (e.target === overlay) closeBodyCompModal(); });
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) handleBodyCompScreenshotFile(file);
    });
  }
  if (weightSaveBtn && weightInput) {
    weightSaveBtn.addEventListener("click", () => {
      const val = parseFloat(weightInput.value);
      if (!val) { if (typeof showToast === "function") showToast("Enter a weight"); return; }
      const today = new Date().toISOString().slice(0, 10);
      if (typeof weightLogs !== "undefined") {
        weightLogs = weightLogs.filter(w => w.date !== today);
        weightLogs.push({ date: today, weightKg: val });
        if (typeof saveWeightLogs === "function") saveWeightLogs(weightLogs);
      }
      if (typeof showToast === "function") showToast("Weight logged");
      if (typeof syncPush === "function") syncPush("Log daily weight");
      // Refresh trend chart if we're on Body Stats tab
      if (typeof renderWeightTrendChart === "function") renderWeightTrendChart();
      // Trigger diet adjuster in case weight-only cadence has enough data
      if (typeof runDietAdjustmentCheck === "function") runDietAdjustmentCheck({ trigger: "weight_log" });
    });
  }
  if (resetBaselineBtn) {
    resetBaselineBtn.addEventListener("click", () => {
      if (resetBaselineToLatest()) {
        if (typeof showToast === "function") showToast("Baseline reset to latest snapshot");
        renderBodyStatsComparison();
      } else {
        if (typeof showToast === "function") showToast("No snapshots yet to use as baseline");
      }
    });
  }
  if (metricSelect) {
    metricSelect.addEventListener("change", () => {
      renderBodyStatsMetricChart(metricSelect.value);
    });
  }
  // Initial render for anything that doesn't need the tab to be active
  renderBodyCompPanel();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBodyStatsUI);
  } else {
    initBodyStatsUI();
  }
}
