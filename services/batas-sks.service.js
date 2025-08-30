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

  const existingBatasSks = await BatasSks.findOne({
    where: { batasSks },
  });

  if (existingBatasSks) {
    throw new Error(`Batas Sks dengan nilai "${BatasSks}" sudah ada`);
  }

  try {
    await BatasSks.create({ siakJenjangId, ipsMin, ipsMax, batasSks });
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