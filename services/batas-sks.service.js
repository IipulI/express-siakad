// import models from "../models/index.js";
// import { getPagination } from "../utils/pagination.js";

// const { BatasSks } = models;

// export const findAll = async (page, size) => {
//   try {
//     if (page !== null && size !== null) {
//       const { limit, offset } = getPagination(page, size);

//       const { count, rows } = await BatasSks.findAndCountAll({
//         attributes: [
//           "id",
//           "siak_jenjang_id",
//           "ips_min",
//           "ips_max",
//           "batas_sks"
//         ],
//         limit,
//         offset,
//         raw: true,
//       });

//       // const formattedRows = rows.map(record => ({
//       //     ...record,
//       //     createdAt: formatTimestamp(record.createdAt),
//       // }));

//       return {
//         count,
//         rows,
//         isPaginated: true,
//       };
//     } else {
//       const { count, rows } = await BatasSks.findAndCountAll({
//         attributes: [
//           "id",
//           "siak_jenjang_id",
//           "ips_min",
//           "ips_max",
//           "batas_sks"
//         ],
//         // raw: true,
//       });

//       return {
//         count: count,
//         rows,
//         isPaginated: false,
//       };
//     }
//   } catch (error) {
//     console.log(error)
//     throw new Error(`Gagal mengambil data : ${error.message}`);
//   }
// };

// export const createBatasSks = async (batasSksData) => {
//   const { siakJenjangId, ipsMin, ipsMax, batasSks } = batasSksData;

//   // FIX LOGIKA: Cek apakah di Jenjang yang sama, rentang IPS ini sudah ada
//   const existingBatasSks = await BatasSks.findOne({
//     where: { 
//         siak_jenjang_id: siakJenjangId,
//         ips_min: ipsMin,
//         ips_max: ipsMax
//     },
//   });

//   if (existingBatasSks) {
//     // FIX TYPO: Pakai batasSks (huruf kecil) agar muncul angka, bukan struktur class
//     throw new Error(`Aturan Batas SKS untuk rentang IPS ${ipsMin} - ${ipsMax} pada jenjang ini sudah ada.`);
//   }

//   try {
//     // Gunakan camelCase sesuai mapping Model Abang
//     await BatasSks.create({ 
//         siakJenjangId, 
//         ipsMin, 
//         ipsMax, 
//         batasSks 
//     });
//   } catch (err) {
//     if (err.name === "SequelizeUniqueConstraintError") {
//       throw new Error(
//         `Duplicate entry: ${err.errors.map((e) => e.message).join(", ")}`
//       );
//     }
//     throw new Error(`Terjadi kesalahan saat membuat Batas Sks: ${err.message}`);
//   }
// };

// export const updateBatasSks = async (id, batasSksData) => {
//     const { ipsMin, ipsMax, batasSks } = batasSksData;

//     try {
//         const cekDataBatasSks = await BatasSks.findByPk(id)
//         if (!cekDataBatasSks) {
//             throw new Error (`Batas Sks tidak ditemukan`)
//         }

//         const [updatedRowsCount] = await BatasSks.update({
//             ipsMin,
//             ipsMax,
//             batasSks
//         }, {
//             where: { id: id }
//         });

//         return updatedRowsCount > 0;
//     }
//     catch (error) {
//         throw new Error(`Gagal memperbarui data Batas Sks : ${error.message}`);
//     }
// }

// export const deleteBatasSks = async (id) => {
//   try {
//     const deletedRowsCount = await BatasSks.destroy({
//       where: { id },
//     });

//     return deletedRowsCount > 0;
//   } catch (error) {
//     throw new Error(`Gagal menghapus batas sks: ${error.message}`);
//   }
// };
import models from '../models/index.js';
import * as CustomError from '../utils/custom-error.js';

// Helper format tanggal
const formatIndoDate = (dateString) => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateString));
};

