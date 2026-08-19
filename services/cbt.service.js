import models from '../models/index.js';
import * as CustomError from '../utils/custom-error.js';
import { DEFAULT_SKALA, getGrade, hitungDanOverrideNilaiCpmkDariKomponen, updateHasilStudiJikaPeriodeLengkap, refreshNilaiAkhirJalurD } from './penilaian.service.js';

const {
    sequelize, RencanaEvaluasi, RincianKrsMahasiswa, KrsMahasiswa, Mahasiswa, CapaianMataKuliah,
    NilaiCpmkMahasiswa, NilaiSubcpmkEvaluasiMahasiswa, PemetaanEvaluasiCpmk, NilaiUnitCbtManual
} = models;

// BUG FIX 2026-08-19: nama variabel ini sejak awal bilang "final ATAU kunci",
// tapi isinya cuma 2 status final -- 'Dikunci' gak pernah ada di sini. Akibatnya
// kelas yang udah dikunci (semua mahasiswa punya nilai_akhir, auto-kunci di
// refreshNilaiAkhirJalurD) masih bisa nerima breakdown CBT baru tanpa ditolak,
// padahal maksudnya "dikunci" itu ya gak boleh diubah lagi. Ditambahin di sini.
const STATUS_FINAL_ATAU_KUNCI = ['Lulus', 'Tidak Lulus', 'Dikunci'];

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

// Revisi 2026-08-10: peringatan (bukan blokir) kalau distribusi bobotPoin yang
// dikirim CBT per CPMK menyimpang jauh dari proporsi resmi di PemetaanEvaluasiCpmk
// (rencana evaluasi). Sebelumnya sistem cuma cek TOTAL bobotPoin <= bobot komponen
// (poin 1.6 di bawah), tidak pernah cek pembagian ANTAR CPMK-nya -- jadi dosen di
// CBT bisa bikin soal dengan bobot yang gak sesuai RPS tanpa ketahuan sama sekali.
// Toleransi: selisih absolut > 3 poin ATAU > 30% dari bobot resmi CPMK itu (mana
// yang lebih besar) -- floor 3 poin supaya CPMK dengan porsi kecil (mis. 2 poin)
// tidak gampang ke-flag cuma karena pembulatan wajar.
const TOLERANSI_SELISIH_BOBOT_CPMK = 3;
const TOLERANSI_RELATIF_BOBOT_CPMK = 0.3;

