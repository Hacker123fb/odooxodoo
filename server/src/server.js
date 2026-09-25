import app from './app.js';
import { env } from './config/env.js';
import pool, { testConnection } from './config/db.js';
import { dbInit } from './config/dbInit.js';
import { pgDbInit } from './config/pgDbInit.js';

/**
 * Keep-alive self-ping worker
 * Pings the lightweight health endpoint every 5 minutes to keep the backend permanently awake.
 */
const startKeepAlive = () => {
  const baseUrl = process.env.RENDER_EXTERNAL_URL || 'https://transitops-backend-nkkb.onrender.com';
  const targetUrl = process.env.PING_URL || `${baseUrl}/api/v1/health/ping`;
  
  const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  console.log(`[KEEPALIVE] Keep-alive self-ping worker active. Target: ${targetUrl} (every 5m)`);

  // Execute initial ping after 15 seconds to prime the route
  setTimeout(async () => {
    try {
      const res = await fetch(targetUrl);
      console.log(`[KEEPALIVE] Initial keep-alive ping: HTTP ${res.status}`);
    } catch (err) {
      console.warn(`[KEEPALIVE] Initial keep-alive ping note: ${err.message}`);
    }
  }, 15000);

  // Recurring 5-minute ping interval
  setInterval(async () => {
    try {
      const res = await fetch(targetUrl);
      console.log(`[KEEPALIVE] 5-minute keep-alive ping to ${targetUrl} - HTTP ${res.status}`);
    } catch (err) {
      console.warn(`[KEEPALIVE] 5-minute keep-alive ping warning: ${err.message}`);
    }
  }, INTERVAL_MS);
};

/**
 * Boots the TransitOps backend server
 */
const startServer = async () => {
  console.log('[BOOT] Starting TransitOps Backend Server...');

  // Test connection to the database (PostgreSQL or MySQL)
  const isDbConnected = await testConnection();
  if (!isDbConnected) {
    console.warn('[BOOT] [WARNING] Proceeding without verified database connectivity. Make sure DB is running.');
  } else {
    // Run database seeding/initialization sequence
    if (pool.isPostgres) {
      await pgDbInit();
    } else {
      await dbInit();
    }
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
