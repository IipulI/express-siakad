import db from '../models/index.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSql() {
    try {
        await db.sequelize.authenticate();
        console.log('Connected to DB.');
        
        const sqlPath = path.join(__dirname, 'insert_data.sql');
        const sqlText = await fs.readFile(sqlPath, 'utf-8');
        
        // Remove all comments and split by semicolon safely
        const cleanSql = sqlText
            .split('\n')
            .map(line => {
                const commentIdx = line.indexOf('--');
                if (commentIdx !== -1) {
                    return line.substring(0, commentIdx);
                }
                return line;
            })
            .join('\n');
            
        const queries = cleanSql
            .split(';')
            .map(q => q.trim())
            .filter(q => q.length > 0);
            
        console.log(`Executing ${queries.length} SQL queries...`);
        
        for (let i = 0; i < queries.length; i++) {
            const query = queries[i];
            try {
                await db.sequelize.query(query);
            } catch (err) {
                console.error(`❌ Error executing query #${i + 1}:`);
                console.error(query);
                console.error(err.message);
                process.exit(1);
            }
        }
        
        console.log('🚀 All SQL queries executed successfully!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

runSql();
