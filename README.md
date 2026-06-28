# Marketplace PasarKita

PasarKita adalah aplikasi **marketplace B2C** yang dirancang untuk memfasilitasi transaksi jual-beli produk **UMKM** dalam ekosistem ekonomi terintegrasi. Modul ini bertindak sebagai *demand generator* — mengelola katalog, keranjang, checkout, dan order — sedangkan seluruh transaksi keuangan didelegasikan ke **SmartBank** melalui **API Gateway**, dan pengiriman barang ke **LogistikKita**.

Repositori ini berisi dua service utama:

| Direktori   | Peran                            | Lihat README                              |
| ----------- | -------------------------------- | ----------------------------------------- |
| `backend/`  | Backend Go (Fiber + GORM + MySQL)| [`backend/README.md`](backend/README.md) |
| `frontend-new/` | Frontend Vite + Vanilla JS + Tailwind | [`frontend-new/README.md`](frontend-new/README.md) |

Dokumen produk lengkap tersedia di [`PRD_Marketplace_PasarKita.md`](PRD_Marketplace_PasarKita.md) dan ringkasan desain serta skenario uji di [`Spesifikasi_Ringkas_PasarKita.md`](Spesifikasi_Ringkas_PasarKita.md).

---

## ✨ Fitur Utama

### Pembeli
- Browse produk dengan filter (kategori, lokasi, harga, rating, promo, sort, paging).
- Pencarian produk, halaman detail, keranjang, dan **guest checkout** (tanpa login).
- Checkout login dengan ringkasan biaya otomatis (subtotal, ongkir, fee, voucher).
- Riwayat order, tracking, review produk, diskusi, dan notifikasi.
- Profil, alamat tersimpan, dan integrasi **chat** dengan seller.

### Seller (UMKM)
- Dashboard berisi grafik penjualan, tabel produk, tabel pesanan (Chart.js + Tabulator).
- Kelola produk (tambah, edit, aktif/non-aktif, upload gambar).
- Upload gambar produk ke storage abstrak (mock, local, S3, MinIO, R2, Cloudinary).
- Update status pesanan seller (siap kirim, dikirim, selesai).
- Lihat dan kelola toko sendiri.

### Admin & Platform
- Moderasi katalog dan status produk.
- Audit log request marketplace (dapat dilihat oleh `PlatformAdmin` & `TechMaintainer`).
- Konfigurasi fee marketplace melalui API fee calculator.
- Swagger docs (`/docs`) ketika `ENABLE_DOCS=true`.

---

## 🏛️ Arsitektur Ekosistem

PasarKita adalah salah satu node dari ekosistem yang lebih besar. Marketplace **tidak pernah mengubah saldo user**; saldo menjadi tanggung jawab SmartBank. Marketplace hanya membuat *payment request* melalui API Gateway.

```
┌──────────┐     ┌──────────────┐     ┌────────────┐     ┌──────────┐
│ Pembeli  │ <─> │ PasarKita    │ ──> │ API Gateway│ ──> │ SmartBank│
│ Seller   │     │ (repo ini)   │     └────────────┘     └──────────┘
│ Admin    │     │  - catalogue │            │
└──────────┘     │  - cart       │            └──> trigger shipping
                 │  - checkout   │
                 │  - order      │ ───────────────────> ┌──────────────┐
                 └──────────────┘                      │ LogistikKita │
                                                       └──────────────┘
```

Prinsip integrasi:
1. Semua transaksi finansial hanya melalui API Gateway → SmartBank.
2. Pembayaran sukses memicu trigger pengiriman ke LogistikKita.
3. Validasi input, audit log, dan idempotency wajib untuk request penting.

---

## 🧱 Tech Stack

