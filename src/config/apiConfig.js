export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export const USE_MOCK =
  String(import.meta.env.VITE_USE_MOCK ?? "true").toLowerCase() === "true";

export const DEFAULT_USER_ID = "USR001";
export const MARKETPLACE_FEE_RATE = 0.02;
