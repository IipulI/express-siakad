import models from "../models/index.js";
const { SkalaPenilaian, BatasSks } = models; // Asumsi nama model Abang

// ==========================================
// TAB 1: SKALA NILAI (siak_skala_penilaian)
// ==========================================

export const getSkalaNilai = async (programStudiId, tahunKurikulumId) => {
    return await SkalaPenilaian.findAll({
        where: {
            siak_program_studi_id: programStudiId,
            siak_tahun_kurikulum_id: tahunKurikulumId
        },
        order: [['nilai_min', 'DESC']] // Urutkan dari nilai A ke bawah
    });
};

export const saveSkalaNilai = async (data) => {
    // Karena UI biasanya input 1 per 1 baris, kita buat fungsi create/update tunggal
    if (data.id) {
        // Update
        const skala = await SkalaPenilaian.findByPk(data.id);
        if (!skala) throw new Error("Data Skala Nilai tidak ditemukan");
        return await skala.update(data);
    } else {
        // Create Baru
        return await SkalaPenilaian.create(data);
    }
};

export const deleteSkalaNilai = async (id) => {
    const skala = await SkalaPenilaian.findByPk(id);
    if (!skala) throw new Error("Data Skala Nilai tidak ditemukan");
    await skala.destroy();
    return true;
};


// ==========================================
// TAB 2: BATAS SKS (siak_batas_sks)
// ==========================================

export const getBatasSks = async (jenjangId) => {
    return await BatasSks.findAll({
        where: { siak_jenjang_id: jenjangId },
        order: [['ips_min', 'ASC']] // Urutkan dari IPK paling kecil
    });
};

export const saveBatasSks = async (data) => {
    if (data.id) {
        const batas = await BatasSks.findByPk(data.id);
        if (!batas) throw new Error("Data Batas SKS tidak ditemukan");
        return await batas.update(data);
    } else {
        return await BatasSks.create(data);
    }
};

export const deleteBatasSks = async (id) => {
    const batas = await BatasSks.findByPk(id);
    if (!batas) throw new Error("Data Batas SKS tidak ditemukan");
    await batas.destroy();
    return true;
};