import * as penilaianService from "../../services/penilaian.service.js";
import * as obeService from "../../services/obe.service.js";
import ResponseBuilder from "../../utils/response.js";

const { getDataLaporanPerkuliahan, getDataDaftarNilai } = penilaianService;

// =====================================================================
// 1. MODUL PENILAIAN & TEMPLATE (SKRIPSI SATRIA)
// =====================================================================

export const getDropdownMasterEvaluasi = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const data = await penilaianService.getDropdownMasterEvaluasi();
        return responseBuilder.code(200).message("Berhasil mengambil data master evaluasi").json(data);
    } catch (error) {
        return responseBuilder.status('failure').code(500).json(error.message);
    }
};

export const getDaftarTemplate = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const { page, limit, search } = req.query;
    try {
        const result = await penilaianService.getTemplateEvaluasiList(page, limit, search);
        return responseBuilder.code(200).message("Berhasil mengambil data template").json(result);
    } catch (error) {
        return responseBuilder.status('failure').code(500).json(error.message);
    }
};

export const getPesertaKelas = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const kelasId = req.params.kelasId;
    try {
        const data = await penilaianService.getPesertaKelasList(kelasId);
        return responseBuilder.code(200).message("Berhasil mengambil daftar peserta kelas").json(data);
    } catch (error) {
        return responseBuilder.status('failure').code(500).json(error.message);
    }
};

export const kunciNilaiKelas = async (req, res, next) => {
    try {
        const { kelasId } = req.params;
        const { action = 'kunci' } = req.body;
        if (!['kunci', 'buka'].includes(action)) {
            return new ResponseBuilder(res).code(400).message("action harus 'kunci' atau 'buka'").json();
        }
        const result = await penilaianService.kunciNilaiKelas(kelasId, action);
        const msg = action === 'kunci' ? 'Nilai seluruh mahasiswa berhasil dikunci' : 'Kunci nilai seluruh mahasiswa berhasil dibuka';
        return new ResponseBuilder(res).code(200).message(msg).json(result);
    } catch (error) { next(error); }
};

// Input nilai per CPMK langsung (OBE Langsung)
export const simpanNilaiPerCpmk = async (req, res, next) => {
    try {
        const { krsId } = req.params;
        const { nilaiCpmk } = req.body;
        if (!nilaiCpmk || !Array.isArray(nilaiCpmk)) {
            return new ResponseBuilder(res).code(400).message('nilaiCpmk harus berupa array [{ cpmkId, nilai }]').json();
        }
        const result = await penilaianService.inputNilaiPerCpmk(krsId, nilaiCpmk);
        return new ResponseBuilder(res).code(200).message('Nilai per CPMK berhasil disimpan').json(result);
    } catch (error) { next(error); }
};

export const finalisasiNilaiKelas = async (req, res, next) => {
    try {
        const { kelasId } = req.params;
        const result = await penilaianService.finalisasiNilaiKelas(kelasId);
        return new ResponseBuilder(res)
            .code(200)
            .message(result.pesan)
            .json(result);
    } catch (error) { next(error); }
};

export const kunciNilaiMahasiswa = async (req, res, next) => {
    try {
        const { rincianKrsId } = req.params;
        const { action = 'kunci' } = req.body;
        if (!['kunci', 'buka'].includes(action)) {
            return new ResponseBuilder(res).code(400).message("action harus 'kunci' atau 'buka'").json();
        }
        const result = await penilaianService.kunciNilaiSatuMahasiswa(rincianKrsId, action);
        const msg = action === 'kunci' ? 'Nilai mahasiswa berhasil dikunci' : 'Kunci nilai mahasiswa berhasil dibuka';
        return new ResponseBuilder(res).code(200).message(msg).json(result);
    } catch (error) { next(error); }
};

export const simpanNilaiMahasiswa = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const krsId = req.params.krsId;
    const arrNilai = req.body.nilai;
    try {
        await penilaianService.inputNilaiMahasiswa(krsId, arrNilai);
        const hasilAkhir = await penilaianService.hitungNilaiAkhir(krsId);
        return responseBuilder.code(200).message("Nilai berhasil disimpan").json(hasilAkhir);
    } catch (error) {
        return responseBuilder.status('failure').code(error.statusCode || 500).json(error.message);
    }
};

export const getRaporOBE = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const krsId = req.params.krsId;
    try {
        const rapor = await penilaianService.getRaporOBEMahasiswa(krsId);
        return responseBuilder.code(200).message("Berhasil mengambil rapor OBE").json(rapor);
    } catch (error) {
        return responseBuilder.status('failure').code(500).json(error.message);
    }
};

// =====================================================================
// 2. MODUL MANAJEMEN OBE (SISTEM LAMA: PROFIL LULUSAN, CPL, CPMK)
// =====================================================================

export const getProfilLulusan = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const data = await obeService.getProfilLulusan(req.params.obeId);
        responseBuilder.code(200).json(data);
    } catch (error) {
        responseBuilder.status('failure').code(500).json(error.message);
    }
};

export const createProfilLulusan = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        await obeService.createProfilLulusan(req.params.obeId, req.body);
        responseBuilder.code(201).message("Berhasil menambah data").json();
    } catch (error) {
        responseBuilder.status('failure').code(500).json(error.message);
    }
};

export const updateProfilLulusan = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        await obeService.updateProfilLulusan(req.params.obeId, req.params.plId, req.body);
        responseBuilder.code(200).message("Berhasil merubah data").json();
    } catch (error) {
        responseBuilder.status('failure').code(500).json(error.message);
    }
};