### Backend (`backend/`)
- **Bahasa**: Go 1.26+
- **HTTP Framework**: [Fiber v2](https://gofiber.io)
- **ORM**: [GORM](https://gorm.io) dengan driver **MySQL**
- **Auth**: JWT (access + refresh) dengan role-based middleware
- **Dokumentasi**: OpenAPI (`docs/openapi.yaml`) + Swagger UI
- **Storage**: Abstraction `mock` | `local` | `s3` | `minio` | `r2` | `cloudinary`
- **Security**: Helmet, CORS origin eksplisit (wildcard ditolak), rate-limiter
- **Integrasi**: client untuk SmartBank & LogistikKita (mode mock deterministik default)

### Frontend (`frontend-new/`)
- **Build Tool**: [Vite 8](https://vitejs.dev)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com) + DaisyUI
- **JavaScript**: Vanilla (ES Modules, hash router)
- **Library UI**:
  - `lucide` — ikon
  - `gsap` — transisi halaman & animasi card
  - `tabulator-tables` — tabel seller dashboard
  - `chart.js` — grafik seller dashboard
  - `toastify-js` — feedback toast
  - `zod` — validasi form
- **Fallback**: data mock lokal digunakan saat backend tidak aktif

---

## 🚀 Memulai (Quick Start)

### Prasyarat
- Go 1.26+
- Node.js + npm
- MySQL 8 (atau MariaDB kompatibel)

### 1. Siapkan database
```sql
CREATE DATABASE pasarkita_marketplace;
```

### 2. Jalankan Backend
```bash
cd backend
cp .env.example .env       # di Windows: copy .env.example .env
# Edit .env: atur DB_PASSWORD dan JWT_SECRET (min 32 karakter)
go mod tidy
go run .
```
Server default: `http://localhost:3002`.

Aktifkan seeder (opsional, dev only) dengan `SEED_DATABASE=true` dan `SEED_USER_PASSWORD` minimal 12 karakter.

### 3. Jalankan Frontend
```bash
cd frontend-new
cp .env.example .env       # di Windows: copy .env.example .env
npm install
npm run dev
```
Frontend default: `http://127.0.0.1:5173`. Atur `VITE_API_BASE_URL` jika backend di host/port lain.

### 4. Login Development
Aktifkan seeder backend lalu gunakan kredensial dari output log. Password tidak pernah di-hardcode atau ditulis di README — selalu tentukan melalui env `SEED_USER_PASSWORD`.

---

## 🗂️ Struktur Proyek

```
.
├── backend/                 # Go Fiber API
│   ├── controllers/         # HTTP handler
│   ├── services/            # business logic & integration client
│   ├── repositories/        # GORM data access
│   ├── models/              # entity DB
│   ├── database/            # koneksi, auto-migrate, seeder
│   ├── routes/              # kontrak endpoint REST
│   ├── middleware/          # error handler, auth, audit log
│   ├── config/              # env loader + validator
│   └── docs/openapi.yaml    # kontrak OpenAPI 3
│
├── frontend-new/            # Vite SPA marketplace
│   ├── api/                 # HTTP client (auth, marketplace)
│   ├── services/            # service layer FE (cart, checkout, seller, dll)
│   ├── components/          # UI: navbar, footer, product card, dsb.
│   ├── pages/               # view per route hash (#/products, #/cart, ...)
│   ├── utils/               # router, formatCurrency, validator, storage
│   ├── styles/              # tailwind compiled & custom CSS
│   └── data/                # fallback data lokal saat BE down
│
├── docs/                    # aset bersama (diagram, dll.)
├── PRD_Marketplace_PasarKita.md
├── Spesifikasi_Ringkas_PasarKita.md
└── README.md                # file ini
```

---

## 🔌 API Kontrak (Ringkas)

Semua response dalam JSON. Untuk kontrak lengkap gunakan OpenAPI di `backend/docs/openapi.yaml` dan Swagger UI `/docs` (ketika `ENABLE_DOCS=true`).

### Publik
| Method | Path                                            | Deskripsi                                |
| ------ | ----------------------------------------------- | ---------------------------------------- |
| GET    | `/marketplace/browse_produk`                    | List + filter produk                     |
| GET    | `/marketplace/categories`                       | Daftar kategori                          |
| GET    | `/marketplace/stores`                           | Daftar toko                              |
| GET    | `/marketplace/products/:id`                     | Detail produk                            |
| GET    | `/marketplace/biaya_layanan_marketplace`        | Hitung fee                               |
| GET    | `/marketplace/vouchers`                         | Daftar voucher                           |
| GET    | `/marketplace/products/:id/reviews`             | List review                              |
| GET    | `/marketplace/products/:id/discussions`         | List diskusi                             |
| GET    | `/marketplace/shipping/options`                 | Opsi ongkir                              |

### Guest Checkout (tanpa login)
| Method | Path                                                  | Deskripsi            |
| ------ | ----------------------------------------------------- | -------------------- |
| POST   | `/marketplace/guest/shipping-rates`                  | Preview ongkir       |
| POST   | `/marketplace/guest/checkout`                        | Buat order guest     |
| GET    | `/marketplace/guest/orders/:id`                      | Detail order         |
| POST   | `/marketplace/guest/orders/:id/finalize-shipment`    | Finalisasi kirim     |
| GET    | `/marketplace/guest/payment-status/:id`               | Status payment       |

### Terautentikasi
| Method | Path                                       | Role                  |
| ------ | ------------------------------------------ | --------------------- |
| POST   | `/auth/login`                              | publik (rate-limited) |
| POST   | `/auth/refresh`                            | publik                |
| POST   | `/auth/logout`                             | user                  |
| GET    | `/auth/me`                                 | user                  |
| POST   | `/account/register`                        | publik                |
| GET/PATCH | `/account/me`                            | user                  |
| GET/POST | `/account/addresses`                     | buyer                 |
| GET/POST/PATCH/DELETE | `/marketplace/cart[/:product_id]` | buyer                 |
| POST   | `/marketplace/checkout`                    | buyer                 |
| POST   | `/marketplace/cart/checkout`               | buyer                 |
| POST   | `/marketplace/integrasi_pembayaran`        | buyer                 |
| GET    | `/marketplace/orders`                      | buyer                 |
| GET/PATCH | `/marketplace/orders/:id[/cancel][/tracking]` | buyer             |
| POST   | `/marketplace/products/:id/reviews`        | buyer                 |
| POST   | `/marketplace/products/:id/discussions`    | buyer                 |

### Seller
| Method | Path                                  |
| ------ | ------------------------------------- |
| GET    | `/marketplace/seller/dashboard`       |
| GET    | `/marketplace/seller/orders`          |
| PATCH  | `/marketplace/seller/orders/:id/status` |
| GET/POST | `/marketplace/seller/products`      |
| POST   | `/marketplace/seller/upload`          |
| GET    | `/marketplace/seller/store`           |

### Admin Platform
| Method | Path                                  |
| ------ | ------------------------------------- |
| POST   | `/marketplace/manajemen_produk`       |
| PATCH  | `/marketplace/products/:id/status`    |
| GET    | `/marketplace/logging` (audit log)    |
| GET    | `/auth/accounts`                      |

> Middleware `Authenticate` + `RequireRoles` enforced untuk semua endpoint di bawah `protected` group. Lihat `backend/routes/routes.go` untuk definisi pasti.

---

## ⚙️ Konfigurasi (`backend/.env`)

Semua konfigurasi dimuat lewat `backend/config/config.go` dan divalidasi saat startup.

### Wajib (validasi ketat)
| Variable               | Default                | Catatan                                                           |
| ---------------------- | ---------------------- | ----------------------------------------------------------------- |
| `APP_PORT`             | `3002`                 | Port HTTP                                                         |
| `DB_HOST/PORT/USER/PASSWORD/NAME` | -           | MySQL DSN dibangun otomatis                                       |
| `JWT_SECRET`           | -                      | **Wajib ≥ 32 karakter** (random), divalidasi                      |
| `CORS_ALLOWED_ORIGINS` | -                      | **Origin eksplisit (koma)**, wildcard `*` **ditolak**             |
| `ACCESS_TOKEN_TTL`     | `15m`                  | Harus positif dan lebih pendek dari `REFRESH_TOKEN_TTL`           |
| `REFRESH_TOKEN_TTL`    | `168h`                 | -                                                                 |
| `RATE_LIMIT_MAX`       | `120`                  | Global rate limit per window                                      |
| `AUTH_RATE_LIMIT_MAX`  | `10`                   | Rate limit khusus endpoint auth                                   |

### Integrasi (mode default = mock deterministik)
| Variable                       | Default                       |
| ------------------------------ | ----------------------------- |
| `API_GATEWAY_BASE_URL`         | `http://localhost:3000`       |
| `ENABLE_GATEWAY_FORWARD`       | `false`                       |
| `LOGISTIKKITA_BASE_URL`        | `http://localhost:3010`       |
| `ENABLE_LOGISTIKKITA_FORWARD`  | `false`                       |
| `SMARTBANK_BASE_URL`           | `http://localhost:3020`       |
| `ENABLE_SMARTBANK_FORWARD`     | `false`                       |
| `GUEST_RATE_TTL`               | `15m`                         |

Saat flag forward di-`true`, marketplace akan meneruskan request ke service terkait. Mode mock membuat service bisa dijalankan tanpa dependency SmartBank/LogistikKita aktif.

### Storage (Upload Gambar Produk)
`STORAGE_PROVIDER` memilih backend. Default `mock` menulis ke `./uploads` dan disajikan via `/uploads/*`.

| Provider     | Variable tambahan                                                            |
| ------------ | ----------------------------------------------------------------------------- |
| `mock`/`local` | `STORAGE_LOCAL_ROOT`, `STORAGE_PUBLIC_URL`                                    |
| `s3`         | `STORAGE_BASE_URL`, `STORAGE_BUCKET`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY` |
| `minio`/`r2` | Sama seperti S3                                                              |
| `cloudinary` | `STORAGE_CLOUD_NAME` + base url                                               |

Body limit Fiber dinaikkan ke 8 MB agar upload gambar (maks 4 MB) sampai ke handler dengan error ramah, bukan HTTP 413 opaque.

### Opsional
| Variable              | Default      |
| --------------------- | ------------ |
| `ENABLE_DOCS`         | `false`      |
| `SEED_DATABASE`       | `false`      |
| `SEED_USER_PASSWORD`  | -            |

---

## 📏 Aturan Bisnis

- **Fee Marketplace**: 2% dari subtotal, dihitung otomatis pada checkout. Formula: `total_bayar = subtotal + 0.02 × subtotal - voucher + ongkir`.
- **Saldo User**: PasarKita tidak pernah mengubah saldo. Semua mutasi hanya lewat SmartBank.
- **Stok**: tidak dikurangi saat *checkout awal* untuk mencegah oversell ketika payment belum sukses.
- **Idempotency**: gunakan key untuk checkout & payment untuk mencegah duplikat.
- **Role-Based Access**: `buyer`, `seller`, `catalog_admin`, `platform_admin`, `tech_maintainer`. Lihat `backend/models/models.go`.
- **Audit Log**: request penting (checkout, payment, perubahan profil, alamat) dicatat otomatis oleh middleware `RequestLogger`.

---

## 🧪 Testing

Backend memiliki test untuk security (`models/security_test.go`), authorization middleware, dan kontrak frontend (`models/frontend_contract_test.go`, `services/frontend_contract_test.go`).

```bash
cd backend
go test ./...
```

Frontend mengandalkan mock data lokal + verifikasi service layer. Untuk E2E, jalankan backend + frontend bersamaan dan uji alur:

1. Browse → detail produk → tambah ke cart
2. Checkout (login & guest) → pilih alamat → place order
3. Cek status order di halaman `/orders`
4. Login sebagai seller → lihat dashboard, tambah produk, upload gambar
5. Login sebagai admin → akses `/auth/accounts`, audit log

---

## 🔒 Catatan Keamanan

- **JWT_SECRET** wajib ≥ 32 karakter random; production harus rotates secara berkala.
- **CORS_ALLOWED_ORIGINS** harus berisi origin eksplisit; wildcard `*` ditolak oleh validator.
- Rate-limit di-enforced global dan lebih ketat untuk endpoint autentikasi.
- Body limit dinaikkan hanya untuk mengakomodasi upload gambar produk.
- `helmet`, `recover`, dan CORS dikonfigurasi di `backend/main.go`.
- `SEED_DATABASE=true` hanya untuk development. Production harus `false`.
- File `.env` masuk `.gitignore`. Jangan pernah commit secret.

---

## 🤝 Kontribusi

1. Baca PRD dan Spesifikasi Ringkas untuk konteks produk.
2. Ikuti struktur MVC backend: `controllers` → `services` → `repositories` → `models`.
3. Untuk perubahan endpoint publik, update `backend/docs/openapi.yaml` agar FE dan tests sinkron.
4. Validasi dengan `go test ./...` sebelum membuka PR.
5. Untuk perubahan FE, pastikan fallback mock data di `frontend-new/src/data/` tetap akurat.

---

## 📚 Dokumentasi Terkait

- [`PRD_Marketplace_PasarKita.md`](PRD_Marketplace_PasarKita.md) — PRD lengkap (latar belakang, scope, aturan bisnis, kontrak API, dsb).
- [`Spesifikasi_Ringkas_PasarKita.md`](Spesifikasi_Ringkas_PasarKita.md) — diagram konteks DFD + test case utama.
- [`backend/README.md`](backend/README.md) — setup detail backend, endpoints, arsitektur folder.
- [`frontend-new/README.md`](frontend-new/README.md) — setup detail frontend, library, dan route hash.
- [`backend/docs/openapi.yaml`](backend/docs/openapi.yaml) — kontrak API (Swagger UI di `/docs` saat `ENABLE_DOCS=true`).

---
