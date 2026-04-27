# ALUR KERJA DAN INTEGRASI EKOSISTEM
**Skema Tugas Besar Mata Kuliah RPL 2**
Dosen: M. Yusril Helmi Setyawan, S.Kom., M.Kom.

---

| No | Nama Alur | Langkah-Langkah | Trigger | Output |
|---|---|---|---|---|
| 1 | User Checkout di Marketplace | User memilih produk → tambah ke keranjang → klik checkout | User action di Marketplace UI | Order dibuat dengan status PENDING |
| 2 | Marketplace kirim Payment Request | Marketplace hitung total + fee 2% → POST ke /payment via API Gateway | Order PENDING terbentuk | Payment request diteruskan ke SmartBank |
| 3 | API Gateway validasi request | Gateway validasi JWT token → log request → forward ke SmartBank | Payment request masuk Gateway | Request tervalidasi & diteruskan |
| 4 | SmartBank proses pembayaran | SmartBank cek saldo user → debit saldo → kredit ke seller → potong fee → catat ledger | Request valid dari Gateway | Status transaksi SUCCESS/FAILED + ledger entry |
| 5 | Marketplace update status order | Marketplace terima response SmartBank → update order status menjadi PAID | Response SUCCESS dari SmartBank | Order status = PAID |
| 6 | Trigger LogistiKita | Marketplace POST ke /logistics/request → LogistiKita terima → hitung ongkir → kirim payment ongkir ke SmartBank | Order status = PAID | Status pengiriman dibuat, ongkir dibayar |
| 7 | Update status pengiriman | LogistiKita update status (PICKED UP → ON DELIVERY → DELIVERED) → notify Marketplace | Proses pengiriman berjalan | Order status = DELIVERED |
| 8 | UMKM Insight baca data | UMKM Insight GET /analytics/ledger dari SmartBank (read-only) → agregasi data → tampil di dashboard | Periodic / on-demand | Dashboard analytics terupdate |
