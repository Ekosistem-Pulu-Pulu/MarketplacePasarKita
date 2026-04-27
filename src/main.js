import "./styles/style.css";

const MARKETPLACE_FEE_RATE = 0.02;
const CART_STORAGE_KEY = "pasarkita_cart";
const ORDERS_STORAGE_KEY = "pasarkita_orders";
const SESSION_STORAGE_KEY = "pasarkita_session";
const PRODUCT_PAGE_SIZE = 6;
const LOW_STOCK_THRESHOLD = 6;

const ORDER_FLOW = [
  "DRAFT",
  "PENDING_PAYMENT",
  "PAYMENT_PROCESSING",
  "PAID",
  "READY_FOR_SHIPMENT",
  "SHIPPED",
  "COMPLETED",
];

const ORDER_STATUS_LABELS = {
  DRAFT: "Draft",
  PENDING_PAYMENT: "Menunggu Pembayaran",
  PAYMENT_PROCESSING: "Pembayaran Diproses",
  PAID: "Dibayar",
  PAYMENT_FAILED: "Pembayaran Gagal",
  READY_FOR_SHIPMENT: "Siap Dikirim",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const ROLE_PROFILES = {
  buyer: {
    label: "Pembeli",
    name: "Ayu Pembeli",
    description: "Belanja produk UMKM, cek cart, checkout, dan pantau status order.",
  },
  seller: {
    label: "Penjual",
    name: "Raka Seller",
    description: "Kelola katalog produk, stok, status produk, dan profil toko.",
  },
  admin: {
    label: "Admin Marketplace",
    name: "Nadia Admin",
    description: "Pantau aktivitas marketplace, katalog, order mock, dan revenue fee platform.",
  },
};

const SELLER_PROFILES = {
  SELLER001: {
    name: "Warung Rejeki",
    location: "Bandung, Jawa Barat",
    rating: 4.8,
    description: "Toko UMKM rumahan yang fokus pada makanan ringan, sambal, dan produk harian lokal.",
  },
  SELLER002: {
    name: "Bambu Lestari",
    location: "Yogyakarta",
    rating: 4.7,
    description: "Pengrajin lokal dengan produk anyaman dan aksesori handmade berbahan natural.",
  },
  SELLER003: {
    name: "Batik Laras",
    location: "Pekalongan, Jawa Tengah",
    rating: 4.9,
    description: "Toko batik tulis dan fashion lokal dengan motif modern untuk kebutuhan harian.",
  },
  SELLER004: {
    name: "Dapur Nusantara",
    location: "Manado, Sulawesi Utara",
    rating: 4.6,
    description: "Produsen kuliner nusantara dengan rasa kuat dan kemasan siap kirim.",
  },
  SELLER005: {
    name: "Karya Kulit Kita",
    location: "Garut, Jawa Barat",
    rating: 4.5,
    description: "UMKM produk kulit sintetis dan aksesori fungsional untuk pasar lokal.",
  },
  SELLER006: {
    name: "Gayo Brew",
    location: "Aceh Tengah, Aceh",
    rating: 4.8,
    description: "Toko kopi lokal dari dataran tinggi Gayo dengan pilihan roast ringan.",
  },
  SELLER007: {
    name: "Sehat Alami",
    location: "Bogor, Jawa Barat",
    rating: 4.7,
    description: "Produk kesehatan rumahan seperti madu, minyak herbal, dan kebutuhan wellness.",
  },
  SELLER008: {
    name: "Kain Kota",
    location: "Jakarta",
    rating: 4.4,
    description: "Brand fashion lokal dengan produk katun simpel dan harga terjangkau.",
  },
  SELLER009: {
    name: "Snack Sehat",
    location: "Malang, Jawa Timur",
    rating: 4.6,
    description: "Camilan sehat produksi kecil untuk sarapan, bekal, dan konsumsi harian.",
  },
  SELLER010: {
    name: "Kebun Sari",
    location: "Wonosobo, Jawa Tengah",
    rating: 4.5,
    description: "Produk kebun kering dan minuman herbal dari petani lokal.",
  },
};

const app = document.querySelector("#app");

const initialProducts = [
  {
    id: "P001",
    name: "Keripik Tempe Renyah",
    category: "Makanan",
    price: 15000,
    stock: 45,
    desc: "Keripik tempe gurih dan renyah dibuat dengan kedelai pilihan.",
    status: "aktif",
    sellerId: "SELLER001",
    sellerName: "Warung Rejeki",
    createdAt: "2026-04-20T09:00:00.000Z",
  },
  {
    id: "P002",
    name: "Tas Anyaman Bambu",
    category: "Kerajinan",
    price: 85000,
    stock: 12,
    desc: "Tas anyaman bambu handmade cocok untuk belanja atau piknik.",
    status: "aktif",
    sellerId: "SELLER002",
    sellerName: "Bambu Lestari",
    createdAt: "2026-04-21T11:30:00.000Z",
  },
  {
    id: "P003",
    name: "Kemeja Batik Tulis",
    category: "Fashion",
    price: 250000,
    stock: 0,
    desc: "Batik tulis asli Pekalongan dengan motif modern.",
    status: "stok-habis",
    sellerId: "SELLER003",
    sellerName: "Batik Laras",
    createdAt: "2026-04-18T08:15:00.000Z",
  },
  {
    id: "P004",
    name: "Sambal Roa Pedas",
    category: "Makanan",
    price: 35000,
    stock: 20,
    desc: "Sambal ikan roa khas Manado pedas mantap.",
    status: "aktif",
    sellerId: "SELLER004",
    sellerName: "Dapur Nusantara",
    createdAt: "2026-04-22T10:45:00.000Z",
  },
  {
    id: "P005",
    name: "Dompet Kulit Sintetis",
    category: "Fashion",
    price: 65000,
    stock: 5,
    desc: "Dompet pria elegan dengan banyak slot kartu.",
    status: "nonaktif",
    sellerId: "SELLER005",
    sellerName: "Karya Kulit Kita",
    createdAt: "2026-04-17T14:20:00.000Z",
  },
  {
    id: "P006",
    name: "Kopi Arabika Gayo",
    category: "Minuman",
    price: 28000,
    stock: 28,
    desc: "Kopi lokal kemasan 200 gram dengan aroma cokelat dan rempah.",
    status: "aktif",
    sellerId: "SELLER006",
    sellerName: "Gayo Brew",
    createdAt: "2026-04-23T07:30:00.000Z",
  },
  {
    id: "P007",
    name: "Madu Hutan Murni",
    category: "Kesehatan",
    price: 85000,
    stock: 4,
    desc: "Madu hutan asli dengan rasa ringan dan cocok untuk konsumsi harian.",
    status: "aktif",
    sellerId: "SELLER007",
    sellerName: "Sehat Alami",
    createdAt: "2026-04-24T08:00:00.000Z",
  },
  {
    id: "P008",
    name: "Gelang Manik Handmade",
    category: "Kerajinan",
    price: 22000,
    stock: 18,
    desc: "Gelang manik warna natural, dibuat manual oleh pengrajin lokal.",
    status: "aktif",
    sellerId: "SELLER002",
    sellerName: "Bambu Lestari",
    createdAt: "2026-04-24T13:10:00.000Z",
  },
  {
    id: "P009",
    name: "Kaos Katun Lokal",
    category: "Fashion",
    price: 79000,
    stock: 31,
    desc: "Kaos katun lembut dengan sablon sederhana bertema UMKM lokal.",
    status: "aktif",
    sellerId: "SELLER008",
    sellerName: "Kain Kota",
    createdAt: "2026-04-25T09:40:00.000Z",
  },
  {
    id: "P010",
    name: "Granola Pisang Cokelat",
    category: "Makanan",
    price: 42000,
    stock: 6,
    desc: "Granola renyah dengan pisang kering dan cokelat, cocok untuk sarapan.",
    status: "aktif",
    sellerId: "SELLER009",
    sellerName: "Snack Sehat",
    createdAt: "2026-04-25T16:45:00.000Z",
  },
  {
    id: "P011",
    name: "Teh Rosella Kering",
    category: "Minuman",
    price: 32000,
    stock: 16,
    desc: "Teh rosella kering dengan warna merah alami dan rasa asam segar.",
    status: "aktif",
    sellerId: "SELLER010",
    sellerName: "Kebun Sari",
    createdAt: "2026-04-26T07:20:00.000Z",
  },
  {
    id: "P012",
    name: "Minyak Kayu Putih Roll On",
    category: "Kesehatan",
    price: 18000,
    stock: 3,
    desc: "Minyak kayu putih praktis ukuran travel untuk penggunaan harian.",
    status: "aktif",
    sellerId: "SELLER007",
    sellerName: "Sehat Alami",
    createdAt: "2026-04-26T12:35:00.000Z",
  },
];

const state = {
  selectedProductId: null,
  selectedSellerId: null,
  checkoutSession: null,
  productVisibleCount: PRODUCT_PAGE_SIZE,
  products: [...initialProducts],
  cart: loadStorage(CART_STORAGE_KEY, []),
  orders: loadStorage(ORDERS_STORAGE_KEY, []),
  currentUser: loadStorage(SESSION_STORAGE_KEY, null),
};

const formatRp = (num) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(num) || 0);

function loadStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function saveCart() {
  saveStorage(CART_STORAGE_KEY, state.cart);
  updateCartCount();
}

function saveOrders() {
  saveStorage(ORDERS_STORAGE_KEY, state.orders);
}

