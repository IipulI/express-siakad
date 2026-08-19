import models from '../models/index.js';
import { QueryTypes } from 'sequelize';
import * as CustomError from '../utils/custom-error.js';
import { getCpmkColumnsForMataKuliah } from './cpmk.service.js';

export const getCplPerProgramStudi = async (filters) => {
    const { tahunKurikulumId, prodiId, angkatan, metode, useKop } = filters;
    const { Obe, ProgramStudi, TahunKurikulum, CapaianPembelajaranLulusan, sequelize } = models;

    try {
        // =================================================================
        // 1. Ambil Data Master OBE, Prodi, Kurikulum
        // =================================================================
        const obeData = await Obe.findOne({
            where: { siak_tahun_kurikulum_id: tahunKurikulumId, siak_program_studi_id: prodiId },
            include: [
                { model: ProgramStudi, as: 'programStudi', attributes: ['nama'] },
                { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] }
            ]
        });

        if (!obeData) throw new CustomError.NotFoundError("Data Kurikulum OBE tidak ditemukan untuk Program Studi ini.");

        // =================================================================
        // 2. Ambil Semua CPL & Buat Grouping by "KODE" (Anti Duplikat CPL01)
        // =================================================================
        const cplList = await CapaianPembelajaranLulusan.findAll({
            where: { siak_obe_id: obeData.id },
            attributes: ['id', 'kode', 'deskripsi', 'kategori', 'target_cpl'],
            order: [['kode', 'ASC']]
        });

        const cplScores = {};
        const uuidToKodeMap = {}; // Kamus penterjemah UUID ke Kode CPL

        cplList.forEach(cpl => {
            // Peta-kan UUID ini ke Kode CPL yang mana
            uuidToKodeMap[cpl.id] = cpl.kode;

            // Jika wadah untuk kode ini (misal "CPL01") belum ada, buat wadahnya
            if (!cplScores[cpl.kode]) {
                cplScores[cpl.kode] = {
                    kode: cpl.kode,
                    deskripsi: cpl.deskripsi,
                    kategori: cpl.kategori,
                    target: cpl.target_cpl || 0,
                    // mhsData: { [mahasiswaId]: { sum, count, max } } -- diagregasi PER MAHASISWA dulu
                    // supaya robust terhadap data KRS duplikat (1 mahasiswa kebetulan punya >1 baris
                    // enrollment untuk MK yang sama) -- tanpa ini, mahasiswa yang punya KRS dobel akan
                    // tertimbang 2x lipat di rata-rata prodi.
                    mhsData: {}
                };
            }
        });

        // =================================================================
        // 3. (RAW SQL) Hitung Total Mahasiswa di Prodi & Angkatan Tersebut
        // =================================================================
        const totalMhsQuery = await sequelize.query(`
            SELECT COUNT(id) as total 
            FROM siak_mahasiswa 
            WHERE siak_program_studi_id = :prodiId AND angkatan = :angkatan
        `, { replacements: { prodiId, angkatan }, type: QueryTypes.SELECT });

        const totalMahasiswa = parseInt(totalMhsQuery[0].total) || 0;

        // =================================================================
        // 4. (RAW SQL) Tarik Nilai CPMK Berbobot per (Mahasiswa, Kelas, CPL)
        //    Capaian CPL dihitung dari nilai CPMK × bobot_cpl, BUKAN dari
        //    nilai_akhir MK secara keseluruhan — supaya 1 MK yang berkontribusi
        //    ke beberapa CPL berbeda tidak disamakan nilainya.
        // =================================================================
        const queryNilai = `
            SELECT
                m.id AS mahasiswa_id,
                rkm.id AS rincian_krs_id,
                pcc.siak_capaian_pembelajaran_lulusan_id AS cpl_id,
                SUM(ncm.nilai * pcc.bobot_cpl) AS sum_weighted,
                SUM(pcc.bobot_cpl) AS sum_bobot
            FROM siak_mahasiswa m
            JOIN siak_krs_mahasiswa km ON m.id = km.siak_mahasiswa_id AND km.deleted_at IS NULL
            JOIN siak_rincian_krs_mahasiswa rkm ON km.id = rkm.siak_krs_mahasiswa_id AND rkm.deleted_at IS NULL
            JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id AND kk.deleted_at IS NULL
            JOIN siak_mata_kuliah mk ON kk.siak_mata_kuliah_id = mk.id AND mk.deleted_at IS NULL
            JOIN siak_nilai_cpmk_mahasiswa ncm ON ncm.siak_kelas_kuliah_id = kk.id
                                               AND ncm.siak_mahasiswa_id = m.id
                                               AND ncm.deleted_at IS NULL
            JOIN siak_pemetaan_cpl_cpmk pcc ON pcc.siak_capaian_mata_kuliah_id = ncm.siak_capaian_mata_kuliah_id
                                            AND pcc.deleted_at IS NULL
            WHERE m.siak_program_studi_id = :prodiId
              AND m.angkatan = :angkatan
              AND mk.siak_tahun_kurikulum_id = :tahunKurikulumId
              AND ncm.nilai IS NOT NULL
            GROUP BY m.id, rkm.id, pcc.siak_capaian_pembelajaran_lulusan_id
        `;

        const dataNilai = await sequelize.query(queryNilai, {
            replacements: { prodiId, angkatan, tahunKurikulumId },
            type: QueryTypes.SELECT
        });

        // =================================================================
        // 5. EKSEKUSI PENILAIAN (Ke dalam keranjang Kode CPL)
        //    Setiap baris = capaian CPL mahasiswa untuk 1 kelas/enrollment
        //    (gabungan beberapa CPMK yang berbobot ke CPL ini)
        // =================================================================
        dataNilai.forEach(row => {
            const kodeCpl = uuidToKodeMap[row.cpl_id]; // Terjemahkan UUID jadi "CPL01"
            const mhsId = row.mahasiswa_id;
            const sumBobot = parseFloat(row.sum_bobot) || 0;
            if (sumBobot <= 0) return;
            const nilai = parseFloat(row.sum_weighted) / sumBobot;

            if (kodeCpl && cplScores[kodeCpl]) {
                if (!cplScores[kodeCpl].mhsData[mhsId]) {
                    cplScores[kodeCpl].mhsData[mhsId] = { sum: 0, count: 0, max: 0 };
                }
                const m = cplScores[kodeCpl].mhsData[mhsId];
                m.sum += nilai;
                m.count += 1;
                if (nilai > m.max) m.max = nilai;
            }
        });

        // =================================================================
        // 6. FORMAT HASIL AKHIR (Untuk Chart & Tabel)
        // =================================================================
        const chartLabels = [];
        const chartDataCapaian = [];
        const chartDataTarget = [];
        const tabelDetail = [];

        let maxCapaian = -1; let minCapaian = 999;
        let cplMax = ""; let cplMin = "";


        Object.values(cplScores).forEach(stats => {
            let capaianAkhir = 0;
            const mhsIdsYangPunyaNilai = Object.keys(stats.mhsData);

            if (mhsIdsYangPunyaNilai.length > 0) {
                if (metode === 'progresif') {
                    const sumMax = mhsIdsYangPunyaNilai.reduce((sum, id) => sum + stats.mhsData[id].max, 0);
                    capaianAkhir = sumMax / mhsIdsYangPunyaNilai.length;
                } else {
                    // Rerata PER MAHASISWA dulu (handle kalau ada >1 baris kontribusi per mahasiswa,
                    // misal KRS duplikat), baru dirata-rata ANTAR mahasiswa dengan bobot yang sama.
                    const sumRerataPerMhs = mhsIdsYangPunyaNilai.reduce((sum, id) => {
                        const m = stats.mhsData[id];
                        return sum + (m.count > 0 ? m.sum / m.count : 0);
                    }, 0);
                    capaianAkhir = sumRerataPerMhs / mhsIdsYangPunyaNilai.length;
                }
            }

            capaianAkhir = parseFloat(capaianAkhir.toFixed(2));

            // 🟢 LOGIKA PINTAR KKM: Kalau target prodi belum diset (0), kita paksa KKM jadi 60 sbg batas minimal!
            // Biar nilai E nggak nyelonong masuk dibilang Tercapai.
            const targetAsli = parseFloat(stats.target) || 0;
            const targetBatas = targetAsli > 0 ? targetAsli : 60;

            const mhsSudah = mhsIdsYangPunyaNilai.length;
            const mhsBelum = totalMahasiswa > 0 ? (totalMahasiswa - mhsSudah) : 0;

            chartLabels.push(stats.kode);
            chartDataCapaian.push(capaianAkhir);
            chartDataTarget.push(targetAsli); // Tetap push target asli untuk Chart

            tabelDetail.push({
                kode: stats.kode,
                deskripsi: stats.deskripsi,
                target: targetAsli.toFixed(2).replace('.', ','), // Tetap tampilkan 0,00 di tabel
                capaian: capaianAkhir > 0 ? capaianAkhir.toFixed(2).replace('.', ',') : "-",

                // 🟢 CEK KELULUSAN PAKAI targetBatas (60), BUKAN targetAsli (0)
                status: capaianAkhir === 0 ? "Belum Dinilai" : (capaianAkhir >= targetBatas ? "Tercapai" : "Belum Tercapai"),

                mhsBelum: capaianAkhir === 0 ? "-" : mhsBelum,
                mhsSudah: capaianAkhir === 0 ? "-" : mhsSudah
            });

            if (capaianAkhir > maxCapaian) { maxCapaian = capaianAkhir; cplMax = stats.kode; }
            if (capaianAkhir < minCapaian && capaianAkhir > 0) { minCapaian = capaianAkhir; cplMin = stats.kode; }
        });

        return {
            info: {
                tahunKurikulum: obeData.tahunKurikulum?.tahun || '-',
                programStudi: `S1 - ${obeData.programStudi?.nama || '-'}`,
                angkatan: angkatan,
                totalMahasiswa: totalMahasiswa,
                metodePerhitungan: metode === 'progresif' ? "Progresif" : "Rerata",
                useKop: useKop === 'true' || useKop === true
            },
            chart: {
                labels: chartLabels,
                datasets: [
                    { label: "Capaian", data: chartDataCapaian },
                    { label: "Target", data: chartDataTarget }
                ]
            },
            summary: {
                tertinggi: { nilai: maxCapaian > -1 ? maxCapaian.toFixed(2).replace('.', ',') : "0", label: `di posisi ${cplMax}` },
                terendah: { nilai: minCapaian < 999 ? minCapaian.toFixed(2).replace('.', ',') : "0", label: `di posisi ${cplMin}` }
            },
            tabel: tabelDetail
        };

    } catch (error) {
        if (error.status) throw error;
        throw new CustomError.InternalServerError("Gagal menghitung Monitoring CPL: " + error.message);
    }
};
export const getLaporanCplPerMahasiswa = async (filters) => {
    const { tahunKurikulumId, prodiId, angkatan, metode, useKop } = filters;
    const { Obe, ProgramStudi, TahunKurikulum, CapaianPembelajaranLulusan, Mahasiswa, sequelize } = models;

    try {
        const obeData = await Obe.findOne({
            where: { siak_tahun_kurikulum_id: tahunKurikulumId, siak_program_studi_id: prodiId },
            include: [
                { model: ProgramStudi, as: 'programStudi', attributes: ['nama'] },
                { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] }
            ]
        });

        if (!obeData) throw new CustomError.NotFoundError("Data OBE tidak ditemukan.");

        // 1. Ambil & Filter Duplikat CPL (Tambahkan target_cpl)
        const cplList = await CapaianPembelajaranLulusan.findAll({
            where: { siak_obe_id: obeData.id },
            attributes: ['id', 'kode', 'deskripsi', 'target_cpl'],
            order: [['kode', 'ASC']]
        });

        const uniqueCpls = [];
        const seenCpls = new Set();
        const cplMap = {};
        const targetMap = {}; // Simpan target aslinya

        cplList.forEach(cpl => {
            cplMap[cpl.id] = cpl.kode;
            targetMap[cpl.kode] = parseFloat(cpl.target_cpl) || 0;

            if (!seenCpls.has(cpl.kode)) {
                seenCpls.add(cpl.kode);
                uniqueCpls.push(cpl);
            }
        });

        // 2. Ambil Mahasiswa
        const mahasiswaList = await Mahasiswa.findAll({
            where: { siak_program_studi_id: prodiId, angkatan: angkatan },
            attributes: ['id', 'npm', 'nama'],
            order: [['npm', 'ASC']]
        });

        const mhsScores = {};
        mahasiswaList.forEach(m => {
            mhsScores[m.id] = { npm: m.npm, nama: m.nama, cpl: {} };
            uniqueCpls.forEach(c => { mhsScores[m.id].cpl[c.kode] = { sum: 0, max: 0, count: 0 }; });
        });

        // 3. Tarik Nilai CPMK Berbobot per (Mahasiswa, Kelas, CPL) — bukan nilai_akhir MK,
        //    supaya 1 MK yang berkontribusi ke beberapa CPL tidak disamakan nilainya.
        const queryNilai = `
            SELECT
                m.id AS mahasiswa_id,
                rkm.id AS rincian_krs_id,
                pcc.siak_capaian_pembelajaran_lulusan_id AS cpl_id,
                SUM(ncm.nilai * pcc.bobot_cpl) AS sum_weighted,
                SUM(pcc.bobot_cpl) AS sum_bobot
            FROM siak_mahasiswa m
            JOIN siak_krs_mahasiswa km ON m.id = km.siak_mahasiswa_id AND km.deleted_at IS NULL
            JOIN siak_rincian_krs_mahasiswa rkm ON km.id = rkm.siak_krs_mahasiswa_id AND rkm.deleted_at IS NULL
            JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id AND kk.deleted_at IS NULL
            JOIN siak_mata_kuliah mk ON kk.siak_mata_kuliah_id = mk.id AND mk.deleted_at IS NULL
            JOIN siak_nilai_cpmk_mahasiswa ncm ON ncm.siak_kelas_kuliah_id = kk.id
                                               AND ncm.siak_mahasiswa_id = m.id
                                               AND ncm.deleted_at IS NULL
            JOIN siak_pemetaan_cpl_cpmk pcc ON pcc.siak_capaian_mata_kuliah_id = ncm.siak_capaian_mata_kuliah_id
                                            AND pcc.deleted_at IS NULL
            WHERE m.siak_program_studi_id = :prodiId
              AND m.angkatan = :angkatan
              AND mk.siak_tahun_kurikulum_id = :tahunKurikulumId
              AND ncm.nilai IS NOT NULL
            GROUP BY m.id, rkm.id, pcc.siak_capaian_pembelajaran_lulusan_id
        `;

        const dataNilai = await sequelize.query(queryNilai, { replacements: { prodiId, angkatan, tahunKurikulumId }, type: QueryTypes.SELECT });

        dataNilai.forEach(row => {
            const kodeCpl = cplMap[row.cpl_id];
            const sumBobot = parseFloat(row.sum_bobot) || 0;
            if (!kodeCpl || sumBobot <= 0 || !mhsScores[row.mahasiswa_id]) return;
            const nilai = parseFloat(row.sum_weighted) / sumBobot;

            const target = mhsScores[row.mahasiswa_id].cpl[kodeCpl];
            target.sum += nilai;
            target.count += 1;
            if (nilai > target.max) target.max = nilai;
        });

        // 4. Kalkulasi Rerata / Progresif
        const listMahasiswa = [];
        const rerataKolom = {};
        uniqueCpls.forEach(c => { rerataKolom[c.kode] = { sum: 0, count: 0 }; });

        Object.values(mhsScores).forEach(mhs => {
            const rowMhs = { npm: mhs.npm, nama: mhs.nama };
            let hasAnyNilai = false;
            let isLulusSemua = true; // Kita asumsikan lulus dulu

            uniqueCpls.forEach(cpl => {
                const stats = mhs.cpl[cpl.kode];
                let nilaiAkhir = null;

                if (stats.count > 0) {
                    hasAnyNilai = true;
                    nilaiAkhir = metode === 'progresif' ? stats.max : (stats.sum / stats.count);
                    rerataKolom[cpl.kode].sum += nilaiAkhir;
                    rerataKolom[cpl.kode].count += 1;

                    // 🟢 Pengecekan Kelulusan per Mahasiswa
                    const targetAsli = targetMap[cpl.kode] || 0;
                    const targetBatas = targetAsli > 0 ? targetAsli : 60; // Paksa KKM 60 jika target 0

                    if (nilaiAkhir < targetBatas) {
                        isLulusSemua = false; // Kalau ada 1 aja yang merah, dianggap Gagal
                    }
                }
                rowMhs[cpl.kode] = nilaiAkhir !== null ? parseFloat(nilaiAkhir.toFixed(2)) : null;
            });

            // 🟢 Tentukan status Mahasiswa
            if (!hasAnyNilai) {
                rowMhs.status = "Belum Dinilai";
            } else {
                rowMhs.status = isLulusSemua ? "Sudah Memenuhi" : "Belum Memenuhi";
            }

            listMahasiswa.push(rowMhs);
        });

        const rerataBawah = {};
        let grandSum = 0; let grandCount = 0;
        let cplTertinggi = { nilai: -1, kode: "" };
        let cplTerendah = { nilai: 999, kode: "" };

        uniqueCpls.forEach(cpl => {
            const stats = rerataKolom[cpl.kode];
            let avgCol = stats.count > 0 ? (stats.sum / stats.count) : 0;
            avgCol = parseFloat(avgCol.toFixed(2));
            rerataBawah[cpl.kode] = avgCol > 0 ? avgCol : null;

            if (avgCol > 0) {
                grandSum += avgCol; grandCount += 1;
                if (avgCol > cplTertinggi.nilai) { cplTertinggi.nilai = avgCol; cplTertinggi.kode = cpl.kode; }
                if (avgCol < cplTerendah.nilai) { cplTerendah.nilai = avgCol; cplTerendah.kode = cpl.kode; }
            }
        });

        return {
            info: {
                tahunKurikulum: obeData.tahunKurikulum?.tahun || '-',
                programStudi: `S1 - ${obeData.programStudi?.nama || '-'}`,
                angkatan: angkatan,
                totalMahasiswa: mahasiswaList.length,
                metodePerhitungan: metode === 'progresif' ? "Progresif" : "Rerata",
                useKop: String(useKop).toLowerCase() === 'true'
            },
            daftarCpl: uniqueCpls.map(c => ({
                kode: c.kode,
                deskripsi: c.deskripsi,
                target: targetMap[c.kode] // Kirim target ke frontend untuk panduan warna
            })),
            dataMahasiswa: listMahasiswa,
            rerataCpl: rerataBawah,
            summary: {
                tertinggi: { nilai: cplTertinggi.nilai > -1 ? cplTertinggi.nilai.toFixed(2).replace('.', ',') : "0,00", kode: cplTertinggi.kode },
                terendah: { nilai: cplTerendah.nilai < 999 ? cplTerendah.nilai.toFixed(2).replace('.', ',') : "0,00", kode: cplTerendah.kode },
                rataKeseluruhan: grandCount > 0 ? (grandSum / grandCount).toFixed(2).replace('.', ',') : "0,00"
            }
        };
    } catch (error) {
        if (error.status) throw error;
        throw new CustomError.InternalServerError("Gagal menghitung Laporan: " + error.message);
    }
};
export const getLaporanCplPerMataKuliah = async (filters) => {
    const { tahunKurikulumId, prodiId, angkatan, metode, useKop } = filters;
    const { Obe, ProgramStudi, TahunKurikulum, CapaianPembelajaranLulusan, sequelize } = models;

    try {
        const obeData = await Obe.findOne({
            where: { siak_tahun_kurikulum_id: tahunKurikulumId, siak_program_studi_id: prodiId },
            include: [
                { model: ProgramStudi, as: 'programStudi', attributes: ['nama'] },
                { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] }
            ]
        });

        if (!obeData) throw new CustomError.NotFoundError("Data OBE tidak ditemukan.");

        // 1. Ambil & Filter CPL
        const cplList = await CapaianPembelajaranLulusan.findAll({
            where: { siak_obe_id: obeData.id },
            attributes: ['id', 'kode', 'deskripsi'],
            order: [['kode', 'ASC']]
        });

        const uniqueCpls = [];
        const seenCpls = new Set();
        const cplMap = {};

        cplList.forEach(cpl => {
            cplMap[cpl.id] = cpl.kode;
            if (!seenCpls.has(cpl.kode)) {
                seenCpls.add(cpl.kode);
                uniqueCpls.push(cpl);
            }
        });

        // 2. Tarik Nilai CPMK Berbobot (Dikelompokkan per Mahasiswa, Kelas, MK, CPL) — bukan
        //    nilai_akhir MK, supaya 1 MK yang berkontribusi ke beberapa CPL tidak disamakan nilainya.
        const queryNilai = `
            SELECT
                mk.id AS mk_id, mk.nama AS nama_mk, mk.semester, mk.total_sks AS sks,
                m.id AS mahasiswa_id, rkm.id AS rincian_krs_id,
                pcc.siak_capaian_pembelajaran_lulusan_id AS cpl_id,
                SUM(ncm.nilai * pcc.bobot_cpl) AS sum_weighted,
                SUM(pcc.bobot_cpl) AS sum_bobot
            FROM siak_mata_kuliah mk
            JOIN siak_kelas_kuliah kk ON mk.id = kk.siak_mata_kuliah_id AND kk.deleted_at IS NULL
            JOIN siak_rincian_krs_mahasiswa rkm ON kk.id = rkm.siak_kelas_kuliah_id AND rkm.deleted_at IS NULL
            JOIN siak_krs_mahasiswa km ON rkm.siak_krs_mahasiswa_id = km.id AND km.deleted_at IS NULL
            JOIN siak_mahasiswa m ON km.siak_mahasiswa_id = m.id AND m.deleted_at IS NULL
            JOIN siak_nilai_cpmk_mahasiswa ncm ON ncm.siak_kelas_kuliah_id = kk.id
                                               AND ncm.siak_mahasiswa_id = m.id
                                               AND ncm.deleted_at IS NULL
            JOIN siak_pemetaan_cpl_cpmk pcc ON pcc.siak_capaian_mata_kuliah_id = ncm.siak_capaian_mata_kuliah_id
                                            AND pcc.deleted_at IS NULL
            WHERE m.siak_program_studi_id = :prodiId
              AND m.angkatan = :angkatan
              AND mk.siak_tahun_kurikulum_id = :tahunKurikulumId
              AND mk.deleted_at IS NULL
              AND ncm.nilai IS NOT NULL
            GROUP BY mk.id, mk.nama, mk.semester, mk.total_sks, m.id, rkm.id, pcc.siak_capaian_pembelajaran_lulusan_id
        `;

        const dataNilai = await sequelize.query(queryNilai, { replacements: { prodiId, angkatan, tahunKurikulumId }, type: QueryTypes.SELECT });

        // mhsDataPerMk: { [mk_id]: { [cpl.kode]: { [mahasiswa_id]: { sum, count, max } } } }
        // Diagregasi PER MAHASISWA dulu supaya robust terhadap KRS duplikat (mahasiswa yang
        // kebetulan punya >1 baris enrollment untuk MK yang sama tidak tertimbang 2x lipat).
        const mkScores = {};
        dataNilai.forEach(row => {
            if (!mkScores[row.mk_id]) {
                mkScores[row.mk_id] = { semester: row.semester, nama: row.nama_mk, sks: row.sks, cpl: {} };
                uniqueCpls.forEach(c => { mkScores[row.mk_id].cpl[c.kode] = {}; });
            }

            const kodeCpl = cplMap[row.cpl_id];
            const sumBobot = parseFloat(row.sum_bobot) || 0;
            if (!kodeCpl || sumBobot <= 0 || !mkScores[row.mk_id].cpl[kodeCpl]) return;
            const nilai = parseFloat(row.sum_weighted) / sumBobot;

            const mhsMap = mkScores[row.mk_id].cpl[kodeCpl];
            if (!mhsMap[row.mahasiswa_id]) mhsMap[row.mahasiswa_id] = { sum: 0, count: 0, max: 0 };
            const m = mhsMap[row.mahasiswa_id];
            m.sum += nilai;
            m.count += 1;
            if (nilai > m.max) m.max = nilai;
        });

        // 3. Kalkulasi Rerata / Progresif
        const listMataKuliah = [];
        let grandSum = 0; let grandCount = 0;
        let cplTertinggi = { nilai: -1, kode: "" };
        let cplTerendah = { nilai: 999, kode: "" };

        Object.values(mkScores).forEach(mk => {
            const rowMk = { semester: mk.semester, nama: mk.nama, sks: mk.sks };
            uniqueCpls.forEach(cpl => {
                const mhsMap = mk.cpl[cpl.kode];
                const mhsIds = Object.keys(mhsMap);
                let nilaiAkhir = null;
                if (mhsIds.length > 0) {
                    if (metode === 'progresif') {
                        nilaiAkhir = mhsIds.reduce((sum, id) => sum + mhsMap[id].max, 0) / mhsIds.length;
                    } else {
                        const sumRerataPerMhs = mhsIds.reduce((sum, id) => {
                            const m = mhsMap[id];
                            return sum + (m.count > 0 ? m.sum / m.count : 0);
                        }, 0);
                        nilaiAkhir = sumRerataPerMhs / mhsIds.length;
                    }
                    grandSum += nilaiAkhir; grandCount += 1;
                    if (nilaiAkhir > cplTertinggi.nilai) { cplTertinggi.nilai = nilaiAkhir; cplTertinggi.kode = cpl.kode; }
                    if (nilaiAkhir < cplTerendah.nilai) { cplTerendah.nilai = nilaiAkhir; cplTerendah.kode = cpl.kode; }
                }
                rowMk[cpl.kode] = nilaiAkhir !== null ? parseFloat(nilaiAkhir.toFixed(2)) : null;
            });
            listMataKuliah.push(rowMk);
        });

        // Urutkan berdasarkan Semester lalu Nama MK
        listMataKuliah.sort((a, b) => a.semester - b.semester || a.nama.localeCompare(b.nama));

        // 4. Hitung Total Mahasiswa (Untuk Header Info)
        const totalMhs = await models.Mahasiswa.count({ where: { siak_program_studi_id: prodiId, angkatan: angkatan } });

        return {
            info: {
                tahunKurikulum: obeData.tahunKurikulum?.tahun || '-',
                programStudi: `S1 - ${obeData.programStudi?.nama || '-'}`,
                angkatan: angkatan,
                totalMahasiswa: totalMhs,
                metodePerhitungan: metode === 'progresif' ? "Progresif" : "Rerata",
                useKop: String(useKop).toLowerCase() === 'true'
            },
            daftarCpl: uniqueCpls.map(c => ({ kode: c.kode, deskripsi: c.deskripsi })),
            dataMataKuliah: listMataKuliah,
            summary: {
                tertinggi: { nilai: cplTertinggi.nilai > -1 ? cplTertinggi.nilai.toFixed(2).replace('.', ',') : "0,00", kode: cplTertinggi.kode },
                terendah: { nilai: cplTerendah.nilai < 999 ? cplTerendah.nilai.toFixed(2).replace('.', ',') : "0,00", kode: cplTerendah.kode },
                rataKeseluruhan: grandCount > 0 ? (grandSum / grandCount).toFixed(2).replace('.', ',') : "0,00"
            }
        };
    } catch (error) {
        if (error.status) throw error;
        throw new CustomError.InternalServerError("Gagal menghitung Laporan Mata Kuliah: " + error.message);
    }
};
export const getLaporanMkPerMahasiswa = async (filters) => {
    const { tahunKurikulumId, prodiId, angkatan, cpl, useKop } = filters;
    const { Obe, ProgramStudi, TahunKurikulum, CapaianPembelajaranLulusan, Mahasiswa, sequelize } = models;

    try {
        // 1. Info Master
        const obeData = await Obe.findOne({
            where: { siak_tahun_kurikulum_id: tahunKurikulumId, siak_program_studi_id: prodiId },
            include: [
                { model: ProgramStudi, as: 'programStudi', attributes: ['nama'] },
                { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] }
            ]
        });

        if (!obeData) throw new CustomError.NotFoundError("Data OBE tidak ditemukan.");

        // 2. Ambil Data CPL Spesifik (Dari dropdown parameter 'cpl')
        let cplWhere = { siak_obe_id: obeData.id };
        if (cpl) {
            if (cpl.length > 10) cplWhere.id = cpl; // Jika dikirim UUID
            else cplWhere.kode = cpl; // Jika dikirim 'CPL01'
        }

        const cplData = await CapaianPembelajaranLulusan.findOne({ where: cplWhere });
        if (!cplData) throw new CustomError.NotFoundError("Data CPL tersebut tidak ditemukan.");

        // 3. Ambil Mata Kuliah yang Terhubung dengan CPL ini
        const queryMk = `
            SELECT mk.id, mk.kode, mk.nama, mk.semester
            FROM siak_mata_kuliah mk
            JOIN siak_pemetaan_cpl_mata_kuliah pcm ON mk.id = pcm.siak_mata_kuliah_id
            WHERE pcm.siak_capaian_pembelajaran_lulusan_id = :cplId
              AND mk.siak_tahun_kurikulum_id = :tahunKurikulumId
            ORDER BY mk.semester ASC, mk.kode ASC
        `;
        const mkList = await sequelize.query(queryMk, { replacements: { cplId: cplData.id, tahunKurikulumId }, type: QueryTypes.SELECT });

        // Kelompokkan MK berdasarkan Semester untuk Header Tabel
        const semesterGroups = {};
        mkList.forEach(mk => {
            if (!semesterGroups[mk.semester]) semesterGroups[mk.semester] = [];
            semesterGroups[mk.semester].push(mk);
        });
        const semesters = Object.keys(semesterGroups).sort((a, b) => a - b).map(s => ({
            semester: s, mks: semesterGroups[s]
        }));

        // 4. Ambil Daftar Mahasiswa
        const mhsList = await Mahasiswa.findAll({
            where: { siak_program_studi_id: prodiId, angkatan: angkatan },
            attributes: ['id', 'npm', 'nama'],
            order: [['npm', 'ASC']]
        });

        // 5. Tarik Nilai Mahasiswa Khusus untuk MK Tersebut
        const mkIds = mkList.map(mk => mk.id);
        let dataNilai = [];
        if (mkIds.length > 0) {
            const queryNilai = `
                SELECT m.id AS mahasiswa_id, kk.siak_mata_kuliah_id AS mk_id, rkm.nilai_akhir
                FROM siak_mahasiswa m
                JOIN siak_krs_mahasiswa km ON m.id = km.siak_mahasiswa_id AND km.deleted_at IS NULL
                JOIN siak_rincian_krs_mahasiswa rkm ON km.id = rkm.siak_krs_mahasiswa_id AND rkm.deleted_at IS NULL
                JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id AND kk.deleted_at IS NULL
                JOIN siak_mata_kuliah mk ON kk.siak_mata_kuliah_id = mk.id AND mk.deleted_at IS NULL
                WHERE m.siak_program_studi_id = :prodiId 
                  AND m.angkatan = :angkatan
                  AND mk.siak_tahun_kurikulum_id = :tahunKurikulumId
                  AND kk.siak_mata_kuliah_id IN (:mkIds)
                  AND rkm.nilai_akhir IS NOT NULL
            `;
            dataNilai = await sequelize.query(queryNilai, { replacements: { prodiId, angkatan, tahunKurikulumId, mkIds }, type: QueryTypes.SELECT });
        }

        // 6. Gabungkan Data dan Hitung Rerata & Capaian
        const resultMahasiswa = mhsList.map(mhs => {
            const row = { id: mhs.id, npm: mhs.npm, nama: mhs.nama, scores: {} };
            let sum = 0; let count = 0;

            dataNilai.filter(dn => dn.mahasiswa_id === mhs.id).forEach(dn => {
                const nilai = parseFloat(dn.nilai_akhir) || 0;
                row.scores[dn.mk_id] = nilai;
                sum += nilai;
                count++;
            });

            row.rerata = count > 0 ? (sum / count) : 0;
            row.capaian = row.rerata / 10; // Standar perhitungan capaian UIKA

            return row;
        });

        return {
            info: {
                tahunKurikulum: obeData.tahunKurikulum?.tahun || '-',
                programStudi: `S1 - ${obeData.programStudi?.nama || '-'}`,
                angkatan: angkatan,
                totalMahasiswa: mhsList.length,
                useKop: String(useKop).toLowerCase() === 'true'
            },
            cpl: { kode: cplData.kode, deskripsi: cplData.deskripsi },
            semesters: semesters,
            mkList: mkList, // Digunakan untuk urutan kolom
            dataMahasiswa: resultMahasiswa
        };
    } catch (error) {
        if (error.status) throw error;
        throw new CustomError.InternalServerError("Gagal menghitung Laporan: " + error.message);
    }
};
// ============================================================================
// 6. MONITORING TRANSKRIP OBE (PER 1 MAHASISWA)
// ============================================================================
// export const getTranskripObeMahasiswa = async (filters) => {
//     const { tahunKurikulumId, prodiId, mahasiswaId, useKop } = filters;
//     const { sequelize } = models;

