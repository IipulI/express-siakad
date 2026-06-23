# Rencana Fitur: Penilaian Per Soal (Jalur C)

## 1. Latar Belakang Masalah

Dosen koordinator MK (contoh: dosen Kalkulus) komplain: menurut hitungan manualnya, seorang mahasiswa **seharusnya tidak lulus** mata kuliah, tapi di sistem (SEVIMA/clone-nya) mahasiswa itu **bisa lulus**.

**Sebab teknisnya** (sudah diverifikasi dengan data nyata TIK101 Kalkulus I, formula cocok 100% dengan output SEVIMA):

- Sistem sekarang (**Jalur A — Nilai per Komponen Evaluasi**) cuma menerima **1 angka per komponen** (TUGAS/UTS/UAS/KEHADIRAN), lalu nilai CPMK dihitung dengan **menyebar angka itu secara proporsional** ke tiap CPMK pakai rasio `bobotCpmk` dari Rencana Evaluasi:

  ```
  nilaiCPMK = Σ(skor_komponen × bobotCpmk) ÷ Σ(bobotCpmk)
  ```

- Rumus ini **mengasumsikan performa mahasiswa rata di semua soal dalam 1 komponen**. Padahal kenyataannya, dalam 1 UAS, mahasiswa bisa kuat di soal CPMK-1 tapi lemah di soal CPMK-3 — sistem tidak bisa tahu itu karena cuma diberi 1 angka agregat.
- **Pembuktian numerik nyata** (mahasiswa SITI, TIK101): sistem menghitung CPMK034 = 67,50 (proporsional), tapi kalau dihitung manual dari skor per soal yang sebenarnya, CPMK034 = 57,50 — **selisih 10 poin**, karena mahasiswa ini secara spesifik lemah di soal yang dipetakan ke CPMK034, tapi tertutupi oleh skor UAS keseluruhan yang lebih baik.
- Kesimpulan: **bukan bug**, ini adalah keterbatasan desain SEVIMA asli yang diwarisi oleh clone ini secara sengaja (sesuai tujuan skripsi: mereplikasi SEVIMA). Tapi keterbatasan ini nyata dan dirasakan dosen.

## 2. Solusi: Jalur C — Penilaian Per Soal (Tambahan, Aditif)

Membangun jalur ketiga (tanpa mengubah Jalur A yang sudah ada, dan tanpa mengubah Jalur B "Nilai per CPMK langsung" yang juga sudah ada) di mana dosen bisa:

1. Menyusun rubrik penilaian per komponen evaluasi, masing-masing dengan skor maksimal dan pemetaan ke CPMK (boleh 1 unit = 1 CPMK, atau 1 unit dipecah ke beberapa CPMK sekaligus).
2. Input skor mahasiswa **per unit penilaian**, bukan 1 angka gabungan.
3. Sistem otomatis menghitung Skor Komponen dan Nilai CPMK **dari bawah ke atas (bottom-up)** berdasarkan skor asli tiap unit — bukan asumsi proporsional.

### Penting: "Soal" = unit penilaian generik, BUKAN eksklusif soal ujian tulis

Istilah "Soal" di dokumen ini dipakai sebagai nama tabel, tapi **konsepnya berlaku untuk SEGALA jenis komponen evaluasi**, apa pun bentuk aslinya — selama bisa diberi 3 hal: skor maksimal, CPMK yang diuji, dan skor yang diperoleh mahasiswa. Berlaku untuk:

| Bentuk Asli | Contoh | Cara Skoring |
|---|---|---|
| Soal Pilihan Ganda | Kuis, UTS/UAS objektif | Binary (benar=skor penuh, salah=0) |
| Soal Esai | UTS/UAS uraian | Skor parsial pakai rubrik analitik |
| Soal Beranak (1a, 1b, 1c) | Soal kalkulus bertingkat | Tiap anak soal = 1 unit independen |
| Tugas Makalah | Tugas individu/kelompok | Skor parsial pakai rubrik (mis. per BAB/kriteria) |
| Presentasi | Presentasi mingguan, sidang proposal | Skor parsial pakai rubrik (mis. per kriteria penilaian) |
| Proyek/Praktikum | Tugas Akhir, Proyek UAS, Praktikum | Skor parsial pakai rubrik (mis. per tahap/deliverable) |
| Lainnya | Kuesioner, observasi, portofolio, dll | Selama bisa diberi skor 0–maks, otomatis didukung |

