import db from './models/index.js';
import * as penilaianService from './services/penilaian.service.js';

(async () => {
    try {
        const krsId = "019de047-b467-7365-8361-3a1f09fc6430";
        await penilaianService.hitungNilaiAkhir(krsId);
        
        const data = await db.NilaiCpmkMahasiswa.findAll();
        console.log('NILAI CPMK DATA:', JSON.stringify(data, null, 2));
    } catch(e) {
        console.error("ERROR:", e.name, e.message);
    }
    process.exit(0);
})();