//     try {
//         // 1. AMBIL INFO OBE
//         const queryInfo = `
//             SELECT o.id AS obe_id, ps.nama AS prodi_nama, tk.tahun AS tahun_kurikulum
//             FROM siak_obe o
//             LEFT JOIN siak_program_studi ps ON o.siak_program_studi_id = ps.id
//             LEFT JOIN siak_tahun_kurikulum tk ON o.siak_tahun_kurikulum_id = tk.id
//             WHERE o.siak_tahun_kurikulum_id = :tahunKurikulumId 
//               AND o.siak_program_studi_id = :prodiId
//             LIMIT 1
//         `;
//         const obeData = await sequelize.query(queryInfo, { replacements: { tahunKurikulumId, prodiId }, type: QueryTypes.SELECT });
//         if (!obeData || obeData.length === 0) throw new CustomError.NotFoundError("Data OBE tidak ditemukan.");
//         const infoObe = obeData[0];

//         // 2. AMBIL DATA MAHASISWA
//         const queryMhs = `
//             SELECT id, npm, nama, angkatan 
//             FROM siak_mahasiswa 
//             WHERE id = :mahasiswaId 
//             LIMIT 1
//         `;
//         const mhsData = await sequelize.query(queryMhs, { replacements: { mahasiswaId }, type: QueryTypes.SELECT });
//         if (!mhsData || mhsData.length === 0) throw new CustomError.NotFoundError("Data Mahasiswa tidak ditemukan.");
//         const infoMhs = mhsData[0];

