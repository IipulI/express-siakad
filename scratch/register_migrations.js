import db from '../models/index.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, '../migrations');

async function registerMigrations() {
    try {
        console.log('📝 Registering migrations in SequelizeMeta...');
        await db.sequelize.authenticate();
        
        // Ensure SequelizeMeta table exists
        await db.sequelize.queryInterface.createTable('SequelizeMeta', {
            name: {
                type: db.Sequelize.STRING,
                primaryKey: true,
                allowNull: false
            }
        });

        // Read migration files
        const files = await fs.readdir(migrationsDir);
        const migrationFiles = files
            .filter(f => f.endsWith('.js') || f.endsWith('.cjs'))
            .sort();

        console.log(`Found ${migrationFiles.length} migration files to register.`);

        for (const file of migrationFiles) {
            // Check if already registered
            const [existing] = await db.sequelize.query(
                `SELECT name FROM "SequelizeMeta" WHERE name = :name`,
                {
                    replacements: { name: file },
                    type: db.sequelize.QueryTypes.SELECT
                }
            );

            if (!existing) {
                await db.sequelize.query(
                    `INSERT INTO "SequelizeMeta" (name) VALUES (:name)`,
                    {
                        replacements: { name: file }
                    }
                );
                console.log(`✅ Registered: ${file}`);
            } else {
                console.log(`ℹ️ Already registered: ${file}`);
            }
        }

        console.log('🚀 All migrations registered successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to register migrations:', error);
        process.exit(1);
    }
}

registerMigrations();
