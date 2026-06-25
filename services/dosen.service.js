import db from "../models/index.js"
import { Op } from "sequelize";
import { getPagination } from "../utils/pagination.js";

const {
    Dosen
} = db

export const fetchAllDosen = async (page, size, filter) => {
    const isPaginated = page !== null && size !== null;
    const queryBuilder = {
        attributes: ['id', 'nama', 'nidn'],
        order: [['id', 'DESC']]
    }

    if (filter?.search) {
        queryBuilder.where = {
            [Op.or]: [
                { nama: { [Op.iLike]: `%${filter.search}%` } },
                { nidn: { [Op.iLike]: `%${filter.search}%` } }
            ]
        };
    }

    if (isPaginated) {
        const { limit, offset } = getPagination(page, size);
        queryBuilder.limit = limit;
        queryBuilder.offset = offset;

        const { count, rows } = await Dosen.findAndCountAll(queryBuilder)

        return {
            count,
            rows,
            isPaginated: true
        }
    }
    else {
        const data = await Dosen.findAll(queryBuilder)

        return {
            count: data.length,
            rows: data,
            isPaginated: false
        }
    }
}