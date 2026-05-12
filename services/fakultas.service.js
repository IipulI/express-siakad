import { getPagination } from "../utils/pagination.js";
import models from "../models/index.js";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";
const { Fakultas, Ruangan } = models;

export const findAll = async (page, size) => {
    const isPaginated = page !== null && size !== null

    const queryBuilder = {
        attributes: ['id', 'nama'],
        order: [['id', 'DESC']]
    }

    if (isPaginated) {
        const { limit, offset } = getPagination(page, size);
        queryBuilder.limit = limit;
        queryBuilder.offset = offset;

        const { count, rows } = await Fakultas.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true,
        }
    } else {
        const data = await Fakultas.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        }
    }
};

export const findOneById = async (id) => {
    const data = await Fakultas.findByPk(id, {
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
        }
    })

    if (!data) {
        throw new NotFoundError(`Fakultas tidak dapat ditemukan`)
    }

    return data
}

export const createFakultas = async (fakultasData) => {
    const dataFakultasExist = await Fakultas.findOne({
        where: {
            nama: fakultasData.nama
        }
    })

    if (dataFakultasExist) {
        throw new ConflictError(`Fakultas : ${fakultasData.nama} sudah ada.`);
    }

    return await Fakultas.create(fakultasData);
};

export const updateFakultas = async (id, fakultasData) => {
    const dataFakultasExist = await Fakultas.findByPk(id)

    if (!dataFakultasExist) {
        throw new NotFoundError(`Fakultas tidak dapat ditemukan`)
    }

    const existingNamaFakultas = await Fakultas.findOne({
        where: {
            nama: fakultasData.nama
        }
    })

    if (existingNamaFakultas && existingNamaFakultas.id !== id) {
        throw new ConflictError(`Fakultas : ${fakultasData.nama} sudah ada.`);
    }

    return dataFakultasExist.update(fakultasData)
}

export const deleteFakultas = async(id) => {
    const dataFakultasExist = await Fakultas.findByPk(id)

    if (!dataFakultasExist) {
        throw new NotFoundError(`Fakultas tidak dapat ditemukan`)
    }

    await dataFakultasExist.destroy()
}