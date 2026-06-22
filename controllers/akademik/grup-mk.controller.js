import * as grupMkService from '../../services/grup-mk.service.js';
import ResponseBuilder from "../../utils/response.js";

// export const getOptions = async (req, res) => {
//     try {
//         const data = await grupMkService.getFilterOptions();
//         return res.status(200).json({ status: 200, message: "OK", data });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message });
//     }
// };
export const getOptions = async (req, res, next) => {
    try {
        const data = await grupMkService.getFilterOptions();
        return new ResponseBuilder(res).code(200).message("OK").json(data);
    } catch (error) { next(error); }
};

// export const getTableData = async (req, res) => {
//     try {
//         const { kurikulumId, grupId } = req.query;
//         const data = await grupMkService.getMappedCourses(kurikulumId, grupId);
//         return res.status(200).json({ status: 200, message: "OK", data });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message });
//     }
// };
export const getTableData = async (req, res, next) => {
    try {
        const data = await grupMkService.getMappedCourses(req.query);
        return new ResponseBuilder(res).code(200).message("OK").json(data);
    } catch (error) { next(error); }
};

// export const getSearchOptions = async (req, res) => {
//     try {
//         const { kurikulumId } = req.query;
//         if (!kurikulumId) throw new Error("Kurikulum ID wajib dikirim untuk pencarian MK");
//         const data = await grupMkService.getUnmappedCourses(kurikulumId);
//         return res.status(200).json({ status: 200, message: "OK", data });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message });
//     }
// };

export const getSearchOptions = async (req, res, next) => {
    try {
        const { kurikulumId } = req.query;
        const data = await grupMkService.getUnmappedCourses(kurikulumId);
        return new ResponseBuilder(res).code(200).message("OK").json(data);
    } catch (error) { next(error); }
};



// export const saveToGroup = async (req, res) => {
//     try {
//         const { mkId, grupId } = req.body;
//         if (!mkId || !grupId) throw new Error("Mata Kuliah ID dan Grup ID wajib diisi");
        
//         await grupMkService.addCourseToGroup(mkId, grupId);
//         return res.status(200).json({ status: 200, message: "Berhasil menambahkan Mata Kuliah ke Grup" });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message });
//     }
// };
export const saveToGroup = async (req, res, next) => {
    try {
        const { mkId, grupId } = req.body;
        await grupMkService.addCourseToGroup(mkId, grupId);
        return new ResponseBuilder(res).code(200).message("Berhasil menambahkan MK ke Grup").json();
    } catch (error) { next(error); }
};


// export const removeFromGroup = async (req, res) => {
//     try {
//         await grupMkService.removeCourseFromGroup(req.params.mkId);
//         return res.status(200).json({ status: 200, message: "Berhasil mengeluarkan Mata Kuliah dari Grup" });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message });
//     }
// };

export const removeFromGroup = async (req, res, next) => {
    try {
        await grupMkService.removeCourseFromGroup(req.params.mkId);
        return new ResponseBuilder(res).code(200).message("Berhasil mengeluarkan MK dari Grup").json();
    } catch (error) { next(error); }
};