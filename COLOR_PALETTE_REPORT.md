# Laporan Color Palette Marketplace PasarKita

## 1. Tujuan

Dokumen ini menjadi acuan warna untuk seluruh UI Marketplace PasarKita agar:

- tampilan tetap konsisten di semua halaman,
- komponen tidak terlihat "aneh" karena warna saling bertabrakan,
- identitas visual marketplace terasa rapi, terpercaya, dan mudah dipahami,
- pengembangan fitur berikutnya tidak menambahkan warna baru secara sembarangan.

Fokus visual yang dipakai adalah:

- `bersih` untuk area transaksi,
- `terpercaya` untuk proses pembayaran,
- `tenang` untuk browsing produk,
- `jelas` untuk status dan aksi penting.

## 2. Arah Visual

Marketplace ini tidak memakai gaya warna yang terlalu ramai. Arah yang dipilih adalah:

- basis netral `slate + white`,
- warna utama aksi `blue`,
- warna status hanya dipakai untuk konteks tertentu,
- tidak menggunakan warna dekoratif tambahan seperti ungu, pink neon, hijau terang, atau gradient acak.

Secara karakter, UI harus terasa seperti:

- platform jual beli yang rapi,
- dashboard operasional yang ringan,
- bukan landing page promo,
- bukan aplikasi game,
- bukan dashboard fintech yang terlalu agresif.

## 3. Palette Inti

Palette saat ini diambil dari token yang sudah ada di [style.css](/D:/Kegabutan/Tubes%20RPL/Marketplace/frontend/src/style.css:3).

| Kategori | Token | Hex | Fungsi |
| --- | --- | --- | --- |
| Background utama | `--slate-50` | `#f8fafc` | Latar halaman utama |
| Surface lembut | `--slate-100` | `#f1f5f9` | Area sekunder, panel, input ringan |
| Surface alternatif | `--slate-150` | `#e9eef5` | Layer tambahan bila dibutuhkan |
| Border halus | `--slate-200` | `#e2e8f0` | Border card, input, section |
| Border kuat | `--slate-300` | `#cbd5e1` | Border yang butuh sedikit penekanan |
| Teks sekunder | `--slate-500` | `#64748b` | Caption, metadata, helper text |
| Teks pendukung | `--slate-600` | `#475569` | Informasi sekunder yang masih penting |
| Teks kuat | `--slate-700` | `#334155` | Label dan konten menengah |
| Heading | `--slate-800` | `#1e293b` | Judul section dan card |
| Teks utama | `--slate-900` | `#0f172a` | Angka penting, total, heading utama |
| Aksen ringan | `--blue-50` | `#eff6ff` | Badge informasi dan background info |
| Aksen lembut | `--blue-100` | `#dbeafe` | Border/status info lembut |
| Aksen pendukung | `--blue-200` | `#bfdbfe` | Layer info tambahan |
| Primary | `--blue-600` | `#2563eb` | CTA utama, link aktif, ikon brand |
| Primary hover | `--blue-700` | `#1d4ed8` | Hover/focus CTA utama |
| Success bg | `--green-100` | `#dcfce7` | Badge sukses |
| Success text | `--green-700` | `#15803d` | Teks sukses |
| Danger bg | `--red-50` | `#fef2f2` | Background error ringan |
| Danger soft | `--red-100` | `#fee2e2` | Border atau badge error |
| Danger strong | `--red-500` | `#ef4444` | Badge jumlah, destructive accent |
| Danger text | `--red-700` | `#b91c1c` | Teks error |
| Warning bg | `--amber-50` | `#fffbeb` | Background warning ringan |
| Warning soft | `--amber-100` | `#fef3c7` | Border atau tag warning |
| Warning text | `--amber-600` | `#d97706` | Aksi warning ringan |
| Warning text strong | `--amber-700` | `#b45309` | Teks warning utama |

## 4. Peran Tiap Warna

### 4.1 Warna netral