//         const currentYear = new Date().getFullYear();
//         const currentMonth = new Date().getMonth() + 1;
//         let semester = (currentYear - parseInt(infoMhs.angkatan)) * 2;
//         if (currentMonth > 7) semester += 1;
//         if (semester < 1) semester = 1;

//         // 3. AMBIL DATA CPL
//         const queryCpl = `
//             SELECT id, kode, deskripsi 
//             FROM siak_capaian_pembelajaran_lulusan 
//             WHERE siak_obe_id = :obeId 
//             ORDER BY kode ASC
//         `;
//         const cplList = await sequelize.query(queryCpl, { replacements: { obeId: infoObe.obe_id }, type: QueryTypes.SELECT });

//         // 4. HITUNG TOTAL MK PER CPL
//         const queryTotalMapped = `
//             SELECT pcm.siak_capaian_pembelajaran_lulusan_id as cpl_id, COUNT(pcm.siak_mata_kuliah_id) as total_mk
//             FROM siak_pemetaan_cpl_mata_kuliah pcm
//             JOIN siak_capaian_pembelajaran_lulusan cpl ON pcm.siak_capaian_pembelajaran_lulusan_id = cpl.id
//             WHERE cpl.siak_obe_id = :obeId
//             GROUP BY pcm.siak_capaian_pembelajaran_lulusan_id
//         `;
//         const totalMappedData = await sequelize.query(queryTotalMapped, { replacements: { obeId: infoObe.obe_id }, type: QueryTypes.SELECT });
//         const mappedMap = {};
//         totalMappedData.forEach(row => { mappedMap[row.cpl_id] = parseInt(row.total_mk); });

