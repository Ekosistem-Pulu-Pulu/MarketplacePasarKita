import { escapeHtml } from "../utils/validation.js";

const categories = ["Makanan", "Minuman", "Kesehatan", "Kerajinan"];

const emptyProduct = {
  seller_id: "SELLER001",
  nama_produk: "",
  deskripsi: "",
  harga: "",
  stok: "",
  kategori: "Makanan",
};

function fieldError(errors, field) {
  return errors?.[field]
    ? `<small class="field-error">${escapeHtml(errors[field])}</small>`
    : "";
}

export function ProductForm({ product, values, errors = {} } = {}) {
  const data = {
    ...emptyProduct,
    ...(product || {}),
    ...(values || {}),
  };
  const isEdit = Boolean(product?.product_id);

  return `
    <form class="product-form card-panel" id="product-form" novalidate>
      <div class="panel-title">
        <p class="eyebrow">Manajemen produk</p>
        <h2>${isEdit ? "Edit produk" : "Tambah produk"}</h2>
        <p>Produk yang disimpan masuk ke katalog Marketplace. Tidak ada perubahan saldo di proses ini.</p>
      </div>

      <input type="hidden" name="product_id" value="${escapeHtml(product?.product_id || "")}" />

      <label>
        <span>Seller ID</span>
        <input name="seller_id" value="${escapeHtml(data.seller_id)}" />
      </label>

      <label>
        <span>Nama produk</span>
        <input name="nama_produk" value="${escapeHtml(data.nama_produk)}" />
        ${fieldError(errors, "nama_produk")}
      </label>

      <div class="form-grid">
        <label>
          <span>Harga</span>
          <input name="harga" type="number" min="0" value="${escapeHtml(data.harga)}" />
          ${fieldError(errors, "harga")}
        </label>

        <label>
          <span>Stok</span>
          <input name="stok" type="number" min="0" step="1" value="${escapeHtml(data.stok)}" />
          ${fieldError(errors, "stok")}
        </label>
      </div>

      <label>
        <span>Kategori</span>
        <select name="kategori">
          ${categories
            .map(
              (category) => `
                <option value="${category}" ${data.kategori === category ? "selected" : ""}>
                  ${category}
                </option>
              `
            )
            .join("")}
        </select>
        ${fieldError(errors, "kategori")}
      </label>

      <label>
        <span>Deskripsi</span>
        <textarea name="deskripsi" rows="4">${escapeHtml(data.deskripsi)}</textarea>
        ${fieldError(errors, "deskripsi")}
      </label>

      <div class="form-actions">
        <button class="primary-button" type="submit">
          ${isEdit ? "Simpan perubahan" : "Tambah produk"}
        </button>
        ${
          isEdit
            ? `<button class="secondary-button" type="button" data-cancel-edit>Batalkan edit</button>`
            : ""
        }
      </div>
    </form>
  `;
}
