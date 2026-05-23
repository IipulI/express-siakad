# Perbandingan Skema — Tabel OBE (Proyek vs Skripsi)

File ini menyajikan per-tabel perbandingan singkat antara spesifikasi skripsi/dokumen dan implementasi proyek. Urutan mengikuti prioritas skripsi: dimulai dari `siak_obe`.

> Referensi model/migration/schema ditautkan di tiap entri.

---

## siak_obe

| Aspek | Detail |
| --- | --- |
| Thesis / Dokumen | id (UUID PK); siak_program_studi_id; siak_tahun_kurikulum_id; target_capaian DOUBLE PRECISION; target_cpl DOUBLE PRECISION; target_cpmk DOUBLE PRECISION; timestamps |
| Proyek (model / migration / schema) | Model: [models/obe.models.js](models/obe.models.js) — defines target_cpl (DOUBLE, default 0) and target_cpmk (DOUBLE, default 0). Migration: [migrations/20260327095028-update-kolom-target-obe.cjs](migrations/20260327095028-update-kolom-target-obe.cjs) removes target_capaian and adds target_cpl/target_cpmk. Schema dump: [doc/db/schema.sql](doc/db/schema.sql) still lists target_capaian along with others. |
| Perbedaan | target_capaian was introduced then removed; schema dump may reflect intermediate state while model shows final columns target_cpl and target_cpmk. |
| Rekomendasi | Sertakan tabel di skripsi; jelaskan evolusi kolom (cantumkan migration IDs) dan gunakan migrations + model sebagai sumber kebenaran terakhir. |

---

## siak_profil_lulusan

| Aspek | Detail |
| --- | --- |
| Thesis / Dokumen | id; siak_obe_id; kode; profil; profesi; deskripsi; deskripsi_en; timestamps |
| Proyek (model / migration / schema) | Model: [models/profil-lulusan.models.js](models/profil-lulusan.models.js) — includes deskripsi_en mapping. Schema ref: [doc/db/schema.sql](doc/db/schema.sql) and summary: [doc/obe_tables.md](doc/obe_tables.md). |
| Perbedaan | Tidak ada perbedaan fungsional signifikan; proyek sudah menyimpan deskripsi bahasa Inggris. |
| Rekomendasi | Sertakan apa adanya; catat adanya deskripsi_en. |

---

## siak_capaian_pembelajaran_lulusan

| Aspek | Detail |
| --- | --- |
| Thesis / Dokumen | id; siak_obe_id; kode; deskripsi; deskripsi_en; target_cpl (FLOAT/DOUBLE); kategori; timestamps |
| Proyek (model / migration / schema) | Model: [models/capaian-pembelajaran-lulusan.models.js](models/capaian-pembelajaran-lulusan.models.js) — has deskripsi_en and targetCpl (FLOAT). Summary: [doc/obe_tables.md](doc/obe_tables.md). |
| Perbedaan | Tipe numerik: proyek menggunakan FLOAT for targetCpl (dokumen memperbolehkan FLOAT/DOUBLE). |
| Rekomendasi | Sertakan dan sebutkan tipe implementation (FLOAT). |

---

## siak_pemetaan_pl_cpl

| Aspek | Detail |
| --- | --- |
| Thesis / Dokumen | Pivot: id; siak_profil_lulusan_id; siak_capaian_pembelajaran_lulusan_id; bobot FLOAT; timestamps |
| Proyek (model / migration / schema) | Model: [models/pemetaan-pl-cpl.models.js](models/pemetaan-pl-cpl.models.js) — defines bobot as FLOAT (default 0). Doc: [doc/obe_tables.md](doc/obe_tables.md). |
| Perbedaan | Tidak ada perbedaan fungsional; pastikan migration ada bila DB awal tidak memiliki kolom bobot. |
| Rekomendasi | Sertakan; verifikasi existence of migration jika perlu. |

---

## siak_pemetaan_cpl_cpmk

