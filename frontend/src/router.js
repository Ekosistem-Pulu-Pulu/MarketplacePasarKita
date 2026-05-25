import { bindNavbar, Navbar } from "./components/Navbar.js";
import { Loading } from "./components/Loading.js";
import { showToast } from "./components/Toast.js";
import * as ProductListPage from "./pages/ProductListPage.js";
import * as ProductDetailPage from "./pages/ProductDetailPage.js";
import * as CheckoutPage from "./pages/CheckoutPage.js";
import * as OrderStatusPage from "./pages/OrderStatusPage.js";
import * as SellerDashboardPage from "./pages/SellerDashboardPage.js";
import * as CartPage from "./pages/CartPage.js";
import * as InternalDashboardPage from "./pages/InternalDashboardPage.js";
import * as LoginPage from "./pages/LoginPage.js";
import * as RegisterPage from "./pages/RegisterPage.js";
import * as ProfilePage from "./pages/ProfilePage.js";
import * as ChatPage from "./pages/ChatPage.js";
import * as NotificationsPage from "./pages/NotificationsPage.js";
import * as StorePage from "./pages/StorePage.js";
import { getActiveRole, roleCanAccess } from "./utils/roles.js";
import { isAuthenticated } from "./utils/storage.js";

let navbarRoot;
let viewRoot;

const routes = [
  { pattern: /^\/products$/, page: ProductListPage },
  { pattern: /^\/products\/([^/]+)$/, page: ProductDetailPage, keys: ["id"] },
  { pattern: /^\/cart$/, page: CartPage },
  { pattern: /^\/login$/, page: LoginPage },
  { pattern: /^\/register$/, page: RegisterPage },
  { pattern: /^\/profile$/, page: ProfilePage, auth: true },
  { pattern: /^\/chat$/, page: ChatPage, auth: true },
  { pattern: /^\/notifications$/, page: NotificationsPage, auth: true },
  { pattern: /^\/stores$/, page: StorePage },
  { pattern: /^\/stores\/([^/]+)$/, page: StorePage, keys: ["id"] },
  { pattern: /^\/checkout$/, page: CheckoutPage, auth: true },
  { pattern: /^\/checkout\/([^/]+)$/, page: CheckoutPage, keys: ["id"], auth: true },
  { pattern: /^\/orders$/, page: OrderStatusPage, auth: true },
  { pattern: /^\/orders\/([^/]+)$/, page: OrderStatusPage, keys: ["id"], auth: true },
  { pattern: /^\/seller\/products$/, page: SellerDashboardPage, auth: true, roles: ["seller"] },
  { pattern: /^\/support$/, page: InternalDashboardPage, params: { area: "support" }, auth: true, roles: ["customer_support", "platform_admin"] },
  { pattern: /^\/finance$/, page: InternalDashboardPage, params: { area: "finance" }, auth: true, roles: ["finance_ops", "platform_admin"] },
  { pattern: /^\/fulfillment$/, page: InternalDashboardPage, params: { area: "fulfillment" }, auth: true, roles: ["fulfillment_ops", "platform_admin"] },
  { pattern: /^\/admin\/catalog$/, page: InternalDashboardPage, params: { area: "catalog" }, auth: true, roles: ["catalog_admin", "platform_admin"] },
  { pattern: /^\/admin\/platform$/, page: InternalDashboardPage, params: { area: "platform" }, auth: true, roles: ["platform_admin"] },
  { pattern: /^\/admin\/tech$/, page: InternalDashboardPage, params: { area: "tech" }, auth: true, roles: ["tech_maintainer", "platform_admin"] },
];

function parseHash() {
  const hash = window.location.hash || "#/products";
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const [path, queryString = ""] = raw.split("?");

  return {
    path: path || "/products",
    query: new URLSearchParams(queryString),
  };
}

function matchRoute(path) {
  for (const route of routes) {
    const match = path.match(route.pattern);
    if (!match) continue;

    const params = { ...(route.params || {}) };
    (route.keys || []).forEach((key, index) => {
      params[key] = decodeURIComponent(match[index + 1]);
    });

    return { route, params };
  }

  return null;
}

export function navigate(path) {
  const target = path.startsWith("#") ? path : `#${path}`;

  if (window.location.hash === target) {
    renderRoute();
    return;
  }

  window.location.hash = target;
}

export async function renderRoute() {
  const { path, query } = parseHash();
  const matched = matchRoute(path);

  navbarRoot.innerHTML = Navbar(path);
  bindNavbar({ navigate, renderRoute });

  if (!matched) {
    navigate("/products");
    return;
  }

  if (matched.route.auth && !isAuthenticated()) {
    navigate(`/login?redirect=${encodeURIComponent(path + (query.toString() ? `?${query.toString()}` : ""))}`);
    return;
  }

  if (matched.route.roles && !roleCanAccess(getActiveRole(), matched.route.roles)) {
    viewRoot.innerHTML = `
      <section class="error-state card-panel">
        <p class="eyebrow">Akses role ditolak</p>
        <h1>Role aktif tidak punya akses ke halaman ini</h1>
        <p>Login menggunakan akun dengan role yang sesuai untuk membuka dashboard ini.</p>
        <a class="primary-button" href="#/login?redirect=${encodeURIComponent(path)}">Ganti akun</a>
        <a class="secondary-button" href="#/products">Kembali ke katalog</a>
      </section>
    `;
    return;
  }

  viewRoot.innerHTML = Loading();

  try {
    viewRoot.innerHTML = await matched.route.page.render({
      params: matched.params,
      query,
    });

    matched.route.page.afterRender?.({
      params: matched.params,
      query,
      navigate,
      renderRoute,
    });

    viewRoot.focus({ preventScroll: true });
  } catch (error) {
    viewRoot.innerHTML = `
      <section class="error-state card-panel">
        <p class="eyebrow">Error state</p>
        <h1>Halaman gagal dimuat</h1>
        <p>${error.message || "Terjadi kesalahan saat memuat data."}</p>
        <button class="primary-button" type="button" id="retry-route">Coba lagi</button>
      </section>
    `;
    document.querySelector("#retry-route")?.addEventListener("click", renderRoute);
    showToast(error.message || "Gagal memuat halaman.", "error");
  }
}

export function initRouter(roots) {
  navbarRoot = roots.navbarRoot;
  viewRoot = roots.viewRoot;

  window.addEventListener("hashchange", renderRoute);

  if (!window.location.hash) {
    navigate("/products");
    return;
  }

  renderRoute();
}
