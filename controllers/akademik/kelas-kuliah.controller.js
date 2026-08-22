import * as KelasKuliahService from '../../services/kelas-kuliah.service.js';
import ResponseBuilder from "../../utils/response.js";
import {getPagingData} from "../../utils/pagination.js";

export const findAll = async (req, res, next) => {
    const page = req.query.page ?? 1;
    const size = req.query.size ?? 10;
    const responseBuilder = new ResponseBuilder(res);

    const filter = {
        siakPeriodeAkademikId : req.query.siakPeriodeAkademikId,
        siakProgramStudiId : req.query.siakProgramStudiId,
        siakSistemKuliahId : req.query.siakSistemKuliahId,
        siakTahunKurikulumId: req.query.siakTahunKurikulumId,
        search: req.query.search,
        npm: req.query.npm,
        nip: req.query.nip,
        nidn: req.query.nidn,
        isActive: req.query.isActive,
    }

    try {
        const classes = await KelasKuliahService.findAll(page, size, filter);

        let payload
        if (classes.isPaginated === true) {
            payload = getPagingData(classes, page, size);
        } else {
            payload = classes
        }

        return responseBuilder
            .code(200)
            .message("Data berhasil diambil")
            .json(payload)
    }
    catch (error) {
        console.error(error);
        next(error);
    }
}

// FIX 2026-08-23: dipakai KHUSUS di /dosen/kelas (dosen-pengampu_router.js).
// findAll() di atas cuma nyaring by nip/nidn kalau CALLER kirim query param
// itu sendiri -- gak pernah otomatis kepasang dari identitas dosen yang
// login. Akibatnya /dosen/kelas tanpa filter nampilin kelas SEMUA dosen
// (bukan cuma punya sendiri), dan dosen bisa lihat jadwal dosen lain cuma
// dengan ganti param ?nidn=. Di sini scope-nya DIPAKSA dari req.user.dosen.id
// (hasil attachUser, sumbernya siak_user_id di token -> Dosen), gak bisa
// dioverride lewat query -- caller cuma boleh mempersempit (periode/prodi/
// search/dst), gak bisa memperlebar ke dosen lain.
export const findAllForDosen = async (req, res, next) => {
    const page = req.query.page ?? 1;
    const size = req.query.size ?? 10;
    const responseBuilder = new ResponseBuilder(res);

    const dosenId = req.user?.dosen?.id;
    if (!dosenId) {
        return res.status(403).json({ status: 403, message: 'Hanya dosen yang bisa mengakses menu ini.' });
    }

    const filter = {
        siakPeriodeAkademikId : req.query.siakPeriodeAkademikId,
        siakProgramStudiId : req.query.siakProgramStudiId,
        siakSistemKuliahId : req.query.siakSistemKuliahId,
        siakTahunKurikulumId: req.query.siakTahunKurikulumId,
        search: req.query.search,
        isActive: req.query.isActive,
        siakDosenId: dosenId,
    }

    try {
        const classes = await KelasKuliahService.findAll(page, size, filter);

        let payload
        if (classes.isPaginated === true) {
            payload = getPagingData(classes, page, size);
        } else {
            payload = classes
        }

        return responseBuilder
            .code(200)
            .message("Data berhasil diambil")
            .json(payload)
    }
    catch (error) {
        console.error(error);
        next(error);
    }
}

export const create = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const payload = req.body;
        const newClass = await KelasKuliahService.createClass(payload);
        return responseBuilder
            .code(201)
            .message("Berhasil membuat kelas kuliah baru")
            .json(newClass);
    } catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || "Gagal membuat kelas kuliah")
            .json();
    }
}

export const findOne = async (req, res) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const dataClass = await KelasKuliahService.detailClass(id)

        return responseBuilder
            .code(200)
            .message("Data berhasil diambil")
            .json(dataClass)
    }
    catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || "Kesalahan yang tidak terduga")
            .json();
    }
}

export const schedules = async (req, res) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const dataClass = await KelasKuliahService.classSchedule(id)

        return responseBuilder
            .code(200)
            .message("Data berhasil diambil.")
            .json(dataClass)
    }
    catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || "Kesalahan yang tidak terduga")
            .json();
    }
}

