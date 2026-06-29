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
import { isBuyer, ROLE } from "../utils/roles.js";
import { syncGuestCart } from "./cartService.js";

// Hapus entri di pasarkita_users yang email-nya cocok dengan akun BARU
// yang baru saja berhasil login ke backend. Cache offline sering menyimpan
// role default `"buyer"` dari tes register sebelumnya, dan fallback
// `storage.login(email)` akan memilih entry ini duluan sehingga role baru
// dari JWT tidak pernah sampai.
function clearStaleOfflineUsers(email) {
  if (!email) return;
  try {
    const raw = localStorage.getItem("pasarkita_users");
    if (!raw) return;
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || !list.length) return;
    const filtered = list.filter(
      (entry) => String(entry?.email || "").toLowerCase() !== String(email).toLowerCase(),
    );
    if (filtered.length !== list.length) {
      localStorage.setItem("pasarkita_users", JSON.stringify(filtered));
    }
  } catch {
    // abaikan cache corrupt — tidak boleh menggugurkan login sukses
  }
}

const VALID_ROLES = new Set(Object.values(ROLE));

// Profile enrichment dipisah per request karena /account/addresses
// di backend hanya menerima RoleBuyer. Jika akun login adalah admin,
// pemanggilan addresses akan berakhir 403 lalu Promise.all reject
// dan menggugurkan enrichment nama/role dari /me.
// Catatan: role dari response /auth/login dipakai sebagai sumber
// kebenaran utama; hanya ditimpa jika /me mengembalikan role yang valid
// (string non-kosong yang ada di ROLE enum). Ini mencegah FE jatuh ke
// fallback "buyer" ketika endpoint /me lambat atau tidak menyertakan role.
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
  const merged = { ...getUser(), ...profile };
  if (VALID_ROLES.has(profile?.role)) {
    merged.role = profile.role;
  } else if (VALID_ROLES.has(getUser()?.role)) {
    merged.role = getUser().role;
  }
  let addresses = [];
  if (isBuyer(merged?.role)) {
    try {
      addresses = await authApi.getAddresses();
    } catch (error) {
      if (error?.isNetworkError) throw error;
      // 403 untuk non-buyer sudah diakomodasi oleh guard isBuyer di atas;
      // error lain diabaikan agar enrichment tidak menggugurkan login.
    }
  }
  updateUser({ ...merged, addresses });
}

export async function loginUser(payload) {
  try {
    const result = await authApi.login(payload.email, payload.password);
		persistAuthSession(result);
    // Cache offline (pasarkita_users) dari sesi uji sebelumnya sering masih
    // memegang role default "buyer" untuk email yang sama. Bersihkan dulu
    // sebelum enrichment sehingga role baru dari backend tidak ditimpa.
    clearStaleOfflineUsers(payload.email);
    await enrichSession(result?.user || {});
    await syncGuestCart();
    return getUser();
  } catch (error) {
    if (!error.isNetworkError) throw error;
    // Pastikan fallback offline tidak memakai entry `pasarkita_users`
    // yang sudah lama dan menahan role `buyer` untuk email admin.
    clearStaleOfflineUsers(payload.email);
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
