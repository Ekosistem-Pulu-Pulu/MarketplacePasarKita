import { formatCurrency } from "../utils/currency.js";
import { escapeHtml } from "../utils/validation.js";

export function ProductTable(products) {
  if (!products.length) {
    return `
      <div class="empty-state compact">
        <strong>Tidak ada produk seller.</strong>
        <p>Tambahkan produk pertama untuk mengisi katalog Marketplace.</p>
      </div>
    `;
  }

  return `
    <div class="table-wrap card-panel">
      <table class="data-table">
        <thead>
          <tr>
            <th>Produk</th>
            <th>Kategori</th>
            <th>Harga</th>
            <th>Stok</th>
            <th>Status</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          ${products
            .map(
              (product) => `
                <tr>
                  <td>
                    <strong>${escapeHtml(product.nama_produk)}</strong>
                    <span>${escapeHtml(product.product_id)} - ${escapeHtml(product.seller_id)}</span>
                  </td>
                  <td>${escapeHtml(product.kategori)}</td>
                  <td>${formatCurrency(product.harga)}</td>
                  <td>${product.stok}</td>
                  <td>
                    <span class="status-badge ${product.status_aktif ? "status-paid" : "status-failed"}">
                      ${product.status_aktif ? "AKTIF" : "NONAKTIF"}
                    </span>
                  </td>
                  <td>
                    <div class="table-actions">
                      <button class="text-button" type="button" data-edit-product="${product.product_id}">
                        Edit
                      </button>
                      <button
                        class="text-button danger"
                        type="button"
                        data-deactivate-product="${product.product_id}"
                        ${product.status_aktif ? "" : "disabled"}
                      >
                        Nonaktifkan
                      </button>
                    </div>
                  </td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}
