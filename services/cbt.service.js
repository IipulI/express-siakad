import models from '../models/index.js';
import * as CustomError from '../utils/custom-error.js';
import * as penilaianService from './penilaian.service.js';

const {
    sequelize, RencanaEvaluasi, RincianKrsMahasiswa, KrsMahasiswa, Mahasiswa, CapaianMataKuliah,
    NilaiCpmkMahasiswa, NilaiEvaluasiMahasiswa, NilaiSubcpmkEvaluasiMahasiswa
} = models;

const STATUS_FINAL_ATAU_KUNCI = ['Lulus', 'Tidak Lulus'];

// ============================================================================
// JALUR D — Integrasi CBT (soal & koreksi/cek-benar-salah dilakukan di CBT,
// NL-SIAK TIDAK PERNAH menyimpan soal secara permanen)
//
// Rumus identik dengan Jalur C ("Nilai per soal x bobotnya / total bobot
// subcpmk" -- arahan asli), cuma sumbernya beda: Jalur C baca dari tabel
// siak_soal yang persisten, Jalur D baca dari `breakdown` yang dikirim CBT
// SEKALI PAKAI di tiap request (unit/soal, esai, kriteria presentasi, tahap
// proyek -- generik, lihat RENCANA-PENILAIAN-PER-SOAL.md bagian "unit
// penilaian generik"). Tidak ada tabel Soal yang disentuh sama sekali.
//
// Yang disimpan ke siak_nilai_subcpmk_evaluasi_mahasiswa BUKAN breakdown
// mentahnya, tapi HASIL AGREGASI per (krs, komponen, cpmkId): skorTerbobot +
// totalBobot -- supaya bisa digabung matematis dengan komponen lain (UTS,
// UAS, Tugas, dst) saat rollup ke nilai Sub-CPMK/CPMK final.
// ============================================================================

