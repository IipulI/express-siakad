import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";

const { KebutuhanKhusus } = models;

export const findAll = async (page, size) => {
  try {
    if (page !== null && size !== null) {
      const { limit, offset } = getPagination(page, size);

      const { count, rows } = await KebutuhanKhusus.findAndCountAll({
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
      const { count, rows } = await KebutuhanKhusus.findAndCountAll({
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
    throw new Error(`Error retrieving data : ${error.message}`);
  }
};

export const createKebutuhanKhusus = async (ruanganData) => {
  const { nama } = kebutuhanKhususData;

  const existingKebutuhanKhusus = await KebutuhanKhusus.findOne({
    where: { nama },
  });

  if (existingKebutuhanKhusus) {
    throw new Error(`Kebutuhan Khusus with name "${nama}" already exists.`);
  }

  try {
    await KebutuhanKhusus.create({ nama });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      throw new Error(
        `Duplicate entry: ${err.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw new Error(`Error creating Kebutuhan Khusus: ${err.message}`);
  }
};

export const updateKebutuhanKhusus = async (id, updateData) => {
  try {
    const kebutuhanKhusus = await KebutuhanKhusus.findByPk(id);

    if (!kebutuhanKhusus) {
      return null;
    }

    const [updatedRowsCount] = await KebutuhanKhusus.update(updateData, {
      where: { id: id },
    });

    return updatedRowsCount > 0;
  } catch (error) {
    throw new Error(`Error updating Kebutuhan Khusus: ${error.message}`);
  }
};

export const deleteKebutuhanKhusus = async (id) => {
  try {
    const deletedRowsCount = await KebutuhanKhusus.destroy({
      where: { id: id },
    });

    return deletedRowsCount > 0;
  } catch (error) {
    throw new Error(`Error deleting Kebutuhan Khusus: ${error.message}`);
  }
};
