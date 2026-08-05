// intake.js — the multi-phase question flow that gathers user preferences
// and hands them to generator.js to produce a full program.
//
// Flow: modal overlay with a step-by-step form. Each phase adds a card of
// questions. User can go back. Progress bar at top. Final "Generate" button
// runs the generator and closes the modal.

const INTAKE_STATE_KEY = "ironlog_intake_draft_v1";

let intakeState = {
  step: 0,
  answers: {},
};

const INTAKE_STEPS = [
  { id: "essentials", title: "The basics", questions: [
    { id: "sex", label: "What's your sex?", type: "single",
      options: [{v:"Male",l:"Male"},{v:"Female",l:"Female"}] },
    { id: "primary_goal", label: "What's your main goal?", type: "single",
      options: [
        {v:"hypertrophy", l:"Build muscle"},
        {v:"powerbuilding", l:"Powerbuilding (strength + size)"},
        {v:"strength", l:"Max strength / powerlifting"},
        {v:"specialization", l:"Fix a specific weak body part"},
        {v:"athletic_hybrid", l:"Athletic hybrid (strength + conditioning + joint prep)"},
        {v:"mobility_only", l:"Mobility / flexibility only"},
      ]},
    { id: "experience_level", label: "How long have you been training seriously?", type: "single",
      options: [
        {v:"beginner",l:"0–1 year"},
        {v:"intermediate",l:"1–3 years"},
        {v:"advanced",l:"3+ years"},
      ]},
    { id: "days_per_week", label: "How many days per week can you train?", type: "single",
      options: [{v:2,l:"2"},{v:3,l:"3"},{v:4,l:"4"},{v:5,l:"5"},{v:6,l:"6"}]},
    { id: "hours_per_session", label: "How long can each session be?", type: "single",
      options: [
        {v:0.75,l:"~45 minutes"},
        {v:1.0,l:"~60 minutes"},
        {v:1.25,l:"~75 minutes"},
        {v:1.5,l:"~90 minutes"},
        {v:2.0,l:"2 hours or more"},
      ]},
  ]},

  { id: "style_layers", title: "Training style", questions: [
    { id: "style_layers", label: "Which training layers do you want? Pick as many as apply.", type: "multi",
      options: [
        {v:"traditional_strength", l:"Traditional strength — barbell squat/bench/deadlift/OHP"},
        {v:"bodybuilding_hypertrophy", l:"Bodybuilding hypertrophy — isolations, machines, mind-muscle focus"},
        {v:"athletic_conditioning", l:"Athletic conditioning — sleds, carries, tires, kettlebells, ropes"},
        {v:"joint_prep_bottom_up", l:"Joint prep / bottom-up strengthening — stabilizers, often-neglected muscles"},
        {v:"mobility", l:"Mobility work — range of motion, dedicated flexibility"},
        {v:"active_recovery", l:"Structured active recovery — walks, sauna, breathwork on rest days"},
      ]},
    { id: "periodization_style", label: "How should strength vs hypertrophy be blended?", type: "single",
      dependsOn: a => a.style_layers && a.style_layers.includes("traditional_strength") && a.style_layers.includes("bodybuilding_hypertrophy"),
      options: [
        {v:"block", l:"Block — 4 weeks strength, then 4 weeks hypertrophy"},
        {v:"week_alternating", l:"Week-alternating — odd weeks strength, even weeks hypertrophy"},
        {v:"session_level", l:"Session-level — some days heavy, some pump-focused"},
        {v:"no_periodization", l:"None — same approach every week"},
      ]},
  ]},

  { id: "style_details", title: "Style details", questions: [
    { id: "conditioning_equipment", label: "Which conditioning tools do you have?", type: "multi",
      dependsOn: a => (a.style_layers || []).includes("athletic_conditioning"),
      options: [
        {v:"sled", l:"Sled"},
        {v:"tire", l:"Tire (flip)"},
        {v:"farmer", l:"Farmer's handles / trap bar"},
        {v:"ropes", l:"Battle ropes"},
        {v:"kb", l:"Kettlebells"},
        {v:"sandbag", l:"Sandbag"},
        {v:"prowler", l:"Prowler"},
        {v:"skipping", l:"Skipping rope"},
        {v:"none_cond", l:"None of these"},
      ]},
    { id: "specialty_muscles", label: "Which often-overlooked muscles do you want to strengthen from the ground up?", type: "multi",
      dependsOn: a => (a.style_layers || []).includes("joint_prep_bottom_up"),
      options: [
        {v:"tibialis", l:"Tibialis anterior (shins)"},
        {v:"neck", l:"Neck"},
        {v:"rotator_cuff", l:"Rotator cuff"},
        {v:"forearms", l:"Forearms / grip"},
        {v:"adductors", l:"Adductors (inner thighs)"},
        {v:"serratus", l:"Serratus (scap stability)"},
        {v:"calves_direct", l:"Calves (direct)"},
        {v:"wrists", l:"Wrists / hands"},
        {v:"erectors", l:"Spinal erectors"},
        {v:"hip_flexors", l:"Hip flexors (prehab)"},
      ]},
    { id: "active_recovery_items", label: "What active recovery should be scheduled on rest days?", type: "multi",
      dependsOn: a => (a.style_layers || []).includes("active_recovery"),
      options: [
        {v:"walk_long", l:"Long walks (30–60 min)"},
        {v:"sauna", l:"Sauna"},
        {v:"breathwork", l:"Breathwork / meditation"},
        {v:"skipping_light", l:"Skipping / light cardio"},
        {v:"mobility_flow", l:"Structured mobility flow"},
        {v:"nothing", l:"Nothing scheduled — just rest"},
      ]},
    { id: "mobility_regions", label: "Which regions need mobility work?", type: "multi",
      dependsOn: a => (a.style_layers || []).includes("mobility") || a.primary_goal === "mobility_only",
      options: [
        {v:"hamstrings", l:"Hamstrings"},
        {v:"hips", l:"Hips"},
        {v:"shoulders", l:"Shoulders"},
        {v:"thoracic", l:"Thoracic spine / posture"},
        {v:"ankles", l:"Ankles"},
        {v:"wrists_m", l:"Wrists"},
      ]},
  ]},

  { id: "goal_specifics", title: "Goal specifics", questions: [
    { id: "weak_parts", label: "Any body parts you want to prioritize? (Pick up to 2)", type: "multi_max2",
      dependsOn: a => ["hypertrophy","powerbuilding","specialization"].includes(a.primary_goal),
      options: [
        {v:"upper_chest", l:"Upper chest"},
        {v:"mid_chest", l:"Mid chest"},
        {v:"lower_chest", l:"Lower chest"},
        {v:"front_shoulders", l:"Front shoulders"},
        {v:"side_shoulders", l:"Side shoulders"},
        {v:"rear_shoulders", l:"Rear shoulders"},
        {v:"upper_traps", l:"Upper traps"},
        {v:"mid_back", l:"Mid back"},
        {v:"lats", l:"Lats"},
        {v:"lower_back", l:"Lower back"},
        {v:"biceps", l:"Biceps"},
        {v:"triceps", l:"Triceps"},
        {v:"forearms_wp", l:"Forearms"},
        {v:"abs_upper", l:"Abs (upper)"},
        {v:"abs_lower", l:"Abs (lower)"},
        {v:"obliques", l:"Obliques"},
        {v:"neck_wp", l:"Neck"},
        {v:"glutes", l:"Glutes"},
        {v:"quads", l:"Quads"},
        {v:"hamstrings", l:"Hamstrings"},
        {v:"inner_thighs", l:"Inner thighs"},
        {v:"calves", l:"Calves"},
        {v:"shins", l:"Shins"},
      ]},
    { id: "powerbuilding_phase", label: "Which phase fits your focus?", type: "single",
      dependsOn: a => a.primary_goal === "powerbuilding",
      options: [
        {v:"base", l:"Base — equal strength and size"},
        {v:"accumulation", l:"Accumulation — more size, still training the big 3"},
        {v:"peaking", l:"Peaking — max strength on squat/bench/deadlift"},
      ]},
    { id: "lift_focus", label: "Which lift do you want to prioritize?", type: "single",
      dependsOn: a => a.primary_goal === "strength",
      options: [
        {v:"squat", l:"Squat"},
        {v:"bench_press", l:"Bench press"},
        {v:"deadlift", l:"Deadlift"},
        {v:"all_three", l:"All three equally"},
      ]},
    { id: "which_specialization", label: "Which body part is your priority weak point?", type: "single",
      dependsOn: a => a.primary_goal === "specialization",
      options: [
        {v:"chest", l:"Chest"},
        {v:"back", l:"Back"},
        {v:"arms", l:"Arms"},
        {v:"shoulders", l:"Shoulders"},
        {v:"forearms_spec", l:"Forearms"},
        {v:"neck_traps", l:"Neck & traps"},
        {v:"glutes_spec", l:"Glutes"},
      ]},
    { id: "athletic_bias", label: "Which end of the athletic hybrid are you closer to?", type: "single",
      dependsOn: a => a.primary_goal === "athletic_hybrid",
      options: [
        {v:"strength_biased", l:"Strength-biased — heavy compounds lead, athletic work is accessory"},
        {v:"balanced", l:"Balanced — traditional lifts, athletic work, and joint prep share equal focus"},
        {v:"athletic_biased", l:"Athletic-biased — carries, sleds, jumps lead; barbell is supportive"},
      ]},
  ]},

  { id: "duration_context", title: "Duration & context", questions: [
    { id: "program_duration_weeks", label: "How many weeks should this program run before we generate a new one?", type: "single",
      options: [
        {v:4, l:"4 weeks (short block — mobility or specialization primer)"},
        {v:8, l:"8 weeks (single block — good for specialization)"},
        {v:12, l:"12 weeks (default — full accumulation + peaking)"},
        {v:16, l:"16 weeks (two 8-week blocks — allows week-alternating periodization)"},
        {v:24, l:"24 weeks (long-term, advanced)"},
      ]},
    { id: "event_date_optional", label: "Is there a specific date driving this? (Optional)", type: "single",
      options: [
        {v:"none", l:"No — just running a cycle"},
        {v:"photoshoot", l:"Photoshoot / physique goal"},
        {v:"competition", l:"Bodybuilding or strength competition"},
        {v:"sport_event", l:"Sport event or athletic test"},
        {v:"wedding_holiday", l:"Wedding, vacation, personal event"},
      ]},
    { id: "training_environment", label: "Where do you train?", type: "single",
      options: [
        {v:"full_gym", l:"Full gym — barbell, dumbbells, machines, cables"},
        {v:"full_gym_plus_strongman", l:"Full gym + strongman gear (sled, tire, farmer)"},
        {v:"home_gym", l:"Home gym — barbell + some equipment"},
        {v:"dumbbells_only", l:"Dumbbells / limited equipment"},
        {v:"bodyweight", l:"Bodyweight only"},
      ]},
    { id: "injury_history", label: "Any current injuries or joint issues to route around?", type: "multi",
      options: [
        {v:"lower_back", l:"Lower back"},
        {v:"knees", l:"Knees"},
        {v:"shoulders_impingement", l:"Shoulders (impingement / rotator cuff)"},
        {v:"elbow", l:"Elbow tendinitis"},
        {v:"wrists_inj", l:"Wrists"},
        {v:"hip_flexor", l:"Hip flexor"},
        {v:"neck_inj", l:"Neck"},
        {v:"recovering_surgery", l:"Recovering from surgery"},
        {v:"none_inj", l:"None"},
      ]},
  ]},

  { id: "lifestyle", title: "Lifestyle", questions: [
    { id: "sleep_quality", label: "How's your sleep on average?", type: "single",
      options: [
        {v:"good", l:"7+ hours, consistent"},
        {v:"ok", l:"6–7 hours"},
        {v:"poor", l:"Under 6 hours or inconsistent"},
      ]},
    { id: "cardio_currently", label: "Are you doing cardio outside of lifting?", type: "single",
      options: [
        {v:"none", l:"None"},
        {v:"1_2_light", l:"1–2×/week light"},
        {v:"3_5_light", l:"3–5×/week light"},
        {v:"hiit", l:"3–5×/week HIIT"},
      ]},
    { id: "cutting_or_bulking", label: "Are you eating for gain, loss, or maintenance?", type: "single",
      options: [
        {v:"bulking", l:"Bulking (surplus)"},
        {v:"maintenance", l:"Maintenance"},
        {v:"cutting_slow", l:"Cutting (slow)"},
        {v:"cutting_aggressive", l:"Cutting (aggressive)"},
      ]},
  ]},
];

