// import models from '../models/index.js';
// // 👇 Tambahkan ProgramStudi dan TahunKurikulum di sini 👇
// const { MataKuliah, EkivalensiMataKuliah, ProgramStudi, TahunKurikulum, sequelize } = models;

// // --- 1. GET LIST EKIVALENSI (DENGAN HEADER PRODI & KURIKULUM) ---
// export const getListEkivalensi = async (prodiId, kurikulumBaruId, kurikulumLamaId) => {
    
//     // A. AMBIL DATA HEADER (Prodi & Kurikulum)
//     const prodi = await ProgramStudi.findByPk(prodiId, {
//         attributes: ['kode', 'nama']
//     });

//     const kurikulumBaru = await TahunKurikulum.findByPk(kurikulumBaruId, {
//         attributes: ['tahun'] // Sesuaikan kalau di DB Abang namanya 'nama_kurikulum' atau sejenisnya
//     });

//     // Ambil daftar semua kurikulum untuk dropdown "Dari Tahun Kurikulum"
//     const listKurikulumLama = await TahunKurikulum.findAll({
//         // Asumsi kurikulum terikat ke prodi. Jika tidak, hapus where ini.
//         // where: { siakProgramStudiId: prodiId }, 
//         attributes: ['id', 'tahun'],
//         order: [['tahun', 'DESC']]
//     });

//     // B. AMBIL DATA TABEL (Mata Kuliah Baru)
//     const listMkBaru = await MataKuliah.findAll({
//         where: { siakProgramStudiId: prodiId, siakTahunKurikulumId: kurikulumBaruId },
//         attributes: ['id', 'kode', 'nama', 'totalSks'],
//         order: [['kode', 'ASC']]
//     });

//     const mkBaruIds = listMkBaru.map(mk => mk.id);

//     // C. AMBIL MAPPING EKIVALENSI
//     let existingMappings = [];
//     if (mkBaruIds.length > 0) {
//         existingMappings = await EkivalensiMataKuliah.findAll({
//             where: { siakMataKuliahId: mkBaruIds }
//         });
//     }

//     const dataEkivalensi = listMkBaru.map(mkBaru => {
//         const mapping = existingMappings.find(m => m.siakMataKuliahId === mkBaru.id); 
//         return {
//             mkBaruId: mkBaru.id,
//             mkBaruKode: mkBaru.kode,
//             mkBaruNama: mkBaru.nama,
//             mkBaruSks: mkBaru.totalSks,
//             mkLamaId: mapping ? mapping.siakMataKuliahLamaId : null 
//         };
//     });

//     // 👇 D. GABUNGKAN HEADER DAN TABEL DALAM SATU RESPONSE 👇
//     return {
//         header: {
//             kodeProdi: prodi ? prodi.kode : '-',
//             namaProdi: prodi ? prodi.nama : '-',
//             tahunKurikulumBaru: kurikulumBaru ? kurikulumBaru.tahun : '-',
//             pilihanKurikulumLama: listKurikulumLama // Untuk dirender jadi option Dropdown di UI
//         },
//         tabel: dataEkivalensi
//     };
// };

// export const getDropdownMkLama = async (prodiId, kurikulumLamaId) => {
//     const listMk = await MataKuliah.findAll({
//         where: { siakProgramStudiId: prodiId, siakTahunKurikulumId: kurikulumLamaId },
//         attributes: ['id', 'kode', 'nama', 'totalSks'],
//         order: [['kode', 'ASC']]
//     });
//     return listMk.map(mk => ({ id: mk.id, label: `${mk.kode} - ${mk.nama} (${mk.totalSks} SKS)` }));
// };

// // --- LOGIKA BULK SAVE (POST/PUT) ---
// export const bulkSaveEkivalensi = async (payload) => {
//     const { dataEkivalensi } = payload; // dataEkivalensi adalah array [ {mkBaruId, mkLamaId}, ... ]
//     const transaction = await sequelize.transaction();

//     try {
//         const mkBaruIds = dataEkivalensi.map(item => item.mkBaruId);

//         // 1. Hapus dulu mapping lama untuk MK Baru yang dikirim (WIPE)
//         if (mkBaruIds.length > 0) {
//             await EkivalensiMataKuliah.destroy({
//                 where: { siakMataKuliahId: mkBaruIds },
//                 transaction
//             });
//         }

//         // 2. Filter hanya data yang ada mkLamaId-nya (tidak null)
//         const validMappings = dataEkivalensi.filter(item => item.mkLamaId !== null && item.mkLamaId !== '');
        
//         const dataToInsert = validMappings.map(item => ({
//             siakMataKuliahId: item.mkBaruId, 
//             siakMataKuliahLamaId: item.mkLamaId  
//         }));

