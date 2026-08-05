// generator.js — turns intake answers into a full program object matching
// the shape of PROGRAM. Encodes all rules from the extracted analysis:
// female pool restriction, style-layer merging, session splitting, proactive
// additions, muscle segmentation, volume/frequency budgets.

// ---------- EXERCISE POOL ----------
// Small curated library covering all layers. Each exercise carries: name,
// primary muscle, secondary muscles, movement pattern, compound flag,
// location tag (for session splitting), and equipment tag.
const GEN_EXERCISES = {
  // ---- TRADITIONAL STRENGTH ----
  back_squat:      { name:"Back Squat", muscle:"Quadriceps", secondary:["Glutes","Hamstrings"], pattern:"Squat", compound:true, location:"gym_required", tags:["strength","lower"] },
  front_squat:     { name:"Front Squat", muscle:"Quadriceps", secondary:["Glutes"], pattern:"Squat", compound:true, location:"gym_required", tags:["strength","lower"] },
  bench_press:     { name:"Bench Press", muscle:"Pectoralis Major", secondary:["Anterior Deltoid","Triceps Brachii"], pattern:"Horizontal Push", compound:true, location:"gym_required", tags:["strength","upper","push"] },
  deadlift:        { name:"Deadlift", muscle:"Hamstrings", secondary:["Glutes","Erector Spinae","Trapezius"], pattern:"Hip Hinge", compound:true, location:"gym_required", tags:["strength","lower","pull"] },
  ohp:             { name:"Overhead Press", muscle:"Anterior Deltoid", secondary:["Lateral Deltoid","Triceps Brachii"], pattern:"Vertical Push", compound:true, location:"gym_required", tags:["strength","upper","push"] },
  barbell_row:     { name:"Barbell Row", muscle:"Latissimus Dorsi", secondary:["Rhomboids","Biceps Brachii"], pattern:"Horizontal Pull", compound:true, location:"gym_required", tags:["strength","upper","pull"] },
  romanian_dl:     { name:"Romanian Deadlift", muscle:"Hamstrings", secondary:["Glutes","Erector Spinae"], pattern:"Hip Hinge", compound:true, location:"gym_or_home_gym", tags:["strength","lower","pull"] },
  weighted_pullup: { name:"Weighted Pull-Up", muscle:"Latissimus Dorsi", secondary:["Biceps Brachii"], pattern:"Vertical Pull", compound:true, location:"gym_or_home_gym", tags:["strength","upper","pull"] },

  // ---- BODYBUILDING HYPERTROPHY ----
  incline_db_press:  { name:"Incline Dumbbell Press", muscle:"Pectoralis Major", secondary:["Anterior Deltoid"], pattern:"Horizontal Push", compound:true, location:"gym_or_home_gym", tags:["hypertrophy","upper","push"] },
  cable_flye:        { name:"Cable Flye", muscle:"Pectoralis Major", secondary:[], pattern:"Isolation", compound:false, location:"gym_required", tags:["hypertrophy","upper","push","iso"] },
  chest_dip:         { name:"Chest Dip", muscle:"Pectoralis Major", secondary:["Triceps Brachii"], pattern:"Vertical Push", compound:true, location:"gym_or_home_gym", tags:["hypertrophy","upper","push"] },
  lat_pulldown:      { name:"Lat Pulldown", muscle:"Latissimus Dorsi", secondary:["Biceps Brachii","Rhomboids"], pattern:"Vertical Pull", compound:true, location:"gym_required", tags:["hypertrophy","upper","pull"] },
  seated_row:        { name:"Seated Cable Row", muscle:"Rhomboids", secondary:["Latissimus Dorsi","Biceps Brachii"], pattern:"Horizontal Pull", compound:true, location:"gym_required", tags:["hypertrophy","upper","pull"] },
  chest_supp_row:    { name:"Chest-Supported Row", muscle:"Rhomboids", secondary:["Latissimus Dorsi","Biceps Brachii"], pattern:"Horizontal Pull", compound:true, location:"gym_required", tags:["hypertrophy","upper","pull"] },
  lateral_raise:     { name:"Dumbbell Lateral Raise", muscle:"Lateral Deltoid", secondary:[], pattern:"Isolation", compound:false, location:"gym_or_home_gym", tags:["hypertrophy","upper","iso"] },
  cable_lateral:     { name:"Cable Lateral Raise", muscle:"Lateral Deltoid", secondary:[], pattern:"Isolation", compound:false, location:"gym_required", tags:["hypertrophy","upper","iso"] },
  face_pull:         { name:"Face Pull", muscle:"Posterior Deltoid", secondary:["Trapezius","Rhomboids"], pattern:"Horizontal Pull", compound:false, location:"gym_required", tags:["hypertrophy","upper","iso"] },
  incline_db_curl:   { name:"Incline Dumbbell Curl", muscle:"Biceps Brachii", secondary:[], pattern:"Elbow Flexion", compound:false, location:"gym_or_home_gym", tags:["hypertrophy","upper","iso"] },
  hammer_curl:       { name:"Hammer Curl", muscle:"Biceps Brachii", secondary:["Forearms"], pattern:"Elbow Flexion", compound:false, location:"gym_or_home_gym", tags:["hypertrophy","upper","iso"] },
  ez_bar_curl:       { name:"EZ Bar Curl", muscle:"Biceps Brachii", secondary:["Forearms"], pattern:"Elbow Flexion", compound:false, location:"gym_or_home_gym", tags:["hypertrophy","upper","iso"] },
  rope_pushdown:     { name:"Rope Pushdown", muscle:"Triceps Brachii", secondary:[], pattern:"Elbow Extension", compound:false, location:"gym_required", tags:["hypertrophy","upper","iso"] },
  skull_crusher:     { name:"Skull Crushers", muscle:"Triceps Brachii", secondary:[], pattern:"Elbow Extension", compound:false, location:"gym_or_home_gym", tags:["hypertrophy","upper","iso"] },
  overhead_ext:      { name:"Overhead Triceps Extension", muscle:"Triceps Brachii", secondary:[], pattern:"Elbow Extension", compound:false, location:"gym_or_home_gym", tags:["hypertrophy","upper","iso"] },
  leg_press:         { name:"Leg Press", muscle:"Quadriceps", secondary:["Glutes"], pattern:"Squat", compound:true, location:"gym_required", tags:["hypertrophy","lower"] },
  leg_extension:     { name:"Leg Extension", muscle:"Quadriceps", secondary:[], pattern:"Isolation", compound:false, location:"gym_required", tags:["hypertrophy","lower","iso"] },
  lying_leg_curl:    { name:"Lying Leg Curl", muscle:"Hamstrings", secondary:[], pattern:"Isolation", compound:false, location:"gym_required", tags:["hypertrophy","lower","iso"] },
  hip_thrust:        { name:"Barbell Hip Thrust", muscle:"Glutes", secondary:["Hamstrings"], pattern:"Hip Extension", compound:true, location:"gym_or_home_gym", tags:["hypertrophy","lower"] },
  bulgarian_split:   { name:"Bulgarian Split Squat", muscle:"Quadriceps", secondary:["Glutes"], pattern:"Lunge", compound:true, location:"gym_or_home_gym", tags:["hypertrophy","lower"] },
  standing_calf:     { name:"Standing Calf Raise", muscle:"Calves", secondary:[], pattern:"Calf Raise", compound:false, location:"gym_or_home_gym", tags:["hypertrophy","lower","iso"] },
  hanging_leg_raise: { name:"Hanging Leg Raise", muscle:"Rectus Abdominis", secondary:["Obliques"], pattern:"Hip Flexion", compound:false, location:"gym_or_home_gym", tags:["hypertrophy","core"] },
  cable_crunch:      { name:"Cable Crunch", muscle:"Rectus Abdominis", secondary:[], pattern:"Spinal Flexion", compound:false, location:"gym_required", tags:["hypertrophy","core"] },

  // ---- ATHLETIC CONDITIONING ----
  sled_push:      { name:"Sled Push", muscle:"Quadriceps", secondary:["Glutes","Hamstrings"], pattern:"Loaded Carry", compound:true, location:"gym_required", tags:["conditioning","lower"], equip:"sled" },
  sled_drag_back: { name:"Backward Sled Drag", muscle:"Quadriceps", secondary:["Glutes"], pattern:"Loaded Carry", compound:true, location:"outdoor_ok", tags:["conditioning","lower"], equip:"sled" },
  sled_drag_fwd:  { name:"Forward Sled Drag", muscle:"Hamstrings", secondary:["Glutes"], pattern:"Loaded Carry", compound:true, location:"outdoor_ok", tags:["conditioning","lower"], equip:"sled" },
  tire_flip:      { name:"Tire Flip", muscle:"Quadriceps", secondary:["Glutes","Erector Spinae","Trapezius"], pattern:"Full Body", compound:true, location:"outdoor_ok", tags:["conditioning","fullbody"], equip:"tire" },
  farmer_carry:   { name:"Farmer's Carry", muscle:"Trapezius", secondary:["Forearms","Erector Spinae"], pattern:"Loaded Carry", compound:true, location:"gym_or_home_gym", tags:["conditioning","fullbody","grip"], equip:"farmer" },
  battle_ropes:   { name:"Battle Ropes", muscle:"Anterior Deltoid", secondary:["Forearms"], pattern:"Ballistic", compound:false, location:"gym_or_home_gym", tags:["conditioning","upper"], equip:"ropes" },
  kb_swing:       { name:"Kettlebell Swing", muscle:"Glutes", secondary:["Hamstrings","Erector Spinae"], pattern:"Hip Hinge (Ballistic)", compound:true, location:"gym_or_home_gym", tags:["conditioning","lower"], equip:"kb" },
  prowler_push:   { name:"Prowler Push", muscle:"Quadriceps", secondary:["Glutes"], pattern:"Loaded Carry", compound:true, location:"gym_required", tags:["conditioning","lower"], equip:"prowler" },
  sandbag_carry:  { name:"Sandbag Carry", muscle:"Trapezius", secondary:["Forearms","Erector Spinae"], pattern:"Loaded Carry", compound:true, location:"outdoor_ok", tags:["conditioning","fullbody"], equip:"sandbag" },
  skipping:       { name:"Skipping Rope", muscle:"Calves", secondary:["Tibialis Anterior"], pattern:"Ballistic", compound:false, location:"anywhere", tags:["conditioning","cardio"], equip:"skipping" },

  // ---- JOINT PREP / BOTTOM-UP ----
  tibialis_raise:  { name:"Tibialis Raise", muscle:"Tibialis Anterior", secondary:[], pattern:"Ankle Dorsiflexion", compound:false, location:"home_ok", tags:["joint_prep"] },
  reverse_nordic:  { name:"Reverse Nordic", muscle:"Quadriceps", secondary:[], pattern:"Knee Flexion (Reverse)", compound:false, location:"home_ok", tags:["joint_prep"] },
  atg_split_squat: { name:"ATG Split Squat", muscle:"Quadriceps", secondary:["Glutes","Adductors"], pattern:"Lunge (Deep)", compound:true, location:"home_ok", tags:["joint_prep","lower"] },
  cossack_squat:   { name:"Cossack Squat", muscle:"Adductors", secondary:["Quadriceps","Glutes"], pattern:"Squat (Lateral)", compound:true, location:"home_ok", tags:["joint_prep","lower"] },
  hip_airplane:    { name:"Hip Airplane", muscle:"Glutes", secondary:["Adductors"], pattern:"Hip Rotation", compound:false, location:"home_ok", tags:["joint_prep"] },
  jefferson_curl:  { name:"Jefferson Curl", muscle:"Erector Spinae", secondary:["Hamstrings"], pattern:"Spinal Flexion (Loaded)", compound:false, location:"home_ok", tags:["joint_prep","mobility"] },
  ext_rotation:    { name:"Rotator Cuff External Rotation (Band)", muscle:"Posterior Deltoid", secondary:[], pattern:"Shoulder External Rotation", compound:false, location:"home_ok", tags:["joint_prep"] },
  band_pullapart:  { name:"Band Pull-Apart", muscle:"Rhomboids", secondary:["Posterior Deltoid"], pattern:"Horizontal Pull", compound:false, location:"home_ok", tags:["joint_prep"] },
  wall_angel:      { name:"Wall Angel", muscle:"Rhomboids", secondary:["Trapezius"], pattern:"Scapular Mobility", compound:false, location:"home_ok", tags:["joint_prep","mobility"] },
  neck_curl:       { name:"Neck Curl (Weighted)", muscle:"Neck", secondary:[], pattern:"Neck Flexion", compound:false, location:"home_ok", tags:["joint_prep"] },
  wrist_curl:      { name:"Wrist Curl", muscle:"Forearms", secondary:[], pattern:"Wrist Flexion", compound:false, location:"home_ok", tags:["joint_prep"] },
  serratus_pushup: { name:"Serratus Push-Up", muscle:"Anterior Deltoid", secondary:["Pectoralis Major"], pattern:"Scapular Protraction", compound:false, location:"home_ok", tags:["joint_prep"] },
  trap3_raise:     { name:"Trap-3 Raise", muscle:"Trapezius", secondary:["Posterior Deltoid"], pattern:"Scapular Raise", compound:false, location:"home_ok", tags:["joint_prep"] },
  superman_hold:   { name:"Superman Hold", muscle:"Erector Spinae", secondary:["Glutes"], pattern:"Isometric Extension", compound:false, location:"home_ok", tags:["joint_prep"] },
  adductor_squeeze:{ name:"Adductor Squeeze", muscle:"Adductors", secondary:[], pattern:"Hip Adduction", compound:false, location:"home_ok", tags:["joint_prep"] },

  // ---- MOBILITY ----
  hamstring_kicks: { name:"Hamstring Kicks", muscle:"Hamstrings", secondary:[], pattern:"Mobility", compound:false, location:"anywhere", tags:["mobility"] },
  single_leg_rdl:  { name:"Single-Leg RDL (BW)", muscle:"Hamstrings", secondary:["Glutes"], pattern:"Hip Hinge", compound:false, location:"anywhere", tags:["mobility"] },
  toe_touch:       { name:"Toe Touch Hold", muscle:"Hamstrings", secondary:[], pattern:"Static Stretch", compound:false, location:"anywhere", tags:["mobility"] },
  pancake:         { name:"Pancake Stretch", muscle:"Adductors", secondary:["Hamstrings"], pattern:"Static Stretch", compound:false, location:"anywhere", tags:["mobility"] },
  shoulder_dislocate:{ name:"Shoulder Dislocates (Band)", muscle:"Trapezius", secondary:["Posterior Deltoid"], pattern:"Mobility", compound:false, location:"home_ok", tags:["mobility"] },
  thoracic_ext:    { name:"Thoracic Extensions", muscle:"Erector Spinae", secondary:[], pattern:"Mobility", compound:false, location:"home_ok", tags:["mobility"] },
  hip_opener:      { name:"Hip Capsule Opener", muscle:"Glutes", secondary:["Adductors"], pattern:"Mobility", compound:false, location:"anywhere", tags:["mobility"] },
  ankle_mobility:  { name:"Ankle Mobility Drill", muscle:"Calves", secondary:["Tibialis Anterior"], pattern:"Mobility", compound:false, location:"anywhere", tags:["mobility"] },

  // ---- ACTIVE RECOVERY ----
  long_walk:   { name:"Long Walk (30–60 min)", muscle:"Calves", secondary:[], pattern:"Walking", compound:false, location:"outdoor_ok", tags:["recovery","cardio"] },
  sauna:       { name:"Sauna Session (15–20 min)", muscle:"", secondary:[], pattern:"Recovery", compound:false, location:"specific_facility", tags:["recovery"] },
  breathwork:  { name:"Breathwork (10 min)", muscle:"", secondary:[], pattern:"Recovery", compound:false, location:"anywhere", tags:["recovery"] },
};

