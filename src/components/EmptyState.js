import { escapeHtml } from "../utils/validation.js";

export function EmptyState({
  title = "Data tidak tersedia",
  message = "Coba ubah pencarian atau refresh halaman.",
  action = "",
} = {}) {
  return `
    <div class="empty-state">
      <span class="empty-mark" aria-hidden="true">PK</span>
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(message)}</p>
      ${action}
    </div>
  `;
}
