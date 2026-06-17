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

export const createProfilLulusan = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res)
    const obeId = req.params.obeId
    const body = req.body

    try {
        const promise = await obeService.createProfilLulusan(obeId, body)

        if (promise) {
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
export const createCapaianMataKuliah = async (req, res) => {
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



// export const getManajemenCapaian = async (req, res) => {
//     const responseBuilder = new ResponseBuilder(res);

//     // Tangkap query untuk filter dan paginasi
//     const { 
//         page = 1, 
//         size = 10, 
//         tahunKurikulumId, 
//         jenjangId, 
//         prodiId 
//     } = req.query;

//     const filter = {
//         tahunKurikulumId,
//         jenjangId,
//         prodiId
//     };

//     try {
//         const data = await obeService.getListManajemenCapaian(page, size, filter);

//         return responseBuilder
//             .code(200)
//             .message("Berhasil mengambil data Manajemen Capaian")
//             .json(data);

//     } catch (error) {
//         return responseBuilder
//             .status('failure')
//             .code(500)
//             .message(error.message || "Terjadi kesalahan internal")
//             .json();
//     }
// };



// Ambil list PL berdasarkan ID OBE

export const getManajemenCapaian = async (req, res, next) => {
    try {
        const filters = {
            page: req.query.page,
            limit: req.query.limit,
            tahunKurikulumId: req.query.tahunKurikulumId,
            prodiId: req.query.prodiId,
            jenjangId: req.query.jenjangId
        };

        const result = await obeService.getListManajemenCapaian(filters);

        // Pakai ResponseBuilder Abang
        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil mengambil data Manajemen Capaian")
            .json(result);

    } catch (error) {
        next(error);
    }
};


// export const getProfilLulusan = async (req, res) => {
//     try {
//         const { obeId } = req.params;
//         const result = await obeService.getManajemenPlByObeId(obeId);
//         return res.status(200).json({ status: 200, message: "Berhasil mengambil data PL", data: result });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message });
//     }
// };

// // Simpan PL Baru
// export const storeProfilLulusan = async (req, res) => {
//     try {
//         const result = await obeService.createProfilLulusan(req.body);
//         return res.status(201).json({ status: 201, message: "Berhasil menambah PL", data: result });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message });
//     }
// };

// // Update PL
// export const updateProfilLulusan = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const result = await obeService.updateProfilLulusan(id, req.body);
//         return res.status(200).json({ status: 200, message: "Berhasil update PL", data: result });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message });
//     }
// };

// // Hapus PL
// export const destroyProfilLulusan = async (req, res) => {
//     try {
//         const { id } = req.params;
//         await obeService.deleteProfilLulusan(id);
//         return res.status(200).json({ status: 200, message: "Berhasil menghapus PL" });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message });
//     }
// };
// GET List CPL



// 1. Ambil List PL berdasarkan ID OBE (Tanpa Pagination)
export const getProfilLulusan = async (req, res, next) => {
    try {
        const { obeId } = req.params;
        const result = await obeService.getManajemenPlByObeId(obeId);

        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil mengambil data PL")
            .json(result);
    } catch (error) { next(error); }
};

// 2. Simpan Data Baru
export const storeProfilLulusan = async (req, res, next) => {
    try {
        const result = await obeService.createProfilLulusan(req.body);
        return new ResponseBuilder(res)
            .code(201)
            .message("Berhasil menambah PL")
            .json(result);
    } catch (error) { next(error); }
};

// 3. Update Data
export const updateProfilLulusan = async (req, res, next) => {
    try {
        const result = await obeService.updateProfilLulusan(req.params.id, req.body);
        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil update PL")
            .json(result);
    } catch (error) { next(error); }
};

// 4. Hapus Data
export const destroyProfilLulusan = async (req, res, next) => {
    try {
        await obeService.deleteProfilLulusan(req.params.id);
        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil menghapus PL")
            .json();
    } catch (error) { next(error); }
};

export const getOpsiSalinPL = async (req, res, next) => {
    try {
        const result = await obeService.getOpsiSalinPL(req.params.obeId);
        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil mengambil opsi salin PL")
            .json(result);
    } catch (error) { next(error); }
};

export const salinDataPL = async (req, res, next) => {
    try {
        const { sumberObeId } = req.body;
        if (!sumberObeId)
            return new ResponseBuilder(res).code(400).message('sumberObeId wajib diisi').json();
        const result = await obeService.salinDataPL(req.params.obeId, sumberObeId);
        return new ResponseBuilder(res)
            .code(200)
            .message(`Berhasil menyalin ${result.jumlahDisalin} data PL`)
            .json(result);
    } catch (error) { next(error); }
};


// export const getCapaianPembelajaranLulusan = async (req, res) => {
//     try {
//         const { obeId } = req.params;
//         const result = await obeService.getManajemenCplByObeId(obeId);
//         return res.status(200).json({ status: 200, message: "Berhasil mengambil data CPL", data: result });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message });
//     }
// };

// // POST Create CPL
// export const createCapaianPembelajaranLulusan = async (req, res) => {
//     try {
//         const { obeId } = req.params;
//         const payload = { ...req.body, siakObeId: obeId };
//         const result = await obeService.createCpl(payload);
//         return res.status(201).json({ status: 201, message: "Berhasil menambah CPL", data: result });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message });
//     }
// };

// // PUT Update CPL (Sesuai typo rute: Pembelajaraan)
// export const updateCapaianPembelajaraanLulusan = async (req, res) => {
//     try {
//         const { cplId } = req.params;
//         const result = await obeService.updateCpl(cplId, req.body);
//         return res.status(200).json({ status: 200, message: "Berhasil update CPL", data: result });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message });
//     }
// };

// // DELETE CPL
// export const deleteCapaianPembelajaranLulusan = async (req, res) => {
//     try {
//         const { cplId } = req.params;
//         await obeService.deleteCpl(cplId);
//         return res.status(200).json({ status: 200, message: "Berhasil menghapus CPL" });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message });
//     }
// };


export const getCapaianPembelajaranLulusan = async (req, res, next) => {
    try {
        const { obeId } = req.params;
        const result = await obeService.getManajemenCplByObeId(obeId);

        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil mengambil data CPL")
            .json(result);
    } catch (error) { next(error); }
};

// 2. POST Simpan CPL Baru
export const createCapaianPembelajaranLulusan = async (req, res, next) => {
    try {
        const { obeId } = req.params;

        // Panggil service bulk yang baru
        const result = await obeService.createCplBulk(obeId, req.body);

        return new ResponseBuilder(res)
            .code(201)
            .message(`Berhasil menambah ${result.length} CPL`)
            .json(result);
    } catch (error) {
        next(error);
    }
};

// 3. PUT Update CPL
export const updateCapaianPembelajaraanLulusan = async (req, res, next) => {
    try {
        const { cplId } = req.params;
        const result = await obeService.updateCpl(cplId, req.body);

        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil update CPL")
            .json(result);
    } catch (error) { next(error); }
};

// 4. DELETE Hapus CPL
export const deleteCapaianPembelajaranLulusan = async (req, res, next) => {
    try {
        const { cplId } = req.params;
        await obeService.deleteCpl(cplId);

        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil menghapus CPL")
            .json();
    } catch (error) { next(error); }
};


// Tambah Indikator Kinerja
export const storeIndikatorKinerja = async (req, res, next) => {
    try {
        const result = await obeService.createIK(req.body);
        return new ResponseBuilder(res).code(201).message("Berhasil menambah Indikator").json(result);
    } catch (error) { next(error); }
};

// Update Indikator Kinerja
export const updateIndikatorKinerja = async (req, res, next) => {
    try {
        const result = await obeService.updateIK(req.params.id, req.body);
        return new ResponseBuilder(res).code(200).message("Berhasil update Indikator").json(result);
    } catch (error) { next(error); }
};

// Hapus Indikator Kinerja
export const destroyIndikatorKinerja = async (req, res, next) => {
    try {
        await obeService.deleteIK(req.params.id);
        return new ResponseBuilder(res).code(200).message("Berhasil menghapus Indikator").json();
    } catch (error) { next(error); }
};
// GET Matriks Pemetaan PL -> CPL
// export const getMatriksPemetaanPlCpl = async (req, res) => {
//     try {
//         const { obeId } = req.params;
//         const result = await obeService.getMatriksPemetaanPlCpl(obeId);
//         return res.status(200).json({ status: 200, message: "Berhasil mengambil matriks pemetaan", data: result });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message });
//     }
// };
export const getMatriksPemetaanPlCpl = async (req, res, next) => {
    try {
        const { obeId } = req.params;
        const result = await obeService.getMatriksPemetaanPlCpl(obeId);

        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil mengambil matriks pemetaan")
            .json(result);
    } catch (error) { next(error); }
};

// POST Simpan Matriks Pemetaan
// export const createPemetaanPlCpl = async (req, res) => {
//     try {
//         const { obeId } = req.params;
//         // req.body.pemetaan berisi array of object { plId, cplId, bobot }
//         await obeService.saveMatriksPemetaanPlCpl(obeId, req.body.pemetaan);
//         return res.status(200).json({ status: 200, message: "Berhasil menyimpan pemetaan PL ke CPL" });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message });
//     }
// };

export const createPemetaanPlCpl = async (req, res, next) => {
    try {
        const { obeId } = req.params;
        const { pemetaan } = req.body; // Isinya array: [{plId, cplId, bobot}, ...]

        // 1. Simpan pemetaan massal ke database
        await obeService.saveMatriksPemetaanPlCpl(obeId, pemetaan);
        
        // 2. Ambil ulang data matriks yang sudah di-update agar dikembalikan sebagai response
        const result = await obeService.getMatriksPemetaanPlCpl(obeId);

        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil menyimpan pemetaan PL ke CPL")
            .json(result);
    } catch (error) { next(error); }
};
// export const getMatriksPemetaanCplMk = async (req, res) => {
//     try {
//         const result = await obeService.getMatriksPemetaanCplMk(req.params.obeId);
//         return res.status(200).json({ status: 200, message: "Berhasil mengambil matriks CPL-MK", data: result });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message });
//     }
// };

// export const savePemetaanCplMk = async (req, res) => {
//     try {
//         await obeService.saveMatriksPemetaanCplMk(req.params.obeId, req.body.pemetaan);
//         return res.status(200).json({ status: 200, message: "Pemetaan CPL ke MK berhasil disimpan" });
//     } catch (error) {
//         return res.status(500).json({ status: 500, message: error.message });
//     }
// };
// 1. GET Matriks CPL -> MK
export const getMatriksPemetaanCplMk = async (req, res, next) => {
    try {
        const { obeId } = req.params;
        const result = await obeService.getMatriksPemetaanCplMk(obeId);

        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil mengambil matriks CPL-MK")
            .json(result);
    } catch (error) { next(error); }
};

// 2. POST Simpan Matriks CPL -> MK (Wipe & Replace)
export const savePemetaanCplMk = async (req, res, next) => {
    try {
        const { obeId } = req.params;
        const { pemetaan } = req.body; // Isinya array: [{mkId, cplId}, ...]

        // 1. Simpan pemetaan massal ke database
        await obeService.saveMatriksPemetaanCplMk(obeId, pemetaan);
        
        // 2. Ambil ulang data matriks yang sudah di-update agar dikembalikan sebagai response
        const result = await obeService.getMatriksPemetaanCplMk(obeId);

        return new ResponseBuilder(res)
            .code(200)
            .message("Pemetaan CPL ke MK berhasil disimpan")
            .json(result);
    } catch (error) { next(error); }
};
// =====================================================================
// CONTROLLER: CETAK LAPORAN OBE
// =====================================================================
export const getCetakLaporanObe = async (req, res, next) => {
    try {
        const { obeId } = req.params;
        const result = await obeService.getCetakLaporanObe(obeId);

        return new ResponseBuilder(res)
            .code(200)
            .message("Berhasil mengambil data Laporan OBE")
            .json(result);
    } catch (error) {
        next(error);
    }
};

export const updateTargetCpl = async (req, res, next) => {
    try {
        const { cplId } = req.params;
        const { targetCpl } = req.body;
        if (targetCpl === undefined || targetCpl === null || isNaN(parseFloat(targetCpl))) {
            return new ResponseBuilder(res).code(400).message('targetCpl harus berupa angka').json();
        }
        const result = await obeService.updateTargetCpl(cplId, targetCpl);
        return new ResponseBuilder(res).code(200).message('Target CPL berhasil diupdate').json(result);
    } catch (error) { next(error); }
};
