import { apiRequest } from "./client.js";

export async function registerAccount(payload) {
  return apiRequest("/account/register", {
    method: "POST",
    body: payload,
  });
}

export async function getProfile() {
  return apiRequest("/account/me");
}

export async function updateProfile(payload) {
  return apiRequest("/account/me", {
    method: "PATCH",
    body: payload,
  });
}

export async function listAddresses() {
  return apiRequest("/account/addresses");
}

export async function saveAddress(payload) {
  return apiRequest("/account/addresses", {
    method: "POST",
    body: payload,
  });
}
