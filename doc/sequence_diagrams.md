## Diagram Sequence (diperbarui untuk project)

Catatan: semua actor user diganti menjadi **Client**. Database digambarkan sebagai ikon DB (Database (Sequelize)).

Tujuan dokumen ini: menyediakan diagram sequence lengkap untuk alur OBE (Outcome-Based Education) di project.
Diagram menggunakan notation Mermaid `sequenceDiagram`. Setiap diagram menampilkan actor `Client`, layer Express (Router & Middleware), Controller, Service, dan Database (Sequelize).

---

### 1) Upload / Upsert RPS (dokumen + metadata)

```mermaid
sequenceDiagram
    participant Dosen as Dosen
    participant Router as "Express Router & Middleware"
    participant RpsController
    participant RpsService
    participant DB as DB[(Database (Sequelize))]
    participant Storage as FileStorage[(File Storage)]

    Client->>Router: POST /mata-kuliah/:id/detail (multipart/form-data + file PDF)
    Note over Router: Middleware: upload.single('dokumenRps')\nnormalizeFilePath\nauth middleware
    Router->>RpsController: req.body + req.file
    RpsController->>RpsService: upsertDetailRps(mataKuliahId, body, file)

    RpsService->>DB: sequelize.transaction()
    DB-->>RpsService: transaction (t)

    RpsService->>DB: Rps.findOne({ mataKuliahId, periodeId }, { transaction: t })
    DB-->>RpsService: existingRps or null

    alt existingRps found
        RpsService->>Storage: replace file (req.file.path)
        Storage-->>RpsService: fileUrl
        RpsService->>DB: Rps.update(payloadWithFileUrl, { transaction: t })
    else create
        RpsService->>Storage: store file (req.file.path)
        Storage-->>RpsService: fileUrl
        RpsService->>DB: Rps.create(payloadWithFileUrl, { transaction: t })
    end

    RpsService->>DB: commit transaction
    DB-->>RpsService: committed
    RpsService-->>RpsController: { isNewRecord, data }
    RpsController-->>Router: res.json(200/201)
    Router-->>Client: JSON 200/201 (Berhasil disimpan)
```

---

### 2) Ambil/Render RPS (GET)

```mermaid
sequenceDiagram
    participant Viewer as "Dosen / Mahasiswa / Kaprodi"
    participant Router as "Express Router & Middleware"
    participant RpsController
    participant RpsService
    participant DB as DB[(Database (Sequelize))]
    participant Storage as FileStorage[(File Storage)]

    Client->>Router: GET /mata-kuliah/:id/detail
    Router->>RpsController: req.params
    RpsController->>RpsService: getDetailRps(mataKuliahId)
    RpsService->>DB: Rps.findOne({ where: { mataKuliahId } })
    DB-->>RpsService: rpsRecord
    alt record has fileUrl
        RpsService->>Storage: generate signed-url(fileUrl)
        Storage-->>RpsService: signedUrl
        RpsService-->>RpsController: rps + signedUrl
    else no file
        RpsService-->>RpsController: rps
    end
    RpsController-->>Router: res.json(200)
    Router-->>Client: JSON 200 (RPS data + file link)
```

---

### 3) Setup Komposisi Evaluasi & Pemetaan CPMK (RPS → CPMK)

```mermaid
sequenceDiagram
    participant Dosen as Dosen
    participant Router as "Express Router & Middleware"
    participant PemetaanController
    participant PenilaianService
    participant DB as DB[(Database (Sequelize))]

    Client->>Router: POST /mata-kuliah/:id/komposisi (json: komposisi + mappingCpmk)
    Router->>PemetaanController: req.body
    PemetaanController->>PenilaianService: createKomposisiEvaluasi(mataKuliahId, komposisiData)

    PenilaianService->>DB: sequelize.transaction()
    DB-->>PenilaianService: transaction (trx)

    PenilaianService->>DB: KomposisiNilaiMataKuliah.destroy({ where: { siakMataKuliahId }, transaction: trx })
    PenilaianService->>DB: KomposisiNilaiMataKuliah.create(...)  [loop per komponen]
    DB-->>PenilaianService: createdKomposisi
    alt mappingCpmk present
        PenilaianService->>DB: PemetaanKomposisiCpmk.bulkCreate(pemetaan, { transaction: trx })
    end

    PenilaianService->>DB: commit
    DB-->>PenilaianService: committed
    PenilaianService-->>PemetaanController: createdRecords
    PemetaanController-->>Router: res.json(200)
    Router-->>Client: JSON 200 (Komposisi tersimpan)
```

