require('dotenv').config();
const { runMigrations } = require('../src/utils/migrator');
const { sequelize } = require('../src/models');

(async () => {
  try {
    console.log('[MIGRATE] Running database migrations...');
    await runMigrations();
    console.log('[MIGRATE] Migrations completed successfully.');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('[MIGRATE ERROR] Migration failed:', error);
    process.exit(1);
  }
})();
