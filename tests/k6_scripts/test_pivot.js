import db from './models/index.js';
import * as penilaianService from './services/penilaian.service.js';

(async () => {
    try {
        const payload = [
            {
                "key": "tugas_individu_kelompok",
                "persentase": 15.00,
                "namaKomponen": "TUGAS INDIVIDU/KELOMPOK",
                "mappingCpmk": [
                    {
                        "siakCapaianMataKuliahId": "019ddf5d-1537-76d4-9239-2f764a4b0ad9",
                        "bobot": 4.28
                    }
                ]
            }
        ];
        // id_mk yang kita pakai random aja (biar unik)
        const mkId = "019de035-f8ca-7009-87cf-e3ca79f8649a"; 
        
        await penilaianService.createKomposisiEvaluasi(mkId, payload);
        
        const pivot = await db.PemetaanKomposisiCpmk.findAll();
        console.log("PIVOT DATA:", JSON.stringify(pivot, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
})();
