import ExcelJS   from 'exceljs';
import PDFDocument from 'pdfkit-table';
import path from 'path';
import * as penilaianService from '../../services/penilaian.service.js';
import models from '../../models/index.js';

const { KelasKuliah, MataKuliah, ProgramStudi, Dosen, Jenjang } = models;

// ─────────────────────────────────────────────
// HELPER: Ambil info kelas + kaprodi dari DB
// ─────────────────────────────────────────────
const getInfoKelas = async (kelasId) => {
    const kelas = await KelasKuliah.findByPk(kelasId, {
        include: [{
            model: MataKuliah, as: 'mataKuliah',
            attributes: ['id', 'kode', 'nama', 'totalSks', 'siakProgramStudiId'],
            include: [{
                model: ProgramStudi, as: 'programStudi',
                attributes: ['id', 'nama', 'kode'],
                include: [
                    { model: Jenjang, as: 'jenjang', attributes: ['jenjang'] },
                    { model: Dosen,   as: 'kaprodi',  attributes: ['nama', 'nidn'] }
                ]
            }]
        }]
    });
    if (!kelas) throw new Error('Kelas tidak ditemukan');
    return kelas;
};

// ─────────────────────────────────────────────
// HELPER: Footer dinamis
// ─────────────────────────────────────────────
const buildFooterText = (namaPencetak) => {
    const printDate = new Date().toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'medium'
    });
    const appUrl = process.env.APP_URL || 'siakad.uika-bogor.ac.id';
    return `Dicetak oleh: ${namaPencetak}, pada ${printDate} WIB | ${appUrl}`;
};

// ─────────────────────────────────────────────
// HELPER: KOP SURAT (hanya jika ?kop=true)
// ─────────────────────────────────────────────
const drawKopSurat = (doc, logoPath, boxX, boxW) => {
    const logoSize = 60;
    try { doc.image(logoPath, boxX, 15, { width: logoSize }); } catch (e) {}

    const namaUniv = process.env.NAMA_UNIVERSITAS || 'UNIVERSITAS IBN KHALDUN BOGOR';
    const alamat   = process.env.ALAMAT_UNIVERSITAS || 'Jl KH Sholeh Iskandar KM 2 Kedung Badak Bogor';
    const kontak   = process.env.KONTAK_UNIVERSITAS || 'Website: uika-bogor.ac.id | Email: info@uika-bogor.ac.id | Telp: 0251-8356884';

    doc.font('Helvetica-Bold').fontSize(14).fillColor('black')
        .text(namaUniv, boxX, 18, { width: boxW, align: 'center' });
    doc.font('Helvetica').fontSize(8)
        .text(alamat,  boxX, doc.y + 1, { width: boxW, align: 'center' });
    doc.text(kontak, boxX, doc.y + 1, { width: boxW, align: 'center' });

    if (doc.y < 15 + logoSize + 4) doc.y = 15 + logoSize + 4;
    doc.moveDown(0.4);
    doc.save().lineWidth(1).strokeColor('#000000')
        .moveTo(boxX, doc.y).lineTo(boxX + boxW, doc.y).stroke().restore();
    doc.moveDown(0.6);
};