//         // 5. TARIK NILAI ASLI MAHASISWA
//         const queryScores = `
//             SELECT pcm.siak_capaian_pembelajaran_lulusan_id AS cpl_id, rkm.nilai_akhir
//             FROM siak_krs_mahasiswa km
//             JOIN siak_rincian_krs_mahasiswa rkm ON km.id = rkm.siak_krs_mahasiswa_id
//             JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id
//             JOIN siak_pemetaan_cpl_mata_kuliah pcm ON kk.siak_mata_kuliah_id = pcm.siak_mata_kuliah_id
//             WHERE km.siak_mahasiswa_id = :mahasiswaId AND rkm.nilai_akhir IS NOT NULL
//         `;
//         const scoreData = await sequelize.query(queryScores, { replacements: { mahasiswaId: infoMhs.id }, type: QueryTypes.SELECT });

//         // 6. KALKULASI HASIL
//         const cplResults = [];
//         let cplTertinggi = { nilai: -1, kode: "" };
//         let cplTerendah = { nilai: 999, kode: "" };

//         const uniqueCpls = [];
//         const seenCpls = new Set();
//         cplList.forEach(c => {
//             if (!seenCpls.has(c.kode)) { seenCpls.add(c.kode); uniqueCpls.push(c); }
//         });

//         uniqueCpls.forEach(cpl => {
//             const scores = scoreData.filter(s => s.cpl_id === cpl.id).map(s => parseFloat(s.nilai_akhir));
//             const countTaken = scores.length;
//             const sumScores = scores.reduce((a, b) => a + b, 0);
//             const totalMapped = mappedMap[cpl.id] || 0;

