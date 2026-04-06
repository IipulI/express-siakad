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
                where: { siakObeId : obeId },
                transaction: trx
            })
        })
    }
    catch (error) {
        console.log(error)
        throw new Error(error)
    }
}

export const createProfilLulusan = async (obeId, profilLulusanData) => {
    try {
        await sequelize.transaction(async (trx) => {
            await _cekObe(obeId, trx)

            await ProfilLulusan.create({
                siakObeId: obeId,
                kode: profilLulusanData.kode,
                profil: profilLulusanData.profil,
                profesi: profilLulusanData.profesi,
                deskripsi: profilLulusanData.deskripsi,
            }, {
                transaction: trx
            })
        })

        return true
    }
    catch (error) {
        console.error(error)
        throw new Error(error.message)
    }
}

export const updateProfilLulusan = async (obeId, plId, profilLulusanData) => {
    try {
        await sequelize.transaction(async (trx) => {
            await _cekObe(obeId, trx)

            await _cekPl(plId, trx)

            await ProfilLulusan.update(
                {
                    kode: profilLulusanData.kode,
                    profil: profilLulusanData.profil,
                    profesi: profilLulusanData.profesi,
                    deskripsi: profilLulusanData.deskripsi,
                },
                {
                    where: { id: plId },
                    transaction: trx
                }
            )
        })

        return true
    }
    catch (error) {
        console.error(error)
        throw new Error(error.message)
    }
}

export const deleteProfilLulusan = async (obeId, plId) => {
    try {
        await sequelize.transaction(async (trx) => {
            await _cekObe(obeId, trx)
            await _cekPl(plId, trx)

            await PemetaanPlCpl.destroy({
                where: {
                    siakProfilLulusanId : plId,
                    transaction: trx
                }
            })

            await ProfilLulusan.destroy({
                where: {
                    siakProfilLulusanId : plId,
                    transaction: trx
                }
            })
        })

        return true
    }
    catch (error) {
        console.error(error)
        throw new Error(error.message)
    }
}

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
                    siakProfilLulusanId: item,
                    siakCapaianPembelajaranLulusanId: cplId
                }))

                promises.push(
                    PemetaanPlCpl.bulkCreate(recordToCreate, {transaction: trx})
                );
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

export const getCapaianMataKuliah = async (obeId, mataKuliaId) => {
    return await sequelize.transaction(async (trx) => {
        const dataCpmkRaw = await CapaianMataKuliah.findAll({
            attributes: {
                exclude: ['createdAt', 'updatedAt', 'deletedAt'],
            },
            where: { siakObeId: obeId, siakMataKuliahId: mataKuliaId },
            include: {
                attributes: [],
                model: PemetaanCplCpmk,
                as: "pemetaanCplCpmk",
                include : {
                    attributes : [
                        'id', 'kode'
                    ],
                    model: CapaianPembelajaranLulusan,
                    as: "capaianPembelajaranLulusan"
                }
            },

            transaction: trx,
            raw: true
        })

        // Mapping result json
        const groupedMap = {};
        for (const item of dataCpmkRaw) {
            const cpmkId = item.id;

            if (!groupedMap[cpmkId]) {
                groupedMap[cpmkId] = {
                    id: item.id,
                    siakObeId: item.siakObeId,
                    kode: item.kode,
                    deskripsi: item.deskripsi,
                    capaianPembelajaranLulusan: [],
                };
            }

            const cplId = item['pemetaanCplCpmk.capaianPembelajaranLulusan.id'];
            if (cplId) {
                groupedMap[cpmkId].capaianPembelajaranLulusan.push({
                    id: cplId,
                    kode: item['pemetaanCplCpmk.capaianPembelajaranLulusan.kode'],
                });
            }
        }

        return Object.values(groupedMap);
    })
}

export const createCapaianMataKuliah = async (obeId, mataKuliahId, capaianMataKuliahData) => {
    try {
        await sequelize.transaction(async (trx) => {
            // check data obe apakah ada (sql)
            await _cekObe(obeId, trx)

            // check data mata kuliah apakah ada (sql)
            await _cekMK(mataKuliahId, trx)

            const cpmk = await CapaianMataKuliah.create({
                siakObeId: obeId,
                siakMataKuliahId: mataKuliahId,
                kode: capaianMataKuliahData.kode,
                deskripsi: capaianMataKuliahData.deskripsi,
            }, {
                transaction: trx,
            })

            const pemetaanCplCpmk = capaianMataKuliahData.capaianPembelajaranLulusan.map(items => {
                return {
                    siakCapaianPembelajaranLulusanId: items,
                    siakCapaianMataKuliahId: cpmk.id,
                }
            })

            await PemetaanCplCpmk.bulkCreate(pemetaanCplCpmk, {
                transaction: trx,
            })
        })

        return true
    }
    catch(error) {
        console.error(error)
        throw new Error(error.message)
    }
}

