import models from '../models/index.js';
import * as CustomError from '../utils/custom-error.js';
import { DEFAULT_SKALA, getGrade, hitungDanOverrideNilaiCpmkDariKomponen } from './penilaian.service.js';

const {
    sequelize, RencanaEvaluasi, RincianKrsMahasiswa, KrsMahasiswa, Mahasiswa, CapaianMataKuliah,
    NilaiCpmkMahasiswa, NilaiSubcpmkEvaluasiMahasiswa
} = models;

const STATUS_FINAL_ATAU_KUNCI = ['Lulus', 'Tidak Lulus'];

// ============================================================================
// JALUR D — Integrasi CBT (soal & koreksi/cek-benar-salah dilakukan di CBT,
// NL-SIAK TIDAK PERNAH menyimpan soal secara permanen)
//
// Revisi 2026-07-16 (hasil konsultasi Pak Fitrah + Virza): nilai akhir & huruf
// mutu/angka mutu MK itu MURNI hasil hitungan CBT sendiri -- NL-SIAK cuma GET
// dan simpan apa adanya (lihat simpanNilaiAkhirDariCbt), TIDAK dihitung ulang
// dari komponen (hitungNilaiAkhir Jalur A TIDAK dipanggil sama sekali di jalur
// ini). Yang di-input NL-SIAK dari CBT cuma breakdown Sub-CPMK per komponen,
// dipakai KHUSUS buat hitung capaian CPMK -- 2 hal ini sengaja dipisah total
// supaya tidak ada 1 fungsi yang bisa menimpa hasil punya fungsi lain (akar
// masalah bug sebelumnya: hitungNilaiAkhir menimpa NilaiCpmkMahasiswa balik
// jadi proporsional tiap kali dipanggil, walau sudah ada hitungan akurat).
//
// Rumus breakdown identik Jalur C ("Nilai per soal x bobotnya / total bobot
// subcpmk" -- arahan asli Pak Fitrah), cuma sumbernya beda: Jalur C baca dari
// tabel siak_soal yang persisten, Jalur D baca dari `breakdown` yang dikirim
// CBT SEKALI PAKAI di tiap request (unit/soal, esai, kriteria presentasi,
// tahap proyek -- generik). Tidak ada tabel Soal yang disentuh sama sekali.
//
// Yang disimpan ke siak_nilai_subcpmk_evaluasi_mahasiswa BUKAN breakdown
// mentahnya, tapi HASIL AGREGASI per (krs, komponen, cpmkId): skorTerbobot +
// totalBobot -- supaya bisa digabung matematis dengan komponen lain (UTS,
// UAS, Tugas, dst) saat rollup ke nilai Sub-CPMK/CPMK final.
// ============================================================================

// payload per mahasiswa: {
//   krsId,
//   breakdown: [{ skorDiperoleh, skorMaksimal, pemetaanCpmk: [{cpmkId, bobotPoin}] }]
// }
// -- 1 entri breakdown = 1 unit penilaian (soal PG/esai, 1 kriteria presentasi,
//    1 tahap proyek, dst). bobotPoin = poin dari skorMaksimal unit ini yang
//    dialokasikan ke CPMK/Sub-CPMK tsb (kalau 1 unit = 1 CPMK, bobotPoin = skorMaksimal).
//
// TIDAK ADA nilaiAkhir di sini -- itu urusan simpanNilaiAkhirDariCbt terpisah.
// Kata kunci komponen non-soal (Kehadiran/Partisipasi/dst) -- CBT tidak punya data
// ini sama sekali (arahan Pak Fitrah: presensi diinput manual langsung di NL-SIAK),
// jadi breakdown soal TIDAK BOLEH masuk ke komponen jenis ini. metodeEvaluasi &
// jenisEvaluasi itu teks bebas (tidak ada enum baku -- dibuktikan data produksi
// pakai 'KEHADIRAN' & 'PARTISIPASI' utk hal yang sama), jadi deteksinya best-effort
// kata kunci case-insensitive, bukan exact-match.
const KATA_KUNCI_KOMPONEN_NON_SOAL = ['kehadiran', 'partisipasi', 'presensi', 'keaktifan', 'absen'];
const isKomponenNonSoal = (rencanaEvaluasi) => {
    const teks = `${rencanaEvaluasi.metodeEvaluasi || ''} ${rencanaEvaluasi.jenisEvaluasi || ''}`.toLowerCase();
    return KATA_KUNCI_KOMPONEN_NON_SOAL.some(kw => teks.includes(kw));
};

