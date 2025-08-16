import models from "../models/index.js"
import { getPagination } from "../utils/pagination.js";
import { Op } from "sequelize";

const { Suku } = models;

export const findAll = async (page, size) => {
  try {
    if (page !== null && size !== null) {
      const { limit, offset } = getPagination(page, size);

      const { count, rows } = await Suku.findAndCountAll({
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
      const { count, rows } = await Suku.findAndCountAll({
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
    throw new Error(`Error retrieving data : ${error.message}`);
  }
};

export const createSuku = async (sukuData) => {
    const { nama } = sukuData;

    const cekDataSuku = await Suku.findOne({ 
      attributes: ['nama'],
      where: {
        nama: { [Op.iLike] : nama}
      }
    });
    if (cekDataSuku) {
        throw new Error(`Suku : ${nama} sudah ada.`);
    }

    try {
        await Suku.create({ nama });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            throw new Error(`Duplicate entry: ${err.errors.map(e => e.message).join(', ')}`);
        }
        throw new Error(`Error creating Agama : ${err.message}`);
    }
};

export const updateSuku = async (id, sukuData) => {
    const { nama } = sukuData;

    try {
        const cekDataSuku = await Suku.findByPk(id)
        if (!cekDataSuku) {
            throw new Error (`Suku tidak ditemukan`)
        }

        const [updatedRowsCount] = await Suku.update({
            nama: nama,
        }, {
            where: { id: id }
        });

        return updatedRowsCount > 0;
    }
    catch (error) {
        throw new Error(`Error updating suku : ${error.message}`);
    }
}

export const deleteSuku = async (id) => {
    try {
        const deletedRowsCount = await Suku.destroy({
            where: { id: id }
        });

        return deletedRowsCount > 0;
    }
    catch (error) {
        throw new Error(`Error deleting suku : ${error.message}`);
    }
}
