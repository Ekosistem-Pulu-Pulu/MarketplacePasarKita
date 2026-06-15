# PasarKita Frontend MVP

Demo marketplace frontend standalone menggunakan Vite, Vanilla JavaScript, HTML, Tailwind CSS, dan localStorage. Project ini tidak terhubung ke backend.

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
npm run dev
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

Gunakan tombol **Masuk cepat sebagai buyer demo** untuk menguji checkout. Seluruh cart, user dummy, dan order disimpan pada localStorage browser.
