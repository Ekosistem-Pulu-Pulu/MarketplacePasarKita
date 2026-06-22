import { SellerStats } from "../components/SellerStats.js";
import { SellerTable } from "../components/SellerTable.js";
import { categories } from "../data/categories.js";
import { addSellerProduct, getSellerDashboard } from "../services/sellerService.js";
import { formatCurrency, formatNumber } from "../utils/formatCurrency.js";
import { getSellerApplication, getUser, saveSellerApplication } from "../utils/storage.js";
import { sellerApplicationSchema, sellerProductSchema, showFormErrors, validate } from "../utils/validator.js";
import { escapeHtml, toast } from "../utils/ui.js";

function sidebar() {
  return `
    <aside class="seller-sidebar" id="seller-sidebar">
      <button class="seller-sidebar-close" id="seller-menu-close" type="button" aria-label="Tutup menu"><span data-lucide="x"></span></button>
      <a class="brand" href="#/"><span class="brand-mark"><span data-lucide="shopping-bag"></span></span><span>Pasar<span>Kita</span></span></a>
      <div><small>MENU UTAMA</small><a class="active"><span data-lucide="layout-dashboard"></span>Ringkasan</a><a><span data-lucide="package"></span>Produk Saya</a><a><span data-lucide="receipt-text"></span>Pesanan Masuk <b>12</b></a><a><span data-lucide="wallet-cards"></span>Keuangan</a><a><span data-lucide="bar-chart-3"></span>Analitik</a></div>
      <div><small>PENGATURAN</small><a><span data-lucide="store"></span>Profil Toko</a><a href="#/"><span data-lucide="arrow-left"></span>Kembali ke Marketplace</a></div>
    </aside>
  `;
}

function productModal() {
  return `
    <dialog class="modal" id="product-modal">
      <div class="modal-box seller-product-modal">
        <form method="dialog"><button class="btn btn-sm btn-circle btn-ghost absolute right-4 top-4" aria-label="Tutup">x</button></form>
        <span class="eyebrow">Katalog seller</span>
        <h3 class="text-2xl font-bold">Tambah Produk Baru</h3>
        <p class="text-sm text-slate-500">Produk baru akan langsung masuk ke tabel toko.</p>
        <form id="seller-product-form" class="seller-product-form" novalidate>
          <label><span>Nama produk</span><input class="input input-bordered" name="name" placeholder="Contoh: Smart Lamp Pro" /><small class="form-error" data-error-for="name"></small></label>
          <label><span>Kategori</span><select class="select select-bordered" name="categoryId"><option value="">Pilih kategori</option>${categories.map((category) => `<option value="${category.id}">${category.name}</option>`).join("")}</select><small class="form-error" data-error-for="categoryId"></small></label>
          <label><span>Harga</span><input class="input input-bordered" name="price" type="number" placeholder="199000" /><small class="form-error" data-error-for="price"></small></label>
          <label><span>Stok awal</span><input class="input input-bordered" name="stock" type="number" placeholder="25" /><small class="form-error" data-error-for="stock"></small></label>
          <label class="wide"><span>Deskripsi</span><textarea class="textarea textarea-bordered" name="description" rows="4" placeholder="Jelaskan manfaat dan spesifikasi produk."></textarea><small class="form-error" data-error-for="description"></small></label>
          <div class="modal-action wide"><button type="button" class="btn btn-ghost" id="cancel-product">Batal</button><button class="btn btn-primary" type="submit"><span data-lucide="plus"></span>Tambah Produk</button></div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button>Tutup</button></form>
    </dialog>
  `;
}

