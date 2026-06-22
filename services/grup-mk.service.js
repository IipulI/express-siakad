import models from '../models/index.js';
import { getPagination, getPagingData } from "../utils/pagination.js";
import * as CustomError from "../utils/custom-error.js";

const { Sequelize, MataKuliah, KelompokMataKuliah, TahunKurikulum } = models;
// export const getFilterOptions = async () => {
//     const { TahunKurikulum, KelompokMataKuliah } = models;
    
//     const kurikulum = await TahunKurikulum.findAll({
//         attributes: ['id', 'tahun', 'keterangan'],
//         order: [['tahun', 'DESC']]
//     });

//     const grupMk = await KelompokMataKuliah.findAll({
//         attributes: ['id', 'nama', 'kode'],
//         order: [['nama', 'ASC']]
//     });

//     return { kurikulum, grupMk };
// };

export const getFilterOptions = async () => {
    const kurikulum = await TahunKurikulum.findAll({
        attributes: ['id', 'tahun', 'keterangan'],
        order: [['tahun', 'DESC']]
    });
    const grupMk = await KelompokMataKuliah.findAll({
        attributes: ['id', 'nama', 'kode'],
        order: [['nama', 'ASC']]
    });
    return { kurikulum, grupMk };
};


// export const getMappedCourses = async (tahunKurikulumId, kelompokMkId) => {
//     const { MataKuliah, KelompokMataKuliah } = models;
    
//     const whereClause = {};
//     if (tahunKurikulumId) whereClause.siak_tahun_kurikulum_id = tahunKurikulumId;
    
//     if (kelompokMkId) {
//         whereClause.siak_kelompok_mata_kuliah_id = kelompokMkId;
//     } else {
//         // Jika filter grup "-- Semua --" dipilih, tampilkan yang ID grupnya tidak null
//         whereClause.siak_kelompok_mata_kuliah_id = { [Sequelize.Op.not]: null };
//     }

//     const listMk = await MataKuliah.findAll({
//         where: whereClause,
//         include: [{ model: KelompokMataKuliah, as: 'kelompokMk', attributes: ['id', 'nama'] }],
//         attributes: ['id', 'kode', 'nama', 'semester', ['total_sks', 'sks'], 'opsi_wajib'],
//         // Urutkan berdasarkan Nama Grup dulu, baru semesternya
//         order: [
//             [{ model: KelompokMataKuliah, as: 'kelompokMk' }, 'nama', 'ASC'],
//             ['semester', 'ASC'], 
//             ['nama', 'ASC']
//         ]
//     });

//     // MAPPING DATA BIAR KONSISTEN DENGAN KOLOM UI
//     return listMk.map(mk => ({
//         id: mk.id,
//         grupMk: mk.kelompokMk ? mk.kelompokMk.nama : '-',
//         // Gabungkan Kode, Nama, dan SKS biar tabel UI lebih padat & rapi
//         mataKuliah: `${mk.kode} - ${mk.nama} (${mk.dataValues.sks || 0} SKS)`, 
//         // Tetap kirim raw datanya kalau sewaktu-waktu Frontend butuh
//         kodeMk: mk.kode,
//         namaMk: mk.nama,
//         sks: mk.dataValues.sks,
//         semester: mk.semester,
//         opsiWajib: mk.opsi_wajib
//     }));
// };

export const getMappedCourses = async (queries) => {
    const { kurikulumId, grupId, page, limit: size } = queries;
    const { limit, offset } = getPagination(page, size);

    const whereClause = {};
    if (kurikulumId) whereClause.siak_tahun_kurikulum_id = kurikulumId;
    
    // Filter hanya yang sudah masuk grup
    if (grupId) {
        whereClause.siak_kelompok_mata_kuliah_id = grupId;
    } else {
        whereClause.siak_kelompok_mata_kuliah_id = { [Sequelize.Op.not]: null };
    }

    const { count, rows } = await MataKuliah.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        include: [{ model: KelompokMataKuliah, as: 'kelompokMk', attributes: ['id', 'nama'] }],
        attributes: ['id', 'kode', 'nama', 'semester', ['total_sks', 'sks']],
        order: [[{ model: KelompokMataKuliah, as: 'kelompokMk' }, 'nama', 'ASC'], ['semester', 'ASC']]
    });

    const rowsMapped = rows.map(mk => ({
        id: mk.id,
        grupMk: mk.kelompokMk ? mk.kelompokMk.nama : '-',
        mataKuliah: `${mk.kode} - ${mk.nama} (${mk.dataValues.sks || 0} SKS)`,
        semester: mk.semester
    }));

    return getPagingData({ count, rows: rowsMapped }, page, limit);
};



// export const getUnmappedCourses = async (tahunKurikulumId) => {
//     const { MataKuliah } = models;
//     const listMk = await MataKuliah.findAll({
//         where: {
//             siak_tahun_kurikulum_id: tahunKurikulumId,
//             siak_kelompok_mata_kuliah_id: null // Hanya MK yang nganggur
//         },
//         attributes: ['id', 'kode', 'nama', 'semester', ['total_sks', 'sks']],
//         order: [['semester', 'ASC'], ['nama', 'ASC']]
//     });

//     return listMk.map(mk => ({
//         id: mk.id,
//         kode: mk.kode,
//         nama: mk.nama,
//         sks: mk.dataValues.sks,
//         semester: mk.semester,
//         // Bikin field 'label' biar gampang dipakai di dropdown Frontend (Select2 / React Select)
//         label: `${mk.kode} - ${mk.nama} (${mk.dataValues.sks || 0} SKS)`
//     }));
// };


export const getUnmappedCourses = async (tahunKurikulumId) => {
    if (!tahunKurikulumId) throw new CustomError.BadRequestError("Kurikulum ID wajib ada");
    
    return await MataKuliah.findAll({
        where: { siak_tahun_kurikulum_id: tahunKurikulumId, siak_kelompok_mata_kuliah_id: null },
        attributes: ['id', 'kode', 'nama', 'semester', ['total_sks', 'sks']],
        order: [['semester', 'ASC']]
    });
};

// export const addCourseToGroup = async (mkId, grupId) => {
//     const { MataKuliah } = models;
//     const mk = await MataKuliah.findByPk(mkId);
//     if (!mk) throw new Error("Mata Kuliah tidak ditemukan");

//     mk.siak_kelompok_mata_kuliah_id = grupId;
//     await mk.save();
//     return mk;
// };


export const addCourseToGroup = async (mkId, grupId) => {
    const mk = await MataKuliah.findByPk(mkId);
    if (!mk) throw new CustomError.NotFoundError("Mata Kuliah tidak ditemukan");
    
    return await mk.update({ siak_kelompok_mata_kuliah_id: grupId });
};

// export const removeCourseFromGroup = async (mkId) => {
//     const { MataKuliah } = models;
//     const mk = await MataKuliah.findByPk(mkId);
//     if (!mk) throw new Error("Mata Kuliah tidak ditemukan");

//     mk.siak_kelompok_mata_kuliah_id = null; // Dikeluarkan dari grup
//     await mk.save();
//     return mk;
// };

export const removeCourseFromGroup = async (mkId) => {
    const mk = await MataKuliah.findByPk(mkId);
    if (!mk) throw new CustomError.NotFoundError("Mata Kuliah tidak ditemukan");
    
    return await mk.update({ siak_kelompok_mata_kuliah_id: null });
};