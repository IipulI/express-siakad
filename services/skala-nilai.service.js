import models from '../models/index.js';

export const getSkalaNilaiByProdi = async (programStudiId, tahunKurikulumId) => {
    const { SkalaPenilaian } = models;
    return await SkalaPenilaian.findAll({
        where: {
            siak_program_studi_id: programStudiId,
            siak_tahun_kurikulum_id: tahunKurikulumId
        },
        order: [['nilai_min', 'DESC']] // Urutkan dari nilai tertinggi (A) ke bawah
    });
};

export const upsertSkalaNilai = async (payload) => {
    const { SkalaPenilaian } = models;
    
    // Jika ada ID, berarti Update. Jika tidak ada, Create baru.
    if (payload.id) {
        const existingData = await SkalaPenilaian.findByPk(payload.id);
        if (!existingData) throw new Error("Data Skala Nilai tidak ditemukan");
        return await existingData.update(payload);
    } else {
        return await SkalaPenilaian.create(payload);
    }
};

export const deleteSkalaNilai = async (id) => {
    const { SkalaPenilaian } = models;
    const data = await SkalaPenilaian.findByPk(id);
    if (!data) throw new Error("Data Skala Nilai tidak ditemukan");
    return await data.destroy();
};