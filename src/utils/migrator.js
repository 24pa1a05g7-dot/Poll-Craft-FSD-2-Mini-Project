const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');
const { sequelize } = require('../models');

async function runMigrations() {
  console.log('[MIGRATION] Checking database schema and executing pending migrations...');
  try {
    await sequelize.authenticate();
    const queryInterface = sequelize.getQueryInterface();

    // 1. Ensure SequelizeMeta tracking table exists
    const tableExists = await queryInterface.tableExists('SequelizeMeta');
    if (!tableExists) {
      await queryInterface.createTable('SequelizeMeta', {
        name: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true,
          primaryKey: true
        }
      });
      console.log('[MIGRATION] Initialized SequelizeMeta tracking table.');
    }

    // 2. Query executed migrations
    const executedRows = await sequelize.query(
      'SELECT name FROM "SequelizeMeta" ORDER BY name ASC',
      { type: sequelize.QueryTypes.SELECT }
    ).catch(async () => {
      // In SQLite or case-sensitive engines
      return await sequelize.query(
        'SELECT name FROM SequelizeMeta ORDER BY name ASC',
        { type: sequelize.QueryTypes.SELECT }
      );
    });

    const executedNames = new Set(executedRows.map(r => r.name));

    // 3. Read migration files from src/migrations
    const migrationsDir = path.resolve(__dirname, '../migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('[MIGRATION] No migrations directory found.');
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.js'))
      .sort();

    let appliedCount = 0;

    for (const file of files) {
      if (!executedNames.has(file)) {
        console.log(`[MIGRATION] Executing migration: ${file}...`);
        const migration = require(path.join(migrationsDir, file));
        
        try {
          await migration.up(queryInterface, Sequelize);
          await sequelize.query(
            'INSERT INTO "SequelizeMeta" (name) VALUES (:name)',
            { replacements: { name: file } }
          ).catch(async () => {
            await sequelize.query(
              'INSERT INTO SequelizeMeta (name) VALUES (:name)',
              { replacements: { name: file } }
            );
          });
          console.log(`[MIGRATION] Completed: ${file}`);
          appliedCount++;
        } catch (migError) {
          // If table already exists, register it in SequelizeMeta to prevent future blocking
          if (migError.message && (migError.message.includes('already exists') || migError.original?.code === '42P07')) {
            console.log(`[MIGRATION] Table already exists for ${file}. Marking as recorded.`);
            await sequelize.query(
              'INSERT INTO "SequelizeMeta" (name) VALUES (:name)',
              { replacements: { name: file } }
            ).catch(async () => {
              await sequelize.query(
                'INSERT INTO SequelizeMeta (name) VALUES (:name)',
                { replacements: { name: file } }
              );
            });
            appliedCount++;
          } else {
            console.error(`[MIGRATION ERROR in ${file}]:`, migError.message);
            throw migError;
          }
        }
      }
    }

    if (appliedCount === 0) {
      console.log('[MIGRATION] Database schema is up to date. No pending migrations.');
    } else {
      console.log(`[MIGRATION] Successfully executed ${appliedCount} pending migration(s).`);
    }
  } catch (error) {
    console.error('[MIGRATION SYSTEM ERROR]:', error.message);
    throw error;
  }
}

module.exports = { runMigrations };