// ─────────────────────────────────────────────
// HELPER: Gambar INFO SECTION (logo selalu tampil)
// ─────────────────────────────────────────────
const drawInfoSection = (doc, logoPath, boxX, boxW, judul, dataRows) => {
    // dataRows: [{ key, val }]
    const rowH  = 16;
    const leftW = 80;
    const rightW = boxW - leftW;
    const totalH = rowH * (1 + dataRows.length);
    const infoY  = doc.y;

    doc.save().lineWidth(0.5).strokeColor('#000000');
    doc.rect(boxX, infoY, boxW, totalH).stroke();
    doc.moveTo(boxX + leftW, infoY).lineTo(boxX + leftW, infoY + totalH).stroke();
    doc.restore();

    // Logo SELALU tampil di kotak kiri (tidak bergantung isPakaiKop)
    try {
        doc.image(logoPath, boxX + 10, infoY + 6, { width: 58 });
    } catch (e) {}

    // Header biru
    doc.save().rect(boxX + leftW, infoY, rightW, rowH).fill('#0c4781').restore();
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff')
        .text(judul, boxX + leftW, infoY + 5, { width: rightW, align: 'center' });

    // Baris data
    doc.save().lineWidth(0.5).strokeColor('#000000');
    dataRows.forEach((row, i) => {
        const ry = infoY + rowH + (i * rowH);
        doc.moveTo(boxX + leftW, ry).lineTo(boxX + boxW, ry).stroke();
        doc.font('Helvetica-Bold').fontSize(8).fillColor('black').text(row.key, boxX + leftW + 8, ry + 4);
        doc.moveTo(boxX + leftW + 150, ry).lineTo(boxX + boxW, ry).stroke();
        doc.font('Helvetica').text(String(row.val || '-'), boxX + leftW + 158, ry + 4);
    });
    doc.restore();

    doc.y = infoY + totalH + 12;
};

// ─────────────────────────────────────────────
// HELPER: TTD Section (dinamis dari DB)
// ─────────────────────────────────────────────
const drawTtdSection = (doc, boxX, boxW, namaKaprodi, namaProdi) => {
    if (doc.y > 650) { doc.addPage(); doc.y = 30; }

    const printDate = new Date().toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta', year: 'numeric', month: 'long', day: 'numeric'
    });
    const namaWakilRektor = process.env.NAMA_WAKIL_REKTOR || '-';
    const namaUniv        = process.env.NAMA_UNIVERSITAS  || 'Universitas Ibn Khaldun';
    const kotaTtd         = process.env.KOTA_TTD          || 'Bogor';

    const ttdY = doc.y;

    // Kiri: Ketua Prodi
    doc.font('Helvetica').fontSize(9).fillColor('black')
        .text('Ketua Program Studi', boxX, ttdY, { align: 'left' });
    doc.text(namaProdi, boxX, doc.y, { align: 'left' });
    doc.moveDown(4);
    doc.font('Helvetica-Bold').text(namaKaprodi || '-', boxX, doc.y, { align: 'left' });

    // Kanan: Wakil Rektor
    doc.font('Helvetica').fontSize(9)
        .text(`${kotaTtd}, ${printDate}`,        0, ttdY,     { align: 'right', width: boxX + boxW });
    doc.text('Wakil Rektor 1',                   0, doc.y,    { align: 'right', width: boxX + boxW });
    doc.text(namaUniv,                           0, doc.y,    { align: 'right', width: boxX + boxW });
    doc.moveDown(3);
    doc.font('Helvetica-Bold')
        .text(namaWakilRektor,                   0, doc.y,    { align: 'right', width: boxX + boxW });
};


