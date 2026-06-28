import { CheckoutSummary } from "../components/CheckoutSummary.js";
import {
  getGuestShippingRates,
  getLegacyShippingOptions,
  paymentOptions,
  submitCheckout,
  submitGuestCheckoutFlow,
} from "../services/checkoutService.js";
import { listCartItems } from "../services/cartService.js";
import { saveCheckoutAddress } from "../services/accountService.js";
import { placeOrder } from "../services/orderService.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import {
  clearGuestDraft,
  getUser,
  isLoggedIn,
  readGuestDraft,
  saveGuestDraft,
} from "../utils/storage.js";
import {
  guestCheckoutSchema,
  showFormErrors,
  validate,
} from "../utils/validator.js";
import { emptyState, escapeHtml, toast } from "../utils/ui.js";

// Pemetaan kode LogistikKita ke kode tampilan store kita.
function mapCountryInput(value) {
  const raw = String(value || "").trim();
  if (!raw) return "ID";
  if (raw.length <= 3) return raw.toUpperCase();
  return raw;
}

let checkoutState = {
  mode: "legacy",
  items: [],
  shippingOptions: [],
  selectedRateId: "",
  payment: paymentOptions[0],
  guestRecipient: null,
  guestSummary: null,
};

export async function render() {
  const items = (await listCartItems()).filter((item) => item.selected);
  if (!items.length) {
    return `<section class="container page-space">${emptyState({
      icon: "package-open",
      title: "Belum ada produk untuk checkout",
      message: "Pilih produk di keranjang terlebih dahulu.",
      action: `<a class="btn btn-primary" href="#/cart">Kembali ke Keranjang</a>`,
    })}</section>`;
  }
  checkoutState.mode = isLoggedIn() ? "legacy" : "guest";
  checkoutState.items = items;

  if (checkoutState.mode === "guest") {
    return renderGuestCheckout(items);
  }
  return renderLegacyCheckout(items);
}