// ---------- SPLIT SHAPES ----------
// day_pattern arrays of length 7 (Mon..Sun). "rest" or a shape id.
const SPLIT_SHAPES = {
  3: { id:"fullbody_3day",  pattern:["fb_a","rest","fb_b","rest","fb_a","rest","rest"] },
  4: { id:"upper_lower_4",  pattern:["upper","lower","rest","upper","lower","rest","rest"] },
  5: { id:"ul_ppl_5",       pattern:["lower","upper","push","pull","lower_pump","rest","rest"] },
  6: { id:"ppl_6",          pattern:["push","pull","legs","push","pull","legs","rest"] },
  2: { id:"fullbody_2day",  pattern:["fb_a","rest","rest","fb_b","rest","rest","rest"] },
};

// Day-shape → muscles hit
const DAY_MUSCLES = {
  fb_a:      ["Quadriceps","Glutes","Pectoralis Major","Latissimus Dorsi","Biceps Brachii","Triceps Brachii"],
  fb_b:      ["Hamstrings","Glutes","Pectoralis Major","Latissimus Dorsi","Anterior Deltoid","Triceps Brachii"],
  upper:     ["Pectoralis Major","Latissimus Dorsi","Rhomboids","Anterior Deltoid","Lateral Deltoid","Biceps Brachii","Triceps Brachii"],
  lower:     ["Quadriceps","Hamstrings","Glutes","Calves"],
  push:      ["Pectoralis Major","Anterior Deltoid","Lateral Deltoid","Triceps Brachii"],
  pull:      ["Latissimus Dorsi","Rhomboids","Posterior Deltoid","Biceps Brachii"],
  legs:      ["Quadriceps","Hamstrings","Glutes","Calves"],
  lower_pump:["Quadriceps","Glutes","Hamstrings","Calves"],
};

