import { products } from "../data/products.js";

const CART_KEY = "pasarkita_cart";
const VOUCHER_DISCOUNT = 15000;
const SHIPPING_COST = 14000;

function readCartRecords() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCartRecords(records) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(records));
  window.dispatchEvent(new Event("pasarkita:cart-updated"));
}

export function getCartItems() {
  return readCartRecords()
    .map((record) => {
      const product = products.find((item) => item.id === record.id);
      if (!product) return null;

      return {
        ...product,
        qty: Math.max(1, Math.min(Number(record.qty || 1), product.stock)),
        selected: record.selected !== false,
      };
    })
    .filter(Boolean);
}

export function getCartCount() {
  return getCartItems().reduce((total, item) => total + item.qty, 0);
}

export function addToCart(productId, qty = 1) {
  const product = products.find((item) => item.id === productId);
  if (!product || product.stock <= 0) return false;

  const records = readCartRecords();
  const existing = records.find((item) => item.id === productId);

  if (existing) {
    existing.qty = Math.min(product.stock, Number(existing.qty || 1) + qty);
    existing.selected = true;
  } else {
    records.push({
      id: productId,
      qty: Math.min(product.stock, qty),
      selected: true,
    });
  }

  writeCartRecords(records);
  return true;
}

export function updateCartQty(productId, qty) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  const records = readCartRecords().map((item) =>
    item.id === productId
      ? {
          ...item,
          qty: Math.max(1, Math.min(product.stock, Number(qty || 1))),
        }
      : item
  );

  writeCartRecords(records);
}

export function toggleCartItem(productId, selected) {
  const records = readCartRecords().map((item) =>
    item.id === productId ? { ...item, selected: Boolean(selected) } : item
  );

  writeCartRecords(records);
}

export function removeCartItem(productId) {
  writeCartRecords(readCartRecords().filter((item) => item.id !== productId));
}

export function clearSelectedItems() {
  writeCartRecords(readCartRecords().filter((item) => item.selected === false));
}

export function getSelectedCartItems() {
  return getCartItems().filter((item) => item.selected && item.stock > 0);
}

export function getCartSummary(items, voucherCode = "") {
  const subtotal = items.reduce((total, item) => total + item.price * item.qty, 0);
  const discount = voucherCode === "PASARKITA15" && subtotal >= 150000 ? VOUCHER_DISCOUNT : 0;
  const shipping = items.length ? SHIPPING_COST : 0;

  return {
    itemCount: items.reduce((total, item) => total + item.qty, 0),
    subtotal,
    discount,
    shipping,
    total: Math.max(0, subtotal + shipping - discount),
  };
}
