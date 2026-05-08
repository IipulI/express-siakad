import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Sequelize, DataTypes } from 'sequelize';
import process from 'process';

// Import konfigurasi JS yang baru dibuat
import dbConfig from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);

// Ambil environment, default ke production sesuai kode Anda sebelumnya
const env = process.env.NODE_ENV || 'production';

// Pilih konfigurasi berdasarkan environment aktif
const config = dbConfig[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
    // Inisialisasi Sequelize dengan konfigurasi dari database.js
    sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Baca semua file model di direktori ini
const files = await fs.readdir(__dirname);

const modelFiles = files.filter(file => {
    return (
        file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-10) === '.models.js' &&
        file.indexOf('.test.js') === -1
    );
});

// Import dan inisialisasi setiap model secara asinkron
for (const file of modelFiles) {
    const filePath = path.join(__dirname, file);
    const module = await import(pathToFileURL(filePath));

    // Pastikan untuk meneruskan DataTypes dari import Sequelize di atas
    const model = module.default(sequelize, DataTypes);
    db[model.name] = model;
}

// Atur relasi antar tabel (associations)
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;