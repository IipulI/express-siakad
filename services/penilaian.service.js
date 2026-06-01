import models from "../models/index.js";
import { Op } from 'sequelize';

const {
    sequelize, KomposisiNilaiMataKuliah, PemetaanEvaluasiCpmk, PemetaanKomposisiCpmk,
    NilaiEvaluasiMahasiswa, RincianKrsMahasiswa, KrsMahasiswa, Mahasiswa, KelasKuliah, MataKuliah, SkalaPenilaian,
    MasterMetodeEvaluasi, MasterKomponenEvaluasi,
    ProgramStudi, PeriodeAkademik, Dosen, DosenKelas, JadwalKuliah, Jenjang,
    NilaiCpmkMahasiswa, CapaianMataKuliah
} = models;

const DEFAULT_SKALA = [
    { hurufMutu: 'A', angkaMutu: 4.00, nilaiMin: 81.00, nilaiMax: 100.00 },
    { hurufMutu: 'AB', angkaMutu: 3.50, nilaiMin: 76.00, nilaiMax: 80.00 },
    { hurufMutu: 'B', angkaMutu: 3.00, nilaiMin: 71.00, nilaiMax: 75.00 },
    { hurufMutu: 'BC', angkaMutu: 2.50, nilaiMin: 66.00, nilaiMax: 70.00 },
    { hurufMutu: 'C', angkaMutu: 2.00, nilaiMin: 61.00, nilaiMax: 65.00 },
    { hurufMutu: 'CD', angkaMutu: 1.50, nilaiMin: 41.00, nilaiMax: 60.00 },
    { hurufMutu: 'D', angkaMutu: 1.00, nilaiMin: 1.00, nilaiMax: 40.00 },
    { hurufMutu: 'E', angkaMutu: 0.00, nilaiMin: 0.00, nilaiMax: 0.00 },
];

const getGrade = (nilai, skala) => {
    const sorted = [...skala].sort((a, b) => b.nilaiMin - a.nilaiMin);
    for (const s of sorted) {
        if (nilai >= s.nilaiMin) {
            return { hurufMutu: s.hurufMutu, angkaMutu: s.angkaMutu };
        }
    }
    return { hurufMutu: 'E', angkaMutu: 0 };
};

// 1. SETUP RPS: Dosen mensetup komponen evaluasi (Teori/Praktikum/Proyek) beserta relasi CPMK
export const createKomposisiEvaluasi = async (mataKuliahId, komposisiData) => {
    try {
        let createdRecords = [];
        await sequelize.transaction(async (trx) => {
            // Bersihkan data lama jika dosen melakukan update skema
            await KomposisiNilaiMataKuliah.destroy({ where: { siakMataKuliahId: mataKuliahId }, transaction: trx });

            for (const item of komposisiData) {
                const komposisi = await KomposisiNilaiMataKuliah.create({
                    siakMataKuliahId: mataKuliahId,
                    namaKomponen: item.tipe || item.namaKomponen,
                    persentase: item.persentase,
                    key: item.key
                }, { transaction: trx });

                createdRecords.push({
                    id: komposisi.id,
                    key: komposisi.key,
                    persentase: komposisi.persentase
                });

                // Mapping ke CPMK menggunakan pivot yang benar (bersih tanpa try-catch bersarang)
                if (item.mappingCpmk && Array.isArray(item.mappingCpmk) && item.mappingCpmk.length > 0) {
                    const pemetaan = item.mappingCpmk.map(cpmkData => ({
                        siakKomposisiNilaiId: komposisi.id,
                        siakCpmkId: cpmkData.siakCapaianMataKuliahId, // Kembali pakai ini
                        bobot: cpmkData.bobot // 🟢 FIX UTAMA: Tambahan bobot agar tidak kosong
                    }));

                    await PemetaanKomposisiCpmk.bulkCreate(pemetaan, { transaction: trx });
                }
            }
        });
        return createdRecords;
    } catch (error) {
        throw new Error("Gagal menyimpan struktur evaluasi RPS: " + error.message);
    }
}

// GET SETUP EVALUASI (Untuk menampilkan data di Halaman 8 PDF)
export const getKomposisiEvaluasi = async (mataKuliahId) => {
    try {
        const { KomposisiNilaiMataKuliah, CapaianMataKuliah } = models;

        const data = await KomposisiNilaiMataKuliah.findAll({
            where: { siakMataKuliahId: mataKuliahId },
            attributes: ['id', 'persentase', 'key'],
            include: [{
                model: models.CapaianMataKuliah,
                as: 'cpmkList',
                attributes: ['id', 'kode'],
                through: { attributes: [] } // Wajib ada agar tabel pemetaan ikut terbaca
            }],
            order: [['createdAt', 'ASC']]
        });

        return data;
    } catch (error) {
        throw new Error("Gagal mengambil struktur evaluasi RPS: " + error.message);
    }
}

// 2. INPUT NILAI DINAMIS: Menyimpan skor mahasiswa dalam bentuk Array
export const inputNilaiMahasiswa = async (krsId, arrNilai) => {
    const rincian = await RincianKrsMahasiswa.findByPk(krsId, { attributes: ['id', 'status'] });
    if (!rincian) {
        const err = new Error('Data rincian KRS tidak ditemukan');
        err.statusCode = 404;
        throw err;
    }
    if (rincian.status === 'Dikunci') {
        const err = new Error('Nilai sudah dikunci, tidak dapat diedit');
        err.statusCode = 403;
        throw err;
    }
    if (rincian.status === 'Lulus' || rincian.status === 'Tidak Lulus') {
        const err = new Error('Nilai sudah difinalisasi dan bersifat permanen, tidak dapat diubah');
        err.statusCode = 403;
        throw err;
    }
    try {
        await sequelize.transaction(async (trx) => {
            // Hapus nilai lama dengan FORCE: TRUE agar terhapus permanen (hard-delete),
            // sehingga tidak bentrok dengan data baru saat di-insert.
            await NilaiEvaluasiMahasiswa.destroy({
                where: {
                    [Op.or]: [
                        { siakRincianKrsMahasiswaId: krsId },
                        { siak_rincian_krs_mahasiswa_id: krsId }
                    ]
                },
                force: true, // 🔴 INI KUNCI PERBAIKANNYA
                transaction: trx
            });

            // Mapping payload (menggunakan format camelCase & snake_case sekaligus
            // untuk menghindari error nama kolom tidak ditemukan)
            const payload = arrNilai.map(item => ({
                siakRincianKrsMahasiswaId: krsId,
                siak_rincian_krs_mahasiswa_id: krsId,
                siakKomposisiNilaiId: item.komposisiId,
                siak_komposisi_nilai_id: item.komposisiId,
                skor: item.skor
            }));

            await NilaiEvaluasiMahasiswa.bulkCreate(payload, { transaction: trx });
        });
        return true;
    } catch (error) {
        // Baris ini akan mengeluarkan nama kolom/pesan error yang jauh lebih detail jika gagal lagi
        const detailError = error.errors ? error.errors.map(e => e.message).join(', ') : error.message;
        throw new Error("Gagal menyimpan nilai evaluasi: " + detailError);
    }
}

