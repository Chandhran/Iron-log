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

// ---------- MICRONUTRIENT REFERENCE (standard adult RDA) ----------
const MICRO_RDA = {
  vitaminA:     { name: "Vitamin A",        unit: "mcg", rda: 900 },
  vitaminC:     { name: "Vitamin C",        unit: "mg",  rda: 90 },
  vitaminD:     { name: "Vitamin D",        unit: "mcg", rda: 20 },
  vitaminE:     { name: "Vitamin E",        unit: "mg",  rda: 15 },
  vitaminK:     { name: "Vitamin K",        unit: "mcg", rda: 120 },
  thiamin:      { name: "Thiamin (B1)",     unit: "mg",  rda: 1.2 },
  riboflavin:   { name: "Riboflavin (B2)",  unit: "mg",  rda: 1.3 },
  niacin:       { name: "Niacin (B3)",      unit: "mg",  rda: 16 },
  b6:           { name: "Vitamin B6",       unit: "mg",  rda: 1.7 },
  folate:       { name: "Folate (B9)",      unit: "mcg", rda: 400 },
  b12:          { name: "Vitamin B12",      unit: "mcg", rda: 2.4 },
  pantothenic:  { name: "Pantothenic Acid (B5)", unit: "mg", rda: 5 },
  biotin:       { name: "Biotin (B7)",      unit: "mcg", rda: 30 },
  calcium:      { name: "Calcium",          unit: "mg",  rda: 1000 },
  iron:         { name: "Iron",             unit: "mg",  rda: 18 }, // adjusted by gender below
  magnesium:    { name: "Magnesium",        unit: "mg",  rda: 400 },
  phosphorus:   { name: "Phosphorus",       unit: "mg",  rda: 700 },
  potassium:    { name: "Potassium",        unit: "mg",  rda: 3400 },
  sodium:       { name: "Sodium (limit)",   unit: "mg",  rda: 2300 },
  zinc:         { name: "Zinc",             unit: "mg",  rda: 11 },
  copper:       { name: "Copper",           unit: "mcg", rda: 900 },
  manganese:    { name: "Manganese",        unit: "mg",  rda: 2.3 },
  selenium:     { name: "Selenium",         unit: "mcg", rda: 55 },
};

function micronutrientRDA(key, gender) {
  if (key === "iron") return gender === "female" ? 18 : 8;
  return MICRO_RDA[key].rda;
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
  ["Vitamin B-6", "b6", "mg"],
  ["Folate, total", "folate", "mcg"],
  ["Vitamin B-12", "b12", "mcg"],
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
    bodyEl.innerHTML = `Training days: ~${z.trainDayCal} kcal. Rest days: ~${z.restDayCal} kcal. Weekly average lands on your ${calories} kcal target.`;
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
document.getElementById("fpCalcBtn").addEventListener("click", () => {
  const age = parseFloat(document.getElementById("fpAge").value);
  const gender = document.getElementById("fpGender").value;
  const heightCm = parseFloat(document.getElementById("fpHeight").value);
  const weightKg = parseFloat(document.getElementById("fpWeight").value);
  const activity = document.getElementById("fpActivity").value;
  const targetWeightKg = parseFloat(document.getElementById("fpTargetWeight").value) || null;
  if (!age || !heightCm || !weightKg) { showToast("Fill in age, height, and weight"); return; }

  const bmr = gender === "female"
    ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const maintenanceCalories = Math.round(bmr * parseFloat(activity));
  const { bmi, category } = calcBMI(weightKg, heightCm);

  document.getElementById("bmiGaugePanel").style.display = "block";
  drawBMIGauge(document.getElementById("bmiGaugeCanvas"), bmi);
  document.getElementById("bmiGaugeValue").innerHTML = `BMI = ${bmi} <span class="bmi-cat">${category}</span>`;

  document.getElementById("rateOptionsPanel").style.display = "block";
  selectedRateKey = "maintain";
  renderRateOptions(maintenanceCalories, weightKg);
  document.getElementById("fpGoalCal").value = maintenanceCalories;

  setupProfileBase = { age, gender, heightCm, weightKg, activity, targetWeightKg, maintenanceCalories, bmi, bmiCategory: category };
  document.getElementById("fpGoalsPanel").dataset.profile = JSON.stringify(setupProfileBase);

  document.getElementById("dietStylePanel").style.display = "block";
  renderDietStyleGrid();
  applyDietStyleSelection();
  document.getElementById("fpSaveBtn").style.display = "block";
});

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

  return { goalCalories, goalProtein, goalCarb, goalFat, statusHtml };
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
    Object.keys(totals.micros).forEach(k => { totals.micros[k] += (l.micros && l.micros[k]) || 0; });
  });

  const goals = todaysGoals(profile);
  document.getElementById("dietStatusPanel").innerHTML = goals.statusHtml;

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

  const weightEntry = weightLogs.find(w => w.date === currentFoodDate);
  document.getElementById("dailyWeightInput").value = weightEntry ? weightEntry.weightKg : "";

  renderMealSections(dayLogs);
  renderMicroPanel(totals.micros, profile.gender);
}

