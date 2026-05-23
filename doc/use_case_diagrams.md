## 4.3.1 Use Case Diagram

Pemodelan Use Case Diagram pada modul OBE berfungsi untuk memvisualisasikan fungsionalitas sistem dari sudut pandang interaksi aktor terhadap layanan backend yang disediakan. Aktor dihubungkan dengan use case menggunakan relasi asosiasi (association), sedangkan hubungan antar use case menggunakan relasi ketergantungan (dependency) berupa <<include>> untuk menunjukkan bahwa fungsi tersebut mensyaratkan mekanisme autentikasi (SSO) sebelum dapat diakses.

Pada modul OBE ini terdapat dua aktor utama yang menjadi fokus: **Kepala Program Studi (Admin Program Studi)** dan **Dosen**. Dokumen ini menyajikan diagram ringkas dan uraian identifikasi use case untuk kedua aktor, disusun dengan bahasa akademik yang sesuai bagi mahasiswa S1 yang sedang menyusun skripsi (penekanan pada ketepatan terminologi, tujuan fungsional, dan prasyarat operasional).

---

### 4.3.1.1 Use Case Diagram Kepala Program Studi

Diagram ringkas (representasi berbasis Mermaid):

```mermaid
graph LR
  KP[Kepala Program Studi]
  UC1[Autentikasi SSO (Login)]
  UC2[Mengelola Mata Kuliah]
  UC3[Mengelola Kurikulum Prodi]
  UC4[Mengelola Template Evaluasi]
  UC5[Mengelola Manajemen Capaian (PL / CPL)]
  UC6[Mengatur Grup MK (Wajib / Pilihan)]
  UC7[Mengelola Tahun Kurikulum]
  UC8[Melihat Laporan Monitoring OBE]

  KP --> UC2
  KP --> UC3
  KP --> UC4
  KP --> UC5
  KP --> UC6
  KP --> UC7
  KP --> UC8

  UC2 -->|<<include>>| UC1
  UC3 -->|<<include>>| UC1
  UC4 -->|<<include>>| UC1
  UC5 -->|<<include>>| UC1
  UC6 -->|<<include>>| UC1
  UC7 -->|<<include>>| UC1
  UC8 -->|<<include>>| UC1
```

Tabel identifikasi use case — Kepala Program Studi

| No | Use Case | Deskripsi |
| --- | --- | --- |
| 1 | Autentikasi SSO (Login) | Mekanisme otentikasi terpusat (Single Sign-On). Semua use case administratif mensyaratkan sesi SSO yang valid; sistem memverifikasi token sesi dan peran (role-based access control). |
| 2 | Mengelola Mata Kuliah | Menyediakan antarmuka untuk melihat daftar mata kuliah institusi, memperbarui metadata MK (kode, nama, sks), mengelola RPS (penautan RPS per periode), dan menentukan unit pengampu (Program Studi). Cocok untuk kegiatan administrasi kurikulum pada tingkat prodi. |
| 3 | Mengelola Kurikulum Prodi | Menetapkan elemen kurikulum seperti tahun kurikulum, turunan kurikulum, ekivalensi mata kuliah, serta parameter yang memengaruhi perhitungan OBE (mis. pengaktifan mode OBE untuk suatu kurikulum). |
| 4 | Mengelola Template Evaluasi | Menetapkan template evaluasi default (komponen penilaian, metode, dan bobot) yang dapat dipakai oleh dosen sebagai baseline RPS. Fitur ini memudahkan standardisasi penilaian di tingkat prodi. |
| 5 | Mengelola Manajemen Capaian (PL / CPL) | Mengelola Profil Lulusan (PL), Capaian Pembelajaran Lulusan (CPL), dan matriks pemetaan PL ↔ CPL yang menjadi dasar evaluasi outcome di seluruh mata kuliah. |
| 6 | Mengatur Grup MK (Wajib / Pilihan) | Mengelompokkan mata kuliah menjadi paket wajib atau pilihan sesuai struktur kurikulum semester, termasuk logika prasyarat dan pengaturan beban SKS paket. |
| 7 | Mengelola Tahun Kurikulum | Menyusun daftar tahun kurikulum, menetapkan periode berlaku, dan mengaktifkan/deaktifkan skema OBE pada angkatan tertentu. |
| 8 | Melihat Laporan Monitoring OBE | Menarik rekapitulasi agregat capaian CPL, distribusi nilai, dan metrik pemantauan prodi; laporan dapat diekspor (PDF/Excel) untuk keperluan akreditasi dan evaluasi mutu. |

