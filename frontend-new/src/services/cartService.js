import { addCart, deleteCart, fetchCart, patchCart, syncCart } from "../api/marketplaceApi.js";
import { getCart, isApiSession } from "../utils/storage.js";
import { getProduct } from "./productService.js";

const GUEST_CART_KEY = "pasarkita_demo_cart";
let cartCountSnapshot = 0;

function readGuestCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]");
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

function writeGuestCart(cart) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  dispatchUpdated();
  return cart;
}

function dispatchUpdated() {
  window.dispatchEvent(new Event("pasarkita:cart-updated"));
  window.dispatchEvent(new CustomEvent("pasarkita:state", { detail: { key: GUEST_CART_KEY } }));
}

function normalizeServerCart(data = {}) {
  const items = data.items || [];
  cartCountSnapshot = items.reduce((total, item) => total + item.qty, 0);
  return items;
}

async function normalizeGuestCart() {
  const items = await Promise.all(readGuestCart().map(async (item) => {
    const product = await getProduct(item.productId);
    return product ? { ...item, product } : null;
  }));
  const result = items.filter(Boolean);
  cartCountSnapshot = result.reduce((total, item) => total + item.qty, 0);
  return result;
}

export async function listCartItems() {
  if (isApiSession()) {
    try {
      const items = normalizeServerCart(await fetchCart());
      window.dispatchEvent(new Event("pasarkita:cart-updated"));
      return items;
    } catch (error) {
      if (!error.isNetworkError) throw error;
    }
  }
  return normalizeGuestCart();
}

export function getCartCountSnapshot() {
  if (!cartCountSnapshot) {
    cartCountSnapshot = getCart().reduce((total, item) => total + Number(item.qty || 0), 0);
  }
  return cartCountSnapshot;
}

export async function addToCart(productId, qty = 1, variant = "") {
  if (isApiSession()) {
    const items = normalizeServerCart(await addCart(productId, qty, variant));
    dispatchUpdated();
    return items;
  }
  const product = await getProduct(productId);
  if (!product) throw new Error("Produk tidak ditemukan.");
  const cart = readGuestCart();
  const existing = cart.find((item) => item.productId === productId && item.variant === variant);
  if (existing) existing.qty = Math.min(product.stock, existing.qty + Number(qty || 1));
  else cart.push({ productId, qty: Math.min(product.stock, Number(qty || 1)), variant, selected: true });
  writeGuestCart(cart);
  return normalizeGuestCart();
}

export async function updateCart(productId, variant, updates) {
  if (isApiSession()) {
    const current = (await listCartItems()).find((item) => item.productId === productId);
    const items = normalizeServerCart(await patchCart(productId, {
      qty: Number(updates.qty || current?.qty || 1),
      selected: updates.selected ?? current?.selected ?? true,
    }));
    dispatchUpdated();
    return items;
  }
  writeGuestCart(readGuestCart().map((item) => item.productId === productId && item.variant === variant
    ? { ...item, ...updates, qty: Math.max(1, Number(updates.qty || item.qty)) }
    : item));
  return normalizeGuestCart();
}

export async function removeFromCart(productId, variant = "") {
  if (isApiSession()) {
    const items = normalizeServerCart(await deleteCart(productId));
    dispatchUpdated();
    return items;
  }
  writeGuestCart(readGuestCart().filter((item) => !(item.productId === productId && item.variant === variant)));
  return normalizeGuestCart();
}

export async function syncGuestCart() {
  if (!isApiSession()) return [];
  const guest = readGuestCart();
  if (!guest.length) return listCartItems();
  const items = normalizeServerCart(await syncCart(guest));
  writeGuestCart([]);
  return items;
}