// ---------- DAY NAMES ----------
const DAY_NAMES = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

// ---------- POOL BRIDGE ----------
// Prefer entries from the imported EXERCISE_POOL (Jeff Nippard PB/hyp + Buttermore).
// Falls back to GEN_EXERCISES if the pool doesn't have a matching entry —
// mainly for conditioning, joint prep, active recovery.

function _poolAvailable() {
  return typeof EXERCISE_POOL_BY_MUSCLE !== "undefined"
      && typeof EXERCISE_POOL_BY_NAME !== "undefined"
      && Array.isArray(EXERCISE_POOL_FLAT)
      && EXERCISE_POOL_FLAT.length > 0;
}

// Convert a pool entry into the shape used by the generator's "prepareExercise".
function _poolEntryToGenShape(entry) {
  return {
    name: entry.name,
    muscle: entry.muscle,
    secondary: [],
    pattern: entry.pattern,
    compound: entry.compound,
    location: entry.location,
    tags: [],
    _pool: true,
    _prescriptions: entry.prescriptions,
    _technique_cues: entry.technique_cues || [],
  };
}

// Look up a specific exercise from the pool by name; returns gen-shape or null.
function _poolByName(name) {
  if (!_poolAvailable()) return null;
  var e = EXERCISE_POOL_BY_NAME[name];
  return e ? _poolEntryToGenShape(e) : null;
}

