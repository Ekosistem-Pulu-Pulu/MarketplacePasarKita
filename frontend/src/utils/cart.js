import { calculateMarketplaceFee } from "./feeCalculator.js";

const CART_KEY = "pasarkita_cart_items";

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function normalizeProductForCart(product, qty = 1) {
  return {
    product_id: product.product_id,
    nama_produk: product.nama_produk,
    deskripsi: product.deskripsi,
    harga: Number(product.harga) || 0,
    stok: Number(product.stok) || 0,
    kategori: product.kategori,
    seller_id: product.seller_id,
    status_aktif: Boolean(product.status_aktif),
    qty: Math.max(1, Number(qty) || 1),
    selected: true,
  };
}

export function getCartItems() {
  const items = readJson(CART_KEY, []);
  return Array.isArray(items) ? items : [];
}

export function saveCartItems(items) {
  writeJson(CART_KEY, items);
}

export function getCartCount() {
  return getCartItems().reduce((total, item) => total + (Number(item.qty) || 0), 0);
}

export function addCartItem(product, qty = 1) {
  const items = getCartItems();
  const normalized = normalizeProductForCart(product, qty);
  const existing = items.find((item) => item.product_id === normalized.product_id);

  if (existing) {
    existing.qty = Math.min(existing.stok || normalized.stok, (Number(existing.qty) || 0) + normalized.qty);
    existing.selected = true;
  } else {
    items.push(normalized);
  }

  saveCartItems(items);
  return items;
}

export function updateCartItem(productId, changes) {
  const items = getCartItems().map((item) => {
    if (item.product_id !== productId) return item;

    const nextQty = changes.qty === undefined ? item.qty : Math.max(1, Number(changes.qty) || 1);
    return {
      ...item,
      ...changes,
      qty: Math.min(Number(item.stok) || nextQty, nextQty),
    };
  });

  saveCartItems(items);
  return items;
}

export function removeCartItem(productId) {
  const items = getCartItems().filter((item) => item.product_id !== productId);
  saveCartItems(items);
  return items;
}

export function clearCartItems(productIds) {
  const idSet = new Set(productIds);
  const items = getCartItems().filter((item) => !idSet.has(item.product_id));
  saveCartItems(items);
  return items;
}

export function getSelectedCartItems() {
  return getCartItems().filter((item) => item.selected && item.status_aktif && Number(item.qty) > 0);
}

export function calculateCartSummary(items = getSelectedCartItems()) {
  const subtotal = items.reduce((total, item) => total + Number(item.harga || 0) * Number(item.qty || 0), 0);
  const marketplace_fee = calculateMarketplaceFee(subtotal);

  return {
    item_count: items.reduce((total, item) => total + Number(item.qty || 0), 0),
    subtotal,
    marketplace_fee,
    total_bayar: subtotal + marketplace_fee,
  };
}
