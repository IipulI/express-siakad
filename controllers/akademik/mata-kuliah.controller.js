import * as MataKuliahService from "../../services/mata-kuliah.service.js";
import ResponseBuilder from "../../utils/response.js";
import {getPagingData} from "../../utils/pagination.js";

export const findAll = async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;
    const responseBuilder = new ResponseBuilder(res);

    const filter = {
        tahunKurikulumId: req.query.tahunKurikulumId,
        programStudiId: req.query.programStudiId,
        search: req.query.search,
        order: req.query.order,
        nip: req.query.nip,
    }

    try {
        const data = await MataKuliahService.findAll(page, size, filter);

        let payload;
        if (data.isPaginated === true) {
            payload = getPagingData(data, page, size);
        } else {
            payload = data.rows
        }

        return responseBuilder
            .code(200)
            .message("Data berhasil diambil")
            .json(payload)
    }
    catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || 'Terjadi kesalahan tak terduga')
            .json();
    }
}

export const findOne = async (req, res) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await MataKuliahService.findOne(id);

        responseBuilder
            .code(200)
            .message("Data berhasil diambil")
            .json(data);
    }
    catch (error) {
        responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || 'Terjadi kesalahan tak terduga')
            .json();
    }
}

export const create = async (req, res, next) => {
    const responseBuilder = new ResponseBuilder(res);

    try {
        await MataKuliahService.createMataKuliah(req.body);

        responseBuilder
            .code(201)
            .message("Data Mata Kuliah berhasil dibuat")
            .json();
    }
    catch (error) {
        console.error(error)
        next(error)
    }
}

export const update = async (req, res) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const updatedData = await MataKuliahService.updateMataKuliah(id, req.body);

        if (updatedData) {
            return responseBuilder
                .status("success")
                .code(200)
                .message("Data berhasil diperbarui")
                // PERBAIKAN: Selipkan data terbarunya di sini
                .json(updatedData);
        }
        else {
            return responseBuilder
                .status("failure")
                .code(404)
                .message(`Mata Kuliah dengan ID ${id} tidak ditemukan atau tidak ada perubahan yang dilakukan`)
                .json();
        }
    }
    catch (error) {
        return responseBuilder
            .status("failure")
            .code(500)
            .message(error.message || "Terjadi kesalahan yang tidak terduga.")
            .json();
    }
}

export const destroy = async (req, res) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const isDeleted = await MataKuliahService.deleteMataKuliah(id)

        if (isDeleted) {
            responseBuilder
                .status("success")
                .message("Data berhasil dihapus")
                .json();
        }
        else {
            return responseBuilder
                .status("failure")
                .code(404)
                .message(`Mata kuliah dengan ID ${id} tidak ditemukan`)
                .json();
        }
    }
    catch (error) {
        return responseBuilder
            .status("failure")
            .code(500)
            .message("Terjadi kesalahan yang tidak terduga")
            .json();
    }
}

// =====================================================================
// KHUSUS MODUL OBE: CONTROLLER DAFTAR & DETAIL MATA KULIAH
// =====================================================================

export const getDaftarMataKuliahObe = async (req, res, next) => {
    try {
        // 1. Ambil parameter dari query string
        const { page, size, search, prodiId, tahunKurikulumId } = req.query;

        // 2. Panggil Service
        const result = await MataKuliahService.getListMataKuliahObe(
            page,
            size,
            search,
            prodiId,
            tahunKurikulumId
        );

        // 3. Bungkus data mentah dengan utilitas pagination milik Abang
        // result berisi { count, rows }
        const payload = getPagingData(result, page, size);

        // 4. Kirim response sukses menggunakan ResponseBuilder
        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil mengambil daftar mata kuliah OBE")
            .json({
                ...payload,
                isPaginated: page !== null && size !== null // Tambahan flag seperti di JSON Abang
            });

    } catch (error) {
        // 5. Lempar ke Global Error Handler (next(error))
        // Tidak perlu ResponseBuilder.failure lagi di sini
        next(error);
    }
};
export const getDetailMataKuliahObe = async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Panggil Service Detail
        const data = await MataKuliahService.getDetailMataKuliahObe(id);

        // 2. Kirim Response Sukses
        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil mengambil detail mata kuliah OBE")
            .json(data);

    } catch (error) {
        // 3. Kalau error (misal 404 dari service), lempar ke handleErrorsAndCleanup
        next(error);
    }
};

export const createMataKuliahObe = async (req, res, next) => {
    try {
        // Panggil Service Create
        const data = await MataKuliahService.createMataKuliahObe(req.body);

        // Kirim response 201 (Created) pakai ResponseBuilder
        return new ResponseBuilder(res)
            .code(201)
            .message("Data Mata Kuliah berhasil dibuat")
            .json(data);

    } catch (error) {
        // Lapor Manajer (Global Error Handler)
        next(error);
    }
};
export const updateMataKuliahObe = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await MataKuliahService.updateMataKuliah(id, req.body);

        return new ResponseBuilder(res)
            .code(200)
            .message("Data Mata Kuliah berhasil diperbarui")
            .json(data);
    } catch (error) {
        next(error);
    }
};