// 3. KALKULATOR HASIL AKHIR OBE (VERSI DINAMIS SKALA NILAI)
export const hitungNilaiAkhir = async (krsId) => {
    try {
        const { sequelize } = models;
        return await sequelize.transaction(async (trx) => {
            // 1. Ambil nilai evaluasi mahasiswa (tanpa include CPMK dulu — pakai raw SQL)
            const listNilai = await models.NilaiEvaluasiMahasiswa.findAll({
                where: { siakRincianKrsMahasiswaId: krsId },
                include: [{
                    model: models.KomposisiNilaiMataKuliah,
                    as: 'komposisiNilai',
                    attributes: ['id', 'persentase', 'key']
                }],
                transaction: trx
            });

            // 2. Hitung total skor nilai akhir
            let totalSkor = 0;
            listNilai.forEach(item => {
                if (item.komposisiNilai) {
                    const skor = parseFloat(item.skor);
                    const bobot = parseFloat(item.komposisiNilai.persentase) / 100;
                    totalSkor += (skor * bobot);
                }
            });
            totalSkor = Math.round(totalSkor * 100) / 100;

            // ====================================================================
            // 3. LACAK PRODI & KURIKULUM LALU TARIK SKALA NILAI DINAMIS
            // ====================================================================
            let hurufMutu = 'E';
            let angkaMutu = 0.0;

            const queryTrace = `
                SELECT mk.siak_program_studi_id AS prodi_id,
                       mk.siak_tahun_kurikulum_id AS kurikulum_id,
                       kk.siak_mata_kuliah_id AS mk_id
                FROM siak_rincian_krs_mahasiswa rkm
                LEFT JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id
                LEFT JOIN siak_mata_kuliah mk ON kk.siak_mata_kuliah_id = mk.id
                WHERE rkm.id = :krsId LIMIT 1
            `;
            const traceResult = await sequelize.query(queryTrace, { replacements: { krsId }, type: sequelize.QueryTypes.SELECT, transaction: trx });

            if (traceResult && traceResult.length > 0) {
                const { prodi_id, kurikulum_id, mk_id } = traceResult[0];

                const querySkala = `
                    SELECT huruf_mutu AS grade, angka_mutu AS bobot, nilai_min
                    FROM siak_skala_penilaian
                    WHERE siak_program_studi_id = :prodi_id 
                      AND siak_tahun_kurikulum_id = :kurikulum_id
                      AND deleted_at IS NULL
                    ORDER BY nilai_min DESC
                `;
                const skalaList = await sequelize.query(querySkala, { replacements: { prodi_id, kurikulum_id }, type: sequelize.QueryTypes.SELECT, transaction: trx });

                if (skalaList.length > 0) {
                    for (const skala of skalaList) {
                        if (totalSkor >= parseFloat(skala.nilai_min)) {
                            hurufMutu = String(skala.grade).trim();
                            angkaMutu = parseFloat(skala.bobot);
                            break;
                        }
                    }
                } else {
                    if (totalSkor >= 81.00) { hurufMutu = 'A'; angkaMutu = 4.0; }
                    else if (totalSkor >= 76.00) { hurufMutu = 'AB'; angkaMutu = 3.5; }
                    else if (totalSkor >= 71.00) { hurufMutu = 'B'; angkaMutu = 3.0; }
                    else if (totalSkor >= 66.00) { hurufMutu = 'BC'; angkaMutu = 2.5; }
                    else if (totalSkor >= 61.00) { hurufMutu = 'C'; angkaMutu = 2.0; }
                    else if (totalSkor >= 41.00) { hurufMutu = 'CD'; angkaMutu = 1.5; }
                    else if (totalSkor >= 1.00) { hurufMutu = 'D'; angkaMutu = 1.0; }
                }
            }

            // ====================================================================
            // 3.5 CEK SYARAT LULUS PER KOMPONEN EVALUASI
            // Jika ada komponen yang ditandai MENJADI_SYARAT_LULUS dan nilainya
            // di bawah 60, paksa grade menjadi E meskipun nilai akhir tinggi
            // ====================================================================
            if (traceResult && traceResult.length > 0) {
                const { mk_id } = traceResult[0];

                const syaratRows = await sequelize.query(`
                    SELECT re.metode_evaluasi, re.syarat_lulus
                    FROM siak_rencana_evaluasi re
                    WHERE re.siak_mata_kuliah_id = :mkId
                      AND re.syarat_lulus = 'MENJADI_SYARAT_LULUS'
                      AND re.deleted_at IS NULL
                `, { replacements: { mkId: mk_id }, type: sequelize.QueryTypes.SELECT, transaction: trx });

                if (syaratRows.length > 0) {
                    // Bangun map: key komposisi → skor mahasiswa
                    const nilaiMap = {};
                    listNilai.forEach(n => {
                        const komp = n.komposisiNilai;
                        if (komp?.key) nilaiMap[komp.key.toLowerCase()] = parseFloat(n.skor || 0);
                    });

                    for (const syarat of syaratRows) {
                        // Cocokkan metode_evaluasi (e.g. "UTS") dengan key komposisi (e.g. "uts")
                        const metode = (syarat.metode_evaluasi || '').toLowerCase();
                        // Cari key yang cocok: exact match atau key ada di dalam metode
                        const matchedKey = Object.keys(nilaiMap).find(
                            k => k === metode || metode.includes(k) || k.includes(metode.split(' ')[0])
                        );

                        if (matchedKey !== undefined) {
                            const nilaiKomponen = nilaiMap[matchedKey];
                            if (nilaiKomponen < 60) {
                                hurufMutu = 'E';
                                angkaMutu = 0.0;
                                break;
                            }
                        }
                    }
                }
            }

            // ====================================================================
            // 4. UPDATE NILAI AKHIR KRS
            // ====================================================================
            await sequelize.query(
                `UPDATE siak_rincian_krs_mahasiswa
                 SET nilai_akhir = :nilaiAkhir, huruf_mutu = :hurufMutu, angka_mutu = :angkaMutu
                 WHERE id = :krsId`,
                { replacements: { nilaiAkhir: totalSkor, hurufMutu, angkaMutu, krsId }, transaction: trx }
            );

            // ====================================================================
            // 5. SIMPAN KE TABEL MATERIALIZED (NILAI CPMK) MENGGUNAKAN RAW SQL
            // ====================================================================
            const rincianKrs = await models.RincianKrsMahasiswa.findByPk(krsId, {
                include: [{ model: models.KrsMahasiswa, as: 'krsMahasiswa' }],
                transaction: trx
            });

            if (rincianKrs && rincianKrs.krsMahasiswa) {
                const kelasId = rincianKrs.siakKelasKuliahId;
                const mhsId = rincianKrs.krsMahasiswa.siakMahasiswaId;

                if (kelasId && mhsId) {
                    // Hapus nilai CPMK lama untuk mahasiswa ini di kelas ini
                    await sequelize.query(
                        `DELETE FROM siak_nilai_cpmk_mahasiswa
                          WHERE siak_kelas_kuliah_id = :kelasId
                            AND siak_mahasiswa_id   = :mhsId`,
                        { replacements: { kelasId, mhsId }, transaction: trx }
                    );

                    // 🔴 FIX FINAL: Pastikan ID ditangkap dengan aman baik saat camelCase maupun snake_case
                    const komposisiIds = listNilai
                        .map(n => n.siak_komposisi_nilai_id || n.siakKomposisiNilaiId)
                        .filter(Boolean);

                    if (komposisiIds.length > 0) {
                        const pemetaanRows = await sequelize.query(
                            `SELECT pkc.siak_komposisi_nilai_id AS komposisi_id,
                                    pkc.siak_cpmk_id            AS cpmk_id
                             FROM siak_pemetaan_komposisi_cpmk pkc
                             WHERE pkc.siak_komposisi_nilai_id IN (:komposisiIds)
                               AND pkc.deleted_at IS NULL`,
                            {
                                replacements: { komposisiIds },
                                type: sequelize.QueryTypes.SELECT,
                                transaction: trx
                            }
                        );

                        console.log(`\n====== DEBUG NILAI CPMK (krsId=${krsId}) ======`);
                        console.log('Komposisi IDs:', komposisiIds);
                        console.log('Pemetaan Komposisi->CPMK ditemukan:', pemetaanRows.length);

                        // Build map komposisiId -> [cpmkId]
                        const pemetaanMap = {};
                        pemetaanRows.forEach(row => {
                            if (!pemetaanMap[row.komposisi_id]) pemetaanMap[row.komposisi_id] = [];
                            pemetaanMap[row.komposisi_id].push(row.cpmk_id);
                        });

                        const raporCPMK = {}; // { cpmkId: { skorTerbobot, totalBobot } }

                        listNilai.forEach(nilai => {
                            if (!nilai.komposisiNilai) return;

                            // 🔴 FIX FINAL: Sinkronisasi pemanggilan ID Komponen
                            const komposisiId = nilai.siak_komposisi_nilai_id || nilai.siakKomposisiNilaiId;
                            const skor = parseFloat(nilai.skor || 0);
                            const bobotPersen = parseFloat(nilai.komposisiNilai.persentase || 0);
                            const cpmkIds = pemetaanMap[komposisiId] || [];

                            cpmkIds.forEach(cpmkId => {
                                if (!raporCPMK[cpmkId]) raporCPMK[cpmkId] = { skorTerbobot: 0, totalBobot: 0 };
                                raporCPMK[cpmkId].skorTerbobot += skor * (bobotPersen / 100);
                                raporCPMK[cpmkId].totalBobot += bobotPersen;
                            });
                        });

                        console.log('Rapor CPMK (sebelum normalisasi):', raporCPMK);
                        console.log('================================================\n');

                        const payloadCpmk = Object.entries(raporCPMK).map(([cpmkId, item]) => {
                            // Normalisasi: bagi dengan total bobot agar skala tetap 0-100
                            const nilaiCpmk = item.totalBobot > 0
                                ? Math.round((item.skorTerbobot / (item.totalBobot / 100)) * 100) / 100
                                : 0;
                            return {
                                siakKelasKuliahId: kelasId,
                                siakMahasiswaId: mhsId,
                                siakCapaianMataKuliahId: cpmkId,
                                nilai: nilaiCpmk
                            };
                        });

                        if (payloadCpmk.length > 0) {
                            await models.NilaiCpmkMahasiswa.bulkCreate(payloadCpmk, { transaction: trx });
                            console.log(`✅ Berhasil simpan ${payloadCpmk.length} nilai CPMK ke DB.`);
                        } else {
                            console.warn('⚠️  Tidak ada CPMK yang dipetakan ke komponen evaluasi. Cek setup-evaluasi!');
                        }
                    }
                }
            }

            return { krsId, totalSkor, hurufMutu, angkaMutu };
        });
    } catch (error) {
        throw new Error("Gagal kalkulasi nilai: " + error.message);
    }
}

