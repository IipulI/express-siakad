import TahunKurikulum from "../models/tahun-kurikulum.models.js";
import {getPagination} from "../utils/pagination.js";
import PeriodeAkademik from "../models/periode-akademik.models.js";


export const findAll = async (page, size) => {
    try {
        if (page !== null && size !== null) {
            const { limit, offset } = getPagination(page, size)

            const { count, rows } = await TahunKurikulum.findAndCountAll({
                attributes: ['id', 'siakPeriodeAkademikId', 'tahun', 'keterangan', 'tanggalMulai', 'tanggalSelesai'],
                limit,
                offset,
                order: [
                    ['id', 'DESC']
                ],
                raw: true
            })

            return {
                count,
                rows,
                isPaginated: true,
            }
        }
        else {
            const { count, rows } = await TahunKurikulum.findAndCountAll({
                attributes: ['id', 'siakPeriodeAkademikId', 'tahun', 'keterangan', 'tanggalMulai', 'tanggalSelesai'],
                raw: true,
            })

            return {
                count,
                rows,
                isPaginated: false
            }
        }
    }
    catch (error) {
        throw new Error(`Error retrieving data : ${error.message}`);
    }
}

export const createTahunKurikulum = async (tahunKurikulumData) => {
    const existingPeriodeAkademik = await PeriodeAkademik.findByPk(tahunKurikulumData.siakPeriodeAkademikId)
    if (!existingPeriodeAkademik) {
        throw new Error (`Periode Akademik tidak ditemukan`)
    }

    try {
        await TahunKurikulum.create({
            siak_periode_akademik_id: tahunKurikulumData.siakPeriodeAkademikId,
            tahun: tahunKurikulumData.tahun,
            kode: tahunKurikulumData.kode,
            tanggal_mulai: tahunKurikulumData.tanggalMulai,
            tanggal_selesai: tahunKurikulumData.tanggalSelesai,
        })
    }
    catch (error) {
        throw new Error(`Error retrieving data : ${error.message}`);
    }
}

export const updateTahunKurikulum = async (id, tahunKurikulumData) => {
    const { siakPeriodeAkademikId, tahun, nama, keterangan, tanggalMulai, tanggalSelesai } = tahunKurikulumData;

    try {
        const existingTahunKurikulum = await TahunKurikulum.findByPk(id)
        if (!existingTahunKurikulum) {
            throw new Error (`Periode Akademik tidak ditemukan`)
        }

        const periodeAkademik = await PeriodeAkademik.findByPk(siakPeriodeAkademikId)
        if (!periodeAkademik) {
            throw new Error (`Periode Akademik tidak ditemukan`)
        }

        const [updatedRowsCount] = await TahunKurikulum.update({
            siak_periode_akademik_id: siakPeriodeAkademikId,
            tahun: tahun,
            nama: nama,
            keterangan: keterangan,
            tanggal_mulai: tanggalMulai,
            tanggal_selesai: tanggalSelesai,
        }, {
            where: { id: id }
        });

        return updatedRowsCount > 0;
    }
    catch (error) {
        throw new Error(`Error updating tahun kurikulum : ${error.message}`);
    }
}

export const deleteTahunKurikulum = async (id) => {
    try {
        const deletedRowsCount = await TahunKurikulum.destroy({
            where: { id: id }
        });

        return deletedRowsCount > 0;
    }
    catch (error) {
        throw new Error(`Error deleting tahun kurikulum : ${error.message}`);
    }
}