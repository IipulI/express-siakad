import TahunAjaran from "../models/tahun.ajaran.js";
import {getPagination} from "../utils/pagination.js";
import {formatTimestamp} from "../utils/date-formatter.js";

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
  } catch (error) {
    throw new Error(`Error retrieving data : ${error.message}`);
  }
};

export const createTahunAjaran = async (tahunAjaranData) => {
<<<<<<< HEAD
  const { tahun, nama } = tahunAjaranData;

  const existingTahunAjaran = await TahunAjaranModels.findOne({
    where: { nama },
  });
  if (existingTahunAjaran) {
    throw new Error(`Tahun Ajaran with name "${nama}" already exists.`);
  }

  try {
    await TahunAjaranModels.create({ tahun, nama });
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
      throw new Error(
        `Duplicate entry: ${err.errors.map((e) => e.message).join(", ")}`
      );
=======
    const { tahun, nama } = tahunAjaranData;

    const existingTahunAjaran = await TahunAjaran.findOne({ where: { nama } });
    if (existingTahunAjaran) {
        throw new Error(`Tahun Ajaran with name "${nama}" already exists.`);
    }

    try {
        await TahunAjaran.create({ tahun, nama });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            throw new Error(`Duplicate entry: ${err.errors.map(e => e.message).join(', ')}`);
        }
        throw new Error(`Error creating Tahun Ajaran: ${err.message}`);
>>>>>>> e1ce24a9856051c00d930ff25ae3ab239ffb6542
    }
    throw new Error(`Error creating Tahun Ajaran: ${err.message}`);
  }
};

export const updateTahunAjaran = async (id, updateData) => {
<<<<<<< HEAD
  try {
    const tahunAjaran = await TahunAjaranModels.findByPk(id);
=======
    try {
        const tahunAjaran = await TahunAjaran.findByPk(id);
>>>>>>> e1ce24a9856051c00d930ff25ae3ab239ffb6542

    if (!tahunAjaran) {
      return null;
    }

<<<<<<< HEAD
    const [updatedRowsCount] = await TahunAjaranModels.update(updateData, {
      where: { id: id },
    });
=======
        const [updatedRowsCount] = await TahunAjaran.update(updateData, {
            where: { id: id }
        });
>>>>>>> e1ce24a9856051c00d930ff25ae3ab239ffb6542

    return updatedRowsCount > 0;
  } catch (error) {
    throw new Error(`Error updating TahunAjaran: ${error.message}`);
  }
};

export const deleteTahunAjaran = async (id) => {
<<<<<<< HEAD
  try {
    const deletedRowsCount = await TahunAjaranModels.destroy({
      where: { id: id },
    });

    return deletedRowsCount > 0;
  } catch (error) {
    throw new Error(`Error deleting TahunAjaran: ${error.message}`);
  }
};
=======
    try {
        const deletedRowsCount = await TahunAjaran.destroy({
            where: { id: id }
        });

        return deletedRowsCount > 0;
    } catch (error) {
        throw new Error(`Error deleting TahunAjaran: ${error.message}`);
    }
};
>>>>>>> e1ce24a9856051c00d930ff25ae3ab239ffb6542
