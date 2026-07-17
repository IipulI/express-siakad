import db from '../models/index.js'
import { Op, Sequelize } from 'sequelize'
import { BadRequestError, NotFoundError } from "../utils/custom-error.js";

const {
    Dosen,
    RincianKrsMahasiswa,
    Ruangan,
    KelasKuliah,
    MataKuliah,
    JadwalKuliah,
    KrsMahasiswa,
    PeriodeAkademik
} = db

const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export const getWeeklyScheduleStudent = async (mahasiswaId) => {
    // 1. Get the Active Period
    const activePeriod = await PeriodeAkademik.findOne({
        where: { status: 'Aktif' },
    });

    if (!activePeriod) {
        throw new Error('Tidak ada periode akademik aktif yang ditemukan');
    }

    // 2. Fetch KRS and its details (Only for 'Disetujui' or 'Final' status if needed)
    const krsHeader = await KrsMahasiswa.findOne({
        attributes: ['id', 'status'],
        where: {
            siakMahasiswaId: mahasiswaId,
            siakPeriodeAkademikId: activePeriod.id,
            status: 'Disetujui'
        },
        include: [{
            attributes: ['id', 'siakKelasKuliahId'],
            model: RincianKrsMahasiswa,
            as: 'rincianKrsMahasiswa',
            include: [{
                attributes: ['id', 'siakMataKuliahId', 'nama'],
                model: KelasKuliah,
                as: 'kelasKuliah',
                include: [
                    { attributes: ['id', 'kode', 'nama', 'totalSks'], model: MataKuliah, as: 'mataKuliah' },
                    {
                        attributes: ['id', 'siakDosenId', 'siakRuanganId', 'hari', 'jamMulai', 'jamSelesai'],
                        model: JadwalKuliah,
                        as: 'jadwalKuliah',
                        include: [
                            { attributes: ['id', 'nama'], model : Dosen, as: 'dosen' },
                            { attributes: ['id', 'nama', 'ruangan'], model: Ruangan, as: 'ruangan' }
                        ]
                    }
                ]
            }]
        }]
    });

    if (krsHeader && krsHeader.status !== 'Disetujui') {
        throw new BadRequestError('KRS belum disetujui');
    }

    if (!krsHeader) {
        return { message: "Belum ada KRS untuk periode ini", schedule: {} };
    }

    // 3. Initialize the Weekly Structure
    const schedule = {};
    days.forEach(day => { schedule[day] = []; });

    let totalSksEnrolled = 0;

    // 4. Transform and Group by Day
    krsHeader.rincianKrsMahasiswa.forEach(rincian => {
        const kelas = rincian.kelasKuliah;
        const mk = kelas.mataKuliah;

        if (mk) totalSksEnrolled += mk.totalSks;

        if (kelas.jadwalKuliah && kelas.jadwalKuliah.length > 0) {
            kelas.jadwalKuliah.forEach(jadwal => {
                schedule[jadwal.hari].push({
                    id: jadwal.id,
                    jamMulai: jadwal.jamMulai,
                    jamSelesai: jadwal.jamSelesai,
                    mataKuliah: mk.nama,
                    kode: mk.kode,
                    kelas: kelas.nama,
                    dosen: jadwal.dosen?.nama || 'N/A',
                    ruangan: jadwal.ruangan?.nama || 'TBA',
                    sks: mk.totalSks
                });
            });
        }
    });

    // 5. Chronological Sorting for each day
    days.forEach(day => {
        schedule[day].sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
    });

    return {
        krsId: krsHeader.id,
        status: krsHeader.status,
        totalSks: totalSksEnrolled,
        periode: activePeriod.nama, // e.g., "2025/2026 Ganjil"
        schedule
    };
};

