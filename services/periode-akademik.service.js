import {getPagination} from "../utils/pagination.js";
import PeriodeAkademikModels from "../models/periode-akademik.models.js";
import TahunAjaranModels from "../models/tahun-ajaran.models.js";


export const findAll = async (page, size) => {
    try {
        if (page !== null && size !== null) {
            const { limit, offset } = getPagination(page, size);

            const {count, rows} = await PeriodeAkademikModels.findAndCountAll({
                limit,
                offset,
                order: [['kode', 'DESC']],
                raw: true,
            });

            return {
                count,
                rows,
                isPaginated: true,
            }
        }
        else {
            const {count, rows}= await PeriodeAkademikModels.findAndCountAll({
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

export const createPeriodeAkademik = async (periodeAkademikData) => {
    const { siakTahunAjaranId, nama, kode, tanggalMulai, tanggalSelesai } = periodeAkademikData;

    const tahunAjaranExist = await TahunAjaranModels.findByPk(periodeAkademikData.siakTahunAjaranId);
    if (tahunAjaranExist == null) {
        throw new Error (`Tahun Ajaran tidak ditemukan`)
    }

    try {
        await PeriodeAkademikModels.create({
            siak_tahun_ajaran_id: siakTahunAjaranId,
            nama,
            kode,
            tanggal_mulai: tanggalMulai,
            tanggal_selesai: tanggalSelesai,
            status: "Inaktif"
        })
    }
    catch (error) {
        throw new Error(`Error creating periode akademik : ${error.message}`);
    }
}

export const updatePeriodeAkademik = async (id, updateData) => {
    const { nama, kode, tanggalMulai, tanggalSelesai, status } = updateData;

    try {
        const periodeAkademik = await PeriodeAkademikModels.findByPk(id);

        if (!periodeAkademik) {
            return null;
        }

        const [updatedRowsCount] = await PeriodeAkademikModels.update({
            nama: nama,
            kode: kode,
            tanggal_mulai: tanggalMulai,
            tanggal_selesai: tanggalSelesai,
            status: status
        }, {
            where: { id: id }
        });

        return updatedRowsCount > 0;
    } catch (error) {
        throw new Error(`Error updating periode akademik: ${error.message}`);
    }
};

export const deletePeriodeAkademik = async (id) => {
    try {
        const deletedRowsCount = await PeriodeAkademikModels.destroy({
            where: { id: id }
        });

        return deletedRowsCount > 0;
    } catch (error) {
        throw new Error(`Error deleting periode akademik: ${error.message}`);
    }
};
