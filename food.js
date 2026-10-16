// ============================================================
// FOOD TAB — nutrition tracking with real macro/micro data
// ============================================================

const FOOD_PROFILE_KEY = "ironlog_food_profile_v1";
const FOOD_LOGS_KEY = "ironlog_food_logs_v1";
const MY_FOODS_KEY = "ironlog_my_foods_v1";
const FOOD_DATA_PATH = "data/food.json";

function loadFoodProfile() { try { return JSON.parse(localStorage.getItem(FOOD_PROFILE_KEY)); } catch { return null; } }
function saveFoodProfile(p) { localStorage.setItem(FOOD_PROFILE_KEY, JSON.stringify(p)); }
function loadFoodLogs() { try { return JSON.parse(localStorage.getItem(FOOD_LOGS_KEY)) || []; } catch { return []; } }
function saveFoodLogs(logs) { localStorage.setItem(FOOD_LOGS_KEY, JSON.stringify(logs)); }
function loadMyFoods() { try { return JSON.parse(localStorage.getItem(MY_FOODS_KEY)) || []; } catch { return []; } }
function saveMyFoods(foods) { localStorage.setItem(MY_FOODS_KEY, JSON.stringify(foods)); }

let foodLogs = loadFoodLogs();
let myFoods = loadMyFoods();
let currentFoodDate = todayISO();
let activeAddMealType = "Breakfast";

// ---------- IFCT 2017 Indian Food Database ----------
let ifctFoods = [];
fetch("./ifct-foods.json")
  .then(r => r.ok ? r.json() : [])
  .then(d => { ifctFoods = d; })
  .catch(() => {});

function searchIFCT(query, limit = 10) {
  if (!ifctFoods.length || !query) return [];
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = [];
  for (const f of ifctFoods) {
    const hay = f.n.toLowerCase();
    let match = 0;
    for (const t of terms) { if (hay.includes(t)) match++; }
    if (match > 0) scored.push({ food: f, score: match / terms.length + (hay.startsWith(terms[0]) ? 0.5 : 0) });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.food);
}

// ---------- MICRONUTRIENT REFERENCE (standard adult RDA) ----------
// ---------- MICRONUTRIENT RDA (age & sex aware, per NIH ODS DRIs) ----------
// Each entry declares its measurement unit and how to compute the daily
// reference intake based on the user's age band and sex. Where age/sex has
// no meaningful effect, the value is a single number.
//
// Age bands used: teen (14-18), adult (19-50), older (51-70), senior (71+).
// A profile whose age is below 14 falls back to the adult column (RDA
// personalisation is only accurate from adolescence onward).
const MICRO_RDA = {
  // Fat-soluble vitamins
  vitaminA:    { name: "Vitamin A",         unit: "mcg", byAgeSex: { teen:{m:900,f:700}, adult:{m:900,f:700}, older:{m:900,f:700}, senior:{m:900,f:700} } },
  vitaminD:    { name: "Vitamin D",         unit: "mcg", byAgeSex: { teen:{m:15, f:15},  adult:{m:15, f:15},  older:{m:15, f:15},  senior:{m:20, f:20} } },
  vitaminE:    { name: "Vitamin E",         unit: "mg",  byAgeSex: { teen:{m:15, f:15},  adult:{m:15, f:15},  older:{m:15, f:15},  senior:{m:15, f:15} } },
  vitaminK:    { name: "Vitamin K",         unit: "mcg", byAgeSex: { teen:{m:75, f:75},  adult:{m:120,f:90},  older:{m:120,f:90},  senior:{m:120,f:90} } },
  // Water-soluble vitamins
  vitaminC:    { name: "Vitamin C",         unit: "mg",  byAgeSex: { teen:{m:75, f:65},  adult:{m:90, f:75},  older:{m:90, f:75},  senior:{m:90, f:75} } },
  thiamin:     { name: "Thiamin (B1)",      unit: "mg",  byAgeSex: { teen:{m:1.2,f:1.0}, adult:{m:1.2,f:1.1}, older:{m:1.2,f:1.1}, senior:{m:1.2,f:1.1} } },
  riboflavin:  { name: "Riboflavin (B2)",   unit: "mg",  byAgeSex: { teen:{m:1.3,f:1.0}, adult:{m:1.3,f:1.1}, older:{m:1.3,f:1.1}, senior:{m:1.3,f:1.1} } },
  niacin:      { name: "Niacin (B3)",       unit: "mg",  byAgeSex: { teen:{m:16, f:14},  adult:{m:16, f:14},  older:{m:16, f:14},  senior:{m:16, f:14} } },
  pantothenic: { name: "Pantothenic (B5)",  unit: "mg",  byAgeSex: { teen:{m:5,  f:5},   adult:{m:5,  f:5},   older:{m:5,  f:5},   senior:{m:5,  f:5} } },
  vitaminB6:   { name: "Vitamin B6",        unit: "mg",  byAgeSex: { teen:{m:1.3,f:1.2}, adult:{m:1.3,f:1.3}, older:{m:1.7,f:1.5}, senior:{m:1.7,f:1.5} } },
  biotin:      { name: "Biotin (B7)",       unit: "mcg", byAgeSex: { teen:{m:25, f:25},  adult:{m:30, f:30},  older:{m:30, f:30},  senior:{m:30, f:30} } },
  folate:      { name: "Folate (B9)",       unit: "mcg", byAgeSex: { teen:{m:400,f:400}, adult:{m:400,f:400}, older:{m:400,f:400}, senior:{m:400,f:400} } },
  vitaminB12:  { name: "Vitamin B12",       unit: "mcg", byAgeSex: { teen:{m:2.4,f:2.4}, adult:{m:2.4,f:2.4}, older:{m:2.4,f:2.4}, senior:{m:2.4,f:2.4} } },
  choline:     { name: "Choline",           unit: "mg",  byAgeSex: { teen:{m:550,f:400}, adult:{m:550,f:425}, older:{m:550,f:425}, senior:{m:550,f:425} } },
  // Macro minerals
  calcium:     { name: "Calcium",           unit: "mg",  byAgeSex: { teen:{m:1300,f:1300}, adult:{m:1000,f:1000}, older:{m:1000,f:1200}, senior:{m:1200,f:1200} } },
  phosphorus:  { name: "Phosphorus",        unit: "mg",  byAgeSex: { teen:{m:1250,f:1250}, adult:{m:700, f:700},  older:{m:700, f:700},  senior:{m:700, f:700} } },
  magnesium:   { name: "Magnesium",         unit: "mg",  byAgeSex: { teen:{m:410, f:360},  adult:{m:400, f:310},  older:{m:420, f:320},  senior:{m:420, f:320} } },
  potassium:   { name: "Potassium",         unit: "mg",  byAgeSex: { teen:{m:3000,f:2300}, adult:{m:3400,f:2600}, older:{m:3400,f:2600}, senior:{m:3400,f:2600} } },
  sodium:      { name: "Sodium",            unit: "mg",  byAgeSex: { teen:{m:1500,f:1500}, adult:{m:1500,f:1500}, older:{m:1300,f:1300}, senior:{m:1200,f:1200} } },
  // Trace minerals
  iron:        { name: "Iron",              unit: "mg",  byAgeSex: { teen:{m:11, f:15},  adult:{m:8,  f:18},  older:{m:8,  f:8},   senior:{m:8,  f:8} } },
  zinc:        { name: "Zinc",              unit: "mg",  byAgeSex: { teen:{m:11, f:9},   adult:{m:11, f:8},   older:{m:11, f:8},   senior:{m:11, f:8} } },
  copper:      { name: "Copper",            unit: "mcg", byAgeSex: { teen:{m:890,f:890}, adult:{m:900,f:900}, older:{m:900,f:900}, senior:{m:900,f:900} } },
  manganese:   { name: "Manganese",         unit: "mg",  byAgeSex: { teen:{m:2.2,f:1.6}, adult:{m:2.3,f:1.8}, older:{m:2.3,f:1.8}, senior:{m:2.3,f:1.8} } },
  selenium:    { name: "Selenium",          unit: "mcg", byAgeSex: { teen:{m:55, f:55},  adult:{m:55, f:55},  older:{m:55, f:55},  senior:{m:55, f:55} } },
  iodine:      { name: "Iodine",            unit: "mcg", byAgeSex: { teen:{m:150,f:150}, adult:{m:150,f:150}, older:{m:150,f:150}, senior:{m:150,f:150} } },
  chromium:    { name: "Chromium",          unit: "mcg", byAgeSex: { teen:{m:35, f:24},  adult:{m:35, f:25},  older:{m:30, f:20},  senior:{m:30, f:20} } },
  molybdenum:  { name: "Molybdenum",        unit: "mcg", byAgeSex: { teen:{m:43, f:43},  adult:{m:45, f:45},  older:{m:45, f:45},  senior:{m:45, f:45} } },
};

function _ageBand(age) {
  const a = Number(age) || 30;
  if (a >= 71) return "senior";
  if (a >= 51) return "older";
  if (a >= 19) return "adult";
  if (a >= 14) return "teen";
  return "adult"; // <14 not personalised — safest fallback
}

// Returns the RDA/AI for a micronutrient, tailored to the profile. Accepts
// either the whole food profile object (preferred) or a bare gender string
// for backward compatibility with older callers.
function micronutrientRDA(key, profileOrGender) {
  const info = MICRO_RDA[key];
  if (!info) return 0;
  let gender = "male", age = 30;
  if (typeof profileOrGender === "string") {
    gender = profileOrGender;
  } else if (profileOrGender && typeof profileOrGender === "object") {
    gender = profileOrGender.gender || "male";
    age = profileOrGender.age || 30;
  }
  const band = _ageBand(age);
  const cell = info.byAgeSex[band];
  return gender === "female" ? cell.f : cell.m;
}

// USDA nutrientName substring -> {key, unit conversion}
const USDA_NUTRIENT_MAP = [
  ["Vitamin A, RAE", "vitaminA", "mcg"],
  ["Vitamin C", "vitaminC", "mg"],
  ["Vitamin D (D2", "vitaminD", "mcg"],
  ["Vitamin E", "vitaminE", "mg"],
  ["Vitamin K", "vitaminK", "mcg"],
  ["Thiamin", "thiamin", "mg"],
  ["Riboflavin", "riboflavin", "mg"],
  ["Niacin", "niacin", "mg"],
  ["Vitamin B-6", "vitaminB6", "mg"],
  ["Folate, total", "folate", "mcg"],
  ["Vitamin B-12", "vitaminB12", "mcg"],
  ["Pantothenic acid", "pantothenic", "mg"],
  ["Biotin", "biotin", "mcg"],
  ["Calcium, Ca", "calcium", "mg"],
  ["Iron, Fe", "iron", "mg"],
  ["Magnesium, Mg", "magnesium", "mg"],
  ["Phosphorus, P", "phosphorus", "mg"],
  ["Potassium, K", "potassium", "mg"],
  ["Sodium, Na", "sodium", "mg"],
  ["Zinc, Zn", "zinc", "mg"],
  ["Copper, Cu", "copper", "mcg"],
  ["Manganese, Mn", "manganese", "mg"],
  ["Selenium, Se", "selenium", "mcg"],
  ["Choline, total", "choline", "mg"],
  ["Iodine, I", "iodine", "mcg"],
  ["Chromium, Cr", "chromium", "mcg"],
  ["Molybdenum, Mo", "molybdenum", "mcg"],
];

