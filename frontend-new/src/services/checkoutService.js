import { calculateCheckout, checkoutCart, fetchShippingOptions } from "../api/marketplaceApi.js";
import { isApiSession } from "../utils/storage.js";

export const paymentOptions = [
  { id: "virtual-account", name: "Virtual Account", description: "BCA, Mandiri, BNI, BRI", icon: "landmark", fee: 0 },
  { id: "ewallet", name: "E-Wallet", description: "GoPay, OVO, DANA", icon: "wallet-cards", fee: 0 },
  { id: "cod", name: "Bayar di Tempat", description: "Tunai saat pesanan tiba", icon: "banknote", fee: 0 },
];

export async function getShippingOptions(qty = 1) {
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

export async function getCheckoutTotals({ items, addressId, shipping, payment }) {
  if (!isApiSession()) {
    const subtotal = items.reduce((total, item) => total + item.product.price * item.qty, 0);
    const discount = subtotal >= 500000 ? 25000 : 0;
    const serviceFee = Math.round(subtotal * 0.02);
    return { subtotal, discount, shipping, payment, serviceFee, total: subtotal - discount + shipping.price + payment.fee + serviceFee };
  }
  try {
    return await calculateCheckout({ addressId, shipping, payment });
  } catch (error) {
    if (!error.isNetworkError) throw error;
    const subtotal = items.reduce((total, item) => total + item.product.price * item.qty, 0);
    const discount = subtotal >= 500000 ? 25000 : 0;
    const serviceFee = Math.round(subtotal * 0.02);
    return { subtotal, discount, shipping, payment, serviceFee, total: subtotal - discount + shipping.price + payment.fee + serviceFee };
  }
}

export async function submitCheckout({ addressId, shipping, payment }) {
  if (!isApiSession()) {
    const error = new Error("Backend belum dapat dihubungi. Pesanan disimpan sebagai demo lokal.");
    error.isNetworkError = true;
    throw error;
  }
  return checkoutCart({ addressId, shipping, payment, voucherCode: "" });
}
