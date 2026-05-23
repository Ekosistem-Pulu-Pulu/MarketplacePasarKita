# Marketplace PasarKita - Feature Checklist

Dokumen ini berisi daftar fitur tambahan yang bisa membuat PasarKita terasa lebih seperti marketplace umum, dengan batasan tetap mengikuti PRD: fokus frontend marketplace, menggunakan dummy data, tidak membuat backend, dan tidak membuat fitur SmartBank, POS, SupplierHub, LogistiKita, atau UMKM Insight.

## Batasan Scope

- Marketplace hanya menjadi frontend untuk katalog produk, detail produk, checkout request, status order, dan seller dashboard.
- Marketplace tidak boleh mengubah saldo user.
- Checkout hanya membuat request/order ke endpoint marketplace/API Gateway.
- Integrasi SmartBank, logistik, analytics, supplier, dan POS hanya boleh ditampilkan sebagai konteks alur, bukan dibuat sebagai fitur utama.
- Implementasi frontend tetap menggunakan Vite, Vanilla JavaScript ES Modules, HTML, CSS murni, Fetch API, LocalStorage, dan hash routing.

## Fitur Yang Sudah Ada

- [x] Product list page dengan grid produk.
- [x] Search produk berdasarkan keyword.
- [x] Filter kategori produk.
- [x] Sort harga sederhana.
- [x] Product detail page.
- [x] Quantity selector di detail produk.
- [x] Validasi qty tidak boleh kurang dari 1.
- [x] Validasi qty tidak boleh melebihi stok.
- [x] Tombol checkout disabled jika stok habis.
- [x] Checkout page dengan ringkasan produk.
- [x] Perhitungan subtotal.
- [x] Perhitungan marketplace fee 2%.
- [x] Perhitungan total bayar.
- [x] Form alamat pengiriman.
- [x] Mock order setelah checkout.
- [x] Order status page.
- [x] Status badge untuk order.
- [x] Tombol simulasi pembayaran untuk mock flow.
- [x] Seller dashboard dengan tabel produk.
- [x] Form tambah produk.
- [x] Edit produk.
- [x] Nonaktifkan dan aktifkan produk.
- [x] Toast notification sederhana.
- [x] Responsive layout dasar.
- [x] Hash routing untuk halaman utama marketplace.
- [x] Color palette marketplace konsisten dengan desain saat ini.

## Prioritas Implementasi Berikutnya

### Prioritas 1 - Fitur Marketplace Inti

- [x] Keranjang belanja.
- [x] Tambah produk ke keranjang dari product card.
- [x] Tambah produk ke keranjang dari product detail.
- [x] Ubah qty item di keranjang.
- [x] Hapus item dari keranjang.
- [x] Ringkasan cart: subtotal, marketplace fee 2%, total bayar.
- [x] Checkout multi-item dari cart.
- [x] Simpan cart sementara di LocalStorage.
- [x] Riwayat order user.
- [x] Order detail page.
- [x] Timeline status order.
- [x] Tombol refresh status pada order detail.

### Prioritas 2 - Discovery Produk

- [x] Halaman atau section kategori produk.
- [x] Filter harga minimum dan maksimum.
- [x] Filter stok tersedia.
- [x] Filter seller/toko.
- [x] Sort produk terbaru.
- [x] Sort nama produk A-Z.
- [x] Label stok terbatas untuk produk dengan stok rendah.
- [x] Empty state yang spesifik untuk hasil search/filter.
- [x] Tombol clear search dan reset filter.
- [x] Pagination atau load more untuk daftar produk.

### Prioritas 3 - Seller dan Toko

- [x] Profil toko/seller.
- [x] Halaman daftar produk per seller.
- [x] Informasi toko: nama toko, lokasi, deskripsi, rating dummy.
- [x] Statistik seller sederhana: total produk, produk aktif, produk nonaktif, stok habis.
- [x] Search khusus di seller dashboard.
- [x] Filter produk seller berdasarkan status.
- [x] Konfirmasi sebelum nonaktifkan produk.
- [x] Preview produk sebelum disimpan.

### Prioritas 4 - UX dan Kepercayaan Pembeli