// ==========================================
// 1. GET ALL & HEADER
// ==========================================
export const getBatasSksList = async (jenjangId, tahunKurikulumId) => {
    const { TahunKurikulum, PeriodeAkademik, BatasSks } = models; 

    // 1. Ambil Data Header Kurikulum
    const kurikulum = await TahunKurikulum.findByPk(tahunKurikulumId, {
        attributes: ['tahun', 'keterangan', 'tanggalMulai', 'tanggalSelesai'],
        include: [{ model: PeriodeAkademik, as: 'periodeAkademik', attributes: ['nama'] }]
    });

    if (!kurikulum) throw new CustomError.NotFoundError("Data Tahun Kurikulum tidak ditemukan");

    const headerLengkap = {
        kurikulum: kurikulum.tahun,
        keterangan: kurikulum.keterangan || '-',
        mulaiBerlaku: kurikulum.periodeAkademik ? kurikulum.periodeAkademik.nama : `${kurikulum.tahun} Ganjil`,
        tanggalAwal: formatIndoDate(kurikulum.tanggalMulai),
        tanggalAkhir: formatIndoDate(kurikulum.tanggalSelesai)
    };

    // 2. Ambil Data Tabel Batas SKS
    const rawData = await BatasSks.findAll({
        where: { siak_jenjang_id: jenjangId },
        order: [['ips_min', 'ASC']] // Urutkan dari IPS terkecil
    });

    // Rapikan nama field jadi camelCase biar seragam
    const listBatasSks = rawData.map(item => ({
        id: item.id,
        siakJenjangId: item.siakJenjangId || item.siak_jenjang_id,
        ipsMin: parseFloat(item.ipsMin || item.ips_min || 0),
        ipsMax: parseFloat(item.ipsMax || item.ips_max || 0),
        batasSks: parseInt(item.batasSks || item.batas_sks || 0)
    }));

    // Return Header + Tabel Data
    return {
        header: headerLengkap,
        batasSks: listBatasSks
    };
};

// ==========================================
// 2. CREATE (POST)
// ==========================================
export const createBatasSks = async (batasSksData) => {
    const { BatasSks } = models; // 👈 WAJIB DIPANGGIL DI SINI BANG
    const { siakJenjangId, ipsMin, ipsMax, batasSks } = batasSksData;

    // Cek apakah di Jenjang yang sama, rentang IPS ini sudah ada
    const existingBatasSks = await BatasSks.findOne({
        where: { 
            siak_jenjang_id: siakJenjangId,
            ips_min: ipsMin,
            ips_max: ipsMax
        },
    });

    if (existingBatasSks) {
        // 👇 Ganti Error biasa jadi ConflictError (409)
        throw new CustomError.ConflictError(`Aturan Batas SKS untuk rentang IPS ${ipsMin} - ${ipsMax} pada jenjang ini sudah ada.`);
    }

    try {
        await BatasSks.create({ 
            siakJenjangId, 
            ipsMin, 
            ipsMax, 
            batasSks 
        });
    } catch (err) {
        if (err.name === "SequelizeUniqueConstraintError") {
            throw new CustomError.ConflictError(`Duplicate entry: ${err.errors.map((e) => e.message).join(", ")}`);
        }
        // 👇 Ganti Error biasa jadi InternalServerError (500)
        throw new CustomError.InternalServerError(`Terjadi kesalahan saat membuat Batas Sks: ${err.message}`);
    }
};

// ==========================================
// 3. UPDATE (PUT)
// ==========================================
export const updateBatasSks = async (id, batasSksData) => {
    const { BatasSks } = models; // 👈 WAJIB DIPANGGIL DI SINI JUGA
    const { ipsMin, ipsMax, batasSks } = batasSksData;

    try {
        const cekDataBatasSks = await BatasSks.findByPk(id)
        if (!cekDataBatasSks) {
            // 👇 Ganti jadi NotFoundError (404)
            throw new CustomError.NotFoundError(`Batas Sks tidak ditemukan`);
        }

        const [updatedRowsCount] = await BatasSks.update({
            ipsMin,
            ipsMax,
            batasSks
        }, {
            where: { id: id }
        });

        return updatedRowsCount > 0;
    } catch (error) {
        // Tolak error jika asalnya sudah dari CustomError
        if (error instanceof CustomError.NotFoundError) throw error;
        throw new CustomError.InternalServerError(`Gagal memperbarui data Batas Sks : ${error.message}`);
    }
}

// ==========================================
// 4. DELETE (DELETE)
// ==========================================
export const deleteBatasSks = async (id) => {
    const { BatasSks } = models; // 👈 WAJIB DIPANGGIL

    try {
        const deletedRowsCount = await BatasSks.destroy({
            where: { id },
        });

        if (deletedRowsCount === 0) {
            throw new CustomError.NotFoundError(`Batas Sks tidak ditemukan`);
        }

        return deletedRowsCount > 0;
    } catch (error) {
        if (error instanceof CustomError.NotFoundError) throw error;
        throw new CustomError.InternalServerError(`Gagal menghapus batas sks: ${error.message}`);
    }
};