import { Navbar, bindNavbar } from "../components/Navbar.js";
import { Footer } from "../components/Footer.js";
import { renderIcons } from "../icons.js";
import * as home from "../pages/home.js";
import * as products from "../pages/products.js";
import * as category from "../pages/category.js";
import * as searchResults from "../pages/searchResults.js";
import * as productDetail from "../pages/productDetail.js";
import * as cart from "../pages/cart.js";
import * as checkout from "../pages/checkout.js";
import * as payment from "../pages/payment.js";
import * as orderStatus from "../pages/orderStatus.js";
import * as loginPage from "../pages/login.js";
import * as registerPage from "../pages/register.js";
import * as forgotPasswordPage from "../pages/forgotPassword.js";
import * as profile from "../pages/profile.js";
import * as sellerDashboard from "../pages/sellerDashboard.js";
import * as adminDashboard from "../pages/adminDashboard.js";
import { addToCart, getCartCountSnapshot } from "../services/cartService.js";
import { getUser, isLoggedIn, setPendingRoute } from "./storage.js";
import { isAdmin, isSeller } from "./roles.js";
import { animatePage, emptyState, skeleton, toast } from "./ui.js";

const routes = [
  { pattern: /^\/$/, page: home },
  { pattern: /^\/products$/, page: products },
  { pattern: /^\/search$/, page: searchResults },
  { pattern: /^\/category\/([^/]+)$/, page: category, keys: ["category"] },
  { pattern: /^\/product\/([^/]+)$/, page: productDetail, keys: ["id"] },
  { pattern: /^\/cart$/, page: cart },
  { pattern: /^\/checkout$/, page: checkout }, // Guest checkout tidak butuh login; legacy flow tetap memakai user address.
  { pattern: /^\/payment\/([^/]+)$/, page: payment, keys: ["id"] }, // Guest payment intent dapat diakses via tautan setelah POST /marketplace/guest/checkout.
  { pattern: /^\/orders$/, page: orderStatus }, // Guest yang baru checkout melihat pesanan dari localStorage; jika belum ada, tampilkan empty state.
  { pattern: /^\/order\/([^/]+)$/, page: orderStatus, keys: ["id"] }, // Guest dapat membuka detail order yang baru saja dibuat di browser ini via fallback orderService → localStorage.
  { pattern: /^\/login$/, page: loginPage },
  { pattern: /^\/register$/, page: registerPage },
  { pattern: /^\/forgot-password$/, page: forgotPasswordPage },
  { pattern: /^\/profile$/, page: profile, auth: true },
  { pattern: /^\/seller$/, page: sellerDashboard, auth: true },
  { pattern: /^\/admin$/, page: adminDashboard, auth: true, requireAdmin: true },
];

let viewRoot;
let headerRoot;
let footerRoot;

function parseRoute() {
  const raw = (location.hash || "#/").slice(1);
  const [path = "/", queryString = ""] = raw.split("?");
  for (const route of routes) {
    const match = path.match(route.pattern);
    if (!match) continue;
    const params = {};
    (route.keys || []).forEach((key, index) => { params[key] = decodeURIComponent(match[index + 1]); });
    return { ...route, path, params, query: new URLSearchParams(queryString) };
  }
  return { path, params: {}, query: new URLSearchParams(queryString), page: null };
}

export function navigate(path) {
  const hash = path.startsWith("#") ? path : `#${path}`;
  if (location.hash === hash) renderRoute();
  else location.hash = hash;
}

