# Bab I — Pendahuluan

1.1 Latar Belakang

Outcome-Based Education (OBE) adalah pendekatan pembelajaran yang menempatkan capaian belajar (outcomes) sebagai acuan perancangan kurikulum, proses pembelajaran, dan penilaian. Implementasi OBE pada level program studi mengharuskan adanya pemetaan CPL (Capaian Pembelajaran Lulusan) ke CPMK (Capaian Pembelajaran Mata Kuliah) dan ke kegiatan pembelajaran yang terdokumentasi dalam RPS (Rencana Pembelajaran Semester). Transformasi proses ini pada lingkungan perguruan tinggi modern memerlukan sistem informasi akademik yang mendukung manajemen kurikulum, template evaluasi, pemetaan CPL–CPMK–Mata Kuliah, serta proses penilaian dan pelaporan hasil pembelajaran secara teratur [1,2].

Di lingkungan pengembangan ini, backend implementasi menggunakan arsitektur REST API (Node.js + Express + Sequelize) untuk mengelola entitas akademik inti (mata kuliah, kurikulum, RPS, komposisi penilaian, nilai mahasiswa). Beberapa modul front-end/back-end telah diselesaikan untuk fungsi: Mata Kuliah, Kurikulum Prodi, Template Evaluasi, Manajemen Capaian, Set Grup Mata Kuliah Wajib/Pilihan, dan Tahun Kurikulum. Peran pengguna yang sedang dikerjakan adalah Kaprodi (role dinaikkan oleh Admin); akses Dosen untuk pengisian nilai/pemetaan tidak tersedia pada akun ini sehingga verifikasi penilaian dilakukan langsung melalui pihak Prodi.

1.2 Rumusan Masalah

- Bagaimana merumuskan kebutuhan fungsional dan non-fungsional sistem OBE yang konsisten dengan implementasi backend saat ini?
- Bagaimana memetakan diagram UML (use case, sequence, class/ER) terhadap controller, service, dan model yang ada di repositori?
- Bagaimana menyusun Bab 1–4 skripsi sehingga memenuhi standar akademik (sitasi Vancouver) dan selaras dengan artefak teknis?

1.3 Tujuan

- Menyusun draf Bab 1–4 (Pendahuluan, Tinjauan Pustaka, Metode/Gambaran Sistem, Kebutuhan) berbahasa akademik sesuai format S1.
- Melakukan mapping artefak teknis (controllers/services/models/migrations) ke dokumentasi UML dan use-case utama.
- Menghasilkan daftar tindakan perbaikan prioritas untuk sinkronisasi dokumentasi dan implementasi.

1.4 Batasan Masalah

- Fokus pada backend (REST API) dan dokumentasi pendukung (UML, dokumentasi tabel). UI/front-end hanya dijadikan bukti fungsi, bukan objek perubahan utama.
- Rancangan tidak mencakup perubahan arsitektur besar (mis. migrasi ke microservices) melainkan sinkronisasi dokumentasi, perbaikan alur, dan draf akademik.

1.5 Metode Penyusunan

- Analisis kode (scan controllers/services/models/migrations).
- Cross-check dokumentasi (`doc/uml/`, `doc/obe_tables.md`, `doc/analysis.md`) dan wawancara/verifikasi dengan perwakilan Prodi.
- Penyusunan draf akademik berbasis referensi ilmiah yang diacu mengikuti gaya Vancouver.

1.6 Sistematika Penulisan

- Bab I Pendahuluan
- Bab II Tinjauan Pustaka
- Bab III Metode dan Gambaran Sistem
- Bab IV Kebutuhan Fungsional dan Non-Fungsional

Referensi yang banyak dipakai untuk latar teori akan tercantum di Bab II.