export const getDailyScheduleStudent = async (mahasiswaId, periodeId, hari) => {
    // 1. Get the Active Period
    let activePeriod
    if (periodeId !== undefined && periodeId !== '') {
        activePeriod = await PeriodeAkademik.findByPk(periodeId)
    } else {
        activePeriod = await PeriodeAkademik.findOne({
            where: { status: 'Aktif' },
        });
    }

    if (!activePeriod) {
        throw new NotFoundError('Tidak ada periode akademik aktif yang ditemukan');
    }

    // 2. Fetch KRS and its details (Only for 'Disetujui' or 'Final' status if needed)
    const krsHeader = await KrsMahasiswa.findOne({
        attributes: ['id', 'status'],
        where: {
            siakMahasiswaId: mahasiswaId,
            siakPeriodeAkademikId: activePeriod.id,
            status: 'Disetujui'
        },
        include: {
            attributes: ['id', 'siakKelasKuliahId'],
            model: RincianKrsMahasiswa,
            as: 'rincianKrsMahasiswa',
            include: {
                attributes: ['id', 'siakMataKuliahId', 'nama'],
                model: KelasKuliah,
                as: 'kelasKuliah',
                include: [
                    { attributes: ['id', 'kode', 'nama', 'totalSks'], model: MataKuliah, as: 'mataKuliah' },
                    {
                        attributes: ['id', 'siakDosenId', 'siakRuanganId', 'hari', 'jamMulai', 'jamSelesai'],
                        model: JadwalKuliah,
                        as: 'jadwalKuliah',
                        include: [
                            { attributes: ['id', 'nama'], model : Dosen, as: 'dosen' },
                            { attributes: ['id', 'nama', 'ruangan'], model: Ruangan, as: 'ruangan' }
                        ]
                    }
                ]
            }
        }
    });

    if (!krsHeader) {
        throw new NotFoundError('KRS tidak ditemukan');
    }

    if (krsHeader && krsHeader.status !== 'Disetujui') {
        throw new BadRequestError('KRS belum disetujui');
    }

    const schedule = [];

    krsHeader.rincianKrsMahasiswa.forEach(rincian => {
        const kelas = rincian.kelasKuliah;
        const mk = kelas.mataKuliah;

        if (kelas.jadwalKuliah && kelas.jadwalKuliah.length > 0) {
            kelas.jadwalKuliah.forEach(jadwal => {
                schedule.push({
                    id: jadwal.id,
                    hari: jadwal.hari,
                    jamMulai: jadwal.jamMulai,
                    jamSelesai: jadwal.jamSelesai,
                    namaMataKuliah: mk.nama,
                    kode: mk.kode,
                    kelas: kelas.nama,
                    dosen: jadwal.dosen?.nama || 'N/A',
                    ruangan: jadwal.ruangan?.nama || 'TBA',
                    sks: mk.totalSks
                })
            })
        }
    })

    return schedule
}

export const getWeeklyScheduleLecturer = async (dosenId) => {
    const activePeriod = await PeriodeAkademik.findOne({
        where: { status: 'Aktif' },
    });

    if (!activePeriod) {
        throw new Error('Tidak ada periode akademik aktif yang ditemukan');
    }

    const jadwalKuliah = await JadwalKuliah.findAll({
        where: {
            jenisPertemuan: 'Kuliah',
            siakDosenId: dosenId,
        },
        include: [
            {
                model: KelasKuliah,
                as: 'kelasKuliah',
                where: {
                    siakPeriodeAkademikId: activePeriod.id,
                },
                include: [
                    {
                        attributes: ['id', 'kode', 'nama', 'totalSks'],
                        model: MataKuliah,
                        as: 'mataKuliah'
                    },
                ]
            },
            {
                attributes: ['id', 'nama'],
                model: Ruangan,
                as: 'ruangan',
            },
            {
                attributes: ['id', 'nama'],
                model: Dosen,
                as: 'dosen',
            }
        ]
    })

    // 3. Initialize the Weekly Structure
    const schedule = {};
    days.forEach(day => { schedule[day] = []; });

    let totalSksTeaching = 0;
    const countedClasses = new Set();

    // 4. Transform and Group by Day
    jadwalKuliah.forEach(jadwal => {
        const kelas = jadwal.kelasKuliah;
        const mk = kelas?.mataKuliah;

        if (mk && !countedClasses.has(kelas.id)) {
            totalSksTeaching += mk.totalSks;
            countedClasses.add(kelas.id);
        }

        schedule[jadwal.hari].push({
            id: jadwal.id,
            jamMulai: jadwal.jamMulai,
            jamSelesai: jadwal.jamSelesai,
            mataKuliah: mk?.nama || 'N/A',
            kode: mk?.kode || 'N/A',
            kelas: kelas?.nama || 'N/A',
            ruangan: jadwal.ruangan?.nama || 'TBA',
            sks: mk?.totalSks || 0,
            dosen: jadwal.dosen?.nama || 'N/A',
        });
    });

    // 5. Chronological Sorting for each day
    days.forEach(day => {
        schedule[day].sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
    });

    return schedule

    return {
        totalSks: totalSksTeaching,
        periode: activePeriod.nama,
        schedule
    };
}