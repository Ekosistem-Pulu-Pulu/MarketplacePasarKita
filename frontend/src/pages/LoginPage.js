import { login } from "../api/authApi.js";
import { showToast } from "../components/Toast.js";
import { getRoleHome, ROLE_DEFINITIONS } from "../utils/roles.js";
import { DEMO_USERS, getDemoUser, isAuthenticated, persistAuthSession } from "../utils/storage.js";
import { escapeHtml } from "../utils/validation.js";

function userOption(user) {
  const role = ROLE_DEFINITIONS[user.role];

  return `
    <button class="role-login-option" type="button" data-login-user="${escapeHtml(user.user_id)}">
      <strong>${escapeHtml(user.name)}</strong>
      <span>${escapeHtml(role.label)} - ${escapeHtml(user.email)}</span>
    </button>
  `;
}

export async function render({ query }) {
  const redirectTo = query.get("redirect") || "";

  if (isAuthenticated()) {
    return `
      <section class="status-card">
        <p class="eyebrow">Sudah login</p>
        <h2>Session aktif</h2>
        <p class="status-desc">Akun sudah login. Lanjutkan ke halaman yang dibutuhkan.</p>
        <div class="status-actions">
          <a class="primary-button" href="#${redirectTo || "/products"}">Lanjut</a>
          <a class="secondary-button" href="#/products">Katalog</a>
        </div>
      </section>
    `;
  }

  return `
    <section class="auth-layout">
      <article class="auth-copy">
        <p class="eyebrow">Login PasarKita</p>
        <h1>Masuk sebagai user dengan role yang sesuai.</h1>
        <p>
          Guest tetap bisa lihat katalog, detail produk, dan isi keranjang.
          Checkout, order, seller center, dan dashboard internal wajib login.
        </p>
        <div class="auth-note">
          Password semua akun demo: <strong>password123</strong>
        </div>
      </article>

      <form class="auth-card" id="login-form" novalidate>
        <h2>Masuk akun</h2>
        <label class="form-group">
          <span class="form-label">Email</span>
          <select class="select" name="email">
            ${DEMO_USERS.map(
              (user) => `<option value="${escapeHtml(user.email)}">${escapeHtml(user.name)} - ${escapeHtml(ROLE_DEFINITIONS[user.role].label)}</option>`
            ).join("")}
          </select>
        </label>
        <label class="form-group">
          <span class="form-label">Password</span>
          <input class="input" type="password" name="password" value="password123" autocomplete="current-password" />
          <small id="login-message" class="validation-text"></small>
        </label>
        <input type="hidden" name="redirect" value="${escapeHtml(redirectTo)}" />
        <button class="primary-button block" type="submit">Login</button>
        <a class="auth-secondary-action" href="#/register">Daftar akun buyer/seller</a>
        <a class="auth-secondary-action" href="#/products">Lihat katalog sebagai guest</a>
      </form>
    </section>

    <section class="summary-card login-role-list">
      <h2>Quick login role</h2>
      <div class="role-grid">
        ${DEMO_USERS.map(userOption).join("")}
      </div>
    </section>
  `;
}

export function afterRender({ query, navigate }) {
  const redirectTo = query.get("redirect") || "";
  const form = document.querySelector("#login-form");
  const message = document.querySelector("#login-message");

  function finishLogin(session) {
    showToast(`Login sebagai ${ROLE_DEFINITIONS[session.role].label}.`);
    navigate(redirectTo || getRoleHome(session.role));
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);

    try {
      const authData = await login(data.get("email"), data.get("password"));
      const session = persistAuthSession(authData);
      finishLogin(session);
    } catch (error) {
      message.textContent = error.message;
    }
  });

  document.querySelectorAll("[data-login-user]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const user = getDemoUser(button.dataset.loginUser);
        if (!user) throw new Error("User demo tidak ditemukan.");
        const authData = await login(user.email, "password123");
        finishLogin(persistAuthSession(authData));
      } catch (error) {
        showToast(error.message || "Login gagal.", "error");
      }
    });
  });
}
