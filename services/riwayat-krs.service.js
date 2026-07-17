import db from "../models/index.js";
import { Op } from "sequelize";

const {
    Dosen,
    HasilStudi,
    JadwalKuliah,
    KelasKuliah,
    KrsMahasiswa,
    Mahasiswa,
    MataKuliah,
    PeriodeAkademik,
    ProgramStudi,
    RincianKrsMahasiswa,
    Ruangan,
    BatasSks,
} = db;

export const getRiwayatKrs = async (mahasiswaId, periodeId) => {
    const mahasiswa = await Mahasiswa.findByPk(mahasiswaId, {
        attributes: ["id", "nama", "periodeMasuk"],
        include: [
            {
                attributes: ['id', 'siakJenjangId', 'nama'],
                model: ProgramStudi,
                as: 'programStudi',
            }
        ]
    });
    if (!mahasiswa) {
        throw new Error(`Mahasiswa dengan Id ${mahasiswaId} tidak ditemukan`);
    }

    const periodeAkademik = await PeriodeAkademik.findByPk(periodeId, {
        attributes: ["id", "kode"],
    });
    if (!periodeAkademik) {
        throw new Error(`Periode akademik tidak ditemukan`);
    }

    // get previous hasil studi
    const tahunPeriodeakademikSlice = periodeAkademik.kode.slice(0, 4)
    const semesterPeriodeAkademikSlice = periodeAkademik.kode.slice(4)

    let searchPeriodekode
    if (semesterPeriodeAkademikSlice === '1') {
        searchPeriodekode = `${tahunPeriodeakademikSlice-1}2`
    } else {
        searchPeriodekode = `${tahunPeriodeakademikSlice}${semesterPeriodeAkademikSlice-1}`
    }

    let batasSks
    let hasilStudi
    if (Number(searchPeriodekode) < Number(mahasiswa.periodeMasuk)) {
        batasSks = await BatasSks.findOne({
            attributes: ['batasSks'],
            where: {
                siakJenjangId: mahasiswa.programStudi.siakJenjangId,
                is_default: true,
            },
        })
    } else {
        const prevPeriodeakademik = await PeriodeAkademik.findOne({
            attributes: ["id"],
            where: { kode: searchPeriodekode }
        })

        hasilStudi = await HasilStudi.findOne({
            attributes: ["semester", "ips", "ipk", "sksDiambil", "sksLulus"],
            where: {
                siakMahasiswaId: mahasiswaId,
                siakPeriodeAkademikId: prevPeriodeakademik.id
            }
        })

        batasSks = await BatasSks.findOne({
            attributes: ['batasSks'],
            where: {
                siakJenjangId: mahasiswa.programStudi.siakJenjangId,
                ipsMin: { [Op.gte]: hasilStudi.ips },
            },
        })
    }

    const rincianKrsMahasiswa = await RincianKrsMahasiswa.findAll({
        attributes: {
            exclude: ["createdAt", "updatedAt", "deletedAt"],
        },
        include: [
            {
                attributes: ['id', 'siakPeriodeAkademikId', 'siakMahasiswaId'],
                model: KrsMahasiswa,
                as: 'krsMahasiswa',
                where: {
                    siakMahasiswaId: mahasiswaId,
                    siakPeriodeAkademikId: periodeId,
                }
            },
            {
                attributes: ['id', 'siakMataKuliahId', 'nama'],
                model: KelasKuliah,
                as: 'kelasKuliah',
                include: [
                    {
                        attributes: ['id', 'nama', 'kode', 'totalSks'],
                        model: MataKuliah,
                        as: "mataKuliah"
                    },
                    {
                        attributes: ['id', 'siakKelasKuliahId', 'siakRuanganId', 'siakDosenId', 'hari', 'jamMulai', 'jamSelesai'],
                        model: JadwalKuliah,
                        as: 'jadwalUtama',
                        include: [
                            {
                                attributes: ['id', 'nama'],
                                model: Ruangan,
                                as: 'ruangan'
                            },
                            {
                                attributes: ['id', 'nama'],
                                model: Dosen,
                                as: 'dosen',
                            }
                        ]
                    }
                ]
            }
        ]
    })

    return {
        krs: rincianKrsMahasiswa,
        riwayatSks: hasilStudi,
        batasSks: batasSks,
    };
};