// 4. GENERATOR RAPOR OBE MAHASISWA
export const getRaporOBEMahasiswa = async (rincianKrsId) => {
    try {
        const ModelNilai = models.NilaiEvaluasiMahasiswa || models.siak_nilai_evaluasi_mahasiswa;
        const ModelKomposisi = models.KomposisiNilaiMataKuliah || models.siak_komposisi_nilai_mata_kuliah;
        const ModelCPMK = models.CapaianMataKuliah || models.siak_capaian_mata_kuliah;

        const listNilai = await ModelNilai.findAll({
            where: { siakRincianKrsMahasiswaId: rincianKrsId },
            include: [{
                model: ModelKomposisi,
                as: 'komposisiNilai',
                include: [{
                    model: ModelCPMK,
                    as: 'cpmkList', // Pastikan alias ini masih sama
                    attributes: ['id', 'kode', 'deskripsi'] // Ambil kode dan deskripsi CPMK
                }]
            }]
        });

        let raporCPMK = {};

        listNilai.forEach(nilai => {
            if (nilai.komposisiNilai) {
                const skorAsli = parseFloat(nilai.skor);
                const bobotPersentase = parseFloat(nilai.komposisiNilai.persentase) / 100;
                const skorTerbobot = skorAsli * bobotPersentase;

                if (nilai.komposisiNilai.cpmkList) {
                    nilai.komposisiNilai.cpmkList.forEach(cpmk => {
                        // Gunakan KODE CPMK agar jelas dibaca oleh Frontend
                        const kodeCpmk = cpmk.kode || cpmk.id;

                        if (kodeCpmk) {
                            if (!raporCPMK[kodeCpmk]) {
                                raporCPMK[kodeCpmk] = {
                                    kode: kodeCpmk,
                                    deskripsi: cpmk.deskripsi || '-',
                                    totalSkorTerbobot: 0,
                                    totalBobotMaksimal: 0
                                };
                            }
                            raporCPMK[kodeCpmk].totalSkorTerbobot += skorTerbobot;
                            raporCPMK[kodeCpmk].totalBobotMaksimal += (100 * bobotPersentase);
                        }
                    });
                }
            }
        });

        // Format hasil akhir menjadi array dengan persentase 0-100%
        return Object.keys(raporCPMK).map(kode => {
            const item = raporCPMK[kode];
            // Hitung persentase akhir capaian kompetensi
            const persentase = item.totalBobotMaksimal > 0
                ? (item.totalSkorTerbobot / item.totalBobotMaksimal) * 100
                : 0;

            return {
                kodeCpmk: item.kode,
                deskripsi: item.deskripsi,
                nilaiCapaian: parseFloat(persentase.toFixed(2)) // Dibulatkan 2 angka desimal
            };
        });

    } catch (error) {
        throw new Error("Gagal menggenerate rapor OBE: " + error.message);
    }
}


