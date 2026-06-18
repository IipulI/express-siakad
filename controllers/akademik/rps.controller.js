import ExcelJS from 'exceljs';
import * as rpsService from "../../services/rps.service.js";
import ResponseBuilder from "../../utils/response.js";

// =========================================================
// TEMPLATE / IMPORT EXCEL: Rencana Pembelajaran
// =========================================================
const HEADER_RENCANA_PEMBELAJARAN = [
    'Pertemuan Ke-',
    'CPMK & Sub-CPMK',
    'ID Jenis Pertemuan (Lihat Daftar Jenis Pertemuan)',
    'Materi Pembelajaran (IND)',
    'Materi Pembelajaran (EN)',
    'Indikator Penilaian',
    'Bentuk & Kriteria Penilaian',
    'Metode Pembelajaran Luring',
    'Metode Pembelajaran Daring',
    'Bobot Penilaian (%)'
];
const COL_WIDTH_RENCANA_PEMBELAJARAN = [12, 30, 25, 40, 40, 30, 30, 25, 25, 14];

const HEADER_BG = 'FF0C4781';

function buildRencanaPembelajaranSheet(workbook, rows = []) {
    const ws = workbook.addWorksheet('Rencana Pembelajaran');
    const headerRow = ws.addRow(HEADER_RENCANA_PEMBELAJARAN);
    headerRow.eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_BG } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    headerRow.height = 30;

    rows.forEach(r => {
        ws.addRow([
            r.sesi, r.cpmk, r.jenisPertemuan, r.materiIndo, r.materiEng,
            r.indikator, r.kriteria, r.luring, r.daring, r.bobot
        ]);
    });

    COL_WIDTH_RENCANA_PEMBELAJARAN.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
    return ws;
}

function buildDaftarJenisPertemuanSheet(workbook) {
    const ws = workbook.addWorksheet('Daftar Jenis Pertemuan');
    const header = ws.addRow(['Jenis Pertemuan']);
    header.font = { bold: true };
    ['Kuliah', 'Blok', 'Kuliah Kerja Lapangan', 'Kuliah Kerja Nyata (KKN)', 'Kerja Praktik',
     'Magang Kerja', 'Praktikum', 'Praktik Kerja Lapangan', 'Proposal Skripsi', 'Skripsi',
     'Stase (Kedokteran)'].forEach(j => ws.addRow([j]));
    ws.getColumn(1).width = 30;
    return ws;
}

function buildDaftarCpmkSheet(workbook, cpmkList = []) {
    const ws = workbook.addWorksheet('Daftar CPMK & Sub-CPMK');
    const header = ws.addRow(['Kode', 'Deskripsi']);
    header.font = { bold: true };
    cpmkList.forEach(c => ws.addRow([c.kode, c.deskripsi]));
    ws.getColumn(1).width = 20;
    ws.getColumn(2).width = 60;
    return ws;
}

export const downloadTemplateRencanaPembelajaran = async (req, res, next) => {
    try {
        const { mataKuliahId } = req.params;
        const cpmkList = await rpsService.getDaftarCpmkUntukTemplate(mataKuliahId);

        const workbook = new ExcelJS.Workbook();
        buildRencanaPembelajaranSheet(workbook);
        buildDaftarJenisPertemuanSheet(workbook);
        buildDaftarCpmkSheet(workbook, cpmkList);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Template_Rencana_Pembelajaran.xlsx"');
        await workbook.xlsx.write(res);
        res.status(200).end();
    } catch (error) {
        next(error);
    }
};

export const importRencanaPembelajaran = async (req, res, next) => {
    try {
        const { mataKuliahId } = req.params;
        const { siakPeriodeAkademikId } = req.body;
        if (!siakPeriodeAkademikId) {
            return new ResponseBuilder(res).code(400).message('siakPeriodeAkademikId wajib diisi').json();
        }
        if (!req.file) {
            return new ResponseBuilder(res).code(400).message('File Excel wajib diunggah').json();
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const sheet = workbook.getWorksheet('Rencana Pembelajaran') || workbook.worksheets[0];

        const rows = [];
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // skip header
            const [, sesi, cpmk, jenisPertemuan, materiIndo, materiEng, indikator, kriteria, luring, daring, bobot] =
                row.values; // row.values[0] kosong (ExcelJS 1-indexed)

            if (!sesi) return; // baris kosong dilewati

            rows.push({
                sesi: parseInt(sesi, 10),
                cpmkKodeList: cpmk ? String(cpmk).split(/[,;\n]/) : [],
                jenisPertemuan: jenisPertemuan || null,
                materiPembelajaran: materiIndo || null,
                materiPembelajaranEng: materiEng || null,
                indikatorPenilaian: indikator || null,
                kriteriaPenilaian: kriteria || null,
                metodePembelajaranLuring: luring || null,
                metodePembelajaranDaring: daring || null,
                bobotPenilaian: parseFloat(bobot || 0)
            });
        });

        const result = await rpsService.importRencanaPembelajaran(mataKuliahId, siakPeriodeAkademikId, rows);

        return new ResponseBuilder(res)
            .code(200)
            .message(`Berhasil import ${result.jumlahDiimport} sesi Rencana Pembelajaran`)
            .json(result);
    } catch (error) {
        next(error);
    }
};

