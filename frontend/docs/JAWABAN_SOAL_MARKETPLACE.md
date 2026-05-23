# Jawaban Soal Marketplace PasarKita

## 1. Nama Aplikasi dan Deskripsi

**Nama aplikasi:** Marketplace PasarKita

**Deskripsi aplikasi:**  
Marketplace PasarKita adalah aplikasi jual beli online untuk produk UMKM dalam ekosistem UMKM digital. Aplikasi ini mempertemukan **Customer** sebagai pembeli dan **Seller** sebagai penjual. Selain itu, terdapat **Admin** yang bertugas memantau aktivitas marketplace.

Marketplace PasarKita memiliki fitur utama seperti melihat daftar produk, detail produk, checkout, manajemen produk oleh seller, status order, dan pemantauan transaksi. Aplikasi ini tidak bekerja sendiri, tetapi terhubung dengan aplikasi lain melalui **API Gateway / Integrator** dan **SmartBank**. Marketplace tidak memotong saldo secara langsung, tetapi hanya membuat **payment request** yang diteruskan ke SmartBank melalui API Gateway.

Role dalam aplikasi:

1. **Customer:** melihat produk, memilih barang, checkout, dan melihat status order.
2. **Seller:** mengelola produk, stok, harga, dan memproses pesanan.
3. **Admin:** memantau data produk, transaksi, user, dan aktivitas marketplace.

Fitur utama Marketplace PasarKita:

| Fitur | Deskripsi | Endpoint |
|---|---|---|
| Manajemen produk | Seller dapat menambah dan mengedit produk. | `/marketplace/manajemen_produk` |
| Browse produk | Customer dapat melihat daftar produk. | `/marketplace/browse_produk` |
| Checkout | Customer melakukan pembelian produk. | `/marketplace/checkout` |
| Integrasi pembayaran | Marketplace mengirim request pembayaran ke SmartBank melalui API Gateway. | `/marketplace/integrasi_pembayaran` |
| Status order | Customer melihat status pesanan. | `/marketplace/status_order` |
| Biaya layanan marketplace | Marketplace menghitung potongan fee marketplace dari transaksi. | `/marketplace/biaya_layanan_marketplace` |

Batasan aplikasi:

- Marketplace tidak mengubah saldo secara langsung.
- Semua transaksi pembayaran wajib melalui API Gateway dan SmartBank.
- Marketplace hanya membuat order, menghitung total, menghitung fee, membuat payment request, menyimpan status order, dan memicu pengiriman setelah pembayaran sukses.
- Setiap endpoint harus menggunakan JSON, validasi input, JWT, dan logging request.

---

## 2. Proses Transaksi End-to-End Marketplace

Aktivitas ekonomi utama pada Marketplace PasarKita adalah ketika **Customer membeli produk dari Seller**.

Alur singkat transaksi:

```text
Customer -> Marketplace -> Checkout -> API Gateway -> SmartBank -> Status Pembayaran -> Order Diproses Seller
```

### 1. Input utama yang diterima aplikasi

Input utama yang diterima Marketplace berasal dari Customer dan Seller.

Input dari Customer:

- `user_id`
- `product_id`
- `qty`
- `alamat_pengiriman`
- token JWT
- data checkout
- metode pembayaran

Input dari Seller:

- nama produk
- harga produk
- stok produk
- kategori produk
- deskripsi produk
- status aktif/nonaktif produk

Input berdasarkan fitur utama:

| Fitur | Input |
|---|---|
| Manajemen produk | `user_id`, nama produk, harga, stok, kategori, deskripsi |
| Browse produk | `user_id`, keyword, kategori, filter, pagination |
| Checkout | `user_id`, `product_id`, `qty`, alamat pengiriman |
| Integrasi pembayaran | `user_id`, `order_id`, `total_bayar`, payment request |
| Status order | `user_id`, `order_id` |
| Biaya layanan marketplace | `user_id`, subtotal transaksi |