export const getDropdownMasterEvaluasi = async () => {
    try {
        // Ambil data secara paralel
        const [metodeList, komponenList] = await Promise.all([
            MasterMetodeEvaluasi.findAll({
                attributes: ['id', 'namaMetode'],
                order: [['nama_metode', 'ASC']]
            }),
            MasterKomponenEvaluasi.findAll({
                attributes: ['id', 'namaKomponen'],
                order: [['nama_komponen', 'ASC']]
            })
        ]);

        // Kembalikan dalam format object yang mudah dikonsumsi frontend
        return {
            metodeEvaluasi: metodeList,
            komponenEvaluasi: komponenList
        };
    } catch (error) {
        throw new Error("Gagal mengambil data master evaluasi: " + error.message);
    }
}

export const getTemplateEvaluasiList = async (page = 1, limit = 10, search = '') => {
    const MKModel = models.MataKuliah || models.siak_mata_kuliah;
    const KomposisiModel = models.KomposisiNilaiMataKuliah || models.siak_komposisi_nilai_mata_kuliah;

    if (!MKModel) {
        throw new Error("Model Mata Kuliah tidak ditemukan di Sequelize!");
    }

    try {
        const offset = (page - 1) * limit;
        const whereCondition = search ? {
            nama: { [Op.iLike]: `%${search}%` }
        } : {};

        const { count, rows } = await MKModel.findAndCountAll({
            where: whereCondition,
            include: [{
                model: KomposisiModel,
                as: 'komposisiNilai',
                attributes: ['id', 'persentase', 'key'],
                required: false
            }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['nama', 'ASC']]
        });

        return {
            totalData: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            data: rows
        };
    } catch (error) {
        console.error("DEBUG ERROR:", error);
        throw new Error("Gagal mengambil daftar template evaluasi: " + error.message);
    }
}

