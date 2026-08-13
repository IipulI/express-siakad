import models from "../models/index.js";
import { Op } from 'sequelize';
import { getCpmkColumnsForMataKuliah } from './cpmk.service.js';

const {
    sequelize, PemetaanEvaluasiCpmk,
    NilaiEvaluasiMahasiswa, RincianKrsMahasiswa, KrsMahasiswa, Mahasiswa, KelasKuliah, MataKuliah, SkalaPenilaian,
    MasterMetodeEvaluasi, MasterKomponenEvaluasi,
    ProgramStudi, PeriodeAkademik, Dosen, DosenKelas, JadwalKuliah, Jenjang,
    NilaiCpmkMahasiswa, CapaianMataKuliah, RencanaEvaluasi, NilaiSubcpmkEvaluasiMahasiswa, HasilStudi
} = models;

export const DEFAULT_SKALA = [
    { hurufMutu: 'A', angkaMutu: 4.00, nilaiMin: 81.00, nilaiMax: 100.00 },
    { hurufMutu: 'AB', angkaMutu: 3.50, nilaiMin: 76.00, nilaiMax: 80.00 },
    { hurufMutu: 'B', angkaMutu: 3.00, nilaiMin: 71.00, nilaiMax: 75.00 },
    { hurufMutu: 'BC', angkaMutu: 2.50, nilaiMin: 66.00, nilaiMax: 70.00 },
    { hurufMutu: 'C', angkaMutu: 2.00, nilaiMin: 61.00, nilaiMax: 65.00 },
    { hurufMutu: 'CD', angkaMutu: 1.50, nilaiMin: 41.00, nilaiMax: 60.00 },
    { hurufMutu: 'D', angkaMutu: 1.00, nilaiMin: 1.00, nilaiMax: 40.00 },
    { hurufMutu: 'E', angkaMutu: 0.00, nilaiMin: 0.00, nilaiMax: 0.00 },
];

export const getGrade = (nilai, skala) => {
    const sorted = [...skala].sort((a, b) => b.nilaiMin - a.nilaiMin);
    for (const s of sorted) {
        if (nilai >= s.nilaiMin) {
            return { hurufMutu: s.hurufMutu, angkaMutu: s.angkaMutu };
        }
    }
    return { hurufMutu: 'E', angkaMutu: 0 };
};

