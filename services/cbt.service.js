import models from '../models/index.js';
import * as CustomError from '../utils/custom-error.js';
import * as penilaianService from './penilaian.service.js';

const {
    sequelize, RencanaEvaluasi, RincianKrsMahasiswa, KrsMahasiswa, CapaianMataKuliah,
    NilaiCpmkMahasiswa, NilaiEvaluasiMahasiswa, NilaiSubcpmkEvaluasiMahasiswa, PemetaanEvaluasiCpmk
} = models;

const STATUS_FINAL_ATAU_KUNCI = ['Lulus', 'Tidak Lulus'];

// ============================================================================
// JALUR D — Integrasi CBT (soal & koreksi dilakukan di CBT, bukan di NL-SIAK)
//
// Beda dengan Jalur C: NL-SIAK tidak menyimpan struktur soal sama sekali.
// CBT sudah mengagregasi sendiri nilai mentah per Sub-CPMK per komponen,
// jadi granularitas terkecil yang NL-SIAK terima adalah "per komponen per
// Sub-CPMK", bukan "per soal". Filosofi tetap sama seperti Jalur C:
// 100% aditif, wipe & replace, reuse inputNilaiMahasiswa/hitungNilaiAkhir,
// override NilaiCpmkMahasiswa dengan rollup ke CPMK induk untuk sub-CPMK.
// ============================================================================

// payload per mahasiswa: { krsId, nilaiAkhir, breakdown: [{ cpmkId, skorMentah }] }
export const simpanNilaiKomponenDariCbt = async (rencanaEvaluasiId, daftarMahasiswa) => {
    const rencanaEvaluasi = await RencanaEvaluasi.findByPk(rencanaEvaluasiId);
    if (!rencanaEvaluasi) throw new CustomError.NotFoundError("Komponen evaluasi tidak ditemukan");

    const hasil = [];
    for (const item of daftarMahasiswa) {
        const { krsId, nilaiAkhir, breakdown } = item;

        const rincian = await RincianKrsMahasiswa.findByPk(krsId, {
            include: [{ model: KrsMahasiswa, as: 'krsMahasiswa', attributes: ['siakMahasiswaId'] }]
        });
        if (!rincian) throw new CustomError.NotFoundError(`Rincian KRS ${krsId} tidak ditemukan`);
        if (STATUS_FINAL_ATAU_KUNCI.includes(rincian.status)) {
            throw new CustomError.ForbiddenError(`Nilai mahasiswa (krsId ${krsId}) sudah dikunci/difinalisasi, tidak dapat diubah dari CBT`);
        }

        const kelasId = rincian.siakKelasKuliahId;
        const mahasiswaId = rincian.krsMahasiswa?.siakMahasiswaId;
        if (!mahasiswaId) throw new CustomError.NotFoundError(`Data mahasiswa untuk krsId ${krsId} tidak ditemukan`);

        // 1. Wipe & replace breakdown Sub-CPMK utk (krsId, komponen ini) --
        //    resend dari CBT (mis. dosen minta koreksi ulang) otomatis MENGGANTIKAN
        //    data lama, bukan menumpuk jadi duplikat.
        await sequelize.transaction(async (trx) => {
            await NilaiSubcpmkEvaluasiMahasiswa.destroy({
                where: { siakRincianKrsMahasiswaId: krsId, siakRencanaEvaluasiId: rencanaEvaluasiId },
                force: true, transaction: trx
            });
            if (breakdown?.length > 0) {
                await NilaiSubcpmkEvaluasiMahasiswa.bulkCreate(
                    breakdown.map(b => ({
                        siakRincianKrsMahasiswaId: krsId,
                        siakRencanaEvaluasiId: rencanaEvaluasiId,
                        siakCpmkId: b.cpmkId,
                        skorMentah: parseFloat(b.skorMentah || 0)
                    })),
                    { transaction: trx }
                );
            }
        });

        // 2. Gabungkan komponen lain yang sudah ada (Jalur A/D komponen lain) supaya
        //    TIDAK ikut terhapus saat inputNilaiMahasiswa menulis ulang -- sama persis
        //    mitigasi yang dipakai Jalur C (lihat RENCANA-PENILAIAN-PER-SOAL.md Bagian 6).
        const nilaiEksisting = await NilaiEvaluasiMahasiswa.findAll({ where: { siakRincianKrsMahasiswaId: krsId } });
        const payloadKomponen = nilaiEksisting
            .filter(n => n.siakRencanaEvaluasiId !== rencanaEvaluasiId)
            .map(n => ({ komposisiId: n.siakRencanaEvaluasiId, skor: parseFloat(n.skor) }));
        payloadKomponen.push({ komposisiId: rencanaEvaluasiId, skor: parseFloat(nilaiAkhir || 0) });

        // 3. REUSE fungsi lama yang sudah ada -- TIDAK DIUBAH SATU BARIS PUN
        await penilaianService.inputNilaiMahasiswa(krsId, payloadKomponen);
        const hasilAkhir = await penilaianService.hitungNilaiAkhir(krsId);

        // 4. Hitung Nilai CPMK akurat dari breakdown Sub-CPMK (lintas semua komponen
        //    MK ini), lalu override NilaiCpmkMahasiswa -- sama pola dengan Jalur C.
        const nilaiCpmkAkurat = await hitungDanOverrideNilaiCpmkDariKomponen(krsId, kelasId, mahasiswaId);

        hasil.push({ krsId, ...hasilAkhir, nilaiCpmk: nilaiCpmkAkurat });
    }

    return hasil;
};

