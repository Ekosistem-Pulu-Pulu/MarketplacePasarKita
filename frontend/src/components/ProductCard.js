import { formatCurrency } from "../utils/formatCurrency.js";
import { escapeHtml } from "../utils/validation.js";

export function ProductCard(product) {
  const discountLabel = product.discount ? `${product.discount}%` : "";

  return `
    <article class="product-card">
      <a class="product-image-link" href="#/products/${escapeHtml(product.id)}" aria-label="${escapeHtml(product.name)}">
        <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" />
        ${discountLabel ? `<span class="discount-badge">${discountLabel}</span>` : ""}
      </a>

      <div class="product-card-body">
        <div class="product-card-meta">
          <span class="category-chip">${escapeHtml(product.category)}</span>
          <span class="rating-line"><span data-lucide="star"></span>${product.rating.toFixed(1)}</span>
        </div>

        <a class="product-title" href="#/products/${escapeHtml(product.id)}">${escapeHtml(product.name)}</a>
        <strong class="product-price">${formatCurrency(product.price)}</strong>

        <div class="product-store-line">
          <span data-lucide="map-pin"></span>
          <span>${escapeHtml(product.store.location)}</span>
          <span>${product.sold} terjual</span>
        </div>

        <div class="product-card-actions">
          <a class="btn btn-secondary" href="#/products/${escapeHtml(product.id)}">Detail</a>
          <button class="btn btn-primary" type="button" data-add-cart="${escapeHtml(product.id)}">
            <span data-lucide="plus"></span>
            Keranjang
          </button>
        </div>
      </div>
    </article>
  `;
}
