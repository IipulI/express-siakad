# OBE — Struktur Fisik Tabel (DDL) untuk Bab 4.3.6

Dokumen ini menyajikan spesifikasi fisik (kolom, tipe, PK/FK, keterangan) untuk semua tabel OBE yang relevan dengan proyek. Sumber: `models/` (Sequelize), `migrations/` (Sequelize CLI), dan `doc/db/schema.sql` (snapshot DDL). Semua tabel menggunakan `created_at`, `updated_at`, dan `deleted_at` bila model memakai `timestamps: true` dan `paranoid: true`.

Petunjuk referensi: setiap entri mencantumkan link ke model dan, bila relevan, migration yang mengubah struktur tabel.

---

## siak_obe

Deskripsi: Entitas master konfigurasi OBE per program studi + tahun kurikulum.

| Kolom | Tipe | PK / FK | Keterangan | Referensi |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Primary key | [models/obe.models.js](models/obe.models.js) |
| siak_program_studi_id | UUID | FK → siak_program_studi(id) | Program studi terkait | [models/obe.models.js](models/obe.models.js) |
| siak_tahun_kurikulum_id | UUID | FK → siak_tahun_kurikulum(id) | Tahun kurikulum terkait | [models/obe.models.js](models/obe.models.js) |
| target_cpl | DOUBLE PRECISION |  | Target agregat CPL (persentase) | model + migration: [models/obe.models.js](models/obe.models.js), [migrations/20260327095028-update-kolom-target-obe.cjs](migrations/20260327095028-update-kolom-target-obe.cjs) |
| target_cpmk | DOUBLE PRECISION |  | Target agregat CPMK (persentase) | [models/obe.models.js](models/obe.models.js) |
| created_at | TIMESTAMP |  | Timestamp pembuatan | -- |
| updated_at | TIMESTAMP |  | Timestamp update | -- |
| deleted_at | TIMESTAMP |  | Soft-delete (paranoid) | -- |

Catatan: migration `20260327095028-update-kolom-target-obe.cjs` menghapus kolom `target_capaian` yang sempat ada dan menambahkan `target_cpl`/`target_cpmk`. Schema snapshot (`doc/db/schema.sql`) mungkin masih mengandung versi antara.

---

## siak_profil_lulusan

Deskripsi: Profil/target karier lulusan pada level program studi.

| Kolom | Tipe | PK / FK | Keterangan | Referensi |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Primary key | [models/profil-lulusan.models.js](models/profil-lulusan.models.js) |
| siak_obe_id | UUID | FK → siak_obe(id) | Keterkaitan ke OBE | [models/profil-lulusan.models.js](models/profil-lulusan.models.js) |
| kode | VARCHAR |  | Kode profil lulusan | -- |
| profil | VARCHAR |  | Nama/label profil lulusan | -- |
| profesi | VARCHAR |  | Contoh profesi terkait | -- |
| deskripsi | TEXT |  | Deskripsi (Indonesia) | -- |
| deskripsi_en | TEXT |  | Deskripsi (English) | [models/profil-lulusan.models.js](models/profil-lulusan.models.js) |
| created_at | TIMESTAMP |  | Timestamp pembuatan | -- |
| updated_at | TIMESTAMP |  | Timestamp update | -- |
| deleted_at | TIMESTAMP |  | Soft-delete | -- |

---

## siak_capaian_pembelajaran_lulusan (CPL)

Deskripsi: Definisi capaian pembelajaran lulusan program studi.

| Kolom | Tipe | PK / FK | Keterangan | Referensi |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Primary key | [models/capaian-pembelajaran-lulusan.models.js](models/capaian-pembelajaran-lulusan.models.js) |
| siak_obe_id | UUID | FK → siak_obe(id) | Relasi ke OBE | [models/capaian-pembelajaran-lulusan.models.js](models/capaian-pembelajaran-lulusan.models.js) |
| kode | VARCHAR |  | Kode CPL | -- |
| deskripsi | TEXT |  | Deskripsi CPL (Indonesia) | -- |
| deskripsi_en | TEXT |  | Deskripsi CPL (English) | [models/capaian-pembelajaran-lulusan.models.js](models/capaian-pembelajaran-lulusan.models.js) |
| target_cpl | FLOAT |  | Target numerik CPL (implementasi: FLOAT) | [models/capaian-pembelajaran-lulusan.models.js](models/capaian-pembelajaran-lulusan.models.js) |
| kategori | VARCHAR |  | Kategori CPL | -- |
| created_at | TIMESTAMP |  | Timestamp pembuatan | -- |
| updated_at | TIMESTAMP |  | Timestamp update | -- |
| deleted_at | TIMESTAMP |  | Soft-delete | -- |

