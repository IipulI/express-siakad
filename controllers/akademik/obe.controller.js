import * as obeService from "../../services/obe.service.js"
import ResponseBuilder from "../../utils/response.js";

// export const getProfilLulusan = async (req, res) => {
//     const responseBuilder =  new ResponseBuilder(res)
//     const obeId = req.params.obeId

//     try {
//         const data = await obeService.getProfilLulusan(obeId)

//         responseBuilder
//             .code(200)
//             .message("Berhasil mengambil data")
//             .json(data)
//     }
//     catch (error) {
//         responseBuilder
//             .status('failure')
//             .code(500)
//             .message("Gagal mengambil data")
//             .json(error.message)
//     }
// }

export const createProfilLulusan = async(req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    const obeId = req.params.obeId
    const body = req.body

    try {
        const promise = await obeService.createProfilLulusan(obeId, body)

        if(promise) {
            responseBuilder
                .code(200)
                .message("Berhasil menambah data")
                .json()
        } else {
            responseBuilder
                .status('failure')
                .code(500)
                .message("Gagal menambah data")
                .json(error.message)
        }
    }
    catch (error) {
        responseBuilder
            .status('failure')
            .code(500)
            .message("Gagal menambah data")
            .json(error.message)
    }
}

// export const updateProfilLulusan = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res)
//     const obeId = req.params.obeId
//     const plId = req.params.plId
//     const body = req.body

//     try {
//         const promise = await obeService.updateProfilLulusan(obeId, plId, body)

//         if(promise) {
//             responseBuilder
//                 .code(200)
//                 .message("Berhasil merubah data")
//                 .json()
//         } else {
//             responseBuilder
//                 .status('failure')
//                 .code(500)
//                 .message("Gagal merubah data")
//                 .json(error.message)
//         }
//     }
//     catch (error) {
//         responseBuilder
//             .status('failure')
//             .code(500)
//             .message("Gagal merubah data")
//             .json(error.message)
//     }
// }

export const deleteProfilLulusan = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    const obeId = req.params.obeId
    const plId = req.params.plId

    try {
        const promise = await obeService.deleteProfilLulusan(obeId, plId)

        if (promise) {
            responseBuilder
                .code(200)
                .message("Berhasil menghapus data")
                .json()
        } else {
            responseBuilder
                .status('failure')
                .code(500)
                .message("Gagal menghapus data")
                .json()
        }
    }
    catch (error) {
        responseBuilder
            .status('failure')
            .code(500)
            .message("Gagal menghapus data")
            .json(error.message)
    }
}


// export const getCapaianPembelajaranLulusan = async(req, res) => {
//     const responseBuilder = new ResponseBuilder(res)
//     const obeId = req.params.obeId

//     try {
//         const data = await obeService.getCapaianPembelajaranLulusan(obeId)

//         responseBuilder
//             .code(200)
//             .message("Berhasil mengambil data")
//             .json(data)
//     }
//     catch (error) {
//         responseBuilder
//             .status('failure')
//             .code(500)
//             .message("Gagal mengambil data")
//             .json(error.message)
//     }
// }

// export const createCapaianPembelajaranLulusan = async(req, res) => {
//     const responseBuilder = new ResponseBuilder(res)
//     const obeId = req.params.obeId;
//     const data = req.body;

//     try {
//         await obeService.createCapaianPembelajaranLulusan(obeId, data)

//         responseBuilder
//             .code(201)
//             .message("Berhasil menambahkan data profil lulusan")
//             .json()
//     }
//     catch (error){
//         responseBuilder
//             .status('failure')
//             .code(500)
//             .message("Gagal menambahkan data")
//             .json(error.message)
//     }
// }

// export const updateCapaianPembelajaraanLulusan = async(req, res) => {
//     const responseBuilder = new ResponseBuilder(res)
//     const obeId = req.params.obeId;
//     const cplId = req.params.cplId;
//     const data = req.body;

//     try {
//         const promise = await obeService.updateCapaianPembelajaraanLulusan(obeId, cplId, data)

//         if (promise) {
//             responseBuilder
//                 .code(200)
//                 .message("Berhasil merubah data")
//                 .json()
//         } else {
//             responseBuilder
//                 .code(500)
//                 .message("Gagal merubah data")
//                 .json()
//         }
//     }
//     catch (error){
//         responseBuilder
//             .status('failure')
//             .code(500)
//             .message("Gagal merubah data")
//             .json(error.message)
//     }
// }

