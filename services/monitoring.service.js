import models from '../models/index.js';
import { QueryTypes } from 'sequelize';
import * as CustomError from '../utils/custom-error.js';

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
                    sumNilai: 0, 
                    countData: 0, 
                    mhsRecord: {}
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
        // 4. (RAW SQL) Tarik Nilai Akhir & Cocokkan ke CPL
        // =================================================================
        const queryNilai = `
            SELECT 
                m.id AS mahasiswa_id,
                rkm.nilai_akhir,
                pcm.siak_capaian_pembelajaran_lulusan_id AS cpl_id
            FROM siak_mahasiswa m
            JOIN siak_krs_mahasiswa km ON m.id = km.siak_mahasiswa_id
            JOIN siak_rincian_krs_mahasiswa rkm ON km.id = rkm.siak_krs_mahasiswa_id
            JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id
            JOIN siak_pemetaan_cpl_mata_kuliah pcm ON kk.siak_mata_kuliah_id = pcm.siak_mata_kuliah_id
            WHERE m.siak_program_studi_id = :prodiId 
              AND m.angkatan = :angkatan
              AND rkm.nilai_akhir IS NOT NULL
        `;

        const dataNilai = await sequelize.query(queryNilai, {
            replacements: { prodiId, angkatan },
            type: QueryTypes.SELECT
        });

        // =================================================================
        // 5. EKSEKUSI PENILAIAN (Ke dalam keranjang Kode CPL)
        // =================================================================
        dataNilai.forEach(row => {
            const kodeCpl = uuidToKodeMap[row.cpl_id]; // Terjemahkan UUID jadi "CPL01"
            const mhsId = row.mahasiswa_id;
            const nilai = parseFloat(row.nilai_akhir) || 0;

            if (kodeCpl && cplScores[kodeCpl]) {
                // Untuk Rerata
                cplScores[kodeCpl].sumNilai += nilai;
                cplScores[kodeCpl].countData += 1;

                // Untuk Progresif
                const currMax = cplScores[kodeCpl].mhsRecord[mhsId] || 0;
                cplScores[kodeCpl].mhsRecord[mhsId] = Math.max(currMax, nilai);
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

        // Kita looping nilai-nilai yang sudah di-grouping
        Object.values(cplScores).forEach(stats => {
            let capaianAkhir = 0;

            if (metode === 'progresif') {
                const mhsIdsYangPunyaNilai = Object.keys(stats.mhsRecord);
                if (mhsIdsYangPunyaNilai.length > 0) {
                    const sumMax = mhsIdsYangPunyaNilai.reduce((sum, id) => sum + stats.mhsRecord[id], 0);
                    capaianAkhir = sumMax / mhsIdsYangPunyaNilai.length;
                }
            } else {
                if (stats.countData > 0) {
                    capaianAkhir = stats.sumNilai / stats.countData;
                }
            }

            capaianAkhir = parseFloat(capaianAkhir.toFixed(2));
            const target = parseFloat(stats.target) || 0;

            const mhsSudah = Object.keys(stats.mhsRecord).length;
            const mhsBelum = totalMahasiswa > 0 ? (totalMahasiswa - mhsSudah) : 0;

            chartLabels.push(stats.kode);
            chartDataCapaian.push(capaianAkhir);
            chartDataTarget.push(target);

            tabelDetail.push({
                kode: stats.kode,
                deskripsi: stats.deskripsi,
                target: target.toFixed(2).replace('.', ','),
                capaian: capaianAkhir > 0 ? capaianAkhir.toFixed(2).replace('.', ',') : "-",
                status: capaianAkhir === 0 ? "Belum Dinilai" : (capaianAkhir >= target ? "Tercapai" : "Belum Tercapai"),
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

        // 1. Ambil & Filter Duplikat CPL
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

        // 3. Tarik Nilai dari Database
        const queryNilai = `
            SELECT m.id AS mahasiswa_id, rkm.nilai_akhir, pcm.siak_capaian_pembelajaran_lulusan_id AS cpl_id
            FROM siak_mahasiswa m
            JOIN siak_krs_mahasiswa km ON m.id = km.siak_mahasiswa_id
            JOIN siak_rincian_krs_mahasiswa rkm ON km.id = rkm.siak_krs_mahasiswa_id
            JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id
            JOIN siak_pemetaan_cpl_mata_kuliah pcm ON kk.siak_mata_kuliah_id = pcm.siak_mata_kuliah_id
            WHERE m.siak_program_studi_id = :prodiId AND m.angkatan = :angkatan AND rkm.nilai_akhir IS NOT NULL
        `;

        const dataNilai = await sequelize.query(queryNilai, { replacements: { prodiId, angkatan }, type: QueryTypes.SELECT });

        dataNilai.forEach(row => {
            const kodeCpl = cplMap[row.cpl_id];
            const nilai = parseFloat(row.nilai_akhir) || 0;
            if (kodeCpl && mhsScores[row.mahasiswa_id]) {
                const target = mhsScores[row.mahasiswa_id].cpl[kodeCpl];
                target.sum += nilai;
                target.count += 1;
                if (nilai > target.max) target.max = nilai;
            }
        });

        // 4. Kalkulasi Rerata / Progresif
        const listMahasiswa = [];
        const rerataKolom = {};
        uniqueCpls.forEach(c => { rerataKolom[c.kode] = { sum: 0, count: 0 }; });

        Object.values(mhsScores).forEach(mhs => {
            const rowMhs = { npm: mhs.npm, nama: mhs.nama };
            uniqueCpls.forEach(cpl => {
                const stats = mhs.cpl[cpl.kode];
                let nilaiAkhir = null;
                if (stats.count > 0) {
                    nilaiAkhir = metode === 'progresif' ? stats.max : (stats.sum / stats.count);
                    rerataKolom[cpl.kode].sum += nilaiAkhir;
                    rerataKolom[cpl.kode].count += 1;
                }
                rowMhs[cpl.kode] = nilaiAkhir !== null ? parseFloat(nilaiAkhir.toFixed(2)) : null;
            });
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
            daftarCpl: uniqueCpls.map(c => ({ kode: c.kode, deskripsi: c.deskripsi })),
            dataMahasiswa: listMahasiswa,
            rerataCpl: rerataBawah,
            summary: {
                tertinggi: { nilai: cplTertinggi.nilai > -1 ? cplTertinggi.nilai.toFixed(2).replace('.', ',') : "0,00", kode: cplTertinggi.kode },
                terendah: { nilai: cplTerendah.nilai < 999 ? cplTerendah.nilai.toFixed(2).replace('.', ',') : "0,00", kode: cplTerendah.kode },
                rataKeseluruhan: grandCount > 0 ? (grandSum / grandCount).toFixed(2).replace('.', ',') : "0,00"
            }
        };
    } catch (error) {
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

        // 2. Tarik Nilai dari Database (Dikelompokkan Berdasarkan Mata Kuliah)
        const queryNilai = `
            SELECT 
            mk.id AS mk_id, mk.nama AS nama_mk, mk.semester, mk.total_sks AS sks, 
            pcm.siak_capaian_pembelajaran_lulusan_id AS cpl_id,
            rkm.nilai_akhir
            FROM siak_mata_kuliah mk
            JOIN siak_kelas_kuliah kk ON mk.id = kk.siak_mata_kuliah_id
            JOIN siak_pemetaan_cpl_mata_kuliah pcm ON mk.id = pcm.siak_mata_kuliah_id
            JOIN siak_rincian_krs_mahasiswa rkm ON kk.id = rkm.siak_kelas_kuliah_id
            JOIN siak_krs_mahasiswa km ON rkm.siak_krs_mahasiswa_id = km.id
            JOIN siak_mahasiswa m ON km.siak_mahasiswa_id = m.id
            WHERE m.siak_program_studi_id = :prodiId 
              AND m.angkatan = :angkatan 
              AND rkm.nilai_akhir IS NOT NULL
        `;

        const dataNilai = await sequelize.query(queryNilai, { replacements: { prodiId, angkatan }, type: QueryTypes.SELECT });

        const mkScores = {};
        dataNilai.forEach(row => {
            if (!mkScores[row.mk_id]) {
                mkScores[row.mk_id] = { semester: row.semester, nama: row.nama_mk, sks: row.sks, cpl: {} };
                uniqueCpls.forEach(c => { mkScores[row.mk_id].cpl[c.kode] = { sum: 0, max: 0, count: 0 }; });
            }
            
            const kodeCpl = cplMap[row.cpl_id];
            const nilai = parseFloat(row.nilai_akhir) || 0;
            if (kodeCpl && mkScores[row.mk_id].cpl[kodeCpl]) {
                const target = mkScores[row.mk_id].cpl[kodeCpl];
                target.sum += nilai;
                target.count += 1;
                if (nilai > target.max) target.max = nilai;
            }
        });

        // 3. Kalkulasi Rerata / Progresif
        const listMataKuliah = [];
        let grandSum = 0; let grandCount = 0;
        let cplTertinggi = { nilai: -1, kode: "" };
        let cplTerendah = { nilai: 999, kode: "" };

        Object.values(mkScores).forEach(mk => {
            const rowMk = { semester: mk.semester, nama: mk.nama, sks: mk.sks };
            uniqueCpls.forEach(cpl => {
                const stats = mk.cpl[cpl.kode];
                let nilaiAkhir = null;
                if (stats.count > 0) {
                    nilaiAkhir = metode === 'progresif' ? stats.max : (stats.sum / stats.count);
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
        const totalMhs = await models.Mahasiswa.count({ where: { siak_program_studi_id: prodiId, angkatan: angkatan }});

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
            ORDER BY mk.semester ASC, mk.kode ASC
        `;
        const mkList = await sequelize.query(queryMk, { replacements: { cplId: cplData.id }, type: QueryTypes.SELECT });

        // Kelompokkan MK berdasarkan Semester untuk Header Tabel
        const semesterGroups = {};
        mkList.forEach(mk => {
            if (!semesterGroups[mk.semester]) semesterGroups[mk.semester] = [];
            semesterGroups[mk.semester].push(mk);
        });
        const semesters = Object.keys(semesterGroups).sort((a,b) => a - b).map(s => ({
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
                JOIN siak_krs_mahasiswa km ON m.id = km.siak_mahasiswa_id
                JOIN siak_rincian_krs_mahasiswa rkm ON km.id = rkm.siak_krs_mahasiswa_id
                JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id
                WHERE m.siak_program_studi_id = :prodiId 
                  AND m.angkatan = :angkatan
                  AND kk.siak_mata_kuliah_id IN (:mkIds)
                  AND rkm.nilai_akhir IS NOT NULL
            `;
            dataNilai = await sequelize.query(queryNilai, { replacements: { prodiId, angkatan, mkIds }, type: QueryTypes.SELECT });
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
        throw new CustomError.InternalServerError("Gagal menghitung Laporan: " + error.message);
    }
};
// ============================================================================
// 6. MONITORING TRANSKRIP OBE (PER 1 MAHASISWA)
// ============================================================================
export const getTranskripObeMahasiswa = async (filters) => {
    const { tahunKurikulumId, prodiId, mahasiswaId, useKop } = filters;
    const { sequelize } = models; 

    try {
        // 1. AMBIL INFO OBE
        const queryInfo = `
            SELECT o.id AS obe_id, ps.nama AS prodi_nama, tk.tahun AS tahun_kurikulum
            FROM siak_obe o
            LEFT JOIN siak_program_studi ps ON o.siak_program_studi_id = ps.id
            LEFT JOIN siak_tahun_kurikulum tk ON o.siak_tahun_kurikulum_id = tk.id
            WHERE o.siak_tahun_kurikulum_id = :tahunKurikulumId 
              AND o.siak_program_studi_id = :prodiId
            LIMIT 1
        `;
        const obeData = await sequelize.query(queryInfo, { replacements: { tahunKurikulumId, prodiId }, type: QueryTypes.SELECT });
        if (!obeData || obeData.length === 0) throw new CustomError.NotFoundError("Data OBE tidak ditemukan.");
        const infoObe = obeData[0];

        // 2. AMBIL DATA MAHASISWA
        const queryMhs = `
            SELECT id, npm, nama, angkatan 
            FROM siak_mahasiswa 
            WHERE id = :mahasiswaId 
            LIMIT 1
        `;
        const mhsData = await sequelize.query(queryMhs, { replacements: { mahasiswaId }, type: QueryTypes.SELECT });
        if (!mhsData || mhsData.length === 0) throw new CustomError.NotFoundError("Data Mahasiswa tidak ditemukan.");
        const infoMhs = mhsData[0];

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        let semester = (currentYear - parseInt(infoMhs.angkatan)) * 2;
        if (currentMonth > 7) semester += 1; 
        if (semester < 1) semester = 1;

        // 3. AMBIL DATA CPL
        const queryCpl = `
            SELECT id, kode, deskripsi 
            FROM siak_capaian_pembelajaran_lulusan 
            WHERE siak_obe_id = :obeId 
            ORDER BY kode ASC
        `;
        const cplList = await sequelize.query(queryCpl, { replacements: { obeId: infoObe.obe_id }, type: QueryTypes.SELECT });

        // 4. HITUNG TOTAL MK PER CPL
        const queryTotalMapped = `
            SELECT pcm.siak_capaian_pembelajaran_lulusan_id as cpl_id, COUNT(pcm.siak_mata_kuliah_id) as total_mk
            FROM siak_pemetaan_cpl_mata_kuliah pcm
            JOIN siak_capaian_pembelajaran_lulusan cpl ON pcm.siak_capaian_pembelajaran_lulusan_id = cpl.id
            WHERE cpl.siak_obe_id = :obeId
            GROUP BY pcm.siak_capaian_pembelajaran_lulusan_id
        `;
        const totalMappedData = await sequelize.query(queryTotalMapped, { replacements: { obeId: infoObe.obe_id }, type: QueryTypes.SELECT });
        const mappedMap = {};
        totalMappedData.forEach(row => { mappedMap[row.cpl_id] = parseInt(row.total_mk); });

        // 5. TARIK NILAI ASLI MAHASISWA
        const queryScores = `
            SELECT pcm.siak_capaian_pembelajaran_lulusan_id AS cpl_id, rkm.nilai_akhir
            FROM siak_krs_mahasiswa km
            JOIN siak_rincian_krs_mahasiswa rkm ON km.id = rkm.siak_krs_mahasiswa_id
            JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id
            JOIN siak_pemetaan_cpl_mata_kuliah pcm ON kk.siak_mata_kuliah_id = pcm.siak_mata_kuliah_id
            WHERE km.siak_mahasiswa_id = :mahasiswaId AND rkm.nilai_akhir IS NOT NULL
        `;
        const scoreData = await sequelize.query(queryScores, { replacements: { mahasiswaId: infoMhs.id }, type: QueryTypes.SELECT });

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
            const target = 0; // Default 0 sesuai file

            let status = "Belum Dinilai";
            if (countTaken > 0) {
                status = rerata >= target ? "Sudah Memenuhi" : "Belum Memenuhi";
            }

            if (rerata > 0) {
                if (rerata > cplTertinggi.nilai) { cplTertinggi.nilai = rerata; cplTertinggi.kode = cpl.kode; }
                if (rerata < cplTerendah.nilai) { cplTerendah.nilai = rerata; cplTerendah.kode = cpl.kode; }
            }

            cplResults.push({
                kode: cpl.kode,
                deskripsi: cpl.deskripsi,
                target: target,
                rerata: rerata,
                status: status,
                capaian: capaian,
                progres: `${countTaken}/${totalMapped}`
            });
        });

        // 7. FORMAT DATA UNTUK EXPORT PDF
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
                // 🟢 FIX: Array 2 dimensi agar teks di Spiderchart jadi 2 baris (CPL01 di atas, nilai di bawah)
                labels: cplResults.map(c => [c.kode, c.rerata > 0 ? c.rerata.toFixed(2) : "0"]),
                datasets: [
                    { data: cplResults.map(c => parseFloat(c.rerata.toFixed(2))) },
                    { data: cplResults.map(c => parseFloat(c.target.toFixed(2))) } 
                ]
            }
        };
    } catch (error) {
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

export const getLaporanCpmkPerMahasiswa = async (filters) => {
    const { tahunKurikulumId, prodiId, mataKuliahId, angkatan, useKop } = filters;
    const { sequelize } = models;

    try {
        // 1. INFO MASTER OBE & PRODI
        const queryInfo = `
            SELECT o.id AS obe_id, ps.nama AS prodi_nama, tk.tahun AS tahun_kurikulum
            FROM siak_obe o
            LEFT JOIN siak_program_studi ps ON o.siak_program_studi_id = ps.id
            LEFT JOIN siak_tahun_kurikulum tk ON o.siak_tahun_kurikulum_id = tk.id
            WHERE o.siak_tahun_kurikulum_id = :tahunKurikulumId 
              AND o.siak_program_studi_id = :prodiId
            LIMIT 1
        `;
        const obeData = await sequelize.query(queryInfo, {
            replacements: { tahunKurikulumId, prodiId },
            type: QueryTypes.SELECT
        });
        if (!obeData || obeData.length === 0)
            throw new CustomError.NotFoundError("Data OBE tidak ditemukan.");
        const infoObe = obeData[0];

        // 2. INFO MATA KULIAH
        const queryMk = `SELECT id, kode, nama FROM siak_mata_kuliah WHERE id = :mataKuliahId LIMIT 1`;
        const mkData = await sequelize.query(queryMk, {
            replacements: { mataKuliahId },
            type: QueryTypes.SELECT
        });
        if (!mkData || mkData.length === 0)
            throw new CustomError.NotFoundError("Data Mata Kuliah tidak ditemukan.");
        const infoMk = mkData[0];

        // 3. AMBIL DATA CPMK
        const queryCpmk = `
            SELECT id, kode, deskripsi, 
                   COALESCE(target_cpmk, 0) AS target 
            FROM siak_capaian_mata_kuliah
            WHERE siak_mata_kuliah_id = :mataKuliahId 
            ORDER BY kode ASC
        `;
        let cpmkList = [];
        try {
            cpmkList = await sequelize.query(queryCpmk, {
                replacements: { mataKuliahId },
                type: QueryTypes.SELECT
            });
        } catch (e) {
            const queryCpmkFallback = `
                SELECT id, kode, deskripsi, '0' AS target 
                FROM siak_capaian_mata_kuliah 
                WHERE siak_mata_kuliah_id = :mataKuliahId 
                ORDER BY kode ASC
            `;
            cpmkList = await sequelize.query(queryCpmkFallback, {
                replacements: { mataKuliahId },
                type: QueryTypes.SELECT
            });
        }

        // 4. AMBIL DATA MAHASISWA
        const queryMhs = `
            SELECT id, npm, nama 
            FROM siak_mahasiswa 
            WHERE siak_program_studi_id = :prodiId AND angkatan = :angkatan
            ORDER BY npm ASC
        `;
        const mhsList = await sequelize.query(queryMhs, {
            replacements: { prodiId, angkatan },
            type: QueryTypes.SELECT
        });

        // 5. TARIK NILAI CPMK MAHASISWA
        let scoreData = [];
        if (mhsList.length > 0 && cpmkList.length > 0) {
            const queryScores = `
                SELECT n.siak_mahasiswa_id AS mahasiswa_id, 
                       n.siak_capaian_mata_kuliah_id AS cpmk_id, 
                       n.nilai
                FROM siak_nilai_cpmk_mahasiswa n
                JOIN siak_kelas_kuliah kk ON n.siak_kelas_kuliah_id = kk.id
                WHERE kk.siak_mata_kuliah_id = :mataKuliahId
            `;
            try {
                scoreData = await sequelize.query(queryScores, {
                    replacements: { mataKuliahId },
                    type: QueryTypes.SELECT
                });
            } catch (e) {
                try {
                    const fallbackQuery = `
                        SELECT siak_mahasiswa_id AS mahasiswa_id, siak_cpmk_id AS cpmk_id, nilai 
                        FROM siak_nilai_cpmk_mahasiswa n 
                        JOIN siak_kelas_kuliah kk ON n.siak_kelas_kuliah_id = kk.id 
                        WHERE kk.siak_mata_kuliah_id = :mataKuliahId
                    `;
                    scoreData = await sequelize.query(fallbackQuery, {
                        replacements: { mataKuliahId },
                        type: QueryTypes.SELECT
                    });
                } catch (err2) {
                    console.log("Tabel nilai CPMK tidak ditemukan atau berbeda nama, menggunakan data kosong.");
                }
            }
        }

        // 6. GABUNGKAN DATA MAHASISWA & NILAI CPMK
        const dataMahasiswa = mhsList.map(mhs => {
            const row = { id: mhs.id, npm: mhs.npm, nama: mhs.nama, cpmk: {} };
            let isMemenuhi = true;
            let hasNilai = false;

            cpmkList.forEach(cpmk => {
                const scoreRecord = scoreData.find(
                    s => s.mahasiswa_id === mhs.id && s.cpmk_id === cpmk.id
                );
                const nilai = scoreRecord ? parseFloat(scoreRecord.nilai) : null;
                row.cpmk[cpmk.kode] = nilai;

                if (nilai !== null) {
                    hasNilai = true;
                    if (nilai < parseFloat(cpmk.target)) isMemenuhi = false;
                }
            });

            row.status = !hasNilai
                ? "Belum Dinilai"
                : isMemenuhi ? "Sudah Memenuhi" : "Belum Memenuhi";

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
                kode: c.kode,
                deskripsi: c.deskripsi,
                target: parseFloat(c.target)
            })),
            dataMahasiswa: dataMahasiswa
        };
    } catch (error) {
        throw new CustomError.InternalServerError(
            "Gagal menghitung CPMK per Mahasiswa: " + error.message
        );
    }
};


