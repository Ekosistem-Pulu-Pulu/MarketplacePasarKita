import {
  checkoutCart,
  getShippingOptions,
  listVouchers,
} from "../api/marketplaceApi.js";
import { apiRequest } from "../api/client.js";

export async function getCheckoutEstimate(payload = {}) {
  const response = await apiRequest("/marketplace/checkout/calculate", {
    method: "POST",
    body: payload,
  });
  const data = response.data || {};
  return {
    ...data,
    subtotal: Number(data.subtotal || 0),
    marketplace_fee: Number(data.marketplace_fee || 0),
    gateway_fee: Number(data.gateway_fee || 0),
    shipping_cost: Number(data.shipping_cost || 0),
    discount_amount: Number(data.discount_amount || 0),
    total_bayar: Number(data.total_bayar || 0),
    count: Number(data.count || 0),
  };
}

export async function getAvailableShipping(qty = 1) {
  const response = await getShippingOptions({ qty });
  return response.data || [];
}

export async function getAvailableVouchers() {
  const response = await listVouchers();
  return response.data || [];
}

export async function createOrder(payload) {
  const response = await checkoutCart(payload);
  return response.data;
}