// export const deleteCapaianPembelajaranLulusan = async(req, res) => {
//     const responseBuilder = new ResponseBuilder(res)
//     const obeId = req.params.obeId;
//     const cplId = req.params.cplId;

//     try {
//         const promise = await obeService.deleteCapaianPembelajaranLulusan(obeId, cplId)

//         if (promise) {
//             responseBuilder
//                 .code(200)
//                 .message("Berhasil menghapus data")
//                 .json()
//         } else {
//             responseBuilder
//                 .status('failure')
//                 .code(500)
//                 .message("Gagal menghapus data")
//                 .json()
//         }
//     }
//     catch (error) {
//         responseBuilder
//             .status('failure')
//             .code(500)
//             .message("Gagal menghapus data")
//             .json(error.message)
//     }
// }

// 

export const getCapaianMataKuliah = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const { obeId, mataKuliahId } = req.params; // Ambil parameter dari URL

    try {
        // Panggil service, jangan panggil model CapaianMataKuliah di sini
        const data = await obeService.getCapaianMataKuliah(obeId, mataKuliahId);

        return responseBuilder
            .status("success")
            .code(200)
            .message("Berhasil mengambil data CPMK")
            .json(data);
    } catch (error) {
        return responseBuilder
            .status("failure")
            .code(500)
            .message(error.message || "Terjadi kesalahan")
            .json();
    }
};
export const createCapaianMataKuliah = async(req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const { obeId, mataKuliahId } = req.params; // Lebih rapi pakai destructuring

    try {
        const result = await obeService.createCapaianMataKuliah(obeId, mataKuliahId, req.body);

        if (result) {
            return responseBuilder
                .code(201)
                .message("Berhasil menambahkan data capaian mata kuliah")
                .json(result); // <--- MASUKKAN VARIABEL 'result' KE SINI
        } else {
            return responseBuilder
                .status('failure')
                .code(500)
                .message("Gagal menambahkan data")
                .json();
        }
    }
    catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message("Terjadi kesalahan sistem")
            .json(error.message);
    }
}

export const updateCapaianMataKuliah = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    // Pastikan nama param di router sesuai (cpmkId)
    const { obeId, mataKuliahId, cpmkId } = req.params; 

    try {
        const result = await obeService.updateCapaianMataKuliah(obeId, mataKuliahId, cpmkId, req.body);

        if (result) {
            return responseBuilder
                .code(200)
                .message("Berhasil merubah data")
                .json(result); // Mengembalikan data hasil update
        } else {
            return responseBuilder
                .status('failure')
                .code(404)
                .message("Data tidak ditemukan atau tidak ada perubahan")
                .json();
        }
    }
    catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message("Gagal merubah data")
            .json(error.message);
    }
}

export const deleteCapaianMataKuliah = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const { obeId, cpmkId } = req.params;

    try {
        const success = await obeService.deleteCapaianMataKuliah(obeId, cpmkId);

        if (success) {
            return responseBuilder
                .code(200)
                .message("Berhasil menghapus data")
                .json();
        } else {
            return responseBuilder
                .status('failure')
                .code(400)
                .message("Gagal menghapus data")
                .json();
        }
    }
    catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message("Gagal menghapus data")
            .json(error.message);
    }
}
// Tambahkan fungsi ini di obe.controller.js

// export const createPemetaanPlCpl = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);
    
//     // Asumsi frontend mengirim ID CPL dan array mappingnya
//     const cplId = req.body.cplId; 
//     const dataPemetaan = req.body.dataPemetaan; 

//     try {
//         // Validasi total bobot wajib 100%
//         const totalBobot = dataPemetaan.reduce((sum, item) => sum + parseFloat(item.bobot), 0);
//         if (totalBobot !== 100) {
//             return responseBuilder
//                 .status('failure')
//                 .code(400)
//                 .message(`Total bobot pemetaan harus 100%. Saat ini: ${totalBobot}%`)
//                 .json();
//         }

//         await obeService.createPemetaanPlCpl(cplId, dataPemetaan);
        
//         responseBuilder
//             .code(201)
//             .message("Berhasil memetakan Profil Lulusan ke CPL beserta bobotnya")
//             .json();
//     } catch (error) {
//         responseBuilder
//             .status('failure')
//             .code(500)
//             .message("Gagal menyimpan pemetaan")
//             .json(error.message);
//     }
// }

