// home.js — the Home tab. Shows dashboard widgets for existing users, or the
// welcome / "Build your routine" screen for new users. Also owns the
// "Build a new routine" button at the bottom of the Home tab.

function renderHomeTab() {
  const container = document.getElementById("view-home");
  if (!container) return;

  if (!hasProgramConfigured()) {
    renderWelcomeScreen(container);
    return;
  }

  // Existing user — dashboard widgets + build-new button at bottom
  container.innerHTML = `
    <div class="dashboard" id="dashboard-home"></div>
    <div class="home-actions">
      <button class="build-new-btn" id="homeBuildNewBtn">Build a new routine</button>
    </div>
  `;
  renderDashboard("dashboard-home");
  document.getElementById("homeBuildNewBtn").addEventListener("click", handleBuildNewRoutineTap);
}

function renderWelcomeScreen(container) {
  const streak = 0;
  const monday = getMonday(new Date());
  const dayLetters = ["M", "T", "W", "T", "F", "S", "S"];
  const weekDotsHtml = dayLetters.map((letter, i) => {
    const d = addDays(monday, i);
    const isToday = sameDay(d, new Date());
    return `<div class="wk-dot-col">
      <span class="wk-dot ${isToday ? "today" : ""}"></span>
      <span class="wk-dot-label">${letter}</span>
    </div>`;
  }).join("");

  container.innerHTML = `
    <div class="bento-row">
      <div class="bento-card bento-clock">
        <div class="bento-label" id="clockDay-welcome">–</div>
        <div class="bento-big" id="clockTime-welcome">--:--</div>
        <div class="bento-sub" id="clockDate-welcome">–</div>
      </div>
      <div class="bento-card bento-streak">
        <div class="bento-label">Streak</div>
        <div class="bento-big">0<span class="bento-unit">days</span></div>
        <div class="bento-sub">start your first session</div>
      </div>
    </div>

    <div class="bento-card bento-week">
      <div class="bento-label">This week</div>
      <div class="wk-dots-row">${weekDotsHtml}</div>
      <div class="bento-sub">0/7 days logged</div>
    </div>

    <div class="welcome-hero">
      <div class="welcome-hero-title">Welcome to Iron Log</div>
      <div class="welcome-hero-sub">
        Answer a handful of questions and we'll generate a training program
        tailored to your goals, schedule, equipment, and body.
      </div>
    </div>

    <div class="home-actions">
      <button class="build-new-btn primary" id="welcomeBuildBtn">Click here to build your workout routine</button>
    </div>
  `;

  startClock("welcome");
  document.getElementById("welcomeBuildBtn").addEventListener("click", () => {
    if (typeof launchIntake === "function") launchIntake();
  });
}

// User tapped "Build a new routine" on the Home tab (existing-user case).
function handleBuildNewRoutineTap() {
  const context = programBuildContext(); // "empty_program" or "has_sessions"

  if (context === "empty_program") {
    confirmAction({
      title: "Start over?",
      body: "You haven't logged any sessions on this routine yet, so nothing will be lost.",
      confirmLabel: "Yes, start over",
      cancelLabel: "Cancel",
      danger: false,
      onConfirm: () => {
        clearActiveProgram();
        if (typeof launchIntake === "function") launchIntake();
        else location.reload();
      },
    });
    return;
  }

  // has_sessions: give archive vs delete choice
  const sessionCount = countActiveSessions();
  const weekCount = sessionCount > 0
    ? Math.max(...sessions.map(s => s.week || 1))
    : 0;

  const body = `
    <p>You've logged <strong>${sessionCount} session${sessionCount === 1 ? "" : "s"}</strong>
       across <strong>${weekCount} week${weekCount === 1 ? "" : "s"}</strong> on this program.
       What should we do with it?</p>
    <div class="choice-row">
      <button class="choice-btn" id="archiveChoiceBtn">
        <strong>Archive it</strong>
        <span>Preserved in History, viewable anytime.</span>
      </button>
      <button class="choice-btn danger" id="deleteChoiceBtn">
        <strong>Delete it</strong>
        <span>Program and its ${sessionCount} sessions gone permanently.</span>
      </button>
    </div>
  `;

  confirmAction({
    title: "Build a new routine",
    body,
    confirmLabel: "Cancel", // hide by using cancel-only pattern
    cancelLabel: "Never mind",
    danger: false,
    onConfirm: () => {}, // no primary action; user picks a choice-btn
  });

  // Wire the choice buttons after the modal renders
  setTimeout(() => {
    const archiveBtn = document.getElementById("archiveChoiceBtn");
    const deleteBtn = document.getElementById("deleteChoiceBtn");
    if (archiveBtn) archiveBtn.addEventListener("click", () => {
      document.getElementById("confirm-modal-overlay")?.remove();
      archiveActiveProgram(sessionCount);
      clearActiveProgram();
      showToast("Program archived");
      if (typeof launchIntake === "function") launchIntake();
      else location.reload();
    });
    if (deleteBtn) deleteBtn.addEventListener("click", () => {
      document.getElementById("confirm-modal-overlay")?.remove();
      confirmDeleteProgram(sessionCount);
    });
    // Hide the default confirm button since we're using choice buttons
    const defConfirm = document.getElementById("confirm-modal-confirm");
    if (defConfirm) defConfirm.style.display = "none";
  }, 50);
}

function confirmDeleteProgram(sessionCount) {
  confirmAction({
    title: "Delete permanently?",
    body: `This deletes your program and <strong>${sessionCount} logged session${sessionCount === 1 ? "" : "s"}</strong>. This cannot be undone.`,
    confirmLabel: "Yes, delete",
    cancelLabel: "Cancel",
    danger: true,
    onConfirm: () => {
      // Wipe program + sessions
      clearActiveProgram();
      sessions.length = 0;
      saveSessions(sessions);
      showToast("Program and sessions deleted");
      if (typeof launchIntake === "function") launchIntake();
      else location.reload();
    },
  });
}
