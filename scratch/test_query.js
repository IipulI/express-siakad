import db from '../models/index.js';
import { getWeeklyScheduleStudent } from '../services/jadwal-akademik.service.js';

const { Mahasiswa } = db;

async function testQuery() {
    try {
        await db.sequelize.authenticate();
        console.log('Connected.');
        
        console.log('Querying Mahasiswa...');
        const m = await Mahasiswa.findOne({
            where: { npm: '221106043033' }
        });
        
        console.log('Querying Weekly Schedule...');
        const res = await getWeeklyScheduleStudent(m.id);
        console.log('Weekly Schedule Succeeded!', JSON.stringify(res, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('❌ Query failed with error:');
        console.error(err);
        process.exit(1);
    }
}

testQuery();