export const getPesertaKelasList = async (kelasId) => {
    try {
        // 1. Ambil kelas -> MK -> prodiId & kurikulumId
        const kelas = await KelasKuliah.findByPk(kelasId, {
            include: [{
                model: MataKuliah,
                as: 'mataKuliah',
                attributes: ['id', 'siakProgramStudiId', 'siakTahunKurikulumId']
            }]
        });
        if (!kelas) throw new Error('Kelas tidak ditemukan');

        const mkId = kelas.siakMataKuliahId;
        const prodiId = kelas.mataKuliah?.siakProgramStudiId;
        const kurikulumId = kelas.mataKuliah?.siakTahunKurikulumId;

        // 2. Ambil komposisi nilai MK
        const komposisiList = await KomposisiNilaiMataKuliah.findAll({
            where: { siakMataKuliahId: mkId },
            attributes: ['id', 'persentase', 'key'],
            order: [['createdAt', 'ASC']]
        });

        // Map by ID, tampilkan key sebagai uppercase label
        const komposisiMap = {};
        komposisiList.forEach(k => {
            komposisiMap[k.id] = {
                id: k.id,
                label: (k.key || '-').toUpperCase(),
                persentase: parseFloat(k.persentase || 0)
            };
        });

        // 3. Ambil skala nilai dari DB, fallback ke DEFAULT jika kosong
        let skalaAktif = DEFAULT_SKALA;
        if (prodiId && kurikulumId) {
            const rawSkala = await SkalaPenilaian.findAll({
                where: {
                    siak_program_studi_id: prodiId,
                    siak_tahun_kurikulum_id: kurikulumId,
                    deleted_at: null
                },
                attributes: ['huruf_mutu', 'angka_mutu', 'nilai_min', 'nilai_max'],
                order: [['nilai_min', 'DESC']]
            });

            if (rawSkala.length > 0) {
                skalaAktif = rawSkala.map(s => ({
                    hurufMutu: s.huruf_mutu,
                    angkaMutu: parseFloat(s.angka_mutu || 0),
                    nilaiMin: parseFloat(s.nilai_min || 0),
                    nilaiMax: parseFloat(s.nilai_max || 0),
                }));
            }
        }

        // 4. Ambil semua rincian KRS di kelas
        const allRincian = await RincianKrsMahasiswa.findAll({
            where: { siak_kelas_kuliah_id: kelasId },
            attributes: ['id', 'nilai_akhir', 'huruf_mutu', 'angka_mutu', 'status'],
            include: [
                {
                    model: KrsMahasiswa,
                    as: 'krsMahasiswa',
                    attributes: ['id'],
                    include: [{
                        model: Mahasiswa,
                        as: 'mahasiswa',
                        attributes: ['id', 'nama', 'npm', 'angkatan']
                    }]
                },
                {
                    model: NilaiEvaluasiMahasiswa,
                    as: 'daftarNilaiEvaluasi',
                    attributes: ['id', 'siak_komposisi_nilai_id', 'skor'],
                    required: false
                }
            ]
        });

        // 5. Deduplicate per mahasiswaId
        const komposisiIds = new Set(Object.keys(komposisiMap));
        const mahasiswaMap = {};
        allRincian.forEach(item => {
            const mhsId = item.krsMahasiswa?.mahasiswa?.id;
            if (!mhsId) return;

            // Cek apakah detailNilai item ini cocok dengan komposisi kelas ini
            const nilaiYangCocok = (item.daftarNilaiEvaluasi || []).filter(
                n => komposisiIds.has(n.siak_komposisi_nilai_id)
            );
            const punyaNilaiCocok = nilaiYangCocok.length > 0;

            const existing = mahasiswaMap[mhsId];
            const existingCocok = existing
                ? (existing.daftarNilaiEvaluasi || []).filter(
                    n => komposisiIds.has(n.siak_komposisi_nilai_id)
                ).length > 0
                : false;

            if (!existing || (punyaNilaiCocok && !existingCocok)) {
                mahasiswaMap[mhsId] = item;
            }
        });

        const pesertaUnik = Object.values(mahasiswaMap).sort((a, b) =>
            (a.krsMahasiswa?.mahasiswa?.npm || '')
                .localeCompare(b.krsMahasiswa?.mahasiswa?.npm || '')
        );

        // 6. Build tabel
        let no = 1;
        const tabel = pesertaUnik.map(item => {
            const mhs = item.krsMahasiswa?.mahasiswa;
            const nilaiList = item.daftarNilaiEvaluasi || [];

            // Nilai per komponen + hitung nilai akhir
            const nilaiPerKomponen = {};
            let nilaiAkhirHitung = 0;
            let adaNilai = false;

            nilaiList.forEach(n => {
                const komp = komposisiMap[n.siak_komposisi_nilai_id];
                if (komp) {
                    const skor = parseFloat(n.skor || 0);
                    nilaiPerKomponen[komp.label] = skor;
                    nilaiAkhirHitung += skor * (komp.persentase / 100);
                    adaNilai = true;
                }
            });

            // Komponen belum diinput -> null (tampil kosong)
            komposisiList.forEach(k => {
                const label = (k.key || '-').toUpperCase();
                if (!(label in nilaiPerKomponen)) nilaiPerKomponen[label] = null;
            });

            nilaiAkhirHitung = Math.round(nilaiAkhirHitung * 100) / 100;

            // Nilai akhir final
            const nilaiAkhirDB = parseFloat(item.nilai_akhir || 0);
            const nilaiAkhirFinal = nilaiAkhirDB > 0
                ? nilaiAkhirDB
                : (adaNilai ? nilaiAkhirHitung : 0);

            // Grade dari skala nilai (DB atau default)
            // Sequelize underscored:true → field dikembalikan sebagai camelCase
            const storedGrade = item.hurufMutu || item.huruf_mutu;
            const storedAngka = item.angkaMutu ?? item.angka_mutu;
            let grade;
            if (storedGrade && storedGrade !== '-') {
                grade = {
                    hurufMutu: storedGrade,
                    angkaMutu: parseFloat(storedAngka || 0)
                };
            } else if (adaNilai && nilaiAkhirFinal > 0) {
                grade = getGrade(nilaiAkhirFinal, skalaAktif);
            } else {
                grade = { hurufMutu: '-', angkaMutu: 0 };
            }

            return {
                no: no++,
                rincianKrsId: item.id,
                mahasiswaId: mhs?.id,
                nim: mhs?.npm || '-',
                nama: mhs?.nama || '-',
                angkatan: mhs?.angkatan || '-',
                hadir: null,
                nilaiPerKomponen,
                nilaiAkhir: nilaiAkhirFinal,
                grade: grade.hurufMutu,
                angkaMutu: grade.angkaMutu,
                lulus: item.status === 'Lulus',
                keterangan: item.status === 'Dikunci'
                    ? 'Nilai KRS sudah dikunci' : ''
            };
        });

        // Header kolom untuk frontend (dinamis sesuai komposisi)
        const headerKolom = komposisiList.map(k => ({
            id: k.id,
            label: (k.key || '-').toUpperCase(),
            bobot: parseFloat(k.persentase || 0),
            labelKolom: `${(k.key || '-').toUpperCase()} (${parseFloat(k.persentase || 0).toFixed(2)}%)`
        }));

        return {
            skalaDipakai: skalaAktif === DEFAULT_SKALA ? 'default' : 'database',
            headerKolom,
            tabel
        };

    } catch (error) {
        throw new Error("Gagal mengambil daftar peserta kelas: " + error.message);
    }
};

// ─────────────────────────────────────────────
// KUNCI / BUKA KUNCI NILAI
// ─────────────────────────────────────────────