// === LEGACY FLOW (logged in) — address single-string seperti versi lama ===
async function renderLegacyCheckout(items) {
  const shippingOptions = await getLegacyShippingOptions(items.reduce((total, item) => total + item.qty, 0));
  const shipping = shippingOptions[0];
  const payment = paymentOptions[0];
  const user = getUser();
  const address = user.addresses?.[0] || {};
  const totals = await computeLegacyTotals(items, address.id, shipping, payment);
  checkoutState = { ...checkoutState, shippingOptions, selectedRateId: shipping.id, payment, guestSummary: null };
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
        ${checkoutProductsSection(items)}
        ${legacyShippingSection(shippingOptions)}
        ${paymentSection(paymentOptions)}
      </main>
      <div id="checkout-summary">${CheckoutSummary(totals)}</div>
    </form>
  `;
}

async function computeLegacyTotals(items, addressId, shipping, payment) {
  const { getCheckoutTotals } = await import("../services/checkoutService.js");
  return getCheckoutTotals({ items, addressId, shipping, payment });
}

// === GUEST FLOW (no login) — split address + LogistikKita + SmartBank ===
async function renderGuestCheckout(items) {
  // Harvest draft dari storage kalau ada (refresh-safe recovery)
  const draft = readGuestDraft() || {};
  const recipient = {
    nama_penerima: "",
    email: "",
    phone: "",
    country: "ID",
    kota: "",
    kecamatan: "",
    kelurahan: "",
    alamat_lengkap: "",
    kode_pos: "",
    ...draft,
  };
  checkoutState.guestRecipient = recipient;
  // Coba ambil rate jika draft sudah memiliki field lengkap
  let initialRates = { destination: recipient, rates: [] };
  if (recipient.kota && recipient.kecamatan && recipient.kelurahan) {
    try {
      initialRates = await getGuestShippingRates(recipient, itemsToLogistikItems(items));
    } catch {
      initialRates = { destination: recipient, rates: [] };
    }
  }
  checkoutState.shippingOptions = initialRates.rates || [];
  checkoutState.selectedRateId = "";

  const totals = computeGuestPreviewTotals(items);

  return `
    <section class="container checkout-steps"><span class="done"><b>1</b>Keranjang</span><i></i><span class="active"><b>2</b>Checkout</span><i></i><span><b>3</b>Pembayaran</span></section>
    <section class="container page-heading compact">
      <div>
        <span class="eyebrow">Checkout Tamu</span>
        <h1>Lengkapi data penerima</h1>
        <p>Belanja tanpa login. Bukti pesanan akan kami kirim ke email atau nomor telepon yang kamu isi.</p>
      </div>
      <div class="guest-mode-switch">
        <a class="btn btn-soft" href="#/login?redirect=%2Fcheckout">Sudah punya akun? Login</a>
      </div>
    </section>
    <form class="container checkout-layout" id="guest-checkout-form" novalidate>
      <main class="checkout-main">
        <section class="checkout-card">
          <div class="checkout-card-heading"><span data-lucide="user-round"></span><div><h2>Data Penerima</h2><p>Data ini akan kami gunakan sebagai identitas pesanan.</p></div><span class="badge badge-info badge-outline">Mode tamu</span></div>
          <div class="checkout-address-form">
            <label><span>Nama lengkap</span><input class="input input-bordered" name="nama_penerima" value="${escapeHtml(recipient.nama_penerima)}" required /><small class="form-error" data-error-for="nama_penerima"></small></label>
            <label><span>Email <small class="muted">(untuk bukti pesanan)</small></span><input class="input input-bordered" name="email" type="email" value="${escapeHtml(recipient.email)}" /><small class="form-error" data-error-for="email"></small></label>
            <label><span>Nomor HP</span><input class="input input-bordered" name="phone" value="${escapeHtml(recipient.phone)}" required /><small class="form-error" data-error-for="phone"></small></label>
            <label><span>Negara</span><input class="input input-bordered" name="country" value="${escapeHtml(recipient.country)}" maxlength="3" /><small class="form-error" data-error-for="country"></small></label>
          </div>
        </section>
        <section class="checkout-card">
          <div class="checkout-card-heading"><span data-lucide="map"></span><div><h2>Alamat Pengiriman</h2><p>Pisahkan field lokasi agar LogistikKita bisa menghitung ongkir dengan tepat.</p></div></div>
          <div class="checkout-address-form">
            <label><span>Kota</span><input class="input input-bordered" name="kota" value="${escapeHtml(recipient.kota)}" required /><small class="form-error" data-error-for="kota"></small></label>
            <label><span>Kecamatan</span><input class="input input-bordered" name="kecamatan" value="${escapeHtml(recipient.kecamatan)}" required /><small class="form-error" data-error-for="kecamatan"></small></label>
            <label><span>Kelurahan</span><input class="input input-bordered" name="kelurahan" value="${escapeHtml(recipient.kelurahan)}" required /><small class="form-error" data-error-for="kelurahan"></small></label>
            <label><span>Kode pos <small class="muted">(opsional)</small></span><input class="input input-bordered" name="kode_pos" value="${escapeHtml(recipient.kode_pos)}" /></label>
            <label class="wide"><span>Alamat lengkap <small class="muted">(jalan, nomor, patokan)</small></span><textarea class="textarea textarea-bordered" name="alamat_lengkap" rows="3" required>${escapeHtml(recipient.alamat_lengkap)}</textarea><small class="form-error" data-error-for="alamat_lengkap"></small></label>
          </div>
          ${guestRateStatusHint(initialRates)}
        </section>
        <section class="checkout-card">
          <div class="checkout-card-heading"><span data-lucide="truck"></span><div><h2>Pilih Pengiriman</h2><p>Tarif dihitung oleh LogistikKita otomatis berdasarkan alamat di atas.</p></div>${rateArchive(initialRates)}</div>
          <div class="choice-list" id="guest-shipping-options">${guestShippingOptions(initialRates.rates || [])}</div>
          <small class="form-hint" id="guest-shipping-hint">${initialRates.rates?.length ? "" : "Lengkapi field lokasi di atas untuk memuat opsi ongkir."}</small>
        </section>
        ${checkoutProductsSection(items)}
        ${paymentSection(paymentOptions)}
      </main>
      <div id="checkout-summary">${CheckoutSummary(totals)}</div>
    </form>
  `;
}

function checkoutProductsSection(items) {
  const uniqueStores = new Set(items.map((item) => item.product.store?.id)).size;
  return `
    <section class="checkout-card">
      <div class="checkout-card-heading"><span data-lucide="shopping-bag"></span><div><h2>Produk Dipesan</h2><p>${items.length} produk dari ${uniqueStores} toko.</p></div></div>
      <div class="checkout-products">${items.map((item) => `<article><img src="${item.product.image}" alt="${escapeHtml(item.product.name)}" /><div><small>${item.product.store?.name || ""}</small><strong>${escapeHtml(item.product.name)}</strong><span>${item.variant || "Variasi standar"} &middot; ${item.qty} barang</span></div><b>${formatCurrency(item.product.price * item.qty)}</b></article>`).join("")}</div>
    </section>
  `;
}

function legacyShippingSection(shippingOptions) {
  return `
    <section class="checkout-card">
      <div class="checkout-card-heading"><span data-lucide="truck"></span><div><h2>Pilih Pengiriman</h2><p>Ongkir menyesuaikan layanan pengiriman yang dipilih.</p></div></div>
      <div class="choice-list">${shippingOptions.map((option, index) => `<label class="choice-card ${index === 0 ? "selected" : ""}"><input type="radio" name="shipping" value="${option.id}" ${index === 0 ? "checked" : ""} /><span data-lucide="truck"></span><div><strong>${option.name}</strong><small>${option.carrier} &middot; Tiba ${option.eta}</small></div><b>${formatCurrency(option.price)}</b></label>`).join("")}</div>
    </section>
  `;
}

function paymentSection(options) {
  return `
    <section class="checkout-card">
      <div class="checkout-card-heading"><span data-lucide="credit-card"></span><div><h2>Metode Pembayaran</h2><p>Pilih cara pembayaran yang paling nyaman.</p></div></div>
      <div class="choice-list">${options.map((option, index) => `<label class="choice-card ${index === 0 ? "selected" : ""}" data-payment-id="${option.id}"><input type="radio" name="payment" value="${option.id}" ${index === 0 ? "checked" : ""} data-channel="${option.channel}" /><span data-lucide="${option.icon}"></span><div><strong>${option.name}</strong><small>${option.description}</small></div><b>${channelHint(option.channel)}</b></label>`).join("")}</div>
    </section>
  `;
}

function channelHint(channel) {
  if (channel === "VIRTUAL_ACCOUNT") return "VA bank";
  if (channel === "EWALLET") return "E-Wallet QR";
  if (channel === "COD") return "Tunai saat tiba";
  return "SmartBank";
}

function guestShippingOptions(rates) {
  if (!rates.length) {
    return `<div class="empty-mini"><span data-lucide="hourglass"></span><p>Opsi ongkir akan tersedia setelah field lokasi diisi lengkap.</p></div>`;
  }
  return rates.map((rate, index) => `<label class="choice-card ${index === 0 ? "selected" : ""}"><input type="radio" name="shipping_rate" value="${rate.rate_id}" data-courier="${escapeHtml(rate.courier)}" data-service="${escapeHtml(rate.service)}" data-eta="${escapeHtml(rate.eta_days)}" ${index === 0 ? "checked" : ""} /><span data-lucide="truck"></span><div><strong>${escapeHtml(rate.label || (rate.courier + " " + rate.service))}</strong><small>${escapeHtml(rate.description || "")} &middot; Tiba ${escapeHtml(rate.eta_days)}</small></div><b>${formatCurrency(rate.price)}</b></label>`).join("");
}

function guestRateStatusHint(rates) {
  if (!rates.destination?.kota) return "";
  if (!rates.rates?.length) {
    return `<div class="form-hint warning"><span data-lucide="alert-triangle"></span>LogistikKita belum mengembalikan ongkir untuk kombinasi alamat ini. Coba ubah kecamatan/kelurahan.</div>`;
  }
  return `<div class="form-hint success"><span data-lucide="check-circle"></span>${rates.rates.length} opsi ongkir tersedia. Pilih yang sesuai di bawah.</div>`;
}

function rateArchive(initialRates) {
  const count = initialRates?.rates?.length || 0;
  return `<span class="badge badge-neutral badge-outline"><span data-lucide="package"></span>${count} opsi dari LogistikKita</span>`;
}

function itemsToLogistikItems(items) {
  return items.map((item) => ({
    product_id: item.productId || item.product?.id || item.id,
    qty: item.qty,
    berat_gram: item.product?.weightGram || 500,
    harga: item.product?.price || 0,
  }));
}

function computeGuestPreviewTotals(items) {
  const subtotal = items.reduce((total, item) => total + item.product.price * item.qty, 0);
  const marketplaceFee = Math.round(subtotal * 0.02);
  return {
    subtotal,
    discount: 0,
    shipping: { label: "Pilih lokasi dulu", price: 0 },
    payment: { label: paymentOptions[0].name, fee: 0 },
    serviceFee: marketplaceFee,
    bankFee: 0,
    gatewayFee: 0,
    systemTax: 0,
    total: subtotal + marketplaceFee,
    note: "Ongkir & fee SmartBank dihitung setelah alamat diisi dan metode pembayaran dipilih.",
  };
}

export function afterRender({ navigate, refreshIcons }) {
  const mode = checkoutState.mode;
  if (mode === "guest") return bindGuestSubmit({ navigate, refreshIcons });
  return bindLegacySubmit({ navigate, refreshIcons });
}

function bindLegacySubmit({ navigate, refreshIcons }) {
  const form = document.querySelector("#checkout-form");
  if (!form) return;

  async function refreshTotals() {
    const { getCheckoutTotals } = await import("../services/checkoutService.js");
    const data = new FormData(form);
    const shipping = checkoutState.shippingOptions.find((item) => item.id === data.get("shipping")) || checkoutState.shippingOptions[0];
    const payment = paymentOptions.find((item) => item.id === data.get("payment")) || paymentOptions[0];
    const totals = await getCheckoutTotals({
      items: checkoutState.items,
      addressId: getUser()?.addresses?.[0]?.id,
      shipping,
      payment,
    });
    document.querySelector("#checkout-summary").innerHTML = CheckoutSummary(totals);
    refreshIcons();
  }

  form.querySelectorAll("input[type=radio]").forEach((input) => input.addEventListener("change", async () => {
    input.closest(".choice-list").querySelectorAll(".choice-card").forEach((card) => card.classList.remove("selected"));
    input.closest(".choice-card").classList.add("selected");
    await refreshTotals();
  }));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const { checkoutSchema } = await import("../utils/validator.js");
    const payload = Object.fromEntries(new FormData(form).entries());
    const result = validate(checkoutSchema, payload);
    showFormErrors(form, result.errors);
    if (!result.success) return toast("Form checkout belum valid.", "error");
    try {
      const address = await saveCheckoutAddress(result.data);
      const shipping = checkoutState.shippingOptions.find((item) => item.id === result.data.shipping);
      const payment = paymentOptions.find((item) => item.id === result.data.payment);
      const totals = await import("../services/checkoutService.js").then((m) => m.getCheckoutTotals({ items: checkoutState.items, addressId: address.id, shipping, payment }));
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

function bindGuestSubmit({ navigate, refreshIcons }) {
  const form = document.querySelector("#guest-checkout-form");
  if (!form) return;
  const addressMarkers = ["kota", "kecamatan", "kelurahan", "alamat_lengkap"];
  let debounceTimer = null;
  let lastFetchKey = "";
  // Simpan draft tiap user mengetik agar refresh aman
  form.addEventListener("input", (event) => {
    const data = Object.fromEntries(new FormData(form).entries());
    data.country = mapCountryInput(data.country);
    saveGuestDraft(data);
  });

  // Auto-fetch ongkir saat field lokasi berubah (debounced)
  const triggerFetch = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(fetchGuestRates, 400);
  };
  addressMarkers.forEach((name) => form.querySelector(`[name="${name}"]`)?.addEventListener("blur", triggerFetch));
  form.querySelector("[name=country]")?.addEventListener("blur", triggerFetch);

  async function fetchGuestRates() {
    const data = Object.fromEntries(new FormData(form).entries());
    const recipient = normalizeRecipient(data);
    if (!recipient.kota || !recipient.kecamatan || !recipient.kelurahan || !recipient.alamat_lengkap) {
      renderRatesEmpty();
      refreshGuestTotals();
      return;
    }
    const key = [recipient.kota, recipient.kecamatan, recipient.kelurahan, recipient.alamat_lengkap, recipient.country].join("|");
    if (key === lastFetchKey) return;
    lastFetchKey = key;
    try {
      const rateList = await getGuestShippingRates(recipient, itemsToLogistikItems(checkoutState.items));
      checkoutState.guestRecipient = recipient;
      checkoutState.shippingOptions = rateList.rates || [];
      renderRates(rateList.rates || []);
    } catch (error) {
      if (!error.isNetworkError) toast(error.message, "error");
      renderRatesEmpty();
    } finally {
      refreshGuestTotals();
    }
  }

  function renderRates(rates) {
    const container = document.querySelector("#guest-shipping-options");
    if (!container) return;
    container.innerHTML = guestShippingOptions(rates);
    const banner = document.querySelector("#guest-shipping-hint");
    if (banner) banner.innerHTML = rates.length ? "" : "Belum ada opsi dari LogistikKita — coba alamat lain.";
    refreshIcons();
    if (rates.length) {
      checkoutState.selectedRateId = rates[0].rate_id;
      container.querySelectorAll(".choice-card").forEach((card, index) => card.addEventListener("click", () => {
        container.querySelectorAll(".choice-card").forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        checkoutState.selectedRateId = card.querySelector("input").value;
      }));
    }
  }

  function renderRatesEmpty() {
    const container = document.querySelector("#guest-shipping-options");
    if (!container) return;
    container.innerHTML = guestShippingOptions([]);
    const banner = document.querySelector("#guest-shipping-hint");
    if (banner) banner.innerHTML = "Opsi ongkir akan tersedia setelah field lokasi diisi lengkap.";
  }

  function refreshGuestTotals() {
    const data = Object.fromEntries(new FormData(form).entries());
    const items = checkoutState.items;
    const subtotal = items.reduce((total, item) => total + item.product.price * item.qty, 0);
    const marketplaceFee = Math.round(subtotal * 0.02);
    const selectedRate = checkoutState.shippingOptions.find((rate) => rate.rate_id === checkoutState.selectedRateId);
    const payment = paymentOptions.find((item) => form.querySelector(`[name=payment][value="${data.payment}"]`)) || paymentOptions[0];
    const totals = {
      subtotal,
      discount: 0,
      shipping: { label: selectedRate?.label || (selectedRate ? selectedRate.courier + " " + selectedRate.service : "Pilih lokasi dulu"), price: selectedRate?.price || 0 },
      payment: { label: payment.name, fee: 0 },
      serviceFee: marketplaceFee,
      bankFee: 0,
      gatewayFee: 0,
      systemTax: 0,
      total: subtotal + marketplaceFee + (selectedRate?.price || 0),
      note: selectedRate ? null : "Bank fee, gateway fee, dan pajak akan dihitung SmartBank saat submit.",
    };
    document.querySelector("#checkout-summary").innerHTML = CheckoutSummary(totals);
    refreshIcons();
  }

  form.querySelectorAll("input[type=radio][name=payment]").forEach((input) => input.addEventListener("change", refreshGuestTotals));
  form.querySelectorAll("input[type=radio][name=shipping_rate]").forEach((input) => input.addEventListener("change", () => {
    checkoutState.selectedRateId = input.value;
    refreshGuestTotals();
  }));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const recipient = normalizeRecipient(data);
    const payload = {
      ...recipient,
      items: checkoutState.items.map((item) => ({
        product_id: item.productId || item.product?.id || item.id,
        qty: item.qty,
        variant: item.variant || "",
      })),
      shipping_rate_id: checkoutState.selectedRateId,
      payment_method: (paymentOptions.find((item) => item.id === data.payment) || paymentOptions[0]).channel,
      voucher_code: "",
    };
    const result = validate(guestCheckoutSchema, payload);
    showFormErrors(form, result.errors);
    if (!result.success) {
      toast("Form checkout belum valid.", "error");
      return;
    }
    try {
      const summary = await submitGuestCheckoutFlow({
        items: checkoutState.items,
        recipient,
        shippingRate: checkoutState.shippingOptions.find((rate) => rate.rate_id === checkoutState.selectedRateId),
        paymentMethod: paymentOptions.find((item) => item.id === data.payment) || paymentOptions[0],
      });
      // Bangun struktur order mirip legacy agar payment.js + orderStatus.js tidak perlu diubah
      const order = {
        id: summary.order_id,
        order_id: summary.order_id,
        status: "Menunggu Pembayaran",
        isGuest: true,
        recipient,
        items: checkoutState.items,
        shipping: {
          id: summary.rate_id,
          name: `${summary.courier} ${summary.service}`,
          carrier: summary.courier,
          service: summary.service,
          eta: summary.eta,
          price: summary.shipping_cost,
        },
        payment: paymentOptions.find((item) => item.id === data.payment) || paymentOptions[0],
        totals: {
          subtotal: summary.subtotal,
          discount: 0,
          shipping: summary.shipping_cost,
          payment: 0,
          serviceFee: summary.marketplace_fee,
          total: summary.total_bayar,
          bankFee: summary.bank_fee,
          gatewayFee: summary.gateway_fee,
          systemTax: summary.system_tax,
        },
        payment_intent_id: summary.payment_intent_id,
        virtual_account: summary.virtual_account,
        payment_url: summary.payment_url,
        payment_expires_at: summary.expires_at,
        createdAt: new Date().toISOString(),
        isLocal: false,
      };
      await placeOrder(order);
      // Simpan referensi guest agar bisa lihat status tanpa login
      saveGuestDraft({ ...recipient, last_order_id: summary.order_id });
      toast("Pesanan dibuat. Selesaikan pembayaran sebelum jatuh tempo.");
      navigate(`/payment/${summary.order_id}`);
    } catch (error) {
      toast(error.message || "Checkout gagal. Coba lagi.", "error");
    }
  });
}

function normalizeRecipient(raw = {}) {
  return {
    nama_penerima: String(raw.nama_penerima || "").trim(),
    email: String(raw.email || "").trim().toLowerCase(),
    phone: String(raw.phone || "").replace(/\D/g, ""),
    country: mapCountryInput(raw.country),
    kota: String(raw.kota || "").trim(),
    kecamatan: String(raw.kecamatan || "").trim(),
    kelurahan: String(raw.kelurahan || "").trim(),
    kode_pos: String(raw.kode_pos || "").trim(),
    alamat_lengkap: String(raw.alamat_lengkap || "").trim(),
  };
}