// Pick N exercises from the pool that hit a target muscle, matching an optional
// pattern hint (e.g. "Horizontal Push"). Falls back to any match if pattern
// doesn't turn up enough entries.
function _poolPick(muscle, opts) {
  if (!_poolAvailable()) return [];
  var pool = (EXERCISE_POOL_BY_MUSCLE[muscle] || []).slice();
  if (pool.length === 0) return [];
  opts = opts || {};
  var want = opts.n || 1;
  var pattern = opts.pattern || null;
  var equipmentPreferred = opts.equipment || null;
  var excludeNames = new Set(opts.exclude || []);
  var results = [];
  // Hard-filter: if isolation requested, only return non-compound exercises
  var filtered = pool.filter(function(e) {
    if (excludeNames.has(e.name)) return false;
    if (opts.isolation && e.compound) return false;
    if (opts.compound && !e.compound) return false;
    return true;
  });
  var scored = filtered.map(function(e) {
    var score = 0;
    if (pattern && e.pattern === pattern) score += 3;
    if (equipmentPreferred && (e.equipment || "").indexOf(equipmentPreferred) >= 0) score += 2;
    return { e: e, score: score };
  });
  scored.sort(function(a, b) { return b.score - a.score; });
  for (var i = 0; i < scored.length && results.length < want; i++) {
    results.push(_poolEntryToGenShape(scored[i].e));
  }
  return results;
}


// ---------- MAIN ENTRY ----------
function generateProgramFromIntake(a) {
  const days = a.days_per_week || 4;
  const layers = a.style_layers || ["bodybuilding_hypertrophy"];
  const goal = a.primary_goal || "hypertrophy";
  const isFemale = a.sex === "Female";
  const perio = a.periodization_style || "no_periodization";
  const durationWeeks = a.program_duration_weeks || 12;
  const sessionMin = (a.hours_per_session || 1.0) * 60;

  // Pick the split
  const split = SPLIT_SHAPES[days] || SPLIT_SHAPES[4];

  // Assemble one block of 7 days
  const buildBlock = (focus) => {
    return split.pattern.map((shape, dayIdx) => {
      const dayName = DAY_NAMES[dayIdx];
      if (shape === "rest") return buildRestDay(dayName, a);
      return buildTrainingDay(shape, dayName, focus, a, layers);
    });
  };

  // For week-alternating or block periodization, produce {strength, hypertrophy}
  let program;
  if (perio === "week_alternating" || perio === "block") {
    program = {
      strength:    { key:"strength",    label:"Strength",    days: buildBlock("strength") },
      hypertrophy: { key:"hypertrophy", label:"Hypertrophy", days: buildBlock("hypertrophy") },
    };
  } else {
    program = { main: { key:"main", label:"Program", days: buildBlock("balanced") } };
  }

  program._title = titleForProgram(a);
  program._id = `gen_${goal}_${days}day_${Date.now()}`;
  program._duration_weeks = durationWeeks;
  program._periodization = perio;
  program._layers = layers;

  return program;
}