Jadi MK apa pun — Kalkulus (UTS/UAS objektif+esai), Manajemen Proyek (presentasi mingguan+tugas akhir, tanpa UTS/UAS), atau Analisis Perilaku Konsumen (proyek/take-home) — **semua bisa pakai Jalur C**, karena yang dibutuhkan cuma rubrik penilaian per komponen, tidak peduli apakah komponennya berbentuk soal tertulis atau bukan.

### Prinsip desain: 100% Aditif

- **Tidak ada tabel lama yang diubah skemanya.**
- **Tidak ada fungsi lama yang ditulis ulang.** Fungsi baru memanggil/reuse fungsi lama (`inputNilaiMahasiswa`, `hitungNilaiAkhir`) dengan hasil agregasi dari soal sebagai input — persis seperti dosen mengetik 1 angka manual, hanya saja angkanya dihitung sistem dari rincian soal.
- **Tidak ada endpoint lama yang dihapus atau diganti perilakunya.**

## 3. Skema Database Baru (3 tabel, semuanya baru, tidak menyentuh tabel existing)

```
siak_soal                                    (nama tabel, tapi isinya "unit penilaian" generik)
├── id (UUID, PK)
├── siak_rencana_evaluasi_id (FK → siak_rencana_evaluasi, NOT NULL)
├── parent_soal_id (FK → siak_soal.id, NULLABLE — untuk anak soal/sub-kriteria/beranak)
├── nomor (string, mis. "1", "5a", "Kriteria 2")
├── label (string, NULLABLE — nama bebas, mis. "Penyampaian Materi", "BAB 1 - Pendahuluan",
│          "Soal 3", supaya tidak harus berbentuk "Soal X" kalau komponennya presentasi/makalah)
├── jenis_unit (enum: 'OBJEKTIF', 'RUBRIK')
│     'OBJEKTIF' = skor binary/otomatis (mis. Pilihan Ganda)
│     'RUBRIK'   = skor parsial 0–maks pakai deskriptor kualitatif
│                  (mencakup esai, tugas makalah, presentasi, proyek, praktikum, dll —
│                   SEMUA bentuk evaluasi non-objektif pakai jenis ini)
├── skor_maksimal (decimal)
├── urutan (integer)
├── deleted_at (paranoid, konsisten dgn pola tabel lain di project)

siak_pemetaan_soal_cpmk
├── id (UUID, PK)
├── siak_soal_id (FK → siak_soal)
├── siak_cpmk_id (FK → siak_capaian_mata_kuliah)
├── bobot_poin (decimal — poin dari skor_maksimal unit ini yang dialokasikan ke CPMK ini)
│     (kalau 1 unit = 1 CPMK, bobot_poin = skor_maksimal unit itu)

siak_nilai_soal_mahasiswa
├── id (UUID, PK)
├── siak_rincian_krs_mahasiswa_id (FK → siak_rincian_krs_mahasiswa)
├── siak_soal_id (FK → siak_soal)
├── skor_diperoleh (decimal)
├── deleted_at (paranoid)
```

**Catatan penamaan**: tabel tetap dinamakan `siak_soal` (konsisten dengan istilah yang dipakai sepanjang diskusi), tapi secara semantik dia adalah **"unit penilaian"** — boleh berupa soal ujian, kriteria rubrik tugas makalah, kriteria rubrik presentasi, tahapan proyek, dst. Field `label` ditambahkan supaya dosen MK non-ujian (presentasi/proyek) bisa menamai unit-nya sesuai konteks, bukan dipaksa format "Soal 1, Soal 2".

**Catatan soal/unit beranak**: anak soal (1a, 1b, 1c) atau sub-kriteria tidak butuh struktur khusus — cukup jadi baris `siak_soal` independen dengan `parent_soal_id` menunjuk ke induknya (kolom ini cuma untuk pengelompokan tampilan, tidak mengubah cara hitung).

## 4. Formula (Bottom-Up, Bukan Proporsional)

**Skor Total Komponen** (dihitung dari semua soal di komponen itu):
```
SkorKomponen = ( Σ skor_diperoleh, semua soal di komponen ini )
             ÷ ( Σ skor_maksimal, semua soal di komponen ini )
             × 100
```