document.getElementById("dailyWeightSaveBtn").addEventListener("click", () => {
  const val = parseFloat(document.getElementById("dailyWeightInput").value);
  if (!val) { showToast("Enter a weight"); return; }
  weightLogs = weightLogs.filter(w => w.date !== currentFoodDate);
  weightLogs.push({ date: currentFoodDate, weightKg: val });
  saveWeightLogs(weightLogs);
  showToast("Weight logged");
  syncPush("Log daily weight");
  if (document.getElementById("view-progress").classList.contains("active")) renderWeightTrendChart();
});

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
      openModal("foodModalOverlay");
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

function renderMicroPanel(consumedMicros, gender) {
  const panel = document.getElementById("microPanel");
  panel.innerHTML = Object.entries(MICRO_RDA).map(([key, info]) => {
    const rda = micronutrientRDA(key, gender);
    const consumed = consumedMicros[key] || 0;
    const pct = Math.min(100, Math.round((consumed / rda) * 100));
    const color = pct >= 100 ? "#4ACF6B" : pct >= 50 ? "#FFC94A" : "#FF6B4A";
    return `
      <div class="micro-row">
        <div class="micro-row-top">
          <span class="micro-name">${info.name}</span>
          <span class="micro-amount">${consumed.toFixed(1)} / ${rda}${info.unit}</span>
        </div>
        <div class="micro-bar-track"><div class="micro-bar-fill" style="width:${pct}%; background:${color};"></div></div>
      </div>`;
  }).join("");
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
  });
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
  try {
    const res = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=10&api_key=DEMO_KEY`);
    if (!res.ok) throw new Error("USDA request failed");
    const data = await res.json();
    if (!data.foods || data.foods.length === 0) {
      results.innerHTML = `<div class="chart-empty-note">No results. Try Manual entry instead.</div>`;
      return;
    }
    results.innerHTML = data.foods.map((f, i) => `
      <div class="food-result-item">
        <div>
          <div class="food-result-name">${f.description}</div>
          <div class="food-result-sub">per 100g${f.brandOwner ? " · " + f.brandOwner : ""}</div>
        </div>
        <input type="number" value="100" style="width:56px;background:var(--bg-raised);border:1px solid var(--line);color:var(--chalk);border-radius:6px;padding:6px;text-align:center;" id="usda-grams-${i}">
        <button class="food-result-add" data-idx="${i}">+</button>
      </div>
    `).join("");
    results.querySelectorAll(".food-result-add").forEach(btn => {
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
  } catch (e) {
    results.innerHTML = `<div class="chart-empty-note">Couldn't reach USDA database. Check your connection or try Manual entry.</div>`;
  }
});

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
