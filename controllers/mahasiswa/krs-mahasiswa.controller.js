import * as KrsMahasiswaService from "../../services/krs-mahasiswa.service.js"
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";

// export const testEndpoints = async (req, res) =>{
//     const user = req.user
//     const mahasiswa = user.mahasiswa
//     const keyword = req.query.keyword
//
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         // 1. Get the parameters from the URL
//         const mahasiswaId = mahasiswa.id;
//
//         // 2. Call the service function with the parameters
//         const courses = await getAvailableKrs(mahasiswaId, periodeId);
//
//         // 3. Send a successful response with the data
//         res.status(200).json({
//             message: "Successfully retrieved available courses for KRS.",
//             data: courses,
//         });
//     } catch (error) {
//         // 4. Handle any errors that occur
//         console.error("Error getting available KRS:", error);
//         res.status(500).json({
//             message: "An error occurred while fetching available courses.",
//             error: error.message,
//         });
//     }
// }

export const getAvailableKrs = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res)

    try {
        const user = req.user
        const mahasiswa = user.mahasiswa
        let semesters

        // Get optional filter parameters from the URL query string
        const { search } = req.query;

        if (mahasiswa.semester % 2 === 0) {
            semesters = [2,4,6,8,10,12,14]
        } else {
            semesters = [1,3,5,7,9,11,13,15]
        }

        // Call the service with all the necessary parameters
        const courses = await KrsMahasiswaService.getAvailableKrs(mahasiswa.id, search, semesters);

        // Send a successful response
        responseBuilder
            .code(200)
            .message("Successfully retrieve data")
            .json(courses)
    } catch (error) {
        // Send an error response if something goes wrong
        console.error("Error in handleGetAvailableKrs:", error);
        responseBuilder
            .code(500)
            .message("Failed to retrieve data")
            .json(error)
    }
};

export const saveKrs = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    const kelasKuliahIds = req.body.kelasKuliahIds

    try {
        const user = req.user
        const mahasiswa = user.mahasiswa

        const data = await KrsMahasiswaService.saveKrs(mahasiswa.id, kelasKuliahIds)

        responseBuilder
            .code(201)
            .message("Successfully update data")
            .json(data)
    }
    catch (error) {
        console.log("Error in handleSaveKrs:", error);
        responseBuilder
            .status('failure')
            .code(500)
            .message("Failed to retrieve data")
            .json(error)
    }
}

export const updateKrs = async(req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    const kelasKuliahIds = req.body.kelasKuliahIds
    const krsId = req.params.id

    try {
        const data = await KrsMahasiswaService.updateKrs(krsId, kelasKuliahIds)

        responseBuilder
            .code(201)
            .message("Successfully update data")
            .json(data)
    }
    catch (error) {
        console.log("Error in handleSaveKrs:", error);
        responseBuilder
            .status('failure')
            .code(500)
            .message("Failed to retrieve data")
            .json(error)
    }
}

export const deleteKrs = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    const kelasKuliahIds = req.body.kelasKuliahIds
    const krsId = req.params.id

    try {
        await KrsMahasiswaService.deleteKrs(krsId, kelasKuliahIds)

        responseBuilder
            .code(200)
            .message("Successfully delete data")
            .json()
    }
    catch (error) {
        console.log("Error in handleDeleteKrs:", error);
        responseBuilder
            .status('failure')
            .code(500)
            .message("Failed to retrieve data")
            .json(error)
    }
}

export const savedKrs = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    try {
        const user = req.user
        const mahasiswa = user.mahasiswa

        const savedStudentKrs = await KrsMahasiswaService.savedKrs(mahasiswa.id)

        responseBuilder
            .code(200)
            .message("Successfully retrieve data")
            .json(savedStudentKrs)
    }
    catch (error) {
        console.log("Error in savedKrs", error)
        responseBuilder
            .code(500)
            .message("Failed to retrieve data")
            .json(error)
    }
}