export const simpanNilaiKomponenDariCbt = async (rencanaEvaluasiId, daftarMahasiswa) => {
    const rencanaEvaluasi = await RencanaEvaluasi.findByPk(rencanaEvaluasiId);
    if (!rencanaEvaluasi) throw new CustomError.NotFoundError("Komponen evaluasi tidak ditemukan");
    if (isKomponenNonSoal(rencanaEvaluasi)) {
        throw new CustomError.BadRequestError(
            `Komponen "${rencanaEvaluasi.metodeEvaluasi} (${rencanaEvaluasi.jenisEvaluasi})" terdeteksi sebagai komponen non-soal `
            + `(Kehadiran/Partisipasi/dst) -- CBT tidak punya data ini, tidak boleh dikirim breakdown soal ke sini. `
            + `Input manual langsung di NL-SIAK, bukan lewat /cbt/komponen/:id/nilai.`
        );
    }

    const hasil = [];
    for (const item of daftarMahasiswa) {
        const { krsId, breakdown } = item;

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
        // Skor diperoleh tidak boleh melebihi skor maksimal unit itu sendiri -- data
        // seperti ini hampir pasti salah kirim dari CBT (skor kebalik/typo), dan kalau
        // dibiarkan bisa bikin Nilai CPMK di atas 100.
        (breakdown || []).forEach((unit, idx) => {
            const skor = parseFloat(unit.skorDiperoleh || 0);
            const maksUnit = parseFloat(unit.skorMaksimal || 0);
            if (skor > maksUnit + 0.01) {
                throw new CustomError.BadRequestError(
                    `Breakdown (krsId ${krsId}) unit ke-${idx + 1}: skorDiperoleh (${skor}) tidak boleh melebihi skorMaksimal (${maksUnit})`
                );
            }
        });

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

        // 1.5. Kalau breakdown dikirim tapi SEMUA unit ke-skip (bobotPoin <= 0, skorMaksimal <= 0,
        //      atau cpmkId kosong), agregatKomponenIni bakal kosong -- ini hampir pasti data yang
        //      belum bener dari CBT (mis. bobotPoin lupa diisi/ke-default 0), jadi TOLAK daripada
        //      diam-diam nyimpen kosong.
        if ((breakdown || []).length > 0 && Object.keys(agregatKomponenIni).length === 0) {
            throw new CustomError.BadRequestError(
                `Breakdown (krsId ${krsId}) dikirim tapi tidak ada satupun unit yang valid -- cek bobotPoin (harus > 0), skorMaksimal (harus > 0), dan cpmkId tiap unit`
            );
        }

        // 1.6. Total bobot poin (lintas semua CPMK) dari breakdown mahasiswa ini TIDAK BOLEH
        //      melebihi bobot evaluasi komponen ini (%) -- aturan yang sama dengan Jalur C
        //      (lihat validasiTotalBobotPoinKomponen di soal.service.js), supaya bobot poin
        //      yang dikirim CBT tetap konsisten dengan rancangan RPS, bukan angka sembarangan.
        const totalBobotPoinKiriman = Object.values(agregatKomponenIni)
            .reduce((sum, agg) => sum + agg.totalBobot, 0);
        const bobotEvaluasi = parseFloat(rencanaEvaluasi.bobot || 0);
        if (totalBobotPoinKiriman > bobotEvaluasi + 0.01) {
            throw new CustomError.BadRequestError(
                `Total bobot poin breakdown (krsId ${krsId}) adalah ${totalBobotPoinKiriman}, tidak boleh melebihi bobot evaluasi komponen ini (${bobotEvaluasi})`
            );
        }

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

        // 3. Gabungkan agregat LINTAS SEMUA KOMPONEN (UTS+UAS+Tugas, dst), rollup ke
        //    CPMK induk, lalu override NilaiCpmkMahasiswa -- sama pola dengan Jalur C.
        //    TIDAK ADA panggilan ke inputNilaiMahasiswa/hitungNilaiAkhir di sini --
        //    nilai akhir MK sepenuhnya urusan simpanNilaiAkhirDariCbt.
        const nilaiCpmkAkurat = await hitungDanOverrideNilaiCpmkDariKomponen(krsId, kelasId, mahasiswaId);

        hasil.push({ krsId, nilaiCpmk: nilaiCpmkAkurat });
    }

    return hasil;
};