**Nilai CPMK akurat** (dihitung dari soal yang dipetakan ke CPMK itu saja, lintas semua komponen):
```
NilaiCPMK = ( Σ skor_diperoleh × (bobot_poin ÷ skor_maksimal_soal), semua soal yang dipetakan ke CPMK ini )
          ÷ ( Σ bobot_poin, semua soal yang dipetakan ke CPMK ini )
          × 100
```

## 4B. Contoh Penerapan di MK Non-Ujian (Manajemen Proyek: Presentasi Mingguan + Tugas Akhir, tanpa UTS/UAS)

Komponen Evaluasi (Rencana Evaluasi MK ini, total 100%): PRESENTASI MINGGUAN 30%, KEHADIRAN 10%, TUGAS AKHIR 60%.

**Rubrik unit penilaian untuk komponen "TUGAS AKHIR"** (60%):

| Unit | Jenis | CPMK | Maks | Diperoleh |
|---|---|---|---|---|
| Analisis kebutuhan proyek | RUBRIK | CPMK-1 | 25 | 20 |
| Perancangan solusi | RUBRIK | CPMK-2 | 25 | 22 |
| Implementasi/eksekusi | RUBRIK | CPMK-2 | 25 | 18 |
| Presentasi hasil akhir | RUBRIK | CPMK-3 | 25 | 23 |

```
SkorKomponen(TUGAS AKHIR) = (20+22+18+23)/(25+25+25+25)×100 = 83/100×100 = 83,00

%CPMK-1 = 20/25×100 = 80,00%
%CPMK-2 = (22+18)/(25+25)×100 = 80,00%
%CPMK-3 = 23/25×100 = 92,00%
```

Komponen "KEHADIRAN" tetap input manual 1 angka seperti Jalur A biasa (tidak perlu rincian unit, karena memang bukan sesuatu yang dinilai per kriteria). Komponen "PRESENTASI MINGGUAN" bisa dipecah per minggu jadi beberapa unit RUBRIK, sama seperti contoh TUGAS AKHIR di atas. **Tidak ada UTS/UAS sama sekali, dan tetap berfungsi penuh.**

## 5. Alur Proses Lengkap

```
1. Koordinator MK susun rubrik soal per komponen evaluasi
   → POST/PUT/DELETE endpoint baru (CRUD Soal)

2. Dosen input skor per soal, per mahasiswa
   → POST endpoint baru: /kelas/:kelasId/nilai-per-soal/:krsId
   Body: { "nilaiSoal": [ { "soalId": "...", "skor": 9 }, ... ] }

3. Service baru:
   a. Cek status kunci RincianKrsMahasiswa (REPLIKASI pengecekan dari inputNilaiMahasiswa
      yang sudah ada — WAJIB, supaya nilai terkunci tidak bisa ditimpa lewat jalur ini)
   b. Simpan ke siak_nilai_soal_mahasiswa (wipe & replace, pola sama seperti tabel lain)
   c. Hitung SkorKomponen per komponen yang disentuh (rumus di Bagian 4)
   d. PANGGIL inputNilaiMahasiswa() YANG SUDAH ADA, dengan payload
      [{ komposisiId: rencanaEvaluasiId, skor: SkorKomponen }, ...]
      → ini akan tertulis ke siak_nilai_evaluasi_mahasiswa, BENTUK SAMA seperti input
        manual biasa, tidak ada perubahan skema/format
   e. PANGGIL hitungNilaiAkhir() YANG SUDAH ADA — TIDAK DIUBAH SATU BARIS PUN
      → nilai_akhir, huruf_mutu, angka_mutu, dan NilaiCpmkMahasiswa (proporsional)
        ter-update otomatis lewat fungsi lama
   f. SETELAH itu, hitung NilaiCPMK akurat (rumus di Bagian 4), lalu OVERRIDE baris
      NilaiCpmkMahasiswa milik mahasiswa+kelas ini dengan angka yang lebih akurat
      (menimpa hasil proporsional dari langkah e, HANYA untuk kelas yang pakai Jalur C)

4. Semua endpoint pelaporan/monitoring membaca NilaiCpmkMahasiswa & nilai_akhir
   SEPERTI BIASA — otomatis dapat angka akurat, TANPA PERLU DIUBAH.
```

