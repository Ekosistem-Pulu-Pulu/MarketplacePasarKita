import { apiRequest, unwrapData } from "./client.js";

export async function login(email, password) {
  return unwrapData(await apiRequest("/auth/login", {
    method: "POST",
    body: { email, password },
  }));
}

export async function register(payload) {
  return unwrapData(await apiRequest("/account/register", {
    method: "POST",
    body: payload,
  }));
}

export async function getMe() {
  return unwrapData(await apiRequest("/account/me"));
}

export async function updateMe(payload) {
  return unwrapData(await apiRequest("/account/me", { method: "PATCH", body: payload }));
}

export async function getAddresses() {
  return unwrapData(await apiRequest("/account/addresses"));
}

export async function saveAddress(payload) {
  return unwrapData(await apiRequest("/account/addresses", { method: "POST", body: payload }));
}
