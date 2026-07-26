// Program data pulled directly from the Notion "Week 1 (STRENGTH)" and
// "Week 2 (HYPERTROPHY)" pages. These two templates alternate across the
// full 16-week block: odd weeks = strength, even weeks = hypertrophy.

const PROGRAM = {
  strength: {
    key: "strength",
    label: "Strength",
    days: [
      { name: "Monday", title: "Functional A (Strength)", type: "training", exercises: [
        { name: "Backward Sled Drag", target: "4×20–30m", sets: 4, muscle: "Legs" },
        { name: "Forward Sled Drag", target: "3×20m", sets: 3, muscle: "Legs" },
        { name: "Reverse Squat (Tibialis)", target: "4×10", sets: 4, muscle: "Legs" },
        { name: "Tibialis Toe Walks", target: "3×25m", sets: 3, muscle: "Legs" },
        { name: "ATG Split Squat", target: "3×6 each", sets: 3, muscle: "Legs" },
        { name: "Hip Airplanes", target: "2×5 each", sets: 2, muscle: "Legs" },
        { name: "Cossack Squat", target: "2×6 each", sets: 2, muscle: "Legs" },
        { name: "Trap-3 Raise", target: "3×8", sets: 3, muscle: "Back" },
        { name: "Superman Hold", target: "3×6 sec", sets: 3, muscle: "Back" },
        { name: "Hammer Curl", target: "2×12", sets: 2, muscle: "Biceps" },
        { name: "Rope Pushdown", target: "2×12–15", sets: 2, muscle: "Triceps" },
      ]},
      { name: "Tuesday", title: "Active Rest", type: "rest", tasks: [
        { task: "1 hr treadmill walk", notes: "Morning" },
        { task: "1 hr home treadmill walk", notes: "Evening" },
        { task: "Hip mobility", notes: "5 min" },
        { task: "Skipping optional", notes: "5–10 min" },
      ]},
      { name: "Wednesday", title: "Upper Strength", type: "training", exercises: [
        { name: "Incline DB Press", target: "4×5", sets: 4, muscle: "Chest" },
        { name: "Chest Dips (Forward Lean)", target: "2×5–6", sets: 2, muscle: "Chest" },
        { name: "Sternum Pull-up", target: "4×3–5", sets: 4, muscle: "Back" },
        { name: "Chest-Supported Row", target: "4×5", sets: 4, muscle: "Back" },
        { name: "Barbell Shrug", target: "3×6", sets: 3, muscle: "Back" },
        { name: "Face Pull", target: "3×8", sets: 3, muscle: "Shoulders" },
        { name: "Incline DB Curl", target: "3×6", sets: 3, muscle: "Biceps" },
        { name: "Overhead Rope Extension", target: "3×6–8", sets: 3, muscle: "Triceps" },
      ]},
      { name: "Thursday", title: "Push Strength", type: "training", exercises: [
        { name: "Overhead Press", target: "4×3", sets: 4, muscle: "Shoulders" },
        { name: "Lateral Raises", target: "4×10", sets: 4, muscle: "Shoulders" },
        { name: "Machine Shoulder Press", target: "3×6", sets: 3, muscle: "Shoulders" },
        { name: "Skull Crushers", target: "3×6", sets: 3, muscle: "Triceps" },
        { name: "Rope Pushdown", target: "2×10", sets: 2, muscle: "Triceps" },
      ]},
      { name: "Friday", title: "Functional B (Strength)", type: "training", exercises: [
        { name: "Tire Flip", target: "5×3", sets: 5, muscle: "Legs" },
        { name: "Farmer Carry", target: "4×25m", sets: 4, muscle: "Full Body" },
        { name: "Sled Push", target: "4×20m", sets: 4, muscle: "Legs" },
        { name: "KB Swing", target: "3×8", sets: 3, muscle: "Legs" },
        { name: "Jefferson Curl", target: "3×5", sets: 3, muscle: "Back" },
        { name: "Neck Wall Hold", target: "3×5 sec", sets: 3, muscle: "Neck" },
        { name: "Battle Rope Slams", target: "3×10", sets: 3, muscle: "Shoulders" },
      ]},
      { name: "Saturday", title: "Legs + Chest + Arms", type: "training", exercises: [
        { name: "Front Squat", target: "4×3", sets: 4, muscle: "Legs" },
        { name: "Romanian Deadlift", target: "4×5", sets: 4, muscle: "Legs" },
        { name: "Step-ups", target: "3×6 each", sets: 3, muscle: "Legs" },
        { name: "Back Extension", target: "3×10", sets: 3, muscle: "Back" },
        { name: "Flat DB Press", target: "3×6–8", sets: 3, muscle: "Chest" },
        { name: "Cable Chest Fly", target: "3×10–12", sets: 3, muscle: "Chest" },
        { name: "Wide-Grip Cable Curl", target: "3×12–15", sets: 3, muscle: "Biceps" },
        { name: "Preacher Curl", target: "2×12", sets: 2, muscle: "Biceps" },
        { name: "Cable Kickbacks", target: "3×12–15", sets: 3, muscle: "Triceps" },
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
        { name: "Backward Sled Drag", target: "3×40–60m", sets: 3, muscle: "Legs" },
        { name: "Forward Sled March", target: "3×40m", sets: 3, muscle: "Legs" },
        { name: "Tibialis Raises", target: "4×15", sets: 4, muscle: "Legs" },
        { name: "Tibialis Toe Walks", target: "2×30m", sets: 2, muscle: "Legs" },
        { name: "ATG Split Squat", target: "3×10–12 each", sets: 3, muscle: "Legs" },
        { name: "Cossack Squat", target: "3×10 each", sets: 3, muscle: "Legs" },
        { name: "Hanging Knee Raise", target: "3×12–15", sets: 3, muscle: "Core" },
        { name: "Battle Rope Waves", target: "3×20 sec", sets: 3, muscle: "Shoulders" },
        { name: "Hammer Curl", target: "2×15", sets: 2, muscle: "Biceps" },
        { name: "Rope Pushdown", target: "2×15", sets: 2, muscle: "Triceps" },
      ]},
      { name: "Tuesday", title: "Active Rest", type: "rest", tasks: [
        { task: "1 hr treadmill walk", notes: "Morning" },
        { task: "1 hr home treadmill walk", notes: "Evening" },
        { task: "Hip Mobility", notes: "5–7 min" },
        { task: "Skipping (optional)", notes: "5–10 min" },
      ]},
      { name: "Wednesday", title: "Upper Hypertrophy", type: "training", exercises: [
        { name: "Incline DB Fly", target: "3×12–15", sets: 3, muscle: "Chest" },
        { name: "Flat DB Press", target: "3×10–12", sets: 3, muscle: "Chest" },
        { name: "Decline Push-ups", target: "2×AMRAP", sets: 2, muscle: "Chest" },
        { name: "Sternum Pull-up", target: "4×6–8", sets: 4, muscle: "Back" },
        { name: "Meadows Row", target: "4×10", sets: 4, muscle: "Back" },
        { name: "Trap-3 Raise", target: "3×12–15", sets: 3, muscle: "Back" },
        { name: "Preacher Curl", target: "3×12–15", sets: 3, muscle: "Biceps" },
        { name: "Rope Overhead Extension", target: "3×12–15", sets: 3, muscle: "Triceps" },
      ]},
      { name: "Thursday", title: "Push Hypertrophy", type: "training", exercises: [
        { name: "DB Shoulder Press", target: "4×12", sets: 4, muscle: "Shoulders" },
        { name: "Lateral Raises", target: "3×20", sets: 3, muscle: "Shoulders" },
        { name: "Machine Shoulder Press", target: "3×12", sets: 3, muscle: "Shoulders" },
        { name: "Cable Overhead Extension", target: "4×12–15", sets: 4, muscle: "Triceps" },
        { name: "Rope Pushdown", target: "3×12–15", sets: 3, muscle: "Triceps" },
        { name: "Dips (bodyweight)", target: "2×AMRAP", sets: 2, muscle: "Chest" },
        { name: "Push-up Isometric Hold", target: "1×30 sec", sets: 1, muscle: "Chest" },
      ]},
      { name: "Friday", title: "Functional B (Hypertrophy)", type: "training", exercises: [
        { name: "Tire Drag / Pull", target: "3×30–40m", sets: 3, muscle: "Legs" },
        { name: "Farmer Carry", target: "3×40–60m", sets: 3, muscle: "Full Body" },
        { name: "Sled Push", target: "3×40m", sets: 3, muscle: "Legs" },
        { name: "KB Swing", target: "3×15", sets: 3, muscle: "Legs" },
        { name: "Back Extension", target: "3×15–20", sets: 3, muscle: "Back" },
        { name: "Neck Assisted Raises", target: "3×12", sets: 3, muscle: "Neck" },
        { name: "Battle Rope Waves", target: "3×20 sec", sets: 3, muscle: "Shoulders" },
      ]},
      { name: "Saturday", title: "Lower + Chest + Arms Hypertrophy", type: "training", exercises: [
        { name: "Heel-Elevated Squat", target: "4×12", sets: 4, muscle: "Legs" },
        { name: "Romanian Deadlift", target: "4×12", sets: 4, muscle: "Legs" },
        { name: "Leg Press (Quads)", target: "3×15", sets: 3, muscle: "Legs" },
        { name: "Back Extension", target: "3×15–20", sets: 3, muscle: "Back" },
        { name: "Calf Raises", target: "3×15–20", sets: 3, muscle: "Legs" },
        { name: "Cable Chest Fly", target: "3×12–15", sets: 3, muscle: "Chest" },
        { name: "Machine Chest Press", target: "3×10–12", sets: 3, muscle: "Chest" },
        { name: "Cable Curl", target: "3×12–15", sets: 3, muscle: "Biceps" },
        { name: "Cross-body Hammer Curl", target: "2×15", sets: 2, muscle: "Biceps" },
        { name: "Cable Kickbacks", target: "3×12–15", sets: 3, muscle: "Triceps" },
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

// Muscle groups referenced across the program, with a display color per group
const MUSCLE_GROUPS = {
  "Chest": "#D4551F",
  "Back": "#7C93A8",
  "Legs": "#5B8266",
  "Shoulders": "#C9A227",
  "Biceps": "#9B6B9E",
  "Triceps": "#B57EDC",
  "Core": "#5C9EA6",
  "Neck": "#8A8F98",
  "Full Body": "#B5461B",
};

// Fixed display order for the weekly muscle calculator, roughly biggest to smallest
const MUSCLE_ORDER = ["Chest", "Back", "Legs", "Shoulders", "Biceps", "Triceps", "Core", "Neck", "Full Body"];

// Odd weeks -> strength, even weeks -> hypertrophy
function phaseForWeek(week) {
  return (week % 2 === 1) ? "strength" : "hypertrophy";
}