function emptyMicros() {
  const m = {};
  Object.keys(MICRO_RDA).forEach(k => m[k] = 0);
  return m;
}

// ---------- GITHUB SYNC (food data — separate file, same PAT) ----------
async function foodGithubPull() {
  const cfg = loadSyncConfig();
  if (!cfg) return null;
  const res = await fetch(ghApiUrl(cfg, FOOD_DATA_PATH), { headers: ghHeaders(cfg) });
  if (res.status === 404) return { profile: null, logs: [], myFoods: [] };
  if (!res.ok) throw new Error(`GitHub read failed (${res.status})`);
  const data = await res.json();
  return JSON.parse(b64ToUtf8(data.content));
}

async function foodGithubPush(message) {
  const cfg = loadSyncConfig();
  if (!cfg) return;
  let sha = null;
  const head = await fetch(ghApiUrl(cfg, FOOD_DATA_PATH), { headers: ghHeaders(cfg) });
  if (head.ok) sha = (await head.json()).sha;
  else if (head.status !== 404) throw new Error(`GitHub read failed (${head.status})`);

  const payload = { profile: loadFoodProfile(), logs: foodLogs, myFoods };
  const body = { message: message || "Update food log", content: utf8ToB64(JSON.stringify(payload, null, 2)) };
  if (sha) body.sha = sha;

  const put = await fetch(ghApiUrl(cfg, FOOD_DATA_PATH), {
    method: "PUT",
    headers: { ...ghHeaders(cfg), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!put.ok) throw new Error(`GitHub write failed (${put.status})`);
}

async function foodSyncPush(message) {
  const cfg = loadSyncConfig();
  if (!cfg) return;
  try { await foodGithubPush(message); } catch (e) { /* silent — workout sync already surfaces errors */ }
}

async function foodSyncPullAndApply() {
  const cfg = loadSyncConfig();
  if (!cfg) return;
  try {
    const remote = await foodGithubPull();
    if (remote) {
      if (remote.profile) saveFoodProfile(remote.profile);
      if (remote.logs) { foodLogs = remote.logs; saveFoodLogs(foodLogs); }
      if (remote.myFoods) { myFoods = remote.myFoods; saveMyFoods(myFoods); }
    }
    if (document.getElementById("view-food").classList.contains("active")) renderFoodTab();
  } catch (e) { /* silent */ }
}

// ---------- CALORIE / MACRO CALCULATOR ----------
function calcBMI(weightKg, heightCm) {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  let category;
  if (bmi < 18.5) category = "Underweight";
  else if (bmi < 25) category = "Normal";
  else if (bmi < 30) category = "Overweight";
  else category = "Obese";
  return { bmi: Math.round(bmi * 10) / 10, category };
}

// Semicircular BMI gauge, calculator.net style: colored zones + needle.
const BMI_GAUGE_ZONES = [
  { from: 15, to: 18.5, color: "#FF9F7A" },
  { from: 18.5, to: 25, color: "#4ACF6B" },
  { from: 25, to: 30, color: "#FFC94A" },
  { from: 30, to: 40, color: "#FF5A5A" },
];
function bmiToAngle(bmi) {
  const clamped = Math.max(15, Math.min(40, bmi));
  const frac = (clamped - 15) / (40 - 15);
  return Math.PI * (1 + frac); // PI (left, bmi 15) -> 2*PI (right, bmi 40)
}
function drawBMIGauge(canvas, bmi) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h * 0.95;
  const r = Math.min(w / 2 - 8, h - 14);
  const lineWidth = Math.max(8, r * 0.26);

  BMI_GAUGE_ZONES.forEach(z => {
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "butt";
    ctx.strokeStyle = z.color;
    ctx.arc(cx, cy, r - lineWidth / 2, bmiToAngle(z.from), bmiToAngle(z.to));
    ctx.stroke();
  });

  const angle = bmiToAngle(bmi);
  const needleR = r - lineWidth / 2;
  const nx = cx + needleR * Math.cos(angle);
  const ny = cy + needleR * Math.sin(angle);
  ctx.strokeStyle = "#EDEAE3";
  ctx.lineWidth = 2.5;
  ctx.shadowColor = "#EDEAE3"; ctx.shadowBlur = 5;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#EDEAE3";
  ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
}

// 1 kg of body fat ≈ 7700 kcal — same conversion calculator.net-style tools use
// to translate a target weekly rate into a daily calorie adjustment.
const KCAL_PER_KG = 7700;
const RATE_OPTIONS = [
  { key: "extremeLoss", label: "Extreme weight loss", rate: -1 },
  { key: "loss",         label: "Weight loss",         rate: -0.5 },
  { key: "mildLoss",     label: "Mild weight loss",    rate: -0.25 },
  { key: "maintain",     label: "Maintain weight",     rate: 0 },
  { key: "mildGain",     label: "Mild weight gain",    rate: 0.25 },
  { key: "gain",         label: "Weight gain",         rate: 0.5 },
  { key: "fastGain",     label: "Fast weight gain",    rate: 1 },
];

let selectedRateKey = "maintain";
let selectedDietStyle = "balanced";
let currentMacroPct = { protein: 25, carb: 45, fat: 30 };
let setupProfileBase = {};

function renderRateOptions(maintenanceCalories, weightKg) {
  const list = document.getElementById("rateOptionsList");
  list.innerHTML = RATE_OPTIONS.map(opt => {
    const cal = Math.round(maintenanceCalories + (opt.rate * KCAL_PER_KG) / 7);
    const pct = Math.round((cal / maintenanceCalories) * 100);
    const rateLabel = opt.rate === 0 ? "" : `${Math.abs(opt.rate)} kg/week`;
    return `
      <div class="rate-option-row ${opt.key === selectedRateKey ? "selected" : ""}" data-key="${opt.key}" data-cal="${cal}">
        <div>
          <div class="rate-option-name">${opt.label}</div>
          <div class="rate-option-rate">${rateLabel}</div>
        </div>
        <div>
          <div class="rate-option-cal">${cal}</div>
          <div class="rate-option-pct">${pct}% · Calories/day</div>
        </div>
      </div>`;
  }).join("");

  list.querySelectorAll(".rate-option-row").forEach(row => {
    row.addEventListener("click", () => {
      selectedRateKey = row.dataset.key;
      list.querySelectorAll(".rate-option-row").forEach(r => r.classList.remove("selected"));
      row.classList.add("selected");
      document.getElementById("fpGoalCal").value = row.dataset.cal;
      document.getElementById("fpGoalsPanel").style.display = "block";
      document.getElementById("dietStylePanel").style.display = "block";
      refreshMacroLockDisplay();
      refreshCyclingInfo();
    });
  });
}

// ---------- DIET STYLE GRID ----------
function renderDietStyleGrid() {
  const grid = document.getElementById("dietStyleGrid");
  grid.innerHTML = DIET_STYLE_ORDER.map(key => {
    const style = DIET_STYLES[key];
    return `<button class="diet-style-btn ${key === selectedDietStyle ? "selected" : ""}" data-style="${key}">${style.label}</button>`;
  }).join("");
  grid.querySelectorAll(".diet-style-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedDietStyle = btn.dataset.style;
      grid.querySelectorAll(".diet-style-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      applyDietStyleSelection();
    });
  });
}

function hideAllDietSubpanels() {
  ["macroLockPanel", "cyclingInfoPanel", "fastingWindowPanel", "hyperbolicFastingPanel", "hyperbolicDietPanel"].forEach(id => {
    document.getElementById(id).style.display = "none";
  });
}

function applyDietStyleSelection() {
  hideAllDietSubpanels();
  const style = DIET_STYLES[selectedDietStyle];
  const goalCalEl = document.getElementById("fpGoalCal");
  const goalCalRow = goalCalEl.parentElement; // the whole fpGoalsPanel is one block, we just hide fields inside for hyperbolic

  if (style.type === "ratio") {
    currentMacroPct = { protein: style.protein, carb: style.carb, fat: style.fat };
    document.getElementById("macroLockPanel").style.display = "block";
    document.getElementById("fpGoalsPanel").style.display = "block";
    refreshMacroLockDisplay();
  } else if (style.type === "cycling" || style.type === "zigzag") {
    document.getElementById("cyclingInfoPanel").style.display = "block";
    document.getElementById("fpGoalsPanel").style.display = "block";
    refreshCyclingInfo();
  } else if (style.type === "timing") {
    currentMacroPct = { protein: 30, carb: 40, fat: 30 }; // slightly higher protein default for fewer meals
    document.getElementById("macroLockPanel").style.display = "block";
    document.getElementById("fastingWindowPanel").style.display = "block";
    document.getElementById("fpGoalsPanel").style.display = "block";
    renderWindowPresets(style.defaultWindow);
    refreshMacroLockDisplay();
  } else if (style.type === "hyperbolicFasting") {
    document.getElementById("hyperbolicFastingPanel").style.display = "block";
    document.getElementById("fpGoalsPanel").style.display = "none";
    const heightCm = parseFloat(document.getElementById("fpHeight").value);
    const N = heightNumberFromCm(heightCm);
    document.getElementById("hfProteinNote").textContent = `Your protein number (from height): ${N}g/day baseline.`;
  } else if (style.type === "hyperbolicDiet") {
    document.getElementById("hyperbolicDietPanel").style.display = "block";
    document.getElementById("fpGoalsPanel").style.display = "none";
    updateHyperbolicDietNote();
  }
}

function refreshMacroLockDisplay() {
  const calories = parseFloat(document.getElementById("fpGoalCal").value) || 0;
  document.getElementById("macroLockProteinPct").value = currentMacroPct.protein;
  document.getElementById("macroLockCarbPct").value = currentMacroPct.carb;
  document.getElementById("macroLockFatPct").value = currentMacroPct.fat;
  const grams = macrosFromRatio(calories, currentMacroPct.protein, currentMacroPct.carb, currentMacroPct.fat);
  document.getElementById("macroLockProteinG").textContent = grams.goalProtein + "g";
  document.getElementById("macroLockCarbG").textContent = grams.goalCarb + "g";
  document.getElementById("macroLockFatG").textContent = grams.goalFat + "g";
  document.getElementById("macroLockTotal").textContent = `${currentMacroPct.protein + currentMacroPct.carb + currentMacroPct.fat}% of ${calories} kcal`;
}

["macroLockProteinPct", "macroLockCarbPct", "macroLockFatPct"].forEach(id => {
  document.getElementById(id).addEventListener("input", (e) => {
    const key = id.includes("Protein") ? "protein" : id.includes("Carb") ? "carb" : "fat";
    currentMacroPct = rebalanceMacroPct(key, parseFloat(e.target.value) || 0, currentMacroPct);
    refreshMacroLockDisplay();
  });
});

