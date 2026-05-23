Daftar Tabel Modul OBE

Dokumen ini menyajikan daftar tabel yang dipakai oleh modul OBE (Outcome-Based Education) beserta deskripsi skripsi-ready dan struktur fisik (kolom, tipe, keterangan). Referensi model dan skema generik: [models](models) dan [doc/db/schema.sql](doc/db/schema.sql).

Format setiap entri:
- Nama tabel
- Deskripsi singkat (bahasa Indonesia, siap dipakai di skripsi)
- Struktur fisik (Tabel kolom: Kolom | Tipe | Keterangan)
- Referensi model / skema

---

Tabel siak_pengembangan_rps

Tabel `siak_pengembangan_rps` menyimpan informasi pengembang RPS (pengembang atau dosen yang berkontribusi pada penyusunan RPS) untuk suatu mata kuliah. Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_mata_kuliah_id | UUID | FK ke siak_mata_kuliah.id |
| siak_dosen_id | UUID | FK ke siak_dosen.id (pengembang RPS) |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |

Referensi model: [models/pengembangan-rps.models.js](models/pengembangan-rps.models.js)

---

Tabel siak_team_penysun_rps

Tabel `siak_team_penysun_rps` menyimpan tim penyusun RPS (unit/kelompok yang menyusun RPS). Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_fakultas_id | UUID | FK ke siak_fakultas.id |
| siak_jenjang_id | UUID | FK ke siak_jenjang.id |
| nama | VARCHAR(255) | Nama tim/penyusun |
| kode | VARCHAR(255) | Kode tim |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |
| deleted_at | TIMESTAMP | Soft-delete |

Referensi model: [models/team-penyusun-rps.models.js](models/team-penyusun-rps.models.js)

---

Tabel siak_aturan_evaluasi

Tabel `siak_aturan_evaluasi` menyimpan aturan evaluasi pada level tahun kurikulum dan jenjang (mis. semester ke, batas minimal SKS, batas IPK minimal). Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_tahun_kurikulum_id | UUID | FK ke tahun kurikulum |
| siak_jenjang_id | UUID | FK ke jenjang |
| semester_ke | INTEGER | Semester ke berlakunya aturan |
| total_sks_minimal | INTEGER | Total SKS minimal |
| batas_ipk_minimal | DOUBLE PRECISION | Batas IPK minimal |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |
| deleted_at | TIMESTAMP | Soft-delete |

Referensi model: [models/aturan-evaluasi.models.js](models/aturan-evaluasi.models.js)

---

Tabel siak_skala_penilaian

Tabel `siak_skala_penilaian` menyimpan skala penilaian (huruf mutu dan angka mutu) per program studi / tahun kurikulum serta rentang nilai. Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_program_studi_id | UUID | FK ke program studi |
| siak_tahun_kurikulum_id | UUID | FK ke tahun kurikulum |
| huruf_mutu | VARCHAR(255) | Huruf mutu (A/B/C...) |
| angka_mutu | DECIMAL(3,2) | Nilai angka mutu yang terkait |
| nilai_min | DECIMAL(5,2) | Batas minimal nilai untuk rentang |
| nilai_max | DECIMAL(5,2) | Batas maksimal nilai untuk rentang |
| keterangan | VARCHAR(255) | Keterangan opsional |
| is_default | BOOLEAN | Penanda skala default |
| siak_periode_akademik_id | UUID | FK ke periode akademik (opsional) |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |
| deleted_at | TIMESTAMP | Soft-delete |

Referensi model: [models/skala-penilaian.models.js](models/skala-penilaian.models.js)

---

Tabel siak_predikat_kelulusan

