import { escapeHtml } from "../utils/validation.js";

export function EmptyState({
  icon = "shopping-bag",
  title = "Produk belum tersedia",
  message = "Coba ubah pencarian atau filter untuk melihat pilihan lain.",
  action = "",
} = {}) {
  return `
    <section class="state-panel">
      <span class="state-icon" data-lucide="${escapeHtml(icon)}"></span>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(message)}</p>
      ${action}
    </section>
  `;
}
