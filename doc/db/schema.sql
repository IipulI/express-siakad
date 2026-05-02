-- Generated schema (informational)

CREATE TABLE IF NOT EXISTS siak_agama (
  id UUID PRIMARY KEY,
  nama VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_aturan_evaluasi (
  id UUID PRIMARY KEY,
  siak_tahun_kurikulum_id UUID,
  siak_jenjang_id UUID,
  semester_ke INTEGER,
  total_sks_minimal INTEGER,
  batas_ipk_minimal DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS siak_batas_sks (
  id UUID PRIMARY KEY,
  siak_jenjang_id UUID,
  ips_min DOUBLE PRECISION,
  ips_max DOUBLE PRECISION,
  batas_sks INTEGER
);

CREATE TABLE IF NOT EXISTS siak_bidang_ilmu (
  id UUID PRIMARY KEY,
  kode VARCHAR(255),
  nama INTEGER
);

CREATE TABLE IF NOT EXISTS capaianmatakuliah (
   UUID,
  siak_obe_id UUID,
  siak_mata_kuliah_id UUID,
   VARCHAR(255),
   TEXT
);

CREATE TABLE IF NOT EXISTS capaianpembelajaranlulusan (
   UUID,
  siak_obe_id UUID,
   VARCHAR(255),
   TEXT,
   VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_cpl_umum (
  id UUID PRIMARY KEY,
  siak_tahun_kurikulum_id UUID,
  kode VARCHAR(255),
  deskripsi_ind TEXT,
  deskripsi_eng TEXT,
  target_cpl DOUBLE PRECISION,
  kategori VARCHAR(255),
  tingkat_cpl VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_dosen (
  id UUID PRIMARY KEY,
  nama VARCHAR(255),
  nidn VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_ekivalensi_mata_kuliah (
  id UUID PRIMARY KEY,
  siak_mata_kuliah_id UUID,
  siak_mata_kuliah_lama_id UUID
);

CREATE TABLE IF NOT EXISTS siak_fakultas (
  id UUID PRIMARY KEY,
  nama VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_hasil_studi (
  id UUID PRIMARY KEY,
  siak_mahasiswa_id UUID,
  siak_periode_akademik_id UUID,
  semester INTEGER,
  ips DOUBLE PRECISION,
  ipk DOUBLE PRECISION,
  sks_diambil INTEGER,
  sks_lulus INTEGER
);

CREATE TABLE IF NOT EXISTS siak_indikator_kinerja (
  id UUID PRIMARY KEY,
  siak_cpl_id UUID,
  kode VARCHAR(255),
  deskripsi TEXT,
  deskripsi_en TEXT
);

CREATE TABLE IF NOT EXISTS siak_jadwal_kuliah (
  id UUID PRIMARY KEY,
  siak_kelas_kuliah_id UUID,
  siak_ruangan_id UUID,
  siak_dosen_id UUID,
  hari VARCHAR(255),
  jam_mulai TEXT,
  jam_selesai TEXT,
  jenis_pertemuan VARCHAR(255),
  metode_pembelajaran VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS mahasiswa (
  nama VARCHAR(255),
  nim VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_jenis_mata_kuliah (
  id UUID PRIMARY KEY,
  kode VARCHAR(255),
  nama INTEGER
);

CREATE TABLE IF NOT EXISTS siak_jenjang (
  id UUID PRIMARY KEY,
  nama VARCHAR(255),
  jenjang VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_kebutuhan_khusus (
  id UUID PRIMARY KEY,
  nama VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_kelas_kuliah (
  id UUID PRIMARY KEY,
  siak_mata_kuliah_id UUID,
  siak_periode_akademik_id UUID,
  siak_program_studi_id UUID,
  siak_rps_id UUID,
  nama VARCHAR(255),
  kapasitas INTEGER,
  jumlah_peminat INTEGER,
  sistem_kuliah VARCHAR(255),
  status_kelas VARCHAR(255),
  jumlah_pertemuan INTEGER,
  tanggal_mulai TIMESTAMP,
  tanggal_selesai TIMESTAMP
);

CREATE TABLE IF NOT EXISTS siak_kelompok_mata_kuliah (
  id UUID PRIMARY KEY,
  kode VARCHAR(255),
  nama VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_komposisi_nilai_mata_kuliah (
  id UUID PRIMARY KEY,
  siak_tahun_kurikulum_id UUID,
  siak_mata_kuliah_id UUID,
  siak_unsur_nilai_id UUID,
  persentase DOUBLE PRECISION,
  key VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_komposisi_nilai_mata_kuliah (
  id UUID PRIMARY KEY,
  siak_mata_kuliah_id UUID,
   TEXT,
  key VARCHAR(255),
  persentase DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS siak_konsentrasi (
  id UUID PRIMARY KEY,
  siak_program_studi_id UUID,
  kode VARCHAR(255),
  nama VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_krs_mahasiswa (
  id UUID PRIMARY KEY,
  siak_mahasiswa_id UUID,
  siak_periode_akademik_id UUID,
  status VARCHAR(255),
  sks_diambil INTEGER,
  semester INTEGER
);

CREATE TABLE IF NOT EXISTS siak_mahasiswa (
  id UUID PRIMARY KEY,
   VARCHAR(255),
  npm VARCHAR(255),
   UUID,
   TEXT,
  siak_program_studi_id UUID,
   UUID,
   TEXT,
  periode_masuk VARCHAR(255),
   UUID,
   TEXT,
  siak_sistem_kuliah_id UUID,
  siak_jenis_pendaftaran_id UUID,
  gelombang VARCHAR(255),
   TIMESTAMP,
   TEXT,
  tanggal_awal_masuk TIMESTAMP,
   TIMESTAMP,
   TEXT,
  tanggal_awal_masuk TIMESTAMP,
  kebutuhan_khusus BOOLEAN,
  siak_status_mahasiswa_id TEXT,
   VARCHAR(255),
  biodata_valid BOOLEAN,
  angkatan VARCHAR(255),
  semester INTEGER,
  periode_keluar VARCHAR(255),
  siak_agama_id TEXT,
  siak_suku_id TEXT,
  jenis_kelamin VARCHAR(255),
  tempat_lahir VARCHAR(255),
  tanggal_lahir TIMESTAMP,
  berat_badan INTEGER,
  tinggi_badan INTEGER,
  golongan_darah VARCHAR(255),
  siak_transportasi_id UUID,
  no_telepon VARCHAR(255),
  no_whatsapp VARCHAR(255),
  email_pribadi VARCHAR(255),
  email_kampus VARCHAR(255),
   VARCHAR(255),
  paspor VARCHAR(255),
  no_kk VARCHAR(255),
   VARCHAR(255),
   TEXT,
  nik VARCHAR(255),
  status_nikah VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_master_komponen_evaluasi (
  id UUID PRIMARY KEY,
  nama_komponen VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_mata_kuliah (
  id UUID PRIMARY KEY,
  siak_program_studi_id UUID,
  siak_tahun_kurikulum_id UUID,
   TEXT,
   UUID,
   TEXT,
  siak_jenis_mata_kuliah_id UUID,
  siak_kelompok_mata_kuliah_id UUID,
  nama VARCHAR(255),
  kode VARCHAR(255),
  jenis VARCHAR(255),
  semester INTEGER,
  nilai_min VARCHAR(255),
  ada_praktikum BOOLEAN,
  opsi_wajib BOOLEAN,
  sks_tatap_muka INTEGER,
  sks_praktikum INTEGER,
  sks_praktik_lapangan INTEGER,
  total_sks INTEGER,
  prasyarat_mata_kuliah_1 UUID,
  prasyarat_mata_kuliah_2 UUID,
  prasyarat_mata_kuliah_3 UUID,
  nama_en VARCHAR(255),
  siak_kelompok_mata_kuliah_id UUID,
  siak_rumpun_mata_kuliah_id UUID,
  sks_simulasi INTEGER,
  merupakan_mku BOOLEAN,
  ada_sap BOOLEAN,
  ada_silabus BOOLEAN,
  ada_bahan_ajar BOOLEAN,
  ada_diktat BOOLEAN,
  sks_tatap_muka INTEGER,
  sks_praktikum INTEGER,
  sks_praktik_lapangan INTEGER,
  sks_simulasi INTEGER,
  koordinator_mk_id UUID,
  pengembang_rps_id UUID,
  level_pemetaan VARCHAR(255),
  metode_pembobotan VARCHAR(255),
  topik TEXT,
  kompetensi_dasar TEXT,
  sks_minimal INTEGER,
  is_paket BOOLEAN
);

CREATE TABLE IF NOT EXISTS siak_metode_evaluasi (
  id UUID PRIMARY KEY,
  kode VARCHAR(255),
  nama VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_nilai_cpmk_mahasiswa (
  id UUID PRIMARY KEY,
  siak_kelas_kuliah_id UUID,
  siak_mahasiswa_id UUID,
  siak_capaian_mata_kuliah_id UUID,
  nilai DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS siak_nilai_evaluasi_mahasiswa (
  id UUID PRIMARY KEY,
  siak_rincian_krs_mahasiswa_id UUID,
  siak_komposisi_nilai_id UUID,
  skor DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS siak_obe (
  id UUID PRIMARY KEY,
  siak_program_studi_id UUID,
  siak_tahun_kurikulum_id UUID,
  target_capaian DOUBLE PRECISION,
  target_cpl DOUBLE PRECISION,
  target_cpmk DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS siak_pekerjaan (
  id UUID PRIMARY KEY,
  nama VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_pembimbing_akademik (
  id UUID PRIMARY KEY,
  siak_dosen_id UUID,
  siak_mahasiswa_id UUID,
  siak_periode_akademik_id UUID,
  no_sk VARCHAR(255),
  tanggal_sk TIMESTAMP
);

CREATE TABLE IF NOT EXISTS siak_pemetaan_cpl_cpmk (
  id UUID PRIMARY KEY,
  siak_capaian_pembelajaran_lulusan_id UUID,
  siak_capaian_mata_kuliah_id UUID,
  bobot_cpl DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS siak_pemetaan_cpl_mk (
   UUID,
  siak_cpl_id UUID,
  siak_mata_kuliah_id UUID
);

CREATE TABLE IF NOT EXISTS siak_pemetaan_evaluasi_cpmk (
  id UUID PRIMARY KEY,
  siak_rencana_evaluasi_id UUID,
  siak_cpmk_id UUID,
  bobot_cpmk DECIMAL(5,2)
);

CREATE TABLE IF NOT EXISTS siak_pemetaan_komposisi_cpmk (
  id UUID PRIMARY KEY,
  siak_komposisi_nilai_id UUID,
  siak_cpmk_id UUID
);

CREATE TABLE IF NOT EXISTS siak_mata_kuliah_konsentrasi (
  id UUID PRIMARY KEY,
  siak_mata_kuliah_id UUID,
  siak_konsentrasi_id UUID
);

CREATE TABLE IF NOT EXISTS siak_pemetaan_pembelajaran_cpmk (
  id UUID PRIMARY KEY,
  siak_rencana_pembelajaran_id UUID,
  siak_cpmk_id UUID
);

CREATE TABLE IF NOT EXISTS siak_pemetaan_pl_cpl (
   UUID,
  siak_profil_lulusan_id UUID,
  siak_capaian_pembelajaran_lulusan_id UUID
);

CREATE TABLE IF NOT EXISTS siak_pendidikan (
  id UUID PRIMARY KEY,
  nama VARCHAR(255),
  jenjang VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_pengembangan_rps (
  id UUID PRIMARY KEY,
  siak_mata_kuliah_id UUID,
  siak_dosen_id UUID
);

CREATE TABLE IF NOT EXISTS siak_penghasilan_pekerjaan (
  id UUID PRIMARY KEY,
  range VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_pengumuman (
  id UUID PRIMARY KEY,
  siak_pegawai_id UUID,
  judul VARCHAR(255),
  isi TEXT,
  is_active BOOLEAN,
  is_priority BOOLEAN,
  banner TEXT
);

CREATE TABLE IF NOT EXISTS siak_periode_akademik (
  id UUID PRIMARY KEY,
  siak_tahun_ajaran_id UUID,
  nama VARCHAR(255),
  kode VARCHAR(255),
  tanggal_mulai TIMESTAMP,
  tanggal_selesai TIMESTAMP,
  status VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_predikat_kelulusan (
  id UUID PRIMARY KEY,
  siak_tahun_kurikulum_id UUID,
  siak_jenjang_id UUID,
  kode VARCHAR(255),
  nama_ind VARCHAR(255),
  nama_eng VARCHAR(255),
  ipk_min DECIMAL(10,2),
  ipk_max DECIMAL(10,2),
  masa_studi INTEGER,
  is_cuti BOOLEAN,
  is_mengulang BOOLEAN,
  nilai_min VARCHAR(255),
  nilai_min_ta VARCHAR(255),
  is_maba_only BOOLEAN
);

CREATE TABLE IF NOT EXISTS siak_profil_lulusan (
  id UUID PRIMARY KEY,
  siak_obe_id UUID,
  kode VARCHAR(255),
  profil VARCHAR(255),
  profesi VARCHAR(255),
  deskripsi TEXT,
  deskripsi_en TEXT
);

CREATE TABLE IF NOT EXISTS siak_program_studi (
  id UUID PRIMARY KEY,
  siak_fakultas_id UUID,
  siak_jenjang_id UUID,
  nama VARCHAR(255),
  kode VARCHAR(255),
  kaprodi_id UUID
);

CREATE TABLE IF NOT EXISTS siak_rencana_evaluasi (
  id UUID PRIMARY KEY,
  siak_mata_kuliah_id UUID,
  metode_evaluasi VARCHAR(255),
  jenis_evaluasi VARCHAR(255),
  bobot DECIMAL(5,2),
  syarat_lulus VARCHAR(255),
  deskripsi TEXT,
  deskripsi_inggris TEXT,
  siak_periode_akademik_id UUID
);

CREATE TABLE IF NOT EXISTS siak_rencana_pembelajaran (
  id UUID PRIMARY KEY,
  siak_mata_kuliah_id UUID,
  siak_periode_akademik_id UUID,
  sesi INTEGER,
  jenis_pertemuan VARCHAR(255),
  materi_pembelajaran TEXT,
  materi_pembelajaran_eng TEXT,
  indikator_penilaian TEXT,
  kriteria_penilaian TEXT,
  metode_pembelajaran_luring TEXT,
  metode_pembelajaran_daring TEXT,
  bobot_penilaian DECIMAL(5,2),
  cpmk_sub_cpmk TEXT,
  metode_pembelajaran TEXT
);

CREATE TABLE IF NOT EXISTS siak_rincian_krs_mahasiswa (
  id UUID PRIMARY KEY,
  siak_krs_mahasiswa_id UUID,
  siak_kelas_kuliah_id UUID,
  kategori VARCHAR(255),
  status VARCHAR(255),
  kehadiran DOUBLE PRECISION,
  tugas DOUBLE PRECISION,
  uts DOUBLE PRECISION,
  uas DOUBLE PRECISION,
  nilai DOUBLE PRECISION,
  huruf_mutu VARCHAR(255),
  angka_mutu DECIMAL(5,2),
  nilai_akhir DECIMAL(5,2)
);

CREATE TABLE IF NOT EXISTS siak_rps (
  id UUID PRIMARY KEY,
  siak_mata_kuliah_id UUID,
  siak_periode_akademik_id UUID,
  tanggal_penyusunan TIMESTAMP,
  deskripsi_mata_kuliah TEXT,
  deskripsi_mata_kuliah_eng TEXT,
  tujuan_mata_kuliah TEXT,
  materi_pembelajaran TEXT,
  pustaka_utama TEXT,
  pustaka_pendukung TEXT,
  media_perangkat_lunak TEXT,
  media_perangkat_keras TEXT,
  dokumen_rps TEXT
);

CREATE TABLE IF NOT EXISTS siak_ruangan (
  id UUID PRIMARY KEY,
  siak_fakultas_id UUID,
  nama VARCHAR(255),
  ruangan VARCHAR(255),
  kapasitas INTEGER,
  lantai INTEGER
);

CREATE TABLE IF NOT EXISTS siak_skala_penilaian (
  id UUID PRIMARY KEY,
  siak_program_studi_id UUID,
  siak_tahun_kurikulum_id UUID,
  huruf_mutu VARCHAR(255),
  angka_mutu DECIMAL(10,2),
  nilai_min DECIMAL(10,2),
  nilai_max DECIMAL(10,2),
   VARCHAR(255),
  is_default BOOLEAN,
  siak_periode_akademik_id UUID
);

CREATE TABLE IF NOT EXISTS siak_suku (
  id UUID PRIMARY KEY,
  nama VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_tahun_ajaran (
  id UUID PRIMARY KEY,
  tahun VARCHAR(255),
  nama VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_tahun_kurikulum (
  id UUID PRIMARY KEY,
  siak_periode_akademik_id UUID,
  tahun VARCHAR(255),
  keterangan VARCHAR(255),
  tanggal_mulai TIMESTAMP,
  tanggal_selesai TIMESTAMP
);

CREATE TABLE IF NOT EXISTS siak_team_penysun_rps (
  id UUID PRIMARY KEY,
  siak_fakultas_id UUID,
  siak_jenjang_id UUID,
  nama VARCHAR(255),
  kode VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_template_evaluasi (
  id UUID PRIMARY KEY,
  siak_tahun_kurikulum_id UUID,
  siak_program_studi_id UUID,
  jenis_mata_kuliah VARCHAR(255),
   VARCHAR(255),
  allow_null TEXT,
  field TEXT,
   VARCHAR(255),
  allow_null TEXT,
  field TEXT,
   DECIMAL(10,2),
  2 TEXT,
  syarat_lulus VARCHAR(255),
  deskripsi TEXT,
  deskripsi_inggris TEXT
);

CREATE TABLE IF NOT EXISTS siak_unsur_nilai (
  id UUID PRIMARY KEY,
  siak_metode_evaluasi_id UUID,
  kode VARCHAR(255),
  nama VARCHAR(255),
  nama_singkat VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS siak_user (
  id UUID PRIMARY KEY,
  eportal_user_id UUID
);