Warna netral adalah fondasi utama interface.

- `white` dipakai untuk card, modal, dan panel utama.
- `slate-50` dipakai untuk background halaman.
- `slate-100` sampai `slate-300` dipakai untuk pemisah visual, border, dan placeholder.
- `slate-500` sampai `slate-900` dipakai bertingkat untuk hirarki teks.

Aturan penting:

- jika ragu, gunakan netral dulu,
- jangan langsung menambahkan warna lain untuk membuat komponen "lebih hidup",
- struktur yang baik harus terbaca walau tanpa warna status.

### 4.2 Warna primer

`blue-600` adalah warna identitas utama marketplace.

Gunakan hanya untuk:

- tombol CTA utama,
- state aktif pada navigasi,
- badge kategori/info yang relevan,
- elemen brand seperti ikon PasarKita,
- highlight total atau aksi yang benar-benar penting.

`blue-700` hanya dipakai untuk hover, pressed state, atau penekanan satu tingkat di atas `blue-600`.

Aturan penting:

- jangan memakai biru di semua tempat,
- biru harus tetap terasa spesial,
- satu layar tidak boleh dipenuhi terlalu banyak panel biru solid.

### 4.3 Warna status

Warna status tidak boleh dipakai sebagai dekorasi.

- `green` hanya untuk sukses, aktif, transaksi berhasil.
- `amber` hanya untuk warning, biaya layanan, atau kondisi yang butuh perhatian.
- `red` hanya untuk error, hapus, gagal, atau badge jumlah kritis.

Jika sebuah elemen bukan status, jangan dipaksa memakai warna status.

## 5. Distribusi Visual yang Disarankan

Supaya komposisi layar tidak terasa berat atau aneh, gunakan rasio kasar berikut:

- `70%` netral: background, card, border, teks,
- `20%` primary blue: CTA, link aktif, badge info,
- `10%` status colors: success, warning, error.

Artinya:

- mayoritas layar harus tetap putih dan slate,
- aksen biru harus terlihat jelas tetapi tidak mendominasi semua blok,
- warna hijau, merah, amber hanya muncul saat ada konteksnya.

## 6. Mapping Warna per Komponen

### 6.1 App shell

- Background aplikasi: `slate-50`
- Topbar: `white` dengan border `slate-100`
- Logo box: `blue-600`
- Brand text: `slate-800`, aksen nama `blue-600`
- Navigation default: `slate-500`
- Navigation active: `blue-600`

### 6.2 Search dan form

- Input background: `white`
- Border default: `slate-200`
- Border focus: `blue-600`
- Placeholder/icon pasif: `slate-400`
- Label/isi utama: `slate-800`

### 6.3 Product card

- Card background: `white`
- Border: `slate-100`
- Placeholder image area: `slate-100`
- Placeholder icon: `slate-300`
- Kategori info: `blue-50` dengan teks `blue-600`
- Harga: `slate-900`
- Deskripsi: `slate-500`
- Tombol tambah cart: `blue-600`, hover `blue-700`

### 6.4 Cart dan summary

- Panel summary: `white`
- Border: `slate-100`
- Subtotal label: `slate-500`
- Total bayar: `slate-900`
- Fee marketplace: `blue-600`
- Info SmartBank: `amber-50` dengan teks `amber-700`
- CTA bayar: `blue-600`, hover `blue-700`

### 6.5 Seller center

- Table header: `slate-50`
- Table border: `slate-100`
- Data utama: `slate-800`
- Data sekunder: `slate-600` atau `slate-500`
- Status aktif: `green-100` + `green-700`
- Status nonaktif: `red-100` + `red-700`
- Aksi aktif/nonaktif: gunakan teks warna, bukan tombol ramai

### 6.6 Orders dan status transaksi

- Card order: `white`
- Header card: `slate-50`
- Order id dan metadata: `slate-500` atau `slate-400`
- Status paid/success: `green-100` + `green-700`
- SmartBank reference box: `blue-50` + `blue-600`