const STATUS_FINAL = ['Lulus', 'Tidak Lulus'];

export const kunciNilaiKelas = async (kelasId, action = 'kunci') => {
    if (action === 'buka') {
        const adaFinal = await RincianKrsMahasiswa.count({
            where: { siak_kelas_kuliah_id: kelasId, status: STATUS_FINAL }
        });
        if (adaFinal > 0) {
            throw new Error(`${adaFinal} mahasiswa sudah difinalisasi dan tidak dapat dibuka kembali`);
        }
    }

    const newStatus = action === 'kunci' ? 'Dikunci' : null;
    const [jumlahDiupdate] = await RincianKrsMahasiswa.update(
        { status: newStatus },
        { where: { siak_kelas_kuliah_id: kelasId, status: { [Op.notIn]: STATUS_FINAL } } }
    );
    return { kelasId, jumlahDiupdate, status: newStatus ?? 'Aktif' };
};

export const kunciNilaiSatuMahasiswa = async (rincianKrsId, action = 'kunci') => {
    const rincian = await RincianKrsMahasiswa.findByPk(rincianKrsId);
    if (!rincian) throw new Error('Data rincian KRS tidak ditemukan');

    if (STATUS_FINAL.includes(rincian.status) && action === 'buka') {
        throw new Error('Nilai sudah difinalisasi dan bersifat permanen, tidak dapat dibuka kembali');
    }

    const newStatus = action === 'kunci' ? 'Dikunci' : null;
    await rincian.update({ status: newStatus });
    return { rincianKrsId, status: newStatus ?? 'Aktif' };
};

// ====================================================================
// FINALISASI NILAI KELAS (Permanent Lock setelah masa sanggah habis)
// Koordinator MK mengeksekusi ini setelah masa sanggah berakhir.
// Status berubah dari 'Dikunci' → 'Lulus' / 'Tidak Lulus' (permanen)
// ====================================================================
const GRADE_LULUS = ['A', 'AB', 'B', 'BC', 'C'];

export const finalisasiNilaiKelas = async (kelasId) => {
    const rincianList = await RincianKrsMahasiswa.findAll({
        where: { siak_kelas_kuliah_id: kelasId },
        attributes: ['id', 'status', 'huruf_mutu', 'hurufMutu']
    });

    if (rincianList.length === 0) throw new Error('Tidak ada mahasiswa di kelas ini');

    const belumDikunci = rincianList.filter(r => r.status !== 'Dikunci' && !STATUS_FINAL.includes(r.status));
    if (belumDikunci.length > 0) {
        throw new Error(`${belumDikunci.length} mahasiswa belum dikunci nilainya. Kunci semua nilai terlebih dahulu sebelum finalisasi.`);
    }

    const yangBisaFinal = rincianList.filter(r => !STATUS_FINAL.includes(r.status));

    let jumlahLulus = 0;
    let jumlahTidakLulus = 0;

    for (const r of yangBisaFinal) {
        const grade = r.hurufMutu || r.huruf_mutu;
        const isLulus = GRADE_LULUS.includes(grade);
        await r.update({ status: isLulus ? 'Lulus' : 'Tidak Lulus' });
        if (isLulus) jumlahLulus++;
        else jumlahTidakLulus++;
    }

    return {
        kelasId,
        jumlahLulus,
        jumlahTidakLulus,
        jumlahSudahFinalSebelumnya: rincianList.length - yangBisaFinal.length,
        pesan: `Finalisasi selesai. ${jumlahLulus} lulus, ${jumlahTidakLulus} tidak lulus.`
    };
};
const getMetadataKelas = async (kelasId) => {

    const kelas = await KelasKuliah.findByPk(kelasId, {
        include: [
            {
                model: MataKuliah,
                as: "mataKuliah",
                attributes: ["id", "kode", "nama", "totalSks"],
                include: [
                    {
                        model: ProgramStudi,
                        as: "programStudi",
                        attributes: ["id", "nama"],
                        include: [
                            {
                                model: Jenjang,
                                as: "jenjang",
                                attributes: ["jenjang"],
                            }
                        ]
                    },
                ],
            },
            {
                model: PeriodeAkademik,
                as: "periodeAkademik",
                attributes: ["id", "nama"],
            },
            {
                model: JadwalKuliah,
                as: "jadwalKuliah",
                required: false,
                include: [
                    {
                        model: Dosen,
                        as: "dosen",
                        attributes: ["id", "nama", "nidn"],
                    },
                ],
            },
        ],
    });

    if (!kelas) throw new Error("Kelas tidak ditemukan");
    return kelas;
};

// ─────────────────────────────────────────────────────────────
// HELPER: Hitung rata-rata per komponen & nilai akhir
// ─────────────────────────────────────────────────────────────
const hitungRataRata = (tabel, headerKolom) => {
    if (!tabel.length) return null;

    const total = {};
    let totalNilaiAkhir = 0;
    headerKolom.forEach((h) => { total[h.label] = 0; });

    tabel.forEach((row) => {
        totalNilaiAkhir += row.nilaiAkhir || 0;
        headerKolom.forEach((h) => {
            total[h.label] += row.nilaiPerKomponen?.[h.label] ?? 0;
        });
    });

    const count = tabel.length;
    const rataPerKomponen = {};
    headerKolom.forEach((h) => {
        rataPerKomponen[h.label] = parseFloat((total[h.label] / count).toFixed(2));
    });

    return {
        rataPerKomponen,
        rataNilaiAkhir: parseFloat((totalNilaiAkhir / count).toFixed(2)),
    };
};

