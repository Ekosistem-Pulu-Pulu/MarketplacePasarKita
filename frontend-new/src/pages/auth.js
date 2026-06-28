import { loginUser, registerUser } from "../services/authService.js";
import { renderIcons } from "../icons.js";
import { consumePendingRoute } from "../utils/storage.js";
import { forgotPasswordSchema, loginSchema, registerSchema, showFormErrors, validate } from "../utils/validator.js";
import { escapeHtml, toast } from "../utils/ui.js";

export function render({ path }) {
  const isRegister = path === "/register";
  const isForgotPassword = path === "/forgot-password";
  const title = isForgotPassword
    ? "Pulihkan akses akun PasarKita."
    : isRegister
      ? "Mulai pengalaman belanja yang lebih personal."
      : "Selamat datang kembali di PasarKita.";
  const formTitle = isForgotPassword ? "Lupa password" : isRegister ? "Daftar PasarKita" : "Selamat datang";
  const formEyebrow = isForgotPassword ? "Reset akun" : isRegister ? "Buat akun baru" : "Masuk ke akunmu";
  const formDescription = isForgotPassword
    ? "Masukkan email akunmu. Kami akan menyiapkan instruksi pemulihan password."
    : isRegister
      ? "Gunakan email aktif dan password yang kuat untuk menjaga keamanan akun."
      : "Masuk dengan email dan password akun PasarKita untuk melanjutkan aktivitas belanja.";
  return `
    <section class="auth-page">
      <article class="auth-visual">
        <a class="brand auth-brand" href="#/"><span class="brand-mark"><span data-lucide="shopping-bag"></span></span><span>Pasar<span>Kita</span></span></a>
        <div class="auth-visual-content">
          <div class="auth-copy">
            <span class="eyebrow light">Marketplace untuk semua</span>
            <h1>${title}</h1>
            <p>Belanja aman, pantau pesanan, dan temukan promo yang dibuat khusus untukmu.</p>
          </div>
          <div class="auth-illustration" aria-hidden="true">
            <svg viewBox="0 0 520 420" role="img">
              <path class="auth-line auth-line-soft" d="M76 291c28-33 58-42 92-27 42 19 74 6 99-38 25-43 58-66 99-48 35 16 48 54 89 34" />
              <path class="auth-line" d="M85 332c72 11 134-9 185-61 42-43 78-69 126-50 25 10 42 28 54 54" />
              <path class="auth-plant" d="M102 309c-33-84-20-152 39-204 8 71-5 125-39 204Z" />
              <path class="auth-plant" d="M433 324c-8-71 12-118 59-143 5 64-13 111-59 143Z" />
              <path class="auth-fill light" d="M184 296c-7-45 12-92 54-116 31-18 72-15 101 9 37 30 49 83 25 124-21 35-64 51-104 39-40-12-70-25-76-56Z" />
              <path class="auth-fill" d="M230 190c18-22 47-25 68-10 19 13 31 36 28 61l-15 126H203l20-122c3-20-5-40 7-55Z" />
              <path class="auth-line" d="M223 246c-9-55 14-83 51-83 43 0 68 34 58 90l-18 114H203l20-121Z" />
              <path class="auth-skin" d="M270 163c-27 0-47 21-47 49v18c0 22 18 39 40 39h6c22 0 40-18 40-40v-19c0-26-14-47-39-47Z" />
              <path class="auth-hair" d="M219 194c-15-39 21-72 61-65 28 4 48 25 53 54 4 23-2 43-19 59-2-35-13-51-34-50-29 2-38-16-61 2Z" />
              <path class="auth-shirt" d="M183 281c31-23 62-33 93-31 32 1 61 14 88 38l-20 87H202l-19-94Z" />
              <path class="auth-line" d="M207 375h135" />
              <path class="auth-device" d="M121 294h78l22 84h-78l-22-84Z" />
              <circle class="auth-dot" cx="170" cy="338" r="9" />
              <path class="auth-line" d="M90 378h366" />
              <path class="auth-dash" d="M390 108c52 35 69 75 49 121" />
              <path class="auth-dash" d="M120 182c33-45 74-69 123-72" />
              <circle class="auth-small" cx="389" cy="79" r="8" />
              <circle class="auth-small" cx="134" cy="76" r="10" />
              <path class="auth-spark" d="M338 59v14M338 91v14M315 82h14M347 82h14" />
              <path class="auth-spark" d="M445 274v10M445 296v10M428 290h10M452 290h10" />
            </svg>
          </div>
          <div class="auth-features"><span><i data-lucide="shield-check"></i>Transaksi terlindungi</span><span><i data-lucide="truck"></i>Pengiriman transparan</span><span><i data-lucide="badge-percent"></i>Promo setiap hari</span></div>
        </div>
      </article>
      <div class="auth-form-wrap">
        <form class="auth-card" id="auth-form" novalidate>
          <span class="eyebrow">${formEyebrow}</span><h2>${formTitle}</h2><p>${formDescription}</p>
          ${isRegister ? `<label><span>Nama lengkap</span><input name="name" autocomplete="name" required placeholder="Contoh: Raka Pratama" /><small class="form-error" data-error-for="name"></small></label>` : ""}
          <label><span>Email</span><input name="email" type="email" autocomplete="email" required placeholder="nama@email.com" /><small class="form-error" data-error-for="email"></small></label>
          ${isForgotPassword ? "" : `<label>
            <span>Password</span>
            <div class="password-field">
              <input name="password" type="password" minlength="${isRegister ? "8" : "6"}" required placeholder="${isRegister ? "Minimal 8 karakter" : "Minimal 6 karakter"}" />
              <button class="password-toggle" type="button" aria-label="Tampilkan password" aria-pressed="false">
                <span data-lucide="eye"></span>
              </button>
            </div>
            ${isRegister ? `<ul class="password-rules" aria-label="Syarat password">
              <li data-password-rule="length"><span data-lucide="circle"></span>Minimal 8 karakter</li>
              <li data-password-rule="case"><span data-lucide="circle"></span>Mengandung huruf besar dan huruf kecil</li>
              <li data-password-rule="number-symbol"><span data-lucide="circle"></span>Mengandung angka dan simbol</li>
            </ul>` : ""}
            <small class="form-error" data-error-for="password"></small>
          </label>`}
          ${isRegister ? `<label>
            <span>Konfirmasi password</span>
            <div class="password-field">
              <input name="confirmPassword" type="password" autocomplete="new-password" required placeholder="Ulangi password" />
              <button class="password-toggle" type="button" aria-label="Tampilkan password" aria-pressed="false">
                <span data-lucide="eye"></span>
              </button>
            </div>
            <small class="form-error" data-error-for="confirmPassword"></small>
          </label>` : ""}
          ${isRegister ? `<label><span>Nomor telepon</span><input name="phone" autocomplete="tel" required placeholder="08xxxxxxxxxx" /><small class="form-error" data-error-for="phone"></small></label>` : ""}
          ${isForgotPassword ? "" : isRegister ? "" : `<div class="auth-helper"><label><input type="checkbox" checked /> Ingat saya</label><a href="#/forgot-password">Lupa password?</a></div>`}
          <button class="btn btn-primary full" type="submit">${isForgotPassword ? "Kirim Instruksi Reset" : isRegister ? "Daftar Sekarang" : "Masuk"}</button>
          <div class="auth-divider"><span>atau</span></div>
          <a class="btn btn-secondary full" href="${isRegister || isForgotPassword ? "#/login" : "#/register"}">${isRegister ? "Sudah punya akun? Masuk" : isForgotPassword ? "Kembali ke halaman masuk" : "Belum punya akun? Daftar"}</a>
        </form>
      </div>
    </section>
  `;
}

