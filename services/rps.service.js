import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";

const { Rps, MataKuliah } = models;

export const findAll = async (page, size) => {
  try {
    if (page !== null && size !== null) {
      const { limit, offset } = getPagination(page, size);

      const { count, rows } = await Rps.findAndCountAll({
        attributes: [
          "id",
          "siakMataKuliahId",
          "tanggalPenyusunan",
          "deskripsiMataKuliah",
          "tujuanMataKuliah",
          "materiPembelajaran",
          "pustakaUtama",
          "pustakaPendukung",
          "dokumenRps",
        ],
        limit,
        offset,
        order: [["tanggalPenyusunan", "DESC"]],
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
      const { count, rows } = await Rps.findAndCountAll({
        attributes: [
          "id",
          "siakMataKuliahId",
          "tanggalPenyusunan",
          "deskripsiMataKuliah",
          "tujuanMataKuliah",
          "materiPembelajaran",
          "pustakaUtama",
          "pustakaPendukung",
          "dokumenRps",
        ],
        include: {
          model: MataKuliah,
          as: "mataKuliah",
          attributes: ["nama", "kode", "totalSks"],
        },
        // raw: true,
      });

      return {
        count: count,
        rows,
        isPaginated: false,
      };
    }
  } catch (error) {
    console.log(error);
    throw new Error(`Error retrieving data : ${error.message}`);
  }
};

export const createRps = async (rpsData, file) => {
  const {
    id,
    siakMataKuliahId,
    tanggalPenyusunan,
    deskripsiMataKuliah,
    tujuanMataKuliah,
    materiPembelajaran,
    pustakaUtama,
    pustakaPendukung,
  } = rpsData;

  const filePath = file ? file.path : null;

  try {
    await Rps.create({
      id,
      siakMataKuliahId,
      tanggalPenyusunan,
      deskripsiMataKuliah,
      tujuanMataKuliah,
      materiPembelajaran,
      pustakaUtama,
      pustakaPendukung,
      dokumenRps: filePath,
    });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      throw new Error(
        `Duplicate entry: ${err.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw new Error(`Error creating RPS: ${err.message}`);
  }
};

export const updateRps = async (id, updateData) => {
  try {
    const rps = await Rps.findByPk(id);

    if (!rps) {
      return null;
    }

    const [updatedRowsCount] = await Rps.update(updateData, {
      where: { id: id },
    });

    return updatedRowsCount > 0;
  } catch (error) {
    throw new Error(`Error updating Rps: ${error.message}`);
  }
};

export const deleteRps = async (id) => {
  try {
    const deletedRowsCount = await Rps.destroy({
      where: { id: id },
    });

    return deletedRowsCount > 0;
  } catch (error) {
    throw new Error(`Error deleting Rps: ${error.message}`);
  }
};
