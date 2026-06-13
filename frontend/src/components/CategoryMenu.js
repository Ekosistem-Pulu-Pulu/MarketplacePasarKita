import { escapeHtml } from "../utils/validation.js";

export function CategoryMenu({ categories, activeCategory = "", productCounts = {} }) {
  return `
    <div class="category-menu" aria-label="Kategori populer">
      ${categories
        .map((category) => {
          const count = productCounts[category.name] || 0;
          return `
            <a
              class="category-tile ${activeCategory === category.name ? "active" : ""}"
              href="#/products?category=${encodeURIComponent(category.name)}"
            >
              <div class="category-icon-wrapper">
                <span data-lucide="${escapeHtml(category.icon)}"></span>
              </div>
              <strong>${escapeHtml(category.name)}</strong>
              <small class="category-count-badge">${count} Produk</small>
            </a>
          `;
        })
        .join("")}
    </div>
  `;
}
