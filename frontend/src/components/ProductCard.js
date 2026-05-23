import { formatCurrency } from "../utils/currency.js";
import { escapeHtml } from "../utils/validation.js";

export function ProductCard(product) {
  const disabled = product.stok <= 0 || !product.status_aktif;

  return `
    <article class="product-card">
      <div class="product-media" aria-hidden="true">
        <span class="product-initial">${escapeHtml(product.kategori.slice(0, 2).toUpperCase())}</span>
        <span class="product-category">${escapeHtml(product.kategori)}</span>
      </div>
      <div class="product-body">
        <div class="product-meta">
          <span class="pill">${escapeHtml(product.kategori)}</span>
          <span class="${product.stok === 0 ? "stock-empty" : ""}">
            ${product.stok === 0 ? "Stok habis" : `Stok ${product.stok}`}
          </span>
        </div>
        <h3>${escapeHtml(product.nama_produk)}</h3>
        <p>${escapeHtml(product.deskripsi)}</p>
        <div class="product-footer">
          <strong>${formatCurrency(product.harga)}</strong>
          <div class="product-actions product-actions-stacked">
            <a class="secondary-button small" href="#/products/${product.product_id}">
              Detail
            </a>
            <button
              class="secondary-button small"
              type="button"
              data-add-cart-id="${product.product_id}"
              ${disabled ? "disabled" : ""}
            >
              Keranjang
            </button>
            <button
              class="primary-button small"
              type="button"
              data-checkout-id="${product.product_id}"
              ${disabled ? "disabled" : ""}
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}