// payload per mahasiswa: {
//   krsId, nilaiAkhir,
//   breakdown: [{ skorDiperoleh, skorMaksimal, pemetaanCpmk: [{cpmkId, bobotPoin}] }]
// }
// -- 1 entri breakdown = 1 unit penilaian (soal PG/esai, 1 kriteria presentasi,
//    1 tahap proyek, dst). bobotPoin = poin dari skorMaksimal unit ini yang
//    dialokasikan ke CPMK/Sub-CPMK tsb (kalau 1 unit = 1 CPMK, bobotPoin = skorMaksimal).
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

        // 1. Reduksi breakdown (per unit/soal, ephemeral) jadi agregat per cpmkId
        //    UNTUK KOMPONEN INI SAJA -- rumus identik hitungDanOverrideNilaiCpmkBottomUp
        //    di soal.service.js (Jalur C), cuma sumbernya array dari request, bukan query DB.
        const agregatKomponenIni = {}; // { cpmkId: { skorTerbobot, totalBobot } }
        (breakdown || []).forEach(unit => {
            const skor = parseFloat(unit.skorDiperoleh || 0);
            const maksUnit = parseFloat(unit.skorMaksimal || 0);
            (unit.pemetaanCpmk || []).forEach(p => {
                const bobotPoin = parseFloat(p.bobotPoin || 0);
                if (maksUnit <= 0 || bobotPoin <= 0 || !p.cpmkId) return;
                const skorTerbobotIni = skor * (bobotPoin / maksUnit);
                if (!agregatKomponenIni[p.cpmkId]) agregatKomponenIni[p.cpmkId] = { skorTerbobot: 0, totalBobot: 0 };
                agregatKomponenIni[p.cpmkId].skorTerbobot += skorTerbobotIni;
                agregatKomponenIni[p.cpmkId].totalBobot += bobotPoin;
            });
        });

        // 2. Wipe & replace hasil agregat komponen ini -- resend dari CBT (mis. dosen
        //    minta koreksi ulang) otomatis MENGGANTIKAN data lama, bukan menumpuk.
        await sequelize.transaction(async (trx) => {
            await NilaiSubcpmkEvaluasiMahasiswa.destroy({
                where: { siakRincianKrsMahasiswaId: krsId, siakRencanaEvaluasiId: rencanaEvaluasiId },
                force: true, transaction: trx
            });
            const payloadAgregat = Object.entries(agregatKomponenIni).map(([cpmkId, agg]) => ({
                siakRincianKrsMahasiswaId: krsId,
                siakRencanaEvaluasiId: rencanaEvaluasiId,
                siakCpmkId: cpmkId,
                skorTerbobot: agg.skorTerbobot,
                totalBobot: agg.totalBobot
            }));
            if (payloadAgregat.length > 0) {
                await NilaiSubcpmkEvaluasiMahasiswa.bulkCreate(payloadAgregat, { transaction: trx });
            }
        });

        // 3. Gabungkan komponen lain yang sudah ada (Jalur A/D komponen lain) supaya
        //    TIDAK ikut terhapus saat inputNilaiMahasiswa menulis ulang -- sama persis
        //    mitigasi yang dipakai Jalur C (lihat RENCANA-PENILAIAN-PER-SOAL.md Bagian 6).
        const nilaiEksisting = await NilaiEvaluasiMahasiswa.findAll({ where: { siakRincianKrsMahasiswaId: krsId } });
        const payloadKomponen = nilaiEksisting
            .filter(n => n.siakRencanaEvaluasiId !== rencanaEvaluasiId)
            .map(n => ({ komposisiId: n.siakRencanaEvaluasiId, skor: parseFloat(n.skor) }));
        payloadKomponen.push({ komposisiId: rencanaEvaluasiId, skor: parseFloat(nilaiAkhir || 0) });

        // 4. REUSE fungsi lama yang sudah ada -- TIDAK DIUBAH SATU BARIS PUN
        await penilaianService.inputNilaiMahasiswa(krsId, payloadKomponen);
        const hasilAkhir = await penilaianService.hitungNilaiAkhir(krsId);

        // 5. Gabungkan agregat LINTAS SEMUA KOMPONEN (UTS+UAS+Tugas, dst), rollup ke
        //    CPMK induk, lalu override NilaiCpmkMahasiswa -- sama pola dengan Jalur C.
        const nilaiCpmkAkurat = await hitungDanOverrideNilaiCpmkDariKomponen(krsId, kelasId, mahasiswaId);

        hasil.push({ krsId, ...hasilAkhir, nilaiCpmk: nilaiCpmkAkurat });
    }

    return hasil;
};