// ---------- REST DAY ----------
function buildRestDay(dayName, a) {
  const items = a.active_recovery_items || [];
  const layers = a.style_layers || [];
  const tasks = [];

  if (items.includes("walk_long")) tasks.push({ task:"Long walk", notes:"30–60 min, easy pace" });
  if (items.includes("sauna")) tasks.push({ task:"Sauna session", notes:"15–20 min" });
  if (items.includes("breathwork")) tasks.push({ task:"Breathwork", notes:"10 min" });
  if (items.includes("skipping_light")) tasks.push({ task:"Skipping / light cardio", notes:"10–15 min" });
  if (items.includes("mobility_flow")) tasks.push({ task:"Mobility flow", notes:"10–15 min" });

  // Proactive additions: if user picked no active recovery but does 5+ days/wk, add a walk
  const daysPerWeek = a.days_per_week || 4;
  if (tasks.length === 0 && daysPerWeek >= 5) {
    tasks.push({ task:"Long walk", notes:"30–60 min — added because 5+ training days needs recovery" });
  }
  if (tasks.length === 0 && (a.cardio_currently || "") === "none") {
    tasks.push({ task:"Short walk", notes:"20–30 min — added for baseline cardio" });
  }
  if (tasks.length === 0) {
    tasks.push({ task:"Rest", notes:"Physical rest — no scheduled work" });
  }

  // Mobility routine from pool — pick first region that has one available
  const regions = a.mobility_regions || [];
  const hasMobility = layers.includes("mobility") || a.primary_goal === "mobility_only";
  if (hasMobility && regions.length > 0 && typeof poolMobilityRoutine === "function") {
    for (let ri = 0; ri < regions.length; ri++) {
      const routine = poolMobilityRoutine(regions[ri], 1);
      if (routine && routine.moves && routine.moves.length > 0) {
        tasks.push({
          task: `${capitalize(regions[ri])} mobility routine`,
          notes: `${routine.moves.length} drills · 15–20 min`,
          mobility_moves: routine.moves,
        });
        break;
      }
    }
  } else if (hasMobility && regions.length === 0) {
    tasks.push({ task: "General mobility routine", notes: "15–20 min · full-body flow" });
  }

  return { name: dayName, title: "Active Recovery", type: "rest", tasks };
}

// ---------- TRAINING DAY ----------
function buildTrainingDay(shape, dayName, focus, a, layers) {
  const muscles = DAY_MUSCLES[shape] || [];
  const isStrength = focus === "strength";
  const isHyper = focus === "hypertrophy";
  const sessionMin = (a.hours_per_session || 1.0) * 60;
  const exercises = [];
  const companionExercises = [];

  // Joint-prep opener block (if layer active)
  if (layers.includes("joint_prep_bottom_up")) {
    const specialty = a.specialty_muscles || [];
    const openers = jointPrepOpenersFor(shape, specialty);
    openers.forEach(ex => exercises.push(prepareExercise(ex, "opener", focus, a)));
  }

  // Main compound(s)
  const mainLifts = pickMainLifts(shape, focus, a);
  mainLifts.forEach(ex => exercises.push(prepareExercise(ex, "main", focus, a)));

  // Secondary compound
  const secondary = pickSecondaryLifts(shape, focus, a);
  secondary.forEach(ex => exercises.push(prepareExercise(ex, "secondary", focus, a)));

  // Track which muscles are already covered by main/secondary
  const alreadyCovered = new Set();
  exercises.forEach(ex => { if (ex.muscle) alreadyCovered.add(ex.muscle); });

  // Hypertrophy isolation block (only for muscles not yet covered)
  if (layers.includes("bodybuilding_hypertrophy") && isHyper) {
    const isos = pickIsolations(shape, muscles, alreadyCovered);
    isos.forEach(ex => exercises.push(prepareExercise(ex, "isolation", focus, a)));
  } else if (layers.includes("bodybuilding_hypertrophy")) {
    const isos = pickIsolations(shape, muscles, alreadyCovered).slice(0, 2);
    isos.forEach(ex => exercises.push(prepareExercise(ex, "isolation", focus, a)));
  }

  // Athletic conditioning finisher
  if (layers.includes("athletic_conditioning")) {
    const cond = pickConditioning(shape, a);
    cond.forEach(ex => exercises.push(prepareExercise(ex, "conditioning", focus, a)));
  }

  // Estimate session time; if over budget, split to companion
  // Dedup by name. For isolations only, also dedup by (muscle, pattern).
  const seenNames = new Set();
  const seenIsoMusclePattern = new Set();
  const dedupedExercises = [];
  for (const ex of exercises) {
    if (seenNames.has(ex.name)) continue;
    if (ex._segment === "isolation") {
      const key = (ex.muscle || "") + "|" + (ex.pattern || "");
      if (seenIsoMusclePattern.has(key)) continue;
      seenIsoMusclePattern.add(key);
    }
    dedupedExercises.push(ex);
    seenNames.add(ex.name);
  }
  exercises.length = 0;
  exercises.push(...dedupedExercises);

  const timing = estimateSessionMinutes(exercises);
  let title = titleForDay(shape, focus);
  let companionTitle = null;

  if (timing > sessionMin + 5) {
    // Move location-flexible exercises out
    const flexibleTypes = ["opener", "joint_prep"];
    const moveable = exercises.filter(ex =>
      ["home_ok","outdoor_ok","anywhere","specific_facility"].includes(ex.location)
    );
    // Prefer to move openers first
    let moved = 0;
    for (const ex of moveable) {
      if (estimateSessionMinutes(exercises.filter(e => !companionExercises.includes(e))) <= sessionMin) break;
      companionExercises.push(ex);
      moved++;
    }
    if (companionExercises.length > 0) {
      companionTitle = "Companion session (do at home or outdoors)";
    }
  }

  const primaryExercises = exercises.filter(e => !companionExercises.includes(e));

  return {
    name: dayName,
    title,
    type: "training",
    exercises: primaryExercises,
    companion: companionExercises.length > 0
      ? { title: companionTitle, exercises: companionExercises,
          notes: "Flexible timing and location. Do this anytime today — before, after, or separate from the gym session." }
      : null,
  };
}