export const classParticipant = async (req, res) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const dataClass = await KelasKuliahService.classParticipant(id)

        return responseBuilder
            .code(200)
            .message("Data berhasil diambil")
            .json(dataClass)
    }
    catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || "Kesalahan yang tidak terduga.")
            .json();
    }
}

export const addClassParticipant = async (req, res) => {
    const kelasKuliahId = req.params.id;
    const { siakMahasiswaIds, siakPeriodeAkademikId } = req.body;
    const responseBuilder = new ResponseBuilder(res);


    // --- Input Validation ---
    if (!siakMahasiswaIds || !Array.isArray(siakMahasiswaIds) || siakMahasiswaIds.length === 0) {
        return responseBuilder.code(400).message("siakMahasiswaIds must be a non-empty array.").json();
    }
    if (!siakPeriodeAkademikId) {
        return responseBuilder.code(400).message("periodeAkademikId is required.").json();
    }

    const results = {
        success: [],
        failed: [],
    };

    // For a better UX, fetch student names beforehand to use in the response.
    const students = await Mahasiswa.findAll(
        {
            attributes: ['id', 'nama', 'npm'],
            where: { id: siakMahasiswaIds },
            raw: true
        }
    );
    const studentMap = new Map(students.map(s => [s.id, s]));

    // --- The Loop ---
    for (const mahasiswaId of siakMahasiswaIds) {
        const studentInfo = studentMap.get(mahasiswaId) || { id: mahasiswaId, nama: 'Unknown' };
        try {
            // Call the service for ONE student inside the loop
            await KelasKuliahService.enrollMahasiswaToClass(
                mahasiswaId,
                kelasKuliahId,
                siakPeriodeAkademikId,
            );
            results.success.push({
                mahasiswaId,
                nama: studentInfo.nama,
                message: 'Mahasiswa berhasil dimasukan.',
            });
        } catch (error) {
            results.failed.push({
                mahasiswaId,
                nama: studentInfo.nama,
                error: error.message || 'Terjadi kesalahan tidak terduga.',
            });
        }
    }

    const summary = {
        total: siakMahasiswaIds.length,
        successCount: results.success.length,
        failedCount: results.failed.length,
    };

    // Determine status code based on results
    const statusCode = (summary.failedCount > 0 && summary.successCount > 0) ? 207 : (summary.failedCount > 0 ? 400 : 201);

    return responseBuilder
        .code(statusCode)
        .message("Bulk enrollment process completed.")
        .json({ summary, results });
};

export const getGradingClass = async (req, res) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const dataClass = await KelasKuliahService.getGradingClass(id)

        return responseBuilder
            .code(200)
            .message("Data berhasil diambil")
            .json(dataClass)
    }
    catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || "Kesalahan yang tidak terduga.")
            .json();
    }
}

export const submitGradingClass = async (req, res) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res)
    const body ={
        siakMahasiswaId : req.body.siakMahasiswaId,
        kehadiran : req.body.kehadiran,
        tugas : req.body.tugas,
        uts : req.body.uts,
        uas : req.body.uas
    };

    try {
        if (parseFloat(body.kehadiran) > 100 || parseFloat(body.tugas) > 100 || parseFloat(body.uts) > 100 || parseFloat(body.uas) > 100) {
            throw new Error("Nilai tidak boleh lebih dari 100")
        }
        else if (parseFloat(body.kehadiran) < 0 || parseFloat(body.tugas) < 0 || parseFloat(body.uts) < 0 || parseFloat(body.uas) < 0) {
            throw new Error("Nilai tidak boleh kurang dari 0")
        }

        const success = await KelasKuliahService.submitGradingClass(id, body)

        if (success) {
            responseBuilder
                .code(200)
                .message("Berhasil menginput nilai")
                .json()
        } else {
            responseBuilder
                .status('failure')
                .code(400)
                .message("Gagal menginput nilai")
        }
    }
    catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || "Kesalahan yang tidak terduga.")
            .json();
    }
}
