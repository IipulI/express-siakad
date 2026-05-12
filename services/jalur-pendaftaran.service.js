import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";

const { JalurPendaftaran } = models;

export const findAll = async (page, size, search) => {
    const isPaginated = page !== null && size !== null
    const queryBuilder = {
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
        },
        order: [['id', 'DESC']]
    }

    if (isPaginated) {
        const { limit, offset } = getPagination(page, size);
        queryBuilder.limit = limit;
        queryBuilder.offset = offset;

        const { count, rows } = await JalurPendaftaran.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true,
        }
    } else {
        const data = await JalurPendaftaran.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        }
    }
}

export const findOneById = async(id) => {
    const existJalurPendaftaran = await JalurPendaftaran.findByPk(id)
    if (!existJalurPendaftaran) {
        throw new NotFoundError(`Jalur Pendaftaran tidak dapat ditemukan`)
    }

    return existJalurPendaftaran
}

export const createJalurPendaftaran = async (jalurPendaftaranData) => {
    const existingDataJalurPendaftaran = await JalurPendaftaran.findOne({
        where: {
            nama: jalurPendaftaranData.nama
        }
    })

    if (existingDataJalurPendaftaran) {
        throw new ConflictError(`Jalur Pendaftaran : ${jalurPendaftaranData.nama} sudah ada.`);
    }

    return await JalurPendaftaran.create(jalurPendaftaranData);
}

export const updateJalurPendaftaran = async(id, jalurPendaftaranData) => {
    const existDataJalurPendaftaran = await JalurPendaftaran.findByPk(id)
    if (!existDataJalurPendaftaran) {
        throw new NotFoundError(`Jalur Pendaftaran tidak dapat ditemukan`)
    }

    const existingDataJalurPendaftaran = await JalurPendaftaran.findOne({
        where: {
            nama: jalurPendaftaranData.nama
        }
    })
    if (existingDataJalurPendaftaran && existingDataJalurPendaftaran.id !== id) {
        throw new ConflictError(`Jalur Pendaftaran : ${jalurPendaftaranData.nama} sudah ada.`);
    }

    return existDataJalurPendaftaran.update(jalurPendaftaranData)
}

export const deleteJalurPendaftaran = async(id) => {
    const existDataJalurPendaftaran = await JalurPendaftaran.findByPk(id)
    if (!existDataJalurPendaftaran) {
        throw new NotFoundError(`Jalur Pendaftaran tidak dapat ditemukan`)
    }

    await existDataJalurPendaftaran.destroy()
}