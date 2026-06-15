import * as authApi from "../api/authApi.js";
import {
  getUser,
  login as localLogin,
  logout,
  persistAuthSession,
  register as localRegister,
  updateUser,
} from "../utils/storage.js";
import { syncGuestCart } from "./cartService.js";

export async function loginUser(payload) {
  try {
    const result = await authApi.login(payload.email, payload.password);
    persistAuthSession({ token: result.token, user: result.user });
    try {
      const [profile, addresses] = await Promise.all([authApi.getMe(), authApi.getAddresses()]);
      updateUser({ ...profile, addresses });
    } catch {
      // The JWT payload is enough to establish the session if profile enrichment fails.
    }
    await syncGuestCart();
    return getUser();
  } catch (error) {
    if (!error.isNetworkError) throw error;
    const user = localLogin(payload.email);
    persistAuthSession({ token: "offline-demo", user });
    return user;
  }
}

export async function registerUser(payload) {
  try {
    const result = await authApi.register(payload);
    persistAuthSession({ token: result.token, user: result.user });
    return getUser();
  } catch (error) {
    if (!error.isNetworkError) throw error;
    const user = localRegister(payload);
    persistAuthSession({ token: "offline-demo", user });
    return user;
  }
}

export async function logoutUser() {
  logout();
}

export async function getCurrentUser() {
  return getUser();
}