function saveSession() {
  if (state.currentUser) {
    saveStorage(SESSION_STORAGE_KEY, state.currentUser);
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
  renderNav();
}

function getRoleProfile(role) {
  return ROLE_PROFILES[role] || ROLE_PROFILES.buyer;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function calculateFee(subtotal) {
  return Math.round((Number(subtotal) || 0) * MARKETPLACE_FEE_RATE);
}

function getProduct(productId) {
  return state.products.find((product) => product.id === productId);
}

function getSellerProfile(sellerId) {
  const fallbackProduct = state.products.find((product) => product.sellerId === sellerId);
  const profile = SELLER_PROFILES[sellerId];
  return {
    sellerId,
    name: profile?.name || fallbackProduct?.sellerName || "Seller PasarKita",
    location: profile?.location || "Indonesia",
    rating: profile?.rating || 4.5,
    description: profile?.description || "Toko UMKM lokal yang terdaftar di ekosistem PasarKita.",
  };
}

function getSellerProducts(sellerId, publicOnly = false) {
  const products = state.products.filter((product) => product.sellerId === sellerId);
  return publicOnly ? products.filter((product) => product.status !== "nonaktif") : products;
}

function getSellerStats(sellerId = null) {
  const products = sellerId ? getSellerProducts(sellerId) : state.products;
  return {
    total: products.length,
    active: products.filter((product) => product.status === "aktif").length,
    inactive: products.filter((product) => product.status === "nonaktif").length,
    empty: products.filter((product) => product.status === "stok-habis" || product.stock === 0).length,
  };
}

function getCartItems() {
  return state.cart
    .map((item) => {
      const product = getProduct(item.productId);
      if (!product) return null;
      return { product, qty: item.qty };
    })
    .filter(Boolean);
}

function calculateItemsSummary(items) {
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const fee = calculateFee(subtotal);
  return {
    subtotal,
    fee,
    total: subtotal + fee,
    totalQty: items.reduce((sum, item) => sum + item.qty, 0),
  };
}

function statusClass(status) {
  return status.toLowerCase().replaceAll("_", "-");
}

function statusLabel(status) {
  return ORDER_STATUS_LABELS[status] || status;
}

function shellTemplate() {
  return `
    <div class="app-shell">
      <nav class="navbar">
        <div class="container navbar-inner">
          <a href="#/" class="brand" data-page="landing">
            <div class="brand-icon">P</div>
            PasarKita
          </a>
          <div class="nav-search" role="search">
            <input id="global-search-input" type="search" placeholder="Cari produk UMKM di PasarKita">
            <button type="button" data-global-search>Cari</button>
          </div>
          <div class="nav-links" id="nav-links"></div>
        </div>
      </nav>

      <main class="container" id="app-content">
        <div id="page-landing" class="page active">
          <section class="landing-hero">
            <div class="landing-copy">
              <span class="category-badge">Marketplace UMKM Microservice</span>
              <h1>Marketplace UMKM yang terhubung dengan POS toko dan pengiriman LogistiKita.</h1>
              <p>
                PasarKita menjadi kanal jual beli online dalam ekosistem microservice.
                Marketplace fokus pada katalog, cart, checkout request, dan status order,
                sementara POS menangani transaksi toko fisik dan LogistiKita menangani pengiriman setelah pembayaran berhasil.
              </p>
              <div class="landing-actions">
                <button class="btn btn-primary" type="button" data-page="product-list">Lihat Produk</button>
                <button class="btn btn-primary" type="button" data-page="login">Login</button>
                <button class="btn btn-secondary" type="button" data-page="register">Register</button>
              </div>
              <div class="landing-tags" aria-label="Ruang lingkup sistem">
                <span>Katalog Marketplace</span>
                <span>POS Terhubung</span>
                <span>LogistiKita Delivery</span>
                <span>Fee Marketplace 2%</span>
                <span>API Gateway</span>
              </div>
            </div>
            <div class="ecosystem-panel">
              <div class="ecosystem-head">
                <h3>Peta Ekosistem</h3>
                <p>Frontend marketplace menampilkan alur user, tetapi transaksi lintas layanan tetap lewat kontrak API.</p>
              </div>
              <div class="flow-grid">
                <div class="flow-node active">PasarKita Marketplace</div>
                <div class="flow-node">WarungPOS</div>
                <div class="flow-node">API Gateway</div>
                <div class="flow-node">SmartBank</div>
                <div class="flow-node">LogistiKita</div>
              </div>
              <ul class="ecosystem-points">
                <li>Marketplace membuat order dan checkout request, bukan mutasi saldo.</li>
                <li>POS menjadi kanal transaksi offline yang tetap masuk ke ekosistem pembayaran.</li>
                <li>LogistiKita menerima request pengiriman setelah status pembayaran berhasil.</li>
              </ul>
            </div>
          </section>

          <section class="platform-snapshot" aria-label="Ringkasan sistem">
            <article class="snapshot-card">
              <span>Marketplace</span>
              <strong>Katalog & Checkout</strong>
              <p>Kanal belanja online untuk produk UMKM dan order request.</p>
            </article>
            <article class="snapshot-card">
              <span>POS</span>
              <strong>Transaksi Offline</strong>
              <p>POS menjadi konteks toko fisik yang terhubung ke pembayaran ekosistem.</p>
            </article>
            <article class="snapshot-card">
              <span>LogistiKita</span>
              <strong>Pengiriman</strong>
              <p>Order berbayar bisa diteruskan menjadi request pengiriman.</p>
            </article>
            <article class="snapshot-card">
              <span>Gateway & Bank</span>
              <strong>Payment Request</strong>
              <p>Semua pembayaran tetap lewat Gateway dan SmartBank.</p>
            </article>
          </section>

          <section class="feature-overview">
            <div class="section-heading">
              <h2>Fitur Sistem Marketplace</h2>
              <p>Komponen inti yang tersedia pada implementasi frontend PasarKita.</p>
            </div>
            <div class="feature-grid">
              <article class="feature-card">
                <h3>Katalog Produk Dinamis</h3>
                <p>Etalase produk UMKM dengan search, kategori, seller, stok, harga, dan sorting.</p>
              </article>
              <article class="feature-card">
                <h3>Cart dan Checkout</h3>
                <p>Pembeli kelola kuantitas item, melihat fee marketplace 2%, lalu membuat checkout request.</p>
              </article>
              <article class="feature-card">
                <h3>Terhubung LogistiKita</h3>
                <p>Status order disiapkan untuk flow pengiriman setelah pembayaran berhasil.</p>
              </article>
              <article class="feature-card">
                <h3>Konteks WarungPOS</h3>
                <p>Landing menjelaskan bahwa POS adalah kanal offline terpisah yang saling terhubung via Gateway.</p>
              </article>
              <article class="feature-card">
                <h3>Seller Center</h3>
                <p>Penjual mengelola produk, stok, status aktif/nonaktif, dan preview data produk.</p>
              </article>
              <article class="feature-card">
                <h3>Dashboard Role-Based</h3>
                <p>Pembeli, penjual, dan admin melihat action sesuai hak akses pada frontend demo.</p>
              </article>
            </div>
          </section>

          <section class="role-overview">
            <div class="section-heading">
              <h2>Role dan Akses Utama</h2>
              <p>Setiap role memiliki ruang kerja yang berbeda untuk menjaga alur tetap terstruktur.</p>
            </div>
            <div class="role-grid">
              <article class="role-card">
                <span>Pembeli</span>
                <strong>Belanja & pantau order</strong>
                <p>Katalog produk, cart, checkout request, dan status order.</p>
              </article>
              <article class="role-card">
                <span>Penjual</span>
                <strong>Kelola produk toko</strong>
                <p>Tambah produk, edit stok, nonaktifkan produk, dan lihat profil toko.</p>
              </article>
              <article class="role-card">
                <span>Admin Marketplace</span>
                <strong>Monitor operasional</strong>
                <p>Ringkasan katalog, order mock, status transaksi, dan fee marketplace.</p>
              </article>
            </div>
          </section>

          <section class="system-journey">
            <div class="section-heading">
              <h2>Alur Sistem Singkat</h2>
              <p>Dari onboarding pengguna sampai monitoring transaksi dalam satu ekosistem demo.</p>
            </div>
            <div class="journey-grid">
              <article class="journey-step">
                <span>01</span>
                <strong>Onboarding</strong>
                <p>Pengguna melakukan login role demo atau register pembeli untuk memulai eksplorasi.</p>
              </article>
              <article class="journey-step">
                <span>02</span>
                <strong>Interaksi Katalog</strong>
                <p>Pembeli menjelajah produk UMKM, sedangkan penjual mengelola inventaris di seller center.</p>
              </article>
              <article class="journey-step">
                <span>03</span>
                <strong>Checkout Request</strong>
                <p>Marketplace menghitung subtotal dan fee 2%, lalu membuat request ke API Gateway.</p>
              </article>
              <article class="journey-step">
                <span>04</span>
                <strong>Pengiriman</strong>
                <p>Setelah pembayaran sukses, order siap diteruskan sebagai request LogistiKita.</p>
              </article>
            </div>
          </section>

          <section class="landing-cta">
            <div>
              <h2>Mulai eksplorasi PasarKita sekarang</h2>
              <p>Gunakan login role demo untuk menguji seluruh flow, atau register cepat sebagai pembeli.</p>
            </div>
            <div class="landing-actions">
              <button class="btn btn-primary" type="button" data-page="product-list">Mulai Lihat Produk</button>
              <button class="btn btn-secondary" type="button" data-page="login">Masuk Role Demo</button>
              <button class="btn btn-secondary" type="button" data-page="register">Register Pembeli</button>
            </div>
          </section>
        </div>

        <div id="page-login" class="page">
          <div class="auth-layout">
            <div class="auth-copy">
              <span class="category-badge">Role Login Demo</span>
              <h1>Masuk sebagai role yang ingin diuji.</h1>
              <p>
                Ini login dummy untuk kebutuhan UI/UX. Data session disimpan di LocalStorage
                sebagai token mock, tanpa backend dan tanpa fitur saldo.
              </p>
            </div>
            <div class="auth-card">
              <label class="form-label" for="login-name">Nama Tampilan</label>
              <input id="login-name" class="input" type="text" value="Ayu Pembeli" placeholder="Nama user">
              <div class="login-role-list">
                <button class="role-login-option active" type="button" data-role-option="buyer">
                  <strong>Pembeli</strong>
                  <span>Belanja, cart, checkout, status order.</span>
                </button>
                <button class="role-login-option" type="button" data-role-option="seller">
                  <strong>Penjual</strong>
                  <span>Seller center dan manajemen produk.</span>
                </button>
                <button class="role-login-option" type="button" data-role-option="admin">
                  <strong>Admin Marketplace</strong>
                  <span>Dashboard monitoring operasional.</span>
                </button>
              </div>
              <button class="btn btn-primary full-width" type="button" data-submit-login>Masuk Dashboard</button>
            </div>
          </div>
        </div>

        <div id="page-register" class="page">
          <div class="auth-layout">
            <div class="auth-copy">
              <span class="category-badge">Register Demo</span>
              <h1>Buat akun pembeli untuk mulai belanja di PasarKita.</h1>
              <p>
                Register ini khusus pembeli. Untuk kebutuhan demo lintas role,
                gunakan halaman login agar bisa memilih role penjual atau admin.
              </p>
            </div>
            <div class="auth-card">
              <div class="form-group">
                <label class="form-label" for="register-name">Nama Lengkap</label>
                <input id="register-name" class="input" type="text" placeholder="Nama user" required>
              </div>
              <div class="form-group">
                <label class="form-label" for="register-email">Email</label>
                <input id="register-email" class="input" type="email" placeholder="nama@email.com" required>
              </div>
              <div class="smartbank-note auth-note">
                Akun baru otomatis dibuat sebagai pembeli. Role penjual dan admin hanya untuk mode login demo.
              </div>
              <button class="btn btn-primary full-width" type="button" data-submit-register>Register sebagai Pembeli</button>
              <button class="btn btn-secondary full-width auth-secondary-action" type="button" data-page="login">Sudah punya akun demo</button>
            </div>
          </div>
        </div>

        <div id="page-dashboard" class="page">
          <div id="role-dashboard-container"></div>
        </div>

        <div id="page-product-list" class="page">
          <section class="marketplace-hero">
            <div class="marketplace-hero-copy">
              <span class="category-badge">PasarKita Mall UMKM</span>
              <h1>Belanja produk UMKM lokal, lihat-lihat dulu tanpa login.</h1>
              <p>
                Jelajahi produk, bandingkan toko, cek stok, dan lihat detail tanpa akun.
                Login hanya diperlukan saat masuk keranjang atau checkout.
                Marketplace hanya membuat request order dan pembayaran ke backend, sedangkan POS dan LogistiKita berjalan sebagai modul ekosistem terpisah.
              </p>
              <div class="marketplace-search-preview">
                <span>Cari produk UMKM</span>
                <button class="btn btn-primary" type="button" data-focus-catalog>Cari Sekarang</button>
              </div>
            </div>
            <div class="marketplace-promo-card">
              <span class="promo-kicker">Ekosistem Terhubung</span>
              <h2>Marketplace -> Gateway -> SmartBank -> LogistiKita</h2>
              <p>Checkout sukses dapat diteruskan menjadi request pengiriman tanpa marketplace mengubah saldo.</p>
              <div class="promo-metrics">
                <div>
                  <strong>2%</strong>
                  <span>Fee marketplace</span>
                </div>
                <div>
                  <strong>POS</strong>
                  <span>Kanal offline</span>
                </div>
                <div>
                  <strong>API</strong>
                  <span>Kontrak layanan</span>
                </div>
              </div>
            </div>
          </section>

          <section class="marketplace-service-strip" aria-label="Layanan ekosistem">
            <article class="service-pill">
              <strong>Etalase UMKM</strong>
              <span>Katalog, detail produk, cart, checkout.</span>
            </article>
            <article class="service-pill">
              <strong>WarungPOS</strong>
              <span>Konteks transaksi offline toko fisik.</span>
            </article>
            <article class="service-pill">
              <strong>LogistiKita</strong>
              <span>Request pengiriman setelah pembayaran.</span>
            </article>
            <article class="service-pill">
              <strong>SmartBank</strong>
              <span>Payment request lewat API Gateway.</span>
            </article>
          </section>

          <section class="marketplace-window" aria-label="Etalase utama marketplace">
            <div class="marketplace-window-main">
              <span class="promo-kicker light">Promo Etalase</span>
              <h2>Produk pilihan UMKM minggu ini</h2>
              <p>Cek makanan, fashion, kerajinan, minuman, dan kesehatan lokal dari seller aktif.</p>
            </div>
            <div class="marketplace-window-side">
              <strong>Tanpa login untuk browsing</strong>
              <span>Login pembeli baru diperlukan saat add to cart atau checkout.</span>
            </div>
          </section>

          <section class="category-section" aria-label="Kategori produk">
            <div class="section-heading">
              <h2>Kategori Produk</h2>
              <p>Pilih kategori untuk mempercepat pencarian.</p>
            </div>
            <div class="category-strip" id="category-strip"></div>
          </section>

          <div class="toolbar">
            <input type="text" class="input" id="search-input" placeholder="Cari produk...">
            <select class="select" id="filter-category">
              <option value="all">Semua Kategori</option>
              <option value="Makanan">Makanan</option>
              <option value="Kerajinan">Kerajinan</option>
              <option value="Fashion">Fashion</option>
              <option value="Minuman">Minuman</option>
              <option value="Kesehatan">Kesehatan</option>
            </select>
            <select class="select" id="filter-seller">
              <option value="all">Semua Seller</option>
            </select>
            <select class="select" id="filter-stock">
              <option value="all">Semua Stok</option>
              <option value="available">Stok Tersedia</option>
              <option value="low">Stok Terbatas</option>
              <option value="empty">Stok Habis</option>
            </select>
            <input type="number" class="input" id="filter-min-price" min="0" placeholder="Harga min">
            <input type="number" class="input" id="filter-max-price" min="0" placeholder="Harga max">
            <select class="select" id="sort-price">
              <option value="newest">Terbaru</option>
              <option value="low">Harga Terendah</option>
              <option value="high">Harga Tertinggi</option>
              <option value="name-asc">Nama A-Z</option>
            </select>
            <button class="btn btn-secondary" type="button" data-reset-filters>Reset Filter</button>
          </div>

          <div class="result-summary" id="product-results-meta"></div>
          <div class="product-grid" id="product-grid-container"></div>
          <div class="load-more-wrap" id="load-more-wrap"></div>
        </div>

        <div id="page-product-detail" class="page">
          <div class="page-back">
            <button class="btn btn-secondary" type="button" data-back-products>Kembali ke Produk</button>
          </div>
          <div class="detail-layout" id="product-detail-container"></div>
        </div>

        <div id="page-store-profile" class="page">
          <div class="page-back">
            <button class="btn btn-secondary" type="button" data-back-products>Kembali ke Produk</button>
          </div>
          <div id="store-profile-container"></div>
        </div>

        <div id="page-cart" class="page">
          <div class="page-title split-title">
            <div>
              <h1>Keranjang Belanja</h1>
              <p>Kelola item sebelum membuat request checkout.</p>
            </div>
            <button class="btn btn-secondary" type="button" data-back-products>Lanjut Belanja</button>
          </div>
          <div id="cart-container"></div>
        </div>

        <div id="page-checkout" class="page">
          <div class="page-title">
            <h1>Checkout</h1>
          </div>
          <div class="checkout-layout">
            <div class="checkout-form-card">
              <h2>Detail Pengiriman</h2>
              <div id="checkout-item-preview" class="checkout-item-preview"></div>

              <form id="checkout-form">
                <div class="form-group">
                  <label class="form-label" for="receiver-name">Nama Penerima</label>
                  <input id="receiver-name" type="text" class="input" required placeholder="Budi Santoso">
                </div>
                <div class="form-group">
                  <label class="form-label" for="receiver-phone">Nomor Telepon</label>
                  <input id="receiver-phone" type="tel" class="input" required placeholder="08123456789">
                </div>
                <div class="form-group">
                  <label class="form-label" for="shipping-address">Alamat Lengkap</label>
                  <textarea id="shipping-address" class="textarea" rows="3" required placeholder="Jl. Merdeka No. 123..."></textarea>
                </div>
              </form>
            </div>

            <div class="summary-card">
              <h2>Ringkasan Pembayaran</h2>
              <div id="checkout-summary-details"></div>
              <div class="smartbank-note">
                Marketplace tidak mengubah saldo. Checkout ini hanya membuat request pembayaran ke backend Marketplace/API Gateway.
              </div>
              <button type="submit" form="checkout-form" class="btn btn-primary full-width">
                Buat Order & Bayar
              </button>
            </div>
          </div>
        </div>

        <div id="page-order-status" class="page">
          <div id="order-status-container"></div>
        </div>

        <div id="page-seller" class="page">
          <div class="seller-header">
            <div>
              <h1>Seller Center</h1>
              <p>Kelola produk dan inventaris toko Anda.</p>
            </div>
            <button class="btn btn-primary" type="button" data-open-product-modal>
              + Tambah Produk
            </button>
          </div>

          <div class="seller-stats" id="seller-stats"></div>

          <div class="table-card">
            <div class="table-toolbar table-toolbar-grid">
              <input type="text" class="input" id="seller-search" placeholder="Cari produk seller...">
              <select class="select" id="seller-status-filter">
                <option value="all">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="stok-habis">Stok Habis</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
            <div class="table-scroll">
              <table class="table">
                <thead>
                  <tr>
                    <th>Produk Info</th>
                    <th>Kategori</th>
                    <th>Harga</th>
                    <th>Stok</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody id="seller-table-body"></tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>

    <div id="toast-container" class="toast-container"></div>

    <div class="modal-overlay" id="product-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-box">
        <div class="modal-header">
          <h3 id="modal-title">Tambah Produk</h3>
          <button class="btn-close" type="button" data-close-modal aria-label="Tutup modal">x</button>
        </div>
        <div class="modal-body">
          <form id="product-form">
            <input type="hidden" id="modal-product-id">
            <div class="form-group">
              <label class="form-label" for="modal-name">Nama Produk</label>
              <input type="text" id="modal-name" class="input" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="modal-category">Kategori</label>
              <select id="modal-category" class="select" required>
                <option value="Makanan">Makanan</option>
                <option value="Kerajinan">Kerajinan</option>
                <option value="Fashion">Fashion</option>
                <option value="Minuman">Minuman</option>
                <option value="Kesehatan">Kesehatan</option>
              </select>
            </div>
            <div class="form-grid-two">
              <div class="form-group">
                <label class="form-label" for="modal-price">Harga (Rp)</label>
                <input type="number" id="modal-price" class="input" required min="1000">
              </div>
              <div class="form-group">
                <label class="form-label" for="modal-stock">Stok</label>
                <input type="number" id="modal-stock" class="input" required min="0">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" for="modal-desc">Deskripsi</label>
              <textarea id="modal-desc" class="textarea" rows="3" required></textarea>
            </div>
          </form>
          <div class="product-form-preview" id="product-form-preview" aria-live="polite"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" type="button" data-close-modal>Batal</button>
          <button type="button" class="btn btn-primary" data-save-product>Simpan Produk</button>
        </div>
      </div>
    </div>
  `;
}

function routeForPage(pageId, payload = {}) {
  if (pageId === "landing") return "#/";
  if (pageId === "login") return "#/login";
  if (pageId === "register") return "#/register";
  if (pageId === "dashboard") return "#/dashboard";
  if (pageId === "product-list") return "#/products";
  if (pageId === "product-detail") return `#/products/${payload.productId || state.selectedProductId}`;
  if (pageId === "store-profile") return `#/stores/${payload.sellerId || state.selectedSellerId}`;
  if (pageId === "cart") return "#/cart";
  if (pageId === "checkout") {
    if (payload.mode === "cart" || state.checkoutSession?.mode === "cart") return "#/checkout/cart";
    return `#/checkout/${payload.productId || state.checkoutSession?.items?.[0]?.product.id}?qty=${payload.qty || state.checkoutSession?.items?.[0]?.qty || 1}`;
  }
  if (pageId === "order-status") return payload.orderId ? `#/orders/${payload.orderId}` : "#/orders";
  if (pageId === "seller") return "#/seller/products";
  return state.currentUser ? "#/dashboard" : "#/";
}

function isPublicPath(path) {
  return (
    path === "/" ||
    path === "" ||
    path === "/login" ||
    path === "/register" ||
    path === "/products" ||
    path.startsWith("/products/") ||
    path.startsWith("/stores/")
  );
}

function routeRequiresSeller(path) {
  return path === "/seller/products";
}

function routeRequiresBuyer(path) {
  return path === "/cart" || path.startsWith("/checkout/");
}

function routeRequiresBuyerOrAdmin(path) {
  return path.startsWith("/orders");
}

function guardRoute(path) {
  if (isPublicPath(path)) return true;

  if (!state.currentUser) {
    showToast("Silakan login dulu untuk membuka fitur marketplace", "info");
    window.location.hash = "#/login";
    return false;
  }

  if (routeRequiresSeller(path) && state.currentUser.role !== "seller") {
    showToast("Seller Center hanya untuk role penjual", "error");
    window.location.hash = "#/dashboard";
    return false;
  }

  if (routeRequiresBuyer(path) && state.currentUser.role !== "buyer") {
    showToast("Cart dan checkout hanya untuk role pembeli", "error");
    window.location.hash = "#/dashboard";
    return false;
  }

  if (routeRequiresBuyerOrAdmin(path) && !["buyer", "admin"].includes(state.currentUser.role)) {
    showToast("Status order hanya untuk pembeli atau admin marketplace", "error");
    window.location.hash = "#/dashboard";
    return false;
  }

  return true;
}

function navigate(pageId, payload = {}) {
  const nextHash = routeForPage(pageId, payload);
  const nextPath = nextHash.slice(1).split("?")[0];
  if (!guardRoute(nextPath)) return;

  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
    return;
  }

  showPage(pageId);
}

function showPage(pageId) {
  renderNav();
  document.querySelectorAll(".page").forEach((page) => page.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.toggle("active", link.dataset.page === pageId);
  });

  if (pageId === "order-status") {
    document
      .querySelectorAll(".nav-link")
      .forEach((link) => link.classList.toggle("active", link.dataset.page === "order-status"));
  }

  if (pageId === "dashboard") {
    document
      .querySelectorAll(".nav-link")
      .forEach((link) => link.classList.toggle("active", link.dataset.page === "dashboard"));
  }

  const target = document.getElementById(`page-${pageId}`);
  if (target) target.classList.add("active");

  if (pageId === "login") renderLoginPage();
  if (pageId === "register") renderRegisterPage();
  if (pageId === "dashboard") renderRoleDashboard();
  if (pageId === "product-list") renderProductGrid();
  if (pageId === "cart") renderCart();
  if (pageId === "seller") renderSellerTable();
  if (pageId === "order-status") renderOrdersRoute();
}

