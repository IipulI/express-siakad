import models from "../models/index.js";
import { Op } from 'sequelize';

const {
    sequelize, KomposisiNilaiMataKuliah, PemetaanEvaluasiCpmk, PemetaanKomposisiCpmk,
    NilaiEvaluasiMahasiswa, RincianKrsMahasiswa, KrsMahasiswa, Mahasiswa,
} = models;

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
                        siakCpmkId: cpmkData.siakCapaianMataKuliahId, // Kembali pakai ini seperti kode asli Abang
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
                model: models.CapaianMataKuliah, // Pastikan modelnya dipanggil dari models
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
    try {
        await sequelize.transaction(async (trx) => {
            // Hapus nilai lama agar bersih saat update
            await NilaiEvaluasiMahasiswa.destroy({ where: { siakRincianKrsMahasiswaId: krsId }, transaction: trx });

            const payload = arrNilai.map(item => ({
                siakRincianKrsMahasiswaId: krsId,
                siakKomposisiNilaiId: item.komposisiId,
                skor: item.skor
            }));

            await NilaiEvaluasiMahasiswa.bulkCreate(payload, { transaction: trx });
        });
        return true;
    } catch (error) {
        throw new Error("Gagal menyimpan nilai evaluasi: " + error.message);
    }
}

// 3. KALKULATOR HASIL AKHIR OBE
// export const hitungNilaiAkhir = async (krsId) => {
//     try {
//         return await sequelize.transaction(async (trx) => {
//             const listNilai = await NilaiEvaluasiMahasiswa.findAll({
//                 where: { siakRincianKrsMahasiswaId: krsId },
//                 include: [{ model: KomposisiNilaiMataKuliah, as: 'komposisiNilai' }],
//                 transaction: trx
//             });

//             let totalSkor = 0;
//             listNilai.forEach(item => {
//                 if (item.komposisiNilai) {
//                     const skor = parseFloat(item.skor);
//                     const bobot = parseFloat(item.komposisiNilai.persentase) / 100;
//                     totalSkor += (skor * bobot);
//                 }
//             });

//             // Konversi rentang Huruf Mutu (Sesuai dengan tabel siak_skala_penilaian)
//             let hurufMutu = 'E';
//             let angkaMutu = 0.0;

//             if (totalSkor >= 81.00) {
//                 hurufMutu = 'A'; angkaMutu = 4.0;
//             } else if (totalSkor >= 76.00) {
//                 hurufMutu = 'AB'; angkaMutu = 3.5;
//             } else if (totalSkor >= 71.00) {
//                 hurufMutu = 'B'; angkaMutu = 3.0;
//             } else if (totalSkor >= 66.00) {
//                 hurufMutu = 'BC'; angkaMutu = 2.5;
//             } else if (totalSkor >= 61.00) {
//                 hurufMutu = 'C'; angkaMutu = 2.0;
//             } else if (totalSkor >= 41.00) {
//                 hurufMutu = 'CD'; angkaMutu = 1.5;
//             } else if (totalSkor >= 1.00) {
//                 hurufMutu = 'D'; angkaMutu = 1.0;
//             } else {
//                 hurufMutu = 'E'; angkaMutu = 0.0;
//             }
//             await RincianKrsMahasiswa.update(
//                 { nilaiAkhir: totalSkor, hurufMutu: hurufMutu, angkaMutu: angkaMutu },
//                 { where: { id: krsId }, transaction: trx }
//             );

//             // =========================================================
//             // SIMPAN KE TABEL MATERIALIZED (NILAI CPMK) UNTUK DASHBOARD MONITORING
//             // =========================================================
//             const rincianKrs = await RincianKrsMahasiswa.findByPk(krsId, {
//                 include: [{ model: KrsMahasiswa, as: 'krsMahasiswa' }],
//                 transaction: trx
//             });

//             if (rincianKrs && rincianKrs.krsMahasiswa) {
//                 const { siakKelasKuliahId } = rincianKrs;
//                 const { siakMahasiswaId } = rincianKrs.krsMahasiswa;

//                 // Dapatkan rapor dinamis menggunakan getRaporOBEMahasiswa()
//                 // Tapi karena getRaporOBEMahasiswa tidak pakai trx, kita lakukan hitungan ulang khusus di sini
//                 // Atau cukup bersihkan data lama dulu
//                 const { NilaiCpmkMahasiswa, CapaianMataKuliah } = models;
//                 if (NilaiCpmkMahasiswa) {
//                     await NilaiCpmkMahasiswa.destroy({
//                         where: { siakKelasKuliahId, siakMahasiswaId },
//                         transaction: trx
//                     });

