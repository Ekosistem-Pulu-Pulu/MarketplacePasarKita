import { getProfile, updateProfile } from "../services/accountService.js";
import { listOrders } from "../services/orderService.js";
import { formatCurrency } from "../utils/formatCurrency.js";
import { accountTypeLabel, dashboardHref, dashboardLabel, isAdmin, isBuyer } from "../utils/roles.js";
import { escapeHtml, toast } from "../utils/ui.js";

export async function render() {
  // listOrders sekarang return [] untuk akun non-buyer (admin/operasional),
  // sehingga stat pesanan aman untuk semua role. safeOrders tetap menjaga
  // defensive fallback jika backend mengembalikan payload non-array.
  const [user, orders] = await Promise.all([getProfile(), listOrders()]);
  const safeOrders = Array.isArray(orders) ? orders : [];
  const spending = safeOrders.reduce((total, order) => total + (order?.totals?.total || 0), 0);
  const accountLabel = dashboardLabel(user);
  const accountHref = dashboardHref(user);
  const accountType = accountTypeLabel(user.role);
  const ordersReady = isBuyer(user.role);
  return `
    <section class="profile-hero"><div class="container"><div class="profile-avatar">${escapeHtml(user.avatar)}</div><div><span class="eyebrow light">${isAdmin(user.role) ? "Tim Operasional PasarKita" : "Member PasarKita"}</span><h1>${escapeHtml(user.name)}</h1><p>${escapeHtml(user.email)} · ${escapeHtml(accountType)} · Bergabung sejak Juni 2026</p></div><a class="btn btn-accent" href="#/orders">Lihat Pesanan</a></div></section>
    <section class="container profile-stats"><div><span data-lucide="receipt-text"></span><p><strong>${safeOrders.length}</strong><small>Total pesanan</small></p></div><div><span data-lucide="wallet-cards"></span><p><strong>${formatCurrency(spending)}</strong><small>Total belanja</small></p></div><div><span data-lucide="ticket-percent"></span><p><strong>${isBuyer(user.role) ? "8" : "—"}</strong><small>Voucher tersedia</small></p></div><div><span data-lucide="star"></span><p><strong>${isBuyer(user.role) ? "1.250" : "—"}</strong><small>Poin reward</small></p></div></section>
    <section class="container profile-layout">
      <aside class="profile-menu-card"><a class="active"><span data-lucide="user"></span>Informasi Profil</a><a href="#/orders"><span data-lucide="package"></span>Pesanan Saya</a><a><span data-lucide="heart"></span>Wishlist</a><a><span data-lucide="ticket-percent"></span>Voucher Saya</a><a href="${accountHref}"><span data-lucide="store"></span>${accountLabel}</a></aside>
      <main>
        <form class="profile-card" id="profile-form"><div class="profile-card-heading"><div><h2>Informasi Pribadi</h2><p>Perbarui data yang digunakan untuk transaksi${isBuyer(user.role) ? "" : " dan operasional"}.</p></div><button class="btn btn-primary">Simpan Perubahan</button></div><div class="form-grid"><label><span>Nama lengkap</span><input name="name" value="${escapeHtml(user.name)}" required /></label><label><span>Email</span><input value="${escapeHtml(user.email)}" disabled /></label><label><span>Nomor telepon</span><input name="phone" value="${escapeHtml(user.phone)}" required /></label><label><span>Tipe akun</span><input value="${accountType}" disabled /></label></div></form>
        <section class="profile-card"><div class="profile-card-heading"><div><h2>${isBuyer(user.role) ? "Alamat Tersimpan" : "Informasi Akun"}</h2><p>${isBuyer(user.role) ? "Alamat utama untuk proses checkout." : "Alamat tidak berlaku untuk akun operasional. Hubungi platform admin untuk perubahan penugasan."}</p></div></div>${isBuyer(user.role) ? (user.addresses || []).map((address) => `<div class="address-card selected"><span class="address-label">${escapeHtml(address.label)}</span><strong>${escapeHtml(address.recipient)} · ${escapeHtml(address.phone)}</strong><p>${escapeHtml(address.address)}</p><span data-lucide="circle-check"></span></div>`).join("") : `<div class="empty-mini"><div class="empty-mini-icon"><span data-lucide="building-2"></span></div><div class="empty-mini-body"><h3>Akun operasional</h3><p>Akun ${escapeHtml(accountType)} tidak menggunakan alamat pengiriman pribadi. Gunakan dashboard admin untuk tugas operasional.</p></div></div>`}</section>
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
