import models from "../../models/index.js";
import * as MonitoringService from '../../services/monitoring.service.js';
import ResponseBuilder from "../../utils/response.js";


// 1. API Transkrip OBE Mahasiswa (Sesuai PDF Hal 12-13)
export const getTranskripObeMahasiswa = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const mhsId = req.params.mhsId;
    const gunakanKop = req.query.kop === 'true';

    try {
        const metaSurat = gunakanKop ? {
            institusi: "Universitas Ibn Khaldun",
            fakultas: "Fakultas Teknik dan Sains",
            prodi: "Teknik Informatika",
            logo: "url_ke_logo_uika"
        } : null;

        const payloadCetak = {
            metadataSurat: metaSurat,
            dataMahasiswa: { id: mhsId },
            matriksCpl: [] // Nanti diisi dari logic agregasi
        };

        return responseBuilder.code(200).message("Data transkrip siap cetak").json(payloadCetak);
    } catch (error) {
        return responseBuilder.status('failure').code(500).json(error.message);
    }
}

// /controllers/akademik/monitoring.controller.js

// /controllers/akademik/monitoring.controller.js

// /controllers/akademik/monitoring.controller.js

export const getSemuaDataId = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);

    try {
        const [obe, pl, cpl, mk, krs] = await Promise.all([
            // Sesuai dump: siak_obe punya id, siak_program_studi_id, siak_tahun_kurikulum_id
            models.Obe.findAll({ 
                attributes: ['id', 'siak_program_studi_id', 'siak_tahun_kurikulum_id'] 
            }),
            
            // Sesuai dump: siak_profil_lulusan punya id, siak_obe_id, kode, profil
            models.ProfilLulusan.findAll({ 
                attributes: ['id', 'siak_obe_id', 'kode', 'profil'] 
            }),
            
            // Sesuai dump: siak_capaian_pembelajaran_lulusan punya id, siak_obe_id, kode
            models.CapaianPembelajaranLulusan.findAll({ 
                attributes: ['id', 'siak_obe_id', 'kode'] 
            }),
            
            // Sesuai dump: siak_mata_kuliah punya id, kode, nama
            models.MataKuliah.findAll({ 
                attributes: ['id', 'kode', 'nama'] 
            }),
            
            // Sesuai dump: siak_rincian_krs_mahasiswa punya id, siak_krs_mahasiswa_id, siak_kelas_kuliah_id
            // (Kita ambil ID Rincian KRS agar bisa ngetes input nilai per MK)
            models.RincianKrsMahasiswa.findAll({ 
                attributes: ['id', 'siak_krs_mahasiswa_id', 'siak_kelas_kuliah_id'] 
            })
        ]);

        return responseBuilder
            .code(200)
            .message("Berhasil mengambil daftar ID referensi sesuai dump database")
            .json({
                daftarObe: obe,
                daftarProfilLulusan: pl,
                daftarCpl: cpl,
                daftarMataKuliah: mk,
                daftarRincianKrs: krs
            });
    } catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message("Gagal mengambil data monitoring: " + error.message)
            .json(error.message);
    }
}