// ============================================================================
// SINKRON nilai akhir MK dari CBT -- LANGSUNG tulis ke RincianKrsMahasiswa,
// TIDAK dihitung ulang dari komponen sama sekali. Ini terpisah total dari
// simpanNilaiKomponenDariCbt supaya tidak ada resiko 1 fungsi menimpa hasil
// fungsi lain.
//
// CBT cuma kirim `nilaiAkhir` (angka 0-100) -- huruf mutu & angka mutu
// (A/AB/B/dst) TIDAK perlu dikirim CBT, itu diturunkan otomatis dari tabel
// skala penilaian NL-SIAK sendiri (siak_skala_penilaian per prodi+kurikulum,
// fallback DEFAULT_SKALA kalau belum ada) -- reuse logika yang sama persis
// dengan hitungNilaiAkhir (Jalur A) di penilaian.service.js, cuma sumber
// nilaiAkhir-nya dari CBT, bukan dihitung dari Σ komponen×bobot.
// ============================================================================
export const simpanNilaiAkhirDariCbt = async (daftarMahasiswa) => {
    const hasil = [];
    for (const item of daftarMahasiswa) {
        const { krsId, nilaiAkhir } = item;
        const nilaiAkhirNum = parseFloat(nilaiAkhir);

        const rincian = await RincianKrsMahasiswa.findByPk(krsId);
        if (!rincian) throw new CustomError.NotFoundError(`Rincian KRS ${krsId} tidak ditemukan`);
        if (STATUS_FINAL_ATAU_KUNCI.includes(rincian.status)) {
            throw new CustomError.ForbiddenError(`Nilai mahasiswa (krsId ${krsId}) sudah dikunci/difinalisasi, tidak dapat diubah dari CBT`);
        }

        const { hurufMutu, angkaMutu } = await resolveHurufMutu(krsId, nilaiAkhirNum);

        await RincianKrsMahasiswa.update(
            { nilaiAkhir: nilaiAkhirNum, hurufMutu, angkaMutu },
            { where: { id: krsId } }
        );

        hasil.push({ krsId, nilaiAkhir: nilaiAkhirNum, hurufMutu, angkaMutu });
    }
    return hasil;
};

// Telusuri prodi+kurikulum dari krsId, tarik skala penilaian yang berlaku
// (fallback DEFAULT_SKALA kalau MK/prodi itu belum punya skala sendiri di
// database), lalu cocokkan nilaiAkhir ke skala itu -- identik langkah 3 di
// hitungNilaiAkhir (penilaian.service.js), diringkas jadi 1 fungsi kecil.
const resolveHurufMutu = async (krsId, nilaiAkhir) => {
    const trace = await sequelize.query(`
        SELECT mk.siak_program_studi_id AS prodi_id,
               mk.siak_tahun_kurikulum_id AS kurikulum_id
        FROM siak_rincian_krs_mahasiswa rkm
        LEFT JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id
        LEFT JOIN siak_mata_kuliah mk ON kk.siak_mata_kuliah_id = mk.id
        WHERE rkm.id = :krsId LIMIT 1
    `, { replacements: { krsId }, type: sequelize.QueryTypes.SELECT });

    let skala = DEFAULT_SKALA;
    if (trace?.[0]?.prodi_id && trace?.[0]?.kurikulum_id) {
        const rows = await sequelize.query(`
            SELECT huruf_mutu AS "hurufMutu", angka_mutu AS "angkaMutu", nilai_min AS "nilaiMin"
            FROM siak_skala_penilaian
            WHERE siak_program_studi_id = :prodiId
              AND siak_tahun_kurikulum_id = :kurikulumId
              AND deleted_at IS NULL
            ORDER BY nilai_min DESC
        `, { replacements: { prodiId: trace[0].prodi_id, kurikulumId: trace[0].kurikulum_id }, type: sequelize.QueryTypes.SELECT });
        if (rows.length > 0) skala = rows;
    }

    return getGrade(nilaiAkhir, skala);
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

    const krsIds = [...new Set(semuaAgregat.map(n => n.siakRincianKrsMahasiswaId))];
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
            // Nilai akhir MK (bukan per komponen) -- murni sync dari CBT via
            // simpanNilaiAkhirDariCbt, ditampilkan di sini apa adanya buat referensi.
            nilaiAkhirMk: r ? (r.nilaiAkhir !== null ? parseFloat(r.nilaiAkhir) : null) : null,
            hurufMutuMk: r ? r.hurufMutu : null,
            breakdown: []
        };
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
// breakdown Sub-CPMK Jalur D untuk 1 mahasiswa di 1 komponen evaluasi SAJA,
// lalu hitung ulang CPMK dari komponen-komponen LAIN yang masih tersisa. Tidak
// menyentuh nilai akhir MK sama sekali (itu terpisah, lihat simpanNilaiAkhirDariCbt).
// Berguna khusus buat beresin kasus komponen duplikat: reset yang duplikatnya
// SAJA, tanpa ganggu komponen yang benar.
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

    await NilaiSubcpmkEvaluasiMahasiswa.destroy({
        where: { siakRincianKrsMahasiswaId: krsId, siakRencanaEvaluasiId: rencanaEvaluasiId },
        force: true
    });

    const nilaiCpmk = await hitungDanOverrideNilaiCpmkDariKomponen(krsId, kelasId, mahasiswaId);

    return { krsId, nilaiCpmk, pesan: `Komponen ini berhasil direset utk mahasiswa ${krsId}` };
};

// hitungDanOverrideNilaiCpmkDariKomponen dipindah ke services/penilaian.service.js
// (2026-07-16) supaya bisa dipakai bareng oleh gabungKontribusiManualKeJalurD di
// sana juga (kasus Kehadiran manual + breakdown CBT digabung jadi 1 CPMK) -- lihat
// import di atas.