- [ ] Wishlist/favorit produk.
- [ ] Simpan wishlist di LocalStorage.
- [ ] Review dan rating dummy pada product detail.
- [ ] Produk terkait berdasarkan kategori yang sama.
- [ ] Copy/share link produk.
- [ ] Skeleton loading untuk product grid dan detail.
- [ ] State error yang lebih jelas ketika data gagal dimuat.
- [ ] Mobile bottom navigation.
- [ ] Breadcrumb sederhana pada detail dan checkout.
- [ ] Validasi form checkout yang lebih lengkap.

### Prioritas 5 - Simulasi Ekosistem Microservice

- [ ] Panel ringkas "Alur Transaksi" di checkout.
- [ ] Informasi bahwa checkout dikirim ke API Gateway.
- [ ] Informasi bahwa pembayaran diproses oleh SmartBank, bukan marketplace.
- [ ] Informasi bahwa pengiriman diproses oleh LogistiKita setelah pembayaran sukses.
- [ ] Menampilkan request payload checkout dalam mode demo.
- [ ] Mode mock/API switch tetap mengikuti `VITE_USE_MOCK`.
- [ ] Dokumentasi endpoint yang digunakan frontend marketplace.

## Detail Fitur Rekomendasi

### Keranjang Belanja

Keranjang membuat flow marketplace lebih natural karena user bisa memilih beberapa produk sebelum checkout. Untuk tahap frontend, data cukup disimpan di LocalStorage. Jika nanti backend tersedia, cart bisa dipindahkan menjadi data server-side.

Acceptance criteria:

- [x] User bisa menambahkan produk aktif ke cart.
- [x] Produk stok 0 tidak bisa masuk cart.
- [x] Qty cart tidak boleh melebihi stok.
- [x] Cart tetap ada setelah browser refresh.
- [x] Total cart menghitung subtotal, fee 2%, dan total bayar.

### Riwayat dan Detail Order

Saat ini status order fokus pada satu order aktif. Marketplace umum perlu daftar order agar user bisa melihat transaksi sebelumnya.

Acceptance criteria:

- [x] User bisa melihat daftar order mock.
- [x] Tiap order menampilkan order ID, tanggal, status, total bayar, dan jumlah item.
- [x] Klik order membuka detail order.
- [x] Detail order menampilkan item, alamat, subtotal, fee, total, dan status timeline.

### Wishlist

Wishlist meningkatkan UX tanpa perlu backend. Ini aman untuk scope frontend karena bisa disimpan di LocalStorage.

Acceptance criteria:

- [ ] User bisa menandai produk sebagai favorit.
- [ ] Produk favorit tersimpan di LocalStorage.
- [ ] User bisa melihat daftar wishlist.
- [ ] Produk nonaktif tetap tidak bisa checkout walau ada di wishlist.

### Profil Seller

Profil seller membantu marketplace terasa seperti platform UMKM, bukan hanya katalog produk.

Acceptance criteria:

- [x] Product detail menampilkan informasi seller.
- [x] Klik seller membuka halaman toko.
- [x] Halaman toko menampilkan daftar produk seller.
- [x] Halaman toko menampilkan data dummy seperti lokasi, rating, dan jumlah produk.

### Timeline Status Order

Timeline membuat status order lebih jelas dan tidak ambigu.

Acceptance criteria:

- [x] Status order ditampilkan dalam urutan proses.
- [x] Status aktif diberi highlight.
- [x] Status gagal/cancelled diberi warna error.
- [x] User bisa refresh status mock.

## Checklist Rilis Frontend

- [x] Tidak ada React/Vue pada entry aktif.
- [x] Build Vite berhasil.
- [x] UI menggunakan CSS murni.
- [x] Backend tidak disentuh.
- [x] Data masih dummy/mock.
- [x] Palette warna tetap konsisten dengan desain saat ini.
- [x] Semua fitur prioritas 1 selesai.
- [x] Semua fitur prioritas 2 selesai.
- [x] Semua fitur prioritas 3 selesai.
- [ ] Semua fitur prioritas 4 selesai.
- [ ] Semua fitur prioritas 5 selesai.

## Urutan Pengerjaan Yang Disarankan

1. Keranjang belanja dan LocalStorage cart.
2. Checkout multi-item dari cart.
3. Riwayat order dan detail order.
4. Timeline status order.
5. Wishlist/favorit produk.
6. Profil seller/toko.
7. Filter dan sort lanjutan.
8. UX polish seperti skeleton loading, breadcrumb, dan mobile bottom nav.
