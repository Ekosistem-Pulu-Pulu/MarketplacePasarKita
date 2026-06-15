import { categories } from "../data/categories.js";
import { products } from "../data/products.js";
import { getCartCount, getUser, logout } from "../utils/storage.js";
import { escapeHtml, toast } from "../utils/ui.js";

export function header() {
  const user = getUser();
  const suggestions = products.slice(0, 5);
  return `
    <div class="announcement">
      <div class="container announcement-inner">
        <span><span data-lucide="sparkles"></span> Gratis ongkir untuk transaksi pertamamu</span>
        <div><a href="#/seller">Mulai Berjualan</a><a href="#/orders">Lacak Pesanan</a><span>Bantuan</span></div>
      </div>
    </div>
    <header class="site-header">
      <div class="container nav-main">
        <a class="brand" href="#/" aria-label="PasarKita">
          <span class="brand-mark"><span data-lucide="shopping-bag"></span></span>
          <span>Pasar<span>Kita</span></span>
        </a>
        <div class="mobile-header-actions">
          <a class="mobile-cart-button" href="#/cart" aria-label="Keranjang"><span data-lucide="shopping-cart"></span><b>${getCartCount()}</b></a>
          <button class="mobile-menu-button" id="mobile-menu-button" type="button" aria-expanded="false" aria-controls="mobile-category-drawer" aria-label="Buka menu"><span data-lucide="menu"></span></button>
        </div>
        <a class="category-trigger" href="#/products"><span data-lucide="layout-grid"></span>Kategori</a>
        <form class="global-search" id="global-search">
          <span data-lucide="search"></span>
          <input name="q" autocomplete="off" placeholder="Cari produk, kategori, atau toko..." />
          <kbd>Enter</kbd>
          <div class="search-suggestions" id="search-suggestions">
            <small>Pencarian populer</small>
            ${suggestions.map((item) => `<a href="#/product/${item.id}"><img src="${item.image}" alt="" /><span>${escapeHtml(item.name)}</span></a>`).join("")}
          </div>
        </form>
        <nav class="nav-actions">
          <a class="nav-icon" href="#/orders" aria-label="Pesanan"><span data-lucide="receipt-text"></span></a>
          <a class="nav-icon" href="#/cart" aria-label="Keranjang"><span data-lucide="shopping-cart"></span><b id="cart-badge">${getCartCount()}</b></a>
          ${user ? `
            <button class="profile-trigger" id="profile-trigger"><span class="avatar">${escapeHtml(user.avatar)}</span><span><small>Halo,</small>${escapeHtml(user.name.split(" ")[0])}</span><span data-lucide="chevron-down"></span></button>
            <div class="profile-menu" id="profile-menu">
              <a href="#/profile"><span data-lucide="user"></span>Profil Saya</a>
              <a href="#/orders"><span data-lucide="package"></span>Pesanan Saya</a>
              <a href="#/seller"><span data-lucide="store"></span>Dashboard Seller</a>
              <button id="logout-button"><span data-lucide="log-out"></span>Keluar</button>
            </div>
          ` : `<div class="auth-actions"><a class="btn btn-ghost" href="#/login">Masuk</a><a class="btn btn-primary" href="#/register">Daftar</a></div>`}
        </nav>
      </div>
      <div class="container quick-links">
        <span>Populer:</span>
        ${categories.slice(0, 6).map((category) => `<a href="#/category/${category.id}">${category.name}</a>`).join("")}
      </div>
    </header>
    <div class="mobile-drawer-backdrop" id="mobile-drawer-backdrop"></div>
    <aside class="mobile-category-drawer" id="mobile-category-drawer" aria-label="Menu marketplace">
      <div class="mobile-drawer-heading">
        <div><span class="eyebrow">Jelajahi</span><strong>Menu PasarKita</strong></div>
        <button id="mobile-menu-close" type="button" aria-label="Tutup menu"><span data-lucide="x"></span></button>
      </div>
      <div class="mobile-drawer-categories">
        ${categories.map((category) => `<a href="#/category/${category.id}"><span data-lucide="${category.icon}"></span><span>${category.name}</span><span data-lucide="chevron-right"></span></a>`).join("")}
      </div>
      <div class="mobile-drawer-links">
        <a href="#/orders"><span data-lucide="receipt-text"></span>Pesanan Saya</a>
        <a href="#/seller"><span data-lucide="store"></span>Dashboard Seller</a>
        <a href="${user ? "#/profile" : "#/login"}"><span data-lucide="user"></span>${user ? "Profil Saya" : "Masuk ke Akun"}</a>
      </div>
    </aside>
    <nav class="mobile-nav">
      <a href="#/"><span data-lucide="home"></span><small>Home</small></a>
      <a href="#/products"><span data-lucide="layout-grid"></span><small>Produk</small></a>
      <a href="#/cart"><span data-lucide="shopping-cart"></span><small>Cart</small><b>${getCartCount()}</b></a>
      <a href="#/orders"><span data-lucide="receipt-text"></span><small>Pesanan</small></a>
      <a href="${user ? "#/profile" : "#/login"}"><span data-lucide="user"></span><small>Akun</small></a>
    </nav>
  `;
}

