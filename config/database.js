// import { Sequelize } from 'sequelize';
// import dotenv from 'dotenv';

// dotenv.config();

// const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_DIALECT } = process.env;

// export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
//     host: DB_HOST,
//     dialect: DB_DIALECT,
//     logging: true,

//     timezone: '+07:00',
// });


import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_DIALECT } = process.env;

export const sequelize = new Sequelize(
    DB_NAME || 'db_siakad_uika',       // Beri nilai cadangan nama DB
    DB_USER || 'postgres',             // Beri nilai cadangan user DB
    DB_PASSWORD || 'password_kamu',    // Ganti dengan password Postgres di Mac-mu
    {
        host: DB_HOST || '127.0.0.1',
        dialect: DB_DIALECT || 'postgres', // <--- INI SABUK PENGAMANNYA
        logging: true,
        timezone: '+07:00',
    }
);