// ============================================================================
// Kalkulasi Nilai CPMK dari breakdown per-komponen (bukan per-soal seperti
// Jalur C), plus rollup ke CPMK induk untuk Sub-CPMK -- replikasi persis
// mitigasi yang sama di soal.service.js (hitungDanOverrideNilaiCpmkBottomUp).
// ============================================================================
const hitungDanOverrideNilaiCpmkDariKomponen = async (krsId, kelasId, mahasiswaId) => {
    const semuaNilaiSubcpmk = await NilaiSubcpmkEvaluasiMahasiswa.findAll({
        where: { siakRincianKrsMahasiswaId: krsId }
    });
    if (semuaNilaiSubcpmk.length === 0) return [];

    const rencanaEvaluasiIds = [...new Set(semuaNilaiSubcpmk.map(n => n.siakRencanaEvaluasiId))];
    const pemetaan = await PemetaanEvaluasiCpmk.findAll({ where: { siakRencanaEvaluasiId: rencanaEvaluasiIds } });
    const bobotMap = {}; // { `${rencanaEvaluasiId}|${cpmkId}` : bobotCpmk }
    pemetaan.forEach(p => { bobotMap[`${p.siakRencanaEvaluasiId}|${p.siakCpmkId}`] = parseFloat(p.bobotCpmk || 0); });

    // Pass 1: agregasi langsung ke cpmkId APA ADANYA (boleh CPMK induk, boleh sub-CPMK)
    const agregatLangsung = {}; // { cpmkId: { skorTerbobot, totalBobot } }
    semuaNilaiSubcpmk.forEach(n => {
        const bobotCpmk = bobotMap[`${n.siakRencanaEvaluasiId}|${n.siakCpmkId}`];
        if (!bobotCpmk || bobotCpmk <= 0) return; // komponen ini tidak memetakan Sub-CPMK ini -> abaikan
        const skor = parseFloat(n.skorMentah || 0);
        if (!agregatLangsung[n.siakCpmkId]) agregatLangsung[n.siakCpmkId] = { skorTerbobot: 0, totalBobot: 0 };
        agregatLangsung[n.siakCpmkId].skorTerbobot += skor * bobotCpmk;
        agregatLangsung[n.siakCpmkId].totalBobot += bobotCpmk;
    });

    const cpmkIdsLangsung = Object.keys(agregatLangsung);
    if (cpmkIdsLangsung.length === 0) return [];

    // Cek parentId tiap CPMK yang disentuh langsung (mitigasi rollup sub-CPMK)
    const daftarCpmk = await CapaianMataKuliah.findAll({
        where: { id: cpmkIdsLangsung },
        attributes: ['id', 'parentId']
    });
    const parentMap = {};
    daftarCpmk.forEach(c => { parentMap[c.id] = c.parentId; });

    // Pass 2: rollup ke CPMK induk untuk sub-CPMK yang induknya belum disentuh langsung
    const agregatRollup = {};
    cpmkIdsLangsung.forEach(cpmkId => {
        const parentId = parentMap[cpmkId];
        if (!parentId) return;
        if (!agregatRollup[parentId]) agregatRollup[parentId] = { skorTerbobot: 0, totalBobot: 0 };
        agregatRollup[parentId].skorTerbobot += agregatLangsung[cpmkId].skorTerbobot;
        agregatRollup[parentId].totalBobot += agregatLangsung[cpmkId].totalBobot;
    });
    Object.entries(agregatRollup).forEach(([parentId, agg]) => {
        if (!agregatLangsung[parentId]) agregatLangsung[parentId] = { skorTerbobot: 0, totalBobot: 0 };
        agregatLangsung[parentId].skorTerbobot += agg.skorTerbobot;
        agregatLangsung[parentId].totalBobot += agg.totalBobot;
    });

    const payloadCpmk = Object.entries(agregatLangsung).map(([cpmkId, agg]) => ({
        siakKelasKuliahId: kelasId,
        siakMahasiswaId: mahasiswaId,
        siakCapaianMataKuliahId: cpmkId,
        nilai: agg.totalBobot > 0 ? Math.round((agg.skorTerbobot / agg.totalBobot) * 100) / 100 : 0
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
