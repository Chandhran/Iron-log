// Anatomical front/back body silhouette generator.
// Every muscle is a real, separately addressable shape. The primary muscle for
// an exercise glows in its full color; secondary/assisting muscles glow in a
// lighter shade of the same palette. Everything else stays a dim outline so
// the diagram always reads as an accurate figure.

const BODY_LINE = "#3a3f45";      // resting outline stroke
const BODY_FILL_DIM = "#232629";  // resting fill (untouched muscle)

function glowFilterDefs(idSuffix) {
  return `
    <filter id="glowStrong${idSuffix}" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="2.2" result="blur1"/>
      <feMerge>
        <feMergeNode in="blur1"/>
        <feMergeNode in="blur1"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="glowSoft${idSuffix}" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="1.4" result="blur2"/>
      <feMerge>
        <feMergeNode in="blur2"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  `;
}

// Gender-aware body shapes. Until separate male/female artwork is supplied,
// both genders render the same unisex silhouette — but the switch is wired so
// that adding shapeAttrsFrontFemale()/shapeAttrsBackFemale() later is a
// drop-in change with no other code to touch.
let CURRENT_BODY_GENDER = "male";
function setBodyDiagramGender(gender) {
  CURRENT_BODY_GENDER = gender === "female" ? "female" : "male";
}

function shapeAttrsFront() {
  if (CURRENT_BODY_GENDER === "female" && typeof shapeAttrsFrontFemale === "function") {
    return shapeAttrsFrontFemale();
  }
  return shapeAttrsFrontUnisex();
}
function shapeAttrsBack() {
  if (CURRENT_BODY_GENDER === "female" && typeof shapeAttrsBackFemale === "function") {
    return shapeAttrsBackFemale();
  }
  return shapeAttrsBackUnisex();
}

function shapeAttrsFrontUnisex() {
  return {
    neck:        `<rect x="45" y="21" width="10" height="9" rx="2"/>`,
    delt:        `<circle cx="26" cy="39" r="8.5"/><circle cx="74" cy="39" r="8.5"/>`,
    chest:       `<path d="M 33 36 Q 50 33 67 36 L 67 52 Q 50 60 33 52 Z"/>`,
    biceps:      `<rect x="14" y="41" width="9.5" height="28" rx="4.5"/><rect x="76.5" y="41" width="9.5" height="28" rx="4.5"/>`,
    forearm:     `<rect x="13" y="71" width="8" height="23" rx="3"/><rect x="79" y="71" width="8" height="23" rx="3"/>`,
    abs:         `<rect x="40" y="60" width="20" height="10" rx="3"/><rect x="40" y="71" width="20" height="10" rx="3"/><rect x="40" y="82" width="20" height="10" rx="3"/>`,
    obliques:    `<rect x="33" y="63" width="6" height="26" rx="3"/><rect x="61" y="63" width="6" height="26" rx="3"/>`,
    adductors:   `<path d="M 42 104 Q 50 100 58 104 L 58 124 Q 50 130 42 124 Z"/>`,
    quads:       `<path d="M 28 100 Q 36 96 44 100 L 43 141 Q 36 146 29 141 Z"/><path d="M 56 100 Q 64 96 72 100 L 71 141 Q 64 146 57 141 Z"/>`,
    tibialis:    `<rect x="30" y="150" width="12" height="32" rx="4"/><rect x="58" y="150" width="12" height="32" rx="4"/>`,
  };
}

function shapeAttrsBackUnisex() {
  return {
    "delt-rear": `<circle cx="26" cy="39" r="8.5"/><circle cx="74" cy="39" r="8.5"/>`,
    traps:       `<path d="M 37 34 L 63 34 L 55 52 L 45 52 Z"/>`,
    rhomboids:   `<rect x="44" y="48" width="12" height="15" rx="3"/>`,
    lats:        `<path d="M 29 50 Q 27 66 32 79 L 44 74 L 44 52 Z"/><path d="M 71 50 Q 73 66 68 79 L 56 74 L 56 52 Z"/>`,
    triceps:     `<rect x="14" y="41" width="9.5" height="28" rx="4.5"/><rect x="76.5" y="41" width="9.5" height="28" rx="4.5"/>`,
    forearm:     `<rect x="13" y="71" width="8" height="23" rx="3"/><rect x="79" y="71" width="8" height="23" rx="3"/>`,
    erectors:    `<rect x="43" y="78" width="14" height="23" rx="4"/>`,
    glutes:      `<path d="M 32 100 Q 50 96 68 100 L 66 120 Q 50 126 34 120 Z"/>`,
    hamstrings:  `<path d="M 29 120 Q 36 117 43 120 L 43 155 Q 36 160 29 155 Z"/><path d="M 57 120 Q 64 117 71 120 L 71 155 Q 64 160 57 155 Z"/>`,
    calves:      `<rect x="30" y="156" width="12" height="27" rx="4"/><rect x="58" y="156" width="12" height="27" rx="4"/>`,
  };
}

const FRONT_ALL_REGIONS = ["neck","delt","chest","biceps","forearm","abs","obliques","adductors","quads","tibialis"];
const BACK_ALL_REGIONS = ["delt-rear","traps","rhomboids","lats","triceps","forearm","erectors","glutes","hamstrings","calves"];