// ---------- HELPERS ----------
function prepareExercise(ex, segment, focus, userCtx) {
  const isStrength = focus === "strength";
  const isFemale = userCtx && userCtx.sex === "Female";

  // If this exercise came from the pool, prefer the source PDF's prescription
  // for the matching context. Fall back to segment defaults if none matches.
  if (ex._pool && Array.isArray(ex._prescriptions) && ex._prescriptions.length > 0) {
    let priority;
    if (isFemale) {
      priority = segment === "main" && isStrength
        ? ["women_program","powerbuilding_primary","powerbuilding_secondary","hypertrophy_bodypart"]
        : ["women_program","hypertrophy_bodypart","powerbuilding_isolation","powerbuilding_secondary","powerbuilding_primary"];
    } else if (segment === "main" && isStrength) {
      priority = ["powerbuilding_primary","powerbuilding_secondary","hypertrophy_bodypart","women_program"];
    } else {
      priority = ["hypertrophy_bodypart","powerbuilding_isolation","powerbuilding_secondary","powerbuilding_primary","women_program"];
    }
    let rx = null;
    for (const p of priority) {
      rx = ex._prescriptions.find(pr => pr.context === p);
      if (rx) break;
    }
    if (!rx) rx = ex._prescriptions[0];

    // Parse rest to minutes (rest strings like "3-5 min", "2 min", "1-2 min")
    let restMin = 2.0;
    const restMatch = String(rx.rest || "").match(/(\d+(?:\.\d+)?)/);
    if (restMatch) restMin = parseFloat(restMatch[1]);

    // Sets: pick the upper end of range
    const setsStr = String(rx.sets || "3");
    const setsMatch = setsStr.match(/(\d+)(?:-(\d+))?/);
    const setsUpper = setsMatch ? parseInt(setsMatch[2] || setsMatch[1]) : 3;
    const setsLower = setsMatch ? parseInt(setsMatch[1]) : 3;
    const sets = Math.round((setsLower + setsUpper) / 2);

    return {
      name: ex.name,
      target: `${sets}×${rx.reps}${rx.rpe ? ` @ RPE ${rx.rpe}` : ""}`,
      sets: sets,
      reps: rx.reps,
      rpe: rx.rpe,
      rest_min: restMin,
      muscle: ex.muscle,
      secondary: ex.secondary || [],
      pattern: ex.pattern,
      compound: ex.compound,
      location: ex.location,
      tags: ex.tags,
      technique_cues: ex._technique_cues || [],
      _segment: segment,
      _prescription_context: rx.context,
    };
  }

  // Legacy path — no pool data, use segment/focus defaults
  let sets, reps, rpe, rest, target;
  const isCompound = ex.compound;
  if (segment === "opener" || segment === "joint_prep") {
    sets = 2; reps = "10–15"; rpe = 7; rest = 1.0;
    target = `${sets}×${reps}`;
  } else if (segment === "main" && isStrength) {
    sets = isCompound ? 4 : 3; reps = "3–5"; rpe = 8; rest = 4.0;
    target = `${sets}×${reps}`;
  } else if (segment === "main") {
    sets = isCompound ? 4 : 3; reps = "6–8"; rpe = 8; rest = 3.0;
    target = `${sets}×${reps}`;
  } else if (segment === "secondary" && isStrength) {
    sets = 3; reps = "5–8"; rpe = 8; rest = 3.0;
    target = `${sets}×${reps}`;
  } else if (segment === "secondary") {
    sets = 3; reps = "8–12"; rpe = 8; rest = 2.0;
    target = `${sets}×${reps}`;
  } else if (segment === "isolation") {
    sets = 3; reps = "10–15"; rpe = 9; rest = 1.5;
    target = `${sets}×${reps}`;
  } else if (segment === "conditioning") {
    sets = 3;
    if (ex.pattern && ex.pattern.includes("Carry")) target = "3×25–40m";
    else if (ex.tags && ex.tags.includes("cardio")) target = "3×3 min";
    else target = "3×5–8";
    rpe = 8; rest = 2.0; reps = target;
  }

  return {
    name: ex.name,
    target,
    sets,
    reps,
    rpe,
    rest_min: rest,
    muscle: ex.muscle,
    secondary: ex.secondary || [],
    pattern: ex.pattern,
    compound: ex.compound,
    location: ex.location,
    tags: ex.tags,
    _segment: segment,
  };
}

