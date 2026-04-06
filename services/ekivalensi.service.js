import models from '../models/index.js';

export const getDaftarEkivalensi = async (prodiId, kurikulumBaruId) => {
    const { MataKuliah, EkivalensiMataKuliah } = models;

    // 1. Ambil semua MK di kurikulum baru (sebelah kiri tabel UI)
    const listMkBaru = await MataKuliah.findAll({
        where: {
            siak_program_studi_id: prodiId,
            siak_tahun_kurikulum_id: kurikulumBaruId
        },
        attributes: ['id', 'kode', 'nama', 'total_sks'],
        order: [['kode', 'ASC']]
    });

    // 2. Format response agar include data ekivalensinya (kalau ada)
    const result = await Promise.all(listMkBaru.map(async (mkBaru) => {
        const ekivalensi = await EkivalensiMataKuliah.findOne({
            where: { siak_mata_kuliah_id: mkBaru.id },
            include: [{
                model: MataKuliah,
                as: 'mataKuliahLama',
                attributes: ['id', 'kode', 'nama', 'total_sks']
            }]
        });

        return {
            idMkBaru: mkBaru.id,
            kodeMkBaru: mkBaru.kode,
            namaMkBaru: mkBaru.nama,
            sksMkBaru: mkBaru.total_sks,
            ekivalensiId: ekivalensi ? ekivalensi.id : null,
            mkLama: ekivalensi && ekivalensi.mataKuliahLama ? {
                id: ekivalensi.mataKuliahLama.id,
                kode: ekivalensi.mataKuliahLama.kode,
                nama: ekivalensi.mataKuliahLama.nama,
                sks: ekivalensi.mataKuliahLama.total_sks
            } : null 
        };
    }));

    return result;
};

export const setEkivalensi = async (payload) => {
    const { EkivalensiMataKuliah } = models;
    const { siakMataKuliahId, siakMataKuliahLamaId } = payload;

    // Cek apakah MK Baru ini sudah punya pasangan, kalau iya di-update saja
    const existing = await EkivalensiMataKuliah.findOne({
        where: { siak_mata_kuliah_id: siakMataKuliahId }
    });

    if (existing) {
        existing.siakMataKuliahLamaId = siakMataKuliahLamaId;
        return await existing.save();
    } else {
        return await EkivalensiMataKuliah.create({
            siakMataKuliahId,
            siakMataKuliahLamaId
        });
    }
};

export const hapusEkivalensi = async (id) => {
    const { EkivalensiMataKuliah } = models;
    const data = await EkivalensiMataKuliah.findByPk(id);
    if (!data) throw new Error("Data mapping ekivalensi tidak ditemukan");
    return await data.destroy();
};