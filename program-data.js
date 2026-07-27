// Program data pulled directly from the Notion "Week 1 (STRENGTH)" and
// "Week 2 (HYPERTROPHY)" pages. These two templates alternate across the
// full 16-week block: odd weeks = strength, even weeks = hypertrophy.

const PROGRAM = {
  strength: {
    key: "strength",
    label: "Strength",
    days: [
      { name: "Monday", title: "Functional A (Strength)", type: "training", exercises: [
        { name: "Backward Sled Drag", target: "4×20–30m", sets: 4, muscle: "Quadriceps", secondary: ["Glutes"] },
        { name: "Forward Sled Drag", target: "3×20m", sets: 3, muscle: "Hamstrings", secondary: ["Glutes"] },
        { name: "Reverse Squat (Tibialis)", target: "4×10", sets: 4, muscle: "Tibialis Anterior", secondary: [] },
        { name: "Tibialis Toe Walks", target: "3×25m", sets: 3, muscle: "Tibialis Anterior", secondary: [] },
        { name: "ATG Split Squat", target: "3×6 each", sets: 3, muscle: "Quadriceps", secondary: ["Glutes"] },
        { name: "Hip Airplanes", target: "2×5 each", sets: 2, muscle: "Glutes", secondary: ["Adductors"] },
        { name: "Cossack Squat", target: "2×6 each", sets: 2, muscle: "Adductors", secondary: ["Quadriceps", "Glutes"] },
        { name: "Trap-3 Raise", target: "3×8", sets: 3, muscle: "Trapezius", secondary: ["Posterior Deltoid"] },
        { name: "Superman Hold", target: "3×6 sec", sets: 3, muscle: "Erector Spinae", secondary: ["Glutes"] },
        { name: "Hammer Curl", target: "2×12", sets: 2, muscle: "Biceps Brachii", secondary: ["Triceps Brachii"] },
        { name: "Rope Pushdown", target: "2×12–15", sets: 2, muscle: "Triceps Brachii", secondary: ["Anterior Deltoid"] },
      ]},
      { name: "Tuesday", title: "Active Rest", type: "rest", tasks: [
        { task: "1 hr treadmill walk", notes: "Morning" },
        { task: "1 hr home treadmill walk", notes: "Evening" },
        { task: "Hip mobility", notes: "5 min" },
        { task: "Skipping optional", notes: "5–10 min" },
      ]},
      { name: "Wednesday", title: "Upper Strength", type: "training", exercises: [
        { name: "Incline DB Press", target: "4×5", sets: 4, muscle: "Pectoralis Major", secondary: ["Anterior Deltoid", "Triceps Brachii"] },
        { name: "Chest Dips (Forward Lean)", target: "2×5–6", sets: 2, muscle: "Pectoralis Major", secondary: ["Triceps Brachii", "Anterior Deltoid"] },
        { name: "Sternum Pull-up", target: "4×3–5", sets: 4, muscle: "Latissimus Dorsi", secondary: ["Biceps Brachii", "Rhomboids"] },
        { name: "Chest-Supported Row", target: "4×5", sets: 4, muscle: "Rhomboids", secondary: ["Biceps Brachii", "Latissimus Dorsi"] },
        { name: "Barbell Shrug", target: "3×6", sets: 3, muscle: "Trapezius", secondary: ["Rhomboids"] },
        { name: "Face Pull", target: "3×8", sets: 3, muscle: "Posterior Deltoid", secondary: ["Trapezius", "Rhomboids"] },
        { name: "Incline DB Curl", target: "3×6", sets: 3, muscle: "Biceps Brachii", secondary: [] },
        { name: "Overhead Rope Extension", target: "3×6–8", sets: 3, muscle: "Triceps Brachii", secondary: [] },
      ]},
      { name: "Thursday", title: "Push Strength", type: "training", exercises: [
        { name: "Overhead Press", target: "4×3", sets: 4, muscle: "Anterior Deltoid", secondary: ["Lateral Deltoid", "Triceps Brachii"] },
        { name: "Lateral Raises", target: "4×10", sets: 4, muscle: "Lateral Deltoid", secondary: ["Anterior Deltoid"] },
        { name: "Machine Shoulder Press", target: "3×6", sets: 3, muscle: "Anterior Deltoid", secondary: ["Lateral Deltoid", "Triceps Brachii"] },
        { name: "Skull Crushers", target: "3×6", sets: 3, muscle: "Triceps Brachii", secondary: [] },
        { name: "Rope Pushdown", target: "2×10", sets: 2, muscle: "Triceps Brachii", secondary: ["Anterior Deltoid"] },
      ]},
      { name: "Friday", title: "Functional B (Strength)", type: "training", exercises: [
        { name: "Tire Flip", target: "5×3", sets: 5, muscle: "Quadriceps", secondary: ["Glutes", "Erector Spinae"] },
        { name: "Farmer Carry", target: "4×25m", sets: 4, muscle: "Trapezius", secondary: ["Erector Spinae"] },
        { name: "Sled Push", target: "4×20m", sets: 4, muscle: "Quadriceps", secondary: ["Glutes"] },
        { name: "KB Swing", target: "3×8", sets: 3, muscle: "Glutes", secondary: ["Hamstrings", "Erector Spinae"] },
        { name: "Jefferson Curl", target: "3×5", sets: 3, muscle: "Erector Spinae", secondary: ["Hamstrings"] },
        { name: "Neck Wall Hold", target: "3×5 sec", sets: 3, muscle: "Neck (Cervical)", secondary: [] },
        { name: "Battle Rope Slams", target: "3×10", sets: 3, muscle: "Deltoids", secondary: ["Rectus Abdominis"] },
      ]},
      { name: "Saturday", title: "Legs + Chest + Arms", type: "training", exercises: [
        { name: "Front Squat", target: "4×3", sets: 4, muscle: "Quadriceps", secondary: ["Glutes"] },
        { name: "Romanian Deadlift", target: "4×5", sets: 4, muscle: "Hamstrings", secondary: ["Glutes", "Erector Spinae"] },
        { name: "Step-ups", target: "3×6 each", sets: 3, muscle: "Quadriceps", secondary: ["Glutes", "Hamstrings"] },
        { name: "Back Extension", target: "3×10", sets: 3, muscle: "Erector Spinae", secondary: ["Glutes", "Hamstrings"] },
        { name: "Flat DB Press", target: "3×6–8", sets: 3, muscle: "Pectoralis Major", secondary: ["Anterior Deltoid", "Triceps Brachii"] },
        { name: "Cable Chest Fly", target: "3×10–12", sets: 3, muscle: "Pectoralis Major", secondary: ["Anterior Deltoid"] },
        { name: "Wide-Grip Cable Curl", target: "3×12–15", sets: 3, muscle: "Biceps Brachii", secondary: [] },
        { name: "Preacher Curl", target: "2×12", sets: 2, muscle: "Biceps Brachii", secondary: [] },
        { name: "Cable Kickbacks", target: "3×12–15", sets: 3, muscle: "Triceps Brachii", secondary: [] },
      ]},
      { name: "Sunday", title: "Rest", type: "rest", tasks: [
        { task: "Walking (light)", notes: "Optional" },
        { task: "Hip Mobility", notes: "5 min" },
        { task: "1 Hour Sauna", notes: "Afternoon / Evening" },
        { task: "Recovery", notes: "No strength work" },
      ]},
    ]
  },

  hypertrophy: {
    key: "hypertrophy",
    label: "Hypertrophy",
    days: [
      { name: "Monday", title: "Functional A (Hypertrophy)", type: "training", exercises: [
        { name: "Backward Sled Drag", target: "3×40–60m", sets: 3, muscle: "Quadriceps", secondary: ["Glutes"] },
        { name: "Forward Sled March", target: "3×40m", sets: 3, muscle: "Hamstrings", secondary: ["Glutes"] },
        { name: "Tibialis Raises", target: "4×15", sets: 4, muscle: "Tibialis Anterior", secondary: [] },
        { name: "Tibialis Toe Walks", target: "2×30m", sets: 2, muscle: "Tibialis Anterior", secondary: [] },
        { name: "ATG Split Squat", target: "3×10–12 each", sets: 3, muscle: "Quadriceps", secondary: ["Glutes"] },
        { name: "Cossack Squat", target: "3×10 each", sets: 3, muscle: "Adductors", secondary: ["Quadriceps", "Glutes"] },
        { name: "Hanging Knee Raise", target: "3×12–15", sets: 3, muscle: "Rectus Abdominis", secondary: ["Adductors"] },
        { name: "Battle Rope Waves", target: "3×20 sec", sets: 3, muscle: "Deltoids", secondary: ["Rectus Abdominis"] },
        { name: "Hammer Curl", target: "2×15", sets: 2, muscle: "Biceps Brachii", secondary: ["Triceps Brachii"] },
        { name: "Rope Pushdown", target: "2×15", sets: 2, muscle: "Triceps Brachii", secondary: ["Anterior Deltoid"] },
      ]},
      { name: "Tuesday", title: "Active Rest", type: "rest", tasks: [
        { task: "1 hr treadmill walk", notes: "Morning" },
        { task: "1 hr home treadmill walk", notes: "Evening" },
        { task: "Hip Mobility", notes: "5–7 min" },
        { task: "Skipping (optional)", notes: "5–10 min" },
      ]},
      { name: "Wednesday", title: "Upper Hypertrophy", type: "training", exercises: [
        { name: "Incline DB Fly", target: "3×12–15", sets: 3, muscle: "Pectoralis Major", secondary: ["Anterior Deltoid"] },
        { name: "Flat DB Press", target: "3×10–12", sets: 3, muscle: "Pectoralis Major", secondary: ["Anterior Deltoid", "Triceps Brachii"] },
        { name: "Decline Push-ups", target: "2×AMRAP", sets: 2, muscle: "Pectoralis Major", secondary: ["Triceps Brachii", "Anterior Deltoid"] },
        { name: "Sternum Pull-up", target: "4×6–8", sets: 4, muscle: "Latissimus Dorsi", secondary: ["Biceps Brachii", "Rhomboids"] },
        { name: "Meadows Row", target: "4×10", sets: 4, muscle: "Latissimus Dorsi", secondary: ["Biceps Brachii", "Rhomboids"] },
        { name: "Trap-3 Raise", target: "3×12–15", sets: 3, muscle: "Trapezius", secondary: ["Posterior Deltoid"] },
        { name: "Preacher Curl", target: "3×12–15", sets: 3, muscle: "Biceps Brachii", secondary: [] },
        { name: "Rope Overhead Extension", target: "3×12–15", sets: 3, muscle: "Triceps Brachii", secondary: [] },
      ]},
      { name: "Thursday", title: "Push Hypertrophy", type: "training", exercises: [
        { name: "DB Shoulder Press", target: "4×12", sets: 4, muscle: "Anterior Deltoid", secondary: ["Lateral Deltoid", "Triceps Brachii"] },
        { name: "Lateral Raises", target: "3×20", sets: 3, muscle: "Lateral Deltoid", secondary: ["Anterior Deltoid"] },
        { name: "Machine Shoulder Press", target: "3×12", sets: 3, muscle: "Anterior Deltoid", secondary: ["Lateral Deltoid", "Triceps Brachii"] },
        { name: "Cable Overhead Extension", target: "4×12–15", sets: 4, muscle: "Triceps Brachii", secondary: [] },
        { name: "Rope Pushdown", target: "3×12–15", sets: 3, muscle: "Triceps Brachii", secondary: ["Anterior Deltoid"] },
        { name: "Dips (bodyweight)", target: "2×AMRAP", sets: 2, muscle: "Pectoralis Major", secondary: ["Triceps Brachii", "Anterior Deltoid"] },
        { name: "Push-up Isometric Hold", target: "1×30 sec", sets: 1, muscle: "Pectoralis Major", secondary: ["Anterior Deltoid", "Rectus Abdominis"] },
      ]},
      { name: "Friday", title: "Functional B (Hypertrophy)", type: "training", exercises: [
        { name: "Tire Drag / Pull", target: "3×30–40m", sets: 3, muscle: "Quadriceps", secondary: ["Glutes", "Erector Spinae"] },
        { name: "Farmer Carry", target: "3×40–60m", sets: 3, muscle: "Trapezius", secondary: ["Erector Spinae"] },
        { name: "Sled Push", target: "3×40m", sets: 3, muscle: "Quadriceps", secondary: ["Glutes"] },
        { name: "KB Swing", target: "3×15", sets: 3, muscle: "Glutes", secondary: ["Hamstrings", "Erector Spinae"] },
        { name: "Back Extension", target: "3×15–20", sets: 3, muscle: "Erector Spinae", secondary: ["Glutes", "Hamstrings"] },
        { name: "Neck Assisted Raises", target: "3×12", sets: 3, muscle: "Neck (Cervical)", secondary: [] },
        { name: "Battle Rope Waves", target: "3×20 sec", sets: 3, muscle: "Deltoids", secondary: ["Rectus Abdominis"] },
      ]},
      { name: "Saturday", title: "Lower + Chest + Arms Hypertrophy", type: "training", exercises: [
        { name: "Heel-Elevated Squat", target: "4×12", sets: 4, muscle: "Quadriceps", secondary: ["Glutes"] },
        { name: "Romanian Deadlift", target: "4×12", sets: 4, muscle: "Hamstrings", secondary: ["Glutes", "Erector Spinae"] },
        { name: "Leg Press (Quads)", target: "3×15", sets: 3, muscle: "Quadriceps", secondary: ["Glutes"] },
        { name: "Back Extension", target: "3×15–20", sets: 3, muscle: "Erector Spinae", secondary: ["Glutes", "Hamstrings"] },
        { name: "Calf Raises", target: "3×15–20", sets: 3, muscle: "Calves", secondary: [] },
        { name: "Cable Chest Fly", target: "3×12–15", sets: 3, muscle: "Pectoralis Major", secondary: ["Anterior Deltoid"] },
        { name: "Machine Chest Press", target: "3×10–12", sets: 3, muscle: "Pectoralis Major", secondary: ["Anterior Deltoid", "Triceps Brachii"] },
        { name: "Cable Curl", target: "3×12–15", sets: 3, muscle: "Biceps Brachii", secondary: [] },
        { name: "Cross-body Hammer Curl", target: "2×15", sets: 2, muscle: "Biceps Brachii", secondary: ["Triceps Brachii"] },
        { name: "Cable Kickbacks", target: "3×12–15", sets: 3, muscle: "Triceps Brachii", secondary: [] },
      ]},
      { name: "Sunday", title: "Rest (Holon Day)", type: "rest", tasks: [
        { task: "Walking (light)", notes: "Optional" },
        { task: "Hip Mobility", notes: "5 min" },
        { task: "Holon", notes: "Added as requested" },
        { task: "Recovery", notes: "No strength work" },
      ]},
    ]
  }
};

