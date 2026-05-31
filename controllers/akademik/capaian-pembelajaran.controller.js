import * as CapaianService from '../../services/capaian-pembelajaran.service.js';
import ResponseBuilder from '../../utils/response.js';

// ============================================================
// GET: Capaian Pembelajaran — Tab CPMK
// URL: GET /api/akademik/dosen/kelas/:kelasId/capaian?tab=cpmk
// URL: GET /api/akademik/koordinator-mk/kelas/:kelasId/capaian?tab=cpmk
//
// Sesuai halaman Capaian Pembelajaran tab CPMK di docs:
// Tabel: No | NIM | Nama Mahasiswa | Angkatan | CPMK041 | ... | Status Capaian
// Plus: deskripsi CPMK, target CPMK, rerata perolehan
// ============================================================
export const getCapaianCpmk = async (req, res, next) => {
    try {
        const { kelasId } = req.params;
        const data = await CapaianService.getCapaianCpmkKelas(kelasId);

        return new ResponseBuilder(res)
            .code(200)
            .message('Berhasil mengambil Capaian Pembelajaran CPMK')
            .json(data);
    } catch (error) { next(error); }
};

// ============================================================
// GET: Capaian Pembelajaran — Tab CPL
// URL: GET /api/akademik/dosen/kelas/:kelasId/capaian?tab=cpl
// URL: GET /api/akademik/koordinator-mk/kelas/:kelasId/capaian?tab=cpl
//
// Sesuai halaman Capaian Pembelajaran tab CPL di docs:
// CATATAN: Tampil penuh hanya setelah nilai dikunci
// Tabel: No | NIM | Nama Mahasiswa | Angkatan | CPL04 | CPL06
// Plus: deskripsi CPL, target CPL, rerata perolehan
// ============================================================
export const getCapaianCpl = async (req, res, next) => {
    try {
        const { kelasId } = req.params;
        const data = await CapaianService.getCapaianCplKelas(kelasId);

        return new ResponseBuilder(res)
            .code(200)
            .message('Berhasil mengambil Capaian Pembelajaran CPL')
            .json(data);
    } catch (error) { next(error); }
};

// ============================================================
// GET: Capaian Pembelajaran — handler utama (tab dari query)
// URL: GET /api/akademik/dosen/kelas/:kelasId/capaian?tab=cpmk
// URL: GET /api/akademik/dosen/kelas/:kelasId/capaian?tab=cpl
//
// Satu endpoint untuk kedua tab, frontend tentukan lewat ?tab=
// ============================================================
export const getCapaianPembelajaran = async (req, res, next) => {
    try {
        const { kelasId } = req.params;
        const tab = req.query.tab || 'cpmk';

        let data;
        if (tab === 'cpl') {
            data = await CapaianService.getCapaianCplKelas(kelasId);
        } else {
            data = await CapaianService.getCapaianCpmkKelas(kelasId);
        }

        return new ResponseBuilder(res)
            .code(200)
            .message(`Berhasil mengambil Capaian Pembelajaran (${tab.toUpperCase()})`)
            .json(data);
    } catch (error) { next(error); }
};

// ============================================================
// GET: RPS dari Kelas
// URL: GET /api/akademik/dosen/kelas/:kelasId/rps
//
// Sesuai tab RPS di docs:
// Tampil: Tujuan Instruksional Umum, Bahan Ajar, Dokumen RPS (link)
// ============================================================
export const getRpsFromKelas = async (req, res, next) => {
    try {
        const { kelasId } = req.params;
        const { periodeId } = req.query;

        const data = await CapaianService.getRpsFromKelas(kelasId, periodeId);

        return new ResponseBuilder(res)
            .code(200)
            .message('Berhasil mengambil RPS')
            .json(data);
    } catch (error) { next(error); }
};