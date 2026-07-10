import models from '../models/index.js';
import * as CustomError from '../utils/custom-error.js';
import * as penilaianService from './penilaian.service.js';

const { sequelize, Soal, PemetaanSoalCpmk, NilaiSoalMahasiswa, RincianKrsMahasiswa, KrsMahasiswa, CapaianMataKuliah, NilaiCpmkMahasiswa, RencanaEvaluasi, NilaiEvaluasiMahasiswa } = models;

const STATUS_FINAL_ATAU_KUNCI = ['Lulus', 'Tidak Lulus'];

// ============================================================================
// 1. CRUD SOAL (rubrik unit penilaian per komponen evaluasi)
// ============================================================================

// payload: { nomor, label, jenisUnit, skorMaksimal, parentSoalId, urutan,
//            pertanyaan, opsiJawaban: [{label,teks}], kunciJawaban,
//            pemetaanCpmk: [{cpmkId, bobotPoin}] }
export const createSoal = async (rencanaEvaluasiId, payload, trxLuar) => {
    const rencana = await RencanaEvaluasi.findByPk(rencanaEvaluasiId);
    if (!rencana) throw new CustomError.NotFoundError("Komponen Evaluasi (Rencana Evaluasi) tidak ditemukan");

    const skorMaksimal = parseFloat(payload.skorMaksimal || 0);
    const pemetaanCpmk = Array.isArray(payload.pemetaanCpmk) ? payload.pemetaanCpmk : [];

    const totalBobotPoin = pemetaanCpmk.reduce((sum, p) => sum + parseFloat(p.bobotPoin || 0), 0);
    if (totalBobotPoin > skorMaksimal + 0.01) {
        throw new CustomError.BadRequestError(
            `Total bobot poin CPMK (${totalBobotPoin}) tidak boleh melebihi skor maksimal soal (${skorMaksimal})`
        );
    }

    const eksekusi = async (trx) => {
        const soal = await Soal.create({
            siakRencanaEvaluasiId: rencanaEvaluasiId,
            parentSoalId: payload.parentSoalId || null,
            nomor: payload.nomor,
            label: payload.label || null,
            jenisUnit: payload.jenisUnit || 'RUBRIK',
            skorMaksimal,
            urutan: payload.urutan || 0,
            pertanyaan: payload.pertanyaan || null,
            opsiJawaban: Array.isArray(payload.opsiJawaban) ? payload.opsiJawaban : null,
            kunciJawaban: payload.kunciJawaban || null
        }, { transaction: trx });

        if (pemetaanCpmk.length > 0) {
            await PemetaanSoalCpmk.bulkCreate(
                pemetaanCpmk.map(p => ({
                    siakSoalId: soal.id,
                    siakCpmkId: p.cpmkId,
                    bobotPoin: parseFloat(p.bobotPoin || 0)
                })),
                { transaction: trx }
            );
        }

        return soal;
    };

    // Dipakai sendiri (1 soal) -> bikin transaksi sendiri. Dipakai dari createSoalBatch
    // (banyak soal sekaligus) -> ikut transaksi luar yang sudah ada (trxLuar).
    return trxLuar ? eksekusi(trxLuar) : sequelize.transaction(eksekusi);
};