//                     // Tarik ulang listNilai yang lebih lengkap (dengan CPMK)
//                     const listNilaiLengkap = await NilaiEvaluasiMahasiswa.findAll({
//                         where: { siakRincianKrsMahasiswaId: krsId },
//                         include: [{
//                             model: KomposisiNilaiMataKuliah,
//                             as: 'komposisiNilai',
//                             include: [{
//                                 model: CapaianMataKuliah,
//                                 as: 'cpmkList'
//                             }]
//                         }],
//                         transaction: trx
//                     });

//                     let raporCPMK = {};
//                     listNilaiLengkap.forEach(nilai => {
//                         if (nilai.komposisiNilai && nilai.komposisiNilai.cpmkList) {
//                             const skorAsli = parseFloat(nilai.skor);
//                             const bobotPersentase = parseFloat(nilai.komposisiNilai.persentase) / 100;
//                             const skorTerbobot = skorAsli * bobotPersentase;

//                             nilai.komposisiNilai.cpmkList.forEach(cpmk => {
//                                 const idCpmk = cpmk.id;
//                                 if (!raporCPMK[idCpmk]) {
//                                     raporCPMK[idCpmk] = { totalSkorTerbobot: 0, totalBobotMaksimal: 0 };
//                                 }
//                                 raporCPMK[idCpmk].totalSkorTerbobot += skorTerbobot;
//                                 raporCPMK[idCpmk].totalBobotMaksimal += (100 * bobotPersentase);
//                             });
//                         }
//                     });

//                     // Format ke payload bulkCreate
//                     const payloadCpmk = Object.keys(raporCPMK).map(idCpmk => {
//                         const item = raporCPMK[idCpmk];
//                         const persentaseAkhir = item.totalBobotMaksimal > 0 ? (item.totalSkorTerbobot / item.totalBobotMaksimal) * 100 : 0;

//                         return {
//                             siakKelasKuliahId,
//                             siakMahasiswaId,
//                             siakCapaianMataKuliahId: idCpmk,
//                             nilai: parseFloat(persentaseAkhir.toFixed(2))
//                         };
//                     });

//                     if (payloadCpmk.length > 0) {
//                         await NilaiCpmkMahasiswa.bulkCreate(payloadCpmk, { transaction: trx });
//                     }
//                 }
//             }

//             return { krsId, totalSkor, hurufMutu, angkaMutu };
//         });
//     } catch (error) {
//         throw new Error("Gagal kalkulasi nilai: " + error.message);
//     }
// }
// 3. KALKULATOR HASIL AKHIR OBE
// 3. KALKULATOR HASIL AKHIR OBE
// export const hitungNilaiAkhir = async (krsId) => {
//     try {
//         return await sequelize.transaction(async (trx) => {
//             const listNilai = await NilaiEvaluasiMahasiswa.findAll({
//                 where: { siakRincianKrsMahasiswaId: krsId },
//                 include: [{ model: KomposisiNilaiMataKuliah, as: 'komposisiNilai' }],
//                 transaction: trx
//             });

//             let totalSkor = 0;
//             listNilai.forEach(item => {
//                 if (item.komposisiNilai) {
//                     const skor = parseFloat(item.skor);
//                     const bobot = parseFloat(item.komposisiNilai.persentase) / 100;
//                     totalSkor += (skor * bobot);
//                 }
//             });

//             // Bulatkan maksimal 2 angka desimal
//             totalSkor = Math.round(totalSkor * 100) / 100;

//             // Konversi Huruf Mutu
//             let hurufMutu = 'E'; let angkaMutu = 0.0;
//             if (totalSkor >= 81.00) { hurufMutu = 'A'; angkaMutu = 4.0; }
//             else if (totalSkor >= 76.00) { hurufMutu = 'AB'; angkaMutu = 3.5; }
//             else if (totalSkor >= 71.00) { hurufMutu = 'B'; angkaMutu = 3.0; }
//             else if (totalSkor >= 66.00) { hurufMutu = 'BC'; angkaMutu = 2.5; }
//             else if (totalSkor >= 61.00) { hurufMutu = 'C'; angkaMutu = 2.0; }
//             else if (totalSkor >= 41.00) { hurufMutu = 'CD'; angkaMutu = 1.5; }
//             else if (totalSkor >= 1.00) { hurufMutu = 'D'; angkaMutu = 1.0; }

