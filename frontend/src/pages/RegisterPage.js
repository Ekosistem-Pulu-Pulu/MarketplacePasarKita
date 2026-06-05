import { showToast } from "../components/Toast.js";
import { registerUser } from "../services/authService.js";

export async function render() {
  return `
    <section class="auth-layout">
      <article class="auth-copy">
        <span class="eyebrow">Daftar akun</span>
        <h1>Buat akun untuk belanja atau mengelola toko.</h1>
        <p>Akun buyer bisa langsung checkout. Akun seller dapat masuk ke area penjualan setelah login.</p>
      </article>

      <form class="auth-card" id="register-form">
        <h2>Data akun</h2>
        <label><span>Nama</span><input name="name" autocomplete="name" required /></label>
        <label><span>Email</span><input name="email" type="email" autocomplete="email" required /></label>
        <label><span>Password</span><input name="password" type="password" autocomplete="new-password" required /></label>
        <label>
          <span>Tipe akun</span>
          <select name="role">
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
          </select>
        </label>
        <label><span>Nomor telepon</span><input name="phone" autocomplete="tel" /></label>
        <small class="form-message" id="register-message"></small>
        <button class="btn btn-primary full-width" type="submit">Daftar dan login</button>
        <a class="text-link center-link" href="#/login">Sudah punya akun</a>
      </form>
    </section>
  `;
}

export function afterRender({ navigate }) {
  const form = document.querySelector("#register-form");
  const message = document.querySelector("#register-message");

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    message.textContent = "";

    try {
      const session = await registerUser({
        name: String(data.get("name") || ""),
        email: String(data.get("email") || ""),
        password: String(data.get("password") || ""),
        role: String(data.get("role") || "buyer"),
        phone: String(data.get("phone") || ""),
      });
      showToast("Akun berhasil dibuat.");
      navigate(session.role === "seller" ? "/seller" : "/products");
    } catch (error) {
      message.textContent = error.message || "Pendaftaran belum berhasil. Coba lagi.";
    }
  });
}
