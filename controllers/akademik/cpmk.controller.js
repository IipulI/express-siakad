import * as CpmkService from "../../services/cpmk.service.js";
import ResponseBuilder from "../../utils/response.js";

export const getFormPemetaanCpmk = async (req, res) => {
    const mataKuliahId = req.params.id;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const data = await CpmkService.getFormPemetaanCpmk(mataKuliahId);
        return responseBuilder.code(200).message("Berhasil mengambil data form CPMK").json(data);
    } catch (error) {
        return responseBuilder.status('failure').code(500).message(error.message).json();
    }
};

export const savePemetaanCpmk = async (req, res) => {
    const mataKuliahId = req.params.id;
    const payload = req.body; 
    const responseBuilder = new ResponseBuilder(res);

    try {
        const updatedData = await CpmkService.savePemetaanCpmk(mataKuliahId, payload);
        return responseBuilder.code(200).message("Data CPMK berhasil disimpan").json(updatedData);
    } catch (error) {
        return responseBuilder.status('failure').code(500).message(error.message).json();
    }
};