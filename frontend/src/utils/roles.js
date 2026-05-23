const ROLE_KEY = "pasarkita_active_role";

export const ROLE_DEFINITIONS = {
  buyer: {
    label: "Buyer",
    description: "Browse produk, simpan keranjang, checkout, dan pantau status pesanan.",
    home: "/products",
  },
  seller: {
    label: "Seller",
    description: "Kelola produk, stok, status aktif produk, dan permintaan order toko.",
    home: "/seller/products",
  },
  catalog_admin: {
    label: "Catalog Admin",
    description: "Review kualitas katalog, kategori, status produk, dan eskalasi konten.",
    home: "/admin/catalog",
  },
  customer_support: {
    label: "Customer Support",
    description: "Balas chat, tangani komplain, dan buat eskalasi refund/order.",
    home: "/support",
  },
  finance_ops: {
    label: "Finance Ops",
    description: "Pantau payment request, fee marketplace, refund, dan rekonsiliasi.",
    home: "/finance",
  },
  fulfillment_ops: {
    label: "Fulfillment Ops",
    description: "Pantau kesiapan pengiriman, resi, dan SLA operasional fulfillment.",
    home: "/fulfillment",
  },
  platform_admin: {
    label: "Platform Admin",
    description: "Kelola role, kebijakan marketplace, kategori, dan governance platform.",
    home: "/admin/platform",
  },
  tech_maintainer: {
    label: "Tech Maintainer",
    description: "Pantau health aplikasi, API gateway, error, dan konfigurasi integrasi.",
    home: "/admin/tech",
  },
};

export const ROLE_OPTIONS = Object.entries(ROLE_DEFINITIONS).map(([value, role]) => ({
  value,
  label: role.label,
}));

export function getActiveRole() {
  const stored = window.localStorage.getItem(ROLE_KEY);
  return ROLE_DEFINITIONS[stored] ? stored : "buyer";
}

export function setActiveRole(role) {
  const nextRole = ROLE_DEFINITIONS[role] ? role : "buyer";
  window.localStorage.setItem(ROLE_KEY, nextRole);
  return nextRole;
}

export function getRoleHome(role = getActiveRole()) {
  return ROLE_DEFINITIONS[role]?.home || "/products";
}

export function getRoleNavItems(role = getActiveRole()) {
  const shared = [
    { href: "#/products", label: "Produk", match: (path) => path.startsWith("/products") },
    { href: "#/cart", label: "Keranjang", match: (path) => path === "/cart" },
    { href: "#/orders", label: "Order", match: (path) => path.startsWith("/orders") },
  ];

  if (role === "seller") {
    return [
      ...shared,
      {
        href: "#/seller/products",
        label: "Seller Center",
        match: (path) => path.startsWith("/seller"),
      },
    ];
  }

  const internalNav = {
    catalog_admin: { href: "#/admin/catalog", label: "Moderasi Katalog" },
    customer_support: { href: "#/support", label: "Support Center" },
    finance_ops: { href: "#/finance", label: "Finance" },
    fulfillment_ops: { href: "#/fulfillment", label: "Fulfillment" },
    platform_admin: { href: "#/admin/platform", label: "Admin Platform" },
    tech_maintainer: { href: "#/admin/tech", label: "Tech Ops" },
  };

  const internal = internalNav[role];
  return internal
    ? [
        ...shared,
        {
          ...internal,
          match: (path) => path === internal.href.replace("#", ""),
        },
      ]
    : shared;
}
