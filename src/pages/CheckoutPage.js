import { DEFAULT_USER_ID } from "../config/apiConfig.js";
import { checkout, getProductById } from "../api/marketplaceApi.js";
import { showToast } from "../components/Toast.js";
import { formatCurrency } from "../utils/currency.js";
import { calculateCheckoutPreview } from "../utils/feeCalculator.js";
import { escapeHtml, validateAddress, validateQuantity } from "../utils/validation.js";

export async function render({ params, query }) {
  const qty = Number(query.get("qty") || 1);
  const response = await getProductById(params.id);
  const product = response.data;
  const qtyValidation = validateQuantity(qty, product.stok);

  if (!qtyValidation.valid || product.stok <= 0) {
    return `
      <section class="error-state card-panel">
        <p class="eyebrow">Checkout tidak valid</p>
        <h1>Produk tidak dapat dicheckout</h1>
        <p>${qtyValidation.message || "Stok produk sedang habis."}</p>
        <a class="primary-button" href="#/products/${product.product_id}">Kembali ke detail</a>
      </section>
    `;
  }

  const preview = calculateCheckoutPreview(product.harga, qty);

  return `
    <section class="checkout-layout">
      <article class="card-panel checkout-summary">
        <p class="eyebrow">Checkout request</p>
        <h1>Ringkasan pembelian</h1>
        <div class="checkout-product">
          <span class="product-initial">${escapeHtml(product.kategori.slice(0, 2).toUpperCase())}</span>
          <div>
            <strong>${escapeHtml(product.nama_produk)}</strong>
            <p>${escapeHtml(product.deskripsi)}</p>
          </div>
        </div>

        <div class="summary-lines">
          <div><span>Harga satuan</span><strong>${formatCurrency(product.harga)}</strong></div>
          <div><span>Quantity</span><strong>${qty}</strong></div>
          <div><span>Subtotal</span><strong>${formatCurrency(preview.subtotal)}</strong></div>
          <div><span>Marketplace fee 2%</span><strong>${formatCurrency(preview.marketplace_fee)}</strong></div>
          <div class="summary-total"><span>Total bayar</span><strong>${formatCurrency(preview.total_bayar)}</strong></div>
        </div>

        <div class="integration-note">
          Marketplace hanya mengirim request ke <code>POST /marketplace/checkout</code>.
          Perubahan saldo tidak dilakukan di frontend Marketplace.
        </div>
      </article>

      <form class="card-panel checkout-form" id="checkout-form" novalidate>
        <p class="eyebrow">Alamat pengiriman</p>
        <h2>Kirim checkout</h2>
        <label>
          <span>Alamat pengiriman</span>
          <textarea
            name="alamat_pengiriman"
            rows="5"
            placeholder="Jl. Contoh No. 10"
          ></textarea>
          <small id="address-message"></small>
        </label>

        <div class="payload-preview">
          <strong>Payload</strong>
          <code>{
  "user_id": "${DEFAULT_USER_ID}",
  "product_id": "${product.product_id}",
  "qty": ${qty},
  "alamat_pengiriman": "..."
}</code>
        </div>

        <button class="primary-button block" type="submit" id="checkout-submit">
          Submit checkout
        </button>
      </form>
    </section>
  `;
}

export function afterRender({ params, query, navigate }) {
  const form = document.querySelector("#checkout-form");
  const button = document.querySelector("#checkout-submit");
  const addressMessage = document.querySelector("#address-message");
  const qty = Number(query.get("qty") || 1);

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const alamat_pengiriman = String(data.get("alamat_pengiriman") || "").trim();
    const addressValidation = validateAddress(alamat_pengiriman);

    if (!addressValidation.valid) {
      addressMessage.textContent = addressValidation.message;
      return;
    }

    button.disabled = true;
    button.textContent = "Mengirim request...";

    try {
      const response = await checkout({
        user_id: DEFAULT_USER_ID,
        product_id: params.id,
        qty,
        alamat_pengiriman,
      });

      showToast("Checkout request berhasil dibuat.");
      navigate(`/orders/${response.data.order_id}`);
    } catch (error) {
      button.disabled = false;
      button.textContent = "Submit checkout";
      showToast(error.message || "Checkout gagal.", "error");
    }
  });
}
