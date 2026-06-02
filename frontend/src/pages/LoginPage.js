import { showToast } from "../components/Toast.js";
import { loginUser } from "../services/authService.js";
import { isAuthenticated } from "../utils/storage.js";
import { escapeHtml } from "../utils/validation.js";

export async function render({ query }) {
  const redirectTo = query.get("redirect") || "/products";

  if (isAuthenticated()) {
    return `
      <section class="state-panel">
        <span class="state-icon" data-lucide="shield-check"></span>
        <h1>Session aktif</h1>
        <p>Akun kamu sudah masuk. Lanjutkan ke halaman tujuan.</p>
        <a class="btn btn-primary" href="#${escapeHtml(redirectTo)}">Lanjut</a>
      </section>
    `;
  }

  return `
    <section class="auth-layout">
      <article class="auth-copy">
        <span class="eyebrow">Login</span>
        <h1>Masuk untuk checkout dan memantau pesanan.</h1>
        <p>Guest tetap bisa melihat katalog, detail produk, dan menyimpan cart sebelum login.</p>
      </article>

      <form class="auth-card" id="login-form" novalidate>
        <h2>Masuk akun</h2>
        <label>
          <span>Email</span>
          <input name="email" type="email" autocomplete="email" required />
        </label>
        <label>
          <span>Password</span>
          <input name="password" type="password" autocomplete="current-password" required />
        </label>
        <small class="form-message" id="login-message"></small>
        <button class="btn btn-primary full-width" type="submit">Login</button>
        <a class="text-link center-link" href="#/register">Daftar akun baru</a>
      </form>
    </section>
  `;
}

export function afterRender({ query, navigate }) {
  const redirectTo = query.get("redirect") || "/products";
  const form = document.querySelector("#login-form");
  const message = document.querySelector("#login-message");

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    message.textContent = "";

    try {
      await loginUser(String(data.get("email") || ""), String(data.get("password") || ""));
      showToast("Login berhasil. Keranjang sudah disinkronkan.");
      navigate(redirectTo);
    } catch (error) {
      message.textContent = error.message || "Login belum berhasil. Coba lagi.";
    }
  });
}