function pickMainLifts(shape, focus, a) {
  const strength_biased = a.athletic_bias === "strength_biased" || focus === "strength";
  // Try pool first — same named lifts exist there with real prescriptions
  const poolMap = {
    fb_a: ["Back Squat", "Barbell Bench Press"],
    fb_b: ["Deadlift", "Overhead Press"],
    upper: focus === "strength" ? ["Barbell Bench Press"] : ["Incline Dumbbell Press"],
    lower: focus === "strength" ? ["Back Squat"] : ["Front Squat"],
    push: ["Barbell Bench Press"],
    pull: ["Weighted Pull-Up"],
    legs: focus === "strength" ? ["Back Squat"] : ["Leg Press"],
    lower_pump: ["Barbell Hip Thrust"],
  };
  const wanted = poolMap[shape] || [];
  const out = [];
  wanted.forEach(name => {
    const pooled = _poolByName(name);
    if (pooled) out.push(pooled);
  });
  if (out.length) return out;

  // Fallback to legacy GEN_EXERCISES
  switch (shape) {
    case "fb_a": return [GEN_EXERCISES.back_squat, GEN_EXERCISES.bench_press];
    case "fb_b": return [GEN_EXERCISES.deadlift, GEN_EXERCISES.ohp];
    case "upper": return focus === "strength" ? [GEN_EXERCISES.bench_press] : [GEN_EXERCISES.incline_db_press];
    case "lower": return focus === "strength" ? [GEN_EXERCISES.back_squat] : [GEN_EXERCISES.front_squat];
    case "push": return [GEN_EXERCISES.bench_press];
    case "pull": return [GEN_EXERCISES.weighted_pullup];
    case "legs": return focus === "strength" ? [GEN_EXERCISES.back_squat] : [GEN_EXERCISES.leg_press];
    case "lower_pump": return [GEN_EXERCISES.hip_thrust];
    default: return [];
  }
}

function pickSecondaryLifts(shape, focus, a) {
  const poolMap = {
    fb_a: ["Chest-Supported Row", "Barbell Bench Press"],
    fb_b: ["Chin-Up", "Wide-Grip Lat Pulldown"],
    upper: ["Chest-Supported Row", "Overhead Press"],
    lower: ["Barbell Romanian Deadlift", "Bulgarian Split Squat"],
    push: ["Incline Dumbbell Press", "Overhead Press"],
    pull: ["Chest-Supported Row", "Wide-Grip Lat Pulldown"],
    legs: ["Barbell Romanian Deadlift", "Leg Press"],
    lower_pump: ["Leg Extension", "Lying Leg Curl"],
  };
  const wanted = poolMap[shape] || [];
  const out = [];
  wanted.forEach(name => {
    const pooled = _poolByName(name);
    if (pooled) out.push(pooled);
  });
  if (out.length >= wanted.length) return out;

  // Legacy fallback (fills in whatever pool didn't have)
  const legacyMap = {
    fb_a: [GEN_EXERCISES.chest_supp_row],
    fb_b: [GEN_EXERCISES.chest_dip, GEN_EXERCISES.lat_pulldown],
    upper: [GEN_EXERCISES.chest_supp_row, GEN_EXERCISES.ohp],
    lower: [GEN_EXERCISES.romanian_dl, GEN_EXERCISES.bulgarian_split],
    push: [GEN_EXERCISES.incline_db_press, GEN_EXERCISES.ohp],
    pull: [GEN_EXERCISES.chest_supp_row, GEN_EXERCISES.barbell_row],
    legs: [GEN_EXERCISES.romanian_dl, GEN_EXERCISES.leg_press],
    lower_pump: [GEN_EXERCISES.leg_extension, GEN_EXERCISES.lying_leg_curl],
  };
  const legacy = legacyMap[shape] || [];
  const outNames = new Set(out.map(e => e.name));
  // Also skip legacy entries whose muscle+pattern matches a pool pick
  const outMusclePattern = new Set(out.map(e => (e.muscle || "") + "|" + (e.pattern || "")));
  legacy.forEach(le => {
    if (!le) return;
    if (outNames.has(le.name)) return;
    const key = (le.muscle || "") + "|" + (le.pattern || "");
    if (outMusclePattern.has(key)) return;
    out.push(le);
    outNames.add(le.name);
    outMusclePattern.add(key);
  });
  return out;
}