## 6. Endpoint yang DIPASTIKAN TIDAK BERUBAH (tidak diedit, tidak dihapus, tidak diganti perilakunya)

Semua endpoint berikut **hanya membaca tabel hasil** (`siak_nilai_cpmk_mahasiswa`, `siak_rincian_krs_mahasiswa`, `siak_nilai_evaluasi_mahasiswa`) — karena Jalur C menulis ke tabel yang sama dengan bentuk yang sama, **tidak ada satu pun baris kode di endpoint ini yang perlu disentuh**:

| Endpoint | Status |
|---|---|
| `GET /api/akademik/obe/profil-lulusan/:id_obe` | Tidak diubah |
| `GET /api/akademik/obe/capaian-pembelajaran/:id_obe` | Tidak diubah |
| `GET /api/akademik/obe/pemetaan/pl-ke-cpl/:id_obe` | Tidak diubah |
| `GET /api/akademik/obe/pemetaan/cpl-ke-mk/:id_obe` | Tidak diubah |
| `GET /api/akademik/koordinator-mk/mata-kuliah/:id/pemetaan-cpl` | Tidak diubah |
| `GET /api/akademik/koordinator-mk/mata-kuliah/:id/pemetaan-cpmk` | Tidak diubah |
| `GET /api/akademik/koordinator-mk/mata-kuliah/:id/detail-rps` | Tidak diubah |
| `GET /api/akademik/koordinator-mk/mata-kuliah/:id/rencana-pembelajaran` | Tidak diubah |
| `GET /api/akademik/koordinator-mk/mata-kuliah/:id/rencana-evaluasi` | Tidak diubah |
| `GET/POST /api/akademik/dosen/kelas/:id/nilai` | Tidak diubah (Jalur A tetap berfungsi seperti sekarang) |
| `GET /api/akademik/dosen/mata-kuliah/:id/rencana-evaluasi` | Tidak diubah |
| `GET /api/akademik/monitoring/cpl-prodi` | Tidak diubah (otomatis lebih akurat kalau kelasnya pakai Jalur C) |
| `GET /api/akademik/obe/monitoring/cpl-mahasiswa` | Tidak diubah (idem) |
| `GET /api/akademik/obe/monitoring/cpl-mata-kuliah` | Tidak diubah (idem) |
| `GET /api/akademik/obe/monitoring/mk-mahasiswa` | Tidak diubah (baca nilai_akhir langsung, tetap sama) |
| `GET /api/akademik/obe/monitoring/transkrip-obe` | Tidak diubah (idem) |

### 1 pengecualian: `GET /api/akademik/obe/monitoring/cpmk-mahasiswa`

Endpoint ini **beda sendiri** — dia **menghitung ulang langsung saat dipanggil** dari `siak_nilai_evaluasi_mahasiswa × bobotCpmk per komponen` (formula proporsional lama), **tidak membaca** `siak_nilai_cpmk_mahasiswa`. Supaya endpoint ini juga ikut akurat untuk kelas yang pakai Jalur C, perlu **1 penambahan kecil** (tetap aditif, bukan mengganti):

```
SEBELUM (tetap dipertahankan sebagai fallback):
  Hitung langsung dari siak_nilai_evaluasi_mahasiswa × bobotCpmk (kode lama, utuh)

SESUDAH (ditambahkan SEBELUM logic lama):
  IF kelas ini punya data di siak_nilai_soal_mahasiswa (artinya pakai Jalur C):
      Baca dari siak_nilai_cpmk_mahasiswa (sudah akurat dari Bagian 5f)
  ELSE:
      Jalankan kode lama seperti sekarang, TIDAK BERUBAH
```

Untuk kelas yang masih pakai Jalur A/B (mayoritas, termasuk semua data yang sudah ada sekarang), endpoint ini berperilaku **identik 100%** dengan sebelumnya — cabang IF baru hanya aktif kalau ada data Jalur C, yang artinya tidak akan pernah aktif untuk data lama.

### Risiko khusus: Soal dipetakan ke Sub-CPMK (bukan CPMK induk)

**Status**: Ini **bukan bug di kode yang sudah ada** — kode sekarang sudah benar untuk cara kerja Jalur A/B. Ini adalah **syarat desain yang wajib dipatuhi saat membangun Jalur C**, supaya tidak menimbulkan masalah baru.

