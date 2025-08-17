import db from '../models/index.js'
import {findActive} from "./periode-akademik.service.js";
import {Op} from 'sequelize'

// Import your models
const {
    sequelize,
    Dosen,
    JadwalKuliah,
    KelasKuliah,
    KrsMahasiswa,
    Mahasiswa,
    MataKuliah,
    PeriodeAkademik,
    RincianKrsMahasiswa,
    Ruangan,
    TahunKurikulum
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
        include: [
            {
                attributes: [
                    'id', 'siakTahunKurikulumId', 'nama', 'kode', 'semester', 'nilaiMin', 'totalSks',
                ],
                model: MataKuliah,
                as: 'mataKuliah',
                where: mataKuliahWhere,
                required: true,
                include: [
                    {
                        attributes: [
                            'id', 'tahun'
                        ],
                        model: TahunKurikulum,
                        as: 'tahunKurikulum'
                    }
                ]
            },
            {
                attributes: ['id', 'hari', 'jamMulai', 'jamSelesai'],
                model: JadwalKuliah,
                as: 'jadwalUtama',
                include: [
                    {
                        attributes: [
                            "id", "nama", "nidn"
                        ],
                        model: Dosen,
                        as: 'dosen',
                    },
                    {
                        attributes: ['id', 'nama'],
                        model: Ruangan,
                        as: 'ruangan',
                    }
                ]
            }
        ],
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

export const saveKrs = async (mahasiswaId, kelasKuliahIds) => {
    try {
        // Get Mahasiswa
        const mahasiswa = await Mahasiswa.findByPk(mahasiswaId, { attributes: ['id', 'semester'] });
        if (!mahasiswa) throw new Error('Missing Mahasiswa');

        // Get periode aktif
        const activePeriod = await findActive();
        if (!activePeriod) throw new Error('No active academic period found.');

        // Check eksistensi krs
        const existingKrs = await KrsMahasiswa.findOne({
            where: { siakMahasiswaId: mahasiswaId, siakPeriodeAkademikId: activePeriod.id },
        });
        if (existingKrs) throw new Error("Anda sudah memiliki KRS.");

        // Get kelas kuliah berdasarkan yang dipilih
        const selectedClassCourse = await KelasKuliah.findAll({
            attributes : ['id'],
            where: { id: kelasKuliahIds },
            include: {
                attributes: ['id', 'totalSks', 'prasyaratMataKuliah1', 'prasyaratMataKuliah2', 'prasyaratMataKuliah3'],
                model: MataKuliah,
                as: 'mataKuliah',
                // include: {
                //     attributes: ['id'],
                //     model: MataKuliah, // Assuming a self-referencing model for prerequisites
                //     as: 'prasyarat_mata_kuliah',
                // }
            },
        });
        if (selectedClassCourse.length !== kelasKuliahIds.length) {
            throw new Error('Some classes not found.');
        }

        // Get taken subjects in a consistent manner (similar to your previous logic)
        const takenSubjectIds = await getTakenSubjectIds(mahasiswaId);

        // Now, perform validation using the private function
        await _validateKrsRules(mahasiswa, selectedClassCourse, takenSubjectIds);

        const courseWithStatus = selectedClassCourse.map(kelas => {
            const isRetake = takenSubjectIds.includes(kelas.mataKuliah.id);
            return {
                ...kelas.get({ plain: true }),
                kategori: isRetake ? "Ulang" : "Baru"
            };
        });

        // kalkulasi total sks yang diambil
        const totalSKKeseluruhan = courseWithStatus.reduce((sum, course) => sum + (course.mataKuliah?.totalSks || 0), 0);

        const data = await sequelize.transaction(async (trx) => {
            const studentKrs = await KrsMahasiswa.create({
                siakMahasiswaId: mahasiswaId,
                siakPeriodeAkademikId: activePeriod.id,
                status: "Draft",
                sksDiambil: totalSKKeseluruhan,
                semester: mahasiswa.semester,
            }, { transaction: trx });

            const bulkRincianKrsMahasiswa = courseWithStatus.map(course => ({
                siakKrsMahasiswaId: studentKrs.id,
                siakKelasKuliahId: course.id,
                kategori: course.kategori,
            }));

            await RincianKrsMahasiswa.bulkCreate(bulkRincianKrsMahasiswa, { transaction: trx });

            return studentKrs;
        });

        return data;
    } catch (error) {
        console.error('Error saving KRS:', error);
        throw new Error(`Failed to save KRS: ${error.message}`);
    }
};

export const updateKrs = async (krsId, kelasKuliahId) => {
    try {
        const krs = await KrsMahasiswa.findByPk(krsId, {
            include: [{
                model: RincianKrsMahasiswa,
                as: 'rincianKrsMahasiswa',
                include: { model: KelasKuliah, as: 'kelasKuliah' }
            }]
        });
        if (!krs) {
            throw new Error('KRS not found.')
        }
        if (krs.status === 'Disetujui') {
            throw new Error('Krs Sudah disetujui, tidak bisa dirubah lagi');
        }

        const mahasiswa = await Mahasiswa.findByPk(krs.siakMahasiswaId, { attributes: ['id', 'semester'] });

        // Fetch the new set of classes, eager loading prerequisites
        const newSelectedClasses = await KelasKuliah.findAll({
            attributes: ['id'],
            where: { id: kelasKuliahId },
            include: {
                attributes: ['id', 'totalSks', 'prasyaratMataKuliah1', 'prasyaratMataKuliah2', 'prasyaratMataKuliah3'],
                model: MataKuliah,
                as: 'mataKuliah',
                // include: [{
                //     model: MataKuliah,
                //     as: 'prasyarat_mata_kuliah',
                // }]
            }
        });
        if(newSelectedClasses.length !== kelasKuliahId.length) {
            throw new Error('Some classes not found.');
        }

        // Get all courses the student has taken previously
        const takenSubjectIds = await getTakenSubjectIds(krs.siakMahasiswaId);

        // Run the same validation checks
        await _validateKrsRules(mahasiswa, newSelectedClasses, takenSubjectIds);

        // filter kelas untuk di add dan dihapus
        const currentClassIds = krs.rincianKrsMahasiswa.map(rincian => rincian.siakKelasKuliahId);

        const classIdsToAdd = kelasKuliahId.filter(id => !currentClassIds.includes(id));
        const classIdsToRemove = currentClassIds.filter(id => !kelasKuliahId.includes(id));

        await sequelize.transaction(async (trx) => {
            // Remove old classes
            if (classIdsToRemove.length > 0) {
                await RincianKrsMahasiswa.destroy({
                    where: { siakKrsMahasiswaId: krs.id, siakKelasKuliahId: classIdsToRemove },
                    transaction: trx,
                });
            }

            // Add new classes
            if (classIdsToAdd.length > 0) {
                const rincianData = newSelectedClasses
                    .filter(kelas => classIdsToAdd.includes(kelas.id))
                    .map(kelas => {
                        const isRetake = takenSubjectIds.includes(kelas.mataKuliah.id);
                        return {
                            siakKrsMahasiswaId: krs.id,
                            siakKelasKuliahId: kelas.id,
                            kategori: isRetake ? 'Ulang' : 'Baru',
                        };
                    });
                await RincianKrsMahasiswa.bulkCreate(rincianData, { transaction: trx });
            }

            // Update the main KRS record
            const newTotalSks = newSelectedClasses.reduce((sum, course) => sum + (course.mataKuliah?.totalSks || 0), 0);
            krs.sksDiambil = newTotalSks;
            await krs.save({ transaction: trx });
        });

        return { message: 'KRS updated successfully.' };
    } catch (error) {
        console.error('Error updating KRS:', error);
        throw new Error(`Failed to update KRS: ${error.message}`);
    }
};

export const deleteKrs = async (krsId, kelasKuliahId) => {
    try {
        const krs = await KrsMahasiswa.findByPk(krsId, {
            include: {
                attributes: ['id'],
                model: RincianKrsMahasiswa,
                as: 'rincianKrsMahasiswa',
                include : { attributes: ['id'], model: KelasKuliah, as: 'kelasKuliah' },
            }
        })
        if(!krs) {
            throw new Error('KRS not found.');
        }
        if (krs.status === 'Disetujui') {
            throw new Error('Krs Sudah disetujui, tidak bisa dirubah lagi');
        }

        await sequelize.transaction(async (trx) => {
            await RincianKrsMahasiswa.destroy({
                where: { siakKrsMahasiswaId: krs.id, siakKelasKuliahId: kelasKuliahId },
                transaction: trx,
            })
        })
    }
    catch (error) {
        console.log(error);
        throw new Error(`Error updating KRS: ${error.message}`);
    }
}

export const savedKrs = async (mahasiswaId) => {
    // Get Periode Aktif terlebih dahulu
    const activePeriod = await PeriodeAkademik.findOne({
        where: { status: 'Aktif' },
    });

    if (!activePeriod) {
        throw new Error('No active academic period found.');
    }

    const rincianKrsMahasiswa = await RincianKrsMahasiswa.findAll({
        attributes: ['siakKelasKuliahId'],
        raw: true,
        include: {
            model: KrsMahasiswa,
            as: 'krsMahasiswa',
            attributes: [],
            required: true,
            where: {
                siakMahasiswaId: mahasiswaId,
                siakPeriodeAkademikId: activePeriod.id,
            }
        }
    })
        .then(rincianKrsMahasiswa => rincianKrsMahasiswa.map(rincian => rincian.siakKelasKuliahId));

    if(!rincianKrsMahasiswa){
        throw new Error(`Mahasiswa with ID ${mahasiswaId} not found.`);
    }

    const dataKelasKuliah = await KelasKuliah.findAll({
        attributes: [
            "id", "nama", "sistemKuliah"
        ],
        where: {
            id: { [Op.in]: rincianKrsMahasiswa }
        },
        include: [
            {
                attributes: [
                    "id", "nama", "kode", "totalSks"
                ],
                model: MataKuliah,
                as: 'mataKuliah',
            },
            {
                attributes: [
                    "hari", "jamMulai", "jamSelesai",
                ],
                model: JadwalKuliah,
                as: 'jadwalUtama',
                include: [
                    {
                        attributes: [
                            "id", "nama", "nidn"
                        ],
                        model: Dosen,
                        as: 'dosen',
                    },
                    {
                        attributes: ['id', 'nama'],
                        model: Ruangan,
                        as: 'ruangan',
                    }
                ]
            }
        ]
    })

    return dataKelasKuliah;
}

// Helper function to get taken subjects, to avoid code duplication
const getTakenSubjectIds = async (mahasiswaId) => {
    // This query is similar to your previous one, fetching a flat list of course IDs.
    const takenSubject = await RincianKrsMahasiswa.findAll({
        attributes: [],
        include: [{
            attributes: [],
            model: KrsMahasiswa,
            as: 'krsMahasiswa',
            required: true,
            where: { siakMahasiswaId: mahasiswaId }
        }, {
            attributes: [],
            model: KelasKuliah,
            as: 'kelasKuliah',
            required: true,
            include: {
                attributes: ['id'],
                model: MataKuliah,
                as: 'mataKuliah',
                required: true,
            }
        }],
        raw: true,
        group: ['kelasKuliah.mataKuliah.id']
    })
        .then(subjects => subjects.map(s => s['kelasKuliah.mataKuliah.id']));

    return takenSubject;
};

// A private helper function to validate KRS rules.
// It uses a closure to prevent external access.
const _validateKrsRules = async (mahasiswa, selectedClasses, takenSubjects) => {
    // A Set is used for O(1) lookups, just like in your previous Express.js code.
    const takenSubjectSet = new Set(takenSubjects);
    const errors = {};

    // A. Check for prerequisites
    for (const kelas of selectedClasses) {
        const mataKuliah = kelas.mataKuliah;
        // Collect all prerequisite IDs for the current course
        const requiredPrereqIds = [];
        if (mataKuliah.prasyaratMataKuliah1) requiredPrereqIds.push(mataKuliah.prasyaratMataKuliah1);
        if (mataKuliah.prasyaratMataKuliah2) requiredPrereqIds.push(mataKuliah.prasyaratMataKuliah2);
        if (mataKuliah.prasyaratMataKuliah3) requiredPrereqIds.push(mataKuliah.prasyaratMataKuliah3);

        if (requiredPrereqIds.length > 0) {
            // Find which prerequisites have NOT been taken
            const unmetPrereqIds = requiredPrereqIds.filter(prereqId => !takenSubjectSet.has(prereqId));

            if (unmetPrereqIds.length > 0) {
                // You can fetch the names of the missing prerequisites here if needed,
                // but for now, we'll just throw a clear error message.
                if (!errors[kelas.id]) errors[kelas.id] = [];
                errors[kelas.id].push(`Prerequisites for '${mataKuliah.nama}' are not met.`);
            }
        }

        // B. (Optional) Check SKS limit here if you implement it.
        // C. (Optional) Check for class capacity.
    }

    if (Object.keys(errors).length > 0) {
        // We'll throw a single error object with all messages, similar to Laravel's ValidationException.
        const allErrors = Object.values(errors).flat();
        throw new Error(allErrors.join(' '));
    }
};

