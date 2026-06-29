import { getProductById } from "../data/products.js";
import { ROLE } from "./roles.js";

const KEYS = {
  user: "pasarkita_user",
  users: "pasarkita_users",
  token: "pasarkita_api_token",
	refreshToken: "pasarkita_refresh_token",
	tokenExpiresAt: "pasarkita_token_expires_at",
  cart: "pasarkita_cart",
  orders: "pasarkita_orders",
  pendingRoute: "pasarkita_pending_route",
  sellerApplications: "pasarkita_seller_applications",
};

const defaultAddress = {
  id: "addr-home",
  label: "Rumah",
  recipient: "Raka Pratama",
  phone: "0812 3456 7890",
  address: "Jl. Merdeka No. 18, Sukajadi, Kota Bandung, Jawa Barat 40162",
};

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("pasarkita:state", { detail: { key } }));
  return value;
}

function withUserDefaults(user) {
  if (!user) return null;
  return {
    ...user,
    avatar: user.avatar || String(user.name || "PK").slice(0, 2).toUpperCase(),
    addresses: user.addresses || [],
  };
}

export function getUser() {
  return withUserDefaults(read(KEYS.user, null));
}

export function getToken() {
  return localStorage.getItem(KEYS.token) || "";
}

export function getRefreshToken() {
	return localStorage.getItem(KEYS.refreshToken) || "";
}

export function isLoggedIn() {
  return Boolean(getUser() && getToken());
}

export const isAuthenticated = isLoggedIn;

export function isApiSession() {
  return isLoggedIn() && getToken() !== "offline-session";
}

export function persistAuthTokens({ token, accessToken, refreshToken, expiresAt }) {
	const nextAccessToken = accessToken || token;
	if (nextAccessToken) localStorage.setItem(KEYS.token, nextAccessToken);
	if (refreshToken) localStorage.setItem(KEYS.refreshToken, refreshToken);
	if (expiresAt) localStorage.setItem(KEYS.tokenExpiresAt, expiresAt);
}

export function persistAuthSession({ token, accessToken, refreshToken, expiresAt, user }) {
	persistAuthTokens({ token, accessToken, refreshToken, expiresAt });
	return write(KEYS.user, withUserDefaults(user));
}

export function login(email) {
  const known = read(KEYS.users, []).find((user) => user.email === email);
  return write(KEYS.user, known || {
    ...defaultOfflineUser(email),
  });
}

// Heuristik ringan: akun dengan substring 'seller' diperlakukan seller,
// akun dengan substring 'admin/catalog/support/finance/fulfillment/tech'
// diperlakukan admin sesuai Prefixes; selain itu buyer. Output sudah
// mengikuti ROLE di utils/roles.js sehingga UI konsisten walau sesi
// fallback tidak punya backend.
function defaultOfflineUser(email) {
  const lower = String(email || "").toLowerCase();
  const avatar = String(email || "PK").slice(0, 2).toUpperCase();
  const base = {
    id: "user-local",
    email,
    phone: "0812 3456 7890",
    addresses: [defaultAddress],
  };
  if (lower.includes("seller")) {
    return { ...base, name: "Nadia Seller", avatar, role: ROLE.SELLER };
  }
  if (lower.includes("admin")) return { ...base, name: "Platform Admin", avatar, role: ROLE.PLATFORM_ADMIN };
  if (lower.includes("catalog")) return { ...base, name: "Catalog Admin", avatar, role: ROLE.CATALOG_ADMIN };
  if (lower.includes("support")) return { ...base, name: "Customer Support", avatar, role: ROLE.CUSTOMER_SUPPORT };
  if (lower.includes("finance")) return { ...base, name: "Finance Ops", avatar, role: ROLE.FINANCE_OPS };
  if (lower.includes("fulfillment")) return { ...base, name: "Fulfillment Ops", avatar, role: ROLE.FULFILLMENT_OPS };
  if (lower.includes("tech")) return { ...base, name: "Tech Maintainer", avatar, role: ROLE.TECH_MAINTAINER };
  return { ...base, name: "Raka Pratama", avatar, role: ROLE.BUYER };
}

export function register(payload) {
  const user = {
    id: `user-${Date.now()}`,
    name: payload.name,
    email: payload.email,
    phone: payload.phone || "Belum diisi",
    avatar: payload.name.slice(0, 2).toUpperCase(),
    role: payload.role || ROLE.BUYER,
    addresses: [defaultAddress],
  };
  write(KEYS.users, [...read(KEYS.users, []), user]);
  return write(KEYS.user, user);
}

