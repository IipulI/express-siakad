import models from '../models/index.js'
import { Op } from 'sequelize'
import { getPagination } from '../utils/pagination.js'
import { ConflictError, NotFoundError } from "../utils/custom-error.js";

const { JenisTinggal } = models;

export const findAll = async (page, size) => {
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

        const { count, rows } = await JenisTinggal.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true,
        }
    } else {
        const data = await JenisTinggal.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        }
    }
}

export const findOneById = async (id) => {
    const cekDataJenisTinggal = await JenisTinggal.findByPk(id)
    if (!cekDataJenisTinggal) {
        throw new NotFoundError(`Jenis Tinggal tidak dapat ditemukan`)
    }

    return cekDataJenisTinggal;
}

export const createJenisTinggal = async (data) => {
    const { kode } = data;

    const cekDataJenisTinggal = await JenisTinggal.findOne({
        where: {
            kode: { [Op.iLike] : kode }
        }
    })
    if (cekDataJenisTinggal) {
        throw new ConflictError(`Jenis Tinggal : ${kode} sudah ada.`);
    }

    return await JenisTinggal.create(data);
}

export const updateJenisTinggal = async (id, data) => {
    const { kode } = data;

    const cekDataJenisTinggal = await JenisTinggal.findByPk(id)
    if (!cekDataJenisTinggal) {
        throw new NotFoundError(`Jenis Tinggal tidak dapat ditemukan`)
    }

    const existDataJenisTinggal = await JenisTinggal.findOne({
        where: {
            kode: { [Op.iLike] : kode }
        }
    })
    if (existDataJenisTinggal && existDataJenisTinggal.id !== id) {
        throw new ConflictError(`Jenis Tinggal : ${kode} sudah ada.`);
    }

    return cekDataJenisTinggal.update(data)
}

export const deleteJenisTinggal = async (id) => {
    const cekDataJenisTinggal = await JenisTinggal.findByPk(id)

    if (!cekDataJenisTinggal) {
        throw new NotFoundError(`Jenis Tinggal tidak dapat ditemukan`)
    }

    await cekDataJenisTinggal.destroy()
}