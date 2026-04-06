import * as MataKuliahService from "../../services/mata-kuliah.service.js";
import ResponseBuilder from "../../utils/response.js";
import {getPagingData} from "../../utils/pagination.js";

export const findAll = async (req, res) => {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const size = req.query.size ? parseInt(req.query.size) : null;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await MataKuliahService.findAll(page, size);

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

export const create = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);

    try {
        // PERBAIKAN: Tangkap hasil return dari Service ke dalam variabel newData
        const newData = await MataKuliahService.createMataKuliah(req.body);

        responseBuilder
            .code(201)
            .message("Data Mata Kuliah berhasil dibuat")
            // PERBAIKAN: Masukkan newData ke dalam response json
            .json(newData); 
    }
    catch (error) {
        if(error.message.includes('already exists')) {
            return responseBuilder
                .status('failure')
                .code(409)
                .message(error.message)
                .json();
        }

        responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || 'Terjadi kesalahan yang tidak terduga')
            .json();
    }
}
export const update = async (req, res) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res);

    try {
        // PERBAIKAN: Tangkap data yang dikembalikan oleh Service
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

    try {
        const isDeleted = await MataKuliahService.deleteMataKuliah(id)

        if (isDeleted) {
            return res.status(204).end();
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

export const getDaftarMataKuliahObe = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const { page = 1, size = 10, search, prodiId, tahunKurikulumId, jenis, kelompokId } = req.query;
        
        const data = await MataKuliahService.getListMataKuliahObe(
            page, size, search, prodiId, tahunKurikulumId, jenis, kelompokId
        );
        
        return responseBuilder.code(200).message("Berhasil mengambil daftar mata kuliah OBE").json(data);
    } catch (error) {
        return responseBuilder.status('failure').code(500).message(error.message).json();
    }
};
export const getDetailMataKuliahObe = async (req, res) => {
    const id = req.params.id;
    const responseBuilder = new ResponseBuilder(res);
    try {
        const data = await MataKuliahService.getDetailMataKuliahObe(id);
        return responseBuilder.code(200).message("Berhasil mengambil detail mata kuliah OBE").json(data);
    } catch (error) {
        return responseBuilder.status('failure').code(500).message(error.message).json();
    }
};
// =====================================================================
// KHUSUS MODUL OBE: CONTROLLER AMBIL DAFTAR CPL UNTUK CHECKBOX
// =====================================================================
export const getCplMapping = async (req, res) => {
    const mataKuliahId = req.params.id;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await MataKuliahService.getCplForMapping(mataKuliahId);
        
        return responseBuilder
            .code(200)
            .message("Berhasil mengambil daftar CPL untuk pemetaan")
            .json(data);
    } catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message(error.message)
            .json();
    }
};

// =====================================================================
// KHUSUS MODUL OBE: CONTROLLER SIMPAN PEMETAAN CPL
// =====================================================================
export const saveCplMapping = async (req, res) => {
    const mataKuliahId = req.params.id;
    const { cplIds } = req.body; 
    const responseBuilder = new ResponseBuilder(res);

    try {
        // 1. Tangkap datanya ke dalam variabel updatedData
        const updatedData = await MataKuliahService.savePemetaanCpl(mataKuliahId, cplIds);
        
        return responseBuilder
            .code(200)
            .message("Data Pemetaan CPL berhasil disimpan")
            // 2. PASTIKAN updatedData ADA DI DALAM KURUNG INI 👇
            .json(updatedData); 
            
    } catch (error) {
        return responseBuilder.status('failure').code(500).message(error.message).json();
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