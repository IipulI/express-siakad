import * as cbtService from '../../services/cbt.service.js';
import ResponseBuilder from "../../utils/response.js";

// Jalur D — terima breakdown nilai mentah per Sub-CPMK dari CBT (per komponen).
// TIDAK ADA nilaiAkhir di sini -- itu lewat postNilaiAkhirDariCbt, sengaja dipisah.
export const postNilaiDariCbt = async (req, res, next) => {
    try {
        const { rencanaEvaluasiId } = req.params;
        const { daftarNilai } = req.body;
        const data = await cbtService.simpanNilaiKomponenDariCbt(rencanaEvaluasiId, daftarNilai);
        return new ResponseBuilder(res).code(200).message(`Nilai dari CBT berhasil disimpan untuk ${data.length} mahasiswa`).json(data);
    } catch (error) { next(error); }
};

// Jalur D — sinkron nilai akhir + huruf mutu + angka mutu MK dari CBT, langsung
// tulis ke RincianKrsMahasiswa TANPA dihitung ulang dari komponen.
export const postNilaiAkhirDariCbt = async (req, res, next) => {
    try {
        const { daftarNilai } = req.body;
        const data = await cbtService.simpanNilaiAkhirDariCbt(daftarNilai);
        return new ResponseBuilder(res).code(200).message(`Nilai akhir dari CBT berhasil disinkron untuk ${data.length} mahasiswa`).json(data);
    } catch (error) { next(error); }
};

// Jalur D — lihat nilai yang sudah masuk dari CBT untuk 1 komponen (plus peringatan duplikat)
export const getNilaiDariCbt = async (req, res, next) => {
    try {
        const { rencanaEvaluasiId } = req.params;
        const data = await cbtService.getNilaiDariCbt(rencanaEvaluasiId);
        return new ResponseBuilder(res).code(200).message("Berhasil mengambil nilai dari CBT").json(data);
    } catch (error) { next(error); }
};

// Jalur D — reset kontribusi 1 komponen SAJA utk 1 mahasiswa (bukan semua nilai)
export const deleteNilaiKomponenCbt = async (req, res, next) => {
    try {
        const { rencanaEvaluasiId, krsId } = req.params;
        const data = await cbtService.resetNilaiKomponenCbt(krsId, rencanaEvaluasiId);
        return new ResponseBuilder(res).code(200).message(data.pesan).json(data);
    } catch (error) { next(error); }
};