// Bikin BANYAK soal sekaligus dalam 1 komponen evaluasi, 1 transaksi (semua sukses atau semua batal).
// payload: { daftarSoal: [ {nomor, label, jenisUnit, skorMaksimal, parentSoalId, parentSoalNomor, urutan,
//                            pertanyaan, opsiJawaban, kunciJawaban, pemetaanCpmk}, ... ] }
//
// Soal beranak dalam 1 batch yang SAMA: karena array diproses berurutan dalam 1 transaksi,
// soal yang ditulis lebih dulu sudah punya id asli sebelum soal berikutnya diproses. Jadi anak
// soal bisa referensi induknya cukup pakai `parentSoalNomor` (nomor induk, BUKAN UUID), asalkan
// induknya ditulis SEBELUM anaknya di array -- tidak perlu lagi POST 2x / GET ulang di antaranya.
export const createSoalBatch = async (rencanaEvaluasiId, daftarSoalPayload) => {
    if (!Array.isArray(daftarSoalPayload) || daftarSoalPayload.length === 0) {
        throw new CustomError.BadRequestError("daftarSoal harus berupa array, minimal 1 soal");
    }
    return await sequelize.transaction(async (trx) => {
        const hasil = [];
        const idByNomor = {};
        for (const payload of daftarSoalPayload) {
            let payloadFinal = payload;
            if (!payload.parentSoalId && payload.parentSoalNomor) {
                const parentId = idByNomor[payload.parentSoalNomor];
                if (!parentId) {
                    throw new CustomError.BadRequestError(
                        `parentSoalNomor "${payload.parentSoalNomor}" tidak ditemukan -- pastikan soal induk ditulis SEBELUM anaknya di daftarSoal`
                    );
                }
                payloadFinal = { ...payload, parentSoalId: parentId };
            }
            const soalBaru = await createSoal(rencanaEvaluasiId, payloadFinal, trx);
            idByNomor[payloadFinal.nomor] = soalBaru.id;
            hasil.push(soalBaru);
        }
        return hasil;
    });
};

export const updateSoal = async (soalId, payload) => {
    const soal = await Soal.findByPk(soalId);
    if (!soal) throw new CustomError.NotFoundError("Soal tidak ditemukan");

    const skorMaksimal = payload.skorMaksimal !== undefined ? parseFloat(payload.skorMaksimal) : parseFloat(soal.skorMaksimal);
    const pemetaanCpmk = Array.isArray(payload.pemetaanCpmk) ? payload.pemetaanCpmk : null;

    if (pemetaanCpmk) {
        const totalBobotPoin = pemetaanCpmk.reduce((sum, p) => sum + parseFloat(p.bobotPoin || 0), 0);
        if (totalBobotPoin > skorMaksimal + 0.01) {
            throw new CustomError.BadRequestError(
                `Total bobot poin CPMK (${totalBobotPoin}) tidak boleh melebihi skor maksimal soal (${skorMaksimal})`
            );
        }
    }

    return await sequelize.transaction(async (trx) => {
        await soal.update({
            nomor: payload.nomor ?? soal.nomor,
            label: payload.label ?? soal.label,
            jenisUnit: payload.jenisUnit ?? soal.jenisUnit,
            skorMaksimal,
            urutan: payload.urutan ?? soal.urutan,
            pertanyaan: payload.pertanyaan ?? soal.pertanyaan,
            opsiJawaban: payload.opsiJawaban !== undefined ? payload.opsiJawaban : soal.opsiJawaban,
            kunciJawaban: payload.kunciJawaban ?? soal.kunciJawaban
        }, { transaction: trx });

        if (pemetaanCpmk) {
            await PemetaanSoalCpmk.destroy({ where: { siakSoalId: soalId }, force: true, transaction: trx });
            if (pemetaanCpmk.length > 0) {
                await PemetaanSoalCpmk.bulkCreate(
                    pemetaanCpmk.map(p => ({
                        siakSoalId: soalId,
                        siakCpmkId: p.cpmkId,
                        bobotPoin: parseFloat(p.bobotPoin || 0)
                    })),
                    { transaction: trx }
                );
            }
        }

        return soal;
    });
};

export const deleteSoal = async (soalId) => {
    const soal = await Soal.findByPk(soalId);
    if (!soal) throw new CustomError.NotFoundError("Soal tidak ditemukan");

    return await sequelize.transaction(async (trx) => {
        await PemetaanSoalCpmk.destroy({ where: { siakSoalId: soalId }, transaction: trx });
        await Soal.destroy({ where: { id: soalId }, transaction: trx });
        return true;
    });
};

