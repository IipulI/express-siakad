import models from "../models/index.js";
import * as CustomError from "../utils/custom-error.js";

const { MataKuliah, CapaianMataKuliah, CapaianPembelajaranLulusan, ProgramStudi, TahunKurikulum, Jenjang, PemetaanCplCpmk, Obe, sequelize } = models;

// =========================================================
// GET: Ambil Data untuk Render UI Pemetaan CPMK
// =========================================================
// export const getFormPemetaanCpmk = async (mataKuliahId) => {
//     try {
//         // 1. Ambil data Mata Kuliah beserta Header Dinamis
//         const mk = await MataKuliah.findByPk(mataKuliahId, {
//             attributes: ['id', 'kode', 'nama', 'totalSks', 'jenis', 'levelPemetaan', 'metodePembobotan'],
//             include: [
//                 { 
//                     model: ProgramStudi, 
//                     as: 'programStudi', 
//                     attributes: ['nama']
//                 },
//                 { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] }
//             ]
//         });

//         if (!mk) throw new Error("Mata Kuliah tidak ditemukan");

//         // Format Unit Pengampu
//         let teksUnitPengampu = '-';
//         if (mk.programStudi) {
//             teksUnitPengampu = `S1 - ${mk.programStudi.nama}`; // Fallback cepat
//         }

//         const formattedMk = {
//             id: mk.id,
//             kode: mk.kode,
//             nama: mk.nama,
//             totalSks: mk.totalSks,
//             jenis: mk.jenis || '-',
//             tahunKurikulum: mk.tahunKurikulum ? mk.tahunKurikulum.tahun : '-',
//             unitPengampu: teksUnitPengampu,
//             levelPemetaan: mk.levelPemetaan,
//             metodePembobotan: mk.metodePembobotan
//         };

//         // 2. Ambil CPL Headers
//         const cplTerpilih = await CapaianPembelajaranLulusan.findAll({
//             include: [{
//                 model: MataKuliah, as: 'mataKuliahPemeta',
//                 where: { id: mataKuliahId }, attributes: [], through: { attributes: [] }
//             }],
//             attributes: ['id', 'kode', 'deskripsi'],
//             order: [['kode', 'ASC']]
//         });

//         // 3. Ambil daftar CPMK yang sudah ada berserta nilai bobot CPL-nya
//         const cpmkList = await CapaianMataKuliah.findAll({
//             where: { siakMataKuliahId: mataKuliahId },
//             include: [{
//                 model: CapaianPembelajaranLulusan, as: 'cplDiCPMK',
//                 attributes: ['id'], 
//                 through: { attributes: ['bobotCpl'] } 
//             }],
//             order: [['createdAt', 'ASC']]
//         });

//         // Format data untuk memanjakan Frontend
//         const formattedCpmk = cpmkList.map(cpmk => ({
//             id: cpmk.id,
//             kode: cpmk.kode,
//             deskripsi: cpmk.deskripsi,
//             target: parseFloat(cpmk.target || 0),
//             bobot: parseFloat(cpmk.bobot || 0),
//             // Array berisi Objek ID CPL dan Nilainya
//             cplPemetaan: cpmk.cplDiCPMK.map(c => ({
//                 idCpl: c.id,
//                 bobotCpl: c.PemetaanCplCpmk ? parseFloat(c.PemetaanCplCpmk.bobotCpl || 0) : 0
//             }))
//         }));

//         return {
//             mataKuliah: formattedMk,
//             cplHeaders: cplTerpilih, 
//             cpmkData: formattedCpmk  
//         };
//     } catch (error) {
//         throw new Error(`Gagal memuat form CPMK: ${error.message}`);
//     }
// }
export const getFormPemetaanCpmk = async (mataKuliahId) => {
    const mk = await MataKuliah.findByPk(mataKuliahId, {
        attributes: ['id', 'kode', 'nama', 'totalSks', 'jenis', 'levelPemetaan', 'metodePembobotan'],
        include: [
            { model: ProgramStudi, as: 'programStudi', attributes: ['nama'] },
            { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] }
        ]
    });

    if (!mk) throw new CustomError.NotFoundError("Mata Kuliah tidak ditemukan");

    // 1. Ambil Header CPL
    const cplHeaders = await CapaianPembelajaranLulusan.findAll({
        include: [{ model: MataKuliah, as: 'mataKuliahPemeta', where: { id: mataKuliahId }, attributes: [], through: { attributes: [] } }],
        attributes: ['id', 'kode', 'deskripsi'],
        order: [['kode', 'ASC']]
    });

    // 2. Ambil Semua CPMK (Induk & Anak)
    const rawCpmkList = await CapaianMataKuliah.findAll({
        where: { siakMataKuliahId: mataKuliahId },
        include: [{ model: CapaianPembelajaranLulusan, as: 'cplDiCPMK', attributes: ['id'], through: { attributes: ['bobotCpl'] } }],
        order: [['kode', 'ASC']]
    });

    const items = rawCpmkList.map(c => ({
        id: c.id,
        kode: c.kode,
        deskripsi: c.deskripsi,
        bobot: parseFloat(c.bobot || 0),
        target: parseFloat(c.target || 0),
        parentId: c.parentId, // Pastikan ini sesuai dengan field migrasi Abang (parentId / parent_id)
        cplPemetaan: c.cplDiCPMK.map(cp => ({ idCpl: cp.id, bobotCpl: parseFloat(cp.PemetaanCplCpmk?.bobotCpl || 0) }))
    }));

    // 3. Pisahkan Induk dan masukkan Anaknya (Hirarki)
    const formattedCpmk = items.filter(i => !i.parentId).map(parent => ({
        ...parent,
        subCpmk: items.filter(sub => sub.parentId === parent.id) // Masukkan anaknya ke properti 'subCpmk'
    }));

    return {
        mataKuliah: { ...mk.toJSON(), unitPengampu: `S1 - ${mk.programStudi?.nama || '-'}` },
        cplHeaders,
        cpmkData: formattedCpmk
    };
};

