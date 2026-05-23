# PRD Frontend Marketplace PasarKita

## 1. Ringkasan Produk

### Nama Produk
Marketplace PasarKita - Frontend App

### Platform
Frontend web menggunakan:

- Vite
- Vanilla JavaScript
- HTML
- CSS
- Fetch API
- LocalStorage untuk penyimpanan token sementara

### Latar Belakang
Marketplace PasarKita adalah aplikasi marketplace yang menjadi kanal jual beli produk UMKM dalam ekosistem ekonomi terintegrasi. Pada tahap ini, fokus pengembangan hanya pada frontend aplikasi marketplace, bukan backend, POS, supplier, logistik, SmartBank, atau analytics.

Frontend bertugas menyediakan tampilan dan interaksi pengguna untuk melihat produk, mencari produk, melihat detail produk, melakukan checkout, melihat status order, dan mengelola produk untuk seller/admin.

Semua transaksi keuangan tetap mengikuti aturan sistem: frontend marketplace tidak mengubah saldo, tidak melakukan debit/kredit, dan hanya mengirim request checkout/payment ke endpoint marketplace atau API Gateway.

---

## 2. Tujuan Produk

Tujuan frontend Marketplace PasarKita adalah:

1. Menyediakan antarmuka untuk user melihat dan membeli produk UMKM.
2. Menyediakan antarmuka untuk seller/admin mengelola produk.
3. Menampilkan ringkasan checkout yang mencakup subtotal, fee marketplace 2%, dan total pembayaran.
4. Mengirim request checkout ke backend Marketplace.
5. Menampilkan status order berdasarkan response backend.
6. Menjaga frontend tetap sesuai arsitektur microservice, yaitu tidak mengelola saldo dan tidak memproses transaksi keuangan secara langsung.

---

## 3. Scope Frontend

### 3.1 In Scope

Frontend Marketplace mencakup:

1. Halaman daftar produk.
2. Halaman detail produk.
3. Search dan filter produk sederhana.
4. Halaman checkout.
5. Perhitungan preview fee marketplace 2% di frontend.
6. Submit checkout ke API.
7. Halaman status order.
8. Dashboard seller/admin untuk manajemen produk.
9. Form tambah produk.
10. Form edit produk.
11. Nonaktifkan produk.
12. Komponen UI reusable.
13. API client menggunakan Fetch API.
14. Handling loading, success, empty state, dan error state.
15. Penyimpanan token JWT di LocalStorage.

### 3.2 Out of Scope

Frontend Marketplace tidak menangani:

1. Pengelolaan saldo user.
2. Debit/kredit rekening.
3. Perhitungan ongkir.
4. Pengiriman barang.
5. Dashboard analytics UMKM Insight.
6. Supplier flow.
7. POS/kasir.
8. Payment gateway sungguhan.
9. Backend database.
10. Autentikasi backend secara penuh, kecuali konsumsi token dari API.

---

## 4. Stakeholder dan User Role

### 4.1 Pembeli / User

Pembeli dapat:

1. Melihat daftar produk.
2. Mencari produk berdasarkan keyword.
3. Filter berdasarkan kategori.
4. Melihat detail produk.
5. Mengisi quantity.
6. Melakukan checkout.
7. Melihat status order.

### 4.2 Seller / UMKM

Seller dapat:

1. Melihat daftar produk miliknya.
2. Menambah produk.
3. Mengedit produk.
4. Menonaktifkan produk.
5. Melihat ringkasan order sederhana jika endpoint tersedia.

### 4.3 Admin Marketplace

Admin dapat:

1. Melihat semua produk.
2. Mengelola produk.
3. Melihat status order.
4. Mengecek alur checkout dari sisi UI.

---

## 5. Aturan Bisnis Frontend

1. Marketplace hanya membuat order dan payment request.
2. Marketplace tidak mengubah saldo user.
3. Semua checkout dikirim ke endpoint Marketplace/API Gateway.
4. Fee marketplace adalah 2% dari subtotal.
5. Subtotal dihitung dari harga produk dikali quantity.
6. Total pembayaran adalah subtotal ditambah fee marketplace.
7. Produk nonaktif tidak ditampilkan pada halaman browse publik.
8. Produk dengan stok 0 tidak bisa dicheckout.
9. Quantity checkout harus lebih dari 0.
10. Quantity checkout tidak boleh melebihi stok tersedia.
11. Status order harus ditampilkan berdasarkan data dari API.
12. Request privat harus menyertakan JWT jika token tersedia.

