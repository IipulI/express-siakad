import models from "../../models/index.js";
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