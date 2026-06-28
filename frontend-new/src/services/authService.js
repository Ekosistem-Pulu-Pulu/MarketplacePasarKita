import * as authApi from "../api/authApi.js";
import {
  getUser,
	getRefreshToken,
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
		persistAuthSession(result);
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
    persistAuthSession({ token: "offline-session", user });
    return user;
  }
}

export async function registerUser(payload) {
  try {
    const result = await authApi.register(payload);
		persistAuthSession(result);
    return getUser();
  } catch (error) {
    if (!error.isNetworkError) throw error;
    const user = localRegister(payload);
    persistAuthSession({ token: "offline-session", user });
    return user;
  }
}

export async function logoutUser() {
	const refreshToken = getRefreshToken();
	try {
		if (refreshToken) await authApi.logout(refreshToken);
	} finally {
		logout();
	}
}

export async function getCurrentUser() {
  return getUser();
}
