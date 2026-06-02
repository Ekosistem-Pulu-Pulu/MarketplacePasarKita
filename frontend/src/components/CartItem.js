import { formatCurrency } from "../utils/formatCurrency.js";
import { escapeHtml } from "../utils/validation.js";

export function CartItem(item) {
  const isDisabled = item.stock <= 0;

  return `
    <article class="cart-item ${isDisabled ? "cart-item-muted" : ""}">
      <label class="cart-check">
        <input
          type="checkbox"
          data-cart-select="${escapeHtml(item.id)}"
          ${item.selected ? "checked" : ""}
          ${isDisabled ? "disabled" : ""}
        />
        <span></span>
      </label>

      <img class="cart-item-image" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" />

      <div class="cart-item-copy">
        <a href="#/products/${escapeHtml(item.id)}">${escapeHtml(item.name)}</a>
        <span>${escapeHtml(item.store.name)} - ${escapeHtml(item.store.location)}</span>
        <small>${isDisabled ? "Produk belum tersedia" : `Stok ${item.stock}`}</small>
      </div>

      <div class="cart-item-price">
        <strong>${formatCurrency(item.price)}</strong>
        <div class="quantity-stepper" aria-label="Jumlah produk">
          <button type="button" data-cart-dec="${escapeHtml(item.id)}" ${item.qty <= 1 || isDisabled ? "disabled" : ""}>
            <span data-lucide="minus"></span>
          </button>
          <input
            type="number"
            min="1"
            max="${item.stock}"
            value="${item.qty}"
            data-cart-qty="${escapeHtml(item.id)}"
            ${isDisabled ? "disabled" : ""}
            aria-label="Jumlah ${escapeHtml(item.name)}"
          />
          <button type="button" data-cart-inc="${escapeHtml(item.id)}" ${item.qty >= item.stock || isDisabled ? "disabled" : ""}>
            <span data-lucide="plus"></span>
          </button>
        </div>
        <button class="text-danger" type="button" data-cart-remove="${escapeHtml(item.id)}">
          <span data-lucide="trash-2"></span>
          Hapus
        </button>
      </div>
    </article>
  `;
}
