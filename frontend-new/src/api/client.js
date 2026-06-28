import { API_BASE_URL, API_TIMEOUT_MS } from "../config/apiConfig.js";
import { getRefreshToken, getToken, logout, persistAuthTokens } from "../utils/storage.js";

let refreshPromise = null;

function buildUrl(endpoint) {
  const base = API_BASE_URL.replace(/\/$/, "");
  return `${base}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
}

function friendlyError(status, message) {
  const detail = String(message || "").toLowerCase();
  if (status === 401) return "Silakan login untuk melanjutkan.";
  if (status === 403) return "Akun ini tidak memiliki akses ke fitur tersebut.";
  if (status === 404) return "Data yang dicari tidak ditemukan.";
  if (detail.includes("stok")) return "Stok produk tidak mencukupi.";
  if (detail.includes("alamat")) return "Alamat pengiriman belum sesuai.";
  if (detail.includes("email sudah")) return "Email tersebut sudah digunakan.";
  return message || "Backend belum dapat dihubungi. Data lokal tetap digunakan.";
}

export async function apiRequest(endpoint, options = {}) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
	const token = getToken();
	const { retryAfterRefresh = false, skipAuthRefresh = false, ...fetchOptions } = options;

  try {
		const response = await fetch(buildUrl(endpoint), {
			...fetchOptions,
			signal: fetchOptions.signal || controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
				...(fetchOptions.headers || {}),
			},
			body: fetchOptions.body && typeof fetchOptions.body !== "string"
				? JSON.stringify(fetchOptions.body)
				: fetchOptions.body,
		});
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : null;
		if (!response.ok) {
			if (response.status === 401 && token && getRefreshToken() && !retryAfterRefresh && !skipAuthRefresh) {
				await refreshAccessToken();
				return apiRequest(endpoint, { ...options, retryAfterRefresh: true });
			}
			const error = new Error(friendlyError(response.status, payload?.message || payload?.error));
      error.status = response.status;
      if (response.status === 401 && token) logout();
      throw error;
    }
    return payload;
  } catch (error) {
    if (error.name === "AbortError" || error instanceof TypeError) {
      const networkError = new Error("Backend belum dapat dihubungi. Data lokal tetap digunakan.");
      networkError.isNetworkError = true;
      throw networkError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function refreshAccessToken() {
	if (refreshPromise) return refreshPromise;
	refreshPromise = (async () => {
		const refreshToken = getRefreshToken();
		const response = await fetch(buildUrl("/auth/refresh"), {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ refreshToken }),
		});
		const payload = await response.json().catch(() => null);
		if (!response.ok || !payload?.data?.accessToken || !payload?.data?.refreshToken) {
			logout();
			throw new Error("Sesi telah berakhir. Silakan login kembali.");
		}
		persistAuthTokens(payload.data);
		return payload.data.accessToken;
	})().finally(() => {
		refreshPromise = null;
	});
	return refreshPromise;
}

export function unwrapData(response) {
  return response?.data ?? response;
}