function refreshCyclingInfo() {
  const calories = parseFloat(document.getElementById("fpGoalCal").value) || 0;
  const titleEl = document.getElementById("cyclingInfoTitle");
  const bodyEl = document.getElementById("cyclingInfoBody");
  if (selectedDietStyle === "carbCycling") {
    titleEl.textContent = "Carb Cycling";
    const high = macrosFromRatio(calories, DIET_STYLES.carbCycling.high.protein, DIET_STYLES.carbCycling.high.carb, DIET_STYLES.carbCycling.high.fat);
    const low = macrosFromRatio(calories, DIET_STYLES.carbCycling.low.protein, DIET_STYLES.carbCycling.low.carb, DIET_STYLES.carbCycling.low.fat);
    bodyEl.innerHTML = `On training days: P${high.goalProtein}g / C${high.goalCarb}g / F${high.goalFat}g.<br>On rest days: P${low.goalProtein}g / C${low.goalCarb}g / F${low.goalFat}g.<br>Applied automatically based on today's program day.`;
  } else if (selectedDietStyle === "zigzag") {
    titleEl.textContent = "Zigzag Calorie Diet";
    const maintenance = JSON.parse(document.getElementById("fpGoalsPanel").dataset.profile || "{}").maintenanceCalories || calories;
    const z = zigzagCaloriesForToday(maintenance, calories);
    bodyEl.innerHTML = `Training days: ~${z.trainDayCal} kcal (+${z.swingPct}%). Rest days: ~${z.restDayCal} kcal. Weekly average lands on your ${calories} kcal target. Swing auto-adjusts (15–20%) based on last week's training volume.`;
  }
}

function renderWindowPresets(defaultHours) {
  const row = document.getElementById("windowPresetRow");
  const presets = [
    { label: "16:8", hours: 8 },
    { label: "18:6", hours: 6 },
    { label: "20:4", hours: 4 },
    { label: "OMAD 23:1", hours: 1 },
    { label: "Custom", hours: null },
  ];
  row.innerHTML = presets.map(p => `<button class="window-preset-btn ${p.hours === defaultHours ? "selected" : ""}" data-hours="${p.hours ?? ""}">${p.label}</button>`).join("");
  row.querySelectorAll(".window-preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      row.querySelectorAll(".window-preset-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      const hours = btn.dataset.hours;
      const customFields = document.getElementById("customWindowFields");
      if (hours === "") { customFields.style.display = "block"; }
      else { customFields.style.display = "none"; document.getElementById("windowHours").value = hours; }
    });
  });
}

document.querySelectorAll('input[name="hfSchedule"]').forEach(r => {
  r.addEventListener("change", () => {}); // value read at save time
});

document.getElementById("hdVariant").addEventListener("change", updateHyperbolicDietNote);
function updateHyperbolicDietNote() {
  const variant = document.getElementById("hdVariant").value;
  const v = HD_VARIANTS[variant];
  document.getElementById("hdRotationNote").textContent = `5-day rotation: ${v.dayFractions.map(f => Math.round(f * 100) + "%").join(" / ")} of the weekly total. Today's calories are computed automatically once saved.`;
}

// ---------- SETUP FLOW ----------
// ---------- TIMELINE-DRIVEN CALORIE PLANNING ----------
// Safety limits: max 1 kg/week loss, max 0.5 kg/week gain.
const MAX_LOSS_KG_PER_WEEK = 1.0;
const MAX_GAIN_KG_PER_WEEK = 0.5;