//             const rerata = countTaken > 0 ? (sumScores / countTaken) : 0;
//             const capaian = totalMapped > 0 ? (sumScores / totalMapped) : 0;
//             const target = parseFloat(cpl.target_cpl) || 0; // Ambil dari DB, bukan hardcode 0

//             let status = "Belum Dinilai";
//             if (countTaken > 0) {
//                 status = rerata >= target ? "Sudah Memenuhi" : "Belum Memenuhi";
//             }

//             if (rerata > 0) {
//                 if (rerata > cplTertinggi.nilai) { cplTertinggi.nilai = rerata; cplTertinggi.kode = cpl.kode; }
//                 if (rerata < cplTerendah.nilai) { cplTerendah.nilai = rerata; cplTerendah.kode = cpl.kode; }
//             }

//             cplResults.push({
//                 kode: cpl.kode,
//                 deskripsi: cpl.deskripsi,
//                 target: target,
//                 rerata: rerata,
//                 status: status,
//                 capaian: capaian,
//                 progres: `${countTaken}/${totalMapped}`
//             });
//         });

//         // 7. FORMAT DATA UNTUK EXPORT PDF
//         return {
//             info: {
//                 tahunKurikulum: infoObe.tahun_kurikulum || '-',
//                 programStudi: `S1 - ${infoObe.prodi_nama || '-'}`,
//                 angkatan: infoMhs.angkatan,
//                 nim: infoMhs.npm,
//                 nama: infoMhs.nama,
//                 semester: `${semester} (Ganjil/Genap)`,
//                 useKop: String(useKop).toLowerCase() === 'true'
//             },
//             tabel: cplResults,
//             summary: {
//                 tertinggi: { nilai: cplTertinggi.nilai > -1 ? cplTertinggi.nilai.toFixed(2).replace('.', ',') : "0,00", kode: cplTertinggi.kode },
//                 terendah: { nilai: cplTerendah.nilai < 999 ? cplTerendah.nilai.toFixed(2).replace('.', ',') : "0,00", kode: cplTerendah.kode }
//             },
//             chart: {
//                 // 🟢 FIX: Array 2 dimensi agar teks di Spiderchart jadi 2 baris (CPL01 di atas, nilai di bawah)
//                 labels: cplResults.map(c => [c.kode, c.rerata > 0 ? c.rerata.toFixed(2) : "0"]),
//                 datasets: [
//                     { data: cplResults.map(c => parseFloat(c.rerata.toFixed(2))) },
//                     { data: cplResults.map(c => parseFloat(c.target.toFixed(2))) }
//                 ]
//             }
//         };
//     } catch (error) {
//         throw new CustomError.InternalServerError("Gagal menghitung Transkrip OBE: " + error.message);
//     }
// };
// ============================================================================
// 6. MONITORING TRANSKRIP OBE (PER 1 MAHASISWA) - ANTI HANTU & AUTO MERAH
// ============================================================================
export const getTranskripObeMahasiswa = async (filters) => {
    const { tahunKurikulumId, prodiId, mahasiswaId, useKop } = filters;
    const { sequelize } = models;

    try {
        // 1. AMBIL DATA MAHASISWA dulu (Pastikan tidak terhapus) -- dipindah ke atas
        // supaya prodiId bisa diturunkan dari data mahasiswa kalau caller tidak mengirimnya.
        const queryMhs = `
            SELECT id, npm, nama, angkatan, siak_program_studi_id
            FROM siak_mahasiswa
            WHERE id = :mahasiswaId AND deleted_at IS NULL
            LIMIT 1
        `;
        const mhsData = await sequelize.query(queryMhs, { replacements: { mahasiswaId }, type: QueryTypes.SELECT });
        if (!mhsData || mhsData.length === 0) throw new CustomError.NotFoundError("Data Mahasiswa tidak ditemukan.");
        const infoMhs = mhsData[0];

        // 2. AMBIL INFO OBE -- prodiId & tahunKurikulumId OPSIONAL dari caller. Kalau tidak
        // dikirim, prodiId diturunkan dari mahasiswa, dan OBE dipilih dari kurikulum TERBARU
        // milik prodi itu (bukan 500 crash karena named replacement kosong).
        const prodiIdAsli = prodiId || infoMhs.siak_program_studi_id;
        const queryInfo = `
            SELECT o.id AS obe_id, ps.nama AS prodi_nama, tk.tahun AS tahun_kurikulum
            FROM siak_obe o
            LEFT JOIN siak_program_studi ps ON o.siak_program_studi_id = ps.id
            LEFT JOIN siak_tahun_kurikulum tk ON o.siak_tahun_kurikulum_id = tk.id
            WHERE o.siak_program_studi_id = :prodiId
              AND (:tahunKurikulumId::uuid IS NULL OR o.siak_tahun_kurikulum_id = :tahunKurikulumId)
              AND o.deleted_at IS NULL
            ORDER BY tk.tahun DESC
            LIMIT 1
        `;
        const obeData = await sequelize.query(queryInfo, { replacements: { tahunKurikulumId: tahunKurikulumId || null, prodiId: prodiIdAsli }, type: QueryTypes.SELECT });
        if (!obeData || obeData.length === 0) throw new CustomError.NotFoundError("Data OBE tidak ditemukan.");
        const infoObe = obeData[0];

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        let semester = (currentYear - parseInt(infoMhs.angkatan)) * 2;
        if (currentMonth > 7) semester += 1;
        if (semester < 1) semester = 1;

        // 3. AMBIL DATA CPL (Pastikan tidak terhapus)
        const queryCpl = `
            SELECT id, kode, deskripsi, COALESCE(target_cpl, 0) AS target_cpl 
            FROM siak_capaian_pembelajaran_lulusan 
            WHERE siak_obe_id = :obeId AND deleted_at IS NULL
            ORDER BY kode ASC
        `;
        const cplList = await sequelize.query(queryCpl, { replacements: { obeId: infoObe.obe_id }, type: QueryTypes.SELECT });

        // 4. HITUNG TOTAL MK PER CPL (Cegah pembagi error/ganda dari MK terhapus)
        const queryTotalMapped = `
            SELECT pcm.siak_capaian_pembelajaran_lulusan_id as cpl_id, COUNT(pcm.siak_mata_kuliah_id) as total_mk
            FROM siak_pemetaan_cpl_mata_kuliah pcm
            JOIN siak_capaian_pembelajaran_lulusan cpl ON pcm.siak_capaian_pembelajaran_lulusan_id = cpl.id AND cpl.deleted_at IS NULL
            JOIN siak_mata_kuliah mk ON pcm.siak_mata_kuliah_id = mk.id AND mk.deleted_at IS NULL
            WHERE cpl.siak_obe_id = :obeId 
            GROUP BY pcm.siak_capaian_pembelajaran_lulusan_id
        `;
        const totalMappedData = await sequelize.query(queryTotalMapped, { replacements: { obeId: infoObe.obe_id }, type: QueryTypes.SELECT });
        const mappedMap = {};
        totalMappedData.forEach(row => { mappedMap[row.cpl_id] = parseInt(row.total_mk); });

        // 5. TARIK NILAI CPMK BERBOBOT MAHASISWA (bukan nilai_akhir MK keseluruhan,
        //    supaya 1 MK yang berkontribusi ke beberapa CPL tidak disamakan nilainya)
        // 🟢 FIX MUTLAK: TAMBAHKAN `deleted_at IS NULL` AGAR DATA KRS HANTU TIDAK IKUT KEHITUNG!
        // GROUP BY kk.id (kelas), BUKAN rkm.id (baris KRS) -- supaya kalau mahasiswa kebetulan
        // punya >1 baris KRS untuk kelas yang sama (data KRS duplikat), kontribusinya tetap
        // dihitung 1x saja, bukan tertimbang 2x lipat ke rerata CPL.
        const queryScores = `
            SELECT
                pcc.siak_capaian_pembelajaran_lulusan_id AS cpl_id,
                kk.id AS kelas_id,
                SUM(ncm.nilai * pcc.bobot_cpl) AS sum_weighted,
                SUM(pcc.bobot_cpl) AS sum_bobot
            FROM siak_krs_mahasiswa km
            JOIN siak_rincian_krs_mahasiswa rkm ON km.id = rkm.siak_krs_mahasiswa_id AND rkm.deleted_at IS NULL
            JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id AND kk.deleted_at IS NULL
            JOIN siak_nilai_cpmk_mahasiswa ncm ON ncm.siak_kelas_kuliah_id = kk.id
                                               AND ncm.siak_mahasiswa_id = km.siak_mahasiswa_id
                                               AND ncm.deleted_at IS NULL
            JOIN siak_pemetaan_cpl_cpmk pcc ON pcc.siak_capaian_mata_kuliah_id = ncm.siak_capaian_mata_kuliah_id
                                            AND pcc.deleted_at IS NULL
            WHERE km.siak_mahasiswa_id = :mahasiswaId
              AND km.deleted_at IS NULL
              AND ncm.nilai IS NOT NULL
            GROUP BY pcc.siak_capaian_pembelajaran_lulusan_id, kk.id
        `;
        const scoreDataRaw = await sequelize.query(queryScores, { replacements: { mahasiswaId: infoMhs.id }, type: QueryTypes.SELECT });
        const scoreData = scoreDataRaw
            .filter(row => parseFloat(row.sum_bobot) > 0)
            .map(row => ({
                cpl_id: row.cpl_id,
                nilai_akhir: parseFloat(row.sum_weighted) / parseFloat(row.sum_bobot)
            }));

        // 6. KALKULASI HASIL
        const cplResults = [];
        let cplTertinggi = { nilai: -1, kode: "" };
        let cplTerendah = { nilai: 999, kode: "" };

        const uniqueCpls = [];
        const seenCpls = new Set();
        cplList.forEach(c => {
            if (!seenCpls.has(c.kode)) { seenCpls.add(c.kode); uniqueCpls.push(c); }
        });

        uniqueCpls.forEach(cpl => {
            const scores = scoreData.filter(s => s.cpl_id === cpl.id).map(s => parseFloat(s.nilai_akhir));
            const countTaken = scores.length;
            const sumScores = scores.reduce((a, b) => a + b, 0);
            const totalMapped = mappedMap[cpl.id] || 0;

            const rerata = countTaken > 0 ? (sumScores / countTaken) : 0;
            const capaian = totalMapped > 0 ? (sumScores / totalMapped) : 0;

            // 🟢 LOGIKA CERDAS: Kalau Kaprodi lupa ngeset target (0), kita default ke 60
            // Biar nilai E (31.69) langsung tertangkap sebagai GAGAL / MERAH!
            const dbTarget = parseFloat(cpl.target_cpl) || 0;
            const targetThreshold = dbTarget > 0 ? dbTarget : 60;

            let status = "Belum Dinilai";
            if (countTaken > 0) {
                status = rerata >= targetThreshold ? "Sudah Memenuhi" : "Belum Memenuhi";
            }

            if (rerata > 0) {
                if (rerata > cplTertinggi.nilai) { cplTertinggi.nilai = rerata; cplTertinggi.kode = cpl.kode; }
                if (rerata < cplTerendah.nilai) { cplTerendah.nilai = rerata; cplTerendah.kode = cpl.kode; }
            }

            cplResults.push({
                kode: cpl.kode,
                deskripsi: cpl.deskripsi,
                target: dbTarget, // Tetap tampilkan 0 di PDF/JSON kalau aslinya 0 (biar jujur ke dosen)
                rerata: rerata,
                status: status,
                capaian: capaian,
                progres: `${countTaken}/${totalMapped}`
            });
        });

        // 7. FORMAT DATA UNTUK EXPORT PDF/JSON
        return {
            info: {
                tahunKurikulum: infoObe.tahun_kurikulum || '-',
                programStudi: `S1 - ${infoObe.prodi_nama || '-'}`,
                angkatan: infoMhs.angkatan,
                nim: infoMhs.npm,
                nama: infoMhs.nama,
                semester: `${semester} (Ganjil/Genap)`,
                useKop: String(useKop).toLowerCase() === 'true'
            },
            tabel: cplResults,
            summary: {
                tertinggi: { nilai: cplTertinggi.nilai > -1 ? cplTertinggi.nilai.toFixed(2).replace('.', ',') : "0,00", kode: cplTertinggi.kode },
                terendah: { nilai: cplTerendah.nilai < 999 ? cplTerendah.nilai.toFixed(2).replace('.', ',') : "0,00", kode: cplTerendah.kode }
            },
            chart: {
                labels: cplResults.map(c => [c.kode, c.rerata > 0 ? c.rerata.toFixed(2) : "0"]),
                datasets: [
                    { data: cplResults.map(c => parseFloat(c.rerata.toFixed(2))) },
                    { data: cplResults.map(c => parseFloat(c.target.toFixed(2))) }
                ]
            }
        };
    } catch (error) {
        if (error.status) throw error;
        throw new CustomError.InternalServerError("Gagal menghitung Transkrip OBE: " + error.message);
    }
};
// ============================================================================
// 7. MONITORING CPMK PER MAHASISWA (FILTER BY MATA KULIAH)
// ============================================================================
// export const getLaporanCpmkPerMahasiswa = async (filters) => {
//     const { tahunKurikulumId, prodiId, mataKuliahId, angkatan, useKop } = filters;
//     const { sequelize } = models;