Catatan: setiap use case pada tabel di atas mengharuskan autentikasi SSO (relasi <<include>> ke UC1). Dalam implementasi backend, pencatatan audit (who/when/what) dianjurkan untuk semua aksi terhadap data kurikulum.

---

### 4.3.1.2 Use Case Diagram Dosen

Diagram ringkas (representasi berbasis Mermaid):

```mermaid
graph LR
  D[Dosen]
  U1[Autentikasi SSO (Login)]
  U2[Mengelola Prasyarat Mata Kuliah]
  U3[Mengelola Konsentrasi / Kelompok MK]
  U4[Mengelola Template Evaluasi (RPS)]
  U5[Import Data RPS (unggah PDF) & Ekstraksi Komponen Evaluasi]
  U6[Validasi Keaslian Dokumen (Anti-Plagiarisme / Turnitin kecil)]
  U7[Memproses Kalkulasi Nilai OBE]
  U8[Melihat Laporan Capaian Kelas]

  D --> U2
  D --> U3
  D --> U4
  D --> U5
  D --> U6
  D --> U7
  D --> U8

  U2 -->|<<include>>| U1
  U3 -->|<<include>>| U1
  U4 -->|<<include>>| U1
  U5 -->|<<include>>| U1
  U6 -->|<<include>>| U1
  U7 -->|<<include>>| U1
  U8 -->|<<include>>| U1
```

Tabel identifikasi use case — Dosen

| No | Use Case | Deskripsi |
| --- | --- | --- |
| 1 | Autentikasi SSO (Login) | SSO sebagai prasyarat operasional; memverifikasi identitas dosen dan hak akses sesuai peran pengampu pada kelas/mata kuliah tertentu. |
| 2 | Mengelola Prasyarat Mata Kuliah | Menentukan syarat teknis akademik (pra-kurikulum) yang harus dipenuhi mahasiswa sebelum mengambil mata kuliah terkait. Berguna untuk pengaturan jalur studi dan validasi KRS. |
| 3 | Mengelola Konsentrasi / Kelompok MK | Memetakan mata kuliah ke dalam konsentrasi atau kelompok keilmuan; membantu pembentukan paket MK dan orientasi kurikulum. |
| 4 | Mengelola Template Evaluasi (RPS) | Menyusun atau menyesuaikan komponen evaluasi (tugas, kuis, praktikum, ujian) dan bobotnya di RPS; dosen dapat menyimpan template lokal atau memakai template prodi. |
| 5 | Import Data RPS (unggah PDF) & Ekstraksi Komponen Evaluasi | Fasilitas unggah berkas RPS berformat PDF yang menginisiasi proses ekstraksi metadata dan komponen evaluasi secara semi-otomatis. Tujuan fungsionalnya adalah mempercepat pengisian RPS dan meminimalkan entri manual pada elemen evaluasi (komponen, bobot, CPMK terkait). |
| 6 | Pemeriksaan Kemiripan dan Keunikan Dokumen ("turnitin kecil" dan "unik anti plagiasi") | Layanan pemeriksaan kemiripan dan pengukuran keunikan dokumen yang bersifat ringan (non-branded) dan dapat dioperasikan di dalam lingkungan institusi. Layanan ini menghitung skor kemiripan relatif terhadap korpus internal, menyajikan indikator keunikan ('unik anti plagiasi'), dan menyajikan laporan perbandingan untuk verifikasi akademik manual. |
| 7 | Memproses Kalkulasi Nilai OBE | Algoritma agregasi nilai: mengonversi skor evaluasi mahasiswa menjadi skor terbobot berdasarkan komposisi, mengakumulasi ke CPMK, dan menghitung persentase pencapaian CPL; hasil disimpan pada `RincianKrsMahasiswa` dan `NilaiCpmkMahasiswa`. |
| 8 | Melihat Laporan Capaian Kelas | Memanggil endpoint GET untuk menampilkan matriks pencapaian CPMK per mahasiswa di kelas yang diampu; data ditampilkan dalam bentuk tabular dan grafik untuk analisis pedagogis. |


