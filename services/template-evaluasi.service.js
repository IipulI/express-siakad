// import models from "../models/index.js";
// import { Op } from "sequelize"; 

// const { TemplateEvaluasi, TahunKurikulum, ProgramStudi, Jenjang, sequelize } = models;

// // ========================================================================
// // 1. GET ALL (Dengan Full Filtering & Pencarian)
// // ========================================================================
// export const getListTemplate = async (filters = {}) => {
//     try {
//         const { kurikulumId, prodiId, jenisMk, search } = filters;
//         const whereClause = {};
//         const prodiWhereClause = {}; 

//         // Apply Dropdown Filter
//         if (kurikulumId) whereClause.siakTahunKurikulumId = kurikulumId;
//         if (prodiId) whereClause.siakProgramStudiId = prodiId;
//         if (jenisMk) whereClause.jenisMataKuliah = jenisMk;

//         // Apply Search Bar Filter (Cari di Nama Prodi atau Kode Prodi)
//         if (search) {
//             prodiWhereClause[Op.or] = [
//                 { nama: { [Op.iLike]: `%${search}%` } },
//                 { kode: { [Op.iLike]: `%${search}%` } }
//             ];
//         }

//         const listData = await TemplateEvaluasi.findAll({
//             where: whereClause,
//             attributes: [
//                 'siakTahunKurikulumId',
//                 'siakProgramStudiId',
//                 'jenisMataKuliah'
//             ],
//             include: [
//                 { 
//                     model: TahunKurikulum, 
//                     as: 'tahunKurikulum', 
//                     attributes: ['id', 'tahun'] 
//                 },
//                 { 
//                     model: ProgramStudi,  
//                     as: 'programStudi', 
//                     attributes: ['id', 'kode', 'nama'], // Hindari tarik siakJenjangId di sini karena bikin error GROUP BY Postgres
//                     where: Object.keys(prodiWhereClause).length > 0 ? prodiWhereClause : undefined
//                 }
//             ],
//             group: [
//                 'siakTahunKurikulumId',
//                 'siakProgramStudiId',
//                 'jenisMataKuliah',
//                 'tahunKurikulum.id',
//                 'tahunKurikulum.tahun',
//                 'programStudi.id',
//                 'programStudi.kode',
//                 'programStudi.nama'
//             ]
//         });

//         // Format Data & Bypass Jenjang (Anti-Error Postgres)
//         const formattedData = await Promise.all(listData.map(async (item) => {
//             let namaJenjang = 'S1'; // Default
            
//             if (item.siakProgramStudiId) {
//                 const prodi = await ProgramStudi.findByPk(item.siakProgramStudiId, { attributes: ['siakJenjangId'] });
//                 if (prodi && prodi.siakJenjangId) {
//                     const jenjang = await Jenjang.findByPk(prodi.siakJenjangId);
//                     if (jenjang) namaJenjang = jenjang.jenjang;
//                 }
//             }

//             return {
//                 kurikulumId: item.siakTahunKurikulumId,
//                 tahunKurikulum: item.tahunKurikulum?.tahun || '-',
//                 prodiId: item.siakProgramStudiId,
//                 kodeProdi: item.programStudi?.kode || '-',
//                 namaProdi: `${namaJenjang} - ${item.programStudi?.nama || '-'}`, 
//                 jenisMataKuliah: item.jenisMataKuliah
//             };
//         }));

//         return formattedData;

//     } catch (error) {
//         throw new Error("Gagal mengambil daftar template: " + error.message);
//     }
// };

// // ========================================================================
// // 2. GET DETAIL (Menarik Data 100% Sesuai UI)
// // ========================================================================
// export const getDetailTemplate = async (kurikulumId, prodiId, jenisMk) => {
//     try {
//         const detailData = await TemplateEvaluasi.findAll({
//             where: {
//                 siakTahunKurikulumId: kurikulumId,
//                 siakProgramStudiId: prodiId,
//                 jenisMataKuliah: jenisMk
//             },
//             include: [
//                 { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] },
//                 { model: ProgramStudi, as: 'programStudi', attributes: ['nama', 'siakJenjangId'] }
//             ],
//             order: [['createdAt', 'ASC']]
//         });

