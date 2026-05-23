# Bab III — Metode dan Gambaran Sistem

3.1 Metode Pengumpulan Data

- Studi kode sumber (controllers, services, models, migrations)
- Verifikasi antarmuka (tampilan Web yang Anda sampaikan dan API collection yang tersedia)
- Wawancara/verifikasi fungsional dengan perwakilan Prodi untuk alur penilaian dan pemetaan

3.2 Arsitektur Sistem (Gambaran Umum)

Backend: REST API menggunakan `app.js` / `server.js` (Node.js + Express). ORM: Sequelize; basis data relasional (Postgres/MySQL). Struktur logika dibagi antara:

- Controller: menerima request, melakukan validasi, memanggil service. Contoh: `controllers/akademik/rps.controller.js`, `controllers/akademik/penilaian.controller.js`, `controllers/akademik/template-evaluasi.controller.js`.
- Service: logika bisnis, transaksi DB, perhitungan. Contoh: `services/rps.service.js`, `services/penilaian.service.js`, `services/template-evaluasi.service.js`.
- Models & Migrations: definisi entitas dan migrasi di `models/` dan `migrations/`.

3.3 Modul Utama dan Mapping Kode

Berikut adalah pemetaan fungsional utama ke file kode yang relevan (daftar bukan final, akan diperluas pada audit terotomasi):

- Manajemen Mata Kuliah: `controllers/akademik/mata-kuliah.controller.js`, `services/mata-kuliah.service.js`
- Kurikulum Prodi: `controllers/akademik/kurikulum-prodi.controller.js`, `services/kurikulum-prodi.service.js`
- Template Evaluasi: `controllers/akademik/template-evaluasi.controller.js`, `services/template-evaluasi.service.js`
- Manajemen Capaian (CPMK/CPL): `controllers/akademik/cpmk.controller.js`, `services/cpmk.service.js`
- RPS (upload / upsert / detail): `controllers/akademik/rps.controller.js`, `services/rps.service.js`
- Penilaian (komposisi, input nilai, kalkulasi): `controllers/akademik/penilaian.controller.js`, `services/penilaian.service.js`
- Export / Generate Rapor: `controllers/akademik/export.controller.js`
- Monitoring OBE / Dashboard: `controllers/akademik/monitoring.controller.js`, `services/monitoring.service.js`

3.4 Alur Fungsional Utama (ringkas)

1. Upload/Upsert RPS: user (Kaprodi/Admin/Dosen) mengunggah atau menyimpan RPS → `rps.controller` memvalidasi → `rps.service` menyimpan metadata file dan mencatat relasi RPS→CPMK.
2. Setup Komposisi Evaluasi: Dosen/Kaprodi menentukan metode dan bobot di template evaluasi → disimpan melalui `template-evaluasi.controller`/`service`.
3. Input Nilai / Bulk Import: Input nilai manual atau unggah Excel → `penilaian.controller` → `penilaian.service` melakukan validasi dan menyimpan `nilai_evaluasi_mahasiswa`.
4. Perhitungan Nilai Akhir & Agregasi CPMK: `penilaian.service` menjalankan perhitungan berdasarkan komposisi evaluasi, menghasilkan nilai per mahasiswa serta agregasi ke level CPMK/CPL dan menyimpan ke `nilai-cpmk-mahasiswa`.
5. Generate Rapor / Export: `export.controller` menyiapkan format laporan (PDF/Word/CSV) berdasarkan data agregat.

3.5 As-Is vs To-Be (ringkas)

- As-Is: implementasi back-end telah menyiapkan banyak controller/service inti (lihat mapping di atas). Beberapa flow kritis (perhitungan nilai, upload RPS, export) tercatat di `services/`.
- To-Be (rekomendasi): lengkapi dokumentasi teknik (line references pada controller/service), tambahkan tes integrasi untuk alur perhitungan nilai, dan sinkronkan `doc/obe_tables.md` dengan definisi `models/`/`migrations/`.

3.6 Catatan Teknis untuk Implementasi

- Transaksi: operasi yang menulis beberapa tabel (mis. hitung nilai → tulis `nilai_evaluasi_mahasiswa` dan `nilai-cpmk-mahasiswa`) harus dieksekusi dalam `sequelize.transaction` untuk konsistensi.
- Bulk operations: unggah Excel dan import harus memberi laporan baris error (row-level validation) dan backout pada kegagalan kritis.
