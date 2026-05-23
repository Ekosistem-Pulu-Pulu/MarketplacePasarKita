# Koreksi Jawaban Soal Marketplace PasarKita

Dokumen ini berisi bagian-bagian jawaban yang perlu diperbaiki atau ditajamkan. Formatnya mengikuti nomor soal, point yang diminta, bagian yang perlu diperbaiki, dan versi perbaikannya.

---

## Soal Nomor 2

### Nomor 2, Point 2: API yang Perlu Dipanggil ke Sistem Lain

**Bagian yang perlu diperbaiki:**

Pada jawaban sebelumnya terdapat contoh endpoint:

```text
POST /integrator/marketplace/checkout
```

**Masalah:**

Endpoint tersebut kurang tepat karena `checkout` adalah endpoint milik Marketplace, bukan endpoint Integrator.

**Perbaikan:**

Gunakan endpoint Marketplace:

```text
POST /marketplace/checkout
```

Untuk komunikasi antar-service, Marketplace menggunakan API Gateway / Integrator melalui endpoint:

```text
/integrator/routing_api
/integrator/validasi_request
/integrator/logging
/integrator/biaya_layanan_integrasi
```

---

### Nomor 2, Point 2: Endpoint SmartBank

**Bagian yang perlu diperbaiki:**

Jawaban sebelumnya sudah menyebut SmartBank, tetapi belum cukup spesifik dalam memilih endpoint yang relevan untuk Marketplace.

**Perbaikan:**

Endpoint SmartBank yang paling relevan untuk Marketplace adalah:

```text
/smartbank/pembayaran_transaksi
/smartbank/ledger_transaksi
/smartbank/biaya_layanan_bank
```

**Catatan:**

Endpoint berikut tidak perlu dijadikan endpoint utama Marketplace:

```text
/smartbank/transfer_antar_user
```

Endpoint tersebut cukup dijelaskan sebagai proses internal SmartBank untuk memindahkan saldo Customer ke Seller jika dibutuhkan.

---

### Nomor 2, Point 2: Endpoint LogistiKita

**Bagian yang perlu ditambahkan:**

Jawaban sebelumnya sudah menyebut LogistiKita, tetapi endpoint-nya belum lengkap.

**Perbaikan:**

Tambahkan endpoint LogistiKita berikut:

```text
/logistikita/biaya_pengiriman
/logistikita/request_pengiriman
/logistikita/tracking_status
/logistikita/pembayaran_logistik
```

**Alasan:**

Flow Marketplace tidak berhenti di pembayaran. Setelah pembayaran berhasil, order harus masuk ke proses pengiriman.

---

### Nomor 2, Point 3: Data yang Dikirim dan Diterima

**Bagian yang perlu diperbaiki:**

Payload sebelumnya sudah benar secara umum, tetapi belum dipisahkan berdasarkan endpoint Marketplace.

**Perbaikan untuk `/marketplace/checkout`:**

Data minimal:

```json
{
  "user_id": "USR001",
  "product_id": "PRD001",
  "qty": 2,
  "alamat_pengiriman": "Jl. Contoh No. 10",
  "payment_method": "SMARTBANK"
}
```

**Perbaikan untuk `/marketplace/integrasi_pembayaran`:**

Data yang dikirim:

```json
{
  "order_id": "ORD001",
  "user_id": "USR001",
  "seller_id": "SELLER001",
  "total_bayar": 51000,
  "marketplace_fee": 1000,
  "gateway_fee": 255,
  "payment_request_id": "PAYREQ001"
}
```

---

### Nomor 2, Point 3: Fee Transaksi

**Bagian yang perlu diperjelas:**

Jawaban sebelumnya sudah menyebut fee, tetapi belum memisahkan jenis fee secara jelas.

**Perbaikan:**

```text
Marketplace fee = 2%
API Gateway / Integrator fee = 0.5%
SmartBank fee = dari /smartbank/biaya_layanan_bank
Logistik fee = dari /logistikita/biaya_pengiriman atau /logistikita/biaya_layanan_logistik
```

---

### Nomor 2, Point 4: Mekanisme Validasi JWT/Token

**Bagian yang perlu diperjelas:**

Jawaban sebelumnya menyebut Marketplace dan API Gateway memvalidasi token, tetapi perlu dibedakan tanggung jawabnya.

**Perbaikan:**

Marketplace boleh mengecek session/token user pada sisi aplikasi. Namun validasi resmi request antar-service dilakukan oleh API Gateway melalui:

```text
/integrator/validasi_request
```

Alur validasi:

```text
Marketplace kirim Authorization Bearer token
-> API Gateway validasi JWT
-> jika valid, request diteruskan
-> jika tidak valid, request ditolak
```

---

### Nomor 2, Point 5: Risiko Inkonsistensi Data

**Bagian yang perlu ditambahkan:**

Tambahkan risiko terkait ongkir dan request pengiriman.

**Perbaikan tambahan:**

```text
Ongkir belum sinkron dari LogistiKita, tetapi Marketplace sudah menampilkan total bayar lama.
```

```text
Request pengiriman terkirim dua kali karena retry tidak memakai idempotency key.
```

---

### Nomor 2, Point 6: Dampak Jika Salah Satu Aplikasi Lain Gagal

**Bagian yang perlu ditambahkan:**

Tambahkan dampak jika LogistiKita gagal sinkron ongkir.

**Perbaikan tambahan:**

```text
Jika LogistiKita gagal menghitung ongkir, checkout tetap bisa ditahan pada tahap validasi pengiriman.
Marketplace tidak boleh memfinalisasi total bayar yang mencakup ongkir sebelum response LogistiKita valid.
```

