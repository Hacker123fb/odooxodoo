import app from './app.js';
import { env } from './config/env.js';
import { testConnection } from './config/db.js';
import { dbInit } from './config/dbInit.js';

/**
 * Keep-alive self-ping worker
 * Pings the health endpoint every 14 minutes to prevent Render free-tier idle spin-down.
 */
const startKeepAlive = () => {
  const targetUrl = process.env.PING_URL || 
    (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/api/v1/health` : 'https://transitops-backend-nkkb.onrender.com/api/v1/health');
  
  const INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

  console.log(`[KEEPALIVE] Keep-alive worker registered. Target: ${targetUrl} (every 14m)`);

  setInterval(async () => {
    try {
      const res = await fetch(targetUrl);
      console.log(`[KEEPALIVE] Keep-alive ping sent to ${targetUrl} - HTTP ${res.status}`);
    } catch (err) {
      console.warn(`[KEEPALIVE] Keep-alive ping warning: ${err.message}`);
    }
  }, INTERVAL_MS);
};

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

    // Start keep-alive worker to keep the service permanently awake
    startKeepAlive();
  });
};

startServer().catch((err) => {
  console.error('[BOOT] [FATAL] Server boot failed:', err.message);
  process.exit(1);
});
