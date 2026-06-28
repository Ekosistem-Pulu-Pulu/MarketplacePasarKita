import { fetchGuestOrder, fetchOrder, fetchOrders, processPayment } from "../api/marketplaceApi.js";
import {
  createOrder as createLocalOrder,
  getOrder as getLocalOrder,
  getOrders as getLocalOrders,
  updateOrderStatus as updateLocalOrderStatus,
} from "../utils/storage.js";
import { isApiSession } from "../utils/storage.js";

export async function listOrders() {
  if (!isApiSession()) return getLocalOrders();
  try {
    return await fetchOrders() || [];
  } catch (error) {
    if (!error.isNetworkError) throw error;
    return getLocalOrders();
  }
}

export async function findOrder(id) {
  if (!isApiSession()) return getLocalOrder(id);
  try {
    return await fetchOrder(id);
  } catch (error) {
    if (!error.isNetworkError && error.status !== 404) throw error;
    return getLocalOrder(id);
  }
}

// findGuestOrder: lookup order guest tanpa auth menggunakan order_id + email.
// Email adalah identifier tamu; pasangan ini menjadi "token" informal mereka.
export async function findGuestOrder(orderID, email) {
  if (!orderID || !email) return null;
  try {
    const data = await fetchGuestOrder(orderID, email);
    return data?.order || data;
  } catch (error) {
    if (!error.isNetworkError) throw error;
    // Offline fallback: cari di localStorage (urutan disimpan saat Checkout)
    return getLocalOrder(orderID);
  }
}

export async function placeOrder(payload) {
  if (payload?.id && payload?.totals) return payload;
  return createLocalOrder(payload);
}

export async function setOrderStatus(id, status) {
  if (status === "Pembayaran Diproses" && isApiSession()) {
    try {
      return await processPayment(id);
    } catch (error) {
      if (!error.isNetworkError) throw error;
    }
  }
  return updateLocalOrderStatus(id, status);
}
