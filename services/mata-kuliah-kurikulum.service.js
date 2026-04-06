import models from '../models/index.js';

// --- 1. REKAP DISTRIBUSI SKS (Halaman 1 / Index) ---
export const getRekapDistribusiSks = async (prodiId) => {
    const { TahunKurikulum, MataKuliah } = models;

    const listTahunKurikulum = await TahunKurikulum.findAll({
        order: [['tahun', 'DESC']]
    });

    const result = await Promise.all(listTahunKurikulum.map(async (kurikulum) => {
        // Ambil semua MK di prodi dan tahun kurikulum ini
        const daftarMk = await MataKuliah.findAll({
            where: {
                // Gunakan camelCase sesuai Model Abang biar aman
                siakProgramStudiId: prodiId,
                siakTahunKurikulumId: kurikulum.id
            },
            // Tarik kolomnya pakai camelCase juga
            attributes: ['id', 'opsiWajib', 'totalSks'] 
        });

        let sksWajib = 0;
        let sksPilihan = 0;

        // Kalkulasi SKS
        daftarMk.forEach(mk => {
            // FIX: Panggil propertinya pakai camelCase dan pastikan di-parse ke angka
            const jumlahSks = parseInt(mk.totalSks) || 0;
            
            // Cek opsi wajib (boolean true/false)
            if (mk.opsiWajib === true) {
                sksWajib += jumlahSks;
            } else {
                sksPilihan += jumlahSks;
            }
        });

        return {
            tahunKurikulumId: kurikulum.id,
            tahun: kurikulum.tahun,
            keterangan: kurikulum.keterangan,
            sksWajib: sksWajib,
            sksPilihan: sksPilihan,
            totalSks: sksWajib + sksPilihan
        };
    }));

    return result;
};

// --- 2. DAFTAR MATA KULIAH PER SEMESTER (Halaman Detail MK) ---
export const getMataKuliahPerSemester = async (prodiId, tahunKurikulumId) => {
    const { MataKuliah } = models;

    const listMk = await MataKuliah.findAll({
        where: {
            siak_program_studi_id: prodiId,
            siak_tahun_kurikulum_id: tahunKurikulumId
        },
        order: [
            ['semester', 'ASC'], // Urutkan berdasarkan semester terkecil (1, 2, 3...)
            ['kode', 'ASC']      // Lalu urutkan berdasarkan kode MK (A-Z)
        ]
    });

    return listMk;
};