export async function renderRoute() {
  const route = parseRoute();
  document.body.dataset.route = route.path.split("/")[1] || "home";
  if (route.auth && !isLoggedIn()) {
    setPendingRoute(`${route.path}${route.query.toString() ? `?${route.query}` : ""}`);
    navigate("/login");
    return;
  }
  // Guard khusus untuk route admin: tolak buyer/seller yang mencoba akses.
  // Akun operasional hanya boleh masuk lewat /admin; akun non-admin otomatis
  // dialihkan ke dashboard masing-masing dengan notifikasi singkat.
  if (route.requireAdmin) {
    const current = getUser();
    if (!isAdmin(current?.role)) {
      toast("Halaman ini khusus akun operasional PasarKita.", "error");
      navigate(isSeller(current?.role) ? "/seller" : "/orders");
      return;
    }
  }

  const isImmersive = ["/login", "/register", "/forgot-password", "/seller", "/admin"].includes(route.path);
  headerRoot.innerHTML = isImmersive ? "" : Navbar();
  footerRoot.innerHTML = isImmersive ? "" : Footer();
  viewRoot.innerHTML = `<section class="container route-loading"><span class="spinner"></span><p>Menyiapkan pengalaman belanjamu...</p>${skeleton(4)}</section>`;
  renderIcons();

  await new Promise((resolve) => setTimeout(resolve, 120));
  if (!route.page) {
    viewRoot.innerHTML = `<section class="container page-space">${emptyState({ icon: "map", title: "Halaman tidak ditemukan", message: "Alamat yang kamu buka belum tersedia.", action: `<a class="btn btn-primary" href="#/">Kembali ke Home</a>` })}</section>`;
  } else {
    try {
      viewRoot.innerHTML = await route.page.render(route);
    } catch (error) {
      if (error.status === 401) {
        setPendingRoute(route.path);
        toast("Sesi login berakhir. Silakan masuk kembali.", "error");
        navigate("/login");
        return;
      }
      toast(error.message || "Halaman belum dapat dimuat.", "error");
      viewRoot.innerHTML = `<section class="container page-space">${emptyState({ icon: "wifi", title: "Halaman belum dapat dimuat", message: error.message || "Terjadi kendala saat mengambil data.", action: `<button class="btn btn-primary" type="button" data-retry-route>Coba Lagi</button>` })}</section>`;
    }
  }

  renderIcons();
  bindNavbar(navigate);
  viewRoot.querySelector("[data-retry-route]")?.addEventListener("click", renderRoute);
  await route.page?.afterRender?.({ ...route, route, navigate, renderRoute, refreshIcons: renderIcons, user: getUser() });
  renderIcons();
  animatePage(viewRoot);
  window.scrollTo({ top: 0, behavior: "instant" });
}

export function initRouter(roots) {
  ({ viewRoot, headerRoot, footerRoot } = roots);
  viewRoot.addEventListener("click", async (event) => {
    const addButton = event.target.closest("[data-add-cart]");
    if (addButton) {
      event.preventDefault();
      event.stopPropagation();
      // Guest checkout: cartService.addToCart menulis ke localStorage jika
      // user belum login. Tidak perlu redirect ke /login lagi.
      try {
        await addToCart(addButton.dataset.addCart);
        toast(isLoggedIn() ? "Produk berhasil ditambahkan ke keranjang." : "Ditambahkan ke keranjang tamu. Checkout bisa tanpa login.");
      } catch (error) {
        toast(error.message || "Gagal menambahkan produk ke keranjang.", "error");
      }
      return;
    }
    const wishlistButton = event.target.closest(".wishlist-button, .wishlist-float");
    if (wishlistButton) {
      event.preventDefault();
      event.stopPropagation();
      wishlistButton.classList.toggle("active");
      toast(wishlistButton.classList.contains("active") ? "Produk disimpan ke wishlist." : "Produk dihapus dari wishlist.", "info");
    }
  });
  window.addEventListener("hashchange", renderRoute);
  window.addEventListener("pasarkita:state", () => {
    document.querySelectorAll("#cart-badge, .mobile-nav b").forEach((badge) => {
      badge.textContent = getCartCountSnapshot();
    });
  });
  window.addEventListener("pasarkita:cart-updated", () => {
    document.querySelectorAll("#cart-badge, .mobile-nav b, .mobile-cart-button b").forEach((badge) => {
      badge.textContent = getCartCountSnapshot();
    });
  });
  if (!location.hash) location.hash = "#/";
  else renderRoute();
}
