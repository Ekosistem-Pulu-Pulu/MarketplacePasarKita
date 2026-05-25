import { listNotifications, markNotificationRead } from "../api/marketplaceApi.js";
import { showToast } from "../components/Toast.js";
import { escapeHtml } from "../utils/validation.js";

export async function render() {
  const response = await listNotifications();
  const notifications = response.data || [];

  return `
    <section class="page-title split-title">
      <div>
        <p class="eyebrow">Notifikasi</p>
        <h1>Pusat notifikasi</h1>
        <p>Update order, chat, toko, dan sistem masuk ke sini.</p>
      </div>
      <a class="secondary-button" href="#/profile">Profil</a>
    </section>

    <section class="order-list">
      ${
        notifications.length
          ? notifications.map((item) => `
            <article class="order-card ${item.is_read ? "" : "unread"}">
              <div>
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.body)}</p>
              </div>
              <button class="secondary-button small" type="button" data-read-notif="${escapeHtml(item.notification_id)}" ${item.is_read ? "disabled" : ""}>
                ${item.is_read ? "Dibaca" : "Tandai dibaca"}
              </button>
            </article>
          `).join("")
          : `<section class="card-panel"><p class="muted">Belum ada notifikasi.</p></section>`
      }
    </section>
  `;
}

export function afterRender({ renderRoute }) {
  document.querySelectorAll("[data-read-notif]").forEach((button) => {
    button.addEventListener("click", async () => {
      await markNotificationRead(button.dataset.readNotif);
      showToast("Notifikasi ditandai dibaca.");
      renderRoute();
    });
  });
}
