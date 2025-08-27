import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";

const { JalurPendaftaran } = models;

export const findAll = async (page, size) => {
  try {
    if (page !== null && size !== null) {
      const { limit, offset } = getPagination(page, size);

      const { count, rows } = await JalurPendaftaran.findAndCountAll({
        attributes: [
          "id",
          "nama",
        ],
        limit,
        offset,
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
      const { count, rows } = await JalurPendaftaran.findAndCountAll({
        attributes: [
          "id",
          "nama",
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
    console.log(error)
    throw new Error(`Gagal mengambil data : ${error.message}`);
  }
};

export const createJalurPendaftaran = async (jalurPendaftaranData) => {
  const { nama } = jalurPendaftaranData;

  const existingJalurPendaftaran = await JalurPendaftaran.findOne({
    where: { nama },
  });

  if (existingJalurPendaftaran) {
    throw new Error(`Jalur Pendaftaran dengan nama "${nama}" sudah ada`);
  }

  try {
    await JalurPendaftaran.create({ nama });
  }
  catch (err) {
      console.log(err)
    if (err.name === "SequelizeUniqueConstraintError") {
      throw new Error(
        `Duplicate entry: ${err.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw new Error(`Terjadi kesalahan saat membuat Jalur Pendaftaran : ${err.message}`);
  }
};