import models from '../models/index.js';

export const getPredikatKelulusan = async (tahunKurikulumId, jenjangId) => {
    const { PredikatKelulusan } = models;
    return await PredikatKelulusan.findAll({
        where: {
            siak_tahun_kurikulum_id: tahunKurikulumId,
            siak_jenjang_id: jenjangId
        },
        order: [['ipk_min', 'DESC']] // Urutkan dari IPK terbesar
    });
};

export const createPredikatKelulusan = async (payload) => {
    const { PredikatKelulusan } = models;
    return await PredikatKelulusan.create(payload);
};

export const updatePredikatKelulusan = async (id, payload) => {
    const { PredikatKelulusan } = models;
    
    const existingData = await PredikatKelulusan.findByPk(id);
    if (!existingData) {
        throw new Error("Data Predikat Kelulusan tidak ditemukan");
    }

    const [updatedRowsCount] = await PredikatKelulusan.update(payload, {
        where: { id: id }
    });

    return updatedRowsCount > 0;
};

export const deletePredikatKelulusan = async (id) => {
    const { PredikatKelulusan } = models;
    
    const deletedRowsCount = await PredikatKelulusan.destroy({
        where: { id: id }
    });

    return deletedRowsCount > 0;
};