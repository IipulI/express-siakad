import models from "../models/index.js";
import { getPagination } from "../utils/pagination.js";
import { Op, QueryTypes } from "sequelize";
import slug from 'slug'
import bcrypt from 'bcrypt';
import { ConflictError, NotFoundError, UnprocessableEntityError } from "../utils/custom-error.js";

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
        throw error;
    }
}

// Field mahasiswa sebagaimana dipakai FE (CreateStudentData/StudentDetail) yang
// namanya berbeda dari atribut model Sequelize. Key = nama field FE, value =
// nama atribut di Mahasiswa model. Field yang tidak terdaftar di sini punya
// nama yang sama persis di FE maupun di model.
const MAHASISWA_FIELD_TO_MODEL = {
    desaKtp: 'kelurahanKtp',
    dusunRt: 'dusunKtp',
    kotaRt: 'kabupatenKtp',
    kecamatanRt: 'kecamatanKtp',
    alamatDomisili: 'alamat',
    rtDomisili: 'rt',
    rwDomisili: 'rw',
    desaDomisili: 'kelurahan',
    provinsiDomisili: 'provinsi',
    kodePosDomisili: 'kodePos',
    statusTinggalDomisili: 'statusTinggal',
    dusunDomisili: 'dusun',
    kotaDomisili: 'kabupaten',
    kecamatanDomisili: 'kecamatan',
    provinsiSekolah: 'provinsiPendidikanAsal',
    kotaKabSekolah: 'kotaKabPendidikanAsal',
    alamatSekolah: 'alamatPendidikanAsal',
    teleponSekolah: 'teleponPendidikanAsal',
    noIjazahSekolah: 'noIjazah',
    // Field ini di FE masih berupa dropdown string bebas, tapi di DB sudah
    // punya kolom relasi FK ke master data - FE dropdown-nya sudah diarahkan
    // untuk mengirim id master data tsb di key yang sama.
    kurikulum: 'siakTahunKurikulumId',
    sistemKuliah: 'siakSistemKuliahId',
    jalurPendaftaran: 'siakJalurPendaftaranId',
    pendidikanAsal: 'siakPendidikanTerakhirId',
    agama: 'siakAgamaId',
    transportasi: 'siakTransportasiId',
};

const MAHASISWA_MODEL_TO_FIELD = Object.fromEntries(
    Object.entries(MAHASISWA_FIELD_TO_MODEL).map(([feField, modelField]) => [modelField, feField])
);

// Seluruh field mahasiswa (di luar data keluarga & di luar statusMahasiswa,
// yang ditangani terpisah) yang dikirim dari form FE dan punya kolom di DB.
//
// Field berikut sengaja TIDAK disimpan karena belum ada kolom/master data yang
// menaunginya di production (siak_mahasiswa): kelas, jenisPendaftaran (tidak
// ada model/endpoint master data), tanggalMasuk, noHp, noTerdaftar,
// statusTinggalKtp. Field-field ini tetap ada di form FE tapi tidak akan
// tersimpan sampai ada keputusan desain (kolom baru atau FK ke master data).
const MAHASISWA_FIELDS = [
    'siakProgramStudiId', 'nama', 'angkatan', 'kurikulum', 'npm', 'periodeMasuk',
    'sistemKuliah', 'jalurPendaftaran', 'gelombang',
    'jenisKelamin', 'tempatLahir', 'tanggalLahir', 'noKk', 'nik',
    'kebutuhanKhusus', 'alamatKtp', 'rtKtp', 'rwKtp', 'desaKtp',
    'provinsiKtp', 'kodePosKtp', 'alamatDomisili', 'rtDomisili',
    'rwDomisili', 'desaDomisili', 'provinsiDomisili', 'kodePosDomisili',
    'statusTinggalDomisili', 'noTelepon', 'emailPribadi', 'emailKampus',
    'pendidikanAsal', 'provinsiSekolah', 'kotaKabSekolah',
    'namaPendidikanAsal', 'alamatSekolah', 'teleponSekolah', 'noIjazahSekolah',
    'semester', 'dusunRt', 'kotaRt', 'kecamatanRt', 'dusunDomisili', 'kotaDomisili',
    'kecamatanDomisili', 'agama', 'beratBadan', 'tinggiBadan', 'golonganDarah',
    'transportasi', 'kewarganegaraan', 'paspor', 'statusNikah', 'ukuranJasAlmamater',
    'pekerjaan', 'instansiPekerjaan', 'penghasilan', 'noRekening', 'namaRekening',
    'namaBank', 'nisn',
];

const toModelAttribute = (feField) => MAHASISWA_FIELD_TO_MODEL[feField] ?? feField;

