# Marketplace General Feature Roadmap

Dokumen ini berisi ide fitur tambahan untuk membuat PasarKita terasa seperti marketplace umum. Daftar ini tidak merujuk ke PRD/dokumen sebelumnya, tetapi mengikuti pola fitur marketplace modern.

## Tujuan

- Membuat pengalaman browsing, belanja, checkout, dan pasca transaksi terasa lebih lengkap.
- Menambah fitur yang familiar bagi user marketplace.
- Tetap fokus frontend terlebih dahulu dengan dummy data.
- Backend, saldo, ledger, dan pembayaran asli tidak diimplementasikan di tahap ini.

## Prinsip Implementasi

- Gunakan Vite + Vanilla JavaScript.
- Gunakan CSS murni dan color palette yang sudah ada.
- Semua data awal dapat memakai dummy data.
- Fitur yang membutuhkan backend cukup disimulasikan di frontend.
- Login hanya wajib saat user melakukan aksi belanja, bukan saat browsing produk.

## Priority 1

Fitur yang paling berdampak untuk membuat marketplace terasa realistis.

- [ ] Rating & review produk
- [ ] Rating toko/seller
- [ ] Kelola profil user
- [ ] Kelola alamat pengiriman
- [ ] Pilihan metode pembayaran di checkout
- [ ] Order detail yang lebih lengkap

### 1. Rating & Review Produk

Deskripsi:
User dapat melihat rating produk, jumlah ulasan, dan daftar review dari pembeli lain.

Komponen UI:
- Rating bintang di product card.
- Rating summary di product detail.
- List review di product detail.
- Filter review: terbaru, rating tertinggi, rating terendah.
- Empty state jika belum ada review.

Dummy Data:
- `review_id`
- `product_id`
- `user_name`
- `rating`
- `comment`
- `created_at`

Catatan:
Submit review bisa dibuat setelah order status `COMPLETED`.

### 2. Rating Toko/Seller

Deskripsi:
Profil toko menampilkan reputasi seller agar user lebih percaya saat membeli.

Komponen UI:
- Rating toko.
- Jumlah produk.
- Lokasi toko.
- Response rate dummy.
- Jumlah transaksi dummy.
- Badge seperti `Seller Aktif`, `UMKM Terverifikasi`, atau `Pengiriman Cepat`.

### 3. Kelola Profil User

Deskripsi:
User dapat melihat dan mengubah data profil dasar.

Komponen UI:
- Halaman profil.
- Form edit nama.
- Form edit email.
- Form edit nomor HP.
- Avatar placeholder.
- Tombol simpan.

Dummy Data:
- `user_id`
- `name`
- `email`
- `phone`
- `avatar_initial`

### 4. Kelola Alamat Pengiriman

Deskripsi:
User dapat menyimpan beberapa alamat dan memilih alamat utama saat checkout.

Komponen UI:
- List alamat.
- Form tambah alamat.
- Edit alamat.
- Hapus alamat.
- Set alamat utama.
- Pilih alamat saat checkout.

Dummy Data:
- `address_id`
- `receiver_name`
- `phone`
- `label`
- `full_address`
- `city`
- `postal_code`
- `is_primary`

### 5. Pilihan Metode Pembayaran

Deskripsi:
Checkout menampilkan beberapa metode pembayaran dummy agar lebih seperti marketplace umum.

Opsi Payment Method:
- SmartBank
- Virtual Account
- QRIS
- COD Dummy

Komponen UI:
- Payment method selector di checkout.
- Ringkasan metode pembayaran.
- Badge rekomendasi pada SmartBank.
- Error state jika payment method belum dipilih.

Payload Frontend:
```json
{
  "payment_method": "SMARTBANK"
}
```

Catatan:
Ini hanya pilihan frontend. Tidak membuat payment gateway asli.

### 6. Order Detail Lengkap

Deskripsi:
Halaman order detail menampilkan informasi transaksi seperti marketplace umum.

Komponen UI:
- Timeline status order.
- List produk.
- Alamat pengiriman.
- Ringkasan pembayaran.
- Metode pembayaran.
- Tombol refresh status.
- Tombol beli lagi.
- Tombol beri ulasan jika order selesai.

## Priority 2

Fitur pendukung yang memperkaya pengalaman user.

- [ ] Wishlist / favorit produk
- [ ] Voucher dan promo
- [ ] Estimasi ongkir
- [ ] Pilihan layanan pengiriman
- [ ] Notification center
- [ ] Filter lanjutan

### 7. Wishlist / Favorit Produk

Deskripsi:
User dapat menyimpan produk yang diminati untuk dilihat kembali.

Komponen UI:
- Tombol hati di product card.
- Tombol favorit di product detail.
- Halaman wishlist.
- Empty state wishlist.

Catatan:
Untuk guest, klik wishlist diarahkan ke login.

### 8. Voucher dan Promo

