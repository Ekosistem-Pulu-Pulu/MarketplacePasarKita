import {
  calculateCheckout,
  checkoutCart,
  fetchShippingOptions,
  previewGuestShippingRates,
  submitGuestCheckout,
} from "../api/marketplaceApi.js";
import { isApiSession } from "../utils/storage.js";
import { formatCurrency } from "../utils/formatCurrency.js";

// paymentOptions dipertahankan untuk UX flow lama (logged-in user logged).
// Untuk guest checkout, marketplace HANYA meneruskan id metode ke SmartBank
// dan menerima VA/QR/instruksi payment dari response SmartBank.
export const paymentOptions = [
  { id: "virtual-account", name: "Virtual Account", description: "BCA, Mandiri, BNI, BRI", icon: "landmark", channel: "VIRTUAL_ACCOUNT" },
  { id: "ewallet", name: "E-Wallet", description: "GoPay, OVO, DANA", icon: "wallet-cards", channel: "EWALLET" },
  { id: "cod", name: "Bayar di Tempat", description: "Tunai saat pesanan tiba", icon: "banknote", channel: "COD" },
];

// getLegacyShippingOptions retained agar flow lama (logged-in) tetap jalan
// sambil flow baru (guest) memakai getGuestShippingRates.
export async function getLegacyShippingOptions(qty = 1) {
  try {
    return await fetchShippingOptions(qty);
  } catch {
    return [
      { id: "JNE-REG", name: "JNE REG", carrier: "JNE", service: "REG", eta: "2-4 hari", price: 16000 },
      { id: "JNE-YES", name: "JNE YES", carrier: "JNE", service: "YES", eta: "1 hari", price: 24000 },
      { id: "SiCepat-HALU", name: "SiCepat HALU", carrier: "SiCepat", service: "HALU", eta: "2-5 hari", price: 15000 },
    ];
  }
}

// getGuestShippingRates meminta LogistikKita (via marketplace thin-client)
// menghitung ongkir dari kota/kecamatan/kelurahan yang diisi user.
// Output adalah list of rate_id dari LogistikKita dengan TTL internal.
export async function getGuestShippingRates(destination, items = []) {
  if (!destination || !destination.kota || !destination.kecamatan || !destination.kelurahan) {
    return { destination, rates: [] };
  }
  try {
    return await previewGuestShippingRates({
      country: destination.country || "ID",
      kota: destination.kota,
      kecamatan: destination.kecamatan,
      kelurahan: destination.kelurahan,
      alamat_lengkap: destination.alamat_lengkap || "",
      kode_pos: destination.kode_pos || "",
      items,
    });
  } catch (error) {
    if (!error.isNetworkError) throw error;
    // Fallback minim agar user tidak stuck saat backend offline.
    return {
      destination,
      rates: [],
      offline: true,
    };
  }
}

// previewCheckoutTotalsLoggedIn untuk user yang sudah login dengan address_id.
// Tidak dipakai di guest flow; dipertahankan agar halaman profile lama jalan.
export async function getCheckoutTotals({ items, addressId, shipping, payment }) {
  if (!isApiSession()) {
    const subtotal = items.reduce((total, item) => total + item.product.price * item.qty, 0);
    const discount = subtotal >= 500000 ? 25000 : 0;
    const serviceFee = Math.round(subtotal * 0.02);
    return {
      subtotal,
      discount,
      shipping,
      payment,
      serviceFee,
      bankFee: 0,
      gatewayFee: 0,
      systemTax: 0,
      total: subtotal - discount + (shipping?.price || 0) + (payment?.fee || 0) + serviceFee,
    };
  }
  try {
    return await calculateCheckout({ addressId, shipping, payment });
  } catch (error) {
    if (!error.isNetworkError) throw error;
    const subtotal = items.reduce((total, item) => total + item.product.price * item.qty, 0);
    const discount = subtotal >= 500000 ? 25000 : 0;
    const serviceFee = Math.round(subtotal * 0.02);
    return {
      subtotal,
      discount,
      shipping,
      payment,
      serviceFee,
      bankFee: 0,
      gatewayFee: 0,
      systemTax: 0,
      total: subtotal - discount + (shipping?.price || 0) + (payment?.fee || 0) + serviceFee,
    };
  }
}

// submitCheckout legacy — tetap dipakai logged-in flow lama.
export async function submitCheckout({ addressId, shipping, payment }) {
  if (!isApiSession()) {
    const error = new Error("Backend belum dapat dihubungi. Pesanan disimpan secara lokal.");
    error.isNetworkError = true;
    throw error;
  }
  return checkoutCart({ addressId, shipping, payment, voucherCode: "" });
}

// submitGuestCheckout: thin-client wrapper — mengirim order ke marketplace.
// Backend akan meneruskan payment intent ke SmartBank dan mengembalikan
// breakdown (subtotal, marketplace_fee, shipping, bank_fee, gateway_fee,
// system_tax, final_total) + payment_intent_id + virtual_account/url.
export async function submitGuestCheckoutFlow({ items, recipient, shippingRate, paymentMethod, voucherCode = "" }) {
  return submitGuestCheckout({
    items: items.map((item) => ({
      product_id: item.productId || item.product?.id || item.id,
      qty: item.qty,
      variant: item.variant || "",
    })),
    address: recipient,
    shipping_rate_id: shippingRate?.rate_id || shippingRate?.id,
    payment_method: paymentMethod?.channel || paymentMethod?.id || "VIRTUAL_ACCOUNT",
    voucher_code: voucherCode,
  });
}

// formatCurrency helper diekspos ulang untuk konsistensi dengan renderer di checkout.js.
export { formatCurrency };