function syncRouteFromHash() {
  const hash = window.location.hash || "#/";
  const [path, queryString = ""] = hash.slice(1).split("?");
  const query = new URLSearchParams(queryString);

  if (!guardRoute(path)) return;

  if (path === "/" || path === "") {
    showPage("landing");
    return;
  }

  if (path === "/login") {
    showPage("login");
    return;
  }

  if (path === "/register") {
    showPage("register");
    return;
  }

  if (path === "/dashboard") {
    showPage("dashboard");
    return;
  }

  if (path === "/products") {
    showPage("product-list");
    return;
  }

  if (path.startsWith("/products/")) {
    viewProductDetail(decodeURIComponent(path.split("/")[2]), false);
    return;
  }

  if (path.startsWith("/stores/")) {
    renderStoreProfile(decodeURIComponent(path.split("/")[2]), false);
    return;
  }

  if (path === "/cart") {
    showPage("cart");
    return;
  }

  if (path === "/checkout/cart") {
    initCartCheckout(false);
    return;
  }

  if (path.startsWith("/checkout/")) {
    initCheckout(decodeURIComponent(path.split("/")[2]), Number(query.get("qty") || 1), false);
    return;
  }

  if (path.startsWith("/orders")) {
    showPage("order-status");
    return;
  }

  if (path === "/seller/products") {
    showPage("seller");
    return;
  }

  window.location.hash = state.currentUser ? "#/dashboard" : "#/";
}

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    window.setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function renderNav() {
  const nav = document.getElementById("nav-links");
  if (!nav) return;

  const cartTotal = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const currentPath = (window.location.hash || "#/").slice(1).split("?")[0] || "/";

  const links = [{ page: "landing", href: "#/", label: "Beranda", match: ["/", ""] }];
  links.push({ page: "product-list", href: "#/products", label: "Produk", match: ["/products"] });

  if (state.currentUser) {
    links.push({ page: "dashboard", href: "#/dashboard", label: getRoleProfile(state.currentUser.role).label, match: ["/dashboard"] });

    if (state.currentUser.role === "buyer") {
      links.push({
        page: "cart",
        href: "#/cart",
        label: `Keranjang <span class="cart-count" id="cart-count">${cartTotal}</span>`,
        match: ["/cart"],
      });
      links.push({ page: "order-status", href: "#/orders", label: "Status Order", match: ["/orders"] });
    }

    if (state.currentUser.role === "seller") {
      links.push({ page: "seller", href: "#/seller/products", label: "Seller Center", match: ["/seller/products"] });
    }

    if (state.currentUser.role === "admin") {
      links.push({ page: "order-status", href: "#/orders", label: "Monitoring Order", match: ["/orders"] });
    }
  } else {
    links.push({ page: "login", href: "#/login", label: "Login", match: ["/login"] });
    links.push({ page: "register", href: "#/register", label: "Register", match: ["/register"] });
  }

  nav.innerHTML = `
    ${links
      .map((link) => {
        const isActive =
          link.match.includes(currentPath) ||
          (link.page === "product-list" && currentPath.startsWith("/products")) ||
          (link.page === "order-status" && currentPath.startsWith("/orders"));
        return `<a class="nav-link ${isActive ? "active" : ""}" href="${link.href}" data-page="${link.page}">${link.label}</a>`;
      })
      .join("")}
    ${state.currentUser ? `<button class="nav-logout" type="button" data-logout>Keluar</button>` : ""}
  `;
}

