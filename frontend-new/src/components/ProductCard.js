import { formatCurrency, formatNumber } from "../utils/formatCurrency.js";
import { escapeHtml } from "../utils/ui.js";

export function ProductCard(product, compact = false) {
  return `
    <article class="product-card ${compact ? "compact" : ""}">
      <a class="product-card-media" href="#/product/${product.id}" aria-label="${escapeHtml(product.name)}">
        <img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy" />
        ${product.discount ? `<span class="discount-pill">-${product.discount}%</span>` : ""}
        <button class="wishlist-button" type="button" aria-label="Simpan produk"><span data-lucide="heart"></span></button>
      </a>
      <div class="product-card-content">
        <a class="product-card-title" href="#/product/${product.id}">${escapeHtml(product.name)}</a>
        <div class="product-price">${formatCurrency(product.price)}</div>
        ${product.discount ? `<div class="product-old-price">${formatCurrency(product.originalPrice)}</div>` : `<div class="product-old-price placeholder">&nbsp;</div>`}
        <div class="store-line"><span data-lucide="map-pin"></span>${escapeHtml(product.store.location)} &middot; ${escapeHtml(product.store.name)}</div>
        <div class="rating-line"><span data-lucide="star"></span><strong>${product.rating}</strong><span>&middot; ${formatNumber(product.sold)} terjual</span></div>
        <button class="btn btn-soft add-cart-card" type="button" data-add-cart="${product.id}"><span data-lucide="shopping-cart"></span> Tambah</button>
      </div>
    </article>
  `;
}

export function ProductGrid(items, compact = false) {
  return `<div class="product-grid">${items.map((product) => ProductCard(product, compact)).join("")}</div>`;
}

export const productCard = ProductCard;
export const productGrid = ProductGrid;
