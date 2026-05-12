import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";
const  { TahunKurikulum, PeriodeAkademik } = models;

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

        const { count, rows } = await TahunKurikulum.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true,
        }
    } else {
        const data = await TahunKurikulum.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false,
        }
    }
}

export const findOneById = async(id) => {
    const existDataTahunKurikulum = await TahunKurikulum.findByPk(id)

    if (!existDataTahunKurikulum) {
        throw new NotFoundError(`Tahun Kurikulum tidak dapat ditemukan`)
    }

    return existDataTahunKurikulum
}

export const createTahunKurikulum = async(tahunKurikulumData) => {
    const existingDataTahunKurikulum = await TahunKurikulum.findOne({
        where: {
            tahun : tahunKurikulumData.tahun
        }
    })
    if (existingDataTahunKurikulum) {
        throw new ConflictError(`Tahun Kurikulum : ${tahunKurikulumData.tahun} sudah ada.`);
    }

    return await TahunKurikulum.create(tahunKurikulumData);
}

export const updateTahunKurikulum = async(id, tahunKurikulumData) => {
    const existDataTahunKurikulum = await TahunKurikulum.findByPk(id)
    if (!existDataTahunKurikulum) {
        throw new NotFoundError(`Tahun Kurikulum tidak dapat ditemukan`)
    }

    const existingDataTahunKurikulum = await TahunKurikulum.findOne({
        where: {
            tahun : tahunKurikulumData.tahun
        }
    })
    if (existingDataTahunKurikulum && existingDataTahunKurikulum.id !== id) {
        throw new ConflictError(`Tahun Kurikulum : ${tahunKurikulumData.tahun} sudah ada.`);
    }

    return existDataTahunKurikulum.update(tahunKurikulumData)
}

export const deleteTahunKurikulum = async(id) => {
    const existDataTahunKurikulum = await TahunKurikulum.findByPk(id)
    if (!existDataTahunKurikulum) {
        throw new NotFoundError(`Tahun Kurikulum tidak dapat ditemukan`)
    }

    await existDataTahunKurikulum.destroy()
}