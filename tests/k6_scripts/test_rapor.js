import db from './models/index.js';
import * as penilaianService from './services/penilaian.service.js';

(async () => {
    try {
        const krsId = "019de047-b467-7365-8361-3a1f09fc6430";
        const rapor = await penilaianService.getRaporOBEMahasiswa(krsId);
        console.log("RAPOR:", JSON.stringify(rapor, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
})();
