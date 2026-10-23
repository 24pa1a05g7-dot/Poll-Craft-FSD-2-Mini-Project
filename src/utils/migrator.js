const { sequelize } = require('../models');

async function runMigrations() {
  console.log('[MIGRATION] Checking database schema and synchronizing models...');
  try {
    await sequelize.authenticate();
    console.log('[MIGRATION] Database connection authenticated successfully.');
    // In production and dev, ensure all tables, indexes, foreign keys are created
    await sequelize.sync({ alter: false });
    console.log('[MIGRATION] All database tables and associations migrated successfully.');
  } catch (error) {
    console.error('[MIGRATION ERROR]:', error);
    throw error;
  }
}

module.exports = { runMigrations };
