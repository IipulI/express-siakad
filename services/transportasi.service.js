import models from '../models/index.js';
import { Op } from "sequelize";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";
import { getPagination } from "../utils/pagination.js";

const { Transportasi } = models;

export const findAll = async (page, size, search) => {
    const isPaginated = page !== null && size !== null;
    const queryBuilder = {
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
        },
        order: [['id', 'DESC']],
    }

    if (isPaginated) {
        const { limit, offset } = getPagination(page, size);
        queryBuilder.limit = limit;
        queryBuilder.offset = offset;

        const { count, rows } = await Transportasi.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true,
        }
    } else {
        const data = await Transportasi.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        }
    }
}

export const findOneById = async (id) => {
    const existDataTransportasi = await Transportasi.findByPk(id, {
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
        }
    })
    if (!existDataTransportasi) {
        throw new NotFoundError(`Transportasi tidak dapat ditemukan`)
    }

    return existDataTransportasi;
}

export const createTransportasi = async (data) => {
    const { kode } = data;

    const existingDataTransportasi = await Transportasi.findOne({
        where: {
            kode: { [Op.iLike] : kode }
        }
    })
    if (existingDataTransportasi) {
        throw new ConflictError(`Transportasi : ${kode} sudah ada.`);
    }

    return await Transportasi.create(data);
}

export const updateTransportasi = async (id, data) => {
    const { kode } = data;

    const existDataTransportasi = await Transportasi.findByPk(id)
    if (!existDataTransportasi) {
        throw new NotFoundError(`Transportasi tidak dapat ditemukan`)
    }

    const existingDataTransportasi = await Transportasi.findOne({
        where: {
            kode: { [Op.iLike] : kode }
        }
    })
    if (existingDataTransportasi && existingDataTransportasi.id !== id) {
        throw new ConflictError(`Transportasi : ${kode} sudah ada.`);
    }

    return existDataTransportasi.update(data)
}

export const deleteTransportasi = async(id) => {
    const existDataTransportasi = await Transportasi.findByPk(id)
    if (!existDataTransportasi) {
        throw new NotFoundError(`Transportasi tidak dapat ditemukan`)
    }

    await existDataTransportasi.destroy()
}