// ====================================================================
// INPUT NILAI PER CPMK LANGSUNG (Pendekatan OBE Langsung)
// Dosen input nilai tiap CPMK secara terpisah.
// nilaiAkhir = Σ(nilaiCPMK × bobotCPMK / 100)
// Mahasiswa tidak lulus jika nilai CPMK < target CPMK
// ====================================================================
export const inputNilaiPerCpmk = async (krsId, nilaiCpmkList) => {
    const rincian = await RincianKrsMahasiswa.findByPk(krsId, {
        include: [{ model: KrsMahasiswa, as: 'krsMahasiswa', attributes: ['siakMahasiswaId'] }]
    });
    if (!rincian) throw Object.assign(new Error('Data rincian KRS tidak ditemukan'), { statusCode: 404 });
    if (STATUS_FINAL.includes(rincian.status)) throw Object.assign(new Error('Nilai sudah difinalisasi, tidak dapat diubah'), { statusCode: 403 });
    if (rincian.status === 'Dikunci') throw Object.assign(new Error('Nilai sudah dikunci, tidak dapat diedit'), { statusCode: 403 });

    const kelasId = rincian.siakKelasKuliahId;
    const mahasiswaId = rincian.krsMahasiswa?.siakMahasiswaId;
    if (!mahasiswaId) throw new Error('Data mahasiswa tidak ditemukan');

    // Ambil CPMK + bobot + target dari MK
    const kelas = await KelasKuliah.findByPk(kelasId, { attributes: ['siakMataKuliahId'] });
    const mkId = kelas?.siakMataKuliahId;

    const cpmkList = await CapaianMataKuliah.findAll({
        where: { siakMataKuliahId: mkId, parentId: null },
        attributes: ['id', 'kode', 'bobot', 'target']
    });

    return await sequelize.transaction(async (trx) => {
        // Wipe & replace nilai CPMK lama
        await NilaiCpmkMahasiswa.destroy({
            where: { siakKelasKuliahId: kelasId, siakMahasiswaId: mahasiswaId },
            force: true, transaction: trx
        });

        // Simpan nilai per CPMK
        let nilaiAkhir = 0;
        let adaCpmkGagal = false;

        for (const cpmk of cpmkList) {
            const input = nilaiCpmkList.find(n => n.cpmkId === cpmk.id);
            const nilaiCpmk = input ? parseFloat(input.nilai) : 0;

            await NilaiCpmkMahasiswa.create({
                siakKelasKuliahId: kelasId,
                siakMahasiswaId: mahasiswaId,
                siakCapaianMataKuliahId: cpmk.id,
                nilai: nilaiCpmk
            }, { transaction: trx });

            nilaiAkhir += nilaiCpmk * (parseFloat(cpmk.bobot) / 100);

            // Cek apakah CPMK di bawah target
            if (nilaiCpmk < parseFloat(cpmk.target || 0)) adaCpmkGagal = true;
        }

        nilaiAkhir = Math.round(nilaiAkhir * 100) / 100;

        // Ambil skala nilai
        const queryTrace = `
            SELECT mk.siak_program_studi_id AS prodi_id, mk.siak_tahun_kurikulum_id AS kurikulum_id
            FROM siak_kelas_kuliah kk
            LEFT JOIN siak_mata_kuliah mk ON kk.siak_mata_kuliah_id = mk.id
            WHERE kk.id = :kelasId LIMIT 1
        `;
        const [trace] = await sequelize.query(queryTrace, { replacements: { kelasId }, type: sequelize.QueryTypes.SELECT, transaction: trx });

        let hurufMutu = 'E', angkaMutu = 0;

        if (trace) {
            const skalaList = await sequelize.query(
                `SELECT huruf_mutu AS grade, angka_mutu AS bobot, nilai_min
                 FROM siak_skala_penilaian
                 WHERE siak_program_studi_id = :prodiId AND siak_tahun_kurikulum_id = :kurikulumId
                   AND deleted_at IS NULL ORDER BY nilai_min DESC`,
                { replacements: { prodiId: trace.prodi_id, kurikulumId: trace.kurikulum_id }, type: sequelize.QueryTypes.SELECT, transaction: trx }
            );

            const skala = skalaList.length > 0 ? skalaList : DEFAULT_SKALA;
            const sorted = [...skala].sort((a, b) => (b.nilaiMin ?? b.nilai_min) - (a.nilaiMin ?? a.nilai_min));
            for (const s of sorted) {
                if (nilaiAkhir >= parseFloat(s.nilaiMin ?? s.nilai_min)) {
                    hurufMutu = String(s.grade ?? s.hurufMutu).trim();
                    angkaMutu = parseFloat(s.bobot ?? s.angkaMutu);
                    break;
                }
            }
        }

        // Jika ada CPMK di bawah target → paksa tidak lulus
        if (adaCpmkGagal) { hurufMutu = 'E'; angkaMutu = 0; }

        await sequelize.query(
            `UPDATE siak_rincian_krs_mahasiswa
             SET nilai_akhir = :nilaiAkhir, huruf_mutu = :hurufMutu, angka_mutu = :angkaMutu
             WHERE id = :krsId`,
            { replacements: { nilaiAkhir, hurufMutu, angkaMutu, krsId }, transaction: trx }
        );

        return { krsId, nilaiAkhir, hurufMutu, angkaMutu, adaCpmkGagal };
    });
};

// ─────────────────────────────────────────────────────────────
// LAPORAN 1: Detail nilai per komponen evaluasi
// ─────────────────────────────────────────────────────────────
export const getDataLaporanPerkuliahan = async (kelasId) => {
    const [metadata, pesertaData] = await Promise.all([
        getMetadataKelas(kelasId),
        getPesertaKelasList(kelasId),
    ]);

    const { headerKolom, tabel } = pesertaData;
    const rataRata = hitungRataRata(tabel, headerKolom);
    const dosenList = (metadata.jadwalKuliah || []).map((dk) => dk.dosen).filter(Boolean);

    return {
        kelas: {
            id: metadata.id,
            nama: metadata.namaKelas || metadata.nama || "-",
        },
        mataKuliah: {
            kode: metadata.mataKuliah?.kode || "-",
            nama: metadata.mataKuliah?.nama || "-",
            sks: metadata.mataKuliah?.totalSks || 0,
        },
        programStudi: {
            nama: metadata.mataKuliah?.programStudi?.nama || "-",
            jenjang: metadata.mataKuliah?.programStudi?.jenjang?.jenjang || "S1",
        },
        periode: {
            nama: metadata.periodeAkademik?.nama || "-",
            tahun: metadata.periodeAkademik?.tahun || null,
            semester: metadata.periodeAkademik?.semester || null,
        },
        dosen: dosenList,
        komponenEvaluasi: headerKolom,
        mahasiswa: tabel.map((row) => ({
            no: row.no,
            rincianKrsId: row.rincianKrsId,
            nim: row.nim,
            nama: row.nama,
            nilaiPerKomponen: row.nilaiPerKomponen,
            nilaiAkhir: row.nilaiAkhir,
            grade: row.grade,
            angkaMutu: row.angkaMutu,
            lulus: row.lulus,
            keterangan: row.keterangan || null,
        })),
        rataRataKelas: rataRata,
        totalMahasiswa: tabel.length,
    };
};

