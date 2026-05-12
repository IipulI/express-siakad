import {getPagination} from "../utils/pagination.js";
import models from "../models/index.js"
import { QueryTypes, Op } from "sequelize";
import ResponseBuilder from "../utils/response.js";
import { NotFoundError } from "../utils/custom-error.js";

const {
    BidangIlmu,
    Dosen,
    JadwalKuliah,
    Jenjang,
    KelasKuliah,
    KomposisiNilaiMataKuliah,
    KrsMahasiswa,
    Mahasiswa,
    MataKuliah,
    PeriodeAkademik,
    ProgramStudi,
    RincianKrsMahasiswa,
    Ruangan,
    SkalaPenilaian,
    UnsurNilai,
    sequelize,
} = models;

export const test = async () => {
    const test = await BidangIlmu.findByPk("1120cbc9-415d-499e-bf74-9ff4ab5ed331", {
        attributes: ['id']
    })

    await test.destroy()
}

export const findAll = async (page, size, filter) => {
    let kelasKuliahWhere = {}
    let mataKuliahWhere = {}
    let dosenWhere = {}

    if (filter.siakPeriodeAkademikId !== undefined) {
        kelasKuliahWhere.siakPeriodeAkademikId = filter.siakPeriodeAkademikId
    }
    if (filter.siakProgramStudiId !== undefined) {
        kelasKuliahWhere.siakProgramStudiId = filter.siakProgramStudiId
    }
    // if (filter.siakSistemKuliahId !== undefined) {
    //     kelasKuliahWhere.siakSistemKuliahId = filter.siakSistemKuliahId
    // }
    if (filter.siakTahunKurikulumId !== undefined) {
        mataKuliahWhere.siakTahunKurikulumId = filter.siakTahunKurikulumId
    }
    if (filter.siakDosenId !== undefined) {
        dosenWhere.id = filter.siakDosenId
    }

    let kelasKuliahQueryBuilder = {
        attributes: [
            'id', 'siakMataKuliahId', 'siakPeriodeAkademikId', 'siakProgramStudiId',
            'nama', 'kapasitas', 'jumlah_peminat', 'sistem_kuliah', 'status_kelas'
        ],
        where: kelasKuliahWhere,
        include: [
            {
                attributes: [
                    'id', 'nama', 'kode', 'totalSks'
                ],
                where: mataKuliahWhere,
                model: MataKuliah,
                as: 'mataKuliah',
            },
            {
                attributes: [
                    'id', 'nama',
                ],
                model: PeriodeAkademik,
                as: 'periodeAkademik'
            },
            {
                attributes: [
                    'id', 'hari', 'jamMulai', 'jamSelesai', 'jenisPertemuan', 'metodePembelajaran'
                ],
                model: JadwalKuliah,
                as: 'jadwalKuliah',
                separate: true,
                include: [
                    {
                        attributes: [
                            'id', 'nama', 'nidn'
                        ],
                        model: Dosen,
                        as: 'dosen'
                    },
                    {
                        attributes: [
                            'id', 'nama', 'ruangan'
                        ],
                        model: Ruangan,
                        as: 'ruangan'
                    }
                ]
            }
        ]
    }

    const isPaginated = page !== null && size !== null;
    if (isPaginated) {
        const { limit, offset } = getPagination(page, size);
        kelasKuliahQueryBuilder.limit = limit;
        kelasKuliahQueryBuilder.offset = offset;

        const { count, rows } = await KelasKuliah.findAndCountAll(kelasKuliahQueryBuilder)

        return {
            count,
            rows,
            isPaginated: true
        }
    } else{
        const data = await KelasKuliah.findAll(kelasKuliahQueryBuilder)

        return {
            count: data.length,
            rows: data,
            isPaginated: false
        }
    }
}

export const detailClass = async (id) => {
    const dataClass = await KelasKuliah.findByPk(id, {
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt']
        },
        include: [
            {
                attributes: [
                    'id', 'nama'
                ],
                model: ProgramStudi,
                as: 'programStudi',
            },
            {
                attributes: [
                    'id', 'nama', 'kode', 'totalSks'
                ],
                model: MataKuliah,
                as: 'mataKuliah',
            },
            {
                attributes: [
                    'id', 'nama',
                ],
                model: PeriodeAkademik,
                as: 'periodeAkademik'
            },
            {
                attributes: [
                    'id', 'hari', 'jamMulai', 'jamSelesai', 'jenisPertemuan', 'metodePembelajaran'
                ],
                model: JadwalKuliah,
                as: 'jadwalKuliah',
                separate: true
            }
        ]
    })
    if (!dataClass) {
        throw new NotFoundError(`Kelas Kuliah tidak dapat ditemukan`)
    }

    return dataClass
}

