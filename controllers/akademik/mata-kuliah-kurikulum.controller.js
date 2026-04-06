import * as mkKurikulumService from '../../services/mata-kuliah-kurikulum.service.js';
import ResponseBuilder from "../../utils/response.js";

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