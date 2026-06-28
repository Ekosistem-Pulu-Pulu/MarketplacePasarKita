# Spesifikasi Ringkas: Marketplace PasarKita

Dokumen ini berisi spesifikasi ringkas untuk **Marketplace PasarKita** sebagai pemenuhan Tugas Praktek Mandiri. 

---

## 1. Deskripsi Fungsional (Ruang Lingkup)

**Marketplace PasarKita** adalah sebuah platform B2C (Business-to-Consumer) berbasis web/mobile yang dirancang khusus untuk memfasilitasi transaksi jual beli produk Usaha Mikro, Kecil, dan Menengah (UMKM). Sistem ini berfungsi sebagai wadah bagi Penjual (UMKM) untuk mempublikasikan dan mengelola katalog produk mereka, serta memberikan kemudahan bagi Pembeli untuk melakukan pencarian, penelusuran, hingga proses pemesanan (*checkout*) produk secara online. Di dalam ekosistem sistem yang lebih luas, PasarKita bertindak sebagai penghasil permintaan (*demand generator*), di mana setiap transaksi dikenakan biaya layanan (*marketplace fee*) sebesar 2% yang dihitung secara otomatis, sedangkan pengelolaan saldo pengguna dan verifikasi transaksi keuangan sepenuhnya didelegasikan secara aman ke sistem perbankan eksternal (**SmartBank**) melalui **API Gateway**.

---

## 2. Visualisasi Desain: Diagram Konteks (DFD Level 0)

Berikut adalah Diagram Konteks (Data Flow Diagram Level 0) yang menggambarkan batasan sistem Marketplace PasarKita, entitas luar yang berinteraksi, serta aliran data masuk dan keluar dari sistem.

```mermaid
graph TD
    %% Node Definitions with Standard Shapes
    Sistem(((Marketplace PasarKita)))
    Pembeli["Pembeli (User)"]
    Penjual["Penjual (UMKM)"]
    Admin["Admin Marketplace"]
    SmartBank["SmartBank (via API Gateway)"]
    LogistikKita["Sistem LogistikKita"]

    %% Custom Styling
    style Sistem fill:#fff9c4,stroke:#fbc02d,stroke-width:3px
    style Pembeli fill:#e1f5fe,stroke:#0288d1,stroke-width:2px
    style Penjual fill:#e8f5e9,stroke:#388e3c,stroke-width:2px
    style Admin fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style SmartBank fill:#ffebee,stroke:#c62828,stroke-width:2px
    style LogistikKita fill:#efebe9,stroke:#4e342e,stroke-width:2px

    %% Flows between Pembeli & Sistem
    Pembeli -->|"1. Browse & Cari Produk<br>2. Data Checkout (product_id, qty)"| Sistem
    Sistem -->|"1. Katalog & Detail Produk<br>2. Detail Order & Status Pembayaran"| Pembeli

    %% Flows between Penjual & Sistem
    Penjual -->|"1. Kelola Katalog (Tambah/Edit)<br>2. Update Stok & Status Toko"| Sistem
    Sistem -->|"1. Laporan Penjualan<br>2. Status Stok & Notifikasi Order"| Penjual

    %% Flows between Admin & Sistem
    Admin -->|"1. Konfigurasi Fee Marketplace<br>2. Moderasi Produk & Toko"| Sistem
    Sistem -->|"1. Audit Log Transaksi<br>2. Laporan Aktivitas Platform"| Admin

    %% Flows between Sistem & External Systems
    Sistem -->|"Kirim Payment Request<br>(order_id, total_bayar)"| SmartBank
    SmartBank -->|"Callback Status Transaksi<br>(PAID / FAILED)"| Sistem
    Sistem -->|"Trigger Pengiriman Barang<br>(Data Pengiriman)"| LogistikKita
```

---

## 3. Pengujian: Test Case Fitur Utama (Checkout Produk)

Berikut adalah skenario pengujian (*test case*) untuk fitur utama **Checkout dan Pembuatan Pesanan**.

| Parameter Pengujian | Detail Skenario |
| :--- | :--- |
| **ID & Nama Test Case** | TC-001: Pembuatan Pesanan (*Checkout*) dengan Stok Produk Cukup |
| **Fitur Utama** | Checkout dan Integrasi Pembayaran |
| **Deskripsi** | Memverifikasi alur checkout dari pemilihan produk oleh pembeli hingga sistem berhasil membuat order dengan status `PENDING_PAYMENT` dan mengirimkan request pembayaran ke SmartBank. |
| **Pre-kondisi** | 1. Pembeli memiliki akun aktif (`user_id`: "USR001") dengan saldo cukup di SmartBank.<br>2. Produk "Kopi Arabika" (`product_id`: "PRD001") dalam status aktif dengan stok tersedia 10 pcs dan harga Rp25.000 per unit. |
| **Data Input** | - `user_id`: "USR001"<br>- `product_id`: "PRD001"<br>- `qty`: 2<br>- `alamat_pengiriman`: "Jl. Merdeka No. 45, Salatiga" |

### Langkah-Langkah Pengujian

1. Login ke aplikasi sebagai pembeli (`user_id`: "USR001").
2. Cari dan masuk ke halaman detail produk "Kopi Arabika" (`product_id`: "PRD001").
3. Masukkan jumlah pembelian (`qty`) sebanyak **2** pada kolom kuantitas.
4. Klik tombol **"Beli Sekarang"** untuk masuk ke halaman Checkout.
5. Masukkan alamat pengiriman: **"Jl. Merdeka No. 45, Salatiga"**.
6. Klik tombol **"Buat Pesanan"** (menjalankan proses POST `/marketplace/checkout`).

### Hasil yang Diharapkan (*Expected Result*)

1. **Pengurangan Stok Sementara**: Stok produk "Kopi Arabika" berkurang sebanyak 2 pcs (stok di database ter-update dari 10 menjadi 8 pcs).
2. **Pembuatan Order**: Sistem berhasil membuat entri order baru dengan status awal `PENDING_PAYMENT` dan menghasilkan rincian biaya yang tepat:
   - Subtotal: **Rp50.000** (2 x Rp25.000)
   - Biaya Layanan Marketplace (2%): **Rp1.000** (2% dari Rp50.000)
   - Total Pembayaran: **Rp51.000** (Rp50.000 + Rp1.000)
3. **Pengiriman Payment Request**: Sistem berhasil mengirimkan data pembayaran ke SmartBank via API Gateway dan menerima respon sukses berisi `payment_request_id` (misalnya: "PAYREQ001").
4. **Respon JSON & Redireksi**: Sistem mengembalikan status sukses JSON berisi detail order lengkap dengan total pembayaran dan pengguna dialihkan ke halaman instruksi pembayaran.
