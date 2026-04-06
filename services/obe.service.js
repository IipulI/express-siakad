import models from "../models/index.js"
import {Op, QueryTypes} from 'sequelize';

const {
    sequelize,
    Obe,
    CapaianMataKuliah,
    CapaianPembelajaranLulusan,
    PemetaanCplCpmk,
    PemetaanPlCpl,
    ProfilLulusan
} = models

export const getProfilLulusan = async (obeId) => {
    try {
        return await sequelize.transaction(async (trx) => {
            return ProfilLulusan.findAll({
                attributes: {
                    exclude: ['createdAt', 'updatedAt', 'deletedAt']
                },
                where: { siakObeId : obeId }
            })
        })
    }
    catch (error) {
        console.log(error)
        throw new Error(error)
    }
}

// export const createProfilLulusan = async (obeId, profilLulusanData) => {
//     try {
//         await sequelize.transaction(async (trx) => {
//             await _cekObe(obeId, trx)

//             await ProfilLulusan.create({
//                 siakObeId: obeId,
//                 kode: profilLulusanData.kode,
//                 profil: profilLulusanData.profil,
//                 profesi: profilLulusanData.profesi,
//                 deskripsi: profilLulusanData.deskripsi,
//             }, {
//                 transaction: trx
//             })
//         })

//         return true
//     }
//     catch (error) {
//         console.error(error)
//         throw new Error(error.message)
//     }
// }

// export const updateProfilLulusan = async (obeId, plId, profilLulusanData) => {
//     try {
//         await sequelize.transaction(async (trx) => {
//             await _cekObe(obeId, trx)

//             await _cekPl(plId, trx)

//             await ProfilLulusan.update(
//                 {
//                     kode: profilLulusanData.kode,
//                     profil: profilLulusanData.profil,
//                     profesi: profilLulusanData.profesi,
//                     deskripsi: profilLulusanData.deskripsi,
//                 },
//                 {
//                     where: { id: plId },
//                     transaction: trx
//                 }
//             )
//         })

//         return true
//     }
//     catch (error) {
//         console.error(error)
//         throw new Error(error.message)
//     }
// }

// export const deleteProfilLulusan = async (obeId, plId) => {
//     try {
//         await sequelize.transaction(async (trx) => {
//             await _cekObe(obeId, trx)
//             await _cekPl(plId, trx)

//             await PemetaanPlCpl.destroy({
//                 where: {
//                     siakProfilLulusanId : plId,
//                     transaction: trx
//                 }
//             })

//             await ProfilLulusan.destroy({
//                 where: {
//                     siakProfilLulusanId : plId,
//                     transaction: trx
//                 }
//             })
//         })

//         return true
//     }
//     catch (error) {
//         console.error(error)
//         throw new Error(error.message)
//     }
// }

export const getCapaianPembelajaranLulusan = async (obeId) => {
    try {
        return await sequelize.transaction(async (trx) => {
            const dataCplRaw = await CapaianPembelajaranLulusan.findAll({
                attributes: {
                    exclude : ['createdAt', 'updatedAt', 'deletedAt']
                },
                where: { siakObeId: obeId },
                include : {
                    attributes: [],
                    model: PemetaanPlCpl,
                    as: "pemetaanPlCpl",
                    include: {
                        attributes: [
                            'id', 'kode'
                        ],
                        model: ProfilLulusan,
                        as: "profilLulusan"
                    }
                },
                transaction: trx,
                raw:true,
            })

            // Mapping result json
            const groupedMap = {};
            for (const item of dataCplRaw) {
                const cplId = item.id;

                if (!groupedMap[cplId]) {
                    groupedMap[cplId] = {
                        id: item.id,
                        siakObeId: item.siakObeId,
                        kode: item.kode,
                        deskripsi: item.deskripsi,
                        kategori: item.kategori,
                        profilLulusan: [],
                    };
                }

                const profilId = item['pemetaanPlCpl.profilLulusan.id'];
                if (profilId) {
                    groupedMap[cplId].profilLulusan.push({
                        id: profilId,
                        kode: item['pemetaanPlCpl.profilLulusan.kode'],
                    });
                }
            }

            return Object.values(groupedMap);
        })
    }
    catch (error) {
        console.error(error)
        throw new Error(error.message)
    }
}

export const createCapaianPembelajaranLulusan = async (obeId, capaianPembelajaranLulusanData) => {
    try {
        await sequelize.transaction(async (trx) => {
            await _cekObe(obeId, trx)

            const cpl = await CapaianPembelajaranLulusan.create({
                siakObeId: obeId,
                kode: capaianPembelajaranLulusanData.kode,
                deskripsi: capaianPembelajaranLulusanData.deskripsi,
                kategori: capaianPembelajaranLulusanData.kategori
            }, {
                transaction: trx
            })

            const pemetaanCplPl = capaianPembelajaranLulusanData.profilLulusanIds.map(items => {
                return {
                    siakProfilLulusanId: items,
                    siakCapaianPembelajaranLulusanId: cpl.id
                }
            })

            await PemetaanPlCpl.bulkCreate(pemetaanCplPl, {
                transaction: trx
            })
        })

        return true
    }
    catch (error) {
        console.log(error)
        throw new Error(error)
    }
}

