import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";

const { ProgramStudi } = models;

export const findAll = async (page, size) => {
  try {
    if (page !== null && size !== null) {
      const { limit, offset } = getPagination(page, size);

      const { count, rows } = await ProgramStudi.findAndCountAll({
        attributes: [
          "id",
          "siak_fakultas_id",
          "siak_jenjang_id",
          "nama",
          "kode",
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
      const { count, rows } = await ProgramStudi.findAndCountAll({
        attributes: [
          "id",
          "siak_fakultas_id",
          "siak_jenjang_id",
          "nama",
          "kode",
        ],
        include: [
          { model: Fakultas, as: "fakultas", attributes: ["id", "nama"] },
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
    throw new Error(`Error retrieving data : ${error.message}`);
  }
};

export const createRuangan = async (ruanganData) => {
  const { siakFakultasId, nama, ruangan, kapasitas, lantai } = ruanganData;

  const existingRuangan = await Ruangan.findOne({ where: { ruangan } });

  if (existingRuangan) {
    throw new Error(`Ruangan with name "${ruangan}" already exists.`);
  }

  try {
    await Ruangan.create({ siakFakultasId, nama, ruangan, kapasitas, lantai });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      throw new Error(
        `Duplicate entry: ${err.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw new Error(`Error creating Ruangan: ${err.message}`);
  }
};

export const updateRuangan = async (id, updateData) => {
  try {
    const ruangan = await Ruangan.findByPk(id);

    if (!ruangan) {
      return null;
    }

    const [updatedRowsCount] = await Ruangan.update(updateData, {
      where: { id: id },
    });

    return updatedRowsCount > 0;
  } catch (error) {
    throw new Error(`Error updating Ruangan: ${error.message}`);
  }
};

export const deleteRuangan = async (id) => {
  try {
    const deletedRowsCount = await Ruangan.destroy({
      where: { id: id },
    });

    return deletedRowsCount > 0;
  } catch (error) {
    throw new Error(`Error deleting Ruangan: ${error.message}`);
  }
};
