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

export const testEndpoint = async (req, res) => {
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
        res.status(200).json({
            message: "Successfully retrieved available courses for KRS.",
            data: courses,
        });
    } catch (error) {
        // Send an error response if something goes wrong
        console.error("Error in handleGetAvailableKrs:", error);
        res.status(500).json({
            message: "An error occurred while fetching available courses.",
            error: error.message,
        });
    }
};