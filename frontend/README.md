# PasarKita Frontend Demo

Frontend marketplace mandiri berbasis Vite + Vanilla JavaScript. Aplikasi ini tidak membutuhkan backend dan menyimpan session demo, cart, checkout, serta order di `localStorage`.

## Menjalankan Project

```bash
cd frontend
npm install
npm run dev
```

Buka URL yang ditampilkan Vite, umumnya `http://localhost:5173`.

Untuk mengecek build produksi:

```bash
npm run build
npm run preview
```

## Library

- `vite`: development server dan production build.
- `lucide`: ikon UI ringan.

Instalasi library sudah didefinisikan di `package.json`; cukup jalankan `npm install`.

## Flow Demo

- Produk dapat dilihat, dicari, difilter, dan diurutkan tanpa login.
- Cart, login/register dummy, checkout, pembayaran, dan status order menggunakan `localStorage`.
- Checkout otomatis mengarahkan user yang belum login ke halaman login lalu kembali ke checkout.
- Email yang mengandung kata `seller` mensimulasikan akun seller. Tombol login cepat mensimulasikan buyer.
- Status pesanan bisa dimajukan dari halaman detail order untuk kebutuhan presentasi.
