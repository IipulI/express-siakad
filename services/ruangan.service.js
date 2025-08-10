import * as models from "../models/index.js"
import { getPagination } from "../utils/pagination.js";

const { FakultasModels, Ruangan } = models;

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
        include: [{ model: FakultasModels, attributes: ["id", "nama"] }],
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
