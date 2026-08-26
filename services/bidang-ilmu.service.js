import models from '../models/index.js';
import { getPagination } from "../utils/pagination.js";
import { ConflictError, NotFoundError } from "../utils/custom-error.js";

const {
    sequelize,
    BidangIlmu
} = models;

export const findAll = async (page, size) => {
    const isPaginated = page !== null && size !== null;

    const queryBuilder = {
        attributes: ['id', 'kode', 'nama'],
        order: [['id', 'DESC']],
    }

    if (isPaginated) {
        const { limit, offset } = getPagination(page, size);

        queryBuilder.limit = limit;
        queryBuilder.offset = offset;

        const { count, rows } = await BidangIlmu.findAndCountAll(queryBuilder);

        return {
            count,
            rows,
            isPaginated: true
        }
    } else {
        const data = await BidangIlmu.findAll(queryBuilder);

        return {
            count: data.length,
            rows: data,
            isPaginated: false
        }
    }
}

export const findOneById = async (id) => {
    const cekDataBidangIlmu = await BidangIlmu.findByPk(id, {
        attributes: ['id', 'kode', 'nama'],
    })

    if (!cekDataBidangIlmu) {
        throw new NotFoundError(`Bidang Ilmu tidak ditemukan`)
    }

    return cekDataBidangIlmu
}

export const createBidangIlmu = async (data) => {
    return await sequelize.transaction(async (trx) => {
        const existingBidangIlmu = await BidangIlmu.findOne({
            where: {
                nama: data.nama,
            },
            transaction: trx
        })
        if (existingBidangIlmu) {
            throw new ConflictError(`Bidang Ilmu dengan nama ${data.nama} sudah ada`);
        }

        return await BidangIlmu.create({
            kode: data.kode,
            nama: data.nama,
        }, {
            transaction: trx
        })
    })
}

export const updateBidangIlmu = async (id, data) => {
    return await sequelize.transaction(async (trx) => {
        const bidangIlmu = await BidangIlmu.findByPk(id, {
            transaction: trx
        })
        if (!bidangIlmu) {
            throw new NotFoundError(`Bidang Ilmu tidak ditemukan`)
        }

        if (data.nama) {
            const existingBidangIlmu = await BidangIlmu.findOne({
                where: { nama: data.nama },
                transaction: trx
            })
            if (existingBidangIlmu && existingBidangIlmu.id !== id) {
                throw new ConflictError(`Bidang Ilmu dengan nama ${data.nama} sudah ada`);
            }
        }

        await bidangIlmu.update(data, { transaction: trx })

        return true
    })
}

export const deleteBidangIlmu = async (id) => {
    return await sequelize.transaction(async (trx) => {
        const bidangIlmu = await BidangIlmu.findByPk(id, { transaction: trx })

        if (!bidangIlmu) {
            throw new NotFoundError(`Bidang Ilmu tidak ditemukan`)
        }

        await bidangIlmu.destroy({ transaction: trx })

        return true
    })
}
