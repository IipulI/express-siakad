import db from './models/index.js';

(async () => {
    try {
        await db.NilaiEvaluasiMahasiswa.create({
            siakRincianKrsMahasiswaId: null,
            siakKomposisiNilaiId: null,
            skor: 'abc'
        });
    } catch (e) {
        console.error("ERROR NAME:", e.name);
        console.error("ERROR MSG:", e.message);
    }
    process.exit(0);
})();
