import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";

const { Jenjang } = models;

export const findAll = async (page, size) => {
  try {
    if (page !== null && size !== null) {
      const { limit, offset } = getPagination(page, size);

      const { count, rows } = await Jenjang.findAndCountAll({
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
      const { count, rows } = await Jenjang.findAndCountAll({
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
    throw new Error(`Error retrieving data : ${error.message}`);
  }
};

export const createJenjang = async (jenjangData) => {
  const { nama, jenjang } = jenjangData;

  const existingJenjang = await Jenjang.findOne({ where: { jenjang } });

  if (existingJenjang) {
    throw new Error(`Jenjang with name "${jenjang}" already exists.`);
  }

  try {
    await Jenjang.create({ nama, jenjang });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      throw new Error(
        `Duplicate entry: ${err.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw new Error(`Error creating Jenjang: ${err.message}`);
  }
};

export const updateJenjang = async (id, updateData) => {
  try {
    const jenjang = await Jenjang.findByPk(id);

    if (!jenjang) {
      return null;
    }

    const [updatedRowsCount] = await Jenjang.update(updateData, {
      where: { id: id },
    });

    return updatedRowsCount > 0;
  } catch (error) {
    throw new Error(`Error updating Jenjang: ${error.message}`);
  }
};

export const deleteJenjang = async (id) => {
  try {
    const deletedRowsCount = await Jenjang.destroy({
      where: { id: id },
    });

    return deletedRowsCount > 0;
  } catch (error) {
    throw new Error(`Error deleting Jenjang: ${error.message}`);
  }
};
