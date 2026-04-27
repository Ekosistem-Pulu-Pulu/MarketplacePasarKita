import { USE_MOCK } from "../config/apiConfig.js";
import { apiRequest } from "./client.js";
import { mockProducts } from "../mocks/mockProducts.js";
import { mockOrders } from "../mocks/mockOrders.js";
import { calculateCheckoutPreview } from "../utils/feeCalculator.js";

let products = mockProducts.map((product) => ({ ...product }));
let orders = mockOrders.map((order) => ({ ...order }));

function delay(data, ms = 250) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(structuredClone(data)), ms);
  });
}

function normalizeProductList(response) {
  const data = response?.data ?? response;
  const items = Array.isArray(data) ? data : data?.items || data?.products || [];

  return {
    status: response?.status || "success",
    data: {
      items,
      total: data?.total ?? items.length,
      page: data?.page ?? 1,
      limit: data?.limit ?? items.length,
    },
  };
}

function filterProducts({ keyword = "", includeInactive = false } = {}) {
  const needle = keyword.trim().toLowerCase();

  return products.filter((product) => {
    const searchable = `${product.nama_produk} ${product.kategori} ${product.deskripsi}`.toLowerCase();
    const visible = includeInactive || product.status_aktif;

    return visible && (!needle || searchable.includes(needle));
  });
}

export async function browseProducts(params = {}) {
  if (!USE_MOCK) {
    const query = new URLSearchParams({
      keyword: params.keyword || "",
      page: String(params.page || 1),
      limit: String(params.limit || 20),
    });

    return normalizeProductList(
      await apiRequest(`/marketplace/browse_produk?${query.toString()}`)
    );
  }

  const page = Number(params.page || 1);
  const limit = Number(params.limit || 20);
  const filtered = filterProducts(params);
  const start = (page - 1) * limit;
  const items = filtered.slice(start, start + limit);

  return delay({
    status: "success",
    data: {
      items,
      total: filtered.length,
      page,
      limit,
    },
  });
}

export async function getProductById(productId, options = {}) {
  if (!USE_MOCK) {
    const response = await browseProducts({
      keyword: "",
      page: 1,
      limit: 100,
      includeInactive: options.includeInactive,
    });
    const product = response.data.items.find((item) => item.product_id === productId);

    if (!product) {
      throw new Error("Produk tidak ditemukan.");
    }

    return { status: "success", data: product };
  }

  const product = products.find((item) => item.product_id === productId);

  if (!product || (!options.includeInactive && !product.status_aktif)) {
    throw new Error("Produk tidak ditemukan.");
  }

  return delay({ status: "success", data: product });
}

export async function createProduct(payload) {
  if (!USE_MOCK) {
    return apiRequest("/marketplace/manajemen_produk", {
      method: "POST",
      body: payload,
    });
  }

  const nextNumber = String(products.length + 1).padStart(3, "0");
  const product = {
    product_id: `PRD${nextNumber}`,
    seller_id: payload.seller_id || "SELLER001",
    nama_produk: payload.nama_produk,
    deskripsi: payload.deskripsi,
    harga: Number(payload.harga),
    stok: Number(payload.stok),
    kategori: payload.kategori,
    status_aktif: true,
  };

  products = [product, ...products];
  return delay({ status: "success", data: product });
}

export async function updateProduct(productId, payload) {
  if (!USE_MOCK) {
    return apiRequest(`/marketplace/manajemen_produk/${productId}`, {
      method: "PUT",
      body: payload,
    });
  }

  const index = products.findIndex((item) => item.product_id === productId);
  if (index === -1) {
    throw new Error("Produk tidak ditemukan.");
  }

  products[index] = {
    ...products[index],
    ...payload,
    harga: Number(payload.harga),
    stok: Number(payload.stok),
  };

  return delay({ status: "success", data: products[index] });
}

export async function deactivateProduct(productId) {
  if (!USE_MOCK) {
    return apiRequest(`/marketplace/manajemen_produk/${productId}/nonaktif`, {
      method: "PATCH",
    });
  }

  const index = products.findIndex((item) => item.product_id === productId);
  if (index === -1) {
    throw new Error("Produk tidak ditemukan.");
  }

  products[index] = {
    ...products[index],
    status_aktif: false,
  };

  return delay({ status: "success", data: products[index] });
}

export async function checkout(payload) {
  if (!USE_MOCK) {
    return apiRequest("/marketplace/checkout", {
      method: "POST",
      body: payload,
    });
  }

  const product = products.find(
    (item) => item.product_id === payload.product_id && item.status_aktif
  );

  if (!product) {
    throw new Error("Produk tidak tersedia.");
  }

  if (Number(payload.qty) <= 0 || Number(payload.qty) > product.stok) {
    throw new Error("Qty checkout tidak valid.");
  }

  if (!String(payload.alamat_pengiriman || "").trim()) {
    throw new Error("Alamat pengiriman wajib diisi.");
  }

  const preview = calculateCheckoutPreview(product.harga, payload.qty);
  const order = {
    order_id: `ORD${Date.now()}`,
    user_id: payload.user_id,
    product_id: payload.product_id,
    nama_produk: product.nama_produk,
    qty: Number(payload.qty),
    subtotal: preview.subtotal,
    marketplace_fee: preview.marketplace_fee,
    total_bayar: preview.total_bayar,
    payment_request_id: `PAYREQ${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
    status_order: "PENDING_PAYMENT",
    alamat_pengiriman: payload.alamat_pengiriman,
    created_at: new Date().toISOString(),
  };

  orders = [order, ...orders];

  return delay({
    status: "success",
    data: order,
  });
}

export async function getOrderStatus(orderId) {
  if (!USE_MOCK) {
    const query = new URLSearchParams({ order_id: orderId });
    return apiRequest(`/marketplace/status_order?${query.toString()}`);
  }

  const order = orders.find((item) => item.order_id === orderId);
  if (!order) {
    throw new Error("Order tidak ditemukan.");
  }

  return delay({ status: "success", data: order });
}

export async function calculateMarketplaceFee(subtotal) {
  if (!USE_MOCK) {
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

  return delay({
    status: "success",
    data: {
      marketplace_fee: calculateCheckoutPreview(Number(subtotal), 1).marketplace_fee,
    },
  });
}
