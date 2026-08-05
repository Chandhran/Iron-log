// exercise-database.js — comprehensive exercise catalog.
// Sourced from powerbuilding programs, full-body high-frequency, all muscle
// specialization programs, women's foundation/optimization/at-home, mobility
// programs, and the user's own routine.
//
// Each exercise carries:
//   name            — canonical display name
//   muscle          — primary muscle (uses MUSCLE_INFO naming)
//   segments        — % contribution per sub-segment (e.g. Upper Chest 60%)
//   secondary       — assisting muscles
//   pattern         — movement pattern label
//   compound        — true if multi-joint
//   location        — gym_required | gym_or_home_gym | home_ok | outdoor_ok | anywhere | specific_facility
//   equipment       — array of gear needed
//   tags            — array of program-family or use tags for filtering
//
// The generator uses this database to pick exercises for a given day/muscle.
// The Train tab's swap feature uses it to offer alternatives by muscle+pattern.

const EXERCISE_DATABASE = [
  // ============================================================
  // CHEST — Pectoralis Major (with segment breakdown)
  // ============================================================
  { name:"Bench Press", muscle:"Pectoralis Major", segments:{Mid:60,Upper:20,Lower:20}, secondary:["Anterior Deltoid","Triceps Brachii"], pattern:"Horizontal Push", compound:true, location:"gym_required", equipment:["barbell","bench"], tags:["strength","hypertrophy","pb","fbhf","chest_spec","bench_spec"] },
  { name:"Barbell Bench Press", muscle:"Pectoralis Major", segments:{Mid:60,Upper:20,Lower:20}, secondary:["Anterior Deltoid","Triceps Brachii"], pattern:"Horizontal Push", compound:true, location:"gym_required", equipment:["barbell","bench"], tags:["strength","hypertrophy"] },
  { name:"Close Grip Bench Press", muscle:"Triceps Brachii", segments:{Long:40,Lateral:40,Medial:20}, secondary:["Pectoralis Major","Anterior Deltoid"], pattern:"Horizontal Push", compound:true, location:"gym_required", equipment:["barbell","bench"], tags:["strength","hypertrophy","arm_spec","chest_spec","pb"] },
  { name:"Pause Bench Press", muscle:"Pectoralis Major", segments:{Mid:60,Upper:20,Lower:20}, secondary:["Anterior Deltoid","Triceps Brachii"], pattern:"Horizontal Push", compound:true, location:"gym_required", equipment:["barbell","bench"], tags:["strength","bench_spec"] },
  { name:"Wide Grip Bench Press", muscle:"Pectoralis Major", segments:{Mid:50,Upper:20,Lower:30}, secondary:["Anterior Deltoid"], pattern:"Horizontal Push", compound:true, location:"gym_required", equipment:["barbell","bench"], tags:["hypertrophy","bench_spec"] },
  { name:"Incline Bench Press", muscle:"Pectoralis Major", segments:{Upper:60,Mid:30,Lower:10}, secondary:["Anterior Deltoid","Triceps Brachii"], pattern:"Horizontal Push", compound:true, location:"gym_required", equipment:["barbell","bench"], tags:["hypertrophy","chest_spec"] },
  { name:"Low Incline Barbell Press", muscle:"Pectoralis Major", segments:{Upper:45,Mid:45,Lower:10}, secondary:["Anterior Deltoid","Triceps Brachii"], pattern:"Horizontal Push", compound:true, location:"gym_required", equipment:["barbell","bench"], tags:["hypertrophy","fbhf"] },
  { name:"Decline Bench Press", muscle:"Pectoralis Major", segments:{Lower:60,Mid:30,Upper:10}, secondary:["Triceps Brachii"], pattern:"Horizontal Push", compound:true, location:"gym_required", equipment:["barbell","bench"], tags:["hypertrophy","fbhf"] },
  { name:"Incline Dumbbell Press", muscle:"Pectoralis Major", segments:{Upper:60,Mid:30,Lower:10}, secondary:["Anterior Deltoid","Triceps Brachii"], pattern:"Horizontal Push", compound:true, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["hypertrophy","strength","pb","chest_spec","fbhf","female_opt"] },
  { name:"Incline DB Press", muscle:"Pectoralis Major", segments:{Upper:60,Mid:30,Lower:10}, secondary:["Anterior Deltoid","Triceps Brachii"], pattern:"Horizontal Push", compound:true, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["hypertrophy","strength","user_routine"] },
  { name:"Flat Dumbbell Press", muscle:"Pectoralis Major", segments:{Mid:55,Upper:25,Lower:20}, secondary:["Anterior Deltoid","Triceps Brachii"], pattern:"Horizontal Push", compound:true, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["hypertrophy","female_opt","female_home"] },
  { name:"Low Incline Dumbbell Press", muscle:"Pectoralis Major", segments:{Upper:45,Mid:45,Lower:10}, secondary:["Anterior Deltoid","Triceps Brachii"], pattern:"Horizontal Push", compound:true, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["hypertrophy","fbhf"] },
  { name:"Flat Dumbbell Static Hold", muscle:"Pectoralis Major", segments:{Mid:50,Upper:25,Lower:25}, secondary:["Anterior Deltoid"], pattern:"Isometric", compound:false, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["chest_spec"] },
  { name:"Machine Chest Press", muscle:"Pectoralis Major", segments:{Mid:60,Upper:20,Lower:20}, secondary:["Anterior Deltoid","Triceps Brachii"], pattern:"Horizontal Push", compound:true, location:"gym_required", equipment:["machine"], tags:["hypertrophy","female_opt"] },
  { name:"Cable Flye", muscle:"Pectoralis Major", segments:{Mid:50,Upper:25,Lower:25}, secondary:[], pattern:"Isolation", compound:false, location:"gym_required", equipment:["cable"], tags:["hypertrophy","female_opt"] },
  { name:"Low to High Cable Flye", muscle:"Pectoralis Major", segments:{Upper:70,Mid:20,Lower:10}, secondary:["Anterior Deltoid"], pattern:"Isolation", compound:false, location:"gym_required", equipment:["cable"], tags:["hypertrophy","fbhf","chest_spec"] },
  { name:"High to Low Cable Flye", muscle:"Pectoralis Major", segments:{Lower:70,Mid:20,Upper:10}, secondary:[], pattern:"Isolation", compound:false, location:"gym_required", equipment:["cable"], tags:["hypertrophy"] },
  { name:"Bayesian Cable Flye", muscle:"Pectoralis Major", segments:{Mid:40,Upper:30,Lower:30}, secondary:[], pattern:"Isolation", compound:false, location:"gym_required", equipment:["cable"], tags:["chest_spec"] },
  { name:"Pec Deck", muscle:"Pectoralis Major", segments:{Mid:60,Upper:20,Lower:20}, secondary:[], pattern:"Isolation", compound:false, location:"gym_required", equipment:["machine"], tags:["hypertrophy","female_opt"] },
  { name:"Dumbbell Flye", muscle:"Pectoralis Major", segments:{Mid:60,Upper:20,Lower:20}, secondary:[], pattern:"Isolation", compound:false, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["hypertrophy"] },
  { name:"Incline Dumbbell Flye", muscle:"Pectoralis Major", segments:{Upper:70,Mid:25,Lower:5}, secondary:[], pattern:"Isolation", compound:false, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["hypertrophy"] },
  { name:"Chest Dip", muscle:"Pectoralis Major", segments:{Lower:60,Mid:25,Upper:15}, secondary:["Triceps Brachii","Anterior Deltoid"], pattern:"Vertical Push (Dip)", compound:true, location:"gym_or_home_gym", equipment:["dip_bar"], tags:["hypertrophy","user_routine"] },
  { name:"Chest Dips (Forward Lean)", muscle:"Pectoralis Major", segments:{Lower:60,Mid:25,Upper:15}, secondary:["Triceps Brachii","Anterior Deltoid"], pattern:"Vertical Push (Dip)", compound:true, location:"gym_or_home_gym", equipment:["dip_bar"], tags:["hypertrophy","user_routine"] },
  { name:"Weighted Chest Dip", muscle:"Pectoralis Major", segments:{Lower:60,Mid:25,Upper:15}, secondary:["Triceps Brachii","Anterior Deltoid"], pattern:"Vertical Push (Dip)", compound:true, location:"gym_or_home_gym", equipment:["dip_bar","weight_belt"], tags:["hypertrophy","chest_spec"] },
  { name:"Bodyweight Dip", muscle:"Pectoralis Major", segments:{Lower:60,Mid:25,Upper:15}, secondary:["Triceps Brachii","Anterior Deltoid"], pattern:"Vertical Push (Dip)", compound:true, location:"gym_or_home_gym", equipment:["dip_bar"], tags:["hypertrophy","chest_spec","fbhf"] },
  { name:"Push Up", muscle:"Pectoralis Major", segments:{Mid:60,Upper:20,Lower:20}, secondary:["Triceps Brachii","Anterior Deltoid"], pattern:"Horizontal Push", compound:true, location:"anywhere", equipment:["bodyweight"], tags:["hypertrophy","female_home","fbhf"] },
  { name:"Banded Pushup", muscle:"Pectoralis Major", segments:{Mid:60,Upper:20,Lower:20}, secondary:["Triceps Brachii","Anterior Deltoid"], pattern:"Horizontal Push", compound:true, location:"home_ok", equipment:["band"], tags:["chest_spec","user_routine"] },
  { name:"Medicine Ball Pushups", muscle:"Pectoralis Major", segments:{Mid:60,Upper:20,Lower:20}, secondary:["Triceps Brachii"], pattern:"Horizontal Push", compound:true, location:"home_ok", equipment:["medicine_ball"], tags:["hypertrophy"] },
  { name:"Incline Push Up", muscle:"Pectoralis Major", segments:{Lower:50,Mid:35,Upper:15}, secondary:["Triceps Brachii"], pattern:"Horizontal Push", compound:true, location:"anywhere", equipment:["bodyweight"], tags:["female_home"] },
  { name:"Decline Push Up", muscle:"Pectoralis Major", segments:{Upper:60,Mid:30,Lower:10}, secondary:["Triceps Brachii","Anterior Deltoid"], pattern:"Horizontal Push", compound:true, location:"anywhere", equipment:["bodyweight"], tags:["female_home"] },
  { name:"Landmine Press", muscle:"Pectoralis Major", segments:{Upper:50,Mid:35,Lower:15}, secondary:["Anterior Deltoid","Triceps Brachii"], pattern:"Vertical Push", compound:true, location:"gym_required", equipment:["barbell","landmine"], tags:["hypertrophy"] },
  { name:"Svend Press", muscle:"Pectoralis Major", segments:{Mid:60,Upper:20,Lower:20}, secondary:[], pattern:"Isolation", compound:false, location:"gym_or_home_gym", equipment:["plate"], tags:["hypertrophy"] },

  // ============================================================
  // BACK — Latissimus Dorsi, Rhomboids, Trapezius, Erector Spinae
  // ============================================================
  { name:"Deadlift", muscle:"Hamstrings", segments:{}, secondary:["Glutes","Erector Spinae","Trapezius","Latissimus Dorsi"], pattern:"Hip Hinge", compound:true, location:"gym_required", equipment:["barbell"], tags:["strength","pb","fbhf","user_routine"] },
  { name:"Barbell Deadlift", muscle:"Hamstrings", segments:{}, secondary:["Glutes","Erector Spinae","Trapezius","Latissimus Dorsi"], pattern:"Hip Hinge", compound:true, location:"gym_required", equipment:["barbell"], tags:["strength"] },
  { name:"Sumo Deadlift", muscle:"Hamstrings", segments:{}, secondary:["Glutes","Adductors","Erector Spinae"], pattern:"Hip Hinge", compound:true, location:"gym_required", equipment:["barbell"], tags:["strength"] },
  { name:"Trap Bar Deadlift", muscle:"Quadriceps", segments:{}, secondary:["Glutes","Hamstrings","Trapezius","Erector Spinae"], pattern:"Hip Hinge", compound:true, location:"gym_required", equipment:["trap_bar"], tags:["strength","user_routine"] },
  { name:"Romanian Deadlift", muscle:"Hamstrings", segments:{}, secondary:["Glutes","Erector Spinae"], pattern:"Hip Hinge", compound:true, location:"gym_or_home_gym", equipment:["barbell"], tags:["strength","hypertrophy","pb","female_opt","user_routine"] },
  { name:"Dumbbell Romanian Deadlift", muscle:"Hamstrings", segments:{}, secondary:["Glutes","Erector Spinae"], pattern:"Hip Hinge", compound:true, location:"gym_or_home_gym", equipment:["dumbbell"], tags:["hypertrophy","female_home"] },
  { name:"Stiff-Leg Deadlift", muscle:"Hamstrings", segments:{}, secondary:["Glutes","Erector Spinae"], pattern:"Hip Hinge", compound:true, location:"gym_required", equipment:["barbell"], tags:["hypertrophy"] },
  { name:"Rack Pull", muscle:"Trapezius", segments:{Upper:70,Mid:20,Lower:10}, secondary:["Erector Spinae","Latissimus Dorsi"], pattern:"Hip Hinge", compound:true, location:"gym_required", equipment:["barbell","rack"], tags:["strength","neck_trap_spec"] },
  { name:"Pull-Up", muscle:"Latissimus Dorsi", segments:{}, secondary:["Biceps Brachii","Rhomboids"], pattern:"Vertical Pull", compound:true, location:"gym_or_home_gym", equipment:["pullup_bar"], tags:["hypertrophy","pb","back_spec"] },
  { name:"Weighted Pull-Up", muscle:"Latissimus Dorsi", segments:{}, secondary:["Biceps Brachii","Rhomboids"], pattern:"Vertical Pull", compound:true, location:"gym_or_home_gym", equipment:["pullup_bar","weight_belt"], tags:["strength","hypertrophy","back_spec","fbhf"] },
  { name:"Chin-Up", muscle:"Latissimus Dorsi", segments:{}, secondary:["Biceps Brachii"], pattern:"Vertical Pull", compound:true, location:"gym_or_home_gym", equipment:["pullup_bar"], tags:["hypertrophy","arm_spec","fbhf"] },
  { name:"Sternum Pull-up", muscle:"Latissimus Dorsi", segments:{}, secondary:["Biceps Brachii","Rhomboids"], pattern:"Vertical Pull", compound:true, location:"gym_or_home_gym", equipment:["pullup_bar"], tags:["user_routine"] },
  { name:"Neutral Grip Pull-Up", muscle:"Latissimus Dorsi", segments:{}, secondary:["Biceps Brachii","Brachialis"], pattern:"Vertical Pull", compound:true, location:"gym_or_home_gym", equipment:["pullup_bar"], tags:["hypertrophy","back_spec"] },
  { name:"Lat Pulldown", muscle:"Latissimus Dorsi", segments:{}, secondary:["Biceps Brachii","Rhomboids"], pattern:"Vertical Pull", compound:true, location:"gym_required", equipment:["cable","machine"], tags:["hypertrophy","female_opt"] },
  { name:"Pronated Pulldown", muscle:"Latissimus Dorsi", segments:{}, secondary:["Biceps Brachii","Rhomboids"], pattern:"Vertical Pull", compound:true, location:"gym_required", equipment:["cable","machine"], tags:["hypertrophy","fbhf","back_spec"] },
  { name:"Wide Grip Lat Pulldown", muscle:"Latissimus Dorsi", segments:{}, secondary:["Rhomboids"], pattern:"Vertical Pull", compound:true, location:"gym_required", equipment:["cable","machine"], tags:["hypertrophy"] },
  { name:"Close Grip Lat Pulldown", muscle:"Latissimus Dorsi", segments:{}, secondary:["Biceps Brachii"], pattern:"Vertical Pull", compound:true, location:"gym_required", equipment:["cable","machine"], tags:["hypertrophy"] },
  { name:"Cable Pullover", muscle:"Latissimus Dorsi", segments:{}, secondary:[], pattern:"Isolation", compound:false, location:"gym_required", equipment:["cable"], tags:["hypertrophy","back_spec","fbhf"] },
  { name:"Barbell Row", muscle:"Latissimus Dorsi", segments:{}, secondary:["Rhomboids","Biceps Brachii","Trapezius"], pattern:"Horizontal Pull", compound:true, location:"gym_required", equipment:["barbell"], tags:["strength","hypertrophy","pb","back_spec"] },
  { name:"Pendlay Row", muscle:"Latissimus Dorsi", segments:{}, secondary:["Rhomboids","Biceps Brachii","Trapezius"], pattern:"Horizontal Pull", compound:true, location:"gym_required", equipment:["barbell"], tags:["strength","fbhf","back_spec"] },
  { name:"T-Bar Row", muscle:"Rhomboids", segments:{}, secondary:["Latissimus Dorsi","Biceps Brachii","Trapezius"], pattern:"Horizontal Pull", compound:true, location:"gym_required", equipment:["barbell","landmine"], tags:["hypertrophy","back_spec"] },
  { name:"Chest-Supported T-Bar Row", muscle:"Rhomboids", segments:{}, secondary:["Latissimus Dorsi","Biceps Brachii","Trapezius"], pattern:"Horizontal Pull", compound:true, location:"gym_required", equipment:["machine"], tags:["hypertrophy","fbhf","back_spec"] },
  { name:"Chest-Supported Row", muscle:"Rhomboids", segments:{}, secondary:["Latissimus Dorsi","Biceps Brachii"], pattern:"Horizontal Pull", compound:true, location:"gym_required", equipment:["machine"], tags:["hypertrophy","user_routine"] },
  { name:"Humble Row", muscle:"Rhomboids", segments:{}, secondary:["Latissimus Dorsi","Biceps Brachii"], pattern:"Horizontal Pull", compound:true, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["fbhf"] },
  { name:"Cable Seated Row", muscle:"Rhomboids", segments:{}, secondary:["Latissimus Dorsi","Biceps Brachii"], pattern:"Horizontal Pull", compound:true, location:"gym_required", equipment:["cable"], tags:["hypertrophy","female_opt"] },
  { name:"Seated Cable Row", muscle:"Rhomboids", segments:{}, secondary:["Latissimus Dorsi","Biceps Brachii"], pattern:"Horizontal Pull", compound:true, location:"gym_required", equipment:["cable"], tags:["hypertrophy","fbhf"] },
  { name:"Dumbbell Row", muscle:"Latissimus Dorsi", segments:{}, secondary:["Rhomboids","Biceps Brachii"], pattern:"Horizontal Pull", compound:true, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["hypertrophy","female_opt","fbhf"] },
  { name:"Single-Arm Dumbbell Row", muscle:"Latissimus Dorsi", segments:{}, secondary:["Rhomboids","Biceps Brachii"], pattern:"Horizontal Pull", compound:true, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["hypertrophy","female_home"] },
  { name:"Meadows Row", muscle:"Latissimus Dorsi", segments:{}, secondary:["Rhomboids","Biceps Brachii"], pattern:"Horizontal Pull", compound:true, location:"gym_required", equipment:["barbell","landmine"], tags:["hypertrophy","back_spec"] },
  { name:"Seal Row", muscle:"Rhomboids", segments:{}, secondary:["Latissimus Dorsi","Biceps Brachii"], pattern:"Horizontal Pull", compound:true, location:"gym_required", equipment:["barbell","bench"], tags:["hypertrophy","back_spec"] },
  { name:"Banded Chest-Supported T-Bar Row", muscle:"Rhomboids", segments:{}, secondary:["Latissimus Dorsi","Biceps Brachii"], pattern:"Horizontal Pull", compound:true, location:"gym_required", equipment:["machine","band"], tags:["fbhf"] },
  { name:"Inverted Row", muscle:"Rhomboids", segments:{}, secondary:["Latissimus Dorsi","Biceps Brachii"], pattern:"Horizontal Pull", compound:true, location:"home_ok", equipment:["barbell","rack"], tags:["female_home"] },
  { name:"Kroc Row", muscle:"Latissimus Dorsi", segments:{}, secondary:["Rhomboids","Biceps Brachii","Trapezius","Forearms"], pattern:"Horizontal Pull", compound:true, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["hypertrophy","strongman"] },

  // Traps and rear delt
  { name:"Barbell Shrug", muscle:"Trapezius", segments:{Upper:80,Mid:15,Lower:5}, secondary:[], pattern:"Shrug", compound:false, location:"gym_required", equipment:["barbell"], tags:["hypertrophy","neck_trap_spec","user_routine"] },
  { name:"Dumbbell Shrug", muscle:"Trapezius", segments:{Upper:80,Mid:15,Lower:5}, secondary:[], pattern:"Shrug", compound:false, location:"gym_or_home_gym", equipment:["dumbbell"], tags:["hypertrophy","neck_trap_spec"] },
  { name:"Hex Bar Shrug", muscle:"Trapezius", segments:{Upper:80,Mid:15,Lower:5}, secondary:[], pattern:"Shrug", compound:false, location:"gym_required", equipment:["trap_bar"], tags:["fbhf"] },
  { name:"Smith Machine Shrug", muscle:"Trapezius", segments:{Upper:80,Mid:15,Lower:5}, secondary:[], pattern:"Shrug", compound:false, location:"gym_required", equipment:["smith_machine"], tags:["fbhf"] },
  { name:"Monkey Shrug", muscle:"Trapezius", segments:{Upper:60,Mid:30,Lower:10}, secondary:["Rhomboids"], pattern:"Shrug", compound:false, location:"gym_required", equipment:["cable"], tags:["neck_trap_spec"] },
  { name:"Upright Row", muscle:"Lateral Deltoid", segments:{}, secondary:["Trapezius","Anterior Deltoid"], pattern:"Vertical Pull", compound:false, location:"gym_or_home_gym", equipment:["barbell","dumbbell"], tags:["neck_trap_spec"] },
  { name:"Cable Rope Upright Row", muscle:"Lateral Deltoid", segments:{}, secondary:["Trapezius"], pattern:"Vertical Pull", compound:false, location:"gym_required", equipment:["cable"], tags:["fbhf","neck_trap_spec"] },
  { name:"Face Pull", muscle:"Posterior Deltoid", segments:{}, secondary:["Trapezius","Rhomboids"], pattern:"Horizontal Pull", compound:false, location:"gym_required", equipment:["cable"], tags:["hypertrophy","user_routine","fbhf","neck_trap_spec"] },
  { name:"Seated Face Pull", muscle:"Posterior Deltoid", segments:{}, secondary:["Trapezius","Rhomboids"], pattern:"Horizontal Pull", compound:false, location:"gym_required", equipment:["cable"], tags:["fbhf"] },
  { name:"Reverse Pec Deck", muscle:"Posterior Deltoid", segments:{}, secondary:["Rhomboids","Trapezius"], pattern:"Isolation", compound:false, location:"gym_required", equipment:["machine"], tags:["hypertrophy","fbhf"] },
  { name:"Bent-Over Reverse Flye", muscle:"Posterior Deltoid", segments:{}, secondary:["Rhomboids"], pattern:"Isolation", compound:false, location:"gym_or_home_gym", equipment:["dumbbell"], tags:["hypertrophy"] },
  { name:"Trap-3 Raise", muscle:"Trapezius", segments:{Mid:40,Lower:40,Upper:20}, secondary:["Posterior Deltoid"], pattern:"Scapular Raise", compound:false, location:"home_ok", equipment:["dumbbell"], tags:["joint_prep","user_routine"] },
  { name:"Y Raise", muscle:"Trapezius", segments:{Mid:50,Lower:40,Upper:10}, secondary:["Posterior Deltoid"], pattern:"Scapular Raise", compound:false, location:"home_ok", equipment:["dumbbell"], tags:["joint_prep"] },
  { name:"Prone Y Raise", muscle:"Trapezius", segments:{Lower:70,Mid:20,Upper:10}, secondary:["Posterior Deltoid"], pattern:"Scapular Raise", compound:false, location:"home_ok", equipment:["dumbbell","bench"], tags:["joint_prep"] },
  { name:"Prone T Raise", muscle:"Rhomboids", segments:{}, secondary:["Trapezius","Posterior Deltoid"], pattern:"Scapular Raise", compound:false, location:"home_ok", equipment:["dumbbell","bench"], tags:["joint_prep"] },
  { name:"Bird Dog", muscle:"Erector Spinae", segments:{}, secondary:["Glutes","Abs"], pattern:"Anti-Rotation", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["joint_prep","mobility"] },
  { name:"Superman Hold", muscle:"Erector Spinae", segments:{}, secondary:["Glutes"], pattern:"Isometric Extension", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["joint_prep","user_routine"] },
  { name:"Back Extension", muscle:"Erector Spinae", segments:{}, secondary:["Glutes","Hamstrings"], pattern:"Spinal Extension", compound:false, location:"gym_required", equipment:["machine","bench"], tags:["hypertrophy"] },
  { name:"Reverse Hyperextension", muscle:"Glutes", segments:{}, secondary:["Erector Spinae","Hamstrings"], pattern:"Hip Extension", compound:false, location:"gym_required", equipment:["machine"], tags:["hypertrophy"] },
  { name:"Good Morning", muscle:"Hamstrings", segments:{}, secondary:["Erector Spinae","Glutes"], pattern:"Hip Hinge", compound:true, location:"gym_required", equipment:["barbell"], tags:["strength"] },

  // ============================================================
  // BICEPS — Biceps Brachii + Brachialis
  // ============================================================
  { name:"Barbell Curl", muscle:"Biceps Brachii", segments:{Long:50,Short:40,Brachialis:10}, secondary:["Forearms"], pattern:"Elbow Flexion", compound:false, location:"gym_or_home_gym", equipment:["barbell"], tags:["hypertrophy","arm_spec"] },
  { name:"EZ Bar Curl", muscle:"Biceps Brachii", segments:{Long:40,Short:50,Brachialis:10}, secondary:["Forearms"], pattern:"Elbow Flexion", compound:false, location:"gym_or_home_gym", equipment:["ez_bar"], tags:["hypertrophy","arm_spec"] },
  { name:"Standing EZ Bar Curl", muscle:"Biceps Brachii", segments:{Long:40,Short:50,Brachialis:10}, secondary:["Forearms"], pattern:"Elbow Flexion", compound:false, location:"gym_or_home_gym", equipment:["ez_bar"], tags:["arm_spec"] },
  { name:"Standing EZ Bar Curl (Descending ROM)", muscle:"Biceps Brachii", segments:{Long:40,Short:50,Brachialis:10}, secondary:["Forearms"], pattern:"Elbow Flexion", compound:false, location:"gym_or_home_gym", equipment:["ez_bar"], tags:["arm_spec"] },
  { name:"Supinated EZ Bar Curl", muscle:"Biceps Brachii", segments:{Long:40,Short:50,Brachialis:10}, secondary:["Forearms"], pattern:"Elbow Flexion", compound:false, location:"gym_or_home_gym", equipment:["ez_bar"], tags:["fbhf"] },
  { name:"EZ Bar Curl 21s", muscle:"Biceps Brachii", segments:{Long:40,Short:50,Brachialis:10}, secondary:["Forearms"], pattern:"Elbow Flexion", compound:false, location:"gym_or_home_gym", equipment:["ez_bar"], tags:["fbhf","arm_spec"] },
  { name:"Reverse Grip EZ Bar Curl (Metabolic)", muscle:"Forearms", segments:{}, secondary:["Biceps Brachii","Brachialis"], pattern:"Elbow Flexion (Reverse)", compound:false, location:"gym_or_home_gym", equipment:["ez_bar"], tags:["arm_spec","forearm_spec"] },
  { name:"Dumbbell Curl", muscle:"Biceps Brachii", segments:{Long:45,Short:45,Brachialis:10}, secondary:["Forearms"], pattern:"Elbow Flexion", compound:false, location:"gym_or_home_gym", equipment:["dumbbell"], tags:["hypertrophy"] },
  { name:"Alternating Dumbbell Curl", muscle:"Biceps Brachii", segments:{Long:45,Short:45,Brachialis:10}, secondary:["Forearms"], pattern:"Elbow Flexion", compound:false, location:"gym_or_home_gym", equipment:["dumbbell"], tags:["hypertrophy"] },
  { name:"Incline Dumbbell Curl", muscle:"Biceps Brachii", segments:{Long:70,Short:20,Brachialis:10}, secondary:["Forearms"], pattern:"Elbow Flexion", compound:false, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["hypertrophy","arm_spec","fbhf","user_routine"] },
  { name:"Incline DB Curl", muscle:"Biceps Brachii", segments:{Long:70,Short:20,Brachialis:10}, secondary:["Forearms"], pattern:"Elbow Flexion", compound:false, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["hypertrophy","user_routine"] },
  { name:"Incline Dumbbell Curl 21's", muscle:"Biceps Brachii", segments:{Long:70,Short:20,Brachialis:10}, secondary:["Forearms"], pattern:"Elbow Flexion", compound:false, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["arm_spec"] },
  { name:"Incline Dumbbell Curl Reverse 21's", muscle:"Biceps Brachii", segments:{Long:70,Short:20,Brachialis:10}, secondary:["Forearms"], pattern:"Elbow Flexion", compound:false, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["arm_spec"] },
  { name:"Hammer Curl", muscle:"Biceps Brachii", segments:{Long:30,Brachialis:60,Short:10}, secondary:["Forearms"], pattern:"Elbow Flexion (Neutral)", compound:false, location:"gym_or_home_gym", equipment:["dumbbell"], tags:["hypertrophy","arm_spec","forearm_spec","user_routine"] },
  { name:"Dumbbell Preacher Hammer Curl", muscle:"Biceps Brachii", segments:{Long:20,Brachialis:70,Short:10}, secondary:["Forearms"], pattern:"Elbow Flexion (Neutral)", compound:false, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["arm_spec"] },
  { name:"Cross-Body Hammer Curl", muscle:"Biceps Brachii", segments:{Long:30,Brachialis:60,Short:10}, secondary:["Forearms"], pattern:"Elbow Flexion (Neutral)", compound:false, location:"gym_or_home_gym", equipment:["dumbbell"], tags:["hypertrophy"] },
  { name:"Preacher Curl", muscle:"Biceps Brachii", segments:{Long:10,Short:80,Brachialis:10}, secondary:["Forearms"], pattern:"Elbow Flexion", compound:false, location:"gym_required", equipment:["ez_bar","bench"], tags:["hypertrophy","arm_spec"] },
  { name:"Machine Preacher Curl", muscle:"Biceps Brachii", segments:{Long:10,Short:80,Brachialis:10}, secondary:[], pattern:"Elbow Flexion", compound:false, location:"gym_required", equipment:["machine"], tags:["arm_spec"] },
  { name:"Scott Curl", muscle:"Biceps Brachii", segments:{Long:10,Short:80,Brachialis:10}, secondary:[], pattern:"Elbow Flexion", compound:false, location:"gym_required", equipment:["dumbbell","bench"], tags:["arm_spec"] },
  { name:"Cable Curl", muscle:"Biceps Brachii", segments:{Long:40,Short:50,Brachialis:10}, secondary:["Forearms"], pattern:"Elbow Flexion", compound:false, location:"gym_required", equipment:["cable"], tags:["hypertrophy"] },
  { name:"Cable Single-Arm Curl", muscle:"Biceps Brachii", segments:{Long:40,Short:50,Brachialis:10}, secondary:["Forearms"], pattern:"Elbow Flexion", compound:false, location:"gym_required", equipment:["cable"], tags:["fbhf"] },
  { name:"Bayesian Cable Curl", muscle:"Biceps Brachii", segments:{Long:70,Short:20,Brachialis:10}, secondary:["Forearms"], pattern:"Elbow Flexion", compound:false, location:"gym_required", equipment:["cable"], tags:["hypertrophy","arm_spec"] },
  { name:"Dumbbell Concentration Curl", muscle:"Biceps Brachii", segments:{Long:20,Short:70,Brachialis:10}, secondary:[], pattern:"Elbow Flexion", compound:false, location:"gym_or_home_gym", equipment:["dumbbell"], tags:["arm_spec"] },
  { name:"Preacher Death Curls", muscle:"Biceps Brachii", segments:{Long:10,Short:80,Brachialis:10}, secondary:[], pattern:"Elbow Flexion", compound:false, location:"gym_required", equipment:["ez_bar","bench"], tags:["arm_spec"] },
  { name:"Heavy Negative Concentration Curls", muscle:"Biceps Brachii", segments:{Long:20,Short:70,Brachialis:10}, secondary:[], pattern:"Elbow Flexion", compound:false, location:"gym_or_home_gym", equipment:["dumbbell"], tags:["arm_spec"] },
  { name:"Lying Incline Death Curls", muscle:"Biceps Brachii", segments:{Long:70,Short:20,Brachialis:10}, secondary:["Forearms"], pattern:"Elbow Flexion", compound:false, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["arm_spec"] },
  { name:"Zottman Curl", muscle:"Biceps Brachii", segments:{Long:40,Short:40,Brachialis:20}, secondary:["Forearms"], pattern:"Elbow Flexion (Mixed)", compound:false, location:"gym_or_home_gym", equipment:["dumbbell"], tags:["hypertrophy","forearm_spec"] },
  { name:"Spider Curl", muscle:"Biceps Brachii", segments:{Long:20,Short:70,Brachialis:10}, secondary:[], pattern:"Elbow Flexion", compound:false, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["hypertrophy"] },

  // ============================================================
  // TRICEPS — Triceps Brachii (long/lateral/medial)
  // ============================================================
  { name:"Tricep Pressdown", muscle:"Triceps Brachii", segments:{Lateral:60,Medial:30,Long:10}, secondary:[], pattern:"Elbow Extension", compound:false, location:"gym_required", equipment:["cable"], tags:["hypertrophy","arm_spec"] },
  { name:"Triceps Pressdown", muscle:"Triceps Brachii", segments:{Lateral:60,Medial:30,Long:10}, secondary:[], pattern:"Elbow Extension", compound:false, location:"gym_required", equipment:["cable"], tags:["hypertrophy","fbhf"] },
  { name:"Rope Pushdown", muscle:"Triceps Brachii", segments:{Lateral:60,Medial:30,Long:10}, secondary:["Anterior Deltoid"], pattern:"Elbow Extension", compound:false, location:"gym_required", equipment:["cable"], tags:["hypertrophy","user_routine"] },
  { name:"V-Bar Pressdown", muscle:"Triceps Brachii", segments:{Lateral:65,Medial:25,Long:10}, secondary:[], pattern:"Elbow Extension", compound:false, location:"gym_required", equipment:["cable"], tags:["hypertrophy"] },
  { name:"Overhead Rope Tricep Extension", muscle:"Triceps Brachii", segments:{Long:70,Lateral:20,Medial:10}, secondary:[], pattern:"Elbow Extension (Overhead)", compound:false, location:"gym_required", equipment:["cable"], tags:["hypertrophy","arm_spec"] },
  { name:"Overhead Rope Extension", muscle:"Triceps Brachii", segments:{Long:70,Lateral:20,Medial:10}, secondary:[], pattern:"Elbow Extension (Overhead)", compound:false, location:"gym_required", equipment:["cable"], tags:["hypertrophy","user_routine"] },
  { name:"Overhead Triceps Extension", muscle:"Triceps Brachii", segments:{Long:70,Lateral:20,Medial:10}, secondary:[], pattern:"Elbow Extension (Overhead)", compound:false, location:"gym_or_home_gym", equipment:["dumbbell","cable"], tags:["hypertrophy","fbhf"] },
  { name:"1-Arm Overhead Cable Extension", muscle:"Triceps Brachii", segments:{Long:70,Lateral:20,Medial:10}, secondary:[], pattern:"Elbow Extension (Overhead)", compound:false, location:"gym_required", equipment:["cable"], tags:["arm_spec"] },
  { name:"Skull Crusher", muscle:"Triceps Brachii", segments:{Long:50,Lateral:30,Medial:20}, secondary:[], pattern:"Elbow Extension", compound:false, location:"gym_or_home_gym", equipment:["ez_bar","bench"], tags:["hypertrophy"] },
  { name:"Skull Crushers", muscle:"Triceps Brachii", segments:{Long:50,Lateral:30,Medial:20}, secondary:[], pattern:"Elbow Extension", compound:false, location:"gym_or_home_gym", equipment:["ez_bar","bench"], tags:["hypertrophy","user_routine"] },
  { name:"EZ Bar Skull Crusher", muscle:"Triceps Brachii", segments:{Long:50,Lateral:30,Medial:20}, secondary:[], pattern:"Elbow Extension", compound:false, location:"gym_or_home_gym", equipment:["ez_bar","bench"], tags:["fbhf"] },
  { name:"Dumbbell Skull Crusher", muscle:"Triceps Brachii", segments:{Long:50,Lateral:30,Medial:20}, secondary:[], pattern:"Elbow Extension", compound:false, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["hypertrophy"] },
  { name:"Weighted Dip (Close Grip)", muscle:"Triceps Brachii", segments:{Lateral:40,Medial:30,Long:30}, secondary:["Pectoralis Major"], pattern:"Vertical Push (Dip)", compound:true, location:"gym_or_home_gym", equipment:["dip_bar","weight_belt"], tags:["arm_spec"] },
  { name:"Bench Dip", muscle:"Triceps Brachii", segments:{Lateral:50,Medial:30,Long:20}, secondary:[], pattern:"Vertical Push (Dip)", compound:false, location:"anywhere", equipment:["bench"], tags:["female_home"] },
  { name:"JM Press", muscle:"Triceps Brachii", segments:{Lateral:50,Medial:30,Long:20}, secondary:["Pectoralis Major"], pattern:"Horizontal Push", compound:true, location:"gym_required", equipment:["barbell","bench"], tags:["strength","arm_spec"] },
  { name:"Diamond Push-Up", muscle:"Triceps Brachii", segments:{Lateral:50,Medial:30,Long:20}, secondary:["Pectoralis Major"], pattern:"Horizontal Push", compound:true, location:"anywhere", equipment:["bodyweight"], tags:["female_home"] },
  { name:"Kickback", muscle:"Triceps Brachii", segments:{Lateral:60,Medial:30,Long:10}, secondary:[], pattern:"Elbow Extension", compound:false, location:"gym_or_home_gym", equipment:["dumbbell"], tags:["hypertrophy"] },
  { name:"Cable Kickback", muscle:"Triceps Brachii", segments:{Lateral:60,Medial:30,Long:10}, secondary:[], pattern:"Elbow Extension", compound:false, location:"gym_required", equipment:["cable"], tags:["hypertrophy"] },

  // ============================================================
  // SHOULDERS — Anterior/Lateral/Posterior Deltoid
  // ============================================================
  { name:"Overhead Press", muscle:"Anterior Deltoid", segments:{}, secondary:["Lateral Deltoid","Triceps Brachii"], pattern:"Vertical Push", compound:true, location:"gym_required", equipment:["barbell"], tags:["strength","hypertrophy","pb","user_routine"] },
  { name:"Barbell Overhead Press", muscle:"Anterior Deltoid", segments:{}, secondary:["Lateral Deltoid","Triceps Brachii"], pattern:"Vertical Push", compound:true, location:"gym_required", equipment:["barbell"], tags:["strength","fbhf"] },
  { name:"Standing Barbell OHP", muscle:"Anterior Deltoid", segments:{}, secondary:["Lateral Deltoid","Triceps Brachii"], pattern:"Vertical Push", compound:true, location:"gym_required", equipment:["barbell"], tags:["strength"] },
  { name:"Seated Dumbbell Press", muscle:"Anterior Deltoid", segments:{}, secondary:["Lateral Deltoid","Triceps Brachii"], pattern:"Vertical Push", compound:true, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["hypertrophy","shoulder_spec"] },
  { name:"Standing Dumbbell Press", muscle:"Anterior Deltoid", segments:{}, secondary:["Lateral Deltoid","Triceps Brachii"], pattern:"Vertical Push", compound:true, location:"gym_or_home_gym", equipment:["dumbbell"], tags:["hypertrophy"] },
  { name:"Machine Shoulder Press", muscle:"Anterior Deltoid", segments:{}, secondary:["Lateral Deltoid","Triceps Brachii"], pattern:"Vertical Push", compound:true, location:"gym_required", equipment:["machine"], tags:["hypertrophy","user_routine"] },
  { name:"Arnold Press", muscle:"Anterior Deltoid", segments:{}, secondary:["Lateral Deltoid","Triceps Brachii"], pattern:"Vertical Push", compound:true, location:"gym_or_home_gym", equipment:["dumbbell"], tags:["hypertrophy","shoulder_spec","fbhf"] },
  { name:"Push Press", muscle:"Anterior Deltoid", segments:{}, secondary:["Lateral Deltoid","Triceps Brachii","Quadriceps"], pattern:"Vertical Push", compound:true, location:"gym_required", equipment:["barbell"], tags:["strength"] },
  { name:"Dumbbell Lateral Raise", muscle:"Lateral Deltoid", segments:{}, secondary:[], pattern:"Isolation", compound:false, location:"gym_or_home_gym", equipment:["dumbbell"], tags:["hypertrophy","shoulder_spec","fbhf","user_routine"] },
  { name:"Lateral Raises", muscle:"Lateral Deltoid", segments:{}, secondary:[], pattern:"Isolation", compound:false, location:"gym_or_home_gym", equipment:["dumbbell"], tags:["hypertrophy","user_routine"] },
  { name:"Cable Lateral Raise", muscle:"Lateral Deltoid", segments:{}, secondary:[], pattern:"Isolation", compound:false, location:"gym_required", equipment:["cable"], tags:["hypertrophy","shoulder_spec","fbhf"] },
  { name:"Egyptian Lateral Raise", muscle:"Lateral Deltoid", segments:{}, secondary:[], pattern:"Isolation", compound:false, location:"gym_required", equipment:["cable"], tags:["shoulder_spec","fbhf"] },
  { name:"Machine Lateral Raise", muscle:"Lateral Deltoid", segments:{}, secondary:[], pattern:"Isolation", compound:false, location:"gym_required", equipment:["machine"], tags:["hypertrophy"] },
  { name:"Leaning Cable Lateral Raise", muscle:"Lateral Deltoid", segments:{}, secondary:[], pattern:"Isolation", compound:false, location:"gym_required", equipment:["cable"], tags:["shoulder_spec"] },
  { name:"Behind-the-Back Cable Lateral Raise", muscle:"Lateral Deltoid", segments:{}, secondary:[], pattern:"Isolation", compound:false, location:"gym_required", equipment:["cable"], tags:["shoulder_spec"] },
  { name:"Front Raise", muscle:"Anterior Deltoid", segments:{}, secondary:[], pattern:"Isolation", compound:false, location:"gym_or_home_gym", equipment:["dumbbell","plate"], tags:["hypertrophy"] },
  { name:"Cable Front Raise", muscle:"Anterior Deltoid", segments:{}, secondary:[], pattern:"Isolation", compound:false, location:"gym_required", equipment:["cable"], tags:["hypertrophy"] },
  { name:"Rear Delt Flye", muscle:"Posterior Deltoid", segments:{}, secondary:["Rhomboids"], pattern:"Isolation", compound:false, location:"gym_or_home_gym", equipment:["dumbbell"], tags:["hypertrophy","shoulder_spec"] },
  { name:"Cable Rear Delt Flye", muscle:"Posterior Deltoid", segments:{}, secondary:["Rhomboids"], pattern:"Isolation", compound:false, location:"gym_required", equipment:["cable"], tags:["hypertrophy","shoulder_spec"] },
  { name:"Rear Delt Row", muscle:"Posterior Deltoid", segments:{}, secondary:["Rhomboids","Trapezius"], pattern:"Horizontal Pull", compound:false, location:"gym_or_home_gym", equipment:["dumbbell"], tags:["hypertrophy","shoulder_spec"] },
  { name:"Rear Delt Cable Row (High)", muscle:"Posterior Deltoid", segments:{}, secondary:["Rhomboids"], pattern:"Horizontal Pull", compound:false, location:"gym_required", equipment:["cable"], tags:["shoulder_spec"] },
  { name:"Rotator Cuff External Rotation (Band)", muscle:"Posterior Deltoid", segments:{}, secondary:[], pattern:"Shoulder External Rotation", compound:false, location:"home_ok", equipment:["band"], tags:["joint_prep"] },
  { name:"Cable External Rotation", muscle:"Posterior Deltoid", segments:{}, secondary:[], pattern:"Shoulder External Rotation", compound:false, location:"gym_required", equipment:["cable"], tags:["joint_prep"] },
  { name:"Band Pull-Apart", muscle:"Rhomboids", segments:{}, secondary:["Posterior Deltoid"], pattern:"Horizontal Pull", compound:false, location:"home_ok", equipment:["band"], tags:["joint_prep"] },
  { name:"Wall Angel", muscle:"Rhomboids", segments:{}, secondary:["Trapezius"], pattern:"Scapular Mobility", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["joint_prep","mobility"] },
  { name:"Serratus Push-Up", muscle:"Anterior Deltoid", segments:{}, secondary:["Pectoralis Major"], pattern:"Scapular Protraction", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["joint_prep"] },
  { name:"Landmine Lateral Raise", muscle:"Lateral Deltoid", segments:{}, secondary:[], pattern:"Isolation", compound:false, location:"gym_required", equipment:["barbell","landmine"], tags:["shoulder_spec"] },
  { name:"Powell Raise", muscle:"Posterior Deltoid", segments:{}, secondary:["Trapezius"], pattern:"Scapular Raise", compound:false, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["shoulder_spec","joint_prep"] },

  // ============================================================
  // NECK
  // ============================================================
  { name:"Neck Curl (Weighted)", muscle:"Neck", segments:{}, secondary:[], pattern:"Neck Flexion", compound:false, location:"home_ok", equipment:["plate"], tags:["neck_trap_spec","joint_prep"] },
  { name:"Weighted Neck Curl", muscle:"Neck", segments:{}, secondary:[], pattern:"Neck Flexion", compound:false, location:"home_ok", equipment:["plate"], tags:["neck_trap_spec"] },
  { name:"Weighted Neck Extension", muscle:"Neck", segments:{}, secondary:[], pattern:"Neck Extension", compound:false, location:"home_ok", equipment:["plate"], tags:["neck_trap_spec"] },
  { name:"Weighted Lateral Neck Flexion", muscle:"Neck", segments:{}, secondary:[], pattern:"Neck Lateral Flexion", compound:false, location:"home_ok", equipment:["plate"], tags:["neck_trap_spec"] },
  { name:"Neck Harness Extension", muscle:"Neck", segments:{}, secondary:[], pattern:"Neck Extension", compound:false, location:"gym_required", equipment:["neck_harness"], tags:["neck_trap_spec"] },
  { name:"Neck Iso Hold", muscle:"Neck", segments:{}, secondary:[], pattern:"Isometric", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["joint_prep"] },

  // ============================================================
  // FOREARMS
  // ============================================================
  { name:"Forearm Wrist Curl", muscle:"Forearms", segments:{Flexors:80,Extensors:20}, secondary:[], pattern:"Wrist Flexion", compound:false, location:"home_ok", equipment:["dumbbell","barbell"], tags:["forearm_spec","arm_spec"] },
  { name:"Wrist Curl", muscle:"Forearms", segments:{Flexors:80,Extensors:20}, secondary:[], pattern:"Wrist Flexion", compound:false, location:"home_ok", equipment:["dumbbell"], tags:["joint_prep","forearm_spec"] },
  { name:"Reverse Grip Forearm Wrist Curl", muscle:"Forearms", segments:{Flexors:20,Extensors:80}, secondary:[], pattern:"Wrist Extension", compound:false, location:"home_ok", equipment:["dumbbell"], tags:["forearm_spec"] },
  { name:"Reverse Wrist Curl", muscle:"Forearms", segments:{Flexors:20,Extensors:80}, secondary:[], pattern:"Wrist Extension", compound:false, location:"home_ok", equipment:["dumbbell"], tags:["forearm_spec"] },
  { name:"Behind-the-Back Wrist Curl", muscle:"Forearms", segments:{Flexors:80,Extensors:20}, secondary:[], pattern:"Wrist Flexion", compound:false, location:"gym_or_home_gym", equipment:["barbell"], tags:["forearm_spec"] },
  { name:"Reverse Curl", muscle:"Forearms", segments:{}, secondary:["Biceps Brachii","Brachialis"], pattern:"Elbow Flexion (Reverse)", compound:false, location:"gym_or_home_gym", equipment:["barbell","ez_bar"], tags:["forearm_spec","hypertrophy"] },
  { name:"Cable Reverse Curl", muscle:"Forearms", segments:{}, secondary:["Brachialis"], pattern:"Elbow Flexion (Reverse)", compound:false, location:"gym_required", equipment:["cable"], tags:["forearm_spec"] },
  { name:"Radial Deviation", muscle:"Forearms", segments:{}, secondary:[], pattern:"Wrist Deviation", compound:false, location:"home_ok", equipment:["dumbbell"], tags:["forearm_spec","joint_prep"] },
  { name:"Ulnar Deviation", muscle:"Forearms", segments:{}, secondary:[], pattern:"Wrist Deviation", compound:false, location:"home_ok", equipment:["dumbbell"], tags:["forearm_spec","joint_prep"] },
  { name:"Farmer's Grip Hold", muscle:"Forearms", segments:{}, secondary:["Trapezius"], pattern:"Isometric", compound:false, location:"gym_or_home_gym", equipment:["dumbbell","trap_bar"], tags:["forearm_spec"] },
  { name:"Dead Hang", muscle:"Forearms", segments:{}, secondary:["Latissimus Dorsi"], pattern:"Isometric", compound:false, location:"gym_or_home_gym", equipment:["pullup_bar"], tags:["forearm_spec"] },
  { name:"Fat Grip Hammer Curl", muscle:"Forearms", segments:{}, secondary:["Brachialis","Biceps Brachii"], pattern:"Elbow Flexion (Neutral)", compound:false, location:"gym_or_home_gym", equipment:["dumbbell","fat_grip"], tags:["forearm_spec"] },

  // ============================================================
  // QUADS + LEGS
  // ============================================================
  { name:"Back Squat", muscle:"Quadriceps", segments:{Rectus:40,Lateralis:30,Medialis:20,Intermedius:10}, secondary:["Glutes","Hamstrings"], pattern:"Squat", compound:true, location:"gym_required", equipment:["barbell","rack"], tags:["strength","pb","squat_spec","fbhf"] },
  { name:"Barbell Back Squat", muscle:"Quadriceps", segments:{Rectus:40,Lateralis:30,Medialis:20,Intermedius:10}, secondary:["Glutes","Hamstrings"], pattern:"Squat", compound:true, location:"gym_required", equipment:["barbell","rack"], tags:["strength"] },
  { name:"High Bar Back Squat", muscle:"Quadriceps", segments:{Rectus:45,Lateralis:30,Medialis:20,Intermedius:5}, secondary:["Glutes"], pattern:"Squat", compound:true, location:"gym_required", equipment:["barbell","rack"], tags:["strength","squat_spec"] },
  { name:"Low Bar Back Squat", muscle:"Quadriceps", segments:{Rectus:30,Lateralis:30,Medialis:30,Intermedius:10}, secondary:["Glutes","Hamstrings"], pattern:"Squat", compound:true, location:"gym_required", equipment:["barbell","rack"], tags:["strength","squat_spec"] },
  { name:"Front Squat", muscle:"Quadriceps", segments:{Rectus:50,Lateralis:25,Medialis:20,Intermedius:5}, secondary:["Glutes"], pattern:"Squat", compound:true, location:"gym_required", equipment:["barbell","rack"], tags:["strength","hypertrophy","squat_spec","user_routine"] },
  { name:"Pause Squat", muscle:"Quadriceps", segments:{Rectus:40,Lateralis:30,Medialis:20,Intermedius:10}, secondary:["Glutes"], pattern:"Squat", compound:true, location:"gym_required", equipment:["barbell","rack"], tags:["strength","squat_spec"] },
  { name:"Tempo Squat", muscle:"Quadriceps", segments:{Rectus:40,Lateralis:30,Medialis:20,Intermedius:10}, secondary:["Glutes"], pattern:"Squat", compound:true, location:"gym_required", equipment:["barbell","rack"], tags:["squat_spec"] },
  { name:"Safety Bar Squat", muscle:"Quadriceps", segments:{Rectus:40,Lateralis:30,Medialis:20,Intermedius:10}, secondary:["Glutes","Erector Spinae"], pattern:"Squat", compound:true, location:"gym_required", equipment:["safety_bar","rack"], tags:["strength"] },
  { name:"Zercher Squat", muscle:"Quadriceps", segments:{Rectus:40,Lateralis:30,Medialis:20,Intermedius:10}, secondary:["Glutes","Erector Spinae"], pattern:"Squat", compound:true, location:"gym_required", equipment:["barbell"], tags:["strength"] },
  { name:"Goblet Squat", muscle:"Quadriceps", segments:{Rectus:45,Lateralis:25,Medialis:25,Intermedius:5}, secondary:["Glutes"], pattern:"Squat", compound:true, location:"gym_or_home_gym", equipment:["dumbbell","kb"], tags:["hypertrophy","female_home"] },
  { name:"Hack Squat", muscle:"Quadriceps", segments:{Rectus:30,Lateralis:35,Medialis:30,Intermedius:5}, secondary:["Glutes"], pattern:"Squat", compound:true, location:"gym_required", equipment:["machine"], tags:["hypertrophy","female_opt"] },
  { name:"Leg Press", muscle:"Quadriceps", segments:{Rectus:30,Lateralis:30,Medialis:30,Intermedius:10}, secondary:["Glutes"], pattern:"Squat", compound:true, location:"gym_required", equipment:["machine"], tags:["hypertrophy","fbhf","female_opt","pb"] },
  { name:"Single Leg Press", muscle:"Quadriceps", segments:{Rectus:30,Lateralis:30,Medialis:30,Intermedius:10}, secondary:["Glutes"], pattern:"Squat (Unilateral)", compound:true, location:"gym_required", equipment:["machine"], tags:["hypertrophy","fbhf"] },
  { name:"Single-Leg Leg Press", muscle:"Quadriceps", segments:{Rectus:30,Lateralis:30,Medialis:30,Intermedius:10}, secondary:["Glutes"], pattern:"Squat (Unilateral)", compound:true, location:"gym_required", equipment:["machine"], tags:["hypertrophy","fbhf"] },
  { name:"Belt Squat", muscle:"Quadriceps", segments:{Rectus:40,Lateralis:30,Medialis:20,Intermedius:10}, secondary:["Glutes"], pattern:"Squat", compound:true, location:"gym_required", equipment:["machine"], tags:["hypertrophy"] },
  { name:"Leg Extension", muscle:"Quadriceps", segments:{Rectus:50,Lateralis:25,Medialis:20,Intermedius:5}, secondary:[], pattern:"Knee Extension", compound:false, location:"gym_required", equipment:["machine"], tags:["hypertrophy","fbhf","female_opt","pb"] },
  { name:"Single Leg Extension", muscle:"Quadriceps", segments:{Rectus:50,Lateralis:25,Medialis:20,Intermedius:5}, secondary:[], pattern:"Knee Extension", compound:false, location:"gym_required", equipment:["machine"], tags:["hypertrophy"] },
  { name:"Sissy Squat", muscle:"Quadriceps", segments:{Rectus:60,Lateralis:20,Medialis:15,Intermedius:5}, secondary:[], pattern:"Knee Flexion", compound:false, location:"home_ok", equipment:["bodyweight"], tags:["hypertrophy","joint_prep"] },
  { name:"Reverse Nordic", muscle:"Quadriceps", segments:{Rectus:60,Lateralis:20,Medialis:15,Intermedius:5}, secondary:[], pattern:"Knee Flexion (Reverse)", compound:false, location:"home_ok", equipment:["bodyweight"], tags:["joint_prep"] },
  { name:"Walking Lunge", muscle:"Quadriceps", segments:{Rectus:30,Lateralis:35,Medialis:30,Intermedius:5}, secondary:["Glutes","Hamstrings"], pattern:"Lunge/Single-Leg", compound:true, location:"gym_or_home_gym", equipment:["dumbbell","barbell"], tags:["hypertrophy","fbhf","female_opt"] },
  { name:"Reverse Lunge", muscle:"Quadriceps", segments:{Rectus:30,Lateralis:30,Medialis:35,Intermedius:5}, secondary:["Glutes","Hamstrings"], pattern:"Lunge/Single-Leg", compound:true, location:"gym_or_home_gym", equipment:["dumbbell"], tags:["hypertrophy","female_home"] },
  { name:"Bulgarian Split Squat", muscle:"Quadriceps", segments:{Rectus:30,Lateralis:35,Medialis:30,Intermedius:5}, secondary:["Glutes","Hamstrings"], pattern:"Lunge/Split", compound:true, location:"gym_or_home_gym", equipment:["dumbbell","bench"], tags:["hypertrophy","fbhf","female_opt"] },
  { name:"ATG Split Squat", muscle:"Quadriceps", segments:{Rectus:35,Lateralis:30,Medialis:30,Intermedius:5}, secondary:["Glutes","Adductors"], pattern:"Lunge (Deep)", compound:true, location:"home_ok", equipment:["bodyweight","dumbbell"], tags:["joint_prep","user_routine"] },
  { name:"Step Up", muscle:"Quadriceps", segments:{Rectus:30,Lateralis:35,Medialis:30,Intermedius:5}, secondary:["Glutes"], pattern:"Single-Leg", compound:true, location:"gym_or_home_gym", equipment:["dumbbell","box"], tags:["hypertrophy","female_home"] },
  { name:"Cossack Squat", muscle:"Adductors", segments:{}, secondary:["Quadriceps","Glutes"], pattern:"Squat (Lateral)", compound:true, location:"home_ok", equipment:["bodyweight","dumbbell"], tags:["joint_prep","user_routine"] },

  // ============================================================
  // HAMSTRINGS
  // ============================================================
  { name:"Leg Curl", muscle:"Hamstrings", segments:{Biceps:40,Semiten:40,Semimem:20}, secondary:[], pattern:"Knee Flexion", compound:false, location:"gym_required", equipment:["machine"], tags:["hypertrophy","fbhf","female_opt"] },
  { name:"Lying Leg Curl", muscle:"Hamstrings", segments:{Biceps:40,Semiten:40,Semimem:20}, secondary:[], pattern:"Knee Flexion", compound:false, location:"gym_required", equipment:["machine"], tags:["hypertrophy","fbhf"] },
  { name:"Seated Leg Curl", muscle:"Hamstrings", segments:{Biceps:30,Semiten:45,Semimem:25}, secondary:[], pattern:"Knee Flexion", compound:false, location:"gym_required", equipment:["machine"], tags:["hypertrophy"] },
  { name:"Standing Leg Curl", muscle:"Hamstrings", segments:{Biceps:40,Semiten:40,Semimem:20}, secondary:[], pattern:"Knee Flexion (Unilateral)", compound:false, location:"gym_required", equipment:["machine"], tags:["hypertrophy"] },
  { name:"Single Leg Curl", muscle:"Hamstrings", segments:{Biceps:40,Semiten:40,Semimem:20}, secondary:[], pattern:"Knee Flexion (Unilateral)", compound:false, location:"gym_required", equipment:["machine"], tags:["hypertrophy"] },
  { name:"Swiss Ball Leg Curl", muscle:"Hamstrings", segments:{Biceps:30,Semiten:40,Semimem:30}, secondary:["Glutes"], pattern:"Knee Flexion", compound:false, location:"home_ok", equipment:["swiss_ball"], tags:["fbhf","female_home"] },
  { name:"Nordic Curl", muscle:"Hamstrings", segments:{Biceps:40,Semiten:40,Semimem:20}, secondary:[], pattern:"Knee Flexion", compound:false, location:"home_ok", equipment:["bodyweight"], tags:["hypertrophy","joint_prep"] },
  { name:"Glute Ham Raise", muscle:"Hamstrings", segments:{Biceps:40,Semiten:40,Semimem:20}, secondary:["Glutes"], pattern:"Knee Flexion", compound:false, location:"gym_required", equipment:["machine"], tags:["hypertrophy","fbhf"] },
  { name:"RDL", muscle:"Hamstrings", segments:{Biceps:40,Semiten:40,Semimem:20}, secondary:["Glutes","Erector Spinae"], pattern:"Hip Hinge", compound:true, location:"gym_or_home_gym", equipment:["barbell","dumbbell"], tags:["hypertrophy","fbhf"] },
  { name:"Single Leg RDL", muscle:"Hamstrings", segments:{Biceps:40,Semiten:40,Semimem:20}, secondary:["Glutes"], pattern:"Hip Hinge (Unilateral)", compound:true, location:"home_ok", equipment:["dumbbell","kb","bodyweight"], tags:["mobility","hypertrophy"] },
  { name:"Single-Leg RDL (BW)", muscle:"Hamstrings", segments:{}, secondary:["Glutes"], pattern:"Hip Hinge", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility"] },
  { name:"Kettlebell Swing", muscle:"Glutes", segments:{}, secondary:["Hamstrings","Erector Spinae"], pattern:"Hip Hinge (Ballistic)", compound:true, location:"gym_or_home_gym", equipment:["kb"], tags:["conditioning","user_routine"] },
  { name:"KB Swing", muscle:"Glutes", segments:{}, secondary:["Hamstrings","Erector Spinae"], pattern:"Hip Hinge (Ballistic)", compound:true, location:"gym_or_home_gym", equipment:["kb"], tags:["conditioning","user_routine"] },

  // ============================================================
  // GLUTES — Glute Max / Med / Min
  // ============================================================
  { name:"Barbell Hip Thrust", muscle:"Glutes", segments:{Max:75,Med:15,Min:10}, secondary:["Hamstrings"], pattern:"Hip Extension", compound:true, location:"gym_or_home_gym", equipment:["barbell","bench"], tags:["hypertrophy","glute_spec","fbhf","female_opt"] },
  { name:"Hip Thrust", muscle:"Glutes", segments:{Max:75,Med:15,Min:10}, secondary:["Hamstrings"], pattern:"Hip Extension", compound:true, location:"gym_or_home_gym", equipment:["barbell","bench"], tags:["hypertrophy","glute_spec"] },
  { name:"Single-Leg Hip Thrust", muscle:"Glutes", segments:{Max:75,Med:15,Min:10}, secondary:["Hamstrings"], pattern:"Hip Extension (Unilateral)", compound:true, location:"home_ok", equipment:["bench","bodyweight"], tags:["hypertrophy","glute_spec","female_home"] },
  { name:"B-Stance Hip Thrust", muscle:"Glutes", segments:{Max:75,Med:15,Min:10}, secondary:["Hamstrings"], pattern:"Hip Extension", compound:true, location:"gym_or_home_gym", equipment:["barbell","bench"], tags:["hypertrophy","glute_spec"] },
  { name:"Glute Bridge", muscle:"Glutes", segments:{Max:80,Med:15,Min:5}, secondary:["Hamstrings"], pattern:"Hip Extension", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["female_home","joint_prep"] },
  { name:"Single-Leg Glute Bridge", muscle:"Glutes", segments:{Max:75,Med:20,Min:5}, secondary:["Hamstrings"], pattern:"Hip Extension (Unilateral)", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["female_home","joint_prep"] },
  { name:"Cable Pull Through", muscle:"Glutes", segments:{Max:70,Med:20,Min:10}, secondary:["Hamstrings"], pattern:"Hip Hinge", compound:true, location:"gym_required", equipment:["cable"], tags:["hypertrophy","glute_spec"] },
  { name:"Cable Kickback", muscle:"Glutes", segments:{Max:80,Med:15,Min:5}, secondary:[], pattern:"Hip Extension", compound:false, location:"gym_required", equipment:["cable"], tags:["hypertrophy","glute_spec","female_opt"] },
  { name:"Frog Pump", muscle:"Glutes", segments:{Max:70,Med:15,Min:15}, secondary:[], pattern:"Hip Extension", compound:false, location:"home_ok", equipment:["bodyweight","dumbbell"], tags:["hypertrophy","glute_spec"] },
  { name:"Banded Frog Pump", muscle:"Glutes", segments:{Max:65,Med:20,Min:15}, secondary:[], pattern:"Hip Extension", compound:false, location:"home_ok", equipment:["band"], tags:["glute_spec"] },
  { name:"Seated Hip Abduction", muscle:"Glutes", segments:{Med:70,Max:20,Min:10}, secondary:[], pattern:"Hip Abduction", compound:false, location:"gym_required", equipment:["machine"], tags:["hypertrophy","fbhf","glute_spec","female_opt"] },
  { name:"Standing Hip Abduction", muscle:"Glutes", segments:{Med:70,Max:20,Min:10}, secondary:[], pattern:"Hip Abduction", compound:false, location:"gym_or_home_gym", equipment:["cable","band"], tags:["hypertrophy","glute_spec"] },
  { name:"Banded Lateral Walk", muscle:"Glutes", segments:{Med:65,Max:20,Min:15}, secondary:[], pattern:"Hip Abduction", compound:false, location:"anywhere", equipment:["band"], tags:["glute_spec","joint_prep","female_home"] },
  { name:"Clamshell", muscle:"Glutes", segments:{Med:80,Max:10,Min:10}, secondary:[], pattern:"Hip Rotation", compound:false, location:"anywhere", equipment:["band"], tags:["joint_prep","female_home"] },
  { name:"Fire Hydrant", muscle:"Glutes", segments:{Med:60,Max:25,Min:15}, secondary:[], pattern:"Hip Abduction", compound:false, location:"anywhere", equipment:["bodyweight","band"], tags:["female_home","joint_prep"] },
  { name:"Hip Airplane", muscle:"Glutes", segments:{Med:50,Max:30,Min:20}, secondary:["Adductors"], pattern:"Hip Rotation", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["joint_prep","user_routine"] },
  { name:"Curtsy Lunge", muscle:"Glutes", segments:{Med:50,Max:30,Min:20}, secondary:["Quadriceps","Adductors"], pattern:"Lunge/Single-Leg", compound:true, location:"gym_or_home_gym", equipment:["dumbbell"], tags:["hypertrophy","glute_spec"] },
  { name:"Sumo Deadlift High Pull", muscle:"Glutes", segments:{Max:60,Med:20,Min:20}, secondary:["Hamstrings","Trapezius"], pattern:"Hip Hinge", compound:true, location:"gym_required", equipment:["barbell","kb"], tags:["strength"] },

  // ============================================================
  // ADDUCTORS
  // ============================================================
  { name:"Adductor Machine", muscle:"Adductors", segments:{}, secondary:[], pattern:"Hip Adduction", compound:false, location:"gym_required", equipment:["machine"], tags:["hypertrophy","joint_prep"] },
  { name:"Adductor Squeeze", muscle:"Adductors", segments:{}, secondary:[], pattern:"Hip Adduction", compound:false, location:"anywhere", equipment:["ball","bodyweight"], tags:["joint_prep"] },
  { name:"Copenhagen Plank", muscle:"Adductors", segments:{}, secondary:["Abs"], pattern:"Isometric", compound:false, location:"home_ok", equipment:["bench"], tags:["joint_prep"] },
  { name:"Side-Lying Adductor Raise", muscle:"Adductors", segments:{}, secondary:[], pattern:"Hip Adduction", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["joint_prep"] },

  // ============================================================
  // CALVES + TIBIALIS
  // ============================================================
  { name:"Standing Calf Raise", muscle:"Calves", segments:{Gastroc:75,Soleus:25}, secondary:[], pattern:"Calf Raise", compound:false, location:"gym_or_home_gym", equipment:["machine","dumbbell"], tags:["hypertrophy","fbhf","pb"] },
  { name:"Standing Calf Raises", muscle:"Calves", segments:{Gastroc:75,Soleus:25}, secondary:[], pattern:"Calf Raise", compound:false, location:"gym_or_home_gym", equipment:["machine"], tags:["hypertrophy","fbhf"] },
  { name:"Eccentric-Accentuated Standing Calf Raises", muscle:"Calves", segments:{Gastroc:80,Soleus:20}, secondary:[], pattern:"Calf Raise", compound:false, location:"gym_or_home_gym", equipment:["machine"], tags:["fbhf"] },
  { name:"Seated Calf Raise", muscle:"Calves", segments:{Soleus:80,Gastroc:20}, secondary:[], pattern:"Calf Raise", compound:false, location:"gym_required", equipment:["machine"], tags:["hypertrophy"] },
  { name:"Single-Leg Calf Raise", muscle:"Calves", segments:{Gastroc:75,Soleus:25}, secondary:[], pattern:"Calf Raise", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["joint_prep","female_home"] },
  { name:"Leg Press Calf Raise", muscle:"Calves", segments:{Gastroc:75,Soleus:25}, secondary:[], pattern:"Calf Raise", compound:false, location:"gym_required", equipment:["machine"], tags:["hypertrophy"] },
  { name:"Tibialis Raise", muscle:"Tibialis Anterior", segments:{}, secondary:[], pattern:"Ankle Dorsiflexion", compound:false, location:"home_ok", equipment:["bodyweight","band","plate"], tags:["joint_prep","user_routine"] },
  { name:"Reverse Squat (Tibialis)", muscle:"Tibialis Anterior", segments:{}, secondary:[], pattern:"Ankle Dorsiflexion", compound:false, location:"home_ok", equipment:["bodyweight"], tags:["joint_prep","user_routine"] },
  { name:"Tibialis Toe Walks", muscle:"Tibialis Anterior", segments:{}, secondary:[], pattern:"Gait/Walk", compound:false, location:"outdoor_ok", equipment:["bodyweight"], tags:["joint_prep","user_routine"] },
  { name:"Banded Tibialis Raise", muscle:"Tibialis Anterior", segments:{}, secondary:[], pattern:"Ankle Dorsiflexion", compound:false, location:"home_ok", equipment:["band"], tags:["joint_prep"] },
  { name:"Ankle Mobility Drill", muscle:"Calves", segments:{}, secondary:["Tibialis Anterior"], pattern:"Mobility", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility"] },

  // ============================================================
  // ABS + CORE
  // ============================================================
  { name:"Hanging Leg Raise", muscle:"Rectus Abdominis", segments:{Lower:70,Upper:30}, secondary:["Obliques"], pattern:"Hip Flexion", compound:false, location:"gym_or_home_gym", equipment:["pullup_bar"], tags:["hypertrophy","fbhf"] },
  { name:"Hanging Leg Raises", muscle:"Rectus Abdominis", segments:{Lower:70,Upper:30}, secondary:["Obliques"], pattern:"Hip Flexion", compound:false, location:"gym_or_home_gym", equipment:["pullup_bar"], tags:["hypertrophy","fbhf"] },
  { name:"Cable Crunch", muscle:"Rectus Abdominis", segments:{Upper:70,Lower:30}, secondary:[], pattern:"Spinal Flexion", compound:false, location:"gym_required", equipment:["cable"], tags:["hypertrophy","fbhf"] },
  { name:"Ab Wheel Rollout", muscle:"Rectus Abdominis", segments:{Upper:50,Lower:50}, secondary:["Obliques"], pattern:"Anti-Extension", compound:false, location:"home_ok", equipment:["ab_wheel"], tags:["hypertrophy","fbhf"] },
  { name:"Bicycle Crunch", muscle:"Obliques", segments:{}, secondary:["Rectus Abdominis"], pattern:"Spinal Rotation", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["hypertrophy","fbhf","female_home"] },
  { name:"Plank", muscle:"Rectus Abdominis", segments:{Upper:50,Lower:50}, secondary:["Obliques"], pattern:"Isometric", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["female_home","joint_prep"] },
  { name:"Side Plank", muscle:"Obliques", segments:{}, secondary:[], pattern:"Isometric", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["female_home","joint_prep"] },
  { name:"Russian Twist", muscle:"Obliques", segments:{}, secondary:["Rectus Abdominis"], pattern:"Spinal Rotation", compound:false, location:"anywhere", equipment:["bodyweight","plate"], tags:["female_home"] },
  { name:"Dead Bug", muscle:"Rectus Abdominis", segments:{Lower:60,Upper:40}, secondary:[], pattern:"Anti-Extension", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["joint_prep","female_home"] },
  { name:"Pallof Press", muscle:"Obliques", segments:{}, secondary:[], pattern:"Anti-Rotation", compound:false, location:"gym_required", equipment:["cable","band"], tags:["joint_prep"] },
  { name:"Crunch", muscle:"Rectus Abdominis", segments:{Upper:75,Lower:25}, secondary:[], pattern:"Spinal Flexion", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["female_home"] },
  { name:"Reverse Crunch", muscle:"Rectus Abdominis", segments:{Lower:75,Upper:25}, secondary:[], pattern:"Hip Flexion", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["female_home"] },
  { name:"Woodchopper", muscle:"Obliques", segments:{}, secondary:[], pattern:"Spinal Rotation", compound:false, location:"gym_required", equipment:["cable"], tags:["hypertrophy"] },

  // ============================================================
  // CONDITIONING + STRONGMAN
  // ============================================================
  { name:"Sled Push", muscle:"Quadriceps", segments:{}, secondary:["Glutes","Hamstrings"], pattern:"Loaded Carry", compound:true, location:"gym_required", equipment:["sled"], tags:["conditioning","user_routine"] },
  { name:"Backward Sled Drag", muscle:"Quadriceps", segments:{}, secondary:["Glutes"], pattern:"Loaded Carry", compound:true, location:"outdoor_ok", equipment:["sled"], tags:["conditioning","user_routine","joint_prep"] },
  { name:"Forward Sled Drag", muscle:"Hamstrings", segments:{}, secondary:["Glutes"], pattern:"Loaded Carry", compound:true, location:"outdoor_ok", equipment:["sled"], tags:["conditioning","user_routine"] },
  { name:"Tire Flip", muscle:"Quadriceps", segments:{}, secondary:["Glutes","Erector Spinae","Trapezius"], pattern:"Full Body/Squat-Hinge", compound:true, location:"outdoor_ok", equipment:["tire"], tags:["conditioning","user_routine"] },
  { name:"Farmer's Carry", muscle:"Trapezius", segments:{}, secondary:["Forearms","Erector Spinae"], pattern:"Loaded Carry", compound:true, location:"gym_or_home_gym", equipment:["farmer_handles","trap_bar","dumbbell"], tags:["conditioning","user_routine"] },
  { name:"Farmer Carry", muscle:"Trapezius", segments:{}, secondary:["Forearms","Erector Spinae"], pattern:"Loaded Carry", compound:true, location:"gym_or_home_gym", equipment:["farmer_handles"], tags:["conditioning","user_routine"] },
  { name:"Farmers Walks", muscle:"Trapezius", segments:{}, secondary:["Forearms"], pattern:"Loaded Carry", compound:true, location:"gym_or_home_gym", equipment:["dumbbell","farmer_handles"], tags:["conditioning"] },
  { name:"Suitcase Carry", muscle:"Obliques", segments:{}, secondary:["Trapezius","Forearms"], pattern:"Loaded Carry", compound:true, location:"anywhere", equipment:["dumbbell","kb"], tags:["conditioning","joint_prep"] },
  { name:"Overhead Carry", muscle:"Anterior Deltoid", segments:{}, secondary:["Abs"], pattern:"Loaded Carry", compound:true, location:"gym_or_home_gym", equipment:["kb","dumbbell"], tags:["conditioning"] },
  { name:"Battle Ropes", muscle:"Anterior Deltoid", segments:{}, secondary:["Forearms"], pattern:"Ballistic", compound:false, location:"gym_or_home_gym", equipment:["ropes"], tags:["conditioning"] },
  { name:"Sandbag Carry", muscle:"Trapezius", segments:{}, secondary:["Forearms","Erector Spinae","Abs"], pattern:"Loaded Carry", compound:true, location:"outdoor_ok", equipment:["sandbag"], tags:["conditioning"] },
  { name:"Prowler Push", muscle:"Quadriceps", segments:{}, secondary:["Glutes"], pattern:"Loaded Carry", compound:true, location:"gym_required", equipment:["prowler"], tags:["conditioning"] },
  { name:"Skipping Rope", muscle:"Calves", segments:{}, secondary:["Tibialis Anterior"], pattern:"Ballistic", compound:false, location:"anywhere", equipment:["skipping_rope"], tags:["conditioning","cardio"] },
  { name:"Skipping optional", muscle:"Calves", segments:{}, secondary:[], pattern:"Ballistic", compound:false, location:"anywhere", equipment:["skipping_rope"], tags:["conditioning","user_routine"] },
  { name:"Box Jump", muscle:"Quadriceps", segments:{}, secondary:["Glutes","Calves"], pattern:"Ballistic", compound:true, location:"gym_or_home_gym", equipment:["box"], tags:["conditioning","athletic"] },
  { name:"Broad Jump", muscle:"Quadriceps", segments:{}, secondary:["Glutes","Hamstrings"], pattern:"Ballistic", compound:true, location:"outdoor_ok", equipment:["bodyweight"], tags:["conditioning","athletic"] },
  { name:"Medicine Ball Slam", muscle:"Latissimus Dorsi", segments:{}, secondary:["Abs"], pattern:"Ballistic", compound:true, location:"gym_or_home_gym", equipment:["medicine_ball"], tags:["conditioning"] },
  { name:"Assault Bike", muscle:"Quadriceps", segments:{}, secondary:["Anterior Deltoid","Hamstrings"], pattern:"Cardio", compound:false, location:"gym_required", equipment:["machine"], tags:["conditioning","cardio"] },
  { name:"Rowing Machine", muscle:"Latissimus Dorsi", segments:{}, secondary:["Rhomboids","Quadriceps"], pattern:"Cardio", compound:true, location:"gym_required", equipment:["machine"], tags:["conditioning","cardio"] },

  // ============================================================
  // MOBILITY (Thurin programs)
  // ============================================================
  { name:"Hamstring Kicks", muscle:"Hamstrings", segments:{}, secondary:[], pattern:"Mobility", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility"] },
  { name:"Toe Touch Hold", muscle:"Hamstrings", segments:{}, secondary:[], pattern:"Static Stretch", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility"] },
  { name:"Toe Touch", muscle:"Hamstrings", segments:{}, secondary:[], pattern:"Static Stretch", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility"] },
  { name:"Pancake Stretch", muscle:"Adductors", segments:{}, secondary:["Hamstrings"], pattern:"Static Stretch", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility"] },
  { name:"Standing Pancake", muscle:"Adductors", segments:{}, secondary:["Hamstrings"], pattern:"Static Stretch", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility"] },
  { name:"Roll Down", muscle:"Hamstrings", segments:{}, secondary:["Erector Spinae"], pattern:"Mobility", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility"] },
  { name:"Sit and Reach", muscle:"Hamstrings", segments:{}, secondary:[], pattern:"Static Stretch", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility"] },
  { name:"Jefferson Curl", muscle:"Erector Spinae", segments:{}, secondary:["Hamstrings"], pattern:"Spinal Flexion (Loaded)", compound:false, location:"home_ok", equipment:["dumbbell","kb"], tags:["mobility","joint_prep"] },
  { name:"90/90 Hip Stretch", muscle:"Glutes", segments:{}, secondary:["Adductors"], pattern:"Static Stretch", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility"] },
  { name:"Pigeon Stretch", muscle:"Glutes", segments:{}, secondary:[], pattern:"Static Stretch", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility"] },
  { name:"Deep Squat Hold", muscle:"Adductors", segments:{}, secondary:["Glutes","Quadriceps"], pattern:"Static Stretch", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility"] },
  { name:"Hip Capsule Opener", muscle:"Glutes", segments:{}, secondary:["Adductors"], pattern:"Mobility", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility"] },
  { name:"Hip mobility", muscle:"Glutes", segments:{}, secondary:["Adductors"], pattern:"Mobility", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility","user_routine"] },
  { name:"Couch Stretch", muscle:"Quadriceps", segments:{}, secondary:[], pattern:"Static Stretch", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility"] },
  { name:"Shoulder Dislocates (Band)", muscle:"Trapezius", segments:{}, secondary:["Posterior Deltoid"], pattern:"Mobility", compound:false, location:"home_ok", equipment:["band"], tags:["mobility"] },
  { name:"Thoracic Extensions", muscle:"Erector Spinae", segments:{}, secondary:[], pattern:"Mobility", compound:false, location:"home_ok", equipment:["foam_roller","bodyweight"], tags:["mobility"] },
  { name:"Cat-Cow", muscle:"Erector Spinae", segments:{}, secondary:[], pattern:"Mobility", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility"] },
  { name:"World's Greatest Stretch", muscle:"Adductors", segments:{}, secondary:["Glutes","Erector Spinae"], pattern:"Mobility", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility"] },
  { name:"Wrist Circles", muscle:"Forearms", segments:{}, secondary:[], pattern:"Mobility", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility","joint_prep"] },
  { name:"Ankle Circles", muscle:"Calves", segments:{}, secondary:["Tibialis Anterior"], pattern:"Mobility", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility","joint_prep"] },
  { name:"Jog in place", muscle:"Calves", segments:{}, secondary:[], pattern:"Warmup", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility","warmup"] },
  { name:"Leg swings", muscle:"Hamstrings", segments:{}, secondary:["Glutes"], pattern:"Warmup", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility","warmup"] },
  { name:"Walking lunges", muscle:"Quadriceps", segments:{}, secondary:["Glutes","Hamstrings"], pattern:"Warmup", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility","warmup"] },
  { name:"High knees", muscle:"Quadriceps", segments:{}, secondary:["Calves"], pattern:"Warmup", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["mobility","warmup"] },

  // ============================================================
  // ACTIVE RECOVERY (rest day tasks)
  // ============================================================
  { name:"Long Walk (30–60 min)", muscle:"Calves", segments:{}, secondary:[], pattern:"Walking", compound:false, location:"outdoor_ok", equipment:["bodyweight"], tags:["recovery","cardio"] },
  { name:"Sauna Session (15–20 min)", muscle:"", segments:{}, secondary:[], pattern:"Recovery", compound:false, location:"specific_facility", equipment:["sauna"], tags:["recovery"] },
  { name:"Breathwork (10 min)", muscle:"", segments:{}, secondary:[], pattern:"Recovery", compound:false, location:"anywhere", equipment:["bodyweight"], tags:["recovery"] },
  { name:"1 hr treadmill walk", muscle:"Calves", segments:{}, secondary:[], pattern:"Walking", compound:false, location:"gym_or_home_gym", equipment:["treadmill"], tags:["recovery","cardio","user_routine"] },
  { name:"1 hr home treadmill walk", muscle:"Calves", segments:{}, secondary:[], pattern:"Walking", compound:false, location:"home_ok", equipment:["treadmill"], tags:["recovery","cardio","user_routine"] },
];

// Helper: build lookups the app can use fast
const EXERCISE_BY_NAME = {};
EXERCISE_DATABASE.forEach(ex => { EXERCISE_BY_NAME[ex.name] = ex; });

const EXERCISES_BY_MUSCLE = {};
EXERCISE_DATABASE.forEach(ex => {
  const m = ex.muscle;
  if (!m) return;
  if (!EXERCISES_BY_MUSCLE[m]) EXERCISES_BY_MUSCLE[m] = [];
  EXERCISES_BY_MUSCLE[m].push(ex);
});

const EXERCISES_BY_PATTERN = {};
EXERCISE_DATABASE.forEach(ex => {
  const p = ex.pattern;
  if (!p) return;
  if (!EXERCISES_BY_PATTERN[p]) EXERCISES_BY_PATTERN[p] = [];
  EXERCISES_BY_PATTERN[p].push(ex);
});
