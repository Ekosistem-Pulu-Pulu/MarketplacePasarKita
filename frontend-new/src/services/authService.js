import { getUser, login, logout, register } from "../utils/storage.js";

export async function loginUser(payload) {
  return login(payload.email);
}

export async function registerUser(payload) {
  return register(payload);
}

export async function logoutUser() {
  logout();
}

export async function getCurrentUser() {
  return getUser();
}