function renderLoginPage() {
  const selectedRole = state.currentUser?.role || "buyer";
  const profile = getRoleProfile(selectedRole);
  const nameInput = document.getElementById("login-name");
  if (nameInput) nameInput.value = state.currentUser?.name || profile.name;

  document.querySelectorAll("[data-role-option]").forEach((option) => {
    option.classList.toggle("active", option.dataset.roleOption === selectedRole);
  });
}

function renderRegisterPage() {
  const name = document.getElementById("register-name");
  if (name && !name.value.trim()) name.value = "User Baru";
}

function setLoginRole(role) {
  document.querySelectorAll("[data-role-option]").forEach((option) => {
    option.classList.toggle("active", option.dataset.roleOption === role);
  });

  const nameInput = document.getElementById("login-name");
  if (nameInput && (!nameInput.value.trim() || Object.values(ROLE_PROFILES).some((item) => item.name === nameInput.value))) {
    nameInput.value = getRoleProfile(role).name;
  }
}

function getSelectedLoginRole() {
  return document.querySelector("[data-role-option].active")?.dataset.roleOption || "buyer";
}

function loginAsRole(role = getSelectedLoginRole()) {
  const profile = getRoleProfile(role);
  const name = document.getElementById("login-name")?.value.trim() || profile.name;
  state.currentUser = {
    role,
    name,
    token: `mock-jwt-${role}-${Date.now()}`,
    loggedAt: new Date().toISOString(),
  };
  saveSession();
  showToast(`Masuk sebagai ${profile.label}`, "success");
  navigate("dashboard");
}

function registerAccount() {
  const nameInput = document.getElementById("register-name");
  const emailInput = document.getElementById("register-email");
  const name = nameInput?.value.trim();
  const email = emailInput?.value.trim();
  const role = "buyer";

  if (!name || !email) {
    showToast("Nama dan email wajib diisi", "error");
    return;
  }

  state.currentUser = {
    role,
    name,
    email,
    token: `mock-jwt-register-${role}-${Date.now()}`,
    loggedAt: new Date().toISOString(),
  };
  saveSession();
  showToast(`Register berhasil sebagai ${getRoleProfile(role).label}`, "success");
  navigate("dashboard");
}

function logout() {
  state.currentUser = null;
  saveSession();
  showToast("Session role dihapus", "info");
  navigate("landing");
}

function promptLoginForShopping() {
  showToast("Silakan login sebagai pembeli untuk belanja", "info");
  navigate("login");
}

function runGlobalSearch() {
  const keyword = document.getElementById("global-search-input")?.value.trim() || "";
  navigate("product-list");
  window.setTimeout(() => {
    const productSearch = document.getElementById("search-input");
    if (productSearch) {
      productSearch.value = keyword;
      resetProductVisibleCount();
      renderProductGrid();
      productSearch.focus();
    }
  }, 0);
}

function renderMetricCard(label, value, note = "") {
  return `
    <div class="role-metric-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      ${note ? `<p>${escapeHtml(note)}</p>` : ""}
    </div>
  `;
}