// ============================================================================
// GET — lihat nilai yang sudah masuk dari CBT untuk 1 komponen evaluasi,
// per mahasiswa, plus nilai Sub-CPMK hasil hitung dari agregat yang tersimpan.
// Sekaligus deteksi kalau ada RencanaEvaluasi LAIN dengan metode+jenis+periode
// yang SAMA (indikasi komponen duplikat -- lihat pertanyaan "nilai duplikat
// 1 periode": kalau ada baris kembar begini dan data kesebar ke keduanya,
// rollup CPMK bisa dobel hitung. Fungsi ini cuma memperingatkan, tidak
// otomatis menggabungkan -- perlu keputusan manual mana yang dipertahankan).
// ============================================================================
export const getNilaiDariCbt = async (rencanaEvaluasiId) => {
    const rencanaEvaluasi = await RencanaEvaluasi.findByPk(rencanaEvaluasiId);
    if (!rencanaEvaluasi) throw new CustomError.NotFoundError("Komponen evaluasi tidak ditemukan");

    const duplikat = await RencanaEvaluasi.findAll({
        where: {
            siakMataKuliahId: rencanaEvaluasi.siakMataKuliahId,
            siakPeriodeAkademikId: rencanaEvaluasi.siakPeriodeAkademikId,
            metodeEvaluasi: rencanaEvaluasi.metodeEvaluasi,
            jenisEvaluasi: rencanaEvaluasi.jenisEvaluasi
        },
        attributes: ['id', 'createdAt']
    });
    const peringatanDuplikat = duplikat.length > 1
        ? `Ada ${duplikat.length} komponen "${rencanaEvaluasi.metodeEvaluasi}" utk MK+periode yang sama (id: ${duplikat.map(d => d.id).join(', ')}) -- kemungkinan konfigurasi duplikat, cek manual sebelum lanjut.`
        : null;

    const semuaAgregat = await NilaiSubcpmkEvaluasiMahasiswa.findAll({
        where: { siakRencanaEvaluasiId: rencanaEvaluasiId },
        include: [{ model: CapaianMataKuliah, as: 'capaianMataKuliah', attributes: ['kode'] }]
    });
    const semuaNilaiKomponen = await NilaiEvaluasiMahasiswa.findAll({
        where: { siakRencanaEvaluasiId: rencanaEvaluasiId }
    });

    const krsIds = [...new Set([
        ...semuaAgregat.map(n => n.siakRincianKrsMahasiswaId),
        ...semuaNilaiKomponen.map(n => n.siakRincianKrsMahasiswaId)
    ])];
    const daftarRincian = await RincianKrsMahasiswa.findAll({
        where: { id: krsIds },
        include: [{ model: KrsMahasiswa, as: 'krsMahasiswa', include: [{ model: Mahasiswa, as: 'mahasiswa', attributes: ['nama', 'npm'] }] }]
    });
    const rincianMap = {};
    daftarRincian.forEach(r => { rincianMap[r.id] = r; });

    const perMahasiswa = {};
    krsIds.forEach(krsId => {
        const r = rincianMap[krsId];
        perMahasiswa[krsId] = {
            krsId,
            nim: r?.krsMahasiswa?.mahasiswa?.npm || '-',
            nama: r?.krsMahasiswa?.mahasiswa?.nama || '-',
            nilaiAkhirKomponen: null,
            breakdown: []
        };
    });
    semuaNilaiKomponen.forEach(n => {
        if (perMahasiswa[n.siakRincianKrsMahasiswaId]) {
            perMahasiswa[n.siakRincianKrsMahasiswaId].nilaiAkhirKomponen = parseFloat(n.skor);
        }
    });
    semuaAgregat.forEach(n => {
        const totalBobot = parseFloat(n.totalBobot || 0);
        const skorTerbobot = parseFloat(n.skorTerbobot || 0);
        perMahasiswa[n.siakRincianKrsMahasiswaId]?.breakdown.push({
            cpmkId: n.siakCpmkId,
            cpmkKode: n.capaianMataKuliah?.kode || '(kode tidak ditemukan)',
            nilaiKomponenIni: totalBobot > 0 ? Math.round((skorTerbobot / totalBobot) * 10000) / 100 : 0
        });
    });

    return {
        komponen: { id: rencanaEvaluasi.id, metodeEvaluasi: rencanaEvaluasi.metodeEvaluasi, jenisEvaluasi: rencanaEvaluasi.jenisEvaluasi },
        peringatanDuplikat,
        mahasiswa: Object.values(perMahasiswa)
    };
};