**Temuan**: CPMK di sistem ini bisa punya sub-CPMK (lewat `CapaianMataKuliah.parentId`, lihat `cpmk.service.js:148-192`). Endpoint `cpmk-mahasiswa` sudah didesain mendukung level sub-CPMK ini (otomatis pakai level paling bawah). **Tapi** 4 endpoint pelaporan CPL (`cpl-prodi`, `cpl-mahasiswa`, `cpl-mata-kuliah`, `transkrip-obe`) menyambungkan nilai CPMK ke CPL lewat JOIN **exact-match** ke tabel `siak_pemetaan_cpl_cpmk` (dikonfirmasi di `monitoring.service.js` baris 88, 281, 440, 864) — **tidak ada rollup otomatis dari sub-CPMK ke CPMK induknya**.

**Skenario bahaya** (kalau tidak dimitigasi):
```
1. CPMK033 (induk) dipetakan ke CPL03, bobot 90% — baris ini ADA di siak_pemetaan_cpl_cpmk
2. CPMK033 punya sub-CPMK: CPMK033a, CPMK033b — TIDAK ADA baris pemetaan CPL untuk sub ini
3. Jalur C input skor mahasiswa LANGSUNG ke CPMK033a (sub), bukan ke CPMK033 (induk)
4. NilaiCpmkMahasiswa tersimpan dengan siak_capaian_mata_kuliah_id = CPMK033a
5. Query CPL cari: WHERE pcc.siak_capaian_mata_kuliah_id = CPMK033a → TIDAK KETEMU
6. Akibat: kontribusi mahasiswa itu ke CPL03 HILANG TOTAL dari laporan — TANPA ERROR,
   tanpa tanda kesalahan apa pun (silent data loss)
```

**Mitigasi wajib** (tetap aditif, tidak mengubah data/perilaku lama):

Saat Jalur C menulis materialisasi nilai CPMK (langkah 5f), kalau soal dipetakan ke sub-CPMK, **tulis 2 baris** ke `NilaiCpmkMahasiswa`, bukan 1:

```
1. Baris untuk sub-CPMK itu sendiri
   → dibaca endpoint cpmk-mahasiswa (granular, sudah didesain untuk ini)
2. Baris ROLLUP ke CPMK INDUK (rata-rata/weighted dari semua sub-CPMK anaknya
   yang sudah dinilai)
   → dibaca 4 endpoint CPL (cpl-prodi, cpl-mahasiswa, cpl-mata-kuliah, transkrip-obe),
     karena pemetaan CPL biasanya didefinisikan di level CPMK induk
```

**Checklist tambahan untuk Bagian 8 (Keamanan Data)**:
- [ ] Materialisasi Jalur C **wajib** cek apakah `siak_cpmk_id` pada `PemetaanSoalCpmk` punya `parentId` terisi (sub-CPMK). Kalau ya, hitung & tulis juga baris rollup ke CPMK induk.
- [ ] Testing tambahan: buat 1 skenario soal yang dipetakan ke sub-CPMK, pastikan nilai mahasiswa itu **tetap muncul** di `cpl-prodi`/`cpl-mahasiswa` (bukan hilang).

### Risiko khusus: Mencampur Jalur A dan Jalur C untuk komponen berbeda, mahasiswa yang sama

**Status**: Ditemukan saat verifikasi pasca-deploy (23 Juni 2026). Ini **bukan bug di kode yang sudah ada** — `inputNilaiMahasiswa` (fungsi lama, tidak diubah) sudah benar untuk pola pakainya sendiri (hapus-lalu-tulis-ulang SEMUA komponen yang dikirim). Risiko muncul justru **karena Jalur C me-reuse fungsi ini**, jadi ini syarat operasional yang wajib dipatuhi pengguna sistem, bukan sesuatu yang perlu ditambal di kode.

