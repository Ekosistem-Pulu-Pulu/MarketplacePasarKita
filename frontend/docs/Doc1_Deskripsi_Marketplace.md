# DESKRIPSI APLIKASI — MARKETPLACE (PasarKita)
**Skema Tugas Besar Mata Kuliah RPL 2**
Dosen: M. Yusril Helmi Setyawan, S.Kom., M.Kom.

---

| Field | Detail |
|---|---|
| **Kelompok** | 2.0 |
| **Nama Aplikasi** | Marketplace (PasarKita) |
| **Deskripsi Naratif** | Marketplace menyediakan kanal jual beli produk UMKM. Aplikasi ini mengelola katalog, browsing, dan checkout. Saat checkout, sistem menghitung total + fee marketplace dan mengirim payment request ke SmartBank. |
| **Peran dalam Ekosistem** | Demand generator (B2C); memicu arus uang dari konsumen ke UMKM. |
| **Tanggung Jawab Utama** | CRUD produk; browsing; keranjang; checkout; membuat order; kirim payment request; menyimpan status order dan memicu pengiriman. |
| **Input Utama** | product_id, qty, user_id, alamat |
| **Output Utama** | order_id, total biaya, payment request, status order |
| **Interaksi Antar Aplikasi** | Kirim pembayaran ke SmartBank via Gateway; setelah sukses, memicu LogistiKita untuk pengiriman. |
| **Batasan Scope** | Tidak mengubah saldo langsung; tidak mengelola pembayaran; hanya memicu ke SmartBank. |
| **Contoh Use Case** | POST /checkout → kirim ke SmartBank → sukses → trigger logistics. |
