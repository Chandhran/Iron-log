// program-storage.js — persistence for the active program, config, and archives.
// Handles: (a) legacy migration from program-data.js, (b) new-user detection,
// (c) archive-on-complete + regenerate, (d) safe delete when nothing logged.

const CONFIG_KEY = "ironlog_config_v1";
const PROGRAM_KEY = "ironlog_program_v1";
const ARCHIVES_KEY = "ironlog_archives_v1";

// ---------- CONFIG ----------
// { program_configured: bool, created_at: iso, source: "legacy"|"manual"|"generated",
//   program_id, weeks_total }
function loadConfig() {
  const raw = localStorage.getItem(CONFIG_KEY);
  return raw ? JSON.parse(raw) : null;
}
function saveConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

// ---------- PROGRAM ----------
// Returns the currently-active program object, mirroring the shape of the
// legacy PROGRAM global from program-data.js: { strength: {days:[...]}, hypertrophy: {days:[...]} }
// (or a single { days:[...] } for non-alternating programs).
function loadActiveProgram() {
  const raw = localStorage.getItem(PROGRAM_KEY);
  if (raw) return JSON.parse(raw);
  return null;
}
function saveActiveProgram(program) {
  localStorage.setItem(PROGRAM_KEY, JSON.stringify(program));
}

// ---------- MIGRATION FROM LEGACY program-data.js ----------
// Runs once at app boot. The trick: distinguish an EXISTING user upgrading
// (who has months of sessions/config in localStorage — we want their routine
// preserved) from a FRESH INSTALL by a friend uploading the zip (who should
// hit the welcome screen instead).
//
// Marker of "existing user": any of the legacy app's localStorage keys are
// populated. Marker of "fresh install": localStorage completely empty of
// Iron Log keys.
function migrateLegacyProgramIfNeeded() {
  const cfg = loadConfig();
  if (cfg && cfg.program_configured) return; // already migrated

  // Detect existing user via presence of any legacy app keys
  const legacyKeys = [
    "ironlog_sessions_v1",
    "ironlog_weight_logs_v1",
    "ironlog_state_v1",
    "ironlog_sync_config_v1",
    "ironlog_food_profile_v1",
    "ironlog_food_logs_v1",
  ];
  const isExistingUser = legacyKeys.some(k => localStorage.getItem(k) !== null);

  if (!isExistingUser) {
    // Fresh install: leave config empty. Welcome screen will fire.
    // Also blank out the legacy PROGRAM global so Train tab is empty.
    window.PROGRAM = {};
    return;
  }

  // Existing user: migrate the legacy PROGRAM into storage.
  if (typeof PROGRAM !== "undefined" && PROGRAM && Object.keys(PROGRAM).length > 0) {
    saveActiveProgram(PROGRAM);
    saveConfig({
      program_configured: true,
      created_at: new Date().toISOString(),
      source: "legacy",
      program_id: "legacy_16w_alternating",
      weeks_total: 16,
      title: "Powerbuilding — 16 Week Cycle",
    });
  }
}

// ---------- LEGACY GLOBAL BINDING ----------
// The rest of the app reads a global `PROGRAM`. Once migration/loading is
// done, we rebind it to whatever's active in storage.
function activateStoredProgram() {
  const stored = loadActiveProgram();
  if (stored && typeof stored === "object") {
    window.PROGRAM = stored;
  }
}

// ---------- ARCHIVES ----------
// Archived programs (past cycles). Each entry:
// { id, archived_at, program, session_count, config }
function loadArchives() {
  const raw = localStorage.getItem(ARCHIVES_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveArchives(archives) {
  localStorage.setItem(ARCHIVES_KEY, JSON.stringify(archives));
}
function archiveActiveProgram(sessionCount) {
  const program = loadActiveProgram();
  const config = loadConfig();
  if (!program) return null;
  const archives = loadArchives();
  const archive = {
    id: "archive_" + Date.now(),
    archived_at: new Date().toISOString(),
    program,
    session_count: sessionCount || 0,
    config: config || {},
  };
  archives.push(archive);
  saveArchives(archives);
  return archive;
}
function deleteArchive(archiveId) {
  const archives = loadArchives().filter(a => a.id !== archiveId);
  saveArchives(archives);
}

// ---------- LIFECYCLE HELPERS ----------
function hasProgramConfigured() {
  const cfg = loadConfig();
  return !!(cfg && cfg.program_configured);
}
function countActiveSessions() {
  if (typeof sessions === "undefined") return 0;
  return sessions.length;
}
function clearActiveProgram() {
  localStorage.removeItem(PROGRAM_KEY);
  localStorage.removeItem(CONFIG_KEY);
  window.PROGRAM = {}; // clear the legacy global so the app can re-init
}

// Called when the user wants to build a new program. Behaviour depends on
// whether there are any logged sessions already.
// Returns "no_program" | "empty_program" | "has_sessions"
function programBuildContext() {
  if (!hasProgramConfigured()) return "no_program";
  if (countActiveSessions() === 0) return "empty_program";
  return "has_sessions";
}

// ---------- DYNAMIC PROGRAM STRUCTURE ----------
// These replace the hardcoded TOTAL_WEEKS / phaseForWeek from program-data.js.
// For generated programs, they respect the config; for legacy, they fall back.
function getTotalWeeks() {
  const cfg = loadConfig();
  if (cfg && cfg.weeks_total) return cfg.weeks_total;
  if (typeof TOTAL_WEEKS !== "undefined") return TOTAL_WEEKS;
  return 12;
}

function getPhaseForWeek(week) {
  const program = (typeof PROGRAM !== "undefined") ? PROGRAM : {};
  const keys = Object.keys(program).filter(k => !k.startsWith("_"));
  const cfg = loadConfig();
  const perio = (cfg && cfg.intake_answers && cfg.intake_answers.periodization_style) || null;

  if (keys.length === 0) return null;
  if (keys.length === 1) return keys[0];

  // If has both strength & hypertrophy phases
  if (keys.includes("strength") && keys.includes("hypertrophy")) {
    if (perio === "block") {
      // 4 weeks strength, 4 weeks hypertrophy, alternating blocks
      const blockIdx = Math.floor((week - 1) / 4);
      return blockIdx % 2 === 0 ? "strength" : "hypertrophy";
    }
    // Default: week-alternating (odd=strength, even=hypertrophy) — matches legacy
    return (week % 2 === 1) ? "strength" : "hypertrophy";
  }

  // Fallback: first key
  return keys[0];
}