Catatan: proyek memakai `FLOAT` untuk `target_cpl`; dokumen menyebut `FLOAT/DOUBLE` sebagai opsi.

---

## siak_pemetaan_pl_cpl (pivot)

Deskripsi: Pivot PL ↔ CPL, menyertakan bobot kontribusi.

| Kolom | Tipe | PK / FK | Keterangan | Referensi |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Primary key | [models/pemetaan-pl-cpl.models.js](models/pemetaan-pl-cpl.models.js) |
| siak_profil_lulusan_id | UUID | FK → siak_profil_lulusan(id) | FK profil lulusan | [models/pemetaan-pl-cpl.models.js](models/pemetaan-pl-cpl.models.js) |
| siak_capaian_pembelajaran_lulusan_id | UUID | FK → siak_capaian_pembelajaran_lulusan(id) | FK CPL | [models/pemetaan-pl-cpl.models.js](models/pemetaan-pl-cpl.models.js) |
| bobot | FLOAT |  | Bobot kontribusi | [models/pemetaan-pl-cpl.models.js](models/pemetaan-pl-cpl.models.js) |
| created_at | TIMESTAMP |  | Timestamp pembuatan | -- |
| updated_at | TIMESTAMP |  | Timestamp update | -- |
| deleted_at | TIMESTAMP |  | Soft-delete | -- |

---

## siak_mata_kuliah

Deskripsi: Master mata kuliah (metadata) — proyek menambahkan kolom OBE dan metadata tambahan.

| Kolom | Tipe | PK / FK | Keterangan | Referensi |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Primary key | [models/mata-kuliah.models.js](models/mata-kuliah.models.js) |
| siak_program_studi_id | UUID | FK → siak_program_studi(id) | Program studi | [models/mata-kuliah.models.js](models/mata-kuliah.models.js) |
| siak_tahun_kurikulum_id | UUID | FK → siak_tahun_kurikulum(id) | Tahun kurikulum | [models/mata-kuliah.models.js](models/mata-kuliah.models.js) |
| nama | VARCHAR |  | Nama mata kuliah | -- |
| kode | VARCHAR |  | Kode mata kuliah | -- |
| jenis | VARCHAR |  | Jenis MK (teori/praktik) | -- |
| total_sks | INTEGER |  | Total SKS | -- |
| koordinator_mk_id | UUID | FK → siak_dosen(id) | Koordinator MK | [models/mata-kuliah.models.js](models/mata-kuliah.models.js) |
| level_pemetaan | VARCHAR |  | Level pemetaan OBE | [models/mata-kuliah.models.js](models/mata-kuliah.models.js) |
| metode_pembobotan | VARCHAR |  | Metode pembobotan MK | [models/mata-kuliah.models.js](models/mata-kuliah.models.js) |
| topik | TEXT |  | Topik / cakupan | [models/mata-kuliah.models.js](models/mata-kuliah.models.js) |
| kompetensi_dasar | TEXT |  | Kompetensi dasar | [models/mata-kuliah.models.js](models/mata-kuliah.models.js) |
| sks_minimal | INTEGER |  | SKS minimal jika ada | [models/mata-kuliah.models.js](models/mata-kuliah.models.js) |
| nama_en | VARCHAR |  | Nama bahasa Inggris | [models/mata-kuliah.models.js](models/mata-kuliah.models.js) |
| ada_sap | BOOLEAN |  | Flag SAP tersedia | [models/mata-kuliah.models.js](models/mata-kuliah.models.js) |
| created_at | TIMESTAMP |  | Timestamp pembuatan | -- |
| updated_at | TIMESTAMP |  | Timestamp update | -- |
| deleted_at | TIMESTAMP |  | Soft-delete | -- |

Catatan: tambahan OBE di `siak_mata_kuliah` penting dicantumkan sebagai ekstensi proyek di bab implementasi.

---

## siak_capaian_mata_kuliah (CPMK)

Deskripsi: Capaian pembelajaran per mata kuliah; dapat bersifat hierarkis.

