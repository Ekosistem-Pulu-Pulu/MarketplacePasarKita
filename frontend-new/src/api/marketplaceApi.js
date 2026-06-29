import { apiRequest, unwrapData } from "./client.js";
import { getToken } from "../utils/storage.js";
import { API_BASE_URL } from "../config/apiConfig.js";

export async function browseProducts(params = {}) {
  const query = new URLSearchParams({
    keyword: params.keyword || "",
    category: params.category || "",
    location: params.location || "",
    minPrice: String(params.minPrice || ""),
    maxPrice: String(params.maxPrice || ""),
    rating: String(params.rating || ""),
    promo: params.promo ? "true" : "",
    sort: params.sort || "",
    page: String(params.page || 1),
    limit: String(params.limit || 100),
  });
  return unwrapData(await apiRequest(`/marketplace/browse_produk?${query}`));
}

export async function fetchCategories() {
  return unwrapData(await apiRequest("/marketplace/categories"));
}

export async function fetchProduct(id) {
  if (!id || id === "undefined" || id === "null") throw new Error("Produk tidak valid.");
  return unwrapData(await apiRequest(`/marketplace/products/${encodeURIComponent(id)}`));
}

export async function fetchStores() {
  return unwrapData(await apiRequest("/marketplace/stores"));
}

export async function fetchCart() {
  return unwrapData(await apiRequest("/marketplace/cart"));
}

export async function addCart(productId, qty = 1, variant = "") {
  return unwrapData(await apiRequest("/marketplace/cart", {
    method: "POST",
    body: { productId, qty, variant },
  }));
}

export async function patchCart(productId, payload) {
  if (!productId) throw new Error("Produk tidak valid.");
  return unwrapData(await apiRequest(`/marketplace/cart/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    body: { productId, ...payload },
  }));
}

export async function deleteCart(productId) {
  if (!productId) throw new Error("Produk tidak valid.");
  return unwrapData(await apiRequest(`/marketplace/cart/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  }));
}

export async function syncCart(items) {
  return unwrapData(await apiRequest("/marketplace/cart/sync", {
    method: "POST",
    body: { items },
  }));
}

export async function fetchShippingOptions(qty = 1) {
  return unwrapData(await apiRequest(`/marketplace/shipping/options?qty=${qty}`));
}

export async function calculateCheckout(payload) {
  return unwrapData(await apiRequest("/marketplace/checkout/calculate", {
    method: "POST",
    body: payload,
  }));
}

export async function checkoutCart(payload) {
  return unwrapData(await apiRequest("/marketplace/cart/checkout", {
    method: "POST",
    body: payload,
  }));
}

export async function fetchOrders() {
  return unwrapData(await apiRequest("/marketplace/orders"));
}

export async function fetchOrder(id) {
  return unwrapData(await apiRequest(`/marketplace/orders/${encodeURIComponent(id)}`));
}

export async function processPayment(id) {
  return unwrapData(await apiRequest("/marketplace/integrasi_pembayaran", {
    method: "POST",
    body: { orderId: id },
  }));
}

export async function fetchSellerProducts() {
  return unwrapData(await apiRequest("/marketplace/seller/products"));
}

export async function fetchSellerOrders() {
  return unwrapData(await apiRequest("/marketplace/seller/orders"));
}

export async function fetchSellerDashboard() {
  return unwrapData(await apiRequest("/marketplace/seller/dashboard"));
}

export async function createSellerProduct(payload) {
  return unwrapData(await apiRequest("/marketplace/seller/products", {
    method: "POST",
    body: payload,
  }));
}

// Upload gambar produk sebagai multipart — tidak memakai apiRequest karena
// json-stringify akan merusak FormData. Mengembalikan URL publik siap pakai.
export async function uploadSellerImage(file, folder = "products") {
  if (!file) throw new Error("File gambar wajib diisi.");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const base = API_BASE_URL.replace(/\/$/, "");
  const token = getToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${base}/marketplace/seller/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.message || `Upload gagal (status ${response.status}).`);
    }
    return data?.data ?? data;
  } finally {
    clearTimeout(timeout);
  }
}

// === Guest Checkout (thin-client ke LogistikKita + SmartBank) ===
// Marketplace TIDAK menghitung ongkir/fee bank/gateway/pajak sendiri. Semua
// nilai datang dari response service external — lihat docs/assets/guest_checkout_sequence.html.

export async function previewGuestShippingRates(destination, items = []) {
  return unwrapData(await apiRequest("/marketplace/guest/shipping-rates", {
    method: "POST",
    body: { ...destination, items },
  }));
}

export async function submitGuestCheckout(payload) {
  return unwrapData(await apiRequest("/marketplace/guest/checkout", {
    method: "POST",
    body: payload,
  }));
}

export async function fetchGuestOrder(orderID, email) {
  if (!orderID || !email) throw new Error("Order ID dan email wajib diisi untuk melihat pesanan guest.");
  return unwrapData(await apiRequest(`/marketplace/guest/orders/${encodeURIComponent(orderID)}?email=${encodeURIComponent(email)}`));
}

// === Platform admin endpoints ===
// /marketplace/logging menerima RolePlatformAdmin dan RoleTechMaintainer.
// Dipakai untuk menampilkan log audit terkini di dashboard admin.
export async function listAuditLogs() {
  return unwrapData(await apiRequest("/marketplace/logging"));
}