export const updateCapaianPembelajaraanLulusan = async (obeId, cplId, capaianPembelajaranLulusanData) => {
    try {
        const profilLulusanId = capaianPembelajaranLulusanData.profilLulusanIds;

        await sequelize.transaction(async (trx) => {
            // cek data obe apakah ada (query sql)
            await _cekObe(obeId, trx)

            await _cekCpl(cplId, trx)

            // --- MAIN QUERY ---
            // get data profil lulusan yang ada di pivot
            const existingProfilLulusan = await PemetaanPlCpl.findAll({
                attributes: [
                    'id',
                    'siakProfilLulusanId',
                    'deletedAt'
                ],
                where: { siakCapaianPembelajaranLulusanId: cplId },
                raw:true,
                paranoid: false,
                transaction: trx,
            })

            //  Get existing profil lulusan id for mapping
            const existingProfilLulusanMap = new Map();
            existingProfilLulusan.forEach(assoc => {
                existingProfilLulusanMap.set(assoc.siakProfilLulusanId, { isDeleted: !!assoc.deletedAt });
            });

            // preparasi untuk push promise
            const newProfilLulusanIdSet = new Set(profilLulusanId);
            const toInsert = [];
            const toRestore = [];
            const toDelete = [];
            const allIds = new Set([
                ...existingProfilLulusanMap.keys(),
                ...newProfilLulusanIdSet
            ]);

            // eksekusi logic untuk push promise
            for (const profilId of allIds) {
                const existInDatabase = existingProfilLulusanMap.has(profilId);
                const isInsertedId = newProfilLulusanIdSet.has(profilId);

                if (isInsertedId && !existInDatabase) {
                    // Id yang request tapi tidak ada di database
                    toInsert.push(profilId);
                } else if (isInsertedId && existInDatabase) {
                    // Id yang request dan ada di database, cek apakah Id nya sudah dihapus
                    if (existingProfilLulusanMap.get(profilId).isDeleted) {
                        toRestore.push(profilId);
                    }
                } else if (!isInsertedId && existInDatabase) {
                    // Id yang tidak ada di request tapi ada di database, dan cek apakah sudah dihapus
                    if (!existingProfilLulusanMap.get(profilId).isDeleted) {
                        toDelete.push(profilId);
                    }
                }
            }

            // Executing query
            const promises = [];
            if(toInsert.length > 0){
    const recordToCreate = toInsert.map(item => ({
        siakCapaianMataKuliahId: cpmkId,
        // SALAH: siakCapaianPembelajaranLulusan (Kurang 'Id')
        // BENAR: siakCapaianPembelajaranLulusanId 
        siakCapaianPembelajaranLulusanId: item, 
    }))

    promises.push(
        PemetaanCplCpmk.bulkCreate(recordToCreate, {transaction: trx})
    )
}
            if(toRestore.length > 0){
                promises.push(
                    PemetaanPlCpl.restore({
                        where: {
                            siakCapaianPembelajaranLulusanId: cplId,
                            siakProfilLulusanId: { [Op.in] : toRestore }
                        },
                        transaction: trx,
                    })
                )
            }
            if(toDelete.size > 0){
                promises.push(
                    PemetaanPlCpl.destroy({
                        where: {
                            siakCapaianPembelajaranLulusanId: cplId,
                            siakProfilLulusanId: { [Op.in] : [...toDelete] },
                        },
                        transaction: trx,
                    })
                )
            }

            await Promise.all(promises);
        })

        return true
    }
    catch (error) {
        console.error(error)
        throw new Error(error.message)
    }
}

export const deleteCapaianPembelajaranLulusan = async(obeId, plId) => {
    try {
        await sequelize.transaction(async (trx) => {
            await _cekObe(obeId, trx);
            await _cekPl(plId, trx);

            await PemetaanPlCpl.destroy({
                where: { siakCapaianPembelajaranLulusanId : plId },
                transaction: trx,
            })

            await PemetaanCplCpmk.destroy({
                where: { siakCapaianPembelajaranLulusanId : plId },
                transaction: trx,
            })

            await CapaianPembelajaranLulusan.destroy({
                where: { id: plId },
                transaction: trx,
            })
        })

        return true
    }
    catch (error) {
        console.error(error)
        throw new Error(error.message)
    }
}

