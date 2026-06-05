import { API_BASE_URL } from "../config/apiConfig.js";
import { getToken } from "../utils/storage.js";

const FRIENDLY_ERROR = "Permintaan belum berhasil. Coba lagi sebentar.";

function buildUrl(endpoint) {
  const base = API_BASE_URL.replace(/\/$/, "");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

function sanitizeError(status, message) {
  const text = String(message || "").toLowerCase();
  if (status === 401) return "Silakan login untuk melanjutkan.";
  if (status === 403) return "Akun kamu tidak memiliki akses ke aksi ini.";
  if (status === 404) return "Data yang dicari tidak ditemukan.";
  if (text.includes("stok")) return "Stok produk tidak mencukupi.";
  if (text.includes("voucher")) return "Voucher tidak bisa digunakan.";
  if (text.includes("alamat")) return "Alamat pengiriman belum sesuai.";
  if (text.includes("login") || text.includes("token") || text.includes("authorization")) {
    return "Silakan login untuk melanjutkan.";
  }
  return FRIENDLY_ERROR;
}

export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(endpoint), {
    ...options,
    headers,
    body:
      options.body && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    throw new Error(sanitizeError(response.status, data?.message || data?.error));
  }

  return data;
}

export function unwrapData(response) {
  return response?.data ?? response;
}
