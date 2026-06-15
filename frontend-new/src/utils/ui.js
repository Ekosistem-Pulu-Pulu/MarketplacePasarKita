import { renderIcons } from "../icons.js";
import Toastify from "toastify-js";
import { gsap } from "gsap";

export function escapeHtml(value = "") {
  const node = document.createElement("div");
  node.textContent = String(value);
  return node.innerHTML;
}

export function toast(message, type = "success") {
  const colors = {
    success: "linear-gradient(135deg, #0f766e, #14b8a6)",
    error: "linear-gradient(135deg, #b91c1c, #ef4444)",
    info: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
  };
  Toastify({
    text: message,
    duration: 2800,
    gravity: "top",
    position: "right",
    close: true,
    stopOnFocus: true,
    style: { background: colors[type] || colors.success, borderRadius: "14px", boxShadow: "0 18px 40px rgba(15, 23, 42, .2)" },
  }).showToast();
}

export function animatePage(root = document.querySelector("#view-root")) {
  if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.fromTo(root.children, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.38, stagger: 0.04, ease: "power2.out", clearProps: "transform,opacity" });
  gsap.fromTo(root.querySelectorAll(".product-card, .category-card, .store-card"), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.42, stagger: 0.025, ease: "power2.out", delay: 0.08, clearProps: "transform,opacity" });
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