export const getCapaianMataKuliah = async (obeId, mataKuliahId) => {
    try {
        const data = await CapaianMataKuliah.findAll({
            where: {
                siakObeId: obeId,
                siakMataKuliahId: mataKuliahId
            },
            include: [
                {
                    model: PemetaanCplCpmk,
                    as: 'pemetaanCplCpmk', // Tadi sudah kita benerin ini
                    include: [
                        {
                            // PERBAIKAN: Ganti 'cpl' menjadi 'capaianPembelajaranLulusan'
                            model: CapaianPembelajaranLulusan,
                            as: 'capaianPembelajaranLulusan', // <--- GANTI INI SESUAI ERROR
                            attributes: ['id', 'kode'] 
                        }
                    ]
                }
            ],
            order: [['kode', 'ASC']]
        });

        return data;
    } catch (error) {
        throw new Error("Gagal mengambil data CPMK: " + error.message);
    }
}
export const createCapaianMataKuliah = async (obeId, mataKuliahId, capaianMataKuliahData) => {
    try {
        return await sequelize.transaction(async (trx) => {
            await _cekObe(obeId, trx);
            await _cekMK(mataKuliahId, trx);

            // 1. Insert ke tabel siak_capaian_mata_kuliah
            const cpmk = await CapaianMataKuliah.create({
                siakObeId: obeId,
                siakMataKuliahId: mataKuliahId,
                kode: capaianMataKuliahData.kode,
                deskripsi: capaianMataKuliahData.deskripsi,
            }, { transaction: trx });

            // 2. Ambil list ID CPL dari body (Frontend/Postman)
            const listCpl = capaianMataKuliahData.capaianPembelajaranLulusanIds || [];

            if (listCpl.length > 0) {
                const pemetaan = listCpl.map(idCpl => ({
                    siakCapaianMataKuliahId: cpmk.id, // ID CPMK yang baru dibuat
                    siakCapaianPembelajaranLulusanId: idCpl // ID CPL dari Postman
                }));
                
                // 3. Insert ke tabel pivot siak_pemetaan_cpl_cpmk
                await PemetaanCplCpmk.bulkCreate(pemetaan, { transaction: trx });
            }
            return cpmk;
        });
    } catch(error) {
        throw new Error(error.message);
    }
}
export const updateCapaianMataKuliah = async (obeId, mataKuliahId, cpmkId, capaianMataKuliahData) => {
    try {
        const capaianPembelajaranLulusanId = capaianMataKuliahData.capaianPembelajaranLulusanIds || [];

        await sequelize.transaction(async (trx) => {
            await _cekObe(obeId, trx);
            await _cekMK(mataKuliahId, trx);
            await _cekCpmk(cpmkId, trx);

            // 1. Update data utama CPMK
            await CapaianMataKuliah.update({
                kode: capaianMataKuliahData.kode,
                deskripsi: capaianMataKuliahData.deskripsi
            }, { where: { id: cpmkId }, transaction: trx });

            // 2. Logic Sinkronisasi Pivot (Insert, Restore, Delete)
            const existingCpl = await PemetaanCplCpmk.findAll({
                where: { siakCapaianMataKuliahId : cpmkId },
                raw: true,
                paranoid: false,
                transaction: trx,
            });

            const existingCplMap = new Map();
            existingCpl.forEach(item => {
                existingCplMap.set(item.siakCapaianPembelajaranLulusanId, { isDeleted: !!item.deletedAt });
            });

            const newCplIdSet = new Set(capaianPembelajaranLulusanId);
            const toInsert = [];
            const toRestore = [];
            const toDelete = [];
            const allIds = new Set([...existingCplMap.keys(), ...newCplIdSet]);

            for(const cplId of allIds) {
                const existInDatabase = existingCplMap.has(cplId);
                const isInsertedId = newCplIdSet.has(cplId);

                if(isInsertedId && !existInDatabase) toInsert.push(cplId);
                else if (isInsertedId && existInDatabase && existingCplMap.get(cplId).isDeleted) toRestore.push(cplId);
                else if (!isInsertedId && existInDatabase && !existingCplMap.get(cplId).isDeleted) toDelete.push(cplId);
            }

            const promises = [];
            if(toInsert.length > 0){
                promises.push(PemetaanCplCpmk.bulkCreate(toInsert.map(id => ({
                    siakCapaianMataKuliahId: cpmkId,
                    siakCapaianPembelajaranLulusanId: id
                })), {transaction: trx}));
            }
            if(toRestore.length > 0){
                promises.push(PemetaanCplCpmk.restore({
                    where: {
                        siakCapaianMataKuliahId: cpmkId,
                        siakCapaianPembelajaranLulusanId: { [Op.in] : toRestore}
                    },
                    transaction: trx
                }));
            }
            if(toDelete.length > 0){
                promises.push(PemetaanCplCpmk.destroy({
                    where: {
                        siakCapaianMataKuliahId: cpmkId,
                        siakCapaianPembelajaranLulusanId: { [Op.in] : toDelete}
                    },
                    transaction: trx
                }));
            }
            await Promise.all(promises);
        });

        // Ambil data terbaru untuk dikembalikan ke Controller
        return await CapaianMataKuliah.findByPk(cpmkId, {
            include: [{ model: PemetaanCplCpmk, as: 'pemetaanCplCpmk' }]
        });
    } catch(error) {
        throw new Error(error.message);
    }
}

export const deleteCapaianMataKuliah = async (obeId, cpmkId) => {
    try {
        await sequelize.transaction(async (trx) => {
            await _cekObe(obeId, trx);
            await _cekCpmk(cpmkId, trx);

            // Hapus pivot dulu (Soft Delete)
            await PemetaanCplCpmk.destroy({
                where: { siakCapaianMataKuliahId: cpmkId },
                transaction: trx
            });

            // Hapus data CPMK (Soft Delete)
            await CapaianMataKuliah.destroy({
                where : { id: cpmkId },
                transaction: trx,
            });
        });
        return true;
    }
    catch (error) {
        throw new Error(error.message);
    }
}

const _cekObe = async (obeId, trx) => {
    // cek data obe apakah ada (query sql)
    const [obe] = await sequelize.query(
        "SELECT EXISTS(SELECT 1 FROM siak_obe WHERE id = :obeId) AS exist",
        {
            replacements: { obeId },
            type: QueryTypes.SELECT,
            transaction: trx
        }
    ).then(obe => obe.map(item => {return item.exist} ))
    if (!obe){
        throw new Error("Obe tidak dapat ditemukan")
    }
}