**Temuan — di laporan/monitoring AMAN, di INPUT berisiko:**
- Level laporan (`cpl-prodi`, `cpl-mahasiswa`, `cpl-mata-kuliah`, `transkrip-obe`, `cpmk-mahasiswa`): **tidak bentrok**. Jalur A dan Jalur C menulis ke tabel hasil yang sama (`NilaiCpmkMahasiswa`, `nilai_akhir`); endpoint baca tabel itu apa adanya, tidak peduli jalur mana yang menulis — campuran antar-mahasiswa dalam 1 kelas aman.
- Level input, **untuk 1 mahasiswa yang sama**: berisiko. `inputNilaiPerSoal` (Jalur C) menghitung `payloadKomponen` hanya dari komponen yang **punya baris soal** (`siak_nilai_soal_mahasiswa`), lalu memanggil `inputNilaiMahasiswa` — yang menghapus **SEMUA** baris `NilaiEvaluasiMahasiswa` milik mahasiswa itu sebelum menulis ulang hanya yang ada di `payloadKomponen`.

**Skenario bahaya:**
```
1. Dosen input KEHADIRAN = 100 manual lewat Jalur A (komponen ini TIDAK punya soal)
2. Beberapa hari kemudian, dosen input TUGAS/UTS/UAS lewat Jalur C (per soal)
3. inputNilaiPerSoal cuma menghitung ulang komponen yang ADA datanya di
   siak_nilai_soal_mahasiswa (TUGAS/UTS/UAS) -- KEHADIRAN tidak ikut, karena
   tidak ada soal yang menyentuhnya
4. inputNilaiMahasiswa (dipanggil di dalamnya) HAPUS SEMUA NilaiEvaluasiMahasiswa
   mahasiswa ini, lalu tulis ulang HANYA TUGAS/UTS/UAS
5. Akibat: nilai KEHADIRAN yang sudah diisi manual di langkah 1 HILANG,
   tanpa peringatan apa pun
```

**Mitigasi — sudah diimplementasikan (23 Juni 2026) di `services/soal.service.js`, fungsi `inputNilaiPerSoal`:**

Sebelum memanggil `inputNilaiMahasiswa`, sistem sekarang mengambil dulu semua `NilaiEvaluasiMahasiswa` yang sudah ada untuk mahasiswa itu, lalu **menggabungkan komponen yang TIDAK punya soal** (artinya diisi manual lewat Jalur A, seperti KEHADIRAN) ke dalam `payloadKomponen` sebelum dikirim — supaya komponen itu **ikut ditulis ulang dengan nilai yang sama**, bukan ikut terhapus.

```js
const rencanaIdsDariSoal = new Set(payloadKomponen.map(p => p.komposisiId));
const nilaiEksisting = await NilaiEvaluasiMahasiswa.findAll({ where: { siakRincianKrsMahasiswaId: krsId } });
nilaiEksisting.forEach(n => {
    if (!rencanaIdsDariSoal.has(n.siakRencanaEvaluasiId)) {
        payloadKomponen.push({ komposisiId: n.siakRencanaEvaluasiId, skor: parseFloat(n.skor) });
    }
});
```

**Sudah diverifikasi** (skenario test: PRAKTIKUM & PROYEK diisi manual lewat Jalur A = 100, lalu UTS diisi lewat Jalur C = 75) — hasilnya kedua komponen tetap ada (`PRAKTIKUM & PROYEK = 100,00`, `UTS = 75,00`), Nilai Akhir benar menggabungkan keduanya (49,63 = 100×35% + 75×19,51%), data test sudah dibersihkan total setelahnya.

**Catatan operasional yang masih berlaku**: kalau komponen sama (mis. UTS) pernah diisi lewat Jalur A (manual, tanpa soal) lalu BELAKANGAN mau diisi ulang lewat Jalur C (soal) untuk komponen YANG SAMA, nilai manual itu akan **digantikan** hasil hitung soal — itu perilaku yang diharapkan (Jalur C dianggap lebih akurat untuk komponen yang sama), bukan bug.

## 11. Referensi: Alur Lengkap Jalur A & Jalur C (Setelah Fix, 23 Juni 2026)

### Gambaran besar — titik temu kedua jalur

```
                    siak_nilai_evaluasi_mahasiswa      <- titik temu kedua jalur
                    (1 baris = 1 komponen, 1 angka)
                          ^                    ^
                Jalur A   |                    |  Jalur C
            (input manual)|                    | (hitung dari soal)
                          |                    |
                Dosen ketik 1          Dosen koreksi soal,
                angka per komponen     sistem hitung skor komponen otomatis
                          |                    |
                          +--------+-----------+
                                   v
                    hitungNilaiAkhir() -- FUNGSI YANG SAMA,
                    dipanggil dari kedua jalur, TIDAK DIUBAH
                                   |
                  +----------------+----------------+
                  v                                 v
       nilai_akhir, huruf_mutu          NilaiCpmkMahasiswa (proporsional)
       (RincianKrsMahasiswa)             -- ditulis otomatis oleh hitungNilaiAkhir,
                                            lalu DITIMPA oleh Jalur C kalau dipakai
                                                   |
                                                   v
                                hitungDanOverrideNilaiCpmkBottomUp()
                                -- CUMA dipanggil Jalur C, hitung ulang
                                   dari soal, override jadi akurat
```

