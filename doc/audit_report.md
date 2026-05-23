# Laporan Audit Awal — Modul OBE

Tanggal: 2026-05-03

Pembuat: Tim audit (Tools: codebase scan, dokumentasi lokal)

Tujuan: Menyajikan temuan awal terkait konsistensi dokumentasi (Bab 1–4), UML, dan implementasi backend (models, services, routes, migrations). Laporan ini bersifat diagnostik — berisi temuan, risiko, dan rekomendasi prioritas; bagian implementasi dan draf Bab akan dibuat setelah konfirmasi Anda.

---

1. Ruang lingkup audit

- Dokumen: `doc/` (termasuk `use_case_diagrams.md`, `sequence_diagrams.md`, `analysis.md`, `obe_tables.md`, `db/schema.sql`, file UML `.puml` dan PNG di `doc/uml/`).
- Kode: controllers, services, models, routes, migrations di repo root (fokus: RPS, Penilaian, OBE).
- Tujuan: menentukan celah (gaps) antara dokumentasi akademik (Bab 1–4) dan artefak teknis, serta merumuskan tindakan perbaikan prioritas.

---

2. Metodologi singkat

- Inventarisasi file dokumentasi dan UML (`doc/`)
- Pemeriksaan cepat kode: `controllers/akademik/*`, `services/*.js`, `models/*.js`, `routes/*`, `migrations/*`
- Pencocokan awal: mapping use case → sequence → controller/service (manual/heuristik)

Catatan: audit ini bersifat awal (light-weight). Untuk pemeriksaan penuh akan dilakukan langkah-langkah terotomasi (script perbandingan model ↔ schema, cross-reference route ↔ sequence) pada tahap implementasi bila Anda menyetujui.

---

3. Temuan Utama (ringkas)

3.1 Dokumentasi Bab 1–4

- Bab 1 (Pendahuluan / Latar Belakang / Rumusan Masalah / Tujuan / Batasan): tidak ditemukan satu file Bab terstruktur lengkap di repo. `doc/analysis.md` memuat ringkasan analisis sistem (sekilas bagian 4.1.5–4.2) — tetapi belum menggantikan Bab 1 penuh. Kesimpulan: Bab 1 belum lengkap dan perlu distandarisasi ke format skripsi.
- Bab 2 (Tinjauan Pustaka): ada beberapa definisi tersebar (mis. `use_case_diagrams.md`) namun belum didukung kutipan referensi akademik dalam gaya Vancouver seperti diminta. Perlu menyusun definisi dari sumber/buku yang diakui secara eksplisit.
- Bab 3 (Metode / Arsitektur): `doc/analysis.md` memberi gambaran singkat komponen tetapi belum memisahkan antara "sistem yang berjalan (as-is)" dan "sistem yang akan dibuat (to-be)". User menyatakan belum tahu perbedaan ini — perlu analisis eksisting (scan kode + running services jika tersedia) untuk mendeskripsikan as-is.
- Bab 4 (Kebutuhan fungsional/non-fungsional): ada elemen fungsional pada `doc/sequence_diagrams.md` dan `doc/analysis.md`, namun belum tersusun sebagai daftar kebutuhan fungsional lengkap (nomor, deskripsi singkat, prioritas, dependensi). Non-fungsional hanya disebut singkat.

3.2 UML & Diagram

- Banyak file `.puml` dan PNG sudah ada (`doc/uml/*`). Ini aset bagus. Namun belum ada bukti terotomasi bahwa diagram sinkron dengan implementasi kode (models, controller routes). Beberapa diagram sequence mengasumsikan flow tertentu (mis. upload RPS → upsert → storage → DB transaction) yang nampaknya sesuai, tapi perlu verifikasi terhadap controller/service aktual (`rps.controller.js`, `rps.service.js`, `penilaian.service.js`).

3.3 Database / Models / Migrations

