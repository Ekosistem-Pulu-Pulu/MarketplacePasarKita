# PasarKita Frontend MVP

Frontend marketplace menggunakan Vite, Vanilla JavaScript, HTML, Tailwind CSS, dan service layer API. Produk, akun, cart user login, checkout, pembayaran, order, dan seller dashboard terhubung ke backend Go Fiber di port `3002`. Data lokal tetap tersedia sebagai fallback ketika backend tidak aktif.

## Library

- Tailwind CSS + DaisyUI: styling, responsive layout, form, badge, modal.
- Lucide Vanilla: icon UI.
- GSAP: transisi halaman dan animasi card.
- Zod: validasi login, register, checkout/alamat, dan tambah produk seller.
- Toastify.js: feedback aksi utama.
- Tabulator: tabel produk dan pesanan seller.
- Chart.js: grafik seller dashboard.

## Menjalankan Project

```bash
cd frontend-new
npm install
copy .env.example .env
npm run dev
```

Jalankan backend terlebih dahulu:

```bash
cd backend
go run .
```

Production build:

```bash
npm run build
npm run preview
```

## Route Demo

- `#/` home
- `#/products` katalog dan filter
- `#/search?q=keyboard` hasil pencarian
- `#/category/elektronik` kategori
- `#/product/keyboard-mecha-mini` detail produk
- `#/cart` keranjang
- `#/checkout` checkout dengan login guard
- `#/orders` riwayat pesanan
- `#/login` dan `#/register`
- `#/profile` profil pembeli
- `#/seller` seller dashboard

Gunakan tombol **Masuk cepat sebagai buyer demo** untuk login dengan `buyer@pasarkita.local` / `password123`. Akun seller backend adalah `seller@pasarkita.local` / `password123`.

`VITE_API_BASE_URL` dapat diubah pada `.env` jika backend berjalan pada host atau port lain. Guest cart tetap berada di localStorage dan disinkronkan ke backend setelah login.