//             // 🟢 AMAN DARI SNAKE_CASE: Tembak 2 format sekaligus
//             try {
//                 await RincianKrsMahasiswa.update(
//                     {
//                         nilaiAkhir: totalSkor, hurufMutu: hurufMutu, angkaMutu: angkaMutu,
//                         nilai_akhir: totalSkor, huruf_mutu: hurufMutu, angka_mutu: angkaMutu
//                     },
//                     { where: { id: krsId }, transaction: trx }
//                 );
//             } catch (e) { } // Abaikan jika ada kolom yang tidak cocok

//             // =========================================================
//             // SIMPAN KE TABEL MATERIALIZED (NILAI CPMK)
//             // =========================================================
//             const rincianKrs = await RincianKrsMahasiswa.findByPk(krsId, {
//                 include: [{ model: KrsMahasiswa, as: 'krsMahasiswa' }],
//                 transaction: trx
//             });

//             if (rincianKrs && rincianKrs.krsMahasiswa) {
//                 // 🟢 AMAN DARI UNDEFINED: Ambil properti dari camelCase ATAU snake_case
//                 const kelasId = rincianKrs.siakKelasKuliahId || rincianKrs.siak_kelas_kuliah_id;
//                 const mhsId = rincianKrs.krsMahasiswa.siakMahasiswaId || rincianKrs.krsMahasiswa.siak_mahasiswa_id;

//                 const { NilaiCpmkMahasiswa, CapaianMataKuliah } = models;
//                 if (NilaiCpmkMahasiswa && kelasId && mhsId) {

//                     // Bersihkan nilai lama pakai Raw Query untuk hindari konflik nama tabel
//                     await sequelize.query(
//                         `DELETE FROM siak_nilai_cpmk_mahasiswa WHERE siak_kelas_kuliah_id = :kelasId AND siak_mahasiswa_id = :mhsId`,
//                         { replacements: { kelasId, mhsId }, transaction: trx }
//                     ).catch(() => { });

//                     const listNilaiLengkap = await NilaiEvaluasiMahasiswa.findAll({
//                         where: { siakRincianKrsMahasiswaId: krsId },
//                         include: [{
//                             model: KomposisiNilaiMataKuliah,
//                             as: 'komposisiNilai',
//                             include: [{
//                                 model: CapaianMataKuliah,
//                                 as: 'cpmkList'
//                             }]
//                         }],
//                         transaction: trx
//                     });

//                     let raporCPMK = {};
//                     listNilaiLengkap.forEach(nilai => {
//                         if (nilai.komposisiNilai && nilai.komposisiNilai.cpmkList) {
//                             const skorAsli = parseFloat(nilai.skor);
//                             const bobotPersentase = parseFloat(nilai.komposisiNilai.persentase) / 100;
//                             const skorTerbobot = skorAsli * bobotPersentase;

//                             nilai.komposisiNilai.cpmkList.forEach(cpmk => {
//                                 const idCpmk = cpmk.id;
//                                 if (!raporCPMK[idCpmk]) {
//                                     raporCPMK[idCpmk] = { totalSkorTerbobot: 0, totalBobotMaksimal: 0 };
//                                 }
//                                 raporCPMK[idCpmk].totalSkorTerbobot += skorTerbobot;
//                                 raporCPMK[idCpmk].totalBobotMaksimal += (100 * bobotPersentase);
//                             });
//                         }
//                     });

//                     // Format ke payload bulkCreate
//                     const payloadCpmk = Object.keys(raporCPMK).map(idCpmk => {
//                         const item = raporCPMK[idCpmk];
//                         let persentaseAkhir = item.totalBobotMaksimal > 0 ? (item.totalSkorTerbobot / item.totalBobotMaksimal) * 100 : 0;
//                         persentaseAkhir = Math.round(persentaseAkhir * 100) / 100;

//                         // 🟢 FIX FATAL: Lempar kedua nama variabel agar terhindar dari Validation Not Null
//                         return {
//                             siakKelasKuliahId: kelasId,
//                             siak_kelas_kuliah_id: kelasId,
//                             siakMahasiswaId: mhsId,
//                             siak_mahasiswa_id: mhsId,
//                             siakCapaianMataKuliahId: idCpmk,
//                             siak_capaian_mata_kuliah_id: idCpmk,
//                             nilai: persentaseAkhir
//                         };
//                     });

//                     if (payloadCpmk.length > 0) {
//                         await NilaiCpmkMahasiswa.bulkCreate(payloadCpmk, { transaction: trx });
//                     }
//                 }
//             }

//             return { krsId, totalSkor, hurufMutu, angkaMutu };
//         });
//     } catch (error) {
//         throw new Error("Gagal kalkulasi nilai: " + error.message);
//     }
// }

// 3. KALKULATOR HASIL AKHIR OBE (VERSI DINAMIS SKALA NILAI)
// 3. KALKULATOR HASIL AKHIR OBE (VERSI DINAMIS SKALA NILAI)