const cekPeringatanDistribusiBobotCpmk = (agregatKomponenIni, bobotCpmkResmiMap) => {
    const peringatanList = [];
    // CPMK yang resmi ada porsinya di RPS tapi actual-nya beda jauh (termasuk
    // kalau actual-nya 0, artinya CBT sama sekali gak kirim ke CPMK itu).
    Object.entries(bobotCpmkResmiMap).forEach(([cpmkId, bobotResmi]) => {
        const actual = agregatKomponenIni[cpmkId]?.totalBobot || 0;
        const selisih = Math.abs(actual - bobotResmi);
        const toleransi = Math.max(TOLERANSI_SELISIH_BOBOT_CPMK, bobotResmi * TOLERANSI_RELATIF_BOBOT_CPMK);
        if (selisih > toleransi) {
            peringatanList.push(`CPMK ${cpmkId}: bobot poin dikirim ${actual}, rencana evaluasi resmi ${bobotResmi} (selisih ${selisih.toFixed(2)})`);
        }
    });
    // CPMK yang dikirim CBT tapi TIDAK ADA di rencana evaluasi resmi sama sekali
    // (kemungkinan cpmkId salah, atau CPMK itu memang belum dipetakan di RPS).
    Object.keys(agregatKomponenIni).forEach(cpmkId => {
        if (!(cpmkId in bobotCpmkResmiMap)) {
            peringatanList.push(`CPMK ${cpmkId}: dikirim ${agregatKomponenIni[cpmkId].totalBobot} poin, tapi tidak ada di rencana evaluasi resmi komponen ini`);
        }
    });
    if (peringatanList.length === 0) return null;
    return `Distribusi bobot poin per CPMK berbeda dari rencana evaluasi resmi: ${peringatanList.join('; ')}. Nilai tetap tersimpan, ini cuma informasi.`;
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

    // Diambil sekali di luar loop -- sama buat semua mahasiswa di request ini,
    // karena rencanaEvaluasiId-nya sama.
    const pemetaanResmi = await PemetaanEvaluasiCpmk.findAll({
        where: { siakRencanaEvaluasiId: rencanaEvaluasiId }
    });
    const bobotCpmkResmiMap = {}; // { cpmkId: bobotCpmk }
    pemetaanResmi.forEach(row => {
        bobotCpmkResmiMap[row.siakCpmkId] = parseFloat(row.bobotCpmk || 0);
    });

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
        //    Raw breakdown per unit/soal DIIKUTKAN wipe & replace yang SAMA (1
        //    transaksi) supaya siak_nilai_unit_cbt_manual (arahan 2026-08-19: dosen
        //    harus bisa lihat skor MENTAH yang dia input, bukan cuma hasil per
        //    Sub-CPMK) selalu akurat & atomik bareng ledger -- resend TIDAK PERNAH
        //    menyisakan baris lama atau numpuk duplikat.
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

            await NilaiUnitCbtManual.destroy({
                where: { siakRincianKrsMahasiswaId: krsId, siakRencanaEvaluasiId: rencanaEvaluasiId },
                force: true, transaction: trx
            });
            const payloadUnitMentah = (breakdown || []).map((unit, idx) => ({
                siakRincianKrsMahasiswaId: krsId,
                siakRencanaEvaluasiId: rencanaEvaluasiId,
                nomorUnit: String(unit.nomor ?? idx + 1),
                skorDiperoleh: parseFloat(unit.skorDiperoleh || 0),
                skorMaksimal: parseFloat(unit.skorMaksimal || 0),
                pemetaanCpmk: (unit.pemetaanCpmk || []).map(p => ({
                    cpmkId: p.cpmkId,
                    bobotPoin: parseFloat(p.bobotPoin || 0)
                }))
            }));
            if (payloadUnitMentah.length > 0) {
                await NilaiUnitCbtManual.bulkCreate(payloadUnitMentah, { transaction: trx });
            }
        });

        // 3. Gabungkan agregat LINTAS SEMUA KOMPONEN (UTS+UAS+Tugas, dst), rollup ke
        //    CPMK induk, lalu override NilaiCpmkMahasiswa -- sama pola dengan Jalur C.
        const nilaiCpmkAkurat = await hitungDanOverrideNilaiCpmkDariKomponen(krsId, kelasId, mahasiswaId);

        // 4. Revisi 2026-08-10 (CBT dipastikan TIDAK PERNAH kirim /cbt/nilai-akhir,
        //    cuma kirim skor mentah per soal) -- hitung ulang & tulis nilai akhir MK
        //    dari ledger di sini juga, JANGAN cuma nunggu komponen manual (mis.
        //    Kehadiran) dikirim, supaya mata kuliah yang 100% komponennya dari CBT
        //    (tanpa Kehadiran/komponen manual sama sekali) tetap kehitung nilai
        //    akhirnya. Lihat refreshNilaiAkhirJalurD di penilaian.service.js.
        await refreshNilaiAkhirJalurD(krsId, kelasId);

        // 5. Peringatan (bukan blokir) kalau distribusi bobotPoin per CPMK menyimpang
        //    dari rencana evaluasi resmi -- lihat cekPeringatanDistribusiBobotCpmk di atas.
        const peringatanBobot = Object.keys(bobotCpmkResmiMap).length > 0
            ? cekPeringatanDistribusiBobotCpmk(agregatKomponenIni, bobotCpmkResmiMap)
            : null;

        hasil.push({ krsId, nilaiCpmk: nilaiCpmkAkurat, peringatanBobot });
    }

    return hasil;
};

