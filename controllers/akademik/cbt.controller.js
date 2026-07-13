import * as cbtService from '../../services/cbt.service.js';
import ResponseBuilder from "../../utils/response.js";

// Jalur D — terima nilai akhir komponen + breakdown nilai mentah per Sub-CPMK dari CBT
export const postNilaiDariCbt = async (req, res, next) => {
    try {
        const { rencanaEvaluasiId } = req.params;
        const { daftarNilai } = req.body;
        const data = await cbtService.simpanNilaiKomponenDariCbt(rencanaEvaluasiId, daftarNilai);
        return new ResponseBuilder(res).code(200).message(`Nilai dari CBT berhasil disimpan untuk ${data.length} mahasiswa`).json(data);
    } catch (error) { next(error); }
};