export const updateCapaianMataKuliah = async (obeId, mataKuliahId, cpmkId, capaianMataKuliahData) => {
    try {
        const capaianPembelajaranLulusanId = capaianMataKuliahData.capaianPembelajaranLulusanIds;

        await sequelize.transaction(async (trx) => {
            await _cekObe(obeId, trx)
            await _cekMK(mataKuliahId, trx)
            await _cekCpmk(cpmkId, trx)

            // --- MAIN QUERY ---
            // Get data cpl yang ada di pivot
            const existingCpl = await PemetaanCplCpmk.findAll({
                attributes: [
                    'id',
                    'siakCapaianPembelajaranLulusanId',
                    'deletedAt'
                ],
                where: { siakCapaianMataKuliahId : cpmkId },
                raw: true,
                paranoid: false,
                transaction: trx,
            })

            // Get existing cpl id for mapping
            const existingCplMap = new Map();
            existingCpl.forEach(item => {
                existingCplMap.set(item.siakCapaianPembelajaranLulusanId, { isDeleted: !!item.deletedAt });
            })

            // preparasi untuk push promise
            const newCplIdSet = new Set(capaianPembelajaranLulusanId)
            const toInsert = [];
            const toRestore = [];
            const toDelete = [];
            const allIds = new Set([
                ...existingCplMap.keys(),
                ...newCplIdSet
            ])

            // eksekusi logic untuk push promise
            for(const cplId of allIds) {
                const existInDatabase = existingCplMap.has(cplId);
                const isInsertedId = newCplIdSet.has(cplId);

                // Id yang request tapi tidak ada di database
                if(isInsertedId && !existInDatabase){
                    toInsert.push(cplId);
                }
                // Id yang request dan ada di database,
                else if (isInsertedId && existInDatabase){
                    // cek apakah Id nya sudah dihapus
                    if(existingCplMap.get(cplId).isDeleted){
                        toRestore.push(cplId);
                    }
                }
                // Id yang tidak ada di request tapi ada di database,
                else if (!isInsertedId && existInDatabase){
                    // cek apakah sudah dihapus
                    if(!existingCplMap.get(cplId).isDeleted){
                        toDelete.push(cplId);
                    }
                }
            }

            // Executing query
            const promises = [];
            if(toInsert.length > 0){
                const recordToCreate = toInsert.map(item => ({
                    siakCapaianMataKuliahId: cpmkId,
                    siakCapaianPembelajaranLulusan: item,
                }))

                promises.push(
                    PemetaanCplCpmk.bulkCreate(recordToCreate, {transaction: trx})
                )
            }
            if(toRestore.length > 0){
                promises.push(
                    pemetaanCplCpmk.restore({
                        where: {
                            siakCapaianMataKuliahId: cpmkId,
                            siakCapaianPembelajaranLulusanId: { [Op.in] : toRestore}
                        },
                        transaction: trx
                    })
                )
            }
            if(toDelete.length > 0){
                promises.push(
                    PemetaanCplCpmk.destroy({
                        where: {
                            siakCapaianMataKuliahId: cpmkId,
                            siakCapaianPembelajaranLulusanId: { [Op.in] : [...toDelete]}
                        },
                        transaction: trx
                    })
                )
            }

            await Promise.all(promises)
        })

        return true
    }
    catch(error) {
        console.log(error)
        throw new Error(error.message)
    }
}

export const deleteCapaianMataKuliah = async (obeId, cpmkId) => {
    try {
        await sequelize.transaction(async (trx) => {
            // cek data obe apakah ada (query raw sql)
            await _cekObe(obeId, trx)

            // cek data cpmk apakah ada (query raw sql)
            await _cekCpmk(cpmkId, trx)

            await PemetaanCplCpmk.destroy({
                where: { siakCapaianMataKuliahId: cpmkId },
                transaction: trx
            })

            await CapaianMataKuliah.destroy({
                where : { id: cpmkId },
                transaction: trx,
            })
        })

        return true
    }
    catch (error) {
        console.log(error);
        throw new Error(error.message)
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