Pada saat checkout, Customer memilih produk dan jumlah barang. Marketplace kemudian menghitung:

- subtotal = `harga_produk x qty`
- biaya layanan marketplace = `2% x subtotal`
- total pembayaran = `subtotal + biaya layanan marketplace`

### 2. API yang perlu dipanggil ke sistem lain

Marketplace perlu berinteraksi dengan sistem lain melalui API Gateway.

API utama yang digunakan:

1. **Marketplace ke API Gateway**
   - Mengirim payment request.
   - Contoh endpoint:
   - `POST /integrator/marketplace/checkout`
   - atau forward request ke service tujuan melalui:
   - `ALL /integrator/:service/{path}`

2. **API Gateway ke SmartBank**
   - Untuk validasi saldo, pemotongan saldo Customer, transfer pembayaran ke Seller, dan pencatatan ledger.
   - Contoh endpoint SmartBank:
   - `POST /smartbank/pembayaran_transaksi`

3. **Marketplace ke LogistiKita**
   - Setelah pembayaran berhasil, Marketplace dapat membuat request pengiriman.
   - Contoh endpoint:
   - `POST /logistikita/request_pengiriman`

4. **Marketplace ke API Gateway untuk validasi**
   - API Gateway memvalidasi token JWT sebelum request diteruskan.
   - Contoh endpoint:
   - `GET /integrator/validasi_request`

Endpoint internal Marketplace yang digunakan:

| Endpoint | Fungsi |
|---|---|
| `POST /marketplace/manajemen_produk` | Menambah atau mengedit produk seller. |
| `GET /marketplace/browse_produk` | Mengambil daftar produk. |
| `POST /marketplace/checkout` | Membuat order dan payment request. |
| `POST /marketplace/integrasi_pembayaran` | Mengirim request pembayaran ke SmartBank melalui API Gateway. |
| `GET /marketplace/status_order` | Mengambil status order. |
| `GET /marketplace/biaya_layanan_marketplace` | Menghitung fee marketplace. |

Endpoint API Gateway yang relevan:

| Endpoint | Fungsi |
|---|---|
| `GET /integrator/validasi_request` | Validasi JWT/token. |
| `ALL /integrator/:service/{path}` | Forward request ke service tujuan. |
| `GET /integrator/logging` | Melihat log request. |
| `GET /integrator/biaya_layanan_integrasi` | Melihat informasi fee integrasi 0.5%. |

### 3. Data yang dikirim dan diterima

Data yang dikirim Marketplace ke API Gateway:

```json
{
  "order_id": "ORD001",
  "user_id": "USR001",
  "seller_id": "SELLER001",
  "product_id": "PRD001",
  "qty": 2,
  "subtotal": 50000,
  "marketplace_fee": 1000,
  "total_bayar": 51000,
  "alamat_pengiriman": "Jl. Contoh No. 10"
}
```

Data yang diteruskan API Gateway ke SmartBank:

```json
{
  "user_id": "USR001",
  "seller_id": "SELLER001",
  "order_id": "ORD001",
  "amount": 51000,
  "description": "Pembayaran order Marketplace PasarKita"
}
```

Data yang diterima Marketplace dari SmartBank melalui API Gateway:

```json
{
  "order_id": "ORD001",
  "status_pembayaran": "berhasil",
  "transaction_id": "TXN001",
  "message": "Pembayaran berhasil"
}
```

Jika pembayaran gagal, Marketplace menerima status seperti:

```json
{
  "order_id": "ORD001",
  "status_pembayaran": "gagal",
  "message": "Saldo tidak mencukupi"
}
```

Output dari setiap fitur Marketplace:

| Fitur | Output |
|---|---|
| Manajemen produk | Status dan data hasil manajemen produk. |
| Browse produk | Status dan daftar produk. |
| Checkout | Status checkout, `order_id`, total biaya, dan payment request. |
| Integrasi pembayaran | Status pembayaran dari SmartBank. |
| Status order | Status order terbaru. |
| Biaya layanan marketplace | Nominal fee marketplace dan total bayar. |

