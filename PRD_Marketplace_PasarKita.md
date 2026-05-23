# PRD Marketplace PasarKita

## 1. Ringkasan Produk

### Nama Produk
Marketplace PasarKita

### Latar Belakang
PasarKita adalah aplikasi marketplace yang menjadi kanal jual beli produk UMKM dalam ekosistem ekonomi terintegrasi. Berdasarkan diagram yang diberikan, PasarKita hanya berfokus pada aktivitas marketplace, bukan POS, supplier, logistik, atau analytics. Modul ini menangani katalog produk, penelusuran produk, checkout, penghitungan biaya layanan marketplace, pembuatan order, dan pengiriman payment request ke SmartBank melalui API Gateway.

### Tujuan Produk
- Menyediakan kanal jual beli produk UMKM.
- Memfasilitasi user untuk melihat produk dan melakukan checkout.
- Menghasilkan order dan payment request yang valid ke SmartBank.
- Menerapkan fee marketplace secara konsisten pada setiap transaksi.
- Menjaga agar seluruh perubahan saldo tetap terpusat di SmartBank.

### Posisi Dalam Ekosistem
Marketplace PasarKita berperan sebagai demand generator B2C yang menyalurkan uang dari konsumen ke UMKM. Aplikasi ini tidak mengelola saldo, tidak melakukan debit langsung, dan tidak menghitung ongkir. Marketplace hanya membuat request transaksi dan menerima status hasil transaksi dari sistem lain.

## 2. Ruang Lingkup

### In Scope
- Manajemen produk oleh seller/admin marketplace.
- Browse produk oleh user.
- Checkout produk.
- Pembuatan order.
- Integrasi pembayaran ke SmartBank melalui API Gateway.
- Penyimpanan status order.
- Perhitungan fee marketplace.
- Pelacakan status order dasar.

### Out of Scope
- Pengelolaan saldo user.
- Proses debit/kredit rekening.
- Perhitungan ongkir.
- Pengiriman barang oleh sistem logistik.
- Analitik UMKM Insight.
- Pembelian bahan baku atau supplier flow.
- Fitur POS/kasir.

## 3. Stakeholder

- Mahasiswa/User: melihat produk dan membeli produk.
- Seller/UMKM: mengelola produk yang dijual.
- Admin Marketplace: mengawasi katalog, order, dan konfigurasi fee.
- API Gateway/Integrator: penghubung request dari Marketplace ke layanan lain.
- SmartBank: pusat kontrol transaksi keuangan.
- LogistikKita: menerima trigger pengiriman setelah pembayaran berhasil.

## 4. Aturan Bisnis Utama

- Setiap fitur direpresentasikan sebagai node sistem tersendiri.
- Semua alur mengikuti pola Input -> Proses -> Output.
- Semua output transaksi keuangan harus berupa payment request.
- Marketplace tidak boleh mengubah saldo secara langsung.
- Seluruh komunikasi ke SmartBank wajib melalui API Gateway.
- Validasi input dan logging wajib untuk setiap request.
- Endpoint merupakan kontrak sistem dan harus konsisten.
- Fee marketplace dipotong pada saat transaksi checkout.
- Analytics hanya membaca data, tidak mengubah transaksi.

## 5. User Persona dan Use Case

### Persona Utama
- Pembeli: mahasiswa atau user yang ingin mencari dan membeli produk UMKM.
- Penjual: pemilik UMKM yang ingin menambahkan dan mengelola katalog produk.
- Admin: pihak yang menjaga kualitas data produk dan operasional marketplace.

### Use Case Utama
1. Seller menambah, mengubah, dan melihat produk.
2. User menelusuri daftar produk.
3. User memilih produk dan melakukan checkout.
4. Sistem menghitung subtotal, fee marketplace, dan total pembayaran.
5. Sistem membuat order dengan status awal `PENDING_PAYMENT`.
6. Sistem mengirim payment request ke SmartBank melalui Gateway.
7. Sistem menerima hasil pembayaran.
8. Jika pembayaran sukses, sistem mengubah order menjadi `PAID` dan memicu logistik.
9. User melihat status order.

## 6. Problem Statement

Tanpa modul marketplace yang terstruktur, user tidak memiliki kanal terpusat untuk menemukan produk UMKM dan menyelesaikan transaksi secara konsisten. Selain itu, jika marketplace menangani saldo sendiri, akan terjadi pelanggaran terhadap arsitektur inti yang mensyaratkan SmartBank sebagai pusat kontrol transaksi.