export function footer() {
  return `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div><a class="brand footer-brand" href="#/"><span class="brand-mark"><span data-lucide="shopping-bag"></span></span><span>Pasar<span>Kita</span></span></a><p>Tempat belanja cerdas untuk menemukan produk pilihan dari berbagai penjuru Indonesia.</p></div>
        <div><h4>Jelajahi</h4><a href="#/products">Semua Produk</a><a href="#/orders">Pesanan Saya</a><a href="#/seller">Pusat Seller</a></div>
        <div><h4>Bantuan</h4><a href="#/profile">Pengaturan Akun</a><a href="#/cart">Keranjang</a><span>Pusat Resolusi</span></div>
        <div class="trust-card"><span data-lucide="shield-check"></span><div><strong>Belanja lebih tenang</strong><p>Pembayaran aman dan perlindungan transaksi untuk setiap pesanan.</p></div></div>
      </div>
      <div class="container footer-bottom"><span>&copy; 2026 PasarKita. Frontend demo MVP.</span><span>Dibuat untuk presentasi produk.</span></div>
    </footer>
  `;
}

export function bindShell(navigate) {
  const search = document.querySelector("#global-search");
  const suggestions = document.querySelector("#search-suggestions");
  const searchInput = search?.querySelector("input");
  searchInput?.addEventListener("input", (event) => {
    const query = event.target.value.trim().toLowerCase();
    suggestions.classList.toggle("open", query.length > 0);
    const matches = products.filter((product) => product.name.toLowerCase().includes(query)).slice(0, 5);
    suggestions.innerHTML = matches.length
      ? `<small>Produk ditemukan</small>${matches.map((item) => `<a href="#/product/${item.id}"><img src="${item.image}" alt="" /><span>${escapeHtml(item.name)}</span></a>`).join("")}`
      : `<small>Tidak ada produk yang cocok</small>`;
  });
  search?.addEventListener("submit", (event) => {
    event.preventDefault();
    navigate(`/search?q=${encodeURIComponent(new FormData(search).get("q") || "")}`);
  });
  searchInput?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchInput.value)}`);
  });
  document.querySelector("#profile-trigger")?.addEventListener("click", () => document.querySelector("#profile-menu")?.classList.toggle("open"));
  const drawer = document.querySelector("#mobile-category-drawer");
  const drawerButton = document.querySelector("#mobile-menu-button");
  const drawerBackdrop = document.querySelector("#mobile-drawer-backdrop");
  const closeDrawer = () => {
    drawer?.classList.remove("is-open");
    drawerBackdrop?.classList.remove("is-open");
    drawerButton?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("drawer-open");
  };
  const openDrawer = () => {
    drawer?.classList.add("is-open");
    drawerBackdrop?.classList.add("is-open");
    drawerButton?.setAttribute("aria-expanded", "true");
    document.body.classList.add("drawer-open");
  };
  drawerButton?.addEventListener("click", openDrawer);
  document.querySelector("#mobile-menu-close")?.addEventListener("click", closeDrawer);
  drawerBackdrop?.addEventListener("click", closeDrawer);
  drawer?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeDrawer));
  document.querySelector("#logout-button")?.addEventListener("click", () => {
    logout();
    toast("Kamu berhasil keluar.", "info");
    navigate("/");
  });
}