function renderRoleDashboard() {
  const container = document.getElementById("role-dashboard-container");
  if (!container) return;

  if (!state.currentUser) {
    container.innerHTML = `
      <div class="empty-list">
        <h2>Belum memilih role</h2>
        <p>Masuk sebagai pembeli, penjual, atau admin marketplace untuk membuka dashboard.</p>
        <button class="btn btn-primary" type="button" data-page="login">Pilih Role</button>
      </div>
    `;
    return;
  }

  const role = state.currentUser.role;
  const profile = getRoleProfile(role);
  const orderSummary = state.orders.reduce((sum, order) => sum + (order.summary?.fee || 0), 0);
  const sellerStats = getSellerStats("SELLER001");
  const cartItems = getCartItems();

  const dashboardByRole = {
    buyer: {
      title: "Dashboard Pembeli",
      subtitle: "Akses belanja, cart, dan status order dari satu tempat.",
      metrics: [
        renderMetricCard("Item Cart", String(cartItems.length), "Produk yang siap checkout"),
        renderMetricCard("Total Qty", String(cartItems.reduce((sum, item) => sum + item.qty, 0)), "Jumlah item di keranjang"),
        renderMetricCard("Order Mock", String(state.orders.length), "Riwayat order tersimpan"),
      ],
      actions: `
        <button class="btn btn-primary" type="button" data-page="product-list">Belanja Produk</button>
        <button class="btn btn-secondary" type="button" data-page="cart">Buka Keranjang</button>
        <button class="btn btn-secondary" type="button" data-page="order-status">Cek Status Order</button>
      `,
      panel: `
        <div class="role-panel">
          <h3>Alur Pembeli</h3>
          <p>Pilih produk UMKM, masukkan ke cart, isi alamat pengiriman, lalu marketplace membuat request checkout ke backend.</p>
        </div>
      `,
    },
    seller: {
      title: "Dashboard Penjual",
      subtitle: "Pantau produk toko dan lanjut ke Seller Center.",
      metrics: [
        renderMetricCard("Total Produk", String(sellerStats.total), "Produk milik Warung Rejeki"),
        renderMetricCard("Aktif", String(sellerStats.active), "Tampil di katalog publik"),
        renderMetricCard("Stok Habis", String(sellerStats.empty), "Butuh update inventaris"),
      ],
      actions: `
        <button class="btn btn-primary" type="button" data-page="seller">Kelola Produk</button>
        <button class="btn btn-secondary" type="button" data-open-product-modal>Tambah Produk</button>
        <button class="btn btn-secondary" type="button" data-store-id="SELLER001">Lihat Profil Toko</button>
      `,
      panel: `
        <div class="role-panel">
          <h3>Fokus Penjual</h3>
          <p>Role penjual hanya mengelola katalog marketplace: nama produk, kategori, harga, stok, status, dan deskripsi.</p>
        </div>
      `,
    },
    admin: {
      title: "Dashboard Admin Marketplace",
      subtitle: "Monitoring frontend marketplace tanpa mengelola saldo atau modul eksternal.",
      metrics: [
        renderMetricCard("Produk Katalog", String(state.products.length), "Termasuk aktif dan nonaktif"),
        renderMetricCard("Order Mock", String(state.orders.length), "Data order frontend"),
        renderMetricCard("Fee Marketplace", formatRp(orderSummary), "Akumulasi fee 2% dari order mock"),
      ],
      actions: `
        <button class="btn btn-primary" type="button" data-page="product-list">Audit Katalog</button>
        <button class="btn btn-secondary" type="button" data-page="order-status">Pantau Order</button>
        <button class="btn btn-secondary" type="button" data-page="dashboard">Ringkasan Role</button>
      `,
      panel: `
        <div class="role-panel">
          <h3>Batas Admin</h3>
          <p>Admin marketplace hanya melihat operasional katalog dan order mock. Saldo, ledger, dan pembayaran tetap di luar frontend marketplace.</p>
        </div>
      `,
    },
  };

  const dashboard = dashboardByRole[role] || dashboardByRole.buyer;
  container.innerHTML = `
    <section class="role-dashboard-hero">
      <div>
        <span class="category-badge">${escapeHtml(profile.label)}</span>
        <h1>${dashboard.title}</h1>
        <p>${escapeHtml(dashboard.subtitle)}</p>
        <div class="active-session">
          <strong>${escapeHtml(state.currentUser.name)}</strong>
          <span>Token demo disimpan di LocalStorage - ${escapeHtml(state.currentUser.token.slice(0, 20))}...</span>
        </div>
      </div>
      <button class="btn btn-secondary" type="button" data-logout>Keluar Role</button>
    </section>

    <div class="role-metric-grid">${dashboard.metrics.join("")}</div>
    <div class="role-dashboard-actions">${dashboard.actions}</div>
    ${dashboard.panel}
  `;
}

function resetProductVisibleCount() {
  state.productVisibleCount = PRODUCT_PAGE_SIZE;
}

function resetProductFilters() {
  document.getElementById("search-input").value = "";
  document.getElementById("filter-category").value = "all";
  document.getElementById("filter-seller").value = "all";
  document.getElementById("filter-stock").value = "all";
  document.getElementById("filter-min-price").value = "";
  document.getElementById("filter-max-price").value = "";
  document.getElementById("sort-price").value = "newest";
  resetProductVisibleCount();
  renderProductGrid();
}

function updateCartCount() {
  const count = document.getElementById("cart-count");
  if (!count) return;
  const total = state.cart.reduce((sum, item) => sum + item.qty, 0);
  count.textContent = String(total);
}

function getPublicProducts() {
  return state.products.filter((product) => product.status !== "nonaktif");
}

function getCategories() {
  return [...new Set(getPublicProducts().map((product) => product.category))];
}

function getSellers() {
  const sellers = new Map();
  getPublicProducts().forEach((product) => {
    sellers.set(product.sellerId, getSellerProfile(product.sellerId).name);
  });
  return [...sellers.entries()].map(([sellerId, sellerName]) => ({ sellerId, sellerName }));
}

function productCardTemplate(product) {
  const canBuy = state.currentUser?.role === "buyer";
  const seller = getSellerProfile(product.sellerId);
  return `
    <div class="product-card">
      <div class="product-image-placeholder">
        <span>Produk UMKM</span>
        <strong>${escapeHtml(product.name.split(" ")[0])}</strong>
      </div>
      <div class="product-card-badges">
        <span class="category-badge">${escapeHtml(product.category)}</span>
        <span class="marketplace-badge">UMKM Lokal</span>
        ${product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD ? `<span class="stock-badge limited">Stok terbatas</span>` : ""}
        ${product.stock === 0 ? `<span class="stock-badge empty">Stok habis</span>` : ""}
      </div>
      <h3 class="product-title">${escapeHtml(product.name)}</h3>
      <button class="product-seller seller-link" type="button" data-store-id="${escapeHtml(product.sellerId)}">
        ${escapeHtml(seller.name)}
      </button>
      <div class="product-trust-row">
        <span>${escapeHtml(seller.location)}</span>
        <span>Rating ${seller.rating}</span>
      </div>
      <p class="product-description">${escapeHtml(product.desc.substring(0, 72))}${product.desc.length > 72 ? "..." : ""}</p>
      <div class="product-price">${formatRp(product.price)}</div>
      <div class="product-card-actions ${canBuy ? "product-card-actions-three" : ""}">
        <button class="btn ${canBuy ? "btn-secondary" : "btn-primary"}" type="button" data-detail-id="${product.id}">Detail</button>
        ${
          canBuy
            ? `<button class="btn btn-secondary" type="button" data-add-cart="${product.id}" ${product.stock === 0 ? "disabled" : ""}>
                Keranjang
              </button>
              <button class="btn btn-primary" type="button" data-checkout-id="${product.id}" ${product.stock === 0 ? "disabled" : ""}>
                ${product.stock === 0 ? "Habis" : "Beli"}
              </button>`
            : state.currentUser
              ? `<span class="role-note">Role ini hanya bisa melihat produk</span>`
              : `<button class="btn btn-secondary" type="button" data-login-required ${product.stock === 0 ? "disabled" : ""}>
                  Login untuk Beli
                </button>`
        }
      </div>
    </div>
  `;
}

function getProductFilters() {
  return {
    search: document.getElementById("search-input")?.value.trim().toLowerCase() || "",
    category: document.getElementById("filter-category")?.value || "all",
    seller: document.getElementById("filter-seller")?.value || "all",
    stock: document.getElementById("filter-stock")?.value || "all",
    minPrice: Number(document.getElementById("filter-min-price")?.value || 0),
    maxPrice: Number(document.getElementById("filter-max-price")?.value || 0),
    sort: document.getElementById("sort-price")?.value || "newest",
  };
}

function hasActiveProductFilters(filters) {
  return Boolean(
    filters.search ||
      filters.category !== "all" ||
      filters.seller !== "all" ||
      filters.stock !== "all" ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.sort !== "newest"
  );
}

function renderCategorySection() {
  const container = document.getElementById("category-strip");
  if (!container) return;

  const activeCategory = document.getElementById("filter-category")?.value || "all";
  const publicProducts = getPublicProducts();
  const categories = getCategories();
  const allCount = publicProducts.length;

  container.innerHTML = [
    `<button class="category-chip ${activeCategory === "all" ? "active" : ""}" type="button" data-category-chip="all">
      Semua <span>${allCount}</span>
    </button>`,
    ...categories.map((category) => {
      const count = publicProducts.filter((product) => product.category === category).length;
      return `
        <button class="category-chip ${activeCategory === category ? "active" : ""}" type="button" data-category-chip="${escapeHtml(category)}">
          ${escapeHtml(category)} <span>${count}</span>
        </button>
      `;
    }),
  ].join("");
}

function renderSellerFilter() {
  const select = document.getElementById("filter-seller");
  if (!select) return;

  const currentValue = select.value || "all";
  select.innerHTML = `
    <option value="all">Semua Seller</option>
    ${getSellers()
      .map(
        (seller) => `
          <option value="${escapeHtml(seller.sellerId)}">${escapeHtml(seller.sellerName)}</option>
        `
      )
      .join("")}
  `;
  select.value = getSellers().some((seller) => seller.sellerId === currentValue) ? currentValue : "all";
}

function getVisibleProducts() {
  const filters = getProductFilters();

  let filtered = getPublicProducts();

  if (filters.search) {
    filtered = filtered.filter((product) =>
      `${product.name} ${product.category} ${product.sellerName}`.toLowerCase().includes(filters.search)
    );
  }

  if (filters.category !== "all") {
    filtered = filtered.filter((product) => product.category === filters.category);
  }

  if (filters.seller !== "all") {
    filtered = filtered.filter((product) => product.sellerId === filters.seller);
  }

  if (filters.stock === "available") {
    filtered = filtered.filter((product) => product.stock > 0);
  }

  if (filters.stock === "low") {
    filtered = filtered.filter((product) => product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD);
  }

  if (filters.stock === "empty") {
    filtered = filtered.filter((product) => product.stock === 0);
  }

  if (filters.minPrice) {
    filtered = filtered.filter((product) => product.price >= filters.minPrice);
  }

  if (filters.maxPrice) {
    filtered = filtered.filter((product) => product.price <= filters.maxPrice);
  }

  if (filters.sort === "newest") {
    filtered = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  if (filters.sort === "low") {
    filtered = [...filtered].sort((a, b) => a.price - b.price);
  }

  if (filters.sort === "high") {
    filtered = [...filtered].sort((a, b) => b.price - a.price);
  }

  if (filters.sort === "name-asc") {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name, "id-ID"));
  }

  return filtered;
}

