import db from './models/index.js';

(async () => {
    try {
        await db.NilaiEvaluasiMahasiswa.bulkCreate([{
            siakRincianKrsMahasiswaId: "019de047-b467-7365-8361-3a1f09fc6430",
            siakKomposisiNilaiId: "019de035-f8ca-7009-87cf-e3ca79f8649a",
            skor: 100000
        }]);
    } catch (e) {
        console.error("ERROR NAME:", e.name);
        console.error("ERROR MSG:", e.message);
    }
    process.exit(0);
})();
