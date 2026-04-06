import models from "../models/index.js";

const { TemplateEvaluasi, TahunKurikulum, ProgramStudi, sequelize } = models;

// ========================================================================
// 1. GET ALL: Menampilkan daftar template untuk Halaman Index (Tabel)
// ========================================================================
export const getListTemplate = async (filters = {}) => {
    try {
        const { kurikulumId, prodiId, jenisMk } = filters;
        const whereClause = {};

        if (kurikulumId) whereClause.siakTahunKurikulumId = kurikulumId;
        if (prodiId) whereClause.siakProgramStudiId = prodiId;
        if (jenisMk) whereClause.jenisMataKuliah = jenisMk;

        const listData = await TemplateEvaluasi.findAll({
            where: whereClause,
            attributes: [
                'siakTahunKurikulumId',
                'siakProgramStudiId',
                'jenisMataKuliah'
            ],
            include: [
                { 
                    model: TahunKurikulum, 
                    as: 'tahunKurikulum', 
                    attributes: ['id', 'tahun'] 
                },
                { 
                    model: ProgramStudi,  
                    as: 'programStudi', 
                    attributes: ['id', 'kode', 'nama'] 
                }
            ],
            group: [
                'siakTahunKurikulumId',
                'siakProgramStudiId',
                'jenisMataKuliah',
                'tahunKurikulum.id',
                'tahunKurikulum.tahun',
                'programStudi.id',
                'programStudi.kode',
                'programStudi.nama'
            ]
        });

        return listData.map(item => ({
            kurikulumId: item.siakTahunKurikulumId,
            tahunKurikulum: item.tahunKurikulum?.tahun || '-',
            prodiId: item.siakProgramStudiId,
            kodeProdi: item.programStudi?.kode || '-',
            namaProdi: item.programStudi?.nama || '-',
            jenisMataKuliah: item.jenisMataKuliah
        }));

    } catch (error) {
        throw new Error("Gagal mengambil daftar template: " + error.message);
    }
};

// ========================================================================
// 2. GET DETAIL: Menarik rincian header & komponen evaluasi
// ========================================================================
export const getDetailTemplate = async (kurikulumId, prodiId, jenisMk) => {
    try {
        const detailData = await TemplateEvaluasi.findAll({
            where: {
                siakTahunKurikulumId: kurikulumId,
                siakProgramStudiId: prodiId,
                jenisMataKuliah: jenisMk
            },
            include: [
                { 
                    model: TahunKurikulum, 
                    as: 'tahunKurikulum', 
                    attributes: ['tahun'] 
                },
                { 
                    model: ProgramStudi, 
                    as: 'programStudi', 
                    attributes: ['nama'] 
                }
            ],
            order: [['createdAt', 'ASC']]
        });

        if (!detailData || detailData.length === 0) {
            return null;
        }

        const headerInfo = {
            tahunKurikulum: detailData[0].tahunKurikulum?.tahun || '-',
            programStudi: detailData[0].programStudi?.nama || '-',
            jenisMataKuliah: detailData[0].jenisMataKuliah
        };

        const komponenList = detailData.map(item => ({
            id: item.id,
            komponenEvaluasi: item.metodeEvaluasi, 
            metodeEvaluasi: item.jenisEvaluasi,    
            bobot: parseFloat(item.bobot),
            
            // FIX: Kembalikan string opsi aslinya, bukan boolean lagi
            syaratLulus: item.syaratLulus || 'TIDAK_WAJIB', 
            // FIX: Tambahkan nilai minimum kalau ada
            nilaiMinimum: item.nilaiMinimum ? parseFloat(item.nilaiMinimum) : null,
            
            deskripsi: item.deskripsi || "-",
            deskripsiInggris: item.deskripsiInggris || "-"
        }));

        return {
            header: headerInfo,
            komponen: komponenList
        };

    } catch (error) {
        throw new Error("Gagal mengambil detail template: " + error.message);
    }
};

// ========================================================================
// 3. UPSERT (POST/PUT): Simpan atau Update Template
// ========================================================================
export const upsertTemplate = async (payload) => {
    const { siakTahunKurikulumId, siakProgramStudiId, jenisMataKuliah, komponenData } = payload;
    
    const trx = await sequelize.transaction();
    try {
        await TemplateEvaluasi.destroy({
            where: {
                siakTahunKurikulumId,
                siakProgramStudiId,
                jenisMataKuliah
            },
            transaction: trx,
            force: true 
        });

        if (komponenData && komponenData.length > 0) {
            const dataToInsert = komponenData.map(item => ({
                siakTahunKurikulumId,
                siakProgramStudiId,
                jenisMataKuliah,
                metodeEvaluasi: item.metodeEvaluasi,
                jenisEvaluasi: item.jenisEvaluasi,
                bobot: item.bobot,
                
                // FIX: Ubah ke string dan tangkap nilaiMinimum
                syaratLulus: item.syaratLulus || 'TIDAK_WAJIB', 
                nilaiMinimum: item.nilaiMinimum || null,
                
                deskripsi: item.deskripsi || null,
                deskripsiInggris: item.deskripsiInggris || null
            }));

            await TemplateEvaluasi.bulkCreate(dataToInsert, { transaction: trx });
        }

        await trx.commit();
        return true;
    } catch (error) {
        await trx.rollback();
        throw new Error("Gagal menyimpan template evaluasi: " + error.message);
    }
};

// ========================================================================
// 4. DELETE: Hapus Template Total
// ========================================================================
export const deleteTemplate = async (kurikulumId, prodiId, jenisMk) => {
    try {
        const deletedRows = await TemplateEvaluasi.destroy({
            where: {
                siakTahunKurikulumId: kurikulumId,
                siakProgramStudiId: prodiId,
                jenisMataKuliah: jenisMk
            }
        });
        return deletedRows;
    } catch (error) {
        throw new Error("Gagal menghapus template evaluasi: " + error.message);
    }
};