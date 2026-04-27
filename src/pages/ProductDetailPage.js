import { getProductById } from "../api/marketplaceApi.js";
import { formatCurrency } from "../utils/currency.js";
import { calculateCheckoutPreview } from "../utils/feeCalculator.js";
import { escapeHtml, validateQuantity } from "../utils/validation.js";

export async function render({ params }) {
  const response = await getProductById(params.id);
  const product = response.data;
  const preview = calculateCheckoutPreview(product.harga, 1);
  const disabled = product.stok <= 0 || !product.status_aktif;

  return `
    <section class="detail-layout">
      <div class="detail-media card-panel" aria-hidden="true">
        <span>${escapeHtml(product.kategori.slice(0, 2).toUpperCase())}</span>
      </div>

      <article class="detail-panel card-panel">
        <p class="eyebrow">Detail produk</p>
        <h1>${escapeHtml(product.nama_produk)}</h1>
        <p>${escapeHtml(product.deskripsi)}</p>

        <dl class="detail-list">
          <div>
            <dt>Harga</dt>
            <dd>${formatCurrency(product.harga)}</dd>
          </div>
          <div>
            <dt>Stok</dt>
            <dd>${product.stok} item</dd>
          </div>
          <div>
            <dt>Kategori</dt>
            <dd>${escapeHtml(product.kategori)}</dd>
          </div>
          <div>
            <dt>Seller</dt>
            <dd>${escapeHtml(product.seller_id)}</dd>
          </div>
        </dl>

        <div class="quantity-panel">
          <label>
            <span>Quantity</span>
            <input
              id="qty-input"
              type="number"
              min="1"
              step="1"
              value="1"
              data-price="${product.harga}"
              data-stock="${product.stok}"
              ${disabled ? "disabled" : ""}
            />
          </label>
          <small id="qty-message">${disabled ? "Produk tidak bisa dicheckout." : ""}</small>
        </div>

        <div class="summary-lines detail-summary">
          <div>
            <span>Preview subtotal</span>
            <strong id="subtotal-preview">${formatCurrency(preview.subtotal)}</strong>
          </div>
        </div>

        <div class="form-actions">
          <button
            class="primary-button"
            type="button"
            id="detail-checkout-button"
            ${disabled ? "disabled" : ""}
          >
            Lanjut checkout
          </button>
          <a class="secondary-button" href="#/products">Kembali ke produk</a>
        </div>
      </article>
    </section>
  `;
}

export function afterRender({ params, navigate }) {
  const input = document.querySelector("#qty-input");
  const button = document.querySelector("#detail-checkout-button");
  const message = document.querySelector("#qty-message");
  const subtotalPreview = document.querySelector("#subtotal-preview");

  function syncQuantity() {
    const price = Number(input?.dataset.price || 0);
    const stock = Number(input?.dataset.stock || 0);
    const qty = Number(input?.value || 0);
    const validation = validateQuantity(qty, stock);
    const preview = calculateCheckoutPreview(price, validation.valid ? qty : 0);

    subtotalPreview.textContent = formatCurrency(preview.subtotal);
    message.textContent = validation.message;
    button.disabled = !validation.valid;
  }

  input?.addEventListener("input", syncQuantity);
  button?.addEventListener("click", () => {
    const qty = Number(input.value || 0);
    const validation = validateQuantity(qty, Number(input.dataset.stock || 0));

    if (!validation.valid) {
      syncQuantity();
      return;
    }

    navigate(`/checkout/${params.id}?qty=${qty}`);
  });
}