| Kolom | Tipe | PK / FK | Keterangan | Referensi |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Primary key | [models/capaian-mata-kuliah.models.js](models/capaian-mata-kuliah.models.js) |
| siak_obe_id | UUID | FK → siak_obe(id) (opsional) | Keterkaitan OBE | [models/capaian-mata-kuliah.models.js](models/capaian-mata-kuliah.models.js) |
| siak_mata_kuliah_id | UUID | FK → siak_mata_kuliah(id) | MK terkait | [models/capaian-mata-kuliah.models.js](models/capaian-mata-kuliah.models.js) |
| kode | VARCHAR |  | Kode CPMK | -- |
| deskripsi | TEXT |  | Deskripsi CPMK | -- |
| target | DOUBLE |  | Target numerik CPMK | [models/capaian-mata-kuliah.models.js](models/capaian-mata-kuliah.models.js) |
| bobot | DOUBLE |  | Bobot kontribusi CPMK | [models/capaian-mata-kuliah.models.js](models/capaian-mata-kuliah.models.js) |
| parent_id | UUID | FK → siak_capaian_mata_kuliah(id) | Untuk hierarki/sub-CPMK | [models/capaian-mata-kuliah.models.js](models/capaian-mata-kuliah.models.js) |
| created_at | TIMESTAMP |  | Timestamp pembuatan | -- |
| updated_at | TIMESTAMP |  | Timestamp update | -- |
| deleted_at | TIMESTAMP |  | Soft-delete | -- |

---

## siak_pemetaan_cpl_cpmk (pivot)

Deskripsi: Pivot many-to-many CPL ↔ CPMK, termasuk bobot kontribusi CPL pada CPMK.

| Kolom | Tipe | PK / FK | Keterangan | Referensi |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Primary key | [models/pemetaan-cpl-cmk.models.js](models/pemetaan-cpl-cmk.models.js) |
| siak_capaian_pembelajaran_lulusan_id | UUID | FK → siak_capaian_pembelajaran_lulusan(id) | FK CPL | [models/pemetaan-cpl-cmk.models.js](models/pemetaan-cpl-cmk.models.js) |
| siak_capaian_mata_kuliah_id | UUID | FK → siak_capaian_mata_kuliah(id) | FK CPMK | [models/pemetaan-cpl-cmk.models.js](models/pemetaan-cpl-cmk.models.js) |
| bobot_cpl | FLOAT |  | Bobot kontribusi CPL pada CPMK (model uses FLOAT; schema dump may show DOUBLE) | [models/pemetaan-cpl-cmk.models.js](models/pemetaan-cpl-cmk.models.js), [migrations/20260320151849-tambah-kolom-bobot-cpl.cjs](migrations/20260320151849-tambah-kolom-bobot-cpl.cjs) |
| created_at | TIMESTAMP |  | Timestamp pembuatan | -- |
| updated_at | TIMESTAMP |  | Timestamp update | -- |
| deleted_at | TIMESTAMP |  | Soft-delete | -- |

Catatan: perbedaan tipe FLOAT vs DOUBLE harus dicatat di bab desain (implikasi presisi).

---

## siak_pemetaan_cpl_mata_kuliah (pivot)

Deskripsi: Pivot CPL ↔ Mata Kuliah (untuk mapping CPL langsung ke MK).

| Kolom | Tipe | PK / FK | Keterangan | Referensi |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Primary key | [models/pemetaan-cpl-mk.models.js](models/pemetaan-cpl-mk.models.js) |
| siak_capaian_pembelajaran_lulusan_id | UUID | FK → siak_capaian_pembelajaran_lulusan(id) | FK CPL | [models/pemetaan-cpl-mk.models.js](models/pemetaan-cpl-mk.models.js) |
| siak_mata_kuliah_id | UUID | FK → siak_mata_kuliah(id) | FK MK | [models/pemetaan-cpl-mk.models.js](models/pemetaan-cpl-mk.models.js) |
| created_at | TIMESTAMP |  | Timestamp pembuatan | -- |
| updated_at | TIMESTAMP |  | Timestamp update | -- |
| deleted_at | TIMESTAMP |  | Soft-delete | -- |

---

## siak_rencana_pembelajaran

Deskripsi: Rincian sesi pembelajaran per MK (RPS → sesi), termasuk mapping ke CPMK.