function renderProductGrid() {
  const container = document.getElementById("product-grid-container");
  if (!container) return;

  renderCategorySection();
  renderSellerFilter();

  const filtered = getVisibleProducts();
  const filters = getProductFilters();
  const visibleProducts = filtered.slice(0, state.productVisibleCount);
  const resultMeta = document.getElementById("product-results-meta");
  const loadMore = document.getElementById("load-more-wrap");

  if (resultMeta) {
    resultMeta.innerHTML = `
      <span>${filtered.length} produk ditemukan</span>
      ${hasActiveProductFilters(filters) ? `<button class="action-link" type="button" data-reset-filters>Clear search & filter</button>` : ""}
    `;
  }

  if (!filtered.length) {
    const hasFilter = hasActiveProductFilters(filters);
    container.innerHTML = `
      <div class="empty-list">
        <h2>${hasFilter ? "Produk tidak cocok dengan filter" : "Produk belum tersedia"}</h2>
        <p>${hasFilter ? "Coba ubah keyword, kategori, seller, stok, atau rentang harga." : "Belum ada produk aktif pada katalog."}</p>
        ${hasFilter ? `<button class="btn btn-secondary" type="button" data-reset-filters>Reset Filter</button>` : ""}
      </div>
    `;
    if (loadMore) loadMore.innerHTML = "";
    return;
  }

  container.innerHTML = visibleProducts.map(productCardTemplate).join("");

  if (loadMore) {
    loadMore.innerHTML =
      visibleProducts.length < filtered.length
        ? `<button class="btn btn-secondary" type="button" data-load-more-products>
            Tampilkan lebih banyak (${filtered.length - visibleProducts.length} tersisa)
          </button>`
        : `<span>Semua produk sudah ditampilkan.</span>`;
  }
}

function viewProductDetail(id, updateHash = true) {
  const product = getProduct(id);
  if (!product) {
    showToast("Produk tidak ditemukan", "error");
    navigate("product-list");
    return;
  }

  state.selectedProductId = id;
  const seller = getSellerProfile(product.sellerId);
  const canBuy = state.currentUser?.role === "buyer";
  const container = document.getElementById("product-detail-container");
  container.innerHTML = `
    <div>
      <div class="detail-image-placeholder">Placeholder Gambar</div>
    </div>
    <div class="detail-content">
      <div><span class="category-badge">${escapeHtml(product.category)}</span></div>
      <h1>${escapeHtml(product.name)}</h1>
      <div class="stock-badge ${product.stock > 0 ? "available" : "empty"}">
        ${product.stock > 0 ? `Tersedia (${product.stock} stok)` : "Stok Habis"}
      </div>
      <div class="detail-price">${formatRp(product.price)}</div>
      <p class="detail-desc">${escapeHtml(product.desc)}</p>

      <div class="seller-mini-card">
        <div class="store-avatar small">${escapeHtml(seller.name.charAt(0))}</div>
        <div class="seller-mini-info">
          <span>Dijual oleh</span>
          <strong>${escapeHtml(seller.name)}</strong>
          <p>${escapeHtml(seller.location)} - Rating ${seller.rating}</p>
        </div>
        <button class="btn btn-secondary" type="button" data-store-id="${escapeHtml(product.sellerId)}">Lihat Toko</button>
      </div>

      ${
        canBuy
          ? `<div class="qty-selector">
              <label class="qty-label" for="detail-qty">Kuantitas:</label>
              <input type="number" id="detail-qty" class="input qty-input" value="1" min="1" max="${product.stock}" ${product.stock === 0 ? "disabled" : ""}>
            </div>
            <p class="validation-text" id="detail-qty-message"></p>

            <div class="detail-actions">
              <button class="btn btn-secondary full-width" type="button" data-detail-add-cart="${product.id}" ${product.stock === 0 ? "disabled" : ""}>
                Tambah ke Keranjang
              </button>
              <button class="btn btn-primary full-width detail-checkout" type="button" data-detail-checkout="${product.id}" ${product.stock === 0 ? "disabled" : ""}>
                Lanjut Checkout
              </button>
            </div>`
          : `<div class="role-access-note">
              ${
                state.currentUser
                  ? "Checkout produk hanya tersedia untuk role pembeli. Role saat ini hanya bisa melihat katalog dan profil toko."
                  : "Anda bisa melihat detail produk tanpa login. Login sebagai pembeli diperlukan untuk menambahkan ke keranjang atau checkout."
              }
              ${
                state.currentUser
                  ? ""
                  : `<div class="detail-actions guest-detail-actions">
                      <button class="btn btn-primary full-width" type="button" data-login-required>Login untuk Belanja</button>
                      <button class="btn btn-secondary full-width" type="button" data-page="register">Register Pembeli</button>
                    </div>`
              }
            </div>`
      }
    </div>
  `;

  if (updateHash) navigate("product-detail", { productId: id });
  else showPage("product-detail");
}

function renderStoreProfile(sellerId, updateHash = true) {
  const container = document.getElementById("store-profile-container");
  if (!container) return;

  const profile = getSellerProfile(sellerId);
  const stats = getSellerStats(sellerId);
  const products = getSellerProducts(sellerId, true);

  state.selectedSellerId = sellerId;
  container.innerHTML = `
    <section class="store-hero">
      <div class="store-avatar">${escapeHtml(profile.name.charAt(0))}</div>
      <div class="store-hero-copy">
        <span class="category-badge">Toko UMKM</span>
        <h1>${escapeHtml(profile.name)}</h1>
        <p>${escapeHtml(profile.description)}</p>
        <div class="store-meta">
          <span>${escapeHtml(profile.location)}</span>
          <span>Rating ${profile.rating}</span>
          <span>${stats.total} produk terdaftar</span>
        </div>
      </div>
    </section>

    <div class="seller-stats store-stats">
      <div class="seller-stat-card">
        <span>Total Produk</span>
        <strong>${stats.total}</strong>
      </div>
      <div class="seller-stat-card">
        <span>Produk Aktif</span>
        <strong>${stats.active}</strong>
      </div>
      <div class="seller-stat-card">
        <span>Nonaktif</span>
        <strong>${stats.inactive}</strong>
      </div>
      <div class="seller-stat-card">
        <span>Stok Habis</span>
        <strong>${stats.empty}</strong>
      </div>
    </div>

    <div class="section-heading store-product-heading">
      <h2>Produk dari ${escapeHtml(profile.name)}</h2>
      <p>Hanya produk aktif yang ditampilkan di halaman toko publik.</p>
    </div>

    <div class="product-grid">
      ${
        products.length
          ? products.map(productCardTemplate).join("")
          : `<div class="empty-list">
              <h2>Belum ada produk aktif</h2>
              <p>Toko ini belum memiliki produk yang bisa dibeli saat ini.</p>
            </div>`
      }
    </div>
  `;

  if (updateHash) navigate("store-profile", { sellerId });
  else showPage("store-profile");
}

function validateQty(product, qty) {
  return product && Number.isInteger(qty) && qty > 0 && qty <= product.stock && product.status === "aktif";
}

function addToCart(productId, qty = 1) {
  if (state.currentUser?.role !== "buyer") {
    showToast("Keranjang hanya tersedia untuk role pembeli", "error");
    navigate("dashboard");
    return;
  }

  const product = getProduct(productId);
  const parsedQty = Number(qty);
  const existing = state.cart.find((item) => item.productId === productId);
  const nextQty = (existing?.qty || 0) + parsedQty;

  if (!validateQty(product, parsedQty) || nextQty > product.stock) {
    showToast("Qty tidak valid atau stok tidak mencukupi", "error");
    return;
  }

  if (existing) {
    existing.qty = nextQty;
  } else {
    state.cart.push({ productId, qty: parsedQty });
  }

  saveCart();
  showToast("Produk ditambahkan ke keranjang", "success");
  renderCart();
}

function updateCartQty(productId, qty) {
  const product = getProduct(productId);
  const parsedQty = Number(qty);

  if (!validateQty(product, parsedQty)) {
    showToast("Qty harus lebih dari 0 dan tidak boleh melebihi stok", "error");
    renderCart();
    return;
  }

  state.cart = state.cart.map((item) =>
    item.productId === productId ? { ...item, qty: parsedQty } : item
  );
  saveCart();
  renderCart();
}

function removeCartItem(productId) {
  state.cart = state.cart.filter((item) => item.productId !== productId);
  saveCart();
  showToast("Item dihapus dari keranjang", "info");
  renderCart();
}

