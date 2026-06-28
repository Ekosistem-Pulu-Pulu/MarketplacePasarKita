import { z } from "zod";

const phone = z.string().regex(/^08[0-9]{8,13}$/, "Nomor telepon harus diawali 08 dan berisi 10-15 digit.");
const strongPassword = z
  .string()
  .min(8, "Password minimal 8 karakter.")
  .max(72, "Password maksimal 72 karakter.")
  .regex(/[a-z]/, "Password harus memiliki huruf kecil.")
  .regex(/[A-Z]/, "Password harus memiliki huruf besar.")
  .regex(/[0-9]/, "Password harus memiliki angka.")
  .regex(/[^A-Za-z0-9]/, "Password harus memiliki simbol.");

export const loginSchema = z.object({
  email: z.string().email("Format email belum valid."),
  password: z.string().min(6, "Password minimal 6 karakter."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Format email belum valid."),
});

export const registerSchema = z.object({
  name: z.string().min(3, "Nama lengkap minimal 3 karakter."),
  email: z.string().email("Format email belum valid."),
  password: strongPassword,
  confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
  phone,
  role: z.enum(["buyer", "seller"]).default("buyer"),
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "Konfirmasi password tidak sama.",
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

// Guest recipient schema memisahkan field alamat sesuai hierarki
// administratif (Negara > Kota > Kecamatan > Kelurahan > AlamatLengkap)
// sehingga layanan LogistikKita dapat menghitung ongkir dengan benar.
// Paling sedikit email ATAU phone harus diisi sebagai kunci lookup order guest.
export const guestRecipientSchema = z.object({
  nama_penerima: z.string().min(3, "Nama penerima minimal 3 karakter."),
  email: z.string().email("Format email belum valid.").optional().or(z.literal("")),
  phone,
  country: z.string().min(2, "Negara wajib diisi.").max(64),
  kota: z.string().min(2, "Kota wajib diisi."),
  kecamatan: z.string().min(2, "Kecamatan wajib diisi."),
  kelurahan: z.string().min(2, "Kelurahan wajib diisi."),
  alamat_lengkap: z.string().min(10, "Alamat lengkap minimal 10 karakter."),
  kode_pos: z.string().max(20).optional().or(z.literal("")),
}).refine((data) => Boolean(data.email || data.phone), {
  path: ["email"],
  message: "Email atau nomor telepon wajib diisi untuk menerima bukti pesanan.",
});

// guestCheckoutSchema adalah payload lengkap untuk POST /marketplace/guest/checkout.
// items minimal satu produk, shipping_rate_id & payment_method wajib dipilih.
export const guestCheckoutSchema = guestRecipientSchema.extend({
  items: z.array(z.object({
    product_id: z.string().min(1, "Product ID wajib."),
    qty: z.coerce.number().int().min(1, "Qty minimal 1."),
    variant: z.string().optional(),
  })).min(1, "Minimal satu produk dalam keranjang."),
  shipping_rate_id: z.string().min(1, "Pilih jasa pengiriman."),
  payment_method: z.enum(["virtual-account", "ewallet", "cod", "VIRTUAL_ACCOUNT", "EWALLET", "COD"], {
    errorMap: () => ({ message: "Pilih metode pembayaran." }),
  }),
  voucher_code: z.string().optional().or(z.literal("")),
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
