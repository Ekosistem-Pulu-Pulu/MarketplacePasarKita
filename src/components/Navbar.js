const navItems = [
  { href: "#/products", label: "Produk", match: (path) => path.startsWith("/products") },
  { href: "#/seller/products", label: "Seller Dashboard", match: (path) => path === "/seller/products" },
];

export function Navbar(currentPath = "/products") {
  return `
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" href="#/products" aria-label="PasarKita beranda produk">
          <span class="brand-mark">PK</span>
          <span class="brand-text">Pasar<span>Kita</span></span>
        </a>

        <nav class="desktop-nav" aria-label="Navigasi utama">
          ${navItems
            .map(
              (item) => `
                <a
                  class="nav-link ${item.match(currentPath) ? "active" : ""}"
                  href="${item.href}"
                >
                  ${item.label}
                </a>
              `
            )
            .join("")}
        </nav>

        <div class="topbar-actions">
          <a class="gateway-chip" href="#/products" title="Marketplace hanya membuat checkout request">
            API Gateway ready
          </a>
          <span class="user-avatar" aria-label="User demo">U</span>
        </div>
      </div>

      <nav class="mobile-nav" aria-label="Navigasi mobile">
        ${navItems
          .map(
            (item) => `
              <a class="${item.match(currentPath) ? "active" : ""}" href="${item.href}">
                ${item.label}
              </a>
            `
          )
          .join("")}
      </nav>
    </header>
  `;
}