### 4. Mekanisme validasi JWT/token

Saat Customer melakukan checkout, request harus membawa token JWT pada header:

```http
Authorization: Bearer <token>
```

Mekanisme validasinya:

1. Customer login dan mendapatkan token JWT.
2. Token dikirim bersama request checkout.
3. API Gateway menerima request dari Marketplace.
4. API Gateway menjalankan middleware validasi JWT.
5. Jika token valid, request diteruskan ke SmartBank.
6. Jika token tidak valid, expired, atau tidak ada, request ditolak.
7. Marketplace menampilkan pesan bahwa user harus login ulang.

Validasi JWT penting agar hanya user yang sah yang dapat melakukan transaksi ekonomi.

Validasi input juga dilakukan di Marketplace sebelum request dikirim ke API Gateway:

- `user_id` harus valid.
- `product_id` harus tersedia.
- `qty` harus lebih dari 0.
- `qty` tidak boleh melebihi stok.
- alamat pengiriman wajib diisi.
- subtotal dan fee harus dihitung ulang oleh sistem, bukan hanya percaya input user.

### 5. Risiko inkonsistensi data yang mungkin terjadi

Risiko inkonsistensi data dalam Marketplace:

1. **Pembayaran berhasil, tetapi status order belum berubah**
   - SmartBank sudah memotong saldo, tetapi Marketplace belum menerima response sukses.

2. **Stok berkurang padahal pembayaran gagal**
   - Marketplace mengurangi stok terlalu awal sebelum pembayaran benar-benar berhasil.

3. **Double checkout**
   - User menekan tombol checkout berkali-kali sehingga order atau payment request tercipta lebih dari satu.

4. **Order dibuat, tetapi payment request gagal dikirim**
   - Marketplace sudah membuat order, tetapi API Gateway atau SmartBank gagal menerima request.

5. **Request pengiriman terkirim padahal pembayaran belum valid**
   - LogistiKita memproses pengiriman sebelum status pembayaran benar-benar `PAID`.

6. **Fee gateway atau marketplace tidak tercatat**
   - Transaksi berhasil, tetapi fee tidak tersimpan dengan benar.

### 6. Dampak jika salah satu aplikasi lain mengalami kegagalan

Jika **API Gateway gagal**:

- Marketplace tidak bisa mengirim payment request.
- Checkout tidak dapat diproses.
- User harus diberi status "transaksi sedang bermasalah" atau "coba lagi nanti".

Jika **SmartBank gagal atau delay**:

- Saldo Customer tidak dapat divalidasi.
- Pembayaran tidak boleh dianggap berhasil.
- Status order harus tetap `PENDING_PAYMENT` atau `PAYMENT_PROCESSING`.

Jika **LogistiKita gagal**:

- Pembayaran tetap valid jika SmartBank sudah sukses.
- Namun pengiriman belum bisa dibuat.
- Status order dapat menjadi `PAID` atau `READY_FOR_SHIPMENT`, tetapi belum `SHIPPED`.

Jika **SupplierHub gagal**:

- Jika Marketplace membutuhkan data stok dari SupplierHub, order tidak boleh langsung diproses.
- Sistem harus menahan order sampai stok valid.

### 7. Strategi agar sistem tetap robust

Agar sistem tetap aman dan tidak menyebabkan kerusakan transaksi berantai, Marketplace perlu menerapkan strategi berikut:

1. **Gunakan status transaksi bertahap**
   - `DRAFT`
   - `PENDING_PAYMENT`
   - `PAYMENT_PROCESSING`
   - `PAID`
   - `PAYMENT_FAILED`
   - `READY_FOR_SHIPMENT`
   - `SHIPPED`
   - `COMPLETED`
   - `CANCELLED`

2. **Jangan kurangi stok sebelum pembayaran valid**
   - Stok boleh di-reserve sementara, tetapi tidak langsung dikurangi permanen.

3. **Gunakan idempotency key**
   - Setiap checkout memiliki `request_id` unik agar tidak terjadi double transaction.

