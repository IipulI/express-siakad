import db from './models/index.js';

(async () => {
    try {
        const p = await db.PemetaanKomposisiCpmk.findAll();
        console.log("PIVOT DATA:", JSON.stringify(p, null, 2));
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
})();
