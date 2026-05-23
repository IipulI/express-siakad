import { Sequelize } from 'sequelize';
import config from './config/config.js';

const dbConfig = config.development;
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  logging: false
});

async function run() {
  try {
    const obe = await sequelize.query('SELECT id FROM siak_obe LIMIT 1');
    const mk = await sequelize.query('SELECT id FROM siak_mata_kuliah_obe LIMIT 1');
    const krs = await sequelize.query('SELECT id FROM siak_krs_mahasiswa LIMIT 1');
    const mhs = await sequelize.query('SELECT id FROM siak_mahasiswa LIMIT 1');
    const cpl = await sequelize.query('SELECT id FROM siak_cpl LIMIT 1');
    
    console.log({
      obeId: obe[0][0]?.id || null,
      mataKuliahId: mk[0][0]?.id || null,
      krsId: krs[0][0]?.id || null,
      mhsId: mhs[0][0]?.id || null,
      cplId: cpl[0][0]?.id || null
    });
  } catch(e) { console.error(e); }
  process.exit(0);
}
run();
