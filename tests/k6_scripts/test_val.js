import db from './models/index.js';

(async () => {
    try {
        await db.NilaiEvaluasiMahasiswa.build({
            siakRincianKrsMahasiswaId: "not-a-uuid",
            siakKomposisiNilaiId: "not-a-uuid",
            skor: 85
        }).validate();
        console.log("Valid!");
    } catch (e) {
        console.error("ERROR NAME:", e.name);
        console.error("ERROR MSG:", e.message);
    }
    process.exit(0);
})();
