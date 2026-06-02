import { isAuthenticated, getCurrentUser } from "../utils/storage.js";

export function requireAuth(path) {
  if (isAuthenticated()) return null;
  return `/login?redirect=${encodeURIComponent(path)}`;
}

export function requireRole(path, roles = []) {
  const authRedirect = requireAuth(path);
  if (authRedirect) return authRedirect;
  const user = getCurrentUser();
  if (!roles.length || roles.includes(user?.role)) return null;
  return "/products";
}
