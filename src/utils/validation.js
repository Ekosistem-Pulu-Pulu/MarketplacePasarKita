export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function validateQuantity(value, stock) {
  const qty = Number(value);

  if (!Number.isFinite(qty) || !Number.isInteger(qty)) {
    return { valid: false, message: "Qty wajib berupa angka bulat." };
  }

  if (qty <= 0) {
    return { valid: false, message: "Qty harus lebih dari 0." };
  }

  if (qty > Number(stock)) {
    return { valid: false, message: "Qty tidak boleh melebihi stok." };
  }

  return { valid: true, message: "" };
}

export function validateAddress(value) {
  if (!String(value ?? "").trim()) {
    return { valid: false, message: "Alamat pengiriman wajib diisi." };
  }

  return { valid: true, message: "" };
}

export function validateProductForm(values) {
  const errors = {};
  const harga = Number(values.harga);
  const stok = Number(values.stok);

  if (!String(values.nama_produk ?? "").trim()) {
    errors.nama_produk = "Nama produk wajib diisi.";
  }

  if (!String(values.deskripsi ?? "").trim()) {
    errors.deskripsi = "Deskripsi wajib diisi.";
  }

  if (!String(values.kategori ?? "").trim()) {
    errors.kategori = "Kategori wajib diisi.";
  }

  if (!Number.isFinite(harga) || harga < 0) {
    errors.harga = "Harga wajib angka dan tidak boleh negatif.";
  }

  if (!Number.isFinite(stok) || stok < 0 || !Number.isInteger(stok)) {
    errors.stok = "Stok wajib angka bulat dan tidak boleh negatif.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