//         // 3. Masukkan data baru (REPLACE)
//         if (dataToInsert.length > 0) {
//             await EkivalensiMataKuliah.bulkCreate(dataToInsert, { transaction });
//         }

//         await transaction.commit();
//         return { totalMapping: dataToInsert.length };
//     } catch (error) {
//         await transaction.rollback();
//         throw new Error(`Gagal menyimpan ekivalensi: ${error.message}`);
//     }
// };

// // --- LOGIKA DELETE ---
// export const removeEkivalensi = async (mkBaruId) => {
//     return await EkivalensiMataKuliah.destroy({
//         where: { siakMataKuliahId: mkBaruId }
//     });
// };
import models from '../models/index.js';
import * as CustomError from "../utils/custom-error.js";

const { MataKuliah, EkivalensiMataKuliah, ProgramStudi, TahunKurikulum, sequelize } = models;

export const getListEkivalensi = async (prodiId, kurikulumBaruId, kurikulumLamaId) => {
    const prodi = await ProgramStudi.findByPk(prodiId, { attributes: ['kode', 'nama'] });
    const kurikulumBaru = await TahunKurikulum.findByPk(kurikulumBaruId, { attributes: ['tahun'] });
    if (!prodi || !kurikulumBaru) throw new CustomError.NotFoundError("Prodi atau Kurikulum Baru tidak ditemukan");

    const listKurikulumLama = await TahunKurikulum.findAll({
        attributes: ['id', 'tahun'],
        order: [['tahun', 'DESC']]
    });

    const listMkBaru = await MataKuliah.findAll({
        where: { siakProgramStudiId: prodiId, siakTahunKurikulumId: kurikulumBaruId },
        attributes: ['id', 'kode', 'nama', 'totalSks'],
        order: [['kode', 'ASC']]
    });

    const mkBaruIds = listMkBaru.map(mk => mk.id);
    let existingMappings = [];
    if (mkBaruIds.length > 0) {
        existingMappings = await EkivalensiMataKuliah.findAll({
            where: { siakMataKuliahId: mkBaruIds }
        });
    }

    const dataTabel = listMkBaru.map(mkBaru => {
        const mapping = existingMappings.find(m => m.siakMataKuliahId === mkBaru.id); 
        return {
            mkBaruId: mkBaru.id,
            mkBaruKode: mkBaru.kode,
            mkBaruNama: mkBaru.nama,
            mkBaruSks: mkBaru.totalSks,
            mkLamaId: mapping ? mapping.siakMataKuliahLamaId : null 
        };
    });

    return {
        header: {
            kodeProdi: prodi.kode,
            namaProdi: prodi.nama,
            tahunKurikulumBaru: kurikulumBaru.tahun,
            pilihanKurikulumLama: listKurikulumLama
        },
        tabel: dataTabel
    };
};

export const getDropdownMkLama = async (prodiId, kurikulumLamaId) => {
    const listMk = await MataKuliah.findAll({
        where: { siakProgramStudiId: prodiId, siakTahunKurikulumId: kurikulumLamaId },
        attributes: ['id', 'kode', 'nama', 'totalSks'],
        order: [['kode', 'ASC']]
    });
    return listMk.map(mk => ({ id: mk.id, label: `${mk.kode} - ${mk.nama} (${mk.totalSks} SKS)` }));
};

export const bulkSaveEkivalensi = async (payload) => {
    const { dataEkivalensi } = payload;
    const trx = await sequelize.transaction();

    try {
        const mkBaruIds = dataEkivalensi.map(item => item.mkBaruId);

        // Wipe mapping lama untuk MK Baru yang sedang di-update
        await EkivalensiMataKuliah.destroy({
            where: { siakMataKuliahId: mkBaruIds },
            transaction: trx
        });

        // Insert hanya yang punya mkLamaId (tidak null)
        const validMappings = dataEkivalensi
            .filter(item => item.mkLamaId)
            .map(item => ({
                siakMataKuliahId: item.mkBaruId, 
                siakMataKuliahLamaId: item.mkLamaId  
            }));

        if (validMappings.length > 0) {
            await EkivalensiMataKuliah.bulkCreate(validMappings, { transaction: trx });
        }

        await trx.commit();
        return { totalMapping: validMappings.length };
    } catch (error) {
        await trx.rollback();
        throw new CustomError.InternalServerError("Gagal sinkronisasi Ekivalensi: " + error.message);
    }
};

export const removeEkivalensi = async (mkBaruId) => {
    const deleted = await EkivalensiMataKuliah.destroy({ where: { siakMataKuliahId: mkBaruId } });
    if (!deleted) throw new CustomError.NotFoundError("Data mapping tidak ditemukan");
    return true;
};