---

### 4) Input Nilai Evaluasi Mahasiswa (single & bulk)

```mermaid
sequenceDiagram
    participant Dosen as Dosen
    participant Router as "Express Router & Middleware"
    participant PenilaianController
    participant PenilaianService
    participant DB as DB[(Database (Sequelize))]

    Note over Client: Dosen mengisi nilai (UI daftar peserta) atau upload bulk
    Client->>Router: POST /kelas/:kelasId/nilai  (body: [ { komposisiId, skor, rincianKrsId } ])
    Router->>PenilaianController: req.body
    PenilaianController->>PenilaianService: inputNilaiMahasiswa(rincianKrsId, arrNilai)

    PenilaianService->>DB: sequelize.transaction()
    DB-->>PenilaianService: trx
    PenilaianService->>DB: NilaiEvaluasiMahasiswa.destroy({ where: { siakRincianKrsMahasiswaId }, transaction: trx })
    PenilaianService->>DB: NilaiEvaluasiMahasiswa.bulkCreate(payload, { transaction: trx })
    PenilaianService->>DB: commit
    DB-->>PenilaianService: committed

    PenilaianService-->>PenilaianController: true
    PenilaianController-->>Router: res.json(200)
    Router-->>Client: JSON 200 (Nilai tersimpan)
```

---

### 5) Hitung Nilai Akhir & Simpan Nilai CPMK (hitungNilaiAkhir)

```mermaid
sequenceDiagram
    participant Trigger as Scheduler/Controller
    participant PenilaianService
    participant DB as DB[(Database (Sequelize))]

    Trigger->>PenilaianService: hitungNilaiAkhir(rincianKrsId)

    PenilaianService->>DB: NilaiEvaluasiMahasiswa.findAll({ where: { siakRincianKrsMahasiswaId }, include: komposisi & cpmk })
    DB-->>PenilaianService: listNilai

    Note right of PenilaianService: 1) Hitung totalSkor berdasar komposisi\n2) Trace prodi & kurikulum untuk skala penilaian\n3) Cocokkan totalSkor ke skala grade
    PenilaianService->>DB: SELECT skala penilaian (siak_skala_penilaian) untuk prodi/kurikulum
    DB-->>PenilaianService: skalaList

    PenilaianService->>DB: RincianKrsMahasiswa.update({ nilaiAkhir, hurufMutu, angkaMutu })
    DB-->>PenilaianService: updated

    Note right of PenilaianService: Build raporCPMK: aggregate skorTerbobot per CPMK
    PenilaianService->>DB: DELETE FROM siak_nilai_cpmk_mahasiswa WHERE kelas & mahasiswa
    PenilaianService->>DB: NilaiCpmkMahasiswa.bulkCreate(payloadCpmk)
    DB-->>PenilaianService: created

    PenilaianService-->>Trigger: { krsId, totalSkor, hurufMutu, angkaMutu }

```

---

### 6) Generate Rapor OBE (frontend request) — `getRaporOBEMahasiswa`

```mermaid
sequenceDiagram
    participant User as "Kaprodi / Dosen / Mahasiswa"
    participant Router as "Express Router & Middleware"
    participant PenilaianController
    participant PenilaianService
    participant DB as DB[(Database (Sequelize))]

    Client->>Router: GET /krs/:rincianKrsId/rapor-obe
    Router->>PenilaianController: params
    PenilaianController->>PenilaianService: getRaporOBEMahasiswa(rincianKrsId)

    PenilaianService->>DB: NilaiEvaluasiMahasiswa.findAll({ where: { siakRincianKrsMahasiswaId }, include: komposisi->cpmk })
    DB-->>PenilaianService: listNilai

    Note right of PenilaianService: Loop per nilai:\n- hitung skorTerbobot = skor * (persentase/100)\n- akumulasi ke map keyed by kodeCPMK\n- totalBobotMaksimal = jumlah(100*bobotPersentase)\n- akhir: persentase = totalSkorTerbobot / totalBobotMaksimal * 100

    PenilaianService-->>PenilaianController: formattedArray (kodeCpmk, deskripsi, nilaiCapaian)
    PenilaianController-->>Router: res.json(200)
    Router-->>Client: JSON 200 (Rapor OBE siap render)
```

