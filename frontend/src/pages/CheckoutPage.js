import { CheckoutSummary } from "../components/CheckoutSummary.js";
import { EmptyState } from "../components/EmptyState.js";
import { showToast } from "../components/Toast.js";
import { getCartState } from "../services/cartService.js";
import { createAddress, getAddresses } from "../services/accountService.js";
import {
  createOrder,
  getAvailableShipping,
  getAvailableVouchers,
  getCheckoutEstimate,
} from "../services/checkoutService.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { escapeHtml } from "../utils/validation.js";

function checkoutItem(item) {
  return `
    <article class="checkout-item">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" />
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <span>${item.qty} x ${formatCurrency(item.price)}</span>
        <small>${escapeHtml(item.store.name)} - ${escapeHtml(item.store.location)}</small>
      </div>
    </article>
  `;
}

function addressOption(address) {
  return `
    <option value="${escapeHtml(address.address_id)}">
      ${escapeHtml(address.label)} - ${escapeHtml(address.recipient)}, ${escapeHtml(address.city)}
    </option>
  `;
}

function shippingOption(option) {
  return `
    <option
      value="${escapeHtml(`${option.courier}|${option.service}`)}"
      data-courier="${escapeHtml(option.courier)}"
      data-service="${escapeHtml(option.service)}"
    >
      ${escapeHtml(option.courier)} ${escapeHtml(option.service)} - ${formatCurrency(option.cost)}
    </option>
  `;
}

function voucherOption(voucher) {
  return `<option value="${escapeHtml(voucher.code)}">${escapeHtml(voucher.code)}</option>`;
}

function buildPayload(form) {
  const data = new FormData(form);
  const [shippingCourier = "JNE", shippingService = "REG"] = String(data.get("shipping") || "").split("|");
  return {
    address_id: String(data.get("address_id") || ""),
    shipping_courier: shippingCourier,
    shipping_service: shippingService,
    voucher_code: String(data.get("voucher_code") || ""),
    payment_method: String(data.get("payment_method") || "smartbank_gateway"),
  };
}

