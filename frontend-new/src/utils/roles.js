// === Single source of truth untuk role PasarKita di FE ===
// Backend mendefinisikan 8 role di backend/models/models.go (RoleBuyer …
// RoleTechMaintainer). FE hanya mengetahui buyer/seller secara historis;
// helper di sini dipakai lintas halaman/shell agar tiap role punya
// pengalaman yang konsisten (admin tidak lagi diperlakukan sebagai buyer).

export const ROLE = Object.freeze({
  BUYER: "buyer",
  SELLER: "seller",
  CATALOG_ADMIN: "catalog_admin",
  CUSTOMER_SUPPORT: "customer_support",
  FINANCE_OPS: "finance_ops",
  FULFILLMENT_OPS: "fulfillment_ops",
  PLATFORM_ADMIN: "platform_admin",
  TECH_MAINTAINER: "tech_maintainer",
});

const ADMIN_ROLES = [
  ROLE.CATALOG_ADMIN,
  ROLE.CUSTOMER_SUPPORT,
  ROLE.FINANCE_OPS,
  ROLE.FULFILLMENT_OPS,
  ROLE.PLATFORM_ADMIN,
  ROLE.TECH_MAINTAINER,
];

// Pemetaan role → label Indonesia singkat untuk badge/akun.
export const ROLE_LABELS = Object.freeze({
  [ROLE.BUYER]: "Pembeli",
  [ROLE.SELLER]: "Seller",
  [ROLE.CATALOG_ADMIN]: "Catalog Admin",
  [ROLE.CUSTOMER_SUPPORT]: "Customer Support",
  [ROLE.FINANCE_OPS]: "Finance Ops",
  [ROLE.FULFILLMENT_OPS]: "Fulfillment Ops",
  [ROLE.PLATFORM_ADMIN]: "Platform Admin",
  [ROLE.TECH_MAINTAINER]: "Tech Maintainer",
});

export function isAdmin(role) {
  return typeof role === "string" && ADMIN_ROLES.includes(role);
}

export function isBuyer(role) {
  return role === ROLE.BUYER;
}

export function isSeller(role) {
  return role === ROLE.SELLER;
}

// Tentukan tujuan dashboard shortcut untuk user berdasarkan role.
// Buyer → /orders, Seller → /seller, Admin → /admin, guest → /login.
export function dashboardHref(user) {
  if (!user) return "#/login";
  if (isSeller(user.role)) return "#/seller";
  if (isAdmin(user.role)) return "#/admin";
  return "#/orders";
}

export function dashboardLabel(user) {
  if (!user) return "Masuk";
  if (isSeller(user.role)) return "Dashboard Seller";
  if (isAdmin(user.role)) return "Dashboard Admin";
  return "Pesanan Saya";
}

// Label akun yang ditampilkan di profile (Tipe akun).
export function accountTypeLabel(role) {
  return ROLE_LABELS[role] || (role ? role : "—");
}

// Daftar role yang punya akses ke /admin (semua admin + seller/buyer
// secara eksplisit tidak termasuk — guard ada di router).
export const ADMIN_ROLE_SET = new Set(ADMIN_ROLES);