export const getMonitoringCplProdi = async (req, res, next) => {
    try {
        // Tangkap Query dari URL (Postman/Frontend)
        const filters = {
            tahunKurikulumId: req.query.tahunKurikulumId,
            prodiId: req.query.prodiId,
            angkatan: req.query.angkatan,
            metode: req.query.metode || 'rerata', // Default 'rerata' jika kosong
            useKop: req.query.kop || false
        };

        // Validasi input dasar
        if (!filters.tahunKurikulumId || !filters.prodiId || !filters.angkatan) {
            return new ResponseBuilder(res).status('failure').code(400)
                   .message("Tahun Kurikulum, Program Studi, dan Angkatan wajib diisi!").json();
        }

        const data = await MonitoringService.getCplPerProgramStudi(filters);

        return new ResponseBuilder(res)
            .code(200)
            .message(`Berhasil menghitung Monitoring CPL Prodi (${filters.metode})`)
            .json(data);

    } catch (error) {
        next(error);
    }
};
export const exportPdfLaporanLengkap = async (req, res, next) => {
    try {
        const idsParam = req.query.ids;
        if (!idsParam) return res.status(400).json({ status: 400, message: "ID Kurikulum wajib dipilih!" });

        const obeIds = idsParam.split(',');
        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Laporan_Lengkap_OBE.pdf"');
        doc.pipe(res);

        // --- FUNGSI PENGGAMBAR GARIS (GRID) ---
        const drawGrid = (val, i, j, row, rectRow, rectCell) => {
            doc.save().lineWidth(0.5).strokeColor('#000000')
               .rect(rectCell.x, rectCell.y, rectCell.width, rectCell.height).stroke().restore();
            return val;
        };

        for (let idx = 0; idx < obeIds.length; idx++) {
            const data = await obeService.getCetakLaporanObe(obeIds[idx]);
            const { header, profilLulusan, capaianPembelajaran, pemetaanPlCpl, pemetaanCplMk } = data;

            if (idx > 0) doc.addPage();

            // =========================================================
            // 1. KOP SURAT & LOGO (Ukuran 440x444 dikalibrasi)
            // =========================================================
            // Catatan: Pastikan file logo ada di folder public/logo-uika.png
            const logoPath = path.join(process.cwd(), 'public', 'logo-uika.png');
            try {
                // Kita skalakan 440px menjadi lebar 60pt agar pas di kop
                doc.image(logoPath, 40, 25, { width: 60 }); 
            } catch (e) { console.log("Logo tidak ditemukan, skip logo."); }

            doc.font('Helvetica-Bold').fontSize(14).text('UNIVERSITAS IBN KHALDUN BOGOR', 110, 30);
            doc.fontSize(10).text('FAKULTAS TEKNIK DAN SAINS', 110, 45);
            doc.font('Helvetica').fontSize(8).text('Jl. KH. Sholeh Iskandar KM.2 Kedung Badak Bogor 16162', 110, 58);
            doc.moveDown(1.5);
            doc.moveTo(30, 95).lineTo(810, 95).lineWidth(2).stroke(); // Garis Kop

            // Judul Laporan
            doc.moveDown(2);
            doc.font('Helvetica-Bold').fontSize(12).text('LAPORAN PENGISIAN OBE', { align: 'center' });
            doc.moveDown(1);

            // Info Header
            doc.font('Helvetica').fontSize(9);
            doc.text(`Program Studi : ${header.programStudi}`, 30, doc.y, { continued: true });
            doc.text(`Tahun Kurikulum : ${header.tahunKurikulum}`, { align: 'right' });
            doc.moveDown(2);

            const options = {
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
                prepareRow: () => doc.font("Helvetica").fontSize(8),
                padding: 5, x: 30,
                divider: { header: { disabled: false }, horizontal: { disabled: false } }
            };

            // =========================================================
            // 2. TABEL PROFIL LULUSAN
            // =========================================================
            await doc.table({
                title: "1. Profil Lulusan",
                headers: [
                    { label: "Kode", property: "k", width: 50, renderer: drawGrid },
                    { label: "Profil Lulusan", property: "p", width: 200, renderer: drawGrid },
                    { label: "Profesi", property: "pr", width: 230, renderer: drawGrid },
                    { label: "Deskripsi", property: "d", width: 300, renderer: drawGrid }
                ],
                datas: profilLulusan.map(pl => ({ k: pl.kode, p: pl.profil, pr: pl.profesi, d: pl.deskripsi }))
            }, options);

            // =========================================================
            // 3. TABEL CPL
            // =========================================================
            doc.moveDown(1);
            await doc.table({
                title: "2. Capaian Pembelajaran Lulusan (CPL)",
                headers: [
                    { label: "Kode", property: "k", width: 60, renderer: drawGrid },
                    { label: "Deskripsi Capaian Pembelajaran", property: "d", width: 620, renderer: drawGrid },
                    { label: "Kategori", property: "kt", width: 100, renderer: drawGrid }
                ],
                datas: capaianPembelajaran.map(c => ({ k: c.kode, d: c.deskripsi, kt: c.kategori }))
            }, options);

            // =========================================================
            // 4. MATRIKS PL -> CPL (Cleaning Duplicate)
            // =========================================================
            doc.moveDown(1);
            const cleanCpls = []; const seen = new Set();
            pemetaanPlCpl.columns.forEach(c => { if(!seen.has(c.kode)){ cleanCpls.push(c); seen.add(c.kode); }});
            
            const colW = Math.floor(500 / (cleanCpls.length || 1));
            const h3 = [{ label: "PL", property: "pl", width: 40, renderer: drawGrid }, { label: "Profil", property: "pr", width: 240, renderer: drawGrid }];
            cleanCpls.forEach(c => h3.push({ label: c.kode, property: c.kode, width: colW, align: 'center', renderer: drawGrid }));

            const d3 = pemetaanPlCpl.rows.map(r => {
                let obj = { pl: r.kodePl, pr: r.profil };
                cleanCpls.forEach(c => {
                    const find = r.bobotCpl.find(b => b.kodeCpl === c.kode && b.bobot !== "");
                    obj[c.kode] = find ? find.bobot : "-";
                });
                return obj;
            });
            await doc.table({ title: "3. Pemetaan Profil Lulusan ke CPL", headers: h3, datas: d3 }, options);

            // =========================================================
            // 5. MATRIKS CPL -> MK
            // =========================================================
            doc.moveDown(1);
            const h4 = [{ label: "Kode MK", property: "m", width: 60, renderer: drawGrid }, { label: "Mata Kuliah", property: "n", width: 180, renderer: drawGrid }, { label: "Jns", property: "j", width: 30, renderer: drawGrid }];
            cleanCpls.forEach(c => h4.push({ label: c.kode, property: c.kode, width: colW, align: 'center', renderer: drawGrid }));

            const d4 = pemetaanCplMk.rows.map(r => {
                let obj = { m: r.kodeMk, n: r.namaMk, j: r.jenisMk };
                cleanCpls.forEach(c => {
                    const find = r.mapping.find(m => m.kodeCpl === c.kode && m.isMapped);
                    obj[c.kode] = find ? "v" : ""; // Gunakan 'v' sebagai ceklis
                });
                return obj;
            });
            await doc.table({ title: "4. Pemetaan CPL ke Mata Kuliah", headers: h4, datas: d4 }, options);
        }
        doc.end();
    } catch (error) { next(error); }
};
export const exportPdfMonitoringCplProdi = async (req, res, next) => {
    try {
        const filters = req.query;
        // Panggil service yang sudah kita buat sebelumnya (Rerata / Progresif)
        const data = await MonitoringService.getCplPerProgramStudi(filters);

        // Kertas A4 Portrait (Lebar Total: 595.28, Margin: 30) -> Lebar Efektif: 535
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="Monitoring_CPL_Prodi.pdf"');
        doc.pipe(res);

        const logoPath = path.join(process.cwd(), 'public', 'logo-uika.png'); // Pastikan path logo benar

        // =========================================================
        // 1. KOP SURAT (Jika ?kop=true)
        // =========================================================
        if (data.info.useKop) {
            try { doc.image(logoPath, 35, 25, { width: 55 }); } catch (e) { }
            doc.font('Helvetica-Bold').fontSize(13).text('UNIVERSITAS IBN KHALDUN BOGOR', 105, 30);
            doc.fontSize(9).text('FAKULTAS TEKNIK DAN SAINS', 105, 45);
            doc.font('Helvetica').fontSize(7).text('Jl. KH. Sholeh Iskandar KM.2 Kedung Badak Bogor 16162', 105, 58);
            doc.text('Website: uika-bogor.ac.id | Email: info@uika-bogor.ac.id | Telepon: (0251) 8336824', 105, 68);
            doc.moveDown(1.5);
            doc.moveTo(30, 90).lineTo(565, 90).lineWidth(2).stroke();
            doc.y = 105; 
        }

        // =========================================================
        // 2. BAGIAN INFO (Logo Kiri & Tabel Biru Kanan)
        // =========================================================
        const infoStartY = doc.y;
        
        // Gambar Logo Besar di sebelah kiri (seperti di foto)
        try { doc.image(logoPath, 30, infoStartY, { width: 80 }); } catch (e) { }

        // Tabel Info di sebelah kanan logo (Mulai dari X: 120)
        const infoTable = {
            headers: [
                { label: "CPL PER PROGRAM STUDI", property: "kunci", width: 140 },
                { label: "", property: "nilai", width: 275 } 
            ],
            datas: [
                { kunci: "Tahun Kurikulum", nilai: data.info.tahunKurikulum },
                { kunci: "Program Studi", nilai: data.info.programStudi },
                { kunci: "Angkatan", nilai: data.info.angkatan },
                { kunci: "Total Mahasiswa", nilai: data.info.totalMahasiswa.toString() },
                { kunci: "Metode Perhitungan", nilai: data.info.metodePerhitungan }
            ]
        };

        await doc.table(infoTable, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(9).fillColor('white'),
            prepareRow: () => doc.font("Helvetica-Bold").fontSize(8).fillColor('black'),
            padding: 5,
            x: 120, // Geser ke kanan hindari logo
            y: infoStartY,
            divider: { 
                header: { disabled: false, width: 1, opacity: 1, color: '#ffffff' }, 
                horizontal: { disabled: false, width: 0.5, opacity: 0.5 } 
            }
        });

        // 🎨 Trik Mewarnai Header Tabel Info jadi Biru Tua
        doc.save().rect(120, infoStartY, 415, 20).fill('#1565C0').restore();
        doc.fillColor('white').font('Helvetica-Bold').fontSize(9).text('CPL PER PROGRAM STUDI', 125, infoStartY + 6, { width: 405, align: 'center' });

        doc.y = Math.max(doc.y, infoStartY + 100);
        doc.moveDown(1);

        // =========================================================
        // 3. SPIDERCHART & SUMMARY BOX
        // =========================================================
        const chartY = doc.y;
        doc.fillColor('black').font('Helvetica-Bold').fontSize(10).text('Spiderchart CPL Program Studi', 30, chartY);

        // Generate Chart (Aktifkan Datalabels agar angka muncul di ujung grafik)
        const chartConfig = {
            type: 'radar',
            data: {
                labels: data.chart.labels,
                datasets: [
                    { label: 'Capaian', data: data.chart.datasets[0].data, backgroundColor: 'rgba(54, 162, 235, 0.2)', borderColor: 'rgb(54, 162, 235)', pointBackgroundColor: 'rgb(54, 162, 235)' },
                    { label: 'Target', data: data.chart.datasets[1].data, borderColor: 'rgb(255, 205, 86)', pointBackgroundColor: 'rgb(255, 205, 86)', datalabels: { display: false } }
                ]
            },
            options: { 
                scale: { ticks: { beginAtZero: true, max: 100 } },
                plugins: {
                    datalabels: {
                        display: true, align: 'end', color: '#1565C0', font: { size: 10, weight: 'bold' },
                        formatter: (val) => val > 0 ? val.toString().replace('.', ',') : '0'
                    }
                }
            }
        };

        const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=260&h=260`;
        const chartResponse = await axios.get(chartUrl, { responseType: 'arraybuffer' });
        const chartImage = Buffer.from(chartResponse.data, 'binary');
        doc.image(chartImage, 20, chartY + 15, { width: 260 });

        // Kotak Summary Performa (Kanan)
        const sumX = 300;
        doc.fillColor('black').font('Helvetica-Bold').fontSize(10).text('Performa CPL Program Studi', sumX, chartY + 40);
        
        // Box Abu-abu Terang
        doc.save().roundedRect(sumX, chartY + 60, 235, 60, 5).fill('#f4f6f9').restore();
        
        // Tertinggi (Hijau)
        doc.fillColor('black').font('Helvetica-Bold').fontSize(8).text('CPL Tertinggi', sumX + 15, chartY + 70);
        doc.fillColor('#27ae60').fontSize(16).text(data.summary.tertinggi.nilai, sumX + 15, chartY + 85);
        doc.fillColor('black').font('Helvetica').fontSize(7).text(data.summary.tertinggi.label, sumX + 15, chartY + 105);

        // Terendah (Merah)
        doc.fillColor('black').font('Helvetica-Bold').fontSize(8).text('CPL Terendah', sumX + 120, chartY + 70);
        doc.fillColor('#e74c3c').fontSize(16).text(data.summary.terendah.nilai, sumX + 120, chartY + 85);
        doc.fillColor('black').font('Helvetica').fontSize(7).text(data.summary.terendah.label, sumX + 120, chartY + 105);

        // Deskripsi Text
        doc.fillColor('black').font('Helvetica-Oblique').fontSize(7)
           .text(`CPL mencatat capaian tertinggi sebesar ${data.summary.tertinggi.nilai} (${data.summary.tertinggi.label.replace('di posisi ', '')}), dengan batas terendah pada angka ${data.summary.terendah.nilai} (${data.summary.terendah.label.replace('di posisi ', '')}).`, sumX, chartY + 130, { width: 235 });

        doc.y = Math.max(doc.y, chartY + 290);
        doc.moveDown(1);

        // =========================================================
        // 4. TABEL DETAIL (Tengah, Full Grid, Header Biru)
        // =========================================================
        doc.font('Helvetica-Bold').fontSize(10).fillColor('black').text('Detail Deskripsi dan Hasil Setiap CPL Program Studi', 30, doc.y);
        doc.moveDown(0.5);

        const tableY = doc.y;

        // Custom Draw Grid biar bergaris kayak Excel
        const drawGrid = (val, i, j, row, rectRow, rectCell) => {
            doc.save().lineWidth(0.5).strokeColor('#bdc3c7')
               .rect(rectCell.x, rectCell.y, rectCell.width, rectCell.height).stroke().restore();
            return val;
        };

        const detailTable = {
            headers: [
                { label: "Kode CPL", property: "kode", width: 50, align: "center", renderer: drawGrid },
                { label: "Deskripsi CPL", property: "deskripsi", width: 225, renderer: drawGrid },
                { label: "Target", property: "target", width: 40, align: "center", renderer: drawGrid },
                { label: "Capaian", property: "capaian", width: 45, align: "center", renderer: drawGrid },
                { label: "Persentase", property: "status", width: 75, align: "center", renderer: drawGrid },
                { label: "Belum", property: "mhsBelum", width: 50, align: "center", renderer: drawGrid },
                { label: "Sudah", property: "mhsSudah", width: 50, align: "center", renderer: drawGrid }
            ],
            datas: data.tabel
        };

        await doc.table(detailTable, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8).fillColor('white'),
            prepareRow: (row, indexColumn, indexRow, rectRow) => {
                doc.font("Helvetica").fontSize(7).fillColor('black');
                
                // Trik mewarnai teks badge (Tercapai = Hijau, Belum = Abu-abu)
                if (indexColumn === 4) { // Kolom 'Persentase/Status'
                    if (row.status === 'Tercapai') doc.fillColor('#27ae60').font('Helvetica-Bold');
                    else if (row.status === 'Belum Dinilai') doc.fillColor('#7f8c8d');
                    else doc.fillColor('#e74c3c');
                }
            },
            padding: 5, x: 30,
            divider: { header: { disabled: false }, horizontal: { disabled: false } }
        });

        // 🎨 Trik Mewarnai Header Tabel Detail jadi Biru Tua
        doc.save().rect(30, tableY, 535, 20).fill('#1565C0').restore();
        // Tulis ulang teks headernya karena tertimpa kotak biru
        doc.fillColor('white').font('Helvetica-Bold').fontSize(8);
        doc.text('Kode CPL', 30, tableY + 6, { width: 50, align: 'center' });
        doc.text('Deskripsi CPL', 80, tableY + 6, { width: 225, align: 'center' });
        doc.text('Target', 305, tableY + 6, { width: 40, align: 'center' });
        doc.text('Capaian', 345, tableY + 6, { width: 45, align: 'center' });
        doc.text('Persentase', 390, tableY + 6, { width: 75, align: 'center' });
        doc.text('Belum', 465, tableY + 6, { width: 50, align: 'center' });
        doc.text('Sudah', 515, tableY + 6, { width: 50, align: 'center' });

        // =========================================================
        // 5. FOOTER GARIS WARNA (Optional biar mirip banget)
        // =========================================================
        // Tambahkan blok kuning dan biru di paling bawah halaman jika ruang cukup
        doc.save().rect(0, 810, 450, 15).fill('#f39c12').restore(); // Kuning
        doc.save().rect(430, 810, 165, 15).fill('#1565C0').restore(); // Biru (numpuk dikit dibentuk miring fiktif)

        doc.end();
    } catch (error) {
        next(error);
    }
};
export const getLaporanCplPerMahasiswa = async (req, res, next) => {
    try {
        const filters = {
            tahunKurikulumId: req.query.tahunKurikulumId,
            prodiId: req.query.prodiId,
            angkatan: req.query.angkatan,
            metode: req.query.metode || 'rerata',
            useKop: req.query.kop || false
        };

        if (!filters.tahunKurikulumId || !filters.prodiId || !filters.angkatan) {
            return new ResponseBuilder(res).status('failure').code(400).message("Data tidak lengkap!").json();
        }

        const data = await MonitoringService.getLaporanCplPerMahasiswa(filters);
        return new ResponseBuilder(res).code(200).message("Data Laporan CPL per Mahasiswa berhasil diambil").json(data);
    } catch (error) { next(error); }
};
export const getLaporanCplPerMataKuliah = async (req, res, next) => {
    try {
        const filters = {
            tahunKurikulumId: req.query.tahunKurikulumId,
            prodiId: req.query.prodiId,
            angkatan: req.query.angkatan,
            metode: req.query.metode || 'rerata',
            useKop: req.query.kop || false
        };

        if (!filters.tahunKurikulumId || !filters.prodiId || !filters.angkatan) {
            return res.status(400).json({ 
                status: 'failure', 
                code: 400, 
                message: "Parameter tahunKurikulumId, prodiId, dan angkatan wajib diisi!" 
            });
        }

        // Memanggil service yang sudah kita buat sebelumnya
        const data = await MonitoringService.getLaporanCplPerMataKuliah(filters);
        
        return res.status(200).json({ 
            status: 'success', 
            code: 200, 
            message: "Data Laporan CPL per Mata Kuliah berhasil diambil", 
            data 
        });
    } catch (error) { 
        next(error); 
    }
};
export const getLaporanMkPerMahasiswa = async (req, res, next) => {
    try {
        const filters = {
            tahunKurikulumId: req.query.tahunKurikulumId,
            prodiId: req.query.prodiId,
            angkatan: req.query.angkatan,
            cpl: req.query.cpl, // Param dropdown CPL
            useKop: req.query.kop || false
        };

        if (!filters.tahunKurikulumId || !filters.prodiId || !filters.angkatan || !filters.cpl) {
            return res.status(400).json({ status: 'failure', code: 400, message: "Data tidak lengkap! (CPL wajib diisi)" });
        }

        const data = await MonitoringService.getLaporanMkPerMahasiswa(filters);
        return res.status(200).json({ status: 'success', code: 200, message: "Berhasil", data });
    } catch (error) { next(error); }
};
export const getTranskripObeMahasiswas = async (req, res, next) => {
    try {
        const filters = {
            tahunKurikulumId: req.query.tahunKurikulumId,
            prodiId: req.query.prodiId,
            mahasiswaId: req.query.mahasiswaId, // Wajib dikirim dari dropdown Nama Mahasiswa
            useKop: req.query.kop || false
        };

        if (!filters.mahasiswaId) return res.status(400).json({ status: 'failure', code: 400, message: "Mahasiswa wajib dipilih!" });

        const data = await MonitoringService.getTranskripObeMahasiswa(filters);
        return res.status(200).json({ status: 'success', code: 200, message: "Berhasil", data });
    } catch (error) { next(error); }
};
export const getLaporanCpmkPerMahasiswa = async (req, res, next) => {
    try {
        const filters = {
            tahunKurikulumId: req.query.tahunKurikulumId,
            prodiId: req.query.prodiId,
            mataKuliahId: req.query.mataKuliahId, // Filter Wajib
            angkatan: req.query.angkatan,
            useKop: req.query.kop || false
        };

        if (!filters.tahunKurikulumId || !filters.prodiId || !filters.mataKuliahId || !filters.angkatan) {
            return res.status(400).json({ status: 'failure', code: 400, message: "Parameter filter belum lengkap!" });
        }

        const data = await MonitoringService.getLaporanCpmkPerMahasiswa(filters);
        return res.status(200).json({ status: 'success', code: 200, message: "Berhasil", data });
    } catch (error) { next(error); }
};