const TOTAL_WEEKS = 16;

// Anatomical muscle metadata: primary color + a lighter glow variant used for
// secondary/assisting muscles, which body silhouette view shows it, and which
// region id on that silhouette lights up (see body-diagrams.js)
const MUSCLE_INFO = {
  "Pectoralis Major":   { color: "#FF6B4A", light: "#FFB09C", view: "front", region: "chest" },
  "Latissimus Dorsi":   { color: "#4A9EFF", light: "#A8CFFF", view: "back",  region: "lats" },
  "Trapezius":          { color: "#37D6C4", light: "#9CEEE3", view: "back",  region: "traps" },
  "Rhomboids":          { color: "#2BB3A3", light: "#8FDCD0", view: "back",  region: "rhomboids" },
  "Erector Spinae":     { color: "#5C7CFA", light: "#B0BFFD", view: "back",  region: "erectors" },
  "Anterior Deltoid":   { color: "#FFC94A", light: "#FFE49C", view: "front", region: "delt" },
  "Lateral Deltoid":    { color: "#FFB020", light: "#FFD584", view: "front", region: "delt" },
  "Posterior Deltoid":  { color: "#E69500", light: "#FFC670", view: "back",  region: "delt-rear" },
  "Deltoids":           { color: "#FFC94A", light: "#FFE49C", view: "front", region: "delt" },
  "Biceps Brachii":     { color: "#B368E0", light: "#DDB6F2", view: "front", region: "biceps" },
  "Triceps Brachii":    { color: "#E056A0", light: "#F4B3D6", view: "back",  region: "triceps" },
  "Quadriceps":         { color: "#4ACF6B", light: "#A0E8B4", view: "front", region: "quads" },
  "Hamstrings":         { color: "#2E9E52", light: "#8ED2A5", view: "back",  region: "hamstrings" },
  "Glutes":             { color: "#8BCF4A", light: "#C9E8A0", view: "back",  region: "glutes" },
  "Adductors":          { color: "#3FB88A", light: "#9BDFC4", view: "front", region: "adductors" },
  "Calves":             { color: "#257A4A", light: "#7DB897", view: "back",  region: "calves" },
  "Tibialis Anterior":  { color: "#38B27A", light: "#95DBBB", view: "front", region: "tibialis" },
  "Rectus Abdominis":   { color: "#3EC6E0", light: "#9CE4F0", view: "front", region: "abs" },
  "Neck (Cervical)":    { color: "#8A93A8", light: "#C5CBD8", view: "front", region: "neck" },
  "Full Body":          { color: "#FF5A3C", light: "#FFAD9C", view: "front", region: "fullbody" },
};

// Display order for the weekly muscle calculator
const MUSCLE_ORDER = [
  "Pectoralis Major", "Latissimus Dorsi", "Trapezius", "Rhomboids", "Erector Spinae",
  "Anterior Deltoid", "Lateral Deltoid", "Posterior Deltoid",
  "Biceps Brachii", "Triceps Brachii",
  "Quadriceps", "Hamstrings", "Glutes", "Adductors", "Calves", "Tibialis Anterior",
  "Rectus Abdominis", "Neck (Cervical)",
];

// Odd weeks -> strength, even weeks -> hypertrophy
function phaseForWeek(week) {
  return (week % 2 === 1) ? "strength" : "hypertrophy";
}
