import models from "../models/index.js";
import { Op } from 'sequelize';

const {
    sequelize, PemetaanEvaluasiCpmk,
    NilaiEvaluasiMahasiswa, RincianKrsMahasiswa, KrsMahasiswa, Mahasiswa, KelasKuliah, MataKuliah, SkalaPenilaian,
    MasterMetodeEvaluasi, MasterKomponenEvaluasi,
    ProgramStudi, PeriodeAkademik, Dosen, DosenKelas, JadwalKuliah, Jenjang,
    NilaiCpmkMahasiswa, CapaianMataKuliah, RencanaEvaluasi, NilaiSubcpmkEvaluasiMahasiswa
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
    // GUARD Jalur D: kalau krsId ini sudah punya breakdown dari integrasi CBT
    // (siak_nilai_subcpmk_evaluasi_mahasiswa), nilai_akhir/huruf_mutu MK itu MURNI
    // otoritas CBT (simpanNilaiAkhirDariCbt) -- JANGAN dihitung ulang di sini. Tapi
    // komponen yang TETAP diinput manual di NL-SIAK (arahan Pak Fitrah: Kehadiran
    // tidak bisa lewat CBT, harus manual, dikali bobot per Sub-CPMK dibagi total
    // bobot Sub-CPMK -- rumus proporsional lama) TETAP harus ikut kehitung ke CPMK,
    // digabung dengan breakdown CBT lewat rumus penjumlahan yang sama (lihat
    // gabungKontribusiManualKeJalurD & hitungDanOverrideNilaiCpmkDariKomponen).
    // Tanpa guard ini, endpoint lama akan menghitung nilai_akhir dari komponen yang
    // tidak lengkap DAN menghapus semua NilaiCpmkMahasiswa Jalur D tanpa pengganti.
    const jalurD = await sequelize.query(
        `SELECT 1 FROM siak_nilai_subcpmk_evaluasi_mahasiswa
         WHERE siak_rincian_krs_mahasiswa_id = :krsId AND deleted_at IS NULL LIMIT 1`,
        { replacements: { krsId }, type: sequelize.QueryTypes.SELECT }
    );
    if (jalurD.length > 0) {
        return await gabungKontribusiManualKeJalurD(krsId);
    }

    try {
        return await sequelize.transaction(async (trx) => {
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

                    const rencanaEvaluasiIds = listNilai
                        .map(n => n.siak_rencana_evaluasi_id || n.siakRencanaEvaluasiId)
                        .filter(Boolean);

                    if (rencanaEvaluasiIds.length > 0) {
                        const pemetaanRows = await sequelize.query(
                            `SELECT pec.siak_rencana_evaluasi_id AS rencana_evaluasi_id,
                                    pec.siak_cpmk_id             AS cpmk_id,
                                    pec.bobot_cpmk               AS bobot_cpmk
                             FROM siak_pemetaan_evaluasi_cpmk pec
                             WHERE pec.siak_rencana_evaluasi_id IN (:rencanaEvaluasiIds)
                               AND pec.deleted_at IS NULL`,
                            {
                                replacements: { rencanaEvaluasiIds },
                                type: sequelize.QueryTypes.SELECT,
                                transaction: trx
                            }
                        );

                        // Build map rencanaEvaluasiId -> [{ cpmkId, bobotCpmk }]
                        const pemetaanMap = {};
                        pemetaanRows.forEach(row => {
                            if (!pemetaanMap[row.rencana_evaluasi_id]) pemetaanMap[row.rencana_evaluasi_id] = [];
                            pemetaanMap[row.rencana_evaluasi_id].push({
                                cpmkId: row.cpmk_id,
                                bobotCpmk: parseFloat(row.bobot_cpmk || 0)
                            });
                        });

                        const raporCPMK = {}; // { cpmkId: { skorTerbobot, totalBobot } }

                        listNilai.forEach(nilai => {
                            if (!nilai.rencanaEvaluasi) return;

                            const rencanaEvaluasiId = nilai.siak_rencana_evaluasi_id || nilai.siakRencanaEvaluasiId;
                            const skor = parseFloat(nilai.skor || 0);

                            (pemetaanMap[rencanaEvaluasiId] || []).forEach(({ cpmkId, bobotCpmk }) => {
                                if (!raporCPMK[cpmkId]) raporCPMK[cpmkId] = { skorTerbobot: 0, totalBobot: 0 };
                                raporCPMK[cpmkId].skorTerbobot += skor * bobotCpmk;
                                raporCPMK[cpmkId].totalBobot += bobotCpmk;
                            });
                        });

                        const payloadCpmk = Object.entries(raporCPMK).map(([cpmkId, item]) => ({
                            siakKelasKuliahId: kelasId,
                            siakMahasiswaId: mhsId,
                            siakCapaianMataKuliahId: cpmkId,
                            nilai: item.totalBobot > 0
                                ? Math.round((item.skorTerbobot / item.totalBobot) * 100) / 100
                                : 0
                        }));

                        if (payloadCpmk.length > 0) {
                            await models.NilaiCpmkMahasiswa.bulkCreate(payloadCpmk, { transaction: trx });
                        }
                    }

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

            return { krsId, totalSkor, hurufMutu, angkaMutu };
        });
    } catch (error) {
        throw new Error("Gagal kalkulasi nilai: " + error.message);
    }
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
// Dipanggil oleh hitungNilaiAkhir kalau krsId sudah pakai Jalur D. Komponen yang
// TETAP diinput manual di NL-SIAK (arahan Pak Fitrah 2026-07-16: "Kehadiran gak
// bisa dari sistem Virza, harus di tempat lu langsung. Ambil nilai akhir kehadiran,
// dikali bobot per Sub-CPMK dibagi total Sub-CPMK") ditulis sebagai UNIT tambahan
// ke siak_nilai_subcpmk_evaluasi_mahasiswa (sumber='MANUAL', bukan 'CBT'), lalu
// di-rollup ULANG bareng breakdown CBT lewat hitungDanOverrideNilaiCpmkDariKomponen
// -- rumusnya identik (skor x bobotCpmk / totalBobot), cuma sumber datanya beda.
// nilai_akhir/huruf_mutu MK TIDAK disentuh sama sekali (tetap murni dari CBT).
// ============================================================================
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
        // Hapus dulu kontribusi manual LAMA (supaya re-input Kehadiran tidak numpuk),
        // tapi JANGAN sentuh baris sumber='CBT' milik Jalur D.
        await NilaiSubcpmkEvaluasiMahasiswa.destroy({
            where: { siakRincianKrsMahasiswaId: krsId, sumber: 'MANUAL' },
            force: true, transaction: trx
        });

        if (listNilai.length === 0) return;

        const rencanaEvaluasiIds = listNilai.map(n => n.siakRencanaEvaluasiId);
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

        // PENTING soal skala: hitungDanOverrideNilaiCpmkDariKomponen mengasumsikan setiap
        // baris di siak_nilai_subcpmk_evaluasi_mahasiswa sudah dalam konvensi Jalur D
        // (skorTerbobot/totalBobot adalah PECAHAN 0..1, lalu di-kali 100 di akhir -- lihat
        // Rumus 1: w = S x (B/M)). Skor manual (mis. Kehadiran) itu sendiri sudah dalam
        // skala 0-100 (S/M dengan M=100), jadi bobotCpmk-nya HARUS dibagi 100 dulu supaya
        // hasil gabungannya konsisten -- kalau tidak, hasil akhir bisa jauh di atas 100
        // (bobotCpmk lama itu skala "persen dari 100 total", bukan skala "poin" spt Jalur D).
        const payloadManual = [];
        listNilai.forEach(nilai => {
            const skor = parseFloat(nilai.skor || 0);
            (pemetaanMap[nilai.siakRencanaEvaluasiId] || []).forEach(({ cpmkId, bobotCpmk }) => {
                payloadManual.push({
                    siakRincianKrsMahasiswaId: krsId,
                    siakRencanaEvaluasiId: nilai.siakRencanaEvaluasiId,
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
    });

    // Rollup ulang CPMK dari SEMUA sumber (CBT + MANUAL) utk krsId ini.
    await hitungDanOverrideNilaiCpmkDariKomponen(krsId, kelasId, mahasiswaId);

    const existing = await models.RincianKrsMahasiswa.findByPk(krsId);
    return {
        krsId,
        totalSkor: existing ? parseFloat(existing.nilaiAkhir || 0) : 0,
        hurufMutu: existing?.hurufMutu ?? null,
        angkaMutu: existing ? parseFloat(existing.angkaMutu || 0) : 0
    };
};

// 4. GENERATOR RAPOR OBE MAHASISWA
export const getRaporOBEMahasiswa = async (rincianKrsId) => {
    try {
        const listNilai = await models.NilaiEvaluasiMahasiswa.findAll({
            where: { siakRincianKrsMahasiswaId: rincianKrsId },
            include: [{
                model: models.RencanaEvaluasi,
                as: 'rencanaEvaluasi',
                include: [{
                    model: models.CapaianMataKuliah,
                    as: 'cpmkList',
                    attributes: ['id', 'kode', 'deskripsi'],
                    through: { attributes: ['bobotCpmk'] }
                }]
            }]
        });

        let raporCPMK = {};

        listNilai.forEach(nilai => {
            if (!nilai.rencanaEvaluasi?.cpmkList) return;
            const skorAsli = parseFloat(nilai.skor);

            nilai.rencanaEvaluasi.cpmkList.forEach(cpmk => {
                const kodeCpmk = cpmk.kode || cpmk.id;
                if (!kodeCpmk) return;

                const bobotCpmk = parseFloat(cpmk.PemetaanEvaluasiCpmk?.bobotCpmk || 0);

                if (!raporCPMK[kodeCpmk]) {
                    raporCPMK[kodeCpmk] = {
                        kode: kodeCpmk,
                        deskripsi: cpmk.deskripsi || '-',
                        totalSkorTerbobot: 0,
                        totalBobot: 0
                    };
                }
                raporCPMK[kodeCpmk].totalSkorTerbobot += skorAsli * bobotCpmk;
                raporCPMK[kodeCpmk].totalBobot += bobotCpmk;
            });
        });

        return Object.values(raporCPMK).map(item => ({
            kodeCpmk: item.kode,
            deskripsi: item.deskripsi,
            nilaiCapaian: item.totalBobot > 0
                ? parseFloat((item.totalSkorTerbobot / item.totalBobot).toFixed(2))
                : 0
        }));

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

            // Komponen belum diinput -> null (tampil kosong)
            komposisiList.forEach(k => {
                const label = (k.metodeEvaluasi || '-').toUpperCase();
                if (!(label in nilaiPerKomponen)) nilaiPerKomponen[label] = null;
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
// FINALISASI NILAI KELAS (Permanent Lock setelah masa sanggah habis)
// Koordinator MK mengeksekusi ini setelah masa sanggah berakhir.
// Status berubah dari 'Dikunci' → 'Lulus' / 'Tidak Lulus' (permanen)
// ====================================================================
const GRADE_LULUS = ['A', 'AB', 'B', 'BC', 'C', 'CD'];

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

    const { tabel } = pesertaData;
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
    