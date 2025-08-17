import models from "../models/index.js"
import { Op } from "sequelize"
import { getPagination } from "../utils/pagination.js";

const { Agama } = models;

export const findAll = async (page, size) => {
  try {
    if (page !== null && size !== null) {
      const { limit, offset } = getPagination(page, size);

      const { count, rows } = await Agama.findAndCountAll({
        attributes: [
          "id",
          "nama"
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
      const { count, rows } = await Agama.findAndCountAll({
        attributes: [
          "id",
          "nama"
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

export const createAgama = async (agamaData) => {
    const { nama } = agamaData;

    const cekDataAgama = await Agama.findOne({ 
      attributes: ['nama'],
      where: {
        nama: { [Op.iLike] : nama}
      }
    });
    if (cekDataAgama) {
        throw new Error(`Agama : ${nama} sudah ada.`);
    }

    try {
        await Agama.create({ nama });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            throw new Error(`Data yang Anda masukkan sudah ada : ${err.errors.map(e => e.message).join(', ')}`);
        }
        throw new Error(`Gagal membuat data Agama : ${err.message}`);
    }
};

export const updateAgama = async (id, agamaData) => {
    const { nama } = agamaData;

    try {
        const cekDataAgama = await Agama.findByPk(id)
        if (!cekDataAgama) {
            throw new Error (`Agama tidak ditemukan`)
        }

        const [updatedRowsCount] = await Agama.update({
            nama: nama,
        }, {
            where: { id: id }
        });

        return updatedRowsCount > 0;
    }
    catch (error) {
        throw new Error(`Gagal memperbarui data agama : ${error.message}`);
    }
}

export const deleteAgama = async (id) => {
    try {
        const deletedRowsCount = await Agama.destroy({
            where: { id: id }
        });

        return deletedRowsCount > 0;
    }
    catch (error) {
        throw new Error(`Gagal menghapus data agama : ${error.message}`);
    }
}