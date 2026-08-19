import ExcelJS   from 'exceljs';
import PDFDocument from 'pdfkit-table';
import path from 'path';
import * as penilaianService from '../../services/penilaian.service.js';
import models from '../../models/index.js';

const { KelasKuliah, MataKuliah, ProgramStudi, Dosen, Jenjang, RincianKrsMahasiswa, KrsMahasiswa, Mahasiswa, PeriodeAkademik } = models;

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
// HELPER: Ambil info rapor OBE (mahasiswa + kelas) dari rincianKrsId
// ─────────────────────────────────────────────
const getInfoRapor = async (rincianKrsId) => {
    const rincian = await RincianKrsMahasiswa.findByPk(rincianKrsId, {
        include: [
            {
                model: KrsMahasiswa, as: 'krsMahasiswa',
                include: [{ model: Mahasiswa, as: 'mahasiswa', attributes: ['id', 'nama', 'npm', 'angkatan'] }]
            },
            {
                model: KelasKuliah, as: 'kelasKuliah',
                include: [
                    {
                        model: MataKuliah, as: 'mataKuliah',
                        attributes: ['id', 'kode', 'nama', 'totalSks', 'siakProgramStudiId'],
                        include: [{
                            model: ProgramStudi, as: 'programStudi',
                            attributes: ['id', 'nama', 'kode'],
                            include: [{ model: Jenjang, as: 'jenjang', attributes: ['jenjang'] }]
                        }]
                    },
                    { model: PeriodeAkademik, as: 'periodeAkademik', attributes: ['nama'] }
                ]
            }
        ]
    });
    if (!rincian) throw new Error('Data KRS tidak ditemukan');
    return rincian;
};

// ─────────────────────────────────────────────
// HELPER: Status capaian CPL per mahasiswa (target vs nilai)
// ─────────────────────────────────────────────
const hitungStatusCapaianCpl = (nilaiPerCpl, targetCpl, cplInfo) => {
    const sudahDinilai = cplInfo.some(c => nilaiPerCpl[c.kode] !== null && nilaiPerCpl[c.kode] !== undefined);
    if (!sudahDinilai) return 'Belum Dinilai';
    const semuaMencapai = cplInfo.every(c => {
        const n = nilaiPerCpl[c.kode];
        return n !== null && n !== undefined && n >= (targetCpl[c.kode] ?? 0);
    });
    return semuaMencapai ? 'Sudah Memenuhi' : 'Belum Memenuhi';
};

// ─────────────────────────────────────────────
// HELPER: Footer dinamis
// ─────────────────────────────────────────────
const buildFooterText = (namaPencetak, repPath = '') => {
    const printDate = new Date().toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'medium'
    });
    const appUrl = process.env.APP_URL || 'siakad.uika-bogor.ac.id';
    const suffix = repPath ? `/${repPath}` : '';
    return `Dicetak oleh: ${namaPencetak}, pada ${printDate} WIB | ${appUrl}${suffix}`;
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

        // Baris grup CPMK induk (hanya jika MK ini punya Sub-CPMK)
        if (data.hasSubCpmk) {
            const groupArr = ['', '', ''];
            data.cpmkInfo.forEach(c => groupArr.push(c.isGroupFirst ? c.parentKode : ''));
            groupArr.push('');
            const gRow = worksheet.addRow(groupArr);
            gRow.eachCell((cell) => {
                cell.font   = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0c4781' } };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                cell.alignment = { horizontal: 'center' };
            });
            worksheet.mergeCells(gRow.number, 1, gRow.number, 3);
            let colIdx = 4;
            data.cpmkInfo.forEach(c => {
                if (c.isGroupFirst && c.groupSize > 1) {
                    worksheet.mergeCells(gRow.number, colIdx, gRow.number, colIdx + c.groupSize - 1);
                }
                colIdx++;
            });
        }

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

        // ── [GROUP HEADER ROW] — label CPMK induk, hanya jika ada Sub-CPMK ──
        if (data.hasSubCpmk) {
            doc.save().rect(boxX, doc.y, boxW, rowHeight).fill('#0c4781').restore();
            doc.save().lineWidth(0.5).strokeColor('#aaaaaa').rect(boxX, doc.y, boxW, rowHeight).stroke();
            doc.moveTo(cpmkX, doc.y).lineTo(cpmkX, doc.y + rowHeight).stroke();
            data.cpmkInfo.forEach((c, i) => {
                if (i > 0 && c.isGroupFirst) {
                    doc.moveTo(cpmkX + i * cpmkW, doc.y).lineTo(cpmkX + i * cpmkW, doc.y + rowHeight).stroke();
                }
            });
            doc.moveTo(statusX, doc.y).lineTo(statusX, doc.y + rowHeight).stroke();

            doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
            const groupY = doc.y + (rowHeight / 2) - 3.5;
            data.cpmkInfo.forEach((c, i) => {
                if (!c.isGroupFirst) return;
                doc.text(c.parentKode, cpmkX + i * cpmkW, groupY, { width: cpmkW * c.groupSize, align: 'center', lineBreak: false });
            });
            doc.restore();
            doc.y += rowHeight;
        }

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
            // Kolom sempit (bisa 9+ Sub-CPMK sejajar) -- cukup nomornya, label CPMK
            // induk penuh udah ada di baris grup header di atasnya.
            const labelKolom = c.kode.replace(/^Sub-CPMK|^CPMK/, '');
            doc.text(labelKolom, cpmkX + i * cpmkW, headerY, { width: cpmkW, align: 'center', lineBreak: false });
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

            const warnaStatusCpmk = mhs.statusCapaian === 'Sudah Memenuhi' ? '#1565C0'
                : mhs.statusCapaian === 'Belum Memenuhi' ? '#DC2626'
                : 'black';
            doc.font('Helvetica-Bold').fillColor(warnaStatusCpmk);
            doc.text(mhs.statusCapaian || '-', statusX, tY, { width: colStatus, align: 'center', lineBreak: false });
            doc.fillColor('black');

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