## 7. Solusi yang Diusulkan

Membangun modul Marketplace PasarKita berbasis REST API yang:
- Menyediakan fitur manajemen produk.
- Menyediakan fitur browse produk untuk pembeli.
- Menangani checkout dan pembentukan order.
- Menghitung fee marketplace sebesar 2% per transaksi.
- Mengirim payment request ke SmartBank melalui API Gateway.
- Menyimpan status order hingga siap diproses oleh logistik.

## 8. Sasaran Keberhasilan

### Sasaran Fungsional
- User dapat melihat daftar produk dan detailnya.
- Seller dapat mengelola data produk.
- User dapat checkout produk dan menghasilkan order.
- Sistem berhasil mengirim payment request ke SmartBank.
- Status order dapat ditelusuri setelah checkout.

### Sasaran Non-Fungsional
- Semua request tervalidasi.
- Semua endpoint mengembalikan JSON.
- Audit log tersedia untuk request penting.
- Tidak ada perubahan saldo di sisi marketplace.

### Metrik Sukses Awal
- 100% checkout menghasilkan order_id.
- 100% transaksi finansial dikirim ke SmartBank via Gateway.
- 0 kasus perubahan saldo dilakukan di Marketplace.
- Waktu respons browse produk < 2 detik untuk data katalog normal.

## 9. Fitur Utama

### 9.1 Manajemen Produk
Seller atau admin dapat menambah, melihat, mengubah, dan menonaktifkan produk.

#### Data Minimum Produk
- product_id
- seller_id
- nama_produk
- deskripsi
- harga
- stok
- kategori
- status_aktif
- created_at
- updated_at

#### Aturan
- Harga dan stok tidak boleh negatif.
- Produk nonaktif tidak tampil pada browse publik.
- Hanya seller pemilik produk atau admin yang boleh mengubah produk.

### 9.2 Browse Produk
User dapat melihat daftar produk yang tersedia, mencari produk, dan melihat detail produk.

#### Aturan
- Hanya produk aktif dengan stok > 0 yang muncul.
- Dapat didukung filter kategori, keyword, dan urutan harga.

### 9.3 Checkout
User memilih produk dan kuantitas, lalu sistem menghitung subtotal, fee marketplace, dan total pembayaran.

#### Rumus
- subtotal = harga_produk x qty
- marketplace_fee = 2% x subtotal
- total_pembayaran = subtotal + marketplace_fee

#### Aturan
- Qty harus > 0.
- Qty tidak boleh melebihi stok tersedia.
- Checkout menghasilkan order sebelum request pembayaran dikirim.

### 9.4 Integrasi Pembayaran
Marketplace mengirim payment request ke SmartBank melalui API Gateway.

#### Aturan
- Marketplace hanya membuat request transaksi.
- Status transaksi berasal dari SmartBank.
- Jika payment gagal, order tetap tersimpan dengan status gagal/tertunda.

### 9.5 Status Order
User dapat melihat status order dari awal checkout hingga sesudah pembayaran.

#### Status Minimal
- DRAFT
- PENDING_PAYMENT
- PAYMENT_PROCESSING
- PAID
- PAYMENT_FAILED
- READY_FOR_SHIPMENT
- SHIPPED
- COMPLETED
- CANCELLED

### 9.6 Fee Marketplace
Setiap transaksi dikenakan fee marketplace sebesar 2%.

#### Tujuan Fee
- Revenue marketplace.
- Simulasi money sink dalam ekosistem ekonomi.
- Menjaga konsistensi aturan ekonomi pada sistem.

## 10. Alur Proses Utama

### 10.1 Browse Produk
Input:
- user_id
- keyword atau filter

Proses:
- Validasi request.
- Ambil daftar produk aktif.
- Terapkan filter dan pagination.

Output:
- daftar produk
- metadata pagination

### 10.2 Checkout
Input:
- user_id
- product_id
- qty
- alamat pengiriman

Proses:
- Validasi request dan autentikasi user.
- Ambil data produk.
- Validasi stok.
- Hitung subtotal, fee marketplace, dan total bayar.
- Buat order.
- Kirim payment request ke SmartBank via Gateway.
- Simpan status hasil request pembayaran.

Output:
- order_id
- subtotal
- marketplace_fee
- total_bayar
- payment_request_id
- status_order

### 10.3 Update Status Order
Input:
- order_id
- callback/status hasil pembayaran

