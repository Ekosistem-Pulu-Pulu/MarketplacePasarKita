import { formatCurrency } from "../utils/formatCurrency.js";
import { escapeHtml } from "../utils/validation.js";

export function ProductCard(product) {
  const discountLabel = product.discount ? `${product.discount}%` : "";
  const hasDiscount = product.discount > 0 && product.originalPrice;

  // Stock status
  let stockBadge = "";
  if (product.stock === 0) {
    stockBadge = `<span class="stock-badge empty" style="color: var(--red-700); background: var(--red-50); padding: 2px 6px; border-radius: var(--radius-xs); font-size: 11px; font-weight: 800;">Stok Habis</span>`;
  } else if (product.stock <= 5) {
    stockBadge = `<span class="stock-badge warning" style="color: var(--amber-700); background: var(--amber-50); padding: 2px 6px; border-radius: var(--radius-xs); font-size: 11px; font-weight: 800;">Sisa ${product.stock}</span>`;
  } else {
    stockBadge = `<span class="stock-badge info" style="color: var(--slate-500); font-size: 11px; font-weight: 700;">Stok: ${product.stock}</span>`;
  }

  return `
    <article class="product-card">
      <a class="product-image-link" href="#/products/${escapeHtml(product.id)}" aria-label="${escapeHtml(product.name)}">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" />
        ${discountLabel ? `<span class="discount-badge">${discountLabel} Off</span>` : ""}
      </a>

      <div class="product-card-body">
        <div class="product-card-meta">
          <span class="category-chip">${escapeHtml(product.category)}</span>
          <span class="rating-line"><span data-lucide="star"></span>${product.rating.toFixed(1)}</span>
        </div>

        <a class="product-title" href="#/products/${escapeHtml(product.id)}" title="${escapeHtml(product.name)}">
          ${escapeHtml(product.name)}
        </a>

        <div class="product-price-section" style="display: flex; flex-direction: column; gap: 2px; min-height: 42px;">
          ${
            hasDiscount
              ? `
                <div style="display: flex; align-items: center; gap: 6px;">
                  <strong class="product-price" style="color: var(--blue-600);">${formatCurrency(product.price)}</strong>
                  <span class="discount-badge" style="font-size: 10px; padding: 2px 6px; position: static;">-${product.discount}%</span>
                </div>
                <span style="font-size: 12px; color: var(--slate-400); text-decoration: line-through;">${formatCurrency(product.originalPrice)}</span>
              `
              : `<strong class="product-price">${formatCurrency(product.price)}</strong>`
          }
        </div>

        <div class="product-store-line" style="margin-top: auto; padding-top: 8px; border-top: 1px solid var(--slate-100);">
          <div style="display: flex; align-items: center; gap: 4px; min-width: 0;">
            <span data-lucide="map-pin" style="width: 14px; height: 14px; color: var(--slate-400);"></span>
            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80px;" title="${escapeHtml(product.store.location)}">${escapeHtml(product.store.location)}</span>
          </div>
          <span>${product.sold} terjual</span>
        </div>

        <div class="product-card-footer" style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px;">
          ${stockBadge}
          <button class="btn btn-primary btn-compact" type="button" data-add-cart="${escapeHtml(product.id)}" style="padding: 0 10px; min-height: 32px; font-size: 13px;" ${product.stock === 0 ? "disabled" : ""}>
            <span data-lucide="shopping-cart" style="width: 14px; height: 14px;"></span>
            Beli
          </button>
        </div>
      </div>
    </article>
  `;
}
