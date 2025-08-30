import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";

const { Pengumuman } = models;

export const findAll = async (page, size) => {
  try {
    if (page !== null && size !== null) {
      const { limit, offset } = getPagination(page, size);

      const { count, rows } = await Pengumuman.findAndCountAll({
        attributes: [
          "id",
          "siakPegawaiId",
          "judul",
          "isi",
          "isActive",
          "isPriority",
          "banner",
        ],
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
      const { count, rows } = await Pengumuman.findAndCountAll({
        attributes: [
          "id",
          "siakPegawaiId",
          "judul",
          "isi",
          "isActive",
          "isPriority",
          "banner",
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
    console.log(error);
    throw new Error(`Error retrieving data : ${error.message}`);
  }
};

export const createPengumuman = async (pengumumanData) => {
  const { siakPegawaiId, judul, isi, isActive, isPriority, banner } =
    pengumumanData;

  //   const existingPengumuman = await Pengumuman.findOne({ where: { ruangan } });

  //   if (existingRuangan) {
  //     throw new Error(`Ruangan with name "${ruangan}" already exists.`);
  //   }

  try {
    await Pengumuman.create({
      siakPegawaiId,
      judul,
      isi,
      isActive,
      isPriority,
      banner,
    });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      throw new Error(
        `Duplicate entry: ${err.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw new Error(`Error creating Pengumuman: ${err.message}`);
  }
};

export const updatePengumuman = async (id, updateData) => {
  try {
    const pengumuman = await Pengumuman.findByPk(id);

    if (!pengumuman) {
      return null;
    }

    const [updatedRowsCount] = await Pengumuman.update(updateData, {
      where: { id: id },
    });

    return updatedRowsCount > 0;
  } catch (error) {
    throw new Error(`Error updating Pengumuman: ${error.message}`);
  }
};

export const deletePengumuman = async (id) => {
  try {
    const deletedRowsCount = await Pengumuman.destroy({
      where: { id: id },
    });

    return deletedRowsCount > 0;
  } catch (error) {
    throw new Error(`Error deleting Pengumuman: ${error.message}`);
  }
};
