require('dotenv').config();
const http = require('http');
const app = require('./app');
const { sequelize } = require('./models');
const { runMigrations } = require('./utils/migrator');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

async function startServer() {
  try {
    console.log('[SERVER] Authenticating database connection...');
    await sequelize.authenticate();
    console.log('[SERVER] Database authenticated successfully.');

    // Run schema synchronization/migration
    await runMigrations();

    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 PollCraft Polling & Survey Platform is running!`);
      console.log(`🌐 Local URL:     http://localhost:${PORT}`);
      console.log(`⚙️  Environment:   ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database:      ${sequelize.getDialect().toUpperCase()}`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('[FATAL SERVER ERROR]:', error);
    process.exit(1);
  }
}

// Graceful Shutdown
function gracefulShutdown(signal) {
  console.log(`\n[SERVER] Received ${signal}. Gracefully shutting down...`);
  server.close(async () => {
    try {
      await sequelize.close();
      console.log('[SERVER] Database connections closed. Process terminated.');
      process.exit(0);
    } catch (err) {
      console.error('[SERVER SHUTDOWN ERROR]:', err);
      process.exit(1);
    }
  });

  // Force close if graceful takes too long
  setTimeout(() => {
    console.error('[SERVER] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

if (require.main === module) {
  startServer();
}

module.exports = { server, startServer };