Deskripsi:
Checkout dapat menerima kode promo dummy.

Contoh Voucher:
- `PASARKITA10`: diskon 10%
- `UMKMHEMAT`: diskon Rp10.000
- `ONGKIRHEMAT`: potongan ongkir dummy

Komponen UI:
- Input kode voucher.
- Apply voucher.
- Error jika kode tidak valid.
- Baris diskon di payment summary.

### 9. Estimasi Ongkir

Deskripsi:
Checkout menampilkan estimasi ongkir berdasarkan kota/alamat dummy.

Komponen UI:
- Pilih kota.
- Pilih layanan pengiriman.
- Ongkir masuk ke total bayar.

Contoh Layanan:
- Hemat
- Reguler
- Cepat

Dummy Data:
- `service_code`
- `service_name`
- `fee`
- `eta`

### 10. Notification Center

Deskripsi:
Navbar memiliki ikon notifikasi untuk update order dan promo.

Komponen UI:
- Bell icon atau tombol notifikasi.
- Badge jumlah notifikasi.
- Dropdown list notifikasi.
- Empty state.

Contoh Notifikasi:
- Pembayaran berhasil.
- Pesanan sedang dikirim.
- Produk wishlist stok terbatas.
- Promo baru tersedia.

### 11. Filter Lanjutan

Deskripsi:
Filter katalog dibuat lebih lengkap seperti marketplace umum.

Filter Tambahan:
- Rating minimum.
- Lokasi seller.
- Produk promo.
- Produk terbaru.
- Produk terlaris dummy.
- Stok tersedia.

## Priority 3

Fitur lanjutan yang membuat marketplace terasa lebih matang.

- [ ] Chat seller dummy
- [ ] Produk serupa
- [ ] Recently viewed products
- [ ] Compare product
- [ ] Search suggestion
- [ ] Flash sale dummy
- [ ] Report product

### 12. Chat Seller Dummy

Deskripsi:
User dapat membuka modal chat dummy dengan seller.

Catatan:
Tidak perlu realtime. Cukup UI simulasi.

### 13. Produk Serupa

Deskripsi:
Product detail menampilkan produk lain dari kategori yang sama.

### 14. Recently Viewed Products

Deskripsi:
Produk yang baru dilihat disimpan di LocalStorage dan ditampilkan di homepage katalog.

### 15. Search Suggestion

Deskripsi:
Search bar menampilkan rekomendasi keyword berdasarkan nama produk dan kategori.

### 16. Flash Sale Dummy

Deskripsi:
Section promo dengan countdown dummy dan produk diskon.

### 17. Report Product

Deskripsi:
User dapat melaporkan produk bermasalah lewat modal sederhana.

## Rekomendasi Urutan Implementasi

1. Rating & review produk.
2. Kelola profil user.
3. Kelola alamat pengiriman.
4. Payment method checkout.
5. Order detail lengkap.
6. Wishlist.
7. Voucher dan promo.
8. Estimasi ongkir.
9. Notification center.
10. Filter lanjutan.

## Checklist Implementasi

### Priority 1

- [ ] Product card menampilkan rating produk.
- [ ] Product detail menampilkan review list.
- [ ] Product detail memiliki form review setelah order selesai.
- [ ] Store profile menampilkan rating dan reputasi seller.
- [ ] Halaman profil user dibuat.
- [ ] User dapat edit profil dummy.
- [ ] Halaman alamat dibuat.
- [ ] User dapat tambah/edit/hapus alamat dummy.
- [ ] Checkout dapat memilih alamat tersimpan.
- [ ] Checkout dapat memilih payment method.
- [ ] Order detail menampilkan payment method.
- [ ] Order detail menampilkan alamat pengiriman.
- [ ] Order detail menampilkan timeline lengkap.

### Priority 2

- [ ] Wishlist state dibuat.
- [ ] Tombol wishlist ditambahkan ke product card.
- [ ] Halaman wishlist dibuat.
- [ ] Voucher dummy dibuat.
- [ ] Checkout dapat apply voucher.
- [ ] Checkout menampilkan diskon.
- [ ] Ongkir dummy dibuat.
- [ ] Checkout dapat memilih layanan pengiriman.
- [ ] Notification center dibuat.
- [ ] Filter rating ditambahkan.
- [ ] Filter lokasi seller ditambahkan.

### Priority 3

- [ ] Modal chat seller dibuat.
- [ ] Produk serupa ditampilkan di product detail.
- [ ] Recently viewed disimpan di LocalStorage.
- [ ] Search suggestion dibuat.
- [ ] Flash sale dummy dibuat.
- [ ] Report product modal dibuat.

## Catatan Scope

Fitur di dokumen ini ditujukan untuk memperkaya UI/UX marketplace umum. Implementasi awal cukup memakai dummy data dan LocalStorage. Integrasi backend bisa dibuat setelah UI flow stabil.
