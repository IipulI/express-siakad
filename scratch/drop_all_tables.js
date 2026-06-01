import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function resetDatabase() {
    const client = new Client({
        user: process.env.DB_USER_DEV,
        password: process.env.DB_PASSWORD_DEV,
        database: process.env.DB_NAME_DEV,
        host: process.env.DB_HOST_DEV,
        port: process.env.DB_PORT_DEV,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to database successfully. Resetting schema...');
        
        // Drop the public schema and recreate it to clean all tables and types
        await client.query('DROP SCHEMA public CASCADE');
        await client.query('CREATE SCHEMA public');
        await client.query('GRANT ALL ON SCHEMA public TO public');
        
        console.log('Database schema successfully reset!');
    } catch (err) {
        console.error('Error resetting database:', err);
    } finally {
        await client.end();
    }
}

resetDatabase();