// ============================================================================
// RESET per komponen (BUKAN reset seluruh nilai mahasiswa) -- hapus kontribusi
// Jalur D untuk 1 mahasiswa di 1 komponen evaluasi SAJA, lalu hitung ulang nilai
// akhir & CPMK dari komponen-komponen LAIN yang masih tersisa. Berguna khusus
// buat beresin kasus komponen duplikat: reset yang duplikatnya SAJA, tanpa
// ganggu komponen yang benar.
// ============================================================================
export const resetNilaiKomponenCbt = async (krsId, rencanaEvaluasiId) => {
    const rincian = await RincianKrsMahasiswa.findByPk(krsId, {
        include: [{ model: KrsMahasiswa, as: 'krsMahasiswa', attributes: ['siakMahasiswaId'] }]
    });
    if (!rincian) throw new CustomError.NotFoundError(`Rincian KRS ${krsId} tidak ditemukan`);
    if (STATUS_FINAL_ATAU_KUNCI.includes(rincian.status)) {
        throw new CustomError.ForbiddenError(`Nilai mahasiswa (krsId ${krsId}) sudah dikunci/difinalisasi, tidak dapat direset`);
    }
    const kelasId = rincian.siakKelasKuliahId;
    const mahasiswaId = rincian.krsMahasiswa?.siakMahasiswaId;

    await sequelize.transaction(async (trx) => {
        await NilaiSubcpmkEvaluasiMahasiswa.destroy({
            where: { siakRincianKrsMahasiswaId: krsId, siakRencanaEvaluasiId: rencanaEvaluasiId },
            force: true, transaction: trx
        });
        await NilaiEvaluasiMahasiswa.destroy({
            where: { siakRincianKrsMahasiswaId: krsId, siakRencanaEvaluasiId: rencanaEvaluasiId },
            force: true, transaction: trx
        });
    });

    // Hitung ulang dari komponen yang TERSISA saja. Kalau ternyata sudah tidak ada
    // komponen tersisa sama sekali, jangan panggil hitungNilaiAkhir (itu bakal nulis
    // 0/huruf E -- kelihatan kayak "gagal", padahal harusnya "belum dinilai").
    // Balikin ke NULL, konsisten dengan resetNilaiMahasiswa/resetNilaiKelas.
    const sisaKomponen = await NilaiEvaluasiMahasiswa.findAll({ where: { siakRincianKrsMahasiswaId: krsId } });

    if (sisaKomponen.length === 0) {
        await RincianKrsMahasiswa.update(
            { nilaiAkhir: null, hurufMutu: null, angkaMutu: null },
            { where: { id: krsId } }
        );
        await NilaiCpmkMahasiswa.destroy({
            where: { siakKelasKuliahId: kelasId, siakMahasiswaId: mahasiswaId },
            force: true
        });
        return { krsId, totalSkor: null, hurufMutu: null, angkaMutu: null, nilaiCpmk: [], pesan: `Komponen ini berhasil direset, tidak ada komponen lain tersisa -- status kembali Belum Dinilai` };
    }

    const payloadKomponen = sisaKomponen.map(n => ({ komposisiId: n.siakRencanaEvaluasiId, skor: parseFloat(n.skor) }));
    await penilaianService.inputNilaiMahasiswa(krsId, payloadKomponen);
    const hasilAkhir = await penilaianService.hitungNilaiAkhir(krsId);
    const nilaiCpmk = await hitungDanOverrideNilaiCpmkDariKomponen(krsId, kelasId, mahasiswaId);

    return { krsId, ...hasilAkhir, nilaiCpmk, pesan: `Komponen ini berhasil direset utk mahasiswa ${krsId}` };
};

// ============================================================================
// Gabungkan agregat (skorTerbobot, totalBobot) yang sudah dihitung per komponen
// LINTAS SEMUA KOMPONEN evaluasi mahasiswa ini, plus rollup ke CPMK induk untuk
// Sub-CPMK -- replikasi persis mitigasi yang sama di soal.service.js
// (hitungDanOverrideNilaiCpmkBottomUp). Tidak butuh bobotCpmk dari Rencana
// Evaluasi sama sekali -- bobot sudah melekat di tiap unit sejak Langkah 1.
// ============================================================================
const hitungDanOverrideNilaiCpmkDariKomponen = async (krsId, kelasId, mahasiswaId) => {
    const semuaAgregat = await NilaiSubcpmkEvaluasiMahasiswa.findAll({
        where: { siakRincianKrsMahasiswaId: krsId }
    });
    if (semuaAgregat.length === 0) return [];

    // Pass 1: gabungkan lintas komponen ke cpmkId APA ADANYA (boleh CPMK induk, boleh sub-CPMK)
    const agregatLangsung = {}; // { cpmkId: { skorTerbobot, totalBobot } }
    semuaAgregat.forEach(n => {
        if (!agregatLangsung[n.siakCpmkId]) agregatLangsung[n.siakCpmkId] = { skorTerbobot: 0, totalBobot: 0 };
        agregatLangsung[n.siakCpmkId].skorTerbobot += parseFloat(n.skorTerbobot || 0);
        agregatLangsung[n.siakCpmkId].totalBobot += parseFloat(n.totalBobot || 0);
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