export async function render() {
  const [{ items }, addresses, vouchers] = await Promise.all([
    getCartState(),
    getAddresses(),
    getAvailableVouchers().catch(() => []),
  ]);
  const selectedItems = items.filter((item) => item.selected && item.stock > 0);

  if (!selectedItems.length) {
    return EmptyState({
      icon: "package-check",
      title: "Belum ada produk untuk checkout",
      message: "Pilih produk dari keranjang terlebih dahulu sebelum membuat pesanan.",
      action: `<a class="btn btn-primary" href="#/cart">Buka keranjang</a>`,
    });
  }

  const qty = selectedItems.reduce((total, item) => total + item.qty, 0);
  const shippingOptions = await getAvailableShipping(qty).catch(() => []);
  const firstShipping = shippingOptions[0] || { courier: "JNE", service: "REG" };
  const initialPayload = {
    address_id: addresses[0]?.address_id || "",
    shipping_courier: firstShipping.courier,
    shipping_service: firstShipping.service,
    voucher_code: "",
    payment_method: "smartbank_gateway",
  };
  const estimate = await getCheckoutEstimate(initialPayload);

  return `
    <section class="page-heading">
      <div>
        <span class="eyebrow">Checkout</span>
        <h1>Lengkapi pesanan</h1>
        <p>Marketplace memvalidasi ulang harga, stok, voucher, ongkir, dan total sebelum order dibuat.</p>
      </div>
      <a class="btn btn-secondary" href="#/cart">Kembali ke keranjang</a>
    </section>

    <form class="checkout-layout" id="checkout-form">
      <div class="checkout-main">
        <section class="checkout-card">
          <div class="checkout-card-heading">
            <span data-lucide="box"></span>
            <h2>Barang dipesan</h2>
          </div>
          <div class="checkout-item-list">${selectedItems.map(checkoutItem).join("")}</div>
        </section>

        <section class="checkout-card">
          <div class="checkout-card-heading">
            <span data-lucide="map-pin"></span>
            <h2>Alamat pengiriman</h2>
          </div>
          ${
            addresses.length
              ? `
                <label>
                  <span>Pilih alamat</span>
                  <select name="address_id" id="address-select">
                    ${addresses.map(addressOption).join("")}
                  </select>
                </label>
              `
              : `
                <div class="split-fields">
                  <label><span>Label alamat</span><input name="label" value="Rumah" required /></label>
                  <label><span>Nama penerima</span><input name="recipient" autocomplete="name" required /></label>
                  <label><span>Nomor telepon</span><input name="phone" autocomplete="tel" required /></label>
                  <label><span>Kota</span><input name="city" required /></label>
                  <label><span>Provinsi</span><input name="province" required /></label>
                  <label><span>Kode pos</span><input name="postal_code" /></label>
                  <label class="full-span"><span>Alamat lengkap</span><textarea name="address_line" rows="4" required></textarea></label>
                </div>
              `
          }
          <small class="form-message" id="checkout-message"></small>
        </section>

        <section class="checkout-card split-fields">
          <div class="checkout-card-heading full-span">
            <span data-lucide="truck"></span>
            <h2>Pengiriman LogistiKita</h2>
          </div>
          <label>
            <span>Layanan</span>
            <select name="shipping" id="shipping-select">
              ${shippingOptions.map(shippingOption).join("")}
            </select>
          </label>
          <label>
            <span>Voucher</span>
            <select name="voucher_code" id="voucher-select">
              <option value="">Tanpa voucher</option>
              ${vouchers.map(voucherOption).join("")}
            </select>
          </label>
        </section>

        <section class="checkout-card">
          <div class="checkout-card-heading">
            <span data-lucide="banknote"></span>
            <h2>Pembayaran SmartBank</h2>
          </div>
          <label>
            <span>Metode pembayaran</span>
            <select name="payment_method" id="payment-select">
              <option value="smartbank_gateway">SmartBank Gateway</option>
              <option value="bank_transfer">Transfer bank</option>
              <option value="virtual_account">Virtual account</option>
            </select>
          </label>
        </section>
      </div>

      <div class="checkout-side" id="checkout-summary">
        ${CheckoutSummary({
          summary: estimate,
          buttonLabel: "Buat pesanan",
        })}
      </div>
    </form>
  `;
}

export function afterRender({ navigate }) {
  const form = document.querySelector("#checkout-form");
  const summaryRoot = document.querySelector("#checkout-summary");
  const message = document.querySelector("#checkout-message");

  async function refreshSummary() {
    if (!form || !summaryRoot) return;
    try {
      const estimate = await getCheckoutEstimate(buildPayload(form));
      summaryRoot.innerHTML = CheckoutSummary({
        summary: estimate,
        buttonLabel: "Buat pesanan",
      });
    } catch (error) {
      showToast(error.message || "Ringkasan belum bisa diperbarui.", "error");
    }
  }

  form?.querySelectorAll("select").forEach((select) => {
    select.addEventListener("change", refreshSummary);
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "";

    try {
      let payload = buildPayload(form);
      if (!payload.address_id) {
        const data = new FormData(form);
        const address = await createAddress({
          label: String(data.get("label") || "Alamat utama"),
          recipient: String(data.get("recipient") || ""),
          phone: String(data.get("phone") || ""),
          address_line: String(data.get("address_line") || ""),
          city: String(data.get("city") || ""),
          province: String(data.get("province") || ""),
          postal_code: String(data.get("postal_code") || ""),
          is_default: true,
        });
        payload = { ...payload, address_id: address.address_id };
      }

      const order = await createOrder(payload);
      showToast("Pesanan dibuat dan diteruskan ke proses pembayaran.");
      navigate(`/orders/${encodeURIComponent(order.order_id)}`);
    } catch (error) {
      message.textContent = error.message || "Pesanan belum bisa dibuat. Coba lagi sebentar.";
    }
  });
}