export function afterRender({ path, navigate }) {
  const isRegister = path === "/register";
  const isForgotPassword = path === "/forgot-password";
  const form = document.querySelector("#auth-form");
  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const schema = isForgotPassword ? forgotPasswordSchema : isRegister ? registerSchema : loginSchema;
    const result = validate(schema, data);
    showFormErrors(form, result.errors);
    if (!result.success) {
      toast("Form belum valid. Periksa kembali data akun.", "error");
      return;
    }
    if (isForgotPassword) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      form.innerHTML = `
        <div class="auth-success-icon"><span data-lucide="circle-check"></span></div>
        <span class="eyebrow">Instruksi terkirim</span>
        <h2>Cek email kamu</h2>
        <p>Kami sudah menyiapkan instruksi pemulihan password untuk <strong>${escapeHtml(result.data.email)}</strong>. Ikuti tautan reset yang tersedia dan jangan bagikan kode pemulihan ke siapa pun.</p>
        <div class="auth-reset-note"><span data-lucide="shield-check"></span><div><strong>Keamanan akun</strong><small>Tautan reset hanya berlaku sementara untuk melindungi akunmu.</small></div></div>
        <a class="btn btn-primary full" href="#/login">Kembali ke Login</a>
        <button class="quick-login" type="button" id="resend-reset"><span data-lucide="refresh-cw"></span>Kirim ulang instruksi</button>
      `;
      renderIcons(form);
      document.querySelector("#resend-reset")?.addEventListener("click", () => {
        toast("Instruksi reset password dikirim ulang.");
      });
      toast("Instruksi reset password berhasil disiapkan.");
      return;
    }
    try {
      const payload = isRegister
        ? (({ confirmPassword, ...registerPayload }) => registerPayload)(result.data)
        : result.data;
      const user = isRegister ? await registerUser(payload) : await loginUser(payload);
      toast(isRegister ? `Akun ${escapeHtml(user.name)} berhasil dibuat.` : `Selamat datang kembali, ${escapeHtml(user.name)}.`);
      navigate(consumePendingRoute());
    } catch (error) {
      toast(error.message, "error");
    }
  });
  document.querySelectorAll(".password-toggle").forEach((toggle) => {
    toggle.addEventListener("click", (event) => {
      const button = event.currentTarget;
      const input = button.closest(".password-field")?.querySelector("input");
      if (!input) return;
      const isVisible = input.type === "text";
      input.type = isVisible ? "password" : "text";
      button.setAttribute("aria-label", isVisible ? "Tampilkan password" : "Sembunyikan password");
      button.setAttribute("aria-pressed", String(!isVisible));
      button.innerHTML = `<span data-lucide="${isVisible ? "eye" : "eye-off"}"></span>`;
      renderIcons(button);
    });
  });
  const passwordInput = form?.elements.password;
  const passwordRules = [...document.querySelectorAll("[data-password-rule]")];
  const updatePasswordRules = () => {
    const value = passwordInput?.value || "";
    const checks = {
      length: value.length >= 8,
      case: /[a-z]/.test(value) && /[A-Z]/.test(value),
      "number-symbol": /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value),
    };
    passwordRules.forEach((rule) => {
      const isValid = checks[rule.dataset.passwordRule];
      rule.classList.toggle("is-valid", isValid);
      rule.classList.toggle("is-pending", !isValid);
      const icon = rule.querySelector("[data-lucide]");
      if (icon) icon.dataset.lucide = isValid ? "check-circle-2" : "circle";
    });
    if (passwordRules.length) renderIcons(document.querySelector(".password-rules"));
  };
  if (isRegister && passwordInput) {
    updatePasswordRules();
    passwordInput.addEventListener("input", updatePasswordRules);
  }
}