| Aspek | Detail |
| --- | --- |
| Thesis / Dokumen | Pivot: id; siak_capaian_pembelajaran_lulusan_id; siak_capaian_mata_kuliah_id; bobot_cpl DOUBLE PRECISION; timestamps |
| Proyek (model / migration / schema) | Model: [models/pemetaan-cpl-cmk.models.js](models/pemetaan-cpl-cmk.models.js) — bobotCpl typed as FLOAT (field bobot_cpl, default 0). Migration: [migrations/20260320151849-tambah-kolom-bobot-cpl.cjs](migrations/20260320151849-tambah-kolom-bobot-cpl.cjs) adds bobot_cpl as FLOAT. Schema dump: [doc/db/schema.sql](doc/db/schema.sql) shows bobot_cpl as DOUBLE PRECISION. |
| Perbedaan | Tipe mismatch antara schema dump (DOUBLE PRECISION) dan migration/model (FLOAT). |
| Rekomendasi | Sertakan tabel; catat perbedaan tipe dan gunakan migration sebagai bukti implementasi. Jika presisi penting, pertimbangkan konsistensi DECIMAL/DOUBLE. |

---

## siak_pemetaan_cpl_mata_kuliah

| Aspek | Detail |
| --- | --- |
| Thesis / Dokumen | Pivot: id; siak_capaian_pembelajaran_lulusan_id; siak_mata_kuliah_id; timestamps |
| Proyek (model / migration / schema) | Model: [models/pemetaan-cpl-mk.models.js](models/pemetaan-cpl-mk.models.js) — table name implemented as siak_pemetaan_cpl_mata_kuliah. |
| Perbedaan | Nama tabel/konvensi penamaan di dokumen kadang disingkat; implementasi punya nama lengkap `siak_pemetaan_cpl_mata_kuliah`. |
| Rekomendasi | Sertakan; gunakan nama tabel implementasi dan catat variasi penamaan. |

---

## siak_capaian_mata_kuliah (CPMK)

| Aspek | Detail |
| --- | --- |
| Thesis / Dokumen | id; siak_obe_id (opsional); siak_mata_kuliah_id; kode; deskripsi; target DOUBLE/FLOAT; bobot DOUBLE/FLOAT; parent_id (opsional); timestamps |
| Proyek (model / migration / schema) | Model: [models/capaian-mata-kuliah.models.js](models/capaian-mata-kuliah.models.js) — includes target DOUBLE, bobot DOUBLE, parent_id mapped to parentId. |
| Perbedaan | Implementasi menambahkan dukungan hierarki (`parent_id`) dan menggunakan DOUBLE untuk numeric fields. |
| Rekomendasi | Sertakan; jelaskan fitur hierarki dan tipe DOUBLE pada implementasi. |

---

## siak_mata_kuliah

| Aspek | Detail |
| --- | --- |
| Thesis / Dokumen | Metadata mata kuliah: id; program_studi; nama; kode; sks; semester; dst. |
| Proyek (model / migration / schema) | Model: [models/mata-kuliah.models.js](models/mata-kuliah.models.js) — menambahkan kolom OBE dan metadata: level_pemetaan, metode_pembobotan, topik, kompetensi_dasar, sks_minimal, is_paket, nama_en, ada_sap, ada_silabus, dsb. |
| Perbedaan | Implementasi memperluas tabel dengan banyak kolom OBE dan bilingual/operasional yang tidak ada di spesifikasi skripsi minimal. |
| Rekomendasi | Sertakan `siak_mata_kuliah` dan laporkan ekstensi proyek sebagai peningkatan fungsional terkait OBE. |

---

## siak_rps

| Aspek | Detail |
| --- | --- |
| Thesis / Dokumen | Metadata/dokumen RPS: deskripsi_mata_kuliah; tujuan; materi; pustaka; dokumen; timestamps |
| Proyek (model / migration / schema) | Model: [models/rps.models.js](models/rps.models.js) — menambahkan deskripsi_mata_kuliah_eng, media_perangkat_lunak, media_perangkat_keras, dokumen_rps. |
| Perbedaan | Proyek menambahkan bidang bilingual dan media. |
| Rekomendasi | Sertakan; catat tambahan bilingual & media. |

---

## siak_rencana_pembelajaran

| Aspek | Detail |
| --- | --- |
| Thesis / Dokumen | Per-sesi: sesi; jenis_pertemuan; materi_pembelajaran; indikator_penilaian; kriteria_penilaian; bobot_penilaian; dll. |
| Proyek (model / migration / schema) | Model: [models/rencana-pembelajaran.models.js](models/rencana-pembelajaran.models.js) — includes materi_pembelajaran_eng, metode_pembelajaran_luring, metode_pembelajaran_daring, bobot_penilaian DECIMAL(5,2), plus legacy fields for compatibility. |
| Perbedaan | Implementasi menambahkan bilingual dan pemisahan metode luring/daring; bobot disimpan sebagai DECIMAL. |
| Rekomendasi | Sertakan; jelaskan penambahan bilingual dan metode daring/luring. |