// ============================================================================
// SINKRON nilai akhir MK dari CBT -- LANGSUNG tulis ke RincianKrsMahasiswa,
// TIDAK dihitung ulang dari komponen sama sekali (beda dari refreshNilaiAkhirJalurD
// di penilaian.service.js, yang MENGHITUNG dari ledger).
//
// Revisi 2026-08-10: dipastikan langsung ke tim CBT bahwa endpoint ini TIDAK
// PERNAH dipakai -- CBT cuma kirim skor mentah per soal lewat
// simpanNilaiKomponenDariCbt, yang sekarang SUDAH menghitung & menulis
// nilai_akhir sendiri lewat refreshNilaiAkhirJalurD (lihat poin 4 di fungsi
// itu). Fungsi simpanNilaiAkhirDariCbt ini dibiarkan tetap ada (endpoint POST
// /cbt/nilai-akhir tidak dihapus) sebagai jalur cadangan kalau suatu saat CBT
// (atau konsumen lain) memang mau kirim nilaiAkhir final secara eksplisit --
// tapi kalau itu terjadi BERSAMAAN dengan breakdown yang terus di-resend,
// nilai_akhir manapun yang paling terakhir ditulis yang menang (tidak ada
// penguncian antara dua jalur ini). Selama CBT konsisten cuma kirim skor
// mentah seperti sekarang, ini bukan masalah nyata.
//
// CBT cuma kirim `nilaiAkhir` (angka 0-100) -- huruf mutu & angka mutu
// (A/AB/B/dst) TIDAK perlu dikirim CBT, itu diturunkan otomatis dari tabel
// skala penilaian NL-SIAK sendiri (siak_skala_penilaian per prodi+kurikulum,
// fallback DEFAULT_SKALA kalau belum ada) -- reuse logika yang sama persis
// dengan hitungNilaiAkhir (Jalur A) di penilaian.service.js, cuma sumber
// nilaiAkhir-nya dari CBT, bukan dihitung dari Σ komponen×bobot.
// ============================================================================
// Selisih toleransi (poin, skala 0-100) sebelum nilaiAkhir kiriman CBT dianggap
// mencurigakan dibanding hasil hitung ulang dari ledger internal (lihat
// hitungReferensiNilaiAkhirDariLedger). Nilai kecil (rounding antar sistem)
// selalu wajar -- ini cuma jaring pengaman buat kasus SELISIH BESAR, dua
// skenario nyata yang memicunya: (1) salah satu komponen sudah dikoreksi CBT
// tapi nilaiAkhir lupa dikirim ulang (jadi basi), atau (2) nilaiAkhir yang
// dikirim itu murni skor internal CBT sendiri (mis. rata-rata polos per soal)
// yang tidak memperhitungkan bobotPoin per CPMK/Sub-CPMK atau Kehadiran sama
// sekali. TIDAK memblokir penyimpanan -- desain awal (arahan Pak Fitrah)
// sengaja mempercayai CBT sepenuhnya supaya tidak ada 1 fungsi yang menimpa
// hasil fungsi lain; ini cuma menambahkan flag informatif di response.
const TOLERANSI_SELISIH_NILAI_AKHIR = 3;