| Kolom | Tipe | PK / FK | Keterangan | Referensi |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Primary key | [models/rencana-pembelajaran.models.js](models/rencana-pembelajaran.models.js) |
| siak_mata_kuliah_id | UUID | FK → siak_mata_kuliah(id) | MK terkait | [models/rencana-pembelajaran.models.js](models/rencana-pembelajaran.models.js) |
| siak_periode_akademik_id | UUID | FK → siak_periode_akademik(id) | Periode (opsional) | [models/rencana-pembelajaran.models.js](models/rencana-pembelajaran.models.js) |
| sesi | INTEGER |  | Nomor sesi | -- |
| jenis_pertemuan | VARCHAR |  | Luring / Daring / Praktik | -- |
| materi_pembelajaran | TEXT |  | Materi (Indonesia) | -- |
| materi_pembelajaran_eng | TEXT |  | Materi (English) | [models/rencana-pembelajaran.models.js](models/rencana-pembelajaran.models.js) |
| indikator_penilaian | TEXT |  | Indikator penilaian | -- |
| kriteria_penilaian | TEXT |  | Kriteria penilaian | -- |
| metode_pembelajaran_luring | TEXT |  | Metode luring | [models/rencana-pembelajaran.models.js](models/rencana-pembelajaran.models.js) |
| metode_pembelajaran_daring | TEXT |  | Metode daring | [models/rencana-pembelajaran.models.js](models/rencana-pembelajaran.models.js) |
| bobot_penilaian | DECIMAL(5,2) |  | Bobot per sesi | [models/rencana-pembelajaran.models.js](models/rencana-pembelajaran.models.js) |
| cpmk_sub_cpmk | TEXT |  | Field legacy untuk kompatibilitas | [models/rencana-pembelajaran.models.js](models/rencana-pembelajaran.models.js) |
| created_at | TIMESTAMP |  | Timestamp pembuatan | -- |
| updated_at | TIMESTAMP |  | Timestamp update | -- |

---

## siak_rencana_evaluasi

Deskripsi: Item evaluasi per MK (komponen penilaian), bobot, dan syarat lulus.

| Kolom | Tipe | PK / FK | Keterangan | Referensi |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Primary key | [models/rencana-evaluasi.models.js](models/rencana-evaluasi.models.js) |
| siak_mata_kuliah_id | UUID | FK → siak_mata_kuliah(id) | MK terkait | [models/rencana-evaluasi.models.js](models/rencana-evaluasi.models.js) |
| metode_evaluasi | VARCHAR |  | Nama/metode evaluasi (contoh: Tugas) | -- |
| jenis_evaluasi | VARCHAR |  | Instrumen/metode evaluasi (contoh: Kognitif) | -- |
| bobot | DECIMAL(5,2) |  | Bobot komponen terhadap nilai akhir | [models/rencana-evaluasi.models.js](models/rencana-evaluasi.models.js) |
| syarat_lulus | VARCHAR |  | Enum-string (misal: 'TIDAK_MENJADI_SYARAT_LULUS', 'MENJADI_SYARAT_LULUS') | [models/rencana-evaluasi.models.js](models/rencana-evaluasi.models.js) |
| deskripsi | TEXT |  | Deskripsi evaluasi | -- |
| deskripsi_inggris | TEXT |  | Deskripsi (English) | [models/rencana-evaluasi.models.js](models/rencana-evaluasi.models.js) |
| siak_periode_akademik_id | UUID | FK → siak_periode_akademik(id) | Periode (opsional) | [models/rencana-evaluasi.models.js](models/rencana-evaluasi.models.js) |
| created_at | TIMESTAMP |  | Timestamp pembuatan | -- |
| updated_at | TIMESTAMP |  | Timestamp update | -- |
| deleted_at | TIMESTAMP |  | Soft-delete | -- |

Catatan: `syarat_lulus` diimplementasikan sebagai string-enum; dokumentasikan nilai yang tersedia.

---

## siak_pemetaan_evaluasi_cpmk

Deskripsi: Bobot CPMK pada item rencana evaluasi (pivot RencanaEvaluasi ↔ CPMK).

| Kolom | Tipe | PK / FK | Keterangan | Referensi |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Primary key | [models/pemetaan-evaluasi-cpmk.models.js](models/pemetaan-evaluasi-cpmk.models.js) |
| siak_rencana_evaluasi_id | UUID | FK → siak_rencana_evaluasi(id) | FK rencana evaluasi | [models/pemetaan-evaluasi-cpmk.models.js](models/pemetaan-evaluasi-cpmk.models.js) |
| siak_cpmk_id | UUID | FK → siak_capaian_mata_kuliah(id) | FK CPMK | [models/pemetaan-evaluasi-cpmk.models.js](models/pemetaan-evaluasi-cpmk.models.js) |
| bobot_cpmk | DECIMAL(5,2) |  | Bobot CPMK pada item evaluasi | [models/pemetaan-evaluasi-cpmk.models.js](models/pemetaan-evaluasi-cpmk.models.js) |
| created_at | TIMESTAMP |  | Timestamp pembuatan | -- |
| updated_at | TIMESTAMP |  | Timestamp update | -- |
| deleted_at | TIMESTAMP |  | Soft-delete | -- |

