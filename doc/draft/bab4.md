# Bab IV — Kebutuhan Fungsional dan Non-Fungsional

4.1 Kebutuhan Fungsional (F)

- F1: Manajemen Mata Kuliah — CRUD mata kuliah, termasuk asosiasi ke kurikulum. (Actor: Admin/Kaprodi). Modul utama: `controllers/akademik/mata-kuliah.controller.js`.
- F2: Manajemen Kurikulum Prodi — CRUD kurikulum, versi tahun. (Actor: Admin/Kaprodi). Modul: `controllers/akademik/kurikulum-prodi.controller.js`.
- F3: Manajemen Template Evaluasi — membuat dan mengelola template penilaian (metode + bobot). (Actor: Kaprodi/Dosen). Modul: `controllers/akademik/template-evaluasi.controller.js`.
- F4: Manajemen Capaian (CPMK/CPL) — CRUD CPMK dan pemetaan ke CPL. (Actor: Kaprodi). Modul: `controllers/akademik/cpmk.controller.js`.
- F5: Upload / Upsert RPS — unggah dokumen RPS, simpan metadata, tautkan ke CPMK/Mata Kuliah. (Actor: Dosen/Kaprodi). Modul: `controllers/akademik/rps.controller.js`, `services/rps.service.js`.
- F6: Komposisi Evaluasi & Pemetaan ke CPMK — menetapkan bagaimana setiap metode evaluasi berkontribusi ke CPMK. (Actor: Dosen/Kaprodi). Modul: `controllers/akademik/penilaian.controller.js`, `services/penilaian.service.js`.
- F7: Input Nilai Mahasiswa (Manual & Bulk) — masukkan nilai per metode, unggah Excel untuk bulk insert dengan validasi. (Actor: Dosen). Modul: `controllers/akademik/penilaian.controller.js`.
- F8: Perhitungan Nilai Akhir dan Agregasi CPMK/CPL — perhitungan otomatis berdasarkan komposisi evaluasi dan pemetaan, hasil tersimpan di tabel hasil agregat. (Actor: Sistem). Modul: `services/penilaian.service.js`.
- F9: Generate Rapor / Export Laporan — ekspor PDF/Word/CSV untuk monitoring. (Actor: Kaprodi/Admin). Modul: `controllers/akademik/export.controller.js`.
- F10: Monitoring & Dashboard OBE — ringkasan capaian CPL/CPMK per prodi/per periode. (Actor: Kaprodi). Modul: `controllers/akademik/monitoring.controller.js`.

4.2 Kebutuhan Non-Fungsional (N)

- N1: Autentikasi & Otorisasi — sistem memerlukan role-based access control (Admin, Kaprodi, Dosen, Mahasiswa). Accept: hanya role dengan hak dapat mengeksekusi endpoint tertentu.
- N2: Keamanan Berkas — upload RPS/Tugas harus memeriksa ukuran, tipe file, dan menyimpan metadata secara aman.
- N3: Konsistensi Data — operasi multi-tabel harus dijalankan dalam transaksi untuk memastikan konsistensi (rollback on failure).
- N4: Performa — perhitungan nilai dan export harus selesai dalam batas waktu wajar untuk dataset kelas normal (mis. 30–200 mahasiswa per kelas).
- N5: Skalabilitas & Maintainability — pemisahan controller/service/model, dokumentasi API, dan tes integrasi untuk alur kritis.
- N6: Audit Trail — rekam aksi penting (ubah komposisi, input nilai, upsert RPS) untuk kebutuhan akuntabilitas akademik.

4.3 Prioritas Implementasi (roadmap singkat)

- Prioritas Tinggi: F5 (RPS upsert), F6-F8 (komposisi → input → hitung), F9 (export laporan).
- Prioritas Menengah: F1-F4 (melengkapi CRUD dan dokumentasi), F10 (dashboard monitoring).

4.4 Kriteria Verifikasi

- Setiap kebutuhan fungsional mempunyai test acceptance minimal: skenario happy path + skenario error handling (contoh: unggah RPS dengan metadata tidak lengkap harus ditolak dengan pesan yang jelas).
- Non-fungsional diuji melalui load test terukur (perhitungan batch), review keamanan upload, dan audit log sampling.

4.5 Catatan Mapping Keamanan Akses

Karena Anda bekerja pada peran Kaprodi (bukan Dosen), verifikasi hak akses harus dipastikan: beberapa fitur (mis. input nilai) memerlukan role Dosen; Kaprodi biasanya memiliki akses administrasi untuk override/monitoring tetapi praktik implementasinya bergantung pada kebijakan lokal.

Referensi singkat: lihat Bab II untuk daftar pustaka (Spady; Biggs & Tang; Sommerville; Larman; Stamatatos).