export const classSchedule = async(id) => {
    const existClass = await KelasKuliah.findByPk(id)
    if (!existClass) {
        throw new NotFoundError(`Kelas Kuliah tidak ditemukan`)
    }

    return await JadwalKuliah.findAll({
        attributes: {
            exclude: ['createdAt', 'updatedAt', 'deletedAt', 'siak_dosen_id', 'siak_kelas_kuliah_id', 'siak_ruangan_id']
        },
        where: {
            siakKelasKuliahId: id
        },
        include: [
            {
                attributes: [
                    'id', 'nama', 'nidn'
                ],
                model: Dosen,
                as: 'dosen'
            },
            {
                attributes: [
                    'id', 'nama', 'ruangan'
                ],
                model: Ruangan,
                as: 'ruangan'
            }
        ]
    });
}

export const classParticipant = async(id) => {
    const existClass = await KelasKuliah.findByPk(id, {attributes: ['id']})
    if (!existClass) {
        throw new NotFoundError(`Kelas Kuliah tidak ditemukan`)
    }

    return await Mahasiswa.findAll({
        attributes: ['id', 'nama', 'npm', 'angkatan'],
        include : [
            {
                attributes: ['id','nama'],
                model: ProgramStudi,
                as: 'programStudi',
                include: {
                    attributes: ['jenjang'],
                    model: Jenjang,
                    as: 'jenjang'
                }
            },
            {
                attributes: ['status'],
                required: true,
                model: KrsMahasiswa,
                as: 'krsMahasiswa',
                include: {
                    attributes: [],
                    required: true,
                    model: RincianKrsMahasiswa,
                    as: 'rincianKrsMahasiswa',
                    where: {
                        siak_kelas_kuliah_id: id
                    }
                }
            }
        ]
    })
}

export const enrollMahasiswaToClass = async(mahasiswaId, kelasKuliahId, periodeAkademikId) => {
    const GET_SKS_SUMMARY_SQL = `
        WITH LatestHasilStudi AS (
          SELECT
            hs.siak_mahasiswa_id,
            hs.ips,
            ROW_NUMBER() OVER(PARTITION BY hs.siak_mahasiswa_id ORDER BY hs.semester DESC) as rn
          FROM
            siak_hasil_studi hs
          WHERE hs.siak_mahasiswa_id = :mahasiswaId
        )
        SELECT
          COALESCE(bs.batas_sks, 21) AS "maxSksAllowed",
          COALESCE(krs.sks_diambil, 0) AS "sksTaken"
        FROM
          siak_mahasiswa m
        LEFT JOIN
          (SELECT * FROM LatestHasilStudi WHERE rn = 1) AS hs ON m.id = hs.siak_mahasiswa_id
        LEFT JOIN
          siak_batas_sks bs ON hs.ips >= bs.ips_min AND hs.ips < bs.ips_max
        LEFT JOIN
          siak_krs_mahasiswa krs ON m.id = krs.siak_mahasiswa_id AND krs.siak_periode_akademik_id = :periodeAkademikId
        WHERE
          m.id = :mahasiswaId;
    `;

    // --- 1. GATHER DATA ---
    const targetKelas = await KelasKuliah.findByPk(kelasKuliahId, {
        attributes: ['id', 'jumlahPeminat'],
        include: {
            attributes: ['id','nama', 'totalSks'],
            model: MataKuliah,
            as: 'mataKuliah',
            required: true
        },
    });
    if (!targetKelas) throw new Error('Kelas kuliah tidak ditemukan.');

    const targetMataKuliah = targetKelas.mataKuliah;
    const sksSummaryResult = await sequelize.query(GET_SKS_SUMMARY_SQL, {
        replacements: { mahasiswaId, periodeAkademikId },
        type: QueryTypes.SELECT,
        plain: true,
    });
    if (!sksSummaryResult) throw new Error('Mahasiswa tidak ditemukan atau data SKS tidak lengkap.');

    // --- 2. VALIDATION CHECKS ---
    // Check #1: SKS Limit
    const sksNeeded = targetMataKuliah.totalSks;
    if ((sksSummaryResult.sksTaken + sksNeeded) > sksSummaryResult.maxSksAllowed) {
        throw new Error(`Batas SKS tidak mencukupi. Sisa: ${sksSummaryResult.maxSksAllowed - sksSummaryResult.sksTaken}, dibutuhkan: ${sksNeeded}.`);
    }

    // Check #2: Duplicate course in the same semester
    const existingEnrollment = await RincianKrsMahasiswa.findOne({
        attributes: ['id', 'siakKelasKuliahId'],
        include: [
            { model: KrsMahasiswa, as: 'krsMahasiswa', where: { siakMahasiswaId: mahasiswaId, siakPeriodeAkademikId: periodeAkademikId }, required: true },
            { model: KelasKuliah, as: 'kelasKuliah', where: { siakMataKuliahId: targetMataKuliah.id }, required: true },
        ],
    });
    if (existingEnrollment) {
        // Check if the existing enrollment is for the exact same class
        if (existingEnrollment.siakKelasKuliahId === kelasKuliahId) {
            throw new Error('Mahasiswa sudah terdaftar di kelas ini.');
        } else {
            // Otherwise, it's for a different class of the same course
            throw new Error('Mahasiswa sudah mengambil mata kuliah ini di kelas lain.');
        }
    }

    // Check #3: Passed course in a past semester
    const pastPassedEnrollment = await RincianKrsMahasiswa.findOne({
        attributes: ['id', 'hurufMutu', 'nilai'],
        where: { status: "Lulus" },
        include: [
            { model: KrsMahasiswa, as: 'krsMahasiswa', where: { siakMahasiswaId: mahasiswaId, siakPeriodeAkademikId: { [Op.ne]: periodeAkademikId } }, required: true },
            { model: KelasKuliah, as: 'kelasKuliah', where: { siakMataKuliahId: targetMataKuliah.id }, required: true },
        ],
    });
    if (pastPassedEnrollment) throw new Error(`Sudah lulus mata kuliah ini dengan nilai ${pastPassedEnrollment.nilai}.`);

    // --- 3. WRITE TRANSACTION ---
    return sequelize.transaction(async (t) => {
        const [krs] = await KrsMahasiswa.findOrCreate({
            where: { siakMahasiswaId: mahasiswaId, siakPeriodeAkademikId: periodeAkademikId },
            defaults: { status: 'Draft', sksDiambil: 0 },
            transaction: t,
        });

        const newRincianKrs = await RincianKrsMahasiswa.create({
            siakKrsMahasiswaId: krs.id,
            siakKelasKuliahId: kelasKuliahId,
            kategori: 'Baru', // You could add logic here to check for past failures and set this to 'MENGULANG'
        }, { transaction: t });

        // Update the total SKS taken and the class participant count
        await krs.increment('sksDiambil', { by: sksNeeded, transaction: t });
        await targetKelas.increment('jumlahPeminat', { by: 1, transaction: t });

        return newRincianKrs;
    });
}

