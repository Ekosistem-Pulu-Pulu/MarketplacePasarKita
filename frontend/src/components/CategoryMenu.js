import { escapeHtml } from "../utils/validation.js";

export function CategoryMenu({ categories, activeCategory = "" }) {
  return `
    <div class="category-menu" aria-label="Kategori populer">
      ${categories
        .map(
          (category) => `
            <a
              class="category-tile ${activeCategory === category.name ? "active" : ""}"
              href="#/products?category=${encodeURIComponent(category.name)}"
            >
              <span data-lucide="${escapeHtml(category.icon)}"></span>
              <strong>${escapeHtml(category.name)}</strong>
              <small>${escapeHtml(category.description)}</small>
            </a>
          `
        )
        .join("")}
    </div>
  `;
}
