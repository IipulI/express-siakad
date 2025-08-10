// models/index.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import Sequelize from 'sequelize';
import process from 'process';

// These are needed to properly get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
// We must dynamically import the JSON config file
const config = (await import('../config/config.json', { with: { type: 'json' } })).default[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Read all files in the current directory
const files = await fs.readdir(__dirname);

// Filter out non-JS files, the index file itself, and test files
const modelFiles = files.filter(file => {
    return (
        file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.js' &&
        file.indexOf('.test.js') === -1
    );
});

// Asynchronously import and initialize each model
for (const file of modelFiles) {
    const filePath = path.join(__dirname, file);
    // Convert the Windows path to a valid file URL before importing
    const module = await import(pathToFileURL(filePath));
    const model = module.default(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
}

// Set up associations
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;