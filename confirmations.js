// confirmations.js — reusable confirmation modal for destructive actions.
// Ensures a fat-finger delete can't wipe user data.

// confirmAction({ title, body, confirmLabel, cancelLabel, danger, onConfirm })
// Renders a modal, waits for user's second tap to fire onConfirm.
function confirmAction({
  title = "Are you sure?",
  body = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm = () => {},
}) {
  // Kill any existing modal
  const existing = document.getElementById("confirm-modal-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "confirm-modal-overlay";
  overlay.className = "confirm-modal-overlay";

  overlay.innerHTML = `
    <div class="confirm-modal">
      <div class="confirm-modal-title">${escapeHtml(title)}</div>
      <div class="confirm-modal-body">${body}</div>
      <div class="confirm-modal-actions">
        <button class="confirm-modal-cancel" id="confirm-modal-cancel">${escapeHtml(cancelLabel)}</button>
        <button class="confirm-modal-confirm ${danger ? "danger" : ""}" id="confirm-modal-confirm">${escapeHtml(confirmLabel)}</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("visible"));

  const close = () => {
    overlay.classList.remove("visible");
    setTimeout(() => overlay.remove(), 200);
  };

  document.getElementById("confirm-modal-cancel").addEventListener("click", close);
  document.getElementById("confirm-modal-confirm").addEventListener("click", () => {
    close();
    setTimeout(() => onConfirm(), 220);
  });
  overlay.addEventListener("click", e => {
    if (e.target === overlay) close();
  });
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
