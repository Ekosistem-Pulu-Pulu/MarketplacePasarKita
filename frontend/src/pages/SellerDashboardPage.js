import {
  browseProducts,
  createProduct,
  deactivateProduct,
  getProductById,
  updateProduct,
} from "../api/marketplaceApi.js";
import { ProductForm } from "../components/ProductForm.js";
import { ProductTable } from "../components/ProductTable.js";
import { showToast } from "../components/Toast.js";
import { escapeHtml, validateProductForm } from "../utils/validation.js";

let editingProductId = null;
let formErrors = {};
let formValues = null;
let keyword = "";

export async function render() {
  const response = await browseProducts({
    keyword,
    page: 1,
    limit: 100,
    includeInactive: true,
  });
  const products = response.data.items;
  const editingProduct = editingProductId
    ? (await getProductById(editingProductId, { includeInactive: true })).data
    : null;

  return `
    <section class="seller-layout">
      <div class="seller-intro card-panel">
        <p class="eyebrow">Seller/Admin Marketplace</p>
        <h1>Manajemen produk UMKM</h1>
        <p>
          Dashboard ini hanya mengelola data katalog Marketplace. Tidak ada fitur
          SmartBank, POS, SupplierHub, LogistiKita, atau UMKM Insight di sini.
        </p>
      </div>

      <div class="seller-grid">
        ${ProductForm({
          product: editingProduct,
          values: formValues,
          errors: formErrors,
        })}

        <section class="seller-products">
          <form class="seller-search card-panel" id="seller-search-form">
            <label>
              <span>Cari produk seller</span>
              <input name="keyword" value="${escapeHtml(keyword)}" placeholder="Nama produk atau kategori" />
            </label>
            <button class="secondary-button" type="submit">Cari</button>
          </form>

          ${ProductTable(products)}
        </section>
      </div>
    </section>
  `;
}

function readProductForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());

  return {
    seller_id: String(data.seller_id || "SELLER001").trim(),
    nama_produk: String(data.nama_produk || "").trim(),
    deskripsi: String(data.deskripsi || "").trim(),
    harga: Number(data.harga),
    stok: Number(data.stok),
    kategori: String(data.kategori || "").trim(),
  };
}

export function afterRender({ renderRoute }) {
  const productForm = document.querySelector("#product-form");
  productForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = readProductForm(productForm);
    const validation = validateProductForm(payload);
    formValues = payload;

    if (!validation.valid) {
      formErrors = validation.errors;
      renderRoute();
      return;
    }

    try {
      if (editingProductId) {
        await updateProduct(editingProductId, payload);
        showToast("Produk berhasil diperbarui.");
      } else {
        await createProduct(payload);
        showToast("Produk berhasil ditambahkan.");
      }

      editingProductId = null;
      formErrors = {};
      formValues = null;
      renderRoute();
    } catch (error) {
      showToast(error.message || "Produk gagal disimpan.", "error");
    }
  });

  document.querySelector("[data-cancel-edit]")?.addEventListener("click", () => {
    editingProductId = null;
    formErrors = {};
    formValues = null;
    renderRoute();
  });

  document.querySelector("#seller-search-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    keyword = String(new FormData(event.currentTarget).get("keyword") || "").trim();
    renderRoute();
  });

  document.querySelectorAll("[data-edit-product]").forEach((button) => {
    button.addEventListener("click", () => {
      editingProductId = button.dataset.editProduct;
      formErrors = {};
      formValues = null;
      renderRoute();
    });
  });

  document.querySelectorAll("[data-deactivate-product]").forEach((button) => {
    button.addEventListener("click", async () => {
      const confirmed = window.confirm("Nonaktifkan produk dari katalog publik?");
      if (!confirmed) return;

      try {
        await deactivateProduct(button.dataset.deactivateProduct);
        showToast("Produk berhasil dinonaktifkan.");
        renderRoute();
      } catch (error) {
        showToast(error.message || "Produk gagal dinonaktifkan.", "error");
      }
    });
  });
}
