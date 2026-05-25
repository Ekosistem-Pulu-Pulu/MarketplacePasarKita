import { listChat, sendChat } from "../api/marketplaceApi.js";
import { showToast } from "../components/Toast.js";
import { getCurrentUser } from "../utils/storage.js";
import { escapeHtml } from "../utils/validation.js";

export async function render() {
  const response = await listChat();
  const messages = response.data || [];
  const user = getCurrentUser();

  return `
    <section class="page-title split-title">
      <div>
        <p class="eyebrow">Chat</p>
        <h1>Pesan buyer dan seller</h1>
        <p>Customer support dapat memakai halaman ini untuk simulasi percakapan marketplace.</p>
      </div>
      <a class="secondary-button" href="#/products">Cari produk</a>
    </section>

    <section class="content-grid two-cols">
      <form class="card-panel" id="chat-form">
        <h2>Kirim pesan</h2>
        <label class="form-group">
          <span class="form-label">Receiver ID</span>
          <input class="input" name="receiver_id" value="${user?.role === "seller" ? "USR001" : "SELLER001"}" />
        </label>
        <label class="form-group">
          <span class="form-label">Product ID</span>
          <input class="input" name="product_id" placeholder="Opsional" />
        </label>
        <label class="form-group">
          <span class="form-label">Pesan</span>
          <textarea class="textarea" name="body" rows="4"></textarea>
        </label>
        <button class="primary-button" type="submit">Kirim</button>
      </form>

      <article class="card-panel">
        <h2>Riwayat chat</h2>
        <div class="order-list">
          ${
            messages.length
              ? messages.map((message) => `
                <div class="review-row">
                  <strong>${escapeHtml(message.sender_id)} -> ${escapeHtml(message.receiver_id)}</strong>
                  <p>${escapeHtml(message.body)}</p>
                  <small>${escapeHtml(message.product_id || "general")}</small>
                </div>
              `).join("")
              : `<p class="muted">Belum ada chat.</p>`
          }
        </div>
      </article>
    </section>
  `;
}

export function afterRender({ renderRoute }) {
  document.querySelector("#chat-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await sendChat({
      receiver_id: String(data.get("receiver_id") || ""),
      product_id: String(data.get("product_id") || ""),
      body: String(data.get("body") || ""),
    });
    showToast("Pesan terkirim.");
    renderRoute();
  });
}
