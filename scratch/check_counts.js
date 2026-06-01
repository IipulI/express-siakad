import db from '../models/index.js';

async function checkCounts() {
    try {
        await db.sequelize.authenticate();
        
        // Check siak_mahasiswa count
        const [mhsCount] = await db.sequelize.query('SELECT COUNT(*) as count FROM "siak_mahasiswa"');
        // Check siak_user count
        const [userCount] = await db.sequelize.query('SELECT COUNT(*) as count FROM "siak_user"');
        // Check siak_krs_mahasiswa count
        const [krsCount] = await db.sequelize.query('SELECT COUNT(*) as count FROM "siak_krs_mahasiswa"');
        // Check siak_mata_kuliah count
        const [mkCount] = await db.sequelize.query('SELECT COUNT(*) as count FROM "siak_mata_kuliah"');

        console.log('📊 DATA COUNTS IN express-siakad DATABASE (Neon):');
        console.log(`- Mahasiswa: ${mhsCount[0].count}`);
        console.log(`- Users (Students + Parents): ${userCount[0].count}`);
        console.log(`- KRS Records: ${krsCount[0].count}`);
        console.log(`- Mata Kuliah: ${mkCount[0].count}`);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCounts();
