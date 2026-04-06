import models from '../models/index.js';
const { Sequelize } = models;

export const getFilterOptions = async () => {
    const { TahunKurikulum, KelompokMataKuliah } = models;
    
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

export const getMappedCourses = async (tahunKurikulumId, kelompokMkId) => {
    const { MataKuliah, KelompokMataKuliah } = models;
    
    const whereClause = {};
    if (tahunKurikulumId) whereClause.siak_tahun_kurikulum_id = tahunKurikulumId;
    
    if (kelompokMkId) {
        whereClause.siak_kelompok_mata_kuliah_id = kelompokMkId;
    } else {
        // Jika filter grup "-- Semua --" dipilih, tampilkan yang ID grupnya tidak null
        whereClause.siak_kelompok_mata_kuliah_id = { [Sequelize.Op.not]: null };
    }

    return await MataKuliah.findAll({
        where: whereClause,
        include: [{ model: KelompokMataKuliah, as: 'kelompokMk', attributes: ['id', 'nama'] }],
        attributes: ['id', 'kode', 'nama', 'semester', ['total_sks', 'sks'], 'opsi_wajib'],
        order: [['semester', 'ASC'], ['nama', 'ASC']]
    });
};

export const getUnmappedCourses = async (tahunKurikulumId) => {
    const { MataKuliah } = models;
    return await MataKuliah.findAll({
        where: {
            siak_tahun_kurikulum_id: tahunKurikulumId,
            siak_kelompok_mata_kuliah_id: null // Hanya MK yang belum masuk grup mana pun
        },
        attributes: ['id', 'kode', 'nama', 'semester', ['total_sks', 'sks']]
    });
};

export const addCourseToGroup = async (mkId, grupId) => {
    const { MataKuliah } = models;
    const mk = await MataKuliah.findByPk(mkId);
    if (!mk) throw new Error("Mata Kuliah tidak ditemukan");

    mk.siak_kelompok_mata_kuliah_id = grupId;
    await mk.save();
    return mk;
};

export const removeCourseFromGroup = async (mkId) => {
    const { MataKuliah } = models;
    const mk = await MataKuliah.findByPk(mkId);
    if (!mk) throw new Error("Mata Kuliah tidak ditemukan");

    mk.siak_kelompok_mata_kuliah_id = null; // Dikeluarkan dari grup
    await mk.save();
    return mk;
};