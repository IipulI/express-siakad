import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit-table';
import axios from 'axios';
import * as obeService from '../../services/obe.service.js';
import * as MonitoringService from '../../services/monitoring.service.js';

import path from 'path';

// ─── Env-based institutional constants (same pattern as export-nilai-kelas) ───
const ENV_NAMA_UNIV    = () => process.env.NAMA_UNIVERSITAS   || 'UNIVERSITAS IBN KHALDUN BOGOR';
const ENV_ALAMAT_UNIV  = () => process.env.ALAMAT_UNIVERSITAS || 'Jl KH Sholeh Iskandar KM 2 Kedung Badak Bogor';
const ENV_KONTAK_UNIV  = () => process.env.KONTAK_UNIVERSITAS || 'Website: uika-bogor.ac.id | Email: info@uika-bogor.ac.id | Telp: 0251-8356884';
const ENV_APP_URL      = () => process.env.APP_URL            || 'siakad.uika-bogor.ac.id';
const ENV_WAKIL_REKTOR = () => process.env.NAMA_WAKIL_REKTOR  || '-';
const ENV_KOTA_TTD     = () => process.env.KOTA_TTD           || 'Bogor';

// ─── Footer text builder (dipanggil tiap export, namaPencetak dari req.user) ───
const buildFooter = (namaPencetak) => {
    const printDate = new Date().toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'medium'
    });
    return `Dicetak oleh: ${namaPencetak}, pada ${printDate} WIB | ${ENV_APP_URL()}`;
};

// ============================================================================
// 1. EXPORT EXCEL - MANAJEMEN PL
// ============================================================================

