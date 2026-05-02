**4.1.5 Analisis Sistem yang Akan Dibuat**

- Tujuan sistem: implementasi OBE (Outcome-Based Education) untuk manajemen CPL/CPMK/RPS dan monitoring nilai.
- Batasan: backend REST API (Express + Sequelize), DB relational (Postgres/MySQL).
- Fungsional utama: manajemen kurikulum, mata kuliah, CPL, CPMK, RPS, pemetaan CPL-CPMK-MK, input nilai, monitoring, export laporan.
- Non-fungsional: autentikasi, logging, backup, skalabilitas, responsivitas API.

**4.2 Gambaran Umum Sistem**

- Aktor: Kaprodi, Dosen, Mahasiswa, Admin.
- Komponen: REST API server (Express), Database relasional (siak_* tables), storage untuk file RPS, client (web).
- Alur singkat: Kaprodi/Administrator mengatur kurikulum → Dosen membuat CPMK & RPS → Dosen input nilai per mahasiswa → Sistem menghitung CPL/CPMK dan menyediakan monitoring untuk Kaprodi.

Dokumentasi lebih lengkap dan diagram di folder /doc/uml dan skema DB di /doc/db/schema.sql
