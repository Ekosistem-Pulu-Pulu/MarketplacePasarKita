import { formatCurrency } from "../utils/formatCurrency.js";
import { createOrder, getCartItems, getUser } from "../utils/storage.js";
import { emptyState, escapeHtml, toast } from "../utils/ui.js";

const shippingOptions = [
  { id: "regular", name: "Reguler Hemat", carrier: "KitaExpress", eta: "3-5 hari", price: 16000 },
  { id: "express", name: "Express", carrier: "NusaLog", eta: "1-2 hari", price: 29000 },
  { id: "same-day", name: "Same Day", carrier: "Gercep", eta: "Hari ini", price: 45000 },
];

const paymentOptions = [
  { id: "virtual-account", name: "Virtual Account", description: "BCA, Mandiri, BNI, BRI", icon: "landmark", fee: 4000 },
  { id: "ewallet", name: "E-Wallet", description: "GoPay, OVO, DANA", icon: "wallet-cards", fee: 2500 },
  { id: "cod", name: "Bayar di Tempat", description: "Tunai saat pesanan tiba", icon: "banknote", fee: 7500 },
];

function calculate(items, shippingId = "regular", paymentId = "virtual-account") {
  const subtotal = items.reduce((total, item) => total + item.product.price * item.qty, 0);
  const discount = subtotal >= 500000 ? 25000 : 0;
  const shipping = shippingOptions.find((option) => option.id === shippingId) || shippingOptions[0];
  const payment = paymentOptions.find((option) => option.id === paymentId) || paymentOptions[0];
  const serviceFee = 2500;
  return { subtotal, discount, shipping, payment, serviceFee, total: subtotal - discount + shipping.price + payment.fee + serviceFee };
}

function summaryCard(totals) {
  return `
    <aside class="summary-card checkout-summary">
      <h2>Ringkasan Pembayaran</h2>
      <div><span>Subtotal produk</span><strong>${formatCurrency(totals.subtotal)}</strong></div>
      <div><span>Ongkos kirim</span><strong>${formatCurrency(totals.shipping.price)}</strong></div>
      <div><span>Biaya pembayaran</span><strong>${formatCurrency(totals.payment.fee)}</strong></div>
      <div><span>Biaya layanan</span><strong>${formatCurrency(totals.serviceFee)}</strong></div>
      <div><span>Potongan belanja</span><strong class="positive">-${formatCurrency(totals.discount)}</strong></div>
      <hr /><div class="summary-total"><span>Total pembayaran</span><strong>${formatCurrency(totals.total)}</strong></div>
      <button class="btn btn-primary full" type="submit"><span data-lucide="lock-keyhole"></span>Buat Pesanan</button>
      <small>Dengan melanjutkan, kamu menyetujui syarat dan ketentuan PasarKita.</small>
    </aside>
  `;
}

export function render() {
  const items = getCartItems().filter((item) => item.selected);
  const user = getUser();
  if (!items.length) return `<section class="container page-space">${emptyState({ icon: "package-open", title: "Belum ada produk untuk checkout", message: "Pilih produk di keranjang terlebih dahulu.", action: `<a class="btn btn-primary" href="#/cart">Kembali ke Keranjang</a>` })}</section>`;
  const totals = calculate(items);
  const address = user.addresses?.[0];

  return `
    <section class="container checkout-steps"><span class="done"><b>1</b>Keranjang</span><i></i><span class="active"><b>2</b>Checkout</span><i></i><span><b>3</b>Pembayaran</span></section>
    <section class="container page-heading compact"><div><span class="eyebrow">Checkout aman</span><h1>Lengkapi pesananmu</h1><p>Pastikan alamat dan pilihan pengiriman sudah sesuai.</p></div></section>
    <form class="container checkout-layout" id="checkout-form">
      <main class="checkout-main">
        <section class="checkout-card">
          <div class="checkout-card-heading"><span data-lucide="map-pin"></span><div><h2>Alamat Pengiriman</h2><p>Pesanan akan dikirim ke alamat ini.</p></div><button class="btn btn-secondary" type="button">Ubah</button></div>
          <div class="address-card selected"><span class="address-label">${escapeHtml(address?.label || "Rumah")}</span><strong>${escapeHtml(address?.recipient || user.name)} · ${escapeHtml(address?.phone || user.phone)}</strong><p>${escapeHtml(address?.address || "Jl. Merdeka No. 18, Kota Bandung, Jawa Barat 40162")}</p><span data-lucide="circle-check"></span></div>
        </section>
        <section class="checkout-card">
          <div class="checkout-card-heading"><span data-lucide="shopping-bag"></span><div><h2>Produk Dipesan</h2><p>${items.length} produk dari ${new Set(items.map((item) => item.product.store.id)).size} toko.</p></div></div>
          <div class="checkout-products">${items.map((item) => `<article><img src="${item.product.image}" alt="${escapeHtml(item.product.name)}" /><div><small>${item.product.store.name}</small><strong>${escapeHtml(item.product.name)}</strong><span>${item.variant || "Variasi standar"} · ${item.qty} barang</span></div><b>${formatCurrency(item.product.price * item.qty)}</b></article>`).join("")}</div>
        </section>
        <section class="checkout-card">
          <div class="checkout-card-heading"><span data-lucide="truck"></span><div><h2>Pilih Pengiriman</h2><p>Estimasi dihitung dari lokasi toko ke alamatmu.</p></div></div>
          <div class="choice-list">${shippingOptions.map((option, index) => `<label class="choice-card ${index === 0 ? "selected" : ""}"><input type="radio" name="shipping" value="${option.id}" ${index === 0 ? "checked" : ""} /><span data-lucide="truck"></span><div><strong>${option.name}</strong><small>${option.carrier} · Tiba ${option.eta}</small></div><b>${formatCurrency(option.price)}</b></label>`).join("")}</div>
        </section>
        <section class="checkout-card">
          <div class="checkout-card-heading"><span data-lucide="credit-card"></span><div><h2>Metode Pembayaran</h2><p>Pilih cara pembayaran yang paling nyaman.</p></div></div>
          <div class="choice-list">${paymentOptions.map((option, index) => `<label class="choice-card ${index === 0 ? "selected" : ""}"><input type="radio" name="payment" value="${option.id}" ${index === 0 ? "checked" : ""} /><span data-lucide="${option.icon}"></span><div><strong>${option.name}</strong><small>${option.description}</small></div><b>${option.fee ? `+${formatCurrency(option.fee)}` : "Gratis"}</b></label>`).join("")}</div>
        </section>
      </main>
      <div id="checkout-summary">${summaryCard(totals)}</div>
    </form>
  `;
}

export function afterRender({ navigate, refreshIcons }) {
  const items = getCartItems().filter((item) => item.selected);
  const form = document.querySelector("#checkout-form");
  form?.querySelectorAll("input[type=radio]").forEach((input) => input.addEventListener("change", () => {
    input.closest(".choice-list").querySelectorAll(".choice-card").forEach((card) => card.classList.remove("selected"));
    input.closest(".choice-card").classList.add("selected");
    const data = new FormData(form);
    document.querySelector("#checkout-summary").innerHTML = summaryCard(calculate(items, data.get("shipping"), data.get("payment")));
    refreshIcons();
  }));
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const totals = calculate(items, data.get("shipping"), data.get("payment"));
    const order = createOrder({
      address: getUser().addresses?.[0],
      shipping: totals.shipping,
      payment: totals.payment,
      totals,
    });
    toast("Pesanan berhasil dibuat. Selesaikan pembayaran.");
    navigate(`/payment/${order.id}`);
  });
}
