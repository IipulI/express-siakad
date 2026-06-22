// import models from '../models/index.js';

// // 1. GET DATA & HEADER
// export const getAturanEvaluasiList = async (tahunKurikulumId, jenjangId) => {
//     // Asumsi nama model: AturanEvaluasi
//     const { TahunKurikulum, AturanEvaluasi } = models;

//     // Header Kurikulum (Sama seperti CPL)
//     const kurikulum = await TahunKurikulum.findByPk(tahunKurikulumId);
//     if (!kurikulum) throw new Error("Tahun Kurikulum tidak ditemukan");

//     const formatDate = (dateString) => {
//         if (!dateString) return '-';
//         const d = new Date(dateString);
//         const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
//         return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
//     };

//     const headerInfo = {
//         kurikulum: kurikulum.tahun,
//         keterangan: kurikulum.keterangan || '-',
//         mulaiBerlaku: kurikulum.mulaiBerlaku || kurikulum.mulai_berlaku || `${kurikulum.tahun} Ganjil`,
//         tanggalAwal: formatDate(kurikulum.tanggalMulai || kurikulum.tanggal_mulai),
//         tanggalAkhir: formatDate(kurikulum.tanggalAkhir || kurikulum.tanggal_akhir),
//     };

//     // Ambil Data Aturan Evaluasi
//     let dataEvaluasi = [];
//     if (AturanEvaluasi) {
//         const rawData = await AturanEvaluasi.findAll({
//             where: { 
//                 siak_tahun_kurikulum_id: tahunKurikulumId,
//                 siak_jenjang_id: jenjangId
//             },
//             order: [['semester_ke', 'ASC']] // Urutkan dari semester terkecil
//         });

//         dataEvaluasi = rawData.map(item => ({
//             id: item.id,
//             semesterKe: item.semesterKe || item.semester_ke,
//             totalSksMinimal: item.totalSksMinimal || item.total_sks_minimal,
//             batasIpkMinimal: item.batasIpkMinimal || item.batas_ipk_minimal
//         }));
//     }

//     return { header: headerInfo, tabel: dataEvaluasi };
// };

// // 2. SIMPAN / UPDATE (UPSERT)
// export const upsertAturanEvaluasi = async (tahunKurikulumId, jenjangId, payload) => {
//     const { AturanEvaluasi } = models;

//     const dataToSave = {
//         siakTahunKurikulumId: tahunKurikulumId,
//         siakJenjangId: jenjangId,
//         semesterKe: parseInt(payload.semesterKe) || 0,
//         totalSksMinimal: parseInt(payload.totalSksMinimal) || 0,
//         batasIpkMinimal: parseFloat(payload.batasIpkMinimal) || 0.00
//     };

//     if (payload.id) {
//         const existingData = await AturanEvaluasi.findByPk(payload.id);
//         if (!existingData) throw new Error("Data Aturan Evaluasi tidak ditemukan");
//         return await existingData.update(dataToSave);
//     } else {
//         return await AturanEvaluasi.create(dataToSave);
//     }
// };

// // 3. DELETE
// export const destroyAturanEvaluasi = async (id) => {
//     const { AturanEvaluasi } = models;
//     const existingData = await AturanEvaluasi.findByPk(id);
//     if (!existingData) throw new Error("Data Aturan Evaluasi tidak ditemukan");
//     return await existingData.destroy();
// };

import models from '../models/index.js';
import * as CustomError from "../utils/custom-error.js";

const { TahunKurikulum, PeriodeAkademik, AturanEvaluasi } = models;

const formatIndoDate = (dateString) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateString));
};