export const moveMahasiswaToOtherClass = async (mahasiswaId, sourceKelasKuliahId, targetKelasKuliahId, periodeAkademikId) => {

}

export const deleteMahasiswaFromClass = async(mahasiswaId, kelasKuliahId, periodeAkademikId) => {
    const mahasiswa = await Mahasiswa.findByPk(mahasiswaId, {
        attributes: ['id', 'nama'],
        where: { id: mahasiswaId }
    })
    if(!mahasiswa){
        throw new NotFoundError("Mahasiswa tidak dapat ditemukan")
    }

    const rincianKrs = await RincianKrsMahasiswa.findOne({
        attributes: ['id'],
        where: {
            siakKelasKuliahId: kelasKuliahId
        },
        include: {
            model: KrsMahasiswa,
            as: 'krsMahasiswa',
            where: {
                siakMahasiswaId: mahasiswaId,
                siakPeriodeAkademikId: periodeAkademikId,
            }
        }
    })
    if(!rincianKrs){
        throw new NotFoundError("Kelas kuliah tidak dapat ditemukan")
    }

    await rincianKrs.destroy()
}

export const getGradingClass = async(id) => {
    try {
        return await sequelize.transaction(async (trx) => {
            const classExist = await KelasKuliah.findByPk(id, {
                attributes: ['id', 'siakMataKuliahId'],
                transaction: trx,
            })
            if(!classExist) {
                throw new Error(`Kelas Kuliah tidak ditemukan`)
            }

            const mataKuliahExist = await MataKuliah.findByPk(mataKuliahId, {
                attributes: ['id'],
                include: {
                    attributes: [
                        'id', 'key', 'persentase'
                    ],
                    model: KomposisiNilaiMataKuliah,
                    as: 'komposisiNilaiMataKuliah'
                },
                transaction: trx
            })

            const komposisiMataKuliah = _getKomposisiMataKuliah(mataKuliahExist)

            const participantClass = await RincianKrsMahasiswa.findAll({
                attributes: [
                    'id', 'kehadiran', 'tugas', 'uts', 'uas', 'nilai', 'hurufMutu'
                ],
                where : {
                    siakKelasKuliahId: classExist.id
                },
                include: {
                    attributes: ['id'],
                    model: KrsMahasiswa,
                    as: 'krsMahasiswa',
                    include: {
                        attributes: ['nama', 'npm'],
                        model: Mahasiswa,
                        as: "mahasiswa"
                    }
                },
                transaction: trx,
            })

            const formattedResult = participantClass.map(items => {
                const participant = items.get( {plain : true} )
                const hurufMutu  = participant.hurufMutu;
                const kehadiran = parseFloat(participant.kehadiran)
                const tugas = parseFloat(participant.tugas)
                const uts = parseFloat(participant.uts)
                const uas = parseFloat(participant.uas)
                const nilai = parseFloat(participant.nilai)
                const { nama, npm } = participant.krsMahasiswa.mahasiswa;

                return {
                    nama,
                    npm,
                    kehadiran,
                    tugas,
                    uts,
                    uas,
                    nilai,
                    hurufMutu
                };
            });

            return {
                komposisiNilai : komposisiMataKuliah,
                pesertaKelas: formattedResult
            }
        })
    }
    catch (error) {
        console.log(error)
        throw new Error(error.message);
    }
}