function applicationStatus(application) {
  if (!application) return "";
  const submittedAt = new Date(application.submittedAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
  return `
    <section class="seller-apply-page">
      <a class="brand seller-apply-brand" href="#/"><span class="brand-mark"><span data-lucide="shopping-bag"></span></span><span>Pasar<span>Kita</span></span></a>
      <article class="seller-apply-card seller-apply-status">
        <span class="status-icon"><span data-lucide="hourglass"></span></span>
        <span class="eyebrow">Pengajuan sedang ditinjau</span>
        <h1>Pengajuan toko ${escapeHtml(application.storeName)} sudah diterima.</h1>
        <p>Tim PasarKita sedang memverifikasi data toko, alamat pickup, dan kategori usaha. Kamu akan mendapat pemberitahuan setelah proses review selesai.</p>
        <div class="seller-apply-summary">
          <span><small>Status</small><strong>Menunggu Review</strong></span>
          <span><small>Tanggal pengajuan</small><strong>${submittedAt}</strong></span>
          <span><small>Kategori</small><strong>${escapeHtml(application.businessCategory)}</strong></span>
        </div>
        <div class="seller-apply-actions">
          <a class="btn btn-primary" href="#/products">Kembali Belanja</a>
          <a class="btn btn-secondary" href="#/profile">Lihat Profil</a>
        </div>
      </article>
    </section>
  `;
}

function sellerApplicationForm(user) {
  return `
    <section class="seller-apply-page">
      <a class="brand seller-apply-brand" href="#/"><span class="brand-mark"><span data-lucide="shopping-bag"></span></span><span>Pasar<span>Kita</span></span></a>
      <article class="seller-apply-hero">
        <span class="eyebrow light">Pendaftaran penjual</span>
        <h1>Ajukan toko dan mulai berjualan di PasarKita.</h1>
        <p>Lengkapi data toko agar tim PasarKita dapat memverifikasi kesiapan operasional, alamat pickup, dan kategori produkmu.</p>
        <div class="seller-apply-points">
          <span><i data-lucide="shield-check"></i>Verifikasi data toko</span>
          <span><i data-lucide="package-check"></i>Alamat pickup jelas</span>
          <span><i data-lucide="badge-check"></i>Review sebelum aktif</span>
        </div>
      </article>
      <form class="seller-apply-card seller-application-form" id="seller-application-form" novalidate>
        <span class="eyebrow">Data toko</span>
        <h2>Form pengajuan penjual</h2>
        <p>Akun aktif: <strong>${escapeHtml(user.name)}</strong> · ${escapeHtml(user.email)}</p>
        <div class="seller-apply-grid">
          <label><span>Nama toko</span><input name="storeName" class="input input-bordered" placeholder="Contoh: Nusa Techspace" /><small class="form-error" data-error-for="storeName"></small></label>
          <label><span>Kategori utama</span><select name="businessCategory" class="select select-bordered"><option value="">Pilih kategori</option>${categories.map((category) => `<option value="${category.name}">${category.name}</option>`).join("")}</select><small class="form-error" data-error-for="businessCategory"></small></label>
          <label><span>Kota asal toko</span><input name="city" class="input input-bordered" placeholder="Contoh: Bandung" /><small class="form-error" data-error-for="city"></small></label>
          <label><span>Nomor WhatsApp bisnis</span><input name="businessPhone" class="input input-bordered" placeholder="08xxxxxxxxxx" /><small class="form-error" data-error-for="businessPhone"></small></label>
          <label class="wide"><span>Alamat pickup</span><textarea name="pickupAddress" class="textarea textarea-bordered" rows="3" placeholder="Tulis alamat lengkap untuk pickup kurir."></textarea><small class="form-error" data-error-for="pickupAddress"></small></label>
          <label class="wide"><span>Deskripsi toko</span><textarea name="storeDescription" class="textarea textarea-bordered" rows="4" placeholder="Jelaskan produk yang dijual, kapasitas operasional, dan keunggulan toko."></textarea><small class="form-error" data-error-for="storeDescription"></small></label>
        </div>
        <label class="seller-apply-agreement"><input type="checkbox" name="agreement" /> <span>Saya menyatakan data toko benar dan bersedia mengikuti ketentuan penjual PasarKita.</span></label>
        <small class="form-error" data-error-for="agreement"></small>
        <button class="btn btn-primary full" type="submit"><span data-lucide="send"></span>Kirim Pengajuan</button>
      </form>
    </section>
  `;
}

export async function render() {
  const activeUser = getUser();
  if (activeUser?.role !== "seller") {
    const application = getSellerApplication();
    return application ? applicationStatus(application) : sellerApplicationForm(activeUser);
  }
  const dashboard = await getSellerDashboard();
  const sellerName = activeUser.name;
  return `
    <section class="seller-shell">
      <div class="seller-sidebar-backdrop" id="seller-sidebar-backdrop"></div>
      ${sidebar()}
      <main class="seller-main">
        <div class="seller-topbar"><button class="seller-menu-toggle" id="seller-menu-toggle" type="button" aria-label="Buka menu seller"><span data-lucide="menu"></span></button><div><span class="eyebrow">Pusat Seller</span><h1>Selamat datang, ${escapeHtml(sellerName)}</h1><p>Berikut performa tokomu hari ini.</p></div><button class="btn btn-primary" id="add-product-action"><span data-lucide="plus"></span>Tambah Produk</button></div>
        ${SellerStats(dashboard.stats)}
        <section class="seller-chart-grid">
          <article class="seller-panel seller-chart-panel"><div class="seller-panel-heading"><div><h2>Penjualan Mingguan</h2><p>Omzet selama tujuh hari terakhir.</p></div><span class="badge badge-success badge-outline">+18,4%</span></div><div class="chart-wrap"><canvas id="sales-chart"></canvas></div></article>
          <article class="seller-panel seller-chart-panel"><div class="seller-panel-heading"><div><h2>Kategori Terlaris</h2><p>Kontribusi penjualan produk.</p></div></div><div class="chart-wrap"><canvas id="category-chart"></canvas></div></article>
        </section>
        <section class="seller-table-grid">
          ${SellerTable({ id: "seller-products-table", title: "Daftar Produk Toko", description: "Kelola stok dan performa produk aktif." })}
          ${SellerTable({ id: "seller-orders-table", title: "Pesanan Terbaru", description: "Pantau pesanan masuk dan status pemenuhannya." })}
        </section>
      </main>
      ${productModal()}
    </section>
  `;
}

function renderCharts(Chart, data) {
  new Chart(document.querySelector("#sales-chart"), {
    type: "line",
    data: { labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"], datasets: [{ label: "Omzet", data: data.weeklySales, borderColor: "#0f766e", backgroundColor: "rgba(20, 184, 166, .14)", fill: true, tension: 0.38, pointRadius: 4 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { ticks: { callback: (value) => `${value / 1000000}jt` }, grid: { color: "#eef2f7" } }, x: { grid: { display: false } } } },
  });
  new Chart(document.querySelector("#category-chart"), {
    type: "doughnut",
    data: { labels: ["Elektronik", "Aksesoris", "Rumah Tangga", "Lainnya"], datasets: [{ data: data.categorySales, backgroundColor: ["#0f766e", "#2563eb", "#f59e0b", "#cbd5e1"], borderWidth: 0 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: "68%", plugins: { legend: { position: "bottom", labels: { usePointStyle: true, padding: 16 } } } },
  });
}

function renderTables(Tabulator, data) {
  const productTable = new Tabulator("#seller-products-table", {
    data: data.products,
    layout: "fitColumns",
    responsiveLayout: "collapse",
    pagination: true,
    paginationSize: 5,
    columns: [
      { title: "Produk", field: "name", minWidth: 220 },
      { title: "Harga", field: "price", formatter: (cell) => formatCurrency(cell.getValue()) },
      { title: "Stok", field: "stock", hozAlign: "center" },
      { title: "Terjual", field: "sold", formatter: (cell) => formatNumber(cell.getValue()) },
      { title: "Status Stok", field: "stock", formatter: (cell) => cell.getValue() < 25 ? '<span class="status-pill warning">Stok Menipis</span>' : '<span class="status-pill success">Tersedia</span>' },
    ],
  });
  new Tabulator("#seller-orders-table", {
    data: data.orders,
    layout: "fitColumns",
    responsiveLayout: "collapse",
    pagination: true,
    paginationSize: 5,
    columns: [
      { title: "ID Pesanan", field: "id", minWidth: 150 },
      { title: "Pembeli", field: "buyer" },
      { title: "Total", field: "total", formatter: (cell) => formatCurrency(cell.getValue()) },
      { title: "Status", field: "status", formatter: (cell) => `<span class="status-pill info">${cell.getValue()}</span>` },
    ],
  });
  return productTable;
}

export async function afterRender({ refreshIcons, renderRoute }) {
  const activeUser = getUser();
  if (activeUser?.role !== "seller") {
    const form = document.querySelector("#seller-application-form");
    form?.addEventListener("submit", (event) => {
      event.preventDefault();
      const payload = Object.fromEntries(new FormData(form).entries());
      const result = validate(sellerApplicationSchema, payload);
      showFormErrors(form, result.errors);
      if (!result.success) {
        toast("Form pengajuan belum valid. Periksa kembali data toko.", "error");
        return;
      }
      saveSellerApplication(result.data);
      toast("Pengajuan penjual berhasil dikirim.");
      renderRoute();
    });
    refreshIcons();
    return;
  }
  const [{ default: Chart }, { TabulatorFull: Tabulator }] = await Promise.all([
    import("chart.js/auto"),
    import("tabulator-tables"),
  ]);
  let dashboard = await getSellerDashboard();
  renderCharts(Chart, dashboard);
  const productTable = renderTables(Tabulator, dashboard);
  const modal = document.querySelector("#product-modal");
  const shell = document.querySelector(".seller-shell");
  const closeMenu = () => shell?.classList.remove("is-menu-open");
  document.querySelector("#seller-menu-toggle")?.addEventListener("click", () => shell?.classList.add("is-menu-open"));
  document.querySelector("#seller-menu-close")?.addEventListener("click", closeMenu);
  document.querySelector("#seller-sidebar-backdrop")?.addEventListener("click", closeMenu);
  document.querySelector("#seller-sidebar")?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.querySelector("#add-product-action")?.addEventListener("click", () => modal.showModal());
  document.querySelector("#cancel-product")?.addEventListener("click", () => modal.close());
  document.querySelector("#seller-product-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const result = validate(sellerProductSchema, payload);
    showFormErrors(event.currentTarget, result.errors);
    if (!result.success) {
      toast("Form produk belum valid.", "error");
      return;
    }
    const category = categories.find((item) => item.id === result.data.categoryId);
    try {
      await addSellerProduct({ ...result.data, category: category.name });
      dashboard = await getSellerDashboard();
      productTable.setData(dashboard.products);
      modal.close();
      event.currentTarget.reset();
      toast("Produk baru berhasil ditambahkan.");
      refreshIcons();
    } catch (error) {
      toast(error.message, "error");
    }
  });
}
