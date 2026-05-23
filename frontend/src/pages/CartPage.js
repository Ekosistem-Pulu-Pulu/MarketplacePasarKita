import { EmptyState } from "../components/EmptyState.js";
import {
  calculateCartSummary,
  getCartItems,
  removeCartItem,
  updateCartItem,
} from "../utils/cart.js";
import { formatCurrency } from "../utils/currency.js";
import { escapeHtml } from "../utils/validation.js";

function cartItemTemplate(item) {
  const unavailable = !item.status_aktif || Number(item.stok) <= 0;

  return `
    <article class="cart-item ${unavailable ? "cart-item-disabled" : ""}">
      <div class="cart-item-img" aria-hidden="true">${escapeHtml(String(item.kategori || "PK").slice(0, 2).toUpperCase())}</div>
      <div class="cart-item-info">
        <label class="cart-select-row">
          <input
            type="checkbox"
            data-cart-select="${escapeHtml(item.product_id)}"
            ${item.selected ? "checked" : ""}
            ${unavailable ? "disabled" : ""}
          />
          <strong>${escapeHtml(item.nama_produk)}</strong>
        </label>
        <span>${escapeHtml(item.seller_id || "-")} - ${escapeHtml(item.kategori || "-")}</span>
        <small>${unavailable ? "Produk tidak tersedia" : `Stok ${item.stok}`}</small>
      </div>
      <div class="cart-item-actions">
        <strong>${formatCurrency(item.harga)}</strong>
        <input
          class="qty-input"
          type="number"
          min="1"
          max="${Number(item.stok) || 1}"
          value="${Number(item.qty) || 1}"
          data-cart-qty="${escapeHtml(item.product_id)}"
          ${unavailable ? "disabled" : ""}
        />
        <button class="text-button danger" type="button" data-cart-remove="${escapeHtml(item.product_id)}">
          Hapus
        </button>
      </div>
    </article>
  `;
}

export async function render() {
  const items = getCartItems();
  const selectedItems = items.filter((item) => item.selected && item.status_aktif);
  const summary = calculateCartSummary(selectedItems);

  return `
    <section class="page-title split-title">
      <div>
        <p class="eyebrow">Keranjang</p>
        <h1>Keranjang belanja</h1>
        <p>Pilih item, cek ringkasan biaya, lalu lanjut checkout.</p>
      </div>
      <a class="secondary-button" href="#/products">Lanjut belanja</a>
    </section>

    ${
      items.length
        ? `
          <section class="cart-layout">
            <div class="cart-list">${items.map(cartItemTemplate).join("")}</div>
            <aside class="summary-card cart-summary-sticky">
              <h2>Ringkasan</h2>
              <div class="summary-row"><span>Item dipilih</span><strong>${summary.item_count}</strong></div>
              <div class="summary-row"><span>Subtotal</span><strong>${formatCurrency(summary.subtotal)}</strong></div>
              <div class="summary-row fee"><span>Marketplace fee 2%</span><strong>${formatCurrency(summary.marketplace_fee)}</strong></div>
              <div class="summary-total"><span>Total</span><strong>${formatCurrency(summary.total_bayar)}</strong></div>
              <a
                class="primary-button block ${selectedItems.length ? "" : "disabled-link"}"
                href="${selectedItems.length ? "#/checkout" : "#/cart"}"
              >
                Checkout item dipilih
              </a>
            </aside>
          </section>
        `
        : EmptyState({
            title: "Keranjang masih kosong",
            message: "Tambahkan produk dari katalog untuk mulai checkout.",
          })
    }
  `;
}

export function afterRender({ renderRoute }) {
  document.querySelectorAll("[data-cart-select]").forEach((input) => {
    input.addEventListener("change", () => {
      updateCartItem(input.dataset.cartSelect, { selected: input.checked });
      renderRoute();
    });
  });

  document.querySelectorAll("[data-cart-qty]").forEach((input) => {
    input.addEventListener("change", () => {
      updateCartItem(input.dataset.cartQty, { qty: Number(input.value) || 1 });
      renderRoute();
    });
  });

  document.querySelectorAll("[data-cart-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      removeCartItem(button.dataset.cartRemove);
      renderRoute();
    });
  });
}
