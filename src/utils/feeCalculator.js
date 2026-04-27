import { MARKETPLACE_FEE_RATE } from "../config/apiConfig.js";

export function calculateSubtotal(price, qty) {
  return Math.max(0, Number(price) || 0) * Math.max(0, Number(qty) || 0);
}

export function calculateMarketplaceFee(subtotal) {
  return Math.round(Math.max(0, Number(subtotal) || 0) * MARKETPLACE_FEE_RATE);
}

export function calculateCheckoutPreview(price, qty) {
  const subtotal = calculateSubtotal(price, qty);
  const marketplace_fee = calculateMarketplaceFee(subtotal);
  const total_bayar = subtotal + marketplace_fee;

  return {
    subtotal,
    marketplace_fee,
    total_bayar,
  };
}
