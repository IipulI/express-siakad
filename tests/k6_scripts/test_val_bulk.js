import db from './models/index.js';

(async () => {
    try {
        await db.NilaiEvaluasiMahasiswa.bulkCreate([{
            siakRincianKrsMahasiswaId: "not-a-uuid",
            siakKomposisiNilaiId: "not-a-uuid",
            skor: 85
        }]);
    } catch (e) {
        console.error("ERROR NAME:", e.name);
        console.error("ERROR MSG:", e.message);
    }
    process.exit(0);
})();
