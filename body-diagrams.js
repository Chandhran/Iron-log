// Simple schematic front/back body silhouette. Every muscle region is a real,
// separately addressable shape — the highlighted one lights up in the muscle's
// color, everything else stays a dim base tone so the diagram always shows an
// accurate figure, never a decorative stand-in.

const BODY_BASE = "#33383d";
const BODY_STROKE = "#464b50";

function regionFill(region, activeRegion, activeColor) {
  return region === activeRegion ? activeColor : BODY_BASE;
}

function frontBodySVG(activeRegion, activeColor) {
  const f = (r) => regionFill(r, activeRegion, activeColor);
  return `
<svg viewBox="0 0 100 200" class="body-svg" xmlns="http://www.w3.org/2000/svg">
  <!-- head -->
  <ellipse cx="50" cy="13" rx="9" ry="10" fill="${BODY_BASE}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- neck -->
  <rect x="45" y="21" width="10" height="8" rx="2" fill="${f('neck')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- shoulders / anterior+lateral delts -->
  <circle cx="27" cy="38" r="8" fill="${f('delt')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <circle cx="73" cy="38" r="8" fill="${f('delt')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- chest -->
  <rect x="33" y="36" width="34" height="22" rx="7" fill="${f('chest')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- abs -->
  <rect x="38" y="60" width="24" height="26" rx="4" fill="${f('abs')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- biceps -->
  <rect x="15" y="41" width="9" height="27" rx="4" fill="${f('biceps')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <rect x="76" y="41" width="9" height="27" rx="4" fill="${f('biceps')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- forearms (context only, not a tracked region) -->
  <rect x="14" y="70" width="8" height="22" rx="3" fill="${BODY_BASE}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <rect x="78" y="70" width="8" height="22" rx="3" fill="${BODY_BASE}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- adductors -->
  <rect x="42" y="102" width="16" height="22" rx="4" fill="${f('adductors')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- quads -->
  <rect x="29" y="98" width="14" height="42" rx="5" fill="${f('quads')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <rect x="57" y="98" width="14" height="42" rx="5" fill="${f('quads')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- tibialis -->
  <rect x="30" y="148" width="12" height="32" rx="4" fill="${f('tibialis')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <rect x="58" y="148" width="12" height="32" rx="4" fill="${f('tibialis')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- feet (context) -->
  <ellipse cx="36" cy="185" rx="7" ry="4" fill="${BODY_BASE}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <ellipse cx="64" cy="185" rx="7" ry="4" fill="${BODY_BASE}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
</svg>`;
}

function backBodySVG(activeRegion, activeColor) {
  const f = (r) => regionFill(r, activeRegion, activeColor);
  return `
<svg viewBox="0 0 100 200" class="body-svg" xmlns="http://www.w3.org/2000/svg">
  <!-- head -->
  <ellipse cx="50" cy="13" rx="9" ry="10" fill="${BODY_BASE}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- neck -->
  <rect x="45" y="21" width="10" height="8" rx="2" fill="${BODY_BASE}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- posterior delts -->
  <circle cx="27" cy="38" r="8" fill="${f('delt-rear')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <circle cx="73" cy="38" r="8" fill="${f('delt-rear')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- traps -->
  <path d="M 38 34 L 62 34 L 56 50 L 44 50 Z" fill="${f('traps')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- rhomboids -->
  <rect x="44" y="48" width="12" height="15" rx="3" fill="${f('rhomboids')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- lats -->
  <rect x="30" y="50" width="15" height="28" rx="5" fill="${f('lats')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <rect x="55" y="50" width="15" height="28" rx="5" fill="${f('lats')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- triceps -->
  <rect x="15" y="41" width="9" height="27" rx="4" fill="${f('triceps')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <rect x="76" y="41" width="9" height="27" rx="4" fill="${f('triceps')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- forearms (context) -->
  <rect x="14" y="70" width="8" height="22" rx="3" fill="${BODY_BASE}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <rect x="78" y="70" width="8" height="22" rx="3" fill="${BODY_BASE}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- erector spinae -->
  <rect x="42" y="78" width="16" height="22" rx="4" fill="${f('erectors')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- glutes -->
  <rect x="33" y="100" width="34" height="18" rx="8" fill="${f('glutes')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- hamstrings -->
  <rect x="29" y="118" width="14" height="34" rx="5" fill="${f('hamstrings')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <rect x="57" y="118" width="14" height="34" rx="5" fill="${f('hamstrings')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- calves -->
  <rect x="30" y="153" width="12" height="27" rx="4" fill="${f('calves')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <rect x="58" y="153" width="12" height="27" rx="4" fill="${f('calves')}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <!-- feet (context) -->
  <ellipse cx="36" cy="185" rx="7" ry="4" fill="${BODY_BASE}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
  <ellipse cx="64" cy="185" rx="7" ry="4" fill="${BODY_BASE}" stroke="${BODY_STROKE}" stroke-width="0.6"/>
</svg>`;
}

// Full-body highlight (used for compound/full-body tagged movements)
function fullBodySVG(activeColor) {
  return frontBodySVG("__all__", activeColor).replace(
    new RegExp(BODY_BASE, "g"), activeColor
  );
}

function bodyDiagramFor(muscleName) {
  const info = MUSCLE_INFO[muscleName];
  if (!info) return "";
  if (info.region === "fullbody") return fullBodySVG(info.color);
  return info.view === "back"
    ? backBodySVG(info.region, info.color)
    : frontBodySVG(info.region, info.color);
}