export const hitungNilaiAkhir = async (krsId) => {
    try {
        const { sequelize } = models; // Pastikan models ter-import
        return await sequelize.transaction(async (trx) => {
            // 1. Hitung Total Skor Mahasiswa
            const listNilai = await models.NilaiEvaluasiMahasiswa.findAll({
                where: { siakRincianKrsMahasiswaId: krsId },
                include: [{ model: models.KomposisiNilaiMataKuliah, as: 'komposisiNilai' }],
                transaction: trx
            });

            let totalSkor = 0;
            listNilai.forEach(item => {
                if (item.komposisiNilai) {
                    const skor = parseFloat(item.skor);
                    const bobot = parseFloat(item.komposisiNilai.persentase) / 100;
                    totalSkor += (skor * bobot);
                }
            });

            totalSkor = Math.round(totalSkor * 100) / 100; // Bulatkan 2 desimal

            // ====================================================================
            // 2. LACAK PRODI & KURIKULUM LALU TARIK SKALA NILAI DINAMIS
            // ====================================================================
            let hurufMutu = 'E';
            let angkaMutu = 0.0;

            const queryTrace = `
                SELECT mk.siak_program_studi_id AS prodi_id, mk.siak_tahun_kurikulum_id AS kurikulum_id
                FROM siak_rincian_krs_mahasiswa rkm
                LEFT JOIN siak_kelas_kuliah kk ON rkm.siak_kelas_kuliah_id = kk.id
                LEFT JOIN siak_mata_kuliah mk ON kk.siak_mata_kuliah_id = mk.id
                WHERE rkm.id = :krsId LIMIT 1
            `;
            const traceResult = await sequelize.query(queryTrace, { replacements: { krsId }, type: sequelize.QueryTypes.SELECT, transaction: trx });

            if (traceResult && traceResult.length > 0) {
                const { prodi_id, kurikulum_id } = traceResult[0];

                // 🟢 FIX FATAL: Perbaikan nama tabel dan kolom sesuai dengan model SkalaPenilaian
                const querySkala = `
                    SELECT huruf_mutu AS grade, angka_mutu AS bobot, nilai_min
                    FROM siak_skala_penilaian
                    WHERE siak_program_studi_id = :prodi_id 
                      AND siak_tahun_kurikulum_id = :kurikulum_id
                      AND deleted_at IS NULL
                    ORDER BY nilai_min DESC
                `;
                const skalaList = await sequelize.query(querySkala, { replacements: { prodi_id, kurikulum_id }, type: sequelize.QueryTypes.SELECT, transaction: trx });
                console.log("🔥 CEK SKALA DARI DB:", skalaList.length > 0 ? "SUKSES KETARIK!" : "KOSONG/GAGAL");
                console.log("🔥 DATA SKALA:", skalaList);
                // Loop untuk mencocokkan nilai
                if (skalaList.length > 0) {
                    for (const skala of skalaList) {
                        if (totalSkor >= parseFloat(skala.nilai_min)) {
                            hurufMutu = String(skala.grade).trim();
                            angkaMutu = parseFloat(skala.bobot);
                            break;
                        }
                    }
                } else {
                    // Fallback jika ternyata tabel skala nilai kosong untuk prodi tersebut
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
            // 3. UPDATE KRS MAHASISWA
            // ====================================================================
            try {
                await models.RincianKrsMahasiswa.update(
                    { nilaiAkhir: totalSkor, hurufMutu: hurufMutu, angkaMutu: angkaMutu, nilai_akhir: totalSkor, huruf_mutu: hurufMutu, angka_mutu: angkaMutu },
                    { where: { id: krsId }, transaction: trx }
                );
            } catch (e) { }

            // ====================================================================
            // 4. SIMPAN KE TABEL MATERIALIZED (NILAI CPMK)
            // ====================================================================
            const rincianKrs = await models.RincianKrsMahasiswa.findByPk(krsId, { include: [{ model: models.KrsMahasiswa, as: 'krsMahasiswa' }], transaction: trx });

            if (rincianKrs && rincianKrs.krsMahasiswa) {
                const kelasId = rincianKrs.siakKelasKuliahId || rincianKrs.siak_kelas_kuliah_id;
                const mhsId = rincianKrs.krsMahasiswa.siakMahasiswaId || rincianKrs.krsMahasiswa.siak_mahasiswa_id;

                if (models.NilaiCpmkMahasiswa && kelasId && mhsId) {
                    await sequelize.query(
                        `DELETE FROM siak_nilai_cpmk_mahasiswa WHERE siak_kelas_kuliah_id = :kelasId AND siak_mahasiswa_id = :mhsId`,
                        { replacements: { kelasId, mhsId }, transaction: trx }
                    ).catch(() => { });

                    let raporCPMK = {};
                    listNilai.forEach(nilai => {
                        if (nilai.komposisiNilai && nilai.komposisiNilai.cpmkList) {
                            const skorAsli = parseFloat(nilai.skor);
                            const bobotPersentase = parseFloat(nilai.komposisiNilai.persentase) / 100;
                            const skorTerbobot = skorAsli * bobotPersentase;

                            nilai.komposisiNilai.cpmkList.forEach(cpmk => {
                                const idCpmk = cpmk.id;
                                if (!raporCPMK[idCpmk]) raporCPMK[idCpmk] = { totalSkorTerbobot: 0, totalBobotMaksimal: 0 };
                                raporCPMK[idCpmk].totalSkorTerbobot += skorTerbobot;
                                raporCPMK[idCpmk].totalBobotMaksimal += (100 * bobotPersentase);
                            });
                        }
                    });

                    const payloadCpmk = Object.keys(raporCPMK).map(idCpmk => {
                        const item = raporCPMK[idCpmk];
                        let persentaseAkhir = item.totalBobotMaksimal > 0 ? (item.totalSkorTerbobot / item.totalBobotMaksimal) * 100 : 0;
                        persentaseAkhir = Math.round(persentaseAkhir * 100) / 100;

                        return {
                            siakKelasKuliahId: kelasId, siak_kelas_kuliah_id: kelasId,
                            siakMahasiswaId: mhsId, siak_mahasiswa_id: mhsId,
                            siakCapaianMataKuliahId: idCpmk, siak_capaian_mata_kuliah_id: idCpmk,
                            nilai: persentaseAkhir
                        };
                    });

                    if (payloadCpmk.length > 0) {
                        await models.NilaiCpmkMahasiswa.bulkCreate(payloadCpmk, { transaction: trx });
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
// Di dalam file services/penilaian.service.js

// =====================================================================
// GENERATOR RAPOR OBE MAHASISWA
// =====================================================================
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
// Pastikan model master sudah di-import di bagian atas file
const {
    MasterMetodeEvaluasi,
    MasterKomponenEvaluasi
} = models;

// ... (kode service yang lain)

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
    // 1. Ambil model secara dinamis dari objek models
    // Jika di console.log tadi namanya 'siak_mata_kuliah', ganti baris ini
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
// =====================================================================
// GET PESERTA KELAS (Untuk Dosen Input Nilai)
// =====================================================================
// =====================================================================
// GET PESERTA KELAS (Untuk Dosen Input Nilai)
// =====================================================================
export const getPesertaKelasList = async (kelasId) => {
    try {
        const peserta = await RincianKrsMahasiswa.findAll({
            where: { siak_kelas_kuliah_id: kelasId },
            attributes: ['id', 'nilai_akhir', 'huruf_mutu', 'angka_mutu'],
            include: [
                {
                    model: KrsMahasiswa,
                    as: 'krsMahasiswa', // Sudah benar dari langkah sebelumnya
                    attributes: ['id', 'semester'],
                    include: [
                        {
                            model: Mahasiswa,
                            as: 'mahasiswa',
                            attributes: ['id', 'nama', 'npm', 'angkatan']
                        }
                    ]
                },
                {
                    model: NilaiEvaluasiMahasiswa,
                    as: 'daftarNilaiEvaluasi', // <--- UBAH ALIAS KEDUA DI SINI
                    attributes: ['id', 'siak_komposisi_nilai_id', 'skor'],
                    required: false
                }
            ]
        });

        const formattedData = peserta.map(item => ({
            rincianKrsId: item.id,
            mahasiswaId: item.krsMahasiswa?.mahasiswa?.id,
            npm: item.krsMahasiswa?.mahasiswa?.npm,
            nama: item.krsMahasiswa?.mahasiswa?.nama,
            angkatan: item.krsMahasiswa?.mahasiswa?.angkatan,
            nilaiAkhir: item.nilai_akhir || 0,
            hurufMutu: item.huruf_mutu || '-',
            angkaMutu: item.angka_mutu || 0,
            detailNilai: item.daftarNilaiEvaluasi || [] // <--- UBAH JUGA DI SINI
        }));

        formattedData.sort((a, b) => (a.npm || '').localeCompare(b.npm || ''));

        return formattedData;
    } catch (error) {
        throw new Error("Gagal mengambil daftar peserta kelas: " + error.message);
    }
}