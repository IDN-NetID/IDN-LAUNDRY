IDN-GO — Aplikasi Manajemen Laundry
===================================

ISI FOLDER
- index.html : kerangka halaman aplikasi
- style.css  : desain / tampilan responsif hitam-putih
- app.js     : logika aplikasi, transaksi, data, dan interaksi

CARA MENJALANKAN DI VS CODE
1. Ekstrak folder IDN-GO ke komputer Anda.
2. Buka folder tersebut di Visual Studio Code.
3. Jalankan index.html menggunakan ekstensi Live Server (klik kanan > Open with Live Server).
   Anda juga dapat membuka index.html langsung di browser, tetapi Live Server lebih disarankan.
4. Aplikasi akan menampilkan data demo sehingga menu dan fitur dapat langsung dicoba.

FITUR YANG SUDAH AKTIF
- Dashboard ringkasan usaha dan grafik pemasukan 7 hari.
- Kasir: transaksi kiloan, satuan, paket, diskon, pembayaran sebagian, estimasi, rak, dan catatan.
- Daftar pesanan: pencarian, filter status, peringatan keterlambatan, pembayaran, update status, dan hapus pesanan dengan konfirmasi (poin loyalitas dikoreksi bila perlu).
- Pemindai QR/barcode (bergantung dukungan browser dan izin kamera); pencarian manual tetap tersedia.
- Produk & kategori, pelanggan, poin loyalitas, stok dan penyesuaian stok.
- Pengeluaran, laporan, riwayat aktivitas.
- Tracking transaksi berdasarkan kode atau nomor HP.
- Booking jemput dengan alamat dan opsi mengambil koordinat GPS.
- Tombol pesan WhatsApp, cetak struk, ekspor CSV, backup dan pemulihan JSON.
- Pilihan mode Owner / Kasir dan indikator online/offline.

AKUN / AKSES DEMO
- Mode awal: Owner
- PIN Owner default: 1234
- Dari label Owner/Kasir di kanan atas, Anda dapat berpindah mode.
- Ganti PIN di menu Pengaturan > Hak Akses.

CATATAN PENTING
- Aplikasi ini adalah frontend/prototipe yang menyimpan data di localStorage browser.
- Data hanya berada di browser/perangkat yang digunakan. Data tidak otomatis tersinkron ke perangkat lain.
- Untuk operasional multi-kasir, sinkronisasi real-time, database terpusat, login aman, notifikasi WhatsApp otomatis, pembayaran online, dan notifikasi push dibutuhkan backend/API dan konfigurasi layanan tambahan.
- Tombol WhatsApp membuka WhatsApp dengan pesan yang sudah disiapkan; pengguna masih menekan tombol Kirim.
- Pemindai kamera dan GPS membutuhkan dukungan browser serta izin perangkat. Akses kamera/GPS umumnya berjalan melalui localhost atau HTTPS.
- Foto kondisi dikompres sebelum disimpan, tetapi terlalu banyak foto tetap dapat memenuhi kuota penyimpanan browser. Gunakan Backup Data secara berkala.
- PIN pada prototipe ini hanya pembatas tampilan, bukan sistem keamanan untuk data sensitif.

Selamat mencoba IDN-GO!


FITUR HAPUS PESANAN (PENAMBAHAN)
- Tombol Hapus tersedia pada setiap kartu di menu Daftar Pesanan.
- Aplikasi meminta konfirmasi sebelum menghapus pesanan.
- Pesanan yang sudah memiliki pembayaran / berstatus Diambil meminta konfirmasi kedua karena angka pemasukan laporan juga akan berubah.
- Data pelanggan tetap tersimpan. Poin loyalitas dari pesanan yang dihapus akan dikoreksi.
- Titik kode ditandai dengan komentar "TAMBAHAN FITUR" di app.js dan style.css.
