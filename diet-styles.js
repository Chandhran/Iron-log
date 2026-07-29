// ============================================================
// DIET STYLES — macro ratios, cycling logic, and the two
// Hyperbolic protocols (J Darwish), all driven by real formulas.
// ============================================================

const DIET_STYLES = {
  balanced:            { label: "Balanced",              type: "ratio",   protein: 25, carb: 45, fat: 30 },
  keto:                { label: "Keto",                  type: "ratio",   protein: 20, carb: 10, fat: 70 },
  highProteinLowCarb:  { label: "High Protein Low Carb", type: "ratio",   protein: 35, carb: 25, fat: 40 },
  bodyRecomp:          { label: "Body Recomposition",    type: "ratio",   protein: 33, carb: 33, fat: 34 },
  carbCycling:         { label: "Carb Cycling",          type: "cycling",
                          high: { protein: 30, carb: 50, fat: 20 },
                          low:  { protein: 35, carb: 20, fat: 45 } },
  zigzag:              { label: "Zigzag Calorie",        type: "zigzag" },
  intermittentFasting: { label: "Intermittent Fasting",  type: "timing", defaultWindow: 8 },
  omad:                { label: "OMAD",                  type: "timing", defaultWindow: 1 },
  hyperbolicFasting:   { label: "Hyperbolic Fasting",    type: "hyperbolicFasting" },
  hyperbolicDiet:      { label: "Hyperbolic Diet",       type: "hyperbolicDiet" },
};

const DIET_STYLE_ORDER = ["balanced", "keto", "highProteinLowCarb", "bodyRecomp", "carbCycling", "zigzag", "intermittentFasting", "omad", "hyperbolicFasting", "hyperbolicDiet"];

// ---------- Ratio -> grams ----------
function macrosFromRatio(calories, proteinPct, carbPct, fatPct) {
  return {
    goalProtein: Math.round((calories * (proteinPct / 100)) / 4),
    goalCarb: Math.round((calories * (carbPct / 100)) / 4),
    goalFat: Math.round((calories * (fatPct / 100)) / 9),
  };
}

// Rebalance macro percentages so they always sum to 100, keeping the two
// non-edited sliders proportional to each other.
function rebalanceMacroPct(changedKey, newVal, current) {
  const keys = ["protein", "carb", "fat"];
  newVal = Math.max(0, Math.min(100, newVal));
  const others = keys.filter(k => k !== changedKey);
  const otherSum = others.reduce((s, k) => s + current[k], 0);
  const remaining = 100 - newVal;
  const result = { ...current, [changedKey]: newVal };
  if (otherSum <= 0) {
    // split remaining evenly if the others were both zero
    result[others[0]] = Math.round(remaining / 2);
    result[others[1]] = remaining - result[others[0]];
  } else {
    result[others[0]] = Math.round((current[others[0]] / otherSum) * remaining);
    result[others[1]] = remaining - result[others[0]]; // ensures exact sum of 100
  }
  return result;
}

// ---------- Today's day-type (for Carb Cycling / Zigzag) ----------
// Uses the existing Train program: today is a "training day" if the current
// week/day in the program is a training day type, else "rest day".
function isTodayATrainingDay() {
  const phase = PROGRAM[phaseForWeek(state.week)];
  const day = phase.days[state.dayIndex];
  return day.type === "training";
}

function carbCyclingMacrosForToday(calories) {
  const variant = isTodayATrainingDay() ? DIET_STYLES.carbCycling.high : DIET_STYLES.carbCycling.low;
  return {
    ...macrosFromRatio(calories, variant.protein, variant.carb, variant.fat),
    dayLabel: isTodayATrainingDay() ? "High-carb day (training)" : "Low-carb day (rest)",
  };
}

function zigzagCaloriesForToday(maintenanceCalories, goalCalories) {
  // Weekly average must equal goalCalories. Training days run higher (closer to
  // maintenance), rest days run lower, while the week nets out to the target.
  const weeklyTarget = goalCalories * 7;
  const trainDayCal = Math.round((maintenanceCalories + goalCalories) / 2);
  // Solve rest-day calories so 7-day total hits weeklyTarget, assuming ~4 train/3 rest split typical of this program
  // (recomputed dynamically from actual program day types across the current week)
  const phase = PROGRAM[phaseForWeek(state.week)];
  const trainDays = phase.days.filter(d => d.type === "training").length;
  const restDays = 7 - trainDays;
  const restDayCal = restDays > 0 ? Math.round((weeklyTarget - trainDayCal * trainDays) / restDays) : goalCalories;
  return {
    trainDayCal, restDayCal,
    todayCal: isTodayATrainingDay() ? trainDayCal : restDayCal,
    dayLabel: isTodayATrainingDay() ? "Higher-calorie day (training)" : "Lower-calorie day (rest)",
  };
}

// ---------- Intermittent Fasting / OMAD ----------
function eatingWindowStatus(windowStartHHMM, windowHours) {
  const now = new Date();
  const [h, m] = windowStartHHMM.split(":").map(Number);
  const start = new Date(now); start.setHours(h, m, 0, 0);
  const end = new Date(start.getTime() + windowHours * 3600 * 1000);
  let effectiveStart = start, effectiveEnd = end;
  if (now < start) {
    // window hasn't opened yet today; check if we're still inside yesterday's window
    const yStart = new Date(start.getTime() - 24 * 3600 * 1000);
    const yEnd = new Date(yStart.getTime() + windowHours * 3600 * 1000);
    if (now < yEnd) { effectiveStart = yStart; effectiveEnd = yEnd; }
  }
  const isOpen = now >= effectiveStart && now < effectiveEnd;
  if (isOpen) {
    const msLeft = effectiveEnd - now;
    return { open: true, label: `Eating window open — closes in ${formatDuration(msLeft)}` };
  } else {
    const nextStart = now < effectiveStart ? effectiveStart : new Date(effectiveStart.getTime() + 24 * 3600 * 1000);
    const msLeft = nextStart - now;
    return { open: false, label: `Fasting — window opens in ${formatDuration(msLeft)}` };
  }
}