Tabel `siak_predikat_kelulusan` menyimpan aturan dan label predikat kelulusan, termasuk rentang IPK, masa studi, serta atribut terkait (cuti, mengulang, dsb.). Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_tahun_kurikulum_id | UUID | FK ke tahun kurikulum |
| siak_jenjang_id | UUID | FK ke jenjang |
| kode | VARCHAR(10) | Kode predikat (opsional) |
| nama_ind | VARCHAR(255) | Nama predikat (Indonesia) |
| nama_eng | VARCHAR(255) | Nama predikat (Inggris) |
| ipk_min | DECIMAL(3,2) | Batas IPK minimal |
| ipk_max | DECIMAL(3,2) | Batas IPK maksimal |
| masa_studi | INTEGER | Masa studi (tahun) |
| is_cuti | BOOLEAN | Flag cuti |
| is_mengulang | BOOLEAN | Flag mengulang |
| nilai_min | VARCHAR(5) | Nilai minimal (opsional) |
| nilai_min_ta | VARCHAR(5) | Nilai minimal untuk tugas akhir |
| is_maba_only | BOOLEAN | Flag hanya untuk mahasiswa baru |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |
| deleted_at | TIMESTAMP | Soft-delete |

Referensi model: [models/predikat-kelulusan.models.js](models/predikat-kelulusan.models.js)

---

Tabel siak_ekivalensi_mata_kuliah

Tabel `siak_ekivalensi_mata_kuliah` menyimpan mapping ekivalensi antara mata kuliah kurikulum baru dan mata kuliah lama (mis. ketika mengakui mata kuliah dari kurikulum sebelumnya). Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_mata_kuliah_id | UUID | FK ke mata kuliah kurikulum baru |
| siak_mata_kuliah_lama_id | UUID | FK ke mata kuliah kurikulum lama |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |
| deleted_at | TIMESTAMP | Soft-delete |

Referensi model: [models/ekivalensi-mata-kuliah.models.js](models/ekivalensi-mata-kuliah.models.js)

---


Tabel siak_obe

Tabel siak_obe digunakan untuk menyimpan konfigurasi OBE pada tingkat program studi dan tahun kurikulum. Tabel ini menyimpan target agregat yang berkaitan dengan capaian pembelajaran program (CPL) dan CPMK yang menjadi dasar pemetaan dan penilaian berikutnya. Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key (identitas OBE) |
| siak_program_studi_id | UUID | FK ke siak_program_studi.id |
| siak_tahun_kurikulum_id | UUID | FK ke siak_tahun_kurikulum.id |
| target_capaian | DOUBLE PRECISION | Target capaian agregat (opsional) |
| target_cpl | DOUBLE PRECISION | Target CPL numerik |
| target_cpmk | DOUBLE PRECISION | Target CPMK numerik |
| created_at | TIMESTAMP | Waktu pembuatan record |
| updated_at | TIMESTAMP | Waktu update terakhir |
| deleted_at | TIMESTAMP | Waktu soft-delete (paranoid) |

Referensi model: [models/obe.models.js](models/obe.models.js)

---

Tabel siak_profil_lulusan

Tabel siak_profil_lulusan digunakan untuk merekam data target profesi atau karier luaran mahasiswa yang telah ditetapkan oleh program studi. Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_obe_id | UUID | FK ke siak_obe.id (keterkaitan PL dengan OBE) |
| kode | VARCHAR(255) | Kode profil lulusan |
| profil | VARCHAR(255) | Nama/label profil lulusan |
| profesi | VARCHAR(255) | Contoh profesi/karier terkait |
| deskripsi | TEXT | Deskripsi lokal |
| deskripsi_en | TEXT | Deskripsi bahasa Inggris |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |
| deleted_at | TIMESTAMP | Soft-delete |

Referensi model: [models/profil-lulusan.models.js](models/profil-lulusan.models.js)

---

Tabel siak_capaian_pembelajaran_lulusan

Tabel `siak_capaian_pembelajaran_lulusan` (CPL) menyimpan definisi capaian pembelajaran lulusan program studi. Setiap CPL merepresentasikan kompetensi/luaran yang diharapkan dari lulusan. Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_obe_id | UUID | FK ke siak_obe (keterkaitan CPL dengan OBE) |
| kode | VARCHAR(255) | Kode CPL |
| deskripsi | TEXT | Deskripsi CPL (Indonesia) |
| deskripsi_en | TEXT | Deskripsi CPL (Inggris) |
| target_cpl | FLOAT/DOUBLE | Target numerik CPL (opsional) |
| kategori | VARCHAR(255) | Kategori atau tipe CPL |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |
| deleted_at | TIMESTAMP | Soft-delete |