---

### 7) Export / Render Rapor (PDF / Excel)

```mermaid
sequenceDiagram
    participant Requester as "Kaprodi / Admin / QA"
    participant Router as "Express Router & Middleware"
    participant ExportController
    participant PenilaianService
    participant Renderer as PDFService[(PDF/Excel Service)]
    participant Storage as FileStorage[(File Storage)]

    Client->>Router: GET /krs/:rincianKrsId/rapor-obe/export?format=pdf
    Router->>ExportController: params
    ExportController->>PenilaianService: getRaporOBEMahasiswa(rincianKrsId)
    PenilaianService-->>ExportController: raporData
    ExportController->>Renderer: renderPDF(raporData)
    Renderer-->>Storage: store(file)
    Storage-->>ExportController: fileUrl / stream
    alt stream
        ExportController-->>Router: res.stream(file)
        Router-->>Client: PDF stream
    else fileUrl
        ExportController-->>Router: res.json({ url: fileUrl })
        Router-->>Client: JSON 200 (download URL)
    end
```

---

### 8) Alur Validasi & Bulk (contoh brevity)

```mermaid
sequenceDiagram
    participant Admin as Admin
    participant Router
    participant ValidationController
    participant ValidationService
    participant DB as DB[(Database (Sequelize))]

    Client->>Router: POST /nilai/bulk/validate (upload CSV/JSON)
    Router->>ValidationController: file
    ValidationController->>ValidationService: parseAndValidate(file)
    ValidationService->>DB: cek referensi (komposisi, mahasiswa, krs)
    DB-->>ValidationService: missingRefs/errors
    alt errors
        ValidationService-->>ValidationController: { errors }
        ValidationController-->>Client: 400 (laporan validasi)
    else ok
        ValidationService-->>ValidationController: parsedPayload
        ValidationController->>PenilaianService: inputNilaiMahasiswa(rincianKrsId, parsedPayload)
        PenilaianService-->>ValidationController: success
        ValidationController-->>Client: 200 (bulk import sukses)
    end
```

---

**Referensi Kode (controller / service / model / route)**

- **Controllers**:
    - [controllers/akademik/penilaian.controller.js](controllers/akademik/penilaian.controller.js) — endpoint untuk setup komposisi RPS, input nilai, dan generate rapor.
    - [controllers/akademik/rps.controller.js](controllers/akademik/rps.controller.js) — get/save detail RPS, rencana pembelajaran, rencana evaluasi.
    - [controllers/akademik/obe.controller.js](controllers/akademik/obe.controller.js) — CPL/CPMK/Profil Lulusan dan pemetaan.
    - [controllers/akademik/export.controller.js](controllers/akademik/export.controller.js) — export PDF/Excel untuk laporan OBE dan matriks.

- **Services**:
    - [services/penilaian.service.js](services/penilaian.service.js) — `createKomposisiEvaluasi`, `inputNilaiMahasiswa`, `hitungNilaiAkhir`, `getRaporOBEMahasiswa`, `getPesertaKelasList`.
    - [services/rps.service.js](services/rps.service.js) — `upsertDetailRps`, `getFormDetailRps`, `getRencanaPembelajaran`, `saveRencanaEvaluasi`.
    - [services/obe.service.js](services/obe.service.js) — pengelolaan CPL/CPMK/profil lulusan dan helper untuk export.

