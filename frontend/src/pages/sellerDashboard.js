import { products } from "../data/products.js";
import { formatCurrency, formatNumber } from "../utils/formatCurrency.js";
import { escapeHtml, toast } from "../utils/ui.js";

const sellerProducts = products.filter((product) => product.store.id === "nusa-tech");

export function render() {
  return `
    <section class="seller-shell">
      <aside class="seller-sidebar"><a class="brand" href="#/"><span class="brand-mark"><span data-lucide="shopping-bag"></span></span><span>Pasar<span>Kita</span></span></a><div><small>MENU UTAMA</small><a class="active"><span data-lucide="layout-dashboard"></span>Ringkasan</a><a><span data-lucide="package"></span>Produk Saya</a><a><span data-lucide="receipt-text"></span>Pesanan Masuk <b>12</b></a><a><span data-lucide="wallet-cards"></span>Keuangan</a><a><span data-lucide="bar-chart-3"></span>Analitik</a></div><div><small>PENGATURAN</small><a><span data-lucide="store"></span>Profil Toko</a><a href="#/"><span data-lucide="arrow-left"></span>Kembali ke Marketplace</a></div></aside>
      <main class="seller-main">
        <div class="seller-topbar"><div><span class="eyebrow">Pusat Seller</span><h1>Selamat datang, Nusa Techspace</h1><p>Berikut performa tokomu hari ini.</p></div><button class="btn btn-primary" id="add-product-demo"><span data-lucide="plus"></span>Tambah Produk</button></div>
        <div class="seller-stats"><article><span data-lucide="circle-dollar-sign"></span><div><small>Pendapatan Bulan Ini</small><strong>${formatCurrency(28750000)}</strong><em>+18,4% dari bulan lalu</em></div></article><article><span data-lucide="receipt-text"></span><div><small>Pesanan Masuk</small><strong>128</strong><em>12 perlu diproses</em></div></article><article><span data-lucide="package"></span><div><small>Total Produk</small><strong>${sellerProducts.length}</strong><em>Semua aktif</em></div></article><article><span data-lucide="star"></span><div><small>Rating Toko</small><strong>4.9</strong><em>Dari 1.824 ulasan</em></div></article></div>
        <section class="seller-grid-main">
          <article class="seller-panel seller-chart"><div class="seller-panel-heading"><div><h2>Performa Penjualan</h2><p>Ringkasan omzet 7 hari terakhir.</p></div><select><option>7 Hari Terakhir</option></select></div><div class="bar-chart">${[42, 58, 46, 72, 64, 88, 76].map((height, index) => `<div><span style="height:${height}%"></span><small>${["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"][index]}</small></div>`).join("")}</div></article>
          <article class="seller-panel"><div class="seller-panel-heading"><div><h2>Status Pesanan</h2><p>Perlu perhatian tokomu.</p></div></div><div class="seller-order-status"><span><i data-lucide="credit-card"></i><b>8</b><small>Perlu Dibayar</small></span><span><i data-lucide="package"></i><b>12</b><small>Perlu Dikemas</small></span><span><i data-lucide="truck"></i><b>24</b><small>Dalam Pengiriman</small></span><span><i data-lucide="package-check"></i><b>84</b><small>Selesai</small></span></div></article>
        </section>
        <section class="seller-panel"><div class="seller-panel-heading"><div><h2>Produk Toko</h2><p>Kelola stok dan performa produk aktif.</p></div><button class="btn btn-secondary">Lihat Semua</button></div><div class="seller-table"><div class="seller-table-row header"><span>Produk</span><span>Harga</span><span>Stok</span><span>Terjual</span><span>Status</span></div>${sellerProducts.map((product) => `<div class="seller-table-row"><span class="seller-product"><img src="${product.image}" alt="" /><b>${escapeHtml(product.name)}</b></span><span>${formatCurrency(product.price)}</span><span>${product.stock}</span><span>${formatNumber(product.sold)}</span><span><em class="status-pill success">Aktif</em></span></div>`).join("")}</div></section>
      </main>
    </section>
  `;
}

export function afterRender() {
  document.querySelector("#add-product-demo")?.addEventListener("click", () => toast("Form tambah produk akan tersedia saat backend seller dihubungkan.", "info"));
}
