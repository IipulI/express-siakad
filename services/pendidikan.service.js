import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";

const { Pendidikan } = models;

export const findAll = async (page, size) => {
  try {
    if (page !== null && size !== null) {
      const { limit, offset } = getPagination(page, size);

      const { count, rows } = await Pendidikan.findAndCountAll({
        attributes: ["id", "nama", "jenjang"],
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
      const { count, rows } = await Pendidikan.findAndCountAll({
        attributes: ["id", "nama", "jenjang"],

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

export const createPendidikan = async (pendidikanData) => {
  const { nama, jenjang } = pendidikanData;

  const existingPendidikan = await Pendidikan.findOne({ where: { nama } });

  if (existingPendidikan) {
    throw new Error(`Ruangan with name "${nama}" already exists.`);
  }

  try {
    await Pendidikan.create({ nama, jenjang });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      throw new Error(
        `Duplicate entry: ${err.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw new Error(`Error creating Pendidikan: ${err.message}`);
  }
};

export const updatePendidikan = async (id, updateData) => {
  try {
    const pendidikan = await Pendidikan.findByPk(id);

    if (!pendidikan) {
      return null;
    }

    const [updatedRowsCount] = await Pendidikan.update(updateData, {
      where: { id: id },
    });

    return updatedRowsCount > 0;
  } catch (error) {
    throw new Error(`Error updating Pendidikan: ${error.message}`);
  }
};

export const deletePendidikan = async (id) => {
  try {
    const deletedRowsCount = await Pendidikan.destroy({
      where: { id: id },
    });

    return deletedRowsCount > 0;
  } catch (error) {
    throw new Error(`Error deleting Pendidikan: ${error.message}`);
  }
};