// =========================================================
// POST: Simpan Semua Data (Dengan Validasi Ketat 100% OBE)
// =========================================================
// export const savePemetaanCpmk = async (mataKuliahId, payload) => {
//     try {
//         const { levelPemetaan, metodePembobotan, cpmkList } = payload;

//         // ----------------------------------------------------------------
//         // 🚨 BLOK VALIDASI: Cegah Data Sembarangan Masuk ke Database
//         // ----------------------------------------------------------------
//         if (cpmkList && cpmkList.length > 0) {
//             let totalBobotCpmk = 0;
//             const setKodeCpmk = new Set();

//             for (const item of cpmkList) {
//                 // 1. Validasi Duplikat Kode CPMK (Baris)
//                 if (setKodeCpmk.has(item.kode)) {
//                     throw new Error(`Terdapat duplikasi kode: ${item.kode}. Setiap kode CPMK harus unik!`);
//                 }
//                 setKodeCpmk.add(item.kode);

//                 // Hitung total bobot vertikal (Bobot CPMK terhadap MK)
//                 totalBobotCpmk += parseFloat(item.bobot || 0);

//                 // 2. Validasi Horizontal: Bobot CPL di dalam satu baris CPMK harus 100%
//                 if (item.cplPemetaan && item.cplPemetaan.length > 0) {
//                     let totalBobotBarisIni = 0;
//                     item.cplPemetaan.forEach(cpl => {
//                         totalBobotBarisIni += parseFloat(cpl.bobotCpl || 0);
//                     });

//                     // (Math.round dipakai biar gak kena bug desimal Javascript misal 99.9999)
//                     if (Math.round(totalBobotBarisIni) !== 100) {
//                         throw new Error(`Gagal disimpan! Pada baris ${item.kode}, total distribusi bobot CPL adalah ${totalBobotBarisIni}%. (Harusnya wajib 100%)`);
//                     }
//                 }
//             }

//             // 3. Validasi Vertikal: Total Keseluruhan Bobot CPMK wajib 100%
//             if (Math.round(totalBobotCpmk) !== 100) {
//                 throw new Error(`Gagal disimpan! Total seluruh Bobot CPMK adalah ${totalBobotCpmk}%. (Wajib 100% agar nilai akhir mahasiswa valid)`);
//             }
//         }

//         // ----------------------------------------------------------------
//         // 💾 BLOK DATABASE: Wipe & Replace (Jika lolos semua validasi di atas)
//         // ----------------------------------------------------------------
//         await sequelize.transaction(async (t) => {
//             // 1. Update pengaturan Mata Kuliah
//             await MataKuliah.update({
//                 levelPemetaan: levelPemetaan,
//                 metodePembobotan: metodePembobotan
//             }, { where: { id: mataKuliahId }, transaction: t });

//             // 2. Bersihkan CPMK lama
//             await CapaianMataKuliah.destroy({
//                 where: { siakMataKuliahId: mataKuliahId },
//                 force: true, 
//                 transaction: t
//             });

//             // 3. Insert ulang CPMK Baru
//             if (cpmkList && cpmkList.length > 0) {
//                 for (const item of cpmkList) {
//                     const newCpmk = await CapaianMataKuliah.create({
//                         siakMataKuliahId: mataKuliahId,
//                         kode: item.kode,
//                         deskripsi: item.deskripsi,
//                         target: parseFloat(item.target || 0),
//                         bobot: parseFloat(item.bobot || 0)
//                     }, { transaction: t });

//                     // 4. Insert nilai Bobot CPL secara manual ke tabel pivot
//                     if (item.cplPemetaan && item.cplPemetaan.length > 0) {
//                         const pivotData = item.cplPemetaan.map(p => ({
//                             siakCapaianMataKuliahId: newCpmk.id,
//                             siakCapaianPembelajaranLulusanId: p.idCpl,
//                             bobotCpl: parseFloat(p.bobotCpl || 0)
//                         }));
                        
