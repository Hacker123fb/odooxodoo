import app from './app.js';
import { env } from './config/env.js';
import { testConnection } from './config/db.js';
import { dbInit } from './config/dbInit.js';

/**
 * Boots the TransitOps backend server
 */
const startServer = async () => {
  console.log('[BOOT] Starting TransitOps Backend Server...');

  // Test connection to the MySQL database
  const isDbConnected = await testConnection();
  if (!isDbConnected) {
    console.warn('[BOOT] [WARNING] Proceeding without verified database connectivity. Make sure MySQL is running.');
  } else {
    // Run database seeding/initialization sequence
    await dbInit();
  }

  // Start HTTP listener
  app.listen(env.port, () => {
    console.log(`[BOOT] Server successfully started in [${env.nodeEnv}] mode`);
    console.log(`[BOOT] Listening on port: ${env.port}`);
    console.log(`[BOOT] Health Endpoint: http://localhost:${env.port}/api/v1/health`);
  });
};

startServer().catch((err) => {
  console.error('[BOOT] [FATAL] Server boot failed:', err.message);
  process.exit(1);
});
