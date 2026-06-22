import { getProfile, updateProfile } from "../services/accountService.js";
import { listOrders } from "../services/orderService.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { escapeHtml, toast } from "../utils/ui.js";

export async function render() {
  const [user, orders] = await Promise.all([getProfile(), listOrders()]);
  const spending = orders.reduce((total, order) => total + order.totals.total, 0);
  const sellerLabel = user.role === "seller" ? "Dashboard Seller" : "Ajukan Jadi Penjual";
  return `
    <section class="profile-hero"><div class="container"><div class="profile-avatar">${escapeHtml(user.avatar)}</div><div><span class="eyebrow light">Member PasarKita</span><h1>${escapeHtml(user.name)}</h1><p>${escapeHtml(user.email)} · Bergabung sejak Juni 2026</p></div><a class="btn btn-accent" href="#/orders">Lihat Pesanan</a></div></section>
    <section class="container profile-stats"><div><span data-lucide="receipt-text"></span><p><strong>${orders.length}</strong><small>Total pesanan</small></p></div><div><span data-lucide="wallet-cards"></span><p><strong>${formatCurrency(spending)}</strong><small>Total belanja</small></p></div><div><span data-lucide="ticket-percent"></span><p><strong>8</strong><small>Voucher tersedia</small></p></div><div><span data-lucide="star"></span><p><strong>1.250</strong><small>Poin reward</small></p></div></section>
    <section class="container profile-layout">
      <aside class="profile-menu-card"><a class="active"><span data-lucide="user"></span>Informasi Profil</a><a href="#/orders"><span data-lucide="package"></span>Pesanan Saya</a><a><span data-lucide="heart"></span>Wishlist</a><a><span data-lucide="ticket-percent"></span>Voucher Saya</a><a href="#/seller"><span data-lucide="store"></span>${sellerLabel}</a></aside>
      <main>
        <form class="profile-card" id="profile-form"><div class="profile-card-heading"><div><h2>Informasi Pribadi</h2><p>Perbarui data yang digunakan untuk transaksi.</p></div><button class="btn btn-primary">Simpan Perubahan</button></div><div class="form-grid"><label><span>Nama lengkap</span><input name="name" value="${escapeHtml(user.name)}" required /></label><label><span>Email</span><input value="${escapeHtml(user.email)}" disabled /></label><label><span>Nomor telepon</span><input name="phone" value="${escapeHtml(user.phone)}" required /></label><label><span>Tipe akun</span><input value="${user.role === "seller" ? "Seller" : "Pembeli"}" disabled /></label></div></form>
        <section class="profile-card"><div class="profile-card-heading"><div><h2>Alamat Tersimpan</h2><p>Alamat utama untuk proses checkout.</p></div><button class="btn btn-secondary">Tambah Alamat</button></div>${(user.addresses || []).map((address) => `<div class="address-card selected"><span class="address-label">${escapeHtml(address.label)}</span><strong>${escapeHtml(address.recipient)} · ${escapeHtml(address.phone)}</strong><p>${escapeHtml(address.address)}</p><span data-lucide="circle-check"></span></div>`).join("")}</section>
      </main>
    </section>
  `;
}

export function afterRender({ renderRoute }) {
  document.querySelector("#profile-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await updateProfile({ name: values.name, phone: values.phone });
      toast("Profil berhasil diperbarui.");
      renderRoute();
    } catch (error) {
      toast(error.message, "error");
    }
  });
}
