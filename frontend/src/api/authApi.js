import { apiRequest } from "./client.js";

export async function login(email, password) {
  const response = await apiRequest("/auth/login", {
    method: "POST",
    body: {
      email,
      password,
    },
  });

  return response.data;
}

export async function getMe() {
  const response = await apiRequest("/auth/me");
  return response.data;
}

export async function getDemoUsers() {
  const response = await apiRequest("/auth/demo-users");
  return response.data;
}