### Jalur A — lengkap

1. Dosen ketik 1 angka per komponen (`POST /dosen/kelas/:kelasId/nilai/:krsId`).
2. `inputNilaiMahasiswa` ([penilaian.service.js:37](services/penilaian.service.js#L37)): cek kunci → hapus semua `NilaiEvaluasiMahasiswa` mahasiswa itu → insert ulang yang dikirim.
3. `hitungNilaiAkhir` ([penilaian.service.js:90](services/penilaian.service.js#L90)): `NilaiAkhir = Σ(skor_komponen × bobot/100)`, cek syarat lulus per komponen, materialisasi CPMK proporsional `Σ(skor×bobotCpmk)/Σ(bobotCpmk)`, tulis ke `RincianKrsMahasiswa` + `NilaiCpmkMahasiswa`.
4. Karakter: cepat & ringan, tapi CPMK-nya estimasi (asumsi performa rata di semua soal 1 komponen).

### Jalur C — lengkap

1. Koordinator MK susun rubrik soal per komponen (`POST /soal/komponen/:rencanaEvaluasiId`) — nomor, jenis (OBJEKTIF/RUBRIK), skor maksimal, pemetaan ke CPMK (boleh CPMK induk atau sub-CPMK).
2. Dosen koreksi & input skor per soal (`POST /soal/nilai/:krsId`).
3. `inputNilaiPerSoal` ([services/soal.service.js](services/soal.service.js)):
   - Cek kunci (sama seperti Jalur A)
   - Wipe & replace `NilaiSoalMahasiswa` untuk soal yang dikirim
   - Hitung `SkorKomponen = Σ(skor_diperoleh)/Σ(skor_maksimal)×100` dari SEMUA soal yang sudah ada nilainya
   - **[Fix Bagian 6]** Gabungkan komponen lain yang tidak punya soal (Jalur A) ke payload, supaya tidak ikut terhapus
   - REUSE `inputNilaiMahasiswa` + `hitungNilaiAkhir` (fungsi sama dengan Jalur A, tidak diduplikasi)
   - `hitungDanOverrideNilaiCpmkBottomUp`: hitung ulang CPMK dari skor soal asli `Σ(skor×bobotPoin/skorMaksimalSoal)/Σ(bobotPoin)`, plus rollup ke CPMK induk kalau perlu (Bagian 6), override `NilaiCpmkMahasiswa` cuma untuk mahasiswa+kelas itu.
4. Karakter: butuh effort menyusun rubrik dulu, tapi CPMK-nya akurat sesuai performa riil per soal.

### Tabel ringkasan

| Hal | Jalur A | Jalur C |
|---|---|---|
| Input | 1 angka/komponen | Banyak angka/soal |
| Tulis ke `NilaiEvaluasiMahasiswa` | Langsung | Lewat hasil hitung SkorKomponen + gabungan komponen non-soal (fix Bagian 6) |
| Hitung Nilai Akhir & Huruf Mutu | `hitungNilaiAkhir()` | `hitungNilaiAkhir()` — fungsi sama |
| Hitung CPMK | Proporsional (di dalam `hitungNilaiAkhir`) | Proporsional dulu (sama), lalu ditimpa jadi bottom-up akurat |

### Yang dibaca laporan/monitoring (tidak peduli jalur mana)

Semua endpoint CPL (`cpl-prodi`, `cpl-mahasiswa`, `cpl-mata-kuliah`, `transkrip-obe`) baca `NilaiCpmkMahasiswa` apa adanya — otomatis dapat versi proporsional (Jalur A) atau akurat (Jalur C) tergantung jalur terakhir yang dipakai mahasiswa itu. `cpmk-mahasiswa` punya 1 cabang tambahan (Bagian 6): kalau MK itu ada data soal sama sekali, baca dari `NilaiCpmkMahasiswa`; kalau tidak, hitung ulang proporsional seperti kode lama.

## 7. File Baru yang Dibuat (tidak ada file lama yang diedit kecuali poin 6 di atas)

```
migrations/
  xxxx-create-siak-soal.cjs                  (BARU)
  xxxx-create-siak-pemetaan-soal-cpmk.cjs    (BARU)
  xxxx-create-siak-nilai-soal-mahasiswa.cjs  (BARU)

models/
  soal.models.js                              (BARU)
  pemetaan-soal-cpmk.models.js                 (BARU)
  nilai-soal-mahasiswa.models.js               (BARU)

services/
  soal.service.js                              (BARU — CRUD soal + kalkulasi)

controllers/akademik/
  soal.controller.js                           (BARU)

routes/akademik/
  soal.route.js                                (BARU)

validators/
  soal.validator.js                            (BARU)
```

**Satu-satunya file lama yang disentuh**: `services/monitoring.service.js`, fungsi `getLaporanCpmkPerMahasiswa` — ditambah cabang IF aditif (Bagian 6), kode lama tidak dihapus.

## 8. Keamanan Data (checklist wajib saat implementasi)

- [ ] Fungsi input nilai per soal **wajib** cek status kunci (`Dikunci`/`Lulus`/`Tidak Lulus`) sebelum terima input — replikasi pengecekan dari `inputNilaiMahasiswa`.
- [ ] Tidak boleh ada migrasi yang mengubah tabel existing (`ALTER TABLE` ke tabel lama) — semua migrasi baru cuma `CREATE TABLE`.
- [ ] Testing regresi: jalankan ulang skenario TIK101 (mahasiswa SITI) lewat Jalur A seperti biasa, pastikan hasilnya **tetap 57,75 / CPMK033=56,90 / CPMK034=67,50** seperti sebelum fitur ini ada — kalau berubah, berarti ada yang tidak sengaja tersentuh.
- [ ] Operasional: 1 mahasiswa/1 kelas hanya pakai 1 jalur penilaian. Jangan campur Jalur A/B/C untuk mahasiswa yang sama (karena pola hapus-lalu-ganti, yang terakhir submit yang menang — ini risiko lama yang sudah ada sejak Jalur B dibuat, bukan risiko baru).

## 9. Estimasi Waktu (23 Juni – akhir Agustus 2026, ±9-10 minggu)

| Tahap | Estimasi |
|---|---|
| Migrasi + model (3 tabel baru) | 3-5 hari |
| Service CRUD Soal | 3-5 hari |
| Service input nilai per soal + integrasi ke fungsi lama | 3-5 hari |
| Penyesuaian aditif `cpmk-mahasiswa` | 1-2 hari |
| Controller + Route baru | 2-3 hari |
| Testing manual (Postman) + regresi Jalur A | 3-5 hari |
| **Total coding** | **~3-4 minggu** |
| Sisa waktu (dokumentasi, revisi dospem, sidang) | **~5-6 minggu** |

## 10. Status

**Implementasi selesai (23 Juni 2026).** Semua file di Bagian 7 sudah dibuat, migrasi sudah dijalankan (lokal + Neon, schema-only), dan diverifikasi end-to-end di lokal:

- Skenario test: 2 soal di komponen UTS (TIF152), masing-masing dipetakan ke SUB-CPMK berbeda dari CPMK induk yang sama.
- Hasil cocok 100% dengan rumus: SkorKomponen, nilai per sub-CPMK, **dan rollup ke CPMK induk (mitigasi sub-CPMK) terbukti bekerja**.
- Regresi `cpmk-mahasiswa` untuk MK yang TIDAK pakai Jalur C dicek — cabang lama tetap jalan normal, tidak berubah.
- Data test di lokal sudah dibersihkan total (soal, nilai, status RincianKrsMahasiswa dikembalikan ke kondisi semula).
- Neon: hanya migrasi skema (`CREATE TABLE`) yang dijalankan — **belum ada testing tulis-data** di Neon (sesuai keputusan, testing fungsi cukup di lokal).

**Belum dilakukan**: testing endpoint via HTTP (Postman/curl) untuk CRUD soal dan input nilai per soal — verifikasi sejauh ini lewat panggilan langsung ke service. Belum di-commit ke git.