export const getSoalByKomponen = async (rencanaEvaluasiId) => {
    const rencana = await RencanaEvaluasi.findByPk(rencanaEvaluasiId);
    if (!rencana) throw new CustomError.NotFoundError("Komponen Evaluasi (Rencana Evaluasi) tidak ditemukan");

    const daftarSoal = await Soal.findAll({
        where: { siakRencanaEvaluasiId: rencanaEvaluasiId },
        include: [{
            model: PemetaanSoalCpmk, as: 'pemetaanCpmk',
            include: [{ model: CapaianMataKuliah, as: 'cpmk', attributes: ['id', 'kode', 'deskripsi'] }]
        }],
        order: [['urutan', 'ASC'], ['nomor', 'ASC']]
    });

    const totalSkorMaksimal = daftarSoal.reduce((sum, s) => sum + parseFloat(s.skorMaksimal), 0);

    return {
        komponen: { id: rencana.id, metodeEvaluasi: rencana.metodeEvaluasi, bobot: parseFloat(rencana.bobot) },
        totalSkorMaksimal,
        daftarSoal: daftarSoal.map(s => ({
            id: s.id,
            nomor: s.nomor,
            label: s.label,
            jenisUnit: s.jenisUnit,
            skorMaksimal: parseFloat(s.skorMaksimal),
            parentSoalId: s.parentSoalId,
            urutan: s.urutan,
            pertanyaan: s.pertanyaan,
            opsiJawaban: s.opsiJawaban,
            kunciJawaban: s.kunciJawaban,
            pemetaanCpmk: s.pemetaanCpmk.map(p => ({
                cpmkId: p.siakCpmkId,
                cpmkKode: p.cpmk?.kode,
                bobotPoin: parseFloat(p.bobotPoin)
            }))
        }))
    };
};

// ============================================================================
// 2. INPUT NILAI PER SOAL (Jalur C) — mengisi rincian skor per soal, lalu
//    REUSE fungsi lama (inputNilaiMahasiswa, hitungNilaiAkhir) untuk
//    menghasilkan SkorKomponen & Nilai Akhir, baru OVERRIDE NilaiCpmkMahasiswa
//    dengan hasil bottom-up yang akurat (lihat RENCANA-PENILAIAN-PER-SOAL.md)
// ============================================================================

