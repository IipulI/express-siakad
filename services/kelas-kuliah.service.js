import {getPagination} from "../utils/pagination.js";
import models from "../models/index.js"
import {sequelize} from "../config/database.js";
import { Op } from "sequelize";

const {
    Dosen,
    JadwalKuliah,
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
} = models;

export const findAll = async (page, size, filter) => {
    try {
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

        let isPaginated = false;
        if (page !== null && size !== null) {
            const { limit, offset } = getPagination(page, size);
            kelasKuliahQueryBuilder.limit = limit;
            kelasKuliahQueryBuilder.offset = offset;
            isPaginated = true;
        }

        const { count, rows } = await KelasKuliah.findAndCountAll(kelasKuliahQueryBuilder)

        return {
            count,
            rows,
            isPaginated
        }
    }
    catch (error) {
        console.log(error)

        throw new Error(`Gagal mengambil data: ${error}`);
    }
}

export const createClass = async (payload) => {
    try {
        const { 
            siakMataKuliahId, 
            siakPeriodeAkademikId, 
            namaKelas, // For backward compatibility or if they use namaKelas
            nama,      // The actual field name in their new JSON example might be 'nama'
            kapasitas, 
            sistem_kuliah, 
            jumlah_pertemuan, 
            tanggal_mulai, 
            tanggal_selesai 
        } = payload;
        
        // Cari MK untuk dapetin prodi
        const mk = await MataKuliah.findByPk(siakMataKuliahId);
        if (!mk) throw new Error("Mata Kuliah tidak ditemukan");

        const newClass = await KelasKuliah.create({
            siakMataKuliahId: siakMataKuliahId,
            siakPeriodeAkademikId: siakPeriodeAkademikId,
            siakProgramStudiId: mk.siakProgramStudiId,
            nama: nama || namaKelas,
            kapasitas: kapasitas || 40,
            jumlahPeminat: 0,
            sistemKuliah: sistem_kuliah,
            statusKelas: "Dibuka",
            jumlahPertemuan: jumlah_pertemuan,
            tanggalMulai: tanggal_mulai,
            tanggalSelesai: tanggal_selesai
        });
        
        return newClass;
    } catch (error) {
        throw new Error(`Gagal membuat kelas: ${error.message}`);
    }
}

export const detailClass = async (id) => {
    try {
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
            throw new Error(`Kelas Kuliah tidak ditemukan`)
        }

        return dataClass
    }
    catch (error) {
        console.log(error)
        throw new Error(error);
    }
}

export const classSchedule = async(id) => {
    try {
        const existClass = await KelasKuliah.findByPk(id)
        if (!existClass) {
            throw new Error(`Kelas Kuliah tidak ditemukan`)
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
    catch (error) {
        console.log(error)
        throw new Error(error);
    }
}

export const classParticipant = async(id) => {
    try {
        const existClass = await KelasKuliah.findByPk(id, {attributes: ['id']})
        if (!existClass) {
            throw new Error(`Kelas Kuliah tidak ditemukan`)
        }

        return await Mahasiswa.findAll({
            attributes: ['id', 'nama', 'npm'],
            include : {
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
        })
    }
    catch (error) {
        console.log(error)
        throw new Error(error);
    }
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