import models from "../models/index.js"
import { Op } from "sequelize"
import { getPagination } from "../utils/pagination.js";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";

const { Agama } = models;

export const findAll = async (page, size) => {
    const isPaginated = page !== null && size !== null;

    const queryBuilder = {
        attributes: ['id', 'nama'],
        order: [['id', 'DESC']]
    }

    if (isPaginated) {
        const { limit, offset } = getPagination(page, size);
        queryBuilder.limit = limit;
        queryBuilder.offset = offset;

        const { count, rows } = await Agama.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true,
        }
    }
    else {
        const data = await Agama.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        }
    }
};

export const findOneById = async (id) => {
    const cekDataAgama = await Agama.findByPk(id, {
        attributes: ['id', 'nama'],
    })

    if (!cekDataAgama) {
        throw new NotFoundError(`Agama tidak ditemukan`)
    }

    return cekDataAgama
}

export const createAgama = async (agamaData) => {
    const { nama } = agamaData;

    const cekDataAgama = await Agama.findOne({
      attributes: ['nama'],
      where: {
        nama: { [Op.iLike] : nama }
      }
    });
    if (cekDataAgama) {
        throw new ConflictError(`Agama : ${nama} sudah ada.`);
    }

    return await Agama.create({ nama });
};

export const updateAgama = async (id, agamaData) => {
    const { nama } = agamaData;

    const cekDataAgama = await Agama.findByPk(id)
    if (!cekDataAgama) {
        throw new NotFoundError(`Agama tidak ditemukan`)
    }

    const existingNameAgama = await Agama.findOne({
        where: {
            nama: { [Op.iLike] : nama }
        }
    })
    if (existingNameAgama && existingNameAgama.id !== id) {
        throw new ConflictError(`Agama : ${nama} sudah ada.`);
    }

    return cekDataAgama.update({ nama })
}

export const deleteAgama = async (id) => {
    const cekDataAgama = await Agama.findByPk(id)

    if (!cekDataAgama) {
        throw new NotFoundError(`Agama tidak ditemukan`)
    }

    await cekDataAgama.destroy()
}