Referensi model: [models/capaian-pembelajaran-lulusan.models.js](models/capaian-pembelajaran-lulusan.models.js)

---

Tabel siak_capaian_mata_kuliah

Tabel `siak_capaian_mata_kuliah` (sering disebut CPMK) menyimpan capaian pembelajaran spesifik untuk setiap mata kuliah. CPMK dipetakan ke CPL dan digunakan untuk penilaian mahasiswa pada level MK. Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_obe_id | UUID | FK ke siak_obe (opsional) |
| siak_mata_kuliah_id | UUID | FK ke siak_mata_kuliah |
| kode | VARCHAR(255) | Kode CPMK |
| deskripsi | TEXT | Deskripsi CPMK |
| target | DOUBLE/FLOAT | Target numerik CPMK |
| bobot | DOUBLE/FLOAT | Bobot atau kontribusi CPMK |
| parent_id | UUID | Jika CPMK bersifat hierarkis, parent CPMK |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |
| deleted_at | TIMESTAMP | Soft-delete |

Referensi model: [models/capaian-mata-kuliah.models.js](models/capaian-mata-kuliah.models.js)

---

Tabel siak_cpl_umum

Tabel `siak_cpl_umum` menyimpan CPL yang bersifat umum/tingkat kurikulum (mis. CPL institusi atau CPL prodi pada level tahun kurikulum). Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_tahun_kurikulum_id | UUID | FK ke tahun kurikulum |
| kode | VARCHAR(255) | Kode CPL umum |
| deskripsi_ind | TEXT | Deskripsi CPL (Indonesia) |
| deskripsi_eng | TEXT | Deskripsi CPL (Inggris) |
| target_cpl | DOUBLE PRECISION | Target numerik |
| kategori | VARCHAR(255) | Kategori |
| tingkat_cpl | VARCHAR(255) | Tingkat/level CPL |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |
| deleted_at | TIMESTAMP | Soft-delete |

Referensi model: [models/cpl-umum.models.js](models/cpl-umum.models.js)

---

Tabel siak_indikator_kinerja

Tabel `siak_indikator_kinerja` menyimpan indikator kinerja terkait CPL, yang membantu mengukur ketercapaian CPL. Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_cpl_id | UUID | FK ke siak_capaian_pembelajaran_lulusan.id |
| kode | VARCHAR(255) | Kode indikator |
| deskripsi | TEXT | Deskripsi indikator |
| deskripsi_en | TEXT | Deskripsi (Inggris) |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |
| deleted_at | TIMESTAMP | Soft-delete |

Referensi model: [models/indikator-kinerja.models.js](models/indikator-kinerja.models.js)

---

Tabel siak_pemetaan_pl_cpl

Tabel pivot `siak_pemetaan_pl_cpl` menyimpan pemetaan antara Profil Lulusan (PL) dan CPL, digunakan untuk mendokumentasikan bagaimana profil lulusan terkait ke capaian program. Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_profil_lulusan_id | UUID | FK ke siak_profil_lulusan.id |
| siak_capaian_pembelajaran_lulusan_id | UUID | FK ke siak_capaian_pembelajaran_lulusan.id |
| bobot | FLOAT | Bobot kontribusi (opsional) |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |
| deleted_at | TIMESTAMP | Soft-delete |

Referensi model: [models/pemetaan-pl-cpl.models.js](models/pemetaan-pl-cpl.models.js)

---

Tabel siak_pemetaan_cpl_cpmk

Tabel pivot `siak_pemetaan_cpl_cpmk` menyimpan hubungan many-to-many antara CPL dan CPMK serta bobot pemetaan; penting untuk matriks pemetaan dan pelaporan. Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_capaian_pembelajaran_lulusan_id | UUID | FK ke CPL |
| siak_capaian_mata_kuliah_id | UUID | FK ke CPMK |
| bobot_cpl | DOUBLE PRECISION | Bobot kontribusi CPL dalam CPMK |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |
| deleted_at | TIMESTAMP | Soft-delete |

Referensi model: [models/pemetaan-cpl-cmk.models.js](models/pemetaan-cpl-cmk.models.js)

---