//     try {
//         // 1. INFO MASTER OBE & PRODI
//         const queryInfo = `
//             SELECT o.id AS obe_id, ps.nama AS prodi_nama, tk.tahun AS tahun_kurikulum
//             FROM siak_obe o
//             LEFT JOIN siak_program_studi ps ON o.siak_program_studi_id = ps.id
//             LEFT JOIN siak_tahun_kurikulum tk ON o.siak_tahun_kurikulum_id = tk.id
//             WHERE o.siak_tahun_kurikulum_id = :tahunKurikulumId 
//               AND o.siak_program_studi_id = :prodiId
//             LIMIT 1
//         `;
//         const obeData = await sequelize.query(queryInfo, {
//             replacements: { tahunKurikulumId, prodiId },
//             type: QueryTypes.SELECT
//         });
//         if (!obeData || obeData.length === 0)
//             throw new CustomError.NotFoundError("Data OBE tidak ditemukan.");
//         const infoObe = obeData[0];

//         // 2. INFO MATA KULIAH
//         const queryMk = `SELECT id, kode, nama FROM siak_mata_kuliah WHERE id = :mataKuliahId LIMIT 1`;
//         const mkData = await sequelize.query(queryMk, {
//             replacements: { mataKuliahId },
//             type: QueryTypes.SELECT
//         });
//         if (!mkData || mkData.length === 0)
//             throw new CustomError.NotFoundError("Data Mata Kuliah tidak ditemukan.");
//         const infoMk = mkData[0];

//         // 3. AMBIL DATA CPMK
//         const queryCpmk = `
//             SELECT id, kode, deskripsi, 
//                    COALESCE(target_cpmk, 0) AS target 
//             FROM siak_capaian_mata_kuliah
//             WHERE siak_mata_kuliah_id = :mataKuliahId 
//             ORDER BY kode ASC
//         `;
//         let cpmkList = [];
//         try {
//             cpmkList = await sequelize.query(queryCpmk, {
//                 replacements: { mataKuliahId },
//                 type: QueryTypes.SELECT
//             });
//         } catch (e) {
//             const queryCpmkFallback = `
//                 SELECT id, kode, deskripsi, '0' AS target 
//                 FROM siak_capaian_mata_kuliah 
//                 WHERE siak_mata_kuliah_id = :mataKuliahId 
//                 ORDER BY kode ASC
//             `;
//             cpmkList = await sequelize.query(queryCpmkFallback, {
//                 replacements: { mataKuliahId },
//                 type: QueryTypes.SELECT
//             });
//         }

//         // 4. AMBIL DATA MAHASISWA
//         const queryMhs = `
//             SELECT id, npm, nama 
//             FROM siak_mahasiswa 
//             WHERE siak_program_studi_id = :prodiId AND angkatan = :angkatan
//             ORDER BY npm ASC
//         `;
//         const mhsList = await sequelize.query(queryMhs, {
//             replacements: { prodiId, angkatan },
//             type: QueryTypes.SELECT
//         });

//         // 5. TARIK NILAI CPMK MAHASISWA
//         let scoreData = [];
//         if (mhsList.length > 0 && cpmkList.length > 0) {
//             const queryScores = `
//                 SELECT n.siak_mahasiswa_id AS mahasiswa_id, 
//                        n.siak_capaian_mata_kuliah_id AS cpmk_id, 
//                        n.nilai
//                 FROM siak_nilai_cpmk_mahasiswa n
//                 JOIN siak_kelas_kuliah kk ON n.siak_kelas_kuliah_id = kk.id
//                 WHERE kk.siak_mata_kuliah_id = :mataKuliahId
//             `;
//             try {
//                 scoreData = await sequelize.query(queryScores, {
//                     replacements: { mataKuliahId },
//                     type: QueryTypes.SELECT
//                 });
//             } catch (e) {
//                 try {
//                     const fallbackQuery = `
//                         SELECT siak_mahasiswa_id AS mahasiswa_id, siak_cpmk_id AS cpmk_id, nilai 
//                         FROM siak_nilai_cpmk_mahasiswa n 
//                         JOIN siak_kelas_kuliah kk ON n.siak_kelas_kuliah_id = kk.id 
//                         WHERE kk.siak_mata_kuliah_id = :mataKuliahId
//                     `;
//                     scoreData = await sequelize.query(fallbackQuery, {
//                         replacements: { mataKuliahId },
//                         type: QueryTypes.SELECT
//                     });
//                 } catch (err2) {
//                     console.log("Tabel nilai CPMK tidak ditemukan atau berbeda nama, menggunakan data kosong.");
//                 }
//             }
//         }

//         // 6. GABUNGKAN DATA MAHASISWA & NILAI CPMK
//         const dataMahasiswa = mhsList.map(mhs => {
//             const row = { id: mhs.id, npm: mhs.npm, nama: mhs.nama, cpmk: {} };
//             let isMemenuhi = true;
//             let hasNilai = false;

//             cpmkList.forEach(cpmk => {
//                 const scoreRecord = scoreData.find(
//                     s => s.mahasiswa_id === mhs.id && s.cpmk_id === cpmk.id
//                 );
//                 const nilai = scoreRecord ? parseFloat(scoreRecord.nilai) : null;
//                 row.cpmk[cpmk.kode] = nilai;

//                 if (nilai !== null) {
//                     hasNilai = true;
//                     if (nilai < parseFloat(cpmk.target)) isMemenuhi = false;
//                 }
//             });

//             row.status = !hasNilai
//                 ? "Belum Dinilai"
//                 : isMemenuhi ? "Sudah Memenuhi" : "Belum Memenuhi";

