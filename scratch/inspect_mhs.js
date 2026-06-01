import db from '../models/index.js';

async function inspectMhs() {
    try {
        await db.sequelize.authenticate();
        console.log('Connected.');
        
        const [columns] = await db.sequelize.query(
            `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'siak_mahasiswa'`
        );
        
        console.log('Columns of siak_mahasiswa in DB:');
        for (const col of columns) {
            console.log(`- ${col.column_name} (${col.data_type})`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspectMhs();
