// body-diagrams.js — anatomical body diagram renderer.
// Loads muscle-highlighting SVGs from body-svgs.js and paints them by either
// (a) a single exercise's primary + secondary muscles, or (b) the week's
// per-muscle set counts on a red intensity scale (darker = higher volume).

let CURRENT_BODY_GENDER = "male";
function setBodyDiagramGender(gender) {
  CURRENT_BODY_GENDER = gender === "female" ? "female" : "male";
}

// Internal muscle name → SVG data-muscle slug (+ which view it lives on).
const MUSCLE_TO_SVG = {
  "Pectoralis Major": { view: "front", slug: "chest" },
  "Anterior Deltoid": { view: "front", slug: "deltoids" },
  "Lateral Deltoid":  { view: "front", slug: "deltoids" },
  "Biceps Brachii":   { view: "front", slug: "biceps" },
  "Forearms":         { view: "both",  slug: "forearm" },
  "Rectus Abdominis": { view: "front", slug: "abs" },
  "Abs":              { view: "front", slug: "abs" },
  "Obliques":         { view: "front", slug: "obliques" },
  "Neck":             { view: "both",  slug: "neck" },
  "Neck (Cervical)":  { view: "both",  slug: "neck" },
  "Deltoids":         { view: "front", slug: "deltoids" },
  "Quadriceps":       { view: "front", slug: "quadriceps" },
  "Adductors":        { view: "both",  slug: "adductors" },
  "Tibialis Anterior":{ view: "front", slug: "tibialis" },
  "Posterior Deltoid":{ view: "back",  slug: "deltoids" },
  "Triceps Brachii":  { view: "back",  slug: "triceps" },
  "Trapezius":        { view: "both",  slug: "trapezius" },
  "Latissimus Dorsi": { view: "back",  slug: "upper-back" },
  "Rhomboids":        { view: "back",  slug: "upper-back" },
  "Erector Spinae":   { view: "back",  slug: "lower-back" },
  "Glutes":           { view: "back",  slug: "gluteal" },
  "Hamstrings":       { view: "back",  slug: "hamstring" },
  "Calves":           { view: "back",  slug: "calves" },
};

// Red intensity scale — darker = higher volume, grey = untrained.
const VOLUME_TIER_COLORS = {
  untrained:   "#3f3f3f",
  veryLow:     "#5a1a1a",
  low:         "#8b1c1c",
  moderate:    "#c0392b",
  high:        "#e74c3c",
  overreached: "#ff6b6b",
};

// Per-muscle MED / MAV top / MRV — pulled from the analysis's volume_rules.
const VOLUME_THRESHOLDS = {
  "Pectoralis Major":  { med: 10, mavTop: 22, mrv: 25 },
  "Latissimus Dorsi":  { med:  8, mavTop: 15, mrv: 18 },
  "Rhomboids":         { med:  8, mavTop: 18, mrv: 22 },
  "Anterior Deltoid":  { med: 12, mavTop: 22, mrv: 30 },
  "Lateral Deltoid":   { med: 12, mavTop: 22, mrv: 30 },
  "Posterior Deltoid": { med: 12, mavTop: 22, mrv: 30 },
  "Trapezius":         { med:  4, mavTop: 12, mrv: 15 },
  "Neck":              { med:  3, mavTop:  6, mrv:  8 },
  "Neck (Cervical)":   { med:  3, mavTop:  6, mrv:  8 },
  "Deltoids":          { med: 12, mavTop: 22, mrv: 30 },
  "Biceps Brachii":    { med:  8, mavTop: 20, mrv: 22 },
  "Triceps Brachii":   { med:  6, mavTop: 20, mrv: 22 },
  "Forearms":          { med:  3, mavTop: 12, mrv: 15 },
  "Quadriceps":        { med:  8, mavTop: 18, mrv: 22 },
  "Hamstrings":        { med:  6, mavTop: 16, mrv: 20 },
  "Glutes":            { med:  8, mavTop: 24, mrv: 28 },
  "Calves":            { med:  4, mavTop: 12, mrv: 16 },
  "Rectus Abdominis":  { med:  3, mavTop: 12, mrv: 18 },
  "Abs":               { med:  3, mavTop: 12, mrv: 18 },
  "Obliques":          { med:  3, mavTop: 12, mrv: 18 },
  "Adductors":         { med:  3, mavTop: 12, mrv: 15 },
  "Tibialis Anterior": { med:  3, mavTop: 10, mrv: 12 },
  "Erector Spinae":    { med:  3, mavTop: 10, mrv: 15 },
};
const DEFAULT_THRESHOLDS = { med: 6, mavTop: 18, mrv: 22 };

