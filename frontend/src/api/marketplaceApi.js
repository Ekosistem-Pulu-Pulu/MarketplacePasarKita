import { apiRequest } from "./client.js";

function normalizeProductList(response) {
  const data = response?.data ?? response;
  const items = Array.isArray(data) ? data : data?.items || data?.products || [];
  const meta = data?.meta || {};

  return {
    status: response?.status || "success",
    data: {
      items,
      total: meta.total ?? data?.total ?? items.length,
      page: meta.page ?? data?.page ?? 1,
      limit: meta.limit ?? data?.limit ?? items.length,
    },
  };
}

function normalizeOrder(response) {
  const order = response?.data ?? response;
  const firstItem = Array.isArray(order?.items) ? order.items[0] : null;

  return {
    status: response?.status || "success",
    data: {
      ...order,
      product_id: order?.product_id || firstItem?.product_id,
      nama_produk: order?.nama_produk || firstItem?.nama_produk,
      qty: order?.qty || firstItem?.qty,
    },
  };
}

export async function browseProducts(params = {}) {
  if (params.includeInactive) {
    return normalizeProductList(await apiRequest("/marketplace/seller/products"));
  }

  const query = new URLSearchParams({
    keyword: params.keyword || "",
    kategori: params.kategori || params.category || "",
    sort: params.sort || "",
    page: String(params.page || 1),
    limit: String(params.limit || 20),
  });

  return normalizeProductList(
    await apiRequest(`/marketplace/browse_produk?${query.toString()}`)
  );
}

export async function getProductById(productId, options = {}) {
  const response = await apiRequest(`/marketplace/products/${encodeURIComponent(productId)}`);
  const product = response.data;

  if (!product || (!options.includeInactive && !product.status_aktif)) {
    throw new Error("Produk tidak ditemukan.");
  }

  return { status: "success", data: product };
}

export async function createProduct(payload) {
  return apiRequest("/marketplace/manajemen_produk", {
    method: "POST",
    body: payload,
  });
}

export async function updateProduct(productId, payload) {
  return apiRequest("/marketplace/manajemen_produk", {
    method: "POST",
    body: {
      ...payload,
      product_id: productId,
    },
  });
}

export async function deactivateProduct(productId) {
  return apiRequest(`/marketplace/products/${encodeURIComponent(productId)}/status`, {
    method: "PATCH",
    body: {
      status_aktif: false,
    },
  });
}

export async function checkout(payload) {
  return normalizeOrder(
    await apiRequest("/marketplace/checkout", {
      method: "POST",
      body: payload,
    })
  );
}

export async function getCart() {
  return apiRequest("/marketplace/cart");
}

export async function addCartItem(productId, qty = 1) {
  return apiRequest("/marketplace/cart", {
    method: "POST",
    body: { product_id: productId, qty },
  });
}

export async function updateCartItem(productId, payload) {
  return apiRequest(`/marketplace/cart/${encodeURIComponent(productId)}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function removeCartItem(productId) {
  return apiRequest(`/marketplace/cart/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
}

export async function checkoutCart(payload) {
  return normalizeOrder(
    await apiRequest("/marketplace/cart/checkout", {
      method: "POST",
      body: payload,
    })
  );
}

export async function listOrders() {
  const response = await apiRequest("/marketplace/orders");
  return { status: response.status || "success", data: response.data || [] };
}

export async function listSellerOrders() {
  const response = await apiRequest("/marketplace/seller/orders");
  return { status: response.status || "success", data: response.data || [] };
}

export async function cancelOrder(orderId, reason = "") {
  return normalizeOrder(
    await apiRequest(`/marketplace/orders/${encodeURIComponent(orderId)}/cancel`, {
      method: "PATCH",
      body: { reason },
    })
  );
}

export async function getOrderStatus(orderId) {
  const query = new URLSearchParams({ order_id: orderId });
  return normalizeOrder(
    await apiRequest(`/marketplace/status_order?${query.toString()}`)
  );
}

export async function calculateMarketplaceFee(subtotal) {
  const query = new URLSearchParams({ subtotal: String(subtotal) });
  return apiRequest(`/marketplace/biaya_layanan_marketplace?${query.toString()}`);
}

export async function listStores() {
  return apiRequest("/marketplace/stores");
}

export async function getStore(storeId) {
  return apiRequest(`/marketplace/stores/${encodeURIComponent(storeId)}`);
}

export async function getMyStore() {
  return apiRequest("/marketplace/stores/me");
}

export async function listVouchers() {
  return apiRequest("/marketplace/vouchers");
}

export async function applyVoucher(code, subtotal) {
  const query = new URLSearchParams({ subtotal: String(subtotal || 0) });
  return apiRequest(`/marketplace/vouchers/${encodeURIComponent(code)}/apply?${query.toString()}`);
}

export async function getShippingOptions(params = {}) {
  const query = new URLSearchParams({
    product_id: params.product_id || "",
    qty: String(params.qty || 1),
  });
  return apiRequest(`/marketplace/shipping/options?${query.toString()}`);
}

export async function listReviews(productId) {
  return apiRequest(`/marketplace/products/${encodeURIComponent(productId)}/reviews`);
}

export async function createReview(productId, payload) {
  return apiRequest(`/marketplace/products/${encodeURIComponent(productId)}/reviews`, {
    method: "POST",
    body: payload,
  });
}

export async function listDiscussions(productId) {
  return apiRequest(`/marketplace/products/${encodeURIComponent(productId)}/discussions`);
}

export async function createDiscussion(productId, message) {
  return apiRequest(`/marketplace/products/${encodeURIComponent(productId)}/discussions`, {
    method: "POST",
    body: { message },
  });
}

export async function listChat() {
  return apiRequest("/marketplace/chat");
}

export async function sendChat(payload) {
  return apiRequest("/marketplace/chat", {
    method: "POST",
    body: payload,
  });
}

export async function listNotifications() {
  return apiRequest("/marketplace/notifications");
}

export async function markNotificationRead(notificationId) {
  return apiRequest(`/marketplace/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: "PATCH",
  });
}
