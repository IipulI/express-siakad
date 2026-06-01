import db from '../models/index.js';

async function syncDatabase() {
    try {
        console.log('🔄 Starting database synchronization...');
        await db.sequelize.authenticate();
        console.log('✅ Database connection established.');
        
        await db.sequelize.sync({ force: true });
        console.log('🚀 All models synchronized and tables recreated successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to synchronize database:', error);
        process.exit(1);
    }
}

syncDatabase();
