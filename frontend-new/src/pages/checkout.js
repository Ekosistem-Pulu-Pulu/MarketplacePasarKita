import { CheckoutSummary } from "../components/CheckoutSummary.js";
import { getCheckoutTotals, getShippingOptions, paymentOptions, submitCheckout } from "../services/checkoutService.js";
import { listCartItems } from "../services/cartService.js";
import { saveCheckoutAddress } from "../services/accountService.js";
import { placeOrder } from "../services/orderService.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { getUser } from "../utils/storage.js";
import { checkoutSchema, showFormErrors, validate } from "../utils/validator.js";
import { emptyState, escapeHtml, toast } from "../utils/ui.js";

let checkoutState = { items: [], shippingOptions: [], totals: null };

export async function render() {
  const items = (await listCartItems()).filter((item) => item.selected);
  const user = getUser();
  if (!items.length) return `<section class="container page-space">${emptyState({ icon: "package-open", title: "Belum ada produk untuk checkout", message: "Pilih produk di keranjang terlebih dahulu.", action: `<a class="btn btn-primary" href="#/cart">Kembali ke Keranjang</a>` })}</section>`;
  const shippingOptions = await getShippingOptions(items.reduce((total, item) => total + item.qty, 0));
  const shipping = shippingOptions[0];
  const payment = paymentOptions[0];
  const address = user.addresses?.[0] || {};
  const totals = await getCheckoutTotals({ items, addressId: address.id, shipping, payment });
  checkoutState = { items, shippingOptions, totals };
  const phone = String(address.phone || user.phone || "").replace(/\D/g, "");

  return `
    <section class="container checkout-steps"><span class="done"><b>1</b>Keranjang</span><i></i><span class="active"><b>2</b>Checkout</span><i></i><span><b>3</b>Pembayaran</span></section>
    <section class="container page-heading compact"><div><span class="eyebrow">Checkout aman</span><h1>Lengkapi pesananmu</h1><p>Pastikan alamat dan pilihan pengiriman sudah sesuai.</p></div></section>
    <form class="container checkout-layout" id="checkout-form" novalidate>
      <main class="checkout-main">
        <section class="checkout-card">
          <div class="checkout-card-heading"><span data-lucide="map-pin"></span><div><h2>Alamat Pengiriman</h2><p>Alamat ini akan digunakan untuk pengiriman pesananmu.</p></div><span class="badge badge-success badge-outline">Alamat aktif</span></div>
          <div class="checkout-address-form">
            <label><span>Nama penerima</span><input class="input input-bordered" name="recipient" value="${escapeHtml(address.recipient || user.name)}" /><small class="form-error" data-error-for="recipient"></small></label>
            <label><span>Nomor telepon</span><input class="input input-bordered" name="phone" value="${escapeHtml(phone)}" /><small class="form-error" data-error-for="phone"></small></label>
            <label class="wide"><span>Alamat lengkap</span><textarea class="textarea textarea-bordered" name="address" rows="3">${escapeHtml(address.address || "Jl. Merdeka No. 18, Kota Bandung, Jawa Barat 40162")}</textarea><small class="form-error" data-error-for="address"></small></label>
          </div>
        </section>
        <section class="checkout-card">
          <div class="checkout-card-heading"><span data-lucide="shopping-bag"></span><div><h2>Produk Dipesan</h2><p>${items.length} produk dari ${new Set(items.map((item) => item.product.store.id)).size} toko.</p></div></div>
          <div class="checkout-products">${items.map((item) => `<article><img src="${item.product.image}" alt="${escapeHtml(item.product.name)}" /><div><small>${item.product.store.name}</small><strong>${escapeHtml(item.product.name)}</strong><span>${item.variant || "Variasi standar"} &middot; ${item.qty} barang</span></div><b>${formatCurrency(item.product.price * item.qty)}</b></article>`).join("")}</div>
        </section>
        <section class="checkout-card">
          <div class="checkout-card-heading"><span data-lucide="truck"></span><div><h2>Pilih Pengiriman</h2><p>Ongkir menyesuaikan layanan pengiriman yang dipilih.</p></div></div>
          <div class="choice-list">${shippingOptions.map((option, index) => `<label class="choice-card ${index === 0 ? "selected" : ""}"><input type="radio" name="shipping" value="${option.id}" ${index === 0 ? "checked" : ""} /><span data-lucide="truck"></span><div><strong>${option.name}</strong><small>${option.carrier} &middot; Tiba ${option.eta}</small></div><b>${formatCurrency(option.price)}</b></label>`).join("")}</div>
        </section>
        <section class="checkout-card">
          <div class="checkout-card-heading"><span data-lucide="credit-card"></span><div><h2>Metode Pembayaran</h2><p>Pilih cara pembayaran yang paling nyaman.</p></div></div>
          <div class="choice-list">${paymentOptions.map((option, index) => `<label class="choice-card ${index === 0 ? "selected" : ""}"><input type="radio" name="payment" value="${option.id}" ${index === 0 ? "checked" : ""} /><span data-lucide="${option.icon}"></span><div><strong>${option.name}</strong><small>${option.description}</small></div><b>${option.fee ? `+${formatCurrency(option.fee)}` : "Sesuai gateway"}</b></label>`).join("")}</div>
        </section>
      </main>
      <div id="checkout-summary">${CheckoutSummary(totals)}</div>
    </form>
  `;
}

export function afterRender({ navigate, refreshIcons }) {
  const form = document.querySelector("#checkout-form");

  async function refreshTotals() {
    const data = new FormData(form);
    const shipping = checkoutState.shippingOptions.find((item) => item.id === data.get("shipping")) || checkoutState.shippingOptions[0];
    const payment = paymentOptions.find((item) => item.id === data.get("payment")) || paymentOptions[0];
    checkoutState.totals = await getCheckoutTotals({
      items: checkoutState.items,
      addressId: getUser()?.addresses?.[0]?.id,
      shipping,
      payment,
    });
    document.querySelector("#checkout-summary").innerHTML = CheckoutSummary(checkoutState.totals);
    refreshIcons();
  }

  form?.querySelectorAll("input[type=radio]").forEach((input) => input.addEventListener("change", async () => {
    input.closest(".choice-list").querySelectorAll(".choice-card").forEach((card) => card.classList.remove("selected"));
    input.closest(".choice-card").classList.add("selected");
    await refreshTotals();
  }));

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    const result = validate(checkoutSchema, payload);
    showFormErrors(form, result.errors);
    if (!result.success) {
      toast("Form checkout belum valid.", "error");
      return;
    }
    try {
      const address = await saveCheckoutAddress(result.data);
      const shipping = checkoutState.shippingOptions.find((item) => item.id === result.data.shipping);
      const payment = paymentOptions.find((item) => item.id === result.data.payment);
      const totals = await getCheckoutTotals({ items: checkoutState.items, addressId: address.id, shipping, payment });
      let order;
      try {
        order = await placeOrder(await submitCheckout({ addressId: address.id, shipping, payment }));
      } catch (error) {
        if (!error.isNetworkError) throw error;
        order = await placeOrder({ items: checkoutState.items, address, shipping, payment, totals });
      }
      toast("Checkout berhasil. Selesaikan pembayaran.");
      navigate(`/payment/${order.id}`);
    } catch (error) {
      toast(error.message, "error");
    }
  });
}
