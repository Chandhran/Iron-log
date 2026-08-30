// rehab-routines.js — targeted issue-based mobility / rehab routines with
// linked YouTube video guides. Selected by the user during intake as
// `specific_issues` (multi-select), then rotated across Active Recovery days.
// Solo routines fully replace a rest day (no walk / no other mobility);
// non-solo routines append as an extra task alongside walk / mobility flow.
// Exercise-tied routines (linkedExercises) also render a ▶ Watch routine
// button on matching training-day exercise cards.

var REHAB_ROUTINES = [
  { id: "bss_knee_collapse", label: "Knee collapsing in Bulgarian split squat",
    videoUrl: "https://www.youtube.com/shorts/yMaJKs3g9Cw",
    category: "form", isSolo: false, linkedExercises: ["Bulgarian Split Squat"] },
  { id: "scoliotic_squat", label: "Scoliotic spine, misbalance when squatting",
    videoUrl: "https://www.youtube.com/shorts/Vih1Xj-PCAM",
    category: "form", isSolo: false, linkedExercises: ["Back Squat","Front Squat"] },
  { id: "butt_wink", label: "Butt wink when squatting",
    videoUrl: "https://www.youtube.com/shorts/DuIwAbTYxbQ",
    category: "form", isSolo: false, linkedExercises: ["Back Squat","Front Squat"] },
  { id: "leg_length_disc", label: "Leg length discrepancy",
    videoUrl: "https://www.youtube.com/shorts/WeyGCoBo4PQ",
    category: "posture", isSolo: false, linkedExercises: [] },
  { id: "sciatica", label: "Sciatica",
    videoUrl: "https://www.youtube.com/shorts/bAr2Ysmt5AA",
    category: "pain", isSolo: false, linkedExercises: [] },
  { id: "fullbody_3min", label: "3 minute full body mobility",
    videoUrl: "https://www.youtube.com/shorts/7ALjeymRsjs",
    category: "general", isSolo: false, linkedExercises: [] },
  { id: "rounded_shoulders", label: "Rounded shoulders",
    videoUrl: "https://www.youtube.com/shorts/CoeCtjTEoOU",
    category: "posture", isSolo: false, linkedExercises: [] },
  { id: "falling_back_squat", label: "Falling back when squating",
    videoUrl: "https://www.youtube.com/shorts/8183B0SJ-_w",
    category: "form", isSolo: false, linkedExercises: ["Back Squat","Front Squat"] },
  { id: "wakeup_back_release", label: "after wake up back release routine",
    videoUrl: "https://www.youtube.com/shorts/yBXfUMUh7QE",
    category: "general", isSolo: false, linkedExercises: [] },
  { id: "advanced_mob_str", label: "Advance level mobility & strength",
    videoUrl: "https://www.youtube.com/shorts/vawL_uD2KrA",
    category: "general", isSolo: false, linkedExercises: [] },
  { id: "stiff_forearms", label: "Stiff forearms",
    videoUrl: "https://www.youtube.com/shorts/JTUARv4DFA0",
    category: "pain", isSolo: false, linkedExercises: [] },
  { id: "shoulder_blade_knot", label: "Knot between your shoulder blades",
    videoUrl: "https://www.youtube.com/shorts/PdJMuN1JWx8",
    category: "pain", isSolo: false, linkedExercises: [] },
  { id: "posterior_rehab", label: "Posterior rehab (10 exercises)",
    videoUrl: "https://www.youtube.com/shorts/-PWiV2yecZw",
    category: "rehab", isSolo: true, linkedExercises: [] },
  { id: "leg_rehab_day", label: "Leg Rehab (one day worth of exercises)",
    videoUrl: "https://www.youtube.com/shorts/7mUiGhWgBWg",
    category: "rehab", isSolo: true, linkedExercises: [] },
  { id: "back_rehab", label: "Back rehab (6 exercises)",
    videoUrl: "https://www.youtube.com/shorts/z5Kpd7FH1LI",
    category: "rehab", isSolo: true, linkedExercises: [] },
  { id: "anterior_pelvic_tilt", label: "Anterior pelvic tilt",
    videoUrl: "https://www.youtube.com/shorts/0UJVNiY7ySY",
    category: "posture", isSolo: false, linkedExercises: [] },
  { id: "back_rehab_2", label: "Back rehab 2 (6 exercises)",
    videoUrl: "https://www.youtube.com/shorts/LFbV87V3tEY",
    category: "rehab", isSolo: true, linkedExercises: [] },
  { id: "stiff_ankle", label: "Stiff ankle",
    videoUrl: "https://www.youtube.com/shorts/ic85IbT4IBU",
    category: "pain", isSolo: false, linkedExercises: [] },
  { id: "neck_hump", label: "Neck hump",
    videoUrl: "https://www.youtube.com/shorts/X6dgJFPct4o",
    category: "posture", isSolo: false, linkedExercises: [] },
  { id: "shoulder_blade_knot_2", label: "Knot between your shoulder blades 2",
    videoUrl: "https://www.youtube.com/shorts/CdKn4_d2qwk",
    category: "pain", isSolo: false, linkedExercises: [] },
  { id: "lower_back_pain", label: "Lower back pain & tightness",
    videoUrl: "https://www.youtube.com/shorts/-Mk0Uz1FZOs",
    category: "pain", isSolo: false, linkedExercises: [] },
  { id: "lower_leg_tightness", label: "Lower leg tightness when walking",
    videoUrl: "https://www.youtube.com/shorts/gW9eek5woP0",
    category: "pain", isSolo: false, linkedExercises: [] },
  { id: "hamstring_tightness", label: "Hamstring tightness",
    videoUrl: "https://www.youtube.com/shorts/ROTn35FIYag",
    category: "pain", isSolo: false, linkedExercises: [] },
];

// Injury -> auto-suggested routine ids (also auto-selected on generation).
var INJURY_TO_ROUTINES = {
  lower_back:            ["back_rehab", "back_rehab_2", "lower_back_pain"],
  shoulders_impingement: ["rounded_shoulders", "shoulder_blade_knot", "shoulder_blade_knot_2"],
  neck_inj:              ["neck_hump"],
  wrists_inj:            ["stiff_forearms"],
  knees:                 ["bss_knee_collapse", "leg_rehab_day"],
  hip_flexor:            ["anterior_pelvic_tilt"],
  elbow:                 ["stiff_forearms"],
};

// Injury -> mobility region (also auto-set as region when user has injuries).
var INJURY_TO_REGION = {
  lower_back:            "posture",
  shoulders_impingement: "shoulder",
  neck_inj:              "posture",
  wrists_inj:            "wrist",
  knees:                 "hip",
  hip_flexor:            "hip",
  elbow:                 "shoulder",
};

function getRehabRoutine(id) {
  for (var i = 0; i < REHAB_ROUTINES.length; i++) {
    if (REHAB_ROUTINES[i].id === id) return REHAB_ROUTINES[i];
  }
  return null;
}

function getRehabRoutineForExercise(exerciseName, selectedIds) {
  if (!exerciseName || !selectedIds || !selectedIds.length) return null;
  for (var i = 0; i < selectedIds.length; i++) {
    var r = getRehabRoutine(selectedIds[i]);
    if (r && r.linkedExercises && r.linkedExercises.indexOf(exerciseName) !== -1) return r;
  }
  return null;
}