// ---------- UI RENDERING ----------

function launchIntake() {
  intakeState = { step: 0, answers: {} };
  const overlay = document.createElement("div");
  overlay.id = "intake-overlay";
  overlay.className = "intake-overlay";
  overlay.innerHTML = `
    <div class="intake-modal">
      <div class="intake-progress"><div class="intake-progress-fill" id="intakeProgressFill"></div></div>
      <div class="intake-body" id="intakeBody"></div>
      <div class="intake-actions">
        <button class="intake-back" id="intakeBackBtn">Back</button>
        <button class="intake-next" id="intakeNextBtn">Next</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("visible"));

  document.getElementById("intakeBackBtn").addEventListener("click", intakeBack);
  document.getElementById("intakeNextBtn").addEventListener("click", intakeNext);

  renderIntakeStep();
}

function renderIntakeStep() {
  const step = INTAKE_STEPS[intakeState.step];
  const body = document.getElementById("intakeBody");
  const backBtn = document.getElementById("intakeBackBtn");
  const nextBtn = document.getElementById("intakeNextBtn");
  const progressFill = document.getElementById("intakeProgressFill");

  progressFill.style.width = `${((intakeState.step + 1) / INTAKE_STEPS.length) * 100}%`;
  backBtn.style.visibility = intakeState.step === 0 ? "hidden" : "visible";
  nextBtn.textContent = intakeState.step === INTAKE_STEPS.length - 1 ? "Generate program" : "Next";

  const visibleQuestions = step.questions.filter(q => !q.dependsOn || q.dependsOn(intakeState.answers));

  body.innerHTML = `
    <div class="intake-step-title">${step.title}</div>
    ${visibleQuestions.map(q => renderQuestion(q)).join("")}
    ${visibleQuestions.length === 0 ? '<div class="intake-empty">No questions in this phase for your setup. Tap Next.</div>' : ''}
  `;

  // Wire question interactions
  visibleQuestions.forEach(q => {
    body.querySelectorAll(`[data-qid="${q.id}"] .intake-opt`).forEach(btn => {
      btn.addEventListener("click", () => handleOptionTap(q, btn));
    });
  });
}

function renderQuestion(q) {
  const value = intakeState.answers[q.id];
  const opts = q.options.map(opt => {
    let selected;
    if (q.type === "single") {
      selected = (value === opt.v);
    } else {
      selected = Array.isArray(value) && value.includes(opt.v);
    }
    return `<button class="intake-opt ${selected ? "selected" : ""}" data-val='${JSON.stringify(opt.v)}'>${opt.l}</button>`;
  }).join("");
  return `<div class="intake-question" data-qid="${q.id}" data-type="${q.type}">
    <div class="intake-q-label">${q.label}</div>
    <div class="intake-opts">${opts}</div>
  </div>`;
}

function handleOptionTap(q, btn) {
  const val = JSON.parse(btn.dataset.val);
  const container = btn.closest(".intake-question");

  if (q.type === "single") {
    intakeState.answers[q.id] = val;
    container.querySelectorAll(".intake-opt").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
  } else if (q.type === "multi" || q.type === "multi_max2") {
    const arr = intakeState.answers[q.id] || [];
    const idx = arr.indexOf(val);
    if (idx >= 0) {
      arr.splice(idx, 1);
      btn.classList.remove("selected");
    } else {
      if (q.type === "multi_max2" && arr.length >= 2) {
        showToast("Pick at most 2");
        return;
      }
      arr.push(val);
      btn.classList.add("selected");
    }
    intakeState.answers[q.id] = arr;
  }

  // If this answer changes step visibility, re-render (for conditional questions)
  if (q.id === "primary_goal" || q.id === "style_layers") {
    renderIntakeStep();
  }
}

function intakeBack() {
  if (intakeState.step > 0) {
    intakeState.step--;
    renderIntakeStep();
  }
}

function intakeNext() {
  const step = INTAKE_STEPS[intakeState.step];
  const visibleQuestions = step.questions.filter(q => !q.dependsOn || q.dependsOn(intakeState.answers));
  const unanswered = visibleQuestions.filter(q => {
    const v = intakeState.answers[q.id];
    if (q.type === "single") return v === undefined || v === null;
    return !Array.isArray(v) || v.length === 0;
  });

  if (unanswered.length > 0 && visibleQuestions.length > 0) {
    // Allow multi (optional) questions to be skipped by not enforcing
    const requiredUnanswered = unanswered.filter(q => q.type === "single");
    if (requiredUnanswered.length > 0) {
      showToast("Answer the highlighted question first");
      return;
    }
  }

  if (intakeState.step < INTAKE_STEPS.length - 1) {
    intakeState.step++;
    renderIntakeStep();
    return;
  }

  // Last step — generate
  finalizeIntake();
}

function finalizeIntake() {
  document.getElementById("intake-overlay").classList.remove("visible");

  // Run the generator
  try {
    const program = generateProgramFromIntake(intakeState.answers);
    const cfg = {
      program_configured: true,
      created_at: new Date().toISOString(),
      source: "generated",
      program_id: program._id || "generated_" + Date.now(),
      weeks_total: intakeState.answers.program_duration_weeks || 12,
      title: program._title || "Custom program",
      intake_answers: intakeState.answers,
    };
    saveActiveProgram(program);
    saveConfig(cfg);
    setTimeout(() => location.reload(), 400);
  } catch (e) {
    console.error("Generator failed:", e);
    showToast("Something went wrong generating your program. Check the console.");
  }
}
