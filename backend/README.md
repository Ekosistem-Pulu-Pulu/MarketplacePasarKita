# Marketplace PasarKita Backend

Backend Marketplace PasarKita menggunakan Go Fiber, GORM, dan MySQL. Kontrak API backend mengikuti kebutuhan `frontend-new`: katalog modern, filter, cart, checkout, payment, order, profil toko, dan seller dashboard.

Saat aplikasi dijalankan, backend akan menjalankan auto migrate dan seeder secara otomatis. Seeder bersifat idempotent, jadi data seed tidak akan dobel saat server dijalankan berulang.

## Arsitektur

- `controllers`: HTTP handler dan parsing request.
- `services`: aturan bisnis marketplace.
- `repositories`: akses data via GORM.
- `models`: entity database.
- `database`: koneksi, migrasi, dan seed data.
- `routes`: kontrak endpoint REST.
- `middleware`: error handler, auth header check, dan audit logging.

## Endpoint Utama

- `GET /marketplace/browse_produk?keyword=&category=&location=&minPrice=&maxPrice=&rating=&promo=&sort=&page=&limit=`
- `GET /marketplace/categories`
- `GET /marketplace/stores`
- `GET /marketplace/products/:id`
- `GET|POST /marketplace/cart`
- `POST /marketplace/cart/checkout`
- `GET /marketplace/orders`
- `GET /marketplace/seller/dashboard`
- `GET|POST /marketplace/seller/products`
- `POST /marketplace/manajemen_produk`
- `POST /marketplace/checkout`
- `POST /marketplace/integrasi_pembayaran`
- `GET /marketplace/status_order?order_id={order_id}`
- `GET /marketplace/biaya_layanan_marketplace?subtotal={subtotal}`

## Menjalankan

1. Buat database MySQL:

```sql
CREATE DATABASE pasarkita_marketplace;
```

2. Salin konfigurasi:

```bash
cp .env.example .env
```

3. Sesuaikan kredensial MySQL di `.env`.

4. Install dependency dan jalankan:

```bash
go mod tidy
go run .
```

Server default berjalan di `http://localhost:3002`.

## Auto Migrate dan Seeder

Auto migrate membuat tabel berikut:

- `products`
- `orders`
- `order_items`
- `audit_logs`

Seeder otomatis mengisi:

- 32 produk demo sesuai katalog `frontend-new`.
- 8 kategori dan 8 toko demo.
- 4 order demo dengan status `PENDING_PAYMENT`, `PAID`, `PAYMENT_FAILED`, dan `SHIPPED`.
- Audit log awal untuk simulasi request marketplace.

## Catatan Integrasi

- `ENABLE_GATEWAY_FORWARD=false` akan membuat payment request mock agar backend bisa diuji tanpa API Gateway.
- `ENABLE_GATEWAY_FORWARD=true` akan forward request ke `API_GATEWAY_BASE_URL/integrator/smartbank/pembayaran_transaksi`.
- Marketplace tidak pernah mengubah saldo user; saldo tetap menjadi tanggung jawab SmartBank.
- Stok tidak dikurangi saat checkout awal untuk mencegah pengurangan stok palsu ketika pembayaran belum sukses.