//         if (!detailData || detailData.length === 0) return null;

//         let namaJenjang = 'S1';
//         if (detailData[0].programStudi?.siakJenjangId) {
//             const jenjang = await Jenjang.findByPk(detailData[0].programStudi.siakJenjangId);
//             if (jenjang) namaJenjang = jenjang.jenjang;
//         }

//         const headerInfo = {
//             tahunKurikulum: detailData[0].tahunKurikulum?.tahun || '-',
//             programStudi: `${namaJenjang} - ${detailData[0].programStudi?.nama || '-'}`,
//             jenisMataKuliah: detailData[0].jenisMataKuliah
//         };

//         const komponenList = detailData.map(item => ({
//             id: item.id,
//             komponenEvaluasi: item.metodeEvaluasi, // Dibalik karena penamaan di DB vs UI FE
//             metodeEvaluasi: item.jenisEvaluasi,    // Dibalik karena penamaan di DB vs UI FE
//             bobot: parseFloat(item.bobot),
//             syaratLulus: item.syaratLulus || 'TIDAK_WAJIB', 
//             nilaiMinimum: item.nilaiMinimum ? parseFloat(item.nilaiMinimum) : null,
//             deskripsi: item.deskripsi || "-",
//             deskripsiInggris: item.deskripsiInggris || "-"
//         }));

//         return {
//             header: headerInfo,
//             komponen: komponenList
//         };

//     } catch (error) {
//         throw new Error("Gagal mengambil detail template: " + error.message);
//     }
// };

// // ========================================================================
// // 3. UPSERT (Fitur Wipe & Replace)
// // ========================================================================
// export const upsertTemplate = async (payload) => {
//     const { siakTahunKurikulumId, siakProgramStudiId, jenisMataKuliah, komponenData } = payload;
    
//     const trx = await sequelize.transaction();
//     try {
//         // Hapus total data template lama (Wipe)
//         await TemplateEvaluasi.destroy({
//             where: {
//                 siakTahunKurikulumId,
//                 siakProgramStudiId,
//                 jenisMataKuliah
//             },
//             transaction: trx,
//             force: true 
//         });

//         // Insert data template baru (Replace)
//         if (komponenData && komponenData.length > 0) {
//             const dataToInsert = komponenData.map(item => ({
//                 siakTahunKurikulumId,
//                 siakProgramStudiId,
//                 jenisMataKuliah,
//                 metodeEvaluasi: item.komponenEvaluasi || item.metodeEvaluasi, 
//                 jenisEvaluasi: item.metodeEvaluasi || item.jenisEvaluasi,     
//                 bobot: item.bobot,
//                 syaratLulus: item.syaratLulus || 'TIDAK_WAJIB', 
//                 nilaiMinimum: item.nilaiMinimum || null,
//                 deskripsi: item.deskripsi || null,
//                 deskripsiInggris: item.deskripsiInggris || null
//             }));

//             await TemplateEvaluasi.bulkCreate(dataToInsert, { transaction: trx });
//         }

//         await trx.commit();
//         return true;
//     } catch (error) {
//         await trx.rollback();
//         throw new Error("Gagal menyimpan template evaluasi: " + error.message);
//     }
// };

// // ========================================================================
// // 4. DELETE (Hapus Berdasarkan Kriteria Header)
// // ========================================================================
// export const deleteTemplate = async (kurikulumId, prodiId, jenisMk) => {
//     try {
//         const deletedRows = await TemplateEvaluasi.destroy({
//             where: {
//                 siakTahunKurikulumId: kurikulumId,
//                 siakProgramStudiId: prodiId,
//                 jenisMataKuliah: jenisMk
//             }
//         });
//         return deletedRows;
//     } catch (error) {
//         throw new Error("Gagal menghapus template evaluasi: " + error.message);
//     }
// };
import models from "../models/index.js";
import * as CustomError from "../utils/custom-error.js";
import { getPagination, getPagingData } from "../utils/pagination.js";
import { Op } from "sequelize";

