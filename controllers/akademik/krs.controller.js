import ResponseBuilder from "../../utils/response.js";
import models from "../../models/index.js";

export const createKrs = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const { siak_mahasiswa_id, siak_periode_akademik_id, status, sks_diambil, semester, detail_kelas } = req.body;
    
    try {
        // 1. Buat Header KRS
        const krs = await models.KrsMahasiswa.create({
            siakMahasiswaId: siak_mahasiswa_id,
            siakPeriodeAkademikId: siak_periode_akademik_id,
            status: status || "Disetujui",
            sksDiambil: sks_diambil || 3,
            semester: semester || 1
        });

        // 2. Buat Rincian KRS (Memasukkan kelas-kelas ke dalam KRS ini)
        let rincianIds = [];
        if (detail_kelas && Array.isArray(detail_kelas)) {
            for (const kelas of detail_kelas) {
                // Mendukung format array of objects (rekomendasi baru) atau array of string (lama)
                const kelasId = typeof kelas === 'string' ? kelas : kelas.siakKelasKuliahId;
                const kategori = typeof kelas === 'string' ? "Wajib" : (kelas.kategori || "Wajib");

                const rincian = await models.RincianKrsMahasiswa.create({
                    siakKrsMahasiswaId: krs.id,
                    siakKelasKuliahId: kelasId,
                    status: "Disetujui",
                    kategori: kategori
                });
                rincianIds.push(rincian.id);
            }
        }

        return responseBuilder.code(201).message("KRS dan Rincian Kelas Berhasil Dibuat!").json({
            id_krs_header: krs.id,
            id_rincian_krs: rincianIds[0], // Ini yang sangat penting untuk input nilai!
            siak_mahasiswa_id: krs.siakMahasiswaId,
            status: krs.status
        });
    } catch (error) {
        return responseBuilder.status('failure').code(500).json(error.message);
    }
};