Proses:
- Verifikasi sumber update.
- Cocokkan dengan order terkait.
- Ubah status order berdasarkan hasil pembayaran.
- Jika sukses, kirim trigger ke logistik.

Output:
- order_id
- status_order terbaru

## 11. Arsitektur Tingkat Tinggi

### Komponen
- Client App: frontend user/seller.
- Marketplace Service: modul inti PasarKita.
- API Gateway: routing API, validasi JWT, logging, fee metadata.
- SmartBank: validasi saldo, debit/kredit, pencatatan ledger.
- LogistikKita: pengiriman barang setelah pembayaran sukses.

### Alur Singkat
1. User melakukan request ke Marketplace.
2. Marketplace memproses bisnis katalog/order.
3. Untuk transaksi keuangan, Marketplace mengirim request ke API Gateway.
4. Gateway meneruskan ke SmartBank.
5. SmartBank mengembalikan status transaksi.
6. Marketplace memperbarui status order.
7. Jika sukses, Marketplace memicu LogistikKita.

## 12. API Contract Awal

Semua response dalam format JSON.

### 12.1 Manajemen Produk
`POST /marketplace/manajemen_produk`

Request:
```json
{
  "seller_id": "SELLER001",
  "nama_produk": "Kopi Arabika",
  "deskripsi": "Kopi lokal kemasan 200 gram",
  "harga": 25000,
  "stok": 100,
  "kategori": "Minuman"
}
```

Response:
```json
{
  "status": "success",
  "message": "Produk berhasil disimpan",
  "data": {
    "product_id": "PRD001"
  }
}
```

### 12.2 Browse Produk
`GET /marketplace/browse_produk?keyword=kopi&page=1&limit=10`