function daysBetween(fromISO, toISO) {
  const a = new Date(fromISO + "T00:00:00");
  const b = new Date(toISO + "T00:00:00");
  return Math.round((b - a) / 86400000);
}
function addDaysISO(fromISO, days) {
  const d = new Date(fromISO + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function safestReachableDate(currentKg, targetKg) {
  const diff = currentKg - targetKg; // + for loss, − for gain
  const weeksNeeded = diff >= 0
    ? diff / MAX_LOSS_KG_PER_WEEK
    : (-diff) / MAX_GAIN_KG_PER_WEEK;
  return addDaysISO(todayISO(), Math.ceil(weeksNeeded * 7));
}
// Returns { goalCalories, deficitPerDay, safe, safeDate, weeklyRateKg, note }
function computeTimelinePlan(currentKg, targetKg, targetDateISO, maintenanceCalories) {
  if (!currentKg || !targetKg || !targetDateISO || !maintenanceCalories) return null;
  const days = daysBetween(todayISO(), targetDateISO);
  if (days <= 0) return { safe: false, note: "Target date must be in the future.", safeDate: safestReachableDate(currentKg, targetKg) };

  const diffKg = currentKg - targetKg; // + = need to lose, − = need to gain
  const totalKcal = diffKg * KCAL_PER_KG;
  const deficitPerDay = Math.round(totalKcal / days);
  const weeklyRateKg = (diffKg / days) * 7;

  let safe = true;
  let note = "";
  if (diffKg > 0 && weeklyRateKg > MAX_LOSS_KG_PER_WEEK) {
    safe = false;
    note = `You're aiming for ${weeklyRateKg.toFixed(2)} kg/week loss — over the safe 1 kg/week limit.`;
  } else if (diffKg < 0 && (-weeklyRateKg) > MAX_GAIN_KG_PER_WEEK) {
    safe = false;
    note = `You're aiming for ${(-weeklyRateKg).toFixed(2)} kg/week gain — over the safe 0.5 kg/week limit.`;
  }

  const goalCalories = Math.max(1000, Math.round(maintenanceCalories - deficitPerDay));
  return {
    safe,
    goalCalories,
    deficitPerDay,
    weeklyRateKg,
    safeDate: safe ? null : safestReachableDate(currentKg, targetKg),
    note,
    days,
  };
}

function refreshTimelineNote() {
  const noteEl = document.getElementById("fpTimelineNote");
  if (!noteEl) return;
  const base = JSON.parse(document.getElementById("fpGoalsPanel").dataset.profile || "{}");
  const targetKg = parseFloat(document.getElementById("fpTargetWeight").value) || null;
  const targetDate = document.getElementById("fpTargetDate").value || null;
  const currentKg = parseFloat(document.getElementById("fpWeight").value) || base.weightKg;
  const maint = base.maintenanceCalories;
  if (!targetKg || !targetDate || !currentKg || !maint) { noteEl.textContent = ""; return; }
  const plan = computeTimelinePlan(currentKg, targetKg, targetDate, maint);
  if (!plan) { noteEl.textContent = ""; return; }
  if (!plan.safe) {
    const safeDateFmt = new Date(plan.safeDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
    noteEl.style.color = "#e74c3c";
    noteEl.textContent = `⚠ ${plan.note} Earliest safely reachable: ${safeDateFmt}. Pick that date or a later one.`;
  } else {
    noteEl.style.color = "";
    const dirWord = plan.deficitPerDay >= 0 ? "deficit" : "surplus";
    noteEl.textContent = `To hit ${targetKg} kg by that date: ${Math.abs(plan.deficitPerDay)} kcal/day ${dirWord} → ${plan.goalCalories} kcal/day. Rate: ${plan.weeklyRateKg.toFixed(2)} kg/week.`;
  }
}
["fpTargetWeight", "fpTargetDate", "fpWeight"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", refreshTimelineNote);
  if (el) el.addEventListener("change", refreshTimelineNote);
});

document.getElementById("fpCalcBtn").addEventListener("click", () => {
  const age = parseFloat(document.getElementById("fpAge").value);
  const gender = document.getElementById("fpGender").value;
  const heightCm = parseFloat(document.getElementById("fpHeight").value);
  const weightKg = parseFloat(document.getElementById("fpWeight").value);
  const activity = document.getElementById("fpActivity").value;
  const targetWeightKg = parseFloat(document.getElementById("fpTargetWeight").value) || null;
  const targetDate = document.getElementById("fpTargetDate").value || null;
  if (!age || !heightCm || !weightKg) { showToast("Fill in age, height, and weight"); return; }

  const bmr = gender === "female"
    ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const maintenanceCalories = Math.round(bmr * parseFloat(activity));
  const { bmi, category } = calcBMI(weightKg, heightCm);

  // Timeline safety gate — block save when target date requires an unsafe rate.
  if (targetWeightKg && targetDate) {
    const plan = computeTimelinePlan(weightKg, targetWeightKg, targetDate, maintenanceCalories);
    if (plan && !plan.safe) {
      const safeDateFmt = new Date(plan.safeDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
      showToast(`${plan.note} Earliest safe date: ${safeDateFmt}. Change the date to that or later.`);
      return;
    }
  }

  document.getElementById("bmiGaugePanel").style.display = "block";
  drawBMIGauge(document.getElementById("bmiGaugeCanvas"), bmi);
  document.getElementById("bmiGaugeValue").innerHTML = `BMI = ${bmi} <span class="bmi-cat">${category}</span>`;

  document.getElementById("rateOptionsPanel").style.display = "block";
  // If a target date was given, precompute the goal calories from it and
  // pre-select a matching rate; otherwise default to maintain.
  let precomputedGoalCal = null;
  if (targetWeightKg && targetDate) {
    const plan = computeTimelinePlan(weightKg, targetWeightKg, targetDate, maintenanceCalories);
    if (plan && plan.safe) precomputedGoalCal = plan.goalCalories;
  }
  selectedRateKey = precomputedGoalCal ? "timeline" : "maintain";
  renderRateOptions(maintenanceCalories, weightKg);
  document.getElementById("fpGoalCal").value = precomputedGoalCal || maintenanceCalories;

  setupProfileBase = { age, gender, heightCm, weightKg, activity, targetWeightKg, targetDate, maintenanceCalories, bmi, bmiCategory: category };
  document.getElementById("fpGoalsPanel").dataset.profile = JSON.stringify(setupProfileBase);

  document.getElementById("dietStylePanel").style.display = "block";
  renderDietStyleGrid();
  applyDietStyleSelection();
  document.getElementById("fpSaveBtn").style.display = "block";
  refreshTimelineNote();
});

// PUBLIC: called by body-comp when a new weight is logged.
// Re-runs the timeline plan using the fresh weight against the stored target
// date, and updates goalCalories in the saved profile so the daily target
// stays honest as the user progresses.
function recomputeGoalCaloriesFromLatestWeight(newWeightKg) {
  const p = loadFoodProfile();
  if (!p || !newWeightKg) return;
  if (!p.targetWeightKg || !p.targetDate) return;
  // Recompute maintenance with the new weight so BMR is honest too.
  const bmr = p.gender === "female"
    ? 10 * newWeightKg + 6.25 * p.heightCm - 5 * p.age - 161
    : 10 * newWeightKg + 6.25 * p.heightCm - 5 * p.age + 5;
  const maintenanceCalories = Math.round(bmr * parseFloat(p.activity));
  const plan = computeTimelinePlan(newWeightKg, p.targetWeightKg, p.targetDate, maintenanceCalories);
  if (!plan || !plan.safe) return;
  p.weightKg = newWeightKg;
  p.maintenanceCalories = maintenanceCalories;
  p.goalCalories = plan.goalCalories;
  p.lastAutoRecalcAt = new Date().toISOString();
  saveFoodProfile(p);
}

document.getElementById("fpSaveBtn").addEventListener("click", () => {
  const base = JSON.parse(document.getElementById("fpGoalsPanel").dataset.profile || "{}");
  const style = DIET_STYLES[selectedDietStyle];
  const profile = { ...base, dietStyle: selectedDietStyle, selectedRate: selectedRateKey };

  if (style.type === "ratio" || style.type === "timing") {
    const calories = parseFloat(document.getElementById("fpGoalCal").value);
    const grams = macrosFromRatio(calories, currentMacroPct.protein, currentMacroPct.carb, currentMacroPct.fat);
    profile.goalCalories = calories;
    profile.macroPct = { ...currentMacroPct };
    profile.goalProtein = grams.goalProtein;
    profile.goalCarb = grams.goalCarb;
    profile.goalFat = grams.goalFat;
    if (style.type === "timing") {
      const selectedPreset = document.querySelector(".window-preset-btn.selected");
      const hours = selectedPreset && selectedPreset.dataset.hours !== "" ? parseFloat(selectedPreset.dataset.hours) : parseFloat(document.getElementById("windowHours").value);
      profile.windowHours = hours || style.defaultWindow;
      profile.windowStart = document.getElementById("windowStartTime").value || "12:00";
    }
  } else if (style.type === "cycling" || style.type === "zigzag") {
    profile.goalCalories = parseFloat(document.getElementById("fpGoalCal").value);
  } else if (style.type === "hyperbolicFasting") {
    profile.hfSchedule = document.querySelector('input[name="hfSchedule"]:checked').value;
    profile.goalCalories = null; // computed daily from the protocol
  } else if (style.type === "hyperbolicDiet") {
    profile.hdVariant = document.getElementById("hdVariant").value;
    profile.hdAnchorDate = profile.hdAnchorDate || todayISO();
    profile.goalCalories = null; // computed daily from the rotation
  }

  saveFoodProfile(profile);
  if (typeof setBodyDiagramGender === "function") setBodyDiagramGender(profile.gender);
  showToast("Nutrition profile saved");
  foodSyncPush("Update nutrition profile");
  renderFoodTab();
});

document.getElementById("foodEditGoalsBtn").addEventListener("click", () => {
  const p = loadFoodProfile();
  document.getElementById("foodSetup").style.display = "block";
  document.getElementById("foodDaily").style.display = "none";
  document.getElementById("fpAge").value = p.age;
  document.getElementById("fpGender").value = p.gender;
  document.getElementById("fpHeight").value = p.heightCm;
  document.getElementById("fpWeight").value = p.weightKg;
  document.getElementById("fpActivity").value = p.activity;
  if (p.targetWeightKg) document.getElementById("fpTargetWeight").value = p.targetWeightKg;
  if (p.targetDate) document.getElementById("fpTargetDate").value = p.targetDate;

  document.getElementById("bmiGaugePanel").style.display = "block";
  drawBMIGauge(document.getElementById("bmiGaugeCanvas"), p.bmi);
  document.getElementById("bmiGaugeValue").innerHTML = `BMI = ${p.bmi} <span class="bmi-cat">${p.bmiCategory}</span>`;

  document.getElementById("rateOptionsPanel").style.display = "block";
  selectedRateKey = p.selectedRate || "maintain";
  renderRateOptions(p.maintenanceCalories, p.weightKg);
  if (p.goalCalories) document.getElementById("fpGoalCal").value = p.goalCalories;

  setupProfileBase = p;
  document.getElementById("fpGoalsPanel").dataset.profile = JSON.stringify(p);

  document.getElementById("dietStylePanel").style.display = "block";
  selectedDietStyle = p.dietStyle || "balanced";
  if (p.macroPct) currentMacroPct = { ...p.macroPct };
  renderDietStyleGrid();
  applyDietStyleSelection();
  if (p.windowHours) {
    document.getElementById("windowStartTime").value = p.windowStart || "12:00";
    document.getElementById("windowHours").value = p.windowHours;
  }
  if (p.hfSchedule === "buildMuscle") document.getElementById("hfScheduleBuild").checked = true;
  if (p.hdVariant) document.getElementById("hdVariant").value = p.hdVariant;
  document.getElementById("fpSaveBtn").style.display = "block";
});

// ---------- MAIN FOOD TAB RENDER ----------
function isProfileComplete(profile) {
  if (!profile || !profile.dietStyle || !profile.heightCm || !profile.weightKg) return false;
  const style = DIET_STYLES[profile.dietStyle];
  if (style && (style.type === "hyperbolicFasting" || style.type === "hyperbolicDiet")) return true;
  return !!profile.goalCalories;
}

function renderFoodTab() {
  const profile = loadFoodProfile();
  if (!isProfileComplete(profile)) {
    document.getElementById("foodSetup").style.display = "block";
    document.getElementById("foodDaily").style.display = "none";
    return;
  }
  document.getElementById("foodSetup").style.display = "none";
  document.getElementById("foodDaily").style.display = "block";
  renderFoodDaily();
}

document.getElementById("foodPrevDay").addEventListener("click", () => {
  currentFoodDate = addDays(parseISO(currentFoodDate), -1).toISOString().slice(0, 10);
  renderFoodDaily();
});
document.getElementById("foodNextDay").addEventListener("click", () => {
  currentFoodDate = addDays(parseISO(currentFoodDate), 1).toISOString().slice(0, 10);
  renderFoodDaily();
});

function logsForDate(date) { return foodLogs.filter(l => l.date === date); }

// Compute today's effective calorie + macro targets given the selected diet style.
// Automatic auto-adjuster deltas (from body-comp trend + food-log compliance)
// are added on top of the profile's baseline values so the surfaced targets
// silently reflect the tuning.
function todaysGoals(profile) {
  const style = DIET_STYLES[profile.dietStyle] || DIET_STYLES.balanced;
  let goalCalories = profile.goalCalories;
  let goalProtein = profile.goalProtein;
  let goalCarb = profile.goalCarb;
  let goalFat = profile.goalFat;
  let statusHtml = "";

  if (style.type === "cycling") {
    const m = carbCyclingMacrosForToday(profile.goalCalories);
    goalProtein = m.goalProtein; goalCarb = m.goalCarb; goalFat = m.goalFat;
    statusHtml = `<div class="fasting-status-banner open">${m.dayLabel} — P${goalProtein}g / C${goalCarb}g / F${goalFat}g</div>`;
  } else if (style.type === "zigzag") {
    const z = zigzagCaloriesForToday(profile.maintenanceCalories, profile.goalCalories);
    goalCalories = z.todayCal;
    const m = macrosFromRatio(goalCalories, 25, 45, 30);
    goalProtein = m.goalProtein; goalCarb = m.goalCarb; goalFat = m.goalFat;
    statusHtml = `<div class="fasting-status-banner open">${z.dayLabel} — ${goalCalories} kcal today</div>`;
  } else if (style.type === "timing") {
    const status = eatingWindowStatus(profile.windowStart || "12:00", profile.windowHours || 8);
    statusHtml = `<div class="fasting-status-banner ${status.open ? "open" : "closed"}">${status.label}</div>`;
  } else if (style.type === "hyperbolicFasting") {
    const isFastingDay = isHyperbolicFastingDayToday(profile.hfSchedule);
    const plan = hyperbolicFastingMealPlan(profile.heightCm, isFastingDay);
    goalCalories = null;
    statusHtml = `<div class="fasting-status-banner ${isFastingDay ? "closed" : "open"}">${plan.dayType}</div>` +
      plan.meals.map(m => `<div class="hyperbolic-meal-card"><div class="hyperbolic-meal-name">${m.name}</div><div class="hyperbolic-meal-detail">${m.detail}</div></div>`).join("") +
      `<div class="hyperbolic-meal-card"><div class="hyperbolic-meal-name">Post-Workout</div><div class="hyperbolic-meal-detail">${plan.postWorkout}</div></div>` +
      (plan.rule ? `<div class="bento-sub" style="margin-top:8px;">${plan.rule}</div>` : "");
    goalProtein = null; goalCarb = null; goalFat = null;
  } else if (style.type === "hyperbolicDiet") {
    if (!profile.hdAnchorDate) profile.hdAnchorDate = todayISO();
    const rotIdx = hyperbolicDietRotationIndex(profile.hdAnchorDate);
    goalCalories = hyperbolicDietDayCalories(profile.maintenanceCalories, profile.hdVariant, rotIdx);
    const split = hyperbolicDietMealSplit(goalCalories, profile.heightCm);
    statusHtml = `<div class="fasting-status-banner open">Rotation day ${rotIdx + 1} of 5 — ${goalCalories} kcal today</div>` +
      `<div class="hyperbolic-meal-card"><div class="hyperbolic-meal-name">Meal 1</div><div class="hyperbolic-meal-detail">${split.meal1.proteinG}g protein — ${split.meal1.note}</div></div>` +
      `<div class="hyperbolic-meal-card"><div class="hyperbolic-meal-name">Post-Workout</div><div class="hyperbolic-meal-detail">${split.postWorkout.proteinG}g protein — ${split.postWorkout.note}</div></div>` +
      `<div class="hyperbolic-meal-card"><div class="hyperbolic-meal-name">Dinner</div><div class="hyperbolic-meal-detail">${split.dinner.proteinG}g protein — ${split.dinner.note}</div></div>` +
      `<div class="bento-sub" style="margin-top:8px;">${split.rest}</div>`;
    goalProtein = null; goalCarb = null; goalFat = null;
  }

  // Apply diet-adjuster cumulative deltas on top of baseline. Skip protocols
  // whose calories are computed dynamically and don't have a static target
  // (hyperbolic fasting/diet null out goalCalories on purpose).
  let adjustmentDelta = { calorieDelta: 0, proteinDelta: 0, count: 0 };
  if (typeof cumulativeDietDeltas === "function") {
    adjustmentDelta = cumulativeDietDeltas();
    if (typeof goalCalories === "number") {
      goalCalories = Math.max(1000, goalCalories + adjustmentDelta.calorieDelta);
    }
    if (typeof goalProtein === "number") {
      goalProtein = Math.max(30, goalProtein + adjustmentDelta.proteinDelta);
    }
  }

  return { goalCalories, goalProtein, goalCarb, goalFat, statusHtml, adjustmentDelta };
}

function renderFoodDaily() {
  const profile = loadFoodProfile();
  const dateLabel = document.getElementById("foodDateLabel");
  dateLabel.textContent = currentFoodDate === todayISO() ? "Today" : formatDate(currentFoodDate);

  const dayLogs = logsForDate(currentFoodDate);
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, micros: emptyMicros() };
  dayLogs.forEach(l => {
    totals.calories += l.calories || 0;
    totals.protein += l.protein || 0;
    totals.carbs += l.carbs || 0;
    totals.fat += l.fat || 0;
    if (l.micros) Object.keys(l.micros).forEach(k => { totals.micros[k] = (totals.micros[k] || 0) + (l.micros[k] || 0); });
  });

  const goals = todaysGoals(profile);
  document.getElementById("dietStatusPanel").innerHTML = goals.statusHtml;

  // Silent auto-adjustment chip
  const chip = document.getElementById("autoAdjustChip");
  if (chip) {
    const d = goals.adjustmentDelta || { calorieDelta: 0, proteinDelta: 0, count: 0 };
    if ((d.calorieDelta || d.proteinDelta) && d.count > 0) {
      const parts = [];
      if (d.calorieDelta) parts.push((d.calorieDelta > 0 ? "+" : "") + d.calorieDelta + " kcal");
      if (d.proteinDelta) parts.push((d.proteinDelta > 0 ? "+" : "") + d.proteinDelta + "g P");
      chip.textContent = "Auto: " + parts.join(" · ");
      chip.style.display = "inline-block";
      chip.onclick = () => {
        if (typeof loadDietAdjustments !== "function") return;
        const list = loadDietAdjustments();
        if (list.length === 0) return;
        const last = list[list.length - 1];
        if (typeof showToast === "function") showToast(last.reason || "Auto adjustment applied");
      };
    } else {
      chip.style.display = "none";
    }
  }

  drawCalorieDial(totals.calories, goals.goalCalories || profile.maintenanceCalories || 2000);

  const bmiInfo = calcBMI(profile.weightKg, profile.heightCm);
  drawBMIGauge(document.getElementById("bmiGaugeDaily"), bmiInfo.bmi);
  document.getElementById("bmiGaugeValueDaily").innerHTML = `BMI = ${bmiInfo.bmi} <span class="bmi-cat">${bmiInfo.category}</span>`;

  document.getElementById("goalLabelDaily").textContent = "Diet style";
  document.getElementById("goalValueDaily").textContent = (DIET_STYLES[profile.dietStyle] || DIET_STYLES.balanced).label;
  document.getElementById("goalSubDaily").textContent = goals.goalCalories ? `${goals.goalCalories} kcal today` : "See breakdown below";

  if (goals.goalProtein != null) {
    document.getElementById("proteinRing").parentElement.style.display = "block";
    drawMacroRing("proteinRing", totals.protein, goals.goalProtein, "#FF6B4A");
    drawMacroRing("carbRing", totals.carbs, goals.goalCarb, "#4A9EFF");
    drawMacroRing("fatRing", totals.fat, goals.goalFat, "#FFC94A");
    document.getElementById("proteinRingValue").textContent = `${Math.round(totals.protein)}/${goals.goalProtein}g`;
    document.getElementById("carbRingValue").textContent = `${Math.round(totals.carbs)}/${goals.goalCarb}g`;
    document.getElementById("fatRingValue").textContent = `${Math.round(totals.fat)}/${goals.goalFat}g`;
  } else {
    // Hyperbolic protocols: macros come from the meal-by-meal breakdown, not a fixed ring
    document.getElementById("proteinRingValue").textContent = `${Math.round(totals.protein)}g logged`;
    document.getElementById("carbRingValue").textContent = `${Math.round(totals.carbs)}g logged`;
    document.getElementById("fatRingValue").textContent = `${Math.round(totals.fat)}g logged`;
  }

  renderMealSections(dayLogs);
  renderPillChecklist(currentFoodDate);
  renderMicroPanel(totals.micros, profile);
}

function drawCalorieDial(consumed, goal) {
  const canvas = document.getElementById("calorieDial");
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2, r = w / 2 - 10;
  const pct = Math.min(1, consumed / (goal || 1));
  ctx.lineWidth = 12;
  ctx.strokeStyle = "#2e2e2e";
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#FFC94A"); grad.addColorStop(1, "#FF6B4A");
  ctx.strokeStyle = grad;
  ctx.lineCap = "round";
  ctx.shadowColor = "#FFC94A"; ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;

  const left = Math.max(0, Math.round(goal - consumed));
  document.getElementById("calorieLeftNum").textContent = left;
}

function drawMacroRing(canvasId, consumed, goal, color) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2, r = w / 2 - 6;
  const pct = Math.min(1, consumed / (goal || 1));
  ctx.lineWidth = 7;
  ctx.strokeStyle = "#2e2e2e";
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.shadowColor = color; ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];

// ---------- PILL / MEDICATION CHECKLIST ----------
const PILLS_LIST_KEY = "ironlog_pills_list_v1";
const PILLS_LOG_KEY = "ironlog_pills_log_v1";
function loadPillsList() { try { return JSON.parse(localStorage.getItem(PILLS_LIST_KEY)) || []; } catch { return []; } }
function savePillsList(list) { localStorage.setItem(PILLS_LIST_KEY, JSON.stringify(list)); }
function loadPillsLog() { try { return JSON.parse(localStorage.getItem(PILLS_LOG_KEY)) || {}; } catch { return {}; } }
function savePillsLog(log) { localStorage.setItem(PILLS_LOG_KEY, JSON.stringify(log)); }

function renderPillChecklist(dateStr) {
  let container = document.getElementById("pillChecklist");
  if (!container) return;
  const pills = loadPillsList();
  if (pills.length === 0) {
    container.innerHTML = `<div class="pill-section">
      <div class="meal-section-head">
        <span class="meal-section-title">💊 Medications</span>
        <button class="meal-add-btn" id="pillSetupBtn">+</button>
      </div>
      <div class="chart-empty-note" style="padding:8px 0;">No pills set up yet. Tap + to add your medications.</div>
    </div>`;
    document.getElementById("pillSetupBtn").addEventListener("click", openPillSetup);
    return;
  }

  const log = loadPillsLog();
  const dayLog = log[dateStr] || {};
  container.innerHTML = `<div class="pill-section">
    <div class="meal-section-head">
      <span class="meal-section-title">💊 Medications</span>
      <button class="meal-add-btn" id="pillSetupBtn" style="font-size:0.7rem;">✎</button>
    </div>
    ${pills.map((p, i) => {
      const checked = dayLog[p.name] ? "checked" : "";
      return `<label class="pill-row">
        <input type="checkbox" class="pill-check" data-pill="${p.name}" ${checked}>
        <span class="pill-name">${p.name}</span>
        ${p.dose ? `<span class="pill-dose">${p.dose}</span>` : ""}
      </label>`;
    }).join("")}
  </div>`;

  container.querySelectorAll(".pill-check").forEach(cb => {
    cb.addEventListener("change", () => {
      const log = loadPillsLog();
      if (!log[dateStr]) log[dateStr] = {};
      if (cb.checked) log[dateStr][cb.dataset.pill] = true;
      else delete log[dateStr][cb.dataset.pill];
      savePillsLog(log);
    });
  });
  document.getElementById("pillSetupBtn").addEventListener("click", openPillSetup);
}

function openPillSetup() {
  const pills = loadPillsList();
  const html = `
    <div class="modal-title">Manage Medications</div>
    <div id="pillSetupList">
      ${pills.map((p, i) => `
        <div class="pill-setup-row" style="display:flex;gap:6px;margin:4px 0;align-items:center;">
          <input type="text" value="${p.name}" class="pill-setup-name" style="flex:1;background:var(--bg-raised);border:1px solid var(--line);color:var(--chalk);border-radius:6px;padding:6px;">
          <input type="text" value="${p.dose || ""}" placeholder="dose" class="pill-setup-dose" style="width:80px;background:var(--bg-raised);border:1px solid var(--line);color:var(--chalk);border-radius:6px;padding:6px;">
          <button class="pill-del-btn" data-i="${i}" style="background:none;border:none;color:var(--chalk-dim);cursor:pointer;font-size:1.1rem;">✕</button>
        </div>
      `).join("")}
    </div>
    <button id="pillSetupAddRow" style="background:none;border:1px dashed var(--line);color:var(--chalk-dim);padding:6px;border-radius:6px;width:100%;margin-top:6px;cursor:pointer;font-size:0.82rem;">+ Add medication</button>
    <button class="save-btn" id="pillSetupSave" style="margin-top:10px;">Save</button>
  `;
  // Reuse generic overlay pattern
  let overlay = document.getElementById("pillSetupOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "pillSetupOverlay";
    overlay.className = "modal-overlay";
    overlay.innerHTML = `<div class="modal-sheet"><div class="modal-body" id="pillSetupBody"></div></div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.classList.remove("open"); });
  }
  document.getElementById("pillSetupBody").innerHTML = html;
  overlay.classList.add("open");

  document.getElementById("pillSetupAddRow").addEventListener("click", () => {
    const row = document.createElement("div");
    row.className = "pill-setup-row";
    row.style.cssText = "display:flex;gap:6px;margin:4px 0;align-items:center;";
    row.innerHTML = `
      <input type="text" placeholder="Pill name" class="pill-setup-name" style="flex:1;background:var(--bg-raised);border:1px solid var(--line);color:var(--chalk);border-radius:6px;padding:6px;">
      <input type="text" placeholder="dose" class="pill-setup-dose" style="width:80px;background:var(--bg-raised);border:1px solid var(--line);color:var(--chalk);border-radius:6px;padding:6px;">
      <button class="pill-del-btn" style="background:none;border:none;color:var(--chalk-dim);cursor:pointer;font-size:1.1rem;">✕</button>`;
    document.getElementById("pillSetupList").appendChild(row);
    row.querySelector(".pill-del-btn").addEventListener("click", () => row.remove());
  });

  document.querySelectorAll(".pill-del-btn").forEach(btn => {
    btn.addEventListener("click", () => btn.closest(".pill-setup-row").remove());
  });

  document.getElementById("pillSetupSave").addEventListener("click", () => {
    const names = document.querySelectorAll(".pill-setup-name");
    const doses = document.querySelectorAll(".pill-setup-dose");
    const newList = [];
    names.forEach((input, i) => {
      const name = input.value.trim();
      if (name) newList.push({ name, dose: doses[i] ? doses[i].value.trim() : "" });
    });
    savePillsList(newList);
    overlay.classList.remove("open");
    renderPillChecklist(currentFoodDate);
  });
}

function renderMealSections(dayLogs) {
  const container = document.getElementById("mealSections");
  container.innerHTML = "";
  MEAL_TYPES.forEach(meal => {
    const items = dayLogs.filter(l => l.mealType === meal);
    const kcal = items.reduce((s, i) => s + (i.calories || 0), 0);
    const section = document.createElement("div");
    section.className = "meal-section";
    section.innerHTML = `
      <div class="meal-section-head">
        <span class="meal-section-title">${meal}</span>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="meal-section-kcal">${Math.round(kcal)} kcal</span>
          <button class="meal-add-btn" data-meal="${meal}">+</button>
        </div>
      </div>
      ${items.map(item => `
        <div class="food-item-row">
          <div>
            <div class="food-item-name">${item.name}</div>
            <div class="food-item-macro">${item.grams}g · P${Math.round(item.protein)} C${Math.round(item.carbs)} F${Math.round(item.fat)}</div>
          </div>
          <div style="display:flex;align-items:center;">
            <span class="food-item-kcal">${Math.round(item.calories)}</span>
            <button class="food-item-del" data-id="${item.id}">✕</button>
          </div>
        </div>
      `).join("")}
    `;
    container.appendChild(section);
  });

  container.querySelectorAll(".meal-add-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      activeAddMealType = btn.dataset.meal;
      document.getElementById("foodModalMealLabel").textContent = activeAddMealType;
      document.getElementById("foodSearchInput").value = "";
      document.getElementById("foodSearchResults").innerHTML = "";
      openModal("foodModalOverlay");
      renderRecentFoods();
    });
  });
  container.querySelectorAll(".food-item-del").forEach(btn => {
    btn.addEventListener("click", () => {
      foodLogs = foodLogs.filter(l => l.id !== btn.dataset.id);
      saveFoodLogs(foodLogs);
      renderFoodDaily();
      foodSyncPush("Delete food entry");
    });
  });
}

const RARE_MICROS = new Set(["iodine", "chromium", "molybdenum"]);

function _microRowHtml(key, info, consumedMicros, profile) {
  const rda = micronutrientRDA(key, profile);
  const consumed = consumedMicros[key] || 0;
  const pctRaw = rda > 0 ? (consumed / rda) * 100 : 0;
  const pct = Math.min(100, Math.round(pctRaw));
  const met = pctRaw >= 100;
  const color = met ? "#00D2D3" : pctRaw >= 50 ? "#FFC94A" : "#FF6B4A";
  return `
    <div class="micro-row ${met ? 'micro-row-met' : ''}">
      <div class="micro-row-top">
        <span class="micro-name">${met ? '✓ ' : ''}${info.name}</span>
        <span class="micro-amount">${consumed.toFixed(1)} / ${rda}${info.unit}</span>
      </div>
      <div class="micro-bar-track"><div class="micro-bar-fill" style="width:${pct}%; background:${color};"></div></div>
    </div>`;
}

function renderMicroPanel(consumedMicros, profile) {
  const panel = document.getElementById("microPanel");
  const commonRows = [];
  const rareRows = [];
  // Custom nutrients (no RDA)
  const customNutrients = JSON.parse(localStorage.getItem("ironlog_custom_nutrients_v1") || "[]");

  Object.entries(MICRO_RDA).forEach(([key, info]) => {
    const html = _microRowHtml(key, info, consumedMicros, profile);
    if (RARE_MICROS.has(key)) rareRows.push(html);
    else commonRows.push(html);
  });

  // Custom nutrients — always cyan full bar when consumed > 0
  customNutrients.forEach(cn => {
    const consumed = consumedMicros[cn.key] || 0;
    const hasSome = consumed > 0;
    const color = "#00D2D3";
    commonRows.push(`
      <div class="micro-row ${hasSome ? 'micro-row-met' : ''}">
        <div class="micro-row-top">
          <span class="micro-name">${hasSome ? '✓ ' : ''}${cn.name}</span>
          <span class="micro-amount">${consumed.toFixed(1)}${cn.unit}</span>
        </div>
        <div class="micro-bar-track"><div class="micro-bar-fill" style="width:${hasSome ? 100 : 0}%; background:${hasSome ? color : 'transparent'};"></div></div>
      </div>`);
  });

  const rareToggle = rareRows.length > 0 ? `
    <button class="micro-rare-toggle" onclick="this.nextElementSibling.classList.toggle('hidden');this.textContent=this.textContent.includes('Show')?'Hide uncommon':'Show uncommon (${rareRows.length})'">Show uncommon (${rareRows.length})</button>
    <div class="micro-rare-section hidden">${rareRows.join("")}</div>` : "";

  panel.innerHTML = commonRows.join("") + rareToggle;
}

// ---------- RECENTLY USED FOODS ----------
function getRecentFoods(limit = 10) {
  const seen = new Set();
  const recent = [];
  // Walk food logs newest-first, deduplicate by name
  const sorted = foodLogs.slice().sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return (b.id || "").localeCompare(a.id || "");
  });
  for (const entry of sorted) {
    const key = (entry.name || "").toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    recent.push(entry);
    if (recent.length >= limit) break;
  }
  return recent;
}

function renderRecentFoods(filterText) {
  const container = document.getElementById("recentFoodsSection");
  if (!container) return;
  let recents = getRecentFoods(15);
  if (filterText) {
    const q = filterText.toLowerCase();
    recents = recents.filter(r => (r.name || "").toLowerCase().includes(q));
  }
  if (recents.length === 0) {
    container.innerHTML = filterText ? "" : "";
    container.style.display = "none";
    return;
  }
  container.style.display = "block";
  container.innerHTML = `<div class="recent-foods-label">${filterText ? "Matching recent" : "Recently used"}</div>` +
    recents.map((r, i) => `
      <div class="recent-food-card" data-recent-idx="${i}">
        <div class="recent-food-name">${escapeHtml(r.name)}</div>
        <div class="recent-food-meta">${r.grams || "—"}g · ${Math.round(r.calories || 0)} kcal · ${Math.round(r.protein || 0)}g protein</div>
      </div>`).join("");
  container.querySelectorAll(".recent-food-card").forEach(card => {
    card.addEventListener("click", () => {
      const entry = recents[parseInt(card.dataset.recentIdx)];
      addFoodEntry({
        name: entry.name,
        grams: entry.grams,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        micros: entry.micros || emptyMicros(),
        source: entry.source || "recent",
      });
    });
  });
}

// ---------- ADD FOOD MODAL ----------
document.getElementById("foodModalClose").addEventListener("click", () => closeModal("foodModalOverlay"));
document.getElementById("foodModalOverlay").addEventListener("click", (e) => {
  if (e.target.id === "foodModalOverlay") closeModal("foodModalOverlay");
});

document.querySelectorAll(".food-mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".food-mode-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".food-mode-panel").forEach(p => p.classList.remove("active"));
    document.getElementById("mode-" + btn.dataset.mode).classList.add("active");
    if (btn.dataset.mode === "myfoods") renderMyFoodsList();
    if (btn.dataset.mode === "search") renderRecentFoods();
  });
});

// Show recent foods when search input changes
document.getElementById("foodSearchInput").addEventListener("input", (e) => {
  const val = e.target.value.trim();
  renderRecentFoods(val);
});

function addFoodEntry(entry) {
  const full = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    date: currentFoodDate,
    mealType: activeAddMealType,
    ...entry,
  };
  foodLogs.push(full);
  saveFoodLogs(foodLogs);
  renderFoodDaily();
  foodSyncPush(`Add ${entry.name} to ${activeAddMealType}`);
  closeModal("foodModalOverlay");
  showToast(`Added ${entry.name}`);
}

// --- USDA search ---
function extractUsdaMicros(foodNutrients) {
  const micros = emptyMicros();
  let calories = 0, protein = 0, carbs = 0, fat = 0;
  (foodNutrients || []).forEach(n => {
    const name = n.nutrientName || n.name || "";
    const value = n.value ?? n.amount ?? 0;
    const unit = (n.unitName || n.unit || "").toLowerCase();
    if (/^energy$/i.test(name)) { calories = value; return; }
    if (/^protein$/i.test(name)) { protein = value; return; }
    if (/carbohydrate/i.test(name)) { carbs = value; return; }
    if (/total lipid|fat/i.test(name) && !/fatty/i.test(name)) { fat = value; return; }
    const match = USDA_NUTRIENT_MAP.find(([sub]) => name.toLowerCase().includes(sub.toLowerCase()));
    if (match) {
      const [, key, targetUnit] = match;
      let v = value;
      if (unit === "mg" && targetUnit === "mcg") v = v * 1000;
      if (unit === "µg" || unit === "mcg") { if (targetUnit === "mg") v = v / 1000; }
      if (unit === "g" && (targetUnit === "mg")) v = v * 1000;
      micros[key] = v;
    }
  });
  return { calories, protein, carbs, fat, micros };
}

document.getElementById("foodSearchBtn").addEventListener("click", async () => {
  const query = document.getElementById("foodSearchInput").value.trim();
  const results = document.getElementById("foodSearchResults");
  if (!query) return;
  results.innerHTML = `<div class="chart-empty-note">Searching…</div>`;

  // Search IFCT first (local, instant)
  const ifctResults = searchIFCT(query, 10);
  let html = "";
  if (ifctResults.length) {
    html += ifctResults.map((f, i) => `
      <div class="food-result-item" data-ifct="${i}">
        <div>
          <div class="food-result-name">${f.n}</div>
          <div class="food-result-sub">per 100g · <span style="color:#FF9F43">IFCT</span>${f.g ? " · " + f.g : ""}</div>
        </div>
        <input type="number" value="100" style="width:56px;background:var(--bg-raised);border:1px solid var(--line);color:var(--chalk);border-radius:6px;padding:6px;text-align:center;" id="ifct-grams-${i}">
        <button class="food-result-add" data-ifct-idx="${i}">+</button>
      </div>
    `).join("");
  }

  // Show IFCT results immediately, then fetch USDA
  if (html) results.innerHTML = html;
  _wireIfctButtons(results, ifctResults);

  try {
    const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=10&api_key=DEMO_KEY`);
    if (res.ok) {
      const data = await res.json();
      if (data.foods && data.foods.length) {
        html += data.foods.map((f, i) => `
          <div class="food-result-item">
            <div>
              <div class="food-result-name">${f.description}</div>
              <div class="food-result-sub">per 100g · <span style="color:#54A0FF">USDA</span>${f.brandOwner ? " · " + f.brandOwner : ""}</div>
            </div>
            <input type="number" value="100" style="width:56px;background:var(--bg-raised);border:1px solid var(--line);color:var(--chalk);border-radius:6px;padding:6px;text-align:center;" id="usda-grams-${i}">
            <button class="food-result-add" data-idx="${i}">+</button>
          </div>
        `).join("");
        results.innerHTML = html || `<div class="chart-empty-note">No results. Try Manual entry instead.</div>`;
        _wireIfctButtons(results, ifctResults);
        results.querySelectorAll("[data-idx]").forEach(btn => {
          btn.addEventListener("click", () => {
            const food = data.foods[btn.dataset.idx];
            const grams = parseFloat(document.getElementById(`usda-grams-${btn.dataset.idx}`).value) || 100;
            const per100 = extractUsdaMicros(food.foodNutrients);
            const scale = grams / 100;
            const micros = {};
            Object.keys(per100.micros).forEach(k => micros[k] = per100.micros[k] * scale);
            addFoodEntry({
              name: food.description, grams,
              calories: per100.calories * scale, protein: per100.protein * scale,
              carbs: per100.carbs * scale, fat: per100.fat * scale,
              micros, source: "usda",
            });
          });
        });
      }
    }
  } catch (e) {
    if (!ifctResults.length) {
      results.innerHTML = `<div class="chart-empty-note">Couldn't reach USDA database. Check your connection or try Manual entry.</div>`;
    }
  }
  if (!results.innerHTML || results.innerHTML.includes("Searching")) {
    results.innerHTML = `<div class="chart-empty-note">No results. Try Manual entry instead.</div>`;
  }
});