// SelectInput di FE kadang mengirim seluruh option { value, label } alih-alih
// value-nya saja. Jaga-jaga di sisi backend supaya tidak ikut tersimpan sebagai
// "[object Object]" walau ada bug serupa di FE di kemudian hari.
const unwrapSelectValue = (value) =>
    (value && typeof value === 'object' && !Array.isArray(value) && 'value' in value)
        ? value.value
        : value;

export const findOne = async (mahasiswaId) => {
    try {
        const mahasiswa = await Mahasiswa.findByPk(mahasiswaId, {
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'deletedAt'],
            },
            include: [
                {
                    model: StatusMahasiswa,
                    as: 'statusMahasiswa',
                    attributes: ['id', 'nama'],
                }
            ],
        });
        if (!mahasiswa) {
            throw new NotFoundError(`Mahasiswa dengan id ${mahasiswaId} tidak dapat ditemukan`);
        }

        const plainMahasiswa = mahasiswa.get({ plain: true });
        const result = {};
        for (const [key, value] of Object.entries(plainMahasiswa)) {
            if (key === 'statusMahasiswa') continue;
            result[MAHASISWA_MODEL_TO_FIELD[key] ?? key] = value;
        }
        // FE hanya menampilkan label status mahasiswa sebagai teks, bukan dropdown.
        result.statusMahasiswa = plainMahasiswa.statusMahasiswa?.nama ?? null;
        return result;
    }
    catch (error) {
        console.log(error);
        throw error;
    }
}

export const create = async (dataMahasiswa, dataKeluarga) => {
    try {
        // Validasi Logika: Cek apakah NIM sudah ada (Integritas Data)
        const existingMahasiswa = await Mahasiswa.findOne({
            where: { npm: dataMahasiswa.npm }
        });

        if (existingMahasiswa) {
            throw new ConflictError('NPM sudah terdaftar dalam sistem.');
        }

        const parseValue = (value) => (value === "" || value == null) ? null : value;

        // FE belum punya selector status mahasiswa (statis "Aktif" untuk mahasiswa
        // baru), jadi status default diambil dari master data di sini.
        const statusAktif = await StatusMahasiswa.findOne({
            where: { nama: { [Op.iLike]: 'aktif' } }
        });

        return await sequelize.transaction(async (trx) => {
            const mapMahasiswaPayload = {};
            for (const field of MAHASISWA_FIELDS) {
                mapMahasiswaPayload[toModelAttribute(field)] =
                    parseValue(unwrapSelectValue(dataMahasiswa?.[field]));
            }
            mapMahasiswaPayload.siakStatusMahasiswaId = statusAktif?.id ?? null;

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
        throw error;
    }
}

export const updateMahasiswa = async (mahasiswaId, dataMahasiswa) => {
    try {
        const existMahasiswa = await Mahasiswa.findByPk(mahasiswaId);
        if (!existMahasiswa) {
            throw new NotFoundError(`Mahasiswa dengan id ${mahasiswaId} tidak dapat ditemukan`);
        }

        if (dataMahasiswa?.npm !== undefined && dataMahasiswa.npm !== existMahasiswa.npm) {
            const existingNpm = await Mahasiswa.findOne({
                where: { npm: dataMahasiswa.npm, id: { [Op.ne]: mahasiswaId } }
            });
            if (existingNpm) {
                throw new ConflictError('NPM sudah terdaftar dalam sistem.');
            }
        }

        const parseValue = (value) => (value === "" ? null : value);

        const updatePayload = {};
        for (const field of MAHASISWA_FIELDS) {
            if (dataMahasiswa?.[field] === undefined) continue;
            updatePayload[toModelAttribute(field)] = parseValue(unwrapSelectValue(dataMahasiswa[field]));
        }

        return await existMahasiswa.update(updatePayload);
    }
    catch (error) {
        console.log(error);
        throw error;
    }
}

export const deleteMahasiswa = async (mahasiswaId) => {
    try {
        const existMahasiswa = await Mahasiswa.findByPk(mahasiswaId);
        if (!existMahasiswa) {
            throw new NotFoundError(`Mahasiswa dengan id ${mahasiswaId} tidak dapat ditemukan`);
        }

        const krsCount = await KrsMahasiswa.count({
            where: { siakMahasiswaId: mahasiswaId }
        });
        if (krsCount > 0) {
            throw new ConflictError(`Mahasiswa tidak dapat dihapus karena sudah memiliki ${krsCount} riwayat KRS`);
        }

        await existMahasiswa.destroy();
    }
    catch (error) {
        console.log(error);
        throw error;
    }
}