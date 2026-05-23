import { getCartCount } from "../utils/cart.js";
import {
  getActiveRole,
  getRoleHome,
  getRoleNavItems,
  ROLE_DEFINITIONS,
  ROLE_OPTIONS,
  setActiveRole,
} from "../utils/roles.js";
import { escapeHtml } from "../utils/validation.js";

export function Navbar(currentPath = "/products") {
  const activeRole = getActiveRole();
  const role = ROLE_DEFINITIONS[activeRole];
  const navItems = getRoleNavItems(activeRole);
  const cartCount = getCartCount();

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

        <form class="nav-search-main" id="navbar-search-form" role="search">
          <input name="keyword" placeholder="Cari di PasarKita" aria-label="Cari produk" />
          <button class="primary-button small" type="submit">Cari</button>
        </form>

        <div class="topbar-actions">
          <a class="cart-link" href="#/cart" aria-label="Keranjang belanja">
            Keranjang
            <span>${cartCount}</span>
          </a>
          <label class="role-switcher">
            <span>Role</span>
            <select id="role-switcher" aria-label="Pilih role aktif">
              ${ROLE_OPTIONS.map(
                (option) => `
                  <option value="${option.value}" ${option.value === activeRole ? "selected" : ""}>
                    ${option.label}
                  </option>
                `
              ).join("")}
            </select>
          </label>
          <a class="gateway-chip" href="#${getRoleHome(activeRole)}" title="${escapeHtml(role.description)}">
            ${escapeHtml(role.label)}
          </a>
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

export function bindNavbar({ navigate, renderRoute }) {
  document.querySelector("#navbar-search-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const keyword = String(new FormData(event.currentTarget).get("keyword") || "").trim();
    navigate(keyword ? `/products?keyword=${encodeURIComponent(keyword)}` : "/products");
  });

  document.querySelector("#role-switcher")?.addEventListener("change", (event) => {
    const nextRole = setActiveRole(event.currentTarget.value);
    navigate(getRoleHome(nextRole));
    renderRoute();
  });
}