const { TemplateEvaluasi, TahunKurikulum, ProgramStudi, Jenjang, sequelize } = models;

/**
 * Logic List dengan Grouping & Pagination
 */
export const getListTemplate = async (filters = {}) => {
    const { kurikulumId, prodiId, jenisMk, search, page, limit } = filters;
    const { limit: l, offset } = getPagination(page, limit);

    const whereClause = {};
    const prodiWhere = {};

    if (kurikulumId) whereClause.siakTahunKurikulumId = kurikulumId;
    if (prodiId) whereClause.siakProgramStudiId = prodiId;
    if (jenisMk) whereClause.jenisMataKuliah = jenisMk;

    if (search) {
        prodiWhere[Op.or] = [
            { nama: { [Op.iLike]: `%${search}%` } },
            { kode: { [Op.iLike]: `%${search}%` } }
        ];
    }

    // findAndCountAll dengan grouping
    const { count, rows } = await TemplateEvaluasi.findAndCountAll({
        where: whereClause,
        attributes: ['siakTahunKurikulumId', 'siakProgramStudiId', 'jenisMataKuliah'],
        include: [
            { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] },
            { 
                model: ProgramStudi, 
                as: 'programStudi', 
                where: Object.keys(prodiWhere).length > 0 ? prodiWhere : undefined,
                attributes: ['id', 'kode', 'nama', 'siakJenjangId'] 
            }
        ],
        group: [
            'siakTahunKurikulumId', 'siakProgramStudiId', 'jenisMataKuliah',
            'tahunKurikulum.id', 'tahunKurikulum.tahun',
            'programStudi.id', 'programStudi.kode', 'programStudi.nama', 'programStudi.siak_jenjang_id'
        ],
        limit: l,
        offset: offset,
        subQuery: false
    });

    // Formatting baris & inject nama Jenjang
    const formattedRows = await Promise.all(rows.map(async (item) => {
        let jenjangLabel = 'S1';
        if (item.programStudi?.siakJenjangId) {
            const j = await Jenjang.findByPk(item.programStudi.siakJenjangId);
            if (j) jenjangLabel = j.jenjang;
        }
        return {
            kurikulumId: item.siakTahunKurikulumId,
            tahunKurikulum: item.tahunKurikulum?.tahun || '-',
            prodiId: item.siakProgramStudiId,
            kodeProdi: item.programStudi?.kode || '-',
            programStudi: `${jenjangLabel} - ${item.programStudi?.nama || '-'}`,
            jenisMataKuliah: item.jenisMataKuliah
        };
    }));

    const resultForUtils = {
        count: Array.isArray(count) ? count.length : count,
        rows: formattedRows
    };

    return getPagingData(resultForUtils, page, l);
};

/**
 * Logic Detail: Mengambil Komponen & Menghitung Agregasi Pelaporan
 */
