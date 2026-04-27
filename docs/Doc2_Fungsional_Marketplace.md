# KEBUTUHAN FUNGSIONAL — MARKETPLACE (PasarKita)
**Skema Tugas Besar Mata Kuliah RPL 2**
Dosen: M. Yusril Helmi Setyawan, S.Kom., M.Kom.

---

| Fitur | Deskripsi | Input | Proses | Output | Endpoint API |
|---|---|---|---|---|---|
| Manajemen produk | Seller dapat menambah/edit produk | user_id, parameter terkait fitur | Validasi input → proses → simpan hasil | status + data hasil | /marketplace/manajemen_produk |
| Browse produk | User melihat produk | user_id, parameter terkait fitur | Validasi input → proses → simpan hasil | status + data hasil | /marketplace/browse_produk |
| Checkout | User melakukan pembelian | user_id, parameter terkait fitur | Validasi input → proses Checkout → integrasi SmartBank → simpan hasil | status + data hasil Checkout | /marketplace/checkout |
| Integrasi pembayaran | Kirim request ke SmartBank | user_id, parameter terkait fitur | Validasi input → kirim payment request → simpan hasil | status + data hasil | /marketplace/integrasi_pembayaran |
| Status order | Melihat status pesanan | user_id, parameter terkait fitur | Validasi input → query order → simpan hasil | status + data hasil | /marketplace/status_order |
| Biaya layanan marketplace | Potongan fee marketplace dari setiap transaksi | user_id, parameter terkait fitur | Validasi input → hitung fee (2%) → potong dari transaksi → simpan hasil | status + data hasil | /marketplace/biaya_layanan_marketplace |
