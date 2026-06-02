import { login as loginRequest } from "../api/authApi.js";
import { registerAccount } from "../api/accountApi.js";
import { persistAuthSession, logout as clearSession } from "../utils/storage.js";
import { syncGuestCart } from "./cartService.js";

export async function loginUser(email, password) {
  const authData = await loginRequest(email, password);
  const session = persistAuthSession(authData);
  await syncGuestCart();
  return session;
}

export async function registerUser(payload) {
  const response = await registerAccount(payload);
  const authData = response.data || response;
  const session = persistAuthSession(authData);
  await syncGuestCart();
  return session;
}

export function logoutUser() {
  clearSession();
  window.dispatchEvent(new Event("pasarkita:cart-updated"));
}