const _cekPl = async (plId, trx) => {
    // cek data PL apakah ada (query sql)
    const [pl] = await sequelize.query(
        "SELECT EXISTS(SELECT 1 FROM siak_profil_lulusan WHERE id = :plId) AS exist",
        {
            replacements: { plId },
            type: QueryTypes.SELECT,
            transaction: trx
        }
    ).then(pl => pl.map(item => {return item.exist} ))
    if (!pl) {
        throw new Error("Profil Lulusan tidak dapat ditemukan")
    }
}

const _cekCpl = async (cplId, trx) => {
    // cek data CPL apakah ada (query sql)
    const [cpl] = await sequelize.query(
        "SELECT EXISTS(SELECT 1 FROM siak_capaian_pembelajaran_lulusan WHERE id = : cplId) AS exist",
        {
            replacements: { cplId },
            type: QueryTypes.SELECT,
            transaction: trx
        }
    ).then(cpl => cpl.map(item => {return item.exists} ))
    if(!cpl) {
        throw new Error("Capaian Pembelajaran Lulusan tidak dapat ditemukan")
    }
}


const _cekCpmk = async (cpmkId, trx) => {
    // cek data CMPK apakah ada (query sql)
    const [cpmk] = await sequelize.query(
        "SELECT EXISTS(SELECT 1 FROM siak_capaian_mata_kuliah WHERE id = :cpmkId) AS exist",
        {
            replacements: { cpmkId },
            type: QueryTypes.SELECT,
            transaction: trx
        }
    ).then(cpmk => cpmk.map(item => {return item.exist} ))
    if (!cpmk){
        throw new Error("Capaian Mata Kuliah tidak dapat ditemukan")
    }
}

const _cekMK = async (mataKuliahId, trx) => {
    // check data mata kuliah apakah ada (sql)
    const [mataKuliah] = await sequelize.query(
        "SELECT EXISTS(SELECT 1 FROM siak_mata_Kuliah WHERE id = :mataKuliahId) AS exist",
        {
            replacements: { mataKuliahId },
            type: QueryTypes.SELECT,
            transaction: trx
        }
    ).then(mataKuliah => mataKuliah.map(item => {return item.exist} ))
    if(!mataKuliah){
        throw new Error("Mata Kuliah tidak dapat ditemukan")
    }
}
// Tambahkan fungsi ini di obe.service.js
export const createPemetaanPlCpl = async (cplId, dataPemetaan) => {
    /* Format dataPemetaan dari frontend:
       [
         { siakProfilLulusanId: "uuid-pl01", bobot: 50.00 },
         { siakProfilLulusanId: "uuid-pl02", bobot: 50.00 }
       ]
    */
    try {
        await sequelize.transaction(async (trx) => {
            // Hapus mapping lama untuk CPL ini agar bersih saat update
            await PemetaanPlCpl.destroy({
                where: { siakCapaianPembelajaranLulusanId: cplId },
                transaction: trx
            });

            // Siapkan payload baru dengan relasi ke CPL ID
            const payload = dataPemetaan.map(item => ({
                siakCapaianPembelajaranLulusanId: cplId,
                siakProfilLulusanId: item.siakProfilLulusanId,
                bobot: item.bobot // Pastikan kolom bobot sudah di-add di database sebelumnya
            }));

            // Insert massal
            await PemetaanPlCpl.bulkCreate(payload, { transaction: trx });
        });
        return true;
    } catch (error) {
        throw new Error("Gagal menyimpan pemetaan PL ke CPL: " + error.message);
    }
}


