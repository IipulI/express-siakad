import * as KrsMahasiswaService from "../../services/krs-mahasiswa.service.js"
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";

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

export const submitKrs = async(req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    const siakKrsId = req.body.siakKrsId

    try {
        const user = req.user;
        const mahasiswa = user?.mahasiswa;

        const updateData = await KrsMahasiswaService.submitKrs(siakKrsId, mahasiswa.id)

        console.log(updateData)

        if (updateData) {
            responseBuilder
                .code(200)
                .message("Berhasil mengajukan krs")
                .json()
        } else {
            responseBuilder
                .status('failure')
                .code(500)
                .message("Gagal mengajukan krs")
        }

    }
    catch (error) {
        console.log("Terdapat error di ketika submit krs : ", error);
        responseBuilder
            .status('failure')
            .code(500)
            .json(error.message)
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