### 6.7 Modal

- Overlay: hitam transparan, bukan warna brand
- Modal body: `white`
- Border input: `slate-200`
- Tombol close: `slate-400`
- Tombol submit: `blue-600`

### 6.8 Notification / toast

- Success toast: `white` + border `green-100` + teks `green-700`
- Error toast: `red-50` + border `red-100` + teks `red-700`

## 7. Kombinasi yang Harus Dihindari

Hal-hal berikut membuat UI cepat terlihat tidak konsisten:

- tombol utama hijau di satu halaman, biru di halaman lain,
- card promo merah terang di tengah layout netral,
- terlalu banyak badge warna-warni dalam satu daftar produk,
- teks biru di atas background biru yang terlalu dekat tonalitasnya,
- penggunaan `red-500` untuk elemen non-destruktif,
- penggunaan `green` untuk harga atau angka normal,
- menambahkan gradient tanpa aturan,
- mencampur warna pastel baru yang tidak ada di token sistem.

## 8. Aturan Hirarki Teks dan Warna

Untuk menjaga keterbacaan:

- heading utama: `slate-900` atau `slate-800`,
- paragraph/deskripsi: `slate-500`,
- metadata kecil: `slate-400` atau `slate-500`,
- angka total atau harga penting: `slate-900`,
- teks pada background status harus pakai pasangan warna status yang sudah ditentukan.

Prinsipnya:

- hirarki dibangun dengan kontras dan ukuran,
- bukan dengan menambah warna baru.

## 9. Aturan Aksesibilitas

Supaya UX tidak membingungkan:

- warna tidak boleh menjadi satu-satunya penanda status,
- state penting tetap harus punya label teks atau ikon,
- tombol utama harus kontras jelas terhadap background,
- teks kecil jangan memakai warna terlalu pucat di atas putih,
- badge status harus tetap terbaca tanpa mengandalkan saturasi tinggi.

Contoh benar:

- status `PAID` memakai label teks plus badge hijau,
- error checkout memakai ikon plus teks merah,
- fee marketplace memakai label teks dan angka, bukan warna saja.

## 10. Rekomendasi Implementasi

Agar konsisten ke depan, setiap komponen baru sebaiknya mengikuti urutan ini:

1. Tentukan dulu apakah elemen itu `surface`, `content`, `action`, atau `status`.
2. Ambil warna dari token yang sudah ada, jangan membuat hex baru tanpa alasan kuat.
3. Gunakan warna primer hanya untuk aksi utama dan state aktif.
4. Gunakan warna status hanya jika ada makna status.
5. Jika tampilan terasa "kurang menarik", perbaiki spacing, tipografi, dan hierarchy dulu sebelum menambah warna.

## 11. Checklist Sebelum Menambah UI Baru

- Apakah background utamanya masih netral?
- Apakah card tetap putih dan bersih?
- Apakah CTA utama masih konsisten biru?
- Apakah status sukses/warning/error memakai warna yang tepat?
- Apakah ada warna baru yang sebenarnya tidak perlu?
- Apakah satu layar terlalu ramai oleh badge dan panel berwarna?
- Apakah informasi penting tetap terbaca meski warna dimatikan?

Jika salah satu jawabannya bermasalah, berarti color usage perlu diperbaiki.

## 12. Kesimpulan

Color palette PasarKita sebaiknya tetap berpijak pada sistem berikut:

- `slate` untuk struktur dan keterbacaan,
- `white` untuk surface utama,
- `blue` untuk identitas dan aksi utama,
- `green`, `amber`, `red` hanya untuk status.

Dengan aturan ini, UI marketplace akan terasa:

- konsisten,
- tidak norak,
- tidak ambigu,
- tidak "aneh" saat fitur bertambah,
- tetap cocok dengan karakter marketplace yang fokus pada browsing, checkout, dan status transaksi.