function renderCart() {
  const container = document.getElementById("cart-container");
  if (!container) return;

  const items = getCartItems();
  if (!items.length) {
    container.innerHTML = `
      <div class="empty-list">
        <h2>Keranjang masih kosong</h2>
        <p>Tambahkan produk UMKM sebelum checkout.</p>
        <button class="btn btn-primary" type="button" data-back-products>Mulai Belanja</button>
      </div>
    `;
    return;
  }

  const summary = calculateItemsSummary(items);
  container.innerHTML = `
    <div class="cart-layout">
      <div class="cart-list">
        ${items
          .map(
            ({ product, qty }) => `
              <div class="cart-item">
                <div class="cart-item-img">Gambar</div>
                <div class="cart-item-info">
                  <strong>${escapeHtml(product.name)}</strong>
                  <span>${escapeHtml(product.category)} - ${formatRp(product.price)}</span>
                  <small>Stok tersedia: ${product.stock}</small>
                </div>
                <div class="cart-item-actions">
                  <input class="input qty-input" type="number" min="1" max="${product.stock}" value="${qty}" data-cart-qty="${product.id}" aria-label="Qty ${escapeHtml(product.name)}">
                  <button class="action-link danger" type="button" data-remove-cart="${product.id}">Hapus</button>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="summary-card">
        <h2>Ringkasan Cart</h2>
        <div class="summary-row">
          <span>Total item</span>
          <strong>${summary.totalQty}</strong>
        </div>
        <div class="summary-row">
          <span>Subtotal</span>
          <strong>${formatRp(summary.subtotal)}</strong>
        </div>
        <div class="summary-row fee">
          <span>Biaya Layanan Marketplace 2%</span>
          <strong>${formatRp(summary.fee)}</strong>
        </div>
        <div class="summary-total">
          <span>Total Bayar</span>
          <span>${formatRp(summary.total)}</span>
        </div>
        <button class="btn btn-primary full-width" type="button" data-checkout-cart>Checkout Cart</button>
      </div>
    </div>
  `;
}

function initCheckout(productId, qty = 1, updateHash = true) {
  if (state.currentUser?.role !== "buyer") {
    showToast("Checkout hanya tersedia untuk role pembeli", "error");
    navigate("dashboard");
    return;
  }

  const product = getProduct(productId);
  const parsedQty = Number(qty);

  if (!validateQty(product, parsedQty)) {
    showToast("Stok tidak mencukupi", "error");
    return;
  }

  state.checkoutSession = {
    mode: "single",
    items: [{ product, qty: parsedQty }],
  };

  renderCheckoutSession();

  if (updateHash) navigate("checkout", { productId, qty: parsedQty });
  else showPage("checkout");
}

function initCartCheckout(updateHash = true) {
  if (state.currentUser?.role !== "buyer") {
    showToast("Checkout cart hanya tersedia untuk role pembeli", "error");
    navigate("dashboard");
    return;
  }

  const items = getCartItems();
  const invalidItem = items.find(({ product, qty }) => !validateQty(product, qty));

  if (!items.length) {
    showToast("Keranjang masih kosong", "error");
    navigate("cart");
    return;
  }

  if (invalidItem) {
    showToast("Ada item cart dengan qty tidak valid atau stok tidak cukup", "error");
    navigate("cart");
    return;
  }

  state.checkoutSession = {
    mode: "cart",
    items,
  };

  renderCheckoutSession();

  if (updateHash) navigate("checkout", { mode: "cart" });
  else showPage("checkout");
}

function renderCheckoutSession() {
  if (!state.checkoutSession) return;

  const items = state.checkoutSession.items;
  const summary = calculateItemsSummary(items);

  document.getElementById("checkout-item-preview").innerHTML = `
    <div class="checkout-items-list">
      ${items
        .map(
          ({ product, qty }) => `
            <div class="checkout-mini-item">
              <div class="checkout-item-img"></div>
              <div>
                <div class="checkout-item-name">${escapeHtml(product.name)}</div>
                <div class="checkout-item-meta">${qty} x ${formatRp(product.price)}</div>
              </div>
            </div>
          `
        )
        .join("")}
    </div>
  `;

  document.getElementById("checkout-summary-details").innerHTML = `
    <div class="summary-row">
      <span>Subtotal (${summary.totalQty} produk)</span>
      <strong>${formatRp(summary.subtotal)}</strong>
    </div>
    <div class="summary-row fee">
      <span>Biaya Layanan Marketplace 2%</span>
      <strong>${formatRp(summary.fee)}</strong>
    </div>
    <div class="summary-total">
      <span>Total Bayar</span>
      <span>${formatRp(summary.total)}</span>
    </div>
  `;

  document.getElementById("checkout-form").reset();
}

function handleCheckoutSubmit(event) {
  event.preventDefault();
  if (!state.checkoutSession) return;

  const receiverName = document.getElementById("receiver-name").value.trim();
  const receiverPhone = document.getElementById("receiver-phone").value.trim();
  const address = document.getElementById("shipping-address").value.trim();

  if (!receiverName || !receiverPhone || !address) {
    showToast("Data pengiriman wajib diisi lengkap", "error");
    return;
  }

  const invalidItem = state.checkoutSession.items.find(({ product, qty }) => !validateQty(product, qty));
  if (invalidItem) {
    showToast("Checkout gagal karena ada qty yang tidak valid", "error");
    return;
  }

  const summary = calculateItemsSummary(state.checkoutSession.items);
  const order = {
    id: `ORD-${Date.now()}`,
    items: state.checkoutSession.items.map(({ product, qty }) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      qty,
    })),
    subtotal: summary.subtotal,
    fee: summary.fee,
    total: summary.total,
    status: "PENDING_PAYMENT",
    date: new Date().toLocaleString("id-ID"),
    receiverName,
    receiverPhone,
    address,
    requestPayload: {
      user_id: "USR001",
      items: state.checkoutSession.items.map(({ product, qty }) => ({
        product_id: product.id,
        qty,
      })),
      alamat_pengiriman: address,
    },
  };

  state.orders.unshift(order);
  saveOrders();

  if (state.checkoutSession.mode === "cart") {
    state.cart = [];
    saveCart();
  }

  showToast("Order berhasil dibuat!", "success");
  state.checkoutSession = null;
  navigate("order-status", { orderId: order.id });
}

function getOrderFromRoute() {
  const hash = window.location.hash || "#/orders";
  const path = hash.slice(1).split("?")[0];
  const parts = path.split("/");
  return parts.length > 2 ? state.orders.find((order) => order.id === decodeURIComponent(parts[2])) : null;
}

function renderOrdersRoute() {
  const path = (window.location.hash || "#/orders").slice(1).split("?")[0];
  if (path.startsWith("/orders/")) {
    renderOrderDetail(getOrderFromRoute());
  } else {
    renderOrderHistory();
  }
}

function renderOrderHistory() {
  const container = document.getElementById("order-status-container");

  if (!state.orders.length) {
    container.innerHTML = `
      <div class="status-card">
        <div class="empty-state">
          Anda belum memiliki pesanan aktif. Mulai berbelanja sekarang.
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="page-title split-title">
      <div>
        <h1>Riwayat Order</h1>
        <p>Daftar request checkout yang dibuat dari marketplace.</p>
      </div>
      <button class="btn btn-secondary" type="button" data-back-products>Belanja Lagi</button>
    </div>
    <div class="order-list">
      ${state.orders
        .map(
          (order) => `
            <article class="order-card">
              <div>
                <strong>${escapeHtml(order.id)}</strong>
                <p>${escapeHtml(order.date)} - ${order.items.length} produk</p>
              </div>
              <div class="order-card-side">
                <span class="status-badge ${statusClass(order.status)}">${statusLabel(order.status)}</span>
                <strong>${formatRp(order.total)}</strong>
                <button class="btn btn-secondary" type="button" data-order-detail="${order.id}">Detail</button>
              </div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderOrderDetail(order) {
  const container = document.getElementById("order-status-container");

  if (!order) {
    container.innerHTML = `
      <div class="status-card">
        <div class="empty-state">
          Order tidak ditemukan.
          <div class="status-actions">
            <button class="btn btn-secondary" type="button" data-orders-list>Kembali ke Riwayat</button>
          </div>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="order-detail-layout">
      <div class="order-detail-main">
        <div class="page-back">
          <button class="btn btn-secondary" type="button" data-orders-list>Kembali ke Riwayat</button>
        </div>
        <div class="status-card order-detail-card">
          <h2>Status Pesanan</h2>
          <div class="status-ref">Order ID: ${escapeHtml(order.id)}</div>
          <div class="status-badge-wrap">
            <span class="status-badge ${statusClass(order.status)}">${statusLabel(order.status)}</span>
          </div>
          <p class="status-desc">
            Payment request sudah dibuat. Marketplace hanya meneruskan request ke backend/API Gateway dan tidak mengubah saldo.
          </p>

          <div class="timeline">
            ${ORDER_FLOW.map(
              (status) => `
                <div class="timeline-step ${getTimelineClass(order.status, status)}">
                  <span></span>
                  <p>${statusLabel(status)}</p>
                </div>
              `
            ).join("")}
          </div>

          <div class="status-actions">
            ${
              order.status === "PENDING_PAYMENT" || order.status === "PAYMENT_PROCESSING"
                ? `<button class="btn btn-primary" type="button" data-simulate-payment="${order.id}">Simulasikan Bayar</button>`
                : ""
            }
            <button class="btn btn-secondary" type="button" data-refresh-status="${order.id}">Refresh Status</button>
            <button class="btn btn-secondary" type="button" data-back-products>Belanja Lagi</button>
          </div>
        </div>
      </div>

      <aside class="summary-card">
        <h2>Detail Order</h2>
        <div class="order-items">
          ${order.items
            .map(
              (item) => `
                <div class="order-item-row">
                  <span>${escapeHtml(item.name)} x${item.qty}</span>
                  <strong>${formatRp(item.price * item.qty)}</strong>
                </div>
              `
            )
            .join("")}
        </div>
        <div class="summary-row">
          <span>Subtotal</span>
          <strong>${formatRp(order.subtotal)}</strong>
        </div>
        <div class="summary-row fee">
          <span>Biaya Layanan 2%</span>
          <strong>${formatRp(order.fee)}</strong>
        </div>
        <div class="summary-total">
          <span>Total</span>
          <span>${formatRp(order.total)}</span>
        </div>
        <div class="shipping-box">
          <strong>Alamat Pengiriman</strong>
          <p>${escapeHtml(order.receiverName)} - ${escapeHtml(order.receiverPhone)}</p>
          <p>${escapeHtml(order.address)}</p>
        </div>
      </aside>
    </div>
  `;
}

function getTimelineClass(currentStatus, stepStatus) {
  const currentIndex = ORDER_FLOW.indexOf(currentStatus);
  const stepIndex = ORDER_FLOW.indexOf(stepStatus);

  if (currentStatus === "PAYMENT_FAILED" || currentStatus === "CANCELLED") {
    return stepStatus === currentStatus ? "active failed" : "";
  }

  if (stepIndex < currentIndex) return "done";
  if (stepIndex === currentIndex) return "active";
  return "";
}

function advanceOrderStatus(orderId) {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return;

  const currentIndex = ORDER_FLOW.indexOf(order.status);
  if (currentIndex >= 0 && currentIndex < ORDER_FLOW.length - 1) {
    order.status = ORDER_FLOW[currentIndex + 1];
    saveOrders();
    showToast("Status order diperbarui", "success");
  } else {
    showToast("Status order sudah final", "info");
  }

  renderOrderDetail(order);
}

function simulatePayment(orderId) {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return;
  order.status = "PAID";
  saveOrders();
  showToast("Pembayaran berhasil diverifikasi!", "success");
  renderOrderDetail(order);
}

function renderSellerTable() {
  const tbody = document.getElementById("seller-table-body");
  const search = document.getElementById("seller-search")?.value.toLowerCase() || "";
  const statusFilter = document.getElementById("seller-status-filter")?.value || "all";
  renderSellerStats();

  let products = state.products;
  if (search) {
    products = products.filter((product) =>
      `${product.name} ${product.category} ${product.id}`.toLowerCase().includes(search)
    );
  }
  if (statusFilter !== "all") {
    products = products.filter((product) => product.status === statusFilter);
  }

  if (!products.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="table-empty">
            Tidak ada produk seller yang cocok dengan search atau filter status.
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = products
    .map(
      (product) => `
        <tr>
          <td>
            <strong>${escapeHtml(product.name)}</strong>
            <div class="table-subtext">ID: ${escapeHtml(product.id)}</div>
          </td>
          <td><span class="category-badge">${escapeHtml(product.category)}</span></td>
          <td><strong>${formatRp(product.price)}</strong></td>
          <td>${product.stock}</td>
          <td><span class="status-badge ${product.status}">${product.status.toUpperCase()}</span></td>
          <td>
            <button class="action-link" type="button" data-edit-product="${product.id}">Edit</button>
            ${
              product.status !== "nonaktif"
                ? `<button class="action-link danger" type="button" data-toggle-product="${product.id}" data-next-status="nonaktif">Nonaktifkan</button>`
                : `<button class="action-link activate" type="button" data-toggle-product="${product.id}" data-next-status="aktif">Aktifkan</button>`
            }
          </td>
        </tr>
      `
    )
    .join("");
}

function renderSellerStats() {
  const container = document.getElementById("seller-stats");
  if (!container) return;

  const stats = getSellerStats();
  container.innerHTML = `
    <div class="seller-stat-card">
      <span>Total Produk</span>
      <strong>${stats.total}</strong>
    </div>
    <div class="seller-stat-card">
      <span>Produk Aktif</span>
      <strong>${stats.active}</strong>
    </div>
    <div class="seller-stat-card">
      <span>Produk Nonaktif</span>
      <strong>${stats.inactive}</strong>
    </div>
    <div class="seller-stat-card">
      <span>Stok Habis</span>
      <strong>${stats.empty}</strong>
    </div>
  `;
}

function toggleStatus(id, newStatus) {
  const product = getProduct(id);
  if (!product) return;

  if (newStatus === "nonaktif") {
    const confirmed = window.confirm("Nonaktifkan produk dari katalog publik?");
    if (!confirmed) return;
  }

  if (newStatus === "aktif" && product.stock === 0) {
    product.status = "stok-habis";
  } else {
    product.status = newStatus;
  }

  showToast(`Status produk diperbarui menjadi ${product.status}`, "info");
  renderSellerTable();
  renderProductGrid();
}

function getProductFormDraft() {
  const name = document.getElementById("modal-name")?.value.trim() || "Nama produk";
  const category = document.getElementById("modal-category")?.value || "Makanan";
  const price = Number(document.getElementById("modal-price")?.value || 0);
  const stock = Number(document.getElementById("modal-stock")?.value || 0);
  const desc =
    document.getElementById("modal-desc")?.value.trim() ||
    "Deskripsi produk akan tampil di sini sebelum produk disimpan.";

  return { name, category, price, stock, desc };
}

function renderProductPreview() {
  const preview = document.getElementById("product-form-preview");
  if (!preview) return;

  const draft = getProductFormDraft();
  const stockClass = draft.stock > 0 ? "available" : "empty";
  const stockLabel = draft.stock > 0 ? `Tersedia (${draft.stock} stok)` : "Stok Habis";

  preview.innerHTML = `
    <div class="preview-label">Preview Produk</div>
    <div class="preview-card">
      <div class="preview-image">Gambar</div>
      <div class="preview-content">
        <span class="category-badge">${escapeHtml(draft.category)}</span>
        <h4>${escapeHtml(draft.name)}</h4>
        <span class="stock-badge ${stockClass}">${stockLabel}</span>
        <p>${escapeHtml(draft.desc)}</p>
        <strong>${formatRp(draft.price)}</strong>
      </div>
    </div>
  `;
}

function openProductModal(id = null) {
  const modal = document.getElementById("product-modal");
  const title = document.getElementById("modal-title");
  const form = document.getElementById("product-form");

  form.reset();
  document.getElementById("modal-product-id").value = "";

  if (id) {
    title.textContent = "Edit Produk";
    const product = getProduct(id);
    if (product) {
      document.getElementById("modal-product-id").value = product.id;
      document.getElementById("modal-name").value = product.name;
      document.getElementById("modal-category").value = product.category;
      document.getElementById("modal-price").value = product.price;
      document.getElementById("modal-stock").value = product.stock;
      document.getElementById("modal-desc").value = product.desc;
    }
  } else {
    title.textContent = "Tambah Produk Baru";
  }

  modal.classList.add("active");
  renderProductPreview();
  document.getElementById("modal-name").focus();
}

function closeProductModal() {
  document.getElementById("product-modal").classList.remove("active");
}

function saveProduct() {
  const form = document.getElementById("product-form");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const id = document.getElementById("modal-product-id").value;
  const name = document.getElementById("modal-name").value.trim();
  const category = document.getElementById("modal-category").value;
  const price = Number(document.getElementById("modal-price").value);
  const stock = Number(document.getElementById("modal-stock").value);
  const desc = document.getElementById("modal-desc").value.trim();
  const status = stock > 0 ? "aktif" : "stok-habis";

  if (id) {
    const index = state.products.findIndex((item) => item.id === id);
    if (index > -1) {
      state.products[index] = {
        ...state.products[index],
        name,
        category,
        price,
        stock,
        desc,
        status,
      };
      showToast("Produk berhasil diperbarui!", "success");
    }
  } else {
    const nextId = `P${String(state.products.length + 1).padStart(3, "0")}`;
    state.products.unshift({
      id: nextId,
      name,
      category,
      price,
      stock,
      desc,
      status,
      sellerId: "SELLER001",
      sellerName: getSellerProfile("SELLER001").name,
      createdAt: new Date().toISOString(),
    });
    showToast("Produk baru ditambahkan!", "success");
  }

  closeProductModal();
  renderSellerTable();
  renderProductGrid();
}

function readDetailQty(productId) {
  const qtyInput = document.getElementById("detail-qty");
  const product = getProduct(productId);
  const qty = Number(qtyInput.value);
  const message = document.getElementById("detail-qty-message");

  if (!validateQty(product, qty)) {
    message.textContent = "Kuantitas harus lebih dari 0 dan tidak boleh melebihi stok.";
    return null;
  }

  message.textContent = "";
  return qty;
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const pageLink = event.target.closest("[data-page]");
    if (pageLink) {
      event.preventDefault();
      navigate(pageLink.dataset.page);
      return;
    }

    const roleLogin = event.target.closest("[data-role-login]");
    if (roleLogin) {
      loginAsRole(roleLogin.dataset.roleLogin);
      return;
    }

    const roleOption = event.target.closest("[data-role-option]");
    if (roleOption) {
      setLoginRole(roleOption.dataset.roleOption);
      return;
    }

    if (event.target.closest("[data-submit-login]")) {
      loginAsRole();
      return;
    }

    if (event.target.closest("[data-submit-register]")) {
      registerAccount();
      return;
    }

    if (event.target.closest("[data-login-required]")) {
      promptLoginForShopping();
      return;
    }

    if (event.target.closest("[data-global-search]")) {
      runGlobalSearch();
      return;
    }

    if (event.target.closest("[data-logout]")) {
      logout();
      return;
    }

    const detailButton = event.target.closest("[data-detail-id]");
    if (detailButton) {
      viewProductDetail(detailButton.dataset.detailId);
      return;
    }

    const storeLink = event.target.closest("[data-store-id]");
    if (storeLink) {
      renderStoreProfile(storeLink.dataset.storeId);
      return;
    }

    const addCart = event.target.closest("[data-add-cart]");
    if (addCart) {
      addToCart(addCart.dataset.addCart);
      return;
    }

    const categoryChip = event.target.closest("[data-category-chip]");
    if (categoryChip) {
      document.getElementById("filter-category").value = categoryChip.dataset.categoryChip;
      resetProductVisibleCount();
      renderProductGrid();
      return;
    }

    if (event.target.closest("[data-reset-filters]")) {
      resetProductFilters();
      return;
    }

    if (event.target.closest("[data-load-more-products]")) {
      state.productVisibleCount += PRODUCT_PAGE_SIZE;
      renderProductGrid();
      return;
    }

    const detailAddCart = event.target.closest("[data-detail-add-cart]");
    if (detailAddCart) {
      const qty = readDetailQty(detailAddCart.dataset.detailAddCart);
      if (qty) addToCart(detailAddCart.dataset.detailAddCart, qty);
      return;
    }

    const checkoutButton = event.target.closest("[data-checkout-id]");
    if (checkoutButton) {
      initCheckout(checkoutButton.dataset.checkoutId);
      return;
    }

    const detailCheckout = event.target.closest("[data-detail-checkout]");
    if (detailCheckout) {
      const qty = readDetailQty(detailCheckout.dataset.detailCheckout);
      if (qty) initCheckout(detailCheckout.dataset.detailCheckout, qty);
      return;
    }

    const checkoutCart = event.target.closest("[data-checkout-cart]");
    if (checkoutCart) {
      initCartCheckout();
      return;
    }

    const removeCart = event.target.closest("[data-remove-cart]");
    if (removeCart) {
      removeCartItem(removeCart.dataset.removeCart);
      return;
    }

    const orderDetail = event.target.closest("[data-order-detail]");
    if (orderDetail) {
      navigate("order-status", { orderId: orderDetail.dataset.orderDetail });
      return;
    }

    const ordersList = event.target.closest("[data-orders-list]");
    if (ordersList) {
      navigate("order-status");
      return;
    }

    if (event.target.closest("[data-back-products]")) {
      navigate("product-list");
      return;
    }

    if (event.target.closest("[data-focus-catalog]")) {
      document.getElementById("search-input")?.focus();
      document.getElementById("search-input")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (event.target.closest("[data-open-product-modal]")) {
      openProductModal();
      return;
    }

    if (event.target.closest("[data-close-modal]")) {
      closeProductModal();
      return;
    }

    const editProduct = event.target.closest("[data-edit-product]");
    if (editProduct) {
      openProductModal(editProduct.dataset.editProduct);
      return;
    }

    const toggleProduct = event.target.closest("[data-toggle-product]");
    if (toggleProduct) {
      toggleStatus(toggleProduct.dataset.toggleProduct, toggleProduct.dataset.nextStatus);
      return;
    }

    if (event.target.closest("[data-save-product]")) {
      saveProduct();
      return;
    }

    const simulatePaymentButton = event.target.closest("[data-simulate-payment]");
    if (simulatePaymentButton) {
      simulatePayment(simulatePaymentButton.dataset.simulatePayment);
      return;
    }

    const refreshStatus = event.target.closest("[data-refresh-status]");
    if (refreshStatus) {
      advanceOrderStatus(refreshStatus.dataset.refreshStatus);
    }
  });

  document.addEventListener("input", (event) => {
    if (
      event.target.id === "search-input" ||
      event.target.id === "filter-min-price" ||
      event.target.id === "filter-max-price"
    ) {
      resetProductVisibleCount();
      renderProductGrid();
    }
    if (event.target.id === "seller-search") renderSellerTable();
    if (event.target.closest("#product-form")) renderProductPreview();
  });

  document.addEventListener("change", (event) => {
    if (
      event.target.id === "filter-category" ||
      event.target.id === "filter-seller" ||
      event.target.id === "filter-stock" ||
      event.target.id === "sort-price"
    ) {
      resetProductVisibleCount();
      renderProductGrid();
    }
    if (event.target.matches("[data-cart-qty]")) {
      updateCartQty(event.target.dataset.cartQty, Number(event.target.value));
    }
    if (event.target.id === "seller-status-filter") renderSellerTable();
    if (event.target.closest("#product-form")) renderProductPreview();
  });

  document.getElementById("checkout-form").addEventListener("submit", handleCheckoutSubmit);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProductModal();
    if (event.key === "Enter" && event.target.id === "global-search-input") {
      event.preventDefault();
      runGlobalSearch();
    }
  });

  window.addEventListener("hashchange", syncRouteFromHash);
}

function init() {
  app.innerHTML = shellTemplate();
  bindEvents();
  updateCartCount();
  renderNav();

  if (!window.location.hash) {
    window.location.hash = "#/";
  } else {
    syncRouteFromHash();
  }

  renderProductGrid();
}

init();
