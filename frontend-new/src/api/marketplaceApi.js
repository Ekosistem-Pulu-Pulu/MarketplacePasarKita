import { apiRequest, unwrapData } from "./client.js";

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
  return unwrapData(await apiRequest(`/marketplace/cart/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    body: { productId, ...payload },
  }));
}

export async function deleteCart(productId) {
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
