import { apiRequest } from "./client.js";
import { calculateCheckoutPreview } from "../utils/feeCalculator.js";

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

export async function getOrderStatus(orderId) {
  const query = new URLSearchParams({ order_id: orderId });
  return normalizeOrder(
    await apiRequest(`/marketplace/status_order?${query.toString()}`)
  );
}

export async function calculateMarketplaceFee(subtotal) {
  try {
    const query = new URLSearchParams({ subtotal: String(subtotal) });
    return await apiRequest(
      `/marketplace/biaya_layanan_marketplace?${query.toString()}`
    );
  } catch {
    return {
      status: "success",
      data: {
        marketplace_fee: calculateCheckoutPreview(Number(subtotal), 1).marketplace_fee,
      },
    };
  }
}