---

## siak_rencana_evaluasi

| Aspek | Detail |
| --- | --- |
| Thesis / Dokumen | id; siak_mata_kuliah_id; metode_evaluasi; jenis_evaluasi; bobot; syarat_lulus; deskripsi; deskripsi_inggris; timestamps |
| Proyek (model / migration / schema) | Model: [models/rencana-evaluasi.models.js](models/rencana-evaluasi.models.js) — bobot DECIMAL(5,2); syarat_lulus stored as VARCHAR with default enum-like value (e.g., 'TIDAK_MENJADI_SYARAT_LULUS'); includes deskripsi_inggris. |
| Perbedaan | `syarat_lulus` implemented as descriptive enum-string rather than boolean. |
| Rekomendasi | Sertakan; dokumentasikan nilai enum yang valid untuk `syarat_lulus`. |

---

## siak_pemetaan_evaluasi_cpmk

| Aspek | Detail |
| --- | --- |
| Thesis / Dokumen | id; siak_rencana_evaluasi_id; siak_cpmk_id; bobot_cpmk DECIMAL(5,2); timestamps |
| Proyek (model / migration / schema) | Model: [models/pemetaan-evaluasi-cpmk.models.js](models/pemetaan-evaluasi-cpmk.models.js) — bobot_cpmk DECIMAL(5,2). |
| Perbedaan | Tidak ada perbedaan signifikan. |
| Rekomendasi | Sertakan. |

---

## siak_pemetaan_pembelajaran_cpmk

| Aspek | Detail |
| --- | --- |
| Thesis / Dokumen | Pivot: id; siak_rencana_pembelajaran_id; siak_cpmk_id; timestamps |
| Proyek (model / migration / schema) | Model: [models/pemetaan-pembelajaran-cpmk.models.js](models/pemetaan-pembelajaran-cpmk.models.js) — sesuai. |
| Perbedaan | Tidak ada perbedaan signifikan. |
| Rekomendasi | Sertakan. |

---

## siak_komposisi_nilai_mata_kuliah

| Aspek | Detail |
| --- | --- |
| Thesis / Dokumen | id; siak_tahun_kurikulum_id; siak_mata_kuliah_id; siak_unsur_nilai_id; persentase DECIMAL; key VARCHAR; timestamps |
| Proyek (model / migration / schema) | Model: [models/komposisi-nilai-mata-kuliah.models.js](models/komposisi-nilai-mata-kuliah.models.js) — `persentase` DOUBLE(5,2). |
| Perbedaan | Tipe numeric: DOUBLE vs DECIMAL; DECIMAL lebih tepat untuk presisi persentase. |
| Rekomendasi | Sertakan; catat pilihan tipe dan sarankan DECIMAL jika presisi dan pembulatan kritis. |

---

## siak_nilai_evaluasi_mahasiswa

| Aspek | Detail |
| --- | --- |
| Thesis / Dokumen | id; siak_rincian_krs_mahasiswa_id; siak_komposisi_nilai_id; skor DECIMAL(5,2); timestamps |
| Proyek (model / migration / schema) | Model: [models/nilai_evaluasi_mahasiswa.models.js](models/nilai_evaluasi_mahasiswa.models.js) — `skor` DECIMAL(5,2) default 0. |
| Perbedaan | Tidak ada perbedaan signifikan. |
| Rekomendasi | Sertakan. |

---

### Catatan umum

- Untuk klaim final terhadap skema produksi, utamakan migration files dan model yang aktif; `doc/db/schema.sql` dapat berisi snapshot campuran (terutama jika migrations dijalankan bertahap).  
- Saat menulis bab skripsi, sertakan potongan migration/revision (ID file) bila menjelaskan evolusi kolom (contoh: `20260327095028-update-kolom-target-obe.cjs`).

---

Jika Anda mau, saya dapat mengekspor file ini ke PDF untuk lampiran skripsi atau menambahkan tabel DDL lengkap per kolom ke file yang sama.