const hitungReferensiNilaiAkhirDariLedger = async (krsId, kelasId) => {
    const kelas = await sequelize.query(
        `SELECT siak_mata_kuliah_id AS "mataKuliahId", siak_periode_akademik_id AS "periodeId"
         FROM siak_kelas_kuliah WHERE id = :kelasId LIMIT 1`,
        { replacements: { kelasId }, type: sequelize.QueryTypes.SELECT }
    );
    if (kelas.length === 0) return null;
    const { mataKuliahId, periodeId } = kelas[0];

    const komponenList = await sequelize.query(
        `SELECT id, bobot FROM siak_rencana_evaluasi
         WHERE siak_mata_kuliah_id = :mataKuliahId AND siak_periode_akademik_id = :periodeId
           AND deleted_at IS NULL`,
        { replacements: { mataKuliahId, periodeId }, type: sequelize.QueryTypes.SELECT }
    );
    if (komponenList.length === 0) return null;

    const ledgerAgg = await sequelize.query(
        `SELECT siak_rencana_evaluasi_id AS "rencanaEvaluasiId",
                SUM(skor_terbobot) AS "totalW", SUM(total_bobot) AS "totalB"
         FROM siak_nilai_subcpmk_evaluasi_mahasiswa
         WHERE siak_rincian_krs_mahasiswa_id = :krsId AND deleted_at IS NULL
         GROUP BY siak_rencana_evaluasi_id`,
        { replacements: { krsId }, type: sequelize.QueryTypes.SELECT }
    );
    const ledgerMap = {};
    ledgerAgg.forEach(row => { ledgerMap[row.rencanaEvaluasiId] = row; });

    let totalTerhitung = 0;
    let totalBobotDipakai = 0;
    let adaKomponenBelumLengkap = false;
    komponenList.forEach(k => {
        const row = ledgerMap[k.id];
        const bobotK = parseFloat(k.bobot || 0);
        if (!row || parseFloat(row.totalB || 0) <= 0) {
            adaKomponenBelumLengkap = true;
            return;
        }
        const persenKomponen = (parseFloat(row.totalW) / parseFloat(row.totalB)) * 100;
        totalTerhitung += persenKomponen * (bobotK / 100);
        totalBobotDipakai += bobotK;
    });

    if (totalBobotDipakai === 0) return null;
    return {
        nilaiReferensi: Math.round(totalTerhitung * 100) / 100,
        lengkap: !adaKomponenBelumLengkap
    };
};

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

        // Bandingkan (bukan blokir) ke hasil hitung ulang dari ledger internal --
        // lihat komentar TOLERANSI_SELISIH_NILAI_AKHIR di atas.
        let peringatan = null;
        try {
            const referensi = await hitungReferensiNilaiAkhirDariLedger(krsId, rincian.siakKelasKuliahId);
            if (referensi) {
                const selisih = Math.round((nilaiAkhirNum - referensi.nilaiReferensi) * 100) / 100;
                if (Math.abs(selisih) > TOLERANSI_SELISIH_NILAI_AKHIR) {
                    peringatan = `Nilai akhir yang dikirim (${nilaiAkhirNum}) berbeda ${Math.abs(selisih)} poin dari hasil hitung ulang ledger internal `
                        + `(${referensi.nilaiReferensi}${referensi.lengkap ? '' : ', TAPI ada komponen yang belum ada datanya sama sekali di ledger'}). `
                        + `Kemungkinan penyebab: komponen sudah dikoreksi tapi nilai akhir belum dikirim ulang, atau nilai akhir ini murni skor internal CBT `
                        + `(mis. rata-rata polos per soal) yang belum memperhitungkan bobotPoin per CPMK/Kehadiran. Nilai tetap tersimpan, ini cuma informasi.`;
                }
            }
        } catch (e) {
            // Jangan sampai kegagalan hitung referensi menggagalkan penyimpanan nilai akhir yang sebenarnya valid.
        }

        // Auto-kunci per-kelas -- pola identik Jalur A (hitungNilaiAkhir) &
        // Jalur B (inputNilaiPerCpmk): begitu SEMUA mahasiswa di kelas ini sudah
        // punya nilai_akhir (dari CBT), seluruh kelas otomatis dikunci bareng,
        // supaya nilai kebuka di KHS/Transkrip (hasil-studi.service.js &
        // transkrip.service.js sama-sama syarat status IN Dikunci/Lulus/Tidak
        // Lulus). Sebelumnya jalur ini TIDAK PERNAH auto-kunci sama sekali --
        // nilai bisa masuk penuh tapi mahasiswa gak pernah lihat di KHS sampai
        // ada yang kunci manual.
        const kelasId = rincian.siakKelasKuliahId;
        if (kelasId) {
            const [cekRows] = await sequelize.query(
                `SELECT COUNT(*) AS total,
                        SUM(CASE WHEN nilai_akhir IS NOT NULL THEN 1 ELSE 0 END) AS sudah_dinilai
                 FROM siak_rincian_krs_mahasiswa
                 WHERE siak_kelas_kuliah_id = :kelasId AND deleted_at IS NULL`,
                { replacements: { kelasId }, type: sequelize.QueryTypes.SELECT }
            );
            if (parseInt(cekRows.total) > 0 && parseInt(cekRows.total) === parseInt(cekRows.sudah_dinilai)) {
                await sequelize.query(
                    `UPDATE siak_rincian_krs_mahasiswa
                     SET status = 'Dikunci', updated_at = NOW()
                     WHERE siak_kelas_kuliah_id = :kelasId
                       AND (status IS NULL OR status NOT IN ('Dikunci', 'Lulus', 'Tidak Lulus'))
                       AND deleted_at IS NULL`,
                    { replacements: { kelasId } }
                );

                // Kelas ini baru saja lengkap & terkunci -- utk TIAP mahasiswanya, cek
                // apa SEMUA kelas lain dia di periode yang sama JUGA sudah selesai; kalau
                // iya, hitung & simpan HasilStudi (IPS/IPK) periode itu (lihat komentar
                // lengkap di definisi updateHasilStudiJikaPeriodeLengkap).
                const pesertaKelas = await sequelize.query(
                    `SELECT km.siak_mahasiswa_id AS "mahasiswaId", kk.siak_periode_akademik_id AS "periodeId"
                     FROM siak_rincian_krs_mahasiswa rkm
                     JOIN siak_krs_mahasiswa km ON rkm.siak_krs_mahasiswa_id = km.id
                     JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id
                     WHERE rkm.siak_kelas_kuliah_id = :kelasId AND rkm.deleted_at IS NULL`,
                    { replacements: { kelasId }, type: sequelize.QueryTypes.SELECT }
                );
                for (const p of pesertaKelas) {
                    await updateHasilStudiJikaPeriodeLengkap(p.mahasiswaId, p.periodeId);
                }
            }
        }

        hasil.push({ krsId, nilaiAkhir: nilaiAkhirNum, hurufMutu, angkaMutu, peringatan });
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

    // Reset komponen ngubah ledger juga -- nilai_akhir yang udah kehitung sebelumnya
    // (dari refreshNilaiAkhirJalurD) jadi basi kalau gak ikut dihitung ulang di sini.
    const hasilRefresh = await refreshNilaiAkhirJalurD(krsId, kelasId);

    // Fix 2026-08-10: kalau refresh balik null KARENA ledger-nya kosong total
    // (bukan cuma "belum lengkap"), berarti komponen yang direset ini SATU-SATUNYA
    // data yang pernah ada -- nilai_akhir lama harus ikut dikosongkan, jangan
    // dibiarkan tertinggal basi.
    if (!hasilRefresh) {
        const sisaLedger = await NilaiSubcpmkEvaluasiMahasiswa.count({
            where: { siakRincianKrsMahasiswaId: krsId }
        });
        if (sisaLedger === 0) {
            await RincianKrsMahasiswa.update(
                { nilaiAkhir: null, hurufMutu: null, angkaMutu: null },
                { where: { id: krsId } }
            );
        }
    }

    return { krsId, nilaiCpmk, pesan: `Komponen ini berhasil direset utk mahasiswa ${krsId}` };
};

// hitungDanOverrideNilaiCpmkDariKomponen dipindah ke services/penilaian.service.js
// (2026-07-16) supaya bisa dipakai bareng oleh gabungKontribusiManualKeJalurD di
// sana juga (kasus Kehadiran manual + breakdown CBT digabung jadi 1 CPMK) -- lihat
// import di atas.
