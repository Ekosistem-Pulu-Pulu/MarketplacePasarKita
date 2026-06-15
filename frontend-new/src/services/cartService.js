import { addCartItem, getCartItems, removeCartItem, updateCartItem } from "../utils/storage.js";

export async function listCartItems() {
  return getCartItems();
}

export async function addToCart(productId, qty = 1, variant = "") {
  return addCartItem(productId, qty, variant);
}

export async function updateCart(productId, variant, updates) {
  return updateCartItem(productId, variant, updates);
}

export async function removeFromCart(productId, variant = "") {
  return removeCartItem(productId, variant);
}
