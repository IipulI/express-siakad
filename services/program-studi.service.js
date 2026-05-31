import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";
import { Op } from "sequelize";

const { ProgramStudi } = models;

export const findAll = async(page, size, search) => {
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

        const { count, rows } = await ProgramStudi.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true,
        }
    } else {
        const data = await ProgramStudi.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        }
    }
}

export const findOneById = async(id) => {
    const existDataProdi = await ProgramStudi.findByPk(id)

    if (!existDataProdi) {
        throw new NotFoundError(`Program Studi tidak dapat ditemukan`)
    }

    return existDataProdi
}

export const createProgramStudi = async (programStudiData) => {
    const existingDataProdi = await ProgramStudi.findOne({
        where: {
            [Op.or]: [
                { nama: programStudiData.nama },
                { kode: programStudiData.kode }
            ]
        }
    })

    if (existingDataProdi) {
        throw new ConflictError(`Program Studi : ${programStudiData.nama}, atau kode : ${programStudiData.kode} sudah ada.`);
    }

    return await ProgramStudi.create(programStudiData);
}

export const updateProgramStudi = async (id, programStudiData) => {
    const existDataProdi = await ProgramStudi.findByPk(id)

    if (!existDataProdi) {
        throw new NotFoundError(`Program Studi tidak dapat ditemukan`)
    }

    const existingDataProdiNameKode = await ProgramStudi.findOne({
        where: {
            [Op.or] : [
                { nama: programStudiData.nama },
                { kode: programStudiData.kode }
            ]
        }
    })
    if (existingDataProdiNameKode && existingDataProdiNameKode.id !== id) {
        throw new ConflictError(`Program Studi : ${programStudiData.nama}, atau kode : ${programStudiData.kode} sudah ada.`);
    }

    return existDataProdi.update(programStudiData)
}

export const deleteProgramStudi = async(id) => {
    const existDataProdi = await ProgramStudi.findByPk(id)

    if (!existDataProdi) {
        throw new NotFoundError(`Program Studi tidak dapat ditemukan`)
    }

    await existDataProdi.destroy()
}