function pickIsolations(shape, muscles, alreadyCovered) {
  alreadyCovered = alreadyCovered || new Set();
  // Skip muscles that already have work from main/secondary
  const targets = muscles.filter(m => !alreadyCovered.has(m));

  // Prefer pool: pick 1 isolation per remaining target muscle.
  if (_poolAvailable()) {
    const picks = [];
    const usedNames = new Set();
    const usedPatterns = new Set();
    targets.forEach(m => {
      const candidates = _poolPick(m, { n: 5, isolation: true });
      const fresh = candidates.find(c =>
        !usedNames.has(c.name) && !usedPatterns.has(c.pattern + "|" + m)
      );
      if (fresh) {
        picks.push(fresh);
        usedNames.add(fresh.name);
        usedPatterns.add(fresh.pattern + "|" + m);
      }
    });
    if (picks.length > 0) return picks.slice(0, 4);
  }
  // Legacy fallback path — filter by targets
  const picks = [];
  if (targets.includes("Pectoralis Major")) picks.push(GEN_EXERCISES.cable_flye);
  if (targets.includes("Latissimus Dorsi") && shape !== "legs") picks.push(GEN_EXERCISES.face_pull);
  if (targets.includes("Lateral Deltoid") || (shape === "push" && !alreadyCovered.has("Lateral Deltoid"))) picks.push(GEN_EXERCISES.lateral_raise);
  if (targets.includes("Biceps Brachii") || ((shape === "pull" || shape === "upper") && !alreadyCovered.has("Biceps Brachii"))) picks.push(GEN_EXERCISES.incline_db_curl);
  if (targets.includes("Triceps Brachii") || ((shape === "push" || shape === "upper") && !alreadyCovered.has("Triceps Brachii"))) picks.push(GEN_EXERCISES.rope_pushdown);
  if (targets.includes("Quadriceps") && !shape.startsWith("upper") && !shape.startsWith("push") && !shape.startsWith("pull")) picks.push(GEN_EXERCISES.leg_extension);
  if (targets.includes("Hamstrings")) picks.push(GEN_EXERCISES.lying_leg_curl);
  if (targets.includes("Glutes") && shape !== "upper") picks.push(GEN_EXERCISES.hip_thrust);
  if (targets.includes("Calves")) picks.push(GEN_EXERCISES.standing_calf);
  return picks.slice(0, 4);
}

function pickConditioning(shape, a) {
  const equip = a.conditioning_equipment || [];
  const picks = [];
  const lower = ["fb_a","fb_b","lower","legs","lower_pump"].includes(shape);
  const upper = ["upper","push","pull"].includes(shape);

  if (equip.includes("sled") && lower) picks.push(GEN_EXERCISES.sled_push);
  if (equip.includes("tire") && lower && picks.length === 0) picks.push(GEN_EXERCISES.tire_flip);
  if (equip.includes("farmer") && !upper) picks.push(GEN_EXERCISES.farmer_carry);
  if (equip.includes("kb") && lower && picks.length < 2) picks.push(GEN_EXERCISES.kb_swing);
  if (equip.includes("ropes") && upper) picks.push(GEN_EXERCISES.battle_ropes);
  return picks.slice(0, 2);
}

function jointPrepOpenersFor(shape, specialty) {
  const picks = [];
  const isUpper = ["upper","push","pull"].includes(shape);
  const isLower = ["fb_a","fb_b","lower","legs","lower_pump"].includes(shape);

  if (isLower) {
    if (specialty.includes("tibialis")) picks.push(GEN_EXERCISES.tibialis_raise);
    if (specialty.includes("adductors") || picks.length < 2) picks.push(GEN_EXERCISES.cossack_squat);
    if (isLower && specialty.includes("hip_flexors")) picks.push(GEN_EXERCISES.hip_airplane);
  }
  if (isUpper) {
    if (specialty.includes("rotator_cuff")) picks.push(GEN_EXERCISES.ext_rotation);
    if (specialty.includes("serratus")) picks.push(GEN_EXERCISES.serratus_pushup);
    if (picks.length < 2) picks.push(GEN_EXERCISES.band_pullapart);
  }
  if (specialty.includes("neck") && picks.length < 2) picks.push(GEN_EXERCISES.neck_curl);
  if (specialty.includes("forearms")) picks.push(GEN_EXERCISES.wrist_curl);

  return picks.slice(0, 3);
}

function estimateSessionMinutes(exercises) {
  let total = 8; // general warmup
  exercises.forEach(ex => {
    const setSeconds = ex.compound ? 40 : 30;
    const rest = (ex.rest_min || 1.5) * 60;
    total += (ex.sets * (setSeconds + rest)) / 60;
    total += 0.75; // transition
    if (ex._segment === "main" && ex.compound) total += 5; // specific warmup on first heavy
  });
  return Math.round(total);
}

function titleForDay(shape, focus) {
  const labels = {
    fb_a: "Full Body A", fb_b: "Full Body B",
    upper: "Upper", lower: "Lower",
    push: "Push", pull: "Pull", legs: "Legs",
    lower_pump: "Lower B",
  };
  const base = labels[shape] || shape;
  if (focus === "strength") return base + " (Strength)";
  if (focus === "hypertrophy") return base + " (Hypertrophy)";
  return base;
}

function titleForProgram(a) {
  const bits = [];
  if (a.primary_goal === "athletic_hybrid") bits.push("Athletic Hybrid");
  else if (a.primary_goal === "powerbuilding") bits.push("Powerbuilding");
  else if (a.primary_goal === "hypertrophy") bits.push("Hypertrophy");
  else if (a.primary_goal === "strength") bits.push("Strength");
  else if (a.primary_goal === "specialization") bits.push(capitalize(a.which_specialization || "") + " Specialization");
  else if (a.primary_goal === "mobility_only") bits.push("Mobility");
  bits.push(`${a.days_per_week || 4}-Day`);
  bits.push(`${a.program_duration_weeks || 12}-Week`);
  return bits.join(" — ");
}

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}