- Terdapat `doc/db/schema.sql`, migrations di folder `migrations/`, dan models di `models/`. Namun terdapat indikasi ketidakkonsistenan nama kolom/konvensi (snake_case vs camelCase) yang disengaja ditangani dalam kode (mis. `hitungNilaiAkhir` mencoba untuk update dua format kolom). Perlu pemeriksaan kolom yang sebenarnya ada pada DB (atau pada `schema.sql`) vs definisi model dan migrasi.

3.4 Kode — controllers/services/routes

- Fokus utama fungsional: `controllers/akademik/rps.controller.js`, `controllers/akademik/penilaian.controller.js`, `services/rps.service.js`, `services/penilaian.service.js`. Routes yang relevan: `routes/penilaian.routes.js`, `routes/akademik/rps.router.js`.
- Terdapat test scripts (`test_*.js`) yang membantu untuk verifikasi fungsional namun cakupan test tidak jelas.

3.5 Integritas akademik (pemeriksaan kemiripan)

- Dokumen use case sekarang memakai istilah "turnitin kecil" / "unik anti plagiasi" sebagai fitur yang disarankan. Implementasi teknis untuk pemeriksaan kemiripan belum ada di repo. Catatan pengguna: fitur pemeriksaan kemiripan tidak diperlukan untuk alur kerja Anda saat ini — saya mencantumkan opsi POC (`services/plagiarism.service.js`) hanya sebagai rekomendasi tambahan apabila nanti ingin diimplementasikan.

3.6 Klarifikasi pengguna (ringkas)

- Anda bekerja dengan peran Kaprodi (role dinaikkan oleh admin) — bukan peran Dosen. Oleh karena itu Anda tidak memiliki akses ke tampilan/fitur `penilaian` atau pemetaan yang hanya terlihat oleh Dosen.
- Modul yang sudah Anda kerjakan / selesaikan di antarmuka: Mata Kuliah, Kurikulum Prodi, Template Evaluasi, Manajemen Capaian, Set Grup Mata Kuliah Wajib/Pilihan, dan Tahun Kurikulum. Ini dicatat sebagai pekerjaan yang sudah selesai dan akan dikecualikan dari rekomendasi perubahan yang terkait pengerjaan fitur dasar.
- Untuk alur penilaian dan pemetaan CPMK/CPL, Anda melakukan verifikasi langsung dengan pihak Prodi karena memang tidak memiliki role Dosen. Saya akan menyesuaikan rekomendasi audit ke konteks ini (fokus verifikasi pada akses Kaprodi/admin dan mapping endpoint yang relevan).

---

4. Risiko & Dampak

- Dokumen skripsi (Bab 1–4) tidak lengkap: risiko tertinggalnya konteks akademik yang diperlukan untuk laporan akhir.
- Ketidaksinkronan UML ↔ kode: risiko dokumentasi menyesatkan pembaca (penguji/kolega) dan kegagalan saat presentasi sistem.
- Perbedaan schema/model: potensi bug runtime dan ketidakcocokan migrasi pada deployment.
- Tidak adanya referensi akademik terverifikasi: risiko kurangnya dasar teoritis di Bab 2.

---

5. Rekomendasi Prioritas (ringkas)

Prioritas Tinggi (1-2 hari kerja):

1. Buat Laporan Audit Lengkap (this file = ringkasan). Lanjutkan dengan audit terotomasi untuk daftar perbedaan schema/model/migration.
2. Susun draft Bab 1 (Pendahuluan) berdasarkan temuan: latar belakang masalah, rumusan masalah, tujuan, batasan. Gunakan referensi akademik (Vancouver). Saya akan menyiapkan draf awal bila Anda menyetujui.
3. Susun Bab 4 — kebutuhan fungsional & non-fungsional sebagai daftar terstruktur (prihitaskan endpoint kritis: RPS, setup evaluasi, input nilai, kalkulasi, rapor, export).
4. Verifikasi dan sinkronisasi UML utama (use case + sequence penting) dengan kode: jalankan mapping manual untuk fungsi kritis dan perbarui `.puml` jika perlu.

Prioritas Menengah (2-4 hari kerja):

