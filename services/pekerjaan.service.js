import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";

const { Pekerjaan } = models;

export const findAll = async (page, size) => {
  try {
    if (page !== null && size !== null) {
      const { limit, offset } = getPagination(page, size);

      const { count, rows } = await Pekerjaan.findAndCountAll({
        attributes: ["id", "nama"],
        limit,
        offset,
        order: [["id", "DESC"]],
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
      const { count, rows } = await Pekerjaan.findAndCountAll({
        attributes: ["id", "nama"],

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
    throw new Error(`Gagal mengambil data: ${error.message}`);
  }
};

export const createPekerjaan = async (pekerjaanData) => {
  const { nama } = pekerjaanData;

  const existingPekerjaan = await Pekerjaan.findOne({ where: { nama } });

  if (existingPekerjaan) {
    throw new Error(`Ruangan dengan nama "${nama}" sudah ada`);
  }

  try {
    await Pekerjaan.create({
      nama,
    });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      throw new Error(
        `Duplicate entry: ${err.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw new Error(`Gagal membuat data Pekerjaan: ${err.message}`);
  }
};

export const updatePekerjaan = async (id, updateData) => {
  try {
    const pekerjaan = await Pekerjaan.findByPk(id);

    if (!pekerjaan) {
      return null;
    }

    const [updatedRowsCount] = await Pekerjaan.update(updateData, {
      where: { id: id },
    });

    return updatedRowsCount > 0;
  } catch (error) {
    throw new Error(`Gagal memperbarui data Pekerjaan: ${error.message}`);
  }
};

export const deletePekerjaan = async (id) => {
  try {
    const deletedRowsCount = await Pekerjaan.destroy({
      where: { id: id },
    });

    return deletedRowsCount > 0;
  } catch (error) {
    throw new Error(`Gagal menghapus data Pekerjaan: ${error.message}`);
  }
};