// ─────────────────────────────────────────────────────────────
// LAPORAN 2: Daftar nilai mahasiswa (ringkas)
// ─────────────────────────────────────────────────────────────
// ============================================================
// RESET FUNCTIONS (DEV/TESTING ONLY)
// ============================================================

export const resetFinalisasiKelas = async (kelasId) => {
    const [updated] = await sequelize.query(`
        UPDATE siak_rincian_krs_mahasiswa
        SET status = 'Dikunci', updated_at = NOW()
        WHERE siak_kelas_kuliah_id = :kelasId
          AND status IN ('Lulus', 'Tidak Lulus')
          AND deleted_at IS NULL
    `, { replacements: { kelasId }, type: sequelize.QueryTypes.UPDATE });
    return { reset: updated, pesan: `${updated} mahasiswa direset dari finalisasi → Dikunci` };
};

export const resetNilaiMahasiswa = async (rincianKrsId) => {
    const rkm = await RincianKrsMahasiswa.findByPk(rincianKrsId);
    if (!rkm) throw new Error('Rincian KRS tidak ditemukan');

    const kelasId = rkm.siakKelasKuliahId || rkm.siak_kelas_kuliah_id;
    const krsId = rkm.siakKrsMahasiswaId || rkm.siak_krs_mahasiswa_id;
    const krs = await KrsMahasiswa.findByPk(krsId);
    const mhsId = krs?.siakMahasiswaId || krs?.siak_mahasiswa_id;

    await sequelize.transaction(async (trx) => {
        await sequelize.query(`
            DELETE FROM siak_nilai_evaluasi_mahasiswa
            WHERE siak_rincian_krs_mahasiswa_id = :rincianKrsId
        `, { replacements: { rincianKrsId }, transaction: trx });

        if (mhsId) {
            await sequelize.query(`
                DELETE FROM siak_nilai_cpmk_mahasiswa
                WHERE siak_kelas_kuliah_id = :kelasId
                  AND siak_mahasiswa_id = :mhsId
            `, { replacements: { kelasId, mhsId }, transaction: trx });
        }

        await sequelize.query(`
            UPDATE siak_rincian_krs_mahasiswa
            SET nilai_akhir = NULL,
                huruf_mutu  = NULL,
                angka_mutu  = NULL,
                status      = 'Disetujui',
                updated_at  = NOW()
            WHERE id = :rincianKrsId
        `, { replacements: { rincianKrsId }, transaction: trx });
    });

    return { pesan: 'Nilai mahasiswa berhasil direset ke Belum Dinilai' };
};

export const resetNilaiKelas = async (kelasId) => {
    let jumlahMhs = 0;
    await sequelize.transaction(async (trx) => {
        await sequelize.query(`
            DELETE FROM siak_nilai_evaluasi_mahasiswa nem
            USING siak_rincian_krs_mahasiswa rkm
            WHERE nem.siak_rincian_krs_mahasiswa_id = rkm.id
              AND rkm.siak_kelas_kuliah_id = :kelasId
        `, { replacements: { kelasId }, transaction: trx });

        await sequelize.query(`
            DELETE FROM siak_nilai_cpmk_mahasiswa
            WHERE siak_kelas_kuliah_id = :kelasId
        `, { replacements: { kelasId }, transaction: trx });

        const [res] = await sequelize.query(`
            UPDATE siak_rincian_krs_mahasiswa
            SET nilai_akhir = NULL,
                huruf_mutu  = NULL,
                angka_mutu  = NULL,
                status      = 'Disetujui',
                updated_at  = NOW()
            WHERE siak_kelas_kuliah_id = :kelasId
              AND deleted_at IS NULL
            RETURNING id
        `, { replacements: { kelasId }, transaction: trx });
        jumlahMhs = res.length;
    });

    return { reset: jumlahMhs, pesan: `${jumlahMhs} mahasiswa direset ke Belum Dinilai (nilai & CPMK dihapus)` };
};

export const getDataDaftarNilai = async (kelasId) => {
    const [metadata, pesertaData] = await Promise.all([
        getMetadataKelas(kelasId),
        getPesertaKelasList(kelasId),
    ]);

    const { tabel } = pesertaData;
    const dosenList = (metadata.jadwalKuliah || []).map((dk) => dk.dosen).filter(Boolean);

    return {
        kelas: {
            id: metadata.id,
            nama: metadata.namaKelas || metadata.nama || "-",
        },
        mataKuliah: {
            kode: metadata.mataKuliah?.kode || "-",
            nama: metadata.mataKuliah?.nama || "-",
            sks: metadata.mataKuliah?.totalSks || 0,
        },
        programStudi: {
            nama: metadata.mataKuliah?.programStudi?.nama || "-",
            jenjang: metadata.mataKuliah?.programStudi?.jenjang?.jenjang || "S1",
        },
        periode: {
            nama: metadata.periodeAkademik?.nama || "-",
            tahun: metadata.periodeAkademik?.tahun || null,
            semester: metadata.periodeAkademik?.semester || null,
        },
        dosen: dosenList,
        mahasiswa: tabel.map((row) => ({
            no: row.no,
            rincianKrsId: row.rincianKrsId,
            nim: row.nim,
            nama: row.nama,
            nilaiAkhir: row.nilaiAkhir,
            nilaiAngka: row.angkaMutu,
            nilaiHuruf: row.grade,
            keterangan: row.lulus ? "Lulus" : "-",
        })),
        totalMahasiswa: tabel.length,
    };
};
    