4. **Gunakan retry mechanism**
   - Jika SmartBank delay, Marketplace dapat melakukan retry atau polling status pembayaran.

5. **Gunakan timeout**
   - Jika SmartBank terlalu lama merespons, order tetap dalam status `PAYMENT_PROCESSING`.

6. **Gunakan logging lengkap**
   - Semua request, response, error, dan status transaksi harus dicatat.

7. **Gunakan fallback status**
   - Jika sistem lain gagal, Marketplace tidak langsung membatalkan transaksi tanpa kepastian.

8. **Pisahkan tanggung jawab sistem**
   - Marketplace mengelola katalog dan order.
   - SmartBank mengelola saldo dan ledger.
   - API Gateway mengelola routing, JWT, logging, dan fee integrasi.
   - LogistiKita mengelola pengiriman.

Aturan sistem yang harus dipatuhi:

1. **Setiap fitur adalah node sistem**
   - Contoh: fitur checkout menjadi node `checkout` di Marketplace.

2. **Semua flow mengikuti pola IPO**
   - Input -> Proses -> Output.
   - Contoh: input `product_id` dan `qty`, proses hitung total, output payment request.

3. **Semua output transaksi adalah payment request**
   - Marketplace tidak boleh melakukan transaksi langsung tanpa sistem bank.

4. **SmartBank sebagai pusat kontrol**
   - Perubahan saldo hanya dilakukan oleh SmartBank.

5. **Wajib melalui API Gateway**
   - Semua komunikasi antar aplikasi melewati API Gateway.

6. **Validasi dan logging wajib**
   - Setiap request harus divalidasi dan dicatat.

7. **Tidak ada uang dibuat bebas**
   - Semua saldo dan transaksi harus berasal dari sistem bank.

8. **Semua layanan berbayar**
   - Marketplace memiliki fee 2%.
   - API Gateway memiliki fee 0.5%.
   - Layanan lain seperti logistik juga dapat memiliki biaya layanan.

9. **Setiap endpoint adalah kontrak sistem**
   - Contoh: `POST /marketplace/checkout` harus jelas input, proses, dan output-nya.

---

## 3. Analisis Lonjakan Transaksi Besar

Kondisi masalah:

1. SmartBank mengalami delay validasi pembayaran.
2. Marketplace tetap menerima checkout.
3. SupplierHub memiliki stok terbatas.
4. LogistiKita mengalami keterlambatan sinkronisasi ongkir.

Sebagai software engineer Marketplace, sistem harus tetap menjaga konsistensi transaksi dan tidak menyebabkan kerusakan berantai.

### 1. Agar transaksi ekonomi tetap konsisten

Marketplace tidak boleh langsung menganggap pembayaran berhasil ketika SmartBank mengalami delay. Setelah Customer checkout, status order harus dibuat sebagai:

```text
PAYMENT_PROCESSING
```

Artinya, Marketplace sudah menerima checkout, tetapi belum menerima validasi final dari SmartBank.

Marketplace hanya boleh mengubah status menjadi `PAID` jika SmartBank sudah mengirim response sukses. Jika SmartBank gagal atau saldo tidak cukup, status menjadi `PAYMENT_FAILED`.

### 2. Agar tidak terjadi double transaction

Marketplace harus menggunakan **idempotency key** atau `request_id` unik pada setiap checkout.

Contoh:

```json
{
  "request_id": "REQ-20260511-001",
  "order_id": "ORD001",
  "user_id": "USR001",
  "total_bayar": 51000
}
```

Jika Customer menekan tombol checkout berkali-kali, Marketplace memeriksa apakah `request_id` atau `order_id` yang sama sudah pernah diproses. Jika sudah, sistem tidak membuat transaksi baru, tetapi mengembalikan status transaksi sebelumnya.

Strategi tambahan:

- Disable tombol checkout setelah diklik.
- Tampilkan loading state.
- Gunakan timeout dan retry terkontrol.
- Jangan membuat payment request ganda untuk order yang sama.

