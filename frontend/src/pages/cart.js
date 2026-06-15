import { formatCurrency } from "../utils/formatCurrency.js";
import { getCartItems, removeCartItem, updateCartItem } from "../utils/storage.js";
import { confirmDialog, emptyState, escapeHtml, toast } from "../utils/ui.js";

function summary(items) {
  const selected = items.filter((item) => item.selected);
  const subtotal = selected.reduce((total, item) => total + item.product.price * item.qty, 0);
  return { selected, subtotal, discount: subtotal >= 500000 ? 25000 : 0 };
}

export function render() {
  const items = getCartItems();
  const totals = summary(items);
  if (!items.length) return `<section class="container page-space">${emptyState({ icon: "shopping-cart", title: "Keranjangmu masih kosong", message: "Mulai jelajahi produk dan temukan barang yang kamu suka.", action: `<a class="btn btn-primary" href="#/products">Mulai Belanja</a>` })}</section>`;

  return `
    <section class="container page-heading"><div><span class="eyebrow">Keranjang belanja</span><h1>Siap melanjutkan pesanan?</h1><p>Periksa produk dan jumlah sebelum checkout.</p></div><a class="btn btn-secondary" href="#/products">Lanjut Belanja</a></section>
    <section class="container cart-layout">
      <div class="cart-list">
        <div class="cart-select-all"><label><input type="checkbox" id="select-all" ${totals.selected.length === items.length ? "checked" : ""} /> Pilih semua produk</label><span>${items.length} item</span></div>
        ${items.map((item) => `
          <article class="cart-item">
            <input type="checkbox" aria-label="Pilih ${escapeHtml(item.product.name)}" data-cart-select="${item.productId}" data-variant="${escapeHtml(item.variant)}" ${item.selected ? "checked" : ""} />
            <img src="${item.product.image}" alt="${escapeHtml(item.product.name)}" />
            <div class="cart-item-info"><span class="store-badge"><span data-lucide="badge-check"></span>${item.product.store.name}</span><a href="#/product/${item.product.id}">${escapeHtml(item.product.name)}</a>${item.variant ? `<small>Variasi: ${escapeHtml(item.variant)}</small>` : ""}<strong>${formatCurrency(item.product.price)}</strong></div>
            <div class="cart-item-actions"><button class="icon-btn" aria-label="Hapus ${escapeHtml(item.product.name)}" data-remove-cart="${item.productId}" data-variant="${escapeHtml(item.variant)}"><span data-lucide="trash-2"></span></button><div class="qty-control"><button aria-label="Kurangi jumlah ${escapeHtml(item.product.name)}" data-cart-dec="${item.productId}" data-variant="${escapeHtml(item.variant)}"><span data-lucide="minus"></span></button><input value="${item.qty}" readonly aria-label="Jumlah ${escapeHtml(item.product.name)}" /><button aria-label="Tambah jumlah ${escapeHtml(item.product.name)}" data-cart-inc="${item.productId}" data-variant="${escapeHtml(item.variant)}"><span data-lucide="plus"></span></button></div></div>
          </article>
        `).join("")}
      </div>
      <aside class="summary-card">
        <h2>Ringkasan Belanja</h2>
        <div><span>Total harga (${totals.selected.length} barang)</span><strong>${formatCurrency(totals.subtotal)}</strong></div>
        <div><span>Diskon otomatis</span><strong class="positive">-${formatCurrency(totals.discount)}</strong></div>
        <hr /><div class="summary-total"><span>Total sementara</span><strong>${formatCurrency(totals.subtotal - totals.discount)}</strong></div>
        <p><span data-lucide="ticket-percent"></span> Belanja Rp500.000 dapat potongan Rp25.000.</p>
        <button class="btn btn-primary full" id="cart-checkout" ${!totals.selected.length ? "disabled" : ""}>Checkout (${totals.selected.length})</button>
      </aside>
    </section>
  `;
}

export function afterRender({ navigate, renderRoute }) {
  document.querySelectorAll("[data-cart-select]").forEach((input) => input.addEventListener("change", () => { updateCartItem(input.dataset.cartSelect, input.dataset.variant, { selected: input.checked }); renderRoute(); }));
  document.querySelector("#select-all")?.addEventListener("change", (event) => { getCartItems().forEach((item) => updateCartItem(item.productId, item.variant, { selected: event.target.checked })); renderRoute(); });
  document.querySelectorAll("[data-cart-inc]").forEach((button) => button.addEventListener("click", () => {
    const item = getCartItems().find((entry) => entry.productId === button.dataset.cartInc && entry.variant === button.dataset.variant);
    updateCartItem(item.productId, item.variant, { qty: Math.min(item.product.stock, item.qty + 1) }); renderRoute();
  }));
  document.querySelectorAll("[data-cart-dec]").forEach((button) => button.addEventListener("click", () => {
    const item = getCartItems().find((entry) => entry.productId === button.dataset.cartDec && entry.variant === button.dataset.variant);
    updateCartItem(item.productId, item.variant, { qty: Math.max(1, item.qty - 1) }); renderRoute();
  }));
  document.querySelectorAll("[data-remove-cart]").forEach((button) => button.addEventListener("click", async () => {
    if (!await confirmDialog({ title: "Hapus produk?", message: "Produk akan dihapus dari keranjang belanjamu.", confirmLabel: "Hapus Produk", danger: true })) return;
    removeCartItem(button.dataset.removeCart, button.dataset.variant); toast("Produk dihapus dari keranjang.", "info"); renderRoute();
  }));
  document.querySelector("#cart-checkout")?.addEventListener("click", () => navigate("/checkout"));
}