// =========================================================
// CONTROLLER: Pratinjau Salin Detail RPS
// =========================================================
export const pratinjauSalinDetailRps = async (req, res, next) => {
    try {
        const { mataKuliahId } = req.params;
        const { periodeAsalId } = req.query;
        const data = await rpsService.pratinjauSalinDetailRps(mataKuliahId, periodeAsalId);

        return new ResponseBuilder(res)
            .code(200)
            .message("Pratinjau Detail RPS periode asal")
            .json(data);
    } catch (error) {
        next(error);
    }
};

// =========================================================
// CONTROLLER: Salin Detail RPS antar Periode
// =========================================================
export const salinDetailRps = async (req, res, next) => {
    try {
        const { mataKuliahId } = req.params;
        const { periodeAsalId, periodeTujuanId } = req.body;
        const data = await rpsService.salinDetailRps(mataKuliahId, periodeAsalId, periodeTujuanId);

        return new ResponseBuilder(res)
            .code(200)
            .message("Detail RPS berhasil disalin")
            .json(data);
    } catch (error) {
        next(error);
    }
};

// =========================================================
// CONTROLLER: Ambil Data UI Detail RPS (Dengan fitur copy periode)
// =========================================================
export const getFormDetailRps = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const { mataKuliahId } = req.params;
    // Query param untuk fitur "Salin Data" atau memilih dropdown periode
    const { periodeId } = req.query; 

    try {
        const data = await rpsService.getFormDetailRps(mataKuliahId, periodeId);
        
        return responseBuilder
            .status("success")
            .code(200)
            .message("Berhasil mengambil data form Detail RPS")
            .json(data); 
    } catch (error) {
        return responseBuilder
            .status("failure")
            .code(500)
            .message(error.message)
            .json();
    }
};

// =========================================================
// CONTROLLER: Simpan Data Detail RPS
// =========================================================
// export const saveDetailRps = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     const { mataKuliahId } = req.params;

//     try {
//         // req.body harus mengandung siakPeriodeAkademikId
//         const result = await rpsService.upsertDetailRps(mataKuliahId, req.body, req.file);

//         return responseBuilder
//             .status("success")
//             .code(result.isNewRecord ? 201 : 200)
//             .message(result.isNewRecord ? "Berhasil membuat Detail RPS baru" : "Berhasil memperbarui Detail RPS")
//             .json(result.data);
//     } catch (error) {
//         return responseBuilder
//             .status("failure")
//             .code(500)
//             .message(error.message)
//             .json();
//     }
// };
export const saveDetailRps = async (req, res, next) => {
    try {
        const { mataKuliahId } = req.params;
        const result = await rpsService.upsertDetailRps(mataKuliahId, req.body, req.file);

        return new ResponseBuilder(res)
            .code(result.isNewRecord ? 201 : 200)
            .message("Data Detail RPS berhasil disimpan")
            .json(result.data);
    } catch (error) {
        next(error); // 👈 File otomatis dihapus oleh Middleware jika error
    }
};

export const deleteDetailRps = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const { id } = req.params; // Menggunakan ID RPS langsung

    try {
        const success = await rpsService.deleteDetailRps(id);
        if (success) {
            return responseBuilder.status("success").code(200).message("Berhasil menghapus Detail RPS").json();
        } else {
            return responseBuilder.status("failure").code(404).message("Data Detail RPS tidak ditemukan").json();
        }
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

// --- Rencana Pembelajaran Controllers ---
// export const getRencanaPembelajaran = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     const { mataKuliahId } = req.params;
//     const { periodeId } = req.query; // Tangkap periodeId dari Query URL

//     try {
//         const data = await rpsService.getRencanaPembelajaran(mataKuliahId, periodeId);
//         return responseBuilder.status("success").code(200).message("Berhasil mengambil data Rencana Pembelajaran").json(data);
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };
export const getRencanaPembelajaran = async (req, res, next) => {
    try {
        const data = await rpsService.getRencanaPembelajaran(req.params.mataKuliahId, req.query.periodeId);
        return new ResponseBuilder(res).code(200).message("Berhasil mengambil data Rencana Pembelajaran").json(data);
    } catch (error) { next(error); }
};