export const submitGradingClass = async(id, body) => {
    try {
        return await sequelize.transaction(async (trx) => {
            const classExist = await KelasKuliah.findByPk(id, {
                attributes: ['id', 'siakMataKuliahId'],
                transaction: trx,
            })
            if(!classExist) {
                throw new Error(`Kelas Kuliah tidak ditemukan`)
            }

            const mataKuliahExist = await MataKuliah.findByPk(classExist.siakMataKuliahId, {
                attributes: ['id', 'siakProgramStudiId', 'siakTahunKurikulumId', 'totalSks', 'nilaiMin'],
                include: {
                    attributes: [
                        'id', 'key', 'persentase'
                    ],
                    model: KomposisiNilaiMataKuliah,
                    as: 'komposisiNilaiMataKuliah'
                },
                transaction: trx
            })

            const komposisiMataKuliah = _getKomposisiMataKuliah(mataKuliahExist)


            const mahasiswaExist = await Mahasiswa.findByPk(body.siakMahasiswaId, {
                attributes: ['id'],
                include: {
                    attributes: ['id'],
                    model: KrsMahasiswa,
                    as: 'krsMahasiswa',
                },
                transaction: trx,
            })
            if (!mahasiswaExist) {
                throw new Error(`Mahasiswa tidak ditemukan`)
            }

            const nilai = (
                ((komposisiMataKuliah.kehadiran/100) * body.kehadiran ) +
                ((komposisiMataKuliah.tugas/100) * body.tugas) +
                ((komposisiMataKuliah.uts/100) * body.uts) +
                ((komposisiMataKuliah.uas/100) * body.uas)
            )
            const skalaPenilaian = await SkalaPenilaian.findOne({
                attributes: ['hurufMutu', 'angkaMutu'],
                where: {
                    siakProgramStudiId: mataKuliahExist.siakProgramStudiId,
                    siakTahunKurikulumId: mataKuliahExist.siakTahunKurikulumId,

                    nilaiMax: { [Op.gte] : nilai },
                    nilaiMin: { [Op.lte] : nilai },
                },
                transaction: trx
            })

            const nilaiMinMataKuliah = await SkalaPenilaian.findOne({
                attributes: ['angkaMutu'],
                where: {
                    siakProgramStudiId: mataKuliahExist.siakProgramStudiId,
                    siakTahunKurikulumId: mataKuliahExist.siakTahunKurikulumId,
                    hurufMutu: mataKuliahExist.nilaiMin
                },
                transaction: trx
            });
            if (!nilaiMinMataKuliah) {
                throw new Error(`Konfigurasi nilai minimum '${mataKuliahExist.nilaiMin}' tidak ditemukan.`);
            }

            let statusMahasiswa = 'Tidak Lulus';
            if (skalaPenilaian.angkaMutu >= nilaiMinMataKuliah.angkaMutu) {
                statusMahasiswa = 'Lulus';
            } else {
            }

            await RincianKrsMahasiswa.update({
                status: statusMahasiswa,
                kehadiran: body.kehadiran,
                tugas: body.tugas,
                uts: body.uts,
                uas: body.uas,
                nilai: nilai,
                hurufMutu: skalaPenilaian.hurufMutu,
                angkaMutu: skalaPenilaian.angkaMutu,
                nilaiAkhir: (mataKuliahExist.totalSks * skalaPenilaian.angkaMutu)
            }, {
                where: {
                    siakKelasKuliahId: id,
                    siakKrsMahasiswaId: mahasiswaExist.krsMahasiswa[0].id
                }
            })

            return true
        })
    }
    catch (error) {
        console.log(error);
        throw new Error(error.message);
    }
}

const _getKomposisiMataKuliah = (mataKuliah) => {
    let komposisiMataKuliah = {};
    if (mataKuliah) {
        const plainData = mataKuliah.get({ plain: true });

        komposisiMataKuliah = plainData.komposisiNilaiMataKuliah.reduce((accumulator, currentItem) => {
            const key = currentItem.key;
            const percentage = parseFloat(currentItem.persentase);

            accumulator[key] = (accumulator[key] || 0) + percentage;

            return accumulator;
        }, {});
    }

    return komposisiMataKuliah;
}