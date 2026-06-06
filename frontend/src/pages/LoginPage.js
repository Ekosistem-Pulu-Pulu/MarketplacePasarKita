import { showToast } from "../components/Toast.js";
import { loginUser } from "../services/authService.js";
import { DEMO_USERS, getDemoUser, isAuthenticated } from "../utils/storage.js";
import { getRoleHome, ROLE_DEFINITIONS } from "../utils/roles.js";
import { escapeHtml } from "../utils/validation.js";

function userOption(user) {
  const role = ROLE_DEFINITIONS[user.role];

  return `
    <button class="role-login-option" type="button" data-login-user="${escapeHtml(user.user_id)}">
      <div class="role-option-header">
        <div class="role-option-avatar ${escapeHtml(user.role)}">
          ${escapeHtml(user.name[0].toUpperCase())}
        </div>
        <div class="role-option-meta">
          <strong class="role-option-name">${escapeHtml(user.name)}</strong>
          <span class="role-option-badge ${escapeHtml(user.role)}">${escapeHtml(role.label)}</span>
        </div>
      </div>
      <span class="role-option-email">${escapeHtml(user.email)}</span>
    </button>
  `;
}

export async function render({ query }) {
  const redirectTo = query.get("redirect") || "";

  if (isAuthenticated()) {
    return `
      <section class="state-panel">
        <span class="state-icon" data-lucide="shield-check"></span>
        <h1>Session aktif</h1>
        <p>Akun kamu sudah masuk. Lanjutkan ke halaman tujuan.</p>
        <a class="btn btn-primary" href="#${escapeHtml(redirectTo || "/products")}">Lanjut</a>
      </section>
    `;
  }

  return `
    <div class="login-page-container">
      <section class="auth-layout">
        <article class="auth-copy">
          <span class="eyebrow">Login PasarKita</span>
          <h1>Masuk untuk checkout dan memantau pesanan.</h1>
          <p>
            Guest tetap bisa melihat katalog, detail produk, dan menyimpan cart sebelum login.
            Checkout, order, seller center, dan dashboard internal wajib login.
          </p>
          <div class="auth-note">
            Password semua akun demo: <strong>password123</strong>
          </div>
        </article>

        <form class="auth-card" id="login-form" novalidate>
          <div class="auth-tabs">
            <button type="button" class="auth-tab-btn active" id="tab-demo">Akun Demo</button>
            <button type="button" class="auth-tab-btn" id="tab-manual">Akun Manual</button>
          </div>

          <div id="demo-fields-group">
            <label>
              <span>Pilih Akun Demo</span>
              <select class="select" id="demo-email-select">
                ${DEMO_USERS.map(
                  (user) => `<option value="${escapeHtml(user.email)}">${escapeHtml(user.name)} - ${escapeHtml(ROLE_DEFINITIONS[user.role].label)}</option>`
                ).join("")}
              </select>
            </label>
          </div>

          <div id="manual-fields-group" class="hidden-group">
            <label>
              <span>Email</span>
              <input id="manual-email-input" name="email" type="email" autocomplete="email" placeholder="nama@email.com" />
            </label>
          </div>

          <label>
            <span>Password</span>
            <input name="password" type="password" value="password123" autocomplete="current-password" required />
          </label>
          <small class="form-message" id="login-message"></small>
          <button class="btn btn-primary full-width" type="submit">Login</button>
          <a class="text-link center-link" href="#/register">Daftar akun baru</a>
        </form>
      </section>

      <section class="login-role-section">
        <div class="login-role-list">
          <h2>Quick login role</h2>
          <p>Klik salah satu kartu di bawah ini untuk langsung masuk dengan role tersebut.</p>
          <div class="role-grid">
            ${DEMO_USERS.map(userOption).join("")}
          </div>
        </div>
      </section>
    </div>
  `;
}

export function afterRender({ query, navigate }) {
  const redirectTo = query.get("redirect") || "";
  const form = document.querySelector("#login-form");
  const message = document.querySelector("#login-message");

  const tabDemo = document.querySelector("#tab-demo");
  const tabManual = document.querySelector("#tab-manual");
  const demoGroup = document.querySelector("#demo-fields-group");
  const manualGroup = document.querySelector("#manual-fields-group");
  const emailInput = document.querySelector("#manual-email-input");

  tabDemo?.addEventListener("click", () => {
    tabDemo.classList.add("active");
    tabManual.classList.remove("active");
    demoGroup.classList.remove("hidden-group");
    manualGroup.classList.add("hidden-group");
    emailInput?.removeAttribute("required");
  });

  tabManual?.addEventListener("click", () => {
    tabManual.classList.add("active");
    tabDemo.classList.remove("active");
    manualGroup.classList.remove("hidden-group");
    demoGroup.classList.add("hidden-group");
    emailInput?.setAttribute("required", "required");
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    if (message) message.textContent = "";

    const isDemoTab = tabDemo?.classList.contains("active");
    const email = isDemoTab 
      ? document.querySelector("#demo-email-select")?.value 
      : emailInput?.value;
    const password = data.get("password");

    try {
      const session = await loginUser(String(email || ""), String(password || ""));
      showToast(`Login berhasil sebagai ${ROLE_DEFINITIONS[session.role].label}.`);
      navigate(redirectTo || getRoleHome(session.role));
    } catch (error) {
      if (message) message.textContent = error.message || "Login belum berhasil. Coba lagi.";
    }
  });

  document.querySelectorAll("[data-login-user]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const user = getDemoUser(button.dataset.loginUser);
        if (!user) throw new Error("User demo tidak ditemukan.");
        const session = await loginUser(user.email, "password123");
        showToast(`Login berhasil sebagai ${ROLE_DEFINITIONS[session.role].label}.`);
        navigate(redirectTo || getRoleHome(session.role));
      } catch (error) {
        showToast(error.message || "Login gagal.", "error");
      }
    });
  });
}

