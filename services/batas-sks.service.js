import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";

const { BatasSks } = models;

export const findAll = async (page, size) => {
  try {
    if (page !== null && size !== null) {
      const { limit, offset } = getPagination(page, size);

      const { count, rows } = await BatasSks.findAndCountAll({
        attributes: [
          "id",
          "siak_jenjang_id",
          "ips_min",
          "ips_max",
          "batas_sks"
        ],
        limit,
        offset,
        raw: true,
      });

      // const formattedRows = rows.map(record => ({
      //     ...record,
      //     createdAt: formatTimestamp(record.createdAt),
      // }));

      return {
        count,
        rows,
        isPaginated: true,
      };
    } else {
      const { count, rows } = await BatasSks.findAndCountAll({
        attributes: [
          "id",
          "siak_jenjang_id",
          "ips_min",
          "ips_max",
          "batas_sks"
        ],
        // raw: true,
      });

      return {
        count: count,
        rows,
        isPaginated: false,
      };
    }
  } catch (error) {
    console.log(error)
    throw new Error(`Gagal mengambil data : ${error.message}`);
  }
};

export const createBatasSks = async (batasSksData) => {
  const { siakJenjangId, ipsMin, ipsMax, batasSks } = batasSksData;

  // FIX LOGIKA: Cek apakah di Jenjang yang sama, rentang IPS ini sudah ada
  const existingBatasSks = await BatasSks.findOne({
    where: { 
        siak_jenjang_id: siakJenjangId,
        ips_min: ipsMin,
        ips_max: ipsMax
    },
  });

  if (existingBatasSks) {
    // FIX TYPO: Pakai batasSks (huruf kecil) agar muncul angka, bukan struktur class
    throw new Error(`Aturan Batas SKS untuk rentang IPS ${ipsMin} - ${ipsMax} pada jenjang ini sudah ada.`);
  }

  try {
    // Gunakan camelCase sesuai mapping Model Abang
    await BatasSks.create({ 
        siakJenjangId, 
        ipsMin, 
        ipsMax, 
        batasSks 
    });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      throw new Error(
        `Duplicate entry: ${err.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw new Error(`Terjadi kesalahan saat membuat Batas Sks: ${err.message}`);
  }
};

export const updateBatasSks = async (id, batasSksData) => {
    const { ipsMin, ipsMax, batasSks } = batasSksData;

    try {
        const cekDataBatasSks = await BatasSks.findByPk(id)
        if (!cekDataBatasSks) {
            throw new Error (`Batas Sks tidak ditemukan`)
        }

        const [updatedRowsCount] = await BatasSks.update({
            ipsMin,
            ipsMax,
            batasSks
        }, {
            where: { id: id }
        });

        return updatedRowsCount > 0;
    }
    catch (error) {
        throw new Error(`Gagal memperbarui data Batas Sks : ${error.message}`);
    }
}

export const deleteBatasSks = async (id) => {
  try {
    const deletedRowsCount = await BatasSks.destroy({
      where: { id },
    });

    return deletedRowsCount > 0;
  } catch (error) {
    throw new Error(`Gagal menghapus batas sks: ${error.message}`);
  }
};