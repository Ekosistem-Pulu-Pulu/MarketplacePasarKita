import { registerAccount } from "../api/accountApi.js";
import { showToast } from "../components/Toast.js";
import { persistAuthSession } from "../utils/storage.js";

export async function render() {
  return `
    <section class="auth-layout">
      <form class="auth-card" id="register-form">
        <p class="eyebrow">Daftar akun</p>
        <h1>Buat akun PasarKita</h1>
        <label class="form-group"><span class="form-label">Nama</span><input class="input" name="name" required /></label>
        <label class="form-group"><span class="form-label">Email</span><input class="input" name="email" type="email" required /></label>
        <label class="form-group"><span class="form-label">Password</span><input class="input" name="password" type="password" value="password123" required /></label>
        <label class="form-group">
          <span class="form-label">Role</span>
          <select class="input" name="role">
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
          </select>
        </label>
        <label class="form-group"><span class="form-label">Phone</span><input class="input" name="phone" /></label>
        <button class="primary-button block" type="submit">Daftar dan login</button>
        <a class="text-button" href="#/login">Sudah punya akun</a>
      </form>
    </section>
  `;
}

export function afterRender({ navigate }) {
  document.querySelector("#register-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const response = await registerAccount({
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      password: String(data.get("password") || ""),
      role: String(data.get("role") || "buyer"),
      phone: String(data.get("phone") || ""),
    });
    persistAuthSession(response.data);
    showToast("Akun dibuat.");
    navigate(response.data.user?.role === "seller" ? "/seller/products" : "/products");
  });
}
