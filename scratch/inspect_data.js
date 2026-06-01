import db from '../models/index.js';

async function inspectData() {
    try {
        await db.sequelize.authenticate();
        console.log('Connected.');
        
        const tables = [
            'siak_role',
            'siak_program_studi',
            'siak_periode_akademik',
            'siak_tahun_ajaran',
            'siak_tahun_kurikulum',
            'siak_status_mahasiswa',
            'siak_agama',
            'siak_suku'
        ];

        for (const t of tables) {
            const [rows] = await db.sequelize.query(`SELECT * FROM "${t}" LIMIT 5`);
            console.log(`Table: ${t}, Rows count: ${rows.length}`, rows);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspectData();