### 3. Agar tidak terjadi pengurangan stok palsu

Marketplace tidak boleh langsung mengurangi stok permanen saat checkout dibuat. Stok harus menggunakan mekanisme:

1. **Available stock**
   - Stok yang tersedia untuk dibeli.

2. **Reserved stock**
   - Stok yang ditahan sementara saat user checkout.

3. **Confirmed stock reduction**
   - Stok benar-benar dikurangi setelah pembayaran berhasil.

Jika SmartBank delay, stok cukup di-reserve sementara. Jika pembayaran gagal atau timeout, reserved stock dikembalikan.

Contoh:

- Stok awal: 10
- Customer checkout 2 barang
- Reserved stock: 2
- Available stock sementara: 8
- Jika pembayaran sukses, stok final menjadi 8
- Jika pembayaran gagal, stok kembali menjadi 10

### 4. Agar sistem tetap scalable

Saat terjadi lonjakan transaksi, Marketplace sebaiknya tidak memproses semua request secara blocking.

Strategi scalability:

1. Gunakan queue untuk checkout request.
2. Gunakan async processing untuk payment status.
3. Gunakan pagination pada daftar produk.
4. Gunakan cache untuk katalog produk.
5. Gunakan rate limiting pada endpoint checkout.
6. Gunakan load balancer jika traffic tinggi.
7. Pisahkan proses checkout, payment status, dan order tracking.
8. Gunakan background job untuk sinkronisasi status pembayaran dan ongkir.

Dengan cara ini, Marketplace tetap dapat menerima traffic tinggi tanpa membuat sistem lain ikut overload.

### 5. Agar user tetap mendapatkan feedback yang jelas

User tidak boleh dibiarkan tanpa status. Marketplace harus menampilkan pesan yang jelas.

Contoh feedback:

- Jika checkout diterima: “Checkout berhasil dibuat. Pembayaran sedang diproses.”
- Jika SmartBank delay: “Pembayaran sedang diverifikasi oleh SmartBank. Mohon tunggu.”
- Jika stok tidak cukup: “Stok produk tidak mencukupi.”
- Jika ongkir belum sinkron: “Estimasi ongkir sedang diperbarui. Silakan coba beberapa saat lagi.”
- Jika pembayaran gagal: “Pembayaran gagal. Saldo tidak mencukupi atau terjadi gangguan.”
- Jika pembayaran sukses: “Pembayaran berhasil. Pesanan akan diproses seller.”

### 6. Agar ekosistem tidak mengalami cascade failure

Cascade failure terjadi jika kegagalan satu aplikasi menyebabkan aplikasi lain ikut gagal.

Agar tidak terjadi cascade failure, Marketplace harus:

1. **Tidak terus-menerus retry tanpa batas**
   - Retry harus dibatasi.

2. **Menggunakan circuit breaker**
   - Jika SmartBank terlalu sering gagal, Marketplace sementara menghentikan request baru ke SmartBank.

3. **Menggunakan fallback status**
   - Jika SmartBank delay, status tetap `PAYMENT_PROCESSING`.

4. **Memisahkan proses kritis**
   - Checkout, pembayaran, stok, dan pengiriman tidak diproses dalam satu langkah besar.

5. **Tidak mengirim request pengiriman sebelum pembayaran sukses**
   - LogistiKita hanya dipanggil setelah status `PAID`.

6. **Mencatat semua error**
   - Error dari SmartBank, SupplierHub, dan LogistiKita harus tercatat untuk audit.

---

## Komponen Paling Kritis dalam Marketplace

Komponen paling kritis adalah **Checkout Service / Order Service**.

Alasannya:

- Checkout adalah titik utama aktivitas ekonomi.
- Checkout menghitung total harga dan fee.
- Checkout membuat payment request.
- Checkout menentukan status order.
- Checkout berhubungan langsung dengan API Gateway dan SmartBank.
- Kesalahan pada checkout dapat menyebabkan double transaction, stok palsu, atau status pembayaran salah.