function renderRegions(shapes, allRegions, highlightMap, filterSuffix) {
  return allRegions.map(region => {
    const svgFragment = shapes[region];
    if (!svgFragment) return "";
    const hl = highlightMap[region];
    if (!hl) {
      return `<g fill="${BODY_FILL_DIM}" stroke="${BODY_LINE}" stroke-width="0.6">${svgFragment}</g>`;
    }
    const filterId = hl.strength === "strong" ? `glowStrong${filterSuffix}` : `glowSoft${filterSuffix}`;
    return `<g fill="${hl.color}" stroke="${hl.color}" stroke-width="0.5" filter="url(#${filterId})">${svgFragment}</g>`;
  }).join("");
}

function baseFigureChrome() {
  return {
    head: `<ellipse cx="50" cy="13" rx="9" ry="10" fill="${BODY_FILL_DIM}" stroke="${BODY_LINE}" stroke-width="0.6"/>`,
    feet: `<ellipse cx="35" cy="187" rx="7" ry="4" fill="${BODY_FILL_DIM}" stroke="${BODY_LINE}" stroke-width="0.6"/><ellipse cx="65" cy="187" rx="7" ry="4" fill="${BODY_FILL_DIM}" stroke="${BODY_LINE}" stroke-width="0.6"/>`,
  };
}

function svgWrap(innerContent, filterSuffix) {
  const chrome = baseFigureChrome();
  return `<svg viewBox="0 0 100 210" class="body-svg" xmlns="http://www.w3.org/2000/svg">
    <defs>${glowFilterDefs(filterSuffix)}</defs>
    ${chrome.head}
    ${innerContent}
    ${chrome.feet}
  </svg>`;
}

function frontSVG(highlightMap, filterSuffix = "F") {
  return svgWrap(renderRegions(shapeAttrsFront(), FRONT_ALL_REGIONS, highlightMap, filterSuffix), filterSuffix);
}
function backSVG(highlightMap, filterSuffix = "B") {
  return svgWrap(renderRegions(shapeAttrsBack(), BACK_ALL_REGIONS, highlightMap, filterSuffix), filterSuffix);
}

function buildHighlightMaps(primaryMuscle, secondaryMuscles = []) {
  const front = {};
  const back = {};
  const primaryInfo = MUSCLE_INFO[primaryMuscle];
  if (primaryInfo) {
    const target = primaryInfo.view === "back" ? back : front;
    target[primaryInfo.region] = { color: primaryInfo.color, strength: "strong" };
  }
  secondaryMuscles.forEach(m => {
    const info = MUSCLE_INFO[m];
    if (!info) return;
    const target = info.view === "back" ? back : front;
    if (!target[info.region]) {
      target[info.region] = { color: info.light, strength: "soft" };
    }
  });
  return { front, back };
}

function bodyDiagramFor(primaryMuscle, secondaryMuscles = []) {
  const info = MUSCLE_INFO[primaryMuscle];
  if (!info) return "";
  const { front, back } = buildHighlightMaps(primaryMuscle, secondaryMuscles);
  const suffix = Math.random().toString(36).slice(2, 8);
  if (info.region === "fullbody") {
    const allFront = {};
    FRONT_ALL_REGIONS.forEach(r => { allFront[r] = { color: info.color, strength: "soft" }; });
    return frontSVG(allFront, suffix);
  }
  return info.view === "back" ? backSVG(back, "b" + suffix) : frontSVG(front, "f" + suffix);
}

// Monochromatic weekly volume view: one hue, intensity driven by set count.
// Darker = more volume that week, lighter = less. Untouched muscles stay at
// the neutral resting tone so "trained a little" is still visibly different
// from "not trained at all".
const VOLUME_HUE = "205"; // blue-teal, degrees
function volumeColorForCount(count, maxCount) {
  if (count <= 0) return null; // caller falls back to resting dim fill
  const frac = maxCount > 0 ? count / maxCount : 0;
  // lightness 72% (low volume) down to 26% (highest volume)
  const lightness = Math.round(72 - frac * 46);
  return `hsl(${VOLUME_HUE}, 65%, ${lightness}%)`;
}

function weeklyVolumeBodyDiagrams(muscleSetCounts) {
  const maxCount = Math.max(1, ...Object.values(muscleSetCounts));
  const front = {};
  const back = {};
  Object.entries(muscleSetCounts).forEach(([muscle, count]) => {
    const info = MUSCLE_INFO[muscle];
    if (!info || info.region === "fullbody" || count <= 0) return;
    const target = info.view === "back" ? back : front;
    const color = volumeColorForCount(count, maxCount);
    target[info.region] = { color, strength: "strong" };
  });
  const suffix = Math.random().toString(36).slice(2, 8);
  return {
    front: frontSVG(front, "vf" + suffix),
    back: backSVG(back, "vb" + suffix),
  };
}

function weeklyBodyDiagrams(muscleStrengthMap) {
  const front = {};
  const back = {};
  Object.entries(muscleStrengthMap).forEach(([muscle, strength]) => {
    const info = MUSCLE_INFO[muscle];
    if (!info || info.region === "fullbody") return;
    const target = info.view === "back" ? back : front;
    const color = strength === "primary" ? info.color : info.light;
    const sev = strength === "primary" ? "strong" : "soft";
    if (!target[info.region] || sev === "strong") {
      target[info.region] = { color, strength: sev };
    }
  });
  const suffix = Math.random().toString(36).slice(2, 8);
  return {
    front: frontSVG(front, "wf" + suffix),
    back: backSVG(back, "wb" + suffix),
  };
}