export const getMatriksPemetaan = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    const { obeId, mataKuliahId } = req.params;

    try {
        const data = await obeService.getMatriksPemetaan(obeId, mataKuliahId);

        return responseBuilder
            .status("success")
            .code(200)
            .message("Berhasil mengambil matriks pemetaan CPMK-CPL")
            .json(data);
    } catch (error) {
        return responseBuilder
            .status("failure")
            .code(500)
            .message(error.message)
            .json();
    }
};
export const getManajemenCapaian = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);
    
    // Tangkap query untuk filter dan paginasi
    const { 
        page = 1, 
        size = 10, 
        tahunKurikulumId, 
        jenjangId, 
        prodiId 
    } = req.query;

    const filter = {
        tahunKurikulumId,
        jenjangId,
        prodiId
    };

    try {
        const data = await obeService.getListManajemenCapaian(page, size, filter);

        return responseBuilder
            .code(200)
            .message("Berhasil mengambil data Manajemen Capaian")
            .json(data);
            
    } catch (error) {
        return responseBuilder
            .status('failure')
            .code(500)
            .message(error.message || "Terjadi kesalahan internal")
            .json();
    }
};
// Ambil list PL berdasarkan ID OBE
export const getProfilLulusan = async (req, res) => {
    try {
        const { obeId } = req.params;
        const result = await obeService.getManajemenPlByObeId(obeId);
        return res.status(200).json({ status: 200, message: "Berhasil mengambil data PL", data: result });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
};

// Simpan PL Baru
export const storeProfilLulusan = async (req, res) => {
    try {
        const result = await obeService.createProfilLulusan(req.body);
        return res.status(201).json({ status: 201, message: "Berhasil menambah PL", data: result });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
};

// Update PL
export const updateProfilLulusan = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await obeService.updateProfilLulusan(id, req.body);
        return res.status(200).json({ status: 200, message: "Berhasil update PL", data: result });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
};

// Hapus PL
export const destroyProfilLulusan = async (req, res) => {
    try {
        const { id } = req.params;
        await obeService.deleteProfilLulusan(id);
        return res.status(200).json({ status: 200, message: "Berhasil menghapus PL" });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
};
// GET List CPL
export const getCapaianPembelajaranLulusan = async (req, res) => {
    try {
        const { obeId } = req.params;
        const result = await obeService.getManajemenCplByObeId(obeId);
        return res.status(200).json({ status: 200, message: "Berhasil mengambil data CPL", data: result });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
};

// POST Create CPL
export const createCapaianPembelajaranLulusan = async (req, res) => {
    try {
        const { obeId } = req.params;
        const payload = { ...req.body, siakObeId: obeId };
        const result = await obeService.createCpl(payload);
        return res.status(201).json({ status: 201, message: "Berhasil menambah CPL", data: result });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
};

// PUT Update CPL (Sesuai typo rute: Pembelajaraan)
export const updateCapaianPembelajaraanLulusan = async (req, res) => {
    try {
        const { cplId } = req.params;
        const result = await obeService.updateCpl(cplId, req.body);
        return res.status(200).json({ status: 200, message: "Berhasil update CPL", data: result });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
};

// DELETE CPL
export const deleteCapaianPembelajaranLulusan = async (req, res) => {
    try {
        const { cplId } = req.params;
        await obeService.deleteCpl(cplId);
        return res.status(200).json({ status: 200, message: "Berhasil menghapus CPL" });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
};

// GET Matriks Pemetaan PL -> CPL
export const getMatriksPemetaanPlCpl = async (req, res) => {
    try {
        const { obeId } = req.params;
        const result = await obeService.getMatriksPemetaanPlCpl(obeId);
        return res.status(200).json({ status: 200, message: "Berhasil mengambil matriks pemetaan", data: result });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
};

// POST Simpan Matriks Pemetaan
export const createPemetaanPlCpl = async (req, res) => {
    try {
        const { obeId } = req.params;
        // req.body.pemetaan berisi array of object { plId, cplId, bobot }
        await obeService.saveMatriksPemetaanPlCpl(obeId, req.body.pemetaan);
        return res.status(200).json({ status: 200, message: "Berhasil menyimpan pemetaan PL ke CPL" });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
};
export const getMatriksPemetaanCplMk = async (req, res) => {
    try {
        const result = await obeService.getMatriksPemetaanCplMk(req.params.obeId);
        return res.status(200).json({ status: 200, message: "Berhasil mengambil matriks CPL-MK", data: result });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
};

export const savePemetaanCplMk = async (req, res) => {
    try {
        await obeService.saveMatriksPemetaanCplMk(req.params.obeId, req.body.pemetaan);
        return res.status(200).json({ status: 200, message: "Pemetaan CPL ke MK berhasil disimpan" });
    } catch (error) {
        return res.status(500).json({ status: 500, message: error.message });
    }
};