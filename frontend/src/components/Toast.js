import { escapeHtml } from "../utils/validation.js";
import { renderIcons } from "../icons.js";

let toastTimer = null;

const toastMeta = {
  success: { title: "Berhasil", icon: "check" },
  error: { title: "Perlu dicoba lagi", icon: "circle-alert" },
  info: { title: "Info", icon: "bell" },
};

export function showToast(message, type = "success") {
  const root = document.querySelector("#toast-root");
  if (!root) return;

  const meta = toastMeta[type] || toastMeta.success;

  root.innerHTML = `
    <div class="toast toast-${type}" role="status">
      <span class="toast-icon" data-lucide="${meta.icon}"></span>
      <div>
        <strong>${meta.title}</strong>
        <p>${escapeHtml(message)}</p>
      </div>
    </div>
  `;

  renderIcons(root);

  if (toastTimer) window.clearTimeout(toastTimer);

  toastTimer = window.setTimeout(() => {
    root.innerHTML = "";
  }, 3200);
}
