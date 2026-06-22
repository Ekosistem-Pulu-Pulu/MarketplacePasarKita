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
  const sections = [...root.children];
  const cards = [...root.querySelectorAll(".product-card, .category-card, .store-card")];
  if (sections.length) {
    gsap.fromTo(sections, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.38, stagger: 0.04, ease: "power2.out", clearProps: "transform,opacity" });
  }
  if (cards.length) {
    gsap.fromTo(cards, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.42, stagger: 0.025, ease: "power2.out", delay: 0.08, clearProps: "transform,opacity" });
  }
  const floatingCards = [...root.querySelectorAll(".floating-card")];
  if (floatingCards.length) {
    gsap.killTweensOf(floatingCards);
    gsap.killTweensOf(floatingCards.flatMap((card) => [...card.querySelectorAll("svg")]));
    gsap.fromTo(
      floatingCards,
      { opacity: 0, y: 18, scale: 0.92, rotate: -2 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotate: 0,
        duration: 0.58,
        stagger: 0.14,
        delay: 0.22,
        ease: "back.out(1.7)",
        onComplete: () => {
          floatingCards.forEach((card, index) => {
            gsap.to(card, {
              x: index % 2 ? -5 : 5,
              y: index % 2 ? -9 : -7,
              rotate: index % 2 ? -1.4 : 1.4,
              duration: 2.8 + index * 0.35,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
            });
            gsap.to(card.querySelector("svg"), {
              scale: 1.12,
              duration: 1.9 + index * 0.2,
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
              transformOrigin: "50% 50%",
            });
          });
        },
      },
    );
  }
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