// 1. SETUP RPS (DEPRECATED): komponen evaluasi + pemetaan CPMK sekarang disimpan
// lewat RencanaEvaluasi/PemetaanEvaluasiCpmk (POST /mata-kuliah/:id/rencana-evaluasi).
// Endpoint lama ini ditolak supaya tidak ada lagi 2 sumber data yang bisa berbeda.
// 2. INPUT NILAI DINAMIS: Menyimpan skor mahasiswa dalam bentuk Array
export const inputNilaiMahasiswa = async (krsId, arrNilai) => {
    const rincian = await RincianKrsMahasiswa.findByPk(krsId, { attributes: ['id', 'status'] });
    if (!rincian) {
        const err = new Error('Data rincian KRS tidak ditemukan');
        err.statusCode = 404;
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
                siakRencanaEvaluasiId: item.komposisiId,
                siak_rencana_evaluasi_id: item.komposisiId,
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
    // GUARD Jalur D: begitu CBT betulan sudah kirim data (sumber='CBT' di
    // siak_nilai_subcpmk_evaluasi_mahasiswa), rumus Jalur A di bawah (baca
    // NilaiEvaluasiMahasiswa x bobot) DILEWATI SEPENUHNYA -- diganti
    // gabungKontribusiManualKeJalurD, yang menuju refreshNilaiAkhirJalurD.
    //
    // Revisi 2026-08-10 (dipastikan langsung ke tim CBT): CBT TIDAK PERNAH
    // mengirim /cbt/nilai-akhir, cuma kirim skor mentah per soal. Jadi
    // nilai_akhir/huruf_mutu MK sekarang DIHITUNG ULANG di sini dari ledger
    // (gabungan breakdown CBT tiap komponen x bobot resmi RencanaEvaluasi),
    // BUKAN lagi dibiarkan kosong menunggu titipan CBT yang tidak akan pernah
    // datang. Sebelum revisi ini, baris di bawah cuma MEMBACA nilai_akhir yang
    // sudah ada -- karena CBT memang tidak pernah menulisnya, nilai_akhir akan
    // tetap kosong selamanya kalau tidak diubah.
    //
    // CPMK-nya sendiri SELALU digabung lewat "ledger" yang sama (lihat
    // tulisManualRowsKeLedger di bawah + hitungDanOverrideNilaiCpmkDariKomponen),
    // baik ada data CBT atau tidak -- supaya urutan Kehadiran/komponen manual vs
    // breakdown CBT masuk duluan TIDAK masalah (fix bug order-dependency
    // 2026-07-16: sebelumnya kalau Kehadiran diinput SEBELUM CBT kirim breakdown,
    // begitu breakdown CBT masuk, kontribusi Kehadiran hilang total karena
    // ditulis ke 2 tempat berbeda yang tidak saling tahu).
    const jalurDCbt = await sequelize.query(
        `SELECT 1 FROM siak_nilai_subcpmk_evaluasi_mahasiswa
         WHERE siak_rincian_krs_mahasiswa_id = :krsId AND sumber = 'CBT' AND deleted_at IS NULL LIMIT 1`,
        { replacements: { krsId }, type: sequelize.QueryTypes.SELECT }
    );
    if (jalurDCbt.length > 0) {
        return await gabungKontribusiManualKeJalurD(krsId);
    }

    let hasil;
    try {
        hasil = await sequelize.transaction(async (trx) => {
            // 1. Ambil nilai evaluasi mahasiswa (tanpa include CPMK dulu — pakai raw SQL)
            const listNilai = await models.NilaiEvaluasiMahasiswa.findAll({
                where: { siakRincianKrsMahasiswaId: krsId },
                include: [{
                    model: models.RencanaEvaluasi,
                    as: 'rencanaEvaluasi',
                    attributes: ['id', 'bobot', 'metodeEvaluasi']
                }],
                transaction: trx
            });

            // 2. Hitung total skor nilai akhir
            let totalSkor = 0;
            listNilai.forEach(item => {
                if (item.rencanaEvaluasi) {
                    const skor = parseFloat(item.skor);
                    const bobot = parseFloat(item.rencanaEvaluasi.bobot) / 100;
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
                       kk.siak_mata_kuliah_id AS mk_id,
                       kk.siak_periode_akademik_id AS periode_id
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
                const { mk_id, periode_id } = traceResult[0];

                const syaratRows = await sequelize.query(`
                    SELECT re.metode_evaluasi, re.syarat_lulus
                    FROM siak_rencana_evaluasi re
                    WHERE re.siak_mata_kuliah_id = :mkId
                      AND re.siak_periode_akademik_id = :periodeId
                      AND re.syarat_lulus = 'MENJADI_SYARAT_LULUS'
                      AND re.deleted_at IS NULL
                `, { replacements: { mkId: mk_id, periodeId: periode_id }, type: sequelize.QueryTypes.SELECT, transaction: trx });

                if (syaratRows.length > 0) {
                    // Bangun map: metode evaluasi → skor mahasiswa
                    const nilaiMap = {};
                    listNilai.forEach(n => {
                        const metode = n.rencanaEvaluasi?.metodeEvaluasi;
                        if (metode) nilaiMap[metode.toLowerCase()] = parseFloat(n.skor || 0);
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
            // 5. TULIS KONTRIBUSI KE LEDGER (siak_nilai_subcpmk_evaluasi_mahasiswa,
            //    sumber='MANUAL') -- rollup ke siak_nilai_cpmk_mahasiswa yang
            //    sesungguhnya dilakukan SETELAH transaksi ini commit, lewat
            //    hitungDanOverrideNilaiCpmkDariKomponen (baca ledger, gabung
            //    MANUAL+CBT kalau ada keduanya). Dulu di sini langsung tulis ke
            //    siak_nilai_cpmk_mahasiswa -- diganti (2026-07-16) supaya
            //    kontribusi manual selalu tercatat di tempat yang sama dibaca
            //    Jalur D, tidak peduli urutan masuknya.
            // ====================================================================
            const rincianKrs = await models.RincianKrsMahasiswa.findByPk(krsId, {
                include: [{ model: models.KrsMahasiswa, as: 'krsMahasiswa' }],
                transaction: trx
            });

            let kelasId = null, mhsId = null;
            if (rincianKrs && rincianKrs.krsMahasiswa) {
                kelasId = rincianKrs.siakKelasKuliahId;
                mhsId = rincianKrs.krsMahasiswa.siakMahasiswaId;

                if (kelasId && mhsId) {
                    await tulisManualRowsKeLedger(krsId, listNilai, trx);

                    // Auto-kunci: jika semua mahasiswa di kelas sudah punya nilai_akhir → kunci semua
                    const [cekRows] = await sequelize.query(
                        `SELECT COUNT(*) AS total,
                                SUM(CASE WHEN nilai_akhir IS NOT NULL THEN 1 ELSE 0 END) AS sudah_dinilai
                         FROM siak_rincian_krs_mahasiswa
                         WHERE siak_kelas_kuliah_id = :kelasId AND deleted_at IS NULL`,
                        { replacements: { kelasId }, type: sequelize.QueryTypes.SELECT, transaction: trx }
                    );
                    if (parseInt(cekRows.total) > 0 && parseInt(cekRows.total) === parseInt(cekRows.sudah_dinilai)) {
                        await sequelize.query(
                            `UPDATE siak_rincian_krs_mahasiswa
                             SET status = 'Dikunci', updated_at = NOW()
                             WHERE siak_kelas_kuliah_id = :kelasId
                               AND (status IS NULL OR status NOT IN ('Dikunci', 'Lulus', 'Tidak Lulus'))
                               AND deleted_at IS NULL`,
                            { replacements: { kelasId }, transaction: trx }
                        );
                    }
                }
            }

            return { krsId, totalSkor, hurufMutu, angkaMutu, kelasId, mhsId };
        });
    } catch (error) {
        throw new Error("Gagal kalkulasi nilai: " + error.message);
    }

    // Rollup CPMK gabungan (MANUAL yang baru ditulis + CBT kalau ada) -- di LUAR
    // transaksi di atas dengan sengaja, karena fungsi ini buka transaksi sendiri
    // dan harus baca data yang sudah ter-commit.
    if (hasil.kelasId && hasil.mhsId) {
        await hitungDanOverrideNilaiCpmkDariKomponen(krsId, hasil.kelasId, hasil.mhsId);
    }
    const { kelasId: _kelasId, mhsId: _mhsId, ...hasilBersih } = hasil;
    return hasilBersih;
}

// ============================================================================
// Gabungkan agregat (skorTerbobot, totalBobot) yang sudah dihitung per komponen
// LINTAS SEMUA KOMPONEN evaluasi mahasiswa ini (baik dari Jalur D/CBT maupun
// kontribusi manual seperti Kehadiran), plus rollup ke CPMK induk untuk Sub-CPMK.
// Dipindah dari services/cbt.service.js (2026-07-16) supaya bisa dipakai bareng
// oleh gabungKontribusiManualKeJalurD di file ini tanpa circular import -- fungsi
// ini murni baca dari siak_nilai_subcpmk_evaluasi_mahasiswa, tidak peduli sumbernya
// CBT atau MANUAL, jadi otomatis menggabungkan keduanya kalau ada dua-duanya.
// ============================================================================
export const hitungDanOverrideNilaiCpmkDariKomponen = async (krsId, kelasId, mahasiswaId) => {
    const semuaAgregat = await NilaiSubcpmkEvaluasiMahasiswa.findAll({
        where: { siakRincianKrsMahasiswaId: krsId }
    });

    // Selalu wipe dulu -- kalau semuaAgregat kosong (komponen terakhir baru
    // direset), NilaiCpmkMahasiswa mahasiswa ini juga harus ikut kosong,
    // bukan dibiarkan basi dengan angka lama.
    await sequelize.transaction(async (trx) => {
        await NilaiCpmkMahasiswa.destroy({
            where: { siakKelasKuliahId: kelasId, siakMahasiswaId: mahasiswaId },
            force: true, transaction: trx
        });

        if (semuaAgregat.length === 0) return;

        // Pass 1: gabungkan lintas komponen ke cpmkId APA ADANYA (boleh CPMK induk, boleh sub-CPMK)
        const agregatLangsung = {}; // { cpmkId: { skorTerbobot, totalBobot } }
        semuaAgregat.forEach(n => {
            if (!agregatLangsung[n.siakCpmkId]) agregatLangsung[n.siakCpmkId] = { skorTerbobot: 0, totalBobot: 0 };
            agregatLangsung[n.siakCpmkId].skorTerbobot += parseFloat(n.skorTerbobot || 0);
            agregatLangsung[n.siakCpmkId].totalBobot += parseFloat(n.totalBobot || 0);
        });

        const cpmkIdsLangsung = Object.keys(agregatLangsung);

        // Cek parentId tiap CPMK yang disentuh langsung (mitigasi rollup sub-CPMK)
        const daftarCpmk = await CapaianMataKuliah.findAll({
            where: { id: cpmkIdsLangsung },
            attributes: ['id', 'parentId'],
            transaction: trx
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

        if (payloadCpmk.length > 0) {
            await NilaiCpmkMahasiswa.bulkCreate(payloadCpmk, { transaction: trx });
        }
    });

    return await NilaiCpmkMahasiswa.findAll({ where: { siakKelasKuliahId: kelasId, siakMahasiswaId: mahasiswaId } });
};

// ============================================================================
// Tulis kontribusi komponen yang diinput manual (mis. Kehadiran, arahan Pak
// Fitrah 2026-07-16: "Kehadiran gak bisa dari sistem Virza, harus di tempat lu
// langsung. Ambil nilai akhir kehadiran, dikali bobot per Sub-CPMK dibagi total
// Sub-CPMK") sebagai UNIT ke siak_nilai_subcpmk_evaluasi_mahasiswa
// (sumber='MANUAL', bukan 'CBT'). MENGGANTI seluruh baris MANUAL lama utk krsId
// ini (supaya re-input tidak numpuk), TIDAK menyentuh baris sumber='CBT'.
// Dipakai baik oleh alur non-CBT (hitungNilaiAkhir) maupun alur CBT
// (gabungKontribusiManualKeJalurD) -- supaya kontribusi manual SELALU ada di
// ledger yang sama, tidak peduli urutan CBT vs manual masuk duluan.
//
// PENTING soal skala: hitungDanOverrideNilaiCpmkDariKomponen mengasumsikan setiap
// baris sudah dalam konvensi Jalur D (skorTerbobot/totalBobot adalah PECAHAN
// 0..1, lalu di-kali 100 di akhir -- lihat Rumus 1: w = S x (B/M)). Skor manual
// (mis. Kehadiran) itu sendiri sudah dalam skala 0-100 (S/M dengan M=100), jadi
// bobotCpmk-nya HARUS dibagi 100 dulu supaya hasil gabungannya konsisten --
// kalau tidak, hasil akhir bisa jauh di atas 100 (bobotCpmk lama itu skala
// "persen dari 100 total", bukan skala "poin" spt Jalur D).
// ============================================================================
const tulisManualRowsKeLedger = async (krsId, listNilai, trx) => {
    await NilaiSubcpmkEvaluasiMahasiswa.destroy({
        where: { siakRincianKrsMahasiswaId: krsId, sumber: 'MANUAL' },
        force: true, transaction: trx
    });

    if (listNilai.length === 0) return;

    const rencanaEvaluasiIds = listNilai
        .map(n => n.siak_rencana_evaluasi_id || n.siakRencanaEvaluasiId)
        .filter(Boolean);
    if (rencanaEvaluasiIds.length === 0) return;

    const pemetaanRows = await sequelize.query(
        `SELECT pec.siak_rencana_evaluasi_id AS rencana_evaluasi_id,
                pec.siak_cpmk_id AS cpmk_id, pec.bobot_cpmk AS bobot_cpmk
         FROM siak_pemetaan_evaluasi_cpmk pec
         WHERE pec.siak_rencana_evaluasi_id IN (:rencanaEvaluasiIds) AND pec.deleted_at IS NULL`,
        { replacements: { rencanaEvaluasiIds }, type: sequelize.QueryTypes.SELECT, transaction: trx }
    );
    const pemetaanMap = {};
    pemetaanRows.forEach(row => {
        if (!pemetaanMap[row.rencana_evaluasi_id]) pemetaanMap[row.rencana_evaluasi_id] = [];
        pemetaanMap[row.rencana_evaluasi_id].push({ cpmkId: row.cpmk_id, bobotCpmk: parseFloat(row.bobot_cpmk || 0) });
    });

    const payloadManual = [];
    listNilai.forEach(nilai => {
        const rencanaEvaluasiId = nilai.siak_rencana_evaluasi_id || nilai.siakRencanaEvaluasiId;
        const skor = parseFloat(nilai.skor || 0);
        (pemetaanMap[rencanaEvaluasiId] || []).forEach(({ cpmkId, bobotCpmk }) => {
            payloadManual.push({
                siakRincianKrsMahasiswaId: krsId,
                siakRencanaEvaluasiId: rencanaEvaluasiId,
                siakCpmkId: cpmkId,
                skorTerbobot: skor * (bobotCpmk / 100),
                totalBobot: bobotCpmk,
                sumber: 'MANUAL'
            });
        });
    });

    if (payloadManual.length > 0) {
        await NilaiSubcpmkEvaluasiMahasiswa.bulkCreate(payloadManual, { transaction: trx });
    }
};

// Revisi 2026-08-10 (hasil ketemu langsung sama tim CBT): CBT dipastikan TIDAK
// PERNAH mengirim /cbt/nilai-akhir sama sekali -- CBT cuma kirim skor mentah
// (breakdown per soal). Sebelumnya fungsi ini cuma BACA nilai_akhir yang sudah
// ada (murni titipan CBT), yang berarti nilai_akhir MK bakal kosong SELAMANYA
// begitu ada data CBT. Sekarang nilai_akhir dihitung SENDIRI dari ledger
// (gabungan breakdown CBT tiap komponen + kontribusi manual seperti Kehadiran,
// dikalikan bobot resmi RencanaEvaluasi masing-masing) -- rumus identik dengan
// hitungReferensiNilaiAkhirDariLedger di cbt.service.js, cuma di sini dipakai
// buat MENULIS nilai_akhir, bukan sekadar dibandingkan.
const hitungNilaiAkhirDariLedgerJalurD = async (krsId, kelasId) => {
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
    komponenList.forEach(k => {
        const row = ledgerMap[k.id];
        const bobotK = parseFloat(k.bobot || 0);
        if (!row || parseFloat(row.totalB || 0) <= 0) return;
        const persenKomponen = (parseFloat(row.totalW) / parseFloat(row.totalB)) * 100;
        totalTerhitung += persenKomponen * (bobotK / 100);
        totalBobotDipakai += bobotK;
    });

    // Belum ada komponen manapun yang punya data -- jangan tulis 0 seolah itu
    // nilai final (bisa salah kepicu auto-kunci kelas padahal belum ada apa-apa).
    if (totalBobotDipakai === 0) return null;
    return Math.round(totalTerhitung * 100) / 100;
};

// Dipakai bersama oleh gabungKontribusiManualKeJalurD (lewat input manual, mis.
// Kehadiran) DAN simpanNilaiKomponenDariCbt di cbt.service.js (lewat breakdown
// CBT langsung) -- supaya nilai akhir tetap kehitung otomatis walau mata kuliah
// yang bersangkutan TIDAK PUNYA komponen manual sama sekali (100% dari CBT),
// yang kalau cuma dipicu dari jalur manual gak akan pernah kesentuh sama sekali.
export const refreshNilaiAkhirJalurD = async (krsId, kelasId) => {
    if (!kelasId) return null;

    const rincianKrs = await models.RincianKrsMahasiswa.findByPk(krsId);
    if (!rincianKrs || ['Lulus', 'Tidak Lulus'].includes(rincianKrs.status)) return null;

    const nilaiAkhirBaru = await hitungNilaiAkhirDariLedgerJalurD(krsId, kelasId);
    if (nilaiAkhirBaru === null) return null;

    // Skala dinamis per prodi+kurikulum kalau ada, fallback DEFAULT_SKALA kalau
    // belum dikonfigurasi -- pola sama dengan resolveHurufMutu di cbt.service.js.
    const traceSkala = await sequelize.query(
        `SELECT mk.siak_program_studi_id AS "prodiId", mk.siak_tahun_kurikulum_id AS "kurikulumId"
         FROM siak_rincian_krs_mahasiswa rkm
         LEFT JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id
         LEFT JOIN siak_mata_kuliah mk ON kk.siak_mata_kuliah_id = mk.id
         WHERE rkm.id = :krsId LIMIT 1`,
        { replacements: { krsId }, type: sequelize.QueryTypes.SELECT }
    );
    let skalaAktif = DEFAULT_SKALA;
    if (traceSkala?.[0]?.prodiId && traceSkala?.[0]?.kurikulumId) {
        const skalaRows = await sequelize.query(
            `SELECT huruf_mutu AS "hurufMutu", angka_mutu AS "angkaMutu", nilai_min AS "nilaiMin"
             FROM siak_skala_penilaian
             WHERE siak_program_studi_id = :prodiId AND siak_tahun_kurikulum_id = :kurikulumId
               AND deleted_at IS NULL
             ORDER BY nilai_min DESC`,
            { replacements: { prodiId: traceSkala[0].prodiId, kurikulumId: traceSkala[0].kurikulumId }, type: sequelize.QueryTypes.SELECT }
        );
        if (skalaRows.length > 0) skalaAktif = skalaRows;
    }
    const grade = getGrade(nilaiAkhirBaru, skalaAktif);
    const hurufMutu = grade.hurufMutu;
    const angkaMutu = grade.angkaMutu;

    await RincianKrsMahasiswa.update(
        { nilaiAkhir: nilaiAkhirBaru, hurufMutu, angkaMutu },
        { where: { id: krsId } }
    );

    // Auto-kunci per-kelas -- pola identik simpanNilaiAkhirDariCbt (cbt.service.js):
    // begitu SEMUA mahasiswa di kelas ini sudah punya nilai_akhir, kelas otomatis
    // dikunci, supaya nilai kebuka di KHS/Transkrip.
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

    return { krsId, nilaiAkhir: nilaiAkhirBaru, hurufMutu, angkaMutu };
};

// Dipanggil oleh hitungNilaiAkhir kalau krsId sudah punya data CBT (sumber='CBT').
const gabungKontribusiManualKeJalurD = async (krsId) => {
    const rincianKrs = await models.RincianKrsMahasiswa.findByPk(krsId, {
        include: [{ model: models.KrsMahasiswa, as: 'krsMahasiswa' }]
    });
    if (!rincianKrs || !rincianKrs.krsMahasiswa) {
        return { krsId, totalSkor: 0, hurufMutu: null, angkaMutu: 0 };
    }
    const kelasId = rincianKrs.siakKelasKuliahId;
    const mahasiswaId = rincianKrs.krsMahasiswa.siakMahasiswaId;

    // Komponen yang diinput manual (mis. Kehadiran) -- CBT TIDAK PERNAH menulis ke
    // siak_nilai_evaluasi_mahasiswa, jadi baris di sini otomatis cuma yang manual.
    const listNilai = await NilaiEvaluasiMahasiswa.findAll({
        where: { siakRincianKrsMahasiswaId: krsId }
    });

    await sequelize.transaction(async (trx) => {
        await tulisManualRowsKeLedger(krsId, listNilai, trx);
    });

    // Rollup ulang CPMK dari SEMUA sumber (CBT + MANUAL) utk krsId ini.
    await hitungDanOverrideNilaiCpmkDariKomponen(krsId, kelasId, mahasiswaId);

    // Hitung ulang & tulis nilai akhir MK dari ledger gabungan (lihat komentar revisi di atas).
    const hasilRefresh = await refreshNilaiAkhirJalurD(krsId, kelasId);

    const existing = hasilRefresh ? null : await models.RincianKrsMahasiswa.findByPk(krsId);
    return {
        krsId,
        totalSkor: hasilRefresh ? hasilRefresh.nilaiAkhir : parseFloat(existing?.nilaiAkhir || 0),
        hurufMutu: hasilRefresh ? hasilRefresh.hurufMutu : (existing?.hurufMutu ?? null),
        angkaMutu: hasilRefresh ? hasilRefresh.angkaMutu : parseFloat(existing?.angkaMutu || 0)
    };
};

// 4. GENERATOR RAPOR OBE MAHASISWA
export const getRaporOBEMahasiswa = async (rincianKrsId) => {
    try {
        // PENTING: rapor HARUS dibaca dari NilaiCpmkMahasiswa (hasil rollup
        // hitungDanOverrideNilaiCpmkDariKomponen, yang sudah menggabungkan
        // seluruh sumber CBT + MANUAL). Jangan baca dari NilaiEvaluasiMahasiswa
        // -- tabel itu cuma diisi komponen manual (mis. Kehadiran), breakdown
        // CBT (UTS/UAS/Tugas) tidak pernah menulis ke sana sehingga
        // kontribusinya hilang total dari rapor.
        const rincian = await RincianKrsMahasiswa.findByPk(rincianKrsId, {
            include: [{ model: KrsMahasiswa, as: 'krsMahasiswa' }]
        });
        if (!rincian || !rincian.krsMahasiswa) return [];

        const daftarNilaiCpmk = await NilaiCpmkMahasiswa.findAll({
            where: {
                siakKelasKuliahId: rincian.siakKelasKuliahId,
                siakMahasiswaId: rincian.krsMahasiswa.siakMahasiswaId
            },
            include: [{
                model: CapaianMataKuliah,
                as: 'capaianMataKuliah',
                attributes: ['kode', 'deskripsi', 'target']
            }]
        });

        return daftarNilaiCpmk.map(n => {
            const target = n.capaianMataKuliah?.target != null ? parseFloat(n.capaianMataKuliah.target) : null;
            const nilaiCapaian = parseFloat(n.nilai);
            return {
                kodeCpmk: n.capaianMataKuliah?.kode || n.siakCapaianMataKuliahId,
                deskripsi: n.capaianMataKuliah?.deskripsi || '-',
                nilaiCapaian,
                target,
                statusKetercapaian: target != null ? (nilaiCapaian >= target ? 'Memenuhi' : 'Belum Memenuhi') : null
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
        const periodeId = kelas.siakPeriodeAkademikId;

        // 2. Ambil komposisi nilai MK (dari Rencana Evaluasi, per MK + per periode)
        const komposisiList = await RencanaEvaluasi.findAll({
            where: { siakMataKuliahId: mkId, siakPeriodeAkademikId: kelas.siakPeriodeAkademikId },
            attributes: ['id', 'bobot', 'metodeEvaluasi'],
            order: [['createdAt', 'ASC']]
        });

        // Map by ID, tampilkan metodeEvaluasi sebagai uppercase label
        const komposisiMap = {};
        komposisiList.forEach(k => {
            komposisiMap[k.id] = {
                id: k.id,
                label: (k.metodeEvaluasi || '-').toUpperCase(),
                persentase: parseFloat(k.bobot || 0)
            };
        });

        // 3. Ambil skala nilai dari DB (scoping per Jenjang, bukan per Prodi --
        // konsisten dengan Batas SKS/Predikat Kelulusan), fallback ke DEFAULT jika kosong
        let skalaAktif = DEFAULT_SKALA;
        if (prodiId && kurikulumId) {
            const prodi = await ProgramStudi.findByPk(prodiId, { attributes: ['siakJenjangId'] });
            const jenjangId = prodi?.siakJenjangId;

            if (jenjangId) {
                // Prioritas: skala nilai spesifik periode ini. Kalau belum ada
                // (mis. belum di-set untuk periode berjalan), fallback ke skala
                // nilai jenjang+kurikulum tanpa periode (data lama/legacy).
                let rawSkala = periodeId
                    ? await SkalaPenilaian.findAll({
                        where: { siakJenjangId: jenjangId, siakTahunKurikulumId: kurikulumId, siakPeriodeAkademikId: periodeId },
                        attributes: ['hurufMutu', 'angkaMutu', 'nilaiMin', 'nilaiMax'],
                        order: [['nilaiMin', 'DESC']]
                    })
                    : [];

                if (rawSkala.length === 0) {
                    rawSkala = await SkalaPenilaian.findAll({
                        where: { siakJenjangId: jenjangId, siakTahunKurikulumId: kurikulumId, siakPeriodeAkademikId: null },
                        attributes: ['hurufMutu', 'angkaMutu', 'nilaiMin', 'nilaiMax'],
                        order: [['nilaiMin', 'DESC']]
                    });
                }

                if (rawSkala.length > 0) {
                    skalaAktif = rawSkala.map(s => ({
                        hurufMutu: s.hurufMutu,
                        angkaMutu: parseFloat(s.angkaMutu || 0),
                        nilaiMin: parseFloat(s.nilaiMin || 0),
                        nilaiMax: parseFloat(s.nilaiMax || 0),
                    }));
                }
            }
        }

        // 4. Ambil semua rincian KRS di kelas
        const allRincian = await RincianKrsMahasiswa.findAll({
            where: { siakKelasKuliahId: kelasId },
            attributes: ['id', 'nilaiAkhir', 'hurufMutu', 'angkaMutu', 'status'],
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
                    attributes: ['id', 'siakRencanaEvaluasiId', 'skor'],
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
                n => komposisiIds.has(n.siakRencanaEvaluasiId)
            );
            const punyaNilaiCocok = nilaiYangCocok.length > 0;

            const existing = mahasiswaMap[mhsId];
            const existingCocok = existing
                ? (existing.daftarNilaiEvaluasi || []).filter(
                    n => komposisiIds.has(n.siakRencanaEvaluasiId)
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

        // 5b. Nilai per komponen versi JALUR D -- NilaiEvaluasiMahasiswa (dipakai
        // di atas) cuma keisi dari input manual (Jalur A/Kehadiran), breakdown CBT
        // TIDAK PERNAH nulis ke situ (nyimpennya di ledger siak_nilai_subcpmk_evaluasi_mahasiswa,
        // per Sub-CPMK, bukan per komponen). Supaya UTS/UAS/Tugas dari Jalur D juga
        // kelihatan di layar ini (bukan cuma null), hitung representasi "nilai
        // komponen" dari ledger: Σ skorTerbobot ÷ Σ totalBobot × 100 -- rumus sama
        // persis dengan yang dipakai buat Nilai Sub-CPMK, cuma diagregasi per
        // komponen (rencanaEvaluasiId) bukan per Sub-CPMK.
        const krsIdList = pesertaUnik.map(item => item.id);
        const jalurDPerKomponen = {}; // { krsId: { rencanaEvaluasiId: nilai } }
        if (krsIdList.length > 0) {
            const ledgerAgg = await sequelize.query(`
                SELECT siak_rincian_krs_mahasiswa_id AS "krsId", siak_rencana_evaluasi_id AS "rencanaEvaluasiId",
                       SUM(skor_terbobot) AS "totalW", SUM(total_bobot) AS "totalT"
                FROM siak_nilai_subcpmk_evaluasi_mahasiswa
                WHERE siak_rincian_krs_mahasiswa_id IN (:krsIdList) AND deleted_at IS NULL
                GROUP BY siak_rincian_krs_mahasiswa_id, siak_rencana_evaluasi_id
            `, { replacements: { krsIdList }, type: sequelize.QueryTypes.SELECT });
            ledgerAgg.forEach(row => {
                const t = parseFloat(row.totalT || 0);
                if (t <= 0) return;
                if (!jalurDPerKomponen[row.krsId]) jalurDPerKomponen[row.krsId] = {};
                jalurDPerKomponen[row.krsId][row.rencanaEvaluasiId] = Math.round((parseFloat(row.totalW || 0) / t) * 10000) / 100;
            });
        }

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
                const komp = komposisiMap[n.siakRencanaEvaluasiId];
                if (komp) {
                    const skor = parseFloat(n.skor || 0);
                    nilaiPerKomponen[komp.label] = skor;
                    nilaiAkhirHitung += skor * (komp.persentase / 100);
                    adaNilai = true;
                }
            });

            // Komponen belum diinput lewat Jalur A/manual -> coba isi dari ledger
            // Jalur D dulu (kalau ada), baru null kalau dua-duanya kosong. Ikut
            // ditambahkan ke nilaiAkhirHitung/adaNilai juga -- kalau tidak, mahasiswa
            // yang nilai_akhir di DB-nya belum ke-refresh (breakdown lama, belum ada
            // write baru yang men-trigger refreshNilaiAkhirJalurD) akan tetap tampil
            // Nilai Akhir 0 walau nilai per komponennya sendiri sudah lengkap.
            const ledgerMhsIni = jalurDPerKomponen[item.id] || {};
            komposisiList.forEach(k => {
                const label = (k.metodeEvaluasi || '-').toUpperCase();
                if (label in nilaiPerKomponen) return;
                if (k.id in ledgerMhsIni) {
                    const skorLedger = ledgerMhsIni[k.id];
                    const persentase = parseFloat(k.bobot || 0);
                    nilaiPerKomponen[label] = skorLedger;
                    nilaiAkhirHitung += skorLedger * (persentase / 100);
                    adaNilai = true;
                } else {
                    nilaiPerKomponen[label] = null;
                }
            });

            nilaiAkhirHitung = Math.round(nilaiAkhirHitung * 100) / 100;

            // Nilai akhir final
            const nilaiAkhirDB = parseFloat(item.nilaiAkhir || 0);
            const nilaiAkhirFinal = nilaiAkhirDB > 0
                ? nilaiAkhirDB
                : (adaNilai ? nilaiAkhirHitung : 0);

            // Grade dari skala nilai (DB atau default)
            const storedGrade = item.hurufMutu;
            const storedAngka = item.angkaMutu;
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

            // Lulus mata kuliah ditentukan dari huruf mutu vs skala (CD ke atas = Lulus),
            // bukan dari status workflow kunci nilai.
            const lulus = !!grade.hurufMutu && !['-', 'D', 'E'].includes(grade.hurufMutu);

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
                lulus,
                keterangan: ['Dikunci', 'Lulus', 'Tidak Lulus'].includes(item.status)
                    ? 'Nilai sudah final, tidak dapat diedit' : 'Belum Terkunci'
            };
        });

        // Header kolom untuk frontend (dinamis sesuai komposisi)
        const headerKolom = komposisiList.map(k => ({
            id: k.id,
            label: (k.metodeEvaluasi || '-').toUpperCase(),
            bobot: parseFloat(k.bobot || 0),
            labelKolom: `${(k.metodeEvaluasi || '-').toUpperCase()} (${parseFloat(k.bobot || 0).toFixed(2)}%)`
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
        {
            where: {
                siak_kelas_kuliah_id: kelasId,
                [Op.or]: [
                    { status: { [Op.notIn]: STATUS_FINAL } },
                    { status: null }
                ]
            }
        }
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
// AUTO-GENERATE HasilStudi (IPS/IPK per periode) -- SEBELUM INI, tidak ada
// satupun kode yang menulis ke tabel siak_hasil_studi (cuma dibaca di
// KHS/Transkrip/Dashboard/dst) -- 323 baris yang ada di produksi itu murni
// data seed lama (semua created_at sama persis), gak nyambung ke periode
// aktif manapun. Akibatnya walau status RincianKrsMahasiswa sudah Dikunci,
// KHS periode itu TETAP kosong karena baris ringkasannya sendiri gak ada.
//
// Dipanggil tiap kali 1 kelas selesai auto-kunci (lihat cbt.service.js &
// hitungNilaiAkhir/inputNilaiPerCpmk) -- utk TIAP mahasiswa di kelas itu, cek:
// apa SEMUA kelas lain mahasiswa itu di periode yang SAMA juga sudah
// Dikunci/Lulus/Tidak Lulus? Kalau iya (baru compute-able), hitung IPS
// (rata-rata angkaMutu tertimbang SKS, se-periode itu SAJA) dan IPK (rata-rata
// tertimbang SKS, SEMUA periode yang sudah final -- dihitung ulang dari
// RincianKrsMahasiswa asli, BUKAN dari HasilStudi seed lama yang gak akurat),
// lalu upsert 1 baris HasilStudi.
// ====================================================================
const STATUS_LOCKED_ATAU_FINAL = ['Dikunci', 'Lulus', 'Tidak Lulus'];
const GRADE_LULUS_SKS = ['A', 'AB', 'B', 'BC', 'C', 'CD'];

export const updateHasilStudiJikaPeriodeLengkap = async (mahasiswaId, periodeId) => {
    if (!mahasiswaId || !periodeId) return;

    const krsMhs = await KrsMahasiswa.findOne({
        where: { siakMahasiswaId: mahasiswaId, siakPeriodeAkademikId: periodeId }
    });
    if (!krsMhs) return;

    // Semua kelas yang diambil mahasiswa ini DI PERIODE INI SAJA
    const rincianPeriodeIni = await sequelize.query(`
        SELECT rkm.status, rkm.angka_mutu AS "angkaMutu", rkm.huruf_mutu AS "hurufMutu", mk.total_sks AS "totalSks"
        FROM siak_rincian_krs_mahasiswa rkm
        JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id
        JOIN siak_mata_kuliah mk ON kk.siak_mata_kuliah_id = mk.id
        WHERE rkm.siak_krs_mahasiswa_id = :krsMhsId AND rkm.deleted_at IS NULL
    `, { replacements: { krsMhsId: krsMhs.id }, type: sequelize.QueryTypes.SELECT });

    if (rincianPeriodeIni.length === 0) return;

    // Belum semua kelas di periode ini Dikunci/final -> belum bisa dihitung, keluar diam-diam
    const semuaLengkap = rincianPeriodeIni.every(r => STATUS_LOCKED_ATAU_FINAL.includes(r.status));
    if (!semuaLengkap) return;

    let totalBobotSemester = 0, totalSksSemester = 0, sksLulusSemester = 0;
    rincianPeriodeIni.forEach(r => {
        const sks = parseInt(r.totalSks || 0);
        totalSksSemester += sks;
        totalBobotSemester += parseFloat(r.angkaMutu || 0) * sks;
        if (GRADE_LULUS_SKS.includes(r.hurufMutu)) sksLulusSemester += sks;
    });
    const ips = totalSksSemester > 0 ? Math.round((totalBobotSemester / totalSksSemester) * 100) / 100 : 0;

    // IPK kumulatif: dihitung ULANG dari SEMUA RincianKrsMahasiswa mahasiswa ini
    // yang sudah final di SEMUA periode (bukan lanjutin dari HasilStudi lama --
    // supaya konsisten 1 sumber data, gak campur sama seed dummy yang gak akurat).
    const rincianSemuaPeriode = await sequelize.query(`
        SELECT rkm.angka_mutu AS "angkaMutu", mk.total_sks AS "totalSks"
        FROM siak_rincian_krs_mahasiswa rkm
        JOIN siak_krs_mahasiswa km ON rkm.siak_krs_mahasiswa_id = km.id
        JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id
        JOIN siak_mata_kuliah mk ON kk.siak_mata_kuliah_id = mk.id
        WHERE km.siak_mahasiswa_id = :mahasiswaId
          AND rkm.status IN ('Dikunci', 'Lulus', 'Tidak Lulus')
          AND rkm.deleted_at IS NULL AND km.deleted_at IS NULL
    `, { replacements: { mahasiswaId }, type: sequelize.QueryTypes.SELECT });

    let totalBobotKumulatif = 0, totalSksKumulatif = 0;
    rincianSemuaPeriode.forEach(r => {
        const sks = parseInt(r.totalSks || 0);
        totalSksKumulatif += sks;
        totalBobotKumulatif += parseFloat(r.angkaMutu || 0) * sks;
    });
    const ipk = totalSksKumulatif > 0 ? Math.round((totalBobotKumulatif / totalSksKumulatif) * 100) / 100 : 0;

    const existing = await HasilStudi.findOne({
        where: { siakMahasiswaId: mahasiswaId, siakPeriodeAkademikId: periodeId }
    });
    const payload = {
        siakMahasiswaId: mahasiswaId, siakPeriodeAkademikId: periodeId,
        semester: krsMhs.semester, ips, ipk,
        sksDiambil: totalSksSemester, sksLulus: sksLulusSemester
    };
    if (existing) await existing.update(payload);
    else await HasilStudi.create(payload);
};

// ====================================================================
// FINALISASI NILAI KELAS (Permanent Lock setelah masa sanggah habis)
// Koordinator MK mengeksekusi ini setelah masa sanggah berakhir.
// Status berubah dari 'Dikunci' → 'Lulus' / 'Tidak Lulus' (permanen)
// ====================================================================
const GRADE_LULUS = ['A', 'AB', 'B', 'BC', 'C', 'CD'];

export const finalisasiNilaiKelas = async (kelasId) => {
    const kelas = await KelasKuliah.findByPk(kelasId, { attributes: ['id', 'siakMataKuliahId'] });
    if (!kelas) throw new Error('Kelas tidak ditemukan');

    // Leaf-level CPMK/Sub-CPMK + target -- sumber sama persis dengan laporan
    // monitoring (getLaporanCpmkPerMahasiswa), supaya "harus mengulang CPMK mana"
    // di sini konsisten dengan yang ditampilkan di laporan.
    const { columns: cpmkList } = await getCpmkColumnsForMataKuliah(kelas.siakMataKuliahId);

    const rincianList = await RincianKrsMahasiswa.findAll({
        where: { siak_kelas_kuliah_id: kelasId },
        attributes: ['id', 'status', 'huruf_mutu', 'hurufMutu'],
        include: [{ model: KrsMahasiswa, as: 'krsMahasiswa', attributes: ['siakMahasiswaId'] }]
    });

    if (rincianList.length === 0) throw new Error('Tidak ada mahasiswa di kelas ini');

    const belumDikunci = rincianList.filter(r => r.status !== 'Dikunci' && !STATUS_FINAL.includes(r.status));
    if (belumDikunci.length > 0) {
        throw new Error(`${belumDikunci.length} mahasiswa belum dikunci nilainya. Kunci semua nilai terlebih dahulu sebelum finalisasi.`);
    }

    const yangBisaFinal = rincianList.filter(r => !STATUS_FINAL.includes(r.status));

    const mahasiswaIds = [...new Set(yangBisaFinal.map(r => r.krsMahasiswa?.siakMahasiswaId).filter(Boolean))];
    const semuaNilaiCpmk = await NilaiCpmkMahasiswa.findAll({
        where: { siakKelasKuliahId: kelasId, siakMahasiswaId: mahasiswaIds },
        include: [{ model: CapaianMataKuliah, as: 'capaianMataKuliah', attributes: ['kode'] }]
    });

    let jumlahLulus = 0;
    let jumlahTidakLulus = 0;
    const daftarPerluMengulangCpmk = [];

    for (const r of yangBisaFinal) {
        const grade = r.hurufMutu || r.huruf_mutu;
        const mahasiswaId = r.krsMahasiswa?.siakMahasiswaId;

        // Cek tiap CPMK/Sub-CPMK terhadap target -- kalau ada yang di bawah target,
        // mahasiswa WAJIB mengulang CPMK itu walau nilai akhir MK-nya sendiri sudah
        // di atas passing grade (termasuk nilai akhir dari CBT/Jalur D, yang TIDAK
        // disentuh sama sekali di sini -- huruf_mutu/nilai_akhir tetap murni dari
        // sumbernya masing-masing, cuma status kelulusan MK yang dipengaruhi).
        const nilaiMhs = semuaNilaiCpmk.filter(n => String(n.siakMahasiswaId) === String(mahasiswaId));
        const cpmkGagal = [];
        cpmkList.forEach(cpmk => {
            const match = nilaiMhs.find(n =>
                String(n.siakCapaianMataKuliahId) === String(cpmk.id) ||
                String(n.capaianMataKuliah?.kode || '').toUpperCase() === String(cpmk.kode).toUpperCase()
            );
            if (match && parseFloat(match.nilai) < cpmk.target) {
                cpmkGagal.push({ kode: cpmk.kode, nilai: parseFloat(match.nilai), target: cpmk.target });
            }
        });

        const isLulus = GRADE_LULUS.includes(grade) && cpmkGagal.length === 0;
        await r.update({ status: isLulus ? 'Lulus' : 'Tidak Lulus' });
        if (isLulus) jumlahLulus++;
        else jumlahTidakLulus++;

        if (cpmkGagal.length > 0) {
            daftarPerluMengulangCpmk.push({ rincianKrsId: r.id, mahasiswaId, cpmkGagal });
        }
    }

    return {
        kelasId,
        jumlahLulus,
        jumlahTidakLulus,
        jumlahSudahFinalSebelumnya: rincianList.length - yangBisaFinal.length,
        daftarPerluMengulangCpmk,
        pesan: `Finalisasi selesai. ${jumlahLulus} lulus, ${jumlahTidakLulus} tidak lulus.`
            + (daftarPerluMengulangCpmk.length > 0 ? ` ${daftarPerluMengulangCpmk.length} mahasiswa punya CPMK di bawah target, wajib mengulang.` : '')
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

    // GUARD Jalur D: kalau mata kuliah ini sudah punya data breakdown dari CBT (sumber='CBT'),
    // TOLAK input manual per CPMK -- supaya tidak diam-diam menimpa nilai_akhir & NilaiCpmkMahasiswa
    // yang sudah dihitung/disinkron dari CBT (lihat guard yang sama di hitungNilaiAkhir).
    const jalurDCbt = await sequelize.query(
        `SELECT 1 FROM siak_nilai_subcpmk_evaluasi_mahasiswa
         WHERE siak_rincian_krs_mahasiswa_id = :krsId AND sumber = 'CBT' AND deleted_at IS NULL LIMIT 1`,
        { replacements: { krsId }, type: sequelize.QueryTypes.SELECT }
    );
    if (jalurDCbt.length > 0) {
        throw Object.assign(
            new Error('Nilai mata kuliah ini dikelola dari sistem CBT eksternal (Jalur D), tidak dapat diinput manual per CPMK'),
            { statusCode: 403 }
        );
    }

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

        // Auto-kunci: jika semua mahasiswa di kelas sudah punya nilai_akhir → kunci semua
        const [cekRows] = await sequelize.query(
            `SELECT COUNT(*) AS total,
                    SUM(CASE WHEN nilai_akhir IS NOT NULL THEN 1 ELSE 0 END) AS sudah_dinilai
             FROM siak_rincian_krs_mahasiswa
             WHERE siak_kelas_kuliah_id = :kelasId AND deleted_at IS NULL`,
            { replacements: { kelasId }, type: sequelize.QueryTypes.SELECT, transaction: trx }
        );
        if (parseInt(cekRows.total) > 0 && parseInt(cekRows.total) === parseInt(cekRows.sudah_dinilai)) {
            await sequelize.query(
                `UPDATE siak_rincian_krs_mahasiswa
                 SET status = 'Dikunci', updated_at = NOW()
                 WHERE siak_kelas_kuliah_id = :kelasId
                   AND (status IS NULL OR status NOT IN ('Dikunci', 'Lulus', 'Tidak Lulus'))
                   AND deleted_at IS NULL`,
                { replacements: { kelasId }, transaction: trx }
            );
        }

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

        // Jalur D (integrasi CBT) -- breakdown per Sub-CPMK per komponen, harus ikut
        // dibersihkan supaya tidak jadi data basi yang mencemari hitungan berikutnya.
        await sequelize.query(`
            DELETE FROM siak_nilai_subcpmk_evaluasi_mahasiswa
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

// Reset beberapa mahasiswa terpilih sekaligus (subset, bukan 1 dan bukan semua kelas).
// rincianKrsIds: array of UUID.
export const resetNilaiBeberapa = async (rincianKrsIds) => {
    if (!Array.isArray(rincianKrsIds) || rincianKrsIds.length === 0) {
        throw new Error('rincianKrsIds wajib array, minimal 1 id');
    }

    const daftarRkm = await RincianKrsMahasiswa.findAll({ where: { id: rincianKrsIds } });
    if (daftarRkm.length === 0) throw new Error('Tidak ada Rincian KRS yang cocok dengan id yang dikirim');

    const krsIds = [...new Set(daftarRkm.map(r => r.siakKrsMahasiswaId || r.siak_krs_mahasiswa_id))];
    const daftarKrs = await KrsMahasiswa.findAll({ where: { id: krsIds } });
    const mhsIdByKrsId = {};
    daftarKrs.forEach(k => { mhsIdByKrsId[k.id] = k.siakMahasiswaId || k.siak_mahasiswa_id; });

    // Pasangan (kelasId, mahasiswaId) unik -- dipakai buat hapus NilaiCpmkMahasiswa per mahasiswa
    const pasanganKelasMhs = [...new Map(daftarRkm.map(r => {
        const kelasId = r.siakKelasKuliahId || r.siak_kelas_kuliah_id;
        const krsId = r.siakKrsMahasiswaId || r.siak_krs_mahasiswa_id;
        const mhsId = mhsIdByKrsId[krsId];
        return [`${kelasId}|${mhsId}`, { kelasId, mhsId }];
    }).filter(([, v]) => v.mhsId)).values()];

    const idsValid = daftarRkm.map(r => r.id);

    let jumlahMhs = 0;
    await sequelize.transaction(async (trx) => {
        await sequelize.query(`
            DELETE FROM siak_nilai_evaluasi_mahasiswa
            WHERE siak_rincian_krs_mahasiswa_id IN (:ids)
        `, { replacements: { ids: idsValid }, transaction: trx });

        await sequelize.query(`
            DELETE FROM siak_nilai_subcpmk_evaluasi_mahasiswa
            WHERE siak_rincian_krs_mahasiswa_id IN (:ids)
        `, { replacements: { ids: idsValid }, transaction: trx });

        for (const { kelasId, mhsId } of pasanganKelasMhs) {
            await sequelize.query(`
                DELETE FROM siak_nilai_cpmk_mahasiswa
                WHERE siak_kelas_kuliah_id = :kelasId
                  AND siak_mahasiswa_id = :mhsId
            `, { replacements: { kelasId, mhsId }, transaction: trx });
        }

        const [res] = await sequelize.query(`
            UPDATE siak_rincian_krs_mahasiswa
            SET nilai_akhir = NULL,
                huruf_mutu  = NULL,
                angka_mutu  = NULL,
                status      = 'Disetujui',
                updated_at  = NOW()
            WHERE id IN (:ids)
              AND deleted_at IS NULL
            RETURNING id
        `, { replacements: { ids: idsValid }, transaction: trx });
        jumlahMhs = res.length;
    });

    return { reset: jumlahMhs, pesan: `${jumlahMhs} mahasiswa terpilih direset ke Belum Dinilai (nilai & CPMK dihapus)` };
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

        // Jalur D (integrasi CBT) -- breakdown per Sub-CPMK per komponen, harus ikut
        // dibersihkan supaya tidak jadi data basi yang mencemari hitungan berikutnya.
        await sequelize.query(`
            DELETE FROM siak_nilai_subcpmk_evaluasi_mahasiswa nsc
            USING siak_rincian_krs_mahasiswa rkm
            WHERE nsc.siak_rincian_krs_mahasiswa_id = rkm.id
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

    const { headerKolom, tabel } = pesertaData;
    const dosenList = (metadata.jadwalKuliah || []).map((dk) => dk.dosen).filter(Boolean);

    return {
        kelas: {
            id: metadata.id,
            nama: metadata.namaKelas || metadata.nama || "-",
            sistemKuliah: metadata.sistemKuliah || "-",
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
            nilaiAngka: row.angkaMutu,
            nilaiHuruf: row.grade,
            keterangan: row.lulus ? "Lulus" : "-",
        })),
        totalMahasiswa: tabel.length,
    };
};
    