//                         await PemetaanCplCpmk.bulkCreate(pivotData, { transaction: t });
//                     }
//                 }
//             }
//         });

//         // Kembalikan format segar agar UI ke-refresh
//         return await getFormPemetaanCpmk(mataKuliahId);
//     } catch (error) {
//         // Error message akan berisi teks validasi dari "throw new Error" di atas
//         throw new Error(error.message); 
//     }
// }
export const savePemetaanCpmk = async (mataKuliahId, payload) => {
    const { cpmkList } = payload;
    let totalBobotVertikal = 0;

    // 🚨 1. VALIDASI DOUBLE 100%
    cpmkList.forEach((parent) => {
        totalBobotVertikal += parseFloat(parent.bobot || 0);

        let totalBobotHorizontal = 0;
        if (parent.cplPemetaan && parent.cplPemetaan.length > 0) {
            parent.cplPemetaan.forEach((cpl) => totalBobotHorizontal += parseFloat(cpl.bobotCpl || 0));
            if (Math.round(totalBobotHorizontal) !== 100) {
                throw new CustomError.BadRequestError(`Total bobot pemetaan CPL pada ${parent.kode} adalah ${totalBobotHorizontal}%. Wajib 100%!`);
            }
        }
    });

    if (Math.round(totalBobotVertikal) !== 100) {
        throw new CustomError.BadRequestError(`Total seluruh bobot CPMK adalah ${totalBobotVertikal}%. Wajib pas 100%!`);
    }

    // Ambil siakObeId dari mata kuliah
    const mk = await MataKuliah.findByPk(mataKuliahId, {
        attributes: ['siakProgramStudiId', 'siakTahunKurikulumId']
    });
    const obe = mk ? await Obe.findOne({
        where: { siakProgramStudiId: mk.siakProgramStudiId, siakTahunKurikulumId: mk.siakTahunKurikulumId }
    }) : null;
    const siakObeId = obe?.id || null;

    // 💾 2. EKSEKUSI DATABASE
    // Upsert by kode -- CPMK yang kode-nya tidak berubah dipertahankan id-nya,
    // supaya referensi siak_pemetaan_evaluasi_cpmk.siak_cpmk_id (dari Rencana
    // Evaluasi) tidak jadi yatim setiap kali form pemetaan CPMK ini disimpan ulang.
    return await sequelize.transaction(async (t) => {
        const existingList = await CapaianMataKuliah.findAll({
            where: { siakMataKuliahId: mataKuliahId },
            attributes: ['id', 'kode'],
            transaction: t
        });
        const existingIdByKode = new Map(existingList.map(c => [c.kode, c.id]));
        const usedKode = new Set();

        const upsertCpmk = async (item, parentId) => {
            usedKode.add(item.kode);
            const existingId = existingIdByKode.get(item.kode);

            if (existingId) {
                await CapaianMataKuliah.update({
                    siakObeId,
                    deskripsi: item.deskripsi,
                    bobot: item.bobot || 0,
                    target: item.target || 0,
                    parentId
                }, { where: { id: existingId }, transaction: t });
                return existingId;
            }

            const created = await CapaianMataKuliah.create({
                siakObeId,
                siakMataKuliahId: mataKuliahId,
                kode: item.kode,
                deskripsi: item.deskripsi,
                bobot: item.bobot || 0,
                target: item.target || 0,
                parentId
            }, { transaction: t });
            return created.id;
        };

        for (const parent of cpmkList) {
            const parentCpmkId = await upsertCpmk(parent, null);

            // Pivot ke CPL (hanya di level Induk sesuai UI) -- replace
            await PemetaanCplCpmk.destroy({
                where: { siakCapaianMataKuliahId: parentCpmkId },
                force: true,
                transaction: t
            });
            if (parent.cplPemetaan?.length > 0) {
                const pivotData = parent.cplPemetaan.map((p) => ({
                    siakCapaianMataKuliahId: parentCpmkId,
                    siakCapaianPembelajaranLulusanId: p.idCpl,
                    bobotCpl: p.bobotCpl
                }));
                await PemetaanCplCpmk.bulkCreate(pivotData, { transaction: t });
            }

            // Anak-anaknya (Sub-CPMK) -- upsert juga, bobot/target tetap 0
            if (parent.subCpmk?.length > 0) {
                for (const sub of parent.subCpmk) {
                    await upsertCpmk({ ...sub, bobot: 0, target: 0 }, parentCpmkId);
                }
            }
        }

        // CPMK lama yang kode-nya tidak ada lagi di payload -> baru di sini soft-delete
        const removedIds = existingList
            .filter(c => !usedKode.has(c.kode))
            .map(c => c.id);
        if (removedIds.length > 0) {
            await PemetaanCplCpmk.destroy({
                where: { siakCapaianMataKuliahId: removedIds },
                force: true,
                transaction: t
            });
            await CapaianMataKuliah.destroy({ where: { id: removedIds }, transaction: t });
        }

        return { success: true };
    });
};