const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

let sequelize;

if (isTest) {
  // Use in-memory SQLite for high-speed, isolated automated testing
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  });
} else if (process.env.DATABASE_URL) {
  // Cloud PostgreSQL connection (Render, Neon, Supabase, etc.)
  const isSslRequired = process.env.DB_SSL === 'true' || isProduction || process.env.DATABASE_URL.includes('sslmode=require');
  
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: isProduction ? false : (msg) => console.log(`[SQL]: ${msg}`),
    dialectOptions: isSslRequired ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {},
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else if (process.env.DB_DIALECT === 'postgres') {
  // Local or custom PostgreSQL configuration
  const isSslRequired = process.env.DB_SSL === 'true';
  sequelize = new Sequelize(
    process.env.DB_NAME || 'poll_survey_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: isProduction ? false : (msg) => console.log(`[SQL]: ${msg}`),
      dialectOptions: isSslRequired ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      } : {},
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
} else {
  // Standalone development SQLite mode
  const dataDir = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const storagePath = process.env.DB_STORAGE 
    ? path.resolve(process.env.DB_STORAGE) 
    : path.join(dataDir, 'dev.sqlite');

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false
  });
}

module.exports = { sequelize };