export const getAturanEvaluasiList = async (tahunKurikulumId, jenjangId) => {
    // 1. Ambil Header Kurikulum
    const kurikulum = await TahunKurikulum.findByPk(tahunKurikulumId, {
        include: [{ model: PeriodeAkademik, as: 'periodeAkademik' }]
    });
    if (!kurikulum) throw new CustomError.NotFoundError("Tahun Kurikulum tidak ditemukan");

    const headerInfo = {
        kurikulum: kurikulum.tahun,
        keterangan: kurikulum.keterangan || '-',
        mulaiBerlaku: kurikulum.periodeAkademik?.nama || `${kurikulum.tahun} Ganjil`,
        tanggalAwal: formatIndoDate(kurikulum.tanggalMulai),
        tanggalAkhir: formatIndoDate(kurikulum.tanggalSelesai),
    };

    // 2. Ambil Data Tabel
    const rawData = await AturanEvaluasi.findAll({
        where: { 
            siak_tahun_kurikulum_id: tahunKurikulumId,
            siak_jenjang_id: jenjangId
        },
        order: [['semester_ke', 'ASC']]
    });

    const tabelData = rawData.map(item => ({
        id: item.id,
        semesterKe: item.semesterKe || item.semester_ke,
        totalSksMinimal: parseInt(item.totalSksMinimal || item.total_sks_minimal),
        batasIpkMinimal: parseFloat(item.batasIpkMinimal || item.batas_ipk_minimal).toFixed(2)
    }));

    return { header: headerInfo, tabel: tabelData };
};

export const upsertAturanEvaluasi = async (payload) => {
    if (payload.id) {
        const existingData = await AturanEvaluasi.findByPk(payload.id);
        if (!existingData) throw new CustomError.NotFoundError("Data Aturan Evaluasi tidak ditemukan");
        return await existingData.update(payload);
    } else {
        return await AturanEvaluasi.create(payload);
    }
};

export const destroyAturanEvaluasi = async (id) => {
    const existingData = await AturanEvaluasi.findByPk(id);
    if (!existingData) throw new CustomError.NotFoundError("Data Aturan Evaluasi tidak ditemukan");
    return await existingData.destroy();
};

// =========================================================
// PRATINJAU SALIN Aturan Evaluasi (lihat isi sumber sebelum disalin)
// =========================================================
export const pratinjauSalinAturanEvaluasi = async (jenjangIdAsal, tahunKurikulumIdAsal) => {
    const { Jenjang } = models;

    const aturanAsal = await AturanEvaluasi.findAll({
        where: { siak_jenjang_id: jenjangIdAsal, siak_tahun_kurikulum_id: tahunKurikulumIdAsal },
        order: [['semester_ke', 'ASC']]
    });
    if (aturanAsal.length === 0) throw new CustomError.NotFoundError("Aturan Evaluasi pada Jenjang & Tahun Kurikulum asal belum diisi");

    const jenjang = await Jenjang.findByPk(jenjangIdAsal, { attributes: ['jenjang'] });
    const kurikulum = await TahunKurikulum.findByPk(tahunKurikulumIdAsal, { attributes: ['tahun'] });

    return {
        jenjangAsal: jenjang?.jenjang || '-',
        tahunKurikulumAsal: kurikulum?.tahun || '-',
        aturanEvaluasi: aturanAsal.map(a => ({
            semesterKe: a.semesterKe,
            totalSksMinimal: parseInt(a.totalSksMinimal || 0),
            batasIpkMinimal: parseFloat(a.batasIpkMinimal || 0).toFixed(2)
        }))
    };
};

// =========================================================
// SALIN Aturan Evaluasi (wipe & replace tujuan: jenjang + tahun kurikulum tujuan)
// =========================================================
export const salinAturanEvaluasi = async (payload) => {
    const { jenjangIdAsal, tahunKurikulumIdAsal, jenjangIdTujuan, tahunKurikulumIdTujuan } = payload;

    const aturanAsal = await AturanEvaluasi.findAll({
        where: { siak_jenjang_id: jenjangIdAsal, siak_tahun_kurikulum_id: tahunKurikulumIdAsal }
    });
    if (aturanAsal.length === 0) throw new CustomError.NotFoundError("Aturan Evaluasi pada Jenjang & Tahun Kurikulum asal belum diisi");

    return await models.sequelize.transaction(async (trx) => {
        await AturanEvaluasi.destroy({
            where: { siak_jenjang_id: jenjangIdTujuan, siak_tahun_kurikulum_id: tahunKurikulumIdTujuan },
            force: true,
            transaction: trx
        });

        const dataBaru = aturanAsal.map(a => ({
            siakJenjangId: jenjangIdTujuan,
            siakTahunKurikulumId: tahunKurikulumIdTujuan,
            semesterKe: a.semesterKe,
            totalSksMinimal: a.totalSksMinimal,
            batasIpkMinimal: a.batasIpkMinimal
        }));
        await AturanEvaluasi.bulkCreate(dataBaru, { transaction: trx });

        return { jumlahDisalin: dataBaru.length };
    });
};