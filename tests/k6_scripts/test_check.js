import db from './models/index.js';

(async () => {
    try {
        const krsId = "019de047-b467-7365-8361-3a1f09fc6430";
        const listNilai = await db.NilaiEvaluasiMahasiswa.findAll({
            where: { siakRincianKrsMahasiswaId: krsId },
            include: [{ model: db.KomposisiNilaiMataKuliah, as: 'komposisiNilai', paranoid: false }]
        });
        console.log(JSON.stringify(listNilai, null, 2));
    } catch(e) {
        console.error(e.name, e.message);
    }
    process.exit(0);
})();
