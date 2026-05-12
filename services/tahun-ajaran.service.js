import models from "../models/index.js"
import { getPagination } from "../utils/pagination.js";
import { formatTimestamp } from "../utils/date-formatter.js";
import { Op } from "sequelize";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";
const { TahunAjaran } = models;

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

        const { count, rows } = await TahunAjaran.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true,
        }
    } else {
        const data = await TahunAjaran.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        }
    }
}

export const findOneById = async(id) => {
    const existDataTahunAjaran = await TahunAjaran.findByPk(id)
    if (!existDataTahunAjaran) {
        throw new NotFoundError(`Tahun Ajaran tidak dapat ditemukan`)
    }

    return existDataTahunAjaran
}

export const createTahunAjaran = async (tahunAjaranData) => {
    const existingDataTahunAjaran = await TahunAjaran.findOne({
        where: {
            [Op.or] : [
                { tahun: tahunAjaranData.tahun },
                { nama: tahunAjaranData.nama }
            ]
        }
    })

    if (existingDataTahunAjaran) {
        throw new ConflictError(`Tahun Ajaran : ${tahunAjaranData.nama}, atau tahun : ${tahunAjaranData.tahun} sudah ada.`);
    }

    return await TahunAjaran.create(tahunAjaranData);
}

export const updateTahunAjaran = async(id, tahunAjaranData) => {
    const existDataTahunAjaran = await TahunAjaran.findByPk(id)
    if (!existDataTahunAjaran) {
        throw new NotFoundError(`Tahun Ajaran tidak dapat ditemukan`)
    }

    const existingDataTahunAjaran = await TahunAjaran.findOne({
        where: {
            [Op.or] : [
                { tahun: tahunAjaranData.tahun },
                { nama: tahunAjaranData.nama }
            ]
        }
    })

    if (existingDataTahunAjaran && existingDataTahunAjaran.id !== id) {
        throw new ConflictError(`Tahun Ajaran : ${tahunAjaranData.nama}, atau tahun : ${tahunAjaranData.tahun} sudah ada.`);
    }

    return existDataTahunAjaran.update(tahunAjaranData)
}

export const deleteTahunAjaran = async(id) => {
    const existDataTahunAjaran = await TahunAjaran.findByPk(id)
    if (!existDataTahunAjaran) {
        throw new NotFoundError(`Tahun Ajaran tidak dapat ditemukan`)
    }

    await existDataTahunAjaran.destroy()
}