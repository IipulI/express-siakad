import * as obeService from "../../services/obe.service.js"
import ResponseBuilder from "../../utils/response.js";

export const getProfilLulusan = async (req, res) => {
    const responseBuilder =  new ResponseBuilder(res)
    const obeId = req.params.obeId

    try {
        const data = await obeService.getProfilLulusan(obeId)

        responseBuilder
            .code(200)
            .message("Berhasil mengambil data")
            .json(data)
    }
    catch (error) {
        responseBuilder
            .status('failure')
            .code(500)
            .message("Gagal mengambil data")
            .json(error.message)
    }
}

export const createProfilLulusan = async(req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    const obeId = req.params.obeId
    const body = req.body

    try {
        const promise = await obeService.createProfilLulusan(obeId, body)

        if(promise) {
            responseBuilder
                .code(200)
                .message("Berhasil menambah data")
                .json()
        } else {
            responseBuilder
                .status('failure')
                .code(500)
                .message("Gagal menambah data")
                .json(error.message)
        }
    }
    catch (error) {
        responseBuilder
            .status('failure')
            .code(500)
            .message("Gagal menambah data")
            .json(error.message)
    }
}

export const updateProfilLulusan = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    const obeId = req.params.obeId
    const plId = req.params.plId
    const body = req.body

    try {
        const promise = await obeService.updateProfilLulusan(obeId, plId, body)

        if(promise) {
            responseBuilder
                .code(200)
                .message("Berhasil merubah data")
                .json()
        } else {
            responseBuilder
                .status('failure')
                .code(500)
                .message("Gagal merubah data")
                .json(error.message)
        }
    }
    catch (error) {
        responseBuilder
            .status('failure')
            .code(500)
            .message("Gagal merubah data")
            .json(error.message)
    }
}

export const deleteProfilLulusan = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    const obeId = req.params.obeId
    const plId = req.params.plId

    try {
        const promise = await obeService.deleteProfilLulusan(obeId, plId)

        if (promise) {
            responseBuilder
                .code(200)
                .message("Berhasil menghapus data")
                .json()
        } else {
            responseBuilder
                .status('failure')
                .code(500)
                .message("Gagal menghapus data")
                .json()
        }
    }
    catch (error) {
        responseBuilder
            .status('failure')
            .code(500)
            .message("Gagal menghapus data")
            .json(error.message)
    }
}


export const getCapaianPembelajaranLulusan = async(req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    const obeId = req.params.obeId

    try {
        const data = await obeService.getCapaianPembelajaranLulusan(obeId)

        responseBuilder
            .code(200)
            .message("Berhasil mengambil data")
            .json(data)
    }
    catch (error) {
        responseBuilder
            .status('failure')
            .code(500)
            .message("Gagal mengambil data")
            .json(error.message)
    }
}

export const createCapaianPembelajaranLulusan = async(req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    const obeId = req.params.obeId;
    const data = req.body;

    try {
        await obeService.createCapaianPembelajaranLulusan(obeId, data)

        responseBuilder
            .code(201)
            .message("Berhasil menambahkan data profil lulusan")
            .json()
    }
    catch (error){
        responseBuilder
            .status('failure')
            .code(500)
            .message("Gagal menambahkan data")
            .json(error.message)
    }
}

export const updateCapaianPembelajaraanLulusan = async(req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    const obeId = req.params.obeId;
    const cplId = req.params.cplId;
    const data = req.body;

    try {
        const promise = await obeService.updateCapaianPembelajaraanLulusan(obeId, cplId, data)

        if (promise) {
            responseBuilder
                .code(200)
                .message("Berhasil merubah data")
                .json()
        } else {
            responseBuilder
                .code(500)
                .message("Gagal merubah data")
                .json()
        }
    }
    catch (error){
        responseBuilder
            .status('failure')
            .code(500)
            .message("Gagal merubah data")
            .json(error.message)
    }
}

export const deleteCapaianPembelajaranLulusan = async(req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    const obeId = req.params.obeId;
    const cplId = req.params.cplId;

    try {
        const promise = await obeService.deleteCapaianPembelajaranLulusan(obeId, cplId)

        if (promise) {
            responseBuilder
                .code(200)
                .message("Berhasil menghapus data")
                .json()
        } else {
            responseBuilder
                .status('failure')
                .code(500)
                .message("Gagal menghapus data")
                .json()
        }
    }
    catch (error) {
        responseBuilder
            .status('failure')
            .code(500)
            .message("Gagal menghapus data")
            .json(error.message)
    }
}

export const getCapaianMataKuliah = async(req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    const obeId = req.params.obeId;
    const mataKuliahId = req.params.mataKuliahId

    try {
        const data = await obeService.getCapaianMataKuliah(obeId, mataKuliahId)

        responseBuilder
            .code(200)
            .message("Berhasil mengambil data")
            .json(data)
    }
    catch (error) {
        responseBuilder
            .status('failure')
            .code(500)
            .message("Gagal mengambil data")
            .json(error.message)
    }
}

export const createCapaianMataKuliah = async(req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const obeId = req.params.obeId;
    const mataKuliahId = req.params.mataKuliahId;

    try {
        const create = await obeService.createCapaianMataKuliah(obeId, mataKuliahId, req.body)

        if (create) {
            responseBuilder
                .code(201)
                .message("Berhasil menambahkan data capaian mata kuliah")
                .json()
        } else {
            responseBuilder
                .status('failure')
                .code(500)
                .message("Gagal mengambil data")
                .json("Terjadi kesalahan")
        }
    }
    catch (error) {
        responseBuilder
            .status('failure')
            .code(500)
            .message("Gagal merubah data")
            .json(error.message)
    }
}

export const updateCapaianMataKuliah = async(req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const obeId = req.params.obeId;
    const mataKuliahId = req.params.mataKuliahId;
    const cmpkId = req.params.cmpkId;

    try {
        const update = await obeService.updateCapaianMataKuliah(obeId, mataKuliahId, cmpkId, req.body)

        if (update) {
            responseBuilder
                .code(200)
                .message("Berhasil merubah data")
                .json()
        } else {
            responseBuilder
                .status('failure')
                .code(500)
                .message("Gagal merubah data")
                .json()
        }
    }
    catch (error) {
        responseBuilder
            .status('failure')
            .code(500)
            .message("Gagal merubah data")
            .json(error.message)
    }
}

export const deleteCapaianMataKuliah = async (req,res) => {
    const responseBuilder = new ResponseBuilder(res);
    const obeId = req.params.obeId;
    const cpmkId = req.params.cpmkId;

    try {
        const promise = await obeService.deleteCapaianMataKuliah(obeId, cpmkId)

        if (promise) {
            responseBuilder
                .code(200)
                .message("Berhasil menghapus data")
                .json()
        } else {
            responseBuilder
                .status('failure')
                .code(500)
                .message("Gagal menghapus data")
                .json()
        }
    }
    catch (error) {
        responseBuilder
            .status('failure')
            .code(500)
            .message("Gagal menghapus data")
            .json(error.message)
    }
}