// ============================================================================
// 3. EXPORT EXCEL - MATRIKS PEMETAAN PL -> CPL (DINAMIS)
// ============================================================================
export const exportExcelMatriksPlCpl = async (req, res, next) => {
    try {
        const { obeId } = req.params;
        const data = await obeService.getMatriksPemetaanPlCpl(obeId);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Matriks PL-CPL');

        // Setup Kolom Awal (Statis)
        const columns = [
            { header: 'Kode PL', key: 'kodePl', width: 12 },
            { header: 'Profil Lulusan', key: 'profil', width: 50 },
        ];

        // Tambahkan Kolom CPL Secara Dinamis dari Database
        data.columns.forEach(cpl => {
            columns.push({ header: cpl.kode, key: cpl.id, width: 12 });
        });
        worksheet.columns = columns;

        // Styling Header Dinamis
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell, colNumber) => {
            cell.font = { bold: true, color: { argb: 'FF000000' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            // Kolom 1-2 Hijau, sisanya (Kolom CPL) Orange
            cell.fill = {
                type: 'pattern', pattern: 'solid',
                fgColor: { argb: colNumber <= 2 ? 'FF00A65A' : 'FFF39C12' }
            };
        });

        // Masukkan Data Matriks
        data.rows.forEach((row) => {
            const rowData = { kodePl: row.kode, profil: row.profil };

            // Map bobot ke masing-masing kolom CPL
            row.bobotCpl.forEach(b => {
                rowData[b.cplId] = b.bobot > 0 ? b.bobot : ''; // Kosongkan jika 0
            });

            const excelRow = worksheet.addRow(rowData);
            excelRow.eachCell((cell) => {
                cell.alignment = { vertical: 'top', wrapText: true };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Matriks_PL_CPL.xlsx"');
        await workbook.xlsx.write(res);
        res.status(200).end();
    } catch (error) { next(error); }
};

// ============================================================================
// 4. EXPORT PDF - MATRIKS PEMETAAN CPL -> MK
// ============================================================================
export const exportPdfPemetaanCplMk = async (req, res, next) => {
    try {
        const { obeId } = req.params;
        const laporan = await obeService.getLaporanPemetaanCplMk(obeId);
        const { header, data: dataLaporan } = laporan;

        const doc = new PDFDocument({ margin: 40, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Laporan_Pemetaan_CPL_MK.pdf"');
        doc.pipe(res);

        // A. KOP
        doc.font('Helvetica-Bold').fontSize(12).text('Laporan Pemetaan CPL → MK', { align: 'center', underline: true });
        doc.moveDown(1);

        doc.font('Helvetica').fontSize(10);
        doc.text(`Program Studi:`, 40, doc.y, { continued: true, width: 100 });
        doc.text(header.programStudi, { continued: true });
        doc.text(`   Tahun Kurikulum: ${header.tahunKurikulum}`, { align: 'right' });
        doc.moveDown(1.5);

        // B. BARIS TABEL (rowspan-simulasi lewat teks kosong)
        const tableRows = [];
        let no = 1;

        dataLaporan.forEach(grupCpl => {
            let isFirstCpl = true;

            grupCpl.mks.forEach(grupMk => {
                let isFirstMk = true;

                grupMk.cpmks.forEach(itemCpmk => {
                    tableRows.push({
                        no:    isFirstCpl ? `${no}.` : '',
                        cpl:   isFirstCpl ? grupCpl.kodeCpl : '',
                        mk:    isFirstMk  ? grupMk.kodeMk   : '',
                        cpmk:  itemCpmk.kodeCpmk,
                        bobot: itemCpmk.bobot > 0
                            ? itemCpmk.bobot.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : '0,00',
                        total: isFirstCpl
                            ? (grupCpl.total > 0
                                ? grupCpl.total.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : '0,00')
                            : ''
                    });
                    isFirstCpl = false;
                    isFirstMk  = false;
                });
            });
            no++;
        });

        if (tableRows.length === 0) {
            doc.font('Helvetica').fontSize(10).text('Belum ada data pemetaan.', { align: 'center' });
            doc.end();
            return;
        }

        // C. RENDER TABEL
        const table = {
            headers: [
                { label: 'No.',       property: 'no',    width: 30,  align: 'center' },
                { label: 'Kode CPL',  property: 'cpl',   width: 65  },
                { label: 'Kode MK',   property: 'mk',    width: 80  },
                { label: 'Kode CPMK', property: 'cpmk',  width: 100 },
                { label: 'Bobot',     property: 'bobot', width: 80,  align: 'right' },
                { label: 'Total',     property: 'total', width: 80,  align: 'right' }
            ],
            datas: tableRows
        };

        await doc.table(table, {
            prepareHeader: () => doc.font('Helvetica-Bold').fontSize(9),
            prepareRow:    () => doc.font('Helvetica').fontSize(9)
        });

        doc.end();
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// 5. EXPORT PDF - LAPORAN OBE LENGKAP (MULTIPLE TAHUN KURIKULUM)
// ============================================================================
export const exportPdfLaporanLengkap = async (req, res, next) => {
    try {
        const idsParam = req.query.ids;
        if (!idsParam) return res.status(400).json({ status: 400, message: "Parameter 'ids' wajib dikirim!" });

        const obeIds = idsParam.split(',');
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Laporan_OBE_Lengkap.pdf"');
        doc.pipe(res);

        // 🟢 FUNGSI AJAIB UNTUK MENGGAMBAR GARIS KOLOM (GRID) SECARA MANUAL
        const drawGrid = (val, idxCol, idxRow, row, rectRow, rectCell) => {
            doc.save()
                .lineWidth(0.5)
                .strokeColor('#95a5a6') // Warna garis abu-abu rapi
                .rect(rectCell.x, rectCell.y, rectCell.width, rectCell.height)
                .stroke()
                .restore();
            return val;
        };

        for (let i = 0; i < obeIds.length; i++) {
            const obeId = obeIds[i];
            const dataLaporan = await obeService.getCetakLaporanObe(obeId);
            const { header, profilLulusan, capaianPembelajaran, pemetaanPlCpl, pemetaanCplMk } = dataLaporan;

            if (i > 0) doc.addPage();

            // =========================================================
            // A. KOP LAPORAN (Tengah & Rapih)
            // =========================================================
            doc.font('Helvetica-Bold').fontSize(14).text('Laporan Pengisian OBE', { align: 'center', underline: true });
            doc.moveDown(1.5);

            doc.font('Helvetica').fontSize(10);
            doc.text(`Program Studi`, 30, doc.y, { continued: true });
            doc.text(`:   ${header.programStudi || '-'}`, 130, doc.y);

            const yBefore = doc.y;
            doc.text(`Jenjang Pendidikan`, 450, doc.y - 12, { continued: true });
            doc.text(`:   ${header.jenjangPendidikan || '-'}`, 560, doc.y - 12);
            doc.y = yBefore;

            doc.text(`Tahun Kurikulum`, 30, doc.y, { continued: true });
            doc.text(`:   ${header.tahunKurikulum || '-'}`, 130, doc.y);
            doc.moveDown(2);

            const tableOptions = {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
                prepareRow: () => doc.font("Helvetica").fontSize(8),
                padding: 4,
                x: 30,
                divider: {
                    header: { disabled: false, width: 1, opacity: 1 },
                    horizontal: { disabled: false, width: 0.5, opacity: 1 }
                }
            };

            // =========================================================
            // B. TABEL 1: PROFIL LULUSAN
            // =========================================================
            await doc.table({
                title: "Profil Lulusan",
                headers: [
                    { label: "Kode PL", property: "kode", width: 50, renderer: drawGrid },
                    { label: "Profil Lulusan", property: "profil", width: 230, renderer: drawGrid },
                    { label: "Profesi", property: "profesi", width: 200, renderer: drawGrid },
                    { label: "Deskripsi Lulusan", property: "deskripsi", width: 300, renderer: drawGrid }
                ],
                datas: profilLulusan.map(pl => ({
                    kode: pl.kode || "-", profil: pl.profil || "-", profesi: pl.profesi || "-", deskripsi: pl.deskripsi || "-"
                }))
            }, tableOptions);
            doc.moveDown(1);

            // =========================================================
            // C. TABEL 2: CAPAIAN PEMBELAJARAN LULUSAN (CPL)
            // =========================================================
            doc.addPage();
            await doc.table({
                title: "Capaian Pembelajaran Lulusan (CPL)",
                headers: [
                    { label: "Kode CPL", property: "kode", width: 60, renderer: drawGrid },
                    { label: "Deskripsi CPL", property: "deskripsi", width: 620, renderer: drawGrid },
                    { label: "Kategori", property: "kategori", width: 100, renderer: drawGrid }
                ],
                datas: capaianPembelajaran.map(cpl => ({
                    kode: cpl.kode || "-", deskripsi: cpl.deskripsi || "-", kategori: cpl.kategori || "-"
                }))
            }, tableOptions);
            doc.moveDown(1);

            // =========================================================
            // 🚨 SCRIPT PENYELAMAT: FILTER DUPLIKAT CPL DARI JSON 🚨
            // =========================================================
            const uniqueCpls = capaianPembelajaran.map(c => ({ kode: c.kode, deskripsi: c.deskripsi }));

            const cplColWidth = uniqueCpls.length > 0 ? Math.floor(450 / uniqueCpls.length) : 45;

            // =========================================================
            // D. TABEL 3: MATRIKS PL -> CPL
            // =========================================================
            const t3Headers = [
                { label: "Kode PL", property: "kodePl", width: 50, renderer: drawGrid },
                { label: "Profil Lulusan", property: "profil", width: 280, renderer: drawGrid }
            ];
            uniqueCpls.forEach(cpl => {
                t3Headers.push({ label: cpl.kode, property: cpl.kode, width: cplColWidth, align: "center", renderer: drawGrid });
            });

            const t3Datas = [];
            if (pemetaanPlCpl && pemetaanPlCpl.rows) {
                pemetaanPlCpl.rows.forEach(row => {
                    const rowData = { kodePl: row.kodePl, profil: row.profil };
                    uniqueCpls.forEach(cpl => {
                        // 🟢 FIX: Cari CPL yang BENAR-BENAR ADA BOBOTNYA (Bypass Duplicate Kosong)
                        const match = row.bobotCpl.find(b => b.kodeCpl === cpl.kode && b.bobot && b.bobot !== "");
                        rowData[cpl.kode] = match ? match.bobot : "-";
                    });
                    t3Datas.push(rowData);
                });
            }

            await doc.table({ title: "Pemetaan PL ke CPL", headers: t3Headers, datas: t3Datas }, tableOptions);
            doc.moveDown(1);

            // =========================================================
            // E. TABEL 4: MATRIKS CPL -> MK
            // =========================================================
            const t4Headers = [
                { label: "Kode MK", property: "kodeMk", width: 60, renderer: drawGrid },
                { label: "Mata Kuliah", property: "namaMk", width: 230, renderer: drawGrid },
                { label: "Jenis MK", property: "jenisMk", width: 40, align: "center", renderer: drawGrid }
            ];
            uniqueCpls.forEach(cpl => {
                t4Headers.push({ label: cpl.kode, property: cpl.kode, width: cplColWidth, align: "center", renderer: drawGrid });
            });

            const t4Datas = [];
            if (pemetaanCplMk && pemetaanCplMk.rows) {
                pemetaanCplMk.rows.forEach(row => {
                    const rowData = { kodeMk: row.kodeMk, namaMk: row.namaMk, jenisMk: row.jenisMk };
                    uniqueCpls.forEach(cpl => {
                        // 🟢 FIX: Cari CPL yang BENAR-BENAR Dicentang True (Bypass Duplicate False)
                        const match = row.mapping.find(m => m.kodeCpl === cpl.kode && m.isMapped === true);
                        rowData[cpl.kode] = match ? "v" : "-"; // Menggunakan "v" kecil agar aman di PDF
                    });
                    t4Datas.push(rowData);
                });
            }

            await doc.table({ title: "Pemetaan CPL ke MK", headers: t4Headers, datas: t4Datas }, tableOptions);
        }

        doc.end();
    } catch (error) {
        next(error);
    }
};

// ============================================================================
// 6. EXPORT PDF - MONITORING CPL PER PROGRAM STUDI (100% PERFECT LAYOUT)
// ============================================================================
export const exportPdfMonitoringCplProdi = async (req, res, next) => {
    try {
        const filters = req.query;
        const data = await MonitoringService.getCplPerProgramStudi(filters);

        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Monitoring_CPL_Prodi.pdf"');
        doc.pipe(res);

        const logoPath = path.join(process.cwd(), 'public', 'logo', 'uika.jpg');
        const isPakaiKop = String(filters.kop).toLowerCase() === 'true';

        // =========================================================
        // 1. KOP SURAT
        // =========================================================
        if (isPakaiKop) {
            doc.font('Helvetica-Bold').fontSize(14).text(ENV_NAMA_UNIV(), { align: 'center' });
            doc.font('Helvetica').fontSize(9).text(ENV_ALAMAT_UNIV(), { align: 'center' });
            doc.fontSize(8).text(ENV_KONTAK_UNIV(), { align: 'center' });
            doc.moveDown(1);
            doc.moveTo(30, doc.y).lineTo(565, doc.y).lineWidth(2).strokeColor('black').stroke();
            doc.moveDown(1.5);
        }

        // =========================================================
        // 2. BAGIAN INFO KIRI-KANAN
        // =========================================================
        const infoStartY = doc.y;

        try {
            doc.image(logoPath, 30, infoStartY, { width: 85, height: 85 });
        } catch (e) {
            console.log("Logo uika.jpg tidak ditemukan di public/logo/");
        }

        const infoX = 135;
        let infoY = infoStartY;

        doc.save().rect(infoX, infoY, 430, 20).fill('#1565C0').restore();
        doc.fillColor('white').font('Helvetica-Bold').fontSize(9).text('CPL PER PROGRAM STUDI', infoX, infoY + 6, { width: 430, align: 'center' });

        infoY += 20;
        const keys = ["Tahun Kurikulum", "Program Studi", "Angkatan", "Total Mahasiswa", "Metode Perhitungan"];
        const vals = [
            data.info.tahunKurikulum,
            data.info.programStudi,
            data.info.angkatan,
            data.info.totalMahasiswa.toString(),
            data.info.metodePerhitungan
        ];

        doc.lineWidth(0.5).strokeColor('#bdc3c7');
        for (let i = 0; i < 5; i++) {
            doc.rect(infoX, infoY, 130, 20).stroke();
            doc.fillColor('black').font('Helvetica-Bold').fontSize(8).text(keys[i], infoX + 5, infoY + 6);
            doc.rect(infoX + 130, infoY, 300, 20).stroke();
            doc.font('Helvetica').text(vals[i], infoX + 138, infoY + 6);
            infoY += 20;
        }

        doc.y = Math.max(infoY + 20, infoStartY + 110);

        // =========================================================
        // 3. SPIDERCHART CPL PRODI ✅ FIXED: Label 2 baris (kode + nilai capaian)
        // =========================================================
        const chartY = doc.y;
        doc.fillColor('black').font('Helvetica-Bold').fontSize(10).text('Spiderchart CPL Program Studi', 30, chartY);

        // Padding agar minimal 5 titik (anti segitiga / garis lurus)
        const chartLabels = [...data.chart.labels];
        const chartCapaian = [...data.chart.datasets[0].data];
        const chartTarget = [...data.chart.datasets[1].data];

        let pad = 1;
        while (chartLabels.length < 5) {
            chartLabels.push(" ".repeat(pad));
            chartCapaian.push(0);
            chartTarget.push(0);
            pad++;
        }

        // 🟢 FIX UTAMA: Label jadi array 2 elemen [kode, nilai] persis seperti transkrip OBE
        const labelsWith2Lines = chartLabels.map((label, i) => {
            if (!label.trim()) return label; // titik padding kosong tetap string biasa
            const nilaiStr = (Number(chartCapaian[i]) || 0).toFixed(2).replace('.', ',');
            return [label, nilaiStr];
        });

        const chartConfig = {
            type: 'radar',
            data: {
                labels: labelsWith2Lines,
                datasets: [
                    {
                        label: 'Capaian',
                        data: chartCapaian,
                        backgroundColor: 'rgba(54, 162, 235, 0.4)',
                        borderColor: 'rgb(54, 162, 235)',
                        pointBackgroundColor: 'rgb(54, 162, 235)'
                    },
                    {
                        label: 'Target',
                        data: chartTarget,
                        backgroundColor: 'rgba(255, 205, 86, 0.2)',
                        borderColor: 'rgb(255, 205, 86)',
                        pointBackgroundColor: 'rgb(255, 205, 86)'
                    }
                ]
            },
            options: {
                scale: {
                    ticks: { beginAtZero: true, max: 100, display: false },
                    pointLabels: { fontSize: 10, fontStyle: 'bold', fontColor: '#2c3e50' }
                },
                legend: { position: 'bottom' },
                plugins: { datalabels: { display: false } } // nilai sudah tampil di label 2 baris
            }
        };

        const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=260&h=260`;
        try {
            const chartResponse = await axios.get(chartUrl, { responseType: 'arraybuffer', timeout: 10000 });
            doc.image(Buffer.from(chartResponse.data, 'binary'), 20, chartY + 15, { width: 260 });
        } catch (e) {
            doc.font('Helvetica-Oblique').fontSize(8).fillColor('#e74c3c')
                .text('[Gagal memuat grafik dari internet]', 20, chartY + 120, { width: 260, align: 'center' });
        }

        // Kotak Summary Performa
        const sumX = 310;
        doc.fillColor('black').font('Helvetica-Bold').fontSize(10).text('Performa CPL Program Studi', sumX, chartY + 25);
        doc.save().roundedRect(sumX, chartY + 45, 255, 60, 8).fill('#f4f6f9').restore();

        doc.fillColor('black').font('Helvetica-Bold').fontSize(8).text('CPL Tertinggi', sumX + 15, chartY + 55);
        doc.fillColor('#27ae60').fontSize(16).text(data.summary.tertinggi.nilai, sumX + 15, chartY + 70);
        doc.fillColor('black').font('Helvetica').fontSize(7).text(data.summary.tertinggi.label || '-', sumX + 15, chartY + 90);

        doc.fillColor('black').font('Helvetica-Bold').fontSize(8).text('CPL Terendah', sumX + 130, chartY + 55);
        doc.fillColor('#e74c3c').fontSize(16).text(data.summary.terendah.nilai, sumX + 130, chartY + 70);
        doc.fillColor('black').font('Helvetica').fontSize(7).text(data.summary.terendah.label || '-', sumX + 130, chartY + 90);

        doc.y = Math.max(doc.y, chartY + 280);
        doc.moveDown(1);

        // =========================================================
        // 4. TABEL DETAIL CPL ✅ FIXED: 100% Manual Draw (Anti Bug)
        // =========================================================
        doc.font('Helvetica-Bold').fontSize(10).fillColor('black')
            .text('Detail Deskripsi dan Hasil Setiap CPL Program Studi', 30, doc.y);
        doc.moveDown(0.5);

        const tblX = 30;
        const tblW = 535;
        const colKode = 55;
        const colTarget = 45;
        const colCap = 50;
        const colStatus = 80;
        const colBelum = 50;
        const colSudah = 50;
        const colDesk = tblW - (colKode + colTarget + colCap + colStatus + colBelum + colSudah);
        const rowHeight = 18;

        // ── HEADER ──
        const tblHY = doc.y;
        const tblHH = 20;

        doc.save().rect(tblX, tblHY, tblW, tblHH).fill('#1565C0').restore();
        doc.save().lineWidth(0.5).strokeColor('#aaaaaa').rect(tblX, tblHY, tblW, tblHH).stroke().restore();

        // Garis vertikal header
        let cx = tblX;
        [colKode, colDesk, colTarget, colCap, colStatus, colBelum].forEach(w => {
            cx += w;
            doc.save().lineWidth(0.5).strokeColor('#aaaaaa').moveTo(cx, tblHY).lineTo(cx, tblHY + tblHH).stroke().restore();
        });

        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('white');
        let hx = tblX;
        doc.text('Kode CPL', hx, tblHY + 6, { width: colKode, align: 'center', lineBreak: false }); hx += colKode;
        doc.text('Deskripsi', hx, tblHY + 6, { width: colDesk, align: 'center', lineBreak: false }); hx += colDesk;
        doc.text('Target', hx, tblHY + 6, { width: colTarget, align: 'center', lineBreak: false }); hx += colTarget;
        doc.text('Capaian', hx, tblHY + 6, { width: colCap, align: 'center', lineBreak: false }); hx += colCap;
        doc.text('Status', hx, tblHY + 6, { width: colStatus, align: 'center', lineBreak: false }); hx += colStatus;
        doc.text('Belum', hx, tblHY + 6, { width: colBelum, align: 'center', lineBreak: false }); hx += colBelum;
        doc.text('Sudah', hx, tblHY + 6, { width: colSudah, align: 'center', lineBreak: false });

        // ── BARIS DATA ──
        let tblRowY = tblHY + tblHH;

        (data.tabel || []).forEach((row, iRow) => {
            const textH = doc.heightOfString(row.deskripsi || '-', { width: colDesk - 8, fontSize: 7 });
            const cellH = Math.max(rowHeight, textH + 10);

            // Page break manual
            if (tblRowY + cellH > 760) {
                doc.addPage();
                tblRowY = 30;
            }

            // Background selang-seling
            const bg = iRow % 2 === 0 ? '#ffffff' : '#f4f6f9';
            doc.save().rect(tblX, tblRowY, tblW, cellH).fill(bg).restore();

            // Border & garis vertikal
            doc.save().lineWidth(0.5).strokeColor('#bdc3c7');
            doc.rect(tblX, tblRowY, tblW, cellH).stroke();
            let vx = tblX;
            [colKode, colDesk, colTarget, colCap, colStatus, colBelum].forEach(w => {
                vx += w;
                doc.moveTo(vx, tblRowY).lineTo(vx, tblRowY + cellH).stroke();
            });
            doc.restore();

            // Teks tiap sel
            const centerY = tblRowY + (cellH / 2) - 3.5;
            let dx = tblX;

            doc.font('Helvetica-Bold').fontSize(7.5).fillColor('black')
                .text(row.kode || '-', dx, centerY, { width: colKode, align: 'center', lineBreak: false });
            dx += colKode;

            doc.font('Helvetica').fontSize(7)
                .text(row.deskripsi || '-', dx + 4, tblRowY + 5, { width: colDesk - 8, align: 'left' });
            dx += colDesk;

            doc.fontSize(7.5)
                .text(row.target ?? '-', dx, centerY, { width: colTarget, align: 'center', lineBreak: false });
            dx += colTarget;

            doc.text(row.capaian ?? '-', dx, centerY, { width: colCap, align: 'center', lineBreak: false });
            dx += colCap;

            // Status warna
            let statusColor = '#7f8c8d';
            if (row.status === 'Tercapai') statusColor = '#27ae60';
            else if (row.status && row.status !== 'Belum Dinilai') statusColor = '#e74c3c';

            doc.font('Helvetica-Bold').fillColor(statusColor)
                .text(row.status || '-', dx, centerY, { width: colStatus, align: 'center', lineBreak: false });
            dx += colStatus;

            doc.font('Helvetica').fillColor('black')
                .text(String(row.mhsBelum ?? '-'), dx, centerY, { width: colBelum, align: 'center', lineBreak: false });
            dx += colBelum;

            doc.text(String(row.mhsSudah ?? '-'), dx, centerY, { width: colSudah, align: 'center', lineBreak: false });

            tblRowY += cellH;
        });

        doc.y = tblRowY + 10;

        // =========================================================
        // 5. FOOTER
        // =========================================================
        doc.save().rect(0, 810, 430, 15).fill('#f39c12').restore();
        doc.save().rect(430, 810, 165, 15).fill('#1565C0').restore();

        doc.end();
    } catch (error) { next(error); }
};
// export const exportPdfMonitoringCplProdi = async (req, res, next) => {
//     try {
//         const filters = req.query;
//         const data = await MonitoringService.getCplPerProgramStudi(filters);

//         const doc = new PDFDocument({ margin: 30, size: 'A4' });

//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', 'attachment; filename="Monitoring_CPL_Prodi.pdf"');
//         doc.pipe(res);

//         const logoPath = path.join(process.cwd(), 'public', 'logo', 'uika.jpg');
//         const isPakaiKop = String(filters.kop).toLowerCase() === 'true';

//         // =========================================================
//         // 1. KOP SURAT
//         // =========================================================
//         if (isPakaiKop) {
//             doc.font('Helvetica-Bold').fontSize(14).text(ENV_NAMA_UNIV(), { align: 'center' });
//             doc.font('Helvetica').fontSize(9).text(ENV_ALAMAT_UNIV(), { align: 'center' });
//             doc.fontSize(8).text(ENV_KONTAK_UNIV(), { align: 'center' });
//             doc.moveDown(1);
//             doc.moveTo(30, doc.y).lineTo(565, doc.y).lineWidth(2).strokeColor('black').stroke();
//             doc.moveDown(1.5);
//         }

//         // =========================================================
//         // 2. BAGIAN INFO KIRI-KANAN
//         // =========================================================
//         const infoStartY = doc.y;

//         try {
//             doc.image(logoPath, 30, infoStartY, { width: 85, height: 85 });
//         } catch (e) {
//             console.log("Logo uika.jpg tidak ditemukan di public/logo/");
//         }

//         const infoX = 135;
//         let infoY = infoStartY;

//         doc.save().rect(infoX, infoY, 430, 20).fill('#1565C0').restore();
//         doc.fillColor('white').font('Helvetica-Bold').fontSize(9).text('CPL PER PROGRAM STUDI', infoX, infoY + 6, { width: 430, align: 'center' });

//         infoY += 20;
//         const keys = ["Tahun Kurikulum", "Program Studi", "Angkatan", "Total Mahasiswa", "Metode Perhitungan"];
//         const vals = [
//             data.info.tahunKurikulum,
//             data.info.programStudi,
//             data.info.angkatan,
//             data.info.totalMahasiswa.toString(),
//             data.info.metodePerhitungan
//         ];

//         doc.lineWidth(0.5).strokeColor('#bdc3c7');
//         for (let i = 0; i < 5; i++) {
//             doc.rect(infoX, infoY, 130, 20).stroke();
//             doc.fillColor('black').font('Helvetica-Bold').fontSize(8).text(keys[i], infoX + 5, infoY + 6);
//             doc.rect(infoX + 130, infoY, 300, 20).stroke();
//             doc.font('Helvetica').text(vals[i], infoX + 138, infoY + 6);
//             infoY += 20;
//         }

//         doc.y = Math.max(infoY + 20, infoStartY + 110);

//         // =========================================================
//         // 3. SPIDERCHART CPL PRODI ✅ FIXED: Label 2 baris (kode + nilai capaian)
//         // =========================================================
//         const chartY = doc.y;
//         doc.fillColor('black').font('Helvetica-Bold').fontSize(10).text('Spiderchart CPL Program Studi', 30, chartY);

//         // Padding agar minimal 5 titik (anti segitiga / garis lurus)
//         const chartLabels = [...data.chart.labels];
//         const chartCapaian = [...data.chart.datasets[0].data];
//         const chartTarget = [...data.chart.datasets[1].data];

//         let pad = 1;
//         while (chartLabels.length < 5) {
//             chartLabels.push(" ".repeat(pad));
//             chartCapaian.push(0);
//             chartTarget.push(0);
//             pad++;
//         }

//         // 🟢 FIX UTAMA: Label jadi array 2 elemen [kode, nilai] persis seperti transkrip OBE
//         const labelsWith2Lines = chartLabels.map((label, i) => {
//             if (!label.trim()) return label; // titik padding kosong tetap string biasa
//             const nilaiStr = (Number(chartCapaian[i]) || 0).toFixed(2).replace('.', ',');
//             return [label, nilaiStr];
//         });

//         const chartConfig = {
//             type: 'radar',
//             data: {
//                 labels: labelsWith2Lines,
//                 datasets: [
//                     {
//                         label: 'Capaian',
//                         data: chartCapaian,
//                         backgroundColor: 'rgba(54, 162, 235, 0.4)',
//                         borderColor: 'rgb(54, 162, 235)',
//                         pointBackgroundColor: 'rgb(54, 162, 235)'
//                     },
//                     {
//                         label: 'Target',
//                         data: chartTarget,
//                         backgroundColor: 'rgba(255, 205, 86, 0.2)',
//                         borderColor: 'rgb(255, 205, 86)',
//                         pointBackgroundColor: 'rgb(255, 205, 86)'
//                     }
//                 ]
//             },
//             options: {
//                 scale: {
//                     ticks: { beginAtZero: true, max: 100, display: false },
//                     pointLabels: { fontSize: 10, fontStyle: 'bold', fontColor: '#2c3e50' }
//                 },
//                 legend: { position: 'bottom' },
//                 plugins: { datalabels: { display: false } } // nilai sudah tampil di label 2 baris
//             }
//         };

//         const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=260&h=260`;
//         try {
//             const chartResponse = await axios.get(chartUrl, { responseType: 'arraybuffer', timeout: 10000 });
//             doc.image(Buffer.from(chartResponse.data, 'binary'), 20, chartY + 15, { width: 260 });
//         } catch (e) {
//             doc.font('Helvetica-Oblique').fontSize(8).fillColor('#e74c3c')
//                 .text('[Gagal memuat grafik dari internet]', 20, chartY + 120, { width: 260, align: 'center' });
//         }

//         // Kotak Summary Performa
//         const sumX = 310;
//         doc.fillColor('black').font('Helvetica-Bold').fontSize(10).text('Performa CPL Program Studi', sumX, chartY + 25);
//         doc.save().roundedRect(sumX, chartY + 45, 255, 60, 8).fill('#f4f6f9').restore();

//         doc.fillColor('black').font('Helvetica-Bold').fontSize(8).text('CPL Tertinggi', sumX + 15, chartY + 55);
//         doc.fillColor('#27ae60').fontSize(16).text(data.summary.tertinggi.nilai, sumX + 15, chartY + 70);
//         doc.fillColor('black').font('Helvetica').fontSize(7).text(data.summary.tertinggi.label || '-', sumX + 15, chartY + 90);

//         doc.fillColor('black').font('Helvetica-Bold').fontSize(8).text('CPL Terendah', sumX + 130, chartY + 55);
//         doc.fillColor('#e74c3c').fontSize(16).text(data.summary.terendah.nilai, sumX + 130, chartY + 70);
//         doc.fillColor('black').font('Helvetica').fontSize(7).text(data.summary.terendah.label || '-', sumX + 130, chartY + 90);

//         doc.y = Math.max(doc.y, chartY + 280);
//         doc.moveDown(1);

//         // =========================================================
//         // 4. TABEL DETAIL CPL ✅ FIXED: 100% Manual Draw (Anti Bug)
//         // =========================================================
//         doc.font('Helvetica-Bold').fontSize(10).fillColor('black')
//             .text('Detail Deskripsi dan Hasil Setiap CPL Program Studi', 30, doc.y);
//         doc.moveDown(0.5);

//         const tblX = 30;
//         const tblW = 535;
//         const colKode = 55;
//         const colTarget = 45;
//         const colCap = 50;
//         const colStatus = 80;
//         const colBelum = 50;
//         const colSudah = 50;
//         const colDesk = tblW - (colKode + colTarget + colCap + colStatus + colBelum + colSudah);
//         const rowHeight = 18;

//         // ── HEADER ──
//         const tblHY = doc.y;
//         const tblHH = 20;

//         doc.save().rect(tblX, tblHY, tblW, tblHH).fill('#1565C0').restore();
//         doc.save().lineWidth(0.5).strokeColor('#aaaaaa').rect(tblX, tblHY, tblW, tblHH).stroke().restore();

//         // Garis vertikal header
//         let cx = tblX;
//         [colKode, colDesk, colTarget, colCap, colStatus, colBelum].forEach(w => {
//             cx += w;
//             doc.save().lineWidth(0.5).strokeColor('#aaaaaa').moveTo(cx, tblHY).lineTo(cx, tblHY + tblHH).stroke().restore();
//         });

//         doc.font('Helvetica-Bold').fontSize(7.5).fillColor('white');
//         let hx = tblX;
//         doc.text('Kode CPL', hx, tblHY + 6, { width: colKode, align: 'center', lineBreak: false }); hx += colKode;
//         doc.text('Deskripsi', hx, tblHY + 6, { width: colDesk, align: 'center', lineBreak: false }); hx += colDesk;
//         doc.text('Target', hx, tblHY + 6, { width: colTarget, align: 'center', lineBreak: false }); hx += colTarget;
//         doc.text('Capaian', hx, tblHY + 6, { width: colCap, align: 'center', lineBreak: false }); hx += colCap;
//         doc.text('Status', hx, tblHY + 6, { width: colStatus, align: 'center', lineBreak: false }); hx += colStatus;
//         doc.text('Belum', hx, tblHY + 6, { width: colBelum, align: 'center', lineBreak: false }); hx += colBelum;
//         doc.text('Sudah', hx, tblHY + 6, { width: colSudah, align: 'center', lineBreak: false });

//         // ── BARIS DATA ──
//         let tblRowY = tblHY + tblHH;

//         (data.tabel || []).forEach((row, iRow) => {
//             const textH = doc.heightOfString(row.deskripsi || '-', { width: colDesk - 8, fontSize: 7 });
//             const cellH = Math.max(rowHeight, textH + 10);

//             // Page break manual
//             if (tblRowY + cellH > 760) {
//                 doc.addPage();
//                 tblRowY = 30;
//             }

//             // Background selang-seling
//             const bg = iRow % 2 === 0 ? '#ffffff' : '#f4f6f9';
//             doc.save().rect(tblX, tblRowY, tblW, cellH).fill(bg).restore();

//             // Border & garis vertikal
//             doc.save().lineWidth(0.5).strokeColor('#bdc3c7');
//             doc.rect(tblX, tblRowY, tblW, cellH).stroke();
//             let vx = tblX;
//             [colKode, colDesk, colTarget, colCap, colStatus, colBelum].forEach(w => {
//                 vx += w;
//                 doc.moveTo(vx, tblRowY).lineTo(vx, tblRowY + cellH).stroke();
//             });
//             doc.restore();

//             // Teks tiap sel
//             const centerY = tblRowY + (cellH / 2) - 3.5;
//             let dx = tblX;

//             doc.font('Helvetica-Bold').fontSize(7.5).fillColor('black')
//                 .text(row.kode || '-', dx, centerY, { width: colKode, align: 'center', lineBreak: false });
//             dx += colKode;

//             doc.font('Helvetica').fontSize(7)
//                 .text(row.deskripsi || '-', dx + 4, tblRowY + 5, { width: colDesk - 8, align: 'left' });
//             dx += colDesk;

//             // Teks Target
//             doc.fontSize(7.5).fillColor('black')
//                 .text(row.target ?? '-', dx, centerY, { width: colTarget, align: 'center', lineBreak: false });
//             dx += colTarget;

//             // 🟢 LOGIKA BARU: MERAHKAN ANGKA CAPAIAN PRODI JIKA DI BAWAH TARGET
//             const tVal = parseFloat(String(row.target).replace(',', '.')) || 0;
//             const cVal = parseFloat(String(row.capaian).replace(',', '.')) || 0;
//             const isMerah = cVal < tVal && row.status !== 'Belum Dinilai';

//             doc.fillColor(isMerah ? '#e74c3c' : 'black');
//             doc.text(row.capaian ?? '-', dx, centerY, { width: colCap, align: 'center', lineBreak: false });
//             dx += colCap;

//             // Status warna (Ujung Kanan)
//             let statusColor = '#7f8c8d';
//             if (row.status === 'Tercapai') statusColor = '#27ae60';
//             else if (row.status && row.status !== 'Belum Dinilai') statusColor = '#e74c3c';

//             doc.font('Helvetica-Bold').fillColor(statusColor)
//                 .text(row.status || '-', dx, centerY, { width: colStatus, align: 'center', lineBreak: false });
//             dx += colStatus;

//             doc.font('Helvetica').fillColor('black')
//                 .text(String(row.mhsBelum ?? '-'), dx, centerY, { width: colBelum, align: 'center', lineBreak: false });
//             dx += colBelum;

//             doc.text(String(row.mhsSudah ?? '-'), dx, centerY, { width: colSudah, align: 'center', lineBreak: false });

//             tblRowY += cellH;
//         });

//         doc.y = tblRowY + 10;

//         // =========================================================
//         // 5. FOOTER
//         // =========================================================
//         doc.save().rect(0, 810, 430, 15).fill('#f39c12').restore();
//         doc.save().rect(430, 810, 165, 15).fill('#1565C0').restore();

//         doc.end();
//     } catch (error) { next(error); }
// };
// ============================================================================
// 7. EXPORT PDF - MONITORING CPL PER MAHASISWA (DAFTAR KELAS)
// ============================================================================
export const exportPdfLaporanCplPerMahasiswa = async (req, res, next) => {
    try {
        const filters = req.query;
        const data = await MonitoringService.getLaporanCplPerMahasiswa(filters);

        const doc = new PDFDocument({ margin: 20, size: 'A4', layout: 'landscape' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Monitoring_CPL_Mahasiswa.pdf"');
        doc.pipe(res);

        const logoPath = path.join(process.cwd(), 'public', 'logo', 'uika.jpg');

        // =========================================================
        // KONSTANTA LAYOUT — semua dihitung dari pageWidth
        // A4 Landscape = 841.89 x 595.28 pt, margin 20 kiri+kanan
        // =========================================================
        const PAGE_W = doc.page.width;   // 841.89
        const MARGIN = 20;
        const boxX = MARGIN;
        const boxW = PAGE_W - MARGIN * 2; // ±801.89

        // ── Kolom tetap ──
        const colNo = 25;
        const colNim = 80;
        const colNama = 160;
        const fixedW = colNo + colNim + colNama;

        // ── Kolom CPL: lebar dihitung dinamis ──
        const cplCount = data.daftarCpl.length || 1;
        const cplArea = boxW - fixedW;
        const MIN_CPL_W = 28;   // lebar minimum 1 kolom CPL (pt)
        const cplW = Math.max(MIN_CPL_W, cplArea / cplCount);

        // Jika cplW > cplArea/cplCount artinya tabel melebar — kita butuh lebar total aktual
        const tableW = fixedW + cplW * cplCount; // lebar tabel sesungguhnya
        const cplStartX = boxX + fixedW;

        // ── Ukuran font & baris: dikecilkan kalau kolom sempit ──
        const fontSizeHeader = cplW < 32 ? 6 : 7.5;
        const fontSizeData = cplW < 32 ? 6 : 7.5;
        const rowHeight = cplW < 32 ? 14 : 18;
        const headerHeight = cplW < 32 ? 22 : 26;
        const halfHY_offset = cplW < 32 ? 11 : 13; // garis pemisah sub-header

        const isPakaiKop = String(filters.kop).toLowerCase() === 'true';

        // =========================================================
        // HELPER: addNewPage — buat halaman baru dengan koordinat reset
        // =========================================================
        const addNewPage = () => {
            doc.addPage({ margin: 20, size: 'A4', layout: 'landscape' });
            doc.y = MARGIN;
        };

        // =========================================================
        // HELPER: checkPageSpace — jika sisa Y kurang, tambah halaman
        // =========================================================
        const checkPageSpace = (neededHeight) => {
            const pageH = doc.page.height;
            const bottomMargin = 40;
            if (doc.y + neededHeight > pageH - bottomMargin) {
                addNewPage();
                return true;
            }
            return false;
        };

        // =========================================================
        // 1. KOP SURAT
        // =========================================================
        if (isPakaiKop) {
            const logoSize = 60;
            try { doc.image(logoPath, boxX, 15, { width: logoSize }); } catch (e) { }

            doc.font('Helvetica-Bold').fontSize(14).fillColor('black')
                .text(ENV_NAMA_UNIV(), boxX, 18, { width: boxW, align: 'center' });
            doc.font('Helvetica').fontSize(8)
                .text(ENV_ALAMAT_UNIV(), boxX, doc.y + 1, { width: boxW, align: 'center' });
            doc.text(ENV_KONTAK_UNIV(), boxX, doc.y + 1, { width: boxW, align: 'center' });

            if (doc.y < 15 + logoSize + 4) doc.y = 15 + logoSize + 4;

            doc.moveDown(0.4);
            doc.save().lineWidth(1).strokeColor('#000000')
                .moveTo(boxX, doc.y).lineTo(boxX + boxW, doc.y).stroke().restore();
            doc.moveDown(0.6);
        }

        // =========================================================
        // 2. INFO SECTION
        // =========================================================
        const rowH = 16;
        const totalH = rowH * 6;
        const infoY = doc.y;
        const leftW = 80;
        const rightW = boxW - leftW;

        doc.save().lineWidth(0.5).strokeColor('#000000');
        doc.rect(boxX, infoY, boxW, totalH).stroke();
        doc.moveTo(boxX + leftW, infoY).lineTo(boxX + leftW, infoY + totalH).stroke();

        if (isPakaiKop) {
            try { doc.image(logoPath, boxX + 10, infoY + 6, { width: 58 }); } catch (e) { }
        }

        doc.save().rect(boxX + leftW, infoY, rightW, rowH).fill('#0c4781').restore();
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff')
            .text('CPL PER MAHASISWA', boxX + leftW, infoY + 5, { width: rightW, align: 'center' });
        doc.moveTo(boxX + leftW, infoY + rowH).lineTo(boxX + boxW, infoY + rowH).stroke();

        const infoKeys = ["Tahun Kurikulum", "Program Studi", "Angkatan", "Total Mahasiswa", "Metode Perhitungan"];
        const infoVals = [
            data.info.tahunKurikulum,
            data.info.programStudi,
            data.info.angkatan,
            data.info.totalMahasiswa.toString(),
            data.info.metodePerhitungan
        ];

        doc.fontSize(8);
        for (let i = 0; i < 5; i++) {
            const ry = infoY + rowH + (i * rowH);
            doc.font('Helvetica-Bold').fillColor('black').text(infoKeys[i], boxX + leftW + 8, ry + 4);
            doc.moveTo(boxX + leftW + 150, ry).lineTo(boxX + leftW + 150, ry + rowH).stroke();
            doc.font('Helvetica').text(infoVals[i], boxX + leftW + 158, ry + 4);
            if (i < 4) doc.moveTo(boxX + leftW, ry + rowH).lineTo(boxX + boxW, ry + rowH).stroke();
        }
        doc.restore();
        doc.y = infoY + totalH + 12;

        // =========================================================
        // 3. DAFTAR CPL
        // =========================================================
        const cplY = doc.y;
        doc.font('Helvetica-Bold').fontSize(8).fillColor('black')
            .text('CPL Program Studi - S1 - Teknik Informatika', boxX + 10, cplY + 6);

        let listY = cplY + 20;
        data.daftarCpl.forEach(c => {
            doc.font('Helvetica-Bold').fontSize(7).text(`•  ${c.kode}`, boxX + 15, listY, { continued: true });
            doc.font('Helvetica').text(`  ${c.deskripsi}`, { width: boxW - 30 });
            listY = doc.y + 2;
        });

        doc.save().lineWidth(0.5).strokeColor('#cccccc')
            .rect(boxX, cplY, boxW, listY - cplY + 4).stroke().restore();
        doc.y = listY + 12;

        // =========================================================
        // 4. TABEL — RESPONSIF MANUAL
        //    Jika tableW > boxW, tabel melebar ke kanan (landscape cukup)
        //    Jika sangat banyak CPL (misal 17+), font & rowHeight diperkecil
        //    Jika baris habis di halaman, lanjut halaman baru + ulang header
        // =========================================================

        const formatNilai = (val) => {
            if (val === null || val === undefined || val === '') return '-';
            const n = Number(val);
            if (isNaN(n)) return '-';
            return n.toFixed(2).replace('.', ',');
        };

        // ── Fungsi gambar HEADER tabel ──
        const drawTableHeader = (startY) => {
            const hh = headerHeight;
            const halfY = startY + halfHY_offset;
            const effTableW = fixedW + cplW * cplCount; // lebar aktual

            // Background biru header
            doc.save().rect(boxX, startY, effTableW, hh).fill('#0c4781').restore();

            // Border luar header
            doc.save().lineWidth(0.5).strokeColor('#aaaaaa');
            doc.rect(boxX, startY, effTableW, hh).stroke();

            // Garis vertikal kolom tetap
            doc.moveTo(boxX + colNo, startY).lineTo(boxX + colNo, startY + hh).stroke();
            doc.moveTo(boxX + colNo + colNim, startY).lineTo(boxX + colNo + colNim, startY + hh).stroke();
            doc.moveTo(cplStartX, startY).lineTo(cplStartX, startY + hh).stroke();

            // Garis horizontal sub-header CPL
            doc.moveTo(cplStartX, halfY).lineTo(boxX + effTableW, halfY).stroke();

            // Garis vertikal tiap kolom CPL (bawah halfY saja)
            for (let i = 1; i < cplCount; i++) {
                doc.moveTo(cplStartX + (i * cplW), halfY)
                    .lineTo(cplStartX + (i * cplW), startY + hh).stroke();
            }
            doc.restore();

            // Teks header — putih
            doc.font('Helvetica-Bold').fontSize(fontSizeHeader).fillColor('#ffffff');
            const textTopY = startY + (hh / 2) - (fontSizeHeader / 2) - (halfHY_offset / 4);
            doc.text('No.', boxX, textTopY, { width: colNo, align: 'center', lineBreak: false });
            doc.text('NIM', boxX + colNo, textTopY, { width: colNim, align: 'center', lineBreak: false });
            doc.text('Nama Mahasiswa', boxX + colNo + colNim, textTopY, { width: colNama, align: 'center', lineBreak: false });
            doc.text('Nilai CPL', cplStartX, startY + 3, { width: cplW * cplCount, align: 'center', lineBreak: false });

            // Sub-header kode CPL
            doc.fontSize(fontSizeHeader - 0.5).fillColor('#ffffff');
            data.daftarCpl.forEach((c, i) => {
                doc.text(
                    c.kode,
                    cplStartX + (i * cplW),
                    halfY + 3,
                    { width: cplW, align: 'center', lineBreak: false }
                );
            });

            return startY + hh; // return Y setelah header
        };

        // ── Fungsi gambar SATU BARIS data ──
        const drawTableRow = (row, rowY, iRow) => {
            const effTableW = fixedW + cplW * cplCount;
            const bgColor = row.isRerata ? '#dde8f5' : (iRow % 2 === 0 ? '#ffffff' : '#f5f5f5');

            doc.save().rect(boxX, rowY, effTableW, rowHeight).fill(bgColor).restore();

            doc.save().lineWidth(0.4).strokeColor('#cccccc');
            doc.rect(boxX, rowY, effTableW, rowHeight).stroke();
            doc.moveTo(boxX + colNo, rowY).lineTo(boxX + colNo, rowY + rowHeight).stroke();
            doc.moveTo(boxX + colNo + colNim, rowY).lineTo(boxX + colNo + colNim, rowY + rowHeight).stroke();
            doc.moveTo(cplStartX, rowY).lineTo(cplStartX, rowY + rowHeight).stroke();
            for (let i = 1; i < cplCount; i++) {
                doc.moveTo(cplStartX + (i * cplW), rowY)
                    .lineTo(cplStartX + (i * cplW), rowY + rowHeight).stroke();
            }
            doc.restore();

            const textY = rowY + (rowHeight / 2) - (fontSizeData / 2);
            const font = row.isRerata ? 'Helvetica-Bold' : 'Helvetica';

            doc.font(font).fontSize(fontSizeData).fillColor(row.isRerata ? '#0c4781' : 'black');
            doc.text(row.no, boxX, textY, { width: colNo, align: 'center', lineBreak: false });
            doc.text(row.nim, boxX + colNo, textY, { width: colNim, align: 'center', lineBreak: false });
            doc.text(row.nama, boxX + colNo + colNim, textY, { width: colNama - 4, align: 'left', lineBreak: false });

            row.cpl.forEach((val, i) => {
                doc.font(font).fontSize(fontSizeData).fillColor(row.isRerata ? '#0c4781' : 'black');
                doc.text(val, cplStartX + (i * cplW), textY, { width: cplW, align: 'center', lineBreak: false });
            });
        };

        // ── Build semua baris ──
        const allRows = [
            ...data.dataMahasiswa.map((mhs, index) => ({
                no: `${index + 1}.`,
                nim: mhs.npm,
                nama: mhs.nama,
                cpl: data.daftarCpl.map(c => formatNilai(mhs[c.kode])),
                isRerata: false
            })),
            {
                no: '',
                nim: '',
                nama: 'Rerata Nilai CPL',
                cpl: data.daftarCpl.map(c => formatNilai(data.rerataCpl[c.kode])),
                isRerata: true
            }
        ];

        // ── Gambar header pertama ──
        checkPageSpace(headerHeight + rowHeight * 3);
        let currentRowY = drawTableHeader(doc.y);

        // ── Loop baris data dengan cek halaman ──
        allRows.forEach((row, iRow) => {
            // Jika sisa halaman tidak cukup untuk 1 baris, tambah halaman & ulang header
            if (currentRowY + rowHeight > doc.page.height - 40) {
                addNewPage();
                currentRowY = drawTableHeader(doc.y);
            }
            drawTableRow(row, currentRowY, iRow);
            currentRowY += rowHeight;
        });

        doc.y = currentRowY + 12;

        // =========================================================
        // 5. KETERANGAN & FOOTER
        // =========================================================
        checkPageSpace(60);

        doc.font('Helvetica-Bold').fontSize(8).fillColor('black').text('Keterangan Hasil CPL:', boxX, doc.y);
        doc.font('Helvetica').fontSize(7.5)
            .text(
                `Capaian Pembelajaran Lulusan (CPL) mencatat capaian tertinggi sebesar ${data.summary.tertinggi.nilai} (${data.summary.tertinggi.kode}), dengan batas terendah pada angka ${data.summary.terendah.nilai} (${data.summary.terendah.kode}).`,
                boxX, doc.y
            );
        doc.text(`Secara keseluruhan, rata-rata CPL berada pada angka ${data.summary.rataKeseluruhan}.`, boxX, doc.y);

        doc.moveDown(1.5);

        const printDate = new Date().toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            dateStyle: 'long',
            timeStyle: 'medium'
        });

        doc.save().moveTo(boxX, doc.y).lineTo(boxX + boxW, doc.y)
            .lineWidth(0.5).strokeColor('#cccccc').stroke().restore();
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(7).fillColor('#555555')
            .text(
                buildFooter(req.user?.nama || req.user?.name || 'Sistem'),
                boxX, doc.y
            );

        doc.end();
    } catch (error) {
        next(error);
    }
};
export const exportPdfLaporanCplPerMataKuliah = async (req, res, next) => {
    try {
        const filters = req.query;
        // Panggil Service Mata Kuliah
        const data = await MonitoringService.getLaporanCplPerMataKuliah(filters);

        const doc = new PDFDocument({ margin: 20, size: 'A4', layout: 'landscape' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Monitoring_CPL_Mata_Kuliah.pdf"');
        doc.pipe(res);

        const logoPath = path.join(process.cwd(), 'public', 'logo', 'uika.jpg');
        const boxX = 20;
        const boxW = 801;

        // =========================================================
        // 1. KOP SURAT
        // =========================================================
        const isPakaiKop = String(filters.kop).toLowerCase() === 'true';
        if (isPakaiKop) {
            const logoSize = 60;
            try { doc.image(logoPath, boxX, 15, { width: logoSize }); } catch (e) { }

            doc.font('Helvetica-Bold').fontSize(14).fillColor('black')
                .text(ENV_NAMA_UNIV(), boxX, 18, { width: boxW, align: 'center' });
            doc.font('Helvetica').fontSize(8)
                .text(ENV_ALAMAT_UNIV(), boxX, doc.y + 1, { width: boxW, align: 'center' });
            doc.text(ENV_KONTAK_UNIV(), boxX, doc.y + 1, { width: boxW, align: 'center' });

            if (doc.y < 15 + logoSize + 4) doc.y = 15 + logoSize + 4;

            doc.moveDown(0.4);
            doc.save().lineWidth(1).strokeColor('#000000')
                .moveTo(boxX, doc.y).lineTo(boxX + boxW, doc.y).stroke().restore();
            doc.moveDown(0.6);
        }

        // =========================================================
        // 2. INFO SECTION
        // =========================================================
        const infoY = doc.y;
        const leftW = 80;
        const rightW = boxW - leftW;
        const rowH = 16;

        // Di file PDF MK Abang, info cuma 4 baris (tanpa Metode Perhitungan). 
        // Kita sesuaikan tingginya jadi 5 baris total (1 judul + 4 data)
        const totalH = rowH * 5;

        doc.save().lineWidth(0.5).strokeColor('#000000');
        doc.rect(boxX, infoY, boxW, totalH).stroke();
        doc.moveTo(boxX + leftW, infoY).lineTo(boxX + leftW, infoY + totalH).stroke();

        if (isPakaiKop) {
            try { doc.image(logoPath, boxX + 10, infoY + 6, { width: 58 }); } catch (e) { }
        }

        // Header Biru
        doc.save().rect(boxX + leftW, infoY, rightW, rowH).fill('#0c4781').restore();
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff')
            .text('CPL PER MATA KULIAH', boxX + leftW, infoY + 5, { width: rightW, align: 'center' });
        doc.moveTo(boxX + leftW, infoY + rowH).lineTo(boxX + boxW, infoY + rowH).stroke();

        const infoKeys = ["Tahun Kurikulum", "Program Studi", "Angkatan", "Total Mahasiswa"];
        const infoVals = [
            data.info.tahunKurikulum,
            data.info.programStudi,
            data.info.angkatan,
            data.info.totalMahasiswa.toString()
        ];

        doc.fontSize(8);
        for (let i = 0; i < 4; i++) {
            const ry = infoY + rowH + (i * rowH);
            doc.font('Helvetica-Bold').fillColor('black').text(infoKeys[i], boxX + leftW + 8, ry + 4);
            doc.moveTo(boxX + leftW + 150, ry).lineTo(boxX + leftW + 150, ry + rowH).stroke();
            doc.font('Helvetica').text(infoVals[i], boxX + leftW + 158, ry + 4);
            if (i < 3) doc.moveTo(boxX + leftW, ry + rowH).lineTo(boxX + boxW, ry + rowH).stroke();
        }
        doc.restore();
        doc.y = infoY + totalH + 12;

        // =========================================================
        // 3. DAFTAR CPL
        // =========================================================
        const cplY = doc.y;
        doc.font('Helvetica-Bold').fontSize(8).fillColor('black')
            .text('CPL Program Studi - S1 - Teknik Informatika', boxX + 10, cplY + 6);

        let listY = cplY + 20;
        data.daftarCpl.forEach(c => {
            doc.font('Helvetica-Bold').fontSize(7).text(`•  ${c.kode}`, boxX + 15, listY, { continued: true });
            doc.font('Helvetica').text(`  ${c.deskripsi}`, { width: boxW - 30 });
            listY = doc.y + 2;
        });

        doc.save().lineWidth(0.5).strokeColor('#cccccc')
            .rect(boxX, cplY, boxW, listY - cplY + 4).stroke().restore();
        doc.y = listY + 12;

        // =========================================================
        // 4. TABEL — 100% MANUAL (KOLOM MATA KULIAH)
        // =========================================================
        const cplCount = data.daftarCpl.length || 1;
        const colSem = 55;
        const colNama = 185;
        const colSks = 35;
        const cplArea = boxW - (colSem + colNama + colSks);
        const cplW = cplArea / cplCount;
        const cplStartX = boxX + colSem + colNama + colSks;
        const rowHeight = 18;

        // ── HEADER ──
        const headerY = doc.y;
        const hh = 26;
        const halfHY = headerY + 13;

        // Background biru header
        doc.save().rect(boxX, headerY, boxW, hh).fill('#0c4781').restore();
        // Border luar
        doc.save().lineWidth(0.5).strokeColor('#aaaaaa').rect(boxX, headerY, boxW, hh).stroke();
        // Garis vertikal
        doc.moveTo(boxX + colSem, headerY).lineTo(boxX + colSem, headerY + hh).stroke();
        doc.moveTo(boxX + colSem + colNama, headerY).lineTo(boxX + colSem + colNama, headerY + hh).stroke();
        doc.moveTo(cplStartX, headerY).lineTo(cplStartX, headerY + hh).stroke();
        // Garis horizontal sub-header CPL
        doc.moveTo(cplStartX, halfHY).lineTo(boxX + boxW, halfHY).stroke();
        for (let i = 1; i < cplCount; i++) {
            doc.moveTo(cplStartX + (i * cplW), halfHY)
                .lineTo(cplStartX + (i * cplW), headerY + hh).stroke();
        }
        doc.restore();

        // Teks header
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
        doc.text('Semester', boxX, headerY + 9, { width: colSem, align: 'center', lineBreak: false });
        doc.text('Nama Mata Kuliah', boxX + colSem, headerY + 9, { width: colNama, align: 'center', lineBreak: false });
        doc.text('SKS', boxX + colSem + colNama, headerY + 9, { width: colSks, align: 'center', lineBreak: false });
        doc.text('Nilai CPL', cplStartX, headerY + 3, { width: cplArea, align: 'center', lineBreak: false });
        doc.fontSize(6.5);
        data.daftarCpl.forEach((c, i) => {
            doc.text(c.kode, cplStartX + (i * cplW), halfHY + 3, { width: cplW, align: 'center', lineBreak: false });
        });

        // ── BARIS DATA ──
        const formatNilai = (val) => {
            if (val === null || val === undefined || val === '') return '-';
            const n = Number(val);
            if (isNaN(n)) return '-';
            return n.toFixed(2).replace('.', ',');
        };

        const allRows = data.dataMataKuliah.map((mk) => ({
            semester: mk.semester,
            nama: mk.nama,
            sks: mk.sks,
            cpl: data.daftarCpl.map(c => formatNilai(mk[c.kode]))
        }));

        let rowY = headerY + hh;

        allRows.forEach((row, iRow) => {
            // Auto Page Break Manual jika melewati batas bawah
            if (rowY + rowHeight > 550) {
                doc.addPage();
                rowY = 30;
            }

            const bgColor = (iRow % 2 !== 0) ? '#f9f9f9' : '#ffffff';

            doc.save().rect(boxX, rowY, boxW, rowHeight).fill(bgColor).restore();

            doc.save().lineWidth(0.5).strokeColor('#aaaaaa');
            doc.rect(boxX, rowY, boxW, rowHeight).stroke();
            doc.moveTo(boxX + colSem, rowY).lineTo(boxX + colSem, rowY + rowHeight).stroke();
            doc.moveTo(boxX + colSem + colNama, rowY).lineTo(boxX + colSem + colNama, rowY + rowHeight).stroke();
            doc.moveTo(cplStartX, rowY).lineTo(cplStartX, rowY + rowHeight).stroke();
            for (let i = 1; i < cplCount; i++) {
                doc.moveTo(cplStartX + (i * cplW), rowY).lineTo(cplStartX + (i * cplW), rowY + rowHeight).stroke();
            }
            doc.restore();

            const textY = rowY + (rowHeight / 2) - 3.5;

            doc.font('Helvetica').fontSize(7.5).fillColor('black');
            doc.text(row.semester, boxX, textY, { width: colSem, align: 'center', lineBreak: false });
            // Margin 5px untuk nama biar gak nempel garis kiri
            doc.text(row.nama, boxX + colSem + 5, textY, { width: colNama - 5, align: 'left', lineBreak: false });
            doc.text(row.sks, boxX + colSem + colNama, textY, { width: colSks, align: 'center', lineBreak: false });

            row.cpl.forEach((val, i) => {
                doc.text(val, cplStartX + (i * cplW), textY, { width: cplW, align: 'center', lineBreak: false });
            });

            rowY += rowHeight;
        });

        doc.y = rowY + 12;

        // =========================================================
        // 5. KETERANGAN & FOOTER
        // =========================================================
        if (doc.y > 510) { doc.addPage(); doc.y = 30; } // Hindari footer terpotong

        doc.font('Helvetica-Bold').fontSize(8).fillColor('black').text('Keterangan Hasil CPL:', boxX, doc.y);
        doc.font('Helvetica').fontSize(7.5)
            .text(`Capaian Pembelajaran Lulusan (CPL) mencatat capaian tertinggi sebesar ${data.summary.tertinggi.nilai} (${data.summary.tertinggi.kode}), dengan batas terendah pada angka ${data.summary.terendah.nilai} (${data.summary.terendah.kode}).`, boxX, doc.y);
        doc.text(`Secara keseluruhan, rata-rata CPL berada pada angka ${data.summary.rataKeseluruhan}.`, boxX, doc.y);

        doc.moveDown(1.5);
        const printDate = new Date().toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            dateStyle: 'long',
            timeStyle: 'medium'
        });
        doc.save().moveTo(boxX, doc.y).lineTo(boxX + boxW, doc.y)
            .lineWidth(0.5).strokeColor('#cccccc').stroke().restore();
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(7).fillColor('#555555')
            .text(buildFooter(req.user?.nama || req.user?.name || 'Sistem'), boxX, doc.y);

        doc.end();
    } catch (error) {
        next(error);
    }
};
// ============================================================================
// 9. EXPORT PDF - MONITORING MK PER MAHASISWA (COLSPAN SEMESTER)
// ============================================================================
// export const exportPdfLaporanMkPerMahasiswa = async (req, res, next) => {
//     try {
//         const filters = req.query;
//         const data = await MonitoringService.getLaporanMkPerMahasiswa(filters);

//         // A4 Landscape, Margin Tipis 20
//         const doc = new PDFDocument({ margin: 20, size: 'A4', layout: 'landscape' });
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', 'attachment; filename="Mata_Kuliah_per_Mahasiswa.pdf"');
//         doc.pipe(res);

//         const logoPath = path.join(process.cwd(), 'public', 'logo', 'uika.jpg');
//         const boxX = 20;
//         const boxW = 801;

//         // =========================================================
//         // 1. KOP SURAT
//         // =========================================================
//         const isPakaiKop = String(filters.kop).toLowerCase() === 'true';
//         if (isPakaiKop) {
//             const logoSize = 60;
//             try { doc.image(logoPath, boxX, 15, { width: logoSize }); } catch (e) { }

//             doc.font('Helvetica-Bold').fontSize(14).fillColor('black')
//                 .text(ENV_NAMA_UNIV(), boxX, 18, { width: boxW, align: 'center' });
//             doc.font('Helvetica').fontSize(8)
//                 .text(ENV_ALAMAT_UNIV(), boxX, doc.y + 1, { width: boxW, align: 'center' });
//             doc.text(ENV_KONTAK_UNIV(), boxX, doc.y + 1, { width: boxW, align: 'center' });

//             if (doc.y < 15 + logoSize + 4) doc.y = 15 + logoSize + 4;
//             doc.moveDown(0.4);
//             doc.save().lineWidth(1).strokeColor('#000000').moveTo(boxX, doc.y).lineTo(boxX + boxW, doc.y).stroke().restore();
//             doc.moveDown(0.6);
//         }

//         // =========================================================
//         // 2. INFO SECTION (Kotak 4 Baris Data)
//         // =========================================================
//         const infoY = doc.y;
//         const leftW = 80;
//         const rightW = boxW - leftW;
//         const rowH = 16;
//         const totalH = rowH * 5; // 1 judul + 4 baris data

//         doc.save().lineWidth(0.5).strokeColor('#000000');
//         doc.rect(boxX, infoY, boxW, totalH).stroke();
//         doc.moveTo(boxX + leftW, infoY).lineTo(boxX + leftW, infoY + totalH).stroke();

//         if (isPakaiKop) {
//             try { doc.image(logoPath, boxX + 10, infoY + 10, { width: 58 }); } catch (e) { }
//         }

//         // BG Biru Header Info
//         doc.save().rect(boxX + leftW, infoY, rightW, rowH).fill('#0c4781').restore();
//         doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff')
//             .text('MATA KULIAH PER MAHASISWA', boxX + leftW, infoY + 5, { width: rightW, align: 'center' });
//         doc.moveTo(boxX + leftW, infoY + rowH).lineTo(boxX + boxW, infoY + rowH).stroke();

//         const infoKeys = ["Tahun Kurikulum", "Program Studi", "Angkatan", "Total Mahasiswa"];
//         const infoVals = [data.info.tahunKurikulum, data.info.programStudi, data.info.angkatan, data.info.totalMahasiswa.toString()];

//         doc.fontSize(8);
//         for (let i = 0; i < 4; i++) {
//             const ry = infoY + rowH + (i * rowH);
//             doc.font('Helvetica-Bold').fillColor('black').text(infoKeys[i], boxX + leftW + 8, ry + 4);
//             doc.moveTo(boxX + leftW + 150, ry).lineTo(boxX + leftW + 150, ry + rowH).stroke();
//             doc.font('Helvetica').text(infoVals[i], boxX + leftW + 158, ry + 4);
//             if (i < 3) doc.moveTo(boxX + leftW, ry + rowH).lineTo(boxX + boxW, ry + rowH).stroke();
//         }
//         doc.restore();
//         doc.y = infoY + totalH + 12;

//         // =========================================================
//         // 3. DAFTAR CPL (Hanya 1 CPL Sesuai Pilihan)
//         // =========================================================
//         const cplY = doc.y;
//         doc.font('Helvetica-Bold').fontSize(8).fillColor('black').text(`CPL Program Studi - ${data.info.programStudi}`, boxX + 10, cplY + 6);

//         doc.font('Helvetica-Bold').fontSize(7).text(`•  ${data.cpl.kode}`, boxX + 15, cplY + 20, { continued: true });
//         doc.font('Helvetica').text(`  ${data.cpl.deskripsi}`, { width: boxW - 30 });

//         doc.save().lineWidth(0.5).strokeColor('#cccccc').rect(boxX, cplY, boxW, (doc.y - cplY) + 8).stroke().restore();
//         doc.y += 15;

//         // =========================================================
//         // 4. TABEL — MANUAL COLSPAN (Semester -> MK)
//         // =========================================================
//         const mkCount = data.mkList.length || 1;
//         const colNo = 25;
//         const colNim = 80;
//         const colNama = 150;
//         const colRerata = 40;
//         const colCapaian = 40;
//         const mkArea = boxW - (colNo + colNim + colNama + colRerata + colCapaian);
//         const mkW = mkArea / mkCount;

//         const mkStartX = boxX + colNo + colNim + colNama;
//         const resultStartX = mkStartX + mkArea;
//         const rowHeight = 18;

//         // ── HEADER ──
//         const headerY = doc.y;
//         const hh = 30; // 2 baris (15pt per baris)
//         const halfHY = headerY + 15;

//         doc.save().rect(boxX, headerY, boxW, hh).fill('#0c4781').restore(); // Background Biru Gelap
//         doc.save().lineWidth(0.5).strokeColor('#aaaaaa').rect(boxX, headerY, boxW, hh).stroke(); // Border

//         // Garis Vertikal Dasar
//         doc.moveTo(boxX + colNo, headerY).lineTo(boxX + colNo, headerY + hh).stroke();
//         doc.moveTo(boxX + colNo + colNim, headerY).lineTo(boxX + colNo + colNim, headerY + hh).stroke();
//         doc.moveTo(mkStartX, headerY).lineTo(mkStartX, headerY + hh).stroke();

//         doc.moveTo(resultStartX, headerY).lineTo(resultStartX, headerY + hh).stroke(); // Pemisah MK dan Rerata
//         doc.moveTo(resultStartX + colRerata, headerY).lineTo(resultStartX + colRerata, headerY + hh).stroke(); // Pemisah Rerata dan Capaian

//         // Garis Horizontal Pemisah Semester dan Kode MK
//         doc.moveTo(mkStartX, halfHY).lineTo(resultStartX, halfHY).stroke();

//         // Garis Vertikal Group Semester
//         let curX = mkStartX;
//         data.semesters.forEach(sem => {
//             const semW = sem.mks.length * mkW;
//             // Tulis Teks Semester
//             doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
//             doc.text(`Semester ${sem.semester}`, curX, headerY + 4, { width: semW, align: 'center', lineBreak: false });

//             // Garis pembatas antar semester (Cuma Paruh Atas)
//             doc.moveTo(curX + semW, headerY).lineTo(curX + semW, halfHY).stroke();

//             // Garis & Teks Kode MK (Cuma Paruh Bawah)
//             sem.mks.forEach((mk, i) => {
//                 const mx = curX + (i * mkW);
//                 if (i > 0) doc.moveTo(mx, halfHY).lineTo(mx, headerY + hh).stroke(); // Garis pemisah antar MK
//                 doc.fontSize(6).text(mk.kode, mx, halfHY + 4, { width: mkW, align: 'center', lineBreak: false });
//             });
//             curX += semW;
//         });
//         doc.restore();

//         // Teks Header Dasar
//         doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
//         doc.text('No.', boxX, headerY + 11, { width: colNo, align: 'center', lineBreak: false });
//         doc.text('NIM', boxX + colNo, headerY + 11, { width: colNim, align: 'center', lineBreak: false });
//         doc.text('Nama Mahasiswa', boxX + colNo + colNim, headerY + 11, { width: colNama, align: 'center', lineBreak: false });
//         doc.text('Rerata', resultStartX, headerY + 11, { width: colRerata, align: 'center', lineBreak: false });
//         doc.text('Capaian', resultStartX + colRerata, headerY + 11, { width: colCapaian, align: 'center', lineBreak: false });

//         // ── BARIS DATA ──
//         const formatNilai = (val) => {
//             if (!val) return '-';
//             const n = Number(val);
//             if (isNaN(n) || n === 0) return '-';
//             return n.toFixed(2).replace('.', ',');
//         };

//         let rowY = headerY + hh;

//         data.dataMahasiswa.forEach((row, iRow) => {
//             // Auto Break Halaman
//             if (rowY + rowHeight > 550) { doc.addPage(); rowY = 30; }

//             const bgColor = (iRow % 2 !== 0) ? '#f9f9f9' : '#ffffff';
//             doc.save().rect(boxX, rowY, boxW, rowHeight).fill(bgColor).restore();

//             // Border & Garis
//             doc.save().lineWidth(0.5).strokeColor('#aaaaaa');
//             doc.rect(boxX, rowY, boxW, rowHeight).stroke();
//             doc.moveTo(boxX + colNo, rowY).lineTo(boxX + colNo, rowY + rowHeight).stroke();
//             doc.moveTo(boxX + colNo + colNim, rowY).lineTo(boxX + colNo + colNim, rowY + rowHeight).stroke();
//             doc.moveTo(mkStartX, rowY).lineTo(mkStartX, rowY + rowHeight).stroke();
//             doc.moveTo(resultStartX, rowY).lineTo(resultStartX, rowY + rowHeight).stroke();
//             doc.moveTo(resultStartX + colRerata, rowY).lineTo(resultStartX + colRerata, rowY + rowHeight).stroke();

//             // Garis antar MK
//             let mkX = mkStartX;
//             data.mkList.forEach((mk, idx) => {
//                 if (idx > 0) doc.moveTo(mkX, rowY).lineTo(mkX, rowY + rowHeight).stroke();
//                 mkX += mkW;
//             });
//             doc.restore();

//             // Tulis Teks
//             const textY = rowY + (rowHeight / 2) - 3.5;
//             doc.font('Helvetica').fontSize(7.5).fillColor('black');
//             doc.text(`${iRow + 1}.`, boxX, textY, { width: colNo, align: 'center', lineBreak: false });
//             doc.text(row.npm, boxX + colNo, textY, { width: colNim, align: 'center', lineBreak: false });
//             doc.text(row.nama, boxX + colNo + colNim + 5, textY, { width: colNama - 5, align: 'left', lineBreak: false });

//             // Tulis Nilai MK
//             let dX = mkStartX;
//             data.mkList.forEach(mk => {
//                 doc.text(formatNilai(row.scores[mk.id]), dX, textY, { width: mkW, align: 'center', lineBreak: false });
//                 dX += mkW;
//             });

//             // Tulis Rerata & Capaian (Warna Bold untuk menekankan hasil akhir)
//             doc.font('Helvetica-Bold');
//             doc.text(formatNilai(row.rerata), resultStartX, textY, { width: colRerata, align: 'center', lineBreak: false });
//             doc.text(formatNilai(row.capaian), resultStartX + colRerata, textY, { width: colCapaian, align: 'center', lineBreak: false });

//             rowY += rowHeight;
//         });

//         doc.y = rowY + 15;

//         // =========================================================
//         // 5. KETERANGAN & FOOTER
//         // =========================================================
//         if (doc.y > 520) { doc.addPage(); doc.y = 30; }

//         doc.font('Helvetica-Bold').fontSize(8).fillColor('black').text('Keterangan:', boxX, doc.y);
//         doc.font('Helvetica').fontSize(7.5)
//             .text(`Tanda * pada kode mata kuliah menandakan mata kuliah pilihan yang bukan merupakan pembagi capaian jika belum diambil oleh mahasiswa.`, boxX, doc.y);

//         doc.moveDown(1.5);
//         const printDate = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'medium' });

//         doc.save().moveTo(boxX, doc.y).lineTo(boxX + boxW, doc.y).lineWidth(0.5).strokeColor('#cccccc').stroke().restore();
//         doc.moveDown(0.5);
//         doc.font('Helvetica').fontSize(7).fillColor('#555555')
//             .text(buildFooter(req.user?.nama || req.user?.name || 'Sistem'), boxX, doc.y);

//         doc.end();
//     } catch (error) {
//         next(error);
//     }
// };
export const exportPdfLaporanMkPerMahasiswa = async (req, res, next) => {
    try {
        const filters = req.query;
        const data = await MonitoringService.getLaporanMkPerMahasiswa(filters);

        // A4 Landscape, Margin Tipis 20
        const doc = new PDFDocument({ margin: 20, size: 'A4', layout: 'landscape' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Mata_Kuliah_per_Mahasiswa.pdf"');
        doc.pipe(res);

        const logoPath = path.join(process.cwd(), 'public', 'logo', 'uika.jpg');
        const boxX = 20;
        const boxW = 801;

        // =========================================================
        // 1. KOP SURAT
        // =========================================================
        const isPakaiKop = String(filters.kop).toLowerCase() === 'true';
        if (isPakaiKop) {
            const logoSize = 60;
            try { doc.image(logoPath, boxX, 15, { width: logoSize }); } catch (e) { }

            doc.font('Helvetica-Bold').fontSize(14).fillColor('black')
                .text(ENV_NAMA_UNIV(), boxX, 18, { width: boxW, align: 'center' });
            doc.font('Helvetica').fontSize(8)
                .text(ENV_ALAMAT_UNIV(), boxX, doc.y + 1, { width: boxW, align: 'center' });
            doc.text(ENV_KONTAK_UNIV(), boxX, doc.y + 1, { width: boxW, align: 'center' });

            if (doc.y < 15 + logoSize + 4) doc.y = 15 + logoSize + 4;
            doc.moveDown(0.4);
            doc.save().lineWidth(1).strokeColor('#000000').moveTo(boxX, doc.y).lineTo(boxX + boxW, doc.y).stroke().restore();
            doc.moveDown(0.6);
        }

        // =========================================================
        // 2. INFO SECTION (Kotak 4 Baris Data)
        // =========================================================
        const infoY = doc.y;
        const leftW = 80;
        const rightW = boxW - leftW;
        const rowH = 16;
        const totalH = rowH * 5; // 1 judul + 4 baris data

        doc.save().lineWidth(0.5).strokeColor('#000000');
        doc.rect(boxX, infoY, boxW, totalH).stroke();
        doc.moveTo(boxX + leftW, infoY).lineTo(boxX + leftW, infoY + totalH).stroke();

        if (isPakaiKop) {
            try { doc.image(logoPath, boxX + 10, infoY + 10, { width: 58 }); } catch (e) { }
        }

        // BG Biru Header Info
        doc.save().rect(boxX + leftW, infoY, rightW, rowH).fill('#0c4781').restore();
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff')
            .text('MATA KULIAH PER MAHASISWA', boxX + leftW, infoY + 5, { width: rightW, align: 'center' });
        doc.moveTo(boxX + leftW, infoY + rowH).lineTo(boxX + boxW, infoY + rowH).stroke();

        const infoKeys = ["Tahun Kurikulum", "Program Studi", "Angkatan", "Total Mahasiswa"];
        const infoVals = [data.info.tahunKurikulum, data.info.programStudi, data.info.angkatan, data.info.totalMahasiswa.toString()];

        doc.fontSize(8);
        for (let i = 0; i < 4; i++) {
            const ry = infoY + rowH + (i * rowH);
            doc.font('Helvetica-Bold').fillColor('black').text(infoKeys[i], boxX + leftW + 8, ry + 4);
            doc.moveTo(boxX + leftW + 150, ry).lineTo(boxX + leftW + 150, ry + rowH).stroke();
            doc.font('Helvetica').text(infoVals[i], boxX + leftW + 158, ry + 4);
            if (i < 3) doc.moveTo(boxX + leftW, ry + rowH).lineTo(boxX + boxW, ry + rowH).stroke();
        }
        doc.restore();
        doc.y = infoY + totalH + 12;

        // =========================================================
        // 3. DAFTAR CPL (Hanya 1 CPL Sesuai Pilihan)
        // =========================================================
        const cplY = doc.y;
        doc.font('Helvetica-Bold').fontSize(8).fillColor('black').text(`CPL Program Studi - ${data.info.programStudi}`, boxX + 10, cplY + 6);

        doc.font('Helvetica-Bold').fontSize(7).text(`•  ${data.cpl.kode}`, boxX + 15, cplY + 20, { continued: true });
        doc.font('Helvetica').text(`  ${data.cpl.deskripsi}`, { width: boxW - 30 });

        doc.save().lineWidth(0.5).strokeColor('#cccccc').rect(boxX, cplY, boxW, (doc.y - cplY) + 8).stroke().restore();
        doc.y += 15;

        // =========================================================
        // 4. TABEL — MANUAL COLSPAN (Semester -> MK)
        // =========================================================
        const mkCount = data.mkList.length || 1;
        const colNo = 25;
        const colNim = 80;
        const colNama = 150;
        const colRerata = 40;
        const colCapaian = 40;
        const mkArea = boxW - (colNo + colNim + colNama + colRerata + colCapaian);
        const mkW = mkArea / mkCount;

        const mkStartX = boxX + colNo + colNim + colNama;
        const resultStartX = mkStartX + mkArea;
        const rowHeight = 18;

        // ── HEADER ──
        const headerY = doc.y;
        const hh = 30; // 2 baris (15pt per baris)
        const halfHY = headerY + 15;

        doc.save().rect(boxX, headerY, boxW, hh).fill('#0c4781').restore(); // Background Biru Gelap
        doc.save().lineWidth(0.5).strokeColor('#aaaaaa').rect(boxX, headerY, boxW, hh).stroke(); // Border

        // Garis Vertikal Dasar
        doc.moveTo(boxX + colNo, headerY).lineTo(boxX + colNo, headerY + hh).stroke();
        doc.moveTo(boxX + colNo + colNim, headerY).lineTo(boxX + colNo + colNim, headerY + hh).stroke();
        doc.moveTo(mkStartX, headerY).lineTo(mkStartX, headerY + hh).stroke();

        doc.moveTo(resultStartX, headerY).lineTo(resultStartX, headerY + hh).stroke(); // Pemisah MK dan Rerata
        doc.moveTo(resultStartX + colRerata, headerY).lineTo(resultStartX + colRerata, headerY + hh).stroke(); // Pemisah Rerata dan Capaian

        // Garis Horizontal Pemisah Semester dan Kode MK
        doc.moveTo(mkStartX, halfHY).lineTo(resultStartX, halfHY).stroke();

        // Garis Vertikal Group Semester
        let curX = mkStartX;
        data.semesters.forEach(sem => {
            const semW = sem.mks.length * mkW;
            // Tulis Teks Semester
            doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
            doc.text(`Semester ${sem.semester}`, curX, headerY + 4, { width: semW, align: 'center', lineBreak: false });

            // Garis pembatas antar semester (Cuma Paruh Atas)
            doc.moveTo(curX + semW, headerY).lineTo(curX + semW, halfHY).stroke();

            // Garis & Teks Kode MK (Cuma Paruh Bawah)
            sem.mks.forEach((mk, i) => {
                const mx = curX + (i * mkW);
                if (i > 0) doc.moveTo(mx, halfHY).lineTo(mx, headerY + hh).stroke(); // Garis pemisah antar MK
                doc.fontSize(6).text(mk.kode, mx, halfHY + 4, { width: mkW, align: 'center', lineBreak: false });
            });
            curX += semW;
        });
        doc.restore();

        // Teks Header Dasar
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
        doc.text('No.', boxX, headerY + 11, { width: colNo, align: 'center', lineBreak: false });
        doc.text('NIM', boxX + colNo, headerY + 11, { width: colNim, align: 'center', lineBreak: false });
        doc.text('Nama Mahasiswa', boxX + colNo + colNim, headerY + 11, { width: colNama, align: 'center', lineBreak: false });
        doc.text('Rerata', resultStartX, headerY + 11, { width: colRerata, align: 'center', lineBreak: false });
        doc.text('Capaian', resultStartX + colRerata, headerY + 11, { width: colCapaian, align: 'center', lineBreak: false });

        // ── BARIS DATA ──
        const formatNilai = (val) => {
            if (!val) return '-';
            const n = Number(val);
            if (isNaN(n) || n === 0) return '-';
            return n.toFixed(2).replace('.', ',');
        };

        let rowY = headerY + hh;

        data.dataMahasiswa.forEach((row, iRow) => {
            // Auto Break Halaman
            if (rowY + rowHeight > 550) { doc.addPage(); rowY = 30; }

            const bgColor = (iRow % 2 !== 0) ? '#f9f9f9' : '#ffffff';
            doc.save().rect(boxX, rowY, boxW, rowHeight).fill(bgColor).restore();

            // Border & Garis
            doc.save().lineWidth(0.5).strokeColor('#aaaaaa');
            doc.rect(boxX, rowY, boxW, rowHeight).stroke();
            doc.moveTo(boxX + colNo, rowY).lineTo(boxX + colNo, rowY + rowHeight).stroke();
            doc.moveTo(boxX + colNo + colNim, rowY).lineTo(boxX + colNo + colNim, rowY + rowHeight).stroke();
            doc.moveTo(mkStartX, rowY).lineTo(mkStartX, rowY + rowHeight).stroke();
            doc.moveTo(resultStartX, rowY).lineTo(resultStartX, rowY + rowHeight).stroke();
            doc.moveTo(resultStartX + colRerata, rowY).lineTo(resultStartX + colRerata, rowY + rowHeight).stroke();

            // Garis antar MK
            let mkX = mkStartX;
            data.mkList.forEach((mk, idx) => {
                if (idx > 0) doc.moveTo(mkX, rowY).lineTo(mkX, rowY + rowHeight).stroke();
                mkX += mkW;
            });
            doc.restore();

            // Tulis Teks
            const textY = rowY + (rowHeight / 2) - 3.5;
            doc.font('Helvetica').fontSize(7.5).fillColor('black');
            doc.text(`${iRow + 1}.`, boxX, textY, { width: colNo, align: 'center', lineBreak: false });
            doc.text(row.npm, boxX + colNo, textY, { width: colNim, align: 'center', lineBreak: false });
            doc.text(row.nama, boxX + colNo + colNim + 5, textY, { width: colNama - 5, align: 'left', lineBreak: false });

            // Tulis Nilai MK
            let dX = mkStartX;
            data.mkList.forEach(mk => {
                doc.text(formatNilai(row.scores[mk.id]), dX, textY, { width: mkW, align: 'center', lineBreak: false });
                dX += mkW;
            });

            // Tulis Rerata & Capaian (Warna Bold untuk menekankan hasil akhir)
            doc.font('Helvetica-Bold').fillColor('black');
            doc.text(formatNilai(row.rerata), resultStartX, textY, { width: colRerata, align: 'center', lineBreak: false });

            // 🟢 LOGIKA BARU: Merahkan angka capaian jika statusnya Belum Memenuhi
            // (Catatan: di fungsi MkPerMahasiswa, status Lulus/Gagal CPL dilihat dari nilai capaian.
            // Asumsi: jika capaian < target CPL, maka dianggap 'Belum Memenuhi' / Merah)
            const cplTarget = parseFloat(String(data.cpl.target_cpl || data.cpl.target || 0).replace(',', '.'));
            const capaianVal = parseFloat(String(row.capaian).replace(',', '.')) || 0;
            const isMerah = capaianVal < cplTarget;

            doc.fillColor(isMerah ? '#e74c3c' : 'black');
            doc.text(formatNilai(row.capaian), resultStartX + colRerata, textY, { width: colCapaian, align: 'center', lineBreak: false });

            rowY += rowHeight;
        });

        doc.y = rowY + 15;

        // =========================================================
        // 5. KETERANGAN & FOOTER
        // =========================================================
        if (doc.y > 520) { doc.addPage(); doc.y = 30; }

        doc.font('Helvetica-Bold').fontSize(8).fillColor('black').text('Keterangan:', boxX, doc.y);
        doc.font('Helvetica').fontSize(7.5)
            .text(`Tanda * pada kode mata kuliah menandakan mata kuliah pilihan yang bukan merupakan pembagi capaian jika belum diambil oleh mahasiswa.`, boxX, doc.y);

        doc.moveDown(1.5);
        const printDate = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'medium' });

        doc.save().moveTo(boxX, doc.y).lineTo(boxX + boxW, doc.y).lineWidth(0.5).strokeColor('#cccccc').stroke().restore();
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(7).fillColor('#555555')
            .text(buildFooter(req.user?.nama || req.user?.name || 'Sistem'), boxX, doc.y);

        doc.end();
    } catch (error) {
        next(error);
    }
};
// ============================================================================
// 10. EXPORT PDF - TRANSKRIP OBE MAHASISWA (100% MANUAL, ROWSPAN+COLSPAN)
// ============================================================================
// export const exportPdfTranskripObeMahasiswa = async (req, res, next) => {
//     try {
//         const filters = req.query;
//         const data = await MonitoringService.getTranskripObeMahasiswa(filters);

//         // Kertas A4 Portrait
//         const doc = new PDFDocument({ margin: 30, size: 'A4' });
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', 'attachment; filename="Transkrip_OBE_Mahasiswa.pdf"');
//         doc.pipe(res);

//         const logoPath = path.join(process.cwd(), 'public', 'logo', 'uika.jpg');
//         const boxX = 30;
//         const boxW = 535;

//         // =========================================================
//         // 1. KOP SURAT
//         // =========================================================
//         const isPakaiKop = String(filters.kop).toLowerCase() === 'true';
//         if (isPakaiKop) {
//             try { doc.image(logoPath, boxX, 20, { width: 55 }); } catch (e) { }
//             doc.font('Helvetica-Bold').fontSize(13).fillColor('black').text(ENV_NAMA_UNIV(), boxX, 22, { width: boxW, align: 'center' });
//             doc.font('Helvetica').fontSize(8).text(ENV_ALAMAT_UNIV(), boxX, doc.y + 1, { width: boxW, align: 'center' });
//             doc.text(ENV_KONTAK_UNIV(), boxX, doc.y + 1, { width: boxW, align: 'center' });
//             if (doc.y < 85) doc.y = 85;
//             doc.save().lineWidth(1.5).strokeColor('#000000').moveTo(boxX, doc.y).lineTo(boxX + boxW, doc.y).stroke().restore();
//             doc.moveDown(1);
//         }

//         // =========================================================
//         // 2. INFO SECTION (Kotak Logo Kiri, 6 Baris Kanan)
//         // =========================================================
//         const infoY = doc.y;
//         const rowH = 17; // Ditinggikan sedikit agar lebih rapi
//         const leftW = 110; // Lebar sel logo
//         const rightW = boxW - leftW;
//         const totalH = rowH * 7; // 1 Header + 6 Baris Data

//         // Garis Luar & Pemisah Logo
//         doc.save().lineWidth(0.5).strokeColor('#aaaaaa');
//         doc.rect(boxX, infoY, boxW, totalH).stroke();
//         doc.moveTo(boxX + leftW, infoY).lineTo(boxX + leftW, infoY + totalH).stroke();

//         // Gambar Logo di dalam kotak kiri (Center Vertikal)
//         if (isPakaiKop) {
//             try {
//                 const logoSize = 80;
//                 doc.image(logoPath, boxX + 15, infoY + (totalH / 2) - (logoSize / 2), { width: logoSize });
//             } catch (e) { }
//         }

//         // Header Biru
//         doc.save().rect(boxX + leftW, infoY, rightW, rowH).fill('#0c4781').restore();
//         doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff').text('TRANSKRIP OBE MAHASISWA', boxX + leftW, infoY + 5, { width: rightW, align: 'center' });
//         doc.moveTo(boxX + leftW, infoY + rowH).lineTo(boxX + boxW, infoY + rowH).stroke();

//         const infoKeys = ["Tahun Kurikulum", "NIM", "Nama Mahasiswa", "Program Studi", "Angkatan", "Semester"];
//         const infoVals = [
//             data.info.tahunKurikulum,
//             data.info.nim,
//             data.info.nama,
//             data.info.programStudi,
//             data.info.angkatan,
//             data.info.semester
//         ];

//         // Loop Baris Data Kanan
//         doc.fontSize(8);
//         const keyColW = 140; // Lebar untuk label
//         for (let i = 0; i < 6; i++) {
//             const ry = infoY + rowH + (i * rowH);
//             doc.font('Helvetica-Bold').fillColor('black').text(infoKeys[i], boxX + leftW + 8, ry + 5);
//             doc.moveTo(boxX + leftW + keyColW, ry).lineTo(boxX + leftW + keyColW, ry + rowH).stroke();
//             doc.font('Helvetica').text(infoVals[i], boxX + leftW + keyColW + 8, ry + 5);

//             // Garis pembatas horizontal antar baris (kecuali baris terakhir)
//             if (i < 5) doc.moveTo(boxX + leftW, ry + rowH).lineTo(boxX + boxW, ry + rowH).stroke();
//         }
//         doc.restore();
//         doc.y = infoY + totalH + 20;

//         // =========================================================
//         // 3. SPIDERCHART & SUMMARY BOX
//         // =========================================================
//         const chartY = doc.y;
//         doc.font('Helvetica-Bold').fontSize(9).fillColor('black').text('Spiderchart Rerata CPL Mahasiswa', boxX, chartY);

//         const chartConfig = {
//             type: 'radar',
//             data: {
//                 // 🟢 LABEL 2 BARIS: Menampilkan CPL01 dan nilainya di bawahnya
//                 labels: data.tabel.map(c => [c.kode, (Number(c.rerata) || 0).toFixed(2).replace('.', ',')]),
//                 datasets: [
//                     { label: 'Capaian', data: data.chart.datasets[0].data, backgroundColor: 'rgba(54, 162, 235, 0.4)', borderColor: 'rgb(54, 162, 235)', pointBackgroundColor: 'rgb(54, 162, 235)' },
//                     { label: 'Target', data: data.chart.datasets[1].data, backgroundColor: 'rgba(255, 205, 86, 0.2)', borderColor: 'rgb(255, 205, 86)', pointBackgroundColor: 'rgb(255, 205, 86)' }
//                 ]
//             },
//             options: {
//                 scale: {
//                     ticks: { beginAtZero: true, max: 100, display: false },
//                     pointLabels: { fontSize: 10, fontStyle: 'bold', fontColor: '#2c3e50' }
//                 },
//                 legend: { position: 'bottom' },
//                 plugins: { datalabels: { display: false } }
//             }
//         };

//         const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=260&h=260`;
//         try {
//             const chartResponse = await axios.get(chartUrl, { responseType: 'arraybuffer', timeout: 10000 });
//             doc.image(Buffer.from(chartResponse.data, 'binary'), boxX - 10, chartY + 15, { width: 260 });
//         } catch (e) {
//             doc.font('Helvetica-Oblique').fontSize(8).fillColor('#e74c3c').text('[Gagal memuat grafik]', boxX, chartY + 100, { width: 260, align: 'center' });
//         }

//         // Kotak Summary
//         const sumX = boxX + 280;
//         doc.font('Helvetica-Bold').fontSize(9).fillColor('black').text('Performa Rerata CPL Mahasiswa', sumX, chartY + 30);
//         doc.save().roundedRect(sumX, chartY + 50, 245, 50, 5).fill('#f4f6f9').restore();

//         doc.font('Helvetica-Bold').fontSize(8).text('CPL Tertinggi', sumX + 15, chartY + 60);
//         doc.font('Helvetica-Bold').fontSize(14).fillColor('#27ae60').text(data.summary.tertinggi.nilai, sumX + 15, chartY + 75);
//         doc.font('Helvetica').fontSize(7).fillColor('black').text(`di posisi ${data.summary.tertinggi.kode}`, sumX + 15, chartY + 90);

//         doc.font('Helvetica-Bold').fontSize(8).text('CPL Terendah', sumX + 130, chartY + 60);
//         doc.font('Helvetica-Bold').fontSize(14).fillColor('#e74c3c').text(data.summary.terendah.nilai, sumX + 130, chartY + 75);
//         doc.font('Helvetica').fontSize(7).fillColor('black').text(`di posisi ${data.summary.terendah.kode}`, sumX + 130, chartY + 90);

//         doc.font('Helvetica-Oblique').fontSize(7)
//             .text(`CPL mencatat rerata tertinggi sebesar ${data.summary.tertinggi.nilai} (${data.summary.tertinggi.kode}), dengan batas terendah pada angka ${data.summary.terendah.nilai} (${data.summary.terendah.kode}).`, sumX, chartY + 115, { width: 245 });

//         doc.y = Math.max(doc.y, chartY + 280);
//         doc.moveDown(1);

//         // =========================================================
//         // 4. TABEL UTAMA (Status Warna-Warni)
//         // =========================================================
//         doc.font('Helvetica-Bold').fontSize(9).fillColor('black').text('Hasil Capaian Pembelajaran Lulusan', boxX, doc.y);
//         doc.moveDown(0.5);

//         const colKode = 45, colTarget = 45, colRerata = 45, colStatus = 85, colCapaian = 55, colProgres = 50;
//         const colDeskripsi = boxW - (colKode + colTarget + colRerata + colStatus + colCapaian + colProgres);
//         const tEvalW = colTarget + colRerata + colStatus;
//         const tMonW = colCapaian + colProgres;

//         const hy = doc.y;
//         const hh = 30;
//         const halfHy = hy + 15;

//         doc.save().rect(boxX, hy, boxW, hh).fill('#0c4781').restore();
//         doc.save().lineWidth(0.5).strokeColor('#aaaaaa').rect(boxX, hy, boxW, hh).stroke();

//         doc.moveTo(boxX + colKode + colDeskripsi, halfHy).lineTo(boxX + boxW, halfHy).stroke();

//         let curX = boxX + colKode;
//         doc.moveTo(curX, hy).lineTo(curX, hy + hh).stroke();
//         curX += colDeskripsi;
//         doc.moveTo(curX, hy).lineTo(curX, hy + hh).stroke();
//         doc.moveTo(curX + tEvalW, hy).lineTo(curX + tEvalW, hy + hh).stroke();

//         doc.moveTo(curX + colTarget, halfHy).lineTo(curX + colTarget, hy + hh).stroke();
//         doc.moveTo(curX + colTarget + colRerata, halfHy).lineTo(curX + colTarget + colRerata, hy + hh).stroke();
//         doc.moveTo(curX + tEvalW + colCapaian, halfHy).lineTo(curX + tEvalW + colCapaian, hy + hh).stroke();
//         doc.restore();

//         doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
//         doc.text('Kode CPL', boxX, hy + 10, { width: colKode, align: 'center' });
//         doc.text('Deskripsi CPL', boxX + colKode, hy + 10, { width: colDeskripsi, align: 'center' });

//         doc.text('Target & Evaluasi CPL', curX, hy + 4, { width: tEvalW, align: 'center' });
//         doc.text('Monitoring CPL', curX + tEvalW, hy + 4, { width: tMonW, align: 'center' });

//         doc.text('Target', curX, halfHy + 4, { width: colTarget, align: 'center' });
//         doc.text('Rerata', curX + colTarget, halfHy + 4, { width: colRerata, align: 'center' });
//         doc.text('Status', curX + colTarget + colRerata, halfHy + 4, { width: colStatus, align: 'center' });
//         doc.text('Capaian', curX + tEvalW, halfHy + 4, { width: colCapaian, align: 'center' });
//         doc.text('Progres', curX + tEvalW + colCapaian, halfHy + 4, { width: colProgres, align: 'center' });

//         let rowY = hy + hh;

//         const formatNilai = (val) => {
//             const n = Number(val);
//             if (isNaN(n)) return '0,00';
//             return n.toFixed(2).replace('.', ',');
//         };

//         data.tabel.forEach((row, iRow) => {
//             const textHeight = doc.heightOfString(row.deskripsi, { width: colDeskripsi - 10, fontSize: 7 });
//             const cellH = Math.max(18, textHeight + 10);

//             if (rowY + cellH > 730) { doc.addPage(); rowY = 30; }

//             const bgColor = (iRow % 2 !== 0) ? '#f9f9f9' : '#ffffff';
//             doc.save().rect(boxX, rowY, boxW, cellH).fill(bgColor).restore();

//             doc.save().lineWidth(0.5).strokeColor('#aaaaaa');
//             doc.rect(boxX, rowY, boxW, cellH).stroke();
//             doc.moveTo(boxX + colKode, rowY).lineTo(boxX + colKode, rowY + cellH).stroke();
//             doc.moveTo(curX, rowY).lineTo(curX, rowY + cellH).stroke();
//             doc.moveTo(curX + colTarget, rowY).lineTo(curX + colTarget, rowY + cellH).stroke();
//             doc.moveTo(curX + colTarget + colRerata, rowY).lineTo(curX + colTarget + colRerata, rowY + cellH).stroke();
//             doc.moveTo(curX + tEvalW, rowY).lineTo(curX + tEvalW, rowY + cellH).stroke();
//             doc.moveTo(curX + tEvalW + colCapaian, rowY).lineTo(curX + tEvalW + colCapaian, rowY + cellH).stroke();
//             doc.restore();

//             const textY = rowY + 5;
//             const centerTextY = rowY + (cellH / 2) - 3;

//             doc.font('Helvetica-Bold').fontSize(7.5).fillColor('black');
//             doc.text(row.kode, boxX, centerTextY, { width: colKode, align: 'center' });

//             doc.font('Helvetica').fontSize(7);
//             doc.text(row.deskripsi, boxX + colKode + 5, textY, { width: colDeskripsi - 10, align: 'justify' });

//             doc.text(formatNilai(row.target), curX, centerTextY, { width: colTarget, align: 'center' });
//             doc.text(formatNilai(row.rerata), curX + colTarget, centerTextY, { width: colRerata, align: 'center' });

//             // 🟢 STATUS MENJADI HIJAU / MERAH
//             // let statusColor = 'black';
//             // if (row.status === 'Sudah Memenuhi') statusColor = '#27ae60'; // Hijau
//             // else if (row.status === 'Belum Memenuhi') statusColor = '#e74c3c'; // Merah

//             // doc.font('Helvetica-Bold').fillColor(statusColor).text(row.status, curX + colTarget + colRerata, centerTextY, { width: colStatus, align: 'center' });

//             // // Kembalikan ke warna hitam untuk nilai Capaian & Progres
//             // doc.font('Helvetica').fillColor('black');
//             // doc.text(formatNilai(row.capaian), curX + tEvalW, centerTextY, { width: colCapaian, align: 'center' });
//             // doc.text(row.progres, curX + tEvalW + colCapaian, centerTextY, { width: colProgres, align: 'center' });
//             // Status Warna-warni (Ujung Kanan)
//             let statusColor = 'black';
//             if (row.status === 'Sudah Memenuhi') statusColor = '#27ae60'; // Hijau
//             else if (row.status === 'Belum Memenuhi') statusColor = '#e74c3c'; // Merah

//             doc.font('Helvetica-Bold').fillColor(statusColor).text(row.status, curX + colTarget + colRerata, centerTextY, { width: colStatus, align: 'center' });

//             // 🟢 LOGIKA BARU: MERAHKAN ANGKA CAPAIAN JIKA DI BAWAH TARGET
//             const targetVal = parseFloat(String(row.target).replace(',', '.')) || 0;
//             const capaianVal = parseFloat(String(row.capaian).replace(',', '.')) || 0;
//             const isCapaianMerah = capaianVal < targetVal && row.status !== 'Belum Dinilai';

//             doc.font('Helvetica').fillColor(isCapaianMerah ? '#e74c3c' : 'black');
//             doc.text(formatNilai(row.capaian), curX + tEvalW, centerTextY, { width: colCapaian, align: 'center' });

//             // Kembalikan ke warna hitam untuk teks Progres
//             doc.fillColor('black');
//             doc.text(row.progres, curX + tEvalW + colCapaian, centerTextY, { width: colProgres, align: 'center' });
//             rowY += cellH;
//         });
//         doc.y = rowY + 15;

//         // =========================================================
//         // 5. FOOTER
//         // =========================================================
//         if (doc.y > 650) { doc.addPage(); doc.y = 30; }

//         doc.font('Helvetica-Bold').fontSize(8).fillColor('black').text('Keterangan:', boxX, doc.y);
//         doc.font('Helvetica').fontSize(7).text('Warna hijau menandakan CPL Anda memenuhi target, sedangkan warna merah menunjukkan area yang masih perlu ditingkatkan.', boxX, doc.y);

//         doc.moveDown(2);
//         const ttdY = doc.y;

//         doc.font('Helvetica').fontSize(9).text('Ketua Program Studi', boxX, ttdY, { align: 'left' });
//         doc.text('S1 Teknik Informatika', boxX, doc.y, { align: 'left' });
//         doc.moveDown(4);
//         doc.font('Helvetica-Bold').text(process.env.NAMA_KAPRODI_DEFAULT || '-', boxX, doc.y, { align: 'left' });

//         const printDate = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: 'long', day: 'numeric' });
//         doc.font('Helvetica').text(`Bogor, ${printDate}`, 0, ttdY, { align: 'right', width: boxX + boxW });
//         doc.text('Wakil Rektor 1', 0, doc.y, { align: 'right', width: boxX + boxW });
//         doc.text('Universitas Ibn Khaldun', 0, doc.y, { align: 'right', width: boxX + boxW });
//         doc.moveDown(3);
//         doc.font('Helvetica-Bold').text(ENV_WAKIL_REKTOR(), 0, doc.y, { align: 'right', width: boxX + boxW });

//         doc.end();
//     } catch (error) {
//         next(error);
//     }
// };
export const exportPdfTranskripObeMahasiswa = async (req, res, next) => {
    try {
        const filters = req.query;
        const data = await MonitoringService.getTranskripObeMahasiswa(filters);

        // Kertas A4 Portrait
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Transkrip_OBE_Mahasiswa.pdf"');
        doc.pipe(res);

        const logoPath = path.join(process.cwd(), 'public', 'logo', 'uika.jpg');
        const boxX = 30;
        const boxW = 535;

        // =========================================================
        // 1. KOP SURAT
        // =========================================================
        const isPakaiKop = String(filters.kop).toLowerCase() === 'true';
        if (isPakaiKop) {
            try { doc.image(logoPath, boxX, 20, { width: 55 }); } catch (e) { }
            doc.font('Helvetica-Bold').fontSize(13).fillColor('black').text(ENV_NAMA_UNIV(), boxX, 22, { width: boxW, align: 'center' });
            doc.font('Helvetica').fontSize(8).text(ENV_ALAMAT_UNIV(), boxX, doc.y + 1, { width: boxW, align: 'center' });
            doc.text(ENV_KONTAK_UNIV(), boxX, doc.y + 1, { width: boxW, align: 'center' });
            if (doc.y < 85) doc.y = 85;
            doc.save().lineWidth(1.5).strokeColor('#000000').moveTo(boxX, doc.y).lineTo(boxX + boxW, doc.y).stroke().restore();
            doc.moveDown(1);
        }

        // =========================================================
        // 2. INFO SECTION (Kotak Logo Kiri, 6 Baris Kanan)
        // =========================================================
        const infoY = doc.y;
        const rowH = 17; // Ditinggikan sedikit agar lebih rapi
        const leftW = 110; // Lebar sel logo
        const rightW = boxW - leftW;
        const totalH = rowH * 7; // 1 Header + 6 Baris Data

        // Garis Luar & Pemisah Logo
        doc.save().lineWidth(0.5).strokeColor('#aaaaaa');
        doc.rect(boxX, infoY, boxW, totalH).stroke();
        doc.moveTo(boxX + leftW, infoY).lineTo(boxX + leftW, infoY + totalH).stroke();

        // Gambar Logo di dalam kotak kiri (Center Vertikal)
        if (isPakaiKop) {
            try {
                const logoSize = 80;
                doc.image(logoPath, boxX + 15, infoY + (totalH / 2) - (logoSize / 2), { width: logoSize });
            } catch (e) { }
        }

        // Header Biru
        doc.save().rect(boxX + leftW, infoY, rightW, rowH).fill('#0c4781').restore();
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff').text('TRANSKRIP OBE MAHASISWA', boxX + leftW, infoY + 5, { width: rightW, align: 'center' });
        doc.moveTo(boxX + leftW, infoY + rowH).lineTo(boxX + boxW, infoY + rowH).stroke();

        const infoKeys = ["Tahun Kurikulum", "NIM", "Nama Mahasiswa", "Program Studi", "Angkatan", "Semester"];
        const infoVals = [
            data.info.tahunKurikulum,
            data.info.nim,
            data.info.nama,
            data.info.programStudi,
            data.info.angkatan,
            data.info.semester
        ];

        // Loop Baris Data Kanan
        doc.fontSize(8);
        const keyColW = 140; // Lebar untuk label
        for (let i = 0; i < 6; i++) {
            const ry = infoY + rowH + (i * rowH);
            doc.font('Helvetica-Bold').fillColor('black').text(infoKeys[i], boxX + leftW + 8, ry + 5);
            doc.moveTo(boxX + leftW + keyColW, ry).lineTo(boxX + leftW + keyColW, ry + rowH).stroke();
            doc.font('Helvetica').text(infoVals[i], boxX + leftW + keyColW + 8, ry + 5);

            // Garis pembatas horizontal antar baris (kecuali baris terakhir)
            if (i < 5) doc.moveTo(boxX + leftW, ry + rowH).lineTo(boxX + boxW, ry + rowH).stroke();
        }
        doc.restore();
        doc.y = infoY + totalH + 20;

        // =========================================================
        // 3. SPIDERCHART & SUMMARY BOX
        // =========================================================
        const chartY = doc.y;
        doc.font('Helvetica-Bold').fontSize(9).fillColor('black').text('Spiderchart Rerata CPL Mahasiswa', boxX, chartY);

        const chartConfig = {
            type: 'radar',
            data: {
                // 🟢 LABEL 2 BARIS: Menampilkan CPL01 dan nilainya di bawahnya
                labels: data.tabel.map(c => [c.kode, (Number(c.rerata) || 0).toFixed(2).replace('.', ',')]),
                datasets: [
                    { label: 'Capaian', data: data.chart.datasets[0].data, backgroundColor: 'rgba(54, 162, 235, 0.4)', borderColor: 'rgb(54, 162, 235)', pointBackgroundColor: 'rgb(54, 162, 235)' },
                    { label: 'Target', data: data.chart.datasets[1].data, backgroundColor: 'rgba(255, 205, 86, 0.2)', borderColor: 'rgb(255, 205, 86)', pointBackgroundColor: 'rgb(255, 205, 86)' }
                ]
            },
            options: {
                scale: {
                    ticks: { beginAtZero: true, max: 100, display: false },
                    pointLabels: { fontSize: 10, fontStyle: 'bold', fontColor: '#2c3e50' }
                },
                legend: { position: 'bottom' },
                plugins: { datalabels: { display: false } }
            }
        };

        const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=260&h=260`;
        try {
            const chartResponse = await axios.get(chartUrl, { responseType: 'arraybuffer', timeout: 10000 });
            doc.image(Buffer.from(chartResponse.data, 'binary'), boxX - 10, chartY + 15, { width: 260 });
        } catch (e) {
            doc.font('Helvetica-Oblique').fontSize(8).fillColor('#e74c3c').text('[Gagal memuat grafik]', boxX, chartY + 100, { width: 260, align: 'center' });
        }

        // Kotak Summary
        const sumX = boxX + 280;
        doc.font('Helvetica-Bold').fontSize(9).fillColor('black').text('Performa Rerata CPL Mahasiswa', sumX, chartY + 30);
        doc.save().roundedRect(sumX, chartY + 50, 245, 50, 5).fill('#f4f6f9').restore();

        doc.font('Helvetica-Bold').fontSize(8).text('CPL Tertinggi', sumX + 15, chartY + 60);
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#27ae60').text(data.summary.tertinggi.nilai, sumX + 15, chartY + 75);
        doc.font('Helvetica').fontSize(7).fillColor('black').text(`di posisi ${data.summary.tertinggi.kode}`, sumX + 15, chartY + 90);

        doc.font('Helvetica-Bold').fontSize(8).text('CPL Terendah', sumX + 130, chartY + 60);
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#e74c3c').text(data.summary.terendah.nilai, sumX + 130, chartY + 75);
        doc.font('Helvetica').fontSize(7).fillColor('black').text(`di posisi ${data.summary.terendah.kode}`, sumX + 130, chartY + 90);

        doc.font('Helvetica-Oblique').fontSize(7)
            .text(`CPL mencatat rerata tertinggi sebesar ${data.summary.tertinggi.nilai} (${data.summary.tertinggi.kode}), dengan batas terendah pada angka ${data.summary.terendah.nilai} (${data.summary.terendah.kode}).`, sumX, chartY + 115, { width: 245 });

        doc.y = Math.max(doc.y, chartY + 280);
        doc.moveDown(1);

        // =========================================================
        // 4. TABEL UTAMA (Status Warna-Warni)
        // =========================================================
        doc.font('Helvetica-Bold').fontSize(9).fillColor('black').text('Hasil Capaian Pembelajaran Lulusan', boxX, doc.y);
        doc.moveDown(0.5);

        const colKode = 45, colTarget = 45, colRerata = 45, colStatus = 85, colCapaian = 55, colProgres = 50;
        const colDeskripsi = boxW - (colKode + colTarget + colRerata + colStatus + colCapaian + colProgres);
        const tEvalW = colTarget + colRerata + colStatus;
        const tMonW = colCapaian + colProgres;

        const hy = doc.y;
        const hh = 30;
        const halfHy = hy + 15;

        doc.save().rect(boxX, hy, boxW, hh).fill('#0c4781').restore();
        doc.save().lineWidth(0.5).strokeColor('#aaaaaa').rect(boxX, hy, boxW, hh).stroke();

        doc.moveTo(boxX + colKode + colDeskripsi, halfHy).lineTo(boxX + boxW, halfHy).stroke();

        let curX = boxX + colKode;
        doc.moveTo(curX, hy).lineTo(curX, hy + hh).stroke();
        curX += colDeskripsi;
        doc.moveTo(curX, hy).lineTo(curX, hy + hh).stroke();
        doc.moveTo(curX + tEvalW, hy).lineTo(curX + tEvalW, hy + hh).stroke();

        doc.moveTo(curX + colTarget, halfHy).lineTo(curX + colTarget, hy + hh).stroke();
        doc.moveTo(curX + colTarget + colRerata, halfHy).lineTo(curX + colTarget + colRerata, hy + hh).stroke();
        doc.moveTo(curX + tEvalW + colCapaian, halfHy).lineTo(curX + tEvalW + colCapaian, hy + hh).stroke();
        doc.restore();

        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
        doc.text('Kode CPL', boxX, hy + 10, { width: colKode, align: 'center' });
        doc.text('Deskripsi CPL', boxX + colKode, hy + 10, { width: colDeskripsi, align: 'center' });

        doc.text('Target & Evaluasi CPL', curX, hy + 4, { width: tEvalW, align: 'center' });
        doc.text('Monitoring CPL', curX + tEvalW, hy + 4, { width: tMonW, align: 'center' });

        doc.text('Target', curX, halfHy + 4, { width: colTarget, align: 'center' });
        doc.text('Rerata', curX + colTarget, halfHy + 4, { width: colRerata, align: 'center' });
        doc.text('Status', curX + colTarget + colRerata, halfHy + 4, { width: colStatus, align: 'center' });
        doc.text('Capaian', curX + tEvalW, halfHy + 4, { width: colCapaian, align: 'center' });
        doc.text('Progres', curX + tEvalW + colCapaian, halfHy + 4, { width: colProgres, align: 'center' });

        let rowY = hy + hh;

        const formatNilai = (val) => {
            const n = Number(val);
            if (isNaN(n)) return '0,00';
            return n.toFixed(2).replace('.', ',');
        };

        data.tabel.forEach((row, iRow) => {
            const textHeight = doc.heightOfString(row.deskripsi, { width: colDeskripsi - 10, fontSize: 7 });
            const cellH = Math.max(18, textHeight + 10);

            if (rowY + cellH > 730) { doc.addPage(); rowY = 30; }

            const bgColor = (iRow % 2 !== 0) ? '#f9f9f9' : '#ffffff';
            doc.save().rect(boxX, rowY, boxW, cellH).fill(bgColor).restore();

            doc.save().lineWidth(0.5).strokeColor('#aaaaaa');
            doc.rect(boxX, rowY, boxW, cellH).stroke();
            doc.moveTo(boxX + colKode, rowY).lineTo(boxX + colKode, rowY + cellH).stroke();
            doc.moveTo(curX, rowY).lineTo(curX, rowY + cellH).stroke();
            doc.moveTo(curX + colTarget, rowY).lineTo(curX + colTarget, rowY + cellH).stroke();
            doc.moveTo(curX + colTarget + colRerata, rowY).lineTo(curX + colTarget + colRerata, rowY + cellH).stroke();
            doc.moveTo(curX + tEvalW, rowY).lineTo(curX + tEvalW, rowY + cellH).stroke();
            doc.moveTo(curX + tEvalW + colCapaian, rowY).lineTo(curX + tEvalW + colCapaian, rowY + cellH).stroke();
            doc.restore();

            const textY = rowY + 5;
            const centerTextY = rowY + (cellH / 2) - 3;

            doc.font('Helvetica-Bold').fontSize(7.5).fillColor('black');
            doc.text(row.kode, boxX, centerTextY, { width: colKode, align: 'center' });

            doc.font('Helvetica').fontSize(7);
            doc.text(row.deskripsi, boxX + colKode + 5, textY, { width: colDeskripsi - 10, align: 'justify' });

            doc.text(formatNilai(row.target), curX, centerTextY, { width: colTarget, align: 'center' });
            doc.text(formatNilai(row.rerata), curX + colTarget, centerTextY, { width: colRerata, align: 'center' });

            // Status Warna-warni (Ujung Kanan)
            let statusColor = 'black';
            if (row.status === 'Sudah Memenuhi') statusColor = '#27ae60'; // Hijau
            else if (row.status === 'Belum Memenuhi') statusColor = '#e74c3c'; // Merah

            doc.font('Helvetica-Bold').fillColor(statusColor).text(row.status, curX + colTarget + colRerata, centerTextY, { width: colStatus, align: 'center' });

            // 🟢 LOGIKA BARU: MERAHKAN ANGKA CAPAIAN JIKA DI BAWAH TARGET
            const targetVal = parseFloat(String(row.target).replace(',', '.')) || 0;
            const capaianVal = parseFloat(String(row.capaian).replace(',', '.')) || 0;
            const isCapaianMerah = capaianVal < targetVal && row.status !== 'Belum Dinilai';

            doc.font('Helvetica').fillColor(isCapaianMerah ? '#e74c3c' : 'black');
            doc.text(formatNilai(row.capaian), curX + tEvalW, centerTextY, { width: colCapaian, align: 'center' });

            // Kembalikan ke warna hitam untuk teks Progres
            doc.fillColor('black');
            doc.text(row.progres, curX + tEvalW + colCapaian, centerTextY, { width: colProgres, align: 'center' });

            rowY += cellH;
        });
        doc.y = rowY + 15;

        // =========================================================
        // 5. FOOTER
        // =========================================================
        if (doc.y > 650) { doc.addPage(); doc.y = 30; }

        doc.font('Helvetica-Bold').fontSize(8).fillColor('black').text('Keterangan:', boxX, doc.y);
        doc.font('Helvetica').fontSize(7).text('Warna hijau menandakan CPL Anda memenuhi target, sedangkan warna merah menunjukkan area yang masih perlu ditingkatkan.', boxX, doc.y);

        doc.moveDown(2);
        const ttdY = doc.y;

        doc.font('Helvetica').fontSize(9).text('Ketua Program Studi', boxX, ttdY, { align: 'left' });
        doc.text('S1 Teknik Informatika', boxX, doc.y, { align: 'left' });
        doc.moveDown(4);
        doc.font('Helvetica-Bold').text(process.env.NAMA_KAPRODI_DEFAULT || '-', boxX, doc.y, { align: 'left' });

        const printDate = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', year: 'numeric', month: 'long', day: 'numeric' });
        doc.font('Helvetica').text(`${ENV_KOTA_TTD()}, ${printDate}`, 0, ttdY, { align: 'right', width: boxX + boxW });
        doc.text('Wakil Rektor 1', 0, doc.y, { align: 'right', width: boxX + boxW });
        doc.text(ENV_NAMA_UNIV(), 0, doc.y, { align: 'right', width: boxX + boxW });
        doc.moveDown(3);
        doc.font('Helvetica-Bold').text(ENV_WAKIL_REKTOR(), 0, doc.y, { align: 'right', width: boxX + boxW });

        doc.end();
    } catch (error) {
        next(error);
    }
};

// ============================================================
// CONTROLLER: exportPdfLaporanCpmkPerMahasiswa
// ============================================================
// export const exportPdfLaporanCpmkPerMahasiswa = async (req, res, next) => {
//     try {
//         const filters = req.query;
//         const data = await MonitoringService.getLaporanCpmkPerMahasiswa(filters);

//         // Kertas A4 Portrait
//         const doc = new PDFDocument({ margin: 30, size: 'A4' });
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', 'attachment; filename="Monitoring_CPMK_Mahasiswa.pdf"');
//         doc.pipe(res);

//         const logoPath = path.join(process.cwd(), 'public', 'logo', 'uika.jpg');
//         const boxX = 30;
//         const boxW = 535;
//         const isPakaiKop = String(filters.kop).toLowerCase() === 'true';

//         // =========================================================
//         // 1. KOP SURAT
//         // =========================================================
//         if (isPakaiKop) {
//             try { doc.image(logoPath, boxX, 20, { width: 55 }); } catch (e) { }
//             doc.font('Helvetica-Bold').fontSize(13).fillColor('black')
//                 .text(ENV_NAMA_UNIV(), boxX, 22, { width: boxW, align: 'center' });
//             doc.font('Helvetica').fontSize(8)
//                 .text(ENV_ALAMAT_UNIV(), boxX, doc.y + 1, { width: boxW, align: 'center' });
//             doc.text(ENV_KONTAK_UNIV(), boxX, doc.y + 1, { width: boxW, align: 'center' });
//             if (doc.y < 85) doc.y = 85;
//             doc.save().lineWidth(1.5).strokeColor('#000000')
//                 .moveTo(boxX, doc.y).lineTo(boxX + boxW, doc.y).stroke().restore();
//             doc.moveDown(1);
//         }

//         // =========================================================
//         // 2. INFO SECTION (Kotak 4 Baris Data + Logo Kiri)
//         // =========================================================
//         const infoY = doc.y;
//         const rowH = 17;
//         const leftW = 110;
//         const rightW = boxW - leftW;
//         const totalH = rowH * 5; // 1 Header + 4 Baris Data

//         doc.save().lineWidth(0.5).strokeColor('#aaaaaa');
//         doc.rect(boxX, infoY, boxW, totalH).stroke();
//         doc.moveTo(boxX + leftW, infoY).lineTo(boxX + leftW, infoY + totalH).stroke();

//         if (isPakaiKop) {
//             try {
//                 const logoSize = 65;
//                 doc.image(logoPath, boxX + 22, infoY + (totalH / 2) - (logoSize / 2), { width: logoSize });
//             } catch (e) { }
//         }

//         // Header Biru
//         doc.save().rect(boxX + leftW, infoY, rightW, rowH).fill('#0c4781').restore();
//         doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff')
//             .text('CPMK PER MAHASISWA', boxX + leftW, infoY + 5, { width: rightW, align: 'center' });
//         doc.save().lineWidth(0.5).strokeColor('#aaaaaa')
//             .moveTo(boxX + leftW, infoY + rowH).lineTo(boxX + boxW, infoY + rowH).stroke().restore();

//         const infoKeys = ["Tahun Kurikulum", "Program Studi", "Mata Kuliah", "Angkatan"];
//         const infoVals = [
//             data.info.tahunKurikulum,
//             data.info.programStudi,
//             data.info.mataKuliah,
//             data.info.angkatan
//         ];

//         doc.fontSize(8);
//         const keyColW = 120;
//         for (let i = 0; i < 4; i++) {
//             const ry = infoY + rowH + (i * rowH);
//             doc.font('Helvetica-Bold').fillColor('black').text(infoKeys[i], boxX + leftW + 8, ry + 5);
//             doc.save().lineWidth(0.5).strokeColor('#aaaaaa')
//                 .moveTo(boxX + leftW + keyColW, ry)
//                 .lineTo(boxX + leftW + keyColW, ry + rowH).stroke().restore();
//             doc.font('Helvetica').text(infoVals[i], boxX + leftW + keyColW + 8, ry + 5);
//             if (i < 3) {
//                 doc.save().lineWidth(0.5).strokeColor('#aaaaaa')
//                     .moveTo(boxX + leftW, ry + rowH).lineTo(boxX + boxW, ry + rowH).stroke().restore();
//             }
//         }
//         doc.y = infoY + totalH + 15;

//         // =========================================================
//         // 3. DAFTAR CPMK
//         // =========================================================
//         const cpmkY = doc.y;
//         doc.font('Helvetica-Bold').fontSize(8).fillColor('black')
//             .text('Detail CPMK Mata Kuliah:', boxX + 10, cpmkY + 6);

//         let listY = cpmkY + 20;
//         data.daftarCpmk.forEach(c => {
//             doc.font('Helvetica-Bold').fontSize(7).text(`•  ${c.kode}`, boxX + 15, listY, { continued: true });
//             doc.font('Helvetica').text(`  ${c.deskripsi}`, { width: boxW - 30 });
//             listY = doc.y + 2;
//         });

//         doc.save().lineWidth(0.5).strokeColor('#cccccc')
//             .rect(boxX, cpmkY, boxW, (doc.y - cpmkY) + 8).stroke().restore();
//         doc.y += 15;

//         // =========================================================
//         // 4. TABEL UTAMA
//         // =========================================================
//         const cpmkCount = data.daftarCpmk.length || 1;
//         const colNo = 25;
//         const colNim = 70;
//         const colStatus = 80;
//         const colNama = 170;
//         const cpmkArea = boxW - (colNo + colNim + colNama + colStatus);
//         const cpmkW = cpmkArea / cpmkCount;
//         const cpmkStartX = boxX + colNo + colNim + colNama;
//         const statusStartX = cpmkStartX + cpmkArea;
//         const rowHeight = 18;

//         // Helper: gambar garis vertikal kolom CPMK (kecuali area merged kiri)
//         const drawCpmkVerticals = (y, h, skipLeft = false) => {
//             doc.save().lineWidth(0.5).strokeColor('#aaaaaa');
//             if (!skipLeft) {
//                 // Garis No | NIM | Nama (hanya untuk baris normal, bukan target)
//                 doc.moveTo(boxX + colNo, y).lineTo(boxX + colNo, y + h).stroke();
//                 doc.moveTo(boxX + colNo + colNim, y).lineTo(boxX + colNo + colNim, y + h).stroke();
//             }
//             doc.moveTo(cpmkStartX, y).lineTo(cpmkStartX, y + h).stroke();
//             doc.moveTo(statusStartX, y).lineTo(statusStartX, y + h).stroke();
//             for (let i = 1; i < cpmkCount; i++) {
//                 doc.moveTo(cpmkStartX + (i * cpmkW), y).lineTo(cpmkStartX + (i * cpmkW), y + h).stroke();
//             }
//             doc.restore();
//         };

//         // ── HEADER ROW (2 baris tinggi) ──
//         const hy = doc.y;
//         const hh = 28;
//         const halfHy = hy + 14;

//         doc.save().rect(boxX, hy, boxW, hh).fill('#0c4781').restore();
//         doc.save().lineWidth(0.5).strokeColor('#aaaaaa')
//             .rect(boxX, hy, boxW, hh).stroke().restore();

//         drawCpmkVerticals(hy, hh, false);

//         // Garis pemisah "Nilai CPMK" dengan kode-kode CPMK di baris ke-2 header
//         doc.save().lineWidth(0.5).strokeColor('#aaaaaa')
//             .moveTo(cpmkStartX, halfHy).lineTo(statusStartX, halfHy).stroke().restore();

//         doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
//         doc.text('No.', boxX, hy + 10, { width: colNo, align: 'center' });
//         doc.text('NIM', boxX + colNo, hy + 10, { width: colNim, align: 'center' });
//         doc.text('Nama Mahasiswa', boxX + colNo + colNim, hy + 10, { width: colNama, align: 'center' });
//         doc.text('Status Capaian', statusStartX, hy + 10, { width: colStatus, align: 'center' });
//         doc.text('Nilai CPMK', cpmkStartX, hy + 4, { width: cpmkArea, align: 'center' });

//         doc.fontSize(7);
//         data.daftarCpmk.forEach((c, i) => {
//             doc.text(c.kode, cpmkStartX + (i * cpmkW), halfHy + 4, { width: cpmkW, align: 'center' });
//         });

//         let rowY = hy + hh;

//         // Helper format nilai
//         const formatNilai = (val) => {
//             if (val === null || val === undefined || val === '') return '-';
//             const n = Number(val);
//             if (isNaN(n)) return '0,00';
//             return n.toFixed(2).replace('.', ',');
//         };

//         // ── BARIS TARGET (background biru, font putih, kolom No/NIM/Nama di-MERGE) ──
//         doc.save().rect(boxX, rowY, boxW, rowHeight).fill('#0c4781').restore();
//         doc.save().lineWidth(0.5).strokeColor('#1a5fa3')
//             .rect(boxX, rowY, boxW, rowHeight).stroke().restore();

//         // Hanya gambar garis vertikal di area CPMK dan Status (skip area kiri = merged)
//         drawCpmkVerticals(rowY, rowHeight, true /* skipLeft */);

//         // Teks "Target CPMK" di-center di area 3 kolom kiri yang merged — font putih
//         const mergedLeftW = colNo + colNim + colNama;
//         doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff')
//             .text('Target CPMK', boxX, rowY + 5, { width: mergedLeftW, align: 'center' });

//         // Nilai target tiap CPMK — font putih
//         data.daftarCpmk.forEach((c, i) => {
//             doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff')
//                 .text(formatNilai(c.target), cpmkStartX + (i * cpmkW), rowY + 5, { width: cpmkW, align: 'center' });
//         });
//         // Kolom Status kosong pada baris target
//         rowY += rowHeight;

//         // ── BARIS DATA MAHASISWA ──
//         data.dataMahasiswa.forEach((row, iRow) => {
//             if (rowY + rowHeight > 750) {
//                 doc.addPage();
//                 rowY = 30;
//             }

//             const bgColor = (iRow % 2 !== 0) ? '#f9f9f9' : '#ffffff';
//             doc.save().rect(boxX, rowY, boxW, rowHeight).fill(bgColor).restore();

//             doc.save().lineWidth(0.5).strokeColor('#aaaaaa')
//                 .rect(boxX, rowY, boxW, rowHeight).stroke().restore();

//             drawCpmkVerticals(rowY, rowHeight, false);

//             const textY = rowY + 5;
//             doc.font('Helvetica').fontSize(7.5).fillColor('black');
//             doc.text(`${iRow + 1}.`, boxX, textY, { width: colNo, align: 'center' });
//             doc.text(row.npm, boxX + colNo, textY, { width: colNim, align: 'center' });
//             doc.text(row.nama, boxX + colNo + colNim + 5, textY, { width: colNama - 5, align: 'left' });

//             data.daftarCpmk.forEach((c, i) => {
//                 doc.text(formatNilai(row.cpmk[c.kode]), cpmkStartX + (i * cpmkW), textY, { width: cpmkW, align: 'center' });
//             });

//             // Warna Status
//             let statusColor = 'black';
//             if (row.status === 'Sudah Memenuhi') statusColor = '#27ae60';
//             else if (row.status === 'Belum Memenuhi') statusColor = '#e74c3c';

//             doc.font('Helvetica-Bold').fillColor(statusColor)
//                 .text(row.status, statusStartX, textY, { width: colStatus, align: 'center' });

//             rowY += rowHeight;
//         });

//         doc.y = rowY + 15;

//         // =========================================================
//         // 5. FOOTER
//         // =========================================================
//         if (doc.y > 750) { doc.addPage(); doc.y = 30; }

//         const printDate = new Date().toLocaleString('id-ID', {
//             timeZone: 'Asia/Jakarta',
//             dateStyle: 'long',
//             timeStyle: 'medium'
//         });
//         doc.save().moveTo(boxX, doc.y).lineTo(boxX + boxW, doc.y)
//             .lineWidth(0.5).strokeColor('#cccccc').stroke().restore();
//         doc.moveDown(0.5);
//         doc.font('Helvetica').fontSize(7).fillColor('#555555')
//             .text(
//                 buildFooter(req.user?.nama || req.user?.name || 'Sistem'),
//                 boxX, doc.y
//             );

//         doc.end();
//     } catch (error) {
//         next(error);
//     }
// };

export const exportPdfLaporanCpmkPerMahasiswa = async (req, res, next) => {
    try {
        const filters = req.query;
        const data = await MonitoringService.getLaporanCpmkPerMahasiswa(filters);

        // Kertas A4 Portrait
        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Monitoring_CPMK_Mahasiswa.pdf"');
        doc.pipe(res);

        const logoPath = path.join(process.cwd(), 'public', 'logo', 'uika.jpg');
        const boxX = 30;
        const boxW = 535;
        const isPakaiKop = String(filters.kop).toLowerCase() === 'true';

        // =========================================================
        // 1. KOP SURAT
        // =========================================================
        if (isPakaiKop) {
            try { doc.image(logoPath, boxX, 20, { width: 55 }); } catch (e) { }
            doc.font('Helvetica-Bold').fontSize(13).fillColor('black')
                .text(ENV_NAMA_UNIV(), boxX, 22, { width: boxW, align: 'center' });
            doc.font('Helvetica').fontSize(8)
                .text(ENV_ALAMAT_UNIV(), boxX, doc.y + 1, { width: boxW, align: 'center' });
            doc.text(ENV_KONTAK_UNIV(), boxX, doc.y + 1, { width: boxW, align: 'center' });
            if (doc.y < 85) doc.y = 85;
            doc.save().lineWidth(1.5).strokeColor('#000000')
                .moveTo(boxX, doc.y).lineTo(boxX + boxW, doc.y).stroke().restore();
            doc.moveDown(1);
        }

        // =========================================================
        // 2. INFO SECTION (Kotak 4 Baris Data + Logo Kiri)
        // =========================================================
        const infoY = doc.y;
        const rowH = 17;
        const leftW = 110;
        const rightW = boxW - leftW;
        const totalH = rowH * 5; // 1 Header + 4 Baris Data

        doc.save().lineWidth(0.5).strokeColor('#aaaaaa');
        doc.rect(boxX, infoY, boxW, totalH).stroke();
        doc.moveTo(boxX + leftW, infoY).lineTo(boxX + leftW, infoY + totalH).stroke();

        if (isPakaiKop) {
            try {
                const logoSize = 65;
                doc.image(logoPath, boxX + 22, infoY + (totalH / 2) - (logoSize / 2), { width: logoSize });
            } catch (e) { }
        }

        // Header Biru
        doc.save().rect(boxX + leftW, infoY, rightW, rowH).fill('#0c4781').restore();
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff')
            .text('CPMK PER MAHASISWA', boxX + leftW, infoY + 5, { width: rightW, align: 'center' });
        doc.save().lineWidth(0.5).strokeColor('#aaaaaa')
            .moveTo(boxX + leftW, infoY + rowH).lineTo(boxX + boxW, infoY + rowH).stroke().restore();

        const infoKeys = ["Tahun Kurikulum", "Program Studi", "Mata Kuliah", "Angkatan"];
        const infoVals = [
            data.info.tahunKurikulum,
            data.info.programStudi,
            data.info.mataKuliah,
            data.info.angkatan
        ];

        doc.fontSize(8);
        const keyColW = 120;
        for (let i = 0; i < 4; i++) {
            const ry = infoY + rowH + (i * rowH);
            doc.font('Helvetica-Bold').fillColor('black').text(infoKeys[i], boxX + leftW + 8, ry + 5);
            doc.save().lineWidth(0.5).strokeColor('#aaaaaa')
                .moveTo(boxX + leftW + keyColW, ry)
                .lineTo(boxX + leftW + keyColW, ry + rowH).stroke().restore();
            doc.font('Helvetica').text(infoVals[i], boxX + leftW + keyColW + 8, ry + 5);
            if (i < 3) {
                doc.save().lineWidth(0.5).strokeColor('#aaaaaa')
                    .moveTo(boxX + leftW, ry + rowH).lineTo(boxX + boxW, ry + rowH).stroke().restore();
            }
        }
        doc.y = infoY + totalH + 15;

        // =========================================================
        // 3. DAFTAR CPMK
        // =========================================================
        const cpmkY = doc.y;
        doc.font('Helvetica-Bold').fontSize(8).fillColor('black')
            .text('Detail CPMK Mata Kuliah:', boxX + 10, cpmkY + 6);

        let listY = cpmkY + 20;
        const seenParentCpmk = new Set();
        data.daftarCpmk.forEach(c => {
            if (seenParentCpmk.has(c.parentKode)) return;
            seenParentCpmk.add(c.parentKode);
            doc.font('Helvetica-Bold').fontSize(7).text(`•  ${c.parentKode}`, boxX + 15, listY, { continued: true });
            doc.font('Helvetica').text(`  ${c.parentDeskripsi}`, { width: boxW - 30 });
            listY = doc.y + 2;
        });

        doc.save().lineWidth(0.5).strokeColor('#cccccc')
            .rect(boxX, cpmkY, boxW, (doc.y - cpmkY) + 8).stroke().restore();
        doc.y += 15;

        // =========================================================
        // 4. TABEL UTAMA
        // =========================================================
        const cpmkCount = data.daftarCpmk.length || 1;
        const colNo = 25;
        const colNim = 70;
        const colStatus = 80;
        const colNama = 170;
        const cpmkArea = boxW - (colNo + colNim + colNama + colStatus);
        const cpmkW = cpmkArea / cpmkCount;
        const cpmkStartX = boxX + colNo + colNim + colNama;
        const statusStartX = cpmkStartX + cpmkArea;
        const rowHeight = 18;

        // Helper: gambar garis vertikal kolom CPMK (kecuali area merged kiri)
        const drawCpmkVerticals = (y, h, skipLeft = false) => {
            doc.save().lineWidth(0.5).strokeColor('#aaaaaa');
            if (!skipLeft) {
                // Garis No | NIM | Nama (hanya untuk baris normal, bukan target)
                doc.moveTo(boxX + colNo, y).lineTo(boxX + colNo, y + h).stroke();
                doc.moveTo(boxX + colNo + colNim, y).lineTo(boxX + colNo + colNim, y + h).stroke();
            }
            doc.moveTo(cpmkStartX, y).lineTo(cpmkStartX, y + h).stroke();
            doc.moveTo(statusStartX, y).lineTo(statusStartX, y + h).stroke();
            for (let i = 1; i < cpmkCount; i++) {
                doc.moveTo(cpmkStartX + (i * cpmkW), y).lineTo(cpmkStartX + (i * cpmkW), y + h).stroke();
            }
            doc.restore();
        };

        // ── HEADER ROW (2 baris tinggi) ──
        const hy = doc.y;
        const hh = 28;
        const halfHy = hy + 14;
        const hasSubCpmk = !!data.hasSubCpmk;

        doc.save().rect(boxX, hy, boxW, hh).fill('#0c4781').restore();
        doc.save().lineWidth(0.5).strokeColor('#aaaaaa')
            .rect(boxX, hy, boxW, hh).stroke().restore();

        // Garis vertikal No | NIM | Nama | (area CPMK) | Status — full height
        doc.save().lineWidth(0.5).strokeColor('#aaaaaa');
        doc.moveTo(boxX + colNo, hy).lineTo(boxX + colNo, hy + hh).stroke();
        doc.moveTo(boxX + colNo + colNim, hy).lineTo(boxX + colNo + colNim, hy + hh).stroke();
        doc.moveTo(cpmkStartX, hy).lineTo(cpmkStartX, hy + hh).stroke();
        doc.moveTo(statusStartX, hy).lineTo(statusStartX, hy + hh).stroke();

        // Garis vertikal antar kolom CPMK: antar grup CPMK induk = full height,
        // antar Sub-CPMK dalam 1 grup = hanya baris bawah (supaya label CPMK
        // induk di baris atas terlihat menyatu/merge)
        data.daftarCpmk.forEach((c, i) => {
            if (i === 0) return;
            const x = cpmkStartX + (i * cpmkW);
            if (c.isGroupFirst) {
                doc.moveTo(x, hy).lineTo(x, hy + hh).stroke();
            } else if (hasSubCpmk) {
                doc.moveTo(x, halfHy).lineTo(x, hy + hh).stroke();
            }
        });
        doc.restore();

        // Garis pemisah baris atas (grup CPMK) dengan baris bawah (kode kolom)
        doc.save().lineWidth(0.5).strokeColor('#aaaaaa')
            .moveTo(cpmkStartX, halfHy).lineTo(statusStartX, halfHy).stroke().restore();

        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
        doc.text('No.', boxX, hy + 10, { width: colNo, align: 'center' });
        doc.text('NIM', boxX + colNo, hy + 10, { width: colNim, align: 'center' });
        doc.text('Nama Mahasiswa', boxX + colNo + colNim, hy + 10, { width: colNama, align: 'center' });
        doc.text('Status Capaian', statusStartX, hy + 10, { width: colStatus, align: 'center' });

        if (hasSubCpmk) {
            // Baris atas: label CPMK induk, merged sepanjang Sub-CPMK miliknya
            data.daftarCpmk.forEach((c, i) => {
                if (!c.isGroupFirst) return;
                doc.text(c.parentKode, cpmkStartX + (i * cpmkW), hy + 4, { width: cpmkW * c.groupSize, align: 'center' });
            });
        } else {
            doc.text('Nilai CPMK', cpmkStartX, hy + 4, { width: cpmkArea, align: 'center' });
        }

        // Baris bawah: kode kolom (Sub-CPMK jika ada, atau CPMK)
        doc.fontSize(7);
        data.daftarCpmk.forEach((c, i) => {
            doc.text(c.kode, cpmkStartX + (i * cpmkW), halfHy + 4, { width: cpmkW, align: 'center' });
        });

        let rowY = hy + hh;

        // Helper format nilai
        const formatNilai = (val) => {
            if (val === null || val === undefined || val === '') return '-';
            const n = Number(val);
            if (isNaN(n)) return '0,00';
            return n.toFixed(2).replace('.', ',');
        };

        // ── BARIS TARGET (background biru, font putih, kolom No/NIM/Nama di-MERGE) ──
        doc.save().rect(boxX, rowY, boxW, rowHeight).fill('#0c4781').restore();
        doc.save().lineWidth(0.5).strokeColor('#1a5fa3')
            .rect(boxX, rowY, boxW, rowHeight).stroke().restore();

        // Hanya gambar garis vertikal di area CPMK dan Status (skip area kiri = merged)
        drawCpmkVerticals(rowY, rowHeight, true /* skipLeft */);

        // Teks "Target CPMK" di-center di area 3 kolom kiri yang merged — font putih
        const mergedLeftW = colNo + colNim + colNama;
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff')
            .text('Target CPMK', boxX, rowY + 5, { width: mergedLeftW, align: 'center' });

        // Nilai target tiap CPMK — font putih
        data.daftarCpmk.forEach((c, i) => {
            doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff')
                .text(formatNilai(c.target), cpmkStartX + (i * cpmkW), rowY + 5, { width: cpmkW, align: 'center' });
        });
        // Kolom Status kosong pada baris target
        rowY += rowHeight;

        // ── BARIS DATA MAHASISWA ──
        data.dataMahasiswa.forEach((row, iRow) => {
            if (rowY + rowHeight > 750) {
                doc.addPage();
                rowY = 30;
            }

            const bgColor = (iRow % 2 !== 0) ? '#f9f9f9' : '#ffffff';
            doc.save().rect(boxX, rowY, boxW, rowHeight).fill(bgColor).restore();

            doc.save().lineWidth(0.5).strokeColor('#aaaaaa')
                .rect(boxX, rowY, boxW, rowHeight).stroke().restore();

            drawCpmkVerticals(rowY, rowHeight, false);

            const textY = rowY + 5;
            doc.font('Helvetica').fontSize(7.5).fillColor('black');
            doc.text(`${iRow + 1}.`, boxX, textY, { width: colNo, align: 'center' });
            doc.text(row.npm, boxX + colNo, textY, { width: colNim, align: 'center' });
            doc.text(row.nama, boxX + colNo + colNim + 5, textY, { width: colNama - 5, align: 'left' });

            // 🟢 LOGIKA BARU: CEK NILAI PER CPMK, MERAHKAN JIKA DI BAWAH TARGET
            data.daftarCpmk.forEach((c, i) => {
                const nilaiMhs = parseFloat(row.cpmk[c.kode]);
                const targetCpmk = parseFloat(c.target) || 0;

                let textColor = 'black';
                // Jika sudah ada nilainya dan ternyata di bawah target, MERAHKAN!
                if (!isNaN(nilaiMhs) && nilaiMhs < targetCpmk) {
                    textColor = '#e74c3c';
                }

                doc.font('Helvetica').fillColor(textColor);
                doc.text(formatNilai(row.cpmk[c.kode]), cpmkStartX + (i * cpmkW), textY, { width: cpmkW, align: 'center' });
            });

            // Warna Status (Ujung Kanan)
            let statusColor = 'black';
            if (row.status === 'Sudah Memenuhi') statusColor = '#27ae60';
            else if (row.status === 'Belum Memenuhi') statusColor = '#e74c3c';

            doc.font('Helvetica-Bold').fillColor(statusColor)
                .text(row.status, statusStartX, textY, { width: colStatus, align: 'center' });

            rowY += rowHeight;
        });

        doc.y = rowY + 15;

        // =========================================================
        // 5. FOOTER
        // =========================================================
        if (doc.y > 750) { doc.addPage(); doc.y = 30; }

        const printDate = new Date().toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            dateStyle: 'long',
            timeStyle: 'medium'
        });
        doc.save().moveTo(boxX, doc.y).lineTo(boxX + boxW, doc.y)
            .lineWidth(0.5).strokeColor('#cccccc').stroke().restore();
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(7).fillColor('#555555')
            .text(
                buildFooter(req.user?.nama || req.user?.name || 'Sistem'),
                boxX, doc.y
            );

        doc.end();
    } catch (error) {
        next(error);
    }
};