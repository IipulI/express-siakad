import db from '../models/index.js'
import {Op} from 'sequelize'

// Import your models
const {
    sequelize,
    KelasKuliah,
    MataKuliah,
    RincianKrsMahasiswa,
    KrsMahasiswa,
    Mahasiswa,
    PeriodeAkademik,
    ProgramStudi,
    TahunKurikulum,
    JadwalKuliah,
    Dosen,
} = db;

// Define which grades are considered failing.
const FAILING_GRADES = ['E', 'D'];

export const getAvailableKrs = async (mahasiswaId, searchQuery, semesterList) => {
    // --- Step 1: Find the Active Academic Period ---
    const activePeriod = await PeriodeAkademik.findOne({
        where: { status: 'Aktif' },
    });

    if (!activePeriod) {
        throw new Error('No active academic period found.');
    }

    // --- Step 2: Get Student's Program Studi and Course History ---
    const mahasiswa = await Mahasiswa.findByPk(mahasiswaId, {
        attributes: ['id', 'siakProgramStudiId'],
        include: [{
            model: KrsMahasiswa,
            as: 'krsMahasiswa',
            attributes: ['id'],
            include: [{
                model: RincianKrsMahasiswa,
                as: 'rincianKrsMahasiswa',
                attributes: ['hurufMutu', 'nilaiAkhir'],
                include: [{
                    model: KelasKuliah,
                    as: 'kelasKuliah',
                    attributes: ['siakMataKuliahId'],
                }],
            }],
        }],
    });

    if (!mahasiswa) {
        throw new Error(`Mahasiswa with ID ${mahasiswaId} not found.`);
    }

    const programStudiId = mahasiswa.siakProgramStudiId;

    // Process the history into a simple Map for fast lookups
    const studentHistoryMap = new Map();
    if (mahasiswa.krsMahasiswa) {
        for (const krs of mahasiswa.krsMahasiswa) {
            for (const rincian of krs.rincianKrsMahasiswa) {
                if (rincian.kelasKuliah) {
                    const courseId = rincian.kelasKuliah.siakMataKuliahId;
                    studentHistoryMap.set(courseId, {
                        hurufMutu: rincian.hurufMutu,
                        nilaiAkhir: rincian.nilaiAkhir,
                    });
                }
            }
        }
    }

    // --- Step 3: Build the Where Clause for the Main Query ---
    const mataKuliahWhere = {
        siakProgramStudiId: programStudiId,
    };

    if (searchQuery && searchQuery.trim() !== '') {
        const searchPattern = `%${searchQuery}%`;
        mataKuliahWhere[Op.or] = [
            { nama: { [Op.iLike]: searchPattern } },
            { kode: { [Op.iLike]: searchPattern } },
        ];
    }

    if (semesterList && semesterList.length > 0) {
        mataKuliahWhere.semester = {
            [Op.in]: semesterList
        };
    }

    // --- Step 4: Execute the Main Query ---
    const availableKelas = await KelasKuliah.findAll({
        attributes: [
            'id', 'siakMataKuliahId', 'nama', 'kapasitas', 'sistemKuliah', 'jumlahPeminat'
        ],
        where: { siakPeriodeAkademikId: activePeriod.id },
        include: [{
            model: MataKuliah,
            as: 'mataKuliah',
            where: mataKuliahWhere,
            required: true,
        }],
    });

    // --- Step 5: Categorize, Sort, and Combine Results ---
    const notTaken = [];
    const failed = [];

    // Iterate directly over the available KELAS
    for (const kelas of availableKelas) {
        const course = kelas.mataKuliah;
        if (!course) continue; // Safety check

        const history = studentHistoryMap.get(course.id);
        // Convert the Sequelize instance to a plain object to modify it
        const kelasJson = kelas.toJSON();

        if (!history) {
            // Attach grade info to the main KelasKuliah object
            kelasJson.previousGrade = null;
            notTaken.push(kelasJson);
        } else if (FAILING_GRADES.includes(history.hurufMutu)) {
            kelasJson.previousGrade = history.hurufMutu;
            failed.push(kelasJson);
        }
    }

    // The sort function now accesses the nested course property for the semester
    const sortBySemester = (a, b) => a.mataKuliah.semester - b.mataKuliah.semester;
    notTaken.sort(sortBySemester);
    failed.sort(sortBySemester);

    return [...notTaken, ...failed];
};