- **Models (utama yang digunakan)**:
    - [models/rps.models.js](models/rps.models.js)
    - [models/komposisi-nilai-mata-kuliah.models.js](models/komposisi-nilai-mata-kuliah.models.js)
    - [models/pemetaan-komposisi-cpmk.models.js](models/pemetaan-komposisi-cpmk.models.js)
    - [models/nilai_evaluasi_mahasiswa.models.js](models/nilai_evaluasi_mahasiswa.models.js)
    - [models/nilai-cpmk-mahasiswa.models.js](models/nilai-cpmk-mahasiswa.models.js)
    - [models/rincian-krs-mahasiswa.models.js](models/rincian-krs-mahasiswa.models.js)
    - [models/krs-mahasiswa.models.js](models/krs-mahasiswa.models.js)
    - [models/skala-penilaian.models.js](models/skala-penilaian.models.js)
    - [models/capaian-mata-kuliah.models.js](models/capaian-mata-kuliah.models.js)
    - [models/index.js](models/index.js)

- **Routes**:
    - [routes/penilaian.routes.js](routes/penilaian.routes.js) — route mapping untuk setup/input/rapor.
    - [routes/akademik/rps.router.js](routes/akademik/rps.router.js) — routes RPS (detail, rencana, evaluasi).

Tautan di atas merujuk ke file di workspace; buka file yang relevan untuk melihat implementasi fungsi yang dipakai di diagram.

Jika Anda mau, saya bisa:
- Mengekspor tiap diagram ke PNG/SVG dan menaruhnya di `doc/uml/`.
- Memecah diagram menjadi gambar terpisah untuk presentasi.
- Menambahkan cross-reference langsung ke fungsi/line spesifik (beritahu file yang ingin ditautkan ke baris tertentu).

File ini: [doc/sequence_diagrams.md](doc/sequence_diagrams.md)

---

### Upload RPS (flow utama)

```mermaid
sequenceDiagram
    participant Dosen as Dosen
    participant Router as "Express Router & Middleware"
    participant RpsController
    participant RpsService
    participant DB as DB[(Database (Sequelize))]

    Client->>Router: POST /mata-kuliah/:id/detail (multipart/form-data + file PDF)
    Note over Router: Middleware: upload.single('dokumenRps')\nnormalizeFilePath
    Router->>RpsController: req.body + req.file
    RpsController->>RpsService: upsertDetailRps(mataKuliahId, body, file)

    RpsService->>DB: sequelize.transaction()
    DB-->>RpsService: transaction (t)

    RpsService->>DB: Rps.findOne({ mataKuliahId, periodeId }, { transaction: t })
    DB-->>RpsService: existingRps (record or null)

    alt existingRps found
        RpsService->>DB: Rps.update(payload, { transaction: t })
    else no existingRps
        RpsService->>DB: Rps.create(payload, { transaction: t })
    end

    RpsService->>DB: commit transaction
    DB-->>RpsService: committed

    RpsService-->>RpsController: { isNewRecord, data }
    RpsController-->>Router: res.json(200/201)
    Router-->>Client: JSON 200/201 (Berhasil disimpan)
```

---

### Rapor OBE (get Rapor untuk mahasiswa)

```mermaid
sequenceDiagram
    participant User as "Dosen / Kaprodi / Mahasiswa"
    participant PenilaianController
    participant PenilaianService
    participant DB as DB[(Database (Sequelize))]

    Client->>PenilaianController: GET /krs/:krsId/rapor-obe
    PenilaianController->>PenilaianService: getRaporOBEMahasiswa(krsId)

    PenilaianService->>DB: NilaiEvaluasiMahasiswa.findAll({ where: { krsId } })
    DB-->>PenilaianService: [nilaiEvaluasiMahasiswa]

    loop per mata kuliah / per CPMK
        PenilaianService->>PenilaianService: hitung skor terbobot (skorAsli * bobotPersentase)
        PenilaianService->>PenilaianService: kelompokkan & agregasi berdasarkan kode CPMK
    end

    PenilaianService->>PenilaianService: format ulang objek menjadi Array JSON (komposisi nilai mata kuliah)
    PenilaianService-->>PenilaianController: array hasil format (Rapor OBE)
    PenilaianController-->>Client: JSON 200 OK (Data siap render)
```

---

Jika Anda mau, saya bisa juga:
- Mengekspor diagram ke PNG/SVG untuk dimasukkan ke dokumentasi
- Memecah diagram menjadi beberapa file gambar untuk presentasi
- Menambahkan referensi file/controller aktual dari project

File ini: [doc/sequence_diagrams.md](doc/sequence_diagrams.md)
