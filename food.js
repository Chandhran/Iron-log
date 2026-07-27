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
function calcSuggestedGoals(profile) {
  const { age, gender, heightCm, weightKg, activity } = profile;
  const bmr = gender === "female"
    ? 10 * weightKg + 6.25 * heightCm - 5 * age - 161
    : 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  const tdee = bmr * parseFloat(activity);
  const goalCalories = Math.round(tdee);
  const goalProtein = Math.round(weightKg * 1.8);
  const goalFat = Math.round((tdee * 0.25) / 9);
  const proteinCals = goalProtein * 4;
  const fatCals = goalFat * 9;
  const goalCarb = Math.max(0, Math.round((tdee - proteinCals - fatCals) / 4));
  return { goalCalories, goalProtein, goalCarb, goalFat };
}

// ---------- SETUP FLOW ----------
document.getElementById("fpCalcBtn").addEventListener("click", () => {
  const age = parseFloat(document.getElementById("fpAge").value);
  const gender = document.getElementById("fpGender").value;
  const heightCm = parseFloat(document.getElementById("fpHeight").value);
  const weightKg = parseFloat(document.getElementById("fpWeight").value);
  const activity = document.getElementById("fpActivity").value;
  if (!age || !heightCm || !weightKg) { showToast("Fill in age, height, and weight"); return; }

  const goals = calcSuggestedGoals({ age, gender, heightCm, weightKg, activity });
  document.getElementById("fpGoalCal").value = goals.goalCalories;
  document.getElementById("fpGoalProtein").value = goals.goalProtein;
  document.getElementById("fpGoalCarb").value = goals.goalCarb;
  document.getElementById("fpGoalFat").value = goals.goalFat;
  document.getElementById("fpGoalsPanel").style.display = "block";

  document.getElementById("fpGoalsPanel").dataset.profile = JSON.stringify({ age, gender, heightCm, weightKg, activity });
});

document.getElementById("fpSaveBtn").addEventListener("click", () => {
  const base = JSON.parse(document.getElementById("fpGoalsPanel").dataset.profile || "{}");
  const profile = {
    ...base,
    goalCalories: parseFloat(document.getElementById("fpGoalCal").value),
    goalProtein: parseFloat(document.getElementById("fpGoalProtein").value),
    goalCarb: parseFloat(document.getElementById("fpGoalCarb").value),
    goalFat: parseFloat(document.getElementById("fpGoalFat").value),
  };
  saveFoodProfile(profile);
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
  document.getElementById("fpGoalCal").value = p.goalCalories;
  document.getElementById("fpGoalProtein").value = p.goalProtein;
  document.getElementById("fpGoalCarb").value = p.goalCarb;
  document.getElementById("fpGoalFat").value = p.goalFat;
  document.getElementById("fpGoalsPanel").style.display = "block";
  document.getElementById("fpGoalsPanel").dataset.profile = JSON.stringify(p);
});

// ---------- MAIN FOOD TAB RENDER ----------
function renderFoodTab() {
  const profile = loadFoodProfile();
  if (!profile || !profile.goalCalories) {
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

  drawCalorieDial(totals.calories, profile.goalCalories);
  drawMacroRing("proteinRing", totals.protein, profile.goalProtein, "#FF6B4A");
  drawMacroRing("carbRing", totals.carbs, profile.goalCarb, "#4A9EFF");
  drawMacroRing("fatRing", totals.fat, profile.goalFat, "#FFC94A");
  document.getElementById("proteinRingValue").textContent = `${Math.round(totals.protein)}/${profile.goalProtein}g`;
  document.getElementById("carbRingValue").textContent = `${Math.round(totals.carbs)}/${profile.goalCarb}g`;
  document.getElementById("fatRingValue").textContent = `${Math.round(totals.fat)}/${profile.goalFat}g`;

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
