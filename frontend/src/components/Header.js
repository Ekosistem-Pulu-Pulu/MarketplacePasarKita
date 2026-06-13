import { escapeHtml } from "../utils/validation.js";

const navItems = [
  { href: "#/", label: "Beranda", path: "/", icon: "home" },
  { href: "#/products", label: "Katalog", path: "/products", icon: "shopping-bag" },
  { href: "#/cart", label: "Keranjang", path: "/cart", icon: "shopping-cart" },
];

function isActive(activePath, itemPath) {
  if (itemPath === "/products") return activePath.startsWith("/products");
  return activePath === itemPath;
}

export function Header({ activePath = "/", keyword = "", cartCount = 0, user = null } = {}) {
  const accountLink = user
    ? `
      <a class="nav-item ${activePath.startsWith("/orders") ? "active" : ""}" href="#/orders">
        <span data-lucide="receipt-text"></span>
        Pesanan
      </a>
      ${
        user.role === "seller"
          ? `<a class="nav-item ${activePath.startsWith("/seller") ? "active" : ""}" href="#/seller">
              <span data-lucide="store"></span>
              Seller
            </a>`
          : ""
      }
      <button class="nav-item nav-button" type="button" data-logout>
        <span data-lucide="log-out"></span>
        Keluar
      </button>
    `
    : `
      <a class="nav-item ${activePath.startsWith("/login") ? "active" : ""}" href="#/login">
        <span data-lucide="log-in"></span>
        Login
      </a>
    `;

  return `
    <header class="site-header">
      <div class="top-strip">
        <div class="shell top-strip-inner">
          <span>Belanja kebutuhan harian dari toko pilihan</span>
          <span class="top-strip-highlight">Pengiriman cepat dan pembayaran aman</span>
        </div>
      </div>

      <div class="shell nav-shell">
        <a class="brand" href="#/" aria-label="PasarKita">
          <span class="brand-mark">PK</span>
          <span class="brand-name">Pasar<span>Kita</span></span>
        </a>

        <form class="header-search" id="header-search" role="search">
          <span data-lucide="search"></span>
          <input
            name="q"
            value="${escapeHtml(keyword)}"
            autocomplete="off"
            placeholder="Cari produk, kategori, atau toko"
            aria-label="Cari produk"
          />
          <button class="btn btn-primary btn-compact" type="submit">Cari</button>
        </form>

        <nav class="desktop-nav" aria-label="Navigasi utama">
          ${navItems
            .map(
              (item) => `
                <a class="nav-item ${isActive(activePath, item.path) ? "active" : ""}" href="${item.href}" ${item.path === "/cart" ? 'id="nav-cart-link"' : ""}>
                  <span data-lucide="${item.icon}"></span>
                  ${item.label}
                  ${
                    item.path === "/cart"
                      ? `<strong class="nav-count nav-count-badge" style="display: ${cartCount ? "inline-grid" : "none"};">${cartCount}</strong>`
                      : ""
                  }
                </a>
              `
            )
            .join("")}
          ${accountLink}
        </nav>
      </div>

      <div class="shell mobile-search-shell">
        <form class="header-search" id="mobile-search" role="search">
          <span data-lucide="search"></span>
          <input
            name="q"
            value="${escapeHtml(keyword)}"
            autocomplete="off"
            placeholder="Cari produk"
            aria-label="Cari produk"
          />
          <button class="icon-button" type="submit" aria-label="Cari">
            <span data-lucide="search"></span>
          </button>
        </form>
      </div>

      <nav class="mobile-bottom-nav" aria-label="Navigasi mobile">
        ${navItems
          .map(
            (item) => `
              <a class="${isActive(activePath, item.path) ? "active" : ""}" href="${item.href}" ${item.path === "/cart" ? 'id="mobile-cart-link"' : ""}>
                <span data-lucide="${item.icon}"></span>
                <small>${item.label}</small>
                ${
                  item.path === "/cart"
                    ? `<strong class="bottom-count bottom-count-badge" style="display: ${cartCount ? "inline-grid" : "none"};">${cartCount}</strong>`
                    : ""
                }
              </a>
            `
          )
          .join("")}
        <a class="${activePath.startsWith(user ? "/orders" : "/login") ? "active" : ""}" href="#/${user ? "orders" : "login"}">
          <span data-lucide="${user ? "receipt-text" : "log-in"}"></span>
          <small>${user ? "Pesanan" : "Login"}</small>
        </a>
      </nav>
    </header>
  `;
}