---

## siak_komposisi_nilai_mata_kuliah

Deskripsi: Komposisi komponen penilaian (kehadiran, tugas, UTS, UAS, dll.) per MK.

| Kolom | Tipe | PK / FK | Keterangan | Referensi |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Primary key | [models/komposisi-nilai-mata-kuliah.models.js](models/komposisi-nilai-mata-kuliah.models.js) |
| siak_tahun_kurikulum_id | UUID | FK → siak_tahun_kurikulum(id) | Tahun kurikulum konteks | [models/komposisi-nilai-mata-kuliah.models.js](models/komposisi-nilai-mata-kuliah.models.js) |
| siak_mata_kuliah_id | UUID | FK → siak_mata_kuliah(id) | MK terkait | [models/komposisi-nilai-mata-kuliah.models.js](models/komposisi-nilai-mata-kuliah.models.js) |
| siak_unsur_nilai_id | UUID | FK → siak_unsur_nilai(id) | Unsur nilai | [models/komposisi-nilai-mata-kuliah.models.js](models/komposisi-nilai-mata-kuliah.models.js) |
| persentase | DOUBLE(5,2) |  | Persentase komponen (model uses DOUBLE; doc suggests DECIMAL) | [models/komposisi-nilai-mata-kuliah.models.js](models/komposisi-nilai-mata-kuliah.models.js) |
| key | VARCHAR(255) |  | Identifier komponen | [models/komposisi-nilai-mata-kuliah.models.js](models/komposisi-nilai-mata-kuliah.models.js) |
| created_at | TIMESTAMP |  | Timestamp pembuatan | -- |
| updated_at | TIMESTAMP |  | Timestamp update | -- |
| deleted_at | TIMESTAMP |  | Soft-delete | -- |

Catatan: jika akurasi pembulatan penting, gunakan `DECIMAL` pada DDL final.

---

## siak_nilai_evaluasi_mahasiswa

Deskripsi: Tabel transaksi skor mahasiswa pada komposisi nilai.

| Kolom | Tipe | PK / FK | Keterangan | Referensi |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Primary key | [models/nilai_evaluasi_mahasiswa.models.js](models/nilai_evaluasi_mahasiswa.models.js) |
| siak_rincian_krs_mahasiswa_id | UUID | FK → siak_rincian_krs_mahasiswa(id) | Rujukan KRS mahasiswa | [models/nilai_evaluasi_mahasiswa.models.js](models/nilai_evaluasi_mahasiswa.models.js) |
| siak_komposisi_nilai_id | UUID | FK → siak_komposisi_nilai_mata_kuliah(id) | Komposisi nilai | [models/nilai_evaluasi_mahasiswa.models.js](models/nilai_evaluasi_mahasiswa.models.js) |
| skor | DECIMAL(5,2) |  | Skor yang dicatat | [models/nilai_evaluasi_mahasiswa.models.js](models/nilai_evaluasi_mahasiswa.models.js) |
| created_at | TIMESTAMP |  | Timestamp pembuatan | -- |
| updated_at | TIMESTAMP |  | Timestamp update | -- |
| deleted_at | TIMESTAMP |  | Soft-delete | -- |

---

## siak_nilai_cpmk_mahasiswa

Deskripsi: Nilai mahasiswa pada level CPMK per kelas.