// ============================================================================
// 4. EXPORT PDF — DAFTAR NILAI MAHASISWA (RINGKAS)
// ============================================================================
export const exportPdfDaftarNilai = async (req, res, next) => {
    try {
        const { kelasId } = req.params;
        const namaPencetak = req.user?.nama || req.user?.name || 'Sistem';
        const isPakaiKop   = String(req.query.kop).toLowerCase() === 'true';

        const data  = await penilaianService.getDataDaftarNilai(kelasId);
        
        // Setup PDF layout - Portrait since it's fewer columns
        const doc    = new PDFDocument({ margin: 20, size: 'A4', layout: 'portrait' });
        const boxX   = 20;
        const PAGE_W = doc.page.width;
        const boxW   = PAGE_W - boxX * 2;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Daftar_Nilai_${data.kelas?.nama || kelasId}.pdf"`);
        doc.pipe(res);

        const logoPath = path.join(process.cwd(), 'public', 'logo', 'uika.jpg');

        if (isPakaiKop) drawKopSurat(doc, logoPath, boxX, boxW);

        const dosenString = data.dosen.map(d => d.nama).join(', ') || '-';
        const namaProdi = `${data.programStudi?.jenjang || 'S1'} - ${data.programStudi?.nama || '-'}`;

        drawInfoSection(doc, logoPath, boxX, boxW, 'DAFTAR NILAI MAHASISWA', [
            { key: 'Program Studi',  val: namaProdi },
            { key: 'Mata Kuliah',    val: `${data.mataKuliah?.kode} - ${data.mataKuliah?.nama} - ${data.mataKuliah?.sks} SKS` },
            { key: 'Kelas',          val: data.kelas?.nama || '-' },
            { key: 'Pengajar',       val: dosenString },
            { key: 'Sistem Kuliah',  val: '-' },
        ]);

        // Columns: No, NIM, NAMA, NILAI, NILAI ANGKA, NILAI HURUF, KET.
        const colNo    = 30;
        const colNim   = 80;
        const colNama  = 180;
        const colNilai = 60;
        const colAngka = 60;
        const colHuruf = 60;
        const colKet   = boxW - (colNo + colNim + colNama + colNilai + colAngka + colHuruf);
        
        const rowHeight = 16;
        const hh        = 20;

        doc.save().rect(boxX, doc.y, boxW, hh).fill('#0c4781').restore();
        doc.save().lineWidth(0.5).strokeColor('#aaaaaa').rect(boxX, doc.y, boxW, hh).stroke();

        const headerY = doc.y;
        let curX = boxX;
        [colNo, colNim, colNama, colNilai, colAngka, colHuruf].forEach((w) => {
            curX += w;
            doc.moveTo(curX, headerY).lineTo(curX, headerY + hh).stroke();
        });
        doc.restore();

        doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
        const hY = headerY + (hh / 2) - 4;
        let tx = boxX;
        doc.text('No', tx, hY, { width: colNo, align: 'center', lineBreak: false }); tx += colNo;
        doc.text('NIM', tx, hY, { width: colNim, align: 'center', lineBreak: false }); tx += colNim;
        doc.text('NAMA', tx, hY, { width: colNama, align: 'center', lineBreak: false }); tx += colNama;
        doc.text('NILAI', tx, hY, { width: colNilai, align: 'center', lineBreak: false }); tx += colNilai;
        doc.text('NILAI ANGKA', tx, hY, { width: colAngka, align: 'center', lineBreak: false }); tx += colAngka;
        doc.text('NILAI HURUF', tx, hY, { width: colHuruf, align: 'center', lineBreak: false }); tx += colHuruf;
        doc.text('KET.', tx, hY, { width: colKet, align: 'center', lineBreak: false });

        let rowY = headerY + hh;
        data.mahasiswa.forEach((mhs, iRow) => {
            if (rowY + rowHeight > doc.page.height - 40) {
                doc.addPage();
                rowY = 30;
            }
            const bg = iRow % 2 === 0 ? '#ffffff' : '#f5f5f5';
            doc.save().rect(boxX, rowY, boxW, rowHeight).fill(bg).restore();
            doc.save().lineWidth(0.4).strokeColor('#cccccc');
            doc.rect(boxX, rowY, boxW, rowHeight).stroke();
            
            let cx = boxX;
            [colNo, colNim, colNama, colNilai, colAngka, colHuruf].forEach((w) => {
                cx += w;
                doc.moveTo(cx, rowY).lineTo(cx, rowY + rowHeight).stroke();
            });
            doc.restore();

            const tY = rowY + (rowHeight / 2) - 3.5;
            doc.font('Helvetica').fontSize(8).fillColor('black');
            let dx = boxX;
            doc.text(String(mhs.no), dx, tY, { width: colNo, align: 'center', lineBreak: false }); dx += colNo;
            doc.text(mhs.nim, dx, tY, { width: colNim, align: 'center', lineBreak: false }); dx += colNim;
            doc.text(mhs.nama, dx + 3, tY, { width: colNama - 6, align: 'left', lineBreak: false }); dx += colNama;
            doc.text(mhs.nilaiAkhir > 0 ? String(mhs.nilaiAkhir) : '-', dx, tY, { width: colNilai, align: 'center', lineBreak: false }); dx += colNilai;
            doc.text(mhs.nilaiAngka > 0 ? String(mhs.nilaiAngka) : '-', dx, tY, { width: colAngka, align: 'center', lineBreak: false }); dx += colAngka;
            doc.text(mhs.nilaiHuruf || '-', dx, tY, { width: colHuruf, align: 'center', lineBreak: false }); dx += colHuruf;
            doc.text(mhs.keterangan || '-', dx, tY, { width: colKet, align: 'center', lineBreak: false });

            rowY += rowHeight;
        });

        doc.y = rowY + 12;

        // Using Kaprodi from Data if available, else omit or get from getMetadataKelas.
        // Wait, getDataDaftarNilai doesn't explicitly return Kaprodi right now.
        // Let's pass '-' for Kaprodi or we can fetch it. I will just pass '-'.
        drawTtdSection(doc, boxX, boxW, '-', namaProdi);

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
// 5. EXPORT EXCEL — CAPAIAN CPL PER KELAS
// ============================================================================
export const exportExcelCapaianCplKelas = async (req, res, next) => {
    try {
        const { kelasId } = req.params;
        const namaPencetak = req.user?.nama || req.user?.name || 'Sistem';

        const { getCapaianCplKelas } = await import('../../services/capaian-pembelajaran.service.js');
        const data  = await getCapaianCplKelas(kelasId);
        const printDate = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long' });

        const workbook  = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Capaian CPL');

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
        worksheet.addRow([]);

        const targetRow = ['', 'Target CPL', ''];
        data.cplInfo.forEach(c => targetRow.push(data.targetCpl[c.kode] ?? '-'));
        targetRow.push('');
        const tblTarget = worksheet.addRow(targetRow);
        tblTarget.eachCell((cell) => {
            cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0c4781' } };
            cell.font   = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.alignment = { horizontal: 'center' };
        });

        const headerArr = ['No', 'NIM', 'Nama'];
        data.cplInfo.forEach(c => headerArr.push(c.kode));
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
            data.cplInfo.forEach(c => rowArr.push(mhs.nilaiCpl[c.kode] ?? '-'));
            rowArr.push(hitungStatusCapaianCpl(mhs.nilaiCpl, data.targetCpl, data.cplInfo));

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
        data.cplInfo.forEach(c => rerataArr.push(data.rerataPerolehan[c.kode] ?? '-'));
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

        const filename = `Capaian_CPL_${data.header.namaKelas || kelasId}.xlsx`.replace(/\s/g, '_');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        await workbook.xlsx.write(res);
        res.status(200).end();
    } catch (error) { next(error); }
};


// ============================================================================
// 6. EXPORT PDF — CAPAIAN CPL PER KELAS
// ============================================================================
export const exportPdfCapaianCplKelas = async (req, res, next) => {
    try {
        const { kelasId } = req.params;
        const namaPencetak = req.user?.nama || req.user?.name || 'Sistem';
        const isPakaiKop   = String(req.query.kop).toLowerCase() === 'true';

        const { getCapaianCplKelas } = await import('../../services/capaian-pembelajaran.service.js');
        const data  = await getCapaianCplKelas(kelasId);
        const kelas = await getInfoKelas(kelasId);
        const namaKaprodi = kelas.mataKuliah?.programStudi?.kaprodi?.nama || '-';

        const doc    = new PDFDocument({ margin: 20, size: 'A4', layout: 'landscape' });
        const boxX   = 20;
        const PAGE_W = doc.page.width;
        const boxW   = PAGE_W - boxX * 2;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Capaian_CPL_${data.header.namaKelas || kelasId}.pdf"`);
        doc.pipe(res);

        const logoPath = path.join(process.cwd(), 'public', 'logo', 'uika.jpg');

        if (isPakaiKop) drawKopSurat(doc, logoPath, boxX, boxW);

        drawInfoSection(doc, logoPath, boxX, boxW, 'CAPAIAN PEMBELAJARAN (CPL)', [
            { key: 'Program Studi',  val: data.header.programStudi },
            { key: 'Periode',        val: data.header.periode },
            { key: 'Mata Kuliah',    val: data.header.mataKuliah },
            { key: 'Nama Kelas',     val: data.header.namaKelas },
            { key: 'Kurikulum',      val: data.header.kurikulum },
            { key: 'Sistem Kuliah',  val: data.header.sistemKuliah },
            { key: 'Kapasitas',      val: `${data.header.kapasitas} / ${data.header.peserta} Peserta` },
        ]);

        const cplCount  = data.cplInfo.length;
        const colNo     = 25;
        const colNim    = 75;
        const colNama   = 180;
        const colStatus = 90;
        const fixedW    = colNo + colNim + colNama + colStatus;
        const cplArea   = boxW - fixedW;
        const cplW      = cplCount > 0 ? cplArea / cplCount : cplArea;
        const cplX      = boxX + colNo + colNim + colNama;
        const statusX   = cplX + cplArea;
        const rowHeight = 16;

        // ── [A] BARIS TARGET CPL ──
        doc.save().rect(boxX, doc.y, boxW, rowHeight).fill('#0c4781').restore();
        doc.save().lineWidth(0.5).strokeColor('#aaaaaa').rect(boxX, doc.y, boxW, rowHeight).stroke();
        doc.moveTo(cplX, doc.y).lineTo(cplX, doc.y + rowHeight).stroke();
        for (let i = 1; i < cplCount; i++) {
            doc.moveTo(cplX + i * cplW, doc.y).lineTo(cplX + i * cplW, doc.y + rowHeight).stroke();
        }
        doc.moveTo(statusX, doc.y).lineTo(statusX, doc.y + rowHeight).stroke();

        doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
        const targetY = doc.y + (rowHeight / 2) - 3.5;
        doc.text('Target CPL', boxX, targetY, { width: colNo + colNim + colNama - 10, align: 'right', lineBreak: false });

        data.cplInfo.forEach((c, i) => {
            const val = data.targetCpl[c.kode] ?? '-';
            doc.text(String(val), cplX + i * cplW, targetY, { width: cplW, align: 'center', lineBreak: false });
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
        for (let i = 0; i < cplCount; i++) {
            doc.moveTo(cplX + i * cplW, doc.y).lineTo(cplX + i * cplW, doc.y + rowHeight).stroke();
        }
        doc.moveTo(statusX, doc.y).lineTo(statusX, doc.y + rowHeight).stroke();

        doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
        const headerY = doc.y + (rowHeight / 2) - 3.5;
        doc.text('No', boxX, headerY, { width: colNo, align: 'center', lineBreak: false });
        doc.text('NIM', boxX + colNo, headerY, { width: colNim, align: 'center', lineBreak: false });
        doc.text('Nama', boxX + colNo + colNim, headerY, { width: colNama, align: 'center', lineBreak: false });
        data.cplInfo.forEach((c, i) => {
            doc.text(c.kode, cplX + i * cplW, headerY, { width: cplW, align: 'center', lineBreak: false });
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
            for (let i = 0; i < cplCount; i++) {
                doc.moveTo(cplX + i * cplW, rowY).lineTo(cplX + i * cplW, rowY + rowHeight).stroke();
            }
            doc.moveTo(statusX, rowY).lineTo(statusX, rowY + rowHeight).stroke();
            doc.restore();

            const tY = rowY + (rowHeight / 2) - 3.5;
            doc.font('Helvetica').fontSize(7.5).fillColor('black');
            doc.text(String(mhs.no), boxX, tY, { width: colNo, align: 'center', lineBreak: false });
            doc.text(mhs.nim, boxX + colNo, tY, { width: colNim, align: 'center', lineBreak: false });
            doc.text(mhs.nama, boxX + colNo + colNim + 4, tY, { width: colNama - 4, align: 'left', lineBreak: false });

            data.cplInfo.forEach((c, i) => {
                const val = mhs.nilaiCpl[c.kode];
                doc.text(val !== null && val !== undefined ? String(val) : '-',
                    cplX + i * cplW, tY, { width: cplW, align: 'center', lineBreak: false });
            });

            const statusCapaianCpl = hitungStatusCapaianCpl(mhs.nilaiCpl, data.targetCpl, data.cplInfo);
            const warnaStatusCpl = statusCapaianCpl === 'Sudah Memenuhi' ? '#1565C0'
                : statusCapaianCpl === 'Belum Memenuhi' ? '#DC2626'
                : 'black';
            doc.font('Helvetica-Bold').fillColor(warnaStatusCpl);
            doc.text(statusCapaianCpl, statusX, tY, { width: colStatus, align: 'center', lineBreak: false });
            doc.fillColor('black');

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
        for (let i = 0; i < cplCount; i++) {
            doc.moveTo(cplX + i * cplW, rowY).lineTo(cplX + i * cplW, rowY + rowHeight).stroke();
        }
        doc.moveTo(statusX, rowY).lineTo(statusX, rowY + rowHeight).stroke();

        const avgY = rowY + (rowHeight / 2) - 3.5;
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#0c4781');
        doc.text('Rerata Perolehan', boxX, avgY, { width: colNo + colNim + colNama - 10, align: 'right', lineBreak: false });

        data.cplInfo.forEach((c, i) => {
            const val = data.rerataPerolehan[c.kode] ?? '-';
            doc.text(String(val), cplX + i * cplW, avgY, { width: cplW, align: 'center', lineBreak: false });
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


// ============================================================================
// 7. EXPORT EXCEL — RAPOR OBE PER MAHASISWA (PER KELAS)
// ============================================================================
export const exportExcelRaporObe = async (req, res, next) => {
    try {
        const { krsId } = req.params;
        const namaPencetak = req.user?.nama || req.user?.name || 'Sistem';

        const rapor   = await penilaianService.getRaporOBEMahasiswa(krsId);
        const rincian = await getInfoRapor(krsId);

        const mhs   = rincian.krsMahasiswa?.mahasiswa;
        const kelas = rincian.kelasKuliah;
        const mk    = kelas?.mataKuliah;
        const prodi = mk?.programStudi;
        const namaProdi = `${prodi?.jenjang?.jenjang || 'S1'} - ${prodi?.nama || '-'}`;
        const printDate = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long' });

        const workbook  = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Rapor OBE');

        [
            ['Program Studi',  namaProdi],
            ['Mata Kuliah',    `${mk?.kode} - ${mk?.nama} - ${mk?.totalSks} SKS`],
            ['Kelas',          kelas?.nama || '-'],
            ['Periode',        kelas?.periodeAkademik?.nama || '-'],
            ['Nama Mahasiswa', mhs?.nama || '-'],
            ['NIM',            mhs?.npm || '-'],
            ['Angkatan',       mhs?.angkatan || '-'],
            ['Dicetak',        `${namaPencetak} | ${printDate}`],
        ].forEach(([key, val]) => {
            const r = worksheet.addRow([key, val]);
            r.getCell(1).font = { bold: true };
        });
        worksheet.addRow([]);

        const hRow = worksheet.addRow(['No', 'Kode CPMK', 'Deskripsi CPMK', 'Nilai Capaian']);
        hRow.eachCell((cell) => {
            cell.font   = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0c4781' } };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            cell.alignment = { horizontal: 'center' };
        });

        rapor.forEach((item, i) => {
            const r = worksheet.addRow([i + 1, item.kodeCpmk || '-', item.deskripsi || '-', item.nilaiCapaian ?? '-']);
            const bg = i % 2 === 0 ? 'FFFFFFFF' : 'FFF5F5F5';
            r.eachCell((cell) => {
                cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                cell.alignment = { horizontal: 'center' };
            });
            r.getCell(3).alignment = { horizontal: 'left' };
        });

        worksheet.columns.forEach(col => { col.width = 18; });
        worksheet.getColumn(3).width = 50;

        const filename = `Rapor_OBE_${mhs?.npm || krsId}.xlsx`.replace(/\s/g, '_');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        await workbook.xlsx.write(res);
        res.status(200).end();
    } catch (error) { next(error); }
};


// ============================================================================
// 8. EXPORT PDF — RAPOR OBE PER MAHASISWA (PER KELAS)
// ============================================================================
export const exportPdfRaporObe = async (req, res, next) => {
    try {
        const { krsId } = req.params;
        const namaPencetak = req.user?.nama || req.user?.name || 'Sistem';
        const isPakaiKop   = String(req.query.kop).toLowerCase() === 'true';

        const rapor   = await penilaianService.getRaporOBEMahasiswa(krsId);
        const rincian = await getInfoRapor(krsId);

        const mhs   = rincian.krsMahasiswa?.mahasiswa;
        const kelas = rincian.kelasKuliah;
        const mk    = kelas?.mataKuliah;
        const prodi = mk?.programStudi;
        const namaProdi = `${prodi?.jenjang?.jenjang || 'S1'} - ${prodi?.nama || '-'}`;

        const doc    = new PDFDocument({ margin: 30, size: 'A4' });
        const boxX   = 30;
        const PAGE_W = doc.page.width;
        const boxW   = PAGE_W - boxX * 2;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Rapor_OBE_${mhs?.npm || krsId}.pdf"`);
        doc.pipe(res);

        const logoPath = path.join(process.cwd(), 'public', 'logo', 'uika.jpg');

        if (isPakaiKop) drawKopSurat(doc, logoPath, boxX, boxW);

        drawInfoSection(doc, logoPath, boxX, boxW, 'RAPOR CAPAIAN PEMBELAJARAN (CPMK)', [
            { key: 'Program Studi',  val: namaProdi },
            { key: 'Mata Kuliah',    val: `${mk?.kode} - ${mk?.nama} - ${mk?.totalSks} SKS` },
            { key: 'Kelas',          val: kelas?.nama || '-' },
            { key: 'Periode',        val: kelas?.periodeAkademik?.nama || '-' },
            { key: 'Nama Mahasiswa', val: mhs?.nama || '-' },
            { key: 'NIM',            val: mhs?.npm || '-' },
            { key: 'Angkatan',       val: mhs?.angkatan || '-' },
        ]);

        // Tabel: No | Kode CPMK | Deskripsi CPMK | Nilai Capaian
        const colNo    = 30;
        const colKode  = 80;
        const colNilai = 90;
        const colDesk  = boxW - (colNo + colKode + colNilai);
        const rowHeight = 20;
        const hh = 22;

        doc.save().rect(boxX, doc.y, boxW, hh).fill('#0c4781').restore();
        doc.save().lineWidth(0.5).strokeColor('#aaaaaa').rect(boxX, doc.y, boxW, hh).stroke();
        const headerY = doc.y;
        let curX = boxX;
        [colNo, colKode, colDesk].forEach((w) => {
            curX += w;
            doc.moveTo(curX, headerY).lineTo(curX, headerY + hh).stroke();
        });
        doc.restore();

        doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
        const hY = headerY + (hh / 2) - 4;
        let tx = boxX;
        doc.text('No', tx, hY, { width: colNo, align: 'center', lineBreak: false }); tx += colNo;
        doc.text('Kode CPMK', tx, hY, { width: colKode, align: 'center', lineBreak: false }); tx += colKode;
        doc.text('Deskripsi CPMK', tx, hY, { width: colDesk, align: 'center', lineBreak: false }); tx += colDesk;
        doc.text('Nilai Capaian', tx, hY, { width: colNilai, align: 'center', lineBreak: false });

        let rowY = headerY + hh;
        rapor.forEach((item, i) => {
            if (rowY + rowHeight > doc.page.height - 40) {
                doc.addPage();
                rowY = 30;
            }
            const bg = i % 2 === 0 ? '#ffffff' : '#f5f5f5';
            doc.save().rect(boxX, rowY, boxW, rowHeight).fill(bg).restore();
            doc.save().lineWidth(0.4).strokeColor('#cccccc');
            doc.rect(boxX, rowY, boxW, rowHeight).stroke();
            let cx = boxX;
            [colNo, colKode, colDesk].forEach((w) => {
                cx += w;
                doc.moveTo(cx, rowY).lineTo(cx, rowY + rowHeight).stroke();
            });
            doc.restore();

            const tY = rowY + (rowHeight / 2) - 3.5;
            doc.font('Helvetica').fontSize(8).fillColor('black');
            let dx = boxX;
            doc.text(String(i + 1), dx, tY, { width: colNo, align: 'center', lineBreak: false }); dx += colNo;
            doc.text(item.kodeCpmk || '-', dx, tY, { width: colKode, align: 'center', lineBreak: false }); dx += colKode;
            doc.text(item.deskripsi || '-', dx + 4, tY, { width: colDesk - 8, align: 'left', lineBreak: false }); dx += colDesk;
            doc.font('Helvetica-Bold').text(item.nilaiCapaian !== undefined ? String(item.nilaiCapaian) : '-', dx, tY, { width: colNilai, align: 'center', lineBreak: false });

            rowY += rowHeight;
        });

        if (rapor.length === 0) {
            doc.font('Helvetica').fontSize(9).fillColor('#777777')
                .text('Belum ada nilai CPMK untuk mahasiswa ini.', boxX, rowY + 10, { width: boxW, align: 'center' });
            rowY += 30;
        }

        doc.y = rowY + 12;

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
// 9. EXPORT PDF — LAPORAN NILAI PERKULIAHAN MAHASISWA (format SIAKAD)
// ============================================================================
export const exportPdfLaporanPerkuliahan = async (req, res, next) => {
    try {
        const { kelasId } = req.params;
        const namaPencetak = req.user?.nama || req.user?.name || 'Sistem';

        const data = await penilaianService.getDataLaporanPerkuliahan(kelasId);

        const doc    = new PDFDocument({ margin: 20, size: 'A4', layout: 'landscape' });
        const boxX   = 20;
        const PAGE_W = doc.page.width;
        const boxW   = PAGE_W - boxX * 2;
        const halfW  = boxW / 2;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Laporan_Nilai_Perkuliahan_${data.kelas.nama || kelasId}.pdf"`);
        doc.pipe(res);

        const logoPath = path.join(process.cwd(), 'public', 'logo', 'uika.jpg');
        drawKopSurat(doc, logoPath, boxX, boxW);

        // ── Judul & identitas kelas ──
        doc.font('Helvetica-Bold').fontSize(12).fillColor('black')
            .text('LAPORAN NILAI PERKULIAHAN MAHASISWA', boxX, doc.y, { width: boxW, align: 'center' });
        doc.font('Helvetica').fontSize(9)
            .text(`Program Studi ${data.programStudi.jenjang} ${data.programStudi.nama}`, boxX, doc.y + 2, { width: boxW, align: 'center' });
        doc.text(`Periode ${data.periode.nama}`, boxX, doc.y, { width: boxW, align: 'center' });
        doc.moveDown(0.6);

        doc.fontSize(8).fillColor('black');
        let infoY = doc.y;
        doc.text(`Mata kuliah : ${data.mataKuliah.nama}`, boxX, infoY, { width: halfW - 10 });
        doc.text(`Nama Kelas : ${data.kelas.nama}`, boxX + halfW, infoY, { width: halfW - 10, align: 'right' });

        infoY = doc.y;
        doc.text('Kelas / Kelompok :', boxX, infoY, { width: halfW - 10 });

        infoY = doc.y;
        doc.text(`Kode Mata kuliah : ${data.mataKuliah.kode}`, boxX, infoY, { width: halfW - 10 });
        doc.text(`SKS : ${data.mataKuliah.sks}`, boxX + halfW, infoY, { width: halfW - 10, align: 'right' });

        doc.moveDown(0.8);

        // ── Tabel nilai per komponen ──
        const cplCount   = data.komponenEvaluasi.length;
        const colNo      = 25;
        const colNim     = 70;
        const colNama    = 150;
        const colNilai   = 42;
        const colGrade   = 32;
        const colLulus   = 32;
        const colSunting = 48;
        const colInfo    = 30;
        const fixedW     = colNo + colNim + colNama + colNilai + colGrade + colLulus + colSunting + colInfo;
        const kompArea   = boxW - fixedW;
        const kompW      = cplCount > 0 ? kompArea / cplCount : kompArea;

        // Perkecil ukuran font nama mahasiswa yang panjang agar tidak wrap ke baris baru
        const fitNamaFontSize = (text, maxWidth) => {
            let size = 7;
            doc.font('Helvetica').fontSize(size);
            while (size > 5.5 && doc.widthOfString(text) > maxWidth) {
                size -= 0.5;
                doc.fontSize(size);
            }
            return size;
        };

        const columns = [
            { label: 'No',             width: colNo,   align: 'center' },
            { label: 'NIM',            width: colNim,  align: 'center' },
            { label: 'Nama Mahasiswa', width: colNama, align: 'left' },
            ...data.komponenEvaluasi.map(h => ({ label: h.labelKolom, width: kompW, align: 'center', komponen: h.label })),
            { label: 'Nilai',        width: colNilai,   align: 'center' },
            { label: 'Grade',        width: colGrade,   align: 'center' },
            { label: 'Lulus',        width: colLulus,   align: 'center' },
            { label: 'Sunting KRS?', width: colSunting, align: 'center' },
            { label: 'Info',         width: colInfo,    align: 'center' },
        ];

        const rowHeight = 16;
        const hh        = 28;

        // Header
        doc.save().rect(boxX, doc.y, boxW, hh).fill('#0c4781').restore();
        doc.save().lineWidth(0.5).strokeColor('#aaaaaa').rect(boxX, doc.y, boxW, hh).stroke();
        const headerY = doc.y;
        let hx = boxX;
        columns.forEach(col => {
            hx += col.width;
            doc.moveTo(hx, headerY).lineTo(hx, headerY + hh).stroke();
        });
        doc.restore();

        doc.font('Helvetica-Bold').fontSize(6.5).fillColor('#ffffff');
        hx = boxX;
        columns.forEach(col => {
            doc.text(col.label, hx + 2, headerY + (hh / 2) - 4, { width: col.width - 4, align: col.align });
            hx += col.width;
        });

        // Baris data per mahasiswa
        let rowY = headerY + hh;
        data.mahasiswa.forEach((mhs, iRow) => {
            if (rowY + rowHeight > doc.page.height - 40) {
                doc.addPage();
                rowY = 30;
            }
            const bg = iRow % 2 === 0 ? '#ffffff' : '#f5f5f5';
            doc.save().rect(boxX, rowY, boxW, rowHeight).fill(bg).restore();
            doc.save().lineWidth(0.4).strokeColor('#cccccc');
            doc.rect(boxX, rowY, boxW, rowHeight).stroke();
            let vx = boxX;
            columns.forEach(col => {
                vx += col.width;
                doc.moveTo(vx, rowY).lineTo(vx, rowY + rowHeight).stroke();
            });
            doc.restore();

            const tY = rowY + (rowHeight / 2) - 3.5;
            let cx = boxX;
            columns.forEach(col => {
                let val;
                if (col.komponen) {
                    const v = mhs.nilaiPerKomponen?.[col.komponen];
                    val = (v !== null && v !== undefined) ? Number(v).toFixed(2) : '-';
                    doc.font('Helvetica').fontSize(7);
                } else {
                    switch (col.label) {
                        case 'No':             val = String(mhs.no); doc.font('Helvetica').fontSize(7); break;
                        case 'NIM':            val = mhs.nim; doc.font('Helvetica').fontSize(7); break;
                        case 'Nama Mahasiswa': val = mhs.nama; fitNamaFontSize(val, colNama - 3); break;
                        case 'Nilai':          val = mhs.nilaiAkhir > 0 ? Number(mhs.nilaiAkhir).toFixed(2) : '-'; doc.font('Helvetica-Bold').fontSize(7); break;
                        case 'Grade':          val = mhs.grade || '-'; doc.font('Helvetica-Bold').fontSize(7); break;
                        case 'Lulus':          val = (mhs.grade && mhs.grade !== '-') ? (mhs.lulus ? 'Ya' : 'Tidak') : '-'; doc.font('Helvetica').fontSize(7); break;
                        default:               val = '-'; doc.font('Helvetica').fontSize(7);
                    }
                }
                doc.fillColor('black');
                const padX = col.label === 'Nama Mahasiswa' ? 3 : 0;
                doc.text(val, cx + padX, tY, { width: col.width - padX, align: col.align, lineBreak: false });
                cx += col.width;
            });

            rowY += rowHeight;
        });

        // Baris "Rata-rata nilai kelas"
        if (rowY + rowHeight > doc.page.height - 40) {
            doc.addPage();
            rowY = 30;
        }
        doc.save().rect(boxX, rowY, boxW, rowHeight).fill('#dde8f5').restore();
        doc.save().lineWidth(0.4).strokeColor('#cccccc');
        doc.rect(boxX, rowY, boxW, rowHeight).stroke();
        let vxr = boxX;
        columns.forEach(col => {
            vxr += col.width;
            doc.moveTo(vxr, rowY).lineTo(vxr, rowY + rowHeight).stroke();
        });
        doc.restore();

        const rataGrade = data.rataRataKelas
            ? penilaianService.getGrade(data.rataRataKelas.rataNilaiAkhir, penilaianService.DEFAULT_SKALA).hurufMutu
            : '-';

        const tYr = rowY + (rowHeight / 2) - 3.5;
        let cxr = boxX;
        columns.forEach(col => {
            let val = '';
            if (col.label === 'Nama Mahasiswa') val = 'Rata-rata nilai kelas';
            else if (col.komponen) val = data.rataRataKelas ? Number(data.rataRataKelas.rataPerKomponen[col.komponen] ?? 0).toFixed(2) : '-';
            else if (col.label === 'Nilai') val = data.rataRataKelas ? Number(data.rataRataKelas.rataNilaiAkhir).toFixed(2) : '-';
            else if (col.label === 'Grade') val = rataGrade;

            doc.font('Helvetica-Bold').fontSize(7).fillColor('#0c4781');
            const padX = col.label === 'Nama Mahasiswa' ? 3 : 0;
            doc.text(val, cxr + padX, tYr, { width: col.width - padX, align: col.label === 'Nama Mahasiswa' ? 'left' : col.align, lineBreak: false });
            cxr += col.width;
        });

        doc.y = rowY + rowHeight + 12;

        // ── Status pengisian, tanggal cetak & paraf dosen ──
        if (doc.y > 600) { doc.addPage(); doc.y = 30; }

        const semuaFinal = data.mahasiswa.length > 0
            && data.mahasiswa.every(m => m.keterangan && m.keterangan !== 'Belum Terkunci');
        const statusText = semuaFinal
            ? 'Pengisian nilai untuk kelas ini sudah dikunci/final.'
            : 'Pengisian nilai untuk kelas ini masih berjalan (belum dikunci).';

        const tanggalCetak = new Date().toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        doc.font('Helvetica').fontSize(8).fillColor('black')
            .text(statusText, boxX, doc.y);
        doc.text(`Tanggal Cetak : ${tanggalCetak}`, boxX, doc.y);

        doc.moveDown(0.5);
        const dosenStr = (data.dosen || []).map(d => d.nama).join(', ') || '-';
        doc.text('Paraf Dosen :', boxX, doc.y);
        doc.moveDown(2.5);
        doc.font('Helvetica-Bold').text(dosenStr, boxX, doc.y);

        doc.moveDown(2);
        doc.save().moveTo(boxX, doc.y).lineTo(boxX + boxW, doc.y)
            .lineWidth(0.5).strokeColor('#cccccc').stroke().restore();
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(7).fillColor('#555555')
            .text(buildFooterText(namaPencetak, 'siakad/rep_nilaikuliah'), boxX, doc.y);

        doc.end();
    } catch (error) { next(error); }
};


// ============================================================================
// 10. EXPORT PDF — LAPORAN DAFTAR NILAI MAHASISWA (format SIAKAD)
// ============================================================================
export const exportPdfLaporanDaftarNilai = async (req, res, next) => {
    try {
        const { kelasId } = req.params;
        const namaPencetak = req.user?.nama || req.user?.name || 'Sistem';

        const data = await penilaianService.getDataDaftarNilai(kelasId);

        const doc    = new PDFDocument({ margin: 20, size: 'A4', layout: 'portrait' });
        const boxX   = 20;
        const PAGE_W = doc.page.width;
        const boxW   = PAGE_W - boxX * 2;
        const halfW  = boxW / 2;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Laporan_Daftar_Nilai_${data.kelas.nama || kelasId}.pdf"`);
        doc.pipe(res);

        const logoPath = path.join(process.cwd(), 'public', 'logo', 'uika.jpg');
        drawKopSurat(doc, logoPath, boxX, boxW);

        doc.font('Helvetica-Bold').fontSize(12).fillColor('black')
            .text('LAPORAN DAFTAR NILAI MAHASISWA', boxX, doc.y, { width: boxW, align: 'center' });
        doc.font('Helvetica').fontSize(9)
            .text(`Program Studi ${data.programStudi.jenjang} ${data.programStudi.nama}`, boxX, doc.y + 2, { width: boxW, align: 'center' });
        doc.text(`Periode ${data.periode.nama}`, boxX, doc.y, { width: boxW, align: 'center' });
        doc.moveDown(0.6);

        const dosenStr = (data.dosen || []).map(d => d.nama).join(', ') || '-';
        const sistemKuliah = (data.kelas.sistemKuliah && data.kelas.sistemKuliah !== '-') ? data.kelas.sistemKuliah : '';

        doc.fontSize(8).fillColor('black');
        let infoY = doc.y;
        doc.text(`Mata kuliah : ${data.mataKuliah.nama}`, boxX, infoY, { width: halfW - 10 });
        doc.text(`Nama Kelas : ${data.kelas.nama}`, boxX + halfW, infoY, { width: halfW - 10, align: 'right' });

        infoY = doc.y;
        doc.text(`Pengajar : ${dosenStr}`, boxX, infoY, { width: halfW - 10 });
        doc.text(`Sistem Kuliah : ${sistemKuliah}`, boxX + halfW, infoY, { width: halfW - 10, align: 'right' });

        doc.moveDown(0.8);

        // ── Tabel ──
        const colNo    = 30;
        const colNim   = 80;
        const colNilai = 60;
        const colAngka = 65;
        const colHuruf = 65;
        const colKet   = 50;
        const colNama  = boxW - (colNo + colNim + colNilai + colAngka + colHuruf + colKet);

        const rowHeight = 16;
        const hh        = 20;

        doc.save().rect(boxX, doc.y, boxW, hh).fill('#0c4781').restore();
        doc.save().lineWidth(0.5).strokeColor('#aaaaaa').rect(boxX, doc.y, boxW, hh).stroke();

        const headerY = doc.y;
        let curX = boxX;
        [colNo, colNim, colNama, colNilai, colAngka, colHuruf].forEach((w) => {
            curX += w;
            doc.moveTo(curX, headerY).lineTo(curX, headerY + hh).stroke();
        });
        doc.restore();

        doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
        const hY = headerY + (hh / 2) - 4;
        let tx = boxX;
        doc.text('No', tx, hY, { width: colNo, align: 'center', lineBreak: false }); tx += colNo;
        doc.text('NIM', tx, hY, { width: colNim, align: 'center', lineBreak: false }); tx += colNim;
        doc.text('NAMA', tx, hY, { width: colNama, align: 'center', lineBreak: false }); tx += colNama;
        doc.text('NILAI', tx, hY, { width: colNilai, align: 'center', lineBreak: false }); tx += colNilai;
        doc.text('NILAI ANGKA', tx, hY, { width: colAngka, align: 'center', lineBreak: false }); tx += colAngka;
        doc.text('NILAI HURUF', tx, hY, { width: colHuruf, align: 'center', lineBreak: false }); tx += colHuruf;
        doc.text('KET.', tx, hY, { width: colKet, align: 'center', lineBreak: false });

        let rowY = headerY + hh;
        data.mahasiswa.forEach((mhs, iRow) => {
            if (rowY + rowHeight > doc.page.height - 60) {
                doc.addPage();
                rowY = 30;
            }
            const bg = iRow % 2 === 0 ? '#ffffff' : '#f5f5f5';
            doc.save().rect(boxX, rowY, boxW, rowHeight).fill(bg).restore();
            doc.save().lineWidth(0.4).strokeColor('#cccccc');
            doc.rect(boxX, rowY, boxW, rowHeight).stroke();

            let cx = boxX;
            [colNo, colNim, colNama, colNilai, colAngka, colHuruf].forEach((w) => {
                cx += w;
                doc.moveTo(cx, rowY).lineTo(cx, rowY + rowHeight).stroke();
            });
            doc.restore();

            const tY = rowY + (rowHeight / 2) - 3.5;
            doc.font('Helvetica').fontSize(8).fillColor('black');
            let dx = boxX;
            doc.text(String(mhs.no), dx, tY, { width: colNo, align: 'center', lineBreak: false }); dx += colNo;
            doc.text(mhs.nim, dx, tY, { width: colNim, align: 'center', lineBreak: false }); dx += colNim;
            doc.text(mhs.nama, dx + 3, tY, { width: colNama - 6, align: 'left', lineBreak: false }); dx += colNama;
            doc.text(mhs.nilaiAkhir > 0 ? Number(mhs.nilaiAkhir).toFixed(2) : '-', dx, tY, { width: colNilai, align: 'center', lineBreak: false }); dx += colNilai;
            doc.text(mhs.nilaiAngka > 0 ? Number(mhs.nilaiAngka).toFixed(2) : '-', dx, tY, { width: colAngka, align: 'center', lineBreak: false }); dx += colAngka;
            doc.text(mhs.nilaiHuruf || '-', dx, tY, { width: colHuruf, align: 'center', lineBreak: false }); dx += colHuruf;
            const ketVal = (mhs.keterangan && mhs.keterangan !== 'Lulus' && mhs.keterangan !== '-') ? mhs.keterangan : '';
            doc.text(ketVal, dx, tY, { width: colKet, align: 'center', lineBreak: false });

            rowY += rowHeight;
        });

        doc.y = rowY + 16;

        doc.save().moveTo(boxX, doc.y).lineTo(boxX + boxW, doc.y)
            .lineWidth(0.5).strokeColor('#cccccc').stroke().restore();
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(7).fillColor('#555555')
            .text(buildFooterText(namaPencetak, 'siakad/rep_nilaimhs'), boxX, doc.y);

        doc.end();
    } catch (error) { next(error); }
};