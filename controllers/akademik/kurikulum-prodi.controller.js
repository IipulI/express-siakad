import * as KurikulumProdiService from '../../services/kurikulum-prodi.service.js'
import ResponseBuilder from "../../utils/response.js";

export const fetchKurikulumProdi = async (req, res) => {
    const programStudiId = req.query.siakProgramStudiId
    const tahunKurikulumId = req.query.siakTahunKurikulumId

    if (!programStudiId || !tahunKurikulumId) {
        throw new Error(`Program studi and tahun kurikulum is required`)
    }

    const responseBuilder = new ResponseBuilder(res);

    try {
        const courses = await KurikulumProdiService.fetchKurikulumProdi(programStudiId, tahunKurikulumId)

        const coursesGroupedBySemester = courses.reduce((acc, course) => {
            const { semester, totalSks } = course;
            if (!acc[semester]) {
                acc[semester] = {
                    semester,
                    mataKuliah: [],
                    totalSks: 0,
                };
            }
            acc[semester].totalSks += totalSks

            acc[semester].mataKuliah.push(course);
            return acc;
        }, {});

        const finalResponse = Object.values(coursesGroupedBySemester);

        return  responseBuilder
            .code(200)
            .message("Data berhasil diambil")
            .json(finalResponse)
    }
    catch (error) {
        return responseBuilder
            .status("failure")
            .code(500)
            .message(error.message || 'Terjadi kesalahan tak terduga.')
            .json();
    }
}

export const addCourseToKurikulumProdi = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const id = req.params.id;

    try {
        await KurikulumProdiService.addCourseToKurikulumProdi(id, req.body)

        return responseBuilder
            .code(200)
            .message("Data berhasil diperbarui")
            .json();
    }
    catch (error) {
        return responseBuilder
            .status("failure")
            .code(500)
            .message(error.message || 'Terjadi kesalahan tak terduga')
            .json();
    }
}

export const deleteCourseFromKurikulumProdi = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const id = req.params.id;

    try {
        await KurikulumProdiService.deleteCourseFromKurikulumProdi(id)

        return responseBuilder
            .status('success')
            .code(200)
            .message("Data berhasil diperbarui")
            .json();
    }
    catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message(error.message)
            .json()
    }
}