// export const createRencanaPembelajaran = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         const data = await rpsService.createRencanaPembelajaran(req.params.mataKuliahId, req.body);
//         return responseBuilder.status("success").code(201).message("Sesi pembelajaran berhasil ditambahkan").json(data);
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };


// export const createRencanaPembelajaran = async (req, res, next) => {
//     try {
//         const data = await rpsService.createRencanaPembelajaran(req.params.mataKuliahId, req.body);
//         return new ResponseBuilder(res)
//             .code(201)
//             .message("Sesi pembelajaran berhasil ditambahkan")
//             .json(data);
//     } catch (error) {
//         next(error);
//     }
// };



// export const updateRencanaPembelajaran = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     try {
//         const result = await rpsService.updateRencanaPembelajaran(req.params.id, req.body);
//         if (result) return responseBuilder.status("success").code(200).message("Sesi pembelajaran berhasil diupdate").json(result);
//         return responseBuilder.status("failure").code(404).message("Data tidak ditemukan").json();
//     } catch (error) {
//         return responseBuilder.status("failure").code(500).message(error.message).json();
//     }
// };
export const createRencanaPembelajaran = async (req, res, next) => {
    try {
        const data = await rpsService.createRencanaPembelajaran(req.params.mataKuliahId, req.body);
        return new ResponseBuilder(res).code(201).message("Detail Rencana Pembelajaran berhasil disimpan").json(data);
    } catch (error) { next(error); }
};

export const updateRencanaPembelajaran = async (req, res, next) => {
    try {
        await rpsService.updateRencanaPembelajaran(req.params.id, req.body, req.params.mataKuliahId);
        return new ResponseBuilder(res).code(200).message("Detail Rencana Pembelajaran berhasil diperbarui").json({});
    } catch (error) { next(error); }
};

export const deleteRencanaPembelajaran = async (req, res, next) => {
    try {
        await rpsService.deleteRencanaPembelajaran(req.params.id);
        return new ResponseBuilder(res).code(200).message("Sesi berhasil dihapus").json({});
    } catch (error) { next(error); }
};


// ==========================================
// --- BAGIAN RENCANA EVALUASI (HALAMAN 8) ---
// ==========================================
export const getRencanaEvaluasi = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const { mataKuliahId } = req.params;
    const { periodeId } = req.query;
    try {
        const data = await rpsService.getRencanaEvaluasi(mataKuliahId, periodeId);
        return responseBuilder.status("success").code(200).message("Berhasil mengambil data evaluasi").json(data);
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

// export const saveRencanaEvaluasi = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
//     const { mataKuliahId } = req.params;
//     try {
//         const data = await rpsService.upsertRencanaEvaluasi(mataKuliahId, req.body);
//         return responseBuilder.status("success").code(200).message("Data evaluasi berhasil disimpan").json(data);
//     } catch (error) {
//         return responseBuilder.status("failure").code(400).message(error.message).json();
//     }
// };



export const saveRencanaEvaluasiList = async (req, res, next) => {
    try {
        const { mataKuliahId } = req.params;
        const { siakPeriodeAkademikId } = req.body;
        
        // 1. Simpan rencana evaluasi
        await rpsService.saveRencanaEvaluasi(mataKuliahId, req.body);
        
        // 2. Tarik ulang data yang baru saja disimpan untuk ditampilkan di response
        const result = await rpsService.getRencanaEvaluasi(mataKuliahId, siakPeriodeAkademikId);
        
        return new ResponseBuilder(res)
            .code(200)
            .message("Komponen Evaluasi berhasil disimpan dan divalidasi!")
            .json(result);
    } catch (error) {
        next(error);
    }
};
export const deleteRencanaEvaluasi = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    try {
        await rpsService.deleteRencanaEvaluasi(req.params.id);
        return responseBuilder.status("success").code(200).message("Berhasil menghapus data evaluasi").json();
    } catch (error) {
        return responseBuilder.status("failure").code(500).message(error.message).json();
    }
};

export const getLaporanRpsCetak = async (req, res, next) => {
    try {
        const { mataKuliahId } = req.params;
        const { periodeId } = req.query;
        const data = await rpsService.getLaporanRpsCetak(mataKuliahId, periodeId || null);

        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil mengambil data laporan cetak RPS")
            .json(data);
    } catch (error) {
        next(error);
    }
};