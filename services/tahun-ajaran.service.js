import models from "../models/index.js"
import { getPagination } from "../utils/pagination.js";
import { formatTimestamp } from "../utils/date-formatter.js";
const { TahunAjaran } = models;

export const findAll = async (page, size) => {
    try {
        if (page !== null && size !== null) {
            const { limit, offset } = getPagination(page, size);

            const {count, rows} = await TahunAjaran.findAndCountAll({
                attributes: ['id', 'tahun', 'nama'],
                limit,
                offset,
                order: [
                    ['tahun', 'DESC']
                ],
                raw: true,
            });

            // const formattedRows = rows.map(record => ({
            //     ...record,
            //     createdAt: formatTimestamp(record.createdAt),
            // }));

            return {
                count,
                rows,
                isPaginated: true,
            }
        }
        else {
            const {count, rows}= await TahunAjaran.findAndCountAll({
                attributes: ['id', 'tahun', 'nama'],
                raw: true,
            })

            return {
                count : count,
                rows,
                isPaginated: false,
            }
        }


    }
    catch (error) {
        throw new Error(`Error retrieving data : ${error.message}`);
    }
}

export const createTahunAjaran = async (tahunAjaranData) => {
    const { tahun, nama } = tahunAjaranData;

    const existingTahunAjaran = await TahunAjaran.findOne({ attributes: ['tahun'], where: { tahun } });
    if (existingTahunAjaran) {
        throw new Error(`Tahun Ajaran with year "${tahun}" already exists.`);
    }

    try {
        await TahunAjaran.create({ tahun, nama });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            throw new Error(`Duplicate entry: ${err.errors.map(e => e.message).join(', ')}`);
        }
        throw new Error(`Error creating Tahun Ajaran: ${err.message}`);
    }
};

export const updateTahunAjaran = async (id, updateData) => {
    try {
        const tahunAjaran = await TahunAjaran.findByPk(id);

        if (!tahunAjaran) {
            return null;
        }

        const [updatedRowsCount] = await TahunAjaran.update(updateData, {
            where: { id: id }
        });

        return updatedRowsCount > 0;
    } catch (error) {
        throw new Error(`Error updating TahunAjaran: ${error.message}`);
    }
};

export const deleteTahunAjaran = async (id) => {
    try {
        const deletedRowsCount = await TahunAjaran.destroy({
            where: { id: id }
        });

        return deletedRowsCount > 0;
    } catch (error) {
        throw new Error(`Error deleting TahunAjaran: ${error.message}`);
    }
};