export function updateUser(updates) {
  return write(KEYS.user, withUserDefaults({ ...getUser(), ...updates }));
}

function currentUserKey() {
  const user = getUser();
  return user?.id || user?.email || "guest";
}

export function getSellerApplication() {
  return read(KEYS.sellerApplications, {})[currentUserKey()] || null;
}

export function saveSellerApplication(payload) {
  const applications = read(KEYS.sellerApplications, {});
  const application = {
    id: `SELLER-APP-${Date.now()}`,
    status: "PENDING_REVIEW",
    submittedAt: new Date().toISOString(),
    applicant: {
      id: getUser()?.id || "",
      name: getUser()?.name || "",
      email: getUser()?.email || "",
    },
    ...payload,
  };
  applications[currentUserKey()] = application;
  write(KEYS.sellerApplications, applications);
  return application;
}

export function logout() {
  localStorage.removeItem(KEYS.user);
  localStorage.removeItem(KEYS.token);
	localStorage.removeItem(KEYS.refreshToken);
	localStorage.removeItem(KEYS.tokenExpiresAt);
  window.dispatchEvent(new CustomEvent("pasarkita:state", { detail: { key: KEYS.user } }));
}

export function setPendingRoute(route) {
  sessionStorage.setItem(KEYS.pendingRoute, route);
}

export function consumePendingRoute() {
  const route = sessionStorage.getItem(KEYS.pendingRoute);
  sessionStorage.removeItem(KEYS.pendingRoute);
  return route || "/products";
}

export function getCart() {
  return read(KEYS.cart, []);
}

export function getCartItems() {
  return getCart().map((item) => ({ ...item, product: getProductById(item.productId) })).filter((item) => item.product);
}

export function getCartCount() {
  return getCart().reduce((total, item) => total + item.qty, 0);
}

export function addCartItem(productId, qty = 1, variant = "") {
  const product = getProductById(productId);
  if (!product) return getCart();
  const cart = getCart();
  const existing = cart.find((item) => item.productId === productId && item.variant === variant);
  if (existing) existing.qty = Math.min(product.stock, existing.qty + qty);
  else cart.push({ productId, qty: Math.min(product.stock, qty), variant, selected: true });
  return write(KEYS.cart, cart);
}

export function updateCartItem(productId, variant, updates) {
  return write(KEYS.cart, getCart().map((item) => item.productId === productId && item.variant === variant
    ? { ...item, ...updates, qty: Math.max(1, updates.qty || item.qty) }
    : item));
}

export function removeCartItem(productId, variant) {
  return write(KEYS.cart, getCart().filter((item) => !(item.productId === productId && item.variant === variant)));
}

export function clearSelectedCart() {
  return write(KEYS.cart, getCart().filter((item) => !item.selected));
}

export function getOrders() {
  return read(KEYS.orders, []);
}

export function getOrder(id) {
  return getOrders().find((order) => order.id === id);
}

export function createOrder(details) {
  const items = details.items || getCartItems().filter((item) => item.selected);
  const order = {
    id: `PK-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
    createdAt: new Date().toISOString(),
    status: "Menunggu Pembayaran",
    isLocal: true,
    items,
    ...details,
  };
  write(KEYS.orders, [order, ...getOrders()]);
  clearSelectedCart();
  return order;
}

export function updateOrderStatus(id, status) {
  const orders = getOrders().map((order) => order.id === id ? { ...order, status, updatedAt: new Date().toISOString() } : order);
  write(KEYS.orders, orders);
  return orders.find((order) => order.id === id);
}

// === Guest Checkout draft ===
// Draft disimpan di sessionStorage agar auto hilang saat tab ditutup,
// tetapi juga punya backup di localStorage untuk recovery jika halaman
// disegarkan (refresh-safe). Draft berisi alamat penerima split (kota/
// kecamatan/kelurahan/alamat_lengkap) agar field LogistikKita tidak hilang.

const GUEST_DRAFT_KEY = "pasarkita_guest_draft";

export function saveGuestDraft(payload) {
  sessionStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(payload));
  return payload;
}

export function readGuestDraft() {
  try {
    const session = sessionStorage.getItem(GUEST_DRAFT_KEY);
    if (session) return JSON.parse(session);
  } catch {
    // ignore corrupt session
  }
  try {
    const local = localStorage.getItem(GUEST_DRAFT_KEY);
    return local ? JSON.parse(local) : null;
  } catch {
    return null;
  }
}

export function clearGuestDraft() {
  sessionStorage.removeItem(GUEST_DRAFT_KEY);
  localStorage.removeItem(GUEST_DRAFT_KEY);
}
