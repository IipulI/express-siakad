// import models from "../models/index.js";
// const { MataKuliah } = models

// export const fetchKurikulumProdi = async (programStudiId, tahunKurikulumId) => {
//     try {
//         if (programStudiId === null && tahunKurikulumId === null) {
//             throw new Error(`Program studi dan tahun kurikulum wajib diisi`)
//         }

//         const rows = await MataKuliah.findAll({
//             where: {
//                 siakProgramStudiId: programStudiId,
//                 siakTahunKurikulumId: tahunKurikulumId
//             },
//             order: [
//                 ['semester', 'ASC'],
//                 ['jenis', 'ASC'],
//                 ['nama', 'ASC']
//             ]
//         })

//         return rows
//     }
//     catch (error) {
//         throw new Error(`Terjadi kesalahan saat mengambil data: ${error.message}`)
//     }
// }

// export const addCourseToKurikulumProdi = async (id, courseData) => {
//     try {
//         const existingMataKuliah = MataKuliah.findByPk(id)
//         if (!existingMataKuliah) {
//             throw new Error(`Data MataKuliah tidak ditemukan`)
//         }

//         const [updatedRowsCount] = await MataKuliah.update({
//             nilaiMin: courseData.nilaiMin,
//             semester: courseData.semester,
//             opsiWajib: courseData.opsiWajib,
//         }, {
//             where: {
//                 id: id
//             }
//         })

//         return updatedRowsCount > 0;
//     }
//     catch (error) {
//         throw new Error(`Terjadi kesalahan saat memperbarui data: ${error.message}`)
//     }
// }

// export const deleteCourseFromKurikulumProdi = async (id) => {
//     try {
//         const existingMataKuliah = MataKuliah.findByPk(id)
//         if (!existingMataKuliah) {
//             throw new Error(`Data Mata Kuliah tidak ditemukan`)
//         }

//         const [updatedRowsCount] = await MataKuliah.update({
//             nilaiMin: null,
//             semester: null,
//             opsiWajib: null
//         }, {
//             where: {
//                 id: id
//             }
//         })
//     }
//     catch (error) {
//         throw new Error(`Terjadi kesalahan saat memperbarui data: ${error.message}`)
//     }
// }
import models from '../models/index.js';

// --- GET DAFTAR PRODI ---
export const getDaftarKurikulumProdi = async (tahunKurikulumId, jenjangId) => {
    const { ProgramStudi, Obe, CapaianPembelajaranLulusan, CapaianMataKuliah } = models;

    const listProdi = await ProgramStudi.findAll({
        where: { siak_jenjang_id: jenjangId },
        attributes: ['id', 'kode', 'nama'],
        order: [['kode', 'ASC']]
    });

    const result = await Promise.all(listProdi.map(async (prodi) => {
        const obeData = await Obe.findOne({
            where: {
                siak_program_studi_id: prodi.id,
                siak_tahun_kurikulum_id: tahunKurikulumId
            },
            // DIRUBAH: Gunakan camelCase sesuai definisi di Model agar Sequelize tidak bingung
            attributes: ['id', 'targetCpl', 'targetCpmk'] 
        });

        let jumlahCpl = 0;
        let jumlahCpmk = 0;
        let jenisKurikulum = "Non OBE";
        let targetCpl = 0;
        let targetCpmk = 0;

        if (obeData) {
            jenisKurikulum = "OBE";
            // DIRUBAH: Panggil field pakai camelCase
            targetCpl = obeData.targetCpl || 0;
            targetCpmk = obeData.targetCpmk || 0;
            
            jumlahCpl = await CapaianPembelajaranLulusan.count({
                where: { siak_obe_id: obeData.id }
            });

            jumlahCpmk = await CapaianMataKuliah.count({
                where: { siak_obe_id: obeData.id }
            });
        }

        return {
            programStudiId: prodi.id,
            kodeProdi: prodi.kode,
            namaProdi: prodi.nama,
            jenisKurikulum: jenisKurikulum,
            targetCpl: targetCpl,     
            targetCpmk: targetCpmk,   
            jumlahCpl: jumlahCpl,
            jumlahCpmk: jumlahCpmk
        };
    }));

    return result;
};

// --- SET ATURAN OBE (POST) ---
export const setAturanObeProdi = async (payload) => {
    const { Obe } = models;
    // Ambil data dari payload (Frontend)
    const { programStudiId, tahunKurikulumId, isObe, targetCpl, targetCpmk } = payload;

    const existingObe = await Obe.findOne({
        where: {
            siak_program_studi_id: programStudiId,
            siak_tahun_kurikulum_id: tahunKurikulumId
        }
    });

    const isObeChecked = isObe === true || isObe === "true";

    if (isObeChecked) {
        if (existingObe) {
            // FIX DI SINI: Gunakan targetCpl & targetCpmk (SESUAI MODEL)
            existingObe.targetCpl = targetCpl || 0; 
            existingObe.targetCpmk = targetCpmk || 0; 
            
            // Sequelize akan mendeteksi perubahan ini dan melakukan UPDATE
            await existingObe.save();
        } else {
            // Create baru juga harus pakai nama variabel sesuai Model
            await Obe.create({
                siakProgramStudiId: programStudiId,
                siakTahunKurikulumId: tahunKurikulumId,
                targetCpl: targetCpl || 0,
                targetCpmk: targetCpmk || 0 
            });
        }
        return "Berhasil diatur sebagai kurikulum OBE";
    } else {
        if (existingObe) {
            await existingObe.destroy();
        }
        return "Berhasil diatur sebagai kurikulum Non OBE";
    }
};
// // --- 4. PREDIKAT KELULUSAN (TAB PREDIKAT) ---
// export const fetchPredikatKelulusan = async () => {
//     const { PredikatKelulusan } = models;
//     return await PredikatKelulusan.findAll({
//         order: [['ipk_min', 'DESC']]
//     });
// };

// export const upsertPredikatKelulusan = async (payload) => {
//     const { PredikatKelulusan } = models;
//     if (payload.id) {
//         const data = await PredikatKelulusan.findByPk(payload.id);
//         if (!data) throw new Error("Data Predikat tidak ditemukan");
//         return await data.update(payload);
//     } else {
//         return await PredikatKelulusan.create(payload);
//     }
// };

// export const deletePredikatKelulusan = async (id) => {
//     const { PredikatKelulusan } = models;
//     const data = await PredikatKelulusan.findByPk(id);
//     if (!data) throw new Error("Data Predikat tidak ditemukan");
//     return await data.destroy();
// };