---

### Nomor 2, Point 7: Strategi agar Sistem Tetap Robust

**Bagian yang perlu ditambahkan:**

Tambahkan strategi khusus terkait gateway, payment, dan logistik.

**Perbaikan tambahan:**

```text
Gunakan idempotency key untuk checkout, payment request, dan request pengiriman.
Gunakan timeout saat memanggil SmartBank dan LogistiKita.
Gunakan retry terbatas.
Gunakan circuit breaker jika SmartBank atau LogistiKita sering gagal.
Gunakan fallback status PAYMENT_PROCESSING jika pembayaran belum final.
```

---

## Soal Nomor 3

### Nomor 3, Point 1: Transaksi Ekonomi Tetap Konsisten

**Bagian yang perlu diperbaiki:**

Jawaban sebelumnya sudah benar, tetapi perlu menekankan bahwa order tidak boleh langsung dianggap berhasil.

**Perbaikan:**

Saat SmartBank delay, status order harus:

```text
PAYMENT_PROCESSING
```

Bukan:

```text
PAID
```

---

### Nomor 3, Point 2: Tidak Terjadi Double Transaction

**Bagian yang perlu dipertegas:**

Idempotency key harus berlaku untuk lebih dari checkout.

**Perbaikan:**

Gunakan idempotency key untuk endpoint:

```text
/marketplace/checkout
/marketplace/integrasi_pembayaran
/smartbank/pembayaran_transaksi
/logistikita/request_pengiriman
```

---

### Nomor 3, Point 3: Tidak Terjadi Pengurangan Stok Palsu

**Bagian yang perlu dipertegas:**

Jangan mengurangi stok permanen sebelum pembayaran sukses.

**Perbaikan:**

Gunakan tiga status stok:

```text
available_stock
reserved_stock
confirmed_stock_reduction
```

Stok final hanya dikurangi setelah SmartBank mengembalikan status:

```text
PAID
```

---

### Nomor 3, Point 4: Sistem Tetap Scalable

**Bagian yang perlu ditambahkan:**

Marketplace harus tetap bisa menerima browsing walaupun traffic checkout sedang tinggi.

**Perbaikan tambahan:**

```text
Pisahkan traffic browse produk dan checkout.
Gunakan cache untuk /marketplace/browse_produk.
Gunakan queue untuk /marketplace/checkout.
Gunakan rate limit untuk checkout.
```

---

### Nomor 3, Point 5: User Tetap Mendapatkan Feedback Jelas

**Bagian yang perlu ditambahkan:**

Feedback harus dibedakan berdasarkan masalahnya.

**Perbaikan tambahan:**

```text
Jika SmartBank delay: Pembayaran sedang diverifikasi.
Jika stok terbatas: Stok sedang diamankan sementara.
Jika ongkir belum sinkron: Estimasi ongkir sedang diperbarui.
Jika API Gateway gagal: Sistem pembayaran sedang sibuk.
```

---

### Nomor 3, Point 6: Ekosistem Tidak Mengalami Cascade Failure

**Bagian yang perlu dipertegas:**

Jangan melakukan retry tanpa batas.

**Perbaikan:**

```text
Retry maksimal 3 kali.
Jika gagal terus, buka circuit breaker.
Marketplace tetap menyimpan order dalam status aman.
Jangan panggil LogistiKita jika pembayaran belum PAID.
Jangan panggil SmartBank berkali-kali untuk order yang sama.
```

---

## Soal Nomor 3: Komponen Kritis

### Bagian Komponen yang Paling Kritis

**Bagian yang sudah benar:**

Komponen paling kritis adalah:

```text
Checkout Service / Order Service
```

**Yang perlu ditambahkan:**

```text
Payment Integration Service
Stock Reservation Service
Order Status Service
Shipment Request Service
```

---

## Soal Nomor 3: Endpoint Prioritas

**Bagian yang perlu disesuaikan:**

Endpoint prioritas harus memakai daftar endpoint resmi.

**Perbaikan:**

```text
1. /marketplace/checkout
2. /marketplace/integrasi_pembayaran
3. /marketplace/status_order
4. /marketplace/biaya_layanan_marketplace
5. /marketplace/browse_produk
6. /integrator/validasi_request
7. /integrator/routing_api
8. /smartbank/pembayaran_transaksi
9. /smartbank/ledger_transaksi
10. /logistikita/biaya_pengiriman
11. /logistikita/request_pengiriman
12. /logistikita/tracking_status
```

---

## Soal Nomor 3: Log yang Wajib Dicatat

**Bagian yang perlu ditambahkan:**

Tambahkan log berikut:

```text
idempotency_key
payment_request_id
gateway_fee 0.5%
marketplace_fee 2%
ongkir dari LogistiKita
shipping_request_id
retry_count
timeout_status
circuit_breaker_status
```

---

## Soal Nomor 3: Clean Architecture / SOLID

**Bagian yang perlu dibuat lebih spesifik:**

Use case Marketplace perlu disebutkan sesuai fitur.

**Perbaikan use case:**

```text
BrowseProductUseCase
ManageProductUseCase
CheckoutUseCase
CalculateMarketplaceFeeUseCase
CreatePaymentRequestUseCase
UpdateOrderStatusUseCase
RequestShipmentUseCase
TrackShipmentUseCase
```

Dependency sebaiknya melalui interface:

```text
PaymentGatewayClient
IntegratorClient
LogisticsClient
ProductRepository
OrderRepository
```

Dengan perbaikan ini, jawaban menjadi lebih sesuai dengan endpoint resmi, alur transaksi Marketplace, serta prinsip robust system dalam ekosistem UMKM digital.