// arrNilaiSoal: [{ soalId, skor }]
export const inputNilaiPerSoal = async (krsId, arrNilaiSoal) => {
    const rincian = await RincianKrsMahasiswa.findByPk(krsId, {
        include: [{ model: KrsMahasiswa, as: 'krsMahasiswa', attributes: ['siakMahasiswaId'] }]
    });
    if (!rincian) throw new CustomError.NotFoundError("Data rincian KRS tidak ditemukan");
    if (STATUS_FINAL_ATAU_KUNCI.includes(rincian.status)) {
        throw new CustomError.ForbiddenError("Nilai sudah dikunci/difinalisasi, tidak dapat diubah");
    }

    const kelasId = rincian.siakKelasKuliahId;
    const mahasiswaId = rincian.krsMahasiswa?.siakMahasiswaId;
    if (!mahasiswaId) throw new CustomError.NotFoundError("Data mahasiswa tidak ditemukan");

    const soalIdsDiinput = arrNilaiSoal.map(n => n.soalId);
    const daftarSoalDiinput = await Soal.findAll({ where: { id: soalIdsDiinput } });
    if (daftarSoalDiinput.length !== soalIdsDiinput.length) {
        throw new CustomError.BadRequestError("Ada soalId yang tidak ditemukan");
    }

    const soalById = {};
    daftarSoalDiinput.forEach(s => { soalById[s.id] = s; });

    // Soal OBJEKTIF + jawabanMahasiswa terisi -> skor dihitung sistem (cocok=skorMaksimal,
    // salah=0), BUKAN diketik manual oleh dosen. Soal lain (RUBRIK, atau OBJEKTIF tanpa
    // jawabanMahasiswa) tetap pakai skor yang dikirim langsung (manual/partial credit).
    const dataNilaiSoal = arrNilaiSoal.map(n => {
        const soal = soalById[n.soalId];
        const jawabanMahasiswa = n.jawabanMahasiswa ?? null;
        let skor = parseFloat(n.skor || 0);
        if (soal?.jenisUnit === 'OBJEKTIF' && jawabanMahasiswa) {
            skor = jawabanMahasiswa === soal.kunciJawaban ? parseFloat(soal.skorMaksimal) : 0;
        }
        return {
            siakRincianKrsMahasiswaId: krsId,
            siakSoalId: n.soalId,
            skorDiperoleh: skor,
            jawabanMahasiswa
        };
    });

    await sequelize.transaction(async (trx) => {
        // Wipe & replace, pola sama seperti inputNilaiMahasiswa
        await NilaiSoalMahasiswa.destroy({
            where: { siakRincianKrsMahasiswaId: krsId, siakSoalId: soalIdsDiinput },
            force: true, transaction: trx
        });
        await NilaiSoalMahasiswa.bulkCreate(dataNilaiSoal, { transaction: trx });
    });

    // 1. Hitung SkorKomponen dari SEMUA soal yang sudah ada nilainya untuk krsId ini
    //    (bukan cuma yang baru diinput, supaya komponen yang sebagian terisi tetap utuh)
    const semuaNilaiSoal = await NilaiSoalMahasiswa.findAll({
        where: { siakRincianKrsMahasiswaId: krsId },
        include: [{ model: Soal, as: 'soal' }]
    });

    const perKomponen = {}; // { rencanaEvaluasiId: { totalDiperoleh, totalMaks } }
    semuaNilaiSoal.forEach(ns => {
        const rId = ns.soal.siakRencanaEvaluasiId;
        if (!perKomponen[rId]) perKomponen[rId] = { totalDiperoleh: 0, totalMaks: 0 };
        perKomponen[rId].totalDiperoleh += parseFloat(ns.skorDiperoleh);
        perKomponen[rId].totalMaks += parseFloat(ns.soal.skorMaksimal);
    });

    const payloadKomponen = Object.entries(perKomponen).map(([rencanaEvaluasiId, agg]) => ({
        komposisiId: rencanaEvaluasiId,
        skor: agg.totalMaks > 0 ? Math.round((agg.totalDiperoleh / agg.totalMaks) * 10000) / 100 : 0
    }));

    // 1b. inputNilaiMahasiswa (dipanggil di langkah 2) MENGHAPUS SEMUA komponen nilai
    //     mahasiswa ini sebelum menulis ulang -- supaya komponen yang diisi manual
    //     lewat Jalur A (mis. KEHADIRAN, tanpa soal) TIDAK ikut terhapus, gabungkan
    //     dulu komponen existing yang TIDAK punya soal ke payloadKomponen.
    //     (Lihat RENCANA-PENILAIAN-PER-SOAL.md — "Risiko mencampur Jalur A & Jalur C")
    const rencanaIdsDariSoal = new Set(payloadKomponen.map(p => p.komposisiId));
    const nilaiEksisting = await NilaiEvaluasiMahasiswa.findAll({
        where: { siakRincianKrsMahasiswaId: krsId }
    });
    nilaiEksisting.forEach(n => {
        const rId = n.siakRencanaEvaluasiId;
        if (!rencanaIdsDariSoal.has(rId)) {
            payloadKomponen.push({ komposisiId: rId, skor: parseFloat(n.skor) });
            rencanaIdsDariSoal.add(rId);
        }
    });

    // 2. REUSE fungsi lama yang sudah ada — TIDAK DIUBAH SATU BARIS PUN
    await penilaianService.inputNilaiMahasiswa(krsId, payloadKomponen);
    const hasilAkhir = await penilaianService.hitungNilaiAkhir(krsId);

    // 3. Hitung Nilai CPMK akurat (bottom-up dari soal), lalu override NilaiCpmkMahasiswa
    const nilaiCpmkAkurat = await hitungDanOverrideNilaiCpmkBottomUp(krsId, kelasId, mahasiswaId);

    return { ...hasilAkhir, nilaiCpmk: nilaiCpmkAkurat };
};