function _wireIfctButtons(container, ifctResults) {
  container.querySelectorAll("[data-ifct-idx]").forEach(btn => {
    btn.addEventListener("click", () => {
      const f = ifctResults[parseInt(btn.dataset.ifctIdx)];
      const grams = parseFloat(document.getElementById(`ifct-grams-${btn.dataset.ifctIdx}`).value) || 100;
      const scale = grams / 100;
      const micros = {};
      if (f.m) Object.keys(f.m).forEach(k => micros[k] = f.m[k] * scale);
      addFoodEntry({
        name: f.n, grams,
        calories: f.cal * scale, protein: f.p * scale,
        carbs: f.c * scale, fat: f.f * scale,
        micros, source: "ifct",
      });
    });
  });
}

// --- Barcode scan (Open Food Facts) ---
let barcodeStream, barcodeDetectorInterval;

document.getElementById("barcodeStartBtn").addEventListener("click", async () => {
  const statusEl = document.getElementById("barcodeStatus");
  if (!("BarcodeDetector" in window)) {
    statusEl.textContent = "Barcode scanning isn't supported in this browser. Try Search or Manual entry instead.";
    return;
  }
  try {
    const video = document.getElementById("barcodeVideo");
    barcodeStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = barcodeStream;
    video.style.display = "block";
    await video.play();
    const detector = new BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e"] });
    statusEl.textContent = "Point your camera at the barcode…";
    barcodeDetectorInterval = setInterval(async () => {
      try {
        const codes = await detector.detect(video);
        if (codes.length > 0) {
          clearInterval(barcodeDetectorInterval);
          barcodeStream.getTracks().forEach(t => t.stop());
          video.style.display = "none";
          statusEl.textContent = "Found a code — looking it up…";
          await lookupBarcode(codes[0].rawValue);
        }
      } catch (e) { /* keep trying */ }
    }, 400);
  } catch (e) {
    statusEl.textContent = "Camera access denied or unavailable. Try Search or Manual entry instead.";
  }
});