Tabel siak_pemetaan_cpl_mata_kuliah

Pivot `siak_pemetaan_cpl_mata_kuliah` (nama model: PemetaanCplMk) menyimpan relasi CPL ↔ Mata Kuliah. Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_capaian_pembelajaran_lulusan_id | UUID | FK ke CPL |
| siak_mata_kuliah_id | UUID | FK ke siak_mata_kuliah |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |
| deleted_at | TIMESTAMP | Soft-delete |

Referensi model: [models/pemetaan-cpl-mk.models.js](models/pemetaan-cpl-mk.models.js)

---

Tabel siak_pemetaan_evaluasi_cpmk

Tabel `siak_pemetaan_evaluasi_cpmk` menyimpan bobot CPMK yang terkait dengan item rencana evaluasi (mis. bobot tugas/UTS/UAS per CPMK). Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_rencana_evaluasi_id | UUID | FK ke siak_rencana_evaluasi |
| siak_cpmk_id | UUID | FK ke siak_capaian_mata_kuliah (CPMK) |
| bobot_cpmk | DECIMAL(5,2) | Bobot CPMK pada rencana evaluasi |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |
| deleted_at | TIMESTAMP | Soft-delete |

Referensi model: [models/pemetaan-evaluasi-cpmk.models.js](models/pemetaan-evaluasi-cpmk.models.js)

---

Tabel siak_pemetaan_komposisi_cpmk

Tabel pivot `siak_pemetaan_komposisi_cpmk` menghubungkan komposisi nilai (komponen penilaian) ke CPMK. Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_komposisi_nilai_id | UUID | FK ke siak_komposisi_nilai_mata_kuliah |
| siak_cpmk_id | UUID | FK ke siak_capaian_mata_kuliah |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |
| deleted_at | TIMESTAMP | Soft-delete |

Referensi model: [models/pemetaan-komposisi-cpmk.models.js](models/pemetaan-komposisi-cpmk.models.js)

---

Tabel siak_pemetaan_pembelajaran_cpmk

Tabel `siak_pemetaan_pembelajaran_cpmk` menyimpan pemetaan CPMK ke sesi/rencana pembelajaran (RencanaPembelajaran). Berguna untuk menandai sesi mana yang menargetkan CPMK tertentu. Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_rencana_pembelajaran_id | UUID | FK ke siak_rencana_pembelajaran |
| siak_cpmk_id | UUID | FK ke siak_capaian_mata_kuliah |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |
| deleted_at | TIMESTAMP | Soft-delete |

Referensi model: [models/pemetaan-pembelajaran-cpmk.models.js](models/pemetaan-pembelajaran-cpmk.models.js)

---

Tabel siak_komposisi_nilai_mata_kuliah

Tabel `siak_komposisi_nilai_mata_kuliah` menyimpan komposisi/komponen penilaian (mis. Tugas, UTS, UAS) untuk mata kuliah tertentu. Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_tahun_kurikulum_id | UUID | FK ke tahun kurikulum |
| siak_mata_kuliah_id | UUID | FK ke mata kuliah |
| siak_unsur_nilai_id | UUID | FK ke master unsur nilai |
| persentase | DECIMAL | Persentase bobot komponen |
| key | VARCHAR(255) | Identifier komponen |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |
| deleted_at | TIMESTAMP | Soft-delete |

Referensi model: [models/komposisi-nilai-mata-kuliah.models.js](models/komposisi-nilai-mata-kuliah.models.js)

---

Tabel siak_nilai_cpmk_mahasiswa

Tabel `siak_nilai_cpmk_mahasiswa` menyimpan nilai mahasiswa per-CPMK dalam konteks sebuah kelas. Data ini adalah output penilaian yang digunakan untuk menghitung ketercapaian CPMK dan agregasi ke CPL. Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_kelas_kuliah_id | UUID | FK ke kelas kuliah |
| siak_mahasiswa_id | UUID | FK ke tabel mahasiswa |
| siak_capaian_mata_kuliah_id | UUID | FK ke CPMK |
| nilai | DECIMAL(5,2) | Nilai CPMK untuk mahasiswa |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |
| deleted_at | TIMESTAMP | Soft-delete |