//             return row;
//         });

//         return {
//             info: {
//                 tahunKurikulum: infoObe.tahun_kurikulum || '-',
//                 programStudi: `S1 - ${infoObe.prodi_nama || '-'}`,
//                 mataKuliah: `${infoMk.kode} - ${infoMk.nama}`,
//                 angkatan: angkatan,
//                 useKop: String(useKop).toLowerCase() === 'true'
//             },
//             daftarCpmk: cpmkList.map(c => ({
//                 kode: c.kode,
//                 deskripsi: c.deskripsi,
//                 target: parseFloat(c.target)
//             })),
//             dataMahasiswa: dataMahasiswa
//         };
//     } catch (error) {
//         throw new CustomError.InternalServerError(
//             "Gagal menghitung CPMK per Mahasiswa: " + error.message
//         );
//     }
// };

// export const getLaporanCpmkPerMahasiswa = async (filters) => {
//     const { tahunKurikulumId, prodiId, mataKuliahId, angkatan, useKop } = filters;
//     const { sequelize } = models;

//     try {
//         // 1. INFO MASTER OBE & PRODI
//         const queryInfo = `
//             SELECT o.id AS obe_id, ps.nama AS prodi_nama, tk.tahun AS tahun_kurikulum
//             FROM siak_obe o
//             LEFT JOIN siak_program_studi ps ON o.siak_program_studi_id = ps.id
//             LEFT JOIN siak_tahun_kurikulum tk ON o.siak_tahun_kurikulum_id = tk.id
//             WHERE o.siak_tahun_kurikulum_id = :tahunKurikulumId 
//               AND o.siak_program_studi_id = :prodiId
//             LIMIT 1
//         `;
//         const obeData = await sequelize.query(queryInfo, {
//             replacements: { tahunKurikulumId, prodiId },
//             type: QueryTypes.SELECT
//         });
//         if (!obeData || obeData.length === 0) throw new CustomError.NotFoundError("Data OBE tidak ditemukan.");
//         const infoObe = obeData[0];

//         // 2. INFO MATA KULIAH
//         const queryMk = `SELECT id, kode, nama FROM siak_mata_kuliah WHERE id = :mataKuliahId LIMIT 1`;
//         const mkData = await sequelize.query(queryMk, { replacements: { mataKuliahId }, type: QueryTypes.SELECT });
//         if (!mkData || mkData.length === 0) throw new CustomError.NotFoundError("Data Mata Kuliah tidak ditemukan.");
//         const infoMk = mkData[0];

//         // 3. AMBIL DATA CPMK
//         const queryCpmk = `
//             SELECT id, kode, deskripsi, COALESCE(target, 0) AS target 
//             FROM siak_capaian_mata_kuliah
//             WHERE siak_mata_kuliah_id = :mataKuliahId 
//               AND parent_id IS NULL AND deleted_at IS NULL
//             ORDER BY kode ASC
//         `;
//         let cpmkList = [];
//         try {
//             cpmkList = await sequelize.query(queryCpmk, { replacements: { mataKuliahId }, type: QueryTypes.SELECT });
//         } catch (e) {
//             console.error("Gagal get CPMK:", e.message);
//         }

//         // 4. AMBIL DATA MAHASISWA
//         const queryMhs = `
//             SELECT id, npm, nama 
//             FROM siak_mahasiswa 
//             WHERE siak_program_studi_id = :prodiId AND angkatan = :angkatan
//             ORDER BY npm ASC
//         `;
//         const mhsList = await sequelize.query(queryMhs, { replacements: { prodiId, angkatan }, type: QueryTypes.SELECT });

//         // 5. TARIK NILAI DARI EVALUASI (Tugas, UTS, UAS) DAN JOIN KE MAPPING CPMK
//         let scoreData = [];
//         if (mhsList.length > 0 && cpmkList.length > 0) {
//             const queryScores = `
//                 SELECT 
//                     m.id AS mahasiswa_id, 
//                     pkc.siak_cpmk_id AS cpmk_id, 
//                     nem.skor, 
//                     kn.persentase AS bobot_komposisi
//                 FROM siak_mahasiswa m
//                 JOIN siak_krs_mahasiswa km ON m.id = km.siak_mahasiswa_id
//                 JOIN siak_rincian_krs_mahasiswa rkm ON km.id = rkm.siak_krs_mahasiswa_id
//                 JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id
//                 JOIN siak_nilai_evaluasi_mahasiswa nem ON rkm.id = nem.siak_rincian_krs_mahasiswa_id
//                 JOIN siak_komposisi_nilai_mata_kuliah kn ON nem.siak_komposisi_nilai_id = kn.id
//                 JOIN siak_pemetaan_komposisi_cpmk pkc ON kn.id = pkc.siak_komposisi_nilai_id
//                 WHERE kk.siak_mata_kuliah_id = :mataKuliahId
//                   AND m.siak_program_studi_id = :prodiId
//                   AND m.angkatan = :angkatan
//                   AND nem.deleted_at IS NULL
//             `;

//             try {
//                 scoreData = await sequelize.query(queryScores, {
//                     replacements: { mataKuliahId, prodiId, angkatan },
//                     type: QueryTypes.SELECT
//                 });
//             } catch (e) {
//                 console.error("🔥 ERROR QUERY NILAI EVALUASI:", e.message);
//             }
//         }

//         // 6. GABUNGKAN DATA & KALKULASI NILAI CPMK ON THE FLY
//         const dataMahasiswa = mhsList.map(mhs => {
//             const row = { id: mhs.id, npm: mhs.npm, nama: mhs.nama, cpmk: {} };

//             // Ambil array skor mentah milik mahasiswa ini saja
//             const mhsScores = scoreData.filter(s => s.mahasiswa_id === mhs.id);

//             let isMemenuhi = true;
//             let hasNilai = false;

//             cpmkList.forEach(cpmk => {
//                 // Tarik komponen nilai (Tugas/UTS/UAS) yang nge-link ke CPMK ini
//                 const relatedScores = mhsScores.filter(s => s.cpmk_id === cpmk.id);

//                 if (relatedScores.length > 0) {
//                     hasNilai = true;
//                     let totalSkorTerbobot = 0;
//                     let totalBobotMaksimal = 0;

//                     // Rumus: (Skor Mentah * Bobot Komposisi%) 
//                     relatedScores.forEach(rs => {
//                         const skorAsli = parseFloat(rs.skor) || 0;
//                         const bobotPersentase = parseFloat(rs.bobot_komposisi) / 100;

//                         totalSkorTerbobot += skorAsli * bobotPersentase;
//                         totalBobotMaksimal += bobotPersentase * 100; // Akumulasi total persen (misal: UTS 20% + UAS 30% = 50%)
//                     });

//                     // Persentase akhir CPMK = (Total Skor / Total Bobot Maks) * 100
//                     let persentaseAkhir = 0;
//                     if (totalBobotMaksimal > 0) {
//                         persentaseAkhir = (totalSkorTerbobot / totalBobotMaksimal) * 100;
//                     }

//                     // Pembulatan rapi maksimal 2 desimal
//                     const nilaiAkhirCpmk = Math.round(persentaseAkhir * 100) / 100;
//                     row.cpmk[cpmk.kode] = nilaiAkhirCpmk;

//                     // Cek kelulusan target
//                     if (nilaiAkhirCpmk < parseFloat(cpmk.target)) {
//                         isMemenuhi = false;
//                     }
//                 } else {
//                     row.cpmk[cpmk.kode] = null;
//                 }
//             });

//             row.status = !hasNilai
//                 ? "Belum Dinilai"
//                 : (isMemenuhi ? "Sudah Memenuhi" : "Belum Memenuhi");

//             return row;
//         });

