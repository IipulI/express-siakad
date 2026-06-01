import db from '../models/index.js';

async function inspectDb() {
    try {
        await db.sequelize.authenticate();
        console.log('Connected.');
        
        const rawRes = await db.sequelize.query(
            `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
        );
        
        console.log('Raw output:', JSON.stringify(rawRes, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspectDb();