| Kolom | Tipe | PK / FK | Keterangan | Referensi |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Primary key | [models/nilai-cpmk-mahasiswa.models.js](models/nilai-cpmk-mahasiswa.models.js) |
| siak_kelas_kuliah_id | UUID | FK → siak_kelas_kuliah(id) | Kelas konteks | [models/nilai-cpmk-mahasiswa.models.js](models/nilai-cpmk-mahasiswa.models.js) |
| siak_mahasiswa_id | UUID | FK → siak_mahasiswa(id) | Mahasiswa | [models/nilai-cpmk-mahasiswa.models.js](models/nilai-cpmk-mahasiswa.models.js) |
| siak_capaian_mata_kuliah_id | UUID | FK → siak_capaian_mata_kuliah(id) | CPMK | [models/nilai-cpmk-mahasiswa.models.js](models/nilai-cpmk-mahasiswa.models.js) |
| nilai | DECIMAL(5,2) |  | Nilai CPMK | [models/nilai-cpmk-mahasiswa.models.js](models/nilai-cpmk-mahasiswa.models.js) |
| created_at | TIMESTAMP |  | Timestamp pembuatan | -- |
| updated_at | TIMESTAMP |  | Timestamp update | -- |
| deleted_at | TIMESTAMP |  | Soft-delete | -- |

---

## Tabel pendukung lain (ringkasan) — sertakan minimal ringkasan pada Bab 4.3.6

- `siak_program_studi` — master program studi. Model: [models/program-studi.models.js](models/program-studi.models.js)
- `siak_tahun_kurikulum` — tahun kurikulum. Model: [models/tahun-kurikulum.models.js](models/tahun-kurikulum.models.js)
- `siak_periode_akademik` — periode akademik. Model: [models/periode-akademik.models.js](models/periode-akademik.models.js)
- `siak_kelas_kuliah` — kelas kuliah; relevan untuk agregasi nilai. Model: [models/kelas-kuliah.models.js](models/kelas-kuliah.models.js)
- `siak_rincian_krs_mahasiswa` & `siak_krs_mahasiswa` — transaksi KRS & rincian (relevan untuk relasi nilai). Models: [models/rincian-krs-mahasiswa.models.js](models/rincian-krs-mahasiswa.models.js), [models/krs-mahasiswa.models.js](models/krs-mahasiswa.models.js)
- `siak_template_evaluasi`, `siak_master_komponen_evaluasi`, `siak_unsur_nilai`, `siak_metode_evaluasi` — master & template evaluasi. Models: [models/template-evaluasi.models.js](models/template-evaluasi.models.js), [models/master-komponen-evaluasi.models.js](models/master-komponen-evaluasi.models.js), [models/unsur-nilai.models.js](models/unsur-nilai.models.js), [models/metode-evaluasi.models.js](models/metode-evaluasi.models.js)
- `siak_ekivalensi_mata_kuliah`, `siak_pengembangan_rps`, `siak_team_penysun_rps` — pendukung manajemen RPS. Models: [models/ekivalensi-mata-kuliah.models.js](models/ekivalensi-mata-kuliah.models.js), [models/pengembangan-rps.models.js](models/pengembangan-rps.models.js), [models/team-penyusun-rps.models.js](models/team-penyusun-rps.models.js)
- `siak_predikat_kelulusan`, `siak_skala_penilaian` — pengaturan keluaran & skala. Models: [models/predikat-kelulusan.models.js](models/predikat-kelulusan.models.js), [models/skala-penilaian.models.js](models/skala-penilaian.models.js)
- `siak_cpl_umum`, `siak_indikator_kinerja`, `siak_pemetaan_komposisi_cpmk` — definisi CPL umum, indikator, dan pivots lainnya. Models: [models/cpl-umum.models.js](models/cpl-umum.models.js), [models/indikator-kinerja.models.js](models/indikator-kinerja.models.js), [models/pemetaan-komposisi-cpmk.models.js](models/pemetaan-komposisi-cpmk.models.js)

---

## Catatan akhir untuk Bab 4.3.6

- Gunakan tabel di atas sebagai Tabel 4.x (mis. Tabel 4.1 — siak_obe, Tabel 4.2 — siak_profil_lulusan, dst.). Sertakan kolom `created_at`, `updated_at`, `deleted_at` di keterangan umum.  
- Saat membahas perubahan skema (rename/kolom baru/tipe), cantumkan migration file yang relevan sebagai bukti evolusi (contoh: `migrations/20260327095028-update-kolom-target-obe.cjs`, `migrations/20260320151849-tambah-kolom-bobot-cpl.cjs`, `migrations/20260320100025-add-obe-columns-to-mata-kuliah.cjs`).  
- Catat perbedaan tipe numerik (FLOAT vs DOUBLE vs DECIMAL) dan jelaskan keputusan desain singkat.

---

Jika Anda mau, saya bisa:

- Menghasilkan DDL SQL `CREATE TABLE` otomatis untuk setiap entri, atau
- Mengekspor dokumen ini ke PDF/Word agar siap dilampirkan ke skripsi.