function volumeTierColor(count, muscleName) {
  if (count <= 0) return null;
  const t = VOLUME_THRESHOLDS[muscleName] || DEFAULT_THRESHOLDS;
  if (count > t.mrv)     return VOLUME_TIER_COLORS.overreached;
  if (count >= t.mavTop) return VOLUME_TIER_COLORS.high;
  if (count > t.med)     return VOLUME_TIER_COLORS.moderate;
  if (count >= Math.max(1, t.med - 3)) return VOLUME_TIER_COLORS.low;
  return VOLUME_TIER_COLORS.veryLow;
}

// Pick the deeper red when two muscles share a slug (e.g. Ant+Lat delt → deltoids).
const TIER_RANK = {
  [VOLUME_TIER_COLORS.veryLow]: 1,
  [VOLUME_TIER_COLORS.low]: 2,
  [VOLUME_TIER_COLORS.moderate]: 3,
  [VOLUME_TIER_COLORS.high]: 4,
  [VOLUME_TIER_COLORS.overreached]: 5,
};
function pickDeeperColor(existing, incoming) {
  if (!existing) return incoming;
  return (TIER_RANK[incoming] || 0) > (TIER_RANK[existing] || 0) ? incoming : existing;
}

// Inject per-slug fill overrides into the base SVG via extra CSS rules.
function paintSvg(baseSvg, highlightMap) {
  const overrides = Object.entries(highlightMap)
    .filter(([_, color]) => color)
    .map(([slug, color]) =>
      `.muscle-map [data-muscle="${slug}"] { fill: ${color}; }`
    ).join("\n");
  if (!overrides) return baseSvg;
  return baseSvg.replace("</style>", overrides + "\n</style>");
}

function getFrontSvg() {
  if (typeof MALE_FRONT_SVG === "undefined") return "";
  return CURRENT_BODY_GENDER === "female" ? FEMALE_FRONT_SVG : MALE_FRONT_SVG;
}
function getBackSvg() {
  if (typeof MALE_BACK_SVG === "undefined") return "";
  return CURRENT_BODY_GENDER === "female" ? FEMALE_BACK_SVG : MALE_BACK_SVG;
}

// PUBLIC: weekly volume heat map (called by dashboard's Trained Areas card).
function weeklyVolumeBodyDiagrams(muscleSetCounts) {
  const frontHighlights = {};
  const backHighlights = {};
  Object.entries(muscleSetCounts).forEach(([muscle, count]) => {
    const info = MUSCLE_TO_SVG[muscle];
    if (!info) return;
    const color = volumeTierColor(count, muscle);
    if (!color) return;
    if (info.view === "front" || info.view === "both") {
      frontHighlights[info.slug] = pickDeeperColor(frontHighlights[info.slug], color);
    }
    if (info.view === "back" || info.view === "both") {
      backHighlights[info.slug] = pickDeeperColor(backHighlights[info.slug], color);
    }
  });
  return {
    front: paintSvg(getFrontSvg(), frontHighlights),
    back:  paintSvg(getBackSvg(),  backHighlights),
  };
}

// PUBLIC: single-exercise diagram (used in the day's exercise cards).
function bodyDiagramFor(primaryMuscle, secondaryMuscles = []) {
  const info = MUSCLE_TO_SVG[primaryMuscle];
  const primaryColor = "#e74c3c";
  const secondaryColor = "#8b1c1c";
  const frontHighlights = {};
  const backHighlights = {};

  const addHighlight = (muscle, color, isPrimary) => {
    const mi = MUSCLE_TO_SVG[muscle];
    if (!mi) return;
    if (mi.view === "front" || mi.view === "both") {
      if (!frontHighlights[mi.slug] || isPrimary) frontHighlights[mi.slug] = color;
    }
    if (mi.view === "back" || mi.view === "both") {
      if (!backHighlights[mi.slug] || isPrimary) backHighlights[mi.slug] = color;
    }
  };
  secondaryMuscles.forEach(m => addHighlight(m, secondaryColor, false));
  addHighlight(primaryMuscle, primaryColor, true);

  const svg = (info && info.view === "back")
    ? paintSvg(getBackSvg(), backHighlights)
    : paintSvg(getFrontSvg(), frontHighlights);
  return svg;
}
