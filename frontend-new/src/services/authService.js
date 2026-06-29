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
import { isBuyer } from "../utils/roles.js";
import { syncGuestCart } from "./cartService.js";

// Profile enrichment dipisah per request karena /account/addresses
// di backend hanya menerima RoleBuyer. Jika akun login adalah admin,
// pemanggilan addresses akan berakhir 403 lalu Promise.all reject
// dan menggugurkan enrichment nama/role dari /account/me.
async function enrichSession(baseUser) {
  let profile = baseUser;
  try {
    profile = await authApi.getMe();
  } catch (error) {
    if (error?.isNetworkError) throw error;
    // Endpoint me gagal tapi sesi sudah terbentuk — tetap lanjut dengan
    // user dari response login. Error lain (401/403) diteruskan.
    if (error?.status && error.status >= 500) throw error;
  }
  let addresses = [];
  if (isBuyer(profile?.role)) {
    try {
      addresses = await authApi.getAddresses();
    } catch (error) {
      if (error?.isNetworkError) throw error;
      // 403 untuk non-buyer sudah diakomodasi oleh guard isBuyer di atas;
      // error lain diabaikan agar enrichment tidak menggugurkan login.
    }
  }
  updateUser({ ...getUser(), ...profile, addresses });
}

export async function loginUser(payload) {
  try {
    const result = await authApi.login(payload.email, payload.password);
		persistAuthSession(result);
    await enrichSession(result?.user || {});
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
