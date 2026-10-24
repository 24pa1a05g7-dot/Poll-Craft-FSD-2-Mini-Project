const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

let sequelize;

if (isTest) {
  // Isolated in-memory SQLite runner for zero-side-effect automated testing
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  });
} else if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
  const dbUrl = process.env.DATABASE_URL.trim();
  const isSslRequired = process.env.DB_SSL === 'true' || 
                        isProduction || 
                        dbUrl.includes('sslmode=require') || 
                        dbUrl.includes('supabase.co') ||
                        dbUrl.includes('pooler.supabase.com');

  sequelize = new Sequelize(dbUrl, {
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
  const isSslRequired = process.env.DB_SSL === 'true';
  sequelize = new Sequelize(
    process.env.DB_NAME || 'pollcraft_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
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
  // Safe local development SQLite fallback
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