Catatan implementasi pemeriksaan kemiripan dan keunikan dokumen (ringkas, akademik):

- Arsitektur modul: disarankan membangun modul internal bertajuk `services/plagiarism.service.js` yang menyediakan API server-internal `checkDocument(file)` yang mengembalikan objek terstruktur, mis. `{ similarityScore, uniquenessScore, matches[], reportUrl }`. Modul ini dirancang sebagai layanan ringan — seringkali disebut secara informal sebagai "turnitin kecil" — untuk membedakan dari layanan komersial bermerek.

- Sumber perbandingan: korpus internal institusi (arsip RPS, koleksi tugas/skripsi, bahan ajar), basis data sumber terbuka jika diperlukan, dan opsi integrasi dengan layanan eksternal yang dikontrol lewat feature toggle (memperhatikan aspek privasi dan perizinan). Pendekatan utama adalah menjaga privasi data institusi dengan memprioritaskan perbandingan lokal.

- Output dan kebijakan operasional: hasil pemeriksaan bersifat informatif, bukan otomatis memblokir. Sistem mengeluarkan peringatan ketika `similarityScore` melebihi ambang yang ditentukan, dan menampilkan metrik keunikan (`uniquenessScore`) serta daftar kemiripan untuk ditindaklanjuti oleh dosen atau tim akademik. Laporan pemeriksaan disimpan sebagai artefak audit (userId, timestamp, skor, file referensi) untuk keperluan dokumentasi akademik dan bukti kebijakan.

- Integrasi alur: panggil pemeriksaan pada awal pipeline unggah RPS dan pada proses validasi bulk sebelum data dipersist ke tabel utama. Hasil pemeriksaan dapat menyertakan rekomendasi ambang, indikator keunikan ("unik anti plagiasi"), dan link laporan yang mudah dikonsumsi oleh pengguna akademik.

- Catatan akademik: mekanisme ini dimaksudkan membantu penjaminan mutu pemutakhiran RPS dan mendukung integritas akademik. Keputusan final terkait potensi plagiasi tetap merupakan tanggung jawab manusia (dosen/panel verifikator), bukan sistem otomatis semata.

---

### Kaitan dengan Artefak Implementasi (referensi cepat)

Untuk membantu penulisan skripsi dan penautan ke implementasi backend, berikut rujukan file yang relevan pada workspace (bisa dipakai untuk cross-reference ke diagram dan use case di atas):

- Controllers: [controllers/akademik/penilaian.controller.js](controllers/akademik/penilaian.controller.js), [controllers/akademik/rps.controller.js](controllers/akademik/rps.controller.js), [controllers/akademik/obe.controller.js](controllers/akademik/obe.controller.js)
- Services: [services/penilaian.service.js](services/penilaian.service.js), [services/rps.service.js](services/rps.service.js), [services/obe.service.js](services/obe.service.js)
- Models: [models/komposisi-nilai-mata-kuliah.models.js](models/komposisi-nilai-mata-kuliah.models.js), [models/nilai_evaluasi_mahasiswa.models.js](models/nilai_evaluasi_mahasiswa.models.js), [models/nilai-cpmk-mahasiswa.models.js](models/nilai-cpmk-mahasiswa.models.js)

---

Jika Anda ingin, saya bisa:

- Mengekspor diagram di atas menjadi gambar (PNG/SVG) dan menaruhnya di `doc/uml/` untuk dimasukkan ke laporan skripsi; atau
- Menambahkan skenario use case yang lebih rinci (mis. alur alt/exception, prasyarat data, dan contoh payload API) untuk tiap use case; atau
- Menyisipkan cross-reference langsung ke nomor baris fungsi di file service/controller yang relevan.

File ini: [doc/use_case_diagrams.md](doc/use_case_diagrams.md)

---

### 4.3.1.3 Sinkronisasi Use Case ↔ Sequence Diagrams

Untuk memudahkan pemahaman dan memastikan konsistensi, berikut pemetaan setiap use case (Kepala Program Studi & Dosen) terhadap diagram sequence yang telah dibuat sebelumnya serta referensi fungsi/service yang mengimplementasikannya.

- `doc/sequence_diagrams.md` referensi: [doc/sequence_diagrams.md](doc/sequence_diagrams.md)

- Pemetaan ringkas (Use Case → Sequence Diagram → Implementasi):
  - Mengelola Mata Kuliah
    - Sequence: "1) Upload / Upsert RPS", "2) Ambil/Render RPS" (lihat [doc/sequence_diagrams.md](doc/sequence_diagrams.md))
    - Implementasi: `controllers/akademik/rps.controller.js` → `services/rps.service.js` (`upsertDetailRps`, `getFormDetailRps`)

  - Mengelola Template Evaluasi / Menetapkan Komposisi Nilai
    - Sequence: "3) Setup Komposisi Evaluasi & Pemetaan CPMK"
    - Implementasi: `controllers/akademik/penilaian.controller.js` → `services/penilaian.service.js` (`createKomposisiEvaluasi`, `getKomposisiEvaluasi`)

  - Input Nilai Mahasiswa (single & bulk)
    - Sequence: "4) Input Nilai Evaluasi Mahasiswa (single & bulk)" dan "8) Alur Validasi & Bulk"
    - Implementasi: `controllers/akademik/penilaian.controller.js` → `services/penilaian.service.js` (`inputNilaiMahasiswa`)

  - Kalkulasi Nilai OBE & Simpan Nilai CPMK
    - Sequence: "5) Hitung Nilai Akhir & Simpan Nilai CPMK"
    - Implementasi: `services/penilaian.service.js` (`hitungNilaiAkhir`), model: `NilaiCpmkMahasiswa`, `RincianKrsMahasiswa`

  - Generate Rapor OBE / Export
    - Sequence: "6) Generate Rapor OBE" dan "7) Export / Render Rapor"
    - Implementasi: `controllers/akademik/penilaian.controller.js` (`getRaporOBE`) → `services/penilaian.service.js` (`getRaporOBEMahasiswa`), `controllers/akademik/export.controller.js`

  - Validasi Keaslian Dokumen (Anti-Plagiarisme / Turnitin kecil)
    - Sequence (integrasi): panggil pada tahap upload ("1) Upload / Upsert RPS") dan saat import dokumen pada alur validasi bulk ("8) Alur Validasi & Bulk").
    - Implementasi saran: buat `services/plagiarism.service.js` dengan API internal `checkDocument(file)` yang dipanggil dari `services/rps.service.js` atau pipeline upload.

Catatan integrasi teknis:
- Setiap pemanggilan yang memodifikasi data (create/update/delete) sebaiknya berada dalam transaksi database (`sequelize.transaction`) sebagaimana ditunjukkan dalam sequence diagram.
- Untuk audit trail, tambahkan pencatatan `userId`, `action`, dan `timestamp` pada operasi penting (RPS upsert, perubahan komposisi, input nilai, dan export laporan).

Jika Anda setuju, saya bisa: (a) mengekspor diagram use case ke PNG/SVG ke folder `doc/uml/`, atau (b) menambahkan cross-reference langsung ke baris fungsi di file service/controller. Sebutkan pilihan Anda.

