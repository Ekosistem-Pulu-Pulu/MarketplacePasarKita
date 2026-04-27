import { escapeHtml } from "../utils/validation.js";

let toastTimer = null;

export function showToast(message, type = "success") {
  const root = document.querySelector("#toast-root");
  if (!root) return;

  root.innerHTML = `
    <div class="toast toast-${type}" role="status">
      <strong>${type === "success" ? "Berhasil" : "Gagal"}</strong>
      <p>${escapeHtml(message)}</p>
    </div>
  `;

  if (toastTimer) {
    window.clearTimeout(toastTimer);
  }

  toastTimer = window.setTimeout(() => {
    root.innerHTML = "";
  }, 3200);
}