export const deleteProfilLulusan = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        await obeService.deleteProfilLulusan(req.params.obeId, req.params.plId);
        responseBuilder.code(200).message("Berhasil menghapus data").json();
    } catch (error) {
        responseBuilder.status('failure').code(500).json(error.message);
    }
};

export const getCapaianPembelajaranLulusan = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const data = await obeService.getCapaianPembelajaranLulusan(req.params.obeId);
        responseBuilder.code(200).json(data);
    } catch (error) {
        responseBuilder.status('failure').code(500).json(error.message);
    }
};

export const createCapaianPembelajaranLulusan = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        await obeService.createCapaianPembelajaranLulusan(req.params.obeId, req.body);
        responseBuilder.code(201).message("Berhasil menambah data CPL").json();
    } catch (error) {
        responseBuilder.status('failure').code(500).json(error.message);
    }
};

export const updateCapaianPembelajaraanLulusan = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        await obeService.updateCapaianPembelajaraanLulusan(req.params.obeId, req.params.cplId, req.body);
        responseBuilder.code(200).json();
    } catch (error) {
        responseBuilder.status('failure').code(500).json(error.message);
    }
};

export const deleteCapaianPembelajaranLulusan = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        await obeService.deleteCapaianPembelajaranLulusan(req.params.obeId, req.params.cplId);
        responseBuilder.code(200).json();
    } catch (error) {
        responseBuilder.status('failure').code(500).json(error.message);
    }
};

export const createPemetaanPlCpl = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        await obeService.createPemetaanPlCpl(req.body.cplId, req.body.dataPemetaan);
        responseBuilder.code(201).json();
    } catch (error) {
        responseBuilder.status('failure').code(500).json(error.message);
    }
};

export const getCapaianMataKuliah = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        const data = await obeService.getCapaianMataKuliah(req.params.obeId, req.params.mataKuliahId);
        responseBuilder.code(200).json(data);
    } catch (error) {
        responseBuilder.status('failure').code(500).json(error.message);
    }
};

export const createCapaianMataKuliah = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        await obeService.createCapaianMataKuliah(req.params.obeId, req.params.mataKuliahId, req.body);
        responseBuilder.code(201).json();
    } catch (error) {
        responseBuilder.status('failure').code(500).json(error.message);
    }
};

export const updateCapaianMataKuliah = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        await obeService.updateCapaianMataKuliah(req.params.obeId, req.params.mataKuliahId, req.params.cpmkId, req.body);
        responseBuilder.code(200).json();
    } catch (error) {
        responseBuilder.status('failure').code(500).json(error.message);
    }
};

export const deleteCapaianMataKuliah = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        await obeService.deleteCapaianMataKuliah(req.params.obeId, req.params.cpmkId);
        responseBuilder.code(200).json();
    } catch (error) {
        responseBuilder.status('failure').code(500).json(error.message);
    }
};

export const injectKrsTester = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const { id_mhs, id_periode, id_kelas } = req.body;
    try {
        const models = (await import('../../models/index.js')).default;
        const krs = await models.KrsMahasiswa.create({
            siakMahasiswaId: id_mhs,
            siakPeriodeAkademikId: id_periode,
            status: "Disetujui",
            sksDiambil: 3,
            semester: 1
        });
        await models.RincianKrsMahasiswa.create({
            siakKrsMahasiswaId: krs.id,
            siakKelasKuliahId: id_kelas,
            status: "Disetujui"
        });
        return responseBuilder.code(200).message("Mahasiswa berhasil dimasukkan ke KRS Kelas!").json({ id_krs: krs.id });
    } catch (error) {
        return responseBuilder.status('failure').code(500).json(error.message);
    }
};

// =====================================================================
// 3. LAPORAN NILAI
// =====================================================================

/**
 * GET /api/akademik/dosen/kelas/:kelasId/laporan/perkuliahan
 * → JSON: detail nilai per komponen evaluasi + rata-rata kelas
 */
// ============================================================
// RESET CONTROLLERS (DEV/TESTING ONLY)
// ============================================================

export const resetFinalisasiKelas = async (req, res, next) => {
    try {
        const { kelasId } = req.params;
        const result = await penilaianService.resetFinalisasiKelas(kelasId);
        return new ResponseBuilder(res).code(200).message(result.pesan).json(result);
    } catch (error) { next(error); }
};

export const resetNilaiMahasiswa = async (req, res, next) => {
    try {
        const { rincianKrsId } = req.params;
        const result = await penilaianService.resetNilaiMahasiswa(rincianKrsId);
        return new ResponseBuilder(res).code(200).message(result.pesan).json(result);
    } catch (error) { next(error); }
};

export const resetNilaiKelas = async (req, res, next) => {
    try {
        const { kelasId } = req.params;
        const result = await penilaianService.resetNilaiKelas(kelasId);
        return new ResponseBuilder(res).code(200).message(result.pesan).json(result);
    } catch (error) { next(error); }
};

export const getLaporanPerkuliahan = async (req, res, next) => {
    try {
        const data = await penilaianService.getDataLaporanPerkuliahan(req.params.kelasId);
        return new ResponseBuilder(res).code(200).message("Berhasil mengambil data laporan nilai perkuliahan").json(data);
    } catch (error) { next(error); }
};

/**
 * GET /api/akademik/dosen/kelas/:kelasId/laporan/daftar-nilai
 * → JSON: daftar nilai akhir + huruf mutu per mahasiswa
 */
export const getLaporanDaftarNilai = async (req, res, next) => {
    try {
        const data = await penilaianService.getDataDaftarNilai(req.params.kelasId);
        return new ResponseBuilder(res).code(200).message("Berhasil mengambil daftar nilai mahasiswa").json(data);
    } catch (error) { next(error); }
};