Komponen kritis lain:

1. **Payment Request Handler**
2. **Stock Validation**
3. **Order Status Manager**
4. **JWT Authentication Handler**
5. **API Gateway Client**
6. **Transaction Logger**

---

## Endpoint/API yang Harus Diprioritaskan

Endpoint paling prioritas:

1. **Checkout**
   - `POST /marketplace/checkout`
   - Endpoint paling penting karena memulai transaksi ekonomi.

2. **Status Order**
   - `GET /marketplace/status_order?order_id={order_id}`
   - Penting untuk memberi feedback kepada user.

3. **Payment Request ke API Gateway**
   - `POST /integrator/smartbank/pembayaran_transaksi`
   - Digunakan untuk meneruskan transaksi ke SmartBank.

4. **Browse Produk**
   - `GET /marketplace/browse_produk`
   - Harus tetap scalable saat traffic tinggi.

5. **Validasi Request**
   - `GET /integrator/validasi_request`
   - Untuk memastikan token JWT valid.

6. **Request Pengiriman**
   - `POST /logistikita/request_pengiriman`
   - Dipanggil setelah pembayaran berhasil.

---

## Log yang Wajib Dicatat

Marketplace wajib mencatat log berikut:

1. **Request checkout**
   - `order_id`
   - `request_id`
   - `user_id`
   - `product_id`
   - `qty`
   - waktu request

2. **Validasi stok**
   - stok sebelum checkout
   - stok yang di-reserve
   - hasil validasi stok

3. **Perhitungan pembayaran**
   - subtotal
   - marketplace fee 2%
   - gateway fee 0.5%
   - total bayar

4. **Request ke API Gateway**
   - endpoint tujuan
   - payload yang dikirim
   - waktu request
   - status response

5. **Response dari SmartBank**
   - `transaction_id`
   - status pembayaran
   - pesan error jika ada

6. **Perubahan status order**
   - status lama
   - status baru
   - timestamp perubahan

7. **Error log**
   - error dari API Gateway
   - error dari SmartBank
   - error dari LogistiKita
   - timeout
   - retry attempt

8. **Security log**
   - token invalid
   - token expired
   - request tanpa token

---

## Peran Clean Architecture dan SOLID

Clean Architecture membantu Marketplace tetap rapi karena setiap bagian sistem memiliki tanggung jawab yang jelas.

Contoh pembagian layer:

1. **Entity Layer**
   - Product
   - Order
   - User
   - PaymentRequest

2. **Use Case Layer**
   - CheckoutOrder
   - ValidateStock
   - CalculateFee
   - CreatePaymentRequest
   - UpdateOrderStatus

3. **Interface Adapter Layer**
   - Controller
   - Presenter
   - API Gateway Client
   - SmartBank Client

4. **Framework Layer**
   - Express / frontend framework / database / external API

Dengan Clean Architecture, jika SmartBank berubah endpoint, logic checkout tidak perlu diubah besar-besaran. Cukup ubah bagian API client.

Prinsip SOLID juga membantu:

1. **Single Responsibility Principle**
   - Checkout hanya mengurus checkout.
   - Payment service hanya mengurus payment request.
   - Stock service hanya mengurus stok.

2. **Open/Closed Principle**
   - Jika nanti ada metode pembayaran baru, sistem bisa ditambah tanpa merusak logic lama.

3. **Liskov Substitution Principle**
   - Payment provider seperti SmartBank, Virtual Account, atau QRIS bisa memakai interface yang sama.

4. **Interface Segregation Principle**
   - Service tidak dipaksa memakai method yang tidak dibutuhkan.

5. **Dependency Inversion Principle**
   - Use case checkout tidak bergantung langsung pada SmartBank, tetapi pada interface `PaymentGateway`.

Dengan prinsip ini, Marketplace lebih mudah diuji, lebih tahan terhadap perubahan, dan lebih aman saat salah satu sistem eksternal bermasalah.