//         return {
//             info: {
//                 tahunKurikulum: infoObe.tahun_kurikulum || '-',
//                 programStudi: `S1 - ${infoObe.prodi_nama || '-'}`,
//                 mataKuliah: `${infoMk.kode} - ${infoMk.nama}`,
//                 angkatan: angkatan,
//                 useKop: String(useKop).toLowerCase() === 'true'
//             },
//             daftarCpmk: cpmkList.map(c => ({
//                 kode: c.kode,
//                 deskripsi: c.deskripsi,
//                 target: parseFloat(c.target)
//             })),
//             dataMahasiswa: dataMahasiswa
//         };
//     } catch (error) {
//         throw new CustomError.InternalServerError(
//             "Gagal menghitung CPMK per Mahasiswa: " + error.message
//         );
//     }
// };
// ============================================================================
// 7. MONITORING CPMK PER MAHASISWA (ULTIMATE DEBUG VERSION)
// ============================================================================
export const getLaporanCpmkPerMahasiswa = async (filters) => {
    const { tahunKurikulumId, prodiId, mataKuliahId, angkatan, useKop } = filters;
    const { sequelize } = models; // Gunakan instance sequelize dari models

    try {
        // 1. INFO MASTER OBE & PRODI
        const queryInfo = `SELECT o.id AS obe_id, ps.nama AS prodi_nama, tk.tahun AS tahun_kurikulum FROM siak_obe o LEFT JOIN siak_program_studi ps ON o.siak_program_studi_id = ps.id LEFT JOIN siak_tahun_kurikulum tk ON o.siak_tahun_kurikulum_id = tk.id WHERE o.siak_tahun_kurikulum_id = :tahunKurikulumId AND o.siak_program_studi_id = :prodiId LIMIT 1`;
        const obeData = await sequelize.query(queryInfo, { replacements: { tahunKurikulumId, prodiId }, type: sequelize.QueryTypes.SELECT });
        const infoObe = obeData[0] || {};

        // 2. INFO MATA KULIAH
        const queryMk = `SELECT id, kode, nama FROM siak_mata_kuliah WHERE id = :mataKuliahId LIMIT 1`;
        const mkData = await sequelize.query(queryMk, { replacements: { mataKuliahId }, type: sequelize.QueryTypes.SELECT });
        const infoMk = mkData[0] || {};

        // 3. AMBIL DATA CPMK (leaf-level: Sub-CPMK jika ada, atau CPMK itu sendiri jika tidak)
        const { columns: cpmkList, hasSubCpmk } = await getCpmkColumnsForMataKuliah(mataKuliahId);

        // 4. AMBIL DATA MAHASISWA
        const queryMhs = `SELECT id, npm, nama FROM siak_mahasiswa WHERE siak_program_studi_id = :prodiId AND angkatan = :angkatan ORDER BY npm ASC`;
        const mhsList = await sequelize.query(queryMhs, { replacements: { prodiId, angkatan }, type: sequelize.QueryTypes.SELECT });

        // 5. TARIK NILAI DARI EVALUASI (AMBIL ID & KODE SEKALIGUS)
        //
        // ── Cabang ADITIF (Jalur C — per soal, atau Jalur D — integrasi CBT) ──
        // Kalau MK ini punya data di siak_nilai_soal_mahasiswa (Jalur C) ATAU
        // siak_nilai_subcpmk_evaluasi_mahasiswa (Jalur D), berarti NilaiCpmkMahasiswa
        // SUDAH dimaterialisasi akurat (lihat services/soal.service.js dan
        // services/cbt.service.js). Baca dari sana langsung, JANGAN hitung ulang
        // proporsional (kode lama di bawah). Kalau TIDAK ada data Jalur C/D
        // (mayoritas, semua data lama), jalankan kode lama persis seperti
        // sebelumnya — TIDAK DIUBAH.
        let scoreData = [];
        if (mhsList.length > 0 && cpmkList.length > 0) {
            const cekJalurCatauD = await sequelize.query(`
                SELECT 1
                FROM siak_nilai_soal_mahasiswa nsm
                JOIN siak_rincian_krs_mahasiswa rkm ON nsm.siak_rincian_krs_mahasiswa_id = rkm.id AND rkm.deleted_at IS NULL
                JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id AND kk.deleted_at IS NULL
                WHERE kk.siak_mata_kuliah_id = :mataKuliahId
                  AND nsm.deleted_at IS NULL
                UNION ALL
                SELECT 1
                FROM siak_nilai_subcpmk_evaluasi_mahasiswa nsc
                JOIN siak_rincian_krs_mahasiswa rkm ON nsc.siak_rincian_krs_mahasiswa_id = rkm.id AND rkm.deleted_at IS NULL
                JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id AND kk.deleted_at IS NULL
                WHERE kk.siak_mata_kuliah_id = :mataKuliahId
                  AND nsc.deleted_at IS NULL
                LIMIT 1
            `, { replacements: { mataKuliahId }, type: sequelize.QueryTypes.SELECT });

            if (cekJalurCatauD.length > 0) {
                // Jalur C atau D aktif untuk MK ini, baca nilai CPMK yang sudah akurat
                const queryScoresJalurC = `
                    SELECT
                        m.id AS mahasiswa_id,
                        ncm.siak_capaian_mata_kuliah_id AS cpmk_id_langsung,
                        cpmk_master.kode AS cpmk_kode,
                        ncm.nilai AS skor,
                        1 AS bobot_cpmk
                    FROM siak_mahasiswa m
                    JOIN siak_krs_mahasiswa km ON m.id = km.siak_mahasiswa_id AND km.deleted_at IS NULL
                    JOIN siak_rincian_krs_mahasiswa rkm ON km.id = rkm.siak_krs_mahasiswa_id AND rkm.deleted_at IS NULL
                    JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id AND kk.deleted_at IS NULL
                    JOIN siak_nilai_cpmk_mahasiswa ncm ON ncm.siak_kelas_kuliah_id = kk.id
                                                        AND ncm.siak_mahasiswa_id = m.id
                                                        AND ncm.deleted_at IS NULL
                    JOIN siak_capaian_mata_kuliah cpmk_master ON ncm.siak_capaian_mata_kuliah_id = cpmk_master.id
                                                               AND cpmk_master.deleted_at IS NULL
                    WHERE kk.siak_mata_kuliah_id = :mataKuliahId
                      AND m.siak_program_studi_id = :prodiId
                      AND m.angkatan = :angkatan
                `;
                scoreData = await sequelize.query(queryScoresJalurC, { replacements: { mataKuliahId, prodiId, angkatan }, type: sequelize.QueryTypes.SELECT });
            } else {
                // Jalur A/B (kode lama, TIDAK DIUBAH)
                const queryScores = `
                    SELECT
                        m.id AS mahasiswa_id,
                        pec.siak_cpmk_id AS cpmk_id_langsung,
                        cpmk_master.kode AS cpmk_kode,
                        nem.skor,
                        pec.bobot_cpmk AS bobot_cpmk
                    FROM siak_mahasiswa m
                    JOIN siak_krs_mahasiswa km ON m.id = km.siak_mahasiswa_id AND km.deleted_at IS NULL
                    JOIN siak_rincian_krs_mahasiswa rkm ON km.id = rkm.siak_krs_mahasiswa_id AND rkm.deleted_at IS NULL
                    JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id AND kk.deleted_at IS NULL
                    JOIN siak_nilai_evaluasi_mahasiswa nem ON rkm.id = nem.siak_rincian_krs_mahasiswa_id AND nem.deleted_at IS NULL
                    JOIN siak_rencana_evaluasi re ON nem.siak_rencana_evaluasi_id = re.id AND re.deleted_at IS NULL
                        AND re.siak_periode_akademik_id = kk.siak_periode_akademik_id
                    JOIN siak_pemetaan_evaluasi_cpmk pec ON re.id = pec.siak_rencana_evaluasi_id AND pec.deleted_at IS NULL
                    JOIN siak_capaian_mata_kuliah cpmk_master ON pec.siak_cpmk_id = cpmk_master.id AND cpmk_master.deleted_at IS NULL
                    WHERE kk.siak_mata_kuliah_id = :mataKuliahId
                      AND m.siak_program_studi_id = :prodiId
                      AND m.angkatan = :angkatan
                `;
                scoreData = await sequelize.query(queryScores, { replacements: { mataKuliahId, prodiId, angkatan }, type: sequelize.QueryTypes.SELECT });
            }
        }

        // 6. GABUNGKAN DATA & KALKULASI NILAI CPMK ON THE FLY
        const dataMahasiswa = mhsList.map(mhs => {
            const row = { id: mhs.id, npm: mhs.npm, nama: mhs.nama, cpmk: {} };

            const currentMhsId = String(mhs.id).trim().toLowerCase();
            const mhsScores = scoreData.filter(s => String(s.mahasiswa_id).trim().toLowerCase() === currentMhsId);

            let isMemenuhi = true;
            let hasNilai = false;

            cpmkList.forEach(cpmk => {
                // 🟢 BRUTE FORCE: Cek ID langsung ATAU cek Kodenya (Pasti tembus salah satu!)
                const relatedScores = mhsScores.filter(s => {
                    const matchId = String(s.cpmk_id_langsung).trim() === String(cpmk.id).trim();
                    const matchKode = String(s.cpmk_kode).trim().toUpperCase() === String(cpmk.kode).trim().toUpperCase();
                    return matchId || matchKode;
                });

                if (relatedScores.length > 0) {
                    hasNilai = true;
                    let totalSkorTerbobot = 0;
                    let totalBobotMaksimal = 0;

                    relatedScores.forEach(rs => {
                        const skorAsli = parseFloat(rs.skor) || 0;
                        const bobotCpmk = parseFloat(rs.bobot_cpmk || 0);
                        totalSkorTerbobot += skorAsli * bobotCpmk;
                        totalBobotMaksimal += bobotCpmk;
                    });

                    let persentaseAkhir = totalBobotMaksimal > 0 ? (totalSkorTerbobot / totalBobotMaksimal) : 0;
                    const nilaiAkhirCpmk = Math.round(persentaseAkhir * 100) / 100;
                    row.cpmk[cpmk.kode] = nilaiAkhirCpmk;

                    if (nilaiAkhirCpmk < cpmk.target) isMemenuhi = false;
                } else {
                    row.cpmk[cpmk.kode] = null;
                }
            });

            row.status = !hasNilai ? "Belum Dinilai" : (isMemenuhi ? "Sudah Memenuhi" : "Belum Memenuhi");
            return row;
        });

        return {
            info: {
                tahunKurikulum: infoObe.tahun_kurikulum || '-',
                programStudi: `S1 - ${infoObe.prodi_nama || '-'}`,
                mataKuliah: `${infoMk.kode} - ${infoMk.nama}`,
                angkatan: angkatan,
                useKop: String(useKop).toLowerCase() === 'true'
            },
            daftarCpmk: cpmkList.map(c => ({
                kode: c.kode, deskripsi: c.deskripsi, target: c.target,
                parentKode: c.parentKode, parentDeskripsi: c.parentDeskripsi,
                groupSize: c.groupSize, isGroupFirst: c.isGroupFirst
            })),
            hasSubCpmk,
            dataMahasiswa: dataMahasiswa
        };
    } catch (error) {
        if (error.status) throw error;
        throw new CustomError.InternalServerError("Gagal menghitung CPMK per Mahasiswa: " + error.message);
    }
};