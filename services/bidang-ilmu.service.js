import models from '../models/index.js';
import {getPagination} from "../utils/pagination.js";

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
            rows: data.rows,
            isPaginated: false
        }
    }
}

export const findOneById = async (id) => {
    const cekDataBidangIlmu = await BidangIlmu.findOne(id);
}

export const createBidangIlmu = async (data) => {
    try {
        sequelize.transaction(async (trx) => {
            const existingJenisMk = await BidangIlmu.findOne({
                where : {
                    nama: data.nama,
                },
                transaction: trx
            })
            if (existingJenisMk) {
                throw new Error(`Bidang Ilmu dengan nama ${data.nama} sudah ada`);
            }

            await BidangIlmu.create({
                kode: data.kode,
                nama: data.nama,
            }, {
                transaction: trx
            })
        })

        return true
    }
    catch (error) {
        throw new Error(error.message);
    }
}

export const updateBidangIlmu = async (id, data) => {
    try {
        const updatedData = sequelize.transaction(async (trx) => {
            const JenisMk = await BidangIlmu.findByPk(id, {
                transaction: trx
            })
            if (!JenisMk) {
                return null
            }

            const [updatedRowsCount] = await BidangIlmu.update(data, {
                where: { id: id },
                transaction: trx
            })

            return updatedRowsCount
        })

        return updatedData > 0
    }
    catch (error) {
        throw new Error(error.message);
    }
}

export const deleteBidangIlmu = async (id) => {
    try {
        const deletedData = sequelize.transaction(async (trx) => {
            return await BidangIlmu.destroy({
                where: {id: id},
                transaction: trx
            })
        })

        return deletedData > 0;
    }
    catch (error) {
        throw new Error(error.message);
    }
}