Response:
```json
{
  "status": "success",
  "data": [
    {
      "product_id": "PRD001",
      "nama_produk": "Kopi Arabika",
      "harga": 25000,
      "stok": 100
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

### 12.3 Checkout
`POST /marketplace/checkout`

Request:
```json
{
  "user_id": "USR001",
  "product_id": "PRD001",
  "qty": 2,
  "alamat_pengiriman": "Jl. Contoh No. 10"
}
```

Response:
```json
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
```

### 12.4 Integrasi Pembayaran
`POST /marketplace/integrasi_pembayaran`

Request:
```json
{
  "order_id": "ORD001",
  "user_id": "USR001",
  "total_bayar": 51000
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "payment_request_id": "PAYREQ001",
    "status_transaksi": "PROCESSING"
  }
}
```

### 12.5 Status Order
`GET /marketplace/status_order?order_id=ORD001`

Response:
```json
{
  "status": "success",
  "data": {
    "order_id": "ORD001",
    "status_order": "PAID"
  }
}
```

### 12.6 Biaya Layanan Marketplace
`GET /marketplace/biaya_layanan_marketplace?subtotal=50000`

Response:
```json
{
  "status": "success",
  "data": {
    "subtotal": 50000,
    "marketplace_fee_percent": 2,
    "marketplace_fee_amount": 1000,
    "total_bayar": 51000
  }
}
```

## 13. Integrasi SmartBank

### Prinsip Integrasi
- Semua transaksi keuangan diproses di SmartBank.
- Marketplace tidak menyentuh saldo user.
- API Gateway menjadi jalur wajib integrasi.

### Data yang Dikirim ke Gateway/SmartBank
- order_id
- user_id
- nominal total_bayar
- breakdown subtotal dan fee
- sumber transaksi = marketplace
- timestamp

### Hasil yang Diterima
- payment_request_id
- status transaksi
- pesan error jika gagal

### Ketergantungan
- JWT valid dari Gateway
- Endpoint SmartBank aktif
- Callback atau polling status pembayaran tersedia

## 14. Desain Data Awal

### Tabel `users`
- user_id
- nama
- role
- created_at

### Tabel `products`
- product_id
- seller_id
- nama_produk
- deskripsi
- harga
- stok
- kategori
- status_aktif
- created_at
- updated_at

### Tabel `orders`
- order_id
- user_id
- total_biaya
- marketplace_fee
- alamat_pengiriman
- status_order
- created_at
- updated_at

### Tabel `order_items`
- order_item_id
- order_id
- product_id
- qty
- harga_satuan
- subtotal

### Tabel `payment_requests`
- payment_request_id
- order_id
- user_id
- nominal
- channel
- status_transaksi
- external_reference
- created_at
- updated_at

### Relasi Sederhana
- Satu user dapat memiliki banyak order.
- Satu order memiliki banyak order_item.
- Satu product dapat muncul di banyak order_item.
- Satu order memiliki satu atau lebih catatan payment request.

## 15. Mekanisme Transaksi

### Alur Finansial
1. User memilih produk.
2. Marketplace menghitung subtotal dan fee 2%.
3. Marketplace membuat order.
4. Marketplace mengirim payment request ke SmartBank via Gateway.
5. SmartBank memvalidasi saldo dan mencatat ledger.
6. SmartBank mengembalikan status transaksi.
7. Marketplace memperbarui status order.
8. Jika sukses, proses logistik dapat dimulai.

### Kegagalan yang Harus Ditangani
- Produk tidak ditemukan.
- Stok tidak cukup.
- Payload tidak valid.
- Gateway tidak tersedia.
- SmartBank menolak transaksi.
- Callback terlambat atau duplikat.

## 16. Kebutuhan Non-Fungsional

### Keamanan
- Semua endpoint privat wajib JWT.
- Validasi role untuk seller/admin.
- Tidak ada endpoint yang mengubah saldo.
- Idempotency key direkomendasikan untuk checkout/payment.

### Reliability
- Order tetap tersimpan meskipun payment gagal.
- Logging request/response integrasi wajib tersedia.
- Retry terkontrol untuk request pembayaran yang timeout.

### Maintainability
- Gunakan pola MVC atau Clean Code.
- Pisahkan controller, service, repository, dan integration client.
- Gunakan JSON konsisten pada semua endpoint.

## 17. UI Sederhana

### Halaman yang Dibutuhkan
- Halaman daftar produk.
- Halaman detail produk.
- Halaman checkout.
- Halaman status order.
- Halaman dashboard seller untuk manajemen produk.

### Komponen Minimum
- Search bar produk.
- Product card.
- Quantity selector.
- Ringkasan pembayaran.
- Status badge order.
- Form tambah/edit produk.

## 18. Skenario Pengujian Awal

| No | Skenario | Input | Expected Result |
| --- | --- | --- | --- |
| 1 | Browse produk sukses | keyword valid | daftar produk tampil |
| 2 | Tambah produk sukses | data produk valid | produk tersimpan |
| 3 | Checkout sukses | product_id valid, qty valid | order terbentuk dan payment request dibuat |
| 4 | Checkout gagal karena stok kurang | qty > stok | response error validasi |
| 5 | Payment gagal | saldo tidak cukup | status order menjadi `PAYMENT_FAILED` |
| 6 | Lihat status order | order_id valid | status order tampil |
| 7 | Akses tanpa JWT | request endpoint privat | ditolak unauthorized |
| 8 | Produk nonaktif dibrowse | product status nonaktif | produk tidak tampil |

## 19. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Marketplace mencoba mengubah saldo | Melanggar arsitektur inti | Batasi operasi finansial hanya lewat SmartBank |
| Checkout duplikat | Double payment request | Gunakan idempotency key |
| Data stok tidak sinkron | Overselling | Lock stok saat checkout atau validasi ulang sebelum order final |
| Gateway atau SmartBank down | Checkout gagal | Simpan order, tandai pending/retry, log error |
| Callback status tidak konsisten | Status order salah | Validasi signature/source dan buat status transition rule |

## 20. Prioritas Implementasi

### Must Have
- Manajemen produk
- Browse produk
- Checkout
- Integrasi pembayaran ke SmartBank
- Status order
- Fee marketplace 2%

### Should Have
- Filter dan pagination browse
- Retry transaksi gagal
- Audit log admin

### Could Have
- Wishlist
- Rating produk
- Riwayat pembelian detail

## 21. Rencana Pengembangan Bertahap

### Fase 1
- CRUD produk
- Browse produk
- Checkout dasar
- Pembuatan order

### Fase 2
- Integrasi Gateway dan SmartBank
- Status order
- Logging dan validasi JWT

### Fase 3
- Trigger logistik
- Hardening error handling
- Dashboard seller yang lebih lengkap

## 22. Kesimpulan

Marketplace PasarKita adalah modul penjualan produk UMKM yang berfungsi sebagai kanal transaksi B2C dalam ekosistem sistem yang lebih besar. Fokus utamanya adalah katalog produk, checkout, order, dan integrasi pembayaran yang sepenuhnya bergantung pada SmartBank sebagai pusat kontrol keuangan. Dengan batasan ini, marketplace tetap sederhana, konsisten dengan arsitektur sistem, dan siap dijadikan dasar implementasi backend maupun frontend.