// ============================================================================
// 3. KALKULASI BOTTOM-UP NILAI CPMK + MITIGASI SUB-CPMK (rollup ke induk)
//    Lihat RENCANA-PENILAIAN-PER-SOAL.md bagian "Risiko khusus: Soal dipetakan
//    ke Sub-CPMK" — wajib ditulis 2 baris (sub-CPMK + rollup ke induk) supaya
//    laporan CPL (yang JOIN exact-match ke siak_pemetaan_cpl_cpmk) tidak
//    diam-diam kehilangan data.
// ============================================================================
const hitungDanOverrideNilaiCpmkBottomUp = async (krsId, kelasId, mahasiswaId) => {
    const semuaNilaiSoal = await NilaiSoalMahasiswa.findAll({
        where: { siakRincianKrsMahasiswaId: krsId },
        include: [{
            model: Soal, as: 'soal',
            include: [{ model: PemetaanSoalCpmk, as: 'pemetaanCpmk' }]
        }]
    });

    // Pass 1: agregasi langsung ke cpmkId APA ADANYA seperti dipetakan di Soal
    // (boleh CPMK induk, boleh sub-CPMK — sesuai keputusan koordinator MK)
    const agregatLangsung = {}; // { cpmkId: { skorTerbobot, totalBobot } }
    semuaNilaiSoal.forEach(ns => {
        const skor = parseFloat(ns.skorDiperoleh);
        const maksSoal = parseFloat(ns.soal.skorMaksimal);
        (ns.soal.pemetaanCpmk || []).forEach(p => {
            const bobotPoin = parseFloat(p.bobotPoin);
            if (maksSoal <= 0 || bobotPoin <= 0) return;
            const skorTerbobotIni = skor * (bobotPoin / maksSoal);
            if (!agregatLangsung[p.siakCpmkId]) agregatLangsung[p.siakCpmkId] = { skorTerbobot: 0, totalBobot: 0 };
            agregatLangsung[p.siakCpmkId].skorTerbobot += skorTerbobotIni;
            agregatLangsung[p.siakCpmkId].totalBobot += bobotPoin;
        });
    });

    const cpmkIdsLangsung = Object.keys(agregatLangsung);
    if (cpmkIdsLangsung.length === 0) return [];

    // Cek parentId tiap CPMK yang disentuh langsung (utk mitigasi sub-CPMK)
    const daftarCpmk = await CapaianMataKuliah.findAll({
        where: { id: cpmkIdsLangsung },
        attributes: ['id', 'parentId']
    });
    const parentMap = {};
    daftarCpmk.forEach(c => { parentMap[c.id] = c.parentId; });

    // Pass 2: rollup ke CPMK induk untuk sub-CPMK yang induknya BELUM disentuh langsung
    const agregatRollup = {}; // { parentCpmkId: { skorTerbobot, totalBobot } }
    cpmkIdsLangsung.forEach(cpmkId => {
        const parentId = parentMap[cpmkId];
        if (!parentId) return; // bukan sub-CPMK, tidak perlu rollup
        if (!agregatRollup[parentId]) agregatRollup[parentId] = { skorTerbobot: 0, totalBobot: 0 };
        agregatRollup[parentId].skorTerbobot += agregatLangsung[cpmkId].skorTerbobot;
        agregatRollup[parentId].totalBobot += agregatLangsung[cpmkId].totalBobot;
    });

    // Gabungkan: kalau parentId SUDAH ada di agregatLangsung (disentuh langsung juga),
    // tambahkan kontribusi rollup ke situ. Kalau belum ada, jadi baris BARU.
    Object.entries(agregatRollup).forEach(([parentId, agg]) => {
        if (!agregatLangsung[parentId]) agregatLangsung[parentId] = { skorTerbobot: 0, totalBobot: 0 };
        agregatLangsung[parentId].skorTerbobot += agg.skorTerbobot;
        agregatLangsung[parentId].totalBobot += agg.totalBobot;
    });

    const payloadCpmk = Object.entries(agregatLangsung).map(([cpmkId, agg]) => ({
        siakKelasKuliahId: kelasId,
        siakMahasiswaId: mahasiswaId,
        siakCapaianMataKuliahId: cpmkId,
        nilai: agg.totalBobot > 0 ? Math.round((agg.skorTerbobot / agg.totalBobot) * 10000) / 100 : 0
    }));

    await sequelize.transaction(async (trx) => {
        await NilaiCpmkMahasiswa.destroy({
            where: { siakKelasKuliahId: kelasId, siakMahasiswaId: mahasiswaId },
            force: true, transaction: trx
        });
        if (payloadCpmk.length > 0) {
            await NilaiCpmkMahasiswa.bulkCreate(payloadCpmk, { transaction: trx });
        }
    });

    return payloadCpmk;
};
