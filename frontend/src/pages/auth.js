import { consumePendingRoute, login, register } from "../utils/storage.js";
import { escapeHtml, toast } from "../utils/ui.js";

export function render({ path }) {
  const isRegister = path === "/register";
  return `
    <section class="auth-page">
      <article class="auth-visual">
        <a class="brand auth-brand" href="#/"><span class="brand-mark"><span data-lucide="shopping-bag"></span></span><span>Pasar<span>Kita</span></span></a>
        <div><span class="eyebrow light">Marketplace untuk semua</span><h1>${isRegister ? "Mulai pengalaman belanja yang lebih personal." : "Selamat datang kembali di PasarKita."}</h1><p>Belanja aman, pantau pesanan, dan temukan promo yang dibuat khusus untukmu.</p><div class="auth-features"><span><i data-lucide="shield-check"></i>Transaksi terlindungi</span><span><i data-lucide="truck"></i>Pengiriman transparan</span><span><i data-lucide="badge-percent"></i>Promo setiap hari</span></div></div>
      </article>
      <div class="auth-form-wrap">
        <form class="auth-card" id="auth-form">
          <span class="eyebrow">${isRegister ? "Buat akun baru" : "Masuk ke akunmu"}</span><h2>${isRegister ? "Daftar PasarKita" : "Selamat datang"}</h2><p>${isRegister ? "Isi data singkat untuk mulai berbelanja." : "Gunakan email apa saja untuk demo. Email dengan kata seller akan membuka akun seller."}</p>
          ${isRegister ? `<label><span>Nama lengkap</span><input name="name" autocomplete="name" required placeholder="Contoh: Raka Pratama" /></label>` : ""}
          <label><span>Email</span><input name="email" type="email" autocomplete="email" required placeholder="nama@email.com" /></label>
          <label><span>Password</span><input name="password" type="password" minlength="6" required placeholder="Minimal 6 karakter" /></label>
          ${isRegister ? `<label><span>Nomor telepon</span><input name="phone" autocomplete="tel" required placeholder="08xxxxxxxxxx" /></label><label><span>Tipe akun</span><select name="role"><option value="buyer">Pembeli</option><option value="seller">Seller</option></select></label>` : `<div class="auth-helper"><label><input type="checkbox" checked /> Ingat saya</label><button type="button">Lupa password?</button></div>`}
          <small class="form-error" id="auth-error"></small>
          <button class="btn btn-primary full" type="submit">${isRegister ? "Daftar Sekarang" : "Masuk"}</button>
          <div class="auth-divider"><span>atau</span></div>
          <a class="btn btn-secondary full" href="${isRegister ? "#/login" : "#/register"}">${isRegister ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}</a>
          ${!isRegister ? `<button class="demo-login" type="button" id="demo-login"><span data-lucide="zap"></span>Masuk cepat sebagai buyer demo</button>` : ""}
        </form>
      </div>
    </section>
  `;
}

export function afterRender({ path, navigate }) {
  const isRegister = path === "/register";
  const form = document.querySelector("#auth-form");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    if (String(data.password).length < 6) {
      document.querySelector("#auth-error").textContent = "Password minimal 6 karakter.";
      return;
    }
    const user = isRegister ? register(data) : login(data.email);
    toast(isRegister ? `Akun ${escapeHtml(user.name)} berhasil dibuat.` : `Selamat datang kembali, ${escapeHtml(user.name)}.`);
    navigate(consumePendingRoute());
  });
  document.querySelector("#demo-login")?.addEventListener("click", () => {
    login("buyer@pasarkita.demo");
    toast("Login sebagai buyer demo berhasil.");
    navigate(consumePendingRoute());
  });
}