5. Periksa dan perbarui `doc/obe_tables.md` agar konsisten dengan `models/` dan `migrations/` atau `doc/db/schema.sql`.
6. Tambahkan modul pemeriksaan kemiripan ringan bila diperlukan (POC `services/plagiarism.service.js`) dan integrasikan ke pipeline upload RPS.

Prioritas Rendah (opsional):

7. Tambah coverage test untuk alur kritis (hitung nilai, input bulk, upsert RPS).
8. Ekspor semua diagram `.puml` ke PNG/SVG (folder `doc/uml/png/`) — banyak sudah ada, perbarui yang usang.

---

6. Deliverables yang saya usulkan (setelah Anda konfirmasi)

A. Laporan audit lengkap (lebih rinci, dengan tabel perbedaan dan bukti file) — akan saya buat sebagai `doc/audit_report_detailed.md`.
B. Draf Bab 1–4 (format skripsi S1, sitasi Vancouver) di `doc/draft/bab1.md`, `doc/draft/bab2.md`, `doc/draft/bab3.md`, `doc/draft/bab4.md`.
C. Script/daftar patch untuk menyinkronkan `doc/obe_tables.md` dengan `models/`/`migrations/` dan rekomendasi perubahan model jika perlu.
D. Perbaruan `.puml` (jika ditemukan ketidaksesuaian) dan ekspor PNG ke `doc/uml/png/`.
E. (Opsional) POC modul `services/plagiarism.service.js` dan integrasi hook pada `rps.service.js` untuk pengecekan saat upload.

---

7. Referensi awal (untuk definisi dan Bab 2 — akan dirapikan ke format Vancouver penuh saat pembuatan draf)

1. Spady WG. Outcome-Based Education: Critical Issues and Answers. American Association of School Administrators; 1994.
2. Biggs J, Tang C. Teaching for Quality Learning at University. 4th ed. Open University Press/McGraw-Hill; 2011.
3. Sommerville I. Software Engineering. Pearson; 2015.
4. Larman C. Applying UML and Patterns. 3rd ed. Prentice Hall; 2004.
5. Stamatatos E. A survey of modern plagiarism detection methods. (review article) — untuk literatur terkait deteksi plagiarisme.

Catatan: pada pembuatan draf Bab saya akan menyusun daftar pustaka lengkap sesuai Vancouver (nomor urut berdasarkan kemunculan dalam teks). Bila Anda menginginkan sumber tambahan (mis. pedoman akreditasi BAN-PT / AUN), beri tahu saya.

---

8. Permintaan konfirmasi / keputusan yang dibutuhkan dari Anda

1. Konfirmasi untuk melanjutkan ke tahap berikut: audit terotomasi + pembuatan draf Bab 1–4 + sinkronisasi UML & dokumentasi tabel. (jawab: "Lanjut" atau "Jangan lanjut sekarang")
2. Konfirmasi gaya sitasi: Vancouver (Anda sudah memilih) — apakah saya boleh gunakan format numerik (1,2,3) dan tautkan referensi akhir di setiap draf? (jawab: ya/tidak)
3. Konfirmasi apakah saya boleh langsung menulis file draf dan memperbarui `.puml` di repo, atau Anda ingin saya hanya menyiapkan patch yang harus Anda tinjau sebelum commit? (pilih salah satu: "tulis langsung" atau "siapkan patch")

---

9. Next steps (jika Anda pilih "Lanjut" dan "siapkan patch")

- Saya jalankan audit terotomasi (membandingkan models ↔ schema ↔ migrations ↔ `doc/obe_tables.md`) dan buatkan `doc/audit_report_detailed.md` berisi tabel perbedaan.
- Saya buat draf Bab 1–4 di `doc/draft/` dan sisipkan referensi sesuai Vancouver.
- Saya perbarui/versi baru `.puml` bila ditemukan ketidaksesuaian, dan hasilkan patch terpisah (`git diff` style) yang bisa Anda tinjau.

---

File ringkasan ini dibuat untuk memulai iterasi. Konfirmasi pilihan Anda agar saya dapat melanjutkan ke tahap implementasi dan penulisan draf.
