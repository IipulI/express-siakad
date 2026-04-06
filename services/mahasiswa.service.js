import models from "../models/index.js";
import {getPagination} from "../utils/pagination.js";
import {Op} from "sequelize";

const {
    sequelize,
    Fakultas,
    HasilStudi,
    Jenjang,
    KrsMahasiswa,
    KelasKuliah,
    Mahasiswa,
    MataKuliah,
    PeriodeAkademik,
    ProgramStudi,
    RincianKrsMahasiswa,
    Ruangan,
} = models;


export const findAll = async (filter, page, size) => {
    try {
        let rangeIpkWhere = {}
        let mahasiswaWhere = {};
        if (filter.search !== undefined) {
            const searchPattern = `%${filter.search}%`
            mahasiswaWhere[Op.or] = [
                { nama : { [Op.iLike]: searchPattern } },
                { npm : { [Op.iLike] : searchPattern } },
            ]
        }
        if(filter.siakProgramStudiId !== undefined) {
            mahasiswaWhere.siakProgramStudiId = filter.siakProgramStudiId;
        }
        if(filter.angkatan !== undefined) {
            mahasiswaWhere.angkatan = filter.angkatan;
        }
        if(filter.siakStatusMahasiswaId !== undefined) {
            mahasiswaWhere.siakStatusMahasiswaId = filter.siakStatusMahasiswaId;
        }
        if(filter.siakSistemKuliahId !== undefined) {
            mahasiswaWhere.siakSistemKuliahId = filter.siakSistemKuliahId
        }
        if(filter.siakJenisPendaftaranId !== undefined) {
            mahasiswaWhere.siakJenisPendaftaranId = filter.siakJenisPendaftaranId;
        }
        // if (filter.siakJalurPendaftaranId !== undefined) {
        //     mahasiswaWhere.siakJalurPendaftaranId = filter.siakJalurPendaftaranId;
        // }
        // if(filter.siakGelombangId !== undefined) {
        //     mahasiswaWhere.siakGelombangId = filter.siakGelombangId;
        // }
        // if(filter.siakTahunKurikulumId !== undefined) {
        //     mahasiswaWhere.siakTahunKurikulumId = filter.siakTahunKurikulumId;
        // }
        if (filter.rangeIpk !== undefined) {
            const rangeSplitted = filter.rangeIpk.split('-')

            rangeIpkWhere.ipk = {
                [Op.gte]: rangeSplitted[0],
                [Op.lte]: rangeSplitted[1],
            }
        }
        if (filter.jenisKelamin !== undefined) {
            mahasiswaWhere.jenisKelamin = filter.jenisKelamin;
        }
        if(filter.periodeMasuk !== undefined){
            const periode = await PeriodeAkademik.findByPk(filter.periodeMasuk, {
                attributes: ['kode'],
            })

            mahasiswaWhere.periodeMasuk = periode.kode
        }
        if(filter.periodeKeluar !== undefined) {
            const periode = await PeriodeAkademik.findByPk(filter.periodeKeluar, {
                attributes: ['kode'],
            })

            mahasiswaWhere.periodeKeluar = periode.kode
        }

        const mahasiswaQueryBuilder = {
            attributes: [
                'id', 'nama', 'npm', 'periodeMasuk'
            ],
            where: mahasiswaWhere,
            order: [
                ["id", "DESC"]
            ],
            include: [
                {
                    attributes: [ 'semester', 'ipk'],
                    model: HasilStudi,
                    as: "hasilStudi",
                    where: rangeIpkWhere,
                    limit: 1,
                    order: [ ["semester", "DESC"] ],
                    separate: true,
                },
                {
                    attributes: [ 'id', 'siakJenjangId', 'kode', 'nama' ],
                    model: ProgramStudi,
                    as: "programStudi",
                    include: {
                        attributes: ['nama', 'jenjang'],
                        model: Jenjang,
                        as: "jenjang",
                    }
                },
                {
                    // attributes: [ 'id', 'siakMahasiswaId' ],
                    model: KrsMahasiswa,
                    as: "krsMahasiswa",
                    separate: true,
                    include: {
                        attributes: ["id", "siakKrsMahasiswaId", "siakKelasKuliahId"],
                        model: RincianKrsMahasiswa,
                        as : "rincianKrsMahasiswa",
                        include: {
                            attributes: ["id", "siakMataKuliahId"],
                            model: KelasKuliah,
                            as: 'kelasKuliah',
                            include: {
                                attributes: ["id", "totalSks"],
                                model: MataKuliah,
                                as: "mataKuliah",
                            }
                        }
                    }
                }
            ],
        }

        let isPaginated = false;
        if (page !== null && size !== null) {
            const { limit, offset } = getPagination(page, size);
            mahasiswaQueryBuilder.limit = limit;
            mahasiswaQueryBuilder.offset = offset;
            isPaginated = true;
        }

        const { count, rows } = await Mahasiswa.findAndCountAll(mahasiswaQueryBuilder);

        const formattedRows = rows.map(mahasiswa => {
            const plainMahasiswa = mahasiswa.get({ plain: true });

            plainMahasiswa.totalSksDiambil = plainMahasiswa.krsMahasiswa.reduce((totalSum, krs) => {

                const semesterSks = krs.rincianKrsMahasiswa.reduce((semesterSum, rincian) => {
                    const sks = rincian.kelasKuliah?.mataKuliah?.totalSks || 0;
                    return semesterSum + sks;
                }, 0);

                return totalSum + semesterSks;
            }, 0);

            delete plainMahasiswa.krsMahasiswa;

            return plainMahasiswa;
        });

        return {
            count,
            rows: formattedRows,
            isPaginated,
        };
    }
    catch (error) {
        console.log(error);
        throw new Error(error.message);
    }
}

export const findOne = async (mahasiswaId) => {
    try {
        const existMahasiswa = await Mahasiswa.findByPk(mahasiswaId, {
            attributes: ['id']
        })
        if (!existMahasiswa) {
            throw new Error(`Mahasiswa dengan id ${mahasiswaId} tidak dapat ditemukan`);
        }

        return await Mahasiswa.findByPk(mahasiswaId, {
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'deletedAt'],
            }
        });
    }
    catch (error) {
        console.log(error);
        throw new Error(error.message);
    }
}

export const create = async (dataMahasiswa) => {
    try {
        await sequelize.transaction(async (trx) => {

        })
    }
    catch (error) {
        console.log(error);
        throw new Error(error.message);
    }
}