export const getMatriksPemetaan = async (obeId, mataKuliahId) => {
    try {
        // 1. Ambil semua CPL untuk OBE ini (Kolom Tabel)
        const daftarCpl = await CapaianPembelajaranLulusan.findAll({
            where: { siakObeId: obeId },
            attributes: ['id', 'kode'],
            order: [['kode', 'ASC']]
        });

        // 2. Ambil semua CPMK untuk Mata Kuliah ini (Baris Tabel)
        const daftarCpmk = await CapaianMataKuliah.findAll({
            where: { siakObeId: obeId, siakMataKuliahId: mataKuliahId },
            attributes: ['id', 'kode', 'deskripsi'],
            include: [{
                model: PemetaanCplCpmk,
                as: 'pemetaanCplCpmk',
                attributes: ['siakCapaianPembelajaranLulusanId']
            }],
            order: [['kode', 'ASC']]
        });

        // 3. Format data untuk Frontend (Matrix Mapping)
        const matriks = daftarCpmk.map(cpmk => {
            // Ambil semua ID CPL yang terhubung dengan CPMK ini
            const cplTerhubung = cpmk.pemetaanCplCpmk.map(p => p.siakCapaianPembelajaranLulusanId);

            return {
                id: cpmk.id,
                kode: cpmk.kode,
                deskripsi: cpmk.deskripsi,
                // Buat array status mapping sesuai urutan daftarCpl
                mapping: daftarCpl.map(cpl => ({
                    cplId: cpl.id,
                    isMapped: cplTerhubung.includes(cpl.id)
                }))
            };
        });

        return {
            columns: daftarCpl, // Header: CPL-01, CPL-02...
            rows: matriks       // Data: CPMK-01 [true, false, true...]
        };
    } catch (error) {
        throw new Error("Gagal menyusun matriks: " + error.message);
    }
};
// Di dalam Controller/Service
export const getDropdownFilter = async (req, res) => {
    try {
        const [tahunKurikulum, jenjang, programStudi] = await Promise.all([
            models.TahunKurikulum.findAll({ attributes: ['id', 'tahun'], order: [['tahun', 'DESC']] }),
            models.Jenjang.findAll({ attributes: ['id', 'nama'] }),
            models.ProgramStudi.findAll({ attributes: ['id', 'nama', 'kode'] })
        ]);

        res.json({ status: 200, data: { tahunKurikulum, jenjang, programStudi } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


export const getListManajemenCapaian = async (page = 1, size = 10, filter = {}) => {
    // 1. Tambahkan Dosen di pemanggilan models
    const { Obe, TahunKurikulum, ProgramStudi, ProfilLulusan, CapaianPembelajaranLulusan, PemetaanPlCpl, PemetaanCplCpmk, Dosen } = models;
    
    const limit = parseInt(size);
    const offset = (parseInt(page) - 1) * limit;

    const whereObe = {};
    if (filter.tahunKurikulumId) whereObe.siakTahunKurikulumId = filter.tahunKurikulumId;
    if (filter.prodiId) whereObe.siakProgramStudiId = filter.prodiId;

    try {
        const { count, rows } = await Obe.findAndCountAll({
            where: whereObe,
            include: [
                { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['id', 'tahun'] },
                // 👇 FIX 1: Gunakan nama asli database yaitu kaprodi_id 👇
                { model: ProgramStudi, as: 'programStudi', attributes: ['id', 'nama', 'kode', 'kaprodi_id'] }
            ],
            limit,
            offset,
            order: [['createdAt', 'DESC']]
        });

        if (rows.length === 0) {
            return { totalData: 0, totalPages: 0, currentPage: parseInt(page), data: [] };
        }

        const obeIds = rows.map(r => r.id);

        const allPL = await ProfilLulusan.findAll({
            where: { siakObeId: { [models.Sequelize.Op.in]: obeIds } },
            attributes: ['id', 'siakObeId'],
            raw: true
        });
        const allCPL = await CapaianPembelajaranLulusan.findAll({
            where: { siakObeId: { [models.Sequelize.Op.in]: obeIds } },
            attributes: ['id', 'siakObeId'],
            raw: true
        });

        const plIds = allPL.map(pl => pl.id);
        const cplIds = allCPL.map(cpl => cpl.id);

        const mappedPL = plIds.length > 0 ? await PemetaanPlCpl.findAll({
            where: { siakProfilLulusanId: { [models.Sequelize.Op.in]: plIds } },
            attributes: ['siakProfilLulusanId'],
            raw: true
        }) : [];

        const mappedCPL = cplIds.length > 0 ? await PemetaanCplCpmk.findAll({
            where: { siakCapaianPembelajaranLulusanId: { [models.Sequelize.Op.in]: cplIds } },
            attributes: ['siakCapaianPembelajaranLulusanId'],
            raw: true
        }) : [];

        const mappedPLSet = new Set(mappedPL.map(m => m.siakProfilLulusanId));
        const mappedCPLSet = new Set(mappedCPL.map(m => m.siakCapaianPembelajaranLulusanId));

    const kaprodiIds = rows.map(r => {
            const prodi = r.programStudi;
            if (!prodi) return null;
            
            // Tarik paksa pakai method resmi Sequelize
            const kId = prodi.getDataValue('kaprodi_id') || prodi.getDataValue('kaprodiId') || prodi.kaprodi_id;
            return kId;
        }).filter(id => id != null);
        
        console.log("KAPRODI IDS YANG KETANGKAP: ", kaprodiIds); 
        
        const dataKaprodi = kaprodiIds.length > 0 ? await Dosen.findAll({
            where: { id: { [models.Sequelize.Op.in]: kaprodiIds } },
            attributes: ['id', 'nama', 'nidn'],
            raw: true
        }) : [];

       // 4. Rakit datanya
        const dataBerhitung = rows.map(obe => {
            const obePLs = allPL.filter(pl => pl.siakObeId === obe.id);
            const obeCPLs = allCPL.filter(cpl => cpl.siakObeId === obe.id);

            const totalPL = obePLs.length;
            const totalCPL = obeCPLs.length;

            const plTerpetakan = obePLs.filter(pl => mappedPLSet.has(pl.id)).length;
            const cplTerpetakan = obeCPLs.filter(cpl => mappedCPLSet.has(cpl.id)).length;

            // 👇 FIX 3: Cocokkan ID Kaprodi 👇
            const prodi = obe.programStudi;
            const kaprodiId = prodi ? (prodi.kaprodi_id || prodi.kaprodiId || (prodi.dataValues && prodi.dataValues.kaprodi_id)) : null;
            
            const kaprodi = dataKaprodi.find(d => d.id === kaprodiId);
            const namaKaprodi = kaprodi ? kaprodi.nama : "-";

            return {
                idObe: obe.id,
                kurikulum: obe.tahunKurikulum?.tahun || '-',
                programStudi: `S1 - ${obe.programStudi?.nama || '-'}`,
                ketuaProgramStudi: namaKaprodi, // <--- Harusnya nama dosennya masuk sini
                statusPengisian: {
                    pl: totalPL,
                    cpl: totalCPL,
                    persentasePlCpl: totalPL > 0 ? Math.round((plTerpetakan / totalPL) * 100) : 0,
                    persentaseCplMk: totalCPL > 0 ? Math.round((cplTerpetakan / totalCPL) * 100) : 0
                }
            };
        });
        return {
            totalData: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            data: dataBerhitung
        };

    } catch (error) {
        console.error("Error di getListManajemenCapaian:", error);
        throw new Error("Gagal mengambil data Manajemen Capaian: " + error.message);
    }
};
export const getDetailManajemenPl = async (obeId) => {
    const { Obe, ProgramStudi, TahunKurikulum, ProfilLulusan } = models;

    try {
        const data = await Obe.findOne({
            where: { id: obeId },
            include: [
                { 
                    model: ProgramStudi, 
                    as: 'programStudi', 
                    attributes: ['id', 'nama', 'kode'] 
                },
                { 
                    model: TahunKurikulum, 
                    as: 'tahunKurikulum', 
                    attributes: ['id', 'tahun'] 
                },
                { 
                    model: ProfilLulusan, 
                    as: 'profilLulusan', // Pastikan alias ini sesuai di models/index.js
                    attributes: ['id', 'kode', 'profil', 'profesi', 'deskripsi'],
                    where: { deletedAt: null },
                    required: false // Agar kalau PL masih kosong, header Prodi tetap muncul
                }
            ],
            order: [[ { model: ProfilLulusan, as: 'profilLulusan' }, 'kode', 'ASC']]
        });

        if (!data) {
            throw new Error("Data Manajemen PL tidak ditemukan");
        }

        // Format hasil agar enak dibaca Frontend
        return {
            header: {
                idObe: data.id,
                kodeProdi: data.programStudi?.kode || '-',
                namaProdi: `S1 - ${data.programStudi?.nama || '-'}`,
                tahunKurikulum: data.tahunKurikulum?.tahun || '-'
            },
            dataPl: data.profilLulusan || []
        };

    } catch (error) {
        console.error("Error di getDetailManajemenPl:", error);
        throw error;
    }
};
// --- 1. Ambil Detail Header (Prodi/Tahun) + List PL ---
export const getManajemenPlByObeId = async (obeId) => {
    const { Obe, ProgramStudi, TahunKurikulum, ProfilLulusan } = models;

    try {
        const data = await Obe.findOne({
            where: { id: obeId },
            include: [
                { model: ProgramStudi, as: 'programStudi', attributes: ['kode', 'nama'] },
                { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] },
                { 
                    model: ProfilLulusan, 
                    as: 'profilLulusan', 
                    attributes: [
                        'id', 
                        'kode',      // 1. Kode PL
                        'profil',    // 2. Profil Lulusan
                        'deskripsi', // 3. Deskripsi Profil Lulusan (Pindah ke atas)
                        'profesi'    // 4. Profesi Lulusan (Jadi terakhir)
                    ] 
                }
            ],
            // Urutkan berdasarkan kode PL (PL01, PL02, dst)
            order: [[{ model: ProfilLulusan, as: 'profilLulusan' }, 'kode', 'ASC']]
        });

        if (!data) throw new Error("Data OBE tidak ditemukan");

        return {
            header: {
                kodeProdi: data.programStudi?.kode,
                namaProdi: `S1 - ${data.programStudi?.nama}`,
                tahunKurikulum: data.tahunKurikulum?.tahun
            },
            dataPl: data.profilLulusan || []
        };
    } catch (error) {
        console.error("Error di getManajemenPlByObeId:", error);
        throw error;
    }
};

// --- 2. Tambah Profil Lulusan Baru ---
export const createProfilLulusan = async (payload) => {
    const { ProfilLulusan } = models;
    try {
        // payload berisi: siakObeId, kode, profil, profesi, deskripsi
        const newPl = await ProfilLulusan.create(payload);
        return newPl;
    } catch (error) {
        throw error;
    }
};

// --- 3. Update Profil Lulusan ---
export const updateProfilLulusan = async (id, payload) => {
    const { ProfilLulusan } = models;
    try {
        const data = await ProfilLulusan.findByPk(id);
        if (!data) throw new Error("Data PL tidak ditemukan");
        
        await data.update(payload);
        return data;
    } catch (error) {
        throw error;
    }
};

// --- 4. Hapus Profil Lulusan (Soft Delete) ---
export const deleteProfilLulusan = async (id) => {
    const { ProfilLulusan } = models;
    try {
        const data = await ProfilLulusan.findByPk(id);
        if (!data) throw new Error("Data PL tidak ditemukan");
        
        await data.destroy(); // Ini akan menjalankan paranoid (deleted_at)
        return true;
    } catch (error) {
        throw error;
    }
};

// --- GET LIST CPL ---
export const getManajemenCplByObeId = async (obeId) => {
    const { Obe, ProgramStudi, TahunKurikulum, CapaianPembelajaranLulusan } = models;
    try {
        const data = await Obe.findOne({
            where: { id: obeId },
            include: [
                { model: ProgramStudi, as: 'programStudi', attributes: ['kode', 'nama'] },
                { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] },
                { 
                    model: CapaianPembelajaranLulusan, 
                    as: 'capaianPembelajaranLulusan', 
                    // 👇 UPDATE DI SINI: Tambahkan deskripsiEn dan targetCpl 👇
                    attributes: [
                        'id', 
                        'kode', 
                        'deskripsi', 
                        'deskripsiEn', 
                        'targetCpl', 
                        'kategori'
                    ] 
                }
            ],
            // Urutkan berdasarkan Kode (CPL01, CPL02, dst)
            order: [[{ model: CapaianPembelajaranLulusan, as: 'capaianPembelajaranLulusan' }, 'kode', 'ASC']]
        });

        if (!data) throw new Error("Data OBE tidak ditemukan");

        return {
            header: {
                kodeProdi: data.programStudi?.kode,
                namaProdi: `S1 - ${data.programStudi?.nama}`,
                tahunKurikulum: data.tahunKurikulum?.tahun
            },
            dataCpl: data.capaianPembelajaranLulusan || []
        };
    } catch (error) {
        throw error;
    }
};

// --- CREATE CPL ---
export const createCpl = async (payload) => {
    const { CapaianPembelajaranLulusan } = models;
    return await CapaianPembelajaranLulusan.create(payload);
};

// --- UPDATE CPL ---
export const updateCpl = async (id, payload) => {
    const { CapaianPembelajaranLulusan } = models;
    const data = await CapaianPembelajaranLulusan.findByPk(id);
    if (!data) throw new Error("Data CPL tidak ditemukan");
    return await data.update(payload);
};

// --- DELETE CPL ---
export const deleteCpl = async (id) => {
    const { CapaianPembelajaranLulusan } = models;
    const data = await CapaianPembelajaranLulusan.findByPk(id);
    if (!data) throw new Error("Data CPL tidak ditemukan");
    return await data.destroy();
};
// --- GET MATRIKS PL -> CPL ---
export const getMatriksPemetaanPlCpl = async (obeId) => {
    const { Obe, ProgramStudi, TahunKurikulum, ProfilLulusan, CapaianPembelajaranLulusan, PemetaanPlCpl } = models;

    // 1. Tarik Data OBE beserta anak-anaknya (PL dan CPL)
    const obeData = await Obe.findOne({
        where: { id: obeId },
        include: [
            { model: ProgramStudi, as: 'programStudi', attributes: ['kode', 'nama'] },
            { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] },
            { model: ProfilLulusan, as: 'profilLulusan', attributes: ['id', 'kode', 'profil'] },
            { model: CapaianPembelajaranLulusan, as: 'capaianPembelajaranLulusan', attributes: ['id', 'kode'] }
        ],
        order: [
            [{ model: ProfilLulusan, as: 'profilLulusan' }, 'kode', 'ASC'],
            [{ model: CapaianPembelajaranLulusan, as: 'capaianPembelajaranLulusan' }, 'kode', 'ASC']
        ]
    });

    if (!obeData) throw new Error("Data OBE tidak ditemukan");

    // 2. Ambil ID PL untuk mencari data pemetaannya
    const plIds = obeData.profilLulusan.map(pl => pl.id);

    // 3. Tarik data bobot pemetaan dari tabel penghubung
    const pemetaan = await PemetaanPlCpl.findAll({
        where: { siakProfilLulusanId: plIds },
        attributes: ['siakProfilLulusanId', 'siakCapaianPembelajaranLulusanId', 'bobot']
    });

    return {
        header: {
            kodeProdi: obeData.programStudi?.kode,
            namaProdi: `S1 - ${obeData.programStudi?.nama}`,
            tahunKurikulum: obeData.tahunKurikulum?.tahun
        },
        daftarPl: obeData.profilLulusan,
        daftarCpl: obeData.capaianPembelajaranLulusan,
        // Format ulang biar enak dibaca Frontend
        dataPemetaan: pemetaan.map(p => ({
            plId: p.siakProfilLulusanId,
            cplId: p.siakCapaianPembelajaranLulusanId,
            bobot: p.bobot
        }))
    };
};

// --- POST SIMPAN MATRIKS (BULK SAVE) ---
// --- POST SIMPAN MATRIKS (BULK SAVE) DENGAN VALIDASI 100 ---
export const saveMatriksPemetaanPlCpl = async (obeId, dataPemetaan) => {
    const { ProfilLulusan, PemetaanPlCpl, sequelize } = models;
    
    // Kita pakai Transaction biar kalau gagal, datanya rollback aman
    const transaction = await sequelize.transaction();

    try {
        // 1. Cari semua PL milik OBE ini
        const pls = await ProfilLulusan.findAll({ where: { siakObeId: obeId }, attributes: ['id', 'kode'] });
        const plIds = pls.map(pl => pl.id);
        
        // Bikin kamus kode PL buat dimunculin di pesan error biar enak dibaca
        const kamusPl = {};
        pls.forEach(pl => kamusPl[pl.id] = pl.kode);

        // 2. Filter data dari Frontend, buang yang bobotnya 0/kosong
        const payload = dataPemetaan
            .filter(item => item.bobot > 0)
            .map(item => ({
                siakProfilLulusanId: item.plId,
                siakCapaianPembelajaranLulusanId: item.cplId,
                bobot: parseFloat(item.bobot)
            }));

        // 3. 🚨 VALIDASI KRUSIAL: CEK TOTAL BOBOT PER PL HARUS 100 🚨
        const akumulasiBobot = {};
        payload.forEach(item => {
            if (!akumulasiBobot[item.siakProfilLulusanId]) {
                akumulasiBobot[item.siakProfilLulusanId] = 0;
            }
            akumulasiBobot[item.siakProfilLulusanId] += item.bobot;
        });

        // Looping untuk ngecek satu-satu hasil penjumlahannya
        for (const plId in akumulasiBobot) {
            // Kita pakai Math.round untuk menghindari error desimal Javascript 
            // (Misal: 16.66 + 16.66 + ... hasilnya kadang 99.999998)
            const total = Math.round(akumulasiBobot[plId]); 
            
            if (total !== 100) {
                const kodePl = kamusPl[plId] || "PL Tidak Dikenal";
                throw new Error(`Total bobot untuk ${kodePl} tidak valid. Total yang dikirim: ${akumulasiBobot[plId]}. Total wajib 100.`);
            }
        }

        // 4. Hapus bersih semua pemetaan lama milik OBE ini (Reset)
        if (plIds.length > 0) {
            await PemetaanPlCpl.destroy({ where: { siakProfilLulusanId: plIds }, force: true, transaction });
        }

        // 5. Simpan massal (Bulk Insert)
        if (payload.length > 0) {
            await PemetaanPlCpl.bulkCreate(payload, { transaction });
        }

        await transaction.commit();
        return true;
    } catch (error) {
        await transaction.rollback();
        // Lempar error ke Controller biar dimunculin sebagai response 500
        throw new Error(error.message); 
    }
};
// GET Matriks CPL -> MK
export const getMatriksPemetaanCplMk = async (obeId) => {
    const { Obe, ProgramStudi, TahunKurikulum, CapaianPembelajaranLulusan, MataKuliah, PemetaanCplMk } = models;

    // Safety Check: Jika model tidak terload
    if (!Obe || !CapaianPembelajaranLulusan || !MataKuliah || !PemetaanCplMk) {
        throw new Error("Salah satu model (Obe/CPL/MK/Pemetaan) tidak terdefinisi. Cek models/index.js!");
    }

    const data = await Obe.findOne({
        where: { id: obeId },
        include: [
            { model: ProgramStudi, as: 'programStudi', attributes: ['id', 'kode', 'nama'] },
            { model: TahunKurikulum, as: 'tahunKurikulum', attributes: ['tahun'] },
            { model: CapaianPembelajaranLulusan, as: 'capaianPembelajaranLulusan', attributes: ['id', 'kode'] }
        ],
        order: [[{ model: CapaianPembelajaranLulusan, as: 'capaianPembelajaranLulusan' }, 'kode', 'ASC']]
    });

    if (!data) throw new Error("Data OBE tidak ditemukan");

    // Ambil MK berdasarkan Prodi
    const listMk = await MataKuliah.findAll({
        where: { siak_program_studi_id: data.programStudi.id },
        attributes: ['id', 'kode', 'nama', 'semester', ['total_sks', 'sks']],
        order: [['semester', 'ASC'], ['kode', 'ASC']]
    });

    // Ambil data centangan
    const cplIds = data.capaianPembelajaranLulusan.map(c => c.id);
    const existingPemetaan = await PemetaanCplMk.findAll({
        where: { siak_capaian_pembelajaran_lulusan_id: cplIds },
        attributes: ['siakCplId', 'siakMataKuliahId']
    });

    return {
        header: {
            kodeProdi: data.programStudi?.kode,
            namaProdi: `S1 - ${data.programStudi?.nama}`,
            tahunKurikulum: data.tahunKurikulum?.tahun
        },
        daftarCpl: data.capaianPembelajaranLulusan,
        daftarMk: listMk,
        dataPemetaan: existingPemetaan.map(p => ({
            cplId: p.siakCplId,
            mkId: p.siakMataKuliahId
        }))
    };
};

// SAVE Matriks CPL -> MK (POST)
export const saveMatriksPemetaanCplMk = async (obeId, dataPemetaan) => {
    const { CapaianPembelajaranLulusan, PemetaanCplMk, sequelize } = models;
    const transaction = await sequelize.transaction();

    try {
        const cpls = await CapaianPembelajaranLulusan.findAll({ where: { siak_obe_id: obeId }, attributes: ['id'] });
        const cplIds = cpls.map(c => c.id);

        // Hapus pemetaan lama untuk CPL di OBE ini
        await PemetaanCplMk.destroy({ 
            where: { siak_capaian_pembelajaran_lulusan_id: cplIds }, 
            transaction 
        });

        // Masukkan yang baru dari Postman/UI
        const payload = dataPemetaan.map(item => ({
            siakMataKuliahId: item.mkId,
            siakCplId: item.cplId
        }));

        if (payload.length > 0) {
            await PemetaanCplMk.bulkCreate(payload, { transaction });
        }

        await transaction.commit();
        return true;
    } catch (error) {
        await transaction.rollback();
        throw new Error(error.message);
    }
};