// ============================================================================
// 1. EXPORT EXCEL — NILAI PERKULIAHAN PER KELAS
// ============================================================================
export const exportExcelNilaiKelas = async (req, res, next) => {
    try {
        const { kelasId } = req.params;
        const namaPencetak = req.user?.nama || req.user?.name || 'Sistem';

        const data = await penilaianService.getPesertaKelasList(kelasId);
        const kelas = await getInfoKelas(kelasId);

        const mk       = kelas.mataKuliah;
        const prodi    = mk?.programStudi;
        const jenjang  = prodi?.jenjang?.jenjang || 'S1';
        const namaProdi = `${jenjang} - ${prodi?.nama || '-'}`;
        const printDate = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long' });

        const workbook  = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Nilai Perkuliahan');

        const info = [
            ['Program Studi', namaProdi],
            ['Mata Kuliah',   `${mk?.kode} - ${mk?.nama} - ${mk?.totalSks} SKS`],
            ['Kelas',         kelas.nama || '-'],
            ['Dicetak',       `${namaPencetak} | ${printDate}`],
        ];
        info.forEach(([key, val]) => {
            const row = worksheet.addRow([key, val]);
            row.getCell(1).font = { bold: true };
        });
        worksheet.addRow([]);

        const headerRow = ['No', 'NIM', 'Nama'];
        data.headerKolom.forEach(h => headerRow.push(h.labelKolom));
        headerRow.push('Nilai Akhir', 'Grade', 'Angka Mutu');

        const tblHeaderRow = worksheet.addRow(headerRow);
        tblHeaderRow.eachCell((cell, colNum) => {
            cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border    = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            const n = data.headerKolom.length;
            if (colNum <= 3)           cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0c4781' } };
            else if (colNum <= 3 + n)  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
            else                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00A65A' } };
        });

        data.tabel.forEach((mhs, i) => {
            const row = [mhs.no, mhs.nim, mhs.nama];
            data.headerKolom.forEach(h => {
                row.push(mhs.nilaiPerKomponen[h.label] ?? '-');
            });
            row.push(mhs.nilaiAkhir || '-', mhs.grade || '-', mhs.angkaMutu ?? '-');

            const excelRow = worksheet.addRow(row);
            const bg = i % 2 === 0 ? 'FFFFFFFF' : 'FFF5F5F5';
            excelRow.eachCell((cell) => {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border    = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
            });
            excelRow.getCell(3).alignment = { horizontal: 'left' };
        });

        worksheet.columns.forEach(col => { col.width = 18; });
        worksheet.getColumn(2).width = 16;
        worksheet.getColumn(3).width = 30;

        const filename = `Nilai_Kelas_${kelas.nama || kelasId}.xlsx`.replace(/\s/g, '_');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        await workbook.xlsx.write(res);
        res.status(200).end();
    } catch (error) { next(error); }
};


