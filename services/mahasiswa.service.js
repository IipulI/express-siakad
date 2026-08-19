import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";
import { Op, QueryTypes } from "sequelize";
import slug from 'slug'
import bcrypt from 'bcrypt';

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
    StatusMahasiswa,
    User,
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

        // NOTE: hasilStudi include removed from here — fetched separately below
        // to avoid the Sequelize v6 bug where `separate: true` + `limit` on a
        // hasMany association drops the per-parent WHERE/LIMIT scoping.
        const mahasiswaQueryBuilder = {
            attributes: [
                'id', 'nama', 'npm', 'periodeMasuk', 'semester',
            ],
            where: mahasiswaWhere,
            order: [
                ["npm", "desc"]
            ],
            include: [
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
                },
                {
                    attributes: ['id', 'nama'],
                    model: StatusMahasiswa,
                    as: 'statusMahasiswa',
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

        // Fetch latest HasilStudi (by semester) per mahasiswa in one query,
        // applying rangeIpk filter here since it's no longer part of the include.
        const mahasiswaIds = rows.map(m => m.id);

        let latestByMahasiswa = {};
        if (mahasiswaIds.length > 0) {
            let ipkFilterSql = '';
            const replacements = { mahasiswaIds };

            if (filter.rangeIpk !== undefined) {
                const [minIpk, maxIpk] = filter.rangeIpk.split('-');
                ipkFilterSql = 'AND ipk BETWEEN :minIpk AND :maxIpk';
                replacements.minIpk = minIpk;
                replacements.maxIpk = maxIpk;
            }

            const latestHasilStudi = await sequelize.query(`
                SELECT DISTINCT ON (siak_mahasiswa_id)
                    siak_mahasiswa_id AS "siakMahasiswaId",
                    semester,
                    ipk
                FROM siak_hasil_studi
                WHERE siak_mahasiswa_id IN (:mahasiswaIds)
                ${ipkFilterSql}
                ORDER BY siak_mahasiswa_id, semester DESC
            `, {
                replacements,
                type: QueryTypes.SELECT,
            });

            latestByMahasiswa = Object.fromEntries(
                latestHasilStudi.map(hs => [hs.siakMahasiswaId, hs])
            );

            // const totalSksDiambil = await sequelize.query(`
            //     SELECT Distinct on (siak_mahasiswa_id)
            //         sum(sks_lulus) as totalSksLulus
            //     FROM siak_hasil_studi
            //     WHERE siak_mahasiswa_id IN (:mahasiswaIds)
            // `)
        }

        const formattedRows = rows.map(mahasiswa => {
            const plainMahasiswa = mahasiswa.get({ plain: true });

            plainMahasiswa.hasilStudi = latestByMahasiswa[plainMahasiswa.id] || null;

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

export const create = async (dataMahasiswa, dataKeluarga) => {
    try {
        // Validasi Logika: Cek apakah NIM sudah ada (Integritas Data)
        const existingMahasiswa = await Mahasiswa.findOne({
            where: { npm: dataMahasiswa.npm }
        });

        if (existingMahasiswa) {
            throw new Error('NPM sudah terdaftar dalam sistem.');
        }

        const parseValue = (value) => (value === "" || value == null) ? null : value;

        return await sequelize.transaction(async (trx) => {
            const mapMahasiswaPayload = {
                siakProgramStudiId: parseValue(dataMahasiswa?.siakProgramStudiId),
                nama: parseValue(dataMahasiswa?.nama),
                angkatan: parseValue(dataMahasiswa?.angkatan),
                kurikulum: parseValue(dataMahasiswa?.kurikulum),
                npm: parseValue(dataMahasiswa?.npm),
                periodeMasuk: parseValue(dataMahasiswa?.periodeMasuk),
                sistemKuliah: parseValue(dataMahasiswa?.sistemKuliah),
                kelas: parseValue(dataMahasiswa?.kelas),
                jenisPendaftaran: parseValue(dataMahasiswa?.jenisPendaftaran),
                jalurPendaftaran: parseValue(dataMahasiswa?.jalurPendaftaran),
                gelombang: parseValue(dataMahasiswa?.gelombang),
                jenisKelamin: parseValue(dataMahasiswa?.jenisKelamin),
                tempatLahir: parseValue(dataMahasiswa?.tempatLahir),
                tanggalLahir: parseValue(dataMahasiswa?.tanggalLahir),
                noKk: parseValue(dataMahasiswa?.noKk),
                nik: parseValue(dataMahasiswa?.nik),
                tanggalMasuk: parseValue(dataMahasiswa?.tanggalMasuk),
                kebutuhanKhusus: parseValue(dataMahasiswa?.kebutuhanKhusus),
                statusMahasiswa: parseValue(dataMahasiswa?.statusMahasiswa),
                alamatKtp: parseValue(dataMahasiswa?.alamatKtp),
                rtKtp: parseValue(dataMahasiswa?.rtKtp),
                rwKtp: parseValue(dataMahasiswa?.rwKtp),
                desaKtp: parseValue(dataMahasiswa?.desaKtp),
                provinsiKtp: parseValue(dataMahasiswa?.provinsiKtp?.label),
                kodePosKtp: parseValue(dataMahasiswa?.kodePosKtp),
                statusTinggalKtp: parseValue(dataMahasiswa?.statusTinggalKtp),
                alamatDomisili: parseValue(dataMahasiswa?.alamatDomisili),
                rtDomisili: parseValue(dataMahasiswa?.rtDomisili),
                rwDomisili: parseValue(dataMahasiswa?.rwDomisili),
                desaDomisili: parseValue(dataMahasiswa?.desaDomisili),
                provinsiDomisili: parseValue(dataMahasiswa?.provinsiDomisili?.label),
                kodePosDomisili: parseValue(dataMahasiswa?.kodePosDomisili),
                statusTinggalDomisili: parseValue(dataMahasiswa?.statusTinggalDomisili),
                noTelepon: parseValue(dataMahasiswa?.noTelepon),
                noHp: parseValue(dataMahasiswa?.noHp),
                emailPribadi: parseValue(dataMahasiswa?.emailPribadi),
                emailKampus: parseValue(dataMahasiswa?.emailKampus),
                noTerdaftar: parseValue(dataMahasiswa?.noTerdaftar),
                pendidikanAsal: parseValue(dataMahasiswa?.pendidikanAsal),
                provinsiSekolah: parseValue(dataMahasiswa?.provinsiSekolah?.label),
                kotaKabSekolah: parseValue(dataMahasiswa?.kotaKabSekolah),
                namaPendidikanAsal: parseValue(dataMahasiswa?.namaPendidikanAsal),
                alamatSekolah: parseValue(dataMahasiswa?.alamatSekolah),
                teleponSekolah: parseValue(dataMahasiswa?.teleponSekolah),
                noIjazahSekolah: parseValue(dataMahasiswa?.noIjazahSekolah),
                semester: parseValue(dataMahasiswa?.semester),
                dusunRt: parseValue(dataMahasiswa?.dusunRt),
                kotaRt: parseValue(dataMahasiswa?.kotaRt),
                kecamatanRt: parseValue(dataMahasiswa?.kecamatanRt),
                dusunDomisili: parseValue(dataMahasiswa?.dusunDomisili),
                kotaDomisili: parseValue(dataMahasiswa?.kotaDomisili),
                kecamatanDomisili: parseValue(dataMahasiswa?.kecamatanDomisili),
                agama: parseValue(dataMahasiswa?.agama),
                beratBadan: parseValue(dataMahasiswa?.beratBadan),
                tinggiBadan: parseValue(dataMahasiswa?.tinggiBadan),
                golonganDarah: parseValue(dataMahasiswa?.golonganDarah),
                transportasi: parseValue(dataMahasiswa?.transportasi),
                kewarganegaraan: parseValue(dataMahasiswa?.kewarganegaraan),
                paspor: parseValue(dataMahasiswa?.paspor),
                statusNikah: parseValue(dataMahasiswa?.statusNikah),
                ukuranJasAlmamater: parseValue(dataMahasiswa?.ukuranJasAlmamater),
                pekerjaan: parseValue(dataMahasiswa?.pekerjaan),
                instansiPekerjaan: parseValue(dataMahasiswa?.instansiPekerjaan),
                penghasilan: parseValue(dataMahasiswa?.penghasilan),
                noRekening: parseValue(dataMahasiswa?.noRekening),
                namaRekening: parseValue(dataMahasiswa?.namaRekening),
                namaBank: parseValue(dataMahasiswa?.namaBank),
                nisn: parseValue(dataMahasiswa?.nisn)
            };

            // const username = slug(dataMahasiswa.nama, '_')
            // const password = await bcrypt.hash(dataMahasiswa.noTelepon, 12)
            //
            // const user = await User.create({
            //     username: username,
            //     email: dataMahasiswa.emailPribadi,
            //     password: password,
            // }, {
            //     transaction: trx,
            // })
            //
            // dataMahasiswa.siakUserId = user.id;

            return await Mahasiswa.create(mapMahasiswaPayload, {
                transaction: trx
            })
        })
    }
    catch (error) {
        console.log(error);
        throw new Error(error.message);
    }
}

export const updateMahasiswa = async (mahasiswaId, dataMahasiswa) => {

}

export const deleteMahasiswa = async (mahasiswaId) => {

}