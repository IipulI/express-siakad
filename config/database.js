import dotenv from 'dotenv';
import process from 'process';

dotenv.config();

const config = {
    development: {
        username: process.env.DB_USER_DEV || 'postgres',
        password: process.env.DB_PASSWORD_DEV || '123456',
        database: process.env.DB_NAME_DEV || 'asd',
        host: process.env.DB_HOST_DEV || '127.0.0.1',
        port: process.env.DB_PORT_DEV || 5432,
        dialect: process.env.DB_DIALECT_DEV || 'postgres',
        logging: true,
        timezone: '+07:00',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    },
    test: {
        username: process.env.DB_USER_TEST || 'postgres',
        password: process.env.DB_PASSWORD_TEST || '123456',
        database: process.env.DB_NAME_TEST || 'siakad_test',
        host: process.env.DB_HOST_TEST || '127.0.0.1',
        port: process.env.DB_PORT_TEST || 5432,
        dialect: process.env.DB_DIALECT_TEST || 'postgres',
        logging: false,
    },
    production: {
        username: process.env.DB_USER_PROD,
        password: process.env.DB_PASSWORD_PROD,
        database: process.env.DB_NAME_PROD || 'siakad_prod',
        host: process.env.DB_HOST_PROD,
        port: process.env.DB_PORT_PROD || 5432,
        dialect: process.env.DB_DIALECT_PROD || 'postgres',
        logging: true,
        timezone: 'Asia/Jakarta',
        dialectOptions: {
            useUTC: false,
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    }
};

export default config;