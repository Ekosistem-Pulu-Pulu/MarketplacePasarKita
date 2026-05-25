import { getCartCount } from "../utils/cart.js";
import {
  getActiveRole,
  getRoleHome,
  getRoleNavItems,
  ROLE_DEFINITIONS,
  ROLE_OPTIONS,
  setActiveRole,
} from "../utils/roles.js";
import { getCurrentUser, isAuthenticated, logout } from "../utils/storage.js";
import { escapeHtml } from "../utils/validation.js";

export function Navbar(currentPath = "/products") {
  const activeRole = getActiveRole();
  const role = ROLE_DEFINITIONS[activeRole];
  const navItems = getRoleNavItems(activeRole);
  const cartCount = getCartCount();
  const user = getCurrentUser();
  const loggedIn = isAuthenticated();

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
          ${
            loggedIn
              ? `
                <span class="session-chip" title="${escapeHtml(user.email)}">
                  ${escapeHtml(user.name)}
                </span>
                <a class="text-button" href="#/notifications">Notif</a>
                <a class="text-button" href="#/profile">Profil</a>
                <button class="text-button" type="button" id="logout-button">Logout</button>
              `
              : `
                <a class="secondary-button small" href="#/login">Login</a>
                <a class="text-button" href="#/register">Daftar</a>
                <label class="role-switcher">
                  <span>Preview</span>
                  <select id="role-switcher" aria-label="Pilih preview role">
                    ${ROLE_OPTIONS.map(
                      (option) => `
                        <option value="${option.value}" ${option.value === activeRole ? "selected" : ""}>
                          ${option.label}
                        </option>
                      `
                    ).join("")}
                  </select>
                </label>
              `
          }
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
        ${
          loggedIn
            ? `<button type="button" id="mobile-logout-button">Logout</button>`
            : `<a class="${currentPath === "/login" ? "active" : ""}" href="#/login">Login</a>`
        }
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

  document.querySelector("#logout-button")?.addEventListener("click", () => {
    logout();
    navigate("/products");
    renderRoute();
  });

  document.querySelector("#mobile-logout-button")?.addEventListener("click", () => {
    logout();
    navigate("/products");
    renderRoute();
  });
}