export const deleteMataKuliahObe = async (req, res, next) => {
    try {
        const { id } = req.params;
        await MataKuliahService.deleteMataKuliah(id);

        return new ResponseBuilder(res)
            .code(200)
            .message("Data Mata Kuliah berhasil dihapus")
            .json({});
    } catch (error) {
        next(error);
    }
};
// =====================================================================
// KHUSUS MODUL OBE: CONTROLLER AMBIL DAFTAR CPL UNTUK CHECKBOX
// =====================================================================
// export const getCplMapping = async (req, res) => {
//     const mataKuliahId = req.params.id;
//     const responseBuilder = new ResponseBuilder(res);

//     try {
//         const data = await MataKuliahService.getCplForMapping(mataKuliahId);

//         return responseBuilder
//             .code(200)
//             .message("Berhasil mengambil daftar CPL untuk pemetaan")
//             .json(data);
//     } catch (error) {
//         return responseBuilder
//             .status('failure')
//             .code(500)
//             .message(error.message)
//             .json();
//     }
// };

// // =====================================================================
// // KHUSUS MODUL OBE: CONTROLLER SIMPAN PEMETAAN CPL
// // =====================================================================
// export const saveCplMapping = async (req, res) => {
//     const mataKuliahId = req.params.id;
//     const { cplIds } = req.body;
//     const responseBuilder = new ResponseBuilder(res);

//     try {
//         // 1. Tangkap datanya ke dalam variabel updatedData
//         const updatedData = await MataKuliahService.savePemetaanCpl(mataKuliahId, cplIds);

//         return responseBuilder
//             .code(200)
//             .message("Data Pemetaan CPL berhasil disimpan")
//             // 2. PASTIKAN updatedData ADA DI DALAM KURUNG INI 👇
//             .json(updatedData);

//     } catch (error) {
//         return responseBuilder.status('failure').code(500).message(error.message).json();
//     }
// };
export const getCplMapping = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await MataKuliahService.getCplForMapping(id);

        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil mengambil data pemetaan CPL")
            .json(data);
    } catch (error) {
        next(error);
    }
};

export const saveCplMapping = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { cplIds } = req.body;

        const data = await MataKuliahService.savePemetaanCpl(id, cplIds);

        return new ResponseBuilder(res)
            .code(200)
            .message("Pemetaan CPL berhasil diperbarui")
            .json(data);
    } catch (error) {
        next(error);
    }
};

export const clearCplMapping = async (req, res, next) => {
    try {
        const { id } = req.params;
        await MataKuliahService.deletePemetaanCpl(id);

        return new ResponseBuilder(res)
            .code(200)
            .message("Semua pemetaan CPL berhasil dihapus")
            .json({});
    } catch (error) {
        next(error);
    }
};
// --- 1. GET REKAP DISTRIBUSI SKS ---
export const fetchRekapDistribusiSks = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const { prodiId } = req.query;
        if (!prodiId) {
            throw new Error("Parameter prodiId wajib dikirim!");
        }

        const data = await mkKurikulumService.getRekapDistribusiSks(prodiId);
        return responseBuilder.code(200).message("Berhasil mengambil rekap distribusi SKS").json(data);
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

// --- 2. GET MATA KULIAH GROUP BY SEMESTER ---
export const fetchMataKuliahPerSemester = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const { prodiId, tahunKurikulumId } = req.query;

        if (!prodiId || !tahunKurikulumId) {
            throw new Error("Parameter prodiId dan tahunKurikulumId wajib dikirim!");
        }

        const courses = await mkKurikulumService.getMataKuliahPerSemester(prodiId, tahunKurikulumId);

        // Logic Grouping per Semester (dari kodingan Abang sebelumnya)
        const coursesGroupedBySemester = courses.reduce((acc, course) => {
            const semester = course.semester || 0; // Jaga-jaga kalau ada MK yang semesternya null
            const totalSks = course.total_sks || course.totalSks || 0;

            if (!acc[semester]) {
                acc[semester] = {
                    semester: semester,
                    totalSksSemester: 0,
                    mataKuliah: [],
                };
            }

            acc[semester].totalSksSemester += totalSks;
            acc[semester].mataKuliah.push(course);

            return acc;
        }, {});

        // Ubah object hasil reduce menjadi Array agar mudah dibaca Frontend
        const finalResponse = Object.values(coursesGroupedBySemester);

        return responseBuilder.code(200).message("Berhasil mengambil daftar mata kuliah per semester").json(finalResponse);
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};