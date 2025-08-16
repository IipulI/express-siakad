import models from "../models/index.js"
import { getPagination } from "../utils/pagination.js";

const { Ruangan, Fakultas } = models;

export const findAll = async (page, size) => {
  try {
    if (page !== null && size !== null) {
      const { limit, offset } = getPagination(page, size);

      const { count, rows } = await Ruangan.findAndCountAll({
        attributes: [
          "id",
          "siak_fakultas_id",
          "nama",
          "ruangan",
          "kapasitas",
          "lantai",
        ],
        limit,
        offset,
        order: [["ruangan", "DESC"]],
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
      const { count, rows } = await Ruangan.findAndCountAll({
        attributes: [
          "id",
          "siak_fakultas_id",
          "nama",
          "ruangan",
          "kapasitas",
          "lantai",
        ],
        include: [{ model: Fakultas, as: 'fakultas', attributes: ["id", "nama"] }],
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