// ============================================================================
// 2. EXPORT PDF — NILAI PERKULIAHAN PER KELAS
// ============================================================================
export const exportPdfNilaiKelas = async (req, res, next) => {
    try {
        const { kelasId } = req.params;
        const namaPencetak = req.user?.nama || req.user?.name || 'Sistem';
        const isPakaiKop   = String(req.query.kop).toLowerCase() === 'true';

        const data  = await penilaianService.getPesertaKelasList(kelasId);
        const kelas = await getInfoKelas(kelasId);
        const mk    = kelas.mataKuliah;
        const prodi = mk?.programStudi;
        const namaProdi   = `${prodi?.jenjang?.jenjang || 'S1'} - ${prodi?.nama || '-'}`;
        const namaKaprodi = prodi?.kaprodi?.nama || '-';

        const doc    = new PDFDocument({ margin: 20, size: 'A4', layout: 'landscape' });
        const boxX   = 20;
        const PAGE_W = doc.page.width;
        const boxW   = PAGE_W - boxX * 2;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Nilai_Kelas_${kelas.nama || kelasId}.pdf"`);
        doc.pipe(res);

        const logoPath = path.join(process.cwd(), 'public', 'logo', 'uika.jpg');

        if (isPakaiKop) drawKopSurat(doc, logoPath, boxX, boxW);

        drawInfoSection(doc, logoPath, boxX, boxW, 'NILAI PERKULIAHAN', [
            { key: 'Program Studi',  val: namaProdi },
            { key: 'Mata Kuliah',    val: `${mk?.kode} - ${mk?.nama} - ${mk?.totalSks} SKS` },
            { key: 'Kelas',          val: kelas.nama || '-' },
            { key: 'Kapasitas',      val: `${kelas.kapasitas || '-'} / ${data.tabel.length} Peserta` },
            { key: 'Skala Dipakai',  val: data.skalaDipakai === 'database' ? 'Skala Prodi (DB)' : 'Skala Default' },
        ]);

        const cplCount = data.headerKolom.length;
        const colNo    = 25;
        const colNim   = 75;
        const colNama  = 160;
        const colHadir = 45;
        const colNilai = 45;
        const colGrade = 35;
        const colMutu  = 35;
        const fixedW   = colNo + colNim + colNama + colHadir + colNilai + colGrade + colMutu;
        const kompArea = boxW - fixedW;
        const kompW    = cplCount > 0 ? kompArea / cplCount : kompArea;
        const kompX    = boxX + colNo + colNim + colNama + colHadir;
        const rowHeight = 16;
        const hh        = 26;
        const halfHY    = doc.y + 13;

        doc.save().rect(boxX, doc.y, boxW, hh).fill('#0c4781').restore();
        doc.save().lineWidth(0.5).strokeColor('#aaaaaa').rect(boxX, doc.y, boxW, hh).stroke();

        const headerY = doc.y;
        [colNo, colNim, colNama, colHadir].reduce((acc, w) => {
            doc.moveTo(boxX + acc, headerY).lineTo(boxX + acc, headerY + hh).stroke();
            return acc + w;
        }, 0);
        const hasilX = kompX + kompArea;
        doc.moveTo(hasilX, headerY).lineTo(hasilX, headerY + hh).stroke();
        doc.moveTo(hasilX + colNilai, headerY).lineTo(hasilX + colNilai, headerY + hh).stroke();
        doc.moveTo(hasilX + colNilai + colGrade, headerY).lineTo(hasilX + colNilai + colGrade, headerY + hh).stroke();

        doc.moveTo(kompX, halfHY).lineTo(hasilX, halfHY).stroke();
        for (let i = 1; i < cplCount; i++) {
            doc.moveTo(kompX + i * kompW, halfHY).lineTo(kompX + i * kompW, headerY + hh).stroke();
        }
        doc.restore();

        doc.font('Helvetica-Bold').fontSize(7).fillColor('#ffffff');
        const hY = headerY + (hh / 2) - 3.5;
        doc.text('No', boxX, hY, { width: colNo, align: 'center', lineBreak: false });
        doc.text('NIM', boxX + colNo, hY, { width: colNim, align: 'center', lineBreak: false });
        doc.text('Nama', boxX + colNo + colNim, hY, { width: colNama, align: 'center', lineBreak: false });
        doc.text('Hadir', boxX + colNo + colNim + colNama, hY, { width: colHadir, align: 'center', lineBreak: false });
        doc.text('Nilai Komponen', kompX, headerY + 4, { width: kompArea, align: 'center', lineBreak: false });
        doc.text('Nilai', hasilX, hY, { width: colNilai, align: 'center', lineBreak: false });
        doc.text('Grade', hasilX + colNilai, hY, { width: colGrade, align: 'center', lineBreak: false });
        doc.text('Mutu', hasilX + colNilai + colGrade, hY, { width: colMutu, align: 'center', lineBreak: false });

        doc.fontSize(6.5);
        data.headerKolom.forEach((h, i) => {
            doc.text(h.label, kompX + i * kompW, halfHY + 3, { width: kompW, align: 'center', lineBreak: false });
        });

        let rowY = headerY + hh;
        data.tabel.forEach((mhs, iRow) => {
            if (rowY + rowHeight > doc.page.height - 40) {
                doc.addPage();
                rowY = 30;
            }
            const bg = iRow % 2 === 0 ? '#ffffff' : '#f5f5f5';
            doc.save().rect(boxX, rowY, boxW, rowHeight).fill(bg).restore();
            doc.save().lineWidth(0.4).strokeColor('#cccccc');
            doc.rect(boxX, rowY, boxW, rowHeight).stroke();
            [colNo, colNim, colNama, colHadir].reduce((acc, w) => {
                doc.moveTo(boxX + acc, rowY).lineTo(boxX + acc, rowY + rowHeight).stroke();
                return acc + w;
            }, 0);
            doc.moveTo(hasilX, rowY).lineTo(hasilX, rowY + rowHeight).stroke();
            doc.moveTo(hasilX + colNilai, rowY).lineTo(hasilX + colNilai, rowY + rowHeight).stroke();
            doc.moveTo(hasilX + colNilai + colGrade, rowY).lineTo(hasilX + colNilai + colGrade, rowY + rowHeight).stroke();
            for (let i = 1; i < cplCount; i++) {
                doc.moveTo(kompX + i * kompW, rowY).lineTo(kompX + i * kompW, rowY + rowHeight).stroke();
            }
            doc.restore();

            const tY = rowY + (rowHeight / 2) - 3.5;
            doc.font('Helvetica').fontSize(7).fillColor('black');
            doc.text(String(mhs.no), boxX, tY, { width: colNo, align: 'center', lineBreak: false });
            doc.text(mhs.nim, boxX + colNo, tY, { width: colNim, align: 'center', lineBreak: false });
            doc.text(mhs.nama, boxX + colNo + colNim + 3, tY, { width: colNama - 3, align: 'left', lineBreak: false });
            doc.text(mhs.hadir ?? '-', boxX + colNo + colNim + colNama, tY, { width: colHadir, align: 'center', lineBreak: false });

            data.headerKolom.forEach((h, i) => {
                const val = mhs.nilaiPerKomponen[h.label];
                doc.text(val !== null && val !== undefined ? String(val) : '-',
                    kompX + i * kompW, tY, { width: kompW, align: 'center', lineBreak: false });
            });

            doc.font('Helvetica-Bold');
            doc.text(mhs.nilaiAkhir > 0 ? String(mhs.nilaiAkhir) : '-', hasilX, tY, { width: colNilai, align: 'center', lineBreak: false });
            doc.text(mhs.grade || '-', hasilX + colNilai, tY, { width: colGrade, align: 'center', lineBreak: false });
            doc.text(mhs.angkaMutu > 0 ? String(mhs.angkaMutu) : '-', hasilX + colNilai + colGrade, tY, { width: colMutu, align: 'center', lineBreak: false });

            rowY += rowHeight;
        });

        doc.y = rowY + 12;

        drawTtdSection(doc, boxX, boxW, namaKaprodi, namaProdi);

        doc.moveDown(3);
        doc.save().moveTo(boxX, doc.y).lineTo(boxX + boxW, doc.y)
            .lineWidth(0.5).strokeColor('#cccccc').stroke().restore();
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(7).fillColor('#555555')
            .text(buildFooterText(namaPencetak), boxX, doc.y);

        doc.end();
    } catch (error) { next(error); }
};