Referensi model: [models/nilai-cpmk-mahasiswa.models.js](models/nilai-cpmk-mahasiswa.models.js)

---

Tabel siak_nilai_evaluasi_mahasiswa

Tabel `siak_nilai_evaluasi_mahasiswa` menyimpan skor mahasiswa pada komponen evaluasi (komposisi nilai) yang selanjutnya dikonversi menjadi nilai akhir KRS/RPS. Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_rincian_krs_mahasiswa_id | UUID | FK ke rincian KRS mahasiswa |
| siak_komposisi_nilai_id | UUID | FK ke komposisi nilai |
| skor | DECIMAL(5,2) | Skor yang dicatat |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |
| deleted_at | TIMESTAMP | Soft-delete |

Referensi model: [models/nilai_evaluasi_mahasiswa.models.js](models/nilai_evaluasi_mahasiswa.models.js)

---

Tabel siak_rencana_pembelajaran

Tabel `siak_rencana_pembelajaran` menyimpan rincian per-sesi pembelajaran (Rencana Pembelajaran) termasuk materi, indikator penilaian, dan keterkaitan CPMK per sesi. Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik (kolom penting):

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_mata_kuliah_id | UUID | FK ke mata kuliah |
| siak_periode_akademik_id | UUID | FK periode akademik |
| sesi | INTEGER | Nomor sesi |
| jenis_pertemuan | VARCHAR(255) | Jenis pertemuan (teori/praktik) |
| materi_pembelajaran | TEXT | Materi (Indonesia) |
| materi_pembelajaran_eng | TEXT | Materi (Inggris) |
| indikator_penilaian | TEXT | Indikator penilaian per sesi |
| kriteria_penilaian | TEXT | Kriteria penilaian |
| metode_pembelajaran_luring | TEXT | Metode luring |
| metode_pembelajaran_daring | TEXT | Metode daring |
| bobot_penilaian | DECIMAL(5,2) | Bobot penilaian sesi |
| cpmk_sub_cpmk | TEXT | Field lama untuk kompatibilitas |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |

Referensi model: [models/rencana-pembelajaran.models.js](models/rencana-pembelajaran.models.js)

---

Tabel siak_rencana_evaluasi

Tabel `siak_rencana_evaluasi` menyimpan daftar elemen evaluasi (komponen penilaian) pada level mata kuliah, beserta bobot dan syarat lulus. Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_mata_kuliah_id | UUID | FK ke mata kuliah |
| metode_evaluasi | VARCHAR(255) | Nama/metode evaluasi (contoh: Tugas) |
| jenis_evaluasi | VARCHAR(255) | Jenis evaluasi (contoh: Kognitif) |
| bobot | DECIMAL(5,2) | Bobot komponen |
| syarat_lulus | VARCHAR(255) | Syarat lulus enum |
| deskripsi | TEXT | Deskripsi |
| deskripsi_inggris | TEXT | Deskripsi (Inggris) |
| siak_periode_akademik_id | UUID | FK periode akademik |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |

Referensi model: [models/rencana-evaluasi.models.js](models/rencana-evaluasi.models.js)

---

Tabel siak_rps

Tabel `siak_rps` menyimpan metadata dan dokumen RPS untuk mata kuliah (ringkasan tujuan, bahan ajar, pustaka, media, dokumen). Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik (kolom penting):

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_mata_kuliah_id | UUID | FK ke mata kuliah |
| siak_periode_akademik_id | UUID | FK periode akademik |
| tanggal_penyusunan | TIMESTAMP | Tanggal penyusunan RPS |
| deskripsi_mata_kuliah | TEXT | Deskripsi MK |
| deskripsi_mata_kuliah_eng | TEXT | Deskripsi MK (Inggris) |
| tujuan_mata_kuliah | TEXT | Tujuan pembelajaran |
| materi_pembelajaran | TEXT | Ringkasan materi |
| pustaka_utama | TEXT | Pustaka utama |
| pustaka_pendukung | TEXT | Pustaka pendukung |
| media_perangkat_lunak | TEXT | Media/perangkat lunak |
| media_perangkat_keras | TEXT | Media/perangkat keras |
| dokumen_rps | TEXT | File/dokumen RPS |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |

Referensi model: [models/rps.models.js](models/rps.models.js)

---

Tabel siak_template_evaluasi

Tabel `siak_template_evaluasi` menyimpan template komponen evaluasi yang dapat dipakai per prodi/tahun kurikulum sehingga memudahkan konsistensi penilaian. Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_tahun_kurikulum_id | UUID | FK tahun kurikulum |
| siak_program_studi_id | UUID | FK program studi |
| jenis_mata_kuliah | VARCHAR(255) | Jenis MK |
| metode_evaluasi | VARCHAR(255) | Metode evaluasi |
| jenis_evaluasi | VARCHAR(255) | Jenis evaluasi |
| bobot | DECIMAL(5,2) | Bobot default |
| syarat_lulus | VARCHAR(255) | Syarat lulus |
| deskripsi | TEXT | Deskripsi |
| deskripsi_inggris | TEXT | Deskripsi (Inggris) |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |

Referensi model: [models/template-evaluasi.models.js](models/template-evaluasi.models.js)

---

Tabel siak_master_komponen_evaluasi

Master komponen evaluasi (mis. label komponen seperti TUGAS, UTS, UAS). Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| nama_komponen | VARCHAR(255) | Nama komponen evaluasi |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |

Referensi model: [models/master-komponen-evaluasi.models.js](models/master-komponen-evaluasi.models.js)

---

Tabel siak_unsur_nilai

Tabel `siak_unsur_nilai` menyimpan unsur nilai (komponen detail) yang direlasikan ke metode evaluasi. Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| siak_metode_evaluasi_id | UUID | FK ke metode evaluasi |
| kode | VARCHAR(255) | Kode unsur |
| nama | VARCHAR(255) | Nama unsur |
| nama_singkat | VARCHAR(255) | Nama singkat |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |

Referensi model: [models/unsur-nilai.models.js](models/unsur-nilai.models.js)

---

Tabel siak_metode_evaluasi

Tabel `siak_metode_evaluasi` menyimpan master metode evaluasi (mis. TUGAS, PRAKTIK, UAS). Struktur fisik dari tabel ini dapat dilihat pada Tabel 4.x.

Struktur fisik:

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | UUID | Primary key |
| kode | VARCHAR(255) | Kode metode |
| nama | VARCHAR(255) | Nama metode |
| created_at | TIMESTAMP | Timestamp pembuatan |
| updated_at | TIMESTAMP | Timestamp update |

Referensi model: [models/metode-evaluasi.models.js](models/metode-evaluasi.models.js)

---

Tabel pendukung penting (ringkasan)

Modul OBE bergantung pada sejumlah tabel referensi dan operasional lain seperti:

- `siak_mata_kuliah` — metadata mata kuliah (id, program_studi, nama, kode, sks, semester, dst.). Model: [models/mata-kuliah.models.js](models/mata-kuliah.models.js)
- `siak_kelas_kuliah` — kelas dan relasinya ke mata kuliah (dipakai saat input nilai per-kelas). Model: [models/kelas-kuliah.models.js](models/kelas-kuliah.models.js)
- `siak_rincian_krs_mahasiswa` — rincian KRS per mahasiswa (dipakai oleh nilai evaluasi). Model: [models/rincian-krs-mahasiswa.models.js](models/rincian-krs-mahasiswa.models.js)
- `siak_krs_mahasiswa` — header KRS mahasiswa. Model: [models/krs-mahasiswa.models.js](models/krs-mahasiswa.models.js)
- `siak_program_studi` — program studi. Model: [models/program-studi.models.js](models/program-studi.models.js)
- `siak_tahun_kurikulum` — tahun kurikulum. Model: [models/tahun-kurikulum.models.js](models/tahun-kurikulum.models.js)

Untuk daftar lengkap skema fisik (semua kolom) hasil build schema, lihat `doc/db/schema.sql` yang menyajikan DDL ter-generate untuk semua tabel.

---

Catatan:

- Kolom `created_at`, `updated_at`, `deleted_at` muncul karena opsi `underscored: true`, `timestamps: true`, dan `paranoid: true` pada banyak model Sequelize.
- Untuk referensi migrations yang menciptakan kolom spesifik, periksa folder `migrations/` untuk file migration yang relevan (nama file berisi `create`/`add` dan nama tabel). Contoh: lihat file migration pada `migrations/20260320100025-add-obe-columns-to-mata-kuliah.cjs`.

Jika Anda mau, saya bisa:
- menambahkan nomor tabel (Tabel 4.x) dan menghasilkan daftar Tabel-Figure terpisah, atau
- mengekspor versi PDF/Word dari dokumen ini untuk dimasukkan ke bab skripsi.

---
## Perbedaan Implementasi & Rekomendasi

Berikut ringkasan perbedaan penting antara spesifikasi skripsi/dokumen dan implementasi proyek, beserta rekomendasi penulisan untuk Bab 4.3.6.

- **siak_obe**: Implementasi akhir menggunakan kolom `target_cpl` dan `target_cpmk` (model: [models/obe.models.js](models/obe.models.js)). Migration [migrations/20260327095028-update-kolom-target-obe.cjs](migrations/20260327095028-update-kolom-target-obe.cjs) menghapus kolom `target_capaian` yang sempat ada; namun `doc/db/schema.sql` dapat menampilkan snapshot antara (periksa migration). Rekomendasi: sebutkan evolusi kolom dan cantumkan migration ID sebagai bukti.

- **siak_pemetaan_cpl_cpmk**: Kolom `bobot_cpl` ditambahkan melalui migration [migrations/20260320151849-tambah-kolom-bobot-cpl.cjs](migrations/20260320151849-tambah-kolom-bobot-cpl.cjs) dan di-model-kan sebagai `FLOAT` ([models/pemetaan-cpl-cmk.models.js](models/pemetaan-cpl-cmk.models.js)), sementara `doc/db/schema.sql` mencantumkan `DOUBLE PRECISION`. Rekomendasi: catat perbedaan tipe (FLOAT vs DOUBLE) dan jelaskan implikasi presisi; jika presisi penting gunakan DECIMAL.

- **siak_capaian_pembelajaran_lulusan (CPL)**: `target_cpl` diimplementasikan sebagai `FLOAT` pada model ([models/capaian-pembelajaran-lulusan.models.js](models/capaian-pembelajaran-lulusan.models.js)). Rekomendasi: sebutkan tipe implementasi.

- **siak_komposisi_nilai_mata_kuliah**: Model menggunakan `DOUBLE` untuk `persentase` ([models/komposisi-nilai-mata-kuliah.models.js](models/komposisi-nilai-mata-kuliah.models.js)), sedangkan dokumen menyatakan `DECIMAL`. Rekomendasi: jika pembulatan/akurasi kritis, sarankan DECIMAL; catat keputusan teknis di bab metodologi.

- **Tabel RPS dan Rencana Pembelajaran**: Implementasi menambahkan field bilingual dan media (mis. `deskripsi_mata_kuliah_eng`, `materi_pembelajaran_eng`, `media_perangkat_lunak`, `metode_pembelajaran_daring`). Rekomendasi: sebutkan sebagai ekstensi fungsional proyek pada bagian implementasi.

- **Syarat Lulus pada siak_rencana_evaluasi**: Di model, `syarat_lulus` diimplementasikan sebagai string-enum dengan nilai default (lihat [models/rencana-evaluasi.models.js](models/rencana-evaluasi.models.js)). Rekomendasi: dokumentasikan nilai enum yang valid dan alasan memilih string-enum daripada boolean.

Rekomendasi umum untuk Bab 4.3.6 (Perancangan Basis Data):

- Sertakan semua tabel OBE yang tercantum pada dokumen ini.
- Untuk setiap tabel yang mengalami perubahan historis (rename/penambahan/tipe), cantumkan referensi migration dan model (contoh: `migrations/20260327095028-update-kolom-target-obe.cjs`, `models/obe.models.js`).
- Gunakan kombinasi `migrations` + `models` sebagai sumber kebenaran final; gunakan `doc/db/schema.sql` hanya sebagai snapshot dan beri catatan jika terdapat inkonsistensi.
