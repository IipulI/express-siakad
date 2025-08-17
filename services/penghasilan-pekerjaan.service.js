import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";

const { PenghasilanPekerjaan } = models;

export const findAll = async (page, size) => {
  try {
    if (page !== null && size !== null) {
      const { limit, offset } = getPagination(page, size);

      const { count, rows } = await PenghasilanPekerjaan.findAndCountAll({
        attributes: ["id", "range"],
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
      const { count, rows } = await PenghasilanPekerjaan.findAndCountAll({
        attributes: ["id", "range"],
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

export const createPenghasilanPekerjaan = async (penghasilanPekerjaanData) => {
  const { range } = penghasilanPekerjaanData;

  const existingPenghasilanPekerjaan = await PenghasilanPekerjaan.findOne({
    where: { range },
  });

  if (existingPenghasilanPekerjaan) {
    throw new Error(
      `Penghasilan Pekerjaan with range "${range}" already exists.`
    );
  }

  try {
    await PenghasilanPekerjaan.create({
      range,
    });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      throw new Error(
        `Duplicate entry: ${err.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw new Error(`Error creating Penghasilan Pekerjaan: ${err.message}`);
  }
};

export const updatePenghasilanPekerjaan = async (id, updateData) => {
  try {
    const penghasilanPekerjaan = await PenghasilanPekerjaan.findByPk(id);

    if (!penghasilanPekerjaan) {
      return null;
    }

    const [updatedRowsCount] = await PenghasilanPekerjaan.update(updateData, {
      where: { id: id },
    });

    return updatedRowsCount > 0;
  } catch (error) {
    throw new Error(`Error updating Penghasilan Pekerjaan: ${error.message}`);
  }
};

export const deletePenghasilanPekerjaan = async (id) => {
  try {
    const deletedRowsCount = await PenghasilanPekerjaan.destroy({
      where: { id: id },
    });

    return deletedRowsCount > 0;
  } catch (error) {
    throw new Error(`Error deleting Penghasilan Pekerjaan: ${error.message}`);
  }
};
