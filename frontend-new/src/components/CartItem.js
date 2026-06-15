import { formatCurrency } from "../utils/formatCurrency.js";
import { escapeHtml } from "../utils/ui.js";

export function CartItem(item) {
  return `
    <article class="cart-item">
      <input type="checkbox" aria-label="Pilih ${escapeHtml(item.product.name)}" data-cart-select="${item.productId}" data-variant="${escapeHtml(item.variant)}" ${item.selected ? "checked" : ""} />
      <img src="${item.product.image}" alt="${escapeHtml(item.product.name)}" />
      <div class="cart-item-info">
        <span class="store-badge"><span data-lucide="badge-check"></span>${item.product.store.name}</span>
        <a href="#/product/${item.product.id}">${escapeHtml(item.product.name)}</a>
        ${item.variant ? `<small>Variasi: ${escapeHtml(item.variant)}</small>` : ""}
        <strong>${formatCurrency(item.product.price)}</strong>
      </div>
      <div class="cart-item-actions">
        <button class="icon-btn" aria-label="Hapus ${escapeHtml(item.product.name)}" data-remove-cart="${item.productId}" data-variant="${escapeHtml(item.variant)}"><span data-lucide="trash-2"></span></button>
        <div class="qty-control">
          <button aria-label="Kurangi jumlah ${escapeHtml(item.product.name)}" data-cart-dec="${item.productId}" data-variant="${escapeHtml(item.variant)}"><span data-lucide="minus"></span></button>
          <input value="${item.qty}" readonly aria-label="Jumlah ${escapeHtml(item.product.name)}" />
          <button aria-label="Tambah jumlah ${escapeHtml(item.product.name)}" data-cart-inc="${item.productId}" data-variant="${escapeHtml(item.variant)}"><span data-lucide="plus"></span></button>
        </div>
      </div>
    </article>
  `;
}