// ============================================================================
// 3. EXPORT EXCEL — CAPAIAN CPMK PER KELAS
// ============================================================================
export const exportExcelCapaianKelas = async (req, res, next) => {
    try {
        const { kelasId } = req.params;
        const namaPencetak = req.user?.nama || req.user?.name || 'Sistem';

        const { getCapaianCpmkKelas } = await import('../../services/capaian-pembelajaran.service.js');
        const data  = await getCapaianCpmkKelas(kelasId);
        const printDate = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long' });

        const workbook  = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Capaian CPMK');

        [
            ['Program Studi',  data.header.programStudi],
            ['Periode',        data.header.periode],
            ['Mata Kuliah',    data.header.mataKuliah],
            ['Nama Kelas',     data.header.namaKelas],
            ['Kurikulum',      data.header.kurikulum],
            ['Sistem Kuliah',  data.header.sistemKuliah],
            ['Kapasitas',      `${data.header.kapasitas} / ${data.header.peserta} Peserta`],
            ['Dicetak',        `${namaPencetak} | ${printDate}`],
        ].forEach(([key, val]) => {
            const r = worksheet.addRow([key, val]);
            r.getCell(1).font = { bold: true };
        });

        if (data.pemetaanBerbeda) {
            const warnRow = worksheet.addRow(['PERHATIAN: Pemetaan capaian pada kelas ini berbeda dengan Mata Kuliah saat ini. Data mungkin tidak mencerminkan setup evaluasi terbaru.']);
            warnRow.getCell(1).font  = { bold: true, color: { argb: 'FF92400E' } };
            warnRow.getCell(1).fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
            warnRow.getCell(1).alignment = { wrapText: true };
            warnRow.height = 28;
            worksheet.mergeCells(`A${warnRow.number}:${String.fromCharCode(65 + data.cpmkInfo.length + 3)}${warnRow.number}`);
        }

        worksheet.addRow([]);

        const targetRow = ['', 'Target CPMK', ''];
        data.cpmkInfo.forEach(c => targetRow.push(data.targetCpmk[c.kode] ?? '-'));
        targetRow.push('');
        const tblTarget = worksheet.addRow(targetRow);
        tblTarget.eachCell((cell) => {
            cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0c4781' } };
            cell.font   = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.alignment = { horizontal: 'center' };
        });

        const headerArr = ['No', 'NIM', 'Nama'];
        data.cpmkInfo.forEach(c => headerArr.push(c.kode));
        headerArr.push('Status Capaian');

        const hRow = worksheet.addRow(headerArr);
        hRow.eachCell((cell, col) => {
            cell.font   = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: col <= 3 ? 'FF0c4781' : 'FF1565C0' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.alignment = { horizontal: 'center' };
        });

        data.tabel.forEach((mhs, i) => {
            const rowArr = [mhs.no, mhs.nim, mhs.nama];
            data.cpmkInfo.forEach(c => rowArr.push(mhs.nilaiCpmk[c.kode] ?? '-'));
            rowArr.push(mhs.statusCapaian || '-');

            const r = worksheet.addRow(rowArr);
            const bg = i % 2 === 0 ? 'FFFFFFFF' : 'FFF5F5F5';
            r.eachCell((cell) => {
                cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                cell.alignment = { horizontal: 'center' };
            });
            r.getCell(3).alignment = { horizontal: 'left' };
        });

        const rerataArr = ['', 'Rerata', ''];
        data.cpmkInfo.forEach(c => rerataArr.push(data.rerataPerolehan[c.kode] ?? '-'));
        rerataArr.push('');
        const rRow = worksheet.addRow(rerataArr);
        rRow.eachCell((cell) => {
            cell.font   = { bold: true, color: { argb: 'FF0c4781' } };
            cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFdde8f5' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.alignment = { horizontal: 'center' };
        });

        worksheet.columns.forEach(col => { col.width = 16; });
        worksheet.getColumn(3).width = 30;

        const filename = `Capaian_CPMK_${data.header.namaKelas || kelasId}.xlsx`.replace(/\s/g, '_');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        await workbook.xlsx.write(res);
        res.status(200).end();
    } catch (error) { next(error); }
};


