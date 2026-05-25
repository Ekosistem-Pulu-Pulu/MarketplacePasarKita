const TOKEN_KEY = "pasarkita_jwt";
const SESSION_KEY = "pasarkita_user_session";

export const DEMO_USERS = [
  {
    user_id: "USR001",
    name: "Raka Buyer",
    email: "buyer@pasarkita.local",
    role: "buyer",
  },
  {
    user_id: "SELLER001",
    name: "Toko Sambal Roa",
    email: "seller@pasarkita.local",
    role: "seller",
  },
  {
    user_id: "CAT001",
    name: "Catalog Admin",
    email: "catalog@pasarkita.local",
    role: "catalog_admin",
  },
  {
    user_id: "CS001",
    name: "Customer Support",
    email: "support@pasarkita.local",
    role: "customer_support",
  },
  {
    user_id: "FIN001",
    name: "Finance Ops",
    email: "finance@pasarkita.local",
    role: "finance_ops",
  },
  {
    user_id: "FUL001",
    name: "Fulfillment Ops",
    email: "fulfillment@pasarkita.local",
    role: "fulfillment_ops",
  },
  {
    user_id: "ADM001",
    name: "Platform Admin",
    email: "admin@pasarkita.local",
    role: "platform_admin",
  },
  {
    user_id: "TECH001",
    name: "Tech Maintainer",
    email: "tech@pasarkita.local",
    role: "tech_maintainer",
  },
];

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export function getSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  return atob(padded);
}

export function getJwtPayload() {
  const token = getToken();
  if (!token) return null;

  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    return JSON.parse(decodeBase64Url(payload));
  } catch {
    return null;
  }
}

export function isTokenExpired() {
  const payload = getJwtPayload();
  if (!payload?.exp) return true;
  return Number(payload.exp) * 1000 <= Date.now();
}

export function isAuthenticated() {
  return Boolean(getSession()?.user_id && getToken() && !isTokenExpired());
}

export function getCurrentUser() {
  return getSession();
}

export function persistAuthSession(authData) {
  const user = authData?.user;
  const token = authData?.token;
  if (!user?.user_id || !token) {
    throw new Error("Response login tidak valid.");
  }

  const session = {
    user_id: user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
    token_type: authData.token_type || "Bearer",
    expires_at: authData.expires_at,
    logged_in_at: new Date().toISOString(),
  };

  setToken(token);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getDemoUser(userId) {
  return DEMO_USERS.find((item) => item.user_id === userId) || null;
}

export function logout() {
  removeToken();
  window.localStorage.removeItem(SESSION_KEY);
}
