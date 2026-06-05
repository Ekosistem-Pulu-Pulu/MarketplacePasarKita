import {
  addCartItem,
  getCart,
  removeCartItem as removeServerCartItem,
  updateCartItem,
} from "../api/marketplaceApi.js";
import { apiRequest } from "../api/client.js";
import { isAuthenticated } from "../utils/storage.js";
import { getProduct, mapProduct } from "./productService.js";

const GUEST_CART_KEY = "pasarkita_guest_cart";
let serverCartCount = 0;

function dispatchCartUpdated() {
  window.dispatchEvent(new Event("pasarkita:cart-updated"));
}

function readGuestCart() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(GUEST_CART_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGuestCart(records) {
  window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(records));
  dispatchCartUpdated();
}

function normalizeServerCart(response) {
  const data = response?.data ?? response ?? {};
  const items = Array.isArray(data.items) ? data.items : [];
  const mappedItems = items
    .map((view) => {
      const product = mapProduct(view.product);
      if (!product) return null;
      return {
        ...product,
        qty: Number(view.item?.qty || 1),
        selected: view.item?.selected !== false,
        cartItem: view.item,
      };
    })
    .filter(Boolean);

  serverCartCount = Number(data.count || mappedItems.reduce((total, item) => total + item.qty, 0));
  return {
    items: mappedItems,
    subtotal: Number(data.subtotal || 0),
    count: serverCartCount,
  };
}

export async function getCartState() {
  if (isAuthenticated()) {
    return normalizeServerCart(await getCart());
  }

  const records = readGuestCart();
  const items = await Promise.all(
    records.map(async (record) => {
      try {
        const product = await getProduct(record.product_id);
        return {
          ...product,
          qty: Math.max(1, Math.min(Number(record.qty || 1), product.stock)),
          selected: record.selected !== false,
        };
      } catch {
        return null;
      }
    })
  );
  const cleanItems = items.filter(Boolean);
  return {
    items: cleanItems,
    subtotal: cleanItems
      .filter((item) => item.selected)
      .reduce((total, item) => total + item.price * item.qty, 0),
    count: cleanItems.reduce((total, item) => total + item.qty, 0),
  };
}

export function getCartCountSnapshot() {
  if (isAuthenticated()) return serverCartCount;
  return readGuestCart().reduce((total, item) => total + Number(item.qty || 0), 0);
}

export async function addToCart(productId, qty = 1) {
  if (isAuthenticated()) {
    const cart = normalizeServerCart(await addCartItem(productId, qty));
    dispatchCartUpdated();
    return cart;
  }

  const product = await getProduct(productId);
  if (!product || product.stock <= 0) {
    throw new Error("Produk belum tersedia.");
  }
  const records = readGuestCart();
  const existing = records.find((item) => item.product_id === productId);
  if (existing) {
    existing.qty = Math.min(product.stock, Number(existing.qty || 1) + Number(qty || 1));
    existing.selected = true;
  } else {
    records.push({
      product_id: productId,
      qty: Math.min(product.stock, Number(qty || 1)),
      selected: true,
    });
  }
  writeGuestCart(records);
  return getCartState();
}

export async function updateCartQty(productId, qty) {
  const nextQty = Number(qty || 1);
  if (isAuthenticated()) {
    const cart = normalizeServerCart(
      await updateCartItem(productId, {
        product_id: productId,
        qty: nextQty,
      })
    );
    dispatchCartUpdated();
    return cart;
  }

  const product = await getProduct(productId);
  writeGuestCart(
    readGuestCart().map((item) =>
      item.product_id === productId
        ? { ...item, qty: Math.max(1, Math.min(product.stock, nextQty)) }
        : item
    )
  );
  return getCartState();
}

export async function toggleCartItem(productId, selected) {
  if (isAuthenticated()) {
    const current = normalizeServerCart(await getCart()).items.find((item) => item.id === productId);
    const cart = normalizeServerCart(
      await updateCartItem(productId, {
        product_id: productId,
        qty: current?.qty || 1,
        selected: Boolean(selected),
      })
    );
    dispatchCartUpdated();
    return cart;
  }

  writeGuestCart(
    readGuestCart().map((item) =>
      item.product_id === productId ? { ...item, selected: Boolean(selected) } : item
    )
  );
  return getCartState();
}

export async function removeCartItem(productId) {
  if (isAuthenticated()) {
    const cart = normalizeServerCart(await removeServerCartItem(productId));
    dispatchCartUpdated();
    return cart;
  }

  writeGuestCart(readGuestCart().filter((item) => item.product_id !== productId));
  return getCartState();
}

export async function syncGuestCart() {
  if (!isAuthenticated()) return null;
  const items = readGuestCart();
  if (!items.length) return normalizeServerCart(await getCart());

  const response = await apiRequest("/marketplace/cart/sync", {
    method: "POST",
    body: { items },
  });
  writeGuestCart([]);
  return normalizeServerCart(response);
}