export const getDetailTemplate = async (kurikulumId, prodiId, jenisMk) => {
    const list = await TemplateEvaluasi.findAll({
        where: { siakTahunKurikulumId: kurikulumId, siakProgramStudiId: prodiId, jenisMataKuliah: jenisMk },
        include: [
            { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] },
            { model: ProgramStudi, as: 'programStudi', attributes: ['nama', 'siakJenjangId'] }
        ],
        order: [['createdAt', 'ASC']]
    });

    if (list.length === 0) throw new CustomError.NotFoundError("Template tidak ditemukan");

    let jenjangLabel = 'S1';
    if (list[0].programStudi?.siakJenjangId) {
        const j = await Jenjang.findByPk(list[0].programStudi.siakJenjangId);
        if (j) jenjangLabel = j.jenjang;
    }

    // Tabel 1: Komponen Evaluasi
    const komponenList = list.map(item => ({
        id: item.id,
        komponenEvaluasi: item.metodeEvaluasi, 
        metodeEvaluasi: item.jenisEvaluasi,
        bobot: parseFloat(item.bobot),
        syaratLulus: item.syaratLulus || 'TIDAK_MENJADI_SYARAT_LULUS'
    }));

    // Tabel 2: Agregasi Pelaporan Metode Evaluasi
    const mapPelaporan = {};
    list.forEach(item => {
        const basis = item.jenisEvaluasi; 
        if (!mapPelaporan[basis]) {
            mapPelaporan[basis] = { basisEvaluasi: basis, komponen: [], bobotTotal: 0 };
        }
        mapPelaporan[basis].komponen.push(item.metodeEvaluasi);
        mapPelaporan[basis].bobotTotal += parseFloat(item.bobot);
    });

    return {
        header: {
            tahunKurikulum: list[0].tahunKurikulum?.tahun,
            programStudi: `${jenjangLabel} - ${list[0].programStudi?.nama}`,
            jenisMataKuliah: list[0].jenisMataKuliah
        },
        komponen: komponenList,
        pelaporan: Object.values(mapPelaporan).map(p => ({
            basisEvaluasi: p.basisEvaluasi,
            komponenEvaluasi: p.komponen.join(', '),
            bobotEvaluasi: `${p.bobotTotal}%`
        }))
    };
};

/**
 * Logic Simpan (Wipe & Replace)
 */
export const upsertTemplate = async (payload) => {
    const { siakTahunKurikulumId, siakProgramStudiId, jenisMataKuliah, komponenData } = payload;
    const trx = await sequelize.transaction();

    try {
        // 1. Wipe data lama
        await TemplateEvaluasi.destroy({
            where: { siakTahunKurikulumId, siakProgramStudiId, jenisMataKuliah },
            transaction: trx
        });

        // 2. Mapping data baru (PASTIKAN KEY-NYA PAS)
        const dataToInsert = komponenData.map(item => ({
            siakTahunKurikulumId,
            siakProgramStudiId,
            jenisMataKuliah,
            
            // Nama Komponen (Contoh: "UTS", "TUGAS")
            metodeEvaluasi: item.komponenEvaluasi, 
            
            // Kategori/Jenis (Contoh: "Aktivitas Partisipatif") 
            // 👇 SEBELUMNYA TYPO DI SINI, SEKARANG SUDAH FIX 👇
            jenisEvaluasi: item.jenisEvaluasi,     
            
            bobot: item.bobot,
            
            // Syarat Lulus: Normalkan ke enum baru
            // Nilai lama 'WAJIB' / 'TIDAK_WAJIB' di-convert ke enum baru
            syaratLulus: (() => {
                const val = item.syaratLulus;
                if (val === 'MENJADI_SYARAT_LULUS' || val === 'WAJIB' || val === 'Ya') 
                    return 'MENJADI_SYARAT_LULUS';
                if (val === 'LULUS_DENGAN_NILAI_MINIMUM') 
                    return 'LULUS_DENGAN_NILAI_MINIMUM';
                return 'TIDAK_MENJADI_SYARAT_LULUS';
            })(),
            
            nilaiMinimum: item.nilaiMinimum || 0
        }));

        // 3. Insert Massal
        const result = await TemplateEvaluasi.bulkCreate(dataToInsert, { transaction: trx });
        
        await trx.commit();
        return result;
    } catch (error) {
        await trx.rollback();
        // Lempar error agar ditangkap Controller
        throw error; 
    }
};

/**
 * Logic Hapus
 */
export const deleteTemplate = async (kurikulumId, prodiId, jenisMk) => {
    const deleted = await TemplateEvaluasi.destroy({
        where: { siakTahunKurikulumId: kurikulumId, siakProgramStudiId: prodiId, jenisMataKuliah: jenisMk }
    });
    if (!deleted) throw new CustomError.NotFoundError("Template tidak ditemukan untuk dihapus");
    return true;
};