import { getCategories } from "../services/categoryService.js";
import { getProducts } from "../services/productService.js";
import { getStores } from "../services/storeService.js";
import { ProductGrid } from "../components/ProductGrid.js";
import { CategoryCard } from "../components/CategoryCard.js";
import { formatNumber } from "../utils/formatCurrency.js";

export async function render() {
  const [products, stores, categories] = await Promise.all([getProducts(), getStores(), getCategories()]);
  const recommended = products.filter((product) => product.featured).slice(0, 8);
  const bestSelling = [...products].sort((a, b) => b.sold - a.sold).slice(0, 6);
  const flashSale = products.filter((product) => product.discount >= 15).slice(0, 5);

  return `
    <section class="hero-section">
      <div class="container hero-grid">
        <article class="hero-copy">
          <span class="eyebrow light"><span data-lucide="sparkles"></span> Belanja cerdas, hidup lebih mudah</span>
          <h1>Temukan yang kamu butuhkan, <em>semuanya dekat.</em></h1>
          <p>Jelajahi ribuan produk pilihan dari seller terpercaya dan nikmati pengalaman belanja yang cepat, aman, dan nyaman.</p>
          <form class="hero-search" id="hero-search">
            <span data-lucide="search"></span><input name="q" placeholder="Mau cari apa hari ini?" /><button class="btn btn-accent">Cari Produk</button>
          </form>
          <div class="hero-trust"><span><b>30+</b> produk aktif</span><span><b>8</b> kategori</span><span><b>100%</b> transaksi aman</span></div>
        </article>
        <aside class="hero-visual">
          <div class="hero-orb"></div>
          <div class="hero-image-frame">
            <img src="${products[1]?.image || products[0]?.image}" alt="Produk unggulan PasarKita" />
          </div>
          <div class="floating-card float-top"><span data-lucide="shield-check"></span><div><strong>Pembayaran Aman</strong><small>Dilindungi PasarKita</small></div></div>
          <div class="floating-card float-bottom"><span data-lucide="truck"></span><div><strong>Gratis Ongkir</strong><small>Min. belanja Rp100rb</small></div></div>
        </aside>
      </div>
    </section>

    <section class="container promo-strip">
      <a href="#/products?sort=sold" class="promo-tile promo-blue"><span data-lucide="badge-percent"></span><div><small>PROMO HARI INI</small><strong>Diskon sampai 30%</strong><span>Belanja sekarang <i data-lucide="arrow-right"></i></span></div></a>
      <a href="#/category/elektronik" class="promo-tile promo-purple"><span data-lucide="smartphone"></span><div><small>GADGET PILIHAN</small><strong>Upgrade makin hemat</strong><span>Lihat koleksi <i data-lucide="arrow-right"></i></span></div></a>
      <a href="#/category/rumah-tangga" class="promo-tile promo-orange"><span data-lucide="house"></span><div><small>RUMAH NYAMAN</small><strong>Mulai dari Rp39 ribu</strong><span>Jelajahi <i data-lucide="arrow-right"></i></span></div></a>
    </section>

    <section class="container section-block">
      <div class="section-heading"><div><span class="eyebrow">Pilih sesuai kebutuhan</span><h2>Kategori populer</h2></div><a href="#/products">Lihat semua <span data-lucide="arrow-right"></span></a></div>
      <div class="category-grid">
        ${categories.map((category) => CategoryCard(category, products.filter((product) => product.categoryId === category.id).length)).join("")}
      </div>
    </section>

    <section class="container flash-section">
      <div class="flash-heading">
        <div><span class="flash-icon"><span data-lucide="zap"></span></span><div><span class="eyebrow light">Promo terbatas</span><h2>Flash Sale Hari Ini</h2></div></div>
        <div class="countdown"><span>Berakhir dalam</span><b id="countdown-hours">05</b>:<b id="countdown-minutes">24</b>:<b id="countdown-seconds">18</b></div>
        <a href="#/products?sort=price-low">Lihat semua <span data-lucide="arrow-right"></span></a>
      </div>
      ${ProductGrid(flashSale, true)}
    </section>

    <section class="container section-block">
      <div class="section-heading"><div><span class="eyebrow">Khusus untukmu</span><h2>Rekomendasi pilihan</h2><p>Produk terkurasi berdasarkan tren belanja minggu ini.</p></div><a href="#/products">Eksplor katalog <span data-lucide="arrow-right"></span></a></div>
      ${ProductGrid(recommended)}
    </section>

    <section class="container section-block">
      <div class="section-heading"><div><span class="eyebrow">Dipercaya pembeli</span><h2>Toko pilihan PasarKita</h2></div></div>
      <div class="store-grid">
        ${stores.slice(0, 4).map((store) => `
          <article class="store-card">
            <div class="store-avatar">${store.initials}</div>
            <div><span class="store-badge"><span data-lucide="badge-check"></span>${store.badge}</span><h3>${store.name}</h3><p>${store.location} · ${store.products} produk</p><span class="store-rating"><span data-lucide="star"></span>${store.rating} rating</span></div>
            <a class="btn btn-secondary" href="#/search?q=${encodeURIComponent(store.name)}">Kunjungi</a>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="container section-block">
      <div class="section-heading"><div><span class="eyebrow">Paling diminati</span><h2>Produk terlaris minggu ini</h2><p>Lebih dari ${formatNumber(bestSelling.reduce((total, product) => total + product.sold, 0))} produk telah terjual.</p></div><a href="#/products?sort=sold">Lihat semua <span data-lucide="arrow-right"></span></a></div>
      ${ProductGrid(bestSelling)}
    </section>

    <section class="container app-banner">
      <div><span class="eyebrow light">PasarKita Plus</span><h2>Belanja makin untung setiap hari.</h2><p>Kumpulkan poin, dapatkan voucher eksklusif, dan nikmati layanan prioritas dalam satu pengalaman.</p><a class="btn btn-accent" href="#/register">Gabung Sekarang</a></div>
      <div class="app-stats"><span><b>4.9/5</b><small>Rating Pengguna</small></span><span><b>24/7</b><small>Bantuan Pelanggan</small></span><span><b>7 Hari</b><small>Garansi Retur</small></span></div>
    </section>
  `;
}

export function afterRender({ navigate }) {
  document.querySelector("#hero-search")?.addEventListener("submit", (event) => {
    event.preventDefault();
    navigate(`/search?q=${encodeURIComponent(new FormData(event.currentTarget).get("q") || "")}`);
  });

  let remaining = 5 * 3600 + 24 * 60 + 18;
  const timer = setInterval(() => {
    if (!document.querySelector("#countdown-seconds")) return clearInterval(timer);
    remaining = Math.max(0, remaining - 1);
    document.querySelector("#countdown-hours").textContent = String(Math.floor(remaining / 3600)).padStart(2, "0");
    document.querySelector("#countdown-minutes").textContent = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
    document.querySelector("#countdown-seconds").textContent = String(remaining % 60).padStart(2, "0");
  }, 1000);
}
