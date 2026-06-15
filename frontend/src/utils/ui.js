import { renderIcons } from "../icons.js";

export function escapeHtml(value = "") {
  const node = document.createElement("div");
  node.textContent = String(value);
  return node.innerHTML;
}

export function toast(message, type = "success") {
  const root = document.querySelector("#toast-root");
  if (!root) return;
  const item = document.createElement("div");
  item.className = `toast toast-${type}`;
  item.innerHTML = `<span data-lucide="${type === "success" ? "circle-check" : type === "error" ? "circle-alert" : "info"}"></span><span>${escapeHtml(message)}</span>`;
  root.appendChild(item);
  renderIcons(item);
  requestAnimationFrame(() => item.classList.add("show"));
  setTimeout(() => {
    item.classList.remove("show");
    setTimeout(() => item.remove(), 250);
  }, 2800);
}

export function confirmDialog({ title, message, confirmLabel = "Ya, lanjutkan", danger = false }) {
  return new Promise((resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "confirm-dialog";
    dialog.innerHTML = `
      <form method="dialog">
        <div class="dialog-icon ${danger ? "danger" : ""}"><span data-lucide="${danger ? "trash-2" : "circle-help"}"></span></div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
        <div class="dialog-actions">
          <button class="btn btn-secondary" value="cancel">Batal</button>
          <button class="btn ${danger ? "btn-danger" : "btn-primary"}" value="confirm">${escapeHtml(confirmLabel)}</button>
        </div>
      </form>
    `;
    document.body.appendChild(dialog);
    renderIcons(dialog);
    dialog.addEventListener("close", () => {
      resolve(dialog.returnValue === "confirm");
      dialog.remove();
    });
    dialog.showModal();
  });
}

export function skeleton(count = 8) {
  return `<div class="product-grid skeleton-grid">${Array.from({ length: count }, () => `
    <div class="skeleton-card"><span></span><i></i><i></i><i></i></div>
  `).join("")}</div>`;
}

export function emptyState({ icon = "package-open", title, message, action = "" }) {
  return `<section class="empty-state"><span data-lucide="${icon}"></span><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p>${action}</section>`;
}
