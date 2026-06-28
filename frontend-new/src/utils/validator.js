import { z } from "zod";

const phone = z.string().regex(/^08[0-9]{8,13}$/, "Nomor telepon harus diawali 08 dan berisi 10-15 digit.");

export const loginSchema = z.object({
  email: z.string().email("Format email belum valid."),
  password: z.string().min(6, "Password minimal 6 karakter."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Format email belum valid."),
});

export const registerSchema = loginSchema.extend({
	password: z.string().min(12, "Password minimal 12 karakter.").max(72, "Password maksimal 72 karakter."),
  name: z.string().min(3, "Nama lengkap minimal 3 karakter."),
  phone,
  role: z.enum(["buyer", "seller"]).default("buyer"),
});

export const addressSchema = z.object({
  recipient: z.string().min(3, "Nama penerima minimal 3 karakter."),
  phone,
  address: z.string().min(15, "Alamat pengiriman perlu ditulis lebih lengkap."),
});

export const checkoutSchema = addressSchema.extend({
  shipping: z.string().min(1, "Pilih jasa pengiriman."),
  payment: z.string().min(1, "Pilih metode pembayaran."),
});

export const sellerProductSchema = z.object({
  name: z.string().min(5, "Nama produk minimal 5 karakter."),
  categoryId: z.string().min(1, "Pilih kategori produk."),
  price: z.coerce.number().min(1000, "Harga minimal Rp1.000."),
  stock: z.coerce.number().int().min(1, "Stok minimal 1."),
  description: z.string().min(20, "Deskripsi minimal 20 karakter."),
});

export const sellerApplicationSchema = z.object({
  storeName: z.string().min(4, "Nama toko minimal 4 karakter."),
  businessCategory: z.string().min(1, "Pilih kategori utama toko."),
  city: z.string().min(3, "Kota asal toko wajib diisi."),
  pickupAddress: z.string().min(15, "Alamat pickup perlu ditulis lebih lengkap."),
  businessPhone: phone,
  storeDescription: z.string().min(30, "Deskripsi toko minimal 30 karakter."),
  agreement: z.literal("on", { error: "Setujui ketentuan penjual terlebih dahulu." }),
});

export function validate(schema, payload) {
  const result = schema.safeParse(payload);
  if (result.success) return { success: true, data: result.data, errors: {} };
  return {
    success: false,
    data: null,
    errors: Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message])),
  };
}

export function showFormErrors(form, errors) {
  form.querySelectorAll("[data-error-for]").forEach((node) => {
    node.textContent = errors[node.dataset.errorFor] || "";
  });
  const firstField = Object.keys(errors)[0];
  form.elements[firstField]?.focus();
}
