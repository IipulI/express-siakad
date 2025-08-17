import { getPagination } from "../utils/pagination.js";
import models from "../models/index.js";
const { Fakultas, Ruangan } = models;

export const findAll = async (page, size) => {
  try {
    if (page !== null && size !== null) {
      const { limit, offset } = getPagination(page, size);

      const { count, rows } = await Fakultas.findAndCountAll({
        attributes: ["id", "nama"],
        limit,
        offset,
        order: [["ruangan", "DESC"]],
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
      const { count, rows } = await Ruangan.findAndCountAll({
        attributes: [
          "id",
          "siak_fakultas_id",
          "nama",
          "ruangan",
          "kapasitas",
          "lantai",
        ],
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

export const createFakultas = async (fakultasData) => {
  const { nama } = fakultasData;

  const existingFakultas = await Fakultas.findOne({ where: { nama } });

  if (existingRuangan) {
    throw new Error(`Fakultas with name "${ruangan}" already exists.`);
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