---

## 6. Fitur Frontend Utama

---

## 6.1 Halaman Daftar Produk

### Deskripsi
Halaman ini menampilkan katalog produk UMKM yang dapat dibeli oleh user.

### Komponen UI

1. Search bar produk.
2. Filter kategori.
3. Sort harga sederhana.
4. Product card.
5. Empty state jika produk tidak tersedia.
6. Loading state saat data sedang dimuat.
7. Error state jika API gagal.

### Data Produk Minimal

Setiap product card menampilkan:

1. Nama produk.
2. Harga.
3. Stok.
4. Kategori.
5. Deskripsi singkat.
6. Status aktif jika diperlukan.
7. Tombol lihat detail.
8. Tombol checkout cepat jika stok tersedia.

### Endpoint

```http
GET /marketplace/browse_produk?keyword={keyword}&page={page}&limit={limit}
Behavior
Saat halaman dibuka, frontend memanggil API browse produk.
User dapat mengetik keyword untuk mencari produk.
User dapat memilih kategori.
Produk nonaktif atau stok kosong tidak ditampilkan jika API sudah memfilter.
Jika API belum memfilter, frontend tetap menyaring produk dengan status_aktif === true dan stok > 0.
6.2 Halaman Detail Produk
Deskripsi

Halaman ini menampilkan informasi lengkap dari produk yang dipilih.

Komponen UI
Nama produk.
Deskripsi lengkap.
Harga.
Stok.
Kategori.
Seller ID/nama seller jika tersedia.
Quantity selector.
Preview subtotal.
Tombol lanjut checkout.
Behavior
User membuka detail produk dari daftar produk.
User memilih quantity.
Frontend memvalidasi quantity.
Jika quantity valid, user dapat lanjut ke halaman checkout.
Validasi Frontend
Quantity wajib angka.
Quantity harus lebih dari 0.
Quantity tidak boleh melebihi stok.
Tombol checkout disabled jika stok 0 atau produk nonaktif.
6.3 Halaman Checkout
Deskripsi

Halaman checkout menampilkan ringkasan pembelian dan form alamat pengiriman.

Komponen UI
Ringkasan produk.
Quantity.
Harga satuan.
Subtotal.
Marketplace fee 2%.
Total bayar.
Form alamat pengiriman.
Tombol submit checkout.
Alert validasi.
Loading button saat request dikirim.
Rumus Tampilan
subtotal = harga_produk x qty
marketplace_fee = subtotal x 2%
total_bayar = subtotal + marketplace_fee
Endpoint
POST /marketplace/checkout
Request Payload
{
  "user_id": "USR001",
  "product_id": "PRD001",
  "qty": 2,
  "alamat_pengiriman": "Jl. Contoh No. 10"
}
Response yang Diharapkan
{
  "status": "success",
  "data": {
    "order_id": "ORD001",
    "subtotal": 50000,
    "marketplace_fee": 1000,
    "total_bayar": 51000,
    "payment_request_id": "PAYREQ001",
    "status_order": "PENDING_PAYMENT"
  }
}
Behavior
User menekan tombol checkout.
Frontend validasi alamat dan quantity.
Frontend mengirim request ke endpoint checkout.
Jika berhasil, tampilkan halaman hasil checkout atau redirect ke status order.
Jika gagal, tampilkan pesan error dari API.
Frontend tidak melakukan perubahan saldo.
6.4 Halaman Status Order
Deskripsi

Halaman ini menampilkan status pembayaran/order setelah checkout.

Status Minimal
DRAFT
PENDING_PAYMENT
PAYMENT_PROCESSING
PAID
PAYMENT_FAILED
READY_FOR_SHIPMENT
SHIPPED
COMPLETED
CANCELLED
Endpoint
GET /marketplace/status_order?order_id={order_id}
Response yang Diharapkan
{
  "status": "success",
  "data": {
    "order_id": "ORD001",
    "status_order": "PAID"
  }
}
Komponen UI
Order ID.
Status badge.
Keterangan status.
Tombol refresh status.
Tombol kembali ke katalog.
Mapping Status Badge
Status	Label UI	Keterangan
DRAFT	Draft	Order belum dikirim
PENDING_PAYMENT	Menunggu Pembayaran	Payment request sudah dibuat
PAYMENT_PROCESSING	Diproses	Pembayaran sedang diproses
PAID	Dibayar	Pembayaran berhasil
PAYMENT_FAILED	Gagal	Pembayaran gagal
READY_FOR_SHIPMENT	Siap Dikirim	Menunggu proses logistik
SHIPPED	Dikirim	Pesanan sedang dikirim
COMPLETED	Selesai	Pesanan selesai
CANCELLED	Dibatalkan	Pesanan dibatalkan
6.5 Dashboard Seller/Admin Produk
Deskripsi

Dashboard ini digunakan seller/admin untuk mengelola produk.

Komponen UI
Tabel produk.
Tombol tambah produk.
Tombol edit produk.
Tombol nonaktifkan produk.
Badge status produk.
Search produk seller.
Modal/form produk.
Endpoint
POST /marketplace/manajemen_produk
GET /marketplace/browse_produk

Jika backend menyediakan endpoint REST tambahan, frontend boleh menggunakan:

PUT /marketplace/manajemen_produk/{product_id}
PATCH /marketplace/manajemen_produk/{product_id}/nonaktif
Form Produk

Field minimum:

seller_id
nama_produk
deskripsi
harga
stok
kategori
Validasi Frontend
Nama produk wajib diisi.
Harga wajib angka dan tidak boleh negatif.
Stok wajib angka dan tidak boleh negatif.
Kategori wajib diisi.
Deskripsi tidak boleh kosong.
6.6 Halaman Biaya Layanan Marketplace
Deskripsi

Halaman atau komponen kecil untuk menghitung fee marketplace berdasarkan subtotal.

Endpoint Opsional
GET /marketplace/biaya_layanan_marketplace?subtotal={subtotal}
Behavior
Jika endpoint tersedia, frontend dapat mengambil perhitungan dari API.
Jika endpoint belum tersedia, frontend boleh menghitung preview fee dengan rumus 2%.
Perhitungan final tetap mengikuti response backend checkout.
7. Struktur Folder Frontend
frontend-marketplace/
├── index.html
├── package.json
├── vite.config.js
├── .env.example
└── src/
    ├── main.js
    ├── router.js
    ├── config/
    │   └── apiConfig.js
    ├── api/
    │   ├── client.js
    │   └── marketplaceApi.js
    ├── components/
    │   ├── Navbar.js
    │   ├── ProductCard.js
    │   ├── ProductForm.js
    │   ├── ProductTable.js
    │   ├── StatusBadge.js
    │   ├── Loading.js
    │   ├── EmptyState.js
    │   └── Toast.js
    ├── pages/
    │   ├── ProductListPage.js
    │   ├── ProductDetailPage.js
    │   ├── CheckoutPage.js
    │   ├── OrderStatusPage.js
    │   └── SellerDashboardPage.js
    ├── utils/
    │   ├── currency.js
    │   ├── feeCalculator.js
    │   ├── storage.js
    │   └── validation.js
    ├── mocks/
    │   ├── mockProducts.js
    │   └── mockOrders.js
    └── styles/
        └── style.css
8. Routing Frontend

Gunakan hash routing sederhana agar tidak perlu konfigurasi server tambahan.

Route	Halaman	Deskripsi
#/products	ProductListPage	Daftar produk
#/products/:id	ProductDetailPage	Detail produk
#/checkout/:id	CheckoutPage	Checkout produk
#/orders/:id	OrderStatusPage	Status order
#/seller/products	SellerDashboardPage	Dashboard produk seller/admin

Default route:

#/products
9. API Client Requirement
9.1 Base URL

Gunakan environment variable:

VITE_API_BASE_URL=http://localhost:8000/api
9.2 Client Behavior

File src/api/client.js harus:

Membaca base URL dari environment variable.
Menambahkan header Content-Type: application/json.
Menambahkan header Authorization: Bearer {token} jika token tersedia.
Melakukan parsing JSON.
Melempar error jika response tidak OK.
Mengembalikan data JSON jika sukses.
9.3 Marketplace API Function

File src/api/marketplaceApi.js minimal menyediakan fungsi:

browseProducts(params)
createProduct(payload)
updateProduct(productId, payload)
deactivateProduct(productId)
checkout(payload)
getOrderStatus(orderId)
calculateMarketplaceFee(subtotal)
10. Data Mocking dan Fallback

Karena fokus tahap ini adalah frontend, aplikasi harus tetap bisa berjalan meskipun backend belum siap.

Requirement Mock Mode
Tambahkan konfigurasi VITE_USE_MOCK=true.
Jika mock mode aktif, API client menggunakan data dummy dari file lokal.
Jika mock mode nonaktif, API client menggunakan backend asli.
Data Dummy Minimal

Produk dummy minimal 6 item dengan variasi kategori, harga, dan stok.

Order dummy minimal mencakup status:

PENDING_PAYMENT
PAID
PAYMENT_FAILED
SHIPPED
11. UI/UX Requirement
11.1 Style Umum
Tampilan bersih dan sederhana.
Responsive untuk desktop dan mobile dasar.
Gunakan layout navbar + content.
Product card menggunakan grid.
Seller dashboard menggunakan tabel.
Warna badge status berbeda secara visual.
Form memiliki label yang jelas.
Error message mudah dibaca.
11.2 State yang Wajib Ditangani
Loading state.
Empty state.
Error state.
Success state.
Disabled button ketika form tidak valid.
Confirmation sebelum nonaktifkan produk.
12. Acceptance Criteria
12.1 Product List
User dapat melihat daftar produk.
User dapat mencari produk berdasarkan keyword.
User dapat filter kategori.
Produk dengan stok 0 ditampilkan sebagai habis atau tidak bisa checkout.
Jika tidak ada produk, tampil empty state.
12.2 Product Detail
User dapat melihat detail produk.
User dapat memilih quantity.
Frontend menolak quantity 0 atau negatif.
Frontend menolak quantity lebih besar dari stok.
User dapat lanjut ke checkout jika input valid.
12.3 Checkout
Frontend menampilkan subtotal.
Frontend menampilkan marketplace fee 2%.
Frontend menampilkan total bayar.
Frontend mewajibkan alamat pengiriman.
Submit checkout mengirim payload sesuai API contract.
Jika API sukses, user diarahkan ke status order.
Jika API gagal, pesan error tampil.
12.4 Order Status
User dapat melihat status order berdasarkan order_id.
Status ditampilkan sebagai badge.
User dapat refresh status.
Jika order tidak ditemukan, tampil pesan error.
12.5 Seller Dashboard
Seller/admin dapat melihat tabel produk.
Seller/admin dapat menambah produk.
Seller/admin dapat mengedit produk jika endpoint tersedia.
Seller/admin dapat menonaktifkan produk jika endpoint tersedia.
Form produk memiliki validasi.
12.6 API Client
Semua request menggunakan Fetch API.
Token JWT otomatis dikirim jika tersedia.
Error API ditampilkan ke user.
App tetap bisa jalan menggunakan mock mode.
13. Prioritas Implementasi Frontend
Must Have
Setup Vite Vanilla JS.
Routing sederhana.
Product list.
Product detail.
Checkout page.
Fee calculation 2%.
Order status page.
Seller dashboard basic.
API client.
Mock data mode.
Should Have
Filter kategori.
Sort harga.
Toast notification.
Responsive mobile.
Confirmation modal.
Could Have
Wishlist.
Rating produk.
Riwayat order lengkap.
Dark mode.
Skeleton loading.
14. Rencana Pengembangan Bertahap
Fase 1 - Foundation
Setup Vite Vanilla JS.
Buat struktur folder.
Buat router hash.
Buat layout navbar.
Buat API client.
Buat mock data.
Fase 2 - Buyer Flow
Product list.
Search/filter produk.
Product detail.
Quantity selector.
Checkout page.
Order status page.
Fase 3 - Seller/Admin Flow
Seller dashboard.
Product table.
Product form.
Create product.
Edit product.
Deactivate product.
Fase 4 - UI Polish dan Testing
Responsive layout.
Loading, empty, dan error state.
Toast notification.
Validasi form.
Manual testing semua flow.