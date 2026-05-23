import { DEFAULT_USER_ID } from "../config/apiConfig.js";
import { checkout, getProductById } from "../api/marketplaceApi.js";
import { showToast } from "../components/Toast.js";
import { EmptyState } from "../components/EmptyState.js";
import { calculateCartSummary, clearCartItems, getSelectedCartItems } from "../utils/cart.js";
import { formatCurrency } from "../utils/currency.js";
import { calculateCheckoutPreview } from "../utils/feeCalculator.js";
import { rememberOrder } from "../utils/orders.js";
import { escapeHtml, validateAddress, validateQuantity } from "../utils/validation.js";

function checkoutItemTemplate(item) {
  return `
    <div class="checkout-mini-item">
      <div class="checkout-item-img" aria-hidden="true"></div>
      <div>
        <div class="checkout-item-name">${escapeHtml(item.nama_produk)}</div>
        <div class="checkout-item-meta">
          ${escapeHtml(item.seller_id || "-")} - ${item.qty} x ${formatCurrency(item.harga)}
        </div>
      </div>
    </div>
  `;
}

async function resolveCheckoutItems(params, query) {
  if (params.id) {
    const qty = Number(query.get("qty") || 1);
    const response = await getProductById(params.id);
    const product = response.data;
    const qtyValidation = validateQuantity(qty, product.stok);

    if (!qtyValidation.valid || product.stok <= 0 || !product.status_aktif) {
      return {
        error: qtyValidation.message || "Produk tidak dapat dicheckout.",
        backHref: `#/products/${product.product_id}`,
      };
    }

    return {
      items: [
        {
          ...product,
          qty,
        },
      ],
    };
  }

  const items = getSelectedCartItems();
  if (!items.length) {
    return {
      error: "Belum ada item keranjang yang dipilih.",
      backHref: "#/cart",
    };
  }

  return { items };
}

export async function render({ params, query }) {
  const result = await resolveCheckoutItems(params, query);

  if (result.error) {
    return EmptyState({
      title: "Checkout belum bisa diproses",
      message: result.error,
      action: `<a class="primary-button" href="${result.backHref || "#/products"}">Kembali</a>`,
    });
  }

  const items = result.items;
  const summary =
    items.length === 1
      ? calculateCheckoutPreview(items[0].harga, items[0].qty)
      : calculateCartSummary(items);

  window.__pasarkitaCheckoutItems = items;

  return `
    <section class="page-title split-title">
      <div>
        <p class="eyebrow">Checkout</p>
        <h1>Konfirmasi pembelian</h1>
        <p>Checkout mengirim request ke Marketplace API. Payment dan saldo tetap diproses service pembayaran.</p>
      </div>
      <a class="secondary-button" href="${params.id ? `#/products/${params.id}` : "#/cart"}">Kembali</a>
    </section>

    <section class="checkout-layout">
      <form class="checkout-form-card" id="checkout-form" novalidate>
        <h2>Alamat dan pengiriman</h2>
        <label class="form-group">
          <span class="form-label">Alamat pengiriman</span>
          <textarea
            class="textarea"
            name="alamat_pengiriman"
            rows="5"
            placeholder="Nama jalan, nomor rumah, kecamatan, kota, kode pos"
          ></textarea>
          <small id="address-message" class="validation-text"></small>
        </label>

        <label class="form-group">
          <span class="form-label">Catatan untuk seller</span>
          <input class="input" name="catatan" placeholder="Opsional" />
        </label>

        <div class="smartbank-note">
          Sistem membuat ${items.length} checkout request. Untuk cart multi-produk,
          request dikirim per produk agar tetap kompatibel dengan endpoint backend saat ini.
        </div>

        <button class="primary-button block" type="submit" id="checkout-submit">
          Buat order
        </button>
      </form>

      <aside class="summary-card">
        <h2>Ringkasan</h2>
        <div class="checkout-items-list">${items.map(checkoutItemTemplate).join("")}</div>
        <div class="summary-row"><span>Subtotal</span><strong>${formatCurrency(summary.subtotal)}</strong></div>
        <div class="summary-row fee"><span>Marketplace fee 2%</span><strong>${formatCurrency(summary.marketplace_fee)}</strong></div>
        <div class="summary-total"><span>Total</span><strong>${formatCurrency(summary.total_bayar)}</strong></div>
      </aside>
    </section>
  `;
}

export function afterRender({ params, navigate }) {
  const form = document.querySelector("#checkout-form");
  const button = document.querySelector("#checkout-submit");
  const addressMessage = document.querySelector("#address-message");

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const alamat_pengiriman = String(data.get("alamat_pengiriman") || "").trim();
    const addressValidation = validateAddress(alamat_pengiriman);

    if (!addressValidation.valid) {
      addressMessage.textContent = addressValidation.message;
      return;
    }

    const items = window.__pasarkitaCheckoutItems || [];
    if (!items.length) return;

    button.disabled = true;
    button.textContent = "Mengirim order...";

    try {
      const createdOrders = [];

      for (const item of items) {
        const fallbackPreview = calculateCheckoutPreview(item.harga, item.qty);
        const response = await checkout({
          user_id: DEFAULT_USER_ID,
          product_id: item.product_id,
          qty: Number(item.qty),
          alamat_pengiriman,
        });

        const storedOrder = {
          ...response.data,
          nama_produk: response.data.nama_produk || item.nama_produk,
          product_id: response.data.product_id || item.product_id,
          qty: response.data.qty || item.qty,
          subtotal: response.data.subtotal || fallbackPreview.subtotal,
          marketplace_fee: response.data.marketplace_fee || fallbackPreview.marketplace_fee,
          total_bayar: response.data.total_bayar || fallbackPreview.total_bayar,
          alamat_pengiriman,
        };

        rememberOrder(storedOrder, { source: params.id ? "direct" : "cart" });
        createdOrders.push(storedOrder);
      }

      if (!params.id) {
        clearCartItems(items.map((item) => item.product_id));
      }

      showToast("Order berhasil dibuat.");
      navigate(
        createdOrders.length === 1
          ? `/orders/${createdOrders[0].order_id}`
          : `/orders?group=${encodeURIComponent(createdOrders[0].order_id)}`
      );
    } catch (error) {
      button.disabled = false;
      button.textContent = "Buat order";
      showToast(error.message || "Checkout gagal.", "error");
    }
  });
}