async function lookupBarcode(code) {
  const statusEl = document.getElementById("barcodeStatus");
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
    const data = await res.json();
    if (data.status !== 1) {
      statusEl.innerHTML = `Barcode ${code} not found in Open Food Facts. Try Manual entry.`;
      return;
    }
    const p = data.product;
    const n = p.nutriments || {};
    statusEl.innerHTML = `
      <div class="food-result-item">
        <div>
          <div class="food-result-name">${p.product_name || "Unknown product"}</div>
          <div class="food-result-sub">per 100g</div>
        </div>
        <input type="number" value="100" id="barcode-grams" style="width:56px;background:var(--bg-raised);border:1px solid var(--line);color:var(--chalk);border-radius:6px;padding:6px;text-align:center;">
        <button class="food-result-add" id="barcode-add-btn">+</button>
      </div>`;
    document.getElementById("barcode-add-btn").addEventListener("click", () => {
      const grams = parseFloat(document.getElementById("barcode-grams").value) || 100;
      const scale = grams / 100;
      const micros = emptyMicros();
      if (n["vitamin-c_100g"]) micros.vitaminC = n["vitamin-c_100g"] * scale;
      if (n["calcium_100g"]) micros.calcium = n["calcium_100g"] * 1000 * scale;
      if (n["iron_100g"]) micros.iron = n["iron_100g"] * 1000 * scale;
      if (n["potassium_100g"]) micros.potassium = n["potassium_100g"] * 1000 * scale;
      if (n["sodium_100g"]) micros.sodium = n["sodium_100g"] * 1000 * scale;
      addFoodEntry({
        name: p.product_name || "Unknown product", grams,
        calories: (n["energy-kcal_100g"] || 0) * scale,
        protein: (n.proteins_100g || 0) * scale,
        carbs: (n.carbohydrates_100g || 0) * scale,
        fat: (n.fat_100g || 0) * scale,
        micros, source: "openfoodfacts",
      });
    });
  } catch (e) {
    statusEl.textContent = "Couldn't reach Open Food Facts. Check your connection.";
  }
}

