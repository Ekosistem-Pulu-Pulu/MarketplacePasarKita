import { getProfile, listAddresses, saveAddress, updateProfile } from "../api/accountApi.js";
import { showToast } from "../components/Toast.js";
import { escapeHtml } from "../utils/validation.js";

export async function render() {
  const [profileResult, addressResult] = await Promise.allSettled([getProfile(), listAddresses()]);
  const profile = profileResult.status === "fulfilled" ? profileResult.value.data : {};
  const addresses = addressResult.status === "fulfilled" ? addressResult.value.data || [] : [];

  return `
    <section class="page-title split-title">
      <div>
        <p class="eyebrow">Akun</p>
        <h1>Profil dan alamat</h1>
        <p>Data akun dipakai untuk checkout, order, chat, dan role dashboard.</p>
      </div>
      <a class="secondary-button" href="#/orders">Order saya</a>
    </section>

    <section class="content-grid two-cols">
      <form class="card-panel" id="profile-form">
        <h2>Profil</h2>
        <label class="form-group">
          <span class="form-label">Nama</span>
          <input class="input" name="name" value="${escapeHtml(profile.name || "")}" />
        </label>
        <label class="form-group">
          <span class="form-label">Email</span>
          <input class="input" value="${escapeHtml(profile.email || "")}" disabled />
        </label>
        <label class="form-group">
          <span class="form-label">Phone</span>
          <input class="input" name="phone" value="${escapeHtml(profile.phone || "")}" />
        </label>
        <button class="primary-button" type="submit">Simpan profil</button>
      </form>

      <form class="card-panel" id="address-form">
        <h2>Tambah alamat</h2>
        <div class="form-grid">
          <label class="form-group"><span class="form-label">Label</span><input class="input" name="label" value="Rumah" /></label>
          <label class="form-group"><span class="form-label">Penerima</span><input class="input" name="recipient" value="${escapeHtml(profile.name || "")}" /></label>
        </div>
        <div class="form-grid">
          <label class="form-group"><span class="form-label">Phone</span><input class="input" name="phone" value="${escapeHtml(profile.phone || "")}" /></label>
          <label class="form-group"><span class="form-label">Kode pos</span><input class="input" name="postal_code" /></label>
        </div>
        <label class="form-group"><span class="form-label">Alamat</span><textarea class="textarea" name="address_line" rows="3"></textarea></label>
        <div class="form-grid">
          <label class="form-group"><span class="form-label">Kota</span><input class="input" name="city" /></label>
          <label class="form-group"><span class="form-label">Provinsi</span><input class="input" name="province" /></label>
        </div>
        <label class="checkbox-row"><input type="checkbox" name="is_default" checked /> Jadikan default</label>
        <button class="secondary-button" type="submit">Simpan alamat</button>
      </form>
    </section>

    <section class="card-panel">
      <h2>Alamat tersimpan</h2>
      <div class="order-list">
        ${
          addresses.length
            ? addresses.map((address) => `
              <article class="order-card">
                <div>
                  <strong>${escapeHtml(address.label)} ${address.is_default ? "(Default)" : ""}</strong>
                  <p>${escapeHtml(address.address_line)}, ${escapeHtml(address.city)}, ${escapeHtml(address.province)}</p>
                </div>
                <span>${escapeHtml(address.recipient)} - ${escapeHtml(address.phone)}</span>
              </article>
            `).join("")
            : `<p class="muted">Belum ada alamat.</p>`
        }
      </div>
    </section>
  `;
}

export function afterRender({ renderRoute }) {
  document.querySelector("#profile-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await updateProfile({
      name: String(data.get("name") || ""),
      phone: String(data.get("phone") || ""),
    });
    showToast("Profil tersimpan.");
    renderRoute();
  });

  document.querySelector("#address-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await saveAddress({
      label: String(data.get("label") || ""),
      recipient: String(data.get("recipient") || ""),
      phone: String(data.get("phone") || ""),
      address_line: String(data.get("address_line") || ""),
      city: String(data.get("city") || ""),
      province: String(data.get("province") || ""),
      postal_code: String(data.get("postal_code") || ""),
      is_default: Boolean(data.get("is_default")),
    });
    showToast("Alamat tersimpan.");
    renderRoute();
  });
}
