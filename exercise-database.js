// Exercise database extracted from the 8-week hypertrophy program.
// Used for: the alternatives/swap system (matched by muscle + movement pattern)
// and as a browsable exercise library. Superset pairs (A1/A2, B1/B2, C1/C2) are
// preserved via supersetGroup so they can be displayed and swapped together.

const EXERCISE_DATABASE = [
  // Legs
  { name: "Back Squat", muscle: "Quadriceps", secondary: ["Glutes"], pattern: "Squat", compound: true },
  { name: "Deadlift", muscle: "Hamstrings", secondary: ["Glutes", "Erector Spinae"], pattern: "Hip Hinge", compound: true },
  { name: "Barbell Hip Thrust", muscle: "Glutes", secondary: ["Hamstrings"], pattern: "Hip Extension", compound: true },
  { name: "Walking Lunge", muscle: "Quadriceps", secondary: ["Glutes"], pattern: "Lunge/Single-Leg", compound: true },
  { name: "Leg Extension", muscle: "Quadriceps", secondary: [], pattern: "Knee Extension", compound: false, supersetGroup: "legs-A1" },
  { name: "Leg Curl", muscle: "Hamstrings", secondary: [], pattern: "Knee Flexion", compound: false, supersetGroup: "legs-A2" },
  { name: "Standing Calf Raise", muscle: "Calves", secondary: [], pattern: "Calf Raise", compound: false },
  { name: "Front Squat", muscle: "Quadriceps", secondary: ["Glutes"], pattern: "Squat", compound: true },
  { name: "Cable Pull Through", muscle: "Glutes", secondary: ["Hamstrings"], pattern: "Hip Hinge", compound: true },
  { name: "Single Leg Press", muscle: "Quadriceps", secondary: ["Glutes"], pattern: "Squat (Unilateral)", compound: true },
  { name: "Single Leg Extension", muscle: "Quadriceps", secondary: [], pattern: "Knee Extension", compound: false },
  { name: "Single Leg Curl", muscle: "Hamstrings", secondary: [], pattern: "Knee Flexion", compound: false },

  // Arms
  { name: "Close Grip Bench Press", muscle: "Triceps Brachii", secondary: ["Pectoralis Major"], pattern: "Horizontal Push", compound: true },
  { name: "Machine Preacher Curl", muscle: "Biceps Brachii", secondary: [], pattern: "Elbow Flexion", compound: false },
  { name: "Standing EZ Bar Curl", muscle: "Biceps Brachii", secondary: [], pattern: "Elbow Flexion", compound: false },
  { name: "Bayesian Cable Curl", muscle: "Biceps Brachii", secondary: [], pattern: "Elbow Flexion", compound: false },
  { name: "Tricep Pressdown", muscle: "Triceps Brachii", secondary: [], pattern: "Elbow Extension", compound: false },
  { name: "Overhead Rope Tricep Extension", muscle: "Triceps Brachii", secondary: [], pattern: "Elbow Extension", compound: false },
  { name: "Forearm Wrist Curl", muscle: "Forearms", secondary: [], pattern: "Wrist Flexion", compound: false },
  { name: "Dumbbell Preacher Hammer Curl", muscle: "Biceps Brachii", secondary: ["Forearms"], pattern: "Elbow Flexion", compound: false },
  { name: "Dumbbell Concentration Curl", muscle: "Biceps Brachii", secondary: [], pattern: "Elbow Flexion", compound: false },
  { name: "Incline Dumbbell Curl 21's", muscle: "Biceps Brachii", secondary: [], pattern: "Elbow Flexion", compound: false },
  { name: "Weighted Dip (Close Grip)", muscle: "Triceps Brachii", secondary: ["Pectoralis Major"], pattern: "Vertical Push (Dip)", compound: true },
  { name: "1-Arm Overhead Cable Extension", muscle: "Triceps Brachii", secondary: [], pattern: "Elbow Extension", compound: false },
  { name: "Reverse Grip Forearm Wrist Curl", muscle: "Forearms", secondary: [], pattern: "Wrist Extension", compound: false },
  { name: "Incline Dumbbell Curl Reverse 21's", muscle: "Biceps Brachii", secondary: [], pattern: "Elbow Flexion", compound: false },
  { name: "Standing EZ Bar Curl (Descending ROM)", muscle: "Biceps Brachii", secondary: [], pattern: "Elbow Flexion", compound: false },
  { name: "Medicine Ball Pushups", muscle: "Pectoralis Major", secondary: ["Triceps Brachii"], pattern: "Horizontal Push", compound: true },
  { name: "Hammer Curl", muscle: "Biceps Brachii", secondary: ["Forearms"], pattern: "Elbow Flexion", compound: false },
  { name: "Preacher Death Curls", muscle: "Biceps Brachii", secondary: [], pattern: "Elbow Flexion", compound: false },
  { name: "Heavy Negative Concentration Curls", muscle: "Biceps Brachii", secondary: [], pattern: "Elbow Flexion", compound: false },
  { name: "Scott Curl", muscle: "Biceps Brachii", secondary: [], pattern: "Elbow Flexion", compound: false },
  { name: "Lying Incline Death Curls", muscle: "Biceps Brachii", secondary: [], pattern: "Elbow Flexion", compound: false },
  { name: "Reverse Grip EZ Bar Curl (Metabolic)", muscle: "Biceps Brachii", secondary: ["Forearms"], pattern: "Elbow Flexion", compound: false },
  { name: "Farmers Walks", muscle: "Trapezius", secondary: ["Forearms"], pattern: "Loaded Carry", compound: true },

  // Chest
  { name: "Bench Press", muscle: "Pectoralis Major", secondary: ["Anterior Deltoid", "Triceps Brachii"], pattern: "Horizontal Push", compound: true },
  { name: "Incline Dumbbell Press", muscle: "Pectoralis Major", secondary: ["Anterior Deltoid"], pattern: "Horizontal Push", compound: true },
  { name: "Banded Pushup", muscle: "Pectoralis Major", secondary: ["Triceps Brachii"], pattern: "Horizontal Push", compound: true },
  { name: "Flat Dumbbell Static Hold", muscle: "Pectoralis Major", secondary: [], pattern: "Isometric", compound: false },
  { name: "Bayesian Cable Flye", muscle: "Pectoralis Major", secondary: [], pattern: "Horizontal Adduction (Fly)", compound: false },
  { name: "Bodyweight Dip", muscle: "Pectoralis Major", secondary: ["Triceps Brachii"], pattern: "Vertical Push (Dip)", compound: true },

  // Back
  { name: "Rack Pull (Below Knee)", muscle: "Erector Spinae", secondary: ["Latissimus Dorsi", "Hamstrings"], pattern: "Hip Hinge (Partial)", compound: true },
  { name: "1-Arm Lat Pull In", muscle: "Latissimus Dorsi", secondary: [], pattern: "Vertical Pull (Isolation)", compound: false },
  { name: "Wide Grip Pull Up", muscle: "Latissimus Dorsi", secondary: ["Biceps Brachii"], pattern: "Vertical Pull", compound: true },
  { name: "Chest Supported T-Bar Row", muscle: "Rhomboids", secondary: ["Latissimus Dorsi"], pattern: "Horizontal Pull", compound: true },
  { name: "Half Kneeling Moto Row", muscle: "Latissimus Dorsi", secondary: ["Rhomboids"], pattern: "Horizontal Pull (Unilateral)", compound: false, supersetGroup: "moto-B1" },
  { name: "Half Lying Moto Row", muscle: "Latissimus Dorsi", secondary: ["Rhomboids"], pattern: "Horizontal Pull (Unilateral)", compound: false, supersetGroup: "moto-B2" },
  { name: "Rope Facepull (Scapular Retraction)", muscle: "Posterior Deltoid", secondary: ["Rhomboids"], pattern: "Horizontal Pull (Rear Delt)", compound: false },
  { name: "Rope Pullover", muscle: "Latissimus Dorsi", secondary: ["Triceps Brachii"], pattern: "Shoulder Extension (Pullover)", compound: false },
  { name: "Bent Over Barbell Row (7's)", muscle: "Latissimus Dorsi", secondary: ["Rhomboids"], pattern: "Horizontal Pull", compound: true },
  { name: "Close Grip Seated Cable Row", muscle: "Latissimus Dorsi", secondary: ["Rhomboids"], pattern: "Horizontal Pull", compound: false },
  { name: "Omni-Grip Lat Pulldown", muscle: "Latissimus Dorsi", secondary: ["Biceps Brachii"], pattern: "Vertical Pull", compound: true },
  { name: "Cable Rope Upright Row", muscle: "Lateral Deltoid", secondary: ["Trapezius"], pattern: "Vertical Pull (Upright Row)", compound: false, supersetGroup: "backc-C1" },
  { name: "Rope Facepull (External Rotation)", muscle: "Posterior Deltoid", secondary: ["Rhomboids"], pattern: "Horizontal Pull (Rear Delt)", compound: false, supersetGroup: "backc-C2" },
  { name: "Lower Back Extension (Reverse Pyramid)", muscle: "Erector Spinae", secondary: ["Glutes"], pattern: "Hip Extension", compound: false },
  { name: "Power Shrug", muscle: "Trapezius", secondary: [], pattern: "Shrug", compound: true },
  { name: "Wide Grip Lat Pulldown", muscle: "Latissimus Dorsi", secondary: ["Biceps Brachii"], pattern: "Vertical Pull", compound: true },
  { name: "Smith Machine Row", muscle: "Latissimus Dorsi", secondary: ["Rhomboids"], pattern: "Horizontal Pull", compound: true },

  // Shoulders
  { name: "Cable External Rotation", muscle: "Posterior Deltoid", secondary: [], pattern: "Shoulder External Rotation", compound: false },
  { name: "Standing Overhead Barbell Press", muscle: "Anterior Deltoid", secondary: ["Triceps Brachii"], pattern: "Vertical Push", compound: true },
  { name: "Lean-Away Cable Lateral Raise", muscle: "Lateral Deltoid", secondary: [], pattern: "Shoulder Abduction", compound: false },
  { name: "Incline Dumbbell Lateral Hold", muscle: "Lateral Deltoid", secondary: [], pattern: "Isometric (Lateral)", compound: false, supersetGroup: "shoulder1-A1" },
  { name: "Banded Lateral Raise", muscle: "Lateral Deltoid", secondary: [], pattern: "Shoulder Abduction", compound: false, supersetGroup: "shoulder1-A2" },
  { name: "Reverse Pec Deck", muscle: "Posterior Deltoid", secondary: [], pattern: "Horizontal Abduction (Rear Delt)", compound: false },
  { name: "Rope Facepull", muscle: "Posterior Deltoid", secondary: ["Trapezius"], pattern: "Horizontal Pull (Rear Delt)", compound: false },
  { name: "Rope Upright Row", muscle: "Lateral Deltoid", secondary: ["Trapezius"], pattern: "Vertical Pull (Upright Row)", compound: false },
  { name: "Dumbbell Lateral Raise", muscle: "Lateral Deltoid", secondary: [], pattern: "Shoulder Abduction", compound: false },
  { name: "Wide Grip Seated Cable Row", muscle: "Rhomboids", secondary: ["Posterior Deltoid"], pattern: "Horizontal Pull", compound: false, supersetGroup: "shoulder2-A1" },
  { name: "Bent Over Dumbbell Reverse Flye", muscle: "Posterior Deltoid", secondary: ["Rhomboids"], pattern: "Horizontal Abduction (Rear Delt)", compound: false, supersetGroup: "shoulder2-A2" },
  { name: "Standing Dumbbell Press", muscle: "Anterior Deltoid", secondary: ["Triceps Brachii"], pattern: "Vertical Push", compound: true },
  { name: "Dumbbell Lateral Raise (Myo-Rep)", muscle: "Lateral Deltoid", secondary: [], pattern: "Shoulder Abduction", compound: false },
  { name: "Reverse Pec Deck (Pulse)", muscle: "Posterior Deltoid", secondary: [], pattern: "Horizontal Abduction (Rear Delt)", compound: false },

  // Neck & Trap
  { name: "Overhead Shrug", muscle: "Trapezius", secondary: [], pattern: "Shrug", compound: false },
  { name: "Plate Loaded Forward Neck Curl", muscle: "Neck (Cervical)", secondary: [], pattern: "Neck Flexion", compound: false },
  { name: "Harness Loaded Neck Extension", muscle: "Neck (Cervical)", secondary: [], pattern: "Neck Extension", compound: false },
  { name: "Upright Row", muscle: "Lateral Deltoid", secondary: ["Trapezius"], pattern: "Vertical Pull (Upright Row)", compound: false },
  { name: "Monkey Shrug", muscle: "Trapezius", secondary: [], pattern: "Shrug", compound: false },
  { name: "Plate Loaded Neck Extension", muscle: "Neck (Cervical)", secondary: [], pattern: "Neck Extension", compound: false },
  { name: "Wide Grip Barbell Shrug", muscle: "Trapezius", secondary: [], pattern: "Shrug", compound: true },
  { name: "Rope Lying Shrug", muscle: "Trapezius", secondary: [], pattern: "Shrug", compound: false },
];

// Group superset partners for display (A1+A2, B1+B2, C1+C2 shown/swapped together)
const SUPERSET_PARTNERS = {};
(function buildSupersetPartners() {
  const groups = {};
  EXERCISE_DATABASE.forEach(ex => {
    if (!ex.supersetGroup) return;
    const base = ex.supersetGroup.replace(/-[A-Z]\d$/, ""); // "legs-A1" -> "legs"
    groups[base] = groups[base] || [];
    groups[base].push(ex.name);
  });
  Object.values(groups).forEach(names => {
    names.forEach(n => { SUPERSET_PARTNERS[n] = names.filter(x => x !== n); });
  });
})();