// --- Photo label OCR ---
document.getElementById("photoLabelInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const statusEl = document.getElementById("photoOcrStatus");
  const formEl = document.getElementById("photoOcrForm");
  formEl.style.display = "none";
  statusEl.textContent = "Reading label… this can take a few seconds.";
  try {
    const { data: { text } } = await Tesseract.recognize(file, "eng");
    const grab = (re) => { const m = text.match(re); return m ? parseFloat(m[1]) : ""; };
    document.getElementById("ocrCalories").value = grab(/(?:calories|energy)[^\d]*(\d+\.?\d*)/i);
    document.getElementById("ocrProtein").value = grab(/protein[^\d]*(\d+\.?\d*)/i);
    document.getElementById("ocrCarbs").value = grab(/carb(?:ohydrate)?s?[^\d]*(\d+\.?\d*)/i);
    document.getElementById("ocrFat").value = grab(/(?:total )?fat[^\d]*(\d+\.?\d*)/i);
    statusEl.textContent = "Here's what was read — please check and correct before adding.";
    formEl.style.display = "block";
  } catch (e) {
    statusEl.textContent = "Couldn't read the label automatically. Enter the values manually below.";
    formEl.style.display = "block";
  }
});

document.getElementById("ocrAddBtn").addEventListener("click", () => {
  const baseGrams = parseFloat(document.getElementById("ocrBaseGrams").value) || 100;
  const gramsEaten = parseFloat(document.getElementById("ocrGramsEaten").value) || 100;
  const scale = gramsEaten / baseGrams;
  addFoodEntry({
    name: "Scanned label item", grams: gramsEaten,
    calories: (parseFloat(document.getElementById("ocrCalories").value) || 0) * scale,
    protein: (parseFloat(document.getElementById("ocrProtein").value) || 0) * scale,
    carbs: (parseFloat(document.getElementById("ocrCarbs").value) || 0) * scale,
    fat: (parseFloat(document.getElementById("ocrFat").value) || 0) * scale,
    micros: emptyMicros(), source: "ocr",
  });
});

// --- Supplement OCR ---
const SUPP_MICRO_PATTERNS = [
  { key: "vitaminA", name: "Vitamin A", unit: "mcg", re: /vitamin\s*a[^\d]*(\d+[\.,]?\d*)\s*(mcg|µg|ug|mg|iu)/i, iuFactor: 0.3 },
  { key: "vitaminD", name: "Vitamin D", unit: "mcg", re: /vitamin\s*d\d?[^\d]*(\d+[\.,]?\d*)\s*(mcg|µg|ug|mg|iu)/i, iuFactor: 0.025 },
  { key: "vitaminE", name: "Vitamin E", unit: "mg", re: /vitamin\s*e[^\d]*(\d+[\.,]?\d*)\s*(mg|mcg|iu)/i, iuFactor: 0.67 },
  { key: "vitaminK", name: "Vitamin K", unit: "mcg", re: /vitamin\s*k\d?[^\d]*(\d+[\.,]?\d*)\s*(mcg|µg|ug|mg)/i },
  { key: "vitaminC", name: "Vitamin C", unit: "mg", re: /vitamin\s*c[^\d]*(\d+[\.,]?\d*)\s*(mg|g)/i },
  { key: "thiamin", name: "Thiamin (B1)", unit: "mg", re: /thiamin[e]?[^\d]*(\d+[\.,]?\d*)\s*(mg|mcg)/i },
  { key: "riboflavin", name: "Riboflavin (B2)", unit: "mg", re: /riboflavin[^\d]*(\d+[\.,]?\d*)\s*(mg|mcg)/i },
  { key: "niacin", name: "Niacin (B3)", unit: "mg", re: /niacin[^\d]*(\d+[\.,]?\d*)\s*(mg|mcg)/i },
  { key: "pantothenic", name: "Pantothenic Acid (B5)", unit: "mg", re: /pantothenic[^\d]*(\d+[\.,]?\d*)\s*(mg|mcg)/i },
  { key: "vitaminB6", name: "Vitamin B6", unit: "mg", re: /vitamin\s*b\s*6[^\d]*(\d+[\.,]?\d*)\s*(mg|mcg)/i },
  { key: "biotin", name: "Biotin (B7)", unit: "mcg", re: /biotin[^\d]*(\d+[\.,]?\d*)\s*(mcg|µg|ug|mg)/i },
  { key: "folate", name: "Folate (B9)", unit: "mcg", re: /fol(?:ate|ic)[^\d]*(\d+[\.,]?\d*)\s*(mcg|µg|ug|mg)/i },
  { key: "vitaminB12", name: "Vitamin B12", unit: "mcg", re: /(?:vitamin\s*b\s*12|cobalamin)[^\d]*(\d+[\.,]?\d*)\s*(mcg|µg|ug|mg)/i },
  { key: "calcium", name: "Calcium", unit: "mg", re: /calcium[^\d]*(\d+[\.,]?\d*)\s*(mg|g)/i },
  { key: "iron", name: "Iron", unit: "mg", re: /iron[^\d]*(\d+[\.,]?\d*)\s*(mg|mcg)/i },
  { key: "magnesium", name: "Magnesium", unit: "mg", re: /magnesium[^\d]*(\d+[\.,]?\d*)\s*(mg|g)/i },
  { key: "zinc", name: "Zinc", unit: "mg", re: /zinc[^\d]*(\d+[\.,]?\d*)\s*(mg|mcg)/i },
  { key: "selenium", name: "Selenium", unit: "mcg", re: /selenium[^\d]*(\d+[\.,]?\d*)\s*(mcg|µg|ug|mg)/i },
  { key: "copper", name: "Copper", unit: "mcg", re: /copper[^\d]*(\d+[\.,]?\d*)\s*(mcg|µg|ug|mg)/i },
  { key: "manganese", name: "Manganese", unit: "mg", re: /manganese[^\d]*(\d+[\.,]?\d*)\s*(mg|mcg)/i },
  { key: "chromium", name: "Chromium", unit: "mcg", re: /chromium[^\d]*(\d+[\.,]?\d*)\s*(mcg|µg|ug|mg)/i },
  { key: "molybdenum", name: "Molybdenum", unit: "mcg", re: /molybdenum[^\d]*(\d+[\.,]?\d*)\s*(mcg|µg|ug|mg)/i },
  { key: "potassium", name: "Potassium", unit: "mg", re: /potassium[^\d]*(\d+[\.,]?\d*)\s*(mg|g)/i },
  { key: "phosphorus", name: "Phosphorus", unit: "mg", re: /phosphorus[^\d]*(\d+[\.,]?\d*)\s*(mg|g)/i },
  { key: "iodine", name: "Iodine", unit: "mcg", re: /iodine[^\d]*(\d+[\.,]?\d*)\s*(mcg|µg|ug|mg)/i },
  { key: "choline", name: "Choline", unit: "mg", re: /choline[^\d]*(\d+[\.,]?\d*)\s*(mg|g)/i },
  { key: "sodium", name: "Sodium", unit: "mg", re: /sodium[^\d]*(\d+[\.,]?\d*)\s*(mg|g)/i },
];

