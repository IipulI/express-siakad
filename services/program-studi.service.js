import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";

const { ProgramStudi } = models;

export const findAll = async (page, size) => {
  const isPaginated = page !== null && size !== null
  const { limit, offset } = getPagination(page, size);

  const { count, rows } = await ProgramStudi.findAndCountAll({
    attributes: [
      "id",
      "siak_fakultas_id",
      "siak_jenjang_id",
      "nama",
      "kode",
    ],
    limit: isPaginated ? limit : undefined,
    offset: isPaginated ? offset : undefined,
    order: [["id", "DESC"]],
    raw: true,
  });

  return {
    count,
    rows,
    isPaginated,
  };
};

export const createRuangan = async (ruanganData) => {
  const { siakFakultasId, nama, ruangan, kapasitas, lantai } = ruanganData;

  const existingRuangan = await Ruangan.findOne({ where: { ruangan } });

  if (existingRuangan) {
    throw new Error(`Ruangan dengan nama "${ruangan}" sudah ada`);
  }

  try {
    await Ruangan.create({ siakFakultasId, nama, ruangan, kapasitas, lantai });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      throw new Error(
        `Duplicate entry: ${err.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw new Error(`Terjadi kesalahan saat membuat Ruangan: ${err.message}`);
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
    throw new Error(`Terjadi kesalahan saat memperbarui Ruangan: ${error.message}`);
  }
};

export const deleteRuangan = async (id) => {
  try {
    const deletedRowsCount = await Ruangan.destroy({
      where: { id: id },
    });

    return deletedRowsCount > 0;
  } catch (error) {
    throw new Error(`Terjadi kesalahan saat menghapus Ruangan: ${error.message}`);
  }
};