// ---------- Hyperbolic Fasting (J Darwish) ----------
// Height -> protein "height number" lookup
function heightNumberFromCm(heightCm) {
  const inches = heightCm / 2.54;
  if (inches <= 65) return 130;       // 5'-5'5"
  if (inches <= 69) return 150;       // 5'6"-5'9"
  if (inches <= 71) return 160;       // 5'10"-5'11"
  if (inches <= 75) return 180;       // 6'-6'3"
  return 205;                          // 6'4"-6'7"+
}

const HF_WEEKLY_SCHEDULES = {
  burnFat: { fastingDays: [2, 4, 0], label: "Burn fat + build muscle" },   // Tue=2, Thu=4, Sun=0
  buildMuscle: { fastingDays: [], label: "Build muscle + maintain" },        // cheat every day
};

function isHyperbolicFastingDayToday(scheduleKey) {
  const sched = HF_WEEKLY_SCHEDULES[scheduleKey] || HF_WEEKLY_SCHEDULES.burnFat;
  return sched.fastingDays.includes(new Date().getDay());
}

function hyperbolicFastingMealPlan(heightCm, isFastingDay) {
  const N = heightNumberFromCm(heightCm);
  if (isFastingDay) {
    return {
      dayType: "Hyperbolic Fasting day",
      meals: [
        { name: "Protein & Fats", detail: `20g any nuts + lean protein at 25% of ${N} = ${Math.round(N * 0.25)}g protein` },
        { name: "Protein & Fats 2", detail: `30g any nuts + lean protein at 50% of ${N} = ${Math.round(N * 0.5)}g protein` },
        { name: "Fructose & Fats", detail: "100 cal fruit (e.g. 1 banana) + 10g any nuts" },
      ],
      postWorkout: `25% of ${N} = ${Math.round(N * 0.25)}g protein (RTD or protein powder)`,
    };
  }
  return {
    dayType: "Hyperbolic Fasting Cheat day",
    meals: [
      { name: "Protein & Fats", detail: `20g any nuts + lean protein at 25% of ${N} = ${Math.round(N * 0.25)}g protein` },
      { name: "Cheat Meal", detail: `Any protein at 50% of ${N} = ${Math.round(N * 0.5)}g protein + any carbs/desserts you like` },
      { name: "Fructose & Fats", detail: "100 cal fruit (e.g. 1 banana) + 10g any nuts" },
    ],
    postWorkout: `25% of ${N} = ${Math.round(N * 0.25)}g protein (RTD or protein powder)`,
    rule: "Fast before the cheat meal. Eat to appetite during it — it's for cravings, not hunger. Fast again after.",
  };
}

// ---------- Hyperbolic Diet (J Darwish) ----------
// Weekly total X = maintenance × 5 × factor, then each of 5 rotating days takes a fraction of X.
const HD_VARIANTS = {
  controlled:  { label: "Controlled Fat Loss",  factor: 0.85, dayFractions: [0.25, 0.25, 0.125, 0.30, 0.125] },
  extreme:     { label: "Extreme Fat Loss (special occasions only)", factor: 0.75, dayFractions: [0.25, 0.25, 0.125, 0.30, 0.125] },
  maintenance: { label: "Maintenance / Muscle Gain", factor: 1.0, dayFractions: [0.225, 0.225, 0.225, 0.225, 0.10] },
};

function hyperbolicDietWeeklyX(maintenanceCalories, variantKey) {
  const v = HD_VARIANTS[variantKey] || HD_VARIANTS.controlled;
  return maintenanceCalories * 5 * v.factor;
}

function hyperbolicDietDayCalories(maintenanceCalories, variantKey, rotationDayIndex) {
  const v = HD_VARIANTS[variantKey] || HD_VARIANTS.controlled;
  const X = hyperbolicDietWeeklyX(maintenanceCalories, variantKey);
  const raw = X * v.dayFractions[rotationDayIndex % 5];
  return Math.round(raw / 100) * 100; // round to nearest hundred, as specified
}

// Rotation day index counts continuously from a fixed anchor date so it cycles
// every 5 days regardless of calendar weekday.
function hyperbolicDietRotationIndex(anchorDateISO) {
  const anchor = new Date(anchorDateISO + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysSince = Math.floor((today - anchor) / (1000 * 60 * 60 * 24));
  return ((daysSince % 5) + 5) % 5;
}

function hyperbolicDietMealSplit(dayCalories, heightCm) {
  const N = heightNumberFromCm(heightCm);
  return {
    meal1: { proteinG: Math.round(N * 0.25), note: "25% of daily protein, lean source — subtract its calories from the daily total" },
    postWorkout: { proteinG: Math.round(N * 0.25), note: "25% of daily protein, lean source — subtract its calories from the daily total" },
    dinner: { proteinG: Math.round(N * 0.5), note: "50% of daily protein, lean source — subtract its calories from the daily total" },
    rest: "Remaining calories: whenever you want, even all with dinner. Prioritize carbs.",
  };
}