// Extra patterns for nutrients outside the standard 26 (custom nutrients)
const SUPP_EXTRA_PATTERNS = [
  { key: "collagen", name: "Collagen", unit: "mg", re: /collagen[^\d]*(\d+[\.,]?\d*)\s*(mg|g)/i },
  { key: "omega3_epa", name: "Omega-3 EPA", unit: "mg", re: /epa[^\d]*(\d+[\.,]?\d*)\s*(mg|g)/i },
  { key: "omega3_dha", name: "Omega-3 DHA", unit: "mg", re: /dha[^\d]*(\d+[\.,]?\d*)\s*(mg|g)/i },
  { key: "omega3", name: "Omega-3", unit: "mg", re: /omega[\s-]*3[^\d]*(\d+[\.,]?\d*)\s*(mg|g)/i },
  { key: "lutein", name: "Lutein", unit: "mg", re: /lutein[^\d]*(\d+[\.,]?\d*)\s*(mg|mcg)/i },
  { key: "lycopene", name: "Lycopene", unit: "mg", re: /lycopene[^\d]*(\d+[\.,]?\d*)\s*(mg|mcg)/i },
  { key: "coq10", name: "CoQ10", unit: "mg", re: /co\s*q\s*10[^\d]*(\d+[\.,]?\d*)\s*(mg)/i },
  { key: "glucosamine", name: "Glucosamine", unit: "mg", re: /glucosamine[^\d]*(\d+[\.,]?\d*)\s*(mg|g)/i },
  { key: "ashwagandha", name: "Ashwagandha", unit: "mg", re: /ashwagandha[^\d]*(\d+[\.,]?\d*)\s*(mg|g)/i },
  { key: "turmeric_curcumin", name: "Turmeric/Curcumin", unit: "mg", re: /(?:turmeric|curcumin)[^\d]*(\d+[\.,]?\d*)\s*(mg|g)/i },
];

function _parseOcrUnit(valStr, unitStr, targetUnit, iuFactor) {
  let v = parseFloat(valStr.replace(",", ".")) || 0;
  const u = (unitStr || "").toLowerCase().replace("µg", "mcg").replace("ug", "mcg");
  if (u === "iu" && iuFactor) { v *= iuFactor; return v; }
  if (u === "g") v *= 1000; // g → mg
  if (targetUnit === "mg" && u === "mcg") v /= 1000;
  if (targetUnit === "mcg" && u === "mg") v *= 1000;
  return v;
}

function parseSupplementLabel(text) {
  const found = [];
  const allPatterns = [...SUPP_MICRO_PATTERNS, ...SUPP_EXTRA_PATTERNS];
  for (const pat of allPatterns) {
    const m = text.match(pat.re);
    if (m) {
      const val = _parseOcrUnit(m[1], m[2], pat.unit, pat.iuFactor);
      if (val > 0) found.push({ key: pat.key, name: pat.name, unit: pat.unit, value: Math.round(val * 100) / 100 });
    }
  }
  return found;
}

document.getElementById("suppLabelInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const statusEl = document.getElementById("suppOcrStatus");
  const formEl = document.getElementById("suppOcrForm");
  formEl.style.display = "none";
  statusEl.textContent = "Reading supplement label…";
  try {
    const { data: { text } } = await Tesseract.recognize(file, "eng");
    const nutrients = parseSupplementLabel(text);
    const fieldsEl = document.getElementById("suppMicroFields");
    if (nutrients.length === 0) {
      fieldsEl.innerHTML = `<div class="chart-empty-note">No nutrients detected. You can add them manually below.</div>`;
    } else {
      fieldsEl.innerHTML = nutrients.map((n, i) => `
        <div style="display:flex;gap:8px;align-items:center;margin:4px 0;">
          <input type="text" value="${n.name}" id="suppNutrName-${i}" style="flex:1;background:var(--bg-raised);border:1px solid var(--line);color:var(--chalk);border-radius:6px;padding:6px;">
          <input type="number" value="${n.value}" id="suppNutrVal-${i}" style="width:70px;background:var(--bg-raised);border:1px solid var(--line);color:var(--chalk);border-radius:6px;padding:6px;text-align:right;">
          <span style="color:var(--chalk-dim);font-size:0.8rem;width:30px;">${n.unit}</span>
          <input type="hidden" id="suppNutrKey-${i}" value="${n.key}">
          <input type="hidden" id="suppNutrUnit-${i}" value="${n.unit}">
        </div>
      `).join("");
    }
    // Add "add row" button for manual entries
    fieldsEl.innerHTML += `<button type="button" id="suppAddRow" style="background:none;border:1px dashed var(--line);color:var(--chalk-dim);padding:6px;border-radius:6px;width:100%;margin-top:6px;cursor:pointer;font-size:0.82rem;">+ Add nutrient</button>`;
    statusEl.textContent = nutrients.length > 0
      ? `Found ${nutrients.length} nutrient${nutrients.length > 1 ? "s" : ""}. Check values, name it, then add.`
      : "Couldn't detect nutrients automatically. Add them manually.";
    formEl.style.display = "block";

    let rowCount = nutrients.length;
    document.getElementById("suppAddRow").addEventListener("click", () => {
      const row = document.createElement("div");
      row.style.cssText = "display:flex;gap:8px;align-items:center;margin:4px 0;";
      row.innerHTML = `
        <input type="text" placeholder="Name" id="suppNutrName-${rowCount}" style="flex:1;background:var(--bg-raised);border:1px solid var(--line);color:var(--chalk);border-radius:6px;padding:6px;">
        <input type="number" placeholder="0" id="suppNutrVal-${rowCount}" style="width:70px;background:var(--bg-raised);border:1px solid var(--line);color:var(--chalk);border-radius:6px;padding:6px;text-align:right;">
        <span style="color:var(--chalk-dim);font-size:0.8rem;width:30px;">mg</span>
        <input type="hidden" id="suppNutrKey-${rowCount}" value="">
        <input type="hidden" id="suppNutrUnit-${rowCount}" value="mg">`;
      document.getElementById("suppAddRow").before(row);
      rowCount++;
    });
  } catch (err) {
    statusEl.textContent = "Couldn't read the label. Try a clearer photo or add nutrients manually.";
    formEl.style.display = "block";
  }
});

document.getElementById("suppAddBtn").addEventListener("click", () => {
  const name = (document.getElementById("suppName").value || "").trim() || "My Supplement";
  const micros = {};
  const customNutrients = JSON.parse(localStorage.getItem("ironlog_custom_nutrients_v1") || "[]");
  const knownKeys = new Set(Object.keys(MICRO_RDA));

  let i = 0;
  while (document.getElementById(`suppNutrKey-${i}`)) {
    let key = document.getElementById(`suppNutrKey-${i}`).value;
    const nutrName = (document.getElementById(`suppNutrName-${i}`).value || "").trim();
    const val = parseFloat(document.getElementById(`suppNutrVal-${i}`).value) || 0;
    const unit = document.getElementById(`suppNutrUnit-${i}`).value || "mg";
    if (val > 0 && nutrName) {
      if (!key) key = nutrName.toLowerCase().replace(/[\s\/\-]+/g, "_").replace(/[^a-z0-9_]/g, "");
      micros[key] = val;
      // If not a known RDA nutrient, register as custom
      if (!knownKeys.has(key) && !customNutrients.find(c => c.key === key)) {
        customNutrients.push({ key, name: nutrName, unit });
      }
    }
    i++;
  }
  localStorage.setItem("ironlog_custom_nutrients_v1", JSON.stringify(customNutrients));

  const entry = {
    name, grams: 1,
    calories: 0, protein: 0, carbs: 0, fat: 0,
    micros, source: "supplement",
  };
  addFoodEntry(entry);

  // Save to My Foods if checked
  if (document.getElementById("suppSaveMyFoods").checked) {
    const existing = myFoods.findIndex(f => f.name === name);
    const myFood = { name, per100g: { calories: 0, protein: 0, carbs: 0, fat: 0, micros } };
    if (existing >= 0) myFoods[existing] = myFood;
    else myFoods.push(myFood);
    saveMyFoods(myFoods);
  }
});

// --- My Foods ---
function renderMyFoodsList() {
  const list = document.getElementById("myFoodsList");
  if (myFoods.length === 0) {
    list.innerHTML = `<div class="chart-empty-note">No saved foods yet. Add something via Manual entry and check "Save to My Foods."</div>`;
    return;
  }
  list.innerHTML = myFoods.map((f, i) => `
    <div class="food-result-item">
      <div>
        <div class="food-result-name">${f.name}</div>
        <div class="food-result-sub">per 100g · ${Math.round(f.per100g.calories)} kcal</div>
      </div>
      <input type="number" value="100" id="myfood-grams-${i}" style="width:56px;background:var(--bg-raised);border:1px solid var(--line);color:var(--chalk);border-radius:6px;padding:6px;text-align:center;">
      <button class="food-result-add" data-idx="${i}">+</button>
    </div>
  `).join("");
  list.querySelectorAll(".food-result-add").forEach(btn => {
    btn.addEventListener("click", () => {
      const f = myFoods[btn.dataset.idx];
      const grams = parseFloat(document.getElementById(`myfood-grams-${btn.dataset.idx}`).value) || 100;
      const scale = grams / 100;
      const micros = {};
      Object.keys(f.per100g.micros || emptyMicros()).forEach(k => micros[k] = (f.per100g.micros[k] || 0) * scale);
      addFoodEntry({
        name: f.name, grams,
        calories: f.per100g.calories * scale, protein: f.per100g.protein * scale,
        carbs: f.per100g.carbs * scale, fat: f.per100g.fat * scale,
        micros, source: "myfoods",
      });
    });
  });
}

// --- Manual entry ---
document.getElementById("manualAddBtn").addEventListener("click", () => {
  const name = document.getElementById("manualName").value.trim();
  const grams = parseFloat(document.getElementById("manualGrams").value) || 100;
  const calories = parseFloat(document.getElementById("manualCalories").value) || 0;
  const protein = parseFloat(document.getElementById("manualProtein").value) || 0;
  const carbs = parseFloat(document.getElementById("manualCarbs").value) || 0;
  const fat = parseFloat(document.getElementById("manualFat").value) || 0;
  if (!name) { showToast("Enter a food name"); return; }

  if (document.getElementById("manualSaveToMyFoods").checked) {
    const scale = 100 / grams;
    myFoods.push({
      id: Date.now().toString(), name,
      per100g: { calories: calories * scale, protein: protein * scale, carbs: carbs * scale, fat: fat * scale, micros: emptyMicros() }
    });
    saveMyFoods(myFoods);
  }

  addFoodEntry({ name, grams, calories, protein, carbs, fat, micros: emptyMicros(), source: "manual" });

  document.getElementById("manualName").value = "";
  document.getElementById("manualCalories").value = "";
  document.getElementById("manualProtein").value = "";
  document.getElementById("manualCarbs").value = "";
  document.getElementById("manualFat").value = "";
});