// ============================================================================
// 4. EXPORT PDF — CAPAIAN CPMK PER KELAS
// ============================================================================
export const exportPdfCapaianKelas = async (req, res, next) => {
    try {
        const { kelasId } = req.params;
        const namaPencetak = req.user?.nama || req.user?.name || 'Sistem';
        const isPakaiKop   = String(req.query.kop).toLowerCase() === 'true';

        const { getCapaianCpmkKelas } = await import('../../services/capaian-pembelajaran.service.js');
        const data  = await getCapaianCpmkKelas(kelasId);
        const kelas = await getInfoKelas(kelasId);
        const namaKaprodi = kelas.mataKuliah?.programStudi?.kaprodi?.nama || '-';

        const doc    = new PDFDocument({ margin: 20, size: 'A4', layout: 'landscape' });
        const boxX   = 20;
        const PAGE_W = doc.page.width;
        const boxW   = PAGE_W - boxX * 2;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Capaian_CPMK_${data.header.namaKelas || kelasId}.pdf"`);
        doc.pipe(res);

        const logoPath = path.join(process.cwd(), 'public', 'logo', 'uika.jpg');

        if (isPakaiKop) drawKopSurat(doc, logoPath, boxX, boxW);

        drawInfoSection(doc, logoPath, boxX, boxW, 'CAPAIAN PEMBELAJARAN (CPMK)', [
            { key: 'Program Studi',  val: data.header.programStudi },
            { key: 'Periode',        val: data.header.periode },
            { key: 'Mata Kuliah',    val: data.header.mataKuliah },
            { key: 'Nama Kelas',     val: data.header.namaKelas },
            { key: 'Kurikulum',      val: data.header.kurikulum },
            { key: 'Sistem Kuliah',  val: data.header.sistemKuliah },
            { key: 'Kapasitas',      val: `${data.header.kapasitas} / ${data.header.peserta} Peserta` },
        ]);

        if (data.pemetaanBerbeda) {
            const warnH = 18;
            doc.save().rect(boxX, doc.y, boxW, warnH).fill('#FFF3CD').restore();
            doc.save().lineWidth(0.5).strokeColor('#F59E0B')
                .rect(boxX, doc.y, boxW, warnH).stroke().restore();
            doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#92400E')
                .text('Perhatian: ',  boxX + 6, doc.y + 5, { continued: true });
            doc.font('Helvetica').fontSize(7.5).fillColor('#92400E')
                .text('Pemetaan capaian pada kelas ini berbeda dengan Mata Kuliah saat ini. Data mungkin tidak mencerminkan setup evaluasi terbaru.',
                    { lineBreak: false });
            doc.y += warnH + 4;
        }

        const cpmkCount = data.cpmkInfo.length;
        const colNo     = 25;
        const colNim    = 75;
        const colNama   = 180;
        const colStatus = 90;
        const fixedW    = colNo + colNim + colNama + colStatus;
        const cpmkArea  = boxW - fixedW;
        const cpmkW     = cpmkCount > 0 ? cpmkArea / cpmkCount : cpmkArea;
        const cpmkX     = boxX + colNo + colNim + colNama;
        const statusX   = cpmkX + cpmkArea;
        const rowHeight = 16;

        // ── [A] BARIS TARGET CPMK ──
        doc.save().rect(boxX, doc.y, boxW, rowHeight).fill('#0c4781').restore();
        doc.save().lineWidth(0.5).strokeColor('#aaaaaa').rect(boxX, doc.y, boxW, rowHeight).stroke();
        doc.moveTo(cpmkX, doc.y).lineTo(cpmkX, doc.y + rowHeight).stroke();
        for (let i = 1; i < cpmkCount; i++) {
            doc.moveTo(cpmkX + i * cpmkW, doc.y).lineTo(cpmkX + i * cpmkW, doc.y + rowHeight).stroke();
        }
        doc.moveTo(statusX, doc.y).lineTo(statusX, doc.y + rowHeight).stroke();

        doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
        const targetY = doc.y + (rowHeight / 2) - 3.5;
        doc.text('Target CPMK', boxX, targetY, { width: colNo + colNim + colNama - 10, align: 'right', lineBreak: false });

        data.cpmkInfo.forEach((c, i) => {
            const val = data.targetCpmk[c.kode] ?? '-';
            doc.text(String(val), cpmkX + i * cpmkW, targetY, { width: cpmkW, align: 'center', lineBreak: false });
        });
        doc.restore();
        doc.y += rowHeight;

        // ── [B] MAIN HEADER ROW ──
        doc.save().rect(boxX, doc.y, boxW, rowHeight).fill('#1565C0').restore();
        doc.save().lineWidth(0.5).strokeColor('#aaaaaa').rect(boxX, doc.y, boxW, rowHeight).stroke();
        [colNo, colNim, colNama].reduce((acc, w) => {
            doc.moveTo(boxX + acc, doc.y).lineTo(boxX + acc, doc.y + rowHeight).stroke();
            return acc + w;
        }, 0);
        for (let i = 0; i < cpmkCount; i++) {
            doc.moveTo(cpmkX + i * cpmkW, doc.y).lineTo(cpmkX + i * cpmkW, doc.y + rowHeight).stroke();
        }
        doc.moveTo(statusX, doc.y).lineTo(statusX, doc.y + rowHeight).stroke();

        doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
        const headerY = doc.y + (rowHeight / 2) - 3.5;
        doc.text('No', boxX, headerY, { width: colNo, align: 'center', lineBreak: false });
        doc.text('NIM', boxX + colNo, headerY, { width: colNim, align: 'center', lineBreak: false });
        doc.text('Nama', boxX + colNo + colNim, headerY, { width: colNama, align: 'center', lineBreak: false });
        data.cpmkInfo.forEach((c, i) => {
            doc.text(c.kode, cpmkX + i * cpmkW, headerY, { width: cpmkW, align: 'center', lineBreak: false });
        });
        doc.text('Status Capaian', statusX, headerY, { width: colStatus, align: 'center', lineBreak: false });
        doc.restore();
        doc.y += rowHeight;

        // ── [C] DATA ROWS ──
        let rowY = doc.y;
        data.tabel.forEach((mhs, iRow) => {
            if (rowY + rowHeight > doc.page.height - 40) {
                doc.addPage();
                rowY = 30;
            }
            const bg = iRow % 2 === 0 ? '#ffffff' : '#f5f5f5';
            doc.save().rect(boxX, rowY, boxW, rowHeight).fill(bg).restore();
            doc.save().lineWidth(0.4).strokeColor('#cccccc');
            doc.rect(boxX, rowY, boxW, rowHeight).stroke();
            [colNo, colNim, colNama].reduce((acc, w) => {
                doc.moveTo(boxX + acc, rowY).lineTo(boxX + acc, rowY + rowHeight).stroke();
                return acc + w;
            }, 0);
            for (let i = 0; i < cpmkCount; i++) {
                doc.moveTo(cpmkX + i * cpmkW, rowY).lineTo(cpmkX + i * cpmkW, rowY + rowHeight).stroke();
            }
            doc.moveTo(statusX, rowY).lineTo(statusX, rowY + rowHeight).stroke();
            doc.restore();

            const tY = rowY + (rowHeight / 2) - 3.5;
            doc.font('Helvetica').fontSize(7.5).fillColor('black');
            doc.text(String(mhs.no), boxX, tY, { width: colNo, align: 'center', lineBreak: false });
            doc.text(mhs.nim, boxX + colNo, tY, { width: colNim, align: 'center', lineBreak: false });
            doc.text(mhs.nama, boxX + colNo + colNim + 4, tY, { width: colNama - 4, align: 'left', lineBreak: false });

            data.cpmkInfo.forEach((c, i) => {
                const val = mhs.nilaiCpmk[c.kode];
                doc.text(val !== null && val !== undefined ? String(val) : '-',
                    cpmkX + i * cpmkW, tY, { width: cpmkW, align: 'center', lineBreak: false });
            });

            doc.font('Helvetica-Bold');
            doc.text(mhs.statusCapaian || '-', statusX, tY, { width: colStatus, align: 'center', lineBreak: false });

            rowY += rowHeight;
        });

        // ── [D] RERATA ROW ──
        if (rowY + rowHeight > doc.page.height - 40) {
            doc.addPage();
            rowY = 30;
        }
        doc.save().rect(boxX, rowY, boxW, rowHeight).fill('#dde8f5').restore();
        doc.save().lineWidth(0.4).strokeColor('#aaaaaa').rect(boxX, rowY, boxW, rowHeight).stroke();
        [colNo, colNim, colNama].reduce((acc, w) => {
            doc.moveTo(boxX + acc, rowY).lineTo(boxX + acc, rowY + rowHeight).stroke();
            return acc + w;
        }, 0);
        for (let i = 0; i < cpmkCount; i++) {
            doc.moveTo(cpmkX + i * cpmkW, rowY).lineTo(cpmkX + i * cpmkW, rowY + rowHeight).stroke();
        }
        doc.moveTo(statusX, rowY).lineTo(statusX, rowY + rowHeight).stroke();

        const avgY = rowY + (rowHeight / 2) - 3.5;
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#0c4781');
        doc.text('Rerata Perolehan', boxX, avgY, { width: colNo + colNim + colNama - 10, align: 'right', lineBreak: false });

        data.cpmkInfo.forEach((c, i) => {
            const val = data.rerataPerolehan[c.kode] ?? '-';
            doc.text(String(val), cpmkX + i * cpmkW, avgY, { width: cpmkW, align: 'center', lineBreak: false });
        });
        doc.restore();

        doc.y = rowY + rowHeight + 12;

        drawTtdSection(doc, boxX, boxW, namaKaprodi, data.header.programStudi);

        doc.moveDown(3);
        doc.save().moveTo(boxX, doc.y).lineTo(boxX + boxW, doc.y)
            .lineWidth(0.5).strokeColor('#cccccc').stroke().restore();
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(7).fillColor('#555555')
            .text(buildFooterText(namaPencetak), boxX, doc.y);

        doc.end();
    } catch (error) { next(error); }
};