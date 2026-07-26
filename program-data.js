// Program data pulled directly from the Notion "Week 1 (STRENGTH)" and
// "Week 2 (HYPERTROPHY)" pages. These two templates alternate across the
// full 16-week block: odd weeks = strength, even weeks = hypertrophy.

const PROGRAM = {
  strength: {
    key: "strength",
    label: "Strength",
    days: [
      { name: "Monday", title: "Functional A (Strength)", type: "training", exercises: [
        { name: "Backward Sled Drag", target: "4×20–30m", sets: 4, muscle: "Quadriceps" },
        { name: "Forward Sled Drag", target: "3×20m", sets: 3, muscle: "Hamstrings" },
        { name: "Reverse Squat (Tibialis)", target: "4×10", sets: 4, muscle: "Tibialis Anterior" },
        { name: "Tibialis Toe Walks", target: "3×25m", sets: 3, muscle: "Tibialis Anterior" },
        { name: "ATG Split Squat", target: "3×6 each", sets: 3, muscle: "Quadriceps" },
        { name: "Hip Airplanes", target: "2×5 each", sets: 2, muscle: "Glutes" },
        { name: "Cossack Squat", target: "2×6 each", sets: 2, muscle: "Adductors" },
        { name: "Trap-3 Raise", target: "3×8", sets: 3, muscle: "Trapezius" },
        { name: "Superman Hold", target: "3×6 sec", sets: 3, muscle: "Erector Spinae" },
        { name: "Hammer Curl", target: "2×12", sets: 2, muscle: "Biceps Brachii" },
        { name: "Rope Pushdown", target: "2×12–15", sets: 2, muscle: "Triceps Brachii" },
      ]},
      { name: "Tuesday", title: "Active Rest", type: "rest", tasks: [
        { task: "1 hr treadmill walk", notes: "Morning" },
        { task: "1 hr home treadmill walk", notes: "Evening" },
        { task: "Hip mobility", notes: "5 min" },
        { task: "Skipping optional", notes: "5–10 min" },
      ]},
      { name: "Wednesday", title: "Upper Strength", type: "training", exercises: [
        { name: "Incline DB Press", target: "4×5", sets: 4, muscle: "Pectoralis Major" },
        { name: "Chest Dips (Forward Lean)", target: "2×5–6", sets: 2, muscle: "Pectoralis Major" },
        { name: "Sternum Pull-up", target: "4×3–5", sets: 4, muscle: "Latissimus Dorsi" },
        { name: "Chest-Supported Row", target: "4×5", sets: 4, muscle: "Rhomboids" },
        { name: "Barbell Shrug", target: "3×6", sets: 3, muscle: "Trapezius" },
        { name: "Face Pull", target: "3×8", sets: 3, muscle: "Posterior Deltoid" },
        { name: "Incline DB Curl", target: "3×6", sets: 3, muscle: "Biceps Brachii" },
        { name: "Overhead Rope Extension", target: "3×6–8", sets: 3, muscle: "Triceps Brachii" },
      ]},
      { name: "Thursday", title: "Push Strength", type: "training", exercises: [
        { name: "Overhead Press", target: "4×3", sets: 4, muscle: "Anterior Deltoid" },
        { name: "Lateral Raises", target: "4×10", sets: 4, muscle: "Lateral Deltoid" },
        { name: "Machine Shoulder Press", target: "3×6", sets: 3, muscle: "Anterior Deltoid" },
        { name: "Skull Crushers", target: "3×6", sets: 3, muscle: "Triceps Brachii" },
        { name: "Rope Pushdown", target: "2×10", sets: 2, muscle: "Triceps Brachii" },
      ]},
      { name: "Friday", title: "Functional B (Strength)", type: "training", exercises: [
        { name: "Tire Flip", target: "5×3", sets: 5, muscle: "Quadriceps" },
        { name: "Farmer Carry", target: "4×25m", sets: 4, muscle: "Trapezius" },
        { name: "Sled Push", target: "4×20m", sets: 4, muscle: "Quadriceps" },
        { name: "KB Swing", target: "3×8", sets: 3, muscle: "Glutes" },
        { name: "Jefferson Curl", target: "3×5", sets: 3, muscle: "Erector Spinae" },
        { name: "Neck Wall Hold", target: "3×5 sec", sets: 3, muscle: "Neck (Cervical)" },
        { name: "Battle Rope Slams", target: "3×10", sets: 3, muscle: "Deltoids" },
      ]},
      { name: "Saturday", title: "Legs + Chest + Arms", type: "training", exercises: [
        { name: "Front Squat", target: "4×3", sets: 4, muscle: "Quadriceps" },
        { name: "Romanian Deadlift", target: "4×5", sets: 4, muscle: "Hamstrings" },
        { name: "Step-ups", target: "3×6 each", sets: 3, muscle: "Quadriceps" },
        { name: "Back Extension", target: "3×10", sets: 3, muscle: "Erector Spinae" },
        { name: "Flat DB Press", target: "3×6–8", sets: 3, muscle: "Pectoralis Major" },
        { name: "Cable Chest Fly", target: "3×10–12", sets: 3, muscle: "Pectoralis Major" },
        { name: "Wide-Grip Cable Curl", target: "3×12–15", sets: 3, muscle: "Biceps Brachii" },
        { name: "Preacher Curl", target: "2×12", sets: 2, muscle: "Biceps Brachii" },
        { name: "Cable Kickbacks", target: "3×12–15", sets: 3, muscle: "Triceps Brachii" },
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
        { name: "Backward Sled Drag", target: "3×40–60m", sets: 3, muscle: "Quadriceps" },
        { name: "Forward Sled March", target: "3×40m", sets: 3, muscle: "Hamstrings" },
        { name: "Tibialis Raises", target: "4×15", sets: 4, muscle: "Tibialis Anterior" },
        { name: "Tibialis Toe Walks", target: "2×30m", sets: 2, muscle: "Tibialis Anterior" },
        { name: "ATG Split Squat", target: "3×10–12 each", sets: 3, muscle: "Quadriceps" },
        { name: "Cossack Squat", target: "3×10 each", sets: 3, muscle: "Adductors" },
        { name: "Hanging Knee Raise", target: "3×12–15", sets: 3, muscle: "Rectus Abdominis" },
        { name: "Battle Rope Waves", target: "3×20 sec", sets: 3, muscle: "Deltoids" },
        { name: "Hammer Curl", target: "2×15", sets: 2, muscle: "Biceps Brachii" },
        { name: "Rope Pushdown", target: "2×15", sets: 2, muscle: "Triceps Brachii" },
      ]},
      { name: "Tuesday", title: "Active Rest", type: "rest", tasks: [
        { task: "1 hr treadmill walk", notes: "Morning" },
        { task: "1 hr home treadmill walk", notes: "Evening" },
        { task: "Hip Mobility", notes: "5–7 min" },
        { task: "Skipping (optional)", notes: "5–10 min" },
      ]},
      { name: "Wednesday", title: "Upper Hypertrophy", type: "training", exercises: [
        { name: "Incline DB Fly", target: "3×12–15", sets: 3, muscle: "Pectoralis Major" },
        { name: "Flat DB Press", target: "3×10–12", sets: 3, muscle: "Pectoralis Major" },
        { name: "Decline Push-ups", target: "2×AMRAP", sets: 2, muscle: "Pectoralis Major" },
        { name: "Sternum Pull-up", target: "4×6–8", sets: 4, muscle: "Latissimus Dorsi" },
        { name: "Meadows Row", target: "4×10", sets: 4, muscle: "Latissimus Dorsi" },
        { name: "Trap-3 Raise", target: "3×12–15", sets: 3, muscle: "Trapezius" },
        { name: "Preacher Curl", target: "3×12–15", sets: 3, muscle: "Biceps Brachii" },
        { name: "Rope Overhead Extension", target: "3×12–15", sets: 3, muscle: "Triceps Brachii" },
      ]},
      { name: "Thursday", title: "Push Hypertrophy", type: "training", exercises: [
        { name: "DB Shoulder Press", target: "4×12", sets: 4, muscle: "Anterior Deltoid" },
        { name: "Lateral Raises", target: "3×20", sets: 3, muscle: "Lateral Deltoid" },
        { name: "Machine Shoulder Press", target: "3×12", sets: 3, muscle: "Anterior Deltoid" },
        { name: "Cable Overhead Extension", target: "4×12–15", sets: 4, muscle: "Triceps Brachii" },
        { name: "Rope Pushdown", target: "3×12–15", sets: 3, muscle: "Triceps Brachii" },
        { name: "Dips (bodyweight)", target: "2×AMRAP", sets: 2, muscle: "Pectoralis Major" },
        { name: "Push-up Isometric Hold", target: "1×30 sec", sets: 1, muscle: "Pectoralis Major" },
      ]},
      { name: "Friday", title: "Functional B (Hypertrophy)", type: "training", exercises: [
        { name: "Tire Drag / Pull", target: "3×30–40m", sets: 3, muscle: "Quadriceps" },
        { name: "Farmer Carry", target: "3×40–60m", sets: 3, muscle: "Trapezius" },
        { name: "Sled Push", target: "3×40m", sets: 3, muscle: "Quadriceps" },
        { name: "KB Swing", target: "3×15", sets: 3, muscle: "Glutes" },
        { name: "Back Extension", target: "3×15–20", sets: 3, muscle: "Erector Spinae" },
        { name: "Neck Assisted Raises", target: "3×12", sets: 3, muscle: "Neck (Cervical)" },
        { name: "Battle Rope Waves", target: "3×20 sec", sets: 3, muscle: "Deltoids" },
      ]},
      { name: "Saturday", title: "Lower + Chest + Arms Hypertrophy", type: "training", exercises: [
        { name: "Heel-Elevated Squat", target: "4×12", sets: 4, muscle: "Quadriceps" },
        { name: "Romanian Deadlift", target: "4×12", sets: 4, muscle: "Hamstrings" },
        { name: "Leg Press (Quads)", target: "3×15", sets: 3, muscle: "Quadriceps" },
        { name: "Back Extension", target: "3×15–20", sets: 3, muscle: "Erector Spinae" },
        { name: "Calf Raises", target: "3×15–20", sets: 3, muscle: "Calves" },
        { name: "Cable Chest Fly", target: "3×12–15", sets: 3, muscle: "Pectoralis Major" },
        { name: "Machine Chest Press", target: "3×10–12", sets: 3, muscle: "Pectoralis Major" },
        { name: "Cable Curl", target: "3×12–15", sets: 3, muscle: "Biceps Brachii" },
        { name: "Cross-body Hammer Curl", target: "2×15", sets: 2, muscle: "Biceps Brachii" },
        { name: "Cable Kickbacks", target: "3×12–15", sets: 3, muscle: "Triceps Brachii" },
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

// Anatomical muscle metadata: display color, which body silhouette view shows it,
// and which region id on that silhouette lights up (see body-diagrams.js)
const MUSCLE_INFO = {
  "Pectoralis Major":   { color: "#D4551F", view: "front", region: "chest" },
  "Latissimus Dorsi":   { color: "#7C93A8", view: "back",  region: "lats" },
  "Trapezius":          { color: "#8FA6B8", view: "back",  region: "traps" },
  "Rhomboids":          { color: "#6F8598", view: "back",  region: "rhomboids" },
  "Erector Spinae":     { color: "#5C7280", view: "back",  region: "erectors" },
  "Anterior Deltoid":   { color: "#C9A227", view: "front", region: "delt" },
  "Lateral Deltoid":    { color: "#D4B84A", view: "front", region: "delt" },
  "Posterior Deltoid":  { color: "#B8941F", view: "back",  region: "delt-rear" },
  "Deltoids":           { color: "#C9A227", view: "front", region: "delt" },
  "Biceps Brachii":     { color: "#9B6B9E", view: "front", region: "biceps" },
  "Triceps Brachii":    { color: "#B57EDC", view: "back",  region: "triceps" },
  "Quadriceps":         { color: "#5B8266", view: "front", region: "quads" },
  "Hamstrings":         { color: "#4E7A63", view: "back",  region: "hamstrings" },
  "Glutes":             { color: "#6E8F5B", view: "back",  region: "glutes" },
  "Adductors":          { color: "#7FA06A", view: "front", region: "adductors" },
  "Calves":             { color: "#3F6B52", view: "back",  region: "calves" },
  "Tibialis Anterior":  { color: "#5B8266", view: "front", region: "tibialis" },
  "Rectus Abdominis":   { color: "#5C9EA6", view: "front", region: "abs" },
  "Neck (Cervical)":    { color: "#8A8F98", view: "front", region: "neck" },
  "Full Body":          { color: "#B5461B", view: "front", region: "fullbody" },
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
